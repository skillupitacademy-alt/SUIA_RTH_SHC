# Tutorial Engine — Complete Architecture Blueprint
## Phase T: Tutorial & Learning System (New Website)

> Designed to mirror the architectural rigour of the Exam Engine.
> Stack: Next.js App Router · Neon Postgres · Upstash (Redis + QStash + Vector + Workflows) · Vercel/Cloudflare · Resend · Sentry

---

## PART 0: What This Engine Solves

Your Exam Engine tests knowledge. The Tutorial Engine **builds** it.
The two engines share the same Domain → Subject → Topic → Subtopic hierarchy
but serve completely different purposes:

| Dimension         | Exam Engine              | Tutorial Engine                         |
|-------------------|--------------------------|-----------------------------------------|
| Primary Action    | Assess what you know     | Teach what you don't know               |
| Content Unit      | Question + Answer        | Subtopic Content Block (6 content types)|
| Output            | Score + PDF Report       | Progress + Certificate + Project Badge  |
| Trigger           | Student initiates exam   | Low score OR self-directed learning     |
| AI Role           | Generate insights        | Generate explanations + personalize path|
| Real-time Need    | Exam timer sync          | Progress streak, live collaboration     |

---

## PART 1: Hierarchy & Content Model

### 1.1 — The Four-Level Hierarchy (Mirrors Exam Engine)

```
Domain
 └── Subject (many per Domain)
      └── Topic (many per Subject)
           └── Subtopic (many per Topic)
                └── Content Block (6 types per Subtopic)
                └── Assignment Set (difficulty-gated)
                └── Video Links (Mixed + Expert only)
```

### 1.2 — Content Block Types Per Subtopic (6 Types)

Every Subtopic has ALL six content blocks. Each is independently completable.

| # | Block Type              | Description                                                                 | Format        |
|---|-------------------------|-----------------------------------------------------------------------------|---------------|
| 1 | **Notes**               | Concise reference notes. Bullet points, definitions, key formulas           | Markdown/MDX  |
| 2 | **Layman Explanation**  | Concept explained as if to a complete beginner. No jargon, relatable words  | Prose + emoji |
| 3 | **Real-Life Scenario**  | One concrete real-world story showing WHY this concept matters               | Narrative     |
| 4 | **Technical Explanation**| Precise, formal explanation with terminology, edge cases, gotchas           | Prose + code  |
| 5 | **Code Explanation**    | Annotated code walkthrough. Line-by-line explanation. Multiple languages    | Code + prose  |
| 6 | **AI Tutor Chat**       | On-demand AI explanation. Student asks follow-up questions about this subtopic| Chat widget  |

### 1.3 — Assignment Tiers Per Subtopic (Difficulty-Gated)

Assignment count scales with difficulty — harder categories demand more practice:

| Category     | Assignment Count | Description                                              | Maps To Exam Question Type |
|--------------|-----------------|----------------------------------------------------------|----------------------------|
| **Simple**   | 3–5             | Direct recall, single-concept application                | Easy questions             |
| **Mixed**    | 6–10            | Cross-concept, applied problems                          | Medium questions           |
| **Intermediate** | 8–12        | Multi-step problems, edge case handling                  | Hard questions             |
| **Expert**   | 12–20           | Open-ended, production-grade challenges                  | Expert questions           |

**Assignments include**: Multiple Choice · Short Answer · Code Challenge · Drag-and-Drop · Fill-in-the-blank · Peer Review submission

---

## PART 2: Project System (Three Levels)

### 2.1 — Project Categories (Topic-Level)

Each **Topic** has three project tiers. Each project maps to ALL subtopics covered in that topic.

```
Topic: "React Hooks"
 ├── Simple Project:        "Build a Counter App with useState + useEffect"
 │     Maps to subtopics:   useState · useEffect · component lifecycle
 │     Deliverable:         Code + short explanation
 │     Evaluation:          Auto-checked (test suite) + AI review
 │
 ├── Intermediate Project:  "Build a Real-Time Search with useCallback + useMemo"
 │     Maps to subtopics:   useCallback · useMemo · performance optimization
 │     Deliverable:         GitHub repo link + README
 │     Evaluation:          AI code review + rubric checklist
 │
 └── Expert Project:        "Build a Custom State Management Library"
       Maps to subtopics:   useReducer · useContext · custom hooks · design patterns
       Deliverable:         Published npm package OR live demo + architecture doc
       Evaluation:          Peer review + admin review + AI analysis
```

