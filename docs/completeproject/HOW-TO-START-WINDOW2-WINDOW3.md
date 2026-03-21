# HOW TO START — Window 2 + Window 3
## From Zero: Project Creation → Database → Code → Deploy
## Follow this EXACTLY in order

---

# ═══════════════════════════════════════
# PRE-FLIGHT — Do this BEFORE opening any window
# ═══════════════════════════════════════
# Time required: ~30 minutes
# Cost: ₹0

## STEP P-1: Create 4 Neon database accounts

Go to neon.tech — create 4 new accounts with 4 different email addresses.
For EACH account, do these exact steps:

### Account 1 — People DB
1. Sign up: email1@yourdomain.com
2. Create project → Name: "platform-people" → Region: AWS ap-southeast-1 (Singapore)
3. Left menu → Databases → + Create database → Name: "people_prod" → Save
4. Left menu → Databases → + Create database → Name: "people_dev" → Save
5. Left menu → Roles → + Create role → Name: "people_admin" → Save
6. Left menu → Dashboard → Connect button
   → Branch: production → Database: people_prod → Role: people_admin
   → Connection pooling: ON → Copy string → save as DATABASE_URL_PEOPLE
   → Connection pooling: OFF → Copy string → save as DATABASE_DIRECT_URL_PEOPLE

### Account 2 — Tutorial DB
Same steps. Project: "platform-tutorial" | DB: tutorial_prod + tutorial_dev
Role: "tutorial_admin" | Keys: DATABASE_URL_TUTORIAL + DATABASE_DIRECT_URL_TUTORIAL

### Account 3 — Payment DB
Same steps. Project: "platform-payment" | DB: payment_prod + payment_dev
Role: "payment_admin" | Keys: DATABASE_URL_PAYMENT + DATABASE_DIRECT_URL_PAYMENT

### Account 4 — Placement DB
Same steps. Project: "platform-placement" | DB: placement_prod + placement_dev
Role: "placement_admin" | Keys: DATABASE_URL_PLACEMENT + DATABASE_DIRECT_URL_PLACEMENT

---

## STEP P-2: Add all 8 new strings to .env.local

Open: d:\onlinewebsites\quiz-platform\.env.local
Add these lines (replace with actual connection strings from Neon):

DATABASE_URL_PEOPLE=postgresql://people_admin:****@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/people_prod?sslmode=require
DATABASE_DIRECT_URL_PEOPLE=postgresql://people_admin:****@ep-xxx.ap-southeast-1.aws.neon.tech/people_prod?sslmode=require

DATABASE_URL_TUTORIAL=postgresql://tutorial_admin:****@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require
DATABASE_DIRECT_URL_TUTORIAL=postgresql://tutorial_admin:****@ep-xxx.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require

DATABASE_URL_PAYMENT=postgresql://payment_admin:****@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/payment_prod?sslmode=require
DATABASE_DIRECT_URL_PAYMENT=postgresql://payment_admin:****@ep-xxx.ap-southeast-1.aws.neon.tech/payment_prod?sslmode=require

DATABASE_URL_PLACEMENT=postgresql://placement_admin:****@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/placement_prod?sslmode=require
DATABASE_DIRECT_URL_PLACEMENT=postgresql://placement_admin:****@ep-xxx.ap-southeast-1.aws.neon.tech/placement_prod?sslmode=require

---

## STEP P-3: Add secrets to GitHub

GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret

Add these 8 secrets (same values as .env.local):
  DATABASE_URL_PEOPLE
  DATABASE_DIRECT_URL_PEOPLE
  DATABASE_URL_TUTORIAL
  DATABASE_DIRECT_URL_TUTORIAL
  DATABASE_URL_PAYMENT
  DATABASE_DIRECT_URL_PAYMENT
  DATABASE_URL_PLACEMENT
  DATABASE_DIRECT_URL_PLACEMENT

Also generate and add these 2 new secrets:
  JWT_SECRET          → run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  JWT_REFRESH_SECRET  → run same command again (MUST be different value)

---

## STEP P-4: Add secrets to GCP Secret Manager

Open GCP Console → Secret Manager → Create secret for each:
  DATABASE_URL_PEOPLE      → pooled URL only (NOT direct)
  DATABASE_URL_TUTORIAL    → pooled URL only
  DATABASE_URL_PAYMENT     → pooled URL only
  DATABASE_URL_PLACEMENT   → pooled URL only
  JWT_SECRET               → same value as GitHub secret
  JWT_REFRESH_SECRET       → same value as GitHub secret

