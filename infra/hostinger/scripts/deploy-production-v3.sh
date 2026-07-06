#!/usr/bin/env sh
# Deprecated compatibility entrypoint.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

printf '%s\n' "deploy-production-v3.sh is deprecated."
printf '%s\n' "Use the hardened V3.1 orchestrator instead:"
printf '%s\n' "  $SCRIPT_DIR/deploy-production.sh"
exit 1
