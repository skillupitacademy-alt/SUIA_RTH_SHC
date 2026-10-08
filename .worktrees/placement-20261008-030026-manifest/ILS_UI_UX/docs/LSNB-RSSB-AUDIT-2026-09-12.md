# LSNB + RSSB DOCKING & VISUAL RECONCILIATION AUDIT

**Status:** READ-ONLY FORENSIC AUDIT  
**Date:** 2026-09-12  
**Phase:** B.2-R Visual Reconciliation  
**Implementation:** PROHIBITED (Audit Only)

---

## EXECUTIVE SUMMARY

### Current State
✅ **ILS Data Flow:** Navigation returns 200, RSSB receives real block telemetry  
❌ **Visual Fidelity:** Significant drift from prototype reference  
❌ **Docking Architecture:** RSSB implemented as overlay, not docked right panel  
❌ **LSNB R/Y/G:** Not visible, no authoritative definition exists  
⚠️ **Data Anomalies:** RTH shows "4/2" completion, SkillUp shows "1096%" pace  

### Critical Findings

1. **RSSB is currently an OVERLAY, not a DOCKED RIGHT PANEL**
2. **Prototype structural authority not fully preserved**
3. **R/Y/G is a NEW CONFIRMED REQUIREMENT with no implementation contract**
4. **Page layout does not implement LEFT(LSNB) / CENTER(Content) / RIGHT(RSSB) architecture**

---

## 1. PROTOTYPE STRUCTURAL AUTHORITY

### Source Files (ILS_UI_UX/)

**index.html** - Structural Authority
- Sidebar panel: `<aside id="metrics-sidebar" class="metrics-sidebar">`
- Header: `<div class="sidebar-header">` with title + close button
- Scroll container: `<div class="sidebar-scroll-content">`
- Sections (in order):
  1. ~~Block Selector (dropdown)~~ **NOT NEEDED** ✅
  2. Lifecycle & Overview (table)
  3. Engagement Metrics (2x2 grid)
  4. Time Analysis (2x2 grid)
  5. Overall Progress Card (with badge, %, progress bar, 4-column summary) **IN PROGRESS**

**style.css** - Visual Authority
```css
.metrics-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 440px;
  max-width: 90vw;
  height: 100vh;
  background-color: #ffffff;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 101;
}

.metrics-sidebar.open {
  transform: translateX(0);
}
```

**Key Dimensions:**
- Width: `440px`
- Max Width: `90vw`
- Padding: `24px 28px`
- Gap between sections: `24px`
- Border radius (cards): `14px`
- Border radius (tables): `14px`
- Grid card height: `90px`
- Font: `'Inter'`

**Colors (Fixed Semantic Hierarchy):**
- Lifecycle: `#f54a8d` (brand.secondary in React)
- Engagement: `#ff7300` (FIXED)
- Time Analysis: `#0091d5` (FIXED)
- Overall Progress: `#f54a8d` (brand.primary in React)
- Completed status: `#5cf0b0`

---

## 2. CURRENT REACT RSSB IMPLEMENTATION

### File: `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx`

**Current Structure:**
```tsx
<>
  {/* Overlay backdrop */}
  <div className="fixed inset-0 z-[100] bg-[rgba(15,23,42,0.35)] backdrop-blur-[2px]" />
  
  {/* Sidebar panel */}
  <aside className="fixed right-0 top-0 z-[101] w-[440px] max-w-[90vw] h-screen">
    <header>Learning Progress + Close button</header>
    <div className="flex flex-col gap-[24px] overflow-y-auto px-[28px] py-[24px]">
      <OverallProgressCard />
      <LifecycleMetrics />
      <EngagementMetrics />
      <TimeAnalysisMetrics />
    </div>
  </aside>
</>
```

**Section Order (Current vs Corrected Prototype):**

