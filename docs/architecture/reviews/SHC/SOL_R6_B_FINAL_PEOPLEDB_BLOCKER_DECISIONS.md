# PeopleDB final blocker decisions

14 November 2026, Asia/Calcutta. Read-only source and evidence review.

## Outcome

PeopleDB uniqueness migration remains HOLD. The smallest remaining implementation work is the existing reporting association correction, explicit administrative grant authorization and completion of the failed authentication fixtures against current contracts. Real PostgreSQL qualification, migration ordering and backup/recovery rehearsal remain separate gates.

This report proposes the reporting and grant policies for owner approval. It does not turn recommendations into approved business rules.

## 1. Verified provenance

Read-only Git commands reported the following revisions during this review.

| Reference | Full SHA |
|---|---|
| Local `HEAD` | `977fe044c6aa04f3bf63ff58560ae69c941ea0a6` |
| Remote `refs/heads/main` from `git ls-remote origin` | `b8a3ec4a03332c5053dd3c954bc19ba130ffe9aa` |

CHG-03 was committed locally and has not reached remote `main`. The local readiness-report commit `005f2b36101992e042b2720e19ef8d38cb0fe5ff` is also ahead of the remote. A push requires its separate authorization.

The exact complete file list for local commit `977fe044…` is `.evidence/r6-final-people-blockers/CHG03_COMMIT_FILES.txt`, produced by `git show --format= --name-only HEAD`. `PROVENANCE_AND_SOURCE_CHECKS.json` lists every CHG-03 source/test path and its recorded hash. All twenty source/test hashes matched the CHG-03 receipt during this review. The earlier source report contains the path-by-path change rationale. This task made report/evidence additions only.

## 2. Reporting identity decision

The narrowly identified reporting problems are in `apps/skillup-admin/src/lib/skillup-admin-data.ts`, within `getAdminStudentDetail()`.

| Existing query | Problem | Proposed existing relationship |
|---|---|---|
| First student-detail query, around lines 536–555 | Student UUID is selected, but `enquiries` joins through `enquiries.email = users.email`, with arbitrary `LIMIT 1`. An email collision or multiple enquiries can supply unrelated enquiry data. | `users.id → admissions.student_user_id → admissions.enquiry_id → enquiries.id`. |
| Counsellor query, around lines 560–569 | Re-selects an enquiry using only `studentRow.email`, again with `LIMIT 1`. | Reuse the already selected authoritative enquiry UUID, then `enquiries.assigned_counsellor_id → users.id → user_profiles.user_id`. |

The existing `admissions` schema has UUID foreign keys for both `student_user_id` and `enquiry_id`, plus a partial unique index for an undeleted admission per student. This supplies a current relationship for the correction. The physical admission index/records still require database qualification before relying on cardinality in production.

Recommended policy A is to establish the requested person through the authenticated administrative brand scope and PeopleDB UUID, require `users.platform = skillup` for this SUIA report, and select the undeleted admission associated with that person. Join the enquiry using its referenced UUID. If a person has no admission/enquiry relationship, return the existing contract's empty association. If multiple eligible relationships are observed, return an explicit non-disclosing conflict requiring review. Email remains display/contact data. It must not resolve a missing relationship.

Counsellor identity comes from the referenced enquiry's assigned counsellor UUID. Any allowed cross-platform staff association must have its own verified administrative/operational grant. A matching email supplies no such grant. Current SHC permissions do not automatically authorize this SUIA operational report.

The `enquiries` table has no platform field in the current source. The proposed change uses its existing UUID relationship and needs no new schema. Separate cross-brand aggregate reporting requires explicit permission and tenant-filtered input sets. It is outside this specific detail-query repair.

Implementation should change only these identified reporting selections and their association tests. The same source file also contains owner-held business operations. Their implementation remains outside the correction. Test same-email persons on both platforms, unrelated same-email enquiries, missing associations, multiple eligible associations, forged person UUIDs and an explicitly authorized control.

