# FAANG-GRADE COMPLIANCE MAP
## Window 2 (Tutorial Engine) + Window 3 (SkillHubCore + SkillUp IT Academy)
## Built-in from Day 1 — Not Retrofitted Later

> **Philosophy**: The Exam Engine achieved FAANG-grade quality by retrofitting 165 tasks AFTER building features.
> Tutorial Engine, SkillHubCore, and SkillUp IT Academy will build compliance IN as they go.
> Every sprint in Window 2 and Window 3 must satisfy the corresponding FAANG standard before moving to the next.

> **Use alongside**: HOW-TO-START-WINDOW2-WINDOW3.md (operational steps) + this file (quality standards per step)

---

## HOW TO USE THIS FILE

For every task you execute in Window 2 or Window 3:
1. Find the task in this file
2. Check which FAANG compliance standards apply
3. Add those standards to the AI prompt BEFORE executing
4. Run the compliance checklist BEFORE committing

**Rule**: A task is NOT done until both the feature works AND the compliance box is ticked.

---

# ══════════════════════════════════════
# MASTER OPENING PROMPT — Window 2 + Window 3
# Paste this FIRST in every session
# ══════════════════════════════════════

```
You are an expert Senior Full-Stack Engineer and Architect working on a
3-platform EdTech ecosystem. You are performing FAANG-grade vibe coding.

Project: quiz-platform monorepo (Turborepo + pnpm)
Brands: RealTutorialHub (AI learning) + SkillUp IT Academy (live training)
Platform brain: SkillHubCore (SSO + subscriptions)

FAANG Compliance Rules (non-negotiable on every task):
1. Tests FIRST — Write unit tests alongside every service/function. 90%+ coverage.
2. Repository Pattern — All DB access via Repository classes. No direct DB calls in services.
3. DI Container — All services use dependency injection. No static methods.
4. DTOs — All API boundaries use typed DTO objects. No raw DB types in responses.
5. Structured logging — Pino logger with correlation IDs. No console.log.
6. OpenTelemetry spans — Wrap all critical operations with withSpan().
7. Rate limiting — Every public endpoint protected via packages/auth/rate-limit.
8. QStash idempotency — Every worker has idempotency key check before processing.
9. Zod validation — Every API input validated with Zod schema at the route handler.
10. Error boundaries — Every async operation has typed error handling.
11. Cache headers — All read-only endpoints have appropriate Cache-Control.
12. Accessibility — All UI components follow WCAG 2.1 AA (ARIA, keyboard nav, contrast).

Architecture facts:
  Option B: One Turborepo monorepo + separate DBs per service
  Exam Engine: COMPLETE (1138 tests, 92.6% coverage) — DO NOT MODIFY
  Shared packages: packages/auth, packages/events, packages/types, packages/ui
  Event bus: Upstash QStash via packages/events (15 event types)
  Deployment: GCP Cloud Run Mumbai asia-south1
  Gateway: Hono on Cloudflare Workers

Before every task:
  1. Read the relevant execution plan file for context
  2. Check which FAANG compliance rules apply (see this file)
  3. Implement feature + compliance together
  4. Run: pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
  5. All 1138+ existing tests must stay green

Current focus: [SPECIFY which window and task]
```

---

# ══════════════════════════════════════
# WINDOW 2 — TUTORIAL ENGINE
# FAANG Compliance Per Sprint
# ══════════════════════════════════════

---

## Sprint 0 — Foundation

### W2-Sprint0 FAANG Requirements

**When agent executes Sprint 0 tasks, ADD these to the prompt:**

```
Sprint 0 FAANG compliance additions:

TASK 1 (root CLAUDE.md):
  → Include FAANG compliance rules in CLAUDE.md so ALL future agents know them
  → Include test coverage thresholds: statements 90%, branches 85%, functions 90%
  → Reference: VIBE_CODING_MASTER_PROMPT.md pattern

TASK 2 (packages/auth extraction):
  → After extraction: write unit tests for TokenService, PasswordService
  → Test coverage must be ≥90% on packages/auth
  → Use same mock pattern as existing auth tests (vitest + vi.mock)

TASK 3 (packages/events):
  → Every event schema validated with Zod
  → Every consumer handler has idempotency check
  → Pattern: check Redis key event:{correlationId} before processing
  → If already processed: return 200 (idempotent)

TASK 4 (packages/db-tutorial):
  → Connection uses DATABASE_URL_TUTORIAL (pooled) for runtime
  → Connection uses DATABASE_DIRECT_URL_TUTORIAL for migrations only
  → Export both: db (pooled) and dbDirect (for migrations)
  → Add statement_timeout: 30000 to pool config

TASK 5 (packages/types):
  → All tutorial content types exported as DTOs
  → Never expose internal DB row types in API responses
```

