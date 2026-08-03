import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { publish } from "../utils/eventBus.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as workflowTemplateRepository from "../repositories/workflowTemplate.repository.js";
import * as workflowInstanceRepository from "../repositories/workflowInstance.repository.js";
import * as fileAssignmentRepository from "../repositories/fileAssignment.repository.js";
import * as fileMovementRepository from "../repositories/fileMovement.repository.js";
import * as fileMinuteRepository from "../repositories/fileMinute.repository.js";
import { assertIsCurrentOwner, assertFileNotArchived } from "./fileOwnership.service.js";

// Phase 4 built pure step-to-step routing (FORWARD/RETURN/REASSIGN) and
// pure state flags (HOLD/RESUME). Phase 6 completes the action set with
// the decision actions that carry real business/legal weight.
const ENGINE_SUPPORTED_ACTIONS = ["FORWARD", "RETURN", "REASSIGN", "HOLD", "RESUME", "APPROVE", "REJECT", "REQUEST_INFORMATION", "COMPLETE", "CLOSE"];

const AUDIT_ACTION_BY_TRANSITION = {
  FORWARD: AUDIT_ACTIONS.WORKFLOW_FORWARDED,
  RETURN: AUDIT_ACTIONS.WORKFLOW_RETURNED,
  REASSIGN: AUDIT_ACTIONS.WORKFLOW_REASSIGNED,
  HOLD: AUDIT_ACTIONS.WORKFLOW_HELD,
  RESUME: AUDIT_ACTIONS.WORKFLOW_RESUMED,
  APPROVE: AUDIT_ACTIONS.WORKFLOW_APPROVED,
  REJECT: AUDIT_ACTIONS.WORKFLOW_REJECTED,
  REQUEST_INFORMATION: AUDIT_ACTIONS.WORKFLOW_INFORMATION_REQUESTED,
  COMPLETE: AUDIT_ACTIONS.WORKFLOW_COMPLETED,
  CLOSE: AUDIT_ACTIONS.WORKFLOW_CLOSED,
};

// "Create Timeline" -- every action's human-readable label and the
// TimelineEvent.eventType it publishes under (reusing NotificationType,
// per the Phase -1 design: Timeline and Notifications share one domain-
// event vocabulary).
const TIMELINE_TITLE_BY_ACTION = {
  REGISTER: "File registered into workflow",
  FORWARD: "File forwarded",
  RETURN: "File returned",
  REASSIGN: "File reassigned",
  HOLD: "File put on hold",
  RESUME: "File resumed",
  APPROVE: "File approved",
  REJECT: "File rejected",
  REQUEST_INFORMATION: "Additional information requested",
  COMPLETE: "File marked complete",
  CLOSE: "File closed",
};

const TIMELINE_EVENT_TYPE_BY_ACTION = {
  REGISTER: "FILE_REGISTERED",
  FORWARD: "FILE_FORWARDED",
  RETURN: "FILE_RETURNED",
  REASSIGN: "FILE_ASSIGNED",
  HOLD: "FILE_ON_HOLD",
  RESUME: "FILE_RESUMED",
  APPROVE: "FILE_APPROVED",
  REJECT: "FILE_REJECTED",
  REQUEST_INFORMATION: "FILE_INFORMATION_REQUESTED",
  COMPLETE: "FILE_COMPLETED",
  CLOSE: "FILE_CLOSED",
};

/**
 * "Publish Event" -- Workflow never calls Timeline/Notification code
 * directly; it only ever emits here. `recipientIds` is who a human
 * notification should go to (Phase 8) -- Timeline ignores it and records
 * every event regardless; Notification only acts when it's non-empty.
 */
const publishTimelineEvent = ({ fileId, action, actorId, sourceType = "WorkflowExecution", sourceId, remarks, recipientIds = [] }) => {
  publish({
    type: TIMELINE_EVENT_TYPE_BY_ACTION[action],
    fileId,
    actorId,
    sourceType,
    sourceId: sourceId ?? null,
    title: TIMELINE_TITLE_BY_ACTION[action],
    description: remarks ?? null,
    recipientIds,
  });
};

