# Cloudflare State Export

Status: read-only helper. Do not commit generated exports.

Use `export-cloudflare-state.ps1` immediately before production cutover to capture rollback evidence for:

- zones
- DNS records
- SSL/TLS settings
- HTTPS settings
- HTTP/2, HTTP/3, and WebSocket settings
- zone rulesets
- Worker script metadata, settings, and deployments where the token permits access

## Usage

Set the token only in the local shell:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
```

Then run:

```powershell
.\infra\hostinger\cloudflare\export-cloudflare-state.ps1
```

Generated JSON files are written under:

```text
infra/hostinger/cloudflare/state-exports/
```

That directory is gitignored because it may contain operational metadata.

## Safety

The script only uses Cloudflare `GET` requests. It does not create, update, or delete DNS records, Worker routes, Worker variables, cache rules, or WAF rules.
