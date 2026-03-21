# Tutorial Engine — Content Generation Execution Plan

> **Phase-by-Phase · Sprint-Organized · AI-Prompt-Driven**
> Mirrors: Quiz Platform Generation Process
> Cross-reference: `TUTORIAL-ENGINE-BLUEPRINT.docx`

---

## How to Use This Document

This document is the execution companion to `TUTORIAL-ENGINE-BLUEPRINT.docx`. It organizes Tutorial content generation into 8 phases with individual tasks, each carrying a ready-to-paste AI prompt. Follow the same discipline used for Quiz Platform generation.

### Process Rules (same as Quiz Platform)

- Start a **fresh AI chat** for every task — never continue across task boundaries
- Paste the **▶ AI PROMPT** verbatim into the new chat before adding any context
- Mark tasks **DONE** only when code is committed and tests pass — not when AI says it is done
- **⚠ USER-GATED** tasks require you to review output before proceeding to the next task
- Run the **Deep Audit checklist** at the end of every sprint before moving to the next
- **Carry-forward tasks** must be resolved before the phase they block can begin

### Phase → Sprint → Task Hierarchy

| Level | Description |
|-------|-------------|
| **Phase (T1–T8)** | A major functional milestone (e.g., DB schema, content blocks, AI tutor) |
| **Sprint** | A batch of tasks within a phase that can run in parallel after their deps are met |
| **Task** | A single unit of work with one AI prompt, one set of outputs, one done-condition |
| **Deep Audit** | Run after each sprint to validate actual vs claimed completion (like Quiz Platform audit) |

---

## Phase Overview

| Phase | Description / Key Deliverables |
|-------|-------------------------------|
| **T1 — Foundation** | DB schema (tutorial_content, tutorial_progress, tutorial_project_submissions), Drizzle ORM models, seed scripts, Repository pattern for tutorial data |
| **T2 — Content Blocks** | 6-block renderer (Notes, Layman, Real-Life, Technical, Code, AI-Tutor), block editor UI, JSONB content storage, content versioning |
| **T3 — Subtopic Engine** | Subtopic navigation, block-level progress tracking, completion gates, remediation trigger bridge from Exam scores |
| **T4 — Project System** | 3-tier project hierarchy (Topic/Subject/Domain), difficulty-gated assignment rules, project submission flow, grading scaffold |
| **T5 — Video Integration** | Video block type, required-video gate for Mixed+ difficulty, progress tracking per video, transcript storage |
| **T6 — AI Tutor Service** | Per-block AI tutor chat, context injection (block content + user history), QStash queue, rate limiting, feedback loop |
| **T7 — Remediation Engine** | Exam-score-to-tutorial bridge, auto-assign subtopics from weak areas, re-assessment trigger after tutorial completion |
| **T8 — Admin & Content Mgmt** | Content authoring UI, block CRUD, difficulty settings, publish/draft workflow, audit log |

### Dependency Chain

```
T1 (Foundation) → T2, T3 (parallel) → T4, T5 (parallel after T2+T3) → T6 (after T2+T3) → T7 (after T6+T3) → T8 (after T2)
```

---

## Phase T1 — Foundation

Establish the database schema, Drizzle ORM models, and repository pattern for all Tutorial Engine data. This phase **MUST complete** before any content or UI work begins.

---

### Sprint T1-A — Database Schema

#### T1-A-01 · Create `tutorial_content` table (JSONB blocks) · `SCHEMA` · M

- **Dependencies:** Phase 2 DB transaction pattern must exist
- **Outputs:** migration file, drizzle schema, indexes on subtopic_id + difficulty

**▶ AI PROMPT**
```
Create a Drizzle ORM schema for a `tutorial_content` table. It stores subtopic content as JSONB with this structure: { blocks: [{ type: 'notes'|'layman'|'real-life'|'technical'|'code'|'ai-tutor', content: string, order: number }] }. Fields: id (uuid), subtopic_id (uuid FK), difficulty ('simple'|'mixed'|'intermediate'|'expert'), blocks (jsonb), version (int default 1), published (bool default false), created_at, updated_at. Add GIN index on blocks for search. Use existing project DB transaction pattern. Output: migration SQL + drizzle schema file.
```

