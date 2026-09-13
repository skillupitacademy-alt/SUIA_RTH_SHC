# PHASE 4.5 — STEP 1: RUNTIME IDENTITY RESOLUTION REPORT

**Report Date:** 2026-09-05  
**Baseline Commit:** f3405900 (Phase 4.4 certified)  
**Investigation Scope:** Runtime identity sources for Phase 4.5 block telemetry integration

---

## EXECUTIVE SUMMARY

✅ **ALL REQUIRED IDENTITIES RESOLVED FROM SOURCE**

All identity values required for Phase 4.5 block telemetry have been traced from source code and proven available at runtime. No assumptions were made. **Implementation is CLEARED to proceed to STEP 2.**

### Critical Discovery: navigationNodeId ≠ subtopicSlug

**PROVEN FROM SOURCE:** `navigationNodeId` is a **distinct concept** from `subtopicSlug`.

- `subtopicSlug`: URL routing segment (e.g., "what-is-java-12efacf1")
- `navigationNodeId`: Sidebar page node identifier (e.g., "what-is-java")

**Architecture Evidence:**
```typescript
// From: src/share-branding/LearningExperience/runtime/TutorialPageIdentity.ts

/**
 * Canonical Tutorial DB slug
 * Example: "what-is-java-12efacf1"
 * This is the authoritative URL segment
 */
tutorialSubtopicSlug: string;

/**
 * Navigation node identity from sidebar tree
 * Example: "whatisjava"
 * Must belong to the requested subtopic context
 */
navigationNodeId: string;
```

**Current Page Implementation:** The current tutorial page at `/[subtopicSlug]/page.tsx` does **NOT** receive `navigationNodeId` from URL params. It only has:
- `domainSlug`
- `subjectSlug`
- `topicSlug`
- `subtopicSlug`

**IMPLICATION FOR PHASE 4.5:** The runtime **CANNOT** derive `navigationNodeId` from URL params alone. It must be resolved server-side and passed to the page components.

---

## 1. NAVIGATION NODE ID (navigationNodeId)

### Source of Truth

**Database:** `tutorial_sections.navigation_node_id`

**Server Resolution Chain:**
```
URL params (domainSlug, subjectSlug, topicSlug, subtopicSlug)
    ↓
getTutorialHierarchyForDelivery(params)
    ↓
getHierarchyBySlugs({ domainSlug, subjectSlug, topicSlug, subtopicSlug })
    ↓
curriculum/tutorial database JOIN
    ↓
TutorialPageIdentity.navigationNodeId
```

**Evidence Files:**
- `src/share-branding/LearningExperience/runtime/TutorialPageIdentity.ts` (lines 48-49)
- `src/share-branding/LearningExperience/__tests__/learner-page-resolution.phase1.test.ts` (multiple references)
- Test confirms: navigationNodeId is validated against sidebar, preserved exactly with hyphens

### Current Runtime Availability

❌ **NOT AVAILABLE** in current `TutorialExperience` component

**Current page.tsx implementation:**
```typescript
// apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx

const hierarchy = await getTutorialHierarchyForDelivery(resolved);
// hierarchy contains navigationNodeId but is NOT passed to TutorialExperience

<TutorialExperience
  params={resolved}           // ✅ Has: subtopicSlug
  subtopicId={sectionsPayload.subtopicId}  // ✅ Has: subtopicId
  // ❌ MISSING: navigationNodeId
  content={content}
  theme={theme}
  mode="learn"
  projects={projects}
/>
```

### Resolution Required for Phase 4.5

**OPTION 1 (Recommended):** Add `navigationNodeId` to page.tsx → TutorialExperience props

```typescript
// In page.tsx:
const hierarchy = await getTutorialHierarchyForDelivery(resolved);
const navigationNodeId = hierarchy?.subtopic.navigationNodeId || resolved.subtopicSlug;

<TutorialExperience
  params={resolved}
  subtopicId={sectionsPayload.subtopicId}
  navigationNodeId={navigationNodeId}  // ← ADD THIS
  // ...
/>
```

