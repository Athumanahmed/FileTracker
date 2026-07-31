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
import * as departmentRepository from "../repositories/department.repository.js";

const SORTABLE_FIELDS = ["name", "code", "createdAt", "updatedAt"];
const SEARCHABLE_FIELDS = ["name", "code"];

const sanitize = (department) => ({
  id: department.id,
  name: department.name,
  code: department.code,
  description: department.description,
  isActive: department.isActive,
  createdAt: department.createdAt,
  updatedAt: department.updatedAt,
});

/** Allowlisted snapshot for audit before/after -- keeps metadata small and stable. */
const snapshot = (department) => ({
  name: department.name,
  code: department.code,
  description: department.description,
  isActive: department.isActive,
});

const logAudit = ({ actorId, action, entityId, before, after, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "Department",
    entityId,
    description: `${action} (${entityId})`,
    metadata: { before: before ?? null, after: after ?? null },
    ipAddress,
  });

/** Translates a Prisma unique-constraint violation into a clean, field-aware 409. */
const rethrowAsConflict = (err) => {
  if (err.code === "P2002") {
    throw new AppError(409, `A department with this ${err.meta?.target?.[0] || "value"} already exists`);
  }
  throw err;
};

export const createDepartment = async ({ actorId, payload, ipAddress }) => {
  const [existingName, existingCode] = await Promise.all([
    departmentRepository.findByName(payload.name),
    departmentRepository.findByCode(payload.code),
  ]);

  if (existingName) throw new AppError(409, "A department with this name already exists");
  if (existingCode) throw new AppError(409, "A department with this code already exists");

  let department;
  try {
    department = await departmentRepository.create({
      name: payload.name,
      code: payload.code,
      description: payload.description || null,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.DEPARTMENT_CREATED,
    entityId: department.id,
    before: null,
    after: snapshot(department),
    ipAddress,
  });

  return sanitize(department);
};

export const getDepartmentById = async (id) => {
  const department = await departmentRepository.findById(id);
  if (!department) throw new AppError(404, "Department not found");
  return sanitize(department);
};

export const listDepartments = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "name");
  const isActive = parseBooleanFilter(query.isActive);

  const where = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
  };

  const [items, total] = await Promise.all([
    departmentRepository.findMany({ where, orderBy, skip, take }),
    departmentRepository.count(where),
  ]);

  return { items: items.map(sanitize), meta: buildPaginationMeta(total, page, limit) };
};

export const updateDepartment = async ({ id, actorId, payload, ipAddress }) => {
  const existing = await departmentRepository.findById(id);
  if (!existing) throw new AppError(404, "Department not found");

  if (payload.name && payload.name !== existing.name) {
    const conflict = await departmentRepository.findByName(payload.name);
    if (conflict) throw new AppError(409, "A department with this name already exists");
  }
  if (payload.code && payload.code !== existing.code) {
    const conflict = await departmentRepository.findByCode(payload.code);
    if (conflict) throw new AppError(409, "A department with this code already exists");
  }

  let updated;
  try {
    updated = await departmentRepository.update(id, {
      name: payload.name ?? existing.name,
      code: payload.code ?? existing.code,
      description: payload.description !== undefined ? payload.description : existing.description,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.DEPARTMENT_UPDATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};

/**
 * Soft delete. Blocked while the department still has active units or
 * active users -- deactivating out from under them would silently orphan
 * live organizational data. Never a hard delete: Department rows are
 * referenced by Unit/User throughout the system.
 */
export const deactivateDepartment = async ({ id, actorId, ipAddress }) => {
  const existing = await departmentRepository.findById(id);
  if (!existing) throw new AppError(404, "Department not found");
  if (!existing.isActive) throw new AppError(409, "Department is already inactive");

  const result = await departmentRepository.deactivateIfNoActiveChildren(id);

  if (result.blocked) {
    throw new AppError(
      409,
      `Cannot deactivate: department still has ${result.activeUnits} active unit(s) and ${result.activeUsers} active user(s). Reassign or deactivate them first.`,
    );
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.DEPARTMENT_DEACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(result.department),
    ipAddress,
  });

  return sanitize(result.department);
};

export const reactivateDepartment = async ({ id, actorId, ipAddress }) => {
  const existing = await departmentRepository.findById(id);
  if (!existing) throw new AppError(404, "Department not found");
  if (existing.isActive) throw new AppError(409, "Department is already active");

  const updated = await departmentRepository.setActive(id, true);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.DEPARTMENT_REACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};