---

#### T1-A-02 · Create `tutorial_progress` table · `SCHEMA` · S

- **Dependencies:** T1-A-01
- **Outputs:** migration, drizzle model, composite unique(user_id, subtopic_id)

**▶ AI PROMPT**
```
Create a Drizzle ORM schema for `tutorial_progress`. Fields: id (uuid), user_id (uuid FK users), subtopic_id (uuid FK), blocks_completed (jsonb array of completed block types), completed_at (timestamp nullable), remediation_triggered (bool default false), created_at, updated_at. Add composite unique constraint on (user_id, subtopic_id). Output: migration SQL + drizzle schema.
```

---

#### T1-A-03 · Create `tutorial_project_submissions` table · `SCHEMA` · M

- **Dependencies:** T1-A-01
- **Outputs:** migration, drizzle model, status enum, grading fields

**▶ AI PROMPT**
```
Create a Drizzle ORM schema for `tutorial_project_submissions`. Fields: id (uuid), user_id (uuid FK), project_id (uuid), project_level ('topic'|'subject'|'domain'), difficulty ('simple'|'mixed'|'intermediate'|'expert'), submission_content (jsonb), status ('pending'|'submitted'|'graded'|'revision-requested'), score (int nullable), feedback (text nullable), video_required (bool), video_url (text nullable), submitted_at (timestamp nullable), graded_at (timestamp nullable), created_at, updated_at. Output: migration SQL + drizzle schema.
```

---

#### T1-A-04 · Seed script for tutorial content · `SCHEMA` · S · ⚠ USER-GATED

- **Dependencies:** T1-A-01, T1-A-02
- **Outputs:** seed.ts file with sample subtopic + all 6 block types populated

**▶ AI PROMPT**
```
Write a TypeScript seed script for the tutorial engine. It should create: 1 sample subtopic with all 6 block types (notes, layman, real-life, technical, code, ai-tutor) populated with meaningful placeholder content for a 'JavaScript Promises' topic. Use the existing project seed pattern. Output: apps/tutorial-app/db/seed.ts
```

---

### Sprint T1-B — Repository Pattern

#### T1-B-01 · TutorialContentRepository · `SERVICE` · M

- **Dependencies:** T1-A-01, Phase 2 Repository Pattern
- **Outputs:** repository class: getBySubtopic, getByDifficulty, upsertBlocks, publish

**▶ AI PROMPT**
```
Using the existing Repository pattern in this project, create a `TutorialContentRepository` class. Methods: getBySubtopicId(subtopicId: string, difficulty?: Difficulty), getPublished(subtopicId: string), upsertBlocks(subtopicId: string, difficulty: Difficulty, blocks: Block[]), publish(contentId: string), getVersionHistory(contentId: string). Use Drizzle ORM. All DB calls wrapped in the project's existing transaction wrapper. Output: apps/tutorial-app/repositories/tutorial-content.repository.ts
```

---

#### T1-B-02 · TutorialProgressRepository · `SERVICE` · M

- **Dependencies:** T1-A-02, T1-B-01
- **Outputs:** repository: getProgress, markBlockComplete, isSubtopicComplete

**▶ AI PROMPT**
```
Create a `TutorialProgressRepository` class using the existing Repository pattern. Methods: getProgress(userId: string, subtopicId: string), markBlockComplete(userId: string, subtopicId: string, blockType: BlockType), isSubtopicComplete(userId: string, subtopicId: string), getCompletedSubtopics(userId: string), resetProgress(userId: string, subtopicId: string) [admin only]. Output: apps/tutorial-app/repositories/tutorial-progress.repository.ts
```

---

#### T1-B-03 · ProjectSubmissionRepository · `SERVICE` · M

- **Dependencies:** T1-A-03
- **Outputs:** repository: submit, grade, getPending, getByUser

**▶ AI PROMPT**
```
Create a `ProjectSubmissionRepository` class using the existing Repository pattern. Methods: submit(data: SubmitProjectDTO), grade(submissionId: string, score: number, feedback: string), getPendingSubmissions(projectId?: string), getByUser(userId: string, level?: ProjectLevel), requiresVideo(projectId: string, difficulty: Difficulty). Output: apps/tutorial-app/repositories/project-submission.repository.ts
```

