# Rollback Runbook

Status: planning runbook only.

## Goal

Restore traffic to the last known good state if VPS cutover fails.

## Rollback Principles

- Keep Cloud Run alive during migration.
- Keep previous Cloudflare routing state documented.
- Prefer routing rollback before application rollback.
- Do not delete failed containers until logs are captured.

## Future Procedure

1. Confirm failure against acceptance criteria.
2. Freeze new deployment activity.
3. Restore previous Cloudflare DNS or Worker routing.
4. Verify public health endpoints.
5. Confirm user login and API flows.
6. Capture logs and incident notes.