### 2.2 — Project Categories (Subject-Level)

Each **Subject** has capstone projects spanning multiple topics:

```
Subject: "Frontend Engineering"
 ├── Simple Subject Project:        "Portfolio Website using all basic topics"
 ├── Intermediate Subject Project:  "Full CRUD App with API integration"
 └── Expert Subject Project:        "Production-grade SaaS landing page with A11y + i18n"
```

### 2.3 — Project Categories (Domain-Level)

Each **Domain** has a mega-capstone:

```
Domain: "Web Development"
 ├── Simple Domain Project:        "Static blog site covering all subjects"
 ├── Intermediate Domain Project:  "Full-stack app: auth + DB + deployment"
 └── Expert Domain Project:        "Microservices SaaS with CI/CD, monitoring, tests"
```

### 2.4 — Project Metadata Schema

```typescript
interface Project {
  id: string;
  level: 'simple' | 'intermediate' | 'expert';
  scope: 'topic' | 'subject' | 'domain';
  parentId: string;            // topicId | subjectId | domainId
  subtopicsCovered: string[];  // array of subtopicIds this project exercises
  title: string;
  description: string;
  estimatedHours: number;
  deliverableType: 'code' | 'repo' | 'live_demo' | 'document';
  evaluationType: 'auto' | 'ai_review' | 'peer_review' | 'admin_review';
  videoLinks: VideoLink[];     // Mixed + Expert only
  prerequisites: string[];     // projectIds that should be done first
  badgeId: string;             // Badge awarded on completion
}
```

---

## PART 3: Video Link System

### 3.1 — Where Videos Appear

Videos are attached at **Subtopic + Assignment Category** level:

| Assignment Category | Video Required? | Video Type                                      |
|--------------------|-----------------|-------------------------------------------------|
| Simple             | Optional        | Short intro clip (2–5 min)                      |
| Mixed              | ✅ YES           | Concept walkthrough (10–20 min)                 |
| Intermediate       | ✅ YES           | Deep dive / live coding (20–45 min)             |
| Expert             | ✅ YES           | Full project build / architecture review (45min+)|

### 3.2 — Video Link Schema (matches Exam Engine structure)

```typescript
interface VideoLink {
  id: string;
  subtopicId: string;
  assignmentCategory: 'simple' | 'mixed' | 'intermediate' | 'expert';
  title: string;
  provider: 'youtube' | 'vimeo' | 'custom' | 'loom';
  url: string;
  thumbnailUrl: string;
  durationSeconds: number;
  language: string;           // for i18n
  captionsAvailable: boolean; // WCAG compliance
  createdAt: Date;
  approvedByAdmin: boolean;
}
```

---

## PART 4: Database Schema

### 4.1 — New Tables (Tutorial-Specific)

