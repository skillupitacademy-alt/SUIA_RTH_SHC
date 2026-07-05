# Hostinger Production Cutover Runbook

Date: 2026-07-05
Status: API Worker upstream update deployed; frontend Worker-to-VPS origin cutover pending origin frontend preparation.

## Scope

Move validated non-placement compute traffic from GCP Cloud Run to the Hostinger VPS at `72.61.115.49`.

## Explicit Exclusions

- Do not cut over `placement.skillhubcore.in`.
- Do not delete, disable, or modify Cloud Run services.
- Do not delete Cloud Build, Artifact Registry, or GitHub deployment artifacts.
- Do not remove API Worker routing in the initial cutover.
- Do not store Cloudflare API tokens or production secrets in the repository.

## Current Verified State

### Cloudflare API Access

Live Cloudflare API export was performed with limited token permissions.

The token could export zones and DNS records, but could not export account-level Worker metadata, zone SSL settings, zone rulesets, or Worker routes. Generated exports are stored under the gitignored `infra/hostinger/cloudflare/state-exports/` directory.

Frontend direct-DNS cutover is no longer the recommended path. A Worker deploy with frontend proxy handlers removed was attempted, but Cloudflare route reconciliation failed due missing route permissions. The Worker was hotfixed to keep frontend proxy handlers.

Live `/internal/health` checks confirmed the frontend hostnames still execute the Worker. The preferred path is to retain those Worker routes and switch frontend upstream variables to dedicated VPS origin hostnames after origin records, Nginx aliases, and certificate coverage are ready.

### VPS

- Docker Compose stack is running on Hostinger.
- All containers are healthy.
- Only Nginx publishes public ports `80` and `443`.
- App containers have outbound DNS/HTTPS access while remaining unexposed.
- Cloudflare Origin Certificate is installed on Nginx.

### Login Smoke Tests Against VPS

Validated with local DNS override to `72.61.115.49`:

```text
RealTutorialHub user: PASS
SkillUp user: PASS
SkillHub admin: PASS
```

The SkillUp test account that passed is the repo-documented SkillUp test email, not the initially supplied `student@gmail.com`.

### GCP Rollback Targets

Cloud Run services still present in `asia-southeast1`:

| Service | URL |
| --- | --- |
| `faculty-app` | `https://faculty-app-plldp3atca-as.a.run.app` |
| `quiz-admin-app` | `https://quiz-admin-app-plldp3atca-as.a.run.app` |
| `quiz-api-server` | `https://quiz-api-server-plldp3atca-as.a.run.app` |
| `quiz-web-app` | `https://quiz-web-app-plldp3atca-as.a.run.app` |
| `realtutorialhub-web` | `https://realtutorialhub-web-plldp3atca-as.a.run.app` |
| `skillhub-placement` | `https://skillhub-placement-plldp3atca-as.a.run.app` |
| `skillhubcore-admin` | `https://skillhubcore-admin-plldp3atca-as.a.run.app` |
| `skillhubcore-service` | `https://skillhubcore-service-plldp3atca-as.a.run.app` |
| `skillup-admin` | `https://skillup-admin-plldp3atca-as.a.run.app` |
| `skillup-web` | `https://skillup-web-plldp3atca-as.a.run.app` |

### Public DNS Observation

Public hostnames currently resolve to Cloudflare anycast addresses. This confirms they are proxied at Cloudflare, but does not reveal the hidden origin target.

`origin-api.*` hostnames are now published through Cloudflare and validated:

```text
origin-api.realtutorialhub.com/api/health/live 200
origin-api.skillupitacademy.com/api/health/live 200
origin-api.skillhubcore.in/healthz/ 200
```

### Public HTTP Observation

Current public HTTP responses before cutover:

```text
user.realtutorialhub.com 200
admin.realtutorialhub.com 307
user.skillupitacademy.com 200
admin.skillupitacademy.com 307
faculty.skillupitacademy.com 307
quiz.skillhubcore.in 200
tutorial.skillhubcore.in 200
placement.skillhubcore.in 200
admin.skillhubcore.in 307
api.realtutorialhub.com 404
api.skillupitacademy.com 404
api.skillhubcore.in 401
```

## Target Initial Routing Model

```text
Frontend hosts -> Cloudflare Worker -> origin frontend hostnames -> VPS Nginx -> frontend containers
API hosts -> Cloudflare Worker -> origin-api hostnames -> VPS Nginx -> API containers
```

This keeps frontend and API gateway behavior in the Worker during the initial cutover.

## Cloudflare Changes To Prepare

### DNS Records To Create Or Update

For the retained-Worker path, create origin records to `A`, target `72.61.115.49`, proxied.

