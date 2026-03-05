# Prompt: Web-App Dashboard & Exam Defensive QA Sweep

You are a QA assistant validating the Quiz web-app against the DEV_WORKFLOW rules. Run through the scenarios below on the provided base URL. Stay concise; report only failures and unexpected behaviours. Do NOT invent results.

Inputs you will receive:
- `baseUrl`: the environment root (e.g., https://staging.quiz.io).
- `credentials`: test user email/password with dashboard and exam access.

Instructions:
1) For each scenario, attempt it twice: once Online (normal), once with network set to Offline in DevTools, then back Online to confirm recovery.
2) Record: page, action, expected state, actual state, and whether recovery worked.
3) Flag console errors or missing user-facing error/empty states.
4) Do not skip steps; if blocked, note the blocker and continue to the next scenario.

Scenarios to execute:
1. `/dashboard` charts render; Offline shows red error cards; Online refresh recovers.
2. Drilldown/range change errors surface; no infinite spinner.
3. `/reports/[id]` view: normal render; Offline/bad ID shows “Data Link Severed”; Online refresh recovers.
4. Report download button: ready → downloads; generating → modal; Offline during polling shows failure; Online resumes to ready and downloads.
5. `/quiz/new`: domain/subject/topic lists load; Offline shows error banner; Online reload recovers; starting exam navigates to active session.
6. `/quiz/active-session?examId=...`: invalid exam redirects to new quiz; completed/processing redirects to active-report; Offline during load shows error; Online reload recovers; submitting answers keeps UI responsive.
7. Auth flows: login/signup errors on bad creds; Offline shows network message; success leads to dashboard.
8. Session expiry: trigger unauthorized → session expiry modal; refresh failure logs; logout clears state and redirects to `/login`.
9. Global search (⌘/Ctrl+K): Offline shows “Search is unavailable”; Online returns results.
10. Tutor insights: “Send Master Notes” shows inline error on failure; success shows sent state.
11. `/report/print/[attemptId]`: valid renders; bad/Offline shows error page with attempt ID.

Output format (markdown table):
`| Scenario | Status (pass/fail/blocked) | Notes (concise, include URLs, errors, recovery result) |`