```sql
-- Tutorial content per subtopic
CREATE TABLE tutorial_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id UUID NOT NULL REFERENCES subtopics(id),
  content_type TEXT NOT NULL CHECK (content_type IN (
    'notes', 'layman', 'real_life', 'technical', 'code_explanation', 'ai_tutor'
  )),
  content JSONB NOT NULL,       -- MDX/Markdown or structured JSON
  version INTEGER DEFAULT 1,    -- Content versioning (mirrors Gap 8)
  language VARCHAR(10) DEFAULT 'en',  -- i18n ready
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ        -- Soft delete
);

-- Assignments per subtopic
CREATE TABLE tutorial_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id UUID NOT NULL REFERENCES subtopics(id),
  category TEXT NOT NULL CHECK (category IN ('simple', 'mixed', 'intermediate', 'expert')),
  question_type TEXT NOT NULL,  -- mcq | short_answer | code | drag_drop | fill_blank
  title TEXT NOT NULL,
  content JSONB NOT NULL,       -- question body + answer key
  order_index INTEGER,
  points INTEGER DEFAULT 10,
  time_limit_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE tutorial_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('topic', 'subject', 'domain')),
  parent_id UUID NOT NULL,      -- topicId | subjectId | domainId
  level TEXT NOT NULL CHECK (level IN ('simple', 'intermediate', 'expert')),
  title TEXT NOT NULL,
  description TEXT,
  deliverable_type TEXT NOT NULL,
  evaluation_type TEXT NOT NULL,
  estimated_hours INTEGER,
  badge_id UUID REFERENCES badges(id),
  subtopics_covered UUID[],     -- denormalized for fast queries
  prerequisites UUID[],         -- projectIds
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Video links
CREATE TABLE tutorial_video_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id UUID REFERENCES subtopics(id),
  project_id UUID REFERENCES tutorial_projects(id),
  assignment_category TEXT CHECK (assignment_category IN ('simple','mixed','intermediate','expert')),
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  captions_available BOOLEAN DEFAULT false,
  approved_by_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student progress per content block
CREATE TABLE tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subtopic_id UUID REFERENCES subtopics(id),
  topic_id UUID REFERENCES topics(id),
  subject_id UUID REFERENCES subjects(id),
  domain_id UUID REFERENCES domains(id),
  content_type TEXT,            -- NULL means overall subtopic progress
  status TEXT NOT NULL CHECK (status IN ('not_started','in_progress','completed')),
  score DECIMAL(5,2),           -- for assignments
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subtopic_id, content_type)
);

-- Student project submissions
CREATE TABLE tutorial_project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES tutorial_projects(id),
  deliverable_url TEXT,
  deliverable_metadata JSONB,   -- repo url, live url, notes
  status TEXT NOT NULL CHECK (status IN ('submitted','ai_reviewing','peer_review','approved','rejected','revision_needed')),
  ai_review JSONB,              -- AI feedback
  peer_reviews JSONB[],         -- array of peer review objects
  admin_review JSONB,
  score DECIMAL(5,2),
  badge_awarded BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  level TEXT,                   -- simple | intermediate | expert
  scope TEXT,                   -- subtopic | topic | subject | domain
  criteria JSONB                -- e.g., { completedProjects: 3, minScore: 80 }
);

-- Remediation links (Exam Engine → Tutorial Engine bridge)
CREATE TABLE remediation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_result_id UUID NOT NULL REFERENCES exam_results(id),
  user_id UUID NOT NULL REFERENCES users(id),
  weak_subtopic_ids UUID[],     -- from ScoringEngine dimensional breakdown
  recommended_content_types TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','dismissed','completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tutorial_progress_user ON tutorial_progress(user_id);
CREATE INDEX idx_tutorial_progress_subtopic ON tutorial_progress(subtopic_id);
CREATE INDEX idx_tutorial_content_subtopic ON tutorial_content(subtopic_id);
CREATE INDEX idx_tutorial_submissions_user ON tutorial_project_submissions(user_id, status);
CREATE INDEX idx_remediation_user ON remediation_triggers(user_id, status);
```

---

## PART 5: Complete App Router Structure (Tutorial Website)

