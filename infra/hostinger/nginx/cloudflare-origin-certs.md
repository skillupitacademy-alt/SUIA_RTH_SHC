# Cloudflare Origin Certificates

Status: Phase 3 planning/configuration reference. Do not store real private keys in Git.

## Target

Use Cloudflare Full (Strict):

```text
Browser
Cloudflare edge
Nginx on VPS
Docker internal app network
```

Nginx should use a Cloudflare Origin Certificate, not Let's Encrypt.

## Required Certificate Coverage

The certificate should cover all public and Worker-origin hostnames selected for cutover.

Minimum frontend coverage:

- `user.realtutorialhub.com`
- `admin.realtutorialhub.com`
- `user.skillupitacademy.com`
- `admin.skillupitacademy.com`
- `faculty.skillupitacademy.com`
- `quiz.skillhubcore.in`
- `tutorial.skillhubcore.in`
- `placement.skillhubcore.in`
- `admin.skillhubcore.in`

If retaining Cloudflare Worker for API routing with origin hostnames, also cover:

- `origin-api.realtutorialhub.com`
- `origin-api.skillupitacademy.com`
- `origin-api.skillhubcore.in`

If retaining Cloudflare Worker for frontend routing with origin hostnames, also cover:

- `origin-user.realtutorialhub.com`
- `origin-admin.realtutorialhub.com`
- `origin-user.skillupitacademy.com`
- `origin-admin.skillupitacademy.com`
- `origin-faculty.skillupitacademy.com`
- `origin-quiz.skillhubcore.in`
- `origin-tutorial.skillhubcore.in`
- `origin-admin.skillhubcore.in`
- `origin-placement.skillhubcore.in`

If public API hosts are routed directly to Nginx in a later phase, also cover:

- `api.realtutorialhub.com`
- `api.skillupitacademy.com`
- `api.skillhubcore.in`

## Intended VPS Paths

```text
/opt/platform/nginx/certs/cloudflare-origin.pem
/opt/platform/nginx/certs/cloudflare-origin.key
```

The Compose template mounts the certificate directory as read-only into Nginx.

## Permission Target

```text
root:root
0644 cloudflare-origin.pem
0600 cloudflare-origin.key
```

## Review Notes

- Generate the certificate inside Cloudflare, not in this repository.
- Store the private key only on the VPS or secure secret storage.
- Do not commit the certificate private key.
- Confirm Cloudflare SSL/TLS mode is Full (Strict) before cutover.
- Confirm Cloudflare proxy is enabled for public hostnames.
