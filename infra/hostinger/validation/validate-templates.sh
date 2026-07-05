#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
ENV_TEMPLATE="$ROOT_DIR/infra/hostinger/env/.env.production.template"
COMPOSE_BASE="$ROOT_DIR/infra/hostinger/compose/docker-compose.yml"
COMPOSE_PROD="$ROOT_DIR/infra/hostinger/compose/docker-compose.production.yml"

require_file() {
  if [ ! -f "$1" ]; then
    echo "Missing required file: $1" >&2
    exit 1
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command docker
require_file "$ENV_TEMPLATE"
require_file "$COMPOSE_BASE"
require_file "$COMPOSE_PROD"

for required in \
  "$ROOT_DIR/infra/hostinger/nginx/nginx.conf" \
  "$ROOT_DIR/infra/hostinger/nginx/conf.d/frontend.conf" \
  "$ROOT_DIR/infra/hostinger/nginx/conf.d/api-origin.conf" \
  "$ROOT_DIR/infra/hostinger/nginx/conf.d/skillhub.conf" \
  "$ROOT_DIR/infra/hostinger/nginx/snippets/proxy-common.conf" \
  "$ROOT_DIR/infra/hostinger/nginx/snippets/ssl-origin.conf" \
  "$ROOT_DIR/infra/hostinger/cloudflare/dns-records.md" \
  "$ROOT_DIR/infra/hostinger/cloudflare/ssl-settings.md" \
  "$ROOT_DIR/infra/hostinger/bootstrap/ubuntu-24.04.md" \
  "$ROOT_DIR/infra/hostinger/scripts/verify.sh"; do
  require_file "$required"
done

tmp_config="$(mktemp)"
trap 'rm -f "$tmp_config"' EXIT

HOSTINGER_ENV_FILE="$ENV_TEMPLATE" docker compose \
  --env-file "$ENV_TEMPLATE" \
  -f "$COMPOSE_BASE" \
  -f "$COMPOSE_PROD" \
  config > "$tmp_config"

if grep -q 'published:' "$tmp_config"; then
  awk '
    /^[[:space:]][a-zA-Z0-9_-]+:$/ {
      candidate=$1
      sub(":", "", candidate)
      if (candidate != "services" && candidate != "networks" && candidate !~ /^x-/) {
        service=candidate
      }
    }
    /published:/ && service != "nginx" {
      print "Unexpected public port on service: " service
      found=1
    }
    END { exit found ? 1 : 0 }
  ' "$tmp_config"
fi

if ! grep -q 'name: quiz_platform_internal' "$tmp_config"; then
  echo "Missing internal Docker network in rendered Compose config." >&2
  exit 1
fi

if ! grep -q 'internal: true' "$tmp_config"; then
  echo "Rendered Compose config does not mark app network internal." >&2
  exit 1
fi

echo "Hostinger template validation passed."
