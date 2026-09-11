# MACRO 4 RSSB — Step 4-6 Exit Check (Before Coding)

**Status:** READY FOR REVIEW  
**Created:** 2026-09-11  
**Purpose:** Final verification before Step 7 implementation begins

---

## A. Exact Production ILS Field Mapping

| Prototype Field | Actual `useILS()` Field | Exact TypeScript Type | Source |
|-----------------|------------------------|----------------------|--------|
| **Overall Progress (Page-Level)** |  |  |  |
| Overall % | `overallProgress.progressPercentage` | `number` (0-100) | ILSOverallProgress |
| Status Badge | `overallProgress.status` | `LearningState` ("not-started" \| "in-progress" \| "completed") | ILSOverallProgress |
| Completed Blocks | `overallProgress.completedBlockCount` | `number` | ILSOverallProgress |
| Total Blocks | `overallProgress.totalBlockCount` | `number` | ILSOverallProgress |
| Page Visits | `overallProgress.visitCount` | `number` | ILSOverallProgress |
| Page Revisions | `overallProgress.revisionCount` | `number` | ILSOverallProgress |
| Page Active Time | `overallProgress.timeSpentActiveSec` | `number` | ILSOverallProgress |
| Page First Viewed | `overallProgress.firstViewedAt` | `Date \| null` | ILSOverallProgress |
| Page Last Viewed | `overallProgress.lastViewedAt` | `Date \| null` | ILSOverallProgress |
| Page Completed At | `overallProgress.completedAt` | `Date \| null` | ILSOverallProgress |
| **Active Block Progress** |  |  |  |
| Block ID | `activeBlockProgress.blockId` | `string` | ILSActiveBlockProgress |
| Block Version | `activeBlockProgress.blockVersion` | `string` | ILSActiveBlockProgress |
| Block Visits | `activeBlockProgress.visitCount` | `number` | ILSActiveBlockProgress |
| Block Revisions | `activeBlockProgress.revisionCount` | `number` | ILSActiveBlockProgress |
| Block Active Time | `activeBlockProgress.activeTimeSec` | `number` | ILSActiveBlockProgress |
| Block Expected Time | `activeBlockProgress.expectedTimeSec` | `number \| null` ⚠️ | ILSActiveBlockProgress |
| Block First Viewed | `activeBlockProgress.firstViewedAt` | `string \| null` | ILSActiveBlockProgress |
| Block Last Viewed | `activeBlockProgress.lastViewedAt` | `string \| null` | ILSActiveBlockProgress |
| Block Completed At | `activeBlockProgress.completedAt` | `string \| null` | ILSActiveBlockProgress |
| Block Is Completed | `activeBlockProgress.isCompleted` | `boolean` | ILSActiveBlockProgress |
| **Unavailable (Not in Schema)** |  |  |  |
| Attempts | N/A | Display `"—"` | NOT AVAILABLE |
| Score | N/A | Display `"—"` | NOT AVAILABLE |

**⚠️ CRITICAL NULLABILITY:**
- `overallProgress` can be `null` (no page progress yet)
- `activeBlockProgress` can be `null` (no active block)
- `expectedTimeSec` can be `null` (expected time not set)
- All timestamp fields can be `null`

**Verified Source:**
- `packages/ui/src/tutorial/runtime/ILSProvider.tsx` Lines 53-92
- `docs/phases/PHASE-5-RSSB-GATE-1-FINAL-AUDIT.md` Lines 535-630

---

## B. Exact Visual Token Mapping

