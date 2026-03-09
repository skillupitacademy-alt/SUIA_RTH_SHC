# Sprint 1: Split AuthService (SRP)

Decompose the monolithic [AuthService](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#6-51) into four focused services to improve maintainability and follow the Single Responsibility Principle.

## Proposed Changes

### [Component] apps/api-server/src/modules/auth/

Summary: Split [auth.service.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts) into specialized services.

#### [NEW] [signup.service.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/signup.service.ts)
- Implement [SignupService](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/signup.service.ts#8-94) class with static methods:
    - [signup(email, password, name, ip)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#7-10)
    - [verifyEmail(token, ip)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#31-34)
    - [resendVerification(userId, ip)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/signup.service.ts#72-93)

#### [NEW] [login.service.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/login.service.ts)
- Implement [LoginService](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/login.service.ts#9-97) class with static methods:
    - [login(email, password, ip)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#11-14)
    - [logout(token, userId, ip)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/login.service.ts#65-81)
    - [heartbeat(userId)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#23-26)
    - [touchUserSession(userId)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#27-30)

#### [NEW] [token-refresh.service.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/token-refresh.service.ts)
- Implement [TokenRefreshService](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/token-refresh.service.ts#8-126) class with static method:
    - [refresh(token, ip, examId, requestedAudience)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/token-refresh.service.ts#9-125)

#### [NEW] [password-recovery.service.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/password-recovery.service.ts)
- Implement [PasswordRecoveryService](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/password-recovery.service.ts#9-94) class with static methods:
    - [forgotPassword(email, ip)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/password-recovery.service.ts#10-59)
    - [validateResetToken(token)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#43-46)
    - [resetPassword(token, newPassword, ip)](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#47-50)

#### [MODIFY] [auth.service.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts)
- Refactor to become a thin facade.
- Import the new services and re-export their methods via the [AuthService](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts#6-51) class to ensure zero breakage for existing callers.

## Verification Plan

### Automated Tests
- Run existing authentication tests to ensure no regression:
    - `pnpm --filter @quiz/api-server run test apps/api-server/src/modules/auth/__tests__`
- Run type check to ensure interface consistency:
    - `pnpm --filter @quiz/api-server run build`

### Manual Verification
- N/A (Automated tests and type checking are sufficient for this refactoring as the logic is being moved, not changed).

---

## Task 46: Finalize AdminEngine Split (SRP)

Splitting the overloaded `AdminHierarchyEngine` into entity-specific services.

### [Component] apps/api-server/src/modules/admin-engine/

Summary: Decompose [admin.hierarchy.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.hierarchy.engine.ts) into five specialized engines.

#### [NEW] [admin.domain.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.domain.engine.ts)
- Handles `domains`: get, create, update, delete, batch delete, approve.

#### [NEW] [admin.subject.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.subject.engine.ts)
- Handles `subjects`: get, create, update, delete, batch delete.

#### [NEW] [admin.topic.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.topic.engine.ts)
- Handles [topics](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.subtopic.engine.ts#5-45): get, create, update, delete, batch delete, validate.

#### [NEW] [admin.subtopic.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.subtopic.engine.ts)
- Handles `subtopics`: get, create, update, delete, batch delete.

#### [NEW] [admin.skill.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.skill.engine.ts)
- Handles `skills` and `topicSkills` mapping.

#### [DELETE] [admin.hierarchy.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.hierarchy.engine.ts)
- Removed after logic migration.

#### [MODIFY] [admin.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/admin-engine/admin.engine.ts)
- Point hierarchy-related facade methods to the new entity-specific engines.

## Verification Plan

### Automated Tests
- `pnpm --filter @quiz/api-server run build` (Ensures all facade links are unbroken)

### Manual Verification
- N/A

---

## Task 50: Strategy Pattern — Answer Evaluators (OCP)

Refactor answer evaluation logic to use a Strategy Pattern, allowing for new question types to be added without modifying the core evaluation engine.

### [Component] apps/api-server/src/modules/answer-engine/

Summary: Introduce an interface and concrete strategies for answer evaluation.

#### [NEW] [evaluator.interface.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/answer-engine/evaluators/evaluator.interface.ts)
- Define [IAnswerEvaluator](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/answer-engine/evaluators/evaluator.interface.ts#1-4) interface with [evaluate(correct, user): boolean](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/answer-engine/answer.engine.ts#4-13).

#### [NEW] [mcq.evaluator.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/answer-engine/evaluators/mcq.evaluator.ts)
- Concrete implementation for `mcq` types.

#### [NEW] [code-mcq.evaluator.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/answer-engine/evaluators/code-mcq.evaluator.ts)
- Concrete implementation for `code_mcq` types with normalization.

#### [NEW] [evaluator.registry.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/answer-engine/evaluators/evaluator.registry.ts)
- Map question types to their respective evaluators.

#### [MODIFY] [answer.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/answer-engine/answer.engine.ts)
- Update [evaluate](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/answer-engine/answer.engine.ts#4-13) method to retrieve the correct evaluator from the registry.

## Verification Plan

### Automated Tests
- `pnpm --filter @quiz/api-server run test src/modules/answer-engine/__tests__`
- `pnpm --filter @quiz/api-server run build`

---

## Task 51: Configurable Scoring Dimensions (OCP)

Refactor [ScoringEngine](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/scoring.engine.ts#13-171) to allow for dynamic addition of scoring dimensions without modifying the engine logic.

### [Component] apps/api-server/src/modules/scoring-engine/

Summary: Modularize dimension calculation using a calculator registry.

#### [NEW] [calculator.interface.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/calculators/calculator.interface.ts)
- Define [IDimensionCalculator](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/calculators/calculator.interface.ts#8-15) interface.

#### [NEW] [hierarchy.calculator.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/calculators/hierarchy.calculator.ts)
- Calculator for Domain, Subject, Topic, and Subtopic.

#### [NEW] [difficulty.calculator.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/calculators/difficulty.calculator.ts)
- Calculator for Difficulty dimension.

#### [NEW] [skill.calculator.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/calculators/skill.calculator.ts)
- Calculator for Skill, Category, and Mapping Type.

#### [NEW] [dimension.registry.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/calculators/dimension.registry.ts)
- Registry to hold all active dimension calculators.

#### [MODIFY] [scoring.engine.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/scoring-engine/scoring.engine.ts)
- Delegate dimension gathering to the registry.

## Verification Plan

### Automated Tests
- `pnpm --filter @quiz/api-server run test src/modules/scoring-engine/__tests__`
- `pnpm --filter @quiz/api-server run build`

---

## Task 55: Split QuizStore into Slices (ISP)

Refactor the monolithic `QuizStore` into smaller, focused slices to adhere to the Interface Segregation Principle, making it easier to maintain and test.

### [Component] apps/web-app/src/store/

Summary: Decomposition of `QuizStore` into logical slices.

#### [NEW] [quiz/session.slice.ts](file:///d:/onlinewebsites/quiz-platform/apps/web-app/src/store/quiz/session.slice.ts)
- Manage `isActive`, `examId`, `config`, `isSubmitted`.

#### [NEW] [quiz/content.slice.ts](file:///d:/onlinewebsites/quiz-platform/apps/web-app/src/store/quiz/content.slice.ts)
- Manage `questions`.

#### [NEW] [quiz/interaction.slice.ts](file:///d:/onlinewebsites/quiz-platform/apps/web-app/src/store/quiz/interaction.slice.ts)
- Manage `answers`, `markedForReview`, `currentQuestionIndex`.

#### [NEW] [quiz/timer.slice.ts](file:///d:/onlinewebsites/quiz-platform/apps/web-app/src/store/quiz/timer.slice.ts)
- Manage `timeLeft`.

#### [MODIFY] [quiz-store.ts](file:///d:/onlinewebsites/quiz-platform/apps/web-app/src/store/quiz-store.ts)
- Aggregate all slices into the main `useQuizStore`.

## Verification Plan

### Automated Tests
- `pnpm --filter @quiz/web-app run build`
- Verify that existing quiz components still function correctly.

### Manual Verification
- Start a quiz, answer questions, mark for review, and ensure the timer works.