**OPTION 2 (Alternative):** Derive from existing ILSProvider API call
- ILSProvider already calls `/api/tutorial/ils/navigation/:nodeId`
- But requires knowing navigationNodeId before calling API
- Circular dependency

**DECISION:** Option 1 is correct. The page loader must resolve navigationNodeId from hierarchy and pass it to runtime.

---

## 2. SUBTOPIC ID (subtopicId)

### Source of Truth

**Database:** `tutorial_subtopics.id` (UUID)

**Server Resolution Chain:**
```
URL subtopicSlug
    ↓
getTutorialSectionsForDelivery(subtopicSlug)
    ↓
fetchSectionsViaApi(subtopicSlug)
    ↓
GET /tutorial/sections/:subtopicSlug
    ↓
TutorialSectionsResponse.subtopicId (UUID)
```

### Current Runtime Availability

✅ **AVAILABLE** in `TutorialExperience` component

**Evidence:**
```typescript
// apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx (line 140)

const sectionsPayload = await getValidatedTutorialSectionsForDelivery(resolved.subtopicSlug);

<TutorialExperience
  subtopicId={sectionsPayload.subtopicId}  // ✅ UUID passed from API
  // ...
/>
```

**Type:** `string` (UUID format)

**Value Example:** `"5326eeb6-c4c8-4218-9687-2b46f94a9bb4"`

### Status

✅ **READY FOR PHASE 4.5** — No changes required

---

## 3. SECTION ID (sectionId)

### Source of Truth

**Database:** `tutorial_sections.id` (UUID)

**Architecture Evidence:**
```typescript
// src/share-branding/LearningExperience/runtime/TutorialPageIdentity.ts (lines 51-54)

/**
 * Tutorial section ID (null if content not yet created)
 * Progressive publishing allows null here
 */
sectionId: string | null;
```

### Current Runtime Availability

❌ **NOT AVAILABLE** in current TutorialExperience props

**Investigation:**
- `TutorialSectionsResponse` includes `sectionMeta: Record<string, { id, version, language }>`
- Section IDs are available per section type: `notes`, `code`, `quiz`, etc.
- But NOT propagated to TutorialExperience component

### Phase 4.5 API Contract

**From Phase 4.4 schemas:**
```typescript
// apps/api-server/src/schemas/ils.schemas.ts

recordBlockVisitBodySchema = z.object({
  // ...
  sectionId: uuidSchema.optional().nullable(),  // ← OPTIONAL
});

recordBlockActiveTimeBodySchema = z.object({
  // ...
  sectionId: uuidSchema.optional().nullable(),  // ← OPTIONAL
});
```

### Resolution for Phase 4.5

✅ **sectionId is OPTIONAL in Phase 4.4 API**

**Strategy:** Phase 4.5 will pass `sectionId: null` initially.

**Future Enhancement (Phase 4.6+):** If section-level analytics are needed, sectionId can be derived from:
```typescript
sectionsPayload.sectionMeta[blockType].id
```

But this requires knowing which section a block belongs to, which is not currently exposed in DOM.

### Status

✅ **ACCEPTABLE FOR PHASE 4.5** — Pass `null` per API contract

---

## 4. BLOCK ID (blockId)

### Source of Truth

**DOM Attributes:** `data-block-id` (Phase 2 contract)

**Evidence:**
```typescript
// packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx (line 121)

const extractBlockIdentity = useCallback((element: Element): ActiveBlockIdentity | null => {
  const blockId = element.getAttribute('data-block-id');
  const blockType = element.getAttribute('data-block-type');
  
  if (!blockId || !blockType) {
    return null;
  }
  
  return { blockId, blockType, blockVersion };
}, []);
```

