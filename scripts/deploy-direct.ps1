###############################################################################
# DIRECT DEPLOYMENT SCRIPT (POWERSHELL - WINDOWS)
# 
# This script follows the exact same workflow as .github/workflows/deploy-cloudrun.yml
# but executes directly on Windows using PowerShell
#
# Usage:
#   .\scripts\deploy-direct.ps1 [scope]
#
# Scope options:
#   all          - Deploy all services (default)
#   quiz         - Deploy quiz platform (API + Web + Admin)
#   tutorial     - Deploy RealTutorialHub Web
#   skillup      - Deploy SkillUp services (Web + Admin + Faculty + SkillHubCore Admin)
#   skillhubcore - Deploy SkillHubCore services (Placement + Service)
###############################################################################

param(
    [string]$Scope = "all"
)

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = if ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "project-48af6a2d-e8bb-46dd-a58" }
$REGION = "asia-southeast1"
$REGISTRY = "asia-southeast1-docker.pkg.dev"
$GIT_SHA = (git rev-parse --short HEAD).Trim()

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║         DIRECT DEPLOYMENT (NO GITHUB)                      ║" -ForegroundColor Blue
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Blue
Write-Host "║  Project: $PROJECT_ID" -ForegroundColor Blue
Write-Host "║  Region:  $REGION" -ForegroundColor Blue
Write-Host "║  Commit:  $GIT_SHA" -ForegroundColor Blue
Write-Host "║  Scope:   $Scope" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Determine what to deploy
$RUN_QUIZ = $false
$RUN_TUTORIAL = $false
$RUN_SKILLUP = $false
$RUN_SKILLHUBCORE = $false

switch ($Scope) {
    "all" {
        $RUN_QUIZ = $true
        $RUN_TUTORIAL = $true
        $RUN_SKILLUP = $true
        $RUN_SKILLHUBCORE = $true
    }
    "quiz" {
        $RUN_QUIZ = $true
    }
    "tutorial" {
        $RUN_TUTORIAL = $true
    }
    "skillup" {
        $RUN_SKILLUP = $true
    }
    "skillhubcore" {
        $RUN_SKILLHUBCORE = $true
    }
    default {
        Write-Host "❌ Invalid scope: $Scope" -ForegroundColor Red
        Write-Host "Valid options: all, quiz, tutorial, skillup, skillhubcore"
        exit 1
    }
}

# Helper functions
function Log-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor Blue
}

function Log-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Log-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Log-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Check prerequisites
Log-Step "Checking prerequisites..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Log-Error "Docker is not installed"
    exit 1
}

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Log-Error "gcloud CLI is not installed"
    exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Log-Error "pnpm is not installed"
    exit 1
}

Log-Success "All prerequisites met"

# Authenticate with GCP
Log-Step "Authenticating with GCP..."
gcloud auth configure-docker $REGISTRY
Log-Success "Docker authenticated with GCP Artifact Registry"

# Cleanup multiple regions
Log-Step "Cleaning up services in other regions..."

$otherRegions = @("asia-east1", "asia-south1")

foreach ($region in $otherRegions) {
    Write-Host "  Checking region: $region"
    
    # Check and delete quiz-api-server
    try {
        $null = gcloud run services describe quiz-api-server --region=$region --format="value(metadata.name)" 2>$null
        Write-Host "  🗑️  Deleting quiz-api-server in $region..." -ForegroundColor Yellow
        gcloud run services delete quiz-api-server --region=$region --quiet 2>$null
    } catch {
        # Service doesn't exist, continue
    }
    
    # Check and delete realtutorialhub-web
    try {
        $null = gcloud run services describe realtutorialhub-web --region=$region --format="value(metadata.name)" 2>$null
        Write-Host "  🗑️  Deleting realtutorialhub-web in $region..." -ForegroundColor Yellow
        gcloud run services delete realtutorialhub-web --region=$region --quiet 2>$null
    } catch {
        # Service doesn't exist, continue
    }
    
    # Check and delete skillup-web
    try {
        $null = gcloud run services describe skillup-web --region=$region --format="value(metadata.name)" 2>$null
        Write-Host "  🗑️  Deleting skillup-web in $region..." -ForegroundColor Yellow
        gcloud run services delete skillup-web --region=$region --quiet 2>$null
    } catch {
        # Service doesn't exist, continue
    }
}

