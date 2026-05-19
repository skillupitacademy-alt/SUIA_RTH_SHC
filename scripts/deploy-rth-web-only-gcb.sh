#!/bin/bash
set -euo pipefail

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REGION="asia-southeast1"
REGISTRY="asia-southeast1-docker.pkg.dev"
SERVICE_RTH="realtutorialhub-web"

GIT_SHA=$(git rev-parse --short HEAD)
IMAGE_RTH="${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}"

echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

echo "☁️  Building realtutorialhub-web image with Cloud Build..."
gcloud builds submit . \
  --region="$REGION" \
  --machine-type=e2-highcpu-8 \
  --timeout=3600s \
  --config=scripts/cloudbuild-docker-image.yaml \
  --substitutions="_DOCKERFILE=apps/realtutorialhub-web/Dockerfile,_IMAGE=${IMAGE_RTH}"

echo "🌐 Resolving API URL..."
API_URL=$(gcloud run services describe quiz-api-server \
  --region=$REGION \
  --format='value(status.url)')

if [ -z "$API_URL" ]; then
  echo "❌ Failed to resolve API URL"
  exit 1
fi

INTERNAL_API_URL="${API_URL}/api"
echo "🌐 INTERNAL_API_URL: $INTERNAL_API_URL"

echo "🚀 Deploying realtutorialhub-web to Cloud Run..."
gcloud run deploy $SERVICE_RTH \
  --image $IMAGE_RTH \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 1000 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in,NODE_ENV=production" \
  --update-secrets "INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,DATABASE_URL_TUTORIAL=DATABASE_URL_TUTORIAL:latest,DATABASE_DIRECT_URL_TUTORIAL=DATABASE_DIRECT_URL_TUTORIAL:latest"

echo "🎉 DEPLOYMENT SUCCESSFUL"
