# Firewall Plan

Status: planning instructions only.

## Public Ports

Only these public ports should be open:

| Port | Purpose |
| ---: | --- |
| 22 | SSH |
| 80 | HTTP redirect / Cloudflare edge traffic |
| 443 | HTTPS Cloudflare edge traffic |

Application ports must not be exposed publicly.

## UFW Candidate Commands

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status verbose
```

## Hostinger Firewall

Mirror the same policy in Hostinger's firewall panel:

- allow SSH from trusted IPs if possible
- allow 80/tcp
- allow 443/tcp
- deny all app container ports

## Cloudflare-Only Origin Restriction

Optional later hardening: restrict ports 80/443 to Cloudflare IP ranges. Do this only after confirming Hostinger firewall supports maintainable IP range rules and after console recovery is available.
