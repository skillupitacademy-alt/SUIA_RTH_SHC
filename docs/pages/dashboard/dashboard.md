# Dashboard Page – Objective & Contract

> Mandatory sections define baseline behavior.
> Additional sections are page-specific extensions.

---

## Purpose
Provide logged-in users with a trustworthy overview of their learning progress and activity.

---

## Entry Conditions
- User MUST be authenticated
- Redirect to Login if unauthenticated

---

## Expected Behavior

### Authentication UI
- Unauthenticated:
  - Show Login / Sign Up
- Authenticated:
  - Hide Login / Sign Up
  - Show User menu or Logout

### Metrics
- Exams Taken → count of completed exams
- Avg Score → calculated from completed exams only
- Mastery Points → derived from scoring engine
- Global Rank → hidden until ranking is implemented

### Activity
- Started exams → no score
- Completed exams → exactly one final score
- Show timestamp or relative time

---

## Extended Features

### Time Range Controls
- Toggle between "Last 7 Days" and "Last 30 Days" for performance charts. ✅ [Fully Functional]
- Data fetching adjusts based on selected range (7 vs 30 items/days).
- Default to "Last 7 Days".

### Recent Activity Date Labels
- Use relative labels for recent items:
  - `Today`
  - `Yesterday`
  - `X days ago`
- Transition to absolute date `DD/MM/YYYY` for items > 7 days old.

### "View All Quizzes" Navigation
- **CTA**: "View All Quizzes"
- **Destination**: `/dashboard/my-exams` ✅ [Corrected Destination]
- **Empty State**: If no quizzes exist, route still leads to listing with "No results" message.

### Global Rank Behavior
- If Global Rank is not yet calculated, show "Unranked" or "Pending" with a helpful tooltip. ✅ [Fully Functional]
- Do NOT show `#0` or `-`.
- Rank should only be displayed when authoritative relative data exists.

---

## Responsiveness
- Strictly follows [UX_BASELINE.md](../../ux/UX_BASELINE.md).
- Follows [DATA_TIME_FILTERING.md](../../ux/DATA_TIME_FILTERING.md) for range logic. ✅
- Sidebar must transition to a mobile hamburger or bottom nav on small screens. ✅ [Implemented Bottom Nav]
- Stats cards must wrap gracefully (1, 2, or 4 columns). ✅ [Follows UX Baseline]

---

## Known Issues
- Auth buttons visible when logged in ✅
- Placeholder / inconsistent dashboard values ✅
- Performance chart lacks context ✅ [Now has Date Labels]
- Time range selector missing ✅
- Sidebar hardcoded goals ✅
- Mobile responsiveness for charts ✅
- View All Quizzes leads to 404 ✅ [Resolved]

---

## Verification Checklist
- [x] Login hides auth buttons
- [x] Logout visible and functional
- [x] Dashboard renders only real data
- [x] Charts have labels or tooltips (Date + Score) ✅
- [x] Weekly goal syncs with authoritative stats
- [x] Navigation links are valid (no 404s) ✅
- [x] Responsive audit across BP-Mobile/Tablet/Desktop
- [x] Time range toggle updates chart data ✅
- [x] Recent Activity labels transition correctly (Today/X days) ✅
