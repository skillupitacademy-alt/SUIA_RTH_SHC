#!/usr/bin/env sh
# Load locally-built Docker images from an uploaded archive and deploy without a registry.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

if [ -f "$SCRIPT_DIR/../manifest.json" ] && [ -f "$SCRIPT_DIR/../compose/docker-compose.yml" ]; then
  export HOSTINGER_SOURCE_FREE_RUNTIME="${HOSTINGER_SOURCE_FREE_RUNTIME:-true}"
fi

. "$SCRIPT_DIR/lib.sh"
. "$SCRIPT_DIR/lib-deployment.sh"

SERVICE_MAP="$CONFIG_DIR/service-map.json"
SMOKE_TESTS="$CONFIG_DIR/smoke-tests.json"
DEPLOY_CONFIG="$CONFIG_DIR/deployment-config.json"
RUNTIME_MANIFEST="$SCRIPT_DIR/../manifest.json"
export RUNTIME_MANIFEST_FILE="$RUNTIME_MANIFEST"

log_header "Local Image Archive Deployment"

validate_deployment_tools pull || exit 1
validate_configuration_files "$CONFIG_DIR" || exit 1
load_deployment_config "$DEPLOY_CONFIG"
validate_runtime_layout "$SCRIPT_DIR/.."

[ -n "${IMAGE_ARCHIVE:-}" ] || { log_error "IMAGE_ARCHIVE is required"; exit 1; }
[ -f "$IMAGE_ARCHIVE" ] || { log_error "IMAGE_ARCHIVE not found: $IMAGE_ARCHIVE"; exit 1; }
[ -n "${IMAGE_TAG:-}" ] || { log_error "IMAGE_TAG is required"; exit 1; }

DEPLOYMENT_STATE="$DEPLOY_STATE_DIR/deployment.json"
HISTORY_DIR="$DEPLOY_STATE_DIR/history"
LOCK_FILE="$DEPLOY_STATE_DIR/deploy.lock"
mkdir -p "$DEPLOY_STATE_DIR" "$HISTORY_DIR"

cleanup() {
  release_lock "$LOCK_FILE"
}
trap cleanup EXIT

DEPLOYMENT_STARTED_AT=$(date +%s)
DEPLOYMENT_ID=$(date -u +"%Y%m%d-%H%M%S")
IMAGE_MANIFEST="$DEPLOY_STATE_DIR/images-${DEPLOYMENT_ID}.json"
SERVICES="${*:-$(get_buildable_services "$SERVICE_MAP")}"
SERVICES=$(normalize_services "$SERVICES")
[ -n "$SERVICES" ] || { log_error "No services selected"; exit 1; }

CURRENT_COMMIT=$(runtime_git_commit "$RUNTIME_MANIFEST")
CURRENT_SHORT=$(echo "$CURRENT_COMMIT" | cut -c1-7)

acquire_lock "$LOCK_FILE" "$DEPLOY_LOCK_TIMEOUT"

log_header "Load Images"
docker load -i "$IMAGE_ARCHIVE"

write_empty_image_manifest "$IMAGE_MANIFEST"
for service in $SERVICES; do
  image_name=$(get_service_field "$service" "image_name" "$SERVICE_MAP")
  tagged_ref="${image_name}:${IMAGE_TAG}"

  docker image inspect "$tagged_ref" >/dev/null 2>&1 || { log_error "Loaded archive does not contain $tagged_ref"; exit 1; }
  docker tag "$tagged_ref" "${image_name}:latest"
  add_image_to_manifest "$IMAGE_MANIFEST" "$service" "$image_name" "$tagged_ref"
  log_success "Loaded $tagged_ref as ${image_name}:latest"
done

log_header "Restart Phase"
compose up -d --no-build --no-deps $SERVICES
if compose ps -q nginx >/dev/null 2>&1; then
  log_info "Reloading Nginx so Docker DNS upstreams point to the recreated containers"
  compose exec -T nginx nginx -s reload || compose restart nginx
fi
wait_for_services_health "$SERVICES" "$DEPLOY_HEALTH_TIMEOUT" "$DEPLOY_HEALTH_INTERVAL"
run_smoke_tests "$SERVICES" "$SMOKE_TESTS"

log_header "Finalization"
COMPOSE_CHECKSUM=$(compose_config_checksum)
DEPLOYMENT_ENDED_AT=$(date +%s)
DURATION_SECONDS=$((DEPLOYMENT_ENDED_AT - DEPLOYMENT_STARTED_AT))

save_deployment_state \
  "$DEPLOYMENT_STATE" \
  "$DEPLOYMENT_ID" \
  "$CURRENT_COMMIT" \
  "" \
  "$SERVICES" \
  0 \
  "$IMAGE_MANIFEST" \
  "$COMPOSE_CHECKSUM" \
  "$DURATION_SECONDS"

cp "$DEPLOYMENT_STATE" "$HISTORY_DIR/${DEPLOYMENT_ID}.json.tmp"
mv "$HISTORY_DIR/${DEPLOYMENT_ID}.json.tmp" "$HISTORY_DIR/${DEPLOYMENT_ID}.json"
rotate_deployment_history "$HISTORY_DIR" "$DEPLOY_HISTORY_RETENTION"

for service in $SERVICES; do
  cleanup_deployment_tags "$service" "$SERVICE_MAP" "$KEEP_IMAGE_VERSIONS" "$HISTORY_DIR"
done
cleanup_docker_images

log_header "Local Archive Deployment Complete"
log_info "Commit: $CURRENT_SHORT"
log_info "Image tag: $IMAGE_TAG"
log_info "Deployment ID: $DEPLOYMENT_ID"
log_info "Restarted: $(printf '%s' "$SERVICES" | wc -w | tr -d ' ') service(s)"
log_success "Local archive deployment completed successfully"
