# PeopleDB uniqueness migration readiness and identity-bridge safety

14 November 2026 · Read-only review · Owner approval required for implementation

## Decision

PeopleDB uniqueness migration remains HOLD. CHG-02A's account-selection correction is present. Seed compatibility, email association/normalization, bridge recovery, three missing brand shadow links, migration ordering and backup rehearsal require separate dispositions first.

This review inspected current source, read database catalogs and aggregate identity mappings, and evaluated the existing bridge through controlled in-memory adapters. Report/evidence files are the deliverables. Application source, schema, records and acceptance classifications retain their prior bytes.

## Baseline and authority

Filesystem provenance identifies local `main` at `b8a3ec4a03332c5053dd3c954bc19ba130ffe9aa`. `.evidence/r6-chg02-readiness/BASELINE.json` captures scoped SHA-256 hashes. Git CLI and remote/deployed verification were outside this assignment.

Applicable references are SHC 00, PSEG-001 proposed v1.1, architecture annex 02, acceptance annex 03, workflow annex 04, the CHG-02A review and the owner's latest read-only instructions. Relevant criteria include authoritative identity, explicit brand grants, typed contracts, migration integrity and recovery evidence. Proposed governance retains its proposed status. The canonical SHC ledger and original Q01–Q48 register remain owner-controlled. Q48 stays OPEN.

Evidence is under `.evidence/r6-chg02-readiness/`.

| Artifact | Meaning |
|---|---|
| `PEOPLEDB_READONLY_CATALOG.json` | Fourteen catalog/aggregate queries in a repeatable-read, read-only PeopleDB transaction, rolled back. |
| `BRAND_PROJECTION_READONLY.json` | Separate read-only PeopleDB, SkillUpDB and RthDB snapshots. UUIDs were joined in memory. Stored output contains counts. |
| `READONLY_SUPPLEMENT.json` | Physical invitation-table presence, users relation size and email-reference metadata. |
| `MIGRATION_JOURNAL_COMPARISON.json` | Exact SQL SHA-256 values compared with live migration rows by journal timestamp. |
| `BRIDGE_CONTROLLED_ANALYSIS.json` | Current source transpiled in memory with controlled persistence/failure adapters. These are behavioral probes. PostgreSQL race execution remains pending. |
| `DEPENDENCY_READINESS.csv` | Eighteen dependencies classified READY, SOURCE CORRECTION REQUIRED, DATA CHECK REQUIRED or OWNER DECISION REQUIRED. |
| `FINAL_REVIEW_VERIFICATION.json` | End-of-review source/ledger hashes and evidence manifest. |

## Fresh database observations

The inspected PeopleDB server reports PostgreSQL 17.12. The first transaction reported `transaction_read_only=on`. Inspection used protected local connection settings and saved aggregate/catalog output. Snapshot conditions can change before migration. Cross-database observations came from separate transactions and require rechecking at the approved maintenance boundary.

| Condition | Observed result | Interpretation |
|---|---|---|
| PeopleDB users | 319 | 217 SUIA students, 99 RTH students, two RTH administrators and one SHC super-admin. |
| Global email uniqueness | Valid `users_email_unique` constraint/index exists | Current global restriction remains effective. |
| Desired normalized platform uniqueness | `uniq_users_email_platform` absent | Source/live index drift is verified. |
| Existing email/platform index | Valid non-unique `idx_users_email_platform` | It provides no replacement uniqueness guarantee. |
| External identity uniqueness | Valid `idx_users_external_id_platform` | Unique `(external_id, platform)` for non-null external IDs, including soft-deleted records. |
| Same-platform normalized duplicates | Zero groups among all undeleted rows | This includes inactive accounts. The migration predicate excludes deleted rows only. |
| Cross-platform normalized duplicate emails | Zero groups in PeopleDB | The current snapshot does not exercise the future same-email capability. |
| Noncanonical or blank undeleted emails | Zero | Future write paths still require consistent normalization. |
| External identity duplicates | Zero groups | Current index and aggregate check agree. |
| Platform-access key | Valid unique `(user_id, platform)` | Available for concurrency-safe grant insertion. |
| Orphan grants / soft-deleted grants | Zero / zero | Revocation edge cases require synthetic tests. |
| Active cross-platform grants | One | Review its existing authorized purpose. This count alone does not prove an unauthorized grant. |
| Foreign keys referencing PeopleDB users | Fifteen | Current references target the UUID identity. No email-reference FK was found. |
| Users relation including indexes | 264 kB | Supports considering a short maintenance transaction, subject to measured rehearsal. |
| Physical `student_invitations` table | Absent | The pending journal entry has a real unapplied schema effect. |

