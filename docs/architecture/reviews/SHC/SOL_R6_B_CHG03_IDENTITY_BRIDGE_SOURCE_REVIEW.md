# CHG-03 existing identity bridge and migration compatibility

14 November 2026, Asia/Calcutta. Source and controlled-test delivery.

## Result and acceptance limits

The existing bridge now reconciles person projections and own-platform access in one PeopleDB transaction, reuses the canonical `(platform, external_id)` identity after concurrent insertion, normalizes projected email and preserves revoked grants. Signup reports deferred login reconciliation truthfully. Login and generic brand-admin login revalidate existing links and bind only the verified person UUID. Seed conflict SQL matches the approved future normalized partial index and preserves existing credentials.

Affected typechecks and zero-warning lint passed. Fifteen bridge tests, five seed tests, three signup/login recovery tests, two email-boundary tests, 38 CHG-01B tests and 38 CHG-02A tests passed through controlled adapters. The broader API auth suite reports 363 passing and 20 failing tests. Its prior committed-source comparison reports 360 passing and the same 20 failing cases. Full auth acceptance and PeopleDB migration remain pending.

Physical PostgreSQL concurrency, schema migration, seed execution and browser qualification were outside this source/test assignment. Migration readiness remains HOLD for the remaining requirements below.

## Scope and provenance

Local filesystem provenance was `main` at `005f2b36101992e042b2720e19ef8d38cb0fe5ff`. This is the readiness-report commit following CHG-02A `b8a3ec4a03332c5053dd3c954bc19ba130ffe9aa`. `.evidence/r6-chg03/BASELINE.json` captures source hashes before edits. The final manifest records changed paths and protected files.

The latest owner instruction authorizes existing-source corrections for CHG-03, seed compatibility and directly necessary email consumers. Governance references remain SHC 00, proposed PSEG-001 v1.1 and annexes 02–04. The readiness review, CHG-02A review, revised identity change matrix and Claude F1–F10 findings informed this correction. Current owner decisions supersede historical shadow-ID fallback suggestions. Canonical acceptance status changes remain owner-controlled.

All database operations described below are application behavior exercised through controlled adapters. This task made no real database connection or data mutation. Test processes removed database/provider configuration where runners could import existing packages, and the seed module test mocked dotenv, hashing and its database adapter.

## Original defects and corrected behavior

| Original behavior | Existing-source correction |
|---|---|
| Separate person and access inserts could partially commit. | `syncUser()` uses one existing PeopleDB transaction. Access failure rolls back person/email work. |
| Select-then-insert could escape a unique violation on concurrent projection creation. | Insert with `ON CONFLICT DO NOTHING`, then resolve only `(external_id, platform)` through a new READ COMMITTED statement and lock that person row. |
| Existing-person sync returned without ensuring access. | Every successful sync verifies an active own-platform grant within its transaction. |
| Grant helper treated a soft-deleted grant as already granted. | Grant insertion uses the existing unique key. The result is locked and checked. A soft-deleted grant produces `ACCESS_REVOKED`. |
| Brand shadow link update could overwrite another non-null identity. | Revalidate the PeopleDB platform/external mapping, then conditionally update an undeleted brand row whose link is absent or already equal. Exactly one returned row is required. |
| Login accepted any nonempty persisted shadow ID without revalidation. | Learner and generic brand-admin login reconcile the canonical identity with the existing link supplied as an expected value. A mismatch rolls back and prevents credential issuance. |
| Test-mode bridge failure substituted the learner UUID. | Remove the fallback. Existing auth tests provide explicit controlled bridge fixtures. |
| Signup claimed a durable retry was queued. | Preserve signup's optional projection side effect, record a safe code and `LOGIN_RECONCILIATION_REQUIRED`, and remove the unconsumed retry-request event. |
| Seed used global `ON CONFLICT(email)` and rewrote credentials/platform state. | Parameterized normalized expression/platform conflict target with undeleted predicate, `DO NOTHING`, followed by exact active-platform lookup if needed. Existing credentials and account state are retained. |
| Brand-admin email input/precheck used inconsistent normalization. | Existing create/update schemas trim and lowercase email. The create precheck compares normalized stored email under fixed `skillup` context. |

The bridge preserves PeopleDB credentials and role on an existing mapping. A new projection uses the existing role contract. Same-platform email collision with another external identity fails closed and never resolves by email. The legacy global email constraint may still prevent the second brand projection until a separately approved migration occurs.

