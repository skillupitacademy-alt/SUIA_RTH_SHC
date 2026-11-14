# R6-B Remote Neon PostgreSQL Qualification

> Latest technical closure, 14 November 2026 — the corrected supported PeopleDB migration command passes all mandatory disposable checks. Recommendation PASS for the R6-B migration technical blocker, subject to owner evidence review. Shared PeopleDB execution remains HOLD. Credential exposure remains OPEN — REMEDIATION DEFERRED BY OWNER. Earlier NOT READY/9-PASS/1-FAIL sections below retain their historical provenance and are superseded for this technical blocker by the final closure section.

Completed 14 November 2026 against local main `4c73b83f31b38ee86fc84862d49d2c2ae8f5f79f`.

**Recommendation — NOT READY for shared PeopleDB migration.** Nine scenario groups pass. Migration-chain qualification remains FAIL because fresh historical replay raises SQLSTATE 42710. The pending upgrade from the inherited baseline passes, including 0009 ordering and an idempotent repeat. The shared PeopleDB uniqueness migration remains HOLD.

## Verified disposable target

| Property | Evidence |
|---|---|
| Owner-supplied project name | platform-people |
| SQL-reported project ID | bitter-tree-18287476 |
| Owner-supplied branch name | r6b-peopledb-qualification |
| SQL-reported branch ID | br-young-silence-a1b1ta26, exact match to owner-supplied ID |
| Endpoint ID | ep-fragrant-brook-a1mhx5dm |
| Pooled endpoint | ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech |
| Direct endpoint | ep-fragrant-brook-a1mhx5dm.ap-southeast-1.aws.neon.tech |
| Database and role | people_prod, neondb_owner |
| PostgreSQL | 17.12 |
| Parent branch | production, owner-attested. Management-console parent relationship was unavailable for independent inspection. |

The initial neondb connection exposed an empty default database. Subsequent read-only pg_database inventory found people_prod on the same endpoint. Its users, platform_access and drizzle.__drizzle_migrations objects matched the expected PeopleDB baseline. PostgreSQL pg_settings exposed neon.project_id, neon.branch_id and neon.endpoint_id, allowing direct server-side verification without a management API key.

ISOLATION_PREFLIGHT.json preserves the original blocked preflight as historical evidence. BRANCH_DATABASE_INVENTORY.json contains the discovered SQL-reported identifiers. FINAL_DATABASE_STATE.json records the final verified target. Both pooled and direct endpoints were compared with the five protected shared targets after removing the pooler suffix. Each mutation harness checked the exact project, branch and database. Credentials were supplied only to child-process environment or in-memory clients. No shared connection fallback was configured in the qualification harnesses.

## Ten scenario outcomes

| Scenario | Result | Actual PostgreSQL finding |
|---|---|---|
| 1. Existing global-email uniqueness | PASS | Original users_email_unique rejected synthetic cross-brand duplicate with SQLSTATE 23505. |
| 2. Platform-qualified normalized uniqueness | PASS | Candidate expression/partial unique index accepted independent platforms and rejected same-platform case/space variants. Injected DDL failure 22012 rolled back. |
| 3. Independent SUIA/RTH identities | PASS | Distinct person UUIDs and correct platform-qualified selection. Separate synthetic brand databases additionally used colliding local UUIDs. |
| 4. Bridge concurrent writes and retries | PASS | Eight concurrent sync calls and repeat reconciliation produced one person and one grant. |
| 5. Grant recovery and revocation | PASS | Authorized missing own-platform grant recovered. Soft-deleted grant restoration and cross-platform access were denied. |
| 6. Shadow links and interrupted operations | PASS | Foreign link denied, people commit retained across brand client failure, retry recovered. PostgreSQL trigger failure P0001 rolled back bridge person insertion. |
| 7. SSO authorization, locks and audit rollback | PASS | Real repository same-platform grant/revoke passed. Wrong role/brand and disabled actor denied. Lock timeout 55P03 and transactional audit-failure rollback verified. |
| 8. Seed conflict expression | PASS | Exact target expression upsert passed, repeat was a no-op and retained original synthetic credential hash. |
| 9. Migration chain and 0009 ordering | FAIL | Normal pending upgrade from inherited 0000-0008 baseline through 0009 then candidate passed and repeated idempotently. Fresh full historical replay failed at duplicate 0006/0007 foreign key, SQLSTATE 42710. |
| 10. Recovery and cleanup | PASS | Real pg_dump/pg_restore synthetic-only logical recovery matched data/index/ledger fingerprints. Scratch resources cleaned. Owner-created branch retained for manual owner cleanup. |

