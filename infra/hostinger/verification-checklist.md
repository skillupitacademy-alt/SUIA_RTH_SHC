# Hostinger Verification Checklist

Status: planning checklist only. This is the checklist a later `verify.sh` should implement.

## Host

- [ ] Ubuntu 24.04 LTS detected.
- [ ] Kernel and package updates reviewed.
- [ ] Disk usage below alert threshold.
- [ ] Memory usage below alert threshold.
- [ ] CPU load below alert threshold.
- [ ] Time sync active.
- [ ] Firewall allows only required public ports.

## Docker

- [ ] Docker service running.
- [ ] Docker Compose plugin installed.
- [ ] Expected Docker networks exist.
- [ ] Only Nginx publishes public ports.
- [ ] Application containers are on internal network only.
- [ ] Containers report healthy.
- [ ] Restart policies are configured.

## Nginx

- [ ] Nginx config syntax valid.
- [ ] Nginx process running.
- [ ] Port `80` reachable through Cloudflare.
- [ ] Port `443` reachable through Cloudflare.
- [ ] HTTP redirects to HTTPS.
- [ ] WebSocket upgrade headers configured.
- [ ] Per-host access logs present.
- [ ] Security headers present.

## Cloudflare Origin TLS

- [ ] Origin certificate installed.
- [ ] Origin private key installed.
- [ ] Certificate covers required hostnames.
- [ ] File permissions restrict private key access.
- [ ] Cloudflare SSL mode is Full (Strict).

## External Services

- [ ] Neon/Postgres connectivity works.
- [ ] Upstash Redis connectivity works.
- [ ] Upstash Vector connectivity works where required.
- [ ] R2 connectivity works where required.
- [ ] Resend connectivity works.
- [ ] Sentry DSN/token configuration reviewed.

## Application Health

- [ ] `api-server` health endpoint returns expected status.
- [ ] `realtutorialhub-web` homepage returns expected status.
- [ ] `realtutorialhub-admin` returns expected status or auth redirect.
- [ ] `skillup-web` health endpoint returns expected status.
- [ ] `skillup-admin` health endpoint returns expected status.
- [ ] `faculty-app` health endpoint returns expected status.
- [ ] `realtutorialhub-quiz` returns expected status.
- [ ] `skillhub-placement` health endpoint returns expected status.
- [ ] `skillhubcore-admin` health endpoint returns expected status.
- [ ] `skillhubcore-service` health endpoint returns expected status.

## Cutover Gates

- [ ] Cloud Run rollback targets are still healthy.
- [ ] Cloudflare Worker routing model is confirmed.
- [ ] DNS changes are reviewed but not applied by automation.
- [ ] Smoke tests are ready.
- [ ] Rollback owner and window are defined.
