#!/bin/bash
set -euo pipefail

#############################################
# 🔧 CORE DEPLOYMENT SCRIPT
# This script performs the essential deployment
# steps without the extensive validation gates.
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
SERVICE_ANALYTICS_COLLECTOR="analytics-collector-service"

GIT_SHA=$(git rev-parse --short HEAD)

IMAGE_API="${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}"
IMAGE_RTH="${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}"
IMAGE_SKILLUP="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA}"
IMAGE_SHC_ADMIN="${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA}"

deploy_marketing_site() {
  local service_name="$1"
  local cloudbuild_config="$2"
  local rth_pixel_id="$3"
  local rth_ga_id="$4"
  local suia_pixel_id="$5"
  local suia_ga_id="$6"

  echo "Deploying ${service_name} in ${MARKETING_REGION}..."
  gcloud builds submit . \
    --project="${PROJECT_ID}" \
    --config="${cloudbuild_config}" \
    --substitutions="_TAG=${GIT_SHA},_NEXT_PUBLIC_RTH_META_PIXEL_ID=${rth_pixel_id},_NEXT_PUBLIC_RTH_GA4_MEASUREMENT_ID=${rth_ga_id},_NEXT_PUBLIC_SUIA_META_PIXEL_ID=${suia_pixel_id},_NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID=${suia_ga_id}"
}

deploy_collector_service() {
  local service_name="$1"
  local cloudbuild_config="$2"

  echo "Deploying ${service_name} in ${MARKETING_REGION}..."
  gcloud builds submit . \
    --project="${PROJECT_ID}" \
    --config="${cloudbuild_config}" \
    --substitutions="_TAG=${GIT_SHA}"
}

echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

#############################################
# 🚀 BUILD IMAGES
#############################################

echo "☁️  Building images with Cloud Build..."

cloud_build_image() {
  local dockerfile="$1"
  local image="$2"
  echo "Building $image..."
  gcloud builds submit . \
    --region="$REGION" \
    --machine-type=e2-highcpu-8 \
    --timeout=3600s \
    --config=scripts/cloudbuild-docker-image.yaml \
    --substitutions="_DOCKERFILE=${dockerfile},_IMAGE=${image}"
}

cloud_build_image apps/api-server/Dockerfile $IMAGE_API
cloud_build_image apps/realtutorialhub-web/Dockerfile $IMAGE_RTH
cloud_build_image apps/skillup-web/Dockerfile $IMAGE_SKILLUP
cloud_build_image apps/skillhubcore-admin/Dockerfile $IMAGE_SHC_ADMIN

echo "Cloud Build deploy for marketing sites..."
deploy_collector_service "$SERVICE_ANALYTICS_COLLECTOR" "cloudbuild.analytics-collector-service.yaml"
RTH_META_PIXEL_ID="${NEXT_PUBLIC_RTH_META_PIXEL_ID:-}"
RTH_GA4_MEASUREMENT_ID="${NEXT_PUBLIC_RTH_GA4_MEASUREMENT_ID:-}"
SUIA_META_PIXEL_ID="${NEXT_PUBLIC_SUIA_META_PIXEL_ID:-${NEXT_PUBLIC_FB_PIXEL_ID:-}}"
SUIA_GA4_MEASUREMENT_ID="${NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID:-${NEXT_PUBLIC_GA_ID:-}}"
deploy_marketing_site "$SERVICE_RTH_SITE" "cloudbuild.realtutorialhub-site.yaml" "$RTH_META_PIXEL_ID" "$RTH_GA4_MEASUREMENT_ID" "$SUIA_META_PIXEL_ID" "$SUIA_GA4_MEASUREMENT_ID"
deploy_marketing_site "$SERVICE_SKILLUP_SITE" "cloudbuild.skillupitacademy-site.yaml" "$RTH_META_PIXEL_ID" "$RTH_GA4_MEASUREMENT_ID" "$SUIA_META_PIXEL_ID" "$SUIA_GA4_MEASUREMENT_ID"

#############################################
# 🚀 DEPLOY API
#############################################

echo "🚀 Deploying API..."

gcloud run deploy $SERVICE_API \
  --image $IMAGE_API \
  --region $REGION \
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

API_URL=$(gcloud run services describe $SERVICE_API --region=$REGION --format='value(status.url)')
INTERNAL_API_URL="${API_URL}/api"
echo "🌐 INTERNAL_API_URL: $INTERNAL_API_URL"

#############################################
# 🚀 DEPLOY BFFs
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
    --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in" \
    --update-secrets "$BFF_SECRETS"
}

deploy_bff $SERVICE_RTH $IMAGE_RTH
deploy_bff $SERVICE_SKILLUP $IMAGE_SKILLUP

echo "🚀 Deploying SHC Admin..."
gcloud run deploy $SERVICE_SHC_ADMIN \
  --image $IMAGE_SHC_ADMIN \
  --region $REGION \
  --set-env-vars "INTERNAL_API_URL=${INTERNAL_API_URL},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GATEWAY_URL_SKILLHUBCORE=https://api.skillhubcore.in" \
  --update-secrets "DATABASE_URL=DATABASE_URL_PEOPLE:latest,DATABASE_DIRECT_URL=DATABASE_DIRECT_URL_PEOPLE:latest,DATABASE_URL_TUTORIAL=DATABASE_URL_TUTORIAL:latest,DATABASE_DIRECT_URL_TUTORIAL=DATABASE_DIRECT_URL_TUTORIAL:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest"

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

echo "🎉 CORE DEPLOYMENT SUCCESSFUL"
echo "Marketing sites:"
echo "  RTH Site: https://www.realtutorialhub.com"
echo "  SkillUp Site: https://www.skillupitacademy.com"
