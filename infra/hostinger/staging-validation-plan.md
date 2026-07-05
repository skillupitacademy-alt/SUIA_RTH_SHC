# Staging Validation Plan

Status: executed for non-placement hostnames using VPS-local and outside-in DNS override checks.

## Goal

Validate the Hostinger VPS stack before production DNS or Worker routing changes.

## Required Inputs

- Reviewed Docker Compose files.
- Reviewed Nginx configuration.
- Reviewed Cloudflare origin certificate coverage.
- Filled production-like environment file stored outside Git.
- Confirmed rollback targets on Cloud Run.
- Confirmed monitoring checks.

## Staging Options

| Option | Description | Notes |
| --- | --- | --- |
| Temporary subdomains | Use `staging-*` hostnames pointed to VPS | Best browser-level validation. |
| Host header testing | Use curl with `--resolve` against VPS IP | Good before DNS changes. |
| Local container-only testing | Run Compose and query container network | Good for first startup only. |

## Suggested Temporary Hostnames

- `staging-user.realtutorialhub.com`
- `staging-admin.realtutorialhub.com`
- `staging-user.skillupitacademy.com`
- `staging-admin.skillupitacademy.com`
- `staging-faculty.skillupitacademy.com`
- `staging-quiz.skillhubcore.in`
- `staging-tutorial.skillhubcore.in`
- `staging-api.skillhubcore.in`

These are planning candidates only. DNS must not be changed until reviewed.

## Validation Sequence

1. Verify VPS base state.
2. Verify Docker daemon and Compose plugin.
3. Verify Cloudflare Origin Certificate files.
4. Render Compose config.
5. Start containers.
6. Confirm every container is healthy.
7. Validate Nginx config.
8. Validate HTTPS through Cloudflare or `--resolve` testing.
9. Validate login flows for each brand.
10. Validate admin flows.
11. Validate quiz, tutorial, and faculty flows.
12. Validate API Worker-to-origin behavior if retained.
13. Run monitoring checks.
14. Record results and blockers.

## Acceptance Criteria

- No application container exposes public ports.
- Nginx is the only public ingress.
- TLS succeeds under Full (Strict).
- Health checks pass.
- Login cookies use correct domains.
- API requests preserve Worker behavior where retained.
- Rollback path is documented and tested at routing level.
- Cloud Run rollback services remain healthy.
- `placement.skillhubcore.in` remains excluded until placement-specific validation is approved.

## Stop Conditions

Stop and do not proceed to production cutover if:

- any auth flow fails
- any required health endpoint fails
- Nginx bypasses Worker behavior for API paths unintentionally
- origin certificate coverage is incomplete
- app containers expose public ports
- rollback target health is uncertain
