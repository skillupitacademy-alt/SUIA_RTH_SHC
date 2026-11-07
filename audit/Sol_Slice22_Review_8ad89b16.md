# Sol Slice 22 review and migration execution disposition

Date: 2026-11-07. Reviewed local clean HEAD `8ad89b1631e45bead9416234dfaaa01a3e76c29a` on `remediation/w1-2-batch-05-targeted`; source `bd4e0574da35040330a45d4631e08d1a74ed8037`, parent Sol checkpoint `05f407488600c09593062f27402bb63ebcfbe8eb`.

**Decision: PARTIAL_ACCEPTANCE. Physical harness/report corrections: CHANGES_REQUESTED. Migration execution: NOT APPROVED at this checkpoint. W1-W3 closure and W4 implementation: NOT APPROVED.** Preserve Slice 19/20 accepted boundaries. No broad production rewrite is requested.

## Independently observed evidence

No live service, database, queue, browser or storage operation was performed in this review. Local environment-file synchronization is reported by Gemini, not independently attested here; ignored local configuration is outside the tracked-source diff and must be attributed separately from zero production application source edits. Do not expose bindings or infer deployed service configuration from local files.

| Offline check | Actual result |
| --- | --- |
| `node audit/Sol_Slice20_Repository_Review.mjs` | 1 file, 40 passed, exit 0 |
| `node audit/Sol_SQL_Authority_Review_7f66e7eb.mjs` | 1 file, 8 passed, exit 0 |
| `node audit/Gemini_SQL_Authority_Invariant_Review.mjs` | 1 file, 6 passed, exit 0 |
| `node audit/Sol_Lease_Adapter_Review_27243c6e.mjs` | 1 file, 7 passed, exit 0 |
| SHC hierarchy-contract and foundation-validation, guarded isolated Vitest | 2 files, 45 passed, exit 0 |

The taxonomy invocation used `startVitest('test', [the two files], {config:false, watch:false, maxWorkers:1, fileParallelism:false, environment:'node', reporters:['dot'], setupFiles:[absolute audit/W1_W3_Offline_Test_Network_Guard.ts], exclude:['**/node_modules/**','**/.worktrees/**']}, {resolve:{alias:{'@':absolute apps/skillhubcore-admin/src}}})` through `node --input-type=module`. Two initial review invocations misplaced/omitted the Vite alias and failed collection of the route file (31 schema tests passed); the corrected Vite override passed all 45. These were runner configuration failures, not demonstrated source defects.

Total independently rerun here: 106 test executions. Gemini's 319 = 40+8+6+7+45+114+99 is arithmetically correct, but broader results remain attributed to Gemini, not rerun here. Counts do not certify all foundations or distinct caller coverage. No fresh package/workspace typecheck is claimed by Sol this turn.

Both migration SHA-256 values match local bytes:

- People `0009_student_invitations.sql`: `dc8452f27c575868d4957172697b6c032a11b35b545bdf60ad144288f608d4f0`.
- Tutorial `0030_event_outbox.sql`: `987cee980101b7515b846d56c99f5e244f84a634d6316b6c1196ed8b9fbe5d29`.

Accept bounded source progress: shared hierarchy schemas and their observed tests; corrected people enum reference; unique outbox filename and journal registration. This does not accept exhaustive CRUD authorization/persistence or physical deployment. Alias validation returns 400 in inspected routes, not the report's 409 claim. Report also claims `packages/db-tutorial/migrations/meta/0030_snapshot.json` exists; it does not exist in this checkout. Correct the evidence; assess snapshot requirements for future schema generation separately from SQL execution.

## R1: Redis provider probes do not qualify queue delivery or production adapters

`tests/uat/physical-redis-qualification.mjs` executes standalone SDK commands and locally written Lua, not the actual event consumer/worker adapters. Its mutual-exclusion attempts are sequential. Its crash scenario waits for a synthetic key TTL, without a worker, domain effect, SQL outbox or provider retry. A Redis completed value is not queue acknowledgment.

Step 10 constructs `Receiver` and checks `typeof receiver.verify === 'function'`; it never invokes verification. No signed/invalid webhook, QStash publication, delivery, HTTP acknowledgment, retry or redelivery occurs. TLS handshake is not authenticated Redis protocol qualification. Cleanup swallows every DEL error and unconditionally sets `cleanupConfirmed=true` without a readback.

Keep reported live REST/Lua/TTL observations as provider-level evidence only. **Production adapter integration, queue lifecycle, signature verification and cleanup qualification remain OPEN.** Gemini must use the actual supported adapters, independent clients/barriers, replacement-at-completion/release controls, real signed positive/negative delivery and bounded crash/retry/outbox scenarios under separately authorized UAT bindings. Verify cleanup or report its failure. Do not call ENOTFOUND proof of deprovisioning; the later reported active endpoint does not establish the earlier provider cause.

## R2: R2 mechanics do not establish export tenant authorization

`physical-r2-qualification.mjs` sends `Bearer invalid.test.token` plus an untrusted tenant header to an artifact-free download request. A 401 tests invalid authentication, not a legitimate foreign tenant's denial on an owned artifact. There is no valid owner success, valid foreign principal, row/key provenance comparison or proof of zero private effects. `UAT_API_SERVER_URL` still falls back to localhost. Raw HTTP 400 can represent a malformed provider request rather than an access-control decision.

Retain reported upload/read/presigned expiry/deletion mechanics at their narrow scope; they were not rerun here. Require explicit API target, a legitimate owner download of a known synthetic artifact, legitimate foreign tenant and different-owner denials, signed URL/storage provenance, zero-effects evidence and cleanup. **Application export authorization physical gate remains OPEN.** Do not relabel invalid-token denial as foreign-tenant qualification.

