#!/usr/bin/env sh
# Build deployable images locally or in CI and push them to a Docker registry.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

. "$SCRIPT_DIR/lib.sh"
. "$SCRIPT_DIR/lib-deployment.sh"

SERVICE_MAP="$CONFIG_DIR/service-map.json"
DEPLOY_CONFIG="$CONFIG_DIR/deployment-config.json"

log_header "Registry Build and Push"

validate_deployment_tools deploy || exit 1
validate_configuration_files "$CONFIG_DIR" || exit 1
load_deployment_config "$DEPLOY_CONFIG"

[ -n "${REGISTRY_PREFIX:-}" ] || { log_error "REGISTRY_PREFIX is required, for example docker.io/your-user"; exit 1; }

IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short=12 HEAD)}"
SERVICES="${*:-$(get_buildable_services "$SERVICE_MAP")}"
SERVICES=$(normalize_services "$SERVICES")
[ -n "$SERVICES" ] || { log_error "No services selected"; exit 1; }

enable_buildkit

log_info "Registry: $REGISTRY_PREFIX"
log_info "Image tag: $IMAGE_TAG"
log_info "Services: $SERVICES"

log_header "Build"
run_with_timeout "$DEPLOY_BUILD_TIMEOUT" compose build --pull $SERVICES

log_header "Tag and Push"
for service in $SERVICES; do
  image_name=$(get_service_field "$service" "image_name" "$SERVICE_MAP")
  registry_ref=$(registry_ref_for "$REGISTRY_PREFIX" "$image_name" "$IMAGE_TAG")

  image_id=$(docker image inspect "${image_name}:latest" -f '{{.Id}}' 2>/dev/null || true)
  if [ -z "$image_id" ]; then
    image_id=$(compose images -q "$service" 2>/dev/null | head -1 || true)
    [ -n "$image_id" ] || { log_error "Cannot find built image for $service"; exit 1; }
    docker tag "$image_id" "${image_name}:latest"
  fi

  docker tag "${image_name}:latest" "$registry_ref"
  docker push "$registry_ref"
  log_success "Pushed $registry_ref"
done

log_header "Next VPS Command"
printf 'REGISTRY_PREFIX="%s" IMAGE_TAG="%s" ./deploy-pull-production.sh %s\n' "$REGISTRY_PREFIX" "$IMAGE_TAG" "$SERVICES"
