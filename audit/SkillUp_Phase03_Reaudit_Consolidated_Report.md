# SkillUp-Web — Phase 03 Principal Architect Audit Report

**Audit date:** 2026-11-01
**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`
**Pinned source commit:** `e1b26a9e0e4feb0da38adf400e94dc911f495b2c` (`feature/project-llm-linux-worker`)
**Mode:** Read-only static review; no builds, tests, credentials, DB queries, deployments or modifications performed.
**Phase objective:** Trace student onboarding, dashboard, batch enrollment, attendance, payments, placement, programs and faculty from application API into relevant data helpers; establish correctness, truthful empty/error states, and authorization dependencies.

## Re-audit update (2026-11-01)

This revision uses the earlier Phase 03 report as its historical findings baseline and independently cross-checks the principal student data helper, onboarding handlers, shared profile BFF, onboarding cookie, and end-user payments/assessment surfaces against pinned commit `e1b26a9e0e4feb0da38adf400e94dc911f495b2c`. The previous review did not constitute runtime verification. No source changes, tests, DB access, deployments, or migrations were performed.

**Additional confirmed finding PH03-015:** Recording URLs are synthesized from session IDs without an asset lookup or entitlement validation in the inspected helper. In `apps/skillup-web/src/lib/skillup-data.ts` lines **302–308**, **340–346**, and **539–544**, a completed session receives `https://learn.skillupitacademy.com/recordings/${session.id}` even when its data query selected no recording asset. This can present nonexistent or inaccessible recordings as available. **Severity P2**, confirmed URL fabrication; actual access or link breakage is not runtime verified. Resolution requires a recording table/storage reference, entitlement check, and unavailable state.

**Further confirmed nuance:** The payments endpoint does filter SQL rows by `pp.user_id = $1` in `skillup-data.ts` lines **391–402**; ownership filtering is therefore present at this particular data-access query. This does not prove that the supplied `userId` corresponds to the payment database principal, which remains a Phase 02 identity-mapping dependency.

**Further confirmed nuance:** The end-user onboarding component posts to `/api/auth/onboarding` (`OnboardingPage.tsx` lines **24–42**) while the SkillUp-specific route reviewed is `/api/onboarding` (`apps/skillup-web/src/app/api/onboarding/route.ts` lines **12–68**). The exact `/api/auth/onboarding` implementation in shared/auth routing needs verification before calling this mismatch an execution failure.

## Executive decision

**Phase 03 static assessment report: delivered. Phase 03 exit criteria: NOT PASSED.** Multiple confirmed user-facing data-integrity defects remain in the pinned source; full backend/payment/placement ownership verification and tests are not completed. The audit must not be equated with remediation or production certification. Phase 04 should remain on hold if the agreed rule is to advance only after phase exit criteria are passed.

## Reviewed source inventory (principal files)

Application data and API: `apps/skillup-web/src/lib/skillup-data.ts` (624 lines), `src/lib/skillup-api.ts` (88), `src/app/api/onboarding/route.ts` (73), `src/app/api/onboarding/session/route.ts` (23), `src/app/api/profile/route.ts` (22), `src/app/api/student/dashboard/route.ts` (14), `src/app/api/student/attendance/route.ts` (14), `src/app/api/student/my-batch/route.ts` (14), `src/app/api/student/payments/route.ts` (14), `src/app/api/student/placement/route.ts` (14), `src/app/api/batches/route.ts` (14), `src/app/api/faculty/route.ts` (45), `src/app/api/programs/route.ts` (45), `src/app/api/programs/[slug]/route.ts` (62).

Related end-user pages and shared dependencies previously inspected and cross-referenced: `src/app/student/page.tsx`, `student/attendance/page.tsx`, `student/my-batch/page.tsx`, `student/payments/page.tsx`, `student/placement/page.tsx`, `student/exams/page.tsx`, `src/app/batches/page.tsx`, `src/app/programs/page.tsx`, `src/app/faculty/page.tsx`, `src/app/onboarding/page.tsx`, `src/app/placement/PlacementBridgeClient.tsx`, `src/share-branding/OnboardingEngine/components/OnboardingPage.tsx`, `src/share-branding/onboardingPageData.ts`, `src/share-branding/onboardingSessionCookie.ts`, `src/share-branding/auth/bffProfileHandler.ts`. App paths above are relative to `apps/skillup-web/`, unless beginning `src/share-branding/`.

**Coverage caveat:** The core 624-line data helper was fully retrieved in Round 13 and key paths were verified against the pinned commit here. This phase's evidence includes previous rounds' complete-source reviews and current selective cross-checks. It does not establish a fresh complete line-by-line re-review of every listed UI/backend dependency, so full integration certification is not claimed.

## Findings

