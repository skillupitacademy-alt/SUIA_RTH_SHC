# Drizzle Migration Policy

## Source of truth

- Active migration chain is defined by:
  - `packages/db/migrations/meta/_journal.json`
  - Corresponding `packages/db/migrations/<tag>.sql`
- DB ledger table: `drizzle.__drizzle_migrations` must match this chain.

## Allowed locations

- Chain SQL: `packages/db/migrations/*.sql` (journal-backed only)
- Manual SQL: `packages/db/migrations/manual/**`

## Operational commands

- Validate chain files:
  - `pnpm --filter @quiz/db db:migrations:check`
- Reconcile ledger metadata (no historical SQL replay):
  - Dry run: `pnpm --filter @quiz/db db:baseline:dry`
  - Apply: `pnpm --filter @quiz/db db:baseline:apply`

## Guardrails

- Do not edit old applied migration SQL files.
- Do not place ad-hoc SQL in `migrations/` root.
- New schema changes must use `drizzle-kit generate` and update journal snapshots normally.
