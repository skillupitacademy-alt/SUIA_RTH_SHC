# Queue + Gateway + Worker Architecture Draft

Audience: internal platform engineers. Scope: sketch concrete changes to support async scoring, edge protection, and deployment scaffold without breaking current code paths.

## 1) Worker Package (draft skeleton)
- **Location**: `apps/worker` (new).
- **Runtime**: Node 20, TypeScript; runs as a long-lived consumer.
- **Dependencies**: `@aws-sdk/client-sqs`, `p-retry`, `pino`, `@quiz/db` (shared schema + scoring logic), `dotenv` (local dev only).
- **Entry**: `src/index.ts` (pseudo below).
- **Config** (env):
  - `SQS_QUEUE_URL` (required)
  - `SQS_WAIT_TIME=20` (seconds long poll)
  - `SQS_BATCH_SIZE=10`
  - `SQS_VISIBILITY_TIMEOUT=30` (seconds; set to ~3x p95 scoring)
  - `DATABASE_URL` (write pool)
  - `REDIS_URL|UPSTASH_REDIS_REST_URL` (optional for status fan-out)
- **Flow**:
  1. poll SQS (long-poll).
  2. parse message `{ examId, userId, submitTs }`.
  3. guard: re-fetch exam, must be `processing`; else delete message.
  4. call `ScoringEngine.calculateExamResults(examId)` (reuse existing module, but move to shared package import if needed).
  5. update `exams.status` to `completed` or `failed`; set `completedAt`, `totalScore` already computed.
  6. emit lightweight event `{ examId, status, score }` via Redis pubsub or log for downstream.
  7. ack message; on failure, `changeMessageVisibility` with backoff; after N retries let DLQ capture.

```ts
// apps/worker/src/index.ts (outline)
import { SQSClient, ReceiveMessageCommand, DeleteMessageBatchCommand, ChangeMessageVisibilityCommand } from '@aws-sdk/client-sqs';
import pRetry from 'p-retry';
import { ScoringEngine } from '@quiz/api-server/lib/scoring-worker-bridge';
import { db, exams } from '@quiz/db';

async function handle(msg) {
  const body = JSON.parse(msg.Body ?? '{}');
  if (!body.examId) return 'drop';
  const exam = await db.query.exams.findFirst({ where: (exams, { eq }) => eq(exams.id, body.examId) });
  if (!exam || exam.status !== 'processing') return 'delete';
  await ScoringEngine.calculateExamResults(body.examId);
  return 'delete';
}

async function loop() { /* poll + batch delete */ }
loop().catch(err => { console.error(err); process.exit(1); });
```

Notes:
- Keep worker stateless; scale horizontally off queue depth; use DLQ alarms.
- Separate npm script: `pnpm --filter @quiz/worker dev|start`.

## 2) API Changes (submit + status) — draft contract
- **Submit** (`POST /api/quiz/submit`):
  - Validate ownership/idempotency as today.
  - Instead of calling `ScoringEngine` inline, enqueue to SQS with message `{ examId, userId, idempotencyKey, submittedAt }`.
  - Response: `202 Accepted` + body `{ examId, status: 'processing', statusUrl: '/api/quiz/status/:examId' }`.
  - Store idempotency key `submit:<key>` in `idempotency_keys` (already supported).
- **Status** (`GET /api/quiz/status/:id`):
  - Reads `exams` row, returns `{ status, totalScore?, completedAt? }`.
  - Cache 30s in Redis; fall back to DB.
- **Config**: `SQS_QUEUE_URL` required; refuse startup without it. `REDIS_URL` required for rate limit + cache to be global.

## 3) Gateway/WAF Config (minimum viable)
- **Front door**: Cloudflare or AWS CloudFront + AWS WAF.
- **Rules**:
  - Block `/api/migrate` from internet (allow only VPN/CIDR).
  - JWT presence + exp check at edge (cache JWKS 5m); otherwise 401 before hitting origin.
  - Rate limit (token bucket) per IP: auth 200 rps, submit 50 rps, other 300 rps; burst 3x.
  - Bot Fight / UA anomaly on; geo block for admin paths.
- **Routing**:
  - `/api/*` ? Next API origin (regional); `/static`/assets via CDN cache; `/worker-metrics` blocked.
- **Headers**: add `Request-Id` at edge, forward to origin; expect app to log it.

## 4) Infra Skeleton (Terraform bullets)
- Providers: `aws`.
- Resources:
  - `aws_sqs_queue` quiz-submit, `redrive_policy` to DLQ; encryption SSE-SQS.
  - `aws_iam_role` worker exec with SQS consume/delete perms; policy for CloudWatch logs.
  - Optional `aws_elasticache_replication_group` (Redis 1–2 shard) or configure Upstash creds as secrets.
  - `aws_cloudwatch_metric_alarm` on `ApproximateAgeOfOldestMessage` and DLQ message count.
  - `aws_wafv2_web_acl` with rate-based rules + block list; attach to ALB/CloudFront.
  - (Later) `aws_cloudfront_distribution` with origin to ALB/Next, cache behaviors, WAF association.

## 5) Migration / Rollout Plan (safe)
1. Provision SQS + DLQ and secrets; add env vars to API + worker.
2. Deploy worker service; dark-launch with no producers yet; observe health.
3. Ship API change: submit enqueues, status endpoint live; keep old scoring behind env flag `SYNC_SCORING=false`.
4. Enable flag in staging; load test submit+status; watch queue lag/DB CPU.
5. Enable in production; remove `/api/migrate` exposure; enforce Redis required.
6. Add dashboards/alerts (queue age, DLQ count, submit 5xx, status p95).

## 6) Minimal tasks to start coding
- Scaffold `apps/worker` with package.json, tsconfig, src/index.ts using above outline.
- Refactor `ScoringEngine` into a shared importable module for both API and worker.
- Add `POST /api/quiz/status/[id]/route.ts` using cached DB read.
- Gate API boot on `SQS_QUEUE_URL` + `UPSTASH_REDIS_REST_URL` in production.
