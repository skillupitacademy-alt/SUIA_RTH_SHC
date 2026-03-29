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
- `people_prod.users.platform` enum: `('realtutorialhub', 'skillup')` — already exists
- `people_prod.platform_access` — allows one user on multiple platforms
- `request-brand.ts` detects brand from hostname — do not touch
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

### 1A — Schema change: `packages/db/src/schema/domain.ts`
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

---

## Phase 11 — FAANG Compliance Rules (Non-Negotiable on Every Task)

> Source: `docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md`
> **These 12 rules apply to EVERY file, service, and component built from here forward.**
> A task is NOT done until both the feature works AND these boxes are ticked.

### 11A — The 12 FAANG Rules

| # | Rule | Implementation Pattern |
|---|---|---|
| 1 | **Tests First** | Write unit tests alongside every service/function. 90%+ branch coverage. |
| 2 | **Repository Pattern** | All DB access via Repository classes. No direct `db.select()` in service layer. |
| 3 | **DI Container** | All services use dependency injection via constructor. No `static` methods anywhere. |
| 4 | **DTOs** | All API boundaries use typed DTO objects. Never return raw Drizzle row types. |
| 5 | **Structured Logging** | Pino logger with correlation IDs. Zero `console.log` in production code. |
| 6 | **OpenTelemetry** | Wrap all critical operations with `withSpan('service.operation')`. |
| 7 | **Rate Limiting** | Every public endpoint protected. Use `@upstash/ratelimit` sliding window. |
| 8 | **QStash Idempotency** | Every worker checks idempotency key in Redis before processing. |
| 9 | **Zod Validation** | Every API input validated at route handler. Return field-level 400 errors. |
| 10 | **Error Boundaries** | Every async operation has typed error handling. Never `catch(e: any)`. |
| 11 | **Cache Headers** | All read-only GET endpoints have `Cache-Control`, ETags where applicable. |
| 12 | **Accessibility** | All UI follows WCAG 2.1 AA — ARIA labels, keyboard nav, 4.5:1 contrast. |

### 11B — Repository Pattern (how to implement in every new module)
- **Interface location:** `packages/types/src/[module].repository.interface.ts`
  - e.g., `IStudentRepository`, `IFacultyRepository`, `ITutorialContentRepository`
- **Implementation:** `DrizzleStudentRepository implements IStudentRepository`
- **Service constructor:** `StudentService(private repo: IStudentRepository)` — injectable, mockable
- **Test pattern:** `vi.mock` the interface, never the real DB client in unit tests

### 11C — Pino Structured Logging (apply to every route handler)
- **Import from:** `packages/logger/src/index.ts` — shared Pino instance
- **Every auth action:** `logger.info({ action, userId, platform, ip, success })`
- **PII redaction:** never log password, full token, or full email
- **Correlation ID:** propagate `X-Request-ID` header through all service calls
- **Variable name:** `const logger = createLogger('module-name')`

### 11D — Rate Limiting Tiers (apply to SkillUp routes)
| Route | Limit | Window | Key |
|---|---|---|---|
| `POST /auth/login` | 5 | 1 min | IP |
| `POST /auth/signup` | 10 | 1 hour | IP |
| `POST /auth/refresh` | 30 | 1 min | userId |
| `POST /enquiries` | 5 | 1 hour | IP (spam prevention) |
| `POST /quiz/submit` | 3 | 1 min | userId |
| Admin API `/*` | 30 | 1 min | userId |
| General | 60 | 1 min | IP + userId |

### 11E — QStash Idempotency Pattern (every consumer)
- Before processing any event, check: `Redis.get('event:{correlationId}')`
- If exists → return 200 (already processed — skip)
- If not → process → set Redis key with 24h TTL
- **Variable names:** `correlationId`, `idempotencyKey: \`event:\${correlationId}\``

### 11F — Soft Deletes on All Critical Tables
- Add `deleted_at` nullable timestamp to: `users`, `exams`, `questions`, `tutorial_content`, `students`, `batches`
- All queries filter `WHERE deleted_at IS NULL`
- Never hard-delete records — use soft delete + 90-day TTL CRON cleanup
- Admin "Recycle Bin" UI to view/restore soft-deleted records

### 11G — Pre-Task Verification Command
Before starting ANY new task, run:
```
pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
```
All must pass. If any fail → fix first. **Do not proceed with new work if tests are failing.**

---

## Phase 12 — Critical Architecture Gaps (From ADR-CRITICAL-001)

> Source: `docs/completeproject/ADR-CRITICAL-001-integration-architecture.md`
> These are structural gaps in the current implementation not addressed in earlier phases.

### 12A — Architecture Confirmation: Option B (One Monorepo, Separate DBs)

The correct and final architecture decision is **Option B**:
- ✅ One Turborepo monorepo — shared types, shared packages, one CI/CD pipeline
- ✅ Separate Neon databases per service — exam DB ≠ tutorial DB — NEVER merge
- ✅ QStash events are the **ONLY bridge** between services — no SQL joins across DBs
- ✅ `userId` and `subtopicId` are the ONLY shared references (strings, passed via events)

