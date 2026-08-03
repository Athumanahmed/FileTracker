import prisma from "../config/prisma.js";

/**
 * Reporting reads a flat, JS-side-aggregatable shape rather than pushing
 * multi-dimensional GROUP BY into Prisma -- a municipal council's file
 * volume is small enough (thousands, not millions of rows) that grouping
 * in JS is simpler to reason about and test than composing several
 * Prisma groupBy calls that still can't express "average of a computed
 * date difference" directly.
 */
export const findAllForReporting = () =>
  prisma.file.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      status: true,
      priority: true,
      createdAt: true,
      closedAt: true,
      departmentId: true,
      department: { select: { id: true, name: true, code: true } },
      categoryId: true,
    },
  });

export const findCurrentAssignmentsForReporting = () =>
  prisma.fileAssignment.findMany({
    where: { isCurrent: true, assignedToId: { not: null } },
    select: {
      fileId: true,
      assignedToId: true,
      assignedTo: { select: { id: true, fullName: true, username: true } },
      dueDate: true,
      file: { select: { id: true, status: true, departmentId: true } },
    },
  });
