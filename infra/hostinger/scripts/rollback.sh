#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

echo "This rollback restarts the current local Compose stack only."
echo "Cloudflare/DNS rollback must be handled separately from reviewed records."

compose up -d --remove-orphans
"$SCRIPT_DIR/health.sh"
