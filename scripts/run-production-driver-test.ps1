#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test the ACTUAL @neondatabase/serverless driver in production container
#>

$ErrorActionPreference = 'Stop'

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host "  PRODUCTION DRIVER TEST (@neondatabase/serverless)" -ForegroundColor Blue
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

Write-Info "Uploading test script to production..."
scp .\scripts\test-production-driver.cjs root@72.61.115.49:/tmp/
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to upload script"
    exit 1
}

Write-Info "Copying script into container..."
ssh root@72.61.115.49 "docker cp /tmp/test-production-driver.cjs quiz-platform-skillup-web-1:/app/test-driver.cjs"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to copy into container"
    exit 1
}

Write-Host ""
Write-Info "Running driver test inside production container..."
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""

ssh root@72.61.115.49 "docker exec -w /app quiz-platform-skillup-web-1 node test-driver.cjs"
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

if ($exitCode -eq 0) {
    Write-Success "Production driver test completed"
} else {
    Write-Err "Production driver test failed (exit code: $exitCode)"
}

Write-Info "Cleaning up..."
ssh root@72.61.115.49 "rm -f /tmp/test-production-driver.cjs"
ssh root@72.61.115.49 "docker exec quiz-platform-skillup-web-1 rm -f /app/test-driver.cjs"

Write-Host ""
