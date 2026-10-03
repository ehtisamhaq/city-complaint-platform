# AGENTS.md: city-complaint-platform

Guidance for AI coding agents working in this repository. Read it fully before changing anything. A direct instruction from the user overrides this file.

## 1. Project Overview

- **Project:** `city-complaint-platform` (backend in `backend/`)
- **Purpose:** Platform where citizens file complaints that are routed to city departments and staff, tracked to resolution, reviewed through feedback, and monitored on dashboards. Includes a RAG (retrieval-augmented generation) module.
- **Style:** Domain-Driven Design (DDD) modular monolith, REST/JSON API
- **Runtime:** Java 25 (LTS), Spring Boot **4.1.x** (Spring Framework 7, Jakarta EE 11, Hibernate 7, Jackson 3)
- **Build:** Maven, always via the wrapper `./mvnw`
- **Database:** PostgreSQL + Flyway (HikariCP pool, Hibernate 7 dialect auto-detected)
- **External services:** Cloudinary (image/file storage), plus mail and LLM providers for the `rag` module; all configured through environment variables (section 10)
- **Modularity:** Spring Modulith (each bounded context is an application module)
- **Base package:** `com.city.complaints` (source root: `backend/src/main/java/com/city/complaints`)

### Versions: verify before you write code

Training data goes stale. **Before using any API, read the versions in `pom.xml`** and check the docs for that version. Spring Boot 4 is not Spring Boot 3. Do not write 2.x/3.x-era code from habit.

