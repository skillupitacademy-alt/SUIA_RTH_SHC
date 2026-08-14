#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Exam Result Summary Page Changes to Production
.DESCRIPTION
    This script builds, packages, and deploys the new exam result summary page
    to production servers for both SkillUp IT Academy and RealTutorialHub.
.EXAMPLE
    .\deploy-exam-result-page.ps1
#>

[CmdletBinding()]
param()

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

Write-Host ""
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "   EXAM RESULT SUMMARY PAGE - PRODUCTION DEPLOYMENT" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

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
Write-Host "  → Checking skillup-web..." -ForegroundColor Gray
Set-Location apps/skillup-web
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Err "ESLint failed for skillup-web"
    exit 1
}
Set-Location ../..

Write-Host "  -> Checking realtutorialhub-web..." -ForegroundColor Gray
Set-Location apps/realtutorialhub-web
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Err "ESLint failed for realtutorialhub-web"
    exit 1
}
Set-Location ../..
Write-Success "All linting checks passed"

# Step 4: Run TypeScript checks
Write-Info "Step 4/8: Running TypeScript compilation checks..."
Write-Host "  -> Checking skillup-web..." -ForegroundColor Gray
Set-Location apps/skillup-web
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Err "TypeScript check failed for skillup-web"
    exit 1
}
Set-Location ../..

Write-Host "  -> Checking realtutorialhub-web..." -ForegroundColor Gray
Set-Location apps/realtutorialhub-web
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Err "TypeScript check failed for realtutorialhub-web"
    exit 1
}
Set-Location ../..
Write-Success "All TypeScript checks passed"

# Step 5: Build Docker images
Write-Info "Step 5/8: Building and saving Docker images..."
Write-Host "  -> Building api-server, skillup-web, realtutorialhub-web..." -ForegroundColor Gray
& .\infra\hostinger\scripts\build-save-images.ps1 `
    -ImageTag $tag `
    -Services @("api-server","skillup-web","realtutorialhub-web")

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
Write-Host "    - api-server        (Backend API)" -ForegroundColor Gray
Write-Host "    - skillup-web       (SkillUp IT Academy)" -ForegroundColor Gray
Write-Host "    - realtutorialhub-web (RealTutorialHub)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Image tag: $tag" -ForegroundColor Gray
Write-Host ""
Write-Host "  Changes included:" -ForegroundColor Cyan
Write-Host "    - New exam result summary page" -ForegroundColor Gray
Write-Host "    - Modern UI with brand-specific colors" -ForegroundColor Gray
Write-Host "    - Performance metrics visualization" -ForegroundColor Gray
Write-Host "    - Real-time result polling" -ForegroundColor Gray
Write-Host "    - Skills and difficulty breakdown" -ForegroundColor Gray
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Blue
Write-Host ""

$deploy = Read-Host "Deploy to production now? (yes/no)"
if ($deploy -ne 'yes') {
    Write-Info "Deployment cancelled. Images remain on server for manual deployment."
    Write-Host ""
    Write-Host "To deploy manually, run:" -ForegroundColor Yellow
    Write-Host "  ssh root@72.61.115.49" -ForegroundColor Gray
    Write-Host "  cd /opt/platform/scripts" -ForegroundColor Gray
    Write-Host "  IMAGE_ARCHIVE=/opt/platform/releases/quiz-platform-images-$tag.tar IMAGE_TAG=$tag ./deploy-load-production.sh api-server skillup-web realtutorialhub-web" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Info "Deploying to production..."
Write-Host ""

# Deploy to production
ssh root@72.61.115.49 "cd /opt/platform/scripts; IMAGE_ARCHIVE=/opt/platform/releases/quiz-platform-images-$tag.tar IMAGE_TAG=$tag ./deploy-load-production.sh api-server skillup-web realtutorialhub-web"

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
ssh root@72.61.115.49 "cd /opt/platform; docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml ps api-server skillup-web realtutorialhub-web nginx"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Production URLs:" -ForegroundColor Cyan
Write-Host "  SkillUp IT Academy:  https://user.skillupitacademy.com/result?examId={examId}" -ForegroundColor Gray
Write-Host "  RealTutorialHub:     https://user.realtutorialhub.com/result?examId={examId}" -ForegroundColor Gray
Write-Host ""
Write-Host "Test the deployment:" -ForegroundColor Yellow
Write-Host "  1. Complete an exam on either platform" -ForegroundColor Gray
Write-Host "  2. Submit the assessment" -ForegroundColor Gray
Write-Host "  3. Verify the new result summary page displays correctly" -ForegroundColor Gray
Write-Host "  4. Check all metrics and visualizations" -ForegroundColor Gray
Write-Host ""
Write-Host "Deployment tag: $tag" -ForegroundColor Cyan
Write-Host ""
Write-Success "Done! 🎉"
