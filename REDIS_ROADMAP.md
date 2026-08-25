# Redis Enhancement Roadmap

A step-by-step plan for introducing Redis into the backend, in order of
value-to-risk. Each phase is independent and shippable on its own — do not
start Phase 2 before Phase 1 is done and verified, since Phase 1
establishes the shared Redis client every later phase reuses.

## How to use this document

- Work top to bottom. Each phase has a **Status** line — update it as you go:
  `Not Started` -> `In Progress` -> `Done`.
- Each phase has a **Verify** section. Don't mark a phase `Done` until every
  item in it is actually checked, not just "the code compiles."
- Check off the `[ ]` boxes under **Steps** as you complete them, so a
  half-finished phase is easy to resume.
- If a phase turns out to be more trouble than it's worth once you're in
  it, that's a valid outcome — note why under its **Status** line and move
  on. This is a roadmap, not a contract.

---

## Progress Overview

| Phase | Enhancement | Status |
|---|---|---|
| 0 | Redis infrastructure (client + local instance) | Done |
| 1 | Rate limiting store | Done |
| 2 | Permission check cache | Done |
| 3 | Dashboard / report KPI cache | Done |
| 4 (stretch) | Session store migration | Not Started |

---

## Phase 0 — Redis Infrastructure

**Status:** Done — added to both `docker-compose.dev.yml` and
`docker-compose.yml` (so this works the same on the VPS), `ioredis` +
`config/redis.js` in place, verified against a real container.

### Goal
Get a real Redis instance running locally and a shared client the rest of
the app can import, without touching any feature code yet. Every later
phase depends on this.

### Why
There is currently no Redis anywhere in this codebase (`grep -r redis
package.json` returns nothing). Windows has no official native Redis
build, so — unlike Postgres, which you run natively — this needs to run
in Docker, matching the pattern `docker-compose.dev.yml` already uses for
`db` and `minio`.

### Steps
- [x] Added a `redis` service to `docker-compose.dev.yml`, alongside `db`
      and `minio` — port `6379` exposed to the host for local
      `redis-cli`/tooling access, no volume (disposable cache, never
      source of truth — losing it on a container restart is harmless by
      design; Phase 4 revisits this assumption if you ever get there).
- [x] Added the same `redis` service to `docker-compose.yml` (VPS/prod) —
      **deliberately no port exposed to the host here**. Redis has no
      auth configured, so on a VPS it must stay reachable only from other
      containers on the compose network (`backend` reaches it as
      `redis:6379`), never from the public internet. This is the one
      difference between the dev and prod service definitions.
- [x] `cd server && npm install ioredis rate-limit-redis` (installed both
      now since Phase 1 immediately needs the second one too).
- [x] Added `REDIS_URL=redis://localhost:6379` to `server/.env` and
      `server/.env.example`, and `REDIS_URL: redis://redis:6379` (the
      in-network service name) to the `backend` service's `environment`
      block in **both** compose files, plus `redis: condition:
      service_healthy` under `depends_on` in both.
