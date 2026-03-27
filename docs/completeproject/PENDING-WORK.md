# Platform Pending Work — All 3 Brands
> Source of truth: `docs/completeproject/platform_prompt.md` + `docs/AUTH_GUIDELINES.md`
> Cross-referenced: `docs/completeproject/window 3/task.md` (Sprints 1–6 status)
> Window 2/3 docs = reference only. Any conflict → platform_prompt.md wins.
> Last updated: 2026-03-27

---

## Legend
- ❌ Not started
- 🔶 Partially built (scaffold/shell only)
- ✅ Done (confirmed in filesystem + window 3/task.md)
- ⏳ Deferred (deliberate)

---

## ALREADY DONE (per window 3/task.md Sprints 1–6)


# Rule : - Existing UI/UX, Layout , Look and Feel  of RTH should not be altered , addition can be dont. But existing UI/UX to be Locked.
| Item | Completed In |
|---|---|
| Faculty Phase 5 — BFF routes + pages off fallback | Sprint 1 ✅ |
| payment_prod schema (4 tables) + seed + live wiring | Sprint 2 ✅ |
| rth-web subtopic page `[subtopicSlug]/page.tsx` + `[blockType]/page.tsx` | Sprint 3A ✅ |
| realtutorialhub-quiz: onboarding flow improvements | Sprint 3B ✅ |
| realtutorialhub-quiz: profile page `/profile/page.tsx` | Sprint 3C ✅ |
| placement_prod schema (5 tables) + seed | Sprint 4A ✅ |
| Upstash Vector indexes + `PlacementVectorService` (`indexStudentProfile`, `findStudentsForJob`) | Sprint 4B+4C ✅ |
| skillup-web placement BFF wired to real DB | Sprint 4E ✅ |
| packages/auth: shared JWT verification extracted | Sprint 6A ✅ |
| packages/events: 15 typed QStash event types | Sprint 6B ✅ |
| QStash consumers wired to typed events | Sprint 6C ✅ |

---

## BRAND 1 — Real Tutorial Hub (RTH)

> Sprint 3A confirmed in filesystem: `learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx` ✅ exists
> Sprint 3B (onboarding) and 3C (profile) confirmed ✅

### RTH-1: Tutorial Learning Pages (realtutorialhub-web) ✅ DONE (Sprint 3A)

**Current state:** ✅ Subtopic page exists at `[subtopicSlug]/page.tsx` and `[subtopicSlug]/[blockType]/page.tsx`.

> Verify the 6 content block components are wired correctly. If content blocks are not rendering (demo data only), treat as 🔶 and wire to `GET /api/tutorial/content/[subtopicId]`.

```
Existing:  apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/
Missing:   apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/
             └── page.tsx        ← the actual content page
             └── layout.tsx      ← optional: sidebar nav for topic subpages
```

**What the page must do:**
- Server component — fetch data from `GET /api/tutorial/content/[subtopicId]` on api-server
- Read `x-user-id` from header (injected by proxy.ts — do NOT call /auth/me)
- Render 6 content blocks from `content: TutorialContentJSON` JSONB field

**6 content block component names:**
```
TextBlock           → renders markdown via remark/rehype (prose class)
CodeBlock           → syntax highlighted, copy button, language label
DiagramBlock        → Mermaid diagram renderer (client component)
SummaryBlock        → key-points bulleted list
QuizLinkBlock       → CTA card → links to RTH quiz for the subtopic
LiveSessionBlock    → "Request live session" button (replaces VideoBlock — LOCKED)
```

**File:** `apps/realtutorialhub-web/src/components/tutorial/`
- `TextBlock.tsx`
- `CodeBlock.tsx` (use `shiki` — already in monorepo)
- `DiagramBlock.tsx` (client component — `import Mermaid from 'react-mermaid'`)
- `SummaryBlock.tsx`
- `QuizLinkBlock.tsx`
- `LiveSessionBlock.tsx`

**Design rule (platform_prompt.md Phase 2):**
- RTH glassmorphism: `bg-white/70 backdrop-blur-[16px] border border-white/20`
- Font: Inter body, Outfit headings (`font-outfit` class)
- Card radius: `rounded-[2.5rem]` or `rounded-3xl`
- Max width: `max-w-7xl mx-auto px-6`

**Status: ❌ Not started**

---

### RTH-2: HierarchySyncService — Automation Not Wired

**Current state:** Sync exists structurally but admin write routes do NOT call it yet.

