#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

print_context
require_command docker
require_file "$ENV_FILE"
require_file "$COMPOSE_BASE"
require_file "$COMPOSE_PROD"
require_file "$REPO_DIR/infra/hostinger/nginx/nginx.conf"
require_dir "$CERT_DIR"
require_dir "$LOG_DIR"

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not available." >&2
  exit 1
fi

if [ ! -f "$CERT_DIR/cloudflare-origin.pem" ]; then
  echo "Missing Cloudflare origin certificate: $CERT_DIR/cloudflare-origin.pem" >&2
  exit 1
fi

if [ ! -f "$CERT_DIR/cloudflare-origin.key" ]; then
  echo "Missing Cloudflare origin key: $CERT_DIR/cloudflare-origin.key" >&2
  exit 1
fi

compose config >/dev/null

echo "Checking for accidental public app port mappings..."
if compose config --format json | jq -e '
  [
    .services
    | to_entries[]
    | select(.key != "nginx")
    | select((.value.ports // []) | length > 0)
    | .key
  ] as $services
  | if ($services | length) == 0 then true else $services[] | "public port on service \(.)" | halt_error(1) end
' >/dev/null; then
  echo "Port exposure check passed."
else
  echo "Only nginx may publish public ports." >&2
  exit 1
fi

echo "Verification passed."