- [x] Created `server/config/redis.js`, mirroring `config/prisma.js`'s
      singleton pattern (survives nodemon hot-reloads without leaking
      connections). Note: the original draft here assumed connecting
      eagerly (no `lazyConnect`) was the right default -- Phase 1's own
      testing found that assumption wrong for this app specifically (see
      Phase 1's "Graceful degradation" section) and the file now uses
      `lazyConnect: true` plus an explicit `connectNow()` helper instead.
      Treat this file's final shape as defined by Phase 1, not this step.

### Verify
- [x] `docker ps` shows the Redis container healthy.
- [x] `docker exec FileTracker-redis redis-cli ping` -> `PONG`.
- [x] Starting the server logs no Redis connection errors.
- [x] Smoke test (`node -e "import('./config/redis.js').then(async ({default:r}) => { await r.set('smoke','ok'); console.log(await r.get('smoke')); process.exit(0); })"`)
      printed `ok` against a real container.

### Rollback
Stop the container, remove the compose service block, `npm uninstall
ioredis`, delete `config/redis.js`. Nothing else in the app references it
yet, so this is a clean revert.

---

## Phase 1 — Rate Limiting Store

**Status:** Not Started

### Goal
Move `express-rate-limit`'s counters from in-memory to Redis, so limits
survive restarts and are correct if the app ever runs as more than one
process.

### Why
`server/middlewares/rateLimiter.js` defines 7 limiters (`globalLimiter`,
`loginLimiter`, `refreshLimiter`, `forgotPasswordLimiter`,
`verifyResetOtpLimiter`, `resendResetOtpLimiter`, `resetPasswordLimiter`,
`forceChangePasswordLimiter`) — none pass a `store` option, so all use the
library's default in-memory `Map`. Two concrete problems today:
- Every `nodemon` restart during dev silently resets every counter.
- If this is ever deployed behind more than one Node process (even just
  PM2 cluster mode, not a full multi-server setup), each process counts
  independently — a "5 attempts" limit becomes "5 × process count."

### Steps
- [ ] `npm install rate-limit-redis` (in `server/`)
- [ ] In `rateLimiter.js`, import the shared client from Phase 0 and
      `RedisStore` from `rate-limit-redis`:
      ```js
      import { RedisStore } from "rate-limit-redis";
      import redis from "../config/redis.js";

      const makeStore = (prefix) =>
        new RedisStore({
          sendCommand: (...args) => redis.call(...args),
          prefix: `rl:${prefix}:`,
        });
      ```
- [x] Added `store: makeStore(<prefix>)` to each of the 7 limiter
      definitions (`global`, `login`, `refresh`, `forgot-password`,
      `verify-reset-otp`, `resend-reset-otp`, `reset-password`,
      `force-change-password`). Every other option (`windowMs`, `max`,
      `keyGenerator`, `handler`) left exactly as-is — this phase changed
      storage, not behavior.
- [x] Each limiter has its own distinct prefix — confirmed no key
      collisions (see Verify below).

### Verify
- [x] Triggered the login limiter for real: 10 failed logins as
      `rl-test-user` succeeded through to a 422 (validation, expected),
      the 11th and 12th returned 429. **Killed and restarted the actual
      node process**, then immediately retried the same user — still
      429, confirming the counter survived the restart (this is the
      exact failure mode Phase 1 exists to fix; before this change, that
      retry would have gone through since the in-memory Map resets on
      every process start).
- [x] Confirmed a *different* username (`someone-else`) was unaffected
      by `rl-test-user`'s limit (422, not 429) — per-user keying still
      correct.
- [x] `redis-cli --scan --pattern 'rl:*'` showed `rl:login:...` and
      `rl:global:...` keys appearing as requests were made; cleared the
      test keys afterward.
- [x] Rate-limit behavior (limits, windows, 429 error shape) unchanged
      from a client's perspective, confirmed by the identical response
      body/status codes seen before and after this phase.

### Graceful degradation (Redis unavailable) — not in the original plan,
### added after testing surfaced real failure modes
The original plan assumed `store: makeStore(...)` alone was the whole
phase. Testing "what happens if Redis is down" (mentioned only as a
one-line Verify item) surfaced three separate, real bugs, each masking
the next once fixed:

1. **`passOnStoreError: true` added to every limiter.** Without it, a
   Redis error rejected the request outright (500) instead of letting it
   through — confirmed by stopping Redis and watching login 500 instead
   of degrading.
2. **`config/redis.js` tuned for fast, bounded failure**
   (`maxRetriesPerRequest: 1`, `commandTimeout: 300`, `connectTimeout:
   3000`, `lazyConnect: true`) instead of ioredis's defaults, which retry
   with backoff and can leave a command waiting several seconds — or
   longer — before it fails. `lazyConnect` specifically exists because
   creating the client *eagerly*, competing with server.js's own startup
   burst (Prisma pool init, MinIO SDK, ~20 route modules importing, cron
   registration), could leave the initial connection stuck indefinitely
   in this environment, never producing an error or reaching "ready" at
   all — confirmed with a standalone repro script (same client config,
   nothing else competing) connecting in milliseconds every time, while
   the real server's instance did not.
3. **`connectNow()` (in `config/redis.js`) + a top-level `await
   connectNow()` in `rateLimiter.js`, before any limiter is created.**
   `rate-limit-redis` loads its Lua scripts' SHA once per store and
   caches that promise for the store's entire lifetime, with no retry on
   anything but a NOSCRIPT error. If that one-time load raced the same
   startup burst and timed out under `commandTimeout`'s short budget, the
   store was permanently poisoned — every request after it failed the
   same way forever, even once the connection was demonstrably healthy
   (confirmed: Redis reachable, a fresh standalone client connected
   fine, yet the running server's requests kept failing). Explicitly
   settling the connection (or its failure) before any store exists
   fixes this at the source, and lets `commandTimeout` stay short for
   *ordinary* commands instead of needing a multi-second budget to cover
   a one-time cost that isn't actually on the per-request path.

Verified end to end after all three fixes, from a clean process restart
with Redis healthy throughout: 10 requests pass, 11th/12th correctly
429, keys visible in Redis. Then, on that same already-warm process,
stopped Redis mid-session: every request degraded to pass-through in
under 1 second (vs. 5-8+ seconds, or hanging outright, before fix #3).

**Known residual limitation, not chased further:** self-healing
reconnection *without* a process restart, after Redis comes back up
mid-session, did not reliably reproduce within this session's testing —
worth being aware of, but not confirmed as a real defect either (this
session ran Redis through many rapid stop/remove/recreate cycles back to
back, which is not representative of a normal single restart on a VPS).
What *is* solidly verified, repeatedly: a full backend restart always
reconnects cleanly. If Redis restarts independently on the VPS and rate
limiting seems stuck in pass-through mode afterward, restarting the
backend container is the known-reliable fix — `docker compose restart
backend`.

### Rollback
Remove the `store` option (and `passOnStoreError`) from each limiter,
remove the `await connectNow()` line from `rateLimiter.js`. No schema, no
data migration — safe to revert at any time.

---

## Phase 2 — Permission Check Cache

**Status:** Done

### Goal
Cache the result of `userHasPermission` so most permission-gated requests
resolve from Redis instead of a Postgres join, while never letting a
stale cache grant a permission a user no longer has.

### Why
`server/middlewares/authorize.js` calls `authRepository.userHasPermission`
on **every** permission-gated route — which is nearly the entire API
surface (every `authorize("SOME.PERMISSION")` you see across
`routes/*.js`). That function
(`server/repositories/auth.repository.js:233`) runs a live
`UserRole -> Role -> RolePermission -> Permission` count query each time.
A user's permission set only changes on a handful of specific actions
(role assignment/removal, role-permission sync), so this is almost pure
redundant work today.

### Steps
- [x] Cache shape: the user's **full permission code set**, one Redis
      `SET` per user (`perm:<userId>`) — one Postgres query populates
      everything that user needs, `authorize()` does a plain array
      `.includes()` against an already-fetched set. A one-member sentinel
      (`__none__`, filtered back out on read) represents "cached, this
      user genuinely holds zero permissions" so it's never confused with
      "not cached at all" — the naive `SMEMBERS`-only approach can't tell
      those apart, since `SADD` requires at least one member and an empty
      result is ambiguous either way.
- [x] Added `repositories/permissionCache.repository.js` (kept separate
      from the Postgres-only `auth.repository.js`, as the plan's
      alternative suggested) — `getCachedPermissionCodes`,
      `setCachedPermissionCodes`, `invalidatePermissionCache` (one user),
      `invalidatePermissionCacheForUsers` (many, for role-level changes).
      Every function swallows its own Redis errors and treats them as
      "not cached" / "best-effort write failed" — never throws into the
      caller.
- [x] Added `findPermissionCodesForUser(userId)` to `auth.repository.js`,
      right beside `userHasPermission` (same isActive rules on role and
      permission) — the actual cache-miss query. `userHasPermission`
      itself is kept, unused now, specifically so the Rollback path below
      stays a one-line revert.
- [x] `authorize()` in `middlewares/authorize.js` rewritten to the
      cache-aside pattern: cache hit → use it; miss → query Postgres via
      `findPermissionCodesForUser`, populate the cache, then check.
- [x] Invalidation wired into every place that changes what a user can
      do:
      - `userRoleAssignment.service.js` — `assignRoleToUser` /
        `removeRoleFromUser`, single-user `invalidatePermissionCache`.
      - `rolePermission.service.js` — `assignPermission`,
        `revokePermission`, `syncRolePermissions`, each via a shared
        `invalidateCacheForRoleHolders(roleId)` helper (new
        `findUserIdsByRoleId` in `user.repository.js` + the
        multi-user invalidator).
      - `role.service.js` — `deactivateRole` / `reactivateRole`, same
        role-holders helper (deactivate's practical effect is usually a
        no-op, since it's already blocked while any *active* user holds
        the role — kept anyway for the inactive-holder edge case, and
        because it's cheap).

### Verify
- [x] Logged in as a real test user (Director), hit a `FILES.READ`-gated
      route — confirmed via `redis-cli SMEMBERS perm:<userId>` that the
      cache populated with exactly that role's real permission set on
      the first request.
- [x] **The test that actually matters**: revoked `FILES.READ` from the
      DIRECTOR role (via `rolePermission.service.js#revokePermission`,
      going through the real invalidation path, not a direct DB edit) —
      the *very next* request from that same logged-in user was
      rejected (403) immediately, no TTL wait. Re-granted the permission
      back — access returned on the next request, cache repopulated
      correctly. Restored both the permission and (separately tested)
      role-assignment invalidation state to exactly what they were
      before testing.
- [x] Also verified the *other* invalidation path (single-user, not
      role-wide): assigned an extra role directly to a logged-in user via
      `userRoleAssignment.service.js#assignRoleToUser` — cache key was
      deleted immediately, and the next request's repopulated set
      included the new role's permissions. Removed the role again to
      restore original state.
- [x] Stopped Redis mid-session and re-hit the gated route repeatedly:
      every request still returned the *correct* authorization result
      (200 for a route the user can access) — degraded to a live
      Postgres check every time, bounded latency (~1-1.6s per request,
      not hanging or growing), never a 500. Restarted Redis and confirmed
      caching resumed normally afterward.

### Rollback
Revert `authorize()` to call `authRepository.userHasPermission` directly
(exactly as it did before this phase). The cache repository and every
`invalidate*` call site become dead code you can remove independently —
no data migration risk since Redis here holds nothing authoritative.

---

## Phase 3 — Dashboard / Report KPI Cache

**Status:** Done

### Goal
Cache the expensive aggregate queries behind the Admin/Director/Registry
dashboards and the Reports module, so a page people refresh often doesn't
re-scan the same data every time.

### Why
`report.service.js#getDashboardKpis` and the aggregate functions in
`dashboard.service.js` (`getAdminSummary`, `getRecentActivity`, the audit
log listing added recently) all recompute from Postgres on every request.
None of this needs to be fresh to the second — a stat card that's 30-60
seconds stale is indistinguishable to a human from one that's live, but
the query cost difference is real once there's real data volume.

### Steps
- [x] `server/utils/cache.js`: shared `cached(key, ttlSeconds, computeFn)`
      helper + `CACHE_TTL` tiers, deliberately matching
      `client/src/utils/queryConfig.js`'s `STALE_TIME` values exactly —
      `SHORT: 60` (stat cards/summaries), `LONG: 5 * 60` (charts/
      performance breakdowns). Same "never the source of truth" contract
      as Phase 2's permission cache: a Redis read OR write failure is
      swallowed and treated as a miss — `computeFn`'s own errors (e.g. a
      real `AppError`) are deliberately *not* caught, so they still
      propagate to the caller as normal, and a failed computation is
      never accidentally cached.
- [x] Cache keys include every parameter that changes the result, keyed
      on the *resolved* scope where one already exists in the function
      (e.g. `scopedDepartmentId` from `resolveScopedDepartmentId`) rather
      than raw `actorId` — this means every `SYSTEM_ADMIN`/`DIRECTOR`
      requesting the same unscoped view shares one `kpis:dashboard:all`
      entry instead of one each, while an `HOD` scoped to a department
      gets `kpis:dashboard:<departmentId>`, confirmed as genuinely
      different keys against the running app (see Verify). Where no
      scope-resolution step already existed (`getScopedSummary`/
      `getScopedRecentActivity`), keyed by `actorId` directly instead —
      simpler, still correct, just slightly less cache-sharing between
      peers in the same department/unit.
- [x] Wrapped, all via the shared helper:
      - `report.service.js`: `getDashboardKpis` (SHORT);
        `getDepartmentPerformance`, `getOfficerPerformance`,
        `getRegistrationsOverTime` (LONG).
      - `dashboard.service.js`: `getAdminSummary` (global key, SHORT),
        `getRecentActivity` (global+limit, SHORT), `getScopedSummary`,
        `getScopedRecentActivity` (actorId-keyed, SHORT).
      - `getStatusDistribution` was deliberately **not** wrapped —
        confirmed it has no client caller at all right now (dead API
        surface), so there's nothing to gain from caching it yet.
- [x] `listAuditLogsForAdmin` left untouched, per plan — near-live by
      design, too many distinct filter combinations for a cache to earn
      its cost.

### Verify
- [x] Logged in as Director (unscoped) and HOD (department-scoped, real
      test users, real login) and hit the KPI endpoint from each —
      confirmed via `redis-cli --scan --pattern 'kpis:*'` that they
      produced two genuinely separate keys (`kpis:dashboard:all` vs.
      `kpis:dashboard:<the HOD's real departmentId>`), not one shared
      entry — this is the one place a wrong key would silently leak data
      between actors, so checked directly rather than assuming the key
      design was right.
- [x] Hit the Director's endpoint a second time and confirmed, via
      `redis-cli TTL`, that the countdown kept decreasing rather than
      resetting (a cache write would have bumped it back up to 60) —
      proof the second call was actually served from the cache, not
      recomputed.
- [x] Registered a real test file (bumping the true file count by one),
      confirmed the dashboard **still showed the old, stale count**
      immediately after — proof the cache is genuinely doing its job, not
      accidentally being bypassed. Waited for the key to expire
      (`redis-cli TTL` → `-2`), requested again — correctly reflected the
      new file. Cleaned up the test file afterward.
- [x] Stopped Redis mid-session, hit the KPI endpoint repeatedly — still
      returned correct results (200, correct numbers) every time, ~2-3s
      per request (two Redis fail-fast round trips now stack per
      request: the permission cache from Phase 2, then this phase's KPI
      cache) rather than hanging or erroring. Restarted Redis and
      confirmed caching resumed normally.

### Rollback
Remove the `cached(...)` wrapper from each function (unindent its body
back to the top level) and delete `utils/cache.js`. No schema, no data
migration — safe to revert at any time, same as every other phase.

---

## Phase 4 (Stretch / Future) — Session Store Migration

**Status:** Not Started — do not start this until Phases 1-3 are done and
you actually feel the need for it.

### Why this is different from the others
Every phase above uses Redis as a pure cache: if Redis disappears, the app
falls back to Postgres and keeps working, just slower. Sessions are
different — `UserSession` (checked on every `authenticate()` call in
`middlewares/authenticate.js`) is currently the actual source of truth for
"is this session still valid," used for revocation (logout, logout-all,
admin-forced deactivation killing sessions). Moving this to Redis makes
Redis a second source of truth, not just a cache, which means:
- Redis needs real persistence (AOF or RDB) — the "cache is disposable"
  assumption from Phases 0-3 no longer holds.
- Session revocation logic (`deactivateWithSessionRevocation`,
  `lockWithSessionRevocation`, `logoutAllDevices`) needs careful
  reworking, not just a cache wrapper.

This is a genuine architectural change, not an optimization pass. Only
take it on if request volume actually makes the current
`sessionService.getActiveSession` / `touchSession` Postgres calls a
measured bottleneck — don't do it speculatively.

### If you do pursue it later
Write it as its own separate plan when you get there, informed by
whatever Phases 1-3 taught you about this app's actual Redis usage
patterns — don't pre-plan it now on top of an otherwise-cache-only setup.

---

## Notes for whoever picks this up mid-way

- The shared client from Phase 0 (`server/config/redis.js`) is the only
  thing every other phase depends on. Everything else is additive and
  independently revertible.
- Every phase after 0 follows the same shape: **cache-aside with a TTL,
  explicit invalidation where correctness requires it, and a Postgres
  fallback on any Redis failure.** If a future addition to this app wants
  Redis for something and doesn't fit that shape, think hard about
  whether it belongs in this roadmap or needs its own design doc (Phase 4
  is the one item here that already didn't fit, which is why it's called
  out separately).
- If Phase 2 or 3 introduces anything that does **one-time setup work
  against Redis** (not just a plain per-request `GET`/`SET`) — e.g.
  registering a Lua script, warming a cache at boot — treat that the same
  way Phase 1 ended up treating `rate-limit-redis`'s script loading:
  `await connectNow()` from `config/redis.js` before that setup runs, so
  it never races the app's own startup burst. A plain `GET`/`SET` cache
  read doesn't need this — `commandTimeout` alone bounds it fine, and a
  timeout there just means one cache miss, not a permanently poisoned
  store.
