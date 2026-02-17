# 🛡️ Absolute Zero Engineering Manifesto — Complete Roadmap (A → F)

**Created**: 2026-02-16  
**Standard**: FAANG SDE-3 / Enterprise Grade  
**Source**: `docs/governance/ENGINEERING_MANIFESTO.md`  
**Status**: IN PROGRESS — A1 (shared ESLint) & A2 (any-removal + type hardening) completed; middleware→proxy migration done to clear Next.js warnings; Phase A3 (boundary validation) queued next.  
**Total Phases**: 6 | **Total Sessions**: ~30

---

## 📐 Codebase Baseline Metrics

| Metric | Count |
|:-------|------:|
| Source files (`apps/` + `packages/`) | 349 |
| TSX components | 175 |
| Page routes (admin-app) | 26 |
| Page routes (web-app) | 17 |
| API route files | 78 |
| API service/engine files | 41 |
| Existing unit test files | 2 |
| Existing E2E spec files | 5 |
| Components with `data-testid` | 1 |
| Components with `aria-label` | 2 |
| Files using animations | 97 |
| Files using `localStorage` | 18 |
| `console.*` statements | 313 |
| `: any` type usages | 125 |
| Unvalidated `.json() as` casts | 28 |

### `any` Distribution By Package

| Package | `: any` Count |
|:--------|:------------:|
| `api-client` | 41 |
| `web-app` | 38 |
| `admin-app` | 34 |
| `db` | 7 |
| `api-server` | 4 |
| `ui` | 1 |
| **Total** | **125** |

---

## 🔒 PHASE A: Type Safety & Runtime Guards (Manifesto §1)

> **Goal**: Zero `any`, zero implicit booleans, zero floating promises, validated API boundaries.  
> **Sessions**: 4-5 | **Estimated Violations**: ~470

### A1: Shared ESLint Config (Session 1)

**What**: Create a single shared ESLint config that all 3 apps inherit from.

**Steps**:
```bash
# 1. Create shared config package
mkdir -p packages/eslint-config
```

**Create** `packages/eslint-config/index.js`:
```js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'simple-import-sort', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:jsx-a11y/strict',
  ],
  rules: {
    // §1.1 — Zero any & Unsafe Casts
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',

    // §1.2 — Logical Determinism
    '@typescript-eslint/strict-boolean-expressions': ['error', {
      allowString: false,
      allowNumber: false,
      allowNullableObject: true,
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowAny: false,
    }],

    // §1.3 — Async Integrity
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // §1.5 — Explicit Returns (warn first, upgrade to error later)
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],

    // Import ordering
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
};
```

**Create** `packages/eslint-config/package.json`:
```json
{
  "name": "@quiz/eslint-config",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-simple-import-sort": "^12.0.0"
  }
}
```

**Update each app's ESLint config** to extend from `@quiz/eslint-config`:
```json
{
  "extends": ["@quiz/eslint-config"]
}
```

---

### A2: Eliminate `any` Types (Session 2-3)

**What**: Replace all 125 `: any` occurrences with proper types.

#### 🔴 Tier 1 — api-client (41 `any` — Highest Impact)

These are the shared types used by ALL frontend apps. Fixing these cascades fixes everywhere.

| File | `: any` Count | Fix Strategy |
|:-----|:------------:|:-------------|
| `admin-client.ts` | ~30 | Define proper interfaces for each CRUD return type |
| `auth-client.ts` | ~5 | Create `UserProfile`, `AuthResponse` types |
| `quiz-client.ts` | ~3 | Type `options` array properly |
| `fetch-client.ts` | ~3 | Use generics for `post<T>`, `put<T>`, `patch<T>` body |

**Example fix** for `admin-client.ts`:
```ts
// ❌ Before
async createDomain(data: any) { ... }
async getQuestions(...): Promise<{ questions: any[]; total: number; ... }> { ... }

// ✅ After
interface CreateDomainInput { name: string; description?: string; }
interface QuestionResponse { id: string; questionText: string; type: string; ... }

async createDomain(data: CreateDomainInput) { ... }
async getQuestions(...): Promise<{ questions: QuestionResponse[]; total: number; ... }> { ... }
```

#### 🟡 Tier 2 — web-app (38 `any`)

| Area | Count | Fix Strategy |
|:-----|:-----:|:-------------|
| `catch (err: any)` blocks | ~11 | Replace with `catch (err: unknown)` + `instanceof Error` |
| `QuizSelection.tsx` type casts | ~10 | Define `Domain`, `Subject`, `Topic`, `Subtopic` interfaces |
| `dashboard-store.ts` | ~5 | Type the API responses properly |
| `active-report/page.tsx` | ~8 | Define `ReportQuestion`, `TopicPerformance` interfaces |
| `ExamInterface.tsx` | ~3 | Type `Question` and `Option` properly |
| `StatsCards.tsx` `overview: any` | ~1 | Define `OverviewStats` interface |

#### 🟢 Tier 3 — admin-app (34 `any`)

| Area | Count | Fix Strategy |
|:-----|:-----:|:-------------|
| ReviewCards (`topic: any`, etc.) | ~12 | Define `TopicData`, `SubtopicData`, `SkillData` interfaces |
| `TopicTable.tsx` / `SubtopicTable.tsx` | ~6 | Type the form handlers |
| `FactoryContext.tsx` | ~2 | Type `lastHealingReport` |
| `catch (error: any)` blocks | ~4 | Replace with `catch (err: unknown)` |
| `ExamPreflightDialog.tsx` | ~2 | Type `icon` prop with `LucideIcon` |

#### ⚪ Tier 4 — packages: db (7), ui (1)

| File | Count | Fix |
|:-----|:-----:|:----|
| `execute-seed.ts`, `seed-enterprise.ts`, etc. | 7 | `catch (err: unknown)` pattern |
| `SelectField.tsx` | 1 | `options: Array<{ id: string; name: string }>` |

---

### A3: Boundary Validation with Zod (Session 4)

**What**: Add schema validation at all API route edges. Currently **28 routes** use raw `.json() as`.

**Install**:
```bash
pnpm --filter @quiz/api-server add zod
```

**Create** `apps/api-server/src/schemas/` directory with schemas:

| Schema File | Routes It Validates |
|:------------|:-------------------|
| `auth.schemas.ts` | `/auth/login`, `/auth/signup`, `/auth/reset-password` |
| `question.schemas.ts` | `/admin/questions` POST, `/admin/questions/bulk` POST |
| `hierarchy.schemas.ts` | `/admin/domains`, `/admin/subjects`, `/admin/topics`, `/admin/subtopics`, `/admin/skills` (CRUD) |
| `blueprint.schemas.ts` | `/admin/blueprints` POST/PUT |
| `user.schemas.ts` | `/admin/users/[id]` PUT |
| `quiz.schemas.ts` | `/quiz/start`, `/quiz/answer`, `/quiz/submit` |
| `job.schemas.ts` | `/admin/jobs` POST |

**Example**:
```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// In route handler:
const body = loginSchema.parse(await _req.json());
// Now `body` is fully typed and validated — no `as` needed
```

**Routes to convert** (28 total):

| Priority | Routes | Count |
|:---------|:-------|:-----:|
| Critical | auth login, signup, reset-password | 3 |
| Critical | quiz start, answer, submit | 3 |
| High | admin questions CRUD + bulk | 4 |
| High | admin domains/subjects/topics/subtopics/skills CRUD | 15 |
| Standard | blueprints, jobs, users | 3 |

---

