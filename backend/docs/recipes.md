# Recipes

Step-by-step checklists referenced from `AGENTS.md`. Follow them in order.

## Add a use case to an existing context (e.g. "citizen can withdraw a complaint")
1. Name it in the ubiquitous language; add new terms to `docs/glossary.md`.
2. **Domain:** add the behavior as a method on the aggregate root (`Complaint.withdraw()`), enforce invariants, raise a domain event (`ComplaintWithdrawn`), add domain exceptions. Write the domain unit tests first.
3. **Application:** add a command (record) and handler in `application/command`. Load the aggregate through the repository port, call the behavior, save, done. Add `@Transactional` and authorization (`@PreAuthorize`).
4. **Persistence:** if state changed, add a Flyway migration (`V<next>__<description>.sql`) and update the JPA entity and mapper in `infrastructure/persistence`.
5. **Web:** add the endpoint and request/response DTOs in `web`, map errors in the `@RestControllerAdvice`, add OpenAPI annotations.
6. **Events:** if other contexts must react, add an idempotent `@ApplicationModuleListener` in *their* module.
7. **Tests:** web slice test, persistence test (Testcontainers), module test if events are involved.
8. Run `./mvnw verify`.

## Add a new bounded context
1. Ask first (see *Boundaries* in `AGENTS.md`). Justify why it is not part of an existing context and record an ADR in `docs/adr/`.
2. Create `com.city.complaints.<context>/` with `package-info.java` (`@NullMarked`, `@ApplicationModule`) and the `domain / application / infrastructure / web` sub-packages.
3. Update the **context map** in section 4 and the glossary.
4. Add its Flyway migrations (own tables, prefixed by context if the project does so). Never join or write another context's tables.
5. Verify `ModularityTests` passes.

## Add a query / read model (especially for `dashboard`)
1. Add a query record and handler in `application/query`, returning a read-model DTO, not an aggregate.
2. Use a projection or dedicated read SQL. Paginate anything list-shaped. Add indexes in a migration if needed.
3. Never write data from a query handler.

## Add an external integration
1. Define the outbound port in `application/port`; implement the adapter in `infrastructure/client`.
2. Add config to a `@ConfigurationProperties` record, new variables to `.env.example`, timeouts and error handling to the adapter, and a fake for tests.
