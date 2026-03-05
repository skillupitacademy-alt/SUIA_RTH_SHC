# PHASE 2: ARCHITECTURAL FOUNDATION (Months 2-3)

> **165 Total Tasks | Phase 2: 53 Tasks (#46-98) | Priority: IMPORTANT**
> Refactor for testability, maintainability, and initial scale.

---

## 2.1 — SOLID PRINCIPLES COMPLIANCE (Tasks 46-58)

---

### Task 46: SRP — Split AdminEngine into 8 Focused Services

**AI Prompt:**

> The `AdminEngine` at `apps/api-server/src/modules/admin-engine/admin.engine.ts` is a 1,630-line God Class that violates the Single Responsibility Principle. It handles 15+ responsibilities: question CRUD, user management, analytics, blueprint management, session management, RBAC, audit logging, metrics, and more.
>
> Read the complete `admin.engine.ts` file to understand every method and group them by responsibility.
>
> Then split it into these focused service files within `apps/api-server/src/modules/admin-engine/`:
>
> 1. **`question-admin.service.ts`** — All question CRUD operations (create, read, update, delete, list, search questions)
> 2. **`user-admin.service.ts`** — All user management (list users, get user details, update user, ban/unban, delete user)
> 3. **`blueprint-admin.service.ts`** — All exam blueprint operations (create, update, delete, list blueprints)
> 4. **`analytics-admin.service.ts`** — All analytics and reporting (content health, exam analytics, performance metrics, user analytics)
> 5. **`session-admin.service.ts`** — Session management (active sessions, terminate session, session history)
> 6. **`rbac-admin.service.ts`** — Role and permission management (assign roles, revoke roles, list roles, check permissions)
> 7. **`audit-admin.service.ts`** — Audit log operations (list audit logs, search logs, export logs)
> 8. **`metrics-admin.service.ts`** — Dashboard metrics and statistics (user counts, exam counts, system metrics)
>
> For each new service file:
> - Move the relevant methods from AdminEngine
> - Keep the same method signatures (so route handlers can be updated with minimal changes)
> - Use static methods for now (DI will be added in Task 57)
> - Import database and other dependencies directly (same as current pattern, will be abstracted in Task 56)
> - Each file should be under 300 lines
>
> Then update `admin.engine.ts` to become a thin facade that re-exports from the new services. This ensures existing route handlers continue to work without immediate changes. Add a deprecation comment: "This facade is deprecated. Import directly from the specific service instead."
>
> Finally, update 2-3 example route files to import from the new services directly (as a migration pattern for the rest).

---

### Task 47: SRP — Split AuthService into Focused Services

**AI Prompt:**

> The `AuthService` at `apps/api-server/src/modules/auth/auth.service.ts` handles 4 distinct responsibilities: signup, login, token refresh, and password recovery. Split it into focused services.
>
> Read the complete `auth.service.ts` file first.
>
> Then create these focused service files within `apps/api-server/src/modules/auth/`:
>
> 1. **`signup.service.ts`** — `SignupService`
>    - `signup(email, password, name)` — User registration
>    - `verifyEmail(token)` — Email verification
>    - `resendVerification(email)` — Resend verification email
>    - All signup-related validation logic
>
> 2. **`login.service.ts`** — `LoginService`
>    - `login(email, password)` — Credential validation and token generation
>    - `logout(userId, sessionId)` — Session termination
>    - Login-related audit logging
>    - Lockout checking (delegates to SecurityService)
>
> 3. **`token-refresh.service.ts`** — `TokenRefreshService`
>    - `refreshToken(token)` — Token rotation
>    - Token reuse detection and family revocation
>    - Refresh token cleanup
>
> 4. **`password-recovery.service.ts`** — `PasswordRecoveryService`
>    - `forgotPassword(email)` — Generate reset token, send email
>    - `resetPassword(token, newPassword)` — Validate token, update password
>    - `validateResetToken(token)` — Check if token is valid and not expired
>
> Keep `auth.service.ts` as a thin facade that re-exports from the new services for backward compatibility, with a deprecation comment.
>
> Update the corresponding route handlers to import from the new services directly (update the auth route files in `apps/api-server/src/app/api/auth/`).

---

### Task 48: SRP — Split ExamInterface Component

**AI Prompt:**

> The `ExamInterface` component at `apps/web-app/src/app/exam/[examId]/page.tsx` (or similar path) is approximately 361+ lines and mixes multiple responsibilities: API calls, timer management, question rendering, navigation, sidebar, and exam state management.
>
> Read the complete exam page component first to understand all the functionality.
>
> Then split it into these focused components within `apps/web-app/src/components/exam/`:
>
> 1. **`ExamTimer.tsx`** — Timer display and countdown logic
>    - Receives total time and elapsed time as props
>    - Displays formatted time remaining (MM:SS)
>    - Visual urgency indicators (yellow at 5 min, red at 1 min)
>    - Emits `onTimeExpired` callback when timer hits zero
>    - Uses `React.memo` to prevent re-rendering the entire exam on each tick
>
> 2. **`ExamQuestionPanel.tsx`** — Single question display
>    - Receives question data, current answer, and onAnswer callback as props
>    - Renders question text, options (MCQ, true/false)
>    - Highlights selected answer
>    - Pure presentational component
>
> 3. **`ExamNavigation.tsx`** — Previous/Next buttons and question number display
>    - Receives currentIndex, totalQuestions, onNavigate callbacks
>    - Previous/Next buttons with disabled states at boundaries
>    - "Submit Exam" button (shown on last question or always visible)
>
> 4. **`ExamSidebar.tsx`** — Question grid and flag system
>    - Displays grid of question numbers
>    - Color-coded: answered, unanswered, flagged, current
>    - Click to jump to specific question
>    - Flag toggle per question
>
> 5. **`ExamHeader.tsx`** — Exam title, timer, and exit button
>    - Combines exam metadata display with ExamTimer
>    - Exit button with confirmation dialog
>
> 6. **`useExamSession.ts`** — Custom hook for exam session management
>    - All API calls (load exam, submit answer, complete exam)
>    - Exam state management (current question, answers, flags)
>    - Auto-save logic
>    - Error handling
>
> Update the main page component (`page.tsx`) to compose these sub-components. The page should be thin — just layout orchestration using the custom hook and rendering the sub-components.

---

### Task 49: SRP — Split QuizSelectionConsole Component

**AI Prompt:**

> The `QuizSelectionConsole` component in the web app is approximately 685 lines implementing a 5-step quiz configuration wizard (domain → subject → topic → subtopic → exam config). This needs to be split into per-step components.
>
> Read the complete `QuizSelectionConsole` component first. It likely lives at `apps/web-app/src/components/quiz/QuizSelection.tsx` or similar path.
>
> Then split it into these focused components within `apps/web-app/src/components/quiz/`:
>
> 1. **`QuizWizard.tsx`** — Main wizard orchestrator
>    - Manages current step state (1-5)
>    - Renders the active step component
>    - Handles step navigation (next, back)
>    - Progress indicator showing which step the user is on
>    - Under 100 lines — just orchestration
>
> 2. **`steps/DomainSelector.tsx`** — Step 1: Domain selection
>    - Fetches and displays available domains
>    - User selects one domain
>    - Emits `onSelect(domainId)` callback
>
> 3. **`steps/SubjectSelector.tsx`** — Step 2: Subject selection
>    - Receives selected domain ID as prop
>    - Fetches and displays subjects for that domain
>    - User selects one or more subjects
>    - Emits `onSelect(subjectIds[])` callback
>
> 4. **`steps/TopicSelector.tsx`** — Step 3: Topic selection
>    - Receives selected subject IDs as props
>    - Fetches and displays topics for those subjects
>    - User selects topics
>    - Emits `onSelect(topicIds[])` callback
>
> 5. **`steps/SubtopicSelector.tsx`** — Step 4: Subtopic selection
>    - Receives selected topic IDs as props
>    - Fetches and displays subtopics
>    - User selects subtopics (or "all")
>    - Emits `onSelect(subtopicIds[])` callback
>
> 6. **`steps/ExamConfigStep.tsx`** — Step 5: Exam configuration
>    - Number of questions selector
>    - Time limit selector
>    - Difficulty preference
>    - "Start Exam" button
>    - Emits `onStartExam(config)` callback
>
> 7. **`useQuizSelection.ts`** — Custom hook for selection state
>    - Manages all selection state across steps
>    - API calls for fetching options at each step
>    - Validation logic
>    - "Start Exam" API call
>
> Each step component should be under 150 lines. The wizard orchestrator should be under 100 lines.

---

### Task 50: OCP — Strategy Pattern for Answer Evaluation

**AI Prompt:**

> The answer evaluation logic in the ExamEngine or ScoringEngine uses a hardcoded `switch(type)` statement to evaluate different question types (multiple_choice, true_false, etc.). This violates the Open/Closed Principle because adding a new question type requires modifying existing code.
>
> First, find the answer evaluation logic — search for `switch` statements related to question type evaluation in:
> - `apps/api-server/src/modules/exam-engine/`
> - `apps/api-server/src/modules/scoring-engine/`
>
> Read the relevant file(s) to understand the current evaluation logic for each question type.
>
> Then implement the Strategy Pattern:
>
> 1. **Create `apps/api-server/src/modules/scoring-engine/evaluators/evaluator.interface.ts`:**
>    - Define `IAnswerEvaluator` interface with method: `evaluate(userAnswer: unknown, correctAnswer: unknown, questionData: QuestionData): EvaluationResult`
>    - Define `EvaluationResult` type: `{ isCorrect: boolean, score: number, partialCredit?: number, feedback?: string }`
>
> 2. **Create concrete evaluators:**
>    - `evaluators/multiple-choice.evaluator.ts` — `MultipleChoiceEvaluator implements IAnswerEvaluator`
>    - `evaluators/true-false.evaluator.ts` — `TrueFalseEvaluator implements IAnswerEvaluator`
>    - `evaluators/fill-in-blank.evaluator.ts` — `FillInBlankEvaluator implements IAnswerEvaluator` (if this type exists or for future use)
>
> 3. **Create `evaluators/evaluator.registry.ts`:**
>    - A registry that maps question type strings to evaluator instances
>    - `registerEvaluator(type: string, evaluator: IAnswerEvaluator)` — Add new evaluator
>    - `getEvaluator(type: string): IAnswerEvaluator` — Get evaluator for type
>    - Pre-register all built-in evaluators on module load
>    - Throws descriptive error for unregistered types
>
> 4. **Update the scoring/evaluation code** to use the registry instead of the switch statement:
>    - Replace `switch(question.type) { case 'multiple_choice': ... }` with `evaluatorRegistry.getEvaluator(question.type).evaluate(...)`
>
> Now, adding a new question type requires ONLY creating a new evaluator class and registering it — zero changes to existing code. This is the Open/Closed Principle in action.

---

### Task 51: OCP — Configurable Scoring Dimensions

**AI Prompt:**

> The scoring algorithm in `apps/api-server/src/modules/scoring-engine/scoring.engine.ts` has hardcoded scoring dimensions and weight calculations in a loop body. Changing the scoring logic requires modifying existing code, violating the Open/Closed Principle.
>
> Read the complete `scoring.engine.ts` file to understand:
> - What dimensions are scored (domain, subject, topic, skill, difficulty, skillCategory, mappingType)
> - How scores are calculated for each dimension
> - How results are aggregated and stored
>
> Then refactor to make scoring configurable:
>
> 1. **Create `apps/api-server/src/modules/scoring-engine/scoring.config.ts`:**
>    - Define a `ScoringConfig` type that specifies:
>      - Which dimensions to score (enable/disable per dimension)
>      - Weight multipliers per dimension (e.g., domain: 1.0, skill: 1.5)
>      - Minimum questions threshold per dimension (don't score if fewer than N questions)
>      - Passing threshold per dimension (e.g., 70% to pass)
>    - Export a default config matching current behavior
>    - Allow per-blueprint config overrides (blueprints can customize scoring)
>
> 2. **Create `apps/api-server/src/modules/scoring-engine/dimension-scorer.ts`:**
>    - `IDimensionScorer` interface: `score(answers: AnswerSet, dimension: string): DimensionResult`
>    - `DefaultDimensionScorer` — Implements the current percentage-based scoring
>    - `WeightedDimensionScorer` — Applies weight multipliers from config
>    - Each scorer is a separate, testable unit
>
> 3. **Refactor `scoring.engine.ts`** to:
>    - Accept `ScoringConfig` (or load from blueprint)
>    - Iterate over configured dimensions using the scorer instances
>    - New dimension = add to config + optionally new scorer. Zero changes to existing engine code.
>
> 4. **Store the scoring config with results** so historical exams can be re-scored with the same config that was active when they were taken.

---

### Task 52: LSP — Split Token Verification Functions

**AI Prompt:**

> The `TokenService.verifyAccessToken(token, isAdmin?)` function at `apps/api-server/src/modules/auth/token.service.ts` violates the Liskov Substitution Principle by having 3 different behaviors based on a boolean flag:
> - `isAdmin = undefined` → verifies with JWT_SECRET
> - `isAdmin = true` → verifies with ADMIN_JWT_SECRET
> - `isAdmin = false` → verifies with JWT_SECRET
>
> A caller cannot substitute one call for another — the behavior changes based on a hidden flag. This makes the code confusing and error-prone.
>
> Read the complete `token.service.ts` file to understand all token operations.
>
> Then refactor:
>
> 1. **Replace the single function with explicit, separate functions:**
>    - `verifyUserAccessToken(token: string): Promise<UserTokenPayload>` — Always uses JWT_SECRET, returns user-typed payload
>    - `verifyAdminAccessToken(token: string): Promise<AdminTokenPayload>` — Always uses ADMIN_JWT_SECRET, returns admin-typed payload
>    - `verifyRefreshToken(token: string): Promise<RefreshTokenPayload>` — Uses JWT_REFRESH_SECRET, returns refresh-typed payload
>
> 2. **Define distinct payload types:**
>    - `UserTokenPayload { userId: string, email: string, roles: string[] }`
>    - `AdminTokenPayload { userId: string, email: string, roles: string[], isAdmin: true, adminScope: string[] }`
>    - `RefreshTokenPayload { userId: string, tokenFamily: string }`
>
> 3. **Update all callers** — search the entire codebase for `verifyAccessToken` calls and update to the appropriate specific function:
>    - Auth middleware for user routes → `verifyUserAccessToken`
>    - Auth middleware for admin routes → `verifyAdminAccessToken`
>    - Refresh endpoint → `verifyRefreshToken`
>
> 4. **Mark the old function as deprecated** with a JSDoc `@deprecated Use verifyUserAccessToken or verifyAdminAccessToken instead` (remove in next release).
>
> Each function now has a single, predictable behavior. No boolean flags, no hidden branching.

---

### Task 53: LSP — Fix AdminClient Return Types

**AI Prompt:**

> The `AdminClient` at `packages/api-client/src/modules/admin-client.ts` has 60+ methods that all return `any` type — there is zero type safety on admin API responses. This means the TypeScript compiler cannot catch errors when admin components access properties that don't exist.
>
> Read the complete `admin-client.ts` file to understand all methods and what they return.
>
> Then read the corresponding API route handlers in `apps/api-server/src/app/api/admin/` to understand what each endpoint actually returns.
>
> Create proper return types:
>
> 1. **Create `packages/api-client/src/types/admin.types.ts`:**
>    - Define return types for every admin API method based on what the server actually returns
>    - Group types by domain:
>      - `AdminUserListResponse`, `AdminUserDetailResponse`
>      - `AdminQuestionListResponse`, `AdminQuestionDetailResponse`
>      - `AdminBlueprintListResponse`, `AdminBlueprintDetailResponse`
>      - `AdminAnalyticsResponse`, `AdminMetricsResponse`
>      - `AdminAuditLogResponse`
>      - `AdminSessionListResponse`
>      - etc.
>    - Use the actual database schema types from `@quiz/db` as reference for entity shapes
>
> 2. **Update `admin-client.ts`** to replace all `any` return types with the proper typed responses:
>    - `async getUsers(): Promise<AdminUserListResponse>` instead of `async getUsers(): Promise<any>`
>    - Do this for ALL 60+ methods
>
> 3. **Add generic pagination type:**
>    - `PaginatedResponse<T> { data: T[], total: number, page: number, pageSize: number, hasMore: boolean }`
>    - Apply to all list methods
>
> 4. **Export all types** from the package index so consuming apps can import them

---

### Task 54: ISP — Split AdminClient into Role-Based Interfaces

**AI Prompt:**

> The `AdminClient` at `packages/api-client/src/modules/admin-client.ts` is a fat interface with 60+ methods. Any component that needs just one admin method depends on the entire interface. This violates the Interface Segregation Principle.
>
> Read the complete `admin-client.ts` to understand all methods.
>
> Then split it into focused, role-based client modules:
>
> 1. **`packages/api-client/src/modules/admin/question-admin-client.ts`** — `QuestionAdminClient`
>    - All question CRUD methods (list, get, create, update, delete, search, bulk upload)
>    - Only depends on question-related API endpoints
>
> 2. **`packages/api-client/src/modules/admin/user-admin-client.ts`** — `UserAdminClient`
>    - All user management methods (list, get, update, ban, delete, change role)
>
> 3. **`packages/api-client/src/modules/admin/blueprint-admin-client.ts`** — `BlueprintAdminClient`
>    - Blueprint CRUD methods
>
> 4. **`packages/api-client/src/modules/admin/analytics-admin-client.ts`** — `AnalyticsAdminClient`
>    - All analytics and metrics methods
>
> 5. **`packages/api-client/src/modules/admin/audit-admin-client.ts`** — `AuditAdminClient`
>    - Audit log methods
>
> 6. **`packages/api-client/src/modules/admin/session-admin-client.ts`** — `SessionAdminClient`
>    - Session management methods
>
> 7. **`packages/api-client/src/modules/admin/rbac-admin-client.ts`** — `RbacAdminClient`
>    - Role and permission management methods
>
> Each client should:
> - Use the shared `FetchClient` for HTTP requests (read `packages/api-client/src/core/fetch-client.ts` for the shared HTTP layer)
> - Have properly typed return values (from Task 53)
> - Be independently importable
>
> Keep `admin-client.ts` as a facade that combines all sub-clients for backward compatibility, with a deprecation notice.
>
> Update `packages/api-client/src/index.ts` to export both the individual clients AND the combined facade.

---

### Task 55: ISP — Split Zustand QuizState into Focused Slices

**AI Prompt:**

> The Zustand quiz store at `apps/web-app/src/store/quiz-store.ts` bundles all quiz state and actions into a single monolithic store. Components that only need `timeLeft` subscribe to the entire store and re-render when any state changes.
>
> Read the complete `quiz-store.ts` file to understand all state and actions.
>
> Then split it into focused slices:
>
> 1. **`apps/web-app/src/store/quiz/quiz-config-slice.ts`** — Quiz configuration state
>    - Selected domain, subjects, topics, subtopics
>    - Question count, time limit, difficulty preference
>    - Actions: setDomain, setSubjects, setTopics, setConfig, resetConfig
>    - This state changes only during quiz setup (Steps 1-5), never during exam
>
> 2. **`apps/web-app/src/store/quiz/quiz-session-slice.ts`** — Active exam session state
>    - Exam ID, questions array, current question index
>    - Answers map (questionId → answer)
>    - Flagged questions set
>    - Actions: loadExam, submitAnswer, flagQuestion, navigateToQuestion
>    - Persisted to localStorage for crash recovery
>
> 3. **`apps/web-app/src/store/quiz/quiz-timer-slice.ts`** — Timer-specific state
>    - timeRemaining, isRunning, isPaused
>    - Actions: startTimer, tick, pauseTimer, resetTimer
>    - This slice updates every second — isolating it prevents re-renders in non-timer components
>
> 4. **`apps/web-app/src/store/quiz/quiz-ui-slice.ts`** — UI state
>    - Sidebar visibility, confirmation dialogs, loading states
>    - Actions: toggleSidebar, showConfirmation, setLoading
>
> 5. **`apps/web-app/src/store/quiz-store.ts`** — Combined store (updated)
>    - Use Zustand's slice pattern to combine all slices into one store
>    - Export individual slice hooks for focused subscriptions:
>      - `useQuizConfig(selector)` — For quiz setup components
>      - `useQuizSession(selector)` — For exam components
>      - `useQuizTimer(selector)` — For timer components only
>      - `useQuizUI(selector)` — For UI state
>    - Keep backward-compatible `useQuizStore()` that returns everything (with deprecation notice)
>
> Show how components should migrate: `const timeLeft = useQuizTimer(s => s.timeRemaining)` instead of `const { timeLeft } = useQuizStore()`.

---

### Task 56: DIP — Implement Repository Pattern

**AI Prompt:**

> Currently, every service in the Quiz Platform directly imports `db` from `@quiz/db` and executes SQL queries inline. This tight coupling makes services untestable (can't mock the database) and violates the Dependency Inversion Principle.
>
> I need to implement the Repository Pattern to abstract data access behind interfaces.
>
> First, read these service files to understand what database operations they perform:
> - `apps/api-server/src/modules/exam-engine/exam.engine.ts`
> - `apps/api-server/src/modules/scoring-engine/scoring.engine.ts`
> - `apps/api-server/src/modules/auth/auth.service.ts`
> - `apps/api-server/src/modules/domain/hierarchy.factory.ts`
>
> Then create repository interfaces and implementations:
>
> 1. **Create `apps/api-server/src/repositories/interfaces/` directory:**
>
>    - `exam.repository.interface.ts` — `IExamRepository`
>      - `createExam(data): Promise<Exam>`
>      - `findExamById(id): Promise<Exam | null>`
>      - `findExamsByUser(userId, status?): Promise<Exam[]>`
>      - `updateExamStatus(id, status): Promise<void>`
>      - `atomicStatusTransition(id, fromStatus, toStatus): Promise<boolean>` (for CAS)
>      - `addExamQuestions(examId, questions): Promise<void>`
>      - `submitAnswer(examId, questionId, answer, timeSpent): Promise<void>`
>      - `getExamWithAnswers(examId): Promise<ExamWithAnswers>`
>
>    - `user.repository.interface.ts` — `IUserRepository`
>      - `findByEmail(email): Promise<User | null>`
>      - `findById(id): Promise<User | null>`
>      - `create(data): Promise<User>`
>      - `updatePassword(userId, hashedPassword): Promise<void>`
>      - `verifyEmail(userId): Promise<void>`
>
>    - `question.repository.interface.ts` — `IQuestionRepository`
>      - `findByFilters(filters): Promise<Question[]>`
>      - `findById(id): Promise<Question | null>`
>      - `create(data): Promise<Question>`
>      - `bulkCreate(data[]): Promise<Question[]>`
>
>    - `score.repository.interface.ts` — `IScoreRepository`
>      - `saveResults(examId, results[]): Promise<void>`
>      - `getResultsByExam(examId): Promise<DimensionResult[]>`
>
> 2. **Create `apps/api-server/src/repositories/implementations/` directory:**
>
>    - `drizzle-exam.repository.ts` — Implements `IExamRepository` using Drizzle ORM
>    - `drizzle-user.repository.ts` — Implements `IUserRepository` using Drizzle ORM
>    - `drizzle-question.repository.ts` — Implements `IQuestionRepository` using Drizzle ORM
>    - `drizzle-score.repository.ts` — Implements `IScoreRepository` using Drizzle ORM
>
>    Each implementation imports `db` from `@quiz/db` and translates interface methods into Drizzle queries. Move the existing inline SQL from service files into these implementations.
>
> 3. **Create `apps/api-server/src/repositories/index.ts`:**
>    - Export all interfaces and implementations
>    - Create a `createRepositories()` factory that instantiates all implementations
>
> Do NOT update the services to use repositories yet — that happens in Task 58 after DI is set up. This task only creates the repository layer.

---

### Task 57: DIP — Add Dependency Injection Container

**AI Prompt:**

> All services in the Quiz Platform use `static` methods and directly import their dependencies. This makes dependency injection impossible and prevents mocking for tests. I need to add a DI container.
>
> First, evaluate the DI options for a Next.js/TypeScript project:
> - `tsyringe` — Lightweight, decorator-based DI from Microsoft
> - `inversify` — Feature-rich DI with interface binding
> - Manual DI — Simple constructor injection without a framework
>
> For a Next.js serverless project, recommend and implement the SIMPLEST approach that works. Since Next.js API routes are essentially functions (not long-lived server instances), a heavy DI framework may be overkill. A lightweight composition root pattern may be more appropriate.
>
> Implement the chosen approach:
>
> 1. **Create `apps/api-server/src/container.ts`** — The composition root
>    - Instantiate all repositories (from Task 56)
>    - Instantiate all services with their repository dependencies injected
>    - Export a singleton `container` object with all service instances
>    - Handle the serverless lifecycle (services may be re-created per cold start)
>
> 2. **Create service interfaces** for the major services:
>    - `IExamEngine` — interface for exam engine methods
>    - `IScoringEngine` — interface for scoring engine methods
>    - `IAuthService` — interface for auth service methods
>    - `ICacheService` — interface for cache service methods
>
> 3. **Show the pattern** for how a service would be refactored:
>    - Before: `class ExamEngine { static async startExam(...) { const questions = await db.query... } }`
>    - After: `class ExamEngine { constructor(private examRepo: IExamRepository, private questionRepo: IQuestionRepository, private selectionEngine: ISelectionEngine) {} async startExam(...) { const questions = await this.examRepo... } }`
>
> 4. **Show how route handlers would get services:**
>    - `import { container } from '@/container'; const result = await container.examEngine.startExam(...);`
>
> 5. **Show how tests would use this:**
>    - `const mockExamRepo = { findById: vi.fn(), ... }; const engine = new ExamEngine(mockExamRepo, mockQuestionRepo, mockSelectionEngine);`
>
> Implement the container and interfaces. Refactor ONE service (ExamEngine) as the complete example. The remaining services will be migrated gradually.

---

### Task 58: DIP — Convert Static Methods to Instance Methods with DI

**AI Prompt:**

> Following from Task 57 (DI container), I need to convert the remaining major services from static methods with direct imports to instance methods with constructor-injected dependencies.
>
> The ExamEngine was already converted as an example in Task 57. Now convert these remaining services:
>
> 1. **`ScoringEngine`** at `apps/api-server/src/modules/scoring-engine/scoring.engine.ts`
>    - Dependencies to inject: `IExamRepository`, `IScoreRepository`, `IQuestionRepository`
>    - Convert all `static` methods to instance methods
>    - Constructor receives repository interfaces
>
> 2. **`SelectionEngine`** at `apps/api-server/src/modules/selection-engine/selection.service.ts`
>    - Dependencies to inject: `IQuestionRepository`
>    - Convert static methods to instance methods
>
> 3. **`AuthService`** (the sub-services from Task 47: SignupService, LoginService, etc.)
>    - Dependencies to inject: `IUserRepository`, `ITokenService`, `ISecurityService`, `IEmailService`, `IAuditService`
>    - Convert static methods to instance methods
>
> 4. **`CacheService`** at `apps/api-server/src/modules/core/cache.service.ts`
>    - Dependencies to inject: Redis client configuration
>    - Convert static methods to instance methods
>
> 5. **Update the composition root** (`apps/api-server/src/container.ts`) to wire up all converted services with their dependencies
>
> 6. **Update ALL route handlers** that reference the converted services to use `container.serviceName` instead of `ServiceName.staticMethod()`
>    - Search for all imports of the converted services across route files
>    - Update each route to use the container
>
> 7. **Update ALL test files** (from Tasks 3-10) to use constructor injection with mocks instead of `vi.mock()` module mocking. This is a cleaner testing pattern.
>
> This is a large refactor. Prioritize correctness — every existing behavior must be preserved. Run the existing tests after each service conversion to verify nothing breaks.

---

## 2.2 — DESIGN PATTERNS IMPLEMENTATION (Tasks 59-68)

---

### Task 59: Strategy Pattern for Answer Evaluation

**AI Prompt:**

> This task extends Task 50 (which created the evaluator interface and registry). Now I need to fully implement and integrate the Strategy Pattern for answer evaluation.
>
> Read the evaluator interface, concrete evaluators, and registry created in Task 50. Then:
>
> 1. **Enhance the evaluators with edge case handling:**
>
>    - `MultipleChoiceEvaluator`:
>      - Handle single-answer MCQ (one correct option)
>      - Handle multi-answer MCQ (multiple correct options) with partial credit
>      - Handle case-insensitive comparison
>      - Handle null/undefined user answer (unanswered)
>
>    - `TrueFalseEvaluator`:
>      - Handle boolean and string representations ("true"/"false", true/false)
>      - Handle null/undefined user answer
>
>    - `FillInBlankEvaluator`:
>      - Case-insensitive comparison
>      - Trim whitespace
>      - Optional: accept multiple correct answers (aliases)
>      - Handle null/undefined user answer
>
> 2. **Add scoring strategies:**
>    - `BinaryScoring` — 1 for correct, 0 for wrong (current behavior)
>    - `PartialCreditScoring` — For multi-answer MCQ: score = correct_selected / total_correct
>    - `NegativeMarkingScoring` — Deduct points for wrong answers (configurable penalty)
>    - Make scoring strategy configurable per exam blueprint
>
> 3. **Write comprehensive unit tests** for each evaluator:
>    - Test file per evaluator in `evaluators/__tests__/`
>    - Cover all edge cases listed above
>    - Cover the scoring strategies
>
> 4. **Integrate with ScoringEngine** — Update the scoring engine to use the evaluator registry and scoring strategies

---

### Task 60: Strategy Pattern for Scoring Algorithms

**AI Prompt:**

> I need to implement interchangeable scoring strategies that can be configured per exam blueprint. Currently there's only one hardcoded scoring algorithm.
>
> Read the current scoring logic in `apps/api-server/src/modules/scoring-engine/scoring.engine.ts`.
>
> Then implement:
>
> 1. **Create `apps/api-server/src/modules/scoring-engine/strategies/scoring-strategy.interface.ts`:**
>    - `IScoringStrategy` interface:
>      - `calculateOverallScore(answers: EvaluatedAnswer[]): number`
>      - `calculateDimensionScores(answers: EvaluatedAnswer[], dimension: string): DimensionScore[]`
>      - `getName(): string`
>
> 2. **Create concrete strategies:**
>
>    - `strategies/percentage-scoring.strategy.ts` — `PercentageScoringStrategy`
>      - Current behavior: correct / total * 100
>      - Simple and straightforward
>
>    - `strategies/weighted-scoring.strategy.ts` — `WeightedScoringStrategy`
>      - Different weights per difficulty: easy=1, medium=2, hard=3
>      - Score = sum(weight * correct) / sum(weight * total) * 100
>      - Hard questions count more than easy ones
>
>    - `strategies/irt-scoring.strategy.ts` — `IRTScoringStrategy` (Item Response Theory)
>      - Simplified IRT: question difficulty affects score impact
>      - Getting a hard question right boosts score more than an easy question
>      - Getting an easy question wrong hurts score more than a hard question
>      - This is how standardized tests (SAT, GRE) work
>
>    - `strategies/mastery-scoring.strategy.ts` — `MasteryScoringStrategy`
>      - Per-topic mastery levels: <50% = novice, 50-75% = developing, 75-90% = proficient, >90% = master
>      - Overall score is derived from mastery distribution
>      - Used for competency-based assessments
>
> 3. **Create `strategies/scoring-strategy.registry.ts`:**
>    - Register all strategies by name
>    - Default strategy: `percentage` (preserves current behavior)
>    - Blueprints can specify strategy name
>
> 4. **Update ScoringEngine** to accept strategy from blueprint config
>
> 5. **Write unit tests** for each scoring strategy with varied answer sets

---

### Task 61: Formal State Machine for Exam Lifecycle

**AI Prompt:**

> The exam status lifecycle (started → processing → completed/failed/abandoned) is currently scattered across 4+ files with transitions validated only by SQL WHERE clauses. I need a formal state machine.
>
> First, find all places where exam status is read or modified:
> - Search for `examStatus`, `status.*exam`, `started`, `processing`, `completed`, `failed`, `abandoned` across the codebase
> - Read each file to understand the current implicit state transitions
>
> Then implement a formal state machine:
>
> 1. **Create `apps/api-server/src/modules/exam-engine/exam-state-machine.ts`:**
>
>    Define the state machine:
>    - **States**: `created`, `started`, `in_progress`, `processing`, `completed`, `failed`, `abandoned`, `expired`
>    - **Transitions** (from → to, with conditions):
>      - `created → started` (when student begins exam)
>      - `started → in_progress` (after first answer submitted)
>      - `in_progress → processing` (when student submits exam OR timer expires)
>      - `processing → completed` (scoring succeeds)
>      - `processing → failed` (scoring fails)
>      - `started → abandoned` (student exits without answering)
>      - `in_progress → abandoned` (student exits with some answers)
>      - `started → expired` (timer runs out with no answers)
>      - `in_progress → expired` (timer runs out during exam)
>
>    - **Guard conditions**: Each transition can have a guard function that validates the transition is allowed
>    - **Side effects**: Each transition can trigger actions (e.g., `processing → completed` triggers notification)
>
> 2. **Implement the state machine class:**
>    - `ExamStateMachine.canTransition(currentState, targetState): boolean`
>    - `ExamStateMachine.transition(examId, targetState): Promise<Exam>` — Validates and executes transition atomically
>    - `ExamStateMachine.getValidTransitions(currentState): State[]` — Returns list of valid next states
>    - Uses the atomic CAS pattern (compare-and-swap) for database updates to prevent race conditions
>
> 3. **Replace all scattered status updates** across the codebase with calls to the state machine
>
> 4. **Add transition logging** — Every transition is logged with: examId, from state, to state, timestamp, triggeredBy
>
> 5. **Write comprehensive tests** covering:
>    - All valid transitions succeed
>    - All invalid transitions are rejected (e.g., `completed → started` should throw)
>    - Concurrent transition attempts (only one succeeds)
>    - Guard condition failures

---

### Task 62: Observer/Event Bus for Application Events

**AI Prompt:**

> The backend of the Quiz Platform has zero event system — everything is procedural and synchronous. I need to implement an application event bus for decoupled communication between services.
>
> 1. **Create `apps/api-server/src/lib/event-bus.ts`:**
>
>    Implement a typed event bus:
>    - `EventBus.emit<T>(eventName: string, payload: T): void` — Publish an event
>    - `EventBus.on<T>(eventName: string, handler: (payload: T) => Promise<void>): void` — Subscribe to an event
>    - `EventBus.off(eventName: string, handler): void` — Unsubscribe
>    - Support multiple handlers per event
>    - Handlers run asynchronously and independently (one handler failure doesn't affect others)
>    - Error handling: log handler failures but don't propagate
>
> 2. **Define application events** in `apps/api-server/src/lib/events.ts`:
>
>    ```
>    // Auth events
>    UserSignedUp { userId, email, timestamp }
>    UserLoggedIn { userId, email, ip, timestamp }
>    UserLoggedOut { userId, sessionId, timestamp }
>    PasswordReset { userId, timestamp }
>    AccountLocked { userId, reason, duration, timestamp }
>
>    // Exam events
>    ExamStarted { examId, userId, blueprintId, questionCount, timestamp }
>    AnswerSubmitted { examId, userId, questionId, isCorrect, timeSpent, timestamp }
>    ExamCompleted { examId, userId, timestamp }
>    ExamAbandoned { examId, userId, answeredCount, totalCount, timestamp }
>    ExamExpired { examId, userId, timestamp }
>
>    // Scoring events
>    ScoringStarted { examId, timestamp }
>    ScoringCompleted { examId, overallScore, timestamp }
>    ScoringFailed { examId, error, timestamp }
>
>    // Admin events
>    QuestionCreated { questionId, createdBy, timestamp }
>    BlueprintUpdated { blueprintId, updatedBy, timestamp }
>    UserBanned { userId, bannedBy, reason, timestamp }
>    ```
>
> 3. **Register event handlers:**
>    - `ExamCompleted` → trigger scoring engine (replace current direct call)
>    - `ExamCompleted` → log to audit trail
>    - `ScoringCompleted` → send email notification to student
>    - `UserSignedUp` → send welcome email
>    - `AccountLocked` → log security event
>    - `UserBanned` → terminate active sessions
>
> 4. **Integrate into 2-3 services** as examples:
>    - Update ExamEngine to emit `ExamStarted`, `AnswerSubmitted`, `ExamCompleted`
>    - Update AuthService to emit `UserSignedUp`, `UserLoggedIn`
>    - Show how event handlers decouple the audit logging from business logic
>
> 5. **Write tests** for the event bus: emission, handling, error isolation, multiple subscribers

---

### Task 63: Builder Pattern for Exam Construction

**AI Prompt:**

> The exam creation process in `ExamEngine.startExam()` takes multiple parameters and has complex construction logic. Implement the Builder Pattern for fluent, readable exam construction.
>
> Read the current exam creation logic in `apps/api-server/src/modules/exam-engine/exam.engine.ts` to understand all the parameters and steps involved in creating an exam.
>
> Then implement:
>
> 1. **Create `apps/api-server/src/modules/exam-engine/exam.builder.ts`:**
>
>    - `ExamBuilder` class with fluent API:
>      - `.forUser(userId: string)` — Set the student taking the exam
>      - `.fromBlueprint(blueprintId: string)` — Set the exam blueprint
>      - `.withQuestionCount(count: number)` — Set number of questions
>      - `.withTimeLimit(minutes: number)` — Set time limit
>      - `.withTopics(topicIds: string[])` — Filter by topics
>      - `.withDifficulty(level: Difficulty)` — Set difficulty preference
>      - `.withIdempotencyKey(key: string)` — Set idempotency key
>      - `.withConfig(config: ExamConfig)` — Set full config object
>      - `.build(): Promise<Exam>` — Validate all required fields and create the exam
>
>    - Validation in `.build()`:
>      - Required: userId, blueprintId, idempotencyKey
>      - Question count must be between 1 and 100
>      - Time limit must be between 1 and 240 minutes
>      - Blueprint must exist and be active
>      - Topics must belong to the blueprint's domain
>
>    - Return a fully constructed `Exam` object with questions selected and stored
>
> 2. **Create a `ReportBuilder`** for exam report construction:
>    - `.forExam(examId)` — Set the exam
>    - `.withDimensionBreakdown()` — Include per-dimension scores
>    - `.withActionPlan()` — Include improvement recommendations
>    - `.withComparison(previousExamId?)` — Include comparison with previous attempt
>    - `.build(): Promise<ExamReport>`
>
> 3. **Update ExamEngine** to use ExamBuilder internally
>
> 4. **Write tests** for the builder: required field validation, optional field defaults, fluent chaining, build with various configurations

---

### Task 64: Decorator Pattern for Audit Logging

**AI Prompt:**

> The AdminEngine (and now its split services from Task 46) has 40+ methods that manually call `AuditService.log()` with boilerplate code. This is repetitive and easy to forget when adding new methods.
>
> Read 5-10 admin service methods to see the audit logging pattern. It likely looks like:
> ```
> async doSomething(data, adminId) {
>   // ... business logic ...
>   await AuditService.log({ action: 'something', userId: adminId, details: { ... } });
>   return result;
> }
> ```
>
> Implement the Decorator Pattern to automate audit logging:
>
> 1. **Create `apps/api-server/src/lib/decorators/audited.ts`:**
>
>    Since TypeScript doesn't have stable decorator support in all environments, implement this as a higher-order function pattern:
>
>    - `audited(action: string, options?: AuditOptions)` — Returns a method decorator/wrapper
>    - `AuditOptions`: `{ extractUserId?: (args) => string, extractDetails?: (args, result) => object, logResult?: boolean }`
>    - The wrapper automatically:
>      - Extracts the admin user ID from the method arguments
>      - Calls the original method
>      - On success: logs audit event with action, userId, details, and result summary
>      - On failure: logs audit event with error details
>      - Returns the original result unchanged
>
> 2. **Create `apps/api-server/src/lib/decorators/timed.ts`:**
>    - `timed(operationName: string)` — Measures execution time
>    - Logs: operation name, duration in ms, success/failure
>    - Useful for performance monitoring (Phase 2 prep)
>
> 3. **Create `apps/api-server/src/lib/decorators/cached.ts`:**
>    - `cached(keyPattern: string, ttlSeconds: number)` — Caches the result
>    - Uses CacheService under the hood
>    - Key pattern supports interpolation: `cached('user:{userId}', 300)` extracts userId from args
>
> 4. **Show migration pattern:**
>    - Before: 10 lines of manual audit logging per method
>    - After: `const createQuestion = audited('question.create')(rawCreateQuestion);`
>    - Apply to 5-10 admin service methods as examples
>
> 5. **Write tests** for each decorator: audited (success, failure, options), timed (timing accuracy), cached (hit, miss, TTL)

---

### Task 65: Repository Pattern Implementation (Complete)

**AI Prompt:**

> This task completes the Repository Pattern started in Task 56. Task 56 created the interfaces and basic implementations. Now I need to add the remaining repositories and ensure full coverage.
>
> Read the repository interfaces and implementations created in Task 56.
>
> Then add these additional repositories:
>
> 1. **`drizzle-session.repository.ts`** — Implements `ISessionRepository`
>    - `createSession(userId, token, expiresAt): Promise<Session>`
>    - `findByToken(token): Promise<Session | null>`
>    - `findByUser(userId): Promise<Session[]>`
>    - `deleteSession(sessionId): Promise<void>`
>    - `deleteAllUserSessions(userId): Promise<void>`
>    - `cleanupExpired(): Promise<number>` (returns count of deleted sessions)
>
> 2. **`drizzle-audit.repository.ts`** — Implements `IAuditRepository`
>    - `log(entry): Promise<void>`
>    - `findByUser(userId, options): Promise<AuditLog[]>`
>    - `findByAction(action, dateRange): Promise<AuditLog[]>`
>    - `findByDateRange(start, end, options): Promise<AuditLog[]>`
>
> 3. **`drizzle-domain.repository.ts`** — Implements `IDomainRepository`
>    - `findAll(): Promise<Domain[]>`
>    - `findWithHierarchy(domainId): Promise<DomainHierarchy>`
>    - `upsertHierarchy(hierarchy): Promise<void>` (moved from HierarchyFactory)
>
> 4. **`drizzle-blueprint.repository.ts`** — Implements `IBlueprintRepository`
>    - `findById(id): Promise<Blueprint | null>`
>    - `findAll(options): Promise<Blueprint[]>`
>    - `create(data): Promise<Blueprint>`
>    - `update(id, data): Promise<Blueprint>`
>    - `delete(id): Promise<void>`
>
> 5. **Update the composition root** (`container.ts`) to include all new repositories
>
> 6. **Add repository-level error handling:**
>    - Create `RepositoryError` base class with subclasses: `NotFoundError`, `DuplicateError`, `TransactionError`
>    - Each repository wraps Drizzle errors into these typed errors
>    - Services can catch specific error types instead of generic database errors
>
> 7. **Write unit tests** for 2-3 repository implementations to verify they correctly translate between Drizzle operations and the interface contract

---

### Task 66: DTO Pattern for API Boundaries

**AI Prompt:**

> Currently, API routes return raw database entities directly to clients, which leaks internal database structure and includes unnecessary fields. I need Data Transfer Objects (DTOs) to define clean API boundaries.
>
> First, read 5-10 API route handlers to see what data they currently return. Check routes in:
> - `apps/api-server/src/app/api/quiz/` — Exam-related endpoints
> - `apps/api-server/src/app/api/admin/` — Admin endpoints
> - `apps/api-server/src/app/api/auth/` — Auth endpoints
>
> Then implement DTOs:
>
> 1. **Create `apps/api-server/src/dtos/` directory with:**
>
>    - `auth.dto.ts`:
>      - `LoginResponseDTO { accessToken, expiresIn, user: UserSummaryDTO }`
>      - `UserSummaryDTO { id, email, name, isVerified, createdAt }`
>      - `SignupResponseDTO { id, email, message }`
>      - Excludes: password hash, internal IDs, role details
>
>    - `exam.dto.ts`:
>      - `ExamStartDTO { examId, questions: QuestionDTO[], timeLimit, startedAt }`
>      - `QuestionDTO { id, text, type, options: OptionDTO[], difficulty }` (NO correct answer!)
>      - `ExamResultDTO { examId, overallScore, timeTaken, dimensions: DimensionScoreDTO[], completedAt }`
>      - `DimensionScoreDTO { dimension, name, score, total, percentage }`
>      - Excludes: correct answers, internal scoring data, raw database fields
>
>    - `admin.dto.ts`:
>      - `AdminUserDTO { id, email, name, roles, isVerified, createdAt, lastLoginAt, examCount }`
>      - `AdminQuestionDTO { id, text, type, difficulty, topic, skills, createdAt, usageCount }`
>      - `AdminDashboardDTO { userCount, examCount, questionCount, recentActivity }`
>      - Includes more detail than student-facing DTOs
>
> 2. **Create mapper functions** in each DTO file:
>    - `toLoginResponseDTO(user, tokens): LoginResponseDTO`
>    - `toExamStartDTO(exam, questions): ExamStartDTO`
>    - `toQuestionDTO(question): QuestionDTO` (strips correct answer!)
>    - `toAdminUserDTO(user): AdminUserDTO`
>
> 3. **Update 5-10 route handlers** to use DTOs instead of returning raw entities. Show the pattern for:
>    - Auth routes (login response)
>    - Exam start route (strip correct answers)
>    - Admin user list route (shaped response)
>
> 4. **CRITICAL SECURITY**: Verify that the exam question DTO NEVER includes the correct answer. The correct answer should only exist server-side until scoring.

---

### Task 67: Factory Pattern for Question Evaluators

**AI Prompt:**

> Extend the evaluator system from Tasks 50 and 59 with a proper Factory Pattern that creates the correct evaluator based on question metadata, not just type.
>
> Read the evaluator registry from Task 50 and the enhanced evaluators from Task 59.
>
> Then implement:
>
> 1. **Create `apps/api-server/src/modules/scoring-engine/evaluators/evaluator.factory.ts`:**
>
>    - `QuestionEvaluatorFactory` class:
>      - `createEvaluator(question: Question): IAnswerEvaluator` — Creates the right evaluator based on:
>        - `question.type` — Primary selection criterion
>        - `question.metadata` — May influence evaluator configuration (e.g., case-sensitive matching)
>        - `question.scoringConfig` — Per-question scoring overrides
>      - Caches evaluator instances by configuration (flyweight optimization)
>
> 2. **Factory handles complex creation logic:**
>    - MCQ with single correct answer → `SingleAnswerMCQEvaluator`
>    - MCQ with multiple correct answers → `MultiAnswerMCQEvaluator` (with partial credit)
>    - True/False → `TrueFalseEvaluator`
>    - Fill-in-blank with exact match → `ExactMatchEvaluator`
>    - Fill-in-blank with fuzzy match → `FuzzyMatchEvaluator`
>    - Unknown type → `DefaultEvaluator` with logging (graceful degradation)
>
> 3. **The factory is the ONLY way to create evaluators** — services never instantiate evaluators directly
>
> 4. **Integration**: Update ScoringEngine to use `QuestionEvaluatorFactory.createEvaluator(question)` for each question
>
> 5. **Write tests**: Factory returns correct evaluator for each question type/configuration combination

---

### Task 68: Null Object Pattern for Graceful Defaults

**AI Prompt:**

> Multiple places in the Quiz Platform codebase return `null` and force callers to add null checks. Implement the Null Object Pattern in key areas to eliminate null propagation.
>
> First, search for common null-check patterns across the codebase:
> - `if (result === null)`, `if (!result)`, `result?.property`, `result ?? default`
> - Focus on repositories, services, and components
>
> Then implement Null Objects for the most common cases:
>
> 1. **`NullUser`** — Represents a non-existent user:
>    - `id: 'null'`, `email: ''`, `name: 'Unknown User'`, `isVerified: false`
>    - All methods return safe defaults
>    - Use case: When displaying a user who has been deleted (e.g., in audit logs)
>
> 2. **`NullExam`** — Represents a non-existent exam:
>    - Status: `'not_found'`, score: 0, questions: []
>    - Use case: When an exam ID doesn't exist (instead of throwing)
>
> 3. **`NullCacheResult`** — Represents a cache miss:
>    - `hit: false`, `data: null`, `source: 'none'`
>    - Cleaner than returning `null` from cache.get()
>
> 4. **`EmptyScoreReport`** — Represents a report with no data:
>    - All scores: 0, dimensions: [], recommendations: []
>    - Use case: Exam that hasn't been scored yet
>
> 5. **Create each Null Object** in a `apps/api-server/src/lib/null-objects/` directory
>
> 6. **Update 3-5 repository methods** to return Null Objects instead of `null`:
>    - `userRepo.findById(id)` returns `NullUser` instead of `null` when user doesn't exist
>    - Consumer can check: `if (user.id === 'null')` or `if (user instanceof NullUser)`
>
> 7. **Document the trade-offs**: When to use Null Object vs throwing an exception vs returning Optional/Maybe
>
> 8. **Write tests**: Verify null objects have safe default values and don't throw on property access

---

## 2.3 — STRUCTURED LOGGING & OBSERVABILITY (Tasks 69-78)

---

### Task 69: Install Pino Logger with JSON Output

**AI Prompt:**

> The Quiz Platform has 183 raw `console.*` calls scattered across 99 files. I need to install and configure a structured logging library.
>
> Install `pino` (fast, JSON-native, low overhead — ideal for serverless) in the `apps/api-server` package.
>
> Create `apps/api-server/src/lib/logger.ts`:
>
> 1. **Logger configuration:**
>    - Output format: JSON in production, pretty-print in development
>    - Base fields on every log entry: `timestamp`, `environment`, `service: 'api-server'`, `version`
>    - Log levels: `fatal`, `error`, `warn`, `info`, `debug`, `trace`
>    - Default level: `info` in production, `debug` in development
>    - Configurable via `LOG_LEVEL` environment variable
>
> 2. **Logger factory:**
>    - `createLogger(module: string)` — Creates a child logger with module context
>    - Example: `const log = createLogger('ExamEngine')` → logs include `module: 'ExamEngine'`
>    - `createRequestLogger(requestId: string, userId?: string)` — Creates a request-scoped logger
>
> 3. **Log entry structure:**
>    ```
>    {
>      level: "info",
>      timestamp: "2024-01-15T10:30:00.000Z",
>      service: "api-server",
>      module: "ExamEngine",
>      requestId: "abc-123",
>      userId: "user-456",
>      message: "Exam started",
>      data: { examId: "exam-789", questionCount: 20 }
>    }
>    ```
>
> 4. **Sensitive data redaction:**
>    - Auto-redact fields named: `password`, `token`, `secret`, `authorization`, `cookie`
>    - Redact email addresses in `data` fields (replace with `***@domain.com`)
>    - Use pino's built-in `redact` configuration
>
> 5. **Export a default logger instance** and the `createLogger` factory
>
> 6. **Add `LOG_LEVEL` to `.env.example`**
>
> Do NOT migrate any existing console.* calls yet — that's Task 73. Only set up the logger infrastructure.

---

### Task 70: Create LoggerService with Log Levels

**AI Prompt:**

> Extend the pino logger from Task 69 with a LoggerService that provides a clean API for the entire application.
>
> Create `apps/api-server/src/lib/logger.service.ts`:
>
> 1. **LoggerService class:**
>    - Wraps pino logger with application-specific methods
>    - `info(message, data?)` — General info logging
>    - `warn(message, data?)` — Warning conditions
>    - `error(message, error?, data?)` — Error with optional Error object (auto-extracts stack trace)
>    - `debug(message, data?)` — Debug information (only in development)
>    - `fatal(message, error?, data?)` — System-critical failures
>    - `security(message, data?)` — Security-related events (uses warn level but adds `category: 'security'` tag)
>    - `performance(operation, durationMs, data?)` — Performance tracking (adds `category: 'performance'` tag)
>    - `audit(action, userId, data?)` — Audit trail (adds `category: 'audit'` tag)
>
> 2. **Request context enrichment:**
>    - `withRequest(requestId, userId?, ip?)` — Returns a new LoggerService instance with request context embedded in all subsequent logs
>    - This means every log from a request handler automatically includes requestId and userId
>
> 3. **Error serialization:**
>    - When an Error object is passed, automatically extract and log:
>      - `error.message`
>      - `error.stack` (in development only, or redacted in production)
>      - `error.code` (if present)
>      - `error.statusCode` (if present, for API errors)
>    - Don't log the full error object (may contain sensitive data)
>
> 4. **Conditional logging utility:**
>    - `logIf(condition, level, message, data?)` — Only logs if condition is true
>    - Useful for: `logger.logIf(processingTime > 1000, 'warn', 'Slow query', { duration: processingTime })`
>
> 5. **Export singleton** and factory for module-specific loggers

---

### Task 71: Add Request Correlation IDs

**AI Prompt:**

> I need to add request correlation IDs so that all logs from a single API request can be traced together. Currently there is no way to connect logs from different services handling the same request.
>
> Implement correlation IDs across the API server:
>
> 1. **Create middleware** at `apps/api-server/src/middleware/correlation-id.middleware.ts`:
>    - On every incoming request:
>      - Check for `X-Request-ID` header (if the client or load balancer already set one, use it)
>      - If no header, generate a new UUID v4
>      - Store the correlation ID in a request-scoped context
>      - Add `X-Request-ID` header to the response (so clients can reference it in bug reports)
>
> 2. **Request context storage:**
>    - Use Node.js `AsyncLocalStorage` to store the correlation ID
>    - Create `apps/api-server/src/lib/request-context.ts`:
>      - `getRequestId(): string | undefined` — Get current request's correlation ID
>      - `getUserId(): string | undefined` — Get current request's authenticated user ID
>      - `withContext(context, fn)` — Run a function within a request context
>    - The logger (from Task 69) automatically includes the correlation ID from AsyncLocalStorage
>
> 3. **Integrate with all API routes:**
>    - The correlation ID middleware should run FIRST, before any other middleware
>    - Show how to integrate with Next.js API routes (middleware.ts or per-route)
>    - All subsequent logs in the request chain automatically include the requestId
>
> 4. **Integrate with Sentry:**
>    - Add correlation ID as a Sentry tag on all error reports
>    - This connects Sentry errors to specific log entries
>
> 5. **Client-side integration:**
>    - Update `packages/api-client/src/core/fetch-client.ts` to:
>      - Generate a client-side request ID for each API call
>      - Send it as `X-Request-ID` header
>      - Log the request ID with client-side errors
>      - This creates end-to-end traceability: client → API → services → database
>
> 6. **Write tests**: Verify correlation ID generation, propagation through AsyncLocalStorage, and response header inclusion

---

### Task 72: Add PII Redaction to Logger

**AI Prompt:**

> The structured logger from Task 69 needs PII (Personally Identifiable Information) redaction to comply with privacy regulations and prevent sensitive data from appearing in logs.
>
> Update `apps/api-server/src/lib/logger.ts` and create `apps/api-server/src/lib/pii-redactor.ts`:
>
> 1. **Field-based redaction (pino built-in):**
>    - Redact these field paths wherever they appear in log data:
>      - `password`, `*.password` → `[REDACTED]`
>      - `token`, `*.token`, `accessToken`, `refreshToken` → `[REDACTED]`
>      - `secret`, `*.secret`, `apiKey` → `[REDACTED]`
>      - `authorization` header → `[REDACTED]`
>      - `cookie` header → `[REDACTED]`
>
> 2. **Content-based redaction (custom):**
>    - Create a `redactPII(data: unknown): unknown` function that:
>      - Detects and masks email addresses: `john.doe@example.com` → `j***@example.com`
>      - Detects and masks IP addresses: `192.168.1.100` → `192.168.***`
>      - Detects and masks phone numbers: `+1234567890` → `+1****7890`
>      - Detects and masks UUIDs that look like user IDs in certain contexts
>      - Recursively processes objects and arrays
>    - Apply this function to log `data` fields before writing
>
> 3. **Allowlist for safe fields:**
>    - Some fields should NEVER be redacted even if they match patterns:
>      - `requestId` (it's a UUID but not PII)
>      - `examId`, `questionId` (internal IDs, not PII)
>      - `action` (audit action name)
>    - Maintain an allowlist of field names that bypass redaction
>
> 4. **Configuration:**
>    - `PII_REDACTION_ENABLED=true` environment variable (always true in production)
>    - In development, optionally disable for easier debugging
>
> 5. **Write tests**: Verify each redaction pattern works, allowlist works, deeply nested data is redacted

---

### Task 73: Migrate All console.* Calls to Structured Logger

**AI Prompt:**

> There are 183 raw `console.log`/`console.error`/`console.warn` calls across 99 files in the Quiz Platform. I need to migrate them all to the structured logger created in Tasks 69-72.
>
> This is a systematic migration task. Follow this process:
>
> 1. **Search for all console.* calls** across:
>    - `apps/api-server/src/` — ALL files
>    - `packages/db/src/` — ALL files
>
> 2. **For each file that has console.* calls:**
>    - Add `import { createLogger } from '@/lib/logger'` at the top
>    - Create a module-specific logger: `const log = createLogger('ModuleName')`
>    - Replace each console.* call:
>      - `console.log('message')` → `log.info('message')`
>      - `console.error('message', error)` → `log.error('message', error)`
>      - `console.warn('message')` → `log.warn('message')`
>      - `console.log('[Cache] hit', key)` → `log.debug('Cache hit', { key })` (convert prefix-based logging to structured data)
>      - `console.log('[QUIZ_START]', data)` → `log.info('Quiz started', data)`
>    - Upgrade log levels appropriately:
>      - Debug/trace info → `log.debug()`
>      - Normal operations → `log.info()`
>      - Potential issues → `log.warn()`
>      - Actual errors → `log.error()`
>      - Security events → `log.security()`
>
> 3. **Add an ESLint rule** to prevent new console.* usage:
>    - Add `'no-console': 'warn'` to the ESLint config (already in Task 16, ensure it's active)
>    - This prevents regression after migration
>
> 4. **Verify no console.* calls remain** in production code (test files can keep console.* if needed)
>
> This is a large task — process files systematically by module. Each file conversion should be independent and not break other files.

---

### Task 74: Install OpenTelemetry for Distributed Tracing

**AI Prompt:**

> I need to add distributed tracing to the Quiz Platform API server using OpenTelemetry, the industry standard for observability.
>
> Install and configure OpenTelemetry in `apps/api-server`:
>
> 1. **Install packages:**
>    - `@opentelemetry/sdk-node` — Main SDK
>    - `@opentelemetry/auto-instrumentations-node` — Auto-instrument HTTP, fetch, etc.
>    - `@opentelemetry/exporter-trace-otlp-http` — Export traces to OTLP collector
>    - `@opentelemetry/resources` — Resource identification
>    - `@opentelemetry/semantic-conventions` — Standard attribute names
>
> 2. **Create `apps/api-server/src/instrumentation.ts`** (Next.js instrumentation hook):
>    - Initialize OpenTelemetry SDK
>    - Configure resource: `service.name: 'quiz-api-server'`, `service.version`, `deployment.environment`
>    - Configure auto-instrumentation for: HTTP requests, fetch calls, PostgreSQL queries
>    - Configure OTLP exporter pointing to `OTEL_EXPORTER_ENDPOINT` env var
>    - Set sampling rate: 100% in development, 10% in production (configurable)
>    - Register shutdown hook for clean trace export on process exit
>
> 3. **Create `apps/api-server/src/lib/tracing.ts`** — Manual span creation utility:
>    - `startSpan(name: string, attributes?: Record<string, string>): Span` — Start a new span
>    - `withSpan<T>(name: string, fn: () => Promise<T>): Promise<T>` — Run function within a span
>    - `addSpanAttribute(key: string, value: string | number): void` — Add attribute to current span
>    - `recordSpanError(error: Error): void` — Record error on current span
>
> 4. **Add manual spans to critical paths:**
>    - `ExamEngine.startExam` — Span with attributes: userId, blueprintId, questionCount
>    - `ScoringEngine.calculateResults` — Span with attributes: examId, questionCount
>    - `SelectionEngine.selectQuestions` — Span with attributes: filters, resultCount
>    - `CacheService.get/set` — Span with attributes: key, hit/miss, source (LRU/Redis)
>
> 5. **Correlate with request IDs** — Link OpenTelemetry trace ID with the correlation ID from Task 71
>
> 6. **Add `OTEL_EXPORTER_ENDPOINT` to `.env.example`**
>
> This sets up the tracing infrastructure. The actual trace visualization (Grafana Tempo, Jaeger) is in Phase 4.

---

### Task 75: Add Trace Spans to Critical Engines

**AI Prompt:**

> Following the OpenTelemetry setup in Task 74, I need to add detailed trace spans to all critical engine methods. This enables performance debugging and bottleneck identification.
>
> Using the `withSpan` utility from Task 74, add spans to:
>
> 1. **ExamEngine** (`apps/api-server/src/modules/exam-engine/exam.engine.ts`):
>    - `startExam` — Parent span wrapping the entire method
>      - Child span: `checkIdempotency` — Idempotency key lookup
>      - Child span: `loadBlueprint` — Blueprint fetch
>      - Child span: `selectQuestions` — Question selection (delegates to SelectionEngine)
>      - Child span: `createExamRecord` — Database insert
>      - Child span: `createExamQuestions` — Bulk question insert
>    - `submitAnswer` — Span with: examId, questionId, timeSpent
>    - `completeExam` — Span with: examId, atomicTransition result
>
> 2. **ScoringEngine** (`apps/api-server/src/modules/scoring-engine/scoring.engine.ts`):
>    - `calculateExamResults` — Parent span
>      - Child span: `fetchExamData` — Load exam + answers
>      - Child span: `evaluateAnswers` — Run evaluators on each answer
>      - Child span: `calculateDimensions` — Multi-dimensional aggregation
>      - Child span: `persistResults` — Write to resultsByDimension table
>      - Child span: `updateExamStatus` — Set status to completed/failed
>    - Add attributes: totalQuestions, correctCount, overallScore, processingTimeMs
>
> 3. **SelectionEngine** (`apps/api-server/src/modules/selection-engine/selection.service.ts`):
>    - `selectQuestions` — Parent span
>      - Child span: `generateAnchor` — SHA-256 anchor computation
>      - Child span: `queryQuestions` — Database query per page
>      - Attributes: requestedCount, availableCount, filterCriteria
>
> 4. **CacheService** (`apps/api-server/src/modules/core/cache.service.ts`):
>    - `get` — Span with attributes: key, source (lru/redis/miss), latencyMs
>    - `set` — Span with attributes: key, ttl
>    - `circuitBreakerTripped` — Event when Redis circuit breaker opens
>
> 5. **Auth middleware chain**:
>    - Span per middleware step: CORS → RateLimit → CSRF → Auth → RBAC
>    - This shows exactly how long each middleware step takes per request
>
> Each span should include:
> - Operation name matching the method name
> - Key attributes for debugging
> - Error recording if the operation fails
> - Status code (OK or ERROR)

---

### Task 76: Create Public Health Check Endpoint

**AI Prompt:**

> The Quiz Platform's health check at `/api/admin/system/usage` requires admin authentication, making it unusable for load balancer probes. I need unauthenticated health endpoints.
>
> Create two new endpoints:
>
> 1. **`apps/api-server/src/app/api/healthz/route.ts`** — Liveness probe:
>    - No authentication required
>    - Returns `200 OK` with `{ status: 'ok', timestamp: ISO8601 }`
>    - Does NOT check external dependencies (this proves the process is alive)
>    - Should respond in <10ms
>    - Add `Cache-Control: no-cache, no-store` header
>
> 2. **`apps/api-server/src/app/api/readyz/route.ts`** — Readiness probe:
>    - No authentication required
>    - Checks all critical dependencies:
>      - **Database**: Execute `SELECT 1` with 5-second timeout
>      - **Redis**: Ping with 2-second timeout
>    - Returns `200 OK` if all checks pass:
>      ```
>      { status: 'ready', checks: { database: 'ok', redis: 'ok' }, timestamp: ISO8601 }
>      ```
>    - Returns `503 Service Unavailable` if any check fails:
>      ```
>      { status: 'not_ready', checks: { database: 'ok', redis: 'error' }, timestamp: ISO8601 }
>      ```
>    - Should respond in <10 seconds (sum of all timeouts)
>    - Cache the result for 10 seconds (don't hammer dependencies on every probe)
>
> 3. **`apps/api-server/src/app/api/healthz/detailed/route.ts`** — Detailed health (admin-only):
>    - Requires admin authentication (existing admin auth middleware)
>    - Returns comprehensive health including:
>      - Database connection pool metrics (from Task 35)
>      - Redis connection status and memory
>      - Cache hit/miss rates
>      - Application uptime
>      - Current active connections
>      - Node.js memory usage and event loop lag
>    - This is for ops dashboards, not load balancers
>
> 4. **Exclude health endpoints from:**
>    - Rate limiting (health probes should never be rate-limited)
>    - CSRF protection (no state changes)
>    - Request logging (too noisy — every 10 seconds from load balancer)
>    - OpenTelemetry tracing (too noisy)

---

### Task 77: Create Readiness Probe Endpoint

**AI Prompt:**

> This task is merged with Task 76 — both health check endpoints are created together. If Task 76 is already completed, skip this task.
>
> If Task 76 was only partially completed (only `/healthz` liveness probe), then create the remaining:
>
> 1. **`/api/readyz` endpoint** — Checks database and Redis connectivity
> 2. **`/api/healthz/detailed` endpoint** — Comprehensive health for admin dashboard
>
> See Task 76 for full specifications.

---

### Task 78: Add Application Metrics Collection

**AI Prompt:**

> I need to add application metrics collection (RED metrics — Rate, Errors, Duration) to the Quiz Platform API server.
>
> Since we're deploying to Vercel (serverless), a traditional Prometheus pull-based approach won't work. Instead, implement push-based metrics:
>
> 1. **Create `apps/api-server/src/lib/metrics.ts`:**
>
>    Implement an in-process metrics collector:
>    - **Counter**: `requestCount` — Total requests by route, method, status code
>    - **Counter**: `errorCount` — Total errors by route, error type
>    - **Histogram**: `requestDuration` — Request latency in ms by route
>    - **Gauge**: `activeRequests` — Currently processing requests
>    - **Counter**: `cacheHitCount` / `cacheMissCount` — Cache effectiveness
>    - **Counter**: `dbQueryCount` — Database queries by type (select/insert/update/delete)
>    - **Histogram**: `dbQueryDuration` — Database query latency
>    - **Counter**: `examStartedCount`, `examCompletedCount`, `examFailedCount` — Business metrics
>
> 2. **Metrics collection middleware:**
>    - Create middleware that wraps every API request
>    - Records: start time, end time, status code, route path
>    - Calculates: duration, increments counters
>    - Stores in memory with periodic flush
>
> 3. **Metrics endpoint** at `/api/admin/metrics`:
>    - Admin-authenticated
>    - Returns current metrics in JSON format:
>      - Per-route: request count, avg/p50/p95/p99 latency, error rate
>      - Overall: total requests, total errors, error percentage
>      - Business: exams started/completed/failed today, active users
>    - Supports time range filter: `?period=1h` (last hour), `?period=24h` (last day)
>
> 4. **Metrics aggregation:**
>    - Since serverless functions are ephemeral, metrics from different instances need aggregation
>    - Use Redis (Upstash) to store metrics centrally:
>      - Increment counters atomically with `INCRBY`
>      - Store latency samples in sorted sets for percentile calculation
>      - Expire old metrics data after 48 hours
>
> 5. **Integrate with Sentry Performance:**
>    - Sentry already tracks transactions (from Tasks 25-27)
>    - Add custom Sentry metrics using `Sentry.metrics.increment()` and `Sentry.metrics.distribution()`
>    - This provides metrics visualization in the Sentry dashboard immediately
>
> 6. **Add metrics to the admin dashboard** (or document how the existing PerformanceAnalyticsBoard can consume these metrics)

---

## 2.4 — FRONTEND OPTIMIZATION (Tasks 79-91)

---

### Task 79: Convert Pages to Server Components

**AI Prompt:**

> Currently 99% of the web app uses `'use client'`. I need to identify pages that can be converted to Server Components for better performance.
>
> Read every `page.tsx` and `layout.tsx` in `apps/web-app/src/app/` and `apps/admin-app/src/app/`.
>
> For each page, determine if it can be a Server Component:
> - **Can be Server Component**: Pages that fetch data on the server and render static/dynamic HTML. Examples: dashboard pages that load data and display it, report pages, profile pages.
> - **Must remain Client Component**: Pages with heavy interactivity, real-time state, or browser APIs. Examples: exam page (timer, answer selection), quiz selection wizard.
>
> For each page that CAN be converted:
>
> 1. Remove `'use client'` directive
> 2. Move data fetching from `useEffect` + `useState` to direct `async` function calls in the server component
> 3. Extract interactive parts into small client component islands:
>    - Keep the page as server component (handles data fetching)
>    - Create small `'use client'` sub-components for interactive elements (buttons, forms)
>    - Pass server-fetched data as props to client components
>
> 4. Show the pattern with 3-5 converted pages as examples:
>    - Dashboard/home page → Server component with client islands for interactive widgets
>    - Reports list page → Server component (data table with pagination)
>    - Profile page → Server component with client form island
>
> Document which pages were converted and which must remain client components, with rationale.

---

### Task 80: Add Dynamic Imports for Heavy Components

**AI Prompt:**

> The web app and admin app load all components synchronously in the initial bundle. I need to add `next/dynamic` for code splitting on heavy components.
>
> First, identify the heaviest components by reading the imports in:
> - `apps/admin-app/src/app/` — Dashboard panels, factory components
> - `apps/web-app/src/app/` — Quiz selection, exam interface
>
> Then add `next/dynamic` imports for:
>
> 1. **Admin app — Dashboard panels** (each panel is independently loaded):
>    - `UserAnalyticsBoard` → `dynamic(() => import('@/components/dashboard/UserAnalyticsBoard'), { loading: () => <DashboardSkeleton /> })`
>    - `ExamActivityBoard` → dynamic import with skeleton
>    - `PerformanceAnalyticsBoard` → dynamic import (loads recharts)
>    - All 9 dashboard panels should be dynamically imported
>    - This is the highest-impact change — admin dashboard loads 9 heavy panels synchronously
>
> 2. **Admin app — Factory components:**
>    - `DistributionMatrix` → dynamic import
>    - `SourceEditor` → dynamic import
>    - `ReviewConsole` → dynamic import
>    - `JsonIngestBox` → dynamic import
>
> 3. **Web app — Quiz components:**
>    - `QuizSelectionConsole` (or split components from Task 49) → dynamic import on the quiz selection page
>    - Report charts/visualizations → dynamic import
>
> 4. **Shared heavy libraries:**
>    - `recharts` → Only load when chart component is visible
>    - Any other large dependencies (check package.json for large libraries)
>
> For each dynamic import:
> - Add appropriate `loading` component (use skeletons from Tasks 30-31)
> - Set `ssr: false` for components that use browser-only APIs
> - Use `suspense: true` where React Suspense boundaries exist
>
> After adding dynamic imports, document the estimated bundle size reduction.

---

### Task 81: Implement next/image for All Images

**AI Prompt:**

> The Quiz Platform uses raw `<img>` tags or CSS background images with unoptimized URLs. I need to convert all image usage to `next/image` for automatic optimization (WebP conversion, lazy loading, responsive sizing).
>
> Search for all image usage across both frontend apps:
> - `<img` tags in all `.tsx` files
> - CSS `background-image` or `backgroundImage` in all `.tsx` and `.css` files
> - Unsplash or other external image URLs
>
> For each image found:
>
> 1. **Replace `<img>` with `<Image>` from `next/image`:**
>    - Add `width` and `height` props (or use `fill` for background-style images)
>    - Add `alt` text for accessibility
>    - Add `priority` for above-the-fold images (hero images, logos)
>    - Add `placeholder="blur"` with `blurDataURL` for large images
>
> 2. **For external images (Unsplash, etc.):**
>    - Add the external domain to `images.remotePatterns` in `next.config.ts` for both apps
>    - Use `next/image` with the external URL — Next.js will optimize automatically
>
> 3. **For CSS background images:**
>    - If possible, convert to `<Image>` with `fill` prop and CSS positioning
>    - If not possible (complex CSS layouts), document why and leave as-is
>
> 4. **For SVG icons:**
>    - Keep as inline SVG or SVG component imports (next/image doesn't optimize SVGs)
>    - Document this distinction
>
> 5. **Update both apps' `next.config.ts`** to include:
>    - `images.remotePatterns` for any external image domains
>    - `images.formats: ['image/avif', 'image/webp']` for modern format support
>    - `images.deviceSizes` and `images.imageSizes` if custom breakpoints are needed

---

### Task 82: Implement next/font for Font Optimization

**AI Prompt:**

> The Quiz Platform references fonts (Outfit, Inter) but doesn't use Next.js font optimization. I need to implement `next/font` for zero-layout-shift font loading.
>
> First, search for all font references across both frontend apps:
> - CSS `font-family` declarations
> - `@font-face` rules
> - `<link>` tags for external fonts (Google Fonts, etc.)
> - Tailwind config `fontFamily` settings
>
> Then implement `next/font`:
>
> 1. **Create font definitions** in the root layout of each app:
>
>    For `apps/web-app/src/app/layout.tsx`:
>    ```
>    import { Inter, Outfit } from 'next/font/google'
>    const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
>    const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })
>    ```
>    Apply CSS variables to `<html>` or `<body>`: `className={`${inter.variable} ${outfit.variable}`}`
>
>    For `apps/admin-app/src/app/layout.tsx`: Same pattern with the admin app's fonts
>
> 2. **Update Tailwind configs** to use CSS variables:
>    - `fontFamily: { sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans], heading: ['var(--font-outfit)', ...] }`
>
> 3. **Remove any external font loading:**
>    - Remove `<link>` tags for Google Fonts in layout files
>    - Remove `@import url()` for fonts in CSS files
>    - `next/font` handles font loading automatically with optimal performance
>
> 4. **Benefits achieved:**
>    - Zero layout shift (font is available at render time)
>    - Self-hosted fonts (no external request to Google Fonts)
>    - Automatic font subsetting (only characters used are loaded)
>    - `font-display: swap` for fast first paint

---

### Task 83: Add React.memo to Frequently Updating Components

**AI Prompt:**

> In the web app's exam interface, the timer updates every second, causing the entire component tree to re-render. I need to add `React.memo` to prevent unnecessary re-renders of components that don't depend on the timer.
>
> First, read the exam page component and all its child components to understand the render tree.
>
> Then add `React.memo` strategically:
>
> 1. **Exam question display** — Only re-render when the question changes (not on timer tick):
>    - Wrap with `React.memo` and compare by `questionId`
>
> 2. **Exam sidebar/question grid** — Only re-render when answers or flags change:
>    - Wrap with `React.memo` and compare by answer count and flag set
>
> 3. **Exam navigation buttons** — Only re-render when current index changes:
>    - Wrap with `React.memo`
>
> 4. **Option buttons/answer choices** — Only re-render when selection changes:
>    - Wrap each option with `React.memo` comparing selected state
>
> 5. **Add `useCallback` for event handlers** passed as props:
>    - `onAnswerSelect`, `onNavigate`, `onFlag` — Wrap with `useCallback` to maintain referential equality
>    - Without `useCallback`, new function references on every render defeat `React.memo`
>
> 6. **Add `useMemo` for derived data:**
>    - If any component computes derived values (filtered lists, sorted items, calculated stats), wrap with `useMemo`
>
> 7. **Also optimize in admin app:**
>    - Dashboard panels that have auto-refresh — Memoize panels that don't change on every refresh
>    - Data tables — Memoize rows that haven't changed
>
> 8. **Verify the optimization works:**
>    - Document how to use React DevTools Profiler to measure re-renders before and after
>    - The exam timer tick should NOT cause question panel, sidebar, or navigation to re-render

---

### Task 84: Fix Zustand Selector Patterns

**AI Prompt:**

> Components in the web app destructure the entire Zustand store, causing re-renders on ANY state change. I need to fix all store subscriptions to use granular selectors.
>
> Search for all Zustand store usage across both apps:
> - `useQuizStore()` in `apps/web-app/`
> - `useAuthStore()` in `apps/web-app/` and `apps/admin-app/`
> - Any other custom stores
>
> For each usage found, convert to granular selectors:
>
> 1. **Before (bad):**
>    ```
>    const { timeLeft, currentQuestion, answers, flags } = useQuizStore()
>    ```
>    This subscribes to ALL store state. Timer tick re-renders this component.
>
> 2. **After (good) — If component needs only one field:**
>    ```
>    const timeLeft = useQuizStore(state => state.timeLeft)
>    ```
>    Only re-renders when `timeLeft` changes.
>
> 3. **After (good) — If component needs multiple fields:**
>    ```
>    const { currentQuestion, answers } = useQuizStore(
>      useShallow(state => ({ currentQuestion: state.currentQuestion, answers: state.answers }))
>    )
>    ```
>    Uses `useShallow` for shallow comparison of the selected object.
>
> 4. **For action-only subscriptions:**
>    ```
>    const submitAnswer = useQuizStore(state => state.submitAnswer)
>    ```
>    Functions are referentially stable in Zustand — this never causes re-renders.
>
> 5. **Apply to EVERY store usage across both apps:**
>    - List every file that imports from a store
>    - Convert each usage to the minimal selector
>    - Import `useShallow` from `zustand/react/shallow` where multiple fields are needed
>
> 6. **Create a lint rule or code comment convention** to prevent regression:
>    - Add a comment at the top of each store file: "Always use selectors: useStore(s => s.field), never useStore()"

---

### Task 85: Add React Query for Server State Management

**AI Prompt:**

> The Quiz Platform uses raw `fetch()` calls in `useEffect` with manual loading/error state management. I need to add React Query (TanStack Query) for proper server state management with caching, deduplication, and retry.
>
> 1. **Install `@tanstack/react-query` and `@tanstack/react-query-devtools`** in both `apps/web-app` and `apps/admin-app`
>
> 2. **Set up QueryClientProvider** in each app's root layout:
>    - Create `apps/web-app/src/providers/query-provider.tsx` — Client component wrapping `QueryClientProvider`
>    - Configure default options:
>      - `staleTime: 5 * 60 * 1000` (5 minutes — data is fresh for 5 min)
>      - `gcTime: 10 * 60 * 1000` (10 minutes — garbage collect after 10 min)
>      - `retry: 2` (retry failed requests twice)
>      - `retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)` (exponential backoff)
>      - `refetchOnWindowFocus: true` (refetch when user returns to tab)
>
> 3. **Create custom hooks using React Query** for the most common data fetching patterns:
>
>    `apps/web-app/src/hooks/queries/`:
>    - `useExamStart.ts` — `useMutation` for starting an exam
>    - `useSubmitAnswer.ts` — `useMutation` for submitting answers (with optimistic updates)
>    - `useExamReport.ts` — `useQuery` for fetching exam reports
>    - `useDomains.ts` — `useQuery` for fetching domain list (long staleTime — rarely changes)
>    - `useSubjects.ts` — `useQuery` with domain ID parameter
>    - `useUserProfile.ts` — `useQuery` for user profile data
>
>    `apps/admin-app/src/hooks/queries/`:
>    - `useAdminUsers.ts` — `useQuery` with pagination parameters
>    - `useAdminQuestions.ts` — `useQuery` with filters
>    - `useDashboardMetrics.ts` — `useQuery` with auto-refresh every 60 seconds
>    - `useCreateQuestion.ts` — `useMutation` with cache invalidation
>
> 4. **Integrate with existing API client:**
>    - React Query hooks should use the existing `apiClient` from `@quiz/api-client` as the fetcher
>    - Example: `useQuery({ queryKey: ['domains'], queryFn: () => apiClient.quiz.getDomains() })`
>
> 5. **Add React Query Devtools** (only in development):
>    - Floating panel showing all queries, their status, cache state, and timing
>
> 6. **Convert 3-5 existing pages** from `useEffect` + `useState` to React Query hooks as examples
>
> Do NOT convert all pages — just set up the infrastructure and show the migration pattern.

---

### Task 86: Add Router Prefetching

**AI Prompt:**

> The web app has no prefetching — every navigation results in a cold page load. I need to add strategic prefetching for likely navigation targets.
>
> Read the navigation patterns in the web app to understand common user flows:
> - Dashboard → Quiz selection → Exam → Report
> - Dashboard → Reports list → Report detail
> - Login → Dashboard
>
> Then implement prefetching:
>
> 1. **Link-based prefetching** — Update Next.js `<Link>` components:
>    - Next.js `<Link>` has `prefetch` prop (defaults to `true` in production)
>    - Ensure all navigation links use `<Link>` from `next/link` (not `<a>` tags or `router.push`)
>    - Search for `<a href=` tags and `window.location` usage — convert to `<Link>`
>    - For less common routes, set `prefetch={false}` to save bandwidth
>
> 2. **Programmatic prefetching** — For predictive navigation:
>    - On the dashboard, prefetch the quiz selection page: `router.prefetch('/quiz')`
>    - On the quiz selection page step 4 (subtopic), prefetch the exam page
>    - After exam completion, prefetch the report page
>    - Use `useEffect` to trigger prefetch when the user is likely to navigate
>
> 3. **Data prefetching** — Using React Query (from Task 85):
>    - On the dashboard, prefetch domain list data (user is likely to start a quiz)
>    - On the reports list, prefetch the first 3 report details (user is likely to click one)
>    - Use `queryClient.prefetchQuery()` in `onMouseEnter` or `useEffect`
>
> 4. **Add `<link rel="preconnect">` and `<link rel="dns-prefetch">`** in root layout for:
>    - API server domain
>    - CDN domain (if using one)
>    - Sentry domain
>
> Document the prefetching strategy and expected performance improvement.

---

### Task 87: Create Shared UI Package (packages/ui)

**AI Prompt:**

> Components like `ZLoader`, `cn()` utility, buttons, inputs, and other UI primitives are duplicated between the web app and admin app. I need to create a shared `packages/ui` package.
>
> First, identify all duplicated UI code:
> - Search for components that exist in both `apps/web-app/src/components/` and `apps/admin-app/src/components/`
> - Search for utility functions duplicated between apps (e.g., `cn()`, `formatDate()`, `formatTimeAgo()`)
>
> Then create the shared package:
>
> 1. **Create `packages/ui/` directory** with:
>    - `package.json` — Name: `@quiz/ui`, define exports
>    - `tsconfig.json` — TypeScript config extending root
>    - `tailwind.config.ts` — Shared Tailwind preset (not a full config — a preset that apps can extend)
>
> 2. **Create shared components** in `packages/ui/src/components/`:
>    - `Button.tsx` — Shared button with variants (primary, secondary, danger, ghost)
>    - `Input.tsx` — Form input with label, error state
>    - `Loader.tsx` — Loading spinner (from ZLoader)
>    - `Skeleton.tsx` — Skeleton loading component
>    - `Card.tsx` — Content card wrapper
>    - `Badge.tsx` — Status badges
>    - `Modal.tsx` — Modal dialog
>    - `Table.tsx` — Data table base component
>    - Any other components found duplicated between apps
>
> 3. **Create shared utilities** in `packages/ui/src/utils/`:
>    - `cn.ts` — Class name merger (tailwind-merge + clsx)
>    - `format-date.ts` — Date formatting utilities
>    - `format-time.ts` — Time formatting (formatTimeAgo, formatDuration)
>
> 4. **Create `packages/ui/src/index.ts`** — Export all components and utilities
>
> 5. **Update `pnpm-workspace.yaml`** to include `packages/ui` if not already included
>
> 6. **Update both apps** to import from `@quiz/ui` instead of local duplicates:
>    - Show 3-5 example migrations in each app
>    - Document the migration pattern for remaining components
>
> Do NOT migrate all components at once — create the package, add the most common shared components, and show the migration pattern.

---

### Task 88: Deduplicate Tailwind Configuration

**AI Prompt:**

> The `tailwind.config.ts` files in `apps/web-app/` and `apps/admin-app/` are 100% identical. I need to extract a shared Tailwind preset.
>
> Read both Tailwind configs to confirm they're identical and understand the full configuration.
>
> Then:
>
> 1. **Create `packages/ui/tailwind.preset.ts`** (or `tailwind-preset.ts`):
>    - Move the shared theme configuration: colors, fonts, spacing, animations, etc.
>    - Move shared plugins configuration
>    - Export as a Tailwind preset
>
> 2. **Update `apps/web-app/tailwind.config.ts`:**
>    - Import the preset: `import sharedPreset from '@quiz/ui/tailwind-preset'`
>    - Use `presets: [sharedPreset]`
>    - Only keep app-specific overrides (content paths, app-specific plugins)
>    - The `content` array must still point to the app's own files AND `packages/ui/src/**/*.tsx`
>
> 3. **Update `apps/admin-app/tailwind.config.ts`:**
>    - Same pattern as web-app
>    - Admin-specific overrides if any
>
> 4. **Verify no visual regressions:**
>    - Document which design tokens are shared
>    - Note any differences between apps (if any exist)

---

### Task 89: Deduplicate Auth Store

**AI Prompt:**

> The auth store at `apps/web-app/src/store/auth-store.ts` and `apps/admin-app/src/store/auth-store.ts` are ~80% identical. I need to extract shared auth logic into a common package.
>
> Read both auth store files to understand:
> - What is identical between them
> - What is different (admin might have admin-specific fields)
>
> Then:
>
> 1. **Create `packages/api-client/src/stores/base-auth-store.ts`** (or a new `packages/shared` package):
>    - Extract the common auth state and actions:
>      - `user`, `accessToken`, `refreshToken`, `isAuthenticated`
>      - `login(credentials)`, `logout()`, `refreshSession()`, `updateProfile()`
>      - localStorage persistence logic
>    - Export as a factory function: `createBaseAuthStore(options)` where options include:
>      - `storageKey` — Different per app (`quiz-platform-auth` vs `admin-auth`)
>      - `loginEndpoint` — Different per app if needed
>      - `redirectOnLogout` — Different per app (`/login` vs `/admin/login`)
>
> 2. **Update `apps/web-app/src/store/auth-store.ts`:**
>    - Import and extend the base store
>    - Add web-app specific state/actions (if any): quiz session tracking, onboarding state
>
> 3. **Update `apps/admin-app/src/store/auth-store.ts`:**
>    - Import and extend the base store
>    - Add admin-specific state/actions: admin scope, managed users context
>
> 4. **Verify both apps still work correctly** after the refactor
>
> The goal is ~80% code reduction through sharing, with each app only maintaining its unique additions.

---

### Task 90: Create Shared useDebounce Hook

**AI Prompt:**

> Seven admin tables each reimplement the same debounce pattern for search functionality. I need to create a shared hook.
>
> First, search for all debounce implementations across both apps:
> - Search for `setTimeout`, `clearTimeout` patterns in hook or component files
> - Search for `debounce` in any imports or variable names
>
> Then:
>
> 1. **Create `packages/ui/src/hooks/use-debounce.ts`:**
>    - `useDebounce<T>(value: T, delayMs: number): T` — Returns debounced value
>    - Cleans up timeout on unmount
>    - Supports changing delay dynamically
>
> 2. **Create `packages/ui/src/hooks/use-debounced-callback.ts`:**
>    - `useDebouncedCallback(callback: Function, delayMs: number): Function` — Returns debounced function
>    - The returned function can be called repeatedly but only executes after `delayMs` of inactivity
>    - Supports `cancel()` and `flush()` methods
>    - Cleans up on unmount
>
> 3. **Create `packages/ui/src/hooks/use-throttle.ts`:**
>    - `useThrottle<T>(value: T, intervalMs: number): T` — Returns throttled value
>    - Only updates at most once per interval (useful for scroll events, resize events)
>
> 4. **Export from `packages/ui/src/hooks/index.ts`**
>
> 5. **Update 3-5 admin table components** to use the shared hook instead of inline debounce logic
>
> 6. **Write tests** for each hook: timing behavior, cleanup on unmount, cancel/flush

---

### Task 91: Add Preconnect Hints for Critical Origins

**AI Prompt:**

> The root layouts of both frontend apps have no DNS prefetch or preconnect hints, causing cold connections on every page load.
>
> Read the root layouts:
> - `apps/web-app/src/app/layout.tsx`
> - `apps/admin-app/src/app/layout.tsx`
>
> Then add preconnect and DNS prefetch hints:
>
> 1. **In both app layouts, add to `<head>`:**
>
>    - `<link rel="preconnect" href="https://YOUR_API_DOMAIN" />` — API server
>    - `<link rel="dns-prefetch" href="https://YOUR_API_DOMAIN" />` — DNS fallback
>    - `<link rel="preconnect" href="https://YOUR_SENTRY_DOMAIN" crossOrigin="anonymous" />` — Sentry
>    - If using Unsplash images: `<link rel="preconnect" href="https://images.unsplash.com" />`
>    - If using Google Fonts (before next/font migration): `<link rel="preconnect" href="https://fonts.googleapis.com" />`
>
> 2. **Use environment variables for domains:**
>    - Don't hardcode domains — use `NEXT_PUBLIC_API_URL` to derive the preconnect domain
>    - Create a `Preconnect` server component that reads env vars and renders the link tags
>
> 3. **Add `fetchpriority` hints** for critical resources:
>    - Hero images: `fetchpriority="high"`
>    - Below-fold images: `fetchpriority="low"`
>
> 4. **Add `<meta name="viewport">` optimization** if not already present:
>    - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`

---

## 2.5 — DATABASE OPTIMIZATION (Tasks 92-98)

---

### Task 92: Configure Read Replica for Analytics Queries

**AI Prompt:**

> Analytics queries from the admin dashboard compete with exam writes on the primary database. I need to configure a read replica connection.
>
> Read `packages/db/src/schema/index.ts` to understand the current single-connection setup.
>
> Then implement read/write splitting:
>
> 1. **Create dual database client** in `packages/db/src/schema/index.ts`:
>    - `db` — Primary database (read + write) — uses `DATABASE_POOL_URL`
>    - `dbReadOnly` — Read replica — uses `DATABASE_REPLICA_URL`
>    - If `DATABASE_REPLICA_URL` is not set, fall back to `DATABASE_POOL_URL` (same DB, for development)
>
> 2. **Export both clients:**
>    - `export { db, dbReadOnly }` from the package
>    - Document which to use: `db` for writes and critical reads, `dbReadOnly` for analytics/reports
>
> 3. **Identify queries that should use the read replica:**
>    - All admin dashboard analytics queries (5+ dashboard panels)
>    - Report generation queries
>    - Search/listing queries that can tolerate slight staleness
>    - User analytics aggregations
>
> 4. **Identify queries that MUST use primary:**
>    - Exam creation and answer submission (must write to primary)
>    - Authentication (must read latest user state)
>    - Any query that immediately follows a write (need read-your-writes consistency)
>
> 5. **Update service files** to use `dbReadOnly` for identified read-only queries. Show 3-5 examples.
>
> 6. **Add `DATABASE_REPLICA_URL` to `.env.example`**
>
> Neon supports read replicas on Pro/Scale plans. On free tier, both URLs point to the same database.

---

### Task 93: Fix N+1 in SelectionEngine (Batch Queries)

**AI Prompt:**

> The `SelectionEngine` at `apps/api-server/src/modules/selection-engine/selection.service.ts` fires approximately 60 sequential database queries per exam start. This is a critical N+1 problem that hammers the database.
>
> Read the complete `selection.service.ts` to understand:
> - Where the sequential queries happen
> - What data each query fetches
> - The keyset pagination algorithm
>
> Then fix the N+1 problem:
>
> 1. **Identify all sequential query loops** — Where does the code loop and execute one query per iteration?
>
> 2. **Replace with batch queries:**
>    - If the code fetches questions one-by-one by ID: Replace with a single `WHERE id IN (...)` query
>    - If the code fetches questions by multiple filter criteria in a loop: Combine into a single query with complex WHERE clause
>    - If the code fetches related data (skills, topics) per question: Use JOINs or a single batch query
>
> 3. **Preserve the deterministic keyset algorithm:**
>    - The keyset pagination using SHA-256 chained anchors must produce identical results
>    - The optimization is in HOW we fetch data, not WHAT data we fetch
>    - Verify with a test that the same inputs produce the same question set before and after optimization
>
> 4. **Target: Maximum 3-5 database queries per exam start** (down from ~60)
>
> 5. **Add timing logs:**
>    - Log the total question selection time
>    - Compare before and after optimization
>
> 6. **Write a test** that verifies the optimized version produces identical results to the original

---

### Task 94: Fix N+1 in HierarchyFactory (Batch Upserts)

**AI Prompt:**

> The `HierarchyFactory` at `apps/api-server/src/modules/domain/hierarchy.factory.ts` fires approximately 150 individual skill lookups when importing a hierarchy. This needs to be batch-optimized.
>
> Read the complete `hierarchy.factory.ts` to understand:
> - Where the sequential skill lookups happen
> - The full upsert flow for domains → subjects → topics → subtopics → skills
>
> Then fix the N+1 problem:
>
> 1. **Batch skill lookups:**
>    - Instead of: `for (const skill of skills) { await db.query.skills.findFirst({ where: eq(name, skill.name) }) }`
>    - Use: `const existingSkills = await db.query.skills.findMany({ where: inArray(name, skillNames) })`
>    - Single query to find all existing skills, then only INSERT the missing ones
>
> 2. **Batch inserts:**
>    - Instead of inserting skills one-by-one, use `db.insert(skills).values(newSkillRecords)` for bulk insert
>    - Same for topicSkills bridge records — batch insert all at once
>
> 3. **Batch upserts for hierarchy levels:**
>    - Group all subjects for a domain and upsert in one query using `ON CONFLICT DO UPDATE`
>    - Same for topics, subtopics
>
> 4. **Keep transaction integrity:**
>    - All batch operations must still run within the existing database transaction
>    - If any batch operation fails, the entire transaction rolls back
>
> 5. **Target: Maximum 8-10 queries per hierarchy import** (down from ~150)
>
> 6. **Write tests** verifying:
>    - Identical results before and after optimization
>    - Transaction rollback on partial failure still works
>    - Performance improvement (log query counts)

---

### Task 95: Add Missing Database Transactions

**AI Prompt:**

> Several multi-table database operations in the Quiz Platform lack transaction protection, meaning partial failures can leave data in an inconsistent state.
>
> Search the entire codebase for multi-step database writes that should be transactional but aren't:
> - Look for sequences of `db.insert`, `db.update`, `db.delete` without wrapping `db.transaction()`
> - Focus on `apps/api-server/src/modules/` — all service files
>
> Then wrap these operations in transactions:
>
> 1. **Read the codebase to find all non-atomic multi-step writes.** For each one found:
>    - Document what happens if step 2 fails after step 1 succeeds (the data inconsistency)
>    - Wrap the entire operation in `db.transaction(async (tx) => { ... })`
>    - Use `tx` instead of `db` for all queries within the transaction
>
> 2. **Specifically check these likely candidates:**
>    - `AdminEngine.updateUser` — Does it update user AND roles in separate queries? If so, wrap in transaction.
>    - `AuthService.signup` — Does it create user AND profile AND role assignment? If so, wrap in transaction.
>    - `ExamEngine.startExam` — Does it create exam AND exam_questions? Already transactional? Verify.
>    - `HierarchyFactory` — Already uses transaction? Verify it covers ALL operations.
>    - Any endpoint that deletes a parent and its children (cascading operations)
>
> 3. **Transaction best practices:**
>    - Keep transactions short (don't include API calls or heavy computation inside tx)
>    - Use READ COMMITTED isolation level (default, sufficient for most operations)
>    - Handle transaction retry on serialization failures (if using SERIALIZABLE)
>    - Log transaction failures with context about which operation failed
>
> 4. **Write tests** for 2-3 transaction scenarios:
>    - Successful multi-step write
>    - Partial failure — verify rollback (no partial data)

---

### Task 96: Create Data Retention Cleanup Jobs

**AI Prompt:**

> Six or more database tables in the Quiz Platform grow indefinitely with no cleanup mechanism. Expired tokens, old login attempts, and stale session data accumulate forever.
>
> Read the schema files to identify all tables that need retention policies:
> - `packages/db/src/schema/auth.ts` — Check all auth-related tables
> - `packages/db/src/schema/exam.ts` — Check exam-related tables
>
> Then create cleanup utilities:
>
> 1. **Create `apps/api-server/src/modules/maintenance/cleanup.service.ts`:**
>
>    Define cleanup tasks for each table with retention policies:
>
>    - `cleanupExpiredRefreshTokens()` — Delete tokens older than 30 days (expired + revoked)
>    - `cleanupRevokedTokens()` — Delete revoked tokens older than 7 days (no longer needed for reuse detection)
>    - `cleanupExpiredSessions()` — Delete sessions that expired more than 24 hours ago
>    - `cleanupOldLoginAttempts()` — Delete login attempts older than 90 days
>    - `cleanupExpiredVerificationTokens()` — Delete verification tokens older than 7 days
>    - `cleanupExpiredPasswordResetTokens()` — Delete password reset tokens older than 24 hours
>    - `cleanupExpiredIdempotencyKeys()` — Delete idempotency keys older than 24 hours
>    - `cleanupOldAuditLogs()` — Archive or delete audit logs older than 1 year (configurable)
>
> 2. **Each cleanup function should:**
>    - Use `DELETE FROM table WHERE created_at < $cutoff LIMIT 1000` (batch deletion to avoid lock contention)
>    - Loop until fewer than 1000 rows deleted (all cleanup done)
>    - Log: table name, rows deleted, execution time
>    - Return cleanup summary: `{ table, rowsDeleted, durationMs }`
>
> 3. **Create `cleanupAll()` orchestrator:**
>    - Runs all cleanup tasks sequentially
>    - Returns combined summary
>    - Handles individual task failures gracefully (one failure doesn't stop others)
>
> 4. **Create API endpoint** at `/api/admin/maintenance/cleanup`:
>    - Admin-authenticated
>    - POST triggers cleanup
>    - GET returns last cleanup summary and next scheduled time
>
> 5. **Create Vercel Cron Job** configuration:
>    - Add `vercel.json` cron config to run cleanup daily at 3:00 AM UTC
>    - Create the cron route handler that calls `cleanupAll()`
>
> 6. **Add configurable retention periods** via environment variables:
>    - `RETENTION_REFRESH_TOKENS_DAYS=30`
>    - `RETENTION_AUDIT_LOGS_DAYS=365`
>    - etc.

---

### Task 97: Add CASCADE DELETE Safety Limits

**AI Prompt:**

> Deleting a user with many exams triggers cascading deletes across 10+ tables, potentially causing long-running locks. I need to add safety mechanisms.
>
> Read the schema files to understand all cascade delete relationships:
> - Which tables have `ON DELETE CASCADE` referencing users?
> - What's the cascade chain depth? (users → exams → exam_questions → ...)
>
> Then implement safe deletion:
>
> 1. **Create `apps/api-server/src/modules/admin-engine/safe-delete.service.ts`:**
>
>    - `preDeleteCheck(userId: string): Promise<DeletionImpact>` — Before deleting, count affected records:
>      - How many exams?
>      - How many exam questions?
>      - How many results?
>      - How many sessions?
>      - How many audit logs?
>      - Total affected rows
>
>    - `DeletionImpact` type: `{ userId, examCount, questionCount, resultCount, sessionCount, auditLogCount, totalAffectedRows, estimatedDuration, requiresConfirmation }`
>
>    - `requiresConfirmation = true` if totalAffectedRows > 1000 (configurable threshold)
>
> 2. **Implement batched deletion:**
>    - `deleteUserSafely(userId: string): Promise<DeletionResult>`
>    - Instead of relying on CASCADE (one massive transaction):
>      - Delete exam_questions in batches of 500
>      - Delete results_by_dimension in batches of 500
>      - Delete exams in batches of 100
>      - Delete sessions, tokens, login_attempts
>      - Finally delete the user record
>    - Each batch is a separate transaction (prevents long locks)
>    - Log progress: "Deleted 500/2000 exam questions..."
>
> 3. **Soft delete option:**
>    - `softDeleteUser(userId: string)` — Sets `deletedAt` timestamp, deactivates account
>    - User data remains for audit purposes
>    - Actual hard delete can run later in background
>
> 4. **Update the admin delete user endpoint** to:
>    - First call `preDeleteCheck` and return the impact
>    - Require explicit confirmation if impact is high
>    - Use `deleteUserSafely` for the actual deletion
>
> 5. **Write tests**: Impact calculation accuracy, batched deletion completeness, soft delete behavior

---

### Task 98: Convert Admin Lists to Keyset Pagination

**AI Prompt:**

> Admin list endpoints (users, questions, audit logs, exams) use OFFSET-based pagination which degrades at scale. `OFFSET 100000` requires scanning 100,000 rows before returning results. I need to convert to keyset (cursor-based) pagination.
>
> Read the admin list endpoints to understand current pagination:
> - Search for `offset`, `limit`, `page`, `pageSize` in route handlers and service files
>
> Then convert to keyset pagination:
>
> 1. **Create `apps/api-server/src/lib/pagination.ts`:**
>
>    Define keyset pagination utilities:
>    - `encodePageCursor(lastItem: { id: string, sortValue: any }): string` — Base64 encode cursor
>    - `decodePageCursor(cursor: string): { lastId: string, lastSortValue: any }` — Decode cursor
>    - `buildKeysetQuery(cursor, sortField, sortDirection)` — Generate WHERE clause for keyset
>
> 2. **Keyset pagination pattern:**
>    - Instead of: `SELECT * FROM users ORDER BY created_at DESC OFFSET 100 LIMIT 20`
>    - Use: `SELECT * FROM users WHERE created_at < $cursor_value OR (created_at = $cursor_value AND id < $cursor_id) ORDER BY created_at DESC LIMIT 20`
>    - Response includes: `{ data: [...], nextCursor: "encoded_cursor", hasMore: boolean }`
>
> 3. **Convert these endpoints:**
>    - Admin user list → keyset by `created_at`
>    - Admin question list → keyset by `created_at`
>    - Audit log list → keyset by `created_at`
>    - Exam list → keyset by `started_at` or `completed_at`
>
> 4. **Backward compatibility:**
>    - Support both `?page=5&pageSize=20` (old) and `?cursor=xxx&limit=20` (new)
>    - When `cursor` is provided, use keyset pagination
>    - When `page` is provided, fall back to offset (deprecated, log warning)
>    - Document migration timeline for API consumers
>
> 5. **Update admin app frontend** to use cursor-based pagination:
>    - "Load More" button instead of page numbers (keyset doesn't support jumping to page N)
>    - Or infinite scroll with cursor
>    - Still show total count for display purposes (separate COUNT query)
>
> 6. **Write tests**: Cursor encoding/decoding, keyset query correctness, boundary conditions (first page, last page, empty results)

---

## PHASE 2 COMPLETE

> **Total Tasks in Phase 2: 53 (#46-98)**
> After completing all 53 tasks, your platform will have:
> - Clean architecture following SOLID principles
> - Proper design patterns (Strategy, State Machine, Event Bus, Repository, Builder, Decorator)
> - Structured logging with correlation IDs and PII redaction
> - OpenTelemetry distributed tracing
> - Optimized frontend with Server Components, code splitting, and React Query
> - Optimized database with read replicas, batch queries, and keyset pagination
> - Data retention policies and safe deletion mechanisms
>
> **Estimated effort**: 8-12 weeks with focused development
> **Impact**: From "functional monolith" to "well-architected, maintainable codebase ready for scale"


---

## PHASE 1 CARRY-FORWARD TASKS (Execute Before Phase 2 Main Work)

> These items were identified during the Phase 1 audit as low-priority or deferred.
> They should be addressed as a "Cleanup Sprint" at the start of Phase 2.

### CF-1: Write Playwright E2E Test Files (Phase 1 Task 13)

**Status**: Playwright config exists, `@playwright/test` installed. No actual test files written.

**AI Prompt:**

> The Playwright infrastructure is installed and configured at `playwright.config.ts`. Write E2E smoke tests for the critical user flows:
>
> 1. **Student Login Flow**: Navigate to `/login`, enter credentials, verify redirect to `/dashboard`
> 2. **Exam Flow**: Start a quiz from `/quiz`, answer questions, submit, verify results page
> 3. **Admin Login Flow**: Navigate to admin login, verify admin dashboard loads
>
> Place tests in `apps/web-app/tests/e2e/` and `apps/admin-app/tests/e2e/`.
> Use the existing `_skip-placeholder.spec.ts` files as a starting point.

---

### CF-2: Create Comprehensive Test Database Seed Script (Phase 1 Task 14)

**Status**: `packages/db/seed-enterprise.ts` exists but may not be comprehensive.

**AI Prompt:**

> Enhance `packages/db/seed-enterprise.ts` to create a complete, realistic test dataset:
>
> - 5 student users, 2 admin users, 1 teacher user
> - 3 domains → 6 subjects → 12 topics → 24 subtopics
> - 100 questions across different difficulties and topics
> - 10 completed exams with scores and dimension breakdowns
> - 5 generated PDF reports
> - Audit log entries covering login, exam submission, and admin actions
>
> Add a `seed` script to `packages/db/package.json`.

---

### CF-3: Add Bundle Size CI Check (Phase 1 Task 23)

**Status**: `@next/bundle-analyzer` installed. No CI job runs it.

**AI Prompt:**

> Add a `bundle-check` job to `.github/workflows/ci.yml` that:
>
> 1. Runs `ANALYZE=true pnpm build:all`
> 2. Checks total JS bundle size against a budget (e.g., 500KB first-load for web-app)
> 3. Fails if budget is exceeded
> 4. Uploads bundle analysis report as CI artifact
>
> Reference the existing `@next/bundle-analyzer` dependency in the root `package.json`.

---

### CF-4: Vercel Preview CI Integration (Phase 1 Task 24)

**Status**: Vercel creates preview URLs. No CI checks against them.

**AI Prompt:**

> Add a `preview-check` job to `.github/workflows/ci.yml` that:
>
> 1. Waits for Vercel preview deployment to complete (use `vercel` CLI or webhook)
> 2. Runs a health check (`curl`) against the preview URL
> 3. Reports pass/fail on the PR
>
> Note: This must work on GitHub Free Tier (no Vercel Checks API).

---

### CF-5: Add `statement_timeout` to Database Pool (Phase 1 Task 37 Enhancement)

**Status**: Application-level `withTimeout()` exists. Server-side `statement_timeout` NOT set.

**AI Prompt:**

> Add `statement_timeout: 30000` to the PostgreSQL pool configuration in `packages/db/src/index.ts`:
>
> ```typescript
> const pool = new Pool({
>   connectionString: databaseUrl,
>   max: 15,
>   idleTimeoutMillis: 30000,
>   connectionTimeoutMillis: 2000,
>   statement_timeout: 30000, // ← ADD THIS (30s server-side timeout)
> });
> ```
>
> This is a belt-and-suspenders backup to the existing `withTimeout()` utility.

---

### CF-6: Apply `withTimeout` to ScoringEngine and ExamEngine Queries (Phase 1 Task 37 Enhancement)

**Status**: `packages/db/src/utils/query-timeout.ts` utility exists with 4 presets. Not applied to engine queries.

**AI Prompt:**

> Import `withTimeout` and timeout presets from `packages/db/src/utils/query-timeout.ts`.
>
> Apply to these critical query paths:
>
> 1. `ScoringEngine.calculateExamResults` → wrap heavy aggregation queries with `REPORT_QUERY_TIMEOUT`
> 2. `ExamEngine` start/submit operations → wrap with `STANDARD_QUERY_TIMEOUT`
> 3. Admin analytics/reporting queries → wrap with `REPORT_QUERY_TIMEOUT`

---

### CF-7: Add Remaining Database Indexes (Phase 1 Task 38 Enhancement)

**Status**: 26 indexes exist. 4 additional indexes identified during audit.

**AI Prompt:**

> Add these indexes to `packages/db/src/schema/auth.ts`:
>
> 1. `users.created_at` — for sorting/filtering users by registration date
> 2. `audit_logs.action` — for filtering audit logs by action type
> 3. `audit_logs.created_at` — for time-range queries on audit logs
> 4. `login_attempts.user_id` — for rate limiting lookups by user
>
> After adding, run `pnpm drizzle-kit generate` to create the migration file (do NOT auto-run the migration).

---

*Phase 3 prompts are in `PHASE-3-SCALE-PREPARATION.md`*
