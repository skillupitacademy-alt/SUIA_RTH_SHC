# Cloudflare Worker Gateway Cutover

Status: prepared for review. Do not deploy without explicit production approval.

## Decision

Retain the Cloudflare Worker as the API edge gateway during the first Hostinger production cutover.

Frontend hostnames should move to Cloudflare DNS -> Hostinger VPS -> Nginx -> frontend containers.

API hostnames should remain Cloudflare Worker routed, but the Worker should proxy API traffic to the reviewed `origin-api.*` VPS hostnames instead of Cloud Run API origins.

Placement remains excluded from this cutover and stays Worker routed to the existing Cloud Run origin.

## Worker Routes To Keep

Keep these routes in `services/api-gateway/wrangler.toml`:

```text
api.realtutorialhub.com/*
api.skillupitacademy.com/*
api.skillhubcore.in/*
placement.skillhubcore.in/*
```

## Frontend Routes To Remove

Remove these routes from `services/api-gateway/wrangler.toml` before frontend DNS cutover:

```text
user.realtutorialhub.com/*
admin.realtutorialhub.com/*
user.skillupitacademy.com/*
admin.skillupitacademy.com/*
faculty.skillupitacademy.com/*
quiz.skillhubcore.in/*
tutorial.skillhubcore.in/*
```

`admin.skillhubcore.in` is not currently declared in the Worker config and should be handled by DNS/Nginx in the frontend batch.

## Worker Upstream Targets

Set production Worker API upstream variables to:

| Variable | Target |
| --- | --- |
| `EXAM_SERVICE_URL` | `https://origin-api.realtutorialhub.com` |
| `NOTIFICATION_URL` | `https://origin-api.realtutorialhub.com` |
| `SKILLHUBCORE_URL` | `https://origin-api.skillhubcore.in` |

Keep frontend upstream variables and `PLACEMENT_URL` unchanged for rollback and placement continuity.

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

Only after approval:

```powershell
cmd /c pnpm.cmd --filter @quiz/api-gateway exec wrangler deploy --env production
```

## Post-Deploy Verification

Frontend hostnames must stop returning the Worker health snapshot:

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

Proceed to frontend DNS batches only after frontend Worker routes are absent. At that point, run `apply-cloudflare-cutover.ps1` with `-SkipWorkerRoutes` for frontend DNS-only updates.

## Rollback

Rollback the Worker first if route removal causes unexpected behavior:

1. Restore frontend route entries in `services/api-gateway/wrangler.toml`.
2. Restore Worker upstream variables to Cloud Run API origins.
3. Redeploy the Worker.
4. Confirm `/internal/health` on frontend hostnames returns the Worker snapshot again.

Then rollback DNS batches if any were applied.
