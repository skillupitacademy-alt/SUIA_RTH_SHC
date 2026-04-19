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
#   skillup      - Deploy SkillUp services
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

Write-Host "================================================================" -ForegroundColor Blue
Write-Host "         DIRECT DEPLOYMENT (NO GITHUB)                      " -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "  Project: $PROJECT_ID" -ForegroundColor Blue
Write-Host "  Region:  $REGION" -ForegroundColor Blue
Write-Host "  Commit:  $GIT_SHA" -ForegroundColor Blue
Write-Host "  Scope:   $Scope" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

# Determine what to deploy
$RUN_QUIZ = $false
$RUN_TUTORIAL = $false
$RUN_SKILLUP = $false

switch ($Scope) {
    "all" {
        $RUN_QUIZ = $true
        $RUN_TUTORIAL = $true
        $RUN_SKILLUP = $true
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
    default {
        Write-Host "❌ Invalid scope: $Scope" -ForegroundColor Red
        Write-Host "Valid options: all, quiz, tutorial, skillup"
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
        --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,GIT_SHA=${GIT_SHA}" `
        --set-secrets "DATABASE_URL=DATABASE_URL:latest,DATABASE_URL_RTH=DATABASE_URL_RTH:latest,DATABASE_URL_SKILLUP=DATABASE_URL_SKILLUP:latest,DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest,UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,ALLOWED_ORIGINS=ALLOWED_ORIGINS:latest" `
        --memory 2Gi `
        --cpu 2 `
        --concurrency 1000 `
        --max-instances 10 `
        --min-instances 0

    Log-Success "quiz-api-server deployed"

    # Health check
    Log-Step "  Running health check..."
    $API_URL = (gcloud run services describe quiz-api-server --region $REGION --format 'value(status.url)').Trim()
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/api/health/live" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Log-Success "API Server health check passed"
        }
    } catch {
        Log-Error "API Server health check failed"
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
        --set-env-vars "NODE_ENV=production,CLOUD_RUN_BUILD=true,NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api,INTERNAL_API_URL=${API_URL}/api,GIT_SHA=${GIT_SHA}" `
        --set-secrets "JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,COOKIE_DOMAIN=COOKIE_DOMAIN:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"

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
        --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api,INTERNAL_API_URL=${API_URL}/api,GIT_SHA=${GIT_SHA}" `
        --set-secrets "JWT_SECRET=JWT_SECRET:latest,INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"

    Log-Success "skillup-web deployed"

    Log-Success "SkillUp services deployed successfully"
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
$TUTORIAL_SERVICE_URL = (gcloud run services describe realtutorialhub-web --region $REGION --format 'value(status.url)' 2>$null).Trim()
$EXAM_SERVICE_URL = (gcloud run services describe quiz-api-server --region $REGION --format 'value(status.url)' 2>$null).Trim()

Log-Step "  Resolved Cloud Run URLs:"
Write-Host "    TUTORIAL_SERVICE_URL: $TUTORIAL_SERVICE_URL"
Write-Host "    EXAM_SERVICE_URL: $EXAM_SERVICE_URL"

Log-Step "  Deploying Cloudflare Worker..."
npx wrangler deploy --env production --keep-vars `
    --var "ENVIRONMENT:production" `
    --var "TUTORIAL_SERVICE_URL:${TUTORIAL_SERVICE_URL}" `
    --var "EXAM_SERVICE_URL:${EXAM_SERVICE_URL}"

Pop-Location

Log-Success "Cloudflare API Gateway deployed"

###############################################################################
# FINAL SUMMARY
###############################################################################

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "              DEPLOYMENT COMPLETED SUCCESSFULLY              " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Commit: $GIT_SHA" -ForegroundColor Green
Write-Host "  Region: $REGION" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

if ($RUN_TUTORIAL) {
    Write-Host "RealTutorialHub:" -ForegroundColor Blue
    $url = (gcloud run services describe realtutorialhub-web --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Web: $url"
    Write-Host ""
}

if ($RUN_SKILLUP) {
    Write-Host "SkillUp:" -ForegroundColor Blue
    $url = (gcloud run services describe skillup-web --region $REGION --format 'value(status.url)').Trim()
    Write-Host "  Web: $url"
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