TEN_SCENARIO_REGISTER.json maps the groups to individual receipts. Executed Vitest selections passed 8 integration tests, 1 separate-database bridge test and 1 database-enforced rollback test. These ten tests contain multiple scenario assertions. They coexist with the separately failed fresh migration replay.

The qualification harnesses were formatted after execution. HARNESS_FORMAT_VERIFICATION.json confirms their emitted runtime tokens are identical to the executed versions and their syntax parses successfully.

The production UserIdentityBridgeService, SsoService and DrizzleUserRepository were invoked against real PostgreSQL through Drizzle's node-postgres adapter. The production database package normally uses Neon's WebSocket driver. This qualification proves SQL/transaction behavior using the PostgreSQL wire driver. It does not establish browser, deployed service or WebSocket-transport acceptance.

Separate disposable SUIA/RTH fixture databases were verified through SQL-reported project/branch/database identity before writes. Their minimal users tables expose only the existing local-ID/shadow-ID boundary. Deliberately colliding local UUIDs and matching email addresses produced separate PeopleDB UUIDs. Earlier schema-qualified brand fixtures are also retained in the historical receipts. Full brand application schemas and end-to-end login were outside these fixture tests.

## Migration findings

The inherited ledger held nine applied entries corresponding to 0000 through 0008. Each hash matched one existing SQL file. Student invitations were absent before rehearsal. MIGRATION_BASELINE.json records file hashes, ledger rows and the inherited user-record digest.

On the disposable people_prod database, a deliberate candidate-DDL failure with SQLSTATE 22012 rolled back and restored the original constraint/index state. The successful transaction then applied the unmodified 0009_student_invitations SQL, appended its isolated ledger receipt, created the candidate normalized unique index, removed the global users_email_unique constraint and appended the isolated candidate receipt. Original ledger rows were retained. The candidate SQL is an evidence artifact and has no shared execution approval.

A separate assignment-created empty database tested the normal Drizzle migrator from the complete historical chain. It failed with SQLSTATE 42710 because both `0006_skillhubcore_subscription_schema.sql` and `0007_long_sentinels.sql` add `subscription_features_plan_id_subscription_plans_id_fk`. This failure occurred before the pending upgrade could be reached. NORMAL_MIGRATOR_REHEARSAL.json preserves the failure and cleanup receipt. Historical SQL and journal files retain their baseline bytes.

A separate schema-matched pre-0009 fixture restored the inherited schema shape and exact original ledger into a newly created empty database. The normal Drizzle migrator then applied 0009 followed by the disposable 0010 candidate. The ledger grew by two entries, original rows matched, and a second migrator invocation was idempotent. PENDING_UPGRADE_REHEARSAL.json records this PASS.

The fresh-replay failure needs a separately approved migration-repair or historical-provenance disposition. A successful forward upgrade does not close that failing recovery path. A shared migration also needs its finalized append-only artifact, journal/snapshot review and fresh shared read-only preflight under a separately approved operating plan.

## Transaction and authorization evidence

Eight concurrent bridge calls resolved one stable person UUID and one own-platform grant. PostgreSQL applied the external-ID/platform and user/platform uniqueness constraints. Case/space variants conflicted under the candidate normalized partial index.

An assignment-owned trigger injected PostgreSQL P0001 during the bridge's grant insert. The preceding person insert rolled back, leaving zero matching people. Removing the trigger allowed retry to create the intended mapping and grant. All trigger/function resources were removed.

Administrative grant/revoke invoked the actual service and repository with current synthetic actors. Same-platform authorized operations passed. Cross-platform requests, insufficient current role, disabled administrators and implicit restoration of soft-deleted grants were denied. A competing FOR UPDATE encountered SQLSTATE 55P03 under a bounded lock timeout. An injected audit-writer failure occurred after a real SQL grant mutation inside the repository transaction, and PostgreSQL rollback removed that grant.

The missing-grant recovery test exercises the approved canonical-account reconciliation path. Hard-deleted access history remains ambiguous because absence alone cannot distinguish initial incompletion from intentional hard revocation. Operational revocation must retain the existing soft-deletion semantics. Cross-database atomicity is not claimed.

## Logical backup and recovery

