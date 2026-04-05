# CSRF Cross-Subdomain Audit

Date: 2026-04-05

## Summary
The original save-button failure was a shared RealTutorialHub platform issue, not nine separate frontend proxy issues.

What was actually broken:
- `@quiz/api-server` was issuing refreshed `csrfToken` cookies without always preserving the shared parent-domain context.
- `@quiz/api-client` treated all `403` responses as hard forbidden states, so a recoverable CSRF mismatch surfaced as a fake global `Access Denied` failure.

What is fixed:
- [proxy.ts](/d:/onlinewebsites/quiz-platform/apps/api-server/src/proxy.ts)
- [fetch-client.ts](/d:/onlinewebsites/quiz-platform/packages/api-client/src/core/fetch-client.ts)
- [proxy.test.ts](/d:/onlinewebsites/quiz-platform/apps/api-server/src/__tests__/proxy.test.ts)
- [fetch-client.retry.test.ts](/d:/onlinewebsites/quiz-platform/packages/api-client/src/core/__tests__/fetch-client.retry.test.ts)

Production verification already completed after deploying commit `9ccdb6e2`:
- RealTutorialHub admin Domain edit/save works.
- RealTutorialHub admin Question edit/save works.
- Normal login page no longer shows the stale default session-expired message on plain `/login`.

## Audit Result
The checklist assumption that each frontend app `proxy.ts` needed the same CSRF middleware was incorrect for this repo.

Why:
- Most app `proxy.ts` files are page/auth guards only.
- They do not issue or validate CSRF tokens for cross-subdomain API writes.
- The shared browser mutation path that failed was `realtutorialhub-admin -> api.realtutorialhub.com` via `@quiz/api-client`.

## Findings By App

### Fixed
- `@quiz/api-server`
  - Owns CSRF issuance/validation for the affected RealTutorialHub cross-subdomain API writes.
  - Now sets refreshed `csrfToken` cookies using the resolved request hostname so the shared parent domain stays consistent.

- `@quiz/realtutorialhub-admin`
  - Uses the shared `@quiz/api-client` for cross-subdomain admin mutations.
  - No extra frontend proxy CSRF middleware is required.
  - Covered by the shared client retry logic and the `api-server` shared-domain fix.

### Audited, no extra server-side proxy fix required
- `@quiz/realtutorialhub-quiz`
  - Uses shared `@quiz/api-client` for user-side API mutations.
  - The client-side CSRF recovery now applies here as well.

- `@quiz/realtutorialhub-web`
  - Direct browser API calls are mostly auth/public endpoints or same-origin local API routes.
  - No matching cross-subdomain save workflow needing the `api-server` CSRF middleware pattern was found.

- `@quiz/skillup-admin`
  - Save forms post to same-origin `/api/admin/*` app routes.
  - This is not the same browser-to-`api.*` cross-subdomain mutation path that failed in RealTutorialHub admin.

- `@quiz/skillhubcore-admin`
  - Uses same-origin app API routes and its own cookie/auth flow.
  - No matching CSRF cookie drift pattern found.

- `@quiz/faculty-app`
  - Browser mutations go to same-origin `/api/faculty/*` routes.
  - Upstream forwarding is server-to-server, not browser cross-subdomain save traffic.

- `@quiz/skillup-web`
  - Cross-subdomain browser calls are mostly login/register/reset/verify flows.
  - Protected student interactions are same-origin app routes.
  - No matching cross-subdomain save failure pattern found in this audit.

### Not applicable to this bug class
- `@quiz/skillhub-placement`
  - Current browser flow is mainly auth handoff/placement bridge setup.
  - No comparable cross-subdomain save workflow using the shared API client was found.

## Operational Conclusion
The correct permanent fix for this bug class in the current codebase is:
- keep the shared-domain CSRF issuance fix in `@quiz/api-server`
- keep the shared CSRF retry/403 suppression fix in `@quiz/api-client`
- do not blindly copy `api-server` CSRF middleware into every frontend app `proxy.ts`

## Repeatable Audit
A small audit script was added so this status can be rechecked:
- [audit-csrf-cross-subdomain.mjs](/d:/onlinewebsites/quiz-platform/scripts/audit-csrf-cross-subdomain.mjs)

Run:

```powershell
corepack pnpm audit:csrf-cross-subdomain
```
