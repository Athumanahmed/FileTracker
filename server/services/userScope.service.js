import { AppError } from "../utils/AppError.js";
import {
  ADMIN_SCOPE_BY_ROLE,
  ROLE_CREATION_MATRIX,
  ROLE_HIERARCHY_LEVEL,
} from "../config/organizationalHierarchy.js";
import * as organizationRepository from "../repositories/organization.repository.js";

// Same generic message for every "you can't do this" branch below -- the
// exact reason (wrong role, wrong scope, escalation attempt) is an
// internal detail a rejected request doesn't need broken out.
const NOT_PERMITTED = "You are not permitted to create this type of account";

/**
 * Among the creator's active roles, finds the one that actually grants
 * creation rights over `targetRoleCode`. If more than one role qualifies,
 * the highest-authority (lowest hierarchy level) one acts -- e.g. a user
 * who somehow holds both HOD and SUPERVISOR acts with HOD's authority.
 */
export const resolveActingRole = (creatorRoleCodes, targetRoleCode) => {
  const eligible = creatorRoleCodes
    .filter((code) => (ROLE_CREATION_MATRIX[code] || []).includes(targetRoleCode))
    .sort((a, b) => (ROLE_HIERARCHY_LEVEL[a] ?? 99) - (ROLE_HIERARCHY_LEVEL[b] ?? 99));

  if (eligible.length === 0) {
    throw new AppError(403, NOT_PERMITTED);
  }

  return eligible[0];
};

/**
 * Privilege-escalation guard, independent of the permission bit: the
 * target role must sit strictly below the acting role in the hierarchy.
 * The one allowed exception -- SYSTEM_ADMIN creating another SYSTEM_ADMIN
 * -- is a peer relationship gated entirely by its own rarely-granted
 * permission (USERS.CREATE.SUPER_ADMIN), not by this level check.
 *
 * Exported so the account-management modules (activate/deactivate/lock/
 * unlock/reset-password/assign-role/remove-role) can reuse the exact same
 * guard when acting on an *existing* user, not just at creation time.
 */
export const assertNoEscalation = (actingRoleCode, targetRoleCode) => {
  if (actingRoleCode === "SYSTEM_ADMIN" && targetRoleCode === "SYSTEM_ADMIN") {
    return;
  }

  const actingLevel = ROLE_HIERARCHY_LEVEL[actingRoleCode];
  const targetLevel = ROLE_HIERARCHY_LEVEL[targetRoleCode];

  if (targetLevel === undefined || actingLevel === undefined || targetLevel <= actingLevel) {
    throw new AppError(403, NOT_PERMITTED);
  }
};

/**
 * Derives the department/unit the new user will be assigned to. This is
 * the backend's sole source of truth for scope -- for DEPARTMENT/UNIT
 * scoped creators, client-supplied ids are never used to assign scope,
 * only checked against (and rejected loudly on mismatch, never silently
 * overwritten -- a mismatch is either a bug or a tampering attempt worth
 * surfacing, not hiding).
 */
export const resolveCreationScope = async ({
  creator,
  actingRoleCode,
  targetRoleCode,
  requestedDepartmentId,
  requestedUnitId,
}) => {
  assertNoEscalation(actingRoleCode, targetRoleCode);

  const scopeType = ADMIN_SCOPE_BY_ROLE[actingRoleCode];

  if (!scopeType || scopeType === "NONE") {
    throw new AppError(403, "Your role has no administrative scope to create accounts");
  }

  if (scopeType === "UNIT") {
    if (
      (requestedDepartmentId && requestedDepartmentId !== creator.departmentId) ||
      (requestedUnitId && requestedUnitId !== creator.unitId)
    ) {
      throw new AppError(422, "You are not permitted to specify a department or unit");
    }

    return { departmentId: creator.departmentId, unitId: creator.unitId };
  }

  if (scopeType === "DEPARTMENT") {
    if (requestedDepartmentId && requestedDepartmentId !== creator.departmentId) {
      throw new AppError(422, "You are not permitted to specify a different department");
    }

    let unitId = null;
    if (requestedUnitId) {
      const unit = await organizationRepository.findUnitById(requestedUnitId);
      if (!unit || !unit.isActive || unit.departmentId !== creator.departmentId) {
        throw new AppError(422, "Selected unit does not belong to your department");
      }
      unitId = unit.id;
    }

    return { departmentId: creator.departmentId, unitId };
  }

  // GLOBAL: client-supplied ids are legitimate input (no narrower scope to
  // enforce), but still validated for existence/active status.
  let departmentId = null;
  let unitId = null;

  if (requestedDepartmentId) {
    const department = await organizationRepository.findDepartmentById(requestedDepartmentId);
    if (!department || !department.isActive) {
      throw new AppError(422, "Selected department does not exist or is inactive");
    }
    departmentId = department.id;
  }

  if (requestedUnitId) {
    const unit = await organizationRepository.findUnitById(requestedUnitId);
    if (!unit || !unit.isActive || (departmentId && unit.departmentId !== departmentId)) {
      throw new AppError(
        422,
        "Selected unit does not exist, is inactive, or does not belong to the selected department",
      );
    }
    unitId = unit.id;
    departmentId = departmentId || unit.departmentId;
  }

  return { departmentId, unitId };
};

