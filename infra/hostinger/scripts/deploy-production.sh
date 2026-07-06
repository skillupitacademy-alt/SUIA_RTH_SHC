#!/usr/bin/env sh
# Production Deployment System V3.0
# Thin orchestrator using lib-deployment.sh
#
# This script coordinates deployment flow:
# 1. Acquire lock
# 2. Check resources
# 3. Detect changes
# 4. Build affected services
# 5. Restart services
# 6. Wait for health
# 7. Run smoke tests
# 8. Save state
# 9. Cleanup

set -eu

# =============================================================================
# Initialization
# =============================================================================

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

# Source helper library (for compose() function)
. "$SCRIPT_DIR/lib.sh"

# Source deployment library
. "$SCRIPT_DIR/lib-deployment.sh"

# Check required commands
require_command docker
require_command git

# Check for jq
if ! command -v jq >/dev/null 2>&1; then
  log_warning "jq not found - install with: apt-get install jq"
  log_warning "Some features will be limited without jq"
  export HAS_JQ=0
else
  export HAS_JQ=1
fi

# =============================================================================
# Pre-Deployment Validation
# =============================================================================

log_header "Pre-Deployment Validation"

# Validate deployment tools
if ! validate_deployment_tools; then
  log_error "Required tools missing - cannot proceed"
  exit 1
fi

echo ""

# Validate configuration files
if ! validate_configuration_files "$CONFIG_DIR"; then
  log_error "Configuration validation failed - cannot proceed"
  exit 1
fi

echo ""

# Load configuration
if ! load_deployment_config "$CONFIG_DIR/deployment-config.json"; then
  log_error "Failed to load deployment configuration"
  exit 1
fi

# Configuration files
SERVICE_MAP="$CONFIG_DIR/service-map.json"
SMOKE_TESTS="$CONFIG_DIR/smoke-tests.json"
DEPLOYMENT_STATE="$DEPLOY_STATE_DIR/deployment.json"
HISTORY_DIR="$DEPLOY_STATE_DIR/history"
LOCK_FILE="$DEPLOY_STATE_DIR/deploy.lock"

# Create directories
mkdir -p "$DEPLOY_STATE_DIR"
mkdir -p "$HISTORY_DIR"

# Set up cleanup trap
cleanup() {
  release_lock "$LOCK_FILE"
}
trap cleanup EXIT

# Set up timeout trap for build phase
DEPLOYMENT_START_TIME=$(date +%s)

check_timeout() {
  local current_time=$(date +%s)
  local elapsed=$((current_time - DEPLOYMENT_START_TIME))
  
  if [ $elapsed -gt "$DEPLOY_BUILD_TIMEOUT" ]; then
    log_error "Deployment timeout exceeded (${elapsed}s > ${DEPLOY_BUILD_TIMEOUT}s)"
    log_error "Aborting deployment"
    exit 1
  fi
}

# =============================================================================
# Deployment Header
# =============================================================================

log_header "Production Deployment System V3.0"

log_info "Configuration loaded"
log_info "State directory: $DEPLOY_STATE_DIR"
log_info "Service map: $SERVICE_MAP"
log_info "Build timeout: ${DEPLOY_BUILD_TIMEOUT}s"
log_info "Lock timeout: ${DEPLOY_LOCK_TIMEOUT}s"
echo ""

# =============================================================================
# Acquire Lock
# =============================================================================

log_header "Deployment Lock"

if ! acquire_lock "$LOCK_FILE" "$DEPLOY_LOCK_TIMEOUT"; then
  log_error "Failed to acquire deployment lock"
  log_error "Another deployment may be in progress"
  exit 1
fi

# =============================================================================
# Resource Checks
# =============================================================================

if ! check_system_resources "$CONFIG_DIR/deployment-config.json"; then
  log_error "System resources insufficient for deployment"
  exit 1
fi

# =============================================================================
# Git Commit Detection
# =============================================================================

log_header "Change Detection"

# Get current commit
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
CURRENT_SHORT=$(echo "$CURRENT_COMMIT" | cut -c1-7)
log_info "Current commit: $CURRENT_SHORT"

# Get last deployed commit
LAST_COMMIT=""
LAST_SHORT=""
IS_FIRST_DEPLOYMENT=0

if [ -f "$DEPLOYMENT_STATE" ]; then
  if [ "$HAS_JQ" -eq 1 ]; then
    LAST_COMMIT=$(jq -r '.commit // empty' "$DEPLOYMENT_STATE" 2>/dev/null || echo "")
  else
    LAST_COMMIT=$(grep -o '"commit"[[:space:]]*:[[:space:]]*"[^"]*"' "$DEPLOYMENT_STATE" | sed 's/.*"\([^"]*\)"$/\1/')
  fi
  
  if [ -n "$LAST_COMMIT" ] && [ "$LAST_COMMIT" != "null" ]; then
    LAST_SHORT=$(echo "$LAST_COMMIT" | cut -c1-7)
    log_info "Last deployment: $LAST_SHORT"
  else
    IS_FIRST_DEPLOYMENT=1
    log_info "First deployment: No previous state"
  fi
