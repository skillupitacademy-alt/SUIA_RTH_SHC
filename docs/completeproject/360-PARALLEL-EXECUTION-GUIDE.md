# 360° Parallel Execution Guide
## 3 Antigravity Windows — Running in Parallel
### Date: March 2026 | Based on all uploaded MD files + project state

---

## MASTER RULE — READ BEFORE OPENING ANY WINDOW

```
Window 1 = Exam Engine completion (existing quiz-platform codebase)
Window 2 = Tutorial Engine new build (new tutorial-service in same monorepo)
Window 3 = SkillHubCore new build (new skillhubcore-service in same monorepo)

NEVER mix work between windows.
Each window owns its scope only.
All 3 run in parallel — no window waits for another EXCEPT:
  → Window 2 needs packages/events before T2 (Sprint 0 first)
  → Window 3 needs people-db Neon account before DB schema work
These are the only hard dependencies.
```

---

## CURRENT STATE SNAPSHOT

| Item | Status |
|---|---|
| Exam Engine | ✅ Done — 386 files, 1138 tests, 92.6% coverage |
| GCP Cloud Run Mumbai | ✅ Live — all 3 apps deployed |
| Cloudflare DNS | ✅ Done — all 3 subdomains pointing to GCP |
| Phase 3 Chunks 1–6 (T105–T129) | ✅ Done |
| Keyset pagination frontend | ✅ Done (backend was already done) |
| Phase 3 Chunk 7 (T130+T131) | ⏳ PENDING — Window 1 starts here |
| Tutorial Engine | ⏳ NOT STARTED — Window 2 starts here |
| SkillHubCore | ⏳ NOT STARTED — Window 3 starts here |
| 4 new Neon databases | ⏳ YOU must create these before Window 2+3 |

---

## PRE-FLIGHT: 4 NEON DATABASES (Do this FIRST — 20 mins, ₹0)

Create 4 new accounts at neon.tech using 4 different email addresses.
Each free account gets 1 project = 1 database.

| Account | Project name | DATABASE_URL env key |
|---|---|---|
| Your existing account | exam-db (already exists) | DATABASE_URL (already set) |
| New email 1 | people-db | DATABASE_URL_PEOPLE |
| New email 2 | tutorial-db | DATABASE_URL_TUTORIAL |
| New email 3 | payment-db | DATABASE_URL_PAYMENT |
| New email 4 | placement-db | DATABASE_URL_PLACEMENT |

Add all 5 to your `.env.local` and to GCP Secret Manager:
```bash
# Run this after creating all 4 accounts
# Replace each URL with the actual Neon connection string
DATABASE_URL=postgresql://...@...neon.tech/exam-db?sslmode=require
DATABASE_URL_PEOPLE=postgresql://...@...neon.tech/people-db?sslmode=require
DATABASE_URL_TUTORIAL=postgresql://...@...neon.tech/tutorial-db?sslmode=require
DATABASE_URL_PAYMENT=postgresql://...@...neon.tech/payment-db?sslmode=require
DATABASE_URL_PLACEMENT=postgresql://...@...neon.tech/placement-db?sslmode=require
```

---

---

# WINDOW 1 — EXAM ENGINE COMPLETION
## Agent: Antigravity Window 1
## Scope: Phase 3 Chunk 7–8 + Phase 4 Chunks 1–9 (T130–T165)
## Codebase: d:\onlinewebsites\quiz-platform (existing)

---

### WINDOW 1 — OPENING PROMPT (paste this FIRST in every Window 1 session)

```
You are a senior implementation agent working in d:\onlinewebsites\quiz-platform

Project: quiz-platform monorepo (Turborepo + pnpm)
Apps: api-server, web-app, admin-app (Next.js 16)
Stack: GCP Cloud Run Mumbai, Neon Postgres Singapore, Upstash Redis+QStash, Cloudflare CDN

Current state:
- GCP deployment: LIVE (quiz.realtutorialhub.com, api.realtutorialhub.com, admin.realtutorialhub.com)
- Phase 3 Chunks 1–6 complete (T105–T129)
- OCI Mumbai VM available for k6 testing

Hard rules:
1. Scope = Window 1 only. Do not touch tutorial-service or skillhubcore-service.
2. No visual regressions. UI/UX locked.
3. Do not delete existing tests (1138 passing must stay green).
4. Run after every chunk: pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
5. Focused commits only. One commit per chunk.
6. Create Playwright specs but do NOT execute Playwright.

Required output per chunk:
1. What was implemented
2. Files changed
3. Test/build results (pass/fail)
4. Playwright files added (not executed)
5. Risks and follow-up
```

---

### WINDOW 1 — CHUNK 7 PROMPT (T130 + T131)

```
Execute Phase 3 Chunk 7: Tasks T130 and T131 only.

Goal: k6 load test scripts for exam flow and auth flow.

Context:
- OCI Mumbai VM available at: [YOUR OCI VM IP]
- Target: GCP api-server → https://quiz-api-server-581488566988.asia-south1.run.app
- k6 test accounts to create first in admin dashboard:
    k6-test@loadtest.example.com / [password]
    k6-lockout@loadtest.example.com / [password]
- Get IDs from DB before writing scripts:
    Domain ID for Full Stack
    Subject ID for Front End Development
    Topic ID for JavaScript
    Blueprint ID for 10-question JavaScript exam

Do:
1. Read apps/api-server/src/app/api/ to confirm exact endpoint paths.
2. Create directory: tests/load/
3. Create: tests/load/lib/config.js (shared BASE_URL, stages, thresholds)
4. Create: tests/load/lib/helpers.js (login helper, token storage)
5. Create: tests/load/exam-flow.k6.js (T130)
   - Smoke: 10 VUs 1 min
   - Load: 50 VUs 5 min
   - Stress: 100→200 VUs
   - Flow: login → start exam → submit answers → complete → get result
   - Thresholds: http_req_duration p(95)<2000, error_rate<0.01
6. Create: tests/load/auth-flow.k6.js (T131)
   - Flow: signup → login → refresh → logout
   - Lockout test: 6 failed logins → 429 expected
   - Thresholds: p(95)<1000
7. Create: tests/load/README.md (how to run from OCI VM)

Commit: test(load): add k6 scripts for exam and auth flows (T130, T131)
Stop and report.
```

