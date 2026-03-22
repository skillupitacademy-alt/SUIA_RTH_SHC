# WINDOW 2 — TUTORIAL ENGINE
## Complete Guide for Antigravity Agent 2
## From first session to production deployment

---

## STEP 1 — Upload these 4 files BEFORE pasting the prompt

| # | File | Folder |
|---|---|---|
| 1 | `FAANG-COMPLIANCE-WINDOW2-WINDOW3.md` | outputs |
| 2 | `TUTORIAL-ENGINE-EXECUTION-PLAN.md` | uploads |
| 3 | `content-json-schema.md` | uploads |
| 4 | `MASTER-PLATFORM-ARCHITECTURE.md` | uploads |

---

## STEP 2 — Paste this opening prompt (every new session)

```
You are a senior full-stack engineer working on a 3-platform EdTech ecosystem
at d:\onlinewebsites\quiz-platform

Read all 4 uploaded files completely before writing a single line of code.

═══ YOUR IDENTITY ═══
Window 2 — Tutorial Engine builder.
You build: tutorial-service + packages/db-tutorial + apps/realtutorialhub-web

DO NOT TOUCH: api-server, web-app, admin-app (Exam Engine — COMPLETE, 1138 tests)

## ARCHITECTURAL DECISIONS (LOCKED)

1. Content generation is human-in-the-loop. No Anthropic API calls.
   - Admin uses external AI to generate 6-block JSON
   - Admin reviews and verifies quality
   - Admin pastes into GUI → system saves to DB only

2. AI Tutor uses Upstash Vector only. No Anthropic API.
   - On publish → index all 6 blocks into Upstash Vector via QStash
   - On student question → semantic search against subtopic vectors
   - Pre-generated qa_pairs serve instantly from JSON
   - No @anthropic-ai/sdk anywhere in tutorial-service

ANTHROPIC_API_KEY is not used in Window 2 or Window 3.


═══ WHAT YOU ARE BUILDING ═══
  services/tutorial-service/     → Hono API on GCP Cloud Run Mumbai
  packages/db-tutorial/          → Drizzle schema → tutorial-db (Neon)
  apps/realtutorialhub-web/      → Next.js 15 → notes.realtutorialhub.com

Both brands use this engine:
  RealTutorialHub students → self-study on notes.realtutorialhub.com
  SkillUp IT Academy students → same engine via SSO JWT (cross-platform)

═══ ARCHITECTURE ═══
  One Turborepo monorepo + separate Neon DB per service (ADR-CRITICAL-001)
  Tutorial DB: DATABASE_URL_TUTORIAL (pooled) + DATABASE_DIRECT_URL_TUTORIAL (migrations)
  Deployment: GCP Cloud Run asia-south1
  Content schema: content-json-schema.md is LOCKED — never modify

═══ CONTENT RULES ═══
  6 blocks per subtopic: notes, layman, real_life, technical, code, ai_tutor
  All 6 mandatory before publishing
  Learning flow: Layman → Real-Life → Technical → Code → AI Tutor → Assignment
  Never start with Technical

═══ FAANG COMPLIANCE — EVERY TASK ═══
  1. Tests alongside code — 90%+ coverage
  2. Repository pattern — IRepository interface → Drizzle implementation
  3. Dependency injection — constructor injection, no static methods
  4. DTOs — typed API responses, no raw DB rows
  5. Pino structured logging — no console.log
  6. Zod validation — every API input, 400 on failure
  7. Rate limiting — packages/auth rate-limit on every public endpoint
  8. QStash idempotency — worker checks key before processing
  9. Soft deletes — deleted_at column, never hard DELETE
  10. withTimeout() — 15s reads, 30s reports
  11. Cache-Control headers — read-only endpoints cached
  12. WCAG 2.1 AA — all UI components accessible

═══ EXAM ENGINE LINK ═══
  exam.completed event → tutorial-service creates remediation_triggers
  Shared keys: userId, subtopicId, domainId (soft refs, no SQL JOIN)

═══ QUALITY GATE — EVERY COMMIT ═══
  pnpm lint:all → zero errors
  pnpm typecheck:all → zero errors
  pnpm test → 1138+ passing (existing must not break)
  pnpm build:all → all apps build

═══ HOW TO EXECUTE TASKS ═══
  Step 1: Find task prompt in TUTORIAL-ENGINE-EXECUTION-PLAN.md
  Step 2: Find FAANG additions for that sprint in FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
  Step 3: Combine both → implement feature + compliance together
  Step 4: USER-GATED tasks → stop, show output, wait for approval
  Step 5: Run quality gate → commit with focused message

═══ START NOW ═══
Execute Sprint 0. Read the Sprint 0 section from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

5 tasks:
  1. Create root CLAUDE.md (with FAANG rules + 3-platform architecture)
  2. Extract packages/auth from api-server (JWT logic as shared package)
  3. Create packages/events (15 QStash event Zod schemas)
  4. Create packages/db-tutorial (all 10 schema files)
  5. Add TutorialContentJSON types to packages/types

After all 5:
  pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
  Must show: 1138+ tests passing
  Commit: "chore(platform): Sprint 0 — CLAUDE.md, packages/auth, packages/events, packages/db-tutorial"
  Stop and report.
```

