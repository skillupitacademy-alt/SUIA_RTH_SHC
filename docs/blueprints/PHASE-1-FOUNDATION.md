# PHASE 1: CRITICAL FOUNDATION (Weeks 1-4)

> **165 Total Tasks | Phase 1: 45 Tasks | Priority: CRITICAL**
> Without these, your app is unsafe to deploy at any scale.

---

## 1.1 — TESTING INFRASTRUCTURE (Tasks 1-14)

> [!IMPORTANT]
> **STATUS**: Foundations (Vitest/Config) are implemented.
> **CARRY-FORWARD**: Comprehensive test suites (Tasks 3-11), Playwright E2E (Task 13), and Seed Enhancement (Task 14) are moved to **Phase 2 (Cleanup Sprint)**.

---

### Task 1: Install Vitest + React Testing Library in Monorepo Root

**AI Prompt:**

> You are working on a pnpm monorepo at the project root. The monorepo uses Turborepo for orchestration and has this structure:
>
> - `apps/api-server` (Next.js 16.1, API backend)
> - `apps/web-app` (Next.js 16.1, student-facing frontend)
> - `apps/admin-app` (Next.js 16.1, admin dashboard)
> - `packages/db` (Drizzle ORM, PostgreSQL/Neon)
> - `packages/api-client` (HTTP client SDK)
>
> Install Vitest as the test runner for this monorepo. Also install React Testing Library, @testing-library/jest-dom, and @testing-library/user-event as dev dependencies at the root. Configure a root `vitest.workspace.ts` that references all 5 workspace packages. Make sure the Vitest config supports TypeScript path aliases (`@/*`, `@quiz/db`, `@quiz/api-client`) that already exist in each package's `tsconfig.json`. Do NOT write any test files yet — only set up the framework and configuration. Update the root `package.json` to add a `test` script that runs `vitest run` and a `test:watch` script that runs `vitest`. Update `turbo.json` to ensure the `test` task has correct dependency graph configuration.

---

### Task 2: Configure Vitest Workspace for All 3 Apps + 2 Packages

**AI Prompt:**

> My monorepo already has Vitest installed at the root (from Task 1). Now I need individual Vitest configuration files for each workspace package:
>
> 1. `apps/api-server/vitest.config.ts` — This is a Next.js API server. Tests here need to mock database calls (Drizzle ORM), mock Redis (Upstash), and mock email (Resend). Configure the test environment as `node`. Set up path alias `@/*` pointing to `./src/*`.
>
> 2. `apps/web-app/vitest.config.ts` — This is a Next.js frontend with React 19. Configure test environment as `jsdom`. Set up React Testing Library. Set up path alias `@/*` pointing to `./src/*`.
>
> 3. `apps/admin-app/vitest.config.ts` — Same as web-app, it is a Next.js frontend with React 19. Configure test environment as `jsdom`. Set up React Testing Library. Set up path alias `@/*` pointing to `./src/*`.
>
> 4. `packages/db/vitest.config.ts` — This is the database package using Drizzle ORM. Configure test environment as `node`. Tests here will need a test database connection or mocked Drizzle client.
>
> 5. `packages/api-client/vitest.config.ts` — This is an HTTP client package. Configure test environment as `node`. Tests here will mock fetch calls.
>
> For each config, set up coverage collection using `@vitest/coverage-v8` with the following thresholds: statements 70%, branches 60%, functions 70%, lines 70%. Exclude `node_modules`, `dist`, `.next`, `*.config.*` from coverage. Add a `test` script to each package's `package.json`. Do NOT write any test files yet.

---

### Task 3: Write Unit Tests for AuthService

**AI Prompt:**

> I need comprehensive unit tests for the AuthService located at `apps/api-server/src/modules/auth/auth.service.ts`. This service handles:
>
> - `signup(email, password, name)` — Creates user, hashes password, generates verification token, sends welcome email
> - `login(email, password)` — Validates credentials, checks lockout, generates JWT access + refresh tokens, creates session
> - `refreshToken(token)` — Validates refresh token, detects token reuse (family revocation), issues new token pair
> - `verifyEmail(token)` — Marks user as verified
> - `forgotPassword(email)` — Generates password reset token, sends reset email
> - `resetPassword(token, newPassword)` — Validates reset token, updates password hash
>
> Read the actual `auth.service.ts` file first to understand all the method signatures, dependencies, and logic flows. Then write a complete test file at `apps/api-server/src/modules/auth/__tests__/auth.service.test.ts`.
>
> The AuthService uses static methods and directly imports:
> - `db` from `@quiz/db` — Mock this entirely
> - `TokenService` — Mock all static methods
> - `SecurityService` — Mock all static methods
> - `EmailService` — Mock the send method
> - `AuditService` — Mock the log method
>
> Since all methods are static, use `vi.mock()` to mock all dependencies at the module level.
>
> Write tests for these scenarios at minimum:
> - Signup: successful creation, duplicate email error, email sending failure (should still create user), invalid input
> - Login: successful login, wrong password, non-existent user, locked out user, unverified user (if applicable)
> - Refresh token: valid refresh, expired token, reused token (should revoke family), invalid token
> - Token reuse detection: simulate a stolen refresh token scenario where attacker replays an old token — verify the entire token family gets revoked
> - Password recovery: successful flow, expired reset token, invalid token, non-existent email (should not reveal user existence)
>
> Use `describe` blocks to group by method. Use `beforeEach` to reset all mocks. Use meaningful test names that describe the behavior being tested. Aim for 90%+ coverage of auth.service.ts.

---

### Task 4: Write Unit Tests for ExamEngine

**AI Prompt:**

> I need comprehensive unit tests for the ExamEngine located at `apps/api-server/src/modules/exam-engine/exam.engine.ts`. This engine handles the core exam lifecycle:
>
> - `startExam(userId, blueprintId, config, idempotencyKey)` — Creates exam record, selects questions via SelectionEngine, stores exam_questions, returns exam data. Uses idempotency key to prevent duplicate exam creation.
> - `submitAnswer(examId, questionId, userId, answer, timeSpent)` — Records student answer for a question, validates exam ownership and status, checks timer hasn't expired.
> - `completeExam(examId, userId)` — Marks exam as processing, triggers async scoring via ScoringEngine, uses atomic CAS (Compare-And-Swap) to prevent double-completion.
>
> Read the actual `exam.engine.ts` file first to understand all dependencies, SQL queries, and edge cases. Then write a complete test file at `apps/api-server/src/modules/exam-engine/__tests__/exam.engine.test.ts`.
>
> Mock all dependencies:
> - `db` from `@quiz/db` — Mock all query methods (select, insert, update) and transaction
> - `SelectionEngine` — Mock `selectQuestions`
> - `ScoringEngine` — Mock `calculateExamResults`
> - `CacheService` — Mock get/set methods
>
> Write tests for these scenarios at minimum:
> - Start exam: successful creation, idempotency key collision (should return existing exam), invalid blueprint, question selection failure, user doesn't exist
> - Submit answer: successful submission, exam not found, exam not owned by user, exam already completed, question not in exam, timer expired, duplicate answer submission (overwrite vs reject)
> - Complete exam: successful completion, double-completion prevention (CAS), exam not in started status, scoring trigger (verify it's called but doesn't block response), exam not owned by user
> - Idempotency: same idempotency key returns same exam without creating duplicate, different key creates new exam
> - Concurrency: simulate two concurrent `completeExam` calls — only one should succeed
>
> Use `describe` blocks grouped by method. Aim for 90%+ coverage.

---

### Task 5: Write Unit Tests for ScoringEngine

**AI Prompt:**

> I need comprehensive unit tests for the ScoringEngine located at `apps/api-server/src/modules/scoring-engine/scoring.engine.ts`. This engine calculates multi-dimensional exam results:
>
> - `calculateExamResults(examId)` — Fetches all exam questions with answers, evaluates each answer against correct answer, calculates scores across 7 dimensions (domain, subject, topic, skill, difficulty, skillCategory, mappingType), stores results in `resultsByDimension` table, updates exam status to `completed` or `failed`.
>
> Read the actual `scoring.engine.ts` file first to understand the complete scoring algorithm, all dimension calculations, and database operations. Then write a complete test file at `apps/api-server/src/modules/scoring-engine/__tests__/scoring.engine.test.ts`.
>
> Mock `db` from `@quiz/db` for all database operations.
>
> Write tests for these scenarios at minimum:
> - Scoring calculation: exam with 10 questions (7 correct, 3 wrong) — verify overall percentage is 70%
> - Multi-dimensional scoring: verify scores are correctly grouped by domain, subject, topic, skill, difficulty, skillCategory, and mappingType. Create test data where questions span multiple domains/subjects to verify per-dimension accuracy.
> - Perfect score: all questions correct — verify 100% across all dimensions
> - Zero score: all questions wrong — verify 0% across all dimensions
> - Mixed difficulty scoring: verify that difficulty-level breakdown is accurate
> - Empty exam: exam with no answered questions — verify graceful handling
> - Partial exam: some questions unanswered — verify unanswered are counted as wrong
> - Database failure during scoring: verify exam status is set to `failed`
> - Results persistence: verify `resultsByDimension` inserts contain correct data for each dimension
> - Status transition: verify exam goes from `processing` to `completed` on success, `processing` to `failed` on error
>
> Create realistic test fixtures with questions spanning multiple domains, subjects, topics, skills, and difficulty levels. Aim for 90%+ coverage.

---

### Task 6: Write Unit Tests for SelectionEngine

**AI Prompt:**

