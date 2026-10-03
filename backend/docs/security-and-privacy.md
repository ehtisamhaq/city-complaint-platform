# Authorization, Audit and Personal Data

Rules referenced from `AGENTS.md`. They apply to all contexts.

- **Roles:** at least `CITIZEN`, `STAFF`, `DEPARTMENT_ADMIN`, `ADMIN` (confirm the real list in `auth`). Enforce in application services with `@PreAuthorize`, in addition to URL rules.
- **Ownership rules (enforce in the service and cover with tests):**
  - A citizen can read and act only on their own complaints and feedback.
  - Staff can access only complaints assigned to them or to their department.
  - Dashboards and reports are limited by role and department scope.
  - Never trust an ID from the client for ownership; derive the current user from the security context.
- **Audit fields:** every persisted aggregate has `createdAt`, `createdBy`, `updatedAt`, `updatedBy` (Spring Data auditing with `Instant` in UTC). Complaint status changes are recorded as history entries (who, when, from, to, reason).
- **Deletion:** prefer state changes (`WITHDRAWN`, `CLOSED`) or soft delete for complaints and feedback. Hard delete only for data-retention or erasure requirements, through a dedicated, audited use case.
- **Personal data (PII):** citizen name, contact details, address, and complaint text are personal data. Collect the minimum, never log it, never send it to third parties (including LLM providers) unless explicitly approved, mask it in non-production data, and expose only what each role needs. Follow the project's retention policy; if none exists, ask before inventing one.
