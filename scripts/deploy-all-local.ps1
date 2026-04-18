#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete deployment following GitHub workflow (without GitHub)
.DESCRIPTION
    Replicates the exact GitHub Actions workflow for deploying all services to GCP Cloud Run
    Region: asia-southeast1 (Singapore) - matching production
.PARAMETER Scope
    Deployment scope: all, quiz, tutorial, skillup, skillhubcore
.EXAMPLE
    ./scripts/deploy-all-local.ps1 -Scope "all"
#>

param(
    [ValidateSet("all", "quiz", "tutorial", "skillup", "skillhubcore")]
    [string]$Scope = "all"
)

$ErrorActionPreference = "Stop"

# Configuration - MATCHING GITHUB WORKFLOW
$GCP_PROJECT_ID = "project-48af6a2d-e8bb-46dd-a58"
$GCP_REGION = "asia-southeast1"  # Singapore - production region
$ARTIFACT_REGISTRY = "asia-southeast1-docker.pkg.dev/$GCP_PROJECT_ID/quiz-platform"
$COMMIT_SHA = (git rev-parse --short HEAD)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT CONFIGURATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Project ID: $GCP_PROJECT_ID" -ForegroundColor Gray
Write-Host "Region: $GCP_REGION (Singapore)" -ForegroundColor Gray
Write-Host "Commit SHA: $COMMIT_SHA" -ForegroundColor Gray
Write-Host "Scope: $Scope" -ForegroundColor Gray
Write-Host ""

# Determine what to deploy based on scope
$deployQuiz = $false
$deployTutorial = $false
$deploySkillup = $false
$deploySkillhubcore = $false

switch ($Scope) {
    "all" {
        $deployQuiz = $true
        $deployTutorial = $true
        $deploySkillup = $true
        $deploySkillhubcore = $true
    }
    "quiz" { $deployQuiz = $true }
    "tutorial" { $deployTutorial = $true }
    "skillup" { $deploySkillup = $true }
    "skillhubcore" { $deploySkillhubcore = $true }
}

# Change to project root
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Helper function to build and push Docker image
function Build-And-Push {
    param(
        [string]$ServiceName,
        [string]$Dockerfile,
        [hashtable]$BuildArgs = @{},
        [string]$ImageName
    )

    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "Building: $ServiceName" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow

    $imageTag = "${ARTIFACT_REGISTRY}/${ImageName}:${COMMIT_SHA}"
    $imageLatest = "${ARTIFACT_REGISTRY}/${ImageName}:latest"

    # Build args
    $buildArgsStr = ""
    foreach ($key in $BuildArgs.Keys) {
        $value = $BuildArgs[$key]
        $buildArgsStr += " --build-arg ${key}=${value}"
    }

    # Build
    $buildCmd = "docker build${buildArgsStr} -f $Dockerfile -t $imageTag -t $imageLatest ."
    Write-Host "Command: $buildCmd" -ForegroundColor Gray
    Invoke-Expression $buildCmd
    if ($LASTEXITCODE -ne 0) { throw "Build failed for $ServiceName" }

    # Push
    Write-Host "Pushing images..." -ForegroundColor Gray
    docker push $imageTag
    if ($LASTEXITCODE -ne 0) { throw "Push failed for $imageTag" }
    docker push $imageLatest
    if ($LASTEXITCODE -ne 0) { throw "Push failed for $imageLatest" }

    Write-Host "SUCCESS: $ServiceName" -ForegroundColor Green
    Write-Host ""

    return $imageTag
}

