# Hostinger Verification Checklist

Status: partially executed against the Hostinger VPS. Remaining unchecked items require browser, Worker, provider, or cutover validation.

## Host

- [x] Ubuntu 24.04 LTS detected.
- [ ] Kernel and package updates reviewed.
- [ ] Disk usage below alert threshold.
- [ ] Memory usage below alert threshold.
- [ ] CPU load below alert threshold.
- [ ] Time sync active.
- [x] Firewall allows only required public ports.

## Docker

- [x] Docker service running.
- [x] Docker Compose plugin installed.
- [ ] Expected Docker networks exist.
- [x] Only Nginx publishes public ports.
- [x] Application containers are on internal network only.
- [x] Containers report healthy.
- [x] Restart policies are configured.
- [x] Application containers can resolve and reach required external dependencies.

## Nginx

- [ ] Nginx config syntax valid.
- [x] Nginx process running.
- [ ] Port `80` reachable through Cloudflare.
- [ ] Port `443` reachable through Cloudflare.
- [x] HTTP redirects to HTTPS.
- [ ] WebSocket upgrade headers configured.
- [ ] Per-host access logs present.
- [ ] Security headers present.

## Cloudflare Origin TLS

- [x] Origin certificate installed.
- [x] Origin private key installed.
- [x] Certificate covers required hostnames.
- [x] File permissions restrict private key access.
- [ ] Cloudflare SSL mode is Full (Strict).

## External Services

- [ ] Neon/Postgres connectivity works.
- [ ] Upstash Redis connectivity works.
- [ ] Upstash Vector connectivity works where required.
- [ ] R2 connectivity works where required.
- [ ] Resend connectivity works.
- [ ] Sentry DSN/token configuration reviewed.

## Application Health

- [x] `api-server` health endpoint returns expected status.
- [x] `realtutorialhub-web` homepage returns expected status.
- [x] `realtutorialhub-admin` returns expected status or auth redirect.
- [x] `skillup-web` health endpoint returns expected status.
- [x] `skillup-admin` health endpoint returns expected status.
- [x] `faculty-app` health endpoint returns expected status.
- [x] `realtutorialhub-quiz` returns expected status.
- [x] `skillhub-placement` health endpoint returns expected status.
- [x] `skillhubcore-admin` health endpoint returns expected status.
- [x] `skillhubcore-service` health endpoint returns expected status.
- [ ] `placement.skillhubcore.in` user-facing homepage is validated.
- [x] RealTutorialHub user login works against the VPS with DNS override.
- [x] SkillUp user login works against the VPS with DNS override.
- [x] SkillHub admin login works against the VPS with DNS override.

## Cutover Gates

- [ ] Cloud Run rollback targets are still healthy.
- [ ] Cloudflare Worker routing model is confirmed.
- [ ] DNS changes are reviewed but not applied by automation.
- [ ] Smoke tests are ready.
- [ ] Rollback owner and window are defined.