The access insert takes the existing `(user_id, platform)` conflict key. Both direct grant and sync paths validate active, undeleted person state and exact source identity before establishing access. Direct grant now requires the originating external account context. The inspected production callers are signup, learner login and generic brand-admin login. They use the bridge after their existing account-authority checks. No browser-supplied person ID becomes grant authority.

### Grant policy applied

The implementation treats a verified canonical brand account as authority to establish a missing own-platform grant, including recovery from prior partial projection creation. This follows the authorized existing signup/login bridge purpose. A soft-deleted grant remains a revocation and is denied. Cross-platform grants are outside this path.

A hard-deleted grant leaves no revocation marker in current storage. This implementation cannot distinguish that state from an interrupted initial grant. The owner should retain soft-deletion as the revocation representation for this flow, or separately decide the hard-delete policy before live qualification. This is an operating-policy exception requiring explicit review.

### Transaction and recovery boundaries

`syncUser()` requests READ COMMITTED so the post-conflict statement can observe a committed competing insert. Existing-key conflicts are re-resolved and locked. The person and grant use a consistent person-before-grant order. Database indexes remain the final uniqueness authority.

PeopleDB commit and the later brand-side shadow update remain separate commits. If linking fails, the valid person/grant may persist. A later authenticated login re-resolves the same platform/external identity and conditionally completes the link. A conflicting existing link is denied. Success audit records now follow bridge/link completion.

Controlled concurrent calls use a transactional adapter with serialized commits, unique-key simulation and rollback. This proves invocation/idempotency behavior at the adapter boundary. Physical PostgreSQL lock scheduling, deadlocks, unique-conflict timing and cross-database interruption require approved remote integration tests. No distributed atomicity or durable background recovery is claimed.

## Exact production changes

| Path | Change |
|---|---|
| `packages/identity-bridge/src/UserIdentityBridgeService.ts` | Transactional projection/access reconciliation, conflict resolution, safe errors, grant checks and conditional brand linking. |
| `packages/identity-bridge/src/types.ts` | Optional expected persisted shadow identity on the existing sync input. |
| `packages/identity-bridge/src/index.ts` | Export existing bridge error type for typed classification. |
| `apps/api-server/src/modules/auth/signup.service.ts` | Use atomic bridge grant behavior and verified conditional link. Replace misleading retry semantics with sanitized deferred recovery state. |
| `apps/api-server/src/modules/auth/login.service.ts` | Revalidate mappings on login, pass expected link, remove test-only identity substitution and delay success audit until reconciliation succeeds. |
| `apps/api-server/src/modules/auth/admin-auth.service.ts` | Apply the same existing bridge contract to generic brand administrators. Dedicated `SHCAuthService` retains its own code and authority. |
| `packages/db-people/src/seed-skillup.ts` | Export the existing account upsert for isolated testing. Use exact target-index conflict SQL and retain existing active account credentials. |
| `apps/skillup-admin/src/app/api/admin/students/route.ts` | Normalize existing email input and same-platform duplicate comparison. |
| `apps/skillup-admin/src/app/api/admin/students/[id]/route.ts` | Normalize validated email update input. |

The seed account operation now requires the target normalized partial unique index. Invoking it before that migration fails safely. After a concurrent insert, a separate SELECT observes the winning active account under the intended statement snapshot. It denies absent/ambiguous/inactive results. The full seed still contains separately held operations and remains unexecuted. Its original explicit account-creation behavior persists for new fixtures, while credential replacement requires a separate owner decision.

## Tests and quality receipts

`.evidence/r6-chg03/QUALITY_RESULTS.json` records commands, timestamps and completed exit codes.

| Selection | Final result |
|---|---|
| `pnpm --filter @quiz/identity-bridge test` | 15 passed, exit 0 |
| PeopleDB `seed-user-conflict.test.ts` | 5 passed, exit 0 |
| API `chg03-recovery.test.ts` within full auth run | 3 passed |
| Controlled brand-admin `email-boundary.test.ts` | 2 passed, exit 0 |
| CHG-02A auth/token/SSO/repository/middleware selection | 38 passed, exit 0 |
| CHG-01B helper/caller/signed-token selection | 38 passed, exit 0 |
| Identity-bridge package typecheck | Exit 0 |
| PeopleDB package typecheck | Exit 0 |
| API TypeScript check | Exit 0 |
| Brand-admin TypeScript check, including new test | Exit 0 |
| Changed bridge, seed, API and brand-admin source lint with zero-warning limit | Exit 0 |
| New email-boundary test lint | Exit 0 |
| Broader API auth suite | 363 passed / 20 failed, exit 1 |
| Graphify AST update | See completed final receipt |

