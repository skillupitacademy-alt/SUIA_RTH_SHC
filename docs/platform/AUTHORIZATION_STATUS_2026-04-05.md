# Platform Authorization Status

Date: 2026-04-05

This document reflects the actual repository state after the April 2026 authorization hardening work. It replaces older audit notes that marked multiple services as "unknown" or "partially fixed" before the code audit was completed.

## Current Status

- `apps/skillup-web`: fixed
  Student APIs now require verified user auth and no longer trust `x-shadow-user-id` or a fallback demo student.
- `apps/api-server`: standardized
  Admin routes now use the shared `requireAdminRouteAccess()` path, with the session endpoints remaining intentionally custom.
- `apps/realtutorialhub-admin`: cleaned up
  Session expiry and access-denied UX now share a single modal-driven flow instead of multiple competing redirects.
- `apps/faculty-app`: audited
  Faculty routes already enforce verified user auth and faculty-role checks.
- `apps/skillhub-placement`: audited
  Placement handoff and protected pages already rely on verified token/SSO checks.
- `services/skillhubcore-service`: audited
  Internal gateway protection and JWT middleware are already in place.

## Remaining Work

- Live rollout still depends on pushing and deploying the latest commit.
- End-to-end browser verification still depends on the availability of valid credentials for each brand portal.
- Observability dashboards and alerts need to be wired into the real metrics backend if Prometheus/Grafana ingestion is desired beyond code-as-config.

## Verification Commands

```bash
pnpm lint:all
pnpm typecheck:all
pnpm test:all
pnpm build:all
```

## Workflow Scope

These checks and fixes apply to the Cloud Run deployment workflow defined in:

- [deploy-cloudrun.yml](file:///d:/onlinewebsites/quiz-platform/.github/workflows/deploy-cloudrun.yml)
