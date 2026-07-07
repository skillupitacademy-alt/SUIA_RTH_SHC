#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Simple VPS Deployment Script for Signup Fix
    
.DESCRIPTION
    Copies the modified cookie middleware file to VPS and rebuilds containers
    
.EXAMPLE
    .\DEPLOY_SIMPLE.ps1
#>

param(
    [string]$VpsIp = "72.61.115.49",
    [string]$SshKey = ".\suia_rth"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== VPS SIGNUP FIX DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host "Target: $VpsIp" -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy modified file to VPS
Write-Host "📦 Copying modified file to VPS..." -ForegroundColor Yellow

$localFile = ".\packages\auth\src\middleware\cookie.middleware.ts"
$vpsPath = "/opt/platform/apps/quiz-platform/packages/auth/src/middleware/cookie.middleware.ts"

scp -i $SshKey $localFile "root@${VpsIp}:${vpsPath}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ File copied successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to copy file" -ForegroundColor Red
    exit 1
}

# Step 2: Rebuild and deploy on VPS
Write-Host "`n🏗️  Rebuilding Docker containers on VPS..." -ForegroundColor Yellow

$deployScript = @'
#!/bin/bash
set -e

cd /opt/platform/apps/quiz-platform

echo "Building Docker images..."
./infra/hostinger/scripts/build.sh

echo ""
echo "Deploying containers..."
./infra/hostinger/scripts/deploy.sh

echo ""
echo "✅ Deployment complete!"
'@

$deployScript | ssh -i $SshKey root@${VpsIp} "bash -s"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Clear browser cache and cookies"
    Write-Host "2. Test signup at https://user.realtutorialhub.com/signup"
    Write-Host "3. Test signup at https://user.skillupitacademy.com/signup"
    Write-Host ""
} else {
    Write-Host "`n❌ Deployment failed" -ForegroundColor Red
    exit 1
}