---

### Sprint T1 Deep Audit

> Run BEFORE starting T2

- [ ] All 3 migration files exist and run cleanly on fresh DB (`npx drizzle-kit migrate`)
- [ ] All 3 Drizzle schema files are in the correct path and exported from index
- [ ] All 3 Repository classes have unit tests (min 3 tests each) — not just type checks
- [ ] Seed script runs without error and inserts valid data for all 6 block types
- [ ] Repository methods use transactions where required by business rules
- [ ] No repository method calls the DB directly (bypassing transaction wrapper)
- [ ] CI passes: type-check + lint + test

---

## Phase T2 — Content Blocks

Build the 6-block content renderer and editor. This is the core of the Tutorial Engine — every subtopic displays content through these 6 block types.

| Block Type | Purpose + Render Target |
|------------|------------------------|
| `notes` | Structured markdown notes — primary reference content. Renders as formatted prose. |
| `layman` | Plain-English explanation for beginners. Renders with simplified vocabulary badge. |
| `real-life` | Real-world analogy or scenario. Renders with highlighted example card. |
| `technical` | In-depth technical breakdown for advanced learners. Renders with depth badge. |
| `code` | Interactive code example with syntax highlighting. Renders with run/copy controls. |
| `ai-tutor` | AI-powered Q&A for this block's content. Renders as embedded chat interface. |

---

### Sprint T2-A — Block Renderer

#### T2-A-01 · BlockRenderer component (all 6 types) · `CONTENT` · L · ⚠ USER-GATED

- **Dependencies:** T1 complete
- **Outputs:** BlockRenderer.tsx, individual block components, Storybook stories

**▶ AI PROMPT**
```
Create a `BlockRenderer` React component in the tutorial app that renders all 6 block types from a Block[] array. Each block type needs its own sub-component: NotesBlock (markdown), LaymanBlock (simplified card with 'Plain English' badge), RealLifeBlock (scenario card with highlight border), TechnicalBlock (deep-dive card with 'Technical' badge), CodeBlock (syntax-highlighted with copy button, language label), AITutorBlock (placeholder chat UI — wire-up in T6). Use Tailwind CSS. Each block must have: aria-label, loading skeleton state, error boundary. Output: apps/tutorial-app/components/blocks/ directory.
```

---

#### T2-A-02 · Block navigation and progress indicators · `CONTENT` · M

- **Dependencies:** T2-A-01
- **Outputs:** BlockNav component, per-block completion checkbox, progress bar

**▶ AI PROMPT**
```
Create a `BlockNavigation` component that shows progress through all 6 blocks in a subtopic. Features: vertical stepper showing each block name with completion status, current block highlighted, locked blocks grayed out (if sequential mode enabled), overall progress bar (X/6 blocks complete), keyboard navigation (arrow keys). Wire to TutorialProgressRepository via server action. Output: apps/tutorial-app/components/BlockNavigation.tsx
```

---

#### T2-A-03 · Content versioning UI · `CONTENT` · M

- **Dependencies:** T2-A-01, T1-B-01
- **Outputs:** VersionHistory component, restore-to-version action

**▶ AI PROMPT**
```
Create a `ContentVersionHistory` component for the tutorial admin panel. Shows: version number, timestamp, who changed it, a diff-style preview of changes. Button to restore to any previous version (calls repository.restoreVersion). Only visible to admin role. Output: apps/tutorial-app/components/admin/ContentVersionHistory.tsx + server action.
```

---

### Sprint T2-B — Content Editor

#### T2-B-01 · Block editor (CRUD for all 6 block types) · `CONTENT` · L · ⚠ USER-GATED

- **Dependencies:** T2-A-01, T1-B-01
- **Outputs:** BlockEditor.tsx, per-block edit form, save/discard, draft mode

**▶ AI PROMPT**
```
Create a `BlockEditor` admin component to create and edit tutorial content blocks. Features: tab interface to switch between 6 block types, rich text editor for notes/layman/real-life/technical (use @tiptap/react), code editor for code blocks (use @monaco-editor/react with language selector), AI tutor config form (system prompt override, temperature). Autosave as draft. Publish button requires all 6 blocks to be filled. Output: apps/tutorial-app/components/admin/BlockEditor.tsx
```

