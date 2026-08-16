#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Smart Production Deployment Script
.DESCRIPTION
    Universal deployment script that automatically detects changed services based on git diff,
    builds Docker images, packages, and deploys them to production servers.
    Supports all learner portals, admin applications, and backend services.
    
    Features:
    - Auto-detection of changed services via git diff analysis
    - Manual service selection with -Services parameter
    - Interactive service selection with -Force flag
    - Automated linting and TypeScript validation
    - Docker image build and deployment to Hostinger
    - Automatic cleanup of old Docker images locally
    - Production health verification
    
.PARAMETER Services
    Optional: Explicitly specify services to deploy (comma-separated array).
    If not provided, script will auto-detect changed services by comparing with base branch.
    
.PARAMETER BaseBranch
    Base branch to compare against for change detection (default: origin/main).
    Only used when Services parameter is not provided.
    
.PARAMETER Force
    Force mode: Display all buildable services for interactive selection,
    regardless of detected changes.
    
.EXAMPLE
    .\deploy-smart.ps1
    Auto-detect and deploy only changed services (compares with origin/main)
    
.EXAMPLE
    .\deploy-smart.ps1 -Services "api-server","skillhubcore-admin"
    Deploy specific services explicitly
    
.EXAMPLE
    .\deploy-smart.ps1 -BaseBranch "origin/develop"
    Auto-detect changes by comparing with develop branch
    
.EXAMPLE
    .\deploy-smart.ps1 -Force
    Interactive mode: Select services manually from all buildable services
    
.NOTES
    Supported Services:
    - api-server (Backend API)
    - question-judge (Question Judge Service)
    - realtutorialhub-web, realtutorialhub-quiz, realtutorialhub-admin
    - skillup-web, skillup-admin
    - skillhubcore-admin (SkillHubCore Admin Portal)
    - skillhub-placement
    - faculty-app
#>

[CmdletBinding()]
param(
    [string[]]$Services = @(),
    [string]$BaseBranch = "origin/main",
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Color functions
function Write-Info { 
    param($Message) 
    Write-Host "[INFO] $Message" -ForegroundColor Cyan 
}
function Write-Success { 
    param($Message) 
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green 
}
function Write-Warn { 
    param($Message) 
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow 
}
function Write-Err { 
    param($Message) 
    Write-Host "[ERROR] $Message" -ForegroundColor Red 
}

# Function to detect changed services
function Get-ChangedServices {
    param(
        [string]$BaseBranch = "origin/main"
    )
    
    Write-Info "Detecting changed services by comparing with $BaseBranch..."
    
    # Load service map
    $serviceMapPath = ".\infra\hostinger\config\service-map.json"
    if (-not (Test-Path $serviceMapPath)) {
        Write-Err "Service map not found: $serviceMapPath"
        exit 1
    }
    
    $serviceMap = Get-Content -Raw $serviceMapPath | ConvertFrom-Json
    
    # Get changed files
    $changedFiles = @()
    try {
        # Fetch latest from remote
        Write-Host "  -> Fetching latest from remote..." -ForegroundColor Gray
        git fetch origin 2>&1 | Out-Null
        
        # Get diff against base branch
        $changedFiles = git diff --name-only $BaseBranch...HEAD 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Could not compare with $BaseBranch, using uncommitted changes"
            $changedFiles = git diff --name-only HEAD 2>&1
        }
    } catch {
        Write-Warn "Git diff failed, using status: $_"
        $changedFiles = git status --porcelain | ForEach-Object { $_.Substring(3) }
    }
    
    if (-not $changedFiles) {
        Write-Warn "No changed files detected"
        return @()
    }
    
    Write-Host "  -> Found $($changedFiles.Count) changed file(s)" -ForegroundColor Gray
    
    # Map changed files to services
    $affectedServices = @{}
    
    foreach ($service in $serviceMap.services.PSObject.Properties) {
        $serviceInfo = $service.Value
        
        # Skip non-buildable services
        if ($serviceInfo.buildable -ne $true) {
            continue
        }
        
        $sourcePath = $serviceInfo.source_path
        $normalizedPath = $sourcePath -replace '/', '\'
        
        # Check if any changed file is under this service's path
        $hasChanges = $changedFiles | Where-Object { 
            $_ -like "$sourcePath/*" -or $_ -like "$normalizedPath\*"
        }
        
        if ($hasChanges) {
            $affectedServices[$service.Name] = @{
                path = $sourcePath
                changes = @($hasChanges)
            }
        }
    }
    
    # Check for shared dependencies (packages folder)
    $sharedChanges = $changedFiles | Where-Object { 
        $_ -like "packages/*" -or $_ -like "packages\*"
    }
    
    if ($sharedChanges) {
        Write-Warn "Shared packages changed - this may affect multiple services"
        Write-Host "  Changed shared files:" -ForegroundColor Gray
        $sharedChanges | Select-Object -First 5 | ForEach-Object {
            Write-Host "    - $_" -ForegroundColor DarkGray
        }
        if ($sharedChanges.Count -gt 5) {
            Write-Host "    ... and $($sharedChanges.Count - 5) more" -ForegroundColor DarkGray
        }
    }
    
    return $affectedServices
}