### A4: Discriminated Unions for State (Session 5 — Optional/Future)

**What**: Replace boolean flag combos with tagged unions.

**Example**:
```ts
// ❌ Before
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<Data | null>(null);

// ✅ After
type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Data }
  | { status: 'idle' };

const [state, setState] = useState<PageState>({ status: 'loading' });
```

**Components that benefit most**: All 26 admin pages + 17 web pages that follow the `loading/error/data` pattern.

> **Note**: This is the largest refactor and can be done incrementally per page. Not critical for Phase A.

---

### Phase A Summary

| Sub-Phase | What | Violations | Sessions |
|:----------|:-----|:----------:|:--------:|
| A1 | Shared ESLint config | 0 (config) | 1 |
| A2 | Eliminate 125 `any` types | ~125 errors | 2 |
| A3 | Zod boundary validation (28 routes) | ~28 errors | 1 |
| A4 | Discriminated unions (optional) | ~43 warnings | 1 (future) |
| **Total** | | **~153+** | **4-5** |

---

## 🔧 PHASE B: Pre-Commit Hooks & CI/CD (Manifesto §6.1-6.2)

> **Goal**: Automated quality gates — never regress.  
> **Sessions**: 1-2 | **Estimated Violations**: 0 (config only)

### B1: Husky + lint-staged (Session 1)

**Current State**: No `.husky` directory. No pre-commit hooks.

**Steps**:
```bash
# 1. Install
pnpm add -Dw husky lint-staged

# 2. Initialize Husky
npx husky init

# 3. Create pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

**Add to root `package.json`**:
```json
{
  "lint-staged": {
    "apps/**/*.{ts,tsx}": [
      "eslint --max-warnings=0 --fix"
    ],
    "packages/**/*.{ts,tsx}": [
      "eslint --max-warnings=0 --fix"
    ]
  }
}
```

**What this does**: Every `git commit` automatically lints and fixes staged files. If any errors remain, the commit is **blocked**.

---

### B2: Upgrade CI Pipeline (Session 2)

**Current State**: GitHub Actions exists at `.github/workflows/ci.yml` with:
- ✅ Lint (all apps)
- ✅ Type-check (all apps)
- ✅ Build (all apps)
- ❌ No unit tests
- ❌ No E2E smoke
- ❌ No coverage reports

**Upgrade `ci.yml`**:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: ["*"]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup PNPM
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install
        run: pnpm install --frozen-lockfile

      # Gate 1: Lint
      - name: Lint (all apps)
        run: pnpm lint:all

      # Gate 2: Type Safety
      - name: Type-check (all apps)
        run: pnpm typecheck:all

      # Gate 3: Unit Tests + Coverage
      - name: Unit Tests
        run: pnpm test:all
        
      # Gate 4: Build
      - name: Build (all apps)
        run: pnpm build:all

  # Separate job for E2E (needs browser)
  e2e-smoke:
    runs-on: ubuntu-latest
    needs: quality-gates
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup PNPM
        uses: pnpm/action-setup@v4
        with: { version: 9 }
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: 20, cache: "pnpm" }
      
      - name: Install
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run Smoke Tests
        run: pnpm e2e:smoke
      
      - name: Upload Traces
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces
          path: apps/*/test-results/
```

**Add nightly full E2E** (`.github/workflows/nightly.yml`):
```yaml
name: Nightly E2E

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  full-e2e:
    runs-on: ubuntu-latest
    steps:
      # Same setup as above...
      - name: Run Full E2E Suite
        run: pnpm e2e:full
      
      - name: Upload Coverage Report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

---

### Phase B Summary

| Sub-Phase | What | Config Tasks | Sessions |
|:----------|:-----|:----------:|:--------:|
| B1 | Husky + lint-staged pre-commit hooks | 3 files | 1 |
| B2 | Upgrade CI (add tests + E2E smoke) | 2 files | 1 |
| **Total** | | **5 config files** | **2** |

---

## ⚙️ PHASE C: Testing Strategy (Manifesto §2)

> **Goal**: 100% coverage on core services, contract tests on critical routes, Absolute Green E2E.  
> **Sessions**: 10 | **Estimated Items to Create**: ~60 test files

### C1: Unit Testing Foundation (Session 1-2)

**What**: Install vitest in all 3 apps, configure coverage, create test file templates.

**Setup Steps**:
```bash
# 1. Install vitest + coverage in api-server (already partially done)
pnpm --filter @quiz/api-server add -D vitest @vitest/coverage-v8

# 2. Install testing-library for admin-app + web-app
pnpm --filter @quiz/admin-app add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom @vitest/coverage-v8
pnpm --filter @quiz/web-app add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom @vitest/coverage-v8

# 3. Add test scripts in each app's package.json
# "test": "vitest run"
# "test:watch": "vitest"
# "test:coverage": "vitest run --coverage"

