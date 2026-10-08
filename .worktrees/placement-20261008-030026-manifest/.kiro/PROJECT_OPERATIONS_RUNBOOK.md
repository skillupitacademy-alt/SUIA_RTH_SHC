# Project Operations Runbook

Status: primary production migration complete; operating under observation. Placement is deferred as a separate future module.

## Production Architecture

```text
Users
  -> Cloudflare Edge
  -> Cloudflare Worker
  -> origin-* hostnames
  -> Hostinger VPS
  -> Nginx
  -> Docker Compose
  -> Application containers
  -> Neon, Upstash, R2, Resend, and external services
```

Only Nginx should expose public ports on the VPS. Application containers communicate on the internal Docker network.

## Scope

This runbook covers day-to-day operation of the Hostinger VPS production platform after the GCP-to-VPS migration.

In scope:

- VPS health checks
- Docker deployment and restart procedure
- Cloudflare Worker deployment
- Monitoring access
- Backup and restore references
- Rollback approach
- Disaster recovery approach
- Monthly maintenance
- Future scaling path
- GCP decommission checklist

Out of scope:

- Production secrets in Git
- Immediate GCP deletion
- Placement launch work

## Current Status

| Area | Status |
| --- | --- |
| Primary production migration | Complete |
| Hostinger VPS | Live |
| Nginx reverse proxy | Live |
| Docker Compose app stack | Live |
| Cloudflare Worker gateway | Retained and live |
| Cloudflare Origin Certificates | Installed |
| Monitoring | Installed |
| Backups | Installed |
| Placement | Deferred by design |
| GCP decommission | Pending observation window |

## Primary Hostnames

Production traffic should resolve through Cloudflare and then to the retained Worker or VPS origin path:

- `user.realtutorialhub.com`
- `admin.realtutorialhub.com`
- `user.skillupitacademy.com`
- `admin.skillupitacademy.com`
- `faculty.skillupitacademy.com`
- `quiz.skillhubcore.in`
- `tutorial.skillhubcore.in`
- `admin.skillhubcore.in`
- `api.realtutorialhub.com`
- `api.skillupitacademy.com`
- `api.skillhubcore.in`

`placement.skillhubcore.in` is reachable but should remain a Phase 2 application until its user flow is explicitly launched.

## VPS Access

Use SSH key authentication. Avoid password-based root operations for routine maintenance.

```bash
ssh root@72.61.115.49
```

Recommended long-term setup:

```bash
ssh deploy@72.61.115.49
```

## Health Checks

Run these after any deployment, VPS maintenance, Cloudflare Worker deployment, or certificate change:

```bash
docker ps
docker compose ps
docker exec quiz-platform-nginx-1 nginx -t
curl -I https://user.realtutorialhub.com/
curl -I https://user.skillupitacademy.com/
curl -I https://admin.skillhubcore.in/login
curl -I https://api.realtutorialhub.com/internal/health
curl -I https://api.skillhubcore.in/internal/health
```

Expected result: public endpoints return `200` or expected auth redirects, and containers are healthy.

## Docker Operations

App compose files:

- `infra/hostinger/compose/docker-compose.yml`
- `infra/hostinger/compose/docker-compose.production.yml`

On the VPS, the checked-out repository is under:

```text
/opt/platform/apps/quiz-platform
```

Start or refresh the app stack:

