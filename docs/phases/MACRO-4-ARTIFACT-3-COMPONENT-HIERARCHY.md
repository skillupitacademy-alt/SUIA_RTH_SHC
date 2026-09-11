# MACRO 4 RSSB — Artifact 3: Component Hierarchy

**Status:** CORRECTED - AWAITING USER REVIEW  
**Created:** 2026-09-11  
**Updated:** 2026-09-11 (Corrections Applied - Real ILS Contract)  
**Purpose:** Define RSSB component structure with verified production ILS contract

---

## ⚠️ CRITICAL: Real Production ILS Contract

**Verified Source:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

```typescript
// Actual useILS() return type
interface ILSContextValue {
  // Navigation context
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  
  // Progress data
  overallProgress: ILSOverallProgress | null;
  activeBlockProgress: ILSActiveBlockProgress | null;
  
  // State
  loading: boolean;
  error: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
}

// Overall (page-level) progress
interface ILSOverallProgress {
  status: LearningState;           // "not-started" | "in-progress" | "completed"
  progressPercentage: number;      // 0-100
  completedBlockCount: number;     // NOT "completedBlocks"
  totalBlockCount: number;         // NOT "totalBlocks"
  visitCount: number;              // Page-level visits
  revisionCount: number;           // Page-level revisions
  timeSpentActiveSec: number;      // Page-level active time
  firstViewedAt: Date | null;      // Page-level first view
  lastViewedAt: Date | null;       // Page-level last view
  completedAt: Date | null;        // Page-level completion
}

// Active block progress
interface ILSActiveBlockProgress {
  blockId: string;
  blockVersion: string;
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null;  // ⚠️ NULLABLE - handle explicitly
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
  isCompleted: boolean;
}
```

**DO NOT** invent an `ILSData` abstraction. Use the actual production types.

---

## Component Tree

```
LearningProgressSidebar (Root Container)
├─ Sidebar Overlay (backdrop)
├─ Sidebar Panel (fixed right)
│  ├─ Sidebar Header
│  │  ├─ Title ("Learning Progress")
│  │  └─ Close Button
│  └─ Sidebar Scroll Content
│     ├─ OverallProgressCard
│     │  ├─ Status Badge ("IN PROGRESS")
│     │  ├─ Overall Percentage (67%)
│     │  ├─ Subtext ("Overall Progress")
│     │  ├─ Progress Bar Track
│     │  │  └─ Progress Bar Fill
│     │  └─ Summary Grid (4 columns)
│     │     ├─ SEEN (totalVisits)
│     │     ├─ TIME (formatSeconds(totalActiveTime))
│     │     ├─ REVISED (totalRevisions)
│     │     └─ DONE (completedBlocks/totalBlocks)
│     ├─ LifecycleMetricsSection
│     │  ├─ Section Title ("Lifecycle Metrics")
│     │  └─ Lifecycle Table (Pink)
│     │     ├─ Header Row (METRIC | VALUE)
│     │     └─ Data Rows
│     │        ├─ First Viewed | formatDate(firstViewedAt)
│     │        ├─ Last Viewed | formatDate(lastViewedAt)
│     │        └─ Completed At | formatDate(completedAt) OR "—"
│     ├─ EngagementMetricsSection
│     │  ├─ Section Title ("Engagement Metrics")
│     │  └─ 2x2 Grid (Orange Cards)
│     │     ├─ Card: VISITS (visitCount)
│     │     ├─ Card: REVISIONS (revisionCount)
│     │     ├─ Card: ATTEMPTS ("—")
│     │     └─ Card: SCORE ("—")
│     └─ TimeAnalysisSection
│        ├─ Section Title ("Time Analysis")
│        └─ 2x2 Grid (Blue Cards)
│           ├─ Card: ACTIVE TIME (formatSeconds(activeTimeSec))
│           ├─ Card: EXPECTED (formatSeconds(expectedTimeSec))
│           ├─ Card: PACE (calculated %)
│           └─ Card: STATUS ("On Track")
```

---

## File Structure

**DECISION:** Place in `packages/ui/src/tutorial/runtime/` (reusable Tutorial runtime capability)

**Rationale:** RSSB is a universal Tutorial Runtime feature, not brand-specific business logic. Aligns with existing ILSProvider/ActiveBlockProvider architecture.