---

#### T2-B-02 · Content API routes (CRUD) · `SERVICE` · M

- **Dependencies:** T2-B-01, T1-B-01
- **Outputs:** app/api/tutorial/content/route.ts, GET/POST/PUT/DELETE

**▶ AI PROMPT**
```
Create Next.js App Router API routes for tutorial content management. Routes: GET /api/tutorial/content?subtopicId=&difficulty= (get published blocks), POST /api/tutorial/content (create with blocks array, admin only), PUT /api/tutorial/content/:id (update blocks, increments version), DELETE /api/tutorial/content/:id (soft delete, admin only), POST /api/tutorial/content/:id/publish (publish draft, user-gated validation). Use the existing auth middleware pattern. Output: apps/tutorial-app/app/api/tutorial/content/
```

---

### Sprint T2 Deep Audit

- [ ] All 6 block types render without errors (visual check + E2E test)
- [ ] Keyboard navigation works through all blocks (Tab, Enter, Arrow keys)
- [ ] Each block has accessible aria-label and passes axe-core scan
- [ ] BlockEditor saves draft on every keystroke (debounced) — verify in DevTools network tab
- [ ] Publish button is disabled until all 6 blocks have content (> 10 chars)
- [ ] Version history shows correct diffs when content is edited 3+ times
- [ ] API routes return 401 for unauthenticated, 403 for non-admin on write routes
- [ ] CI passes

---

## Phase T3 — Subtopic Engine

Build the learner-facing subtopic navigation, block-level progress tracking, completion gates, and the remediation trigger bridge from Exam Engine scores.

---

### Sprint T3-A — Navigation & Progress

#### T3-A-01 · Subtopic page (learner view) · `CONTENT` · L · ⚠ USER-GATED

- **Dependencies:** T2 complete
- **Outputs:** app/subtopic/[id]/page.tsx, full block rendering, progress persistence

**▶ AI PROMPT**
```
Create the learner subtopic page at apps/tutorial-app/app/subtopic/[subtopicId]/page.tsx. It should: fetch published blocks for the subtopic using TutorialContentRepository, render all 6 blocks via BlockRenderer, show BlockNavigation sidebar, save block completion on scroll-past (IntersectionObserver — mark block complete when 80% visible for 3+ seconds), show a 'Subtopic Complete' modal when all 6 blocks are done, handle loading/error states. Use Suspense boundaries. Output: full page + server components.
```

---

#### T3-A-02 · Completion gate logic · `SERVICE` · M

- **Dependencies:** T3-A-01, T1-B-02
- **Outputs:** completion service, gate rules, server action for marking complete

**▶ AI PROMPT**
```
Create a `SubtopicCompletionService` that enforces completion gates. Rules: all 6 blocks must be marked complete to unlock the next subtopic, 'simple' difficulty can be completed in any order, 'mixed' and above must complete blocks in order (notes→layman→real-life→technical→code→ai-tutor), completion triggers a check for pending project assignments. Create a server action `markSubtopicComplete(userId, subtopicId)` that validates gates and updates DB. Output: apps/tutorial-app/services/subtopic-completion.service.ts
```

---

#### T3-A-03 · Remediation trigger bridge · `SERVICE` · L · ⚠ USER-GATED

- **Dependencies:** T3-A-02
- **Outputs:** remediationBridge service: maps exam weak areas to subtopics, auto-assigns

**▶ AI PROMPT**
```
Create a `RemediationBridgeService` that connects Exam Engine results to Tutorial Engine assignments. It should: accept an exam result payload { userId, examId, weakTopicIds: string[], scores: Record<topicId, number> }, find tutorial subtopics mapped to those topic IDs, create tutorial_progress records with remediation_triggered=true for each mapped subtopic, emit a 'remediation.assigned' event via the project's Event Bus, return a summary of assigned subtopics. This is a critical cross-engine integration — use the existing Event Bus pattern. Output: apps/tutorial-app/services/remediation-bridge.service.ts
```

---

### Sprint T3 Deep Audit

