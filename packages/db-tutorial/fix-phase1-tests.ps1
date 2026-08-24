# Phase 1: Fix test files to include navigationNodeId parameter

$testFiles = @(
    "src/services/__tests__/c1-018-composer-delivery.integration.test.ts",
    "src/services/__tests__/gate-4-concurrency.integration.test.ts",
    "src/services/__tests__/phase-1h-definition-d1-persistence.integration.test.ts",
    "src/services/__tests__/v2-composer-integration.test.ts",
    "src/services/__tests__/v2-delivery-integration.test.ts"
)

foreach ($file in $testFiles) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processing $file..."
        $content = Get-Content $fullPath -Raw
        
        # Add constant after imports if not already present
        if ($content -notmatch 'TEST_NAVIGATION_NODE_ID') {
            $content = $content -replace '(import .+;\n)', "`$1`n// Phase 1: Test helper`nconst TEST_NAVIGATION_NODE_ID = 'test-page-default';`n"
        }
        
        # Add navigationNodeId to createTutorial calls
        $content = $content -replace '(\{[^\}]*subtopicId:[^\}]*brandId:[^\}]*content:[^\}]*)(\})', '$1, navigationNodeId: TEST_NAVIGATION_NODE_ID $2'
        
        Set-Content $fullPath $content -NoNewline
        Write-Host "Updated $file"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "All test files updated"