---

### WINDOW 1 — CHUNK 8 PROMPT (T132 + T133 + T134)

```
Execute Phase 3 Chunk 8: Tasks T132, T133, and T134 only.

Do:
1. Create: tests/load/admin-flow.k6.js (T132)
   - Admin login → domain list → question list → blueprint list
   - Thresholds: p(95)<1500
2. Create: docs/load-testing/BASELINES.md (T133)
   - Document accepted thresholds per endpoint
   - Baseline results from mini run (3 VUs from OCI)
   - Acceptance criteria: p95 latency, error rate, throughput
3. Add CI job for load tests (T134)
   - .github/workflows/load-test.yml
   - Triggered manually (workflow_dispatch) not on every push
   - Uses OCI VM via self-hosted runner OR k6 cloud
   - Only runs smoke profile in CI (3 VUs, 1 min)
   - Does not slow down regular CI

Commit: test(load): add admin k6, baselines, and CI integration (T132-T134)
Stop and report. Phase 3 is now COMPLETE.
```

---

### WINDOW 1 — PHASE 4 CHUNK 1 PROMPT (T135–T138)

```
Execute Phase 4 Chunk 1: Tasks T135, T136, T137, T138 only.

Goal: Event sourcing foundation + distributed event bus + domain events + replay.

Context:
- packages/events already has QStash publisher/consumer (from PHASE-INFRA-GATEWAY.md)
- Extend carefully — do not rewrite existing queue.service.ts
- Event types already defined: student.enrolled, exam.completed, payment.received,
  tutorial.subtopic_completed, batch.session_completed, attendance.marked,
  admission.completed, project.submitted, certificate.issued, placement.offer_accepted,
  content.generation_requested, content.approved_and_published, and 3 more

Do:
1. Create packages/events/src/event-store.ts
   - Append-only event table in exam DB: platform_events (id, type, payload, correlation_id, published_at, published_by, version)
   - EventStore class: append(event), findByCorrelationId(), findByType()
2. Add replay capability: EventReplayer.replay(fromDate, type)
   - Re-publishes stored events to QStash consumers
   - Used for recovery after consumer downtime
3. Add idempotency: each event has correlation_id
   - Consumers check: already processed this correlation_id?
   - If yes: skip silently, return 200
4. Update packages/events/src/publisher.ts
   - Store event in event-store before publishing to QStash
   - If QStash fails: event is stored, can be replayed
5. Add deep tests: ordering, idempotency, replay correctness

Commit: feat(events): add event sourcing, store, replay support (T135-T138)
Stop and report.
```

---

### WINDOW 1 — PHASE 4 CHUNKS 2–9 PROMPTS

**Chunk 2 (T139–T142) — Multi-region + Edge**
```
Execute Phase 4 Chunk 2: T139, T140, T141, T142.
Goal: Multi-region scaffolding. GCP Mumbai is primary. Add edge caching policy.
Do:
1. Add DB replica routing: read queries → DATABASE_URL_REPLICA (if set), writes → primary
2. Add edge caching config for Cloudflare Workers (static content TTL rules)
3. Add edge auth validation path: JWT verified at Cloudflare Worker before hitting GCP
4. Document multi-region runbook in docs/ops/MULTI-REGION.md
5. Add tests and safety checks
Commit: chore(platform): multi-region and edge architecture foundations (T139-T142)
```

**Chunk 3 (T143–T146) — Real-time**
```
Execute Phase 4 Chunk 3: T143, T144, T145, T146.
Goal: SSE for exam timer + live score updates. WebSocket for admin live monitoring.
Do:
1. Add SSE endpoint: /api/exam/[examId]/stream → sends timer ticks + status updates
2. Add connection lifecycle: cleanup on disconnect, stale session detection
3. Add reconnect logic in web-app exam page
4. Add tests for reconnect, drop, stale sessions
Commit: feat(realtime): streaming updates and connection management (T143-T146)
```

**Chunk 4 (T147–T150) — Resilience**
```
Execute Phase 4 Chunk 4: T147, T148, T149, T150.
Goal: Bulkhead, load shedding, chaos hooks, graceful shutdown.
Do:
1. Bulkhead: max concurrent exam submissions = 500 (configurable via env)
2. Load shedding: if active_jobs > threshold, return 503 with retry-after
3. Chaos hooks: CHAOS_MODE=true env → random 5% of exam submissions fail (non-prod only)
4. Graceful shutdown: drain in-flight requests before process exit (SIGTERM handler)
5. Tests for each failure mode
Commit: feat(resilience): bulkhead, shedding, chaos hooks, graceful shutdown (T147-T150)
```

**Chunk 5 (T151–T153) — Observability stack**
```
Execute Phase 4 Chunk 5: T151, T152, T153.
Goal: Prometheus metrics + Grafana dashboards + structured logging.
Do:
1. Add /api/metrics endpoint (Prometheus format): req latency, error rates, exam throughput
2. Add Grafana dashboard JSON: docs/observability/dashboards/exam-engine.json
3. Ensure all API routes use structuredLog({ requestId, userId, duration, status })
4. Verify Sentry captures all unhandled errors with context
Commit: chore(observability): metrics, logs, traces (T151-T153)
```

