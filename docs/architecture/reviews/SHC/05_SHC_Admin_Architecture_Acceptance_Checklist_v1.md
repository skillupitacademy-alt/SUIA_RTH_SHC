# SHC Admin — Application Architecture Acceptance Checklist (Draft v1.0)

**Scope:** `apps/skillhubcore-admin` frontend pages, components, BFF/API routes, authentication/authorization, upstream/shared-backend integrations, database/data consumers, tests, deployment and portability.

**Reviewed source inventory:** `skillupitacademy-alt/SUIA_RTH_SHC`, `feature/project-llm-linux-worker`, commit `4207cb1ca11abc29ca263310f5a4d54b859cd77f` (branch head checked on 2026-11-08). **This is a checklist preparation / source-tree inventory, not a completed code audit or a passing test result.** Validate source branch and running Hostinger image SHA again when conducting the actual audit.

**Governing documents:** `ProjectSoftwareArchitectureStandard.md`; `ProjectServiceAcceptanceStandard.md` (U-01..U-13, F-01..F-06, I-01..I-05, D-01..D-07); `ProjectImplementationWorkflow.md`; `FinalAechitecture.md`.

## 0. Operating rules and how to mark status

- Every item begins as **PENDING**; `- [ ]` means **not yet verified**, not a failed test. Track **PASS / FAIL / PENDING / N/A** separately from the five implementation states: Implemented and verified / Implemented but unverified / Partially implemented / Not implemented / Not applicable.
- Record for each item: `requirement_id`, page/endpoint/module, source location + line, branch and commit, observed code behavior, applicable shared service owner, verification command/test and output, security risk, decision (**keep / refactor / delegate / retire after migration**), reviewer, review date.
- SHC **Admin UI** administers shared capabilities; SHC **domain authority** may initially reside in existing services. Do not assume the folder `skillhubcore-service` must contain every module; trace the real owning service before recommending movement.
- Read-only baseline audit first. Do **not** delete brand-admin routes or move data during this phase. No claim that a feature is passing based on its presence in a folder.

## 1. Cross-cutting architecture acceptance gates — every page and API

- [ ] **SHCA-U01 (U-01)** Identify one authoritative service for each business action; SHC Admin is a client/BFF unless it is the accepted domain owner.
- [ ] **SHCA-U02 (U-02)** Verify separation of page presentation, BFF/controller orchestration, domain rules and persistence. Check direct SQL/ORM writes inside routes.
- [ ] **SHCA-U03 (U-03)** Verify SRP, OCP, LSP, ISP, DIP in context; correct dependency direction, no forbidden cross-app imports or cycles.
- [ ] **SHCA-U04 (U-04)** Check DRY/KISS/YAGNI: remove real duplication, avoid speculative service layers or rewrites.
- [ ] **SHCA-U05 (U-05)** Verify shared educational resources work for SUIA and RTH via controlled brand visibility and tutor/online policies.
- [ ] **SHCA-U06 (U-06)** Validate typed/compatible API and event contracts; request/response schemas, pagination, field bounds and error responses.
- [ ] **SHCA-U07 (U-07)** Verify identity, staff/admin roles, permission-based actions, object ownership, brand context, CSRF/origin rules and least privilege.
- [ ] **SHCA-U08 (U-08)** Record authoritative tables, writers, constraints, migrations, rollback/retention and idempotency for high-risk mutations.
- [ ] **SHCA-U09 (U-09)** Confirm failure-safe errors, timeouts/retries, cancellation semantics and PII/secret-safe logs.
- [ ] **SHCA-U10 (U-10)** Verify actionable security/operation audit logs, metrics, correlation IDs and meaningful failure detection.
- [ ] **SHCA-U11 (U-11)** Check unit, integration, contract, negative authorization and appropriate E2E tests for each significant workflow.
- [ ] **SHCA-U12 (U-12)** Verify Docker/OCI/env config and vendor portability of app code and integration boundaries.
- [ ] **SHCA-U13 (U-13)** Record actual test outputs, relevant Git SHA, Docker image identifier, smoke checks and risk acceptance decisions.