NOTE: DATABASE_DIRECT_URL_* goes to GitHub only (for migrations).
      Never put direct URLs in GCP Secret Manager.

---

## STEP P-5: Verify existing tests still pass

cd d:\onlinewebsites\quiz-platform
pnpm test

Must show: 1138 passed, 0 failed
If any fail → fix before starting Window 2 or 3

---
---

# ═══════════════════════════════════════
# WINDOW 2 — TUTORIAL ENGINE
# Antigravity Agent 2 — separate chat window
# ═══════════════════════════════════════

## What Window 2 builds:
  packages/db-tutorial     → Tutorial DB schema (16 tables)
  services/tutorial-service → Tutorial backend API (Hono on GCP)
  apps/realtutorialhub-web  → notes.realtutorialhub.com (Next.js 15)
  [later] realtutorialhub-admin gets /tutorial section added

## MD files to upload into Window 2 agent:
  1. TUTORIAL-ENGINE-EXECUTION-PLAN.md   ← PRIMARY: has all 29 prompts
  2. PHASE-T1-T6-TUTORIAL-FOUNDATION.md  ← DB schema + service detail
  3. content-json-schema.md              ← LOCKED content schema
  4. domain_specific_content_generation_framework.md ← Content rules
  5. tutorial-subtopic-page_prompt.md    ← Subtopic page UI spec
  6. GATEWAY-RTH-WEB-EXECUTION-PLAN.md   ← realtutorialhub-web prompts

---

### WINDOW 2 — EXACT START SEQUENCE

#### W2-STEP 1: Open Antigravity Agent 2 (fresh chat)

Paste the Opening Prompt from TUTORIAL-ENGINE-EXECUTION-PLAN.md
(the block that starts with "You are a senior implementation agent...")

---

#### W2-STEP 2: Sprint 0 — Foundation (run BEFORE T1)

Paste this prompt:

```
Execute Window 2 Sprint 0. Create shared foundation packages.

TASK 1 — Create root CLAUDE.md at monorepo root
Content must include:
- Project: 3-platform ecosystem (RealTutorialHub + SkillUp IT Academy + SkillHubCore)
- Two enterprise brands: RealTutorialHub (AI learning) + SkillUp IT Academy (live training)
- Architecture: Option B — one Turborepo monorepo, separate Neon DB per service
- 5 databases: exam-db (exists), people-db, tutorial-db, payment-db, placement-db
- 8 services: api-gateway, skillhubcore, exam, tutorial, student-faculty, payment, notification, placement
- 6 frontend apps: realtutorialhub-web, realtutorialhub-quiz (exists), realtutorialhub-admin (exists),
  skillup-web, skillup-admin, skillhubcore-admin
- Deployment: GCP Cloud Run Mumbai asia-south1
- Event bus: Upstash QStash via packages/events
- Exam Engine: COMPLETE — 1138 tests passing — DO NOT MODIFY
- Window 2 current focus: Tutorial Engine only

TASK 2 — Extract packages/auth from apps/api-server
Move JWT logic into packages/auth/src/
  packages/auth/src/index.ts  → exports: TokenService, AuthService, SecurityService
  packages/auth/src/verify.ts → export async function verifyAccessToken(token) — edge compatible (jose only)
Both api-server and future services import from @platform/auth
Run pnpm test → still 1138+ passing

TASK 3 — Create packages/events
packages/events/src/
  types.ts       → PlatformEvent union type + EventEnvelope<T> interface + 15 event Zod schemas
  publisher.ts   → publishEvent(type, payload, options?) using @upstash/qstash
  consumer.ts    → createQStashHandler(handler) — verifies QStash signature
  consumer-map.ts → EVENT_CONSUMER_MAP (placeholder URLs — fill in as services deploy)

15 event types:
  student.enrolled, student.created, exam.completed, payment.received,
  payment.overdue, tutorial.subtopic_completed, batch.session_completed,
  batch.subtopics_covered, attendance.marked, admission.completed,
  project.submitted, certificate.issued, placement.offer_accepted,
  content.generation_requested, content.approved_and_published

TASK 4 — Create packages/db-tutorial
packages/db-tutorial/src/
  index.ts                    → exports db, schema
  db.ts                       → Drizzle client using DATABASE_URL_TUTORIAL
  schema/
    tutorial-content.ts
    tutorial-assignments.ts
    tutorial-projects.ts
    tutorial-progress.ts
    tutorial-video-links.ts
    badges.ts
    remediation-triggers.ts
    domain-content-config.ts
    content-generation-jobs.ts
    subtopic-flow-progress.ts
drizzle.config.ts             → uses DATABASE_DIRECT_URL_TUTORIAL

TASK 5 — Add to packages/types
packages/types/src/tutorial-content.types.ts
Copy the exact TypeScript interfaces from content-json-schema.md verbatim.
Export: TutorialContentJSON, ContentBlockType, LaymanContent, RealLifeContent,
        TechnicalContent, CodeContent, AITutorContent, NotesContent

After all 5 tasks:
Run: pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
All 1138+ tests must still pass.
Commit: "chore(platform): Sprint 0 — CLAUDE.md, packages/auth, packages/events, packages/db-tutorial"
Report: files changed, test results, any issues.
```