### Brand projection and grant qualification

| Brand | Brand-local rows | Correct mapped person/platform/external ID | Missing shadow link | Mapped accounts missing own-platform grant |
|---|---|---|---|---|
| SUIA | 46 | 45 | 1 | 0 |
| RTH | 103 | 101 | 2 | 0 |

Among mapped accounts, the inspection found zero missing PeopleDB persons, wrong-platform links, external-ID mismatches or inactive/deleted mapped persons. No non-null PeopleDB external identity pointed to an absent brand-local account in these snapshots.

PeopleDB also contains 172 undeleted SUIA rows without an external ID. Across all SUIA PeopleDB rows, 171 lack an active own-platform grant. Their overlap and business provenance require owner classification. These counts do not establish that 171 current brand-local learners are broken. The 45 linked SUIA accounts passed the mapping/grant checks. Legacy PeopleDB-only operational accounts must be classified through their existing authority and relationships before any repair or deletion decision.

The SHC super-admin lacks an ordinary own-platform grant. Dedicated SHC authentication uses its own fixed-platform eligibility contract. This observation does not authorize adding a grant or changing SHC authentication.

## CHG-02A and consumer compatibility

The corrected repository uses parameterized normalized email selection, exact platform context when supplied, a bounded two-row ambiguity check and undeleted-account filtering. Registration/login supply the account platform. Legacy administrator login without a selector requires one unambiguous supported business account. Current role, active/deleted state, password and persisted own-platform grant are independently enforced. Login and refresh use the selected account platform.

The service entry point still mounts health, marketing, SSO administration, event consumers and hierarchy routes. It does not mount `createAuthRoutes()`. CHG-02A therefore supplies source-level authentication compatibility without activating a new website path. The existing registration schema accepts requested roles including `admin`; activation requires its own authorization-policy review. Dedicated SHC authentication and CHG-01B learner/person semantics remain separate authorities.

### Outstanding source dependencies

| Dependency | Classification | Smallest proposed action requiring approval |
|---|---|---|
| `packages/db-people/src/seed-skillup.ts` `upsertUser()` | SOURCE CORRECTION REQUIRED | Replace email-only conflict handling with the approved normalized email/platform identity and undeleted predicate. Keep the selected person UUID stable and prevent account-platform reassignment. Test repeated seeds with same-email accounts in both businesses. |
| `apps/skillup-admin/src/app/api/admin/students/route.ts` | SOURCE CORRECTION REQUIRED | Align duplicate prechecks with normalized stored comparison and map actual unique-constraint failure safely under concurrency. |
| `apps/skillup-admin/src/app/api/admin/students/[id]/route.ts` | SOURCE CORRECTION REQUIRED | Normalize approved email updates consistently and handle same-platform conflicts. Preserve UUID ownership and existing business logic. |
| `apps/skillup-admin/src/lib/skillup-admin-data.ts` `getAdminStudentDetail()` | OWNER DECISION REQUIRED | Resolve enquiry associations through an existing authoritative UUID relationship, or reject ambiguous association. Current email-only joins and `LIMIT 1` can select an unrelated enquiry. |
| `packages/db-people/src/schema/enquiries.ts` | OWNER DECISION REQUIRED | The current enquiry schema has no platform field. Adding a tenant predicate to that table is unsupported. Evaluate existing admission/enquiry IDs before proposing schema changes. |
| `packages/identity-bridge/src/UserIdentityBridgeService.ts` | SOURCE CORRECTION REQUIRED | Atomic PeopleDB projection/grant handling, deterministic external-key conflict recovery, normalized writes and revocation-safe behavior. |
| Signup/login bridge consumers | SOURCE CORRECTION REQUIRED | Verify existing shadow mappings and resume interrupted linking using stable platform/external identity. Report actual recovery state truthfully. |
| PeopleDB-backed invitation matching | READY, bounded source evidence | Existing token/UUID/platform selection avoids email-only person selection. Future physical qualification depends on the pending invitation migration decision. |
| Brand-admin admission lookup | READY, bounded source evidence | Existing fixed `skillup`, normalized email, active/undeleted predicates and exactly-one-row requirement match the target selection rule. Synthetic duplicate-account proof remains pending. |
| API-server brand email repositories | DATA CHECK REQUIRED for their own contracts | They select distinct brand databases or legacy MainDB. PeopleDB uniqueness changes do not establish MainDB exam compatibility. CHG-04/05 remain separately gated. |

