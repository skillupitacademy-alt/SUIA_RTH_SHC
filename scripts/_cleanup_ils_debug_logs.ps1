# Phase 4.6 Diagnostic Log Cleanup Script
# Removes all [ILS-DEBUG] console.log/console.warn/console.error statements
# while preserving all business logic

$files = @(
    "src\share-branding\LearningExperience\runtime\tutorialSessionService.ts",
    "packages\ui\src\tutorial\runtime\BlockTelemetryProvider.tsx",
    "packages\db-tutorial\src\services\learning-progress.service.ts",
    "packages\db-tutorial\src\repositories\block-learning-state.repository.ts",
    "apps\skillup-web\src\lib\student-auth.ts",
    "apps\skillup-web\src\app\api\tutorial\ils\block-visit\route.ts",
    "apps\api-server\src\app\api\tutorial\ils\block-visit\route.ts"
)

$pattern = '^\s*console\.(log|warn|error)\(\s*\x27\[ILS-DEBUG\].*?\);\s*$'

$totalRemoved = 0

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot "..\$file"
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "⚠️  File not found: $file" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Processing: $file"
    
    $content = Get-Content $fullPath -Raw
    $lines = Get-Content $fullPath
    
    $newLines = @()
    $removedCount = 0
    $i = 0
    
    while ($i -lt $lines.Count) {
        $line = $lines[$i]
        
        # Check if this line starts an [ILS-DEBUG] console statement
        if ($line -match '^\s*console\.(log|warn|error)\(\s*\x27\[ILS-DEBUG\]') {
            # Multi-line console statement - find the closing );
            $fullStatement = $line
            $j = $i + 1
            
            while ($j -lt $lines.Count -and $fullStatement -notmatch '\);\s*$') {
                $fullStatement += "`n" + $lines[$j]
                $j++
            }
            
            # Skip all lines that were part of this statement
            $i = $j
            $removedCount++
            $totalRemoved++
        }
        else {
            $newLines += $line
            $i++
        }
    }
    
    if ($removedCount -gt 0) {
        $newLines | Set-Content $fullPath
        Write-Host "  ✅ Removed $removedCount diagnostic log(s)" -ForegroundColor Green
    }
    else {
        Write-Host "  ℹ️  No diagnostic logs found" -ForegroundColor Cyan
    }
}

Write-Host "`n=== CLEANUP COMPLETE ===" -ForegroundColor Green
Write-Host "Total diagnostic logs removed: $totalRemoved" -ForegroundColor Green
Write-Host "`nNext steps:"
Write-Host "1. Review changes: git diff"
Write-Host "2. Run tests: cd packages/db-tutorial && pnpm test block-learning-state.integration.test.ts"
Write-Host "3. If tests pass: git add . && git commit -m 'chore: remove temporary Phase 4.6 diagnostics'"
