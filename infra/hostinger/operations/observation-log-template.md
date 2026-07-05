# Production Observation Log

Use this after retained-Worker cutover before any GCP decommissioning.

## Daily Checks

| Date | Public routes 200 | Login smoke tests | Docker healthy | CPU/RAM/Disk OK | Nginx 5xx reviewed | Worker errors reviewed | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

## Decommission Gate

Do not delete Cloud Run services until:

- 7-14 days of stable observation are complete.
- Rollback targets are still documented.
- Placement scope is explicitly decided.
- Backups and monitoring are in place.
- Credential rotation is complete.
