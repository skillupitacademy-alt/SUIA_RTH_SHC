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

## Cutover Principle

Cloudflare remains the public edge. API Worker routing is retained for the initial cutover unless a later ADR changes it.

Before any Cloudflare change, run the read-only export helper and keep the generated `state-exports/` directory outside Git for rollback evidence.

Cutover application tooling is dry-run by default and requires `-Apply` before it mutates Cloudflare.
