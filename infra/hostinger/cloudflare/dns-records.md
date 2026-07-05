# Cloudflare DNS Records

Status: planning reference only. Do not apply without review.

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
| `placement.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |
| `admin.skillhubcore.in` | `A` | `72.61.115.49` | Proxied |

## API Origin Records For Worker Retention

If API Worker routing is retained, use origin hostnames to avoid Worker loops:

| Hostname | Type | Target | Proxy |
| --- | --- | --- | --- |
| `origin-api.realtutorialhub.com` | `A` | `72.61.115.49` | Proxied or reviewed origin mode |
| `origin-api.skillupitacademy.com` | `A` | `72.61.115.49` | Proxied or reviewed origin mode |
| `origin-api.skillhubcore.in` | `A` | `72.61.115.49` | Proxied or reviewed origin mode |

The Worker should use these origin hostnames as upstreams during the retained-Worker phase.

## Public API Records

Do not change these in Phase 3:

- `api.realtutorialhub.com`
- `api.skillupitacademy.com`
- `api.skillhubcore.in`

They are currently Worker-routed and should remain so until the API routing decision is reviewed.
