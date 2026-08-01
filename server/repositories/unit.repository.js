import prisma from "../config/prisma.js";

/** Data-access layer for the Units admin module. */

export const findById = (id) => prisma.unit.findUnique({ where: { id } });

export const findByDepartmentAndCode = (departmentId, code) =>
  prisma.unit.findUnique({ where: { departmentId_code: { departmentId, code } } });

export const findByDepartmentAndName = (departmentId, name) =>
  prisma.unit.findUnique({ where: { departmentId_name: { departmentId, name } } });

export const create = (data) => prisma.unit.create({ data });

export const update = (id, data) => prisma.unit.update({ where: { id }, data });

export const setActive = (id, isActive) => prisma.unit.update({ where: { id }, data: { isActive } });

// Listing includes the parent department (name/code, for display) and child
// counts, not full child rows -- the admin directory table only ever needs
// "which department" and "how many", never the positions/users themselves.
export const findMany = ({ where, orderBy, skip, take }) =>
  prisma.unit.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: {
        select: { positions: true, users: { where: { deletedAt: null } } },
      },
    },
  });

export const count = (where) => prisma.unit.count({ where });

/**
 * Deactivation must re-check "no active children" (Positions, Users) and
 * write isActive:false atomically, same pattern as Department.
 */
export const deactivateIfNoActiveChildren = (unitId) =>
  prisma.$transaction(async (tx) => {
    const [activePositions, activeUsers] = await Promise.all([
      tx.position.count({ where: { unitId, isActive: true } }),
      tx.user.count({ where: { unitId, isActive: true, deletedAt: null } }),
    ]);

    if (activePositions > 0 || activeUsers > 0) {
      return { blocked: true, activePositions, activeUsers };
    }

    const unit = await tx.unit.update({ where: { id: unitId }, data: { isActive: false } });
    return { blocked: false, unit };
  });