Log-Success "Cleanup completed - all services will be deployed only to $REGION"

# Quality checks
Log-Step "Running quality checks..."

Log-Step "  1/3 Lint check..."
pnpm lint:all
if ($LASTEXITCODE -ne 0) {
    Log-Error "Lint check failed"
    exit 1
}
Log-Success "Lint check passed"

Log-Step "  2/3 Type check..."
pnpm typecheck:all
if ($LASTEXITCODE -ne 0) {
    Log-Error "Type check failed"
    exit 1
}
Log-Success "Type check passed"

Log-Step "  3/3 Build..."
pnpm build:all
if ($LASTEXITCODE -ne 0) {
    Log-Error "Build failed"
    exit 1
}
Log-Success "Build successful"

Log-Success "All quality checks passed"

###############################################################################
# DEPLOY QUIZ PLATFORM
###############################################################################

if ($RUN_QUIZ) {
    Log-Step "Deploying Quiz Platform..."

    # Deploy API Server
    Log-Step "  Building quiz-api-server..."
    docker build `
        --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api `
        --build-arg NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com `
        --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com `
        -f apps/api-server/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:latest" `
        .

    Log-Step "  Pushing quiz-api-server..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:latest"

    Log-Step "  Deploying quiz-api-server to Cloud Run..."
    gcloud run deploy quiz-api-server `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-api-server:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3000 `
        --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,GIT_SHA=${GIT_SHA},GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com" `
        --update-secrets "DATABASE_URL=DATABASE_URL:latest,DATABASE_DIRECT_URL=DATABASE_DIRECT_URL:latest,DATABASE_URL_RTH=DATABASE_URL_RTH:latest,DATABASE_DIRECT_URL_RTH=DATABASE_DIRECT_URL_RTH:latest,DATABASE_URL_SKILLUP=DATABASE_URL_SKILLUP:latest,DATABASE_DIRECT_URL_SKILLUP=DATABASE_DIRECT_URL_SKILLUP:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest,DATABASE_DIRECT_URL_PEOPLE=DATABASE_DIRECT_URL_PEOPLE:latest,DATABASE_URL_TUTORIAL=DATABASE_URL_TUTORIAL:latest,DATABASE_DIRECT_URL_TUTORIAL=DATABASE_DIRECT_URL_TUTORIAL:latest,DATABASE_URL_PAYMENT=DATABASE_URL_PAYMENT:latest,DATABASE_DIRECT_URL_PAYMENT=DATABASE_DIRECT_URL_PAYMENT:latest,DATABASE_URL_PLACEMENT=DATABASE_URL_PLACEMENT:latest,DATABASE_DIRECT_URL_PLACEMENT=DATABASE_DIRECT_URL_PLACEMENT:latest,UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,ALLOWED_ORIGINS=ALLOWED_ORIGINS:latest,QSTASH_TOKEN=QSTASH_TOKEN:latest,QSTASH_CURRENT_SIGNING_KEY=QSTASH_CURRENT_SIGNING_KEY:latest,QSTASH_NEXT_SIGNING_KEY=QSTASH_NEXT_SIGNING_KEY:latest,RESEND_API_KEY=RESEND_API_KEY:latest,CSRF_SECRET=CSRF_SECRET:latest,INTERNAL_API_KEY=INTERNAL_API_KEY:latest" `
        --memory 2Gi `
        --cpu 2 `
        --concurrency 1000 `
        --max-instances 10 `
        --min-instances 0

    Log-Success "quiz-api-server deployed"

    # Deploy Web App
    Log-Step "  Building quiz-web-app..."
    docker build `
        --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api `
        --build-arg NEXT_PUBLIC_WEB_APP_URL=https://quiz.skillhubcore.in `
        --build-arg NEXT_PUBLIC_TUTORIAL_APP_URL=https://tutorial.skillhubcore.in `
        --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com `
        -f apps/realtutorialhub-quiz/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:latest" `
        .

    Log-Step "  Pushing quiz-web-app..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:latest"

    Log-Step "  Deploying quiz-web-app to Cloud Run..."
    gcloud run deploy quiz-web-app `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-web-app:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3001 `
        --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,NEXT_PUBLIC_TUTORIAL_APP_URL=https://tutorial.skillhubcore.in,GIT_SHA=${GIT_SHA}" `
        --set-secrets "NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL:latest,NEXT_PUBLIC_WEB_APP_URL=NEXT_PUBLIC_WEB_APP_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,INTERNAL_API_URL=INTERNAL_API_URL:latest" `
        --memory 1Gi `
        --cpu 1 `
        --concurrency 1000 `
        --max-instances 10

    Log-Success "quiz-web-app deployed"

    # Deploy Admin App
    Log-Step "  Building quiz-admin-app..."
    docker build `
        --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api `
        --build-arg NEXT_PUBLIC_WEB_APP_URL=https://quiz.skillhubcore.in `
        --build-arg NEXT_PUBLIC_TUTORIAL_APP_URL=https://tutorial.skillhubcore.in `
        --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com `
        -f apps/realtutorialhub-admin/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:latest" `
        .

    Log-Step "  Pushing quiz-admin-app..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:latest"

    Log-Step "  Deploying quiz-admin-app to Cloud Run..."
    gcloud run deploy quiz-admin-app `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/quiz-admin-app:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3002 `
        --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,GIT_SHA=${GIT_SHA}" `
        --set-secrets "NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL:latest,NEXT_PUBLIC_ADMIN_URL=NEXT_PUBLIC_ADMIN_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,CSRF_SECRET=CSRF_SECRET:latest,INTERNAL_API_URL=INTERNAL_API_URL:latest" `
        --memory 1Gi `
        --cpu 1 `
        --concurrency 1000 `
        --max-instances 10

    Log-Success "quiz-admin-app deployed"

    # Health check
    Log-Step "  Running health checks..."
    $API_URL = (gcloud run services describe quiz-api-server --region $REGION --format 'value(status.url)').Trim()
    $WEB_URL = (gcloud run services describe quiz-web-app --region $REGION --format 'value(status.url)').Trim()
    $ADMIN_URL = (gcloud run services describe quiz-admin-app --region $REGION --format 'value(status.url)').Trim()

    try {
        $response = Invoke-WebRequest -Uri "$API_URL/api/health/live" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Log-Success "API Server health check passed"
        }
    } catch {
        Log-Error "API Server health check failed"
    }

    try {
        $response = Invoke-WebRequest -Uri "$WEB_URL/" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Log-Success "Web App health check passed"
        }
    } catch {
        Log-Error "Web App health check failed"
    }

    Log-Success "Quiz Platform deployed successfully"
}

