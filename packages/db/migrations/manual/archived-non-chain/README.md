# Archived Non-Chain SQL

These SQL files are intentionally archived and are **not** part of the active Drizzle chain (`migrations/meta/_journal.json`).

## Why archived

- They were historical/manual SQL artifacts in `migrations/` root.
- Keeping them in root causes migration chain drift and operator confusion.
- Active Drizzle migrations must be journal-backed only.

## Rule

- Only journal-linked migration SQL files are allowed in `migrations/` root.
- Manual/one-off SQL must live under `migrations/manual/`.
- Use `pnpm --filter @quiz/db db:migrations:check` in CI/pre-merge checks.
