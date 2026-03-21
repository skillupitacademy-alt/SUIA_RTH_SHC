# PHASE-T1: Tutorial Engine Foundation
## docs/blueprints/PHASE-T1-TUTORIAL-FOUNDATION.md

> Status: Ready for implementation
> Prerequisites: Phase 2 Tasks 56 (Repository Pattern), 62 (Event Bus), 95 (DB Transactions)
> Sprint: Tutorial Sprint 1 (Month 1, Weeks 1–4)

---

## Goal

Stand up the tutorial-service as an independent microservice within the monorepo.
By end of this phase: a student can browse domains, open a subtopic page, and see
all 6 content blocks (manually entered by admin). No AI generation yet.

---

## Part 1: Monorepo Setup

### 1.1 Create tutorial-app in monorepo

```
apps/tutorial-app/
├── CLAUDE.md
├── package.json              → name: "@platform/tutorial-app"
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── src/
    ├── app/
    ├── components/
    ├── features/
    ├── server/
    └── lib/
```

### 1.2 Create packages/db-tutorial

```
packages/db-tutorial/
├── package.json              → name: "@platform/db-tutorial"
├── src/
│   ├── index.ts              → exports: db, dbReadOnly
│   ├── schema/
│   │   ├── tutorial-content.ts
│   │   ├── tutorial-assignments.ts
│   │   ├── tutorial-projects.ts
│   │   ├── tutorial-progress.ts
│   │   ├── tutorial-video-links.ts
│   │   ├── badges.ts
│   │   ├── remediation-triggers.ts
│   │   ├── domain-content-config.ts
│   │   ├── content-generation-jobs.ts
│   │   └── subtopic-flow-progress.ts
│   └── migrations/
└── drizzle.config.ts
```

### 1.3 Environment variables

```bash
# .env.example additions
DATABASE_TUTORIAL_URL=postgresql://...@...neon.tech/tutorial-db?sslmode=require
DATABASE_TUTORIAL_DIRECT_URL=postgresql://...@...neon.tech/tutorial-db
DATABASE_TUTORIAL_URL_REPLICA=  # optional read replica
```

---

## Part 2: Tutorial DB Schema (Complete)

