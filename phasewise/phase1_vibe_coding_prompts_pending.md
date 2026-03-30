# Phase 1 — Vibe Coding Prompts to Close Remaining Gaps

> Paste each prompt block directly into your AI coding agent. Each is self-contained.
> Run them in the order shown (🔴 → 🟡 → 🟢) to finish Phase 1.

---

## 🔴 GROUP 1 — Critical (Security & Coverage)

---

### PROMPT 1A — Fix api-server Coverage Thresholds (Task 12)

```
You are working on the file:
  apps/api-server/vitest.config.ts

The current coverage thresholds are all set to 0, which means CI never enforces test coverage on the most critical package.

Update the thresholds to the following values:
  statements: 70
  branches: 60
  functions: 70
  lines: 70

Additionally, add per-file threshold overrides for security-critical modules:
  - src/modules/auth/**  → statements: 90, branches: 90, functions: 90, lines: 90
  - src/modules/exam-engine/**  → statements: 85, branches: 85, functions: 85, lines: 85
  - src/modules/scoring-engine/** → statements: 85, branches: 85, functions: 85, lines: 85

Use Vitest's `coverage.thresholds` and `coverage.perFile` API. Keep all existing config (plugins, paths, exclude patterns) unchanged.
Do not change any other file.
```

---

### PROMPT 1B — Add Web App Next.js Middleware (Task 41)

```
You are working on the Next.js 16 frontend at apps/web-app/.

Create a new file: apps/web-app/src/middleware.ts

This middleware must:
1. Protect all routes under /dashboard, /exam, /reports, /quiz, /profile — redirect unauthenticated users to /login?redirect={originalPath}.
2. Redirect already-authenticated users away from /login and /signup to /dashboard.
3. Auth detection: check for the presence of the cookie named "accessToken" (do NOT verify the JWT signature in middleware — that is too slow for Edge runtime). Full verification happens in the API layer.
4. Pass through all routes starting with /_next, /favicon, /icon, /api, and static file extensions (.png, .jpg, .svg, .ico, .webp).
5. Add these security headers to every response: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin.

Export a config.matcher that only activates the middleware on relevant routes.

Reference the existing security headers from packages/config/security-headers.ts if importing from there is possible in Edge runtime (check if it uses any Node.js APIs — if so, inline the headers directly).

Output: A single apps/web-app/src/middleware.ts file using the Next.js Edge middleware pattern.
```

---

### PROMPT 1C — Fix CSRF Session Fallback (Task 39)

```
You are working on: apps/api-server/src/modules/auth/csrf.middleware.ts

Read the file carefully. There is a security weakness in lines ~34-39:
  When CSRF validation fails but the user has an active session cookie (accessToken),
  the code auto-issues a new CSRF token and returns a 403 with the new token set in the cookie header.
  This is a CSRF session-assisted fallback that weakens protection.

Fix this by removing the special "hasSession" branch entirely. The response for ANY CSRF validation
failure (missing token, mismatched token) must ALWAYS be a plain 403 with no new CSRF token set:
  return NextResponse.json(
    { error: 'CSRF validation failed', message: 'Missing or invalid CSRF token' },
    { status: 403 }
  );

Keep everything else exactly the same (origin check, internal key bypass, setCsrfToken export function).
Do not change any other file.
```

---

## 🟡 GROUP 2 — High Value (UX & Documentation)

---

### PROMPT 2A — Add error.tsx to Web App Routes (Task 28)

```
You are working on the Next.js 16 web app at apps/web-app/src/app/.

First, read the full directory structure of apps/web-app/src/app/ to find all route segments 
(folders containing page.tsx or layout.tsx).

Then create an error.tsx file for each route segment. Each file must:
1. Be a 'use client' component.
2. Accept props: { error: Error & { digest?: string }; reset: () => void }
3. Display a user-friendly, context-specific message:
   - Exam routes (/exam): "Something went wrong during your exam. Your progress has been saved."
   - Report routes (/reports): "Unable to load your report."  
   - Auth routes (/login, /signup): "Authentication error. Please try again."
   - Dashboard: "Unable to load dashboard."
   - All others: "An unexpected error occurred."
4. Show a "Try Again" button that calls reset().
5. Show a "Return to Dashboard" link (href="/dashboard").
6. In development only (process.env.NODE_ENV === 'development'), render error.message in a <pre> block.
7. Use Tailwind CSS classes consistent with the existing design system (read one existing page for reference).

Also create apps/web-app/src/app/global-error.tsx as the root-level error boundary.
This MUST include its own <html> and <body> tags (it replaces the root layout).
Log the error using console.error (Sentry integration can be wired up later).
```

