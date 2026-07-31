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
import * as unitRepository from "../repositories/unit.repository.js";
import * as organizationRepository from "../repositories/organization.repository.js";

const SORTABLE_FIELDS = ["name", "code", "createdAt", "updatedAt"];
const SEARCHABLE_FIELDS = ["name", "code"];

const sanitize = (unit) => ({
  id: unit.id,
  departmentId: unit.departmentId,
  name: unit.name,
  code: unit.code,
  description: unit.description,
  isActive: unit.isActive,
  createdAt: unit.createdAt,
  updatedAt: unit.updatedAt,
});

/** Allowlisted snapshot for audit before/after -- keeps metadata small and stable. */
const snapshot = (unit) => ({
  departmentId: unit.departmentId,
  name: unit.name,
  code: unit.code,
  description: unit.description,
  isActive: unit.isActive,
});

const logAudit = ({ actorId, action, entityId, before, after, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "Unit",
    entityId,
    description: `${action} (${entityId})`,
    metadata: { before: before ?? null, after: after ?? null },
    ipAddress,
  });

const rethrowAsConflict = (err) => {
  if (err.code === "P2002") {
    throw new AppError(409, "A unit with this name or code already exists in this department");
  }
  throw err;
};

export const createUnit = async ({ actorId, payload, ipAddress }) => {
  const department = await organizationRepository.findDepartmentById(payload.departmentId);
  if (!department) throw new AppError(422, "Selected department does not exist");
  if (!department.isActive) throw new AppError(422, "Selected department is inactive");

  const [existingCode, existingName] = await Promise.all([
    unitRepository.findByDepartmentAndCode(payload.departmentId, payload.code),
    unitRepository.findByDepartmentAndName(payload.departmentId, payload.name),
  ]);

  if (existingCode) throw new AppError(409, "A unit with this code already exists in this department");
  if (existingName) throw new AppError(409, "A unit with this name already exists in this department");

  let unit;
  try {
    unit = await unitRepository.create({
      departmentId: payload.departmentId,
      name: payload.name,
      code: payload.code,
      description: payload.description || null,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.UNIT_CREATED,
    entityId: unit.id,
    before: null,
    after: snapshot(unit),
    ipAddress,
  });

  return sanitize(unit);
};

export const getUnitById = async (id) => {
  const unit = await unitRepository.findById(id);
  if (!unit) throw new AppError(404, "Unit not found");
  return sanitize(unit);
};

export const listUnits = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "name");
  const isActive = parseBooleanFilter(query.isActive);

  const where = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
  };

  const [items, total] = await Promise.all([
    unitRepository.findMany({ where, orderBy, skip, take }),
    unitRepository.count(where),
  ]);

  return { items: items.map(sanitize), meta: buildPaginationMeta(total, page, limit) };
};

/** departmentId is immutable after creation -- see routes/unit.routes.js for why. */
export const updateUnit = async ({ id, actorId, payload, ipAddress }) => {
  const existing = await unitRepository.findById(id);
  if (!existing) throw new AppError(404, "Unit not found");

  if (payload.departmentId && payload.departmentId !== existing.departmentId) {
    throw new AppError(422, "A unit cannot be moved to a different department");
  }

  if (payload.code && payload.code !== existing.code) {
    const conflict = await unitRepository.findByDepartmentAndCode(existing.departmentId, payload.code);
    if (conflict) throw new AppError(409, "A unit with this code already exists in this department");
  }
  if (payload.name && payload.name !== existing.name) {
    const conflict = await unitRepository.findByDepartmentAndName(existing.departmentId, payload.name);
    if (conflict) throw new AppError(409, "A unit with this name already exists in this department");
  }

  let updated;
  try {
    updated = await unitRepository.update(id, {
      name: payload.name ?? existing.name,
      code: payload.code ?? existing.code,
      description: payload.description !== undefined ? payload.description : existing.description,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.UNIT_UPDATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};

/**
 * Soft delete. Blocked while the unit still has active positions or active
 * users -- mirrors Department's deactivation rule one level down the hierarchy.
 */
export const deactivateUnit = async ({ id, actorId, ipAddress }) => {
  const existing = await unitRepository.findById(id);
  if (!existing) throw new AppError(404, "Unit not found");
  if (!existing.isActive) throw new AppError(409, "Unit is already inactive");

  const result = await unitRepository.deactivateIfNoActiveChildren(id);

  if (result.blocked) {
    throw new AppError(
      409,
      `Cannot deactivate: unit still has ${result.activePositions} active position(s) and ${result.activeUsers} active user(s). Reassign or deactivate them first.`,
    );
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.UNIT_DEACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(result.unit),
    ipAddress,
  });

  return sanitize(result.unit);
};

export const reactivateUnit = async ({ id, actorId, ipAddress }) => {
  const existing = await unitRepository.findById(id);
  if (!existing) throw new AppError(404, "Unit not found");
  if (existing.isActive) throw new AppError(409, "Unit is already active");

  // An active unit under an inactive department is an inconsistent state --
  // block reactivation until the parent department is active again.
  const department = await organizationRepository.findDepartmentById(existing.departmentId);
  if (!department || !department.isActive) {
    throw new AppError(409, "Cannot reactivate: the parent department is inactive");
  }

  const updated = await unitRepository.setActive(id, true);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.UNIT_REACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};