**Sprint 0 Deep Audit (FAANG):**
```
□ CLAUDE.md exists at monorepo root with FAANG rules
□ packages/auth: pnpm test → 90%+ coverage
□ packages/events: every schema has Zod validator
□ packages/db-tutorial: statement_timeout: 30000 set
□ packages/types: TutorialContentJSON exported as DTO
□ pnpm typecheck:all → zero errors
□ All 1138+ existing tests still passing
```

---

## Phase T1 — Tutorial Foundation

### T1-A-01 (tutorial_content table)
**FAANG additions to prompt:**
```
Add to T1-A-01:
  → Add deleted_at column (soft deletes — GAP-G3 compliance)
  → Add version column (INTEGER default 1) for content versioning — GAP-G8
  → Add indexes: idx_tutorial_content_subtopic, idx_tutorial_content_published,
    idx_tutorial_content_deleted (WHERE deleted_at IS NULL partial index)
  → All queries must filter WHERE deleted_at IS NULL
```

### T1-B-01 to T1-B-03 (Repositories)
**FAANG additions to prompt:**
```
Add to all Repository tasks:
  Repository Pattern compliance (matches Exam Engine Task 56+65):
  → class TutorialContentRepository implements ITutorialContentRepository
  → Interface defined in packages/types (DIP — Task 56 equivalent)
  → All methods return DTO types, never raw Drizzle rows
  → Inject db client via constructor (DI — Task 57 equivalent)
  → Wrap all heavy queries with withTimeout() from packages/db-tutorial
    - Read queries: STANDARD_QUERY_TIMEOUT (15s)
    - Report queries: REPORT_QUERY_TIMEOUT (30s)

  Test requirements (Task 3–11 equivalent):
  → 90%+ unit test coverage for every repository
  → Mock the DB client with vi.mock
  → Test: findById, findBySubtopic, create, update, softDelete
  → Test: withTimeout throws on slow queries
```

**T1 Deep Audit (FAANG):**
```
□ All tables have deleted_at column (soft delete ready)
□ All tables have version column (content versioning ready)
□ Repository interfaces defined in packages/types
□ DI: repositories injected, no static methods
□ withTimeout() applied to all DB queries
□ Unit tests: 90%+ coverage on all repositories
□ pnpm test → all pass
```

---

## Phase T2 — Content Blocks

### T2-A-01 (BlockRenderer) — Frontend FAANG
**FAANG additions to prompt:**
```
Add to T2-A-01 (BlockRenderer component):

ACCESSIBILITY (GAP-G1 equivalent — WCAG 2.1 AA):
  → Tab navigation: all 6 content tabs keyboard-accessible (Tab key cycles)
  → Locked tabs: aria-disabled="true" + aria-label="Complete Layman first"
  → Code blocks: role="region", aria-label="Code example in [language]"
  → AI Tutor chat: role="log", aria-live="polite" for new messages
  → All interactive elements: min 48x48px touch target
  → Color contrast: minimum 4.5:1 for all text
  → Focus indicator: 3px outline on all focusable elements

PERFORMANCE (Phase 3 Task 103 equivalent):
  → CodeBlock: dynamic import with next/dynamic (heavy — syntax highlighter)
  → AITutorBlock: dynamic import with next/dynamic
  → NotesBlock: loading skeleton state
  → All 6 blocks: error boundary with fallback UI

TESTING (Task 3–11 equivalent):
  → Unit test each block component with React Testing Library
  → Test: renders with mock content, handles empty content, keyboard nav
  → Test: accessibility with axe-core (zero violations)
```

### T2-B-02 (Content API routes) — Backend FAANG
**FAANG additions to prompt:**
```
Add to T2-B-02 (Content CRUD API):

API STANDARDS (Phase 3 Tasks 99–105 equivalent):
  → GET /api/tutorial/content/[subtopicId]:
    Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600
    ETag: based on content version number
    Returns 304 Not Modified if ETag matches
  → POST /api/tutorial/content (admin write): no-cache, no-store
  → Add X-Request-ID to all responses (correlation ID)
  → API versioning: all routes under /api/v1/tutorial/

VALIDATION (Zod — Task 35 equivalent):
  → All POST/PUT bodies validated with TutorialContentSchema (from content-json-schema.md)
  → Return 400 with field-level errors if validation fails

RATE LIMITING (GAP-G4):
  → Content read: GENERAL tier (60/min per IP)
  → Content write (admin): ADMIN tier (30/min per user)
  → Use packages/auth rate-limit middleware

LOGGING:
  → Every content CRUD operation: structured log with { subtopicId, userId, action, version }
  → Wrap with withSpan('tutorial.content.update') for tracing

AUDIT (GAP-G6 equivalent):
  → Every content update: publish content.generation_requested or content.approved_and_published event
  → Log before/after version number in audit trail
```

