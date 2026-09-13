# PHASE B.2-R-4 — RSSB DATA RECONCILIATION & UI VERIFICATION

**Date:** 2026-09-12  
**Status:** IN PROGRESS  
**Scope:** Verify RSSB field-by-field against ILS data contract + UI prototype parity

---

## Investigation Context

**Infrastructure Status:**
- ✅ RTH tutorial: 200 OK (0.9s)
- ✅ SkillUp tutorial: 200 OK (0.7s)
- ✅ TutorialDB: Healthy
- 🟡 Intermittent runtime failure documented as OPEN RISK (not blocking RSSB)

**RSSB Baseline (from RTH screenshot):**
- ✅ Page rendering with RSSB visible
- ✅ Real ILS telemetry data displayed
- ✅ Time Analysis showing: Active 3m 20s / Expected 3m 0s / 111%
- 🔍 Anomalies to investigate: 4/2 completion count, data accuracy

---

## ILS Data Contract

### API Endpoint
```
GET /api/tutorial/ils/navigation/{navigationNodeId}?subtopicId={subtopicId}
```

**Auth:** Requires authenticated session (cookie-based)

### Response Structure

```typescript
interface NavigationProgressResponse {
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId: string;
  status: LearningState; // 'not_started' | 'in_progress' | 'completed' | 'not_available'
  progressPercentage: number; // 0-100
  completedBlocks: CompletedBlockRecord[];
  completedBlockCount: number;
  totalBlockCount: number;
  blocks: BlockLearningStateResponse[]; // Per-block telemetry
  timeSpentActiveSec: number;
  visitCount: number;
  revisionCount: number;
  firstViewedAt: string | null; // ISO timestamp
  lastViewedAt: string | null;
  completedAt: string | null;
}

interface BlockLearningStateResponse {
  blockId: string;
  blockVersion: string;
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null; // NULLABLE - must handle explicitly
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
}
```

---

## RSSB Component Architecture

### Data Flow

```
ILSProvider (Phase 4)
    ↓ useILS() hook
    ↓
LearningProgressSidebar (RSSB)
    ├── LifecycleMetrics (brand.secondaryColor)
    ├── EngagementMetrics (#ff7300 FIXED)
    ├── TimeAnalysisMetrics (#0091d5 FIXED)
    └── OverallProgressCard (brand.primaryColor)
```

### Data Sources

**Overall Progress (page-level):**
- Source: `ILSOverallProgress` from `overallProgress` prop
- Used by: OverallProgressCard

**Active Block Progress (block-level):**
- Source: `ILSActiveBlockProgress` from `activeBlockProgress` prop  
- Used by: LifecycleMetrics, EngagementMetrics, TimeAnalysisMetrics

---

## Section 1: Lifecycle Metrics

