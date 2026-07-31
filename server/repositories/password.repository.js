import prisma from "../config/prisma.js";

/**
 * Revokes every live refresh token and deactivates every active session
 * for a user. Takes a Prisma client (either the base `prisma` or an
 * in-flight `tx`) rather than opening its own transaction, so it can be
 * composed into a larger transaction (password change) or run standalone
 * (logout-all) without nesting `$transaction` calls -- Prisma doesn't
 * support that.
 */
export const revokeAllSessionsAndTokens = (client, userId) =>
  Promise.all([
    client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    client.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }),
  ]);

/**
 * Every password-changing flow (first-login force-change, forgot-password
 * OTP reset, admin-triggered reset) ends the same way: rotate the hash,
 * clear lockout state, record history, kill every existing session/
 * refresh token, and audit-log it -- all inside one transaction so a
 * failure anywhere rolls back the whole thing. Flow-specific extra writes
 * (e.g. deleting a redeemed OTP row) run inside the same transaction via
 * `extraWrites`.
 *
 * `actorId` defaults to `userId` for the self-service callers (force-
 * change-password, forgot-password reset), where the person whose
 * password changed and the person who triggered the change are the same.
 * Admin-triggered resets pass a distinct `actorId` so the audit log
 * correctly attributes the action to the admin, not the target user.
 *
 * `mustChangePassword` defaults to false (the self-service callers' new
 * password was user-chosen, no further forced change needed). Admin
 * resets pass true -- the generated password is temporary, same as a
 * newly-created account.
 */
export const applyPasswordChange = ({
  userId,
  actorId = userId,
  passwordHash,
  mustChangePassword = false,
  ipAddress,
  auditAction,
  auditDescription,
  extraWrites,
}) =>
  prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        mustChangePassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await tx.passwordHistory.create({ data: { userId, passwordHash } });

    await revokeAllSessionsAndTokens(tx, userId);

    if (extraWrites) {
      await extraWrites(tx);
    }

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: auditAction,
        entity: "User",
        entityId: userId,
        description: auditDescription,
        ipAddress,
      },
    });
  });
