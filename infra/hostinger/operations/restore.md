# Restore Runbook

Status: planning runbook only.

## Goal

Restore service from backups after data loss, host failure, or bad deployment.

## Future Procedure

1. Identify restore target and timestamp.
2. Stop affected write paths if needed.
3. Restore files, volumes, or external data according to the affected system.
4. Validate integrity.
5. Run application health checks.
6. Reopen traffic.

## Notes

Database restore procedures depend on the actual database provider. If Neon remains the database system, Neon restore procedures should be documented separately.