> I need comprehensive unit tests for the SelectionEngine located at `apps/api-server/src/modules/selection-engine/selection.service.ts`. This engine selects questions for exams using a deterministic keyset pagination algorithm:
>
> - Uses SHA-256 chained UUID anchors for deterministic, reproducible question selection
> - Supports filtering by topic, subtopic, difficulty, skill
> - Implements keyset pagination for O(log N) performance on large question banks
>
> Read the actual `selection.service.ts` file first to understand the complete algorithm, database queries, and selection criteria. Then write a complete test file at `apps/api-server/src/modules/selection-engine/__tests__/selection.service.test.ts`.
>
> Mock `db` from `@quiz/db` for all database queries.
>
> Write tests for these scenarios at minimum:
> - Basic selection: request 20 questions, verify exactly 20 returned
> - Deterministic behavior: same inputs produce same question order (re-run with same seed/anchor)
> - Filter by single topic: verify all returned questions belong to requested topic
> - Filter by multiple topics: verify questions come from all requested topics
> - Filter by difficulty: verify difficulty distribution matches request
> - Filter by skill: verify skill filtering works correctly
> - Insufficient questions: request 50 questions but only 30 available — verify graceful handling
> - Empty question bank: no questions match criteria — verify appropriate error
> - Keyset pagination correctness: verify no duplicate questions across pages
> - Large dataset simulation: mock 10,000 questions, select 60 — verify performance characteristics
> - Anchor chaining: verify SHA-256 chain produces valid, unique anchors
>
> Aim for 90%+ coverage.

---

### Task 7: Write Unit Tests for SecurityService

**AI Prompt:**

> I need comprehensive unit tests for the SecurityService located at `apps/api-server/src/modules/auth/security.service.ts`. This service handles progressive account lockout:
>
> - Tracks failed login attempts per user
> - Progressive lockout escalation: 5 attempts → 15 min lockout, 10 attempts → 1 hour, 20 attempts → 24 hours
> - Records login attempts in database
> - Checks if account is currently locked
>
> Read the actual `security.service.ts` file first to understand all methods, lockout thresholds, time calculations, and database operations. Then write a complete test file at `apps/api-server/src/modules/auth/__tests__/security.service.test.ts`.
>
> Mock `db` from `@quiz/db` and use `vi.useFakeTimers()` for time-dependent tests.
>
> Write tests for these scenarios at minimum:
> - No lockout: user with 0-4 failed attempts can still login
> - First lockout tier: 5 failed attempts triggers 15-minute lockout
> - Second lockout tier: 10 failed attempts triggers 1-hour lockout
> - Third lockout tier: 20 failed attempts triggers 24-hour lockout
> - Lockout expiry: after lockout period passes, user can attempt login again
> - Lockout active: during lockout period, verify isLocked returns true with remaining time
> - Attempt recording: verify each failed attempt is recorded in database with timestamp
> - Attempt counting: verify count query filters by correct time window
> - Successful login after lockout: verify attempt counter behavior after lockout expires
> - Boundary conditions: test exactly at threshold values (4, 5, 9, 10, 19, 20 attempts)
> - Time boundary: test lockout at exactly the expiry moment
>
> Aim for 95%+ coverage since this is security-critical code.

---

### Task 8: Write Unit Tests for TokenService

**AI Prompt:**

> I need comprehensive unit tests for the TokenService located at `apps/api-server/src/modules/auth/token.service.ts`. This service handles JWT token generation and verification:
>
> - Generates access tokens (15 min expiry) using JWT_SECRET
> - Generates refresh tokens (7 day expiry) using JWT_REFRESH_SECRET
> - Generates admin tokens using ADMIN_JWT_SECRET
> - Verifies and decodes tokens
> - Uses the `jose` library for JWT operations
>
> Read the actual `token.service.ts` file first to understand all methods, token payloads, signing algorithms, and secret management. Then write a complete test file at `apps/api-server/src/modules/auth/__tests__/token.service.test.ts`.
>
> Mock environment variables for JWT secrets. Use real jose operations where possible (faster than full integration but verifies actual JWT structure).
>
> Write tests for these scenarios at minimum:
> - Access token generation: verify payload contains userId, email, roles. Verify expiry is ~15 minutes.
> - Refresh token generation: verify payload contains userId, tokenFamily. Verify expiry is ~7 days.
> - Admin token generation: verify admin scope is included. Verify uses ADMIN_JWT_SECRET (different from user secret).
> - Token verification: valid token returns decoded payload
> - Expired token: verify verification rejects expired tokens
> - Wrong secret: token signed with user secret fails verification with admin secret (and vice versa)
> - Tampered token: modified payload fails signature verification
> - Missing claims: token without required claims is rejected
> - Token structure: verify tokens are valid JWTs (3 dot-separated base64 segments)
> - Undefined secrets: verify graceful error if JWT_SECRET environment variable is not set
>
> Aim for 95%+ coverage since this is security-critical code.

---

### Task 9: Write Unit Tests for CacheService

**AI Prompt:**

> I need comprehensive unit tests for the CacheService located at `apps/api-server/src/modules/core/cache.service.ts`. This service implements a two-tier cache with circuit breaker:
>
> - Tier 1: In-memory LRU cache (500 items, 5 min TTL)
> - Tier 2: Upstash Redis with 200ms timeout
> - Circuit breaker: on Redis failure, sets `redisDeadUntil` with 30-second cooldown, falls back to LRU only
> - Uses `Promise.race` for Redis timeout enforcement
>
> Read the actual `cache.service.ts` file first to understand all methods, the LRU implementation, Redis interaction, circuit breaker logic, and TTL handling. Then write a complete test file at `apps/api-server/src/modules/core/__tests__/cache.service.test.ts`.
>
> Mock the Redis client (Upstash). Use `vi.useFakeTimers()` for TTL and circuit breaker timing tests.
>
> Write tests for these scenarios at minimum:
> - Cache hit (LRU): item in local cache returns immediately without Redis call
> - Cache hit (Redis): item not in LRU but in Redis — fetched from Redis and populated into LRU
> - Cache miss: item in neither cache — returns null/undefined
> - Cache set: item stored in both LRU and Redis
> - LRU eviction: after 500 items, oldest item evicted from local cache
> - TTL expiry: item expires after 5 minutes in LRU
> - Redis timeout: Redis takes >200ms — verify timeout fires, LRU fallback used, response still returned
> - Circuit breaker trip: Redis failure sets `redisDeadUntil` to now + 30 seconds
> - Circuit breaker active: while breaker is open, all Redis calls are skipped entirely (verify zero Redis calls)
> - Circuit breaker recovery: after 30-second cooldown, Redis is tried again
> - Cache invalidation: delete removes from both LRU and Redis
> - Debug logging: when DEBUG_CACHE=true, verify console.log calls (optional)
>
> Aim for 90%+ coverage.

---

### Task 10: Write Unit Tests for HierarchyFactory

**AI Prompt:**

> I need comprehensive unit tests for the HierarchyFactory located at `apps/api-server/src/modules/domain/hierarchy.factory.ts`. This factory handles atomic upsert of entire domain hierarchies:
>
> - Takes a hierarchy payload: domain → subjects → topics → subtopics → skills
> - Performs atomic upsert within a database transaction
> - Auto-heals skill associations (creates missing skill records, links them)
> - Uses `topicSkills` bridge table for many-to-many topic-skill relationships
>
> Read the actual `hierarchy.factory.ts` file first to understand the complete transaction flow, upsert logic, skill auto-healing, and error handling. Then write a complete test file at `apps/api-server/src/modules/domain/__tests__/hierarchy.factory.test.ts`.
>
> Mock `db` from `@quiz/db` including the `db.transaction()` method — the mock should execute the callback function passed to it.
>
> Write tests for these scenarios at minimum:
> - Full hierarchy upsert: domain with 2 subjects, each with 3 topics, each with 2 subtopics and 5 skills — verify all records created
> - Idempotent upsert: same hierarchy submitted twice — verify no duplicates, existing records updated
> - Skill auto-healing: topic references a skill that doesn't exist — verify skill is created and linked
> - Transaction atomicity: if subtopic insert fails, verify entire transaction rolled back (no partial data)
> - Empty hierarchy: domain with no subjects — verify domain created with no children
> - Single level: domain only — verify works without subjects/topics
> - Duplicate skills across topics: same skill referenced by multiple topics — verify single skill record with multiple bridge entries
> - Database error handling: verify error is propagated and transaction is rolled back
>
> Aim for 85%+ coverage.

---

### Task 11: Add Mock Implementations for DB, Redis, Email

**AI Prompt:**

> I need to create reusable test mock implementations for the three core external dependencies in my Quiz Platform monorepo. These mocks will be shared across all test files.
>
> Create a test utilities directory at `apps/api-server/src/__test-utils__/` with the following files:
>
> **1. `mock-db.ts`** — Mock for the Drizzle ORM database client imported from `@quiz/db`.
> Read `packages/db/src/schema/index.ts` first to understand the db client shape. The mock should:
> - Provide mock implementations for `db.select()`, `db.insert()`, `db.update()`, `db.delete()`, `db.query.*`
> - Support chaining (`.from().where().limit()` etc.)
> - Support `db.transaction()` — should execute the callback with the mock tx
> - Allow tests to configure return values per query (e.g., `mockDb.select.mockReturnValueOnce([...])`)
> - Export a `createMockDb()` factory function and a `resetMockDb()` cleanup function
>
> **2. `mock-redis.ts`** — Mock for the Upstash Redis client.
> Read `apps/api-server/src/modules/core/cache.service.ts` first to understand which Redis methods are used. The mock should:
> - Mock `get`, `set`, `del`, `keys`, `info` methods
> - Support configurable responses and simulated failures
> - Support simulated latency (for testing circuit breaker timeout)
> - Export `createMockRedis()` factory and `resetMockRedis()` cleanup
>
> **3. `mock-email.ts`** — Mock for the email service (Resend).
> Read `apps/api-server/src/modules/email/email.service.ts` first to understand the email provider interface. The mock should:
> - Mock the `send` method
> - Track all sent emails (to, subject, body) for assertions
> - Support simulated failures
> - Export `createMockEmail()` factory and `resetMockEmail()` cleanup
>
> **4. `test-fixtures.ts`** — Reusable test data factories.
> Read the database schema files to understand all entity shapes. Create factory functions:
> - `createTestUser(overrides?)` — returns a valid user object
> - `createTestExam(overrides?)` — returns a valid exam object
> - `createTestQuestion(overrides?)` — returns a valid question with options
> - `createTestBlueprint(overrides?)` — returns a valid exam blueprint
> - `createTestDomain(overrides?)` — returns a valid domain with hierarchy
> Each factory should generate unique IDs (use incrementing counters or UUIDs) and allow partial overrides.
>
> Do NOT write any actual test files. Only create these shared test utilities.

