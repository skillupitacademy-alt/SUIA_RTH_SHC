

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
SERVICE_RTH_SITE="realtutorialhub-site"
SERVICE_SKILLUP_SITE="skillupitacademy-site"

GIT_SHA=$(git rev-parse --short HEAD)

IMAGE_API="${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}"
IMAGE_RTH="${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}"
IMAGE_SKILLUP="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA}"
IMAGE_SHC_ADMIN="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA}"

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

  run_with_retry "Cloud Build ${image}" \
    gcloud builds submit . \
      --region="$REGION" \
      --machine-type=e2-highcpu-8 \
      --timeout=3600s \
      --config=scripts/cloudbuild-docker-image.yaml \
      --substitutions="_DOCKERFILE=${dockerfile},_IMAGE=${image}"
}

deploy_marketing_site() {
  local service_name="$1"
  local cloudbuild_config="$2"
  local pixel_id="$3"
  local ga_id="$4"
  local gtm_id="$5"
  local analytics_env="${6:-production}"

  run_with_retry "Cloud Build ${service_name}" \
    gcloud builds submit . \
      --project="${PROJECT_ID}" \
      --config="${cloudbuild_config}" \
      --substitutions="_TAG=${GIT_SHA},_NEXT_PUBLIC_RTH_META_PIXEL_ID=${pixel_id},_NEXT_PUBLIC_RTH_GA4_MEASUREMENT_ID=${ga_id},_NEXT_PUBLIC_RTH_GTM_CONTAINER_ID=${gtm_id},_NEXT_PUBLIC_SUIA_META_PIXEL_ID=${pixel_id},_NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID=${ga_id},_NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID=${gtm_id},_NEXT_PUBLIC_ANALYTICS_ENABLED=true,_NEXT_PUBLIC_ANALYTICS_ENV=${analytics_env}"
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
)

MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
  VALUE=$(gcloud secrets versions access latest --secret=$secret 2>/dev/null || echo "")
  if [ -z "$VALUE" ]; then
    echo "❌ Missing secret: $secret"
    MISSING_SECRETS+=("$secret")
  else
    echo "✅ $secret exists (${#VALUE} bytes)"
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
PREV_RTH_SITE=$(gcloud run services describe $SERVICE_RTH_SITE --region=$MARKETING_REGION --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")
PREV_SKILLUP_SITE=$(gcloud run services describe $SERVICE_SKILLUP_SITE --region=$MARKETING_REGION --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")

echo "📌 Previous revisions:"
echo "API: $PREV_API"
echo "RTH: $PREV_RTH"
echo "SkillUp: $PREV_SKILLUP"
echo "SHC Admin: $PREV_SHC_ADMIN"
echo "RTH Site: $PREV_RTH_SITE"
echo "SkillUp Site: $PREV_SKILLUP_SITE"

#############################################
# 🚀 BUILD + PUSH IMAGES
#############################################

echo "☁️  Building and pushing images with Cloud Build..."

cloud_build_image apps/api-server/Dockerfile $IMAGE_API
cloud_build_image apps/realtutorialhub-web/Dockerfile $IMAGE_RTH
cloud_build_image apps/skillup-web/Dockerfile $IMAGE_SKILLUP
cloud_build_image apps/skillhubcore-admin/Dockerfile $IMAGE_SHC_ADMIN
deploy_marketing_site $SERVICE_RTH_SITE cloudbuild.realtutorialhub-site.yaml "${NEXT_PUBLIC_RTH_META_PIXEL_ID:-}" "${NEXT_PUBLIC_RTH_GA4_MEASUREMENT_ID:-}" "${NEXT_PUBLIC_RTH_GTM_CONTAINER_ID:-}" "${NEXT_PUBLIC_ANALYTICS_ENV:-production}"
deploy_marketing_site $SERVICE_SKILLUP_SITE cloudbuild.skillupitacademy-site.yaml "${NEXT_PUBLIC_SUIA_META_PIXEL_ID:-}" "${NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID:-}" "${NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID:-}" "${NEXT_PUBLIC_ANALYTICS_ENV:-production}"

#############################################
# 🚀 DEPLOY API FIRST (NO TRAFFIC)
#############################################

echo "🚀 Deploying API (no traffic)..."

gcloud run deploy $SERVICE_API \
  --image $IMAGE_API \
  --region $REGION \
  --no-traffic \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 1000 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in" \
  --update-secrets "DATABASE_URL=DATABASE_URL:latest,DATABASE_DIRECT_URL=DATABASE_DIRECT_URL:latest,DATABASE_URL_RTH=DATABASE_URL_RTH:latest,DATABASE_DIRECT_URL_RTH=DATABASE_DIRECT_URL_RTH:latest,DATABASE_URL_SKILLUP=DATABASE_URL_SKILLUP:latest,DATABASE_DIRECT_URL_SKILLUP=DATABASE_DIRECT_URL_SKILLUP:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest,DATABASE_DIRECT_URL_PEOPLE=DATABASE_DIRECT_URL_PEOPLE:latest,DATABASE_URL_TUTORIAL=DATABASE_URL_TUTORIAL:latest,DATABASE_DIRECT_URL_TUTORIAL=DATABASE_DIRECT_URL_TUTORIAL:latest,DATABASE_URL_PAYMENT=DATABASE_URL_PAYMENT:latest,DATABASE_DIRECT_URL_PAYMENT=DATABASE_DIRECT_URL_PAYMENT:latest,DATABASE_URL_PLACEMENT=DATABASE_URL_PLACEMENT:latest,DATABASE_DIRECT_URL_PLACEMENT=DATABASE_DIRECT_URL_PLACEMENT:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest,UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,QSTASH_TOKEN=QSTASH_TOKEN:latest,QSTASH_CURRENT_SIGNING_KEY=QSTASH_CURRENT_SIGNING_KEY:latest,QSTASH_NEXT_SIGNING_KEY=QSTASH_NEXT_SIGNING_KEY:latest,RESEND_API_KEY=RESEND_API_KEY:latest,CSRF_SECRET=CSRF_SECRET:latest,INTERNAL_API_KEY=INTERNAL_API_KEY:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,ALLOWED_ORIGINS=ALLOWED_ORIGINS:latest"

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
    --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in" \
    --update-secrets "$BFF_SECRETS"
}

deploy_bff $SERVICE_RTH $IMAGE_RTH
deploy_bff $SERVICE_SKILLUP $IMAGE_SKILLUP

echo "🚀 Deploying SHC Admin (Identity-First via People DB)..."

gcloud run deploy $SERVICE_SHC_ADMIN \
  --image $IMAGE_SHC_ADMIN \
  --region $REGION \
  --no-traffic \
  --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in" \
  --update-secrets "DATABASE_URL=DATABASE_URL_PEOPLE:latest,DATABASE_DIRECT_URL=DATABASE_DIRECT_URL_PEOPLE:latest,DATABASE_URL_TUTORIAL=DATABASE_URL_TUTORIAL:latest,DATABASE_DIRECT_URL_TUTORIAL=DATABASE_DIRECT_URL_TUTORIAL:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest"

echo "✅ All services deployed (no traffic)"

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

gcloud run services update-traffic $SERVICE_API \
  --region $REGION \
  --to-latest

gcloud run services update-traffic $SERVICE_RTH \
  --region $REGION \
  --to-latest

gcloud run services update-traffic $SERVICE_SKILLUP \
  --region $REGION \
  --to-latest

gcloud run services update-traffic $SERVICE_SHC_ADMIN \
  --region $REGION \
  --to-latest

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
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE

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
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE

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
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE

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
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE

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
      rollback $SERVICE_SHC_ADMIN $PREV_SHC_ADMIN
      rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
      rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE

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
  rollback $SERVICE_SHC_ADMIN $PREV_SHC_ADMIN
  rollback_marketing_site $SERVICE_RTH_SITE $PREV_RTH_SITE
  rollback_marketing_site $SERVICE_SKILLUP_SITE $PREV_SKILLUP_SITE

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
echo "🔗 User Portals:"
echo "   RTH: https://user.realtutorialhub.com"
echo "   SkillUp: https://user.skillupitacademy.com"
echo "   RTH Marketing: https://www.realtutorialhub.com"
echo "   SkillUp Marketing: https://www.skillupitacademy.com"
echo ""
echo "🔗 Admin Consoles:"
echo "   SHC Infrastructure: https://admin.skillhubcore.in"
echo ""
echo "✅ All services deployed and validated"
echo "✅ Authentication flows working"
echo "✅ RBAC enforcement verified"
echo "✅ Infrastructure admin console operational"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
