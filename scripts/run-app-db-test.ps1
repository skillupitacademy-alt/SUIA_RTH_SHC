#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run database test from application context in production container
#>

$ErrorActionPreference = 'Stop'

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host "  DATABASE TEST FROM APPLICATION CONTEXT" -ForegroundColor Blue
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

$scriptPath = ".\scripts\test-db-from-app.cjs"

if (-not (Test-Path $scriptPath)) {
    Write-Err "Test script not found: $scriptPath"
    exit 1
}

Write-Info "Step 1/3: Uploading test script to production..."
scp $scriptPath root@72.61.115.49:/tmp/test-db-from-app.cjs
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to upload script"
    exit 1
}
Write-Success "Script uploaded to /tmp/test-db-from-app.cjs"

Write-Host ""
Write-Info "Step 2/3: Copying script into container..."
ssh root@72.61.115.49 "docker cp /tmp/test-db-from-app.cjs quiz-platform-skillup-web-1:/app/apps/skillup-web/test-db.cjs"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to copy into container"
    exit 1
}
Write-Success "Script copied into container"

Write-Host ""
Write-Info "Step 3/3: Running database test inside container..."
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""

ssh root@72.61.115.49 "docker exec -w /app/apps/skillup-web quiz-platform-skillup-web-1 node test-db.cjs"
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

if ($exitCode -eq 0) {
    Write-Success "Database test completed successfully"
    Write-Host ""
    Write-Host "CONCLUSION:" -ForegroundColor Green
    Write-Host "  Database connectivity is WORKING correctly." -ForegroundColor Gray
    Write-Host "  The 503 error is NOT caused by database issues." -ForegroundColor Gray
    Write-Host "  Investigation should focus on application logic." -ForegroundColor Gray
} else {
    Write-Err "Database test failed (exit code: $exitCode)"
    Write-Host ""
    Write-Host "CONCLUSION:" -ForegroundColor Red
    Write-Host "  Database connectivity issue confirmed." -ForegroundColor Gray
    Write-Host "  Check the error output above for specific failure point." -ForegroundColor Gray
}

Write-Host ""

# Cleanup
Write-Info "Cleaning up temporary files..."
ssh root@72.61.115.49 "rm -f /tmp/test-db-from-app.cjs"
ssh root@72.61.115.49 "docker exec quiz-platform-skillup-web-1 rm -f /app/apps/skillup-web/test-db.cjs"
Write-Success "Cleanup complete"

Write-Host ""
