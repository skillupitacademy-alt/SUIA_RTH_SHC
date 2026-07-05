# Ubuntu 24.04 Base Preparation

Status: planning instructions only.

## Base Review

Before installing application dependencies, confirm:

```bash
lsb_release -a
uname -a
timedatectl
df -h
free -h
```

Expected OS: Ubuntu 24.04 LTS.

## Package Baseline

Reviewed package set:

```bash
apt update
apt upgrade
apt install -y ca-certificates curl git gnupg lsb-release ufw
```

## Time Sync

Confirm NTP/time sync:

```bash
timedatectl status
```

If not active, enable the distribution-supported time sync service before deployment.

## Reboot Gate

If kernel or core system packages are upgraded, reboot before installing Docker or starting containers.
