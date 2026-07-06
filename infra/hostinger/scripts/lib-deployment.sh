#!/usr/bin/env sh
# Deployment Library V3.2
# Data-driven deployment helpers for Hostinger VPS production deploys.

set -eu

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
  printf '%b[%s]%b %s\n' "$CYAN" "$(date +"%H:%M:%S")" "$NC" "$1"
}

log_success() {
  printf '%b[%s] OK%b %s\n' "$GREEN" "$(date +"%H:%M:%S")" "$NC" "$1"
}

log_warning() {
  printf '%b[%s] WARN%b %s\n' "$YELLOW" "$(date +"%H:%M:%S")" "$NC" "$1"
}

log_error() {
  printf '%b[%s] ERROR%b %s\n' "$RED" "$(date +"%H:%M:%S")" "$NC" "$1" >&2
}

log_header() {
  printf '\n%b%s%b\n' "$BLUE" "====================================================" "$NC"
  printf '%b%s%b\n' "$BLUE" "$1" "$NC"
  printf '%b%s%b\n\n' "$BLUE" "====================================================" "$NC"
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    log_error "jq is required for Deployment Framework V3.2"
    return 1
  fi
}

load_deployment_config() {
  local config_file="$1"
  require_jq
  [ -f "$config_file" ] || { log_error "Configuration file not found: $config_file"; return 1; }

  export DEPLOY_STATE_DIR
  DEPLOY_STATE_DIR=$(jq -r '.deployment.state_directory' "$config_file")
  export DEPLOY_HISTORY_RETENTION
  DEPLOY_HISTORY_RETENTION=$(jq -r '.deployment.history_retention' "$config_file")
  export DEPLOY_LOCK_TIMEOUT
  DEPLOY_LOCK_TIMEOUT=$(jq -r '.deployment.lock_timeout_seconds' "$config_file")
  export DEPLOY_BUILD_TIMEOUT
  DEPLOY_BUILD_TIMEOUT=$(jq -r '.deployment.build_timeout_seconds' "$config_file")
  export DEPLOY_HEALTH_TIMEOUT
  DEPLOY_HEALTH_TIMEOUT=$(jq -r '.deployment.health_check_timeout_seconds' "$config_file")
  export DEPLOY_HEALTH_INTERVAL
  DEPLOY_HEALTH_INTERVAL=$(jq -r '.deployment.health_check_interval_seconds' "$config_file")
  export MIN_DISK_FREE
  MIN_DISK_FREE=$(jq -r '.resource_requirements.minimum_disk_free_percent' "$config_file")
  export MIN_MEMORY_FREE
  MIN_MEMORY_FREE=$(jq -r '.resource_requirements.minimum_memory_free_percent' "$config_file")
  export MAX_CPU_LOAD
  MAX_CPU_LOAD=$(jq -r '.resource_requirements.maximum_cpu_load' "$config_file")
  export MIN_INODES
  MIN_INODES=$(jq -r '.resource_requirements.minimum_inodes_free' "$config_file")
  export DOCKER_BUILDKIT_ENABLED
  DOCKER_BUILDKIT_ENABLED=$(jq -r '.docker.buildkit_enabled' "$config_file")
  export COMPOSE_PROJECT
  COMPOSE_PROJECT=$(jq -r '.docker.compose_project_name' "$config_file")
  export PRUNE_IMAGES_OLDER_THAN_DAYS
  PRUNE_IMAGES_OLDER_THAN_DAYS=$(jq -r '.docker.prune_images_older_than_days' "$config_file")
  export KEEP_IMAGE_VERSIONS
  KEEP_IMAGE_VERSIONS=$(jq -r '.docker.keep_image_versions' "$config_file")
  export DEPLOYMENT_TAG_PREFIX
  DEPLOYMENT_TAG_PREFIX=$(jq -r '.docker.deployment_tag_prefix' "$config_file")
  export CLEANUP_BUILDER_CACHE
  CLEANUP_BUILDER_CACHE=$(jq -r '.docker.cleanup_builder_cache' "$config_file")
  export PREFER_TURBO_DRY_RUN
  PREFER_TURBO_DRY_RUN=$(jq -r '.change_detection.prefer_turbo_dry_run' "$config_file")
  export TURBO_TASK
  TURBO_TASK=$(jq -r '.change_detection.turbo_task' "$config_file")
  export FALLBACK_TO_SOURCE_PATHS
  FALLBACK_TO_SOURCE_PATHS=$(jq -r '.change_detection.fallback_to_source_paths' "$config_file")
}

