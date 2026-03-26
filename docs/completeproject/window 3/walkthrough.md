# SkillUp + RTH Platform - Done / Deferred / Next

> Source of truth: `docs/completeproject/window 3/platform_prompt.md` + `docs/AUTH_GUIDELINES.md`
> Git status: clean. No regressions. No RTH files modified.

---

## DONE

### Architecture
- Confirmed Option B: one Turborepo monorepo + separate DBs + QStash-only cross-service bridge
- `quiz_platform_prod` is the hierarchy master. `tutorial_prod` consumes via `external_id` sync
- Auth source of truth: `api-server` only. No separate SkillUp auth service
- `AUTH_GUIDELINES.md` updated with the SkillUp cookie/token flow
- Tier 3 partitioning is explicitly deferred as a separate infrastructure sprint

### SkillUp Portals
- `skillup-web`: login, register, student dashboard, my-batch, attendance, payments, placement, batches, faculty, programs are implemented
- `skillup-web`: `proxy.ts` guards `/student/*` routes
- `skillup-web`: demo data removed from the portal flows; UI is backed by real BFF/data routes
- `skillup-admin`: login, layout, dashboard, batches, CRM, students, payments, placement, audit are implemented
- `skillup-admin`: live dashboard counts now come from `people_prod`
- `faculty-app`: login, layout, dashboard, sessions, my-batches, assignments are implemented
- `faculty-app`: dashboard, batches, attendance are wired to live `people_prod` data
- `faculty-app`: tutorial-backed faculty surfaces are routed through `api-server`

### Phase 8: Test Credentials

Canonical phase-gate accounts:
- `student@skillupitacademy.com` / `SkillUp@2025`
- `admin@skillupitacademy.com` / `SkillUpAdmin@2025`
- `faculty@skillupitacademy.com` / `Faculty@2025`

Dev fallbacks:
- `skillup_student@test.com` / `SkillUp@2024`
- `skillup_admin@test.com` / `Admin@2024`
- `faculty@test.com` / `Faculty@2024`

### `people_prod` Schema (created)
- `enquiries`, `enquiry_follow_ups`, `admissions`, `faculty`, `faculty_availability`
- `batches`, `batch_sessions`, `batch_enrollments`, `attendance_records`, `demo_sessions`
- Seeded data for the SkillUp portal flows, including batch/session/enrollment/attendance coverage

### Performance Tier 1 (done)
- `idx_users_email_platform` on `users (email, platform)` where `deleted_at IS NULL`
- `idx_sso_sessions_family` on `sso_sessions (jwt_family, revoked_at)`
- `idx_subscriptions_user_active` on `subscriptions (user_id, status)` where `status = 'active'`
- Redis subscription cache: `sub:{userId}` TTL 5 minutes in `packages/auth/src/subscription.cache.ts`

### Performance Tier 2 (done)
- Soft-delete columns on `exams` and `questions`
- Blueprint Redis cache: `blueprint:{id}` TTL 1 hour
- Unique index on `tutorial_progress (user_id, subtopic_id)`
- `mv_student_weak_areas` materialized view in `tutorial_prod`

### Cross-Service Faculty Access
- Faculty dashboard/batches/attendance read from `people_prod`
- Tutorial-backed faculty assignment/help/project/session routes are served via `api-server`
- No direct cross-DB joins from `faculty-app` to `tutorial_prod`

---

## DEFERRED (Deliberate - Not Blocked)

### Tier 3: Table Partitioning
| Item | Reason |
|---|---|
| `exams` `PARTITION BY RANGE (started_at)` | Full PK/FK rebuild across dependent tables. Needs maintenance window + Neon branch rehearsal |
| `audit_logs` `PARTITION BY RANGE (created_at)` | Same class of change. Needs downtime window |

Pre-conditions:
- SkillUp live
- All RTH tests green
- Neon branch rehearsed
- Low-traffic maintenance window available
- PITR backup confirmed

### Future / Larger Structural Work
- Dedicated `skillup-service` backend: documented, not built
- `packages/db-payment`: schema not built yet
- `packages/db-placement`: schema not built yet
- Upstash Vector for placement matching: designed, not built
- Subdomain DNS rollout: infrastructure work, not provisioned

### Optional Tutorial Faculty Expansion
- Additional tutorial faculty surfaces can be added later if new UI routes require them

---

## NEXT (Priority Order)

1. Continue with any remaining SkillUp portal polish or route-level CRUD gaps
2. Add `payment_prod` schema and seed data when payments scope expands
3. Phase 6 RTH additive pages, if requested
4. Tier 3 infrastructure sprint when a maintenance window is available
5. `placement_prod` + Upstash Vector in a future sprint

---

## Architecture Rules (Permanent)
- QStash events are the only cross-service bridge. No SQL joins across DBs.
- `faculty-app` never queries `tutorial_prod` directly.
- RTH apps remain untouched.
- `platform: 'skillup'` is a brand tag in the auth payload, not a separate auth system.
- `accessToken` / `admin_accessToken` cookies are set by `api-server` only.
- Use `deleted_at IS NULL` on hot tables after soft-delete columns exist.