```
apps/
└── tutorial-app/                         ← NEW Next.js app (monorepo)
    ├── CLAUDE.md                         ← Tutorial-specific AI rules
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx               ← Root: fonts, providers, navbar
    │   │   ├── page.tsx                 ← Landing: featured domains/subjects
    │   │   ├── loading.tsx
    │   │   ├── error.tsx
    │   │   │
    │   │   ├── (public)/                ← No auth required
    │   │   │   ├── explore/
    │   │   │   │   ├── page.tsx         ← Browse all Domains
    │   │   │   │   └── [domainSlug]/
    │   │   │   │       ├── page.tsx     ← Domain overview + subjects list
    │   │   │   │       └── [subjectSlug]/
    │   │   │   │           └── page.tsx ← Subject overview (SSG/ISR)
    │   │   │   └── leaderboard/
    │   │   │       └── page.tsx
    │   │   │
    │   │   ├── (auth)/                  ← Shared with Exam Engine auth
    │   │   │   ├── login/page.tsx
    │   │   │   └── register/page.tsx
    │   │   │
    │   │   ├── (learning)/              ← Protected: requires auth
    │   │   │   ├── layout.tsx           ← Auth guard + sidebar progress
    │   │   │   │
    │   │   │   ├── dashboard/
    │   │   │   │   └── page.tsx         ← My progress, streaks, badges
    │   │   │   │
    │   │   │   ├── learn/
    │   │   │   │   └── [domainSlug]/
    │   │   │   │       └── [subjectSlug]/
    │   │   │   │           └── [topicSlug]/
    │   │   │   │               ├── page.tsx        ← Topic overview
    │   │   │   │               └── [subtopicSlug]/
    │   │   │   │                   ├── page.tsx    ← Subtopic hub (6 content tabs)
    │   │   │   │                   ├── notes/page.tsx
    │   │   │   │                   ├── layman/page.tsx
    │   │   │   │                   ├── real-life/page.tsx
    │   │   │   │                   ├── technical/page.tsx
    │   │   │   │                   ├── code/page.tsx
    │   │   │   │                   └── ai-tutor/page.tsx
    │   │   │   │
    │   │   │   ├── assignments/
    │   │   │   │   └── [subtopicSlug]/
    │   │   │   │       ├── page.tsx        ← Pick difficulty tier
    │   │   │   │       └── [category]/
    │   │   │   │           └── page.tsx    ← Assignment session
    │   │   │   │
    │   │   │   ├── projects/
    │   │   │   │   ├── page.tsx            ← All my projects
    │   │   │   │   ├── topic/[topicSlug]/
    │   │   │   │   │   └── [level]/page.tsx ← Topic project detail
    │   │   │   │   ├── subject/[subjectSlug]/
    │   │   │   │   │   └── [level]/page.tsx
    │   │   │   │   └── domain/[domainSlug]/
    │   │   │   │       └── [level]/page.tsx
    │   │   │   │
    │   │   │   ├── remediation/
    │   │   │   │   └── [examResultId]/
    │   │   │   │       └── page.tsx        ← "Your weak areas from Exam" → tutorial links
    │   │   │   │
    │   │   │   └── certificates/
    │   │   │       └── page.tsx
    │   │   │
    │   │   └── api/
    │   │       ├── tutorial/
    │   │       │   ├── content/[subtopicId]/route.ts
    │   │       │   ├── progress/route.ts       ← POST: mark block complete
    │   │       │   ├── assignments/route.ts
    │   │       │   └── projects/
    │   │       │       ├── submit/route.ts
    │   │       │       └── [projectId]/route.ts
    │   │       ├── ai-tutor/
    │   │       │   └── chat/route.ts           ← Streaming AI chat
    │   │       ├── remediation/
    │   │       │   └── route.ts               ← Bridge from Exam Engine
    │   │       └── workers/                   ← QStash consumers
    │   │           ├── review-project/route.ts
    │   │           ├── award-badge/route.ts
    │   │           ├── send-completion-email/route.ts
    │   │           └── embed-content/route.ts  ← Upstash Vector indexing
    │   │
    │   ├── components/
    │   │   ├── content/
    │   │   │   ├── ContentTabs.tsx       ← 6-tab subtopic navigator
    │   │   │   ├── NotesBlock.tsx
    │   │   │   ├── LaymanBlock.tsx
    │   │   │   ├── RealLifeBlock.tsx
    │   │   │   ├── TechnicalBlock.tsx
    │   │   │   ├── CodeExplanationBlock.tsx ← Syntax highlighted, line-by-line
    │   │   │   └── AITutorChat.tsx       ← Streaming chat widget
    │   │   ├── progress/
    │   │   │   ├── ProgressRing.tsx      ← Per subtopic/topic/subject/domain
    │   │   │   ├── StreakCounter.tsx
    │   │   │   ├── LearningPath.tsx      ← Visual DAG of learning journey
    │   │   │   └── BadgeShelf.tsx
    │   │   ├── assignments/
    │   │   │   ├── AssignmentSession.tsx ← Assignment runner (mirrors ExamInterface)
    │   │   │   ├── DifficultyGate.tsx    ← Unlock harder tiers
    │   │   │   └── AssignmentResult.tsx
    │   │   └── projects/
    │   │       ├── ProjectCard.tsx
    │   │       ├── ProjectSubmitForm.tsx
    │   │       └── ProjectReviewPanel.tsx
    │   │
    │   ├── features/
    │   │   ├── tutorial-content/         ← Content loading + caching
    │   │   ├── assignment-session/       ← Session state (mirrors quiz-session)
    │   │   ├── project-submission/
    │   │   ├── ai-tutor/                 ← AI chat + Vector search
    │   │   ├── progress-tracker/         ← Progress state + sync
    │   │   └── remediation/              ← Bridge from Exam Engine
    │   │
    │   └── server/
    │       ├── tutorial-engine/          ← Core server logic
    │       │   ├── tutorial.engine.ts    ← Mirrors exam.engine.ts
    │       │   ├── content.service.ts
    │       │   ├── assignment.service.ts
    │       │   ├── project.service.ts
    │       │   ├── progress.service.ts
    │       │   ├── badge.service.ts
    │       │   └── remediation.service.ts ← Bridge from tutor.service.ts
    │       └── ai/
    │           ├── tutor.service.ts      ← MIGRATED from api-server (enhanced)
    │           └── vector.service.ts     ← Upstash Vector operations
```

