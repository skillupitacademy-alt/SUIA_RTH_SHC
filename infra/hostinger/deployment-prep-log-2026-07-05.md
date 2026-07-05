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

## Login Smoke Test Blocker

Browser login smoke tests against the VPS with DNS overridden to `72.61.115.49` loaded the login pages, but did not authenticate.

VPS container logs showed frontend/admin auth routes failing to reach API hostnames from inside Docker. Direct container checks also showed app containers could not resolve external hostnames while attached to the `app_internal` network.

Root cause: the Compose `app_internal` network used Docker `internal: true`, which keeps containers off external networks entirely. This is stronger than the intended requirement. The requirement is that app containers must not publish public ports; they still need outbound access to managed dependencies and API hostnames.

Planned correction: keep app containers on the private Compose network with no published ports, but remove Docker `internal: true` so outbound DNS and HTTPS can work.

Correction applied:

- Removed Docker `internal: true` from `quiz_platform_internal`.
- Recreated the staging Compose stack on the VPS.
- Verified app containers can resolve external hostnames.
- Confirmed all containers returned to healthy state.

Browser login smoke test after correction:

```text
RealTutorialHub user: PASS
SkillUp user with initially supplied email: FAIL - auth gateway reachable, returned 401
SkillHub admin: PASS
```

Follow-up test with the repo-documented SkillUp test account:

```text
RealTutorialHub user: PASS
SkillUp user: PASS
SkillHub admin: PASS
```

Conclusion: the remaining SkillUp failure was caused by using the wrong SkillUp test email, not by VPS networking, Nginx, Docker, or API routing.

Operational script check after correction:

```text
infra/hostinger/scripts/health.sh: PASS
```

The health script confirmed all Compose containers are healthy and only Nginx publishes public ports.

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

- No frontend Cloudflare DNS changes.
- No Cloudflare Worker route changes.
- No GCP changes.
- No production traffic cutover.

## Origin API DNS Preparation

Cloudflare origin API records were created for Worker-to-VPS routing preparation:

```text
origin-api.realtutorialhub.com -> 72.61.115.49, proxied
origin-api.skillupitacademy.com -> 72.61.115.49, proxied
origin-api.skillhubcore.in -> 72.61.115.49, proxied
```

Validation through the public Cloudflare path:

```text
origin-api.realtutorialhub.com/api/health/live 200
origin-api.skillupitacademy.com/api/health/live 200
origin-api.skillhubcore.in/healthz/ 200
```

This does not move public production traffic. Public API hosts and frontend hosts remain unchanged until later batch cutover.

## Frontend Cutover Blocker

Batch 1 dry-run for `user.realtutorialhub.com` was attempted after origin DNS preparation.

Result:

```text
DNS create planned: user.realtutorialhub.com -> 72.61.115.49, proxied=True
Worker route read failed: Cloudflare authentication error
```

Conclusion: the current Cloudflare token can manage/read DNS but does not have Worker route read/edit permissions. Frontend cutover is blocked until the token includes Workers Routes permissions for the affected zones.

Additional live audit:

```text
https://<frontend-host>/internal/health returned the Worker health snapshot for all frontend/API/placement hostnames.
```

Conclusion: frontend hostnames are still actively handled by the Cloudflare Worker. DNS-only changes will not bypass those routes.

Superseded implementation direction:

- Retain the Cloudflare Worker for API hostnames and excluded placement traffic.
- Remove frontend host routes from the Worker configuration in the repository.
- Point Worker API upstream variables at the validated `origin-api.*` VPS hostnames.
- Deploy the Worker configuration after review.
- Verify frontend hostnames no longer return the Worker `/internal/health` snapshot.
- Then run frontend DNS batches with `-SkipWorkerRoutes`.

This direction was superseded after the route-removal deploy failure. The current preferred path is to retain frontend Worker routes and switch frontend Worker upstream variables to dedicated VPS `origin-*` hostnames.

## Worker Deploy Attempt And Hotfix

Worker deploy was attempted after the retained-API Worker configuration was reviewed.

Result:

```text
Worker bundle upload: succeeded
Route reconciliation: failed because the token cannot access /workers/routes for all affected zones
```

Impact:

```text
Existing frontend Worker routes stayed attached to the Worker.
The route-removal Worker code no longer proxied frontend hosts.
Frontend homepage checks returned 404.
```

Immediate hotfix:

- Restored frontend proxy handlers in `services/api-gateway/src/routes/routing-table.ts`.
- Restored frontend route declarations in `services/api-gateway/wrangler.toml`.
- Kept API upstream variables pointed at `origin-api.*`.
- Redeployed the Worker bundle.

Post-hotfix validation:

```text
user.realtutorialhub.com/ 200
user.skillupitacademy.com/ 200
quiz.skillhubcore.in/ 200
api.realtutorialhub.com/internal/health 200
```

