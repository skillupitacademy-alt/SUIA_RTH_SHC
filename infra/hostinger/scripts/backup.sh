#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BACKUP_DIR/$timestamp"

mkdir -p "$target"

if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$target/env.production"
  chmod 600 "$target/env.production"
fi

if [ -d "$CERT_DIR" ]; then
  mkdir -p "$target/certs"
  cp -R "$CERT_DIR/." "$target/certs/"
  chmod -R go-rwx "$target/certs"
fi

mkdir -p "$target/infra"
cp -R "$REPO_DIR/infra/hostinger/compose" "$target/infra/"
cp -R "$REPO_DIR/infra/hostinger/nginx" "$target/infra/"

echo "Backup written to $target"
