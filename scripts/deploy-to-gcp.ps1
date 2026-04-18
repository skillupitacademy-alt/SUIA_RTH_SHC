#!/usr/bin/env pwsh
param(
    [string]$Services = "all",
    [switch]$SkipBuild = $false,
    [switch]$SkipDeploy = $false
)

$ErrorActionPreference = "Stop"

# Configuration
$GCP_PROJECT_ID = "project-48af6a2d-e8bb-46dd-a58"
$GCP_REGION = "asia-south1"
$ARTIFACT_REGISTRY = "asia-south1-docker.pkg.dev/$GCP_PROJECT_ID/quiz-platform"
$COMMIT_SHA = (git rev-parse --short HEAD)

# Service configurations
$serviceConfigs = @{
    "api-server" = @{
        Name = "api-server"
        Dockerfile = "apps/api-server/Dockerfile"
        CloudRunService = "quiz-api-server"
        Port = 3000
        BuildArgs = @{
            NEXT_PUBLIC_API_URL = "https://api.realtutorialhub.com/api"
            NEXT_PUBLIC_WEB_APP_URL = "https://user.realtutorialhub.com"
            NEXT_PUBLIC_ADMIN_URL = "https://admin.realtutorialhub.com"
            NEXT_PUBLIC_SENTRY_DSN = "https://79aa148938b04d21381b9086fa4e4a75@o4510960730308608.ingest.us.sentry.io/4510960802201600"
        }
    }
    "realtutorialhub-web" = @{
        Name = "realtutorialhub-web"
        Dockerfile = "apps/realtutorialhub-web/Dockerfile"
        CloudRunService = "realtutorialhub-web"
        Port = 3003
        BuildArgs = @{
            NEXT_PUBLIC_API_URL = "https://api.realtutorialhub.com/api"
            NEXT_PUBLIC_WEB_APP_URL = "https://user.realtutorialhub.com"
            NEXT_PUBLIC_ADMIN_URL = "https://admin.realtutorialhub.com"
            NEXT_PUBLIC_SITE_URL = "https://user.realtutorialhub.com"
            NEXT_PUBLIC_APP_URL = "https://user.realtutorialhub.com"
            NEXT_PUBLIC_LOGIN_URL = "https://user.realtutorialhub.com/login"
            NEXT_PUBLIC_SENTRY_DSN = "https://79aa148938b04d21381b9086fa4e4a75@o4510960730308608.ingest.us.sentry.io/4510960802201600"
        }
    }
    "skillup-web" = @{
        Name = "skillup-web"
        Dockerfile = "apps/skillup-web/Dockerfile"
        CloudRunService = "skillup-web"
        Port = 3004
        BuildArgs = @{}
    }
}

# Determine which services to deploy
$servicesToDeploy = @()
if ($Services -eq "all") {
    $servicesToDeploy = $serviceConfigs.Keys
} else {
    $servicesToDeploy = $Services -split "," | ForEach-Object { $_.Trim() }
}

Write-Host "Starting deployment process..." -ForegroundColor Cyan
Write-Host "Services to deploy: $($servicesToDeploy -join ', ')" -ForegroundColor Cyan
Write-Host "Commit SHA: $COMMIT_SHA" -ForegroundColor Cyan
Write-Host ""

# Change to project root
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Function to build Docker image
function Build-DockerImage {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Config
    )

    $imageName = "$ARTIFACT_REGISTRY/$($Config.Name)"
    $imageTag = "${imageName}:${COMMIT_SHA}"
    $imageLatest = "${imageName}:latest"

    Write-Host "Building Docker image: $($Config.Name)" -ForegroundColor Yellow
    Write-Host "   Dockerfile: $($Config.Dockerfile)" -ForegroundColor Gray
    Write-Host "   Image: $imageTag" -ForegroundColor Gray

    # Build docker build args
    $buildArgs = @()
    foreach ($key in $Config.BuildArgs.Keys) {
        $value = $Config.BuildArgs[$key]
        if ($null -ne $value -and $value -ne "") {
            $buildArgs += "--build-arg"
            $buildArgs += "$key=$value"
        }
    }

    # Build the image
    $buildCmd = "docker build $($buildArgs -join ' ') -t $imageTag -t $imageLatest -f $($Config.Dockerfile) ."
    Write-Host "   Command: $buildCmd" -ForegroundColor Gray
    
    Invoke-Expression $buildCmd
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed for $($Config.Name)"
    }

    Write-Host "Build completed: $($Config.Name)" -ForegroundColor Green
    Write-Host ""

    return @{
        ImageTag = $imageTag
        ImageLatest = $imageLatest
    }
}

