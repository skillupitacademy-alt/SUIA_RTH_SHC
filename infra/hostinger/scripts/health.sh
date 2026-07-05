#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

require_command docker
require_file "$ENV_FILE"

compose ps

check_container_health() {
  unhealthy="$(compose ps --format json 2>/dev/null | grep -E '"Health":"(unhealthy|starting)"' || true)"
  if [ -n "$unhealthy" ]; then
    echo "One or more containers are not healthy:" >&2
    echo "$unhealthy" >&2
    exit 1
  fi
}

check_container_health
echo "Compose health check passed."