get_all_services() {
  jq -r '.services | keys[]' "$1" | tr '\n' ' '
}

get_buildable_services() {
  jq -r '.services | to_entries[] | select(.value.buildable == true) | .key' "$1" | tr '\n' ' '
}

get_service_field() {
  jq -r ".services[\"$1\"].$2 // empty" "$3"
}

package_to_service() {
  jq -r --arg package "$1" '.services | to_entries[] | select(.value.package_name == $package) | .key' "$2"
}

normalize_services() {
  local services="$1"
  [ -n "$services" ] || { echo ""; return 0; }
  echo "$services" | tr ' ' '\n' | sed '/^$/d' | sort -u | tr '\n' ' ' | sed 's/ *$//'
}

detect_with_turbo() {
  local last_commit="$1"
  local service_map="$2"
  local services=""
  local dry_run

  command -v pnpm >/dev/null 2>&1 || return 1
  [ -n "$last_commit" ] || return 1

  dry_run=$(pnpm exec turbo run "$TURBO_TASK" --dry=json --filter="...[$last_commit]" 2>/dev/null) || return 1
  [ -n "$dry_run" ] || return 1
  printf '%s' "$dry_run" | jq -e 'has("packages") and (.packages | type == "array")' >/dev/null 2>&1 || {
    log_warning "Turbo dry-run JSON did not include a packages array"
    return 1
  }

  for package in $(printf '%s' "$dry_run" | jq -r '.packages[]? // empty' 2>/dev/null); do
    local service
    service=$(package_to_service "$package" "$service_map")
    [ -n "$service" ] && services="$services $service"
  done

  normalize_services "$services"
}

detect_with_source_paths() {
  local changed_files="$1"
  local service_map="$2"
  local services=""

  for service in $(get_buildable_services "$service_map"); do
    local source_path
    source_path=$(get_service_field "$service" "source_path" "$service_map")
    if [ -n "$source_path" ] && printf '%s\n' "$changed_files" | grep -q "^${source_path}/"; then
      services="$services $service"
    fi
  done

  normalize_services "$services"
}

detect_affected_services() {
  local changed_files="$1"
  local service_map="$2"
  local deploy_config="$3"
  local last_commit="${4:-}"

  if printf '%s\n' "$changed_files" | grep -qE '^(package.json|pnpm-lock.yaml|pnpm-workspace.yaml|turbo.json)$'; then
    log_warning "Root build configuration changed; rebuilding all buildable services"
    get_buildable_services "$service_map"
    return 0
  fi

  if [ "$PREFER_TURBO_DRY_RUN" = "true" ]; then
    local turbo_services
    turbo_services=$(detect_with_turbo "$last_commit" "$service_map" || true)
    if [ -n "$turbo_services" ]; then
      echo "$turbo_services"
      return 0
    fi
    log_warning "Turbo affected detection unavailable; using source-path fallback"
  fi

  if printf '%s\n' "$changed_files" | grep -q '^packages/'; then
    log_warning "Shared package changed and Turbo output unavailable; rebuilding all buildable services"
    get_buildable_services "$service_map"
    return 0
  fi

  if [ "$FALLBACK_TO_SOURCE_PATHS" = "true" ]; then
    detect_with_source_paths "$changed_files" "$service_map"
    return 0
  fi

  echo ""
}

