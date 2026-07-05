# Hostinger Deployment Preparation Log

Date: 2026-07-05
Status: deployment preparation completed through the Cloudflare Origin Certificate gate

## Completed

- Created `/opt/platform/nginx/certs`.
- Created `/opt/platform/logs/nginx`.
- Uploaded `/opt/platform/env/.env.production` from the approved template and local environment sources.
- Set `/opt/platform/env/.env.production` ownership to `deploy:deploy`.
- Set `/opt/platform/env/.env.production` mode to `0600`.
- Copied the committed repository snapshot to `/opt/platform/apps/quiz-platform`.
- Verified no local `.env`, `.pem`, `.key`, or SSH key files exist in the VPS repository checkout.
- Generated and installed a Cloudflare Origin Certificate.
- Installed the Cloudflare Origin Certificate private key.
- Verified the certificate parses with OpenSSL.
- Verified the private key parses with OpenSSL.
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

## Cloudflare Origin Certificate

Final installed paths:

```text
/opt/platform/nginx/certs/cloudflare-origin.pem
/opt/platform/nginx/certs/cloudflare-origin.key
```

Permissions:

```text
root:root 0644 cloudflare-origin.pem
root:root 0600 cloudflare-origin.key
```

Validity:

```text
notBefore=Jul  5 08:34:00 2026 GMT
notAfter=Jul  1 08:34:00 2041 GMT
```

Covered hostnames requested:

```text
user.realtutorialhub.com
admin.realtutorialhub.com
api.realtutorialhub.com
origin-api.realtutorialhub.com
user.skillupitacademy.com
admin.skillupitacademy.com
faculty.skillupitacademy.com
api.skillupitacademy.com
origin-api.skillupitacademy.com
quiz.skillhubcore.in
tutorial.skillhubcore.in
placement.skillhubcore.in
admin.skillhubcore.in
api.skillhubcore.in
origin-api.skillhubcore.in
```

## Previous Credential Notes

- Existing `CLOUDFLARE_API_TOKEN` authenticated as expired.
- Existing `CLOUDFLARE_API_TOKEN_ACCESS` did not authenticate.
- Existing `CLOUDFLARE_API_TOKEN_SKILLUP` authenticated but was not accepted for Origin CA certificate generation.
- First newly provided token was rejected by Cloudflare token verification as invalid.
- Final newly provided token authenticated and was used to generate the installed Origin Certificate.

## Not Executed

- No Docker Compose services started.
- No Nginx container started.
- No Cloudflare DNS changes.
- No Cloudflare Worker route changes.
- No GCP changes.
- No production traffic cutover.
