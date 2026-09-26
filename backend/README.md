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

```
Build command: mvn clean package -DskipTests
Start command: java -jar target/complaint-platform-1.0.0.jar
Java version:  17
```

Set `SPRING_PROFILES_ACTIVE=prod` to disable the data seeder.
