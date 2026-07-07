#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy the VPS Signup Fix to Hostinger VPS
    
.DESCRIPTION
    This script automates the deployment of the cookie domain fix to your Hostinger VPS.
    It connects via SSH, updates the code, configures environment variables, and restarts services.
    
.PARAMETER VpsIp
    The VPS IP address (default: 72.61.115.49)
    
.PARAMETER VpsUser
    The SSH user (default: root)
    
.PARAMETER SshKeyPath
    Path to the SSH private key (default: .\suia_rth)
    
.PARAMETER DryRun
    If specified, shows what would be executed without making changes
    
.EXAMPLE
    .\DEPLOY_VPS_SIGNUP_FIX.ps1
    
.EXAMPLE
    .\DEPLOY_VPS_SIGNUP_FIX.ps1 -DryRun
#>

param(
    [string]$VpsIp = "72.61.115.49",
    [string]$VpsUser = "root",
    [string]$SshKeyPath = "$PSScriptRoot\suia_rth",
    [switch]$DryRun,
    [switch]$SkipEnvCheck
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n🔹 $msg" -ForegroundColor Blue }

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          VPS SIGNUP FIX DEPLOYMENT AUTOMATION                 ║
║                                                                ║
║  Target: Hostinger VPS ($VpsIp)                    ║
║  User: $VpsUser                                                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

if ($DryRun) {
    Write-Warning "DRY RUN MODE: No changes will be made"
    Write-Host ""
}

# ============================================================================
# STEP 1: PRE-FLIGHT CHECKS
# ============================================================================

Write-Step "Pre-flight Checks"

# Check if SSH key exists
if (-not (Test-Path $SshKeyPath)) {
    Write-Error "SSH key not found at: $SshKeyPath"
    Write-Info "Please ensure the SSH private key exists and is accessible"
    exit 1
}
Write-Success "SSH key found: $SshKeyPath"

# Check if ssh command is available
try {
    $null = Get-Command ssh -ErrorAction Stop
    Write-Success "SSH client is available"
} catch {
    Write-Error "SSH client not found. Please install OpenSSH client"
    exit 1
}

# Check if git repo is clean (optional warning)
$gitStatus = git status --porcelain 2>$null
if ($gitStatus) {
    Write-Warning "Git repository has uncommitted changes"
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Info "Deployment cancelled"
        exit 0
    }
}

# Test SSH connection
Write-Info "Testing SSH connection to VPS..."
$testConnection = ssh -i $SshKeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${VpsUser}@${VpsIp} "echo 'OK'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to connect to VPS via SSH"
    Write-Info "Error: $testConnection"
    Write-Info "Troubleshooting:"
    Write-Info "  1. Check if the SSH key has the correct permissions"
    Write-Info "  2. Ensure the VPS is accessible from your network"
    Write-Info "  3. Verify the SSH key is authorized on the VPS"
    Write-Info ""
    Write-Info "Load the key into ssh-agent with:"
    Write-Info "  .\infra\hostinger\remote-ssh\load-hostinger-key.ps1"
    exit 1
}
Write-Success "SSH connection successful"

# ============================================================================
# STEP 2: BACKUP CURRENT STATE
# ============================================================================

Write-Step "Creating Backup"

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupScript = @"
#!/bin/bash
set -e

echo "Creating backup..."
BACKUP_DIR="/opt/platform/backups/pre-signup-fix-${timestamp}"
mkdir -p "\$BACKUP_DIR"

# Backup current environment file
if [ -f /opt/platform/env/.env.production ]; then
    cp /opt/platform/env/.env.production "\$BACKUP_DIR/.env.production.bak"
    echo "✅ Environment file backed up"
fi

# Backup current code (if exists)
if [ -d /opt/platform/repo ]; then
    cd /opt/platform/repo
    git rev-parse HEAD > "\$BACKUP_DIR/git-commit.txt" 2>/dev/null || echo "unknown" > "\$BACKUP_DIR/git-commit.txt"
    echo "✅ Current git commit recorded"
fi

# Backup docker compose state
if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}" > "\$BACKUP_DIR/docker-ps.txt" 2>/dev/null || true
    echo "✅ Docker state captured"
fi

echo "Backup location: \$BACKUP_DIR"
"@

if (-not $DryRun) {
    $backupScript | ssh -i $SshKeyPath ${VpsUser}@${VpsIp} "bash -s"
    Write-Success "Backup created on VPS"
} else {
    Write-Info "[DRY RUN] Would create backup at /opt/platform/backups/pre-signup-fix-${timestamp}"
}