The installed Drizzle `PgInsertOnConflictDoUpdateConfig` accepts column targets, while the target email key contains an expression. Merely changing the seed to `[users.email, users.platform]` would fail to match the proposed expression index. A narrowly parameterized SQL upsert through the existing database client can express `ON CONFLICT (lower(trim(email)), platform) WHERE deleted_at IS NULL`. It requires source approval and compiled SQL tests. An unsafe type cast would hide the mismatch.

Normalization must use the agreed trim/lower convention across creation, updates and lookup. PostgreSQL default `trim()` and JavaScript `trim()` differ for some whitespace, and Unicode case behavior depends on accepted input and collation. Existing utility comments mention ASCII while its basic validation does not itself enforce that policy. Include whitespace/Unicode cases in the proposed tests and obtain a policy decision before narrowing any accepted input contract.

## Bridge failure and recovery analysis

The bridge selects PeopleDB users by `(external_id, platform)`, which supports independent brand identities. Its current implementation has these gaps.

1. Projection insertion and grant insertion use separate database operations outside a shared transaction.
2. Two callers can both observe an absent projection. The external-identity index rejects one insertion, and the current method does not recover the loser into a verified existing projection.
3. If the user insertion succeeds and grant insertion fails, a later `syncUser()` follows the existing-user branch, updates email and returns without restoring or verifying the missing grant.
4. `grantPlatformAccess()` finds a matching row without filtering `deleted_at`. A soft-deleted grant is reported as already granted. Its select-then-insert also races the existing unique key.
5. Brand-side `updateShadowUserId()` is unconditional after PeopleDB work. A conflicting existing link can be overwritten, and a failure leaves a cross-database partial completion.
6. Login's nonempty `shadowUserId` fast path bypasses bridge reconciliation. CHG-01B separately validates PeopleDB-backed SUIA operations, so an unresolved projection may fail closed later.
7. Signup emits `identity.bridge.retry_requested` and logs `retryQueued: true`. The event bus is process-local, and the inspected source search found the emission without a corresponding recovery listener. Durable recovery cannot be inferred from that log.

Controlled evaluation of current source produced one success and one rejected call for concurrent same-key creation, a successful repeated sync with zero grant rows after injected grant failure, and a successful grant method return with zero active grants when the matching grant was soft-deleted. These demonstrate control-flow defects through in-memory adapters. Real PostgreSQL concurrency and transaction behavior require separately authorized tests.

### Recommended existing-infrastructure correction

Subject to source approval, use the existing PeopleDB transaction facility for the person projection and its approved initial own-platform grant. Resolve creation conflicts against the existing `(external_id, platform)` index and return the same verified person UUID. Recheck deletion/activity state inside the transaction. Preserve credentials, role ownership, external identity and deliberate revocation semantics.

Handle normalized-email conflicts with another external identity as an explicit identity conflict. Never merge by email. The external-identity index also covers deleted rows, so a deleted projection must fail closed pending its authorized lifecycle decision.

