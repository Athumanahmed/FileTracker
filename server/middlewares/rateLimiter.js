import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis, { connectNow } from "../config/redis.js";
import { securityConfig } from "../config/security.js";

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

// Settle the connection (or its failure) *before* any RedisStore below
// runs its own one-time init -- see connectNow's own comment in
// config/redis.js for why that ordering specifically matters here.
// Top-level await: this module (and therefore server.js, which imports it
// near the top of its own chain) doesn't finish loading until this
// resolves, which is exactly the point -- every limiter below is created
// only once the connection outcome (success or failure) is already known.
await connectNow();

/**
 * Backs every limiter below with Redis instead of express-rate-limit's
 * in-memory default -- counters now survive a server restart and stay
 * correct if this ever runs as more than one process (PM2 cluster mode, a
 * multi-instance deploy). `prefix` keeps each limiter's key space
 * separate in Redis (rl:login:*, rl:refresh:*, ...) so they can never
 * collide with each other.
 */
const makeStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `rl:${prefix}:`,
  });

// Every limiter below also sets passOnStoreError: true -- if Redis is
// unreachable, a request must be let through, not rejected/hung. Rate
// limiting is defense-in-depth on top of the DB-level account lockout
// (see auth.service.js) and other real checks; it must never become a
// single point of failure that takes login (or the whole API, via
// globalLimiter) down just because the cache layer is briefly down.
// Confirmed by actually stopping Redis and observing the failure mode
// without this option: requests 500'd / hung instead of degrading.

/** Applied app-wide as a baseline defense against generic abuse/scraping. */
export const globalLimiter = rateLimit({
  windowMs: securityConfig.globalRateLimitWindowMs,
  max: securityConfig.globalRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: makeStore("global"),
  passOnStoreError: true,
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
  store: makeStore("login"),
  passOnStoreError: true,
});

export const refreshLimiter = rateLimit({
  windowMs: securityConfig.refreshRateLimitWindowMs,
  max: securityConfig.refreshRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: makeStore("refresh"),
  passOnStoreError: true,
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
  store: makeStore("forgot-password"),
  passOnStoreError: true,
});

export const verifyResetOtpLimiter = rateLimit({
  windowMs: securityConfig.verifyOtpRateLimitWindowMs,
  max: securityConfig.verifyOtpRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: phoneKeyGenerator,
  store: makeStore("verify-reset-otp"),
  passOnStoreError: true,
});

export const resendResetOtpLimiter = rateLimit({
  windowMs: securityConfig.resendOtpRateLimitWindowMs,
  max: securityConfig.resendOtpRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: phoneKeyGenerator,
  store: makeStore("resend-reset-otp"),
  passOnStoreError: true,
});

// No phone number available at this stage (identity comes from the reset
// token in the Authorization header), so this is IP-only.
export const resetPasswordLimiter = rateLimit({
  windowMs: securityConfig.resetPasswordRateLimitWindowMs,
  max: securityConfig.resetPasswordRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: makeStore("reset-password"),
  passOnStoreError: true,
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
  store: makeStore("force-change-password"),
  passOnStoreError: true,
});

/**
 * Runs after `authenticate`, so req.user is already populated -- keyed
 * per user (not IP) so one heavy searcher never throttles unrelated
 * users on the same NAT/office network. Global Search is a fan-out query
 * hit on every keystroke by a typeahead UI, so this caps a scripted
 * scrape without getting in the way of a real person typing.
 */
export const searchLimiter = rateLimit({
  windowMs: securityConfig.searchRateLimitWindowMs,
  max: securityConfig.searchRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.user?.userId || ipKeyGenerator(req.ip),
  store: makeStore("search"),
  passOnStoreError: true,
});
