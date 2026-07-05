# Log Plan

Status: planning reference only.

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

## Review Requirements

- Ensure logs do not contain secrets.
- Ensure auth tokens are not emitted.
- Confirm Docker log rotation is active.
- Confirm available disk can handle retention.
