# 09 - OBSERVABILITY
## Monitoring, Logging, Tracing, and Alerting

---

## **1. OVERVIEW**

### **1.1 Observability Pillars**

```
┌─────────────────────────────────────────────────────────────┐
│ THREE PILLARS OF OBSERVABILITY                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. METRICS                                                 │
│     ├─ What: Numerical measurements over time               │
│     ├─ Examples: Request rate, error rate, latency          │
│     ├─ Tools: Prometheus, Grafana, Cloud Monitoring         │
│     └─ Use: Dashboards, alerts, capacity planning           │
│                                                             │
│  2. LOGS                                                    │
│     ├─ What: Discrete events with context                   │
│     ├─ Examples: "User logged in", "Payment failed"         │
│     ├─ Tools: Cloud Logging, ELK Stack, Loki                │
│     └─ Use: Debugging, audit trail, troubleshooting         │
│                                                             │
│  3. TRACES                                                  │
│     ├─ What: Request journey across services                │
│     ├─ Examples: API Gateway → BFF → Services               │
│     ├─ Tools: OpenTelemetry, Jaeger, Cloud Trace            │
│     └─ Use: Performance optimization, bottleneck detection  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **2. DISTRIBUTED TRACING**

### **2.1 Why Distributed Tracing?**

In microservices, a single user request touches multiple services:

```
User Request: "Load Dashboard"
├─ API Gateway (10ms)
│   └─ SkillUp BFF (50ms)
│       ├─ Identity Service (20ms)
│       ├─ Tutorial Service (100ms)  ← SLOW!
│       ├─ Exam Service (30ms)
│       └─ Placement Service (40ms)
└─ Total: 250ms

Without tracing: "Dashboard is slow" (no idea why)
With tracing: "Tutorial Service taking 100ms" (clear bottleneck)
```

### **2.2 OpenTelemetry Implementation**

**Install OpenTelemetry**:

```bash
npm install @opentelemetry/api \
            @opentelemetry/sdk-node \
            @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-http
```

**Initialize Tracing**:

```typescript
// tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'identity-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'https://api.honeycomb.io/v1/traces',
    headers: {
      'x-honeycomb-team': process.env.HONEYCOMB_API_KEY
    }
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false  // Disable file system instrumentation
      }
    })
  ]
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

**Start Application with Tracing**:

```typescript
// index.ts
import './tracing';  // Must be first import
import express from 'express';

const app = express();

app.get('/users/:id', async (req, res) => {
  // Automatically traced by OpenTelemetry
  const user = await getUserById(req.params.id);
  res.json(user);
});

app.listen(8080);
```

### **2.3 Custom Spans**

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('identity-service');

async function getUserById(userId: string) {
  // Create custom span
  const span = tracer.startSpan('getUserById', {
    attributes: {
      'user.id': userId
    }
  });
  
  try {
    // Database query (automatically traced)
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    // Add attributes to span
    span.setAttribute('user.found', !!user);
    span.setAttribute('user.email', user?.email);
    
    return user;
  } catch (error) {
    // Record error in span
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    // End span
    span.end();
  }
}
```

### **2.4 Trace Context Propagation**

```typescript
// API Gateway forwards trace context to services
import { propagation, context } from '@opentelemetry/api';