---

#### W2-STEP 3: Phase T1 — Foundation

After Sprint 0 passes, paste the T1-A-01 prompt from TUTORIAL-ENGINE-EXECUTION-PLAN.md

Run tasks in this order:
  T1-A-01 → T1-A-02 → T1-A-03 → T1-A-04 (USER-GATED — review seed data)
  T1-B-01 → T1-B-02 → T1-B-03
  → Run Sprint T1 Deep Audit
  → Commit: "feat(tutorial): T1 foundation — DB schema, repositories"

After T1 Deep Audit passes, verify in Neon console:
  → Open neon.tech → Account 2 (tutorial email)
  → tutorial_prod database → Tables tab
  → Should see: tutorial_content, tutorial_progress, tutorial_project_submissions etc.

---

#### W2-STEP 4: Continue T2 through T8

For each task, paste the corresponding AI PROMPT from TUTORIAL-ENGINE-EXECUTION-PLAN.md.
Follow the dependency chain:

T1 complete →
  T2-A-01 (BlockRenderer) ← USER-GATED
  T2-A-02 (Block navigation)
  T2-A-03 (Content versioning UI)
  T2-B-01 (Block editor) ← USER-GATED
  T2-B-02 (Content API routes)
  → Sprint T2 Deep Audit

T2+T3 complete →
  T4-A-01 (Project assignment rules)
  T4-A-02 (Project submission) ← USER-GATED
  T4-A-03 (Grading scaffold)
  T5-A-01 (VideoBlock) ← USER-GATED
  T5-A-02 (Transcript storage)
  → Sprint T4+T5 Deep Audit

T2+T3 complete →
  T6-A-01 (AI Tutor API + QStash)
  T6-A-02 (AITutorBlock chat UI) ← USER-GATED
  → Sprint T6 Deep Audit

T6+T3 complete →
  T7-A-01 (Exam result webhook)
  T7-A-02 (Re-assessment trigger)
  T7-A-03 (Remediation dashboard) ← USER-GATED

T2 complete →
  T8-A-01 (Content management dashboard) ← USER-GATED
  T8-A-02 (Audit log)
  T8-A-03 (Difficulty settings)

---

#### W2-STEP 5: Build realtutorialhub-web frontend

After T2 complete, switch to GATEWAY-RTH-WEB-EXECUTION-PLAN.md
Paste prompts in order:
  RTH-1-A-01 → Create scaffold
  RTH-1-A-02 → Subtopic learning page ← USER-GATED
  RTH-1-A-03 → AI Tutor chat
  RTH-1-A-04 → GCP deployment

---

#### W2 — VERIFICATION CHECKLIST (before calling Window 2 done)

Run each of these and confirm:
  □ pnpm test → 1138+ passing (no regressions)
  □ pnpm typecheck:all → zero errors
  □ pnpm build:all → all apps build
  □ Open Neon tutorial_prod → all 16 tables visible
  □ GET tutorial-service/healthz → 200
  □ notes.realtutorialhub.com loads subtopic learning page
  □ All 6 content blocks render
  □ AI Tutor responds to a question
  □ Admin can create content and mark as published
  □ exam.completed event creates remediation plan

---
---

# ═══════════════════════════════════════
# WINDOW 3 — SKILLHUBCORE + SKILLUP IT ACADEMY
# Antigravity Agent 3 — separate chat window
# ═══════════════════════════════════════

