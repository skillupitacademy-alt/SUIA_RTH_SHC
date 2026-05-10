#!/bin/bash
set -euo pipefail

#############################################
# 🚀 Deploy SHC Admin Only
#############################################

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REGION="asia-southeast1"
REGISTRY="asia-southeast1-docker.pkg.dev"
SERVICE_SHC_ADMIN="skillhubcore-admin"

GIT_SHA=$(git rev-parse --short HEAD)
IMAGE_SHC_ADMIN="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA}"

echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

echo "🧪 Running type check..."
pnpm --filter @quiz/skillhubcore-admin run type-check || exit 1

echo "🐳 Building SHC Admin image (no cache)..."
docker build --no-cache -f apps/skillhubcore-admin/Dockerfile -t $IMAGE_SHC_ADMIN .

echo "📦 Pushing image..."
docker push $IMAGE_SHC_ADMIN

echo "🚀 Deploying SHC Admin..."
gcloud run deploy $SERVICE_SHC_ADMIN \
  --image $IMAGE_SHC_ADMIN \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 1000 \
  --max-instances 5 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production,GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in" \
  --update-secrets "DATABASE_URL=DATABASE_URL_PEOPLE:latest,DATABASE_DIRECT_URL=DATABASE_DIRECT_URL_PEOPLE:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest"

echo "✅ SHC Admin deployed!"
echo ""
echo "🧪 Testing browser flow..."
npx tsx scripts/test-shc-browser-flow.mjs

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 DEPLOYMENT SUCCESSFUL!"
  echo "🔗 Login at: https://admin.skillhubcore.in/login"
  echo "   Email: admin@skillhubcore.in"
  echo "   Password: testing"
else
  echo ""
  echo "⚠️  Deployment completed but browser test failed"
  echo "   Check the logs above for details"
fi
