#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

print_context
require_command docker
require_command git
require_file "$ENV_FILE"
require_file "$COMPOSE_BASE"
require_file "$COMPOSE_PROD"

# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "🔍 Smart deployment: detecting changes..."
echo ""

# Get changed files since last deployment
# If this is first deployment, compare with HEAD~1
if [ -f ".last_deploy_commit" ]; then
  LAST_COMMIT=$(cat .last_deploy_commit)
  echo "📋 Comparing with last deployment: $LAST_COMMIT"
else
  LAST_COMMIT="HEAD~1"
  echo "📋 First deployment - comparing with: $LAST_COMMIT"
fi

CHANGED_FILES=$(git diff --name-only "$LAST_COMMIT" HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No changes detected. Nothing to deploy."
  exit 0
fi

echo "📝 Changed files:"
echo "$CHANGED_FILES" | head -20
echo ""

# Function to check if service needs rebuild
needs_rebuild() {
  service_name=$1
  shift
  patterns="$*"
  
  for pattern in $patterns; do
    if echo "$CHANGED_FILES" | grep -q "^$pattern"; then
      return 0  # true - needs rebuild
    fi
  done
  
  return 1  # false - no rebuild needed
}

# Detect which services need rebuilding
SERVICES_TO_BUILD=""
SERVICES_TO_RESTART=""

# Shared packages affect all services
SHARED_CHANGED=0
if needs_rebuild "shared" "packages/" "pnpm-lock.yaml" "package.json" "turbo.json"; then
  SHARED_CHANGED=1
  echo "⚠️  Shared packages changed - all services will be rebuilt"
  echo ""
fi

# Check each service
if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "api-server" "apps/api-server/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD api-server"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART api-server"
  echo "🔄 api-server: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "realtutorialhub-quiz" "apps/realtutorialhub-quiz/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD realtutorialhub-quiz"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART realtutorialhub-quiz"
  echo "🔄 realtutorialhub-quiz: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "realtutorialhub-admin" "apps/realtutorialhub-admin/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD realtutorialhub-admin"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART realtutorialhub-admin"
  echo "🔄 realtutorialhub-admin: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "realtutorialhub-web" "apps/realtutorialhub-web/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD realtutorialhub-web"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART realtutorialhub-web"
  echo "🔄 realtutorialhub-web: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "skillup-web" "apps/skillup-web/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillup-web"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillup-web"
  echo "🔄 skillup-web: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "skillup-admin" "apps/skillup-admin/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillup-admin"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillup-admin"
  echo "🔄 skillup-admin: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "faculty-app" "apps/faculty-app/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD faculty-app"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART faculty-app"
  echo "🔄 faculty-app: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "skillhubcore-admin" "apps/skillhubcore-admin/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillhubcore-admin"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillhubcore-admin"
  echo "🔄 skillhubcore-admin: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "skillhub-placement" "apps/skillhub-placement/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillhub-placement"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillhub-placement"
  echo "🔄 skillhub-placement: needs rebuild"
fi

if [ $SHARED_CHANGED -eq 1 ] || needs_rebuild "skillhubcore-service" "services/skillhubcore-service/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillhubcore-service"
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART skillhubcore-service"
  echo "🔄 skillhubcore-service: needs rebuild"
fi

# Check if Nginx config changed (restart only, no rebuild needed)
if needs_rebuild "nginx" "infra/hostinger/nginx/"; then
  SERVICES_TO_RESTART="$SERVICES_TO_RESTART nginx"
  echo "🔄 nginx: configuration changed, restart needed"
fi

# Check if env files changed (restart only)
if needs_rebuild "env" "infra/hostinger/env/"; then
  # Add all services to restart list if not already there
  for service in api-server realtutorialhub-quiz realtutorialhub-admin realtutorialhub-web skillup-web skillup-admin faculty-app skillhubcore-admin skillhub-placement skillhubcore-service; do
    if ! echo "$SERVICES_TO_RESTART" | grep -q "$service"; then
      SERVICES_TO_RESTART="$SERVICES_TO_RESTART $service"
    fi
  done
  echo "🔄 Environment files changed, all services will restart"
fi

echo ""

# Build changed services
if [ -n "$SERVICES_TO_BUILD" ]; then
  echo "🏗️  Building $(echo "$SERVICES_TO_BUILD" | wc -w) service(s)..."
  echo "   Services: $SERVICES_TO_BUILD"
  echo ""
  
  # Build with BuildKit caching
  compose build --pull $SERVICES_TO_BUILD
  
  echo ""
  echo "✅ Build complete"
else
  echo "✅ No services need rebuilding"
fi

echo ""

# Restart affected services
if [ -n "$SERVICES_TO_RESTART" ]; then
  echo "🔄 Restarting $(echo "$SERVICES_TO_RESTART" | wc -w) service(s)..."
  echo "   Services: $SERVICES_TO_RESTART"
  echo ""
  
  compose up -d --no-deps $SERVICES_TO_RESTART
  
  echo ""
  echo "✅ Services restarted"
else
  echo "✅ No services need restarting"
fi

# Save current commit for next deployment
git rev-parse HEAD > .last_deploy_commit
echo ""
echo "📝 Deployment marker saved"

echo ""
echo "🎉 Smart deployment complete!"
echo ""
echo "📊 Summary:"
echo "   Built: $(echo "$SERVICES_TO_BUILD" | wc -w) service(s)"
echo "   Restarted: $(echo "$SERVICES_TO_RESTART" | wc -w) service(s)"
echo "   Untouched: $((10 - $(echo "$SERVICES_TO_RESTART" | wc -w))) service(s)"
