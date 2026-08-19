#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test Neon pooler connection directly using PostgreSQL client
#>

$ErrorActionPreference = 'Stop'

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host "  NEON POOLER DIRECT CONNECTION TEST" -ForegroundColor Blue
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

Write-Info "Uploading test script to production..."
scp .\scripts\test-pooler-directly.sh root@72.61.115.49:/tmp/
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to upload script"
    exit 1
}

Write-Info "Setting execute permissions..."
ssh root@72.61.115.49 "chmod +x /tmp/test-pooler-directly.sh"

Write-Host ""
Write-Info "Running pooler connection test..."
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""

ssh root@72.61.115.49 "/tmp/test-pooler-directly.sh"
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Blue
Write-Host ""

if ($exitCode -eq 0) {
    Write-Success "Pooler test completed successfully"
} else {
    Write-Err "Pooler test failed (exit code: $exitCode)"
}

Write-Info "Cleaning up..."
ssh root@72.61.115.49 "rm -f /tmp/test-pooler-directly.sh"

Write-Host ""
