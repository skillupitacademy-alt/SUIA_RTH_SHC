#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

print_context
require_command docker
require_file "$ENV_FILE"
require_file "$COMPOSE_BASE"
require_file "$COMPOSE_PROD"

compose build --pull
