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
cp -R "$REPO_DIR/infra/hostinger/monitoring" "$target/infra/"
cp -R "$REPO_DIR/infra/hostinger/security" "$target/infra/"

if [ -d "$REPO_DIR/infra/hostinger/cloudflare/state-exports" ]; then
  mkdir -p "$target/cloudflare"
  cp -R "$REPO_DIR/infra/hostinger/cloudflare/state-exports" "$target/cloudflare/"
fi

if [ -f "$REPO_DIR/services/api-gateway/wrangler.toml" ]; then
  mkdir -p "$target/worker"
  cp "$REPO_DIR/services/api-gateway/wrangler.toml" "$target/worker/wrangler.toml"
fi

echo "Backup written to $target"