**Where to add (Phase 1 — platform_prompt.md):**
```
apps/api-server/src/app/api/admin/domains/route.ts        → after create/update
apps/api-server/src/app/api/admin/subjects/route.ts       → after create/update
apps/api-server/src/app/api/admin/topics/route.ts         → after create/update
apps/api-server/src/app/api/admin/subtopics/route.ts      → after create/update
```

**Call pattern (fire-and-forget — never await):**
```typescript
// After DB write succeeds:
void hierarchySyncService.sync(entityType, id)
// entityType: 'domain' | 'subject' | 'topic' | 'subtopic'
// id: the uuid just created/updated
```

**Service location:** `apps/api-server/src/modules/hierarchy/hierarchy-sync.service.ts`
- Class name: `HierarchySyncService`
- Methods: `sync(entityType, id)`, `bulkSync(entityType)`
- Sets `tutorialSyncStatus = 'synced' | 'failed'` in quiz DB
- On failure: log with Pino, do NOT throw — fire-and-forget

**Bulk re-sync endpoint (Phase 1D):**
```
Location: apps/api-server/src/app/api/admin/hierarchy/sync/route.ts
Method: POST
Auth: INTERNAL_API_KEY header + admin role
Purpose: initial backfill + post-outage recovery
```

**Status: ❌ Not started**

---

### RTH-3: Live Session Request System (Tutorial Engine T1 — Updated Design)

> ⚠️ Video blocks are REMOVED. This replaces them. (PHASE-T1 locked, 2026-03-22)

**What it is:** Student clicks "Request Live Session" on a subtopic → faculty sees requests → accepts + adds meeting link → student notified.

**api-server routes (already built ✅):**
```
apps/api-server/src/app/api/tutorial/faculty/live-sessions/route.ts         ✅
apps/api-server/src/app/api/tutorial/faculty/live-sessions/[id]/route.ts    ✅
apps/api-server/src/app/api/tutorial/faculty/live-sessions/[id]/accept/route.ts ✅
```

**Missing — rth-web UI:**
```
apps/realtutorialhub-web/src/app/(learning)/learn/.../[subtopicSlug]/
  → LiveSessionBlock.tsx component (request button + modal)
  → POST /api/tutorial/live-sessions (student submits request)
```

**Missing — rth-admin UI:**
```
apps/realtutorialhub-admin/src/app/(admin)/tutorial/live-sessions/
  → page.tsx: list pending requests
  → [id]/page.tsx: accept + paste meeting link
```

**DB table (already exists in tutorial_prod):** `live_session_requests`

**Status: 🔶 API routes done, UI not built**

---

### RTH-4: Tutorial Progress Tracking (T2)

**DB table:** `tutorial_progress` — exists in tutorial_prod (UNIQUE index on user_id, subtopic_id already applied ✅)

**Missing — what needs to be built:**

```
api-server route:
  POST /api/tutorial/progress
    Body: { subtopicId: UUID, blockType: 'text'|'code'|'diagram'|'summary'|'quiz_link'|'live_session', status: 'viewed' }
    Reads x-user-id from header
    Upserts into tutorial_progress
    When all 6 blocks viewed → auto-unlocks assignment tier 'simple'

  GET /api/tutorial/progress?subtopicId=UUID
    Returns: { blocksViewed: string[], completionPercent: number, assignmentUnlocked: boolean }
```

**rth-web integration:** Each content block in `[subtopicSlug]/page.tsx` calls `POST /api/tutorial/progress` on mount (Intersection Observer for TextBlock, onCopy for CodeBlock, onRender for DiagramBlock)

**Status: ❌ Not started**

---

### RTH-5: Assignment Engine (T3 — Self-Directed Only)

> ⚠️ No scoring, no pass/fail, no certificates. Self-directed practice only. (PHASE-T3 locked, 2026-03-22)

**DB tables needed (tutorial_prod):**
```sql
assignment_progress (id, user_id, subtopic_id, tier, status: 'started'|'self_completed', created_at)
  UNIQUE (user_id, subtopic_id, tier)

assignment_help_requests (id, user_id, subtopic_id, question_index, doubt_text, status: 'open'|'resolved', created_at)
  INDEX (subtopic_id, status)
```

**Tier unlock sequence (completion-based, not score-based):**
```
simple       → always available after all 6 content blocks viewed
mixed        → unlocks when simple.status = 'self_completed'
intermediate → unlocks when mixed.status = 'self_completed'
expert       → unlocks when intermediate.status = 'self_completed'
```