**Owner decision A requires YES/NO.** Approve the existing UUID relationship and ambiguity-denial policy, then authorize the narrow source correction. This read-only task performs no reporting edit.

## 3. Platform-access grant policy

`platform_access` has an existing person-UUID foreign key, platform enum, soft-deletion field and unique `(user_id, platform)` key. CHG-03 preserves the person/external mapping and requires its source identity for direct bridge grant calls.

| Operation | Actual current behavior | Recommended policy B |
|---|---|---|
| Brand signup bridge | Canonical brand account creation is followed by a transactional PeopleDB projection and own-platform grant. Projection failure leaves the established signup success contract and records login reconciliation required. | An authenticated or transactionally established brand account may create its own approved projection/grant through the trusted server flow. |
| Brand login reconciliation | After existing password/account checks, CHG-03 resolves `(platform, external_id)`, validates any expected shadow link and ensures a missing own-platform grant. It refuses a soft-deleted grant. | Permit repair of an interrupted missing own-platform grant only for that verified account. Preserve explicit revocation. |
| Bridge retry | Repeated sync reuses the same verified person, checks active/undeleted state and grant, and conditionally completes the brand shadow link. | Resume only authorized incomplete steps. Conflicts require an honest failure. |
| Standalone PeopleDB login under CHG-02A | Requires an already active own-platform grant. It performs no grant creation. | Retain this ordinary authentication rule. |
| Standalone PeopleDB registration | Creates an account and initial grant through its existing transaction. Its auth router is currently unmounted. | Activation requires the separate registration-role and principal-authority review. |
| Explicit SSO administrative grant/revoke | The mounted `/:userId/platforms` routes require gateway authentication, a JWT and `admin` or `super_admin`. They accept any target person UUID and requested business platform. The repository can restore a deleted grant. | Require current administrative authority, action permission, allowed target platform/person scope, audit and an explicit restore action where revocation exists. Brand-admin status alone must not authorize cross-brand grants. |
| Dedicated SHC Admin | Uses separate fixed `skillhubcore` account eligibility and SHC token authority. | Preserve that authority. Any operational cross-brand grant permission must be independently established. |

### CHG-02A versus CHG-03

There is an intentional distinction between the two paths. CHG-02A authenticates a PeopleDB account and checks its existing grant. CHG-03 reconciles an independently verified brand account and can establish its missing own-platform projection/grant. They are compatible only when the owner expressly recognizes the verified brand account as authority for this narrowly defined repair. A generic PeopleDB password match, arbitrary source UUID or email match does not supply that authority.

Soft-deleted grants are denied by CHG-03 and CHG-02A. A hard-deleted grant loses its revocation marker. CHG-03 currently treats that absence as recoverable missing access. Recommended policy is to preserve revocation with soft deletion and reserve restoration for independently authorized administration. If hard deletion is intended to revoke access, approve a source policy change before accepting automatic missing-grant recovery. Current storage alone cannot prove why a grant is absent.

### Administrative enforcement gap

The current standalone SSO administration path is distinct from CHG-03's strict bridge helper.

`services/skillhubcore-service/src/modules/auth/sso/sso.routes.ts` allows `admin` and `super_admin` on arbitrary target UUID/platform operations. `SsoService` delegates to `DrizzleUserRepository.grantPlatformAccess()`, which can restore `deleted_at` without verifying an actor's allowed target platform. The route deliberately omits `requirePlatform`. A valid gateway secret is another admission requirement, but it does not establish the acting person's cross-brand business permission.

This is a verified source enforcement gap relative to the recommended least-privilege policy. External reachability, actual issued actor grants and live exploitation were untested. The narrow correction must constrain an existing administrative action using the established permission/authority system. If that system lacks the required permission contract, deny cross-brand mutation until the owner defines it. Creating a new authorization service is outside scope.

**Owner decision B requires YES/NO.** Approve own-platform reconciliation authority, soft-deletion revocation semantics and independently permissioned administrative restoration/cross-brand grants. Then authorize the existing SSO boundary correction and its positive/negative tests.

