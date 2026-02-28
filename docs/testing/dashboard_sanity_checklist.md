# Dashboard & Exam Flow Sanity Checklist (Web App)

This manual runbook covers the key defensive fetch/error/empty-state behaviours we just hardened. It is intended for quick QA spot checks before releases.

## Prereqs
- Test user with access to dashboard and exams.
- Ability to toggle network Offline/Online in browser DevTools.
- Base URL of the web app (e.g., http://localhost:3000 or staging host).

## Scenarios

### Dashboard analytics widgets
1) Online load  
   - Visit `/dashboard`. Confirm stats and all charts render (Score History, Mastery Trend, Difficulty Split, Time Boxplot, Weakness Tree, Topic Heatmap). No toasts/errors.
2) Offline failure states  
   - Toggle DevTools to **Offline**, refresh `/dashboard`. Each chart shows its red “unable to load” state (not just a spinner).  
   - Toggle back **Online**, refresh: charts recover and render data.
3) Drilldown fetches  
   - Change date range/filters. If API is down, an error message surfaces (no infinite spinner). Restore API and refresh to verify recovery.

### Reports
4) Premium report view `/reports/[id]`  
   - Normal: shows report.  
   - Force bad ID or go Offline: shows “Data Link Severed” error with Retry/Home actions. Returning Online + reload restores the report.
5) Report download button  
   - When status is **Ready**, click to download PDF.  
   - When **Generating/Pending**, modal opens; toggle Offline during polling → shows failure; back Online → polling resumes and download works.

### Quiz flows
6) Quiz selection `/quiz/new`  
   - Domains/subjects/topics load normally.  
   - Toggle Offline before load → red error banner appears; go Online → retry loads lists.  
   - Start exam with valid selections: navigates to `/quiz/active-session?examId=...`.
7) Active exam page  
   - Invalid `examId` redirects to `/quiz/new?error=invalid_exam`.  
   - Completed/processing exam redirects to `/reports/active-report?examId=...`.  
   - Offline during load: shows “Failed to connect…” style error; back Online and reload recovers.  
   - Submitting answers: UI stays responsive; retries logged (check console).

### Auth/session
8) Login/Signup  
   - Bad creds show inline error; Offline shows network/CORS message.  
   - Successful login redirects to dashboard.
9) Session expiry  
   - Trigger `auth:unauthorized` (or wait for expiry). Session expiry modal appears; Refresh failures log and route to logout; logout clears state and redirects to `/login?reason=session_expired`.

### Search & tutor
10) Global search (⌘/Ctrl+K)  
    - With network: results appear.  
    - Offline: “Search is unavailable” message; back Online restores results.
11) Tutor insights panels  
    - Click “Send Master Notes”; on failure shows inline red text; on success shows “Sent” state.

### Print/PDF
12) `/report/print/[attemptId]`  
    - Valid attempt renders pages.  
    - Bad attemptId or Offline: error page with attempt ID and reason.

## Exit criteria
- All error/empty states display as described when network/API is unavailable.
- Returning Online and refreshing restores normal data views.
- No uncaught errors in console during the above steps.
