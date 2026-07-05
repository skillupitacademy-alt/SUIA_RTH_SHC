# Cloudflare Worker Gateway Cutover

Status: target architecture updated to retained frontend Worker with VPS origins.

## Current Production Safety Note

On 2026-07-05, the Worker bundle upload succeeded but Cloudflare route reconciliation failed because the active token could not access `/workers/routes` for all affected zones.

Because existing frontend Worker routes remained attached to the Worker, removing frontend proxy handlers from the Worker code caused frontend homepages to return `404`. A hotfix restored frontend proxy handlers while keeping API upstreams pointed at `origin-api.*`.

The route-removal plan is now a fallback. The preferred plan is to retain frontend Worker routes and change frontend upstream variables from Cloud Run URLs to dedicated `origin-*` VPS hostnames after those origins are live and covered by the Cloudflare Origin Certificate.

## Decision

Retain the Cloudflare Worker as the frontend and API edge gateway during the first Hostinger production cutover.

Frontend hostnames should remain Cloudflare Worker routed, but the Worker should proxy frontend traffic to reviewed `origin-*` VPS hostnames instead of Cloud Run frontend origins.

API hostnames should remain Cloudflare Worker routed, but the Worker should proxy API traffic to the reviewed `origin-api.*` VPS hostnames instead of Cloud Run API origins.

Placement remains excluded from this cutover and stays Worker routed to the existing Cloud Run origin.

## Worker Routes To Keep

Keep these routes in `services/api-gateway/wrangler.toml` for the retained-Worker phase:

```text
user.realtutorialhub.com/*
admin.realtutorialhub.com/*
user.skillupitacademy.com/*
admin.skillupitacademy.com/*
faculty.skillupitacademy.com/*
quiz.skillhubcore.in/*
tutorial.skillhubcore.in/*
api.realtutorialhub.com/*
api.skillupitacademy.com/*
api.skillhubcore.in/*
placement.skillhubcore.in/*
```

## Frontend Route Removal Fallback

Only remove these routes if a later review chooses direct DNS frontend cutover and Cloudflare route-removal access is confirmed:

```text
user.realtutorialhub.com/*
admin.realtutorialhub.com/*
user.skillupitacademy.com/*
admin.skillupitacademy.com/*
faculty.skillupitacademy.com/*
quiz.skillhubcore.in/*
tutorial.skillhubcore.in/*
```

`admin.skillhubcore.in` is not currently declared in the Worker config and can be handled directly by DNS/Nginx or added to the retained-Worker model later.

## Worker Upstream Targets

Production Worker API upstream variables are:

| Variable | Target |
| --- | --- |
| `EXAM_SERVICE_URL` | `https://origin-api.realtutorialhub.com` |
| `NOTIFICATION_URL` | `https://origin-api.realtutorialhub.com` |
| `SKILLHUBCORE_URL` | `https://origin-api.skillhubcore.in` |

After frontend origin records, Nginx aliases, and certificate coverage are validated, set production Worker frontend upstream variables to:

| Variable | Target |
| --- | --- |
| `TUTORIAL_SERVICE_URL` | `https://origin-user.realtutorialhub.com` |
| `RTH_ADMIN_URL` | `https://origin-admin.realtutorialhub.com` |
| `SKILLUP_WEB_URL` | `https://origin-user.skillupitacademy.com` |
| `SKILLUP_ADMIN_URL` | `https://origin-admin.skillupitacademy.com` |
| `FACULTY_URL` | `https://origin-faculty.skillupitacademy.com` |
| `QUIZ_WEB_URL` | `https://origin-quiz.skillhubcore.in` |

`tutorial.skillhubcore.in` currently shares `TUTORIAL_SERVICE_URL`. Add a dedicated `TUTORIAL_WEB_URL` binding before switching if it needs a different origin than `user.realtutorialhub.com`.

Set placement to a dedicated origin hostname to avoid a Worker routing loop:

```text
PLACEMENT_URL=https://origin-placement.skillhubcore.in
```

Keep the public `placement.skillhubcore.in/*` Worker route in place.

## Required Validation Before Deploy

Run from the repository root:

```powershell
cmd /c pnpm.cmd --filter @quiz/api-gateway test
cmd /c pnpm.cmd --filter @quiz/api-gateway type-check
```

Review the generated Wrangler diff before deployment:

```powershell
git diff -- services/api-gateway/wrangler.toml services/api-gateway/src/routes/routing-table.ts
```

## Deployment Command

Only after approval and origin frontend validation:

```powershell
cmd /c pnpm.cmd --filter @quiz/api-gateway exec wrangler deploy --env production
```

## Post-Deploy Verification

Frontend hostnames should still return the Worker health snapshot, but frontend page requests should be served from VPS origins:

```powershell
curl.exe -s https://user.realtutorialhub.com/internal/health
curl.exe -s https://admin.realtutorialhub.com/internal/health
curl.exe -s https://user.skillupitacademy.com/internal/health
curl.exe -s https://admin.skillupitacademy.com/internal/health
curl.exe -s https://faculty.skillupitacademy.com/internal/health
curl.exe -s https://quiz.skillhubcore.in/internal/health
curl.exe -s https://tutorial.skillhubcore.in/internal/health
```

API hostnames should still return Worker behavior:

```powershell
curl.exe -s https://api.realtutorialhub.com/internal/health
curl.exe -s https://api.skillupitacademy.com/internal/health
curl.exe -s https://api.skillhubcore.in/internal/health
```

Do not run frontend DNS cutover in the retained-Worker path. The public frontend hostnames should remain Worker-routed.

## Rollback

Rollback the Worker first if frontend origin routing causes unexpected behavior:

1. Restore Worker frontend upstream variables to Cloud Run frontend origins.
2. Restore Worker API upstream variables to Cloud Run API origins if API behavior is affected.
3. Redeploy the Worker.
4. Confirm public frontend and API paths recover.

Then rollback DNS batches if any were applied.
