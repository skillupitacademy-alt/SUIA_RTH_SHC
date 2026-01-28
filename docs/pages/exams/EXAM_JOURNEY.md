# 🎓 Exam User Journey
**Path**: `docs/pages/exams/EXAM_JOURNEY.md`

This document covers the lifecycle of a User taking an Exam, from configuration to submission.


### Codebase Inventory (Traceability)
**Frontend** (`apps/web-app/src/app/quiz/`)
- `new/page.tsx`: Blueprint Configuration (Start Exam).
- `active-session/page.tsx`: The actual exam taking interface.

**Components** (`apps/web-app/src/components/quiz/`)
- `QuizSelection.tsx`: Domain/Topic selector form.
- `ExamInterface.tsx`: Question renderer, timer, and navigation logic.

---

## 1. Start Exam (Configuration)

*Source: start-exam.md*

### Purpose
Allow users to generate a custom exam blueprint.

### Expected Behavior
1. **Select Domain**: (e.g., Frontend).
2. **Select Topics**: Filtered based on Domain.
3. **Configure**: Difficulty (Simple/Intermediate/Expert) + Question Count.
4. **Action**: "Start Exam" -> Generates Blueprint -> Redirects to Session.

### UI Rules
- Prevent starting with 0 topics.
- Show dynamic topic loading.

### Data Contract
- **Endpoint**: `POST /api/quiz/create`
- **Input**: `{ domainId, topicIds[], difficulty, count }`
- **Output**: `{ examId: string }`

---

## 2. Exam Session (Active Attempt)
*Source: exam-session.md*

### Purpose
The isolated environment where the user answers questions.

### Interface Rules
- **Distraction Free**: No headers/footers.
- **Progress**: "Question 5 of 20".
- **Navigation**: Next/Previous/Review.
- **Persistence**: Answers sync to DB immediately on selection.

### Logic
- **Endpoint**: `POST /api/quiz/answer` (On Selection).
- **Endpoint**: `POST /api/quiz/finish` (On Submit).

### Verification
- [ ] Answers persist on refresh.
- [ ] Timer tracks duration (if timed).
- [ ] Submit redirects to **Report Page**.
