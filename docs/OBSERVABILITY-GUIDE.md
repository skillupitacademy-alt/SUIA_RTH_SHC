# 🔍 Observability Guide

## Overview

The auth system now has comprehensive observability across all layers:
- Gateway (Cloudflare)
- API Server
- BFF (Backend-for-Frontend)
- RBAC (Role-Based Access Control)

All logs are structured JSON for easy parsing in production.

---

## Log Tags

### Authentication

**`AUTH_SUCCESS`** — User authenticated successfully
```json
{
  "tag": "AUTH_SUCCESS",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid",
  "userId": "user-123",
  "brand": "skillup",
  "roles": ["user"],
  "path": "/api/profile"
}
```

**`AUTH_FAILURE`** — Authentication failed
```json
{
  "tag": "AUTH_FAILURE",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid",
  "reason": "MISSING_COOKIE",
  "path": "/api/profile",
  "brand": "skillup"
}
```

### RBAC

**`RBAC_AUDIT`** — Permission check result
```json
{
  "tag": "RBAC_AUDIT",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "userId": "user-123",
  "roles": ["user"],
  "permission": "PROFILE_READ",
  "result": "GRANTED"
}
```

### API

**`API_REQUEST_START`** — Request received
```json
{
  "tag": "API_REQUEST_START",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid",
  "path": "/api/profile",
  "method": "GET",
  "brand": "skillup",
  "userId": "user-123"
}
```

**`API_RESPONSE`** — Request completed
```json
{
  "tag": "API_RESPONSE",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid",
  "status": 200,
  "duration": 45
}
```

**`API_ERROR`** — Request failed
```json
{
  "tag": "API_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid",
  "error": "Database connection failed",
  "status": 500
}
```

### Performance

**`PERF_API`** — API latency
```json
{
  "tag": "PERF_API",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid",
  "path": "/api/profile",
  "duration": 45
}
```

**`INTERNAL_FETCH`** — BFF → API call
```json
{
  "tag": "INTERNAL_FETCH",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "url": "https://api.skillup.com/auth/profile",
  "method": "GET",
  "internal": true,
  "duration": 32,
  "userId": "user-123",
  "brand": "skillup"
}
```

### Gateway

**`GATEWAY_REQUEST`** — Gateway routing
```json
{
  "tag": "GATEWAY_REQUEST",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid",
  "path": "/api/profile",
  "brand": "skillup",
  "roles": ["user"],
  "action": "FORWARD"
}
```

---

## Querying Logs

### Find all auth failures for a brand
```bash
grep '"tag":"AUTH_FAILURE"' logs.json | grep '"brand":"skillup"'
```

### Find all RBAC denials
```bash
grep '"tag":"RBAC_AUDIT"' logs.json | grep '"result":"DENIED"'
```

### Find slow requests (>1000ms)
```bash
grep '"tag":"PERF_API"' logs.json | jq 'select(.duration > 1000)'
```

### Trace a specific request
```bash
grep '"requestId":"abc-123"' logs.json | jq .
```

---

## Production Monitoring

### Critical Alerts

1. **High auth failure rate**
   - Alert if `AUTH_FAILURE` > 5% of requests
   - Indicates cookie/session issues

2. **RBAC denials spike**
   - Alert if `RBAC_AUDIT` with `DENIED` spikes
   - Indicates permission misconfiguration

3. **Slow API responses**
   - Alert if p95 latency > 500ms
   - Indicates performance degradation

### Dashboards

**Auth Health**
- Auth success rate by brand
- Auth failure reasons
- Active users by brand

**RBAC Audit**
- Permission checks by type
- Denial rate by permission
- Top denied permissions

**Performance**
- API latency p50/p95/p99
- Request rate by endpoint
- Error rate by endpoint

---

## Debugging Workflows

### User reports "can't access dashboard"

1. Find their requests:
   ```bash
   grep '"userId":"user-123"' logs.json | tail -20
   ```

2. Check auth status:
   ```bash
   grep '"userId":"user-123"' logs.json | grep '"tag":"AUTH_'
   ```

3. Check RBAC:
   ```bash
   grep '"userId":"user-123"' logs.json | grep '"tag":"RBAC_AUDIT"'
   ```

### Brand-specific issue

1. Filter by brand:
   ```bash
   grep '"brand":"skillup"' logs.json | grep '"tag":"AUTH_FAILURE"'
   ```

2. Check cookie domain:
   ```bash
   grep '"brand":"skillup"' logs.json | grep 'cookie'
   ```

### Performance investigation

1. Find slow endpoints:
   ```bash
   grep '"tag":"PERF_API"' logs.json | jq 'select(.duration > 500)'
   ```

2. Trace internal calls:
   ```bash
   grep '"requestId":"abc-123"' logs.json | grep '"tag":"INTERNAL_FETCH"'
   ```

---

## Best Practices

1. **Always include requestId** — Enables request tracing
2. **Log at decision points** — Auth, RBAC, routing
3. **Include context** — userId, brand, roles
4. **Structured JSON** — Easy to parse and query
5. **No PII in logs** — Never log passwords, tokens, emails

---

## Next Steps

### Add to GCP Logging
```typescript
import { Logging } from '@google-cloud/logging';

const logging = new Logging();
const log = logging.log('auth-system');

export function logEvent(tag: string, data: any) {
  const entry = log.entry({
    resource: { type: 'global' },
    severity: 'INFO',
  }, { tag, ...data });
  
  log.write(entry);
}
```

### Add Alerting
```yaml
# alerting-rules.yaml
- alert: HighAuthFailureRate
  expr: rate(auth_failure_total[5m]) > 0.05
  annotations:
    summary: "High auth failure rate detected"
```

### Add Dashboards
- Grafana dashboard for auth metrics
- Real-time monitoring of RBAC decisions
- Performance tracking by brand