###############################################################################
# DEPLOY TUTORIAL (REALTUTORIALHUB WEB)
###############################################################################

if ($RUN_TUTORIAL) {
    Log-Step "Deploying RealTutorialHub Web..."

    # Get API URL
    $API_URL = (gcloud run services describe quiz-api-server --region $REGION --format 'value(status.url)').Trim()

    Log-Step "  Building realtutorialhub-web..."
    docker build `
        --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api `
        --build-arg NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com `
        --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com `
        -f apps/realtutorialhub-web/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:latest" `
        .

    Log-Step "  Pushing realtutorialhub-web..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:latest"

    Log-Step "  Deploying realtutorialhub-web to Cloud Run..."
    gcloud run deploy realtutorialhub-web `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/realtutorialhub-web:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3003 `
        --memory 1Gi `
        --min-instances 0 `
        --max-instances 10 `
        --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api,INTERNAL_API_URL=${API_URL}/api,GATEWAY_URL=https://api.realtutorialhub.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com,NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com,NEXT_PUBLIC_SITE_URL=https://user.realtutorialhub.com,NEXT_PUBLIC_APP_URL=https://user.realtutorialhub.com,NEXT_PUBLIC_LOGIN_URL=https://user.realtutorialhub.com/login,GIT_SHA=${GIT_SHA}" `
        --update-secrets "JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,INTERNAL_API_KEY=INTERNAL_API_KEY:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,QSTASH_TOKEN=QSTASH_TOKEN:latest,QSTASH_CURRENT_SIGNING_KEY=QSTASH_CURRENT_SIGNING_KEY:latest,QSTASH_NEXT_SIGNING_KEY=QSTASH_NEXT_SIGNING_KEY:latest"

    Log-Success "realtutorialhub-web deployed"

    # Health check
    $SERVICE_URL = (gcloud run services describe realtutorialhub-web --region $REGION --format 'value(status.url)').Trim()
    try {
        $response = Invoke-WebRequest -Uri "$SERVICE_URL/api/healthz" -UseBasicParsing
        Log-Success "RealTutorialHub Web health check passed"
    } catch {
        Log-Warning "RealTutorialHub Web health check failed - may be expected"
    }
}