validate_deployment_tools() {
  local mode="${1:-deploy}"
  local failed=0
  local commands="docker jq"
  if [ "$mode" = "deploy" ]; then
    commands="$commands git sha256sum awk"
  elif [ "$mode" = "pull" ]; then
    commands="$commands sha256sum awk"
  fi

  for command_name in $commands; do
    if command -v "$command_name" >/dev/null 2>&1; then
      log_success "$command_name available"
    else
      log_error "$command_name command not found"
      failed=1
    fi
  done
  docker compose version >/dev/null 2>&1 || { log_error "docker compose not available"; failed=1; }
  [ "$failed" -eq 0 ]
}

validate_configuration_files() {
  local config_dir="$1"
  local failed=0
  for file in deployment-config.json service-map.json smoke-tests.json; do
    if [ ! -f "$config_dir/$file" ]; then
      log_error "$file not found"
      failed=1
    elif jq empty "$config_dir/$file" >/dev/null 2>&1; then
      log_success "$file valid"
    else
      log_error "$file is invalid JSON"
      failed=1
    fi
  done
  [ "$failed" -eq 0 ]
}

validate_runtime_layout() {
  local runtime_root="$1"
  [ "${HOSTINGER_SOURCE_FREE_RUNTIME:-false}" = "true" ] || return 0

  local failed=0
  log_header "Runtime Layout Validation"

  for dir in compose config nginx env scripts state logs backups; do
    if [ -d "$runtime_root/$dir" ]; then
      log_success "Runtime directory present: $dir"
    else
      log_error "Runtime directory missing: $runtime_root/$dir"
      failed=1
    fi
  done

  for file in compose/docker-compose.yml compose/docker-compose.production.yml config/deployment-config.json config/service-map.json config/smoke-tests.json manifest.json; do
    if [ -f "$runtime_root/$file" ]; then
      log_success "Runtime file present: $file"
    else
      log_error "Runtime file missing: $runtime_root/$file"
      failed=1
    fi
  done

  if grep -R -nE '^[[:space:]]*(build|dockerfile|context):' "$runtime_root/compose" >/dev/null 2>&1; then
    log_error "Runtime compose contains source-build directives"
    failed=1
  fi

  [ "$failed" -eq 0 ]
}

runtime_git_commit() {
  local manifest_file="${1:-}"
  if [ -n "$manifest_file" ] && [ -f "$manifest_file" ]; then
    local commit
    commit=$(jq -r '.gitCommit // empty' "$manifest_file" 2>/dev/null || echo "")
    if [ -n "$commit" ] && [ "$commit" != "null" ]; then
      echo "$commit"
      return 0
    fi
  fi
  git rev-parse HEAD 2>/dev/null || echo "unknown"
}

runtime_manifest_field() {
  local field="$1"
  local manifest_file="${RUNTIME_MANIFEST_FILE:-}"
  if [ -n "$manifest_file" ] && [ -f "$manifest_file" ]; then
    jq -r ".$field // \"unknown\"" "$manifest_file" 2>/dev/null || echo "unknown"
    return 0
  fi
  echo "unknown"
}

