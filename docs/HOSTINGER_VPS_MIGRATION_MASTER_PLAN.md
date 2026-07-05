# Hostinger VPS Migration Master Plan

Status: Phase 1 planning source of truth.

## Objective

Migrate the current `asia-southeast1` application compute stack from GCP Cloud Run to a Hostinger VPS while preserving rollback capability, Cloudflare edge controls, and existing API gateway behavior.

## Current Architecture

- Compute: GCP Cloud Run in `asia-southeast1`.
- Public edge: Cloudflare.
- API gateway: Cloudflare Worker in `services/api-gateway`.
- Databases and managed dependencies: external providers remain in place for this phase.
- Deployment artifacts: Cloud Run, Cloud Build, Artifact Registry, and GitHub workflows remain untouched.

## Target Architecture

- Compute: Hostinger VPS running Ubuntu 24.04 LTS.
- Reverse proxy: Nginx.
- TLS: Cloudflare Full (Strict) with Cloudflare Origin Certificates.
- Containers: Docker Compose in later phases.
- Network: internal Docker network for apps; only Nginx publishes public ports.
- API routing: Cloudflare Worker retained initially for API hosts.

## Phase 1 Scope

Generate planning artifacts only:

- routing matrix
- ADRs
- repository layout
- environment template
- variable documentation
- migration checklist
- operational documentation
- verification checklist

Do not generate deployment configuration yet.

## Explicit Non-Goals

- Do not connect to the VPS.
- Do not modify DNS.
- Do not modify Cloudflare Worker routes.
- Do not remove or modify GCP deployment artifacts.
- Do not delete Cloud Run services.
- Do not export production secrets into Git.
- Do not generate runnable Docker Compose or Nginx configuration until reviewed.

## Routing Strategy

Initial recommended model:

```text
Frontend requests -> Cloudflare -> VPS Nginx -> frontend containers
API requests -> Cloudflare -> Cloudflare Worker -> VPS Nginx -> API containers
```

This keeps API authentication, brand resolution, rewriting, and gateway behavior stable while compute moves from Cloud Run to VPS.

## Key Risks

| Risk | Mitigation |
| --- | --- |
| Worker behavior bypassed | Retain Worker for API hosts initially. |
| VPS misconfiguration | Review IaC before generating runnable configs. |
| Secret leakage | Templates only; production values stay outside Git. |
| DNS cutover failure | Keep Cloud Run active for rollback. |
| Missing health checks | Define verification checklist before deployment files. |
| Single VPS failure | Document disaster recovery and retain Cloud Run during migration. |

## Acceptance Criteria

- Routing matrix approved.
- ADRs approved.
- Environment template reviewed.
- Verification checklist reviewed.
- Compose and Nginx generation explicitly approved in a later phase.
- No production infrastructure changed during Phase 1.

## Validation Gates

1. Planning docs reviewed.
2. Compose design generated for review.
3. Nginx design generated for review.
4. Cloudflare design generated for review.
5. VPS staging deployment reviewed.
6. Production cutover approved.
7. GCP decommission approved separately.

## Rollback Strategy

Cloud Run remains live during migration. If VPS validation or cutover fails, restore traffic to the previous Cloudflare Worker/DNS routing and verify Cloud Run health endpoints.

## Document Map

- Routing matrix: `docs/deployment/hostinger-domain-routing-matrix.md`
- IaC review plan: `docs/deployment/hostinger-iac-review-plan.md`
- Hostinger planning root: `infra/hostinger/README.md`
- ADRs: `infra/hostinger/ADR/`
- Environment template: `infra/hostinger/env/.env.production.template`
- Variable reference: `infra/hostinger/env/variables.md`
- Migration checklist: `infra/hostinger/migration-checklist.md`
- Verification checklist: `infra/hostinger/verification-checklist.md`
- Operations: `infra/hostinger/operations/`
- Compose templates: `infra/hostinger/compose/`
- Nginx templates: `infra/hostinger/nginx/`
- Cloudflare planning: `infra/hostinger/cloudflare/`
