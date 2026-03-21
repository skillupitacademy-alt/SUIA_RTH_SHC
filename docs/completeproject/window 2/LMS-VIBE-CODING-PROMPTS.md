# LMS Platform — Complete Vibe Coding Prompt Guide
# Tutorial Engine + Quiz Platform + Exam Engine Bridge

> **How to use this document**
> - Use Claude Code (claude.ai/code) for every prompt
> - One prompt = one session. Never mix two sprints in one session
> - After each sprint: test the 3 checkpoints listed, then move to next
> - Never skip a sprint — each one builds on the previous
> - When Claude Code asks a clarifying question mid-prompt, reply "use your best judgment and continue"

---

## Your Stack (Reference)

```
Framework:     Next.js 14 App Router + TypeScript (strict)
Styling:       Tailwind CSS
Database:      Neon Postgres (separate DB from exam engine)
ORM:           Drizzle ORM
AI (future):   Anthropic API (stubbed now, activated later)
Deploy:        Vercel + Cloudflare DNS
Auth:          Supabase Auth OR custom JWT (decided in Sprint 2)
```

## Your .env.local (fill before Sprint 1)

```bash
# Neon Database (Tutorial Engine - separate from exam engine)
DATABASE_URL=postgresql://...your-neon-tutorial-db...

# AI Keys — stubbed for future, not used yet
ANTHROPIC_API_KEY=add-later
OPENAI_API_KEY=add-later

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

---

# SPRINT 1 — Project Foundation

> **Goal:** Runnable Next.js project with Neon connected, Drizzle configured, folder structure ready
> **Time estimate:** 20–30 mins in Claude Code

---

## Sprint 1 Prompt — Paste into Claude Code

```
Scaffold a brand new Next.js 14 App Router project for an LMS platform called "EduFlow".
This is a Tutorial Engine that will later connect to a separate Exam Engine via webhooks.

## Tech Stack
- Next.js 14 App Router, TypeScript strict mode
- Tailwind CSS with a clean neutral color palette (slate/zinc grays, indigo accent)
- Drizzle ORM connected to Neon Postgres
- No Supabase, No Prisma

## Folder Structure — create exactly this
src/
  app/
    (admin)/
      layout.tsx         -- admin shell layout, sidebar + topbar placeholder
      dashboard/
        page.tsx         -- admin dashboard placeholder
      topics/
        page.tsx         -- topic list placeholder
      page.tsx           -- redirect to /admin/dashboard
    (learner)/
      layout.tsx         -- learner shell layout, topbar + nav placeholder
      dashboard/
        page.tsx         -- learner dashboard placeholder
      learn/
        page.tsx         -- topic browser placeholder
    api/
      health/
        route.ts         -- GET returns { status: "ok", timestamp: Date.now() }
    layout.tsx           -- root layout, imports globals.css, sets font
    page.tsx             -- marketing home page (described below)
    globals.css
  components/
    ui/
      Button.tsx         -- variants: primary, secondary, ghost, danger. sizes: sm, md, lg
      Card.tsx           -- Card, CardHeader, CardTitle, CardContent, CardFooter exports
      Input.tsx          -- controlled input with label, error, helper text props
      Badge.tsx          -- variants: default, success, warning, danger, info
      Spinner.tsx        -- loading spinner, sizes: sm, md, lg
      Modal.tsx          -- accessible modal with backdrop, title, children, onClose
      Toast.tsx          -- toast notification, variants: success, error, info
    layout/
      AdminSidebar.tsx   -- sidebar with nav links: Dashboard, Topics, Subtopics, Content, Quiz, Settings
      AdminTopbar.tsx    -- topbar with page title prop and user avatar placeholder
      LearnerTopbar.tsx  -- topbar with logo, nav links: Learn, My Progress, placeholder user menu
    shared/
      EmptyState.tsx     -- icon + title + description + optional action button
      ErrorBoundary.tsx  -- React error boundary component
      PageHeader.tsx     -- page title + subtitle + optional right-side action slot
  db/
    schema/
      topics.ts          -- empty, just export comment "Topics schema — defined in Sprint 2"
      subtopics.ts       -- empty, just export comment "Subtopics schema — defined in Sprint 2"
      content.ts         -- empty, just export comment "Content schema — defined in Sprint 2"
      quiz.ts            -- empty, just export comment "Quiz schema — defined in Sprint 4"
      progress.ts        -- empty, just export comment "Progress schema — defined in Sprint 3"
      users.ts           -- empty, just export comment "Users schema — defined in Sprint 2"
      index.ts           -- re-exports all schema files
    index.ts             -- drizzle client using neon-http driver + DATABASE_URL
    migrate.ts           -- script to run migrations
  lib/
    ai.ts                -- stub: export const generateContent = async () => { throw new Error("AI not configured yet — add ANTHROPIC_API_KEY") }
    utils.ts             -- cn() className utility using clsx + tailwind-merge, formatDate(), truncate()
    constants.ts         -- BLOCK_TYPES array: ["notes","layman","real-life","technical","code","ai-tutor"], APP_NAME = "EduFlow"
    validations.ts       -- empty, comment "Zod schemas defined per sprint"
  types/
    index.ts             -- core TypeScript interfaces (described below)
  hooks/
    useToast.ts          -- simple toast state hook
    useLocalStorage.ts   -- typed localStorage hook
  middleware.ts          -- empty Next.js middleware stub, comment "Auth middleware added in Sprint 2"

## Core TypeScript interfaces — put in types/index.ts
- Topic: { id, title, slug, description, icon, order, isPublished, createdAt, updatedAt }
- Subtopic: { id, topicId, title, slug, description, order, difficulty, isPublished, createdAt, updatedAt }
- BlockType: "notes" | "layman" | "real-life" | "technical" | "code" | "ai-tutor"
- ContentBlock: { id, subtopicId, blockType: BlockType, content, order, isPublished, createdAt, updatedAt }
- User: { id, email, name, role: "admin" | "learner", createdAt }
- Progress: { id, userId, subtopicId, blockType: BlockType, completedAt }
- ApiResponse<T>: { data?: T, error?: string, success: boolean }

## Packages to install
drizzle-orm, drizzle-kit, @neondatabase/serverless, dotenv,
clsx, tailwind-merge, zod, lucide-react

## drizzle.config.ts
- driver: neon-http
- schema: ./src/db/schema/index.ts
- out: ./src/db/migrations
- reads DATABASE_URL from process.env

## package.json scripts
"dev": "next dev"
"build": "next build"
"db:generate": "drizzle-kit generate"
"db:push": "drizzle-kit push"
"db:migrate": "tsx src/db/migrate.ts"
"db:studio": "drizzle-kit studio"