**api-server routes:**
```
GET  /api/tutorial/assignments?subtopicId=UUID     → list tiers + unlock status for user
POST /api/tutorial/assignments/progress            → mark tier as self_completed
POST /api/tutorial/assignments/help                → submit help request for a question
```

**rth-web page:**
```
apps/realtutorialhub-web/src/app/(learning)/learn/.../[subtopicSlug]/assignments/page.tsx
  → shows 4 tier cards (simple, mixed, intermediate, expert)
  → locked tiers show lock icon
  → each question has "Mark Done" + "Flag for Help" buttons
  → reference answer shown AFTER self-completing (not before)
```

**Status: ❌ Not started**

---

### RTH-6: Project Engine (T4)

**What it is:** Students submit real projects per subtopic. Evaluated by AI (Gemini) or admin. Awards certificates.

**DB tables (tutorial_prod — already partially exist via tutorial_project_submissions):**
```
tutorial_project_submissions (id, user_id, subtopic_id, github_url, description, status, reviewer_notes, created_at)
  INDEX (subtopic_id, status)
```

**api-server routes:**
```
POST /api/tutorial/projects                        → student submits project
GET  /api/tutorial/projects?subtopicId=UUID        → student views own submissions
GET  /api/tutorial/faculty/project-reviews/route.ts ✅ (already built)
POST /api/tutorial/faculty/project-reviews/[id]/approve/route.ts ✅
POST /api/tutorial/faculty/project-reviews/[id]/request-revision/route.ts ✅
```

**Certificate trigger (QStash event):**
```
EventType: 'certificate.issued'
Payload: { userId, subtopicId, projectId, certType: 'project_completion' }
Consumer: apps/api-server/src/consumers/certificate.consumer.ts
```

**Status: 🔶 Faculty review API built, student submission UI missing**

---

### RTH-7: Remediation Engine (T5)

**What it is:** After exam results, weak areas feed into targeted subtopic recommendations.

**Depends on:** `mv_student_weak_areas` materialized view (✅ already built in tutorial_prod)

**Missing:**
```
api-server route:
  GET /api/tutorial/remediation?userId=UUID
    Reads from mv_student_weak_areas
    Returns: [ { subtopicId, subtopicName, weakScore, recommendedTier } ]

rth-web page:
  apps/realtutorialhub-web/src/app/(learning)/learn/remediation/page.tsx
    → "Your weak areas" cards
    → each card links to the subtopic assignments page at correct tier
```

**Status: ❌ Not started**

---

### RTH-8: AI Tutor (T6 — Gemini Integration)

**What it is:** Student asks a question on a subtopic → Gemini answers with context from the subtopic content.

**Implementation location:**
```
apps/api-server/src/app/api/tutorial/ai-tutor/route.ts
  POST body: { subtopicId: UUID, question: string }
  Reads x-user-id from header
  Fetches subtopic content from tutorial_prod
  Sends content + question to Gemini Flash API
  Returns: { answer: string, citations: string[] }
```

**Env var:** `GEMINI_API_KEY` — must be in GCP Secret Manager + .env.local

**rth-web UI:**
```
apps/realtutorialhub-web/src/components/tutorial/AiTutorDrawer.tsx
  → fixed bottom drawer: "Ask AI" button on subtopic page
  → client component: useAiTutor() hook calling POST /api/tutorial/ai-tutor
  → streaming response via ReadableStream
```

**Status: ❌ Not started**

---

### RTH-9: Profile Page (realtutorialhub-quiz) ✅ DONE (Sprint 3C)

**Location:** `apps/realtutorialhub-quiz/src/app/(authenticated)/profile/page.tsx` — confirmed in filesystem.

> Verify: profile page shows real user data from auth store + exam history. If showing demo data, wire `GET /api/reports?limit=5`.

---

### RTH-10: Onboarding Flow Improvements (realtutorialhub-quiz) ✅ DONE (Sprint 3B)

> Verify: onboarding submits without error and `onboarded = true` is set in auth store before redirect to `/dashboard`.

---

## BRAND 2 — SkillUp IT Academy

### SkillUp-1: SMS Backend Service Layer

**Current state:** BFF routes return live `people_prod` data (✅ Sprints 1–4 done). But no formal service abstraction layer (class with methods) — all queries are inline in route files.

**What this means in practice:** Low risk for now. Becomes tech debt at scale.