const NOT_PERMITTED_ON_TARGET = "You are not permitted to perform this action on this user";

/**
 * Among the actor's active roles, picks the one with administrative scope
 * (GLOBAL/DEPARTMENT/UNIT) and the highest authority (lowest hierarchy
 * level). Used by every account-management action (activate, deactivate,
 * lock, unlock, reset-password, admin update) to decide both "what scope
 * does this actor operate in" and, via its hierarchy level, "who counts as
 * beneath them" -- the same two questions resolveActingRole/assertNoEscalation
 * answer for creation, just without needing a specific target role code.
 */
export const resolveActorScope = (actorRoleCodes) => {
  const eligible = actorRoleCodes
    .filter((code) => ADMIN_SCOPE_BY_ROLE[code] && ADMIN_SCOPE_BY_ROLE[code] !== "NONE")
    .sort((a, b) => (ROLE_HIERARCHY_LEVEL[a] ?? 99) - (ROLE_HIERARCHY_LEVEL[b] ?? 99));

  if (eligible.length === 0) {
    throw new AppError(403, "Your role has no administrative scope to manage other accounts");
  }

  const actingRoleCode = eligible[0];
  return { actingRoleCode, scopeType: ADMIN_SCOPE_BY_ROLE[actingRoleCode] };
};

/**
 * Verifies an *existing* target user currently falls within the actor's
 * administrative reach. Unlike resolveCreationScope, this never derives or
 * changes anything -- it only answers "am I allowed to touch this person,
 * as they are right now."
 */
export const assertTargetWithinScope = ({ actingRoleCode, scopeType, actor, targetUser }) => {
  if (scopeType === "GLOBAL") return;

  if (scopeType === "DEPARTMENT") {
    if (!targetUser.departmentId || targetUser.departmentId !== actor.departmentId) {
      throw new AppError(403, NOT_PERMITTED_ON_TARGET);
    }
    return;
  }

  if (scopeType === "UNIT") {
    if (
      !targetUser.unitId ||
      targetUser.unitId !== actor.unitId ||
      targetUser.departmentId !== actor.departmentId
    ) {
      throw new AppError(403, NOT_PERMITTED_ON_TARGET);
    }
    return;
  }

  throw new AppError(403, NOT_PERMITTED_ON_TARGET);
};

/**
 * Defense-in-depth companion to assertTargetWithinScope: even if a target
 * somehow falls within the actor's department/unit (bad data, a future
 * scope change), the actor still can't act on a peer or superior -- e.g.
 * an HOD's department scope should never let them touch another HOD or a
 * Director who happens to share it.
 */
export const assertNoLateralOrUpwardTarget = (actingRoleCode, targetRoleCodes) => {
  const actingLevel = ROLE_HIERARCHY_LEVEL[actingRoleCode];
  const targetLevel = Math.min(
    ...targetRoleCodes.map((code) => ROLE_HIERARCHY_LEVEL[code] ?? 99),
    99,
  );

  if (actingLevel === undefined || targetLevel <= actingLevel) {
    throw new AppError(403, NOT_PERMITTED_ON_TARGET);
  }
};
