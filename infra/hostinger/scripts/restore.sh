#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

backup="${1:-}"
if [ -z "$backup" ]; then
  echo "Usage: $0 /opt/platform/backups/<timestamp>" >&2
  exit 1
fi

require_dir "$backup"

echo "Restore source: $backup"
echo "This will restore local env and certificate files if present."
printf "Type RESTORE to continue: "
read -r confirmation

if [ "$confirmation" != "RESTORE" ]; then
  echo "Restore cancelled."
  exit 1
fi

if [ -f "$backup/env.production" ]; then
  mkdir -p "$(dirname "$ENV_FILE")"
  cp "$backup/env.production" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

if [ -d "$backup/certs" ]; then
  mkdir -p "$CERT_DIR"
  cp -R "$backup/certs/." "$CERT_DIR/"
  chmod -R go-rwx "$CERT_DIR"
fi

echo "Restore completed. Run verify.sh before deployment."