# 4. Add monorepo-level scripts in root package.json
# "test:all": "turbo run test"
# "e2e:smoke": "turbo run e2e:smoke"
# "e2e:full": "turbo run e2e:full"
```

**Config Template** (`vitest.config.ts` for each app):
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom' for frontend apps
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

---

### C2: Core Services — Unit Tests (Session 2-4)

**Priority**: Test services that handle auth/security/data first.

#### 🔴 Tier 1 — CRITICAL (6 services — Test Immediately)

| # | Service File | Test File to Create | Why Critical |
|:-:|:-------------|:-------------------|:------------|
| 1 | `auth/auth.service.ts` | `auth/__tests__/auth.service.test.ts` | Login/signup — most critical path |
| 2 | `auth/token.service.ts` | `auth/__tests__/token.service.test.ts` | JWT sign/verify, refresh rotation |
| 3 | `auth/session.service.ts` | `auth/__tests__/session.service.test.ts` | Session lifecycle, refresh |
| 4 | `auth/password.service.ts` | `auth/__tests__/password.service.test.ts` | Hash/compare, reset flow |
| 5 | `scoring-engine/scoring.engine.ts` | `scoring-engine/__tests__/scoring.engine.test.ts` | Score calculation accuracy |
| 6 | `exam-engine/exam.engine.ts` | `exam-engine/__tests__/exam.engine.test.ts` | Start/submit/score lifecycle |
| — | `system/job-orchestrator.ts` | ✅ Already exists | Phase 10 |
| — | `intelligence/forecast.service.ts` | ✅ Already exists | Phase 11 |

#### 🟡 Tier 2 — HIGH (8 services)

| # | Service File | Test File to Create | Why Important |
|:-:|:-------------|:-------------------|:-------------|
| 7 | `auth/rbac.service.ts` | `auth/__tests__/rbac.service.test.ts` | Admin role verification |
| 8 | `auth/admin-auth.service.ts` | `auth/__tests__/admin-auth.service.test.ts` | Admin login |
| 9 | `auth/rate-limit.middleware.ts` | `auth/__tests__/rate-limit.test.ts` | Throttle logic |
| 10 | `question-engine/question.engine.ts` | `question-engine/__tests__/question.engine.test.ts` | Question selection |
| 11 | `selection-engine/selection.service.ts` | `selection-engine/__tests__/selection.service.test.ts` | Domain/topic lookup |
| 12 | `report-engine/report.engine.ts` | `report-engine/__tests__/report.engine.test.ts` | Report generation |
| 13 | `dashboard-engine/dashboard.engine.ts` | `dashboard-engine/__tests__/dashboard.engine.test.ts` | Dashboard data |
| 14 | `core/cache.service.ts` | `core/__tests__/cache.service.test.ts` | Caching correctness |

#### 🟢 Tier 3 — STANDARD (19 services — Complete Coverage)

| # | Service File | Test File to Create |
|:-:|:-------------|:-------------------|
| 15 | `admin-engine/admin.question.engine.ts` | `admin-engine/__tests__/admin.question.engine.test.ts` |
| 16 | `admin-engine/admin.hierarchy.engine.ts` | `admin-engine/__tests__/admin.hierarchy.engine.test.ts` |
| 17 | `admin-engine/admin.blueprint.engine.ts` | `admin-engine/__tests__/admin.blueprint.engine.test.ts` |
| 18 | `admin-engine/admin.user.engine.ts` | `admin-engine/__tests__/admin.user.engine.test.ts` |
| 19 | `admin-engine/admin.analytics.engine.ts` | `admin-engine/__tests__/admin.analytics.engine.test.ts` |
| 20 | `answer-engine/answer.engine.ts` | `answer-engine/__tests__/answer.engine.test.ts` |
| 21 | `quiz-engine/quiz.engine.ts` | `quiz-engine/__tests__/quiz.engine.test.ts` |
| 22 | `domain/domain.service.ts` | `domain/__tests__/domain.service.test.ts` |
| 23 | `domain/skill.service.ts` | `domain/__tests__/skill.service.test.ts` |
| 24 | `domain/hierarchy.factory.ts` | `domain/__tests__/hierarchy.factory.test.ts` |
| 25 | `metrics/trends.service.ts` | `metrics/__tests__/trends.service.test.ts` |
| 26 | `system/jobs.service.ts` | `system/__tests__/jobs.service.test.ts` |
| 27 | `system/usage.service.ts` | `system/__tests__/usage.service.test.ts` |
| 28 | `email/EmailService.ts` | `email/__tests__/EmailService.test.ts` |
| 29 | `exam-engine/session.service.ts` | `exam-engine/__tests__/session.service.test.ts` |
| 30 | `auth/audit.service.ts` | `auth/__tests__/audit.service.test.ts` |
| 31 | `auth/security.service.ts` | `auth/__tests__/security.service.test.ts` |
| 32 | `auth/cors.middleware.ts` | `auth/__tests__/cors.middleware.test.ts` |
| 33 | `auth/csrf.middleware.ts` | `auth/__tests__/csrf.middleware.test.ts` |
| 34 | `question/question.service.ts` | `question/__tests__/question.service.test.ts` |

**Total unit test files needed**: 35 (minus 2 existing = **33 to create**)

---

### C3: API Contract Tests (Session 5-6)

| # | Route | Methods | Test File |
|:-:|:------|:--------|:----------|
| 1 | `/api/auth/login` | POST | `__tests__/routes/auth-login.test.ts` |
| 2 | `/api/auth/signup` | POST | `__tests__/routes/auth-signup.test.ts` |
| 3 | `/api/auth/refresh` | POST | `__tests__/routes/auth-refresh.test.ts` |
| 4 | `/api/auth/me` | GET | `__tests__/routes/auth-me.test.ts` |
| 5 | `/api/auth/logout` | POST | `__tests__/routes/auth-logout.test.ts` |
| 6 | `/api/quiz/start` | POST | `__tests__/routes/quiz-start.test.ts` |
| 7 | `/api/quiz/submit` | POST | `__tests__/routes/quiz-submit.test.ts` |
| 8 | `/api/quiz/answer` | POST | `__tests__/routes/quiz-answer.test.ts` |
| 9 | `/api/admin/auth/login` | POST | `__tests__/routes/admin-auth.test.ts` |
| 10 | `/api/admin/jobs` | GET/POST | `__tests__/routes/admin-jobs.test.ts` |

---

### C4: E2E Tests — Smoke + Full Suite (Session 7-9)

#### Smoke Tests (`@smoke` — Run on Every PR):

| # | Flow | App | Spec File |
|:-:|:-----|:----|:----------|
| 1 | Admin Login → Dashboard | admin-app | ✅ `admin-auth.spec.ts` exists |
| 2 | User Login → Dashboard | web-app | `tests/e2e/user-login.spec.ts` |
| 3 | Start Exam → Submit | web-app | `tests/e2e/exam-flow.spec.ts` |
| 4 | View Report | web-app | `tests/e2e/report-view.spec.ts` |
| 5 | Admin CRUD Questions | admin-app | `tests/e2e/question-crud.spec.ts` |

#### Full Regression (`@full` — Nightly):

| # | Flow | App | Spec File |
|:-:|:-----|:----|:----------|
| 6 | Signup → Onboarding | web-app | `tests/e2e/signup-onboarding.spec.ts` |
| 7 | Password Reset | web-app | `tests/e2e/password-reset.spec.ts` |
| 8 | Blueprint CRUD | admin-app | `tests/e2e/blueprint-crud.spec.ts` |
| 9 | Question Factory | admin-app | `tests/e2e/question-factory.spec.ts` |
| 10 | Session Expiry/Lockscreen | admin-app | `tests/e2e/session-expiry.spec.ts` |
| 11 | Domain/Subject/Topic CRUD | admin-app | `tests/e2e/hierarchy-crud.spec.ts` |
| 12 | User Management | admin-app | `tests/e2e/user-management.spec.ts` |
| 13 | Deep Analytics View | admin-app | `tests/e2e/deep-analytics.spec.ts` |
| 14 | Trends View | admin-app | `tests/e2e/trends.spec.ts` |
| 15 | Dashboard All Spokes | admin-app | `tests/e2e/dashboard-spokes.spec.ts` |

---

### C5: `data-testid` Injection (Session 9)

**Convention**: `data-testid="[component]-[element]-[identifier]"`

#### Priority Components (admin-app):

| Component | Key `data-testid` Values |
|:----------|:------------------------|
| `AdminLayout.tsx` | `nav-sidebar`, `nav-link-{slug}` |
| `QuestionTable.tsx` | `question-table`, `question-row-{id}`, `question-search` |
| `DomainTable.tsx` | `domain-table`, `domain-row-{id}`, `domain-create-btn` |
| `SubjectTable.tsx` | `subject-table`, `subject-row-{id}` |
| `TopicTable.tsx` | `topic-table`, `topic-row-{id}` |
| `SubtopicTable.tsx` | `subtopic-table` |
| `SkillTable.tsx` | `skill-table` |
| `UserTable.tsx` | `user-table`, `user-row-{id}` |
| `AdminGuard.tsx` | `admin-guard` |
| `AdminLockScreen.tsx` | `lock-screen`, `lock-password-input` |

#### Priority Components (web-app):

| Component | Key `data-testid` Values |
|:----------|:------------------------|
| `AuthForms.tsx` | `login-form`, `email-input`, `password-input`, `submit-btn` |
| `QuizSelectionConsole.tsx` | `quiz-console`, `domain-card-{id}` |
| `ExamInterface.tsx` | `exam-interface`, `option-{idx}`, `submit-exam-btn` |
| `ExamPreflightDialog.tsx` | `preflight-dialog`, `start-exam-btn` |
| `Header.tsx` | `main-header`, `logout-btn` |
| `OnboardingWizard.tsx` | `onboarding-wizard` |

---

### C6: Playwright Config Hardening (Session 10)

```ts
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry',        // §2.4 — Record trace on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0,
  projects: [
    { name: 'smoke', testMatch: '**/*.spec.ts', grep: /@smoke/ },
    { name: 'full', testMatch: '**/*.spec.ts' },
  ],
});
```

---

### Phase C Summary

| Sub-Phase | What | Items | Sessions |
|:----------|:-----|:-----:|:--------:|
| C1 | Vitest setup in all 3 apps | 3 configs | 1 |
| C2 | Unit tests (33 service files) | 33 test files | 3 |
| C3 | API contract tests (10 routes) | 10 test files | 2 |
| C4 | E2E smoke (5) + full (10) | 15 spec files | 2 |
| C5 | `data-testid` injection | ~30 components | 1 |
| C6 | Playwright config hardening | 1 config | 1 |
| **Total** | | **~60 files** | **10** |

---

## ♿ PHASE D: Accessibility (Manifesto §3)

> **Goal**: jsx-a11y strict, aria-labels everywhere, focus traps, motion respect, WCAG AA.  
> **Sessions**: 6 | **Estimated Violations**: ~270

### D1: `jsx-a11y` Strict Enforcement (Session 1)

**What**: Upgrade from `recommended` to `strict` mode.

```bash
pnpm --filter @quiz/admin-app add -D eslint-plugin-jsx-a11y
pnpm --filter @quiz/web-app add -D eslint-plugin-jsx-a11y
```

Enable in ESLint config (or shared config from Phase A1):
```js
"extends": ["plugin:jsx-a11y/strict"]
```

**Expected new violations**: ~50-80 (missing `aria-label`, `alt` text, button roles)

---

### D2: `aria-label` Injection (Session 2-3)

#### Tier 1: Interactive Controls (13 components)

| App | Component | Elements Needing `aria-label` |
|:----|:----------|:-----------------------------|
| admin-app | `QuestionTable.tsx` | Delete button, Search input, Filter button, Clear button |
| admin-app | `DomainTable.tsx` | Create button, Edit/Delete icon buttons |
| admin-app | `SubjectTable.tsx` | Create button, Edit/Delete icon buttons |
| admin-app | `TopicTable.tsx` | Create button, Edit/Delete icon buttons |
| admin-app | `SubtopicTable.tsx` | Create button, Edit/Delete icon buttons |
| admin-app | `SkillTable.tsx` | Create button, Edit/Delete icon buttons |
| admin-app | `UserTable.tsx` | Block/Unblock buttons, Role badge |
| admin-app | `AdminLayout.tsx` | Sidebar nav links, collapse toggle |
| admin-app | `AdminLockScreen.tsx` | Password input, unlock button |
| web-app | `AuthForms.tsx` | Email input, password input, toggle visibility |
| web-app | `ExamInterface.tsx` | Option buttons, navigation buttons, timer |
| web-app | `QuizSelectionConsole.tsx` | Domain cards, topic chips |
| web-app | `Header.tsx` | Profile dropdown, notification bell |

**Pattern**:
```tsx
// ❌ Before
<button onClick={handleDelete}><Trash2 size={16} /></button>