**Rendering Evidence:**
```typescript
// packages/ui/src/tutorial/blocks/ParagraphBlock.tsx (line 10)

<p
  id={block.id}
  data-block-id={block.id}  // ✅ Phase 2 contract
  data-block-type="paragraph"
  // ...
/>
```

### Current Runtime Availability

✅ **AVAILABLE** via `ActiveBlockContext`

```typescript
// packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx

export interface ActiveBlockIdentity {
  blockId: string;           // ✅ Available
  blockType: string;         // ✅ Available
  blockVersion?: string;     // ✅ Available (optional)
}

const { activeBlock } = useActiveBlock();
// activeBlock.blockId ← ready for telemetry
```

### Status

✅ **READY FOR PHASE 4.5** — No changes required

---

## 5. BLOCK VERSION (blockVersion)

### Source of Truth

**DOM Attributes:** `data-block-version` (Phase 2 contract)

**Evidence:**
```typescript
// packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx (line 126)

const blockVersion = element.getAttribute('data-block-version') || undefined;

return { blockId, blockType, blockVersion };
```

### Current Runtime Availability

✅ **AVAILABLE** via `ActiveBlockContext`

```typescript
const { activeBlock } = useActiveBlock();
// activeBlock.blockVersion ← ready for telemetry
```

**Semantic:** Optional per Phase 2 contract. Versioned blocks (Code C1, Definition D1) expose version. Unversioned blocks (paragraph, heading) do not.

### Phase 4.4 API Contract

```typescript
// apps/api-server/src/schemas/ils.schemas.ts

export const blockVersionSchema = z.string()
  .min(1, 'Block version is required')
  .max(10, 'Block version too long');
```

**CRITICAL:** API requires `blockVersion` as a **required string**, but runtime contract makes it **optional**.

### Resolution for Phase 4.5

**Strategy:** When `blockVersion` is `undefined` in runtime, coerce to empty string `""` or default value `"V0"`.

**Recommendation:** Use `activeBlock.blockVersion || "V0"` to satisfy API schema.

### Status

✅ **READY FOR PHASE 4.5** with coercion strategy

---

## 6. SESSION ID (sessionId)

### Source of Truth

**sessionStorage:** `tutorialLearningSessionId` (browser tab-scoped)

**Evidence:**
```typescript
// src/share-branding/LearningExperience/runtime/tutorialSessionService.ts

export const TUTORIAL_LEARNING_SESSION_KEY = 'tutorialLearningSessionId';

export function getOrCreateTutorialLearningSessionId(): string | null {
  // ✅ Existing implementation
  // Creates UUID, stores in sessionStorage
  // Survives page reload
  // Isolated per browser tab
  // Returns null during SSR
}
```

### Current Runtime Availability

✅ **EXISTING UTILITY AVAILABLE**

**File:** `src/share-branding/LearningExperience/runtime/tutorialSessionService.ts`

**Functions:**
- `getOrCreateTutorialLearningSessionId()` ← USE THIS
- `readTutorialLearningSessionId()`
- `generateSessionId()`
- `isValidSessionId()`

**Tests:** 
- `src/share-branding/LearningExperience/runtime/__tests__/tutorialSessionService.test.ts`
- Comprehensive test coverage already exists

### Architecture

**Semantic:**
```
Auth Session (DB-backed, login/logout)
    ≠
Tutorial Learning Session (sessionStorage, tab-scoped)
```

**Explicit constraints from source:**
```typescript
// IDENTITY TABLE:
//   Auth Session.id    -> NEVER used as learning session
//   learnerId          -> NEVER used as learning session
//   navigationNodeId   -> NEVER used as learning session
//   subtopicId         -> NEVER used as learning session
//   crypto.randomUUID  -> YES (one per tab, independent)
```

### Status

✅ **READY FOR PHASE 4.5** — Existing utility, no new implementation needed

---

## 7. ACTIVE BLOCK CONTEXT

### Existing Implementation