**T2 Deep Audit (FAANG):**
```
□ All 6 block components: axe-core zero violations
□ CodeBlock + AITutorBlock: dynamic imports (no blocking render)
□ GET content endpoints: Cache-Control headers present
□ GET content endpoints: ETags implemented
□ All POST bodies: Zod validated
□ Rate limiting: tested with 61 rapid requests → 429
□ All API routes: X-Request-ID in responses
□ Unit tests: 90%+ coverage on content service
□ pnpm test → all pass
```

---

## Phase T3 — Subtopic Engine

### T3-A-02 (Completion gate logic) — FAANG
**FAANG additions:**
```
Add to T3-A-02:
  → Idempotency: POST /api/tutorial/progress/mark-complete
    Check Redis key: progress:{userId}:{subtopicId}:{blockType} before marking
    If exists: return 200 (already marked — idempotent)
    Set Redis key with 24h TTL after marking
  → Wrap completion logic in db.transaction() (Task 95 equivalent)
  → Publish tutorial.subtopic_completed event INSIDE transaction
    → If event publish fails: transaction rolls back (saga pattern)
```

### T3-A-03 (Remediation trigger bridge) — Critical Integration
**FAANG additions:**
```
Add to T3-A-03:
  → This consumes exam.completed QStash event
  → MUST implement idempotency: check idempotency_keys table
    before creating remediation_triggers (same pattern as exam engine)
  → Wrap in db.transaction(): create remediation triggers + publish events
  → Rate: expected 10,000 simultaneous exam completions on exam day
    → remediation worker must handle burst via QStash queue (not direct call)
  → Dead letter queue: if remediation creation fails 3 times → alert admin
  → Add withSpan('tutorial.remediation.create') for tracing
```

**T3 Deep Audit (FAANG):**
```
□ Progress marking is idempotent (repeat calls = 200, no duplicate rows)
□ exam.completed → remediation triggers created correctly
□ Remediation worker: QStash signature verified
□ Dead letter queue: failed jobs after 3 retries → alert
□ db.transaction() wraps all multi-step writes
□ Unit tests: 90%+ on progress service and remediation service
```

---

## Phase T4 — Assignments + Projects

### T4-A-01 (Project assignment rules engine)
**FAANG additions:**
```
Add to T4-A-01:
  → Strategy pattern (Task 59–60 equivalent):
    IAssignmentEvaluator interface
    MCQEvaluator implements IAssignmentEvaluator
    ShortAnswerEvaluator implements IAssignmentEvaluator
    ProjectEvaluator implements IAssignmentEvaluator
    EvaluatorFactory.create(assignmentType): IAssignmentEvaluator
  → Never switch/case on assignment type — use factory

  → State machine (Task 61 equivalent):
    AssignmentStateMachine: pending → submitted → under_review → approved | revision_requested
    Invalid transitions throw AssignmentTransitionError (typed)
```

### T4-A-02 (Project submission flow)
**FAANG additions:**
```
Add to T4-A-02:
  → Async submission (Task 107 equivalent):
    POST /api/tutorial/assignments/submit → validate → enqueue QStash → return 202 Accepted
    Worker /api/workers/review-assignment → processes AI review asynchronously
    Student sees "Under Review" state immediately, not blocked
  → File upload to GCP Storage (not inline) — never store file content in DB
  → Virus scan hook: before storing submission, call ClamAV or similar
```

**T4 Deep Audit (FAANG):**
```
□ Strategy pattern: EvaluatorFactory creates correct evaluator per type
□ State machine: invalid transitions throw typed errors
□ Submission: async (202 Accepted, not blocking)
□ Worker: QStash signature verified + idempotency check
□ File uploads: stored in GCP Storage, not DB
□ Unit tests: 90%+ coverage including strategy pattern tests
```

---

## Phase T5 — Video Integration

### T5-A-01 (VideoBlock)
**FAANG additions:**
```
Add to T5-A-01:
  → Lazy loading: video iframe loaded only when visible (IntersectionObserver)
  → Accessibility: video must have caption track (aria-label, title on iframe)
  → Mobile: 16:9 aspect ratio maintained on all screen sizes
  → Progressive enhancement: show thumbnail + play button if JS disabled
  → Performance: do NOT embed video on initial page load — click to load
```

---

## Phase T6 — AI Tutor

### T6-A-01 (AI Tutor API + QStash)
**FAANG additions:**
```
Add to T6-A-01:
  → Rate limiting (GAP-G4): 10 questions/student/hour via Upstash Ratelimit
    Key: ai-tutor:{userId}:{hour}
    Return 429 with message: "You've used 10 questions this hour. Upgrade for unlimited."
  → Cost protection: max 1000 tokens per response (claude-haiku config)
  → Async pattern: long questions → QStash queue → SSE stream back to client
    (prevents 30s timeout on slow LLM responses)
  → Structured logging: log { userId, subtopicId, questionLength, responseLength, cost_tokens }
  → Feature gating: check subscription.features.includes('ai_tutor') before processing
    → Free users: return 402 Payment Required with upgrade link
```