---

### Task 12: Configure Test Coverage Thresholds

**AI Prompt:**

> I have Vitest configured across my monorepo with workspace configs for all 5 packages (from Tasks 1-2). Now I need to add coverage enforcement.
>
> Update the root `vitest.workspace.ts` and each package's `vitest.config.ts` to include coverage configuration using `@vitest/coverage-v8`:
>
> **Global thresholds (apply to all packages):**
> - Statements: 70%
> - Branches: 60%
> - Functions: 70%
> - Lines: 70%
>
> **Per-package overrides:**
> - `apps/api-server`: Higher thresholds for security-critical modules — create per-file overrides:
>   - `src/modules/auth/**`: 90% all metrics
>   - `src/modules/exam-engine/**`: 85% all metrics
>   - `src/modules/scoring-engine/**`: 85% all metrics
>   - `src/modules/core/cache.service.ts`: 85% all metrics
>
> **Coverage reporting:**
> - Output formats: `text` (console), `lcov` (for CI tools), `html` (for local viewing)
> - Output directory: `coverage/` in each package
> - Exclude from coverage: `**/*.config.*`, `**/*.d.ts`, `**/types/**`, `**/__test-utils__/**`, `**/node_modules/**`
>
> **CI integration:**
> - Add a root script `test:coverage` that runs `vitest run --coverage`
> - Configure coverage to fail the test run if thresholds are not met (`thresholds.100` should not be set — only the minimums above)
>
> Update `turbo.json` to include `coverage/**` in the test task outputs.

---

### Task 13: Add Playwright for E2E Tests

**AI Prompt:**

> I need to set up Playwright for end-to-end testing in my Quiz Platform monorepo. The monorepo has two frontend apps that need E2E tests:
>
> - `apps/web-app` — Student-facing quiz platform (exam taking, score viewing, auth)
> - `apps/admin-app` — Admin dashboard (question management, analytics, user management)
>
> And one API server:
> - `apps/api-server` — Backend API
>
> Set up Playwright at the monorepo root level:
>
> 1. Install `@playwright/test` as a root dev dependency
> 2. Create `playwright.config.ts` at root with:
>    - Two projects: `web-app` and `admin-app`
>    - Each project targets its respective app's local dev server URL
>    - Configure `webServer` to start both frontend apps and the API server before tests
>    - Set retries to 2 for CI, 0 for local
>    - Set timeout to 30 seconds per test
>    - Configure screenshot on failure
>    - Configure trace recording on first retry
>
> 3. Create directory structure:
>    - `e2e/web-app/` — for student app tests
>    - `e2e/admin-app/` — for admin app tests
>    - `e2e/fixtures/` — for shared test fixtures
>
> 4. Write these initial E2E test files (skeleton with 1-2 tests each to verify setup works):
>    - `e2e/web-app/auth.spec.ts` — Test: navigate to login page, verify login form is visible
>    - `e2e/web-app/exam-flow.spec.ts` — Test: verify exam selection page loads
>    - `e2e/admin-app/dashboard.spec.ts` — Test: navigate to admin login, verify admin login form is visible
>
> 5. Add scripts to root `package.json`: `test:e2e` and `test:e2e:ui` (for headed mode)
>
> Do NOT write comprehensive test scenarios yet — just set up the framework and verify it works with minimal smoke tests.

---

### Task 14: Create Test Database Seed Scripts

**AI Prompt:**

> I need database seed scripts for testing in my Quiz Platform monorepo. The database uses Drizzle ORM with PostgreSQL (Neon). The schema is defined in `packages/db/src/schema/`.
>
> Read ALL schema files first to understand every table, its columns, relationships, and constraints:
> - `packages/db/src/schema/auth.ts` — users, userProfiles, roles, userRoles, sessions, refreshTokens, verificationTokens, passwordResetTokens, auditLogs, loginAttempts, revokedTokens
> - `packages/db/src/schema/domain.ts` — domains, subjects, topics, subtopics, skills, topicSkills
> - `packages/db/src/schema/question.ts` — questions, questionSkills
> - `packages/db/src/schema/exam.ts` — examBlueprints, exams, examQuestions, resultsByDimension, idempotencyKeys
>
> Create the following seed files:
>
> **1. `packages/db/src/seed/test-seed.ts`** — Main seed orchestrator
> - Exports `seedTestDatabase()` and `clearTestDatabase()` functions
> - `clearTestDatabase()` should delete all data in correct order respecting foreign keys (child tables first)
> - `seedTestDatabase()` should call individual seeders in correct dependency order
>
> **2. `packages/db/src/seed/seed-data.ts`** — Static test data
> - 3 test users (student, admin, inactive/banned)
> - 2 roles (student, admin) with userRoles assignments
> - 2 domains with full hierarchy (2 subjects each, 2 topics each, 2 subtopics each)
> - 10 skills distributed across topics
> - 30 questions across different topics, difficulties, and types (multiple_choice, true_false)
> - 2 exam blueprints
> - 2 completed exams with answers and scoring results
> - 1 in-progress exam
>
> **3. `packages/db/src/seed/seed-utils.ts`** — Helper utilities
> - `hashPassword(plain)` — bcrypt hash for test passwords
> - `generateUUID()` — deterministic UUID generation for reproducible tests
> - `pastDate(daysAgo)` and `futureDate(daysAhead)` — date helpers
>
> All test data should use deterministic IDs so tests can reference specific records. Use UUIDs that are human-readable in test output (e.g., `00000000-0000-0000-0000-000000000001` for first user).

---

## 1.2 — CI/CD PIPELINE (Tasks 15-24)

---

### Task 15: Create GitHub Actions CI Workflow

**AI Prompt:**

> I need a GitHub Actions CI workflow for my Quiz Platform pnpm monorepo. The monorepo uses pnpm@9.15.4, Node 20.x, and Turborepo.
>
> Create `.github/workflows/ci.yml` with the following pipeline stages that run on every push and pull request to `main`:
>
> **Stage 1 — Setup:**
> - Checkout code
> - Install pnpm 9.15.4
> - Set up Node 20.x with pnpm cache
> - Install dependencies with `pnpm install --frozen-lockfile`
>
> **Stage 2 — Quality Checks (run in parallel):**
> - `lint` job: Run `pnpm turbo lint`
> - `type-check` job: Run `pnpm turbo type-check`
> - `test` job: Run `pnpm turbo test` with coverage
>
> **Stage 3 — Build (depends on all Stage 2 passing):**
> - `build` job: Run `pnpm turbo build`
>
> **Additional configuration:**
> - Cancel in-progress runs when new commits are pushed to the same PR
> - Cache `.turbo` directory for faster subsequent runs
> - Upload test coverage reports as artifacts
> - Upload build output as artifact
> - Set timeout of 15 minutes per job
> - Add a status badge configuration line as comment at top of file
>
> Also create `.github/workflows/pr-check.yml` that runs ONLY on pull requests and adds a required status check. This should be a lighter version that runs lint + type-check + test but skips the full build.

---

### Task 16: Add ESLint Strict Rules to CI

**AI Prompt:**

> I need to ensure ESLint is properly configured and enforced across my Quiz Platform monorepo for CI. Check the current ESLint setup by reading any existing `.eslintrc.*` or `eslint.config.*` files in the root and each app.
>
> Then ensure the following:
>
> 1. Each app (`apps/api-server`, `apps/web-app`, `apps/admin-app`) has an ESLint config that extends:
>    - `next/core-web-vitals` (for Next.js apps)
>    - `@typescript-eslint/recommended`
>    - `@typescript-eslint/strict` (adds stricter type-aware rules)
>
> 2. Add these specific rules across all packages:
>    - `no-explicit-any`: warn (eventual goal: error)
>    - `no-unused-vars`: error (with `argsIgnorePattern: "^_"`)
>    - `no-console`: warn in production code, off in test files
>    - `prefer-const`: error
>    - `no-var`: error
>    - `eqeqeq`: error
>
> 3. Each package's `package.json` has a `lint` script
>
> 4. Add a `lint:fix` script at root for local developer convenience
>
> 5. Add an `.eslintignore` at root to skip: `node_modules`, `dist`, `.next`, `coverage`, `*.config.js`
>
> Do NOT fix any existing lint errors — only set up the configuration. The CI pipeline will report errors for developers to fix.

---

### Task 17: Add TypeScript Strict Type Checking to CI

**AI Prompt:**

> I need to add TypeScript strict type checking as a CI step in my Quiz Platform monorepo. The monorepo has a root `tsconfig.json` and each workspace package has its own `tsconfig.json`.
>
> 1. Read the root `tsconfig.json` and every package's `tsconfig.json` to understand current strictness settings.
>
> 2. Ensure every `tsconfig.json` has these strict settings enabled:
>    - `strict: true`
>    - `noUncheckedIndexedAccess: true`
>    - `noImplicitReturns: true`
>    - `noFallthroughCasesInSwitch: true`
>    - `forceConsistentCasingInFileNames: true`
>    - `exactOptionalPropertyTypes: false` (too strict for now, can enable later)
>
> 3. Add a `type-check` script to each package's `package.json` that runs `tsc --noEmit`
>
> 4. Add a root `type-check` script that runs `turbo type-check`
>
> 5. Ensure `turbo.json` has the `type-check` task configured with correct dependency ordering (packages/db and packages/api-client should type-check before apps that depend on them)
>
> Do NOT fix any existing type errors — only set up the configuration. The CI pipeline will report errors.

