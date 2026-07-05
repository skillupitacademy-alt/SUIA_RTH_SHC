#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

"$SCRIPT_DIR/verify.sh"
"$SCRIPT_DIR/build.sh"
compose up -d --remove-orphans
"$SCRIPT_DIR/health.sh"

echo "Deployment command completed locally. DNS and Cloudflare changes are not handled by this script."