**T6 Deep Audit (FAANG):**
```
□ Rate limiting: 11th question in 1 hour → 429
□ Feature gating: free user → 402 (not 200)
□ Async: long question → 202 Accepted → SSE stream
□ Cost logging: token counts in structured logs
□ Unit tests: mock LLM responses, test rate limit enforcement
```

---

## Phase T7 — Remediation Engine

### T7-A-01 + T7-A-02 (Full remediation loop)
**FAANG additions:**
```
Add to T7 tasks:
  → Saga pattern (Task 111 equivalent):
    ExamCompletedSaga:
      Step 1: score exam → emit exam.scored
      Step 2: identify weak subtopics → create remediation_triggers
      Step 3: generate study plan → notify student
    If Step 2 fails → compensating action: mark remediation as failed, alert admin
    If Step 3 fails → retry 3 times via QStash, then dead letter

  → Materialized view (Task 113 equivalent):
    mv_student_weak_areas: pre-computed per student per domain
    Refresh trigger: exam.completed event → QStash → refresh view for that student
    Query time: O(1) from materialized view vs O(N) live aggregation
```

**T7 Deep Audit (FAANG):**
```
□ Saga: compensation logic tested (step 2 fails → step 1 rolled back)
□ Materialized view: mv_student_weak_areas created and indexed
□ View refresh: triggered on exam.completed event
□ Student remediation plan: loads from view, not live query
□ Unit tests: saga steps, compensation actions, view refresh
```

---

## Phase T8 — Admin + Content Management

### T8-A-01 (Content management dashboard) — Admin FAANG
**FAANG additions:**
```
Add to T8-A-01:
  Content Versioning (GAP-G8 equivalent):
  → Every content publish creates a version snapshot
  → QuestionVersionService equivalent: TutorialContentVersionService
    createVersion(subtopicId, difficulty, blockType, changedBy)
    getHistory(subtopicId): all versions desc
    rollback(subtopicId, version): restore previous content
  → Admin can see version history per subtopic per block type
  → Version diff view: before/after JSON comparison

  Audit Trail (GAP-G6 equivalent):
  → Every admin content action logged to auth_audit_log (People DB)
    { actor_id, action: 'content.approve', entity_type: 'tutorial_content',
      entity_id: subtopicId, before_data: {version: N}, after_data: {version: N+1} }

  SEO (GAP-G7 — for realtutorialhub-web pages):
  → generateMetadata() on all subtopic pages with unique title + description
  → Title: "{Subtopic Name} — {Topic} | RealTutorialHub"
  → OG image: dynamic og/route.tsx showing domain + subtopic name
  → JSON-LD: LearningResource schema on subtopic pages
```

**T8 Deep Audit (FAANG):**
```
□ Content versioning: every publish creates version snapshot
□ Rollback: previous version restores correctly
□ Audit trail: every admin action logged with before/after
□ SEO: generateMetadata on subtopic pages (unique title/description)
□ JSON-LD: LearningResource schema on subtopic pages
□ Unit tests: versioning service + audit service
```

---

## realtutorialhub-web (RTH-1) — Frontend FAANG

### RTH-1-A-01 (Scaffold) + RTH-1-A-02 (Subtopic page)
**FAANG additions:**
```
Add to RTH-1 frontend tasks:

PWA (GAP-G5 equivalent):
  → Install @serwist/next (PWA)
  → public/manifest.json: name "RealTutorialHub", theme #185FA5, standalone mode
  → Service worker caches: app shell, static assets, tutorial content
  → Offline fallback page: "Learning is paused — you're offline"
  → Install prompt: show "Add to Home Screen" after first subtopic completion

SEO (GAP-G7):
  → robots.ts: block /api/, /(auth)/, /learn/ session pages
  → sitemap.ts: all public pages, all domain/subject/topic landing pages
  → generateMetadata on every public page

ACCESSIBILITY (GAP-G1):
  → Tab navigation on 6 content blocks (left/right arrow keys switch tabs)
  → Timer: role="timer", aria-live="polite"
  → Progress bar: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax
  → All images: alt text required
  → Color contrast audit: all domain theme colors ≥ 4.5:1

i18n (GAP-G2):
  → Install next-intl
  → Support: en (default), hi, ar (RTL), es
  → Extract all hardcoded strings to messages/en.json
  → Locale switcher in header
  → RTL: add dir="rtl" to html for ar locale
```

