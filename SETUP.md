# EFTMS — Setup Guide

Electronic File Tracking & Management System, Tabora Municipal Council.

This is the single reference for taking the project from a fresh clone to a
running, fully seeded, ready-to-use application. Follow it top to bottom on a
new machine; use it as a lookup afterwards (env vars, seeded accounts,
common problems).

The whole application — PostgreSQL, MinIO, the API, and the frontend — runs
via Docker Compose. Nothing needs to be installed natively except Docker
itself.

## Which command do I run?

The recipe is **identical** in dev and on the VPS — the only thing that
changes is which compose file you point at. Three steps, always in this
order:

| Step | Local dev | VPS / production |
|---|---|---|
| 1. Bring the stack up | `docker compose -f docker-compose.dev.yml up -d --build` | `docker compose up -d --build` |
| 2. Run migrations | `docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy` | `docker compose exec backend npx prisma migrate deploy` |
| 3. Seed the database | `docker compose -f docker-compose.dev.yml exec backend npx prisma db seed` | `docker compose exec backend npx prisma db seed` (see caveat below) |

Same three commands everywhere — just add `-f docker-compose.dev.yml` when
you're developing locally, omit it on the VPS. Neither compose file runs
migrate/seed automatically on its own; you always run steps 2 and 3
yourself, right after step 1, on both dev and prod. That's the whole point
of keeping them identical: no hidden behavior that differs between where
you run it.

