#!/usr/bin/env sh
# Deployment Rollback V3.0
# Docker image-based rollback (NOT git-based)
#
# This script rolls back to a previous deployment by:
# 1. Reading deployment history
# 2. Selecting rollback target
# 3. Tagging previous Docker images as :latest
# 4. Restarting affected services
# 5. Validating health and smoke tests
# 6. Updating deployment state

set -eu

# =============================================================================
# Initialization
# =============================================================================

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

# Source libraries
. "$SCRIPT_DIR/lib.sh"
. "$SCRIPT_DIR/lib-deployment.sh"

# Check required commands
require_command docker
require_command git

# Check for jq
if ! command -v jq >/dev/null 2>&1; then
  log_error "jq is required for rollback"
  log_error "Install with: apt-get install jq"
  exit 1
fi
export HAS_JQ=1

# Load configuration
if ! load_deployment_config "$CONFIG_DIR/deployment-config.json"; then
  log_error "Failed to load deployment configuration"
  exit 1
fi

# Configuration
SERVICE_MAP="$CONFIG_DIR/service-map.json"
SMOKE_TESTS="$CONFIG_DIR/smoke-tests.json"
DEPLOYMENT_STATE="$DEPLOY_STATE_DIR/deployment.json"
HISTORY_DIR="$DEPLOY_STATE_DIR/history"
LOCK_FILE="$DEPLOY_STATE_DIR/deploy.lock"

# Set up cleanup trap
cleanup() {
  release_lock "$LOCK_FILE"
}
trap cleanup EXIT

# =============================================================================
# Rollback Header
# =============================================================================

log_header "Deployment Rollback V3.0"

log_warning "This will rollback to a previous deployment"
log_warning "Current running services will be restarted with previous images"
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
# Read Current and Available Deployments
# =============================================================================

log_header "Deployment History"

# Check if current deployment exists
if [ ! -f "$DEPLOYMENT_STATE" ]; then
  log_error "No current deployment found"
  log_error "State file: $DEPLOYMENT_STATE"
  exit 1
fi

# Read current deployment
CURRENT_COMMIT=$(jq -r '.commit' "$DEPLOYMENT_STATE")
CURRENT_SHORT=$(jq -r '.commit_short' "$DEPLOYMENT_STATE")
CURRENT_TIMESTAMP=$(jq -r '.timestamp' "$DEPLOYMENT_STATE")

log_info "Current deployment: $CURRENT_SHORT"
log_info "Deployed at: $CURRENT_TIMESTAMP"
echo ""

# List available rollback targets
if [ ! -d "$HISTORY_DIR" ] || [ -z "$(ls -A "$HISTORY_DIR" 2>/dev/null)" ]; then
  log_error "No deployment history found"
  log_error "Cannot rollback without history"
  exit 1
fi

log_info "Available rollback targets:"
echo ""

# List last 10 deployments
ls -t "$HISTORY_DIR" | head -10 | nl -w2 -s') ' | while read -r line; do
  num=$(echo "$line" | awk '{print $1}')
  file=$(echo "$line" | awk '{print $2}')
  
  commit_short=$(jq -r '.commit_short' "$HISTORY_DIR/$file" 2>/dev/null || echo "unknown")
  timestamp=$(jq -r '.timestamp' "$HISTORY_DIR/$file" 2>/dev/null || echo "unknown")
  services=$(jq -r '.services_restarted' "$HISTORY_DIR/$file" 2>/dev/null || echo "unknown")
  
  if [ "$commit_short" = "$CURRENT_SHORT" ]; then
    echo "  $num) $commit_short @ $timestamp (CURRENT)"
  else
    echo "  $num) $commit_short @ $timestamp"
  fi
done

echo ""

# =============================================================================
# Select Rollback Target
# =============================================================================

log_info "Select rollback target (1-10, or 'q' to quit):"
read -r SELECTION

if [ "$SELECTION" = "q" ] || [ "$SELECTION" = "Q" ]; then
  log_info "Rollback cancelled"
  exit 0
fi

# Validate selection
if ! echo "$SELECTION" | grep -qE '^[0-9]+$'; then
  log_error "Invalid selection: $SELECTION"
  exit 1
fi

if [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt 10 ]; then
  log_error "Selection out of range: $SELECTION"
  exit 1
fi

# Get selected deployment file
SELECTED_FILE=$(ls -t "$HISTORY_DIR" | head -10 | sed -n "${SELECTION}p")

if [ -z "$SELECTED_FILE" ]; then
  log_error "Could not find deployment for selection: $SELECTION"
  exit 1
fi

SELECTED_PATH="$HISTORY_DIR/$SELECTED_FILE"

# Read selected deployment
ROLLBACK_COMMIT=$(jq -r '.commit' "$SELECTED_PATH")
ROLLBACK_SHORT=$(jq -r '.commit_short' "$SELECTED_PATH")
ROLLBACK_TIMESTAMP=$(jq -r '.timestamp' "$SELECTED_PATH")
ROLLBACK_SERVICES=$(jq -r '.services_restarted' "$SELECTED_PATH")

echo ""
log_header "Rollback Confirmation"

log_info "Target deployment:"
log_info "  Commit: $ROLLBACK_SHORT"
log_info "  Deployed at: $ROLLBACK_TIMESTAMP"
log_info "  Services: $ROLLBACK_SERVICES"
echo ""

# Check if rolling back to current
if [ "$ROLLBACK_COMMIT" = "$CURRENT_COMMIT" ]; then
  log_warning "Selected deployment is the current deployment"
  log_info "Nothing to rollback"
  exit 0
fi

