import prisma from "../config/prisma.js";

/** Data-access layer for the Departments admin module. */

export const findByName = (name) => prisma.department.findUnique({ where: { name } });

export const findByCode = (code) => prisma.department.findUnique({ where: { code } });

export const findById = (id) => prisma.department.findUnique({ where: { id } });

export const create = (data) => prisma.department.create({ data });

export const update = (id, data) => prisma.department.update({ where: { id }, data });

export const setActive = (id, isActive) =>
  prisma.department.update({ where: { id }, data: { isActive } });

export const findMany = ({ where, orderBy, skip, take }) =>
  prisma.department.findMany({ where, orderBy, skip, take });

export const count = (where) => prisma.department.count({ where });

/**
 * Deactivation must re-check "no active children" and write isActive:false
 * atomically, closing the race between the check and a concurrent
 * deactivate call (or a Unit being created in between). Returns
 * { blocked: true, ... } instead of throwing so the service can produce a
 * business-rule error message rather than a generic one.
 */
export const deactivateIfNoActiveChildren = (departmentId) =>
  prisma.$transaction(async (tx) => {
    const [activeUnits, activeUsers] = await Promise.all([
      tx.unit.count({ where: { departmentId, isActive: true } }),
      tx.user.count({ where: { departmentId, isActive: true, deletedAt: null } }),
    ]);

    if (activeUnits > 0 || activeUsers > 0) {
      return { blocked: true, activeUnits, activeUsers };
    }

    const department = await tx.department.update({
      where: { id: departmentId },
      data: { isActive: false },
    });

    return { blocked: false, department };
  });