# Function to display service information
function Show-ServiceInfo {
    param(
        [string]$ServiceName,
        [hashtable]$ServiceDetails
    )
    
    Write-Host "    - $ServiceName" -ForegroundColor Gray
    if ($ServiceDetails.changes.Count -le 3) {
        foreach ($file in $ServiceDetails.changes) {
            Write-Host "        $file" -ForegroundColor DarkGray
        }
    } else {
        foreach ($file in $ServiceDetails.changes | Select-Object -First 3) {
            Write-Host "        $file" -ForegroundColor DarkGray
        }
        Write-Host "        ... and $($ServiceDetails.changes.Count - 3) more file(s)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "   SMART PRODUCTION DEPLOYMENT" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

# Step 0: Determine which services to deploy
Write-Info "Step 0/8: Determining services to deploy..."

$servicesToDeploy = @()
$detectedChanges = @{}

if ($Force) {
    Write-Warn "Force mode enabled - will prompt for service selection"
    $serviceMapPath = ".\infra\hostinger\config\service-map.json"
    $serviceMap = Get-Content -Raw $serviceMapPath | ConvertFrom-Json
    
    $buildableServices = @($serviceMap.services.PSObject.Properties | Where-Object { $_.Value.buildable -eq $true } | ForEach-Object { $_.Name })
    Write-Host ""
    Write-Host "Available buildable services:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $buildableServices.Count; $i++) {
        Write-Host "  $($i + 1). $($buildableServices[$i])" -ForegroundColor Gray
    }
    Write-Host ""
    $selection = Read-Host "Enter service numbers (comma-separated) or 'all'"
    
    if ($selection -eq 'all') {
        $servicesToDeploy = $buildableServices
    } else {
        $indices = $selection -split ',' | ForEach-Object { [int]$_.Trim() }
        $servicesToDeploy = $indices | ForEach-Object { $buildableServices[$_ - 1] }
    }
} elseif ($Services.Count -gt 0) {
    Write-Host "  -> Using explicitly specified services" -ForegroundColor Gray
    $servicesToDeploy = $Services
} else {
    Write-Host "  -> Auto-detecting changed services..." -ForegroundColor Gray
    $detectedChanges = Get-ChangedServices -BaseBranch $BaseBranch
    
    if ($detectedChanges.Count -eq 0) {
        Write-Warn "No service changes detected!"
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Yellow
        Write-Host "  1. Use -Force to select services manually" -ForegroundColor Gray
        Write-Host "  2. Use -Services to specify services explicitly" -ForegroundColor Gray
        Write-Host "  3. Commit changes and try again" -ForegroundColor Gray
        Write-Host ""
        exit 0
    }
    
    $servicesToDeploy = @($detectedChanges.Keys)
    
    Write-Host ""
    Write-Host "  Detected changes in the following services:" -ForegroundColor Cyan
    foreach ($service in $servicesToDeploy) {
        Show-ServiceInfo -ServiceName $service -ServiceDetails $detectedChanges[$service]
    }
}

if ($servicesToDeploy.Count -eq 0) {
    Write-Err "No services selected for deployment"
    exit 1
}

Write-Host ""
Write-Success "Will deploy $($servicesToDeploy.Count) service(s): $($servicesToDeploy -join ', ')"
Write-Host ""

# Prompt for confirmation
$confirm = Read-Host "Continue with these services? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Info "Deployment cancelled"
    exit 0
}

# Step 1: Get current git tag
Write-Info "Step 1/8: Getting git commit hash..."
try {
    $tag = git rev-parse --short=12 HEAD
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get git commit hash"
    }
    Write-Success "Git tag: $tag"
} catch {
    Write-Err "Failed to get git commit: $_"
    exit 1
}

# Step 2: Verify changes are committed
Write-Info "Step 2/8: Verifying git status..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warn "You have uncommitted changes:"
    git status --short
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Info "Deployment cancelled"
        exit 0
    }
}

