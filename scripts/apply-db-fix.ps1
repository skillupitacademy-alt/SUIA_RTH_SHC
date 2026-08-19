#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Apply DATABASE_URL fix to production and restart services
.DESCRIPTION
    Removes the channel_binding=require parameter from DATABASE_URL which
    causes "Connection terminated unexpectedly" errors with Neon pooler.
#>

$ErrorActionPreference = 'Stop'

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host "  APPLY DATABASE_URL FIX TO PRODUCTION" -ForegroundColor Blue
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

Write-Host "ROOT CAUSE IDENTIFIED:" -ForegroundColor Yellow
Write-Host "  The DATABASE_URL contains 'channel_binding=require'" -ForegroundColor Gray
Write-Host "  This causes 'Connection terminated unexpectedly' errors" -ForegroundColor Gray
Write-Host "  when using Neon's connection pooler." -ForegroundColor Gray
Write-Host ""

Write-Host "SOLUTION:" -ForegroundColor Green
Write-Host "  Remove the channel_binding parameter from DATABASE_URL" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Apply fix to production? (yes/no)"
if ($confirm -ne 'yes') {
    Write-Info "Fix cancelled"
    exit 0
}

Write-Host ""
Write-Info "Step 1/4: Uploading fix script to production..."
scp .\scripts\fix-database-url.sh root@72.61.115.49:/tmp/
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to upload script"
    exit 1
}
Write-Success "Script uploaded"

Write-Info "Step 2/4: Setting execute permissions..."
ssh root@72.61.115.49 "chmod +x /tmp/fix-database-url.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to set permissions"
    exit 1
}
Write-Success "Permissions set"

Write-Host ""
Write-Info "Step 3/4: Applying fix..."
Write-Host ""
ssh root@72.61.115.49 "/tmp/fix-database-url.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to apply fix"
    exit 1
}

Write-Host ""
Write-Info "Step 4/4: Restarting skillup-web container..."
ssh root@72.61.115.49 "cd /opt/platform && docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml restart skillup-web"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to restart container"
    exit 1
}
Write-Success "Container restarted"

Write-Host ""
Write-Info "Waiting 10 seconds for container to start..."
Start-Sleep -Seconds 10

Write-Host ""
Write-Info "Testing tutorial page..."
Write-Host ""
$testResult = ssh root@72.61.115.49 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3004/tutorial/full-stack-development/backend-development/java/what-is-java"

if ($testResult -eq "200") {
    Write-Success "Tutorial page is working! HTTP 200"
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  FIX SUCCESSFUL - 503 ERROR RESOLVED!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Production URLs:" -ForegroundColor Cyan
    Write-Host "  https://user.skillupitacademy.com/tutorial/full-stack-development/backend-development/java/what-is-java" -ForegroundColor Gray
} elseif ($testResult -eq "000" -or $testResult -eq "500") {
    Write-Warn "Got HTTP $testResult - checking container logs..."
    Write-Host ""
    ssh root@72.61.115.49 "docker logs --tail 20 quiz-platform-skillup-web-1 2>&1 | grep -E '(Error|error|Connection|terminated)'"
} else {
    Write-Warn "Got HTTP $testResult (expected 200)"
    Write-Host ""
    Write-Host "Check container logs:" -ForegroundColor Yellow
    Write-Host "  ssh root@72.61.115.49" -ForegroundColor Gray
    Write-Host "  docker logs --tail 50 quiz-platform-skillup-web-1" -ForegroundColor Gray
}

Write-Host ""
Write-Info "Cleaning up..."
ssh root@72.61.115.49 "rm -f /tmp/fix-database-url.sh"
Write-Success "Cleanup complete"

Write-Host ""
