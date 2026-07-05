# Hostinger Verification Checklist

Status: partially executed against the Hostinger VPS. Retained-Worker origin routing is live; remaining unchecked items require provider, placement, monitoring, or rollback validation.

## Host

- [x] Ubuntu 24.04 LTS detected.
- [ ] Kernel and package updates reviewed.
- [ ] Disk usage below alert threshold.
- [ ] Memory usage below alert threshold.
- [ ] CPU load below alert threshold.
- [ ] Time sync active.
- [x] Firewall allows only required public ports.
- [x] Fail2Ban enabled for SSH.
- [x] Unattended security upgrades enabled.

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

- [x] Nginx config syntax valid.
- [x] Nginx process running.
- [x] Port `80` reachable through Cloudflare.
- [x] Port `443` reachable through Cloudflare.
- [x] HTTP redirects to HTTPS.
- [x] Internal `/nginx_status` endpoint enabled for metrics exporter.
- [ ] WebSocket upgrade headers configured.
- [ ] Per-host access logs present.
- [ ] Security headers present.

## Monitoring

- [x] Prometheus running on `127.0.0.1:9090`.
- [x] Grafana running on `127.0.0.1:3009`.
- [x] Loki running on `127.0.0.1:3100`.
- [x] Promtail running.
- [x] Node Exporter running.
- [x] cAdvisor running.
- [x] Blackbox Exporter running.
- [x] Nginx Exporter running.
- [x] Prometheus targets report `up`.
- [ ] External alert destination configured.
- [ ] Alert delivery test completed.

## Cloudflare Origin TLS

- [x] Origin certificate installed.
- [x] Origin private key installed.
- [x] Certificate covers required hostnames.
- [x] File permissions restrict private key access.
- [ ] Cloudflare SSL mode is Full (Strict).
- [x] `origin-api.*` DNS records exist and route to the VPS through Cloudflare.
- [x] Frontend `origin-*` DNS records exist and route to the VPS through Cloudflare.

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
- [x] RealTutorialHub user login redirects to `/dashboard` through live Cloudflare/Worker/VPS path.
- [x] SkillUp user login redirects to `/dashboard` through live Cloudflare/Worker/VPS path.
- [x] Authenticated RTH and SkillUp dashboard SSR validates sessions through the gateway.

## Cutover Gates

- [ ] Cloud Run rollback targets are still healthy.
- [x] Cloudflare Worker routing model is confirmed.
- [x] Frontend Worker upstreams point to VPS origin hostnames.
- [x] DNS changes are reviewed; only origin records were applied.
- [x] Origin API DNS preparation completed.
- [x] Frontend origin DNS preparation completed.
- [x] Smoke tests are ready.
- [ ] Rollback owner and window are defined.
- [x] First VPS configuration backup completed.
- [ ] Shared Cloudflare and SSH credentials rotated.
- [ ] 7-14 day observation period completed.