- [ ] Subtopic page loads and renders all 6 blocks in < 2s (measure with Lighthouse)
- [ ] IntersectionObserver correctly marks blocks complete only after 3s of visibility
- [ ] Completion gate blocks navigation to next subtopic until all 6 blocks are done
- [ ] Sequential block order enforced for mixed/intermediate/expert difficulty
- [ ] RemediationBridgeService emits correct Event Bus event (check event log)
- [ ] Remediation assignments show distinct UI badge vs. regular progress
- [ ] No N+1 queries on subtopic page (check Drizzle query log)

---

## Phase T4 — Project System

Implement the 3-tier project hierarchy (Topic/Subject/Domain), difficulty-gated assignment rules, and the submission + grading flow.

| Project Level | Scope + Difficulty Gate |
|--------------|------------------------|
| **Topic-level** | Covers a single topic's subtopics. Available at Simple (3–5 tasks) and Mixed (6–10 tasks, video required). |
| **Subject-level** | Covers all topics in a subject. Intermediate (8–12 tasks, video required). Requires all Topic projects complete. |
| **Domain-level** | Capstone covering all subjects in domain. Expert (12–20 tasks, video required). Requires all Subject projects complete. |

---

### Sprint T4-A — Project Assignment Engine

#### T4-A-01 · Project assignment rules engine · `SERVICE` · L

- **Dependencies:** T3 complete, T1-B-03
- **Outputs:** ProjectAssignmentService: getAvailableProjects, checkEligibility, assignProject

**▶ AI PROMPT**
```
Create a `ProjectAssignmentService` that enforces difficulty-gated project rules. Rules: Simple projects unlock when subtopic content is complete, Mixed projects require Simple project completion + video block viewed, Intermediate projects require all Topic-level projects complete for the subject, Expert projects require all Subject-level projects complete for the domain. Methods: getAvailableProjects(userId, topicId), checkEligibility(userId, projectId, difficulty), assignProject(userId, projectId), getProjectStatus(userId, projectId). Use TutorialProgressRepository + ProjectSubmissionRepository. Output: apps/tutorial-app/services/project-assignment.service.ts
```

---

#### T4-A-02 · Project submission flow · `CONTENT` · M · ⚠ USER-GATED

- **Dependencies:** T4-A-01
- **Outputs:** submission page, form validation, video upload gate

**▶ AI PROMPT**
```
Create the project submission page at apps/tutorial-app/app/project/[projectId]/submit/page.tsx. Features: displays project requirements and difficulty rules, submission form (textarea + file attachments), video upload field (required if video_required=true — validate presence before submit), confirm submission modal showing task count vs difficulty expected range, submits to POST /api/tutorial/project/submit. Show clear error if video is missing for Mixed+ difficulty. Output: full page + API route.
```

---

#### T4-A-03 · Grading scaffold (admin panel) · `CONTENT` · M

- **Dependencies:** T4-A-02
- **Outputs:** admin grading page, score input, feedback form, grade action

**▶ AI PROMPT**
```
Create an admin grading page at apps/tutorial-app/app/admin/grading/page.tsx. Shows: list of pending submissions with filters (project level, difficulty, submission date), individual submission view with all submitted content and video, score input (0–100), feedback textarea (required), grade button (calls ProjectSubmissionRepository.grade), request-revision button. Grading triggers an event via Event Bus: 'project.graded' with score + userId. Output: admin grading UI + server actions.
```

---

### Sprint T4 Deep Audit

- [ ] Simple projects cannot be submitted if subtopic is not complete (test with fresh user)
- [ ] Mixed+ projects are blocked without video upload (submit button disabled, not just validation error)
- [ ] Task count validated against difficulty range (3–5 for Simple) — enforced server-side
- [ ] Grading emits `project.graded` event verifiable in Event Bus log
- [ ] Admin grading page requires admin role (test with non-admin token → 403)
- [ ] Revision-requested status re-opens submission form for learner

---

## Phase T5 — Video Integration

Add video as a required content element for Mixed+ difficulty. Includes the video block renderer, progress tracking per video, and transcript storage.

---

### Sprint T5-A — Video Block

#### T5-A-01 · VideoBlock component + progress tracking · `CONTENT` · L · ⚠ USER-GATED