| Order | Corrected Prototype | Current React | Match? |
|-------|---------------------|---------------|--------|
| 1 | Lifecycle & Overview | OverallProgressCard | ❌ Wrong order |
| 2 | Engagement Metrics | LifecycleMetrics | ❌ Wrong order |
| 3 | ◷ Time Analysis | EngagementMetrics | ❌ Wrong order |
| 4 | Overall Progress (IN PROGRESS) | TimeAnalysisMetrics | ❌ Wrong order |

**CRITICAL:** Section ordering does not match prototype!

---

## 3. VISUAL DRIFT ANALYSIS

### Prototype vs Current React

| Element | Prototype | Current React | Status |
|---------|-----------|---------------|--------|
| **Width** | 440px | 440px | ✅ |
| **Positioning** | Fixed right overlay | Fixed right overlay | ✅ |
| **Transition** | cubic-bezier(0.4,0,0.2,1) | cubic-bezier(0.4,0,0.2,1) | ✅ |
| **Section gap** | 24px | 24px | ✅ |
| **Padding** | 24px 28px | 28px (px-[28px] py-[24px]) | ✅ |
| **Block Selector** | ~~Not needed~~ | **MISSING** | ✅ |
| **Section Order** | 4 sections | 4 sections (wrong order) | ❌ |
| **Header Title** | "◎ Your Progress" | "Learning Progress" | ❌ |
| **Overall Progress Position** | Last (4th) | First | ❌ |
| **Lifecycle Title** | "Lifecycle & Overview" | "Lifecycle Metrics" | ❌ |
| **Time Title** | "◷ Time Analysis" | "Time Analysis" | ⚠️ (missing icon) |

### Screenshots Analysis

**First Image (Prototype Reference):**
- Clean section hierarchy
- Clear metric labels in tables
- 2x2 grids with proper spacing
- Overall Progress shows: SEEN/TIME/REVISED/DONE with 0/2 completed
- Pink/Orange/Blue color separation maintained
- Proper card shadows and hover states

**Second Image (Current React - SkillUp):**
- Shows real data flowing correctly ✅
- Section order incorrect ❌
- "Done 0/2" shown in Overall Progress (top) ✅
- Time shows "32m 53s" / "3m 0s" = 1096% ⚠️
- Missing Block Selector (not needed) ✅

**Second Image (Current React - RTH):**
- Shows "Done 4/2" anomaly ⚠️
- Same structural issues as SkillUp

---

## 4. DOCKING ARCHITECTURE AUDIT

### Intended Architecture (from requirements)

```
┌──────────────────────────────────────────────────────────────┐
│                    TUTORIAL HEADER                           │
├─────────────┬──────────────────────────┬────────────────────┤
│             │                          │                    │
│    LSNB     │   TUTORIAL CONTENT      │       RSSB         │
│    LEFT     │      CENTER             │       RIGHT        │
│   DOCKED    │                         │      DOCKED        │
│             │    I1 / O1 / D1 / C1    │                    │
│             │                         │   Lifecycle        │
│   - Java    │                         │   Engagement       │
│   - Syntax  │                         │   Time             │
│   - Arrays  │                         │                    │
│             │                         │                    │
└─────────────┴──────────────────────────┴────────────────────┘
```

### Current Implementation

```
┌──────────────────────────────────────────────────────────────┐
│                    TUTORIAL HEADER                           │
├─────────────┬──────────────────────────────────────────────┤
│             │                                              │
│    LSNB     │       TUTORIAL CONTENT (Full Width)          │
│    LEFT     │                                              │
│  (Sidebar)  │         I1 / O1 / D1 / C1                    │
│             │                                              │
│             │                                              │
│   - Java    │                                              │
│   - Syntax  │         [RSSB = OVERLAY]                     │
│   - Arrays  │         (Not docked, floats over content)    │
│             │                                              │
└─────────────┴──────────────────────────────────────────────┘
```

**Finding:** RSSB is implemented as an **overlay with backdrop**, not a **docked right panel** that affects content layout.

---