# Step 3: Run linting
Write-Info "Step 3/8: Running ESLint checks..."

$hasLintErrors = $false
foreach ($service in $servicesToDeploy) {
    $servicePath = "apps\$service"
    
    # Skip services without package.json or lint script
    if (-not (Test-Path "$servicePath\package.json")) {
        Write-Host "  -> Skipping $service (no package.json)" -ForegroundColor DarkGray
        continue
    }
    
    $packageJson = Get-Content "$servicePath\package.json" | ConvertFrom-Json
    if (-not $packageJson.scripts.lint) {
        Write-Host "  -> Skipping $service (no lint script)" -ForegroundColor DarkGray
        continue
    }
    
    Write-Host "  -> Checking $service..." -ForegroundColor Gray
    Push-Location $servicePath
    try {
        npm run lint 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Err "ESLint failed for $service"
            $hasLintErrors = $true
        }
    } finally {
        Pop-Location
    }
}

if ($hasLintErrors) {
    Write-Err "Linting failed for one or more services"
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 1
    }
} else {
    Write-Success "All linting checks passed"
}

# Step 4: Run TypeScript checks
Write-Info "Step 4/8: Running TypeScript compilation checks..."

$hasTypeErrors = $false
foreach ($service in $servicesToDeploy) {
    $servicePath = "apps\$service"
    
    # Skip services without tsconfig.json
    if (-not (Test-Path "$servicePath\tsconfig.json")) {
        Write-Host "  -> Skipping $service (no tsconfig.json)" -ForegroundColor DarkGray
        continue
    }
    
    Write-Host "  -> Checking $service..." -ForegroundColor Gray
    Push-Location $servicePath
    try {
        npx tsc --noEmit 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Err "TypeScript check failed for $service"
            $hasTypeErrors = $true
        }
    } finally {
        Pop-Location
    }
}

if ($hasTypeErrors) {
    Write-Err "TypeScript checks failed for one or more services"
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 1
    }
} else {
    Write-Success "All TypeScript checks passed"
}

# Step 5: Build Docker images
Write-Info "Step 5/8: Building and saving Docker images..."
Write-Host "  -> Building: $($servicesToDeploy -join ', ')..." -ForegroundColor Gray
& .\infra\hostinger\scripts\build-save-images.ps1 `
    -ImageTag $tag `
    -Services $servicesToDeploy

if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to build Docker images"
    exit 1
}
Write-Success "Docker images built and saved"

# Step 6: Verify artifacts
Write-Info "Step 6/8: Verifying build artifacts..."
$artifactPath = ".\infra\hostinger\dist\images"
$tarFile = "$artifactPath\quiz-platform-images-$tag.tar"
$shaFile = "$artifactPath\quiz-platform-images-$tag.tar.sha256"
$manifestFile = "$artifactPath\quiz-platform-images-$tag.manifest.json"

if (-not (Test-Path $tarFile)) {
    Write-Err "Docker image archive not found: $tarFile"
    exit 1
}
if (-not (Test-Path $shaFile)) {
    Write-Err "SHA256 checksum file not found: $shaFile"
    exit 1
}
if (-not (Test-Path $manifestFile)) {
    Write-Err "Manifest file not found: $manifestFile"
    exit 1
}

$tarSize = (Get-Item $tarFile).Length / 1MB
Write-Success "Artifacts verified (Archive size: $([math]::Round($tarSize, 2)) MB)"

# Step 7: Upload to production server
Write-Info "Step 7/8: Uploading artifacts to production server..."
Write-Host "  -> Uploading to 72.61.115.49:/opt/platform/releases/" -ForegroundColor Gray

scp `
    $tarFile `
    $shaFile `
    $manifestFile `
    root@72.61.115.49:/opt/platform/releases/

if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to upload artifacts to production server"
    exit 1
}
Write-Success "Artifacts uploaded successfully"

# Step 8: Verify checksum on server
Write-Info "Step 8/8: Verifying checksum on production server..."
ssh root@72.61.115.49 "cd /opt/platform/releases && sha256sum -c quiz-platform-images-$tag.tar.sha256"

if ($LASTEXITCODE -ne 0) {
    Write-Err "Checksum verification failed on production server"
    exit 1
}
Write-Success "Checksum verified successfully"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   READY TO DEPLOY TO PRODUCTION" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Images have been built and uploaded to production server." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the deployment plan below" -ForegroundColor Gray
Write-Host "  2. Confirm deployment to production" -ForegroundColor Gray
Write-Host "  3. Monitor service health after deployment" -ForegroundColor Gray
Write-Host ""

