# RSSB UI/UX Precision Reconciliation Report (Docked Architecture & Refined Spacing)

**Date:** 2026-09-12  
**Authority Reference:** `ILS_UI_UX/index.html` + `ILS_UI_UX/style.css` + `ILS_UI_UX/script.js` + User Image References  
**Scope:** Right-Side Sidebar ("Your Progress" RSSB panel) UI/UX reconciliation  
**Status:** COMPLETED & VERIFIED ✅  

---

## 1. Key Architectural & Layout Resolutions

### A. Independent Internal Scroll with Invisible Scrollbar
- **Problem:** The RSSB panel was expanding the whole page height and triggering the browser's window scrollbar.
- **Resolution:**
  - Added `max-h-[calc(100dvh-71px)]` and `overflow-hidden` on the `<aside>` container to bound it strictly to the viewport.
  - Added `min-h-0 flex-1 overflow-y-auto overscroll-contain` on the internal content container (`.tutorial-rssb-scroll`).
  - Added cross-browser invisible scrollbar styling (`-ms-overflow-style: none; scrollbar-width: none; ::-webkit-scrollbar: display: none;`) matching the pattern used in LSNB (`TutorialLeftSidebar.tsx`).
  - Result: RSSB now scrolls exclusively on its own internal container with an invisible scrollbar, leaving the browser scrollbar untouched.

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
  - **Heading-to-Card Spacing:** Increased from `gap-3` (12px) to `gap-4` (16px) across `Lifecycle & Overview`, `Engagement Metrics`, and `◷ Time Analysis`.
  - **Resting Transforms:** Changed card and table resting `transform` from negative offsets (`translateY(-4px)` / `translateY(-2px)`) to `none`, reserving subtle elevation (`translateY(-3px)`) exclusively for hover states.

---

## 2. File Change Inventory

| File | Changes Made |
|---|---|
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx` | • Removed `✕` close button<br>• Added `min-h-0` and `max-h-[calc(100dvh-71px)]`<br>• Added `.tutorial-rssb-scroll` with hidden scrollbar styles<br>• Increased section gap to `gap-[32px]` and added `pb-[48px]` |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LifecycleMetrics.tsx` | • Increased heading gap to `gap-4`<br>• Resting transform set to `none`<br>• Pink table color (`brand.primaryColor \|\| '#f54a8d'`)<br>• 4 rows with Status in `#5cf0b0` green |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/EngagementMetrics.tsx` | • Increased heading gap to `gap-4`<br>• Resting transform set to `none`<br>• Fixed 90px height cards |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/TimeAnalysisMetrics.tsx` | • Increased heading gap to `gap-4`<br>• Resting transform set to `none`<br>• Fixed 90px height cards<br>• Formatted `VS EXPECTED` with decimals when non-integer |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/OverallProgressCard.tsx` | • Resting transform set to `none`<br>• Subtext: `X of Y blocks completed`<br>• Summary grid: `COMPLETED`, `TOTAL`, `REQUIRED`, `ACTIVE` |
| `packages/ui/src/tutorial/runtime/LearningProgressSidebar/__tests__/LearningProgressSidebar.test.tsx` | • Removed obsolete `✕` button test<br>• Retained title and docked width transition tests |

---

## 3. Validation

- TypeScript check (`pnpm --filter @quiz/ui type-check`): **Passed with 0 errors**.