## What Window 3 builds:
  packages/db-people           → People DB schema (30 tables)
  packages/db-placement        → Placement DB schema (10 tables)
  services/skillhubcore-service → SkillHubCore backend (auth + SSO + subscriptions)
  services/student-faculty-service → SkillUp backend (SMS + FMS + batches)
  services/api-gateway          → Hono on Cloudflare Workers
  apps/skillhubcore-admin       → admin.skillhubcore.in
  apps/skillup-web              → skillupitacademy.com
  apps/skillup-admin            → admin.skillupitacademy.com
  apps/faculty-app              → faculty.skillupitacademy.com

## MD files to upload into Window 3 agent:
  1. SKILLHUBCORE-EXECUTION-PLAN.md   ← SHC phases 1–8
  2. SKILLUP-EXECUTION-PLAN.md        ← SKU phases 1–9
  3. GATEWAY-RTH-WEB-EXECUTION-PLAN.md ← Gateway phases
  4. PHASE-SKILLHUBCORE.md            ← Blueprint detail
  5. PHASE-SMS-ALL-PHASES.md          ← SMS blueprint
  6. PHASE-FMS-ALL-PHASES.md          ← FMS blueprint

---

### WINDOW 3 — EXACT START SEQUENCE

#### W3-STEP 1: Open Antigravity Agent 3 (fresh chat)

Paste the Opening Prompt from SKILLHUBCORE-EXECUTION-PLAN.md

---

#### W3-STEP 2: Phase SHC-1 — People DB + Service Scaffold

Paste prompt SHC-1-A-01:
```
[paste SHC-1-A-01 prompt from SKILLHUBCORE-EXECUTION-PLAN.md]
Create packages/db-people with all 6 SkillHubCore tables.
Run migrations against DATABASE_DIRECT_URL_PEOPLE.
Verify in Neon console: users, platform_access, subscriptions,
sso_sessions, refresh_token_families, auth_audit_log all created.
```

Then paste SHC-1-A-02 to create the skillhubcore-service scaffold.

After both pass:
  □ pnpm typecheck:all → zero errors
  □ Open Neon Account 1 (people email) → people_prod → 6 tables visible
  Commit: "chore(skillhubcore): SHC-1 — People DB + service scaffold"

---

#### W3-STEP 3: Phase SHC-2 — Auth Core

In order:
  SHC-2-A-01 → TokenService (JWT sign/verify)
  SHC-2-A-02 → PasswordService (bcrypt)
  SHC-2-A-03 → AuthService.register + login ← USER-GATED (review the logic)
  SHC-2-A-04 → Auth API routes

After SHC-2-A-04 passes, do a manual test:
  Start service locally: pnpm --filter @platform/skillhubcore-service dev
  curl -X POST http://localhost:8080/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"password123","fullName":"Test User","platform":"realtutorialhub"}'
  → Should return { accessToken, refreshToken, user }
  → Open Neon people_prod → users table → should show 1 row

  Commit: "feat(skillhubcore): SHC-2 — auth register, login, JWT"

---

#### W3-STEP 4: Phase SHC-3 — Token Rotation

Paste SHC-3-A-01 prompt.
Test stolen token detection:
  1. Login → get refreshToken
  2. POST /auth/refresh → get new refreshToken
  3. POST /auth/refresh with OLD refreshToken again
  → Should revoke ALL sessions for this user

  Commit: "feat(skillhubcore): SHC-3 — token rotation + stolen token detection"

---

#### W3-STEP 5: Phase SHC-4 — SSO

Paste SHC-4-A-01 prompt.
Test cross-platform access:
  Register with platform: 'realtutorialhub'
  → JWT platforms: ['realtutorialhub']
  Login again with platform: 'skillup'
  → JWT platforms: ['realtutorialhub', 'skillup']

  Commit: "feat(skillhubcore): SHC-4 — SSO cross-platform access"

---

#### W3-STEP 6: Phase SHC-5 — Subscription Engine

Paste SHC-5-A-01 prompt.
Test feature gating:
  Free user → GET /subscriptions/check-feature?feature=exam → { allowed: false }
  Upgrade to notes_exam → same request → { allowed: true }

  Commit: "feat(skillhubcore): SHC-5 — subscription engine + feature gating"

---

#### W3-STEP 7: Phase SHC-6 — Event Integration

