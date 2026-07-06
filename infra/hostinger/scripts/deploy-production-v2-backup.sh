#!/usr/bin/env sh
# Deprecated backup entrypoint.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

printf '%s\n' "deploy-production-v2-backup.sh is deprecated and intentionally disabled."
printf '%s\n' "Use the hardened V3.1 orchestrator instead:"
printf '%s\n' "  $SCRIPT_DIR/deploy-production.sh"
exit 1
