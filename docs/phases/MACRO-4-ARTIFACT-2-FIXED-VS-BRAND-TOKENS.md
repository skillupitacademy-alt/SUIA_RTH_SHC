# MACRO 4 RSSB — Artifact 2: Fixed vs Brand-Specific Visual Tokens

**Status:** CORRECTED - AWAITING USER REVIEW  
**Created:** 2026-09-11  
**Updated:** 2026-09-11 (Corrections Applied)  
**Purpose:** Catalog visual tokens from `ILS_UI_UX/style.css` and map to production brand architecture

---

## Token Classification

### ✅ PROTOTYPE-DEFINED FIXED VISUAL TOKENS

These tokens are **frozen design decisions from the approved prototype** that will be preserved exactly for 100% visual parity.

| Token | Value | Usage | Source |
|-------|-------|-------|--------|
| **Typography** |  |  |  |
| Font Family | `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | All text | `style.css` line 5 |
| Sidebar Title | `20px` / `font-weight: 700` | "Learning Progress" | `style.css` line 66 |
| Group Title | `16px` / `font-weight: 700` | Section headers | `style.css` line 138 |
| Card Label | `11px` / `font-weight: 700` / `uppercase` / `letter-spacing: 0.05em` | Metric labels | `style.css` line 168 |
| Card Value | `22px` / `font-weight: 800` | Metric values (2x2 grids) | `style.css` line 172 (adjusted from 28px to 22px for uniformity) |
| Overall Pct | `34px` / `font-weight: 800` | Overall progress % | `style.css` line 366 |
| Overall Subtext | `14px` / `font-weight: 600` | "Overall Progress" | `style.css` line 372 |
| Summary Label | `11px` / `font-weight: 700` / `uppercase` | 4-column grid labels | `style.css` line 401 |
| Summary Value | `15px` / `font-weight: 800` | 4-column grid values | `style.css` line 407 |
| Table Header | `12px` / `font-weight: 700` / `uppercase` / `letter-spacing: 0.05em` | Table column headers | `style.css` line 208 |
| Table Cell | `14px` / `font-weight: 600` | Table row data | `style.css` line 215 |
| **Spacing & Layout** |  |  |  |
| Sidebar Width | `440px` | Fixed width | `style.css` line 48 |
| Sidebar Header Padding | `24px 28px` | Header spacing | `style.css` line 62 |
| Sidebar Content Padding | `24px 28px` | Content spacing | `style.css` line 84 |
| Sidebar Content Gap | `24px` | Vertical gap between sections | `style.css` line 87 |
| Card Border Radius | `14px` | All cards/grids | `style.css` line 151, 274, 289 |
| Overall Card Border Radius | `18px` | Overall progress card | `style.css` line 338 |
| Card Padding | `16px` | Standard card padding | `style.css` line 275 |
| Overall Card Padding | `20px` | Overall progress card | `style.css` line 339 |
| 2x2 Grid Gap | `12px` | Gap between grid items | `style.css` line 149, 267 |
| Card Height | `90px` | Uniform height for 2x2 grid cards | `style.css` line 273 |
| Progress Bar Height | `8px` | Progress track height | `style.css` line 378 |
| Progress Bar Border Radius | `4px` | Progress bar rounding | `style.css` line 380 |
| **Shadows & Effects** |  |  |  |
| Card Shadow (Orange) | `0 8px 20px rgba(255, 115, 0, 0.25)` | Orange cards | `style.css` line 289 |
| Card Shadow (Orange Hover) | `0 12px 24px rgba(255, 115, 0, 0.35)` | Orange cards hover | `style.css` line 293 |
| Card Shadow (Blue) | `0 8px 20px rgba(0, 145, 213, 0.25)` | Blue cards | `style.css` line 297 |
| Card Shadow (Blue Hover) | `0 12px 24px rgba(0, 145, 213, 0.35)` | Blue cards hover | `style.css` line 301 |
| Card Shadow (Pink Overall) | `0 10px 25px rgba(245, 74, 141, 0.25)` | Overall progress card | `style.css` line 340 |
| Card Shadow (Pink Overall Hover) | `0 14px 30px rgba(245, 74, 141, 0.35)` | Overall progress card hover | `style.css` line 346 |
| Table Shadow | `0 10px 25px rgba(0, 0, 0, 0.12)` | Lifecycle table | `style.css` line 186 |
| Table Shadow (Hover) | `0 14px 30px rgba(0, 0, 0, 0.18)` | Lifecycle table hover | `style.css` line 190 |
| **Animations** |  |  |  |
| Card Transform (Base) | `translateY(-2px)` | Initial lift | `style.css` line 279, 187 |
| Card Transform (Hover) | `translateY(-5px)` | Hover lift | `style.css` line 283 |
| Table Transform (Hover) | `translateY(-7px)` | Table hover lift | `style.css` line 190 |
| Transition | `transform 0.2s ease, box-shadow 0.2s ease` | Smooth hover | `style.css` line 280, 188 |
| Progress Bar Transition | `width 0.3s ease` | Progress animation | `style.css` line 389 |
| **Colors (Prototype-Defined)** |  |  |  |
| ⚠️ Pink (Overall Progress) | `#f54a8d` | Overall progress card bg | `style.css` line 337 — **PRODUCTION: brand.primary** |
| ⚠️ Pink (Lifecycle) | `#f54a8d` | Lifecycle table bg | `style.css` line 248 — **PRODUCTION: brand.secondary** |
| Orange (Engagement) | `#ff7300` | Engagement 2x2 grid cards | `style.css` line 287 — **PRODUCTION: FIXED** |
| Blue (Time Analysis) | `#0091d5` | Time analysis 2x2 grid cards | `style.css` line 295 — **PRODUCTION: FIXED** |
| Green (Completed) | `#5cf0b0` | Completed date in lifecycle table | `style.css` line 253 — **PRODUCTION: FIXED** |
| White | `#ffffff` | Card text, progress bar fill | Throughout — **PRODUCTION: FIXED** |
| Neutral Gray (Borders) | `#edf2f7`, `#cbd5e1`, `#d9e0ea` | Borders, dividers | Throughout — **PRODUCTION: FIXED** |
| **Opacity Modifiers** |  |  |  |
| White 90% | `rgba(255, 255, 255, 0.9)` | Card labels, subtext | `style.css` line 169, 371 |
| White 80% | `rgba(255, 255, 255, 0.8)` | Summary labels | `style.css` line 404 |
| White 25% | `rgba(255, 255, 255, 0.25)` | Status badge bg, progress track | `style.css` line 355, 378 |
| Black 15% | `rgba(0, 0, 0, 0.15)` | Table header bg, summary grid bg | `style.css` line 210, 396 |

