#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check VPS deployment status and verify the signup fix
    
.DESCRIPTION
    Monitors the Docker build status and tests the signup flow
#>

$ErrorActionPreference = "Continue"
$VpsHost = "hostinger-quiz-platform-root"

Write-Host "`n=== VPS DEPLOYMENT STATUS CHECK ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-DD HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Step 1: Check if Docker build is still running
Write-Host "📊 Checking Docker build status..." -ForegroundColor Yellow
$buildProcess = ssh $VpsHost "ps aux | grep 'docker compose.*build' | grep -v grep" 2>$null

if ($buildProcess) {
    Write-Host "⏳ Docker build is still running" -ForegroundColor Yellow
    
    # Get build runtime
    $runtime = ssh $VpsHost "ps -p 589512 -o etime --no-headers 2>/dev/null" 2>$null
    if ($runtime) {
        Write-Host "   Runtime: $($runtime.Trim())" -ForegroundColor Gray
    }
    
    # Check active build processes
    Write-Host "`n🔧 Active build processes:" -ForegroundColor Gray
    ssh $VpsHost "ps aux | grep 'pnpm.*build' | grep -v grep | awk '{print \`$NF}'" 2>$null | ForEach-Object {
        if ($_.Trim()) {
            Write-Host "   - $_" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n💡 The build typically takes 15-20 minutes. Please wait..." -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "✅ Docker build has completed" -ForegroundColor Green
}

# Step 2: Check container status
Write-Host "`n📦 Checking container status..." -ForegroundColor Yellow

$containerCount = ssh $VpsHost "docker ps --filter 'name=quiz-platform' --format '{{.Names}}' | wc -l" 2>$null

if ($containerCount -and $containerCount -gt 0) {
    Write-Host "✅ $containerCount quiz-platform containers running" -ForegroundColor Green
    
    # List containers
    Write-Host "`n📋 Container list:" -ForegroundColor Gray
    ssh $VpsHost "docker ps --filter 'name=quiz-platform' --format 'table {{.Names}}\t{{.Status}}' | head -15" 2>$null
} else {
    Write-Host "⚠️  No quiz-platform containers found running" -ForegroundColor Yellow
    Write-Host "   Need to run deployment script" -ForegroundColor Gray
}

# Step 3: Check if containers need to be restarted
Write-Host "`n🔄 Checking if deployment needed..." -ForegroundColor Yellow

$fileModTime = ssh $VpsHost "stat -c %Y /opt/platform/apps/quiz-platform/packages/auth/src/middleware/cookie.middleware.ts" 2>$null

$lastDeployTime = ssh $VpsHost "docker inspect quiz-platform-realtutorialhub-web-1 --format='{{.State.StartedAt}}' 2>/dev/null" 2>$null

if ($lastDeployTime) {
    Write-Host "✅ Containers were last deployed: $lastDeployTime" -ForegroundColor Green
    
    # Need to parse and compare times - simplified check
    Write-Host "`n🔧 File was modified at VPS time: 2026-07-06 13:43" -ForegroundColor Gray
    Write-Host "💡 If containers started before 13:43, redeploy is needed" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Could not determine container start time" -ForegroundColor Yellow
}

# Step 4: Check environment variables
Write-Host "`n⚙️  Checking environment variables..." -ForegroundColor Yellow

$envVars = ssh $VpsHost "grep -E 'COOKIE_DOMAIN' /opt/platform/env/.env.production" 2>$null

if ($envVars) {
    Write-Host "✅ Cookie domain environment variables:" -ForegroundColor Green
    $envVars | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Environment variables not found!" -ForegroundColor Red
}

# Step 5: Test endpoints
Write-Host "`n🌐 Testing signup endpoints..." -ForegroundColor Yellow

$rthStatus = (Invoke-WebRequest -Uri "https://user.realtutorialhub.com/signup" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue).StatusCode
$suiaStatus = (Invoke-WebRequest -Uri "https://user.skillupitacademy.com/signup" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue).StatusCode

if ($rthStatus -eq 200) {
    Write-Host "✅ RTH signup page: $rthStatus" -ForegroundColor Green
} else {
    Write-Host "❌ RTH signup page: Failed" -ForegroundColor Red
}

if ($suiaStatus -eq 200) {
    Write-Host "✅ SUIA signup page: $suiaStatus" -ForegroundColor Green
} else {
    Write-Host "❌ SUIA signup page: Failed" -ForegroundColor Red
}

# Final recommendations
Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Cyan

if ($buildProcess) {
    Write-Host "1. Wait for Docker build to complete (check again in 5-10 minutes)" -ForegroundColor White
    Write-Host "2. Run: ssh $VpsHost 'cd /opt/platform/apps/quiz-platform && ./infra/hostinger/scripts/deploy.sh'" -ForegroundColor White
} else {
    Write-Host "1. Deploy updated containers:" -ForegroundColor White
    Write-Host "   ssh $VpsHost 'cd /opt/platform/apps/quiz-platform && ./infra/hostinger/scripts/deploy.sh'" -ForegroundColor White
    Write-Host "2. Run health check:" -ForegroundColor White
    Write-Host "   ssh $VpsHost 'cd /opt/platform/apps/quiz-platform && ./infra/hostinger/scripts/health.sh'" -ForegroundColor White
    Write-Host "3. Test signup flows (clear browser cache first!)" -ForegroundColor White
}

Write-Host "`n=== END OF STATUS CHECK ===" -ForegroundColor Cyan
Write-Host ""
