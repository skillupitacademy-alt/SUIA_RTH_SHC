#!/usr/bin/env sh
# Production Deployment System V3.2
# Thin, fail-closed orchestrator using lib-deployment.sh.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

. "$SCRIPT_DIR/lib.sh"
. "$SCRIPT_DIR/lib-deployment.sh"

SERVICE_MAP="$CONFIG_DIR/service-map.json"
SMOKE_TESTS="$CONFIG_DIR/smoke-tests.json"
DEPLOY_CONFIG="$CONFIG_DIR/deployment-config.json"

log_header "Production Deployment System V3.2"

validate_deployment_tools deploy || exit 1
validate_configuration_files "$CONFIG_DIR" || exit 1
load_deployment_config "$DEPLOY_CONFIG"

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

acquire_lock "$LOCK_FILE" "$DEPLOY_LOCK_TIMEOUT"
check_system_resources

log_header "Change Detection"
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_SHORT=$(echo "$CURRENT_COMMIT" | cut -c1-7)
LAST_COMMIT=""
IS_FIRST_DEPLOYMENT=0

if [ -f "$DEPLOYMENT_STATE" ]; then
  LAST_COMMIT=$(jq -r '.commit // empty' "$DEPLOYMENT_STATE")
fi

if [ -z "$LAST_COMMIT" ] || [ "$LAST_COMMIT" = "null" ]; then
  IS_FIRST_DEPLOYMENT=1
  log_info "Current commit: $CURRENT_SHORT"
  log_info "First deployment: no previous state"
elif [ "$LAST_COMMIT" = "$CURRENT_COMMIT" ]; then
  log_success "No changes detected; already deployed at $CURRENT_SHORT"
  exit 0
else
  log_info "Current commit: $CURRENT_SHORT"
  log_info "Last deployment: $(echo "$LAST_COMMIT" | cut -c1-7)"
fi

CHANGED_FILES=""
if [ "$IS_FIRST_DEPLOYMENT" -eq 1 ]; then
  CHANGED_FILES="FIRST_DEPLOYMENT"
elif git cat-file -e "$LAST_COMMIT" 2>/dev/null; then
  CHANGED_FILES=$(git diff --name-only "$LAST_COMMIT" "$CURRENT_COMMIT")
else
  log_warning "Last deployed commit is not available locally; rebuilding all services"
  CHANGED_FILES="REBUILD_ALL"
fi

SERVICES_TO_BUILD=""
SERVICES_TO_RESTART=""

if [ "$CHANGED_FILES" = "FIRST_DEPLOYMENT" ] || [ "$CHANGED_FILES" = "REBUILD_ALL" ]; then
  SERVICES_TO_BUILD=$(get_buildable_services "$SERVICE_MAP")
  SERVICES_TO_RESTART="$SERVICES_TO_BUILD"
elif [ -n "$CHANGED_FILES" ]; then
  FILE_COUNT=$(printf '%s\n' "$CHANGED_FILES" | sed '/^$/d' | wc -l | tr -d ' ')
  log_info "Changed files: $FILE_COUNT"
  if [ "$FILE_COUNT" -le 20 ]; then
    printf '%s\n' "$CHANGED_FILES" | while read -r file; do
      [ -n "$file" ] && log_info "  - $file"
    done
  fi

  SERVICES_TO_BUILD=$(detect_affected_services "$CHANGED_FILES" "$SERVICE_MAP" "$DEPLOY_CONFIG" "$LAST_COMMIT")
  SERVICES_TO_RESTART="$SERVICES_TO_BUILD"

  if printf '%s\n' "$CHANGED_FILES" | grep -q '^infra/hostinger/nginx/'; then
    SERVICES_TO_RESTART=$(normalize_services "$SERVICES_TO_RESTART nginx")
  fi

  if printf '%s\n' "$CHANGED_FILES" | grep -q '^infra/hostinger/env/'; then
    SERVICES_TO_RESTART=$(normalize_services "$SERVICES_TO_RESTART $(get_buildable_services "$SERVICE_MAP")")
  fi
fi

