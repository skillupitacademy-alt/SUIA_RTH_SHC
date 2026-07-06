#!/usr/bin/env sh
# Deployment Library V3.0
# Reusable functions for production deployment system
#
# This library provides modular functions for:
# - Configuration loading
# - Change detection
# - Service management
# - Health checks
# - Smoke tests
# - State management
# - Resource checking
# - Deployment locking
# - Logging

set -eu

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# =============================================================================
# Configuration Loading
# =============================================================================

# Load deployment configuration from JSON
# Returns: Sets global variables from config
load_deployment_config() {
  local config_file="$1"
  
  if [ ! -f "$config_file" ]; then
    log_error "Configuration file not found: $config_file"
    return 1
  fi
  
  if [ "$HAS_JQ" -eq 1 ]; then
    # Use jq for robust parsing
    export DEPLOY_STATE_DIR=$(jq -r '.deployment.state_directory' "$config_file")
    export DEPLOY_HISTORY_RETENTION=$(jq -r '.deployment.history_retention' "$config_file")
    export DEPLOY_LOCK_TIMEOUT=$(jq -r '.deployment.lock_timeout_seconds' "$config_file")
    export DEPLOY_BUILD_TIMEOUT=$(jq -r '.deployment.build_timeout_seconds' "$config_file")
    export DEPLOY_HEALTH_TIMEOUT=$(jq -r '.deployment.health_check_timeout_seconds' "$config_file")
    export DEPLOY_HEALTH_INTERVAL=$(jq -r '.deployment.health_check_interval_seconds' "$config_file")
    
    export MIN_DISK_FREE=$(jq -r '.resource_requirements.minimum_disk_free_percent' "$config_file")
    export MIN_MEMORY_FREE=$(jq -r '.resource_requirements.minimum_memory_free_percent' "$config_file")
    export MAX_CPU_LOAD=$(jq -r '.resource_requirements.maximum_cpu_load' "$config_file")
    export MIN_INODES=$(jq -r '.resource_requirements.minimum_inodes_free' "$config_file")
    
    export DOCKER_BUILDKIT=$(jq -r '.docker.buildkit_enabled' "$config_file")
    export COMPOSE_PROJECT=$(jq -r '.docker.compose_project_name' "$config_file")
  else
    # Fallback parsing without jq
    export DEPLOY_STATE_DIR="/opt/platform/state"
    export DEPLOY_HISTORY_RETENTION=30
    export DEPLOY_LOCK_TIMEOUT=1800
    export DEPLOY_BUILD_TIMEOUT=1800
    export DEPLOY_HEALTH_TIMEOUT=60
    export DEPLOY_HEALTH_INTERVAL=5
    export MIN_DISK_FREE=15
    export MIN_MEMORY_FREE=20
    export MAX_CPU_LOAD=8.0
    export MIN_INODES=10000
    export DOCKER_BUILDKIT=true
    export COMPOSE_PROJECT="quiz-platform"
  fi
  
  log_info "Configuration loaded from $config_file"
  return 0
}

# Get list of all services from service map
# Args: $1 = service-map.json path
# Returns: Space-separated service names
get_all_services() {
  local service_map="$1"
  
  if [ "$HAS_JQ" -eq 1 ]; then
    jq -r '.services | keys[]' "$service_map" | tr '\n' ' '
  else
    log_error "Cannot parse service map without jq"
    return 1
  fi
}

# Get service metadata field
# Args: $1 = service name, $2 = field name, $3 = service-map.json path
# Returns: Field value
get_service_field() {
  local service="$1"
  local field="$2"
  local service_map="$3"
  
  if [ "$HAS_JQ" -eq 1 ]; then
    jq -r ".services[\"$service\"].$field // empty" "$service_map"
  else
    log_error "Cannot parse service map without jq"
    return 1
  fi
}

# =============================================================================
# Change Detection
# =============================================================================

