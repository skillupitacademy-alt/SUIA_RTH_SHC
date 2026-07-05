# VPS Migration Completed

Completion date: 2026-07-05

Status: primary production migration complete; observation window active.

## Summary

The primary production platform has moved from the previous GCP Cloud Run compute path to the Hostinger VPS architecture. Cloudflare remains the public edge and Cloudflare Worker remains the gateway layer for retained routing, authentication, brand resolution, and upstream control.

Placement is deferred by design and should be treated as a Phase 2 application launch, not a blocker for the core migration.

## Production Architecture

```text
Users
  -> Cloudflare Edge
  -> Cloudflare Worker
  -> origin-* hostnames
  -> Hostinger VPS
  -> Nginx
  -> Docker Compose
  -> Applications
  -> Neon, Upstash, R2, Resend, and external services
```

## VPS

- Provider: Hostinger VPS
- OS target: Ubuntu 24.04 LTS
- Public IP: `72.61.115.49`
- Public exposure: Nginx only on ports `80` and `443`
- App networking: internal Docker network

## Cloudflare Model

- Cloudflare SSL mode: Full (Strict)
- TLS origin: Cloudflare Origin Certificate
- Worker retained as edge gateway
- Worker upstreams use dedicated `origin-*` hostnames to avoid public hostname routing loops
- Public DNS and Worker routes should remain managed through the reviewed Cloudflare runbooks

## Validated Production Surfaces

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

## Monitoring And Operations

Installed baseline:

- Prometheus
- Grafana
- Loki
- Promtail
- Node Exporter
- cAdvisor
- Blackbox Exporter
- Nginx Exporter
- Fail2Ban
- Unattended upgrades
- Backup scripts and operational docs

Primary operations document:

- `PROJECT_OPERATIONS_RUNBOOK.md`

## Rollback Procedure

During the observation window, keep the previous GCP Cloud Run services available as rollback targets.

Rollback order:

1. Stop new production changes.
2. Identify whether the failure is Worker, DNS, Nginx, container, application, database, Redis, or external provider.
3. If Worker-related, redeploy the previous Worker revision or restore previous Worker variables.
4. If DNS/origin-related, use the Cloudflare state export and rollback docs.
5. If VPS app-related, restart or roll back only the affected container.
6. If VPS-wide, route traffic back to the known-good GCP services.

References:

- `PROJECT_OPERATIONS_RUNBOOK.md`
- `infra/hostinger/rollback/`
- `infra/hostinger/operations/rollback.md`
- `infra/hostinger/cloudflare/export-cloudflare-state.md`
- `infra/hostinger/gcp-decommission-plan.md`

## Observation Period

Observation started: 2026-07-05

Week 1:

- Monitor CPU, RAM, disk, Docker restarts, Nginx logs, Worker health, login success, and API latency.

Week 2:

- Confirm no recurring restarts, authentication failures, database connectivity problems, Redis issues, Cloudflare routing issues, or unexpected Cloud Run dependency.

## Remaining Work

- Keep GCP resources available during the observation window.
- Rotate migration-exposed credentials and tokens.
- Decommission unused GCP resources only after stability is confirmed.
- Keep placement as a separate Phase 2 application until its auth handoff and business workflows are validated.
- Review billing after one complete billing cycle.

## Local Git Checkpoints

Recommended local safety references:

- Tag: `v2.0.0-vps-migration`
- Backup branch: `backup/vps-migration-final`

Keep the feature branch until the observation period and GCP cleanup are complete.
