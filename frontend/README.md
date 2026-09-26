# CivicPulse — Frontend

Next.js 16 App Router front end for the city complaint platform. Acts as both a
backend-for-frontend and the auth boundary in front of the Spring Boot API.

## Tech Stack

| Concern        | Choice                          |
|----------------|---------------------------------|
| Framework      | Next.js 16 (App Router)         |
| UI             | React 19, React Compiler on     |
| Styling        | Tailwind CSS 4, CSS variables   |
| Components     | shadcn/ui (`base-vega`)         |
| Icons          | Tabler Icons                    |
| Charts         | Recharts                        |
| Map            | Mapbox GL, Leaflet fallback     |
| Lint / format  | Biome                           |
| Package mgr    | Bun                             |

## Quick Start

Start the backend first (see [../backend/README.md](../backend/README.md)),
then:

```bash
bun install
cp .env.local.example .env.local
bun run dev
```

Open <http://localhost:3000>.

## Scripts

```bash
bun run dev       # dev server on :3000
bun run build     # production build
bun run start     # serve the production build
bun run lint      # biome check
bun run format    # biome format --write
```

## Environment Variables

| Variable                  | Scope   | Description                                                       |
|---------------------------|---------|-------------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`     | client  | Backend base URL including `/api` (default `http://localhost:8080/api`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN`| client  | Mapbox token; empty falls back to OpenStreetMap tiles             |
| `BACKEND_URL`             | server  | Spring Boot base URL without `/api`, used by the proxy and the auth route handler |

`.env*` is git-ignored; only `.env.local.example` is tracked.

## Architecture

```
src/
├── proxy.ts                  Edge guard — runs before every request
├── app/
│   ├── page.tsx              Public transparency board (stats, map, feed, RAG modal)
│   ├── report/page.tsx       Guided complaint intake wizard
│   ├── rag/page.tsx          Standalone RAG assistant
│   ├── citizen/
│   │   ├── login, signup     Citizen auth
│   │   └── dashboard         Own complaints, stats, feedback
│   ├── staff/
│   │   ├── login             Staff auth
│   │   └── dashboard         Ops console — triage, assign, status, AI reply
│   └── api/auth/[...action]/ Catch-all route handler → sets cookies, proxies
├── components/               Navbar, MapboxMap, AnalyticsCharts, Badges, RagAssistantModal
│   └── ui/                   shadcn primitives
└── lib/
    ├── api/                  Typed client, domain helpers, error type
    ├── auth.ts               Client-side auth actions (cookie based)
    └── session.ts            Server-side session reader
```

### Request flow

1. `src/proxy.ts` runs on the edge. Unauthenticated requests to
   `/citizen/dashboard` or `/staff/dashboard` redirect to the matching login
   page, and role mismatches bounce between the two dashboards. Logged-in users
   are redirected away from login and signup.
2. `/api/auth/*` is handled by a route handler that forwards to Spring Boot and,
   on success, sets `jwt_token` (`httpOnly`) and `user_info` (readable, display
   fields only) cookies.
3. Everything else under `/api/*` is rewritten to `BACKEND_URL` by
   `next.config.ts`. `src/lib/api/client.ts` attaches the `Authorization`
   header server-side from the cookie and in the browser from `document.cookie`.

The token is never stored in `localStorage`, so an XSS payload cannot read it.

## Roles

`CITIZEN` sees the citizen dashboard. `ADMIN` and `TECHNICIAN` see the staff
ops console. `src/proxy.ts` treats any non-`CITIZEN` role as staff.

## Lint Status

`bun run lint` currently reports outstanding findings — unused variables,
explicit `any`, array index keys, raw `<img>`, and direct `document.cookie`
access. Import ordering and type-only imports are already clean. Address the
rest in a dedicated `chore(frontend)` pass rather than per-feature.

## Design References

UI mockups and the token set live in
[`../stitch_civicpulse_ui_system`](../stitch_civicpulse_ui_system). Theme tokens
in `src/app/globals.css` are derived from
`luminous_precision/DESIGN.md`.