# Function to push Docker image to Artifact Registry
function Push-DockerImage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ImageTag,
        [Parameter(Mandatory = $true)]
        [string]$ImageLatest,
        [Parameter(Mandatory = $true)]
        [string]$ServiceName
    )

    Write-Host "Pushing Docker image: $ServiceName" -ForegroundColor Yellow
    
    # Push tagged image
    docker push $ImageTag
    if ($LASTEXITCODE -ne 0) {
        throw "Docker push failed for $ImageTag"
    }

    # Push latest tag
    docker push $ImageLatest
    if ($LASTEXITCODE -ne 0) {
        throw "Docker push failed for $ImageLatest"
    }

    Write-Host "Push completed: $ServiceName" -ForegroundColor Green
    Write-Host ""
}

# Function to deploy to Cloud Run
function Deploy-ToCloudRun {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Config,
        [Parameter(Mandatory = $true)]
        [string]$ImageTag
    )

    Write-Host "Deploying to Cloud Run: $($Config.CloudRunService)" -ForegroundColor Yellow
    Write-Host "   Image: $ImageTag" -ForegroundColor Gray
    Write-Host "   Region: $GCP_REGION" -ForegroundColor Gray

    $deployArgs = @(
        "run", "deploy", $Config.CloudRunService,
        "--image=$ImageTag",
        "--platform=managed",
        "--region=$GCP_REGION",
        "--project=$GCP_PROJECT_ID",
        "--port=$($Config.Port)",
        "--allow-unauthenticated",
        "--set-env-vars=NODE_ENV=production,ENVIRONMENT=production",
        "--memory=2Gi",
        "--cpu=2",
        "--timeout=300",
        "--concurrency=80",
        "--min-instances=1",
        "--max-instances=10"
    )

    & gcloud $deployArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Cloud Run deployment failed for $($Config.CloudRunService)"
    }

    Write-Host "Deployment completed: $($Config.CloudRunService)" -ForegroundColor Green
    Write-Host ""
}

# Main deployment flow
try {
    # Authenticate with GCP (if needed)
    Write-Host "Checking GCP authentication..." -ForegroundColor Cyan
    $authCheck = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>&1
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($authCheck)) {
        Write-Host "Not authenticated with GCP. Please run: gcloud auth login" -ForegroundColor Red
        exit 1
    }
    Write-Host "Authenticated as: $authCheck" -ForegroundColor Green
    Write-Host ""

    # Configure Docker for Artifact Registry
    Write-Host "Configuring Docker for Artifact Registry..." -ForegroundColor Cyan
    gcloud auth configure-docker "$GCP_REGION-docker.pkg.dev" --quiet
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to configure Docker for Artifact Registry"
    }
    Write-Host "Docker configured" -ForegroundColor Green
    Write-Host ""

    # Build and deploy each service
    foreach ($serviceName in $servicesToDeploy) {
        if (-not $serviceConfigs.ContainsKey($serviceName)) {
            Write-Host "Unknown service: $serviceName. Skipping..." -ForegroundColor Yellow
            continue
        }

        $config = $serviceConfigs[$serviceName]
        
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host "Processing: $serviceName" -ForegroundColor Cyan
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host ""

        $imageInfo = $null

        # Build phase
        if (-not $SkipBuild) {
            $imageInfo = Build-DockerImage -Config $config
            Push-DockerImage -ImageTag $imageInfo.ImageTag -ImageLatest $imageInfo.ImageLatest -ServiceName $serviceName
        } else {
            Write-Host "Skipping build (using existing image)" -ForegroundColor Yellow
            $imageInfo = @{
                ImageTag = "$ARTIFACT_REGISTRY/$($config.Name):$COMMIT_SHA"
                ImageLatest = "$ARTIFACT_REGISTRY/$($config.Name):latest"
            }
        }

        # Deploy phase
        if (-not $SkipDeploy) {
            Deploy-ToCloudRun -Config $config -ImageTag $imageInfo.ImageTag
        } else {
            Write-Host "Skipping deployment" -ForegroundColor Yellow
        }

        Write-Host ""
    }

    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployed services:" -ForegroundColor Cyan
    foreach ($serviceName in $servicesToDeploy) {
        if ($serviceConfigs.ContainsKey($serviceName)) {
            $config = $serviceConfigs[$serviceName]
            Write-Host "  * $($config.CloudRunService)" -ForegroundColor Green
        }
    }
    Write-Host ""
    Write-Host "To view service URLs, run:" -ForegroundColor Cyan
    Write-Host "  gcloud run services list --platform=managed --region=$GCP_REGION --project=$GCP_PROJECT_ID" -ForegroundColor Gray

} catch {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Gray
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
