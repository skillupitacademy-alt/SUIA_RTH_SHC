# Cloudflare SSL Settings

Status: planning reference only.

## Required Settings

- SSL/TLS encryption mode: Full (Strict)
- Always Use HTTPS: enabled
- Automatic HTTPS Rewrites: enabled
- Minimum TLS version: TLS 1.2 or higher
- HTTP/2: enabled
- HTTP/3: enabled if stable for the account
- WebSockets: enabled

## Origin Certificate

Use a Cloudflare Origin Certificate installed on Nginx. See `../nginx/cloudflare-origin-certs.md`.

## Review Gate

Before cutover, verify every hostname resolves through Cloudflare and receives a valid edge certificate from the browser perspective.