// Approvals/rejections/decisions carry real weight -- when remarks are
// given, they become the formal Minute record of that decision (Phase 5),
// not just a log line buried in WorkflowExecution.
const DECISION_MINUTE_TYPE_BY_ACTION = {
  APPROVE: "APPROVAL",
  REJECT: "REJECTION",
  REQUEST_INFORMATION: "NOTE",
  COMPLETE: "DECISION",
  CLOSE: "DECISION",
};

const recordDecisionMinuteIfApplicable = async ({ fileId, action, actorId, remarks, executionId }) => {
  const minuteType = DECISION_MINUTE_TYPE_BY_ACTION[action];
  if (!minuteType || !remarks) return;

  await fileMinuteRepository.create({
    fileId,
    minuteType,
    content: remarks,
    writtenById: actorId,
    workflowExecutionId: executionId ?? null,
  });
};

const sanitizeAssignment = (assignment) =>
  assignment && {
    id: assignment.id,
    assignedTo: assignment.assignedTo,
    assignedDepartment: assignment.assignedDepartment,
    assignedBy: assignment.assignedBy,
    workflowStep: assignment.workflowStep && { id: assignment.workflowStep.id, name: assignment.workflowStep.name, stepOrder: assignment.workflowStep.stepOrder },
    status: assignment.status,
    dueDate: assignment.dueDate,
    isCurrent: assignment.isCurrent,
    createdAt: assignment.createdAt,
  };

const sanitizeInstance = (instance) =>
  instance && {
    id: instance.id,
    fileId: instance.fileId,
    template: instance.template,
    currentStep: instance.currentStep && {
      id: instance.currentStep.id,
      name: instance.currentStep.name,
      stepOrder: instance.currentStep.stepOrder,
      isFinalStep: instance.currentStep.isFinalStep,
      allowedActions: instance.currentStep.allowedActions,
    },
    state: instance.state,
    startedAt: instance.startedAt,
    completedAt: instance.completedAt,
  };

const logAudit = ({ actorId, action, entityId, metadata, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "WorkflowInstance",
    entityId,
    description: `${action} (${entityId})`,
    metadata: metadata ?? null,
    ipAddress,
  });

const computeDueDate = (slaHours) => (slaHours ? new Date(Date.now() + slaHours * 60 * 60 * 1000) : null);

const isActionAllowedAtStep = (step, action) => !step.allowedActions?.length || step.allowedActions.includes(action);

/** Validates that a *target* user (the one about to receive the file) is eligible for a step's requirements. */
const assertTargetEligible = async ({ step, toUserId }) => {
  const target = await authRepository.findAuthenticatedUser(toUserId);
  if (!target) throw new AppError(404, "Target user not found");
  if (target.status !== "ACTIVE") throw new AppError(400, "The selected user's account is not active");

  if (step.requiredPositionId && target.position?.id !== step.requiredPositionId) {
    throw new AppError(400, "The selected user does not hold the position required by this step");
  }
  if (step.requiredRoleId && !target.roles.some((r) => r.role.id === step.requiredRoleId)) {
    throw new AppError(400, "The selected user does not hold the role required by this step");
  }
  return target;
};

/**
 * Binds a File to a WorkflowTemplate and opens its first step. A file can
 * have only one active (non-terminal) instance at a time.
 */
export const startWorkflow = async ({ fileId, templateId, toUserId, remarks, actorId, ipAddress }) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");
  assertFileNotArchived(file);

  const existing = await workflowInstanceRepository.findActiveByFileId(fileId);
  if (existing) throw new AppError(409, "This file already has an active workflow");

  const template = await workflowTemplateRepository.findById(templateId);
  if (!template || !template.isActive) throw new AppError(404, "Workflow template not found or inactive");

  const firstStep = template.steps.filter((s) => s.isActive).sort((a, b) => a.stepOrder - b.stepOrder)[0];
  if (!firstStep) throw new AppError(409, "Workflow template has no active steps");

  if (toUserId) {
    await assertTargetEligible({ step: firstStep, toUserId });
  }

  const result = await workflowInstanceRepository.startInstance({
    fileId,
    templateId,
    firstStepId: firstStep.id,
    assignedToId: toUserId ?? null,
    assignedDepartmentId: file.departmentId,
    dueDate: computeDueDate(firstStep.slaHours),
    performedById: actorId,
    remarks,
  });

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.WORKFLOW_STARTED,
    entityId: result.instance.id,
    metadata: { fileId, templateId, firstStepId: firstStep.id },
    ipAddress,
  });

  publishTimelineEvent({
    fileId,
    action: "REGISTER",
    actorId,
    sourceId: result.executionId,
    remarks,
    recipientIds: toUserId ? [toUserId] : [],
  });

  return { instance: sanitizeInstance(result.instance), currentAssignment: sanitizeAssignment(await fileAssignmentRepository.findCurrentByFileId(fileId)) };
};