---

## PART 6: Core Services Architecture

### 6.1 — TutorialEngine (mirrors ExamEngine design)

```typescript
// apps/tutorial-app/src/server/tutorial-engine/tutorial.engine.ts

class TutorialEngine {
  // Content retrieval
  async getSubtopicContent(subtopicId, userId): Promise<SubtopicContent>
  // Marks a content block as read/completed
  async markBlockComplete(userId, subtopicId, contentType): Promise<Progress>
  // Gets assignment set for a subtopic+category, idempotent
  async startAssignmentSession(userId, subtopicId, category, idempotencyKey): Promise<AssignmentSession>
  // Submits assignment answer, scores immediately for simple/mixed
  async submitAssignmentAnswer(sessionId, assignmentId, answer): Promise<AnswerResult>
  // Completes an assignment session, calculates final score
  async completeAssignmentSession(sessionId): Promise<SessionResult>
  // Unlocks next difficulty tier if threshold met
  async checkTierUnlock(userId, subtopicId): Promise<TierUnlockResult>
  // Gets project detail with submission status
  async getProject(projectId, userId): Promise<ProjectDetail>
  // Submits a project for review
  async submitProject(userId, projectId, deliverable): Promise<Submission>
  // Called by remediation trigger (from Exam Engine)
  async createRemediationPlan(userId, weakSubtopicIds): Promise<RemediationPlan>
}
```

### 6.2 — Exam Engine Bridge (Remediation Trigger)

```typescript
// In api-server: ScoringEngine calls this after scoring
async function triggerRemediation(examResultId: string, userId: string) {
  const weakTopics = await getWeakDimensionsFromResult(examResultId);
  // score < 60% threshold per subtopic
  const weakSubtopics = weakTopics.filter(t => t.percentage < 60);

  if (weakSubtopics.length > 0) {
    // Enqueue via QStash (does not block exam submission flow)
    await qstash.publishJSON({
      url: `${TUTORIAL_APP_URL}/api/remediation`,
      body: { examResultId, userId, weakSubtopicIds: weakSubtopics.map(t => t.subtopicId) }
    });
  }
}
```

### 6.3 — AI Tutor Service (enhanced from existing tutor.service.ts)

```typescript
// Streaming AI responses per subtopic context
async streamTutorResponse(userId, subtopicId, message, history)

// Semantic search: "find content related to this question"
async findRelatedContent(subtopicId, userQuery): Promise<ContentChunk[]>

// Generate AI explanation for specific content block
async generateExplanation(subtopicId, contentType, difficulty): Promise<string>

// Upstash Vector: embed and index all content on publish
async indexSubtopicContent(subtopicId): Promise<void>

// Find similar subtopics (for "You might also like")
async findSimilarSubtopics(subtopicId, topK = 5): Promise<Subtopic[]>
```

---

## PART 7: Caching Strategy

```typescript
// Tutorial content is read-heavy, write-rarely → aggressive caching

// Layer 1: ISR for public content pages (60 min revalidate)
export const revalidate = 3600; // domain/subject/topic overview pages

// Layer 2: Vercel Data Cache with tags for content blocks
const content = unstable_cache(
  () => db.query.tutorial_content.findMany({ where: eq(subtopicId, id) }),
  [`content:${subtopicId}`],
  { revalidate: 3600, tags: [`subtopic-content:${subtopicId}`] }
);

// Layer 3: Upstash Redis for student progress (session-hot data)
await redis.setex(`progress:${userId}:${subtopicId}`, 300, JSON.stringify(progress));

// Layer 4: Browser - cache static content blocks (notes, layman, technical)
// Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400

// Admin publishes/edits content → invalidate immediately:
await revalidateTag(`subtopic-content:${subtopicId}`);
```

---

## PART 8: Async Processing (QStash Workflows)

```
Student completes project submission
  → POST /api/tutorial/projects/submit → 202 Accepted
  → QStash Job 1: AI project review (GPT-4 rubric check)
  → QStash Job 2: (on AI approval) Award badge → update progress
  → QStash Job 3: (on badge award) Send congratulations email (Resend)
  → QStash Job 4: (Expert projects) Notify peer reviewers

Exam Engine scores exam with weak subtopics
  → QStash: Create remediation_triggers record
  → QStash: Embed weak content in Vector DB for semantic matching
  → QStash: Send "Study recommendations" email (Resend)

Admin publishes new subtopic content
  → QStash: Embed content in Upstash Vector (for AI Tutor search)
  → QStash: Invalidate all related CDN caches
  → QStash: Notify subscribed students (if subject they're studying)
```

