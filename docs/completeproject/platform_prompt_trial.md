# Platform Implementation Prompt — Phase-Wise AI Guide
> Rules: Suggest what/how/where. Give variable names, class names, file paths. No complete code.

---

## Context

### CORRECTED Design Direction
**RTH is the design source of truth.**
SkillUp apps (skillup-web, skillup-admin, faculty-app) must follow RTH's layout, typography,
card system, and glassmorphism style — but use SkillUp's own brand color (cyan `#0ea5e9`).
RTH apps (realtutorialhub-quiz, realtutorialhub-admin, realtutorialhub-web) must NOT be changed.

### Safety Rules (Non-Negotiable)
- RTH Cloud Run, Neon, Cloudflare, GCP CI — all must remain unaffected
- RTH apps (quiz, admin, web, api-server) — zero changes to existing functionality
- SkillUp Cloud Run containers are also live — changes must be additive only
- Never rename/delete existing routes, env vars, or deployed components
- Never add required env vars without GCP Secret Manager update

### 5 Databases
| Variable | DB | Owns |
|---|---|---|
| `DATABASE_URL` | `quiz_platform_prod` | Exams, Questions, Topics, Reports |
| `DATABASE_URL_PEOPLE` | `people_prod` | Users, Auth, Roles, Platform Access |
| `DATABASE_URL_TUTORIAL` | `tutorial_prod` | Tutorial content, sessions, progress |
| `DATABASE_URL_PAYMENT` | `payment_prod` | Payments |
| `DATABASE_URL_PLACEMENT` | `placement_prod` | Jobs |

