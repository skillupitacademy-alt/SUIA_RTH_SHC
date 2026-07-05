#!/usr/bin/env sh
set -eu

DEPLOY_USER="${DEPLOY_USER:-deploy}"
PLATFORM_DIR="${PLATFORM_DIR:-/opt/platform}"
TIMEZONE="${TIMEZONE:-Asia/Kuala_Lumpur}"

failures=0

pass() {
  printf '[PASS] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  failures=$((failures + 1))
}

check_command() {
  if command -v "$1" >/dev/null 2>&1; then
    pass "command available: $1"
  else
    fail "missing command: $1"
  fi
}

check_service() {
  if systemctl is-enabled "$1" >/dev/null 2>&1 && systemctl is-active "$1" >/dev/null 2>&1; then
    pass "service enabled and active: $1"
  else
    fail "service not enabled and active: $1"
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    pass "directory exists: $1"
  else
    fail "missing directory: $1"
  fi
}

check_user() {
  if id "$DEPLOY_USER" >/dev/null 2>&1; then
    pass "user exists: $DEPLOY_USER"
  else
    fail "missing user: $DEPLOY_USER"
  fi
}

check_os() {
  if [ -r /etc/os-release ]; then
    . /etc/os-release
    if [ "${ID:-}" = "ubuntu" ] && [ "${VERSION_ID:-}" = "24.04" ]; then
      pass "Ubuntu 24.04 detected"
    else
      fail "expected Ubuntu 24.04, found ${PRETTY_NAME:-unknown}"
    fi
  else
    fail "cannot read /etc/os-release"
  fi
}

check_timezone() {
  current_tz="$(timedatectl show -p Timezone --value 2>/dev/null || true)"
  if [ "$current_tz" = "$TIMEZONE" ]; then
    pass "timezone is $TIMEZONE"
  else
    fail "expected timezone $TIMEZONE, found ${current_tz:-unknown}"
  fi
}

check_firewall() {
  if ufw status verbose | grep -q '^Status: active'; then
    pass "ufw is active"
  else
    fail "ufw is not active"
  fi

  for port in 22 80 443; do
    if ufw status | grep -Eq "${port}/tcp|OpenSSH"; then
      pass "ufw allows expected ingress: $port"
    else
      fail "ufw missing expected ingress: $port"
    fi
  done
}

check_docker_group() {
  if id -nG "$DEPLOY_USER" | tr ' ' '\n' | grep -qx docker; then
    pass "$DEPLOY_USER is in docker group"
  else
    fail "$DEPLOY_USER is not in docker group"
  fi
}

check_swap() {
  if swapon --show=NAME --noheadings | grep -qx /swapfile; then
    pass "swapfile is enabled"
  else
    fail "swapfile is not enabled"
  fi
}

check_ports() {
  listeners="$(ss -tulpn)"
  printf '%s\n' "$listeners" | grep -Eq ':(22|80|443)\b' && pass "expected public listeners present" || fail "expected listeners 22/80/443 not found"
}

check_os
check_timezone
check_user
check_command docker
check_command git
check_command nginx
check_command jq
check_service docker
check_service fail2ban
check_service nginx
check_firewall
check_docker_group
check_swap
check_ports

for path in apps backups compose docker env logs monitoring nginx operations scripts ssl; do
  check_dir "$PLATFORM_DIR/$path"
done

if [ "$failures" -eq 0 ]; then
  echo "VPS foundation verification passed."
  exit 0
fi

echo "VPS foundation verification failed with $failures issue(s)." >&2
exit 1
