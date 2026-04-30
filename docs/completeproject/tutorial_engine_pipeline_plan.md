# 🏗️ Tutorial Engine Content Pipeline — Revised Implementation Plan
## Aligned to `src/share-branding` Shared Architecture

> **Both brands (RTH + SkillUp) consume the same shared components from `src/`.**
> **Brand-specific Next.js app files are thin wires only — they never contain UI logic.**

---

## 🗺️ How the Existing Architecture Works (Pattern Audit)

```
src/share-branding/
│
│  ← ALL SHARED UI LIVES HERE (both brands)
│
├── brandConfig.ts              ← BrandConfig interface + rthConfig + skillUpConfig
├── TutorialDashboard/
│   ├── TutorialEngineDashboardPage.tsx   ← Shared Page shell (BrandProvider + DataProvider)
│   ├── components/
│   │   ├── TutorialTopBar.tsx
│   │   ├── TutorialSidebar.tsx
│   │   ├── WelcomeHero.tsx
│   │   ├── MyDomainsGrid.tsx
│   │   └── ...widgets
│   └── tutorialDashboardData.ts          ← ViewData interface + buildXxxData(brand)
│
├── TutorialEngine/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── CurriculumSection.tsx         ← ← ← THIS is the existing section renderer
│   │   ├── LearnerFlowDashboard.tsx
│   │   ├── AITutorDrawer.tsx
│   │   └── TutorialDataContext.tsx
│   └── (TutorialEnginePage.tsx at root)
│
├── services/
│   └── apiClient.ts            ← apiFetch / apiGet / apiPost (reuse for all API calls)
├── lib/
│   └── unifiedFetch.ts         ← SSR-safe fetch with cookie forwarding (reuse for server)
└── ui/                         ← Shared Shadcn/ui primitives (Button, Select, Badge, etc.)
```

```
apps/realtutorialhub-web/src/app/tutorial/page.tsx   ← THIN WIRE
  → imports TutorialEngineDashboardPage from src/share-branding/TutorialDashboard/
  → imports buildTutorialDashboardData from src/share-branding/tutorialDashboardData.ts
  → imports rthConfig from src/share-branding/brandConfig.ts
  → passes config + data as props — NOTHING ELSE
```

```
apps/skillup-web/src/app/tutorial/page.tsx   ← THIN WIRE (same pattern, skillUpConfig)
```

---

## ✅ Existing Legacy Code to **REUSE** (Do Not Rebuild)

| Existing File | What to Reuse |
|---|---|
| `src/share-branding/brandConfig.ts` | `BrandConfig` interface — extend with `tutorialSubtopicPage*` fields if needed |
| `src/share-branding/TutorialEngine/components/CurriculumSection.tsx` | Section-block rendering pattern — adapt into section-type components |
| `src/share-branding/TutorialEngine/components/TutorialDataContext.tsx` | `TutorialDataProvider` / `useTutorialData` — same pattern for SubtopicDataContext |
| `src/share-branding/services/apiClient.ts` | `apiGet`, `apiPost`, `apiPatch` — all Admin CMS calls use this |
| `src/share-branding/lib/unifiedFetch.ts` | Server-side fetch with cookie forwarding — all SSR page data fetches use this |
| `src/share-branding/ui/*` | `Badge`, `Button`, `Select`, `Textarea`, `Tabs`, `Skeleton` — Admin form UI |
| `src/share-branding/PostLandingPage/app/context/BrandContext.tsx` | `BrandProvider` / `useBrand` — wrap every new shared page |
| `src/share-branding/TutorialDashboard/components/TutorialTopBar.tsx` | Can be reused as-is on subtopic pages |
| `src/share-branding/TutorialDashboard/components/TutorialSidebar.tsx` | Can be reused as-is on subtopic pages |
| `packages/db-tutorial` (existing schema) | `tutorialDomains`, `tutorialSubjects`, `tutorialTopics`, `tutorialSubtopics` — all intact |
| `packages/db-tutorial/src/schema/enums.ts` | Extend with new enums — do not rewrite |