---

### PROMPT 2B — Add loading.tsx to Web App Routes (Task 30)

```
You are working on: apps/web-app/src/app/

First, read the directory structure to identify all route segments (folders with page.tsx).

Then create a loading.tsx file for each route segment. Each loading file must:
1. Be a server component (no 'use client').
2. Show a skeleton that roughly matches the layout shape of that page.
3. Use Tailwind's animate-pulse on all skeleton elements.
4. Route-specific skeletons:
   - /dashboard: 3-column card grid skeleton (6 cards)
   - /exam/[examId]: Left column (question block) + right sidebar skeleton
   - /reports and /reports/[id]: Card + chart area skeleton
   - /quiz (selection): Multi-step form skeleton
   - Auth pages: Centered form skeleton (2 inputs + button)
   - Generic fallback: Centered spinner using a full-page flex container
5. Keep all components lightweight — no imports, no data fetching, pure static skeleton markup.

Read the actual page.tsx for each route to understand the rough layout before writing the skeleton.
```

---

### PROMPT 2C — Add not-found.tsx and Admin loading/error (Tasks 29, 31, 32)

```
You are working on apps/web-app/ and apps/admin-app/.

PART 1 — not-found.tsx (Task 32):
Create apps/web-app/src/app/not-found.tsx:
  - Server component (no 'use client')
  - "Page Not Found" heading, brief explanation
  - "Go to Dashboard" primary button (href="/dashboard")
  - "Start a Quiz" secondary link (href="/quiz")

Create apps/admin-app/src/app/not-found.tsx:
  - Same pattern but links go to "/admin/dashboard"
  - Admin tone: "This admin page was not found."

PART 2 — Admin error.tsx (Task 29):
Read apps/admin-app/src/app/ directory structure.
Create an error.tsx for every route segment in admin-app following the same pattern as web-app:
  - 'use client', accepts { error, reset }
  - Admin messages: "Dashboard data failed to load", "Question management error", etc.
  - "Retry" button + "Back to Dashboard" link
  - Development error display

Also create apps/admin-app/src/app/global-error.tsx as the root error boundary.

PART 3 — Admin loading.tsx (Task 31):
Create loading.tsx for all remaining admin-app route segments that are currently missing one.
(Only apps/admin-app/src/app/(authenticated)/dashboard/loading.tsx currently exists.)
Use animate-pulse skeleton approach. Admin dashboard skeleton should mimic a sidebar + main content area.
```

---

### PROMPT 2D — Create .env.example Files (Task 44)

```
You are working on the entire Quiz Platform monorepo at the root.

Search ALL source files for process.env references using grep across:
  - packages/db/src/
  - apps/api-server/src/
  - apps/web-app/src/
  - apps/admin-app/src/

Then create the following files:

FILE 1: .env.example (monorepo root)
Group variables by category with comment headers. Include description and example placeholder for each.
Required categories:
  # Database
  DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
  DATABASE_URL_REPLICA=  # Optional: read replica URL
  
  # JWT Authentication
  JWT_SECRET=your-secret-key-minimum-32-characters
  JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters
  ADMIN_JWT_SECRET=your-admin-secret-minimum-32-characters
  
  # Redis (Upstash)
  UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
  UPSTASH_REDIS_REST_TOKEN=your-token-here
  
  # Email (Resend)
  RESEND_API_KEY=re_xxxxxxxxxxxx
  EMAIL_FROM=noreply@yourdomain.com
  
  # Sentry
  SENTRY_DSN=https://xxx@sentry.io/xxx
  SENTRY_AUTH_TOKEN=
  
  # Internal
  INTERNAL_API_KEY=your-internal-api-key-32-chars
  
  # AWS S3 / Vercel Blob
  (discover from source)

FILE 2: apps/web-app/.env.example
  NEXT_PUBLIC_API_URL=http://localhost:3000
  NEXT_PUBLIC_SENTRY_DSN=

FILE 3: apps/admin-app/.env.example
  NEXT_PUBLIC_API_URL=http://localhost:3000
  NEXT_PUBLIC_SENTRY_DSN=

CRITICAL: Use ONLY placeholder values. Never include real secrets.
Add a comment block at the top of each file: "Copy this file to .env.local and fill in your values."
```

