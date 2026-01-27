# 🚶 Walkthrough: Exam Generation Granularity Fix

**Target**: Hierarchical and Additive Question Selection
**Status**: IMPLEMENTED & VERIFIED (Logic)

## 1. Problem Addressed
Previously, the exam engine used an **Exclusive Priority** logic:
- If you selected a Subtopic, it would ignore all other selected Subjects and Topics.
- In the Enterprise flow, selecting multiple subjects but focusing on a specific topic in one of them would cause the engine to exclude all questions from the other subjects.

## 2. Changes Implemented

### Deepest Selection Union (Additive Logic)
The engine now resolves "Leaf Selections" across the hierarchy:
- **Rule**: A selection at level $N$ (e.g. Subtopic) narrowed the branch, replacing its parent in the filter set.
- **Aggregation**: The final pool is the **Union** of all leaf selections.
  - Example: Selecting **Subject A**, **Subject B**, and **Topic A.1** result in a pool containing:
    - All questions from **Topic A.1** (narrowing Subject A).
    - All questions from **Subject B** (not narrowed).

### Parameter Alignment
Fixed a critical mismatch where the API route was passing subject arrays incorrectly to the selection engine.
- [x] Updated `POST /api/quiz/start` to pass `subjectIds`, `topicIds`, and `subtopicIds`.
- [x] Updated `SelectionEngine` to accept plural arrays and handle legacy fallbacks gracefully.
- [x] Relaxed strict validation in `SelectionEngine` to support dynamic enterprise blueprints.

### Syncing Services
Synced the fetching logic between `ExamBlueprintService` (Pool Validation) and `SelectionEngine` (Exam Composition) to ensure they always use the same "Deepest Selection Wins" strategy.

## 🛠️ Files Modified
- [x] `apps/api-server/src/app/api/quiz/start/route.ts`
- [x] `apps/api-server/src/modules/quiz-engine/quiz.engine.ts`
- [x] `apps/api-server/src/modules/selection-engine/selection.service.ts`
- [x] `apps/api-server/src/services/exams/ExamBlueprintService.ts`

---

## 📝 Change Log
### 2026-01-27
- Implemented hierarchical branching union logic.
- Resolved API route vs SelectionEngine parameter mismatch.
- Documented logic in `docs/walkthroughs/WALKTHROUGH_GRANULARITY_FIX.md`.
