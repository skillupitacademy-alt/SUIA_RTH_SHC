# Tenant-safe tutorial progress alignment

Prepared 11 November 2026 against main f245e11ee5584018a0f751080595192325e74ee6 and the current uncommitted corrections. This document is a migration design for owner review. Database execution remains unapproved. No SQL in this document was executed.

## Verified mismatch and fresh database evidence

The fresh inspection in progress-design-readonly.json used a parameterized configuration, a REPEATABLE READ READ ONLY transaction, a 10-second statement timeout and ROLLBACK. Target fingerprint d69fe9af7c33 matches the previously inspected TutorialDB. The transaction reported read_only=on.

- public.tutorial_progress contains zero rows, including zero retained soft-deleted rows, at this observation.
- tenant_id is absent. Current repository reads and writes already reference it and reject absent/unknown tenant context.
- uq_tutorial_progress_user_subtopic uniquely indexes user_id and subtopic_id. Merely adding a tenant column would still prevent independent per-brand progress for a colliding user/subtopic identity.
- idx_tutorial_progress_user and tutorial_progress_pkey exist. The only observed constraint is the primary key.
- No inbound/outbound foreign keys, dependent views, catalog-linked functions or noninternal triggers were found by the inspection queries. Row-level security is disabled and no policies were present. Preserve existing grants and verify the application roles separately. Catalog dependencies cannot detect every dynamically constructed SQL reference.
- drizzle.__drizzle_migrations exists. Its applied revision/hash history still needs reconciliation against the reviewed migration artifact before execution. The inspection did not assume source journal parity.

These observations are time-bound. The migration must recheck them under lock immediately before DDL. The zero-row observation does not authorize an automatic migration or assumed tenant backfill.

## Existing authority and required target

Retain the existing verified tenant values skillup, realtutorialhub and skillhubcore, matching TutorialProgressRepository.requireTenantCondition. A request body, academic subtopic, shared tutorial distribution marker, hostname alone or email cannot assign historical progress ownership. Tenant scope comes from the verified caller/service authority. The shared content distribution marker is not a progress tenant.

The authoritative progress key is tenant_id, user_id, subtopic_id. Keep id as primary key and preserve the existing meaning of user_id. Do not convert original versus shadow identity as part of this migration. Retain status, blocks_completed, completion timestamps, score, version and soft-deletion history byte-for-byte.

The target tenant column has no default, is non-null, and accepts only the existing three supported identifiers. Composite uniqueness applies to all physically retained rows, preserving current soft-delete uniqueness semantics. This design does not silently introduce a partial index or reclaim a deleted row's identity.

No cross-database user foreign key is proposed. Identity authority spans existing stores, and PostgreSQL cannot enforce a cross-database FK. Preserve authenticated service checks. Do not add speculative curriculum cascades or delete policies.

## Caller and writer reconciliation

The backend tutorial progress route passes the authenticated brand to the tenant-requiring repository. TutorialEngine passes its tenantScope to reads and completions. RTH assignment eligibility now passes the verified realtutorialhub user brand, preserving fail-closed predicates.

A dependency audit found another writer requiring correction before DDL. apps/realtutorialhub-web/src/server/remediation.service.ts directly read and updated tutorial_progress without tenant predicates, inserted rows without tenant_id, and used the old two-column conflict target. The current uncommitted fix adds the application-owned realtutorialhub scope to all its progress reads/updates/inserts and changes its upsert target to tenant/user/subtopic. This is the existing RTH-only service scope and adds no new SHC author permissions. Focused tests inspect real Drizzle predicate SQL and the three-column conflict target with mocked storage.

Do not approve DDL until all writers are accounted for, including parked jobs/imports and old deployments. Retire or update any writer that cannot supply a verified tenant. Never retain a permissive null/default path to keep an unidentified writer working.

## Migration ordering and journaling

The source contains blocked 0029_fnd03_add_tenant_to_progress.sql, which raises an exception, and 0030_event_outbox.sql. The current source journal ends with idx 29/tag 0030_event_outbox. The blocked 0029 file is not an instruction to run SQL manually or change history. Do not remove its guard or rewrite an applied migration.

After owner approval, create a new reviewed migration with the next unused journal identity and matching Drizzle snapshot. A possible tag is 0031_progress_tenant_boundary only if the executor confirms it remains unused. Include the final source SHA, exact SQL hash, previous schema snapshot and intended journal successor in the review package. Resolve any collision with historical proposed scripts before allocating the tag.

Reconcile the actual ledger with the source journal in read-only mode. A generic db:migrate invocation may execute unrelated pending migrations. It is unsuitable until every pending entry is reviewed and authorized. Do not use drizzle-kit push, generate against the existing shared database, or hand-insert a ledger row as a substitute for this reconciliation. The approved executor must apply exactly the reviewed migration and its journal record atomically using the project's proven runner.

Update the Drizzle schema to express tenant not-null and the check constraint in the same approved change. The composite index declarations already exist in source. This design does not modify the schema file or create an executable migration.

## Phase A, approved isolated remote rehearsal

The owner must approve an isolated remote Neon branch/database with synthetic writes and DDL. No local PostgreSQL is required. Prove its connection fingerprint is distinct from the shared target before applying anything. Use least-privilege credentials and record redacted database identity.

Create a recovery point or approved branch of the target schema and verify the recovery procedure in the isolated environment. Record schema/grants/index/constraint definitions and row counts before and after. A backup name alone does not establish restore ability. Do not copy production student records into test output.

Rehearse lock acquisition, timeout, interrupted transaction, uniqueness failures, runner journal rollback and target fingerprint rejection. Measure the lock duration. Run the synthetic qualification matrix below, then obtain approval for the exact shared-target execution window.

## Phase B, atomic empty-table alignment