check_system_resources() {
  local failed=0
  log_header "System Resource Check"

  local disk_used disk_free
  disk_used=$(df / | awk 'NR==2 {gsub("%","",$5); print $5}')
  disk_free=$((100 - disk_used))
  [ "$disk_free" -ge "$MIN_DISK_FREE" ] || { log_error "Disk free ${disk_free}% below ${MIN_DISK_FREE}%"; failed=1; }

  local inode_free
  inode_free=$(df -i / | awk 'NR==2 {print $4}')
  [ "$inode_free" -ge "$MIN_INODES" ] || { log_error "Free inodes $inode_free below $MIN_INODES"; failed=1; }

  if command -v free >/dev/null 2>&1; then
    local mem_total mem_available mem_free_percent
    mem_total=$(free | awk '/Mem:/ {print $2}')
    mem_available=$(free | awk '/Mem:/ {print $7}')
    mem_free_percent=$((mem_available * 100 / mem_total))
    [ "$mem_free_percent" -ge "$MIN_MEMORY_FREE" ] || { log_error "Memory free ${mem_free_percent}% below ${MIN_MEMORY_FREE}%"; failed=1; }
  fi

  local load_avg cpu_count max_allowed
  load_avg=$(awk '{print $1}' /proc/loadavg 2>/dev/null || echo "0")
  cpu_count=$(nproc 2>/dev/null || echo "1")
  max_allowed=$(awk -v configured="$MAX_CPU_LOAD" -v cpus="$cpu_count" 'BEGIN { per_cpu=cpus*2; print configured < per_cpu ? configured : per_cpu }')
  awk -v load="$load_avg" -v max="$max_allowed" 'BEGIN { exit(load <= max ? 0 : 1) }' || { log_error "CPU load $load_avg above $max_allowed"; failed=1; }

  docker info >/dev/null 2>&1 || { log_error "Docker daemon not running"; failed=1; }
  docker compose version >/dev/null 2>&1 || { log_error "Docker Compose unavailable"; failed=1; }
  docker buildx version >/dev/null 2>&1 || { log_error "Docker Buildx/BuildKit unavailable"; failed=1; }

  if docker system df >/dev/null 2>&1; then
    log_success "Docker storage accessible"
  else
    log_error "Docker storage check failed"
    failed=1
  fi

  [ "$failed" -eq 0 ] || return 1
  log_success "Resource checks passed"
}

boot_id() {
  cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo "unknown"
}

process_start_ticks() {
  local pid="$1"
  awk '{print $22}' "/proc/$pid/stat" 2>/dev/null || echo ""
}

is_lock_stale() {
  local lock_file="$1"
  [ -f "$lock_file" ] || return 0

  local lock_pid lock_boot lock_start current_start
  lock_pid=$(jq -r '.pid // empty' "$lock_file" 2>/dev/null || echo "")
  lock_boot=$(jq -r '.boot_id // empty' "$lock_file" 2>/dev/null || echo "")
  lock_start=$(jq -r '.process_start_ticks // empty' "$lock_file" 2>/dev/null || echo "")

  [ -n "$lock_pid" ] || return 0
  [ "$lock_boot" = "$(boot_id)" ] || return 0
  kill -0 "$lock_pid" 2>/dev/null || return 0
  current_start=$(process_start_ticks "$lock_pid")
  [ -n "$lock_start" ] && [ "$current_start" = "$lock_start" ] && return 1
  return 0
}

acquire_lock() {
  local lock_file="$1"
  local timeout="$2"
  local waited=0
  mkdir -p "$(dirname "$lock_file")"

  while [ -f "$lock_file" ]; do
    if is_lock_stale "$lock_file"; then
      log_warning "Removing stale deployment lock"
      rm -f "$lock_file"
      break
    fi
    [ "$waited" -lt "$timeout" ] || { log_error "Timed out waiting for deployment lock: $lock_file"; return 1; }
    sleep 5
    waited=$((waited + 5))
  done

  jq -n \
    --argjson pid "$$" \
    --arg hostname "$(hostname)" \
    --arg boot_id "$(boot_id)" \
    --arg process_start_ticks "$(process_start_ticks "$$")" \
    --arg acquired_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    '{pid:$pid,hostname:$hostname,boot_id:$boot_id,process_start_ticks:$process_start_ticks,acquired_at:$acquired_at}' > "$lock_file"
  log_success "Deployment lock acquired"
}

release_lock() {
  local lock_file="$1"
  [ -f "$lock_file" ] && rm -f "$lock_file" && log_success "Deployment lock released"
}

enable_buildkit() {
  if [ "$DOCKER_BUILDKIT_ENABLED" = "true" ]; then
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
  fi
}

run_with_timeout() {
  local seconds="$1"
  shift
  if command -v timeout >/dev/null 2>&1; then
    local status
    set +e
    timeout "$seconds" "$@"
    status=$?
    set -e
    [ "$status" -eq 0 ] && return 0
    if [ "$status" -eq 124 ]; then
      log_error "Command timed out after ${seconds}s: $*"
    elif [ "$status" -ne 0 ]; then
      log_error "Command failed with exit code $status: $*"
    fi
    return "$status"
  else
    "$@"
  fi
}