---

## STEP 3 — Task sequence (follow in order)

### Sprint 0 — Foundation
Files already uploaded. No extra files needed.
```
Task → Sprint 0 (all 5 tasks in FAANG-COMPLIANCE file)
Commit → "chore(platform): Sprint 0 foundation"
Verify → 1138+ tests pass, 6 tables visible in Neon tutorial_prod
```

---

### Phase T1 — Tutorial DB + Repositories
**Add to upload list:** `PHASE-T1-T6-TUTORIAL-FOUNDATION.md`

```
Next task prompt to paste after Sprint 0 is committed:

Sprint 0 complete. Now execute Phase T1.
Read T1-A-01 from TUTORIAL-ENGINE-EXECUTION-PLAN.md.
Read T1 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Add to every T1 table: deleted_at (soft deletes) + version (INT default 1)
Apply withTimeout() to all repository queries.
Write unit tests alongside every repository — 90%+ coverage.

Execute in order: T1-A-01 → T1-A-02 → T1-A-03
Stop at T1-A-04 (USER-GATED — show me seed data before proceeding)
After T1-A-04 approved: T1-B-01 → T1-B-02 → T1-B-03
Run Sprint T1 Deep Audit from TUTORIAL-ENGINE-EXECUTION-PLAN.md
Commit: "feat(tutorial): T1 — DB schema, repositories, seed"
```

---

### Phase T2 — Content Blocks
**Add to upload list:** `PHASE-T1-T6-TUTORIAL-FOUNDATION.md` + `domain_specific_content_generation_framework.md`

```
T1 complete. Now execute Phase T2.
Read T2 prompts from TUTORIAL-ENGINE-EXECUTION-PLAN.md.
Read T2 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

T2-A-01 is USER-GATED (BlockRenderer) — show me all 6 block components before proceeding.
T2-B-01 is USER-GATED (Block editor) — show me admin editor before proceeding.
Add accessibility (WCAG 2.1 AA) to all block components.
Dynamic import CodeBlock and AITutorBlock with next/dynamic.
Add Cache-Control headers to all read-only content endpoints.
Run Sprint T2 Deep Audit.
Commit: "feat(tutorial): T2 — 6 content blocks, block editor, content API"
```

---

### Phase T3 — Subtopic Engine
**No new files needed.**