**Component:** `LifecycleMetrics.tsx`  
**Data Source:** `ILSActiveBlockProgress`  
**Color:** `brand.secondaryColor` (RTH: #00a3ed, SkillUp: varies)

**Fields Displayed:**
- STARTED → `firstViewedAt` (formatted date/time)
- LAST ACTIVE → `lastViewedAt` (formatted date/time)

**Data Contract:**
```typescript
firstViewedAt: Date | null;
lastViewedAt: Date | null;
```

**Verification Status:** ⏳ PENDING
- [ ] Verify `firstViewedAt` matches ILS API response
- [ ] Verify `lastViewedAt` matches ILS API response
- [ ] Verify date formatting (prototype spec TBD)
- [ ] Verify null handling (display "—" or equivalent)

---

## Section 2: Engagement Metrics

**Component:** `EngagementMetrics.tsx`  
**Data Source:** `ILSActiveBlockProgress`  
**Color:** `#ff7300` FIXED (orange - not brand color)

**Fields Displayed:**
- VISITS → `visitCount`
- REVISIONS → `revisionCount`

**Data Contract:**
```typescript
visitCount: number;
revisionCount: number;
```

**Verification Status:** ⏳ PENDING
- [ ] Verify `visitCount` matches ILS API response
- [ ] Verify `revisionCount` matches ILS API response
- [ ] Verify numeric display formatting
- [ ] Verify card styling (#ff7300 background)

---

## Section 3: Time Analysis Metrics

**Component:** `TimeAnalysisMetrics.tsx`  
**Data Source:** `ILSActiveBlockProgress`  
**Color:** `#0091d5` FIXED (blue - not brand color)

**Fields Displayed (2x2 grid):**
- ACTIVE TIME → `formatSeconds(activeTimeSec)`
- EXPECTED TIME → `formatSeconds(expectedTimeSec)` or "—" if null
- DIFFERENCE → `activeTimeSec - expectedTimeSec` (e.g. +20s, -30s)
- VS EXPECTED → `(activeTimeSec / expectedTimeSec) * 100%` or "—" if null

**Data Contract:**
```typescript
activeTimeSec: number;
expectedTimeSec: number | null; // NULLABLE
```

**Known Data (from RTH screenshot):**
```
Active Time: 3m 20s (200 seconds)
Expected Time: 3m 0s (180 seconds)
Difference: +20s
Vs Expected: 111%
```

**Calculation Verification:**
```
activeTimeSec = 200
expectedTimeSec = 180
difference = 200 - 180 = +20s ✅
vsExpected = (200 / 180) * 100 = 111.11% → rounds to 111% ✅
```

**Verification Status:** ⏳ PENDING
- [ ] Verify `activeTimeSec` source value (should be 200 for screenshot case)
- [ ] Verify `expectedTimeSec` source value (should be 180 for screenshot case)
- [ ] Verify difference calculation accuracy
- [ ] Verify percentage rounding (Math.round)
- [ ] Verify null `expectedTimeSec` displays "—"
- [ ] Verify card styling (#0091d5 background)

**CRITICAL CONSTRAINTS:**
- ✅ NO R/Y/G color coding
- ✅ NO threshold classifications
- ✅ NO educational judgments
- ✅ Raw arithmetic display only

---

## Section 4: Overall Progress Card

**Component:** `OverallProgressCard.tsx`  
**Data Source:** `ILSOverallProgress`  
**Color:** `brand.primaryColor` (RTH: #d03f00, SkillUp: #f54a8d)

**Fields Displayed:**
- Status badge → `status` ('IN PROGRESS' | 'COMPLETED' | 'NOT STARTED')
- Main percentage → `Math.round(progressPercentage)`
- Progress bar → width = `progressPercentage%`
- Subtext → `{completedBlockCount} of {totalBlockCount} blocks completed`
- 4-column grid:
  - COMPLETED → `completedBlockCount`
  - TOTAL → `totalBlockCount`
  - REQUIRED → `totalBlockCount` (same as TOTAL)
  - ACTIVE → `formatSeconds(timeSpentActiveSec)`

**Data Contract:**
```typescript
status: LearningState;
progressPercentage: number; // 0-100
completedBlockCount: number;
totalBlockCount: number;
visitCount: number;
revisionCount: number;
timeSpentActiveSec: number;
firstViewedAt: Date | null;
lastViewedAt: Date | null;
completedAt: Date | null;
```

**Known Anomaly (from earlier investigation):**
```
RTH screenshot showed: completedBlockCount=4, totalBlockCount=2
This is mathematically impossible: completed > total
```

**Verification Status:** 🔴 ANOMALY DETECTED
- [ ] Capture actual ILS API response values
- [ ] Investigate why `completedBlockCount > totalBlockCount`
- [ ] Verify if this is:
  - API data issue (wrong query)
  - Block counting logic error
  - Display bug
  - Stale cache
- [ ] Check SkillUp for same anomaly
- [ ] **DO NOT** modify ILS contract without proving mechanism

**Secondary Anomaly (SkillUp):**
```
Earlier investigation showed: 1096% pace anomaly
```
- [ ] Investigate if still present
- [ ] Capture actual values
- [ ] Determine if related to 4/2 issue

---

## RSSB UI Verification

### Layout Architecture

**Approved Design:** Docked 3-column layout
```
┌─────────────────────────────────────────────────────────┐
│ Header (with RSSB trigger button)                       │
├──────────┬───────────────────────┬──────────────────────┤
│          │                       │                      │
│   LSNB   │   Tutorial Content    │   RSSB (overlay)     │
│  (280px) │   (flex-1)            │   (440px, right)     │
│          │                       │                      │
│          │                       │   [closes on         │
│          │                       │    backdrop click]   │
└──────────┴───────────────────────┴──────────────────────┘
```

**RSSB Behavior:**
- Opens from right side (slide transition)
- Fixed width: 440px (max 90vw on mobile)
- Overlays content area (does not push)
- Backdrop: rgba(15, 23, 42, 0.35) with 2px blur
- Close: X button or backdrop click

**Verification Checklist:**
- [ ] RSSB opens from right on trigger button click
- [ ] Width = 440px on desktop
- [ ] Slide transition: 300ms cubic-bezier(0.4,0,0.2,1)
- [ ] Backdrop displays with correct opacity/blur
- [ ] Backdrop click closes RSSB
- [ ] X button closes RSSB
- [ ] RSSB does not push/reflow content area
- [ ] LSNB remains independent (not affected by RSSB state)

### Four-Section Prototype Parity

**Prototype Authority:** `ILS_UI_UX/index.html` + `ILS_UI_UX/style.css`

**Section Order (top to bottom):**
1. Lifecycle & Overview (brand.secondaryColor)
2. Engagement Metrics (#ff7300 FIXED)
3. ◷ Time Analysis (#0091d5 FIXED)
4. Overall Progress (brand.primaryColor)

**Gap Between Sections:** 24px

**Verification Checklist:**
- [ ] Sections appear in correct order
- [ ] Gap between sections = 24px
- [ ] Lifecycle card background = brand.secondaryColor
- [ ] Engagement card background = #ff7300
- [ ] Time Analysis cards background = #0091d5
- [ ] Overall Progress card background = brand.primaryColor

### Typography & Spacing

**From prototype CSS:**
- Section titles: 16px bold, color #334155
- Card labels: 11px bold uppercase, 90% white opacity
- Card values: varies by section (22px-34px extrabold)
- Card padding: 16-20px
- Card border-radius: 12-18px
- Card shadows: specific per section with color-matched rgba

**Verification Checklist:**
- [ ] Section title typography matches
- [ ] Card label typography matches
- [ ] Card value typography matches
- [ ] Card padding matches
- [ ] Border radius matches
- [ ] Shadow depth/color matches
- [ ] Hover transitions work (translateY + shadow)

### Brand Color Integration

**RTH:**
- primaryColor: `#d03f00` (red-orange)
- secondaryColor: `#00a3ed` (blue)

**SkillUp:**
- primaryColor: `#f54a8d` (pink)
- secondaryColor: (TBD - verify)

**Verification Checklist:**
- [ ] Lifecycle section uses brand.secondaryColor
- [ ] Overall Progress uses brand.primaryColor
- [ ] Engagement stays #ff7300 (not brand color)
- [ ] Time Analysis stays #0091d5 (not brand color)
- [ ] Progress bar shadow uses primaryColor with 40% opacity
- [ ] Card shadows use section-specific colors

---

## Prohibited Features (Must Verify Absence)

**CRITICAL:** These were explicitly rejected and must NOT appear in production:

❌ **R/Y/G Color Coding:**
- No green for "on track"
- No yellow for "slightly behind"
- No red for "struggling"
- No color-based performance classifications

❌ **Threshold Logic:**
- No <80% / 80-110% / >110% classifications
- No "below expected" / "on track" / "above expected" logic
- No conditional styling based on performance

❌ **Educational Judgments:**
- No "struggling" / "excelling" labels
- No recommendations ("spend more time", "move faster")
- No learning state interpretations beyond raw data

**Allowed:**
- ✅ Raw arithmetic: `(activeTimeSec / expectedTimeSec) * 100`
- ✅ Literal prototype text: "On Track" (if it's static text from prototype)
- ✅ Simple difference: `+20s` or `-30s`
- ✅ Status badge from API: `status: 'in_progress'` → "IN PROGRESS"

**Verification Checklist:**
- [ ] No conditional colors based on metrics
- [ ] No threshold comparisons in code
- [ ] No educational judgment strings
- [ ] No recommendation logic
- [ ] "On Track" is either removed or proven to be static prototype text

---

## Known Issues to Investigate

### Issue 1: 4/2 Completion Anomaly (RTH)

**Observation:**
```
completedBlockCount = 4
totalBlockCount = 2
```

**This violates:** `completedBlockCount ≤ totalBlockCount`

**Possible Causes:**
1. **Wrong API query** - fetching wrong scope (sibling pages, entire subtopic)
2. **Stale cache** - totalBlockCount not updated after block addition
3. **Counting logic error** - different definitions of "block"
4. **Display bug** - swapped variables in component
5. **Data migration issue** - old vs new schema mismatch

**Investigation Plan:**
- [ ] Capture raw ILS API response
- [ ] Check `completedBlocks[]` array length vs `completedBlockCount`
- [ ] Check `blocks[]` array length vs `totalBlockCount`
- [ ] Verify `navigationNodeId` scope (single page, not subtopic)
- [ ] Check for cache headers in API response
- [ ] Review block counting logic in ILS service
- [ ] Test with fresh navigation node

### Issue 2: 1096% Pace Anomaly (SkillUp - earlier report)

**Observation:**
```
vsExpected = 1096%
```

**This suggests:**
```
activeTimeSec / expectedTimeSec = 10.96
Example: 1096 seconds active / 100 seconds expected = 1096%
```

**Possible Causes:**
1. **Cumulative time bug** - activeTimeSec summing across sessions incorrectly
2. **expectedTimeSec null or near-zero** - division by very small number
3. **Unit mismatch** - milliseconds vs seconds
4. **Wrong block selected** - showing aggregate instead of single block

**Investigation Plan:**
- [ ] Verify current SkillUp RSSB still shows anomaly
- [ ] Capture raw `activeTimeSec` and `expectedTimeSec` values
- [ ] Check if `expectedTimeSec` is null or <10
- [ ] Verify time unit consistency
- [ ] Check ActiveBlockContext block identity

---

## Data Reconciliation Process

### Step 1: Capture Live ILS Response

**Method:**
Since API requires authentication, options:
1. Browser DevTools Network tab (manual)
2. Server-side logging (enable temporarily)
3. Authenticated curl with session cookie
4. Test script with session injection

**Target URL (RTH):**
```
GET http://realtutorialhub.localhost:3003/api/tutorial/ils/navigation/whatisjava?subtopicId=414f63eb-cccf-4bd1-bcc0-b52df69ce499
```

**Expected Response:**
```json
{
  "navigationNodeId": "whatisjava",
  "sectionId": "75e91508-fe79-45fa-a3d8-d5506a1213d7",
  "subtopicId": "414f63eb-cccf-4bd1-bcc0-b52df69ce499",
  "status": "in_progress",
  "progressPercentage": 67,
  "completedBlockCount": ???,
  "totalBlockCount": ???,
  "blocks": [{
    "blockId": "7ff97553-b343-46cf-b615-f58a275261f0",
    "blockVersion": "D1",
    "visitCount": ???,
    "revisionCount": ???,
    "activeTimeSec": 200,
    "expectedTimeSec": 180,
    "firstViewedAt": "2026-09-12T...",
    "lastViewedAt": "2026-09-12T...",
    "completedAt": null
  }],
  "timeSpentActiveSec": ???,
  "visitCount": ???,
  "revisionCount": ???,
  "firstViewedAt": "2026-09-12T...",
  "lastViewedAt": "2026-09-12T...",
  "completedAt": null
}
```

### Step 2: Field-by-Field Comparison

For each RSSB displayed value, trace back to:
1. ILS API response field
2. ILSProvider transformation
3. Component prop
4. Display formatting

**Comparison Matrix:**

| RSSB Display | Component | Prop Path | API Field | Expected Value | Actual Value | Status |
|--------------|-----------|-----------|-----------|----------------|--------------|--------|
| Active Time | TimeAnalysis | activeBlockProgress.activeTimeSec | blocks[active].activeTimeSec | 200 | TBD | ⏳ |
| Expected Time | TimeAnalysis | activeBlockProgress.expectedTimeSec | blocks[active].expectedTimeSec | 180 | TBD | ⏳ |
| Difference | TimeAnalysis | (calculated) | (activeTimeSec - expectedTimeSec) | +20s | TBD | ⏳ |
| Vs Expected | TimeAnalysis | (calculated) | (activeTimeSec / expectedTimeSec * 100) | 111% | TBD | ⏳ |
| Visits | Engagement | activeBlockProgress.visitCount | blocks[active].visitCount | TBD | TBD | ⏳ |
| Revisions | Engagement | activeBlockProgress.revisionCount | blocks[active].revisionCount | TBD | TBD | ⏳ |
| Started | Lifecycle | activeBlockProgress.firstViewedAt | blocks[active].firstViewedAt | TBD | TBD | ⏳ |
| Last Active | Lifecycle | activeBlockProgress.lastViewedAt | blocks[active].lastViewedAt | TBD | TBD | ⏳ |
| Status Badge | OverallProgress | overallProgress.status | status | TBD | TBD | ⏳ |
| Progress % | OverallProgress | overallProgress.progressPercentage | progressPercentage | TBD | TBD | ⏳ |
| Completed | OverallProgress | overallProgress.completedBlockCount | completedBlockCount | TBD | TBD | 🔴 |
| Total | OverallProgress | overallProgress.totalBlockCount | totalBlockCount | TBD | TBD | 🔴 |
| Active Time (Overall) | OverallProgress | overallProgress.timeSpentActiveSec | timeSpentActiveSec | TBD | TBD | ⏳ |

### Step 3: Anomaly Root Cause Analysis

For 4/2 issue:
1. Log raw API response
2. Check `completedBlocks[]` array
3. Check `blocks[]` array
4. Verify ILS service query scope
5. Check block_learning_state table directly
6. Trace through ILSProvider mapping

---

## Test Plan

### T1: RTH Data Accuracy
- [ ] Open RTH tutorial page
- [ ] Trigger RSSB
- [ ] Capture ILS API response (DevTools)
- [ ] Compare each displayed value to API
- [ ] Document any mismatches

### T2: SkillUp Data Accuracy
- [ ] Open SkillUp tutorial page
- [ ] Trigger RSSB
- [ ] Capture ILS API response
- [ ] Check for 1096% anomaly
- [ ] Compare values to API

### T3: UI Visual Parity
- [ ] Screenshot RTH RSSB
- [ ] Screenshot SkillUp RSSB
- [ ] Screenshot ILS_UI_UX/index.html prototype
- [ ] Pixel-diff comparison
- [ ] Typography measurement
- [ ] Spacing measurement
- [ ] Color hex verification

### T4: Layout Integration
- [ ] Verify 3-column docked layout
- [ ] Test LSNB independence
- [ ] Test RSSB overlay behavior
- [ ] Test backdrop click
- [ ] Test responsive width

### T5: Prohibited Features Audit
- [ ] Code search for R/Y/G logic
- [ ] Code search for threshold comparisons
- [ ] Code search for educational judgment strings
- [ ] Verify no conditional styling based on metrics

---

## Next Actions

1. ⏳ **Capture live ILS API response** (requires auth session)
2. ⏳ **Complete field-by-field comparison**
3. 🔴 **Investigate 4/2 anomaly root cause**
4. ⏳ **Verify SkillUp 1096% status**
5. ⏳ **UI visual parity check**
6. ⏳ **Prohibited features audit**

---

## References

- **ILSProvider:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`
- **RSSB Container:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx`
- **TimeAnalysis:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/TimeAnalysisMetrics.tsx`
- **OverallProgress:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/OverallProgressCard.tsx`
- **Prototype:** `ILS_UI_UX/index.html` + `ILS_UI_UX/style.css`
- **Test Data:** `ILS_UI_UX/data.json`

---

**STATUS:** Investigation framework established. Awaiting live ILS API data capture to complete reconciliation.
