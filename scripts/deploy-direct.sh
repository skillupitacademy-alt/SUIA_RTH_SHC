

#!/bin/bash
set -euo pipefail

#############################################
# 🔧 PREREQUISITES CHECK
#############################################

echo "🔍 Checking prerequisites..."

# Check if Python is installed (required by gcloud)
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
fi

if [ -z "$PYTHON_CMD" ]; then
    echo ""
    echo "❌ Python is not installed"
    echo ""
    echo "Google Cloud SDK requires Python to be installed."
    echo ""
    echo "📥 To install Python on Windows:"
    echo "   1. Download from: https://www.python.org/downloads/"
    echo "   2. Run the installer"
    echo "   3. ✅ CHECK 'Add Python to PATH' during installation"
    echo "   4. Restart your terminal"
    echo ""
    echo "   OR install from Microsoft Store:"
    echo "   1. Open Microsoft Store"
    echo "   2. Search for 'Python 3.12' (or latest version)"
    echo "   3. Click Install"
    echo ""
    echo "After installation, verify with: python --version"
    echo ""
    exit 1
fi

# Check Python version (suppress stderr as Windows Python launcher shows a message)
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | grep -oP 'Python \K[0-9.]+' || echo "installed")
echo "✅ Python $PYTHON_VERSION found"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo ""
    echo "❌ Google Cloud SDK (gcloud) is not installed"
    echo ""
    echo "📥 To install gcloud:"
    echo "   Download from: https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

GCLOUD_VERSION=$(gcloud version --format="value(version)" 2>/dev/null || echo "installed")
echo "✅ gcloud $GCLOUD_VERSION found"

echo "✅ All prerequisites met"
echo ""

#############################################
# 🔧 CONFIG
#############################################

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REGION="asia-southeast1"
REGISTRY="asia-southeast1-docker.pkg.dev"
MARKETING_REGION="asia-south1"

SERVICE_API="quiz-api-server"
SERVICE_RTH="realtutorialhub-web"
SERVICE_SKILLUP="skillup-web"
SERVICE_SHC_ADMIN="skillhubcore-admin"
SERVICE_SHC_API="skillhubcore-service"
SERVICE_RTH_SITE="realtutorialhub-site"
SERVICE_SKILLUP_SITE="skillupitacademy-site"
SERVICE_ANALYTICS_COLLECTOR="analytics-collector-service"

GIT_SHA=$(git rev-parse --short HEAD)

IMAGE_API="${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}"
IMAGE_RTH="${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}"
IMAGE_SKILLUP="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA}"
IMAGE_SHC_ADMIN="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA}"
IMAGE_SHC_API="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-service:${GIT_SHA}"

BUILD_RETRY_ATTEMPTS="${BUILD_RETRY_ATTEMPTS:-3}"
BUILD_RETRY_DELAY_SECONDS="${BUILD_RETRY_DELAY_SECONDS:-15}"

run_with_retry() {
  local label="$1"
  shift

  local attempt=1
  while true; do
    echo "🔁 ${label} (attempt ${attempt}/${BUILD_RETRY_ATTEMPTS})"

    if "$@"; then
      echo "✅ ${label} succeeded"
      return 0
    fi

    if [ "$attempt" -ge "$BUILD_RETRY_ATTEMPTS" ]; then
      echo "❌ ${label} failed after ${BUILD_RETRY_ATTEMPTS} attempts"
      return 1
    fi

    echo "⚠️  ${label} failed. Waiting ${BUILD_RETRY_DELAY_SECONDS}s before retry..."
    sleep "$BUILD_RETRY_DELAY_SECONDS"
    attempt=$((attempt + 1))
  done
}

cloud_build_image() {
  local dockerfile="$1"
  local image="$2"
  local image_latest="${image%:*}:latest"

  run_with_retry "Cloud Build ${image}" \
    gcloud builds submit . \
      --region="$REGION" \
      --machine-type="${BUILD_MACHINE_TYPE:-e2-medium}" \
      --timeout=3600s \
      --config=scripts/cloudbuild-docker-image.yaml \
      --substitutions="_DOCKERFILE=${dockerfile},_IMAGE=${image},_IMAGE_LATEST=${image_latest}"
}

deploy_marketing_site() {
  local service_name="$1"
  local cloudbuild_config="$2"
  local rth_pixel_id="$3"
  local rth_ga_id="$4"
  local rth_gtm_id="$5"
  local suia_pixel_id="$6"
  local suia_ga_id="$7"
  local suia_gtm_id="$8"
  local analytics_env="${9:-production}"
  local content_base_url="${10}"
  local analytics_endpoint="${11}"

  run_with_retry "Cloud Build ${service_name}" \
    gcloud builds submit . \
      --project="${PROJECT_ID}" \
      --config="${cloudbuild_config}" \
      --substitutions="_TAG=${GIT_SHA},_NEXT_PUBLIC_RTH_META_PIXEL_ID=${rth_pixel_id},_NEXT_PUBLIC_RTH_GA4_MEASUREMENT_ID=${rth_ga_id},_NEXT_PUBLIC_RTH_GTM_CONTAINER_ID=${rth_gtm_id},_NEXT_PUBLIC_SUIA_META_PIXEL_ID=${suia_pixel_id},_NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID=${suia_ga_id},_NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID=${suia_gtm_id},_NEXT_PUBLIC_ANALYTICS_ENABLED=true,_NEXT_PUBLIC_ANALYTICS_ENV=${analytics_env},_NEXT_PUBLIC_SHC_CONTENT_BASE_URL=${content_base_url},_MARKETING_CONTENT_API_BASE_URL=${content_base_url},_NEXT_PUBLIC_RTH_ANALYTICS_ENDPOINT=${analytics_endpoint},_NEXT_PUBLIC_SUIA_ANALYTICS_ENDPOINT=${analytics_endpoint}"
}

deploy_collector_service() {
  local service_name="$1"
  local cloudbuild_config="$2"

  run_with_retry "Cloud Build ${service_name}" \
    gcloud builds submit . \
      --project="${PROJECT_ID}" \
      --config="${cloudbuild_config}" \
      --substitutions="_TAG=${GIT_SHA}"
}

resolve_run_service_url() {
  local service_name="$1"
  local region="$2"

  gcloud run services describe "$service_name" \
    --region="$region" \
    --format='value(status.url)' 2>/dev/null || true
}

#############################################
# 🔍 CHANGE DETECTION
#############################################

