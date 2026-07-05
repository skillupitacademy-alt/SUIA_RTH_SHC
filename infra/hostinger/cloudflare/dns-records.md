# Cloudflare DNS Records

Status: cutover reference only. Do not apply without explicit production cutover approval.

## Direct Frontend Records

These records are candidates to point to the Hostinger VPS IP after review:

| Hostname | Type | Target | Proxy |
| --- | --- | --- | --- |
| `user.realtutorialhub.com` | `A` | `72.61.115.49` | Proxied |
| `admin.realtutorialhub.com` | `A` | `72.61.115.49` | Proxied |
| `user.skillupitacademy.com` | `A` | `72.61.115.49` | Proxied |
| `admin.skillupitacademy.com` | `A` | `72.61.115.49` | Proxied |
| `faculty.skillupitacademy.com` | `A` | `72.61.115.49` | Proxied |
| `quiz.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |
| `tutorial.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |
| `admin.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |

## Excluded From Current Cutover

| Hostname | Reason |
| --- | --- |
| `placement.skillhubcore.in` | The placement container health endpoint is healthy, but the placement user-facing homepage is not validated for production traffic. Do not cut over until placement-specific implementation and validation are approved. |

## API Origin Records For Worker Retention

If API Worker routing is retained, use origin hostnames to avoid Worker loops:

| Hostname | Type | Target | Proxy |
| --- | --- | --- | --- |
| `origin-api.realtutorialhub.com` | `A` | `72.61.115.49` | Proxied or reviewed origin mode |
| `origin-api.skillupitacademy.com` | `A` | `72.61.115.49` | Proxied or reviewed origin mode |
| `origin-api.skillhubcore.in` | `A` | `72.61.115.49` | Proxied or reviewed origin mode |

The Worker should use these origin hostnames as upstreams during the retained-Worker phase.

## Frontend Origin Records For Worker Retention

If frontend Worker routing is retained, use dedicated origin hostnames to avoid Worker loops:

| Hostname | Type | Target | Proxy |
| --- | --- | --- | --- |
| `origin-user.realtutorialhub.com` | `A` | `72.61.115.49` | Proxied |
| `origin-admin.realtutorialhub.com` | `A` | `72.61.115.49` | Proxied |
| `origin-user.skillupitacademy.com` | `A` | `72.61.115.49` | Proxied |
| `origin-admin.skillupitacademy.com` | `A` | `72.61.115.49` | Proxied |
| `origin-faculty.skillupitacademy.com` | `A` | `72.61.115.49` | Proxied |
| `origin-quiz.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |
| `origin-tutorial.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |
| `origin-admin.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |
| `origin-placement.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |

Do not set Worker frontend or placement upstreams to the public hostnames; that would create a Worker routing loop.

## Public API Records

Do not change these in Phase 3:

- `api.realtutorialhub.com`
- `api.skillupitacademy.com`
- `api.skillhubcore.in`

They are currently Worker-routed and should remain so until the API routing decision is reviewed.