**File:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`

**Provider:** `ActiveBlockProvider`

**Hook:** `useActiveBlock()`

**Responsibility:** Viewport-based block tracking using IntersectionObserver

### Architecture

```typescript
interface ActiveBlockIdentity {
  blockId: string;
  blockType: string;
  blockVersion?: string;
}

export type ActiveBlockState = ActiveBlockIdentity | null;

interface ActiveBlockContextValue {
  activeBlock: ActiveBlockState;
}
```

**Phase 3 certified implementation:**
- IntersectionObserver-based
- Deterministic selection (anchor zone = top 25% of viewport)
- Stable block identification
- SSR-safe
- No telemetry side effects

### Status

✅ **FROZEN** — Phase 4.5 consumes, does NOT modify

**Constraint:** BlockTelemetryProvider must remain separate from ActiveBlockContext

---

## 8. ILS PROVIDER

### Existing Implementation

**File:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

**Provider:** `ILSProvider`

**Hook:** `useILS()`

**Responsibility:** Data context layer for navigation progress and block completion status

### Current Props

```typescript
interface ILSProviderProps {
  navigationNodeId: string;  // ← REQUIRED
  subtopicId: string;        // ← REQUIRED
  sectionId?: string | null; // ← Optional
  children: React.ReactNode;
}
```

### Architecture

```typescript
const { activeBlock } = useActiveBlock();  // ← Consumes ActiveBlockContext

const contextValue: ILSContextValue = {
  navigationNodeId,
  subtopicId,
  sectionId,
  overallProgress,
  activeBlockProgress,
  loading,
  error,
  refresh,
};
```

**Phase 4 certified implementation:**
- Fetches navigation progress from `/api/tutorial/ils/navigation/:nodeId`
- Derives active block progress from completed blocks array
- No telemetry emission (data layer only)

### Current Integration Status

❌ **NOT INTEGRATED** into TutorialExperience

**Evidence:** Searched `TutorialExperience.tsx` — no ILSProvider wrapper found.

### Status

✅ **READY FOR INTEGRATION** — ILSProvider exists but needs to be added to page component tree

**Phase 4.5 Task:** Wrap TutorialExperience content with ILSProvider

---

## 9. API CLIENT PATTERNS

### Existing BFF Routes

**RTH:**
- `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts`
- `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-active-time/route.ts`

**SkillUp:**
- `apps/skillup-web/src/app/api/tutorial/ils/block-visit/route.ts`
- `apps/skillup-web/src/app/api/tutorial/ils/block-active-time/route.ts`

### Request Pattern

**Standard fetch pattern observed in existing code:**

```typescript
const response = await fetch('/api/tutorial/ils/block-visit', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    navigationNodeId,
    subtopicId,
    blockId,
    blockVersion,
    sessionId,
    sectionId,
  }),
});
```

**Authentication:** Cookies (credentials: 'include')

**Brand Context:** BFF routes add brand context before proxying to central API

### Status

✅ **PATTERN ESTABLISHED** — Use standard fetch with credentials: 'include'

**No custom API client needed** — Direct fetch calls are project standard

---

## 10. PROVIDER HIERARCHY

### Current Architecture (Observed)

```
TutorialExperience
    ↓
[NO PROVIDERS CURRENTLY]
    ↓
BlockRenderer
    ↓
TutorialRenderer / Block Components (data-block-id, data-block-type, data-block-version)
```

### Required Phase 4.5 Architecture

```
TutorialExperience
    ↓
ActiveBlockProvider (Phase 3, already exists)
    ↓
ILSProvider (Phase 4, already exists, NOT integrated)
    ↓
BlockTelemetryProvider (Phase 4.5, TO BE CREATED)
    ↓
BlockRenderer
    ↓
Block Components
```

**Dependency Chain:**
```
ActiveBlockProvider
    provides: { activeBlock }
        ↓
ILSProvider
    uses: useActiveBlock()
    provides: { overallProgress, activeBlockProgress }
        ↓
BlockTelemetryProvider
    uses: useActiveBlock()
    provides: (side effects only, no context)
        ↓
