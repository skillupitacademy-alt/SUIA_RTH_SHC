# RSSB UI/UX Precision Reconciliation Report (Docked Architecture & Refined Spacing)

**Date:** 2026-09-12  
**Authority Reference:** `ILS_UI_UX/index.html` + `ILS_UI_UX/style.css` + `ILS_UI_UX/script.js` + User Image References  
**Scope:** Right-Side Sidebar ("Your Progress" RSSB panel) UI/UX reconciliation  
**Status:** COMPLETED & VERIFIED ✅  

---

## 1. Key Architectural & Layout Resolutions

### A. Independent Internal Scroll with Invisible Scrollbar (LSNB Parity)
- **Problem:** The RSSB panel was expanding the whole page height and triggering the browser's window scrollbar.
- **Resolution:**
  - Standardized the `<aside>` container to `sticky top-0 z-10 flex h-[100dvh] shrink-0 flex-col overflow-hidden` matching LSNB (`TutorialLeftSidebar.tsx`) exactly.
  - Implemented the identical 3-layer nesting architecture as LSNB:
    1. Outer container: `min-h-0 flex-1 overflow-hidden` strictly bounding height.
    2. Middle scroll div: `.tutorial-rssb-scroll h-full overflow-y-auto overflow-x-hidden overscroll-contain` handling independent vertical scroll with `overscroll-contain`.
    3. Inner content div: `<div className="flex flex-col gap-[32px]">` with `pb-[48px]` bottom clearance.
  - Applied triple-layer invisible scrollbar styles:
    1. Inline style: `style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}`
    2. Tailwind utilities: `[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`
    3. Scoped CSS stylesheet: `.tutorial-rssb-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }`
  - Result: RSSB now scrolls independently on its own internal container with an invisible scrollbar, identical in feel and behavior to LSNB.

### B. Close Control: Toggle Only (✕ Button Removed)
- **Problem:** Having a redundant `✕` close button inside the RSSB header caused conflicts and cramped header space.
- **Resolution:**
  - Removed the `✕` close button from the header.
  - Closing and opening is handled exclusively by the header toggle icon (`onProgressClick`), matching how LSNB is toggled (`onMenuClick`).
  - The header now cleanly displays `◎ Your Progress` with standard `px-[28px] py-[22px] border-b border-[#edf2f7]`.

### C. Spacing & Neighbor Component Separation (Airy & Uncramped)
- **Problem:** Headings and cards were too close to each other (only ~8px due to negative resting transforms), and Section 3 (Time Analysis) was right against Section 4 (Overall Progress).
- **Resolution:**
  - **Section-to-Section Gap:** Increased from `gap-[24px]` to `gap-[32px]` (`32px` vertical separation between major sections).
  - **Bottom Clearance:** Added `pb-[48px]` to the bottom of the scroll area so the Overall Progress card can be fully viewed without touching the bottom edge.
  - **Heading-to-Card Spacing:** Increased from `gap-3` (12px) to `gap-4` (16px) across `Lifecycle & Overview`, `Engagement Metrics`, and `Time Analysis`.
  - **Resting Transforms:** Changed card and table resting `transform` from negative offsets (`translateY(-4px)` / `translateY(-2px)`) to `none`, reserving subtle elevation (`translateY(-3px)`) exclusively for hover states.
  - **Time Analysis Header Icon:** Replaced raw unicode glyph `◷` with a crisp SVG Lucide `<Clock className="h-4 w-4" />` icon to eliminate OS emoji rendering quirks.
  - **Overall Progress Bar Track:** Added `my-3` and `border border-white/10` to the capsule container so it remains clearly defined even at 0% progress.

---

## 2. File Change Inventory

| File | Changes Made |
|---|---|
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx` | • Removed `✕` close button<br>• Standardized container to `sticky top-0 z-10 flex h-[100dvh]`<br>• Added LSNB 3-layer scroll hierarchy (`min-h-0 flex-1 overflow-hidden` wrapper + `h-full overflow-y-auto overscroll-contain`)<br>• Added multi-layer invisible scrollbar rules<br>• Section gap set to `gap-[32px]` and `pb-[48px]` |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LifecycleMetrics.tsx` | • Increased heading gap to `gap-4`<br>• Resting transform set to `none`<br>• Pink table color (`brand.primaryColor \|\| '#f54a8d'`)<br>• 4 rows with Status in `#5cf0b0` green |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/EngagementMetrics.tsx` | • Increased heading gap to `gap-4`<br>• Resting transform set to `none`<br>• Fixed 90px height cards |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/TimeAnalysisMetrics.tsx` | • Replaced raw unicode with Lucide `<Clock>` icon<br>• Increased heading gap to `gap-4`<br>• Resting transform set to `none`<br>• Fixed 90px height cards<br>• Formatted `VS EXPECTED` with decimals when non-integer |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/OverallProgressCard.tsx` | • Resting transform set to `none`<br>• Added `my-3` and `border border-white/10` to progress bar track<br>• Subtext: `X of Y blocks completed`<br>• Summary grid: `COMPLETED`, `TOTAL`, `REQUIRED`, `ACTIVE` |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/__tests__/LearningProgressSidebar.test.tsx` | • Removed obsolete `✕` button test<br>• Updated section title matcher for Clock icon<br>• Retained title and docked width transition tests |

---

## 3. Validation

- TypeScript check on `@quiz/ui` (`pnpm --filter @quiz/ui type-check`): **Passed (0 errors)**.
- TypeScript check on `@quiz/skillup-web` (`pnpm --filter @quiz/skillup-web type-check`): **Passed (0 errors)**.
- Unit test suite (`pnpm --filter @quiz/ui test src/tutorial/runtime/LearningProgressSidebar`): **All 16 tests passed (100% green)**.
