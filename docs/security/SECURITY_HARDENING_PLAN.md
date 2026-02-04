# Security Hardening Plan

Top risks (current)
- /api/migrate is public by code path.
- Access tokens stored in localStorage.
- Factory endpoints are not admin-gated.

Hardening steps
1) Remove /api/migrate from public routes.
2) Require an internal secret or remove the route entirely in production.
3) Move access tokens to httpOnly cookies.
4) Enforce admin role checks on factory routes.
5) Add strict input validation and schema checks on all write endpoints.
6) Add audit logs for admin actions and sensitive updates.

Access token migration (minimal steps)
- Server sets access token as httpOnly, secure cookie on login and refresh.
- Client stops reading accessToken from localStorage.
- API client relies on cookies for auth and refresh.
- Remove accessToken persistence from Zustand stores.
- Validate CSRF still passes with cookie-based auth.

Authentication
- Short-lived access tokens.
- Refresh tokens in httpOnly cookies.
- Token rotation with reuse detection.

Authorization
- Centralized RBAC checks for all admin endpoints.
- Ownership checks for exam operations.

Data protection
- Encrypt PII at rest.
- Minimize PII in logs.
- Use secrets manager for keys.

Operational security
- WAF and DDoS protection at edge.
- Per-tenant rate limiting.
- Vulnerability scanning in CI.