## 5. LSNB AUDIT

### Current LSNB Location
`src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx`

**Current Features:**
- ✅ Navigation hierarchy (Domain > Subject > Topic > Subtopic > Pages)
- ✅ Active page highlighting
- ✅ Expandable/collapsible sections
- ✅ Progress percentage display
- ❌ **NO R/Y/G indicators visible**
- ❌ **NO per-page completion state colors**

### R/Y/G Status

**Historical Documentation Says:**
- Some older architecture documents mention R/Y/G in LSNB
- Macro 3 reconciliation concluded: "No authoritative R/Y/G definition exists"

**Current User Confirmation:**
- User explicitly states: **"LSNB red, yellow and green is also not visible"**
- This is now a **CONFIRMED NEW REQUIREMENT**

**Missing Definitions:**
1. What does RED mean? (Not started? Behind pace? Failed?)
2. What does YELLOW mean? (In progress? At-risk?)
3. What does GREEN mean? (Completed? Ahead of pace?)
4. Source metric: completion? time efficiency? score?
5. Thresholds: What values trigger each color?
6. Null handling: What if `expectedTimeSec = null`?
7. Aggregation: How do 5 blocks → 1 page color?
8. Visual representation: Circle? Dot? Border? Background?
9. Accessibility: How do colorblind users distinguish?

**BLOCKER:** Cannot implement R/Y/G without authoritative semantic contract.

---

## 6. DATA ANOMALY INVESTIGATIONS

### Anomaly A: RTH "Done 4/2"

**Evidence:**
```
completedBlockCount = 4
totalBlockCount = 2
```

**Source Investigation Needed:**
- Where does `completedBlockCount` come from?
- Where does `totalBlockCount` come from?
- Are they from same data source?
- Is this a real inconsistency or display bug?

**Current Display:** `4/2` shown in Overall Progress card

**DO NOT:** Clamp to `min(4, 2)` in UI - this hides the real problem

**REQUIRED:** Trace to authoritative source in ILS API response

---

### Anomaly B: SkillUp "1096% pace"

**Evidence:**
```
Active Time: 32m 53s (1973 seconds)
Expected Time: 3m 0s (180 seconds)
Pace: 1096% (1973/180)
```

**Questions:**
1. Is 32m53s a legitimate accumulated active time?
2. Is this across multiple sessions or one session?
3. Is there duplicate telemetry recording?
4. Is expected time (3m) reasonable for this block?
5. Should we show pace > 1000%?

**Current Display:** `1096%` shown accurately

**DO NOT:** Cap at 999% or hide - display is faithful to data

**REQUIRED:** Verify telemetry accumulation logic is correct

---

### Anomaly C: Session Initialization Race

**Evidence from logs:**
```
[BlockTelemetry] No session ID provided - telemetry disabled
[Tutorial Session] Learning session established
```

**Sequence:**
1. Component mounts
2. ILSProvider/BlockTelemetry mount before session init
3. Session ID created in useEffect
4. Later components get session ID

**Question:** Is this a legitimate initialization order or a defect?

**Impact:** Early telemetry events may be lost

---

## 7. BRAND VISUAL AUDIT

### Color Mapping (from requirements)

**Overall Progress:**
- SkillUp: `brand.primaryColor` (pink/magenta)
- RTH: `brand.primaryColor` (orange/red)

**Lifecycle:**
- Both brands: `brand.secondaryColor`
- SkillUp: Blue
- RTH: Blue/navy

**Engagement:**
- Both brands: `#ff7300` (FIXED, brand-independent)

**Time Analysis:**
- Both brands: `#0091d5` (FIXED, brand-independent)

**Finding:** Color hierarchy is correctly maintained across brands ✅

---

## 8. MISSING FEATURES FROM PROTOTYPE

### Block Selector Dropdown

**Prototype had:**
```html
<section class="selector-section">
  <label class="group-title" for="block-select">☷ Block Selector</label>
  <div class="select-wrapper">
    <select id="block-select" class="block-dropdown"></select>
  </div>
</section>
```