# ============================================================================
# STEP 3: COPY MODIFIED FILE TO VPS
# ============================================================================

Write-Step "Copying Modified Code to VPS"

$localRepo = $PSScriptRoot
$vpsRepoPath = "/opt/platform/apps/quiz-platform"

if (-not $DryRun) {
    Write-Info "Copying cookie.middleware.ts to VPS..."
    
    # Use SCP to copy the modified file directly
    scp -i $SshKeyPath `
        "${localRepo}\packages\auth\src\middleware\cookie.middleware.ts" `
        "${VpsUser}@${VpsIp}:${vpsRepoPath}/packages/auth/src/middleware/cookie.middleware.ts"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "File copied to VPS successfully"
    } else {
        Write-Error "Failed to copy file to VPS"
        exit 1
    }
} else {
    Write-Info "[DRY RUN] Would copy: packages\auth\src\middleware\cookie.middleware.ts"
    Write-Info "[DRY RUN] Destination: ${VpsUser}@${VpsIp}:${vpsRepoPath}/packages/auth/src/middleware/"
}

# ============================================================================
# STEP 4: VERIFY/UPDATE ENVIRONMENT VARIABLES
# ============================================================================

Write-Step "Configuring Environment Variables"

$envCheckScript = @'
#!/bin/bash
set -e

ENV_FILE="/opt/platform/env/.env.production"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: $ENV_FILE not found"
    exit 1
fi

echo "📋 Checking required environment variables..."

check_var() {
    local var_name=$1
    local required=$2
    
    if grep -q "^${var_name}=" "$ENV_FILE"; then
        local value=$(grep "^${var_name}=" "$ENV_FILE" | cut -d '=' -f2-)
        if [ -n "$value" ]; then
            echo "✅ $var_name is set"
            return 0
        else
            echo "⚠️  $var_name is empty"
            if [ "$required" = "true" ]; then
                return 1
            fi
        fi
    else
        echo "❌ $var_name is missing"
        if [ "$required" = "true" ]; then
            return 1
        fi
    fi
    return 0
}

MISSING=0

# Check critical variables
check_var "COOKIE_DOMAIN_RTH" "false" || check_var "COOKIE_DOMAIN" "true" || MISSING=1
check_var "COOKIE_DOMAIN_SKILLUP" "false" || check_var "COOKIE_DOMAIN" "true" || MISSING=1
check_var "GATEWAY_URL" "true" || MISSING=1
check_var "GATEWAY_URL_SKILLUP" "true" || MISSING=1
check_var "ALLOWED_ORIGINS" "true" || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo ""
    echo "❌ Some required environment variables are missing"
    echo ""
    echo "Current cookie domain configuration:"
    grep -E "^COOKIE_DOMAIN" "$ENV_FILE" 2>/dev/null || echo "  (none found)"
    echo ""
    exit 1
fi

echo ""
echo "✅ All required environment variables are present"
echo ""
echo "Current configuration:"
echo "--------------------"
COOKIE_DOMAIN_RTH=$(grep "^COOKIE_DOMAIN_RTH=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || grep "^COOKIE_DOMAIN=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || echo "NOT SET")
COOKIE_DOMAIN_SKILLUP=$(grep "^COOKIE_DOMAIN_SKILLUP=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || grep "^COOKIE_DOMAIN=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || echo "NOT SET")

echo "COOKIE_DOMAIN_RTH:    $COOKIE_DOMAIN_RTH"
echo "COOKIE_DOMAIN_SKILLUP: $COOKIE_DOMAIN_SKILLUP"
'@

if (-not $DryRun) {
    $envOutput = $envCheckScript | ssh -i $SshKeyPath ${VpsUser}@${VpsIp} "bash -s" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $envOutput
        Write-Success "Environment variables verified"
    } else {
        Write-Host $envOutput
        Write-Error "Environment variable check failed"
        
        if (-not $SkipEnvCheck) {
            Write-Info ""
            Write-Info "Please update /opt/platform/env/.env.production on the VPS with:"
            Write-Info ""
            Write-Info "COOKIE_DOMAIN_RTH=.realtutorialhub.com"
            Write-Info "COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com"
            Write-Info ""
            Write-Info "Then run this script again, or use -SkipEnvCheck to continue anyway"
            exit 1
        } else {
            Write-Warning "Continuing despite environment check failure (SkipEnvCheck flag set)"
        }
    }
} else {
    Write-Info "[DRY RUN] Would verify environment variables"
}

