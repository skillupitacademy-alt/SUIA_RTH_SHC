#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test the VPS signup cookie fix
    
.DESCRIPTION
    Verifies that signup endpoints are working and provides testing instructions
#>

$ErrorActionPreference = "Stop"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   VPS SIGNUP FIX - VERIFICATION SCRIPT                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Test endpoint availability
Write-Host "📊 Testing Signup Endpoints..." -ForegroundColor Yellow
Write-Host ""

try {
    $rthResponse = Invoke-WebRequest -Uri "https://user.realtutorialhub.com/signup" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($rthResponse.StatusCode -eq 200) {
        Write-Host "✅ RTH Signup Page: ACCESSIBLE (200 OK)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  RTH Signup Page: $($rthResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ RTH Signup Page: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $suiaResponse = Invoke-WebRequest -Uri "https://user.skillupitacademy.com/signup" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($suiaResponse.StatusCode -eq 200) {
        Write-Host "✅ SUIA Signup Page: ACCESSIBLE (200 OK)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SUIA Signup Page: $($suiaResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ SUIA Signup Page: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Manual testing instructions
Write-Host "🧪 MANUAL TESTING REQUIRED" -ForegroundColor Cyan
Write-Host ""
Write-Host "The automated check above only verifies that pages load." -ForegroundColor Gray
Write-Host "You MUST manually test the actual signup flow:" -ForegroundColor Yellow
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  STEP 1: CLEAR BROWSER CACHE (CRITICAL!)" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "  Option A: Use Incognito/Private Mode" -ForegroundColor White
Write-Host "    • Chrome/Edge: Ctrl+Shift+N" -ForegroundColor Gray
Write-Host "    • Firefox: Ctrl+Shift+P" -ForegroundColor Gray
Write-Host ""
Write-Host "  Option B: Clear Browser Data" -ForegroundColor White
Write-Host "    1. Press F12 (Open DevTools)" -ForegroundColor Gray
Write-Host "    2. Go to Application tab (Chrome/Edge) or Storage tab (Firefox)" -ForegroundColor Gray
Write-Host "    3. Expand 'Cookies' in left sidebar" -ForegroundColor Gray
Write-Host "    4. Right-click and 'Clear' for:" -ForegroundColor Gray
Write-Host "       - https://user.realtutorialhub.com" -ForegroundColor Gray
Write-Host "       - https://user.skillupitacademy.com" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  STEP 2: TEST RTH SIGNUP" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Navigate to: " -NoNewline -ForegroundColor White
Write-Host "https://user.realtutorialhub.com/signup" -ForegroundColor Cyan
Write-Host "  2. Fill in the signup form:" -ForegroundColor White
Write-Host "     Email:    test.rth.$(Get-Date -Format 'yyyyMMddHHmmss')@test.com" -ForegroundColor Gray
Write-Host "     Password: Test@123456" -ForegroundColor Gray
Write-Host "     Name:     Test User RTH" -ForegroundColor Gray
Write-Host "  3. Click 'Sign Up'" -ForegroundColor White
Write-Host "  4. " -NoNewline -ForegroundColor White
Write-Host "✅ EXPECTED: " -NoNewline -ForegroundColor Green
Write-Host "Redirect to /onboarding" -ForegroundColor White
Write-Host "     " -NoNewline
Write-Host "❌ OLD BUG:  " -NoNewline -ForegroundColor Red
Write-Host "Stayed on /signup" -ForegroundColor White
Write-Host "  5. Complete onboarding" -ForegroundColor White
Write-Host "  6. " -NoNewline -ForegroundColor White
Write-Host "✅ EXPECTED: " -NoNewline -ForegroundColor Green
Write-Host "Redirect to /dashboard" -ForegroundColor White
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  STEP 3: TEST SUIA SIGNUP" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Navigate to: " -NoNewline -ForegroundColor White
Write-Host "https://user.skillupitacademy.com/signup" -ForegroundColor Cyan
Write-Host "  2. Fill in the signup form:" -ForegroundColor White
Write-Host "     Email:    test.suia.$(Get-Date -Format 'yyyyMMddHHmmss')@test.com" -ForegroundColor Gray
Write-Host "     Password: Test@123456" -ForegroundColor Gray
Write-Host "     Name:     Test User SUIA" -ForegroundColor Gray
Write-Host "  3. Click 'Sign Up'" -ForegroundColor White
Write-Host "  4. " -NoNewline -ForegroundColor White
Write-Host "✅ EXPECTED: " -NoNewline -ForegroundColor Green
Write-Host "Redirect to /onboarding" -ForegroundColor White
Write-Host "     " -NoNewline
Write-Host "❌ OLD BUG:  " -NoNewline -ForegroundColor Red
Write-Host "Stayed on /signup" -ForegroundColor White
Write-Host "  5. Complete onboarding" -ForegroundColor White
Write-Host "  6. " -NoNewline -ForegroundColor White
Write-Host "✅ EXPECTED: " -NoNewline -ForegroundColor Green
Write-Host "Redirect to /dashboard" -ForegroundColor White
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  STEP 4: VERIFY COOKIES (OPTIONAL)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "  After successful signup, check cookies in DevTools:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Press F12 (Open DevTools)" -ForegroundColor Gray
Write-Host "  2. Go to Application → Cookies" -ForegroundColor Gray
Write-Host "  3. Look for 'accessToken' cookie" -ForegroundColor Gray
Write-Host "  4. Verify:" -ForegroundColor Gray
Write-Host "     Domain:   .realtutorialhub.com (or .skillupitacademy.com)" -ForegroundColor Gray
Write-Host "     Secure:   ✓" -ForegroundColor Gray
Write-Host "     HttpOnly: ✓" -ForegroundColor Gray
Write-Host "     SameSite: None" -ForegroundColor Gray
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# VPS status check
Write-Host "🔍 VPS Container Status" -ForegroundColor Yellow
Write-Host ""

try {
    $containerStatus = ssh hostinger-quiz-platform-root "docker ps --filter 'name=quiz-platform-(realtutorialhub-web|skillup-web)' --format '{{.Names}}: {{.Status}}'" 2>$null
    
    if ($containerStatus) {
        Write-Host "Current container status:" -ForegroundColor Gray
        $containerStatus -split "`n" | ForEach-Object {
            if ($_ -match "healthy") {
                Write-Host "  ✅ $_" -ForegroundColor Green
            } elseif ($_ -match "unhealthy") {
                Write-Host "  ❌ $_" -ForegroundColor Red
            } else {
                Write-Host "  ⚠️  $_" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ⚠️  Could not check VPS status (SSH connection issue)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Could not check VPS status: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Image build time
try {
    $imageTime = ssh hostinger-quiz-platform-root "docker images --format '{{.Repository}}: {{.CreatedAt}}' | grep -E 'quiz-platform-(realtutorialhub-web|skillup-web)'" 2>$null
    
    if ($imageTime) {
        Write-Host "Docker images (with fix):" -ForegroundColor Gray
        $imageTime -split "`n" | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
} catch {
    # Ignore
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Final instructions
Write-Host "📝 REPORT RESULTS" -ForegroundColor Cyan
Write-Host ""
Write-Host "After testing, please report:" -ForegroundColor White
Write-Host ""
Write-Host "  ✅ SUCCESS: 'Both RTH and SUIA signup now redirect to /onboarding'" -ForegroundColor Green
Write-Host "  ❌ FAILURE: 'Still stuck on /signup after clicking Sign Up'" -ForegroundColor Red
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Quick links
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  RTH Signup:  https://user.realtutorialhub.com/signup" -ForegroundColor Gray
Write-Host "  SUIA Signup: https://user.skillupitacademy.com/signup" -ForegroundColor Gray
Write-Host ""
Write-Host "  Deployment Details: .\DEPLOYMENT_COMPLETED.md" -ForegroundColor Gray
Write-Host "  VPS Status Check:   .\CHECK_VPS_DEPLOYMENT.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 " -NoNewline -ForegroundColor Yellow
Write-Host "Ready to test! Remember to clear browser cache first!" -ForegroundColor White
Write-Host ""