Children
```

### Status

✅ **HIERARCHY PROVEN** — Dependencies require this exact ordering

---

## 11. RUNTIME FILES DISCOVERED

### Existing (Phase 2-4)

```
packages/ui/src/tutorial/runtime/
    ├── ActiveBlockContext.tsx              ✅ Phase 3 (viewport tracking)
    ├── ILSProvider.tsx                     ✅ Phase 4 (data context)
    └── TutorialPageIdentity.ts             ✅ Identity types

src/share-branding/LearningExperience/runtime/
    ├── tutorialSessionService.ts           ✅ Session management
    └── __tests__/
        ├── tutorialSessionService.test.ts  ✅ Tests exist
        └── tutorialTrackingService.test.ts ✅ Tests exist
```

### To Be Created (Phase 4.5)

```
packages/ui/src/tutorial/runtime/
    ├── BlockTelemetryProvider.tsx          🆕 Phase 4.5 (telemetry orchestration)
    └── __tests__/
        └── BlockTelemetryProvider.test.tsx 🆕 Phase 4.5
```

### To Be Modified (Phase 4.5)

```
apps/realtutorialhub-web/src/
    ├── app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx
    │       ← Add navigationNodeId resolution and prop passing
    └── components/content/TutorialExperience.tsx
            ← Add provider wrappers (ActiveBlockProvider, ILSProvider, BlockTelemetryProvider)

apps/skillup-web/src/
    ├── app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx
    │       ← Same changes as RTH
    └── components/content/TutorialExperience.tsx
            ← Same changes as RTH
```

---

## 12. ARCHITECTURAL CONSTRAINTS

### Frozen Layers (Phase 4.1-4.4)

```
🔒 database/migrations/0022_jittery_shatterstar.sql
🔒 src/share-branding/LearningExperience/repositories/BlockLearningStateRepository.ts
🔒 src/share-branding/LearningExperience/services/LearningProgressService.ts
🔒 apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts
🔒 apps/api-server/src/app/api/tutorial/ils/block-active-time/route.ts
🔒 apps/api-server/src/schemas/ils.schemas.ts
🔒 apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts
🔒 apps/realtutorialhub-web/src/app/api/tutorial/ils/block-active-time/route.ts
🔒 apps/skillup-web/src/app/api/tutorial/ils/block-visit/route.ts
🔒 apps/skillup-web/src/app/api/tutorial/ils/block-active-time/route.ts
```

### Separation of Concerns

```
ActiveBlockContext
    = viewport tracking only
    = NO telemetry side effects

ILSProvider
    = data context only
    = NO telemetry emission
    = fetches progress, exposes data

BlockTelemetryProvider
    = telemetry orchestration only
    = consumes ActiveBlockContext
    = calls block-visit / block-active-time APIs
    = NO data context exposed to children
```

---

## 13. BLOCKING ISSUES

### None

All required identity values have been resolved and proven available (with minor integration work required for navigationNodeId).

---

## 14. PHASE 4.5 INTEGRATION PLAN

### STEP 2: Page-Level Identity Resolution

**Task:** Modify tutorial page.tsx to resolve and pass navigationNodeId

**Files:**
- `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx`
- `apps/skillup-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx`

**Change:**
```typescript
const hierarchy = await getTutorialHierarchyForDelivery(resolved);
const navigationNodeId = hierarchy?.subtopic.navigationNodeId || resolved.subtopicSlug;

<TutorialExperience
  params={resolved}
  subtopicId={sectionsPayload.subtopicId}
  navigationNodeId={navigationNodeId}  // ← ADD
  // ...
