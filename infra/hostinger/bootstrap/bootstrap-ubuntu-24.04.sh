#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
PLATFORM_DIR="${PLATFORM_DIR:-/opt/platform}"
TIMEZONE="${TIMEZONE:-Asia/Kuala_Lumpur}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Run this script as root." >&2
    exit 1
  fi
}

confirm() {
  echo "This will bootstrap the VPS foundation on $(hostname)."
  echo "It installs packages, enables UFW/Fail2Ban/Docker/Nginx, creates ${DEPLOY_USER}, and prepares ${PLATFORM_DIR}."
  printf "Type BOOTSTRAP to continue: "
  read -r answer
  if [ "$answer" != "BOOTSTRAP" ]; then
    echo "Aborted."
    exit 1
  fi
}

apt_install() {
  DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"
}

configure_timezone() {
  timedatectl set-timezone "$TIMEZONE"
}

create_deploy_user() {
  if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    useradd --create-home --shell /bin/bash "$DEPLOY_USER"
  fi

  usermod -aG sudo "$DEPLOY_USER"
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/${DEPLOY_USER}/.ssh"

  if [ ! -f "/home/${DEPLOY_USER}/.ssh/authorized_keys" ]; then
    touch "/home/${DEPLOY_USER}/.ssh/authorized_keys"
    chown "$DEPLOY_USER:$DEPLOY_USER" "/home/${DEPLOY_USER}/.ssh/authorized_keys"
    chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
  fi
}

install_base_packages() {
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get full-upgrade -y
  apt_install ca-certificates curl dnsutils fail2ban git gnupg htop jq logrotate nano net-tools nginx software-properties-common tree ufw unzip vim wget zip
  apt-get autoremove -y
}

install_docker() {
  install -m 0755 -d /etc/apt/keyrings

  if [ ! -f /etc/apt/keyrings/docker.asc ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
  fi

  . /etc/os-release
  arch="$(dpkg --print-architecture)"
  echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list

  apt-get update
  apt_install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  usermod -aG docker "$DEPLOY_USER"
}

configure_firewall() {
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
}

configure_services() {
  systemctl enable --now fail2ban
  systemctl enable --now nginx
}

create_platform_layout() {
  install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
    "$PLATFORM_DIR/apps" \
    "$PLATFORM_DIR/backups" \
    "$PLATFORM_DIR/compose" \
    "$PLATFORM_DIR/docker" \
    "$PLATFORM_DIR/env" \
    "$PLATFORM_DIR/logs" \
    "$PLATFORM_DIR/monitoring" \
    "$PLATFORM_DIR/nginx" \
    "$PLATFORM_DIR/operations" \
    "$PLATFORM_DIR/scripts" \
    "$PLATFORM_DIR/ssl"
}

configure_swap() {
  if swapon --show=NAME --noheadings | grep -qx /swapfile; then
    return
  fi

  if [ ! -f /swapfile ]; then
    fallocate -l "$SWAP_SIZE" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
  fi

  swapon /swapfile

  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
}

configure_unattended_upgrades() {
  apt_install unattended-upgrades
  dpkg-reconfigure -f noninteractive unattended-upgrades
}

print_summary() {
  echo
  echo "Bootstrap complete. Summary:"
  hostnamectl
  timedatectl
  docker --version
  docker compose version
  ufw status verbose
  systemctl --no-pager --full status fail2ban nginx docker | sed -n '1,80p'
  free -h
  df -h /
  ss -tulpn
}

require_root
confirm
configure_timezone
create_deploy_user
install_base_packages
install_docker
configure_firewall
configure_services
create_platform_layout
configure_swap
configure_unattended_upgrades
print_summary
