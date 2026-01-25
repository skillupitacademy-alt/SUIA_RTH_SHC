# Reports Page – Objective & Contract

---

## Purpose
Provide users with a comprehensive breakdown of their exam performance, highlighting strengths/weaknesses and providing a review mechanism for correct/incorrect answers.

---

## Entry Conditions
- User MUST be authenticated.
- MUST provide a valid `examId` in the URL.
- The exam MUST have a status of `completed`.

---

## Expected Behavior

### Executive Summary
- Display big final score (%).
- Show time taken vs. allocated time.
- Qualitative feedback based on score (e.g., "Industry Ready", "Needs Improvement").

### Performance Analytics
- Breakdown score by Domain/Dimension (e.g., Logic: 80%, Syntax: 40%).
- Use visual charts (Radar or Bar) to represent mastery.

### Question Audit
- List all questions from the exam.
- Show User Answer vs. Correct Answer.
- Provide "Explanation" or "Reasoning" if available in the database.

---

## Data Contract
- Sourced from `apiClient.quiz.getResult(examId)`.
- No mock metrics. Everything derived from `results_by_dimension` and `exams` records.

---

## UI Rules
- Use green/red indicators for Correct/Incorrect status.
- Do NOT show the answer key until the exam is fully submitted.

---
+
+## Verification Checklist
+- [x] Final score matches the sum of correct answers.
+- [x] Dimension breakdown reflects real sub-scores from DB.
+- [x] Review section correctly identifies correct vs incorrect user picks.