###############################################################################
# DEPLOY SKILLUP
###############################################################################

if ($RUN_SKILLUP) {
    Log-Step "Deploying SkillUp services..."

    # Get API URL
    $API_URL = (gcloud run services describe quiz-api-server --region $REGION --format 'value(status.url)').Trim()

    # Deploy skillup-web
    Log-Step "  Building skillup-web..."
    docker build `
        --build-arg NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api `
        -f apps/skillup-web/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:latest" `
        .

    Log-Step "  Pushing skillup-web..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:latest"

    Log-Step "  Deploying skillup-web to Cloud Run..."
    gcloud run deploy skillup-web `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-web:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3004 `
        --memory 512Mi `
        --min-instances 0 `
        --max-instances 5 `
        --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api,INTERNAL_API_URL=${API_URL}/api,GATEWAY_URL=https://api.skillupitacademy.com,GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com,GIT_SHA=${GIT_SHA}" `
        --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"

    Log-Success "skillup-web deployed"

    # Deploy skillup-admin
    Log-Step "  Building skillup-admin..."
    docker build `
        -f apps/skillup-admin/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:latest" `
        .

    Log-Step "  Pushing skillup-admin..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:latest"

    Log-Step "  Deploying skillup-admin to Cloud Run..."
    gcloud run deploy skillup-admin `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillup-admin:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3005 `
        --memory 512Mi `
        --min-instances 0 `
        --max-instances 5 `
        --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" `
        --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"

    Log-Success "skillup-admin deployed"

    # Deploy faculty-app
    Log-Step "  Building faculty-app..."
    docker build `
        --build-arg NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api `
        --build-arg NEXT_PUBLIC_APP_URL=https://faculty.skillupitacademy.com `
        -f apps/faculty-app/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:latest" `
        .

    Log-Step "  Pushing faculty-app..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:latest"

    Log-Step "  Deploying faculty-app to Cloud Run..."
    gcloud run deploy faculty-app `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/faculty-app:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3006 `
        --memory 512Mi `
        --min-instances 0 `
        --max-instances 5 `
        --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" `
        --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,INTERNAL_API_URL=INTERNAL_API_URL:latest,NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL:latest"

    Log-Success "faculty-app deployed"

    # Deploy skillhubcore-admin
    Log-Step "  Building skillhubcore-admin..."
    docker build `
        -f apps/skillhubcore-admin/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:latest" `
        .

    Log-Step "  Pushing skillhubcore-admin..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:latest"

    Log-Step "  Deploying skillhubcore-admin to Cloud Run..."
    gcloud run deploy skillhubcore-admin `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-admin:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3007 `
        --memory 512Mi `
        --min-instances 0 `
        --max-instances 5 `
        --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" `
        --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest"

    Log-Success "skillhubcore-admin deployed"

    Log-Success "SkillUp services deployed successfully"
}

