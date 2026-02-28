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