```sql
-- ── TUTORIAL CONTENT ──────────────────────────────────────────────────────
CREATE TABLE tutorial_content (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id         UUID NOT NULL,           -- references People DB subtopics
  difficulty          TEXT NOT NULL CHECK (difficulty IN ('simple','mixed','intermediate','expert')),
  content_type        TEXT NOT NULL CHECK (content_type IN ('notes','layman','real_life','technical','code','ai_tutor')),
  content             JSONB NOT NULL,           -- canonical JSON per content-json-schema.md
  version             INTEGER DEFAULT 1,
  language            VARCHAR(10) DEFAULT 'en',
  is_published        BOOLEAN DEFAULT false,
  generated_by_ai     BOOLEAN DEFAULT false,
  ai_model_used       TEXT,
  generation_job_id   UUID,
  admin_approved_by   UUID,
  admin_approved_at   TIMESTAMPTZ,
  quality_score       JSONB,
  regeneration_count  INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ,
  UNIQUE(subtopic_id, difficulty, content_type)
);

CREATE INDEX idx_tutorial_content_subtopic ON tutorial_content(subtopic_id);
CREATE INDEX idx_tutorial_content_published ON tutorial_content(subtopic_id, is_published);

-- ── TUTORIAL ASSIGNMENTS ───────────────────────────────────────────────────
CREATE TABLE tutorial_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id     UUID NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('simple','mixed','intermediate','expert')),
  question_type   TEXT NOT NULL CHECK (question_type IN ('mcq','short_answer','code','drag_drop','fill_blank')),
  title           TEXT NOT NULL,
  content         JSONB NOT NULL,
  order_index     INTEGER,
  points          INTEGER DEFAULT 10,
  time_limit_sec  INTEGER,
  is_published    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assignments_subtopic_diff ON tutorial_assignments(subtopic_id, difficulty);

-- ── TUTORIAL PROJECTS ──────────────────────────────────────────────────────
CREATE TABLE tutorial_projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope               TEXT NOT NULL CHECK (scope IN ('topic','subject','domain')),
  parent_id           UUID NOT NULL,
  level               TEXT NOT NULL CHECK (level IN ('simple','intermediate','expert')),
  title               TEXT NOT NULL,
  description         TEXT,
  deliverable_type    TEXT NOT NULL CHECK (deliverable_type IN ('code','repo','live_demo','document')),
  evaluation_type     TEXT NOT NULL CHECK (evaluation_type IN ('auto','ai_review','peer_review','admin_review')),
  estimated_hours     INTEGER,
  badge_id            UUID,
  subtopics_covered   UUID[],
  prerequisites       UUID[],
  is_published        BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ── VIDEO LINKS ────────────────────────────────────────────────────────────
CREATE TABLE tutorial_video_links (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id             UUID,
  project_id              UUID,
  assignment_difficulty   TEXT CHECK (assignment_difficulty IN ('simple','mixed','intermediate','expert')),
  provider                TEXT NOT NULL CHECK (provider IN ('youtube','vimeo','custom','loom')),
  url                     TEXT NOT NULL,
  title                   TEXT NOT NULL,
  thumbnail_url           TEXT,
  duration_seconds        INTEGER,
  captions_available      BOOLEAN DEFAULT false,
  approved_by_admin       BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ── SUBTOPIC FLOW PROGRESS ─────────────────────────────────────────────────
CREATE TABLE subtopic_flow_progress (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL,
  subtopic_id                 UUID NOT NULL,
  layman_read_at              TIMESTAMPTZ,
  real_life_read_at           TIMESTAMPTZ,
  technical_read_at           TIMESTAMPTZ,
  code_read_at                TIMESTAMPTZ,
  ai_tutor_first_message_at   TIMESTAMPTZ,
  assignment_unlocked_at      TIMESTAMPTZ,
  assignment_completed_at     TIMESTAMPTZ,
  current_flow_step           INTEGER DEFAULT 1 CHECK (current_flow_step BETWEEN 1 AND 6),
  flow_completed              BOOLEAN DEFAULT false,
  time_on_layman_seconds      INTEGER DEFAULT 0,
  time_on_technical_seconds   INTEGER DEFAULT 0,
  time_on_code_seconds        INTEGER DEFAULT 0,
  total_time_seconds          INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subtopic_id)
);

CREATE INDEX idx_flow_progress_user ON subtopic_flow_progress(user_id);

-- ── TUTORIAL PROGRESS (aggregate) ─────────────────────────────────────────
CREATE TABLE tutorial_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  subtopic_id     UUID,
  topic_id        UUID,
  subject_id      UUID,
  domain_id       UUID,
  status          TEXT NOT NULL CHECK (status IN ('not_started','in_progress','completed')),
  score           DECIMAL(5,2),
  time_spent_sec  INTEGER DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subtopic_id)
);

-- ── PROJECT SUBMISSIONS ────────────────────────────────────────────────────
CREATE TABLE tutorial_project_submissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  project_id          UUID NOT NULL REFERENCES tutorial_projects(id),
  deliverable_url     TEXT,
  deliverable_meta    JSONB,
  status              TEXT NOT NULL CHECK (status IN (
    'submitted','ai_reviewing','peer_review','approved','rejected','revision_needed'
  )),
  ai_review           JSONB,
  peer_reviews        JSONB[],
  admin_review        JSONB,
  score               DECIMAL(5,2),
  badge_awarded       BOOLEAN DEFAULT false,
  submitted_at        TIMESTAMPTZ DEFAULT now(),
  reviewed_at         TIMESTAMPTZ
);

-- ── BADGES ────────────────────────────────────────────────────────────────
CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  icon_url    TEXT,
  level       TEXT CHECK (level IN ('simple','intermediate','expert')),
  scope       TEXT CHECK (scope IN ('subtopic','topic','subject','domain')),
  criteria    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── REMEDIATION TRIGGERS ───────────────────────────────────────────────────
CREATE TABLE remediation_triggers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_result_id          UUID NOT NULL,   -- reference to Exam DB (string, no FK)
  user_id                 UUID NOT NULL,
  weak_subtopic_ids       UUID[],
  recommended_content_types TEXT[],
  status                  TEXT DEFAULT 'pending' CHECK (
    status IN ('pending','accepted','dismissed','completed')
  ),
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ── DOMAIN CONTENT CONFIG ─────────────────────────────────────────────────
CREATE TABLE domain_content_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id         UUID NOT NULL UNIQUE,
  audience_profile  TEXT NOT NULL,
  layman_style      JSONB NOT NULL,
  real_life_style   JSONB NOT NULL,
  technical_style   JSONB NOT NULL,
  code_style        JSONB NOT NULL,
  ai_tutor_focus    TEXT NOT NULL,
  forbidden_jargon  TEXT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ── CONTENT GENERATION JOBS ────────────────────────────────────────────────
CREATE TABLE content_generation_jobs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id           UUID NOT NULL,
  difficulty            TEXT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN (
    'queued','generating','validation_failed',
    'draft_ready','admin_review','approved','published','failed'
  )),
  blocks_generated      JSONB,
  validation_errors     JSONB,
  admin_feedback        JSONB,
  generation_model      TEXT,
  total_tokens_used     INTEGER,
  generation_cost_usd   DECIMAL(10,6),
  triggered_by          UUID,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── STUDENT STREAKS ────────────────────────────────────────────────────────
CREATE TABLE student_streaks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE,
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_activity   DATE,
  total_xp        INTEGER DEFAULT 0,
  level           TEXT DEFAULT 'bronze',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── CERTIFICATES ───────────────────────────────────────────────────────────
CREATE TABLE certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  scope               TEXT NOT NULL CHECK (scope IN ('topic','subject','domain')),
  parent_id           UUID NOT NULL,
  parent_name         TEXT NOT NULL,
  verification_code   TEXT NOT NULL UNIQUE,
  pdf_url             TEXT,
  issued_at           TIMESTAMPTZ DEFAULT now(),
  expires_at          TIMESTAMPTZ
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_verify ON certificates(verification_code);
```