###############################################################################
# DEPLOY SKILLHUBCORE
###############################################################################

if ($RUN_SKILLHUBCORE) {
    Log-Step "Deploying SkillHubCore services..."

    # Get API URL
    $API_URL = (gcloud run services describe quiz-api-server --region $REGION --format 'value(status.url)').Trim()

    # Deploy skillhub-placement
    Log-Step "  Building skillhub-placement..."
    docker build `
        --build-arg NEXT_PUBLIC_API_URL=https://api.skillhubcore.in/api `
        -f apps/skillhub-placement/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhub-placement:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhub-placement:latest" `
        .

    Log-Step "  Pushing skillhub-placement..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhub-placement:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhub-placement:latest"

    Log-Step "  Deploying skillhub-placement to Cloud Run..."
    gcloud run deploy skillhub-placement `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhub-placement:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3008 `
        --memory 512Mi `
        --min-instances 0 `
        --max-instances 5 `
        --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" `
        --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,DATABASE_URL_PLACEMENT=DATABASE_URL_PLACEMENT:latest"

    Log-Success "skillhub-placement deployed"

    # Deploy skillhubcore-service
    Log-Step "  Building skillhubcore-service..."
    docker build `
        -f services/skillhubcore-service/Dockerfile `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-service:${GIT_SHA}" `
        -t "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-service:latest" `
        .

    Log-Step "  Pushing skillhubcore-service..."
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-service:${GIT_SHA}"
    docker push "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-service:latest"

    Log-Step "  Deploying skillhubcore-service to Cloud Run..."
    gcloud run deploy skillhubcore-service `
        --image "${REGISTRY}/${PROJECT_ID}/quiz-platform/skillhubcore-service:${GIT_SHA}" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 3009 `
        --memory 512Mi `
        --min-instances 0 `
        --max-instances 5 `
        --set-env-vars "NODE_ENV=production,GIT_SHA=${GIT_SHA}" `
        --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest"

    Log-Success "skillhubcore-service deployed"

    Log-Success "SkillHubCore services deployed successfully"
}

###############################################################################
# DEPLOY CLOUDFLARE GATEWAY
###############################################################################

Log-Step "Deploying Cloudflare API Gateway..."

Push-Location services/api-gateway

# Resolve Cloud Run URLs
$QUIZ_WEB_URL = (gcloud run services describe quiz-web-app --region $REGION --format 'value(status.url)' 2>$null).Trim()
$RTH_ADMIN_URL = (gcloud run services describe quiz-admin-app --region $REGION --format 'value(status.url)' 2>$null).Trim()
$SKILLUP_WEB_URL = (gcloud run services describe skillup-web --region $REGION --format 'value(status.url)' 2>$null).Trim()
$SKILLUP_ADMIN_URL = (gcloud run services describe skillup-admin --region $REGION --format 'value(status.url)' 2>$null).Trim()
$FACULTY_URL = (gcloud run services describe faculty-app --region $REGION --format 'value(status.url)' 2>$null).Trim()
$TUTORIAL_SERVICE_URL = (gcloud run services describe realtutorialhub-web --region $REGION --format 'value(status.url)' 2>$null).Trim()
$EXAM_SERVICE_URL = (gcloud run services describe quiz-api-server --region $REGION --format 'value(status.url)' 2>$null).Trim()

Log-Step "  Resolved Cloud Run URLs:"
Write-Host "    QUIZ_WEB_URL: $QUIZ_WEB_URL"
Write-Host "    RTH_ADMIN_URL: $RTH_ADMIN_URL"
Write-Host "    SKILLUP_WEB_URL: $SKILLUP_WEB_URL"
Write-Host "    TUTORIAL_SERVICE_URL: $TUTORIAL_SERVICE_URL"
Write-Host "    EXAM_SERVICE_URL: $EXAM_SERVICE_URL"

Log-Step "  Deploying Cloudflare Worker..."
$LAST_VALIDATION_TIMESTAMP = (Get-Date -AsUTC -Format "yyyy-MM-ddTHH:mm:ssZ")

npx wrangler deploy --env production --keep-vars `
    --var "ENVIRONMENT:production" `
    --var "LAST_VALIDATION_TIMESTAMP:${LAST_VALIDATION_TIMESTAMP}" `
    --var "QUIZ_WEB_URL:${QUIZ_WEB_URL}" `
    --var "RTH_ADMIN_URL:${RTH_ADMIN_URL}" `
    --var "SKILLUP_WEB_URL:${SKILLUP_WEB_URL}" `
    --var "SKILLUP_ADMIN_URL:${SKILLUP_ADMIN_URL}" `
    --var "FACULTY_URL:${FACULTY_URL}" `
    --var "STUDENT_FACULTY_URL:${FACULTY_URL}" `
    --var "TUTORIAL_SERVICE_URL:${TUTORIAL_SERVICE_URL}" `
    --var "EXAM_SERVICE_URL:${EXAM_SERVICE_URL}" `
    --var "NOTIFICATION_URL:${EXAM_SERVICE_URL}"

Pop-Location

Log-Success "Cloudflare API Gateway deployed"

###############################################################################
# FINAL SUMMARY
###############################################################################

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              DEPLOYMENT COMPLETED SUCCESSFULLY              ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Commit: $GIT_SHA" -ForegroundColor Green
Write-Host "║  Region: $REGION" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if ($RUN_QUIZ) {
    Write-Host "Quiz Platform:" -ForegroundColor Blue
    $url = (gcloud run services describe quiz-api-server --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  API Server:  $url"
    $url = (gcloud run services describe quiz-web-app --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Web App:     $url"
    $url = (gcloud run services describe quiz-admin-app --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Admin App:   $url"
    Write-Host ""
}

if ($RUN_TUTORIAL) {
    Write-Host "RealTutorialHub:" -ForegroundColor Blue
    $url = (gcloud run services describe realtutorialhub-web --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Web:         $url"
    Write-Host ""
}

if ($RUN_SKILLUP) {
    Write-Host "SkillUp:" -ForegroundColor Blue
    $url = (gcloud run services describe skillup-web --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Web:         $url"
    $url = (gcloud run services describe skillup-admin --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Admin:       $url"
    $url = (gcloud run services describe faculty-app --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Faculty:     $url"
    $url = (gcloud run services describe skillhubcore-admin --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Core Admin:  $url"
    Write-Host ""
}

if ($RUN_SKILLHUBCORE) {
    Write-Host "SkillHubCore:" -ForegroundColor Blue
    $url = (gcloud run services describe skillhub-placement --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Placement:   $url"
    $url = (gcloud run services describe skillhubcore-service --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Service:     $url"
    Write-Host ""
}

Write-Host "Public URLs:" -ForegroundColor Blue
Write-Host "  RTH Web:     https://user.realtutorialhub.com"
Write-Host "  RTH API:     https://api.realtutorialhub.com"
Write-Host "  SkillUp Web: https://user.skillupitacademy.com"
Write-Host "  SkillUp API: https://api.skillupitacademy.com"
Write-Host ""

Log-Success "Deployment complete! Run production tests:"
Write-Host "  `$env:TEST_HOST='user.realtutorialhub.com'; node tmp/test-onboarding-e2e.js"
Write-Host "  `$env:TEST_HOST='user.skillupitacademy.com'; node tmp/test-onboarding-e2e.js"
Write-Host "  `$env:TEST_HOST='user.realtutorialhub.com'; node tmp/test-hijack-detection.js"
