# Walkthrough: Timer Sync & State Hardening (Phase 2)

I have hardened the `ExamInterface` state management to eliminate timer drift and prevent state contamination.

## Changes Made

### 1. Unified Time Synchronization
- **Problem**: Frontend estimated time based on question count, leading to host/client drift.
- **Solution**: Removed manual calculations. The HUD now injects `remainingTimeSeconds` directly from the backend state on every mount.

### 2. State Isolation & Reset
- **Problem**: Answers and flags from previous sessions could persist in local storage and leak into new exams.
- **Solution**: Implemented a mandatory `startQuiz` reset in `ExamInterface.tsx` that clears the `quiz-store` before hydrating with current session data.

### 3. Passive Status Gating
- **Problem**: Users could navigate back to an active exam HUD for a session that was already processing or completed.
- **Solution**: Added a status check in the initialization payload. If the session status is not `started`, the user is immediately redirected to the appropriate report page.

### 4. Forced Re-sync
- **Problem**: Early-return optimization prevented re-fetching state on page refresh.
- **Solution**: Removed the optimization. Every mount/refresh now triggers a full state re-sync from the API, ensuring the timer and progress are up-to-date.

## Verification
- [x] **Redirection**: Verified that navigating to a completed `examId` redirects to `/reports/active-report`.
- [x] **Residency**: Verified that fresh exams start with clean `markedForReview` and `answers` stores.
- [x] **Build**: `pnpm build` confirmed (Exit Code 0).
