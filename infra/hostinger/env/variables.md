# Production Environment Variables

Status: planning reference only. Do not paste production values into this file.

## Public URL Variables

| Variable | Required | Owner | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | frontend/API | Public RTH API base URL. |
| `NEXT_PUBLIC_API_URL_SKILLUP` | yes | frontend/API | Public SkillUp API base URL. |
| `NEXT_PUBLIC_WEB_APP_URL` | yes | frontend | RTH user portal URL. |
| `NEXT_PUBLIC_ADMIN_URL` | yes | frontend | RTH admin URL. |
| `NEXT_PUBLIC_TUTORIAL_APP_URL` | yes | frontend | Shared tutorial URL. |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | observability | Browser Sentry DSN. |

## Internal Routing Variables

| Variable | Required | Owner | Description |
| --- | --- | --- | --- |
| `INTERNAL_API_URL` | yes | apps | Internal API URL used server-side. |
| `EXAM_SERVICE_URL` | yes if Worker retained | Cloudflare Worker | Upstream for quiz/API service. |
| `TUTORIAL_SERVICE_URL` | yes if Worker retained | Cloudflare Worker | Upstream for tutorial service. |
| `PLACEMENT_URL` | yes if Worker retained | Cloudflare Worker | Upstream for placement service. |
| `SKILLHUBCORE_URL` | yes if Worker retained | Cloudflare Worker | Upstream for SkillHubCore API. |

## Secrets

| Variable | Required | Description |
| --- | --- | --- |
| `JWT_SECRET` | yes | Primary JWT signing secret. |
| `JWT_REFRESH_SECRET` | yes | Refresh token secret. |
| `ADMIN_JWT_SECRET` | yes | Admin token secret. |
| `CSRF_SECRET` | yes | CSRF protection secret. |
| `INTERNAL_GATEWAY_SECRET` | yes | Gateway-to-service trust secret. |
| `INTERNAL_API_KEY` | yes | Internal service authentication key. |

## Databases

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Default application database URL. |
| `DATABASE_URL_RTH` | yes | RTH pooled database URL. |
| `DATABASE_DIRECT_URL_RTH` | migrations only | RTH direct database URL. |
| `DATABASE_URL_SKILLUP` | yes | SkillUp pooled database URL. |
| `DATABASE_DIRECT_URL_SKILLUP` | migrations only | SkillUp direct database URL. |
| `DATABASE_URL_PEOPLE` | yes | Identity/people database URL. |
| `DATABASE_DIRECT_URL_PEOPLE` | migrations only | Identity/people direct database URL. |
| `DATABASE_URL_TUTORIAL` | yes | Tutorial database URL. |
| `DATABASE_URL_PLACEMENT` | yes | Placement database URL. |

## Connectivity Checks Required Before Cutover

- Neon/Postgres connection from VPS.
- Upstash Redis REST connection from VPS.
- Upstash Vector connection from VPS if placement/vector features are enabled.
- Cloudflare Worker to VPS origin connectivity if API Worker is retained.
- R2 object storage access if uploads or generated files are active.
- Resend email API access.

## Secret Handling Rule

Production values must live outside Git, preferably in `/opt/platform/env/.env.production` with restrictive permissions. This repository may contain templates and descriptions only.
