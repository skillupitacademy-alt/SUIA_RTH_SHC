# Platform Observability Guide

This guide outlines the observability standards, configurations, and operational procedures for the Quiz Platform.

## 1. Environment Variable Requirements

The following variables are mandatory for full observability compliance in `dev`, `stage`, and `prod`.

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend | Public DSN for `web-app` and `admin-app`. |
| `SENTRY_AUTH_TOKEN` | CI/CD | Required for uploading sourcemaps. |
| `UPSTASH_REDIS_REST_URL` | API | REST endpoint for Redis metrics sink. |
| `UPSTASH_REDIS_REST_TOKEN` | API | Auth token for Redis access. |
| `QSTASH_TOKEN` | API | Token for async analytics tasks. |
| `INTERNAL_API_KEY` | Admin | Required for secure admin-to-api communication. |
| `LOG_LEVEL` | All | `debug`, `info`, `warn`, or `error`. Defaults to `warn` in prod. |

## 2. Sentry Project Setup

To get your Sentry credentials:
1. **Sign up** at [sentry.io](https://sentry.io/signup/).
2. **Create a New Project**: Choose **Next.js** as the platform.
3. **Get DSN**: 
   - Go to **Project Settings** -> **Client Keys (DSN)**.
   - Copy the value for `NEXT_PUBLIC_SENTRY_DSN`.
4. **Get Auth Token**:
   - Go to **User Settings** -> **Developer Settings** -> **New Internal Integration**.
   - Give it a name (e.g., `Quiz CI`) and save.
   - Copy the `SENTRY_AUTH_TOKEN`.
5. **Paste into `.env.local`**: Use your local environment file for testing.

## 3. Golden Transactions & SLOs

We track 5 "Golden Transactions" with specific latency and availability targets.

| Transaction | p95 Target | SLO |
|-------------|------------|-----|
| Login | < 500ms | 99.9% |
| Start Exam | < 800ms | 99.95% |
| Submit Exam | < 1000ms | 99.99% |
| View Scorecard | < 600ms | 99.9% |
| Admin Dashboard | < 2000ms | 99.5% |

## 3. Monitoring-as-Code

Alert and dashboard definitions are stored as code in `packages/observability/monitoring/`.

- **Alerts**: [alerts.yml](file:///d:/onlinewebsites/quiz-platform/packages/observability/monitoring/alerts.yml)
- **Dashboards**: [golden-transactions.json](file:///d:/onlinewebsites/quiz-platform/packages/observability/monitoring/dashboards/golden-transactions.json)

## 4. Operation & Verification

### Request ID Correlation
Every API response includes an `X-Request-ID`. This ID is automatically:
1. Logged in structured JSON on the server.
2. Tagged in Sentry error reports.
3. Attached to client-side telemetry events.

### Client-Side Metrics
Metrics reported via `recordCounter` or `recordTimer` are batched (2s or 10 items) and sent to `/api/telemetry` to minimize network overhead.

### Security & Privacy
Production logs are muzzled to prevent PII leaks. `console.log/info/debug` are suppressed while `warn/error` are preserved. No PII (emails, raw tokens) should ever be emitted in metrics or logs.

## 5. How to Verify

### API Instrumentation
Verify the presence of correlation headers using curl:
```bash
curl -I https://your-api.com/api/status
# Look for X-Request-ID and X-Duration-Ms
```

### Error Correlation
Trigger a test error and check Sentry for:
- `requestId` and `sessionId` tags.
- Breadcrumbs showing the user path leading to the error.
- Correct `service` and `env` labels.