const transitionForward = async ({ instance, currentAssignment, toUserId, remarks, actorId }) => {
  if (instance.state !== "IN_PROGRESS") throw new AppError(409, "Workflow is not in progress");
  if (!instance.currentStep) throw new AppError(409, "Workflow has no current step");
  if (instance.currentStep.isFinalStep) throw new AppError(409, "This is the final step of the workflow");
  if (!isActionAllowedAtStep(instance.currentStep, "FORWARD")) throw new AppError(403, "FORWARD is not permitted at this step");
  if (!toUserId) throw new AppError(400, "toUserId is required to forward a file");

  const nextStep = await workflowTemplateRepository.findStepByOrder(instance.templateId, instance.currentStep.stepOrder + 1);
  if (!nextStep) throw new AppError(409, "This template has no next step defined");

  const target = await assertTargetEligible({ step: nextStep, toUserId });

  return workflowInstanceRepository.recordMovementTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "FORWARD",
    currentAssignment,
    toStepId: nextStep.id,
    toUserId,
    toDepartmentId: target.department?.id ?? currentAssignment.assignedDepartmentId,
    dueDate: computeDueDate(nextStep.slaHours),
    performedById: actorId,
    remarks,
  });
};

const transitionReturn = async ({ instance, currentAssignment, toUserId, remarks, actorId }) => {
  if (instance.state !== "IN_PROGRESS") throw new AppError(409, "Workflow is not in progress");
  if (!instance.currentStep) throw new AppError(409, "Workflow has no current step");
  if (!isActionAllowedAtStep(instance.currentStep, "RETURN")) throw new AppError(403, "RETURN is not permitted at this step");
  if (!toUserId) throw new AppError(400, "toUserId is required to return a file");

  const previousStep = await workflowTemplateRepository.findStepByOrder(instance.templateId, instance.currentStep.stepOrder - 1);
  if (!previousStep) throw new AppError(409, "Already at the first step -- cannot return further");

  const target = await assertTargetEligible({ step: previousStep, toUserId });

  return workflowInstanceRepository.recordMovementTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "RETURN",
    currentAssignment,
    toStepId: previousStep.id,
    toUserId,
    toDepartmentId: target.department?.id ?? currentAssignment.assignedDepartmentId,
    dueDate: computeDueDate(previousStep.slaHours),
    performedById: actorId,
    remarks,
  });
};

const transitionReassign = async ({ instance, currentAssignment, toUserId, remarks, actorId }) => {
  if (instance.state !== "IN_PROGRESS") throw new AppError(409, "Workflow is not in progress");
  if (!instance.currentStep) throw new AppError(409, "Workflow has no current step");
  if (!isActionAllowedAtStep(instance.currentStep, "REASSIGN")) throw new AppError(403, "REASSIGN is not permitted at this step");
  if (!toUserId) throw new AppError(400, "toUserId is required to reassign a file");
  if (toUserId === currentAssignment.assignedToId) throw new AppError(409, "File is already assigned to this user");

  const target = await assertTargetEligible({ step: instance.currentStep, toUserId });

  return workflowInstanceRepository.recordMovementTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "REASSIGN",
    currentAssignment,
    toStepId: instance.currentStep.id,
    toUserId,
    toDepartmentId: target.department?.id ?? currentAssignment.assignedDepartmentId,
    dueDate: currentAssignment.dueDate,
    performedById: actorId,
    remarks,
  });
};

