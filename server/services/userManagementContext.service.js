import { AppError } from "../utils/AppError.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as userScopeService from "./userScope.service.js";

/**
 * Shared by every module that lets one user act on another's account
 * (admin update, activate/deactivate/lock/unlock, password reset, role
 * assignment): loads the actor fresh from the DB, confirms they're
 * eligible to administer anyone at all, and resolves which organizational
 * scope they operate in. Never trusts anything from the JWT beyond identity.
 */
export const resolveActorContext = async (actorId) => {
  const actor = await authRepository.findUserById(actorId);
  if (!actor || actor.deletedAt || !actor.isActive || actor.status !== "ACTIVE") {
    throw new AppError(403, "Your account is not eligible to manage other users");
  }

  const actorRoleCodes = await userRepository.findActiveRoleCodesForUser(actor.id);
  const { actingRoleCode, scopeType } = userScopeService.resolveActorScope(actorRoleCodes);

  return { actor, actingRoleCode, scopeType };
};

export const loadTargetOrThrow = async (targetUserId) => {
  const target = await userRepository.findById(targetUserId);
  if (!target || target.deletedAt) {
    throw new AppError(404, "User not found");
  }
  return target;
};

/**
 * The full gate every account-management action runs before doing
 * anything: actor is eligible, target exists, target falls within the
 * actor's current scope, and the target isn't a peer or superior. Also
 * rejects acting on yourself through the admin path -- self-service
 * routes (profile update, force-change-password) exist for that.
 */
export const assertCanManageTarget = async ({ actorId, targetUserId, allowSelf = false }) => {
  const { actor, actingRoleCode, scopeType } = await resolveActorContext(actorId);
  const target = await loadTargetOrThrow(targetUserId);

  if (!allowSelf && target.id === actor.id) {
    throw new AppError(422, "You cannot perform this action on your own account");
  }

  userScopeService.assertTargetWithinScope({ actingRoleCode, scopeType, actor, targetUser: target });

  const targetRoleCodes = await userRepository.findActiveRoleCodesForUser(target.id);
  userScopeService.assertNoLateralOrUpwardTarget(actingRoleCode, targetRoleCodes);

  return { actor, actingRoleCode, scopeType, target, targetRoleCodes };
};
