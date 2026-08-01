import prisma from "../config/prisma.js";

/** Data-access layer for the Roles admin module. */

export const findById = (id) => prisma.role.findUnique({ where: { id } });

export const findByCode = (code) => prisma.role.findUnique({ where: { code } });

export const findByName = (name) => prisma.role.findUnique({ where: { name } });

export const create = (data) => prisma.role.create({ data });

export const update = (id, data) => prisma.role.update({ where: { id }, data });

export const setActive = (id, isActive) => prisma.role.update({ where: { id }, data: { isActive } });

// Listing includes counts, not full child rows -- the admin directory
// table only ever needs "how many", never the UserRole/RolePermission rows
// themselves. `users` is filtered to currently-active assignees, mirroring
// deactivateIfNoActiveUsers' own definition of "active" below.
export const findMany = ({ where, orderBy, skip, take }) =>
  prisma.role.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      _count: {
        select: {
          users: { where: { user: { isActive: true, deletedAt: null } } },
          permissions: true,
        },
      },
    },
  });

export const count = (where) => prisma.role.count({ where });

/**
 * Deactivation must re-check "no active user assignments" and write
 * isActive:false atomically -- same pattern as Department/Unit/Position.
 * A Role assigned to an active user is a "child" for this purpose, since
 * authorize() requires role.isActive:true for every permission check.
 */
export const deactivateIfNoActiveUsers = (roleId) =>
  prisma.$transaction(async (tx) => {
    const activeUsers = await tx.userRole.count({
      where: { roleId, user: { isActive: true, deletedAt: null } },
    });

    if (activeUsers > 0) {
      return { blocked: true, activeUsers };
    }

    const role = await tx.role.update({ where: { id: roleId }, data: { isActive: false } });
    return { blocked: false, role };
  });