const transitionHold = async ({ instance, currentAssignment, remarks, actorId }) => {
  if (instance.state !== "IN_PROGRESS") throw new AppError(409, "Only an in-progress workflow can be put on hold");

  const result = await workflowInstanceRepository.recordStateTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "HOLD",
    currentAssignment,
    newState: "ON_HOLD",
    newFileStatus: "ON_HOLD",
    performedById: actorId,
    remarks,
  });
  return { instance: result.instance, assignment: currentAssignment, executionId: result.executionId };
};

const transitionResume = async ({ instance, currentAssignment, remarks, actorId }) => {
  if (instance.state !== "ON_HOLD") throw new AppError(409, "Workflow is not on hold");

  const result = await workflowInstanceRepository.recordStateTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "RESUME",
    currentAssignment,
    newState: "IN_PROGRESS",
    newFileStatus: "IN_PROGRESS",
    performedById: actorId,
    remarks,
  });
  return { instance: result.instance, assignment: currentAssignment, executionId: result.executionId };
};

/**
 * APPROVE at a non-final step behaves like an affirmative FORWARD (moves
 * on, requires a next-step-eligible toUserId). APPROVE at the final step
 * completes the workflow outright -- the same terminal outcome COMPLETE
 * produces, reached via the natural "I approve, and that was the last
 * step" path instead of an explicit administrative closure.
 */
const transitionApprove = async ({ instance, currentAssignment, toUserId, remarks, actorId }) => {
  if (instance.state !== "IN_PROGRESS") throw new AppError(409, "Workflow is not in progress");
  if (!instance.currentStep) throw new AppError(409, "Workflow has no current step");
  if (!isActionAllowedAtStep(instance.currentStep, "APPROVE")) throw new AppError(403, "APPROVE is not permitted at this step");

  if (instance.currentStep.isFinalStep) {
    return workflowInstanceRepository.recordTerminalTransition({
      instanceId: instance.id,
      fileId: instance.fileId,
      action: "APPROVE",
      currentAssignment,
      newInstanceState: "COMPLETED",
      newFileStatus: "COMPLETED",
      performedById: actorId,
      remarks,
    });
  }

  if (!toUserId) throw new AppError(400, "toUserId is required to approve and forward to the next step");

  const nextStep = await workflowTemplateRepository.findStepByOrder(instance.templateId, instance.currentStep.stepOrder + 1);
  if (!nextStep) throw new AppError(409, "This template has no next step defined");

  const target = await assertTargetEligible({ step: nextStep, toUserId });

  return workflowInstanceRepository.recordMovementTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "APPROVE",
    currentAssignment,
    toStepId: nextStep.id,
    toUserId,
    toDepartmentId: target.department?.id ?? currentAssignment.assignedDepartmentId,
    dueDate: computeDueDate(nextStep.slaHours),
    performedById: actorId,
    remarks,
  });
};

/** Terminal, negative outcome -- available from any in-progress step, not just the final one (a case can be rejected early). */
const transitionReject = async ({ instance, currentAssignment, remarks, actorId }) => {
  if (instance.state !== "IN_PROGRESS") throw new AppError(409, "Workflow is not in progress");
  if (!instance.currentStep) throw new AppError(409, "Workflow has no current step");
  if (!isActionAllowedAtStep(instance.currentStep, "REJECT")) throw new AppError(403, "REJECT is not permitted at this step");

  return workflowInstanceRepository.recordTerminalTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "REJECT",
    currentAssignment,
    newInstanceState: "REJECTED",
    newFileStatus: "REJECTED",
    performedById: actorId,
    remarks,
  });
};

/**
 * Mechanically like REASSIGN (same step, new holder) but deliberately
 * skips step-eligibility: information can be requested from anyone who
 * might have it (e.g. the original registrant), not just whoever is
 * qualified to hold this step.
 */
