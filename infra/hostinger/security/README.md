# Hostinger Security Hardening

Status: implementation templates. Review before running on the VPS.

These artifacts harden the live VPS without changing application routing, Cloudflare DNS, Cloudflare Worker routes, or GCP resources.

## Priority Order

1. Rotate exposed credentials.
2. Confirm SSH key-only access for non-emergency operators.
3. Install and enable Fail2Ban.
4. Enable unattended security upgrades.
5. Review firewall and open ports.
6. Keep root access as break-glass only, or disable root SSH after a tested sudo user exists.

## Files

- `credential-rotation.md`: token and SSH rotation checklist.
- `fail2ban.md`: Fail2Ban policy and verification.
- `ssh-hardening.md`: SSH access policy.
- `unattended-upgrades.md`: Ubuntu security patching policy.
- `install-security-hardening.sh`: reviewable script for Fail2Ban and unattended upgrades.