## 2. Frontend — page-by-page / feature-group checklist

For **each** page below, inspect its full component tree and requests. Record page entry path, imported components, server/client status, auth conditions, user actions, loading/empty/error states, BFF endpoint, backend authority, table(s), tests, and KEEP/REFACTOR/DELEGATE decision. Verify F-01..F-06 as applicable.

### 2.1 Authentication and shell
- [ ] **SHCA-F01** `(public)/login/page.tsx`: admin identity, redirect handling, verified roles, session lifetime, and no open redirect or incorrect brand access.
- [ ] **SHCA-F02** `(admin)/layout.tsx`, `ClientShell`, shell context, header/sidebars: navigation permission policy, accessible responsive UI, zero sensitive data leaks to unauthorized viewers.
- [ ] **SHCA-F03** `(authenticated)/layout.tsx` and protected question/factory layouts: no role or privilege bypass between route groups.

### 2.2 Central platform operations
- [ ] **SHCA-F04** `(admin)/dashboard/page.tsx`: all totals and KPIs derived from authoritative sources; distinguish global vs brand-scoped data and remove/label demo fixtures.
- [ ] **SHCA-F05** `(admin)/users/page.tsx` and `users/[userId]/page.tsx`: global identity vs explicit brand membership, permission-based account administration, PII controls and accurate status.
- [ ] **SHCA-F06** `(admin)/subscriptions/page.tsx` and `subscriptions/[id]/page.tsx`: plan/entitlement ownership, controlled updates, SUIA/RTH access grants not inferred from mere identity.
- [ ] **SHCA-F07** `(admin)/audit/page.tsx`, `events/page.tsx`, `metrics/page.tsx`: live authoritative evidence, secure filtering, defensible global permissions, safe export/redaction.
- [ ] **SHCA-F08** `(admin)/marketing/page.tsx`: shared marketing control vs each brand's own content/channel, correct brand config and attribution.
- [ ] **SHCA-F09** `(admin)/certificate-generator/page.tsx`, `certificate-preview/page.tsx`: issuing authority, eligibility, document authenticity, brand templates, approval and revocation. Confirm whether these are production workflows or previews/tools.
- [ ] **SHCA-F10** `(admin)/content-generation/layman-architecture/page.tsx`: proper purpose, resource use, no accidental privileged operations or unused scaffold content.

### 2.3 Academic hierarchy, question authoring and factory
- [ ] **SHCA-F11** Domains, subjects, topics, subtopics and skills admin flows: canonical hierarchy ownership, referential integrity, no duplicate CRUD service rules, safe publish/delete semantics.
- [ ] **SHCA-F12** `(authenticated)/questions`, new/edit, question generator/factory/review: validation, question provenance, quality controls, permissioned approval/publish and exam downstream compatibility.
- [ ] **SHCA-F13** Blueprint/factory components: coherent responsibilities, stable versioned output and idempotent bulk ingestion.

### 2.4 Tutorial content management (shared SHC authority)
- [ ] **SHCA-F14** `tools/tutorial-page-content/page.tsx`, builder/editor/preview/hooks: shared canonical content, correct save/publish lifecycle, durable document versions and tests.
- [ ] **SHCA-F15** `tools/tutorial-block-composer/page.tsx`: block schema/normalization/versioning, validation, unsafe content and change compatibility.
- [ ] **SHCA-F16** `tools/tutorial-left-sidebar/page.tsx`, components and navigation helpers: deterministic hierarchy, accurate node IDs, stable ordering and cross-brand navigation behavior.
- [ ] **SHCA-F17** Preview/publish integration: confirm authorized content visibility on **both** `skillup-web` and `realtutorialhub-web`; prevent draft leakage or cross-brand permission bypass.