---

### ⚠️ BRAND-SPECIFIC TOKENS (Mapped from Existing Production Architecture)

**Source:** Existing production `useBrand()` hook (verified in codebase)  
**Location:** `src/share-branding/brandConfig.ts`  
**Type:** `BrandConfig`

**ESTABLISHED ARCHITECTURAL DECISION** (from `docs/phases/PHASE-5-RSSB-GATE-1-FINAL-AUDIT.md`):

| RSSB Section | Prototype Color | Production Mapping | Rationale |
|--------------|----------------|-------------------|-----------|
| Overall Progress | `#f54a8d` (pink) | `brand.primaryColor` | Primary theme color for most important section |
| Lifecycle & Overview | `#f54a8d` (pink) | `brand.secondaryColor` | Secondary theme color for supporting data |
| Engagement Metrics | `#ff7300` (orange) | `#ff7300` **FIXED** | Fixed warm accent for visual hierarchy (NOT brand color) |
| Time Analysis | `#0091d5` (blue) | `#0091d5` **FIXED** | Fixed cool accent for visual hierarchy (NOT brand color) |

**BrandConfig Interface:**
```typescript
interface BrandConfig {
  // Core Brand Colors
  primaryColor: string;      // RTH: #d03f00 | SkillUp: #f54a8d
  primaryColorDark: string;  // RTH: #b63600 | SkillUp: #d63d7a
  secondaryColor: string;    // RTH: #124fd6 | SkillUp: #133382
  primaryRgb: string;        // For shadow rgba()
  accentBackground: string;
  
  // Brand Identity
  name: string;              // "RealTutorialHub" | "SkillUp IT Academy"
  brandMark: string;         // "R" | "S"
  
  // ... other brand fields
}
```

