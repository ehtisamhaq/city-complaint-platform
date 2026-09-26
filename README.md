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

### Complaints (authenticated)
| Method | Path                       | Description                    |
|--------|----------------------------|--------------------------------|
| POST   | /complaints                | Create complaint (AI scoring)  |
| GET    | /complaints                | List with filters & pagination |
| GET    | /complaints/my             | Citizen's own complaints       |
| GET    | /complaints/{id}           | Complaint detail + history     |
| PATCH  | /complaints/{id}/status    | Update status (+ AI reply)     |
| PATCH  | /complaints/{id}/assign    | Assign to staff member         |

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

### Feedback (citizen)
| Method | Path                    | Description               |
|--------|-------------------------|---------------------------|
| POST   | /feedback/{complaintId} | Submit post-resolution feedback |

## Project Structure

```
src/main/java/com/city/complaints/
├── ComplaintPlatformApplication.java
├── config/
│   ├── CorsConfig.java
│   ├── DataSeeder.java       ← demo data on first run
│   └── SecurityConfig.java
├── controller/
│   ├── AuthController.java
│   ├── ComplaintController.java
│   ├── DashboardController.java
│   ├── FeedbackController.java
│   └── PublicController.java
├── dto/
│   ├── request/              ← validated request records
│   └── response/             ← response records (no entity leakage)
├── entity/                   ← JPA entities + enums
├── exception/                ← ApiException hierarchy + GlobalExceptionHandler
├── repository/               ← Spring Data JPA repositories
├── security/
│   ├── CustomUserDetailsService.java
│   ├── JwtAuthenticationFilter.java
│   └── JwtProvider.java
└── service/
    ├── AiService.java        ← Claude API via WebClient
    ├── AuthService.java
    ├── ComplaintService.java
    └── DashboardService.java
```

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
