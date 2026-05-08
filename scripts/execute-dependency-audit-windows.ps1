# Tutorial Legacy System Dependency Audit (Windows PowerShell)
# Performs comprehensive audit of all dependencies on legacy system

$ErrorActionPreference = "Continue"

Write-Host "`n[AUDIT] Starting Tutorial Legacy System Dependency Audit...`n" -ForegroundColor Cyan

$findings = @()

# Define search patterns
$patterns = @(
    @{
        Pattern = "/api/tutorial/content"
        Category = "Frontend API Call"
        ExcludePaths = @("node_modules", ".next", ".turbo", "dist", "build", "audit-reports", "docs")
    },
    @{
        Pattern = "TutorialService"
        Category = "Backend Service"
        ExcludePaths = @("node_modules", ".next", ".turbo", "dist", "build", "audit-reports")
    },
    @{
        Pattern = "tutorialContent|tutorial_content"
        Category = "Database Query"
        ExcludePaths = @("node_modules", ".next", ".turbo", "dist", "build", "audit-reports", "packages/db-tutorial/src/schema")
    }
)

function Get-Risk {
    param($file, $content)
    
    # Deprecated routes are expected (LOW risk)
    if ($file -match "api[\\/]tutorial[\\/]content[\\/]\[subtopicId\][\\/]route\.ts") {
        return "LOW"
    }
    
    # Documentation is LOW risk
    if ($file -match "docs[\\/]" -or $file -match "README") {
        return "LOW"
    }
    
    # Test files are LOW risk
    if ($file -match "__tests__" -or $file -match "\.test\." -or $file -match "\.spec\." -or $file -match "scripts[\\/]test-") {
        return "LOW"
    }
    
    # Scripts are MEDIUM risk
    if ($file -match "scripts[\\/]") {
        return "MEDIUM"
    }
    
    # Production frontend code is HIGH risk
    if ($file -match "apps[\\/]" -and $file -match "src[\\/]" -and $file -notmatch "api[\\/]") {
        return "HIGH"
    }
    
    # Backend services are HIGH risk
    if ($file -match "modules[\\/]" -or $file -match "services[\\/]" -or $file -match "repositories[\\/]") {
        return "HIGH"
    }
    
    return "MEDIUM"
}

function Get-Action {
    param($file, $risk)
    
    if ($file -match "api[\\/]tutorial[\\/]content[\\/]\[subtopicId\][\\/]route\.ts") {
        return "Keep with deprecation warnings (already implemented)"
    }
    
    if ($file -match "docs[\\/]" -or $file -match "README") {
        return "Update documentation to reference new system"
    }
    
    if ($file -match "__tests__" -or $file -match "\.test\." -or $file -match "\.spec\.") {
        return "Update tests or mark as deprecated"
    }
    
    if ($file -match "scripts[\\/]") {
        return "Review and migrate to tutorial_sections if actively used"
    }
    
    if ($risk -eq "HIGH") {
        return "URGENT: Migrate to /api/tutorial/sections/* system"
    }
    
    return "Review and determine migration priority"
}

# Search for each pattern
foreach ($searchPattern in $patterns) {
    Write-Host "Searching for: $($searchPattern.Pattern) ($($searchPattern.Category))..." -ForegroundColor Yellow
    
    $fileExtensions = @("*.ts", "*.tsx", "*.js", "*.jsx")
    $count = 0
    
    foreach ($ext in $fileExtensions) {
        $files = Get-ChildItem -Path . -Filter $ext -Recurse -ErrorAction SilentlyContinue | Where-Object {
            $file = $_
            $exclude = $false
            foreach ($excludePath in $searchPattern.ExcludePaths) {
                if ($file.FullName -match [regex]::Escape($excludePath)) {
                    $exclude = $true
                    break
                }
            }
            -not $exclude
        }
        
        foreach ($file in $files) {
            $lineNumber = 0
            $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
            
            foreach ($line in $content) {
                $lineNumber++
                
                if ($line -match $searchPattern.Pattern) {
                    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
                    $risk = Get-Risk -file $relativePath -content $line
                    $action = Get-Action -file $relativePath -risk $risk
                    
                    $findings += [PSCustomObject]@{
                        Category = $searchPattern.Category
                        File = $relativePath
                        Line = $lineNumber
                        Content = $line.Trim()
                        Risk = $risk
                        Action = $action
                    }
                    
                    $count++
                }
            }
        }
    }
    
    Write-Host "  Found: $count references" -ForegroundColor Gray
}

# Generate report
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$byRisk = $findings | Group-Object Risk | ForEach-Object { @{$_.Name = $_.Count} }
$byCategory = $findings | Group-Object Category | ForEach-Object { @{$_.Name = $_.Count} }

$highCount = ($findings | Where-Object { $_.Risk -eq "HIGH" }).Count
$mediumCount = ($findings | Where-Object { $_.Risk -eq "MEDIUM" }).Count
$lowCount = ($findings | Where-Object { $_.Risk -eq "LOW" }).Count

# Print report
Write-Host "`n$('=' * 100)" -ForegroundColor Cyan
Write-Host "TUTORIAL LEGACY SYSTEM DEPENDENCY AUDIT REPORT" -ForegroundColor Cyan
Write-Host "$('=' * 100)" -ForegroundColor Cyan
Write-Host "`nTimestamp: $timestamp"
Write-Host "Total Findings: $($findings.Count)"