- **Dependencies:** T2 complete
- **Outputs:** VideoBlock.tsx, video progress tracker, completion event on watched 80%

**▶ AI PROMPT**
```
Create a `VideoBlock` React component for the tutorial content system. Features: embeds video (support YouTube and Mux URLs), tracks watch progress via onTimeUpdate event, marks video as 'watched' when 80% of duration is reached, stores watch progress in tutorial_progress.blocks_completed (as { type: 'video', watched: true, watchedAt: timestamp }), shows a 'Watched' badge after completion, skipping not allowed for first watch of Mixed+ difficulty projects. Output: apps/tutorial-app/components/blocks/VideoBlock.tsx + server action for progress.
```

---

#### T5-A-02 · Transcript storage and display · `SCHEMA` · M

- **Dependencies:** T5-A-01
- **Outputs:** transcript column in tutorial_content, TranscriptPanel component, search

**▶ AI PROMPT**
```
Extend the tutorial_content schema to include a transcript field (jsonb, nullable): { segments: [{ start: number, end: number, text: string }] }. Create a `TranscriptPanel` component that: shows the transcript alongside the video, highlights the current segment as video plays (synced via currentTime), allows text search within transcript (highlight matching segments), clicking a segment seeks video to that timestamp. Output: migration + TranscriptPanel.tsx.
```

---

### Sprint T5 Deep Audit

- [ ] Video marked complete only after 80% watched (not on load, not on pause)
- [ ] Skipping video is blocked for first-watch on Mixed+ difficulty (`seeked` event handled)
- [ ] Transcript highlights sync within 500ms of video position
- [ ] Transcript search highlights all matching segments, not just first
- [ ] Video progress persists on page refresh (check tutorial_progress JSONB value)

---

## Phase T6 — AI Tutor Service

Build the per-block AI Tutor chat interface. Each AI Tutor block has its own context window seeded with the block's content. Questions and answers are queued via QStash for resilience.

---

### Sprint T6-A — AI Tutor Core

#### T6-A-01 · AI Tutor API route + QStash queue · `SERVICE` · L

- **Dependencies:** T2 complete, QStash configured in Phase 2
- **Outputs:** POST /api/tutorial/ai-tutor, QStash publish + consumer route, rate limiter

**▶ AI PROMPT**
```
Create the AI Tutor service for the tutorial engine. POST /api/tutorial/ai-tutor receives { userId, subtopicId, blockType, question }. It: validates user has completed up to the ai-tutor block, builds a system prompt seeded with the block's content (notes + technical blocks as context), publishes the job to QStash queue 'tutorial-ai-tutor', returns { jobId } immediately. Create the QStash consumer at /api/tutorial/ai-tutor/consumer that calls the LLM (use existing project LLM client), stores the response in a new `tutorial_ai_tutor_responses` table ({ id, userId, subtopicId, question, answer, createdAt }), and pushes result to client via Pusher/SSE. Include rate limiter: 20 questions per user per day. Output: route files + QStash consumer + DB migration.
```

---

#### T6-A-02 · AITutorBlock chat UI (wire-up) · `CONTENT` · M · ⚠ USER-GATED

- **Dependencies:** T6-A-01
- **Outputs:** AITutorBlock.tsx fully wired, message history, streaming response UI

**▶ AI PROMPT**
```
Wire up the `AITutorBlock` component (previously a placeholder from T2-A-01) to the real AI Tutor API. Features: chat input with send button + Enter key, message history (show last 10 Q&As), streaming response display (show typing indicator while QStash job processes), error state if rate limit exceeded (show 'X questions remaining today'), block is locked until all other 5 blocks are complete (show gate message). Load previous Q&A history from tutorial_ai_tutor_responses. Output: updated AITutorBlock.tsx.
```

---

### Sprint T6 Deep Audit

- [ ] AI Tutor is locked until all 5 other blocks are complete (test with partial progress)
- [ ] Rate limiter returns 429 after 20 questions — check DB counter is per-day (resets at midnight UTC)
- [ ] QStash job confirmed received and processed (check QStash dashboard)
- [ ] Response stored in `tutorial_ai_tutor_responses` with correct subtopic + block context
- [ ] Chat history loads previous Q&As on page refresh
- [ ] System prompt correctly includes the block content (verify in LLM request log)

