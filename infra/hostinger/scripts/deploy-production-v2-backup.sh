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
  HAS_JQ=0
else
  HAS_JQ=1
fi

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

# =============================================================================
# Deployment Header
# =============================================================================

log_header "Production Deployment System V3.0"

log_info "Configuration loaded"
log_info "State directory: $DEPLOY_STATE_DIR"
log_info "Service map: $SERVICE_MAP"
log_info "Smoke tests: $SMOKE_TESTS"
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
      echo "${YELLOW}⚠️  Warning: Could not detect changes${NC}"
      echo "   Will rebuild all services for safety"
      CHANGED_FILES="REBUILD_ALL"
    fi
  fi
fi

# Handle special cases
if [ "$CHANGED_FILES" = "FIRST_DEPLOYMENT" ] || [ "$CHANGED_FILES" = "REBUILD_ALL" ]; then
  echo ""
  SERVICES_TO_BUILD="api-server realtutorialhub-quiz realtutorialhub-admin realtutorialhub-web skillup-web skillup-admin faculty-app skillhubcore-admin skillhub-placement skillhubcore-service"
  SERVICES_TO_RESTART="$SERVICES_TO_BUILD"
  SHARED_CHANGED=1
elif [ -z "$CHANGED_FILES" ]; then
  echo "✅ No file changes detected."
  exit 0
else
  echo "📝 Changed files:"
  FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
  if [ "$FILE_COUNT" -le 20 ]; then
    echo "$CHANGED_FILES"
  else
    echo "$CHANGED_FILES" | head -20
    echo "   ... and $((FILE_COUNT - 20)) more files"
  fi
  echo ""
fi

# Detect services to build (if not already set)
SERVICES_TO_BUILD=""
SERVICES_TO_RESTART=""
SHARED_CHANGED=0

if [ "$CHANGED_FILES" != "FIRST_DEPLOYMENT" ] && [ "$CHANGED_FILES" != "REBUILD_ALL" ]; then
  # Check for shared package changes (affects all services)
  if echo "$CHANGED_FILES" | grep -q "^packages/"; then
    SHARED_CHANGED=1
    echo "⚠️  Shared packages changed - all services will be rebuilt"
    SERVICES_TO_BUILD="api-server realtutorialhub-quiz realtutorialhub-admin realtutorialhub-web skillup-web skillup-admin faculty-app skillhubcore-admin skillhub-placement skillhubcore-service"
    SERVICES_TO_RESTART="$SERVICES_TO_BUILD"
  fi

  # Check for turbo.json or root package.json changes
  if echo "$CHANGED_FILES" | grep -qE "^(turbo\.json|package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml)$"; then
    SHARED_CHANGED=1
    echo "⚠️  Root configuration changed - all services will be rebuilt"
    SERVICES_TO_BUILD="api-server realtutorialhub-quiz realtutorialhub-admin realtutorialhub-web skillup-web skillup-admin faculty-app skillhubcore-admin skillhub-placement skillhubcore-service"
    SERVICES_TO_RESTART="$SERVICES_TO_BUILD"
  fi
fi

# If shared not changed, check individual services
if [ $SHARED_CHANGED -eq 0 ]; then
  # Check each service
  if echo "$CHANGED_FILES" | grep -q "^apps/api-server/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD api-server"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART api-server"
    echo "🔄 api-server: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^apps/realtutorialhub-quiz/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD realtutorialhub-quiz"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART realtutorialhub-quiz"
    echo "🔄 realtutorialhub-quiz: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^apps/realtutorialhub-admin/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD realtutorialhub-admin"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART realtutorialhub-admin"
    echo "🔄 realtutorialhub-admin: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^apps/realtutorialhub-web/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD realtutorialhub-web"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART realtutorialhub-web"
    echo "🔄 realtutorialhub-web: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^apps/skillup-web/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillup-web"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillup-web"
    echo "🔄 skillup-web: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^apps/skillup-admin/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillup-admin"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillup-admin"
    echo "🔄 skillup-admin: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^apps/faculty-app/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD faculty-app"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART faculty-app"
    echo "🔄 faculty-app: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^apps/skillhubcore-admin/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillhubcore-admin"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillhubcore-admin"
    echo "🔄 skillhubcore-admin: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^apps/skillhub-placement/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillhub-placement"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillhub-placement"
    echo "🔄 skillhub-placement: needs rebuild"
  fi

  if echo "$CHANGED_FILES" | grep -q "^services/skillhubcore-service/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillhubcore-service"
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillhubcore-service"
    echo "🔄 skillhubcore-service: needs rebuild"
  fi

  # Check if only nginx config changed (restart only, no rebuild)
  if echo "$CHANGED_FILES" | grep -q "^infra/hostinger/nginx/" && [ -z "$SERVICES_TO_BUILD" ]; then
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART nginx"
    echo "🔄 nginx: configuration changed, restart needed"
  fi

  # Check if env files changed (restart all)
  if echo "$CHANGED_FILES" | grep -q "^infra/hostinger/env/"; then
    if [ -z "$SERVICES_TO_BUILD" ]; then
      SERVICES_TO_RESTART="api-server realtutorialhub-quiz realtutorialhub-admin realtutorialhub-web skillup-web skillup-admin faculty-app skillhubcore-admin skillhub-placement skillhubcore-service"
    fi
    echo "🔄 Environment files changed, all services will restart"
  fi
