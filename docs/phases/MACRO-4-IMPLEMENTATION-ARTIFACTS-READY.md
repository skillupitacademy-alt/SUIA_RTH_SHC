# MACRO 4 RSSB — Implementation Artifacts Ready for Review

**Status:** CORRECTED - AWAITING USER REVIEW  
**Created:** 2026-09-11  
**Updated:** 2026-09-11 (Corrections Applied per User Feedback)  
**Phase:** Steps 4-6 Complete (Mapping Before Code)

---

## What Was Created

Three design artifacts have been created to verify Kiro understood the HTML/CSS visual contract before translating to React:

### ✅ Artifact 1: Prototype→React Mapping
**File:** `docs/phases/MACRO-4-ARTIFACT-1-PROTOTYPE-REACT-MAPPING.md`

**Contains:**
- Complete table mapping every HTML element to React component
- Data source for each element (useILS() fields)
- CSS/Tailwind token for each element
- Format helper functions (formatSeconds, formatDate)
- Component boundaries (5 components + 2 utilities)

**Key Findings:**
- 4 sections: Overall Progress (pink card), Lifecycle (pink table), Engagement (orange 2x2), Time Analysis (blue 2x2)
- All data sourced from `useILS()` hook
- Attempts/Score display "—" (unavailable)
- Format helpers preserve exact prototype logic

---

### ✅ Artifact 2: Fixed vs Brand-Specific Tokens (CORRECTED)
**File:** `docs/phases/MACRO-4-ARTIFACT-2-FIXED-VS-BRAND-TOKENS.md`

**Contains:**
- Complete catalog of visual tokens from `ILS_UI_UX/style.css`
- **CORRECTED:** Classification as "prototype-defined fixed visual tokens" vs production brand tokens
- **ADDED:** Established architectural decision from `PHASE-5-RSSB-GATE-1-FINAL-AUDIT.md`
- **ADDED:** Real `useBrand()` hook and `BrandConfig` interface from production
- Tailwind CSS mappings for all tokens

