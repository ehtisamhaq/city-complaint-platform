# CivicPulse — City Complaint & Service Request Platform

A full-stack civic transparency platform: citizens report municipal issues, AI
triages and scores them, departments resolve them, and the public watches it all
happen in real time.

## Repository Layout

```
.
├── backend/                        Spring Boot 3.3 REST API (Java 17)
│   ├── src/main/java/com/city/complaints/
│   │   ├── common/                 config, security, exceptions, shared envelope
│   │   ├── domain/                 auth, citizen, complaint, dashboard,
│   │   │                           department, feedback, rag, staff
│   │   └── infrastructure/         ai (Claude), docs (Scalar playground)
│   └── README.md                   API reference, env vars, demo credentials
│
├── frontend/                       Next.js 16 App Router (React 19, Tailwind 4)
│   ├── src/app/                    routes: public board, report, rag,
│   │                               citizen/*, staff/*, api/auth/*
│   ├── src/components/             map, charts, badges, navbar, RAG modal
│   ├── src/lib/api/                typed fetch client + domain helpers
│   ├── src/proxy.ts                edge auth gating and role routing
│   └── README.md                   frontend setup and scripts
│
└── stitch_civicpulse_ui_system/    design references (HTML mockups + tokens)
    └── luminous_precision/DESIGN.md
```

## Architecture

The browser never talks to Spring Boot directly. Next.js sits in front as both
a BFF and an auth boundary:

```
Browser ──▶ Next.js (3000)
            ├─ src/proxy.ts        edge guard: requires jwt_token, enforces role
            ├─ /api/auth/*         route handler: sets httpOnly cookie, then proxies
            └─ /api/*              rewrite ──▶ Spring Boot (8080)
                                                     └─▶ PostgreSQL / Claude API
```

The JWT is set as an `httpOnly` cookie by the Next.js auth route handler and is
also accepted from the `Authorization` header, so the backend stays usable
standalone (Swagger, curl, the AI agent guide).

## Quick Start

Two terminals, backend first.

```bash
# Terminal 1 — API on :8080
cd backend
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET
./mvnw spring-boot:run

# Terminal 2 — web app on :3000
cd frontend
bun install
cp .env.local.example .env.local
bun run dev
```

Then open <http://localhost:3000>. The dev profile seeds demo departments, staff
accounts, and complaints on first run — credentials are listed in
[backend/README.md](backend/README.md#demo-credentials-seeded-automatically).

## Feature Map

| Area           | Where                                                        |
|----------------|--------------------------------------------------------------|
| Auth + roles   | `backend/…/domain/auth`, `frontend/src/proxy.ts`              |
| Intake + AI    | `backend/…/domain/complaint`, `frontend/src/app/report`      |
| Ops console    | `backend/…/domain/dashboard`, `frontend/src/app/staff`       |
| Transparency   | `backend/…/domain/dashboard/…/PublicController`, `frontend/src/app/page.tsx` |
| Open data      | `/api/public/export/{json,csv}` — Open311 / OpenGov exports    |
| RAG assistant  | `backend/…/domain/rag`, `frontend/src/app/rag`                |
| Design system  | `stitch_civicpulse_ui_system/`                                |

## Documentation

- [backend/README.md](backend/README.md) — full endpoint reference, env vars, deployment
- [frontend/README.md](frontend/README.md) — scripts, architecture, env vars
- [complaint-platform-ai-agent-guide.md](complaint-platform-ai-agent-guide.md) — integrating an AI agent with the complaint API

## Tech Stack

**Backend** — Java 17, Spring Boot 3.3.4, Spring Security 6 + JJWT, Spring Data
JPA / Hibernate 6.5, PostgreSQL, Claude API via WebClient, Maven Wrapper.

**Frontend** — Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Biome,
shadcn/ui, Mapbox GL, Recharts, Bun.