fi

# Normalize service lists (remove duplicates and extra spaces)
SERVICES_TO_BUILD=$(echo "$SERVICES_TO_BUILD" | tr ' ' '\n' | sort -u | tr '\n' ' ' | sed 's/ *$//')
SERVICES_TO_RESTART=$(echo "$SERVICES_TO_RESTART" | tr ' ' '\n' | sort -u | tr '\n' ' ' | sed 's/ *$//')

echo ""

# Count services
BUILD_COUNT=$(echo "$SERVICES_TO_BUILD" | wc -w | tr -d ' ')
RESTART_COUNT=$(echo "$SERVICES_TO_RESTART" | wc -w | tr -d ' ')

# Build phase
if [ -n "$SERVICES_TO_BUILD" ] && [ "$BUILD_COUNT" -gt 0 ]; then
  echo "🏗️  Building $BUILD_COUNT service(s)..."
  echo "   Services: $SERVICES_TO_BUILD"
  echo ""
  
  # Build with BuildKit caching
  if ! compose build --pull $SERVICES_TO_BUILD; then
    echo ""
    echo "${RED}❌ Build failed${NC}"
    echo "   Deployment aborted"
    exit 1
  fi
  
  echo ""
  echo "${GREEN}✅ Build complete${NC}"
else
  echo "✅ No services need rebuilding"
fi

echo ""

# Restart phase with health checks
if [ -n "$SERVICES_TO_RESTART" ] && [ "$RESTART_COUNT" -gt 0 ]; then
  echo "🔄 Restarting $RESTART_COUNT service(s)..."
  echo "   Services: $SERVICES_TO_RESTART"
  echo ""
  
  # Restart services
  if ! compose up -d --no-deps $SERVICES_TO_RESTART; then
    echo ""
    echo "${RED}❌ Restart failed${NC}"
    echo "   Some services may be in an inconsistent state"
    exit 1
  fi
  
  echo ""
  echo "⏳ Waiting for services to become healthy..."
  
  # Wait for health checks (max 60 seconds)
  echo "⏳ Waiting for services to become healthy..."
  
  WAIT_TIME=0
  MAX_WAIT=60
  ALL_HEALTHY=0
  
  while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
    
    # Check health status using compose ps
    UNHEALTHY_SERVICES=""
    UNHEALTHY_COUNT=0
    
    for service in $SERVICES_TO_RESTART; do
      # Get container health from docker compose
      CONTAINER_STATE=$(compose ps --format json "$service" 2>/dev/null | grep -o '"Health":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
      
      if [ "$CONTAINER_STATE" != "healthy" ] && [ "$service" != "nginx" ]; then
        UNHEALTHY_SERVICES="$UNHEALTHY_SERVICES $service"
        UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
      fi
    done
    
    if [ $UNHEALTHY_COUNT -eq 0 ]; then
      ALL_HEALTHY=1
      break
    fi
    
    echo "   Still waiting... (${WAIT_TIME}s / ${MAX_WAIT}s, $UNHEALTHY_COUNT unhealthy:$UNHEALTHY_SERVICES)"
  done
  
  echo ""
  if [ $ALL_HEALTHY -eq 1 ]; then
    echo "${GREEN}✅ All services are healthy${NC}"
  else
    echo "${YELLOW}⚠️  Some services did not become healthy within ${MAX_WAIT}s${NC}"
    echo "   Unhealthy services:$UNHEALTHY_SERVICES"
    echo "   Check logs: docker compose logs $UNHEALTHY_SERVICES"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
      echo "${RED}❌ Deployment aborted${NC}"
      exit 1
    fi
  fi
  
  # Run smoke tests
  echo ""
  echo "🧪 Running smoke tests..."
  
  SMOKE_FAILED=0
  
  # Test API health endpoint
  if echo "$SERVICES_TO_RESTART" | grep -q "api-server"; then
    if docker exec quiz-platform-nginx-1 wget -qO- http://api-server:3000/api/health/live >/dev/null 2>&1; then
      echo "   ${GREEN}✓${NC} API server health check passed"
    else
      echo "   ${RED}✗${NC} API server health check failed"
      SMOKE_FAILED=1
    fi
  fi
  
  # Test RTH web
  if echo "$SERVICES_TO_RESTART" | grep -q "realtutorialhub-web"; then
    if docker exec quiz-platform-nginx-1 wget -qO- http://realtutorialhub-web:3003/ >/dev/null 2>&1; then
      echo "   ${GREEN}✓${NC} RTH web responds"
    else
      echo "   ${RED}✗${NC} RTH web not responding"
      SMOKE_FAILED=1
    fi
  fi
  
  # Test SkillUp web
  if echo "$SERVICES_TO_RESTART" | grep -q "skillup-web"; then
    if docker exec quiz-platform-nginx-1 wget -qO- http://skillup-web:3004/api/healthz >/dev/null 2>&1; then
      echo "   ${GREEN}✓${NC} SkillUp web health check passed"
    else
      echo "   ${RED}✗${NC} SkillUp web health check failed"
      SMOKE_FAILED=1
    fi
  fi
  
  if [ $SMOKE_FAILED -eq 1 ]; then
    echo ""
    echo "${YELLOW}⚠️  Some smoke tests failed${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
      echo "${RED}❌ Deployment aborted${NC}"
      echo "${BLUE}💡 To rollback: docker compose up -d (will use previous images)${NC}"
      exit 1
    fi
  fi
else
  echo "✅ No services need restarting"
fi

echo ""

# Save previous state as backup
if [ -f "$DEPLOYMENT_STATE" ]; then
  cp "$DEPLOYMENT_STATE" "$STATE_DIR/deployment.backup.json"
fi

# Save deployment state
DEPLOY_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
DEPLOY_DATE=$(date +"%Y%m%d-%H%M%S")

# Create detailed state file
if [ $HAS_JQ -eq 1 ]; then
  jq -n \
    --arg commit "$CURRENT_COMMIT" \
    --arg commit_short "$CURRENT_SHORT" \
    --arg timestamp "$DEPLOY_TIMESTAMP" \
    --arg services_built "$SERVICES_TO_BUILD" \
    --arg services_restarted "$SERVICES_TO_RESTART" \
    --argjson build_count "$BUILD_COUNT" \
    --argjson restart_count "$RESTART_COUNT" \
    --argjson first_deployment "$IS_FIRST_DEPLOYMENT" \
    '{
      commit: $commit,
      commit_short: $commit_short,
      timestamp: $timestamp,
      services_built: $services_built,
      services_restarted: $services_restarted,
      build_count: $build_count,
      restart_count: $restart_count,
      first_deployment: ($first_deployment == 1),
      version: "2.0"
    }' > "$DEPLOYMENT_STATE"