---

### Task 18: Add Test Execution and Coverage Reporting to CI

**AI Prompt:**

> I need to update the GitHub Actions CI workflow (`.github/workflows/ci.yml` created in Task 15) to include proper test execution with coverage reporting.
>
> Update the `test` job in the CI workflow to:
>
> 1. Run tests with coverage: `pnpm turbo test -- --coverage`
>
> 2. After tests complete, upload coverage reports:
>    - Use `actions/upload-artifact@v4` to upload each package's `coverage/` directory
>    - Name artifacts clearly: `coverage-api-server`, `coverage-web-app`, etc.
>
> 3. Add a coverage summary comment on PRs:
>    - Use a coverage reporter action (e.g., `davelosert/vitest-coverage-report-action` or similar)
>    - Post coverage summary as a PR comment showing per-package coverage percentages
>    - Show coverage diff (increase/decrease) compared to base branch
>
> 4. Add coverage threshold enforcement:
>    - If any package is below the configured Vitest thresholds, the CI job should fail
>    - This is already handled by Vitest config from Task 12, but ensure the CI correctly reports the failure
>
> 5. Cache test results:
>    - Turbo already caches test outputs — ensure `.turbo` cache is preserved between runs
>
> 6. Add test summary to GitHub Actions:
>    - Use Vitest's `--reporter=junit` to generate JUnit XML
>    - Use a test reporter action to display test results in the GitHub Actions UI

---

### Task 19: Add Build Verification to CI

**AI Prompt:**

> I need to update the GitHub Actions CI workflow to ensure the build step properly verifies all 3 apps and 2 packages build successfully.
>
> Update the `build` job in `.github/workflows/ci.yml`:
>
> 1. The build job should depend on lint, type-check, and test jobs all passing
>
> 2. Run `pnpm turbo build` which builds all packages in topological order:
>    - `packages/db` builds first (no dependencies)
>    - `packages/api-client` builds next (depends on db types)
>    - `apps/api-server`, `apps/web-app`, `apps/admin-app` build last (depend on packages)
>
> 3. After build, verify build outputs exist:
>    - Check `apps/api-server/.next/` directory exists
>    - Check `apps/web-app/.next/` directory exists
>    - Check `apps/admin-app/.next/` directory exists
>
> 4. Upload build artifacts for deployment:
>    - Upload each app's `.next/` directory as artifact
>    - Set retention to 7 days
>
> 5. Add build time reporting:
>    - Log how long each package took to build
>    - Turbo already reports this — ensure output is visible in CI logs
>
> 6. Set a reasonable timeout (10 minutes for build job)
>
> 7. Add a final `ci-success` job that depends on ALL other jobs and simply succeeds — use this as the single required status check for branch protection (simplifies configuration).

---

### Task 20: Add PR Status Checks and Branch Protection

**AI Prompt:**

> I need to configure PR status checks and document the branch protection rules needed for my Quiz Platform GitHub repository.
>
> 1. Create `.github/branch-protection.md` documenting the recommended branch protection settings for the `main` branch:
>    - Require status checks to pass before merging: `ci-success` job
>    - Require branches to be up to date before merging
>    - Require at least 1 approval on PRs (if team size > 1)
>    - Do not allow bypassing the above settings
>    - Recommended: require linear history (no merge commits)
>    - Recommended: auto-delete head branches after merge
>
> 2. Create `.github/pull_request_template.md` with this structure:
>    - Description section (what changed and why)
>    - Type of change checkboxes (bug fix, feature, refactor, docs, test, config)
>    - Checklist: tests added/updated, types pass, lint passes, tested locally
>    - Screenshots section (if UI changes)
>
> 3. Create `.github/CODEOWNERS` file:
>    - `packages/db/` — database team/owner
>    - `apps/api-server/src/modules/auth/` — security-sensitive, requires specific reviewer
>    - `*` — default owner
>    - Use placeholder GitHub usernames with comments explaining who should be assigned
>
> These are configuration files and documentation — they don't run code. Branch protection rules must be manually configured in GitHub Settings > Branches by a repo admin.

---

### Task 21: Add Dependabot for Dependency Updates

**AI Prompt:**

> I need to configure Dependabot for automated dependency updates in my Quiz Platform monorepo. The monorepo uses pnpm with workspace protocol.
>
> Create `.github/dependabot.yml` with the following configuration:
>
> 1. **npm ecosystem** (covers pnpm):
>    - Check for updates weekly (Monday at 9:00 AM)
>    - Set directory to `/` (monorepo root)
>    - Open maximum 10 PRs at a time
>    - Group updates by type:
>      - `production-dependencies`: all production deps updates in one PR
>      - `dev-dependencies`: all dev deps updates in one PR
>      - `eslint`: group all eslint-related packages
>      - `typescript`: group all typescript-related packages
>      - `next`: group all Next.js-related packages
>    - Add labels: `dependencies`, `automated`
>    - Add reviewers: use placeholder GitHub username
>    - Set commit message prefix: `chore(deps):`
>    - Ignore major version updates for: `react`, `next`, `typescript` (these need manual migration)
>
> 2. **GitHub Actions ecosystem**:
>    - Check for updates weekly
>    - Set directory to `/`
>    - Add label: `ci`
>
> Also create `.github/workflows/dependabot-auto-merge.yml`:
> - Automatically approve and merge Dependabot PRs that:
>   - Are patch version updates only
>   - Pass all CI checks
>   - This uses `gh pr merge --auto --squash`

---

### Task 22: Add Security Scanning (npm audit + Snyk) to CI

**AI Prompt:**

> I need to add security vulnerability scanning to my Quiz Platform CI pipeline.
>
> Create `.github/workflows/security.yml` with these jobs:
>
> **1. Dependency Audit (runs on every PR and weekly schedule):**
> - Run `pnpm audit --audit-level=high` to check for known vulnerabilities
> - If high/critical vulnerabilities found, fail the CI check
> - Post findings as a PR comment (summarize vulnerable packages and severity)
>
> **2. License Compliance (runs on every PR):**
> - Install `license-checker` as a dev dependency
> - Run license check against an allowlist of permissive licenses: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, CC0-1.0, Unlicense
> - Flag any copyleft licenses (GPL, LGPL, AGPL) or unknown licenses
> - Fail CI if non-compliant licenses found
>
> **3. Secret Scanning (runs on every PR):**
> - Use `trufflesecurity/trufflehog` GitHub Action
> - Scan for accidentally committed secrets, API keys, tokens
> - Scan only the PR diff (not full history) for speed
> - Fail CI if secrets detected
>
> **4. Static Analysis — optional/future:**
> - Add a commented-out job for SonarQube or Semgrep integration
> - Include setup instructions as comments for when team is ready to adopt
>
> Add these security checks as required status checks in the branch protection documentation from Task 20.

---

### Task 23: Add Bundle Size Check to CI

**AI Prompt:**

> I need to add bundle size monitoring to my Quiz Platform CI pipeline to prevent bundle bloat in the two frontend apps.
>
> 1. Install `@next/bundle-analyzer` in both `apps/web-app` and `apps/admin-app`
>
> 2. Update both apps' `next.config.ts` (or `next.config.js`) to conditionally enable the bundle analyzer when `ANALYZE=true` environment variable is set
>
> 3. Create `.github/workflows/bundle-analysis.yml`:
>    - Runs on pull requests only
>    - Builds both frontend apps with `ANALYZE=true`
>    - Captures the `.next/analyze/` output
>    - Compares bundle sizes against the `main` branch:
>      - Build the PR branch, record sizes
>      - Build the base branch (`main`), record sizes
>      - Calculate diff
>    - Posts a PR comment with bundle size comparison table:
>      - Per-page JavaScript size (first load JS)
>      - Total shared bundle size
>      - Largest 5 pages by JS size
>      - Red highlight if any page exceeds 200KB first-load JS
>      - Green/red arrows showing size increase/decrease
>    - Fail check if total bundle increases by more than 10% compared to main
>
> 4. Add root scripts: `analyze:web` and `analyze:admin` for local bundle analysis
>
> Do NOT fix any existing bundle size issues — only set up the monitoring infrastructure.

---

### Task 24: Configure Vercel Preview Deployments with CI Checks

**AI Prompt:**

> I need to configure Vercel preview deployments to integrate properly with my GitHub CI pipeline for the Quiz Platform monorepo.
>
> Read the existing `vercel.json` files in `apps/web-app/` and `apps/admin-app/` to understand current Vercel configuration.
>
> Then make these changes:
>
> 1. Update both `vercel.json` files to include:
>    - `github.silent: true` — Suppress Vercel's default PR comments (we'll use our own)
>    - Ensure `buildCommand` uses `pnpm turbo build --filter=<app-name>`
>    - Ensure `installCommand` uses `pnpm install --frozen-lockfile`
>
> 2. Create `.github/workflows/preview-comment.yml`:
>    - Triggered when Vercel deployment completes (use `deployment_status` event)
>    - Posts a single consolidated PR comment with:
>      - Preview URLs for both web-app and admin-app
>      - Link to the CI checks status
>      - Build time information
>      - Warning banner if any CI checks are failing
>
> 3. Create a `vercel.json` for `apps/api-server` if it doesn't exist:
>    - Configure as a Next.js API server
>    - Set appropriate function regions
>    - Set function max duration (match your Vercel plan limits)
>
> 4. Document in a new file `.github/DEPLOYMENT.md`:
>    - How preview deployments work (automatic on every PR)
>    - How production deployments work (on merge to main)
>    - How to rollback a bad production deployment
>    - Environment variable management (which vars each app needs)
>    - List all required Vercel environment variables with descriptions (DO NOT include actual secret values)

---