# ============================================================================
# STEP 5: REBUILD DOCKER IMAGES
# ============================================================================

Write-Step "Rebuilding Docker Images"

$buildScript = @"
#!/bin/bash
set -e

cd /opt/platform/apps/quiz-platform

echo "🏗️  Rebuilding Docker images with updated code..."
./infra/hostinger/scripts/build.sh

echo "✅ Docker images rebuilt"
"@

if (-not $DryRun) {
    Write-Info "Rebuilding Docker images (this may take several minutes)..."
    $buildScript | ssh -i $SshKeyPath ${VpsUser}@${VpsIp} "bash -s"
    Write-Success "Docker images rebuilt successfully"
} else {
    Write-Info "[DRY RUN] Would rebuild Docker images using ./infra/hostinger/scripts/build.sh"
}

# ============================================================================
# STEP 6: DEPLOY UPDATED CONTAINERS
# ============================================================================

Write-Step "Deploying Updated Containers"

$deployScript = @"
#!/bin/bash
set -e

cd /opt/platform/apps/quiz-platform

echo "🚀 Deploying updated containers..."
./infra/hostinger/scripts/deploy.sh

echo "✅ Containers deployed"
"@

if (-not $DryRun) {
    Write-Info "Deploying containers (this will restart services with new images)..."
    $deployScript | ssh -i $SshKeyPath ${VpsUser}@${VpsIp} "bash -s"
    Write-Success "Containers deployed successfully"
} else {
    Write-Info "[DRY RUN] Would deploy updated containers using ./infra/hostinger/scripts/deploy.sh"
}

# ============================================================================
# STEP 7: VERIFY DEPLOYMENT
# ============================================================================

Write-Step "Verifying Deployment"

Start-Sleep -Seconds 5  # Give services time to start

$verifyScript = @"
#!/bin/bash

echo "🧪 Running health checks..."

cd /opt/platform/apps/quiz-platform

# Run the health check script
./infra/hostinger/scripts/health.sh

echo ""
echo "📊 Docker Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Nginx Status:"
docker logs quiz-platform-nginx --tail 20
"@

if (-not $DryRun) {
    Write-Host ""
    $verifyScript | ssh -i $SshKeyPath ${VpsUser}@${VpsIp} "bash -s"
    Write-Success "Verification complete"
} else {
    Write-Info "[DRY RUN] Would verify deployment"
}

# ============================================================================
# STEP 8: SUMMARY AND NEXT STEPS
# ============================================================================

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                  ✅ DEPLOYMENT COMPLETE!                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

if (-not $DryRun) {
    Write-Host @"

📋 NEXT STEPS:

1️⃣  Clear browser cache and cookies:
   - Open DevTools (F12)
   - Application → Storage → Clear site data
   - Or use Ctrl+Shift+Delete

2️⃣  Test the signup flow:
   - RTH: https://user.realtutorialhub.com/signup
   - SUIA: https://user.skillupitacademy.com/signup

3️⃣  Verify cookies are set correctly:
   - Open DevTools (F12) → Application → Cookies
   - Check that 'accessToken' and 'refreshToken' exist
   - Verify Domain matches your hostname

4️⃣  Test the complete flow:
   ✓ Visit signup page
   ✓ Fill in the form
   ✓ Submit
   ✓ Should redirect to /onboarding (NOT back to /signup)
   ✓ Complete onboarding
   ✓ Should redirect to /dashboard

📊 MONITORING:

Check logs on VPS:
  ssh -i $SshKeyPath ${VpsUser}@${VpsIp}
  
  # PM2 logs
  pm2 logs
  
  # Docker logs
  docker compose logs -f

🐛 TROUBLESHOOTING:

If issues persist, see the detailed guide:
  - VPS_SIGNUP_FIX.md
  
Rollback if needed:
  cd /opt/platform/backups/pre-signup-fix-${timestamp}
  # Follow rollback instructions in VPS_SIGNUP_FIX.md

"@ -ForegroundColor Cyan
} else {
    Write-Host @"

This was a DRY RUN. No changes were made to the VPS.

To execute the deployment, run:
  .\DEPLOY_VPS_SIGNUP_FIX.ps1

"@ -ForegroundColor Yellow
}

Write-Success "Script completed successfully!"
Write-Host ""
