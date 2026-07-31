import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { parsePagination, parseSort, buildPaginationMeta } from "../utils/queryOptions.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as rolePermissionRepository from "../repositories/rolePermission.repository.js";
import * as roleRepository from "../repositories/role.repository.js";
import * as permissionRepository from "../repositories/permission.repository.js";

const SORTABLE_FIELDS = ["assignedAt"];

const sanitize = (rolePermission) => ({
  roleId: rolePermission.roleId,
  permissionId: rolePermission.permissionId,
  assignedAt: rolePermission.assignedAt,
  ...(rolePermission.role
    ? { role: { id: rolePermission.role.id, name: rolePermission.role.name, code: rolePermission.role.code } }
    : {}),
  ...(rolePermission.permission
    ? {
        permission: {
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          code: rolePermission.permission.code,
          module: rolePermission.permission.module,
        },
      }
    : {}),
});

const logAudit = ({ actorId, action, entityId, before, after, description, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "RolePermission",
    entityId,
    description,
    metadata: { before: before ?? null, after: after ?? null },
    ipAddress,
  });

const assertRoleExists = async (roleId) => {
  const role = await roleRepository.findById(roleId);
  if (!role) throw new AppError(422, "Selected role does not exist");
  return role;
};

/**
 * Assigning an inactive permission (or assigning to an inactive role)
 * would produce a grant that silently does nothing -- authorize() and
 * userHasPermission() both require isActive:true on the role AND the
 * permission. Rejecting this up front avoids an admin believing they
 * just granted access when they haven't.
 */
const assertPermissionActive = async (permissionId) => {
  const permission = await permissionRepository.findById(permissionId);
  if (!permission) throw new AppError(422, "Selected permission does not exist");
  if (!permission.isActive) throw new AppError(422, "Cannot assign an inactive permission -- reactivate it first");
  return permission;
};

export const assignPermission = async ({ actorId, roleId, permissionId, ipAddress }) => {
  const role = await assertRoleExists(roleId);
  if (!role.isActive) {
    throw new AppError(422, "Cannot assign a permission to an inactive role -- reactivate it first");
  }

  const permission = await assertPermissionActive(permissionId);

  const existing = await rolePermissionRepository.findAssignment(roleId, permissionId);
  if (existing) throw new AppError(409, "This permission is already assigned to this role");

  let assignment;
  try {
    assignment = await rolePermissionRepository.create(roleId, permissionId);
  } catch (err) {
    if (err.code === "P2002") throw new AppError(409, "This permission is already assigned to this role");
    throw err;
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ROLE_PERMISSION_ASSIGNED,
    entityId: `${roleId}:${permissionId}`,
    before: null,
    after: { roleCode: role.code, permissionCode: permission.code },
    description: `Assigned ${permission.code} to ${role.code}`,
    ipAddress,
  });

  return { roleId, permissionId, assignedAt: assignment.assignedAt };
};

export const revokePermission = async ({ actorId, roleId, permissionId, ipAddress }) => {
  const existing = await rolePermissionRepository.findAssignment(roleId, permissionId);
  if (!existing) throw new AppError(404, "This permission is not assigned to this role");

  const [role, permission] = await Promise.all([
    roleRepository.findById(roleId),
    permissionRepository.findById(permissionId),
  ]);

  await rolePermissionRepository.remove(roleId, permissionId);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ROLE_PERMISSION_REVOKED,
    entityId: `${roleId}:${permissionId}`,
    before: { roleCode: role?.code, permissionCode: permission?.code },
    after: null,
    description: `Revoked ${permission?.code} from ${role?.code}`,
    ipAddress,
  });

  return { roleId, permissionId };
};

export const getAssignment = async (roleId, permissionId) => {
  const assignment = await rolePermissionRepository.findAssignment(roleId, permissionId);
  if (!assignment) throw new AppError(404, "This permission is not assigned to this role");
  return { roleId, permissionId, assignedAt: assignment.assignedAt };
};

export const listRolePermissions = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "assignedAt");

  const where = {
    ...(query.roleId ? { roleId: query.roleId } : {}),
    ...(query.permissionId ? { permissionId: query.permissionId } : {}),
  };

  const [items, total] = await Promise.all([
    rolePermissionRepository.findMany({ where, orderBy, skip, take }),
    rolePermissionRepository.count(where),
  ]);

  return { items: items.map(sanitize), meta: buildPaginationMeta(total, page, limit) };
};

/**
 * Replaces a role's entire permission set in one transaction. Every
 * requested permission must exist and be active -- rejected as a whole
 * (422, listing the offenders) rather than silently skipping bad ids,
 * so a typo'd permissionId can't quietly result in a smaller grant than
 * the admin intended.
 */
export const syncRolePermissions = async ({ actorId, roleId, permissionIds, ipAddress }) => {
  const role = await assertRoleExists(roleId);

  const uniqueIds = [...new Set(permissionIds)];
  const foundPermissions = await permissionRepository.findManyByIds(uniqueIds);
  const foundById = new Map(foundPermissions.map((p) => [p.id, p]));

  const missing = uniqueIds.filter((id) => !foundById.has(id));
  if (missing.length > 0) {
    throw new AppError(422, `These permission ids do not exist: ${missing.join(", ")}`);
  }

  const inactive = foundPermissions.filter((p) => !p.isActive).map((p) => p.code);
  if (inactive.length > 0) {
    throw new AppError(422, `Cannot assign inactive permissions: ${inactive.join(", ")}`);
  }

  const beforeIds = await rolePermissionRepository.findPermissionIdsForRole(roleId);
  const beforePermissions = await permissionRepository.findManyByIds(beforeIds);

  const { toAdd, toRemove } = await rolePermissionRepository.syncRolePermissions(roleId, uniqueIds);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ROLE_PERMISSIONS_SYNCED,
    entityId: roleId,
    before: { permissionCodes: beforePermissions.map((p) => p.code) },
    after: { permissionCodes: foundPermissions.map((p) => p.code) },
    description: `Synced permissions for role ${role.code} (+${toAdd.length}/-${toRemove.length})`,
    ipAddress,
  });

  return { roleId, permissionIds: uniqueIds, added: toAdd.length, removed: toRemove.length };
};
