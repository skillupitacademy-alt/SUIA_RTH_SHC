# Start Exam Page – Objective & Contract

---

## Purpose
Allow users to configure and initiate a new exam session by selecting domains, topics, and difficulty levels.

---

## Entry Conditions
- User MUST be authenticated.
- Unauthorized users MUST be redirected to `/login`.

---

## Expected Behavior

### Configuration UI
- Users select a **Domain** (e.g., Frontend).
- Selecting a Domain dynamically shows related **Topics**.
- Users can choose **Question Count** (e.g., 5, 10, 20).
- Users can choose **Difficulty** (Simple, Intermediate, Expert).

### Session Initiation
- "Start Exam" button creates a new `exam` record in the database via API.
- Redirects to `/quiz/active/[examId]` on success.

---

## Data Contract
- Sourced from `apiClient.quiz.getMetadata()` (for domains/topics).
- No hardcoded topics unless fallback is required.
- Blueprint parameters must be validated before submission.

---

## UI Rules
- Do NOT allow starting an exam with 0 topics selected.
- Show clear loading state when creating the session.

---
+
+## Verification Checklist
+- [x] Domains and Topics fetch from real database.
+- [x] Question count and difficulty reflect in the created exam.
+- [x] Redirect happens with a valid UUID `examId`.
