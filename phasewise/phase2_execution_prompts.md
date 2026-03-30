# Phase 2 — Complete Execution Prompts

> 53 tasks organized into **6 Sprints** by dependency order.
> Each prompt is ready to paste into an AI coding agent.

---

## 🏃 Sprint 1: SOLID Principles (Tasks 46-58)

> **Do this first** — all other sprints depend on cleaner service boundaries.

---

### Task 47: Split AuthService (SRP) — `NOT STARTED`

**Current state**: Monolithic [auth.service.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts) (16KB) at `apps/api-server/src/modules/auth/`

**AI Prompt:**

> Read `apps/api-server/src/modules/auth/auth.service.ts` (16KB, monolithic).
>
> Split it into 4 focused service files in the same directory:
>
> 1. **`signup.service.ts`** — `signUp()`, `requestVerification()`, `verifyEmail()`, `resendVerification()`
> 2. **`login.service.ts`** — `login()`, `validateCredentials()`, `recordLoginAttempt()`, `checkRateLimits()`
> 3. **`token-refresh.service.ts`** — `refreshAccessToken()`, `rotateRefreshToken()`, `revokeToken()`, `revokeAllUserTokens()`
> 4. **`password-recovery.service.ts`** — `requestPasswordReset()`, `resetPassword()`, `validateResetToken()`
>
> **Rules:**
> - Each file exports a single object or class with only its methods
> - Keep the original `auth.service.ts` as a **thin facade** that re-exports from the sub-services for backward compatibility
> - Move shared helpers (cookie management, token creation) into `token.service.ts` if not already there
> - Every import in the codebase that uses `AuthService.login()` etc. must still work unchanged
> - Run `pnpm tsc --noEmit` and `pnpm build` after to verify zero breakage
>
> **Files to read first:**
> - `apps/api-server/src/modules/auth/auth.service.ts`
> - `apps/api-server/src/modules/auth/token.service.ts` (8KB)
> - `apps/api-server/src/modules/auth/session.service.ts`
> - `apps/api-server/src/modules/auth/security.service.ts`
>
> **Verification:** `pnpm --filter @quiz/api-server run build` exits 0.

---

### Task 46: Finalize AdminEngine Split (SRP) — `PARTIAL`

**Current state**: Already split into 5 sub-engines but original `admin.engine.ts` (13KB) still exists.

**AI Prompt:**

> Read ALL files in `apps/api-server/src/modules/admin-engine/`:
> - `admin.engine.ts` (13KB — the original monolith)
> - `admin.analytics.engine.ts`
> - `admin.blueprint.engine.ts`
> - `admin.hierarchy.engine.ts`
> - `admin.question.engine.ts`
> - `admin.user.engine.ts`
>
> The original `admin.engine.ts` likely STILL contains methods that should have been moved.
>
> 1. Read `admin.engine.ts` line by line. For each method, determine which sub-engine it belongs to:
>    - User-related → `admin.user.engine.ts`
>    - Question-related → `admin.question.engine.ts`
>    - Analytics/reporting → `admin.analytics.engine.ts`
>    - Hierarchy (domain/subject/topic) → `admin.hierarchy.engine.ts`
>    - Blueprint/exam config → `admin.blueprint.engine.ts`
> 2. Move ALL remaining methods from `admin.engine.ts` into the correct sub-engine
> 3. Make `admin.engine.ts` a **thin re-export facade** (max 30 lines) that imports and re-exports everything
> 4. Search the ENTIRE codebase for `AdminEngine.` or `import.*admin.engine` and ensure all callers still work
> 5. Run `pnpm tsc --noEmit` to verify zero breakage
>
> **Verification:** `admin.engine.ts` is ≤30 lines (just re-exports). `pnpm build` exits 0.

---

### Task 50: Strategy Pattern — Answer Evaluators (OCP) — `NOT STARTED`

**Current state**: `scoring.engine.ts` (8KB) handles all answer evaluation inline.

**AI Prompt:**

