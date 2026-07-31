import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { normalizePhoneNumber } from "./phone.service.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as organizationRepository from "../repositories/organization.repository.js";
import { assertCanManageTarget } from "./userManagementContext.service.js";

const sanitize = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  profileImage: user.profileImage,
  departmentId: user.departmentId,
  unitId: user.unitId,
  positionId: user.positionId,
  updatedAt: user.updatedAt,
});

/** Allowlisted snapshot for audit before/after. */
const snapshot = (user) => ({
  email: user.email,
  phoneNumber: user.phoneNumber,
  profileImage: user.profileImage,
  departmentId: user.departmentId,
  unitId: user.unitId,
  positionId: user.positionId,
});

/**
 * Validates department/unit/position changes as one consistent set --
 * each level must belong to the one above it, and the actor's own scope
 * gates which levels they're even allowed to touch. Client-supplied ids
 * are never trusted blindly, only ever checked against real records.
 */
const resolveOrganizationalFields = async ({ actor, scopeType, target, payload }) => {
  const departmentChanging =
    payload.departmentId !== undefined && payload.departmentId !== target.departmentId;
  const unitChanging = payload.unitId !== undefined && payload.unitId !== target.unitId;
  const positionChanging = payload.positionId !== undefined && payload.positionId !== target.positionId;

  if (departmentChanging && scopeType !== "GLOBAL") {
    throw new AppError(422, "You are not permitted to change this user's department");
  }

  let departmentId = target.departmentId;
  if (departmentChanging) {
    const department = await organizationRepository.findDepartmentById(payload.departmentId);
    if (!department || !department.isActive) {
      throw new AppError(422, "Selected department does not exist or is inactive");
    }
    departmentId = department.id;
  }

  if (unitChanging && scopeType === "UNIT" && payload.unitId !== actor.unitId) {
    throw new AppError(422, "You are not permitted to change this user's unit");
  }

  let unitId = target.unitId;
  if (unitChanging) {
    if (payload.unitId === null) {
      unitId = null;
    } else {
      const unit = await organizationRepository.findUnitById(payload.unitId);
      if (!unit || !unit.isActive || unit.departmentId !== departmentId) {
        throw new AppError(422, "Selected unit does not exist, is inactive, or does not belong to the selected department");
      }
      unitId = unit.id;
    }
  }

  let positionId = target.positionId;
  if (positionChanging) {
    if (payload.positionId === null) {
      positionId = null;
    } else {
      const position = await userRepository.findPositionById(payload.positionId);
      if (!position || !position.isActive || position.unitId !== unitId) {
        throw new AppError(422, "Selected position does not exist, is inactive, or does not belong to the selected unit");
      }
      positionId = position.id;
    }
  } else if (unitChanging && positionId) {
    // Unit changed but position wasn't explicitly touched -- if the
    // user's existing position doesn't belong to the new unit, it can't
    // be silently kept (User.positionId must always belong to User.unitId).
    const currentPosition = await userRepository.findPositionById(positionId);
    if (!currentPosition || currentPosition.unitId !== unitId) {
      positionId = null;
    }
  }

  return { departmentId, unitId, positionId };
};

/**
 * Administrative update of another user's organizational assignment and
 * contact details. Role assignment is intentionally NOT handled here --
 * see userRoleAssignment.service.js -- and neither is activation/locking/
 * password reset, each of which has its own dedicated module.
 */
export const updateUserByAdmin = async ({ actorId, targetUserId, payload, ipAddress }) => {
  const { actor, actingRoleCode, scopeType, target } = await assertCanManageTarget({
    actorId,
    targetUserId,
    allowSelf: true, // e.g. a SYSTEM_ADMIN moving themselves into a newly created department
  });

  const { departmentId, unitId, positionId } = await resolveOrganizationalFields({
    actor,
    scopeType,
    target,
    payload,
  });

  const phoneNumber =
    payload.phoneNumber !== undefined ? normalizePhoneNumber(payload.phoneNumber) : target.phoneNumber;

  if (payload.email && payload.email !== target.email) {
    const conflict = await userRepository.findUserByEmail(payload.email);
    if (conflict) throw new AppError(409, "Email is already registered");
  }
  if (phoneNumber !== target.phoneNumber) {
    const conflict = await userRepository.findUserByPhoneNumber(phoneNumber);
    if (conflict) throw new AppError(409, "Phone number is already registered");
  }

  let updated;
  try {
    updated = await userRepository.update(target.id, {
      email: payload.email ?? target.email,
      phoneNumber,
      profileImage: payload.profileImage !== undefined ? payload.profileImage || null : target.profileImage,
      departmentId,
      unitId,
      positionId,
      updatedById: actor.id,
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new AppError(409, `An account with this ${err.meta?.target?.[0] || "value"} already exists`);
    }
    throw err;
  }

  await authRepository.createAuditLog({
    userId: actor.id,
    action: AUDIT_ACTIONS.USER_ADMIN_UPDATED,
    entity: "User",
    entityId: target.id,
    description: `Administratively updated user ${target.username}`,
    metadata: { before: snapshot(target), after: snapshot(updated) },
    ipAddress,
  });

  return sanitize(updated);
};