Common Boot 4 differences that agents get wrong:
- Starters are **modular**. Use the specific starters (`spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, `spring-boot-starter-flyway`, and so on) plus their matching `-test` starters.
- `@MockBean` / `@SpyBean` are gone. Use **`@MockitoBean` / `@MockitoSpyBean`**.
- **Jackson 3** (`tools.jackson.*` packages) is the default. Do not import `com.fasterxml.jackson.databind.*` for new code (annotations stay in `com.fasterxml.jackson.annotation`).
- `WebSecurityConfigurerAdapter` does not exist. Use a `SecurityFilterChain` bean.
- Use **JSpecify** (`@NullMarked`, `@Nullable`) for null-safety, not Spring's old `@NonNullApi`.
- Spring Framework 7 has built-in **API versioning**, `@Retryable`/`@ConcurrencyLimit` in core, and declarative HTTP clients via `@ImportHttpServices`.

### Documentation (consult these, do not guess)

| Topic | Link |
|---|---|
| Spring Boot reference | https://docs.spring.io/spring-boot/reference/ |
| Spring Boot 4.0 migration guide | https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide |
| Spring Boot release notes | https://github.com/spring-projects/spring-boot/wiki |
| Spring Framework reference | https://docs.spring.io/spring-framework/reference/ |
| Spring Modulith | https://docs.spring.io/spring-modulith/reference/ |
| Spring Data JPA | https://docs.spring.io/spring-data/jpa/reference/ |
| Spring Security | https://docs.spring.io/spring-security/reference/ |
| Hibernate ORM | https://hibernate.org/orm/documentation/ |
| Flyway | https://documentation.red-gate.com/flyway |
| springdoc-openapi | https://springdoc.org/ |
| Testcontainers (Java) | https://java.testcontainers.org/ |
| ArchUnit | https://www.archunit.org/userguide/html/000_Index.html |
| Micrometer / Observability | https://docs.micrometer.io/ |
| RFC 9457 (Problem Details) | https://www.rfc-editor.org/rfc/rfc9457 |
| jMolecules (optional DDD annotations) | https://github.com/xmolecules/jmolecules |

## 2. Commands

Run from `backend/` (where `pom.xml` lives).

| Task | Command |
|---|---|
| Full build + all tests | `./mvnw clean verify` |
| Unit tests | `./mvnw test` |
| Unit + integration tests | `./mvnw verify` |
| One test class | `./mvnw test -Dtest=OrderTest` |
| Run locally | `./mvnw spring-boot:run -Dspring-boot.run.profiles=local` |
| Format check / fix | `./mvnw spotless:check` / `./mvnw spotless:apply` (Spotless plugin must be configured in `pom.xml`) |
| Outdated dependencies | `./mvnw versions:display-dependency-updates` |
| Vulnerability scan | `./mvnw org.owasp:dependency-check-maven:check` (plugin must be configured in `pom.xml`; runs in CI) |

Run `./mvnw verify` before declaring any task done. Never hide or skip a failing build.

## 3. Domain-Driven Design Rules

### Ubiquitous language
- Use the business's vocabulary in class, method, and table names (`Complaint.escalate()`, not `ComplaintUtil.updateStatus()`).
- If a term is unclear, ask. Do not invent names. Keep a glossary in `docs/glossary.md` and update it when terms change.

### Bounded contexts = Spring Modulith modules
- Each **bounded context** is a top-level package under the base package and is one Spring Modulith application module.
- A module exposes a small public API (its root package). Everything else is internal.
- Modules interact via **the other module's public API** or **domain events**, never by touching its internals, entities, or repositories.
- No circular dependencies between modules. the test `ModularityTests` (calls `ApplicationModules.of(CityComplaintPlatformApplication.class).verify()`) must exist and pass in `./mvnw verify`. Never delete, weaken, or suppress it.

### Building blocks
| Concept | Rule |
|---|---|
| **Entity** | Has identity; behavior lives on the entity, not in services. No public setters. |
| **Value Object** | Immutable, equality by value, self-validating. Use Java `record`s. Wrap primitives with meaning (`Email`, `Money`, `ComplaintId`). |
| **Aggregate** | A consistency boundary with one **Aggregate Root**. Only the root is referenced from outside. Change state only through root methods that enforce invariants. |
| **Repository** | One per aggregate root. Interface (port) in the domain layer; implementation in infrastructure. Loads and saves whole aggregates. |
| **Domain Service** | Only for domain logic that fits no single entity. Stateless, in the domain layer. |
| **Domain Event** | Immutable record, named in past tense (`ComplaintEscalated`). Raised by aggregates, published after commit. |
| **Application Service** | Use-case orchestration: load aggregate, call behavior, save, publish events. Owns the transaction. No business rules. |
| **Factory** | Use static factory methods or dedicated factories when construction is non-trivial. |

Additional rules:
- Aggregates reference other aggregates **by ID**, never by object reference.
- One transaction modifies **one aggregate**. Cross-aggregate consistency is eventual, via domain events.
- Keep aggregates small.
- Enforce invariants in constructors and root methods. An invalid aggregate must be unrepresentable.
- Throw domain-specific exceptions (`ComplaintAlreadyClosedException`), not generic ones.

## 4. Package Structure

Package by bounded context first, then by architectural layer inside it (hexagonal / ports-and-adapters).

```
backend/src/main/java/com/city/complaints/
├── CityComplaintPlatformApplication.java
├── auth/                            # bounded context: authentication, tokens, roles
├── citizen/                         # bounded context: citizen accounts and profiles
├── complaint/                       # bounded context (core domain): complaint lifecycle
├── department/                      # bounded context: city departments and routing rules
├── staff/                           # bounded context: staff members and assignments
├── feedback/                        # bounded context: citizen feedback and ratings
├── dashboard/                       # bounded context: read-only reporting and statistics
├── rag/                             # bounded context: document ingestion, retrieval, AI answers
├── common/                          # shared kernel: tiny, stable, business-neutral only
└── infrastructure/                  # cross-cutting Spring config (security, jackson, openapi, async)
```

Each bounded context (module) has this internal layout, shown for `complaint/`:

```
complaint/
├── package-info.java                # @NullMarked, @ApplicationModule
├── ComplaintApi.java                # public module API (facade), optional
├── ComplaintEscalated.java          # public domain events other modules may consume
├── domain/                          # PURE JAVA: no Spring, no JPA, no web
│   ├── model/                       # Complaint (aggregate root), ComplaintId, Category, Status...
│   ├── event/
│   ├── service/                     # domain services
│   ├── repository/                  # ComplaintRepository interface (port)
│   └── exception/
├── application/
│   ├── command/                     # SubmitComplaint, AssignComplaint, EscalateComplaint...
│   ├── query/                       # read models and query handlers
│   └── port/                        # outbound ports (notifications, RAG, etc.)
├── infrastructure/
│   ├── persistence/                 # JPA entities, Spring Data repos, mappers, repository impls
│   └── client/
└── web/                             # controllers, request/response DTOs
```

Resources and docs:

```
backend/src/main/resources/
├── application.yaml, application-local.yaml, application-prod.yaml
└── db/migration/                    # Flyway: V<version>__<description>.sql
backend/src/test/java/com/city/complaints/...   # mirrors main
docs/                                # glossary.md, recipes.md, rag.md, security-and-privacy.md, adr/
```

### Context map (who may depend on whom)

| Context | Role | May use (via public API or events only) |
|---|---|---|
| `complaint` | Core domain | `citizen` (reporter ID), `department` (routing), `staff` (assignee ID), `rag` (suggestions) |
| `department` | Supporting | `staff` |
| `staff` | Supporting | `department` events only (avoid a cycle) |
| `citizen` | Supporting | none |
| `feedback` | Supporting | `complaint` (reacts to `ComplaintResolved`) |
| `dashboard` | Read-only, generic | consumes events and queries from other contexts; owns no aggregates |
| `rag` | Supporting / AI | none; exposes a port other contexts call |
| `auth` | Generic | `citizen`, `staff` (identity lookups) |

Refer to other contexts' aggregates **by ID only**. If this map no longer matches reality, update it in the same change and record the reason in an ADR.

### Dependency rules (enforced by ArchUnit and Modulith tests)
- `domain` depends on **nothing** except the JDK (and `common` value types). No Spring, JPA, Jackson, or Lombok annotations in `domain`. Optional: jMolecules annotations.
- `application` depends on `domain` only (plus Spring's `@Service`/`@Transactional`).
- `infrastructure` and `web` depend on `application` and `domain`, **never the reverse**.
- `web` never touches `infrastructure`, and vice versa.
- `common` must never depend on any bounded context. Do not turn it into a dumping ground.
- Pragmatic exception (needs an ADR): JPA annotations directly on domain entities. The default is **separate JPA entities in `infrastructure/persistence` with explicit mappers**.

## 5. CQRS-lite

- **Commands** change state via aggregates and return an ID or nothing. **Queries** never change state and may bypass aggregates, reading through projections/DTOs straight from the database for performance.
- Do not build full event sourcing or separate databases unless an ADR approves it.

## 6. Domain Events and Inter-Module Communication

- Aggregates register events (e.g. via Spring Data's `AbstractAggregateRoot` / `@DomainEvents`, or explicitly in the application service).
- Consume events in other modules with `@ApplicationModuleListener` (async, transactional, after commit). Spring Modulith's **event publication registry** persists events, so they survive failures (transactional outbox pattern).
- Event listeners must be **idempotent**.
- Events are part of a module's public contract. Do not rename or reshape them without versioning.
- Do not use events for simple synchronous queries. Call the module's public API instead.

## 7. Coding Standards

- **Java:** use `record`, `sealed` types, pattern matching, `switch` expressions, text blocks. Prefer immutability, `final` fields, constructor injection (single constructor, no `@Autowired`, never field injection).
- **Null-safety:** annotate packages with `@NullMarked` (JSpecify), mark exceptions with `@Nullable`. Prefer `Optional` for return values.
- No wildcard imports, dead code, or commented-out code. No `System.out`.
- Lombok: not allowed in `domain`. Elsewhere only if already a dependency, and never `@Data` on entities.
- Naming: `PascalCase` classes, `camelCase` members, `UPPER_SNAKE_CASE` constants. Application services named by use case (`EscalateComplaintHandler`, `RegisterCitizenService`). DTOs: `XRequest`, `XResponse`. Events: past tense.
- Comment the *why*, not the *what*.

## 8. REST API Conventions

- Version the API. Use Spring Framework 7's native API versioning or a `/api/v1/` prefix (follow what the project already uses).
- Nouns, plural, kebab-case paths. Correct status codes: `201` + `Location` on create, `204` on delete, `400` validation, `401`/`403` auth, `404` not found, `409` conflict.
- Validate request DTOs with Jakarta Bean Validation. Business rules are validated in the domain, not the controller.
- Controllers are thin: map DTO → command/query, call the application service, map result → response DTO. Never expose domain objects or JPA entities.
- **All list endpoints are paginated** with a bounded maximum page size.
- Errors: **RFC 9457 `ProblemDetail`** through one `@RestControllerAdvice`. Map domain exceptions to HTTP statuses there. Never leak stack traces or SQL.
- Document with springdoc-openapi (`springdoc-openapi-starter-webmvc-ui`, the **3.x line** for Boot 4). Keep annotations in sync with the code.
- Breaking changes require a new API version.

## 9. Persistence

- Schema changes **only** through Flyway migrations. Never edit an applied migration; add a new one. `spring.jpa.hibernate.ddl-auto` is `validate` or `none`.
- Migrations must be backward compatible with the previous release (expand → migrate → contract).
- `spring.jpa.open-in-view=false`.
- `@Transactional` belongs on application services (`readOnly = true` for queries), never on controllers or domain classes.
- Avoid N+1 queries: use `@EntityGraph`, fetch joins, or projections deliberately.
- Use optimistic locking (`@Version`) on aggregate roots.
- Never build queries by string concatenation.
- PostgreSQL specifics: use `TIMESTAMPTZ` for instants (store and read as UTC `Instant`), `UUID` or identity/sequence primary keys, `NUMERIC` for money, and `snake_case` column names. Add indexes for foreign keys and common filters in the same migration that creates them.
- Connection settings come from environment variables (section 10). Keep the HikariCP pool small and explicit (`spring.datasource.hikari.maximum-pool-size`); do not raise it to "fix" slow queries.
- Tests run against a Testcontainers PostgreSQL image on the **same major version as production**.
- If the `rag` module stores embeddings with pgvector, enable the extension in a Flyway migration (`CREATE EXTENSION IF NOT EXISTS vector;`), never manually.
- Store money, timestamps, and IDs correctly: `BigDecimal`/minor units, `Instant` (UTC), UUIDs or sequence-based IDs generated by the application.

## 10. Configuration, Environment Variables and Secrets

- Type-safe `@ConfigurationProperties` records with `@Validated`. Avoid scattered `@Value`.
- **Never commit secrets.** `.env` is git-ignored. Only `.env.example` (placeholders, no real values) is committed. When you add a new variable, add it to `.env.example` and to the table below in the same change.
- No hardcoded URLs, credentials, or environment-specific values in code.
- Spring does not load `.env` by itself. For local runs, `application-local.yaml` imports it:

```yaml
spring:
  config:
    import: optional:file:.env[.properties]
```

- Map variables to properties with placeholders, for example:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
app:
  cloudinary:
    cloud-name: ${CLOUDINARY_CLOUD_NAME}
    api-key: ${CLOUDINARY_API_KEY}
    api-secret: ${CLOUDINARY_API_SECRET}
```

### `.env.example`

```dotenv
# --- App ---
SPRING_PROFILES_ACTIVE=local
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000

# --- PostgreSQL ---
DB_URL=jdbc:postgresql://localhost:5432/city_complaints
DB_USERNAME=postgres
DB_PASSWORD=change-me

# --- Auth (JWT) ---
JWT_SECRET=change-me-use-a-long-random-value
JWT_EXPIRATION_MINUTES=60

# --- Cloudinary (file/image storage) ---
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_FOLDER=city-complaints

# --- Mail (notifications) ---
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-smtp-user
MAIL_PASSWORD=your-smtp-password

# --- RAG / LLM provider ---
LLM_API_KEY=your-llm-api-key
```

### Rules for external services (Cloudinary, mail, LLM)
- Each external service is reached through an **outbound port** in the owning context's `application/port`, with the adapter in `infrastructure/client`. Domain and application code never import the vendor SDK.
- Cloudinary: the `complaint` context stores only the returned asset URL and public ID as value objects (for example `AttachmentRef`), never binary data. Validate file type and size before upload. Uploads are done by the adapter, not by controllers.
- Wrap vendor credentials in `@ConfigurationProperties` records; never log keys, secrets, or signed URLs.
- Adapters must set timeouts and handle failure explicitly. Tests use fakes or WireMock/Testcontainers, never real vendor accounts.
- Production values come from the deployment platform's secret store, not files.

## 11. Security

- Spring Security 7 with a `SecurityFilterChain` bean; deny by default.
- Stateless auth via OAuth2 Resource Server / JWT unless the project states otherwise.
- Authorization at method level (`@PreAuthorize`) in application services as well as URL rules.
- Passwords: `DelegatingPasswordEncoder` (BCrypt/Argon2). Never custom crypto.
- CORS: explicit origins only. Never `*` with credentials.
- Never log secrets or personal data. Never disable CSRF/auth/validation to make a test pass.

## 12. Testing

| Level | Tools | Scope |
|---|---|---|
| **Domain unit tests** | JUnit 5, AssertJ | Aggregates, value objects, domain services. **No Spring context.** Must be the majority of tests. |
| **Application tests** | JUnit 5, Mockito (`@MockitoBean` if a context is needed) | Use-case orchestration with fake/in-memory repositories. |
| **Web slice** | `@WebMvcTest`, `MockMvcTester` / `RestTestClient` | Controllers, validation, error mapping. |
| **Persistence** | `@DataJpaTest` + **Testcontainers PostgreSQL** (`@ServiceConnection`) | Repository implementations and migrations. No H2. |
| **Module tests** | `@ApplicationModuleTest`, `Scenario` API | One bounded context in isolation, including events. |
| **Architecture** | ArchUnit, `ApplicationModules.of(CityComplaintPlatformApplication.class).verify()` | Layer and module rules from section 4. |
| **Full integration** | `@SpringBootTest` (sparingly) | Critical end-to-end paths. |

- Every behavior change needs tests. Every bug fix needs a regression test.
- Name tests by behavior: `shouldRejectEscalationOfClosedComplaint`.
- Deterministic tests only: inject `Clock`, no sleeps, no shared mutable state.
- Never weaken, `@Disabled`, or delete tests to get green unless told to.

## 13. Observability and Operations

- SLF4J with parameterized messages and correct levels; structured logging where configured.
- Actuator: expose only what's needed (`health`, `info`, `metrics`, `prometheus`); secure the rest.
- Micrometer metrics and tracing (OpenTelemetry) with correlation IDs. Modulith's observability module can trace cross-module calls.
- Graceful shutdown (`server.shutdown=graceful`). Health probes enabled for containers.
- Virtual threads (`spring.threads.virtual.enabled=true`) only if the project has adopted them.

## 14. Dependencies

- Versions are managed by the **Spring Boot BOM** (`spring-boot-starter-parent`). Do not pin BOM-managed libraries.
- Spring Modulith (**2.1.x** for Boot 4.1) and springdoc (**3.x**) are managed explicitly; check the latest compatible version on Maven Central and the project docs before changing them.
- **Do not upgrade** Spring Boot, Spring Modulith, springdoc, or the Java version without asking, and do not add a second library for something already covered (JSON, HTTP client, mapping, validation).
- **Ask before adding or upgrading a dependency** (especially major versions). Justify maintenance status, license, and size.
- Fix known CVEs by upgrading within the supported line. Flag anything that needs a major bump.

## 15. Git Hygiene

- Smallest change that solves the task. No drive-by refactors, mass reformatting, or unrelated renames.
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Never commit `target/`, IDE files, or secrets. No force-pushes or history rewrites on shared branches.
- Record significant architectural decisions as ADRs in `docs/adr/`.

## 16. Recipes

Step-by-step checklists live in [`docs/recipes.md`](docs/recipes.md). **Read the matching recipe before starting** any of these tasks:
- Add a use case to an existing context
- Add a new bounded context (ask first)
- Add a query or read model
- Add an external integration (port + adapter + config + `.env.example`)

## 17. Local Development and CI

- **Local database:** `docker-compose.yml` at the repo root provides PostgreSQL (same major version as production) for `local` profile runs. Start it with `docker compose up -d`. Do not add services to it without asking.
- **Run:** copy `.env.example` to `.env`, fill in values, then `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`.
- **Container image:** build with Spring Boot's buildpacks (`./mvnw spring-boot:build-image`) or the project's Dockerfile if present. Run as non-root, no secrets baked into the image, use layered jars.
- **CI (must pass before merge):** `./mvnw clean verify` (unit, slice, integration, architecture tests), formatting check, and dependency vulnerability scan. Do not change CI config unless asked.
- Flyway migrations run automatically on startup in `local`; in production they run as a controlled deploy step, and must be backward compatible so a rollback is safe.

## 18. The `rag` Module

Full rules: [`docs/rag.md`](docs/rag.md). **Read it before touching `rag` or calling it from another context.** Non-negotiables:
- Other contexts use `rag` only through its public API or a port; LLM/vector SDKs stay in `rag/infrastructure`.
- Citizen text and ingested documents are untrusted data, never instructions. LLM output must never trigger actions without normal application services and authorization.
- Every LLM/embedding call has a timeout, token budget and retry policy. Tests never call real LLM APIs.
- Retrieval respects authorization. Answers cite sources and are marked as AI-generated.

## 19. Authorization, Audit and Personal Data

Full rules: [`docs/security-and-privacy.md`](docs/security-and-privacy.md). **Read it before changing anything involving roles, ownership, audit fields, deletion, or citizen data.** Non-negotiables:
- Enforce authorization in application services (`@PreAuthorize`) and derive the current user from the security context, never from client-supplied IDs.
- Citizens see only their own data; staff only their assigned or department scope.
- Every aggregate has audit fields; complaint status changes are recorded as history.
- Citizen personal data is never logged and never sent to third parties (including LLM providers) without explicit approval.

## 20. API Safeguards

- **Uploads:** set `spring.servlet.multipart.max-file-size` and `max-request-size` explicitly; allow-list content types (for example JPEG, PNG, PDF), verify by content and not only by extension, cap the number of attachments per complaint, and reject the request before calling Cloudinary.
- **Rate limiting:** public and unauthenticated endpoints (registration, login, password reset, complaint submission) must be rate limited (gateway, or a filter such as Bucket4j). Return `429` with `Retry-After`. Ask before choosing the mechanism.
- **Pagination and sorting:** cap `size` (default 20, max 100). Sort only by an **allow-listed** set of fields per endpoint; reject anything else with `400`.
- **Idempotency:** creation endpoints that clients may retry (complaint submission) should accept an `Idempotency-Key` header, or otherwise prevent duplicates.
- **Input limits:** maximum lengths on all free-text fields, request body size limits, and strict validation of enums and IDs.

## 21. Boundaries

### Always
- Read surrounding code and match existing conventions first.
- Put business rules in the domain model, not in controllers or application services.
- Add tests and Flyway migrations alongside code changes.
- Run `./mvnw verify` and confirm it passes.
- Check the docs (section 1) when unsure about an API.

### Ask first
- New dependencies or major upgrades.
- New bounded contexts, or changing module boundaries or public APIs/events.
- Non-additive schema changes, security rule changes, public API contract changes.
- Introducing new infrastructure (message broker, cache, new datastore) or patterns (event sourcing, separate read DB).
- Choosing a rate-limiting mechanism, changing roles or retention rules, sending personal data to any external service, or changing CI/deployment config.

### Never
- Put Spring/JPA/Jackson code in `domain`.
- Reference another module's internals, entities, or repositories.
- Expose entities or domain objects from controllers.
- Modify more than one aggregate in a single transaction.
- Edit applied Flyway migrations, use field injection, or build queries with string concatenation.
- Commit secrets, or disable tests, security, or validation to pass a build.
- Invent APIs, classes, or config properties. Verify in source or docs.
- Log personal data or prompt content, or let LLM output perform actions without normal authorization.
- Return unbounded lists or accept unvalidated sort fields.

## 22. Definition of Done

1. Compiles, and `./mvnw verify` passes (including architecture and module verification).
2. New or changed behavior is covered by tests, mostly at the domain level.
3. Schema changes have Flyway migrations, and new environment variables are in `.env.example`.
4. API changes are reflected in OpenAPI docs; new domain terms in the glossary.
5. No secrets, debug code, or stray files.
6. Change is minimal and follows the rules above.

When finishing, summarize what changed, what was tested, and anything you were unsure about.
