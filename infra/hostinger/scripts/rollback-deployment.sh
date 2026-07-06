#!/usr/bin/env sh
# Deployment Rollback V3.2
# Rolls back using immutable image tags recorded in deployment history.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

. "$SCRIPT_DIR/lib.sh"
. "$SCRIPT_DIR/lib-deployment.sh"

SERVICE_MAP="$CONFIG_DIR/service-map.json"
SMOKE_TESTS="$CONFIG_DIR/smoke-tests.json"
DEPLOY_CONFIG="$CONFIG_DIR/deployment-config.json"

TARGET_DEPLOYMENT_ID=""
if [ "${1:-}" = "--deployment-id" ]; then
  TARGET_DEPLOYMENT_ID="${2:-}"
fi

log_header "Deployment Rollback V3.2"

validate_deployment_tools rollback || exit 1
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

acquire_lock "$LOCK_FILE" "$DEPLOY_LOCK_TIMEOUT"

[ -f "$DEPLOYMENT_STATE" ] || { log_error "No current deployment state found"; exit 1; }
[ -d "$HISTORY_DIR" ] || { log_error "No deployment history directory found"; exit 1; }

CURRENT_ID=$(jq -r '.deployment_id // empty' "$DEPLOYMENT_STATE")
CURRENT_SHORT=$(jq -r '.commit_short // "unknown"' "$DEPLOYMENT_STATE")

TARGET_PATH=""
if [ -n "$TARGET_DEPLOYMENT_ID" ]; then
  TARGET_PATH="$HISTORY_DIR/${TARGET_DEPLOYMENT_ID}.json"
  [ -f "$TARGET_PATH" ] || { log_error "Deployment history not found: $TARGET_DEPLOYMENT_ID"; exit 1; }
else
  log_header "Deployment History"
  ls -t "$HISTORY_DIR"/*.json 2>/dev/null | head -10 | nl -w2 -s') ' | while read -r num file; do
    deployment_id=$(jq -r '.deployment_id // empty' "$file")
    commit_short=$(jq -r '.commit_short // "unknown"' "$file")
    timestamp=$(jq -r '.timestamp // "unknown"' "$file")
    marker=""
    [ "$deployment_id" = "$CURRENT_ID" ] && marker=" (CURRENT)"
    printf '  %s %s @ %s%s\n' "$num" "$commit_short" "$timestamp" "$marker"
  done

  printf '\nSelect rollback target (1-10, or q to quit): '
  read -r SELECTION
  [ "$SELECTION" = "q" ] || [ "$SELECTION" = "Q" ] && exit 0
  printf '%s' "$SELECTION" | grep -qE '^[0-9]+$' || { log_error "Invalid selection: $SELECTION"; exit 1; }
  TARGET_PATH=$(ls -t "$HISTORY_DIR"/*.json 2>/dev/null | head -10 | sed -n "${SELECTION}p")
  [ -n "$TARGET_PATH" ] || { log_error "Selection not found: $SELECTION"; exit 1; }
fi

TARGET_ID=$(jq -r '.deployment_id // empty' "$TARGET_PATH")
TARGET_SHORT=$(jq -r '.commit_short // "unknown"' "$TARGET_PATH")
TARGET_TIMESTAMP=$(jq -r '.timestamp // "unknown"' "$TARGET_PATH")

[ -n "$TARGET_ID" ] || { log_error "Target deployment does not contain deployment_id"; exit 1; }
[ "$TARGET_ID" != "$CURRENT_ID" ] || { log_success "Selected deployment is already current"; exit 0; }

ROLLBACK_SERVICES=$(jq -r '.images | keys[]?' "$TARGET_PATH" | tr '\n' ' ' | sed 's/ *$//')
if [ -z "$ROLLBACK_SERVICES" ]; then
  log_error "Target deployment does not contain an image manifest; exact rollback is unavailable"
  exit 1
fi

log_header "Rollback Target"
log_info "Current: $CURRENT_SHORT ($CURRENT_ID)"
log_info "Target: $TARGET_SHORT ($TARGET_ID)"
log_info "Target deployed at: $TARGET_TIMESTAMP"
log_info "Services: $ROLLBACK_SERVICES"

log_header "Image Verification"
for service in $ROLLBACK_SERVICES; do
  image_name=$(jq -r --arg service "$service" '.images[$service].image_name // empty' "$TARGET_PATH")
  tag=$(jq -r --arg service "$service" '.images[$service].tag // empty' "$TARGET_PATH")
  expected_id=$(jq -r --arg service "$service" '.images[$service].image_id // empty' "$TARGET_PATH")
  expected_digest=$(jq -r --arg service "$service" '.images[$service].repo_digest // empty' "$TARGET_PATH")
  [ -n "$image_name" ] && [ -n "$tag" ] || { log_error "$service image metadata is incomplete"; exit 1; }

  actual_id=$(docker image inspect "${image_name}:${tag}" -f '{{.Id}}' 2>/dev/null || true)
  [ -n "$actual_id" ] || { log_error "Missing rollback image: ${image_name}:${tag}"; exit 1; }
  actual_digest=$(docker image inspect "${image_name}:${tag}" -f '{{range .RepoDigests}}{{println .}}{{end}}' 2>/dev/null | head -1 || true)
  if [ -n "$expected_digest" ] && [ "$expected_digest" != "null" ] && [ -n "$actual_digest" ]; then
    docker image inspect "${image_name}:${tag}" -f '{{range .RepoDigests}}{{println .}}{{end}}' 2>/dev/null |
      grep -Fx "$expected_digest" >/dev/null || { log_error "$service repo digest mismatch for ${image_name}:${tag}"; exit 1; }
  elif [ -n "$expected_id" ] && [ "$expected_id" != "null" ] && [ "$actual_id" != "$expected_id" ]; then
    log_error "$service image ID mismatch for ${image_name}:${tag}"
    exit 1
  fi
  log_success "$service image verified: ${image_name}:${tag}"
done

log_header "Image Retag"
for service in $ROLLBACK_SERVICES; do
  image_name=$(jq -r --arg service "$service" '.images[$service].image_name' "$TARGET_PATH")
  tag=$(jq -r --arg service "$service" '.images[$service].tag' "$TARGET_PATH")
  docker tag "${image_name}:${tag}" "${image_name}:latest"
  log_success "$service retagged to ${image_name}:latest"
done

log_header "Restart Services"
compose up -d --no-deps $ROLLBACK_SERVICES
wait_for_services_health "$ROLLBACK_SERVICES" "$DEPLOY_HEALTH_TIMEOUT" "$DEPLOY_HEALTH_INTERVAL"
run_smoke_tests "$ROLLBACK_SERVICES" "$SMOKE_TESTS"

log_header "Update State"
ROLLBACK_NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq --arg rollback_time "$ROLLBACK_NOW" \
  --arg rollback_from "$CURRENT_ID" \
  --arg rollback_from_short "$CURRENT_SHORT" \
  '. + {
    rollback_time:$rollback_time,
    rollback_from:$rollback_from,
    rollback_from_short:$rollback_from_short,
    is_rollback:true
  }' "$TARGET_PATH" > "${DEPLOYMENT_STATE}.tmp"
mv "${DEPLOYMENT_STATE}.tmp" "$DEPLOYMENT_STATE"

log_header "Rollback Complete"
log_info "Rolled back from $CURRENT_SHORT to $TARGET_SHORT"
log_info "Services restarted: $(printf '%s' "$ROLLBACK_SERVICES" | wc -w | tr -d ' ')"
log_success "Rollback completed successfully"
