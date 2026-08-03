import prisma from "../config/prisma.js";

const DETAIL_INCLUDE = {
  assignedTo: { select: { id: true, fullName: true, username: true, positionId: true } },
  assignedDepartment: { select: { id: true, name: true, code: true } },
  assignedBy: { select: { id: true, fullName: true, username: true } },
  workflowStep: true,
};

export const findCurrentByFileId = (fileId) =>
  prisma.fileAssignment.findFirst({ where: { fileId, isCurrent: true }, include: DETAIL_INCLUDE });

export const findById = (id) => prisma.fileAssignment.findUnique({ where: { id }, include: DETAIL_INCLUDE });

/** Escalation-ready query: every currently-held assignment already past its SLA-derived due date. */
export const findOverdue = () =>
  prisma.fileAssignment.findMany({
    where: { isCurrent: true, dueDate: { lt: new Date() } },
    include: { ...DETAIL_INCLUDE, file: { select: { id: true, fileNumber: true, title: true, priority: true } } },
    orderBy: { dueDate: "asc" },
  });