**When to fix:** Sprint 7 (after all features are verified live)

**Pattern to follow:**
```typescript
// packages/db-people/src/repositories/batch.repository.ts
class BatchRepository {
  findByFacultyId(facultyId: UUID): Promise<Batch[]>
  findWithEnrollments(batchId: UUID): Promise<BatchWithEnrollments>
  updateCapacity(batchId: UUID, delta: number): Promise<void>  // must be atomic via Redis
}

// Referenced in:
// apps/skillup-web/src/app/api/student/my-batch/route.ts
// apps/skillup-admin/src/app/(admin)/batches/...
```

**Status: 🔶 Live data works, service abstraction missing**

---

### SkillUp-2: Batch Capacity Redis Counter

**Documented in Phase 13 but not wired. Critical for concurrent enrollments.**

**Location:** `apps/api-server/src/modules/people/batch-capacity.service.ts`

```typescript
class BatchCapacityService {
  private redisKey = (batchId: string) => `batch:capacity:${batchId}` // TTL: none (permanent)

  async getAvailable(batchId: string): Promise<number>  // HGET
  async reserveSlot(batchId: string): Promise<boolean>  // INCRBY + check against max
  async releaseSlot(batchId: string): Promise<void>     // DECRBY
  async seed(batchId: string, capacity: number, enrolled: number): Promise<void>  // on migration
}
```

**Where it's called:**
```
apps/skillup-admin/src/app/(admin)/batches/[id]/enroll/route.ts
  → reserveSlot() before INSERT into batch_enrollments
  → releaseSlot() on enrollment cancellation
```

**Status: ❌ Not wired**

---

### SkillUp-3: Notification System

**What's missing:** Batch session reminders + payment due alerts.

**Implementation via QStash:**
```
Event: 'session.scheduled'
Consumer: apps/api-server/src/consumers/session-reminder.consumer.ts
  → Queries batch_enrollments for the session's batch
  → Sends email to each enrolled student via Resend API

Event: 'payment.overdue'
Consumer: apps/api-server/src/consumers/payment-overdue.consumer.ts
  → Queries payment_installments WHERE status = 'overdue'
  → Sends reminder to student email
```

**Env var needed:** `RESEND_API_KEY` → add to GCP Secret Manager

**Status: ❌ Not started**

---

### SkillUp-4: Placement_prod — Upstash Vector Integration ✅ DONE (Sprint 4B+4C)

**`PlacementVectorService`** with `indexStudentProfile()` and `findStudentsForJob()` built per Sprint 4.

> Verify: `findMatchingJobs()` is wired into `GET /api/student/placement` BFF. If not wired, add call in `apps/skillup-web/src/app/api/student/placement/route.ts`.

---

### SkillUp-5: Certificate Flow for SkillUp Completions

**What it is:** Student completes a course batch → receives a completion certificate.

**Trigger:** QStash event `'certificate.issued'`
```
Consumer: apps/api-server/src/consumers/certificate.consumer.ts
  → Generates PDF certificate (pdfmake or puppeteer)
  → Uploads to GCS bucket `skillup-certificates`
  → Updates placement profile: certificateUrls[]
  → Sends email with download link via Resend
```

**Status: ❌ Not started**

---

## BRAND 3 — SkillHubCore

> Source: `SKILLHUBCORE-EXECUTION-PLAN.md` (reference only, align to platform_prompt.md Phase 12D)
> Architecture: `services/skillhubcore-service/` (scaffold exists with auth/, user/, hierarchy/ modules)
> DB: `people_prod` — same as SkillUp (shared via platform enum)
> Domain target: `api.skillhubcore.in`

### SHC-1: Foundation — people_prod Schema for SkillHubCore Entities

**Current state:** `packages/db-people` has users, sso_sessions, subscriptions, token_families, platform_access, audit_log. ✅

**Still needed in schema:**
```sql
subscription_plans (id, name, features JSONB, price_monthly, price_yearly, is_active)
subscription_features (id, plan_id, feature_key, limit_value)
user_features_cache (id, user_id, features JSONB, cached_at)  -- invalidate on plan change
```

**File location:** `packages/db-people/src/schema/subscription-plans.ts`

**Status: ❌ Not built**

---

### SHC-2: Auth Core in skillhubcore-service

**Current state:** `services/skillhubcore-service/src/modules/auth/` scaffold exists.

