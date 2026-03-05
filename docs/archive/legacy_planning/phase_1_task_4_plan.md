# Implementation Plan: Phase 1 - Task 4 (ExamEngine Unit Tests)

This task implements unit tests for the `ExamEngine`, which is the core orchestrator of the student examination experience.

## Proposed Changes

### [Component: API Server]
#### [NEW] [exam.engine.test.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/exam-engine/__tests__/exam.engine.test.ts)
- **Target**: [apps/api-server/src/modules/exam-engine/exam.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/exam-engine/exam.engine.ts).
- **Mocking Strategy**:
  - `@quiz/db` (Mock query methods and transaction blocks)
  - `SelectionEngine` (Mock question selection logic)
  - `ScoringEngine` (Mock result calculation)
  - `CacheService` (Mock Redis get/set)

## Test Scenarios

### 1. Start Exam Flow
- [ ] Create exam record successfully.
- [ ] Verify idempotency: calling with same `idempotencyKey` returns existing exam instead of creating new one.
- [ ] Verify question selection is triggered correctly.

### 2. Submit Answer Flow
- [ ] Successfully record an answer.
- [ ] **Validation**: Reject answer if exam doesn't belong to user.
- [ ] **Validation**: Reject answer if exam status is not 'active'.
- [ ] **Validation**: Reject answer if timer has already expired.

### 3. Complete Exam Flow
- [ ] Mark exam as 'processing' successfully.
- [ ] **CAS (Compare-And-Swap)**: Verify that double-completion attempts are blocked (only first one succeeds).
- [ ] Trigger async scoring successfully.

## Verification Plan

### Automated Tests
- Run `pnpm test exam.engine` from the root.
- Achieve **90%+ line coverage** for the `exam.engine.ts` file.

### Manual Verification
- None required; purely automated logic verification.
