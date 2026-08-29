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

  otpExpiryMs: parseDurationToMs(process.env.OTP_EXPIRY || "5m"),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,

  forgotPasswordRateLimitWindowMs: parseDurationToMs(
    process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW || "15m",
  ),
  forgotPasswordRateLimitMax: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX) || 3,

  verifyOtpRateLimitWindowMs: parseDurationToMs(
    process.env.VERIFY_OTP_RATE_LIMIT_WINDOW || "5m",
  ),
  verifyOtpRateLimitMax: Number(process.env.VERIFY_OTP_RATE_LIMIT_MAX) || 5,

  resendOtpRateLimitWindowMs: parseDurationToMs(
    process.env.RESEND_OTP_RATE_LIMIT_WINDOW || "15m",
  ),
  resendOtpRateLimitMax: Number(process.env.RESEND_OTP_RATE_LIMIT_MAX) || 3,

  resetPasswordRateLimitWindowMs: parseDurationToMs(
    process.env.RESET_PASSWORD_RATE_LIMIT_WINDOW || "15m",
  ),
  resetPasswordRateLimitMax: Number(process.env.RESET_PASSWORD_RATE_LIMIT_MAX) || 3,

  forceChangePasswordRateLimitWindowMs: parseDurationToMs(
    process.env.FORCE_CHANGE_PASSWORD_RATE_LIMIT_WINDOW || "15m",
  ),
  forceChangePasswordRateLimitMax: Number(process.env.FORCE_CHANGE_PASSWORD_RATE_LIMIT_MAX) || 5,

  // Global Search is a fan-out (files + citizens) query hit on every
  // keystroke by a typeahead UI -- generous enough for real typing with a
  // debounce in front of it, tight enough to cap a scripted scrape.
  searchRateLimitWindowMs: parseDurationToMs(process.env.SEARCH_RATE_LIMIT_WINDOW || "1m"),
  searchRateLimitMax: Number(process.env.SEARCH_RATE_LIMIT_MAX) || 30,

  // Public citizen file-tracking lookup. Keyed by IP -- generous enough
  // that a citizen mistyping their number or phone a handful of times is
  // never locked out, tight enough that walking sequential reference
  // numbers from one IP is throttled to a crawl.
  trackFileRateLimitWindowMs: parseDurationToMs(process.env.TRACK_FILE_RATE_LIMIT_WINDOW || "10m"),
  trackFileRateLimitMax: Number(process.env.TRACK_FILE_RATE_LIMIT_MAX) || 40,
};