### PH03-001 — P1 — Fake learner batch shown when no active enrollment (CONFIRMED)
- Source: `apps/skillup-web/src/lib/skillup-data.ts`, **88–107, 312–320, 512–517**.
- `getStudentBatchContext` returns null when no active enrollment; `getSkillupMyBatch()` and `getSkillupBatches()` return `FALLBACK_BATCH` instead of an explicit unenrolled state. The fallback includes faculty, sessions/materials and learner count.
- Consequence: Product reports nonexistent enrollment/classes as real. The `GET /api/student/my-batch` and `/api/batches` wrappers faithfully expose the fabricated response.
- Remediation: Return typed `not_enrolled`/empty state; distinguish DB outage from absent enrollment; render explicit CTA only when authorized.

### PH03-002 — P1 — Fabricated programs/faculty used on empty DB/errors (CONFIRMED)
- Source: `skillup-data.ts`, **37–87, 209–245, 548–589**.
- Program and faculty helpers fall back to hardcoded records; programs fallback occurs on empty result and in catch; faculty synthetic records and hero metrics are surfaced under failure/empty branches.
- Consequence: A learner sees invented offerings, faculty and statistics instead of accurate catalog or service error.
- Remediation: Remove production synthetic fallbacks; permit explicit demo-mode fixtures only; use typed empty/error responses.

### PH03-003 — P1/P2 — Synthetic placement readiness/interview counts and job matches (CONFIRMED)
- Source: `skillup-data.ts`, **109–123, 419–507**, notably **454, 464, 489, 501–506**.
- Interview count is derived from readiness score, and some job-match scores are generated from index/readiness rather than proven student-job matching. A hardcoded profile appears if no active record exists.
- Consequence: Learners receive misleading career guidance and fabricated activity metrics.
- Remediation: Derive interviews from actual interview records; return true matches or clearly label rankings as estimates with provenance; use a legitimate empty placement state.

### PH03-004 — P2 — Attendance numerator and denominator use different scopes (CONFIRMED)
- Source: `skillup-data.ts`, **265–280**.
- Present-count query aggregates attendance for the user across batches; denominator counts sessions for one selected active batch. Ratio can exceed 100%, and attendance may include irrelevant classes.
- Remediation: Filter numerator by the exact batch/session universe in denominator; avoid duplicate records; add zero-sessions and multi-batch tests.

### PH03-005 — P2 — Payment amounts from divergent sources / silent empty result (CONFIRMED)
- Source: `skillup-data.ts`, **248–274, 374–417**.
- Dashboard due amount uses `paymentInstallments` in the people DB; dedicated payments page uses an external payment DB query. If payment connection is absent, `getSkillupPayments` returns an empty list instead of misconfiguration error.
- Consequence: Payment due shown on dashboard may disagree with installments view; missing infrastructure can masquerade as paid/empty state.
- Remediation: Authoritative payment service and reconciliation contract; observable missing-DB error; tests for both endpoints for same learner.

### PH03-006 — P2 — Dashboard “placement matches” counts all open jobs (CONFIRMED)
- Source: `skillup-data.ts`, **294–300**.
- The count has no per-student match filter, despite UI label `Job matches` in `src/app/student/page.tsx`.
- Remediation: Join to matching results for authenticated student or relabel as `Open opportunities`.

### PH03-007 — P2 — Onboarding completion and skip redirect even after failed persistence (CONFIRMED)
- Source: `src/share-branding/OnboardingEngine/components/OnboardingPage.tsx`, **24–42, 67–113**.
- In both catch blocks an error is logged but router still navigates to `/dashboard`.
- Consequence: Failed saves appear successful; subsequent server redirect may loop/return to onboarding.
- Remediation: Preserve state, show error and retry; navigate only on verified success.

### PH03-008 — P2 — Onboarding BFF and client paths require end-to-end contract validation (CONDITIONAL)
- Source: `apps/skillup-web/src/app/api/onboarding/route.ts`, **20–68**; `OnboardingPage.tsx`, **24–42**.
- BFF maps `POST /api/onboarding` to gateway `/auth/onboarding` with `createInternalHeaders`; client submits `/api/auth/onboarding`. Verify actual gateway/Next auth proxy routing rather than assuming both are equivalent. The BFF chooses gateway URL from substring `hostname.includes('skillup')`; this is a fragile alternative to canonical brand resolution.
- Remediation: One documented route and canonical host/brand resolution; integration test client->BFF->gateway->backend->DB.

### PH03-009 — P2 — Unauthenticated onboarding-session endpoint stores client-provided journey state (CONFIRMED endpoint; downstream impact conditional)
- Source: `apps/skillup-web/src/app/api/onboarding/session/route.ts`, **8–22**; `src/share-branding/onboardingSessionCookie.ts`.
- Request sets HttpOnly cookie based on parsed client payload without authentication. It must not be treated as authoritative backend completion proof. `onboardingPageData.ts` uses it for form seeding; full set of other consumers must be verified.
- Remediation: Treat cookie as untrusted draft only; server-authoritative onboarding gate; explicit TTL and integrity strategy if used for decisions.

### PH03-010 — P2 — Program curriculum generated from marketing highlights (CONFIRMED)
- Source: `skillup-data.ts`, **594–624**.
- Detail helper constructs generic curricular sections instead of reading actual learning modules and published curriculum.
- Consequence: Program detail may promise content not tied to the course structure.
- Remediation: Use published curriculum records and represent missing curriculum as empty/unpublished.

