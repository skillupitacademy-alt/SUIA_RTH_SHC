#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

MONITORING_COMPOSE="$REPO_DIR/infra/hostinger/monitoring/docker-compose.monitoring.yml"

require_command docker
require_file "$MONITORING_COMPOSE"

docker compose -f "$MONITORING_COMPOSE" down

echo "Monitoring stack stopped. Named volumes were preserved."
