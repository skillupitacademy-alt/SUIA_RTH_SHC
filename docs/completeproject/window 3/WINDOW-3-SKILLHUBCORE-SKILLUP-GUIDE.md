# WINDOW 3 — SKILLHUBCORE + REALTUTORIALHUB + SKILLUP IT ACADEMY
## Complete Guide for Antigravity Agent 3
## From first session to production deployment

---

## STEP 1 — Upload these 4 files BEFORE pasting the prompt

| # | File | Folder |
|---|---|---|
| 1 | `FAANG-COMPLIANCE-WINDOW2-WINDOW3.md` | outputs |
| 2 | `ADR-CRITICAL-001-integration-architecture.md` | uploads |
| 3 | `SKILLHUBCORE-EXECUTION-PLAN.md` | outputs |
| 4 | `PHASE-SKILLHUBCORE.md` | uploads |

---

## STEP 2 — Paste this opening prompt (every new session)

```
You are a senior full-stack engineer working on a 3-platform EdTech ecosystem
at d:\onlinewebsites\quiz-platform

Read all 4 uploaded files completely before writing a single line of code.

═══ YOUR IDENTITY ═══
Window 3 — SkillHubCore + RealTutorialHub SSO wiring + SkillUp IT Academy builder.

DO NOT TOUCH: api-server (Exam Engine backend — COMPLETE, 1138 tests)
DO NOT TOUCH: tutorial-service, realtutorialhub-web (Window 2 scope)
PHASE B ONLY wires SSO into existing apps — no new features, no regressions

═══ WHAT YOU ARE BUILDING ═══
Phase A — SkillHubCore (build first):
  services/skillhubcore-service/    → Hono API on GCP Cloud Run, min 2 instances
  packages/db-people/               → Drizzle schema → people-db (Neon)
  apps/skillhubcore-admin/          → Next.js 15 → admin.skillhubcore.in

Phase B — RealTutorialHub SSO wiring (after SHC-4 complete):
  apps/web-app/   → renamed to apps/realtutorialhub-quiz/
    quiz.realtutorialhub.com — replace standalone auth with SkillHubCore JWT
  apps/admin-app/ → renamed to apps/realtutorialhub-admin/
    admin.realtutorialhub.com — replace standalone auth with SkillHubCore roles
  WHY: Both brands share SkillHubCore SSO. RealTutorialHub exam + admin apps
       must accept the cross-platform JWT issued by SkillHubCore.

Phase C — SkillUp IT Academy (after Phase B complete):
  services/student-faculty-service/ → Hono API on GCP Cloud Run
  apps/skillup-web/                 → Next.js 15 → skillupitacademy.com
  apps/skillup-admin/               → Next.js 15 → admin.skillupitacademy.com
  apps/faculty-app/                 → Next.js 15 → faculty.skillupitacademy.com

Phase D — API Gateway (after SkillHubCore deployed):
  services/api-gateway/             → Hono on Cloudflare Workers

═══ ARCHITECTURE ═══
  One Turborepo monorepo + separate Neon DB per service (ADR-CRITICAL-001)
  People DB: DATABASE_URL_PEOPLE (pooled) + DATABASE_DIRECT_URL_PEOPLE (migrations)
  Placement DB: DATABASE_URL_PLACEMENT + DATABASE_DIRECT_URL_PLACEMENT
  Deployment: GCP Cloud Run asia-south1, min 2 instances for skillhubcore-service
  SkillHubCore is auth-critical — it CANNOT cold-start → always-warm

═══ JWT STRUCTURE — NEVER CHANGE ═══
  Every JWT issued by SkillHubCore contains:
    sub: userId  |  email  |  name
    platforms: ['realtutorialhub'] | ['skillup'] | ['realtutorialhub','skillup']
    subscription.features: ['notes','exam','ai_tutor','live_training',...]
    roles: ['student'] | ['faculty'] | ['admin'] | ['super_admin']
    iss: 'skillhubcore.in'  |  exp: iat + 900 (15 min)

  Other services verify JWT LOCALLY with shared JWT_SECRET.
  They NEVER call SkillHubCore to validate — token is self-contained.
  Only /auth/refresh calls SkillHubCore.

═══ SKILLUP USES REALTUTORIALHUB ENGINES ═══
  SkillUp IT Academy does NOT build its own content or exam system.
  SkillUp students → notes.realtutorialhub.com (Tutorial Engine, Window 2)
  SkillUp students → quiz.realtutorialhub.com (Exam Engine, already live)
  Same JWT works on both platforms — SkillHubCore grants access.

═══ FAANG COMPLIANCE — EVERY TASK ═══
  1. Tests alongside code — 90%+ coverage
  2. Repository pattern — IUserRepository → DrizzleUserRepository
  3. Dependency injection — DIContainer, constructor injection, no static methods
  4. DTOs — typed API responses, no raw DB rows
  5. Pino structured logging — correlation IDs, no console.log, no PII in logs
  6. Zod validation — every API input, 400 on failure
  7. Rate limiting — AUTH: 5/min, ADMIN: 30/min, GENERAL: 60/min
  8. QStash idempotency — every worker checks key before processing
  9. Soft deletes — deleted_at on all user/student tables, never hard DELETE
  10. Transactions — multi-step writes in db.transaction()
  11. Circuit breaker — cross-service calls return graceful fallback
  12. Audit trail — every auth action + admin mutation logged

═══ CRITICAL SECURITY ═══
  JWT_SECRET ≠ JWT_REFRESH_SECRET (must be different 64-char strings)
  Stolen token: reused revoked refresh token → revoke ALL user sessions
  10 failed logins → 1hr lockout + Sentry alert
  Never log passwords, tokens, or PII

═══ QUALITY GATE — EVERY COMMIT ═══
  pnpm lint:all → zero errors
  pnpm typecheck:all → zero errors
  pnpm test → 1138+ passing
  pnpm build:all → all apps build

═══ HOW TO EXECUTE TASKS ═══
  Step 1: Find task in SKILLHUBCORE-EXECUTION-PLAN.md (Phase A)
          or SKILLUP-EXECUTION-PLAN.md (Phase B)
  Step 2: Find FAANG additions in FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
  Step 3: Combine → implement feature + compliance together
  Step 4: USER-GATED tasks → stop, wait for approval
  Step 5: Quality gate → commit

═══ START NOW ═══
Execute SHC-1-A-01: Create packages/db-people

Read SHC-1-A-01 from SKILLHUBCORE-EXECUTION-PLAN.md.
Read SHC-1 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Create 6 tables: users, platform_access, subscriptions, sso_sessions,
  refresh_token_families, auth_audit_log

FAANG additions for SHC-1:
  → statement_timeout: 30000 on pool config
  → deleted_at column on users table
  → Export dbReadOnly for analytics queries

Run: pnpm --filter @platform/db-people db:generate
Run: pnpm --filter @platform/db-people db:migrate
Verify in Neon console: people_prod → 6 tables created
Run: pnpm typecheck:all → zero errors
Commit: "chore(skillhubcore): SHC-1-A-01 — packages/db-people with 6 tables"
Stop and report.
```