**Chunk 6 (T154–T156) — SLO + Alerts + RUM**
```
Execute Phase 4 Chunk 6: T154, T155, T156.
Goal: Define SLOs, alert policies, RUM instrumentation.
Do:
1. Define SLOs in docs/observability/SLOs.md:
   - Exam submission: 99.5% success, p95 < 2s
   - Auth: 99.9% success, p95 < 500ms
   - Tutorial page load: p95 < 1.5s
2. Add GCP Cloud Monitoring alert policies (JSON config in docs/observability/alerts/)
3. Add RUM: web vitals (LCP, FID, CLS) reported to Sentry performance
Commit: chore(observability): SLOs, alerting, RUM (T154-T156)
```

**Chunk 7 (T157–T159) — IaC + Docker**
```
Execute Phase 4 Chunk 7: T157, T158, T159.
Goal: Dockerfile + docker-compose for local dev.
Do:
1. Add Dockerfile for api-server, web-app, admin-app (multi-stage builds)
2. Add docker-compose.yml: postgres + redis + all 3 apps locally
3. Add Terraform starter in infra/terraform/ for GCP Cloud Run service definitions
4. Keep pnpm dev workflow intact
Commit: chore(infra): IaC, Docker, compose local stack (T157-T159)
```

**Chunk 8 (T160–T161) — Secrets + Zero-downtime migrations**
```
Execute Phase 4 Chunk 8: T160, T161.
Goal: Secret management + safe migration tooling.
Do:
1. Add scripts/setup-gcp-secrets.sh (loads all .env vars into GCP Secret Manager)
2. Add migration safety: drizzle-kit push only runs if NODE_ENV=development
   Production uses drizzle-kit generate + manual review
3. Add expand-contract migration guide in docs/ops/MIGRATIONS.md
4. Add pre-migration checklist script
Commit: chore(ops): secret management and zero-downtime migrations (T160-T161)
```

**Chunk 9 (T162–T165) — API docs + ADRs + Runbooks**
```
Execute Phase 4 Chunk 9: T162, T163, T164, T165.
Goal: OpenAPI spec + ADR directory + operational runbooks.
Do:
1. Add OpenAPI 3.0 spec generation from existing routes (zod-to-openapi or similar)
2. Add docs/adr/ with initial ADRs:
   - ADR-001: Option B monorepo + separate DBs (already decided)
   - ADR-002: GCP Cloud Run over Vercel for services
   - ADR-003: QStash over direct webhooks for async events
3. Add docs/ops/runbooks/: exam-failure.md, auth-lockout.md, high-error-rate.md
4. Add API deprecation policy in docs/api/DEPRECATION.md
Commit: docs(api): openapi, ADRs, runbooks (T162-T165)

PHASE 4 COMPLETE. Window 1 is done.
```

---

---

# WINDOW 2 — TUTORIAL ENGINE
## Agent: Antigravity Window 2
## Scope: Sprint 0 foundation + Tutorial Engine T1–T6
## Codebase: d:\onlinewebsites\quiz-platform (same monorepo, new services)
## Prerequisite: tutorial-db Neon account created, DATABASE_URL_TUTORIAL set

---

### WINDOW 2 — OPENING PROMPT (paste this FIRST in every Window 2 session)

```
You are a senior implementation agent working in d:\onlinewebsites\quiz-platform

Project: quiz-platform monorepo (Turborepo + pnpm)
You are building the NEW Tutorial Engine — a separate service inside the existing monorepo.

Architecture decision (ADR-CRITICAL-001): Option B confirmed.
One Turborepo monorepo + separate databases per service.

Your scope: tutorial-service + tutorial-app + packages/db-tutorial only.
Do NOT touch: api-server, web-app, admin-app, exam engine code.

Key architecture facts:
- Tutorial DB: Neon Postgres (DATABASE_URL_TUTORIAL env)
- Deployment: GCP Cloud Run Mumbai (asia-south1)
- Gateway: Hono on Cloudflare Workers (api.realtutorialhub.com)
- Content schema: LOCKED (content-json-schema.md — do not modify)
- Learning flow: Layman → Real-Life → Technical → Code → AI Tutor → Assignment
- 6 content blocks are MANDATORY — no subtopic published without all 6

Hard rules:
1. Scope = Window 2 only. Do not touch exam engine or SkillHubCore.
2. Existing 1138 tests must stay green — your new code adds tests, never removes.
3. Run after every sprint: pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
4. Content JSON schema in content-json-schema.md is immutable — never modify it.
5. Focused commits only.

Key MD files to read first (they are in docs/blueprints/):
- PHASE-T1-T6-TUTORIAL-FOUNDATION.md
- content-json-schema.md
- domain_specific_content_generation_framework.md
- Universal_Content_Generator_Architecture.md
- TUTORIAL-ENGINE-BLUEPRINT.md
```

---

### WINDOW 2 — SPRINT 0 PROMPT (run before T1)

