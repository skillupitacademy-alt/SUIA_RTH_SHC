# PHASE 4: ENTERPRISE / FAANG-GRADE (Months 7-12)

> **165 Total Tasks | Phase 4: 31 Tasks (#135-165) | Priority: ENTERPRISE**
> Architecture for millions of concurrent users and global scale.

---

## 4.1 — EVENT-DRIVEN ARCHITECTURE (Tasks 135-138)

---

### Task 135: Implement Event Sourcing for Exam Lifecycle

**AI Prompt:**

> The Quiz Platform currently stores only the final state of exams — once an exam is completed, the journey from start to finish is lost. I need Event Sourcing for the exam lifecycle so that every state change is stored as an immutable event and the current state can be reconstructed by replaying events.
>
> Read the current exam lifecycle across:
> - `apps/api-server/src/modules/exam-engine/exam.engine.ts`
> - `apps/api-server/src/modules/scoring-engine/scoring.engine.ts`
> - `apps/api-server/src/modules/exam-engine/exam-state-machine.ts` (from Phase 2, Task 61)
> - `packages/db/src/schema/exam.ts`
>
> Then implement Event Sourcing:
>
> 1. **Create event store table** — Add to database schema at `packages/db/src/schema/events.ts`:
>    - `exam_events` table:
>      - `id` — UUID primary key
>      - `exam_id` — Reference to the exam aggregate
>      - `event_type` — String: 'ExamCreated', 'QuestionLoaded', 'AnswerSubmitted', 'ExamCompleted', 'ScoringStarted', 'ScoringCompleted', 'ScoringFailed', 'ExamAbandoned', 'ExamExpired'
>      - `event_data` — JSONB containing event-specific payload
>      - `metadata` — JSONB: `{ userId, correlationId, causationId, timestamp, version }`
>      - `version` — Integer, incrementing per aggregate (optimistic concurrency)
>      - `created_at` — Timestamp with timezone
>    - Index on `(exam_id, version)` for fast replay
>    - Index on `(event_type, created_at)` for event type queries
>    - Partition by `created_at` monthly (reuse partition manager from Phase 3)
>
> 2. **Create event store service** at `apps/api-server/src/lib/event-sourcing/event-store.ts`:
>    - `append(aggregateId, events[], expectedVersion): Promise<void>` — Append events with optimistic concurrency check
>    - `getEvents(aggregateId): Promise<DomainEvent[]>` — Get all events for an aggregate
>    - `getEventsSince(aggregateId, version): Promise<DomainEvent[]>` — Get events after a version
>    - `getEventsByType(eventType, dateRange): Promise<DomainEvent[]>` — Query by event type
>    - Optimistic concurrency: if `expectedVersion` doesn't match current version, throw `ConcurrencyError`
>
> 3. **Define domain events** at `apps/api-server/src/lib/event-sourcing/exam-events.ts`:
>
>    - `ExamCreated { examId, userId, blueprintId, questionCount, timeLimit, config }`
>    - `QuestionsSelected { examId, questionIds[], selectionAlgorithm, anchor }`
>    - `ExamStarted { examId, startedAt }`
>    - `AnswerSubmitted { examId, questionId, answer, timeSpent, submittedAt }`
>    - `AnswerChanged { examId, questionId, previousAnswer, newAnswer, timeSpent }`
>    - `QuestionFlagged { examId, questionId, flaggedAt }`
>    - `QuestionUnflagged { examId, questionId, unflaggedAt }`
>    - `ExamSubmitted { examId, submittedAt, answeredCount, totalCount }`
>    - `ScoringStarted { examId, startedAt }`
>    - `ScoringCompleted { examId, overallScore, dimensionScores[], completedAt }`
>    - `ScoringFailed { examId, error, failedAt }`
>    - `ExamAbandoned { examId, abandonedAt, answeredCount }`
>    - `ExamExpired { examId, expiredAt }`
>
> 4. **Create exam aggregate** at `apps/api-server/src/lib/event-sourcing/exam-aggregate.ts`:
>    - `ExamAggregate` class that reconstructs exam state by replaying events:
>      - `static fromEvents(events: DomainEvent[]): ExamAggregate` — Rebuild state from events
>      - `apply(event: DomainEvent): void` — Apply a single event to current state
>      - `getState(): ExamState` — Get current derived state
>    - Each event type has a handler that mutates the internal state
>    - State is never stored directly — always derived from events
>
> 5. **Integrate with ExamEngine:**
>    - When `startExam` is called: append `ExamCreated`, `QuestionsSelected`, `ExamStarted` events
>    - When `submitAnswer` is called: append `AnswerSubmitted` event
>    - When `completeExam` is called: append `ExamSubmitted` event
>    - The exam's current state is derived by replaying its events
>    - Keep the existing `exams` table as a read model (projection) for fast queries
>
> 6. **Event replay utility:**
>    - `replayExam(examId): ExamState` — Reconstruct complete exam state from events
>    - Useful for debugging: "What exactly happened during this exam?"
>    - Admin can view the full event timeline for any exam
>
> 7. **Write tests:**
>    - Event appending with version check
>    - State reconstruction from events
>    - Concurrency conflict detection
>    - Full lifecycle replay

---

### Task 136: Create Event Bus with Redis Streams or Kafka

**AI Prompt:**

> The in-process event bus from Phase 2 (Task 62) works within a single server instance but doesn't scale across multiple instances. I need a distributed event bus.
>
> Evaluate options for the Quiz Platform:
> - **Redis Streams** — Lightweight, uses existing Upstash Redis, good for moderate scale
> - **Apache Kafka** — Enterprise-grade, high throughput, complex setup
> - **AWS EventBridge** — Serverless, managed, integrates with AWS ecosystem
> - **Recommended: Redis Streams** — Reuses existing infrastructure, sufficient for target scale
>
> Implement distributed event bus:
>
> 1. **Create `apps/api-server/src/lib/event-bus/distributed-event-bus.ts`:**
>
>    Using Redis Streams (via Upstash):
>    - `publish(channel: string, event: DomainEvent): Promise<string>` — Add event to Redis Stream, returns event ID
>    - `subscribe(channel: string, group: string, handler: EventHandler): void` — Subscribe to a stream with consumer group
>    - `acknowledge(channel: string, group: string, eventId: string): void` — Acknowledge processed event
>
>    Consumer group pattern:
>    - Each service instance joins a consumer group
>    - Redis distributes events across group members (each event processed once per group)
>    - Different services can have different consumer groups (each service gets all events)
>    - If a consumer fails, unacknowledged events are re-delivered to another consumer
>
> 2. **Define event channels (streams):**
>    - `exam-events` — All exam lifecycle events
>    - `auth-events` — Authentication and security events
>    - `admin-events` — Administrative actions
>    - `scoring-events` — Scoring lifecycle events
>    - `notification-events` — User notification triggers
>
> 3. **Create consumer groups:**
>    - `scoring-service` — Listens to `exam-events`, processes `ExamSubmitted` → triggers scoring
>    - `notification-service` — Listens to `scoring-events`, processes `ScoringCompleted` → sends email
>    - `analytics-service` — Listens to ALL events → updates materialized views
>    - `audit-service` — Listens to ALL events → writes audit log
>
> 4. **Event serialization:**
>    - Serialize events as JSON with schema version
>    - Include `schemaVersion` field for backward compatibility
>    - Create `EventSerializer` utility for consistent serialization/deserialization
>
> 5. **Dead letter handling:**
>    - Events that fail processing after 3 attempts → move to dead letter stream
>    - `exam-events-dlq`, `auth-events-dlq`, etc.
>    - Admin endpoint to view and replay dead letter events
>
> 6. **Migration from in-process to distributed:**
>    - Keep the in-process event bus as a fallback
>    - Feature flag `DISTRIBUTED_EVENTS=true` to switch between in-process and Redis Streams
>    - Both buses implement the same `IEventBus` interface
>
> 7. **Monitoring:**
>    - Track: events published per second, consumer lag, failed events, processing latency
>    - Add to admin dashboard metrics
>
> 8. **Write tests:** Publish/subscribe, consumer groups, acknowledgement, dead letter handling

---

### Task 137: Implement Domain Events Across All Services

**AI Prompt:**

> Following the distributed event bus from Task 136, I need to emit domain events from every service and create event handlers that react to them. This fully decouples the services.
>
> Read ALL service files in `apps/api-server/src/modules/` to understand every business operation that should emit an event.
>
> Then implement domain events comprehensively:
>
> 1. **Auth service events — Emit from auth modules:**
>
>    - `SignupService.signup()` → emit `UserSignedUp { userId, email, name, signupMethod }`
>    - `LoginService.login()` → emit `UserLoggedIn { userId, email, ip, userAgent, sessionId }`
>    - `LoginService.logout()` → emit `UserLoggedOut { userId, sessionId }`
>    - `PasswordRecoveryService.resetPassword()` → emit `PasswordReset { userId }`
>    - `SecurityService.lockAccount()` → emit `AccountLocked { userId, reason, duration, attemptCount }`
>    - `SecurityService.failedLogin()` → emit `LoginFailed { email, ip, attemptCount }`
>    - `TokenRefreshService.detectReuse()` → emit `TokenReuseDetected { userId, tokenFamily }`
>
> 2. **Exam engine events — Emit from exam modules:**
>
>    - `ExamEngine.startExam()` → emit `ExamStarted { examId, userId, blueprintId, questionCount }`
>    - `ExamEngine.submitAnswer()` → emit `AnswerSubmitted { examId, questionId, userId, timeSpent }`
>    - `ExamEngine.completeExam()` → emit `ExamCompleted { examId, userId, answeredCount, totalCount }`
>    - `ScoringEngine.calculateResults()` → emit `ScoringCompleted { examId, overallScore, dimensions[] }`
>    - `ScoringEngine` on failure → emit `ScoringFailed { examId, error }`
>
> 3. **Admin events — Emit from admin modules:**
>
>    - `QuestionAdminService.create()` → emit `QuestionCreated { questionId, topicId, difficulty, createdBy }`
>    - `QuestionAdminService.update()` → emit `QuestionUpdated { questionId, changes, updatedBy }`
>    - `QuestionAdminService.delete()` → emit `QuestionDeleted { questionId, deletedBy }`
>    - `UserAdminService.ban()` → emit `UserBanned { userId, bannedBy, reason }`
>    - `BlueprintAdminService.create()` → emit `BlueprintCreated { blueprintId, domainId, createdBy }`
>
> 4. **Create event handlers (subscribers):**
>
>    - **Analytics handler**: Subscribes to exam and auth events → updates materialized views (Task 113)
>    - **Notification handler**: Subscribes to `ScoringCompleted` → queues email notification
>    - **Audit handler**: Subscribes to ALL events → writes structured audit log entry
>    - **Security handler**: Subscribes to `LoginFailed`, `TokenReuseDetected`, `AccountLocked` → triggers security alerts
>    - **Cache invalidation handler**: Subscribes to write events → invalidates related cache entries
>    - **Read model handler**: Subscribes to write events → updates CQRS read models
>
> 5. **Event handler registration** at `apps/api-server/src/lib/event-bus/handler-registry.ts`:
>    - Register all handlers on application startup
>    - Each handler specifies which event types it listens to
>    - Handlers are independently deployable (can be moved to separate services later)
>
> 6. **Write tests:** Each emitter produces correct events, each handler processes events correctly, handler failure doesn't affect other handlers

---

### Task 138: Add Event Replay Capability

**AI Prompt:**

> With Event Sourcing (Task 135) and a distributed event bus (Task 136), I need the ability to replay events for debugging, data reconstruction, and recovery.
>
> 1. **Create `apps/api-server/src/lib/event-sourcing/event-replayer.ts`:**
>
>    - `replayAggregate(aggregateId: string): AggregateState` — Replay all events for one aggregate (exam)
>      - Fetches all events from event store
>      - Applies each event in order to rebuild state
>      - Returns the reconstructed state
>      - Use case: Debug "what happened during this exam?"
>
>    - `replayEventRange(startTime, endTime, eventTypes?): void` — Replay a range of historical events
>      - Re-publishes events to the event bus
>      - Event handlers re-process them (updating read models, analytics, etc.)
>      - Use case: Read model got corrupted, need to rebuild from events
>      - Adds `replayed: true` flag to prevent side effects (don't re-send emails)
>
>    - `replayToHandler(handlerName, startTime, endTime): void` — Replay events to a specific handler only
>      - Use case: New handler added, needs to process historical events
>      - Only the specified handler receives the replayed events
>
> 2. **Replay safety mechanisms:**
>    - **Idempotency**: Handlers must be idempotent — replaying the same event twice produces the same result
>    - **Side effect prevention**: Replayed events are tagged with `replayed: true`
>      - Email handler: skip sending emails for replayed events
>      - Notification handler: skip for replayed events
>      - Analytics handler: process normally (rebuilding analytics is the goal)
>      - Audit handler: skip for replayed events (audit trail already exists)
>    - **Rate limiting**: Replay at configurable speed (100 events/second default) to prevent overloading
>
> 3. **Admin replay API:**
>    - `POST /api/admin/events/replay/aggregate/{id}` — Replay one aggregate
>    - `POST /api/admin/events/replay/range` — Replay a time range (body: `{ startTime, endTime, eventTypes?, handlerName?, speed? }`)
>    - `GET /api/admin/events/replay/status` — Check replay progress
>    - `POST /api/admin/events/replay/stop` — Stop an in-progress replay
>    - All endpoints require admin authentication
>
> 4. **Event timeline viewer** for admin app:
>    - Create `apps/admin-app/src/components/events/EventTimeline.tsx`
>    - Display chronological list of events for an exam
>    - Each event shows: type, timestamp, data summary, handler results
>    - Filter by event type, date range
>    - "Replay from here" button for debugging
>
> 5. **Write tests:**
>    - Single aggregate replay produces correct state
>    - Range replay processes events in order
>    - Replayed events are tagged correctly
>    - Idempotent handlers produce same result on replay
>    - Rate limiting works correctly

---

## 4.2 — MULTI-REGION & EDGE (Tasks 139-142)

---

### Task 139: Deploy to Multiple Vercel Regions

**AI Prompt:**

> The Quiz Platform is deployed to a single Vercel region. Users in other continents experience high latency. I need multi-region deployment.
>
> 1. **Analyze current deployment:**
>    - Read all `vercel.json` files to understand current region configuration
>    - Identify which Vercel plan is needed for multi-region (Pro or Enterprise)
>
> 2. **Configure multi-region in Vercel:**
>    - Update each app's `vercel.json` to specify serverless function regions:
>      ```json
>      {
>        "regions": ["iad1", "cdg1", "hnd1"]
>      }
>      ```
>      - `iad1` — US East (Washington DC) — Primary
>      - `cdg1` — Europe (Paris)
>      - `hnd1` — Asia (Tokyo)
>    - Vercel Edge Network handles static asset distribution automatically
>    - Serverless functions run in the closest configured region to the user
>
> 3. **Database region considerations:**
>    - Primary database is in one region (US East with Neon)
>    - Serverless functions in Europe/Asia will have cross-region database latency
>    - Solution: Neon read replicas in each region (Task 140)
>    - Write operations always go to primary (US East)
>    - Read operations go to nearest replica
>
> 4. **Create region-aware routing** at `apps/api-server/src/lib/region/region-router.ts`:
>    - Detect current region from `VERCEL_REGION` environment variable
>    - Route read queries to nearest database replica
>    - Route write queries to primary database
>    - Log region information in all requests for debugging
>
> 5. **Latency monitoring per region:**
>    - Track response times grouped by `VERCEL_REGION`
>    - Alert if any region's p95 exceeds 2x the primary region's p95
>    - Add region to structured logs and Sentry tags
>
> 6. **Document multi-region architecture** in `docs/architecture/MULTI_REGION.md`:
>    - Region selection rationale
>    - Data flow between regions
>    - Consistency model (eventual for reads, strong for writes)
>    - Failover strategy

---

### Task 140: Add Neon Multi-Region Database Replicas

**AI Prompt:**

> With multi-region deployment (Task 139), database queries from Europe and Asia hit the US-based primary, adding 100-300ms of latency. I need regional read replicas.
>
> 1. **Neon read replica setup:**
>    - Document the Neon console steps to create read replicas in:
>      - US East (primary — already exists)
>      - Europe (eu-central-1 or eu-west-1)
>      - Asia (ap-northeast-1 or ap-southeast-1)
>    - Each replica gets its own connection URL
>
> 2. **Update database configuration** in `packages/db/src/schema/index.ts`:
>
>    - Create region-to-replica URL mapping:
>      - `DATABASE_REPLICA_US_URL` → US replica
>      - `DATABASE_REPLICA_EU_URL` → Europe replica
>      - `DATABASE_REPLICA_ASIA_URL` → Asia replica
>    - `getReplicaForRegion(region: string)` function:
>      - Reads `VERCEL_REGION` environment variable
>      - Maps to nearest replica URL
>      - Falls back to primary if replica URL not configured
>
> 3. **Create region-aware database client:**
>    - `dbPrimary` — Always points to primary (for writes)
>    - `dbReplica` — Points to nearest regional replica (for reads)
>    - `getDb(operation: 'read' | 'write')` → Returns appropriate client
>
> 4. **Integration with CQRS (Task 112):**
>    - Command handlers → `dbPrimary` (writes to US primary)
>    - Query handlers → `dbReplica` (reads from nearest replica)
>    - Replication lag: document expected delay (Neon replicas are typically <1 second)
>
> 5. **Monitoring:**
>    - Track replication lag per replica
>    - Alert if lag exceeds 5 seconds
>    - Log which replica served each read query
>
> 6. **Add environment variables to `.env.example`:**
>    - `DATABASE_REPLICA_US_URL=`
>    - `DATABASE_REPLICA_EU_URL=`
>    - `DATABASE_REPLICA_ASIA_URL=`

---

### Task 141: Implement Edge Caching for Static Content

**AI Prompt:**

> Frequently accessed, rarely-changing data (domain lists, subject hierarchies, public configuration) should be served from the edge (CDN) rather than hitting the origin server every time.
>
> 1. **Identify edge-cacheable content:**
>    - Domain list (changes weekly at most)
>    - Subject list per domain (changes weekly)
>    - Topic/subtopic hierarchies (changes weekly)
>    - Public configuration (app version, feature flags, UI settings)
>    - Exam blueprint metadata (changes occasionally)
>    - Static question counts per topic
>
> 2. **Implement Vercel Edge Caching:**
>
>    For each cacheable endpoint, use Vercel's `Cache-Control` with `s-maxage`:
>    - `s-maxage=86400` (24 hours at edge) for domain/subject/topic data
>    - `s-maxage=3600` (1 hour at edge) for blueprint metadata
>    - `stale-while-revalidate=3600` — Serve stale while fetching fresh copy
>    - `stale-if-error=86400` — Serve stale for 24 hours if origin errors
>
>    Update the relevant route handlers to set these headers.
>
> 3. **Create Edge API routes** using Next.js Edge Runtime:
>
>    Convert cacheable endpoints to Edge Runtime for lower latency:
>    - Create `apps/api-server/src/app/api/edge/domains/route.ts`:
>      - `export const runtime = 'edge'`
>      - Fetches from edge cache or origin
>      - Responds in <50ms from edge
>    - Create similar edge routes for subjects, topics, config
>
> 4. **Cache invalidation:**
>    - When admin creates/updates a domain/subject/topic:
>      - Call Vercel's Revalidation API: `await revalidateTag('domains')` or `await revalidatePath('/api/edge/domains')`
>    - Use Next.js `revalidateTag` or `revalidatePath` for on-demand revalidation
>    - Document the invalidation flow: admin action → API → purge edge cache → next request gets fresh data
>
> 5. **Edge Config for ultra-fast reads:**
>    - Use Vercel Edge Config for data that needs <1ms reads:
>      - Feature flags (from Task 126)
>      - Maintenance mode flag
>      - Rate limit configuration
>    - Create `apps/api-server/src/lib/edge-config.ts` utility
>
> 6. **Monitoring:**
>    - Track cache hit ratio at the edge (Vercel Analytics provides this)
>    - Log cache MISS events to identify patterns
>    - Target: >95% cache hit ratio for static content

---

### Task 142: Add Edge Functions for Auth Token Validation

**AI Prompt:**

> Currently, auth token validation runs on serverless functions in a specific region. For global users, this adds latency to every authenticated request. Moving token validation to the edge reduces this latency.
>
> 1. **Create edge middleware for token validation:**
>
>    Update `apps/web-app/src/middleware.ts` to use Edge Runtime:
>    - `export const runtime = 'edge'` (Next.js middleware already runs at the edge)
>    - Read the JWT access token from cookies
>    - Validate the token signature at the edge:
>      - Use `jose` library (works in Edge Runtime — already used by the project)
>      - Import the JWT_SECRET (must be available at the edge via environment variable)
>      - Verify signature, check expiration, decode payload
>    - If valid: allow request to proceed, attach user context to headers
>    - If expired: redirect to token refresh flow
>    - If invalid: redirect to login
>
>    This means EVERY request gets auth validation at the nearest edge location (<10ms) instead of routing to a serverless function in a specific region (100-300ms).
>
> 2. **Edge-compatible token validation:**
>    - Edge Runtime has limited APIs — verify `jose` works in Edge Runtime (it does)
>    - Cannot access the database from edge (too slow) — rely on JWT claims only
>    - For operations that need fresh DB data (role changes, bans), the serverless function does a secondary check
>    - This is a two-tier auth: edge validates token structure, origin validates permissions
>
> 3. **Token claims optimization:**
>    - Include essential claims in the JWT to avoid DB lookups:
>      - `userId`, `email`, `roles`, `isAdmin`, `isVerified`
>    - Edge middleware reads claims and passes them via request headers:
>      - `X-User-Id`, `X-User-Email`, `X-User-Roles`
>    - Serverless functions read these headers instead of re-parsing the token
>
> 4. **Security considerations:**
>    - Edge middleware only validates the token — it doesn't check if the user is banned or if roles changed since token issuance
>    - For sensitive operations (admin actions, exam submission), serverless functions do a full DB check
>    - Document the security trade-off: edge validation is fast but may allow recently-revoked tokens for up to 15 minutes (token expiry)
>
> 5. **Monitoring:**
>    - Track: edge auth validations per second, rejection rate, latency
>    - Compare: auth latency before (serverless) vs after (edge)
>    - Expected improvement: 100-300ms → <10ms for token validation

---

## 4.3 — REAL-TIME CAPABILITIES (Tasks 143-146)

---

### Task 143: Implement WebSocket for Exam Timer Synchronization

**AI Prompt:**

> The exam timer currently runs client-side only — there's no server-side time authority. A student could manipulate their system clock to get extra time. I need server-authoritative timer synchronization.
>
> Since Vercel doesn't natively support WebSockets for long-lived connections, evaluate alternatives:
>
> 1. **Option evaluation:**
>    - **WebSocket via external service** (Pusher, Ably, Socket.io with dedicated server) — Most reliable
>    - **Server-Sent Events (SSE)** — Simpler, works with Vercel Edge Functions, one-way server→client
>    - **Polling with server timestamp** — Simplest, works everywhere, slight latency
>    - **Recommended: SSE for timer sync** — One-way is sufficient (server tells client the time), works at the edge
>
> 2. **Implement SSE-based timer sync:**
>
>    Create `apps/api-server/src/app/api/exam/[examId]/timer/route.ts`:
>    - Edge Runtime compatible (`export const runtime = 'edge'`)
>    - Validates exam ownership and status
>    - Returns SSE stream with server time updates every 5 seconds:
>      ```
>      data: { "serverTime": 1705312200000, "examStartedAt": 1705310400000, "timeLimitMs": 3600000, "remainingMs": 1598200 }
>      ```
>    - Client uses `remainingMs` to correct its local timer
>    - If `remainingMs <= 0`, client auto-submits the exam
>
> 3. **Client-side integration:**
>    Create `apps/web-app/src/hooks/useServerTimer.ts`:
>    - Connects to SSE endpoint on exam start
>    - Receives server time updates every 5 seconds
>    - Calculates drift between client clock and server clock
>    - Adjusts the displayed timer based on server authority
>    - If drift exceeds 30 seconds, shows warning: "Your system clock appears to be incorrect"
>    - Handles reconnection on connection drop (exponential backoff)
>    - Falls back to client-only timer if SSE connection fails
>
> 4. **Server-side timer enforcement:**
>    - When `submitAnswer` is called, validate server-side that the exam hasn't expired:
>      - `if (now() > exam.startedAt + exam.timeLimit)` → reject with "Exam time expired"
>    - When `completeExam` is called, check server time
>    - This is the security boundary — client timer is only for display
>
> 5. **Auto-expiration:**
>    - Create a scheduled job that finds exams past their time limit and marks them as `expired`
>    - Run every minute: `UPDATE exams SET status = 'expired' WHERE status = 'started' AND started_at + time_limit < now()`
>    - Emit `ExamExpired` event for each expired exam
>
> 6. **Write tests:** SSE connection, time drift calculation, auto-expiration, server-side enforcement

---

### Task 144: Add Server-Sent Events for Live Score Notifications

**AI Prompt:**

> After completing an exam, students must manually refresh or poll to check if scoring is complete. I need real-time notifications when scores are ready.
>
> 1. **Create SSE notification endpoint:**
>
>    `apps/api-server/src/app/api/notifications/stream/route.ts`:
>    - Authenticated endpoint (validates JWT)
>    - Returns SSE stream for the authenticated user
>    - Sends events:
>      - `scoring-complete`: `{ examId, score, message: "Your exam has been scored!" }`
>      - `scoring-failed`: `{ examId, message: "Scoring failed. Our team is investigating." }`
>      - `announcement`: `{ message, priority }` (system-wide announcements)
>      - `session-expiring`: `{ minutesRemaining: 5 }` (session about to expire)
>    - Keeps connection alive with heartbeat every 30 seconds: `data: { "type": "heartbeat" }`
>    - Connection timeout: 30 minutes (reconnect after)
>
> 2. **Event trigger integration:**
>    - When `ScoringCompleted` event fires (Task 137):
>      - Find the SSE connection for the exam's user
>      - Push `scoring-complete` event through the SSE stream
>    - When `ScoringFailed` event fires:
>      - Push `scoring-failed` event
>
> 3. **Connection management:**
>    Create `apps/api-server/src/lib/sse/connection-manager.ts`:
>    - Track active SSE connections by userId
>    - `addConnection(userId, stream)` — Register new connection
>    - `removeConnection(userId)` — Clean up on disconnect
>    - `sendToUser(userId, event)` — Send event to specific user
>    - `broadcast(event)` — Send to all connected users
>    - Handle multiple tabs: user can have multiple SSE connections
>
>    **Note**: In serverless (Vercel), long-lived connections are challenging. Document alternatives:
>    - Use Vercel's streaming response (works for Edge Functions)
>    - Or use external service (Pusher/Ably) for connection management
>    - Or use client-side polling as fallback (poll every 5 seconds while waiting for score)
>
> 4. **Client-side hook:**
>    Create `apps/web-app/src/hooks/useNotifications.ts`:
>    - Connects to SSE endpoint after login
>    - Displays toast notifications for incoming events
>    - Updates UI state when scoring completes (auto-navigate to report)
>    - Reconnects on disconnect with exponential backoff
>    - Falls back to polling if SSE not available
>
> 5. **Write tests:** Event delivery, multi-tab handling, reconnection, fallback to polling

---

### Task 145: Add Real-Time Admin Dashboard Updates

**AI Prompt:**

> The admin dashboard shows stale data until manually refreshed. I need real-time updates for active exam monitoring and live metrics.
>
> 1. **Create admin SSE endpoint:**
>
>    `apps/api-server/src/app/api/admin/live/route.ts`:
>    - Admin-authenticated SSE endpoint
>    - Streams real-time events:
>      - `exam-started`: `{ examId, userId, blueprintName, timestamp }`
>      - `exam-completed`: `{ examId, userId, score, timestamp }`
>      - `user-signed-up`: `{ userId, email, timestamp }`
>      - `user-logged-in`: `{ userId, timestamp }`
>      - `scoring-completed`: `{ examId, score, timestamp }`
>      - `security-alert`: `{ type, userId, details, timestamp }`
>      - `metrics-update`: `{ activeUsers, activeExams, errorRate, timestamp }` (every 30 seconds)
>
> 2. **Live metrics aggregation:**
>    Create `apps/api-server/src/lib/live-metrics/live-metrics.service.ts`:
>    - Aggregate real-time metrics in Redis:
>      - Active exams count (exams with status 'started' or 'in_progress')
>      - Active users count (users with session heartbeat in last 5 minutes)
>      - Requests per minute
>      - Error rate (last 5 minutes)
>      - Average response latency (last 5 minutes)
>    - Push aggregated metrics to admin SSE every 30 seconds
>
> 3. **Admin dashboard integration:**
>    Create `apps/admin-app/src/hooks/useLiveDashboard.ts`:
>    - Connects to admin SSE endpoint
>    - Maintains real-time state:
>      - Live activity feed (last 50 events, scrolling)
>      - Active exams counter (updates in real-time)
>      - Active users counter
>      - Error rate gauge
>    - Components subscribe to specific event types
>
> 4. **Admin dashboard components:**
>    - Update `ExamActivityBoard` to show live exam starts/completions
>    - Add `LiveActivityFeed` component showing scrolling event stream
>    - Add `ActiveMetricsBar` component showing current active users, exams, error rate
>    - Add visual pulse/animation on each new event
>
> 5. **Connection management for admin:**
>    - Admin connections are fewer but more data-intensive
>    - Aggregate events server-side to reduce message volume
>    - Send batch updates for high-frequency events (answer submissions → aggregate, not individual)

---

### Task 146: Implement Connection Management

**AI Prompt:**

> Both student notifications (Task 144) and admin live dashboard (Task 145) need robust connection management for SSE connections.
>
> Create a unified connection management system:
>
> 1. **Create `apps/api-server/src/lib/sse/sse-manager.ts`:**
>
>    - `SSEManager` singleton:
>      - `createStream(userId, role: 'student' | 'admin')` — Creates new SSE response stream
>      - `closeStream(userId)` — Close a specific user's stream
>      - `sendToUser(userId, event)` — Send event to specific user
>      - `sendToRole(role, event)` — Send event to all users with a role
>      - `broadcast(event)` — Send to all connected users
>      - `getActiveConnections()` — Return count and details of active connections
>
> 2. **Heartbeat mechanism:**
>    - Send heartbeat ping every 30 seconds to keep connection alive
>    - If client doesn't respond to 3 consecutive heartbeats, close connection
>    - Client sends heartbeat acknowledgement (via separate endpoint if needed)
>
> 3. **Reconnection protocol:**
>    - Each SSE event includes an `id` field (incrementing counter)
>    - Client sends `Last-Event-ID` header on reconnect
>    - Server replays missed events since that ID (from Redis buffer)
>    - Buffer last 100 events per user in Redis (5 minute expiry)
>
> 4. **Backpressure handling:**
>    - If a client is slow (not consuming events fast enough):
>      - Buffer up to 50 events
>      - After 50 buffered events, start dropping low-priority events
>      - If buffer exceeds 100, close connection (force reconnect)
>
> 5. **Serverless considerations:**
>    - Vercel Edge Functions support streaming responses (SSE works)
>    - But function duration is limited (30s-300s depending on plan)
>    - After function timeout, client reconnects and gets missed events
>    - Document: For truly persistent connections, use external service (Pusher, Ably)
>    - Create adapter interface: `IRealtimeProvider` with implementations for both SSE and Pusher
>
> 6. **Monitoring:**
>    - Track: active connections, connection duration, events sent per minute, reconnection rate
>    - Alert if reconnection rate > 50% (indicates server instability)
>
> 7. **Write tests:** Connection lifecycle, heartbeat, reconnection with Last-Event-ID, backpressure, broadcasting

---

## 4.4 — ADVANCED RELIABILITY (Tasks 147-150)

---

### Task 147: Implement Bulkhead Pattern

**AI Prompt:**

> Currently, all requests share the same database connection pool and resources. A surge in admin analytics queries can exhaust connections and starve exam submissions. I need the Bulkhead Pattern to isolate resources.
>
> 1. **Create `apps/api-server/src/lib/resilience/bulkhead.ts`:**
>
>    Implement bulkhead resource isolation:
>
>    - `Bulkhead` class:
>      - `constructor(name, maxConcurrent, maxQueued)` — Create a bulkhead with limits
>      - `execute<T>(fn: () => Promise<T>): Promise<T>` — Run function within bulkhead
>      - If `maxConcurrent` is reached: queue the request (up to `maxQueued`)
>      - If queue is full: reject immediately with `BulkheadFullError`
>      - Track: active count, queued count, rejected count
>
> 2. **Define bulkheads for different workloads:**
>
>    - `examBulkhead` — Exam operations (start, submit, complete)
>      - `maxConcurrent: 50` — Up to 50 concurrent exam operations
>      - `maxQueued: 100` — Queue up to 100 more
>      - Highest priority — exam operations should never be starved
>
>    - `adminBulkhead` — Admin queries and operations
>      - `maxConcurrent: 20` — Up to 20 concurrent admin operations
>      - `maxQueued: 30`
>      - Admin queries are heavy but low priority compared to exam
>
>    - `analyticsBulkhead` — Analytics and reporting queries
>      - `maxConcurrent: 10` — Limit expensive analytics queries
>      - `maxQueued: 20`
>      - Prevents runaway analytics from consuming all DB connections
>
>    - `authBulkhead` — Authentication operations
>      - `maxConcurrent: 30` — Auth should always be responsive
>      - `maxQueued: 50`
>
> 3. **Integration with route handlers:**
>    - Wrap exam routes: `await examBulkhead.execute(() => ExamEngine.startExam(...))`
>    - Wrap admin routes: `await adminBulkhead.execute(() => AdminService.getUsers(...))`
>    - When a bulkhead rejects: return `503 Service Unavailable` with `Retry-After` header
>
> 4. **Connection pool partitioning:**
>    - Split the database connection pool (from Task 34) into partitions:
>      - Exam pool: 10 connections (reserved for exam operations)
>      - Admin pool: 5 connections
>      - Analytics pool: 3 connections
>      - General pool: 2 connections
>    - Each bulkhead uses its designated connection pool partition
>    - This prevents one workload from consuming all connections
>
> 5. **Monitoring:**
>    - Track per-bulkhead: active count, queued count, rejected count, wait time
>    - Alert if rejection rate exceeds 5% for any bulkhead
>    - Dashboard: bulkhead utilization bars
>
> 6. **Write tests:** Concurrency limiting, queuing, rejection when full, different bulkheads isolated

---

### Task 148: Add Load Shedding

**AI Prompt:**

> Under extreme load, the server should gracefully reject low-priority requests to protect high-priority operations (exam submissions) rather than crashing and failing everything.
>
> 1. **Create `apps/api-server/src/lib/resilience/load-shedder.ts`:**
>
>    - `LoadShedder` class:
>      - Monitors system load indicators:
>        - Event loop lag (measured via `perf_hooks`)
>        - Memory usage percentage
>        - Active request count
>        - Database connection pool utilization
>      - Calculates a `loadScore` (0-100) based on weighted indicators
>      - Returns `shouldShed(requestPriority): boolean`
>
> 2. **Load levels and actions:**
>
>    - **Normal** (loadScore 0-60): Accept all requests
>    - **Elevated** (loadScore 60-75): Reject priority=low requests (analytics, search)
>    - **High** (loadScore 75-90): Reject priority=low and priority=medium (admin non-critical)
>    - **Critical** (loadScore 90-100): Only accept priority=critical (exam submit, auth, health)
>
> 3. **Request priority classification:**
>
>    Create middleware at `apps/api-server/src/middleware/request-priority.middleware.ts`:
>    - **Critical** (always accepted): `POST /quiz/submit-answer`, `POST /quiz/complete`, `POST /auth/login`, `POST /auth/refresh`, `GET /healthz`
>    - **High**: `POST /quiz/start`, `POST /auth/signup`, `GET /quiz/results`
>    - **Medium**: `GET /admin/*` (admin reads), `GET /reports/*`
>    - **Low**: `GET /admin/analytics/*`, `GET /admin/metrics/*`, `POST /admin/export/*`
>
> 4. **Shed response:**
>    - Return `503 Service Unavailable`
>    - Include `Retry-After: 30` header
>    - Body: `{ error: "Service overloaded", message: "Please try again in a moment", retryAfter: 30, priority: "low" }`
>    - Log: shed event with request details and current load score
>
> 5. **Load monitoring loop:**
>    - Sample load indicators every 5 seconds
>    - Smooth with exponential moving average (avoid thrashing on/off)
>    - Store current load level in memory (fast access for middleware)
>
> 6. **Dashboard integration:**
>    - Display current load score on admin dashboard
>    - Show load history graph (last 1 hour)
>    - Show shed rate per priority level
>
> 7. **Write tests:** Load score calculation, shedding at each level, priority classification, Retry-After header

---

### Task 149: Add Chaos Engineering Framework

**AI Prompt:**

> The Quiz Platform has never been tested for failure scenarios. I need a chaos engineering framework to intentionally inject failures and verify the system degrades gracefully.
>
> 1. **Create `apps/api-server/src/lib/chaos/chaos-monkey.ts`:**
>
>    - `ChaosMonkey` class (ONLY active when `CHAOS_ENABLED=true` environment variable is set):
>      - `injectLatency(route, delayMs, probability)` — Add random latency to a route
>      - `injectError(route, statusCode, probability)` — Return errors for a percentage of requests
>      - `injectTimeout(route, probability)` — Simulate request timeouts
>      - `killConnection(service, probability)` — Simulate connection drops
>      - `fillMemory(mbToConsume)` — Simulate memory pressure
>      - `blockDatabase(durationMs)` — Simulate database unavailability
>      - `blockRedis(durationMs)` — Simulate Redis unavailability
>
> 2. **Chaos experiment definitions** at `apps/api-server/src/lib/chaos/experiments.ts`:
>
>    Pre-defined chaos experiments:
>    - **Redis outage**: Block Redis for 60 seconds → Verify cache fallback to LRU works
>    - **Database slow queries**: Add 5 second latency to all DB queries → Verify timeouts trigger
>    - **Scoring failure**: Inject errors in ScoringEngine → Verify DLQ and retry work
>    - **Email service down**: Block email API → Verify emails queued for later
>    - **Memory pressure**: Consume 80% of available memory → Verify load shedding activates
>    - **Network partition**: Drop 50% of responses → Verify client retry and circuit breaker work
>    - **High latency**: Add 2 second latency to all responses → Verify client timeouts and retry work
>
> 3. **Chaos API (admin-only):**
>    - `POST /api/admin/chaos/start` — Start an experiment: `{ experiment: "redis-outage", duration: 60 }`
>    - `POST /api/admin/chaos/stop` — Stop current experiment immediately
>    - `GET /api/admin/chaos/status` — Current experiment status
>    - `GET /api/admin/chaos/history` — Past experiment results
>
> 4. **Safety mechanisms:**
>    - **NEVER** enable in production (hardcoded check for `NODE_ENV !== 'production'`)
>    - Maximum experiment duration: 5 minutes (auto-stop)
>    - "Kill switch" endpoint that immediately stops all chaos
>    - Only admin-authenticated users can trigger experiments
>    - Log all chaos activities prominently
>
> 5. **Chaos test runner:**
>    Create `tests/chaos/chaos-runner.ts`:
>    - Runs each experiment automatically
>    - Verifies expected behavior during chaos (circuit breakers trip, fallbacks activate, etc.)
>    - Reports: which resilience mechanisms activated, which failed
>    - Generates a resilience report card
>
> 6. **Document chaos engineering practices** in `docs/testing/CHAOS_ENGINEERING.md`

---

### Task 150: Implement Graceful Shutdown with Connection Draining

**AI Prompt:**

> When serverless functions are recycled or the server is shut down, in-flight requests may be terminated mid-execution. I need graceful shutdown that drains existing connections before stopping.
>
> 1. **Create `apps/api-server/src/lib/lifecycle/graceful-shutdown.ts`:**
>
>    - `GracefulShutdown` class:
>      - `register()` — Register shutdown handlers for SIGTERM, SIGINT
>      - `onShutdown(handler: () => Promise<void>)` — Register cleanup callbacks
>      - When shutdown signal received:
>        1. Stop accepting new requests (return 503 for new requests)
>        2. Wait for in-flight requests to complete (up to 30 second timeout)
>        3. Execute cleanup callbacks in order:
>           - Close SSE connections gracefully
>           - Finish processing current queue jobs
>           - Flush metrics and logs
>           - Close database connection pools
>           - Close Redis connections
>        4. Exit process
>
> 2. **In-flight request tracking:**
>    - Create middleware that increments/decrements an active request counter
>    - `getActiveRequestCount(): number`
>    - During shutdown, wait until count reaches 0 (or timeout)
>
> 3. **Queue worker draining:**
>    - BullMQ workers (from Task 106): call `worker.close()` which finishes current job then stops
>    - Don't abort mid-scoring — let the current exam scoring complete
>    - New jobs are picked up by other instances
>
> 4. **Database connection draining:**
>    - Call `pool.end()` which waits for active queries to finish
>    - Set `pool.end()` timeout to 10 seconds
>    - Log any queries that were forcefully terminated
>
> 5. **Vercel-specific considerations:**
>    - Vercel serverless functions have a maximum execution time
>    - When the function is about to be recycled, Vercel sends SIGTERM
>    - Register SIGTERM handler to trigger graceful shutdown
>    - Keep cleanup under 10 seconds (Vercel gives limited shutdown window)
>    - Document the Vercel lifecycle: cold start → warm → SIGTERM → shutdown
>
> 6. **Health endpoint integration:**
>    - During shutdown, `/healthz` returns `503` (tells load balancer to stop sending traffic)
>    - `/readyz` returns `503` immediately on SIGTERM
>
> 7. **Write tests:** Shutdown signal handling, request draining, cleanup callback execution order, timeout enforcement

---

## 4.5 — FULL OBSERVABILITY PLATFORM (Tasks 151-156)

---

### Task 151: Deploy Grafana + Prometheus for Metrics Dashboards

**AI Prompt:**

> The application metrics (from Phase 2, Task 78) need visualization. I need Grafana + Prometheus for operational dashboards.
>
> Since the Quiz Platform runs on Vercel (serverless), a traditional Prometheus pull-based setup won't work. Use a managed or push-based approach:
>
> 1. **Option evaluation:**
>    - **Grafana Cloud** (free tier: 10K metrics, 50GB logs, 50GB traces) — Managed, no infrastructure to maintain
>    - **Self-hosted Grafana + Prometheus** — Full control, requires compute (Docker/K8s)
>    - **Recommended: Grafana Cloud** — Free tier is sufficient to start, zero infrastructure
>
> 2. **Set up Grafana Cloud integration:**
>    - Create `apps/api-server/src/lib/metrics/grafana-push.ts`:
>      - Push metrics to Grafana Cloud using the Prometheus Remote Write API
>      - Or use the OpenTelemetry Collector to export to Grafana Cloud
>    - Configure OTLP exporter (from Task 74) to point to Grafana Cloud endpoint
>    - Metrics from Task 78 automatically flow to Grafana
>
> 3. **Create Grafana dashboards** (document the JSON dashboard definitions):
>
>    **Dashboard 1: API Overview**
>    - Request rate (requests/second) by endpoint
>    - Error rate (%) with threshold line at 1%
>    - Latency percentiles (p50, p95, p99) by endpoint
>    - Active connections
>
>    **Dashboard 2: Exam Operations**
>    - Exams started per hour
>    - Exams completed per hour
>    - Average scoring time
>    - Scoring failure rate
>    - Queue depth (waiting jobs)
>
>    **Dashboard 3: Infrastructure**
>    - Database connection pool utilization
>    - Redis memory usage
>    - Cache hit/miss ratio
>    - Serverless function cold starts
>
>    **Dashboard 4: Business Metrics**
>    - Daily active users
>    - New signups per day
>    - Average exam score trending
>    - Most popular domains/topics
>
> 4. **Alert rules:**
>    - Error rate > 1% for 5 minutes → Warning
>    - Error rate > 5% for 2 minutes → Critical
>    - p95 latency > 2 seconds for 10 minutes → Warning
>    - Database pool utilization > 80% → Warning
>    - Scoring queue depth > 50 → Warning
>
> 5. **Add Grafana Cloud environment variables to `.env.example`:**
>    - `GRAFANA_CLOUD_URL=`
>    - `GRAFANA_CLOUD_USER=`
>    - `GRAFANA_CLOUD_TOKEN=`
>
> 6. **Document dashboard setup** in `docs/operations/GRAFANA_SETUP.md`

---

### Task 152: Deploy Loki for Log Aggregation

**AI Prompt:**

> Structured logs (from Phase 2, Tasks 69-73) are currently only available in ephemeral Vercel function logs. I need centralized log aggregation for searching, filtering, and correlation.
>
> 1. **Configure Loki integration** (via Grafana Cloud or self-hosted):
>
>    Create `apps/api-server/src/lib/logging/loki-transport.ts`:
>    - Pino transport that ships logs to Loki
>    - Use `pino-loki` package or custom HTTP push to Loki's push API
>    - Batch logs (send every 5 seconds or every 100 logs, whichever comes first)
>    - Add Loki labels: `app`, `environment`, `region`, `level`
>    - Structured JSON logs from pino are natively searchable in Loki
>
> 2. **Update logger configuration** (from Task 69):
>    - In production: add Loki transport alongside console output
>    - In development: console only (no Loki)
>    - Configuration via `LOKI_URL` environment variable
>
> 3. **Create Grafana log dashboards:**
>
>    **Dashboard: Log Explorer**
>    - Filter by: app, level, module, requestId, userId
>    - Full-text search across log messages
>    - Time-range selection
>    - Log context: show surrounding logs for the same requestId
>
>    **Dashboard: Error Analysis**
>    - Error log timeline (errors per minute)
>    - Top error messages (grouped by message)
>    - Error distribution by module
>    - Link from error → Sentry issue (via requestId correlation)
>
> 4. **Log-to-trace correlation:**
>    - Include `traceId` from OpenTelemetry in every log entry
>    - In Grafana, click a log entry → jump to the corresponding trace in Tempo
>    - This connects logs, traces, and metrics for unified debugging
>
> 5. **Log retention:**
>    - Configure Loki retention: 30 days for all logs, 90 days for error+ level
>    - Estimated storage: ~1GB per month at moderate traffic
>
> 6. **Add `LOKI_URL` to `.env.example`**

---

### Task 153: Deploy Tempo for Distributed Trace Visualization

**AI Prompt:**

> OpenTelemetry traces (from Phase 2, Tasks 74-75) need a backend for storage and visualization. I need Grafana Tempo for trace analysis.
>
> 1. **Configure Tempo integration** (via Grafana Cloud):
>
>    Update the OpenTelemetry configuration from Task 74:
>    - Set the OTLP exporter endpoint to Grafana Cloud Tempo:
>      - `OTEL_EXPORTER_OTLP_ENDPOINT=https://tempo-xxx.grafana.net/tempo`
>      - Authentication via `GRAFANA_CLOUD_TOKEN`
>    - Traces automatically flow from OpenTelemetry SDK → OTLP → Grafana Tempo
>
> 2. **Create Grafana trace dashboards:**
>
>    **Dashboard: Trace Explorer**
>    - Search traces by: service, operation, duration, status, tags
>    - Trace waterfall view: visualize the full request lifecycle
>      - Client request → Edge auth → API middleware → ExamEngine → SelectionEngine → Database queries
>    - Identify bottlenecks: which span takes the longest?
>    - Filter by: error traces, slow traces (>1s), specific endpoints
>
>    **Dashboard: Service Map**
>    - Auto-generated from trace data
>    - Shows: API Server → Database, API Server → Redis, API Server → Email Service
>    - Edge colors: green (healthy), yellow (degraded), red (errors)
>    - Click a connection to see latency and error rate
>
> 3. **Trace-to-log correlation:**
>    - In Grafana, click a trace span → see the logs emitted during that span
>    - Requires `traceId` in log entries (configured in Task 152)
>    - Full observability loop: alert → dashboard → trace → logs → root cause
>
> 4. **Sampling strategy optimization:**
>    - Production: sample 10% of normal traces, 100% of error traces
>    - Create `apps/api-server/src/lib/tracing/sampler.ts`:
>      - Always sample traces with errors
>      - Always sample traces exceeding p99 latency
>      - Sample 10% of other traces randomly
>      - Always sample traces for specific routes (exam engine, auth)
>
> 5. **Add Tempo environment variables to `.env.example`**

---

### Task 154: Create SLO Dashboards

**AI Prompt:**

> The observability runbook defines SLOs (99.95% for exam endpoints, 99.9% for admin) but they're not measured or visualized. I need SLO dashboards.
>
> 1. **Define SLOs formally** in `apps/api-server/src/lib/slo/slo-definitions.ts`:
>
>    - **Exam Availability SLO**: 99.95%
>      - Target: exam endpoints return non-5xx response 99.95% of the time
>      - Window: 30 days rolling
>      - Error budget: 0.05% = ~21 minutes of downtime per month
>
>    - **Exam Latency SLO**: p95 < 500ms
>      - Target: 95th percentile of exam endpoint latency under 500ms
>      - Window: 30 days rolling
>
>    - **Admin Availability SLO**: 99.9%
>      - Target: admin endpoints return non-5xx response 99.9% of the time
>      - Window: 30 days rolling
>      - Error budget: 0.1% = ~43 minutes per month
>
>    - **Scoring Completion SLO**: 99.9%
>      - Target: scoring completes successfully within 30 seconds for 99.9% of exams
>      - Window: 30 days rolling
>
> 2. **SLO calculation service** at `apps/api-server/src/lib/slo/slo-calculator.ts`:
>    - Read metrics from Redis/Prometheus
>    - Calculate current SLO compliance for each defined SLO
>    - Calculate error budget remaining
>    - Calculate burn rate (how fast error budget is being consumed)
>    - Return: `{ sloName, target, current, errorBudgetRemaining, burnRate, status }`
>
> 3. **Create Grafana SLO dashboards:**
>
>    **Dashboard: SLO Overview**
>    - One panel per SLO showing: target vs actual
>    - Error budget burn-down chart (starts at 100%, decreases with errors)
>    - Traffic light: green (>50% budget), yellow (10-50% budget), red (<10% budget)
>    - Burn rate chart: 1-hour and 6-hour burn rates
>
>    **Dashboard: Error Budget Details**
>    - Per-SLO error budget remaining (minutes)
>    - Error budget consumption timeline
>    - Top error contributors (which endpoints consume the most budget)
>    - Projected budget exhaustion date at current burn rate
>
> 4. **SLO-based alerting:**
>    - If 1-hour burn rate > 10x normal → Page on-call (rapid consumption)
>    - If 6-hour burn rate > 5x normal → Alert on-call (sustained consumption)
>    - If error budget < 25% → Warning (approaching exhaustion)
>    - If error budget < 10% → Critical (freeze deployments until budget recovers)
>
> 5. **API endpoint** at `/api/admin/slo`:
>    - Returns current SLO status for all defined SLOs
>    - Used by admin dashboard
>
> 6. **Document SLO practices** in `docs/operations/SLO_POLICY.md`

---

### Task 155: Set Up PagerDuty/OpsGenie Alerting

**AI Prompt:**

> The Quiz Platform has zero alerting — issues are discovered by users. I need an alerting system with escalation policies.
>
> 1. **Choose alerting provider:**
>    - **Grafana Alerting** (built into Grafana Cloud) — Free, integrated with dashboards
>    - **PagerDuty** — Enterprise incident management, paid
>    - **OpsGenie** — Atlassian's incident management, integrates with Jira
>    - **Recommended: Start with Grafana Alerting** → Migrate to PagerDuty/OpsGenie when team grows
>
> 2. **Configure Grafana alert rules:**
>
>    **Critical alerts (immediate action):**
>    - Error rate > 5% for 2 minutes → Notify immediately
>    - All health checks failing → Notify immediately
>    - Database connection pool exhausted → Notify immediately
>    - SLO error budget < 10% → Notify immediately
>    - DLQ count > 20 → Notify within 5 minutes
>
>    **Warning alerts (investigate when convenient):**
>    - Error rate > 1% for 5 minutes
>    - p95 latency > 2 seconds for 10 minutes
>    - Database pool utilization > 80% for 5 minutes
>    - Redis memory > 80%
>    - Scoring queue depth > 30
>    - Cache hit rate < 50%
>
>    **Informational alerts (awareness only):**
>    - New deployment detected
>    - Chaos experiment started/stopped
>    - Maintenance window started/ended
>
> 3. **Alert notification channels:**
>    - **Email**: All alerts → team email alias
>    - **Slack webhook**: Critical and warning alerts → #alerts channel
>    - **PagerDuty/OpsGenie**: Critical alerts only → on-call engineer
>    - Configure in Grafana's Contact Points and Notification Policies
>
> 4. **Escalation policy:**
>    - Critical alert fires → notify on-call via Slack
>    - Not acknowledged within 5 minutes → escalate to email
>    - Not acknowledged within 15 minutes → escalate to PagerDuty/phone
>    - Not acknowledged within 30 minutes → notify engineering manager
>
> 5. **Create `apps/api-server/src/lib/alerting/alert.service.ts`:**
>    - For programmatic alerts (not metric-based):
>      - `sendAlert(severity, title, message, data)` — Send alert via webhook
>      - Used for: DLQ entries, chaos experiment results, deployment events
>
> 6. **On-call schedule documentation** in `docs/operations/ON_CALL.md`:
>    - Rotation schedule template
>    - Escalation procedures
>    - Runbook links per alert type
>    - Post-incident review process

---

### Task 156: Add Real User Monitoring for Core Web Vitals

**AI Prompt:**

> There's no visibility into how real users experience the Quiz Platform. I need Real User Monitoring (RUM) for Core Web Vitals and frontend performance.
>
> 1. **Install `web-vitals` library** in both `apps/web-app` and `apps/admin-app`
>
> 2. **Create RUM collection** at `apps/web-app/src/lib/rum/web-vitals-reporter.ts`:
>
>    - Collect Core Web Vitals:
>      - `LCP` (Largest Contentful Paint) — Target: < 2.5 seconds
>      - `FID` (First Input Delay) / `INP` (Interaction to Next Paint) — Target: < 100ms
>      - `CLS` (Cumulative Layout Shift) — Target: < 0.1
>      - `FCP` (First Contentful Paint) — Target: < 1.8 seconds
>      - `TTFB` (Time to First Byte) — Target: < 800ms
>
>    - Report metrics to:
>      - **Option A**: Vercel Analytics (built-in, zero config with `@vercel/analytics`)
>      - **Option B**: Grafana Cloud (push to Prometheus)
>      - **Option C**: Custom endpoint → store in Redis → visualize in Grafana
>      - **Recommended: Option A + C** — Vercel Analytics for quick view, custom for detailed dashboards
>
> 3. **Install `@vercel/analytics`** in both frontend apps:
>    - Add `<Analytics />` component to root layout
>    - Automatically collects Web Vitals and sends to Vercel Analytics dashboard
>    - Zero configuration needed
>
> 4. **Custom RUM endpoint** at `apps/api-server/src/app/api/rum/route.ts`:
>    - Receives Web Vitals data from clients
>    - Stores in Redis with aggregation:
>      - Per-page: LCP, FID, CLS averages and percentiles
>      - Per-device: mobile vs desktop breakdown
>      - Per-region: latency by user region
>    - Expose via metrics endpoint for Grafana dashboards
>
> 5. **Page-specific performance tracking:**
>    - Exam page: Time from page load to first question rendered
>    - Quiz selection: Time for each step's data to load
>    - Dashboard: Time to fully interactive
>    - Report page: Time to render score charts
>
> 6. **Create Grafana RUM dashboard:**
>    - Core Web Vitals overview (LCP, FID, CLS) with good/needs-improvement/poor zones
>    - Per-page performance breakdown
>    - Performance by device type (mobile, desktop, tablet)
>    - Performance trends over time (daily averages)
>    - Comparison: before and after optimization changes
>
> 7. **Alerting on Web Vitals regression:**
>    - If LCP p75 > 4 seconds → Warning
>    - If CLS p75 > 0.25 → Warning
>    - If INP p75 > 200ms → Warning

---

## 4.6 — INFRASTRUCTURE AS CODE (Tasks 157-161)

---

### Task 157: Create Terraform/Pulumi for Infrastructure

**AI Prompt:**

> The Quiz Platform's infrastructure (Vercel, Neon, Upstash, Resend, Cloudflare) is manually configured. I need Infrastructure as Code (IaC) to make it reproducible and auditable.
>
> Choose Pulumi (TypeScript-native, works well with the project's tech stack) or Terraform (industry standard, HCL syntax).
>
> **Recommended: Pulumi** — Uses TypeScript (consistent with codebase), excellent Vercel/Neon providers.
>
> 1. **Create `infra/` directory** (currently empty with .gitkeep):
>
>    - `infra/package.json` — Pulumi project dependencies
>    - `infra/Pulumi.yaml` — Pulumi project definition
>    - `infra/Pulumi.dev.yaml` — Development environment config
>    - `infra/Pulumi.staging.yaml` — Staging environment config
>    - `infra/Pulumi.prod.yaml` — Production environment config
>    - `infra/index.ts` — Main infrastructure definition
>
> 2. **Define infrastructure resources:**
>
>    - **Vercel Projects** (3):
>      - `quiz-api-server` — API server app
>      - `quiz-web-app` — Student web app
>      - `quiz-admin-app` — Admin dashboard app
>      - Each with: environment variables, domain configuration, build settings
>
>    - **Neon Database**:
>      - Project, database, roles
>      - Read replicas per region
>      - Connection pooler configuration
>
>    - **Upstash Redis**:
>      - Database instance
>      - Eviction policy, memory limits
>      - Regional configuration
>
>    - **DNS/Domains** (if using Cloudflare):
>      - DNS records for each app
>      - SSL certificates
>
> 3. **Environment variable management:**
>    - Define all environment variables in Pulumi config
>    - Secrets encrypted via Pulumi's built-in secret management
>    - Automatically set on Vercel projects during `pulumi up`
>    - No more manual env var configuration in Vercel dashboard
>
> 4. **Multi-environment support:**
>    - `pulumi up --stack dev` → Provisions dev environment
>    - `pulumi up --stack staging` → Provisions staging
>    - `pulumi up --stack prod` → Provisions production
>    - Each stack has its own database, Redis, and Vercel project
>
> 5. **CI integration:**
>    - Add `pulumi preview` to PR checks (shows what would change)
>    - Add `pulumi up --yes` to main branch deployment
>
> 6. **Document IaC usage** in `infra/README.md`

---

### Task 158: Add Docker for Local Development

**AI Prompt:**

> Local development requires manually setting up PostgreSQL, Redis, and configuring environment variables. I need Docker for reproducible local development environments.
>
> 1. **Create `Dockerfile.dev`** at monorepo root:
>    - Base image: `node:20-slim`
>    - Install pnpm globally
>    - Copy package files, install dependencies
>    - Expose ports for all 3 apps (3000, 3001, 3002)
>    - Development mode with hot reload
>
> 2. **Create `docker-compose.yml`** at monorepo root:
>
>    Services:
>    - **postgres**: PostgreSQL 16 with volume persistence
>      - Port: 5432
>      - Database: `quiz_platform_dev`
>      - Username/password: `dev/dev`
>      - Init script: run migrations on first start
>
>    - **redis**: Redis 7 with volume persistence
>      - Port: 6379
>      - No password in development
>
>    - **api-server**: Next.js API server
>      - Port: 3002
>      - Depends on: postgres, redis
>      - Environment variables from `.env.docker`
>      - Volume mount: `./apps/api-server/src` for hot reload
>
>    - **web-app**: Student web app
>      - Port: 3000
>      - Depends on: api-server
>      - Volume mount for hot reload
>
>    - **admin-app**: Admin dashboard
>      - Port: 3001
>      - Depends on: api-server
>      - Volume mount for hot reload
>
>    - **maildev** (optional): Local email testing server
>      - Port: 1080 (web UI), 1025 (SMTP)
>      - Captures all emails sent by the API server
>
> 3. **Create `.env.docker`** with local development defaults:
>    - `DATABASE_URL=postgresql://dev:dev@postgres:5432/quiz_platform_dev`
>    - `REDIS_URL=redis://redis:6379`
>    - `JWT_SECRET=dev-secret-min-32-characters-long`
>    - All other required variables with development defaults
>
> 4. **Create convenience scripts** in root `package.json`:
>    - `docker:up` — `docker-compose up -d`
>    - `docker:down` — `docker-compose down`
>    - `docker:reset` — `docker-compose down -v && docker-compose up -d` (reset all data)
>    - `docker:logs` — `docker-compose logs -f`
>    - `docker:db:migrate` — Run Drizzle migrations against Docker PostgreSQL
>    - `docker:db:seed` — Seed test data
>
> 5. **Create `docker-compose.test.yml`** for integration testing:
>    - Same as development but with:
>      - Separate test database
>      - Test data seeding on startup
>      - Exits after tests complete
>
> 6. **Document Docker setup** in `docs/development/DOCKER_SETUP.md`

---

### Task 159: Create Docker Compose for Full-Stack Development

**AI Prompt:**

> This task extends Task 158 if it was only partially completed. If Docker Compose is already fully configured, enhance it with:
>
> 1. **Development experience enhancements:**
>    - Add `healthcheck` to each service (postgres: `pg_isready`, redis: `redis-cli ping`, api: curl healthz)
>    - Add `restart: unless-stopped` for resilience
>    - Configure resource limits (memory, CPU) to prevent runaway containers
>    - Add named volumes for data persistence between restarts
>
> 2. **Developer tooling services:**
>    - **pgAdmin**: Web-based PostgreSQL management tool (port 5050)
>    - **Redis Commander**: Web-based Redis management (port 8081)
>    - **Bull Board**: Queue monitoring UI (if not integrated into admin app)
>    - All optional, in a separate `docker-compose.tools.yml` file
>
> 3. **Profile-based startup:**
>    - `docker compose up` — Core services only (postgres, redis, api)
>    - `docker compose --profile frontend up` — Core + frontend apps
>    - `docker compose --profile tools up` — Core + developer tools
>    - `docker compose --profile full up` — Everything
>
> 4. **Init container pattern:**
>    - Create an init container that:
>      - Waits for PostgreSQL to be ready
>      - Runs Drizzle migrations
>      - Seeds development data
>      - Then signals readiness to dependent services

---

### Task 160: Implement Secret Management

**AI Prompt:**

> Secrets (JWT keys, database passwords, API tokens) are stored as Vercel environment variables with no rotation, auditing, or access control beyond Vercel's built-in mechanisms. I need proper secret management.
>
> 1. **Choose a secret management solution:**
>    - **Infisical** — Open-source, developer-friendly, free tier, good Vercel integration
>    - **Doppler** — Developer-focused secret management, free for small teams
>    - **HashiCorp Vault** — Enterprise-grade, complex setup
>    - **AWS Secrets Manager** — If using AWS infrastructure
>    - **Recommended: Infisical** — Open-source, great DX, syncs to Vercel automatically
>
> 2. **Set up Infisical integration:**
>
>    Create `apps/api-server/src/lib/secrets/secret-manager.ts`:
>    - `getSecret(name: string): Promise<string>` — Fetch a secret by name
>    - Cache secrets in memory for 5 minutes (avoid API calls on every request)
>    - Fall back to `process.env` if secret manager is unavailable
>    - Support for secret versioning (always use latest by default)
>
> 3. **Secret categories and rotation policies:**
>
>    - **JWT Secrets** (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_JWT_SECRET`):
>      - Rotation: every 90 days
>      - During rotation: support two active secrets (old and new) for graceful transition
>      - Old tokens signed with old secret remain valid until they expire
>      - New tokens signed with new secret
>
>    - **Database Credentials** (`DATABASE_URL`):
>      - Rotation: every 90 days
>      - Neon supports credential rotation via API
>
>    - **External API Keys** (`RESEND_API_KEY`, Sentry DSN, etc.):
>      - Rotation: annually or on team member departure
>
> 4. **Secret rotation automation:**
>    Create `apps/api-server/src/lib/secrets/rotation.service.ts`:
>    - `rotateJWTSecrets()` — Generate new JWT secret, update in secret manager, keep old as fallback
>    - `scheduledRotationCheck()` — Check if any secrets are due for rotation, alert if overdue
>    - Admin endpoint: `POST /api/admin/secrets/rotate/{secretName}`
>
> 5. **Audit logging for secret access:**
>    - Log when secrets are accessed (not the values — just the access event)
>    - Log when secrets are rotated (who, when, which secret)
>    - Integrate with audit log system
>
> 6. **Document secret management** in `docs/security/SECRET_MANAGEMENT.md`:
>    - How to add a new secret
>    - How to rotate secrets
>    - Emergency procedure for compromised secrets
>    - List of all secrets with rotation schedules

---

### Task 161: Add Zero-Downtime Migration Tooling

**AI Prompt:**

> Database migrations can lock tables and cause downtime. I need tooling and practices for zero-downtime migrations.
>
> 1. **Create migration safety guidelines** at `docs/database/MIGRATION_SAFETY.md`:
>
>    Document safe vs unsafe migration operations:
>
>    **Safe (no locks, zero downtime):**
>    - `CREATE TABLE` — New table, no impact on existing
>    - `ADD COLUMN ... DEFAULT NULL` — Instant add, no table rewrite
>    - `CREATE INDEX CONCURRENTLY` — Non-blocking index creation
>    - `ADD COLUMN ... DEFAULT value` (PostgreSQL 11+) — Instant with stored default
>
>    **Unsafe (locks table, causes downtime):**
>    - `ALTER COLUMN ... SET NOT NULL` — Requires full table scan
>    - `ALTER COLUMN ... TYPE` — Requires table rewrite
>    - `CREATE INDEX` (without CONCURRENTLY) — Blocks writes
>    - `DROP COLUMN` — May lock table briefly
>    - `ADD COLUMN ... DEFAULT value` with data backfill — Long-running for large tables
>
> 2. **Create migration helper** at `packages/db/src/migration/safe-migrate.ts`:
>
>    - `safeAddColumn(table, column, type, options)`:
>      - Adds column with NULL default (instant)
>      - If NOT NULL needed: add as nullable → backfill → set NOT NULL
>    - `safeCreateIndex(table, columns)`:
>      - Uses `CREATE INDEX CONCURRENTLY`
>      - Monitors progress
>    - `safeRenameColumn(table, oldName, newName)`:
>      - Create new column → backfill → update code → drop old column
>      - Multi-step migration across multiple deployments
>    - `backfillColumn(table, column, value, batchSize)`:
>      - Updates rows in batches of `batchSize` (default 1000)
>      - Pauses between batches to let normal operations proceed
>      - Logs progress: "Backfilled 5000/50000 rows..."
>
> 3. **Migration rollback scripts:**
>    - For every migration, create a corresponding rollback script
>    - `packages/db/src/migrations/rollback/` directory
>    - Naming convention: `001_create_users.sql` → `001_create_users.rollback.sql`
>    - Test rollback scripts before deploying migrations
>
> 4. **Migration pre-flight check:**
>    Create `packages/db/src/migration/pre-flight.ts`:
>    - Before running a migration, check:
>      - Current table sizes (rows) — warn if migrating a large table
>      - Active connections count — warn if many active connections
>      - Replication lag — warn if replicas are behind
>      - Estimate lock duration for the migration
>    - Print a safety report and require manual confirmation for unsafe operations
>
> 5. **CI integration:**
>    - Add migration safety check to CI pipeline
>    - Analyze the SQL in each migration file
>    - Flag unsafe operations (table locks, full scans)
>    - Require manual approval for flagged migrations

---

## 4.7 — API DOCUMENTATION & CONTRACTS (Tasks 162-165)

---

### Task 162: Generate OpenAPI/Swagger Spec from Route Handlers

**AI Prompt:**

> The Quiz Platform has 73+ API endpoints with no documentation. I need auto-generated OpenAPI (Swagger) documentation.
>
> 1. **Evaluate documentation approach:**
>    - **Option A: next-swagger-doc** — Auto-generate from JSDoc comments in route handlers
>    - **Option B: zod-to-openapi** — Generate from Zod schemas (already used for validation)
>    - **Option C: Manual OpenAPI spec** — Write YAML/JSON spec by hand
>    - **Recommended: Option B (zod-to-openapi)** — Leverages existing Zod schemas, stays in sync with validation
>
> 2. **Install `@asteasolutions/zod-to-openapi`** in `apps/api-server`
>
> 3. **Create OpenAPI registry** at `apps/api-server/src/lib/openapi/registry.ts`:
>    - Register all API routes with their:
>      - Path, method, summary, description
>      - Request body schema (Zod → OpenAPI)
>      - Response schemas for each status code
>      - Authentication requirements
>      - Tags (group by: Auth, Quiz, Admin, Public, System)
>    - Generate the full OpenAPI 3.1 spec as JSON
>
> 4. **Create Swagger UI endpoint:**
>    - `GET /api/docs` — Serves Swagger UI (interactive API documentation)
>    - `GET /api/docs/openapi.json` — Returns raw OpenAPI spec
>    - Only available in non-production environments (or behind admin auth in production)
>
> 5. **Document ALL 73+ endpoints** (this is the big task):
>    - Start with the most important: auth (7 endpoints), quiz (5 endpoints), admin (20+ endpoints)
>    - For each endpoint document:
>      - Summary and description
>      - Request parameters (path, query, body)
>      - Response shapes for 200, 400, 401, 403, 404, 422, 500
>      - Example request and response
>      - Authentication requirement
>
> 6. **Keep spec in sync:**
>    - Zod schemas are the source of truth
>    - When a Zod schema changes, the OpenAPI spec updates automatically
>    - Add CI check: verify OpenAPI spec is valid (no broken references)
>
> 7. **Export for external consumption:**
>    - Generate TypeScript client from OpenAPI spec (for external integrations)
>    - Generate Postman collection from OpenAPI spec

---

### Task 163: Add API Changelog and Deprecation Policy

**AI Prompt:**

> With API versioning (Task 100), I need a formal changelog and deprecation policy so consumers know what changed and how to migrate.
>
> 1. **Create `docs/api/CHANGELOG.md`:**
>    - Format: date-based entries grouped by version
>    - Categories per entry: Added, Changed, Deprecated, Removed, Fixed, Security
>    - Example:
>      ```
>      ## [v1] - 2024-01-15
>      ### Added
>      - POST /api/v1/quiz/start — Start a new exam
>      - GET /api/v1/quiz/results/:id — Get exam results
>      ### Changed
>      - GET /api/v1/admin/users — Now returns paginated response with cursor
>      ### Deprecated
>      - GET /api/v1/admin/users?page=N — Offset pagination deprecated, use cursor
>      ```
>
> 2. **Create `docs/api/DEPRECATION_POLICY.md`:**
>    - Minimum deprecation notice: 6 months before removal
>    - Deprecated endpoints return header: `Deprecation: true` and `Sunset: <date>`
>    - Document the migration path for each deprecation
>    - Communication: changelog update + email to known API consumers (if any)
>    - Versioning rule: breaking changes ONLY in new major versions (v1 → v2)
>
> 3. **Implement deprecation headers** at `apps/api-server/src/middleware/deprecation.middleware.ts`:
>    - Maintain a list of deprecated endpoints with sunset dates
>    - For each deprecated endpoint, add response headers:
>      - `Deprecation: true`
>      - `Sunset: Sat, 01 Jul 2025 00:00:00 GMT`
>      - `Link: <https://docs.example.com/migration>; rel="deprecation"`
>    - Log usage of deprecated endpoints (track how many consumers still use them)
>
> 4. **Create migration guides** for breaking changes:
>    - `docs/api/migrations/v1-to-v2.md` (template for future use)
>    - Include: what changed, code examples before/after, timeline
>
> 5. **Add changelog validation to CI:**
>    - If a PR modifies API route files, require a changelog entry
>    - Use a simple script that checks if `CHANGELOG.md` was modified in the PR

---

### Task 164: Create Architecture Decision Records (ADRs)

**AI Prompt:**

> Design decisions in the Quiz Platform are embedded in task history and code comments but not formally documented. I need Architecture Decision Records (ADRs) for all significant decisions.
>
> 1. **Create ADR template** at `docs/architecture/decisions/000-template.md`:
>    ```
>    # ADR-NNN: [Title]
>
>    ## Status
>    [Proposed | Accepted | Deprecated | Superseded by ADR-NNN]
>
>    ## Context
>    [What is the issue? What forces are at play?]
>
>    ## Decision
>    [What is the change we're making?]
>
>    ## Consequences
>    [What becomes easier? What becomes harder?]
>
>    ## Alternatives Considered
>    [What other options were evaluated?]
>    ```
>
> 2. **Write ADRs for all major past decisions** (retroactive documentation):
>
>    - `001-monorepo-with-pnpm-turborepo.md` — Why monorepo? Why pnpm + Turbo?
>    - `002-nextjs-for-all-apps.md` — Why Next.js for API server, web app, AND admin app?
>    - `003-neon-serverless-postgresql.md` — Why Neon? Why not Supabase, PlanetScale?
>    - `004-drizzle-orm.md` — Why Drizzle? Why not Prisma?
>    - `005-jwt-authentication.md` — Why JWT? Why not sessions? Token rotation strategy.
>    - `006-dual-admin-user-auth.md` — Why separate admin auth? Why separate JWT secrets?
>    - `007-upstash-redis-caching.md` — Why Upstash? Two-tier cache design rationale.
>    - `008-keyset-pagination-selection.md` — Why keyset pagination for question selection? SHA-256 anchors.
>    - `009-denormalized-results.md` — Why `resultsByDimension` table? Pre-calculated scoring rationale.
>    - `010-vercel-deployment.md` — Why Vercel? Serverless trade-offs.
>    - `011-zustand-state-management.md` — Why Zustand? Why not Redux, Jotai, Context?
>    - `012-event-sourcing-exam.md` — Why Event Sourcing for exams?
>    - `013-bullmq-async-processing.md` — Why BullMQ? Why not SQS, RabbitMQ?
>    - `014-cqrs-read-write-split.md` — Why CQRS? Read replica strategy.
>    - `015-repository-pattern.md` — Why Repository Pattern for data access?
>
> 3. **ADR index** at `docs/architecture/decisions/README.md`:
>    - Table of all ADRs with status, date, and one-line summary
>    - Link to each ADR
>
> 4. **ADR process documentation:**
>    - When to write an ADR (any decision affecting 3+ files or introducing new technology)
>    - How to propose an ADR (create as "Proposed", get team review)
>    - How to supersede an ADR (new ADR references old, old marked "Superseded")

---

### Task 165: Create Operational Runbooks

**AI Prompt:**

> The Quiz Platform has an incident response plan but no step-by-step operational runbooks for common scenarios. I need runbooks for every critical operation.
>
> Create the following runbooks in `docs/operations/runbooks/`:
>
> 1. **`incident-response.md`** — When an alert fires:
>    - Step 1: Acknowledge the alert
>    - Step 2: Assess severity (SEV1/2/3) based on impact criteria
>    - Step 3: Open incident channel (Slack or equivalent)
>    - Step 4: Diagnose using Grafana dashboards → Traces → Logs
>    - Step 5: Mitigate (rollback, feature flag, scale up)
>    - Step 6: Communicate status to stakeholders
>    - Step 7: Resolve and write postmortem
>    - Include: dashboard URLs, Sentry project URLs, Vercel project URLs
>
> 2. **`database-emergency.md`** — When the database is unhealthy:
>    - Connection pool exhaustion: how to identify and fix
>    - Slow query diagnosis: how to find and kill long-running queries
>    - Replication lag: how to check and remediate
>    - Migration failure: how to rollback a failed migration
>    - Full disk: how to identify and clean up space
>    - Include: useful SQL queries for each scenario
>
> 3. **`deployment-rollback.md`** — When a deployment goes wrong:
>    - Identify the bad deployment (Vercel dashboard or API)
>    - Rollback via Vercel UI (one-click)
>    - Rollback via CLI: `vercel rollback`
>    - Verify rollback succeeded (health checks, error rate)
>    - Disable feature flags if needed
>    - Post-rollback: how to fix and redeploy safely
>
> 4. **`scaling-response.md`** — When the system is under heavy load:
>    - Check current load (Grafana dashboard)
>    - Identify bottleneck (database, Redis, serverless function limits)
>    - Immediate actions: enable cache headers, disable non-critical features
>    - Medium-term: scale database (Neon compute scaling), upgrade Redis
>    - Post-event: review load test results, update capacity plan
>
> 5. **`security-incident.md`** — When a security issue is detected:
>    - Token reuse detected: revoke token family, notify user
>    - Brute force attack: verify rate limiting, check for bypasses
>    - Data breach suspected: isolate affected systems, preserve evidence
>    - Credential compromise: rotate all secrets, force password resets
>    - Include: contact list, legal requirements, communication templates
>
> 6. **`scheduled-maintenance.md`** — For planned maintenance:
>    - Pre-maintenance: notify users, enable maintenance page
>    - During: execute changes, monitor
>    - Post-maintenance: verify all services healthy, disable maintenance page
>    - Rollback plan if maintenance fails
>
> 7. **`new-team-member.md`** — Onboarding a new developer:
>    - Repository access setup
>    - Local development environment (Docker from Task 158)
>    - Key architecture concepts (link to ADRs from Task 164)
>    - Important files and modules to understand first
>    - How to deploy, how to rollback
>    - Access to monitoring dashboards, Sentry, Vercel
>
> Each runbook should be self-contained — a person following it at 3 AM during an incident should be able to resolve the issue without additional context. Include exact commands, URLs, and expected outputs.

---

## PHASE 4 COMPLETE

> **Total Tasks in Phase 4: 31 (#135-165)**
> After completing all 31 tasks, your platform will have:
> - Event-driven architecture with Event Sourcing and distributed event bus
> - Multi-region deployment with edge caching and regional read replicas
> - Real-time capabilities via SSE for timer sync, notifications, and live dashboards
> - Advanced reliability: bulkheads, load shedding, chaos engineering, graceful shutdown
> - Full observability platform: Grafana dashboards, Loki logs, Tempo traces, SLO monitoring, alerting
> - Infrastructure as Code with Docker, Pulumi, and secret management
> - Complete API documentation, ADRs, and operational runbooks
>
> **Estimated effort**: 20-30 weeks with focused development
> **Impact**: From "works for hundreds of thousands" to "FAANG-grade architecture for millions of global users"

---

## 📊 COMPLETE PROJECT SUMMARY

| Phase | Tasks | Timeline | Cumulative FAANG Score |
|-------|-------|----------|----------------------|
| **Phase 1: Critical Foundation** | 45 tasks (#1-45) | Weeks 1-4 | 26.5% → 45% |
| **Phase 2: Architectural Foundation** | 53 tasks (#46-98) | Months 2-3 | 45% → 60% |
| **Phase 3: Scale Preparation** | 36 tasks (#99-134) | Months 4-6 | 60% → 75% |
| **Phase 4: Enterprise FAANG-Grade** | 31 tasks (#135-165) | Months 7-12 | 75% → 85%+ |
| **TOTAL** | **165 tasks** | **~12 months** | **26.5% → 85%+ FAANG** |

---

*All 4 phase prompt files are available at `docs/prompts/`:*
- `PHASE-1-CRITICAL-FOUNDATION.md` (45 tasks)
- `PHASE-2-ARCHITECTURAL-FOUNDATION.md` (53 tasks)
- `PHASE-3-SCALE-PREPARATION.md` (36 tasks)
- `PHASE-4-ENTERPRISE-FAANG-GRADE.md` (31 tasks)