### 2.5 Project AI / LLM tools
- [ ] **SHCA-F18** `tools/project-llm/*` (create, registry, explorer, matrix, mix-match, workflow details, upload, reviews, certification, handoff): identify what is privileged admin tooling versus reusable shared backend.
- [ ] **SHCA-F19** Validate AI provider requests, tool permissions, secrets, upload/input bounds, costs, timeouts, cancellation and background/worker isolation.
- [ ] **SHCA-F20** Verify progress/status UI reflects durable backend state, not frontend-only claims; tested failure/retry and review/approval workflows.

### 2.6 Generic frontend correctness
- [ ] **SHCA-F21** Every page: no stale placeholder/mock data presented as live metrics; accurate dates, locale and brand values.
- [ ] **SHCA-F22** Every page: responsive mobile/tablet/desktop, keyboard navigation, semantic labels, error and loading states, safe empty-state behavior.
- [ ] **SHCA-F23** Every write action: confirmation for destructive operations, double-click/idempotency behavior, success only after confirmed backend success.
- [ ] **SHCA-F24** Every Next.js route: framework-correct `params`/`searchParams` and server/client boundaries; no inappropriate browser/server API usage.

## 3. BFF / API route-group checklist

For every route group, map `frontend action -> BFF/API route -> actual authoritative backend -> repository -> table/storage` and classify each operation. Check input, auth, permission, brand-scope, idempotency and error handling.

- [ ] **SHCA-A01** `api/auth/*` and `api/admin/auth/me`: verify login/logout/session/refresh boundaries, cookie security, audience, role, CSRF and access revocation.
- [ ] **SHCA-A02** `src/proxy.ts`, `lib/admin-route-guard.ts`, `lib/auth-helpers.ts`: effective protection including direct route hits and all HTTP methods; no untrusted forwarded admin claims.
- [ ] **SHCA-A03** `lib/upstream-proxy.ts`, project-LLM backend client: trusted service-to-service authentication; no cookie/header/secret leaks or header spoofing; appropriate timeout and response checks.
- [ ] **SHCA-A04** `api/admin/{domains,subjects,topics,subtopics,skills}/*`: bulk CRUD, ownership, object-level permissions, schema validation, deletion and pagination.
- [ ] **SHCA-A05** `api/admin/questions/*`, `api/admin/blueprints/*`, `api/factory/*`: canonical question bank ownership, strict contracts, bulk mutation safety, event/approval lifecycle.
- [ ] **SHCA-A06** `api/tutorial-composer/*`: draft/write/publish routes, content versioning, transactional integrity, safe rendering and authorization.
- [ ] **SHCA-A07** `api/tutorial-left-sidebar/*`: navigation creation, validation, hierarchy and cross-brand usage.
- [ ] **SHCA-A08** `api/project-llm/[...path]/*`: route allowlist, worker auth, protected uploads, resource limits, error propagation and durable jobs.
- [ ] **SHCA-A09** `api/marketing/*`: brand-aware control plane and public collector abuse boundary, webhook/signature/ingest security where relevant.
- [ ] **SHCA-A10** `api/logs/client`, `api/health`: bounded input, no sensitive log injection, correct liveness/readiness semantics.
- [ ] **SHCA-A11** Inspect **all remaining API route files**, including `GET/HEAD/OPTIONS` and wildcard routes, and record exact authorization/ownership evidence. No uninspected route is accepted.

## 4. Cross-system and SHC role-boundary verification

- [ ] **SHCA-I01** SHC Admin may administer common academic resources but may not silently bypass brand-student restrictions; cross-brand access requires explicit RBAC and audit.
- [ ] **SHCA-I02** SUIA/RTH consumers rely on the **same** authoritative content/assessment/certification contracts where applicable; no duplicated rule ownership.
- [ ] **SHCA-I03** No direct origin, gateway, bearer/cookie or forged header request can bypass SHC permission or brand checks.
- [ ] **SHCA-I04** Content versioning and schema modifications keep both branded portals compatible (run consumer contract checks).
- [ ] **SHCA-I05** Project AI/marketing/analytics failure does not break core identity/content administration; verify graceful degradation.
- [ ] **SHCA-I06** Flag brand-specific student-administration screens or writes inside SHC Admin for intentional review; do not move screens by assumption.