| Prototype CSS | Production Implementation | Notes |
|---------------|--------------------------|-------|
| **Colors** |  |  |
| Overall Progress bg: `#f54a8d` | `brand.primaryColor` | **BRAND-SPECIFIC** (RTH: #d03f00, SkillUp: #f54a8d) |
| Lifecycle bg: `#f54a8d` | `brand.secondaryColor` | **BRAND-SPECIFIC** (RTH: #124fd6, SkillUp: #133382) |
| Engagement bg: `#ff7300` | `#ff7300` | **FIXED** (NOT brand color) |
| Time Analysis bg: `#0091d5` | `#0091d5` | **FIXED** (NOT brand color) |
| Completed text: `#5cf0b0` | `#5cf0b0` | **FIXED** |
| White text: `#ffffff` | `#ffffff` | **FIXED** |
| **Typography** |  |  |
| Font family | `Inter, -apple-system, ...` | Use Tailwind `font-sans` (already configured) |
| Sidebar title: 20px/700 | `text-[20px] font-bold` | Exact match |
| Group title: 16px/700 | `text-[16px] font-bold` | Exact match |
| Card label: 11px/700/uppercase | `text-[11px] font-bold uppercase tracking-wider` | Exact match |
| Card value (2x2): 22px/800 | `text-[22px] font-extrabold` | Exact match |
| Overall %: 34px/800 | `text-[34px] font-extrabold` | Exact match |
| Table header: 12px/700/uppercase | `text-[12px] font-bold uppercase tracking-wider` | Exact match |
| Table cell: 14px/600 | `text-[14px] font-semibold` | Exact match |
| **Spacing** |  |  |
| Sidebar width | `440px` | `w-[440px]` |
| Card border radius | `14px` | `rounded-[14px]` |
| Overall card radius | `18px` | `rounded-[18px]` |
| Card padding | `16px` | `p-4` |
| Overall card padding | `20px` | `p-5` |
| Section gap | `24px` | `gap-6` |
| 2x2 grid gap | `12px` | `gap-3` |
| Card height (2x2) | `90px` | `h-[90px]` |
| **Shadows** |  |  |
| Orange card | `0 8px 20px rgba(255,115,0,0.25)` | Custom (NO Tailwind approx) |
| Orange card hover | `0 12px 24px rgba(255,115,0,0.35)` | Custom (NO Tailwind approx) |
| Blue card | `0 8px 20px rgba(0,145,213,0.25)` | Custom (NO Tailwind approx) |
| Blue card hover | `0 12px 24px rgba(0,145,213,0.35)` | Custom (NO Tailwind approx) |
| Overall card | `0 10px 25px rgba(245,74,141,0.25)` | Custom (NO Tailwind approx) |
| Overall card hover | `0 14px 30px rgba(245,74,141,0.35)` | Custom (NO Tailwind approx) |
| Table shadow | `0 10px 25px rgba(0,0,0,0.12)` | Custom (NO Tailwind approx) |
| Table shadow hover | `0 14px 30px rgba(0,0,0,0.18)` | Custom (NO Tailwind approx) |
| **Transforms** |  |  |
| Card base | `translateY(-2px)` | `translate-y-[-2px]` |
| Card hover | `translateY(-5px)` | `hover:translate-y-[-5px]` |
| Table hover | `translateY(-7px)` | `hover:translate-y-[-7px]` |
| Transition | `0.2s ease` | `transition-all duration-200 ease-in-out` |

**⚠️ CRITICAL: NO APPROXIMATE TAILWIND TOKENS**
- DO NOT use `shadow-lg` instead of exact rgba shadows
- DO NOT use `font-bold` instead of `font-extrabold` where prototype specifies 800
- DO NOT use `gap-6` instead of `gap-[24px]` if 24px ≠ 1.5rem
- Exact prototype values win over Tailwind conveniences

---

## C. Color Ownership

### Prototype-Fixed Visual Tokens
**Source:** `ILS_UI_UX/style.css` (hardcoded literals)

- Engagement section: `#ff7300` (orange) — **LOCKED**
- Time Analysis section: `#0091d5` (blue) — **LOCKED**
- Completed text: `#5cf0b0` (green) — **LOCKED**
- White text: `#ffffff` — **LOCKED**
- Gray borders: `#edf2f7`, `#cbd5e1`, `#d9e0ea` — **LOCKED**

**Implementation:** Use exact hex values. DO NOT substitute brand colors.

### Production Brand Tokens
**Source:** `src/share-branding/brandConfig.ts` via `useBrand()` hook

```typescript
const brand = useBrand();

// RTH Brand
{
  primaryColor: '#d03f00',      // Orange
  primaryColorDark: '#b63600',
  secondaryColor: '#124fd6',    // Blue
}

// SkillUp Brand
{
  primaryColor: '#f54a8d',      // Pink
  primaryColorDark: '#d63d7a',
  secondaryColor: '#133382',    // Dark Blue
}
```

**Mapping (from `docs/phases/PHASE-5-RSSB-GATE-1-FINAL-AUDIT.md`):**
- Overall Progress card background → `brand.primaryColor`
- Lifecycle table background → `brand.secondaryColor`

**Implementation:**
```tsx
// Overall Progress Card
<div style={{ backgroundColor: brand.primaryColor }}>

// Lifecycle Table
<table style={{ backgroundColor: brand.secondaryColor }}>

// Engagement Metrics (FIXED)
<div style={{ backgroundColor: '#ff7300' }}>

// Time Analysis (FIXED)
<div style={{ backgroundColor: '#0091d5' }}>
```

**DO NOT:**
- Replace `#ff7300` or `#0091d5` with brand colors
- Create RSSBThemeProvider or RSSBBrandConfig
- Use `payload.theme` (that's for Tutorial content, NOT RSSB)

---

## D. Component Hierarchy

```
LearningProgressSidebar (root)
├─ useBrand() (brand context)
├─ useILS() (ILS context)
├─ Overlay (backdrop, onClick → close)
└─ Panel (fixed right, 440px, slide animation)
   ├─ Header
   │  ├─ Title ("Learning Progress")
   │  └─ Close Button
   └─ Scroll Content (flex col, gap-6)
      ├─ OverallProgressCard (brand.primaryColor bg)
      │  ├─ Status Badge (from overallProgress.status)
      │  ├─ Percentage (progressPercentage)
      │  ├─ Progress Bar (progressPercentage width)
      │  └─ 4-Column Summary Grid
      │     ├─ SEEN (visitCount)
      │     ├─ TIME (formatSeconds(timeSpentActiveSec))
      │     ├─ REVISED (revisionCount)
      │     └─ DONE (completedBlockCount/totalBlockCount)
      ├─ LifecycleMetrics (brand.secondaryColor bg)
      │  └─ Table (3 rows)
      │     ├─ First Viewed | formatDate(firstViewedAt)
      │     ├─ Last Viewed | formatDate(lastViewedAt)
      │     └─ Completed At | formatDate(completedAt) OR "—" (green if completed)
      ├─ EngagementMetrics (#ff7300 bg - FIXED)
      │  └─ 2x2 Grid
      │     ├─ VISITS (visitCount)
      │     ├─ REVISIONS (revisionCount)
      │     ├─ ATTEMPTS ("—" unavailable)
      │     └─ SCORE ("—" unavailable)
      └─ TimeAnalysisMetrics (#0091d5 bg - FIXED)
         └─ 2x2 Grid
            ├─ ACTIVE TIME (formatSeconds(activeTimeSec))
            ├─ EXPECTED (formatSeconds(expectedTimeSec) OR "—" if null)
            ├─ PACE ((activeTimeSec/expectedTimeSec)*100 OR "—" if null)
            └─ STATUS ("On Track" literal text - NOT computed)
```

**Component Count:** Implementation proposal, NOT architectural requirement. Preserve meaningful boundaries.

---

## E. Trigger Location

**PENDING INSPECTION:** Must inspect existing Tutorial Page chrome before deciding.

**Action:** Read `src/share-branding/LearningExperience/components/TutorialPageChrome.tsx` or equivalent to find existing learner-facing control surface.

**Decision Rule:**
- ✅ If `TutorialHeader` owns learner controls → add trigger there
- ✅ If no existing chrome → add to `TutorialPageShell` with matching design
- ❌ DO NOT introduce floating `fixed top-6 right-6` button without verification

**Pending:** Inspect `TutorialHeader.tsx` structure before implementation.

---

## F. Files to Be Created/Modified

### Files to Create

```
packages/ui/src/tutorial/runtime/LearningProgressSidebar/
├─ index.tsx                       (exports)
├─ LearningProgressSidebar.tsx     (root container, overlay, panel, header)
├─ OverallProgressCard.tsx         (brand.primaryColor card)
├─ LifecycleMetrics.tsx            (brand.secondaryColor table)
├─ EngagementMetrics.tsx           (orange #ff7300 2x2 grid)
├─ TimeAnalysisMetrics.tsx         (blue #0091d5 2x2 grid)
└─ utils.ts                        (formatSeconds, formatDate)
```

### Files to Modify

**Option A:** If trigger goes in TutorialHeader
```
src/share-branding/LearningExperience/components/TutorialHeader.tsx
```

**Option B:** If trigger goes in TutorialPageShell
```
src/share-branding/LearningExperience/components/TutorialPageShell.tsx
```

**Import in modified file:**
```typescript
import { LearningProgressSidebar } from '@quiz/ui';
```

### Files to Create (Tests)

```
packages/ui/src/tutorial/runtime/LearningProgressSidebar/
├─ __tests__/
│  ├─ LearningProgressSidebar.test.tsx
│  ├─ OverallProgressCard.test.tsx
│  ├─ LifecycleMetrics.test.tsx
│  ├─ EngagementMetrics.test.tsx
│  ├─ TimeAnalysisMetrics.test.tsx
│  └─ utils.test.ts
```

---

## G. Pending Verifications Before Coding

1. ✅ ILS contract verified (ILSProvider.tsx read)
2. ✅ Brand architecture verified (useBrand() from brandConfig.ts)
3. ✅ Color mapping established (PHASE-5-RSSB-GATE-1-FINAL-AUDIT.md)
4. ⚠️ **PENDING:** Inspect prototype null-state behavior (`activeBlockProgress === null`)
5. ⚠️ **PENDING:** Inspect TutorialHeader.tsx for trigger button location
6. ⚠️ **PENDING:** Verify z-index conflicts with existing Tutorial Page elements

---

## H. Hard Constraints (Final Verification)

- [x] `useILS()` is RSSB data boundary
- [x] No backend changes
- [x] No API changes
- [x] No DB changes
- [x] No telemetry changes
- [x] No ILSProvider redesign (unless verified defect)
- [x] No R/Y/G logic
- [x] No new thresholds
- [x] No invented Attempts value
- [x] No invented Score value
- [x] Attempts = `"—"`
- [x] Score = `"—"`
- [x] No D1/C1 branching
- [x] `blockId + blockVersion` identity (automatic via ActiveBlockContext)
- [x] Automatic active-block behavior (via useActiveBlock())
- [x] Exact prototype visual translation (100% parity)
- [x] Overall Progress → `brand.primaryColor`
- [x] Lifecycle → `brand.secondaryColor`
- [x] Engagement → `#ff7300` FIXED
- [x] Time Analysis → `#0091d5` FIXED
- [x] PACE is raw calculation only (no classification)
- [x] "On Track" is literal text (not computed judgment)
- [x] `expectedTimeSec` nullability handled explicitly

---

## I. Exit Criteria

Before proceeding to Step 7, confirm:

1. ✅ All three artifacts corrected and reviewed
2. ✅ Real ILS contract documented (not invented `ILSData`)
3. ✅ Brand architecture mapped (useBrand() + primaryColor/secondaryColor)
4. ✅ Color ownership clarified (brand vs fixed)
5. ✅ Component hierarchy finalized
6. ⚠️ Prototype null-state behavior verified (or marked for minimal fallback)
7. ⚠️ Trigger location determined (TutorialHeader inspection)
8. ✅ Files to create/modify listed
9. ✅ Hard constraints re-verified

**Status:** Ready for Step 7 authorization after items 6-7 resolved.

---

## J. Step 7 Authorization

Once user approves this exit check, proceed directly to implementation:

**Steps 7-17:**
1. Inspect TutorialHeader.tsx for trigger location
2. Verify prototype null-state behavior
3. Create RSSB component files
4. Implement components with exact visual tokens
5. Write tests
6. TypeScript compile + test verification
7. Browser/runtime verification
8. Visual parity verification (side-by-side with prototype)
9. Final evidence report

**DO NOT:**
- Create another audit or ADR
- Wait for arbitrary implementation choices
- Invent null-state design
- Substitute approximate Tailwind tokens
- Replace fixed colors with brand colors

**Awaiting user approval to proceed with Step 7.**
