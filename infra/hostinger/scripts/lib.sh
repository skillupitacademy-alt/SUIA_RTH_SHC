#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_DIR="${PLATFORM_REPO_DIR:-$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)}"
RUNTIME_ROOT="${HOSTINGER_RUNTIME_ROOT:-$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)}"
if [ "${HOSTINGER_SOURCE_FREE_RUNTIME:-false}" = "true" ]; then
  COMPOSE_BASE="${PLATFORM_COMPOSE_BASE:-$RUNTIME_ROOT/compose/docker-compose.yml}"
  COMPOSE_PROD="${PLATFORM_COMPOSE_PROD:-$RUNTIME_ROOT/compose/docker-compose.production.yml}"
else
  COMPOSE_BASE="${PLATFORM_COMPOSE_BASE:-$REPO_DIR/infra/hostinger/compose/docker-compose.yml}"
  COMPOSE_PROD="${PLATFORM_COMPOSE_PROD:-$REPO_DIR/infra/hostinger/compose/docker-compose.production.yml}"
fi
ENV_FILE="${HOSTINGER_ENV_FILE:-/opt/platform/env/.env.production}"
CERT_DIR="${HOSTINGER_CERT_DIR:-/opt/platform/nginx/certs}"
LOG_DIR="${HOSTINGER_LOG_DIR:-/opt/platform/logs}"
BACKUP_DIR="${HOSTINGER_BACKUP_DIR:-/opt/platform/backups}"

compose() {
  export HOSTINGER_ENV_FILE="$ENV_FILE"
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
  echo "Runtime root: $RUNTIME_ROOT"
  echo "Environment: $ENV_FILE"
  echo "Compose base: $COMPOSE_BASE"
  echo "Compose production: $COMPOSE_PROD"
  echo "Certificate dir: $CERT_DIR"
  echo "Log dir: $LOG_DIR"
}