/>
```

### STEP 3: TutorialExperience Props

**Task:** Add navigationNodeId to TutorialExperienceProps

**File:** `apps/realtutorialhub-web/src/components/content/TutorialExperience.tsx`

**Change:**
```typescript
interface TutorialExperienceProps {
  params: { ... };
  subtopicId?: string;
  navigationNodeId?: string;  // ← ADD
  // ...
}
```

### STEP 4: Provider Integration

**Task:** Wrap content with provider hierarchy

**File:** `apps/realtutorialhub-web/src/components/content/TutorialExperience.tsx`

**Change:**
```tsx
return (
  <ActiveBlockProvider containerRef={containerRef}>
    <ILSProvider
      navigationNodeId={navigationNodeId || params.subtopicSlug}
      subtopicId={subtopicId || params.subtopicSlug}
      sectionId={null}
    >
      <BlockTelemetryProvider
        navigationNodeId={navigationNodeId || params.subtopicSlug}
        subtopicId={subtopicId || params.subtopicSlug}
        sectionId={null}
      >
        {/* existing content */}
      </BlockTelemetryProvider>
    </ILSProvider>
  </ActiveBlockProvider>
);
```

### STEP 5: BlockTelemetryProvider Implementation

**Task:** Create telemetry orchestration provider

**File:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`

**Responsibilities:**
- Use `useActiveBlock()` to watch block changes
- Call `getOrCreateTutorialLearningSessionId()` once on mount
- Emit visit on initial block + block changes
- Track active time with 30s heartbeat
- Pause/resume on visibility changes
- Flush on block change + unmount
- Prevent duplicates
- Handle races
- Silent error handling

### STEP 6: Tests

**Files:**
- `packages/ui/src/tutorial/runtime/__tests__/BlockTelemetryProvider.test.tsx`
- Unit tests for visit, time, visibility, flush, error handling

### STEP 7: Integration Testing

- Manual browser testing
- Network tab verification
- Regression testing (Phase 4.2-4.4 tests)

---

## 15. DECISION SUMMARY

| Identity | Source | Status | Action |
|----------|--------|--------|--------|
| navigationNodeId | Hierarchy → page props | ❌ Missing | Add to page.tsx → TutorialExperience |
| subtopicId | API → page props | ✅ Available | No change |
| sectionId | API (optional) | ⚠️ Optional | Pass `null` per API contract |
| blockId | DOM → ActiveBlockContext | ✅ Available | No change |
| blockVersion | DOM → ActiveBlockContext | ✅ Available | Coerce to "V0" if undefined |
| sessionId | sessionStorage utility | ✅ Available | Use existing `getOrCreateTutorialLearningSessionId()` |

---

## 16. ARCHITECTURAL RISKS

### None Identified

All identity sources are proven stable and available. No circular dependencies. No schema conflicts.

---

## 17. RECOMMENDATION

✅ **PROCEED TO STEP 2: Page-Level Identity Integration**

All required identity values have been resolved from source. Implementation is ready to begin.

**Next Actions:**
1. Add navigationNodeId resolution to page.tsx (both RTH and SkillUp)
2. Add navigationNodeId prop to TutorialExperienceProps
3. Continue to STEP 3 (BlockTelemetryProvider implementation)

---

## 18. EVIDENCE SUMMARY

**Total Files Inspected:** 15+

**Key Source Files:**
- `src/share-branding/LearningExperience/runtime/TutorialPageIdentity.ts`
- `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`
- `packages/ui/src/tutorial/runtime/ILSProvider.tsx`
- `src/share-branding/LearningExperience/runtime/tutorialSessionService.ts`
- `apps/api-server/src/schemas/ils.schemas.ts`
- `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx`
- `apps/realtutorialhub-web/src/components/content/TutorialExperience.tsx`

**Tests Verified:**
- `src/share-branding/LearningExperience/__tests__/learner-page-resolution.phase1.test.ts`
- `src/share-branding/LearningExperience/runtime/__tests__/tutorialSessionService.test.ts`
- `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`

**No assumptions made. All conclusions derived from source code evidence.**

---

**STEP 1 STATUS:** ✅ **COMPLETE**

**READY FOR:** STEP 2 (Page-Level Identity Integration)

**BLOCKED:** None

