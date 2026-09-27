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
| `BACKEND_URL`             | server  | Spring Boot base URL without `/api`, used by the `next.config.ts` rewrite (default `http://localhost:8080`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN`| client  | Mapbox token; empty falls back to OpenStreetMap tiles             |

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
2. Everything under `/api/*` — including `/api/auth/*` — is rewritten to
   `BACKEND_URL` by `next.config.ts`. `src/lib/api/client.ts` sends
   `credentials: "include"` and attaches the `Authorization` header in the
   browser from the `jwt_token` cookie.
3. `src/lib/auth.ts` writes `jwt_token` and `user_info` on successful login and
   clears both on logout.

### Auth failure handling

The backend distinguishes the two failure modes: **401** means no valid session,
**403** means authenticated but the wrong role (`RestAuthenticationEntryPoint` /
`RestAccessDeniedHandler` in `common/security`). On either status, and only
while on a protected dashboard route, `handleSessionExpiry` in
`src/lib/api/client.ts` clears the cookies and redirects to the matching login
page. A 403 elsewhere — e.g. a staff member posting to the citizen-only
`POST /complaints` — is surfaced as a normal error and does not sign the user out.

The token lives in a cookie rather than `localStorage`, so it is not attached to
a manually-triggered `localStorage` read by page scripts.

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
