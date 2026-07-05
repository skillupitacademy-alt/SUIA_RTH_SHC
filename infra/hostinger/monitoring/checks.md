# Monitoring Checks

Status: implementation reference.

## Public HTTP Checks

| Host | Path | Expected |
| --- | --- | --- |
| `user.realtutorialhub.com` | `/` | `200` |
| `admin.realtutorialhub.com` | `/` | `200` or reviewed auth redirect |
| `api.realtutorialhub.com` | `/api/health/live` | `200` |
| `user.skillupitacademy.com` | `/` | `200` |
| `admin.skillupitacademy.com` | `/api/healthz` | `200` |
| `faculty.skillupitacademy.com` | `/api/healthz` | `200` |
| `quiz.skillhubcore.in` | `/` | `200` |
| `tutorial.skillhubcore.in` | `/` | `200` |
| `placement.skillhubcore.in` | `/api/healthz` | `200` |
| `admin.skillhubcore.in` | `/api/healthz` | `200` |
| `api.skillhubcore.in` | `/healthz/` | `200` |

`placement.skillhubcore.in` remains excluded from VPS cutover and should be tracked as a separate Cloud Run dependency until placement validation is approved.

## Internal Container Checks

Every Compose service should expose a health status. `verify.sh` and `health.sh` should fail if any container is unhealthy.

## External Dependency Checks

- Neon/Postgres connection.
- Upstash Redis REST connection.
- Upstash Vector if enabled.
- R2 object access if enabled.
- Resend API reachability.
- Cloudflare Worker route health if API Worker is retained.

## Migration-Specific Checks

During cutover, monitor both:

- VPS target endpoints.
- Existing Cloud Run rollback endpoints.

## Dashboard Access Check

After starting monitoring:

```bash
curl -fsS http://127.0.0.1:9090/-/ready
curl -fsS http://127.0.0.1:3009/api/health
curl -fsS http://127.0.0.1:3100/ready
```
