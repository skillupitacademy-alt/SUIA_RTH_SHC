# Hostinger VPS Domain Routing Matrix

Status: implemented for staging validation; retained Worker-to-VPS origin cutover pending explicit approval.

Target platform:

- VPS OS: Ubuntu 24.04 LTS
- Public edge: Cloudflare
- Cloudflare SSL mode: Full (Strict)
- Origin TLS: Cloudflare Origin Certificate on Nginx
- Container exposure: internal Docker network only
- Public ports: Nginx only, `80` and `443`
- Migration scope: current `asia-southeast1` stack only
- GCP artifacts: leave existing Cloud Run, Cloud Build, and GitHub deployment artifacts untouched

## Public Domain Matrix

| Domain | Public role | Target app/service | Container port | Current Cloud Run service | Notes |
| --- | --- | --- | ---: | --- | --- |
| `user.realtutorialhub.com` | RTH user portal and tutorial app | Worker -> `origin-user.realtutorialhub.com` -> `realtutorialhub-web` | 3003 | `realtutorialhub-web` | Keep Worker for initial cutover. |
| `admin.realtutorialhub.com` | RTH admin portal | Worker -> `origin-admin.realtutorialhub.com` -> `realtutorialhub-admin` | 3002 | `quiz-admin-app` | Keep Worker for initial cutover. |
| `api.realtutorialhub.com` | RTH API gateway/API surface | retained Cloudflare Worker -> `origin-api.realtutorialhub.com` -> `api-server` | 3000 | `quiz-api-server` | Keep Worker for initial cutover. |
| `user.skillupitacademy.com` | SkillUp user portal | Worker -> `origin-user.skillupitacademy.com` -> `skillup-web` | 3004 | `skillup-web` | Keep Worker for initial cutover. |
| `admin.skillupitacademy.com` | SkillUp admin portal | Worker -> `origin-admin.skillupitacademy.com` -> `skillup-admin` | 3005 | `skillup-admin` | Keep Worker for initial cutover. |
| `faculty.skillupitacademy.com` | SkillUp faculty portal | Worker -> `origin-faculty.skillupitacademy.com` -> `faculty-app` | 3006 | `faculty-app` | Keep Worker for initial cutover. |
| `api.skillupitacademy.com` | SkillUp API gateway/API surface | retained Cloudflare Worker -> `origin-api.realtutorialhub.com` -> `api-server` | 3000 | `quiz-api-server` | Keep Worker for initial cutover. |
| `quiz.skillhubcore.in` | Shared quiz/exam engine | Worker -> `origin-quiz.skillhubcore.in` -> `realtutorialhub-quiz` | 3001 | `quiz-web-app` | Keep Worker for initial cutover. |
| `tutorial.skillhubcore.in` | Shared tutorial engine | Worker -> `origin-tutorial.skillhubcore.in` -> `realtutorialhub-web` | 3003 | `realtutorialhub-web` | Needs dedicated Worker binding before split from RTH user origin. |
| `placement.skillhubcore.in` | Shared placement app | `skillhub-placement` | 3008 | `skillhub-placement` | Excluded from current cutover; user-facing placement behavior is not validated. |
| `admin.skillhubcore.in` | SkillHub super admin | `skillhubcore-admin` | 3000 | `skillhubcore-admin` | Also has Cloud Run domain mapping today. |
| `api.skillhubcore.in` | SkillHubCore API | retained Cloudflare Worker -> `origin-api.skillhubcore.in` -> `skillhubcore-service` | 3000 | `skillhubcore-service` | Keep Worker for initial cutover. |

## Cloudflare Worker Impact

The active Worker configuration is `services/api-gateway/wrangler.toml`.

The reviewed retained-Worker cutover configuration should keep routes for:

- `user.realtutorialhub.com/*`
- `admin.realtutorialhub.com/*`
- `user.skillupitacademy.com/*`
- `admin.skillupitacademy.com/*`
- `faculty.skillupitacademy.com/*`
- `api.skillupitacademy.com/*`
- `api.realtutorialhub.com/*`
- `api.skillhubcore.in/*`
- `quiz.skillhubcore.in/*`
- `tutorial.skillhubcore.in/*`
- `placement.skillhubcore.in/*`