**The rule to never break:**
> "Exam DB and Tutorial DB are owned by their respective services. They communicate ONLY via QStash events. No shared tables. No cross-DB foreign keys. Ever."

### 12B — Missing: `packages/auth` Extraction
- **Current problem:** JWT logic lives inside `apps/api-server/src/modules/auth/` — not shareable
- **Required:** Extract to `packages/auth/src/`
  - `packages/auth/src/index.ts` — exports: `TokenService`, `AuthService`, `SecurityService`
  - `packages/auth/src/verify.ts` — `verifyAccessToken(token)` — edge compatible (jose only, no Node crypto)
- **Why:** All new services (tutorial-service, skillup-service) need to verify JWT without calling the exam service
- **Impact:** RTH apps must not break during extraction — all existing tests must pass post-extraction
- **When:** Before building any SkillUp backend routes that need JWT verification

### 12C — Missing: `packages/events` (15 Event Types via QStash)
- **Location:** `packages/events/src/`
  - `types.ts` — `PlatformEvent` union type + `EventEnvelope<T>` interface + Zod schemas for all 15 events
  - `publisher.ts` — `publishEvent(type, payload, options?)` using `@upstash/qstash`
  - `consumer.ts` — `createQStashHandler(handler)` — verifies QStash signature
- **15 Event Types:**
  1. `student.enrolled` — student added to batch
  2. `student.created` — new signup in people_prod
  3. `exam.completed` — exam finished, scores ready
  4. `payment.received` — installment paid
  5. `payment.overdue` — installment > 14 days late
  6. `tutorial.subtopic_completed` — student finished subtopic
  7. `batch.session_completed` — faculty finished a class session
  8. `batch.subtopics_covered` — faculty recorded which subtopics were taught
  9. `attendance.marked` — attendance submitted for a session
  10. `admission.completed` — admission approved, student created
  11. `project.submitted` — student submitted project for grading
  12. `certificate.issued` — all 4 requirements met
  13. `placement.offer_accepted` — student accepted job offer
  14. `content.generation_requested` — AI content generation triggered
  15. `content.approved_and_published` — admin approved content version
- **Every consumer must:** verify QStash signature + idempotency key check before processing

### 12D — Missing: `skillup-service` (Backend for SkillUp)
- **Current problem:** All SkillUp API calls go to `quiz-api-server` — this is wrong long-term
- **Required:** `services/student-faculty-service/` (gateway already routes to `STUDENT_FACULTY_URL`)
- **Owns:** students, faculty, batches, attendance, enquiries, admissions, certifications
- **Depends on:** `packages/db-people`, `packages/events`, QStash
- **When to build:** During Phase 4 (SkillUp Admin) — at minimum the batch/attendance/faculty routes
- **Interim:** Until dedicated service is built, add `/batches`, `/attendance`, `/faculty` routes to `api-server` under clear namespace

### 12E — Missing: SkillUp Full Domain Architecture (9 Subdomains)
The current prompt only covers `skillupitacademy.com` and `admin.skillupitacademy.com`. Per `PHASE-SKILLUP-ACADEMY.md`, the full planned domain architecture is:

| Domain | Purpose | Priority |
|---|---|---|
| `skillupitacademy.com` | Marketing landing (SSG) | Phase 3 |
| `app.skillupitacademy.com` | Student portal | Phase 3 |
| `admin.skillupitacademy.com` | Admin panel | Phase 4 |
| `faculty.skillupitacademy.com` | Faculty portal | Phase 5 |
| `enquiry.skillupitacademy.com` | Enquiry capture + CRM | Future |
| `admission.skillupitacademy.com` | Admission processing | Future |
| `schedule.skillupitacademy.com` | Batch timetable | Future |
| `attendance.skillupitacademy.com` | Attendance public view | Future |
| `learn.skillupitacademy.com` | Redirects → `notes.realtutorialhub.com` | Future |
| `cert.skillupitacademy.com` | Certificate verification (public, no auth) | Future |
| `placement.skillupitacademy.com` | Job board | Future |

**Current phases (3,4,5) cover only the top 3 domains. The rest are later phases.**

### 12F — Missing: Two SkillUp Admission Types
SkillUp has TWO distinct products — the current prompt doesn't differentiate:

**Type 1: Digital Learning (B2C)**
- Access to: tutorial engine + exam engine + AI tutor
- No live classes, no faculty, no batch
- Online payment → instant access
- `subscriptionTier: 'digital'` in JWT

**Type 2: Training + Placement (Live)**
- Everything in Type 1 PLUS live classes, faculty, batch allocation, attendance, placement
- Admission flow: Enquiry → Counselling → Demo → Admission → Batch allocation
- `subscriptionTier: 'training'` in JWT
- **When enrolling:** must create batch enrollment + payment plan + `student.enrolled` event

