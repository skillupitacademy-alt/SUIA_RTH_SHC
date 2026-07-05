# Hostinger IaC Review Plan

Status: draft. This is a review plan, not deployment configuration.

## Constraints

- Use Nginx, not Caddy.
- Use Ubuntu 24.04 LTS.
- Use Cloudflare Full (Strict) with Cloudflare Origin Certificates.
- Use Docker Compose.
- Use internal Docker networking.
- Expose only Nginx publicly.
- Do not modify or remove GCP deployment artifacts during the planning phase.
- Generate routing and architecture documentation before concrete Nginx/Compose files.
- Phase 1 creates planning artifacts and templates only.
- Do not connect to the VPS, modify DNS, deploy containers, or export production secrets.

## Proposed Repository Layout

The eventual VPS layout should be:

```text
/opt/platform
+-- apps/
+-- compose/
+-- docker/
+-- env/
+-- logs/
+-- monitoring/
+-- nginx/
+-- scripts/
+-- backups/
```

The eventual repository-side IaC layout should be:

```text
infra/
+-- hostinger/
    +-- README.md
    +-- ADR/
    +-- env/
    |   +-- .env.production.template
    |   +-- variables.md
    +-- operations/
    +-- repository-layout.md
    +-- migration-checklist.md
    +-- verification-checklist.md
```

## Phase 1 Generation Scope

Generate now:

1. Repository structure under `infra/hostinger/`.
2. Architecture Decision Records.
3. `.env.production.template`.
4. `variables.md`.
5. `README.md`.
6. Migration checklist.
7. Operational documentation.
8. Verification checklist.
9. Master migration plan at `docs/HOSTINGER_VPS_MIGRATION_MASTER_PLAN.md`.

Do not generate in Phase 1:

- Docker Compose files.
- Nginx configuration.
- Deployment scripts.
- DNS automation.
- VPS bootstrap scripts.
- Any file containing production secrets.

## Later Generation Order After Review

1. Finalize domain routing matrix.
2. Generate `.env.production.template` with variable descriptions.
3. Generate Docker Compose files with internal networks and health checks.
4. Generate Nginx config with Cloudflare Origin Certificate paths.
5. Generate Cloudflare DNS/SSL/cache/WAF documentation.
6. Generate operational scripts.
7. Generate `verify.sh` before deployment scripts.
8. Generate VPS bootstrap instructions for Ubuntu 24.04 LTS.
9. Review all files before any remote deployment.

## Non-Goals For This Phase

- No GCP deployment artifact changes.
- No Cloud Run deletion.
- No Cloudflare DNS changes.
- No remote VPS mutation.
- No production secret export into the repository.
