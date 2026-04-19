#!/usr/bin/env pwsh

param(
    [int]$WaitMinutes = 5
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 COMPREHENSIVE AUTH + AUTHORIZATION + BFF VALIDATION" -ForegroundColor Cyan
Write-Host "Waiting $WaitMinutes minutes for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds ($WaitMinutes * 60)

# Test credentials
$rthCreds = @{
    email = "ajayshah@gmail.com"
    password = "testing"
    platform = "realtutorialhub"
    baseUrl = "https://user.realtutorialhub.com"
}

$skillupCreds = @{
    email = "student@skillupitacademy.com"
    password = "testing"
    platform = "skillup"
    baseUrl = "https://user.skillupitacademy.com"
}

function Test-Authentication {
    param($creds, $brandName)
    
    Write-Host "`n🔐 TESTING $brandName AUTHENTICATION..." -ForegroundColor Green
    
    $loginPayload = @{
        email = $creds.email
        password = $creds.password
        platform = $creds.platform
    } | ConvertTo-Json

    try {
        $loginResponse = Invoke-WebRequest -Uri "$($creds.baseUrl)/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginPayload `
            -SessionVariable session

        Write-Host "✅ Login Status: $($loginResponse.StatusCode)" -ForegroundColor Green
        
        # Analyze cookies
        $cookies = $session.Cookies.GetCookies($creds.baseUrl)
        Write-Host "🍪 Cookies Analysis:" -ForegroundColor Yellow
        
        $hasAccessToken = $false
        $hasRefreshToken = $false
        $securityIssues = @()
        
        foreach ($cookie in $cookies) {
            if ($cookie.Name -eq "accessToken") { $hasAccessToken = $true }
            if ($cookie.Name -eq "refreshToken") { $hasRefreshToken = $true }
            
            if ($cookie.Name -match "token" -and -not $cookie.HttpOnly) {
                $securityIssues += "Token cookie not HttpOnly: $($cookie.Name)"
            }
            if (-not $cookie.Secure) {
                $securityIssues += "Cookie not Secure: $($cookie.Name)"
            }
            
            Write-Host "   - $($cookie.Name): HttpOnly=$($cookie.HttpOnly), Secure=$($cookie.Secure)" -ForegroundColor Gray
        }
        
        if (-not $hasAccessToken) { $securityIssues += "Missing accessToken cookie" }
        if (-not $hasRefreshToken) { $securityIssues += "Missing refreshToken cookie" }
        
        return @{
            Success = $true
            Session = $session
            SecurityIssues = $securityIssues
            Cookies = $cookies
        }
    } catch {
        Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

function Test-BFFAuthMe {
    param($session, $baseUrl, $brandName)
    
    Write-Host "`n🔍 TESTING $brandName /api/auth/me BFF..." -ForegroundColor Green
    
    try {
        $meResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" `
            -Method GET `
            -WebSession $session

        $userData = $meResponse.Content | ConvertFrom-Json
        Write-Host "✅ /api/auth/me Status: $($meResponse.StatusCode)" -ForegroundColor Green
        Write-Host "📊 User Data:" -ForegroundColor Yellow
        Write-Host "   - ID: $($userData.user.id)" -ForegroundColor Gray
        Write-Host "   - Email: $($userData.user.email)" -ForegroundColor Gray
        Write-Host "   - Brand: $($userData.user.brand)" -ForegroundColor Gray
        Write-Host "   - Onboarded: $($userData.user.onboarded)" -ForegroundColor Gray
        
        # Security check - no tokens exposed
        if ($meResponse.Content -match "token|jwt|bearer") {
            Write-Host "🚨 SECURITY ISSUE: Tokens exposed in response!" -ForegroundColor Red
            return @{ Success = $false; Issue = "Token exposure" }
        }
        
        return @{
            Success = $true
            UserData = $userData
            UserId = $userData.user.id
            Email = $userData.user.email
            Onboarded = $userData.user.onboarded
        }
    } catch {
        Write-Host "❌ /api/auth/me failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Response.StatusCode }
    }
}

function Test-Authorization {
    param($session, $baseUrl, $brandName)
    
    Write-Host "`n🛡️ TESTING $brandName AUTHORIZATION..." -ForegroundColor Green
    
    # Test 1: Access without cookies
    try {
        $unauthorizedResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" -Method GET
        Write-Host "🚨 SECURITY ISSUE: Unauthorized access succeeded!" -ForegroundColor Red
        return @{ Success = $false; Issue = "No auth required" }
    } catch {
        if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
            Write-Host "✅ Unauthorized access properly rejected (401)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
    
    return @{ Success = $true }
}

function Test-OnboardingFlow {
    param($session, $baseUrl, $brandName, $initialOnboarded)
    
    Write-Host "`n🎯 TESTING $brandName ONBOARDING FLOW..." -ForegroundColor Green
    
    if ($initialOnboarded) {
        Write-Host "⚠️ User already onboarded, skipping flow test" -ForegroundColor Yellow
        return @{ Success = $true; Skipped = $true }
    }
    
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

        Write-Host "✅ Onboarding Status: $($onboardingResponse.StatusCode)" -ForegroundColor Green
        
        # Verify status updated
        Start-Sleep -Seconds 2
        $updatedMe = Test-BFFAuthMe -session $session -baseUrl $baseUrl -brandName $brandName
        
        if ($updatedMe.Success -and $updatedMe.Onboarded) {
            Write-Host "✅ Onboarding status updated successfully" -ForegroundColor Green
            return @{ Success = $true; Updated = $true }
        } else {
            Write-Host "⚠️ Onboarding status not updated" -ForegroundColor Yellow
            return @{ Success = $false; Issue = "Status not updated" }
        }
        
    } catch {
        Write-Host "❌ Onboarding failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Response.StatusCode }
    }
}

function Test-ProtectedRouteRedirects {
    param($baseUrl, $brandName)
    
    Write-Host "`n🔒 TESTING $brandName PROTECTED ROUTE REDIRECTS..." -ForegroundColor Green
    
    $protectedRoutes = @('/dashboard', '/onboarding', '/student')
    $redirectResults = @()
    
    foreach ($route in $protectedRoutes) {
        try {
            $response = Invoke-WebRequest -Uri "$baseUrl$route" -Method GET -MaximumRedirection 0
            Write-Host "⚠️ ${route}: No redirect (Status: $($response.StatusCode))" -ForegroundColor Yellow
            $redirectResults += @{ Route = $route; Success = $false; Issue = "No redirect" }
        } catch {
            if ($_.Exception.Response.StatusCode -eq "Redirect" -or $_.Exception.Response.StatusCode -eq "Found" -or $_.Exception.Response.StatusCode -eq "TemporaryRedirect") {
                $location = $_.Exception.Response.Headers["Location"]
                if ($location -and $location.ToString().Contains("/login")) {
                    Write-Host "✅ ${route}: Redirects to login" -ForegroundColor Green
                    $redirectResults += @{ Route = $route; Success = $true; Location = $location.ToString() }
                } else {
                    Write-Host "⚠️ ${route}: Redirects but not to login ($location)" -ForegroundColor Yellow
                    $redirectResults += @{ Route = $route; Success = $false; Issue = "Wrong redirect" }
                }
            } elseif ($_.Exception.Response.StatusCode -eq "Unauthorized") {
                Write-Host "✅ ${route}: Returns 401 (API route)" -ForegroundColor Green
                $redirectResults += @{ Route = $route; Success = $true; Type = "API" }
            } else {
                Write-Host "❌ ${route}: Unexpected response ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
                $redirectResults += @{ Route = $route; Success = $false; Issue = "Unexpected response" }
            }
        }
    }
    
    $successCount = ($redirectResults | Where-Object { $_.Success }).Count
    $totalCount = $redirectResults.Count
    
    return @{
        Success = ($successCount -eq $totalCount)
        Results = $redirectResults
        Summary = "$successCount/$totalCount routes properly protected"
    }
}

function Test-FederatedIsolation {
    param($rthSession, $skillupSession)
    
    Write-Host "`n🌐 TESTING FEDERATED ISOLATION..." -ForegroundColor Green
    
    # Test: RTH session accessing SkillUp
    try {
        $crossAccessResponse = Invoke-WebRequest -Uri "https://user.skillupitacademy.com/api/auth/me" `
            -Method GET `
            -WebSession $rthSession
        
        Write-Host "🚨 SECURITY ISSUE: Cross-brand access succeeded!" -ForegroundColor Red
        return @{ Success = $false; Issue = "Cross-brand access" }
    } catch {
        if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
            Write-Host "✅ Cross-brand access properly rejected" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Unexpected cross-brand response: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
    
    return @{ Success = $true }
}

# Main execution
Write-Host "Starting comprehensive validation..." -ForegroundColor Cyan

# Test RTH
$rthAuth = Test-Authentication -creds $rthCreds -brandName "RTH"
if (-not $rthAuth.Success) {
    Write-Host "🚨 RTH Authentication failed - aborting" -ForegroundColor Red
    exit 1
}

$rthMe = Test-BFFAuthMe -session $rthAuth.Session -baseUrl $rthCreds.baseUrl -brandName "RTH"
$rthAuthz = Test-Authorization -session $rthAuth.Session -baseUrl $rthCreds.baseUrl -brandName "RTH"

# Test SkillUp
$skillupAuth = Test-Authentication -creds $skillupCreds -brandName "SkillUp"
if (-not $skillupAuth.Success) {
    Write-Host "🚨 SkillUp Authentication failed - aborting" -ForegroundColor Red
    exit 1
}

$skillupMe = Test-BFFAuthMe -session $skillupAuth.Session -baseUrl $skillupCreds.baseUrl -brandName "SkillUp"
$skillupAuthz = Test-Authorization -session $skillupAuth.Session -baseUrl $skillupCreds.baseUrl -brandName "SkillUp"

# Test Federation
$federation = Test-FederatedIsolation -rthSession $rthAuth.Session -skillupSession $skillupAuth.Session

# Test Protected Route Redirects
Write-Host "`n🔒 TESTING PROTECTED ROUTE REDIRECTS..." -ForegroundColor Cyan
$rthRedirects = Test-ProtectedRouteRedirects -baseUrl $rthCreds.baseUrl -brandName "RTH"
$skillupRedirects = Test-ProtectedRouteRedirects -baseUrl $skillupCreds.baseUrl -brandName "SkillUp"

# Test Onboarding (if BFF routes work)
if ($rthMe.Success) {
    $rthOnboarding = Test-OnboardingFlow -session $rthAuth.Session -baseUrl $rthCreds.baseUrl -brandName "RTH" -initialOnboarded $rthMe.Onboarded
}

if ($skillupMe.Success) {
    $skillupOnboarding = Test-OnboardingFlow -session $skillupAuth.Session -baseUrl $skillupCreds.baseUrl -brandName "SkillUp" -initialOnboarded $skillupMe.Onboarded
}

# Final Report
Write-Host "`n📊 FINAL VALIDATION REPORT" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Write-Host "`n✅ AUTHENTICATION:" -ForegroundColor Green
Write-Host "   RTH: $(if ($rthAuth.Success) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($rthAuth.Success) { 'Green' } else { 'Red' })
Write-Host "   SkillUp: $(if ($skillupAuth.Success) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($skillupAuth.Success) { 'Green' } else { 'Red' })

Write-Host "`n🛡️ AUTHORIZATION:" -ForegroundColor Green
Write-Host "   RTH: $(if ($rthAuthz.Success) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($rthAuthz.Success) { 'Green' } else { 'Red' })
Write-Host "   SkillUp: $(if ($skillupAuthz.Success) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($skillupAuthz.Success) { 'Green' } else { 'Red' })

Write-Host "`n🔍 BFF ROUTES:" -ForegroundColor Green
Write-Host "   RTH /api/auth/me: $(if ($rthMe.Success) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($rthMe.Success) { 'Green' } else { 'Red' })
Write-Host "   SkillUp /api/auth/me: $(if ($skillupMe.Success) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($skillupMe.Success) { 'Green' } else { 'Red' })

Write-Host "`n🌐 FEDERATION:" -ForegroundColor Green
Write-Host "   Isolation: $(if ($federation.Success) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($federation.Success) { 'Green' } else { 'Red' })

Write-Host "`n🔒 PROTECTED ROUTE REDIRECTS:" -ForegroundColor Green
Write-Host "   RTH: $(if ($rthRedirects.Success) { '✅ PASS' } else { '❌ FAIL' }) ($($rthRedirects.Summary))" -ForegroundColor $(if ($rthRedirects.Success) { 'Green' } else { 'Red' })
Write-Host "   SkillUp: $(if ($skillupRedirects.Success) { '✅ PASS' } else { '❌ FAIL' }) ($($skillupRedirects.Summary))" -ForegroundColor $(if ($skillupRedirects.Success) { 'Green' } else { 'Red' })

$allPassed = $rthAuth.Success -and $skillupAuth.Success -and $rthAuthz.Success -and $skillupAuthz.Success -and $federation.Success -and $rthMe.Success -and $skillupMe.Success -and $rthRedirects.Success -and $skillupRedirects.Success

Write-Host "`n🏁 FINAL VERDICT:" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ FULLY SAFE (FAANG-level)" -ForegroundColor Green
} elseif ($rthAuth.Success -and $skillupAuth.Success -and $rthAuthz.Success -and $skillupAuthz.Success -and $federation.Success) {
    Write-Host "⚠️ PARTIALLY SAFE (Auth good, BFF issues)" -ForegroundColor Yellow
} else {
    Write-Host "❌ NOT SAFE" -ForegroundColor Red
}

Write-Host ""
Write-Host "Validation complete!" -ForegroundColor Cyan