---

## 🚫 What NOT to Build in Brand Apps

- No UI components inside `apps/realtutorialhub-web/src/`
- No UI components inside `apps/skillup-web/src/`
- No API call logic inside brand apps — all goes into `src/share-branding/services/`
- No data interfaces defined in brand apps — all go into `src/share-branding/`

---

## 📋 REVISED IMPLEMENTATION PHASES

---

## PHASE 1 — Database Schema Evolution
**Package:** `packages/db-tutorial`
**Touches:** `enums.ts`, new `tutorial-content-sections.ts`, `schema/index.ts`

### 1A. Extend `enums.ts` (add 2 new enums)

```ts
// ADD to packages/db-tutorial/src/schema/enums.ts

export const tutorialSectionTypeEnum = pgEnum('tutorial_section_type', [
  'notes',
  'layman',
  'real_life',
  'technical',
  'code_examples',
  'assignment',
  'quiz',
  'summary',
  'interview',
]);

export const tutorialContentStatusEnum = pgEnum('tutorial_content_status', [
  'draft',
  'review',
  'approved',
  'published',
  'archived',
]);
```

### 1B. New schema file: `tutorial-content-sections.ts`

```ts
// packages/db-tutorial/src/schema/tutorial-content-sections.ts

export const tutorialContentSections = pgTable('tutorial_content_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  subtopicId: uuid('subtopic_id').notNull().references(() => tutorialSubtopics.id),
  sectionType: tutorialSectionTypeEnum('section_type').notNull(),
  title: text('title').notNull(),
  contentBody: text('content_body').notNull(),   // HTML/Markdown — rendered to users
  contentJson: jsonb('content_json'),            // Optional structured data (quiz/assignment)
  status: tutorialContentStatusEnum('status').notNull().default('draft'),
  sectionOrder: integer('section_order').notNull().default(0),
  version: integer('version').notNull().default(1),
  generatedByAi: boolean('generated_by_ai').notNull().default(false),
  aiModelUsed: text('ai_model_used'),
  adminCreatedBy: uuid('admin_created_by'),
  adminApprovedBy: uuid('admin_approved_by'),
  adminApprovedAt: timestamp('admin_approved_at', { mode: 'date' }),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  uqSectionPerSubtopic: uniqueIndex('uq_tutorial_content_sections_subtopic_type')
    .on(table.subtopicId, table.sectionType),
  idxBySubtopicStatus: index('idx_tutorial_content_sections_subtopic_status')
    .on(table.subtopicId, table.status),
}));
```

### 1C. Update `schema/index.ts`

Export + include in `schema` object (same pattern as all other tables).

### 1D. Generate + run Drizzle migration

```bash
cd packages/db-tutorial
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

---

## PHASE 2 — API Server: Tutorial Content Module
**Package:** `apps/api-server/src/modules/`
**New module:** `tutorial-content/`

### 2A. File structure (mirrors existing module pattern)

```
apps/api-server/src/modules/tutorial-content/
├── tutorial-content.controller.ts
├── tutorial-content.service.ts
├── tutorial-content.repository.ts
├── tutorial-content.dto.ts
└── tutorial-content.module.ts
```

### 2B. Public routes (user-facing)

```ts
GET /tutorial/hierarchy
// Returns domains → subjects → topics → subtopics tree
// Reuse: hierarchy module already exists in api-server/src/modules/hierarchy/

