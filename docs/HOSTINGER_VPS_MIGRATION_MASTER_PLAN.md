# Hostinger VPS Migration Master Plan

Status: staging stack running on Hostinger VPS; production cutover pending explicit approval.

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
- Containers: Docker Compose.
- Network: internal Docker network for apps; only Nginx publishes public ports.
- API routing: Cloudflare Worker retained initially for API hosts.

## Current Execution State

- Planning artifacts are complete.
- Docker Compose and Nginx infrastructure templates are complete.
- VPS bootstrap is complete.
- Cloudflare Origin Certificate is installed on the VPS.
- Docker Compose stack is running on the VPS.
- Non-placement hostnames pass outside-in HTTPS validation with DNS overridden to the VPS IP.
- `placement.skillhubcore.in` is not part of the production cutover until placement-specific application work and validation are approved.

## Remaining Non-Goals

- Do not modify DNS without explicit cutover approval.
- Do not modify Cloudflare Worker routes.
- Do not remove or modify GCP deployment artifacts.
- Do not delete Cloud Run services.
- Do not export production secrets into Git.
- Do not cut over `placement.skillhubcore.in` in the current migration phase.

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
- Compose and Nginx generation complete and validated.
- VPS staging deployment validated for non-placement hostnames.
- No Cloudflare production routing or GCP production deployment artifacts changed during this phase.

## Validation Gates

1. Planning docs reviewed.
2. Compose design generated for review.
3. Nginx design generated for review.
4. Cloudflare design generated for review.
5. VPS staging deployment reviewed.
6. Production cutover approved for non-placement hostnames.
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
- Operational scripts: `infra/hostinger/scripts/`
- Monitoring plan: `infra/hostinger/monitoring/`
- VPS bootstrap plan: `infra/hostinger/bootstrap/`
- VPS bootstrap execution checklist: `infra/hostinger/bootstrap/execution-checklist.md`
- VS Code Remote SSH workflow: `infra/hostinger/remote-ssh/README.md`
- Staging validation plan: `infra/hostinger/staging-validation-plan.md`
- Production cutover plan: `infra/hostinger/production-cutover-plan.md`
- Future GCP decommission plan: `infra/hostinger/gcp-decommission-plan.md`
- Local template validation: `infra/hostinger/validation/local-template-validation.md`
- Local validation script: `infra/hostinger/validation/validate-templates.sh`
- Windows local validation script: `infra/hostinger/validation/validate-templates.ps1`