---

## STEP 3 — Task sequence — Phase A: SkillHubCore

### SHC-1 — People DB + Service Scaffold
Files already uploaded. No extra files needed.
```
Task → SHC-1-A-01 (packages/db-people) then SHC-1-A-02 (service scaffold)
Verify → people_prod: 6 tables visible in Neon console
Commit → "chore(skillhubcore): SHC-1 — People DB + service scaffold"
```

---

### SHC-2 — Auth Core
No new files needed.

```
SHC-1 complete. Now execute SHC-2.
Read SHC-2 prompts from SKILLHUBCORE-EXECUTION-PLAN.md.
Read SHC-2 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Execute in order:
  SHC-2-A-01 → TokenService (JWT sign/verify with jose)
  SHC-2-A-02 → PasswordService (bcrypt, 12 rounds)
  SHC-2-A-03 → AuthService register + login (USER-GATED — show flow before continuing)
  SHC-2-A-04 → Auth API routes

FAANG requirements:
  DI container — DIContainer.register() for all 3 services
  Rate limiting — 5 attempts/min on POST /auth/login
  Unit tests — 90%+ coverage on all 3 services

Manual test after SHC-2-A-04:
  pnpm --filter @platform/skillhubcore-service dev
  POST http://localhost:8080/auth/register → must return JWT with platforms[] + features[]
  Check Neon people_prod → users table → 1 row created

Commit: "feat(skillhubcore): SHC-2 — auth register, login, JWT"
```

