import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import { assertCanManageTarget } from "./userManagementContext.service.js";

const sanitize = (user) => ({
  id: user.id,
  username: user.username,
  status: user.status,
  isActive: user.isActive,
  updatedAt: user.updatedAt,
});

const logAudit = ({ actorId, action, targetId, description, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "User",
    entityId: targetId,
    description,
    ipAddress,
  });

/**
 * Deactivation also kills every live session/refresh token for the target
 * (see user.repository.js) -- a deactivated account shouldn't stay signed
 * in on a device it was already logged into.
 */
export const deactivateUser = async ({ actorId, targetUserId, ipAddress }) => {
  const { actor, target } = await assertCanManageTarget({ actorId, targetUserId });

  if (!target.isActive) {
    throw new AppError(409, "User account is already inactive");
  }

  const updated = await userRepository.deactivateWithSessionRevocation(target.id, actor.id);

  await logAudit({
    actorId: actor.id,
    action: AUDIT_ACTIONS.USER_DEACTIVATED,
    targetId: target.id,
    description: `Deactivated account for ${target.username}`,
    ipAddress,
  });

  return sanitize(updated);
};

export const activateUser = async ({ actorId, targetUserId, ipAddress }) => {
  const { actor, target } = await assertCanManageTarget({ actorId, targetUserId });

  if (target.isActive) {
    throw new AppError(409, "User account is already active");
  }

  const updated = await userRepository.activate(target.id, actor.id);

  await logAudit({
    actorId: actor.id,
    action: AUDIT_ACTIONS.USER_ACTIVATED,
    targetId: target.id,
    description: `Activated account for ${target.username}`,
    ipAddress,
  });

  return sanitize(updated);
};

/**
 * Admin-initiated lock via User.status -- distinct from the automatic,
 * temporary lockedUntil-based lockout the login flow applies after
 * repeated failed attempts (see auth.service.js). This one is persistent
 * until explicitly unlocked, and also revokes existing sessions.
 */
export const lockUser = async ({ actorId, targetUserId, ipAddress }) => {
  const { actor, target } = await assertCanManageTarget({ actorId, targetUserId });

  if (target.status === "LOCKED") {
    throw new AppError(409, "User account is already locked");
  }

  const updated = await userRepository.lockWithSessionRevocation(target.id, actor.id);

  await logAudit({
    actorId: actor.id,
    action: AUDIT_ACTIONS.USER_LOCKED,
    targetId: target.id,
    description: `Locked account for ${target.username}`,
    ipAddress,
  });

  return sanitize(updated);
};

/** Clears both the admin-set LOCKED status and any lingering automatic lockedUntil/failedLoginAttempts state. */
export const unlockUser = async ({ actorId, targetUserId, ipAddress }) => {
  const { actor, target } = await assertCanManageTarget({ actorId, targetUserId });

  if (target.status !== "LOCKED") {
    throw new AppError(409, "User account is not locked");
  }

  const updated = await userRepository.unlock(target.id, actor.id);

  await logAudit({
    actorId: actor.id,
    action: AUDIT_ACTIONS.USER_UNLOCKED,
    targetId: target.id,
    description: `Unlocked account for ${target.username}`,
    ipAddress,
  });

  return sanitize(updated);
};
