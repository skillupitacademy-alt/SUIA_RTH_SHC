# Phase 12: Observability & Monitoring Stack
## docs/blueprints/PHASE-12-OBSERVABILITY.md

> Deployment: OCI free tier (Grafana + Prometheus + Loki + Tempo)
> All services emit telemetry via OpenTelemetry

---

## Part 1: Observability Stack

```
┌─────────────────────────────────────────────────────────┐
│  OCI COMPUTE (free: 2 AMD OCPU + 12GB RAM)              │
│                                                         │
│  Grafana      → dashboards + alerting                   │
│  Prometheus   → metrics scraping + storage              │
│  Loki         → log aggregation                         │
│  Tempo        → distributed trace storage               │
│  Alertmanager → alert routing (→ PagerDuty / Telegram)  │
└─────────────────────────────────────────────────────────┘
        ↑ pulls metrics          ↑ receives logs + traces
┌─────────────────────────────────────────────────────────┐
│  ALL SERVICES (exam, tutorial, payment, etc.)           │
│  → OpenTelemetry SDK (traces + metrics)                 │
│  → Pino logger → Loki transport                         │
│  → Prometheus endpoint: /metrics                        │
└─────────────────────────────────────────────────────────┘
```

---

## Part 2: OpenTelemetry Setup Per Service

```typescript
// services/*/src/lib/telemetry.ts
// Add to each service's entry point (before any other imports)

import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const sdk = new NodeSDK({
  serviceName: process.env.SERVICE_NAME,  // 'exam-service', 'tutorial-service', etc.
  traceExporter: new OTLPTraceExporter({
    url: `${process.env.TEMPO_URL}/v1/traces`,
  }),
  metricReader: new PrometheusExporter({ port: 9464 }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-redis': { enabled: true },
    })
  ]
})

sdk.start()

// Manual spans for business-critical operations:
import { trace } from '@opentelemetry/api'
const tracer = trace.getTracer(process.env.SERVICE_NAME!)

// Example in ExamEngine:
async function scoreExam(examId: string) {
  const span = tracer.startSpan('exam.score')
  span.setAttribute('exam.id', examId)
  try {
    const result = await ScoringEngine.calculate(examId)
    span.setAttribute('exam.score', result.totalScore)
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.recordException(error)
    span.setStatus({ code: SpanStatusCode.ERROR })
    throw error
  } finally {
    span.end()
  }
}
```

---

## Part 3: Pino → Loki Integration

```typescript
// packages/logger/src/index.ts
import pino from 'pino'
import { LokiOptions } from 'pino-loki'

export function createLogger(serviceName: string) {
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: {
      service: serviceName,
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    },
    redact: {
      paths: ['password', 'token', 'authorization', 'card_number',
              'cvv', 'pan', '*.password', '*.token'],
      censor: '[REDACTED]'
    },
  }, pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        level: 'debug',
        options: { colorize: true },
        // Dev only
      },
      {
        target: 'pino-loki',
        level: 'info',
        options: {
          host: process.env.LOKI_URL,
          labels: { service: serviceName, env: process.env.NODE_ENV },
          batching: true,
          interval: 5,
        } as LokiOptions,
      }
    ]
  }))
}

// Usage in every service:
export const logger = createLogger(process.env.SERVICE_NAME!)
```

---

## Part 4: Prometheus Metrics Per Service

```typescript
// packages/logger/src/metrics.ts
import { Counter, Histogram, Registry } from 'prom-client'

export function createMetrics(serviceName: string) {
  const registry = new Registry()
  registry.setDefaultLabels({ service: serviceName })

  return {
    // RED metrics (Rate, Errors, Duration) — standard for every service
    requestsTotal: new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [registry]
    }),
    requestDuration: new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
      registers: [registry]
    }),
    // Business metrics
    examsStarted: new Counter({
      name: 'exams_started_total',
      help: 'Total exam sessions started',
      registers: [registry]
    }),
    examsCompleted: new Counter({
      name: 'exams_completed_total',
      help: 'Total exam sessions completed',
      labelNames: ['status'],
      registers: [registry]
    }),
    contentBlocksCompleted: new Counter({
      name: 'tutorial_blocks_completed_total',
      help: 'Tutorial content blocks completed',
      labelNames: ['block_type', 'domain'],
      registers: [registry]
    }),
    paymentProcessed: new Counter({
      name: 'payments_processed_total',
      help: 'Payments processed',
      labelNames: ['gateway', 'status'],
      registers: [registry]
    }),
    // Infrastructure metrics
    dbQueryDuration: new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration',
      labelNames: ['query_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [registry]
    }),
    cacheHitTotal: new Counter({
      name: 'cache_hit_total',
      help: 'Cache hits vs misses',
      labelNames: ['cache_type', 'result'],
      registers: [registry]
    }),
    registry
  }
}
```

