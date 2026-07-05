# Hostinger VPS Bootstrap Execution Log

Date: 2026-07-05
VPS: `72.61.115.49`
Host alias: `hostinger-quiz-platform`
Execution user: `root` for bootstrap, `deploy` for ongoing operations
Status: completed

## Scope Executed

- Verified SSH access.
- Verified Ubuntu version and base resources.
- Updated package index and confirmed no package upgrades were pending.
- Installed base operations packages.
- Installed and enabled Nginx.
- Installed and enabled Fail2Ban.
- Confirmed Docker was installed and active.
- Created `deploy` user.
- Added `deploy` to `sudo` and `docker` groups.
- Copied the root SSH authorized key to `deploy`.
- Set timezone to `Asia/Kuala_Lumpur`.
- Enabled UFW with public ingress limited to SSH, HTTP, and HTTPS.
- Created `/opt/platform` directory layout.
- Set `/opt/platform` ownership to `deploy:deploy`.
- Created and enabled a 2 GB swapfile.

## Verified State

```text
OS: Ubuntu 24.04.4 LTS
Hostname: srv1805954
CPU architecture: x86-64
Memory: 7.8 GiB
Disk: 96 GiB root filesystem, 4% used after bootstrap
Swap: 2.0 GiB enabled at /swapfile
Timezone: Asia/Kuala_Lumpur
Docker: 29.6.1
Docker Compose: v5.3.0
Nginx: active, local HTTP check returns 200
Fail2Ban: active, sshd jail enabled
UFW: active
Public ingress: 22/tcp, 80/tcp, 443/tcp
Deploy user: deploy
Deploy groups: deploy, sudo, docker
```

## Platform Layout

All expected directories exist and are owned by `deploy:deploy`:

```text
/opt/platform
/opt/platform/apps
/opt/platform/backups
/opt/platform/compose
/opt/platform/docker
/opt/platform/env
/opt/platform/logs
/opt/platform/monitoring
/opt/platform/nginx
/opt/platform/operations
/opt/platform/scripts
/opt/platform/ssl
```

## SSH Configuration

Local SSH aliases:

```text
hostinger-quiz-platform       deploy user
hostinger-quiz-platform-root  root user
```

Use `deploy` for normal deployment work. Keep root access only for administrative recovery until the full deployment workflow is stable.

## Not Executed

- No Cloudflare changes.
- No DNS changes.
- No GCP changes.
- No repository clone on the VPS.
- No application deployment.
- No production secrets copied.
- No Cloudflare Origin Certificate installed yet.

## Next Gate

Before Phase 8 staging deployment:

- Take or confirm a Hostinger VPS snapshot.
- Install Cloudflare Origin Certificate files into `/opt/platform/ssl`.
- Copy or generate production environment files outside git under `/opt/platform/env`.
- Review Docker Compose and Nginx deployment templates.