## 5. Tests, deployment and risk qualification

- [ ] **SHCA-D01 (D-01)** Run app-specific lint, type-check, unit/integration/security tests in safe isolated environment; record exact output. **Not run during checklist preparation.**
- [ ] **SHCA-D02 (D-02)** Build SHC Admin and impacted package dependencies; verify framework output and type contract.
- [ ] **SHCA-D03 (D-03)** Validate exact Docker Compose overlay, port/health checks, environment and secret handling for Hostinger.
- [ ] **SHCA-D04 (D-04)** Check database migrations and recoverable backup for any stateful change; do not run destructive migrations during audit.
- [ ] **SHCA-D05 (D-05)** Tie tested Git SHA to Docker image digest/tag and deployed Hostinger version, not merely repository branch name.
- [ ] **SHCA-D06 (D-06)** Authorized SHC admin smoke tests and negative access tests: anonymous, SUIA staff, RTH staff, SHC read-only role, invalid brand; document evidence.
- [ ] **SHCA-D07 (D-07)** Record reasonable development-stage performance baselines and bottlenecks without unproven million-user claims.
- [ ] **SHCA-D08** Provider portability: no Hostinger-only application business logic; Docker image works with external env config, persistent storage and migration plan for second provider/VM.

## 6. Initial source-inventory notes (NOT verdicts)

Repository source-tree observations from the cited commit:

- `apps/skillhubcore-admin/src/app` contains **172 tracked files** (pages, components, routes, styles and tests).
- `apps/skillhubcore-admin/src/components` contains **32 tracked component files**.
- `apps/skillhubcore-admin/src/lib` contains **29 tracked files**, including auth, proxy and project-LLM support modules.
- `src/lib/skillhubcore-admin-data.ts` contains static example users, subscriptions, audit entries, metrics and events. **Audit where it is imported and whether any page mislabels them as live.** Do not assume all pages use it.
- `src/lib/admin-route-guard.ts` includes role/permission and mutation-origin logic. **Audit enforcement paths and exceptions**, including whether real allowed origins match the deployed Hostinger/edge architecture.
- This inventory is **not** runtime verification; neither build nor tests were executed during checklist preparation.

## 7. Complete SHC Admin acceptance record

| Field | Required value |
|---|---|
| App | `apps/skillhubcore-admin` |
| Review branch/commit | Record immutable SHA at audit start |
| Deployed SHA/image | Capture from Hostinger runtime separately |
| Source files assessed | Exact list and relevant lines |
| Criteria | U-01..U-13, F-01..F-06, I-01..I-05, D-01..D-07 + SHCA-IDs |
| Each item status | PASS / FAIL / PENDING / N/A with justification and five-state implementation label |
| Major security findings | File/line + tested or not-tested qualifier |
| Decisions | KEEP / REFACTOR / DELEGATE / RETIRE AFTER VERIFIED MIGRATION |
| Evidence | Test commands/logs, contract test IDs, browser checks, Docker checks |
| Final result | **PENDING**, until all mandatory evidence is collected and blocking defects resolved |

**Next after SHC Admin checklist and audit:** prepare and execute distinct checklists for `apps/skillup-web`, then `apps/realtutorialhub-web`, then `apps/skillupitacademy-site` and `apps/realtutorialhub-site`. Then produce a cross-app dependency/ownership map. Only afterward audit existing enquiry/admission/other capabilities across the relevant old brand admin apps and shared backends. Legacy code removal is the **last** step, never the starting step.