### 12G — Missing: SkillUp Certification Flow
Certificate only issued when ALL 4 conditions met (check via `SKU-9` saga):
1. ≥ 75% attendance across all batch sessions
2. ≥ 70% score on final domain assessment (Exam Engine)
3. At least 1 project approved in Tutorial Engine
4. Zero outstanding fee balance (Payment DB)

- **Certificate verification URL:** `cert.skillupitacademy.com/{verificationCode}` — public, no auth
- **Event emitted on certificate:** `certificate.issued` → notifies student via email + WhatsApp

### 12H — Missing: Cross-Service Circuit Breaker Pattern
When `faculty-app` or `skillup-admin` calls tutorial-service or exam-service:
- If tutorial-service unavailable → return `{ tutorialProgress: null, message: "Progress temporarily unavailable" }`
- **Never** let one service failure crash the entire student profile page
- **Pattern name:** Circuit breaker — variable: `circuitBreaker.execute(() => tutorialService.getProgress(userId))`
- **Library:** `@upstash/redis` with count-based circuit state or `opossum` npm package

### 12I — AUTH_GUIDELINES.md (Binding Rules for All SkillUp Portals)
From `docs/AUTH_GUIDELINES.md` — these apply to all new SkillUp proxy.ts implementations:

1. **Never create client-side cookies for auth** — server sets httpOnly via Set-Cookie
2. **Never add AuthGuard components** — proxy.ts guards routes server-side
3. **Store user in auth store BEFORE redirecting** after login — `authLogin(user)` then `router.replace('/student')`
4. **FetchClient URL patterns** — gateway strips `/api` prefix — ensure SkillUp API calls use correct base URL
5. **JWT_SECRET must match** across gateway and all services — one GCP secret, propagated everywhere
6. **Never enforce issuer claims** in JWT verify — `jose.jwtVerify(token, secret)` without issuer option
7. **Deploy gateway with `--env production`** always — never bare `npx wrangler deploy`



---

## Phase 13 � Scalability & Performance (1M+ User Readiness)

> Full schema audit completed across all 5 databases. Shows existing vs missing.


---

## Phase 13 - Scalability and Performance (1M+ User Readiness)

> Full schema audit completed across all 5 databases. Shows existing vs missing.

---

### DB 1: quiz_platform_prod - Audit Results

**Already implemented (DO NOT re-create):**
- idx_exams_user_id_status: Dashboard per-user query
- idx_exams_dashboard_opt: userId + status + completedAt DESC covering index
- idx_exam_questions_exam_order: Sequential question rendering  
- idx_questions_selection_filter: 3-col topicId + subtopicId + difficulty
- idx_questions_active_partial: PARTIAL INDEX WHERE status = 'active' - excellent
- idx_subjects_domain_id, idx_topics_subject_id, idx_subtopics_topic_id: Hierarchy traversal
- unq_user_key on idempotency_keys: Exam idempotency guard
- reportMaterialized JSONB on exams: Pre-computed report snapshot already in place

**Missing - add in priority order:**
1. Table partitioning on exams - PARTITION BY RANGE (started_at) monthly
   Raw SQL migration needed (Drizzle does not support PARTITION declaratively)
2. Soft delete: deleted_at nullable column on exams, questions, exam_blueprints
   Add partial index WHERE deleted_at IS NULL on hot tables
   Variable: deletedAt: timestamp('deleted_at').nullable()
3. Composite index: idx_results_dim_type ON results_by_dimension (exam_id, dimension_type)
4. Redis cache for exam_blueprints - key: blueprint:{id} TTL 1 hour, invalidate on admin update

---

### DB 2: tutorial_prod - Audit Results

**Already implemented (DO NOT re-create):**
- idx_tutorial_content_subtopic + idx_tutorial_content_published: Content lookup
- idx_tutorial_content_content_gin: GIN index on content JSONB - EXCELLENT for full-text search
- idx_tutorial_progress_user: Progress per user
- idx_remediation_triggers_user: User + status composite
- idx_content_versions_content_id: Version history
- idx_certificates_user: Certificate lookup
- idx_content_generation_jobs_subtopic: Job queue subtopicId + status

**Missing - add in priority order:**
1. UNIQUE INDEX idx_progress_user_subtopic ON tutorial_progress (user_id, subtopic_id)
   Enables upsert pattern and prevents duplicate rows at high concurrency

2. CDN cache headers on content API (application layer)
   File: apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts
   Add: Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600
   Add: ETag based on content version number
   Impact: 95% reduction in tutorial DB load via Cloudflare edge caching

3. Materialized view: mv_student_weak_areas
   Raw SQL: CREATE MATERIALIZED VIEW mv_student_weak_areas AS
     SELECT user_id, subtopic_id, COUNT(*) as attempts, AVG(score) as avg_score
     FROM tutorial_progress GROUP BY user_id, subtopic_id
   Refresh trigger: exam.completed QStash event -> REFRESH MATERIALIZED VIEW CONCURRENTLY

4. Soft delete on tutorial_content, certificates - add deleted_at nullable