// ✅ After
<button onClick={handleDelete} aria-label="Delete question"><Trash2 size={16} /></button>
```

#### Tier 2: Display/Status Components (21 components)

All 14 admin dashboard spokes + 7 web-app report components:
Charts, metric cards, refresh buttons, heatmaps.

---

### D3: `prefers-reduced-motion` (Session 4)

**97 files** use animations. Two approaches:

#### Approach A: Global CSS Reset (DO THIS FIRST — 5 minutes!)
Add to each app's `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### Approach B: Per-Component Tailwind (Polish later)
```tsx
className="motion-safe:animate-in motion-safe:fade-in"
```

---

### D4: Focus Traps — Modal Audit (Session 5)

| Component | App | Current State | Fix |
|:----------|:----|:-------------|:----|
| `SessionExpiryModal.tsx` | both | No focus trap | Add `useFocusTrap()` |
| `AdminLockScreen.tsx` | admin-app | No focus trap | Add `useFocusTrap()` + auto-focus input |
| `SecurityMuzzle.tsx` | both | No focus trap | Add `useFocusTrap()` |
| `ZConfirmationDialog.tsx` | both | Uses Radix ✅ | Verify restore |
| `ExitConfirmationDialog.tsx` | web-app | Uses Radix ✅ | Verify restore |
| `QuestionTable.tsx` delete modal | admin-app | No focus trap | Add `useFocusTrap()` |
| `ExamPreflightDialog.tsx` | web-app | No focus trap | Add `useFocusTrap()` |
| `GlobalSearchDialog.tsx` | web-app | No focus trap | Add `useFocusTrap()` |

**Create shared hook** at `packages/ui/src/hooks/useFocusTrap.ts`.

---

### D5: WCAG AA Contrast Audit (Session 6)

```bash
pnpm add -Dw @axe-core/playwright
```

Add to E2E tests:
```ts
import AxeBuilder from '@axe-core/playwright';

test('page meets WCAG AA', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

**Pages to audit**: admin login, dashboard, questions (admin) + login, signup, dashboard, exam, reports (web).

---

### Phase D Summary

| Sub-Phase | What | Violations | Sessions |
|:----------|:-----|:----------:|:--------:|
| D1 | jsx-a11y strict mode | ~50-80 | 1 |
| D2 | aria-label injection (34 components) | ~200 | 2 |
| D3 | prefers-reduced-motion | 97 files covered | 1 |
| D4 | Focus traps (8 modals) | ~6 to fix | 1 |
| D5 | WCAG AA contrast audit | TBD | 1 |
| **Total** | | **~270+** | **6** |

---

## ⚡ PHASE E: Performance (Manifesto §4)

> **Goal**: Bundle budgets, image optimization, no localStorage in render, smart memoization.  
> **Sessions**: 4 | **Estimated Violations**: ~26

### E1: Bundle Analyzer Setup (Session 1)

```bash
pnpm --filter @quiz/admin-app add -D @next/bundle-analyzer
pnpm --filter @quiz/web-app add -D @next/bundle-analyzer
```

**Update `next.config.js`**:
```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);
```

**Run**: `ANALYZE=true pnpm --filter @quiz/admin-app build`

**Set thresholds** after baseline:
- First JS bundle: < 200KB gzipped
- Per-route chunks: < 100KB gzipped
- Total vendor: < 500KB gzipped

---

### E2: `localStorage` Render Path Audit (Session 2)

**18 files** use `localStorage`. Audit each:

| File | App | Risk | Fix |
|:-----|:----|:-----|:----|
| `auth-context.tsx` | web-app | 🟡 Render path | Move to `useEffect` |
| `useExamBackup.ts` | web-app | 🟡 Render path | Move to `useEffect` |
| `SessionExpiryModal.tsx` | both | 🟢 Handler only | OK |
| `WebSessionWatcherContainer.tsx` | web-app | 🟡 Render path | Move to `useEffect` |
| `ExamPreflightDialog.tsx` | web-app | 🟢 Handler only | OK |
| `AdminGuard.tsx` | admin-app | 🟡 Render path | Move to `useEffect` |
| `AdminLayout.tsx` | admin-app | 🟡 Render path | Move to `useEffect` |
| `auth-store.ts` | admin-app | 🟡 Render path | Move to lazy init |
| `FactoryContext.tsx` | admin-app | 🟢 Handler only | OK |
| `useJobTracker.ts` | admin-app | 🟢 Handler only | OK |
| `middleware.ts` | web-app | ⚪ Server-side | N/A |
| E2E test fixtures | both | ⚪ Test only | N/A |

**~8 files** need render-path fixes.

**Pattern**:
```tsx
// ❌ Bad: localStorage in render
const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

