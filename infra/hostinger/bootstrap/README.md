# VPS Bootstrap Plan

Status: Phase 7 planning artifacts.

These documents describe how the Hostinger VPS should be prepared before staging deployment. They are not executed by this phase.

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

## Current Blocker

SSH reachability to `72.61.115.49:22` must be confirmed before executing this phase remotely.

## Non-Goals

- No SSH commands are executed from Codex.
- No VPS mutation is performed.
- No DNS or Cloudflare changes are performed.
- No production secrets are exported.
