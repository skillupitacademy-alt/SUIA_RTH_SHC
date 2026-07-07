#!/usr/bin/env pwsh
# Test login flow for SUIA user (anujoshi@gmail.com)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Testing SUIA Login Flow" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Test credentials
$email = "anujoshi@gmail.com"
$password = "testing"
$loginUrl = "https://user.skillupitacademy.com/api/auth/login"

Write-Host "1. Testing login endpoint..." -ForegroundColor Yellow
Write-Host "   URL: $loginUrl" -ForegroundColor Gray
Write-Host "   Email: $email" -ForegroundColor Gray
Write-Host ""

try {
    # Create session to handle cookies
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    
    # Prepare login request
    $body = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    # Send login request
    Write-Host "   Sending login request..." -ForegroundColor Gray
    $response = Invoke-WebRequest `
        -Uri $loginUrl `
        -Method POST `
        -Body $body `
        -Headers $headers `
        -WebSession $session `
        -MaximumRedirection 0 `
        -ErrorAction Stop
    
    Write-Host "   Response Status: $($response.StatusCode)" -ForegroundColor Green
    
    # Check cookies
    Write-Host ""
    Write-Host "2. Checking cookies..." -ForegroundColor Yellow
    if ($session.Cookies.Count -gt 0) {
        $cookies = $session.Cookies.GetCookies($loginUrl)
        foreach ($cookie in $cookies) {
            Write-Host "   Cookie: $($cookie.Name)" -ForegroundColor Green
            Write-Host "     Domain: $($cookie.Domain)" -ForegroundColor Gray
            Write-Host "     Value: $($cookie.Value.Substring(0, [Math]::Min(20, $cookie.Value.Length)))..." -ForegroundColor Gray
        }
    } else {
        Write-Host "   No cookies found in session" -ForegroundColor Red
    }
    
    # Parse response
    Write-Host ""
    Write-Host "3. Checking response..." -ForegroundColor Yellow
    $responseData = $response.Content | ConvertFrom-Json
    if ($responseData.success) {
        Write-Host "   Login successful!" -ForegroundColor Green
        Write-Host "   User ID: $($responseData.userId)" -ForegroundColor Gray
        
        # Check if user has completed onboarding
        if ($responseData.user.hasCompletedOnboarding -eq $false) {
            Write-Host "   Onboarding Status: NOT COMPLETED" -ForegroundColor Yellow
            Write-Host "   Expected Redirect: https://user.skillupitacademy.com/onboarding" -ForegroundColor Cyan
        } else {
            Write-Host "   Onboarding Status: COMPLETED" -ForegroundColor Green
            Write-Host "   Expected Redirect: https://user.skillupitacademy.com/dashboard" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   Login failed: $($responseData.message)" -ForegroundColor Red
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   Error: HTTP $statusCode" -ForegroundColor Red
    Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open browser in incognito mode" -ForegroundColor White
Write-Host "2. Go to: https://user.skillupitacademy.com/login" -ForegroundColor White
Write-Host "3. Login with: $email / $password" -ForegroundColor White
Write-Host "4. Verify you are redirected to the correct SUIA URL" -ForegroundColor White
Write-Host "   (NOT redirected to realtutorialhub.com)" -ForegroundColor White
Write-Host ""