**What must be built:**
```
services/skillhubcore-service/src/modules/auth/
  auth.controller.ts    → Hono/Express routes: POST /auth/register, /auth/login, /auth/logout
  auth.service.ts       → orchestrates password hash, token generation, audit log
  auth.repository.ts    → queries people_prod via db-people Drizzle client

services/skillhubcore-service/src/modules/auth/token/
  token.service.ts      → generateAccessToken(), generateRefreshToken(), verifyToken()
  token.repository.ts   → createRefreshToken(), revokeToken(), findTokenFamily()
```

**JWT structure (different from current api-server JWT):**
```typescript
AccessTokenPayload {
  sub: userId,
  email: string,
  platforms: ('realtutorialhub' | 'skillup')[],  // platform_access table
  roles: string[],
  subscription: {
    plan: string,
    features: string[]  // from user_features_cache
  },
  brand: string,
  iat, exp  // 15 min
}
```

**Key rule (AUTH_GUIDELINES.md):** SkillHubCore issues the JWT. Other services (api-server, tutorial) verify locally via `packages/auth` shared package — NEVER call SkillHubCore to validate tokens.

**Status: 🔶 Scaffold only, no implementation**

---

### SHC-3: Token Rotation + Stolen Token Detection

**Location:** `services/skillhubcore-service/src/modules/auth/token/`

**Pattern:**
```typescript
// token.service.ts
async rotateRefreshToken(oldToken: string): Promise<{ accessToken, refreshToken }> {
  const family = await this.tokenRepo.findTokenFamily(hash(oldToken))
  if (family.isRevoked) {
    // STOLEN TOKEN: revoke ALL tokens in this family
    await this.tokenRepo.revokeFamily(family.id)
    throw new Error('Session compromised')
  }
  await this.tokenRepo.revokeToken(hash(oldToken))
  return this.generateTokenPair(family.userId)
}
```

**DB:** `token_families` table (already in people_prod schema ✅)

**Status: ❌ Not implemented**

---

### SHC-4: SSO / Cross-Platform Access

**What it is:** One user account accessing both RTH and SkillUp with same credentials.

**DB:** `platform_access` table (already in people_prod schema ✅)

**Implementation:**
```
services/skillhubcore-service/src/modules/auth/sso/
  sso.service.ts
    grantPlatformAccess(userId, platform): Promise<void>    → INSERT into platform_access
    revokePlatformAccess(userId, platform): Promise<void>   → UPDATE status = 'revoked'
    getUserPlatforms(userId): Promise<string[]>              → SELECT platforms for JWT

  Called from:
    auth.service.ts → login() includes platforms[] in JWT payload
    POST /admin/users/[id]/platforms → admin grants access
```

**Status: 🔶 DB table exists, service not built**

---

### SHC-5: Subscription Engine

**What it is:** Plans (free/pro/enterprise) gate features across both platforms.

**Implementation:**
```
services/skillhubcore-service/src/modules/subscription/
  subscription.service.ts
    getActivePlan(userId): Promise<SubscriptionPlan>
    getFeatures(userId): Promise<string[]>          → from user_features_cache
    isFeatureEnabled(userId, feature): Promise<boolean>
    onPaymentReceived(payload): Promise<void>       → QStash consumer

  subscription.repository.ts
    findActivePlan(userId): Promise<Subscription>
    updatePlan(userId, planId): Promise<void>
    invalidateFeaturesCache(userId): Promise<void>  → delete from user_features_cache
```

**Feature keys (platform_prompt.md Phase 5):**
```
'exam.unlimited', 'exam.basic', 'tutorial.full_access', 'tutorial.preview_only',
'ai_tutor', 'certificate', 'placement_matching', 'live_sessions'
```

**Status: ❌ Not started**

---

### SHC-6: QStash Event Integration

**Consumers to build in skillhubcore-service:**
```
services/skillhubcore-service/src/consumers/
  payment-received.consumer.ts  → updates subscription on payment.received event
  user-registered.consumer.ts   → sets default features on creation

Publishers:
  user.registered → published on POST /auth/register
  subscription.upgraded → published on plan change
```

**Status: ❌ Not started**

---

### SHC-7: skillhubcore-admin Frontend

**Current state:** `apps/skillhubcore-admin/src/app/` has login + dashboard shell.

**What's missing (all pages):**
```
apps/skillhubcore-admin/src/app/(admin)/
  users/page.tsx              → list all users across both platforms
  users/[id]/page.tsx         → user detail + platform access + subscription
  subscriptions/page.tsx      → plan management
  subscriptions/[id]/page.tsx → plan feature config
  events/page.tsx             → recent QStash event log
  metrics/page.tsx            → MAU, MRR, churn (read from audit_log aggregates)
```

