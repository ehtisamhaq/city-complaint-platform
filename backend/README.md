# City Complaint & Service Request Platform — Backend

Spring Boot 3.x REST API for the City Complaint Platform.

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Language | Java 17                           |
| Framework| Spring Boot 3.3.4                 |
| Security | Spring Security 6 + JJWT 0.12.6   |
| ORM      | Spring Data JPA + Hibernate 6.5   |
| Database | PostgreSQL (Neon on free tier)    |
| AI       | Claude API via WebClient          |
| Build    | Maven / Maven Wrapper (mvnw)      |

## Prerequisites

- Java 17+ (installed via Homebrew)
- PostgreSQL (local) **or** a [Neon](https://neon.tech) connection string

## Quick Start

```bash
# 1. Copy env template
cp .env.example .env
# Fill in DATABASE_URL, ANTHROPIC_API_KEY, JWT_SECRET

# 2. Run with Maven Wrapper
./mvnw spring-boot:run
# → App starts on http://localhost:8080/api
```

## Environment Variables

| Variable         | Required | Description                                 |
|------------------|----------|---------------------------------------------|
| `DATABASE_URL`   | Yes      | PostgreSQL JDBC URL                         |
| `DB_USERNAME`    | No       | DB user (default: postgres)                 |
| `DB_PASSWORD`    | No       | DB password (default: postgres)             |
| `JWT_SECRET`     | Yes      | At least 32-char secret for signing tokens  |
| `ANTHROPIC_API_KEY` | No    | Claude API key (AI features degrade gracefully without it) |
| `PORT`           | No       | Server port (default: 8080)                 |

## Demo Credentials (seeded automatically)

| Role           | Email               | Password    |
|----------------|---------------------|-------------|
| Citizen        | citizen@demo.com    | Password123 |
| Staff (Admin)  | admin@roads.gov     | Password123 |
| Staff (Tech)   | tech@roads.gov      | Password123 |

## API Endpoints

### Auth (public)
| Method | Path                    | Description          |
|--------|-------------------------|----------------------|
| POST   | /auth/citizen/signup    | Register citizen     |
| POST   | /auth/citizen/login     | Citizen login        |
| POST   | /auth/staff/login       | Staff login          |

### Complaints
| Method | Path                       | Access   | Description                    |
|--------|----------------------------|----------|--------------------------------|
| POST   | /complaints                | CITIZEN  | Create complaint (AI scoring)  |
| GET    | /complaints                | public   | List with filters & pagination |
| GET    | /complaints/my             | CITIZEN  | Citizen's own complaints       |
| GET    | /complaints/{id}           | public   | Complaint detail + history     |
| PATCH  | /complaints/{id}/status    | STAFF    | Update status (+ AI reply)     |
| PATCH  | /complaints/{id}/assign    | STAFF    | Assign to staff member         |

Public reads return a redacted projection: the complainant's and assignee's
email addresses are omitted, display names are kept. Authenticated callers
receive the full record.

### Dashboard (authenticated)
| Method | Path                | Description              |
|--------|---------------------|--------------------------|
| GET    | /dashboard/citizen  | Citizen stats & recents  |
| GET    | /dashboard/staff    | Staff stats & assigned   |

### Public (no auth)
| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| GET    | /public/statistics    | Platform-wide stats      |
| GET    | /public/health        | Liveness probe           |
| GET    | /public/export/json   | Open311 JSON dataset (attachment) |
| GET    | /public/export/csv    | OpenGov CSV dataset (attachment)  |

### Feedback (citizen)
| Method | Path                    | Description               |
|--------|-------------------------|---------------------------|
| POST   | /feedback/{complaintId} | Submit post-resolution feedback |

### RAG & AI Assistant (public / authenticated)
| Method | Path                    | Description                                  |
|--------|-------------------------|----------------------------------------------|
| POST   | /rag/ask                | Ask AI with hybrid knowledge + complaint RAG |
| GET    | /rag/articles           | Browse municipal knowledge base by category  |

### Interactive API Testing & Documentation
| Method | Path                    | Description                                  |
|--------|-------------------------|----------------------------------------------|
| GET    | /docs                   | **Scalar Interactive API Playground**        |
| GET    | /v3/api-docs            | OpenAPI 3.0 JSON specification               |

## Project Structure

```
src/main/java/com/city/complaints/
├── ComplaintPlatformApplication.java
├── common/
│   ├── config/                 CorsConfig, SecurityConfig, OpenApiConfig, DataSeeder
│   ├── exception/              ApiException hierarchy + GlobalExceptionHandler
│   ├── model/                  ApiResponse<T> envelope
│   └── security/               CustomUserDetailsService, JwtProvider,
│                               JwtAuthenticationFilter
├── domain/
│   ├── auth/                   AuthController, AuthService, DTOs
│   ├── citizen/                Citizen entity + repository
│   ├── complaint/              ComplaintController, ComplaintService, entity,
│   │                           enums, DTOs, repositories
│   ├── dashboard/              DashboardController, PublicController, DashboardService
│   ├── department/             Department entity + repository
│   ├── feedback/               FeedbackController, entity, repository
│   ├── rag/                    RagController, RagService, KnowledgeArticle
│   └── staff/                  Staff entity, StaffRole, repository
└── infrastructure/
    ├── ai/                     AiService — Claude API via WebClient
    └── docs/                   DocsController — Scalar playground
```

Sources are grouped by technical role (`common`, `domain`, `infrastructure`) and,
within each domain, by architectural layer (controller / service / entity /
repository / dto).

## Known Decisions & Trade-offs

1. **Anthropic Java SDK not used** — `com.anthropic:anthropic-java` is not published to Maven Central. `AiService` calls the Claude REST API directly via Spring WebClient, which is functionally equivalent.
2. **JWT subject format** — `"CITIZEN:<email>"` or `"STAFF:<email>"` so both user types can share one filter chain without extra DB fields.
3. **AI failures are non-blocking** — if Claude API is down or the API key is missing, complaints still save with severity `MEDIUM`.
4. **DataSeeder skipped in prod** — annotated `@Profile("!prod")`.

## Deployment (Render)

The repo is a monorepo, so **Root Directory is the setting that decides whether
the build finds anything.** Render resolves `Dockerfile` relative to the build
context root, which defaults to the repository root — where this project has no
Dockerfile. Left at the default, the build dies with
`failed to read dockerfile: open Dockerfile: no such file or directory`.

### Docker runtime

`backend/Dockerfile` is written context-relative (`COPY pom.xml .`,
`COPY src ./src`), so it needs no changes — just point Render at the right
context.

| Setting          | Value                    |
| ---------------- | ------------------------ |
| Root Directory   | `backend`                |
| Dockerfile path  | `./Dockerfile`           |
| Health Check Path| `/api/public/health`     |

> **Health check needs the `/api` prefix.** `application.yml` sets
> `server.servlet.context-path: /api`, so `GET /` is a 404. The liveness probe
> is `PublicController#health` at `/public/health` — full path
> `/api/public/health`. A bare `/health` makes the deploy report unhealthy after
> a successful build.

### Native runtime

Switch the service to the Java environment instead of Docker to skip the
context problem entirely:

```
Root Directory:  backend
Build command:   mvn clean package -DskipTests
Start command:   java -jar target/complaint-platform-1.0.0.jar
Java version:    17
```

### Environment variables

Set these on the service regardless of runtime:

| Variable          | Required | Notes                                                        |
| ----------------- | -------- | ------------------------------------------------------------ |
| `DATABASE_URL`    | Yes      | Full Neon/Postgres JDBC URL, `?sslmode=require`              |
| `DB_USERNAME`     | Yes      |                                                              |
| `DB_PASSWORD`     | Yes      |                                                              |
| `JWT_SECRET`      | Yes      | ≥ 32 characters; the default is a known placeholder          |
| `CORS_ORIGINS`    | Yes      | Comma-separated; must include the deployed frontend origin   |
| `SPRING_PROFILES_ACTIVE` | Recommended | `prod` disables the data seeder                      |
| `ANTHROPIC_API_KEY` | No     | Omitted → complaints fall back to keyword classification      |

`CORS_ORIGINS` defaults to `http://localhost:3000,http://localhost:5173`, which
will not match a deployed frontend and the browser will block every call. It
must be the real origin, e.g. `https://city-complaint-platform.onrender.com`.

### Frontend

The Next.js app is a **separate** Render service, not part of this Dockerfile:

| Setting       | Value                                        |
| ------------- | -------------------------------------------- |
| Root Directory| `frontend`                                   |
| Runtime       | Node                                         |
| Build command | `bun install --frozen-lockfile && bun run build` |
| Start command | `bun run start`                              |

Set `BACKEND_URL` on the frontend to this service's origin — `next.config.ts`
rewrites `/api/:path*` to `${BACKEND_URL}/api/:path*`. Note it is **not**
`NEXT_PUBLIC_`-prefixed, so it is read at build time and must be set before the
build step runs, not just at runtime.