// ✅ Good: localStorage in useEffect
const [theme, setTheme] = useState('light');
useEffect(() => {
  const saved = localStorage.getItem('theme');
  if (saved !== null) setTheme(saved);
}, []);
```

---

### E3: `next/image` Audit (Session 3)

Find all raw `<img>` tags and replace with `next/image`:
```tsx
// ❌ Bad
<img src="/logo.png" />

// ✅ Good
import Image from 'next/image';
<Image src="/logo.png" alt="Quiz Platform Logo" width={120} height={40} sizes="120px" />
```

---

### E4: Memoization Audit (Session 4)

| Component | App | What to Memoize |
|:----------|:----|:---------------|
| `ExamInterface.tsx` | web-app | Question navigation callbacks |
| `QuizSelectionConsole.tsx` | web-app | Domain/topic filtering logic |
| Dashboard 14 spokes | admin-app | Data transforms for charts |
| `SkillHeatmap.tsx` | web-app | Heatmap color calculations |
| `ScoreProgressionChart.tsx` | admin-app | Chart data transforms |

---

### Phase E Summary

| Sub-Phase | What | Items | Sessions |
|:----------|:-----|:-----:|:--------:|
| E1 | Bundle analyzer + thresholds | 2 configs | 1 |
| E2 | localStorage render-path fixes | ~8 files | 1 |
| E3 | next/image audit | ~10 files | 1 |
| E4 | Memoization for expensive components | ~10 components | 1 |
| **Total** | | **~30 items** | **4** |

---

## 📡 PHASE F: Structured Observability (Manifesto §6.3-6.4)

> **Goal**: Replace `console.*` with structured JSON logging. Central error tracking. Request latency monitoring.  
> **Sessions**: 3-4 | **Estimated Violations**: ~313 `console.*` replacements

### F1: Structured Logger Setup (Session 1)

**Current State**: 313 `console.*` statements across the codebase. No structured logging.

**Install**:
```bash
pnpm --filter @quiz/api-server add pino pino-pretty
```

**Create** `apps/api-server/src/lib/logger.ts`:
```ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  // Production: raw JSON for log aggregators (Datadog, CloudWatch, etc.)
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Child loggers for each module
export const authLogger = logger.child({ module: 'auth' });
export const examLogger = logger.child({ module: 'exam' });
export const adminLogger = logger.child({ module: 'admin' });
export const jobLogger = logger.child({ module: 'jobs' });
export const systemLogger = logger.child({ module: 'system' });
```

---

### F2: Replace `console.*` Across API Server (Session 2)

**What**: Replace all `console.log/error/warn` in api-server with the structured logger.

| Module | `console.*` Count | Logger to Use |
|:-------|:-----------------:|:-------------|
| `auth/` (all files) | ~20 | `authLogger` |
| `exam-engine/` | ~8 | `examLogger` |
| `admin-engine/` | ~10 | `adminLogger` |
| `system/` | ~5 | `jobLogger` |
| `scoring-engine/` | ~4 | `examLogger` |
| `report-engine/` | ~3 | `systemLogger` |
| `selection-engine/` | ~3 | `systemLogger` |
| API routes (`app/api/`) | ~30 | Module-specific |
| **Total api-server** | **~83** | |

**Pattern**:
```ts
// ❌ Before
console.error('[AUTH_LOGIN] Error:', message);

// ✅ After
authLogger.error({ err: message, userId }, 'Login failed');
```

---

### F3: Replace `console.*` in Frontend Apps (Session 3)

For frontend apps, replace with a lightweight client-side logger that:
- Logs to console in development
- Sends errors to a telemetry endpoint in production

**Create** `packages/ui/src/lib/client-logger.ts`:
```ts
const isDev = process.env.NODE_ENV === 'development';

export const clientLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    if (isDev) console.log(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    if (isDev) console.warn(`[WARN] ${message}`, data);
    // In prod, could send to /api/telemetry
  },
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => {
    if (isDev) console.error(`[ERROR] ${message}`, error, data);
    // In prod, send to error tracker
    void fetch('/api/telemetry', {
      method: 'POST',
      body: JSON.stringify({ action: 'client_error', metadata: { message, error: String(error), ...data } }),
    }).catch(() => {});
  },
};
```

| App | `console.*` Count |
|:----|:-----------------:|
| admin-app | ~80 |
| web-app | ~90 |
| api-server components | ~10 |
| packages/ | ~50 |
| **Total frontend** | **~230** |

---

### F4: Request Latency Middleware (Session 4)

**Create** `apps/api-server/src/middleware.ts` enhancement:
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { systemLogger } from '@/lib/logger';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();

  // Log request latency
  const duration = Date.now() - start;
  if (request.nextUrl.pathname.startsWith('/api/')) {
    systemLogger.info({
      method: request.method,
      path: request.nextUrl.pathname,
      duration,
      status: response.status,
    }, 'API request');
  }

  // Add Server-Timing header for observability
  response.headers.set('Server-Timing', `total;dur=${duration}`);
  return response;
}
```

---

### F5: Error Tracking Integration (Session 4 — Optional)

**Options**:
- **Sentry** (most popular): `pnpm add @sentry/nextjs`
- **Self-hosted**: Use the existing `/api/telemetry` endpoint + database table
- **Vercel**: Already has built-in error tracking on their dashboard

Recommendation: Start with Vercel's built-in analytics + the telemetry endpoint you already have, then upgrade to Sentry when needed.

---

### Phase F Summary

| Sub-Phase | What | Items | Sessions |
|:----------|:-----|:-----:|:--------:|
| F1 | Pino structured logger setup | 1 module | 1 |
| F2 | Replace `console.*` in api-server | ~83 replacements | 1 |
| F3 | Replace `console.*` in frontend | ~230 replacements | 1 |
| F4 | Request latency middleware | 1 middleware | 0.5 |
| F5 | Error tracking (optional) | 1 integration | 0.5 |
| **Total** | | **~313 replacements** | **3-4** |

---

## 📅 Master Schedule (All Phases)

```
PHASE A: Type Safety & Runtime Guards (4-5 sessions)
├── A1: Shared ESLint config ........................... Session 1
├── A2: Eliminate 125 any types ........................ Session 2-3
├── A3: Zod boundary validation (28 routes) ............ Session 4
└── A4: Discriminated unions (future) .................. Session 5

PHASE B: Pre-Commit Hooks & CI/CD (2 sessions)
├── B1: Husky + lint-staged ............................ Session 6
└── B2: Upgrade CI pipeline (tests + E2E) .............. Session 7

PHASE C: Testing Strategy (10 sessions)
├── C1: Vitest setup in all 3 apps ..................... Session 8
├── C2: Tier 1 critical tests (6 services) ............. Session 9-10
├── C2: Tier 2 high-pri tests (8 services) ............. Session 10-11
├── C2: Tier 3 standard tests (19 services) ............ Session 11-13
├── C3: API contract tests (10 routes) ................. Session 14-15
├── C4: E2E smoke suite (5 flows) ...................... Session 16
├── C4: E2E full regression (10 flows) ................. Session 17
├── C5: data-testid injection .......................... Session 18
└── C6: Playwright config hardening .................... Session 18

PHASE D: Accessibility (6 sessions)
├── D1: jsx-a11y strict enforcement .................... Session 19
├── D2: aria-label injection (34 components) ........... Session 20-21
├── D3: prefers-reduced-motion (global CSS) ............ Session 22
├── D4: Focus traps (8 modals) ......................... Session 23
└── D5: WCAG AA contrast audit ......................... Session 24

PHASE E: Performance (4 sessions)
├── E1: Bundle analyzer setup + baseline ............... Session 25
├── E2: localStorage render-path fixes ................. Session 26
├── E3: next/image audit ............................... Session 27
└── E4: Memoization audit .............................. Session 28

PHASE F: Observability (3-4 sessions)
├── F1: Pino structured logger ......................... Session 29
├── F2: Replace console.* in api-server ................ Session 30
├── F3: Replace console.* in frontend .................. Session 31
└── F4: Request latency + error tracking ............... Session 32
```

