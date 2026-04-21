#!/bin/bash

###############################################################################
# DIRECT DEPLOYMENT SCRIPT (NO GITHUB)
# 
# This script follows the exact same workflow as .github/workflows/deploy-cloudrun.yml
# but executes directly on your local machine
#
# Usage:
#   ./scripts/deploy-direct.sh [scope]
#
# Scope options:
#   all          - Deploy all services (default)
#   quiz         - Deploy quiz platform (API + Web + Admin)
#   tutorial     - Deploy RealTutorialHub Web
#   skillup      - Deploy SkillUp services
#   skillhubcore - Deploy SkillHubCore services
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-project-48af6a2d-e8bb-46dd-a58}"
REGION="asia-southeast1"
REGISTRY="asia-southeast1-docker.pkg.dev"
GIT_SHA=$(git rev-parse --short HEAD)
SCOPE="${1:-all}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         DIRECT DEPLOYMENT (NO GITHUB)                      ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  Project: ${PROJECT_ID}${NC}"
echo -e "${BLUE}║  Region:  ${REGION}${NC}"
echo -e "${BLUE}║  Commit:  ${GIT_SHA}${NC}"
echo -e "${BLUE}║  Scope:   ${SCOPE}${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Determine what to deploy
RUN_QUIZ=false
RUN_TUTORIAL=false
RUN_SKILLUP=false
RUN_SKILLHUBCORE=false

case "$SCOPE" in
  all)
    RUN_QUIZ=true
    RUN_TUTORIAL=true
    RUN_SKILLUP=true
    RUN_SKILLHUBCORE=true
    ;;
  quiz)
    RUN_QUIZ=true
    ;;
  tutorial)
    RUN_TUTORIAL=true
    ;;
  skillup)
    RUN_SKILLUP=true
    ;;
  skillhubcore)
    RUN_SKILLHUBCORE=true
    ;;
  *)
    echo -e "${RED}❌ Invalid scope: $SCOPE${NC}"
    echo "Valid options: all, quiz, tutorial, skillup, skillhubcore"
    exit 1
    ;;
esac