---

## Phase T7 — Remediation Engine

Complete the exam-to-tutorial remediation loop: after a failed exam, weak topics are auto-assigned as tutorial subtopics. After tutorial completion, a re-assessment is triggered.

---

### Sprint T7-A — Full Remediation Loop

#### T7-A-01 · Exam result webhook handler · `SERVICE` · M

- **Dependencies:** T6 complete, T3-A-03
- **Outputs:** POST /api/tutorial/remediation/exam-result webhook, event handler

**▶ AI PROMPT**
```
Create a webhook endpoint POST /api/tutorial/remediation/exam-result that receives exam completion results from the Exam Engine. Payload: { userId, examId, topicScores: Record<topicId, number>, passingThreshold: number }. Logic: filter topics with score < passingThreshold, call RemediationBridgeService.assign(userId, weakTopicIds), return { assignedSubtopics: string[] }. Secure with HMAC signature (use existing webhook security pattern in the project). Output: apps/tutorial-app/app/api/tutorial/remediation/exam-result/route.ts
```

---

#### T7-A-02 · Re-assessment trigger after tutorial completion · `SERVICE` · M

- **Dependencies:** T7-A-01, T3-A-02
- **Outputs:** reassessment service: watches remediation progress, emits exam.retake event

**▶ AI PROMPT**
```
Create a `ReassessmentTriggerService` that monitors remediation progress. When all remediation-assigned subtopics are completed for a given examId, it should: fetch the original exam details, emit an 'exam.retake.ready' event via Event Bus with { userId, examId, completedSubtopics }, mark remediation_triggered=false on the completed progress records. Schedule this check to run on every subtopic completion via the existing job queue. Output: apps/tutorial-app/services/reassessment-trigger.service.ts
```

---

#### T7-A-03 · Remediation dashboard (learner view) · `CONTENT` · M · ⚠ USER-GATED

- **Dependencies:** T7-A-01
- **Outputs:** remediation status page, assigned subtopics with exam context, progress bar

**▶ AI PROMPT**
```
Create a learner-facing remediation dashboard at apps/tutorial-app/app/remediation/page.tsx. Shows: which exam triggered the remediation, list of assigned subtopics with completion status (green check / gray circle), overall remediation progress bar (X/Y subtopics complete), estimated time to re-assessment (based on average completion time), a 'Ready for Re-assessment' banner when all subtopics are complete. Filter to show only active remediations (not historical). Output: full page + server components.
```

---

### Sprint T7 Deep Audit

- [ ] Webhook rejects requests with invalid HMAC signature (test with wrong secret → 401)
- [ ] Remediation subtopics show distinct badge vs regular subtopics in learner view
- [ ] `exam.retake.ready` event emitted exactly once (not on every subtopic completion)
- [ ] Re-assessment event contains correct examId (not a different exam)
- [ ] Historical remediations (completed) do not appear on the active dashboard
- [ ] Learner cannot trigger re-assessment manually (button only appears when all subtopics complete)

---

## Phase T8 — Admin & Content Management

Build the content authoring admin panel, difficulty settings management, publish/draft workflow, and audit log for all content changes.

---

### Sprint T8-A — Admin Panel

#### T8-A-01 · Content management dashboard · `CONTENT` · L · ⚠ USER-GATED

- **Dependencies:** T2-B-01, T2-B-02
- **Outputs:** admin/content/page.tsx, subtopic list, status badges, bulk actions

**▶ AI PROMPT**
```
Create the tutorial content management admin dashboard at apps/tutorial-app/app/admin/content/page.tsx. Features: table of all subtopics with columns (name, difficulty, published status, last edited, block completion %, version), filter by difficulty/published status/domain, bulk publish/unpublish, click row to open BlockEditor for that subtopic, inline status toggle (draft↔published), pagination (50 per page). Use server components for initial load + optimistic updates for status toggles. Output: full admin page.
```

---

#### T8-A-02 · Audit log for content changes · `SERVICE` · M

- **Dependencies:** T8-A-01
- **Outputs:** tutorial_content_audit table, audit log viewer, who changed what when