GET /tutorial/:domainSlug/:subjectSlug/:topicSlug/:subtopicSlug/sections
// Returns all published sections for slug-resolved subtopic
// Query: status = 'published', ordered by section_order ASC
```

### 2C. Admin routes (CMS-facing)

```ts
POST   /admin/tutorial/sections           // Create section
PUT    /admin/tutorial/sections/:id       // Update section content
PATCH  /admin/tutorial/sections/:id/status // Change status
GET    /admin/tutorial/sections           // List with filters
DELETE /admin/tutorial/sections/:id       // Soft delete
GET    /admin/tutorial/hierarchy          // Cascading selectors for admin form
```

### 2D. Key query (slug resolution + section fetch)

```sql
-- Step 1: Resolve slug → subtopicId
SELECT s.id FROM tutorial_subtopics s
JOIN tutorial_topics t ON s.topic_id = t.id
JOIN tutorial_subjects sub ON t.subject_id = sub.id
JOIN tutorial_domains d ON sub.domain_id = d.id
WHERE s.slug = $subtopicSlug
  AND t.slug = $topicSlug
  AND sub.slug = $subjectSlug
  AND d.slug = $domainSlug
  AND s.deleted_at IS NULL;

-- Step 2: Fetch sections
SELECT * FROM tutorial_content_sections
WHERE subtopic_id = $subtopicId
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY section_order ASC;
```

---

## PHASE 3 — Shared Components: `src/share-branding/TutorialSubtopicPage/`
**This is the KEY phase — all UI lives here, shared across both brands**

### 3A. New folder structure

```
src/share-branding/TutorialSubtopicPage/
├── TutorialSubtopicPage.tsx           ← Shared page shell (BrandProvider + DataProvider)
├── tutorialSubtopicPageData.ts        ← SubtopicViewData interface + fetch function
├── components/
│   ├── SubtopicDataContext.tsx        ← Context (mirrors TutorialDataContext.tsx pattern)
│   ├── SubtopicHeader.tsx             ← Breadcrumb + title + progress indicator
│   ├── SubtopicProgressBar.tsx        ← Sections completion tracker
│   ├── sections/
│   │   ├── NotesSection.tsx
│   │   ├── LaymanSection.tsx
│   │   ├── RealLifeSection.tsx
│   │   ├── TechnicalSection.tsx
│   │   ├── CodeExamplesSection.tsx
│   │   ├── AssignmentSection.tsx
│   │   ├── QuizSection.tsx
│   │   ├── SummarySection.tsx
│   │   └── InterviewSection.tsx
│   └── SectionShell.tsx              ← Common wrapper (reuses CurriculumSection pattern)
```

### 3B. `tutorialSubtopicPageData.ts` (mirrors `tutorialPageData.ts` pattern)

```ts
// src/share-branding/TutorialSubtopicPage/tutorialSubtopicPageData.ts

export type TutorialSectionType =
  | 'notes' | 'layman' | 'real_life' | 'technical'
  | 'code_examples' | 'assignment' | 'quiz' | 'summary' | 'interview';

export type TutorialContentStatus =
  | 'draft' | 'review' | 'approved' | 'published' | 'archived';

export interface SubtopicSection {
  id: string;
  sectionType: TutorialSectionType;
  title: string;
  contentBody: string;         // HTML — rendered via dangerouslySetInnerHTML
  contentJson?: object;        // Structured data for quiz/assignment
  sectionOrder: number;
  version: number;
  publishedAt: string;
}

export interface SubtopicBreadcrumb {
  domainName: string;
  domainSlug: string;
  subjectName: string;
  subjectSlug: string;
  topicName: string;
  topicSlug: string;
  subtopicName: string;
  subtopicSlug: string;
}

export interface SubtopicViewData {
  breadcrumb: SubtopicBreadcrumb;
  sections: SubtopicSection[];      // Only published sections from API
  totalSections: number;            // Count of all possible section types (9)
  publishedCount: number;
}

// Fetch function used by brand app's page.tsx (SSR)
// Uses unifiedFetch (already exists in src/share-branding/lib/unifiedFetch.ts)
export async function fetchSubtopicViewData(
  domainSlug: string,
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string
): Promise<SubtopicViewData> {
  // calls GET /tutorial/:domainSlug/:subjectSlug/:topicSlug/:subtopicSlug/sections
  // uses unifiedFetch for SSR cookie forwarding
}
```

### 3C. `TutorialSubtopicPage.tsx` shell (mirrors `TutorialEngineDashboardPage.tsx`)

```tsx
// src/share-branding/TutorialSubtopicPage/TutorialSubtopicPage.tsx
'use client';