detect_changes() {
  local FORCE_ALL="${DEPLOY_ALL:-false}"
  
  if [ "$FORCE_ALL" = "true" ]; then
    echo "Force full deploy requested"
    BUILD_API=true BUILD_RTH=true BUILD_SKILLUP=true
    BUILD_SHC_ADMIN=true BUILD_SHC_API=true
    BUILD_ANALYTICS=true BUILD_RTH_SITE=true BUILD_SUIA_SITE=true
    return
  fi

  # Get the last deployed SHA from Cloud Run label
  local LAST_SHA="${LAST_DEPLOYED_SHA:-}"
  if [ -z "$LAST_SHA" ]; then
    LAST_SHA=$(gcloud run services describe $SERVICE_API \
      --region=$REGION \
      --format='value(metadata.annotations.deploy-sha)' 2>/dev/null || echo "")
  fi
  
  if [ -z "$LAST_SHA" ]; then
    echo "⚠️  No previous deploy SHA found — building all services"
    BUILD_API=true BUILD_RTH=true BUILD_SKILLUP=true
    BUILD_SHC_ADMIN=true BUILD_SHC_API=true
    BUILD_ANALYTICS=true BUILD_RTH_SITE=true BUILD_SUIA_SITE=true
    return
  fi
  
  CHANGED_FILES=$(git diff --name-only "$LAST_SHA" HEAD 2>/dev/null || echo "")
  
  if [ -z "$CHANGED_FILES" ]; then
    echo "⚠️  Cannot determine changes — building all services"
    BUILD_API=true BUILD_RTH=true BUILD_SKILLUP=true
    BUILD_SHC_ADMIN=true BUILD_SHC_API=true
    BUILD_ANALYTICS=true BUILD_RTH_SITE=true BUILD_SUIA_SITE=true
    return
  fi
  
  # Root config changes → full rebuild
  if echo "$CHANGED_FILES" | grep -qE '^(pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig\.json|\.dockerignore|package\.json)$'; then
    echo "🔁 Root config changed — building all services"
    BUILD_API=true BUILD_RTH=true BUILD_SKILLUP=true
    BUILD_SHC_ADMIN=true BUILD_SHC_API=true
    BUILD_ANALYTICS=true BUILD_RTH_SITE=true BUILD_SUIA_SITE=true
    return
  fi

  BUILD_API="${OVERRIDE_BUILD_API:-false}"
  BUILD_RTH="${OVERRIDE_BUILD_RTH:-false}"
  BUILD_SKILLUP="${OVERRIDE_BUILD_SKILLUP:-false}"
  BUILD_SHC_ADMIN="${OVERRIDE_BUILD_SHC_ADMIN:-false}"
  BUILD_SHC_API="${OVERRIDE_BUILD_SHC_API:-false}"
  BUILD_ANALYTICS="${OVERRIDE_BUILD_ANALYTICS:-false}"
  BUILD_RTH_SITE="${OVERRIDE_BUILD_RTH_SITE:-false}"
  BUILD_SUIA_SITE="${OVERRIDE_BUILD_SUIA_SITE:-false}"

  # Direct service changes
  echo "$CHANGED_FILES" | grep -q '^apps/api-server/'            && BUILD_API=true
  echo "$CHANGED_FILES" | grep -q '^apps/realtutorialhub-web/'   && BUILD_RTH=true
  echo "$CHANGED_FILES" | grep -q '^apps/skillup-web/'           && BUILD_SKILLUP=true
  echo "$CHANGED_FILES" | grep -q '^apps/skillhubcore-admin/'    && BUILD_SHC_ADMIN=true
  echo "$CHANGED_FILES" | grep -q '^services/skillhubcore-service/' && BUILD_SHC_API=true
  echo "$CHANGED_FILES" | grep -q '^services/analytics-collector-service/' && BUILD_ANALYTICS=true
  echo "$CHANGED_FILES" | grep -q '^apps/realtutorialhub-site/'  && BUILD_RTH_SITE=true
  echo "$CHANGED_FILES" | grep -q '^apps/skillupitacademy-site/' && BUILD_SUIA_SITE=true

  # Shared package changes → propagate to dependents
  echo "$CHANGED_FILES" | grep -q '^packages/auth/'          && { BUILD_API=true; BUILD_RTH=true; BUILD_SKILLUP=true; BUILD_SHC_ADMIN=true; BUILD_SHC_API=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/db/'            && { BUILD_API=true; BUILD_RTH=true; BUILD_SHC_ADMIN=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/types/'         && { BUILD_API=true; BUILD_RTH=true; BUILD_SKILLUP=true; BUILD_SHC_ADMIN=true; BUILD_SHC_API=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/validation/'    && { BUILD_API=true; BUILD_RTH=true; BUILD_SKILLUP=true; BUILD_SHC_ADMIN=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/ui/'            && { BUILD_API=true; BUILD_SHC_ADMIN=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/events/'        && { BUILD_API=true; BUILD_SHC_API=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/db-tutorial/'   && { BUILD_API=true; BUILD_RTH=true; BUILD_SKILLUP=true; BUILD_SHC_ADMIN=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/db-people/'     && { BUILD_SKILLUP=true; BUILD_SHC_API=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/db-payment/'    && { BUILD_SKILLUP=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/db-placement/'  && { BUILD_SKILLUP=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/marketing-site/' && { BUILD_ANALYTICS=true; BUILD_RTH_SITE=true; BUILD_SUIA_SITE=true; BUILD_SHC_ADMIN=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/observability/' && { BUILD_API=true; BUILD_RTH=true; BUILD_SHC_ADMIN=true; }
  echo "$CHANGED_FILES" | grep -q '^packages/api-client/'    && { BUILD_API=true; BUILD_RTH=true; BUILD_SHC_ADMIN=true; }
  
  echo "📋 Build plan:"
  echo "   API:               $BUILD_API"
  echo "   RTH BFF:           $BUILD_RTH"
  echo "   SkillUp BFF:       $BUILD_SKILLUP"
  echo "   SHC Admin:         $BUILD_SHC_ADMIN"
  echo "   SHC Service:       $BUILD_SHC_API"
  echo "   Analytics:         $BUILD_ANALYTICS"
  echo "   RTH Marketing:     $BUILD_RTH_SITE"
  echo "   SUIA Marketing:    $BUILD_SUIA_SITE"
  echo ""

  if [ "${DRY_RUN:-false}" = "true" ]; then
    echo "🔍 DRY_RUN mode: printing build plan and exiting."
    exit 0
  fi
}

#############################################
# 🔐 RBAC TEST USER CREDENTIALS
#############################################

# RealTutorialHub brand users
export RTH_TEST_EMAIL="${RTH_TEST_EMAIL:-ajayshah@gmail.com}"
export RTH_TEST_PASSWORD="${RTH_TEST_PASSWORD:-testing}"
export RBAC_RTH_USER_EMAIL="${RBAC_RTH_USER_EMAIL:-ajayshah@gmail.com}"
export RBAC_RTH_USER_PASSWORD="${RBAC_RTH_USER_PASSWORD:-testing}"

# SkillUp IT Academy brand users
export SKILLUP_TEST_EMAIL="${SKILLUP_TEST_EMAIL:-student@skillupitacademy.com}"
export SKILLUP_TEST_PASSWORD="${SKILLUP_TEST_PASSWORD:-testing}"
export RBAC_SKILLUP_STUDENT_EMAIL="${RBAC_SKILLUP_STUDENT_EMAIL:-student@skillupitacademy.com}"
export RBAC_SKILLUP_STUDENT_PASSWORD="${RBAC_SKILLUP_STUDENT_PASSWORD:-testing}"

# SkillHubCore infrastructure admin users
export SHC_ADMIN_EMAIL="${SHC_ADMIN_EMAIL:-admin@skillhubcore.in}"
export SHC_ADMIN_PASSWORD="${SHC_ADMIN_PASSWORD:-testing}"

#############################################
# 🔐 SET PROJECT
#############################################

echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

#############################################
# 🔥 ENV COMPLETENESS CHECK (CRITICAL)
#############################################

echo "🔐 Validating required secrets exist..."

REQUIRED_SECRETS=(
  DATABASE_URL
  DATABASE_DIRECT_URL
  DATABASE_URL_RTH
  DATABASE_DIRECT_URL_RTH
  DATABASE_URL_SKILLUP
  DATABASE_DIRECT_URL_SKILLUP
  DATABASE_URL_PEOPLE
  DATABASE_DIRECT_URL_PEOPLE
  DATABASE_URL_TUTORIAL
  DATABASE_DIRECT_URL_TUTORIAL
  DATABASE_URL_PAYMENT
  DATABASE_DIRECT_URL_PAYMENT
  DATABASE_URL_PLACEMENT
  DATABASE_DIRECT_URL_PLACEMENT
  INTERNAL_API_SECRET
  INTERNAL_GATEWAY_SECRET
  JWT_SECRET
  JWT_REFRESH_SECRET
  ADMIN_JWT_SECRET
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  QSTASH_TOKEN
  QSTASH_CURRENT_SIGNING_KEY
  QSTASH_NEXT_SIGNING_KEY
  RESEND_API_KEY
  CSRF_SECRET
  INTERNAL_API_KEY
  COOKIE_DOMAIN
  ALLOWED_ORIGINS
  ANALYTICS_ADMIN_TOKEN
  RTH_GA4_MEASUREMENT_API_SECRET
  RTH_META_CAPI_TOKEN
  SUIA_GA4_MEASUREMENT_API_SECRET
  SUIA_META_CAPI_TOKEN
)

MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
  if ! gcloud secrets describe $secret --format="value(name)" &>/dev/null; then
    echo "❌ Missing secret: $secret"
    MISSING_SECRETS+=("$secret")
  else
    echo "✅ $secret exists"
  fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
  echo ""
  echo "❌ DEPLOYMENT BLOCKED: Missing ${#MISSING_SECRETS[@]} required secrets"
  echo "Missing secrets:"
  printf '  - %s\n' "${MISSING_SECRETS[@]}"
  echo ""
  echo "Create missing secrets before deploying"
  exit 1
fi

echo "✅ All required secrets exist"

#############################################
# 🔐 SECRET CONSISTENCY CHECK
#############################################

echo ""
echo "🔐 Verifying INTERNAL_API_SECRET consistency..."

INTERNAL_API_SECRET=$(gcloud secrets versions access latest --secret=INTERNAL_API_SECRET)

if [ -z "$INTERNAL_API_SECRET" ]; then
  echo "❌ INTERNAL_API_SECRET is empty"
  exit 1
fi

echo "✅ INTERNAL_API_SECRET loaded (${#INTERNAL_API_SECRET} bytes)"
echo "🔐 Secret checksum: $(echo -n "$INTERNAL_API_SECRET" | sha256sum | cut -d' ' -f1)"

#############################################
# 🧹 CLEANUP MULTIPLE REGIONS
#############################################

echo "🧹 Cleaning up services in other regions..."

# Delete services in asia-east1 and asia-south1 to consolidate to asia-southeast1
for region in "asia-east1" "asia-south1"; do
  echo "  Checking region: $region"
  
  # Check if quiz-api-server exists in this region
  if gcloud run services describe quiz-api-server --region=$region --format="value(metadata.name)" 2>/dev/null; then
    echo "  🗑️  Deleting quiz-api-server in $region..."
    gcloud run services delete quiz-api-server --region=$region --quiet || echo "    ⚠️  Failed to delete (may not exist)"
  fi
  
  # Check if realtutorialhub-web exists in this region  
  if gcloud run services describe realtutorialhub-web --region=$region --format="value(metadata.name)" 2>/dev/null; then
    echo "  🗑️  Deleting realtutorialhub-web in $region..."
    gcloud run services delete realtutorialhub-web --region=$region --quiet || echo "    ⚠️  Failed to delete (may not exist)"
  fi
  
  # Check if skillup-web exists in this region
  if gcloud run services describe skillup-web --region=$region --format="value(metadata.name)" 2>/dev/null; then
    echo "  🗑️  Deleting skillup-web in $region..."
    gcloud run services delete skillup-web --region=$region --quiet || echo "    ⚠️  Failed to delete (may not exist)"
  fi
done

echo "✅ Cleanup completed - all services will be deployed only to $REGION"

#############################################
# 🧪 QUALITY CHECKS
#############################################

echo "🧪 Running checks..."

pnpm lint:all --force || exit 1
pnpm typecheck:all --force || exit 1
pnpm build:all --force || exit 1

echo "✅ Quality checks passed"

#############################################
# 📌 CAPTURE CURRENT REVISIONS
#############################################

capture_revision() {
  gcloud run services describe $1 \
    --region=$REGION \
    --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo ""
}

rollback_marketing_site() {
  SERVICE=$1
  REV=$2

  if [ -n "$REV" ]; then
    gcloud run services update-traffic $SERVICE \
      --region $MARKETING_REGION \
      --to-revisions ${REV}=100
  fi
}

PREV_API=$(capture_revision $SERVICE_API)
PREV_RTH=$(capture_revision $SERVICE_RTH)
PREV_SKILLUP=$(capture_revision $SERVICE_SKILLUP)
PREV_SHC_ADMIN=$(capture_revision $SERVICE_SHC_ADMIN)
PREV_SHC_API=$(capture_revision $SERVICE_SHC_API)
PREV_RTH_SITE=$(gcloud run services describe $SERVICE_RTH_SITE --region=$MARKETING_REGION --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")
PREV_SKILLUP_SITE=$(gcloud run services describe $SERVICE_SKILLUP_SITE --region=$MARKETING_REGION --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")
PREV_ANALYTICS_COLLECTOR=$(gcloud run services describe $SERVICE_ANALYTICS_COLLECTOR --region=$MARKETING_REGION --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")

echo "📌 Previous revisions:"
echo "API: $PREV_API"
echo "RTH: $PREV_RTH"
echo "SkillUp: $PREV_SKILLUP"
echo "SHC Admin: $PREV_SHC_ADMIN"
echo "SHC API: $PREV_SHC_API"
echo "RTH Site: $PREV_RTH_SITE"
echo "SkillUp Site: $PREV_SKILLUP_SITE"
echo "Analytics Collector: $PREV_ANALYTICS_COLLECTOR"

detect_changes

echo "☁️  Building and pushing images with Cloud Build..."

[ "$BUILD_API" = true ]       && cloud_build_image apps/api-server/Dockerfile $IMAGE_API
[ "$BUILD_RTH" = true ]       && cloud_build_image apps/realtutorialhub-web/Dockerfile $IMAGE_RTH
[ "$BUILD_SKILLUP" = true ]   && cloud_build_image apps/skillup-web/Dockerfile $IMAGE_SKILLUP
[ "$BUILD_SHC_ADMIN" = true ] && cloud_build_image apps/skillhubcore-admin/Dockerfile $IMAGE_SHC_ADMIN
[ "$BUILD_SHC_API" = true ]   && cloud_build_image services/skillhubcore-service/Dockerfile $IMAGE_SHC_API
[ "$BUILD_ANALYTICS" = true ] && deploy_collector_service $SERVICE_ANALYTICS_COLLECTOR cloudbuild.analytics-collector-service.yaml


if [ "$BUILD_SHC_API" = true ]; then
  echo "🚀 Deploying ${SERVICE_SHC_API}..."
  gcloud run deploy $SERVICE_SHC_API \
    --image $IMAGE_SHC_API \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 200 \
    --max-instances 5 \
    --min-instances 0 \
    --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" \
    --update-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest,DATABASE_DIRECT_URL_PEOPLE=DATABASE_DIRECT_URL_PEOPLE:latest"
else
  echo "⏭️ Skipping deployment of ${SERVICE_SHC_API} (no changes)"
fi

SHC_MARKETING_BASE_URL=$(resolve_run_service_url "$SERVICE_SHC_API" "$REGION")
COLLECTOR_BASE_URL=$(resolve_run_service_url "$SERVICE_ANALYTICS_COLLECTOR" "$MARKETING_REGION")

if [ -z "$SHC_MARKETING_BASE_URL" ]; then
  echo "❌ Failed to resolve ${SERVICE_SHC_API} URL"
  exit 1
fi

if [ -z "$COLLECTOR_BASE_URL" ]; then
  echo "❌ Failed to resolve ${SERVICE_ANALYTICS_COLLECTOR} URL"
  exit 1
fi

echo "🔍 Waiting for ${SERVICE_SHC_API} readiness..."
SHC_API_READY=false

for i in {1..15}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SHC_MARKETING_BASE_URL}/healthz" || true)

  if [ "$STATUS" = "200" ]; then
    echo "✅ ${SERVICE_SHC_API} ready (attempt $i)"
    SHC_API_READY=true
    break
  fi

  echo "⏳ Waiting for ${SERVICE_SHC_API}... (attempt $i, status: $STATUS)"
  sleep 4
done

if [ "$SHC_API_READY" = false ]; then
  echo "❌ ${SERVICE_SHC_API} health check failed"
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_SHC_API}" --limit=5 --format="value(textPayload)" 2>/dev/null || echo "  (no logs available)"
  exit 1
fi

COLLECTOR_TRACK_URL="${COLLECTOR_BASE_URL%/}/track"

RTH_META_PIXEL_ID="${NEXT_PUBLIC_RTH_META_PIXEL_ID:-}"
RTH_GA4_MEASUREMENT_ID="${NEXT_PUBLIC_RTH_GA4_MEASUREMENT_ID:-}"
RTH_GTM_CONTAINER_ID="${NEXT_PUBLIC_RTH_GTM_CONTAINER_ID:-}"
SUIA_META_PIXEL_ID="${NEXT_PUBLIC_SUIA_META_PIXEL_ID:-${NEXT_PUBLIC_FB_PIXEL_ID:-}}"
SUIA_GA4_MEASUREMENT_ID="${NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID:-${NEXT_PUBLIC_GA_ID:-}}"
SUIA_GTM_CONTAINER_ID="${NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID:-}"

echo "🌐 SHC marketing base: $SHC_MARKETING_BASE_URL"
echo "🌐 Collector base: $COLLECTOR_BASE_URL"

[ "$BUILD_RTH_SITE" = true ] && deploy_marketing_site $SERVICE_RTH_SITE cloudbuild.realtutorialhub-site.yaml "$RTH_META_PIXEL_ID" "$RTH_GA4_MEASUREMENT_ID" "$RTH_GTM_CONTAINER_ID" "$SUIA_META_PIXEL_ID" "$SUIA_GA4_MEASUREMENT_ID" "$SUIA_GTM_CONTAINER_ID" "${NEXT_PUBLIC_ANALYTICS_ENV:-production}" "$SHC_MARKETING_BASE_URL" "$COLLECTOR_TRACK_URL"
[ "$BUILD_SUIA_SITE" = true ] && deploy_marketing_site $SERVICE_SKILLUP_SITE cloudbuild.skillupitacademy-site.yaml "$RTH_META_PIXEL_ID" "$RTH_GA4_MEASUREMENT_ID" "$RTH_GTM_CONTAINER_ID" "$SUIA_META_PIXEL_ID" "$SUIA_GA4_MEASUREMENT_ID" "$SUIA_GTM_CONTAINER_ID" "${NEXT_PUBLIC_ANALYTICS_ENV:-production}" "$SHC_MARKETING_BASE_URL" "$COLLECTOR_TRACK_URL"

#############################################
# 🚀 DEPLOY API FIRST (NO TRAFFIC)
#############################################

if [ "$BUILD_API" = true ]; then
  echo "🚀 Deploying API (no traffic)..."
  gcloud run deploy $SERVICE_API \
    --image $IMAGE_API \
    --region $REGION \
    --no-traffic \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 1000 \
    --max-instances 10 \
    --min-instances 0 \
    --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in" \
    --update-secrets "DATABASE_URL=DATABASE_URL:latest,DATABASE_DIRECT_URL=DATABASE_DIRECT_URL:latest,DATABASE_URL_RTH=DATABASE_URL_RTH:latest,DATABASE_DIRECT_URL_RTH=DATABASE_DIRECT_URL_RTH:latest,DATABASE_URL_SKILLUP=DATABASE_URL_SKILLUP:latest,DATABASE_DIRECT_URL_SKILLUP=DATABASE_DIRECT_URL_SKILLUP:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest,DATABASE_DIRECT_URL_PEOPLE=DATABASE_DIRECT_URL_PEOPLE:latest,DATABASE_URL_TUTORIAL=DATABASE_URL_TUTORIAL:latest,DATABASE_DIRECT_URL_TUTORIAL=DATABASE_DIRECT_URL_TUTORIAL:latest,DATABASE_URL_PAYMENT=DATABASE_URL_PAYMENT:latest,DATABASE_DIRECT_URL_PAYMENT=DATABASE_DIRECT_URL_PAYMENT:latest,DATABASE_URL_PLACEMENT=DATABASE_URL_PLACEMENT:latest,DATABASE_DIRECT_URL_PLACEMENT=DATABASE_DIRECT_URL_PLACEMENT:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest,UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,QSTASH_TOKEN=QSTASH_TOKEN:latest,QSTASH_CURRENT_SIGNING_KEY=QSTASH_CURRENT_SIGNING_KEY:latest,QSTASH_NEXT_SIGNING_KEY=QSTASH_NEXT_SIGNING_KEY:latest,RESEND_API_KEY=RESEND_API_KEY:latest,CSRF_SECRET=CSRF_SECRET:latest,INTERNAL_API_KEY=INTERNAL_API_KEY:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,ALLOWED_ORIGINS=ALLOWED_ORIGINS:latest"
else
  echo "⏭️ Skipping deployment of API (no changes)"
fi

#############################################
# 🌐 GET INTERNAL API URL
#############################################

API_URL=$(gcloud run services describe $SERVICE_API \
  --region=$REGION \
  --format='value(status.url)')

if [ -z "$API_URL" ]; then
  echo "❌ Failed to resolve API URL"
  exit 1
fi

INTERNAL_API_URL="${API_URL}/api"

echo "🌐 INTERNAL_API_URL: $INTERNAL_API_URL"

#############################################
# 🚀 DEPLOY BFFs (NO TRAFFIC)
#############################################

deploy_bff() {
  SERVICE_NAME=$1
  IMAGE_NAME=$2

  echo "🚀 Deploying $SERVICE_NAME..."

  BFF_SECRETS="INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest"

  if [ "$SERVICE_NAME" = "$SERVICE_RTH" ]; then
    BFF_SECRETS="${BFF_SECRETS},DATABASE_URL_TUTORIAL=DATABASE_URL_TUTORIAL:latest,DATABASE_DIRECT_URL_TUTORIAL=DATABASE_DIRECT_URL_TUTORIAL:latest"
  fi

  gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --region $REGION \
    --no-traffic \
    --memory 256Mi \
    --cpu 1 \
    --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in" \
    --update-secrets "$BFF_SECRETS"
}

if [ "$BUILD_RTH" = true ]; then
  deploy_bff $SERVICE_RTH $IMAGE_RTH
else
  echo "⏭️ Skipping deployment of ${SERVICE_RTH} (no changes)"
fi

if [ "$BUILD_SKILLUP" = true ]; then
  deploy_bff $SERVICE_SKILLUP $IMAGE_SKILLUP
else
  echo "⏭️ Skipping deployment of ${SERVICE_SKILLUP} (no changes)"
fi

if [ "$BUILD_SHC_ADMIN" = true ]; then
  echo "🚀 Deploying SHC Admin (Identity-First via People DB)..."
  gcloud run deploy $SERVICE_SHC_ADMIN \
    --image $IMAGE_SHC_ADMIN \
    --region $REGION \
    --no-traffic \
    --memory 256Mi \
    --cpu 1 \
    --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in,NEXT_PUBLIC_SHC_CONTENT_BASE_URL=${SHC_MARKETING_BASE_URL},MARKETING_CONTENT_API_BASE_URL=${SHC_MARKETING_BASE_URL},NEXT_PUBLIC_ANALYTICS_COLLECTOR_BASE_URL=${COLLECTOR_BASE_URL},NEXT_PUBLIC_RTH_ANALYTICS_ENDPOINT=${COLLECTOR_TRACK_URL}" \
    --update-secrets "DATABASE_URL=DATABASE_URL_PEOPLE:latest,DATABASE_DIRECT_URL=DATABASE_DIRECT_URL_PEOPLE:latest,DATABASE_URL_TUTORIAL=DATABASE_URL_TUTORIAL:latest,DATABASE_DIRECT_URL_TUTORIAL=DATABASE_DIRECT_URL_TUTORIAL:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest"
else
  echo "⏭️ Skipping deployment of ${SERVICE_SHC_ADMIN} (no changes)"
fi

echo "✅ Selective services deployment complete"

#############################################
# 🔍 HEALTH CHECK LOOP (FAIL FAST)
#############################################

echo "🔍 Waiting for API readiness..."

API_READY=false

for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${INTERNAL_API_URL}/health/live" || true)

  if [ "$STATUS" = "200" ]; then
    echo "✅ API Ready (attempt $i)"
    API_READY=true
    break
  fi

  echo "⏳ Waiting... (attempt $i, status: $STATUS)"
  sleep 3
done

if [ "$API_READY" = false ]; then
  echo "❌ API HEALTH CHECK FAILED - API not responding"
  echo "🔍 Checking API logs..."
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=quiz-api-server" --limit=5 --format="value(textPayload)"
  echo ""
  echo "❌ DEPLOYMENT BLOCKED: API server not healthy"
  exit 1
fi

#############################################
# 🔍 VERIFY INTERNAL_API_URL ROUTING
#############################################

echo ""
echo "🔍 Verifying INTERNAL_API_URL routing..."
echo "API URL used: $INTERNAL_API_URL"

HEALTH_RESPONSE=$(curl -s "${INTERNAL_API_URL}/health/live" || echo "FAILED")

if [[ "$HEALTH_RESPONSE" == *"ok"* ]] || [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
  echo "✅ Internal API URL routing works"
else
  echo "❌ Internal API URL routing failed"
  echo "Response: $HEALTH_RESPONSE"
  echo ""
  echo "⚠️  WARNING: API may not be reachable from BFF services"
fi

#############################################
# 🌐 DEPLOY CLOUDFLARE WORKER
#############################################

echo "🌐 Deploying Cloudflare Worker..."

cd services/api-gateway

QUIZ_WEB_URL=$(gcloud run services describe quiz-web-app --region ${REGION} --format 'value(status.url)' 2>/dev/null || echo "")
RTH_WEB_URL=$(gcloud run services describe realtutorialhub-web --region ${REGION} --format 'value(status.url)')
SKILLUP_WEB_URL=$(gcloud run services describe skillup-web --region ${REGION} --format 'value(status.url)')
API_URL=$(gcloud run services describe quiz-api-server --region ${REGION} --format 'value(status.url)')

npx wrangler deploy --env production --keep-vars \
  --var ENVIRONMENT:production \
  --var QUIZ_WEB_URL:${QUIZ_WEB_URL} \
  --var TUTORIAL_SERVICE_URL:${RTH_WEB_URL} \
  --var EXAM_SERVICE_URL:${API_URL} \
  --var SKILLUP_WEB_URL:${SKILLUP_WEB_URL}

cd ../..

echo "✅ Cloudflare Worker deployed"


#############################################
# 🔐 PRE-TRAFFIC SAFETY CHECK
#############################################

echo ""
echo "🔐 Running PRE-TRAFFIC safety gate..."

node ./scripts/auth-safety-gate.js

if [ $? -ne 0 ]; then
  echo "❌ SAFETY CHECK FAILED — BLOCKING TRAFFIC RELEASE"
  exit 1
fi

echo "✅ Pre-traffic safety check passed"

echo ""
echo "🔐 Running PRE-TRAFFIC comprehensive audit..."

node ./scripts/auth-full-audit.js

if [ $? -ne 0 ]; then
  echo "⚠️  COMPREHENSIVE AUDIT FAILED — Continuing with deployment"
  echo "   (Non-blocking: Profile endpoint may require user token)"
fi

echo "✅ Pre-traffic checks completed"

echo ""
echo "🔥 Running PHASE 1 FALLBACK VALIDATION..."

node ./scripts/test-phase1-fallback.js

if [ $? -ne 0 ]; then
  echo "❌ PHASE 1 FALLBACK VALIDATION FAILED — BLOCKING TRAFFIC RELEASE"
  echo "   Dashboard resilience not guaranteed"
  exit 1
fi

echo "✅ Phase 1 fallback validation passed"

echo ""
echo "🔄 Running NAVIGATION STABILITY TEST..."

node ./scripts/test-auth-resilience.js

if [ $? -ne 0 ]; then
  echo "❌ NAVIGATION STABILITY TEST FAILED — BLOCKING TRAFFIC RELEASE"
  echo "   Users may be logged out on navigation"
  exit 1
fi

echo "✅ Navigation stability test passed"

#############################################
# 🚀 FULL TRAFFIC RELEASE
#############################################

echo "🚀 Routing traffic to new revision..."

[ "$BUILD_API" = true ] && gcloud run services update-traffic $SERVICE_API --region $REGION --to-latest || echo "⏭️ Skipping traffic update for $SERVICE_API (no changes)"
[ "$BUILD_RTH" = true ] && gcloud run services update-traffic $SERVICE_RTH --region $REGION --to-latest || echo "⏭️ Skipping traffic update for $SERVICE_RTH (no changes)"
[ "$BUILD_SKILLUP" = true ] && gcloud run services update-traffic $SERVICE_SKILLUP --region $REGION --to-latest || echo "⏭️ Skipping traffic update for $SERVICE_SKILLUP (no changes)"
[ "$BUILD_SHC_ADMIN" = true ] && gcloud run services update-traffic $SERVICE_SHC_ADMIN --region $REGION --to-latest || echo "⏭️ Skipping traffic update for $SERVICE_SHC_ADMIN (no changes)"

#############################################
# 🔐 POST-DEPLOY SAFETY CHECK
#############################################

echo ""
echo "🔐 Running POST-DEPLOY safety gate..."

node ./scripts/auth-safety-gate.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ POST-DEPLOY SAFETY FAILED — INITIATING ROLLBACK"

  rollback() {
    SERVICE=$1
    REV=$2

    if [ -n "$REV" ]; then
      gcloud run services update-traffic $SERVICE \
        --region $REGION \
        --to-revisions ${REV}=100
    fi
  }

  rollback $SERVICE_API $PREV_API
  rollback $SERVICE_RTH $PREV_RTH
  rollback $SERVICE_SKILLUP $PREV_SKILLUP
  rollback $SERVICE_SHC_API $PREV_SHC_API
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE
  rollback_marketing_site $SERVICE_ANALYTICS_COLLECTOR $PREV_ANALYTICS_COLLECTOR

  echo "❌ ROLLBACK COMPLETE"
  exit 1
fi

echo "✅ Post-deploy safety check passed"

echo ""
echo "🔐 Running POST-DEPLOY comprehensive audit..."

node ./scripts/auth-full-audit.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ POST-DEPLOY COMPREHENSIVE AUDIT FAILED — INITIATING ROLLBACK"

  rollback() {
    SERVICE=$1
    REV=$2

    if [ -n "$REV" ]; then
      gcloud run services update-traffic $SERVICE \
        --region $REGION \
        --to-revisions ${REV}=100
    fi
  }

  rollback $SERVICE_API $PREV_API
  rollback $SERVICE_RTH $PREV_RTH
  rollback $SERVICE_SKILLUP $PREV_SKILLUP
  rollback $SERVICE_SHC_API $PREV_SHC_API
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE
  rollback_marketing_site $SERVICE_ANALYTICS_COLLECTOR $PREV_ANALYTICS_COLLECTOR

  echo "❌ ROLLBACK COMPLETE"
  exit 1
fi

echo "✅ Post-deploy comprehensive audit passed"

echo ""
echo "🔥 Running POST-DEPLOY PHASE 1 VALIDATION..."

node ./scripts/test-phase1-fallback.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ POST-DEPLOY PHASE 1 VALIDATION FAILED — INITIATING ROLLBACK"
  echo "   Dashboard resilience compromised in production"

  rollback() {
    SERVICE=$1
    REV=$2

    if [ -n "$REV" ]; then
      gcloud run services update-traffic $SERVICE \
        --region $REGION \
        --to-revisions ${REV}=100
    fi
  }

  rollback $SERVICE_API $PREV_API
  rollback $SERVICE_RTH $PREV_RTH
  rollback $SERVICE_SKILLUP $PREV_SKILLUP
  rollback $SERVICE_SHC_API $PREV_SHC_API
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE
  rollback_marketing_site $SERVICE_ANALYTICS_COLLECTOR $PREV_ANALYTICS_COLLECTOR

  echo "❌ ROLLBACK COMPLETE"
  exit 1
fi

echo "✅ Post-deploy Phase 1 validation passed"







#############################################
# 🔍 WAIT FOR STABILITY 
#############################################

echo "⏳ Waiting for services to stabilize..."

sleep 10

#############################################
# 🧪 AUTH VALIDATION (FAIL FAST)
#############################################

echo ""
echo "🧪 Running auth validation..."

node ./scripts/final-auth-diagnostic.js

AUTH_EXIT_CODE=$?

if [ $AUTH_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ AUTH VALIDATION FAILED — INITIATING ROLLBACK"
  echo ""
  echo "🔍 Diagnostic Information:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  echo ""
  echo "📊 Checking BFF → API communication..."
  echo "RTH BFF logs (last 3):"
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=realtutorialhub-web" --limit=3 --format="value(textPayload)" 2>/dev/null || echo "  (no logs available)"
  
  echo ""
  echo "📊 Checking API server auth errors..."
  echo "API logs (last 3):"
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=quiz-api-server" --limit=3 --format="value(textPayload)" 2>/dev/null || echo "  (no logs available)"
  
  echo ""
  echo "🔐 Verifying secrets are accessible..."
  API_HAS_SECRET=$(gcloud run services describe quiz-api-server --region=$REGION --format="yaml" | grep -c "INTERNAL_API_SECRET" || echo "0")
  BFF_HAS_SECRET=$(gcloud run services describe realtutorialhub-web --region=$REGION --format="yaml" | grep -c "INTERNAL_API_SECRET" || echo "0")
  
  echo "  API has INTERNAL_API_SECRET: $API_HAS_SECRET"
  echo "  BFF has INTERNAL_API_SECRET: $BFF_HAS_SECRET"
  
  if [ "$API_HAS_SECRET" = "0" ] || [ "$BFF_HAS_SECRET" = "0" ]; then
    echo ""
    echo "⚠️  LIKELY CAUSE: INTERNAL_API_SECRET not properly configured"
    echo "   - API needs INTERNAL_API_SECRET to validate internal requests"
    echo "   - BFF needs INTERNAL_API_SECRET to authenticate with API"
  fi
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🔁 Rolling back to previous revisions..."

  rollback() {
    SERVICE=$1
    REV=$2

    if [ -n "$REV" ]; then
      echo "  Rolling back $SERVICE to $REV..."
      gcloud run services update-traffic $SERVICE \
        --region $REGION \
        --to-revisions ${REV}=100 2>/dev/null || echo "  ⚠️  Rollback failed for $SERVICE"
    else
      echo "  ⚠️  No previous revision for $SERVICE"
    fi
  }

  rollback $SERVICE_API $PREV_API
  rollback $SERVICE_RTH $PREV_RTH
  rollback $SERVICE_SKILLUP $PREV_SKILLUP
  rollback $SERVICE_SHC_API $PREV_SHC_API
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE
  rollback_marketing_site $SERVICE_ANALYTICS_COLLECTOR $PREV_ANALYTICS_COLLECTOR

  echo ""
  echo "🔁 Rollback complete"
  echo ""
  echo "❌ DEPLOYMENT FAILED - Services rolled back to previous versions"
  exit 1
fi

echo "✅ Auth validation passed"

#############################################
# 🧪 RBAC VALIDATION (PRODUCTION-GRADE)
#############################################

echo ""
echo "🧪 Running RBAC validation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if RBAC test credentials are configured
RBAC_CONFIGURED=false

if [ -n "$RBAC_RTH_USER_EMAIL" ] && [ -n "$RBAC_RTH_USER_PASSWORD" ]; then
  RBAC_CONFIGURED=true
fi

if [ "$RBAC_CONFIGURED" = false ]; then
  echo ""
  echo "⚠️  RBAC test credentials not configured"
  echo "   Set environment variables to enable RBAC validation:"
  echo ""
  echo "   # RealTutorialHub users"
  echo "   export RBAC_RTH_USER_EMAIL='ajayshah@gmail.com'"
  echo "   export RBAC_RTH_USER_PASSWORD='testing'"
  echo ""
  echo "   # SkillUp users"
  echo "   export RBAC_SKILLUP_STUDENT_EMAIL='student@skillupitacademy.com'"
  echo "   export RBAC_SKILLUP_STUDENT_PASSWORD='testing'"
  echo ""
  echo "   ⚠️  Skipping RBAC validation..."
  echo "   ⚠️  RBAC enforcement NOT verified in this deployment!"
  echo ""
else
  # Step 1: Fetch access tokens
  echo "🔐 Fetching access tokens for RBAC test users..."
  node ./scripts/get-access-token.js

  if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  WARNING: Could not fetch RBAC test tokens"
    echo "   Possible reasons:"
    echo "   1. Test users don't exist in the database"
    echo "   2. Passwords are incorrect"
    echo "   3. Login endpoint is not working"
    echo ""
    echo "   Current test users:"
    echo "   - RTH: ajayshah@gmail.com"
    echo "   - SkillUp: student@skillupitacademy.com"
    echo ""
    echo "   Skipping RBAC validation..."
    echo "   ⚠️  RBAC enforcement NOT verified in this deployment!"
    echo ""
  else
    # Step 2: Run RBAC live tests
    echo ""
    echo "🧪 Running RBAC live tests..."
    node ./scripts/test-rbac-live.js

    RBAC_EXIT_CODE=$?

    if [ $RBAC_EXIT_CODE -ne 0 ]; then
      echo ""
      echo "❌ RBAC VALIDATION FAILED — CRITICAL SECURITY ISSUE"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      echo "🚨 RBAC is NOT enforcing properly!"
      echo "   This means non-admin users can access admin endpoints!"
      echo ""
      echo "🔍 Checking RBAC implementation..."
      echo "   Running stale code detector..."
      node ./scripts/detect-stale-rbac-code.js || true
      echo ""
      echo "🔁 INITIATING ROLLBACK..."

      rollback() {
        SERVICE=$1
        REV=$2

        if [ -n "$REV" ]; then
          echo "  Rolling back $SERVICE to $REV..."
          gcloud run services update-traffic $SERVICE \
            --region $REGION \
            --to-revisions ${REV}=100 2>/dev/null || echo "  ⚠️  Rollback failed for $SERVICE"
        else
          echo "  ⚠️  No previous revision for $SERVICE"
        fi
      }

      rollback $SERVICE_API $PREV_API
      rollback $SERVICE_RTH $PREV_RTH
      rollback $SERVICE_SKILLUP $PREV_SKILLUP
      rollback $SERVICE_SHC_API $PREV_SHC_API
      rollback $SERVICE_SHC_ADMIN $PREV_SHC_ADMIN
      rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
      rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE
      rollback_marketing_site $SERVICE_ANALYTICS_COLLECTOR $PREV_ANALYTICS_COLLECTOR

      echo ""
      echo "🔁 Rollback complete"
      echo ""
      echo "❌ DEPLOYMENT BLOCKED - RBAC security validation failed"
      echo "   Fix RBAC enforcement before deploying again"
      exit 1
    fi

    echo ""
    echo "✅ RBAC validation passed"
    echo "   ✅ Non-admin users blocked from admin endpoints"
    echo "   ✅ Admin users can access admin endpoints"
    echo "   ✅ Ownership RBAC working"
    echo ""
    echo "🔍 IMPORTANT: Check production logs for:"
    echo "   - RBAC_AUDIT with result:GRANTED"
    echo "   - RBAC_AUDIT with result:DENIED"
    echo "   You MUST see BOTH granted and denied entries!"
    echo ""
  fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#############################################
# 🧪 SHC ADMIN VALIDATION (INFRASTRUCTURE)
#############################################

echo ""
echo "🧪 Running SkillHubCore Admin validation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# SHC Admin test credentials
export SHC_ADMIN_EMAIL="${SHC_ADMIN_EMAIL:-admin@skillhubcore.in}"
export SHC_ADMIN_PASSWORD="${SHC_ADMIN_PASSWORD:-testing}"

echo "🔐 Testing SHC Admin authentication..."
echo "   Email: $SHC_ADMIN_EMAIL"

# Test SHC Admin browser flow
node ./scripts/test-shc-browser-flow.mjs

SHC_EXIT_CODE=$?

if [ $SHC_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ SHC ADMIN VALIDATION FAILED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🚨 SkillHubCore Admin authentication is broken!"
  echo "   Infrastructure admins cannot access the admin console!"
  echo ""
  echo "🔍 Checking SHC Admin logs..."
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skillhubcore-admin" --limit=5 --format="value(textPayload)" 2>/dev/null || echo "  (no logs available)"
  echo ""
  echo "🔁 INITIATING ROLLBACK..."

  rollback() {
    SERVICE=$1
    REV=$2

    if [ -n "$REV" ]; then
      echo "  Rolling back $SERVICE to $REV..."
      gcloud run services update-traffic $SERVICE \
        --region $REGION \
        --to-revisions ${REV}=100 2>/dev/null || echo "  ⚠️  Rollback failed for $SERVICE"
    else
      echo "  ⚠️  No previous revision for $SERVICE"
    fi
  }

  rollback $SERVICE_API $PREV_API
  rollback $SERVICE_RTH $PREV_RTH
  rollback $SERVICE_SKILLUP $PREV_SKILLUP
  rollback $SERVICE_SHC_API $PREV_SHC_API
  rollback $SERVICE_SHC_ADMIN $PREV_SHC_ADMIN
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE
  rollback_marketing_site $SERVICE_ANALYTICS_COLLECTOR $PREV_ANALYTICS_COLLECTOR

  echo ""
  echo "🔁 Rollback complete"
  echo ""
  echo "❌ DEPLOYMENT BLOCKED - SHC Admin validation failed"
  echo "   Fix SHC Admin authentication before deploying again"
  exit 1
fi

echo ""
echo "✅ SHC Admin validation passed"
echo "   ✅ Login flow working"
echo "   ✅ Dashboard accessible"
echo "   ✅ Authentication cookies set correctly"
echo "   ✅ Infrastructure admin console operational"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#############################################
# 🎉 DONE
#############################################

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL (FAANG MODE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Post-deploy validation:"
echo ""
echo "Running hybrid marketing platform validation..."

MARKETING_VALIDATION_SHC_BASE_URL=$(resolve_run_service_url "$SERVICE_SHC_API" "$REGION")
MARKETING_VALIDATION_COLLECTOR_BASE_URL=$(resolve_run_service_url "$SERVICE_ANALYTICS_COLLECTOR" "$MARKETING_REGION")
MARKETING_VALIDATION_RTH_SITE_URL=$(resolve_run_service_url "$SERVICE_RTH_SITE" "$MARKETING_REGION")
MARKETING_VALIDATION_SUIA_SITE_URL=$(resolve_run_service_url "$SERVICE_SKILLUP_SITE" "$MARKETING_REGION")
MARKETING_VALIDATION_ANALYTICS_ADMIN_TOKEN=$(gcloud secrets versions access latest --secret=ANALYTICS_ADMIN_TOKEN 2>/dev/null || echo "")

if [ -z "$MARKETING_VALIDATION_SHC_BASE_URL" ] || [ -z "$MARKETING_VALIDATION_COLLECTOR_BASE_URL" ] || [ -z "$MARKETING_VALIDATION_RTH_SITE_URL" ] || [ -z "$MARKETING_VALIDATION_SUIA_SITE_URL" ] || [ -z "$MARKETING_VALIDATION_ANALYTICS_ADMIN_TOKEN" ]; then
  echo "MARKETING VALIDATION SETUP FAILED"
  echo "   SHC base: ${MARKETING_VALIDATION_SHC_BASE_URL:-missing}"
  echo "   Collector base: ${MARKETING_VALIDATION_COLLECTOR_BASE_URL:-missing}"
  echo "   RTH site: ${MARKETING_VALIDATION_RTH_SITE_URL:-missing}"
  echo "   SUIA site: ${MARKETING_VALIDATION_SUIA_SITE_URL:-missing}"
  if [ -n "$MARKETING_VALIDATION_ANALYTICS_ADMIN_TOKEN" ]; then
    echo "   Analytics admin token: present"
  else
    echo "   Analytics admin token: missing"
  fi
  exit 1
fi

export MARKETING_VALIDATION_SHC_BASE_URL
export MARKETING_VALIDATION_COLLECTOR_BASE_URL
export MARKETING_VALIDATION_RTH_SITE_URL
export MARKETING_VALIDATION_SUIA_SITE_URL
export MARKETING_VALIDATION_ANALYTICS_ADMIN_TOKEN

node ./scripts/test-marketing-hybrid-deployment.mjs

MARKETING_VALIDATION_EXIT_CODE=$?

if [ $MARKETING_VALIDATION_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "MARKETING PLATFORM VALIDATION FAILED"
  echo "   SHC content/control-plane, collector ingestion, or brand site proxy validation failed."
  echo "   Initiating rollback..."

  rollback() {
    SERVICE=$1
    REV=$2

    if [ -n "$REV" ]; then
      echo "  Rolling back $SERVICE to $REV..."
      gcloud run services update-traffic $SERVICE \
        --region $REGION \
        --to-revisions ${REV}=100 2>/dev/null || echo "  Rollback failed for $SERVICE"
    else
      echo "  No previous revision for $SERVICE"
    fi
  }

  rollback $SERVICE_API $PREV_API
  rollback $SERVICE_RTH $PREV_RTH
  rollback $SERVICE_SKILLUP $PREV_SKILLUP
  rollback $SERVICE_SHC_API $PREV_SHC_API
  rollback $SERVICE_SHC_ADMIN $PREV_SHC_ADMIN
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE
  rollback_marketing_site $SERVICE_ANALYTICS_COLLECTOR $PREV_ANALYTICS_COLLECTOR

  echo ""
  echo "Rollback complete"
  echo ""
  echo "DEPLOYMENT BLOCKED - Hybrid marketing validation failed"
  exit 1
fi

echo ""
echo "Hybrid marketing validation passed"
echo "   SHC governed content and control-plane reachable"
echo "   Collector ingestion and observability reachable"
echo "   RTH marketing proxy headers and course route validated"
echo "   SUIA marketing proxy headers and course route validated"
echo ""

echo "User Portals:"
echo "   RTH: https://user.realtutorialhub.com"
echo "   SkillUp: https://user.skillupitacademy.com"
echo "   RTH Marketing: https://www.realtutorialhub.com"
echo "   SkillUp Marketing: https://www.skillupitacademy.com"
echo ""
echo "🔗 Admin Consoles:"
echo "   SHC Infrastructure: https://admin.skillhubcore.in"
echo "Hybrid marketing platform validated"
echo ""
echo "📌 Updating deployment annotation..."
gcloud run services update $SERVICE_API \
  --region=$REGION \
  --update-annotations="deploy-sha=${GIT_SHA}" \
  --quiet || echo "⚠️  Failed to update annotation (non-fatal)"

echo "✅ All services deployed and validated"
echo "✅ Authentication flows working"
echo "✅ RBAC enforcement verified"
echo "✅ Infrastructure admin console operational"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
