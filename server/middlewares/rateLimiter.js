import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { securityConfig } from "../config/security.js";

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

/** Applied app-wide as a baseline defense against generic abuse/scraping. */
export const globalLimiter = rateLimit({
  windowMs: securityConfig.globalRateLimitWindowMs,
  max: securityConfig.globalRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Network-layer brute-force throttle for /login, on top of (not instead of)
 * the DB-level account lockout. Keyed by IP + attempted username so one
 * noisy IP can't exhaust the limit for unrelated accounts sharing it (NAT,
 * office network), while a distributed attack against one account still
 * gets throttled per-account.
 */
export const loginLimiter = rateLimit({
  windowMs: securityConfig.loginRateLimitWindowMs,
  max: securityConfig.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.body?.username || "unknown"}`,
});

export const refreshLimiter = rateLimit({
  windowMs: securityConfig.refreshRateLimitWindowMs,
  max: securityConfig.refreshRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/** Keyed by IP + phone so one noisy IP can't exhaust the limit for unrelated phone numbers. */
const phoneKeyGenerator = (req) =>
  `${ipKeyGenerator(req.ip)}:${req.body?.phoneNumber || "unknown"}`;

export const forgotPasswordLimiter = rateLimit({
  windowMs: securityConfig.forgotPasswordRateLimitWindowMs,
  max: securityConfig.forgotPasswordRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: phoneKeyGenerator,
});

export const verifyResetOtpLimiter = rateLimit({
  windowMs: securityConfig.verifyOtpRateLimitWindowMs,
  max: securityConfig.verifyOtpRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: phoneKeyGenerator,
});

export const resendResetOtpLimiter = rateLimit({
  windowMs: securityConfig.resendOtpRateLimitWindowMs,
  max: securityConfig.resendOtpRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: phoneKeyGenerator,
});

// No phone number available at this stage (identity comes from the reset
// token in the Authorization header), so this is IP-only.
export const resetPasswordLimiter = rateLimit({
  windowMs: securityConfig.resetPasswordRateLimitWindowMs,
  max: securityConfig.resetPasswordRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Runs after `authenticate`, so req.user is already populated -- keyed by
 * IP + user id to throttle current-password brute-forcing against one
 * account without one noisy IP starving unrelated users on the same NAT.
 */
export const forceChangePasswordLimiter = rateLimit({
  windowMs: securityConfig.forceChangePasswordRateLimitWindowMs,
  max: securityConfig.forceChangePasswordRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.user?.userId || "unknown"}`,
});
