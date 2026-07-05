# Cloudflare Planning

Status: Phase 3 planning artifacts only.

These documents describe the intended Cloudflare setup for the Hostinger migration. They do not change Cloudflare.

## Files

- `dns-records.md`
- `ssl-settings.md`
- `cache-rules.md`
- `waf-rules.md`

## Phase 3 Principle

Cloudflare remains the public edge. API Worker routing is retained for the initial cutover unless a later ADR changes it.
