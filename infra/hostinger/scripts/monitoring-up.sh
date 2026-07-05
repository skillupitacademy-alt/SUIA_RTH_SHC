#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

MONITORING_COMPOSE="$REPO_DIR/infra/hostinger/monitoring/docker-compose.monitoring.yml"

require_command docker
require_file "$MONITORING_COMPOSE"

if [ -z "${GRAFANA_ADMIN_PASSWORD:-}" ]; then
  echo "Set GRAFANA_ADMIN_PASSWORD before starting monitoring." >&2
  exit 1
fi

docker compose -f "$MONITORING_COMPOSE" config >/dev/null
docker compose -f "$MONITORING_COMPOSE" up -d

echo "Monitoring stack started."
echo "Grafana: http://127.0.0.1:3009"
echo "Prometheus: http://127.0.0.1:9090"
echo "Loki: http://127.0.0.1:3100"
