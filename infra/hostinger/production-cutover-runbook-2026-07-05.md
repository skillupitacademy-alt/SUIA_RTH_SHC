# Hostinger Production Cutover Runbook

Date: 2026-07-05
Status: prepared for review. Do not execute Cloudflare changes until explicitly approved.

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

Live Cloudflare API export was not performed in this preparation pass because no Cloudflare token was present in the shell environment.

Before executing this runbook, set the token outside Git as `CLOUDFLARE_API_TOKEN`, then export current DNS records, Worker routes, and Worker variables to a timestamped backup outside the repository.

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

`origin-api.*` hostnames are not currently published:

```text
origin-api.realtutorialhub.com: DNS name does not exist
origin-api.skillupitacademy.com: DNS name does not exist
origin-api.skillhubcore.in: DNS name does not exist
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
Frontend hosts -> Cloudflare DNS -> VPS Nginx -> frontend containers
API hosts -> Cloudflare Worker -> origin-api hostnames -> VPS Nginx -> API containers
```

This keeps API gateway behavior in the Worker during the initial cutover.

## Cloudflare Changes To Prepare

### DNS Records To Create Or Update

Set these records to `A`, target `72.61.115.49`, proxied.

| Hostname | Zone | Action |
| --- | --- | --- |
| `user.realtutorialhub.com` | `realtutorialhub.com` | update/create |
| `admin.realtutorialhub.com` | `realtutorialhub.com` | update/create |
| `user.skillupitacademy.com` | `skillupitacademy.com` | update/create |
| `admin.skillupitacademy.com` | `skillupitacademy.com` | update/create |
| `faculty.skillupitacademy.com` | `skillupitacademy.com` | update/create |
| `quiz.skillhubcore.in` | `skillhubcore.in` | update/create |
| `tutorial.skillhubcore.in` | `skillhubcore.in` | update/create |
| `admin.skillhubcore.in` | `skillhubcore.in` | update/create |
| `origin-api.realtutorialhub.com` | `realtutorialhub.com` | create |
| `origin-api.skillupitacademy.com` | `skillupitacademy.com` | create |
| `origin-api.skillhubcore.in` | `skillhubcore.in` | create |

Do not modify:

```text
placement.skillhubcore.in
api.realtutorialhub.com
api.skillupitacademy.com
api.skillhubcore.in
```

### Worker Route Changes

Remove Worker routes for frontend hosts after their DNS records are ready:

```text
user.realtutorialhub.com/*
admin.realtutorialhub.com/*
user.skillupitacademy.com/*
admin.skillupitacademy.com/*
faculty.skillupitacademy.com/*
quiz.skillhubcore.in/*
tutorial.skillhubcore.in/*
admin.skillhubcore.in/*
```

Keep Worker routes for API and placement hosts:

```text
api.realtutorialhub.com/*
api.skillupitacademy.com/*
api.skillhubcore.in/*
placement.skillhubcore.in/*
```

### Worker Upstream Variable Changes

After `origin-api.*` DNS records exist and resolve, update API upstream variables:

| Worker variable | Target |
| --- | --- |
| `EXAM_SERVICE_URL` | `https://origin-api.realtutorialhub.com` |
| `NOTIFICATION_URL` | `https://origin-api.realtutorialhub.com` |
| `SKILLHUBCORE_URL` | `https://origin-api.skillhubcore.in` |

Keep frontend upstream variables pointing at Cloud Run until their Worker routes are removed. They become irrelevant for frontend traffic once routes are removed, and retaining them helps rollback.

Do not change `PLACEMENT_URL`.

## Cutover Order

1. Confirm Cloudflare token is available only in the local shell environment.
2. Export current Cloudflare DNS records, Worker routes, and Worker variables to a local timestamped backup outside Git.
3. Confirm VPS health:

```bash
ssh hostinger-quiz-platform "cd /opt/platform/apps/quiz-platform && infra/hostinger/scripts/health.sh"
```

4. Confirm Cloud Run rollback targets still answer.
5. Create `origin-api.*` DNS records.

Dry-run first:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch origin
```

Apply only after review:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch origin -Apply
```

6. Validate origin API hostnames:

```powershell
curl.exe -k --resolve "origin-api.realtutorialhub.com:443:72.61.115.49" https://origin-api.realtutorialhub.com/api/health/live
curl.exe -k --resolve "origin-api.skillupitacademy.com:443:72.61.115.49" https://origin-api.skillupitacademy.com/api/health/live
curl.exe -k --resolve "origin-api.skillhubcore.in:443:72.61.115.49" https://origin-api.skillhubcore.in/healthz/
```

7. Update one low-risk frontend DNS record and remove the matching Worker route.

Dry-run first:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1
```

Apply only after review:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1 -Apply
```

8. Validate that hostname from a browser and with HTTP status checks.
9. Continue frontend hosts in batches.

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 2
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 2 -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 3
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 3 -Apply
```

10. Update Worker API upstream variables to `origin-api.*`.
11. Validate API behavior and login flows.
12. Monitor logs, CPU, memory, disk, and app errors.

## Batch Plan

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

1. Restore the removed Worker route for the affected frontend hostname.
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