---

## PART 9: Additional Features (Suggested)

### 9.1 — Learning Path & Prerequisites
Students see a visual dependency graph (DAG) showing which subtopics unlock others.
A subtopic is "locked" until prerequisite subtopics are ≥70% complete.

### 9.2 — Streak & Gamification System
```
Daily Streak:    Study any content block = +1 streak day
Weekly Goal:     Complete N subtopics per week (admin-configurable)
XP Points:       Notes=10, Assignment=20, Project=100, Expert Project=500
Levels:          Bronze (0-500 XP) → Silver → Gold → Platinum → Diamond
Leaderboard:     Per-Domain, Per-Subject, Global (Upstash Redis sorted sets)
```

### 9.3 — Peer Learning & Community
```
Discussion Threads: Per subtopic → students ask/answer questions
Code Snippets:      Students share their assignment solutions
Project Gallery:    Showcase approved Expert projects publicly
Study Groups:       Form groups for Expert domain projects (real-time collab)
```

### 9.4 — Adaptive Learning Engine (Phase 4 / Expert tier)
```
Based on:   Assignment scores + time spent + retry count
Actions:    Auto-suggest easier content type if stuck
            Skip already-mastered subtopics
            Re-sequence subtopics based on demonstrated knowledge gaps
            Weekly personalized "study plan" email via Upstash Workflows
```

### 9.5 — Offline Support (PWA)
```
Service Worker:  Cache last 5 subtopic content blocks offline
IndexedDB:       Store assignment progress locally, sync on reconnect
Manifest:        "Install Tutorial App" prompt for mobile students
```

### 9.6 — Certificates
```
Topic Certificate:    Complete all subtopics + Simple project ≥70%
Subject Certificate:  Complete all topics + Intermediate project ≥75%
Domain Certificate:   Complete all subjects + Expert project approved
PDF Generation:       Via QStash job (same PDF engine as Exam Engine)
Verification URL:     Public shareable link (LinkedIn-ready)
```

### 9.7 — Admin Content Management
```
Content Editor:   Rich MDX editor per content block type
Version History:  Track every edit (mirrors Gap 8 / Content Versioning)
Preview Mode:     See student view before publishing
Bulk Operations:  Import subtopic content from CSV/JSON
Analytics:        Which subtopics have highest drop-off rates
A/B Testing:      Test two versions of an explanation, measure completion
```

### 9.8 — Analytics & Reporting
```
Student View:   Time spent per subtopic, score trend, projected completion date
Admin View:     Heatmap of most-skipped content blocks, weakest subtopics globally
Engagement:     Video watch completion %, AI tutor conversation count
Cohort View:    Group progress (e.g., "Class of March 2026")
```

---

## PART 10: New .md Files to Add to Your Docs

### Files to Create in `docs/blueprints/`:

```
docs/
├── blueprints/
│   ├── PHASE-T1-TUTORIAL-FOUNDATION.md      ← DB schema, core services, app structure
│   ├── PHASE-T2-CONTENT-ENGINE.md           ← 6 content block types, MDX pipeline, versioning
│   ├── PHASE-T3-ASSIGNMENT-ENGINE.md        ← Assignment sessions, difficulty gating, scoring
│   ├── PHASE-T4-PROJECT-ENGINE.md           ← Project system (topic/subject/domain levels)
│   ├── PHASE-T5-REMEDIATION-ENGINE.md       ← Exam Engine bridge, tutor.service.ts integration
│   ├── PHASE-T6-AI-TUTOR.md                ← Streaming AI chat, Upstash Vector, semantic search
│   ├── PHASE-T7-GAMIFICATION.md             ← XP, streaks, badges, leaderboard, certificates
│   └── PHASE-T8-ADMIN-CONTENT-MGMT.md      ← Admin editor, analytics, A/B testing
│
├── prompts/
│   ├── tutorial-t1-foundation.prompt.md
│   ├── tutorial-t2-content-engine.prompt.md
│   ├── tutorial-t3-assignment-engine.prompt.md
│   ├── tutorial-t4-project-engine.prompt.md
│   ├── tutorial-t5-remediation.prompt.md
│   ├── tutorial-t6-ai-tutor.prompt.md
│   ├── tutorial-t7-gamification.prompt.md
│   └── tutorial-t8-admin.prompt.md
│
├── reference/
│   └── adr/
│       ├── ADR-006-tutorial-separate-app.md  ← Why separate Next.js app vs same app
│       ├── ADR-007-mdx-vs-db-content.md      ← Why JSONB in DB vs MDX files
│       └── ADR-008-assignment-vs-exam.md     ← How assignments differ from exam questions
│
└── docs/
    └── tutorial-app/
        └── CLAUDE.md                         ← Tutorial app AI memory
```