## 1.3 — ERROR TRACKING & MONITORING (Tasks 25-33)

---

### Task 25: Install and Configure Sentry for API Server

**AI Prompt:**

> I need to set up Sentry error tracking for the API server in my Quiz Platform monorepo. The API server is a Next.js 16.1 app at `apps/api-server/`.
>
> 1. Install `@sentry/nextjs` in `apps/api-server`
>
> 2. Create Sentry configuration files:
>    - `apps/api-server/sentry.server.config.ts` — Server-side Sentry init with:
>      - DSN from `SENTRY_DSN` environment variable
>      - Environment from `VERCEL_ENV` or `NODE_ENV`
>      - Sample rate: 1.0 for errors, 0.1 for transactions (performance)
>      - Attach server context (request headers, query params — but NOT body to avoid PII)
>      - Filter out health check endpoints from transaction tracking
>      - Set `maxBreadcrumbs: 50`
>    - `apps/api-server/sentry.edge.config.ts` — Edge runtime Sentry init (if using edge functions)
>
> 3. Update `apps/api-server/next.config.ts`:
>    - Wrap with `withSentryConfig()` from `@sentry/nextjs`
>    - Configure source map upload for production builds
>    - Set `silent: true` to suppress Sentry webpack plugin output during build
>
> 4. Create `apps/api-server/src/lib/sentry.ts` — Helper utility:
>    - `captureApiError(error, context)` — Captures error with extra context (route path, user ID, request ID)
>    - `setUserContext(userId, email, role)` — Sets Sentry user context for the current scope
>    - `addBreadcrumb(message, category, data)` — Adds navigation breadcrumb
>
> 5. Update ONE example API route (e.g., the exam start route) to show how to integrate Sentry error capturing in the catch block. This serves as the pattern for other routes to follow.
>
> Add `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` to the `.env.example` file (create it if it doesn't exist).

---

### Task 26: Install and Configure Sentry for Web App

**AI Prompt:**

> I need to set up Sentry error tracking for the student-facing web app in my Quiz Platform monorepo. The web app is a Next.js 16.1 app at `apps/web-app/`.
>
> 1. Install `@sentry/nextjs` in `apps/web-app`
>
> 2. Create Sentry configuration files:
>    - `apps/web-app/sentry.client.config.ts` — Client-side Sentry init with:
>      - DSN from `NEXT_PUBLIC_SENTRY_DSN` environment variable
>      - Environment from `NEXT_PUBLIC_VERCEL_ENV` or `NODE_ENV`
>      - Sample rate: 1.0 for errors, 0.05 for transactions (keep client overhead low)
>      - `replaysSessionSampleRate: 0.1` — Record 10% of sessions
>      - `replaysOnErrorSampleRate: 1.0` — Always record sessions that have errors
>      - Add Sentry Replay integration for session replay on errors
>      - Add BrowserTracing integration for performance monitoring
>      - Set `maxBreadcrumbs: 30`
>      - Filter out chunk load errors and network errors from non-critical third-party scripts
>    - `apps/web-app/sentry.server.config.ts` — Server-side Sentry init (for SSR errors)
>    - `apps/web-app/sentry.edge.config.ts` — Edge runtime init
>
> 3. Update `apps/web-app/next.config.ts`:
>    - Wrap with `withSentryConfig()`
>    - Configure source map upload
>    - Enable `hideSourceMaps: true` in production (don't expose source maps to users)
>
> 4. Create `apps/web-app/src/lib/sentry.ts` — Helper utility:
>    - `captureClientError(error, context)` — Client-side error capture with component stack
>    - `setUserContext(userId, email)` — Set user context after login
>    - `clearUserContext()` — Clear user context on logout
>
> 5. Add Sentry user context integration:
>    - Read the auth store (`apps/web-app/src/store/auth-store.ts`) and identify where to call `setUserContext` after successful login and `clearUserContext` on logout
>    - Show the integration points as comments (where to add the calls) but implement in 1-2 key locations
>
> Add `NEXT_PUBLIC_SENTRY_DSN` to the `.env.example` file.

---

### Task 27: Install and Configure Sentry for Admin App

**AI Prompt:**

> I need to set up Sentry error tracking for the admin dashboard in my Quiz Platform monorepo. The admin app is a Next.js 16.1 app at `apps/admin-app/`.
>
> Follow the exact same pattern as Task 26 (web-app Sentry setup) but with these differences:
>
> 1. Install `@sentry/nextjs` in `apps/admin-app`
>
> 2. Create the same 3 config files (client, server, edge) but with admin-specific settings:
>    - Use a DIFFERENT Sentry project (separate `NEXT_PUBLIC_SENTRY_DSN_ADMIN` or use the same DSN but tag with `app: 'admin'`)
>    - Transaction sample rate: 0.2 (admin has fewer users, can afford higher sampling)
>    - Session replay sample rate: 0.2
>    - Add `environment` tag and `app: 'admin-dashboard'` tag to all events
>
> 3. Update `apps/admin-app/next.config.ts` with Sentry wrapper
>
> 4. Create `apps/admin-app/src/lib/sentry.ts` with same helpers but admin-scoped:
>    - Include admin role information in user context
>    - Tag all events with admin-specific metadata
>
> 5. Integrate user context with admin auth store at `apps/admin-app/src/store/auth-store.ts`
>
> The admin app should report to a separate Sentry project (or at minimum use distinct tags) so admin errors can be filtered separately from student errors in the Sentry dashboard.

---

### Task 28: Add error.tsx to Every Route Segment in Web App

**AI Prompt:**

> I need to add Next.js error boundaries (`error.tsx`) to every route segment in the web app at `apps/web-app/src/app/`.
>
> First, read the complete directory structure of `apps/web-app/src/app/` to identify ALL route segments (folders containing `page.tsx` or `layout.tsx`).
>
> Then create an `error.tsx` file for each route segment. Each error boundary should:
>
> 1. Be a client component (`'use client'`)
> 2. Accept `{ error, reset }` props (Next.js error boundary convention)
> 3. Log the error to Sentry using the helper from Task 26 (`captureClientError`)
> 4. Display a user-friendly error message appropriate to the route context:
>    - **Exam routes** (`/exam/[examId]`): "Something went wrong during your exam. Your progress has been saved. [Try Again] [Return to Dashboard]"
>    - **Report routes** (`/reports/`): "Unable to load your report. [Try Again] [Back to Dashboard]"
>    - **Auth routes** (`/login`, `/signup`): "Authentication error. [Try Again] [Contact Support]"
>    - **Dashboard/home**: "Unable to load dashboard. [Refresh]"
>    - **Generic fallback**: "An unexpected error occurred. [Try Again]"
> 5. Include the `reset` button that calls the `reset()` function to retry rendering
> 6. Include a "Return to Dashboard" link as a safe escape
> 7. Style using the existing Tailwind CSS classes and design system used in the app
> 8. In development mode (`process.env.NODE_ENV === 'development'`), also show the error message and stack trace in a collapsible details section
>
> Also create `apps/web-app/src/app/global-error.tsx` as the root-level error boundary that catches errors in the root layout itself. This must include its own `<html>` and `<body>` tags since it replaces the root layout.

---

### Task 29: Add error.tsx to Every Route Segment in Admin App

**AI Prompt:**

> I need to add Next.js error boundaries (`error.tsx`) to every route segment in the admin app at `apps/admin-app/src/app/`.
>
> First, read the complete directory structure of `apps/admin-app/src/app/` to identify ALL route segments.
>
> Then create an `error.tsx` file for each route segment, following the same pattern as Task 28 but with admin-specific messaging:
>
> 1. Be a client component (`'use client'`)
> 2. Log errors to Sentry (admin project)
> 3. Display admin-appropriate error messages:
>    - **Dashboard routes**: "Dashboard data failed to load. This may be a temporary issue. [Retry] [View System Health]"
>    - **Question management routes**: "Unable to load question data. [Retry] [Back to Dashboard]"
>    - **User management routes**: "User management error. [Retry] [Back to Dashboard]"
>    - **Analytics routes**: "Analytics query failed. The data may be temporarily unavailable. [Retry]"
>    - **Factory routes**: "Question factory error. Your progress has been preserved. [Retry]"
>    - **Generic fallback**: "Admin panel error. [Retry] [Back to Dashboard]"
> 4. Include `reset` button and navigation escape
> 5. In development mode, show error details
> 6. Style with existing admin app Tailwind classes
>
> Also create `apps/admin-app/src/app/global-error.tsx` as root error boundary.

---

### Task 30: Add loading.tsx to Every Route Segment in Web App

**AI Prompt:**

> I need to add Next.js loading states (`loading.tsx`) to every route segment in the web app at `apps/web-app/src/app/`.
>
> First, read the complete directory structure of `apps/web-app/src/app/` to identify ALL route segments.
>
> Then create a `loading.tsx` file for each route segment. Each loading component should:
>
> 1. Check if there is an existing loading/spinner component in the codebase (search for `ZLoader`, `Spinner`, `Loading`, `Skeleton` components). If one exists, use it. If not, create a simple animated loading component.
>
> 2. Display context-appropriate loading states:
>    - **Exam routes** (`/exam/[examId]`): Show a loading skeleton that matches the exam UI layout (question area + sidebar shape)
>    - **Report routes** (`/reports/`): Show skeleton cards matching the report layout
>    - **Dashboard/home**: Show skeleton grid matching the dashboard layout
>    - **Auth routes**: Show a centered spinner with "Loading..." text
>    - **Quiz selection**: Show skeleton matching the multi-step selection UI
>    - **Generic fallback**: Centered spinner/pulse animation
>
> 3. Use Tailwind CSS `animate-pulse` on skeleton elements for a polished loading feel
>
> 4. Each loading state should roughly match the layout of the actual page content to prevent layout shift (CLS improvement)
>
> 5. Keep loading components lightweight — no data fetching, no complex logic, just static skeleton markup
>
> Read the actual page components to understand what layout shape each skeleton should mimic.

---

### Task 31: Add loading.tsx to Every Route Segment in Admin App

**AI Prompt:**

> I need to add Next.js loading states (`loading.tsx`) to every route segment in the admin app at `apps/admin-app/src/app/`.
>
> First, read the complete directory structure of `apps/admin-app/src/app/` to identify ALL route segments.
>
> Then create a `loading.tsx` file for each route segment with admin-appropriate loading skeletons:
>
> 1. **Dashboard route**: Skeleton grid with 9 placeholder cards matching the 9 dashboard panels (UserAnalytics, ExamActivity, RBAC, Security, SystemAudit, QuestionFactory, ContentReadiness, BlueprintAudit, Performance)
>
> 2. **Question management routes**: Table skeleton (header row + 10 placeholder rows with shimmer)
>
> 3. **User management routes**: Table skeleton similar to question management
>
> 4. **Analytics routes**: Chart placeholder skeletons (rectangular areas for charts + stat cards)
>
> 5. **Factory routes**: Multi-panel skeleton matching the AI Question Factory layout (ContextSelector, DistributionMatrix, SourceEditor, etc.)
>
> 6. **Settings/config routes**: Form skeleton with input field placeholders
>
> 7. **Auth/login route**: Centered form skeleton
>
> Use Tailwind CSS `animate-pulse` for all skeleton elements. Match the approximate dimensions and layout of actual page content. Keep components lightweight — static markup only.

---

### Task 32: Add not-found.tsx for Custom 404 Pages

**AI Prompt:**

> I need custom 404 (Not Found) pages for both frontend apps in my Quiz Platform monorepo.
>
> **1. `apps/web-app/src/app/not-found.tsx`** — Student-facing 404 page:
> - Display a friendly "Page Not Found" message
> - Show a brief explanation: "The page you're looking for doesn't exist or has been moved."
> - Include navigation options:
>   - "Go to Dashboard" button (primary action)
>   - "Start a Quiz" button (secondary action)
>   - "Back to previous page" link
> - Style consistent with the web-app design system (read existing pages for design patterns)
> - Include the app's logo/header if applicable
> - Optionally include a simple illustration or icon (use an existing icon library if the project has one)
>
> **2. `apps/admin-app/src/app/not-found.tsx`** — Admin-facing 404 page:
> - Display "Page Not Found" with admin context
> - Navigation options:
>   - "Go to Dashboard" button
>   - "Back to previous page" link
> - Style consistent with admin app design
>
> **3. Dynamic route not-found handling:**
> - For `apps/web-app/src/app/exam/[examId]/not-found.tsx`: "This exam was not found. It may have been deleted or the link is invalid. [Back to Quiz Selection]"
> - For `apps/web-app/src/app/reports/[id]/not-found.tsx`: "This report was not found. [Back to Reports]"
>
> All 404 pages should be server components (no `'use client'`) since they don't need interactivity beyond links.

---

### Task 33: Add global-error.tsx as Root Error Boundary

**AI Prompt:**

> I need root-level error boundaries for both frontend apps. These catch errors that occur in the root layout itself — when the root layout crashes, the normal `error.tsx` files can't help because they render INSIDE the layout.
>
> **1. `apps/web-app/src/app/global-error.tsx`:**
> - Must be a client component (`'use client'`)
> - Must include its own `<html>` and `<body>` tags (since it replaces the root layout)
> - Import and initialize Sentry directly (can't rely on providers from root layout)
> - Display a full-page error screen:
>   - Clean, minimal design (inline styles or basic Tailwind — can't rely on global CSS loading)
>   - "Something went wrong" heading
>   - "We're sorry, the application encountered a critical error." message
>   - [Refresh Page] button that calls `reset()`
>   - [Return to Home] link that navigates to "/"
>   - In development: show error.message and error.stack in a pre-formatted block
> - Log the error to Sentry with `severity: 'fatal'` tag
> - Include basic meta tags (viewport, charset) since root layout is replaced
>
> **2. `apps/admin-app/src/app/global-error.tsx`:**
> - Same structure as web-app version
> - Admin-specific messaging: "The admin dashboard encountered a critical error."
> - Include [Refresh Page] and [Return to Login] options
> - Log to admin Sentry project
>
> These are last-resort error handlers. Keep them as self-contained as possible with minimal external dependencies since the normal app infrastructure (providers, layouts, styles) may not be available.

---

## 1.4 — DATABASE CONNECTION SAFETY (Tasks 34-38)

---

### Task 34: Configure Connection Pool Limits

**AI Prompt:**

> I need to configure proper database connection pool limits for my Quiz Platform. The database client is initialized in `packages/db/src/schema/index.ts` using a Proxy-based lazy singleton pattern with Neon serverless PostgreSQL.
>
> Read the current `packages/db/src/schema/index.ts` file to understand the existing connection setup.
>
> Then modify it to include proper pool configuration:
>
> 1. **Connection pool settings:**
>    - `max: 20` — Maximum connections per serverless function instance (Neon free tier supports ~100 total, Pro supports more)
>    - `idleTimeoutMillis: 30000` — Close idle connections after 30 seconds (important for serverless — don't hold connections between requests)
>    - `connectionTimeoutMillis: 10000` — Fail fast if can't get connection within 10 seconds
>    - `maxUses: 7500` — Recycle connections after 7500 uses (prevents memory leaks)
>
> 2. **Environment-based configuration:**
>    - Use `DATABASE_POOL_URL` for pooled connections (Neon's PgBouncer URL ending in `?pgbouncer=true`)
>    - Use `DATABASE_DIRECT_URL` for migrations only (direct connection, not pooled)
>    - Add a `getPoolConfig()` function that returns different pool sizes based on environment:
>      - Production: `max: 20`
>      - Preview/staging: `max: 10`
>      - Development: `max: 5`
>
> 3. **Connection error handling:**
>    - Add error event listener on the pool to log connection errors
>    - Add a connection validation query (`SELECT 1`) to verify connections before use
>
> 4. **Monitoring hooks:**
>    - Log when pool is exhausted (all connections busy)
>    - Log connection acquisition time if it exceeds 5 seconds (early warning)
>
> Also update `drizzle.config.ts` at root to use `DATABASE_DIRECT_URL` for migrations specifically.
>
> Add the new environment variables (`DATABASE_POOL_URL`, `DATABASE_DIRECT_URL`) to `.env.example` with explanatory comments.

---

### Task 35: Add Connection Pool Monitoring

**AI Prompt:**

> I need to add connection pool monitoring to the database client in my Quiz Platform. The database is configured in `packages/db/src/schema/index.ts` (updated in Task 34 with pool limits).
>
> Read the current file to understand the pool setup, then add monitoring:
>
> 1. **Pool event listeners:**
>    - `pool.on('connect')` — Log new connection created (debug level)
>    - `pool.on('acquire')` — Track connection acquisition (debug level)
>    - `pool.on('remove')` — Log connection removed from pool (debug level)
>    - `pool.on('error')` — Log pool-level errors (error level) with full error details
>
> 2. **Pool health metrics function:**
>    - Create an exported `getPoolMetrics()` function that returns:
>      - `totalConnections` — Current total connections in pool
>      - `idleConnections` — Connections not currently in use
>      - `waitingRequests` — Requests waiting for a connection
>      - `maxConnections` — Configured maximum
>      - `utilizationPercent` — (total - idle) / max * 100
>    - This function will be called by the health check endpoint (Task 76)
>
> 3. **Warning thresholds:**
>    - If `utilizationPercent > 80%`, log a warning: "Connection pool utilization high: {percent}%"
>    - If `waitingRequests > 0`, log a warning: "Requests waiting for DB connection: {count}"
>    - If a connection acquisition takes longer than 5 seconds, log a warning with the wait time
>
> 4. **Graceful pool management:**
>    - Create an exported `closePool()` function for graceful shutdown
>    - This should drain existing connections and prevent new ones
>
> Keep the monitoring lightweight — use conditional logging that can be disabled in production if too noisy. Use structured log format: `{ event: 'pool_warning', metric: 'utilization', value: 85 }`.

---

### Task 36: Configure Neon Connection Pooler

**AI Prompt:**

> I need to configure Neon's built-in connection pooler (PgBouncer) for my Quiz Platform monorepo. The project currently uses a single `DATABASE_URL` environment variable for all database access.
>
> Read the current database configuration in `packages/db/src/schema/index.ts` and `drizzle.config.ts`.
>
> Then make these changes:
>
> 1. **Neon provides two connection URLs:**
>    - **Pooled URL**: `postgres://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require` (goes through PgBouncer, supports 10,000+ connections)
>    - **Direct URL**: `postgres://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require` (direct to PostgreSQL, limited connections)
>
> 2. **Update `packages/db/src/schema/index.ts`:**
>    - Use Neon's `@neondatabase/serverless` driver with WebSocket support for serverless environments
>    - Use `DATABASE_POOL_URL` (pooled) for all runtime queries
>    - Configure the Neon serverless driver with `fetchConnectionCache: true` for connection reuse
>    - For local development, fall back to `DATABASE_URL` with standard pg driver
>
> 3. **Update `drizzle.config.ts`:**
>    - Use `DATABASE_DIRECT_URL` for migrations (migrations need direct connections, not pooled)
>    - Document why: "PgBouncer doesn't support all PostgreSQL features needed for DDL migrations"
>
> 4. **Update `.env.example`:**
>    - `DATABASE_POOL_URL=` — "Neon pooled connection (for runtime queries)"
>    - `DATABASE_DIRECT_URL=` — "Neon direct connection (for migrations only)"
>    - `DATABASE_URL=` — "Local development PostgreSQL URL"
>
> 5. **Document the setup** in a code comment block explaining:
>    - Why pooled vs direct connections matter
>    - Neon free tier connection limits
>    - How PgBouncer helps in serverless environments

---

### Task 37: Add Database Query Timeouts

> [!IMPORTANT]
> **STATUS**: `withTimeout` utility and Pool presets implemented.
> **CARRY-FORWARD**: Server-side `statement_timeout` and Engine-level `withTimeout` application moved to **Phase 2**.

**AI Prompt:**

> I need to add query timeout protection to prevent runaway database queries from locking up my Quiz Platform's PostgreSQL database.
>
> Read the database configuration in `packages/db/src/schema/index.ts` and understand how Drizzle ORM queries are executed.
>
> Then implement query timeouts:
>
> 1. **Global statement timeout:**
>    - Set `statement_timeout` to 30 seconds on the connection pool configuration
>    - This is a PostgreSQL server-side timeout that kills queries exceeding the limit
>    - Add it as a connection parameter: `options: '-c statement_timeout=30000'` (30 seconds in milliseconds)
>
> 2. **Per-query timeout utility:**
>    - Create a utility function `withTimeout(queryPromise, timeoutMs, queryDescription)` in `packages/db/src/utils/query-timeout.ts`
>    - This wraps any Drizzle query with a `Promise.race` against a timeout
>    - On timeout, throw a descriptive error: `QueryTimeoutError: "${queryDescription}" exceeded ${timeoutMs}ms`
>    - The error should include the query description for debugging
>
> 3. **Categorized timeouts:**
>    - Create timeout presets:
>      - `QUICK_QUERY_TIMEOUT = 5000` (5s) — Simple lookups, single row fetches
>      - `STANDARD_QUERY_TIMEOUT = 15000` (15s) — Standard CRUD operations
>      - `REPORT_QUERY_TIMEOUT = 30000` (30s) — Analytics, aggregations, reports
>      - `MIGRATION_TIMEOUT = 120000` (120s) — Schema migrations
>
> 4. **Apply timeouts to critical paths:**
>    - Identify the `ScoringEngine.calculateExamResults()` and wrap its heavy queries with `REPORT_QUERY_TIMEOUT`
>    - Identify admin analytics queries and wrap with `REPORT_QUERY_TIMEOUT`
>    - Show how to apply `STANDARD_QUERY_TIMEOUT` to exam engine queries as examples
>
> 5. **Logging on timeout:**
>    - When a query times out, log: query description, timeout value, and a warning to investigate
>    - In the future (Phase 2), this will integrate with structured logging and Sentry

---

### Task 38: Add Missing Database Indexes

> [!IMPORTANT]
> **STATUS**: 26 core indexes implemented.
> **CARRY-FORWARD**: 4 remaining audit-identified indexes (users, audit_logs) moved to **Phase 2**.

**AI Prompt:**

> I need to add missing database indexes to my Quiz Platform to prevent full table scans on common query patterns. The database schema is in `packages/db/src/schema/`.
>
> First, read ALL schema files to understand existing indexes:
> - `packages/db/src/schema/auth.ts`
> - `packages/db/src/schema/domain.ts`
> - `packages/db/src/schema/question.ts`
> - `packages/db/src/schema/exam.ts`
>
> Then, read ALL service files that execute database queries to identify which columns are used in WHERE, JOIN, ORDER BY, and GROUP BY clauses:
> - `apps/api-server/src/modules/` — all service files
>
> Based on the actual query patterns found in the codebase, add these missing indexes to the appropriate schema files using Drizzle ORM's index API:
>
> 1. `users.created_at` — Used in admin user listing with date range filters
> 2. `users.email` — Used in login lookup (may already have unique index — verify)
> 3. `audit_logs.action` — Used in admin audit log filtering
> 4. `audit_logs.created_at` — Used in date range queries
> 5. `audit_logs.user_id` — Used in per-user audit lookup
> 6. `results_by_dimension.exam_id` — Used in score report fetching
> 7. `exams.completed_at` — Used in analytics date range queries
> 8. `exams.user_id` + `exams.status` — Composite index for "find user's active exams"
> 9. `exam_questions.exam_id` — Used in loading exam questions (may already exist — verify)
> 10. `questions.topic_id` — Used in question selection filtering
> 11. `questions.difficulty` — Used in difficulty-based selection
> 12. `login_attempts.user_id` — Used in lockout checking
> 13. `sessions.user_id` — Used in session validation
> 14. `refresh_tokens.user_id` — Used in token family lookup
>
> For each index: verify it doesn't already exist, add it to the schema file, and add a comment explaining which query pattern it optimizes. Also verify the actual query patterns by reading the service code — only add indexes that are actually needed based on real queries.
>
> After adding indexes, generate a new Drizzle migration by documenting the migration command that should be run: `pnpm drizzle-kit generate`

---

## 1.5 — SECURITY HARDENING (Tasks 39-45)

---

### Task 39: Remove CSRF Bypass via JWT Fallback

**AI Prompt:**

> I need to fix a security vulnerability in the CSRF middleware at `apps/api-server/src/modules/auth/csrf.middleware.ts`. Currently, the CSRF protection can be bypassed if a request has a valid JWT token — this defeats the purpose of CSRF protection.
>
> Read the complete `csrf.middleware.ts` file to understand the current implementation.
>
> The issue: The middleware has a fallback that says "if CSRF token is missing/invalid BUT the request has a valid JWT, allow the request through." This means an attacker who tricks a logged-in user into submitting a form to your API can bypass CSRF protection because the JWT cookie is automatically sent.
>
> Fix this by:
>
> 1. **Remove the JWT fallback bypass** — CSRF validation should be mandatory for all state-changing requests (POST, PUT, PATCH, DELETE) regardless of JWT status
>
> 2. **Keep CSRF exemptions only for:**
>    - GET, HEAD, OPTIONS requests (safe methods)
>    - Requests with API keys (server-to-server, no browser context)
>    - Explicitly allowlisted routes if any (e.g., webhook endpoints that receive external callbacks)
>
> 3. **Ensure the double-submit cookie pattern works correctly:**
>    - Cookie is set on initial page load or login response
>    - Client reads the cookie value and sends it in `X-CSRF-Token` header
>    - Server compares cookie value with header value
>    - Both must match for the request to proceed
>
> 4. **Update error response** for CSRF failures to return 403 with clear message: `{ error: "CSRF validation failed", message: "Missing or invalid CSRF token" }`
>
> 5. **Test the fix** by describing test scenarios:
>    - Valid CSRF: cookie + header match → request allowed
>    - Missing header: cookie present but no header → request blocked
>    - Mismatched: cookie and header have different values → request blocked
>    - No cookie: no CSRF cookie set → request blocked (with helpful error)
>
> Read the production config at `apps/api-server/src/modules/config/production.config.ts` to check CSRF-related settings.

---

### Task 40: Set httpOnly True on CSRF Cookies

> [!IMPORTANT]
> **STATUS**: `httpOnly`, `secure`, and `path` attributes hardened. Error keys standardized.
> **CARRY-FORWARD**: Final pass on cross-domain `SameSite` vs `Lax` attributes moved to **Phase 2**.

**AI Prompt:**

> I need to fix the CSRF cookie configuration in my Quiz Platform. Currently, the CSRF cookie has `httpOnly: false`, which means JavaScript can read it. While this is INTENTIONAL for the double-submit pattern (the client needs to read the cookie to put it in a header), I need to review and optimize the overall CSRF cookie security.
>
> Read these files:
> - `apps/api-server/src/modules/auth/csrf.middleware.ts` — CSRF implementation
> - `apps/api-server/src/modules/config/production.config.ts` — CSRF configuration
>
> The double-submit cookie pattern REQUIRES `httpOnly: false` because the client JavaScript must read the cookie value and send it as a header. This is by design and is NOT a vulnerability in this specific pattern.
>
> However, ensure these OTHER security attributes are properly set:
>
> 1. **`secure: true`** in production (cookie only sent over HTTPS)
> 2. **`sameSite: 'strict'`** or `'lax'` (prevents cookie from being sent in cross-site requests — this is the primary CSRF defense alongside the double-submit pattern)
> 3. **`path: '/'`** (cookie available on all routes)
> 4. **`domain`** should be explicitly set to your domain (not a wildcard)
> 5. **Cookie name** should use `__Host-` prefix in production for additional security (prevents subdomain attacks): `__Host-csrf-token`
>
> 6. **Separate the session/auth cookies** — verify that JWT/session cookies DO have `httpOnly: true`, `secure: true`, `sameSite: strict`. These are the cookies that must NOT be readable by JavaScript.
>
> Update the configuration to ensure all cookie security attributes are correctly set. Document the security rationale for each setting with inline comments.

---

### Task 41: Re-enable Web App Middleware

**AI Prompt:**

> The Next.js middleware in the web app is currently disabled — it returns `NextResponse.next()` for all routes, effectively doing nothing. I need to re-enable it with proper route protection.
>
> Read the current middleware at `apps/web-app/src/middleware.ts` and understand why it was disabled.
>
> Also read:
> - `apps/web-app/src/components/auth/AuthGuard.tsx` — Client-side route protection
> - `apps/web-app/src/store/auth-store.ts` — Auth state management
> - `apps/web-app/src/context/auth-context.tsx` — Auth context
>
> Then re-implement the middleware with these protections:
>
> 1. **Public routes** (no auth required):
>    - `/login`, `/signup`, `/forgot-password`, `/reset-password`
>    - `/` (landing page, if it exists)
>    - `/_next/*`, `/favicon.ico`, `/api/*` (static assets and API routes)
>
> 2. **Protected routes** (require valid auth cookie):
>    - `/dashboard`, `/exam/*`, `/reports/*`, `/profile/*`, `/quiz/*`
>    - If no auth cookie is present, redirect to `/login?redirect={originalUrl}`
>
> 3. **Auth cookie validation:**
>    - Check for the presence of the JWT access token cookie
>    - Do NOT verify the token signature in middleware (too slow, edge runtime limitations) — just check the cookie exists
>    - Full token verification happens in the AuthGuard component and API layer
>
> 4. **Redirect logic:**
>    - Authenticated users hitting `/login` or `/signup` → redirect to `/dashboard`
>    - Unauthenticated users hitting protected routes → redirect to `/login` with return URL
>
> 5. **Middleware matcher config:**
>    - Use Next.js `config.matcher` to only run middleware on relevant routes (skip static files, images, etc.)
>
> 6. **Security headers:**
>    - Add basic security headers to all responses (this will be expanded in Task 42):
>      - `X-Frame-Options: DENY`
>      - `X-Content-Type-Options: nosniff`
>      - `Referrer-Policy: strict-origin-when-cross-origin`
>
> Ensure the middleware works alongside (not conflicts with) the existing client-side AuthGuard component. The middleware provides a first line of defense (fast redirect), while AuthGuard provides the full validation.

---

### Task 42: Add Security Headers

**AI Prompt:**

> I need to add comprehensive security headers to all three apps in my Quiz Platform monorepo. Currently, zero security headers are set in production.
>
> Read the `next.config.ts` (or `next.config.js`) in each app to understand the current configuration.
>
> Add security headers in two places:
>
> **1. Next.js config `headers()` function** (add to each app's next.config):
>
> Add these headers to ALL routes (`source: '/(.*)'`):
>
> - `X-DNS-Prefetch-Control: on` — Enable DNS prefetching
> - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — HSTS (2 years)
> - `X-Frame-Options: DENY` — Prevent clickjacking
> - `X-Content-Type-Options: nosniff` — Prevent MIME type sniffing
> - `Referrer-Policy: strict-origin-when-cross-origin` — Limit referrer information
> - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` — Disable unnecessary browser features
> - `X-XSS-Protection: 0` — Disable (modern best practice; CSP is preferred)
>
> **2. Content Security Policy (CSP):**
>
> Add CSP header with these directives (customize URLs for your actual domains):
> - `default-src 'self'`
> - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (Next.js requires unsafe-inline and unsafe-eval in development; use nonce-based in production if possible)
> - `style-src 'self' 'unsafe-inline'` (Tailwind CSS requires unsafe-inline)
> - `img-src 'self' data: https://images.unsplash.com` (admin uses Unsplash images)
> - `font-src 'self'`
> - `connect-src 'self' https://*.sentry.io https://*.upstash.io` (API, Sentry, Redis)
> - `frame-ancestors 'none'`
>
> **3. Create a shared security headers utility** at `packages/config/security-headers.ts` (or similar shared location) so all 3 apps can import and use the same header configuration. Each app can then extend with app-specific additions.
>
> Document each header's purpose with inline comments.

---

### Task 43: Add Input Sanitization on JSONB Fields

**AI Prompt:**

> I need to add input sanitization for all JSONB (JSON) fields in my Quiz Platform to prevent XSS and injection attacks. The database has JSONB columns that store user-provided content.
>
> First, identify ALL JSONB columns by reading the schema files:
> - `packages/db/src/schema/question.ts` — `questions.options` (JSONB) stores question answer options
> - Check ALL other schema files for any JSONB or JSON columns
>
> Then identify ALL API endpoints that accept JSON data that gets stored in JSONB columns:
> - Question creation/update endpoints
> - Bulk upload endpoints
> - Any other endpoints that accept structured JSON input
>
> Implement sanitization:
>
> 1. **Create `apps/api-server/src/lib/sanitize.ts`** utility with:
>    - `sanitizeHtml(input: string): string` — Strip all HTML tags except safe formatting (b, i, em, strong, code, pre). Use a lightweight library like `sanitize-html` or `DOMPurify` (server-side version) or implement basic regex stripping.
>    - `sanitizeJsonField(obj: unknown): unknown` — Recursively walk a JSON object and sanitize all string values
>    - `sanitizeArray(arr: unknown[]): unknown[]` — Sanitize all elements
>    - `validateJsonDepth(obj: unknown, maxDepth: number): boolean` — Prevent deeply nested JSON bombs
>    - `validateJsonSize(obj: unknown, maxSizeBytes: number): boolean` — Prevent oversized JSON payloads
>
> 2. **Apply sanitization at the API route level:**
>    - BEFORE storing any user-provided JSON in the database, run it through `sanitizeJsonField()`
>    - Apply to question options, bulk upload data, and any other JSONB inputs
>    - Show implementation in the question creation route as an example
>
> 3. **JSON validation rules:**
>    - Maximum JSON depth: 5 levels
>    - Maximum JSON payload size: 1MB
>    - Maximum string value length within JSON: 10,000 characters
>    - No script tags, event handlers, or javascript: URLs in any string value
>
> 4. **Zod integration:**
>    - If the project uses Zod for validation (check existing routes), add `.transform(sanitizeJsonField)` to the Zod schemas for JSONB fields

---

### Task 44: Add .env.example Documentation

> [!NOTE]
> **STATUS**: Skipped by user request to maintain repository privacy.
> **CARRY-FORWARD**: Deferred to **last phase** or as needed for onboarding.

**AI Prompt:**

> I need to create comprehensive `.env.example` files for my Quiz Platform monorepo. Currently there is no documentation of required environment variables, which creates misconfiguration risk.
>
> Read ALL source files that reference `process.env.*` across the entire monorepo to build a complete list of every environment variable used.
>
> Key files to check:
> - `packages/db/src/schema/index.ts` — Database URLs
> - `apps/api-server/src/modules/auth/token.service.ts` — JWT secrets
> - `apps/api-server/src/modules/config/production.config.ts` — Production config
> - `apps/api-server/src/modules/core/cache.service.ts` — Redis config
> - `apps/api-server/src/modules/email/email.service.ts` — Email config
> - `apps/api-server/src/modules/system/usage.service.ts` — External service configs
> - All `next.config.ts` files — Next.js specific vars
> - Any files with `NEXT_PUBLIC_` variables
>
> Create these files:
>
> **1. Root `.env.example`** — Shared variables used by multiple packages:
> - Group variables by category with comment headers
> - For each variable include: name, description, example value (use placeholder like `your_xxx_here`), whether it's required or optional
> - Categories: Database, Authentication, Redis/Cache, Email, External Services, Sentry, Feature Flags
>
> **2. `apps/web-app/.env.example`** — Client-facing variables (`NEXT_PUBLIC_*`):
> - API server URL
> - Sentry DSN
> - Any other public config
>
> **3. `apps/admin-app/.env.example`** — Admin-specific variables:
> - API server URL
> - Admin Sentry DSN
>
> **CRITICAL**: Use ONLY placeholder values. NEVER include real secrets, keys, or URLs. Use patterns like:
> - `DATABASE_POOL_URL=postgresql://user:password@host/database?pgbouncer=true`
> - `JWT_SECRET=your-secret-key-min-32-characters-here`
> - `REDIS_URL=redis://default:password@host:port`
>
> Also add a section at the top of each file explaining how to set up the local development environment.

---

### Task 45: Standardize API Error Response Format

**AI Prompt:**

> I need to standardize the API error response format across all 73+ API routes in my Quiz Platform. Currently, error responses are inconsistent — some return `{ error: string }`, others return `{ error: string, message: string }`, and others return `{ error: string, scope: string }`.
>
> First, read 10-15 different route files across `apps/api-server/src/app/api/` to understand the current variety of error response formats.
>
> Then implement a standardized error system:
>
> **1. Create `apps/api-server/src/lib/api-error.ts`:**
>
> Define a standard error response type:
> - `code` — Machine-readable error code (e.g., "EXAM_NOT_FOUND", "AUTH_TOKEN_EXPIRED", "VALIDATION_FAILED")
> - `message` — Human-readable error message
> - `status` — HTTP status code (400, 401, 403, 404, 422, 429, 500)
> - `details` — Optional additional information (validation errors array, field-level errors, etc.)
> - `requestId` — Unique request identifier (for support/debugging — placeholder for Phase 2 correlation IDs)
> - `timestamp` — ISO 8601 timestamp
>
> Create a custom `ApiError` class that extends `Error` and includes all these fields.
>
> Create helper functions:
> - `badRequest(message, code?, details?)` — 400 error
> - `unauthorized(message?, code?)` — 401 error
> - `forbidden(message?, code?)` — 403 error
> - `notFound(resource, id?)` — 404 error
> - `validationError(errors[])` — 422 with field-level errors
> - `tooManyRequests(retryAfter?)` — 429 error
> - `internalError(message?)` — 500 error
>
> **2. Create `apps/api-server/src/lib/api-response.ts`:**
>
> Create helper for successful responses:
> - `success(data, status?)` — Standard success wrapper
> - `created(data)` — 201 response
> - `noContent()` — 204 response
> - `paginated(data, total, page, pageSize)` — Paginated response with metadata
>
> **3. Update 3-5 example routes** to demonstrate the new pattern (pick routes with different error types). These serve as the migration template for the remaining routes.
>
> **4. Document the error code catalog** in a comment block or separate file listing all error codes by category (AUTH_*, EXAM_*, ADMIN_*, VALIDATION_*, etc.).
>
> Do NOT update all 73+ routes — that would be a massive change. Update the examples and document the migration pattern for gradual adoption.

---

## PHASE 1 COMPLETE

> **Total Tasks in Phase 1: 45**
> After completing all 45 tasks, your platform will have:
> - Automated test suite with 70%+ coverage on critical paths
> - CI/CD pipeline with quality gates
> - Error tracking and user-facing error boundaries
> - Safe database connection management with proper pooling
> - Hardened security with proper CSRF, headers, and input sanitization
> - Standardized error handling across the API
>
> **Estimated effort**: 4-6 weeks with focused development
> **Impact**: From "unsafe to deploy" to "production-safe with quality gates"

---

*Phase 2 prompts are in `PHASE-2-ARCHITECTURAL-FOUNDATION.md`*