---

### SHC-3 — Token Rotation + Stolen Token Detection
No new files needed.

```
SHC-2 complete. Now execute SHC-3.
Read SHC-3-A-01 from SKILLHUBCORE-EXECUTION-PLAN.md.

Implement AuthService.refresh() with stolen token detection:
  → Revoked token reused → revoke ALL user sessions (entire family)
  → Wrap in db.transaction() — old revoke + new insert = atomic

Test the stolen token scenario:
  1. Login → get refreshToken A
  2. Refresh → get refreshToken B (A is now revoked)
  3. Use A again → must revoke ALL sessions + return 440

Commit: "feat(skillhubcore): SHC-3 — token rotation + stolen token detection"
```

---

### SHC-4 — SSO (Cross-Platform Access)
No new files needed.

```
SHC-4 complete gives SkillUp students access to both brands.
Read SHC-4-A-01 from SKILLHUBCORE-EXECUTION-PLAN.md.

Test cross-platform access:
  Register with platform: 'realtutorialhub' → JWT: platforms: ['realtutorialhub']
  Login with platform: 'skillup' → JWT: platforms: ['realtutorialhub','skillup']

After SHC-4: Window 2 can now use real SSO for AI Tutor feature gating.
             Window 3 can now start SkillUp IT Academy (Phase B).

Commit: "feat(skillhubcore): SHC-4 — SSO cross-platform access"
```

---

### SHC-5 — Subscription Engine
No new files needed.

```
SHC-4 complete. Now execute SHC-5.
Read SHC-5-A-01 from SKILLHUBCORE-EXECUTION-PLAN.md.
Read SHC-5 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Cache subscription in Redis: key subscription:{userId} TTL 5 min
hasFeature() checks Redis first, DB second (prevents DB call on every request)
CQRS: reads use dbReadOnly, writes use db primary

Test feature gating:
  Free user → GET /subscriptions/check-feature?feature=exam → { allowed: false }
  Upgrade plan → same request → { allowed: true }

Commit: "feat(skillhubcore): SHC-5 — subscription engine + Redis caching"
```

---

### SHC-6 — Event Integration
**Add to upload list:** `PHASE-INFRA-GATEWAY.md`

```
SHC-5 complete. Now execute SHC-6.
Read SHC-6-A-01 from SKILLHUBCORE-EXECUTION-PLAN.md.

payment.received event → upgrades subscription
student.enrolled event → grants platform access

Commit: "feat(skillhubcore): SHC-6 — payment + enrollment event consumers"
```

---

### SHC-7 — skillhubcore-admin App
No new files needed.

```
SHC-6 complete. Now execute SHC-7.
Read SHC-7-A-01 from SKILLHUBCORE-EXECUTION-PLAN.md.

USER-GATED — show me each admin page before continuing.
Match existing admin-app design exactly — no new design language.
Add Activity Log page (audit trail for auth_audit_log).

Commit: "feat(skillhubcore): SHC-7 — admin app"
```

---

### SHC-8 — GCP Deployment
No new files needed.

```
SHC-7 complete. Now execute SHC-8.
Read SHC-8-A-01 from SKILLHUBCORE-EXECUTION-PLAN.md.

Dockerfile: multi-stage Node.js 20 Alpine
Cloud Run: min 2 instances (auth CANNOT cold-start)
GitHub Actions: deploy-cloudrun.yml
Smoke test: GET https://api.skillhubcore.in/healthz → 200

After deployment verify:
  □ POST /auth/register works on production URL
  □ admin.skillhubcore.in loads
  □ JWT from production verified by exam-service

Commit: "feat(skillhubcore): SHC-8 — GCP deployment, min 2 instances"
SkillHubCore COMPLETE.
```

