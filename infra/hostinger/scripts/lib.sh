#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_DIR="${PLATFORM_REPO_DIR:-$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)}"
COMPOSE_BASE="$REPO_DIR/infra/hostinger/compose/docker-compose.yml"
COMPOSE_PROD="$REPO_DIR/infra/hostinger/compose/docker-compose.production.yml"
ENV_FILE="${HOSTINGER_ENV_FILE:-/opt/platform/env/.env.production}"
CERT_DIR="${HOSTINGER_CERT_DIR:-/opt/platform/nginx/certs}"
LOG_DIR="${HOSTINGER_LOG_DIR:-/opt/platform/logs}"
BACKUP_DIR="${HOSTINGER_BACKUP_DIR:-/opt/platform/backups}"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_BASE" -f "$COMPOSE_PROD" "$@"
}

require_file() {
  if [ ! -f "$1" ]; then
    echo "Missing required file: $1" >&2
    exit 1
  fi
}

require_dir() {
  if [ ! -d "$1" ]; then
    echo "Missing required directory: $1" >&2
    exit 1
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

print_context() {
  echo "Repository: $REPO_DIR"
  echo "Environment: $ENV_FILE"
  echo "Certificate dir: $CERT_DIR"
  echo "Log dir: $LOG_DIR"
}
