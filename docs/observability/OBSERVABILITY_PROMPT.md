# AI Prompt - Implement Observability Runbook

Use this prompt when asking an AI to implement or audit observability against our standards.

---

You are a senior observability engineer. Apply the **Observability Runbook** (`docs/platform/OBSERVABILITY_RUNBOOK.md`) and the **Observability Contract** (`docs/observability/OBSERVABILITY_CONTRACT.md`) to this repo. Deliver code and configs that are production-safe.

Scope
- All three apps: `web-app`, `admin-app`, `api-server`.
- Logging, metrics, tracing, alerts, dashboards per the runbook/contract.

Hard requirements
1) Request ID propagation end-to-end; return it in responses; log it everywhere (including error reports).
2) Structured JSON logs with fields: service, env, version, requestId, sessionId, userId (hashed/opaque), route/path, region, severity (P0–P3), outcome, duration_ms, component, error_code. Redact PII (emails, tokens); sessionId is analytics-only, never an auth token.
3) Minimal instrumentation: response header `x-request-id`; log method, path, status, latencyMs, userId, examId (where relevant); counters for launch/autosave/submit/score; timers for launch/autosave/submit.
4) Golden transactions: login, start exam, submit exam, view score/report, download report; admin bulk upload/publish/report retry/dashboard load.
5) SLO targets (p95 placeholders): Login 99.9% <500ms; Start Exam 99.95% <800ms; Submit Exam 99.99% <1000ms; View Scorecard 99.9% <600ms; Admin Dashboard 99.5% <2000ms. Expose SLIs for latency, error rate, availability.
6) Alerts (initial): error rate >1% (5m), launch p95 >500ms (10m), autosave failure >0.5%, scoring queue lag >2m.
7) Dashboards: API health (p50/p95/p99, error rate by endpoint), session health, scoring pipeline (queue depth, worker lag), admin health (query latency, error rate).
8) Metrics naming & cardinality: emit both dot form (`quiz.<service>.<component>.<metric>`) and Prometheus-safe underscore form (`quiz_<service>_<component>_<metric>`); tags must be bounded—no userId/requestId/examId on metrics.
9) Privacy & scrubbing: enforce scrubbing patterns; no PII in logs/metrics/traces.
10) Retention: baseline 7d debug (dev only), 30d info/warn, 90d error (adjust per backend).

Implementation guidance
- Config-first: keep field names/tag schema identical to the contract so future backends (Grafana/Datadog) are config-only swaps.
- Sampling: errors 100%; traces low until volume justifies more; make it env-configurable.
- Default backends now: Sentry for errors, Vercel Analytics for Web Vitals. Keep code backend-agnostic so Grafana/Datadog can be added later.
- Provide alert definitions as code or JSON/YAML compatible with the chosen backend.
- Error boundaries: wrap each Next.js app with a Sentry (or equivalent) error boundary and attach requestId + sessionId to captured exceptions.

Deliverables
- Code/config changes that meet the hard requirements.
- README-style notes on how to run, verify, and where to see logs/metrics/traces.
- List missing env vars/secrets with placeholders.

Quality bar
- No lint/type/build regressions.
- No new eslint disables.
- Tests or smoke instructions for critical flows (launch, autosave, submit, score).