---

## 🟡 GROUP 3 — DB Safety (Tasks 35 & 37)

---

### PROMPT 3A — Add Pool Monitoring (Task 35)

```
You are working on: packages/db/src/index.ts

Read the current file. It uses @neondatabase/serverless Pool with primary and replica instances.

Add a getPoolMetrics() exported function that returns:
  {
    primary: {
      totalConnections: number;   // pool.totalCount
      idleConnections: number;    // pool.idleCount
      waitingRequests: number;    // pool.waitingCount
      maxConnections: number;     // the configured max
      utilizationPercent: number; // ((total - idle) / max) * 100
    };
    replica: { ... } | null;  // null if no replica configured
  }

Also add pool event listeners on the primary pool instance:
  pool.on('error', (err) => console.error('[DB Pool Error]', err));
  pool.on('connect', () => { if (process.env.DEBUG_DB) console.log('[DB Pool] New connection created'); });

Add a console.warn when utilizationPercent > 80% in getPoolMetrics().

Export a closePool() async function that calls pool.end() on both primary and replica if they exist.

Do not change the Proxy-based db and dbReplica exports or the existing getDb() logic.
Do not change any other file.
```

---

### PROMPT 3B — Add Query Timeout Utility (Task 37)

```
Create a new file: packages/db/src/utils/query-timeout.ts

Implement the following exports:

1. Timeout presets (exported constants):
   export const QUICK_QUERY_TIMEOUT = 5_000;    // 5s — simple lookups
   export const STANDARD_QUERY_TIMEOUT = 15_000; // 15s — standard CRUD
   export const REPORT_QUERY_TIMEOUT = 30_000;   // 30s — analytics/aggregations
   export const MIGRATION_TIMEOUT = 120_000;      // 120s — migrations

2. Custom error class:
   export class QueryTimeoutError extends Error {
     constructor(queryDescription: string, timeoutMs: number) {
       super(`Query "${queryDescription}" exceeded ${timeoutMs}ms timeout`);
       this.name = 'QueryTimeoutError';
     }
   }

3. Main utility:
   export async function withTimeout<T>(
     queryPromise: Promise<T>,
     timeoutMs: number,
     queryDescription: string
   ): Promise<T>
   
   Implementation: use Promise.race against a setTimeout that rejects with QueryTimeoutError.
   On timeout, log: console.warn(`[DB Timeout] ${queryDescription} exceeded ${timeoutMs}ms`).

Also update packages/db/src/index.ts to re-export from this utility:
  export * from './utils/query-timeout';

Write a brief usage comment at the top of the file:
  // Usage: const result = await withTimeout(db.select()..., STANDARD_QUERY_TIMEOUT, 'fetch exam by id');
```

---

## 🟢 GROUP 4 — CI / DevOps

---

### PROMPT 4A — CI Parallelization & Coverage Artifacts (Tasks 15, 18, 19)