Paste SHC-6-A-01 prompt.
This wires payment.received → subscription upgrade.
Test: simulate a payment.received QStash event → subscription upgrades.

  Commit: "feat(skillhubcore): SHC-6 — event integration"

---

#### W3-STEP 8: Phase SHC-7 — skillhubcore-admin app

Paste SHC-7-A-01 prompt.
USER-GATED: Review each admin page visually in browser.

  Commit: "feat(skillhubcore): SHC-7 — admin app"

---

#### W3-STEP 9: Deploy SkillHubCore to GCP

Paste SHC-8-A-01 prompt.
After deploy:
  □ GET https://api.skillhubcore.in/healthz → 200
  □ POST /auth/register works on production
  □ admin.skillhubcore.in loads

  Commit: "feat(skillhubcore): SHC-8 — GCP deployment, min 2 instances"

---

#### W3-STEP 10: Add Student tables to People DB (SKU-1)

Start a fresh session. Paste Opening Prompt from SKILLUP-EXECUTION-PLAN.md.
Paste SKU-1-A-01 prompt to add student tables to packages/db-people.
Run migration → verify in Neon people_prod: students, enrollments, attendance_records etc.
Paste SKU-1-A-02 to create StudentRepository + StudentService.

  Commit: "feat(skillup): SKU-1 — student DB tables + StudentService"

---

#### W3-STEP 11: CRM + Admissions (SKU-2)

Paste SKU-2-A-01 prompt.
After completion, test enquiry flow:
  curl -X POST http://localhost:8081/enquiries \
    -d '{"fullName":"John","email":"john@test.com","phone":"9999999999","source":"website"}'
  → Saved to enquiries table

  Commit: "feat(skillup): SKU-2 — CRM + admissions"

---

#### W3-STEP 12: Batch + Attendance (SKU-3)

Paste SKU-3-A-01 prompt.
Verify: batch creation, student enrollment, session scheduling all work.

  Commit: "feat(skillup): SKU-3 — batches + attendance"

---

#### W3-STEP 13: Faculty Core (SKU-4) ← USER-GATED

Paste SKU-4-A-01 prompt.
Review faculty lifecycle transitions carefully before approving.

  Commit: "feat(skillup): SKU-4 — faculty management"

---

#### W3-STEP 14: Faculty Execution (SKU-5)

Paste SKU-5-A-01 prompt.
This is the critical integration — faculty records subtopics → tutorial-service marks class-assisted.
Verify the batch.subtopics_covered event reaches tutorial-service.

  Commit: "feat(skillup): SKU-5 — faculty session execution"

---

#### W3-STEP 15: Payment + Fees (SKU-6)

Paste SKU-6-A-01 prompt.
Test installment overdue → access suspension flow.

  Commit: "feat(skillup): SKU-6 — payment + fee management"

---

#### W3-STEP 16: Placement System (SKU-7)

Paste SKU-7-A-01 prompt.
Creates packages/db-placement (new package, separate Neon DB).
Run migration → verify placement_prod tables in Neon Account 4.

  Commit: "feat(skillup): SKU-7 — placement system"

---

#### W3-STEP 17: Build all 4 SkillUp frontend apps (SKU-8)

These can be done in parallel (one per chat session if desired):

Session A: Paste SKU-8-A-01 → skillup-web ← USER-GATED
Session B: Paste SKU-8-A-02 → skillup-admin ← USER-GATED
Session C: Paste SKU-8-A-03 → faculty-app ← USER-GATED
Session D (after SKU-7): build placement-app separately

After each, open in browser and visually verify the pages load correctly.

  Commits: "feat(skillup): SKU-8-A/B/C — skillup-web, skillup-admin, faculty-app"

---

#### W3-STEP 18: Integration + Certification (SKU-9) ← USER-GATED

Paste SKU-9-A-01 prompt.
This wires everything together: attendance + exam + project + fees → certificate.

Test full flow:
  1. Create student → assign to batch
  2. Mark ≥75% attendance
  3. Student scores ≥70% on domain exam
  4. Tutorial project approved
  5. All installments paid
  → Certificate issued automatically

  Commit: "feat(skillup): SKU-9 — certification flow"

---

#### W3-STEP 19: API Gateway (GW-1)

Paste GW-1-A-01 → scaffold
Paste GW-1-A-02 → full gateway implementation
Paste GW-1-A-03 → deploy + DNS

