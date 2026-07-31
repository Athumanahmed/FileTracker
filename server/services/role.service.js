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
import * as roleRepository from "../repositories/role.repository.js";

const SORTABLE_FIELDS = ["name", "code", "createdAt", "updatedAt"];
const SEARCHABLE_FIELDS = ["name", "code"];

const sanitize = (role) => ({
  id: role.id,
  name: role.name,
  code: role.code,
  description: role.description,
  isSystem: role.isSystem,
  isActive: role.isActive,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

/** Allowlisted snapshot for audit before/after -- keeps metadata small and stable. */
const snapshot = (role) => ({
  name: role.name,
  code: role.code,
  description: role.description,
  isSystem: role.isSystem,
  isActive: role.isActive,
});

const logAudit = ({ actorId, action, entityId, before, after, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "Role",
    entityId,
    description: `${action} (${entityId})`,
    metadata: { before: before ?? null, after: after ?? null },
    ipAddress,
  });

const rethrowAsConflict = (err) => {
  if (err.code === "P2002") {
    throw new AppError(409, `A role with this ${err.meta?.target?.[0] || "value"} already exists`);
  }
  throw err;
};

/**
 * isSystem is never client-settable -- only seed scripts create the
 * foundational roles (SYSTEM_ADMIN, HOD, SUPERVISOR, ...) that
 * config/organizationalHierarchy.js and seedRolePermissions.js hardcode by
 * exact code. Every role created through this API is a plain custom role.
 */
export const createRole = async ({ actorId, payload, ipAddress }) => {
  const [existingName, existingCode] = await Promise.all([
    roleRepository.findByName(payload.name),
    roleRepository.findByCode(payload.code),
  ]);

  if (existingName) throw new AppError(409, "A role with this name already exists");
  if (existingCode) throw new AppError(409, "A role with this code already exists");

  let role;
  try {
    role = await roleRepository.create({
      name: payload.name,
      code: payload.code,
      description: payload.description || null,
      isSystem: false,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ROLE_CREATED,
    entityId: role.id,
    before: null,
    after: snapshot(role),
    ipAddress,
  });

  return sanitize(role);
};

export const getRoleById = async (id) => {
  const role = await roleRepository.findById(id);
  if (!role) throw new AppError(404, "Role not found");
  return sanitize(role);
};

export const listRoles = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "name");
  const isActive = parseBooleanFilter(query.isActive);
  const isSystem = parseBooleanFilter(query.isSystem);

  const where = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(isSystem !== undefined ? { isSystem } : {}),
    ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
  };

  const [items, total] = await Promise.all([
    roleRepository.findMany({ where, orderBy, skip, take }),
    roleRepository.count(where),
  ]);

  return { items: items.map(sanitize), meta: buildPaginationMeta(total, page, limit) };
};

/**
 * code and isSystem are both immutable after creation. code is referenced
 * literally throughout config/organizationalHierarchy.js and
 * seedRolePermissions.js; isSystem gates whether deactivation is even
 * allowed (see deactivateRole) and must never be flippable via this API.
 */
export const updateRole = async ({ id, actorId, payload, ipAddress }) => {
  const existing = await roleRepository.findById(id);
  if (!existing) throw new AppError(404, "Role not found");

  if (payload.code && payload.code !== existing.code) {
    throw new AppError(422, "Role code cannot be changed after creation");
  }

  if (payload.name && payload.name !== existing.name) {
    const conflict = await roleRepository.findByName(payload.name);
    if (conflict) throw new AppError(409, "A role with this name already exists");
  }

  let updated;
  try {
    updated = await roleRepository.update(id, {
      name: payload.name ?? existing.name,
      description: payload.description !== undefined ? payload.description : existing.description,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ROLE_UPDATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};

/**
 * Soft delete. System roles (SYSTEM_ADMIN, HOD, SUPERVISOR, ...) can never
 * be deactivated -- the organizational hierarchy and authorization system
 * depend on them existing and staying active. Custom roles are blocked
 * while any active user still holds them, same "no active children"
 * pattern as Department/Unit/Position -- a deactivated role would
 * silently fail authorize() for everyone still assigned to it.
 */
export const deactivateRole = async ({ id, actorId, ipAddress }) => {
  const existing = await roleRepository.findById(id);
  if (!existing) throw new AppError(404, "Role not found");
  if (existing.isSystem) throw new AppError(409, "System roles cannot be deactivated");
  if (!existing.isActive) throw new AppError(409, "Role is already inactive");

  const result = await roleRepository.deactivateIfNoActiveUsers(id);

  if (result.blocked) {
    throw new AppError(
      409,
      `Cannot deactivate: role still has ${result.activeUsers} active user(s) assigned. Reassign them first.`,
    );
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ROLE_DEACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(result.role),
    ipAddress,
  });

  return sanitize(result.role);
};

export const reactivateRole = async ({ id, actorId, ipAddress }) => {
  const existing = await roleRepository.findById(id);
  if (!existing) throw new AppError(404, "Role not found");
  if (existing.isActive) throw new AppError(409, "Role is already active");

  const updated = await roleRepository.setActive(id, true);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ROLE_REACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};
