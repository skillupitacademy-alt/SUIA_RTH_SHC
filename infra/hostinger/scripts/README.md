# Hostinger Operational Scripts

Status: Phase 4 script templates.

These scripts are intended to run locally on the future VPS from the repository root. They are not executed or deployed in this phase.

## Scripts

- `build.sh`: build Compose images.
- `verify.sh`: pre-deployment environment and configuration checks.
- `health.sh`: application and proxy health checks.
- `deploy.sh`: build, verify, start, and health-check services.
- `rollback.sh`: restart the previous local Compose state. DNS/Cloudflare rollback remains manual.
- `backup.sh`: backup local env/Nginx/Compose material.
- `restore.sh`: restore a local backup with confirmation.
- `monitoring-up.sh`: start the local-only monitoring stack.
- `monitoring-down.sh`: stop the monitoring stack while preserving volumes.

## Assumptions

- Repository path on VPS: `/opt/platform/apps/quiz-platform`, or override with `PLATFORM_REPO_DIR`.
- Environment file: `/opt/platform/env/.env.production`, or override with `HOSTINGER_ENV_FILE`.
- Certificate directory: `/opt/platform/nginx/certs`, or override with `HOSTINGER_CERT_DIR`.
- Logs directory: `/opt/platform/logs`, or override with `HOSTINGER_LOG_DIR`.

No script modifies Cloudflare, GCP, or DNS.
