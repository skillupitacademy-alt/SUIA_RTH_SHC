# HMR Cycle Test Script
# Triggers multiple HMR cycles and measures pool state after each

param(
    [int]$Cycles = 5,
    [string]$TestVariant = "A"
)

$file = "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/page.tsx"
$results = @()

Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host "HMR Cycle Test - Variant $TestVariant" -ForegroundColor Cyan
Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host ""

for ($i = 1; $i -le $Cycles; $i++) {
    Write-Host "[Cycle $i/$Cycles] Triggering HMR..." -ForegroundColor Yellow
    
    # Read file
    $content = Get-Content $file -Raw
    
    # Modify comment to trigger HMR
    if ($content -match "// HMR Cycle \d+") {
        $content = $content -replace "// HMR Cycle \d+", "// HMR Cycle $i"
    } else {
        $content = $content -replace "(export const metadata = \{[^}]+\};)", "`$1`n`n// HMR Cycle $i"
    }
    
    # Write back
    $content | Out-File $file -Encoding utf8 -NoNewline
    
    Write-Host "  Waiting for compilation..." -ForegroundColor Gray
    Start-Sleep -Seconds 6
    
    Write-Host "  Running diagnostic..." -ForegroundColor Gray
    $output = node scripts/diagnose-tutorial-db-connection.mjs 2>&1 | Out-String
    
    # Parse output
    if ($output -match "Query executed \((\d+)ms\)") {
        $duration = [int]$Matches[1]
    } else {
        $duration = -1
    }
    
    if ($output -match "Total connections: (\d+)") {
        $totalConns = [int]$Matches[1]
    } else {
        $totalConns = -1
    }
    
    if ($output -match "Idle connections: (\d+)") {
        $idleConns = [int]$Matches[1]
    } else {
        $idleConns = -1
    }
    
    if ($output -match "Waiting count: (\d+)") {
        $waiting = [int]$Matches[1]
    } else {
        $waiting = -1
    }
    
    $success = $output -match "Query executed" -and $duration -gt 0
    
    $results += [PSCustomObject]@{
        Cycle = $i
        Duration = "$duration ms"
        TotalConns = $totalConns
        IdleConns = $idleConns
        Waiting = $waiting
        Success = if ($success) { "✅" } else { "❌" }
    }
    
    Write-Host "  Duration: $duration ms | Connections: $totalConns total, $idleConns idle" -ForegroundColor $(if ($success) { "Green" } else { "Red" })
    Write-Host ""
}

Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host "RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Analysis:" -ForegroundColor Cyan
$maxConns = ($results | Measure-Object -Property TotalConns -Maximum).Maximum
$minConns = ($results | Measure-Object -Property TotalConns -Minimum).Minimum
$avgDuration = ($results | Where-Object { $_.Duration -ne "-1 ms" } | ForEach-Object { [int]($_.Duration -replace " ms", "") } | Measure-Object -Average).Average

Write-Host "  Max connections: $maxConns"
Write-Host "  Min connections: $minConns"
Write-Host "  Avg duration: $([math]::Round($avgDuration, 1)) ms"

if ($maxConns -gt $minConns) {
    Write-Host "  ⚠️  Pool size INCREASED across cycles" -ForegroundColor Red
} else {
    Write-Host "  ✅ Pool size remained STABLE" -ForegroundColor Green
}

Write-Host ""
