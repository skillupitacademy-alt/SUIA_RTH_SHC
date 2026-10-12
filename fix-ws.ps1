# Direct whitespace fix
$modifiedFiles = git diff --name-only
$fixed = 0
$total = ($modifiedFiles | Measure-Object).Count
Write-Host "Processing $total modified files..."
$count = 0
foreach ($file in $modifiedFiles) {
    $count++
    if (Test-Path $file) {
        Write-Host "[$count/$total] $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        $fixed_content = $content -replace '[ \t]+(\r?\n)', '$1' -replace '[ \t]+$', ''
        if ($content -ne $fixed_content) {
            [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $fixed_content, (New-Object System.Text.UTF8Encoding $false))
            $fixed++
        }
    }
}
Write-Host "Fixed $fixed files"