---

## STEP 4 — Wire SkillHubCore SSO into RealTutorialHub apps (Phase B)

**Why this step exists:** Your existing `web-app` (quiz.realtutorialhub.com) and `admin-app` (admin.realtutorialhub.com) use standalone auth. Now that SkillHubCore is live, both apps must accept the cross-platform JWT so RealTutorialHub and SkillUp students use one identity.

**No new features. No regressions. SSO wiring only.**

**Upload list stays the same as SHC-8.**

```
SkillHubCore is live. Now wire SSO into the 2 existing RealTutorialHub apps.

TASK B-1: Rename + update apps/web-app → apps/realtutorialhub-quiz
  1. Update package.json name: @platform/realtutorialhub-quiz
  2. Replace existing JWT verification middleware with packages/auth verifyAccessToken()
  3. Login page: POST request goes to api.skillhubcore.in/auth/login (not api-server)
  4. On login success: store SkillHubCore JWT in httpOnly cookie
  5. All protected routes: check JWT from SkillHubCore (platforms includes 'realtutorialhub')
  6. Run pnpm test → 1138+ must still pass
  7. Manually verify: student can login + take exam using new SkillHubCore JWT
  IMPORTANT: Exam Engine (api-server) already verifies JWT via packages/auth — no changes needed there

TASK B-2: Rename + update apps/admin-app → apps/realtutorialhub-admin
  1. Update package.json name: @platform/realtutorialhub-admin
  2. Replace existing admin auth with SkillHubCore JWT
  3. Admin login: POST api.skillhubcore.in/auth/login with role check
  4. Protected routes: check JWT roles.includes('admin') or 'super_admin'
  5. Run pnpm test → 1138+ must still pass
  6. Manually verify: admin can login + manage content using new JWT

After both tasks:
  pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
  Commit: "feat(rth): Phase B — wire SkillHubCore SSO into quiz + admin apps"
```

---

## STEP 5 — Switch to SkillUp IT Academy (Phase C)

**Change upload list to:**
| # | File | Folder |
|---|---|---|
| 1 | `FAANG-COMPLIANCE-WINDOW2-WINDOW3.md` | outputs |
| 2 | `ADR-CRITICAL-001-integration-architecture.md` | uploads |
| 3 | `SKILLUP-EXECUTION-PLAN.md` | outputs |
| 4 | `PHASE-SMS-ALL-PHASES.md` | uploads |

```
Phase B complete. SkillHubCore SSO wired into both RealTutorialHub apps.
Now switching to SkillUp IT Academy build.

I am building: student-faculty-service + skillup-web + skillup-admin + faculty-app

Read SKU-1 prompts from SKILLUP-EXECUTION-PLAN.md.
Read SKU-1 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Start with SKU-1-A-01: Add student tables to packages/db-people
  (same Neon people-db — different tables alongside SkillHubCore tables)
```

---

### SKU-1 — Student Core
**Files:** `SKILLUP-EXECUTION-PLAN.md` + `PHASE-SMS-ALL-PHASES.md`

```
Execute SKU-1-A-01 (student tables) then SKU-1-A-02 (StudentRepository + StudentService).

IStudentRepository interface → DrizzleStudentRepository
Cross-service calls (getStudentFullProfile) must use circuit breaker:
  If tutorial-service unavailable → return { tutorialProgress: null }
  Never crash student profile page

Unit tests: 90%+ coverage including mocked cross-service calls
Commit: "feat(skillup): SKU-1 — student DB + StudentService"
```

---

### SKU-2 — CRM + Admissions
**Files:** `SKILLUP-EXECUTION-PLAN.md` + `PHASE-SMS-ALL-PHASES.md`

