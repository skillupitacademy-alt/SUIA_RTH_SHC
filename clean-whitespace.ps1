# Parse git diff --check output and clean trailing whitespace
param(
    [string]$ViolationsFile = "whitespace-violations.txt"
)

# Parse violations file to extract file:line mappings
$violations = @{}
Get-Content $ViolationsFile | ForEach-Object {
    if ($_ -match '^(.+?):(\d+):' -and -not ($_ -match '^\+')) {
        $file = $matches[1]
        $line = [int]$matches[2]
        
        # Only include if file exists
        if (Test-Path $file) {
            if (-not $violations.ContainsKey($file)) {
                $violations[$file] = @()
            }
            # Git reports 1-indexed lines, PowerShell arrays are 0-indexed
            $violations[$file] += $line
        }
    }
}

Write-Host "Found violations in $($violations.Count) files"

$filesProcessed = 0
$linesFixed = 0
$fileCount = 0
$totalFiles = $violations.Keys.Count

Write-Host "Starting to process $totalFiles files..." -ForegroundColor Green

foreach ($file in $violations.Keys | Sort-Object) {
    $fileCount++
    
    try {
        Write-Host "[$fileCount/$totalFiles] Processing: $file" -ForegroundColor Cyan
        
        if (Test-Path $file) {
            # Read all lines - try UTF8, fall back to default
            try {
                $lines = Get-Content $file -Encoding UTF8
            } catch {
                Write-Host "  UTF8 failed, trying default encoding..." -ForegroundColor Yellow
                $lines = Get-Content $file
            }
            
            Write-Host "  File has $($lines.Count) lines, checking violations..." -ForegroundColor Gray
            
            # Get unique line numbers for this file (convert to 0-indexed)
            $linesToFix = $violations[$file] | ForEach-Object { $_ - 1 } | Sort-Object -Unique
            Write-Host "  Found $($linesToFix.Count) lines to fix" -ForegroundColor Gray
            
            # Remove trailing whitespace from specified lines only
            $modified = $false
            $fixedInFile = 0
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($linesToFix -contains $i) {
                    $original = $lines[$i]
                    $cleaned = $lines[$i] -replace '\s+$', ''
                    if ($original -ne $cleaned) {
                        $lines[$i] = $cleaned
                        $modified = $true
                        $linesFixed++
                        $fixedInFile++
                    }
                }
            }
            
            if ($modified) {
                Write-Host "  Fixed $fixedInFile lines, writing file..." -ForegroundColor Green
                # Write back with UTF8 encoding (no BOM)
                $utf8NoBom = New-Object System.Text.UTF8Encoding $false
                [System.IO.File]::WriteAllLines((Resolve-Path $file).Path, $lines, $utf8NoBom)
                $filesProcessed++
                Write-Host "  SUCCESS: File written" -ForegroundColor Green
            } else {
                Write-Host "  No changes needed (whitespace already clean)" -ForegroundColor Gray
            }
            
            if ($fileCount % 10 -eq 0) {
                Write-Host ""
                Write-Host "=== PROGRESS: $fileCount/$totalFiles files checked, $filesProcessed modified, $linesFixed lines fixed ===" -ForegroundColor Magenta
                Write-Host ""
            }
        } else {
            Write-Host "  WARNING: File not found: $file" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ERROR processing $file : $_" -ForegroundColor Red
        Write-Host "  Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Cleanup complete:"
Write-Host "  Files processed: $filesProcessed"
Write-Host "  Lines fixed: $linesFixed"
