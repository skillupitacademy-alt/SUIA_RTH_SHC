#!/usr/bin/env sh
# Create a source-free Hostinger runtime bundle.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HOSTINGER_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="${1:-$HOSTINGER_DIR/dist}"
GIT_COMMIT=$(git -C "$HOSTINGER_DIR/../.." rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_SHORT=$(printf '%s' "$GIT_COMMIT" | cut -c1-8)
CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VERSION_TAG="${VERSION_TAG:-v3.2.0-$GIT_SHORT-$(date -u +"%Y%m%d-%H%M%S")}"
BUNDLE_NAME="hostinger-runtime-$VERSION_TAG"
BUNDLE_DIR="$OUTPUT_DIR/$BUNDLE_NAME"
ARCHIVE="$OUTPUT_DIR/$BUNDLE_NAME.tar.gz"
CHECKSUM_FILE="$ARCHIVE.sha256"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

mkdir -p \
  "$BUNDLE_DIR/compose" \
  "$BUNDLE_DIR/config" \
  "$BUNDLE_DIR/nginx" \
  "$BUNDLE_DIR/scripts" \
  "$BUNDLE_DIR/registry" \
  "$BUNDLE_DIR/env/shared" \
  "$BUNDLE_DIR/env/brands" \
  "$BUNDLE_DIR/env/services" \
  "$BUNDLE_DIR/state" \
  "$BUNDLE_DIR/logs" \
  "$BUNDLE_DIR/backups"

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

cat > "$BUNDLE_DIR/manifest.json" <<EOF
{
  "schemaVersion": "3",
  "bundleVersion": "$(json_escape "$VERSION_TAG")",
  "gitCommit": "$(json_escape "$GIT_COMMIT")",
  "gitShort": "$(json_escape "$GIT_SHORT")",
  "createdAt": "$(json_escape "$CREATED_AT")",
  "runtime": "hostinger-source-free"
}
EOF

(
  cd "$OUTPUT_DIR"
  tar -czf "$ARCHIVE" "$BUNDLE_NAME"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$(basename "$ARCHIVE")" > "$(basename "$CHECKSUM_FILE")"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$(basename "$ARCHIVE")" > "$(basename "$CHECKSUM_FILE")"
  fi
)

printf '%s\n' "$ARCHIVE"
[ -f "$CHECKSUM_FILE" ] && printf '%s\n' "$CHECKSUM_FILE"