else
  IS_FIRST_DEPLOYMENT=1
  log_info "First deployment: No state file"
fi

# Check if already deployed
if [ "$IS_FIRST_DEPLOYMENT" -eq 0 ] && [ "$LAST_COMMIT" = "$CURRENT_COMMIT" ]; then
  log_success "No changes detected - already at $CURRENT_SHORT"
  exit 0
fi

echo ""

# =============================================================================
# Detect Changed Files
# =============================================================================

log_info "Analyzing changed files..."

CHANGED_FILES=""

if [ "$IS_FIRST_DEPLOYMENT" -eq 1 ]; then
  log_info "First deployment - will build all services"
  CHANGED_FILES="FIRST_DEPLOYMENT"
else
  # Check if last commit exists in git history
  if ! git cat-file -e "$LAST_COMMIT" 2>/dev/null; then
    log_warning "Last commit $LAST_SHORT not in history (git gc or cleanup)"
    log_warning "Will rebuild all services for safety"
    CHANGED_FILES="REBUILD_ALL"
  else
    CHANGED_FILES=$(git diff --name-only "$LAST_COMMIT" "$CURRENT_COMMIT" 2>/dev/null || echo "ERROR")
    
    if [ "$CHANGED_FILES" = "ERROR" ] || [ -z "$CHANGED_FILES" ]; then
      log_warning "Could not detect changes"
      log_warning "Will rebuild all services for safety"
      CHANGED_FILES="REBUILD_ALL"
    fi
  fi
fi

# =============================================================================
# Determine Services to Build
# =============================================================================

SERVICES_TO_BUILD=""
SERVICES_TO_RESTART=""

if [ "$CHANGED_FILES" = "FIRST_DEPLOYMENT" ] || [ "$CHANGED_FILES" = "REBUILD_ALL" ]; then
  # Build all services
  log_warning "Building all services"
  SERVICES_TO_BUILD=$(get_all_services "$SERVICE_MAP" | grep -v "nginx" || true)
  SERVICES_TO_RESTART="$SERVICES_TO_BUILD"
elif [ -z "$CHANGED_FILES" ]; then
  log_success "No file changes detected"
  exit 0
else
  # Show changed files
  FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
  log_info "Changed files: $FILE_COUNT"
  
  if [ "$FILE_COUNT" -le 10 ]; then
    echo "$CHANGED_FILES" | while read -r file; do
      log_info "  - $file"
    done
  fi
  
  echo ""
  
  # Use library function to detect affected services
  SERVICES_TO_BUILD=$(detect_affected_services "$CHANGED_FILES" "$SERVICE_MAP" "$CONFIG_DIR/deployment-config.json")
  SERVICES_TO_RESTART="$SERVICES_TO_BUILD"
  
  # Check for nginx config changes
  if echo "$CHANGED_FILES" | grep -q "^infra/hostinger/nginx/"; then
    if [ -z "$SERVICES_TO_BUILD" ]; then
      SERVICES_TO_RESTART="nginx"
      log_info "Nginx configuration changed - restart needed"
    fi
  fi
  
  # Check for env changes
  if echo "$CHANGED_FILES" | grep -q "^infra/hostinger/env/"; then
    if [ -z "$SERVICES_TO_BUILD" ]; then
      SERVICES_TO_RESTART=$(get_all_services "$SERVICE_MAP" | grep -v "nginx" || true)
      log_warning "Environment files changed - all services will restart"
    fi
  fi
fi

# Normalize service lists
SERVICES_TO_BUILD=$(normalize_services "$SERVICES_TO_BUILD")
SERVICES_TO_RESTART=$(normalize_services "$SERVICES_TO_RESTART")

# Count services
BUILD_COUNT=$(echo "$SERVICES_TO_BUILD" | wc -w | tr -d ' ')
RESTART_COUNT=$(echo "$SERVICES_TO_RESTART" | wc -w | tr -d ' ')

log_info "Services to build: $BUILD_COUNT"
if [ "$BUILD_COUNT" -gt 0 ]; then
  echo "$SERVICES_TO_BUILD" | tr ' ' '\n' | while read -r svc; do
    [ -n "$svc" ] && log_info "  - $svc"
  done
fi

log_info "Services to restart: $RESTART_COUNT"
if [ "$RESTART_COUNT" -gt 0 ]; then
  echo "$SERVICES_TO_RESTART" | tr ' ' '\n' | while read -r svc; do
    [ -n "$svc" ] && log_info "  - $svc"
  done
fi

echo ""

# =============================================================================
# Build Phase
# =============================================================================