# Helper function to deploy to Cloud Run
function Deploy-Service {
    param(
        [string]$ServiceName,
        [string]$ImageTag,
        [int]$Port,
        [string]$Memory = "1Gi",
        [int]$MinInstances = 0,
        [int]$MaxInstances = 10,
        [hashtable]$EnvVars = @{},
        [string[]]$Secrets = @()
    )

    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "Deploying: $ServiceName" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow

    $deployArgs = @(
        "run", "deploy", $ServiceName,
        "--image=$ImageTag",
        "--region=$GCP_REGION",
        "--platform=managed",
        "--allow-unauthenticated",
        "--port=$Port",
        "--memory=$Memory",
        "--min-instances=$MinInstances",
        "--max-instances=$MaxInstances"
    )

    # Add env vars
    if ($EnvVars.Count -gt 0) {
        $envStr = ($EnvVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        $deployArgs += "--set-env-vars=$envStr"
    }

    # Add secrets
    if ($Secrets.Count -gt 0) {
        $secretsStr = $Secrets -join ","
        $deployArgs += "--set-secrets=$secretsStr"
    }

    & gcloud $deployArgs
    if ($LASTEXITCODE -ne 0) { throw "Deployment failed for $ServiceName" }

    Write-Host "SUCCESS: $ServiceName deployed" -ForegroundColor Green
    Write-Host ""
}

try {
    # Check authentication
    Write-Host "Checking GCP authentication..." -ForegroundColor Cyan
    $authCheck = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>&1
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($authCheck)) {
        throw "Not authenticated with GCP. Run: gcloud auth login"
    }
    Write-Host "Authenticated as: $authCheck" -ForegroundColor Green
    Write-Host ""

    # Configure Docker
    Write-Host "Configuring Docker for Artifact Registry..." -ForegroundColor Cyan
    gcloud auth configure-docker "$GCP_REGION-docker.pkg.dev" --quiet
    if ($LASTEXITCODE -ne 0) { throw "Failed to configure Docker" }
    Write-Host "Docker configured" -ForegroundColor Green
    Write-Host ""

    # ============================================================
    # QUIZ SERVICES (api-server, quiz-web-app, quiz-admin-app)
    # ============================================================
    if ($deployQuiz) {
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host "DEPLOYING QUIZ SERVICES" -ForegroundColor Cyan
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host ""

        # 1. API Server
        $apiImage = Build-And-Push `
            -ServiceName "quiz-api-server" `
            -Dockerfile "apps/api-server/Dockerfile" `
            -ImageName "quiz-api-server" `
            -BuildArgs @{
                NEXT_PUBLIC_API_URL = "https://api.realtutorialhub.com/api"
                NEXT_PUBLIC_WEB_APP_URL = "https://user.realtutorialhub.com"
                NEXT_PUBLIC_ADMIN_URL = "https://admin.realtutorialhub.com"
                NEXT_PUBLIC_SENTRY_DSN = "https://79aa148938b04d21381b9086fa4e4a75@o4510960730308608.ingest.us.sentry.io/4510960802201600"
            }

        Deploy-Service `
            -ServiceName "quiz-api-server" `
            -ImageTag $apiImage `
            -Port 3000 `
            -Memory "2Gi" `
            -MaxInstances 10 `
            -EnvVars @{
                NODE_ENV = "production"
                CLOUD_RUN_BUILD = "true"
            } `
            -Secrets @(
                "DATABASE_URL=DATABASE_URL:latest",
                "DATABASE_URL_RTH=DATABASE_URL_RTH:latest",
                "DATABASE_URL_SKILLUP=DATABASE_URL_SKILLUP:latest",
                "DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest",
                "UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest",
                "UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest",
                "JWT_SECRET=JWT_SECRET:latest",
                "JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest",
                "ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest",
                "RESEND_API_KEY=RESEND_API_KEY:latest",
                "INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest",
                "CSRF_SECRET=CSRF_SECRET:latest"
            )

        # 2. Quiz Web App
        $quizWebImage = Build-And-Push `
            -ServiceName "quiz-web-app" `
            -Dockerfile "apps/realtutorialhub-quiz/Dockerfile" `
            -ImageName "quiz-web-app" `
            -BuildArgs @{
                NEXT_PUBLIC_API_URL = "https://api.realtutorialhub.com/api"
                NEXT_PUBLIC_WEB_APP_URL = "https://quiz.skillhubcore.in"
                NEXT_PUBLIC_ADMIN_URL = "https://admin.realtutorialhub.com"
            }

        Deploy-Service `
            -ServiceName "quiz-web-app" `
            -ImageTag $quizWebImage `
            -Port 3001 `
            -Memory "1Gi" `
            -MaxInstances 10 `
            -EnvVars @{
                NODE_ENV = "production"
                CLOUD_RUN_BUILD = "true"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest"
            )

        # 3. Quiz Admin App
        $quizAdminImage = Build-And-Push `
            -ServiceName "quiz-admin-app" `
            -Dockerfile "apps/realtutorialhub-admin/Dockerfile" `
            -ImageName "quiz-admin-app" `
            -BuildArgs @{
                NEXT_PUBLIC_API_URL = "https://api.realtutorialhub.com/api"
                NEXT_PUBLIC_WEB_APP_URL = "https://quiz.skillhubcore.in"
                NEXT_PUBLIC_ADMIN_URL = "https://admin.realtutorialhub.com"
            }

        Deploy-Service `
            -ServiceName "quiz-admin-app" `
            -ImageTag $quizAdminImage `
            -Port 3002 `
            -Memory "1Gi" `
            -MaxInstances 10 `
            -EnvVars @{
                NODE_ENV = "production"
                CLOUD_RUN_BUILD = "true"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "ADMIN_JWT_SECRET=ADMIN_JWT_SECRET:latest"
            )
    }

    # ============================================================
    # TUTORIAL SERVICE (realtutorialhub-web)
    # ============================================================
    if ($deployTutorial) {
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host "DEPLOYING TUTORIAL SERVICE" -ForegroundColor Cyan
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host ""

        $tutorialImage = Build-And-Push `
            -ServiceName "realtutorialhub-web" `
            -Dockerfile "apps/realtutorialhub-web/Dockerfile" `
            -ImageName "realtutorialhub-web" `
            -BuildArgs @{
                NEXT_PUBLIC_API_URL = "https://api.realtutorialhub.com/api"
                NEXT_PUBLIC_WEB_APP_URL = "https://user.realtutorialhub.com"
                NEXT_PUBLIC_ADMIN_URL = "https://admin.realtutorialhub.com"
                NEXT_PUBLIC_SITE_URL = "https://user.realtutorialhub.com"
                NEXT_PUBLIC_APP_URL = "https://user.realtutorialhub.com"
                NEXT_PUBLIC_LOGIN_URL = "https://user.realtutorialhub.com/login"
            }

        # Get API URL for internal communication
        $apiUrl = gcloud run services describe quiz-api-server --region $GCP_REGION --format="value(status.url)"
        
        Deploy-Service `
            -ServiceName "realtutorialhub-web" `
            -ImageTag $tutorialImage `
            -Port 3003 `
            -Memory "1Gi" `
            -MaxInstances 10 `
            -EnvVars @{
                NODE_ENV = "production"
                CLOUD_RUN_BUILD = "true"
                NEXT_PUBLIC_API_URL = "https://api.realtutorialhub.com/api"
                INTERNAL_API_URL = "$apiUrl/api"
                NEXT_PUBLIC_WEB_APP_URL = "https://user.realtutorialhub.com"
                NEXT_PUBLIC_ADMIN_URL = "https://admin.realtutorialhub.com"
                NEXT_PUBLIC_SITE_URL = "https://user.realtutorialhub.com"
                NEXT_PUBLIC_APP_URL = "https://user.realtutorialhub.com"
                NEXT_PUBLIC_LOGIN_URL = "https://user.realtutorialhub.com/login"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest",
                "INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"
            )
    }

    # ============================================================
    # SKILLUP SERVICES (skillup-web, skillup-admin, faculty-app, skillhubcore-admin)
    # ============================================================
    if ($deploySkillup) {
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host "DEPLOYING SKILLUP SERVICES" -ForegroundColor Cyan
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host ""

        # Get API URL for internal communication
        $apiUrl = gcloud run services describe quiz-api-server --region $GCP_REGION --format="value(status.url)"

        # 1. SkillUp Web
        $skillupWebImage = Build-And-Push `
            -ServiceName "skillup-web" `
            -Dockerfile "apps/skillup-web/Dockerfile" `
            -ImageName "skillup-web" `
            -BuildArgs @{
                NEXT_PUBLIC_API_URL = "https://api.skillupitacademy.com/api"
            }

        Deploy-Service `
            -ServiceName "skillup-web" `
            -ImageTag $skillupWebImage `
            -Port 3004 `
            -Memory "512Mi" `
            -MaxInstances 5 `
            -EnvVars @{
                NODE_ENV = "production"
                NEXT_PUBLIC_API_URL = "https://api.skillupitacademy.com/api"
                INTERNAL_API_URL = "$apiUrl/api"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"
            )

        # 2. SkillUp Admin
        $skillupAdminImage = Build-And-Push `
            -ServiceName "skillup-admin" `
            -Dockerfile "apps/skillup-admin/Dockerfile" `
            -ImageName "skillup-admin"

        Deploy-Service `
            -ServiceName "skillup-admin" `
            -ImageTag $skillupAdminImage `
            -Port 3005 `
            -Memory "512Mi" `
            -MaxInstances 5 `
            -EnvVars @{
                NODE_ENV = "production"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"
            )

        # 3. Faculty App
        $facultyImage = Build-And-Push `
            -ServiceName "faculty-app" `
            -Dockerfile "apps/faculty-app/Dockerfile" `
            -ImageName "faculty-app" `
            -BuildArgs @{
                NEXT_PUBLIC_API_URL = "https://api.skillupitacademy.com/api"
                NEXT_PUBLIC_APP_URL = "https://faculty.skillupitacademy.com"
            }

        Deploy-Service `
            -ServiceName "faculty-app" `
            -ImageTag $facultyImage `
            -Port 3006 `
            -Memory "512Mi" `
            -MaxInstances 5 `
            -EnvVars @{
                NODE_ENV = "production"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest"
            )

        # 4. SkillHubCore Admin
        $skillhubcoreAdminImage = Build-And-Push `
            -ServiceName "skillhubcore-admin" `
            -Dockerfile "apps/skillhubcore-admin/Dockerfile" `
            -ImageName "skillhubcore-admin"

        Deploy-Service `
            -ServiceName "skillhubcore-admin" `
            -ImageTag $skillhubcoreAdminImage `
            -Port 3007 `
            -Memory "512Mi" `
            -MaxInstances 5 `
            -EnvVars @{
                NODE_ENV = "production"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "INTERNAL_GATEWAY_SECRET=INTERNAL_GATEWAY_SECRET:latest",
                "DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest"
            )
    }

    # ============================================================
    # SKILLHUBCORE SERVICES (skillhub-placement, skillhubcore-service)
    # ============================================================
    if ($deploySkillhubcore) {
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host "DEPLOYING SKILLHUBCORE SERVICES" -ForegroundColor Cyan
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host ""

        # 1. SkillHub Placement
        $placementImage = Build-And-Push `
            -ServiceName "skillhub-placement" `
            -Dockerfile "apps/skillhub-placement/Dockerfile" `
            -ImageName "skillhub-placement"

        Deploy-Service `
            -ServiceName "skillhub-placement" `
            -ImageTag $placementImage `
            -Port 3008 `
            -Memory "512Mi" `
            -MaxInstances 5 `
            -EnvVars @{
                NODE_ENV = "production"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "DATABASE_URL_PLACEMENT=DATABASE_URL_PLACEMENT:latest"
            )

        # 2. SkillHubCore Service
        $skillhubcoreImage = Build-And-Push `
            -ServiceName "skillhubcore-service" `
            -Dockerfile "services/skillhubcore-service/Dockerfile" `
            -ImageName "skillhubcore-service"

        Deploy-Service `
            -ServiceName "skillhubcore-service" `
            -ImageTag $skillhubcoreImage `
            -Port 3009 `
            -Memory "512Mi" `
            -MaxInstances 5 `
            -EnvVars @{
                NODE_ENV = "production"
            } `
            -Secrets @(
                "JWT_SECRET=JWT_SECRET:latest",
                "DATABASE_URL_PEOPLE=DATABASE_URL_PEOPLE:latest"
            )
    }

    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "To view all services:" -ForegroundColor Cyan
    Write-Host "  gcloud run services list --region=$GCP_REGION --project=$GCP_PROJECT_ID" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To view service URLs:" -ForegroundColor Cyan
    Write-Host "  gcloud run services describe [SERVICE_NAME] --region=$GCP_REGION --format='value(status.url)'" -ForegroundColor Gray

} catch {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Gray
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