**Key Findings (CORRECTED):**
- **Overall Progress** uses `brand.primaryColor` (RTH: #d03f00, SkillUp: #f54a8d)
- **Lifecycle** uses `brand.secondaryColor` (RTH: #124fd6, SkillUp: #133382)
- **Engagement** uses `#ff7300` **FIXED** (NOT brand color)
- **Time Analysis** uses `#0091d5` **FIXED** (NOT brand color)
- Inter font, uppercase labels, specific font weights (all fixed)
- Card shadows, transforms, transitions (all fixed)

**Evidence:**
1. ✅ `docs/phases/PHASE-5-RSSB-GATE-1-FINAL-AUDIT.md` establishes color mapping
2. ✅ `src/share-branding/brandConfig.ts` defines BrandConfig with primaryColor/secondaryColor
3. ✅ Existing production uses `useBrand()` hook throughout Tutorial pages
4. ✅ Prototype `#ff7300`/`#0091d5` preserved as fixed visual hierarchy colors

---

### ✅ Artifact 3: Component Hierarchy (CORRECTED)
**File:** `docs/phases/MACRO-4-ARTIFACT-3-COMPONENT-HIERARCHY.md`

**Contains:**
- Component tree (visual hierarchy)
- **CORRECTED:** Real production `useILS()` return type (ILSContextValue)
- **CORRECTED:** Real production interfaces (ILSOverallProgress, ILSActiveBlockProgress)
- **REMOVED:** Invented `ILSData` abstraction
- **ADDED:** Exact field names (completedBlockCount, totalBlockCount, timeSpentActiveSec)
- **ADDED:** Nullability warnings (expectedTimeSec: number | null)
- **ADDED:** Brand integration (useBrand() hook, BrandConfig type)
- File structure (location: `packages/ui/src/tutorial/runtime/`)
- Component props (TypeScript interfaces with real ILS types)
- Utility functions (formatSeconds, formatDate with Date | string handling)
- Integration points (trigger button requires chrome inspection)
- Conditional rendering logic (null state requires prototype verification)
- Accessibility (ARIA, keyboard, screen readers)

**Key Corrections:**
1. ✅ Uses actual `overallProgress.completedBlockCount` (NOT invented `completedBlocks`)
2. ✅ Uses actual `overallProgress.totalBlockCount` (NOT invented `totalBlocks`)
3. ✅ Uses actual `overallProgress.timeSpentActiveSec` (NOT invented `totalActiveTime`)
4. ✅ Handles `expectedTimeSec: number | null` explicitly
5. ✅ PACE is raw calculation only (no R/Y/G, thresholds, classifications)
6. ✅ "On Track" is prototype literal text (NOT computed judgment)
7. ✅ Null state requires prototype verification (DO NOT invent design)
8. ✅ Trigger button requires chrome inspection (DO NOT add floating button)

---

### ✅ NEW: Step 4-6 Exit Check
**File:** `docs/phases/MACRO-4-STEP-4-6-EXIT-CHECK.md`

**Contains:**
- **A. Exact Production ILS Field Mapping** — Comprehensive table mapping every prototype field to actual useILS() fields with exact TypeScript types
- **B. Exact Visual Token Mapping** — Prototype CSS → Production implementation with NO approximate Tailwind tokens
- **C. Color Ownership** — Clear distinction between prototype-fixed and production brand tokens
- **D. Component Hierarchy** — Final React tree with real ILS types
- **E. Trigger Location** — Pending inspection of TutorialHeader chrome
- **F. Files to Be Created/Modified** — Complete list before coding
- **G. Pending Verifications** — Null-state behavior, trigger location, z-index conflicts
- **H. Hard Constraints** — Final verification checklist
- **I. Exit Criteria** — Checklist before Step 7 authorization
- **J. Step 7 Authorization** — Steps 7-17 roadmap

**This document provides the final verification checkpoint before any code is written.**

---

## What This Verification Accomplishes

### ✅ Design Freeze
All visual decisions are now documented and frozen:
- Typography: Inter font, sizes (11px-34px), weights (700-800), uppercase
- Colors: Pink #f54a8d, Orange #ff7300, Blue #0091d5, Green #5cf0b0
- Spacing: 440px width, 24px gaps, 16px-20px padding
- Shadows: Specific rgba values with hover states
- Animations: translateY transforms, 0.2s transitions

### ✅ Data Contract (CORRECTED)
All data sources mapped to **actual production ILS types**:
- `useILS()` returns `ILSContextValue` (verified in ILSProvider.tsx)
- `overallProgress: ILSOverallProgress | null` for page-level metrics
- `activeBlockProgress: ILSActiveBlockProgress | null` for block-level metrics
- Real field names: `completedBlockCount`, `totalBlockCount`, `timeSpentActiveSec`
- Nullability handled: `expectedTimeSec: number | null`
- **NO invented `ILSData` abstraction**

### ✅ Component Boundaries
5 components + 2 utilities:
1. `LearningProgressSidebar` (root container + overlay)
2. `OverallProgressCard` (pink card with 4 summary metrics)
3. `LifecycleMetrics` (pink table: First/Last/Completed)
4. `EngagementMetrics` (orange 2x2: Visit/Revision/—/—)
5. `TimeAnalysisMetrics` (blue 2x2: Active/Expected/Pace/Status)
6. `formatSeconds()` (utility)
7. `formatDate()` (utility)

### ✅ No Invented Logic
- Attempts/Score: "—" (not invented values)
- Status: "On Track" (hardcoded, not calculated)
- No R/Y/G, thresholds, struggling classification
- No block-type branching (if/else for D1/C1)

---

## Questions for User Review

### 1. Mapping Accuracy (Artifact 1)
- Does the HTML→React mapping correctly capture the prototype structure?
- Are the component boundaries appropriate (5 components + 2 utilities)?
- Is the data source contract (useILS()) accurate?
- Any missing elements or incorrect mappings?

### 2. Token Classification (Artifact 2)
- **Confirm:** RSSB uses fixed colors (pink/orange/blue), NOT `payload.theme`?
- Any brand-specific tokens I missed?
- Are the Tailwind CSS mappings correct?
- Should any fixed tokens actually be brand-specific?

### 3. Component Hierarchy (Artifact 3)
- Is the component tree structure correct?
- **Decide:** Should RSSB be in `packages/ui/` or `src/share-branding/`?
- **Decide:** Where should toggle button be placed (TutorialPageShell or TutorialHeader)?
- **Decide:** Local state or context-based?
- Are the null state behaviors correct?

---

## Next Steps After Approval

Once you approve these three artifacts, I will proceed with Steps 7-17:

### Implementation (Steps 7-12)
7. Create RSSB component files
8. Implement OverallProgressCard
9. Implement LifecycleMetrics
10. Implement EngagementMetrics
11. Implement TimeAnalysisMetrics
12. Implement LearningProgressSidebar (root + overlay)

### Testing (Steps 13-14)
13. Write component tests
14. TypeScript compile + test verification

### Verification (Steps 15-17)
15. Browser/runtime verification with actual Tutorial Page
16. Prototype parity verification (side-by-side comparison)
17. Final report (files changed, test results, runtime evidence)

---

## Hard Constraints (Reminder)

**From User:**
- No backend/API/database changes
- No ILSProvider.tsx changes (unless verified defect)
- No block-type branching (if/else for D1/C1)
- No R/Y/G, thresholds, struggling classification
- Attempts/Score = "—" (unavailable, not invented)
- 100% visual parity with prototype
- useILS() only boundary

**Frozen Design:**
- All typography, colors, spacing, shadows from prototype
- Fixed colors (NOT brand-specific)
- Inter font
- Exact format helper logic from script.js

---

## User Action Required

**Please review the three artifact files:**
1. `docs/phases/MACRO-4-ARTIFACT-1-PROTOTYPE-REACT-MAPPING.md`
2. `docs/phases/MACRO-4-ARTIFACT-2-FIXED-VS-BRAND-TOKENS.md`
3. `docs/phases/MACRO-4-ARTIFACT-3-COMPONENT-HIERARCHY.md`

**Provide feedback on:**
- Mapping accuracy
- Token classification (especially fixed vs brand)
- Component hierarchy
- Decisions needed (location, toggle button, state)

**Once approved, I will begin implementation (no further audits or ADRs).**
