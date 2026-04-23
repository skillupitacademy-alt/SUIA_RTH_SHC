

#!/bin/bash
set -euo pipefail

#############################################
# 🔧 CONFIG
#############################################

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REGION="asia-southeast1"
REGISTRY="asia-southeast1-docker.pkg.dev"

SERVICE_API="quiz-api-server"
SERVICE_RTH="realtutorialhub-web"
SERVICE_SKILLUP="skillup-web"

GIT_SHA=$(git rev-parse --short HEAD)

IMAGE_API="${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}"
IMAGE_RTH="${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}"
IMAGE_SKILLUP="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA}"

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

pnpm lint:all || exit 1
pnpm typecheck:all || exit 1
pnpm build:all || exit 1

echo "✅ Quality checks passed"

#############################################
# 📌 CAPTURE CURRENT REVISIONS
#############################################

capture_revision() {
  gcloud run services describe $1 \
    --region=$REGION \
    --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo ""
}

PREV_API=$(capture_revision $SERVICE_API)
PREV_RTH=$(capture_revision $SERVICE_RTH)
PREV_SKILLUP=$(capture_revision $SERVICE_SKILLUP)

echo "📌 Previous revisions:"
echo "API: $PREV_API"
echo "RTH: $PREV_RTH"
echo "SkillUp: $PREV_SKILLUP"

#############################################
# 🚀 BUILD + PUSH IMAGES
#############################################

echo "🐳 Building images..."

docker build -f apps/api-server/Dockerfile -t $IMAGE_API .
docker build -f apps/realtutorialhub-web/Dockerfile -t $IMAGE_RTH .
docker build -f apps/skillup-web/Dockerfile -t $IMAGE_SKILLUP .

echo "📦 Pushing images..."

docker push $IMAGE_API
docker push $IMAGE_RTH
docker push $IMAGE_SKILLUP

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
  --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com" \
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

  gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --region $REGION \
    --no-traffic \
    --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com" \
    --update-secrets "INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest"
}

deploy_bff $SERVICE_RTH $IMAGE_RTH
deploy_bff $SERVICE_SKILLUP $IMAGE_SKILLUP

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

  echo ""
  echo "🔁 Rollback complete"
  echo ""
  echo "❌ DEPLOYMENT FAILED - Services rolled back to previous versions"
  exit 1
fi

echo "✅ Auth validation passed"

#############################################
# 🎉 DONE
#############################################

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL (FAANG MODE)"
echo "🔗 RTH: https://user.realtutorialhub.com"
echo "🔗 SkillUp: https://user.skillupitacademy.com"