#!/usr/bin/env sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root or with sudo." >&2
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban unattended-upgrades apt-listchanges

cat >/etc/fail2ban/jail.d/platform-sshd.conf <<'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
findtime = 10m
bantime = 1h
EOF

cat >/etc/apt/apt.conf.d/52platform-unattended-upgrades <<'EOF'
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

systemctl enable --now fail2ban
systemctl enable --now unattended-upgrades

fail2ban-client status
systemctl status unattended-upgrades --no-pager

echo "Security hardening baseline installed."
