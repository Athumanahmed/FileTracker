# Citizen File Tracking Portal

A small, **public**, unauthenticated web app that lets a citizen check the
status of their file with the Tabora Municipal Council. It is deliberately a
separate app from `client/` (the internal staff system) — different audience,
different security posture, its own deploy.

- **Stack:** Vite + React 19 + Tailwind v4 (same `@theme` tokens as `client/`),
  `react-hook-form` + `zod`. No auth, no router (single page), no state library.
- **Language:** Swahili / English toggle (persisted in `localStorage`). Status
  and milestone labels come back from the API already translated.
- **Data:** one endpoint — `GET /api/v1/track?trackingNumber=…&phone=…`
  (public, rate-limited, phone-verified, citizen-safe projection only).

## Run locally

```bash
npm install
npm run dev                  # http://localhost:3001
```

No `.env` needed for the default setup — `vite.config.js` proxies `/api` to
`http://localhost:5051`. If your backend is elsewhere, set
`VITE_API_PROXY_TARGET` (see `.env.example`). Because the browser only ever
talks to `:3001`, there is no CORS involved.

## Docker

Included in both compose files as the `citizen-portal` service:

```bash
# dev (hot reload, port 3001)
docker compose -f docker-compose.dev.yml up --build citizen-portal

# prod-style (nginx static build, port 3001)
docker compose up --build citizen-portal
```

The app always calls a relative `/api/v1/track`: the Vite dev proxy handles
it in dev, the portal's own nginx handles it in the production image
(`backend:5051`). No backend URL is ever baked into the build.