**RTH-1 Deep Audit (FAANG):**
```
□ Lighthouse mobile score ≥ 90 (Performance, Accessibility, SEO, PWA)
□ axe-core: zero WCAG AA violations on subtopic page
□ PWA: installable (manifest valid, service worker registered)
□ Offline: graceful fallback page shown
□ SEO: sitemap.ts includes all public routes
□ i18n: locale switcher works, hi/ar/es content displays
□ RTL: Arabic layout mirrors correctly
□ pnpm typecheck:all → zero errors
```

---

## Window 2 — k6 Load Tests (equivalent to T130–T134)

**Add to W2 after T8 is complete:**
```
Create tests/load/tutorial-flow.k6.js

Simulates:
  Student browses domains → opens subtopic → reads 3 blocks → asks AI Tutor question → marks complete

Stages:
  Smoke: 10 VUs × 1 min
  Load: 100 VUs × 5 min (typical peak: 1000 students browsing notes simultaneously)
  Stress: 500 VUs × 5 min
  Spike: 1000 VUs × 2 min (exam day — all students review notes before exam)

Thresholds:
  http_req_duration p(95) < 1500ms (content pages — cached)
  http_req_duration p(95) < 3000ms (AI Tutor — LLM latency acceptable)
  http_req_failed < 0.5%

Run from OCI Mumbai VM (same as exam engine k6):
  k6 run --env TARGET_URL=https://tutorial-service-xxx.asia-south1.run.app tests/load/tutorial-flow.k6.js
```

---

# ══════════════════════════════════════
# WINDOW 3 — SKILLHUBCORE + SKILLUP IT ACADEMY
# FAANG Compliance Per Sprint
# ══════════════════════════════════════

---

## SkillHubCore — Phase SHC-1 to SHC-8

### SHC-1 (People DB + Scaffold)
**FAANG additions:**
```
Add to SHC-1:
  → statement_timeout: 30000 on People DB pool config (matches exam engine T34)
  → Add deleted_at to users table (soft deletes — GAP-G3)
  → CRON backup job for people-db (GAP-G3):
    /api/cron/backup-people → exports users, subscriptions, sso_sessions
    Run: daily at 2AM UTC via GCP Cloud Scheduler
    Store: GCP Storage bucket (90-day retention)
  → packages/db-people drizzle.config.ts: uses DATABASE_DIRECT_URL_PEOPLE
  → Export dbReadOnly from packages/db-people for analytics queries (T92 equivalent)
```

### SHC-2 (Auth Core)
**FAANG additions:**
```
Add to SHC-2:
  → DI Container (Task 57 equivalent):
    DIContainer.register('TokenService', TokenService)
    DIContainer.register('PasswordService', PasswordService)
    DIContainer.register('AuthService', AuthService)
    AuthService constructor: (private tokenSvc: TokenService, private passwordSvc: PasswordService)
    No static methods anywhere in auth module

  → Repository Pattern (Task 56 equivalent):
    IUserRepository interface in packages/types
    DrizzleUserRepository implements IUserRepository
    AuthService depends on IUserRepository (not concrete class)
    Testable: mock IUserRepository in unit tests

  → Structured logging (Task 69–72 equivalent):
    Every auth action: logger.info({ action, userId, platform, ip, success })
    PII redaction: never log password, token, or full email
    Correlation ID: X-Request-ID header propagated through all auth calls

  → Test coverage (Task 3 equivalent):
    Unit tests for AuthService: register, login, logout all paths
    Unit tests for TokenService: sign, verify, expired, wrong secret
    Unit tests for PasswordService: hash, verify, wrong password
    Target: ≥90% coverage on all auth modules

  → Rate limiting (GAP-G4 / rate_limiting_prompt.md equivalent):
    POST /auth/login: AUTH tier = 5 attempts/min per IP
    POST /auth/register: 10/hour per IP
    POST /auth/refresh: 30/min per user
    POST /auth/forgot-password: 3/hour per email
    Return: 429 with Retry-After header
    Brute force: 10 failed logins → 1hr lockout + Sentry alert
```

### SHC-3 (Token Rotation)
**FAANG additions:**
```
Add to SHC-3:
  → All token operations wrapped in db.transaction() (Task 95 equivalent):
    refresh(): revoke old session + insert new session = one atomic transaction
    If new session insert fails → old session NOT revoked (prevents lockout)

  → Audit trail (GAP-G6 / admin_audit_trail_prompt.md equivalent):
    auth_audit_log: every login, logout, refresh, token_family_compromised
    Queryable by: actor, action, date range, platform

  → OpenTelemetry (Task 74–75 equivalent):
    withSpan('auth.refresh') wraps token rotation
    withSpan('auth.login') wraps login flow
    Traces visible in GCP Cloud Trace
```

