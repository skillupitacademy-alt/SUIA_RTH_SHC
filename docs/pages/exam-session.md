# Exam Session Page – Objective & Contract

---

## Purpose
The primary interface for users to take an exam. It must provide a distraction-free environment for answering questions, tracking progress, and managing the session state.

---

## Entry Conditions
- User MUST be authenticated.
- MUST have a valid and active `examId` in the URL or state.
- Unauthorized users or invalid IDs MUST be redirected to `/dashboard`.

---

## Expected Behavior

### Interface Rules
- Display one question at a time.
- Show a progress bar indicating the number of answered vs. total questions.
- Adaptive behavior: Questions are pre-selected by the Selection Engine.
- Provide "Next", "Previous", and "Review" navigation.

### State Persistence
- Every answer MUST be synced to the database immediately (No local-only answers).
- Page refresh MUST maintain the current position and all previous answers.
- Display "Saving..." or small toast to confirm persistence.

### Finalization
- "Finish Attempt" button triggers the Scoring Engine.
- Redirects to `/reports/active-report?examId=[examId]` upon successful completion.

---

## Data Contract
- Sourced from `apiClient.quiz.getQuizState(examId)`.
- Updates via `apiClient.quiz.submitAnswer()`.
- No mock questions allowed.

---

## UI Rules
- Do NOT allow "Next" if no answer is selected (Optional: unless "Skip" is implemented).
- Hide navigation header/footer to minimize distraction.

---
+
+## Verification Checklist
+- [x] Multiple-choice answers sync to DB on click.
+- [x] Refreshing the page keeps the current question and selected answers.
+- [x] Finish Attempt marks the exam as `completed` in DB.