```
SKU-1 complete. Execute SKU-2.
Read SKU-2-A-01 from SKILLUP-EXECUTION-PLAN.md.

AdmissionSaga pattern: enquiry → qualify → admit → enroll → notify (each step compensable)
Rate limit on enquiry form: 5/hour per IP
Audit trail: every CRM action logged

Test: POST /enquiries → saved to DB → counsellor assigned
Commit: "feat(skillup): SKU-2 — CRM + admissions"
```

---

### SKU-3 — Batches + Attendance
**Files:** `SKILLUP-EXECUTION-PLAN.md` + `PHASE-SMS-ALL-PHASES.md`

```
SKU-2 complete. Execute SKU-3.
Read SKU-3-A-01 from SKILLUP-EXECUTION-PLAN.md.

Materialized view mv_batch_attendance_summary (no live aggregation on dashboard)
Redis atomic counter for batch capacity (prevent overselling seats)
Commit: "feat(skillup): SKU-3 — batches + attendance"
```

---

### SKU-4 — Faculty Core
**Change PHASE file to:** `PHASE-FMS-ALL-PHASES.md`

```
SKU-3 complete. Execute SKU-4.
Read SKU-4-A-01 from SKILLUP-EXECUTION-PLAN.md.

USER-GATED — review faculty lifecycle state machine before proceeding.
FacultyLifecycleStateMachine: valid transitions only, typed errors
Availability conflict: Redis sorted set O(log N) check
Commit: "feat(skillup): SKU-4 — faculty management"
```

---

### SKU-5 — Faculty Session Execution
**Files:** `SKILLUP-EXECUTION-PLAN.md` + `PHASE-FMS-ALL-PHASES.md`

```
SKU-4 complete. Execute SKU-5.
Read SKU-5-A-01 from SKILLUP-EXECUTION-PLAN.md.

batch.subtopics_covered event → tutorial-service marks class-assisted progress
Bulk attendance INSERT: 30 students = 1 DB call (not 30 individual calls)
Commit: "feat(skillup): SKU-5 — faculty session execution"
```

---

### SKU-6 — Payments
**Files:** `SKILLUP-EXECUTION-PLAN.md` + `PHASE-SMS-ALL-PHASES.md`

```
SKU-5 complete. Execute SKU-6.
Read SKU-6-A-01 from SKILLUP-EXECUTION-PLAN.md.

Razorpay webhook idempotency: payment ref checked before recording
Daily CRON: find overdue installments → publish payment.overdue event
Commit: "feat(skillup): SKU-6 — payment + fee management"
```

---

### SKU-7 — Placement System
**Files:** `SKILLUP-EXECUTION-PLAN.md` + `PHASE-TIER4-ALL.md` + `phase-7-vector-prompt.md`

```
SKU-6 complete. Execute SKU-7.
Read SKU-7-A-01 from SKILLUP-EXECUTION-PLAN.md.

packages/db-placement: NEW package (placement-db Neon account)
Vector search for skill matching (Upstash Vector)
Commit: "feat(skillup): SKU-7 — placement system"
```

---

### SKU-8 — 4 Frontend Apps (USER-GATED each)
**Files:** `SKILLUP-EXECUTION-PLAN.md` + `PHASE-SMS-ALL-PHASES.md` + `3-platform-architecture.md`

```
SKU-7 complete. Execute SKU-8 (4 apps — review each before proceeding).

SKU-8-A-01: skillup-web (skillupitacademy.com) — USER-GATED
SKU-8-A-02: skillup-admin (admin.skillupitacademy.com) — USER-GATED
SKU-8-A-03: faculty-app (faculty.skillupitacademy.com) — USER-GATED

For each app:
  Match existing app design exactly — no new design language
  PWA: manifest.json + service worker
  SEO: generateMetadata on public pages
  Accessibility: axe-core zero violations

Commit per app:
  "feat(skillup): SKU-8-A — skillup-web"
  "feat(skillup): SKU-8-B — skillup-admin"
  "feat(skillup): SKU-8-C — faculty-app"
```

---

### SKU-9 — Integration + Certification
**Files:** `SKILLUP-EXECUTION-PLAN.md` + `PHASE-SMS-ALL-PHASES.md` + `PHASE-FMS-ALL-PHASES.md`