### SHC-5 (Subscription Engine)
**FAANG additions:**
```
Add to SHC-5:
  → Cache subscription in Redis (Task 9 equivalent):
    Key: subscription:{userId} → TTL: 5 minutes
    Invalidate on: plan upgrade, cancellation
    hasFeature() checks Redis first, DB second
    This prevents DB call on EVERY request's feature check

  → CQRS separation (Task 112 equivalent):
    Read: hasFeature(), getCurrentSubscription() → use dbReadOnly
    Write: upgradePlan(), cancelSubscription() → use db (primary)

  → Materialized view for subscription analytics (Task 113 equivalent):
    mv_subscription_stats: count per plan_type, churn rate, MRR
    Refresh: daily via CRON job
```

### SHC-7 (skillhubcore-admin app)
**FAANG additions:**
```
Add to SHC-7:
  → Biometric guard (biometric_guard_prompt.md equivalent):
    Sensitive admin actions (suspend user, change plan) require re-authentication
    Use WebAuthn or TOTP (simpler than full passkey for MVP)

  → Accessibility: all admin tables keyboard-navigable, ARIA labels on all actions
  → Audit Log UI: Activity Log page showing all auth_audit_log entries
    Filters: actor, action, platform, date range
    Expandable rows: before/after data
    CSV export button
```

**SHC Deep Audit (FAANG):**
```
□ DI container: AuthService, TokenService, PasswordService all injectable
□ Repository pattern: IUserRepository interface, mock works in tests
□ Rate limiting: 6th login in 1 min → 429
□ Brute force: 10 failed → 1hr lockout + Sentry alert
□ Token rotation: atomic transaction (old revoked + new issued together)
□ Subscription: cached in Redis (DB not hit on every hasFeature check)
□ Audit trail: every auth action logged with structured data
□ CRON backup: people-db backed up daily
□ Unit tests: ≥90% coverage on all SHC modules
□ pnpm test → all 1138+ pass
```

---

## SkillUp IT Academy — Phase SKU-1 to SKU-9

### SKU-1 (Student Core)
**FAANG additions:**
```
Add to SKU-1:
  → Repository Pattern:
    IStudentRepository → DrizzleStudentRepository
    All student queries through repository, never direct DB in service
  → Soft deletes: students.deleted_at column (GAP-G3)
  → withTimeout: all student queries STANDARD_QUERY_TIMEOUT (15s)
  → DI: StudentService(studentRepo: IStudentRepository)
  → Unit tests: StudentService ≥90% coverage
    Mock IStudentRepository for all service tests

  → Cross-service calls (getStudentFullProfile):
    Use circuit breaker pattern (safe_mode_prompt.md equivalent):
    If tutorial-service unavailable → return { tutorialProgress: null, message: "Progress temporarily unavailable" }
    If exam-service unavailable → return { examResults: null }
    Never let one service failure crash the student profile page
```

### SKU-2 (CRM + Admissions)
**FAANG additions:**
```
Add to SKU-2:
  → Saga pattern (Task 111 equivalent):
    AdmissionSaga:
      Step 1: create enquiry
      Step 2: qualify enquiry → assign counsellor
      Step 3: admission approved → create student record
      Step 4: payment plan created → trigger notification
    Each step has compensating action if it fails
    Implemented via QStash sequential jobs (not direct calls)

  → Rate limiting on enquiry form (GAP-G4):
    POST /enquiries: 5/hour per IP (prevent spam)
    Captcha check before accepting enquiry

  → Audit trail: every CRM action logged
    { actor: counsellor_id, action: 'enquiry.qualified', entity: enquiry_id }
```

### SKU-3 (Batches + Attendance)
**FAANG additions:**
```
Add to SKU-3:
  → Materialized view (Task 113 equivalent):
    mv_batch_attendance_summary: pre-computed per student per batch
    { student_id, batch_id, total_sessions, present, absent, percentage }
    Refresh: after every attendance.marked event (async via QStash)
    Admin dashboard loads from view, not live aggregation

  → Batch capacity check uses Redis (not DB):
    Key: batch:capacity:{batchId} → current enrolled count
    Increment atomically on enroll, decrement on drop
    DB is source of truth — Redis is fast cache
    Prevents overselling batch seats on concurrent enrollments
```

### SKU-4 (Faculty Core)
**FAANG additions:**
```
Add to SKU-4:
  → Repository + DI:
    IFacultyRepository → DrizzleFacultyRepository
    FacultyService(repo: IFacultyRepository)
  → State machine (Task 61 equivalent):
    FacultyLifecycleStateMachine
    Valid transitions only (see PHASE-FMS-ALL-PHASES.md lifecycle)
    FacultyTransitionError for invalid transitions
  → Availability conflict check uses Redis sorted set:
    Key: faculty:availability:{facultyId} → sorted set of booked time slots
    O(log N) conflict check instead of O(N) DB scan
  → Unit tests: ≥90% coverage including state machine transition tests
```