```
packages/ui/src/tutorial/runtime/
├─ LearningProgressSidebar/
│  ├─ index.tsx                    (exports)
│  ├─ LearningProgressSidebar.tsx  (root container + overlay)
│  ├─ OverallProgressCard.tsx      (brand.primaryColor card)
│  ├─ LifecycleMetrics.tsx         (brand.secondaryColor table)
│  ├─ EngagementMetrics.tsx        (orange #ff7300 2x2 grid - FIXED)
│  ├─ TimeAnalysisMetrics.tsx      (blue #0091d5 2x2 grid - FIXED)
│  └─ utils.ts                     (formatSeconds, formatDate)
```

**Note:** Component count is an implementation proposal, NOT an architectural requirement. Preserve meaningful visual/semantic boundaries.

---

## Component Props

### `LearningProgressSidebar`
```typescript
interface LearningProgressSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Usage:**
```tsx
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

<LearningProgressSidebar 
  isOpen={isSidebarOpen} 
  onClose={() => setIsSidebarOpen(false)} 
/>
```

**Internal:** Consumes `useILS()` hook to get data.

---

### `OverallProgressCard`
```typescript
interface OverallProgressCardProps {
  overallProgress: ILSOverallProgress | null;
  brand: BrandConfig;  // From useBrand()
}
```

**Data Used (from `overallProgress`):**
- `overallProgress.progressPercentage`
- `overallProgress.visitCount` (page-level)
- `overallProgress.timeSpentActiveSec` (page-level)
- `overallProgress.revisionCount` (page-level)
- `overallProgress.completedBlockCount` (NOT "completedBlocks")
- `overallProgress.totalBlockCount` (NOT "totalBlocks")
- `overallProgress.status` (for badge)

**Brand Color:**
- Background: `brand.primaryColor`

**Format Helpers:**
- `formatSeconds(timeSpentActiveSec)`

---

### `LifecycleMetrics`
```typescript
interface LifecycleMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
  brand: BrandConfig;  // From useBrand()
}
```

**Data Used:**
- `activeBlockProgress.firstViewedAt` → `formatDate()`
- `activeBlockProgress.lastViewedAt` → `formatDate()`
- `activeBlockProgress.completedAt` → `formatDate()` OR "—" if null

**Brand Color:**
- Background: `brand.secondaryColor`

**Behavior:**
- If `activeBlockProgress` is null, display prototype-defined null state (verify prototype behavior first)
- If `completedAt` is null, display "—"
- If `completedAt` exists, display in **green** (#5cf0b0) text

---

### `EngagementMetrics`
```typescript
interface EngagementMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
}
```

**Data Used:**
- `activeBlockProgress.visitCount`
- `activeBlockProgress.revisionCount`
- Attempts: `"—"` (hardcoded - unavailable)
- Score: `"—"` (hardcoded - unavailable)

**Fixed Color:**
- Background: `#ff7300` (FIXED - NOT brand color)

**Behavior:**
- If `activeBlockProgress` is null, display prototype-defined null state

---

### `TimeAnalysisMetrics`
```typescript
interface TimeAnalysisMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
}
```

**Data Used:**
- `activeBlockProgress.activeTimeSec` → `formatSeconds()`
- `activeBlockProgress.expectedTimeSec` → `formatSeconds()` OR handle null
- **Pace calculation:** `(activeTimeSec / expectedTimeSec) * 100` (ONLY if expectedTimeSec !== null)
- **Status:** `"On Track"` (prototype literal text - NOT computed learning judgment)

**Fixed Color:**
- Background: `#0091d5` (FIXED - NOT brand color)

**⚠️ CRITICAL: expectedTimeSec is NULLABLE**
```typescript
if (expectedTimeSec === null) {
  // Display "—" or prototype-defined unavailable representation
  // DO NOT convert to 0
  // DO NOT fabricate expected time
}
```

**⚠️ CRITICAL: PACE calculation**
- Preserve prototype calculation: `(activeTimeSec / expectedTimeSec) * 100`
- Display as raw percentage (e.g., "49%")
- **DO NOT** create R/Y/G logic
- **DO NOT** create thresholds
- **DO NOT** create "struggling" / "efficient" / "ahead" / "behind" classifications

**⚠️ CRITICAL: STATUS field**
- If prototype literally displays "On Track", preserve as **prototype display text** only
- **DO NOT** compute learning judgment
- **NOT** an educational classification

---

## Utility Functions

