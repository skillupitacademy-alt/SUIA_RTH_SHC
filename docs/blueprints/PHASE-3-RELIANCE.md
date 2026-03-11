# PHASE 3: SCALE PREPARATION (Months 4-6)

> **165 Total Tasks | Phase 3: 36 Tasks (#99-134) | Priority: SCALE**
> Architecture changes needed to handle 100K+ concurrent users.

---

## 3.1 — NETWORK & API OPTIMIZATION (Tasks 99-105)

---

### Task 99: Add Cache-Control Headers to Cacheable Endpoints

**AI Prompt:**

> Every API route in my Quiz Platform at `apps/api-server/src/app/api/` uses `export const dynamic = 'force-dynamic'`, meaning zero HTTP caching. For endpoints that serve rarely-changing data, this wastes bandwidth and increases server load.
>
> First, read ALL route files in `apps/api-server/src/app/api/` and categorize each endpoint:
>
> - **Highly cacheable** (data changes rarely — hours/days): domain lists, subject lists, topic lists, subtopic lists, skill lists, public configuration
> - **Moderately cacheable** (data changes occasionally — minutes): exam blueprints, question counts per topic, leaderboards
> - **Not cacheable** (user-specific or real-time): auth endpoints, exam submission, user profile, active exam data, scoring results
>
> Then implement caching headers:
>
> 1. **For highly cacheable endpoints:**
>    - Remove `export const dynamic = 'force-dynamic'` (or override per route)
>    - Add response header: `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600`
>    - This means: browser caches for 1 hour, CDN caches for 24 hours, CDN serves stale for 1 hour while revalidating
>    - Apply to: `/api/public/domains`, `/api/public/subjects`, `/api/public/topics`, `/api/public/config` (or whatever the public data routes are)
>
> 2. **For moderately cacheable endpoints:**
>    - Add header: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=60`
>    - 1 minute browser, 5 minute CDN, 1 minute stale-while-revalidate
>    - Apply to: blueprint lists, question metadata
>
> 3. **For user-specific but cacheable endpoints:**
>    - Add header: `Cache-Control: private, max-age=60`
>    - Only cached in user's browser, not CDN (contains user-specific data)
>    - Apply to: user profile, user exam history
>
> 4. **For non-cacheable endpoints (keep as-is):**
>    - `Cache-Control: no-cache, no-store, must-revalidate`
>    - Apply to: auth routes, exam submission, scoring
>
> 5. **Create a helper utility** at `apps/api-server/src/lib/cache-headers.ts`:
>    - `withCacheHeaders(response, policy: 'static' | 'moderate' | 'private' | 'none')` — Adds appropriate cache headers
>    - Centralizes cache policy so changes propagate to all routes
>
> 6. **Add Vary header** where needed:
>    - `Vary: Authorization` for endpoints that return different data based on auth state
>    - `Vary: Accept-Encoding` for compressed responses
>
> 7. **Document the caching strategy** with a comment block at the top of the helper utility explaining each policy tier.

---

### Task 100: Add API Versioning

**AI Prompt:**

> The Quiz Platform has 73+ API endpoints with no versioning strategy. Breaking changes have no migration path — updating an API response format would break all existing clients simultaneously.
>
> Implement API versioning:
>
> 1. **Choose versioning strategy: URL path prefix (`/api/v1/`)**
>    - This is the most explicit and widely used approach (used by Google, Twitter, Stripe)
>    - Easy to understand, easy to route, easy to deprecate
>
> 2. **Restructure API routes:**
>    - Current: `apps/api-server/src/app/api/quiz/start/route.ts` → `/api/quiz/start`
>    - New: `apps/api-server/src/app/api/v1/quiz/start/route.ts` → `/api/v1/quiz/start`
>
>    However, restructuring 73+ route files is a massive refactor. Instead, use Next.js rewrites:
>
> 3. **Implement versioning via Next.js middleware or rewrites:**
>    - In `apps/api-server/next.config.ts`, add rewrites:
>      - `/api/v1/*` → `/api/*` (v1 maps to current implementation)
>    - This means `/api/v1/quiz/start` and `/api/quiz/start` both work
>    - Future v2 routes will be actual new files at `/api/v2/*`
>
> 4. **Create version negotiation middleware** at `apps/api-server/src/middleware/api-version.middleware.ts`:
>    - Extract version from URL path (`/api/v1/...`) or `Accept-Version` header
>    - If no version specified, default to `v1`
>    - Add `X-API-Version: v1` header to all responses
>    - Log usage of unversioned endpoints (to track migration)
>
> 5. **Create deprecation mechanism:**
>    - When v2 is released, v1 endpoints return header: `Deprecation: true` and `Sunset: <date>`
>    - Log deprecated endpoint usage for monitoring migration progress
>
> 6. **Update `packages/api-client/src/core/fetch-client.ts`:**
>    - Add `apiVersion` configuration option (default: `'v1'`)
>    - Prepend version prefix to all API URLs: `${baseUrl}/api/v${version}/${path}`
>
> 7. **Document the versioning policy** in `docs/api/VERSIONING.md`:
>    - When to create a new version (breaking changes only)
>    - Deprecation timeline (minimum 6 months notice)
>    - What constitutes a breaking change vs non-breaking change
>    - How clients should migrate

---

### Task 101: Add Request Timeout to FetchClient

**AI Prompt:**

> The `FetchClient` at `packages/api-client/src/core/fetch-client.ts` has NO timeout configuration. API requests can hang indefinitely if the server is slow or unresponsive, causing the UI to freeze.
>
> Read the complete `fetch-client.ts` file to understand the current request implementation.
>
> Then add timeout support:
>
> 1. **Add configurable timeout to FetchClient:**
>    - Default timeout: 30 seconds for standard requests
>    - Per-request timeout override capability
>    - Use `AbortController` + `setTimeout` pattern:
>      ```
>      const controller = new AbortController()
>      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
>      const response = await fetch(url, { ...options, signal: controller.signal })
>      clearTimeout(timeoutId)
>      ```
>
> 2. **Categorized timeout presets:**
>    - `QUICK_TIMEOUT = 5000` (5s) — Health checks, simple lookups
>    - `STANDARD_TIMEOUT = 15000` (15s) — Normal CRUD operations
>    - `LONG_TIMEOUT = 30000` (30s) — Complex queries, report generation
>    - `UPLOAD_TIMEOUT = 60000` (60s) — File uploads, bulk operations
>
> 3. **Timeout error handling:**
>    - When timeout fires, throw a specific `TimeoutError` (not generic `AbortError`)
>    - `TimeoutError` includes: URL, method, timeout duration, a user-friendly message
>    - Client components can catch `TimeoutError` specifically and show "Request timed out, please try again"
>
> 4. **Apply timeouts to existing API modules:**
>    - Read `packages/api-client/src/modules/` — all client modules
>    - Assign appropriate timeout presets:
>      - Auth operations → `STANDARD_TIMEOUT`
>      - Quiz start → `LONG_TIMEOUT`
>      - Answer submission → `QUICK_TIMEOUT`
>      - Admin analytics → `LONG_TIMEOUT`
>      - Bulk upload → `UPLOAD_TIMEOUT`
>      - Domain/subject fetching → `STANDARD_TIMEOUT`
>
> 5. **Global timeout configuration:**
>    - Allow setting default timeout via constructor: `new FetchClient({ timeout: 15000 })`
>    - Allow per-request override: `client.get('/endpoint', { timeout: 5000 })`
>
> 6. **Write tests**: Timeout fires correctly, AbortController cleanup, per-request override works

---

### Task 102: Add Retry with Exponential Backoff to FetchClient

**AI Prompt:**

> The `FetchClient` at `packages/api-client/src/core/fetch-client.ts` has no retry logic. A single network hiccup or transient server error results in an immediate failure shown to the user.
>
> Read the current `fetch-client.ts` to understand the request flow.
>
> Then add retry with exponential backoff:
>
> 1. **Add retry configuration to FetchClient:**
>
>    - `maxRetries: 3` — Maximum retry attempts
>    - `retryDelay: 1000` — Base delay in milliseconds
>    - `retryBackoff: 2` — Exponential multiplier (1s, 2s, 4s)
>    - `retryJitter: true` — Add random jitter to prevent thundering herd
>    - `retryableStatuses: [408, 429, 500, 502, 503, 504]` — HTTP status codes to retry
>    - `retryableMethods: ['GET', 'HEAD', 'OPTIONS']` — Only retry idempotent methods by default
>
> 2. **Retry logic implementation:**
>    - On retryable failure:
>      - Wait: `delay * backoff^attempt + random(0, delay/2)` (exponential + jitter)
>      - Retry the request with the same parameters
>      - If all retries exhausted, throw the last error
>    - On `429 Too Many Requests`:
>      - Check for `Retry-After` header
>      - If present, wait that many seconds before retrying
>      - If absent, use exponential backoff
>    - On non-retryable failure (400, 401, 403, 404, 422):
>      - Do NOT retry — these are client errors, retrying won't help
>      - Throw immediately
>
> 3. **POST/PUT/PATCH/DELETE retry behavior:**
>    - By default, do NOT retry mutating requests (could cause duplicates)
>    - Allow opt-in per request: `client.post('/endpoint', data, { retry: true })`
>    - Only safe if the endpoint is idempotent (has idempotency key)
>
> 4. **Retry event logging:**
>    - Log each retry attempt: `{ url, method, attempt, delay, reason }`
>    - Log final failure after all retries exhausted
>
> 5. **Global and per-request configuration:**
>    - Global: `new FetchClient({ retry: { maxRetries: 3, retryDelay: 1000 } })`
>    - Per-request: `client.get('/endpoint', { retry: { maxRetries: 5 } })`
>    - Disable: `client.get('/endpoint', { retry: false })`
>
> 6. **Integration with timeout (Task 101):**
>    - Each retry attempt has its own timeout
>    - Total time = sum of all attempt timeouts + sum of all delays
>    - Add a `maxTotalTime` option to cap total retry duration
>
> 7. **Write tests**: Retry on 500, no retry on 400, exponential delay timing, Retry-After header, max retries exhausted

---

### Task 103: Enable Response Compression

**AI Prompt:**

> The Quiz Platform's Next.js apps don't have explicit compression configuration. API responses are sent uncompressed, wasting bandwidth especially for large JSON payloads (admin analytics, question lists, exam data).
>
> Read the `next.config.ts` (or `next.config.js`) files for all 3 apps:
> - `apps/api-server/next.config.ts`
> - `apps/web-app/next.config.ts`
> - `apps/admin-app/next.config.ts`
>
> Then enable compression:
>
> 1. **Next.js built-in compression:**
>    - Add `compress: true` to each app's `next.config.ts`
>    - Next.js uses gzip compression by default when this is enabled
>    - Note: On Vercel, compression is handled at the edge — `compress` may be redundant but doesn't hurt
>
> 2. **Verify Vercel compression:**
>    - Vercel automatically applies Brotli and gzip compression at the edge
>    - Document that compression is handled by Vercel in production
>    - The `compress: true` setting helps in local development and non-Vercel deployments
>
> 3. **Optimize large API payloads:**
>    - Identify the largest API responses by reading route handlers:
>      - Admin user list (could be thousands of users)
>      - Admin question list (could be thousands of questions)
>      - Analytics/metrics endpoints (large aggregated data)
>      - Exam data with all questions
>    - For each large endpoint, consider:
>      - Pagination to limit payload size (already addressed in Task 98)
>      - Field selection to return only needed fields (Task 105)
>      - Streaming for very large responses (document as future optimization)
>
> 4. **Add response size logging:**
>    - In the metrics middleware (Task 78), track response body size
>    - Log warning for responses exceeding 1MB
>    - This helps identify endpoints that need pagination or field selection
>
> 5. **Client-side Accept-Encoding:**
>    - Verify that `FetchClient` sends `Accept-Encoding: gzip, deflate, br` header
>    - Modern browsers do this automatically, but verify for any server-to-server calls

---

### Task 104: Add ETags for Conditional Requests

**AI Prompt:**

> Every API request returns the full response payload regardless of whether the data has changed since the last request. I need to add ETag support for conditional requests to save bandwidth.
>
> Implement ETag support:
>
> 1. **Create ETag middleware** at `apps/api-server/src/middleware/etag.middleware.ts`:
>
>    - After a response is generated, compute a hash of the response body
>    - Use a fast hash algorithm: `crypto.createHash('md5').update(body).digest('hex')` (MD5 is fine for ETags — not for security)
>    - Set `ETag` response header with the hash value: `ETag: "abc123def456"`
>    - Set `Last-Modified` header if the data has a timestamp field
>
> 2. **Handle conditional requests:**
>    - Check incoming `If-None-Match` header against the computed ETag
>    - If they match (data hasn't changed): return `304 Not Modified` with no body
>    - This saves bandwidth — client uses its cached copy
>    - Check incoming `If-Modified-Since` header against `Last-Modified`
>    - If not modified: return `304 Not Modified`
>
> 3. **Apply ETags selectively:**
>    - **Enable for**: GET endpoints that return data lists (domains, subjects, questions, users, blueprints)
>    - **Disable for**: Auth endpoints (tokens change every time), exam submission (always new data), POST/PUT/DELETE
>    - Create a configuration list of ETag-enabled routes
>
> 4. **Weak vs Strong ETags:**
>    - Use weak ETags (`W/"abc123"`) for responses that may have minor formatting differences but semantically identical content
>    - Use strong ETags (`"abc123"`) for byte-for-byte identical responses
>    - For JSON APIs, weak ETags are appropriate
>
> 5. **Integration with Cache-Control (Task 99):**
>    - ETags work alongside Cache-Control headers
>    - `Cache-Control` controls HOW LONG to cache; ETags control WHEN to revalidate
>    - Together: browser caches for `max-age` seconds, then revalidates with ETag
>
> 6. **Update FetchClient** to:
>    - Store ETags from responses in memory (keyed by URL)
>    - Send `If-None-Match` header on subsequent requests to the same URL
>    - Handle `304` responses: return cached data instead of parsing empty body
>
> 7. **Write tests**: ETag generation, 304 response on match, full response on mismatch, weak ETag format

---

### Task 105: Add Field Selection for Admin API

**AI Prompt:**

> Admin API endpoints always return full database objects with all fields, even when the admin dashboard only needs a few fields for a list view. This wastes bandwidth and processing time.
>
> Implement field selection (sparse fieldsets):
>
> 1. **Create field selection middleware** at `apps/api-server/src/lib/field-selector.ts`:
>
>    - Parse `?fields=id,name,email,createdAt` query parameter
>    - Return a function that filters response objects to only include requested fields
>    - Support nested fields: `?fields=id,name,profile.avatar`
>    - If no `fields` parameter, return full object (backward compatible)
>
> 2. **Create field allowlist per resource:**
>    - `USER_ALLOWED_FIELDS = ['id', 'email', 'name', 'isVerified', 'createdAt', 'lastLoginAt', 'roles', 'examCount', 'status']`
>    - `QUESTION_ALLOWED_FIELDS = ['id', 'text', 'type', 'difficulty', 'topicId', 'createdAt', 'usageCount', 'skills']`
>    - `EXAM_ALLOWED_FIELDS = ['id', 'userId', 'status', 'score', 'startedAt', 'completedAt', 'questionCount']`
>    - `BLUEPRINT_ALLOWED_FIELDS = ['id', 'name', 'description', 'domainId', 'questionCount', 'timeLimit', 'createdAt']`
>    - Prevent requesting sensitive fields: `passwordHash`, `tokens`, `secrets` are NEVER selectable
>
> 3. **Apply to admin list endpoints:**
>    - Admin user list: Default fields for list view = `id,name,email,isVerified,createdAt,roles`
>    - Admin question list: Default fields for list view = `id,text,type,difficulty,topicId,createdAt`
>    - Full object returned only for detail view (no `fields` parameter)
>
> 4. **Optimize database queries:**
>    - When `fields` is specified, only SELECT those columns from the database
>    - Don't fetch all columns and then filter — fetch only what's needed
>    - Create a `buildSelectClause(fields, allowedFields)` utility that generates the Drizzle select object
>
> 5. **Update AdminClient** in `packages/api-client/`:
>    - Add `fields` option to list methods: `adminClient.getUsers({ fields: ['id', 'name', 'email'] })`
>    - Type safety: return type narrows based on requested fields (advanced TypeScript — `Pick<User, 'id' | 'name' | 'email'>`)
>
> 6. **Document the field selection API** with examples in API documentation comments
>
> 7. **Write tests**: Field filtering, nested fields, disallowed fields rejected, no fields parameter returns full object, database optimization verification

---

## 3.2 — ASYNC PROCESSING & DURABLE WORKFLOWS (Tasks 106-111)

> [!IMPORTANT]
> **Architecture Pivot**: BullMQ was originally planned for background processing. However, because this project is hosted on **Vercel (Serverless)**, BullMQ's requirement for persistent workers is not compatible. We have pivoted to **Upstash Workflows**, which provide durable, serverless-native execution for long-running tasks.

---

### Task 106: Install and Configure BullMQ Message Queue

**AI Prompt:**

> The Quiz Platform runs all processing inline — scoring blocks the HTTP response, email sending adds latency, and there's no mechanism for background jobs. I need to add a message queue.
>
> Since the project already uses Upstash Redis, BullMQ (which uses Redis as its backing store) is the natural choice.
>
> 1. **Install `bullmq`** in `apps/api-server`
>
> 2. **Create `apps/api-server/src/lib/queue/queue.config.ts`:**
>    - Configure BullMQ connection using the existing `REDIS_URL` (Upstash)
>    - Connection settings:
>      - `maxRetriesPerRequest: null` (required by BullMQ for Upstash compatibility)
>      - `enableReadyCheck: false` (Upstash compatibility)
>      - `tls: {}` if using Upstash (requires TLS)
>    - Export a shared Redis connection for all queues
>
> 3. **Create queue definitions** in `apps/api-server/src/lib/queue/queues.ts`:
>
>    - `scoringQueue` — For async exam scoring
>      - Name: `exam-scoring`
>      - Default job options: `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 500 }`
>
>    - `emailQueue` — For async email sending
>      - Name: `email-sending`
>      - Default job options: `{ attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 50 }`
>
>    - `cleanupQueue` — For scheduled maintenance tasks
>      - Name: `maintenance-cleanup`
>      - Default job options: `{ attempts: 1, removeOnComplete: 10 }`
>
>    - `notificationQueue` — For user notifications
>      - Name: `notifications`
>      - Default job options: `{ attempts: 3, backoff: { type: 'exponential', delay: 3000 } }`
>
> 4. **Create worker setup** in `apps/api-server/src/lib/queue/workers.ts`:
>    - Export a `startWorkers()` function that initializes all queue workers
>    - Each worker processes jobs from its queue
>    - Workers should handle graceful shutdown (stop accepting new jobs, finish current job)
>    - Note: In Vercel serverless, workers run within the request lifecycle. Document alternative for dedicated worker deployment.
>
> 5. **Create job type definitions** in `apps/api-server/src/lib/queue/job-types.ts`:
>    - `ScoringJob { examId: string, userId: string, triggeredAt: string }`
>    - `EmailJob { to: string, subject: string, template: string, data: Record<string, unknown> }`
>    - `CleanupJob { task: 'tokens' | 'sessions' | 'logs' | 'all' }`
>    - `NotificationJob { userId: string, type: string, message: string, data?: unknown }`
>
> 6. **Add queue monitoring endpoint** at `/api/admin/queues`:
>    - Admin-authenticated
>    - Returns: queue names, job counts (waiting, active, completed, failed), recent failures
>
> 7. **Add environment variable**: `QUEUE_ENABLED=true` — Allow disabling queues in development (fall back to synchronous processing)

---

### Task 107: Move Scoring to Async Queue Worker

**AI Prompt:**

> The `ScoringEngine.calculateExamResults()` currently runs inline when an exam is completed — the HTTP response waits for scoring to finish. For large exams this can take seconds and may timeout on serverless platforms. I need to move scoring to the async queue.
>
> Read the current scoring trigger in:
> - `apps/api-server/src/modules/exam-engine/exam.engine.ts` — Where `completeExam` calls `ScoringEngine`
> - `apps/api-server/src/modules/scoring-engine/scoring.engine.ts` — The full scoring logic
>
> Then implement async scoring:
>
> 1. **Create scoring worker** at `apps/api-server/src/lib/queue/workers/scoring.worker.ts`:
>
>    - Processes jobs from the `scoringQueue`
>    - Job handler:
>      - Receives `{ examId, userId, triggeredAt }`
>      - Calls `ScoringEngine.calculateExamResults(examId)`
>      - On success: updates exam status to `completed`, emits `ScoringCompleted` event (Task 62)
>      - On failure: updates exam status to `failed`, logs error, emits `ScoringFailed` event
>      - Adds job progress updates: 0% → fetching data, 25% → evaluating answers, 50% → calculating dimensions, 75% → persisting results, 100% → complete
>
> 2. **Update ExamEngine.completeExam:**
>    - Instead of calling `ScoringEngine` directly, add a job to the `scoringQueue`:
>      ```
>      await scoringQueue.add('score-exam', { examId, userId, triggeredAt: new Date().toISOString() })
>      ```
>    - Return immediately with response: `{ examId, status: 'processing', message: 'Your exam is being scored. Results will be available shortly.' }`
>    - The exam status is `processing` until the worker completes
>
> 3. **Handle the "polling for results" pattern:**
>    - Client polls `/api/quiz/results/{examId}` endpoint
>    - If exam status is `processing`: return `202 Accepted` with `Retry-After: 3` header
>    - If exam status is `completed`: return `200 OK` with full results
>    - If exam status is `failed`: return `500` with error message and option to retry
>    - Read the existing report page (`apps/web-app/src/app/reports/`) to see if polling is already implemented
>
> 4. **Fallback for queue unavailable:**
>    - If `QUEUE_ENABLED=false` or queue connection fails:
>      - Fall back to synchronous scoring (current behavior)
>      - Log warning: "Queue unavailable, falling back to synchronous scoring"
>    - This ensures the app still works in development without Redis
>
> 5. **Dead Letter Queue (DLQ):**
>    - After 3 failed attempts, job moves to DLQ
>    - Create a DLQ handler that:
>      - Sets exam status to `failed`
>      - Sends alert to admin (email or log)
>      - Stores failure details for debugging
>
> 6. **Write tests**:
>    - Job is enqueued on exam completion
>    - Worker processes scoring correctly
>    - Retry on transient failure
>    - DLQ handling after max retries
>    - Fallback to synchronous when queue unavailable

---

### Task 108: Add Dead Letter Queue for Failed Jobs

**AI Prompt:**

> When async jobs fail after all retry attempts, they need a Dead Letter Queue (DLQ) for investigation and recovery. Without a DLQ, failed jobs are silently lost.
>
> Read the BullMQ queue setup from Task 106 and the scoring worker from Task 107.
>
> Then implement DLQ handling:
>
> 1. **Create DLQ configuration** in `apps/api-server/src/lib/queue/dlq.ts`:
>
>    - Define a `deadLetterQueue` BullMQ queue named `dead-letter`
>    - Configure: `removeOnComplete: false` (keep all DLQ entries for investigation)
>
> 2. **DLQ entry structure:**
>    ```
>    {
>      originalQueue: 'exam-scoring',
>      originalJobId: 'job-123',
>      originalJobData: { examId: '...', userId: '...' },
>      failureReason: 'Database connection timeout',
>      failureStack: '...',
>      attemptsMade: 3,
>      firstAttemptAt: '2024-01-15T10:00:00Z',
>      lastAttemptAt: '2024-01-15T10:05:00Z',
>      movedToDlqAt: '2024-01-15T10:05:00Z'
>    }
>    ```
>
> 3. **BullMQ failed event handler** for each queue:
>    - Listen to `failed` event on each worker
>    - When `attemptsMade >= maxAttempts` (final failure):
>      - Add the job data to the `deadLetterQueue` with full failure context
>      - Execute queue-specific failure handling:
>        - Scoring queue: Set exam status to `'failed'`, log error
>        - Email queue: Log the unsent email for manual retry
>        - Notification queue: Log the undelivered notification
>
> 4. **DLQ management API** at `/api/admin/queues/dlq`:
>    - `GET /api/admin/queues/dlq` — List all DLQ entries with pagination
>    - `POST /api/admin/queues/dlq/{jobId}/retry` — Move a DLQ entry back to its original queue for retry
>    - `DELETE /api/admin/queues/dlq/{jobId}` — Remove a DLQ entry (after manual resolution)
>    - `POST /api/admin/queues/dlq/retry-all` — Retry all DLQ entries (use with caution)
>
> 5. **DLQ alerting:**
>    - When a job enters the DLQ, log at `error` level with structured data
>    - If Sentry is configured (Task 25), report DLQ entries as Sentry events with `level: 'warning'`
>    - Future: Slack/email webhook notification (document as enhancement)
>
> 6. **DLQ dashboard component** for admin app:
>    - Show DLQ count in admin dashboard
>    - Link to DLQ management page
>    - Show recent failures with retry buttons

---

### Task 109: Move Email Sending to Async Queue

**AI Prompt:**

> Email sending in the Quiz Platform currently happens inline — the HTTP response waits for the email API call to complete. If the email provider (Resend) is slow or down, it adds latency to user-facing requests or causes failures.
>
> Read the email service at `apps/api-server/src/modules/email/email.service.ts` and find all places where emails are sent.
>
> Then move email sending to the async queue:
>
> 1. **Create email worker** at `apps/api-server/src/lib/queue/workers/email.worker.ts`:
>
>    - Processes jobs from the `emailQueue` (defined in Task 106)
>    - Job handler:
>      - Receives `{ to, subject, template, data }`
>      - Calls `EmailService.send(to, subject, template, data)`
>      - On success: log sent email summary
>      - On failure: retry (up to 5 attempts with exponential backoff)
>      - On permanent failure (invalid email, blocked domain): move to DLQ, don't retry
>
> 2. **Update email sending locations:**
>    - Search for all calls to `EmailService.send()` or similar across the codebase
>    - Replace direct calls with queue enqueue:
>      - `await emailQueue.add('send-email', { to: user.email, subject: '...', template: 'welcome', data: { name: user.name } })`
>    - Common email types:
>      - Welcome email (signup)
>      - Email verification
>      - Password reset
>      - Exam score notification
>      - Account locked notification
>
> 3. **Email template system:**
>    - Create `apps/api-server/src/lib/email-templates/` directory
>    - Define templates as functions that return `{ subject, html, text }`:
>      - `welcome.template.ts` — Welcome email
>      - `verification.template.ts` — Email verification with link
>      - `password-reset.template.ts` — Password reset with link
>      - `score-notification.template.ts` — Exam score summary
>    - The worker resolves the template by name and renders it with the provided data
>
> 4. **Priority levels:**
>    - High priority (processed first): Password reset, email verification
>    - Normal priority: Score notifications, welcome emails
>    - Use BullMQ priority: `emailQueue.add('send-email', data, { priority: 1 })` for high priority
>
> 5. **Rate limiting:**
>    - Resend has API rate limits
>    - Configure BullMQ rate limiter: `{ max: 10, duration: 1000 }` (10 emails per second)
>    - This prevents hitting Resend's rate limits during bulk operations
>
> 6. **Fallback for queue unavailable:**
>    - If queue is down, send email synchronously (current behavior)
>    - Log warning about queue unavailability

---

### Task 110: Add Job Monitoring Dashboard

**AI Prompt:**

> I need visibility into the async job processing system — how many jobs are queued, processing, completed, and failed. Without monitoring, queue problems go undetected.
>
> 1. **Option A: Bull Board (Recommended for quick setup)**
>
>    Install `@bull-board/api` and `@bull-board/express` (or `@bull-board/nextjs` if available):
>    - Create a Bull Board instance that monitors all queues: `scoringQueue`, `emailQueue`, `cleanupQueue`, `notificationQueue`, `deadLetterQueue`
>    - Mount at `/api/admin/bull-board` with admin authentication
>    - Bull Board provides a web UI showing:
>      - Queue health (connected/disconnected)
>      - Job counts per status (waiting, active, completed, failed, delayed)
>      - Job details (data, timestamps, attempts, errors)
>      - Ability to retry/remove individual jobs
>      - Real-time updates
>
> 2. **Option B: Custom monitoring endpoint**
>
>    If Bull Board is too heavy or doesn't work with Next.js App Router, create custom endpoints:
>
>    `GET /api/admin/queues/status`:
>    ```
>    {
>      queues: [
>        {
>          name: 'exam-scoring',
>          waiting: 5,
>          active: 2,
>          completed: 1250,
>          failed: 3,
>          delayed: 0,
>          paused: false,
>          latestJobDuration: 2340,
>          avgJobDuration: 1560
>        },
>        ...
>      ],
>      dlq: { total: 3, oldest: '2024-01-15T10:00:00Z' },
>      redis: { connected: true, memory: '45MB', uptime: '72h' }
>    }
>    ```
>
> 3. **Admin dashboard integration:**
>    - Create `apps/admin-app/src/components/dashboard/QueueMonitorBoard.tsx`
>    - Display queue health cards with color-coded status
>    - Show failed job count prominently (red badge if > 0)
>    - Link to Bull Board UI or DLQ management page
>    - Auto-refresh every 30 seconds
>
> 4. **Alerting on queue issues:**
>    - If `waiting` count exceeds 100: log warning "Queue backlog building"
>    - If `failed` count increases: log error with job details
>    - If Redis is disconnected: log fatal
>    - These integrate with the structured logging from Phase 2

---

### Task 111: Implement Saga Pattern for Exam Lifecycle

**AI Prompt:**

> The exam lifecycle spans multiple steps (start → answer → complete → score → report → notify) across multiple services. Currently, if scoring fails, there's no compensating action — the exam is stuck in `processing` forever. I need the Saga Pattern for distributed workflow management.
>
> Read the current exam lifecycle across these files:
> - `apps/api-server/src/modules/exam-engine/exam.engine.ts` — Start, submit, complete
> - `apps/api-server/src/modules/scoring-engine/scoring.engine.ts` — Score calculation
> - `apps/api-server/src/modules/report-engine/report.engine.ts` — Report generation
>
> Then implement the Saga Pattern:
>
> 1. **Create `apps/api-server/src/lib/saga/exam-completion.saga.ts`:**
>
>    Define the saga steps for exam completion:
>
>    - **Step 1: Mark exam as processing** (already done by ExamEngine)
>      - Compensating action: Mark exam as `started` (rollback to previous state)
>
>    - **Step 2: Calculate scores** (ScoringEngine)
>      - Compensating action: Delete any partial scoring results
>
>    - **Step 3: Persist results** (Store in resultsByDimension table)
>      - Compensating action: Delete persisted results
>
>    - **Step 4: Mark exam as completed**
>      - Compensating action: Mark exam as `processing` (rollback)
>
>    - **Step 5: Generate report** (ReportEngine)
>      - Compensating action: Delete generated report data
>
>    - **Step 6: Send notification** (Email to student)
>      - Compensating action: None needed (email is fire-and-forget)
>
> 2. **Create Saga orchestrator** at `apps/api-server/src/lib/saga/saga-orchestrator.ts`:
>
>    - `SagaOrchestrator` class:
>      - `addStep(name, execute, compensate)` — Register a saga step
>      - `execute(): Promise<SagaResult>` — Run all steps in order
>      - If any step fails:
>        - Execute compensating actions for all previously completed steps (in reverse order)
>        - Log the saga failure with all step results
>        - Return `{ success: false, failedStep, error, compensated: true/false }`
>
> 3. **Integrate with queue workers (Task 107):**
>    - The scoring worker uses the saga orchestrator instead of calling ScoringEngine directly
>    - The saga handles the full completion flow: score → persist → complete → report → notify
>
> 4. **Saga persistence:**
>    - Create a `saga_executions` table or use Redis to track saga state:
>      - `sagaId`, `examId`, `currentStep`, `status`, `stepResults[]`, `startedAt`, `completedAt`
>    - This allows recovering from crashes: if the server restarts mid-saga, it can resume or compensate
>
> 5. **Admin visibility:**
>    - Add saga status to admin exam detail view
>    - Show which step the saga is on, any failures, and compensation results
>
> 6. **Write tests**:
>    - Happy path: all steps succeed
>    - Step 2 fails: verify compensation of step 1
>    - Step 4 fails: verify compensation of steps 3, 2, 1
>    - Compensation itself fails: log and alert (manual intervention needed)

---

## 3.3 — DATABASE SHARDING & PARTITIONING (Tasks 112-121)

---

### Task 112: Implement CQRS Read/Write Separation

**AI Prompt:**

> Analytics reads and exam writes compete on the same primary database. I need to implement CQRS (Command Query Responsibility Segregation) to separate read and write paths.
>
> Read the current database usage patterns to understand what queries are reads vs writes:
> - Read the admin dashboard service files — these are heavy reads (aggregations, counts, joins)
> - Read the exam engine — these are heavy writes (inserts, updates)
>
> Then implement CQRS:
>
> 1. **Create `apps/api-server/src/lib/cqrs/command-bus.ts`:**
>    - Commands represent write intentions: `CreateExamCommand`, `SubmitAnswerCommand`, `CompleteExamCommand`, `CreateUserCommand`
>    - `CommandBus.dispatch(command)` routes to the appropriate handler
>    - Command handlers use the primary database (`db`) for writes
>
> 2. **Create `apps/api-server/src/lib/cqrs/query-bus.ts`:**
>    - Queries represent read intentions: `GetExamResultsQuery`, `GetUserAnalyticsQuery`, `GetDashboardMetricsQuery`
>    - `QueryBus.dispatch(query)` routes to the appropriate handler
>    - Query handlers use the read replica (`dbReadOnly` from Task 92)
>
> 3. **Define commands and queries:**
>
>    Commands (use primary DB):
>    - `StartExamCommand { userId, blueprintId, config, idempotencyKey }`
>    - `SubmitAnswerCommand { examId, questionId, answer, timeSpent }`
>    - `CompleteExamCommand { examId, userId }`
>    - `CreateQuestionCommand { ...questionData }`
>    - `UpdateUserCommand { userId, ...userData }`
>
>    Queries (use read replica):
>    - `GetUserExamsQuery { userId, status?, pagination }`
>    - `GetExamResultsQuery { examId }`
>    - `GetDashboardMetricsQuery { dateRange }`
>    - `GetUserAnalyticsQuery { dateRange, filters }`
>    - `GetContentHealthQuery { domainId? }`
>    - `SearchQuestionsQuery { filters, pagination }`
>
> 4. **Update route handlers:**
>    - Show 3-5 example conversions:
>      - Before: `const result = await ExamEngine.startExam(...)` (direct service call)
>      - After: `const result = await commandBus.dispatch(new StartExamCommand(...))` (via CQRS)
>    - This separates the intent from the implementation
>
> 5. **Benefits:**
>    - Read queries automatically route to replica (no load on primary)
>    - Can optimize read models independently (add materialized views, denormalize)
>    - Clear separation of write logic (commands) and read logic (queries)
>    - Each can be scaled independently
>
> 6. **Write tests**: Command dispatch to correct handler, query dispatch to read replica, error handling

---

### Task 113: Create Materialized Views for Dashboard Analytics

**AI Prompt:**

> Admin dashboard analytics queries perform expensive aggregations (COUNT, GROUP BY, JOIN across multiple tables) on every page load. These need to be pre-computed as materialized views.
>
> Read the admin analytics service files to understand which aggregations are performed:
> - Search for `COUNT`, `SUM`, `AVG`, `GROUP BY` across the codebase
> - Focus on admin dashboard, analytics, and metrics endpoints
>
> Then create materialized views:
>
> 1. **Create a Drizzle migration** that adds these PostgreSQL materialized views:
>
>    - `mv_user_stats` — Pre-computed user statistics:
>      ```sql
>      Total users, verified users, active users (last 30 days), new users (last 7 days),
>      users by role, users by registration month
>      ```
>
>    - `mv_exam_stats` — Pre-computed exam statistics:
>      ```sql
>      Total exams, completed exams, average score, exams by status,
>      exams by domain, exams per day (last 30 days), average completion time
>      ```
>
>    - `mv_question_stats` — Pre-computed question statistics:
>      ```sql
>      Total questions, questions by difficulty, questions by topic,
>      questions by type, average correct rate per question, unused questions count
>      ```
>
>    - `mv_content_readiness` — Pre-computed content readiness:
>      ```sql
>      Per-topic: question count, skill coverage percentage, difficulty distribution,
>      minimum questions for exam viability
>      ```
>
> 2. **Create refresh mechanism** at `apps/api-server/src/modules/maintenance/materialized-views.service.ts`:
>    - `refreshView(viewName)` — Execute `REFRESH MATERIALIZED VIEW CONCURRENTLY viewName`
>    - `refreshAll()` — Refresh all materialized views
>    - `CONCURRENTLY` allows reads during refresh (no downtime)
>    - Requires unique index on each materialized view
>
> 3. **Schedule automatic refresh:**
>    - Add to the `cleanupQueue` (Task 106): scheduled job every 5 minutes to refresh views
>    - Or use Vercel Cron: refresh every 5 minutes
>    - Manual refresh trigger via admin API: `POST /api/admin/maintenance/refresh-views`
>
> 4. **Update analytics queries** to read from materialized views instead of computing on the fly:
>    - Dashboard metrics → `mv_user_stats`, `mv_exam_stats`
>    - Content readiness → `mv_content_readiness`
>    - Question analytics → `mv_question_stats`
>
> 5. **Add `last_refreshed` tracking:**
>    - Store when each view was last refreshed
>    - Display staleness indicator on admin dashboard: "Data as of 3 minutes ago"
>
> 6. **Fallback:**
>    - If materialized view doesn't exist (first deployment, migration pending):
>      - Fall back to live query
>      - Log warning about missing view

---

### Task 114: Route Read Queries to Replica

**AI Prompt:**

> Following the read replica setup in Task 92 and CQRS in Task 112, I need to systematically route all read-only queries to the read replica across the entire codebase.
>
> Search the entire `apps/api-server/src/` directory for all database queries and categorize each as read or write:
>
> 1. **Identify ALL database read queries** — Search for:
>    - `db.select(`, `db.query.`, `.findFirst(`, `.findMany(`
>    - Any query that does NOT modify data
>
> 2. **Categorize each read query:**
>
>    **Route to read replica (`dbReadOnly`):**
>    - All admin dashboard analytics
>    - All admin list endpoints (users, questions, blueprints, exams)
>    - All report generation queries
>    - Search queries
>    - Public data queries (domains, subjects, topics)
>    - Scorecard/results viewing
>
>    **Keep on primary (`db`):**
>    - Auth queries that follow a write (login check after password update — read-your-writes)
>    - Idempotency key lookups (must see latest writes)
>    - Exam question loading during active exam (critical path)
>    - Any read that immediately follows a write in the same request
>
> 3. **Update each identified query** to use `dbReadOnly`:
>    - Import `{ dbReadOnly }` from `@quiz/db`
>    - Replace `db.select(...)` with `dbReadOnly.select(...)` for identified read queries
>    - Add a comment on each replacement: `// Routed to read replica — analytics query`
>
> 4. **Create a helper for read-your-writes pattern:**
>    - `getReader(hasWrittenInThisRequest: boolean)` → returns `db` if written, `dbReadOnly` otherwise
>    - This prevents stale reads after writes within the same request
>
> 5. **Document the routing rules** in a code comment or README section

---

### Task 115: Implement Event-Driven View Updates

**AI Prompt:**

> Materialized views (Task 113) become stale between refresh intervals. For more real-time read models, I need event-driven updates where writes trigger read model updates.
>
> Read the event bus from Task 62 and the materialized views from Task 113.
>
> Then implement event-driven updates:
>
> 1. **Create `apps/api-server/src/lib/cqrs/read-model-updater.ts`:**
>
>    Subscribe to domain events and update read models:
>
>    - `ExamCompleted` event → Increment exam count in `mv_exam_stats`, update average score
>    - `UserSignedUp` event → Increment user count in `mv_user_stats`
>    - `QuestionCreated` event → Update question counts in `mv_question_stats` and `mv_content_readiness`
>    - `AnswerSubmitted` event → Update per-question correct rate
>
> 2. **Two update strategies:**
>
>    **Strategy A: Incremental updates (fast, eventually consistent)**
>    - Instead of refreshing the entire materialized view, update specific counters
>    - Use Redis sorted sets or hash maps for fast counter increments
>    - Periodically sync Redis counters back to PostgreSQL materialized views
>
>    **Strategy B: Trigger-based refresh (simpler, slightly delayed)**
>    - Mark materialized views as "dirty" when relevant events fire
>    - A background job checks for dirty views every 30 seconds and refreshes them
>    - Simpler but has up to 30 seconds of staleness
>
> 3. **Implement Strategy B** (recommended for current scale):
>    - Create a Redis set `dirty_views` that tracks which views need refresh
>    - On `ExamCompleted`: `redis.sadd('dirty_views', 'mv_exam_stats')`
>    - Background job (every 30s): check `dirty_views`, refresh those views, clear the set
>
> 4. **Consistency guarantees:**
>    - Document that read models are eventually consistent (up to 30 seconds stale)
>    - For operations that need strong consistency, always read from primary DB
>    - Admin dashboard displays "Last updated: X seconds ago" indicator
>
> 5. **Write tests**: Event triggers view marking, dirty views get refreshed, refresh clears dirty flag

---

### Task 116: Add Table Partitioning for Exams

**AI Prompt:**

> The `exams` table will grow unbounded as more exams are taken. At millions of rows, queries slow down. I need to partition the table by date range.
>
> Read the `exams` table schema at `packages/db/src/schema/exam.ts` to understand all columns, indexes, and constraints.
>
> Then implement partitioning:
>
> 1. **Design the partition strategy:**
>    - Partition by `started_at` date range (monthly partitions)
>    - Why monthly: exams are most commonly queried by recent date ranges, monthly gives good granularity
>    - Partition naming: `exams_2024_01`, `exams_2024_02`, etc.
>
> 2. **Create a Drizzle migration** (or raw SQL migration) that:
>    - Creates a new partitioned table `exams_partitioned` with `PARTITION BY RANGE (started_at)`
>    - Creates partitions for the current month and next 3 months
>    - Migrates existing data from `exams` to `exams_partitioned`
>    - Renames: `exams` → `exams_old`, `exams_partitioned` → `exams`
>    - Drops `exams_old` after verification
>
>    **IMPORTANT**: This is a zero-downtime migration. Document the exact steps:
>    1. Create new partitioned table alongside existing
>    2. Backfill data
>    3. Swap tables during low-traffic window
>    4. Verify and drop old table
>
> 3. **Automatic partition creation:**
>    - Create `apps/api-server/src/modules/maintenance/partition-manager.ts`
>    - `ensurePartitions()` — Check if partitions exist for current month + next 3 months
>    - If missing, create them: `CREATE TABLE exams_2024_04 PARTITION OF exams FOR VALUES FROM ('2024-04-01') TO ('2024-05-01')`
>    - Run as a monthly scheduled job
>
> 4. **Query optimization:**
>    - Ensure all queries on `exams` include a `started_at` filter where possible
>    - PostgreSQL automatically routes queries to the correct partition based on the WHERE clause
>    - Queries without date filter scan all partitions (document this as a performance consideration)
>
> 5. **Document the partitioning strategy** with:
>    - Why monthly partitions
>    - How to add new partitions
>    - How to archive old partitions (detach, move to cold storage)
>    - Impact on foreign keys (partitioned tables have constraints on FK support)

---

### Task 117: Add Table Partitioning for Audit Logs

**AI Prompt:**

> The `audit_logs` table is the fastest-growing table in the system — every admin action, every login, every security event creates an entry. It needs partitioning.
>
> Read the `audit_logs` table schema at `packages/db/src/schema/auth.ts`.
>
> Then implement partitioning following the same pattern as Task 116:
>
> 1. **Partition by `created_at` — monthly partitions**
>    - Audit logs are almost always queried by date range
>    - Older logs are rarely accessed but must be retained
>
> 2. **Create migration:**
>    - Same zero-downtime approach as Task 116
>    - Create partitioned table, backfill, swap
>
> 3. **Automatic partition creation:**
>    - Reuse the `partition-manager.ts` from Task 116
>    - Add `audit_logs` to the list of managed partitioned tables
>
> 4. **Archival strategy for old partitions:**
>    - Partitions older than 12 months: detach from main table
>    - Store detached partitions as separate tables (or export to cold storage)
>    - This keeps the active table small and fast while preserving historical data
>    - Create `archivePartition(tableName, partitionName)` utility
>
> 5. **Query optimization:**
>    - All audit log queries should include date range filter
>    - Update admin audit log endpoint to require `startDate` and `endDate` parameters
>    - Default to last 30 days if not specified

---

### Task 118: Add Table Partitioning for Exam Questions

**AI Prompt:**

> The `exam_questions` table grows proportionally with exams — each exam has 20-60 question records. At scale, this table will be the largest by row count.
>
> Read the `exam_questions` table schema at `packages/db/src/schema/exam.ts`.
>
> Implement partitioning:
>
> 1. **Partition strategy:**
>    - Partition by `exam_id` hash range (hash partitioning) OR by the exam's `started_at` date (range partitioning using a denormalized date column)
>    - Range partitioning by date is simpler and aligns with exam partitioning (Task 116)
>    - Add a `created_at` column to `exam_questions` if not present, default to `now()`
>    - Partition monthly, same as exams
>
> 2. **Create migration** following the same zero-downtime pattern
>
> 3. **Add to partition manager** from Tasks 116-117
>
> 4. **Co-locate with exam partitions:**
>    - `exam_questions_2024_01` corresponds to `exams_2024_01`
>    - Queries that join exams and exam_questions benefit from partition pruning on both tables
>
> 5. **Document foreign key considerations:**
>    - PostgreSQL partitioned tables have limitations on foreign keys
>    - `exam_questions.exam_id` references `exams.id` — this may need to be an application-level constraint rather than DB-level if using native partitioning

---

### Task 119: Design Shard Key Strategy

**AI Prompt:**

> Before the database can be sharded horizontally (distributed across multiple database servers), I need a shard key strategy. This task is DESIGN ONLY — implementation is in Phase 4.
>
> Read ALL schema files to understand the data model and relationships:
> - `packages/db/src/schema/auth.ts`
> - `packages/db/src/schema/domain.ts`
> - `packages/db/src/schema/question.ts`
> - `packages/db/src/schema/exam.ts`
>
> Then design the sharding strategy:
>
> 1. **Analyze table relationships and query patterns:**
>
>    - **User-scoped data** (can be sharded by `user_id`):
>      - `users`, `user_profiles`, `sessions`, `refresh_tokens`, `login_attempts`
>      - `exams`, `exam_questions`, `results_by_dimension`
>      - `audit_logs` (per-user events)
>      - All queries for a user's data stay within one shard
>
>    - **Global data** (shared across all shards, NOT shardable):
>      - `domains`, `subjects`, `topics`, `subtopics`, `skills`, `topic_skills`
>      - `questions`, `question_skills`
>      - `exam_blueprints`
>      - `roles`
>      - These tables are the same for all users — replicate to every shard
>
> 2. **Shard key selection: `user_id`**
>    - Primary shard key: `user_id` (UUID)
>    - Hashing: consistent hashing on user_id → shard assignment
>    - Benefits: all user data co-located, no cross-shard queries for user operations
>    - Challenge: admin analytics needs cross-shard aggregation
>
> 3. **Cross-shard query plan:**
>    - Admin dashboard queries (user counts, exam stats) need data from ALL shards
>    - Solution: CQRS read models (Task 112) aggregate across shards
>    - Materialized views (Task 113) run per-shard and aggregate centrally
>
> 4. **Shard routing design:**
>    - `ShardRouter.getShardForUser(userId)` → returns shard connection
>    - `ShardRouter.getAllShards()` → returns all shard connections (for admin queries)
>    - `ShardRouter.getGlobalShard()` → returns connection to global data shard
>
> 5. **Migration path (incremental):**
>    - Phase 1: Single database (current)
>    - Phase 2: Read replica for analytics (Task 92)
>    - Phase 3: Table partitioning within single DB (Tasks 116-118)
>    - Phase 4: Horizontal sharding across multiple DBs (future)
>    - Each phase builds on the previous — no big bang migration
>
> 6. **Document the complete sharding strategy** in `docs/architecture/SHARDING_STRATEGY.md`:
>    - Shard key rationale
>    - Table classification (shardable vs global)
>    - Cross-shard query patterns
>    - Migration path
>    - Estimated capacity per shard
>    - Rebalancing strategy when adding new shards

---

### Task 120: Implement Hot/Cold Data Separation

**AI Prompt:**

> Active exam data (hot) is mixed with completed exam data from months ago (cold). Hot data should be fast to query; cold data should be archived for storage efficiency.
>
> Design and implement hot/cold data separation:
>
> 1. **Define hot vs cold criteria:**
>    - **Hot data** (fast storage, heavily indexed):
>      - Exams started within last 90 days
>      - Active/in-progress exams regardless of age
>      - Results viewed within last 30 days
>      - Active user sessions
>    - **Cold data** (archive storage, minimal indexing):
>      - Completed exams older than 90 days
>      - Expired sessions, tokens, login attempts
>      - Audit logs older than 6 months
>
> 2. **Create archive tables:**
>    - `exams_archive` — Same schema as `exams` but no indexes except primary key
>    - `exam_questions_archive` — Same
>    - `results_by_dimension_archive` — Same
>    - `audit_logs_archive` — Same
>
> 3. **Create archival service** at `apps/api-server/src/modules/maintenance/archive.service.ts`:
>
>    - `archiveOldExams(cutoffDate)`:
>      - Select exams where `completed_at < cutoffDate` and `status IN ('completed', 'failed', 'abandoned')`
>      - Insert into `exams_archive` in batches of 500
>      - Move corresponding `exam_questions` and `results_by_dimension` records
>      - Delete from hot tables after successful archive
>      - Return: `{ examsArchived, questionsArchived, resultsArchived, durationMs }`
>
>    - `archiveOldAuditLogs(cutoffDate)`:
>      - Similar batch archive process
>
>    - `queryArchive(examId)`:
>      - Check hot tables first, then archive tables
>      - Return data transparently — caller doesn't know if it came from hot or archive
>
> 4. **Schedule archival:**
>    - Add to maintenance queue: weekly job to archive data older than 90 days
>    - Run during low-traffic hours (3 AM UTC)
>
> 5. **User experience:**
>    - When a user views an old exam report, it may be slightly slower (archive query)
>    - Display "Loading archived data..." message if query takes >1 second
>    - Cache archived data aggressively (it never changes)
>
> 6. **Metrics:**
>    - Track: rows in hot tables, rows in archive tables, archive job duration
>    - Alert if hot tables exceed size threshold (archival not keeping up)

---

### Task 121: Add GDPR Data Anonymization

**AI Prompt:**

> The Quiz Platform only soft-deletes users (`deletedAt` timestamp) — email, password hash, profile data, and all associated records persist forever. This does not comply with GDPR's "Right to Erasure" (Article 17).
>
> Read the user deletion logic (if any exists) and the full schema to understand all user PII storage.
>
> Then implement GDPR-compliant data anonymization:
>
> 1. **Identify ALL tables storing PII:**
>    - `users` — email, name (password hash is PII under GDPR)
>    - `user_profiles` — Any profile data (avatar, bio, preferences)
>    - `sessions` — IP addresses, user agent strings
>    - `audit_logs` — User actions (may contain PII in details JSONB)
>    - `login_attempts` — IP addresses
>    - `refresh_tokens` — Associated with user identity
>    - `verification_tokens` — Email-linked
>    - `password_reset_tokens` — Email-linked
>
> 2. **Create `apps/api-server/src/modules/gdpr/anonymization.service.ts`:**
>
>    - `anonymizeUser(userId: string): Promise<AnonymizationResult>`:
>      - Replace `email` with `deleted_[hash]@anonymized.local`
>      - Replace `name` with `Deleted User [hash]`
>      - Null out `passwordHash`
>      - Delete `userProfiles` record entirely
>      - Delete all `sessions`, `refreshTokens`, `verificationTokens`, `passwordResetTokens`
>      - Delete all `loginAttempts`
>      - Anonymize `auditLogs`: replace user-identifying details in JSONB with `[REDACTED]`
>      - Keep `exams` and `results` but disassociate: set `userId` to anonymized placeholder
>      - Set `deletedAt` and `anonymizedAt` timestamps on user record
>      - All within a database transaction
>
>    - `exportUserData(userId: string): Promise<UserDataExport>`:
>      - GDPR "Right to Access" — export all user data as JSON
>      - Include: profile, exams, results, audit logs, sessions
>      - Exclude: internal system data, other users' data
>      - Return as downloadable JSON file
>
>    - `scheduleAnonymization(userId: string, reason: string)`:
>      - Schedule anonymization for 30 days in the future (grace period)
>      - User can cancel within grace period
>      - After grace period, execute `anonymizeUser`
>
> 3. **Create API endpoints:**
>    - `POST /api/user/request-deletion` — User requests account deletion (starts 30-day grace period)
>    - `POST /api/user/cancel-deletion` — User cancels pending deletion
>    - `GET /api/user/data-export` — User downloads their data (GDPR Right to Access)
>    - `POST /api/admin/users/{id}/anonymize` — Admin forces immediate anonymization
>
> 4. **Verification:**
>    - After anonymization, run verification query to ensure no PII remains linked to the original user
>    - Log verification result
>
> 5. **Document the GDPR compliance** in `docs/security/GDPR_COMPLIANCE.md`

---

## 3.4 — BFF (Backend for Frontend) LAYER (Tasks 122-125)

---

### Task 122: Create BFF Routes for Web App Quiz Selection

**AI Prompt:**

> The web app's quiz selection flow makes 4 sequential API calls (domains → subjects → topics → subtopics), creating a waterfall of requests. A BFF (Backend for Frontend) layer can aggregate these into a single call.
>
> Read the quiz selection flow:
> - `apps/web-app/src/components/quiz/QuizSelection.tsx` (or split components from Task 49)
> - Identify all API calls made during the 5-step quiz selection wizard
>
> Then create BFF routes in the web app:
>
> 1. **Create `apps/web-app/src/app/api/bff/quiz-hierarchy/route.ts`:**
>    - Single endpoint that returns the full domain hierarchy for quiz selection
>    - Aggregates: domains + subjects + topics + subtopics in one response
>    - Only includes hierarchy data needed for quiz selection (not full admin data)
>    - Server-side call to the API server (server-to-server, no CORS, lower latency)
>    - Cache the response for 5 minutes (hierarchy changes rarely)
>    - Response shape:
>      ```
>      {
>        domains: [
>          { id, name, subjects: [
>            { id, name, topics: [
>              { id, name, questionCount, subtopics: [
>                { id, name, questionCount }
>              ]}
>            ]}
>          ]}
>        ]
>      }
>      ```
>
> 2. **Create `apps/web-app/src/app/api/bff/exam-config/route.ts`:**
>    - Returns everything needed to configure and start an exam:
>      - Available blueprints for selected topics
>      - Question count ranges (min/max based on available questions)
>      - Time limit options
>      - Difficulty distribution preview
>    - Aggregates 2-3 API calls into one
>
> 3. **Create `apps/web-app/src/app/api/bff/dashboard/route.ts`:**
>    - Returns everything needed for the student dashboard:
>      - Recent exams with scores
>      - Active/in-progress exams
>      - Performance trends
>      - Recommended next topics
>    - Aggregates 3-4 API calls into one
>
> 4. **BFF implementation pattern:**
>    - Each BFF route is a Next.js API route running on the same server as the web app
>    - It calls the main API server internally (server-to-server)
>    - Shapes the response specifically for the frontend's needs
>    - Adds caching appropriate for each data type
>    - Handles errors from multiple backend calls gracefully
>
> 5. **Update frontend components** to call BFF routes instead of direct API calls
>
> 6. **Performance benefit**: 4 sequential requests (800ms total) → 1 BFF request (200ms)

---

### Task 123: Create BFF Routes for Admin Dashboard

**AI Prompt:**

> The admin dashboard loads data from 6+ separate API endpoints on initial load, one for each panel. A BFF layer can aggregate these into fewer requests.
>
> Read the admin dashboard:
> - `apps/admin-app/src/app/` — dashboard page
> - Identify all API calls made on dashboard load (each panel likely makes its own API call)
>
> Then create BFF routes:
>
> 1. **Create `apps/admin-app/src/app/api/bff/dashboard-summary/route.ts`:**
>    - Single endpoint returning all dashboard panel data:
>      - User statistics (total, new, verified, active)
>      - Exam statistics (total, completed, average score, today's count)
>      - Question statistics (total, by difficulty, by topic, recently added)
>      - System health summary (DB, Redis, Email status)
>      - Recent audit log entries (last 10)
>      - Content readiness overview
>    - Aggregates 6+ API calls into one server-side batch
>    - Uses `Promise.allSettled()` so one failing panel doesn't break the entire dashboard
>    - Each panel's data is independently nullable — frontend shows error per-panel if data missing
>    - Cache for 60 seconds (dashboard data can be slightly stale)
>
> 2. **Create `apps/admin-app/src/app/api/bff/analytics/route.ts`:**
>    - Aggregated analytics data with date range filter
>    - Combines: user analytics + exam analytics + performance trends
>    - Supports `?period=7d|30d|90d`
>
> 3. **Create `apps/admin-app/src/app/api/bff/question-overview/route.ts`:**
>    - Question management overview:
>      - Question counts by status, difficulty, topic
>      - Recently created/modified questions
>      - Questions needing review
>      - Content gaps (topics with too few questions)
>
> 4. **BFF caching strategy:**
>    - Dashboard summary: 60 second cache
>    - Analytics: 5 minute cache (expensive aggregations)
>    - Question overview: 2 minute cache
>    - Cache invalidation on relevant write operations
>
> 5. **Update admin dashboard** to call single BFF endpoint instead of 6+ individual calls

---

### Task 124: Implement Response Shaping in BFF

**AI Prompt:**

> BFF routes should return only the fields needed by the UI, not full database objects. This reduces payload size and processing time.
>
> Read the BFF routes created in Tasks 122-123. Then read the frontend components that consume this data to understand exactly which fields each component uses.
>
> Then implement response shaping:
>
> 1. **For each BFF route, create a response shaper:**
>
>    Create `apps/web-app/src/app/api/bff/shapers/` directory:
>
>    - `quiz-hierarchy.shaper.ts`:
>      - Input: Full domain hierarchy from API (all fields)
>      - Output: Only `{ id, name, questionCount }` for each level
>      - Strips: descriptions, metadata, timestamps, admin-only fields
>      - Sorts: alphabetically by name for consistent UI
>
>    - `dashboard.shaper.ts`:
>      - Input: Full user profile, exam list, recommendations
>      - Output: Slim user summary, last 5 exam scores, top 3 recommendations
>      - Strips: email in exam records, internal scoring details
>
>    Create `apps/admin-app/src/app/api/bff/shapers/` directory:
>
>    - `dashboard-summary.shaper.ts`:
>      - Input: Full statistics from multiple endpoints
>      - Output: Only the numbers and labels needed for dashboard cards
>      - Aggregates: raw data into display-ready summaries
>
> 2. **Response size comparison:**
>    - Log the size of unshaped vs shaped responses
>    - Document the bandwidth savings per endpoint
>    - Target: 50%+ reduction in payload size for list views
>
> 3. **Type safety:**
>    - Define TypeScript types for both the full API response AND the shaped BFF response
>    - Frontend components use the shaped type
>    - Shapers take full type as input and return shaped type as output
>
> 4. **Testing:**
>    - Write tests for each shaper: correct fields included, sensitive fields excluded, null handling

---

### Task 125: Add BFF-Level Caching

**AI Prompt:**

> BFF routes aggregate multiple backend API calls. Without caching, every BFF request triggers all underlying API calls. I need caching at the BFF layer.
>
> Read the BFF routes from Tasks 122-123 and the CacheService at `apps/api-server/src/modules/core/cache.service.ts`.
>
> Then implement BFF caching:
>
> 1. **Create BFF cache utility** at `apps/web-app/src/lib/bff-cache.ts` (and similar for admin-app):
>
>    - Use Next.js built-in caching mechanisms:
>      - `unstable_cache` (Next.js data cache) for server-side caching
>      - Or implement simple in-memory cache with TTL (since BFF runs on same server as frontend)
>
>    - Cache configuration per BFF route:
>      - `quiz-hierarchy`: TTL 5 minutes, cache key = `bff:hierarchy`
>      - `dashboard`: TTL 60 seconds, cache key = `bff:dashboard:{userId}`
>      - `dashboard-summary` (admin): TTL 60 seconds, cache key = `bff:admin-dashboard`
>      - `analytics`: TTL 5 minutes, cache key = `bff:analytics:{period}`
>
> 2. **Cache key design:**
>    - Include user-specific parameters for personalized data: `bff:dashboard:{userId}`
>    - Include filter parameters for filtered data: `bff:analytics:{period}:{filters}`
>    - Global data uses simple keys: `bff:hierarchy`
>
> 3. **Cache invalidation triggers:**
>    - When a new domain/subject/topic is created → invalidate `bff:hierarchy`
>    - When an exam is completed → invalidate `bff:dashboard:{userId}`
>    - Manual invalidation endpoint for admin: `POST /api/admin/cache/invalidate`
>
> 4. **Stale-while-revalidate pattern:**
>    - Serve stale cache immediately while fetching fresh data in background
>    - User sees fast response, next request gets updated data
>    - Implement with: `{ revalidate: 60 }` in Next.js cache options
>
> 5. **Cache metrics:**
>    - Log cache hit/miss ratio for each BFF route
>    - Track: cache hit rate, average response time (cached vs uncached)
>    - Target: >80% cache hit rate for hierarchy data, >50% for dashboard

---

## 3.5 — FEATURE FLAGS & DEPLOYMENT SAFETY (Tasks 126-129)

---

### Task 126: Install Feature Flag System

**AI Prompt:**

> The Quiz Platform has no feature flag system — new features are either deployed to 100% of users or not at all. I need feature flags for safe rollout and experimentation.
>
> Evaluate and implement a feature flag solution:
>
> 1. **Choose a provider:**
>    - **Option A: Flagsmith** (open-source, self-hostable, free tier available)
>    - **Option B: LaunchDarkly** (enterprise-grade, paid, excellent SDK)
>    - **Option C: Custom implementation** (simple boolean flags in database/Redis)
>    - **Recommended: Start with Option C** (custom) for simplicity, migrate to hosted provider later
>
> 2. **Create custom feature flag service** at `apps/api-server/src/lib/feature-flags/feature-flag.service.ts`:
>
>    - Store flags in Redis (fast reads) with database backup (persistence):
>      - `FeatureFlag { name, enabled, description, rolloutPercentage, targetUsers[], targetRoles[], createdAt, updatedAt }`
>
>    - `isEnabled(flagName: string, context?: { userId?, role? }): boolean`
>      - Check if flag is globally enabled
>      - Check rollout percentage (hash userId to deterministic 0-100 value)
>      - Check if user is in target list
>      - Check if user's role matches target roles
>      - Cache flag values for 60 seconds
>
>    - `getAllFlags(): FeatureFlag[]` — For admin dashboard
>    - `updateFlag(name, updates)` — For admin to toggle flags
>    - `createFlag(name, config)` — Create new flag
>
> 3. **Define initial feature flags:**
>    - `ASYNC_SCORING` — Toggle between sync and async scoring (from Task 107)
>    - `NEW_EXAM_UI` — Toggle new exam interface components
>    - `ADMIN_QUEUE_DASHBOARD` — Show queue monitoring in admin
>    - `BFF_ENABLED` — Use BFF routes vs direct API calls
>    - `MATERIALIZED_VIEWS` — Use materialized views vs live queries
>
> 4. **Client-side SDK** at `packages/api-client/src/modules/feature-flags-client.ts`:
>    - Fetch flags on app load (cached for session)
>    - `useFeatureFlag(name)` React hook returning `boolean`
>    - Update flags without page reload (poll every 5 minutes or use SSE)
>
> 5. **Admin UI** for flag management:
>    - Create `apps/admin-app/src/components/dashboard/FeatureFlagBoard.tsx`
>    - Toggle flags on/off
>    - Set rollout percentage with slider
>    - View which users are in the rollout
>
> 6. **API endpoints:**
>    - `GET /api/admin/feature-flags` — List all flags
>    - `PUT /api/admin/feature-flags/{name}` — Update a flag
>    - `GET /api/feature-flags` — Public endpoint returning enabled flags for current user (filtered)

---

### Task 127: Add Canary Deployment Configuration

**AI Prompt:**

> The Quiz Platform deploys to 100% of users immediately — a bug in a deploy affects everyone. I need canary deployment support.
>
> Since the project deploys to Vercel:
>
> 1. **Vercel Skew Protection:**
>    - Document how to enable Vercel's built-in Skew Protection (ensures clients and serverless functions are on the same deployment version)
>    - Add `skewProtection` configuration to `vercel.json` files
>
> 2. **Canary via Feature Flags (Task 126):**
>    - Use the feature flag system for canary releases:
>      - Wrap new features in feature flags
>      - Deploy to production with flags disabled
>      - Enable flag for 1% of users → monitor metrics
>      - Increase to 10% → 50% → 100%
>    - Create a `canary-rollout.md` runbook documenting this process
>
> 3. **Traffic splitting (Vercel Edge Config):**
>    - Document how to use Vercel's Edge Config for A/B testing and canary routing
>    - Create middleware that reads Edge Config and routes users to canary vs stable
>    - Alternative: Use `next.config.js` rewrites with percentage-based routing
>
> 4. **Canary health monitoring:**
>    - Compare error rates between canary and stable groups
>    - Compare latency between canary and stable groups
>    - Auto-rollback criteria: if canary error rate > 2x stable, disable canary flag
>    - Create `apps/api-server/src/lib/canary/canary-monitor.ts` that compares metrics
>
> 5. **Document the canary deployment process** in `docs/operations/CANARY_DEPLOYMENT.md`:
>    - Step-by-step canary release process
>    - Monitoring checklist during rollout
>    - Rollback procedure
>    - Success criteria for promotion to full rollout

---

### Task 128: Add Automated Rollback on Error Rate Spike

**AI Prompt:**

> When a deployment causes errors, there's no automated detection or rollback. I need automated rollback triggered by error rate spikes.
>
> 1. **Create error rate monitoring** at `apps/api-server/src/lib/deployment/error-rate-monitor.ts`:
>
>    - Track error rate over sliding time windows:
>      - 1-minute window: current error rate
>      - 5-minute window: trend
>      - Compare current window to baseline (average of last 24 hours)
>
>    - Use Redis counters (from Task 78 metrics) to calculate:
>      - `errorRate = errors / totalRequests * 100`
>      - `baselineErrorRate` = average error rate from last 24h
>
> 2. **Rollback trigger conditions:**
>    - If `errorRate > 5%` for 2 consecutive minutes (absolute threshold)
>    - If `errorRate > 3 * baselineErrorRate` for 5 minutes (relative spike)
>    - If `p95Latency > 3 * baselineP95Latency` for 5 minutes (performance degradation)
>
> 3. **Rollback action:**
>    - **Automated (via Vercel API):**
>      - Use Vercel REST API to promote the previous deployment
>      - `POST https://api.vercel.com/v13/deployments/{id}/promote` — Promote previous known-good deployment
>      - Requires `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` environment variables
>
>    - **Semi-automated (feature flag):**
>      - If automated rollback is too aggressive, use feature flags
>      - On error spike: disable all flags that were recently enabled
>      - This effectively rolls back the new feature without rolling back the deployment
>
> 4. **Notification on rollback:**
>    - Log at `fatal` level
>    - Send Sentry alert
>    - Future: Slack webhook notification
>
> 5. **Create `apps/api-server/src/lib/deployment/deployment.service.ts`:**
>    - `getCurrentDeploymentId()` — From `VERCEL_DEPLOYMENT_ID` env var
>    - `getPreviousDeploymentId()` — Query Vercel API
>    - `rollbackToPreviousDeployment()` — Execute rollback via Vercel API
>    - `isRollbackNeeded()` — Check error rate against thresholds
>
> 6. **Schedule monitoring:**
>    - Run `isRollbackNeeded()` check every 60 seconds
>    - Use Vercel Cron or the maintenance queue
>
> 7. **Document the automated rollback policy** and manual override procedures

---

### Task 129: Add Performance Budgets with Lighthouse CI

**AI Prompt:**

> There are no performance regression checks — bundle size and load time can degrade silently. I need Lighthouse CI to enforce performance budgets.
>
> 1. **Install Lighthouse CI:**
>    - Install `@lhci/cli` as a dev dependency at the monorepo root
>    - Create `lighthouserc.js` configuration file at root
>
> 2. **Configure Lighthouse CI:**
>
>    ```js
>    module.exports = {
>      ci: {
>        collect: {
>          url: [
>            'http://localhost:3000/',           // Web app home
>            'http://localhost:3000/login',       // Login page
>            'http://localhost:3000/dashboard',   // Dashboard
>            'http://localhost:3001/',            // Admin app home
>            'http://localhost:3001/login',       // Admin login
>          ],
>          startServerCommand: 'pnpm turbo start',
>          numberOfRuns: 3,  // Run 3 times, take median
>        },
>        assert: {
>          assertions: {
>            'categories:performance': ['error', { minScore: 0.7 }],      // Performance >= 70
>            'categories:accessibility': ['warn', { minScore: 0.9 }],     // Accessibility >= 90
>            'categories:best-practices': ['warn', { minScore: 0.8 }],    // Best practices >= 80
>            'categories:seo': ['warn', { minScore: 0.8 }],               // SEO >= 80
>            'first-contentful-paint': ['error', { maxNumericValue: 2000 }],  // FCP < 2s
>            'largest-contentful-paint': ['error', { maxNumericValue: 3000 }], // LCP < 3s
>            'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],  // CLS < 0.1
>            'total-blocking-time': ['error', { maxNumericValue: 300 }],      // TBT < 300ms
>            'interactive': ['warn', { maxNumericValue: 5000 }],              // TTI < 5s
>          },
>        },
>        upload: {
>          target: 'temporary-public-storage',  // Free storage for reports
>        },
>      },
>    };
>    ```
>
> 3. **Add to CI pipeline:**
>    - Create `.github/workflows/lighthouse.yml`:
>      - Runs on pull requests
>      - Builds the apps, starts local servers
>      - Runs Lighthouse CI against local URLs
>      - Posts results as PR comment with scores and comparison
>      - Fails CI if performance budget is exceeded
>
> 4. **Add root scripts:**
>    - `lighthouse` — Run Lighthouse CI locally
>    - `lighthouse:report` — Generate and open HTML report
>
> 5. **Performance budget file** — Create `budget.json` for fine-grained budgets:
>    - Maximum JavaScript bundle: 200KB per page (first load)
>    - Maximum total transfer size: 500KB per page
>    - Maximum number of requests: 30 per page
>    - Maximum image size: 100KB per image
>
> 6. **Document performance baselines** for each page after first run

---

## 3.6 — PERFORMANCE TESTING (Tasks 130-134)

---

### Task 130: Create k6 Load Test for Exam Flow

**AI Prompt:**

> The `LOAD_TEST_STRATEGY.md` doc defines performance targets but has zero test scripts. I need k6 load test scripts for the critical exam flow.
>
> Read `docs/testing/LOAD_TEST_STRATEGY.md` to understand the existing performance targets.
>
> Then create k6 test scripts:
>
> 1. **Create `tests/load/exam-flow.k6.js`:**
>
>    Simulate the complete exam lifecycle:
>
>    - **Setup**: Create test user (or use pre-created test account)
>    - **Step 1**: Login → Get access token
>    - **Step 2**: Fetch quiz hierarchy → Select domain/subject/topic
>    - **Step 3**: Start exam → Receive questions
>    - **Step 4**: Submit answers (simulate thinking time between answers: 5-30 seconds random)
>    - **Step 5**: Complete exam → Trigger scoring
>    - **Step 6**: Poll for results → View scorecard
>
>    Each step makes real API calls to the target environment.
>
> 2. **Load profiles:**
>
>    - `smoke` — 1 VU for 1 minute (verify the test works)
>    - `load` — Ramp up to 100 VUs over 5 minutes, hold for 10 minutes, ramp down
>    - `stress` — Ramp up to 500 VUs over 10 minutes, hold for 5 minutes
>    - `spike` — Jump to 200 VUs for 1 minute (sudden traffic burst)
>    - `soak` — 50 VUs for 30 minutes (memory leak detection)
>
> 3. **Performance thresholds:**
>    - Login: p95 < 500ms
>    - Exam start: p95 < 1000ms
>    - Answer submission: p95 < 300ms
>    - Exam completion: p95 < 500ms
>    - Score polling: p95 < 200ms
>    - Overall error rate: < 1%
>
> 4. **Configuration:**
>    - `BASE_URL` — Target environment URL (configurable)
>    - `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — Test credentials
>    - Export thresholds and options for CI integration
>
> 5. **Create `tests/load/package.json`** with k6 installation and run scripts
>
> 6. **Document how to run** in `tests/load/README.md`

---

### Task 131: Create k6 Load Test for Auth Flow

**AI Prompt:**

> Create k6 load test scripts for the authentication flow — the highest-traffic API surface.
>
> Create `tests/load/auth-flow.k6.js`:
>
> 1. **Scenarios:**
>
>    - **Login storm**: 500 users logging in simultaneously (Monday morning scenario)
>      - Each VU: login → access protected endpoint → logout
>      - Measures: login latency, token generation speed, session creation
>
>    - **Token refresh cycle**: 100 users with expiring tokens
>      - Each VU: login → wait → refresh token → access endpoint → repeat
>      - Measures: refresh token latency, token rotation correctness
>
>    - **Signup wave**: 100 new users signing up simultaneously
>      - Each VU: signup → verify email (simulate) → first login
>      - Measures: signup latency, verification flow, welcome email queue
>
>    - **Brute force resistance**: Simulate lockout behavior
>      - 10 VUs making rapid failed login attempts for same account
>      - Verify: progressive lockout activates, subsequent attempts are fast-rejected
>      - Measures: lockout response time, rate limiter effectiveness
>
> 2. **Thresholds:**
>    - Login: p95 < 500ms, p99 < 1000ms
>    - Signup: p95 < 1000ms
>    - Token refresh: p95 < 300ms
>    - Error rate: < 0.5%
>    - Rate limiter false positive rate: 0%
>
> 3. **Realistic patterns:**
>    - Add think time between actions (2-5 seconds)
>    - Use unique emails for signup tests (timestamp-based)
>    - Test both valid and invalid credentials mix (80% valid, 20% invalid)

---

### Task 132: Create k6 Load Test for Admin Dashboard

**AI Prompt:**

> Create k6 load test scripts for the admin dashboard — heavy read queries that can overload the database.
>
> Create `tests/load/admin-dashboard.k6.js`:
>
> 1. **Scenarios:**
>
>    - **Dashboard load**: 20 admin users loading the full dashboard simultaneously
>      - Each VU: login as admin → load all 9 dashboard panels → refresh every 60 seconds
>      - Measures: dashboard data load time, per-panel latency
>
>    - **User search**: 10 admins searching users with different criteria
>      - Each VU: search by name → search by email → paginate results → view user detail
>      - Measures: search latency, pagination performance
>
>    - **Question management**: 5 admins managing questions
>      - Each VU: list questions → filter by topic → create new question → edit existing → delete
>      - Measures: CRUD operation latency, list performance with filters
>
>    - **Analytics heavy queries**: 5 admins running analytics
>      - Each VU: load performance analytics → change date range → load content readiness → export
>      - Measures: analytics query time, database impact
>
> 2. **Thresholds:**
>    - Dashboard load: p95 < 3000ms (complex aggregation)
>    - User search: p95 < 1000ms
>    - Question CRUD: p95 < 500ms
>    - Analytics: p95 < 5000ms
>
> 3. **Database impact monitoring:**
>    - During the test, monitor database connection pool utilization
>    - If using read replicas (Task 92), verify analytics queries hit the replica

---

### Task 133: Establish Performance Baselines

**AI Prompt:**

> Before optimizing, I need to establish current performance baselines for every API endpoint. Without baselines, we can't measure improvement or detect regressions.
>
> Create `tests/load/baseline.k6.js`:
>
> 1. **Baseline test design:**
>    - Hit EVERY API endpoint once with a single user (no concurrency)
>    - Record: response time, response size, status code
>    - Output a performance report with per-endpoint baselines
>
> 2. **Endpoint categories to test:**
>    - **Auth endpoints** (7): login, signup, refresh, logout, verify, forgot-password, reset-password
>    - **Quiz endpoints** (5): hierarchy, start, submit-answer, complete, results
>    - **Admin endpoints** (20+): users CRUD, questions CRUD, blueprints CRUD, analytics, audit logs
>    - **Public endpoints** (5): domains, subjects, topics, subtopics, config
>    - **System endpoints** (3): healthz, readyz, metrics
>
> 3. **Baseline metrics per endpoint:**
>    - Response time: min, max, avg, p50, p90, p95, p99
>    - Response size: bytes
>    - Status code distribution
>    - Time to first byte (TTFB)
>
> 4. **Output format:**
>    - Generate JSON report: `tests/load/baselines/baseline-{date}.json`
>    - Generate human-readable summary table
>    - Mark endpoints exceeding SLO targets in red
>
> 5. **Create baseline comparison script** at `tests/load/compare-baselines.js`:
>    - Compare two baseline files
>    - Show per-endpoint delta (faster/slower)
>    - Flag endpoints that degraded by >20%
>    - Use in CI: compare PR baseline against main branch baseline
>
> 6. **SLO targets** (from LOAD_TEST_STRATEGY.md):
>    - Auth endpoints: p95 < 500ms
>    - Quiz start: p95 < 1000ms
>    - Answer submission: p95 < 200ms
>    - Admin analytics: p95 < 3000ms
>    - Public data: p95 < 200ms
>    - Health check: p95 < 50ms

---

### Task 134: Add Load Test Execution to CI

**AI Prompt:**

> Load tests should run automatically to catch performance regressions before they reach production.
>
> Create `.github/workflows/load-test.yml`:
>
> 1. **Trigger conditions:**
>    - On pull request: run smoke test only (fast, 1 minute)
>    - On merge to main: run full load test (15 minutes)
>    - Manual trigger: run any test profile (smoke, load, stress, spike, soak)
>    - Nightly schedule: run full baseline test at 2 AM UTC
>
> 2. **CI job steps:**
>    - Install k6 (use `grafana/k6-action` GitHub Action)
>    - Build and start the application (API server + test database)
>    - Seed test database with known data
>    - Run k6 test with selected profile
>    - Collect results (JSON output)
>    - Compare with baseline (from `tests/load/baselines/`)
>    - Post results as PR comment:
>      - Table of endpoints with p50, p95, p99 latency
>      - Red/green indicators vs baseline
>      - Error rate
>      - Overall pass/fail based on thresholds
>    - Upload k6 HTML report as artifact
>    - Fail CI if any threshold is exceeded
>
> 3. **Test database setup:**
>    - Use a separate test database (not production)
>    - Seed with realistic data volume (10,000 users, 50,000 exams, 100,000 questions)
>    - Clean up after test
>
> 4. **Environment configuration:**
>    - `K6_CLOUD_TOKEN` — Optional, for k6 Cloud integration (future)
>    - `TEST_DATABASE_URL` — Test database connection
>    - `TEST_API_URL` — API server URL for testing
>
> 5. **Baseline management:**
>    - Nightly run stores baseline as artifact
>    - PR runs compare against latest nightly baseline
>    - Baselines are versioned (date-stamped JSON files)
>
> 6. **Document the load testing process** in `tests/load/README.md`:
>    - How to run locally
>    - How to interpret results
>    - How to update thresholds
>    - How to add new test scenarios

---

## PHASE 3 COMPLETE

> **Total Tasks in Phase 3: 36 (#99-134)**
> After completing all 36 tasks, your platform will have:
> - Optimized network layer with caching, compression, ETags, and field selection
> - Async processing with message queues, dead letter queues, and job monitoring
> - CQRS architecture with materialized views and event-driven updates
> - Database partitioning, hot/cold separation, and GDPR compliance
> - BFF layer reducing API call waterfalls by 75%
> - Feature flags for safe canary deployments with automated rollback
> - Comprehensive load testing with CI integration and performance baselines
>
> **Estimated effort**: 12-16 weeks with focused development
> **Impact**: From "works for thousands" to "architected for hundreds of thousands"
> **Next milestone**: Phase 4 takes you to millions with event-driven architecture, multi-region, real-time, and full observability

---

*Phase 4 prompts are in `PHASE-4-ENTERPRISE-FAANG-GRADE.md`*
