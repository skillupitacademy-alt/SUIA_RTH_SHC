#!/bin/bash
set -euo pipefail

#############################################
# 🔧 DEPLOY RTH BFF ONLY
#############################################

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REGION="asia-southeast1"
REGISTRY="asia-southeast1-docker.pkg.dev"

SERVICE_RTH="realtutorialhub-web"
GIT_SHA=$(git rev-parse --short HEAD)
IMAGE_RTH="${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}"

echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

echo "🧪 Running checks..."
pnpm lint:all || exit 1
pnpm typecheck:all || exit 1
cd apps/realtutorialhub-web && pnpm run build || exit 1
cd ../..

echo "✅ Quality checks passed"

echo "📌 Capturing current revision..."
PREV_RTH=$(gcloud run services describe $SERVICE_RTH \
  --region=$REGION \
  --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")
echo "Previous RTH revision: $PREV_RTH"

echo "🐳 Building RTH BFF image..."
docker build -f apps/realtutorialhub-web/Dockerfile -t $IMAGE_RTH .

echo "📦 Pushing RTH BFF image..."
docker push $IMAGE_RTH

echo "🌐 Getting API URL..."
API_URL=$(gcloud run services describe quiz-api-server \
  --region=$REGION \
  --format='value(status.url)')

if [ -z "$API_URL" ]; then
  echo "❌ Failed to resolve API URL"
  exit 1
fi

INTERNAL_API_URL="${API_URL}/api"
echo "🌐 INTERNAL_API_URL: $INTERNAL_API_URL"

echo "🚀 Deploying RTH BFF (no traffic)..."
gcloud run deploy $SERVICE_RTH \
  --image $IMAGE_RTH \
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
  --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in,NODE_ENV=production" \
  --update-secrets "INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest"

echo "✅ RTH BFF deployed (no traffic)"

echo "🔍 Running health check..."
RTH_URL=$(gcloud run services describe $SERVICE_RTH \
  --region=$REGION \
  --format='value(status.url)')

RTH_READY=false
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${RTH_URL}/api/healthz" || true)
  
  if [ "$STATUS" = "200" ]; then
    echo "✅ RTH BFF Ready (attempt $i)"
    RTH_READY=true
    break
  fi
  
  echo "⏳ Waiting... (attempt $i, status: $STATUS)"
  sleep 3
done

if [ "$RTH_READY" = false ]; then
  echo "❌ RTH BFF HEALTH CHECK FAILED"
  exit 1
fi

echo "🚀 Routing traffic to new revision..."
gcloud run services update-traffic $SERVICE_RTH \
  --region $REGION \
  --to-latest

echo "⏳ Waiting for stability..."
sleep 5

echo "🧪 Testing dashboard page..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "https://user.realtutorialhub.com/dashboard" || true)

# ✅ Accept 200 (authenticated), 302 (redirect to login), or 401 (auth required) as valid
# All these statuses mean the BFF is working correctly
if [ "$DASHBOARD_STATUS" = "200" ] || [ "$DASHBOARD_STATUS" = "302" ] || [ "$DASHBOARD_STATUS" = "401" ]; then
  echo "✅ Dashboard accessible (status: $DASHBOARD_STATUS)"
else
  echo "⚠️  Dashboard returned unexpected status: $DASHBOARD_STATUS"
  echo "🔁 Rolling back..."
  
  if [ -n "$PREV_RTH" ]; then
    gcloud run services update-traffic $SERVICE_RTH \
      --region $REGION \
      --to-revisions ${PREV_RTH}=100
    echo "❌ ROLLBACK COMPLETE"
  fi
  
  exit 1
fi

echo ""
echo "🎉 RTH BFF DEPLOYMENT SUCCESSFUL"
echo "🔗 RTH: https://user.realtutorialhub.com"
echo "🔗 Dashboard: https://user.realtutorialhub.com/dashboard"