else
  # Fallback without jq
  cat > "$DEPLOYMENT_STATE" << EOF
{
  "commit": "$CURRENT_COMMIT",
  "commit_short": "$CURRENT_SHORT",
  "timestamp": "$DEPLOY_TIMESTAMP",
  "services_built": "$SERVICES_TO_BUILD",
  "services_restarted": "$SERVICES_TO_RESTART",
  "build_count": $BUILD_COUNT,
  "restart_count": $RESTART_COUNT,
  "first_deployment": $([ $IS_FIRST_DEPLOYMENT -eq 1 ] && echo "true" || echo "false"),
  "version": "2.0"
}
EOF
fi

# Save to history
cp "$DEPLOYMENT_STATE" "$HISTORY_DIR/${DEPLOY_DATE}.json"

echo "📝 Deployment state saved"
echo "   Current: $DEPLOYMENT_STATE"
echo "   History: $HISTORY_DIR/${DEPLOY_DATE}.json"
echo "   Backup: $STATE_DIR/deployment.backup.json"

# Cleanup old history (keep last 30 deployments)
HISTORY_COUNT=$(ls -1 "$HISTORY_DIR" | wc -l | tr -d ' ')
if [ "$HISTORY_COUNT" -gt 30 ]; then
  echo ""
  echo "🧹 Cleaning up old deployment history..."
  cd "$HISTORY_DIR"
  ls -t | tail -n +31 | xargs rm -f
  cd - >/dev/null
  echo "   Kept last 30 deployments"
fi

echo ""
echo "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "📊 Summary:"
if [ $IS_FIRST_DEPLOYMENT -eq 0 ]; then
  echo "   Commit: $LAST_SHORT → $CURRENT_SHORT"
else
  echo "   Commit: $CURRENT_SHORT (first deployment)"
fi
echo "   Built: $BUILD_COUNT service(s)"
echo "   Restarted: $RESTART_COUNT service(s)"
if [ $IS_FIRST_DEPLOYMENT -eq 0 ]; then
  echo "   Untouched: $((10 - RESTART_COUNT)) service(s)"
fi
echo ""
echo "💡 Commands:"
echo "   View logs: docker compose logs -f"
echo "   Check status: docker compose ps"
echo "   Deployment history: ls -lt $HISTORY_DIR"
