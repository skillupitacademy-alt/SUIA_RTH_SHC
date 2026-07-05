# Upgrade Runbook

Status: planning runbook only.

## Goal

Upgrade VPS packages, Docker, Nginx, or application images with controlled validation.

## Future Procedure

1. Review upgrade scope.
2. Confirm backup availability.
3. Run pre-upgrade verification.
4. Apply upgrade during maintenance window.
5. Run post-upgrade verification.
6. Monitor errors and resource usage.

## Constraints

No production upgrade should combine OS, Docker, Nginx, and application changes in one unreviewed step.