## app/page.tsx — Marketing Home Page
Clean hero section with:
- Large heading: "Learn Smarter. From 25 Years of Teaching Experience."
- Subheading: "Premium structured notes, quizzes, and AI-powered tutoring — all in one place."
- Two CTA buttons: "Start Learning" (→ /learn) and "Admin Panel" (→ /admin)
- Three feature cards below: "Structured Notes" / "Practice Quizzes" / "Exam Prep"
- Footer with app name
- No auth yet — all links are placeholders

## Important rules
- All placeholder pages must render without errors (no broken imports)
- Every component must be typed with TypeScript — no `any`
- Use Tailwind only — no external component libraries
- Do not create any database tables yet — schema files are stubs
- Do not implement any auth yet
- Confirm dev server runs with npm run dev before finishing
```

---

### ✅ Sprint 1 Checkpoints

Before moving to Sprint 2, verify all three:

- [ ] `npm run dev` runs with zero errors, home page visible at localhost:3000
- [ ] `src/db/index.ts` exports a drizzle client (even if not yet connected to real DB)
- [ ] All placeholder pages render without crashing (`/admin/dashboard`, `/learn`)

---
---

# SPRINT 2 — Database Schema + Admin Auth

> **Goal:** All database tables created in Neon, admin can log in, protected admin routes
> **Time estimate:** 30–40 mins in Claude Code
> **Prerequisite:** Sprint 1 checkpoints all pass

---

## Sprint 2 Prompt — Paste into Claude Code

```
We are continuing the EduFlow LMS project built in Sprint 1.
Now implement the complete database schema and basic admin authentication.

## Part A — Database Schema

Fill in all the Drizzle schema files in src/db/schema/ with real table definitions.

### src/db/schema/users.ts
Table name: users
Columns:
- id: uuid, primary key, defaultRandom()
- email: text, unique, not null
- name: text, not null
- passwordHash: text, not null (we use simple bcrypt, no OAuth for now)
- role: text enum ["admin","learner"], default "learner", not null
- isActive: boolean, default true
- createdAt: timestamp, defaultNow()
- updatedAt: timestamp, defaultNow()

Indexes: unique on email

### src/db/schema/topics.ts
Table name: topics
Columns:
- id: uuid, primary key, defaultRandom()
- title: text, not null
- slug: text, unique, not null
- description: text
- icon: text (lucide icon name string, e.g. "BookOpen")
- order: integer, default 0
- isPublished: boolean, default false
- createdAt: timestamp, defaultNow()
- updatedAt: timestamp, defaultNow()

Indexes: unique on slug

### src/db/schema/subtopics.ts
Table name: subtopics
Columns:
- id: uuid, primary key, defaultRandom()
- topicId: uuid, not null, FK → topics.id onDelete cascade
- title: text, not null
- slug: text, not null
- description: text
- order: integer, default 0
- difficulty: text enum ["beginner","intermediate","advanced"], default "beginner"
- isPublished: boolean, default false
- estimatedMinutes: integer, default 15
- createdAt: timestamp, defaultNow()
- updatedAt: timestamp, defaultNow()

Indexes: unique on (topicId, slug)

### src/db/schema/content.ts
Table name: content_blocks
Columns:
- id: uuid, primary key, defaultRandom()
- subtopicId: uuid, not null, FK → subtopics.id onDelete cascade
- blockType: text enum ["notes","layman","real-life","technical","code","ai-tutor"], not null
- content: text, not null, default ""
- codeLanguage: text (only used when blockType = "code", e.g. "javascript")
- order: integer, default 0
- isPublished: boolean, default false
- generatedByAi: boolean, default false (future use)
- createdAt: timestamp, defaultNow()
- updatedAt: timestamp, defaultNow()

Indexes: unique on (subtopicId, blockType)
Note: one row per blockType per subtopic. All 6 block types get their own row.

### src/db/schema/progress.ts
Table name: user_progress
Columns:
- id: uuid, primary key, defaultRandom()
- userId: uuid, not null, FK → users.id onDelete cascade
- subtopicId: uuid, not null, FK → subtopics.id onDelete cascade
- blockType: text enum (same as content_blocks.blockType), not null
- completedAt: timestamp, defaultNow()

Indexes: unique on (userId, subtopicId, blockType)

### src/db/schema/quiz.ts
Table name: quiz_questions
Columns:
- id: uuid, primary key, defaultRandom()
- subtopicId: uuid, not null, FK → subtopics.id onDelete cascade
- question: text, not null
- options: jsonb, not null (array of strings, 4 options)
- correctIndex: integer, not null (0-3)
- explanation: text
- difficulty: text enum ["easy","medium","hard"], default "easy"
- order: integer, default 0
- isPublished: boolean, default false
- createdAt: timestamp, defaultNow()
- updatedAt: timestamp, defaultNow()

Table name: quiz_attempts
Columns:
- id: uuid, primary key, defaultRandom()
- userId: uuid, not null, FK → users.id onDelete cascade
- subtopicId: uuid, not null, FK → subtopics.id onDelete cascade
- answers: jsonb, not null (array of selected indexes)
- score: integer, not null (percentage 0-100)
- completedAt: timestamp, defaultNow()

### src/db/schema/index.ts
Re-export ALL tables and their types from all schema files.
Also export a const `schema` object containing all tables (needed for drizzle client).

## Part B — Drizzle Client Update

Update src/db/index.ts:
- Import the full schema object from schema/index.ts
- Use @neondatabase/serverless neon() function with DATABASE_URL
- Export `db` as the drizzle instance
- Export all table references directly so other files can do: import { db, topics, subtopics } from "@/db"

## Part C — Admin Authentication

Implement simple email/password auth for admin only.
No third-party auth library. No OAuth. Just JWT in httpOnly cookie.

### Files to create:

src/lib/auth.ts
- hashPassword(password: string): Promise<string> — uses bcryptjs, 10 rounds
- verifyPassword(password: string, hash: string): Promise<boolean>
- createToken(payload: { userId: string, role: string }): string — JWT, 7 day expiry, uses JWT_SECRET env var
- verifyToken(token: string): { userId: string, role: string } | null
- getSessionFromRequest(request: Request): { userId: string, role: string } | null — reads JWT from cookie named "eduflow_session"

src/lib/validations.ts
- loginSchema: zod schema — { email: z.string().email(), password: z.string().min(8) }
- createTopicSchema: zod schema — { title, slug, description?, icon?, order? }
- createSubtopicSchema: zod schema — { topicId, title, slug, description?, difficulty?, estimatedMinutes? }
- updateContentBlockSchema: zod schema — { content, codeLanguage? }

