import "dotenv/config";
import { parseDurationToMs } from "../utils/duration.js";

/**
 * All tunable brute-force / rate-limit / account-lock knobs live here so
 * nothing security-relevant is a magic number buried in a service file.
 */
export const securityConfig = {
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  accountLockMaxAttempts: Number(process.env.ACCOUNT_LOCK_MAX_ATTEMPTS) || 5,
  accountLockDurationMs: parseDurationToMs(
    process.env.ACCOUNT_LOCK_DURATION || "30m",
  ),

  loginRateLimitWindowMs: parseDurationToMs(
    process.env.LOGIN_RATE_LIMIT_WINDOW || "15m",
  ),
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,

  refreshRateLimitWindowMs: parseDurationToMs(
    process.env.REFRESH_RATE_LIMIT_WINDOW || "15m",
  ),
  refreshRateLimitMax: Number(process.env.REFRESH_RATE_LIMIT_MAX) || 30,

  globalRateLimitWindowMs: parseDurationToMs(
    process.env.GLOBAL_RATE_LIMIT_WINDOW || "15m",
  ),
  globalRateLimitMax: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 300,

  refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME || "eftms_refresh_token",
  csrfCookieName: process.env.CSRF_COOKIE_NAME || "eftms_csrf_token",
};
