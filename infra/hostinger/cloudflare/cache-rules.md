# Cloudflare Cache Rules

Status: planning reference only.

## Cache Static Assets

Candidate rule:

- Match paths containing `/_next/static/`
- Cache eligibility: cache
- Edge TTL: 1 month or reviewed release policy
- Browser TTL: respect origin or reviewed browser TTL

## Bypass Dynamic And Auth Paths

Bypass cache for:

- `/api/*`
- `/auth/*`
- `/admin/*`
- `/dashboard*`
- `/profile*`
- `/payment*`
- `/webhooks*`

## Review Notes

Do not cache authenticated HTML responses unless application headers explicitly support it.