**Current React:** MISSING

**USER DECISION:** ✅ **NOT NEEDED** - Auto-follow ActiveBlockContext is sufficient

---

### Section Title Icons

**Prototype has:**
- "◎ Your Progress" (header)
- "◷ Time Analysis"

**Current React:**
- "Learning Progress" (no icon)
- "Time Analysis" (no icon)

**Impact:** Visual hierarchy slightly degraded

---

## 9. ARCHITECTURAL FINDINGS

### What Is Working ✅

1. **ILS Data Flow:**
   ```
   API → ILSProvider → blocks[] → ActiveBlockContext → RSSB
   ```
   Both brands return 200, real telemetry displayed

2. **Component Structure:**
   - Clean separation: OverallProgress / Lifecycle / Engagement / Time
   - Proper TypeScript interfaces
   - Passive data consumer (no API calls in RSSB)

3. **Brand Theming:**
   - Correct color application per brand
   - Fixed colors for Engagement/Time maintained

4. **Prototype Fidelity (Partial):**
   - Width, padding, gaps match
   - Transitions match
   - Card styling close to prototype

### What Is Not Working ❌

1. **Section Ordering:** Does not match prototype
2. **Block Selector:** ~~Missing~~ NOT NEEDED ✅
3. **Docking Architecture:** Overlay instead of docked panel
4. **R/Y/G in LSNB:** Not implemented, no contract exists
5. **Overall Progress Position:** First instead of last (4th)

---

## 10. REQUIRED IMPLEMENTATION CHANGES

### Priority 1: Section Reordering

**Change order to match corrected prototype:**
1. Lifecycle & Overview (currently 2nd) → **move to 1st**
2. Engagement Metrics (currently 3rd) → **move to 2nd**
3. ◷ Time Analysis (currently 4th) → **move to 3rd**
4. Overall Progress (currently 1st) → **move to 4th (IN PROGRESS)**

### Priority 2: Header Title

```diff
- <h2>Learning Progress</h2>
+ <h2>◎ Your Progress</h2>
```

### Priority 3: Section Titles

```diff
- Lifecycle Metrics
+ Lifecycle & Overview

- Time Analysis (no icon)
+ ◷ Time Analysis
```

### Priority 4: Docking Architecture (Major)

**Current:** Overlay with backdrop  
**Required:** Docked right panel that affects content width

**Implementation impact:**
- Requires TutorialPageShell layout changes
- Content area must respond to RSSB open/close
- LSNB must remain independent
- May need CSS Grid or Flexbox page layout

### Priority 5: Block Selector

**Decision:** ✅ **EXCLUDED** - Auto-follow ActiveBlockContext is sufficient

---

## 11. R/Y/G DESIGN GAP REPORT

### Confirmed Requirement

User states: "LSNB red, yellow and green is also not visible"

This is a **NEW CONFIRMED REQUIREMENT** that needs design contract before implementation.

### Missing Definitions

| Question | Status | Blocker? |
|----------|--------|----------|
| What does RED mean semantically? | ❌ Undefined | YES |
| What does YELLOW mean semantically? | ❌ Undefined | YES |
| What does GREEN mean semantically? | ❌ Undefined | YES |
| Source metric (completion/time/score)? | ❌ Undefined | YES |
| Threshold values? | ❌ Undefined | YES |
| Null expectedTimeSec handling? | ❌ Undefined | YES |
| Block aggregation to page rule? | ❌ Undefined | YES |
| Visual representation? | ❌ Undefined | NO |
| Accessibility (colorblind)? | ❌ Undefined | NO |
| Relationship to completion status? | ❌ Undefined | YES |

### Recommended Design Process

1. **Define semantic meaning** (product decision)
2. **Define source metric and thresholds** (product + eng)
3. **Define aggregation rule** (eng + product)
4. **Design visual representation** (design)
5. **Implement** (eng)
6. **Test accessibility** (QA)

