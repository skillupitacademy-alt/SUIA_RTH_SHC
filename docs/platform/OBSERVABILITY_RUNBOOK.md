# Observability Runbook — Phase 1 Optimized

## Goals
- Detect failures early, reduce MTTR, and provide high-precision auditability.
- 100% coverage of "Golden Transactions" for hyper-scale monitoring.

## Active Signals
1.  **Logs**: Structured JSON with `requestId`, `sessionId`, and `userId`. Redacted PII via `scrubPII`.
2.  **Metrics**: Dual-format (dot & underscore) metrics exported to Sentry and ready for Prometheus/Grafana.
3.  **Traces**: Standardized `X-Request-ID` propagation across all API boundaries.
4.  **Security**: `SecurityMuzzle` active in production to silence noise and protect secrets.

## Golden Transactions & SLO Targets
| Transaction | Metric Key | Target (p95+) |
| :--- | :--- | :--- |
| **Login** | `auth.login` | < 500ms (p99.9) |
| **Start Exam** | `quiz.api.start` | < 800ms (p99.95) |
| **Submit Exam** | `quiz.api.submit` | < 1000ms (p99.99) |
| **View Scorecard** | `reports.api.view` | < 600ms (p99.9) |
| **Admin Dashboard** | `admin.api.dashboard_load` | < 2000ms (p99.5) |

## Core Dashboards
- **Enterprise Dashboard**: Stored in `packages/observability/monitoring/dashboards/golden-transactions.json`.
- **Latency Panels**: Tracking p50, p95, and p99.9 for all core routes.
- **Error Rates**: Tracking total failure rate vs success rate (Target: < 0.1%).

## Alerting Policy
- **High Error Rate**: Alert if API error rate > 1% over 5m.
- **SLO Violation**: Alert if p99 latency exceeds the targets above.
- **Scoring Lag**: Alert if queue lag > 2 minutes (Metric: `scoring_queue_lag_seconds`).
- **Autosave Reliability**: Alert if autosave failure rate > 0.5%.

## Incident Triage Steps
1) **Identify**: Check the `X-Request-ID` from the failing response.
2) **Correlate**: Search Sentry or logs for the specific `requestId`.
3) **Isolate**: Check "Latency by Route" to see if a specific third-party (Redis/DB) is the bottleneck.
4) **Recover**: Roll back if a deployment spike is detected; clear caches via `/api/admin/clear-cache` if needed.

## Standards
- All new routes MUST be wrapped with `withLogging`.
- Standardized Response Header: `X-Duration-Ms`.
- No PII in logs or metric tags.