Before cutover, choose one routing model:

| Model | Frontend hosts | API hosts | Pros | Risks |
| --- | --- | --- | --- | --- |
| A. Direct Nginx for all hosts | Cloudflare DNS `A` records to VPS | Cloudflare DNS `A` records to VPS | Simplest VPS topology | Bypasses Worker route rewriting/auth forwarding unless Nginx reproduces it. |
| B. Direct Nginx for frontend, Worker for API | DNS to VPS | Worker remains active | Preserves API gateway behavior | Requires removing Worker routes for frontend hosts only. |
| C. Worker for all public hosts, VPS as origin | Worker proxies to VPS origin hostnames | Worker proxies to VPS origin hostnames | Minimal public routing behavior change | Requires origin-only hostnames to avoid Worker loops. |

Approved first production cutover model: Model C.

Reason: frontend and API behavior remain stable at Cloudflare while compute moves to the VPS. This also avoids the Worker route-removal permission blocker.

Initial target flow:

```text
Frontend requests
Cloudflare
Cloudflare Worker
VPS origin hostnames
VPS Nginx
Frontend containers

API requests
Cloudflare
Cloudflare Worker
VPS Nginx
API containers
```

This preserves existing Worker routing, authentication, route rewriting, brand resolution, and gateway forwarding behavior while moving compute away from Cloud Run.

## Proposed Nginx Responsibilities

Nginx should:

- terminate Cloudflare Origin Certificate TLS
- listen publicly on `80` and `443`
- redirect HTTP to HTTPS
- trust Cloudflare IP ranges only for real client IP headers
- reverse proxy to Docker service names on the internal network
- support WebSocket upgrades
- set conservative security headers
- avoid exposing app containers directly
- use per-host access/error logs
- implement request/body limits appropriate for uploads and reports

Nginx should not:

- store application secrets
- connect directly to databases
- replace Cloudflare Worker auth/rewrite behavior without a separate review
- expose upstream container ports on the host

## Proposed Docker Network Model

| Network | Public? | Members |
| --- | --- | --- |
| `edge` | yes, through Nginx published ports only | `nginx` |
| `app_internal` | no | all application containers and `nginx` |

Only Nginx should publish host ports:

- `80:80`
- `443:443`

All app containers should use `expose`, not `ports`.

## Health Check Matrix

| Service | Health endpoint candidate | Expected |
| --- | --- | --- |
| `api-server` | `/api/health/live` | `200` |
| `realtutorialhub-quiz` | `/` | `200` or redirect reviewed per app behavior |
| `realtutorialhub-admin` | `/` | `200` or auth redirect |
| `realtutorialhub-web` | `/` | `200` |
| `skillup-web` | `/api/healthz` | `200` |
| `skillup-admin` | `/api/healthz` | `200` |
| `faculty-app` | `/api/healthz` | `200` |
| `skillhubcore-admin` | `/api/healthz` | `200` |
| `skillhub-placement` | `/api/healthz` | `200` |
| `skillhubcore-service` | `/healthz/` | `200` |

These endpoints should be verified against the running containers before finalizing Compose health checks.

## Cloudflare Settings To Document Before Cutover

- DNS records for each public hostname
- Proxy status: orange-cloud proxied
- SSL/TLS mode: Full (Strict)
- Origin certificate host coverage
- WAF rules for API hosts
- Cache rules for static assets
- Cache bypass rules for API/auth paths
- WebSocket support enabled
- HTTP/2 and HTTP/3 settings
- Always Use HTTPS enabled
- Minimum TLS version
- Rate limiting strategy for API and auth paths

## Open Review Decisions

1. Should public frontend hosts ever move to direct DNS after the retained-Worker stabilization window?
2. Should placement remain on Cloud Run until a separate placement implementation phase is completed?
3. Which root/apex domains are in scope for this migration, if any?
4. Should marketing services from `asia-south1` remain excluded for this phase?
5. Should `admin.skillhubcore.in` use direct Nginx routing despite its existing Cloud Run domain mapping?

Nginx, Docker Compose, deployment scripts, and staging validation have been generated and executed. DNS and Worker cutover still require explicit approval.
