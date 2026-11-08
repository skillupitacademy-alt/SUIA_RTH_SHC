# Project-Wide Service Acceptance Standard — Draft v1.0

**Applies to:** Every existing/new SHC domain service, SHC Admin module, SUIA/RTH portal/BFF, integration, database migration and deployable component. Select an applicable checklist profile rather than applying every endpoint check to a static UI component.

## 1. Status and evidence model

Five architecture states retained from `FinalAechitecture.md`:

- **Implemented and verified:** Implementation exists and behavior is demonstrated by reviewed source plus relevant passing automated/runtime evidence tied to a specific commit/deployed revision.
- **Implemented but unverified:** Implementation exists but required testing or deployment evidence is missing.
- **Partially implemented:** Some requirements are absent/incomplete.
- **Not implemented:** Required capability is absent, confirmed by sufficient inventory evidence.
- **Not applicable:** Explicit technical rationale documented.

Separately record acceptance **PASS / FAIL / PENDING / N/A**. A passing design review never substitutes for security/runtime verification. Every row records `requirement_id`, `owner`, `component`, `source_path`, `commit_sha`, `observed_behavior`, `test_name`, `test_result`, `risk`, `decision`, `reviewer`, `date` and exceptions/expiry.

## 2. Universal architecture gates

| Gate | Verification and pass criterion |
|---|---|
| U-01 Ownership | One authoritative owner of each business rule; no duplicated brand implementations; integration contract documented. |
| U-02 SRP/SoC | Related responsibilities cohesive; UI/API/domain/persistence/infra responsibilities appropriately separated. |
| U-03 SOLID & dependency direction | Domain does not depend on UI/framework/ORM internals unnecessarily; contracts honored; no forbidden cross-app imports/cycles. |
| U-04 DRY/KISS/YAGNI | Actual duplication removed where worthwhile; no speculative abstractions. |
| U-05 Brand-aware behavior | Tutor-led versus online/AI-led behavior defined by validated policies and UX rather than separate academic rules. |
| U-06 API/data contracts | Typed/versioned request, response and event contracts; explicit validation and compatibility tests. |
| U-07 Security | Trusted identity and brand resolution, authz/resource ownership, least privilege, CSRF as applicable, secrets handling, abuse controls. |
| U-08 Data integrity | Storage owner, constraints, transaction boundaries, migrations, retention, backups; idempotency for risky mutations. |
| U-09 Error/resilience | Correct error handling, bounded timeouts/retries, predictable degraded behavior, no secret/PII leaks. |
| U-10 Observability | Actionable metrics/logs/traces with request correlation and safe brand context. |
| U-11 Testing | Required unit, integration, contract, negative security, E2E and load cases pass for applicable risk. |
| U-12 Portability | Container build, env/secret contracts and persistence/config ownership do not hardcode the infrastructure provider. |
| U-13 Release evidence | Local gate report, exact commit, image digest/version, smoke test, recovery/rollback notes. |

## 3. Component-specific profile gates

### Backend SHC educational domain service

- B-01: Enquiry/admission/batch/etc. lifecycle and state invariants explicitly tested.
- B-02: Protected reads/writes/aggregates enforce brand and object-level authorization server-side.
- B-03: Public endpoints explicitly declared, schema/size/rate limits tested; untrusted headers rejected.
- B-04: Data owner/repository contract and controlled migrations demonstrated.
- B-05: Transactional and duplicate-request handling proven for mutations; async notifications do not roll back committed core records.
- B-06: Positive/negative cross-brand tests, malformed input, dependency failure and recovery verified.

### Brand application / admin UI

- F-01: SHC shared service contracts consumed; no independent authoritative educational logic.
- F-02: Brand-specific theme, visible fields, enrollment and tutor/online/AI policies correct.
- F-03: Auth and brand permissions checked on server; hiding UI controls is not considered security.
- F-04: Mobile/responsive, accessible labels/error states/keyboard navigation; no false success states.
- F-05: No sensitive data in public caching, client logs or browser storage beyond approved policy.
- F-06: Integration/E2E test for each major brand/student/staff journey.

### Cross-brand/integration

- I-01: SUIA data not readable or writable by RTH ordinary users/staff, and vice versa.
- I-02: Existing global identity does not grant automatic brand membership/enrollment.
- I-03: API gateway/edge/direct-origin controls cannot be bypassed by forged headers.
- I-04: Shared schema/version changes remain compatible with both branded applications.
- I-05: Runtime failure in one brand/AI delivery does not unnecessarily block unrelated operations.

### Hostinger Docker/local release

- D-01: `pnpm` install with lockfile and required typecheck/lint/unit/integration/security tests pass in a safe test environment.
- D-02: All affected package/application builds pass, including dependency impact.
- D-03: Docker Compose configuration and health checks pass; controlled secrets and environment validation.
- D-04: Migration and backup/restore verification before stateful changes.
- D-05: Exact Git SHA, image tag/digest and evidence log saved; deployed image identified.
- D-06: Smoke tests for SHC/SUIA/RTH, including an authorization-denial case; rollback plan documented.
- D-07: Tests validated at the intended scale tier; load/capacity evidence is required before claiming future concurrency readiness.

## 4. Hard release blockers

A change must **not** be approved for deployment when it has: unresolved critical/high security vulnerabilities, demonstrated cross-brand/object-level access violations, required failed functional/security/integration tests, destructive or unverified critical migration, failing mandatory build/type gate, exposed secrets, or absent recovery for risky state changes.

For the current pre-user development phase, documented lower-risk gaps may be accepted explicitly with owner and due date; this is not an excuse to sign off user-data security violations. Tests run locally can be accepted if outputs are retained and reviewed, but are less tamper-resistant than mandatory server-side CI. Re-evaluate automation requirements before accepting paying students or scaling production.

## 5. Service-specific extensions

- **Enquiry:** submission channel provenance, abuse/duplicate controls, consent and PII retention.
- **Admission:** confirmed brand grant, identity bridge, transitions, invitations and enrollment transaction.
- **Batch/schedule:** faculty availability vs online/AI policy, collisions, capacity, correct assigned membership.
- **Tutorial:** canonical content, entitlements, durable progress, safe content rendering, telemetry integrity.
- **Assessment/exams:** authoritative grading, submission idempotency, deadlines, result integrity, concurrency.
- **Mentoring/guidance and doubt solving:** tutor/AI access policy, permitted content/retrieval, session retention, escalation and abuse control.
- **Placement:** scoped eligibility, third-party employer permissions, safe exports, state transitions.
- **Experience letter:** issuer authority, accurate evidence, issuance/version/revocation and authenticity checks.
- **Certification:** eligibility, assessment provenance, document authenticity, audit trail and revocation.
