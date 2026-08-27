import prisma from "../config/prisma.js";

// Instance states that mean "this file's workflow is still live" -- a new
// instance can't be started while one of these already exists.
const ACTIVE_STATES = ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "PENDING_APPROVAL"];

const INSTANCE_INCLUDE = {
  template: { select: { id: true, name: true, code: true } },
  currentStep: true,
};

export const findActiveByFileId = (fileId) =>
  prisma.workflowInstance.findFirst({
    where: { fileId, state: { in: ACTIVE_STATES } },
    include: INSTANCE_INCLUDE,
    orderBy: { startedAt: "desc" },
  });

export const findById = (id) => prisma.workflowInstance.findUnique({ where: { id }, include: INSTANCE_INCLUDE });

/**
 * Starts a file's workflow: creates the instance on the template's first
 * step, logs the bootstrap WorkflowExecution (action REGISTER -- the file
 * entering the workflow, distinct from Phase 2's file-registration
 * business action of the same enum value), creates the first
 * FileAssignment, records the routing FileMovement, and flips the File
 * out of the plain REGISTERED state into IN_PROGRESS. All one transaction
 * -- a file is never left half-wired into a workflow.
 */
export const startInstance = ({ fileId, templateId, firstStepId, assignedToId, assignedDepartmentId, dueDate, performedById, remarks }) =>
  prisma.$transaction(async (tx) => {
    // Close out the registrar's "opening" assignment (see
    // file.repository.js#createFileWithAttachments) -- from here on the
    // workflow owns custody, so there must be exactly one isCurrent row.
    // updateMany, not update: a no-op if somehow none exists (e.g. a file
    // registered before this became the norm).
    await tx.fileAssignment.updateMany({
      where: { fileId, isCurrent: true },
      data: { isCurrent: false, status: "COMPLETED", completedAt: new Date() },
    });

    const instance = await tx.workflowInstance.create({
      data: { fileId, templateId, currentStepId: firstStepId, state: "IN_PROGRESS" },
    });

    const execution = await tx.workflowExecution.create({
      data: {
        instanceId: instance.id,
        stepId: firstStepId,
        action: "REGISTER",
        performedById,
        toUserId: assignedToId ?? null,
        remarks: remarks ?? null,
      },
    });

    const assignment = await tx.fileAssignment.create({
      data: {
        fileId,
        assignedToId: assignedToId ?? null,
        assignedDepartmentId: assignedDepartmentId ?? null,
        assignedById: performedById,
        workflowStepId: firstStepId,
        dueDate: dueDate ?? null,
        isCurrent: true,
      },
    });

    await tx.fileMovement.create({
      data: {
        fileId,
        // The person starting the workflow is the file's current holder
        // (the registrar) -- record them as the source so Movement History
        // reads "Registrar -> first step" instead of "- -> Unclaimed".
        fromUserId: performedById,
        toUserId: assignedToId ?? null,
        toDepartmentId: assignedDepartmentId ?? null,
        action: "REGISTER",
        status: assignedToId ? "RECEIVED" : "PENDING",
        receivedAt: assignedToId ? new Date() : null,
        workflowExecutionId: execution.id,
      },
    });

    const file = await tx.file.update({ where: { id: fileId }, data: { status: "IN_PROGRESS" } });

    return {
      instance: await tx.workflowInstance.findUniqueOrThrow({ where: { id: instance.id }, include: INSTANCE_INCLUDE }),
      assignment,
      file,
      executionId: execution.id,
    };
  });

/**
 * FORWARD / RETURN / REASSIGN: a real change of ownership and (for
 * FORWARD/RETURN) of step. Closes out the current assignment, opens a
 * new one, logs the execution, and records the movement.
 */