## 4. Classification of all twenty authentication failures

The preserved prior committed-source run reported 360 passed / 20 failed. The CHG-03 run reported 363 passed / 20 failed. Every failing test name and its first observed failure line matches between those runs. `AUTH_FAILURE_CLASSIFICATION.json` supplies one row per case, including baseline/current observations and migration impact. This review rechecked the source and receipts without rerunning or editing tests.

| ID | File and failing case | Observed classification | Relevance and required disposition |
|---|---|---|---|
| 1 | `auth.branches2.test.ts` logout no-op for absent session | Mock database lacks `select`; actual token repository requires it. | Logout qualification. Supply the real adapter contract and assert safe no-session behavior. |
| 2 | `auth.branches3.test.ts` refresh without exam ID | `Invalid refresh token` at signed owner/session parity before exam logic. | Refresh acceptance. Provide a valid signed subject matching persisted session owner. |
| 3 | Same file, active exam absent | Same earlier parity rejection. | Rebuild valid refresh prerequisites, then test absent exam. |
| 4 | Same file, exam duration zero | Same earlier parity rejection. | Rebuild prerequisites, then verify zero-duration handling. |
| 5 | Same file, remaining exam time negative | Same earlier parity rejection. | Rebuild prerequisites, then verify expired exam handling. |
| 6 | Same file, logout with absent user argument | Token adapter lacks `getUserSessions`. | Verify fallback subject resolution and existing last-session rule through complete adapters. |
| 7 | `auth.logout.branch.test.ts` revoke/backdate | Token adapter lacks `getUserSessions`. | Verify current-device revocation and continued other-device access. |
| 8 | `auth.logout.edge.test.ts` revoke/offline | Same missing adapter method. | Same device/last-session acceptance requirement. |
| 9 | `auth.service.tail.lines.test.ts` blocked-user refresh | User adapter lacks current strict eligibility method. | Account-isolation gate. Provide strict current state and assert blocked-account denial. |
| 10 | Same file, missing-user refresh | Same missing strict eligibility capability. | Account-isolation gate. Verify absent-user denial through the current contract. |
| 11 | `auth.service.test.ts` token reuse | Expected historical `Security Alert`; observed `Invalid refresh token`. | Session-reuse test requires valid signed owner/scope before reaching its intended branch. Review its expected response against current contract. |
| 12 | Same file, DB expiry | Expected `Refresh _token expired`; observed `Refresh token has expired`. | Error-contract mismatch. Verify status/code at public boundary and preserve real expiry denial. |
| 13 | Same file, exam grace window | Earlier signed owner/session parity rejection. | Provide valid session/subject, then verify bounded exam grace behavior. |
| 14 | Same file, immediate offline on logout | Token adapter lacks `getUserSessions`. | Old immediate-offline assumption must follow current last-active-session semantics. |
| 15 | `auth.tail.test.ts` exam grace logic | Earlier signed owner/session parity rejection. | Refresh qualification prerequisite gap. |
| 16 | Same file, force offline with user ID | Token adapter lacks `getUserSessions`. | Verify offline transition only when current contract permits. |
| 17 | `auth.tail2.test.ts` custom expiration during exam | Earlier signed owner/session parity rejection. | Rebuild prerequisites before asserting custom expiry. |
| 18 | Same file, custom expiration in grace period | Same earlier parity rejection. | Verify current grace bound after valid authentication. |
| 19 | Same file, custom expiration above standard | Same earlier parity rejection. | Verify upper bound after valid authentication. |
| 20 | `batch-08-internal-auth-boundary.test.ts` invalid internal key plus learner JWT | Positive control expects 200 from an access-only learner token; current boundary returns 401. | Internal-auth/device-binding gate. Use an authorized persisted device pair for the positive control, then assert invalid internal key denial. Preserve access-only replay rejection. |

All twenty are reproduced before CHG-03. No new failing case is identified in that comparison. This does not waive them or prove every production behavior secure. The observed fixture and assertion mismatches prevent their intended security branches from being qualified.

