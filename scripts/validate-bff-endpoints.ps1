#!/usr/bin/env pwsh

param(
    [string]$Brand = "rth",
    [string]$Email = "",
    [string]$Password = ""
)

$ErrorActionPreference = "Stop"

# Default credentials
$credentials = @{
    "rth" = @{
        "email" = "ajayshah@gmail.com"
        "password" = "testing"
        "baseUrl" = "https://user.realtutorialhub.com"
    }
    "skillup" = @{
        "email" = "student@skillupitacademy.com"
        "password" = "testing"
        "baseUrl" = "https://user.skillupitacademy.com"
    }
}

if (-not $credentials.ContainsKey($Brand)) {
    Write-Error "Invalid brand. Use 'rth' or 'skillup'"
    exit 1
}

$config = $credentials[$Brand]
$testEmail = if ($Email) { $Email } else { $config.email }
$testPassword = if ($Password) { $Password } else { $config.password }
$baseUrl = $config.baseUrl

Write-Host "🧪 BFF Endpoint Validation Script" -ForegroundColor Cyan
Write-Host "Brand: $Brand" -ForegroundColor Yellow
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host "Email: $testEmail" -ForegroundColor Yellow
Write-Host ""

# Test 1: Login and get cookies
Write-Host "1️⃣ Testing Login..." -ForegroundColor Green
$loginPayload = @{
    email = $testEmail
    password = $testPassword
    platform = $Brand
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload `
        -SessionVariable session

    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "Status: $($loginResponse.StatusCode)" -ForegroundColor Gray
    
    # Extract cookies
    $cookies = $session.Cookies.GetCookies($baseUrl)
    Write-Host "Cookies received: $($cookies.Count)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Get user session via BFF
Write-Host ""
Write-Host "2️⃣ Testing /api/auth/me (BFF)..." -ForegroundColor Green
try {
    $meResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" `
        -Method GET `
        -WebSession $session

    $userData = $meResponse.Content | ConvertFrom-Json
    Write-Host "✅ /api/auth/me successful" -ForegroundColor Green
    Write-Host "Status: $($meResponse.StatusCode)" -ForegroundColor Gray
    Write-Host "User ID: $($userData.user.id)" -ForegroundColor Gray
    Write-Host "Email: $($userData.user.email)" -ForegroundColor Gray
    Write-Host "Is Onboarded: $($userData.user.isOnboarded)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ /api/auth/me failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Submit onboarding via BFF
Write-Host ""
Write-Host "3️⃣ Testing /api/onboarding (BFF)..." -ForegroundColor Green
$onboardingPayload = @{
    primaryGoal = "career"
    domain = "technology"
    subDomain = "software"
    timeCommitment = "full-time"
    journeyStatus = "beginner"
} | ConvertTo-Json

try {
    $onboardingResponse = Invoke-WebRequest -Uri "$baseUrl/api/onboarding" `
        -Method POST `
        -ContentType "application/json" `
        -Body $onboardingPayload `
        -WebSession $session

    Write-Host "✅ Onboarding submission successful" -ForegroundColor Green
    Write-Host "Status: $($onboardingResponse.StatusCode)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Onboarding failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# Test 4: Verify onboarding status updated
Write-Host ""
Write-Host "4️⃣ Verifying onboarding status updated..." -ForegroundColor Green
try {
    Start-Sleep -Seconds 1  # Brief delay for DB update
    
    $meResponse2 = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" `
        -Method GET `
        -WebSession $session

    $userData2 = $meResponse2.Content | ConvertFrom-Json
    Write-Host "✅ Status verification successful" -ForegroundColor Green
    Write-Host "Is Onboarded (after): $($userData2.user.isOnboarded)" -ForegroundColor Gray
    
    if ($userData2.user.isOnboarded -eq $true) {
        Write-Host "🎉 Onboarding flow completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Onboarding status not updated" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Status verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏁 Validation Complete" -ForegroundColor Cyan
Write-Host "Run with different brand: ./validate-bff-endpoints.ps1 -Brand skillup" -ForegroundColor Gray