# Helper functions
log_step() {
  echo -e "\n${BLUE}▶ $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
log_step "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed"
  exit 1
fi

if ! command -v gcloud &> /dev/null; then
  log_error "gcloud CLI is not installed"
  exit 1
fi

if ! command -v pnpm &> /dev/null; then
  log_error "pnpm is not installed"
  exit 1
fi

log_success "All prerequisites met"

# Authenticate with GCP
log_step "Authenticating with GCP..."
gcloud auth configure-docker ${REGISTRY}
log_success "Docker authenticated with GCP Artifact Registry"

# Quality checks (following quality.yml workflow)
log_step "Running quality checks..."

log_step "  1/3 Lint check..."
if pnpm lint:all; then
  log_success "Lint check passed"
else
  log_error "Lint check failed"
  exit 1
fi

log_step "  2/3 Type check..."
if pnpm typecheck:all; then
  log_success "Type check passed"
else
  log_error "Type check failed"
  exit 1
fi

log_step "  3/3 Build..."
if pnpm build:all; then
  log_success "Build successful"
else
  log_error "Build failed"
  exit 1
fi

log_success "All quality checks passed"

###############################################################################
# DEPLOY QUIZ PLATFORM
###############################################################################

if [ "$RUN_QUIZ" = true ]; then
  log_step "Deploying Quiz Platform..."

  # Deploy API Server
  log_step "  Building quiz-api-server..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api \
    --build-arg NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com \
    --build-arg INTERNAL_GATEWAY_SECRET="${INTERNAL_GATEWAY_SECRET}" \
    -f apps/api-server/Dockerfile \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA} \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:latest \
    .

  log_step "  Pushing quiz-api-server..."
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:latest

  log_step "  Deploying quiz-api-server to Cloud Run..."
  gcloud run deploy quiz-api-server \
    --image ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,GIT_SHA=${GIT_SHA}" \
    --set-secrets "DATABASE_URL=DATABASE_URL:latest,DATABASE_URL_RTH=DATABASE_URL_RTH:latest,DATABASE_URL_SKILLUP=DATABASE_URL_SKILLUP:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest,UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,QSTASH_URL=QSTASH_URL:latest,QSTASH_TOKEN=QSTASH_TOKEN:latest,QSTASH_CURRENT_SIGNING_KEY=QSTASH_CURRENT_SIGNING_KEY:latest,QSTASH_NEXT_SIGNING_KEY=QSTASH_NEXT_SIGNING_KEY:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL:latest,NEXT_PUBLIC_WEB_APP_URL=NEXT_PUBLIC_WEB_APP_URL:latest,NEXT_PUBLIC_ADMIN_URL=NEXT_PUBLIC_ADMIN_URL:latest,CSRF_SECRET=CSRF_SECRET:latest,INTERNAL_API_KEY=INTERNAL_API_KEY:latest,INTERNAL_API_URL=INTERNAL_API_URL:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,ALLOWED_ORIGINS=ALLOWED_ORIGINS:latest,STORAGE_PROVIDER=STORAGE_PROVIDER:latest,R2_ENDPOINT=R2_ENDPOINT:latest,R2_BUCKET=R2_BUCKET:latest,R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest" \
    --memory 2Gi \
    --cpu 2 \
    --concurrency 1000 \
    --max-instances 10 \
    --min-instances 0

  log_success "quiz-api-server deployed"

  # Deploy Web App
  log_step "  Building quiz-web-app..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api \
    --build-arg NEXT_PUBLIC_WEB_APP_URL=https://quiz.skillhubcore.in \
    --build-arg NEXT_PUBLIC_TUTORIAL_APP_URL=https://tutorial.skillhubcore.in \
    --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com \
    -f apps/realtutorialhub-quiz/Dockerfile \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:${GIT_SHA} \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:latest \
    .

  log_step "  Pushing quiz-web-app..."
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:${GIT_SHA}
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:latest

  log_step "  Deploying quiz-web-app to Cloud Run..."
  gcloud run deploy quiz-web-app \
    --image ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:${GIT_SHA} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 3001 \
    --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,NEXT_PUBLIC_TUTORIAL_APP_URL=https://tutorial.skillhubcore.in,GIT_SHA=${GIT_SHA}" \
    --set-secrets "NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL:latest,NEXT_PUBLIC_WEB_APP_URL=NEXT_PUBLIC_WEB_APP_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,INTERNAL_API_URL=INTERNAL_API_URL:latest" \
    --memory 1Gi \
    --cpu 1 \
    --concurrency 1000 \
    --max-instances 10

  log_success "quiz-web-app deployed"

  # Deploy Admin App
  log_step "  Building quiz-admin-app..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api \
    --build-arg NEXT_PUBLIC_WEB_APP_URL=https://quiz.skillhubcore.in \
    --build-arg NEXT_PUBLIC_TUTORIAL_APP_URL=https://tutorial.skillhubcore.in \
    --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com \
    -f apps/realtutorialhub-admin/Dockerfile \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:${GIT_SHA} \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:latest \
    .

  log_step "  Pushing quiz-admin-app..."
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:${GIT_SHA}
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:latest

  log_step "  Deploying quiz-admin-app to Cloud Run..."
  gcloud run deploy quiz-admin-app \
    --image ${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:${GIT_SHA} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 3002 \
    --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,GIT_SHA=${GIT_SHA}" \
    --set-secrets "NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL:latest,NEXT_PUBLIC_ADMIN_URL=NEXT_PUBLIC_ADMIN_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,CSRF_SECRET=CSRF_SECRET:latest,INTERNAL_API_URL=INTERNAL_API_URL:latest" \
    --memory 1Gi \
    --cpu 1 \
    --concurrency 1000 \
    --max-instances 10

  log_success "quiz-admin-app deployed"

  # Health check
  log_step "  Running health checks..."
  API_URL=$(gcloud run services describe quiz-api-server --region ${REGION} --format 'value(status.url)')
  WEB_URL=$(gcloud run services describe quiz-web-app --region ${REGION} --format 'value(status.url)')
  ADMIN_URL=$(gcloud run services describe quiz-admin-app --region ${REGION} --format 'value(status.url)')

  if curl -sf "${API_URL}/api/health/live" > /dev/null; then
    log_success "API Server health check passed"
  else
    log_error "API Server health check failed"
  fi

  if curl -sf "${WEB_URL}/" > /dev/null; then
    log_success "Web App health check passed"
  else
    log_error "Web App health check failed"
  fi

  log_success "Quiz Platform deployed successfully"
fi

###############################################################################
# DEPLOY TUTORIAL (REALTUTORIALHUB WEB)
###############################################################################

if [ "$RUN_TUTORIAL" = true ]; then
  log_step "Deploying RealTutorialHub Web..."

  # Get API URL
  API_URL=$(gcloud run services describe quiz-api-server --region ${REGION} --format 'value(status.url)')

  log_step "  Building realtutorialhub-web..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api \
    --build-arg NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_SITE_URL=https://user.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_APP_URL=https://user.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_LOGIN_URL=https://user.realtutorialhub.com/login \
    --build-arg INTERNAL_GATEWAY_SECRET="${INTERNAL_GATEWAY_SECRET}" \
    -f apps/realtutorialhub-web/Dockerfile \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA} \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:latest \
    .

  log_step "  Pushing realtutorialhub-web..."
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:latest

  log_step "  Deploying realtutorialhub-web to Cloud Run..."
  gcloud run deploy realtutorialhub-web \
    --image ${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 3003 \
    --memory 1Gi \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api,INTERNAL_API_URL=${API_URL}/api,GATEWAY_URL=https://api.realtutorialhub.com,NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com,NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com,NEXT_PUBLIC_SITE_URL=https://user.realtutorialhub.com,NEXT_PUBLIC_APP_URL=https://user.realtutorialhub.com,NEXT_PUBLIC_LOGIN_URL=https://user.realtutorialhub.com/login,GIT_SHA=${GIT_SHA}" \
    --set-secrets "JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,INTERNAL_API_KEY=INTERNAL_API_KEY:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,QSTASH_TOKEN=QSTASH_TOKEN:latest,QSTASH_CURRENT_SIGNING_KEY=QSTASH_CURRENT_SIGNING_KEY:latest,QSTASH_NEXT_SIGNING_KEY=QSTASH_NEXT_SIGNING_KEY:latest"

  log_success "realtutorialhub-web deployed"

  # Health check
  SERVICE_URL=$(gcloud run services describe realtutorialhub-web --region ${REGION} --format 'value(status.url)')
  if curl -sf "${SERVICE_URL}/api/healthz" > /dev/null; then
    log_success "RealTutorialHub Web health check passed"
  else
    log_warning "RealTutorialHub Web health check failed (may be expected)"
  fi
fi

###############################################################################
# DEPLOY SKILLUP
###############################################################################

if [ "$RUN_SKILLUP" = true ]; then
  log_step "Deploying SkillUp services..."

  # Get API URL
  API_URL=$(gcloud run services describe quiz-api-server --region ${REGION} --format 'value(status.url)')

  # Deploy skillup-web
  log_step "  Building skillup-web..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api \
    -f apps/skillup-web/Dockerfile \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA} \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:latest \
    .

  log_step "  Pushing skillup-web..."
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA}
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:latest

  log_step "  Deploying skillup-web to Cloud Run..."
  gcloud run deploy skillup-web \
    --image ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 3004 \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api,INTERNAL_API_URL=${API_URL}/api,GATEWAY_URL=https://api.skillupitacademy.com,GIT_SHA=${GIT_SHA}" \
    --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"

  log_success "skillup-web deployed"

  # Deploy skillup-admin
  log_step "  Building skillup-admin..."
  docker build \
    -f apps/skillup-admin/Dockerfile \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:${GIT_SHA} \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:latest \
    .

  log_step "  Pushing skillup-admin..."
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:${GIT_SHA}
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:latest

  log_step "  Deploying skillup-admin to Cloud Run..."
  gcloud run deploy skillup-admin \
    --image ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:${GIT_SHA} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 3005 \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" \
    --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"

  log_success "skillup-admin deployed"

  # Deploy faculty-app
  log_step "  Building faculty-app..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api \
    --build-arg NEXT_PUBLIC_APP_URL=https://faculty.skillupitacademy.com \
    -f apps/faculty-app/Dockerfile \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:${GIT_SHA} \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:latest \
    .

  log_step "  Pushing faculty-app..."
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:${GIT_SHA}
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:latest

  log_step "  Deploying faculty-app to Cloud Run..."
  gcloud run deploy faculty-app \
    --image ${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:${GIT_SHA} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 3006 \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" \
    --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,INTERNAL_API_URL=INTERNAL_API_URL:latest,NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL:latest"

  log_success "faculty-app deployed"

  # Deploy skillhubcore-admin
  log_step "  Building skillhubcore-admin..."
  docker build \
    -f apps/skillhubcore-admin/Dockerfile \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA} \
    -t ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:latest \
    .

  log_step "  Pushing skillhubcore-admin..."
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA}
  docker push ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:latest

  log_step "  Deploying skillhubcore-admin to Cloud Run..."
  gcloud run deploy skillhubcore-admin \
    --image ${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 3007 \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" \
    --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest"

  log_success "skillhubcore-admin deployed"

  log_success "SkillUp services deployed successfully"
fi

###############################################################################
# DEPLOY CLOUDFLARE GATEWAY
###############################################################################

log_step "Deploying Cloudflare API Gateway..."

cd services/api-gateway

# Resolve Cloud Run URLs
QUIZ_WEB_URL=$(gcloud run services describe quiz-web-app --region ${REGION} --format 'value(status.url)' 2>/dev/null || echo "")
RTH_ADMIN_URL=$(gcloud run services describe quiz-admin-app --region ${REGION} --format 'value(status.url)' 2>/dev/null || echo "")
SKILLUP_WEB_URL=$(gcloud run services describe skillup-web --region ${REGION} --format 'value(status.url)' 2>/dev/null || echo "")
SKILLUP_ADMIN_URL=$(gcloud run services describe skillup-admin --region ${REGION} --format 'value(status.url)' 2>/dev/null || echo "")
FACULTY_URL=$(gcloud run services describe faculty-app --region ${REGION} --format 'value(status.url)' 2>/dev/null || echo "")
TUTORIAL_SERVICE_URL=$(gcloud run services describe realtutorialhub-web --region ${REGION} --format 'value(status.url)' 2>/dev/null || echo "")
EXAM_SERVICE_URL=$(gcloud run services describe quiz-api-server --region ${REGION} --format 'value(status.url)' 2>/dev/null || echo "")

log_step "  Resolved Cloud Run URLs:"
echo "    QUIZ_WEB_URL: $QUIZ_WEB_URL"
echo "    RTH_ADMIN_URL: $RTH_ADMIN_URL"
echo "    SKILLUP_WEB_URL: $SKILLUP_WEB_URL"
echo "    TUTORIAL_SERVICE_URL: $TUTORIAL_SERVICE_URL"
echo "    EXAM_SERVICE_URL: $EXAM_SERVICE_URL"

log_step "  Deploying Cloudflare Worker..."
npx wrangler deploy --env production --keep-vars \
  --var ENVIRONMENT:production \
  --var LAST_VALIDATION_TIMESTAMP:$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --var QUIZ_WEB_URL:${QUIZ_WEB_URL} \
  --var RTH_ADMIN_URL:${RTH_ADMIN_URL} \
  --var SKILLUP_WEB_URL:${SKILLUP_WEB_URL} \
  --var SKILLUP_ADMIN_URL:${SKILLUP_ADMIN_URL} \
  --var FACULTY_URL:${FACULTY_URL} \
  --var STUDENT_FACULTY_URL:${FACULTY_URL} \
  --var TUTORIAL_SERVICE_URL:${TUTORIAL_SERVICE_URL} \
  --var EXAM_SERVICE_URL:${EXAM_SERVICE_URL} \
  --var NOTIFICATION_URL:${EXAM_SERVICE_URL}

cd ../..

log_success "Cloudflare API Gateway deployed"

###############################################################################
# FINAL SUMMARY
###############################################################################

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              DEPLOYMENT COMPLETED SUCCESSFULLY              ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Commit: ${GIT_SHA}${NC}"
echo -e "${GREEN}║  Region: ${REGION}${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$RUN_QUIZ" = true ]; then
  echo -e "${BLUE}Quiz Platform:${NC}"
  echo "  API Server:  $(gcloud run services describe quiz-api-server --region ${REGION} --format 'value(status.url)')"
  echo "  Web App:     $(gcloud run services describe quiz-web-app --region ${REGION} --format 'value(status.url)')"
  echo "  Admin App:   $(gcloud run services describe quiz-admin-app --region ${REGION} --format 'value(status.url)')"
  echo ""
fi

if [ "$RUN_TUTORIAL" = true ]; then
  echo -e "${BLUE}RealTutorialHub:${NC}"
  echo "  Web:         $(gcloud run services describe realtutorialhub-web --region ${REGION} --format 'value(status.url)')"
  echo ""
fi

if [ "$RUN_SKILLUP" = true ]; then
  echo -e "${BLUE}SkillUp:${NC}"
  echo "  Web:         $(gcloud run services describe skillup-web --region ${REGION} --format 'value(status.url)')"
  echo "  Admin:       $(gcloud run services describe skillup-admin --region ${REGION} --format 'value(status.url)')"
  echo "  Faculty:     $(gcloud run services describe faculty-app --region ${REGION} --format 'value(status.url)')"
  echo "  Core Admin:  $(gcloud run services describe skillhubcore-admin --region ${REGION} --format 'value(status.url)')"
  echo ""
fi

echo -e "${BLUE}Public URLs:${NC}"
echo "  RTH Web:     https://user.realtutorialhub.com"
echo "  RTH API:     https://api.realtutorialhub.com"
echo "  SkillUp Web: https://user.skillupitacademy.com"
echo "  SkillUp API: https://api.skillupitacademy.com"
echo ""

log_success "Deployment complete! Run production tests:"
echo "  TEST_HOST=user.realtutorialhub.com node tmp/test-onboarding-e2e.js"
echo "  TEST_HOST=user.skillupitacademy.com node tmp/test-onboarding-e2e.js"