```
SKU-8 complete. Execute SKU-9. USER-GATED.
Read SKU-9-A-01 from SKILLUP-EXECUTION-PLAN.md.

4 conditions for certificate (all must be met atomically):
  ≥75% attendance + ≥70% exam score + 1 approved project + no fee dues

Test full flow:
  Student meets all 4 → certificate issued → email + WhatsApp sent

Commit: "feat(skillup): SKU-9 — certification flow"
SkillUp IT Academy COMPLETE.
```

---

## STEP 6 — API Gateway (Phase D)

**Change upload list to:**
| # | File | Folder |
|---|---|---|
| 1 | `FAANG-COMPLIANCE-WINDOW2-WINDOW3.md` | outputs |
| 2 | `GATEWAY-RTH-WEB-EXECUTION-PLAN.md` | outputs |
| 3 | `PHASE-INFRA-GATEWAY.md` | uploads |
| 4 | `PHASE-SKILLHUBCORE.md` | uploads |

```
SkillHubCore and SkillUp are deployed. Now build the API Gateway.
Read GW-1 prompts from GATEWAY-RTH-WEB-EXECUTION-PLAN.md.

GW-1-A-01 → Gateway scaffold + routing table
GW-1-A-02 → Full Hono implementation (copy from PHASE-INFRA-GATEWAY.md exactly)
GW-1-A-03 → Deploy to Cloudflare Workers + DNS update

CRITICAL DNS order:
  1. Deploy to workers.dev URL first
  2. Test /healthz on workers.dev
  3. ONLY THEN update api.realtutorialhub.com DNS
  4. Monitor 30 minutes after DNS change

Commit: "feat(infra): GW-1 — API Gateway on Cloudflare Workers"
```

---

## WINDOW 3 DONE CHECKLIST
### Covers: SkillHubCore + RealTutorialHub SSO + SkillUp IT Academy + Gateway

```
□ pnpm test → 1138+ passing (no regressions)
□ pnpm typecheck:all → zero errors
□ pnpm build:all → all apps build
□ Neon people_prod → 30 tables visible
□ Neon placement_prod → 10 tables visible
□ POST /auth/register → JWT with platforms[] + subscription.features[] + roles[]
□ JWT verified by exam-service without calling SkillHubCore
□ Stolen token → ALL sessions revoked
□ GET /subscriptions/check-feature → free user cannot access 'exam'
□ skillupitacademy.com loads
□ admin.skillupitacademy.com loads
□ faculty.skillupitacademy.com loads
□ admin.skillhubcore.in loads
□ SkillUp student accesses notes.realtutorialhub.com (cross-platform JWT works)
□ Enquiry → admission → enrolled flow complete end-to-end
□ Faculty marks attendance → WhatsApp sent to absent student
□ Certificate issued only when all 4 conditions met
□ GET https://api.realtutorialhub.com/healthz → 200 (Gateway live)
□ quiz.realtutorialhub.com — student login uses SkillHubCore JWT
□ admin.realtutorialhub.com — admin login uses SkillHubCore JWT
□ RealTutorialHub student takes exam using SkillHubCore JWT (end-to-end)
□ Rate limit: 6th login/min → 429
□ GCP Cloud Run: skillhubcore-service has min 2 instances
```

---

## EXTRA FILES — Add only when needed

| When | Add this file |
|---|---|
| SHC-6 event work | `PHASE-INFRA-GATEWAY.md` |
| SKU-4 onwards | `PHASE-FMS-ALL-PHASES.md` (replace PHASE-SMS) |
| SKU-7 placement | `PHASE-TIER4-ALL.md` + `phase-7-vector-prompt.md` |
| SKU-8 frontend apps | `3-platform-architecture.md` |
| SKU-9 certification | `PHASE-SMS-ALL-PHASES.md` + `PHASE-FMS-ALL-PHASES.md` |
| GW-1 gateway | `GATEWAY-RTH-WEB-EXECUTION-PLAN.md` + `PHASE-INFRA-GATEWAY.md` |
| Admin security | `biometric_guard_prompt.md` |

