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
 * OTP reset) ends the same way: rotate the hash, clear lockout state,
 * record history, kill every existing session/refresh token, and
 * audit-log it -- all inside one transaction so a failure anywhere rolls
 * back the whole thing. Flow-specific extra writes (e.g. deleting a
 * redeemed OTP row) run inside the same transaction via `extraWrites`.
 */
export const applyPasswordChange = ({
  userId,
  passwordHash,
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
        mustChangePassword: false,
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
        userId,
        action: auditAction,
        entity: "User",
        entityId: userId,
        description: auditDescription,
        ipAddress,
      },
    });
  });
