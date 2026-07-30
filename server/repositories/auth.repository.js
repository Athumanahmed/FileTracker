import prisma from "../config/prisma.js";

/**
 * Data-access layer for the auth module. Every Prisma call the module
 * makes lives here -- services never import the Prisma client directly.
 * All queries go through Prisma's parameterized query builder; raw SQL
 * (queryRawUnsafe) is never used.
 */

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const findUserByUsername = (username) =>
  prisma.user.findUnique({ where: { username } });

export const findUserById = (id) => prisma.user.findUnique({ where: { id } });

export const incrementFailedLoginAttempts = (userId) =>
  prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });

export const resetFailedLoginAttempts = (userId) =>
  prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

export const lockAccount = (userId, lockedUntil) =>
  prisma.user.update({
    where: { id: userId },
    data: { lockedUntil },
  });

export const updateLastLogin = (userId) =>
  prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

// ---------------------------------------------------------------------------
// UserSession
// ---------------------------------------------------------------------------

export const createSession = (data) => prisma.userSession.create({ data });

export const findActiveSessionById = (id) =>
  prisma.userSession.findFirst({
    where: { id, isActive: true, expiresAt: { gt: new Date() } },
  });

export const deactivateSession = (id) =>
  prisma.userSession.update({
    where: { id },
    data: { isActive: false },
  });

export const touchSessionActivity = (id) =>
  prisma.userSession.update({
    where: { id },
    data: { lastActivityAt: new Date() },
  });

// ---------------------------------------------------------------------------
// RefreshToken
// ---------------------------------------------------------------------------

export const createRefreshToken = (data) =>
  prisma.refreshToken.create({ data });

export const findActiveRefreshTokenByHash = (tokenHash) =>
  prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { session: true },
  });

export const revokeRefreshToken = (id) =>
  prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

export const revokeAllSessionRefreshTokens = (sessionId) =>
  prisma.refreshToken.updateMany({
    where: { sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

// ---------------------------------------------------------------------------
// LoginAttempt / AuditLog
// ---------------------------------------------------------------------------

export const createLoginAttempt = (data) =>
  prisma.loginAttempt.create({ data });

export const createAuditLog = (data) => prisma.auditLog.create({ data });

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

/**
 * Permissions are never cached on the token or hardcoded in middleware --
 * every check goes back to the database (Role -> RolePermission -> Permission).
 */
export const userHasPermission = async (userId, permissionCode) => {
  const count = await prisma.userRole.count({
    where: {
      userId,
      role: {
        isActive: true,
        permissions: {
          some: { permission: { code: permissionCode } },
        },
      },
    },
  });

  return count > 0;
};