### `formatSeconds(sec: number | undefined): string`
```typescript
/**
 * Format seconds to "Xm Ys" or "Ys".
 * From ILS_UI_UX/script.js - EXACT logic preservation required
 */
function formatSeconds(sec: number | undefined): string {
  if (!sec || sec === 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
```

### `formatDate(isoString: string | null | undefined): string`
```typescript
/**
 * Format ISO date to "Jan 10, 2026".
 * From ILS_UI_UX/script.js - EXACT logic preservation required
 * 
 * ⚠️ Production ILSOverallProgress uses Date objects, not ISO strings
 * ⚠️ Production ILSActiveBlockProgress uses ISO strings
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}
```

---

## Integration Points

### 1. Trigger Button (Integration Point)

**DECISION REQUIRED:** Inspect existing Tutorial Page chrome before implementation.

**Rule:** Integrate RSSB trigger into existing Tutorial Page chrome without introducing unrelated floating UI.

**Option A:** Existing TutorialHeader.tsx (if it owns learner-facing controls)
```tsx
<button onClick={() => setIsSidebarOpen(true)}>
  Learning Progress
</button>
```

**Option B:** TutorialPageShell.tsx (only if no existing chrome location exists)
```tsx
<button 
  onClick={() => setIsSidebarOpen(true)}
  className="..." // Style to match existing Tutorial Page design
>
  Progress
</button>
```

**DO NOT** automatically introduce:
```tsx
<button className="fixed top-6 right-6 z-50"> // ❌ Floating button without verification
```

**Action Before Implementation:** Inspect `TutorialHeader.tsx` and existing Tutorial Page chrome to determine natural control location.

---

### 2. State Management

**DECISION:** Start with local state in TutorialPageShell (simplicity + existing pattern)

```tsx
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
```

**Future Enhancement (not now):** Context-based if multiple components need sidebar state

---

### 3. Z-Index Layers

```
Sidebar Overlay: z-[100]
Sidebar Panel: z-[101]
```

**Action Before Implementation:** Verify no conflicts with existing Tutorial Page elements (header, modals, etc.)

---

## Conditional Rendering Logic

### Null State (No Active Block)

**⚠️ CRITICAL:** Do NOT invent null-state design.

**Action Before Implementation:**
1. Verify how approved prototype handles `activeBlockProgress === null`
2. If prototype has null-state design, reproduce exactly
3. If prototype has NO null-state design, implement minimal safe production fallback and document it as production safety state (NOT prototype-derived)

**Example Minimal Fallback (if needed):**
```tsx
{!activeBlockProgress ? (
  <div className="text-center py-8 text-gray-500 text-sm">
    {/* Minimal production fallback - NOT from prototype */}
    No block data available
  </div>
) : (
  // Normal rendering
)}
```

### Unavailable Data (Attempts, Score)
Display `"—"` in orange cards (DO NOT hide the card).

### Unavailable Expected Time
Display `"—"` for expected time card if `expectedTimeSec === null` (DO NOT convert to 0).

### Completed Date
- If `completedAt` is null, display `"—"` in lifecycle table
- If `completedAt` exists, display formatted date in **green** text (#5cf0b0)

---

## Accessibility

- **ARIA Labels:**
  - Toggle button: `aria-label="Open learning progress sidebar"`
  - Close button: `aria-label="Close sidebar"`
  - Overlay: `aria-hidden="true"`

- **Keyboard Navigation:**
  - ESC key closes sidebar
  - Focus trap within sidebar when open

- **Screen Readers:**
  - Announce sidebar open/close
  - Table semantics for lifecycle metrics

---

## User Verification Checkpoint

**Questions for User:**
1. ✅ Component hierarchy uses real ILSContextValue/ILSOverallProgress/ILSActiveBlockProgress types
2. ✅ Location: `packages/ui/src/tutorial/runtime/` (reusable Tutorial runtime)
3. ⚠️ Need to inspect: Existing Tutorial Page chrome for trigger button placement
4. ✅ expectedTimeSec nullability handled explicitly
5. ✅ PACE is raw calculation only (no R/Y/G, thresholds, classifications)
6. ✅ "On Track" is prototype literal text (not computed judgment)
7. ⚠️ Need to verify: Prototype null-state behavior before implementation

**Next Steps After Approval:**
- Begin implementation (Steps 7-17)
- First inspect Tutorial Page chrome for trigger location
- First verify prototype null-state behavior
- Create React components with exact Tailwind CSS from prototype
- Write tests
- Runtime verification
- Prototype parity check

**Awaiting user approval to proceed with code implementation.**
