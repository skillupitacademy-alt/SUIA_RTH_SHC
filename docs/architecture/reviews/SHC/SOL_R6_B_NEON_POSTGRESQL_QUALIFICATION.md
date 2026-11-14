# R6-B Remote Neon PostgreSQL Qualification

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