```bash
cd /opt/platform/apps/quiz-platform/infra/hostinger/compose
HOSTINGER_ENV_FILE=/opt/platform/env/.env.production docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

Restart one service:

```bash
cd /opt/platform/apps/quiz-platform/infra/hostinger/compose
HOSTINGER_ENV_FILE=/opt/platform/env/.env.production docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --no-deps SERVICE_NAME
```

View logs:

```bash
docker logs --tail 200 quiz-platform-nginx-1
docker logs --tail 200 quiz-platform-api-server-1
docker logs --tail 200 quiz-platform-realtutorialhub-web-1
docker logs --tail 200 quiz-platform-skillup-web-1
```

## Nginx Operations

Config root:

```text
infra/hostinger/nginx/
```

Validate and reload:

```bash
docker exec quiz-platform-nginx-1 nginx -t
docker exec quiz-platform-nginx-1 nginx -s reload
```

Do not expose application containers directly. Public exposure should remain limited to Nginx on ports `80` and `443`.

## Cloudflare Worker Operations

Worker source:

```text
services/api-gateway
```

Pre-deploy checks:

```bash
pnpm --filter @quiz/api-gateway test
pnpm --filter @quiz/api-gateway type-check
```

Deploy:

```bash
pnpm --filter @quiz/api-gateway exec wrangler deploy --env production
```

If deploy uploads the Worker but fails during route reconciliation, validate live Worker health before taking further action. The current token may not have Worker route management permission, while existing routes may remain active.

## Monitoring

Monitoring stack:

- Prometheus
- Grafana
- Loki
- Promtail
- Node Exporter
- cAdvisor
- Blackbox Exporter
- Nginx Exporter

Monitoring should bind to localhost only. Use an SSH tunnel for dashboard access.

Reference docs:

- `infra/hostinger/monitoring/README.md`
- `infra/hostinger/monitoring/checks.md`
- `infra/hostinger/monitoring/alerts.md`
- `infra/hostinger/monitoring/dashboards.md`

Operational checks:

- CPU sustained high usage
- RAM above safe threshold
- Disk above 80%
- Docker restarts
- Nginx 5xx increase
- Worker error rate
- Login failures
- API latency

## Backups

Reference:

- `infra/hostinger/scripts/backup.sh`
- `infra/hostinger/scripts/restore.sh`
- `infra/hostinger/operations/backup.md`
- `infra/hostinger/operations/restore.md`

Back up:

- Compose files
- Nginx config
- Cloudflare state exports
- Worker source and config
- Environment file metadata, without committing secrets
- Operational logs needed for incident review

Database backups remain provider-specific and should be managed through Neon and other external providers.

## Rollback

During the observation window, keep GCP Cloud Run available as rollback capacity.

Rollback order:

1. Stop new changes.
2. Confirm whether the issue is Worker, DNS, Nginx, container, app, or external provider.
3. If Worker issue, redeploy previous Worker revision or restore previous Worker variables.
4. If DNS/origin issue, use Cloudflare rollback docs and prior state export.
5. If VPS app issue, restart or roll back the affected container.
6. If VPS-wide issue, route traffic back to known-good GCP services.

Rollback references:

- `infra/hostinger/rollback/`
- `infra/hostinger/operations/rollback.md`
- `infra/hostinger/cloudflare/export-cloudflare-state.md`
- `infra/hostinger/cloudflare/apply-cloudflare-cutover.md`

## Disaster Recovery

Minimum recovery goals:

- Rebuild VPS from Ubuntu 24.04 baseline.
- Install Docker, Compose, Nginx, and monitoring.
- Restore `/opt/platform` layout.
- Restore Cloudflare Origin Certificate or issue a new one.
- Restore environment file from secure secret storage.
- Pull repository and start Compose stack.
- Validate all public hostnames.

Reference:

- `infra/hostinger/operations/disaster-recovery.md`
- `infra/hostinger/bootstrap/`

## Observation Window

Do not decommission GCP during the first observation window.

Week 1:

- Monitor CPU, memory, disk, Docker restarts, Nginx logs, Worker health, login success, and API latency.

Week 2:

- Confirm no recurring crashes, auth issues, database connectivity issues, Redis issues, Cloudflare routing issues, or unexpected traffic to Cloud Run.

## GCP Decommission Checklist

Run only after the observation window is clean and rollback dependency is no longer needed.

- Confirm VPS traffic is stable.
- Confirm Cloudflare Worker routes point to VPS origins where intended.
- Confirm no required service still depends on Cloud Run.
- Keep placement separate unless it is explicitly launched.
- Remove unused Cloud Run services.
- Remove unused Cloud Build triggers.
- Delete obsolete Artifact Registry images.
- Delete unused Secret Manager secrets.
- Remove unused IAM service accounts and bindings.
- Clean old build buckets and logs if not needed for audit.
- Review billing after one full billing cycle.

Reference:

- `infra/hostinger/gcp-decommission-plan.md`

## Credential Rotation

Rotate credentials used during migration:

- Cloudflare API tokens
- SSH credentials
- Any temporary deployment secrets
- Grafana admin password if shared during setup

Do not commit secrets to Git. Store production values only in secure provider storage or on the VPS with restricted permissions.

## Monthly Maintenance

- Apply Ubuntu security updates.
- Review unattended-upgrades status.
- Review Fail2Ban status.
- Check disk usage and Docker image growth.
- Verify backups exist and can be restored.
- Review Cloudflare analytics and Worker errors.
- Review Nginx 4xx/5xx trends.
- Review provider billing.
- Check certificate expiry.
- Confirm GCP cleanup progress after observation window.

## Scaling Plan

Phase 1: Single VPS.

- Current production baseline.
- Keep Nginx public, apps internal.
- Monitor resource saturation.

Phase 2: Larger VPS or second VPS.

- Move heavy services first.
- Add Cloudflare Load Balancing if needed.
- Split databases remain managed through Neon and external providers.

Phase 3: Multi-node platform.

- Move toward Kubernetes or managed container orchestration only when operational complexity is justified by traffic and team capacity.

## Placement Note

Placement is not a blocker for the migration. Treat it as a separate launch project.

Current recommended state:

- Keep `placement.skillhubcore.in` reachable.
- Keep `origin-placement.skillhubcore.in` available for Worker-to-VPS routing.
- Do not consider placement production-complete until auth handoff and business workflows are validated.
