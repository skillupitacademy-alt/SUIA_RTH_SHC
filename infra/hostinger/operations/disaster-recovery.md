# Disaster Recovery Plan

Status: planning document only.

## Recovery Objectives

Recovery targets are not finalized. Proposed starting points for review:

- RTO: 2 hours for frontend recovery.
- RTO: 4 hours for full API recovery.
- RPO: governed by external database and storage providers.

## Major Failure Scenarios

- VPS unavailable.
- Nginx misconfiguration.
- Docker daemon unavailable.
- Bad application image.
- Cloudflare routing error.
- External database or Redis outage.

## Recovery Strategy

During migration, Cloud Run remains the primary rollback target. After migration, recovery strategy should include a rebuildable VPS, documented Cloudflare settings, environment backups, and external provider restore procedures.
