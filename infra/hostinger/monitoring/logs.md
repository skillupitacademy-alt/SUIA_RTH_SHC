# Log Plan

Status: implementation reference.

## Log Sources

- Nginx access logs.
- Nginx error logs.
- Docker container logs.
- Application structured logs.
- Cloudflare request analytics.
- Cloudflare Worker logs if API Worker is retained.

## Retention Targets

| Log type | Local retention |
| --- | --- |
| Nginx access | 14 days |
| Nginx error | 30 days |
| Container logs | 7 to 14 days |
| Incident exports | keep with incident record |

Loki local retention is currently configured for 7 days. Increase it only after confirming disk headroom.

## Review Requirements

- Ensure logs do not contain secrets.
- Ensure auth tokens are not emitted.
- Confirm Docker log rotation is active.
- Confirm available disk can handle retention.
- Confirm Loki does not ingest secrets from application logs.
