import * as authRepository from "../repositories/auth.repository.js";
import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { parseDurationToMs } from "../utils/duration.js";
import { securityConfig } from "../config/security.js";
import { jwtConfig } from "../config/jwt.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { signAccessToken } from "./jwt.service.js";
import * as refreshTokenService from "./refreshToken.service.js";
import * as sessionService from "./session.service.js";

// Same message for "no such user" and "wrong password" -- never lets a
// caller distinguish whether a username exists.
const GENERIC_AUTH_ERROR = "Invalid Credentials";

// Unlike GENERIC_AUTH_ERROR, these deliberately DO tell the caller their
// account exists but can't sign in right now, and why -- a deactivated/
// locked/suspended account is administrative status, not a guessed
// credential, so there's nothing for this messaging to leak that the
// account holder doesn't already know (they know their own username).
const ACCOUNT_STATUS_MESSAGES = {
  PENDING_ACTIVATION: "Your account has not been activated yet. Please contact your administrator.",
  SUSPENDED: "Your account has been suspended. Please contact your administrator.",
  DISABLED: "Your account has been disabled. Please contact your administrator.",
  ARCHIVED: "Your account has been archived. Please contact your administrator.",
};

const isAccountLocked = (user) =>
  Boolean(user.lockedUntil && user.lockedUntil > new Date());

/** Strict allowlist -- new User columns never leak to clients by default. */
const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  status: user.status,
  mustChangePassword: user.mustChangePassword,
});

const logAudit = (userId, action, description, ipAddress) =>
  authRepository.createAuditLog({
    userId,
    action,
    entity: "User",
    entityId: userId,
    description,
    ipAddress,
  });

/**
 * Records the failed attempt, increments the counter, and locks the
 * account once the configured threshold is crossed.
 */
const handleFailedPassword = async (user, ipAddress) => {
  const updated = await authRepository.incrementFailedLoginAttempts(user.id);

  if (updated.failedLoginAttempts >= securityConfig.accountLockMaxAttempts) {
    const lockedUntil = new Date(
      Date.now() + securityConfig.accountLockDurationMs,
    );
    await authRepository.lockAccount(user.id, lockedUntil);
  }

  await authRepository.createLoginAttempt({
    userId: user.id,
    username: user.username,
    ipAddress,
    successful: false,
  });
  await logAudit(
    user.id,
    AUDIT_ACTIONS.LOGIN_FAILED,
    "Invalid password",
    ipAddress,
  );
};

export const login = async ({ username, password, ipAddress, userAgent }) => {
  const user = await authRepository.findUserByUsername(username);

  if (!user) {
    // No user row to attach the attempt to -- log by username only.
    await authRepository.createLoginAttempt({
      username,
      ipAddress,
      successful: false,
    });
    throw new AppError(401, GENERIC_AUTH_ERROR);
  }

  if (!user.isActive) {
    await authRepository.createLoginAttempt({
      userId: user.id,
      username,
      ipAddress,
      successful: false,
    });
    await logAudit(
      user.id,
      AUDIT_ACTIONS.LOGIN_FAILED,
      "Login attempt on deactivated account",
      ipAddress,
    );
    throw new AppError(403, "Your account has been deactivated. Please contact your administrator.");
  }

  // Admin-set persistent lock (see userAccountStatus.service.js#lockUser) --
  // distinct from isAccountLocked() below, which is the automatic, temporary
  // lockedUntil-based lockout the failed-attempts counter applies.
  if (user.status === "LOCKED") {
    await authRepository.createLoginAttempt({
      userId: user.id,
      username,
      ipAddress,
      successful: false,
    });
    await logAudit(
      user.id,
      AUDIT_ACTIONS.LOGIN_FAILED,
      "Login attempt on admin-locked account",
      ipAddress,
    );
    throw new AppError(423, "Your account has been locked by an administrator. Please contact your administrator to unlock it.");
  }

  if (user.status !== "ACTIVE") {
    await authRepository.createLoginAttempt({
      userId: user.id,
      username,
      ipAddress,
      successful: false,
    });
    await logAudit(
      user.id,
      AUDIT_ACTIONS.LOGIN_FAILED,
      `Login attempt on ${user.status} account`,
      ipAddress,
    );
    throw new AppError(
      403,
      ACCOUNT_STATUS_MESSAGES[user.status] || "Your account is not active. Please contact your administrator.",
    );
  }

  if (isAccountLocked(user)) {
    await authRepository.createLoginAttempt({
      userId: user.id,
      username,
      ipAddress,
      successful: false,
    });
    await logAudit(
      user.id,
      AUDIT_ACTIONS.LOGIN_FAILED,
      "Login attempt on locked account",
      ipAddress,
    );
    throw new AppError(
      423,
      "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
    );
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    await handleFailedPassword(user, ipAddress);
    throw new AppError(401, GENERIC_AUTH_ERROR);
  }

  // Success: clear any prior failed-attempt/lock state.
  await authRepository.resetFailedLoginAttempts(user.id);
  await authRepository.updateLastLogin(user.id);

  const session = await sessionService.createSession({
    userId: user.id,
    ipAddress,
    userAgent,
    ttlMs: parseDurationToMs(jwtConfig.refreshExpiresIn),
  });

  const accessToken = signAccessToken({
    userId: user.id,
    username: user.username,
    sessionId: session.id,
  });
  const refreshToken = await refreshTokenService.issueRefreshToken({
    userId: user.id,
    username: user.username,
    sessionId: session.id,
  });

  await authRepository.createLoginAttempt({
    userId: user.id,
    username,
    ipAddress,
    successful: true,
  });
  await logAudit(
    user.id,
    AUDIT_ACTIONS.LOGIN_SUCCESS,
    "User logged in successfully",
    ipAddress,
  );

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
};

