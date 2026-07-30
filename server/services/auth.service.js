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
const GENERIC_AUTH_ERROR = "Invalid username or password";

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
    const lockedUntil = new Date(Date.now() + securityConfig.accountLockDurationMs);
    await authRepository.lockAccount(user.id, lockedUntil);
  }

  await authRepository.createLoginAttempt({
    userId: user.id,
    username: user.username,
    ipAddress,
    successful: false,
  });
  await logAudit(user.id, AUDIT_ACTIONS.LOGIN_FAILED, "Invalid password", ipAddress);
};

export const login = async ({ username, password, ipAddress, userAgent }) => {
  const user = await authRepository.findUserByUsername(username);

  if (!user) {
    // No user row to attach the attempt to -- log by username only.
    await authRepository.createLoginAttempt({ username, ipAddress, successful: false });
    throw new AppError(401, GENERIC_AUTH_ERROR);
  }

  if (!user.isActive || user.status !== "ACTIVE") {
    await authRepository.createLoginAttempt({
      userId: user.id,
      username,
      ipAddress,
      successful: false,
    });
    await logAudit(user.id, AUDIT_ACTIONS.LOGIN_FAILED, "Account is not active", ipAddress);
    throw new AppError(401, GENERIC_AUTH_ERROR);
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
  await logAudit(user.id, AUDIT_ACTIONS.LOGIN_SUCCESS, "User logged in successfully", ipAddress);

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
};

export const refreshAccessToken = async (rawRefreshToken, { ipAddress } = {}) => {
  if (!rawRefreshToken) {
    throw new AppError(401, "Refresh token is required");
  }

  const { accessToken, refreshToken, user } =
    await refreshTokenService.rotateRefreshToken(rawRefreshToken);

  await logAudit(user.id, AUDIT_ACTIONS.TOKEN_REFRESH, "Access token refreshed", ipAddress);

  return { accessToken, refreshToken, user: sanitizeUser(user) };
};

export const logout = async ({ sessionId, userId, ipAddress }) => {
  await sessionService.endSession(sessionId);
  await logAudit(userId, AUDIT_ACTIONS.LOGOUT, "User logged out", ipAddress);
};

// Exposed for completeness / future use by a password-change endpoint --
// not wired to a route yet since one wasn't part of this module's scope.
export { hashPassword };