```
Execute Window 2 Sprint 0: Foundation setup only. Do NOT start T1 content yet.

Goal: Create the shared foundation packages that Tutorial Engine requires.

Step 1 — Create root CLAUDE.md
Create file: CLAUDE.md (at monorepo root)
Content must include:
  - Project: 3-platform ecosystem (RealTutorialHub + SkillUp IT Academy + SkillHubCore)
  - Architecture: Option B — one monorepo, separate DBs per service
  - 5 databases: exam-db, people-db, tutorial-db, payment-db, placement-db
  - 8 services: api-gateway, skillhubcore, exam, tutorial, student-faculty, payment, notification, placement
  - Deployment: GCP Cloud Run Mumbai (asia-south1)
  - Event bus: Upstash QStash, packages/events
  - NEVER share databases between services
  - Exam Engine: COMPLETE — do not modify
  - Current focus: Tutorial Engine (Window 2) + SkillHubCore (Window 3)

Step 2 — Extract packages/auth
Move JWT logic from apps/api-server/src/modules/auth/ into packages/auth/
Create: packages/auth/src/index.ts (exports TokenService, AuthService, SecurityService)
Both api-server and future tutorial-service import from @platform/auth
Run tests — must stay green

Step 3 — Create packages/events (from PHASE-INFRA-GATEWAY.md spec)
Create: packages/events/src/publisher.ts
Create: packages/events/src/consumer.ts
Create: packages/events/src/types.ts
Event types (15 total from gateway spec):
  student.enrolled, student.created, exam.completed, payment.received,
  payment.overdue, tutorial.subtopic_completed, batch.session_completed,
  batch.subtopics_covered, attendance.marked, admission.completed,
  project.submitted, certificate.issued, placement.offer_accepted,
  content.generation_requested, content.approved_and_published
Each event has Zod schema + TypeScript interface
Add to turbo.json pipeline

Step 4 — Create packages/db-tutorial (from PHASE-T1-T6 spec)
packages/db-tutorial/
  src/
    index.ts
    schema/
      tutorial-content.ts    ← main content table
      tutorial-assignments.ts
      tutorial-projects.ts
      tutorial-progress.ts
      tutorial-video-links.ts
      badges.ts
      remediation-triggers.ts
      domain-content-config.ts
      content-generation-jobs.ts
      subtopic-flow-progress.ts
  drizzle.config.ts (uses DATABASE_URL_TUTORIAL)

Step 5 — Create packages/types additions
Add to packages/types/src/tutorial-content.types.ts
(exact TypeScript interfaces from content-json-schema.md — copy verbatim)

Verification: pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
All 1138 existing tests must still pass.

Commit: chore(platform): Sprint 0 foundation — CLAUDE.md, packages/auth, packages/events, packages/db-tutorial
Stop and report.
```

---

### WINDOW 2 — T1 PROMPT (Tutorial Engine Foundation)

```
Execute Tutorial Engine T1: Stand up tutorial-service and tutorial-app.
Reference: PHASE-T1-T6-TUTORIAL-FOUNDATION.md Part 1 and Part 2.

Goal: By end of T1, a student can browse domains, open a subtopic page,
and see all 6 content blocks (manually entered by admin). No AI yet.

Step 1 — Create apps/tutorial-app (Next.js 15, App Router)
Directory structure from PHASE-T1 Part 1.1.
Package name: @platform/tutorial-app
Tailwind config mirroring existing apps' design language
CLAUDE.md inside tutorial-app/

Step 2 — Run Tutorial DB migrations
packages/db-tutorial contains all schemas
Run: pnpm --filter @platform/db-tutorial db:migrate
Target: DATABASE_URL_TUTORIAL
Verify all tables created in Neon tutorial-db

Step 3 — Seed domain-content-config table
Default language per domain (from domain_specific_content_generation_framework.md):
  Full Stack → javascript / typescript
  Data Analyst → sql / python
  Data Science → python
  Data Engineering → python / scala / sql

Step 4 — Create tutorial-service API routes (inside apps/tutorial-app/src/app/api/)
  GET /api/tutorial/domains → list domains (cross-ref with exam DB via HTTP, not DB join)
  GET /api/tutorial/[domain]/subjects → list subjects
  GET /api/tutorial/[domain]/[subject]/topics → list topics
  GET /api/tutorial/[domain]/[subject]/[topic]/subtopics → list subtopics
  GET /api/tutorial/content/[subtopicId] → get all 6 content blocks for subtopic
  POST /api/tutorial/content (admin only) → create/update content block

Step 5 — Create subtopic learning page
apps/tutorial-app/src/app/learn/[domain]/[subject]/[topic]/[subtopic]/page.tsx
Renders 6 block components in correct order:
  NotesBlock → LaymanBlock → RealLifeBlock → TechnicalBlock → CodeBlock → AITutorBlock
Each block receives typed slice from TutorialContentJSON interface
Use reference: tutorial-subtopic-page_prompt.md for UI/UX spec

Step 6 — Create admin content entry UI (in admin-app)
Add route: apps/admin-app/src/app/(admin)/tutorial/content/page.tsx
Select: domain → subject → topic → subtopic → difficulty
For each of 6 block types: textarea with JSON preview
Save button → POST /api/tutorial/content

Add unit tests for all API routes
Commit: feat(tutorial): T1 tutorial foundation — service, DB, subtopic page
Stop and report.
```

---

### WINDOW 2 — T2 PROMPT (AI Content Generation Pipeline)

```
Execute Tutorial Engine T2: AI content generation pipeline.
Reference: PHASE-T1-T6 Part 3 + Universal_Content_Generator_Architecture.md

Goal: Admin selects a subtopic → AI generates all 6 content blocks → stored in tutorial-db.

Step 1 — Create packages/content-generation
packages/content-generation/src/
  generators/
    layman.generator.ts
    real-life.generator.ts
    technical.generator.ts
    code.generator.ts
    ai-tutor.generator.ts
    notes.generator.ts
  validators/schema.ts (Zod schemas from content-json-schema.md — copy verbatim)
  prompts/
    base-prompt.ts
    domain-prompts.ts (domain-specific rules from domain_specific_content_generation_framework.md)
  orchestrator.ts (generates all 6 blocks in parallel)

Step 2 — Implement content generation API
POST /api/admin/tutorial/generate
Input: { subtopicId, difficulty, domain, subject, topic, subtopic }
Flow:
  1. Load domain config from domain-content-config table
  2. Build prompt using domain-specific rules
  3. Call claude-haiku-4-5 (for cost: $0.80/1M in, $4/1M out)
  4. Validate output against TutorialContentSchema (Zod)
  5. If validation fails: retry once with correction prompt
  6. If second attempt fails: save as draft, notify admin
  7. If success: save to tutorial_content with generated_by_ai=true

Step 3 — Add content generation job queue (QStash)
Heavy generation (all 6 blocks for one subtopic) goes via QStash
POST /api/admin/tutorial/generate → creates QStash job → returns jobId immediately
POST /api/workers/generate-content → QStash consumer → runs generation → publishes content.approved_and_published

Step 4 — Admin UI: generation status
Add to admin content page: "Generate with AI" button
Shows progress: Notes ✓ Layman ✓ Real-Life ⏳ Technical... Code... AI Tutor...
Polls /api/admin/tutorial/content-job/[jobId] for status

Validate all content against quality rules from content-json-schema.md:
  layman: min 150 words, min 2 examples, 1 analogy
  code: valid language enum, min 30 chars
  ai_tutor: min 3 Q&A pairs

Commit: feat(tutorial): T2 AI content generation pipeline
Stop and report.
```