export default function TutorialSubtopicPage({
  config,
  data,
}: {
  config: BrandConfig;
  data: SubtopicViewData;
}) {
  return (
    <BrandProvider brand={config}>
      <AuthRefreshProvider>
        <SubtopicDataProvider value={data}>
          <SubtopicContent />
        </SubtopicDataProvider>
      </AuthRefreshProvider>
    </BrandProvider>
  );
}

function SubtopicContent() {
  const data = useSubtopicData();
  const sectionMap = Object.fromEntries(
    data.sections.map(s => [s.sectionType, s])
  );

  return (
    <>
      <TutorialTopBar ... />          {/* REUSE existing TutorialTopBar */}
      <TutorialSidebar ... />         {/* REUSE existing TutorialSidebar */}
      <main>
        <SubtopicHeader />
        <SubtopicProgressBar />

        {sectionMap.notes        && <NotesSection        data={sectionMap.notes} />}
        {sectionMap.layman       && <LaymanSection       data={sectionMap.layman} />}
        {sectionMap.real_life    && <RealLifeSection     data={sectionMap.real_life} />}
        {sectionMap.technical    && <TechnicalSection    data={sectionMap.technical} />}
        {sectionMap.code_examples && <CodeExamplesSection data={sectionMap.code_examples} />}
        {sectionMap.assignment   && <AssignmentSection   data={sectionMap.assignment} />}
        {sectionMap.quiz         && <QuizSection         data={sectionMap.quiz} />}
        {sectionMap.summary      && <SummarySection      data={sectionMap.summary} />}
        {sectionMap.interview    && <InterviewSection    data={sectionMap.interview} />}
      </main>
    </>
  );
}
```

### 3D. `SectionShell.tsx` — reuses `CurriculumSection.tsx` styling pattern

Each section component wraps with `SectionShell` which provides:
- Consistent card container
- Section icon + color coding by type
- Expand/collapse
- Section title bar
- "Mark as read" interaction

---

## PHASE 4 — Brand App Wiring (Thin Wire Pages Only)

### 4A. RTH Web App — New route

```
apps/realtutorialhub-web/src/app/tutorial/[domain]/[subject]/[topic]/[subtopic]/page.tsx
```

```tsx
// THIN WIRE — no UI logic here
import TutorialSubtopicPage from '../../../../../../src/share-branding/TutorialSubtopicPage/TutorialSubtopicPage';
import { fetchSubtopicViewData } from '../../../../../../src/share-branding/TutorialSubtopicPage/tutorialSubtopicPageData';
import { rthConfig } from '../../../../../../src/share-branding/brandConfig';

export default async function Page({ params }) {
  const data = await fetchSubtopicViewData(
    params.domain,
    params.subject,
    params.topic,
    params.subtopic
  );
  return <TutorialSubtopicPage config={rthConfig} data={data} />;
}