### SKU-5 (Faculty Execution)
**FAANG additions:**
```
Add to SKU-5:
  → batch.subtopics_covered event:
    This event will fire for EVERY session completion
    On exam day (multiple batches): could be 100+ events simultaneously
    → Always go through QStash queue (never direct HTTP call to tutorial-service)
    → QStash handles backpressure automatically
    → Consumer: idempotency check before marking subtopics
    → Dead letter queue: if tutorial-service down → retry 5 times → alert

  → Attendance marking performance:
    Faculty marks 30 students in < 30 seconds (requirement from PHASE-FMS)
    → Bulk INSERT with single transaction (not 30 individual INSERTs)
    → db.insert(attendance).values([...30 records...]) — one DB round trip
    → After bulk insert: single QStash event with all absent studentIds
```

### SKU-6 (Payments)
**FAANG additions:**
```
Add to SKU-6:
  → Idempotency on payment recording (Task 95 equivalent):
    PaymentService.recordPayment(installmentId, paymentData):
      Check idempotency_key: payment:{paymentRef} in DB
      If exists: return existing payment (idempotent)
      If new: record payment + set idempotency key + publish event (in transaction)
    → Razorpay webhook can fire twice for same payment — idempotency prevents duplicate records

  → CRON for overdue detection (Task 96 equivalent):
    Daily 9AM IST: find installments overdue > 14 days → publish payment.overdue
    Batch: process 100 at a time (not all at once — prevents DB lock)
```

### SKU-7 (Placement)
**FAANG additions:**
```
Add to SKU-7:
  → packages/db-placement: statement_timeout: 30000
  → CRON backup: placement-db backed up daily to GCP Storage
  → Soft deletes on all placement tables (deleted_at column)
  → Placement profile search: use Upstash Vector for semantic skill matching
    (phase-7-vector-prompt.md equivalent for placement matching)
    → Student skills embedded and indexed
    → Company job listings embedded and indexed
    → findMatchingStudents(jobId) uses vector similarity search
```

### SKU-8 (Frontend Apps) — FAANG for all 4 apps

**skillup-web FAANG:**
```
Add to SKU-8-A-01 (skillup-web):
  SEO (GAP-G7):
    → generateMetadata on public pages (marketing, programs)
    → sitemap.ts: program pages, landing pages
    → robots.ts: block /api/, /(auth)/, /student/
    → OG image: dynamic for program pages

  PWA (GAP-G5):
    → manifest.json: name "SkillUp IT Academy", theme #0F6E56
    → Offline page: "Your training dashboard is unavailable offline"
    → Service worker: cache app shell

  Accessibility (GAP-G1):
    → All forms: label/input associations
    → Session calendar: keyboard-navigable
    → Attendance view: color not sole indicator (icon + color)
```

**skillup-admin FAANG:**
```
Add to SKU-8-A-02 (skillup-admin):
  → Audit trail UI (GAP-G6 equivalent):
    Activity Log section in admin showing all student lifecycle changes
    CRM action history per enquiry
  → Data export: CSV export for attendance, fee reports, student lists
  → Role-based access: admin vs super_admin vs counsellor views
    (RBAC — Task 46 equivalent using SkillHubCore JWT roles)
```

**faculty-app FAANG:**
```
Add to SKU-8-A-03 (faculty-app):
  → Offline support for attendance marking:
    Faculty may be in classroom with poor internet
    → Cache batch student list in service worker
    → Queue attendance marks locally if offline
    → Sync when back online
  → Performance: attendance list of 30 students renders in < 100ms
    → Virtualized list if batch > 50 students
```

**T9 Deep Audit (FAANG):**
```
□ Certification: all 4 conditions checked atomically in transaction
□ Saga: AdmissionSaga compensation tested
□ Attendance: bulk INSERT (1 DB call for 30 students)
□ Payment: idempotent (duplicate Razorpay webhook = no duplicate record)
□ Placement: vector search for skill matching works
□ skillup-web: Lighthouse mobile ≥ 85
□ All 4 apps: zero axe-core WCAG violations
□ CRON: people-db + placement-db backed up daily
□ pnpm test → all 1138+ pass + new tests added
```

---

## Window 3 — k6 Load Tests (equivalent to T130–T134)

```
Create tests/load/skillhubcore-auth.k6.js
  → Simulates: register → login → refresh → feature check
  → Stages: 50 VUs load, 200 VUs stress, 500 VUs spike (enrollment season)
  → Thresholds: p(95) < 500ms, error rate < 0.1%

Create tests/load/skillup-student.k6.js
  → Simulates: student views batch → checks attendance → views schedule
  → Stages: 100 VUs, 500 VUs (all students checking schedule before class)
  → Thresholds: p(95) < 1000ms

Run from OCI Mumbai VM after deployment to GCP.
```

