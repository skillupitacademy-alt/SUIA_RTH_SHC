# Phase F Rollout & Hand‑Off Guide

This note explains how to promote the completed Phase F logging work, keep the roadmap/worklog in sync, and stage the next actions (tests enablement, memoization) without losing track.

## Where the work lives
- **Branch:** `manifesto/phase-f-parent` now contains all Phase F changes (backend Pino + admin/web clientLogger). It was fast‑forward merged from `manifesto/phase-f3-client-logging`.
- **Docs updated:** `docs/governance/ENGINEERING_WORKLOG.md` (batch entries through F3 batch10). Roadmap remains in `docs/governance/MANIFESTO_ROADMAP.md`. Current task snapshots live in `docs/execution/CURRENT_TASK_LOG.md`.

## Promotion plan (keep docs in sync)
1) **Smoke checks (no code changes)**
   - Web exam resume: start exam → answer few → hard refresh → verify answers rehydrate; finish/clear to ensure backup purge.
   - Admin factory/job tracker: stage questions, reload → state persists; start a job and watch polling/cleanup.
   - Reports: load `/reports/[id]` and `/reports/active-report?examId=…` to confirm clientLogger changes didn’t break data fetches.
   - Log results (pass/fail + notes) in `docs/execution/CURRENT_TASK_LOG.md` and append a dated bullet in `ENGINEERING_WORKLOG.md`.

2) **Merge into main**
   - From `main`: `git merge manifesto/phase-f-parent --no-ff`
   - Run gates: `pnpm lint:all && pnpm typecheck:all && pnpm build:all`
   - If clean, deploy to Vercel. Record merge + deployment outcome in `ENGINEERING_WORKLOG.md` and a short note in `CURRENT_TASK_LOG.md`.

3) **Testing enablement (Phase C unskip, separate branch)**
   - Create branch `phase-c-unskip`.
   - Unskip Tier‑1 api-server suites and Playwright smokes; keep data/mocks from testing docs (`docs/testing/*`).
   - Run `pnpm test:all`. Log findings and decide on permanent enablement. Update both worklog and current task log.

4) **Optional memoization/perf pass (after tests)**
   - Branch `phase-e-perf-memo`.
   - Profile hot renders; add `useMemo/useCallback/React.memo` only where metrics justify. No layout/UX changes.
   - Gates: lint/typecheck/build; note perf deltas if measured. Document in worklog and task log.

5) **Observability wiring (optional but recommended)**
   - Hook Pino JSON output to your log drain/APM; add alerts on error-rate spikes.
   - For clientLogger, consider a lightweight error reporter later (not in scope now). Note decisions in both logs.

## What to update in each doc
- **CURRENT_TASK_LOG.md:** chronological steps, commands run, smoke results, blockers.
- **TASK_HISTORY.md:** durable archive of completed tasks/milestones (copy over key checkpoints from CURRENT_TASK_LOG.md when done).
- **ENGINEERING_WORKLOG.md:** append dated “Phase F …” or later phase entries summarizing what changed and outcomes.
- **MANIFESTO_ROADMAP.md:** only update if scope/phasing changes (e.g., if we add a new Phase G or shift memoization timing).

## Guardrails
- Do not touch `SecurityMuzzle` shims (intentional console overrides).
- Keep logging sanitized (no headers/bodies/tokens) and warn/error only in production.
- Use append-only discipline for worklog; avoid overwriting prior notes.
