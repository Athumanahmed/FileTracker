import redis from "../config/redis.js";

/**
 * Named TTL tiers, mirroring queryConfig.js's STALE_TIME on the client --
 * keeping server and client cache windows in the same ballpark avoids one
 * masking the other (a server cache outliving the client's own staleness
 * window would mean the client refetches for nothing; a much shorter
 * server TTL would mean the client's "fresh" data was already stale).
 */
export const CACHE_TTL = {
  // Dashboard stat cards / summaries -- matches client/src/utils/queryConfig.js's
  // STALE_TIME.SHORT (60s) exactly.
  SHORT: 60,
  // Charts and performance breakdowns -- change slower, checked less often.
  // Matches STALE_TIME.LONG (5 min) exactly.
  LONG: 5 * 60,
};

/**
 * Cache-aside wrapper: GET from Redis, parse and return on a hit;
 * otherwise run `computeFn` (the real Postgres query, unchanged), write
 * the result back with the given TTL, and return it either way.
 *
 * Never the source of truth: a Redis failure on read OR write is
 * swallowed and treated as a miss -- the caller always gets a correct,
 * freshly-computed result even if Redis is completely unavailable, same
 * "cache is disposable, Postgres is authoritative" contract as
 * permissionCache.repository.js (Phase 2).
 */
export const cached = async (key, ttlSeconds, computeFn) => {
  try {
    const raw = await redis.get(key);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    // Treat a read failure (Redis down, bad data) as a miss, not an error.
  }

  const result = await computeFn();

  try {
    await redis.set(key, JSON.stringify(result), "EX", ttlSeconds);
  } catch {
    // Best-effort -- a write failure just means the next call misses too.
  }

  return result;
};
