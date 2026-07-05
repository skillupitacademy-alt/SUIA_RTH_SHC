# Cloudflare WAF And Rate Limit Rules

Status: planning reference only.

## Candidate WAF Rules

- Challenge obvious bot traffic on API and auth hosts.
- Block requests with known malicious payload signatures.
- Restrict admin paths by geography or IP allowlist only if operationally acceptable.
- Protect upload/report endpoints with body-size and method rules.

## Candidate Rate Limits

| Scope | Suggested starting point |
| --- | --- |
| Login endpoints | stricter per-IP and per-account limits |
| Password reset | strict per-IP limits |
| Public search | moderate per-IP limits |
| API write paths | moderate per-user and per-IP limits |
| Health endpoints | allow but monitor |

## Review Notes

WAF and rate limits must be tested against real login, quiz, admin, and faculty flows before enforcement.