---

## 📊 Grand Summary Table

| Phase | Focus | Errors to Fix | Warnings | Config Tasks | Sessions |
|:------|:------|:------------:|:--------:|:------------:|:--------:|
| **A** | Type Safety (ESLint) | 125 | ~145 | 1 | 4-5 |
| **B** | Pre-Commit + CI/CD | 0 | 0 | 5 | 2 |
| **C** | Testing Strategy | 33 missing tests | 15 missing E2E | 3 | 10 |
| **D** | Accessibility | ~50-80 | ~200 | 0 | 6 |
| **E** | Performance | ~8 | ~18 | 2 | 4 |
| **F** | Observability | 313 console.* | 0 | 2 | 3-4 |
| **TOTAL** | | **~530+** | **~378** | **13** | **~30** |

---

## 🎯 Quick Wins (Under 10 Minutes Each)

| # | What | Phase | Time | Impact |
|:-:|:-----|:-----:|:----:|:------:|
| 1 | Add `prefers-reduced-motion` CSS reset | D3 | 5 min | 97 files covered |
| 2 | Install bundle analyzer | E1 | 5 min | Baseline visibility |
| 3 | Add `data-testid` to login form | C5 | 10 min | Unlocks E2E |
| 4 | Initialize Husky pre-commit | B1 | 5 min | Prevents regressions |
| 5 | Add Zod to 1 auth route | A3 | 10 min | Pattern established |

---

## ✅ Expected Outcomes After Completion

| Metric | Before | After |
|:-------|:------:|:-----:|
| `: any` types | 125 | 0 |
| Unit test files | 2 | 37 |
| E2E spec files | 1 | 16 |
| API routes with Zod validation | 0 | 28 |
| Components with `data-testid` | 1 | ~175 |
| Components with `aria-label` | 2 | ~175 |
| Modals with focus traps | 2 | 8 |
| Files respecting `prefers-reduced-motion` | 0 | 97 |
| `localStorage` render-path violations | ~8 | 0 |
| `console.*` → structured logger | 313 | 0 |
| Pre-commit hooks | None | Husky + lint-staged |
| CI gates | 3 (lint/type/build) | 5 (+unit tests, +E2E smoke) |
| Service test coverage | ~5% | 80%+ |

---

## 🧭 Zero-Downtime Implementation Sequence

> **Cardinal Rule**: At no point during this rollout should **any** user-facing page crash, any API return a 500, or any database operation corrupt data. Every session must end with `pnpm lint:all && pnpm typecheck:all && pnpm build:all` passing. If it doesn't pass, you don't commit.

### The Safety Contract

```
┌──────────────────────────────────────────────────────────────────┐
│  BEFORE EVERY SESSION                                            │
│  1. git checkout -b manifesto/phase-XX-description               │
│  2. pnpm lint:all && pnpm typecheck:all && pnpm build:all ✅     │
│                                                                  │
│  DURING EVERY SESSION                                            │
│  3. Make ONLY the changes described for that session              │
│  4. After every ~5 file edits → run typecheck on that app        │
│  5. Never change runtime behavior and types in the same commit   │
│                                                                  │
│  AFTER EVERY SESSION                                             │
│  6. pnpm lint:all && pnpm typecheck:all && pnpm build:all ✅     │
│  7. Verify the admin & web app render locally (spot-check)       │
│  8. git commit with conventional message                         │
│  9. Open PR → let CI pass → merge to main                       │
│ 10. Verify Vercel deployment is green                            │
└──────────────────────────────────────────────────────────────────┘
```

### Layer Protection Matrix

