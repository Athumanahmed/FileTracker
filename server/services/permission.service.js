import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import {
  parsePagination,
  parseSort,
  buildPaginationMeta,
  buildSearchClause,
  parseBooleanFilter,
} from "../utils/queryOptions.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as permissionRepository from "../repositories/permission.repository.js";

const MODULE_VALUES = [
  "AUTHENTICATION",
  "AUTHORIZATION",
  "USERS",
  "DEPARTMENTS",
  "UNITS",
  "POSITIONS",
  "FILE_TRACKING",
  "WORKFLOW",
  "REPORTS",
  "SETTINGS",
];

const SORTABLE_FIELDS = ["code", "name", "module", "createdAt", "updatedAt"];
const SEARCHABLE_FIELDS = ["code", "name"];

const sanitize = (permission) => ({
  id: permission.id,
  code: permission.code,
  name: permission.name,
  module: permission.module,
  description: permission.description,
  isActive: permission.isActive,
  createdAt: permission.createdAt,
  updatedAt: permission.updatedAt,
});

/** Allowlisted snapshot for audit before/after -- keeps metadata small and stable. */
const snapshot = (permission) => ({
  code: permission.code,
  name: permission.name,
  module: permission.module,
  description: permission.description,
  isActive: permission.isActive,
});

const logAudit = ({ actorId, action, entityId, before, after, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "Permission",
    entityId,
    description: `${action} (${entityId})`,
    metadata: { before: before ?? null, after: after ?? null },
    ipAddress,
  });

const rethrowAsConflict = (err) => {
  if (err.code === "P2002") {
    throw new AppError(409, "A permission with this code already exists");
  }
  throw err;
};

/**
 * Creating a permission here only makes it exist as assignable metadata --
 * it has no effect until a route somewhere actually calls
 * authorize("THE.CODE"). This module manages permission records; wiring
 * a new one into an endpoint is a separate, code-level step.
 */
export const createPermission = async ({ actorId, payload, ipAddress }) => {
  const existing = await permissionRepository.findByCode(payload.code);
  if (existing) throw new AppError(409, "A permission with this code already exists");

  let permission;
  try {
    permission = await permissionRepository.create({
      code: payload.code,
      name: payload.name,
      module: payload.module,
      description: payload.description || null,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.PERMISSION_CREATED,
    entityId: permission.id,
    before: null,
    after: snapshot(permission),
    ipAddress,
  });

  return sanitize(permission);
};

export const getPermissionById = async (id) => {
  const permission = await permissionRepository.findById(id);
  if (!permission) throw new AppError(404, "Permission not found");
  return sanitize(permission);
};

export const listPermissions = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "code");
  const isActive = parseBooleanFilter(query.isActive);

  const where = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(query.module ? { module: query.module } : {}),
    ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
  };

  const [items, total] = await Promise.all([
    permissionRepository.findMany({ where, orderBy, skip, take }),
    permissionRepository.count(where),
  ]);

  return { items: items.map(sanitize), meta: buildPaginationMeta(total, page, limit) };
};

/**
 * `code` is immutable after creation -- it's referenced directly by
 * authorize("SOME.CODE") calls throughout the route layer. Renaming it
 * here would silently break every route checking for the old string,
 * with no way for the system to detect it.
 */
export const updatePermission = async ({ id, actorId, payload, ipAddress }) => {
  const existing = await permissionRepository.findById(id);
  if (!existing) throw new AppError(404, "Permission not found");

  if (payload.code && payload.code !== existing.code) {
    throw new AppError(422, "Permission code cannot be changed after creation");
  }

  const updated = await permissionRepository.update(id, {
    name: payload.name ?? existing.name,
    module: payload.module ?? existing.module,
    description: payload.description !== undefined ? payload.description : existing.description,
  });

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.PERMISSION_UPDATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};

/**
 * Soft delete acts as a system-wide kill switch: deactivating a permission
 * is NOT blocked by existing RolePermission assignments, unlike
 * Department/Unit/Position's "no active children" rule -- this isn't a
 * structural parent-child relationship, it's an assignment. The whole
 * point is to immediately revoke this permission everywhere (see
 * authRepository.userHasPermission, which now requires isActive:true)
 * without having to edit every role's assignment individually.
 */
export const deactivatePermission = async ({ id, actorId, ipAddress }) => {
  const existing = await permissionRepository.findById(id);
  if (!existing) throw new AppError(404, "Permission not found");
  if (!existing.isActive) throw new AppError(409, "Permission is already inactive");

  const updated = await permissionRepository.setActive(id, false);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.PERMISSION_DEACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};

export const reactivatePermission = async ({ id, actorId, ipAddress }) => {
  const existing = await permissionRepository.findById(id);
  if (!existing) throw new AppError(404, "Permission not found");
  if (existing.isActive) throw new AppError(409, "Permission is already active");

  const updated = await permissionRepository.setActive(id, true);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.PERMISSION_REACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};

export { MODULE_VALUES };
