#!/usr/bin/env node

/**
 * 🔐 GENERATE TEST TOKENS FOR RBAC TESTING
 * 
 * Generates JWT tokens for different user roles to test RBAC enforcement.
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 GENERATE TEST TOKENS FOR RBAC TESTING');
console.log('========================================\n');

// Check if we can import the token service
let TokenService;
try {
  // Try to load from the built package
  const authPackage = require('./packages/auth/src/token.service.ts');
  TokenService = authPackage.TokenService;
} catch (error) {
  console.error('❌ Cannot load TokenService directly');
  console.error('   This script needs to be run differently\n');
}

// Alternative: Use environment variables or existing tokens
console.log('📋 TOKEN GENERATION OPTIONS:\n');

console.log('OPTION 1: Use Existing User Tokens');
console.log('-----------------------------------');
console.log('If you have existing test users in your database:');
console.log('');
console.log('1. Use your API to login and get tokens:');
console.log('   POST https://your-domain.com/api/auth/login');
console.log('   Body: {"email": "test@example.com", "password": "password"}');
console.log('');
console.log('2. Extract the accessToken from the response');
console.log('');

console.log('OPTION 2: Use PowerShell to Login and Get Tokens');
console.log('------------------------------------------------');
console.log('Run these PowerShell commands:\n');

console.log('# Login as Basic User');
console.log('$response = Invoke-RestMethod -Uri "https://YOUR_DOMAIN/api/auth/login" `');
console.log('  -Method POST `');
console.log('  -ContentType "application/json" `');
console.log('  -Body \'{"email":"basic@test.com","password":"password"}\'');
console.log('$basicToken = $response.accessToken');
console.log('Write-Host "Basic User Token: $basicToken"');
console.log('');

console.log('# Login as Student');
console.log('$response = Invoke-RestMethod -Uri "https://YOUR_DOMAIN/api/auth/login" `');
console.log('  -Method POST `');
console.log('  -ContentType "application/json" `');
console.log('  -Body \'{"email":"student@test.com","password":"password"}\'');
console.log('$studentToken = $response.accessToken');
console.log('Write-Host "Student Token: $studentToken"');
console.log('');

console.log('OPTION 3: Create Test Users First');
console.log('----------------------------------');
console.log('If you don\'t have test users, create them first:');
console.log('');
console.log('POST https://YOUR_DOMAIN/api/auth/signup');
console.log('Body: {');
console.log('  "email": "rbac-basic@test.com",');
console.log('  "password": "Test123!",');
console.log('  "name": "RBAC Basic User"');
console.log('}');
console.log('');
console.log('Then login to get the token.');
console.log('');

console.log('OPTION 4: Manual Configuration');
console.log('------------------------------');
console.log('If you already have tokens from your system:');
console.log('');
console.log('1. Edit rbac-test-config.json directly');
console.log('2. Paste your tokens');
console.log('3. Run: node test-rbac-live-configured.js');
console.log('');

console.log('🎯 RECOMMENDED APPROACH');
console.log('======================\n');
console.log('Use the PowerShell login script below to get tokens:\n');

// Generate a helper PowerShell script
const psScript = `# RBAC Test Token Generator
# Update YOUR_DOMAIN with your actual domain

$domain = "YOUR_DOMAIN"

Write-Host "🔐 Getting Test Tokens..." -ForegroundColor Cyan
Write-Host ""

# Function to login and get token
function Get-AuthToken {
    param($email, $password, $userType)
    
    try {
        $body = @{
            email = $email
            password = $password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "https://$domain/api/auth/login" \`
            -Method POST \`
            -ContentType "application/json" \`
            -Body $body
        
        if ($response.accessToken) {
            Write-Host "✅ $userType Token: $($response.accessToken.Substring(0,50))..." -ForegroundColor Green
            return $response.accessToken
        } else {
            Write-Host "❌ $userType: No token in response" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ $userType: Login failed - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Get tokens for different user types
Write-Host "Logging in as different users..." -ForegroundColor Yellow
Write-Host ""

$basicToken = Get-AuthToken -email "basic@test.com" -password "password" -userType "Basic User"
$studentToken = Get-AuthToken -email "student@test.com" -password "password" -userType "Student"
$invalidToken = Get-AuthToken -email "invalid@test.com" -password "password" -userType "Invalid Role"

Write-Host ""
Write-Host "📝 Creating rbac-test-config.json..." -ForegroundColor Cyan

# Create config file
$config = @{
    domain = $domain
    protocol = "https"
    tokens = @{
        basicUser = $basicToken
        student = $studentToken
        invalidRole = $invalidToken
    }
} | ConvertTo-Json -Depth 3

$config | Out-File -FilePath "rbac-test-config.json" -Encoding UTF8

Write-Host "✅ Configuration file created!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Now run: node test-rbac-live-configured.js" -ForegroundColor Cyan
`;

fs.writeFileSync(path.join(__dirname, 'get-tokens.ps1'), psScript);

console.log('✅ Created PowerShell script: get-tokens.ps1');
console.log('');
console.log('To use it:');
console.log('  1. Edit get-tokens.ps1 and update YOUR_DOMAIN');
console.log('  2. Update the test user emails/passwords');
console.log('  3. Run: powershell -File get-tokens.ps1');
console.log('  4. Then run: node test-rbac-live-configured.js');
console.log('');