---

### DB 3: people_prod - Audit Results

**Already implemented:**
- users.email UNIQUE - prevents duplicate accounts
- users.deletedAt - soft delete already present
- users.version - optimistic locking column
- users.platform - brand isolation at data level

**Missing - CRITICAL for auth performance:**
1. Composite login index - THE MOST CRITICAL MISSING INDEX
   Every login: SELECT * FROM users WHERE email = ? AND platform = ?
   Add: CREATE INDEX CONCURRENTLY idx_users_email_platform
        ON users (email, platform) WHERE deleted_at IS NULL

2. SSO sessions index for token rotation
   Add: idx_sso_sessions_family ON sso_sessions (token_family_id, revoked_at)

3. Subscription feature index
   Add: idx_subscriptions_user_active ON subscriptions (user_id, status) WHERE status = 'active'

4. Redis cache for subscriptions (application layer)
   Cache key: sub:{userId} -> TTL 5 minutes
   File: packages/auth/src/subscription.cache.ts [NEW]
   Method: getSubscriptionFeatures(userId): Promise<string[]>
   Invalidate on: payment.received event or plan upgrade

5. Partition audit_log by month - PARTITION BY RANGE (created_at)

---

### DB 4: payment_prod - Schema Not Built Yet

packages/db-payment does not exist. Build from scratch with these from day one:

Tables and indexes:
- payment_plans: indexes on (user_id), (status)
- payment_installments: indexes on (plan_id, due_date), (status, due_date) WHERE status='overdue'
- payment_transactions: UNIQUE on payment_ref (Razorpay webhooks fire twice - idempotency)
- gateway_webhook_logs: indexes on (payment_ref), (status, created_at)

Critical CRON query this must serve:
SELECT * FROM payment_installments
WHERE due_date < NOW() - INTERVAL '14 days' AND status = 'pending'
ORDER BY due_date ASC LIMIT 100
Index needed: (status, due_date) WHERE status = 'pending'

Rules:
- NO soft delete - financial records are legally permanent
- Monthly PARTITION BY RANGE on payment_transactions
- CRON backup daily to GCP Storage

---

### DB 5: placement_prod - Schema Not Built Yet

packages/db-placement does not exist. Build from scratch with these from day one:

Tables and indexes:
- job_listings: (domain_id, status), (deadline) WHERE status='open'
- student_placement_profiles: (user_id) UNIQUE, (status)
- placement_applications: UNIQUE (student_id, listing_id), (status)
- placement_offers: (student_id), (status)

Key feature - Upstash Vector for semantic skill matching:
1. Student profile: embed skills[] as vector -> store in Upstash Vector index: placement-students
2. Job listing: embed required_skills[] as vector -> store in: placement-jobs
3. Match call: vectorIndex.query({ topK: 20, vector: jobEmbedding })
   Returns top 20 matching student profiles - O(1) regardless of DB size

Rules:
- Soft delete on all tables (deleted_at) - placement history is valuable
- No cross-DB foreign keys - user_id is a string reference only

---

### Priority Action List (Combined All 5 DBs)

