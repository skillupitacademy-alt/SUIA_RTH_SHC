# Observability Runbook

Goals
- Detect failures early, reduce MTTR, and provide auditability.

Signals
- Logs: structured JSON with request id and user id.
- Metrics: latency, error rate, throughput, saturation.
- Traces: distributed tracing across gateway, services, DB.

Core dashboards
- API health: p50/p95/p99 latency, error rate by endpoint.
- Session health: active sessions, autosave rate, submit rate.
- Scoring pipeline: queue depth, worker lag.
- Admin health: dashboard query latency, error rate.

Alerts
- Error rate > 1% for 5 minutes.
- Launch p95 > 500ms for 10 minutes.
- Autosave failure rate > 0.5%.
- Scoring queue lag > 2 minutes.

Minimal instrumentation (what to add first)
- Add requestId to every API response header.
- Log: method, path, status, latencyMs, userId, examId.
- Emit counters for launch, autosave, submit, score.
- Emit timers for launch, autosave, submit.

Incident steps
1) Identify affected endpoints and region.
2) Roll back recent deployments if needed.
3) Drain queue or scale workers.
4) Communicate status to stakeholders.

Logging standards
- Redact PII.
- Include tenant id, user id, request id.

SLOs
- 99.95% for exam endpoints.
- 99.9% for admin endpoints.
