# RSSB UI/UX Precision Reconciliation Report (3-Column Docked Layout)

**Date:** 2026-09-12  
**Authority Reference:** `ILS_UI_UX/index.html` + `ILS_UI_UX/style.css` + `ILS_UI_UX/script.js` + User Image 2 Target  
**Scope:** Right-Side Sidebar ("Your Progress" RSSB panel) visual reconciliation to 3-column docked architecture  
**Status:** COMPLETED ✅  

---

## 1. Architectural Conversion: Fixed Overlay → 3-Column Docked Panel

| Feature | Previous State (Defective) | Reconciled State (Docked like LSNB) |
|---|---|---|
| **Layout Type** | `fixed right-0 top-0 z-[101]` overlay | `sticky top-[71px] z-10 w-[440px] shrink-0 border-l border-[#edf2f7]` docked column |
| **Backdrop** | `fixed inset-0 bg-black/35` dimming page | **Removed completely** (0 dark overlay, page content interactive) |
| **Header Position** | Overlapped behind top navbar | Fixed at top with `shrink-0 px-[28px] py-[24px]` under 71px navbar |
| **Hide / Unhide** | Slide out of screen bounds | Width collapse `w-[440px]` ↔ `w-0 overflow-hidden` with content flex expansion |
| **Close Action** | Clicking backdrop or ✕ | Clicking ✕ in RSSB header or progress icon in navbar |

---

## 2. Precision Spacing, Margin, Padding & Box Sizing

### A. RSSB Container & Header
- **Docked Column:** `w-[440px] shrink-0 sticky top-[71px] h-[calc(100dvh-71px)] border-l border-[#edf2f7] bg-white`
- **Inner Wrapper:** `w-[440px] flex h-full flex-col overflow-hidden` (preserves card aspect ratios during transition)
- **Header:** `shrink-0 px-[28px] py-[24px] border-b border-[#edf2f7] flex items-center justify-between`
  - Title: `◎ Your Progress` (20px bold, `#1a202c`)
  - Close button: `✕` (28px `#a0aec0` hover `#1a202c`)
- **Scroll Content:** `px-[28px] py-[24px] flex flex-col gap-[24px] overflow-y-auto scrollbar-none`

### B. Section 1: Lifecycle & Overview Table
- **Title:** `Lifecycle & Overview` (16px bold `#334155`, `mb-3`)
- **Color:** Pink `#f54a8d` (matches prototype `table-pink` and Image 2)
- **Table Card:** `w-full rounded-[14px] overflow-hidden` with `0 10px 25px rgba(0,0,0,0.12)` shadow
- **Rows:**
  - Header: `METRIC` | `VALUE` (`background: rgba(0,0,0,0.15); font-size: 12px font-weight: 700`)
  - Row 1: `First Viewed` | formatted timestamp
  - Row 2: `Last Viewed` | formatted timestamp
  - Row 3: `Completed At` | formatted timestamp or `—`
  - Row 4: `Status` | `COMPLETED` in `#5cf0b0` green (or `—` in white)

### C. Section 2: Engagement Metrics (2×2 Grid)
- **Grid:** `grid grid-cols-2 gap-3` (12px gap)
- **Cards:**
  - Background: `#ff7300` (fixed orange)
  - Height: **exact fixed `height: 90px;`** (no vertical stretching)
  - Padding: `16px` (`p-4`)
  - Radius: `14px` (`rounded-[14px]`)
  - Layout: `flex flex-col justify-between`
  - Labels: `VISIT COUNT`, `REVISION COUNT`, `ATTEMPTS`, `SCORE` (11px uppercase bold, white/90)
  - Values: `22px font-extrabold white leading-none`

### D. Section 3: ◷ Time Analysis (2×2 Grid)
- **Title:** `◷ Time Analysis` (16px bold `#334155`, `mb-3`)
- **Grid:** `grid grid-cols-2 gap-3` (12px gap)
- **Cards:**
  - Background: `#0091d5` (fixed blue)
  - Height: **exact fixed `height: 90px;`**
  - Padding: `16px` (`p-4`)
  - Radius: `14px` (`rounded-[14px]`)
  - Labels: `ACTIVE TIME`, `EXPECTED TIME`, `DIFFERENCE`, `VS EXPECTED`
  - Difference formatting: `+65s`, `-30s`, `0s`, or `—`
  - Vs Expected formatting: `154.17%` (2 decimal places when non-integer matching Image 2)

### E. Section 4: Overall Progress (Card)
- **Background:** Pink `#f54a8d` (`brand.primaryColor`)
- **Radius & Padding:** `rounded-[18px] p-5`
- **Status Badge:** `rounded-[12px] px-[10px] py-1 text-[12px] font-bold uppercase backdrop-blur bg-white/25 text-white`
- **Percentage:** `text-[34px] font-extrabold text-white leading-none`
- **Subtext:** `text-[14px] font-semibold text-white/90` (`0 of 2 blocks completed`)
- **Progress Bar:** `h-[8px] bg-white/25 rounded-[4px]` with white progress fill and glow shadow
- **Summary Grid:** 4 columns (`COMPLETED`, `TOTAL`, `REQUIRED`, `ACTIVE`) in `bg-black/15 backdrop-blur rounded-[12px] p-3`

---

## 3. Verification & Validation

- `pnpm --filter @quiz/ui type-check` (`tsc --noEmit -p tsconfig.json`): **Passed with 0 errors**
- All 6 unit tests updated to test docked width transitions and prototype titles.
