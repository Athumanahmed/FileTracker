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
import * as positionRepository from "../repositories/position.repository.js";
import * as organizationRepository from "../repositories/organization.repository.js";

const SORTABLE_FIELDS = ["title", "code", "rank", "positionType", "createdAt", "updatedAt"];
const SEARCHABLE_FIELDS = ["title", "code"];

const sanitize = (position) => ({
  id: position.id,
  unitId: position.unitId,
  title: position.title,
  code: position.code,
  description: position.description,
  rank: position.rank,
  positionType: position.positionType,
  isHead: position.isHead,
  isActive: position.isActive,
  createdAt: position.createdAt,
  updatedAt: position.updatedAt,
});

/** Allowlisted snapshot for audit before/after -- keeps metadata small and stable. */
const snapshot = (position) => ({
  unitId: position.unitId,
  title: position.title,
  code: position.code,
  description: position.description,
  rank: position.rank,
  positionType: position.positionType,
  isHead: position.isHead,
  isActive: position.isActive,
});

const logAudit = ({ actorId, action, entityId, before, after, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "Position",
    entityId,
    description: `${action} (${entityId})`,
    metadata: { before: before ?? null, after: after ?? null },
    ipAddress,
  });

const rethrowAsConflict = (err) => {
  if (err.code === "P2002") {
    throw new AppError(409, "A position with this title or code already exists in this unit");
  }
  throw err;
};

const assertUnitActive = async (unitId) => {
  const unit = await organizationRepository.findUnitById(unitId);
  if (!unit) throw new AppError(422, "Selected unit does not exist");
  if (!unit.isActive) throw new AppError(422, "Selected unit is inactive");
};

/** Business rule: at most one active "head" position per unit. */
const assertSingleHead = async (unitId, wantsHead, excludePositionId) => {
  if (!wantsHead) return;

  const existingHead = await positionRepository.findActiveHeadInUnit(unitId, excludePositionId);
  if (existingHead) {
    throw new AppError(
      409,
      `Unit already has an active head position ('${existingHead.title}'). Deactivate or unset it first.`,
    );
  }
};

export const createPosition = async ({ actorId, payload, ipAddress }) => {
  await assertUnitActive(payload.unitId);

  const isHead = payload.isHead === true;
  await assertSingleHead(payload.unitId, isHead, null);

  const [existingCode, existingTitle] = await Promise.all([
    positionRepository.findByUnitAndCode(payload.unitId, payload.code),
    positionRepository.findByUnitAndTitle(payload.unitId, payload.title),
  ]);

  if (existingCode) throw new AppError(409, "A position with this code already exists in this unit");
  if (existingTitle) throw new AppError(409, "A position with this title already exists in this unit");

  let position;
  try {
    position = await positionRepository.create({
      unitId: payload.unitId,
      title: payload.title,
      code: payload.code,
      description: payload.description || null,
      rank: payload.rank,
      positionType: payload.positionType,
      isHead,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.POSITION_CREATED,
    entityId: position.id,
    before: null,
    after: snapshot(position),
    ipAddress,
  });

  return sanitize(position);
};

export const getPositionById = async (id) => {
  const position = await positionRepository.findById(id);
  if (!position) throw new AppError(404, "Position not found");
  return sanitize(position);
};

export const listPositions = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "rank");
  const isActive = parseBooleanFilter(query.isActive);

  const where = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(query.unitId ? { unitId: query.unitId } : {}),
    ...(query.positionType ? { positionType: query.positionType } : {}),
    ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
  };

  const [items, total] = await Promise.all([
    positionRepository.findMany({ where, orderBy, skip, take }),
    positionRepository.count(where),
  ]);

  return { items: items.map(sanitize), meta: buildPaginationMeta(total, page, limit) };
};

/** unitId is immutable after creation -- same reasoning as Unit's departmentId. */
export const updatePosition = async ({ id, actorId, payload, ipAddress }) => {
  const existing = await positionRepository.findById(id);
  if (!existing) throw new AppError(404, "Position not found");

  if (payload.unitId && payload.unitId !== existing.unitId) {
    throw new AppError(422, "A position cannot be moved to a different unit");
  }

  if (payload.code && payload.code !== existing.code) {
    const conflict = await positionRepository.findByUnitAndCode(existing.unitId, payload.code);
    if (conflict) throw new AppError(409, "A position with this code already exists in this unit");
  }
  if (payload.title && payload.title !== existing.title) {
    const conflict = await positionRepository.findByUnitAndTitle(existing.unitId, payload.title);
    if (conflict) throw new AppError(409, "A position with this title already exists in this unit");
  }

  const nextIsHead = payload.isHead !== undefined ? payload.isHead === true : existing.isHead;
  if (nextIsHead && !existing.isHead) {
    await assertSingleHead(existing.unitId, true, id);
  }

  let updated;
  try {
    updated = await positionRepository.update(id, {
      title: payload.title ?? existing.title,
      code: payload.code ?? existing.code,
      description: payload.description !== undefined ? payload.description : existing.description,
      rank: payload.rank ?? existing.rank,
      positionType: payload.positionType ?? existing.positionType,
      isHead: nextIsHead,
    });
  } catch (err) {
    rethrowAsConflict(err);
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.POSITION_UPDATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};

/**
 * Soft delete. Blocked while any active user still holds this position --
 * Positions are the leaf of the org hierarchy, so this is the last stop
 * for the "no active children" chain that starts at Department.
 */
export const deactivatePosition = async ({ id, actorId, ipAddress }) => {
  const existing = await positionRepository.findById(id);
  if (!existing) throw new AppError(404, "Position not found");
  if (!existing.isActive) throw new AppError(409, "Position is already inactive");

  const result = await positionRepository.deactivateIfNoActiveUsers(id);

  if (result.blocked) {
    throw new AppError(
      409,
      `Cannot deactivate: position still has ${result.activeUsers} active user(s) assigned. Reassign them first.`,
    );
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.POSITION_DEACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(result.position),
    ipAddress,
  });

  return sanitize(result.position);
};

export const reactivatePosition = async ({ id, actorId, ipAddress }) => {
  const existing = await positionRepository.findById(id);
  if (!existing) throw new AppError(404, "Position not found");
  if (existing.isActive) throw new AppError(409, "Position is already active");

  const unit = await organizationRepository.findUnitById(existing.unitId);
  if (!unit || !unit.isActive) {
    throw new AppError(409, "Cannot reactivate: the parent unit is inactive");
  }

  // Someone else may have become the unit's active head while this
  // position was deactivated -- re-check before restoring headship.
  if (existing.isHead) {
    await assertSingleHead(existing.unitId, true, id);
  }

  const updated = await positionRepository.setActive(id, true);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.POSITION_REACTIVATED,
    entityId: id,
    before: snapshot(existing),
    after: snapshot(updated),
    ipAddress,
  });

  return sanitize(updated);
};