**▶ AI PROMPT**
```
Add an audit log to the tutorial content system. Create a migration for `tutorial_content_audit` table: { id, content_id (FK), user_id, action ('created'|'updated'|'published'|'unpublished'|'restored'), diff (jsonb, nullable), created_at }. Add audit logging to all TutorialContentRepository write methods (inject userId). Create an admin audit log viewer at /admin/content/audit showing a chronological feed of changes with filters (by user, by action, by date range). Output: migration + repository updates + audit log page.
```

---

#### T8-A-03 · Difficulty settings manager · `CONTENT` · M

- **Dependencies:** T8-A-01
- **Outputs:** admin difficulty config page, task count rules, video requirement toggle

**▶ AI PROMPT**
```
Create a difficulty settings admin page at apps/tutorial-app/app/admin/difficulty/page.tsx. Manages the rules for each difficulty level: Simple (task count range 3–5, video not required), Mixed (task count range 6–10, video required), Intermediate (task count range 8–12, video required), Expert (task count range 12–20, video required). Store settings in a `tutorial_difficulty_config` table (not hardcoded). Settings changes take effect on new submissions only. Show current settings in a table with inline edit. Output: full config page + migration.
```

---

### Sprint T8 Deep Audit

- [ ] Admin pages all require admin role — test all routes with learner token → 403
- [ ] Audit log entries created for every write operation (create, update, publish, restore)
- [ ] Bulk publish/unpublish updates all selected subtopics in a single transaction
- [ ] Difficulty config changes stored in DB (not .env) — verify after server restart
- [ ] Content version restored via audit log produces a new audit entry with action='restored'
- [ ] Admin dashboard loads < 3s for 500+ subtopics (add DB index if needed)

---

## Cross-Phase Audit Template

Run this after ALL phases are complete. Mirrors the Quiz Platform deep audit that revealed **13% actual vs 60% claimed completion**. Paste into a fresh AI chat to perform.

### Deep Audit Prompt — Tutorial Engine

```
You are performing a deep audit of a Tutorial Engine implementation. For each item below, check the ACTUAL code — do not rely on comments, READMEs, or what was claimed during development. Report: DONE (with file path + line number), PARTIAL (describe what's missing), or MISSING.

SCHEMA: tutorial_content (JSONB blocks), tutorial_progress (composite unique), tutorial_project_submissions (status enum), tutorial_ai_tutor_responses, tutorial_content_audit, tutorial_difficulty_config

REPOSITORIES: TutorialContentRepository (6 methods), TutorialProgressRepository (5 methods), ProjectSubmissionRepository (5 methods) — all with unit tests

BLOCK RENDERER: All 6 block types render (notes, layman, real-life, technical, code, ai-tutor), aria-labels, error boundaries, loading skeletons

COMPLETION GATES: Sequential block order enforced for mixed+, all-6-complete gate before next subtopic, video gate for Mixed+ projects

AI TUTOR: QStash queue, rate limiter (20/day), system prompt includes block content, response stored in DB

REMEDIATION: Webhook with HMAC, RemediationBridgeService, ReassessmentTriggerService, exam.retake.ready event

ADMIN: Content dashboard, BlockEditor (all 6 types), audit log, difficulty config in DB

SECURITY: All admin routes return 403 for non-admin, all write routes authenticated, webhook HMAC verified
```

---

## Carry-Forward Tracker

| Task ID | Description · Blocking · Resolution |
|---------|-------------------------------------|
| T1-A-04 | Seed script — must be USER-GATED reviewed before T2 starts |
| T2-A-01 | BlockRenderer — USER-GATED: visual review of all 6 types required |
| T2-B-01 | BlockEditor — USER-GATED: admin UX review before content creation |
| T3-A-01 | Subtopic page — USER-GATED: learner UX review before T4 |
| T3-A-03 | RemediationBridge — USER-GATED: cross-engine integration review |
| T4-A-02 | Project submission — USER-GATED: video gate UX review |
| T6-A-02 | AI Tutor wire-up — USER-GATED: chat UX + rate limit review |
| T7-A-03 | Remediation dashboard — USER-GATED: learner-facing review |
| T8-A-01 | Content dashboard — USER-GATED: admin UX sign-off |

> All USER-GATED tasks require explicit sign-off before the next phase or sprint can begin.