async function callIdentityService(userId: string) {
  // Extract current trace context
  const currentContext = context.active();
  
  // Inject trace context into HTTP headers
  const headers: Record<string, string> = {};
  propagation.inject(currentContext, headers);
  
  // Make request with trace headers
  const response = await fetch(`${IDENTITY_SERVICE_URL}/users/${userId}`, {
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}
```

### **2.5 Trace Visualization**

```
Trace ID: 7f8a9b2c3d4e5f6g

┌─────────────────────────────────────────────────────────────┐
│ API Gateway                                    [10ms]       │
│ ├─ Authenticate                                [5ms]        │
│ └─ Route to BFF                                [5ms]        │
└─────────────────────────────────────────────────────────────┘
    │
    ├─────────────────────────────────────────────────────────┐
    │ SkillUp BFF                                [50ms]       │
    │ ├─ Parse GraphQL query                     [5ms]        │
    │ ├─ Call Identity Service                   [20ms]       │
    │ ├─ Call Tutorial Service                   [100ms] ⚠️   │
    │ ├─ Call Exam Service                       [30ms]       │
    │ ├─ Call Placement Service                  [40ms]       │
    │ └─ Compose response                        [5ms]        │
    └─────────────────────────────────────────────────────────┘
        │
        ├─────────────────────────────────────────────────────┐
        │ Identity Service                       [20ms]       │
        │ ├─ Query database                      [15ms]       │
        │ └─ Format response                     [5ms]        │
        └─────────────────────────────────────────────────────┘
        │
        ├─────────────────────────────────────────────────────┐
        │ Tutorial Service                       [100ms] ⚠️   │
        │ ├─ Query database                      [80ms] ⚠️    │
        │ ├─ Fetch images from CDN               [15ms]       │
        │ └─ Format response                     [5ms]        │
        └─────────────────────────────────────────────────────┘

Total Duration: 250ms
Bottleneck: Tutorial Service database query (80ms)
```

---

## **3. CENTRALIZED LOGGING**

### **3.1 Structured Logging**

```typescript
// logger.ts
import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const loggingWinston = new LoggingWinston({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'identity-service',
    version: process.env.VERSION,
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Cloud Logging for production
    loggingWinston
  ]
});
```

**Usage**:

```typescript
// Log with context
logger.info('User logged in', {
  userId: 'user-123',
  tenantId: 'skillup',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Log error with stack trace
try {
  await processPayment(paymentData);
} catch (error) {
  logger.error('Payment processing failed', {
    error: error.message,
    stack: error.stack,
    userId: paymentData.userId,
    amount: paymentData.amount
  });
}

// Log with trace context
import { trace } from '@opentelemetry/api';

const span = trace.getActiveSpan();
const traceId = span?.spanContext().traceId;

logger.info('Processing request', {
  traceId: traceId,
  userId: userId
});
```

### **3.2 Log Levels**

```typescript
// ERROR: Something failed, needs immediate attention
logger.error('Database connection failed', { error: error.message });

// WARN: Something unexpected, but not critical
logger.warn('API rate limit approaching', { current: 950, limit: 1000 });

// INFO: Important business events
logger.info('User registered', { userId: user.id, email: user.email });

// DEBUG: Detailed information for debugging
logger.debug('Cache hit', { key: cacheKey, ttl: 3600 });

// TRACE: Very detailed information (usually disabled)
logger.trace('Function called', { function: 'getUserById', args: { userId } });
```

### **3.3 Log Correlation**

```typescript
// Middleware to add request ID to all logs
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  const traceId = req.headers['x-cloud-trace-context']?.split('/')[0];
  
  asyncLocalStorage.run({ requestId, traceId }, () => {
    // Add to response headers
    res.setHeader('x-request-id', requestId);
    
    // Log request
    logger.info('Request received', {
      requestId: requestId,
      traceId: traceId,
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    
    next();
  });
});

// Use in logs
function someFunction() {
  const context = asyncLocalStorage.getStore();
  
  logger.info('Processing data', {
    requestId: context.requestId,
    traceId: context.traceId
  });
}
```

### **3.4 Log Queries**

```sql
-- Cloud Logging queries

-- Find all errors in last hour
resource.type="cloud_run_revision"
severity="ERROR"
timestamp>="2024-01-01T10:00:00Z"

-- Find logs for specific user
resource.type="cloud_run_revision"
jsonPayload.userId="user-123"

-- Find slow requests (>1s)
resource.type="cloud_run_revision"
jsonPayload.duration>1000

-- Find logs for specific trace
resource.type="cloud_run_revision"
trace="projects/project-id/traces/7f8a9b2c3d4e5f6g"
```

---

## **4. METRICS AND MONITORING**

### **4.1 Key Metrics**

**RED Metrics** (Request-focused):
- **Rate**: Requests per second
- **Errors**: Error rate (%)
- **Duration**: Response time (p50, p95, p99)

**USE Metrics** (Resource-focused):
- **Utilization**: CPU, memory usage (%)
- **Saturation**: Queue depth, wait time
- **Errors**: Error count

**Business Metrics**:
- User registrations per hour
- Course enrollments per day
- Exam completion rate
- Revenue per day

### **4.2 Prometheus Metrics**

```typescript
// metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// Request counter
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

// Request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

// Business metrics
export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['tenant'],
  registers: [register]
});

export const courseEnrollments = new Counter({
  name: 'course_enrollments_total',
  help: 'Total number of course enrollments',
  labelNames: ['tenant', 'course_id'],
  registers: [register]
});
```

**Middleware to collect metrics**:

```typescript
app.use((req, res, next) => {
  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();
  
  res.on('finish', () => {
    // Decrement active connections
    activeConnections.dec();
    
    // Record request
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode
    };
    
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### **4.3 Grafana Dashboards**

```yaml
# grafana-dashboard.json
{
  "dashboard": {
    "title": "Identity Service",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total[5m])"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "container_memory_usage_bytes / container_spec_memory_limit_bytes"
          }
        ]
      }
    ]
  }
}
```

---

## **5. ALERTING**

### **5.1 Alert Rules**

```yaml
# alerting-rules.yml
groups:
  - name: identity-service
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
          service: identity-service
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 1%)"
      
      # High response time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
          service: identity-service
        annotations:
          summary: "High response time detected"
          description: "P95 response time is {{ $value }}s (threshold: 1s)"
      
      # Service down
      - alert: ServiceDown
        expr: up{job="identity-service"} == 0
        for: 1m
        labels:
          severity: critical
          service: identity-service
        annotations:
          summary: "Service is down"
          description: "Identity service has been down for more than 1 minute"
      
      # High CPU usage
      - alert: HighCPUUsage
        expr: |
          rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 10m
        labels:
          severity: warning
          service: identity-service
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value | humanizePercentage }} (threshold: 80%)"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 10m
        labels:
          severity: warning
          service: identity-service
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }} (threshold: 90%)"
      
      # Database connection pool exhausted
      - alert: DatabasePoolExhausted
        expr: |
          database_pool_active_connections / database_pool_max_connections > 0.9
        for: 5m
        labels:
          severity: critical
          service: identity-service
        annotations:
          summary: "Database connection pool exhausted"
          description: "{{ $value | humanizePercentage }} of database connections in use"
```

### **5.2 Alert Channels**

```yaml
# alertmanager.yml
global:
  slack_api_url: 'https://hooks.slack.com/services/xxx'

route:
  receiver: 'default'
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  
  routes:
    # Critical alerts go to PagerDuty
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true
    
    # All alerts go to Slack
    - match_re:
        severity: (critical|warning)
      receiver: 'slack'

receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://localhost:5001/'
  
  - name: 'slack'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        send_resolved: true
  
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'xxx'
        description: '{{ .GroupLabels.alertname }}'
```

### **5.3 On-Call Rotation**

```yaml
# oncall-schedule.yml
schedules:
  - name: primary
    timezone: Asia/Singapore
    layers:
      - start: 2024-01-01T00:00:00
        rotation_type: weekly
        users:
          - alice@example.com
          - bob@example.com
          - charlie@example.com
  
  - name: secondary
    timezone: Asia/Singapore
    layers:
      - start: 2024-01-01T00:00:00
        rotation_type: weekly
        users:
          - david@example.com
          - eve@example.com

escalation_policies:
  - name: default
    rules:
      - escalation_delay_in_minutes: 0
        targets:
          - type: schedule
            id: primary
      
      - escalation_delay_in_minutes: 15
        targets:
          - type: schedule
            id: secondary
      
      - escalation_delay_in_minutes: 30
        targets:
          - type: user
            id: manager@example.com
```

---

## **6. SLO/SLA TRACKING**

### **6.1 Service Level Objectives**

```yaml
# slo.yml
slos:
  - name: identity-service-availability
    description: Identity service should be available 99.9% of the time
    target: 0.999
    window: 30d
    indicator:
      type: availability
      query: |
        sum(rate(http_requests_total{status!~"5.."}[5m])) /
        sum(rate(http_requests_total[5m]))
  
  - name: identity-service-latency
    description: 95% of requests should complete within 500ms
    target: 0.95
    window: 30d
    indicator:
      type: latency
      query: |
        histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) < 0.5
  
  - name: identity-service-error-rate
    description: Error rate should be below 0.1%
    target: 0.999
    window: 30d
    indicator:
      type: error_rate
      query: |
        1 - (sum(rate(http_requests_total{status=~"5.."}[5m])) /
             sum(rate(http_requests_total[5m])))
```

### **6.2 Error Budget**

```
SLO: 99.9% availability over 30 days

Total time: 30 days = 43,200 minutes
Allowed downtime: 0.1% = 43.2 minutes

Error budget remaining:
├─ Week 1: 43.2 - 5 = 38.2 minutes (5 min downtime)
├─ Week 2: 38.2 - 10 = 28.2 minutes (10 min downtime)
├─ Week 3: 28.2 - 0 = 28.2 minutes (no downtime)
└─ Week 4: 28.2 - 15 = 13.2 minutes (15 min downtime)

Status: 13.2 minutes remaining (30% of budget)
Action: Slow down feature releases, focus on stability
```

---

## **7. INCIDENT MANAGEMENT**

### **7.1 Incident Response Process**

```
┌─────────────────────────────────────────────────────────────┐
│ INCIDENT RESPONSE PROCESS                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Detection (0-5 minutes)                                 │
│     ├─ Alert fires                                          │
│     ├─ On-call engineer notified                            │
│     └─ Acknowledge alert                                    │
│                                                             │
│  2. Triage (5-15 minutes)                                   │
│     ├─ Assess severity                                      │
│     ├─ Create incident channel                              │
│     ├─ Assign incident commander                            │
│     └─ Notify stakeholders                                  │
│                                                             │
│  3. Investigation (15-60 minutes)                           │
│     ├─ Check logs and traces                                │
│     ├─ Identify root cause                                  │
│     ├─ Determine fix strategy                               │
│     └─ Update stakeholders                                  │
│                                                             │
│  4. Mitigation (60-120 minutes)                             │
│     ├─ Apply fix or rollback                                │
│     ├─ Verify fix works                                     │
│     ├─ Monitor for recurrence                               │
│     └─ Update stakeholders                                  │
│                                                             │
│  5. Resolution (120+ minutes)                               │
│     ├─ Confirm incident resolved                            │
│     ├─ Close incident                                       │
│     ├─ Schedule post-mortem                                 │
│     └─ Thank team                                           │
│                                                             │
│  6. Post-Mortem (1-3 days later)                            │
│     ├─ Write incident report                                │
│     ├─ Identify action items                                │
│     ├─ Assign owners                                        │
│     └─ Track to completion                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **7.2 Incident Severity Levels**

```
SEV-1 (Critical)
├─ Service completely down
├─ Data loss or corruption
├─ Security breach
└─ Response: Immediate, all hands on deck

SEV-2 (High)
├─ Major feature broken
├─ High error rate (>5%)
├─ Significant performance degradation
└─ Response: Within 30 minutes

SEV-3 (Medium)
├─ Minor feature broken
├─ Moderate error rate (1-5%)
├─ Some users affected
└─ Response: Within 2 hours

SEV-4 (Low)
├─ Cosmetic issue
├─ Low error rate (<1%)
├─ Few users affected
└─ Response: Next business day
```

---

## **8. SUMMARY**

### **8.1 Key Takeaways**

✅ **Distributed Tracing**
- OpenTelemetry for tracing
- Trace context propagation
- Identify bottlenecks quickly

✅ **Centralized Logging**
- Structured logging with Winston
- Cloud Logging integration
- Log correlation with trace IDs

✅ **Metrics and Monitoring**
- Prometheus for metrics
- Grafana for dashboards
- RED and USE metrics

✅ **Alerting**
- Alert on SLO violations
- Multiple alert channels
- On-call rotation

✅ **SLO/SLA Tracking**
- Define clear SLOs
- Track error budget
- Make data-driven decisions

### **8.2 Implementation Checklist**

- [ ] Set up OpenTelemetry tracing
- [ ] Implement structured logging
- [ ] Export metrics to Prometheus
- [ ] Create Grafana dashboards
- [ ] Define alert rules
- [ ] Set up alert channels (Slack, PagerDuty)
- [ ] Define SLOs for each service
- [ ] Create incident response runbook
- [ ] Set up on-call rotation
- [ ] Test alerting and incident response

---

**Next Document**: 10-MIGRATION-PLAN.md (Detailed week-by-week migration plan)

