# Backup Runbook

Status: planning runbook only.

## Goal

Define what must be backed up before production cutover and during steady state.

## Backup Targets

- `/opt/platform/env/`
- Nginx configuration.
- Cloudflare Origin Certificate and key, stored securely.
- Docker Compose files after they are generated and reviewed.
- Application logs where required for audit.
- Uploaded/generated files if any are stored on VPS disk.

## Not Backed Up From VPS

- Source repository, because Git is the source of truth.
- External databases, unless a local dump process is explicitly approved.
- Secrets into Git.
