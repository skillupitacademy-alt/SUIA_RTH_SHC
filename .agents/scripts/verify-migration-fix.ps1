# Local verification script for migration fix
# Tests that duplicate enums have been removed

$ErrorActionPreference = "Stop"

Write-Host "=== Migration Fix Verification Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "packages/db-tutorial/migrations/0003_flawless_surge.sql")) {
    Write-Host "❌ ERROR: Not in repository root. Please run from repository root." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Repository structure verified" -ForegroundColor Green
Write-Host ""

# Extract enum names from migration 0003
Write-Host "📋 Extracting enums from migration 0003..." -ForegroundColor Yellow
$enums0003 = Select-String -Path "packages/db-tutorial/migrations/0003_flawless_surge.sql" -Pattern "^CREATE TYPE" | 
    ForEach-Object { 
        if ($_.Line -match '"public"\."([^"]+)"') { 
            $matches[1] 
        } 
    } | Sort-Object

$enumCount0003 = $enums0003.Count
Write-Host "   Found $enumCount0003 enums in migration 0003" -ForegroundColor Gray
Write-Host ""

# Extract enum names from migration 0012
Write-Host "📋 Extracting enums from migration 0012..." -ForegroundColor Yellow
$enums0012 = Select-String -Path "packages/db-tutorial/migrations/0012_futuristic_pepper_potts.sql" -Pattern "^CREATE TYPE" | 
    ForEach-Object { 
        if ($_.Line -match '"public"\."([^"]+)"') { 
            $matches[1] 
        } 
    } | Sort-Object

$enumCount0012 = $enums0012.Count
Write-Host "   Found $enumCount0012 enums in migration 0012" -ForegroundColor Gray
Write-Host ""

# Find duplicates
Write-Host "🔍 Checking for duplicates..." -ForegroundColor Yellow
$duplicates = Compare-Object $enums0003 $enums0012 -IncludeEqual -ExcludeDifferent | Select-Object -ExpandProperty InputObject

if ($duplicates.Count -eq 0) {
    Write-Host "✅ SUCCESS: No duplicate enums found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Migration 0003 enums:" -ForegroundColor Cyan
    $enums0003 | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "Migration 0012 enums:" -ForegroundColor Cyan
    $enums0012 | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "✓ Fix verified - ready to push to GitHub" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ FAILURE: Found duplicate enums:" -ForegroundColor Red
    $duplicates | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "These enums exist in BOTH migration 0003 and 0012." -ForegroundColor Red
    Write-Host "They must be removed from migration 0012." -ForegroundColor Red
    exit 1
}