**Design rule:** Must follow RTH glassmorphism — `bg-white/70 backdrop-blur-[16px]`, cyan accent `#0ea5e9`, font-outfit headings

**Status: 🔶 Login + dashboard shell only**

---

### SHC-8: GCP Deployment — skillhubcore-service

**Current state:** `Dockerfile` exists in `services/skillhubcore-service/` ✅

**Missing:**
```
.github/workflows/deploy-skillhubcore.yml
  → on push to main:
    docker build services/skillhubcore-service/
    push to GCP Artifact Registry
    deploy to Cloud Run: asia-south1 (Mumbai), min-instances: 2, SERVICE_NAME=skillhubcore-service

GCP Secret Manager entries needed:
  JWT_SECRET (64-char random)
  JWT_REFRESH_SECRET (64-char, different from JWT_SECRET)
  DATABASE_URL_PEOPLE (pooled — skillhubcore-service connection)
  DATABASE_DIRECT_URL_PEOPLE
  QSTASH_TOKEN
  RESEND_API_KEY

Cloudflare DNS:
  CNAME api.skillhubcore.in → skillhubcore-service.run.app
```

**Status: 🔶 Dockerfile exists, CI/CD + DNS + Secrets not provisioned**

---

## TIER 3 Infrastructure (All Brands)

### Tier 3: exams + audit_log Table Partitioning

**Status: ⏳ Deferred — rehearsal complete, waiting for maintenance window**

**What's ready:**
- Hash partition plan rehearsed on Neon branch ✅
- `tier3-rehearsal-hash.sql` in docs/completeproject/window 3/ ✅
- `tier3-production-checklist-hash.md` ready ✅

**Pre-conditions before executing:**
1. Maintenance window: 2–5 AM IST
2. Neon PITR backup confirmed
3. pnpm test: 1138+ green
4. Team notified

---

## Execution Order Recommendation

```
IMMEDIATE (highest value, unblocks RTH users):
  1. RTH-1: Subtopic page ([subtopicSlug]/page.tsx + 6 block components)
  2. RTH-2: Wire HierarchySyncService into admin write routes
  3. RTH-3: LiveSessionBlock UI in rth-web

SHORT TERM (completes Tutorial Engine T1-T4):
  4. RTH-4: Progress tracking API + UI integration
  5. RTH-5: Assignment Engine (T3) — DB tables + API + rth-web page
  6. RTH-6: Project submission UI (T4 — faculty API already done)
  7. SkillUp-2: Batch capacity Redis counter

MEDIUM TERM (SkillHubCore foundation):
  8. SHC-1: subscription_plans + subscription_features schema
  9. SHC-2: Auth core (token generation, register/login/logout)
  10. SHC-3: Token rotation + stolen token detection
  11. SHC-4: SSO cross-platform access service

MEDIUM TERM (RTH advanced + SkillUp):
  12. RTH-7: Remediation engine (T5)
  13. RTH-8: AI Tutor / Gemini integration (T6)
  14. SkillUp-3: Notification system (Resend + QStash)
  15. SkillUp-4: Upstash Vector service for placement matching

LONG TERM (SkillHubCore completion):
  16. SHC-5: Subscription engine + feature gating
  17. SHC-6: QStash consumers in skillhubcore-service
  18. SHC-7: skillhubcore-admin pages (users, subscriptions, metrics)
  19. SHC-8: GCP deploy + CI/CD + DNS

MAINTENANCE WINDOW (infrastructure):
  20. Tier 3: Hash partition exams + audit_log on prod
```

---

## Architecture Rules — Always Apply

| Rule | Detail |
|---|---|
| Auth guard | proxy.ts only. Never AuthGuard components. Never client-side cookies. |
| Cross-DB | QStash events ONLY. No SQL joins across DBs. |
| faculty-app | Never queries tutorial_prod directly — always via api-server |
| RTH apps | Zero changes at any time (additive only) |
| Cookies | accessToken (student), admin_accessToken (admin) — api-server sets only |
| SkillHubCore JWT | packages/auth verifies locally — other services NEVER call SkillHubCore to validate |
| soft-delete | deleted_at IS NULL on every hot query (after Tier 2) |
| Design | RTH glassmorphism is source of truth. SkillUp = cyan #0ea5e9 swap only. |
