# VPS Bootstrap

Status: Phase 7 bootstrap artifacts.

These documents and scripts describe how the Hostinger VPS should be prepared before staging deployment.

## Target

- Ubuntu 24.04 LTS
- Non-root deployment user
- Docker Engine and Docker Compose plugin
- Nginx container as only public ingress
- Cloudflare Full (Strict) origin certificate files
- `/opt/platform` directory layout
- UFW firewall allowing only required public ports

## Documents

- `execution-checklist.md`: ordered bootstrap execution checklist.
- `ubuntu-24.04.md`: base OS and package preparation.
- `users-and-permissions.md`: deploy user, groups, and file ownership.
- `filesystem-layout.md`: `/opt/platform` directory structure.
- `firewall.md`: UFW and Hostinger firewall requirements.
- `docker.md`: Docker installation and verification.
- `origin-certificates.md`: certificate placement and permissions.

## Scripts

- `bootstrap-ubuntu-24.04.sh`: idempotent root bootstrap script for Ubuntu 24.04 LTS.
- `verify-vps-foundation.sh`: read-only verifier for the completed VPS foundation.

## Execution Order

Run these from a VS Code Remote SSH terminal on the VPS, not from your local repository shell:

```bash
sudo bash infra/hostinger/bootstrap/bootstrap-ubuntu-24.04.sh
sudo sh infra/hostinger/bootstrap/verify-vps-foundation.sh
```

The bootstrap script requires typing `BOOTSTRAP` before it mutates the VPS.

## Current Blocker

SSH key authentication must work from the execution environment before Codex can execute this phase remotely.

## Non-Goals

- No DNS or Cloudflare changes are performed.
- No production secrets are exported.
- No repository clone or application deployment is performed by the bootstrap script.
- No GCP deployment artifacts are modified.
