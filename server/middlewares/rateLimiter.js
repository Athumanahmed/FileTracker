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
