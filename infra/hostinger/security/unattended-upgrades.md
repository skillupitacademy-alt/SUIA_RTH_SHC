# Unattended Upgrades Policy

Status: implementation template.

## Goal

Apply Ubuntu security updates automatically while keeping application deployments manual.

## Recommended Packages

```bash
sudo apt-get update
sudo apt-get install -y unattended-upgrades apt-listchanges
```

## Recommended Settings

Enable security updates and remove unused kernel packages. Do not automatically reboot without a reviewed maintenance policy.

```text
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
```

## Verify

```bash
systemctl status unattended-upgrades --no-pager
sudo unattended-upgrade --dry-run --debug
```