---

### WINDOW 2 — T3 PROMPT (Progress Tracking + Remediation)

```
Execute Tutorial Engine T3: Student progress tracking + remediation engine.
Reference: PHASE-T1-T6 Part 4 + TUTORIAL-ENGINE-BLUEPRINT.md

Goal: Track which subtopics a student has completed. Detect weak areas.
Auto-generate study plan when exam score is low.

Step 1 — Progress tracking API
POST /api/tutorial/progress/mark-complete
  Input: { subtopicId, blockType, timeSpent }
  Updates: subtopic_flow_progress table
  Event: publish tutorial.subtopic_completed to QStash

GET /api/tutorial/progress/[userId]/overview
  Returns: % complete per domain, per subject, per topic

Step 2 — Consume exam.completed event
apps/tutorial-app/src/app/api/workers/exam-completed/route.ts
When exam completes:
  1. Receive exam result (score per subtopic dimension)
  2. Find subtopics where score < 70%
  3. Create remediation_trigger records for weak subtopics
  4. Generate recommended study plan (ordered list of weak subtopics)
  5. Store in remediation_triggers table

Step 3 — Remediation UI
Add to student dashboard: "Recommended Study Plan" section
Lists: subtopics to revisit (ordered by weakness severity)
Link each to its subtopic learning page

Step 4 — Gamification foundations
badges table + awarding logic:
  First subtopic completed → "First Step" badge
  10 subtopics in one day → "Momentum" badge
  Full domain completed → "Domain Master" badge
XP points: +10 per subtopic, +50 per topic, +200 per subject

Commit: feat(tutorial): T3 progress tracking, remediation, gamification
Stop and report.
```

---

### WINDOW 2 — T4 PROMPT (Assignments + Projects)

```
Execute Tutorial Engine T4: Assignment system + project tiers.
Reference: PHASE-T1-T6 Part 5 + TUTORIAL-ENGINE-BLUEPRINT.md (3-tier projects)

Goal: Each subtopic has 4 assignment tiers.
Tier 1: Auto-graded MCQ (uses exam engine)
Tier 2: Short answer (AI reviewed)
Tier 3: Hands-on project (faculty reviewed for SkillUp, AI pre-reviewed for self-study)
Tier 4: Capstone project (faculty reviewed only)

Step 1 — Assignment DB schema already created in packages/db-tutorial
Verify tutorial_assignments + tutorial_projects tables exist

Step 2 — Assignment submission API
POST /api/tutorial/assignments/submit
  Input: { assignmentId, submissionData, submissionType }
  For MCQ: auto-grade immediately, return score
  For short-answer: publish to QStash for AI review
  For project: save submission, notify faculty (if SkillUp) or queue AI review

Step 3 — AI review pipeline for short-answer (QStash job)
POST /api/workers/review-assignment
  Load assignment rubric
  Call claude-haiku with rubric + submission
  Parse score (4 dimensions × 25 points)
  Save review result
  Award badge if score >= 80%

Step 4 — Assignment UI in tutorial-app
After each subtopic: show assignment card
Progress indicator: Tier 1 ✓ → Tier 2 ✓ → Tier 3 ⏳ → Tier 4 🔒
Unlocking: complete Tier N to unlock Tier N+1

Commit: feat(tutorial): T4 assignment system and project tiers
Stop and report.
```

---

### WINDOW 2 — T5 PROMPT (AI Tutor Integration)

```
Execute Tutorial Engine T5: AI Tutor live chat integration.
Reference: PHASE-T1-T6 Part 6 + TUTORIAL-ENGINE-BLUEPRINT.md

Goal: AI Tutor block becomes interactive. Student asks questions.
AI answers using subtopic content as context (RAG-lite using Upstash Vector).

Step 1 — Upstash Vector index setup
Install @upstash/vector
Create vector index for tutorial content
When content.approved_and_published event received:
  POST /api/workers/index-content-vector
  Embed subtopic content (notes + technical) → store in vector index
  Key: subtopicId + contentType

Step 2 — AI Tutor API
POST /api/tutorial/ai-tutor/ask
  Input: { subtopicId, question, conversationHistory }
  Flow:
    1. Embed question
    2. Search vector index for relevant content chunks
    3. Build context: matching content + subtopic metadata
    4. Call claude-haiku with context + question
    5. Return answer
  Rate limit: 10 questions per student per hour (Upstash Ratelimit)
  Cost: ~₹0.35 per session at scale

Step 3 — AI Tutor UI component
AITutorBlock.tsx: chat interface within subtopic page
Pre-loaded with 3–5 Q&A pairs from ai_tutor JSON block
Student can type new question → calls /api/tutorial/ai-tutor/ask
Shows typing indicator while AI responds
Conversation history maintained in component state (not persisted)

Step 4 — Semantic duplicate detection for Q&A
If student question is semantically similar to existing qa_pair → return cached answer
Saves API calls, improves response time

Commit: feat(tutorial): T5 AI tutor with RAG and vector search
Stop and report.
```

---

### WINDOW 2 — T6 PROMPT (Video Links + Admin Workflows + GCP Deploy)