The initial bridge adapter incorrectly omitted rejection forwarding on its thenable. Correcting the adapter produced the passing outage/rollback test. The initial seed parameterized fixture spread an empty array as a case argument. It now uses explicit `{rows}` cases. TypeScript and lint findings introduced during development were corrected. Initial receipts remain preserved separately.

The original four bridge tests were replaced with fifteen tests retaining their create/reuse/mismatched-brand/lookup purposes and adding rollback, revoked grants, concurrency, conflicting links and cross-brand identity checks. Seven auth consumer suites gained explicit controlled bridge fixtures. The existing tenant-isolation fixture now asserts revalidation of the persisted link, replacing its obsolete fast-path expectation. Existing role, cookie, tenant and resource assertions remain in place.

The new email-boundary tests invoke actual route validation with controlled dependencies. The update test intentionally stops at the initial email update boundary, before operational dependencies. It supplies evidence for normalization only. It does not qualify the full student-management workflow or held business operations.

### Wider auth failures

`AUTH_FAILURE_COMPARISON.json` records the same twenty failing test names in the current suite and the earlier committed source. Nineteen concern refresh/logout expectations. One internal-auth fixture expects an access-only learner token to be accepted despite the existing binding requirement. This task retains the existing security controls and records these failures for their owning workstream.

The baseline harness loads thirteen prior files fetched read-only from GitHub at `b8a3ec4a03332c5053dd3c954bc19ba130ffe9aa` through a Vite pre-load adapter, with no checkout or source replacement. The new recovery test is excluded from that older suite. Remote input hashes and command receipts are retained. Ten fetched inputs match frozen local bytes directly or with checkout CRLF normalization. Three did not match that byte comparison, so the receipt establishes the cited prior committed-source run rather than an exact reconstruction of every original local byte. The prior suite result is 360 passed / 20 failed across 79 files. The current suite is 363 passed / 20 failed across 80 files. The failure-name sets are equal.

Production builds and deployment were outside this task's targeted verification. The broader auth and existing shared-types lint failures prevent full quality acceptance. Shared types retain the previously documented two errors and nine warnings.

## Remaining source and migration decisions

| Remaining requirement | Disposition |
|---|---|
| Email-only enquiry/reporting association in `skillup-admin-data.ts` | OWNER DECISION REQUIRED. The existing enquiry schema has no platform column. Select the authoritative existing UUID relationship or approve explicit ambiguity rejection. This mixed module also contains held business functions. Its logic was preserved. |
| Safe constraint-conflict response and full concurrent student-create/update workflow | PENDING. Input normalization is corrected. Full brand-admin transactional and invitation qualification needs explicit scope and the pending physical schema prerequisite. |
| Soft-deleted grant restoration | Denied by this correction. Restoration requires verified explicit entitlement authority. |
| Hard-delete grant semantics | OWNER DECISION REQUIRED as described above. |
| Three current accounts without shadow links | Data untouched. Future authenticated reconciliation must use verified brand-local mapping and may remain blocked by current global email uniqueness. |
| Legacy PeopleDB-only accounts and missing grants | Classification and any data repair remain separately gated. |
| PeopleDB `0009_student_invitations` | Unapplied earlier journal/table prerequisite remains an owner sequencing decision. |
| Target unique-index DDL and migration ledger | HOLD for reviewed migration order, backup/restore rehearsal and separate approval. |
| Physical concurrency, rollback and restore tests | Separate isolated remote verification authorization required. |
| Standalone auth activation and requested registration roles | Separate policy review remains required. |
| MainDB ownership migration | Separate later phase. |

Source prerequisites have advanced, while the remaining reporting policy, grant lifecycle, full consumer qualification and physical migration gates keep live migration readiness partial.

## Preserved boundaries

The final manifest compares R6-A/P0 protected paths, CHG-01B/02A source and the acceptance ledgers. Dedicated SHC authentication, academic hierarchy, MainDB/TutorialDB schemas and held attendance/payment implementations retain their recorded source hashes. No seed, migration, real database write, Git CLI operation, commit, push, Docker build or deployment was performed during CHG-03. Marketing and broader faculty/UI/performance work retain their HOLD.

The deliverable is ready for source review with the failed wider gates and pending policy/runtime qualifications recorded. Q48 remains OPEN.