Write-Host "`n$('-' * 100)" -ForegroundColor Gray
Write-Host "FINDINGS BY RISK LEVEL" -ForegroundColor Yellow
Write-Host "$('-' * 100)" -ForegroundColor Gray
Write-Host "[HIGH]   $highCount (Requires immediate migration)" -ForegroundColor Red
Write-Host "[MEDIUM] $mediumCount (Review and plan migration)" -ForegroundColor Yellow
Write-Host "[LOW]    $lowCount (Expected references - docs, tests, deprecated routes)" -ForegroundColor Green

Write-Host "`n$('-' * 100)" -ForegroundColor Gray
Write-Host "FINDINGS BY CATEGORY" -ForegroundColor Yellow
Write-Host "$('-' * 100)" -ForegroundColor Gray
$findings | Group-Object Category | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count)"
}

Write-Host "`n$('-' * 100)" -ForegroundColor Gray
Write-Host "DETAILED FINDINGS" -ForegroundColor Yellow
Write-Host "$('-' * 100)" -ForegroundColor Gray

foreach ($risk in @("HIGH", "MEDIUM", "LOW")) {
    $riskFindings = $findings | Where-Object { $_.Risk -eq $risk }
    if ($riskFindings.Count -eq 0) { continue }
    
    if ($risk -eq "HIGH") {
        $icon = "[HIGH]"
        $color = "Red"
    } elseif ($risk -eq "MEDIUM") {
        $icon = "[MEDIUM]"
        $color = "Yellow"
    } else {
        $icon = "[LOW]"
        $color = "Green"
    }
    
    Write-Host "`n$icon $risk RISK ($($riskFindings.Count) findings):" -ForegroundColor $color
    Write-Host "$('-' * 100)" -ForegroundColor Gray
    
    foreach ($finding in $riskFindings | Select-Object -First 20) {
        Write-Host "`n  File: $($finding.File):$($finding.Line)"
        Write-Host "  Category: $($finding.Category)"
        $contentPreview = if ($finding.Content.Length -gt 100) { $finding.Content.Substring(0, 100) + "..." } else { $finding.Content }
        Write-Host "  Content: $contentPreview"
        Write-Host "  Action: $($finding.Action)"
    }
    
    if ($riskFindings.Count -gt 20) {
        Write-Host "`n  ... and $($riskFindings.Count - 20) more findings" -ForegroundColor Gray
    }
}

Write-Host "`n$('-' * 100)" -ForegroundColor Gray
Write-Host "RECOMMENDATIONS" -ForegroundColor Yellow
Write-Host "$('-' * 100)" -ForegroundColor Gray

if ($highCount -gt 0) {
    Write-Host "  [URGENT] $highCount HIGH-RISK dependencies found - immediate migration required" -ForegroundColor Red
}

if ($mediumCount -gt 0) {
    Write-Host "  [INFO] $mediumCount MEDIUM-RISK dependencies found - review and plan migration" -ForegroundColor Yellow
}

if ($lowCount -gt 0) {
    Write-Host "  [OK] $lowCount LOW-RISK references found - mostly expected (deprecated routes, docs, tests)" -ForegroundColor Green
}

if ($highCount -eq 0 -and $mediumCount -eq 0) {
    Write-Host "  [OK] NO HIGH or MEDIUM risk dependencies found" -ForegroundColor Green
    Write-Host "  [OK] Safe to proceed with Phase 5 (Final Removal) after LOW-RISK cleanup" -ForegroundColor Green
}

Write-Host "`n$('-' * 100)" -ForegroundColor Gray
Write-Host "NEXT STEPS" -ForegroundColor Yellow
Write-Host "$('-' * 100)" -ForegroundColor Gray

if ($highCount -gt 0) {
    Write-Host "  1. [URGENT] Review and migrate HIGH-RISK dependencies immediately" -ForegroundColor Red
    Write-Host "  2. Plan migration for MEDIUM-RISK dependencies"
    Write-Host "  3. Clean up LOW-RISK references (docs, tests)"
    Write-Host "  4. Defer Phase 5 (Final Removal) until migrations complete"
} elseif ($mediumCount -gt 0) {
    Write-Host "  1. Review MEDIUM-RISK dependencies and create migration plan"
    Write-Host "  2. Clean up LOW-RISK references (docs, tests)"
    Write-Host "  3. Defer Phase 5 (Final Removal) until migrations complete"
} else {
    Write-Host "  1. [OK] Clean up LOW-RISK references (docs, tests, deprecated routes)" -ForegroundColor Green
    Write-Host "  2. [OK] Proceed to Phase 5 (Final Removal) - safe to remove legacy system" -ForegroundColor Green
    Write-Host "  3. [SUCCESS] No production code depends on legacy system" -ForegroundColor Green
}

Write-Host "`n$('=' * 100)" -ForegroundColor Cyan

# Save report
$reportsDir = "audit-reports"
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

$reportFile = Join-Path $reportsDir "tutorial-legacy-audit-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').json"
$findings | ConvertTo-Json -Depth 10 | Out-File $reportFile

Write-Host "`n[SAVED] Full report saved to: $reportFile" -ForegroundColor Cyan
Write-Host "`n[COMPLETE] Audit complete!`n" -ForegroundColor Green