---

# ══════════════════════════════════════
# 8 STRATEGIC GAPS — Applied to All Services
# ══════════════════════════════════════

| Gap | Exam Engine | Tutorial Engine | SkillHubCore | SkillUp Apps |
|---|---|---|---|---|
| **G1 Accessibility** | ✅ Done | Build into T2-A-01 (BlockRenderer) + RTH-1-A-02 (subtopic page) | N/A (API only) | SKU-8 all 4 apps |
| **G2 i18n** | ✅ Done | Build into RTH-1-A-01 (realtutorialhub-web scaffold) | N/A | SKU-8-A-01 (skillup-web) |
| **G3 Disaster Recovery** | ✅ Done | CRON backup tutorial-db daily | CRON backup people-db daily | CRON backup placement-db daily |
| **G4 Rate Limiting** | ✅ Done | All tutorial-service routes via packages/auth rate-limit | Auth routes tiered (5–30/min) | All student-faculty routes tiered |
| **G5 PWA** | ⏳ Pending | Build into RTH-1-A-01 (realtutorialhub-web) | N/A | SKU-8-A-01 (skillup-web) |
| **G6 Audit Trail** | ✅ Done | Every content CRUD logged | Every auth action logged | Every CRM + lifecycle action logged |
| **G7 SEO** | ⏳ Pending | Build into RTH-1-A-01 + RTH-1-A-02 | N/A | SKU-8-A-01 marketing pages |
| **G8 Content Versioning** | ⏳ Pending | Build into T8-A-01 (content management) | N/A | N/A |

---

# ══════════════════════════════════════
# FAANG COMPLIANCE SCORECARD
# Run this after every sprint
# ══════════════════════════════════════

```
MANDATORY CHECKS (block merge if any fail):
□ pnpm lint:all → zero errors
□ pnpm typecheck:all → zero errors
□ pnpm test → all existing 1138+ tests pass + new tests added
□ pnpm build:all → all apps build
□ Test coverage: new code ≥ 90% statements

ARCHITECTURE CHECKS (review manually):
□ New service: uses DI container (not static methods)
□ New service: depends on interface (not concrete class)
□ New DB access: goes through repository (not direct db.query in service)
□ New API route: has Zod input validation
□ New API route: has rate limiting middleware
□ New API route (read-only): has Cache-Control header
□ New worker: has idempotency check
□ New multi-step write: wrapped in db.transaction()
□ New service method: has structured log statement
□ New critical path: wrapped in withSpan() for tracing

COMPLIANCE CHECKS (per sprint):
□ Accessibility: new UI components pass axe-core (zero violations)
□ Rate limiting: tested with burst requests → 429
□ Audit: admin mutations logged with before/after
□ Soft deletes: DELETE operations use deleted_at = now()
□ Cross-service calls: circuit breaker if downstream unavailable
```

---

# ══════════════════════════════════════
# READING ORDER — How to use all files together
# ══════════════════════════════════════

## For Window 2 sessions:
1. Paste MASTER OPENING PROMPT (top of this file) first
2. Open TUTORIAL-ENGINE-EXECUTION-PLAN.md → find the task prompt
3. Open this file → find the matching sprint section → add FAANG compliance additions
4. Combine both into one prompt → give to your agent
5. After task: run FAANG COMPLIANCE SCORECARD checklist

## For Window 3 sessions:
1. Paste MASTER OPENING PROMPT (top of this file) first
2. Open SKILLHUBCORE-EXECUTION-PLAN.md or SKILLUP-EXECUTION-PLAN.md → find the task prompt
3. Open this file → find the matching sprint section → add FAANG compliance additions
4. Combine both → give to your agent
5. After task: run FAANG COMPLIANCE SCORECARD checklist

## File relationship summary:
  HOW-TO-START-WINDOW2-WINDOW3.md  → WHAT to do and in what order (operational)
  TUTORIAL-ENGINE-EXECUTION-PLAN.md → HOW to build Tutorial Engine (feature prompts)
  SKILLHUBCORE-EXECUTION-PLAN.md   → HOW to build SkillHubCore (feature prompts)
  SKILLUP-EXECUTION-PLAN.md        → HOW to build SkillUp IT Academy (feature prompts)
  GATEWAY-RTH-WEB-EXECUTION-PLAN.md → HOW to build Gateway + RTH-Web (feature prompts)
  THIS FILE                         → WHY each task must meet FAANG standards (compliance)

  PHASE-1-FOUNDATION.md through PHASE-4-HYPERSCALE.md → Reference: the 165 patterns proven in Exam Engine
  GAP-G1-to-G8.md → Reference: the 8 strategic gaps to apply across all services