Use the existing grant unique key for insert idempotency and re-read the result. A deleted grant needs explicit revocation-aware denial or an independently authorized restoration. A missing grant on an existing projection cannot always be distinguished from intentional access removal using current state alone. The owner must approve the exact eligibility rule before automatic repair.

After PeopleDB commit, update the brand shadow link conditionally when absent or already equal to the verified UUID. A different non-null link is a conflict requiring investigation. Repeating an interrupted operation should re-resolve `(platform, external_id)` and complete only the missing authorized step. Preserve a valid retained PeopleDB projection after brand-side failure and report partial completion accurately.

This provides deterministic retry through existing callers or an authorized operator. Cross-database atomicity and durable unattended crash recovery remain outside that guarantee. A new queue, table, worker or service is unnecessary for the proposed bounded correction. Automatic guaranteed recovery would require a separate contract decision if existing invocation paths cannot provide it.

## Exact forward-migration design

### Prerequisites

1. Approve, implement and verify the source corrections above. Decide the reporting association and revoked/missing-grant policies. Keep standalone auth activation separate.
2. Classify the three missing brand links and legacy PeopleDB-only accounts. Determine whether bounded repair is necessary for the intended launch scope. Data repairs require separate exact-record authorization.
3. Rehearse backup/restore and the proposed migration against an approved isolated remote database. Capture constraint/index definitions, ledger hashes, source version and aggregate identity baselines. Protect backup data through existing controls.
4. Resolve the earlier pending migration disposition described below. Freeze the exact approved migration list and transaction behavior.
5. Before live execution, obtain DDL approval and an owner-controlled maintenance window. Coordinate existing identity writers, seeds and relevant account update paths. Recheck duplicates, grants, foreign keys, index validity, permissions and normalization at the execution boundary.

### Proposed schema change

Retain PeopleDB `users.id`, its primary key, all UUID foreign keys and the external-identity index. The replacement is the unique partial expression index already declared in source.

```sql
CREATE UNIQUE INDEX uniq_users_email_platform
ON public.users USING btree (lower(trim(email)), platform)
WHERE deleted_at IS NULL;

ALTER TABLE public.users
DROP CONSTRAINT users_email_unique RESTRICT;
```