---

## Part 5: Grafana Dashboards

```
Dashboard 1: Platform Overview
  - Total requests/min (all services)
  - Error rate % (all services)
  - p95 latency (all services)
  - Active exam sessions (real-time)
  - Payments processed today

Dashboard 2: Exam Engine
  - Exams started/hour
  - Exams completed/hour
  - Scoring queue depth (QStash)
  - Exam p95 submission latency
  - ScoringEngine processing time

Dashboard 3: Tutorial Engine
  - Content blocks completed/hour per domain
  - AI Tutor messages/hour
  - Upstash Vector query latency
  - Content generation jobs pending

Dashboard 4: Payment Engine
  - Payments processed/day (by gateway)
  - Payment success rate %
  - Overdue installments count
  - Revenue today (INR + USD)

Dashboard 5: Infrastructure
  - Neon connection pool utilization per DB
  - Upstash Redis memory usage
  - QStash message backlog
  - Cloudflare Gateway request rate

Dashboard 6: SLO Tracking
  - Availability % (target: 99.9%)
  - Error budget remaining
  - p95 latency SLO (target: < 300ms for exam submit)
  - Alert: SLO breach in last 24h
```

---

## Part 6: SLO Definitions

```yaml
# SLOs per service
exam-service:
  availability:    99.9%    # 8.7h downtime/year max
  p95_latency:     300ms    # exam submission
  p99_latency:     1000ms
  error_rate:      0.1%

tutorial-service:
  availability:    99.5%
  p95_latency:     200ms    # content fetch (cached)
  ai_tutor_p95:    2000ms   # first streaming token

payment-service:
  availability:    99.95%   # highest — financial
  p95_latency:     500ms
  webhook_process: 5000ms   # Razorpay expects < 5s

api-gateway:
  availability:    99.99%   # Cloudflare Workers SLA
  p95_latency:     50ms     # edge routing only
```

---

## Part 7: Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: critical
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels: { severity: critical }
        annotations:
          summary: "{{ $labels.service }} is DOWN"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "Error rate > 5% on {{ $labels.service }}"

      - alert: ExamScoringQueueBacklog
        expr: qstash_queue_depth{queue="score-exam"} > 100
        for: 5m
        labels: { severity: warning }

      - alert: PaymentWebhookFailed
        expr: increase(payments_processed_total{status="failed"}[10m]) > 5
        for: 0m
        labels: { severity: critical }

      - alert: NeonConnectionPoolHigh
        expr: neon_pool_connections_used / neon_pool_connections_max > 0.8
        for: 2m
        labels: { severity: warning }

# Alert routing → Telegram bot (free) + PagerDuty (for critical)
```

---

## Part 8: OCI Deployment

```bash
# docker-compose.yml on OCI instance
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  loki:
    image: grafana/loki:latest
    ports: ["3100:3100"]
    volumes: [loki_data:/loki]

  tempo:
    image: grafana/tempo:latest
    ports: ["3200:3200", "4317:4317"]
    volumes: [tempo_data:/tmp/tempo]

  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_SERVER_DOMAIN=monitoring.yourplatform.com
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards

  alertmanager:
    image: prom/alertmanager:latest
    ports: ["9093:9093"]
    volumes: [./alertmanager.yml:/etc/alertmanager/alertmanager.yml]
```

---

## Part 9: Verification

```
□ All 6 services emit metrics to Prometheus (scrape /metrics)
□ Pino logs visible in Loki within 10 seconds of log emission
□ Traces visible in Tempo with correct service attribution
□ Grafana Platform Overview dashboard loads correctly
□ Alert fires within 5 minutes of service going down
□ Alert resolves when service recovers
□ PII redacted in all logs (no passwords, tokens, card numbers)
□ p95 latency SLO breach triggers critical alert
□ OCI instance has sufficient RAM (Prometheus + Loki + Grafana ≈ 4–6GB)
□ Dashboard accessible at monitoring.yourplatform.com (Cloudflare proxy)
```

---

*Phase: 12-OBSERVABILITY | Status: Ready*
