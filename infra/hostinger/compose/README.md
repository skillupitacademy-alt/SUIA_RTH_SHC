# Docker Compose Templates

Status: Phase 2 template artifacts.

These files define the intended Docker Compose topology for the Hostinger VPS migration. They are not deployed by this phase.

## Files

- `docker-compose.yml`: base service, network, build, and health-check template.
- `docker-compose.production.yml`: production-oriented resource and logging overrides.

## Design Rules

- Only `nginx` publishes public ports.
- Application containers use `expose`, not `ports`.
- Application containers join only the internal application network.
- Nginx joins the public edge network and internal application network.
- Secrets are loaded from an external environment file, not stored in Compose.
- API Worker behavior is still assumed for initial API cutover unless a later ADR changes it.

## Intended Invocation Later

```bash
docker compose \
  --env-file /opt/platform/env/.env.production \
  -f infra/hostinger/compose/docker-compose.yml \
  -f infra/hostinger/compose/docker-compose.production.yml \
  config
```

Do not deploy these templates until Phase 3 Nginx configuration and Phase 4 verification scripts are reviewed.
