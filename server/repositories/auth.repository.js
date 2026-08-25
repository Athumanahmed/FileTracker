import prisma from "../config/prisma.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { applyPasswordChange, revokeAllSessionsAndTokens } from "./password.repository.js";

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

/**
 * Active users holding a specific role and/or position -- powers the
 * workflow engine's "who can I route this to" picker (see
 * workflowEngine.service.js#listEligibleTargets). Deliberately narrow: a
 * caller-facing list, not the admin user directory, so it returns only the
 * fields a picker needs, and only ever active accounts.
 */
export const findUsersByRoleOrPosition = ({ roleId, positionId }) =>
  prisma.user.findMany({
    where: {
      status: "ACTIVE",
      isActive: true,
      deletedAt: null,
      ...(roleId ? { roles: { some: { roleId } } } : {}),
      ...(positionId ? { positionId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { fullName: "asc" },
  });

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

/**
 * Fetches the profile fields exposed by GET /auth/me. Prisma `select`
 * enforces the allowlist at the query level -- passwordHash and every
 * other sensitive column are simply never read out of the database,
 * rather than being fetched and stripped afterwards.
 *
 * Only permissions granted by a currently active role are included, to
 * match the same active-role rule `userHasPermission` enforces.
 */
export const findAuthenticatedUser = (userId) =>
  prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      username: true,
      email: true,
      phoneNumber: true,
      firstName: true,
      middleName: true,
      lastName: true,
      fullName: true,
      profileImage: true,
      status: true,
      mustChangePassword: true,
      authenticationMethod: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      department: {
        select: { id: true, name: true, code: true },
      },
      unit: {
        select: { id: true, name: true, code: true },
      },
      position: {
        select: { id: true, title: true, code: true },
      },
      roles: {
        where: { role: { isActive: true } },
        select: {
          role: {
            select: {
              id: true,
              name: true,
              code: true,
              permissions: {
                where: { permission: { isActive: true } },
                select: {
                  permission: {
                    select: { code: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

// ---------------------------------------------------------------------------
// PasswordHistory
// ---------------------------------------------------------------------------

export const findRecentPasswordHistory = (userId, limit) =>
  prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

/**
 * Applies the mandatory first-login (or admin-forced) password change:
 * see applyPasswordChange for the shared transaction shape. No extra
 * writes beyond the common set -- unlike the OTP reset flow, there's no
 * side record to clean up here.
 */
export const executeForceChangePassword = ({ userId, passwordHash, ipAddress }) =>
  applyPasswordChange({
    userId,
    passwordHash,
    ipAddress,
    auditAction: AUDIT_ACTIONS.PASSWORD_CHANGED,
    auditDescription: "Password changed on first login (mandatory change)",
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

export const findSessionById = (id) => prisma.userSession.findUnique({ where: { id } });

export const findActiveSessionsByUserId = (userId) =>
  prisma.userSession.findMany({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { lastActivityAt: "desc" },
  });

/** Standalone "logout everywhere" -- same revocation logic the password-change flows use, just without a password update alongside it. */
export const deactivateAllUserSessionsAndTokens = (userId) =>
  prisma.$transaction((tx) => revokeAllSessionsAndTokens(tx, userId));

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
 *
 * Superseded as authorize()'s actual per-request check by
 * findPermissionCodesForUser below (see
 * repositories/permissionCache.repository.js's Redis cache-aside wrapper
 * around it) -- kept here, correct and unused, as the Redis roadmap's own
 * documented rollback path: revert authorize() to call this directly and
 * the cache becomes dead code you can remove independently.
 */
export const userHasPermission = async (userId, permissionCode) => {
  const count = await prisma.userRole.count({
    where: {
      userId,
      role: {
        isActive: true,
        permissions: {
          some: { permission: { code: permissionCode, isActive: true } },
        },
      },
    },
  });

  return count > 0;
};

/**
 * Every permission code the user's active roles grant, deduplicated --
 * same isActive rules as userHasPermission above (active role, active
 * permission), just resolved as one full set instead of one yes/no check
 * per call. This is what authorize() actually calls now, via
 * permissionCache.repository.js's cache-aside wrapper.
 */
export const findPermissionCodesForUser = async (userId) => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, role: { isActive: true } },
    select: {
      role: {
        select: {
          permissions: {
            where: { permission: { isActive: true } },
            select: { permission: { select: { code: true } } },
          },
        },
      },
    },
  });

  const codes = new Set();
  for (const { role } of userRoles) {
    for (const { permission } of role.permissions) {
      codes.add(permission.code);
    }
  }
  return [...codes];
};