> Read `apps/api-server/src/modules/scoring-engine/scoring.engine.ts` (8KB).
>
> Find where answers are evaluated (the logic that checks if a student's answer matches the correct answer). Currently this is likely a switch/if-else chain inside the scoring method.
>
> Extract this into the Strategy Pattern:
>
> 1. **Create** `apps/api-server/src/modules/scoring-engine/evaluators/` directory
> 2. **Create** `evaluator.interface.ts`:
>    ```typescript
>    export interface IAnswerEvaluator {
>      evaluate(studentAnswer: unknown, correctAnswer: unknown, metadata?: unknown): EvaluationResult;
>    }
>    export interface EvaluationResult {
>      isCorrect: boolean;
>      score: number;       // 0.0 to 1.0
>      feedback?: string;
>    }
>    ```
> 3. **Create** concrete evaluators:
>    - `mcq.evaluator.ts` — Single-answer MCQ (exact match from options)
>    - `multi-answer.evaluator.ts` — Multi-select MCQ (partial credit: correct_selected / total_correct)
>    - `true-false.evaluator.ts` — Boolean comparison
>    - `default.evaluator.ts` — Fallback (logs warning, returns 0)
> 4. **Create** `evaluator.registry.ts`:
>    ```typescript
>    const registry = new Map<string, IAnswerEvaluator>();
>    export function registerEvaluator(type: string, evaluator: IAnswerEvaluator) { ... }
>    export function getEvaluator(type: string): IAnswerEvaluator { ... }
>    // Auto-register all built-in evaluators
>    ```
> 5. **Update** `scoring.engine.ts` to use `getEvaluator(question.type).evaluate(...)` instead of inline logic
> 6. **Write tests** in `evaluators/__tests__/` for each evaluator
>
> **Verification:** All existing scoring tests still pass. `pnpm test` and `pnpm build` exit 0.

---

### Task 51: Configurable Scoring Dimensions (OCP) — `NOT STARTED`

**AI Prompt:**

> Read `apps/api-server/src/modules/scoring-engine/scoring.engine.ts`.
> Find where scoring dimensions (e.g., by-topic, by-difficulty, by-skill) are calculated. This is likely hardcoded.
>
> Make it configurable:
>
> 1. **Create** `apps/api-server/src/modules/scoring-engine/scoring.config.ts`:
>    ```typescript
>    export interface ScoringDimension {
>      name: string;
>      groupBy: 'topicId' | 'subtopicId' | 'difficulty' | 'skillId' | 'type';
>      calculator: 'percentage' | 'weighted' | 'mastery';
>    }
>    export const DEFAULT_DIMENSIONS: ScoringDimension[] = [
>      { name: 'By Topic', groupBy: 'topicId', calculator: 'percentage' },
>      { name: 'By Difficulty', groupBy: 'difficulty', calculator: 'percentage' },
>      { name: 'By Skill', groupBy: 'skillId', calculator: 'percentage' },
>    ];
>    ```
> 2. **Create** `apps/api-server/src/modules/scoring-engine/dimension-scorer.ts`:
>    - Takes a list of evaluated answers + a `ScoringDimension` config
>    - Groups answers by the `groupBy` field
>    - Applies the `calculator` algorithm to each group
>    - Returns `{ dimension, name, score, total, percentage }[]`
> 3. **Update** `scoring.engine.ts` to use `DEFAULT_DIMENSIONS` from config instead of hardcoded grouping
> 4. Allow blueprints to optionally override dimensions (future: stored in DB)
>
> **Verification:** Same scoring results as before. `pnpm test` passes.

---

### Task 55: Split QuizStore into Slices (ISP) — `NOT STARTED`

**Current state**: Single `quiz-store.ts` (2.8KB) at `apps/web-app/src/store/`

**AI Prompt:**

> Read `apps/web-app/src/store/quiz-store.ts` (~2.8KB).
>
> Split the store into focused Zustand slices:
>
> 1. **Create** `apps/web-app/src/store/quiz/` directory
> 2. **Create** slices:
>    - `quiz-config-slice.ts` — Domain, subject, topic, subtopic, skill selection state
>    - `quiz-session-slice.ts` — Current exam state: questions, answers, flags, current index
>    - `quiz-timer-slice.ts` — Timer countdown state: timeLeft, isRunning, startTime
>    - `quiz-ui-slice.ts` — UI-only state: sidebar open, modal visibility, navigation direction
> 3. **Create** `apps/web-app/src/store/quiz/index.ts` — Combines slices using `create(...)(...)`
> 4. **Keep** `apps/web-app/src/store/quiz-store.ts` as a re-export for backward compatibility
> 5. **Search** all files importing from `quiz-store` and verify they still work
>
> **Verification:** `pnpm --filter @quiz/web-app run build` exits 0. App behavior unchanged.

---

### Task 56: Repository Pattern — Base Implementation (DIP) — `NOT STARTED`

**AI Prompt:**

> Read the database interaction patterns across these files:
> - `apps/api-server/src/modules/auth/auth.service.ts` — User DB queries
> - `apps/api-server/src/modules/exam-engine/exam.engine.ts` — Exam DB queries
> - `apps/api-server/src/modules/scoring-engine/scoring.engine.ts` — Score DB queries
> - `packages/db/src/schema/` — Drizzle schema definitions
>
> Create the Repository Pattern:
>
> 1. **Create** `apps/api-server/src/repositories/interfaces/` directory:
>    - `user.repository.interface.ts`:
>      ```typescript
>      export interface IUserRepository {
>        findById(id: string): Promise<User | null>;
>        findByEmail(email: string): Promise<User | null>;
>        create(data: CreateUserData): Promise<User>;
>        update(id: string, data: Partial<User>): Promise<User>;
>      }
>      ```
>    - `exam.repository.interface.ts`:
>      ```typescript
>      export interface IExamRepository {
>        findById(id: string): Promise<Exam | null>;
>        findByUser(userId: string, options?: PaginationOptions): Promise<Exam[]>;
>        create(data: CreateExamData): Promise<Exam>;
>        updateStatus(id: string, status: ExamStatus): Promise<void>;
>      }
>      ```
>    - `question.repository.interface.ts`: Standard CRUD
>
> 2. **Create** `apps/api-server/src/repositories/implementations/` directory:
>    - `drizzle-user.repository.ts` — Implements `IUserRepository` using Drizzle ORM with `db` import
>    - `drizzle-exam.repository.ts` — Implements `IExamRepository`
>    - `drizzle-question.repository.ts` — Implements `IQuestionRepository`
>
> 3. Each implementation wraps raw Drizzle calls from the services
> 4. **Do NOT refactor services yet** — just create the repos. Services will use them after DI (Task 57).
>
> **Verification:** `pnpm tsc --noEmit` passes. All tests pass.

---

### Task 57: DI Container (DIP) — `NOT STARTED`

> **Depends on**: Task 56 (Repository interfaces)

**AI Prompt:**

> Create a lightweight Dependency Injection container for the API server.
>
> 1. **Create** `apps/api-server/src/container.ts`:
>    ```typescript
>    import { DrizzleUserRepository } from './repositories/implementations/drizzle-user.repository';
>    import { DrizzleExamRepository } from './repositories/implementations/drizzle-exam.repository';
>    // ... more repos
>
>    // Singleton instances
>    const userRepository = new DrizzleUserRepository();
>    const examRepository = new DrizzleExamRepository();
>
>    // Service factories (services receive repos via constructor)
>    export const container = {
>      userRepository,
>      examRepository,
>      // Services will be added in Task 58
>    } as const;
>    ```
>
> 2. Export typed container. This is a **Pure DI / Composition Root** pattern (no IoC framework needed).
> 3. Add a `getContainer()` function that returns the singleton container.
> 4. **Do NOT refactor services yet** — just create the container. Task 58 wires services.
>
> **Verification:** `pnpm tsc --noEmit` passes.

---

### Task 58: Convert Static Methods to Instance Methods (DIP) — `NOT STARTED`

> **Depends on**: Tasks 56, 57

**AI Prompt:**

> Convert 2-3 service files from static methods to instance-based classes that receive repositories via constructor injection.
>
> **Example conversion for AuthService:**
>
> Before (current):
> ```typescript
> // auth.service.ts
> import { db } from '@/lib/db';
> export const AuthService = {
>   async login(email, password) {
>     const user = await db.query.users.findFirst({ where: eq(users.email, email) });
>     ...
>   }
> };
> ```
>
> After (DI):
> ```typescript
> // auth.service.ts
> import { IUserRepository } from '@/repositories/interfaces/user.repository.interface';
> export class AuthService {
>   constructor(private userRepo: IUserRepository) {}
>   async login(email: string, password: string) {
>     const user = await this.userRepo.findByEmail(email);
>     ...
>   }
> }
> ```
>
> 1. Convert `AuthService` (or its split sub-services from Task 47)
> 2. Convert `ExamEngine` 
> 3. Register instances in `container.ts`
> 4. Update route handlers to get services from `container`
> 5. Keep backward compatibility: export a default singleton from each service file
>
> **Verification:** All tests pass. `pnpm build` exits 0.

---

### Tasks 48, 49, 52, 53, 54: Frontend SRP Tasks — `NOT VERIFIED`

**AI Prompt (combined):**

> These are frontend component refactoring tasks. Execute them only after Sprint 1 backend tasks.
>
> **Task 48**: Read `apps/web-app/src/app/exam/` page component. If it's a single large file, split into:
> - `QuestionPanel.tsx`, `AnswerOptions.tsx`, `ExamSidebar.tsx`, `ExamTimer.tsx`, `ExamNavigation.tsx`, `ExamHeader.tsx`
> - Extract logic into `hooks/useExamSession.ts`
>
> **Task 49**: Read `apps/web-app/src/app/quiz/` page. Split the multi-step selection wizard into:
> - `DomainStep.tsx`, `SubjectStep.tsx`, `TopicStep.tsx`, `SubtopicStep.tsx`, `SkillStep.tsx`, `ConfigStep.tsx`, `ReviewStep.tsx`
> - Extract logic into `hooks/useQuizSelection.ts`
>
> For each, run `pnpm --filter @quiz/web-app run build` after to verify.

---

## 🏃 Sprint 2: Design Patterns (Tasks 59-68)

> **Depends on**: Sprint 1 (especially Tasks 50, 56, 57)

---

### Task 59: Enhanced Evaluators — `NOT STARTED`

> **Depends on**: Task 50 (evaluator interface)

**AI Prompt:**

> Read the evaluators created in Task 50 at `apps/api-server/src/modules/scoring-engine/evaluators/`.
>
> Add edge case handling:
> 1. `mcq.evaluator.ts` — Handle: null answer (score 0), invalid option ID (score 0, log warning), multiple formats (string vs number option IDs)
> 2. `multi-answer.evaluator.ts` — Handle: empty array, duplicates in answer, negative marking config
> 3. Add `fill-in-blank.evaluator.ts` — Case-insensitive match, trim whitespace, optional fuzzy matching
> 4. Write comprehensive edge-case tests for each evaluator
>
> **Verification:** `pnpm --filter @quiz/api-server run test` passes with all edge cases covered.

---

### Task 60: Scoring Strategy Algorithms — `NOT STARTED`

**AI Prompt:**

> Create scoring strategy implementations at `apps/api-server/src/modules/scoring-engine/strategies/`:
>
> 1. **`scoring-strategy.interface.ts`**:
>    ```typescript
>    export interface IScoringStrategy {
>      calculate(evaluations: EvaluationResult[], config?: unknown): number;
>    }
>    ```
> 2. **`percentage.strategy.ts`** — Simple: correctCount / totalCount × 100
> 3. **`weighted.strategy.ts`** — Difficulty-weighted: hard=3pts, medium=2pts, easy=1pt
> 4. **`mastery.strategy.ts`** — Threshold-based: ≥80% = Mastery, ≥60% = Proficient, etc.
> 5. **`strategy.registry.ts`** — Maps strategy name → implementation
> 6. Update `scoring.engine.ts` to use strategy registry instead of hardcoded percentage
>
> **Verification:** Existing scoring tests + new strategy-specific tests pass.

---

### Task 61: State Machine — Exam Lifecycle — `NOT STARTED`

**AI Prompt:**

> Read `apps/api-server/src/modules/exam-engine/exam.engine.ts` (16KB).
>
> Find all places where exam status is changed (e.g., `status = 'started'`, `status = 'completed'`).
>
> Create a formal state machine:
>
> 1. **Create** `apps/api-server/src/modules/exam-engine/exam-state-machine.ts`:
>    ```typescript
>    type ExamState = 'idle' | 'configuring' | 'started' | 'in_progress' | 'paused' | 'completing' | 'scoring' | 'completed' | 'failed' | 'expired' | 'abandoned';
>
>    type ExamEvent = 'START' | 'ANSWER' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'TIMEOUT' | 'SCORE_SUCCESS' | 'SCORE_FAIL' | 'ABANDON';
>
>    const transitions: Record<ExamState, Partial<Record<ExamEvent, ExamState>>> = {
>      idle:        { START: 'started' },
>      started:     { ANSWER: 'in_progress', TIMEOUT: 'expired', ABANDON: 'abandoned' },
>      in_progress: { ANSWER: 'in_progress', COMPLETE: 'completing', TIMEOUT: 'expired', PAUSE: 'paused', ABANDON: 'abandoned' },
>      paused:      { RESUME: 'in_progress', TIMEOUT: 'expired', ABANDON: 'abandoned' },
>      completing:  { SCORE_SUCCESS: 'completed', SCORE_FAIL: 'failed' },
>      // terminal: completed, failed, expired, abandoned — no outgoing transitions
>    };
>
>    export function transition(current: ExamState, event: ExamEvent): ExamState {
>      const next = transitions[current]?.[event];
>      if (!next) throw new InvalidTransitionError(current, event);
>      return next;
>    }
>    ```
>
> 2. Replace all inline status assignments in `exam.engine.ts` with `transition()` calls
> 3. Write tests for every valid transition and every invalid transition
>
> **Verification:** `pnpm test` passes. Invalid transitions throw errors.

---

### Task 62: Event Bus (Observer Pattern) — `NOT STARTED`

**AI Prompt:**

> Create a simple, type-safe event bus for decoupling services:
>
> 1. **Create** `apps/api-server/src/lib/event-bus.ts`:
>    ```typescript
>    type EventMap = {
>      'exam.started': { examId: string; userId: string; blueprintId: string };
>      'exam.completed': { examId: string; userId: string; score: number };
>      'exam.failed': { examId: string; error: string };
>      'scoring.completed': { examId: string; results: unknown };
>      'user.signup': { userId: string; email: string };
>      'user.login': { userId: string; ip: string };
>      'admin.action': { adminId: string; action: string; target: string };
>    };
>
>    class EventBus {
>      private handlers = new Map<string, Set<Function>>();
>      on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): void { ... }
>      off<K extends keyof EventMap>(event: K, handler: Function): void { ... }
>      emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void { ... }
>    }
>
>    export const eventBus = new EventBus();
>    ```
>
> 2. Add `eventBus.emit('exam.completed', ...)` to `exam.engine.ts` after exam completion
> 3. Add a listener in `scoring.engine.ts` that triggers scoring on `exam.completed`
> 4. Write tests for subscribe, emit, unsubscribe
>
> **Verification:** `pnpm build` and `pnpm test` pass.

---

### Task 63: Builder — Exam Construction — `NOT STARTED`

**AI Prompt:**

> Read `apps/api-server/src/modules/exam-engine/exam.engine.ts`.
> Find the `startExam` method and identify all the parameters it takes.
>
> Create a fluent builder:
>
> 1. **Create** `apps/api-server/src/modules/exam-engine/exam.builder.ts`:
>    ```typescript
>    export class ExamBuilder {
>      private config: Partial<ExamConfig> = {};
>
>      forUser(userId: string): this { this.config.userId = userId; return this; }
>      withBlueprint(blueprintId: string): this { this.config.blueprintId = blueprintId; return this; }
>      withQuestionCount(count: number): this { this.config.questionCount = count; return this; }
>      withTimeLimit(seconds: number): this { this.config.timeLimit = seconds; return this; }
>      withIdempotencyKey(key: string): this { this.config.idempotencyKey = key; return this; }
>
>      validate(): void { /* throw if required fields missing */ }
>      async build(): Promise<Exam> { this.validate(); return ExamEngine.startExam(this.config); }
>    }
>    ```
>
> 2. Write tests for builder validation and fluent chaining
>
> **Verification:** `pnpm test` and `pnpm build` pass.

---

### Task 64: Decorator — Audit Logging — `NOT STARTED`

**AI Prompt:**

> Create higher-order function decorators at `apps/api-server/src/lib/decorators/`:
>
> 1. **`audited.ts`** — Wraps a function to auto-log audit events:
>    ```typescript
>    export function audited(action: string) {
>      return function<T extends (...args: any[]) => Promise<any>>(fn: T): T {
>        return (async (...args: any[]) => {
>          const result = await fn(...args);
>          logger.info({ type: 'audit', action, args: sanitize(args), success: true });
>          return result;
>        }) as T;
>      };
>    }
>    ```
> 2. **`timed.ts`** — Logs execution time
> 3. **`cached.ts`** — Caches result with TTL
> 4. Apply `audited` to 3-5 admin engine methods as examples
>
> **Verification:** `pnpm test` and `pnpm build` pass.

---

### Tasks 65-68: Remaining Patterns — `NOT STARTED`

**AI Prompt (Task 65 — Complete Repositories):**

> Add remaining repositories to `apps/api-server/src/repositories/`:
> - `drizzle-session.repository.ts`, `drizzle-audit.repository.ts`, `drizzle-domain.repository.ts`, `drizzle-blueprint.repository.ts`
> - Add `RepositoryError`, `NotFoundError`, `DuplicateError` in `repositories/errors.ts`
> - Register all in `container.ts`

**AI Prompt (Task 66 — DTOs):**

> Create `apps/api-server/src/dtos/` with: `auth.dto.ts`, `exam.dto.ts`, `admin.dto.ts`.
> Each DTO has a type + a `toXxxDTO()` mapper function. Update 5 route handlers to return DTOs.
> **CRITICAL:** exam DTOs must NEVER include correct answers.

**AI Prompt (Task 67 — Evaluator Factory):**

> Create `apps/api-server/src/modules/scoring-engine/evaluators/evaluator.factory.ts`.
> Factory accepts a question and returns the correct `IAnswerEvaluator` based on `question.type` + `question.metadata`.

**AI Prompt (Task 68 — Null Objects):**

> Create `apps/api-server/src/lib/null-objects/` with `NullUser`, `NullExam`, `NullCacheResult`, `EmptyScoreReport`.
> Each implements the same interface as the real object but returns safe defaults.

---

## 🏃 Sprint 3: Logging & Observability (Tasks 69-78)

---

### Task 69: Complete Pino Logger — `PARTIAL`

**Current state**: Basic 25-line `logger.ts` exists. No factory, no redaction.

**AI Prompt:**

> Read `apps/api-server/src/lib/logger.ts` (25 lines, basic Pino setup).
>
> Enhance it:
> 1. Add `createLogger(module: string)` factory that creates child loggers:
>    ```typescript
>    export function createLogger(module: string) {
>      return logger.child({ module });
>    }
>    ```
> 2. Add `redact` config to Pino for fields: `password`, `token`, `secret`, `authorization`, `cookie`
> 3. Add base fields: `service: 'api-server'`, `environment: process.env.NODE_ENV`
> 4. Add `createRequestLogger(requestId, userId?)` for request-scoped logging
>
> **Verification:** Logger works in dev (pretty) and simulated prod mode (JSON).

---

### Task 70: LoggerService — `NOT STARTED`

**AI Prompt:**

> Create `apps/api-server/src/lib/logger.service.ts`:
> - Wraps Pino with domain-specific methods: `info()`, `warn()`, `error()`, `debug()`, `fatal()`
> - Add: `security(message, data)`, `performance(op, durationMs, data)`, `audit(action, userId, data)`
> - `withRequest(requestId, userId?)` returns a child logger
> - Error serialization: auto-extract `message`, `stack`, `code` from Error objects
>
> **Verification:** Import and use from route handler, verify output structure.

---

### Task 71: Correlation IDs — `PARTIAL`

**Current state**: `X-Request-ID` header exists in `proxy.ts` and `withLogging.ts` but no `AsyncLocalStorage`.

**AI Prompt:**

> 1. **Create** `apps/api-server/src/lib/request-context.ts`:
>    ```typescript
>    import { AsyncLocalStorage } from 'node:async_hooks';
>    type RequestContext = { requestId: string; userId?: string; ip?: string };
>    const storage = new AsyncLocalStorage<RequestContext>();
>    export function getRequestId() { return storage.getStore()?.requestId; }
>    export function getUserId() { return storage.getStore()?.userId; }
>    export function withContext<T>(ctx: RequestContext, fn: () => T): T { return storage.run(ctx, fn); }
>    ```
> 2. **Create** `apps/api-server/src/middleware/correlation-id.middleware.ts` — Reads/generates `X-Request-ID`, wraps handler in `withContext()`
> 3. **Update** `logger.ts` to auto-include `requestId` from `getRequestId()` on every log
> 4. **Update** `withLogging.ts` to use `withContext()` instead of local variable passing
>
> **Verification:** Each log line includes `requestId`. Response includes `X-Request-ID` header.

---

### Task 72: PII Redaction — `PARTIAL`

**AI Prompt:**

> 1. **Create** `apps/api-server/src/lib/pii-redactor.ts`:
>    - `redactPII(data)` — Recursively mask emails, IPs, phone numbers
>    - Allowlist for safe fields: `requestId`, `examId`, `action`
> 2. **Update** logger `redact` config to use Pino's built-in path-based redaction
> 3. **Config**: `PII_REDACTION_ENABLED` env var (always true in prod)
>
> **Verification:** Test that `redactPII({ email: 'a@b.com' })` returns `{ email: 'a***@b.com' }`.

---

### Task 73: Migrate console.* — `NOT STARTED`

**AI Prompt:**

> Search for ALL `console.log`, `console.error`, `console.warn` in `apps/api-server/src/` (excluding `node_modules` and `__tests__`).
>
> For each file:
> 1. Add `import { createLogger } from '@/lib/logger';` and `const log = createLogger('ModuleName');`
> 2. Replace `console.log(...)` → `log.info(...)`, `console.error(...)` → `log.error(...)`, `console.warn(...)` → `log.warn(...)`
> 3. Convert prefix-style logging `console.log('[CACHE] hit')` → `log.debug('Cache hit', { key })`
>
> Add ESLint rule `'no-console': 'warn'` to prevent regression.
>
> **Verification:** `grep -r "console\." apps/api-server/src/ --include="*.ts" | grep -v __tests__ | grep -v node_modules` returns 0 matches.

---

### Task 74: OpenTelemetry — `NOT STARTED`

**AI Prompt:**

> Install OpenTelemetry in `apps/api-server`:
>
> 1. `pnpm --filter @quiz/api-server add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions`
> 2. **Create** `apps/api-server/src/instrumentation.ts` (Next.js instrumentation hook):
>    - Init OTel SDK with resource `service.name: 'quiz-api-server'`
>    - Add HTTP + fetch auto-instrumentation
>    - Configure OTLP exporter via `OTEL_EXPORTER_ENDPOINT` env var
>    - Sampling: 100% dev, 10% prod
> 3. **Create** `apps/api-server/src/lib/tracing.ts` — `withSpan<T>(name, fn)` utility
> 4. Add `OTEL_EXPORTER_ENDPOINT` to `.env.example`
>
> **Verification:** `pnpm build` exits 0. No runtime errors when `OTEL_EXPORTER_ENDPOINT` is unset.

---

### Task 75: Add Trace Spans — `NOT STARTED`

> **Depends on**: Task 74

**AI Prompt:**

> Using `withSpan()` from Task 74, add spans to:
> - `ExamEngine.startExam` with child spans: `checkIdempotency`, `loadBlueprint`, `selectQuestions`, `createExamRecord`
> - `ScoringEngine.calculateExamResults` with child spans: `fetchExamData`, `evaluateAnswers`, `calculateDimensions`, `persistResults`
> - `SelectionEngine.selectQuestions` with child spans: `generateAnchor`, `queryQuestions`
> - Add error recording on span when operations fail
>
> **Verification:** `pnpm build` exits 0. Spans log to console in dev mode.

---

### Task 76+77: Health Endpoints — `NOT STARTED`

**AI Prompt:**

> Create two unauthenticated health check endpoints:
>
> 1. **`apps/api-server/src/app/api/healthz/route.ts`** (liveness):
>    - `GET` → `200 { status: 'ok', timestamp: new Date().toISOString() }`
>    - No auth, no DB check. Must respond <10ms.
>    - Header: `Cache-Control: no-cache, no-store`
>
> 2. **`apps/api-server/src/app/api/readyz/route.ts`** (readiness):
>    - `GET` → Check DB (`SELECT 1`, 5s timeout) + Redis (ping, 2s timeout)
>    - `200 { status: 'ready', checks: { database: 'ok', redis: 'ok' } }` if all pass
>    - `503 { status: 'not_ready', checks: { database: 'ok', redis: 'error' } }` if any fail
>
> 3. Exclude both from rate limiting, CSRF, and request logging.
>
> **Verification:** `curl localhost:3001/api/healthz` returns 200. `pnpm build` exits 0.

---

### Task 78: Metrics Enhancement — `MOSTLY DONE`

**Current state**: `lib/metrics.ts` exists with `recordCounter`, `recordTimer`, Sentry export.

**AI Prompt (enhancement only):**

> Read `apps/api-server/src/lib/metrics.ts` (99 lines, functional).
> Add admin-facing metrics dashboard endpoint if not already complete:
> 1. Verify `apps/api-server/src/app/api/admin/metrics/` returns useful data
> 2. Add `requestDuration` histogram tracking if not present
> 3. Add business metrics: `exam.started`, `exam.completed`, `exam.failed` counter calls in engines
>
> **Verification:** `/api/admin/metrics` returns structured metrics JSON.

---

## 🏃 Sprint 4: Frontend Optimization (Tasks 79-91)

---

### Task 79: Server Components — `NOT VERIFIED`

**AI Prompt:**

> Read every `page.tsx` in `apps/web-app/src/app/` and `apps/admin-app/src/app/`.
> For each `'use client'` page, determine if it CAN be a Server Component.
>
> Convert 3-5 pages that primarily display data (dashboard, reports list, profile) by:
> 1. Remove `'use client'`
> 2. Move `useEffect` + `useState` data fetching to `async` function calls
> 3. Extract interactive parts into small `'use client'` sub-component islands
>
> **Verification:** `pnpm build` exits 0 for both apps.

---

### Task 80: Dynamic Imports — `NOT VERIFIED`

**AI Prompt:**

> Add `next/dynamic` to heavy components in admin app:
> ```typescript
> import dynamic from 'next/dynamic';
> const UserAnalyticsBoard = dynamic(() => import('@/components/dashboard/UserAnalyticsBoard'), { loading: () => <Skeleton /> });
> ```
> Apply to all dashboard panels and factory components.
> For web app: dynamically import report charts and quiz selection components.
>
> **Verification:** `pnpm build` exits 0. Initial bundle size reduced.

---

### Task 82: next/font — `NOT STARTED`

**AI Prompt:**

> In `apps/web-app/src/app/layout.tsx` and `apps/admin-app/src/app/layout.tsx`:
>
> 1. Add:
>    ```typescript
>    import { Inter, Outfit } from 'next/font/google';
>    const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
>    const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
>    ```
> 2. Apply to `<html>` or `<body>`: `className={`${inter.variable} ${outfit.variable}`}`
> 3. Remove any `<link>` to Google Fonts or `@import url()` in CSS
> 4. Update Tailwind config `fontFamily` to use CSS variables
>
> **Verification:** Fonts render correctly. No external font requests in Network tab.

---

### Task 84: Zustand Selectors — `NOT VERIFIED`

**AI Prompt:**

> Search for all `useQuizStore()`, `useAuthStore()`, `useDashboardStore()` usages across both apps.
> Convert EVERY usage to granular selectors:
> - Single field: `const timeLeft = useQuizStore(s => s.timeLeft);`
> - Multiple fields: `const { a, b } = useQuizStore(useShallow(s => ({ a: s.a, b: s.b })));`
> - Actions only: `const submit = useQuizStore(s => s.submitAnswer);`
>
> Import `useShallow` from `zustand/react/shallow`.
>
> **Verification:** `pnpm build` exits 0. No full-store destructuring remaining.

---

### Task 85: React Query — `NOT STARTED`

**AI Prompt:**

> 1. `pnpm --filter @quiz/web-app add @tanstack/react-query @tanstack/react-query-devtools`
> 2. `pnpm --filter @quiz/admin-app add @tanstack/react-query @tanstack/react-query-devtools`
> 3. Create `apps/web-app/src/providers/query-provider.tsx` — `'use client'` component wrapping `QueryClientProvider`
> 4. Configure: `staleTime: 5min`, `gcTime: 10min`, `retry: 2`, `refetchOnWindowFocus: true`
> 5. Create 3-5 hooks: `useDomains()`, `useExamReport(id)`, `useUserProfile()`
> 6. Convert 2-3 pages from `useEffect` fetching to React Query hooks
> 7. Add devtools in dev mode
>
> **Verification:** Data fetching works. Devtools panel visible in dev.

---

### Task 87: Complete Shared UI Package — `PARTIAL`

**Current state**: `packages/ui/` has `ZLoader`, `ZPagination`, `ZSkeleton`, `SelectField`, `SafeHtml`, `ThemeToggle`.

**AI Prompt:**

> Read `packages/ui/src/` and identify what's missing relative to duplicated components.
> Search for components that exist in BOTH `apps/web-app/src/components/` AND `apps/admin-app/src/components/`.
>
> Add missing shared components:
> - `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `Table.tsx`
> - Create `packages/ui/src/hooks/use-debounce.ts` and `use-throttle.ts` (Task 90)
> - Update exports in `packages/ui/src/index.ts`
> - Migrate 3-5 usages in each app from local to `@quiz/ui`
>
> **Verification:** `pnpm build` exits 0 for all packages and apps.

---

### Task 88: Tailwind Preset — `NOT STARTED`

**AI Prompt:**

> 1. Read `apps/web-app/tailwind.config.ts` and `apps/admin-app/tailwind.config.ts`
> 2. Identify identical configuration (theme, colors, plugins)
> 3. Create `packages/ui/tailwind.preset.ts` with shared theme
> 4. Update both app configs to use `presets: [sharedPreset]`
> 5. Keep app-specific `content` paths pointing to their own files + `packages/ui/src/**/*.tsx`
>
> **Verification:** `pnpm build` exits 0. No visual regressions.

---

### Tasks 81, 83, 86, 89, 90, 91:

**Task 81** (`next/image`): Search for `<img` tags, convert to `<Image>` from `next/image`. Add `images.remotePatterns` to `next.config.ts`.

**Task 83** (React.memo): Wrap exam components (`QuestionPanel`, `AnswerOptions`, `ExamNavigation`) with `React.memo`. Add `useCallback` for handlers passed as props.

**Task 86** (Prefetching): Convert `<a>` tags to `<Link>` from `next/link`. Add `router.prefetch()` on dashboard for likely next pages.

**Task 89** (Auth Store): Extract shared auth logic from both `auth-store.ts` files into `packages/api-client/src/stores/base-auth-store.ts`.

**Task 90** (useDebounce): Create `packages/ui/src/hooks/use-debounce.ts`, `use-debounced-callback.ts`, `use-throttle.ts`.

**Task 91** (Preconnect): Add `<link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL}>` in both app layouts.

---

## 🏃 Sprint 5: Database Optimization (Tasks 92-98)

---

### Task 92: Read Replica — `UNKNOWN`

**AI Prompt:**

> Read `packages/db/src/schema/index.ts`. Create a dual DB client:
> - `db` — Primary (uses `DATABASE_POOL_URL`)
> - `dbReadOnly` — Replica (uses `DATABASE_REPLICA_URL`, falls back to `DATABASE_POOL_URL`)
> - Export both. Document: `db` for writes, `dbReadOnly` for analytics/reports
> - Update 3-5 admin analytics queries to use `dbReadOnly`
> - Add `DATABASE_REPLICA_URL` to `.env.example`

---

### Task 93: Fix N+1 in SelectionEngine — `LIKELY PARTIAL`

**AI Prompt:**

> Read `apps/api-server/src/modules/selection-engine/` completely.
> Count database queries per exam start. If >5, batch optimize:
> - Replace per-question lookups with `WHERE id IN (...)` batch queries
> - Preserve the deterministic keyset/SHA-256 algorithm
> - Target: ≤5 queries per exam start
> - Add timing log comparing before/after

---

### Task 95: DB Transactions — `LIKELY PARTIAL`

**AI Prompt:**

> Search for sequences of `db.insert`, `db.update`, `db.delete` WITHOUT wrapping `db.transaction()`:
> - `apps/api-server/src/modules/auth/auth.service.ts` — signup creates user + role
> - `apps/api-server/src/modules/exam-engine/exam.engine.ts` — creates exam + questions
> - `apps/api-server/src/modules/admin-engine/` — any multi-step writes
>
> Wrap each in `db.transaction(async (tx) => { ... })`. Use `tx` inside.

---

### Task 96: Cleanup Jobs — `UNKNOWN`

**AI Prompt:**

> Create `apps/api-server/src/modules/maintenance/cleanup.service.ts`:
> - `cleanupExpiredRefreshTokens()` — Delete tokens expired >30 days
> - `cleanupExpiredSessions()` — Delete sessions expired >24h
> - `cleanupOldLoginAttempts()` — Delete attempts >90 days
> - Each uses `DELETE ... WHERE created_at < $cutoff LIMIT 1000` in a loop
> - `cleanupAll()` runs all sequentially
> - Create `/api/admin/maintenance/cleanup` endpoint (POST triggers, GET shows last run)
> - Add Vercel cron config for daily 3AM UTC run

---

### Task 98: Keyset Pagination — `UNKNOWN`

**AI Prompt:**

> Create `apps/api-server/src/lib/pagination.ts`:
> - `encodePageCursor(lastItem)` / `decodePageCursor(cursor)` — Base64 cursor encoding
> - `buildKeysetQuery(cursor, sortField, direction)` — Generate Drizzle WHERE clause
> - Convert admin user list, question list, audit log list to cursor-based pagination
> - Support both `?cursor=xxx&limit=20` (new) and `?page=5&pageSize=20` (deprecated, log warning)
> - Update admin app frontend for "Load More" or infinite scroll

---

## 🏃 Sprint 6: Carry-Forward Tasks (CF-1 to CF-7)

---

**CF-1**: Write Playwright E2E tests in `apps/web-app/tests/e2e/` and `apps/admin-app/tests/e2e/`. Student login flow, exam flow, admin login flow.

**CF-2**: Enhance `packages/db/seed-enterprise.ts` with: 5 students, 2 admins, 3 domains, 100 questions, 10 exams with scores.

**CF-3**: Add `bundle-check` job to `.github/workflows/quality.yml` — runs `ANALYZE=true pnpm build:all`, checks size against 500KB budget.

**CF-4**: Add `preview-check` CI job — waits for Vercel preview, runs health check curl, reports on PR.

**CF-5**: Add `statement_timeout: 30000` to pool config in `packages/db/src/index.ts`.

**CF-6**: Apply `withTimeout()` wrapper to `ScoringEngine.calculateExamResults`, `ExamEngine` operations, and admin analytics queries.

**CF-7**: Add 4 database indexes: `users.created_at`, `audit_logs.action`, `audit_logs.created_at`, `login_attempts.user_id`.