Step 3's caveat: `prisma db seed` also creates 6 test accounts with a known
password (`Postman@123`) — great for dev/staging, not something you want on
a server holding real citizens' data. Skip step 3 entirely on a real
production VPS, or only run it once for initial reference data (roles,
departments, categories, the `admin` account) and remove/relabel the test
accounts afterward. See [§4](#4-what-seeding-creates) for exactly what it
adds.

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Docker Desktop | any recent | provides both Docker Engine and Compose v2 |
| Git | any | |

That's it — Node.js, PostgreSQL, and MinIO all run inside containers. You
don't need any of them installed on the host.

---

## 2. Clone and configure environment files

```bash
git clone <repo-url>
cd "File Tracking Management System"
```

Copy the example env files and fill them in:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`** — the values below match `docker-compose.dev.yml`'s
defaults, so if you use the compose file as-is you can copy them verbatim:

```env
DATABASE_URL=postgresql://postgres:FileTracker-@2026@localhost:5432/FileTrackerDB?schema=public

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=fileTrackerMinioAdmin
MINIO_SECRET_KEY=FileTracker-Minio-@2026
MINIO_BUCKET_NAME=eftms-files

CLIENT_URL=http://localhost:3000
```

(The `DATABASE_URL`/`MINIO_*` host/port values above are only used if you
ever run the server natively — see [Appendix](#appendix-running-natively-without-docker).
Inside Docker, `docker-compose.dev.yml` overrides these to point at the `db`
and `minio` service names instead, so you don't need to edit them for the
Docker workflow.)

Then generate two **different** strong secrets for the JWT variables:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

(No Node installed? Any online/local secure random hex generator producing
128 hex characters works just as well.)

Run it twice and paste the results into `JWT_SECRET` and
`JWT_REFRESH_SECRET`. Do the same for `JWT_RESET_TOKEN_SECRET`. Leave
`SMTP_*`, `SMS_API_KEY`, and `BEEM_AFRICA_*` blank for local development —
email/SMS delivery is optional and the app degrades gracefully without it.

**`client/.env`** — the defaults are already correct:

```env
VITE_ENV_MODE=development
VITE_BACKEND_URL=http://localhost:5051
```

---

## 3. Bring the stack up

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

(drop `-f docker-compose.dev.yml` on a VPS — see the table above)

This starts **PostgreSQL** (`db`) and **MinIO** (`minio`) and waits for both
to be healthy, then builds and starts the **backend** (nodemon, hot-reload
in dev) and **frontend** (Vite dev server in dev). First run takes a few
minutes (image builds + `npm ci` for both services); subsequent runs are
fast — dependency layers are cached and containers just restart.

Watch it come up:

```bash
docker compose -f docker-compose.dev.yml logs -f backend frontend
```

When it's up:

- App → `http://localhost:3000`
- API → `http://localhost:5051`
- MinIO Console → `http://localhost:9001` (login with the `MINIO_ACCESS_KEY`
  / `MINIO_SECRET_KEY` values above — useful for browsing uploaded files,
  but no manual setup is required; the app auto-creates its bucket on
  server startup)
- PostgreSQL → `localhost:5432` (e.g. for a DB GUI client)

The app won't actually respond correctly yet — the database has no schema
until you run step 4 below.

### Live reload (dev only)

Both `server/` and `client/` are bind-mounted into their containers, so
editing code on the host is picked up immediately — no rebuild needed for
day-to-day development. A rebuild (`--build`) is only required after
changing `package.json` (new dependency) or either `Dockerfile.dev`. This
doesn't apply to the plain `docker-compose.yml` — that one builds a static
image, so any code change there needs a fresh `up -d --build`.

---

## 4. What seeding creates

```bash
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

`migrate deploy` applies the schema — always required, on every environment,
every time there's a new migration. It's safe to re-run; it's a no-op if
nothing's changed.

`db seed` runs `server/prisma/seed.js`, which seeds everything needed to
start using the app immediately, in this order:

1. Permissions, roles, role↔permission grants
2. Departments, units, positions (ICT / Finance / HR / Planning / Registry /
   Legal / Procurement, with ICT → Software Development / Network
   Administration as example units)
3. File categories
4. **Admin account** — `admin` / `ChangeMe@123` (forced password change on
   first login)
5. **Six ready-to-use test accounts** — see the table below
6. **A working workflow template** — "Director → HOD → Supervisor → Officer
   Routing", the 4-step chain the test accounts route files through

Every seeder is `upsert`-based, so re-running `db seed` any time is safe —
it fills in anything missing without touching data you've since created or
changed by hand. That also means it's fine to run it after every deploy;
it won't reset real data.

### Seeded test accounts

All use the password **`Postman@123`** and are active immediately (no forced
password change):

| Username | Role | Department / Unit |
|---|---|---|
| `hassan.ali` | Director | — (global) |
| `CleanCode` | Head of Department | ICT |
| `john.silver` | Unit Supervisor | ICT / Software Development |
| `officer.one` | Department Officer | ICT / Software Development |
| `hellen.mcgraw` | Registry Officer | Registry |
| `conor.thomas` | Archive Officer | — (global) |

---

## 5. Stopping / resetting

```bash
# Stop everything, keep data
docker compose -f docker-compose.dev.yml down

# Stop everything AND wipe the database + MinIO storage (start completely fresh)
docker compose -f docker-compose.dev.yml down -v
```

After a `down -v`, remember the DB is empty again — repeat step 4 (migrate +
seed) once the stack is back up.

---

## 6. Verify it's actually working

Open `http://localhost:3000` and log in with `admin` or any account from the
table above. Then a quick smoke test, using the seeded data:

1. Log in as `hellen.mcgraw` (Registry) → **Files → Register File**, fill in
   the wizard, submit.
2. Open the new file → **Workflow tab → Start Workflow**, choose "Director →
   HOD → Supervisor → Officer Routing".
3. Log out, log in as `hassan.ali` (Director) → **My Workflow → My
   Assignments** → open the file → **Take Action → Forward** (pick a HOD
   from the dropdown).
4. Repeat as `CleanCode` (HOD, forward to Supervisor) → `john.silver`
   (Supervisor, forward to `officer.one`) → `officer.one` (Officer,
   **Approve** — this completes the file).
5. Log in as `conor.thomas` (Archive Officer) → **Archive → Ready to
   Archive** → the completed file should be listed.

If all five steps work, the environment is fully up and correctly wired.

For a much more detailed walkthrough of every module (Notifications,
Reports, Attachments, Minutes, Timeline, Settings/Sessions, Archive/Restore)
and a longer step-by-step test script, see the companion Implementation &
Testing Guide PDF shared alongside this project.

---

## 7. Common problems

**Nothing loads / API errors about missing tables right after `up`.**
Expected — step 3 only starts the containers, it doesn't create the schema.
Run step 4 (`migrate deploy` then `db seed`) once the containers are up.

**"Invalid Credentials" on a seeded account.**
The password was likely changed at some point after seeding (e.g. via
"Change Password" in Settings, which signs the session out afterward by
design). Reseed is non-destructive and won't fix an already-changed
password — reset it directly, or delete and re-create the user via the
Admin UI, then it will pick up the seed default again next run.

**Editing code doesn't seem to do anything.**
Confirm you're editing files under `server/` or `client/` in the repo you
ran `docker compose -f docker-compose.dev.yml up` from — both directories
are bind-mounted into their containers, so edits should appear within a
second or two. If nothing happens at all, check the container logs
(`docker compose -f docker-compose.dev.yml logs -f backend` or `frontend`)
for a crashed watcher, and as a last resort restart that one service:
`docker compose -f docker-compose.dev.yml restart backend`.

**The plain `docker-compose.yml` (no `-dev`) shows old/different behavior.**
That file builds a *production-style* image — a one-time static frontend
build served by nginx, and a backend with no hot-reload or bind mounts. It's
meant for testing a production-like deploy, not for day-to-day development.
Use `docker-compose.dev.yml` while actively developing; see
[Appendix](#appendix-the-plain-docker-composeyml-production-style) for when
the plain file is the right tool.

**File uploads succeed but the file has no attachments / attachments look
empty.**
Confirm you're not sending `multipart/form-data` through a client that
forces a JSON `Content-Type` header — the frontend's `apiServices.js`
already handles this via `multipartAuthHeader()`; if you add a new upload
call, make sure it uses the same helper instead of the default JSON headers.

**`prisma migrate deploy` fails when you run it.**
Check `docker compose -f docker-compose.dev.yml ps` shows `db` as healthy
first. If it is, the most common cause is a migration conflicting with data
you've edited by hand — `docker compose -f docker-compose.dev.yml down -v`
for a clean-slate retry if you don't need to keep the data.

**Port already in use (`3000`, `5051`, `5432`, `9000`, `9001`).**
Something else already holds that port — commonly a previous `docker
compose up` that wasn't brought down, or a natively-running `npm run dev`.
Run `docker ps` to check for containers still up, and stop whatever's
conflicting before starting fresh.

---

## 8. Project structure at a glance

```
File Tracking Management System/
├── docker-compose.yml       # production-style: static frontend build + no-hot-reload backend
├── docker-compose.dev.yml   # full dev stack: db + minio + hot-reload backend + hot-reload frontend
├── server/
│   ├── Dockerfile           # production image (used by docker-compose.yml)
│   ├── Dockerfile.dev       # dev image (used by docker-compose.dev.yml)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seeds/           # one file per seed concern, orchestrated by seed.js
│   ├── controller/ → services/ → repositories/   # strict layering, in that call direction
│   └── .env
└── client/
    ├── Dockerfile           # production image (nginx static build)
    ├── Dockerfile.dev       # dev image (Vite dev server)
    ├── src/
    │   ├── pages/            # shared, role-agnostic top-level pages
    │   ├── components/
    │   ├── hooks/            # one React Query hook per file
    │   └── utils/
    └── .env
```

---

## 9. Known limitations (as of this guide)

- Director, Officer, and Archive Officer dashboards are still placeholders.
- Workflow Templates have no admin UI yet — the seeded template above was
  created directly via `prisma/seeds/seedWorkflowTemplates.js`.
- `Request Information` still needs a manually-entered user ID (by design —
  it isn't restricted to a single eligible role like Forward/Return are).
- No public, unauthenticated "track my file" page — the QR code on a
  registered file links into the authenticated app, not a citizen-facing
  page.

---

## Appendix: the plain `docker-compose.yml` (production-style)

`docker-compose.yml` at the repo root builds the same images you'd ship —
the frontend compiled once with `vite build` and served by nginx, the
backend with no bind mounts or hot-reload. Follow the exact same three-step
recipe from [§1](#which-command-do-i-run), just without `-f
docker-compose.dev.yml`:

```bash
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed   # skip on a real prod server — see the caveat in §1
```

Code edits require a full `up -d --build` to take effect — there's no
bind-mounted hot reload here, unlike the dev file.

It shares the same `db`/`minio` containers and named volumes as
`docker-compose.dev.yml` (same container names, same project), so don't run
both stacks' `backend`/`frontend` services at once — pick one mode at a
time. Bring the other down first: `docker compose -f docker-compose.dev.yml
down` before switching to the plain file, or vice versa.

## Appendix: running natively, without Docker

Docker is the recommended path, but nothing prevents running the backend
and frontend directly with Node if you prefer — you'll still want Docker
for PostgreSQL and MinIO, or install both natively yourself. Same
migrate/seed step as everywhere else, just run directly instead of through
`docker compose exec`:

```bash
# Infra only
docker compose up -d db minio

# Backend
cd server
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev          # http://localhost:5051

# Frontend (separate terminal)
cd client
npm install
npm run dev           # http://localhost:3000
```

Don't run this alongside the Docker `backend`/`frontend` services on the
same ports — whichever started second will fail to bind, and if the Docker
production containers are already up, they'll silently serve stale code
instead of your local changes.



<!-- locally -->

cd server

# 1. Apply all existing migrations to your freshly cleared local PostgreSQL DB
npx prisma migrate deploy

# 2. Generate the Prisma Client (usually automatic, but safe to run explicitly)
npx prisma generate

# 3. Run all seeders (roles, permissions, departments, admin user, test users, etc.)
npx prisma db seed
