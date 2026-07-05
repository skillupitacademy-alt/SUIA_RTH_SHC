# SSH Hardening Policy

Status: implementation template.

## Target State

- SSH key authentication for the deployment user.
- Root SSH access reserved for break-glass only.
- Password authentication disabled after deploy-user sudo access is verified.
- Cloudflare and application secrets never stored in shell history.

## Review Before Applying

Confirm these are true before disabling root/password SSH:

- At least one non-root sudo user can log in with an SSH key.
- That user can run `sudo -v`.
- VPS control panel emergency console is available.
- Current public key is backed up in a password manager.

## Suggested `/etc/ssh/sshd_config.d/99-platform-hardening.conf`

```text
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
X11Forwarding no
AllowTcpForwarding yes
ClientAliveInterval 300
ClientAliveCountMax 2
```

Reload with:

```bash
sudo sshd -t
sudo systemctl reload ssh
```
