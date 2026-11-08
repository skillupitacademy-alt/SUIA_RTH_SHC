# SHC Admin — Phase 2 Deep Source Verification

**Date:** 2026-11-08 (Asia/Kolkata)  
**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`  
**Branch / immutable SHA:** `feature/project-llm-linux-worker` / `4207cb1ca11abc29ca263310f5a4d54b859cd77f` (branch HEAD reverified)  
**Scope:** **SHC Admin** frontend component and hook chains, BFF authorization boundary, and *directly used* SHC shared tutorial repository/service and certificate-preview UI packages. Other applications were not audited.  
**Approach:** read-only repository inspection. **No code edits, deployments, runtime execution, database access or tests were performed.**  
**Parent audit:** `SHC_Admin_Phase1_Source_Audit_2026-11-08.md`; checklist: `SHC_Admin_Architecture_Acceptance_Checklist_v1.md`.

## Evidence notation and decision criteria

The cited `L#` numbers refer to files at the immutable SHA above. **Source-confirmed** proves that a code path or condition exists; **runtime-pending** means its observed behavior and tests have not been executed. *Keep* means retain the SHC Admin experience; *fix within current boundary* and *delegate to shared authority* are future architecture decisions, **not authorization to modify code**.

## 1. Phase 2 results at a glance

| Area | Source review result | Acceptance status | Reason |
|---|---|---|---|
| Admin authentication / proxy | Verified SHC-audience token, `skillhubcore` brand, role+permission checks, mutation-origin validation in API guard | PENDING | Negative tests are written but not run; server-side privileged page protection is still missing (Phase 1 finding) |
| Upstream BFF | Reconstructs trusted identity headers; discards untrusted client identity headers | PENDING | Test mocks exist; end-to-end gateway, revocation, and direct-origin enforcement untested |
| Tutorial editor hydration | AbortController, sequence checking, and unsaved-draft guards implemented | PENDING (positive source evidence) | Hook functionality not runtime-verified |
| Tutorial identity uniqueness | Partial unique index on `(subtopicId,navigationNodeId,brandId)` when not soft deleted | PENDING (positive source evidence) | DB migration existence/installation on Hostinger unverified |
| Tutorial update concurrency | Normal PATCH/service path updates without expected-version predicate | **FAIL** | Concurrent editors may overwrite a newer version even though version-safe repository method exists |
| Tutorial publication | Explicit publish route, nonempty document validation, content-service and cache-invalidation calls | PENDING | Cross-brand visibility, role/object authorization, delivery cache and rollback tests not run |
| Certificate preview tool | Printable, manually populated certificate preview with PDF/PNG download and QR URL | PENDING / high-priority policy risk | Not an authoritative eligibility, issuance, signature or verification workflow |
| Administrative controls | User/subscription demo datasets and TOTP actions requiring absent app-local endpoints | FAIL (Phase 1) | Missing fully wired operational workflows |
| React Query marketing page | `useQuery` consumers and no provider in inspected ancestor layout chain | FAIL (Phase 1) | Browser behavior still needs confirmation |
| Question-bank bulk delete | Single-record delete requires confirmation; multi-select delete calls backend immediately | **FAIL** | Add deliberate bulk-confirmation and audit deleted-record impact |
| Question-factory duplicate preflight | Client logs duplicate-check failures but can proceed with empty duplicate map | PENDING / risk | Verify authoritative backend duplicate and idempotency gates |
| Test framework and boundary tripwire | `test`, `test:security`, `check:boundaries`, `type-check`, `lint`, `build` scripts exist | PENDING | Commands have not been executed; coverage cannot be claimed from files alone |

## 2. New detailed findings

### SHCA-017 — HIGH: Tutorial content update is vulnerable to lost updates between editors

