# R6-B Independent Design Review: Final Identity Architecture Simplification

**Reviewer:** Claude Opus 5.5 (independent review of the Gemini Hydrogen R6-B final design)
**Date:** 13 November 2026
**Reviewed documents (read in full before this review):**
- `R6_B_FINAL_IDENTITY_ARCHITECTURE_SIMPLIFICATION.md`
- `R6_B_IDENTITY_DEPENDENCY_AND_CHANGE_MATRIX.csv`
- `R6_B_SAFE_IMPLEMENTATION_APPROVAL_PLAN.md`

**Local source baseline inspected:** working tree whose `.git/refs/heads/main` reads `62f920f4782b8bbb277f88dc27930cd3b86f1b15`. The owner reports GitHub `main` is now `bc5a4b1452c6489e18844ac9548923bc69d258c1` (P0 report-generation fix). I did **not** pull or compare against `bc5a4b14`. The P0 change touched `exam.observer.ts`, which none of the identity findings below depend on, but the identity source paths should be re-confirmed at the new SHA before implementation.

**Mode:** Read-only. No source edits, DDL, migrations, data changes, resets, Git operations or deployments. Database evidence came from `BEGIN READ ONLY` … `ROLLBACK` sessions. The probe printed only aggregate counts: no emails, IDs or connection strings.

**Evidence labels:** VERIFIED = observed directly in source or DB output in this review. LIKELY = strongly supported but not executed end to end. UNPROVEN = plausible, not established.

---

## 1. Overall verdict

**The direction is right, but the design is not ready for implementation as written.**

I agree with the core model:
- Brands own their students.
- Shared student-owned records in MainDB and TutorialDB are keyed by `(verified tenant_id, brand_local_user_id)`.
- PeopleDB keeps its internal UUID (Option A).
- The approved 12 November TutorialDB progress isolation is preserved.

However, I found **one design gap**, **two missing preconditions** and **several specification corrections**. Each one could cause a regression or a security defect if Sol implemented the phases literally.

| # | Finding | Severity | Status |
|---|---|---|---|
| F1 | SUIA and RTH disagree on which identifier is "the learner". SUIA's auth helper returns the **PeopleDB shadow ID**; RTH and the API server use the **brand-local ID**. | **High — design gap** | VERIFIED |
| F2 | Phase 2 (per-platform email uniqueness) would make an existing email-only PeopleDB admin lookup nondeterministic | **High — missing precondition** | VERIFIED (source) |
| F3 | Production data already shows the same-email bridge failure | Corroborates the design | VERIFIED (counts) |
| F4 | MainDB `users` is a same-UUID mirror of brand accounts, not an independent surrogate space | Correction to the inventory | VERIFIED |
| F5 | Phase 4 can backfill `tenant_id` deterministically, so a dummy-data reset is **not required** | Simplification | VERIFIED (current data) |
| F6 | Phase 4's tenant CHECK should not admit `skillhubcore` for student-owned MainDB tables | Spec correction | VERIFIED (business rule + source) |
| F7 | Phase ordering is inconsistent between the plan and the CSV. Phase 3 must precede Phase 4. | Spec correction | VERIFIED |
| F8 | Unit tests run with brand binding **disabled** and therefore query MainDB tables, so they cannot detect this drift | Test-strategy gap | VERIFIED |
| F9 | Some ID spaces overlap: 2 RTH user IDs equal PeopleDB IDs. ID confusion bugs can pass tests by accident. | Test-design requirement | VERIFIED |
| F10 | The 10-table "student-owned" classification has not been checked against non-student writers | Needs verification | UNPROVEN |

---

## 2. Findings in detail

### F1 — Two different "learner IDs" are in use today (VERIFIED, High)

