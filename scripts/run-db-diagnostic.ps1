#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run database connectivity diagnostic on production server
.DESCRIPTION
    Deploys diagnostic script to production and executes it to identify
    database connection issues causing 503 errors on SkillUp tutorial pages.
#>

$ErrorActionPreference = 'Stop'

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host "  PRODUCTION DATABASE CONNECTIVITY DIAGNOSTIC" -ForegroundColor Blue
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

$scriptPath = ".\scripts\diagnose-production-db-connection.sh"

if (-not (Test-Path $scriptPath)) {
    Write-Err "Diagnostic script not found: $scriptPath"
    exit 1
}

Write-Info "Step 1/3: Uploading diagnostic script to production..."
scp $scriptPath root@72.61.115.49:/opt/platform/scripts/
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to upload script"
    exit 1
}
Write-Success "Script uploaded"

Write-Info "Step 2/3: Setting execute permissions..."
ssh root@72.61.115.49 "chmod +x /opt/platform/scripts/diagnose-production-db-connection.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to set permissions"
    exit 1
}
Write-Success "Permissions set"

Write-Host ""
Write-Info "Step 3/3: Running diagnostic on production server..."
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""

ssh root@72.61.115.49 "/opt/platform/scripts/diagnose-production-db-connection.sh"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Success "Diagnostic completed successfully"
} else {
    Write-Err "Diagnostic completed with errors (exit code: $LASTEXITCODE)"
}

Write-Host ""
