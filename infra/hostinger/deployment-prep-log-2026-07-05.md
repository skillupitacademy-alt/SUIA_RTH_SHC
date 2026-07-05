# Hostinger Deployment Preparation Log

Date: 2026-07-05
Status: staging stack running on Hostinger VPS, pending DNS/Cloudflare cutover approval

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
- Built all Docker images on the VPS.
- Started the Docker Compose stack.
- Confirmed all Compose containers report healthy.
- Confirmed container Nginx is publicly bound to ports `80` and `443`.
- Stopped and disabled host package Nginx so only container Nginx owns public HTTP/HTTPS.
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

## Staging Runtime Validation

Container status:

```text
api-server: healthy
faculty-app: healthy
nginx: healthy, publishes 80 and 443
realtutorialhub-admin: healthy
realtutorialhub-quiz: healthy
realtutorialhub-web: healthy
skillhub-placement: healthy at health endpoint
skillhubcore-admin: healthy
skillhubcore-service: healthy
skillup-admin: healthy
skillup-web: healthy
```

Local Nginx/SNI checks from the VPS:

```text
user.realtutorialhub.com 200
admin.realtutorialhub.com 307
user.skillupitacademy.com 200
admin.skillupitacademy.com 307
faculty.skillupitacademy.com 307
quiz.skillhubcore.in 200
tutorial.skillhubcore.in 200
admin.skillhubcore.in 307
api.realtutorialhub.com 200
origin-api.realtutorialhub.com 200
api.skillupitacademy.com 200
origin-api.skillupitacademy.com 200
api.skillhubcore.in 403
origin-api.skillhubcore.in 403
```

`403` for SkillHub API root is expected at `/`; `/healthz/` returns `200`.

Outside-in HTTPS checks from the local workstation with DNS overridden to `72.61.115.49`:

```text
user.realtutorialhub.com 200
admin.realtutorialhub.com 307
user.skillupitacademy.com 200
admin.skillupitacademy.com 307
faculty.skillupitacademy.com 307
quiz.skillhubcore.in 200
tutorial.skillhubcore.in 200
admin.skillhubcore.in 307
api.realtutorialhub.com 200
origin-api.realtutorialhub.com 200
api.skillupitacademy.com 200
origin-api.skillupitacademy.com 200
api.skillhubcore.in 403
origin-api.skillhubcore.in 403
api.skillhubcore.in /healthz/ 200
origin-api.skillhubcore.in /healthz/ 200
```

## Placement Scope Note

`placement.skillhubcore.in` is not validated for user traffic in this phase.

The placement container health endpoint is healthy, but the placement homepage currently depends on placement application behavior that is not part of this migration task. Per operator instruction, no placement application programming changes were made.

Do not cut over `placement.skillhubcore.in` until placement-specific implementation and validation are explicitly approved.

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

- No Cloudflare DNS changes.
- No Cloudflare Worker route changes.
- No GCP changes.
- No production traffic cutover.
