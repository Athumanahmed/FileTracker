import prisma from "../config/prisma.js";

const DETAIL_INCLUDE = {
  fromUser: { select: { id: true, fullName: true, username: true } },
  toUser: { select: { id: true, fullName: true, username: true } },
  fromDepartment: { select: { id: true, name: true, code: true } },
  toDepartment: { select: { id: true, name: true, code: true } },
};

export const findByFileId = ({ fileId, skip, take }) =>
  prisma.fileMovement.findMany({
    where: { fileId },
    include: DETAIL_INCLUDE,
    orderBy: { dispatchedAt: "desc" },
    skip,
    take,
  });

export const count = (fileId) => prisma.fileMovement.count({ where: { fileId } });

/**
 * The one movement still waiting to be picked up from a department queue
 * (toUserId null, status PENDING). There is at most one at a time in
 * practice -- a file has a single current assignment -- so "most recent"
 * is an unambiguous, correct selector, not a heuristic guess.
 */
export const findPendingDepartmentMovement = (fileId, departmentId) =>
  prisma.fileMovement.findFirst({
    where: { fileId, toDepartmentId: departmentId, toUserId: null, status: "PENDING" },
    orderBy: { dispatchedAt: "desc" },
  });