if [ -n "$SERVICES_TO_BUILD" ] && [ "$BUILD_COUNT" -gt 0 ]; then
  log_header "Build Phase"
  
  # Check timeout before build
  check_timeout
  
  # Enable BuildKit
  enable_buildkit
  
  log_info "Building $BUILD_COUNT service(s)..."
  
  # Record start time
  BUILD_START=$(date +%s)
  
  # Build services
  if ! compose build --pull $SERVICES_TO_BUILD; then
    log_error "Build failed"
    log_error "Deployment aborted"
    exit 1
  fi
  
  # Calculate duration
  BUILD_END=$(date +%s)
  BUILD_DURATION=$((BUILD_END - BUILD_START))
  
  log_success "Build complete (${BUILD_DURATION}s)"
  
  # Check timeout after build
  check_timeout
else
  log_info "No services need rebuilding"
fi

echo ""

# =============================================================================
# Restart Phase
# =============================================================================

if [ -n "$SERVICES_TO_RESTART" ] && [ "$RESTART_COUNT" -gt 0 ]; then
  log_header "Restart Phase"
  
  log_info "Restarting $RESTART_COUNT service(s)..."
  
  # Record start time
  RESTART_START=$(date +%s)
  
  # Restart services
  if ! compose up -d --no-deps $SERVICES_TO_RESTART; then
    log_error "Restart failed"
    log_error "Some services may be in an inconsistent state"
    exit 1
  fi
  
  # Calculate duration
  RESTART_END=$(date +%s)
  RESTART_DURATION=$((RESTART_END - RESTART_START))
  
  log_success "Restart complete (${RESTART_DURATION}s)"
else
  log_info "No services need restarting"
fi

echo ""

# =============================================================================
# Health Checks
# =============================================================================

if [ -n "$SERVICES_TO_RESTART" ] && [ "$RESTART_COUNT" -gt 0 ]; then
  log_header "Health Checks"
  
  # Wait for services to become healthy
  if ! wait_for_services_health "$SERVICES_TO_RESTART" "$DEPLOY_HEALTH_TIMEOUT" "$DEPLOY_HEALTH_INTERVAL"; then
    log_warning "Some services did not become healthy"
    
    # Show unhealthy services
    log_info "Check logs with: docker compose logs <service-name>"
    
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
      log_error "Deployment aborted"
      exit 1
    fi
  fi
else
  log_info "No health checks needed"
fi

echo ""

# =============================================================================
# Smoke Tests
# =============================================================================

if [ -n "$SERVICES_TO_RESTART" ] && [ "$RESTART_COUNT" -gt 0 ]; then
  if ! run_smoke_tests "$SERVICES_TO_RESTART" "$SMOKE_TESTS"; then
    log_warning "Some smoke tests failed"
    
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
      log_error "Deployment aborted"
      log_info "To rollback: docker compose up -d (will use previous images)"
      exit 1
    fi
  fi
else
  log_info "No smoke tests needed"
fi

echo ""

# =============================================================================
# Save Deployment State
# =============================================================================

log_header "Finalization"

# Save deployment state
if ! save_deployment_state "$DEPLOYMENT_STATE" "$CURRENT_COMMIT" "$SERVICES_TO_BUILD" "$SERVICES_TO_RESTART" "$IS_FIRST_DEPLOYMENT"; then
  log_warning "Failed to save deployment state"
fi

# Save to history
DEPLOY_DATE=$(date +"%Y%m%d-%H%M%S")
cp "$DEPLOYMENT_STATE" "$HISTORY_DIR/${DEPLOY_DATE}.json" 2>/dev/null || true

# Rotate history
rotate_deployment_history "$HISTORY_DIR" "$DEPLOY_HISTORY_RETENTION"

# Cleanup Docker images
cleanup_docker_images 7

echo ""

# =============================================================================
# Deployment Summary
# =============================================================================

log_header "Deployment Complete!"

if [ "$IS_FIRST_DEPLOYMENT" -eq 0 ]; then
  log_info "Commit: $LAST_SHORT → $CURRENT_SHORT"
else
  log_info "Commit: $CURRENT_SHORT (first deployment)"
fi

log_info "Built: $BUILD_COUNT service(s)"
log_info "Restarted: $RESTART_COUNT service(s)"

if [ "$IS_FIRST_DEPLOYMENT" -eq 0 ] && [ "$HAS_JQ" -eq 1 ]; then
  ALL_SERVICES=$(get_all_services "$SERVICE_MAP" | wc -w | tr -d ' ')
  UNTOUCHED=$((ALL_SERVICES - RESTART_COUNT))
  log_info "Untouched: $UNTOUCHED service(s)"
fi

echo ""
log_info "Commands:"
log_info "  View logs: docker compose logs -f"
log_info "  Check status: docker compose ps"
log_info "  Deployment history: ls -lt $HISTORY_DIR"

echo ""
log_success "All done! 🎉"