### Brand separation (already in DB — do not change)
- `people_prod.users.platform` enum: [('realtutorialhub', 'skillup')](file:///d:/onlinewebsites/quiz-platform/packages/api-client/src/core/fetch-client.ts#289-292) — already exists
- `people_prod.platform_access` — allows one user on multiple platforms
- [request-brand.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/lib/request-brand.ts) detects brand from hostname — do not touch
- JWT `brand` claim — do not change token structure

### App State
| App | State |
|---|---|
| `realtutorialhub-quiz` | ✅ Complete — DO NOT CHANGE |
| `realtutorialhub-admin` | ✅ Complete — DO NOT CHANGE |
| `realtutorialhub-web` | ✅ Built — DO NOT CHANGE (tutorial pages pending) |
| `api-server` | ✅ Complete — DO NOT CHANGE |
| `skillup-web` | ⚠️ Demo shell — needs full build in RTH style |
| `skillup-admin` | ❌ Redirect stub — needs full build in RTH style |
| `faculty-app` | ⚠️ Login + stub — needs full build in RTH style |

---

## Phase 1 — Cross-DB Hierarchy Sync (quiz ↔ tutorial)

### How It Works Today
```
quiz_platform_prod           →    tutorial_prod
domains (id: UUID)                tutorial_domains (external_id = domain.id)
  subjects (id: UUID)               tutorial_subjects (external_id = subject.id)
    topics (id: UUID)                 tutorial_topics (external_id = topic.id)
      subtopics (id: UUID)              tutorial_subtopics (external_id = subtopic.id)
```
`external_id` is the cross-DB link. Quiz DB is master. Tutorial DB follows.
This exists structurally but is not yet automated.

### 1A — Schema change: [packages/db/src/schema/domain.ts](file:///d:/onlinewebsites/quiz-platform/packages/db/src/schema/domain.ts)
- Add column `tutorialSyncStatus` to `domains`, `subjects`, `topics`, `subtopics`
- Type: `pgEnum('tutorial_sync_status', ['pending', 'synced', 'failed'])`, default `'pending'`

### 1B — `HierarchySyncService` [NEW]
- **Location:** `apps/api-server/src/modules/hierarchy/hierarchy-sync.service.ts`
- **Method:** `sync(entityType: 'domain'|'subject'|'topic'|'subtopic', entityId: string): Promise<void>`
- **Logic:**
  1. Read entity from `DATABASE_URL` (quiz DB)
  2. Upsert into `DATABASE_URL_TUTORIAL`: `ON CONFLICT (external_id) DO UPDATE SET name, slug, updated_at`
  3. On success: set `tutorialSyncStatus = 'synced'` in quiz DB
  4. On failure: set `tutorialSyncStatus = 'failed'`, log — do NOT throw
- **Call pattern:** `void hierarchySyncService.sync(entityType, id)` — fire-and-forget, never await

### 1C — Sync trigger in admin write routes
- After any create/update in hierarchy admin routes: call `HierarchySyncService.sync()` async
- Routes: `apps/api-server/src/app/api/admin/domains/`, `/subjects/`, `/topics/`, `/subtopics/`

### 1D — Bulk re-sync endpoint [NEW]
- **Location:** `apps/api-server/src/app/api/admin/hierarchy/sync/route.ts`
- Protected by `INTERNAL_API_KEY` + admin role
- POST: iterates all entities in quiz DB, calls sync service per entity
- Use for: initial backfill, post-outage recovery

### 1E — ACID / Consistency Rules
- Never use distributed transactions (no 2PC/XA)
- **Eventual consistency**: quiz DB write succeeds first, tutorial sync is async
- Cross-DB references: UUID values passed in application code — never DB foreign keys between DBs
- Background retry: QStash (already configured) polls `WHERE tutorial_sync_status = 'failed'`

---

## Phase 2 — RTH Design System (Source of Truth for SkillUp to Follow)

### RTH Design Tokens
From `apps/realtutorialhub-quiz/src/app/globals.css` and `apps/realtutorialhub-quiz/src/app/layout.tsx`:

```
Primary color:     hsl(337, 90%, 63%)  →  #FF4B91  (pink/magenta)
Secondary:         hsl(223, 74%, 29%)  →  dark blue
Glassmorphism:     bg-white/70 backdrop-blur-[16px] border border-white/20
Body bg:           hsl(var(--background))  →  white with pink glassmorphism accents
Font body:         Inter (loaded via @font-face, local)
Font heading:      Outfit (loaded via @font-face, local, on report headings)
Report dark mode:  background #0B1220 (navy/dark mode for PDF reports)
Card radius:       rounded-[2.5rem] or rounded-3xl
Premium shadow:    box-shadow: 0 20px 40px rgba(0,0,0,0.6) on dark panels
```

### RTH Layout Structure (SkillUp must replicate this, not the other way)
From `realtutorialhub-quiz` dashboard and report pages:
```
<html className="{inter.variable} {outfit.variable}">
  <body className="bg-white text-slate-900">
    <Header />          ← sticky, glassmorphism: bg-white/70 backdrop-blur border-b
    <main>
      <section>         ← hero or dashboard: max-w-7xl mx-auto px-6
        <div>           ← 2-col grid: grid-cols-[1.25fr_0.75fr] or similar
      </section>
      <section>         ← cards grid: grid-cols-3 or grid-cols-4 gap-4
        <div className="glass-morphism rounded-[2.5rem] p-6 shadow-lg">
          {/* stat cards, module cards */}
        </div>
      </section>
    </main>
  </body>
</html>

Key classes RTH uses:
.glass-morphism = bg-white/70 backdrop-blur-[16px] border border-white/20
Card:  rounded-[2.5rem] border border-white/20 bg-white/70 backdrop-blur-[16px] p-6
CTA:   rounded-full bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600
Nav:   sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100
```

### RTH Typography Patterns (SkillUp must match these patterns, swap color only)
| Use | RTH Classes | SkillUp Adaptation |
|---|---|---|
| Eyebrow | `text-[0.65rem] font-black uppercase tracking-[0.45em] text-pink-500` | swap `text-pink-500` → `text-cyan-600` |
| H1 | `text-4xl sm:text-6xl font-black tracking-tight` (Outfit) | same, Outfit font |
| Body | `text-base leading-7 text-slate-600` | identical |
| Card label | `text-xs font-black uppercase tracking-[0.35em] text-slate-500` | identical |
| Card | `rounded-[2.5rem] border border-white/20 bg-white/70 backdrop-blur-[16px] p-6` | identical |
| CTA filled | `rounded-full bg-pink-500 px-5 py-3 text-sm font-bold text-white` | swap pink → cyan |
| CTA ghost | `rounded-full border border-slate-200 bg-white px-5 py-3 font-bold` | identical |
| Active sidebar link | `bg-pink-50 text-pink-700 font-bold` | swap pink → `bg-cyan-50 text-cyan-700` |

### What SkillUp Must Copy From RTH
1. **Glassmorphism cards** — `bg-white/70 backdrop-blur-[16px] border border-white/20`
2. **Rounded corners** — `rounded-[2.5rem]` for cards, `rounded-full` for buttons
3. **Font stack** — Inter (body) + Outfit (headings) loaded via `next/font/google` in layout.tsx
4. **Sticky glassmorphism header** — `bg-white/80 backdrop-blur-md border-b border-slate-100`
5. **Grid layouts** — same column proportions, same gap values
6. **Shadow system** — `shadow-[0_24px_120px_rgba(15,23,42,0.08)]` on hero sections
7. **Color swap only** — wherever RTH uses `pink-*`, SkillUp uses `cyan-*`

### What to Add to `apps/skillup-web/src/app/globals.css`
```css
/* Copy glassmorphism from RTH quiz globals.css */
.glass-morphism {
  @apply bg-white/70 backdrop-blur-[16px] border border-white/20;
}

/* SkillUp brand overrides */
:root {
  --primary: 199 89% 48%;          /* cyan-500 #0ea5e9 */
  --secondary: 201 90% 34%;        /* cyan-700 */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --radius: 0.5rem;
}

/* Eyebrow label utility */
.eyebrow-label {
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.45em;
}

/* Platform card */
.platform-card {
  border-radius: 2.5rem;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(16px);
  padding: 1.5rem;
}
```

---

## Phase 3 — SkillUp Web (Student Portal) — RTH Style

**Base:** `apps/skillup-web/src/`

### 3A — `globals.css` [UPDATE]
- Add `.glass-morphism`, `:root` tokens, `.eyebrow-label`, `.platform-card` as above
- Body background: `radial-gradient(circle at top, rgba(14,165,233,0.08), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)`

### 3B — `app/layout.tsx` [UPDATE]
- Load `Inter` and `Outfit` via `next/font/google`:
  - `const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })`
  - `const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })`
- Add `<Header />` and `<Footer />` wrappers around `{children}`

### 3C — `components/layout/Header.tsx` [NEW]
- Style matching RTH: `sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100`
- Left: SkillUp logo
- Nav: Home, Programs, About
- Right: Sign In (ghost, `rounded-full`) + Apply (`rounded-full bg-cyan-500 text-white`)

### 3D — `components/layout/Footer.tsx` [NEW]
- `bg-white/50 border-t border-slate-200`
- Columns: Programs, Company, Legal

### 3E — `src/proxy.ts` [NEW]
- Protected: `/student`, `/dashboard`, `/profile`
- Public: `/`, `/login`, `/register`, `/programs`
- Cookie: `accessToken`
- Redirect unauthenticated → `/login?reason=session_expired`

### 3F — `app/login/page.tsx` [NEW]
- Card: `.glass-morphism rounded-[2.5rem] p-8 max-w-md mx-auto shadow-lg`
- Eyebrow: `.eyebrow-label text-cyan-600` — "Student Portal"
- H1: `font-outfit font-black text-4xl tracking-tight`
- Button: `rounded-full bg-cyan-500 px-6 py-3 font-bold text-white hover:bg-cyan-600`
- POST to `${NEXT_PUBLIC_API_URL}/auth/login` → on success: `router.replace('/student')`

### 3G — `app/register/page.tsx` [NEW]
- Same card style as login
- 3 fields: name, email, password
- POST to `/auth/signup` — creates `platform: 'skillup'` user (handled server-side by brand resolver)

### 3H — `app/student/page.tsx` [NEW — protected]
- Layout: `max-w-7xl mx-auto flex flex-col gap-8 px-6 py-8`
- Section 1: Welcome card — `.glass-morphism rounded-[2.5rem] p-8`
  - Eyebrow: `.eyebrow-label text-cyan-600` — "Dashboard"
  - H1 greeting: `font-outfit font-black text-3xl`
- Section 2: Stats row — 4-col grid, each `.platform-card`
  - Stats: Enrolled Batch, Sessions This Week, Assignments Due, Streak Days
- Section 3: Upcoming sessions list
- Section 4: Assignments due

### 3I — `app/programs/[slug]/page.tsx` [NEW]
- Hero: `.glass-morphism rounded-[2.5rem] p-8 shadow-lg`
- Curriculum accordion: Domain → Subjects → Topics
- Data: `GET /api/domains/[slug]`

---

## Phase 4 — SkillUp Admin — RTH Admin Style

**Base:** `apps/skillup-admin/src/app/`

### 4A — `src/proxy.ts` [NEW]
- Cookie: `admin_accessToken`
- Require role: `ADMIN` or `SUPER_ADMIN`
- Protected: all except `/login`

### 4B — Authenticated layout [FILL existing]
- Sidebar: `w-64 bg-white border-r border-slate-100 shadow-sm`
- Active link: `bg-cyan-50 text-cyan-700 font-bold rounded-xl` (RTH uses `pink-50/pink-700`)
- Inactive: `text-slate-600 hover:bg-slate-50 rounded-xl`
- Top bar: `bg-white/80 backdrop-blur-md border-b border-slate-100` (RTH glassmorphism header)

### 4C — Dashboard `/` [REPLACE redirect]
- Stats grid: 4 `.glass-morphism rounded-[2.5rem]` cards
  - Total Students (query: `people_prod.users WHERE platform = 'skillup'`)
  - Active Batches, Sessions Today, Pending Assignments
- BFF route: `app/api/bff/dashboard-summary/route.ts` [NEW]

### 4D — Students `/students` [NEW]
- Table with glassmorphism container: `.glass-morphism rounded-[2.5rem] p-6`
- Filter mandatory: `WHERE platform = 'skillup'`

### 4E — Batches `/batches` [NEW]
- Backend: `apps/api-server/src/app/api/batches/route.ts` [NEW]
- Gateway `/batches → STUDENT_FACULTY_URL` already exists

---

## Phase 5 — Faculty App — RTH Style

### 5A — Dashboard `/dashboard` [FILL]
- `.glass-morphism rounded-[2.5rem]` card summary panels
- Today's schedule | Pending grading | Attendance status

### 5B — Sessions `/sessions` [NEW]
- CRUD for `tutorial_prod.live_sessions`
- Session cards: `.platform-card` style

### 5C — Attendance `/attendance` [NEW]
- Per batch per session marking
- Backend: `apps/api-server/src/app/api/attendance/route.ts` [NEW]

### 5D — Assignments `/assignments` [NEW]
- Submissions from `tutorial_prod.tutorial_assignments`

---

## Phase 6 — Pending RTH Work (Additive Only — do NOT break existing)

### 6A — RTH Learning Pages (realtutorialhub-web)
- Route: `/learn/[domainSlug]/[topicSlug]`
- File: `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[topicSlug]/page.tsx` [NEW]
- Layout: sidebar TOC + main content — RTH glassmorphism style

### 6B — RTH Quiz Onboarding
- File: `apps/realtutorialhub-quiz/src/app/(authenticated)/onboarding/page.tsx` [NEW]
- 3-step form: professionalStatus → educationLevel → target domain
- Trigger: proxy.ts redirects to `/onboarding` if `profile.professionalStatus === null` after login

### 6C — RTH Quiz Profile
- File: `apps/realtutorialhub-quiz/src/app/(authenticated)/profile/page.tsx` [NEW]
- Stats + edit form — RTH pink card style

---

## Phase 7 — Pre-Merge Safety Checklist

1. `pnpm --filter @quiz/realtutorialhub-quiz build` passes ✅ (must not regress)
2. `pnpm --filter @quiz/realtutorialhub-admin build` passes ✅ (must not regress)
3. `pnpm --filter @quiz/skillup-web build` passes ✅
4. `pnpm --filter @quiz/skillup-admin build` passes ✅
5. `pnpm --filter @quiz/faculty-app build` passes ✅
6. `pnpm --filter @quiz/api-server type-check` passes ✅
7. All `people_prod` queries in SkillUp admin include `WHERE platform = 'skillup'`
8. All tutorial DB inserts include `external_id` pointing to a quiz DB UUID
9. No new required env vars without GCP Secret Manager entry + README update

---

## Token Summary — RTH → SkillUp Adaptation

| Token | RTH (source of truth) | SkillUp (adapts this, swap color only) |
|---|---|---|
| Primary | `#FF4B91` pink | `#0ea5e9` cyan |
| Active UI | `pink-50 / pink-700` | `cyan-50 / cyan-700` |
| Glassmorphism | `bg-white/70 backdrop-blur-[16px] border border-white/20` | **identical** |
| Card radius | `rounded-[2.5rem]` | **identical** |
| Font body | Inter (`next/font/google`) | **identical** |
| Font heading | Outfit (`next/font/google`) | **identical** |
| Eyebrow label | `0.65rem black uppercase tracking-[0.45em]` | **identical** |
| Card shadow | `shadow-lg` / `shadow-[0_24px_120px...]` | **identical** |
| Header | `bg-white/80 backdrop-blur-md border-b` | **identical** |
| Body CTA | `rounded-full bg-pink-500 text-white` | swap pink → `bg-cyan-500` |

---

## Phase 0 — Architecture Decision: Which DB is Master?

### The Dilemma
You built **ExamEngine (quiz_platform_prod) first**, then **TutorialEngine (tutorial_prod)**.
Ideally it would have been the opposite because:
- Tutorial = the **curriculum** (what students learn)
- Exam = tests **knowledge of** that curriculum

So the correct conceptual dependency is:
```
TutorialEngine (curriculum) → defines → Domain/Subject/Topic/Subtopic
ExamEngine                  → tests knowledge of → those same Topics/Subtopics
```

### Architecture Decision: Quiz DB STAYS as Hierarchy Master

**Reason: RTH is live and has existing hierarchy data. Reversing master would require:**
1. Migrating all existing `domains/subjects/topics/subtopics` rows from quiz DB to tutorial DB
2. Updating every single exam/question query that references topic UUIDs
3. Rewriting `HierarchySyncService` direction
4. Re-seeding all RTH production data
5. Downtime or dual-write period — high risk, zero business benefit right now

**Decision: Keep quiz_platform_prod as hierarchy master. Treat it as a "Curriculum Catalog".**

### Rename Mental Model Going Forward
Do not think of it as "quiz DB owns hierarchy." Think of it as:

```
quiz_platform_prod = Curriculum Catalog + Exam Engine
  → owns: domains, subjects, topics, subtopics (curriculum structure)
  → owns: questions, exams, blueprints (assessment layer)

tutorial_prod = Tutorial Engine
  → reads curriculum structure via externalId (synced from quiz DB)
  → owns: tutorial content, live sessions, progress, assignments (delivery layer)
```

### How to Handle Existing Quiz DB Hierarchy Data

Since `quiz_platform_prod` already has real data in `domains/subjects/topics/subtopics`:

#### Step 0A — Run initial bulk sync (one-time)
- Call the bulk re-sync endpoint from Phase 1D once after it's deployed
- This populates `tutorial_prod` with matching rows for all existing quiz DB hierarchy rows
- Variable: `POST /api/admin/hierarchy/sync` with `INTERNAL_API_KEY` header

#### Step 0B — Verify sync completeness
- After bulk sync: `SELECT COUNT(*) FROM tutorial_domains` should equal `SELECT COUNT(*) FROM domains`
- Same check for subjects, topics, subtopics
- Any `tutorialSyncStatus = 'failed'` rows should be zero

#### Step 0C — From this point forward — add/edit hierarchy only via quiz DB admin
- When RTH admin creates a new domain/topic → quiz DB writes → sync fires to tutorial DB
- Tutorial content API never creates its own hierarchy rows — it only creates content attached to existing `external_id` rows
- This is the rule: **hierarchy comes from quiz DB, content comes from tutorial DB**

### Future Path (if true separation is ever needed)
If a future client requires completely isolated curriculum (not shared with RTH):
- Extract `domains/subjects/topics/subtopics` into a separate `curriculum_prod` DB
- Both quiz DB and tutorial DB reference `curriculum_prod` via `external_id`
- This is a future migration, NOT something to do now

---

## Phase 8 — Phase-Wise Test Credentials

### Rule
**Every portal must have a verified test account created BEFORE UI work starts.**
This prevents "build first, test later" problems. Each account must be:
- Created in the appropriate database
- Credentials documented below
- Tested (login works end-to-end) before that phase is marked complete

### How to Create Accounts Per Portal

#### 8A — SkillUp Student Account (for skillup-web)
- **When to create:** Before Phase 3 UI work begins
- **Database:** `people_prod.users` with `platform = 'skillup'`
- **How:** POST to `https://api.realtutorialhub.com/api/auth/signup` from `skillupitacademy.com` origin (or use a seed script)
- **Credentials to use:**
  - Email: `student@skillupitacademy.com`
  - Password: `SkillUp@2025`
  - Name: `SkillUp Test Student`
- **Verify:** Check `people_prod.users WHERE email = 'student@skillupitacademy.com'` — `platform` column must be `skillup`
- **Test:** Login at `skillupitacademy.com/login` → should reach `/student` dashboard ✅

#### 8B — SkillUp Admin Account (for skillup-admin)
- **When to create:** Before Phase 4 UI work begins
- **Database:** `people_prod.users` + `people_prod.user_roles` (role = ADMIN)
- **How:** Use RTH admin panel (`admin.realtutorialhub.com`) to create admin user, then update `platform = 'skillup'` in DB directly, OR add a seed script targeting `people_prod`
- **Credentials to use:**
  - Email: `admin@skillupitacademy.com`
  - Password: `SkillUpAdmin@2025`
  - Role: `ADMIN`
  - Platform: `skillup`
- **Verify:** Login at `admin.skillupitacademy.com/login` → should reach admin dashboard ✅

#### 8C — Faculty Account (for faculty-app)
- **When to create:** Before Phase 5 UI work begins
- **Database:** `people_prod.users` with `role = 'faculty'` and `platform = 'skillup'`
- **Credentials to use:**
  - Email: `faculty@skillupitacademy.com`
  - Password: `Faculty@2025`
  - Role: `faculty`
- **Verify:** Login at `faculty.skillupitacademy.com/login` → should reach faculty dashboard ✅

#### 8D — Seed Script Location
- **File:** `apps/api-server/scripts/seed-skillup-accounts.ts` [NEW]
- **Purpose:** Creates all 3 SkillUp accounts with correct `platform` and `role` values
- **Run once:** `npx ts-node apps/api-server/scripts/seed-skillup-accounts.ts`
- **Must be idempotent:** use `ON CONFLICT (email) DO NOTHING`

#### 8E — RTH Test Accounts (already exist — do not recreate)
- RTH quiz user: `ajay@test.com` / existing credentials
- RTH admin: `admin@test.com` / `admin123`

---

## Phase 9 — Dashboard-First Delivery Rule

### The Problem With "Build in Order"
If you build pages in this order:
```
1. Sign Up page ← built ✅
2. Login page ← built ✅
3. Login works ← verified ✅
4. ... content pages later
```
You end up with portals that can log in but show nothing useful — creating a disconnect between auth and real functionality.

### Correct Delivery Order Per Portal
Each portal phase must deliver a **fully working end-to-end slice**:

```
Phase complete = Login → redirects to → Dashboard with REAL data → verified with test account
```

Never mark a phase "done" if the dashboard is empty or shows placeholder data only.

### Phase Completion Criteria Per Portal

#### SkillUp Student Portal (Phase 3) — Done When:
- [ ] `student@skillupitacademy.com` can log in via `/login`
- [ ] Redirects to `/student` dashboard
- [ ] Dashboard shows: welcome message with student name, at least 2 stat cards with real or seeded data
- [ ] No white screen, no "loading..." forever
- [ ] Logout works and redirects to `/login`

#### SkillUp Admin Portal (Phase 4) — Done When:
- [ ] `admin@skillupitacademy.com` can log in via `/login`
- [ ] Redirects to admin dashboard
- [ ] Dashboard shows student count (real `people_prod` query) and at least 2 other metric cards
- [ ] Sidebar navigation renders all links
- [ ] Logout works

#### Faculty App (Phase 5) — Done When:
- [ ] `faculty@skillupitacademy.com` can log in
- [ ] Redirects to `/dashboard`
- [ ] Dashboard shows today's session schedule (even if empty list — no crashes)
- [ ] Logout works

### Data Seeding for Dashboard Display
To avoid empty dashboards on first UI verification, seed minimal data:

- **File:** `apps/api-server/scripts/seed-skillup-demo-data.ts` [NEW]
- Seeds into `people_prod`: 3 student accounts linked to SkillUp
- Seeds into `tutorial_prod`: 1 upcoming live session, 2 assignments
- Run after `seed-skillup-accounts.ts`
- Must be idempotent

### Component Build Order Within Each Dashboard
For each portal dashboard, build in this order:

```
1. Shell layout (header, sidebar, main content area) ← skeleton first
2. Top stat cards with REAL API calls (not hardcoded numbers)
3. Primary list/table (sessions, students, assignments)
4. Action buttons (create/edit/delete)
```

Never build action buttons before the list that shows what you're acting on.

---

## Phase 10 — Cross-Check Gaps (Must Not Be Missed)

These items were verified missing from the above phases during a full requirements cross-check.

---

### 10A — CORS: Add SkillUp Domains to ALLOWED_ORIGINS

**Gap:** `ALLOWED_ORIGINS` in `.env.local` currently only contains:
```
ALLOWED_ORIGINS="https://admin.realtutorialhub.com,https://quiz.realtutorialhub.com"
```
SkillUp portals will fail CORS pre-flight checks on login/signup API calls.

**Fix location:** `.env.local` AND GCP Secret Manager (same variable)

**New value:**
```
ALLOWED_ORIGINS="https://admin.realtutorialhub.com,https://quiz.realtutorialhub.com,
https://skillupitacademy.com,https://admin.skillupitacademy.com,
https://faculty.skillupitacademy.com"
```

**Also check:** `apps/api-server/src/middleware/cors.middleware.ts` or wherever CORS origins are parsed — ensure it reads from `ALLOWED_ORIGINS` env var and does NOT have a hardcoded list.

**When to do:** Before Phase 3 (SkillUp web login) — CORS must be open before any API calls work.

---

### 10B — Signup Must Correctly Tag Platform

**Gap:** `SignupService` currently receives no `brand` parameter. When a SkillUp user signs up, `people_prod.users.platform` might default to `'realtutorialhub'` instead of `'skillup'`.

**Fix locations:**
1. `apps/api-server/src/app/api/auth/signup/route.ts`
   - Extract `brand` via `resolveRequestBrand(req.nextUrl.hostname)` (same as login route)
   - Pass `brand` to `SignupService.signup()`

2. `apps/api-server/src/modules/auth/signup.service.ts`
   - Add `brand?: string` to `signup()` method signature
   - Map `brand → platform`: if `brand === 'skillup'` → `platform = 'skillup'`, else → `platform = 'realtutorialhub'`
   - Pass `platform` value to the `INSERT INTO users` call

3. `packages/db-people/src/repositories/user.repository.ts` (or wherever users are inserted)
   - Ensure `platform` column is written on insert, not just defaulted

**Variable name:** `resolvedPlatform: PlatformEnum` derived from `brand`

**Rule:** A user signed up from `skillupitacademy.com` must have `platform = 'skillup'` in `people_prod.users`. This is the brand isolation at data level — it must work from day one.

---

### 10C — Use `brand` JWT Claim Post-Login (Activate It)

**Gap:** `brand` is stored in the JWT but nothing reads it back to make any decision. It is present but unused.

**Where to start using it:**

1. **Audit logs** — In `AuditService.log()`, include `brand` from the token payload in every log entry. Variable: `payload.brand`

2. **Analytics/metrics** — In `recordCounter()` calls (e.g., login metrics), add `brand` as a dimension tag:
   `recordCounter(METRICS.AUTH.LOGIN, 1, { role: ..., brand: brand ?? 'unknown' })`

3. **Admin queries** — In SkillUp admin BFF routes, extract `brand` from token to confirm the admin belongs to SkillUp brand before querying:
   - Read `payload.brand` from verified JWT
   - If `payload.brand !== 'skillup'`, return 403 — this is a secondary RBAC check beyond role

4. **DO NOT** use `brand` from token to switch database connections — this is not the architecture for now

**Rule:** `brand` in JWT = informational + security assertion, not a DB router.

---

### 10D — 3-Tier Auth System (Document for All SkillUp Portals)

**Gap:** The prompt doesn't explicitly tell SkillUp portal builders which cookie/secret to use for each tier.

**Tiers:**
| Portal | Cookie Name | JWT Secret | Audience |
|---|---|---|---|
| `skillup-web` (student) | `accessToken` | `JWT_SECRET` | `user` |
| `skillup-admin` | `admin_accessToken` | `ADMIN_JWT_SECRET` | `admin` |
| `faculty-app` | `accessToken` | `JWT_SECRET` | `user` (faculty is a user role, not admin) |

**In proxy.ts for each app:**
- `skillup-web/src/proxy.ts` — read `accessToken`, verify with `JWT_SECRET`, check audience `user`
- `skillup-admin/src/proxy.ts` — read `admin_accessToken`, verify with `ADMIN_JWT_SECRET`, check audience `admin`, check role includes `ADMIN`
- `faculty-app/src/proxy.ts` — read `accessToken`, verify with `JWT_SECRET`, check `role === 'faculty'`

**Note:** `infra_accessToken` tier is for infrastructure admins only — do NOT use in any SkillUp portal.

---

### 10E — skillhubcore-admin (Explicitly Out of Scope)
- `apps/skillhubcore-admin` is listed in the app state table
- It is a separate system (`SKILLHUBCORE_URL` → different Cloud Run service)
- The SkillHubCore auth system is NOT part of this monorepo's core auth flow
- **No phases assigned to it** — it is intentionally out of scope for this implementation plan
- Do NOT modify any `skillhubcore-*` code as part of these phases

