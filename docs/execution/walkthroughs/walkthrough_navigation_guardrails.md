# Walkthrough: Navigation Guardrails & Undefined ID Fix

I have implemented strict guardrails to prevent the application from navigating to invalid exam IDs (e.g., `/exam/undefined`), which previously triggered SQL errors and "Connection Severed" messages.

## Changes Made

### Selection Console Hardening
In [QuizSelectionConsole.tsx](apps/web-app/src/components/quiz/new/QuizSelectionConsole.tsx), I added a UUID validation check immediately after the exam launch API call. If the returned `examId` is missing, malformed, or the string `"undefined"`, the app will throw an error instead of attempting to redirect.

### Active Exam Gating
In the [ActiveExamPage](apps/web-app/src/app/exam/[examId]/page.tsx), I implemented a `useEffect` guard that validates the `examId` parameter format (UUID) before any data fetching occurs. If invalid, the user is redirected back to `/quiz/new`. I also updated the "Return to Command Center" button to point to the correct `/quiz/new` route.

### API Route Validation
The [API state route](apps/api-server/src/app/api/quiz/state/route.ts) now enforces UUID validation for the `examId` query parameter, returning a `422 Unprocessable Entity` status for invalid formats, protecting the database from malformed queries.

## Verification Results

### Technical Certification
- **Build**: Monorepo `turbo build` successful (Exit Code 0).
- **Type Safety**: `pnpm type-check` successful (Exit Code 0).

### Manual Verification Path
1. Navigate to `/quiz/new`.
2. Launch a quiz.
3. Observe correct redirect to `/exam/[UUID]`.
4. (Simulated) Navigating manually to `/exam/undefined` now redirects back to `/quiz/new` without erroring in the console/logs.
