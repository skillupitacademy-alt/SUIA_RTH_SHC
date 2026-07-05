# Hostinger VPS Migration Planning

Status: Phase 1 planning artifacts only.

This directory defines the reviewable planning baseline for migrating the `asia-southeast1` application stack from GCP Cloud Run to a Hostinger VPS.

## Scope

- Ubuntu 24.04 LTS.
- Nginx reverse proxy.
- Cloudflare Full (Strict).
- Cloudflare Origin Certificates.
- Docker Compose in later phases.
- Internal Docker networking in later phases.
- Only Nginx publicly exposed in later phases.
- Cloudflare Worker retained for API routing in the initial cutover unless a later ADR changes that decision.

## Phase 1 Artifacts

- `ADR/`: architecture decision records.
- `env/.env.production.template`: non-secret production variable template.
- `env/variables.md`: variable descriptions and ownership.
- `operations/`: operator runbooks and review notes.
- `repository-layout.md`: target repository and VPS layout.
- `migration-checklist.md`: migration phase checklist.
- `verification-checklist.md`: pre-deployment and pre-cutover verification gates.

## Hard Boundaries

Phase 1 must not:

- connect to the VPS
- execute remote commands
- modify Cloudflare DNS or Worker routes
- modify or remove GCP deployment artifacts
- delete Cloud Run services
- export production secrets into the repository
- generate runnable Docker Compose or Nginx configuration
- generate deployment automation that assumes live infrastructure

## Source Of Truth

Read `docs/HOSTINGER_VPS_MIGRATION_MASTER_PLAN.md` first, then the routing matrix at `docs/deployment/hostinger-domain-routing-matrix.md`.