PostgreSQL 17.12 client utilities were downloaded from the EDB Windows binary archive. Only pg_dump, pg_restore, psql and supporting DLLs were extracted into an assignment-owned temporary directory. The archive SHA-256 and selected files are recorded in CLIENT_UTILITIES.json. Temporary utilities and backup files were removed. The download source is the EDB binary distribution linked by the PostgreSQL Windows downloads page. [EDB binaries](https://productsdl.enterprisedb.com/download-postgresql-binaries), [PostgreSQL Windows downloads](https://www.postgresql.org/download/windows/)

A schema-only dump of the disposable PeopleDB populated an assignment-created recovery source database. Only synthetic people/grants/audit rows and migration hashes were inserted into that source. A custom-format pg_dump archive was restored with pg_restore into a second empty disposable database. Users, platform grants, audit rows, selected indexes and migration-ledger fingerprints matched before/after. Both databases were deleted. RECOVERY_REHEARSAL.json records the commands, exit codes, backup hash and matched fingerprints.

The tested method is logical backup/restore of synthetic-only data with the inherited schema. Neon snapshot/PITR, shared data-volume recovery, copied administrator credentials, production authentication after restore and recovery-point timing remain unqualified. A current shared backup and its authorized restoration rehearsal are prerequisites for shared execution.

## Failure history and evidence limitation

Initial pg_dump failed because libpq lacked a root certificate file. The corrected run used Node's public trust roots with verify-full certificate and hostname checks. Another attempt through the pooled endpoint reached a missing-table error during fixture preparation. The direct endpoint succeeded. A later synthetic INSERT had a parameter-type conflict (42P08), corrected only in the qualification harness.

The first separate-brand test's assertions passed, but forced cleanup caused an unhandled 57P01 driver event and an overall exit 1. Its driver diagnostic serialized the supplied connection credential. A redaction write failed under the Windows text encoding and truncated that raw log. crossdb-initial-summary.txt explicitly reconstructs this event from the observed tool output. The initial structured results and nonzero execution receipt remain available. The corrected runner redacts the credential before writing logs, closes clients before normal cleanup and completed with exit 0.

This credential appeared in a diagnostic during the assignment. The owner should rotate it before further use. Credential rotation was not executed. The final evidence scan finds no connection passwords or credential-bearing URLs in the report/harness/evidence files. The lost raw failure log remains an evidence limitation and is not represented as preserved.

## Cleanup and final state

FINAL_DATABASE_STATE.json confirms zero synthetic people, schema fixtures, trigger functions or scratch databases. Inherited user-record and original migration-ledger digests match the pre-test values. The main integration test removed 13 synthetic people. Separate bridge and rollback tests removed their additional synthetic records. Recovery and migration fixtures were deleted by exact assignment-owned names.

The manually created qualification branch remains available for owner review. Its people_prod database retains 0009, the candidate normalized unique index and the two isolated ledger additions. Its final ledger has eleven rows. Management access was unavailable, so branch deletion remains an owner action. No parent/shared branch restore or mutation was performed.

## Source and acceptance status

The source baseline is 4c73b83f31b38ee86fc84862d49d2c2ae8f5f79f. All changes in this assignment are qualification harnesses, report and evidence. Previously protected R6-A, P0, CHG-01B, CHG-02A, CHG-03 and Policy A/B sources match their recorded hashes. Canonical acceptance registers retain their original bytes. Q48 is OPEN.

The existing governance documents and latest owner decisions control this task. Attendance, payments, Marketing, broad accessibility/performance, MainDB ownership migration, deployment and Git publication retain their HOLD/approval boundaries.

Before shared migration approval, the owner needs a disposition for the fresh historical replay failure, independently reviewed exact migration artifacts, a current shared backup/recovery plan and an explicit shared execution decision. The proposed uniqueness and existing identity code passed the bounded physical tests. Overall migration readiness remains NOT READY until those recorded blockers are resolved.


## Owner migration disposition and deferred security governance, 14 November 2026

This documentation-only investigation uses evidence commit `8ca7ad05e04cf15f6cdce16afb4ad8a84852ee68`. No database connection or execution occurred during this disposition task. Prior qualification receipts retain their dates, source baseline and outcomes.

| Item | Current evidence/workflow state |
|---|---|
| PeopleDB identity implementation | IMPLEMENTED, bounded real PostgreSQL behaviors VERIFIED in earlier qualification. |
| Qualification outcome | VERIFIED 9 scenario groups PASS and 1 FAIL. Overall R6-B NOT READY. |
| Fresh historical replay | FAILED with SQLSTATE 42710. Correction BLOCKED pending owner design approval. |
| Existing-baseline pending upgrade | VERIFIED in disposable schema-matched fixture, 0009 followed by candidate and idempotent repeat. |
| Replay compatibility correction below | PROPOSED, NOT IMPLEMENTED. New verification plan NOT TESTED. |
| Shared PeopleDB migration | HOLD. |
| Known credential incident R6B-SEC-01 | DEFERRED — OWNER DECISION, security risk OPEN. |
| Project-wide rotation governance | PLANNED FOR LATER SECURITY PHASE after current documentation/architecture work. |
| Q48 | OPEN. |

### Exact replay root cause and additional overlaps

The normal disposable replay reached 0007 and failed while adding the foreign key already installed by 0006. The source comparison identifies five overlaps. All five definitions have equivalent objects/semantics after excluding the CREATE IF NOT EXISTS guard. Only the first foreign-key collision was physically executed before the transaction aborted. The remaining collisions are verified SQL-source findings and need the planned replay tests.

| Object | 0006 line | 0007 line | Source definition and mismatch |
|---|---|---|---|
| subscription_features_plan_id_subscription_plans_id_fk | 30 | 44 | subscription_features(plan_id) references public.subscription_plans(id), ON DELETE CASCADE, ON UPDATE NO ACTION. 0006 catches duplicate_object in its DO block. 0007 adds the constraint unconditionally. |
| user_features_cache_user_id_users_id_fk | 35 | 45 | user_features_cache(user_id) references public.users(id), ON DELETE CASCADE, ON UPDATE NO ACTION. Same guarding difference. |
| idx_subscription_features_plan | 40 | 46 | Nonunique btree on subscription_features(plan_id, feature_key). 0006 uses IF NOT EXISTS, 0007 is unconditional. |
| idx_subscription_plans_active | 39 | 47 | Nonunique btree on subscription_plans(is_active, name). Same guarding difference. |
| idx_user_features_cache_user | 41 | 48 | Nonunique btree on user_features_cache(user_id, cached_at). Same guarding difference. |

The affected files are `packages/db-people/migrations/0006_skillhubcore_subscription_schema.sql` and `packages/db-people/migrations/0007_long_sentinels.sql`. For both foreign keys, source defaults imply non-deferrable immediate enforcement, MATCH SIMPLE and ordinary validated constraints. Source ON DELETE/ON UPDATE semantics match exactly. The three ordinary indexes have the same tables, key order and btree method. MIGRATION_SOURCE_COMPARISON.json preserves the exact statements, line numbers, journal order and source hashes.

The shared journal lists 0000 through 0009 with strictly increasing timestamps, including 0006 before 0007. It accurately orders the existing files. Reordering 0006/0007 would also change historical interpretation and leave overlaps, so ordering alone is not the correction. The requested clean replay must include prerequisite 0000, which creates the initial types/tables, before 0001 through 0009. Starting from 0001 on an empty database is insufficient.

### History and existing-installation compatibility

The inherited PeopleDB ledger captured during qualification records both 0006 and 0007 with hashes matching current SQL files. These are recorded-applied facts from the branch copy. This task has not queried protected environments afresh, and their current state or original execution procedure remains unverified. In particular, recorded-applied hashes do not explain how the historical overlap was resolved when that environment was built. A current protected read-only preflight and original execution provenance need separate review before shared DDL approval.

The installed Drizzle reader computes SHA-256 over each SQL file and supplies that hash with its journal timestamp. The ORM PostgreSQL migrator used in qualification stores hash/created_at in drizzle.__drizzle_migrations but selects work by the most recent timestamp. Its inspected implementation does not compare each applied hash with the current source on every run. Therefore editing historical SQL can silently create conflicting source/ledger histories even when an existing upgrade skips that file. The package db:migrate command uses drizzle-kit migrate. Its precise behavior must be included in implementation verification rather than inferred solely from the tested ORM migrator.

The fresh replay fails before 0009. The existing-baseline upgrade passed because its prior ledger caused 0006/0007 to be skipped, then applied 0009 and the test uniqueness candidate. Environments pending 0007 or partially created outside a successful migration transaction require their own preflight and remain BLOCKED. A later migration cannot fix an earlier abort because the runner never reaches it.

### Proposed minimal correction under immutable-history requirements

**Recommendation for owner approval** is a narrowly scoped replay compatibility change at the existing PeopleDB migration command boundary. Retain every historical SQL file, journal timestamp, snapshot and applied ledger row. Limit compatibility handling to the five exact overlapping 0007 statements listed above and the pinned SHA-256 of that historical input. A changed or unknown source hash must fail closed.

The implementation would load the unmodified migration files, preserve their original content hashes, and execute an explicitly reviewed compatibility representation of only those five statements. It must compare structured PostgreSQL catalogs for the target objects before executing them. This is an execution-contract change requiring owner approval. It is not implemented by this documentation task.

1. For an absent expected object, execute the original DDL to create it.
2. For an existing object with the expected identity and equivalent definition, record an explicit equivalent-object no-op in the redacted execution receipt and continue.
3. For a same-name object with any definition mismatch, invalid/unvalidated state, wrong table/schema, key order, FK target, referential action, deferrability, uniqueness, predicate, collation/operator-class or access-method mismatch, abort. No generic exception handler may swallow 42710/42P07.
4. Serialize the migration operation through the approved existing execution boundary. Catalog comparison and DDL must share the same transaction and qualified namespace. A duplicate race must trigger revalidation or abort, never silent success.
5. Leave all other 0007 statements and later migrations unchanged. Preserve full transaction rollback and append the usual ledger entry only after the migration succeeds.
6. Record the original migration-file hash plus the compatibility revision, executed statement/projection hash, catalog equivalence results and exact SQLSTATE outcome in the execution artifact. The stored original hash identifies immutable source, while the separate receipt makes the reviewed execution variation explicit. No fake applied rows or historical hash substitution is allowed.
7. Wire the approved behavior through the supported existing db:migrate entry point and its tested harness. An isolated helper that leaves the supported clean-install command failing does not satisfy acceptance. Raw historical replay remains the preserved failure reproduction, and supported compatibility replay must be clearly named and documented.

Potential source locations after approval are the existing `packages/db-people/package.json` migration command and its approved execution entry point, with focused tests/evidence. No alternative service, schema table or background mechanism is required. Detailed runner/Drizzle compatibility must be reviewed before implementation because the current command delegates to drizzle-kit.

This approach adds explicit handling only where the immutable chain conflicts with a clean installation. An owner-approved versioned bootstrap/baseline generation is an alternative if a compatibility runner is rejected, but it requires a larger provenance design. It must not invent applied historical rows. Editing 0007 in place, broadly catching duplicate_object, dropping foreign keys, or appending a later fix that fresh replay cannot reach are not approved corrections. HOLD remains the default until a concrete design is approved and verified.

### Controlled disposable verification plan, execution NOT TESTED in this task

| Case | Required evidence and pass criterion |
|---|---|
| Target preflight | Approved disposable project/branch/database IDs verified server-side and compared with protected targets. Fresh disposable credential supplied through a protected mechanism because current incident credential use is deferred. No fallback connection. |
| Raw failure reproduction | Unmodified 0000–0009 replay reproduces the known first collision on a disposable empty database. Preserve SQLSTATE and transaction/ledger result. |
| Supported clean installation | Approved compatibility entry point applies 0000 then 0001–0009 from empty and reaches the expected schema. All five overlaps handled with explicit equivalent-object decisions. |
| FK definitions | Inspect both constraints for exact referencing/referenced ordered columns, CASCADE/NO ACTION actions, MATCH SIMPLE, validation and deferrability. Insert orphan fixture rows and expect 23503. Verify approved delete semantics using owned fixture parents only. |
| Index definitions | Verify all three ordinary indexes and the external-ID/platform unique index. Check key order, btree method, uniqueness, predicates, collation/operator classes and validity. |
| Mismatch negatives | Seed same-name wrong FK action/target or wrong/invalid index in disposable fixtures. Every mismatch must abort without silently dropping or accepting it. |
| Absent-object paths | Exercise each exact guarded statement with its object absent and prerequisites present, demonstrating correct creation. |
| Existing-baseline upgrade | Restore a schema-matched 0000–0008 fixture with authentic inherited ledger/provenance, then apply pending 0009 followed by the separately reviewed uniqueness candidate. Preserve all original ledger rows and hashes. |
| Ledger and compatibility evidence | Compare original file hashes with baseline, normal appended entries, timestamp order and execution-representation receipts. Unknown hash or unsupported entry point fails closed. |
| Repeat execution | Rerun the supported migrator. No schema, row or ledger changes beyond explicitly approved no-op evidence. |
| Failure/rollback | Inject a statement failure after a compatibility decision. Demonstrate transaction rollback and no premature ledger advancement. Inspect lock timeout and uncertain-commit outcomes before retry. |
| Concurrency | Competing migration attempts serialize or fail safely within bounds. Catalog checks cannot race an uncoordinated object change into false acceptance. |
| Identity regression | Reuse R6-B same-email independence, normalized duplicate denial, bridge concurrency/rollback, grant revocation, SHC authority, UUID reporting and tenant-isolation requirements with owned synthetic fixtures. |
| Recovery | Verify schema/data/ledger logical restore on synthetic-only databases, record exact tested guarantees, and assess protected backup/recovery separately before any shared execution decision. |
| Evidence and cleanup | Preserve command, start/end time, source and compatibility hashes, SQLSTATE, before/after catalogs, failed attempts and owned-resource cleanup. Record any retained branch. Protect credentials before writing diagnostics. |

No executable correction or test operation is authorized by this plan alone. The qualification branch and historic receipts remain reference evidence. Fresh protected deployment status, new correction behavior and current credential containment are NOT TESTED here.

### Credential incident and governance disposition

The owner defers the project-wide credential program until the current development, architecture and relevant Markdown/CSV work completes. R6B-SEC-01 remains a known exposure with OPEN risk and workflow state DEFERRED — OWNER DECISION. The existing Security Hardening Plan records incident scope, unknown impact, containment options, future program requirements and closure evidence. The existing Risk Register and canonical requirement CSV notes link to that record.

All 41 added/modified blobs in evidence commit 8ca7ad05 were scanned non-destructively with redacted output for known Neon credentials, credential-bearing PostgreSQL URLs, signed JWTs, private keys and selected provider-key formats. There were zero matches. This is a bounded committed-file check. It does not establish absence of every secret format, remove the incident from tool history or close the known disclosure. The lost diagnostic log remains a documented evidence limitation. No credential values were displayed, recovered or reconstructed by this task.

The incident's later rotation/revocation and validation remain required for closure. Current work uses source/receipts without further database access. Existing artifacts may be access-restricted through owner-controlled tools, and the retained disposable branch may be removed after dependency/evidence review. These containment measures were identified, with no live configuration or credential change performed.

### Owner decisions required after this report

Approve or reject the exact-object, pinned-history compatibility design before source implementation. A subsequent execution approval must identify disposable targets, credentials and synthetic scope. Protected PeopleDB migration remains HOLD until corrected clean installation, existing upgrade, provenance and recovery gates are accepted. Project-wide credential remediation remains deferred under the owner decision and the known incident stays OPEN. Q48 remains OPEN.


## Final controlled implementation and qualification closure, 14 November 2026

Owner approval authorized the documented exact-object compatibility correction, focused disposable verification and a local commit. Implementation baseline is `3358fe9b1f61dd75fa5adaeb4710c8b94ca940b4`, following qualification commit `8ca7ad05`. Final source hashes and receipts are under `.evidence/r6-final-migration`. The new local commit SHA is reported after committing this evidence.

**Technical recommendation PASS**, subject to owner evidence review, for closing the R6-B fresh migration replay blocker. The final run passed 24/24 physical PostgreSQL tests. Focused existing seed-conflict/email-normalization regressions passed 25/25. Package typecheck, explicit CLI typecheck, zero-warning affected lint and package build all exited 0. Earlier nine passing qualification groups are reused unchanged. Protected database execution and deployment retain their separate approvals, and the credential incident remains OPEN with remediation deferred by the owner.

### Implemented existing migration command

| Changed source | Result |
|---|---|
| `packages/db-people/src/migration-compatibility.ts` | Pinned migration bytes/timestamps, exact catalog guards, applied-prefix hash validation, transaction/advisory lock, bounded timeout, original-hash ledger entries and redacted compatibility receipts. |
| `packages/db-people/scripts/migrate.mts` | Supported CLI uses existing PeopleDB configuration loading and Neon WebSocket driver, reports sanitized failures and emits optional JSON receipts. |
| `packages/db-people/package.json` | Existing db:migrate now invokes the controlled CLI through tsx. |

Historical migration SQL, journal order, snapshots and original hashes remain byte-identical. The reader uses existing Drizzle migration metadata. Pending statements, appended original-hash ledger receipts and compatibility checks execute in one PostgreSQL transaction, under a migration advisory lock and exclusive ledger lock. Existing ledger rows must match the source prefix. For already-applied 0007, definition validation rejects absent/drifted objects instead of silently repairing them.

The exact catalogs verify table/schema identity, ordered FK columns and referenced relation, CASCADE/NO ACTION actions, MATCH SIMPLE, validation and deferrability. Index checks cover table, btree method, key order/count, included/expressional keys, uniqueness, predicate, default operator classes, collation, ordering and valid/ready/live state. Missing pending objects are created and then validated. A mismatch raises P0001 and rolls back. The correction does not catch duplicate-object errors indiscriminately.

### Two additional conflicts found by mandatory replay

The first corrected full replay reached two more unconditional indexes in 0007 that duplicate `0005_people_perf_indexes.sql`. The earlier five-object inventory missed them. Under the owner's instruction to correct specific mandatory-test failures, the same exact-object strategy now also covers `idx_subscriptions_user_active` on subscriptions(user_id,status) WHERE status='active', and `idx_sso_sessions_family` on sso_sessions(jwt_family,revoked_at). The source hash/timestamp pin includes 0005 as well as 0006/0007. These are the only scope additions, and both received absent-object and deliberate-mismatch tests. All seven compatibility decisions are recorded with original source hashes and executed representation hashes.

### Final mandatory results

| Check | Result |
|---|---|
| Fresh supported pnpm db:migrate command, including prerequisite 0000 then 0001–0009 | PASS, 10 migration entries with original hashes/timestamps |
| Both foreign keys, three documented indexes and two additional 0005 indexes | PASS, equivalent existing objects and absent-object creation paths |
| Deliberate mismatch for each of seven objects | FAIL CLOSED, P0001 |
| Already-applied object-definition drift | FAIL CLOSED at the supported runner boundary |
| Pending 0009 existing-baseline upgrade | PASS, original nine ledger entries preserved, one appended 0009 entry |
| Repeat supported CLI and repeat upgrade | PASS, no ledger advancement |
| FK and index definitions plus orphan rejection | PASS, 23503 for both foreign-key controls |
| Historical file/journal hashes, applied ledger hashes and ordering | PASS |
| Pinned source alteration and corrupted applied hash | FAIL CLOSED before migration advancement |
| Injected pending DDL failure | PASS rollback, SQLSTATE 22012, marker table absent and ledger unchanged |
| Concurrent migration attempts | PASS, bounded 55P03 rejection or serialized completion, safe subsequent no-op retry |
| Disposable normalized uniqueness candidate | PASS, same-email independent brands, same-platform normalization conflict 23505 |
| Existing platform-access unique/FK constraints | PASS, duplicate 23505 and orphan 23503 |

The supported command is `pnpm --filter @quiz/db-people db:migrate`. The command's original historical SQL files remain preserved, so raw unsupported replay through an unwrapped historical reader retains the recorded failure. Current acceptance applies to the corrected supported entry point. The uniqueness candidate was exercised only as the existing disposable evidence artifact. No shared migration file was added or executed.

### Verification history and limits

Initial correction runs exposed CLI ESM/config resolution and a reserved SQL alias issue. Both were corrected in the migration source. The next replay exposed the two 0005 index overlaps. Failed attempts, SQLSTATEs and their successful scratch cleanup are retained with initial-/second- receipt prefixes. An intermediate seven-object run passed before the applied-definition drift check and final hash-drift control were added. The final 24-test run includes those controls. No failing test was skipped or suppressed.

Mandatory execution used the previously verified disposable Neon project `bitter-tree-18287476`, branch `br-young-silence-a1b1ta26`, direct/pooled endpoint `ep-fragrant-brook-a1mhx5dm`. Every scratch database was verified server-side before tests. Only assignment-owned database names were dropped. The existing test-branch PeopleDB ledger and inherited user digest matched their prior qualification values. FINAL_DATABASE_STATE.json and CLEANUP.json show zero remaining final scratch databases. The manually created qualification branch remains for owner review.

The owner deferred rotation and authorized this bounded verification with the supplied disposable connection. The known incident remains OPEN. Credentials were passed in process environment, redacted from test output and excluded from tracked artifacts. No rotation, new security phase or incident closure occurred.

Package and CLI source were typechecked. Relevant lint passed with max-warnings=0. Existing controlled regression tests ran behind a transport guard. Final physical tests used the production Neon WebSocket driver and direct PostgreSQL catalog/assertion clients. Browser, deployed authentication, protected backup and shared production migration were not requalified by these focused tests. Previous logical recovery receipts remain historical evidence.

### Acceptance and remaining owner gates

The supported fresh-replay migration blocker is technically resolved and recommended for closure after owner evidence review. Canonical CSV notes link this bounded result while preserving unrelated criterion statuses. Shared PeopleDB migration, rollout and the wider Q48 acceptance remain owner-controlled. The credential-exposure incident stays OPEN — REMEDIATION DEFERRED BY OWNER, and retained-branch cleanup remains an owner action after review. Further protected SQL or GitHub publication requires separate approval.

### Registered 0010 and final integration continuation

Implementation commit `036681cd76b61b283a9a311e54609e4d43b088a0` registers `0010_normalized_platform_email` after `0009_student_invitations` and implements SHC persisted-session revocation. Its 157 controlled tests and completed quality/build checks remain accepted evidence. The earlier 24 physical migration tests retain their historical boundary.

The final integration continuation established SHC fresh-login-at-expiry behavior through source tracing, six additional focused controlled tests and three actual localhost expired-credential GET controls. The existing readiness report contains the current closure matrix and evidence paths under `.evidence/r6-shc-revocation`.

Registered 0010 physical execution remains BLOCKED because the suggested secure test env file is absent. The verifier now accepts an explicit Git-excluded local file containing `R6_NEON_TEST_URL`, rejects protected/malformed/missing targets before connection, and preserves the approved disposable branch assertions. This continuation executed no migration or database write. Fresh login at SHC expiry is preserved under the latest owner instruction. Full new-schema session and three-app integration remain pending. Protected backup/recovery and shared 0009/0010 execution still require their recorded owner approvals. R6B-SEC-01 remains OPEN — REMEDIATION DEFERRED BY OWNER.

### Registered 0010 physical completion — 14 November 2026

The owner supplied and explicitly reauthorized the disposable connection. The previous missing-input state is superseded. Server-side project/branch checks precede writes. Source baseline is `4aa0cad2e7659b35e2092c2edbfe4638868c917f`.

`.evidence/r6-shc-revocation/DISPOSABLE_RESULTS.json` records seven passing groups and successful scratch cleanup. Supported fresh replay through 0009 succeeds. A normalized same-platform duplicate causes registered 0010 to fail with 23505, retaining the old global constraint and ledger. After removing only those synthetic conflicting rows, 0010 succeeds and repeat execution is a no-op. Same-email independent platforms succeed and normalized same-platform duplication remains rejected. Actual SHC service/handler/guard revocation and fresh login pass against PostgreSQL, with a controlled audit adapter.

The subsequent five-database localhost runtime uses schema-only copies and three synthetic identities. `.evidence/r6-e2e/MIGRATION_RECEIPT.json` records pending 0009 then 0010 with matching original/executed hashes. `FINAL_CATALOG.json` records eleven ledger entries and the exact final expression/partial unique index. Both learners establish distinct persisted projections and grants, render synthetic tutorials, persist progress and answers, complete exams and retrieve completed results. SHC browser login/logout/replay and fresh login pass. Warm-up failures and harness corrections remain preserved in separate receipts.

Fresh historical schema lacks the SHC enum label already present in the protected database. The standalone service fixture adds it only in its disposable database. The full runtime copies the existing schema. Fresh SHC installation provenance remains a separate limitation.

All six newly created scratch databases were removed and verified absent. Temporary application processes, copies and client utilities were removed. The manually created Neon branch and pre-existing databases remain. Protected final inspection ran in a read-only transaction and still reports nine ledger entries through 0008, global uniqueness and zero normalized same-platform conflicts.

The bounded existing-schema migration/integration qualification passes. Cold-start reliability remains unqualified, and prior backup/restore evidence retains its original synthetic scope. The detailed flow matrix and remaining approvals are in `SOL_R6_B_THREE_APP_RELEASE_READINESS.md`. Protected migration/deployment remain HOLD. R6B-SEC-01 remains OPEN — REMEDIATION DEFERRED BY OWNER. Canonical statuses and Q48 are unchanged.
