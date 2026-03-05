# AI Implementation Prompt: Scaling Phase 1 (Foundations)

**Objective**: Optimize the existing Next.js + Neon + Node.js stack to handle up to 50,000 concurrent users by implementing connection pooling and advanced caching.

---

## CONTEXT
The project is a TypeScript monorepo using Next.js 15+ (App Router), Neon Postgres (Drizzle ORM), and Vercel. We need to stabilize connections and reduce DB load.

## INSTRUCTIONS
Please execute the following technical tasks:

1. **Database Pooling**: 
   - Check `drizzle.config.ts` and the database initialization logic.
   - Refactor the database connection to support a pooled connection string (using the `-pooler` suffix for production).
   - Ensure the `max` connection limit is set appropriately for a serverless environment.

2. **Metadata Caching**:
   - Identify data-fetching functions for "Topics", "Subjects", and "Domains".
   - Wrap these functions using Next.js `unstable_cache` or the latest `use cache` directive.
   - Set a revalidation period (e.g., 3600 seconds) to ensure metadata stays fresh but doesn't hit the DB on every request.

3. **Edge Middleware Optimization**:
   - Review `middleware.ts`. 
   - Ensure that the JWT verification logic uses a lightweight Edge-compatible library like `jose`.
   - Implement an "Early Exit" strategy where unauthenticated requests to `/api/` are rejected before hitting the serverless function.

4. **Zod Pre-validation**:
   - Audit the `Submit Exam` request schema.
   - Ensure it is optimized for speed (removing heavy transformations where possible) to keep API response times sub-50ms.

## OUTPUT
Please provide a summary of files modified and confirm that the `DATABASE_URL` format has been updated in the environment configuration documentation.

---

## PHASE 1 CARRY-FORWARD (from Architecture Phase 1 Audit)

> These items were deferred from Phase 1 as non-blocking. Execute them when working on scaling foundations.

5. **Server-Side Statement Timeout**:
   - Add `statement_timeout: 30000` to the Pool config in `packages/db/src/index.ts`.
   - This complements the existing application-level `withTimeout()` utility in `packages/db/src/utils/query-timeout.ts`.

6. **Apply Query Timeouts to Engine Queries**:
   - Import `withTimeout` + presets from `packages/db/src/utils/query-timeout.ts`.
   - Wrap `ScoringEngine.calculateExamResults` queries with `REPORT_QUERY_TIMEOUT` (30s).
   - Wrap `ExamEngine` start/submit queries with `STANDARD_QUERY_TIMEOUT` (15s).

7. **Additional Database Indexes**:
   - `users.created_at` — user registration sorting
   - `audit_logs.action` — action type filtering
   - `audit_logs.created_at` — time-range audit queries
   - `login_attempts.user_id` — rate limiting lookups
   - Run `pnpm drizzle-kit generate` after adding.