---

## Part 3: Core Services Structure

```
services/tutorial-service/src/
├── modules/
│   ├── content/
│   │   ├── content.repository.ts     → all tutorial_content DB ops
│   │   ├── content.service.ts        → getSubtopicContent, markPublished
│   │   └── content.routes.ts
│   ├── progress/
│   │   ├── progress.repository.ts    → subtopic_flow_progress DB ops
│   │   ├── progress.service.ts       → markBlockComplete, getFlowProgress
│   │   └── progress.routes.ts
│   ├── assignments/
│   │   ├── assignment.repository.ts
│   │   ├── assignment.service.ts     → startSession, submitAnswer, complete
│   │   └── assignment.routes.ts
│   ├── projects/
│   │   ├── project.repository.ts
│   │   ├── project.service.ts        → getProject, submitProject
│   │   └── project.routes.ts
│   ├── badges/
│   │   ├── badge.service.ts          → awardBadge, checkCriteria
│   ├── remediation/
│   │   ├── remediation.service.ts    → createPlan, getWeakSubtopics
│   └── events/
│       ├── handlers/
│       │   ├── exam-completed.handler.ts    → consumes exam.completed
│       │   └── student-enrolled.handler.ts  → consumes student.enrolled
│       └── publishers/
│           ├── subtopic-completed.publisher.ts
│           └── certificate-issued.publisher.ts
├── lib/
│   ├── db.ts          → import { db } from '@platform/db-tutorial'
│   ├── cache.ts       → Upstash Redis client
│   ├── queue.ts       → QStash client
│   └── logger.ts      → Pino
└── index.ts           → Hono app entry
```

