# Codex Remote Operating Rules

Status: required operating rules for Codex when connected through VS Code Remote SSH.

## Allowed During VPS Bootstrap

- Inspect OS details.
- Install approved system packages.
- Create `deploy` user and permissions.
- Configure UFW.
- Install Fail2Ban.
- Install Docker.
- Install Nginx.
- Create `/opt/platform` layout.
- Enable swap.
- Enable unattended security upgrades.
- Verify ports and service status.

## Not Allowed During VPS Bootstrap

- Clone this repository.
- Copy production `.env`.
- Run Docker Compose.
- Build images.
- Start application containers.
- Change Cloudflare.
- Change DNS.
- Delete or alter GCP resources.
- Disable root SSH until deploy key login is proven.

## Approval Discipline

Run one logical step at a time. After each step, record:

- command executed
- important output
- pass/fail status
- next action

If a command affects firewall, SSH, users, or boot behavior, verify access before continuing.
