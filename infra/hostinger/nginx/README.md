# Nginx Templates

Status: Phase 3 template artifacts.

These files define the intended Nginx reverse-proxy layout for the Hostinger VPS. They are not deployed in this phase.

## Files

- `nginx.conf`: base Nginx configuration.
- `conf.d/frontend.conf`: public frontend host routing.
- `conf.d/api-origin.conf`: API origin host routing for Cloudflare Worker upstreams.
- `conf.d/skillhub.conf`: SkillHub public and origin routing.
- `snippets/proxy-common.conf`: shared proxy headers.
- `snippets/security-headers.conf`: baseline response headers.
- `snippets/cloudflare-real-ip.conf`: Cloudflare real client IP handling.
- `snippets/ssl-origin.conf`: Cloudflare Origin Certificate TLS settings.
- `cloudflare-origin-certs.md`: certificate installation and review notes.

## Important Routing Constraint

Phase 1 API routing keeps Cloudflare Worker in front of API hosts. If the Worker fetches the same public API hostname that is routed to the Worker, it can create a loop.

Use reviewed origin hostnames for Worker-to-VPS traffic, for example:

- `origin-api.realtutorialhub.com`
- `origin-api.skillupitacademy.com`
- `origin-api.skillhubcore.in`

These origin hostnames should be proxied through Cloudflare with Full (Strict), or otherwise covered by the chosen Cloudflare origin strategy. Final DNS design is still a separate review item.