log_warning "This will:"
log_warning "  1. Find Docker images from previous deployment"
log_warning "  2. Tag them as :latest"
log_warning "  3. Restart affected services"
log_warning "  4. Run health checks and smoke tests"
echo ""

read -p "Continue with rollback? (yes/no): " -r
echo ""

if [ "$REPLY" != "yes" ]; then
  log_info "Rollback cancelled"
  exit 0
fi

# =============================================================================
# Docker Image Rollback
# =============================================================================

log_header "Docker Image Rollback"

# Parse services to rollback
if [ -z "$ROLLBACK_SERVICES" ] || [ "$ROLLBACK_SERVICES" = "null" ]; then
  log_error "No services found in rollback target"
  exit 1
fi

log_info "Finding previous Docker images..."
echo ""

SERVICES_FOUND=0
SERVICES_MISSING=0

for service in $ROLLBACK_SERVICES; do
  # Get current image ID
  CURRENT_IMAGE=$(docker images "${service}:latest" -q 2>/dev/null | head -1)
  
  if [ -z "$CURRENT_IMAGE" ]; then
    log_warning "$service: No current image found"
    SERVICES_MISSING=$((SERVICES_MISSING + 1))
    continue
  fi
  
  # Get previous image ID (second in list)
  PREVIOUS_IMAGE=$(docker images "$service" -q 2>/dev/null | sed -n '2p')
  
  if [ -z "$PREVIOUS_IMAGE" ]; then
    log_error "$service: No previous image found"
    log_error "Cannot rollback this service"
    SERVICES_MISSING=$((SERVICES_MISSING + 1))
    continue
  fi
  
  log_info "$service:"
  log_info "  Current: $CURRENT_IMAGE"
  log_info "  Previous: $PREVIOUS_IMAGE"
  
  # Tag previous image as latest
  if docker tag "$PREVIOUS_IMAGE" "${service}:latest"; then
    log_success "$service: Tagged previous image as latest"
    SERVICES_FOUND=$((SERVICES_FOUND + 1))
  else
    log_error "$service: Failed to tag image"
    SERVICES_MISSING=$((SERVICES_MISSING + 1))
  fi
  
  echo ""
done

if [ $SERVICES_FOUND -eq 0 ]; then
  log_error "No services could be rolled back"
  log_error "All services are missing previous images"
  exit 1
fi

if [ $SERVICES_MISSING -gt 0 ]; then
  log_warning "$SERVICES_MISSING service(s) could not be rolled back"
  read -p "Continue with partial rollback? (yes/no): " -r
  echo ""
  
  if [ "$REPLY" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 1
  fi
fi

# =============================================================================
# Restart Services
# =============================================================================

log_header "Restart Services"

log_info "Restarting services with previous images..."

if ! compose up -d --no-deps $ROLLBACK_SERVICES; then
  log_error "Restart failed"
  log_error "Some services may be in an inconsistent state"
  exit 1
fi

log_success "Services restarted"
echo ""

# =============================================================================
# Health Checks
# =============================================================================

log_header "Health Checks"

if ! wait_for_services_health "$ROLLBACK_SERVICES" "$DEPLOY_HEALTH_TIMEOUT" "$DEPLOY_HEALTH_INTERVAL"; then
  log_error "Health checks failed after rollback"
  log_error "Services may not be healthy"
  
  read -p "Continue anyway? (yes/no): " -r
  echo ""
  
  if [ "$REPLY" != "yes" ]; then
    log_error "Rollback failed"
    exit 1
  fi
fi

echo ""

# =============================================================================
# Smoke Tests
# =============================================================================

if ! run_smoke_tests "$ROLLBACK_SERVICES" "$SMOKE_TESTS"; then
  log_warning "Some smoke tests failed after rollback"
  
  read -p "Accept rollback anyway? (yes/no): " -r
  echo ""
  
  if [ "$REPLY" != "yes" ]; then
    log_error "Rollback rejected"
    log_info "Services are still running previous images"
    log_info "Use deploy-production.sh to re-deploy current version"
    exit 1
  fi
fi

echo ""

# =============================================================================
# Update Deployment State
# =============================================================================

log_header "Update State"

# Copy rollback target as current state
cp "$SELECTED_PATH" "$DEPLOYMENT_STATE"

# Update timestamp to indicate rollback
ROLLBACK_NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

# Add rollback metadata
TEMP_STATE="${DEPLOYMENT_STATE}.tmp"
jq --arg rollback_time "$ROLLBACK_NOW" \
   --arg rollback_from "$CURRENT_SHORT" \
   '. + {rollback_time: $rollback_time, rollback_from: $rollback_from, is_rollback: true}' \
   "$DEPLOYMENT_STATE" > "$TEMP_STATE"
mv "$TEMP_STATE" "$DEPLOYMENT_STATE"

log_success "Deployment state updated"
log_info "Rolled back from $CURRENT_SHORT to $ROLLBACK_SHORT"

echo ""

# =============================================================================
# Rollback Complete
# =============================================================================

log_header "Rollback Complete!"

log_success "Successfully rolled back to deployment: $ROLLBACK_SHORT"
log_info "Previous deployment: $CURRENT_SHORT"
log_info "Services rolled back: $(echo "$ROLLBACK_SERVICES" | wc -w | tr -d ' ')"
echo ""

log_info "To verify:"
log_info "  docker compose ps"
log_info "  docker compose logs -f"
echo ""

log_info "To rollback again:"
log_info "  $SCRIPT_DIR/rollback-deployment.sh"
echo ""

log_info "To re-deploy current code:"
log_info "  $SCRIPT_DIR/deploy-production.sh"
echo ""

log_success "Rollback successful! 🎉"