This two-statement schema change is a design artifact. No migration SQL file was installed or executed. PostgreSQL supports expression and partial unique indexes. The replacement index remains an index because attaching an expression/partial index as an ordinary UNIQUE table constraint is unsupported. [PostgreSQL CREATE INDEX](https://www.postgresql.org/docs/17/sql-createindex.html), [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html)

### Recommended transaction and locking

For the observed 264 kB relation, propose a short, rehearsed maintenance transaction with an explicitly bounded `lock_timeout` and `statement_timeout`. The owner must confirm acceptable interruption based on rehearsal. A plan illustrating the transaction boundary follows.

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
LOCK TABLE public.users IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE deleted_at IS NULL
    GROUP BY lower(trim(email)), platform
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'PeopleDB normalized platform identity conflict';
  END IF;
END
$$;

CREATE UNIQUE INDEX uniq_users_email_platform
ON public.users USING btree (lower(trim(email)), platform)
WHERE deleted_at IS NULL;

ALTER TABLE public.users
DROP CONSTRAINT users_email_unique RESTRICT;

-- Verify the exact index definition and validity, retained UUID references,
-- user counts and the existing external-identity index before commit.
-- The approved migration runner must record this migration in the same
-- transaction using its ordinary ledger mechanism.
COMMIT;
```

When a runner supplies the transaction, the migration body must omit nested `BEGIN`/`COMMIT`. Retain the duplicate preflight under the lock. Preflight must establish the expected old constraint and absent replacement index before this exact path is selected. An already-present index needs definition/validity verification and a separately reviewed resume path. `IF NOT EXISTS` alone does not verify an existing object's definition. A lock timeout or failed assertion aborts the attempt and returns control to the operator.

The access-exclusive lock blocks reads and writes for its lifetime. Long-running transactions may prevent acquisition. Normal index construction also blocks writes. A concurrent build can reduce write blocking but needs a separate staged plan because it runs outside a transaction and may leave an invalid index after failure. The proposed short maintenance path avoids that additional failure state. [PostgreSQL CREATE INDEX](https://www.postgresql.org/docs/17/sql-createindex.html), [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html)

### Migration journal and ordering

All nine live PeopleDB ledger entries for `0000`–`0008` exactly match current local SQL bytes and their journal timestamps. There are zero unmapped live ledger rows in this comparison. These findings apply specifically to PeopleDB.

Journal `0009_student_invitations` is later than the live migration high-water mark, and the table is physically absent. It is an existing offline artifact with its own explicit physical-migration approval gate. Adding a later uniqueness migration and running the full current migration chain can apply that earlier schema change first. This review grants no permission for that effect.

The inspected installed ORM migration reader hashes exact SQL bytes, reads journal timestamps and applies entries newer than the latest recorded timestamp. Its PostgreSQL dialect records migration rows inside the migration transaction. The exact package CLI execution path still needs rehearsal with the approved list. Do not rely on the runner to independently reconcile every historical hash or to infer owner approvals.

Recommended sequence is separate owner disposition of `0009`, then an append-only reviewed uniqueness migration with a new name, timestamp, snapshot and exact SQL hash. If the owner declines `0009`, hold the normal chain and approve a specific deferred-migration strategy before execution. Applying a later high-water timestamp through a filtered folder could silently strand the earlier entry. Deleting/reordering historical journal entries or adding a fake applied row would misrepresent history.

Preserve existing SQL, snapshots and live ledger rows. A successful approved migration receives its normal new ledger entry. On uncertain commit outcome, inspect the replacement index, old constraint and matching new ledger row before deciding whether execution completed. Avoid blind retries or manual history edits.

## Backup, failure handling and recovery

Use a protected, complete PeopleDB backup including SHC credentials/roles, operational dependencies and migration metadata, with a recorded consistent point and a verified restoration into an approved isolated remote database. Rehearse application authentication and identity/grant integrity after restoration. If repairs span brand databases, coordinate their identity-write boundary and backup points separately. An internally consistent dump supports restoration, while cross-database consistency requires an explicit operating procedure. [PostgreSQL SQL Dump](https://www.postgresql.org/docs/17/backup-dump.html)

| Failure point | Required response |
|---|---|
| Lock timeout or duplicate detected before DDL | Abort transaction. Record reason and investigate. |
| Index build or constraint removal fails before commit | Roll back the transaction. Confirm old constraint and ledger state through a new read-only connection. |
| Connection lost around commit | Treat outcome as unknown. Inspect schema and ledger together before retry. |
| Replacement index exists and old constraint also exists after an interrupted staged approach | Global restriction remains. Verify definition/validity and approved state before resuming. |
| Old constraint absent and replacement index missing/invalid | Block identity writes through approved operating controls and obtain corrective approval immediately. This is an unsafe state. |
| New schema committed, application compatibility defect appears | Keep tenant-safe authentication. Quiesce affected identity writes and favor targeted forward repair preserving UUIDs and independent accounts. |
| Request to restore global uniqueness | Count exact email duplicates across every row, including deleted rows. Cross-platform accounts and deleted-email reuse can prevent restoration. Obtain a fresh decision with current evidence. |
| Request to restore backup after new writes | Record the recovery point, account/data changes since backup and explicit loss/forward-replay decision. Preserve new independent identities. A restore is an owner-controlled operation. |

Re-adding `UNIQUE(email)` can be impossible after valid cross-platform same-email accounts or deleted-email reuse. Automatic account merging/deletion is unacceptable. Reverting to pre-CHG-02A email-only authentication would also reintroduce ambiguity. The default post-commit recovery direction is a verified forward correction retaining normalized platform uniqueness.

## Required focused tests

All database-writing scenarios below require separate approval for an isolated remote target and exact synthetic fixture cleanup.

| Area | Required proof |
|---|---|
| Same email, separate brands | Create both accounts with distinct UUIDs and credentials. Each login and refresh retains the selected account platform. Legacy ambiguous admin login fails. |
| Same-platform duplicate | Reject mixed-case/space variants, including concurrent insertion and email update. |
| Inactive and deleted records | Reserve undeleted inactive emails. Permit approved deleted-email reuse and reject conflicting reactivation. |
| SHC preservation | Existing SHC admin login, current eligibility and dedicated audience remain valid. A business account cannot gain SHC authority. |
| Seed compatibility | Repeated seed runs affect the selected fixture account only. The other platform's same-email account remains intact. |
| Reporting association | Same-email people cannot change which authoritative enquiry/admission appears for a selected UUID. Ambiguity produces an honest failure. |
| Bridge concurrency | Concurrent same-key projection calls resolve one stable person UUID and one approved grant without a spurious unique-error escape. Different external identities sharing an email within one platform fail safely. |
| Bridge interruption | Failure between person/grant work rolls back the PeopleDB transaction. Brand-link failure after PeopleDB commit remains visible and can resume conditionally. |
| Grant lifecycle | A revoked grant never becomes restored through ordinary login/retry. Missing-grant repair follows the approved entitlement policy. |
| Missing/conflicting shadow link | Only a verified platform/external mapping can establish the link. A different existing link fails closed. |
| Migration failures | Duplicate preflight, lock timeout, statement failure and lost commit response produce the documented schema/ledger state and recovery path. |
| Backup rehearsal | Restore with retained SHC access, UUID dependencies, grants and exact ledger state. |
| Existing protections | Reuse CHG-02A's 79 controlled tests and R6-A/P0/CHG-01B evidence where source hashes match, then run affected regressions after approved implementation. |

This task performed three controlled bridge behavior probes and fresh read-only database checks. It did not execute the proposed mutation, migration or restore scenarios. Historical controlled test receipts remain tied to their own source snapshots.

## Technical exceptions

The shared-types lint gate still has the CHG-02A-recorded two unused-import errors and nine `any` warnings. Its baseline/current diagnostic comparison is preserved. Separate source cleanup approval is required to close that gate. A clean migration preflight alone cannot promote overall engineering acceptance.

The revised `R6_B_SAFE_IMPLEMENTATION_APPROVAL_PLAN.md` is present locally and remains proposal evidence. Its older shadow-to-learner fallback suggestion is superseded by the later owner-approved CHG-01B contract. Repository tracking and remote presence were unverified under this task's Git restriction.

Backup availability, restore rehearsal, acceptable maintenance duration, future writer readiness, real same-email duplicate behavior, bridge transaction correction and operating authority for unresolved grants are still unverified or undecided.

## Separate owner YES/NO decisions

| Gate | Proposed approval | Current recommendation |
|---|---|---|
| S1 | Implement bounded CHG-03 bridge/caller recovery and truthful status handling using existing transaction and identity facilities. | Approve source/test scope only after choosing missing/revoked-grant semantics. |
| S2 | Correct seed upsert, existing email normalization/prechecks and approved UUID-based reporting association. | Approve separately scoped existing-source work. Review brand-admin paths explicitly. |
| S3 | Resolve the existing shared-types lint exceptions. | Separate bounded source/test cleanup. |
| J1 | Apply existing `0009`, or approve an explicit deferred-migration strategy compatible with the current runner. | Owner decision required before freezing migration order. |
| V1 | Run isolated remote synthetic migration/bridge/concurrency tests and backup/restore rehearsal. | Approve an exact target, fixture scope, cleanup and restore destination independently of live DDL. |
| D1 | Repair identified missing links or grants in current records. | Hold until exact records and entitlement provenance are reviewed. No bulk grant or legacy-account deletion. |
| M1 | Execute the PeopleDB replacement unique-index/constraint migration. | HOLD until S/J/V prerequisites, backup proof and fresh execution preflight pass. |
| A1 | Activate standalone authentication/registration routes. | Separate authorization/security review. Outside this migration task. |

Attendance/payments, Marketing, MainDB ownership migration, automatic QStash continuation, broad UI/performance, Git operations and deployment retain their existing owner gates. This assignment stops at the report and its read-only evidence.
