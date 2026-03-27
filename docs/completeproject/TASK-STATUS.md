# SkillUp + RTH Platform — Final Status

> Worktree: clean | Source of truth: platform_prompt.md + AUTH_GUIDELINES.md

## DONE
- Sprint 1: Faculty Phase 5 (BFF routes, pages off fallback)
- Sprint 2: payment_prod schema + seed + live wiring
- Sprint 3: RTH Phase 6 pending pages
- Sprint 4: placement_prod schema + Upstash Vector + seed + live wiring
- Sprint 6: packages/auth + packages/events (15 typed events)
- Tier 1 performance: login composite index, Redis subscription cache
- Tier 2 performance: soft-delete on exams/questions, blueprint cache, mv_student_weak_areas
- Tier 3 REHEARSAL: hash-partition plan validated on Neon rehearsal branch
  - people_prod: auth_audit_log HASH partition - rehearsal passed
  - quiz_platform_prod: exams HASH partition - rehearsal passed (corrected from RANGE to HASH)

## PENDING - ONE ITEM (prod execution only)

Tier 3 Production Window:
  Status: Blocked by maintenance window requirement (agreed safety rule)
  Rehearsal: COMPLETE and validated
  Blocker: Need 2-5 AM IST low-traffic window + team notification

## Prod Window Checklist (ready to execute when window opens)

PRE-WINDOW (30 min before):
  [ ] pnpm test - confirm 1138+ green
  [ ] Log into Neon - note PITR timestamp
  [ ] Notify team: maintenance window opening

WINDOW - quiz_platform_prod (exams table, ~20 min):
  [ ] Run B2: CREATE TABLE exams_partitioned PARTITION BY HASH (id) - 4 buckets
  [ ] Run B3: INSERT INTO exams_partitioned SELECT * FROM exams - verify row counts match
  [ ] Run B4: DROP all 5 FK constraints (exam_questions, results_by_dimension, report_jobs, idempotency_keys, reports)
  [ ] Run B5: RENAME exams -> exams_old, exams_partitioned -> exams
  [ ] Run B6: Recreate all 5 FK constraints
  [ ] Run B7: Verify - 4 partitions + 5 FKs + PK still = id only

WINDOW - people_prod (auth_audit_log table, ~10 min):
  [ ] Run C1: CREATE TABLE auth_audit_log_partitioned PARTITION BY HASH (id) - 4 buckets
  [ ] Run C2: INSERT + verify row counts match
  [ ] Run C3: RENAME swap
  [ ] Run C4: DROP auth_audit_log_old

POST-WINDOW:
  [ ] pnpm test - must see 1138+ green
  [ ] Manual exam flow: login -> start exam -> submit -> view report
  [ ] git commit -m "infra(tier3): hash-partition exams and auth_audit_log tables"
  [ ] Update this file: Sprint 5 DONE

ROLLBACK (if any step fails):
  [ ] DO NOT hotfix in prod
  [ ] Neon dashboard -> Restore -> select PITR timestamp from before window
  [ ] Schedule next window after root cause fixed on rehearsal branch

## Architecture Rules (Permanent)
- QStash = only cross-service bridge. No SQL joins across DBs.
- faculty-app never queries tutorial_prod directly - always via api-server
- RTH apps: zero changes at any time
- Cookie: accessToken (student), admin_accessToken (admin) - api-server sets only
- deleted_at IS NULL on every hot query after Tier 2 applied
