# 📱 Core App User Journey
**Path**: `docs/pages/CORE_APP_JOURNEY.md`

This document defines the post-authentication core application experience, including the Dashboard, Reports, and Settings.


### Codebase Inventory (Traceability)
**Frontend** (`apps/web-app/src/app/`)
- `dashboard/page.tsx`: Main Dashboard (Stats & Activity).
- `dashboard/settings/page.tsx`: User Profile & Preferences.
- `reports/[id]/page.tsx`: Exam Result Detail View.
- `reports/active-report/page.tsx`: real-time feedback view.

**Components** (`apps/web-app/src/components/`)
- `dashboard/Sidebar.tsx`: Main navigation.
- `dashboard/StatsCards.tsx`: Top-level metrics.
- `dashboard/ProgressChart.tsx`: Activity visualization.
- `reports/ResultSummary.tsx`: Score & Header.
- `reports/PerformanceBreakdown.tsx`: Domain mastery analysis.

---

## 1. Dashboard
 (Home)
*Source: dashboard.md*

### Purpose
Provide logged-in users with a trustworthy overview of their learning progress.

### Metrics & Behavior
- **Metrics**: Exams Taken, Avg Score, Mastery Points.
- **Time Filtering**: 7D/30D toggles (Default: 7D).
- **Recent Activity**: Relative date labels (`Today`, `Yesterday`).
- **Global Rank**: Show "Pending" if unranked.

### Verification
- [ ] Login hides auth buttons.
- [ ] Charts update with time toggle.
- [ ] Activity list handles empty states.

---

## 2. Reports (Analytics)
*Source: reports.md*

### Purpose
Comprehensive breakdown of exam performance and question review.

### Entry Condition
- Valid `examId` (Completed status).

### Expected Features
- **Summary**: Final Score, Time Taken.
- **Performance**: Breakdown by Domain (Logic vs Syntax).
- **Review**: Question-by-question audit (User vs Correct).

### Verification
- [ ] Final score matches correct answers sum.
- [ ] Review shows explanation if available.

---

## 3. Settings (Profile)
*Source: settings.md*

### Purpose
Manage account profile and session.

### Features
- **Profile**: Read-only display of Name/Email/Role.
- **Actions**: Logout (Clear session & redirect).

### Verification
- [ ] User details match session.
- [ ] Logout functions correctly.
