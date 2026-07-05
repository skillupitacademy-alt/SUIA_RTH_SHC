# Hostinger VPS Migration Planning

Status: retained-Worker origin routing is live; operations hardening and observation are in progress.

This directory defines the reviewable infrastructure baseline for migrating the `asia-southeast1` application stack from GCP Cloud Run to a Hostinger VPS.

## Scope

- Ubuntu 24.04 LTS.
- Nginx reverse proxy.
- Cloudflare Full (Strict).
- Cloudflare Origin Certificates.
- Docker Compose.
- Internal Docker networking.
- Only Nginx publicly exposed.
- Cloudflare Worker retained for frontend and API routing. Worker upstreams point to VPS `origin-*` hostnames.

## Current State

- Planning artifacts are generated.
- Docker Compose and Nginx templates are generated.
- VPS bootstrap has been executed.
- Cloudflare Origin Certificate has been installed on the VPS.
- The Docker Compose stack is running on the VPS.
- Public frontend/API validation passes through the retained Cloudflare Worker.
- Worker upstream variables point to VPS `origin-*` hostnames for frontend and API traffic.
- `placement.skillhubcore.in` is excluded from production cutover until placement-specific implementation and validation are approved.

## Artifacts

- `ADR/`: architecture decision records.
- `env/.env.production.template`: non-secret production variable template.
- `env/variables.md`: variable descriptions and ownership.
- `operations/`: operator runbooks and review notes.
- `repository-layout.md`: target repository and VPS layout.
- `migration-checklist.md`: migration phase checklist.
- `verification-checklist.md`: pre-deployment and pre-cutover verification gates.
- `monitoring/`: Prometheus, Grafana, Loki, Promtail, Node Exporter, cAdvisor, and Blackbox templates.
- `security/`: Fail2Ban, SSH, unattended-upgrades, and credential-rotation hardening templates.

## Remaining Hard Boundaries

- Do not modify Cloudflare Worker routes without explicit approval.
- Do not modify or remove GCP deployment artifacts.
- Do not delete Cloud Run services.
- Do not export production secrets into the repository.
- Do not cut over `placement.skillhubcore.in` in this phase.

## Source Of Truth

Read `docs/HOSTINGER_VPS_MIGRATION_MASTER_PLAN.md` first, then the routing matrix at `docs/deployment/hostinger-domain-routing-matrix.md`.