| Hostname | Zone | Action |
| --- | --- | --- |
| `origin-api.realtutorialhub.com` | `realtutorialhub.com` | create |
| `origin-api.skillupitacademy.com` | `skillupitacademy.com` | create |
| `origin-api.skillhubcore.in` | `skillhubcore.in` | create |
| `origin-user.realtutorialhub.com` | `realtutorialhub.com` | create |
| `origin-admin.realtutorialhub.com` | `realtutorialhub.com` | create |
| `origin-user.skillupitacademy.com` | `skillupitacademy.com` | create |
| `origin-admin.skillupitacademy.com` | `skillupitacademy.com` | create |
| `origin-faculty.skillupitacademy.com` | `skillupitacademy.com` | create |
| `origin-quiz.skillhubcore.in` | `skillhubcore.in` | create |
| `origin-tutorial.skillhubcore.in` | `skillhubcore.in` | create |
| `origin-admin.skillhubcore.in` | `skillhubcore.in` | create |

Do not modify:

```text
user.realtutorialhub.com
admin.realtutorialhub.com
user.skillupitacademy.com
admin.skillupitacademy.com
faculty.skillupitacademy.com
quiz.skillhubcore.in
tutorial.skillhubcore.in
admin.skillhubcore.in
placement.skillhubcore.in
api.realtutorialhub.com
api.skillupitacademy.com
api.skillhubcore.in
```

### Worker Gateway Changes

Keep Worker routes for frontend, API, and placement hosts during this phase:

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

`admin.skillhubcore.in` is not currently declared in the Worker config. It can remain direct DNS/Nginx or be added to the retained-Worker model in a later reviewed change.

### Worker Upstream Variable Changes

API upstream variables are already updated:

| Worker variable | Target |
| --- | --- |
| `EXAM_SERVICE_URL` | `https://origin-api.realtutorialhub.com` |
| `NOTIFICATION_URL` | `https://origin-api.realtutorialhub.com` |
| `SKILLHUBCORE_URL` | `https://origin-api.skillhubcore.in` |

After frontend origin records, Nginx aliases, and certificate coverage are validated, update frontend upstream variables:

| Worker variable | Target |
| --- | --- |
| `TUTORIAL_SERVICE_URL` | `https://origin-user.realtutorialhub.com` |
| `RTH_ADMIN_URL` | `https://origin-admin.realtutorialhub.com` |
| `SKILLUP_WEB_URL` | `https://origin-user.skillupitacademy.com` |
| `SKILLUP_ADMIN_URL` | `https://origin-admin.skillupitacademy.com` |
| `FACULTY_URL` | `https://origin-faculty.skillupitacademy.com` |
| `QUIZ_WEB_URL` | `https://origin-quiz.skillhubcore.in` |

`tutorial.skillhubcore.in` currently shares `TUTORIAL_SERVICE_URL`. Add a dedicated Worker binding before switching if it needs a separate origin.

Do not change `PLACEMENT_URL`.

## Cutover Order

1. Confirm Cloudflare token is available only in the local shell environment.
2. Export current Cloudflare DNS records, Worker routes, and Worker variables to a local timestamped backup outside Git.
3. Confirm VPS health:

```bash
ssh hostinger-quiz-platform "cd /opt/platform/apps/quiz-platform && infra/hostinger/scripts/health.sh"
```

4. Confirm Cloud Run rollback targets still answer.
5. Create origin DNS records. API origin records were completed on 2026-07-05. Frontend origin records are pending.

Dry-run first:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch origin
```

Apply only after review:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch origin -Apply
```

6. Validate origin API hostnames. Completed on 2026-07-05:

```powershell
curl.exe -k --resolve "origin-api.realtutorialhub.com:443:72.61.115.49" https://origin-api.realtutorialhub.com/api/health/live
curl.exe -k --resolve "origin-api.skillupitacademy.com:443:72.61.115.49" https://origin-api.skillupitacademy.com/api/health/live
curl.exe -k --resolve "origin-api.skillhubcore.in:443:72.61.115.49" https://origin-api.skillhubcore.in/healthz/
```

7. Install a Cloudflare Origin Certificate that also covers frontend `origin-*` hostnames.

8. Deploy Nginx aliases for frontend `origin-*` hostnames to the VPS.

9. Validate frontend origin hostnames through Cloudflare and direct VPS SNI checks:

```powershell
curl.exe -k --resolve "origin-user.realtutorialhub.com:443:72.61.115.49" https://origin-user.realtutorialhub.com/
curl.exe -k --resolve "origin-admin.realtutorialhub.com:443:72.61.115.49" https://origin-admin.realtutorialhub.com/login
curl.exe -k --resolve "origin-user.skillupitacademy.com:443:72.61.115.49" https://origin-user.skillupitacademy.com/
curl.exe -k --resolve "origin-admin.skillupitacademy.com:443:72.61.115.49" https://origin-admin.skillupitacademy.com/login
curl.exe -k --resolve "origin-faculty.skillupitacademy.com:443:72.61.115.49" https://origin-faculty.skillupitacademy.com/login
curl.exe -k --resolve "origin-quiz.skillhubcore.in:443:72.61.115.49" https://origin-quiz.skillhubcore.in/
curl.exe -k --resolve "origin-tutorial.skillhubcore.in:443:72.61.115.49" https://origin-tutorial.skillhubcore.in/
curl.exe -k --resolve "origin-admin.skillhubcore.in:443:72.61.115.49" https://origin-admin.skillhubcore.in/login
```

10. Deploy the reviewed Worker upstream switch.

Pre-deploy validation:

```powershell
cmd /c pnpm.cmd --filter @quiz/api-gateway test
cmd /c pnpm.cmd --filter @quiz/api-gateway type-check
```

Deploy only after approval:

```powershell
cmd /c pnpm.cmd --filter @quiz/api-gateway exec wrangler deploy --env production
```

11. Verify frontend hostnames still execute the Worker and public pages return expected statuses.
12. Validate API behavior and login flows.
13. Monitor logs, CPU, memory, disk, and app errors.

## Direct-DNS Fallback Batch Plan

This section is not the recommended retained-Worker path. Use it only if a later review chooses direct DNS frontend cutover and frontend Worker routes have already been removed.

### Batch 1

- `user.realtutorialhub.com`

Validation:

```powershell
curl.exe -I https://user.realtutorialhub.com/
```

Run browser login smoke for RealTutorialHub only.

### Batch 2

- `admin.realtutorialhub.com`
- `user.skillupitacademy.com`

Validation:

```powershell
curl.exe -I https://admin.realtutorialhub.com/login
curl.exe -I https://user.skillupitacademy.com/
```

Run browser login smoke for RealTutorialHub and SkillUp.

### Batch 3

- `admin.skillupitacademy.com`
- `faculty.skillupitacademy.com`
- `quiz.skillhubcore.in`
- `tutorial.skillhubcore.in`
- `admin.skillhubcore.in`

Validation:

```powershell
curl.exe -I https://admin.skillupitacademy.com/login
curl.exe -I https://faculty.skillupitacademy.com/login
curl.exe -I https://quiz.skillhubcore.in/
curl.exe -I https://tutorial.skillhubcore.in/
curl.exe -I https://admin.skillhubcore.in/login
```

Run browser login smoke for all validated non-placement accounts.

## Post-Cutover Validation

Run:

```powershell
$env:RTH_USER_EMAIL='<set locally>'
$env:RTH_USER_PASSWORD='<set locally>'
$env:SKILLUP_USER_EMAIL='<set locally>'
$env:SKILLUP_USER_PASSWORD='<set locally>'
$env:SKILLHUB_ADMIN_EMAIL='<set locally>'
$env:SKILLHUB_ADMIN_PASSWORD='<set locally>'
cmd /c pnpm.cmd exec node infra/hostinger/validation/validate-vps-login-smoke.mjs
```

Then verify:

- user homepages load.
- admin login pages redirect or authenticate correctly.
- `api.realtutorialhub.com`, `api.skillupitacademy.com`, and `api.skillhubcore.in` remain Worker-routed.
- `placement.skillhubcore.in` remains unchanged.
- VPS Nginx logs show expected traffic.
- Cloud Run services remain available for rollback.

## Rollback Plan

Rollback one batch at a time.

1. Restore the previous Worker configuration for the affected frontend hostname and redeploy the Worker.
2. Restore the previous DNS record target from the timestamped backup.
3. If API behavior fails, restore Worker variables to the previous Cloud Run URLs:

```text
EXAM_SERVICE_URL=https://quiz-api-server-plldp3atca-as.a.run.app
NOTIFICATION_URL=https://quiz-api-server-plldp3atca-as.a.run.app
SKILLHUBCORE_URL=https://skillhubcore-service-plldp3atca-as.a.run.app
```

4. Validate public health and login.
5. Leave VPS running for investigation unless it is actively causing failures.

## Stop Conditions

Stop cutover and rollback the active batch if any of these occur:

- login fails for a validated account
- sustained public `5xx`
- Worker route loop
- API auth cookie/domain failure
- Nginx upstream errors
- VPS CPU, memory, or disk exhaustion
- database or Upstash connectivity errors

## Approval Gate

This runbook is ready for review, but execution requires a separate explicit approval message that says to apply Cloudflare DNS and Worker changes.
