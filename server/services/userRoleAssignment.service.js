import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { ADMIN_SCOPE_BY_ROLE } from "../config/organizationalHierarchy.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import {
  resolveActingRole,
  assertNoEscalation,
  assertTargetWithinScope,
  assertNoLateralOrUpwardTarget,
} from "./userScope.service.js";

/**
 * Assigning an existing user the HOD role requires the same authority as
 * creating an HOD in the first place -- so this resolves authority the
 * same way user.service.js's createUser does (resolveActingRole against
 * the SPECIFIC role code being granted), not the generic "actor's overall
 * best scope" used by activate/deactivate/lock/unlock/reset-password.
 * Those don't care which role is involved; this does.
 */
const resolveGrantAuthority = async ({ actorId, targetUserId, roleCode }) => {
  const actor = await authRepository.findUserById(actorId);
  if (!actor || actor.deletedAt || !actor.isActive || actor.status !== "ACTIVE") {
    throw new AppError(403, "Your account is not eligible to manage other users");
  }

  const target = await userRepository.findById(targetUserId);
  if (!target || target.deletedAt) {
    throw new AppError(404, "User not found");
  }

  if (target.id === actor.id) {
    throw new AppError(422, "You cannot perform this action on your own account");
  }

  const role = await userRepository.findRoleByCode(roleCode);
  if (!role || !role.isActive) {
    throw new AppError(422, "Selected role does not exist or is inactive");
  }

  const actorRoleCodes = await userRepository.findActiveRoleCodesForUser(actor.id);
  const actingRoleCode = resolveActingRole(actorRoleCodes, roleCode);
  assertNoEscalation(actingRoleCode, roleCode);

  const scopeType = ADMIN_SCOPE_BY_ROLE[actingRoleCode];
  assertTargetWithinScope({ actingRoleCode, scopeType, actor, targetUser: target });

  const targetRoleCodes = await userRepository.findActiveRoleCodesForUser(target.id);
  assertNoLateralOrUpwardTarget(actingRoleCode, targetRoleCodes);

  return { actor, target, role, targetRoleCodes };
};

export const assignRoleToUser = async ({ actorId, targetUserId, roleCode, ipAddress }) => {
  const { actor, target, role, targetRoleCodes } = await resolveGrantAuthority({
    actorId,
    targetUserId,
    roleCode,
  });

  if (targetRoleCodes.includes(roleCode)) {
    throw new AppError(409, "User already holds this role");
  }

  let assigned;
  try {
    assigned = await userRepository.assignRole(target.id, role.id);
  } catch (err) {
    if (err.code === "P2002") throw new AppError(409, "User already holds this role");
    throw err;
  }

  await authRepository.createAuditLog({
    userId: actor.id,
    action: AUDIT_ACTIONS.USER_ROLE_ASSIGNED,
    entity: "User",
    entityId: target.id,
    description: `Assigned role ${role.code} to ${target.username}`,
    metadata: { before: null, after: { roleCode: role.code } },
    ipAddress,
  });

  return { userId: target.id, roleId: role.id, roleCode: role.code, assignedAt: assigned.assignedAt };
};

/**
 * Removing a role requires the same authority as assigning it -- an HOD
 * who could grant SUPERVISOR can also revoke it, within their department.
 * Blocked if it would leave the user with zero active roles at all: full
 * de-provisioning is deactivateUser's job, not a side effect of this one.
 */
export const removeRoleFromUser = async ({ actorId, targetUserId, roleCode, ipAddress }) => {
  const { actor, target, role, targetRoleCodes } = await resolveGrantAuthority({
    actorId,
    targetUserId,
    roleCode,
  });

  if (!targetRoleCodes.includes(roleCode)) {
    throw new AppError(404, "User does not hold this role");
  }

  if (targetRoleCodes.length <= 1) {
    throw new AppError(
      409,
      "Cannot remove this user's only remaining role -- deactivate the account instead if that's the intent",
    );
  }

  await userRepository.removeRole(target.id, role.id);

  await authRepository.createAuditLog({
    userId: actor.id,
    action: AUDIT_ACTIONS.USER_ROLE_REMOVED,
    entity: "User",
    entityId: target.id,
    description: `Removed role ${role.code} from ${target.username}`,
    metadata: { before: { roleCode: role.code }, after: null },
    ipAddress,
  });

  return { userId: target.id, roleId: role.id, roleCode: role.code };
};
