# Implementation Plan: Phase 1 - Task 5 (ScoringEngine Unit Tests)

This task implements unit tests for the `ScoringEngine`, which calculates complex multi-dimensional results (Domain, Subject, Topic, Skill, etc.) for completed exams.

## Proposed Changes

### [Component: API Server]
#### [NEW] [scoring.engine.test.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/__tests__/scoring.engine.test.ts)
- **Target**: [apps/api-server/src/modules/scoring-engine/scoring.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/scoring.engine.ts).
- **Mocking Strategy**:
  - `@quiz/db` (Mock all query methods and inserts for `resultsByDimension`).

## Test Scenarios

### 1. Basic Scoring Logic
- [ ] **7/10 Scenario**: Verify that 7 correct and 3 incorrect answers result in exactly 70% overall score.
- [ ] **Perfect Score**: 100% across all dimensions.
- [ ] **Zero Score**: 0% across all dimensions.
- [ ] **Partial Exam**: Verify that unanswered questions are counted as incorrect.

### 2. Multi-Dimensional Breakdown
- [ ] **Domain/Subject Grouping**: Verify that questions spanning multiple domains correctly aggregate scores for each specific domain.
- [ ] **Difficulty/Skill Analysis**: Ensure performance is correctly categorized by difficulty (Easy, Medium, Hard) and skill tags.

### 3. Persistence & State
- [ ] **DB Inserts**: Verify that `resultsByDimension` table receives the correct JSON payloads for all 7 dimensions.
- [ ] **Status Transitions**: 
  - Success: verify exam moves from `processing` -> `completed`.
  - Failure: verify exam moves from `processing` -> `failed` on DB error.

## Verification Plan

### Automated Tests
- Run `pnpm test scoring.engine` from the root.
- Achieve **90%+ line coverage** for the `scoring.engine.ts` file.

### Manual Verification
- None required; purely mathematical and persistence logic verification.