```
Execute Tutorial Engine T6: Video integration + admin approval workflow + GCP deployment.
Reference: PHASE-T1-T6 Part 7

Goal: Complete Tutorial Engine v1. Deploy to GCP Cloud Run.

Step 1 — Video links
tutorial_video_links table (already in schema)
Admin can attach YouTube/Loom/Vimeo links per subtopic
Student sees embedded video player on subtopic page

Step 2 — Admin content approval workflow
Content states: DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED
AI-generated content starts as DRAFT
Admin reviews: preview all 6 blocks + quality score
Approve → is_published = true → content.approved_and_published event fired
Reject → admin adds feedback → regenerate prompt sent to AI

Step 3 — Content versioning
Every edit increments tutorial_content.version
Old versions kept (never deleted)
Admin can view version history and rollback

Step 4 — GCP Cloud Run deployment
Create: services/tutorial-service/ (standalone Next.js 15 app for GCP)
Dockerfile for tutorial-app (multi-stage)
Add to GitHub Actions: deploy-tutorial.yml
  On push to main, if apps/tutorial-app/** changed → rebuild + deploy to GCP
Cloud Run URL: tutorial-service-[hash].asia-south1.run.app
Update Cloudflare DNS: notes.realtutorialhub.com → tutorial-service GCP URL

Step 5 — Update API Gateway routing table
Add to PHASE-INFRA-GATEWAY routing:
  /tutorial → tutorial-service GCP URL
  /ai-tutor → tutorial-service GCP URL

Commit: feat(tutorial): T6 video links, approval workflow, versioning, GCP deploy
Tutorial Engine v1 COMPLETE. Stop and report.
```

---

---

# WINDOW 3 — SKILLHUBCORE
## Agent: Antigravity Window 3
## Scope: SkillHubCore platform brain — SSO, subscriptions, user identity
## Codebase: d:\onlinewebsites\quiz-platform (same monorepo, new service)
## Prerequisite: people-db Neon account created, DATABASE_URL_PEOPLE set

---

### WINDOW 3 — OPENING PROMPT (paste this FIRST in every Window 3 session)

```
You are a senior implementation agent working in d:\onlinewebsites\quiz-platform

Project: quiz-platform monorepo (Turborepo + pnpm)
You are building SkillHubCore — the central platform brain connecting all 3 platforms.

Architecture: SkillHubCore owns user identity, SSO, subscriptions, and cross-platform JWT.
Every user on every platform (RealTutorialHub, SkillUp IT Academy) authenticates through SkillHubCore.

Your scope: services/skillhubcore/ + packages/db-people only.
Do NOT touch: exam engine, tutorial-service, existing api-server auth.

Key architecture facts:
- People DB: Neon Postgres (DATABASE_URL_PEOPLE env)
- Deployment: GCP Cloud Run Mumbai + Cloudflare Workers gateway
- Domain: skillhubcore.in | API: api.skillhubcore.in
- JWT issued by SkillHubCore, verified at edge by API Gateway
- Current exam engine auth (packages/auth) remains untouched during transition
- Migration plan: gradually route new users through SkillHubCore; existing users migrate

Hard rules:
1. Scope = Window 3 only. Exam engine auth must keep working throughout.
2. All 1138 existing tests must stay green.
3. SkillHubCore auth is ADDITIVE first — parallel to existing auth, not replacing it yet.
4. Run after every sprint: pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all

Key MD file: PHASE-SKILLHUBCORE.md — read this in full before starting.
```

---

### WINDOW 3 — SPRINT 1 PROMPT (People DB + Core Identity)

```
Execute SkillHubCore Sprint 1: People DB setup + core user identity.
Reference: PHASE-SKILLHUBCORE.md Part 2 (People DB Schema)

Goal: Stand up People DB with all tables. Create SkillHubCore service.

Step 1 — Create packages/db-people
packages/db-people/
  src/
    index.ts
    schema/
      users.ts              ← core identity table
      platform-access.ts    ← which platforms user can access
      subscriptions.ts      ← Free/Premium/Combo plans
      sso-sessions.ts       ← cross-platform session tokens
      user-preferences.ts
      audit-log.ts
  drizzle.config.ts (uses DATABASE_URL_PEOPLE)

Exact schema from PHASE-SKILLHUBCORE.md Part 2 — copy verbatim.

Step 2 — Run People DB migrations
pnpm --filter @platform/db-people db:migrate
Verify all tables created in Neon people-db

Step 3 — Create services/skillhubcore/ (Hono on Node.js, deployed to GCP Cloud Run)
services/skillhubcore/
  src/
    index.ts              ← Hono app entry
    routes/
      auth.ts             ← /auth/register, /auth/login, /auth/refresh, /auth/logout
      users.ts            ← /users/me, /users/[id]
      subscriptions.ts    ← /subscriptions
      sso.ts              ← /sso/token, /sso/verify
    services/
      identity.service.ts
      subscription.service.ts
      sso.service.ts
    middleware/
      jwt.middleware.ts
    lib/
      jwt.ts              ← issues cross-platform JWT with platform claims

Step 4 — JWT structure for cross-platform access
JWT payload must include:
  sub: userId (from people DB)
  email: user email
  platforms: ['realtutorialhub', 'skillup'] or ['realtutorialhub'] etc.
  subscription: { plan, expiresAt, features[] }
  roles: ['student'] or ['faculty'] or ['admin']
  iss: 'skillhubcore'
  aud: requesting platform

Step 5 — Add unit tests
Test: register → login → refresh → logout flow
Test: JWT contains correct platform claims
Test: subscription plan correctly attached to JWT

Commit: feat(skillhubcore): Sprint 1 — People DB, identity service, cross-platform JWT
Stop and report.
```

---

### WINDOW 3 — SPRINT 2 PROMPT (SSO + Subscription Engine)

