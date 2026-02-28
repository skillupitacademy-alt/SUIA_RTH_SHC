# Observability Contract – Phase 1 (Future-Ready, Low Cost)

Audience: Eng/Infra/QA  
Goal: Standardize logs/metrics/errors now so any backend (Sentry, Grafana, Datadog) can be wired later with no rework.

## Scope and Golden Transactions
Track these as first-class “golden transactions” with IDs, durations, success/error:
- User: login, start exam, submit exam, view scorecard/report, download report.
- Admin: bulk upload questions, publish content, retry report, dashboard load.

## Tag / Field Schema (apply to logs, errors, metrics)
| Field           | Description                                       | Example                          |
|-----------------|---------------------------------------------------|----------------------------------|
| service         | logical app/service name                          | web-app, admin-app, api-server   |
| env             | environment                                      | dev, staging, prod               |
| version         | release/version (git sha or semver)               | 1.4.0 / a1b2c3d                  |
| requestId       | end-to-end request correlation ID                 | UUID                             |
| sessionId       | browser session token (non-PII)                   | UUID                             |
| userId          | hashed/opaque user identifier (no email)          | hash                             |
| route           | logical route or API path                         | /reports/[id], /api/quiz/submit  |
| path            | full path (client) or pathname (server)           | /reports/123?tab=score           |
| region          | deployment/edge region if available               | iad1, bom1                        |
| source          | emitter (web-app/admin-app/api-server/script)     | web-app                          |
| severity        | P0–P3 (see below)                                 | P1                               |
| outcome         | success / failure / timeout                       | success                          |
| duration_ms     | duration for the transaction/operation            | 842                              |
| component       | stack area (cache/db/queue/auth/etc.)             | db                               |
| error_code      | domain-specific code                              | EXAM_SUBMIT_CONFLICT             |

## Error Taxonomy (severity)
- P0: User-blocking, data loss risk (e.g., exam submission fails)
- P1: Feature broken, workaround exists (scorecard stale)
- P2: Degraded experience (slow page)
- P3: Cosmetic/non-impacting (minor UI glitch)

## Logging Contract (JSON)
- Structured JSON only; include the tag schema above on every log.
- No PII: strip emails, tokens, secrets. Hash userId if needed.
- Levels: debug, info, warn, error. Prod: keep warn/error; sample or drop debug/info.
- Include requestId and route on every server log; include sessionId/path on client logs.
- Retention: 7d debug (dev only), 30d info/warn, 90d error (adjust per backend cost).
- sessionId note: sessionId is a random analytics session UUID, never an auth token; do not log auth tokens.

## Metrics Naming Rules
- Canonical (dots, Datadog/StatsD): `quiz.<service>.<component>.<metric>` (e.g., `quiz.api.requests.count`)
- Prometheus-safe (underscores): `quiz_<service>_<component>_<metric>` (e.g., `quiz_api_requests_count`)
- Counters: `_count`; Gauges: `_value`; Durations: `_ms`; Percentiles: `_p95`.
- Tags: env, service, route/endpoint (normalized), outcome (success/error/timeout), status_code (if HTTP).
- Cardinality guardrail: never tag metrics with userId, requestId, examId (high-cardinality identifiers belong in logs/traces, not metrics).

## Traces / Request IDs
- Generate requestId at edge/server; return it in responses; forward it from clients on subsequent calls.
- If/when tracing is enabled, map requestId → traceId/spanId; keep names stable across vendors.

## Privacy and Scrubbing
- Never log: emails, auth tokens, passwords, raw request bodies with PII.
- Scrub obvious patterns (emails, Bearer tokens) in client and server log ingestion paths.

## Alerting Defaults (Phase 1)
- New issue in Sentry: alert on first occurrence for P0/P1 tags.
- Error rate spike: >1% of requests for any golden transaction over 5 minutes.
- Latency: p95 of golden transactions above agreed SLO (define per route when data arrives).
- Placeholder SLO targets (p95):
  - Login 99.9% < 500ms
  - Start Exam 99.95% < 800ms
  - Submit Exam 99.99% < 1000ms
  - View Scorecard 99.9% < 600ms
  - Admin Dashboard 99.5% < 2000ms

## Phased Tooling Plan
- Phase 1 (now): Sentry (errors/release health), Vercel Analytics (Web Vitals). Keep the above schema.
- Phase 2 (later): Grafana Cloud – ship logs to Loki, metrics to Prometheus, optional OTEL traces; no code changes required if schema is followed.
- Phase 3 (enterprise optional): Map the same fields to Datadog logs/metrics/traces; config-only migration.

## Implementation Checklist (when you choose to wire tools)
- Sentry: set DSN per app, release version, environment; attach requestId/sessionId/userId/hash; enable PII scrubbing; sampling: errors 100%, traces low to start.
- Vercel Analytics: enable in project settings; verify Web Vitals captured.
- RequestId propagation: ensure generated once per request; returned to clients; logged everywhere.
- Golden transactions: instrument duration + success/error metrics for the flows listed above.

## Ownership and Triage
- Weekly triage: review new P0/P1 issues; track MTTR.
- Keep alert recipients and escalation policy aligned with severity table.
