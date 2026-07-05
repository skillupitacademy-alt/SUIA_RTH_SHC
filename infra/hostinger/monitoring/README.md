# Monitoring Plan

Status: Phase 5 planning artifacts.

This directory defines what must be monitored before and after the Hostinger VPS migration. It does not install monitoring agents or create vendor-side checks.

## Goals

- Detect service outage quickly.
- Detect VPS resource exhaustion before user impact.
- Preserve enough logs for rollback and incident review.
- Keep Cloud Run rollback health visible during migration.
- Verify Cloudflare edge behavior after cutover.

## Documents

- `checks.md`: required synthetic and service checks.
- `alerts.md`: alert thresholds and severity levels.
- `logs.md`: log retention and review plan.
- `dashboards.md`: dashboard requirements.
