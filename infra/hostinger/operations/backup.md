# Backup Runbook

Status: implementation runbook.

## Goal

Define what must be backed up before production cutover and during steady state.

## Backup Targets

- `/opt/platform/env/`
- Nginx configuration.
- Cloudflare Origin Certificate and key, stored securely.
- Docker Compose files.
- Monitoring templates.
- Security hardening templates.
- Cloudflare DNS state exports.
- Cloudflare Worker configuration.
- Application logs where required for audit.
- Uploaded/generated files if any are stored on VPS disk.

## Not Backed Up From VPS

- Source repository, because Git is the source of truth.
- External databases, unless a local dump process is explicitly approved.
- Secrets into Git.

## Daily Backup Command

Run on the VPS:

```bash
cd /opt/platform/apps/quiz-platform
HOSTINGER_BACKUP_DIR=/opt/platform/backups ./infra/hostinger/scripts/backup.sh
```

## Cloudflare State Export

Run from the local workstation before and after any Cloudflare change:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<rotated-token>"
.\infra\hostinger\cloudflare\export-cloudflare-state.ps1
```

Do not store the token in the repository.

## Retention

| Backup | Retention |
| --- | --- |
| Daily VPS config backup | 14 days |
| Pre-change backup | Until change is stable for 14 days |
| Incident backup | Keep with incident record |

## Restore Drill

Run a restore drill against a non-production directory before relying on backups for production recovery.
