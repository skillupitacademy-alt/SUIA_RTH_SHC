# Remote tutorial progress alignment — applied

Date: 12 November 2026. Source baseline: `33c4567618669bd5f43a003c9835587bb48d762e`, with existing uncommitted work preserved.

The owner explicitly approved direct execution on the shared development/UAT Neon database after the read-only empty-table check. This supersedes the earlier isolated-branch-only execution restriction for this specific schema correction. No other database change was authorized or executed.

## Exact operation

Target fingerprint: `d69fe9af7c33`.

SQL: `packages/db-tutorial/src/migrations/manual/20261112_progress_tenant_empty_table.sql`.

SHA-256: `fcdf60fa8b018aaa6a02fd60c1e035492dc9ae50e12e914c66f9fd69935b8e33`.

The guarded runner pins the target fingerprint and SQL hash, acquires ACCESS EXCLUSIVE on `public.tutorial_progress`, verifies the prior columns/indexes/constraints and checks zero rows. Lock timeout is 5 seconds; SQL statement timeout is 30 seconds. Any changed precondition aborts the transaction.

Added `tenant_id text NOT NULL`, without a default, and `tutorial_progress_tenant_allowed`, accepting only `skillup`, `realtutorialhub`, `skillhubcore`. Added the tenant index and unique `(tenant_id,user_id,subtopic_id)` index. Removed only the old unique `(user_id,subtopic_id)` index. Primary key, existing user index, all other columns and grants were preserved. The Drizzle source schema now matches these tenant constraints.

Zero rows existed under the transaction lock. No historical backfill was needed. No progress records were inserted, updated or deleted. No tutorial content, snapshots, navigation-progress table or publication behavior changed.

## Execution evidence

| Command | Exit | Result |
| --- | --- | --- |
| `node .evidence/continuation-20261112/apply-progress-tenant.cjs` | 0 | Applied the exact DDL inside a transaction, verified it, rolled back, then verified restoration of prior schema and ledger. |
| `node .evidence/continuation-20261112/apply-progress-tenant.cjs --apply-approved` | 0 | Repeated rollback rehearsal, reacquired lock, rechecked prior state, applied and committed. Fresh read-only transaction verified resulting schema and zero rows. |
| `pnpm --filter @quiz/db-tutorial type-check` | 0 | TypeScript passed. |
| `pnpm --filter @quiz/db-tutorial exec vitest run src/repositories/__tests__/tutorial-progress.repository.test.ts` | 0 | 12 mocked repository tests passed. |
| `pnpm --filter @quiz/db-tutorial exec vitest run src/repositories/__tests__/batch-08-progress-isolation.test.ts src/repositories/__tests__/foundation-progress-concurrency.test.ts` | 1 | Five older tests fail because their calls omit required tenant context. These results remain visible; no security guard was weakened. |

`progress-tenant-execution.json` contains the before/after catalog evidence, unchanged grants and migration ledger, timestamps, SQL hash and committed result. `progress-design-readonly.json` preserves the pre-change observation. No connection strings or personal account data are included.

## Migration history and remaining qualification

This is an explicitly applied manual maintenance patch. No generic Drizzle migration command was run, no historical migration was rewritten, and no Drizzle ledger row was fabricated. Historical ledger/source drift and unrelated pending migrations remain unresolved. Reconcile them and include this recorded manual patch before a future automatic migration or schema-diff rollout. Do not blindly run `db:migrate` against this database.

The default runner rehearses and rolls back; after successful application its prior-schema checks intentionally reject rerunning against the updated table. Do not bypass those checks.

Actual PostgreSQL transactional DDL and rollback are verified. Constraint definitions and composite index identity are verified in PostgreSQL. Synthetic insert rejection, cross-process concurrency, browser progress persistence and cross-brand session journeys were not executed against this shared database. Passing mocked tests does not qualify those behaviors. Separate isolated-data execution remains pending.

After real progress exists, do not drop the tenant column or restore the old unique key: distinct tenant records may now share a user/subtopic identity. Preserve data and forward-fix. No restore-from-backup drill was performed or claimed.

No Git commit, push, deployment or canonical acceptance-ledger modification was performed.