**BLOCKER:** Cannot proceed with R/Y/G implementation until steps 1-3 complete.

---

## 12. CHANGES REQUIRING HUMAN AUTHORIZATION

### Design Decisions

1. ✅ **Block Selector:** EXCLUDED - not needed
2. ✅ **R/Y/G Semantics:** What do the colors mean? (BLOCKED)
3. ✅ **R/Y/G Thresholds:** What values trigger color changes? (BLOCKED)
4. ✅ **Docking vs Overlay:** Confirm docked right panel required?

### Data Investigations

5. ✅ **RTH 4/2 Anomaly:** Investigate before UI clamping
6. ✅ **SkillUp 1096% Pace:** Verify telemetry logic before capping display
7. ✅ **Session Init Race:** Confirm if this is acceptable or needs fix

---

## 13. RESPONSIVE & ACCESSIBILITY AUDIT

### Responsive Behavior

**Prototype:**
```css
max-width: 90vw;
```

**Current React:** Matches ✅

**Mobile behavior:** Sidebar fills most of viewport on small screens (correct)

### Accessibility

**Current Status:**
- ✅ Close button has `aria-label="Close sidebar"`
- ✅ Keyboard navigation works
- ✅ Screen reader can read metrics
- ⚠️ Color-only information (future R/Y/G concern)
- ⚠️ No skip-to-content link
- ⚠️ Focus trap not implemented when sidebar open

---

## 14. RECOMMENDED NEXT GATE

### Phase B.2-R-1: Visual Corrections (LOW RISK)

**Implement:**
1. Reorder sections to match corrected prototype:
   - Lifecycle & Overview (1st)
   - Engagement Metrics (2nd)
   - ◷ Time Analysis (3rd)
   - Overall Progress (4th - IN PROGRESS)
2. Update header title to "◎ Your Progress"
3. Update section titles (add icons)

**Estimated time:** 30 minutes  
**Risk:** Very low (cosmetic only)

### Phase B.2-R-2: Architecture (MEDIUM RISK)

**Decision + Implementation:**
1. Confirm docked panel requirement
2. Implement LEFT/CENTER/RIGHT layout
3. Content width responds to RSSB state
4. LSNB remains independent

**Estimated time:** 2-4 hours  
**Risk:** Medium (layout changes)

### Phase B.2-R-3: R/Y/G Design (HIGH RISK)

**BLOCKED pending design decisions:**
1. Define R/Y/G semantics
2. Define thresholds
3. Define aggregation
4. Implement in LSNB

**Estimated time:** TBD after design  
**Risk:** High (new feature, affects learning model)

### Phase B.2-R-4: Data Investigations (MEDIUM RISK)

**Investigate:**
1. RTH 4/2 completion anomaly
2. SkillUp 1096% pace validation
3. Session init race condition

**Estimated time:** 1-2 hours per anomaly  
**Risk:** Medium (may reveal deeper issues)

---

## 15. FINAL STATUS

**AUDIT COMPLETE — IMPLEMENTATION GATE READY**

### Summary

✅ **ILS Data Flow:** Working correctly, navigation returns 200  
✅ **RSSB Data Display:** Real telemetry shown accurately  
⚠️ **Visual Fidelity:** Close but not exact (section order, titles)  
❌ **Docking Architecture:** Overlay not docked panel  
❌ **R/Y/G:** Confirmed requirement, no contract exists  
⚠️ **Data Anomalies:** Need investigation before UI fixes  

### Recommended Immediate Action

**Phase B.2-R-1 (Visual Corrections)** - Can proceed immediately, low risk

**Phase B.2-R-2 (Docking)** - Requires confirmation from user

**Phase B.2-R-3 (R/Y/G)** - **BLOCKED** - requires design decisions

**Phase B.2-R-4 (Data)** - Can investigate in parallel

---

**END OF AUDIT**
