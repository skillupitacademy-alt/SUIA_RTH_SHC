# Environment Variable Requirements: Observability Stack

This document outlines the mandatory environment variables required to achieve 100% platform observability and operational compliance.

## 1. Monitoring & Error Tracking (Sentry)
Mandatory for frontend/backend correlation and crash reporting.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Public DSN for `web-app` and `admin-app`. (e.g., `https://...@o...ingest.sentry.io/...`) |
| `SENTRY_AUTH_TOKEN` | Required for uploading sourcemaps during CI/CD. (Get from Sentry Organization Settings) |

## 2. Real-time Telemetry (Upstash / Redis)
Required for global rate limiting and real-time metric buffering.

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | REST endpoint for the Redis instance. |
| `UPSTASH_REDIS_REST_TOKEN` | REST token for the Redis instance. |

## 3. Async Task Governance (QStash)
Required for reliable analytics propagation and report generation.

| Variable | Description |
|----------|-------------|
| `QSTASH_TOKEN` | Auth token for Upstash QStash. |
| `QSTASH_CURRENT_SIGNING_KEY` | Signing key for verifying incoming webhooks. |

## 4. Log Management
| Variable | Description |
|----------|-------------|
| `LOG_LEVEL` | Defaults to `warn` in production. Set to `debug` for verbose debugging. |

> [!IMPORTANT]
> Failure to set these variables will result in "Observability Gaps" where metrics will be recorded locally but not exported to the global sinks.