```
Execute SkillHubCore Sprint 2: SSO implementation + subscription engine.
Reference: PHASE-SKILLHUBCORE.md Parts 3 and 4

Goal: Student logs in ONCE at skillhubcore.in → can access both RealTutorialHub and SkillUp
without logging in again.

Step 1 — SSO flow implementation
When student goes to notes.realtutorialhub.com:
  1. No active session → redirect to skillhubcore.in/auth/login?redirect=notes.realtutorialhub.com
  2. Student logs in at skillhubcore.in
  3. SkillHubCore creates cross-platform JWT + stores sso_sessions record
  4. Redirect back to notes.realtutorialhub.com with short-lived token in URL param
  5. tutorial-app exchanges token → gets full JWT → stores in httpOnly cookie
  6. Student is logged in — no second login needed

POST /sso/initiate → creates one-time token (OTP, 60s TTL, stored in Redis)
POST /sso/exchange → receives OTP, returns full platform JWT

Step 2 — Subscription plans
Plan types: free, notes_only, exam_only, notes_exam, live_training, combo
Each plan has features[] list:
  free: ['notes_read_3_per_day', 'quiz_5_per_month']
  notes_exam: ['notes_unlimited', 'quiz_unlimited', 'ai_tutor_10_per_day']
  live_training: ['all_notes_exam', 'batch_access', 'faculty_support', 'placement']
  combo: ['everything']

POST /subscriptions/activate (called after payment.received event)
GET /subscriptions/check-feature (called by tutorial-service to check if user can access content)

Step 3 — Feature gating
tutorial-service calls: GET api.skillhubcore.in/subscriptions/check-feature?userId=X&feature=notes_unlimited
  Returns: { allowed: true/false, reason: string }
Gate subtopic access based on subscription plan

Step 4 — Razorpay integration (basic)
POST /payments/create-order (Indian users)
POST /payments/webhook (Razorpay webhook → payment.received event)
On payment success: upgrade subscription + publish payment.received

Commit: feat(skillhubcore): Sprint 2 — SSO, subscription engine, feature gating
Stop and report.
```

---

### WINDOW 3 — SPRINT 3 PROMPT (API Gateway + SkillHubCore Deploy)

```
Execute SkillHubCore Sprint 3: API Gateway + GCP deployment.
Reference: PHASE-INFRA-GATEWAY.md (complete gateway code)

Goal: Deploy SkillHubCore to GCP. Deploy API Gateway to Cloudflare Workers.
All traffic routes through gateway.

Step 1 — Deploy SkillHubCore to GCP Cloud Run
Dockerfile for services/skillhubcore/
Add to GitHub Actions: deploy-cloudrun.yml
Cloud Run URL: skillhubcore-[hash].asia-south1.run.app
Update Cloudflare DNS: api.skillhubcore.in → skillhubcore GCP URL

Step 2 — Create API Gateway (Hono on Cloudflare Workers)
services/api-gateway/src/index.ts
Copy complete gateway code from PHASE-INFRA-GATEWAY.md Part 3 verbatim.
Routing table from PHASE-INFRA-GATEWAY.md Part 2 verbatim.
QStash publisher/consumer from PHASE-INFRA-GATEWAY.md Part 4 verbatim.

wrangler.toml config from PHASE-INFRA-GATEWAY.md Part 6.
Routes:
  api.realtutorialhub.com/* → routes to correct GCP service
  api.skillhubcore.in/* → routes to skillhubcore GCP service

Step 3 — Deploy gateway to Cloudflare Workers
pnpm --filter @platform/api-gateway wrangler deploy
Verify:
  □ JWT verified at edge
  □ Rate limiting: 100 req/min per IP
  □ CORS: only allowed origins
  □ X-Request-ID propagated
  □ Admin routes require role: admin
  □ /healthz returns 200
  □ Cold start < 50ms

Step 4 — Update all existing services
Existing api-server: add X-Gateway-Secret verification middleware
Tutorial-service: add X-Gateway-Secret verification middleware
All services now trust X-User-ID header injected by gateway

Step 5 — Update Cloudflare DNS
api.realtutorialhub.com → Cloudflare Worker (gateway) — NOT directly to GCP
api.skillhubcore.in → Cloudflare Worker (gateway) — NOT directly to GCP

Commit: feat(skillhubcore): Sprint 3 — API gateway deployed, SkillHubCore live
SkillHubCore v1 COMPLETE. Stop and report.
```

---

### WINDOW 3 — SPRINT 4 PROMPT (SkillUp IT Academy — Student Management)

```
Execute SkillHubCore Sprint 4: Student Management System for SkillUp.
Reference: PHASE-SMS-ALL-PHASES.md

Goal: Full student lifecycle management for SkillUp IT Academy.
ENQUIRY → QUALIFIED → ADMISSION → ENROLLED → BATCH_ALLOCATED → LEARNING → CERTIFIED → PLACED

Step 1 — Create packages/db-student (extends people DB for SkillUp-specific data)
Uses DATABASE_URL_PEOPLE (same Neon instance, different schema prefix)
Tables from PHASE-SMS-ALL-PHASES.md Part 2:
  student_profiles, enquiries, admissions, fee_payments,
  installment_plans, batch_enrollments, attendance_records,
  student_certificates, student_documents

Step 2 — Create services/student-faculty/ (Hono on GCP Cloud Run)
Routes from PHASE-SMS-ALL-PHASES.md:
  POST /enquiries/submit (public — web form)
  PATCH /admissions/[id]/status
  POST /fee-payments/record
  GET /students/[id]/lifecycle
  POST /batches/[id]/enroll

Step 3 — CRM enquiry pipeline
When student submits enquiry form on skillupitacademy.com:
  1. POST /enquiries/submit → saved to enquiries table
  2. publish admission.completed event → notification-service sends WhatsApp
  3. Admin sees enquiry in CRM dashboard at admin.skillupitacademy.com
  4. Admin qualifies → status: ENQUIRY_QUALIFIED
  5. Admin books counselling call → status: COUNSELLING_DONE
  6. Student pays fee → status: PAYMENT_PENDING → ENROLLED
  7. Admin allocates batch → status: BATCH_ALLOCATED

Step 4 — Fee payment with installments
Razorpay payment links (no gateway UI needed)
Installment tracking: due dates, payment status, overdue alerts
payment.overdue event → WhatsApp reminder to student

Commit: feat(skillup): Sprint 4 — student management system
Stop and report.
```