SERVICES_TO_BUILD=$(normalize_services "$SERVICES_TO_BUILD")
SERVICES_TO_RESTART=$(normalize_services "$SERVICES_TO_RESTART")
BUILD_COUNT=$(printf '%s' "$SERVICES_TO_BUILD" | wc -w | tr -d ' ')
RESTART_COUNT=$(printf '%s' "$SERVICES_TO_RESTART" | wc -w | tr -d ' ')

log_info "Services to build: $BUILD_COUNT"
[ -n "$SERVICES_TO_BUILD" ] && printf '%s\n' "$SERVICES_TO_BUILD" | tr ' ' '\n' | while read -r service; do log_info "  - $service"; done
log_info "Services to restart: $RESTART_COUNT"
[ -n "$SERVICES_TO_RESTART" ] && printf '%s\n' "$SERVICES_TO_RESTART" | tr ' ' '\n' | while read -r service; do log_info "  - $service"; done

if [ "$BUILD_COUNT" -eq 0 ] && [ "$RESTART_COUNT" -eq 0 ]; then
  log_success "No deployable service changes detected"
  exit 0
fi

if [ "$BUILD_COUNT" -gt 0 ]; then
  log_header "Build Phase"
  enable_buildkit
  BUILD_STARTED_AT=$(date +%s)
  run_with_timeout "$DEPLOY_BUILD_TIMEOUT" compose build --pull $SERVICES_TO_BUILD
  BUILD_ENDED_AT=$(date +%s)
  log_success "Build complete ($((BUILD_ENDED_AT - BUILD_STARTED_AT))s)"
  tag_and_write_image_manifest "$SERVICES_TO_BUILD" "$DEPLOYMENT_ID" "$SERVICE_MAP" "$IMAGE_MANIFEST"
else
  jq -n --arg schema_version "1" '{images_schema_version:$schema_version, images:{}}' > "$IMAGE_MANIFEST"
fi

if [ "$RESTART_COUNT" -gt 0 ]; then
  log_header "Restart Phase"
  compose up -d --no-deps $SERVICES_TO_RESTART
  wait_for_services_health "$SERVICES_TO_RESTART" "$DEPLOY_HEALTH_TIMEOUT" "$DEPLOY_HEALTH_INTERVAL"
  run_smoke_tests "$SERVICES_TO_RESTART" "$SMOKE_TESTS"
fi

log_header "Finalization"
COMPOSE_CHECKSUM=$(compose_config_checksum)
DEPLOYMENT_ENDED_AT=$(date +%s)
DURATION_SECONDS=$((DEPLOYMENT_ENDED_AT - DEPLOYMENT_STARTED_AT))

save_deployment_state \
  "$DEPLOYMENT_STATE" \
  "$DEPLOYMENT_ID" \
  "$CURRENT_COMMIT" \
  "$SERVICES_TO_BUILD" \
  "$SERVICES_TO_RESTART" \
  "$IS_FIRST_DEPLOYMENT" \
  "$IMAGE_MANIFEST" \
  "$COMPOSE_CHECKSUM" \
  "$DURATION_SECONDS"

cp "$DEPLOYMENT_STATE" "$HISTORY_DIR/${DEPLOYMENT_ID}.json.tmp"
mv "$HISTORY_DIR/${DEPLOYMENT_ID}.json.tmp" "$HISTORY_DIR/${DEPLOYMENT_ID}.json"
rotate_deployment_history "$HISTORY_DIR" "$DEPLOY_HISTORY_RETENTION"

for service in $SERVICES_TO_BUILD; do
  cleanup_deployment_tags "$service" "$SERVICE_MAP" "$KEEP_IMAGE_VERSIONS" "$HISTORY_DIR"
done
cleanup_docker_images

log_header "Deployment Complete"
log_info "Commit: $CURRENT_SHORT"
log_info "Deployment ID: $DEPLOYMENT_ID"
log_info "Built: $BUILD_COUNT service(s)"
log_info "Restarted: $RESTART_COUNT service(s)"
log_info "State: $DEPLOYMENT_STATE"
log_success "Deployment completed successfully"