CRITICAL ORDER for DNS update:
  1. Deploy gateway to Cloudflare Workers first
  2. Test on workers.dev URL
  3. ONLY THEN update Cloudflare DNS
  4. Monitor for 30 minutes after DNS change

  Commit: "feat(infra): GW-1 — API gateway deployed"

---

#### W3 — VERIFICATION CHECKLIST (before calling Window 3 done)

  □ pnpm test → 1138+ passing
  □ pnpm typecheck:all → zero errors
  □ pnpm build:all → all apps build
  □ Open Neon people_prod → 30 tables visible
  □ Open Neon placement_prod → 10 tables visible
  □ POST /auth/register → returns JWT with platforms[] + subscription.features[]
  □ JWT verified by exam-service WITHOUT calling SkillHubCore API
  □ Stolen token → all sessions revoked
  □ skillupitacademy.com loads
  □ admin.skillupitacademy.com loads
  □ faculty.skillupitacademy.com loads
  □ admin.skillhubcore.in loads
  □ SkillUp student can access notes.realtutorialhub.com (cross-platform JWT)
  □ Enquiry → Admission → Enrolled flow complete
  □ Faculty marks attendance → WhatsApp sent to absent student
  □ Certificate issued when all 4 conditions met
  □ GET https://api.realtutorialhub.com/healthz → 200 (gateway)
  □ Rate limit: 101st request → 429

---
---

# ═══════════════════════════════════════
# RUNNING ALL 3 WINDOWS IN PARALLEL
# ═══════════════════════════════════════

## Week-by-week parallel schedule

WEEK 1-2:
  Window 1: k6 Chunk 7 (T130+T131) — no code changes, just test scripts
  Window 2: Sprint 0 + T1 (DB tables + repositories)
  Window 3: SHC-1 + SHC-2 (People DB + Auth Core)
  All 3 fully independent — no shared work

WEEK 3-4:
  Window 1: k6 Chunk 8 + Phase 4 Chunk 1
  Window 2: T2 + T3 (BlockRenderer + Subtopic Engine)
  Window 3: SHC-3 + SHC-4 + SHC-5 (Token rotation + SSO + Subscriptions)

WEEK 5-6:
  Window 1: Phase 4 Chunks 2-3
  Window 2: T4 + T5 (Projects + Video)
  Window 3: SHC-6 + SHC-7 + SHC-8 (Events + Admin app + GCP deploy)
  NOTE: Window 3 SHC-8 deploys SkillHubCore — Window 2 T6 AI Tutor can now use SSO

WEEK 7-8:
  Window 1: Phase 4 Chunks 4-5
  Window 2: T6 + T7 + T8 (AI Tutor + Remediation + Admin)
  Window 3: SKU-1 through SKU-4 (Student + CRM + Batch + Faculty DB)

WEEK 9-10:
  Window 1: Phase 4 Chunks 6-7
  Window 2: RTH-1-A-01 to RTH-1-A-04 (realtutorialhub-web frontend + GCP deploy)
  Window 3: SKU-5 through SKU-7 (Faculty execution + Payment + Placement)

WEEK 11-12:
  Window 1: Phase 4 Chunks 8-9 (DONE — Phase 4 complete)
  Window 2: DONE — Tutorial Engine live
  Window 3: SKU-8 (4 frontend apps) + SKU-9 (certification) + GW-1 (gateway)

WEEK 13:
  Window 1: Done
  Window 2: Done
  Window 3: Done
  All 3 platforms live. Full ecosystem operational.

---

## The ONLY 2 cross-window dependencies

1. Window 3 SHC-8 (SkillHubCore deployed on GCP) should complete
   BEFORE Window 2 T6-A-01 (AI Tutor) is wired to production.
   → Why: AI Tutor checks subscription.features via SkillHubCore
   → Workaround: T6 can be built with a local mock — wire real SSO later

2. Window 3 GW-1-A-03 (API Gateway DNS) should complete
   BEFORE Window 2 RTH-1-A-04 (realtutorialhub-web production DNS).
   → Why: notes.realtutorialhub.com traffic must go through gateway
   → Workaround: deploy RTH-web to GCP first, update DNS after gateway is live

All other tasks across all 3 windows are fully independent.

---

## One command to verify health of all 3 windows daily

Run this every morning before starting:

pnpm lint:all; pnpm typecheck:all; pnpm test; pnpm build:all

All must pass before any new work starts that day.
If anything fails — fix it first, do not proceed.