TIER 1 - Before production traffic:
1. people_prod: CREATE INDEX idx_users_email_platform ON users (email, platform) WHERE deleted_at IS NULL
2. people_prod: Redis subscription cache sub:{userId} TTL 5min in packages/auth/src/subscription.cache.ts
3. tutorial_prod: UNIQUE INDEX on tutorial_progress (user_id, subtopic_id)
4. tutorial_prod: Cache-Control headers on GET /api/tutorial/content/* endpoints

TIER 2 - Before 100K users:
5. quiz_platform_prod: Add deleted_at to exams + questions
6. quiz_platform_prod: Redis cache for blueprints blueprint:{id} TTL 1h
7. people_prod: idx_sso_sessions_family + idx_subscriptions_user_active
8. tutorial_prod: mv_student_weak_areas materialized view

TIER 3 - Before 500K users:
9.  quiz_platform_prod: PARTITION BY RANGE on exams table
10. people_prod: PARTITION BY RANGE on audit_log table
11. payment_prod: Build schema with partitioning + idempotency from start

TIER 4 - Before 1M users:
12. placement_prod: Build with Upstash Vector semantic matching
13. Read replicas on people_prod + quiz_platform_prod via Neon replica URLs
14. exam_questions: PARTITION BY HASH (exam_id) if table exceeds 100M rows

---

### DB 4: payment_prod - Detailed Performance Spec

#### Materialized Views

mv_revenue_summary (refresh: daily via CRON 1AM IST)
  Purpose: Pre-computed revenue totals so admins don't run SUM on full transactions table
  SQL:
    CREATE MATERIALIZED VIEW mv_revenue_summary AS
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      SUM(amount) AS total_collected,
      COUNT(*) AS total_transactions,
      COUNT(DISTINCT plan_id) AS active_plans
    FROM payment_transactions
    WHERE status = 'success'
    GROUP BY 1;
    CREATE UNIQUE INDEX ON mv_revenue_summary (month);
  Refresh trigger: payment.received QStash event -> REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_summary

mv_overdue_summary (refresh: daily 9AM IST - before CRON fires)
  Purpose: Dashboard card "Total Overdue Amount" without live aggregation
  SQL:
    CREATE MATERIALIZED VIEW mv_overdue_summary AS
    SELECT
      COUNT(*) AS overdue_count,
      SUM(amount) AS overdue_amount,
      AVG(EXTRACT(DAYS FROM NOW() - due_date)) AS avg_days_overdue
    FROM payment_installments
    WHERE status = 'overdue' AND deleted_at IS NULL;

mv_student_fee_status (refresh: on payment.received or payment.overdue event)
  Purpose: Student portal shows "Next Due: 15 Apr, Amount: 5000" without live query
  SQL:
    CREATE MATERIALIZED VIEW mv_student_fee_status AS
    SELECT
      pi.plan_id,
      pp.user_id,
      MIN(pi.due_date) FILTER (WHERE pi.status = 'pending') AS next_due_date,
      SUM(pi.amount) FILTER (WHERE pi.status = 'pending') AS outstanding_amount,
      SUM(pi.amount) FILTER (WHERE pi.status = 'paid') AS paid_amount
    FROM payment_installments pi
    JOIN payment_plans pp ON pp.id = pi.plan_id
    WHERE pi.deleted_at IS NULL
    GROUP BY pi.plan_id, pp.user_id;
    CREATE UNIQUE INDEX ON mv_student_fee_status (user_id);

#### Redis Caching

Cache key: fee_status:{userId} -> TTL 15 minutes
Content: { nextDueDate, outstandingAmount, paidAmount, planStatus }
Where used: student dashboard "Fees" card - avoid DB hit on every page load
Invalidate on: payment.received event or installment status change
Method: PaymentCache.getStudentFeeStatus(userId): Promise<FeeStatusDTO>
File: packages/db-payment/src/cache/payment.cache.ts [NEW]

Cache key: overdue_count -> TTL 5 minutes (global, shared across admin sessions)
Content: total overdue count for admin dashboard badge
Invalidate: daily after CRON run

#### Performance Queries

CRON: Overdue detection (daily 9AM IST via GCP Cloud Scheduler)
  SELECT id, plan_id, due_date, amount FROM payment_installments
  WHERE status = 'pending'
    AND due_date < NOW() - INTERVAL '14 days'
    AND deleted_at IS NULL
  ORDER BY due_date ASC
  LIMIT 100;
  -> Publish payment.overdue event per result
  -> Batch: process 100 at a time, schedule next batch if more exist
  Index serving this: (status, due_date) WHERE status = 'pending'

CRON: Access suspension warning (daily 8AM IST - before overdue CRON)
  SELECT pi.plan_id, pp.user_id FROM payment_installments pi
  JOIN payment_plans pp ON pp.id = pi.plan_id
  WHERE pi.status = 'pending'
    AND pi.due_date < NOW() - INTERVAL '10 days'
    AND pi.due_date >= NOW() - INTERVAL '14 days'
  -> Send "4 days to suspension" WhatsApp via notification-service

Access suspension check (on every student login):
  Instead of live query -> check Redis key: suspended:{userId}
  Key set by: payment.overdue event handler
  Key removed by: payment.received event handler
  TTL: none (manual removal only)

Webhook idempotency (on every Razorpay webhook):
  SELECT id FROM payment_transactions WHERE payment_ref = 
  If exists: return 200 immediate (skip processing)
  If not: INSERT + set idempotency marker
  Index serving this: payment_ref UNIQUE

---

### DB 5: placement_prod - Detailed Performance Spec

#### Materialized Views

mv_placement_statistics (refresh: daily 6AM IST)
  Purpose: Admin dashboard cards - placed students, active openings, avg package
  SQL:
    CREATE MATERIALIZED VIEW mv_placement_statistics AS
    SELECT
      COUNT(DISTINCT student_id) FILTER (WHERE status = 'placed') AS placed_students,
      COUNT(*) FILTER (WHERE status = 'open') AS active_job_openings,
      AVG(offered_ctc) FILTER (WHERE status = 'accepted') AS avg_package_lpa,
      MAX(offered_ctc) FILTER (WHERE status = 'accepted') AS highest_package_lpa
    FROM placement_offers po
    JOIN job_listings jl ON jl.id = po.listing_id
    WHERE po.deleted_at IS NULL;

mv_student_placement_readiness (refresh: on certificate.issued event)
  Purpose: Show readiness score so admin knows who is ready to be placed
  SQL:
    CREATE MATERIALIZED VIEW mv_student_placement_readiness AS
    SELECT
      spp.user_id,
      spp.readiness_score,
      CASE
        WHEN spp.readiness_score >= 80 THEN 'ready'
        WHEN spp.readiness_score >= 50 THEN 'partial'
        ELSE 'not_ready'
      END AS readiness_tier,
      spp.skills,
      spp.preferred_location,
      spp.expected_ctc
    FROM student_placement_profiles spp
    WHERE spp.deleted_at IS NULL AND spp.status = 'active';
    CREATE UNIQUE INDEX ON mv_student_placement_readiness (user_id);
    CREATE INDEX ON mv_student_placement_readiness (readiness_tier);

mv_domain_placement_rate (refresh: weekly Sunday 2AM IST)
  Purpose: Analytics - which domains have best placement rates
  SQL:
    CREATE MATERIALIZED VIEW mv_domain_placement_rate AS
    SELECT
      jl.domain_id,
      COUNT(DISTINCT pa.student_id) AS applications,
      COUNT(DISTINCT po.student_id) FILTER (WHERE po.status = 'accepted') AS placements,
      ROUND(100.0 * COUNT(po.id) / NULLIF(COUNT(pa.id), 0), 1) AS placement_rate_pct
    FROM job_listings jl
    LEFT JOIN placement_applications pa ON pa.listing_id = jl.id
    LEFT JOIN placement_offers po ON po.listing_id = jl.id
    WHERE jl.deleted_at IS NULL
    GROUP BY jl.domain_id;

#### Upstash Vector - Semantic Skill Matching (Core Feature)

Two vector indexes on Upstash:
  Index 1: placement-students
    Vectors: embed each student's skills[] + experience summary
    Metadata: { userId, readinessScore, preferredLocation, expectedCTC }
    Update: when student profile created/updated -> re-embed and upsert
    Method: PlacementVectorService.indexStudentProfile(userId, profileData)

  Index 2: placement-jobs
    Vectors: embed each job's required_skills[] + job description
    Metadata: { listingId, domainId, companyName, ctcRange, location }
    Update: when job listing created/updated -> re-embed and upsert
    Method: PlacementVectorService.indexJobListing(listingId, listingData)

Match queries:
  findStudentsForJob(listingId):
    -> Get job embedding from placement-jobs index
    -> Query placement-students: topK=50, filter: readinessScore >= 60
    -> Return ranked student list
    -> Variable: vectorIndex.query({ topK: 50, vector: jobEmbedding, filter: 'readinessScore >= 60' })

  findJobsForStudent(userId):
    -> Get student embedding from placement-students index
    -> Query placement-jobs: topK=20, filter: location matches preference
    -> Return ranked job list
    -> Used for: student portal "Recommended Jobs" section

#### Redis Caching

Cache key: job_listings:domain:{domainId} -> TTL 30 minutes
Content: list of open job listings per domain
Invalidate: when new job listing created or status changes
Used for: student portal job board to avoid DB on every page load

Cache key: student_readiness:{userId} -> TTL 1 hour
Content: { readinessTier, skillsCount, preferredLocation }
Invalidate: on certificate.issued event
Used for: faculty-app "Placement Ready" student list

#### Performance Queries

Admin query: Students ready for placement in a batch
  SELECT spp.user_id, spp.readiness_score, spp.skills
  FROM mv_student_placement_readiness spp   <- uses materialized view
  JOIN batch_enrollments be ON be.user_id = spp.user_id
  WHERE be.batch_id =  AND spp.readiness_tier = 'ready'
  ORDER BY spp.readiness_score DESC;

Company query: Best matching students for a job (SQL fallback if Vector unavailable)
  SELECT spp.user_id, spp.readiness_score
  FROM student_placement_profiles spp
  WHERE spp.skills &&   <- array overlap operator
    AND spp.expected_ctc <= 
    AND spp.status = 'active'
    AND spp.deleted_at IS NULL
  ORDER BY spp.readiness_score DESC
  LIMIT 20;
  Index needed: GIN index on skills[] array column

CRON: Weekly placement report (Sunday 5AM IST)
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_placement_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_domain_placement_rate;
  -> Publish placement report to admin email

---

### people_prod (Extended): SkillUp CRM, Faculty, Batch, Attendance Tables

Per ADR-CRITICAL-001, people_prod is shared by skillhubcore-service AND skillup-service.
All SkillUp operational tables (enquiry, admission, faculty, batch, attendance) live here.

#### Tables, Schema Design and Indexes

enquiries
  Columns: id UUID PK, full_name, email, phone, source (enum: website/referral/ad/walkin),
           utm_source, utm_medium, utm_campaign, status (enum: new/contacted/qualified/lost),
           assigned_counsellor_id UUID ref users.id, notes TEXT, created_at, updated_at, deleted_at
  Indexes:
    idx_enquiries_status_created: (status, created_at DESC) -- counsellor queue
    idx_enquiries_phone: (phone) UNIQUE WHERE deleted_at IS NULL -- dedup walk-ins
    idx_enquiries_counsellor: (assigned_counsellor_id, status) -- counsellor workload view
    idx_enquiries_source: (source, created_at) -- marketing attribution reports

enquiry_follow_ups
  Columns: id UUID PK, enquiry_id UUID ref enquiries.id,
           counsellor_id UUID, follow_up_type (call/email/whatsapp),
           notes TEXT, next_follow_up_at TIMESTAMPTZ, created_at
  Indexes:
    idx_followups_enquiry: (enquiry_id)
    idx_followups_scheduled: (next_follow_up_at) WHERE next_follow_up_at > NOW() -- dashboard alerts

admissions
  Columns: id UUID PK, enquiry_id UUID ref enquiries.id,
           student_user_id UUID ref users.id, admission_type (enum: digital/training),
           domain_id UUID, batch_id UUID ref batches.id,
           status (enum: pending/approved/rejected), admission_date TIMESTAMPTZ,
           documents JSONB, approved_by UUID ref users.id, created_at, updated_at, deleted_at
  Indexes:
    idx_admissions_student: (student_user_id) UNIQUE WHERE deleted_at IS NULL
    idx_admissions_status: (status, created_at DESC)
    idx_admissions_batch: (batch_id)

faculty
  Columns: id UUID PK, user_id UUID ref users.id UNIQUE,
           specializations UUID[] (domain_ids), availability_type (enum: fulltime/parttime/contract),
           status (enum: active/inactive/on_leave), hourly_rate DECIMAL,
           rating_avg DECIMAL, total_sessions INTEGER, joined_at DATE, deleted_at
  Indexes:
    idx_faculty_user: (user_id) UNIQUE WHERE deleted_at IS NULL
    idx_faculty_status: (status) WHERE status = 'active'
    idx_faculty_specializations: GIN index on specializations UUID[]  -- match faculty to domain

faculty_availability
  Columns: id UUID PK, faculty_id UUID, day_of_week INTEGER, start_time TIME, end_time TIME,
           is_booked BOOLEAN, booked_batch_id UUID
  Indexes:
    idx_faculty_avail_faculty: (faculty_id, day_of_week)
    idx_faculty_avail_unbooked: (faculty_id, is_booked) WHERE is_booked = FALSE
  Redis: faculty:availability:{facultyId} -> sorted set of booked slots (O(log N) conflict check)

batches
  Columns: id UUID PK, name TEXT, domain_id UUID, subject_id UUID,
           faculty_id UUID ref faculty.id, start_date DATE, end_date DATE,
           capacity INTEGER, enrolled_count INTEGER, mode (enum: online/offline/hybrid),
           status (enum: upcoming/active/completed/cancelled), created_at, deleted_at
  Indexes:
    idx_batches_status_domain: (status, domain_id) -- admin dashboard filters
    idx_batches_faculty: (faculty_id, status) -- faculty schedule view
    idx_batches_active: (status, start_date) WHERE status = 'active'
  Redis: batch:capacity:{batchId} -> INTEGER (atomic increment on enroll, decrement on drop)
         Prevents overselling seats on concurrent enrollments

batch_sessions
  Columns: id UUID PK, batch_id UUID ref batches.id, faculty_id UUID,
           scheduled_at TIMESTAMPTZ, duration_minutes INTEGER, subtopics_covered UUID[],
           session_notes TEXT, status (enum: scheduled/completed/cancelled), created_at
  Indexes:
    idx_batch_sessions_batch_date: (batch_id, scheduled_at DESC)
    idx_batch_sessions_faculty_upcoming: (faculty_id, scheduled_at) WHERE status = 'scheduled'
    idx_batch_sessions_subtopics: GIN index on subtopics_covered UUID[]

batch_enrollments
  Columns: id UUID PK, batch_id UUID, student_user_id UUID, enrolled_at TIMESTAMPTZ,
           status (enum: active/dropped/completed), dropped_at TIMESTAMPTZ, deleted_at
  Indexes:
    idx_enrollments_batch_student: UNIQUE (batch_id, student_user_id) WHERE deleted_at IS NULL
    idx_enrollments_student: (student_user_id, status) -- student's current batch

attendance_records
  Columns: id UUID PK, session_id UUID ref batch_sessions.id,
           student_user_id UUID, status (enum: present/absent/late),
           marked_by UUID ref faculty.id, marked_at TIMESTAMPTZ
  Indexes:
    idx_attendance_session: (session_id) -- session-level bulk mark
    idx_attendance_student_session: UNIQUE (session_id, student_user_id) -- no duplicate marking
    idx_attendance_student_date: (student_user_id, marked_at DESC) -- student history
  Partitioning: PARTITION BY RANGE (marked_at) monthly -- grows unbounded at scale

demo_sessions
  Columns: id UUID PK, enquiry_id UUID, faculty_id UUID, scheduled_at TIMESTAMPTZ,
           status (enum: scheduled/completed/no_show), feedback TEXT, created_at
  Indexes:
    idx_demo_sessions_enquiry: (enquiry_id)
    idx_demo_sessions_scheduled: (scheduled_at) WHERE status = 'scheduled'

#### Materialized Views for SkillUp Tables

mv_batch_attendance_summary (refresh: after attendance.marked event -- async via QStash)
  Purpose: Faculty and admin dashboard - attendance % per student per batch
  SQL:
    CREATE MATERIALIZED VIEW mv_batch_attendance_summary AS
    SELECT
      be.batch_id,
      be.student_user_id,
      COUNT(bs.id) AS total_sessions,
      COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
      COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent_count,
      ROUND(100.0 * COUNT(ar.id) FILTER (WHERE ar.status = 'present') /
            NULLIF(COUNT(bs.id), 0), 1) AS attendance_pct
    FROM batch_enrollments be
    JOIN batch_sessions bs ON bs.batch_id = be.batch_id AND bs.status = 'completed'
    LEFT JOIN attendance_records ar ON ar.session_id = bs.id
                                   AND ar.student_user_id = be.student_user_id
    WHERE be.deleted_at IS NULL
    GROUP BY be.batch_id, be.student_user_id;
    CREATE UNIQUE INDEX ON mv_batch_attendance_summary (batch_id, student_user_id);
    CREATE INDEX ON mv_batch_attendance_summary (student_user_id, attendance_pct);

mv_counsellor_pipeline (refresh: every 5 minutes via CRON)
  Purpose: CRM dashboard - counsellor conversion funnel at a glance
  SQL:
    CREATE MATERIALIZED VIEW mv_counsellor_pipeline AS
    SELECT
      assigned_counsellor_id,
      COUNT(*) FILTER (WHERE status = 'new') AS new_leads,
      COUNT(*) FILTER (WHERE status = 'contacted') AS contacted,
      COUNT(*) FILTER (WHERE status = 'qualified') AS qualified,
      COUNT(*) FILTER (WHERE status = 'lost') AS lost,
      COUNT(a.id) AS converted_to_admission
    FROM enquiries e
    LEFT JOIN admissions a ON a.enquiry_id = e.id
    WHERE e.deleted_at IS NULL
    GROUP BY assigned_counsellor_id;
    CREATE UNIQUE INDEX ON mv_counsellor_pipeline (assigned_counsellor_id);

mv_faculty_workload (refresh: daily 6AM IST)
  Purpose: Admin view - which faculty are overloaded, which are free
  SQL:
    CREATE MATERIALIZED VIEW mv_faculty_workload AS
    SELECT
      f.id AS faculty_id,
      COUNT(DISTINCT bs.id) FILTER (WHERE bs.scheduled_at > NOW()) AS upcoming_sessions,
      COUNT(DISTINCT be.student_user_id) AS total_students,
      f.rating_avg, f.total_sessions
    FROM faculty f
    LEFT JOIN batch_sessions bs ON bs.faculty_id = f.id
    LEFT JOIN batch_enrollments be ON be.batch_id = bs.batch_id
    WHERE f.deleted_at IS NULL AND f.status = 'active'
    GROUP BY f.id;
    CREATE UNIQUE INDEX ON mv_faculty_workload (faculty_id);

#### Redis Caching for SkillUp Tables

batch:capacity:{batchId}  -> INTEGER  TTL none (persistent counter)
  Increment on enroll, decrement on drop
  Source of truth: batches.enrolled_count (sync periodically)
  Purpose: Prevent overselling batch seats on concurrent enrollments

counsellor:followups:{counsellorId}  -> LIST of { enquiryId, nextFollowUpAt }  TTL 4 hours
  Hot path: counsellor opens CRM -> see today's follow-up list instantly
  Invalidate: when follow_up is marked done or rescheduled

faculty:schedule:{facultyId}:{week}  -> JSON  TTL 1 hour
  Faculty-app loads schedule on every login
  Cache: upcoming batch_sessions for that faculty for current week

suspended_students -> Redis SET of user_ids suspended for non-payment  TTL none
  Fast O(1) check on every student login: SISMEMBER suspended_students {userId}
  Set by: payment.overdue event handler  Remove by: payment.received

#### CRON Jobs for SkillUp Data

Daily 10AM IST - Follow-up reminder alerts
  SELECT eq.*, e.full_name, e.phone FROM enquiry_follow_ups eq
  JOIN enquiries e ON e.id = eq.enquiry_id
  WHERE eq.next_follow_up_at::DATE = CURRENT_DATE
    AND e.status IN ('new', 'contacted', 'qualified')
  -> Send WhatsApp to counsellor with follow-up list
  Index: idx_followups_scheduled

Daily 8AM IST - Attendance alert for absent students
  SELECT ar.student_user_id, bs.batch_id FROM attendance_records ar
  JOIN batch_sessions bs ON bs.id = ar.session_id
  WHERE ar.status = 'absent' AND ar.marked_at::DATE = CURRENT_DATE - 1
  -> Publish attendance.marked event for each absent student
  -> notification-service sends WhatsApp within 15 minutes

Weekly Sunday - Batch progress report
  SELECT * FROM mv_batch_attendance_summary WHERE batch_id = 
  JOIN users u ON u.id = student_user_id
  -> Email report to batch faculty and SkillUp admin