### API Routes to create:

src/app/api/auth/login/route.ts
- POST handler
- Validates body with loginSchema
- Queries users table by email
- Verifies password with verifyPassword()
- On success: sets httpOnly cookie "eduflow_session" with JWT, returns { success: true, user: { id, email, name, role } }
- On failure: returns 401 { success: false, error: "Invalid credentials" }

src/app/api/auth/logout/route.ts
- POST handler
- Clears "eduflow_session" cookie
- Returns { success: true }

src/app/api/auth/me/route.ts
- GET handler
- Reads session from cookie using getSessionFromRequest()
- Queries user from DB by userId
- Returns user object or 401

src/app/api/admin/seed/route.ts
- POST handler (DELETE THIS ROUTE AFTER FIRST USE — add a comment warning)
- Creates one admin user: email from ADMIN_EMAIL env, password from ADMIN_PASSWORD env
- Only works if zero users exist in DB
- Returns { success: true, message: "Admin user created" }

### Middleware — src/middleware.ts
- Protect all routes starting with /admin and /api/admin
- Read "eduflow_session" cookie
- Verify JWT
- If invalid: redirect /admin routes to /login, return 401 for /api/admin routes
- Public routes (no protection): /, /login, /api/auth/*, /api/health, /api/webhook/*

### Login Page — src/app/login/page.tsx
- Clean centered card layout
- Email input, Password input (both from our Input component)
- "Sign In" button (from our Button component)
- On submit: POST /api/auth/login
- On success: redirect to /admin/dashboard
- On error: show error message below form
- No "forgot password" for now

## Part D — Admin Layout Update

Update src/app/(admin)/layout.tsx:
- Fetch current user from /api/auth/me on server side
- If no user, redirect to /login
- Pass user name to AdminTopbar
- AdminSidebar should highlight current active route

## Environment variables to add to .env.local.example
JWT_SECRET=your-secret-key-min-32-chars
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-admin-password

## After implementation run these in order:
1. npm run db:push  (creates all tables in Neon)
2. Call POST /api/admin/seed to create admin user
3. Visit /login and confirm admin can log in
4. Visit /admin/dashboard and confirm protected route works
5. Visit /admin/dashboard without login (clear cookies) — confirm redirect to /login

## Rules
- No any types
- All API routes return ApiResponse<T> shape from types/index.ts
- bcryptjs not bcrypt (bcryptjs works in edge runtime)
- jsonwebtoken for JWT
- Install new packages needed: bcryptjs, jsonwebtoken, @types/bcryptjs, @types/jsonwebtoken
```

---

### ✅ Sprint 2 Checkpoints

- [ ] `npm run db:push` runs without errors — check Neon dashboard, all 7 tables visible
- [ ] POST `/api/admin/seed` creates admin user successfully
- [ ] Admin can log in at `/login` and is redirected to `/admin/dashboard`
- [ ] Visiting `/admin/dashboard` without a cookie redirects to `/login`

---
---

# SPRINT 3 — Topic & Subtopic Management (Admin)

> **Goal:** Admin can create Topics and Subtopics through the UI. Full CRUD.
> **Time estimate:** 30–40 mins in Claude Code

---

## Sprint 3 Prompt — Paste into Claude Code

```
Continuing EduFlow LMS. Sprint 1 and 2 are complete.
Now build the complete Topic and Subtopic management for the admin panel.

## Part A — API Routes

### src/app/api/admin/topics/route.ts
GET handler:
- Auth guard: must be admin
- Query all topics ordered by `order` asc
- Return ApiResponse<Topic[]>

POST handler:
- Auth guard: must be admin
- Validate body with createTopicSchema
- Auto-generate slug from title if not provided (lowercase, hyphens, no special chars)
- Insert into topics table
- Return ApiResponse<Topic>

### src/app/api/admin/topics/[id]/route.ts
GET handler: fetch single topic by id, return with its subtopics count
PUT handler: update topic fields, validate with createTopicSchema partial
DELETE handler: delete topic (cascades to subtopics and content_blocks)

### src/app/api/admin/subtopics/route.ts
GET handler:
- Query param: topicId (required)
- Return subtopics for that topic ordered by `order` asc
- Include count of published content blocks per subtopic

POST handler:
- Validate with createSubtopicSchema
- Auto-generate slug if not provided
- Insert into subtopics

### src/app/api/admin/subtopics/[id]/route.ts
GET: single subtopic with all 6 content blocks (or empty if not yet created)
PUT: update subtopic fields
DELETE: delete subtopic

### src/app/api/admin/topics/[id]/publish/route.ts
POST handler:
- Toggle isPublished on topic
- Can only publish if at least 1 published subtopic exists
- Return updated topic

### src/app/api/admin/subtopics/[id]/publish/route.ts
POST handler:
- Toggle isPublished on subtopic  
- Can only publish if all 6 content blocks exist and are published
- Return { success, isPublished, missingBlocks: BlockType[] }

## Part B — Admin UI Pages

### src/app/(admin)/topics/page.tsx
Class names and structure:
- Container: "p-6 space-y-6"
- PageHeader component with title "Topics" and a "New Topic" Button (primary)
- Topics displayed as a responsive grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
- Each topic in a Card component:
  - CardHeader: icon (lucide, from topic.icon field) + topic title + Badge (published/draft)
  - CardContent: description text, subtopic count "X subtopics"
  - CardFooter: "Manage" button (→ /admin/topics/[id]) + publish toggle button
- Empty state using EmptyState component when no topics exist
- "New Topic" opens a Modal (from our Modal component) with the create form

TopicForm component (create inside this file or separate):
- Fields: Title (Input), Slug (Input, auto-filled from title), Description (textarea), Icon (Input with helper "Use any lucide-react icon name"), Order (number Input)
- Submit calls POST /api/admin/topics
- Show validation errors inline

### src/app/(admin)/topics/[id]/page.tsx
- PageHeader: topic title + back arrow link to /admin/topics + publish toggle button
- Topic details card at top: editable inline or via edit modal
- Section below: "Subtopics" heading + "Add Subtopic" button
- Subtopics listed in a sortable-looking list (visual only, no drag-drop yet):
  "divide-y divide-slate-200 rounded-lg border border-slate-200"
  Each row: order number + subtopic title + difficulty Badge + content progress (e.g. "4/6 blocks") + "Edit Content" button (→ /admin/subtopics/[id]/content) + delete button
- Empty state if no subtopics

SubtopicForm modal:
- Fields: Title, Slug, Description, Difficulty (select: beginner/intermediate/advanced), Estimated Minutes (number)
- Submit calls POST /api/admin/subtopics

### src/app/(admin)/topics/[id]/subtopics/[subtopicId]/content/page.tsx
This is the CORE admin page — where content for all 6 blocks is entered manually.

Layout:
- PageHeader: subtopic title + back link + "Publish Subtopic" button
- Left sidebar (1/4 width): block type navigator
  "sticky top-4 space-y-1"
  Each block as a nav item showing: block name + completion indicator (green check or gray circle)
  Clicking navigates to that block section on the page
- Right content area (3/4 width): one section per block type

Each block section structure:
  - Section heading: block type name (capitalized) + what it means (e.g. "Layman — Simple explanation for beginners")
  - Status badge: Published / Draft
  - Textarea for content (large, min 200px height, monospace for code block)
  - For "code" block only: language selector Input above textarea (e.g. "javascript", "python")
  - "Save Draft" button + "Publish Block" button
  - Last saved timestamp
  - Character count below textarea

Block type descriptions to show as helper text:
- notes: "Structured reference notes. Use markdown formatting."
- layman: "Explain like the learner is 10 years old. Simple words, short sentences."
- real-life: "A real-world scenario or analogy that makes this concept click."
- technical: "Deep technical breakdown. Implementation details, edge cases, performance."
- code: "Working code example with comments. Learner can read and understand."
- ai-tutor: "Write 5-8 Q&A pairs a learner might ask. Format: Q: ... A: ..."

Save behavior:
- "Save Draft" calls PUT /api/admin/content-blocks/[id] with { content, codeLanguage?, isPublished: false }
- "Publish Block" calls PUT with { isPublished: true }
- Auto-save draft every 30 seconds if content changed (show "Auto-saving..." indicator)

## Part C — Content Block API

### src/app/api/admin/content-blocks/route.ts
POST: create a content block (or upsert by subtopicId + blockType)

### src/app/api/admin/content-blocks/[id]/route.ts
GET: single block
PUT: update content + isPublished
Upsert logic: if block doesn't exist for this subtopic+blockType, create it. Otherwise update.

## Part D — Reusable hooks

### src/hooks/useTopics.ts
- useTopics(): fetches GET /api/admin/topics, returns { topics, isLoading, error, refetch }
- useCreateTopic(): returns { createTopic(data), isLoading, error }
- useUpdateTopic(): returns { updateTopic(id, data), isLoading, error }
- useDeleteTopic(): returns { deleteTopic(id), isLoading, error }

### src/hooks/useSubtopics.ts
- useSubtopics(topicId): fetches subtopics for a topic
- useCreateSubtopic(), useUpdateSubtopic(), useDeleteSubtopic()

### src/hooks/useContentBlocks.ts
- useContentBlocks(subtopicId): fetches all 6 blocks for a subtopic
- useUpdateContentBlock(): returns { updateBlock(id, data), isLoading, error }

## Rules
- All fetch calls use the native fetch API — no axios, no SWR, no React Query
- All forms show loading state on submit (disable button + show Spinner)
- All delete actions show a confirmation step ("Are you sure?" in Modal)
- Optimistic UI not required — just refetch after mutations
- No any types
```

---

### ✅ Sprint 3 Checkpoints

- [ ] Admin can create a Topic and see it in the grid
- [ ] Admin can add Subtopics under a Topic
- [ ] Admin can open a Subtopic and type content into all 6 block sections and save
- [ ] Published badge updates correctly after clicking Publish

---
---

# SPRINT 4 — Learner Experience

> **Goal:** Learners can browse topics, read all 6 content blocks, progress is tracked
> **Time estimate:** 40–50 mins in Claude Code

---

## Sprint 4 Prompt — Paste into Claude Code

```
Continuing EduFlow LMS. Sprints 1-3 complete.
Now build the complete learner-facing experience.

## Part A — Learner Auth

### src/app/register/page.tsx
- Same card layout as /login
- Fields: Name, Email, Password, Confirm Password
- Calls POST /api/auth/register
- On success: redirect to /learn

### src/app/api/auth/register/route.ts
- Validate: name (min 2 chars), email (valid), password (min 8), confirmPassword matches
- Check email not already in use
- Hash password, insert user with role="learner"
- Set session cookie same as login
- Return { success: true, user }

Update middleware.ts:
- /learn/* routes require auth (any role)
- Redirect to /login if no session
- Pass userId to page via header or cookie (for progress tracking)

## Part B — Public Topic Browser

### src/app/(learner)/learn/page.tsx
Layout: "max-w-5xl mx-auto px-4 py-8 space-y-8"
- Heading: "What do you want to learn today?"
- Search input (client-side filter by topic title)
- Topics grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

Each topic Card:
- Icon from topic.icon field (lucide-react dynamic import)
- Title, description
- Subtopic count badge
- Progress bar: "X of Y subtopics completed" (green progress bar)
- "Continue" or "Start" button → /learn/[topicSlug]

Fetch: GET /api/learner/topics (public endpoint, returns only published topics + learner progress)

### src/app/(learner)/learn/[topicSlug]/page.tsx
- Topic title + description header
- Back link to /learn
- Subtopics listed as cards in order:
  Each subtopic card:
  - Title + difficulty Badge + estimated time
  - Progress: "X/6 blocks read"
  - Visual progress bar (6 segments, one per block type, colored when complete)
  - Status: "Not Started" / "In Progress" / "Completed" badge
  - Click → /learn/[topicSlug]/[subtopicSlug]
  - Locked state visual (gray) if previous subtopic not completed (optional, can skip lock for now)

### src/app/(learner)/learn/[topicSlug]/[subtopicSlug]/page.tsx
This is the CORE learner page.

Layout: two column on desktop, single column on mobile
"flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto px-4 py-6"

Left sidebar (lg:w-64, sticky):
- Subtopic title
- Block navigator: 6 items, each showing:
  - Block type icon (use lucide icons: FileText, User, Globe, Code2, Terminal, Bot)
  - Block name
  - Completion indicator: green checkmark if completed, gray circle if not
  - Click to scroll to that block section
- "Take Quiz" button at bottom (disabled until all 6 blocks completed)
- Overall completion: "X/6 blocks completed" with circular progress indicator

Right main content:
- Each block as a distinct section with id matching block type
- Section structure for each block:
  Wrapper: "mb-12 scroll-mt-20"
  Header: "flex items-center gap-3 mb-4 pb-2 border-b border-slate-200"
    - Block icon (lucide)
    - Block type label in colored badge:
      notes → indigo, layman → green, real-life → amber, technical → purple, code → slate, ai-tutor → rose
    - Block title (friendly name, not slug)
  Content area: "prose prose-slate max-w-none" (install @tailwindcss/typography)
    - notes, layman, real-life, technical: render markdown (install react-markdown)
    - code: render with syntax highlighting (install react-syntax-highlighter)
    - ai-tutor: render Q&A pairs in an accordion style (each Q: expandable to show A:)
  Bottom of each section:
    "Mark as Read" button (primary, small) — if not yet completed
    "✓ Completed" badge (green) — if already completed
    Clicking "Mark as Read" calls POST /api/learner/progress with { subtopicId, blockType }

## Part C — Learner API Routes

### src/app/api/learner/topics/route.ts
GET handler:
- Auth required
- Return all published topics
- For each topic: include subtopic count + learner's completion count
- Shape: Topic & { subtopicCount: number, completedSubtopics: number }

### src/app/api/learner/topics/[slug]/route.ts
GET handler:
- Return single published topic by slug
- Include all published subtopics ordered by `order`
- For each subtopic: include learner progress (which blocks completed)

### src/app/api/learner/subtopics/[slug]/route.ts
GET handler:
- Return single published subtopic by slug
- Include all 6 published content blocks
- Include learner progress for this subtopic
- Shape: Subtopic & { blocks: ContentBlock[], completedBlocks: BlockType[] }

### src/app/api/learner/progress/route.ts
POST handler:
- Auth required
- Body: { subtopicId: string, blockType: BlockType }
- Upsert into user_progress (insert if not exists, ignore if exists)
- Return { success: true, completedBlocks: BlockType[], isSubtopicComplete: boolean }

GET handler:
- Auth required
- Query param: subtopicId
- Return all completed blocks for this learner + this subtopic

### src/app/api/learner/progress/summary/route.ts
GET handler:
- Auth required
- Return overall progress summary for learner:
  { totalSubtopics, completedSubtopics, totalBlocks, completedBlocks, topicProgress: { topicId, completed, total }[] }

## Part D — Learner Dashboard

### src/app/(learner)/dashboard/page.tsx
Layout: "max-w-4xl mx-auto px-4 py-8 space-y-8"
Sections:
- Welcome heading: "Welcome back, [name]"
- Stats row: 3 stat cards showing:
  "Topics Started", "Subtopics Completed", "Blocks Read"
  Each card: large number + label + small description
- "Continue Learning" section: last 3 in-progress subtopics as cards with progress bars
- "Recently Completed" section: last 5 completed subtopics
- "Suggested Next" section: next unstarted subtopic in current topic

## Part E — Progress hooks

### src/hooks/useProgress.ts
- useProgress(subtopicId): fetches learner progress for a subtopic
- useMarkComplete(): returns { markComplete(subtopicId, blockType), isLoading }
- useProgressSummary(): fetches overall progress summary

## Packages to install
react-markdown, react-syntax-highlighter, @types/react-syntax-highlighter,
@tailwindcss/typography

Update tailwind.config.ts to include typography plugin.

## Rules
- Scroll to block section smoothly when clicking sidebar nav item
- "Mark as Read" button becomes "✓ Completed" immediately (optimistic update)
- Mobile layout: sidebar collapses to a horizontal scrollable tab bar at the top
- All pages handle loading state with Spinner
- All pages handle error state with a retry button
```

---

### ✅ Sprint 4 Checkpoints

- [ ] Learner can register, log in, browse topics
- [ ] Learner can open a subtopic and read all 6 content blocks
- [ ] Clicking "Mark as Read" on each block saves to DB and shows green checkmark
- [ ] After all 6 blocks complete, "Take Quiz" button activates

---
---

# SPRINT 5 — Quiz Platform

> **Goal:** Admin creates quiz questions per subtopic. Learner takes quiz after completing content.
> **Time estimate:** 30–40 mins in Claude Code

---

## Sprint 5 Prompt — Paste into Claude Code

```
Continuing EduFlow LMS. Sprints 1-4 complete.
Now build the Quiz Platform — admin creates questions, learner takes quiz.

## Part A — Admin Quiz Management

### src/app/api/admin/quiz/questions/route.ts
GET: query param subtopicId — return all questions for that subtopic ordered by `order`
POST: create new question
  Body: { subtopicId, question, options: string[4], correctIndex: 0|1|2|3, explanation?, difficulty?, order? }
  Validate: options must have exactly 4 items, correctIndex must be 0-3

### src/app/api/admin/quiz/questions/[id]/route.ts
GET, PUT, DELETE — standard CRUD

### src/app/api/admin/quiz/questions/[id]/publish/route.ts
POST: toggle isPublished on question

### src/app/(admin)/topics/[id]/subtopics/[subtopicId]/quiz/page.tsx
Layout similar to content page.
PageHeader: "[Subtopic Title] — Quiz Questions" + back link + "Add Question" button

Question list:
- Each question in a Card:
  - Question text (truncated to 100 chars)
  - 4 options listed, correct one highlighted in green
  - Difficulty badge
  - Published status badge
  - Edit button (opens modal) + Delete button + publish toggle

QuestionForm modal:
- Question textarea
- 4 option inputs (labeled A, B, C, D)
- Correct answer: radio buttons (A/B/C/D)
- Explanation textarea (optional, shown after answer)
- Difficulty select: easy / medium / hard
- Validation: all 4 options must be filled

Add link to this quiz page from the subtopic content page admin nav.

## Part B — Learner Quiz Experience

### src/app/(learner)/learn/[topicSlug]/[subtopicSlug]/quiz/page.tsx
Gate: redirect to subtopic page if not all 6 blocks completed.

Quiz flow — three states:

STATE 1 — Ready screen:
- Subtopic title + "Quiz Time!" heading
- Number of questions badge
- Estimated time (questions × 45 seconds)
- Rules: "Read each question carefully. No time limit. See explanation after each answer."
- "Start Quiz" button

STATE 2 — Question screen (one at a time):
Layout: "max-w-2xl mx-auto px-4 py-8"
- Progress bar at top: "Question X of Y"
- Question number badge + question text (large, clear)
- 4 option buttons:
  "w-full text-left px-4 py-3 rounded-lg border-2 border-slate-200 hover:border-indigo-300"
  On selection: show correct/incorrect immediately
    - Correct: border-green-500, bg-green-50, green checkmark icon
    - Incorrect: border-red-400, bg-red-50, red X icon + highlight correct answer in green
- Explanation card (shown after answer selected):
  "mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg"
  "💡 " + explanation text
- "Next Question" button (appears after answering)

STATE 3 — Results screen:
- Large score: "You scored X%" 
- Visual: circular progress or large colored number
  ≥80%: green "Excellent!" 
  60-79%: amber "Good effort!"
  <60%: red "Keep studying"
- Per-question review list:
  Each question: ✓ or ✗ icon + question text + your answer + correct answer
- Two buttons: "Retake Quiz" + "Back to Topic"
- If score ≥ 80%: show "🎉 Subtopic Mastered!" banner

### src/app/api/learner/quiz/[subtopicId]/route.ts
GET: return all published questions for a subtopic (without revealing correctIndex)
Questions returned shape: { id, question, options, difficulty, order } — NO correctIndex

### src/app/api/learner/quiz/submit/route.ts
POST handler:
Body: { subtopicId, answers: { questionId: string, selectedIndex: number }[] }
Logic:
- Fetch all questions for subtopic
- Compare each submitted answer to correctIndex
- Calculate score (correct / total × 100)
- Insert into quiz_attempts: { userId, subtopicId, answers (jsonb), score }
- Return:
  {
    score: number,
    totalQuestions: number,
    correctCount: number,
    results: { questionId, correct: boolean, correctIndex, explanation }[],
    passed: boolean (score >= 80)
  }

### src/app/api/learner/quiz/history/route.ts
GET: query param subtopicId
Return last 5 quiz attempts for this learner + subtopic ordered by completedAt desc

## Part C — Admin Quiz Dashboard

Add a "Quiz" section to admin sidebar.

### src/app/(admin)/quiz/page.tsx
Overview page:
- Stats: total questions, published questions, total quiz attempts
- Table: subtopics with their question counts and attempt stats
  Columns: Subtopic | Topic | Questions | Avg Score | Attempts | Actions
- "Manage Questions" link per row → /admin/topics/[id]/subtopics/[subtopicId]/quiz

## Rules
- Never expose correctIndex in GET /api/learner/quiz/[subtopicId]
- Quiz score saved even if learner leaves mid-quiz (save on each answer? No — save only on submit)
- Retaking quiz always creates a new quiz_attempt row
- Show best score if multiple attempts exist
```

---

### ✅ Sprint 5 Checkpoints

- [ ] Admin can add 5+ questions to a subtopic with 4 options each
- [ ] Learner cannot access quiz until all 6 content blocks are completed
- [ ] Quiz shows correct/incorrect feedback immediately after each answer
- [ ] Score is saved to `quiz_attempts` table and visible in DB

---
---

# SPRINT 6 — Exam Engine Bridge (Webhook)

> **Goal:** When a learner fails an exam in the external Exam Engine, Tutorial Engine auto-assigns remediation content
> **Time estimate:** 20–30 mins in Claude Code

---

## Sprint 6 Prompt — Paste into Claude Code

```
Continuing EduFlow LMS. Sprints 1-5 complete.
Now build the Exam Engine bridge — a webhook that receives exam results
and auto-assigns tutorial content for weak topics.

## Overview
The external Exam Engine (separate Next.js project on Neon) will call our webhook
when a learner completes an exam. We receive weak topic slugs, find matching subtopics,
and create a remediation assignment for the learner.

## Part A — New Database Tables

Add to src/db/schema/progress.ts (or new file src/db/schema/remediation.ts):

Table: remediation_assignments
Columns:
- id: uuid, primary key, defaultRandom()
- userId: uuid, not null, FK → users.id
- examId: text, not null (external exam ID, just stored as string)
- examTitle: text (for display)
- weakTopicSlugs: jsonb, not null (string array of topic slugs from exam engine)
- assignedSubtopicIds: jsonb, not null (string array of subtopic IDs we assigned)
- status: text enum ["pending","in-progress","completed"], default "pending"
- score: integer (the exam score that triggered this)
- passingScore: integer (what score was needed to pass)
- createdAt: timestamp, defaultNow()
- completedAt: timestamp, nullable

Run db:push after adding this table.

## Part B — Webhook Route

### src/app/api/webhook/exam-result/route.ts

POST handler — this is called by the external Exam Engine.

Request body shape:
{
  userId: string,          -- the learner's email (we match by email since separate DBs)
  examId: string,          -- external exam ID
  examTitle: string,
  score: number,           -- 0-100
  passingScore: number,    -- e.g. 70
  passed: boolean,
  weakTopicSlugs: string[] -- slugs matching topics in our tutorial engine
}

Security:
- Read header "x-webhook-secret"
- Compare to WEBHOOK_SECRET env variable using timing-safe comparison (crypto.timingSafeEqual)
- Return 401 if missing or wrong

Logic:
1. If passed === true: return { success: true, message: "No remediation needed" }
2. Find user in our DB by email. If not found: return 404 { error: "User not found in tutorial engine" }
3. Find published subtopics whose parent topic slug matches any of weakTopicSlugs
   (Get subtopics that haven't been completed by this user yet — no user_progress rows for all 6 blocks)
4. Insert into remediation_assignments:
   { userId, examId, examTitle, weakTopicSlugs, assignedSubtopicIds, score, passingScore, status: "pending" }
5. Return:
   {
     success: true,
     assignedSubtopics: { id, title, topicSlug }[],
     message: "X subtopics assigned for remediation"
   }

Add WEBHOOK_SECRET to .env.local.example

## Part C — Learner Remediation Dashboard

### src/app/(learner)/remediation/page.tsx

PageHeader: "Study Plan" + subtitle "Topics assigned based on your exam results"

If no remediation assignments:
- EmptyState: "No study plans yet" + "Complete an exam to get personalized recommendations"

If assignments exist:
Each assignment as a Card:
- Header: exam title + date + score badge (red if failed)
- "You scored X%. Passing score was Y%."
- Assigned subtopics list:
  Each subtopic row:
  - Subtopic title + topic badge
  - Progress: "X/6 blocks read"
  - Mini progress bar (6 segments)
  - Status badge: Not Started / In Progress / Completed
  - "Study Now" button → /learn/[topicSlug]/[subtopicSlug]
- Overall assignment progress bar
- When all assigned subtopics completed: green banner "✓ Study Plan Complete! You're ready to retake the exam."

### src/app/api/learner/remediation/route.ts
GET handler:
- Auth required
- Return all remediation_assignments for this learner
- For each assignment: include assigned subtopics with learner progress
- Compute: isComplete (all assigned subtopics have all 6 blocks completed)
- Update status to "completed" if isComplete and status !== "completed"

## Part D — Remediation Progress in Main Dashboard

Update src/app/(learner)/dashboard/page.tsx:
- Add a "Study Plans" section if any active remediation assignments exist
- Show count: "X active study plans from exam results"
- Link to /remediation

## Part E — Admin Webhook Tester

### src/app/(admin)/settings/page.tsx
Add a "Webhook Tester" section (dev tool, clearly labeled "Development Only"):
- Form fields: User Email, Exam ID, Exam Title, Score, Passing Score, Weak Topic Slugs (comma separated)
- "Send Test Webhook" button
- Calls the webhook internally with the correct secret header
- Shows the response JSON below

## Part F — Add to Learner Nav

Update LearnerTopbar.tsx:
- Add "Study Plan" nav link → /remediation
- Show a red dot badge on it if any active remediation assignments exist

## Environment variables to add
WEBHOOK_SECRET=your-webhook-secret-min-32-chars
(Also add to .env.local.example with a note: "Share this with exam engine team")

## Rules
- Webhook must work even if learner has no progress yet in tutorial engine
- Never trust the userId from exam engine blindly — always look up by email
- Log webhook calls to console (timestamp + examId + userId + result) for debugging
- Timing-safe comparison is mandatory for webhook secret check
```

---

### ✅ Sprint 6 Checkpoints

- [ ] `remediation_assignments` table exists in Neon DB
- [ ] POST `/api/webhook/exam-result` with correct secret returns assigned subtopics
- [ ] POST with wrong secret returns 401
- [ ] Learner can see their study plan at `/remediation`

---
---

# SPRINT 7 — Admin Dashboard + Analytics

> **Goal:** Admin gets a real dashboard with platform stats and content health overview
> **Time estimate:** 20–30 mins in Claude Code

---

## Sprint 7 Prompt — Paste into Claude Code

```
Continuing EduFlow LMS. Sprints 1-6 complete.
Now build the admin dashboard with real stats and a content health overview.

## Part A — Stats API

### src/app/api/admin/stats/route.ts
GET handler — admin only.
Run these queries and return all together:
{
  users: { total, learners, admins, newThisWeek },
  content: { totalTopics, publishedTopics, totalSubtopics, publishedSubtopics, totalBlocks, publishedBlocks },
  engagement: { totalProgressEvents, uniqueLearnersActive, subtopicsCompleted, quizzesTaken, avgQuizScore },
  remediation: { totalAssignments, pendingAssignments, completedAssignments }
}

### src/app/api/admin/stats/topic-health/route.ts
GET: for each topic return:
{
  topicId, topicTitle, isPublished,
  subtopicCount, publishedSubtopicCount,
  contentHealth: percentage of subtopics with all 6 blocks published,
  totalQuizQuestions, learnersStarted, learnersCompleted
}

## Part B — Admin Dashboard Page

### src/app/(admin)/dashboard/page.tsx

Section 1 — Stats Grid
"grid grid-cols-2 lg:grid-cols-4 gap-4"
StatCard component (create inline):
- Large number (animated count-up on load using useEffect)
- Label below
- Small percentage change or description
- Icon (lucide)
Cards: Total Learners / Active This Week / Subtopics Completed / Avg Quiz Score

Section 2 — Content Health Table
Heading: "Content Health" + subtitle "Track which topics are ready for learners"
Table: "w-full text-sm"
Columns: Topic | Subtopics | Content Ready | Quiz Questions | Learners | Status
Content Ready: show as "X/Y subtopics" with a mini progress bar
Status: "Ready" (green badge) if all published, "Needs Content" (amber), "Draft" (gray)

Section 3 — Recent Activity Feed
Last 10 quiz attempts across all learners:
Each row: learner name + subtopic title + score + time ago
"X minutes ago" formatting using a formatTimeAgo() utility

Section 4 — Quick Actions
Card with buttons:
- "Add New Topic" → /admin/topics (then open modal)
- "View All Learners" → /admin/learners
- "Check Study Plans" → /admin/remediation

## Part C — Learner Management

### src/app/(admin)/learners/page.tsx
Table of all learners:
Columns: Name | Email | Joined | Subtopics Completed | Last Active | Actions
Search input (client-side filter)
Click learner row → /admin/learners/[id]

### src/app/api/admin/learners/route.ts
GET: return all users with role=learner
Include: subtopics completed count, last progress event date

### src/app/(admin)/learners/[id]/page.tsx
Learner profile view:
- Name, email, joined date
- Stats: blocks read, subtopics completed, quizzes taken, avg score
- Progress table: all topics with completion status
- Quiz history: last 10 attempts with scores
- Active study plans from remediation

### src/app/api/admin/learners/[id]/route.ts
GET: full learner profile with all stats

## Part D — Remediation Admin View

### src/app/(admin)/remediation/page.tsx
Table of all remediation_assignments:
Columns: Learner | Exam | Score | Assigned Subtopics | Progress | Status | Date
Filter by status: all / pending / in-progress / completed

## Part E — Utility function

Add to src/lib/utils.ts:
- formatTimeAgo(date: Date): string — "2 minutes ago", "3 hours ago", "yesterday", "3 days ago"
- calculatePercentage(value: number, total: number): number — safe division, returns 0 if total=0
- getContentHealthStatus(publishedCount: number, totalCount: number): "ready" | "partial" | "empty"

## Rules
- All stats are real DB queries — no fake/hardcoded data
- Tables support at least 100 rows without breaking layout (use overflow-x-auto)
- Loading states on all data fetches
- Admin dashboard is the first thing admin sees after login — make it genuinely useful
```

---

### ✅ Sprint 7 Checkpoints

- [ ] Admin dashboard shows real numbers from the database
- [ ] Content health table shows correct published/total counts per topic
- [ ] Admin can view a learner's full progress profile
- [ ] Remediation assignments visible in admin panel

---
---

# SPRINT 8 — Polish, SEO & Deployment Prep

> **Goal:** Production-ready polish, SEO metadata, error handling, deployment config
> **Time estimate:** 20–30 mins in Claude Code

---

## Sprint 8 Prompt — Paste into Claude Code

```
Continuing EduFlow LMS. Sprints 1-7 complete.
Final sprint — production polish, error handling, SEO, and deployment config.

## Part A — Error Handling

### src/app/error.tsx (root error boundary)
- Centered layout
- "Something went wrong" heading
- Error message (only show details in development)
- "Try Again" button (calls reset()) + "Go Home" link

### src/app/not-found.tsx
- Clean 404 page
- "Page not found" + helpful message
- Link back to home and to /learn

### src/app/(learner)/learn/[topicSlug]/not-found.tsx
- "Topic not found" specific message
- Back to browse topics link

Add error.tsx to admin route group too.

## Part B — Loading States

### src/app/(learner)/learn/loading.tsx
Skeleton loader: 3 placeholder topic cards with gray animated pulse

### src/app/(learner)/learn/[topicSlug]/loading.tsx  
Skeleton: subtopic list placeholder

### src/app/(learner)/learn/[topicSlug]/[subtopicSlug]/loading.tsx
Skeleton: content blocks placeholder (6 gray rectangles)

### src/app/(admin)/topics/loading.tsx
Skeleton: topic grid placeholder

## Part C — SEO Metadata

### src/app/layout.tsx — update metadata
export const metadata: Metadata = {
  title: { default: "EduFlow — Learn from 25 Years of Teaching", template: "%s | EduFlow" },
  description: "Premium structured notes, quizzes, and exam prep built on 25 years of teaching experience.",
  keywords: ["learning", "education", "notes", "quiz", "exam prep"],
  openGraph: { type: "website", siteName: "EduFlow" }
}

### Dynamic metadata per topic page
In /learn/[topicSlug]/page.tsx:
export async function generateMetadata({ params }): Promise<Metadata> {
  Fetch topic by slug, return:
  { title: topic.title, description: topic.description }
}

### Dynamic metadata per subtopic page
Same pattern for subtopic pages.

## Part D — Performance

In src/app/(learner)/learn/[topicSlug]/[subtopicSlug]/page.tsx:
- Wrap in Suspense with skeleton fallback
- Use Next.js `cache` or `unstable_cache` for content blocks query
  (Content rarely changes — cache for 1 hour, tag: "content-[subtopicId]")
- Revalidate cache tag when admin publishes a block

In src/app/api/admin/content-blocks/[id]/route.ts PUT handler:
- After successful update: call revalidateTag("content-[subtopicId]")
- This ensures learners get fresh content within seconds of admin publishing

## Part E — Vercel Deployment Config

### vercel.json (create in root)
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "env vars": add a comment listing all required env vars
}

### .env.production.example (create in root)
DATABASE_URL=
JWT_SECRET=
WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

### src/lib/env.ts (create)
Validate all required env vars at startup:
- Check DATABASE_URL, JWT_SECRET, WEBHOOK_SECRET exist
- If any missing in production: throw clear error "Missing required env var: X"
- Export typed env object: { DATABASE_URL, JWT_SECRET, WEBHOOK_SECRET, ANTHROPIC_API_KEY? }
Import this in db/index.ts and lib/auth.ts instead of process.env directly

## Part F — AI Content Generation Stub (ready for future)

### src/app/api/admin/content-blocks/[id]/generate/route.ts
POST handler:
- Check if ANTHROPIC_API_KEY is configured
- If not: return 503 { error: "AI generation not configured", setupRequired: true }
- If yes (future): call Anthropic API to generate content for this block type
  (Leave as stub with a clear TODO comment for now)
- Body: { blockType, subtopicTitle, topicTitle, additionalContext? }

Update the content block admin page:
- Add "✨ Generate with AI" button next to each block's textarea
- Button disabled with tooltip "Coming soon — AI generation not configured yet"
- When ANTHROPIC_API_KEY is present in future: button becomes active, calls the generate route

## Part G — Final Cleanup

1. Remove POST /api/admin/seed route entirely (or add a guard: only works if ENABLE_SEED=true in env)
2. Add console.log cleanup — replace all debug logs with proper conditional logging:
   if (process.env.NODE_ENV === 'development') console.log(...)
3. Review all API routes — ensure every route has auth check
4. Add rate limiting comment to webhook route: 
   "TODO: Add Upstash rate limiting before production launch"
5. Ensure all images use next/image (there shouldn't be any img tags)
6. Run: npx tsc --noEmit and fix any TypeScript errors

## Rules
- No new features in this sprint — only polish and hardening
- All skeleton loaders must match the shape of the real content
- Cache revalidation must actually work (test: publish a block, refresh learner page, see update within 5 seconds)
- TypeScript must compile with zero errors after this sprint
```

---

### ✅ Sprint 8 Checkpoints

- [ ] `npx tsc --noEmit` runs with zero TypeScript errors
- [ ] Visiting a broken URL shows the 404 page, not a crash
- [ ] Publishing a content block in admin → learner sees update within 5 seconds (cache revalidation works)
- [ ] All required env vars listed in `.env.production.example`

---
---

# FUTURE SPRINTS (when you're ready)

These are not prompts yet — just a roadmap for when the current build is live.

```
SPRINT 9  — AI Content Generation
          Activate ANTHROPIC_API_KEY
          Admin types topic name → AI generates all 6 blocks automatically
          Admin reviews and edits before publishing

SPRINT 10 — Advanced Learner Features
          Bookmarks, notes per block, highlight text
          "Difficult" flag per block (shows to admin as feedback)

SPRINT 11 — Notifications
          Email when study plan assigned (Resend or Nodemailer)
          Weekly progress summary email

SPRINT 12 — Mobile App (optional)
          React Native or PWA wrapper
          Offline content reading

SPRINT 13 — Premium / Payments (if monetizing)
          Stripe integration
          Free vs premium topic gating
```

---

# Quick Reference — All API Routes

```
AUTH
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/register

ADMIN — TOPICS
GET    /api/admin/topics
POST   /api/admin/topics
GET    /api/admin/topics/[id]
PUT    /api/admin/topics/[id]
DELETE /api/admin/topics/[id]
POST   /api/admin/topics/[id]/publish

ADMIN — SUBTOPICS
GET    /api/admin/subtopics?topicId=
POST   /api/admin/subtopics
GET    /api/admin/subtopics/[id]
PUT    /api/admin/subtopics/[id]
DELETE /api/admin/subtopics/[id]
POST   /api/admin/subtopics/[id]/publish

ADMIN — CONTENT
POST   /api/admin/content-blocks
GET    /api/admin/content-blocks/[id]
PUT    /api/admin/content-blocks/[id]
POST   /api/admin/content-blocks/[id]/generate   (stub)

ADMIN — QUIZ
GET    /api/admin/quiz/questions?subtopicId=
POST   /api/admin/quiz/questions
PUT    /api/admin/quiz/questions/[id]
DELETE /api/admin/quiz/questions/[id]

ADMIN — STATS
GET    /api/admin/stats
GET    /api/admin/stats/topic-health
GET    /api/admin/learners
GET    /api/admin/learners/[id]

LEARNER
GET    /api/learner/topics
GET    /api/learner/topics/[slug]
GET    /api/learner/subtopics/[slug]
POST   /api/learner/progress
GET    /api/learner/progress?subtopicId=
GET    /api/learner/progress/summary
GET    /api/learner/quiz/[subtopicId]
POST   /api/learner/quiz/submit
GET    /api/learner/quiz/history?subtopicId=
GET    /api/learner/remediation

WEBHOOK
POST   /api/webhook/exam-result

SYSTEM
GET    /api/health
```

---

> **Remember:** Complete all checkpoints for each sprint before moving to the next.
> Each sprint builds on the previous — skipping ahead will cause broken imports and missing dependencies.
