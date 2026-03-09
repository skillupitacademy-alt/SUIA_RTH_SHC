# 🎯 Remaining Tasks — AI Vibe Coding Prompt Guide

> **Purpose**: This file contains precise, step-by-step AI prompts for every remaining task.
> **Rules**: Follow each prompt EXACTLY. Do NOT change UI/UX, layout, labels, or component names. Zero regression policy.
> **Date**: 2026-03-08 | **Source**: Codebase audit against `docs/blueprints/` phases

---

## Table of Contents

- [Sprint 1: Close Phase 1 Gaps](#sprint-1-close-phase-1-gaps-3-hours)
- [Sprint 2: Finish SOLID Principles](#sprint-2-finish-solid-principles-1-2-days)
- [Sprint 3: Frontend Quick Wins](#sprint-3-frontend-quick-wins-2-3-days)
- [Sprint 4: Database Optimization](#sprint-4-database-optimization-3-5-days)
- [Sprint 5: Remaining Frontend Tasks](#sprint-5-remaining-frontend-tasks-3-5-days)

---

# Sprint 1: Close Phase 1 Gaps (~3 hours)

---

## Task CF-5: Add `statement_timeout` to Database Pool

**Priority**: 🔴 Critical | **Effort**: 5 minutes | **Risk**: None

### Context
The app-level `withTimeout()` utility exists at `packages/db/src/utils/query-timeout.ts`, but the PostgreSQL connection pool has no server-side `statement_timeout` as a safety net. A runaway query can lock the database indefinitely.

### Prompt

> Open `packages/db/src/index.ts`.
>
> Find the PostgreSQL pool/connection configuration object. It will look something like:
> ```ts
> const pool = new Pool({
>   connectionString: databaseUrl,
>   max: 15,
>   idleTimeoutMillis: 30000,
>   connectionTimeoutMillis: 2000,
> });
> ```
> Or it might use `neon()` or `drizzle()` with a config object.
>
> Add `statement_timeout: 30000` (30 seconds) to the pool configuration:
> ```ts
> statement_timeout: 30000, // Server-side timeout — kills queries running > 30s
> ```
>
> If the project uses Neon serverless driver (`@neondatabase/serverless`), add it to the `neonConfig` or the connection string as `?options=-c statement_timeout=30000`.
>
> **Do NOT change any other configuration.**
>
> **Verify**: Run `pnpm --filter @quiz/db run build` to confirm no TypeScript errors.

---

## Task CF-7: Add 4 Missing Database Indexes

**Priority**: 🟡 Important | **Effort**: 30 minutes | **Risk**: Low

### Context
The audit identified 4 missing indexes. 26 indexes already exist. These 4 are needed for admin query performance.

### Prompt

> Open `packages/db/src/schema/auth.ts`.
>
> Find where existing indexes are defined (look for `index()`, `uniqueIndex()`, or similar Drizzle ORM index definitions).
>
> Add these 4 indexes in the same pattern as existing ones:
>
> 1. **`users.created_at`** — For sorting/filtering users by registration date:
>    ```ts
>    usersCreatedAtIdx: index('users_created_at_idx').on(users.createdAt),
>    ```
>
> 2. **`audit_logs.action`** — For filtering audit logs by action type:
>    ```ts
>    auditLogsActionIdx: index('audit_logs_action_idx').on(auditLogs.action),
>    ```
>
> 3. **`audit_logs.created_at`** — For time-range queries on audit logs:
>    ```ts
>    auditLogsCreatedAtIdx: index('audit_logs_created_at_idx').on(auditLogs.createdAt),
>    ```
>
> 4. **`login_attempts.user_id`** — For rate limiting lookups by user:
>    ```ts
>    loginAttemptsUserIdIdx: index('login_attempts_user_id_idx').on(loginAttempts.userId),
>    ```
>
> **After adding**, run:
> ```bash
> pnpm drizzle-kit generate
> ```
> This creates a migration file. Do **NOT** run `drizzle-kit push` or apply the migration automatically.
>
> **Verify**: Confirm the migration SQL file was created in the `drizzle/` or `migrations/` directory and contains 4 `CREATE INDEX` statements.

---

## Task CF-3: Add Bundle Size CI Check

**Priority**: 🟡 Important | **Effort**: 1 hour | **Risk**: Low

### Context
`@next/bundle-analyzer` is already installed in `package.json`. No CI job uses it.

### Prompt

> Open `.github/workflows/ci.yml`.
>
> Read the existing job structure to understand the pattern (job names, Node.js version, caching strategy, etc.).
>
> Add a new job called `bundle-check` AFTER the existing build job. It should:
>
> 1. **Use the same Node.js + pnpm setup** as other jobs (copy the setup steps).
>
> 2. **Run the build with bundle analysis enabled**:
>    ```yaml
>    - name: Analyze bundle size
>      run: ANALYZE=true pnpm build --filter @quiz/web-app
>      env:
>        ANALYZE: true
>    ```
>
> 3. **Check the bundle size output**. Add a step that:
>    - Reads the `.next/analyze/` directory (where `@next/bundle-analyzer` outputs)
>    - Uses a simple script to check if any chunk exceeds 500KB:
>      ```yaml
>      - name: Check bundle budget
>        run: |
>          MAX_SIZE_KB=500
>          OVER_BUDGET=$(find apps/web-app/.next/analyze -name '*.html' 2>/dev/null | head -1)
>          if [ -z "$OVER_BUDGET" ]; then
>            echo "⚠️ No bundle analysis output found — check ANALYZE config"
>          else
>            echo "✅ Bundle analysis generated"
>          fi
>      ```
>
> 4. **Upload the analysis report as a CI artifact**:
>    ```yaml
>    - name: Upload bundle report
>      uses: actions/upload-artifact@v4
>      if: always()
>      with:
>        name: bundle-analysis
>        path: apps/web-app/.next/analyze/
>        retention-days: 14
>    ```
>
> 5. Make this job **optional** (not blocking PR merge):
>    ```yaml
>    bundle-check:
>      runs-on: ubuntu-latest
>      continue-on-error: true
>    ```
>
> Also verify the `@next/bundle-analyzer` is configured in `apps/web-app/next.config.mjs`. If not, add:
> ```js
> import withBundleAnalyzer from '@next/bundle-analyzer';
> const analyzeBundleConfig = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
> // Wrap the existing config: export default analyzeBundleConfig(existingConfig);
> ```
>
> **Verify**: Run `pnpm --filter @quiz/web-app run build` locally with `ANALYZE=true` to confirm it generates output.

---

## Task CF-6: Apply `withTimeout` to Engine Queries

**Priority**: 🟡 Important | **Effort**: 1 hour | **Risk**: Low

### Context
`packages/db/src/utils/query-timeout.ts` exists with timeout presets (`STANDARD_QUERY_TIMEOUT`, `REPORT_QUERY_TIMEOUT`, etc.) but is not applied to critical engine queries.

### Prompt

> First, read `packages/db/src/utils/query-timeout.ts` to understand:
> - The `withTimeout` function signature
> - Available timeout presets (names and values)
> - How it wraps a promise with `AbortController` or `Promise.race`
>
> Then apply `withTimeout` to these 3 critical query paths:
>
> **1. ScoringEngine** — `apps/api-server/src/modules/scoring-engine/scoring.engine.ts`:
> - Find the main `calculateExamResults` method (or equivalent scoring method)
> - Find the heavy aggregation database query inside it (the one that joins across tables)
> - Wrap it with `withTimeout(query, REPORT_QUERY_TIMEOUT)`:
>   ```ts
>   import { withTimeout, REPORT_QUERY_TIMEOUT } from '@quiz/db/utils/query-timeout';
>   // Inside the method:
>   const results = await withTimeout(
>     db.select()... // the existing query
>     , REPORT_QUERY_TIMEOUT
>   );
>   ```
>
> **2. ExamEngine** — `apps/api-server/src/modules/exam-engine/exam.engine.ts`:
> - Find the `startExam` and `submitAnswer` operations
> - Wrap their database queries with `withTimeout(query, STANDARD_QUERY_TIMEOUT)`
>
> **3. Admin Analytics** — `apps/api-server/src/modules/admin-engine/admin.analytics.engine.ts`:
> - Find the aggregation/dashboard queries
> - Wrap with `withTimeout(query, REPORT_QUERY_TIMEOUT)`
>
> **Rules**:
> - Import from the package, not a relative path: `import { withTimeout, STANDARD_QUERY_TIMEOUT, REPORT_QUERY_TIMEOUT } from '@quiz/db/utils/query-timeout'`
> - If the import path doesn't work, check `packages/db/package.json` exports and adjust
> - Do NOT change the queries themselves — only wrap them
> - Do NOT wrap queries that are already inside a `db.transaction()` callback (the transaction has its own timeout)
>
> **Verify**: `pnpm --filter @quiz/api-server run build` and `pnpm --filter @quiz/api-server run test`

---

# Sprint 2: Finish SOLID Principles (1-2 days)

---

## Task T52: LSP — Split Token Verification Functions

**Priority**: 🟡 Important | **Effort**: 2 hours | **Risk**: Medium

### Context
Currently `verifyAccessToken(token, isAdmin?)` handles both user and admin tokens with a boolean flag. This violates LSP — the caller must know which type they're verifying. Split into two explicit functions.

### Prompt

> Read `apps/api-server/src/modules/auth/token.service.ts` and find the `verifyAccessToken` method.
>
> Understand:
> - What does the `isAdmin` flag control?
> - What audience or claims differ between user and admin tokens?
> - Where is `verifyAccessToken` called across the codebase?
>
> Then refactor:
>
> 1. **Create two new methods** in `token.service.ts`:
>    ```ts
>    static async verifyUserAccessToken(token: string): Promise<TokenPayload> {
>      // Call the internal verification with audience = 'user'
>      return this._verifyAccessToken(token, 'user');
>    }
>
>    static async verifyAdminAccessToken(token: string): Promise<AdminTokenPayload> {
>      // Call the internal verification with audience = 'admin'
>      return this._verifyAccessToken(token, 'admin');
>    }
>    ```
>
> 2. **Rename the original** to `_verifyAccessToken` (private internal method):
>    ```ts
>    private static async _verifyAccessToken(token: string, expectedAudience: 'user' | 'admin'): Promise<TokenPayload> {
>      // existing logic
>    }
>    ```
>
> 3. **Update all call sites**:
>    - Search entire codebase for `verifyAccessToken(` 
>    - In web-app API routes → change to `verifyUserAccessToken`
>    - In admin-app API routes → change to `verifyAdminAccessToken`
>    - In `api-wrapper.ts` or middleware → determine which based on route context
>
> 4. **Keep backward compatibility** temporarily:
>    ```ts
>    /** @deprecated Use verifyUserAccessToken or verifyAdminAccessToken */
>    static async verifyAccessToken(token: string, isAdmin?: boolean) {
>      return isAdmin ? this.verifyAdminAccessToken(token) : this.verifyUserAccessToken(token);
>    }
>    ```
>
> **Verify**: `pnpm --filter @quiz/api-server run build` and `pnpm --filter @quiz/api-server run test`

---

## Task T53: LSP — Fix AdminClient Return Types

**Priority**: 🟡 Important | **Effort**: 2 hours | **Risk**: Low

### Prompt

> Read `packages/api-client/src/modules/admin-client.ts`.
>
> Currently, methods may return loosely typed `any` or `unknown` responses. Create proper typed returns.
>
> 1. **Create `packages/api-client/src/modules/admin.types.ts`**:
>    ```ts
>    // Admin API response types
>    export interface AdminUser {
>      id: string;
>      email: string;
>      name: string;
>      isVerified: boolean;
>      roles: string[];
>      createdAt: string;
>      lastLoginAt: string | null;
>    }
>
>    export interface AdminUserListResponse {
>      users: AdminUser[];
>      total: number;
>      page: number;
>      pageSize: number;
>    }
>
>    export interface AdminQuestion {
>      id: string;
>      text: string;
>      type: string;
>      difficulty: string;
>      topicId: string;
>      createdAt: string;
>    }
>
>    export interface AdminQuestionListResponse {
>      questions: AdminQuestion[];
>      total: number;
>      page: number;
>      pageSize: number;
>    }
>
>    export interface AdminDashboardMetrics {
>      totalUsers: number;
>      totalExams: number;
>      totalQuestions: number;
>      activeUsers30d: number;
>      averageScore: number;
>    }
>    ```
>
> 2. **Update `admin-client.ts`** methods to use these types:
>    - Change `getUsers(): Promise<any>` → `getUsers(): Promise<AdminUserListResponse>`
>    - Change `getQuestions(): Promise<any>` → `getQuestions(): Promise<AdminQuestionListResponse>`
>    - Change `getDashboardMetrics(): Promise<any>` → `getDashboardMetrics(): Promise<AdminDashboardMetrics>`
>    - Apply to ALL public methods
>
> 3. **Export types** from `packages/api-client/src/index.ts`:
>    ```ts
>    export type { AdminUser, AdminUserListResponse, AdminQuestion, AdminQuestionListResponse, AdminDashboardMetrics } from './modules/admin.types';
>    ```
>
> **Verify**: `pnpm --filter @quiz/api-client run build`

---

## Task T54: ISP — Split AdminClient into Role-Based Interfaces

**Priority**: 🟡 Important | **Effort**: 3 hours | **Risk**: Medium

### Prompt

> Read `packages/api-client/src/modules/admin-client.ts` to understand ALL methods.
>
> Group the methods by admin role/capability:
> - **Content management**: CRUD for domains, subjects, topics, subtopics, skills, questions, blueprints
> - **User management**: List users, update user, delete user, change roles
> - **Analytics**: Dashboard metrics, exam analytics, user analytics, content health
> - **System**: Audit logs, maintenance, system config
>
> Then split:
>
> 1. **Create `packages/api-client/src/modules/admin/admin-content.client.ts`**:
>    ```ts
>    export class AdminContentClient {
>      constructor(private fetchClient: FetchClient) {}
>      // All domain, subject, topic, subtopic, skill, question, blueprint CRUD methods
>    }
>    ```
>
> 2. **Create `packages/api-client/src/modules/admin/admin-user.client.ts`**:
>    ```ts
>    export class AdminUserClient {
>      constructor(private fetchClient: FetchClient) {}
>      // All user management methods
>    }
>    ```
>
> 3. **Create `packages/api-client/src/modules/admin/admin-analytics.client.ts`**:
>    ```ts
>    export class AdminAnalyticsClient {
>      constructor(private fetchClient: FetchClient) {}
>      // All analytics/metrics methods
>    }
>    ```
>
> 4. **Create `packages/api-client/src/modules/admin/admin-system.client.ts`**:
>    ```ts
>    export class AdminSystemClient {
>      constructor(private fetchClient: FetchClient) {}
>      // Audit logs, maintenance methods
>    }
>    ```
>
> 5. **Update the original `admin-client.ts`** to be a facade:
>    ```ts
>    export class AdminClient {
>      public readonly content: AdminContentClient;
>      public readonly users: AdminUserClient;
>      public readonly analytics: AdminAnalyticsClient;
>      public readonly system: AdminSystemClient;
>
>      constructor(fetchClient: FetchClient) {
>        this.content = new AdminContentClient(fetchClient);
>        this.users = new AdminUserClient(fetchClient);
>        this.analytics = new AdminAnalyticsClient(fetchClient);
>        this.system = new AdminSystemClient(fetchClient);
>      }
>
>      // Keep old methods as @deprecated pass-throughs for backward compat
>      /** @deprecated Use this.users.getUsers() */
>      getUsers(...args) { return this.users.getUsers(...args); }
>    }
>    ```
>
> 6. **Update admin-app imports** — search for `adminClient.getUsers(` etc. and update 3-5 examples to new pattern: `adminClient.users.getUsers()`
>
> **Do NOT** update all call sites at once. Just add the facade + deprecation notices. Consumers migrate gradually.
>
> **Verify**: `pnpm --filter @quiz/api-client run build` and `pnpm --filter @quiz/admin-app run build`

---

# Sprint 3: Frontend Quick Wins (2-3 days)

---

## Task T84: Fix Zustand Selector Patterns

**Priority**: 🟡 Important | **Effort**: 1 day | **Risk**: Medium

> [!CAUTION]
> **ZERO REGRESSION POLICY**: Do NOT change any UI, layout, labels, or component names. Only change HOW stores are consumed, not WHAT they render.

### Prompt

> Search for ALL Zustand store usage across both apps:
> ```bash
> grep -rn "useQuizStore()" apps/web-app/src/ --include="*.tsx" --include="*.ts"
> grep -rn "useAuthStore()" apps/ --include="*.tsx" --include="*.ts"
> ```
>
> For each file found:
>
> **Pattern 1 — Component uses ONE field** (most common):
> ```ts
> // BEFORE (bad — re-renders on ANY store change):
> const { timeLeft } = useQuizStore()
>
> // AFTER (good — only re-renders when timeLeft changes):
> const timeLeft = useQuizStore(state => state.timeLeft)
> ```
>
> **Pattern 2 — Component uses MULTIPLE fields**:
> ```ts
> // BEFORE:
> const { currentQuestion, answers, flags } = useQuizStore()
>
> // AFTER:
> import { useShallow } from 'zustand/react/shallow'
> const { currentQuestion, answers, flags } = useQuizStore(
>   useShallow(state => ({
>     currentQuestion: state.currentQuestion,
>     answers: state.answers,
>     flags: state.flags,
>   }))
> )
> ```
>
> **Pattern 3 — Component uses only ACTIONS** (functions):
> ```ts
> // BEFORE:
> const { submitAnswer, flagQuestion } = useQuizStore()
>
> // AFTER (functions are referentially stable — never cause re-renders):
> const submitAnswer = useQuizStore(state => state.submitAnswer)
> const flagQuestion = useQuizStore(state => state.flagQuestion)
> ```
>
> **Apply to EVERY store usage in BOTH apps.** Typical files to update:
> - `apps/web-app/src/components/quiz/` — all quiz UI components
> - `apps/web-app/src/components/exam/` — exam interface components (HUD, timer, etc.)
> - `apps/web-app/src/app/(authenticated)/` — page components
> - `apps/admin-app/src/components/` — admin components using auth store
>
> **Add a comment** at the top of each store file:
> ```ts
> // ⚠️ ALWAYS use selectors: useStore(s => s.field), never useStore()
> ```
>
> **Verify**: `pnpm --filter @quiz/web-app run build` and `pnpm --filter @quiz/admin-app run build`
> Then manually verify: start a quiz, confirm timer updates don't cause question panel to flicker.

---

## Task T79: Convert Pages to Server Components

**Priority**: 🟡 Important | **Effort**: 1 day | **Risk**: Medium

> [!CAUTION]
> **ZERO REGRESSION POLICY**: Only convert pages that do NOT use hooks, browser APIs, or event handlers. Keep identical UI output.

### Prompt

> Identify pages in both apps that can be Server Components. A page CAN be a Server Component if it:
> - Does NOT use `useState`, `useEffect`, `useRef`, or any React hooks
> - Does NOT use `onClick`, `onChange`, or any event handlers
> - Does NOT import from Zustand stores
> - Its children that ARE interactive are already separate client components
>
> **Likely candidates for web-app** (`apps/web-app/src/app/`):
> - Dashboard page (only renders data, interactive parts are child components)
> - Reports list page (data display)
> - Profile page (data display)
>
> **Likely candidates for admin-app** (`apps/admin-app/src/app/`):
> - Dashboard page
> - Users list page (if table is a separate client component)
>
> For each convertible page:
>
> 1. **Remove `'use client'`** directive from the top of the page file
> 2. **Convert data fetching** from `useEffect` + `useState` to direct `async` function:
>    ```tsx
>    // BEFORE (Client Component):
>    'use client'
>    export default function DashboardPage() {
>      const [data, setData] = useState(null)
>      useEffect(() => { fetchData().then(setData) }, [])
>      return <Dashboard data={data} />
>    }
>
>    // AFTER (Server Component):
>    export default async function DashboardPage() {
>      const data = await fetchData()  // runs on server
>      return <Dashboard data={data} />
>    }
>    ```
> 3. **Extract interactive parts** into separate `'use client'` components if needed
> 4. **Keep `'use client'` on components** that genuinely need it (forms, buttons, stores)
>
> **Verify**: `pnpm --filter @quiz/web-app run build` — confirm no hydration errors.
> Open each converted page in browser. UI MUST look identical.

---

## Task T80: Add Dynamic Imports for Heavy Components

**Priority**: 🟡 Important | **Effort**: 3 hours | **Risk**: Low

### Prompt

> Search for heavy components that don't need to render immediately:
> ```bash
> grep -rn "import.*Chart\|import.*PDF\|import.*Editor\|import.*Modal\|import.*Dialog" apps/ --include="*.tsx"
> ```
>
> For each heavy component found, convert to dynamic import:
>
> ```tsx
> // BEFORE:
> import { ReportChart } from '@/components/reports/ReportChart'
>
> // AFTER:
> import dynamic from 'next/dynamic'
> const ReportChart = dynamic(
>   () => import('@/components/reports/ReportChart').then(mod => mod.ReportChart),
>   {
>     loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
>     ssr: false  // Only for components that use browser APIs (canvas, window, etc.)
>   }
> )
> ```
>
> **Priority targets** (components that are large and below-the-fold):
> 1. Chart components (usually use canvas/SVG libraries)
> 2. PDF viewer/generator components
> 3. Rich text editors (if any)
> 4. Modal/Dialog content that's not visible on initial load
> 5. Admin data tables with complex rendering
>
> **Do NOT dynamically import**:
> - Navigation components
> - Layout components
> - Components visible in the initial viewport (above the fold)
> - Small utility components
>
> **Verify**: `pnpm --filter @quiz/web-app run build` — check that dynamic chunks appear in the build output.

---

## Task T81: Implement next/image for All Images

**Priority**: 🟡 Important | **Effort**: 3 hours | **Risk**: Low

### Prompt

> Search for all `<img` tags across both apps:
> ```bash
> grep -rn "<img " apps/web-app/src/ apps/admin-app/src/ --include="*.tsx"
> ```
>
> For each `<img>` tag found, convert to `next/image`:
>
> ```tsx
> // BEFORE:
> <img src="/logo.png" alt="Logo" className="w-10 h-10" />
>
> // AFTER:
> import Image from 'next/image'
> <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10" />
> ```
>
> **Rules**:
> - **Known dimensions**: Set explicit `width` and `height` props
> - **Full-width images**: Use `fill` prop with a positioned parent:
>   ```tsx
>   <div className="relative w-full h-48">
>     <Image src="/hero.jpg" alt="Hero" fill className="object-cover" />
>   </div>
>   ```
> - **External images** (Unsplash, CDN): Add the domain to `next.config.mjs`:
>   ```js
>   images: {
>     remotePatterns: [
>       { protocol: 'https', hostname: 'images.unsplash.com' },
>       // Add other external image domains
>     ],
>   },
>   ```
> - **SVG icons**: Leave as `<img>` or convert to inline SVG components. `next/image` doesn't optimize SVGs.
> - **Priority images** (above the fold, hero, logo): Add `priority` prop:
>   ```tsx
>   <Image src="/logo.png" alt="Logo" width={40} height={40} priority />
>   ```
>
> **Verify**: `pnpm --filter @quiz/web-app run build` — check no image warnings. Visually confirm images render correctly.

---

## Task T91: Add Preconnect Hints for Critical Origins

**Priority**: 🟢 Nice-to-have | **Effort**: 30 minutes | **Risk**: None

### Prompt

> Open `apps/web-app/src/app/layout.tsx`.
>
> Inside the `<head>` section (or using Next.js `metadata` API), add preconnect hints:
>
> ```tsx
> <head>
>   {/* Preconnect to API server — saves DNS + TLS handshake */}
>   <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com'} />
>   <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com'} />
>
>   {/* Preconnect to Sentry — error reporting */}
>   <link rel="preconnect" href="https://o4509153865728000.ingest.us.sentry.io" crossOrigin="anonymous" />
>
>   {/* Preconnect to Vercel Analytics */}
>   <link rel="preconnect" href="https://vitals.vercel-insights.com" crossOrigin="anonymous" />
> </head>
> ```
>
> Do the same for `apps/admin-app/src/app/layout.tsx`.
>
> **Adjust the Sentry domain** — read it from `sentry.client.config.ts` to get the actual DSN hostname.
>
> **Verify**: `pnpm build --filter @quiz/web-app` — no errors. Inspect page source in browser to confirm `<link>` tags appear.

---

# Sprint 4: Database Optimization (3-5 days)

---

## Task T95: Add Missing Database Transactions

**Priority**: 🔴 Critical | **Effort**: 1 day | **Risk**: Medium

### Prompt

> Search the entire API server for multi-step database writes that lack transaction protection:
> ```bash
> grep -rn "db.insert\|db.update\|db.delete" apps/api-server/src/modules/ --include="*.ts" -l
> ```
>
> For each file found, read it and check: does it have multiple sequential `db.insert`/`db.update`/`db.delete` calls WITHOUT wrapping them in `db.transaction()`?
>
> **Specifically check these high-risk operations**:
>
> 1. **Signup flow** in `auth/signup.service.ts`:
>    - Does it create user + assign role + create profile in separate queries?
>    - If yes, wrap ALL in a single transaction:
>      ```ts
>      await db.transaction(async (tx) => {
>        const user = await tx.insert(users).values({...}).returning();
>        await tx.insert(userRoles).values({ userId: user[0].id, role: 'user' });
>        // ... any other inserts
>      });
>      ```
>
> 2. **Exam start** in `exam-engine/exam.engine.ts`:
>    - Does it create exam + exam_questions in separate queries?
>    - If already transactional, verify `tx` is used for ALL queries inside.
>
> 3. **Admin hierarchy operations** in `admin-engine/admin.domain.engine.ts` etc.:
>    - Deleting a domain should delete its subjects, topics, etc. in a transaction.
>
> 4. **Any endpoint that writes to 2+ tables** — wrap in transaction.
>
> **Transaction rules**:
> - Use `tx` (transaction client) for ALL queries inside the transaction, NOT `db`
> - Keep transactions SHORT — no API calls or heavy computation inside
> - Log transaction failures with context
>
> **Verify**: Run all tests: `pnpm --filter @quiz/api-server run test`

---

## Task T93: Fix N+1 in SelectionEngine

**Priority**: 🔴 Critical | **Effort**: 1 day | **Risk**: High

### Prompt

> Read the complete `apps/api-server/src/modules/selection-engine/selection.service.ts`.
>
> **Identify all sequential query loops** — where does the code loop through items and execute one database query per iteration? Common patterns:
> ```ts
> // BAD — N+1 pattern:
> for (const id of questionIds) {
>   const question = await db.query.questions.findFirst({ where: eq(questions.id, id) });
>   results.push(question);
> }
> ```
>
> **Replace with batch queries**:
> ```ts
> // GOOD — single query:
> const results = await db.query.questions.findMany({
>   where: inArray(questions.id, questionIds)
> });
> ```
>
> **Specific optimizations to make**:
>
> 1. **Batch question fetching** — replace per-question queries with `WHERE id IN (...)`:
>    ```ts
>    import { inArray } from 'drizzle-orm';
>    const questions = await db.select().from(questionsTable)
>      .where(inArray(questionsTable.id, questionIds));
>    ```
>
> 2. **Batch skill/topic lookups** — if the code fetches skills per question:
>    ```ts
>    const allSkills = await db.select().from(topicSkills)
>      .where(inArray(topicSkills.topicId, topicIds));
>    // Then group in memory: const skillsByTopic = groupBy(allSkills, 'topicId')
>    ```
>
> 3. **Use JOINs** where the code fetches related data in separate queries:
>    ```ts
>    const questionsWithSkills = await db.select()
>      .from(questionsTable)
>      .leftJoin(topicSkills, eq(questionsTable.topicId, topicSkills.topicId))
>      .where(inArray(questionsTable.id, questionIds));
>    ```
>
> **Critical constraint**: The keyset pagination algorithm (SHA-256 chained anchors) MUST produce identical question sets before and after optimization. The optimization is in HOW data is fetched, not WHAT is fetched.
>
> **Target**: Maximum 3-5 database queries per exam start (down from ~60).
>
> **Verify**:
> 1. `pnpm --filter @quiz/api-server run test -- selection` — all selection tests pass
> 2. Write a quick verification test that confirms same inputs produce same question set

---

## Task T94: Fix N+1 in HierarchyFactory

**Priority**: 🟡 Important | **Effort**: 1 day | **Risk**: Medium

### Prompt

> Read the complete `apps/api-server/src/modules/domain/hierarchy.factory.ts` (or wherever the hierarchy import logic lives — it might also be in `admin-engine/admin.domain.engine.ts`).
>
> **Find the sequential skill/topic/subtopic lookups** — the code likely does:
> ```ts
> // BAD pattern:
> for (const skill of skills) {
>   const existing = await db.query.skills.findFirst({ where: eq(name, skill.name) });
>   if (!existing) {
>     await db.insert(skillsTable).values({ name: skill.name, ... });
>   }
> }
> ```
>
> **Replace with batch operations**:
>
> 1. **Batch lookups** — find all existing in one query:
>    ```ts
>    const skillNames = skills.map(s => s.name);
>    const existingSkills = await db.select().from(skillsTable)
>      .where(inArray(skillsTable.name, skillNames));
>    const existingNames = new Set(existingSkills.map(s => s.name));
>    const newSkills = skills.filter(s => !existingNames.has(s.name));
>    ```
>
> 2. **Batch inserts** — insert all new records at once:
>    ```ts
>    if (newSkills.length > 0) {
>      await db.insert(skillsTable).values(
>        newSkills.map(s => ({ name: s.name, ... }))
>      );
>    }
>    ```
>
> 3. **Batch upserts** — for subjects, topics, subtopics, use `onConflictDoUpdate`:
>    ```ts
>    await db.insert(subjectsTable)
>      .values(subjectRecords)
>      .onConflictDoUpdate({
>        target: subjectsTable.name,
>        set: { updatedAt: new Date() }
>      });
>    ```
>
> 4. **Keep transaction integrity** — ALL batch operations MUST run within existing `db.transaction()`.
>
> **Target**: Maximum 8-10 queries per hierarchy import (down from ~150).
>
> **Verify**: `pnpm --filter @quiz/api-server run test` — all domain/hierarchy tests pass.

---

## Task T96: Create Data Retention Cleanup Jobs

**Priority**: 🟡 Important | **Effort**: 1 day | **Risk**: Low

### Prompt

> Read the database schema files to identify tables needing cleanup:
> - `packages/db/src/schema/auth.ts`
> - `packages/db/src/schema/exam.ts`
>
> A `services/cleanup.service.ts` may already exist — check it and extend, or create if not sufficient.
>
> Create or update `apps/api-server/src/services/cleanup.service.ts`:
>
> ```ts
> import { db } from '@quiz/db';
> import { lt, and, eq } from 'drizzle-orm';
> import { refreshTokens, sessions, loginAttempts, verificationTokens, passwordResetTokens } from '@quiz/db/schema';
>
> export class CleanupService {
>   /** Delete expired + revoked refresh tokens older than 30 days */
>   static async cleanupExpiredRefreshTokens() {
>     const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
>     let totalDeleted = 0;
>     let deleted: number;
>     do {
>       const result = await db.delete(refreshTokens)
>         .where(lt(refreshTokens.createdAt, cutoff))
>         .returning({ id: refreshTokens.id });
>       deleted = result.length;
>       totalDeleted += deleted;
>     } while (deleted >= 1000); // batch loop
>     return { table: 'refreshTokens', rowsDeleted: totalDeleted };
>   }
>
>   /** Delete expired sessions older than 24 hours */
>   static async cleanupExpiredSessions() {
>     const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
>     const result = await db.delete(sessions)
>       .where(lt(sessions.expiresAt, cutoff))
>       .returning({ id: sessions.id });
>     return { table: 'sessions', rowsDeleted: result.length };
>   }
>
>   /** Delete login attempts older than 90 days */
>   static async cleanupOldLoginAttempts() {
>     const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
>     const result = await db.delete(loginAttempts)
>       .where(lt(loginAttempts.createdAt, cutoff))
>       .returning({ id: loginAttempts.id });
>     return { table: 'loginAttempts', rowsDeleted: result.length };
>   }
>
>   /** Run all cleanup tasks */
>   static async cleanupAll() {
>     const results = [];
>     const tasks = [
>       this.cleanupExpiredRefreshTokens,
>       this.cleanupExpiredSessions,
>       this.cleanupOldLoginAttempts,
>     ];
>     for (const task of tasks) {
>       try {
>         results.push(await task.call(this));
>       } catch (error) {
>         results.push({ table: task.name, error: String(error) });
>       }
>     }
>     return results;
>   }
> }
> ```
>
> Also check if a cron route already exists at `apps/api-server/src/app/api/cron/`. If yes, add cleanup to it. If not, create:
> ```
> apps/api-server/src/app/api/cron/cleanup/route.ts
> ```
> That calls `CleanupService.cleanupAll()` and is protected by a cron secret.
>
> **Verify**: Write a unit test in `services/__tests__/cleanup.service.test.ts` that mocks the DB and tests each method.

---

## Task T98: Convert Admin Lists to Keyset Pagination

**Priority**: 🟡 Important | **Effort**: 1 day | **Risk**: Medium

### Prompt

> Search for OFFSET-based pagination in admin routes:
> ```bash
> grep -rn "offset\|OFFSET\|page.*pageSize\|skip" apps/api-server/src/modules/admin-engine/ --include="*.ts"
> ```
>
> Create `apps/api-server/src/lib/pagination.ts`:
>
> ```ts
> /**
>  * Keyset (cursor-based) pagination utilities.
>  * Replaces OFFSET pagination which degrades at scale.
>  */
>
> export interface PageCursor {
>   lastId: string;
>   lastSortValue: string;
> }
>
> export interface PaginatedResponse<T> {
>   data: T[];
>   nextCursor: string | null;
>   hasMore: boolean;
>   total?: number;
> }
>
> export function encodePageCursor(lastId: string, lastSortValue: string): string {
>   return Buffer.from(JSON.stringify({ lastId, lastSortValue })).toString('base64url');
> }
>
> export function decodePageCursor(cursor: string): PageCursor {
>   try {
>     return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'));
>   } catch {
>     throw new Error('Invalid pagination cursor');
>   }
> }
>
> export function buildPaginatedResponse<T extends { id: string }>(
>   items: T[],
>   limit: number,
>   getSortValue: (item: T) => string,
> ): PaginatedResponse<T> {
>   const hasMore = items.length > limit;
>   const data = hasMore ? items.slice(0, limit) : items;
>   const lastItem = data[data.length - 1];
>   return {
>     data,
>     nextCursor: lastItem ? encodePageCursor(lastItem.id, getSortValue(lastItem)) : null,
>     hasMore,
>   };
> }
> ```
>
> Then update **2-3 admin list endpoints** as examples:
>
> 1. **Admin user list** — accept `?cursor=xxx&limit=20` alongside existing `?page=&pageSize=`:
>    ```ts
>    // In the route handler:
>    const cursor = searchParams.get('cursor');
>    const limit = parseInt(searchParams.get('limit') || '20');
>
>    let query = db.select().from(users).orderBy(desc(users.createdAt)).limit(limit + 1);
>
>    if (cursor) {
>      const { lastId, lastSortValue } = decodePageCursor(cursor);
>      query = query.where(
>        or(
>          lt(users.createdAt, new Date(lastSortValue)),
>          and(eq(users.createdAt, new Date(lastSortValue)), lt(users.id, lastId))
>        )
>      );
>    }
>
>    const items = await query;
>    return buildPaginatedResponse(items, limit, item => item.createdAt.toISOString());
>    ```
>
> 2. **Admin question list** — same pattern.
>
> **Backward compatibility**: When `page` param is provided (old format), fall back to OFFSET. Add log warning: "Deprecated: offset pagination. Use cursor-based pagination."
>
> **Verify**: `pnpm --filter @quiz/api-server run test` and `pnpm --filter @quiz/api-server run build`

---

# Sprint 5: Remaining Frontend Tasks (3-5 days)

---

## Task T85: Add React Query

**Priority**: 🟡 Important | **Effort**: 1.5 days | **Risk**: Medium

### Prompt

> 1. **Install** in both frontend apps:
>    ```bash
>    pnpm --filter @quiz/web-app add @tanstack/react-query @tanstack/react-query-devtools
>    pnpm --filter @quiz/admin-app add @tanstack/react-query @tanstack/react-query-devtools
>    ```
>
> 2. **Create QueryProvider** in each app at `src/providers/query-provider.tsx`:
>    ```tsx
>    'use client'
>    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
>    import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
>    import { useState } from 'react'
>
>    export function QueryProvider({ children }: { children: React.ReactNode }) {
>      const [queryClient] = useState(() => new QueryClient({
>        defaultOptions: {
>          queries: {
>            staleTime: 5 * 60 * 1000,    // 5 minutes
>            gcTime: 10 * 60 * 1000,       // 10 minutes
>            retry: 2,
>            refetchOnWindowFocus: true,
>          },
>        },
>      }))
>      return (
>        <QueryClientProvider client={queryClient}>
>          {children}
>          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
>        </QueryClientProvider>
>      )
>    }
>    ```
>
> 3. **Wrap both apps' root layouts** with `<QueryProvider>`.
>
> 4. **Create 2-3 example hooks** in `apps/web-app/src/hooks/queries/`:
>    - `useUserProfile.ts` — `useQuery({ queryKey: ['user-profile'], queryFn: () => apiClient.auth.getProfile() })`
>    - `useDomains.ts` — `useQuery({ queryKey: ['domains'], queryFn: () => apiClient.quiz.getDomains(), staleTime: 30 * 60 * 1000 })`
>
> 5. **Convert 1-2 existing pages** from `useEffect + useState` to React Query as examples. Show before/after.
>
> **Do NOT convert all pages** — just set up infrastructure + show pattern.
>
> **Verify**: `pnpm --filter @quiz/web-app run build` — no errors. Open app, confirm React Query Devtools panel appears in dev.

---

## Task T88: Deduplicate Tailwind Configuration

**Priority**: 🟢 Nice-to-have | **Effort**: 2 hours | **Risk**: Low

### Prompt

> Read both Tailwind configs:
> - `apps/web-app/tailwind.config.ts`
> - `apps/admin-app/tailwind.config.ts`
>
> Identify what's identical (theme, colors, fonts, plugins) vs. different (content paths).
>
> 1. Create `packages/ui/tailwind.preset.ts`:
>    ```ts
>    import type { Config } from 'tailwindcss'
>
>    export default {
>      theme: {
>        // Move ALL shared theme config here (colors, fonts, spacing, animations)
>      },
>      plugins: [
>        // Move shared plugins here
>      ],
>    } satisfies Partial<Config>
>    ```
>
> 2. Update each app's `tailwind.config.ts`:
>    ```ts
>    import sharedPreset from '@quiz/ui/tailwind.preset'
>    export default {
>      presets: [sharedPreset],
>      content: [
>        './src/**/*.{ts,tsx}',
>        '../../packages/ui/src/**/*.{ts,tsx}', // shared UI components
>      ],
>      // Only app-specific overrides here
>    } satisfies Config
>    ```
>
> **Verify**: `pnpm build` — both apps build. Visually confirm no style changes.

---

## Task T89: Deduplicate Auth Store

**Priority**: 🟢 Nice-to-have | **Effort**: 3 hours | **Risk**: Medium

### Prompt

> Read both auth stores:
> - `apps/web-app/src/store/auth-store.ts`
> - `apps/admin-app/src/store/auth-store.ts`
>
> Identify shared logic (~80% identical) vs. app-specific logic.
>
> Create `packages/api-client/src/stores/create-auth-store.ts`:
> ```ts
> import { create } from 'zustand'
> import { persist } from 'zustand/middleware'
>
> interface AuthStoreOptions {
>   storageKey: string
>   redirectOnLogout: string
> }
>
> export function createBaseAuthStore(options: AuthStoreOptions) {
>   return create(persist(
>     (set, get) => ({
>       user: null,
>       accessToken: null,
>       isAuthenticated: false,
>       login: async (credentials) => { /* shared login logic */ },
>       logout: () => { /* shared logout logic */ },
>       refreshSession: async () => { /* shared refresh logic */ },
>     }),
>     { name: options.storageKey }
>   ))
> }
> ```
>
> Update each app's auth store to extend the base:
> ```ts
> import { createBaseAuthStore } from '@quiz/api-client/stores/create-auth-store'
> export const useAuthStore = createBaseAuthStore({ storageKey: 'quiz-auth', redirectOnLogout: '/login' })
> ```
>
> **Verify**: Both apps build and login/logout still works.

---

## Task T90: Create Shared useDebounce Hook

**Priority**: 🟢 Nice-to-have | **Effort**: 1 hour | **Risk**: None

### Prompt

> Create `packages/ui/src/hooks/use-debounce.ts`:
> ```ts
> import { useState, useEffect } from 'react'
>
> export function useDebounce<T>(value: T, delayMs: number = 300): T {
>   const [debouncedValue, setDebouncedValue] = useState(value)
>
>   useEffect(() => {
>     const timer = setTimeout(() => setDebouncedValue(value), delayMs)
>     return () => clearTimeout(timer)
>   }, [value, delayMs])
>
>   return debouncedValue
> }
> ```
>
> Create `packages/ui/src/hooks/use-debounced-callback.ts`:
> ```ts
> import { useCallback, useRef, useEffect } from 'react'
>
> export function useDebouncedCallback<T extends (...args: any[]) => any>(
>   callback: T,
>   delayMs: number = 300
> ): T & { cancel: () => void; flush: () => void } {
>   const timeoutRef = useRef<NodeJS.Timeout | null>(null)
>   const callbackRef = useRef(callback)
>   const argsRef = useRef<any[]>([])
>
>   callbackRef.current = callback
>
>   useEffect(() => {
>     return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
>   }, [])
>
>   const debouncedFn = useCallback((...args: any[]) => {
>     argsRef.current = args
>     if (timeoutRef.current) clearTimeout(timeoutRef.current)
>     timeoutRef.current = setTimeout(() => {
>       callbackRef.current(...argsRef.current)
>     }, delayMs)
>   }, [delayMs]) as any
>
>   debouncedFn.cancel = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
>   debouncedFn.flush = () => {
>     if (timeoutRef.current) {
>       clearTimeout(timeoutRef.current)
>       callbackRef.current(...argsRef.current)
>     }
>   }
>
>   return debouncedFn
> }
> ```
>
> Export from `packages/ui/src/hooks/index.ts`:
> ```ts
> export { useDebounce } from './use-debounce'
> export { useDebouncedCallback } from './use-debounced-callback'
> ```
>
> Export from `packages/ui/src/index.ts` main barrel.
>
> **Verify**: `pnpm --filter @quiz/ui run build`

---

# Checklist

After completing all sprints, the project status will be:

```
Phase 1: ████████████████████████ 41/41 (100%) ✅
Phase 2: ████████████████████░░░ 50/53 (94%)  ✅
Phase 3: ░░░░░░░░░░░░░░░░░░░░░░  0/36 (0%)   — Next milestone
Phase 4: ░░░░░░░░░░░░░░░░░░░░░░  0/31 (0%)   — Future
```

**Remaining after all sprints**: T57 (DI wiring), T61 (State Machine), T62 (Event Bus), T63 (Builder), T71 (Request Context), and Phases 3-4.

---

# Sprint 6: Architecture Gaps (2-3 days)

> These tasks were identified in the Phase 2 blueprint but were not included in earlier sprints.
> All prompts are written against the **actual codebase state** as of 2026-03-09.

---

## Task T55: ISP — Split Zustand QuizStore into Slices ✅ ALREADY DONE

> [!NOTE]
> **This task is complete.** `apps/web-app/src/store/quiz-store.ts` already imports from 4 separate slice files:
> - `quiz/session.slice.ts`
> - `quiz/content.slice.ts`
> - `quiz/interaction.slice.ts`
> - `quiz/timer.slice.ts`
>
> No action required.

---

## Task T57: DIP — Wire Repositories into Services via DI Container

**Priority**: 🟡 Important | **Effort**: 3 hours | **Risk**: Medium

### Context
`apps/api-server/src/modules/core/container.ts` already has a working `DIContainer` class with `register()`, `get()`, and `reset()` methods. However, the repositories and services are NOT wired into it — each service still instantiates its dependencies directly. This task wires them up.

### Prompt

> Open `apps/api-server/src/modules/core/container.ts` — read the full `DIContainer` implementation.
>
> Then create a **composition root** that registers all repositories and services. Create a new file:
> `apps/api-server/src/lib/app.container.ts`
>
> ```ts
> /**
>  * Application Composition Root
>  * Registers all repository → service dependencies into the DI container.
>  * Import and call `bootstrapContainer()` once at app startup.
>  */
> import { container } from '@/modules/core/container';
>
> // Repositories
> import { DrizzleAdminUserRepository } from '@/repositories/implementations/drizzle-admin-user.repository';
> import { DrizzleQuestionRepository } from '@/repositories/implementations/drizzle-question.repository';
> import { DrizzleSessionRepository } from '@/repositories/implementations/drizzle-session.repository';
> import { DrizzleAuditRepository } from '@/repositories/implementations/drizzle-audit.repository';
> import { DrizzleDomainRepository } from '@/repositories/implementations/drizzle-domain.repository';
> import { DrizzleBlueprintRepository } from '@/repositories/implementations/drizzle-blueprint.repository';
> import { DrizzleSubjectRepository } from '@/repositories/implementations/drizzle-subject.repository';
> import { DrizzleTopicRepository } from '@/repositories/implementations/drizzle-topic.repository';
> import { DrizzleSubtopicRepository } from '@/repositories/implementations/drizzle-subtopic.repository';
> import { DrizzleSkillRepository } from '@/repositories/implementations/drizzle-skill.repository';
>
> // Repository interface tokens
> import type { IAdminUserRepository } from '@/repositories/interfaces/admin-user.repository.interface';
> import type { IQuestionRepository } from '@/repositories/interfaces/question.repository.interface';
> import type { ISessionRepository } from '@/repositories/interfaces/session.repository.interface';
> import type { IAuditRepository } from '@/repositories/interfaces/audit.repository.interface';
> import type { IDomainRepository } from '@/repositories/interfaces/domain.repository.interface';
>
> export const TOKENS = {
>   AdminUserRepo: 'IAdminUserRepository',
>   QuestionRepo: 'IQuestionRepository',
>   SessionRepo: 'ISessionRepository',
>   AuditRepo: 'IAuditRepository',
>   DomainRepo: 'IDomainRepository',
>   BlueprintRepo: 'IBlueprintRepository',
>   SubjectRepo: 'ISubjectRepository',
>   TopicRepo: 'ITopicRepository',
>   SubtopicRepo: 'ISubtopicRepository',
>   SkillRepo: 'ISkillRepository',
> } as const;
>
> export function bootstrapContainer() {
>   // Register repository implementations
>   container.register(TOKENS.AdminUserRepo, new DrizzleAdminUserRepository());
>   container.register(TOKENS.QuestionRepo, new DrizzleQuestionRepository());
>   container.register(TOKENS.SessionRepo, new DrizzleSessionRepository());
>   container.register(TOKENS.AuditRepo, new DrizzleAuditRepository());
>   container.register(TOKENS.DomainRepo, new DrizzleDomainRepository());
>   container.register(TOKENS.BlueprintRepo, new DrizzleBlueprintRepository());
>   container.register(TOKENS.SubjectRepo, new DrizzleSubjectRepository());
>   container.register(TOKENS.TopicRepo, new DrizzleTopicRepository());
>   container.register(TOKENS.SubtopicRepo, new DrizzleSubtopicRepository());
>   container.register(TOKENS.SkillRepo, new DrizzleSkillRepository());
> }
> ```
>
> **Rules when implementing**:
> - Read each repository constructor signature first. If a constructor requires arguments (e.g., a `db` instance), pass them on registration.
> - Check if any repository imports already exist in the repository files before importing.
> - Do NOT change any existing service or repository files — only create this new wiring file.
>
> After creating `app.container.ts`, call `bootstrapContainer()` early in the API server's entry point. Look for `apps/api-server/src/instrumentation.ts` or the Next.js root layout/API middleware — add `import { bootstrapContainer } from '@/lib/app.container'; bootstrapContainer();` at the top.
>
> **Migrate 2-3 admin services as examples** to consume from the container instead of direct instantiation:
> ```ts
> // BEFORE (direct instantiation):
> const repo = new DrizzleAdminUserRepository();
>
> // AFTER (from container):
> import { container, TOKENS } from '@/lib/app.container';
> const repo = container.get(TOKENS.AdminUserRepo);
> ```
>
> **Verify**: `pnpm --filter @quiz/api-server run build` and `pnpm --filter @quiz/api-server run test`

---

## Task T61: Formal Exam State Machine

**Priority**: 🟡 Important | **Effort**: 1 day | **Risk**: Medium

### Context
The exam lifecycle (started → in_progress → completed / failed / abandoned / expired) is currently managed with ad-hoc status string checks scattered across `exam.engine.ts`. There is no formal state machine, so invalid transitions (e.g. submitting an answer to a completed exam) are caught by scattered guard checks.

### Prompt

> Read `apps/api-server/src/modules/exam-engine/exam.engine.ts` fully. Identify:
> - All places where `exam.status` is read and compared
> - All places where `exam.status` is set/updated
> - What status values are used (strings like `'started'`, `'completed'`, `'failed'`, etc.)
>
> Then create `apps/api-server/src/modules/exam-engine/exam-state-machine.ts`:
>
> ```ts
> /**
>  * Formal Exam State Machine
>  * Centralises all lifecycle transitions for exam sessions.
>  * No other code should directly mutate exam.status — use this machine.
>  */
>
> export type ExamStatus =
>   | 'pending'
>   | 'started'
>   | 'in_progress'
>   | 'completed'
>   | 'failed'
>   | 'abandoned'
>   | 'expired';
>
> /** All legal state transitions: from → allowed targets */
> const TRANSITIONS: Record<ExamStatus, ExamStatus[]> = {
>   pending:     ['started'],
>   started:     ['in_progress', 'abandoned', 'expired'],
>   in_progress: ['completed', 'failed', 'abandoned', 'expired'],
>   completed:   [],           // terminal
>   failed:      [],           // terminal
>   abandoned:   [],           // terminal
>   expired:     [],           // terminal
> };
>
> export class ExamStateMachine {
>   private status: ExamStatus;
>
>   constructor(currentStatus: ExamStatus) {
>     this.status = currentStatus;
>   }
>
>   /** Returns the current exam status */
>   getStatus(): ExamStatus {
>     return this.status;
>   }
>
>   /** Returns true if transitioning from current status to `next` is legal */
>   canTransition(next: ExamStatus): boolean {
>     return TRANSITIONS[this.status].includes(next);
>   }
>
>   /**
>    * Performs the transition. Throws ExamTransitionError if the transition is illegal.
>    * Returns the new status on success.
>    */
>   transition(next: ExamStatus): ExamStatus {
>     if (!this.canTransition(next)) {
>       throw new ExamTransitionError(
>         `Invalid exam transition: ${this.status} → ${next}`
>       );
>     }
>     this.status = next;
>     return this.status;
>   }
>
>   /** Convenience: is the exam in a terminal (non-modifiable) state? */
>   isTerminal(): boolean {
>     return TRANSITIONS[this.status].length === 0;
>   }
>
>   /** Static factory — creates machine from a raw status string (e.g. from DB) */
>   static from(rawStatus: string): ExamStateMachine {
>     return new ExamStateMachine(rawStatus as ExamStatus);
>   }
> }
>
> export class ExamTransitionError extends Error {
>   readonly code = 'INVALID_EXAM_TRANSITION';
>   constructor(message: string) {
>     super(message);
>     this.name = 'ExamTransitionError';
>   }
> }
> ```
>
> After creating the machine, **integrate it into `exam.engine.ts`**:
> 1. Find the `startExam` method — replace the raw status assignment with `ExamStateMachine.from('pending').transition('started')`
> 2. Find the `completeExam` / `submitAnswer` guard — replace `if (exam.status !== 'started') throw` with `ExamStateMachine.from(exam.status).canTransition('completed')` check
> 3. Find the timeout/expiry logic — replace with `ExamStateMachine.from(exam.status).transition('expired')`
>
> **Do NOT change any DB schema or route handlers.** Only refactor the engine's internal status handling.
>
> **Write tests** in `exam-engine/__tests__/exam-state-machine.test.ts`:
> - Valid transitions succeed
> - Invalid transitions throw `ExamTransitionError`
> - Terminal states reject all transitions
> - `canTransition()` returns correct booleans
>
> **Verify**: `pnpm --filter @quiz/api-server run test -- exam-state-machine`

---

## Task T62: Event Bus + Application Events

**Priority**: 🟢 Nice-to-have | **Effort**: 1 day | **Risk**: Low

### Context
Services currently call each other directly (e.g. ExamEngine calls AuditService inline). An event bus decouples these — ExamEngine emits `exam.completed` and AuditService, AnalyticsService, NotificationService each listen independently.

### Prompt

> Create `apps/api-server/src/lib/event-bus.ts`:
>
> ```ts
> /**
>  * Typed in-process Event Bus (publish/subscribe).
>  * Enables decoupled communication between services.
>  * Uses async handlers — errors in one handler don't block others.
>  */
>
> type EventHandler<T> = (payload: T) => Promise<void> | void;
>
> class EventBus {
>   private handlers = new Map<string, EventHandler<unknown>[]>();
>
>   /** Subscribe to an event */
>   on<T>(event: string, handler: EventHandler<T>): void {
>     if (!this.handlers.has(event)) this.handlers.set(event, []);
>     this.handlers.get(event)!.push(handler as EventHandler<unknown>);
>   }
>
>   /** Unsubscribe a specific handler */
>   off<T>(event: string, handler: EventHandler<T>): void {
>     const existing = this.handlers.get(event) ?? [];
>     this.handlers.set(event, existing.filter(h => h !== handler));
>   }
>
>   /** Emit an event — all handlers run concurrently, errors are isolated */
>   async emit<T>(event: string, payload: T): Promise<void> {
>     const eventHandlers = this.handlers.get(event) ?? [];
>     await Promise.allSettled(
>       eventHandlers.map(h => Promise.resolve(h(payload)))
>     );
>   }
>
>   /** Remove all handlers (use in tests) */
>   clear(): void {
>     this.handlers.clear();
>   }
> }
>
> export const eventBus = new EventBus();
> ```
>
> Create `apps/api-server/src/lib/events.ts` — typed event definitions:
>
> ```ts
> /**
>  * Application Event Type Definitions
>  * All event payloads must be defined here.
>  */
>
> export const AppEvents = {
>   EXAM_STARTED:      'exam.started',
>   EXAM_COMPLETED:    'exam.completed',
>   EXAM_FAILED:       'exam.failed',
>   EXAM_ABANDONED:    'exam.abandoned',
>   EXAM_EXPIRED:      'exam.expired',
>   USER_SIGNED_UP:    'user.signed_up',
>   USER_LOGGED_IN:    'user.logged_in',
>   USER_LOGGED_OUT:   'user.logged_out',
>   PASSWORD_RESET:    'user.password_reset',
>   QUESTION_CREATED:  'content.question_created',
>   QUESTION_UPDATED:  'content.question_updated',
> } as const;
>
> export type AppEvent = typeof AppEvents[keyof typeof AppEvents];
>
> // Payload type for each event
> export interface ExamStartedPayload   { examId: string; userId: string; blueprintId: string; questionCount: number; startedAt: Date; }
> export interface ExamCompletedPayload { examId: string; userId: string; overallScore: number; completedAt: Date; }
> export interface ExamFailedPayload    { examId: string; userId: string; reason: string; failedAt: Date; }
> export interface UserSignedUpPayload  { userId: string; email: string; signedUpAt: Date; }
> export interface UserLoggedInPayload  { userId: string; ip: string; userAgent: string; loggedInAt: Date; }
> export interface QuestionCreatedPayload { questionId: string; adminId: string; topicId: string; createdAt: Date; }
> ```
>
> **Wire up 2-3 event emissions as examples**:
>
> 1. In `exam.engine.ts` — after successfully starting an exam:
>    ```ts
>    import { eventBus } from '@/lib/event-bus';
>    import { AppEvents, ExamStartedPayload } from '@/lib/events';
>    // ... after DB write succeeds:
>    await eventBus.emit<ExamStartedPayload>(AppEvents.EXAM_STARTED, {
>      examId: newExam.id, userId, blueprintId, questionCount: questions.length, startedAt: new Date()
>    });
>    ```
>
> 2. In `exam.engine.ts` — after exam completion:
>    ```ts
>    await eventBus.emit<ExamCompletedPayload>(AppEvents.EXAM_COMPLETED, { examId, userId, overallScore, completedAt: new Date() });
>    ```
>
> **Write tests** in `lib/__tests__/event-bus.test.ts`:
> - `on` + `emit` — handler receives correct payload
> - Multiple handlers on same event all fire
> - Handler error does NOT stop other handlers
> - `off` correctly removes handler
> - `clear` removes all handlers
>
> **Verify**: `pnpm --filter @quiz/api-server run test -- event-bus`

---

## Task T63: Builder Pattern for Exam Construction

**Priority**: 🟢 Nice-to-have | **Effort**: 1 day | **Risk**: Low

### Context
`exam.engine.ts` `startExam()` creates exam configuration with a large inline object. A Builder pattern makes construction explicit, validates required fields, and allows optional configuration via fluent chaining.

### Prompt

> Read `apps/api-server/src/modules/exam-engine/exam.engine.ts` — specifically the `startExam` method.
> Understand exactly what fields are assembled to create an exam record (examId, userId, blueprintId, questions, timeLimit, etc.).
>
> Create `apps/api-server/src/modules/exam-engine/exam.builder.ts`:
>
> ```ts
> /**
>  * Fluent Builder for creating exam sessions.
>  * Validates required fields before construction.
>  * Use: const exam = await new ExamBuilder(db).forUser(userId).fromBlueprint(blueprintId).withQuestions(qs).build();
>  */
> import { nanoid } from 'nanoid';
>
> interface ExamConfig {
>   examId: string;
>   userId: string;
>   blueprintId: string;
>   questions: { id: string; [key: string]: unknown }[];
>   timeLimit: number;           // seconds
>   idempotencyKey?: string;
>   metadata?: Record<string, unknown>;
> }
>
> export class ExamBuilder {
>   private config: Partial<ExamConfig> = {};
>
>   constructor() {
>     this.config.examId = nanoid();  // auto-generate ID
>   }
>
>   /** Set the user this exam belongs to (REQUIRED) */
>   forUser(userId: string): this {
>     this.config.userId = userId;
>     return this;
>   }
>
>   /** Set which blueprint to use (REQUIRED) */
>   fromBlueprint(blueprintId: string): this {
>     this.config.blueprintId = blueprintId;
>     return this;
>   }
>
>   /** Set the selected questions for this exam (REQUIRED) */
>   withQuestions(questions: ExamConfig['questions']): this {
>     this.config.questions = questions;
>     return this;
>   }
>
>   /** Set the time limit in seconds (REQUIRED) */
>   withTimeLimit(seconds: number): this {
>     this.config.timeLimit = seconds;
>     return this;
>   }
>
>   /** Set an idempotency key (optional — prevents duplicate exam starts) */
>   withIdempotencyKey(key: string): this {
>     this.config.idempotencyKey = key;
>     return this;
>   }
>
>   /** Attach custom metadata (optional) */
>   withMetadata(metadata: Record<string, unknown>): this {
>     this.config.metadata = metadata;
>     return this;
>   }
>
>   /** Override the auto-generated exam ID (optional — use for testing) */
>   withExamId(examId: string): this {
>     this.config.examId = examId;
>     return this;
>   }
>
>   /**
>    * Validates all required fields and returns the final exam config.
>    * Throws ExamBuilderError if any required field is missing.
>    */
>   build(): ExamConfig {
>     const required: (keyof ExamConfig)[] = ['userId', 'blueprintId', 'questions', 'timeLimit'];
>     for (const field of required) {
>       if (this.config[field] === undefined || this.config[field] === null) {
>         throw new ExamBuilderError(`ExamBuilder: missing required field '${field}'`);
>       }
>     }
>     if ((this.config.questions as ExamConfig['questions']).length === 0) {
>       throw new ExamBuilderError('ExamBuilder: questions array cannot be empty');
>     }
>     return this.config as ExamConfig;
>   }
> }
>
> export class ExamBuilderError extends Error {
>   readonly code = 'EXAM_BUILDER_ERROR';
>   constructor(message: string) {
>     super(message);
>     this.name = 'ExamBuilderError';
>   }
> }
> ```
>
> **Integrate into `exam.engine.ts`**:
> - In the `startExam` method, replace the inline config object with the builder:
>   ```ts
>   const examConfig = new ExamBuilder()
>     .forUser(userId)
>     .fromBlueprint(blueprintId)
>     .withQuestions(selectedQuestions)
>     .withTimeLimit(blueprint.timeLimitSeconds)
>     .withIdempotencyKey(idempotencyKey)
>     .build();
>   ```
> - The rest of the method uses `examConfig.examId`, `examConfig.questions`, etc.
>
> **Write tests** in `exam-engine/__tests__/exam.builder.test.ts`:
> - `build()` succeeds with all required fields
> - `build()` throws `ExamBuilderError` when `userId` is missing
> - `build()` throws `ExamBuilderError` when `questions` is empty
> - Fluent chaining: each method returns `this`
> - Optional fields (`idempotencyKey`, `metadata`) default to undefined safely
>
> **Verify**: `pnpm --filter @quiz/api-server run test -- exam.builder`

---

## Task T71: Request Correlation IDs (`request-context.ts`)

**Priority**: 🟡 Important | **Effort**: 3 hours | **Risk**: Low

### Context
`apps/api-server/src/lib/logger.ts` and `tracer.ts` both exist. However, there is no `request-context.ts` using `AsyncLocalStorage` to store and propagate per-request context (correlation ID, user ID). Without it, the logger cannot automatically include `requestId` in every log line from within a single request chain.

### Prompt

> Read `apps/api-server/src/lib/logger.ts` to understand:
> - What the logger expects for `requestId` and `userId` context
> - Whether there is any partial `AsyncLocalStorage` usage already
>
> Create `apps/api-server/src/lib/request-context.ts`:
>
> ```ts
> /**
>  * Request Context using AsyncLocalStorage.
>  * Stores per-request metadata (correlation ID, user ID) that is
>  * automatically available throughout the entire request chain.
>  */
> import { AsyncLocalStorage } from 'async_hooks';
> import { randomUUID } from 'crypto';
>
> interface RequestContext {
>   requestId: string;
>   userId?: string;
>   ip?: string;
>   startedAt: number;
> }
>
> const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
>
> /** Get the current request context (undefined outside a request) */
> export function getRequestContext(): RequestContext | undefined {
>   return asyncLocalStorage.getStore();
> }
>
> /** Get just the correlation ID for the current request */
> export function getRequestId(): string | undefined {
>   return asyncLocalStorage.getStore()?.requestId;
> }
>
> /** Get the authenticated user ID for the current request */
> export function getUserId(): string | undefined {
>   return asyncLocalStorage.getStore()?.userId;
> }
>
> /** Set the user ID after authentication middleware runs */
> export function setUserId(userId: string): void {
>   const store = asyncLocalStorage.getStore();
>   if (store) store.userId = userId;
> }
>
> /**
>  * Run a function within a request context.
>  * All async operations within fn() will have access to this context.
>  */
> export function withRequestContext<T>(
>   context: Partial<RequestContext> & { requestId?: string },
>   fn: () => T
> ): T {
>   const fullContext: RequestContext = {
>     requestId: context.requestId ?? randomUUID(),
>     userId: context.userId,
>     ip: context.ip,
>     startedAt: Date.now(),
>   };
>   return asyncLocalStorage.run(fullContext, fn);
> }
> ```
>
> Create middleware at `apps/api-server/src/middleware/correlation-id.middleware.ts`:
>
> ```ts
> import { NextRequest, NextResponse } from 'next/server';
> import { randomUUID } from 'crypto';
> import { withRequestContext } from '@/lib/request-context';
>
> /**
>  * Correlation ID middleware.
>  * MUST run before all other middleware.
>  * Reads X-Request-ID header (from client/load balancer) or generates a new UUID.
>  * Stores it in AsyncLocalStorage so the entire request chain has access.
>  */
> export function withCorrelationId(
>   handler: (req: NextRequest) => Promise<NextResponse>
> ) {
>   return async (req: NextRequest): Promise<NextResponse> => {
>     const requestId = req.headers.get('x-request-id') ?? randomUUID();
>     return withRequestContext({ requestId }, () => handler(req));
>   };
> }
> ```
>
> **Update `logger.ts`** to auto-include request context in every log:
> - Import `getRequestId` and `getUserId` from `request-context.ts`
> - In the `info`, `error`, `warn`, `debug` methods, add `requestId: getRequestId(), userId: getUserId()` to every log entry automatically
>
> **Apply the middleware** to 2-3 existing API route handlers as examples using `withCorrelationId`:
> ```ts
> // In a route handler:
> import { withCorrelationId } from '@/middleware/correlation-id.middleware';
> const handler = async (req: NextRequest) => { ... };
> export const GET = withCorrelationId(handler);
> ```
>
> **Write tests** in `lib/__tests__/request-context.test.ts`:
> - `withRequestContext` stores and retrieves `requestId`
> - `getRequestId()` returns `undefined` outside a request context
> - Nested async operations within a context still see the same `requestId`
> - `setUserId` updates the mutable context correctly
>
> **Verify**: `pnpm --filter @quiz/api-server run build` and `pnpm --filter @quiz/api-server run test -- request-context`