### PH03-011 — P2 — Dashboard visual bars are hard-coded while values are dynamic (CONFIRMED)
- Source: `apps/skillup-web/src/app/student/page.tsx`, **around 78–103**.
- Attendance/progress/upcoming/job bars use fixed class widths (`86%`, `68%`, `54%`, `62%`) regardless of displayed values.
- Remediation: Compute proportional widths from actual bounded values; use appropriate scales for counts.

### PH03-012 — P2 — Exam/payments calls to action not functional (CONFIRMED)
- Source: `apps/skillup-web/src/app/student/exams/page.tsx` and `src/app/student/payments/page.tsx`.
- Static assessment tracks have `Start practice` buttons without handlers; payments page `Pay overdue installment` and `Download receipt` buttons have no implemented actions.
- Remediation: Wire authorized workflows, or disable clearly and remove misleading status claims.

### PH03-013 — P2 — SSR fallback masks program/faculty authentication or upstream failure (CONFIRMED)
- Source: `apps/skillup-web/src/lib/skillup-api.ts`, **55–87**.
- If programs or faculty HTTP fetch fails for any reason, SSR helper calls direct data service. Protected learner routes appropriately throw instead.
- Consequence: Service/authorization failures can be masked with data fallback; behavior differs across page categories.
- Remediation: Distinguish unauthorized, unavailable and genuine empty; only use direct DB helpers when explicitly allowed by architecture.

### PH03-014 — P2 — Attendance list record identity uses display dates (CONFIRMED risk)
- Source: `apps/skillup-web/src/app/student/attendance/page.tsx`.
- React list uses `entry.date` as key; duplicate classes on the same date collide. Attendance representation only includes formatted date/status/note, losing unique session/record ID.
- Remediation: Include stable attendance ID and scheduled session timestamp; group multiple sessions clearly.

### PH03-015 — P2 — Synthetic recording links without asset verification (CONFIRMED)
- Source: `apps/skillup-web/src/lib/skillup-data.ts`, **302–308, 340–346, 539–544**.
- A completed session is assigned a URL computed from its ID, regardless of actual recording existence or learner access.
- Consequence: Learners can be shown recordings that do not exist or to which they have no entitlement.
- Remediation: Store verified recording asset IDs/URLs, check publishing/access state, and show `recording unavailable` where applicable.

## Positive controls
- Student API endpoints call `requireStudentAuth` and pass its resolved user ID to data helpers. This does not by itself prove the downstream identity mapping but avoids direct user ID from client query.
- Programs/faculty route handlers perform their own authentication and brand validation.
- The dedicated content-manager source-file writer endpoint returns HTTP 410 and is not available for learner editing.
- SSR learner API helper fails rather than using fake data when protected student API request fails.

## Unverified dependencies / missing tests
1. Gateway `/auth/onboarding` mapping, server-side authenticated persistence and brand-specific DB transaction semantics.
2. Student user-ID mapping (`shadowUserId` vs `originalUserId`) to people, payment and placement databases (Phase 02 carryover).
3. Payment ownership, tenant scoping, schema/version and transaction reconciliation across payment DB and people DB.
4. Placement ranking algorithm inputs, profile ownership and interview-count source of truth.
5. Program/subject/batch classification and published curriculum/availability policies.
6. Attendance semantics for multiple sessions, late arrivals, reschedules and deleted sessions.
7. Cross-tenant and malformed input regression tests and actual CI/build/test results.

## Phase 03 re-audit closure assessment
- **Static findings inventory:** complete for the named data paths and previously inspected UI routes; 15 finding groups are now recorded.
- **Complete end-to-end implementation audit:** incomplete for upstream onboarding, payment, placement and published program dependencies, and for some UI files previously only reviewed selectively.
- **Finding remediation:** not implemented or validated.
- **Automated/integration verification:** not performed.
- **Outcome:** report delivered; Phase 03 acceptance NOT PASSED. Phase 04 remains on hold under the user-established sequencing rule.

## Phase exit criteria
| Criterion | Decision |
|---|---|
| Identify core frontend routes and backend data path | Pass for inspected paths |
| Confirm truthful unenrolled and missing-data behavior | **Fail** |
| Confirm real and consistent payment and placement state | **Fail** |
| Confirm reliable onboarding save/redirect | **Fail** |
| Confirm authorized cross-service identity ownership | **Unverified** |
| Validate entire Phase 03 runtime with tests | **Not performed** |
| Approve Phase 03 as complete and production-ready | **Not approved** |

## Priority remediation order
1. Eliminate fabricated enrollment, program/faculty, placement and curriculum data in production responses.
2. Fix onboarding success/failure transitions and authoritative write path.
3. Reconcile learner/payment identity and payment-due source of truth.
4. Correct attendance aggregation and placement-match counting.
5. Replace static CTAs/visual indicators and cover legitimate empty states with tests.

**Change control:** No source changes, test runs, migrations or deploys were executed. Proceed to Phase 04 only after agreed Phase 03 exit criteria are met or the user explicitly accepts documenting unresolved remediation items separately.