Learner token construction in [login.service.ts](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/login.service.ts#L223-L256) sets `userId = originalUserId = user.id` (brand-local) and `shadowUserId = PeopleDB id`.

| Consumer | Identifier it uses | Evidence |
|---|---|---|
| API server quiz start/result/submit | `payload.userId` → **brand-local** | [quiz/start/route.ts](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/app/api/quiz/start/route.ts#L65-L70), [quiz/result/route.ts](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/app/api/quiz/result/route.ts#L45-L47) |
| RTH assignment/progress auth | `payload.userId` → **brand-local** (and the test asserts it) | [assignment-auth.test.ts](file:///e:/onlinewebsites/quiz-platform/apps/realtutorialhub-web/src/lib/__tests__/assignment-auth.test.ts#L26-L45) |
| SUIA `requireStudentAuth().userId` | **`shadowUserId` first**, falling back to `userId` → **PeopleDB ID** | [student-auth.ts](file:///e:/onlinewebsites/quiz-platform/apps/skillup-web/src/lib/student-auth.ts#L94-L99) |
| SUIA tutorial progress BFF | Bypasses the helper's `userId` and sends `authResult.payload.userId` → **brand-local** | [progress/route.ts](file:///e:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/api/tutorial/progress/route.ts#L52) |
| SUIA my-batch / dashboard / attendance / payments / placement | `auth.userId` → **PeopleDB ID**, matched against PeopleDB `batch_enrollments.student_user_id`, `payment_installments.student_user_id`, `attendance_records.student_user_id` | [my-batch/route.ts](file:///e:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/api/student/my-batch/route.ts#L12), [skillup-data.ts](file:///e:/onlinewebsites/quiz-platform/apps/skillup-web/src/lib/skillup-data.ts#L96) |

**Why this matters for the design:**
- Hydrogen's contract says `(tenant_id, brand_local_user_id)` is the identity "for **all** student-owned shared educational resources". But SUIA's PeopleDB operational records (batches, enrollments, attendance, payments, placement) are legitimately keyed on the **PeopleDB person ID**, and their FKs reference `PeopleDB.users.id`. The contract as written would either be violated silently or force an unscoped PeopleDB rewrite.
- One SUIA helper field, `userId`, means "PeopleDB ID" in some routes, while sibling routes deliberately use a different value. That is exactly the kind of ambiguity that produces a future cross-identity bug.
- The SUIA test fixture encodes the inverted belief: `{ userId: 'global-1', shadowUserId: 'skillup-1' }` labels the shadow ID as the SkillUp-local ID ([student-auth.test.ts](file:///e:/onlinewebsites/quiz-platform/apps/skillup-web/src/lib/student-auth.test.ts#L12-L36)). The real login service produces the opposite. The test passes while asserting the wrong semantics.
- Attendance and payments are on owner HOLD. The fix below changes naming at the auth-helper boundary only and does not touch those features' logic.

**Required amendment to Phase 1 (source-only, small):** The contract must name **two** identifiers explicitly instead of one:
1. **Learner subject** = `(tenant_id, brand_local_user_id)`. Used for MainDB and TutorialDB student-owned records.
2. **PeopleDB person ID** = `shadowUserId`. Used **only** for PeopleDB-owned records and SSO/session families.

The SUIA helper should return both under unambiguous names (for example `learnerUserId` and `peoplePersonId`) instead of one overloaded `userId`. Correct the mislabeled SUIA test fixture at the same time. Hydrogen's change matrix currently has no row for this.

### F2 — Phase 2 has a missing precondition: an email-only admin lookup (VERIFIED in source, High)

`services/skillhubcore-service` `DrizzleUserRepository.findByEmail()` filters only on `email` and `deletedAt`, with `.limit(1)` ([user.repository.ts](file:///e:/onlinewebsites/quiz-platform/services/skillhubcore-service/src/modules/user/user.repository.ts#L42-L53)). `AuthService.loginAdmin()` uses it ([auth.service.ts](file:///e:/onlinewebsites/quiz-platform/services/skillhubcore-service/src/modules/auth/auth.service.ts#L163-L186)), and it is exposed by `auth.routes.ts:109`.

- **Today:** the global `users_email_unique` constraint makes this lookup deterministic.
- **After Phase 2:** the same email can exist once per platform. `findByEmail` then returns an **arbitrary** row. `loginAdmin` accepts `role` `admin`/`super_admin` from **any** platform, so the outcome depends on row order: an admin could be locked out, or an RTH-platform admin row could be selected for SHC token issuance.
- By contrast, the API server's `SHCAuthService` already scopes its lookup with `eq(users.platform, 'skillhubcore')` ([shc-auth.service.ts](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/shc-auth.service.ts#L49-L59)).
- Deployment status of `services/skillhubcore-service` is **UNPROVEN**. It is still an existing source consumer and must be handled.

**Required precondition for Phase 2:** platform-scope every email-based PeopleDB lookup **before** the global unique constraint is replaced, and inventory any others with a repository-wide check. Also require write-path email normalization. The target index uses `LOWER(TRIM(email))`, but the lookups compare raw `email`.

### F3 — The same-email bridge failure already shows in the data (VERIFIED, aggregate counts)

The read-only cross-DB probe found:
- **2** normalized emails exist in both SkillUpDB and RthDB.
- For **both** pairs, exactly one brand side has **no** `shadow_user_id`: one SUIA account and one RTH account are unbridged. These accounts are a large share of the system's unbridged accounts (SkillUp: 1 of 46 unbridged; RTH: 2 of 103).
- Everywhere a shadow ID exists, the bridge is internally consistent: 45/45 SkillUp and 101/101 RTH shadow IDs resolve to a PeopleDB row with the matching platform and `external_id = brand user id`. There are 0 dangling references.
- PeopleDB has **0** active `(normalized email, platform)` duplicates, so the Phase 2 constraint can be created without data cleanup.

This matches Hydrogen's analysis: live global `users_email_unique` makes the second brand's `syncUser` insert fail. Because `LoginService.ensureShadowUserId()` rethrows outside test environments, those two accounts would **fail to log in** in a production configuration (LIKELY: inferred from source, not executed). Once Phase 2 lands, their next login should repair them, because `ensureShadowUserId` runs when `shadowUserId` is null. Phase 6 should verify this explicitly.

### F4 — MainDB `users` is a mirror, not a surrogate space (VERIFIED)

- 13 of the 19 MainDB `users` rows share their UUID **and** email with brand accounts (7 SkillUp, 6 RTH).
- All 9 MainDB exams resolve to a MainDB user. Their owners are brand IDs: 3 SkillUp, 6 RTH.

So exams work in development today only because brand accounts were mirrored into MainDB under the same UUID. The process that created the mirrors is **UNPROVEN** (seed scripts, earlier fixtures or a historical unbound path). No production login/signup path currently writes MainDB `users` for learners. The only MainDB `users` insert found is the admin user engine ([drizzle-admin-user.repository.ts](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/repositories/implementations/drizzle-admin-user.repository.ts#L146-L152)). Its `.returning()` / `findFirst` over the 18-column Drizzle schema is LIKELY to hit `42703` on live MainDB.

**Consequence:** a newly registered learner has no MainDB `users` row, so `POST /api/quiz/start` should fail the `exams_user_id_users_id_fk` FK (LIKELY; not executed). This strengthens the case for Phase 4. It may also be relevant to Sol's separate SUIA cold-start quiz-result HTTP 500 investigation, but I have **not** established that link. Sol owns that diagnosis.

Hydrogen's inventory describes MainDB `users` IDs as a "MainDB surrogate/legacy UUID". That should be corrected to "same-UUID mirror of brand-local IDs, plus a small number of MainDB-only rows".

### F5 — A dummy-data reset is not needed for Phase 4 (VERIFIED for current data)

- No ID is shared between SkillUpDB and RthDB (0 overlap).
- Every exam owner is found in exactly one brand DB.

So `tenant_id` can be backfilled deterministically: tenant = whichever brand DB contains `exams.user_id`. The reset in Phase 4A is optional convenience, not a technical requirement. Since the owner prefers minimal risk, I recommend **answering NO to 4A** unless the owner wants a clean slate for other reasons. If a reset is chosen, Hydrogen's preserve-list stands. Add one item to it: the shared-email accounts used by Phase 6 tests should be recreated synthetically rather than relied on.

### F6 — Tenant CHECK for MainDB student tables (VERIFIED)

Hydrogen proposes `CHECK (tenant_id IN ('skillup','realtutorialhub','skillhubcore'))` for the 10 MainDB student tables. Owner business rule 6 says SHC provides shared resources, **not** student identity. For **student-owned** MainDB rows, the CHECK should be `('skillup','realtutorialhub')`. The tenant value must come from the **verified token `brand`**, never from headers or body, using the existing conflict helpers (`hasConflictingRequestTenantContext` / `request-brand.ts`).

TutorialDB's existing CHECK, which includes `skillhubcore`, is the approved 12 November implementation. **Leave it unchanged.** Narrowing it is not in scope.

### F7 — Phase ordering (VERIFIED)

- The approval plan lists Phase 4's prerequisites as "Phases 1–2".
- The CSV says "After Phase 1-3".

Phase 3 must come first. The generic login path can still issue a learner-audience token with `brand: 'skillhubcore'` (see `login-01-purpose.test.ts`, "public login route on generic skillhubcore preserves admin role and cookies"). Without the Phase 3 fence, such a token could reach `quiz/start` and create a `skillhubcore`-tenant exam.

**Corrected order:** 1 → 2 (with the F2 precondition) → 3 → 4 → 5 → 6.

### F8 — Unit tests cannot detect this drift (VERIFIED)

`shouldUseBrandBinding()` returns `false` whenever `NODE_ENV === 'test'`, `VITEST === 'true'` or `VITEST_WORKER_ID` is set ([brand-db.ts](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/brand-db.ts#L109-L111)). In that mode repositories fall back to the default MainDB tables, and `ensureShadowUserId` returns `user.id` on bridge errors. So the existing unit suites:
- never exercise brand-DB binding;
- run against the 18-column MainDB Drizzle schema, which hides the live 9-column table;
- cannot surface the `23505` bridge failure.

Passing unit tests are therefore **not** evidence for Phases 2–5. Each of those phases needs at least one isolated, run-owned integration check against real schemas (subject to separate owner approval for any DB-backed run), plus an `information_schema` parity check.

### F9 — ID spaces overlap (VERIFIED)

2 RTH user IDs are identical to PeopleDB user IDs, and 6 of the 9 exams are owned by such IDs. For those accounts, a component that confuses `userId` with `shadowUserId` behaves correctly by accident. Phase 6 fixtures must use accounts where `userId ≠ shadowUserId`. The RTH test already does this (`rth-db-user-1` vs `people-shadow-99`); SUIA's does not.

### F10 — The student-owned table classification needs verification (UNPROVEN)

Hydrogen classifies 10 MainDB tables as student-owned and proposes dropping their FK to MainDB `users`. I have not verified that `notifications`, `background_jobs`, `reports` and `report_jobs` are written **only** for learners. Admin or export jobs may also use them. Before Phase 4, inventory every writer per table:
- Any table with non-student writers needs a nullable/actor-typed design, not a blanket learner tenant key.
- The current `idempotency_keys` unique constraint name and columns were not confirmed live (tests reference `unq_user_key`).
- Dropping the FKs removes `ON DELETE CASCADE`, so account deletion and retention must be handled explicitly (for example, an existing retention service path).

---

## 3. Confirmed parts of Hydrogen's design

- **Option A** (keep `PeopleDB.users.id` internally) is correct. SHC admin tokens set `originalUserId = shadowUserId = user.id` ([auth.service.ts](file:///e:/onlinewebsites/quiz-platform/services/skillhubcore-service/src/modules/auth/auth.service.ts#L196-L199)), and 15 PeopleDB FKs depend on it. Option B adds churn without improving isolation.
- **TutorialDB** is correctly preserved: `tenant_id`, its CHECK, `uq_tutorial_progress_tenant_user_subtopic` and the repository tenant requirement. Live `tutorial_progress` has 0 rows. `event_outbox` is absent live (migration `0030` not executed), as Hydrogen reported.
- The **identity bridge** is sound wherever it has run (F3), and it never links accounts by email. It looks up by `(externalId, platform)`.
- The **retry claim** is correct: `signup.service.ts` logs `retryQueued: true`, but there is no durable retry queue. Login is the only reconciliation path.
- The **migration `0014` drift** stands: ledger row `id=33` exists with a matching hash, yet none of its 7 indexes exist live.
- **Phase 3 rationale** stands: PeopleDB lacks the `BrandAuthTables` tables, so `brand-db.ts` cannot simply be repointed.

---

## 4. Revised phase recommendations for the owner

| Phase | Hydrogen proposal | Review recommendation |
|---|---|---|
| **1** — Identity contract | Lock `(tenant_id, brand_local_user_id)` | **YES, with amendment F1.** Name two identifiers (learner subject vs. PeopleDB person ID). Add a source-only change: unambiguous SUIA auth-helper fields and a corrected SUIA test fixture. |
| **2** — PeopleDB uniqueness + bridge | Replace global unique with `(LOWER(TRIM(email)), platform)` | **YES, only after precondition F2.** Platform-scope `skillhubcore-service` `findByEmail`/`loginAdmin` and every other email-only PeopleDB lookup, and normalize email on write. Data precondition already met (0 duplicates). |
| **3** — Fence `skillhubcore` in `brand-db.ts` | Fence or reject | **YES.** Must run **before** Phase 4 (F7). |
| **4A** — Dummy reset | Optional | **NO, recommended.** Not required; deterministic backfill is possible (F5). |
| **4B** — MainDB `(tenant_id, user_id)` | Add tenant to 10 tables, drop their FKs | **YES in direction; revise the spec first.** Two-tenant CHECK (F6); tenant from the verified token only; per-table writer inventory (F10); explicit deletion/retention handling; deterministic backfill. |
| **5** — MainDB schema + `0014`/`0023` | Reconcile | **YES, after 4.** Include the admin user engine `42703` risk (F4) and a non-mocked schema parity check (F8). |
| **6** — E2E verification | Full suite | **YES.** Add: the 2 real shared-email cases recreated synthetically, `userId ≠ shadowUserId` fixtures (F9), self-repair of unbridged accounts after Phase 2 (F3), and a negative case for a `skillhubcore` learner token reaching `quiz/start`. |

---

## 5. Not covered by this review

- No execution of any application test. All verification was source reading plus read-only catalog/aggregate queries.
- No comparison against GitHub `bc5a4b14`.
- No deployment or runtime-image verification.
- The SUIA cold-start quiz-result HTTP 500 belongs to Sol's separate track. F4 is a possible lead only.
- No change to the 62-row SHC acceptance ledger, the Q01–Q48 register or the R6 authorization matrix.

## 6. Handoff (if another model continues)

1. Hydrogen revises the three R6-B deliverables to include F1, F2, F6, F7 and F10. That means two new matrix rows (the SUIA identity-helper split and the platform-scoped PeopleDB email lookups) and corrected Phase 4 dependencies.
2. Re-confirm the cited source paths at GitHub `bc5a4b14`.
3. The owner answers per-phase YES/NO. Sol implements only approved phases, in the order 1 → 2 → 3 → 4 → 5 → 6.

The read-only probe used for F3–F5 and F9 is kept outside the repository at `<artifact dir>/scratch/identity-intersection-probe.cjs`. It prints aggregate counts only.