| Layer | What Can Go Wrong | How We Prevent It |
|:------|:-----------------|:-----------------|
| **UI/UX** (React) | Component crashes from type changes, missing props, broken imports | Never rename props or change component APIs in the same commit as type fixes. Add types first, migrate consumers second. |
| **BFF** (API Server) | Route returns wrong shape, Zod rejects valid requests, auth breaks | Add Zod schemas as `warn` first (log but don't reject), then flip to `error` after 1 week. Never change response shapes — only add optional fields. |
| **Database** | Schema migrations corrupt data, query changes return wrong results | NO database schema changes in this manifesto. All 6 phases are code-only. If we ever need DB changes, they get their own migration PR with rollback SQL. |

### The Golden Rule of Ordering

```
DO THIS:   Types → Lint → Tests → Accessibility → Performance → Observability
           (foundation)  (safety net)  (additive only)   (additive only)

NOT THIS:  Tests → Types    ← Tests will break when you change types later!
NOT THIS:  Observability → Types  ← Logger types conflict with any cleanup
NOT THIS:  Performance → Tests   ← Can't verify perf gains without tests
```

---

### Exact Session-by-Session Sequence

#### 🔷 WAVE 1: Foundation (Sessions 1-5) — *Zero Runtime Changes*

These sessions only add **tooling, types, and configs**. No runtime behavior is altered.

| Session | Phase | Work | Risk to Production | Verify |
|:-------:|:-----:|:-----|:------------------:|:------:|
| 1 | **A1** | Create `@quiz/eslint-config` package. But DON'T enable the strict rules yet — just create the package with rules set to `"warn"`. | ⚪ None | `pnpm lint:all` passes |
| 2 | **A2a** | Fix `any` in `packages/api-client` (41 items). These are just type annotations — zero runtime change. | ⚪ None | `pnpm typecheck:all` passes |
| 3 | **A2b** | Fix `any` in `apps/web-app` (38 items). Replace `catch (err: any)` → `catch (err: unknown)`. | ⚪ None | Web-app renders normally |
| 4 | **A2c** | Fix `any` in `apps/admin-app` (34 items) + `packages/db` (7) + `packages/ui` (1). | ⚪ None | Admin-app renders normally |
| 5 | **A1→** | NOW flip the ESLint rules from `"warn"` → `"error"`. Since all `any` is already gone, zero new errors. | ⚪ None | `pnpm lint:all` passes with 0 warnings |

> **✅ CHECKPOINT 1**: After Session 5, your entire codebase has zero `any`, zero unsafe casts, strict ESLint. Production is untouched because we only changed type annotations.

---

#### 🔷 WAVE 2: Safety Net (Sessions 6-10) — *Adding Tests (Additive Only)*

Tests are purely additive — they never change production code.

| Session | Phase | Work | Risk to Production | Verify |
|:-------:|:-----:|:-----|:------------------:|:------:|
| 6 | **B1** | Install Husky + lint-staged. Create `.husky/pre-commit`. | ⚪ None (dev tooling) | `git commit` triggers lint |
| 7 | **C1** | Install vitest in all 3 apps. Create `vitest.config.ts`. Add `"test"` scripts. | ⚪ None (dev deps only) | `pnpm test:all` runs (0 tests, 0 failures) |
| 8 | **C2-T1** | Write 6 Tier-1 critical unit tests (auth, scoring, exam). Tests mock the DB — they don't touch it. | ⚪ None | All 6 tests pass |
| 9 | **C2-T2** | Write 8 Tier-2 high-priority unit tests (rbac, cache, reports). | ⚪ None | All 14 tests pass |
| 10 | **B2** | Upgrade `ci.yml` to add the unit test gate. CI now runs: lint → typecheck → **test** → build. | ⚪ None | CI passes on push |

> **✅ CHECKPOINT 2**: After Session 10, you have 14 unit tests, pre-commit hooks, and CI runs tests automatically. Production is untouched.

---

#### 🔷 WAVE 3: Boundary Hardening (Sessions 11-14) — *Careful Runtime Changes*

This is the **first wave that touches runtime code**. Extra caution required.

| Session | Phase | Work | Risk to Production | Verify |
|:-------:|:-----:|:-----|:------------------:|:------:|
| 11 | **A3a** | Add Zod schemas for auth routes ONLY (`login`, `signup`, `reset-password`). Use **soft validation** first: parse but fall back to raw body if parse fails + log the mismatch. | 🟡 Low | Login still works. Check Vercel logs for parse errors. |
| 12 | **A3b** | Add Zod schemas for quiz routes (`start`, `answer`, `submit`). Same soft-validation pattern. | 🟡 Low | Take a quiz end-to-end. |
| 13 | **A3c** | Add Zod schemas for remaining admin CRUD routes (15 routes). Soft validation. | 🟡 Low | Admin CRUD operations work. |
| 14 | **A3→** | After 1 week of zero parse failures in logs, flip all Zod validations from soft → strict (remove fallback). | 🟡 Low | All routes reject bad input cleanly with 400 errors. |

> **Soft validation pattern** (safe rollout):
> ```ts
> // Temporary: Validate but don't reject
> const parsed = loginSchema.safeParse(rawBody);
> if (!parsed.success) {
>   logger.warn({ errors: parsed.error.issues }, 'Zod validation mismatch — using raw body');
>   // Fall through to raw body — production still works
> }
> const body = parsed.success ? parsed.data : rawBody;
> ```
> After confirming zero mismatches in production logs, simplify to:
> ```ts
> const body = loginSchema.parse(await _req.json()); // Strict — rejects bad input
> ```

> **✅ CHECKPOINT 3**: After Session 14, all API boundaries are validated. Authentication, quiz flow, and admin operations all work with type-safe inputs. Zero data corruption risk because we validated for 1 week before enforcing.

---

#### 🔷 WAVE 4: Remaining Tests (Sessions 15-18) — *Additive Only*

| Session | Phase | Work | Risk to Production | Verify |
|:-------:|:-----:|:-----|:------------------:|:------:|
| 15 | **C2-T3** | Write 19 Tier-3 unit tests (remaining services). | ⚪ None | All 33 tests pass |
| 16 | **C3** | Write 10 API contract tests. | ⚪ None | All contract tests pass |
| 17 | **C5** | Add `data-testid` attributes to 30 key components. | ⚪ None (HTML attribute only) | Components render with `data-testid` |
| 18 | **C4** | Write 5 smoke E2E specs + configure Playwright. | ⚪ None | E2E smoke suite passes locally |

> **✅ CHECKPOINT 4**: After Session 18, you have 33 unit tests, 10 contract tests, 5 E2E specs, and `data-testid` everywhere. Production is untouched (tests are additive).

---

#### 🔷 WAVE 5: Accessibility (Sessions 19-22) — *Additive HTML Attributes*

Accessibility changes only **add** attributes — they never remove or rename anything.

| Session | Phase | Work | Risk to Production | Verify |
|:-------:|:-----:|:-----|:------------------:|:------:|
| 19 | **D1** | Enable `jsx-a11y/strict` in ESLint. Fix violations found (add `aria-label`, `alt`, `role`). | ⚪ None (additive HTML) | Lint passes. All pages render. |
| 20 | **D2a** | Add `aria-label` to Tier-1 interactive components (13 components). | ⚪ None | Spot-check renders. |
| 21 | **D3** | Add `prefers-reduced-motion` CSS reset to all 3 apps' global CSS. | ⚪ None (CSS media query) | Animations still work normally. With "Reduce motion" OS setting → animations freeze. |
| 22 | **D4** | Create `useFocusTrap` hook. Apply to 6 modals. | 🟢 Minimal | Modals trap focus correctly. Tab through each modal. |

> **✅ CHECKPOINT 5**: After Session 22, your app is now accessible. Screen readers work. Focus traps work. Motion-sensitive users are respected. Zero visual change for normal users.

---

#### 🔷 WAVE 6: Performance (Sessions 23-25) — *Internal Optimizations*

| Session | Phase | Work | Risk to Production | Verify |
|:-------:|:-----:|:-----|:------------------:|:------:|
| 23 | **E1** | Install bundle analyzer. Run baseline report. Set size budgets in CI. | ⚪ None (dev tool) | Analyzer report generated. |
| 24 | **E2** | Fix 8 `localStorage` render-path violations → move to `useEffect`. | 🟡 Low | Auth still works. Theme still persists. No SSR hydration errors. |
| 25 | **E4** | Add `useMemo`/`useCallback` to 10 expensive components. | 🟢 Minimal | Components re-render less. No visual change. |

> **✅ CHECKPOINT 6**: After Session 25, performance is optimized. Lighter bundles, no localStorage SSR issues, memoized renders.

---

#### 🔷 WAVE 7: Observability (Sessions 26-30) — *Logging Infrastructure*

| Session | Phase | Work | Risk to Production | Verify |
|:-------:|:-----:|:-----|:------------------:|:------:|
| 26 | **F1** | Install pino. Create `logger.ts` with child loggers per module. | ⚪ None (new file) | `import { authLogger } from '@/lib/logger'` compiles. |
| 27 | **F2a** | Replace `console.*` in `auth/` and `exam-engine/` (28 files). | 🟢 Minimal | Logs appear in pino format in dev. |
| 28 | **F2b** | Replace `console.*` in remaining api-server modules (55 files). | 🟢 Minimal | All server logs are structured JSON. |
| 29 | **F3** | Create `client-logger.ts`. Replace `console.*` in admin-app (80 files). | 🟢 Minimal | Admin-app logs through `clientLogger`. |
| 30 | **F3→** | Replace `console.*` in web-app (90 files) + packages (50 files). Add request latency middleware. | 🟢 Minimal | All `console.*` eliminated. API shows `Server-Timing` header. |

> **✅ CHECKPOINT 7**: After Session 30, zero `console.*` in the codebase. All logs are structured, searchable, and production-ready.

---

#### 🔷 WAVE 8: Full Regression & Hardening (Sessions 31-32) — *Final Polish*

| Session | Phase | Work | Risk to Production | Verify |
|:-------:|:-----:|:-----|:------------------:|:------:|
| 31 | **C4→** | Write remaining 10 full regression E2E specs. | ⚪ None | All 15 E2E specs pass. |
| 32 | **D5** | Install axe-core. Run WCAG AA contrast audit. Fix violations. | 🟢 Minimal (color tweaks) | All pages pass WCAG AA. |

> **✅ FINAL CHECKPOINT**: All 32 sessions complete. Full manifesto compliance. Zero production incidents.

---

### Rollback Strategy Per Layer

| Layer | Rollback Method | Time to Recover |
|:------|:---------------|:---------------:|
| **UI/UX** | `git revert <commit>` → Vercel auto-deploys | < 3 minutes |
| **API** | Same `git revert` → Vercel auto-deploys. Zod soft-validation means bad schema = log + fallback, never crash. | < 3 minutes |
| **Database** | NOT TOUCHED in any phase. Zero rollback needed. | N/A |
| **ESLint/CI** | These only affect DX, never production. Worst case: temporarily set rule to `"warn"`. | Instant |

### Emergency Escape Hatch

If **anything** breaks in production after a merge:

```bash
# 1. Immediately revert the last commit on main
git revert HEAD --no-edit
git push origin main

# 2. Vercel will auto-deploy the reverted version within 2-3 minutes

# 3. Debug locally on the feature branch
git checkout manifesto/phase-XX-description
# ... fix the issue ...
# ... re-run all checks ...
pnpm lint:all && pnpm typecheck:all && pnpm build:all

# 4. Push the fixed version
git push origin manifesto/phase-XX-description
# Open PR again
```

---

### Session Tracking Template

Copy this into your task tracker for each session:

```markdown
## Session [N] — Phase [X.Y]: [Description]

- [ ] Branch created: `manifesto/phase-XY-description`
- [ ] Pre-check: `pnpm lint:all && pnpm typecheck:all && pnpm build:all` ✅
- [ ] Changes made (list files)
- [ ] Post-check: `pnpm lint:all && pnpm typecheck:all && pnpm build:all` ✅
- [ ] Local render verified (admin-app + web-app)
- [ ] Committed with conventional message
- [ ] PR opened → CI green
- [ ] Merged to main
- [ ] Vercel deployment green
- [ ] Production spot-check done (login, dashboard, exam)
```

---

## 🤔 Why This Level of Governance? Is It Even Necessary?

### The Honest Answer: **No, Not Always. But Yes, For You.**

Let's be real about this. A solo developer hacking on a weekend project doesn't need Zod validation, Husky hooks, or `aria-label` on every button. That would be insane overhead. So why are we doing it here?

Because **you are no longer building a weekend project.**

### Your Codebase Today (The Numbers Don't Lie)

```
349 source files   ·   175 React components   ·   78 API routes
 41 backend services   ·   3 apps   ·   4 shared packages
  2 production domains (realtutorialhub.com + admin.realtutorialhub.com)
  Real users taking real exams getting real scores
```

This is an **enterprise-grade exam platform** with:
- **Authentication + Sessions** (JWT, refresh tokens, admin RBAC)
- **Real-time exam state** (timers, auto-submit, answer persistence)
- **Scoring engines** (weighted skills, scaling factors, performance metrics)
- **Job orchestration** (background tasks, scheduled workers)
- **Deep analytics + forecasting** (skill deltas, trend prediction)

You've crossed the threshold where **one careless `any` type or one unhandled null** can:
- Give a student the wrong score
- Break an admin's ability to manage 10,000 questions
- Leak auth tokens through an unvalidated API
- Crash the exam mid-attempt for 500 students simultaneously

### The Three Stages of Every Growing Codebase

```
Stage 1: MOVE FAST               Stage 2: THE WALL               Stage 3: ENGINEERING
"Ship features, worry later"     "Why is everything breaking?"    "Predictable, safe, scalable"
                                                                  
  ┌─────────────┐                ┌─────────────┐                 ┌─────────────┐
  │ 🚀 Speed    │──── time ────▶│ 🧱 Chaos     │──── choice ──▶│ 🛡️ Control  │
  │ 0 tests     │                │ Bugs pile up │                 │ 80%+ tests  │
  │ any everywhere│              │ "It works on │                 │ Zero any    │
  │ console.log │                │  my machine" │                 │ Structured  │
  │ No CI/CD    │                │ 3am hotfixes │                 │ CI catches  │
  └─────────────┘                └─────────────┘                 │ everything  │
                                                                  └─────────────┘
                                       ▲
                                       │
                                  YOU ARE HERE
```

**You've already hit Stage 2.** The production crash we just fixed (`Cannot read properties of undefined reading 'length'`) — that's a Stage 2 bug. The `any` types scattered across 125 locations — that's Stage 2 tech debt. The 313 `console.log` statements instead of structured logging — that's a Stage 2 coping mechanism.

### What Governance Actually Gives You

| Without Governance | With Governance |
|:-------------------|:----------------|
| "I changed one file, why did 3 pages break?" | TypeScript catches the cascade at compile time |
| "The API worked in dev but crashes in prod" | Zod validates every input — bad data is rejected with a 400, not a 500 |
| "I'm scared to refactor anything" | 33 unit tests + 15 E2E specs → refactor with confidence |
| "I pushed a bug to main" | Husky pre-commit catches it before it even enters git |
| "Users are reporting crashes but I can't reproduce" | Structured logs with request IDs, not `console.log('error here')` |
| "I spent 2 hours debugging a null access" | `strict-boolean-expressions` would have caught it on line 1 |
| "A visually impaired user can't use my app" | `aria-label` + focus traps → accessible to everyone |
| "My app takes 8 seconds to load" | Bundle analyzer + memoization → sub-3s loads |

### The Cost of NOT Doing This

Every bug in production costs **10x more** than catching it in development:

```
Catch it in...         Cost (time)
──────────────────────────────────
IDE (TypeScript/ESLint)     ~0 (instant red squiggly)
Pre-commit hook             ~30 seconds
CI pipeline                 ~5 minutes
Code review                 ~30 minutes  
Production deploy           ~2-4 hours (debug + fix + redeploy)
User-reported bug           ~1-2 days (reproduce + triage + fix + deploy + communicate)
```

The crash at `admin.realtutorialhub.com` tonight? That cost you time to:
1. Notice it was broken
2. Screenshot and report it
3. Debug the root cause
4. Write the fix
5. Push and wait for Vercel to redeploy
6. Verify it's working again

**With Zod validation**, the API would have returned `{ error: "Invalid response shape" }` instead of crashing the React tree. With **unit tests**, the test suite would have flagged the missing field before the commit was even pushed.

### The Real Question Isn't "Why Governance?" — It's "How Much?"

We're not implementing governance for governance's sake. Each phase solves a **specific, real problem** you've already encountered:

| Phase | The Real Problem It Solves |
|:------|:--------------------------|
| **A** (Types) | "I changed a type and 3 different pages broke silently" |
| **B** (CI/CD) | "I accidentally pushed broken code to main" |
| **C** (Tests) | "I'm afraid to refactor the scoring engine because I might break scores" |
| **D** (A11y) | "Legally required in India under RPwD Act 2016 if public-facing. Also: it's the right thing to do." |
| **E** (Perf) | "The admin dashboard takes 6 seconds to load with 20 components" |
| **F** (Logs) | "Something failed in production but all I have is console.log" |

### When You DON'T Need This

To be fair:
- **If your codebase has < 50 files** → This is overkill. Ship fast.
- **If you have 0 users** → Types and tests slow you down for no payoff.
- **If you're prototyping** → Throw it away in 2 weeks, skip governance.

But with `349 files`, `175 components`, `78 API routes`, and **real users taking exams that affect their learning outcomes** — you're past the point where "move fast and break things" is responsible.

### The Bottom Line

> **Governance isn't bureaucracy. It's infrastructure.**
>
> Just like you wouldn't build a hospital on sand because "foundations take too long", you don't run a production exam platform on `any` types and `console.log`. The 30 sessions (~15-20 hours) you invest now will save you hundreds of hours of debugging, hundreds of user complaints, and one catastrophic data incident that you can't recover from.
>
> Your future self — at 500 files, 50,000 users, and 3 team members — will thank you.

---

*Document last updated: 2026-02-17 18:00 IST*