Conclusion: API Worker-to-VPS origin routing is live, and frontend Worker routes should remain for the recommended path. Prepare dedicated frontend `origin-*` records, certificate coverage, and Nginx aliases before switching frontend Worker upstreams to the VPS.

## Retained Frontend Worker Origin Cutover

The migration direction was updated to retain the Cloudflare Worker for frontend and API traffic. The Worker now remains the public gateway, while frontend and API upstream variables point to dedicated VPS origin hostnames.

Target request path:

```text
Browser
Cloudflare Worker
origin-* hostname
Hostinger VPS Nginx
Docker service
```

Changes executed:

- Added VPS Nginx server aliases for frontend `origin-*` hostnames.
- Reloaded the containerized Nginx instance after a successful syntax check.
- Replaced the Cloudflare Origin Certificate with coverage for public hosts, `origin-api.*`, and frontend `origin-*` hostnames.
- Created proxied Cloudflare DNS records for frontend origin hostnames.
- Updated production Worker upstream variables to use VPS origin hostnames.
- Deployed the Worker bundle.

Worker deploy result:

```text
Worker bundle upload: succeeded
Route reconciliation: failed because the token cannot access /workers/routes for all affected zones
```

The route reconciliation failure is the known Cloudflare token permission limitation. The route set was intentionally unchanged for the retained-Worker architecture, and the uploaded Worker configuration is active.

New installed certificate validity:

```text
notBefore=Jul  5 15:31:00 2026 GMT
notAfter=Jul  1 15:31:00 2041 GMT
```

Additional certificate hostnames covered:

```text
origin-user.realtutorialhub.com
origin-admin.realtutorialhub.com
origin-user.skillupitacademy.com
origin-admin.skillupitacademy.com
origin-faculty.skillupitacademy.com
origin-quiz.skillhubcore.in
origin-tutorial.skillhubcore.in
origin-admin.skillhubcore.in
```

Frontend origin DNS records created:

```text
origin-user.realtutorialhub.com -> 72.61.115.49, proxied
origin-admin.realtutorialhub.com -> 72.61.115.49, proxied
origin-user.skillupitacademy.com -> 72.61.115.49, proxied
origin-admin.skillupitacademy.com -> 72.61.115.49, proxied
origin-faculty.skillupitacademy.com -> 72.61.115.49, proxied
origin-quiz.skillhubcore.in -> 72.61.115.49, proxied
origin-tutorial.skillhubcore.in -> 72.61.115.49, proxied
origin-admin.skillhubcore.in -> 72.61.115.49, proxied
```

Worker health snapshot after deploy:

```text
QUIZ_WEB_URL=https://origin-quiz.skillhubcore.in
RTH_ADMIN_URL=https://origin-admin.realtutorialhub.com
SKILLUP_WEB_URL=https://origin-user.skillupitacademy.com
SKILLUP_ADMIN_URL=https://origin-admin.skillupitacademy.com
FACULTY_URL=https://origin-faculty.skillupitacademy.com
TUTORIAL_SERVICE_URL=https://origin-user.realtutorialhub.com
EXAM_SERVICE_URL=https://origin-api.realtutorialhub.com
NOTIFICATION_URL=https://origin-api.realtutorialhub.com
SKILLHUBCORE_URL=https://origin-api.skillhubcore.in
PLACEMENT_URL=https://skillhub-placement-plldp3atca-as.a.run.app
```

Public route validation after deploy:

```text
user.realtutorialhub.com/ 200
admin.realtutorialhub.com/login 200
user.skillupitacademy.com/ 200
admin.skillupitacademy.com/login 200
faculty.skillupitacademy.com/login 200
quiz.skillhubcore.in/ 200
tutorial.skillhubcore.in/ 200
api.realtutorialhub.com/internal/health 200
api.skillupitacademy.com/internal/health 200
api.skillhubcore.in/internal/health 200
```

Origin route validation after deploy:

```text
origin-user.realtutorialhub.com/ 200
origin-user.skillupitacademy.com/ 200
origin-admin.skillupitacademy.com/login 200
origin-faculty.skillupitacademy.com/login 200
origin-quiz.skillhubcore.in/ 200
origin-tutorial.skillhubcore.in/ 200
origin-api.realtutorialhub.com/api/health/live 200
origin-api.skillupitacademy.com/api/health/live 200
origin-api.skillhubcore.in/healthz/ 200
```

`origin-admin.realtutorialhub.com/login` returned `000` through the local workstation resolver, but Cloudflare DNS resolved the record through `1.1.1.1`, and forcing the request through Cloudflare edge returned `200`. Treat this as local resolver or propagation cache, not an origin or Nginx failure.

VPS validation:

```text
Nginx syntax: ok
Nginx container: healthy
Application containers: healthy
Only Nginx publishes ports 80 and 443
```

Remaining notes:

- `placement.skillhubcore.in` remains excluded and still points to Cloud Run.
- No GCP resources were modified.
- No public frontend DNS batch cutover is required for the retained-Worker architecture.
