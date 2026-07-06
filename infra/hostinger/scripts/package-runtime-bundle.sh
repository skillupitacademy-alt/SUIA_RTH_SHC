#!/usr/bin/env sh
# Create a source-free Hostinger runtime bundle.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HOSTINGER_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="${1:-$HOSTINGER_DIR/dist}"
VERSION_TAG="${VERSION_TAG:-$(date -u +"%Y%m%d-%H%M%S")}"
BUNDLE_DIR="$OUTPUT_DIR/hostinger-runtime-$VERSION_TAG"
ARCHIVE="$OUTPUT_DIR/hostinger-runtime-$VERSION_TAG.tar.gz"

mkdir -p "$BUNDLE_DIR/compose" "$BUNDLE_DIR/config" "$BUNDLE_DIR/nginx" "$BUNDLE_DIR/scripts" "$BUNDLE_DIR/registry"

cp "$HOSTINGER_DIR/runtime/docker-compose.yml" "$BUNDLE_DIR/compose/docker-compose.yml"
cp "$HOSTINGER_DIR/runtime/docker-compose.production.yml" "$BUNDLE_DIR/compose/docker-compose.production.yml"
cp "$HOSTINGER_DIR/config/deployment-config.json" "$BUNDLE_DIR/config/"
cp "$HOSTINGER_DIR/config/service-map.json" "$BUNDLE_DIR/config/"
cp "$HOSTINGER_DIR/config/smoke-tests.json" "$BUNDLE_DIR/config/"
cp "$HOSTINGER_DIR/config/validate-config.sh" "$BUNDLE_DIR/config/"
cp "$HOSTINGER_DIR/scripts/lib.sh" "$BUNDLE_DIR/scripts/"
cp "$HOSTINGER_DIR/scripts/lib-deployment.sh" "$BUNDLE_DIR/scripts/"
cp "$HOSTINGER_DIR/scripts/deploy-pull-production.sh" "$BUNDLE_DIR/scripts/"
cp "$HOSTINGER_DIR/scripts/rollback-deployment.sh" "$BUNDLE_DIR/scripts/"
cp "$HOSTINGER_DIR/scripts/deploy-production.sh" "$BUNDLE_DIR/scripts/"
cp "$HOSTINGER_DIR/registry/README.md" "$BUNDLE_DIR/registry/"
cp "$HOSTINGER_DIR/runtime/README.md" "$BUNDLE_DIR/README.md"
cp -R "$HOSTINGER_DIR/nginx/." "$BUNDLE_DIR/nginx/"

(
  cd "$OUTPUT_DIR"
  tar -czf "$ARCHIVE" "hostinger-runtime-$VERSION_TAG"
)

printf '%s\n' "$ARCHIVE"