# Detect services affected by file changes
# Args: $1 = changed files (newline separated), $2 = service-map.json, $3 = deployment-config.json
# Returns: Space-separated list of services to rebuild
detect_affected_services() {
  local changed_files="$1"
  local service_map="$2"
  local deploy_config="$3"
  local services=""
  
  # Check for shared package changes
  if echo "$changed_files" | grep -q "^packages/"; then
    if [ "$HAS_JQ" -eq 1 ]; then
      local rebuild_all=$(jq -r '.deployment_triggers.rebuild_all_on_shared_change' "$deploy_config")
      if [ "$rebuild_all" = "true" ]; then
        log_warning "Shared packages changed - all services affected"
        get_all_services "$service_map"
        return 0
      fi
    fi
  fi
  
  # Check for root config changes
  if [ "$HAS_JQ" -eq 1 ]; then
    local root_configs=$(jq -r '.shared_paths.root_configs[]' "$deploy_config" 2>/dev/null || echo "")
    for config in $root_configs; do
      if echo "$changed_files" | grep -qE "^${config}\$"; then
        local rebuild_all=$(jq -r '.deployment_triggers.rebuild_all_on_root_config_change' "$deploy_config")
        if [ "$rebuild_all" = "true" ]; then
          log_warning "Root configuration changed - all services affected"
          get_all_services "$service_map"
          return 0
        fi
      fi
    done
  fi
  
  # Check individual services
  for service in $(get_all_services "$service_map"); do
    local source_path=$(get_service_field "$service" "source_path" "$service_map")
    
    if [ -n "$source_path" ] && echo "$changed_files" | grep -q "^${source_path}/"; then
      services="$services $service"
    fi
  done
  
  echo "$services" | xargs
  return 0
}

# Normalize service list (remove duplicates, sort)
# Args: $1 = space-separated service names
# Returns: Normalized space-separated service names
normalize_services() {
  local services="$1"
  
  if [ -z "$services" ]; then
    echo ""
    return 0
  fi
  
  echo "$services" | tr ' ' '\n' | sort -u | tr '\n' ' ' | sed 's/ *$//'
}

# =============================================================================
# Logging
# =============================================================================

# Log info message with timestamp
log_info() {
  local timestamp=$(date +"%H:%M:%S")
  echo "${CYAN}[$timestamp]${NC} $1"
}

# Log success message
log_success() {
  local timestamp=$(date +"%H:%M:%S")
  echo "${GREEN}[$timestamp] ✓${NC} $1"
}

# Log warning message
log_warning() {
  local timestamp=$(date +"%H:%M:%S")
  echo "${YELLOW}[$timestamp] ⚠${NC} $1"
}

# Log error message
log_error() {
  local timestamp=$(date +"%H:%M:%S")
  echo "${RED}[$timestamp] ✗${NC} $1" >&2
}

