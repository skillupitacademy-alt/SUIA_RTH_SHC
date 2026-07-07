#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated VPS Deployment with Credentials
    
.DESCRIPTION
    This script uses the provided credentials to deploy to VPS automatically
#>

$ErrorActionPreference = "Stop"

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          AUTOMATED VPS DEPLOYMENT WITH CREDENTIALS            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$VPS_IP = "72.61.115.49"
$VPS_USER = "root"
$SSH_KEY = ".\suia_rth"
$LOCAL_FILE = ".\packages\auth\src\middleware\cookie.middleware.ts"
$VPS_PATH = "/opt/platform/apps/quiz-platform/packages/auth/src/middleware/cookie.middleware.ts"

# Step 1: Setup SSH key with passphrase
Write-Host "🔑 Setting up SSH key..." -ForegroundColor Yellow

# Create expect script for ssh-add with passphrase
$expectScript = @"
spawn ssh-add $SSH_KEY
expect "Enter passphrase"
send "hello\r"
expect eof
"@

# For Windows, we'll use a different approach - create a PowerShell script that handles the key
Write-Host "📦 Copying file to VPS..." -ForegroundColor Yellow

# Use scp with identity file (passphrase will be prompted if needed)
$scpCommand = "scp -i `"$SSH_KEY`" `"$LOCAL_FILE`" `"${VPS_USER}@${VPS_IP}:${VPS_PATH}`""
Write-Host "Running: $scpCommand" -ForegroundColor Gray

# Execute SCP
Start-Process powershell -ArgumentList "-NoExit", "-Command", $scpCommand -Wait

Write-Host "`n🏗️ Building and deploying on VPS..." -ForegroundColor Yellow

# Create deployment script
$deployScript = @'
#!/bin/bash
set -e

echo "📁 Navigating to project..."
cd /opt/platform/apps/quiz-platform

echo "🏗️ Building Docker images..."
./infra/hostinger/scripts/build.sh

echo "🚀 Deploying containers..."
./infra/hostinger/scripts/deploy.sh

echo "✅ Checking health..."
./infra/hostinger/scripts/health.sh

echo ""
echo "✅✅✅ DEPLOYMENT COMPLETE! ✅✅✅"
'@

# Execute SSH command
$sshCommand = "ssh -i `"$SSH_KEY`" ${VPS_USER}@${VPS_IP} 'bash -s' <<< '$deployScript'"
Write-Host "Running: $sshCommand" -ForegroundColor Gray

Invoke-Expression $sshCommand

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                  ✅ DEPLOYMENT COMPLETE!                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Next Steps:
1. Clear browser cache and cookies
2. Test: https://user.realtutorialhub.com/signup
3. Test: https://user.skillupitacademy.com/signup

"@ -ForegroundColor Green