**Usage in RSSB:**
```tsx
const brand = useBrand(); // From existing production architecture

// Overall Progress Card
<div style={{ backgroundColor: brand.primaryColor }}>

// Lifecycle Table
<table style={{ backgroundColor: brand.secondaryColor }}>

// Engagement Metrics (FIXED)
<div style={{ backgroundColor: '#ff7300' }}>

// Time Analysis (FIXED)
<div style={{ backgroundColor: '#0091d5' }}>
```

**CRITICAL NOTES:**
1. **Overall Progress + Lifecycle use brand colors** — adapts per brand (RTH vs SkillUp)
2. **Engagement + Time Analysis use FIXED colors** — consistent across all brands for visual hierarchy
3. **DO NOT** substitute `#ff7300` or `#0091d5` with brand colors
4. **DO NOT** create a new RSSBThemeProvider or RSSBBrandConfig
5. **USE** existing `useBrand()` hook from production

---

## Tailwind CSS Mapping

| Prototype CSS | Tailwind Equivalent | Notes |
|---------------|---------------------|-------|
| `font-family: 'Inter', ...` | `font-sans` (default) | Tailwind configured with Inter |
| `font-weight: 700` | `font-bold` | N/A |
| `font-weight: 800` | `font-extrabold` | N/A |
| `font-size: 20px` | `text-[20px]` | Custom size |
| `text-transform: uppercase` | `uppercase` | N/A |
| `letter-spacing: 0.05em` | `tracking-wider` | N/A |
| `border-radius: 14px` | `rounded-[14px]` | Custom radius |
| `border-radius: 18px` | `rounded-[18px]` | Custom radius |
| `box-shadow: 0 8px 20px ...` | `shadow-lg` or custom | May need custom |
| `display: grid` | `grid` | N/A |
| `grid-template-columns: repeat(2, 1fr)` | `grid-cols-2` | N/A |
| `grid-template-columns: repeat(4, 1fr)` | `grid-cols-4` | N/A |
| `gap: 12px` | `gap-[12px]` | Custom gap |
| `gap: 24px` | `gap-[24px]` | Custom gap |
| `padding: 16px` | `p-4` | 16px = 4rem/4 = 4 |
| `padding: 20px` | `p-5` | 20px = 5rem/4 = 5 |
| `padding: 24px 28px` | `px-7 py-6` | 28px = 7, 24px = 6 |
| `background-color: #f54a8d` | `bg-[#f54a8d]` | Fixed color |
| `background-color: #ff7300` | `bg-[#ff7300]` | Fixed color |
| `background-color: #0091d5` | `bg-[#0091d5]` | Fixed color |
| `color: #ffffff` | `text-white` | N/A |
| `color: rgba(255, 255, 255, 0.9)` | `text-white/90` | Tailwind opacity |
| `width: 440px` | `w-[440px]` | Custom width |
| `height: 90px` | `h-[90px]` | Custom height |
| `transform: translateY(-2px)` | `translate-y-[-2px]` | Custom transform |
| `transition: transform 0.2s ease` | `transition-transform duration-200` | N/A |

---

## User Verification Checkpoint

**Questions for User:**
1. ✅ Confirmed: Overall Progress uses `brand.primaryColor`, Lifecycle uses `brand.secondaryColor`
2. ✅ Confirmed: Engagement (#ff7300) and Time Analysis (#0091d5) remain FIXED
3. Are the Tailwind mappings correct?
4. Any other brand-specific tokens needed beyond primaryColor/secondaryColor?

**Awaiting approval before creating Artifact 3 (Component Hierarchy).**
