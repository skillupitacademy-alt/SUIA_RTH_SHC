# Restart Runbook

Status: planning runbook only.

## Goal

Restart one or more services on the VPS without changing code, DNS, or infrastructure topology.

## Future Procedure

1. Confirm active incident or maintenance reason.
2. Check current container health.
3. Restart the smallest affected service first.
4. Verify health endpoint.
5. Review logs for recurring errors.
6. Escalate to rollback only if restart does not restore service.

## Required Future Automation

- `health.sh`
- `verify.sh`
- service-specific restart command wrapper
