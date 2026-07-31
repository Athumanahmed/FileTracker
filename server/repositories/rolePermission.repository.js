import prisma from "../config/prisma.js";

/**
 * Data-access layer for the RolePermission join table. Unlike the other
 * admin modules, this isn't a standalone entity with its own soft-delete
 * lifecycle -- an assignment either exists or it doesn't. History is
 * preserved in the audit log, not in the row itself.
 */

export const findAssignment = (roleId, permissionId) =>
  prisma.rolePermission.findUnique({ where: { roleId_permissionId: { roleId, permissionId } } });

export const create = (roleId, permissionId) =>
  prisma.rolePermission.create({ data: { roleId, permissionId } });

export const remove = (roleId, permissionId) =>
  prisma.rolePermission.delete({ where: { roleId_permissionId: { roleId, permissionId } } });

export const findMany = ({ where, orderBy, skip, take }) =>
  prisma.rolePermission.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      role: { select: { id: true, name: true, code: true } },
      permission: { select: { id: true, name: true, code: true, module: true } },
    },
  });

export const count = (where) => prisma.rolePermission.count({ where });

export const findPermissionIdsForRole = async (roleId) => {
  const rows = await prisma.rolePermission.findMany({ where: { roleId }, select: { permissionId: true } });
  return rows.map((row) => row.permissionId);
};

/**
 * Replaces a role's entire permission set atomically: removes whatever
 * is no longer in the desired set, adds whatever's newly included, and
 * leaves unchanged entries untouched. One transaction so a partial sync
 * (e.g. removals applied but additions failed) can never happen.
 */
export const syncRolePermissions = (roleId, desiredPermissionIds) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.rolePermission.findMany({ where: { roleId }, select: { permissionId: true } });
    const currentIds = new Set(current.map((row) => row.permissionId));
    const desiredIds = new Set(desiredPermissionIds);

    const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));
    const toAdd = [...desiredIds].filter((id) => !currentIds.has(id));

    if (toRemove.length > 0) {
      await tx.rolePermission.deleteMany({ where: { roleId, permissionId: { in: toRemove } } });
    }
    if (toAdd.length > 0) {
      await tx.rolePermission.createMany({ data: toAdd.map((permissionId) => ({ roleId, permissionId })) });
    }

    return { toAdd, toRemove };
  });
