import redis from "../config/redis.js";

/**
 * Caches each user's full permission code set (not one key per
 * user+permission pair) -- one Postgres query populates everything a user
 * needs for their whole session, and authorize() becomes a plain array
 * lookup against an already-fetched set instead of a per-check round trip.
 *
 * Never the source of truth: every function here is best-effort. A Redis
 * read/write failure is swallowed and treated as "not cached" -- the
 * caller (authorize.js) falls through to the real Postgres query either
 * way, exactly as if Phase 2 didn't exist for that one request.
 */

const TTL_SECONDS = 5 * 60;
const keyFor = (userId) => `perm:${userId}`;

// SADD requires at least one member -- a user who genuinely holds zero
// permissions (a real, if rare, case) still needs a way to be recorded as
// "cached, empty" rather than indistinguishable from "never cached". This
// sentinel fills that one member slot and is filtered back out on read.
const EMPTY_SENTINEL = "__none__";

/** null means "not cached" (including "Redis is unavailable right now") -- both cases mean the caller should query Postgres. */
export const getCachedPermissionCodes = async (userId) => {
  try {
    const exists = await redis.exists(keyFor(userId));
    if (!exists) return null;

    const codes = await redis.smembers(keyFor(userId));
    return codes.filter((code) => code !== EMPTY_SENTINEL);
  } catch {
    return null;
  }
};

export const setCachedPermissionCodes = async (userId, codes) => {
  const key = keyFor(userId);
  const members = codes.length > 0 ? codes : [EMPTY_SENTINEL];

  try {
    await redis.multi().sadd(key, ...members).expire(key, TTL_SECONDS).exec();
  } catch {
    // Best-effort -- a write failure just means the next request misses
    // the cache again and re-populates it, same as if this call never ran.
  }
};

/** Called on every mutation that changes what a single user can do -- role assigned/removed on them specifically. */
export const invalidatePermissionCache = async (userId) => {
  try {
    await redis.del(keyFor(userId));
  } catch {
    // Best-effort -- the TTL above is the backstop if this fails.
  }
};

/** Called on every mutation that changes what a *role* grants -- every current holder's cached set is now stale. */
export const invalidatePermissionCacheForUsers = async (userIds) => {
  if (!userIds.length) return;
  try {
    await redis.del(...userIds.map(keyFor));
  } catch {
    // Best-effort -- the TTL above is the backstop if this fails.
  }
};