```
You are working on: .github/workflows/quality.yml

Read the current file. It runs all steps sequentially in one job called "quality-gates".

Refactor it into separate parallel jobs as follows:

JOB 1 — "lint" (runs on push/PR):
  - checkout, setup pnpm, install, run: pnpm lint:all
  - timeout-minutes: 10

JOB 2 — "type-check" (runs on push/PR, parallel with lint):
  - checkout, setup pnpm, install, run: pnpm typecheck:all
  - timeout-minutes: 10

JOB 3 — "test" (runs on push/PR, parallel with lint and type-check):
  - checkout, setup pnpm, install
  - run: pnpm --filter @quiz/api-server run test:coverage
  - Upload artifact: name: coverage-api-server, path: apps/api-server/coverage/
  - timeout-minutes: 15

JOB 4 — "build" (depends on: lint, type-check, test — all must pass):
  needs: [lint, type-check, test]
  - checkout, setup pnpm, install, run: pnpm build:all
  - Upload artifact: name: build-outputs, path: apps/*/. next/, retention-days: 3
  - timeout-minutes: 15

JOB 5 — "e2e-smoke" (depends on: build):
  needs: [build]
  - (keep existing e2e-smoke content)

JOB 6 — "ci-success" (depends on ALL jobs):
  needs: [lint, type-check, test, build, e2e-smoke]
  runs-on: ubuntu-latest
  steps:
    - run: echo "All checks passed"

Add to the top of the file:
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true

Keep all environment variables and guard scripts exactly as they are. Deduplicate the pnpm setup steps using a shared setup approach or just repeat them per job.
```

---

### PROMPT 4B — PR Template, CODEOWNERS, Dependabot (Tasks 20 & 21)

```
Create the following files:

FILE 1: .github/pull_request_template.md
## Description
<!-- What changed and why? -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Test
- [ ] Documentation
- [ ] Config / CI

## Checklist
- [ ] Tests added or updated
- [ ] `pnpm typecheck:all` passes locally
- [ ] `pnpm lint:all` passes locally
- [ ] Tested locally

## Screenshots (if UI changes)
<!-- Before / After -->

FILE 2: .github/CODEOWNERS
# Default owner for everything
* @your-github-username

# Database schema — requires careful review  
/packages/db/src/schema/ @your-github-username

# Auth and security — security-sensitive
/apps/api-server/src/modules/auth/ @your-github-username

# Public: Instructions to update these placeholders with real GitHub usernames.

FILE 3: .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: "development"
      next-framework:
        patterns: ["next", "@next/*", "react", "react-dom"]
      typescript:
        patterns: ["typescript", "@types/*", "ts-*"]
      testing:
        patterns: ["vitest", "@vitest/*", "@testing-library/*", "playwright", "@playwright/*"]
    labels: ["dependencies", "automated"]
    commit-message:
      prefix: "chore(deps):"
    ignore:
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "next"
        update-types: ["version-update:semver-major"]
      - dependency-name: "typescript"
        update-types: ["version-update:semver-major"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels: ["ci"]
```

---

### PROMPT 4C — Security Scanning Workflow (Task 22)

```
Create a new file: .github/workflows/quality.yml

name: Security

on:
  push:
    branches: [main]
  pull_request:

jobs:
  audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Run pnpm audit
        run: pnpm audit --audit-level=high
        # Fails CI on high/critical vulnerabilities

  secret-scan:
    name: Secret Scanning (TruffleHog)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: TruffleHog Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified

Add a comment at the bottom:
# Future: Add Snyk or Semgrep for SAST
# Future: Add license-checker for OSS compliance
```

---

## ✅ Running Order Summary

```
Run in this exact order:

1. PROMPT 1A  — Fix coverage thresholds (2 min)
2. PROMPT 1B  — Add web-app middleware (10 min)
3. PROMPT 1C  — Fix CSRF session fallback (5 min)
4. PROMPT 3B  — Create query timeout utility (10 min)
5. PROMPT 3A  — Add pool monitoring (10 min)
6. PROMPT 2D  — Create .env.example files (10 min)
7. PROMPT 2A  — Web App error.tsx (20 min)
8. PROMPT 2B  — Web App loading.tsx (20 min)
9. PROMPT 2C  — not-found + Admin error/loading (20 min)
10. PROMPT 4B  — PR template, CODEOWNERS, Dependabot (5 min)
11. PROMPT 4A  — CI parallelization (10 min)
12. PROMPT 4C  — Security scanning workflow (5 min)

After all done → run: pnpm lint:all && pnpm typecheck:all && pnpm test:all
Phase 1 will be 100% complete ✅
```