---

## Part 4: API Routes (Phase T1 scope only)

```
GET  /api/tutorial/domains                     → list all domains with progress
GET  /api/tutorial/domains/:id/subjects        → subjects in domain
GET  /api/tutorial/subjects/:id/topics         → topics in subject
GET  /api/tutorial/topics/:id/subtopics        → subtopics in topic
GET  /api/tutorial/subtopics/:id/content       → all 6 blocks for subtopic
GET  /api/tutorial/subtopics/:id/progress      → student's flow progress
POST /api/tutorial/subtopics/:id/mark-complete → mark block as read
GET  /api/tutorial/sidebar/:domainId           → sidebar nav data with statuses
```

---

## Part 5: Admin Routes (Phase T1 scope)

```
POST /api/admin/tutorial/content               → create content block manually
PUT  /api/admin/tutorial/content/:id           → edit content block
POST /api/admin/tutorial/content/:id/publish   → publish block
GET  /api/admin/tutorial/subtopics/:id/status  → generation + publish status
```

---

## Part 6: Caching Strategy

```typescript
// Content: read-heavy, changes rarely
const getSubtopicContent = unstable_cache(
  async (subtopicId: string, difficulty: string) =>
    contentRepo.getAllBlocks(subtopicId, difficulty),
  ['subtopic-content'],
  { revalidate: 3600, tags: [`subtopic-content:${subtopicId}`] }
)

// Progress: per-user, changes on every block completion
// → NO cache. Always read from Upstash Redis first, DB fallback
async function getFlowProgress(userId: string, subtopicId: string) {
  const cached = await redis.get(`flow:${userId}:${subtopicId}`)
  if (cached) return JSON.parse(cached)
  const fromDB = await progressRepo.getFlowProgress(userId, subtopicId)
  await redis.setex(`flow:${userId}:${subtopicId}`, 300, JSON.stringify(fromDB))
  return fromDB
}

// Sidebar: per-user, per-domain
const getSidebarData = unstable_cache(
  async (domainId: string, userId: string) =>
    buildSidebarWithProgress(domainId, userId),
  ['sidebar'],
  { revalidate: 60, tags: [`sidebar:${userId}:${domainId}`] }
)
```

---

## Part 7: Verification Checklist

```
□ pnpm --filter @platform/db-tutorial run migrate → all tables created
□ pnpm --filter @platform/tutorial-app run build → exits 0
□ pnpm typecheck:all → zero errors
□ Admin can create a content block manually (notes block, layman block)
□ Student can open a subtopic page and see 6 blocks
□ Student can mark layman as read → Real-Life unlocks
□ Progress persists on page refresh (Redis + DB)
□ Sidebar shows correct status icons per subtopic
□ Content fetch uses unstable_cache (confirm via Vercel cache dashboard)
□ Zero direct SQL from tutorial-app to exam-db
```

---

*Phase: T1 | Sprint: Tutorial Sprint 1 | Status: Ready*

---

## Forward Reference - Prompt 19 Image Support

This is not part of T1 implementation. It is recorded here so the later image work stays aligned with the foundation schema and migration numbering.

### Migration Reference

- Migration filename: `0001_image_support.sql`
- The image feature uses JSONB for block content and adds separate metadata tables for admin-managed assets
- `ai_tutor` remains image-free

### Planned Tables

- `tutorial_content_images`
  - tracks R2 and SVG image metadata by subtopic and block type
  - supports soft deletes and versioning
- `tutorial_svg_registry`
  - registry of approved standard SVG keys by domain
  - used to validate `svg_standard` image references

### Planned Rules

- `svg_standard` images resolve to code-based SVG components
- `r2_custom` images are uploaded by admin and served through the trusted CDN
- image metadata is optional per supported block
- image support is a later-phase concern and should not alter T1 scope