container_id_for_service() {
  compose ps -q "$1" 2>/dev/null || true
}

wait_for_health() {
  local service="$1"
  local timeout="$2"
  local interval="$3"
  local waited=0

  while [ "$waited" -lt "$timeout" ]; do
    local cid state health
    cid=$(container_id_for_service "$service")
    if [ -n "$cid" ]; then
      state=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null || echo "unknown")
      health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo "unknown")
      if [ "$health" = "healthy" ] || { [ "$health" = "none" ] && [ "$state" = "running" ]; }; then
        log_success "$service healthy"
        return 0
      fi
      log_info "$service status=$state health=$health (${waited}s/${timeout}s)"
    fi
    sleep "$interval"
    waited=$((waited + interval))
  done

  log_error "$service did not become healthy within ${timeout}s"
  return 1
}

wait_for_services_health() {
  local services="$1"
  local timeout="$2"
  local interval="$3"
  local failed=""
  for service in $services; do
    wait_for_health "$service" "$timeout" "$interval" || failed="$failed $service"
  done
  [ -z "$failed" ] || { log_error "Health failed:$failed"; return 1; }
}

run_smoke_test() {
  local test_name="$1"
  local smoke_tests="$2"
  local test_url test_method test_required test_timeout expected runner_image runner_network status

  test_url=$(jq -r ".tests[\"$test_name\"].url // empty" "$smoke_tests")
  [ -n "$test_url" ] || return 0
  test_method=$(jq -r ".tests[\"$test_name\"].method // \"GET\"" "$smoke_tests")
  test_required=$(jq -r ".tests[\"$test_name\"].required // false" "$smoke_tests")
  test_timeout=$(jq -r ".tests[\"$test_name\"].timeout_seconds // 10" "$smoke_tests")
  expected=$(jq -r ".tests[\"$test_name\"].expected_status // 200" "$smoke_tests")
  runner_image=$(jq -r '.runner.image // "curlimages/curl:8.11.1"' "$smoke_tests")
  runner_network=$(resolve_smoke_network "$smoke_tests")

  status=$(docker run --rm --network "$runner_network" "$runner_image" -sS -m "$test_timeout" -o /dev/null -w '%{http_code}' -X "$test_method" "$test_url" 2>/dev/null || echo "000")
  if [ "$status" = "$expected" ]; then
    log_success "Smoke passed: $test_name ($status)"
    return 0
  fi

  if [ "$test_required" = "true" ]; then
    log_error "Smoke failed: $test_name expected $expected got $status"
    return 1
  fi
  log_warning "Optional smoke failed: $test_name expected $expected got $status"
  return 0
}

resolve_smoke_network() {
  local smoke_tests="$1"
  local configured network
  configured=$(jq -r '.runner.network // "auto"' "$smoke_tests")
  if [ -n "$configured" ] && [ "$configured" != "auto" ] && [ "$configured" != "null" ]; then
    echo "$configured"
    return 0
  fi

  network=$(compose config --format json 2>/dev/null | jq -r '.networks.app_internal.name // empty' 2>/dev/null || true)
  if [ -n "$network" ] && [ "$network" != "null" ]; then
    echo "$network"
    return 0
  fi

  printf '%s_internal\n' "$(printf '%s' "$COMPOSE_PROJECT" | tr -c '[:alnum:]' '_')"
}

run_smoke_tests() {
  local services="$1"
  local smoke_tests="$2"
  local failed=0
  log_header "Smoke Tests"
  for service in $services; do
    run_smoke_test "$service" "$smoke_tests" || failed=1
  done
  [ "$failed" -eq 0 ] || return 1
}

compose_config_checksum() {
  compose config 2>/dev/null | sha256sum | awk '{print $1}'
}