Thirteen failures affect refresh coverage, six affect logout/session coverage and one affects internal-auth/device admission. They do not demonstrate a PeopleDB index-construction failure or cross-brand account merge. Refresh, revocation and account-isolation acceptance are nevertheless relevant to the final same-email account qualification and must receive corrected fixtures and meaningful reruns. Registration and grant creation have no failing case in this set, while their separate policy/runtime gates remain open.

The prior harness used source retrieved at `b8a3ec4a…`. Ten fetched inputs matched frozen local bytes directly or after CRLF normalization. Three differed from the frozen local byte comparison, as previously disclosed in CHG-03. Therefore the baseline result qualifies the cited prior committed-source run. It is not a claim that every former local file byte was reconstructed. The current source hashes still match the final CHG-03 receipt.

## 5. Recommendations for separate approvals

| Proposed authorization | YES/NO recommendation now | Concrete prerequisites |
|---|---|---|
| Remaining source corrections | YES to a bounded assignment after policy A/B decisions | Existing UUID reporting joins; SSO action/target authority; truthful revoked/missing-grant behavior; twenty current-contract test repairs and relevant regressions. |
| Isolated real PostgreSQL tests | YES to a separately identified remote disposable target and exact synthetic scope | Verify current constraints, fixture ownership, cleanup, concurrency, rollback and migration replay. Capture exact source snapshot and protect secrets. |
| Shared PeopleDB uniqueness migration | NO at present | Source decisions/corrections, required auth reruns, independent script review, prior-migration disposition and verified backup/restore must pass first. |
| Post-migration reconciliation of three unlinked brand accounts | YES to a separately bounded verification/repair plan after prerequisites | Reconfirm the three actual accounts, authenticate their brand authority, resolve `(platform, external_id)`, check revocation and conflicting links, preserve UUID independence, verify results and cleanup. Never manually assign an arbitrary person ID. |
| Deployment and browser verification | NO to deployment now; YES to separately approved local HTTP qualification after source/database readiness | Existing SHC/SUIA/RTH local hosts, valid synthetic sessions and completed database gates. Deployment remains an independent release decision. |

### Migration sequence and recovery

The readiness snapshot found exact hashes for applied PeopleDB migrations `0000`–`0008`, with `0009_student_invitations` pending and its physical table absent. This task reused that dated read-only evidence. It made no fresh database measurement. The pending migration requires separate approval or an explicit reviewed deferral strategy before a later migration is executed through the normal timestamp-ordered chain. A filtered high-water entry can strand earlier pending work. Historical journal/ledger edits remain prohibited.

After source compatibility passes, rehearse the existing proposed replacement index and global-constraint removal in an approved remote isolated target. Repeat normalized duplicate checks under the chosen lock, verify index definitions, retain UUID keys/dependencies and record the new migration through the approved ledger mechanism. Keep current SHC credentials, roles and configuration protected.

Before shared execution, obtain a protected backup and prove restoration into an approved isolated destination. Record source/schema/ledger hashes, a consistent identity-write boundary, aggregate counts, restoration receipts and the approved recovery point. Recheck the current database conditions immediately before execution.

For the proposed transactional maintenance path, any pre-commit failure requires rollback and fresh schema/ledger inspection. A lost commit response requires outcome inspection before retry. After legitimate cross-platform duplicate emails or deleted-email reuse, global `UNIQUE(email)` may be impossible to restore. Favor authorized forward repair preserving independent UUIDs and normalized platform uniqueness. Backup restoration after new writes requires an explicit data-loss/replay decision. Account merging or deletion is never an automatic rollback action.

## 6. Preserved scope

Only this report and derived evidence were authored. Source, schemas, database rows, canonical SHC acceptance ledger and original Q-register retained their inspected state. Read-only Git provenance commands were authorized by this task; no Git mutation, push, migration, reset or deployment occurred. Attendance/payments, Marketing, broader UI/performance and MainDB redesign retain their owner gates. Q48 remains OPEN.
