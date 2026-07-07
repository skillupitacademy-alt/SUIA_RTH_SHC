#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Simple test for SkillUp IT Academy login
#>

$email = "anujoshi@gmail.com"
$password = "testing"

Write-Host "`n🧪 Testing SkillUp IT Academy Login" -ForegroundColor Cyan
Write-Host "Email: $email" -ForegroundColor Gray
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow

$loginBody = @{
    email = $email
    password = $password
    platform = "skillup"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://user.skillupitacademy.com/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -SessionVariable session `
        -UseBasicParsing
    
    Write-Host "✅ Login successful: $($response.StatusCode)" -ForegroundColor Green
    
    # Check cookies
    $cookies = $session.Cookies.GetCookies("https://user.skillupitacademy.com")
    Write-Host "✅ Cookies received: $($cookies.Count)" -ForegroundColor Green
    
    foreach ($cookie in $cookies) {
        Write-Host "  • $($cookie.Name): Domain=$($cookie.Domain)" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Step 2: Try dashboard
    Write-Host "Step 2: Accessing dashboard..." -ForegroundColor Yellow
    
    try {
        $dashResponse = Invoke-WebRequest -Uri "https://user.skillupitacademy.com/dashboard" `
            -Method GET `
            -WebSession $session `
            -MaximumRedirection 0 `
            -UseBasicParsing
        
        Write-Host "✅ Dashboard loaded: $($dashResponse.StatusCode)" -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $loc = $_.Exception.Response.Headers.Location
        
        Write-Host "Redirect: $code → $loc" -ForegroundColor Yellow
        
        if ($loc -match "/login") {
            Write-Host "❌ FAILED: Redirected to login (cookies not working)" -ForegroundColor Red
        } elseif ($loc -match "/onboarding") {
            Write-Host "✅ SUCCESS: Redirected to onboarding (expected)" -ForegroundColor Green
        } else {
            Write-Host "✅ Redirected to: $loc" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check VPS logs
Write-Host "🔍 Checking VPS logs..." -ForegroundColor Yellow

ssh hostinger-quiz-platform-root "docker logs quiz-platform-skillup-web-1 --tail 20 --since 1m 2>&1" | Select-String -Pattern "BFF_AUTH_DEBUG|hasToken" | ForEach-Object {
    if ($_ -match "hasToken.:false|No token found") {
        Write-Host "  ❌ $_" -ForegroundColor Red
    } else {
        Write-Host "  ✅ $_" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