---

## PART 11: Recommended Execution Order

```
PREREQUISITE (complete first from existing roadmap):
  ✅ Phase 2: Task 62 — Event Bus (needed for progress events)
  ✅ Phase 2: Task 56 — Repository Pattern (TutorialRepository needs this)
  ✅ Phase 2: Task 95 — DB Transactions (project submissions need this)
  ✅ Gap 3:   Disaster Recovery (tutorial content = student IP, must be backed up)

TUTORIAL PHASE T1 (Month 1): Foundation
  → Create tutorial-app in monorepo (pnpm workspace)
  → DB schema: tutorial_content, tutorial_assignments, tutorial_progress, badges
  → TutorialEngine core service (content + progress only)
  → Basic subtopic page with 6 content tabs (static content)
  → Admin: content CRUD UI

TUTORIAL PHASE T2 (Month 2): Assignment Engine
  → Assignment session (mirrors ExamEngine pattern exactly)
  → Difficulty gating (Simple → Mixed → Intermediate → Expert unlock)
  → Video link integration (Mixed + Expert)
  → Progress tracking to Upstash Redis

TUTORIAL PHASE T3 (Month 3): Project Engine
  → Project pages (topic/subject/domain levels)
  → Project submission + QStash AI review pipeline
  → Badge award workflow
  → Certificate PDF generation (reuse Exam Engine PDF service)

TUTORIAL PHASE T4 (Month 3-4): Remediation Bridge
  → ScoringEngine → QStash → remediation_triggers table
  → /remediation/[examResultId] page
  → "Study these topics" recommendation UI
  → Resend: "You scored below 60% in X — here's what to study" email

TUTORIAL PHASE T5 (Month 4-5): AI Tutor
  → Migrate + enhance tutor.service.ts
  → Upstash Vector: index all content on publish
  → Streaming AI chat widget per subtopic
  → Semantic "related content" search

TUTORIAL PHASE T6 (Month 5-6): Gamification + Certificates
  → XP system, streaks (Upstash Redis sorted sets)
  → Leaderboard (per domain/subject/global)
  → Certificate generation + public verification URL

TUTORIAL PHASE T7 (Month 6+): Adaptive Learning
  → Personalized study plan via Upstash Workflows
  → Adaptive difficulty based on score history
  → Cohort analytics for admin
```

---

## PART 12: CLAUDE.md Additions for Tutorial App

```markdown
# Tutorial App — AI Rules

## Architecture Rules
- TutorialEngine MUST mirror ExamEngine patterns (same DI, same repository pattern)
- Content blocks are ALWAYS fetched server-side (RSC) — never client-fetched raw
- Assignment sessions use SAME idempotency pattern as ExamEngine
- Progress updates go through Upstash Redis first, DB second (write-behind)

## Content Block Rules
- All 6 content types MUST exist before a subtopic is marked "published"
- Code blocks MUST use rehype-pretty-code for syntax highlighting
- Layman explanation MUST NOT contain technical jargon
- AI Tutor MUST include subtopic context in every prompt (never stateless)

## Assignment Rules
- Simple assignments: auto-score immediately (no queue)
- Mixed/Intermediate: auto-score + queue AI hint generation
- Expert: queue for AI review + optional peer review
- NEVER score and submit in same synchronous request — always 202 + QStash

## Project Rules
- Project submissions ALWAYS go through QStash (never inline)
- AI review MUST use structured rubric (not free-form)
- Badge award is ATOMIC: score project → award badge → send email (one workflow)

## Video Links
- Mixed + Expert subtopics MUST have at least 1 video before publishing
- Admin must approve video links before they display to students
```

---

*Blueprint Version: 1.0 | Created: 2026-03-05 | Status: Ready for Phase T1 Implementation*