```
### ASSIGNMENT ENGINE ARCHITECTURAL DECISION (LOCKED)

Assignments are PRACTICE ONLY - no scoring, no evaluation.

This overrides the original T3 design in PHASE-T3-ASSIGNMENT-ENGINE.md.

What to build:
  -> assignment_progress table (completion tracking per tier)
  -> assignment_help_requests table (student help requests)
  -> Tier unlock based on completion not scores
  -> Student self-declares tier complete
  -> Faculty/admin sees open help requests

What NOT to build:
  -> No QStash scoring workers
  -> No score fields on any assignment table
  -> No pass/fail logic
  -> No assignment_sessions table
  -> No assignment_answers table
  -> No assignment_tier_unlocks table

Evaluation path:
  Projects (T4) -> certificates
  Exam Engine   -> formal evaluation
  Assignments   -> practice only

T2 complete. Now execute Phase T3.
Read T3 prompts from TUTORIAL-ENGINE-EXECUTION-PLAN.md.
Read T3 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

T3-A-01 is USER-GATED (subtopic page) — show me the learner view.
Add Redis idempotency to progress marking.
T3-A-03 (remediation bridge) consumes exam.completed QStash event —
  implement idempotency check + dead letter queue.
Run Sprint T3 Deep Audit.
Commit: "feat(tutorial): T3 — subtopic engine, progress, remediation bridge"
```

---

### Phase T4 — Assignments + Projects
**Add to upload list:** `TUTORIAL-ENGINE-BLUEPRINT.md`

```
T3 complete. Now execute Phase T4.
Read T4 prompts from TUTORIAL-ENGINE-EXECUTION-PLAN.md.
Read T4 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Use Strategy pattern for EvaluatorFactory (MCQ/ShortAnswer/Project evaluators).
Use State machine for assignment status transitions.
Submission must be async: POST → 202 Accepted → QStash → worker reviews.
T4-A-02 is USER-GATED — show me submission flow before proceeding.
Run Sprint T4 Deep Audit.
Commit: "feat(tutorial): T4 — assignments, project system, async review"
```

---

### Phase T5 — Video Integration
**No new files needed.**

```
T4 complete. Now execute Phase T5.
Read T5 prompts from TUTORIAL-ENGINE-EXECUTION-PLAN.md.

T5-A-01 is USER-GATED — show me VideoBlock component.
Lazy load: video iframe only when visible (IntersectionObserver).
Accessibility: caption track, aria-label on iframe.
Commit: "feat(tutorial): T5 — video integration"
```

---

### Phase T6 — AI Tutor
**Add to upload list:** `TUTORIAL-ENGINE-BLUEPRINT.md`

```
T5 complete. Now execute Phase T6.
Read T6 prompts from TUTORIAL-ENGINE-EXECUTION-PLAN.md.
Read T6 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Rate limit: 10 questions/student/hour.
Feature gate: subscription.features.includes('ai_tutor') → 402 if missing.

AI Tutor uses Upstash Vector only — no Anthropic API.
On student question → semantic search against subtopic vectors.
Pre-generated qa_pairs serve instantly from JSON.
Remove any @anthropic-ai/sdk imports if present.

T6-A-02 is USER-GATED — show me AI Tutor chat UI.
Run Sprint T6 Deep Audit.
Commit: "feat(tutorial): T6 — AI tutor with rate limiting + feature gating"
```

---

### Phase T7 — Remediation Engine
**Add to upload list:** `TUTORIAL-ENGINE-BLUEPRINT.md`

```
T6 complete. Now execute Phase T7.
Read T7 prompts from TUTORIAL-ENGINE-EXECUTION-PLAN.md.
Read T7 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Implement Saga pattern for exam → remediation → notification chain.
Create materialized view mv_student_weak_areas.
T7-A-03 is USER-GATED — show me remediation dashboard.
Run Sprint T7 Deep Audit.
Commit: "feat(tutorial): T7 — remediation engine, saga, materialized view"
```

---

### Phase T8 — Admin + Content Management
**Add to upload list:** `LMS-VIBE-CODING-PROMPTS.md`



