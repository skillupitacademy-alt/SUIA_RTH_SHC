# Production Cutover Plan

Status: planning artifact only. Do not execute without explicit approval.

## Preconditions

- Staging validation completed.
- Monitoring checks active or manually ready.
- Cloud Run rollback services healthy.
- Cloudflare DNS and Worker changes reviewed.
- Maintenance window selected.
- Owner present for rollback decision.

## Recommended Initial Cutover

Use the retained-Worker model:

```text
Frontend hosts -> Cloudflare -> VPS Nginx -> frontend containers
API hosts -> Cloudflare Worker -> VPS Nginx origin hosts -> API containers
```

## Cutover Order

1. Confirm current Cloud Run health.
2. Confirm VPS health.
3. Confirm monitoring is active.
4. Move one low-risk frontend hostname.
5. Validate browser and auth behavior.
6. Continue frontend hostnames in batches.
7. Update Worker upstreams to reviewed API origin hostnames only after frontend validation.
8. Validate API flows.
9. Keep Cloud Run live.
10. Monitor for at least one full business cycle before decommission planning.

## Rollback Triggers

- sustained 5xx errors
- login failures
- cookie-domain errors
- Worker routing loop
- Nginx upstream failures
- database connectivity failures
- unacceptable latency regression

## Rollback Action

Restore previous Cloudflare DNS and Worker upstream values to Cloud Run targets, then validate public health and auth flows.

## Out Of Scope

- Cloud Run deletion.
- Artifact Registry cleanup.
- Secret Manager cleanup.
- GCP project cost decommissioning.

Those require a separate decommission phase.