---

### WINDOW 3 — SPRINT 5 PROMPT (Faculty Management System)

```
Execute SkillHubCore Sprint 5: Faculty Management System.
Reference: PHASE-FMS-ALL-PHASES.md

Goal: Faculty lifecycle, batch assignment, attendance, session tracking.

Step 1 — Faculty DB schema
Tables from PHASE-FMS-ALL-PHASES.md Part 2:
  faculty, faculty_availability, faculty_leaves,
  faculty_ratings, faculty_demo_classes
Add to packages/db-student (same service, different tables)

Step 2 — FacultyService (from PHASE-FMS-ALL-PHASES.md Part 3)
Implement all methods:
  createFacultyApplication, advanceLifecycleStatus,
  scheduleDemoClass, recordDemoOutcome,
  getFacultyWorkload, findAvailableFaculty, getFacultyMetrics

Step 3 — faculty-app (Next.js 15)
Create: apps/faculty-app/
Pages from PHASE-FMS-ALL-PHASES.md Part 4:
  dashboard, my-batches, sessions, attendance, assignments, exams, content, reports

Step 4 — Batch execution flow
From PHASE-FMS-EXECUTION.md Part 1:
  Before/during/after session workflow
  Attendance marking
  Subtopic coverage tracking → publishes batch.subtopics_covered event
  Tutorial-service consumes → marks subtopics as "introduced in class"

Step 5 — Assignment review workflow
From PHASE-FMS-EXECUTION.md Part 2:
  Student submits → AI pre-review → faculty sees AI score alongside submission
  Faculty approves/requests revision
  Approval → badge awarded

Commit: feat(skillup): Sprint 5 — faculty management system
Stop and report.
```

---

---

## DEPENDENCY MAP — WHEN WINDOWS CAN RUN TRULY IN PARALLEL

```
WEEK 1–2:
  Window 1: Chunk 7 (k6 scripts — no DB, no code change)      ← PARALLEL ✅
  Window 2: Sprint 0 (CLAUDE.md, packages/auth, packages/events, packages/db-tutorial)  ← PARALLEL ✅
  Window 3: Sprint 1 (packages/db-people, SkillHubCore identity service)  ← PARALLEL ✅

WEEK 3–4:
  Window 1: Chunk 8 (k6 CI integration)                       ← PARALLEL ✅
  Window 2: T1 (tutorial-app, DB migrations, subtopic page)   ← PARALLEL ✅
  Window 3: Sprint 2 (SSO + subscription engine)              ← PARALLEL ✅

WEEK 5–8:
  Window 1: Phase 4 Chunks 1–4 (event sourcing, real-time, resilience)  ← PARALLEL ✅
  Window 2: T2–T4 (AI generation, progress, assignments)      ← PARALLEL ✅
  Window 3: Sprint 3 (API Gateway deploy)                     ← PARALLEL ✅
  NOTE: Window 2 T2+ benefits from Window 3 Sprint 3 gateway being live
         but T1 and T2 can start without it

WEEK 9–12:
  Window 1: Phase 4 Chunks 5–9 (observability, IaC, docs)     ← PARALLEL ✅
  Window 2: T5–T6 (AI tutor, approval workflow, GCP deploy)   ← PARALLEL ✅
  Window 3: Sprint 4–5 (SMS + FMS)                            ← PARALLEL ✅

HARD DEPENDENCY (the only one):
  Window 3 Sprint 3 (gateway deployed) MUST complete before
  Window 2 T6 Step 5 (update gateway routing for tutorial-service)
  → If Window 3 is behind: Window 2 T6 skips Step 5 and does it later
```

---

## DAILY SYNC CHECKLIST

Before opening any window each day, paste this into your chat session:

```
Quick sync before we continue:
1. Run: pnpm lint:all && pnpm typecheck:all && pnpm test
2. Report: how many tests passing (must be >= 1138 + new tests)
3. Confirm: no regressions in existing exam engine
4. Then continue from where we left off.
```

---

## SECRETS STILL NEEDED (add before starting)

```bash
# GitHub Secrets (Settings → Secrets → Actions)
GCP_PROJECT_ID=project-48af6a2d-e8bb-46dd-a58
GCP_SERVICE_ACCOUNT=[JSON from service account key]
GCP_REGION=asia-south1
DATABASE_URL_PEOPLE=[Neon people-db connection string]
DATABASE_URL_TUTORIAL=[Neon tutorial-db connection string]
DATABASE_URL_PAYMENT=[Neon payment-db connection string]
DATABASE_URL_PLACEMENT=[Neon placement-db connection string]
K6_TEST_USER_EMAIL=k6-test@loadtest.example.com
K6_TEST_USER_PASSWORD=[set in admin dashboard]
K6_DOMAIN_ID=[get from DB query]
K6_TOPIC_ID=[get from DB query]
K6_BLUEPRINT_ID=[get from DB query]
ANTHROPIC_API_KEY=[for AI content generation in Tutorial Engine]
QSTASH_TOKEN=[already set]
QSTASH_CURRENT_SIGNING_KEY=[already set]
```

---

## COMMIT MESSAGE CONVENTION

```
Window 1: fix/chore/test(exam|load|resilience|observability|infra|docs): description (T130)
Window 2: feat(tutorial): description — T1/T2/T3 etc.
Window 3: feat(skillhubcore|skillup): description — Sprint N
```

---

*This document is the single source of truth for all 3 parallel workstreams.*
*Based on: ADR-CRITICAL-001, PHASE-T1-T6, PHASE-SKILLHUBCORE, PHASE-INFRA-GATEWAY,*
*PHASE-SMS, PHASE-FMS, content-json-schema, domain_specific_content_generation_framework,*
*Universal_Content_Generator_Architecture, PROJECT_STATUS, NEXT_ACTION, GCP_CHUNK7_PROMPT*

