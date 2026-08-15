# Run Analysis API Test
# PowerShell script to test the Tutorial Composer Analysis API

$env:SHC_ADMIN_URL = "https://admin.skillhubcore.in"
$env:ADMIN_EMAIL = "admin@skillhubcore.in"
$env:ADMIN_PASSWORD = "testing"

Write-Host "Testing Analysis API..." -ForegroundColor Cyan
Write-Host "URL: $env:SHC_ADMIN_URL" -ForegroundColor Gray
Write-Host "Email: $env:ADMIN_EMAIL" -ForegroundColor Gray
Write-Host ""

node scripts/test-analysis-api.mjs
