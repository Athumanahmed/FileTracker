import "dotenv/config";
import Redis from "ioredis";

// Singleton, mirroring config/prisma.js's pattern -- survives nodemon
// hot-reloads in dev without leaking a new connection on every reload.
const redis =
  global.redis ||
  new Redis(process.env.REDIS_URL, {
    // Connect explicitly (see connectNow below), not implicitly on first
    // command and not eagerly at construction. Confirmed by testing:
    // creating this client with the default eager connect, during
    // server.js's own startup (Prisma pool init, MinIO SDK, ~20 route
    // modules importing, cron registration -- all sharing one event loop),
    // could leave the initial TCP handshake stuck in "connecting"
    // indefinitely -- never producing an error or reaching "ready" at all,
    // even with Redis healthy the whole time. The exact same client,
    // created standalone with nothing else competing at startup, connected
    // in milliseconds every time.
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    // Short and strict -- this is what actually bounds every *ordinary*
    // command's worst-case latency once the client is connected (e.g.
    // Redis dying mid-session). Safe to keep tight because connectNow
    // below absorbs the one-time, much slower cost of the *first*
    // connection attempt separately -- no ordinary command ever has to
    // also pay for establishing a connection under this budget.
    commandTimeout: 300,
    connectTimeout: 3000,
  });

// Redis backs caches and rate-limit counters here, never the source of
// truth for anything -- a connection error should degrade the features
// built on top of it (cache miss, fall through to Postgres), not crash
// the process. Logging is enough; nothing here should call process.exit.
redis.on("error", (err) => console.error("Redis error:", err.message));

if (process.env.NODE_ENV !== "production") {
  global.redis = redis;
}

/**
 * Connects (or confirms an already-established connection) before letting
 * a caller proceed, with its own generous, one-time budget -- separate
 * from commandTimeout above. This exists because of a real bug class
 * discovered in testing: rate-limit-redis loads its Lua scripts' SHA once,
 * the *first* time its RedisStore is used, and caches that promise for the
 * store's entire lifetime with no retry on anything but a NOSCRIPT error.
 * If that one call raced server.js's own startup burst and timed out
 * (which it reliably did under commandTimeout's short budget), the store
 * was permanently poisoned -- every request after it failed the exact
 * same way forever, even once the connection was demonstrably healthy.
 * Callers that create a Redis-backed store (rateLimiter.js today) should
 * `await connectNow()` first so their first real command always lands on
 * an already-"ready" client, or on a connection whose failure is already
 * known -- either way, never mid-attempt.
 */
export const connectNow = async () => {
  if (redis.status === "ready") return;
  try {
    await redis.connect();
  } catch (err) {
    console.error("Redis initial connection failed -- continuing in degraded (pass-through) mode:", err.message);
  }
};

export default redis;