const transitionRequestInformation = async ({ instance, currentAssignment, toUserId, remarks, actorId }) => {
  if (instance.state !== "IN_PROGRESS") throw new AppError(409, "Workflow is not in progress");
  if (!instance.currentStep) throw new AppError(409, "Workflow has no current step");
  if (!isActionAllowedAtStep(instance.currentStep, "REQUEST_INFORMATION")) throw new AppError(403, "REQUEST_INFORMATION is not permitted at this step");
  if (!toUserId) throw new AppError(400, "toUserId is required to request information");

  const target = await authRepository.findUserById(toUserId);
  if (!target || !target.isActive) throw new AppError(404, "Target user not found or inactive");
  if (target.status !== "ACTIVE") throw new AppError(400, "The selected user's account is not active");

  return workflowInstanceRepository.recordMovementTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "REQUEST_INFORMATION",
    currentAssignment,
    toStepId: instance.currentStep.id,
    toUserId,
    toDepartmentId: target.departmentId ?? currentAssignment.assignedDepartmentId,
    dueDate: currentAssignment.dueDate,
    performedById: actorId,
    remarks,
  });
};

/** Administrative closure: available regardless of step/allowedActions -- not gated the way routing actions are. */
const transitionComplete = async ({ instance, currentAssignment, remarks, actorId }) => {
  if (instance.state !== "IN_PROGRESS") throw new AppError(409, "Only an in-progress workflow can be marked complete");

  return workflowInstanceRepository.recordTerminalTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "COMPLETE",
    currentAssignment,
    newInstanceState: "COMPLETED",
    newFileStatus: "COMPLETED",
    performedById: actorId,
    remarks,
  });
};

/** Administrative closure without a completion decision (e.g. withdrawn/cancelled) -- usable from IN_PROGRESS or ON_HOLD. */
const transitionClose = async ({ instance, currentAssignment, remarks, actorId }) => {
  if (!["IN_PROGRESS", "ON_HOLD"].includes(instance.state)) {
    throw new AppError(409, "Only an active or on-hold workflow can be closed");
  }

  return workflowInstanceRepository.recordTerminalTransition({
    instanceId: instance.id,
    fileId: instance.fileId,
    action: "CLOSE",
    currentAssignment,
    newInstanceState: "COMPLETED",
    newFileStatus: "CLOSED",
    performedById: actorId,
    remarks,
  });
};

const TRANSITION_HANDLERS = {
  FORWARD: transitionForward,
  RETURN: transitionReturn,
  REASSIGN: transitionReassign,
  HOLD: transitionHold,
  RESUME: transitionResume,
  APPROVE: transitionApprove,
  REJECT: transitionReject,
  REQUEST_INFORMATION: transitionRequestInformation,
  COMPLETE: transitionComplete,
  CLOSE: transitionClose,
};

export const transitionWorkflow = async ({ fileId, action, toUserId, remarks, actorId, ipAddress }) => {
  if (!ENGINE_SUPPORTED_ACTIONS.includes(action)) {
    throw new AppError(400, `Action "${action}" is not yet supported by the workflow engine`);
  }

  const instance = await workflowInstanceRepository.findActiveByFileId(fileId);
  if (!instance) throw new AppError(404, "File has no active workflow");

  const currentAssignment = await fileAssignmentRepository.findCurrentByFileId(fileId);
  if (!currentAssignment) throw new AppError(409, "File has no current assignment");

  await assertIsCurrentOwner({ currentAssignment, actorId });

  const result = await TRANSITION_HANDLERS[action]({ instance, currentAssignment, toUserId, remarks, actorId });

  await logAudit({
    actorId,
    action: AUDIT_ACTION_BY_TRANSITION[action],
    entityId: instance.id,
    metadata: { fileId, toUserId: toUserId ?? null, remarks: remarks ?? null },
    ipAddress,
  });

  // Movement actions (a real new toUserId) notify the new holder; terminal
  // actions have no new holder, so notify whoever registered the file instead.
  let recipientIds = [];
  if (result.assignment && toUserId) {
    recipientIds = [toUserId];
  } else if (!result.assignment) {
    const file = await fileRepository.findById(fileId);
    if (file?.registeredById) recipientIds = [file.registeredById];
  }

  publishTimelineEvent({ fileId, action, actorId, sourceId: result.executionId, remarks, recipientIds });
  await recordDecisionMinuteIfApplicable({ fileId, action, actorId, remarks, executionId: result.executionId });

  // Terminal transitions (APPROVE-at-final/REJECT/COMPLETE/CLOSE) don't
  // return an `assignment` -- the current one is updated in place, not
  // replaced, so the fresh copy has to be re-fetched after the transaction.
  const finalAssignment = result.assignment ?? (await fileAssignmentRepository.findById(currentAssignment.id));

  return { instance: sanitizeInstance(result.instance), currentAssignment: sanitizeAssignment(finalAssignment) };
};

