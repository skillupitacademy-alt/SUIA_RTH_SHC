#!/bin/bash
set -euo pipefail

#############################################
# 🚀 DEPLOY API SERVER ONLY
# Quick deployment for API server updates
#############################################

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REGION="asia-southeast1"
REGISTRY="asia-southeast1-docker.pkg.dev"
SERVICE_API="quiz-api-server"

GIT_SHA=$(git rev-parse --short HEAD)
IMAGE_API="${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}"

echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

echo "🧪 Building API server..."
pnpm run build --filter=@quiz/api-server

echo "🐳 Building Docker image..."
docker build -f apps/api-server/Dockerfile -t $IMAGE_API .

echo "📦 Pushing image..."
docker push $IMAGE_API

echo "📌 Capturing current revision..."
PREV_API=$(gcloud run services describe $SERVICE_API \
  --region=$REGION \
  --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")

echo "Previous revision: $PREV_API"

echo "🚀 Deploying API server (no traffic)..."
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

echo "🔍 Waiting for API readiness..."
API_URL=$(gcloud run services describe $SERVICE_API \
  --region=$REGION \
  --format='value(status.url)')

API_READY=false
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/health/live" || true)
  
  if [ "$STATUS" = "200" ]; then
    echo "✅ API Ready (attempt $i)"
    API_READY=true
    break
  fi
  
  echo "⏳ Waiting... (attempt $i, status: $STATUS)"
  sleep 3
done

if [ "$API_READY" = false ]; then
  echo "❌ API HEALTH CHECK FAILED"
  exit 1
fi

echo "🚀 Routing traffic to new revision..."
gcloud run services update-traffic $SERVICE_API \
  --region $REGION \
  --to-latest

echo ""
echo "✅ API SERVER DEPLOYED SUCCESSFULLY!"
echo "🔗 URL: $API_URL"
echo ""
echo "🧪 Next: Run test script"
echo "   node scripts/test-rbac-shared-components.js"