## R3: browser harness still admits false positives

`physical-browser-qualification.mjs` accepts generic `main`/`nav` rather than a known authenticated subject or successful protected API. Cross-host navigation does not demonstrate explicit replay of a verified foreign token because host-scoped cookies may never be sent. Admin domains navigation does not require a successful protected response or final authorized URL; generic `h1`/`nav` may be an error/login page.

User B has invented fallback credentials, and B's subject is never positively asserted. Logout reads storage but never asserts its contents; searching cookie values for a plaintext email does not prove a JWT/session was cleared. The SW test uses `browser.newContext()`, not a persistent profile, visits only login, never requires an installed/controlling worker, and passes if Cache API is absent. No installed worker lifecycle, seeded private cache, A/B data or upgrade eviction is demonstrated. Comments still misuse canonical G2/G6; browser/cache qualification belongs under the original mappings.

Missing authorized URLs correctly blocks live execution. Keep **BROWSER-01 and applicable RC-ID-01 browser evidence OPEN**. Gemini must repair assertions and execute known-subject positives/negatives across all three apps, actual UI logout and refresh/session lifecycle, forced foreign-token server rejection, and installed-worker/cache transitions. A dry-run merely prints declared specifications; it neither exercises these flows nor validates SQL syntax.

## R4: SQL harness is not ready for post-migration qualification

`physical-sql-qualification.mjs` now names the correct two tables, but `createSyntheticUser()` inserts `users.name` (absent from the actual people schema) and omits required `password_hash`. Against the declared schema it cannot create its fixture. Use explicit synthetic inactive accounts with the actual schema/tenant and approved cleanup; no account provisioning beyond the authorized test boundary.

Scenario 2 is a single expired-row redemption denial, not expiration racing with redemption. There is no expiration UPDATE, nor terminal-state-versus-expiry race or Q1 zero-row reread proof. Scenario 3 tests a wrong owner only, not an expired owner. Scenario 5 replaces then completes sequentially. Promise.all for claims/envelopes does not establish a controlled lock interleaving, and final stored winner values are not read back. Handwritten completion SQL omits envelope equality and does not execute the repository. Rollback checks one standalone outbox insert, not certificate/badge plus intent or account activation plus redemption in one transaction. Error cleanup must first roll back any failed transaction; the rollback-case ID is not registered for cleanup if rollback unexpectedly fails.

Gemini must repair fixtures, invoke actual repositories/real composed transactions, add explicit barriers with independent connections, record both orders of expiry/redemption and terminal preservation, verify final rows, envelope/owner predicates, domain+intent rollback and cleanup. **All blocked physical PostgreSQL scenarios remain NOT_EXECUTED.** Do not migrate merely to run an already defective test script.

## R5: migration preparation advanced; execution prerequisites incomplete

The exact additive DDL hashes and registration changes are reviewable. The packet describes creating a recovery branch/PITR point but supplies no completed branch/snapshot ID, recovery timestamp, confirmed retention or restore verification. Record these before any apply. Confirm the environment owner explicitly approves each redacted target fingerprint and whether disposable clones can be used.

The packet preflight labels use `PEOPLE_DATABASE_URL`/`TUTORIAL_DATABASE_URL`, whereas actual package configs prefer `DATABASE_DIRECT_URL_PEOPLE` then `DATABASE_URL_PEOPLE`, and corresponding tutorial variables, while discovering local/root env files. Therefore package `db:migrate` is not proven equivalent to the recorded preflight target. No blanket migrator authorization is given. Bind the exact executor to the confirmed targets and prove the final SQL/ledger plan; validate fresh ledger state and all selected hashes immediately before execution, with bounded lock/statement timeouts and no concurrent runner.

Keep separate transactions per database; there is no cross-database atomic commit. Clarify the packet's claim that 'both migrations' share a single transaction. Preflight under the final lock must reject incompatible pre-existing tables/indexes rather than let IF NOT EXISTS hide drift. Record successful postconditions before ledger confirmation. Register neither blocked 0029 nor unrelated DDL. Prefer restore/forward recovery over a destructive rollback; any empty-table rollback remains an explicit separate operation, must lock/recheck all rows and exact ledger attribution, and is not authorized by this review.

**Approved: offline preparation and harness/evidence correction within standing scope. Not approved: physical DDL, account/provider changes, queue publication, deployment or remote push.** Return the concrete target/recovery/executor packet for execution approval once prerequisites are fulfilled; no repeated approval is needed for the offline work.

## Next owners and governance

1. Gemini: R1-R4 test/report repairs, preserving negative tests and production isolation; retain raw sanitized outputs, revision, target fingerprint and exact limits.
2. Argon: R5 exact migration/executor/recovery packet; route any reproduced production defect to Argon, not Gemini self-fix. Preserve bounded accepted source corrections.
3. Argon/Sonnet then Gemini: finish original finding/source/caller-to-evidence reconciliation; enriched rows and re-anchored headings do not independently certify exhaustive 181-caller coverage.
4. Environment owner: explicit target/recovery/provider/test-account bindings and any physical-operation authorization. Local env synchronization does not prove running processes restarted or deployed bindings changed.
5. Sol: review the repaired packet and independently evidenced remaining TC/FND/canonical G1-G9 gates. Overall W1-W3 stays PARTIAL_ACCEPTANCE; W4.1-W4.6 have no implementation GO.