deployment_tag_for() {
  printf '%s-%s' "$DEPLOYMENT_TAG_PREFIX" "$1"
}

registry_ref_for() {
  local registry_prefix="$1"
  local image_name="$2"
  local tag="$3"
  registry_prefix=$(printf '%s' "$registry_prefix" | sed 's:/*$::')
  printf '%s/%s:%s' "$registry_prefix" "$image_name" "$tag"
}

write_empty_image_manifest() {
  local output_file="$1"
  jq -n --arg schema_version "1" '{images_schema_version:$schema_version, images:{}}' > "$output_file"
}

add_image_to_manifest() {
  local manifest_file="$1"
  local service="$2"
  local image_name="$3"
  local image_ref="$4"
  local image_id digest

  image_id=$(docker image inspect "$image_ref" -f '{{.Id}}')
  digest=$(docker image inspect "$image_ref" -f '{{range .RepoDigests}}{{println .}}{{end}}' 2>/dev/null | head -1 || true)

  jq --arg service "$service" \
    --arg image_name "$image_name" \
    --arg tag "$(printf '%s' "$image_ref" | awk -F: '{print $NF}')" \
    --arg image_id "$image_id" \
    --arg digest "$digest" \
    '.images += {($service): {image_name:$image_name, tag:$tag, image_id:$image_id, repo_digest:$digest}}' \
    "$manifest_file" > "${manifest_file}.next"
  mv "${manifest_file}.next" "$manifest_file"
}

tag_and_write_image_manifest() {
  local services="$1"
  local deployment_id="$2"
  local service_map="$3"
  local output_file="$4"
  local tmp
  tmp="${output_file}.tmp"
  write_empty_image_manifest "$tmp"

  for service in $services; do
    local image_name image_id tag
    image_name=$(get_service_field "$service" "image_name" "$service_map")
    tag=$(deployment_tag_for "$deployment_id")
    image_id=$(docker image inspect "${image_name}:latest" -f '{{.Id}}' 2>/dev/null || true)
    if [ -z "$image_id" ]; then
      image_id=$(compose images -q "$service" 2>/dev/null | head -1 || true)
      if [ -n "$image_id" ]; then
        docker tag "$image_id" "${image_name}:latest"
      fi
    fi
    image_id=$(docker image inspect "${image_name}:latest" -f '{{.Id}}' 2>/dev/null || true)
    if [ -z "$image_id" ]; then
      log_error "Cannot find built image for $service (${image_name}:latest)"
      rm -f "$tmp"
      return 1
    fi
    docker tag "${image_name}:latest" "${image_name}:${tag}"
    image_id=$(docker image inspect "${image_name}:${tag}" -f '{{.Id}}')
    add_image_to_manifest "$tmp" "$service" "$image_name" "${image_name}:${tag}"
    log_success "$service tagged as ${image_name}:${tag}"
  done

  mv "$tmp" "$output_file"
}

docker_version_string() {
  docker version --format '{{.Server.Version}}' 2>/dev/null || echo "unknown"
}

compose_version_string() {
  docker compose version --short 2>/dev/null || docker compose version 2>/dev/null | awk '{print $NF}' || echo "unknown"
}

git_branch_name() {
  git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
}

operator_name() {
  id -un 2>/dev/null || whoami 2>/dev/null || echo "unknown"
}

