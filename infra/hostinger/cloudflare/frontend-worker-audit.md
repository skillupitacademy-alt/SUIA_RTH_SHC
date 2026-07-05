# Frontend Worker Audit

Status: implementation guidance for retaining the Cloudflare Worker in front of frontend hosts.

## Summary

The frontend Worker should be retained for the first Hostinger migration because it performs more than a raw pass-through proxy. The immediate migration target should be:

```text
Browser
Cloudflare Worker
origin-*.domain
Hostinger VPS Nginx
Docker containers
```

This avoids the Cloudflare route-removal blocker and preserves the edge behavior already used in production.

## Current Frontend Worker Responsibilities

| Responsibility | Current implementation | Keep in Worker? | Notes |
| --- | --- | --- | --- |
| Host-based routing | `ROUTING_TABLE` maps public frontend hosts to upstream services. | Yes | Useful for multi-brand routing and rollback. |
| Auth/API path rewrite on user hosts | `/auth` and `/health` on user frontend hosts rewrite to `EXAM_SERVICE_URL`. | Yes | Avoids changing frontend auth URL assumptions during migration. |
| Brand detection | `resolveBrandFromHostname()` sets brand from hostname. | Yes | Keeps brand behavior centralized. |
| Brand/platform headers | Worker injects `X-Brand` and `X-Platform`. | Yes | Apps and APIs rely on brand context. |
| Original host preservation | Proxy sets `X-Original-Host` and `X-Forwarded-Host`. | Yes | Important for cookies and multi-domain behavior. |
| Request/correlation IDs | Worker creates/forwards `X-Request-ID` and `X-Correlation-ID`. | Yes | Useful for tracing through Nginx and app logs. |
| Cookie forwarding | Worker forwards incoming cookies to upstreams. | Yes | Required for BFF/auth flows. |
| Device headers | Worker forwards `X-Device-ID` and `X-Device-Name`. | Yes | Useful for session/device tracking. |
| CORS handling | Global CORS middleware runs before route handling. | Yes | Keep edge behavior stable. |
| Rate-limit middleware | Global rate-limit middleware runs before route handling. | Review later | It is currently part of the edge contract. |
| Static asset caching | Not implemented in the inspected Worker code. | No current action | Can be added later if needed. |
| Localization/A-B testing | Not implemented in the inspected Worker code. | No current action | Keep out of this migration. |

## Recommendation

Retain frontend Worker routes and change frontend upstreams from Cloud Run URLs to reviewed VPS origin hostnames after these prerequisites are complete:

1. Create `origin-*` frontend DNS records.
2. Install a Cloudflare Origin Certificate covering the `origin-*` frontend hostnames.
3. Deploy Nginx config with `origin-*` server aliases.
4. Validate every origin hostname through Cloudflare and with direct VPS SNI checks.
5. Update Worker frontend upstream variables to the origin hostnames.
6. Deploy Worker.
7. Validate public frontend login flows.

Do not point Worker frontend upstreams at the public frontend hostnames. That would create a Worker routing loop.

## Target Frontend Origin Mapping

| Worker variable | Current role | Target VPS origin |
| --- | --- | --- |
| `TUTORIAL_SERVICE_URL` | RealTutorialHub user and tutorial frontend | `https://origin-user.realtutorialhub.com` |
| `RTH_ADMIN_URL` | RealTutorialHub admin | `https://origin-admin.realtutorialhub.com` |
| `SKILLUP_WEB_URL` | SkillUp user | `https://origin-user.skillupitacademy.com` |
| `SKILLUP_ADMIN_URL` | SkillUp admin | `https://origin-admin.skillupitacademy.com` |
| `FACULTY_URL` | SkillUp faculty | `https://origin-faculty.skillupitacademy.com` |
| `QUIZ_WEB_URL` | Shared quiz frontend | `https://origin-quiz.skillhubcore.in` |

`tutorial.skillhubcore.in` currently shares `TUTORIAL_SERVICE_URL`. If RealTutorialHub user and SkillHub tutorial need independent origins later, add a dedicated `TUTORIAL_WEB_URL` binding before switching.

`PLACEMENT_URL` should use `https://origin-placement.skillhubcore.in` after placement validation. The public `placement.skillhubcore.in/*` Worker route remains in place.

## Operational Decision

The previous direct-DNS frontend cutover path remains documented as a fallback, but the recommended path is now retained frontend Worker with VPS origins.