# Log section header
log_header() {
  echo ""
  echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "${BLUE}$1${NC}"
  echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# =============================================================================
# Resource Checking
# =============================================================================

# Check if system has sufficient resources for deployment
# Args: $1 = deployment-config.json path
# Returns: 0 if resources OK, 1 if insufficient
check_system_resources() {
  local deploy_config="$1"
  local checks_failed=0
  
  log_header "System Resource Check"
  
  # Check disk space
  local disk_used=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
  local disk_free=$((100 - disk_used))
  
  if [ "$disk_free" -lt "$MIN_DISK_FREE" ]; then
    log_error "Insufficient disk space: ${disk_free}% free (minimum: ${MIN_DISK_FREE}%)"
    checks_failed=1
  else
    log_success "Disk space: ${disk_free}% free"
  fi
  
  # Check memory
  if command -v free >/dev/null 2>&1; then
    local mem_total=$(free | grep Mem | awk '{print $2}')
    local mem_available=$(free | grep Mem | awk '{print $7}')
    local mem_free_percent=$((mem_available * 100 / mem_total))
    
    if [ "$mem_free_percent" -lt "$MIN_MEMORY_FREE" ]; then
      log_warning "Low memory: ${mem_free_percent}% free (minimum: ${MIN_MEMORY_FREE}%)"
      # Warning only, don't fail
    else
      log_success "Memory: ${mem_free_percent}% free"
    fi
  fi
  
  # Check CPU load
  if command -v uptime >/dev/null 2>&1; then
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local load_check=$(echo "$load_avg < $MAX_CPU_LOAD" | bc 2>/dev/null || echo "1")
    
    if [ "$load_check" = "0" ]; then
      log_warning "High CPU load: $load_avg (maximum: $MAX_CPU_LOAD)"
      # Warning only, don't fail
    else
      log_success "CPU load: $load_avg"
    fi
  fi
  
  # Check inodes
  local inodes_free=$(df -i / | tail -1 | awk '{print $4}')
  
  if [ "$inodes_free" -lt "$MIN_INODES" ]; then
    log_error "Insufficient inodes: $inodes_free free (minimum: $MIN_INODES)"
    checks_failed=1
  else
    log_success "Inodes: $inodes_free free"
  fi
  
  # Check Docker
  if ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon not running"
    checks_failed=1
  else
    log_success "Docker daemon running"
  fi
  
  # Check Docker Compose
  if ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose not available"
    checks_failed=1
  else
    log_success "Docker Compose available"
  fi
  
  echo ""
  
  if [ $checks_failed -eq 1 ]; then
    log_error "Resource checks failed - deployment aborted"
    return 1
  fi
  
  log_success "All resource checks passed"
  return 0
}

# =============================================================================
# Deployment Locking
# =============================================================================

# Acquire deployment lock
# Args: $1 = lock file path, $2 = timeout seconds
# Returns: 0 if lock acquired, 1 if failed
acquire_lock() {
  local lock_file="$1"
  local timeout="$2"
  local wait_time=0
  
  # Check if lock exists
  if [ -f "$lock_file" ]; then
    # Check if lock is stale
    if is_lock_stale "$lock_file"; then
      log_warning "Removing stale lock file"
      rm -f "$lock_file"
    fi
  fi
  
  while [ -f "$lock_file" ]; do
    if [ $wait_time -ge $timeout ]; then
      log_error "Failed to acquire lock after ${timeout}s"
      log_error "Another deployment may be in progress"
      
      # Show lock info
      if [ -f "$lock_file" ]; then
        local lock_info=$(cat "$lock_file" 2>/dev/null || echo "")
        log_error "Lock info: $lock_info"
      fi
      
      log_error "Lock file: $lock_file"
      log_info "To force unlock: rm $lock_file"
      return 1
    fi
    
    log_warning "Waiting for deployment lock... (${wait_time}s / ${timeout}s)"
    sleep 5
    wait_time=$((wait_time + 5))
    
    # Check if lock became stale
    if is_lock_stale "$lock_file"; then
      log_warning "Lock became stale, removing"
      rm -f "$lock_file"
      break
    fi
  done
  
  # Create lock file
  mkdir -p "$(dirname "$lock_file")"
  echo "$$|$(date -u +"%Y-%m-%dT%H:%M:%SZ")|$(hostname)" > "$lock_file"
  
  log_success "Deployment lock acquired (PID: $$)"
  return 0
}

# Release deployment lock
# Args: $1 = lock file path
release_lock() {
  local lock_file="$1"
  
  if [ -f "$lock_file" ]; then
    rm -f "$lock_file"
    log_success "Deployment lock released"
  fi
}

# =============================================================================
# Health Checks
# =============================================================================

# Wait for service to become healthy
# Args: $1 = service name, $2 = timeout seconds, $3 = interval seconds
# Returns: 0 if healthy, 1 if timeout
wait_for_health() {
  local service="$1"
  local timeout="$2"
  local interval="$3"
  local wait_time=0
  
  log_info "Waiting for $service to become healthy..."
  
  while [ $wait_time -lt $timeout ]; do
    # Check container health from docker compose
    local health=$(docker compose ps --format json "$service" 2>/dev/null | grep -o '"Health":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    
    if [ "$health" = "healthy" ] || [ "$service" = "nginx" ]; then
      log_success "$service is healthy"
      return 0
    fi
    
    sleep "$interval"
    wait_time=$((wait_time + interval))
    log_info "  Still waiting... (${wait_time}s / ${timeout}s, status: $health)"
  done
  
  log_error "$service did not become healthy within ${timeout}s"
  return 1
}

# Wait for multiple services to become healthy
# Args: $1 = space-separated service names, $2 = timeout, $3 = interval
# Returns: 0 if all healthy, 1 if any timeout
wait_for_services_health() {
  local services="$1"
  local timeout="$2"
  local interval="$3"
  local failed_services=""
  
  for service in $services; do
    if ! wait_for_health "$service" "$timeout" "$interval"; then
      failed_services="$failed_services $service"
    fi
  done
  
  if [ -n "$failed_services" ]; then
    log_error "Services failed health check:$failed_services"
    return 1
  fi
  
  log_success "All services are healthy"
  return 0
}

# =============================================================================
# Smoke Tests
# =============================================================================

# Run smoke test for a service
# Args: $1 = test name, $2 = smoke-tests.json path
# Returns: 0 if test passed, 1 if failed
run_smoke_test() {
  local test_name="$1"
  local smoke_tests="$2"
  
  if [ "$HAS_JQ" -eq 1 ]; then
    local test_url=$(jq -r ".tests[\"$test_name\"].url" "$smoke_tests")
    local test_method=$(jq -r ".tests[\"$test_name\"].method" "$smoke_tests")
    local test_required=$(jq -r ".tests[\"$test_name\"].required" "$smoke_tests")
    local test_timeout=$(jq -r ".tests[\"$test_name\"].timeout_seconds" "$smoke_tests")
    local execute_from=$(jq -r ".tests[\"$test_name\"].execute_from" "$smoke_tests")
    
    if [ "$test_url" = "null" ]; then
      return 0
    fi
    
    # Execute from specified container
    local container="${COMPOSE_PROJECT}-${execute_from}-1"
    
    if docker exec "$container" wget --timeout="$test_timeout" -qO- "$test_url" >/dev/null 2>&1; then
      log_success "Smoke test passed: $test_name"
      return 0
    else
      if [ "$test_required" = "true" ]; then
        log_error "Required smoke test failed: $test_name"
        return 1
      else
        log_warning "Optional smoke test failed: $test_name"
        return 0
      fi
    fi
  else
    log_warning "Cannot run smoke tests without jq"
    return 0
  fi
}

# Run smoke tests for deployed services
# Args: $1 = space-separated service names, $2 = smoke-tests.json path
# Returns: 0 if all required tests passed, 1 if any failed
run_smoke_tests() {
  local services="$1"
  local smoke_tests="$2"
  local tests_failed=0
  
  log_header "Smoke Tests"
  
  for service in $services; do
    if ! run_smoke_test "$service" "$smoke_tests"; then
      tests_failed=1
    fi
  done
  
  echo ""
  
  if [ $tests_failed -eq 1 ]; then
    log_error "Some required smoke tests failed"
    return 1
  fi
  
  log_success "All smoke tests passed"
  return 0
}

# =============================================================================
# State Management
# =============================================================================

# Save deployment state
# Args: $1 = state file, $2 = commit, $3 = services built, $4 = services restarted, $5 = first deployment flag
save_deployment_state() {
  local state_file="$1"
  local commit="$2"
  local services_built="$3"
  local services_restarted="$4"
  local first_deployment="$5"
  
  local commit_short=$(echo "$commit" | cut -c1-7)
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
  local build_count=$(echo "$services_built" | wc -w | tr -d ' ')
  local restart_count=$(echo "$services_restarted" | wc -w | tr -d ' ')
  
  # Backup previous state
  if [ -f "$state_file" ]; then
    cp "$state_file" "${state_file}.backup"
  fi
  
  # Create new state
  if [ "$HAS_JQ" -eq 1 ]; then
    jq -n \
      --arg commit "$commit" \
      --arg commit_short "$commit_short" \
      --arg timestamp "$timestamp" \
      --arg services_built "$services_built" \
      --arg services_restarted "$services_restarted" \
      --argjson build_count "$build_count" \
      --argjson restart_count "$restart_count" \
      --argjson first_deployment "$first_deployment" \
      '{
        commit: $commit,
        commit_short: $commit_short,
        timestamp: $timestamp,
        services_built: $services_built,
        services_restarted: $services_restarted,
        build_count: $build_count,
        restart_count: $restart_count,
        first_deployment: ($first_deployment == 1),
        version: "3.0"
      }' > "$state_file"
  else
    # Fallback without jq
    cat > "$state_file" << EOF
{
  "commit": "$commit",
  "commit_short": "$commit_short",
  "timestamp": "$timestamp",
  "services_built": "$services_built",
  "services_restarted": "$services_restarted",
  "build_count": $build_count,
  "restart_count": $restart_count,
  "first_deployment": $([ "$first_deployment" -eq 1 ] && echo "true" || echo "false"),
  "version": "3.0"
}
EOF
  fi
  
  log_success "Deployment state saved: $state_file"
  return 0
}

# Rotate deployment history
# Args: $1 = history directory, $2 = retention count
rotate_deployment_history() {
  local history_dir="$1"
  local retention="$2"
  
  if [ ! -d "$history_dir" ]; then
    return 0
  fi
  
  local history_count=$(ls -1 "$history_dir" 2>/dev/null | wc -l | tr -d ' ')
  
  if [ "$history_count" -gt "$retention" ]; then
    log_info "Rotating deployment history (keeping last $retention)"
    cd "$history_dir"
    ls -t | tail -n +$((retention + 1)) | xargs rm -f
    cd - >/dev/null
    log_success "History rotated"
  fi
}

# =============================================================================
# Docker Management
# =============================================================================

# Enable BuildKit if configured
enable_buildkit() {
  if [ "$DOCKER_BUILDKIT" = "true" ]; then
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    log_success "BuildKit enabled"
  fi
}

# Cleanup old Docker images
# Args: $1 = days threshold
cleanup_docker_images() {
  local days="$1"
  
  log_info "Cleaning up Docker images older than $days days"
  
  # Prune dangling images
  docker image prune -f >/dev/null 2>&1 || true
  
  # Prune build cache
  docker builder prune -f --filter "until=${days}d" >/dev/null 2>&1 || true
  
  log_success "Docker cleanup complete"
}

# Tag deployment images with timestamp for versioning
# Args: $1 = space-separated service names, $2 = timestamp
tag_deployment_images() {
  local services="$1"
  local timestamp="$2"
  
  log_info "Tagging deployment images: $timestamp"
  
  for service in $services; do
    # Get current latest image ID
    local image_id=$(docker images "${service}:latest" -q 2>/dev/null | head -1)
    
    if [ -n "$image_id" ]; then
      # Tag with deployment timestamp
      if docker tag "$image_id" "${service}:deployment-${timestamp}" 2>/dev/null; then
        log_success "$service: Tagged as deployment-${timestamp}"
      else
        log_warning "$service: Failed to tag image"
      fi
    else
      log_warning "$service: No latest image found to tag"
    fi
  done
}

# Cleanup old deployment-tagged images (keep last N)
# Args: $1 = service name, $2 = number to keep
cleanup_deployment_tags() {
  local service="$1"
  local keep_count="$2"
  
  # Get all deployment tags for service
  local tags=$(docker images "$service" --format "{{.Tag}}" 2>/dev/null | grep "^deployment-" | sort -r)
  local tag_count=$(echo "$tags" | grep -c "^deployment-" || echo "0")
  
  if [ "$tag_count" -gt "$keep_count" ]; then
    local remove_count=$((tag_count - keep_count))
    log_info "$service: Removing $remove_count old deployment tag(s)"
    
    echo "$tags" | tail -n "+$((keep_count + 1))" | while read -r tag; do
      if [ -n "$tag" ]; then
        docker rmi "${service}:${tag}" >/dev/null 2>&1 || true
      fi
    done
  fi
}

# =============================================================================
# Pre-Deployment Validation
# =============================================================================

# Check if all required tools are available
# Returns: 0 if all OK, 1 if critical tools missing
validate_deployment_tools() {
  local checks_failed=0
  
  log_info "Validating deployment tools..."
  
  # Check Docker
  if ! command -v docker >/dev/null 2>&1; then
    log_error "docker command not found"
    checks_failed=1
  else
    log_success "docker available"
  fi
  
  # Check Docker Compose
  if ! docker compose version >/dev/null 2>&1; then
    log_error "docker compose not available"
    checks_failed=1
  else
    log_success "docker compose available"
  fi
  
  # Check Git
  if ! command -v git >/dev/null 2>&1; then
    log_error "git command not found"
    checks_failed=1
  else
    log_success "git available"
  fi
  
  # Check jq (warning only)
  if ! command -v jq >/dev/null 2>&1; then
    log_warning "jq not available (recommended)"
  else
    log_success "jq available"
  fi
  
  if [ $checks_failed -eq 1 ]; then
    log_error "Critical tools missing"
    return 1
  fi
  
  return 0
}

# Check if configuration files exist and are valid
# Args: $1 = config directory
# Returns: 0 if valid, 1 if invalid
validate_configuration_files() {
  local config_dir="$1"
  local checks_failed=0
  
  log_info "Validating configuration files..."
  
  # Check deployment-config.json
  if [ ! -f "$config_dir/deployment-config.json" ]; then
    log_error "deployment-config.json not found"
    checks_failed=1
  else
    if [ "$HAS_JQ" -eq 1 ]; then
      if ! jq empty "$config_dir/deployment-config.json" 2>/dev/null; then
        log_error "deployment-config.json is invalid JSON"
        checks_failed=1
      else
        log_success "deployment-config.json valid"
      fi
    fi
  fi
  
  # Check service-map.json
  if [ ! -f "$config_dir/service-map.json" ]; then
    log_error "service-map.json not found"
    checks_failed=1
  else
    if [ "$HAS_JQ" -eq 1 ]; then
      if ! jq empty "$config_dir/service-map.json" 2>/dev/null; then
        log_error "service-map.json is invalid JSON"
        checks_failed=1
      else
        log_success "service-map.json valid"
      fi
    fi
  fi
  
  # Check smoke-tests.json
  if [ ! -f "$config_dir/smoke-tests.json" ]; then
    log_error "smoke-tests.json not found"
    checks_failed=1
  else
    if [ "$HAS_JQ" -eq 1 ]; then
      if ! jq empty "$config_dir/smoke-tests.json" 2>/dev/null; then
        log_error "smoke-tests.json is invalid JSON"
        checks_failed=1
      else
        log_success "smoke-tests.json valid"
      fi
    fi
  fi
  
  if [ $checks_failed -eq 1 ]; then
    log_error "Configuration validation failed"
    return 1
  fi
  
  return 0
}

# Check if lock is stale (process no longer running)
# Args: $1 = lock file path
# Returns: 0 if stale, 1 if active
is_lock_stale() {
  local lock_file="$1"
  
  if [ ! -f "$lock_file" ]; then
    return 0
  fi
  
  # Read PID from lock file
  local lock_pid=$(cut -d'|' -f1 "$lock_file" 2>/dev/null || echo "")
  
  if [ -z "$lock_pid" ]; then
    return 0
  fi
  
  # Check if process is running
  if kill -0 "$lock_pid" 2>/dev/null; then
    return 1
  fi
  
  return 0
}

# =============================================================================
# Initialization
# =============================================================================

# Check if jq is available
if command -v jq >/dev/null 2>&1; then
  HAS_JQ=1
else
  HAS_JQ=0
fi

log_info "Deployment Library V3.0 loaded (jq: $([ $HAS_JQ -eq 1 ] && echo 'available' || echo 'unavailable'))"
