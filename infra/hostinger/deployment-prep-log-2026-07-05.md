# Hostinger Deployment Preparation Log

Date: 2026-07-05
Status: deployment preparation completed up to the Cloudflare Origin Certificate gate

## Completed

- Created `/opt/platform/nginx/certs`.
- Created `/opt/platform/logs/nginx`.
- Uploaded `/opt/platform/env/.env.production` from the approved template and local environment sources.
- Set `/opt/platform/env/.env.production` ownership to `deploy:deploy`.
- Set `/opt/platform/env/.env.production` mode to `0600`.
- Copied the committed repository snapshot to `/opt/platform/apps/quiz-platform`.
- Verified no local `.env`, `.pem`, `.key`, or SSH key files exist in the VPS repository checkout.
- Validated Docker Compose configuration on the VPS using:

```bash
HOSTINGER_ENV_FILE=/opt/platform/env/.env.production \
HOSTINGER_CERT_DIR=/opt/platform/nginx/certs \
HOSTINGER_LOG_DIR=/opt/platform/logs \
docker compose \
  --env-file /opt/platform/env/.env.production \
  -f infra/hostinger/compose/docker-compose.yml \
  -f infra/hostinger/compose/docker-compose.production.yml \
  config
```

Result: `COMPOSE_CONFIG_OK`

## Security Cleanup

- Removed tracked `apps/realtutorialhub-quiz/.env.production` from git.
- Added `.env.production` to `.gitignore`.
- Confirmed the file is not present in the refreshed VPS checkout.

## Blocker

Cloudflare Origin Certificate installation is blocked by Cloudflare credentials:

- Existing `CLOUDFLARE_API_TOKEN` authenticates as expired.
- Existing `CLOUDFLARE_API_TOKEN_ACCESS` does not authenticate.
- Existing `CLOUDFLARE_API_TOKEN_SKILLUP` authenticates but was not accepted for Origin CA certificate generation.
- Newly provided Cloudflare token was rejected by Cloudflare token verification as invalid.
- Existing global API key plus inferred account email failed Cloudflare authentication.

## Required Next Input

Provide one of:

- A valid Cloudflare API token with permission to create Origin CA certificates.
- Manually generated Cloudflare Origin Certificate and private key files.

Required VPS target paths:

```text
/opt/platform/nginx/certs/cloudflare-origin.pem
/opt/platform/nginx/certs/cloudflare-origin.key
```

Required permissions:

```text
root:root 0644 cloudflare-origin.pem
root:root 0600 cloudflare-origin.key
```

## Not Executed

- No Docker Compose services started.
- No Nginx container started.
- No Cloudflare DNS changes.
- No Cloudflare Worker route changes.
- No GCP changes.
- No production traffic cutover.