export const refreshAccessToken = async (
  rawRefreshToken,
  { ipAddress } = {},
) => {
  if (!rawRefreshToken) {
    throw new AppError(401, "Refresh token is required");
  }

  const { accessToken, refreshToken, user } =
    await refreshTokenService.rotateRefreshToken(rawRefreshToken);

  await logAudit(
    user.id,
    AUDIT_ACTIONS.TOKEN_REFRESH,
    "Access token refreshed",
    ipAddress,
  );

  return { accessToken, refreshToken, user: sanitizeUser(user) };
};

export const logout = async ({ sessionId, userId, ipAddress }) => {
  await sessionService.endSession(sessionId);
  await logAudit(userId, AUDIT_ACTIONS.LOGOUT, "User logged out", ipAddress);
};

/** Safe, device-facing shape of a session -- never exposes userId or internal ids beyond the session's own. */
const sanitizeSession = (session, currentSessionId) => ({
  id: session.id,
  deviceName: session.deviceName,
  browser: session.browser,
  operatingSystem: session.operatingSystem,
  ipAddress: session.ipAddress,
  lastActivityAt: session.lastActivityAt,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
  isCurrent: session.id === currentSessionId,
});

export const listSessions = async ({ userId, currentSessionId }) => {
  const sessions = await sessionService.listActiveSessions(userId);
  return sessions.map((session) => sanitizeSession(session, currentSessionId));
};

/**
 * Revokes one specific session -- e.g. a user noticing an unrecognized
 * device in their session list and kicking it off. Ownership is checked
 * here (not just existence) so one user can never revoke another user's
 * session by guessing/enumerating session ids.
 */
export const revokeSession = async ({ userId, sessionId, ipAddress }) => {
  const session = await sessionService.getSessionById(sessionId);

  if (!session || session.userId !== userId) {
    throw new AppError(404, "Session not found");
  }

  await sessionService.endSession(sessionId);
  await logAudit(
    userId,
    AUDIT_ACTIONS.SESSION_REVOKED,
    "User revoked a session",
    ipAddress,
  );
};

/** "Logout everywhere": ends every session (including the one making this call), forcing a full re-login on every device. */
export const logoutAll = async ({ userId, ipAddress }) => {
  await sessionService.endAllSessions(userId);
  await logAudit(
    userId,
    AUDIT_ACTIONS.LOGOUT_ALL,
    "User logged out of all sessions",
    ipAddress,
  );
};

/** Role -> { id, name, code }, dropping the nested permission join rows. */
const mapRoles = (userRoles) =>
  userRoles.map(({ role }) => ({
    id: role.id,
    name: role.name,
    code: role.code,
  }));

/** Flattens every role's permissions into a single deduplicated code list. */
const extractPermissionCodes = (userRoles) => {
  const codes = new Set();
  for (const { role } of userRoles) {
    for (const { permission } of role.permissions) {
      codes.add(permission.code);
    }
  }
  return [...codes];
};

/**
 * Builds the GET /auth/me response shape from the raw repository record --
 * flattening the UserRole -> Role -> RolePermission -> Permission chain
 * into `roles` and a deduplicated `permissions` code list.
 */
const buildUserProfile = (user) => {
  const { roles, ...profile } = user;

  return {
    ...profile,
    roles: mapRoles(roles),
    permissions: extractPermissionCodes(roles),
  };
};

/**
 * Identity comes solely from the validated JWT/session (see `authenticate`
 * middleware) -- the userId is never taken from a request param or body.
 */
export const getCurrentUser = async (userId) => {
  const user = await authRepository.findAuthenticatedUser(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return buildUserProfile(user);
};

// Exposed for completeness / future use by a password-change endpoint --
// not wired to a route yet since one wasn't part of this module's scope.
export { hashPassword };

// How many prior passwords (most recent first) a new password is checked
// against, per the "can't reuse your last 5 passwords" policy.
const PASSWORD_HISTORY_REUSE_LIMIT = 5;

/**
 * Mandatory first-login (or admin-forced) password change. Distinct from
 * forgot-password: the caller is already an authenticated session (see
 * `authenticate`'s mustChangePassword gate), proving current-password
 * ownership is what replaces phone/OTP verification here.
 */
export const forceChangePassword = async ({
  userId,
  currentPassword,
  newPassword,
  ipAddress,
}) => {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const currentPasswordValid = await verifyPassword(
    currentPassword,
    user.passwordHash,
  );
  if (!currentPasswordValid) {
    throw new AppError(401, "Current password is incorrect");
  }

  const recentPasswords = await authRepository.findRecentPasswordHistory(
    userId,
    PASSWORD_HISTORY_REUSE_LIMIT,
  );

  for (const record of recentPasswords) {
    const reused = await verifyPassword(newPassword, record.passwordHash);
    if (reused) {
      throw new AppError(
        422,
        "New password must not match any of your last 5 passwords",
      );
    }
  }

  const passwordHash = await hashPassword(newPassword);

  await authRepository.executeForceChangePassword({
    userId,
    passwordHash,
    ipAddress,
  });
};
