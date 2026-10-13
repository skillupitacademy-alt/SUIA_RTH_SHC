# Load environment variables from root .env.local
$envFile = "..\..\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2] -replace '^"' -replace '"$'
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Output "Environment loaded from $envFile"
} else {
    Write-Output "ERROR: .env.local not found at $envFile"
    exit 1
}

# Run validation tests
Write-Output "`n=== Running Validation Test 1: Repository Layer ==="
python -m pytest tests/integration/test_repositories_integration.py::test_workflow_upsert_and_get -v --tb=short

Write-Output "`n=== Running Validation Test 2: Security Integration ==="
python -m pytest tests/integration/test_security_integration.py::test_contract_admin_can_create_workflow -v --tb=short

Write-Output "`n=== Running Validation Test 3: Implementation Approval ==="
python -m pytest tests/integration/test_implementation_approval.py::test_submit_approval_success -v --tb=short

Write-Output "`n=== Running ENV_VAR Fix Validation ==="
python -m pytest tests/integration/test_conftest_skip_behavior.py::test_env_var_name_is_consistent -v --tb=short
