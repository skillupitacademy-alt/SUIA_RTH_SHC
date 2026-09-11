# MACRO 4 RSSB — Artifact 1: Prototype→React Mapping

**Status:** AWAITING USER REVIEW  
**Created:** 2026-09-11  
**Purpose:** Map every HTML element from `ILS_UI_UX/` prototype to React implementation

---

## Mapping Table

| Prototype HTML | React Component | Data Source | CSS/Token | Notes |
|----------------|-----------------|-------------|-----------|--------|
| **Overall Progress Card** |  |  |  |  |
| `<div class="overall-progress-card">` | `<div className="...">` | `useILS()` | TW classes + pink bg | Card container |
| `<div class="status-badge">` | `<span className="...">` | Hardcoded "IN PROGRESS" | TW classes | Badge |
| `<div class="overall-pct">67%</div>` | `<div className="...">` | `ilsData.progressPercentage` | TW text-[34px] font-800 | Main percentage |
| `<p class="overall-subtext">` | `<p className="...">` | `"Overall Progress"` | TW text-[14px] | Subtext |
| `<div class="progress-bar-track">` | `<div className="...">` | N/A | TW h-[8px] rounded | Track container |
| `<div class="progress-bar-fill" style="width: 67%">` | `<div className="..." style={{width: '67%'}}>` | `ilsData.progressPercentage` | TW bg-white | Fill bar |
| `<div class="summary-bar-grid">` | `<div className="grid grid-cols-4 ...">` | N/A | TW grid layout | 4-column grid |
| `<span class="summary-label">SEEN</span>` | `<span className="...">` | Hardcoded | TW text-[11px] uppercase | Label |
| `<span class="summary-val">2</span>` | `<span className="...">` | `ilsData.totalVisits` | TW text-[15px] font-800 | Value |
| `<span class="summary-label">TIME</span>` | `<span className="...">` | Hardcoded | TW text-[11px] uppercase | Label |
| `<span class="summary-val">1m 29s</span>` | `<span className="...">` | `formatSeconds(ilsData.totalActiveTime)` | TW text-[15px] font-800 | Value |
| `<span class="summary-label">REVISED</span>` | `<span className="...">` | Hardcoded | TW text-[11px] uppercase | Label |
| `<span class="summary-val">2</span>` | `<span className="...">` | `ilsData.totalRevisions` | TW text-[15px] font-800 | Value |
| `<span class="summary-label">DONE</span>` | `<span className="...">` | Hardcoded | TW text-[11px] uppercase | Label |
| `<span class="summary-val">2/3</span>` | `<span className="...">` | `${ilsData.completedBlocks}/${ilsData.totalBlocks}` | TW text-[15px] font-800 | Value |
| **Lifecycle Metrics (Pink Table)** |  |  |  |  |
| `<h3 class="group-title">Lifecycle Metrics</h3>` | `<h3 className="...">` | Hardcoded | TW text-[16px] font-700 | Section title |
| `<table class="metrics-table table-pink">` | `<table className="...">` | N/A | TW rounded-[14px] shadow | Table container |
| `<th>METRIC</th>` | `<th className="...">` | Hardcoded | TW text-[12px] uppercase | Column header |
| `<th>VALUE</th>` | `<th className="...">` | Hardcoded | TW text-[12px] uppercase | Column header |
| `<td>First Viewed</td>` | `<td className="...">` | Hardcoded | TW text-[14px] | Row label |
| `<td>Jan 10, 2026</td>` | `<td className="...">` | `formatDate(activeBlockProgress.firstViewedAt)` | TW text-[14px] font-800 text-right | Row value |
| `<td>Last Viewed</td>` | `<td className="...">` | Hardcoded | TW text-[14px] | Row label |
| `<td>Jan 15, 2026</td>` | `<td className="...">` | `formatDate(activeBlockProgress.lastViewedAt)` | TW text-[14px] font-800 text-right | Row value |
| `<td>Completed At</td>` | `<td className="...">` | Hardcoded | TW text-[14px] | Row label |
| `<td class="text-green">Jan 14, 2026</td>` | `<td className="...">` | `formatDate(activeBlockProgress.completedAt) \|\| "—"` | TW text-[14px] font-800 text-right + green if completed | Row value |
| **Engagement Metrics (Orange 2x2 Grid)** |  |  |  |  |
| `<h3 class="group-title">Engagement Metrics</h3>` | `<h3 className="...">` | Hardcoded | TW text-[16px] font-700 | Section title |
| `<div class="metrics-2x2-grid">` | `<div className="grid grid-cols-2 ...">` | N/A | TW grid gap-[12px] | 2x2 grid container |
| `<div class="grid-card card-orange">` | `<div className="...">` | N/A | TW bg-[#ff7300] shadow | Card 1 |
| `<div class="card-label">VISITS</div>` | `<div className="...">` | Hardcoded | TW text-[11px] uppercase | Card label |
| `<div class="card-value">2</div>` | `<div className="...">` | `activeBlockProgress.visitCount` | TW text-[22px] font-800 | Card value |
| `<div class="grid-card card-orange">` | `<div className="...">` | N/A | TW bg-[#ff7300] shadow | Card 2 |
| `<div class="card-label">REVISIONS</div>` | `<div className="...">` | Hardcoded | TW text-[11px] uppercase | Card label |
| `<div class="card-value">2</div>` | `<div className="...">` | `activeBlockProgress.revisionCount` | TW text-[22px] font-800 | Card value |
| `<div class="grid-card card-orange">` | `<div className="...">` | N/A | TW bg-[#ff7300] shadow | Card 3 |
| `<div class="card-label">ATTEMPTS</div>` | `<div className="...">` | Hardcoded | TW text-[11px] uppercase | Card label |
| `<div class="card-value">—</div>` | `<div className="...">` | `"—"` (unavailable) | TW text-[22px] font-800 | Card value |
| `<div class="grid-card card-orange">` | `<div className="...">` | N/A | TW bg-[#ff7300] shadow | Card 4 |
| `<div class="card-label">SCORE</div>` | `<div className="...">` | Hardcoded | TW text-[11px] uppercase | Card label |
| `<div class="card-value">—</div>` | `<div className="...">` | `"—"` (unavailable) | TW text-[22px] font-800 | Card value |
| **Time Analysis (Blue 2x2 Grid)** |  |  |  |  |
| `<h3 class="group-title">Time Analysis</h3>` | `<h3 className="...">` | Hardcoded | TW text-[16px] font-700 | Section title |
| `<div class="metrics-2x2-grid">` | `<div className="grid grid-cols-2 ...">` | N/A | TW grid gap-[12px] | 2x2 grid container |
| `<div class="grid-card card-blue">` | `<div className="...">` | N/A | TW bg-[#0091d5] shadow | Card 1 |
| `<div class="card-label">ACTIVE TIME</div>` | `<div className="...">` | Hardcoded | TW text-[11px] uppercase | Card label |
| `<div class="card-value">1m 29s</div>` | `<div className="...">` | `formatSeconds(activeBlockProgress.activeTimeSec)` | TW text-[22px] font-800 | Card value |
| `<div class="grid-card card-blue">` | `<div className="...">` | N/A | TW bg-[#0091d5] shadow | Card 2 |
| `<div class="card-label">EXPECTED</div>` | `<div className="...">` | Hardcoded | TW text-[11px] uppercase | Card label |
| `<div class="card-value">3m 0s</div>` | `<div className="...">` | `formatSeconds(activeBlockProgress.expectedTimeSec)` | TW text-[22px] font-800 | Card value |
| `<div class="grid-card card-blue">` | `<div className="...">` | N/A | TW bg-[#0091d5] shadow | Card 3 |
| `<div class="card-label">PACE</div>` | `<div className="...">` | Hardcoded | TW text-[11px] uppercase | Card label |
| `<div class="card-value">49%</div>` | `<div className="...">` | `Math.round((activeTime/expected)*100)` | TW text-[22px] font-800 | Card value |
| `<div class="grid-card card-blue">` | `<div className="...">` | N/A | TW bg-[#0091d5] shadow | Card 4 |
| `<div class="card-label">STATUS</div>` | `<div className="...">` | Hardcoded | TW text-[11px] uppercase | Card label |
| `<div class="card-value">On Track</div>` | `<div className="...">` | `"On Track"` (no logic) | TW text-[22px] font-800 | Card value |
| **Sidebar Container** |  |  |  |  |
| `<div class="metrics-sidebar">` | `<aside className="...">` | N/A | TW fixed right-0 w-[440px] h-screen | Sidebar container |
| `<div class="sidebar-header">` | `<header className="...">` | N/A | TW px-[28px] py-[24px] border-b | Header |
| `<h2 class="sidebar-title">` | `<h2 className="...">` | Hardcoded "Learning Progress" | TW text-[20px] font-700 | Title |
| `<button class="close-btn">` | `<button className="..." onClick={onClose}>` | N/A | TW text-[28px] hover effect | Close button |
| `<div class="sidebar-scroll-content">` | `<div className="...">` | N/A | TW overflow-y-auto flex flex-col gap-[24px] | Scrollable content |
| `<div class="sidebar-overlay">` | `<div className="..." onClick={onClose}>` | N/A | TW fixed backdrop-blur | Backdrop overlay |

---

## Format Helpers (Reusable Functions)

```typescript
// From ILS_UI_UX/script.js — must preserve exact logic
function formatSeconds(sec: number | undefined): string {
  if (!sec || sec === 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}
```

---

## Component Boundaries

| Component Name | Responsibility | Props |
|----------------|----------------|-------|
| `LearningProgressSidebar` | Sidebar container, toggle state, overlay | `isOpen`, `onClose` |
| `OverallProgressCard` | Pink card with 4 summary metrics | `ilsData: ILSData` |
| `LifecycleMetricsTable` | Pink table (First/Last/Completed) | `activeBlockProgress: ILSActiveBlockProgress` |
| `EngagementMetricsGrid` | Orange 2x2 grid (Visit/Revision/—/—) | `activeBlockProgress: ILSActiveBlockProgress` |
| `TimeAnalysisGrid` | Blue 2x2 grid (Active/Expected/Pace/Status) | `activeBlockProgress: ILSActiveBlockProgress` |

---

## Data Source Contract

**Primary Hook:** `useILS()`

**Expected Shape:**
```typescript
interface ILSData {
  progressPercentage: number;           // Overall %
  totalVisits: number;                  // Sum across blocks
  totalRevisions: number;               // Sum across blocks
  totalActiveTime: number;              // Sum in seconds
  completedBlocks: number;              // Count of completed
  totalBlocks: number;                  // Total count
  activeBlockProgress: ILSActiveBlockProgress | null;
  // ... other fields
}

interface ILSActiveBlockProgress {
  blockId: string;
  blockVersion: string;
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
  isCompleted: boolean;
}
```

---

## User Verification Checkpoint

**Question for User:**
1. Does this mapping accurately capture the prototype→React translation?
2. Are the component boundaries correct (5 components + 2 helpers)?
3. Is the data source contract (useILS()) accurate?
4. Any missing elements or incorrect mappings?

**Awaiting approval before creating Artifact 2 (Fixed vs Brand Tokens).**