export const recordMovementTransition = ({
  instanceId,
  fileId,
  action,
  currentAssignment,
  toStepId,
  toUserId,
  toDepartmentId,
  dueDate,
  performedById,
  remarks,
}) =>
  prisma.$transaction(async (tx) => {
    await tx.fileAssignment.update({
      where: { id: currentAssignment.id },
      data: {
        isCurrent: false,
        status: action === "REASSIGN" ? "REASSIGNED" : "COMPLETED",
        completedAt: new Date(),
      },
    });

    const assignment = await tx.fileAssignment.create({
      data: {
        fileId,
        assignedToId: toUserId ?? null,
        assignedDepartmentId: toDepartmentId ?? null,
        assignedById: performedById,
        workflowStepId: toStepId,
        dueDate: dueDate ?? null,
        isCurrent: true,
      },
    });

    const execution = await tx.workflowExecution.create({
      data: {
        instanceId,
        stepId: toStepId,
        action,
        performedById,
        fromUserId: currentAssignment.assignedToId ?? null,
        toUserId: toUserId ?? null,
        remarks: remarks ?? null,
      },
    });

    await tx.fileMovement.create({
      data: {
        fileId,
        fromUserId: currentAssignment.assignedToId ?? null,
        toUserId: toUserId ?? null,
        fromDepartmentId: currentAssignment.assignedDepartmentId ?? null,
        toDepartmentId: toDepartmentId ?? null,
        action,
        status: toUserId ? "RECEIVED" : "PENDING",
        receivedAt: toUserId ? new Date() : null,
        workflowExecutionId: execution.id,
      },
    });

    const instance = await tx.workflowInstance.update({
      where: { id: instanceId },
      data: { currentStepId: toStepId },
      include: INSTANCE_INCLUDE,
    });

    return { instance, assignment, executionId: execution.id };
  });

/**
 * APPROVE (at the final step) / REJECT / COMPLETE / CLOSE: the workflow
 * ends here. The current assignment is marked done but deliberately kept
 * isCurrent: true -- "current owner" after completion means "who closed
 * it out", which is still useful context, not nothing. No new assignment,
 * no movement -- nothing is routed anywhere further.
 */
export const recordTerminalTransition = ({ instanceId, fileId, action, currentAssignment, newInstanceState, newFileStatus, performedById, remarks }) =>
  prisma.$transaction(async (tx) => {
    await tx.fileAssignment.update({
      where: { id: currentAssignment.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    const execution = await tx.workflowExecution.create({
      data: {
        instanceId,
        stepId: currentAssignment.workflowStepId ?? null,
        action,
        performedById,
        fromUserId: currentAssignment.assignedToId ?? null,
        remarks: remarks ?? null,
      },
    });

    const instance = await tx.workflowInstance.update({
      where: { id: instanceId },
      data: { state: newInstanceState, completedAt: new Date() },
      include: INSTANCE_INCLUDE,
    });

    const file = await tx.file.update({
      where: { id: fileId },
      data: { status: newFileStatus, closedAt: new Date() },
    });

    return { instance, file, executionId: execution.id };
  });

/**
 * HOLD / RESUME: a pure state-machine flag flip. Ownership doesn't
 * change (the same person still holds the file), so no new assignment
 * and no movement record -- nothing physically moved.
 */
export const recordStateTransition = ({ instanceId, fileId, action, currentAssignment, newState, newFileStatus, performedById, remarks }) =>
  prisma.$transaction(async (tx) => {
    const execution = await tx.workflowExecution.create({
      data: {
        instanceId,
        stepId: currentAssignment?.workflowStepId ?? null,
        action,
        performedById,
        fromUserId: currentAssignment?.assignedToId ?? null,
        toUserId: currentAssignment?.assignedToId ?? null,
        remarks: remarks ?? null,
      },
    });

    const instance = await tx.workflowInstance.update({
      where: { id: instanceId },
      data: { state: newState },
      include: INSTANCE_INCLUDE,
    });

    const file = await tx.file.update({ where: { id: fileId }, data: { status: newFileStatus } });

    return { instance, file, executionId: execution.id };
  });

/** Claiming acknowledges receipt of something already routed to a department queue -- not a new workflow action. */
export const claimAssignment = ({ assignmentId, movementId, actorId }) =>
  prisma.$transaction(async (tx) => {
    const assignment = await tx.fileAssignment.update({
      where: { id: assignmentId },
      data: { assignedToId: actorId, startedAt: new Date() },
    });

    if (movementId) {
      await tx.fileMovement.update({
        where: { id: movementId },
        data: { toUserId: actorId, status: "RECEIVED", receivedAt: new Date() },
      });
    }

    return assignment;
  });