Write-Host "===============================================================" -ForegroundColor Blue
Write-Host "DEPLOYMENT PLAN" -ForegroundColor Blue
Write-Host "===============================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "  Services to deploy:" -ForegroundColor Cyan
foreach ($service in $servicesToDeploy) {
    $description = switch ($service) {
        "api-server" { "Backend API" }
        "skillup-web" { "SkillUp IT Academy (Learner Portal)" }
        "realtutorialhub-web" { "RealTutorialHub (Learner Portal)" }
        "skillhubcore-admin" { "SkillHubCore Admin (Admin Portal)" }
        "skillup-admin" { "SkillUp IT Academy Admin" }
        "realtutorialhub-admin" { "RealTutorialHub Admin" }
        "faculty-app" { "Faculty Application" }
        "skillhub-placement" { "SkillHub Placement" }
        "question-judge" { "Question Judge Service" }
        default { "Service" }
    }
    Write-Host "    - $service".PadRight(30) -NoNewline -ForegroundColor Gray
    Write-Host "($description)" -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "  Image tag: $tag" -ForegroundColor Gray
Write-Host ""

if ($detectedChanges.Count -gt 0) {
    Write-Host "  Change summary:" -ForegroundColor Cyan
    foreach ($service in $servicesToDeploy) {
        if ($detectedChanges.ContainsKey($service)) {
            Write-Host "    - $service : $($detectedChanges[$service].changes.Count) file(s) changed" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

Write-Host "===============================================================" -ForegroundColor Blue
Write-Host ""

$deploy = Read-Host "Deploy to production now? (yes/no)"
if ($deploy -ne 'yes') {
    Write-Info "Deployment cancelled. Images remain on server for manual deployment."
    Write-Host ""
    Write-Host "To deploy manually, run:" -ForegroundColor Yellow
    Write-Host "  ssh root@72.61.115.49" -ForegroundColor Gray
    Write-Host "  cd /opt/platform/scripts" -ForegroundColor Gray
    Write-Host "  IMAGE_ARCHIVE=/opt/platform/releases/quiz-platform-images-$tag.tar IMAGE_TAG=$tag ./deploy-load-production.sh $($servicesToDeploy -join ' ')" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Info "Deploying to production..."
Write-Host ""

# Deploy to production
$deployCommand = "cd /opt/platform/scripts; IMAGE_ARCHIVE=/opt/platform/releases/quiz-platform-images-$tag.tar IMAGE_TAG=$tag ./deploy-load-production.sh $($servicesToDeploy -join ' ')"
ssh root@72.61.115.49 $deployCommand

if ($LASTEXITCODE -ne 0) {
    Write-Err "Deployment failed"
    Write-Host ""
    Write-Host "To rollback, use the previous image tag" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Success "Deployment completed successfully!"
Write-Host ""

# Verify services are running
Write-Info "Verifying service health..."
$verifyCommand = "cd /opt/platform; docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml ps $($servicesToDeploy -join ' ') nginx"
ssh root@72.61.115.49 $verifyCommand

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Deployed Services:" -ForegroundColor Cyan
foreach ($service in $servicesToDeploy) {
    Write-Host "  ✓ $service" -ForegroundColor Green
}
Write-Host ""

# Display relevant production URLs
$urls = @()
if ($servicesToDeploy -contains "skillup-web") {
    $urls += "  SkillUp IT Academy:  https://user.skillupitacademy.com"
}
if ($servicesToDeploy -contains "realtutorialhub-web") {
    $urls += "  RealTutorialHub:     https://user.realtutorialhub.com"
}
if ($servicesToDeploy -contains "skillhubcore-admin") {
    $urls += "  SkillHubCore Admin:  https://admin.skillhubcore.com"
}
if ($servicesToDeploy -contains "skillup-admin") {
    $urls += "  SkillUp Admin:       https://admin.skillupitacademy.com"
}
if ($servicesToDeploy -contains "realtutorialhub-admin") {
    $urls += "  RealTutorialHub Admin: https://admin.realtutorialhub.com"
}

if ($urls.Count -gt 0) {
    Write-Host "Production URLs:" -ForegroundColor Cyan
    $urls | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    Write-Host ""
}

Write-Host "Deployment tag: $tag" -ForegroundColor Cyan
Write-Host ""

# Step 9: Cleanup old Docker images locally
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "   LOCAL DOCKER CLEANUP" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""
Write-Info "Step 9/9: Cleaning up old Docker images..."

try {
    # Check if Docker is running
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Docker Desktop is not running. Skipping cleanup."
    } else {
        Write-Host ""
        Write-Host "  Current local images for deployed services:" -ForegroundColor Cyan
        
        # Get service map to find image names
        $serviceMapPath = ".\infra\hostinger\config\service-map.json"
        $serviceMap = Get-Content -Raw $serviceMapPath | ConvertFrom-Json
        
        $cleanupStats = @{
            imagesRemoved = 0
            spaceFreed = 0
            imagesKept = 0
        }
        
        foreach ($service in $servicesToDeploy) {
            $imageName = $serviceMap.services.$service.image_name
            
            if (-not $imageName) {
                continue
            }
            
            Write-Host ""
            Write-Host "  -> Processing $imageName..." -ForegroundColor Gray
            
            # List all tags for this image
            $allImages = docker images --format "{{.Repository}}:{{.Tag}}|{{.ID}}|{{.Size}}" --filter "reference=$imageName" 2>$null
            
            if (-not $allImages) {
                Write-Host "     No local images found" -ForegroundColor DarkGray
                continue
            }
            
            $imageList = @()
            foreach ($line in $allImages) {
                if ($line) {
                    $parts = $line -split '\|'
                    $imageList += @{
                        FullName = $parts[0]
                        ID = $parts[1]
                        Size = $parts[2]
                    }
                }
            }
            
            if ($imageList.Count -eq 0) {
                Write-Host "     No local images found" -ForegroundColor DarkGray
                continue
            }
            
            Write-Host "     Found $($imageList.Count) image(s)" -ForegroundColor Cyan
            
            # Keep latest and current tag, remove others
            $tagsToKeep = @("latest", $tag)
            $imagesToRemove = @()
            
            foreach ($img in $imageList) {
                $tagName = $img.FullName -replace "^$imageName:", ""
                
                if ($tagsToKeep -contains $tagName) {
                    Write-Host "     ✓ Keeping: $($img.FullName) [$($img.Size)]" -ForegroundColor Green
                    $cleanupStats.imagesKept++
                } else {
                    Write-Host "     ✗ Will remove: $($img.FullName) [$($img.Size)]" -ForegroundColor Yellow
                    $imagesToRemove += $img
                }
            }
            
            # Remove old images
            if ($imagesToRemove.Count -gt 0) {
                Write-Host "     Removing $($imagesToRemove.Count) old image(s)..." -ForegroundColor Gray
                
                foreach ($img in $imagesToRemove) {
                    try {
                        docker rmi $img.FullName 2>&1 | Out-Null
                        if ($LASTEXITCODE -eq 0) {
                            $cleanupStats.imagesRemoved++
                            Write-Host "     Removed: $($img.FullName)" -ForegroundColor DarkGray
                        } else {
                            Write-Warn "     Could not remove: $($img.FullName) (might be in use)"
                        }
                    } catch {
                        Write-Warn "     Failed to remove: $($img.FullName)"
                    }
                }
            }
        }
        
        Write-Host ""
        Write-Host "  Cleanup summary:" -ForegroundColor Cyan
        Write-Host "    - Images removed: $($cleanupStats.imagesRemoved)" -ForegroundColor Gray
        Write-Host "    - Images kept: $($cleanupStats.imagesKept)" -ForegroundColor Gray
        
        # Prune dangling images
        Write-Host ""
        Write-Host "  -> Removing dangling images..." -ForegroundColor Gray
        $pruneOutput = docker image prune -f 2>&1
        
        if ($pruneOutput -match "Total reclaimed space: (.+)") {
            $reclaimedSpace = $Matches[1]
            Write-Host "    Reclaimed space: $reclaimedSpace" -ForegroundColor Gray
        }
        
        # Optional: Remove unused images
        Write-Host ""
        $cleanupUnused = Read-Host "Remove all unused Docker images? (y/N)"
        if ($cleanupUnused -eq 'y' -or $cleanupUnused -eq 'Y') {
            Write-Host "  -> Removing all unused images..." -ForegroundColor Gray
            $pruneAllOutput = docker image prune -a -f 2>&1
            
            if ($pruneAllOutput -match "Total reclaimed space: (.+)") {
                $reclaimedSpace = $Matches[1]
                Write-Host "    Additional space reclaimed: $reclaimedSpace" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Success "Docker cleanup completed"
    }
} catch {
    Write-Warn "Docker cleanup failed: $_"
    Write-Host "  You can manually clean up later with:" -ForegroundColor Yellow
    Write-Host "    docker image prune -a" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   ALL DONE!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Success "Deployment and cleanup completed successfully! 🎉"