The empty-table path is selected only after an ACCESS EXCLUSIVE lock and a fresh zero-row check. This prevents a writer from adding an unowned row between observation and column creation. Pause or reject progress writers during the short qualification window. All current readers/writers must be tenant-aware before reopening writes.

The following is illustrative reviewed transaction content, not an authorized command or ready migration file. Final execution must include target checks, schema/index-definition preconditions and the approved runner's atomic journal handling.

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.tutorial_progress IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.tutorial_progress) THEN
    RAISE EXCEPTION 'Progress rows exist; reviewed tenant provenance is required';
  END IF;
END $$;

ALTER TABLE public.tutorial_progress ADD COLUMN tenant_id text;
ALTER TABLE public.tutorial_progress
  ADD CONSTRAINT tutorial_progress_tenant_allowed
  CHECK (tenant_id IN ('skillup', 'realtutorialhub', 'skillhubcore'));
ALTER TABLE public.tutorial_progress ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX idx_tutorial_progress_tenant
  ON public.tutorial_progress (tenant_id);
CREATE UNIQUE INDEX uq_tutorial_progress_tenant_user_subtopic
  ON public.tutorial_progress (tenant_id, user_id, subtopic_id);

-- Execute only after validating the old index definition and the replacement.
DROP INDEX public.uq_tutorial_progress_user_subtopic;
-- The approved runner writes its migration record within the same transaction.
COMMIT;
```

Do not use IF NOT EXISTS to conceal an incompatible partially applied schema. A repeat attempt must either prove the exact migration hash and complete target schema already committed, or fail for investigation. A lock timeout or failed assertion rolls back everything and is retryable only after the blocker is understood. Ordinary transactional indexes are appropriate for the locked empty table. A populated-table concurrent-index strategy would be a separate reviewed plan.

Dropping the old unique index is a required uniqueness-policy transition and needs explicit approval alongside the additive column/index DDL. No table drop, row deletion or unrelated legacy cleanup is included.

## If rows appear, stop the empty-table path

Keep the transaction uncommitted and roll back. Reinspect row counts and authoritative historical provenance. Ownership must be established from immutable session/enrollment/event evidence with verified tenant binding for the same user/resource record. Email matching, tenant defaults, content brand/shared status or a user's current single membership are insufficient historical evidence.

Produce a mapping ledger keyed by immutable progress row ID, with evidence source, tenant and disposition. Detect colliding mappings and multiple plausible tenants. Ambiguous or unmapped rows remain inaccessible to tenant readers pending owner adjudication. Do not duplicate their completion into both brands or assign skillhubcore/shared as a catch-all. Preserve all data in place and prepare a separately approved staged expansion/backfill/constraint-validation plan. The empty-table SQL above must not be repurposed for that case.

## Rollback and recovery

Before commit, PostgreSQL transaction rollback must restore the column/index/constraint and journal state. Prove this with an injected failure in the isolated rehearsal.

After commit but before writes, an inverse change can be considered only after proving no tenant data was created and obtaining approval. Once tenant-aware rows exist, do not drop the tenant column or collapse the composite unique key. Two brands may now legitimately share user/subtopic values and their state cannot be merged safely. Keep tenant-aware code/schema, fail closed and forward-fix. A recovery-point restore must account for every post-migration write and requires an explicit data-preservation decision. There is no instant destructive rollback guarantee.

An old application revision that omits tenant cannot safely write after cutover. Such writers must remain blocked. Do not remove tenant predicates to allow an old revision to start.

## Required synthetic qualification after approval

| Scenario | Expected proof |
| --- | --- |
| Same user/subtopic in SUIA and RTH | Two independent rows under the composite key |
| Missing tenant and shared/unknown tenant | Rejected at repository and database boundaries |
| Cross-tenant read or completion | No foreign-row disclosure or mutation |
| Client-supplied different user/tenant | Verified principal and tenant remain authoritative |
| Concurrent same-tenant creation | One canonical row or bounded retry, no duplicate progress |
| Concurrent block completion | No lost completion, CAS conflict handling verified across independent processes |
| Assignment eligibility | Correct tenant's completion only |
| RTH remediation upsert | Only realtutorialhub rows reset/update, SUIA row retained |
| Repeat request | Existing completion/idempotency semantics preserved |
| Soft-deleted row | Existing retention policy preserved, no accidental duplicate/revival policy change |
| Injected DDL/journal failure | Complete transaction rollback |
| Reload and new login | Durable progress for the same verified tenant identity |
| Wrong target fingerprint | Executor refuses to run |

Repository unit tests and mocked service tests do not qualify PostgreSQL locks, transactional DDL, cross-process races or durable sessions. These checks remain NOT RUN until the isolated database is authorized.

TutorialProgressRepository currently combines a process-local write lock with versioned update CAS. The insert path does not visibly retry a competing process's unique-key violation. The composite unique index prevents duplicate persisted identities, but graceful cross-process create/retry behavior remains an explicit qualification item. Do not promote process-local concurrency tests to PostgreSQL race acceptance.

## Separate navigation-progress issue

tutorial_navigation_progress is a different table/repository with a key based on user_id and navigation_node_id. Its collision/tenant scope risk was previously recorded. This migration does not change that table, learner URLs, snapshots or block publication. Do not claim this alignment alone qualifies every ILS persistence boundary. A separate scoped identity design and evidence review is required for that key.

## Exact owner approval requested for the next phase

Approve the specific isolated remote branch identity, synthetic writes, proposed column/check/not-null/index changes, old unique-index retirement, exact reviewed migration hash/journal successor, rehearsal and recovery tests, and subsequent target execution window separately. Until then, retain progress runtime tasks as blocked by schema alignment. No database execution was performed during this design work.
