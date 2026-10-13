# Test execution script for brand-isolation removal validation
# This script loads environment from .env.local and runs all test suites

$ErrorActionPreference = "Continue"
$OutputFile = "e:\onlinewebsites\quiz-platform\.agents\tasks\brand-isolation-removal\test-results-final.txt"
$JsonFile = "e:\onlinewebsites\quiz-platform\.agents\tasks\brand-isolation-removal\test-counts.json"

# Clear output file
"=== Brand Isolation Removal Test Results ===" | Out-File -FilePath $OutputFile -Encoding utf8
"Execution Date: $(Get-Date)" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

# Load environment from .env.local
$envFilePath = "e:\onlinewebsites\quiz-platform\.env.local"
if (Test-Path $envFilePath) {
    Get-Content $envFilePath | ForEach-Object {
        if ($_ -match '^([^=#]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    "[OK] Loaded environment from .env.local" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "  DATABASE_URL_TUTORIAL is set: $([Environment]::GetEnvironmentVariable('DATABASE_URL_TUTORIAL') -ne $null)" | Out-File -FilePath $OutputFile -Append -Encoding utf8
} else {
    "[ERROR] .env.local not found at $envFilePath" | Out-File -FilePath $OutputFile -Append -Encoding utf8
}
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

# Initialize result tracking
$results = @{
    security_tests = @{ passed = 0; failed = 0; skipped = 0; errors = 0; exit_code = 0 }
    integration_security = @{ passed = 0; failed = 0; skipped = 0; errors = 0; exit_code = 0 }
    unit_tests = @{ passed = 0; failed = 0; skipped = 0; errors = 0; exit_code = 0 }
    import_checks = @{ governance = ""; models = "" }
    overall_decision = "PASS"
}

# Helper function to parse pytest output
function Parse-PytestOutput {
    param($output, $exitCode)
    
    $passed = 0
    $failed = 0
    $skipped = 0
    $errors = 0
    
    # Look for summary line like "8 passed in 2.34s" or "1270 skipped, 7 warnings"
    if ($output -match '(\d+) passed') {
        $passed = [int]$matches[1]
    }
    if ($output -match '(\d+) failed') {
        $failed = [int]$matches[1]
    }
    if ($output -match '(\d+) skipped') {
        $skipped = [int]$matches[1]
    }
    if ($output -match '(\d+) error') {
        $errors = [int]$matches[1]
    }
    
    return @{
        passed = $passed
        failed = $failed
        skipped = $skipped
        errors = $errors
        exit_code = $exitCode
    }
}

# Test 1: Import checks
"=== Test 1: Import Checks ===" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

"Command: python -c `"from app.api.routes import governance; print('import OK')`"" | Out-File -FilePath $OutputFile -Append -Encoding utf8
$governanceOutput = python -c "from app.api.routes import governance; print('import OK')" 2>&1 | Out-String
$governanceExitCode = $LASTEXITCODE
$governanceOutput | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Exit Code: $governanceExitCode" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

if ($governanceExitCode -eq 0 -and $governanceOutput -match "import OK") {
    $results.import_checks.governance = "OK"
} else {
    $results.import_checks.governance = "ERROR"
    $results.overall_decision = "FAIL"
}

"Command: python -c `"from app.persistence import models; print('import OK')`"" | Out-File -FilePath $OutputFile -Append -Encoding utf8
$modelsOutput = python -c "from app.persistence import models; print('import OK')" 2>&1 | Out-String
$modelsExitCode = $LASTEXITCODE
$modelsOutput | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Exit Code: $modelsExitCode" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

if ($modelsExitCode -eq 0 -and $modelsOutput -match "import OK") {
    $results.import_checks.models = "OK"
} else {
    $results.import_checks.models = "ERROR"
    $results.overall_decision = "FAIL"
}

# Test 2: Security tests
"=== Test 2: Security Tests ===" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Command: python -m pytest tests/security/ -v --tb=short" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

$securityOutput = python -m pytest tests/security/ -v --tb=short 2>&1 | Out-String
$securityExitCode = $LASTEXITCODE
$securityOutput | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Exit Code: $securityExitCode" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

$results.security_tests = Parse-PytestOutput $securityOutput $securityExitCode
if ($securityExitCode -ne 0) {
    $results.overall_decision = "FAIL"
}

# Test 3: Integration security tests
"=== Test 3: Integration Security Tests ===" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Command: python -m pytest tests/integration/test_security_integration.py -v --tb=short" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

$integrationOutput = python -m pytest tests/integration/test_security_integration.py -v --tb=short 2>&1 | Out-String
$integrationExitCode = $LASTEXITCODE
$integrationOutput | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Exit Code: $integrationExitCode" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

$results.integration_security = Parse-PytestOutput $integrationOutput $integrationExitCode
if ($integrationExitCode -ne 0) {
    $results.overall_decision = "FAIL"
}

# Test 4: Unit tests (non-DB-dependent subset)
"=== Test 4: Unit Tests (non-DB-dependent) ===" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Command: python -m pytest tests/unit/ -v --tb=short -k `"not PostgreSQL`"" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

$unitOutput = python -m pytest tests/unit/ -v --tb=short -k "not PostgreSQL" 2>&1 | Out-String
$unitExitCode = $LASTEXITCODE
$unitOutput | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Exit Code: $unitExitCode" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8

$results.unit_tests = Parse-PytestOutput $unitOutput $unitExitCode
if ($unitExitCode -ne 0) {
    $results.overall_decision = "FAIL"
}

# Write summary
"=== SUMMARY ===" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Import Checks:" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"  governance routes: $($results.import_checks.governance)" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"  models: $($results.import_checks.models)" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Security Tests: $($results.security_tests.passed) passed, $($results.security_tests.failed) failed, $($results.security_tests.skipped) skipped, $($results.security_tests.errors) errors (exit code: $($results.security_tests.exit_code))" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Integration Security: $($results.integration_security.passed) passed, $($results.integration_security.failed) failed, $($results.integration_security.skipped) skipped, $($results.integration_security.errors) errors (exit code: $($results.integration_security.exit_code))" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Unit Tests: $($results.unit_tests.passed) passed, $($results.unit_tests.failed) failed, $($results.unit_tests.skipped) skipped, $($results.unit_tests.errors) errors (exit code: $($results.unit_tests.exit_code))" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Overall Decision: $($results.overall_decision)" | Out-File -FilePath $OutputFile -Append -Encoding utf8

# Write JSON
$results | ConvertTo-Json -Depth 3 | Out-File -FilePath $JsonFile -Encoding utf8

Write-Host "Test execution complete. Results written to:"
Write-Host "  $OutputFile"
Write-Host "  $JsonFile"
Write-Host ""
Write-Host "Overall Decision: $($results.overall_decision)"