- **Frontend:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/services/tutorialSaveService.ts` **L85-149** performs a GET-existence check followed by `PATCH` of `content` without supplying the version originally loaded by this editor. Client `loadedSectionId` compares identity (L107-117) but not content version. `useTutorialSave.ts` L39-79 delegates to this save method and then calls publish when requested.
- **BFF:** `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts` **L164-238** validates auth/schema then calls `tutorialComposerService.updateTutorialContent(sectionId, parseResult.data, context)` without expected version.
- **Shared backend:** `packages/db-tutorial/src/services/tutorial-composer.service.ts` **L270-310** calls the unversioned repository update. `packages/db-tutorial/src/repositories/tutorial-section.repository.ts` **L393-416** performs `UPDATE ... WHERE id AND deletedAt IS NULL`; **L424-447** has a distinct, version-conditional `updateTutorialContentWithVersion` method that is not used by the normal path.
- **Impact/risk:** Two SHC authors can edit the same tutorial. The second write may silently replace the first editor's changes while incrementing a version number. This is a **confirmed missing concurrency precondition**; no live overwrite test was run.
- **Target architecture:** Keep SHC tutorial editor and existing tutorial service. Introduce a contract that accepts an expected version (`If-Match` or schema field), uses conditional writes/409 conflict semantics, and preserves user drafts with a conflict-resolution UX. Confirm schema migration state rather than creating another tutorial service.
- **Acceptance:** `SHCA-F14`, `SHCA-A06`, `SHCA-U08`; tests for two sessions with same initial version, one success/one conflict, draft preservation, and publish-after-conflict.

### SHCA-018 — HIGH-priority policy/design gap: Certificate tools produce previews, not authoritative credentials

- **SHC entrypages:** `apps/skillhubcore-admin/src/app/(admin)/certificate-generator/page.tsx` and `certificate-preview/page.tsx` delegate to the shared UI package `@quiz/marketing-site/certificates/*`.
- **Frontend:** `packages/marketing-site/src/certificates/CertificateGeneratorPage.tsx` **L13-32** builds a preview URL from user-entered values, **L98-150** maintains form state, and **L307-421** permits manually entered learner, course, certificate ID and verification URL details. `CertificatePreviewPage.tsx` **L52-70** reads those values from the URL query string; **L92-120** and **L167-205** generate downloadable PNG/PDF artifacts in the browser. `PremiumCertificate.tsx` **L484-499** displays a QR URL and verification text.
- **Source conclusion:** This is a reusable **template/preview/export** utility. In this workflow there is **no demonstrated server-side academic eligibility, immutable issuance record, authoritative signature/revocation check, or verification against SHC certification records**. This does *not* prove such a service does not exist elsewhere; it is simply not invoked by these screens.
- **Risks:** An unofficial PDF/QR could be mistaken for a genuine issued certificate. Learner name and certificate data in query strings may enter browser history/referrer/analytics; actual risk depends on deployment and data used.
- **Target architecture:** Keep the preview tool for SHC-authorized template design, but explicitly label outputs **PREVIEW / NOT ISSUED** until an authoritative SHC issuance service creates/validates the credential. Treat certificate verification URLs as untrusted unless issuance lookup confirms them. Decide whether export needs watermarks, dedicated entitlement, audit trail, and PII-safe transport.
- **Acceptance:** `SHCA-F09` stays **PENDING** pending business classification. As a real **issuance** workflow it **cannot pass** without backend evidence. This concern must feed the later Certification Domain audit, without starting that migration now.

### SHCA-020 — MEDIUM: Question-bank bulk deletion has no visible confirmation step

- `apps/skillhubcore-admin/src/components/questions/QuestionTable.tsx` **L236-256** uses an explicit modal for deleting one question. In contrast **L275-289** immediately calls `apiClient.admin.batchDeleteQuestions` for all selected IDs; the bulk-action button at **L397-414** calls this handler without a review/confirmation modal. The backend operation is proxied through `api/admin/questions/batch-delete/route.ts`.
- **Risk:** An accidental bulk click may initiate a destructive multi-record operation without a second confirmation. The backend may still enforce permissions and deletion policy, but that does not replace UI confirmation.
- **Decision:** Keep SHC question-bank management. Add a count-and-identity confirmation UX before destructive bulk operations and verify deletion semantics, impact on existing exams, and server-side authorization.
- **Acceptance:** `SHCA-F23` **FAIL** (source-level), `SHCA-F12` and `SHCA-A05` remain PENDING for broader domain verification.

### SHCA-021 — MEDIUM / pending downstream: Question-factory duplicate-check failure is not a client-side commit blocker

- `apps/skillhubcore-admin/src/components/factory/review/ReviewConsole.tsx` **L181-216** calls `apiClient.admin.checkDuplicates`; a network/service error is logged but does not mark duplication as unknown or prevent later commit. **L287-320** gates commit on `duplicateMap.size`, which may remain empty if a check failed. **L229-255** submits the batch to `apiClient.admin.bulkCreateQuestions`.
- **Risk:** If the authoritative question backend also lacks atomic duplicate validation, an unavailable preflight could lead to duplicate records. **The downstream enforcement has not yet been audited**, so this is a client fail-open observation, not a proven duplicate-insertion vulnerability.
- **Decision:** Require authoritative backend duplicate/idempotency checks regardless of client preflight; show an explicit unresolved verification status in the UI until backend behavior is known.
- **Acceptance:** `SHCA-F12`, `SHCA-F13`, `SHCA-A05`, `SHCA-U08` — PENDING downstream tests.

### SHCA-019 — MEDIUM: Test coverage exists, but acceptance evidence is incomplete

- `apps/skillhubcore-admin/src/lib/__tests__/admin-boundary.test.ts` **L36-113** defines negative cases for forged identity headers, wrong token brand/audience/roles, hostile origins, unauthorized routes and development bypass. **L116-160** checks denial-before-database, cookie behavior and logout cleanup.
- `apps/skillhubcore-admin/src/lib/__tests__/upstream-proxy.test.ts` **L34-70** checks reconstruction of trusted upstream identity and discarded caller-supplied headers.
- `apps/skillhubcore-admin/scripts/check-api-boundaries.mjs` **L19-60** checks that exported route handlers begin with guard calls. Its own description says it is a *regression tripwire*, not runtime proof.
- Tutorial editor tests exist, for example `.../hooks/__tests__/useTutorialSave.test.ts` has mock-based draft/save/publish/error-path tests. These tests mock the service; they do not establish the **real** DB optimistic-concurrency path.
- **Not covered by evidence read here:** successful execution output, real unauthenticated HTML/RSC page denial, cross-brand content authorization in actual backend, Hostinger migration state, concurrent editor conflicts, genuine certificate issuance, SUIA/RTH learner delivery, browser accessibility and production Docker smoke checks.
- **Acceptance:** Source testing infrastructure is present; `SHCA-U11`, `SHCA-A03`, `SHCA-D01..D08` remain **PENDING**, not PASS.

## 3. Source-supported positive patterns to preserve

1. **Verified SHC identity on BFF routes:** `src/lib/auth-helpers.ts` L66-98 verifies admin JWT with exact `shc-admin` audience and `skillhubcore` brand. `src/lib/admin-route-guard.ts` L64-91 maps routes to permissions and rejects unauthorized requests. `src/proxy.ts` matches `/api/:path*`; page-level server guards are still absent.
2. **Upstream identity reconstruction:** `src/lib/upstream-proxy.ts` creates a new set of server-selected headers, SHC brand and verified user/role context instead of forwarding forged caller headers wholesale. `upstream-proxy.test.ts` tests that design through mocks.
3. **Stale-response protection in the editor:** `.../hooks/useTutorialHydration.ts` L121-139 invalidates previous hydration; L172-259 combines cancellation with request sequencing; L265-275 protects local edits; L319-380 rechecks before state updates. Preserve rather than rewrite.
4. **Database-enforced tutorial uniqueness:** `packages/db-tutorial/src/schema/tutorial-sections.ts` L95-107 defines the partial unique identity index. It addresses duplicate *creation*, not editor overwrite during *update*. Migration installation is unverified.
5. **Publish gates in shared tutorial service:** `packages/db-tutorial/src/services/tutorial-composer.service.ts` L363-407 validates schema/non-empty blocks before publishing. Its code comments still mark internal authorization hooks as TODO; the Next route performs checks through a currently role-only helper. That distinction matters.
6. **Existing security/quality commands:** SHC Admin `package.json` defines `check:boundaries`, `test:security`, `lint`, `type-check`, `test`, `build`. The Dockerfile uses a multi-stage pnpm/Node build with `standalone` output conditional on `CLOUD_RUN_BUILD`; portability still needs image and environment verification.

## 4. Deepened frontend/BFF trace matrix

| SHC screen/group | UI and frontend component | BFF/route | Authoritative downstream found | Next acceptance test |
|---|---|---|---|---|
| Login and protected shell | `(public)/login/page.tsx`, `components/auth/AdminGuard.tsx`, `ClientShell.tsx` | `api/auth/login`, `api/auth/me`, API matcher | `src/lib/upstream-proxy.ts` → SHC identity endpoint | Anonymous page HTML/RSC denied, foreign-brand token denied, login redirect allowlist, logout/session revocation |
| Global users | `(admin)/users/*`, `TotpActionModal` | References `/api/admin/users/:id/{suspend,role}`, `/api/admin/auth/verify-totp` | No matching app-local route found; check intended service contract before integration | Real identity and grant source, actor/target permissions, TOTP, safe UX when unavailable |
| Subscriptions | `(admin)/subscriptions/*`, `TotpActionModal` | References `/api/admin/subscriptions/:id`, verify-totp | No matching app-local route found | Authoritative plan membership/entitlement updates, audit, failure safety |
| Dashboard/audit/events/metrics | Page components import static `skillhubcore-admin-data.ts` | No authoritative aggregate BFF used in reviewed pages | Static arrays and hardcoded stats | Real bounded metrics and audit feed; clear demo-only mode until available |
| Academic hierarchy | `questions/page.tsx` tables, `useAdminHierarchy` hooks | `api/admin/{domains,subjects,topics,subtopics,skills}/*` | Some direct Drizzle `@quiz/db` operations (Phase 1) | One service owner, bounded paging, **bulk delete confirmation (SHCA-020)**, safe archive/delete, auth and contract tests |
| Question factory | Question-generator/review UI and factory components | `api/factory/*`, `api/admin/questions/*`, `api/admin/blueprints/*` | Upstream proxy route design | Exact backend owner, duplicate-check fail-open behavior (SHCA-021), batch atomicity, approval state |
| Tutorial editor | `TutorialPageContentBuilderClient`, `useTutorialHydration`, `useTutorialSave`, `tutorialSaveService` | `api/tutorial-composer/sections/*` | `@quiz/db-tutorial` composer service/repository | Same-version edit conflict, brand guards, draft visibility, publication and cache correctness |
| Tutorial sidebar | `SidebarBuilderClient` | `api/tutorial-left-sidebar`, `hierarchy`, `navigation-nodes` | Direct `@quiz/db` and `@quiz/db-tutorial` cross-DB orchestration | Brand-specific/shared tree isolation, sync rollback/retry, navigation identity stability |
| Marketing governance | `(admin)/marketing/page.tsx` | `api/marketing/*` | Configured content-control APIs | Query provider, timeout/error UI, known-brand validation and restricted metrics |
| Certificate design/preview | `CertificateGeneratorPage`, `CertificatePreviewPage`, `PremiumCertificate` | Browser-side query-string preview/export | **No backend issuance in this UI workflow** | Visible preview watermarks, legitimate issuance verification, PII handling |
| Project AI workflow | `tools/project-llm/*`, `projectLlmClient` | `api/project-llm/[...path]` | Separate Project AI backend | Per-operation backend grants, workflow ownership, upload constraints, durable approval; no client-only human signoff |

## 5. Evidence-based local verification backlog (no paid CI required)

The repository is not present as an executable checkout in the current audit environment; direct GitHub container access cannot be used to execute it. **These commands are recommended, not executed:**

```bash
# From a clean local checkout of the reviewed SHA, with safe test configuration
pnpm install --frozen-lockfile
pnpm --filter @quiz/skillhubcore-admin check:boundaries
pnpm --filter @quiz/skillhubcore-admin lint
pnpm --filter @quiz/skillhubcore-admin type-check
pnpm --filter @quiz/skillhubcore-admin test:security
pnpm --filter @quiz/skillhubcore-admin test
pnpm --filter @quiz/skillhubcore-admin build
```

Before running any database-backed integration tests, confirm no credentials point at your development or Hostinger live databases. Capture command exit codes/logs. Test the exact Docker image that will be deployed and record its source SHA and digest. Current evidence does **not** establish these commands pass.

| Test | Scenario | Expected acceptance | State |
|---|---|---|---|
| SHC-AUTH-01 | Anonymous `GET /dashboard` including HTML/RSC | No privileged payload or private data returned | NOT RUN |
| SHC-AUTH-02 | RTH/SUIA/admin-forged token into SHC API | 401/403 without downstream write | NOT RUN |
| SHC-AUTH-03 | Invalid origin/forged user headers | Denied or replaced with verified identity | NOT RUN |
| SHC-CONTENT-01 | Two editors load version 1, both PATCH | One succeeds; stale editor gets a conflict and keeps changes | NOT RUN; current source path lacks required version precondition |
| SHC-CONTENT-02 | Create same tutorial page concurrently | Exactly one active `(subtopic,node,brand)` record | NOT RUN; unique index source exists |
| SHC-CONTENT-03 | Publish empty/draft/foreign-brand content | Invalid/unauthorized operations denied; authorized publish delivered correctly | NOT RUN |
| SHC-NAV-01 | Sidebar cross-DB hierarchy sync interrupted | Consistent recoverable state; no partially visible navigation | NOT RUN |
| SHC-CERT-01 | Manual preview PDF and arbitrary verification ID | Clearly marked unissued; official verification rejects unknown ID | NOT RUN |
| SHC-FE-01 | Marketing Governance page in authorized browser | Renders without QueryClient error; transparent failures | NOT RUN |
| SHC-OPS-01 | Local build, test, Docker image smoke and Hostinger SHA | Recorded passing evidence, deployment portability | NOT RUN |

## 6. Phase 2 decisions

- **Do not start enquiry/admission migration.** Continue the agreed app-by-app audit sequence only after SHC Admin compliance evidence is reconciled.
- **Do not delete SHC tutorial/Project AI components.** Preserve existing shared logic, tested identities and editor race protections. The data/permission/concurrency contracts need targeted fixes later.
- **Do not treat certificate preview as issuance.** It may remain a design tool, subject to explicit preview policy; authoritative certification is a later shared-domain audit.
- **Do not mark tests PASS based on source assertions.** The security test source is valuable but no execution happened in this review.
- **Highest-risk follow-ups** before any real student onboarding: server-side page authorization, absent TOTP operational actions, source-defined role-only brand grant policy, hierarchy data deletion, tutorial concurrent writes and certificate authenticity semantics.
- **Portability remains a release constraint**: application code and Docker images must not rely on Hostinger-only business logic; service config, DB migrations and backup/restore procedures must support alternative vendors.

**Phase 2 verdict: SHC Admin remains NOT ACCEPTED (source failures + unexecuted verification gates).** No repo, database, Hostinger environment or CI/CD modifications were made.
