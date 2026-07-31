import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { generateDefaultPassword } from "../utils/generatePassword.js";
import { hashPassword } from "./password.service.js";
import { applyPasswordChange } from "../repositories/password.repository.js";
import { assertCanManageTarget } from "./userManagementContext.service.js";

/**
 * Admin-triggered password reset. Reuses the exact same transactional
 * password-change primitive as force-change-password and forgot-password
 * (hash rotation, history, session/token revocation, mustChangePassword
 * reset to true) -- the only difference is who triggered it and that the
 * new password is server-generated rather than user-chosen, shown back to
 * the admin exactly once to relay out of band.
 */
export const resetPasswordByAdmin = async ({ actorId, targetUserId, ipAddress }) => {
  const { actor, target } = await assertCanManageTarget({ actorId, targetUserId });

  const newPassword = generateDefaultPassword();
  const passwordHash = await hashPassword(newPassword);

  await applyPasswordChange({
    userId: target.id,
    actorId: actor.id,
    passwordHash,
    mustChangePassword: true,
    ipAddress,
    auditAction: AUDIT_ACTIONS.USER_PASSWORD_RESET_BY_ADMIN,
    auditDescription: `Password reset for ${target.username} by administrator`,
  });

  return { userId: target.id, username: target.username, newPassword };
};
