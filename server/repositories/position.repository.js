import prisma from "../config/prisma.js";

/** Data-access layer for the Positions admin module. */

export const findById = (id) => prisma.position.findUnique({ where: { id } });

export const findByUnitAndCode = (unitId, code) =>
  prisma.position.findUnique({ where: { unitId_code: { unitId, code } } });

export const findByUnitAndTitle = (unitId, title) =>
  prisma.position.findUnique({ where: { unitId_title: { unitId, title } } });

/** At most one active "head" position is allowed per unit -- see position.service.js. */
export const findActiveHeadInUnit = (unitId, excludeId) =>
  prisma.position.findFirst({
    where: {
      unitId,
      isHead: true,
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

export const create = (data) => prisma.position.create({ data });

export const update = (id, data) => prisma.position.update({ where: { id }, data });

export const setActive = (id, isActive) =>
  prisma.position.update({ where: { id }, data: { isActive } });

// Listing includes the parent unit + its department (for display) and the
// count of currently active assignees (to derive vacant/filled), not full
// child rows -- the admin directory table only ever needs "where" and "how
// many", never the User rows themselves.
export const findMany = ({ where, orderBy, skip, take }) =>
  prisma.position.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      unit: {
        select: { id: true, name: true, code: true, department: { select: { id: true, name: true, code: true } } },
      },
      _count: {
        select: { users: { where: { isActive: true, deletedAt: null } } },
      },
    },
  });

export const count = (where) => prisma.position.count({ where });

/**
 * Positions have no child entities of their own -- Users are the leaf.
 * Deactivation is blocked while any active user still holds this position.
 */
export const deactivateIfNoActiveUsers = (positionId) =>
  prisma.$transaction(async (tx) => {
    const activeUsers = await tx.user.count({
      where: { positionId, isActive: true, deletedAt: null },
    });

    if (activeUsers > 0) {
      return { blocked: true, activeUsers };
    }

    const position = await tx.position.update({
      where: { id: positionId },
      data: { isActive: false },
    });

    return { blocked: false, position };
  });