export async function generateMetadata({ params }) {
  // SEO metadata from fetched data
}
```

### 4B. SkillUp Web App — same thin wire (skillUpConfig)

```
apps/skillup-web/src/app/tutorial/[domain]/[subject]/[topic]/[subtopic]/page.tsx
```

Identical pattern, only difference: `skillUpConfig` instead of `rthConfig`.

---

## PHASE 5 — Admin CMS: Content Ingestion (Shared)

> **Key decision:** Admin CMS UI also lives in `src/share-branding/` if used by both brands.
> If admin is RTH-only for now, it lives in `apps/realtutorialhub-admin/src/` but still
> uses all shared primitives from `src/share-branding/ui/` and `src/share-branding/services/apiClient.ts`.

### 5A. Admin route

```
apps/realtutorialhub-admin/src/app/(authenticated)/tutorial/content/
├── page.tsx              ← Section list dashboard
├── new/page.tsx          ← Create section form
└── [sectionId]/page.tsx  ← Edit section form
```

### 5B. Form uses — ALL from `src/share-branding/ui/`

- `Select` — Domain / Subject / Topic / Subtopic cascading dropdowns
- `Button` — Save Draft, Publish, Approve
- `Badge` — Status display
- `Textarea` — Content body input
- `Tabs` — Switch between Edit / Preview / History
- `Dialog` — AI JSON paste modal

### 5C. API calls use — `src/share-branding/services/apiClient.ts`

```ts
// Reuse existing apiPost, apiPatch, apiGet
import { apiPost, apiPatch, apiGet } from '@/../../src/share-branding/services/apiClient';

// Create section
await apiPost('/api/admin/tutorial/sections', sectionPayload);

// Change status
await apiPatch(`/api/admin/tutorial/sections/${id}/status`, { status: 'published' });
```

### 5D. AI Paste Panel (Bonus feature)

A collapsible panel where admin pastes raw AI JSON → form auto-populates:

```ts
function parseAiOutput(jsonString: string): Partial<CreateSectionFormData> {
  const p = JSON.parse(jsonString);
  return {
    sectionType: p.section_type,
    title: p.title,
    contentBody: p.content,
    status: p.status ?? 'draft',
    version: p.version ?? 1,
    generatedByAi: true,
  };
}
```

---

## 📐 Final File Map Summary

```
src/share-branding/
  TutorialSubtopicPage/                 ← NEW (Phase 3)
    TutorialSubtopicPage.tsx            ← NEW
    tutorialSubtopicPageData.ts         ← NEW
    components/
      SubtopicDataContext.tsx           ← NEW (cloned from TutorialDataContext.tsx)
      SubtopicHeader.tsx                ← NEW
      SubtopicProgressBar.tsx           ← NEW
      SectionShell.tsx                  ← NEW (styled from CurriculumSection.tsx)
      sections/
        NotesSection.tsx                ← NEW ×9
        ...

packages/db-tutorial/src/schema/
  enums.ts                              ← EXTEND (Phase 1A)
  tutorial-content-sections.ts         ← NEW (Phase 1B)
  index.ts                             ← EXTEND (Phase 1C)

apps/api-server/src/modules/
  tutorial-content/                    ← NEW module (Phase 2)

apps/realtutorialhub-web/src/app/tutorial/
  [domain]/[subject]/[topic]/[subtopic]/page.tsx  ← NEW thin wire (Phase 4A)

apps/skillup-web/src/app/tutorial/
  [domain]/[subject]/[topic]/[subtopic]/page.tsx  ← NEW thin wire (Phase 4B)

apps/realtutorialhub-admin/src/app/(authenticated)/tutorial/
  content/page.tsx                     ← NEW (Phase 5)
  content/new/page.tsx                 ← NEW
  content/[sectionId]/page.tsx         ← NEW
```

---

## 📅 Sprint Breakdown (Dependency Order)

```
Phase 1: DB Schema      → 1–2 days   (no dependencies)
    ↓
Phase 2: API Server     → 2–3 days   (depends on Phase 1)
    ↓
Phase 3: Shared UI      → 3–4 days   (depends on Phase 2)
    ↓
Phase 4: Brand Wiring   → 0.5 days   (depends on Phase 3 — just thin files)
Phase 5: Admin CMS      → 3–4 days   (can parallel Phase 3)
```

**Total: ~10–14 working days**

---

## 🚦 Ready to Execute

**Say "start Phase 1"** → I will:
1. Add the 2 new enums to `packages/db-tutorial/src/schema/enums.ts`
2. Create `tutorial-content-sections.ts`
3. Update `schema/index.ts`
4. Generate Drizzle migration