/** Claims an unclaimed, department-queued assignment -- acknowledging receipt, not a workflow action. */
export const claimAssignment = async ({ fileId, actorId, ipAddress }) => {
  const currentAssignment = await fileAssignmentRepository.findCurrentByFileId(fileId);
  if (!currentAssignment) throw new AppError(404, "File has no current assignment");
  if (currentAssignment.assignedToId) throw new AppError(409, "This file has already been claimed");
  if (!currentAssignment.assignedDepartmentId) throw new AppError(409, "This assignment has no department queue to claim from");

  const actor = await authRepository.findAuthenticatedUser(actorId);
  if (!actor || actor.department?.id !== currentAssignment.assignedDepartmentId) {
    throw new AppError(403, "You do not belong to the department this file is queued in");
  }

  if (currentAssignment.workflowStep) {
    await assertTargetEligible({ step: currentAssignment.workflowStep, toUserId: actorId });
  }

  const movement = await fileMovementRepository.findPendingDepartmentMovement(fileId, currentAssignment.assignedDepartmentId);

  await workflowInstanceRepository.claimAssignment({ assignmentId: currentAssignment.id, movementId: movement?.id, actorId });

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.WORKFLOW_ASSIGNMENT_CLAIMED,
    entityId: currentAssignment.id,
    metadata: { fileId },
    ipAddress,
  });

  return sanitizeAssignment(await fileAssignmentRepository.findById(currentAssignment.id));
};

export const getWorkflowStatus = async (fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");

  const instance = await workflowInstanceRepository.findActiveByFileId(fileId);
  const currentAssignment = await fileAssignmentRepository.findCurrentByFileId(fileId);

  return { instance: sanitizeInstance(instance), currentAssignment: sanitizeAssignment(currentAssignment) };
};

/**
 * "Who can I route this to" for the Take Action picker -- resolves the
 * relevant step for the given action (next step for FORWARD/non-final
 * APPROVE, previous for RETURN, the current step itself for REASSIGN),
 * then lists active users holding that step's requiredRoleId/
 * requiredPositionId. REQUEST_INFORMATION is deliberately excluded: the
 * engine allows it to target anyone (see transitionRequestInformation),
 * so there's no step to narrow by -- `constrained: false` tells the
 * caller to fall back to manual entry. Same for a genuinely permissive
 * step (no role/position requirement at all).
 */
export const listEligibleTargets = async ({ fileId, action }) => {
  const instance = await workflowInstanceRepository.findActiveByFileId(fileId);
  if (!instance) throw new AppError(404, "This file has no active workflow");
  if (!instance.currentStep) throw new AppError(409, "Workflow has no current step");

  let targetStep;
  if (action === "FORWARD" || action === "APPROVE") {
    if (instance.currentStep.isFinalStep) return { constrained: false, users: [] };
    targetStep = await workflowTemplateRepository.findStepByOrder(instance.templateId, instance.currentStep.stepOrder + 1);
  } else if (action === "RETURN") {
    targetStep = await workflowTemplateRepository.findStepByOrder(instance.templateId, instance.currentStep.stepOrder - 1);
  } else if (action === "REASSIGN") {
    targetStep = instance.currentStep;
  } else {
    return { constrained: false, users: [] };
  }

  if (!targetStep || (!targetStep.requiredRoleId && !targetStep.requiredPositionId)) {
    return { constrained: false, users: [] };
  }

  const users = await authRepository.findUsersByRoleOrPosition({
    roleId: targetStep.requiredRoleId,
    positionId: targetStep.requiredPositionId,
  });
  return { constrained: true, users };
};

/** Escalation-ready: surfaces every current assignment already past its SLA-derived due date. No auto-escalation job yet -- that's a Future Improvement. */
export const listOverdueAssignments = async () => {
  const overdue = await fileAssignmentRepository.findOverdue();
  return overdue.map((a) => ({ ...sanitizeAssignment(a), file: a.file }));
};