```
T7 complete. Now execute Phase T8.
Read T8 prompts from TUTORIAL-ENGINE-EXECUTION-PLAN.md.
Read T8 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

Add content versioning: every publish creates TutorialContentVersionService snapshot.
Add audit trail: every admin action logged.
Add SEO: generateMetadata on all subtopic pages.
T8-A-01 is USER-GATED — show me content management dashboard.

Content Management Dashboard follows Question Bank Factory pattern:
- TutorialPromptService generates prompt embedding content-json-schema.md structure
- Admin copies prompt → pastes in external AI → gets JSON back
- Admin pastes JSON into ingest box → Zod validates
- Admin previews all 6 blocks as student sees them
- Save → draft | Publish → live + QStash triggers Vector indexing
- Two separate steps: save and publish are never combined


Run Sprint T8 Deep Audit.
Commit: "feat(tutorial): T8 — admin content management, versioning, audit"



```

---

### RTH-1 — realtutorialhub-web Frontend
**Upload list:** `GATEWAY-RTH-WEB-EXECUTION-PLAN.md` + `tutorial-subtopic-page_prompt.md`

```
T8 complete. Now build apps/realtutorialhub-web.
Read RTH-1 prompts from GATEWAY-RTH-WEB-EXECUTION-PLAN.md.
Read RTH-1 FAANG additions from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md.

RTH-1-A-01: scaffold — install next-pwa, next-intl, match existing app design
RTH-1-A-02 is USER-GATED (subtopic page) — show me all 6 blocks rendering
RTH-1-A-03: AI Tutor chat wiring
RTH-1-A-04: GCP Cloud Run deployment + Cloudflare DNS update

Lighthouse mobile score must be ≥ 90 before calling RTH-1 done.
Commit: "feat(tutorial): RTH-1 — realtutorialhub-web live on notes.realtutorialhub.com"
```

---

## WINDOW 2 DONE CHECKLIST

```
□ pnpm test → 1138+ passing (no regressions)
□ pnpm typecheck:all → zero errors
□ pnpm build:all → all apps build
□ Neon tutorial_prod → all 16 tables visible
□ GET tutorial-service/healthz → 200 from GCP URL
□ notes.realtutorialhub.com loads subtopic learning page
□ All 6 content blocks render correctly
□ AI Tutor responds + rate limited at 10/hour
□ exam.completed → remediation plan created correctly
□ Lighthouse mobile ≥ 90 (Performance + Accessibility + SEO + PWA)
□ axe-core: zero WCAG violations on subtopic page
□ Content versioning: publish creates snapshot
□ Admin can approve/reject content
```

---

## EXTRA FILES — Add only when needed

| When | Add this file |
|---|---|
| T3 remediation work | `TUTORIAL-ENGINE-BLUEPRINT.md` |
| T6 AI Tutor work | `TUTORIAL-ENGINE-BLUEPRINT.md` |
| T8 admin UI | `LMS-VIBE-CODING-PROMPTS.md` |
| RTH-1 frontend | `tutorial-subtopic-page_prompt.md` |
| RTH-1 frontend | `GATEWAY-RTH-WEB-EXECUTION-PLAN.md` |
| SEO work | `seo_and_social_prompt.md` |
| PWA work | `progressive_web_app_prompt.md` |
| i18n work | `internationalization_prompt.md` |
| T8 image support | `tutorial-subtopic-page.prompt.md` |

---

## Prompt 19 Image Support Notes

- Use the confirmed storage variables exactly as already set in this project
- Do not introduce `DATABASE_TUTORIAL_URL`; keep the existing environment naming conventions intact
- Add image support only to the 5 eligible blocks
- Keep `ai_tutor` image-free
- Standard SVG images should be code components, not uploaded assets
- R2 images should be admin-uploaded and served from the trusted CDN
- Append the image migration as `0001_image_support.sql`