save_deployment_state() {
  local state_file="$1"
  local deployment_id="$2"
  local commit="$3"
  local services_built="$4"
  local services_restarted="$5"
  local first_deployment="$6"
  local images_file="$7"
  local compose_checksum="$8"
  local duration_seconds="$9"
  local timestamp commit_short

  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  commit_short=$(echo "$commit" | cut -c1-7)
  [ -f "$state_file" ] && cp "$state_file" "${state_file}.backup"

  local tmp_file
  tmp_file="${state_file}.tmp"

  jq -n \
    --arg schema_version "3.2" \
    --arg images_schema_version "1" \
    --arg deployment_id "$deployment_id" \
    --arg commit "$commit" \
    --arg commit_short "$commit_short" \
    --arg timestamp "$timestamp" \
    --arg hostname "$(hostname 2>/dev/null || echo unknown)" \
    --arg operator "$(operator_name)" \
    --arg git_branch "$(git_branch_name)" \
    --arg workspace "$(pwd)" \
    --arg compose_project "$COMPOSE_PROJECT" \
    --arg docker_version "$(docker_version_string)" \
    --arg compose_version "$(compose_version_string)" \
    --arg runtime_bundle_version "$(runtime_manifest_field bundleVersion)" \
    --arg runtime_schema_version "$(runtime_manifest_field schemaVersion)" \
    --arg services_built "$services_built" \
    --arg services_restarted "$services_restarted" \
    --arg compose_config_sha256 "$compose_checksum" \
    --argjson duration_seconds "$duration_seconds" \
    --argjson first_deployment "$first_deployment" \
    --slurpfile images "$images_file" \
    '{
      schema_version:$schema_version,
      images_schema_version:$images_schema_version,
      deployment_id:$deployment_id,
      commit:$commit,
      commit_short:$commit_short,
      timestamp:$timestamp,
      provenance:{
        hostname:$hostname,
        operator:$operator,
        git_branch:$git_branch,
        workspace:$workspace,
        compose_project:$compose_project,
        docker_version:$docker_version,
        compose_version:$compose_version,
        runtime_bundle_version:$runtime_bundle_version,
        runtime_schema_version:$runtime_schema_version
      },
      services_built:$services_built,
      services_restarted:$services_restarted,
      build_count:($services_built | split(" ") | map(select(length > 0)) | length),
      restart_count:($services_restarted | split(" ") | map(select(length > 0)) | length),
      first_deployment:($first_deployment == 1),
      compose_config_sha256:$compose_config_sha256,
      duration_seconds:$duration_seconds,
      images:($images[0].images // {})
    }' > "$tmp_file"
  mv "$tmp_file" "$state_file"
}

rotate_deployment_history() {
  local history_dir="$1"
  local retention="$2"
  [ -d "$history_dir" ] || return 0
  find "$history_dir" -maxdepth 1 -type f -name '*.json' -printf '%T@ %p\n' 2>/dev/null |
    sort -rn |
    awk -v keep="$retention" 'NR > keep {print $2}' |
    xargs -r rm -f
}

cleanup_deployment_tags() {
  local service="$1"
  local service_map="$2"
  local keep_count="$3"
  local history_dir="${4:-}"
  local image_name
  image_name=$(get_service_field "$service" "image_name" "$service_map")
  docker images "$image_name" --format '{{.Tag}}' |
    grep "^${DEPLOYMENT_TAG_PREFIX}-" |
    sort -r |
    tail -n "+$((keep_count + 1))" |
    while read -r tag; do
      [ -n "$tag" ] || continue
      if is_deployment_tag_referenced "$image_name" "$tag" "$history_dir"; then
        log_info "Keeping referenced rollback tag ${image_name}:${tag}"
        continue
      fi
      docker rmi "${image_name}:${tag}" >/dev/null 2>&1 || true
    done
}

is_deployment_tag_referenced() {
  local image_name="$1"
  local tag="$2"
  local history_dir="$3"
  [ -n "$history_dir" ] && [ -d "$history_dir" ] || return 1
  for file in "$history_dir"/*.json; do
    [ -f "$file" ] || return 1
    jq -e --arg image_name "$image_name" --arg tag "$tag" '
      .images // {}
      | to_entries[]
      | select(.value.image_name == $image_name and .value.tag == $tag)
    ' "$file" >/dev/null 2>&1 && return 0
  done
  return 1
}

cleanup_docker_images() {
  docker image prune -f >/dev/null 2>&1 || true
  if [ "${CLEANUP_BUILDER_CACHE:-false}" = "true" ]; then
    docker builder prune -f --filter "until=${PRUNE_IMAGES_OLDER_THAN_DAYS}d" >/dev/null 2>&1 || true
  fi
}
