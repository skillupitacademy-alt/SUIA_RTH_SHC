# Cloudflare Planning

Status: cutover reference only. Do not apply Cloudflare changes without explicit production cutover approval.

These documents describe the intended Cloudflare setup for the Hostinger migration. They do not change Cloudflare.

## Files

- `dns-records.md`
- `ssl-settings.md`
- `cache-rules.md`
- `waf-rules.md`
- `export-cloudflare-state.md`
- `export-cloudflare-state.ps1`
- `cloudflare-cutover-manifest.json`
- `apply-cloudflare-cutover.md`
- `apply-cloudflare-cutover.ps1`
- `token-permissions.md`

## Cutover Principle

Cloudflare remains the public edge. Frontend and API Worker routing are retained for the initial cutover unless a later ADR changes that decision.

Before any Cloudflare change, run the read-only export helper and keep the generated `state-exports/` directory outside Git for rollback evidence.

Cutover application tooling is dry-run by default and requires `-Apply` before it mutates Cloudflare.

Preferred frontend cutover keeps frontend Worker routes and switches Worker upstreams to dedicated VPS origin hostnames after those origin hostnames are validated. Direct DNS batches with `-SkipWorkerRoutes` are a fallback only. See `frontend-worker-audit.md` and `token-permissions.md`.
