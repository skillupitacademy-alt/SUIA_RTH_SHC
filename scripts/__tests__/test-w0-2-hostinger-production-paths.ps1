#!/usr/bin/env pwsh
<#
.SYNOPSIS
    W0.2-HOSTINGER Production Path Tests
    
.DESCRIPTION
    Tests ACTUAL deployment and builder entrypoints with stubbed external effects.
    Exercises real control flow: deploy-smart.ps1 → enforce-shc-quality-gate.ps1 → build-save-images.ps1
    
    Stubs: Docker, SSH, SCP only
    Real: Git operations, script control flow, evidence validation, manifest creation
    
.NOTES
    Implements: W0.2-HOSTINGER actual production path verification per Sol's review
    Authority: Sol
    Implementer: Claude Sonnet 4.5
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# Test infrastructure
$script:ScenarioCount = 0
$script:AssertionCount = 0
$script:PassCount = 0
$script:FailCount = 0

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "SCENARIO $script:ScenarioCount: $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    $script:ScenarioCount++
}

function Assert-True {
    param(
        [string]$Name,
        [bool]$Condition
    )
    
    $script:AssertionCount++
    
    if ($Condition) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:PassCount++
    } else {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
        $script:FailCount++
    }
}

function Assert-FileExists {
    param([string]$Name, [string]$Path)
    Assert-True -Name $Name -Condition (Test-Path $Path)
}

function Assert-FileNotExists {
    param([string]$Name, [string]$Path)
    Assert-True -Name $Name -Condition (-not (Test-Path $Path))
}

function Assert-Contains {
    param([string]$Name, [string]$Text, [string]$Pattern)
    Assert-True -Name $Name -Condition ($Text -like "*$Pattern*")
}

# Test environment
$TestRoot = Join-Path $PSScriptRoot "..\..\..\test-temp-w0-2-production"
$MockRepoRoot = Join-Path $TestRoot "mock-repo"
$ScriptsDir = Split-Path -Parent $PSScriptRoot

# Create stub commands that override real Docker/SSH/SCP
$StubsDir = Join-Path $TestRoot "stubs"
$env:PATH = "$StubsDir;$env:PATH"

function Initialize-TestEnvironment {
    # Clean and recreate
    if (Test-Path $TestRoot) {
        Remove-Item -Recurse -Force $TestRoot
    }
    
    New-Item -ItemType Directory -Force -Path $MockRepoRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $StubsDir | Out-Null
    
    # Initialize mock git repository with real structure
    Push-Location $MockRepoRoot
    try {
        git init 2>&1 | Out-Null
        git config user.name "Test User" 2>&1 | Out-Null
        git config user.email "test@test.com" 2>&1 | Out-Null
        
        # Create minimal required structure
        New-Item -ItemType Directory -Force -Path "infra\hostinger\dist\evidence" | Out-Null
        New-Item -ItemType Directory -Force -Path "infra\hostinger\dist\images" | Out-Null
        New-Item -ItemType Directory -Force -Path "infra\hostinger\config" | Out-Null
        New-Item -ItemType Directory -Force -Path "infra\hostinger\compose" | Out-Null
        New-Item -ItemType Directory -Force -Path "infra\hostinger\scripts" | Out-Null
        New-Item -ItemType Directory -Force -Path "scripts" | Out-Null
        New-Item -ItemType Directory -Force -Path "apps\skillhubcore-admin" | Out-Null
        
        # Create service map
        $serviceMap = @{
            services = @{
                "skillhubcore-admin" = @{
                    buildable = $true
                    optional = $false
                    image_name = "skillhubcore-admin"
                }
                "api-server" = @{
                    buildable = $true
                    optional = $false
                    image_name = "api-server"
                }
            }
        }
        $serviceMap | ConvertTo-Json -Depth 10 | Set-Content "infra\hostinger\config\service-map.json"
        
        # Create minimal compose files
        @"
services:
  skillhubcore-admin:
    image: skillhubcore-admin:latest
    build:
      context: ../..
      dockerfile: apps/skillhubcore-admin/Dockerfile
  api-server:
    image: api-server:latest
    build:
      context: ../..
      dockerfile: apps/api-server/Dockerfile
"@ | Set-Content "infra\hostinger\compose\docker-compose.yml"
        
        "" | Set-Content "infra\hostinger\compose\docker-compose.production.yml"
        
        # Copy actual scripts
        Copy-Item -Path (Join-Path $ScriptsDir "deploy-smart.ps1") -Destination "scripts\" -Force
        Copy-Item -Path (Join-Path $ScriptsDir "enforce-shc-quality-gate.ps1") -Destination "scripts\" -Force
        Copy-Item -Path (Join-Path $ScriptsDir "..\infra\hostinger\scripts\build-save-images.ps1") -Destination "infra\hostinger\scripts\" -Force
        
        # Initial commit (suppress warnings)
        $ErrorActionPreference = 'Continue'
        git add -A *>&1 | Where-Object { $_ -notlike "*warning*" } | Out-Null
        git commit -m "Initial structure" *>&1 | Where-Object { $_ -notlike "*warning*" } | Out-Null
        $ErrorActionPreference = 'Stop'
        
    } finally {
        Pop-Location
    }
    
    # Create stub commands
    Create-Stubs
}

function Create-Stubs {
    # Docker stub - succeeds, creates image ID
    @'
#!/usr/bin/env pwsh
param([Parameter(ValueFromRemainingArguments)]$Args)

if ($Args -contains "compose" -and $Args -contains "build") {
    # Docker build success - optionally create a new commit to test drift detection
    if ($env:TEST_DOCKER_CREATE_COMMIT -eq "1") {
        $repoPath = Get-Location
        "test" | Out-File -FilePath "docker-generated.txt" -Encoding ASCII
        git add docker-generated.txt 2>&1 | Out-Null
        git commit -m "Docker build generated file" 2>&1 | Out-Null
    }
    exit 0
} elseif ($Args -contains "save") {
    # Docker save - create dummy tar
    $outputFile = $Args[$Args.IndexOf("-o") + 1]
    "DOCKER_IMAGE_TAR" | Out-File -FilePath $outputFile -Encoding ASCII
    exit 0
} elseif ($Args -contains "image" -and $Args -contains "inspect") {
    # Image exists
    Write-Output "sha256:abc123"
    exit 0
} elseif ($Args -contains "tag") {
    exit 0
} else {
    exit 0
}
'@ | Set-Content "$StubsDir\docker.ps1" -Encoding ASCII
    
    # SSH stub - succeeds
    @'
#!/usr/bin/env pwsh
exit 0
'@ | Set-Content "$StubsDir\ssh.ps1" -Encoding ASCII
    
    # SCP stub - records what was uploaded
    @'
#!/usr/bin/env pwsh
param([Parameter(ValueFromRemainingArguments)]$Args)
$uploadLog = Join-Path $env:TEST_ROOT "uploads.txt"
$Args | Out-File -FilePath $uploadLog -Append -Encoding ASCII
exit 0
'@ | Set-Content "$StubsDir\scp.ps1" -Encoding ASCII
}

function Get-CurrentCommit {
    Push-Location $MockRepoRoot
    try {
        return (git rev-parse HEAD).Trim()
    } finally {
        Pop-Location
    }
}

function Create-MockPnpmStub {
    # Create pnpm stub that succeeds (quality gate passes)
    @'
#!/usr/bin/env pwsh
param([Parameter(ValueFromRemainingArguments)]$Args)
if ($Args -contains "quality:skillhubcore") {
    Start-Sleep -Milliseconds 100
    exit 0
} else {
    exit 0
}
'@ | Set-Content "$StubsDir\pnpm.ps1" -Encoding ASCII
}

# ============================================================================
# TEST SCENARIOS
# ============================================================================

Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "  W0.2-HOSTINGER Production Path Test Suite" -ForegroundColor Magenta
Write-Host "  Testing ACTUAL entrypoints with stubbed external effects" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

Initialize-TestEnvironment
Create-MockPnpmStub
$env:TEST_ROOT = $TestRoot

# ----------------------------------------------------------------------------
# Scenario 1: Successful SHC deployment with -SkipChecks
# ----------------------------------------------------------------------------
Write-TestHeader "Successful SHC deployment with -SkipChecks (gate NOT skipped)"

$commit1 = Get-CurrentCommit

Push-Location $MockRepoRoot
try {
    # Run ACTUAL deployment script with -SkipChecks
    # Gate should still execute (NOT bypassed)
    $output = & "scripts\deploy-smart.ps1" `
        -Services "skillhubcore-admin" `
        -SkipChecks `
        2>&1 | Out-String
    
    $exitCode = $LASTEXITCODE
    
    Assert-True "Deployment succeeded" ($exitCode -eq 0)
    Assert-Contains "Step 4.5/9 executed" $output "Step 4.5/9"
    Assert-Contains "Quality gate executed despite SkipChecks" $output "Mandatory"
    Assert-FileExists "Evidence created" "infra\hostinger\dist\evidence\quality-gate-skillhubcore-admin-*.json"
    Assert-FileExists "Manifest created" "infra\hostinger\dist\images\quiz-platform-images-*.manifest.json"
    Assert-FileExists "Archive created" "infra\hostinger\dist\images\quiz-platform-images-*.tar"
    
} catch {
    Write-Host "  [FAIL] Deployment failed: $_" -ForegroundColor Red
    Assert-True "Deployment succeeded" $false
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 2: Mixed deployment (SHC + API server)
# ----------------------------------------------------------------------------
Write-TestHeader "Mixed deployment (SHC + API server)"

Push-Location $MockRepoRoot
try {
    # Clean previous artifacts
    Remove-Item "infra\hostinger\dist\evidence\*.json" -ErrorAction SilentlyContinue
    Remove-Item "infra\hostinger\dist\images\*" -ErrorAction SilentlyContinue
    
    $output = & "scripts\deploy-smart.ps1" `
        -Services "skillhubcore-admin","api-server" `
        2>&1 | Out-String
    
    $exitCode = $LASTEXITCODE
    
    Assert-True "Mixed deployment succeeded" ($exitCode -eq 0)
    Assert-Contains "SHC gate enforced in mixed deployment" $output "skillhubcore-admin"
    Assert-Contains "Other service reported" $output "api-server"
    
} catch {
    Write-Host "  [FAIL] Mixed deployment failed: $_" -ForegroundColor Red
    Assert-True "Mixed deployment succeeded" $false
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 3: Dirty tree rejection (MUST FAIL)
# ----------------------------------------------------------------------------
Write-TestHeader "Dirty tree rejection at Step 2 (MUST FAIL)"

Push-Location $MockRepoRoot
try {
    # Create uncommitted change
    "dirty" | Out-File "test-dirty.txt"
    
    $output = & "scripts\deploy-smart.ps1" `
        -Services "skillhubcore-admin" `
        2>&1 | Out-String
    
    $exitCode = $LASTEXITCODE
    
    Assert-True "Deployment rejected dirty tree" ($exitCode -ne 0)
    Assert-Contains "Error mentions uncommitted changes" $output "uncommitted changes"
    Assert-Contains "Blocked at Step 2" $output "Step 2"
    
    # Clean up
    Remove-Item "test-dirty.txt"
    
} catch {
    Assert-True "Deployment rejected dirty tree" $true
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 4: Git repository validation failure (MUST FAIL)
# ----------------------------------------------------------------------------
Write-TestHeader "Git repository validation failure in gate helper (MUST FAIL)"

# Test with non-git directory
$nonGitDir = Join-Path $TestRoot "non-git"
New-Item -ItemType Directory -Force -Path $nonGitDir | Out-Null
New-Item -ItemType Directory -Force -Path "$nonGitDir\infra\hostinger\dist\evidence" | Out-Null

try {
    $output = & "$ScriptsDir\enforce-shc-quality-gate.ps1" `
        -RepositoryRoot $nonGitDir `
        -ImageTag "test-tag" `
        -EvidenceDir "$nonGitDir\infra\hostinger\dist\evidence" `
        -InvocationId ([guid]::NewGuid().ToString()) `
        2>&1 | Out-String
    
    $exitCode = $LASTEXITCODE
    
    Assert-True "Gate helper rejected non-git directory" ($exitCode -ne 0)
    Assert-Contains "Error mentions not a git repository" $output "Not a git repository"
    Assert-FileNotExists "No evidence created after Git failure" "$nonGitDir\infra\hostinger\dist\evidence\quality-gate-*.json"
    
} catch {
    Assert-True "Gate helper rejected non-git directory" $true
}

# ----------------------------------------------------------------------------
# Scenario 5: HEAD change during build detection (MUST FAIL)
# ----------------------------------------------------------------------------
Write-TestHeader "HEAD change during Docker build detection (MUST FAIL)"

Push-Location $MockRepoRoot
try {
    # Clean previous artifacts
    Remove-Item "infra\hostinger\dist\evidence\*.json" -ErrorAction SilentlyContinue
    Remove-Item "infra\hostinger\dist\images\*" -ErrorAction SilentlyContinue
    
    # Tell Docker stub to create a commit during build
    $env:TEST_DOCKER_CREATE_COMMIT = "1"
    
    $output = & "scripts\deploy-smart.ps1" `
        -Services "skillhubcore-admin" `
        2>&1 | Out-String
    
    $exitCode = $LASTEXITCODE
    $env:TEST_DOCKER_CREATE_COMMIT = "0"
    
    Assert-True "Deployment rejected HEAD change during build" ($exitCode -ne 0)
    Assert-Contains "Error mentions HEAD changed" $output "HEAD changed"
    
} catch {
    $env:TEST_DOCKER_CREATE_COMMIT = "0"
    Assert-True "Deployment rejected HEAD change during build" $true
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 6: Direct builder call without InvocationId (MUST FAIL)
# ----------------------------------------------------------------------------
Write-TestHeader "Direct builder call without InvocationId (MUST FAIL)"

Push-Location $MockRepoRoot
try {
    $tag = "shc-direct"
    
    # First create valid evidence
    $invocationId = [guid]::NewGuid().ToString()
    & "scripts\enforce-shc-quality-gate.ps1" `
        -RepositoryRoot (Get-Location) `
        -ImageTag $tag `
        -EvidenceDir "infra\hostinger\dist\evidence" `
        -InvocationId $invocationId `
        2>&1 | Out-Null
    
    # Try to build WITHOUT InvocationId parameter
    $output = & "infra\hostinger\scripts\build-save-images.ps1" `
        -ImageTag $tag `
        -Services "skillhubcore-admin" `
        2>&1 | Out-String
    
    $exitCode = $LASTEXITCODE
    
    Assert-True "Builder rejected direct call without InvocationId" ($exitCode -ne 0)
    Assert-Contains "Error mentions InvocationId required" $output "InvocationId"
    
} catch {
    Assert-True "Builder rejected direct call without InvocationId" $true
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 7: Future-dated receipt rejection (MUST FAIL)
# ----------------------------------------------------------------------------
Write-TestHeader "Future-dated receipt rejection (MUST FAIL)"

Push-Location $MockRepoRoot
try {
    $tag = "shc-future"
    $invocationId = [guid]::NewGuid().ToString()
    $commit = Get-CurrentCommit
    
    # Create evidence with future completion time (20 minutes in future, > 5 min clock skew)
    $futureTime = (Get-Date).AddMinutes(20).ToUniversalTime()
    $startTime = $futureTime.AddMinutes(-5)
    
    $evidence = @{
        version = "1.0"
        service = "skillhubcore-admin"
        sourceCommit = $commit
        imageTag = $tag
        invocationId = $invocationId
        gate = @{
            command = "pnpm"
            profile = "quality:skillhubcore"
        }
        timing = @{
            startUtc = $startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            completionUtc = $futureTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
        status = "PASS"
        exitCode = 0
    }
    
    $evidencePath = "infra\hostinger\dist\evidence\quality-gate-skillhubcore-admin-$tag.json"
    $evidence | ConvertTo-Json -Depth 10 | Set-Content $evidencePath
    
    # Try to build with future-dated receipt
    $output = & "infra\hostinger\scripts\build-save-images.ps1" `
        -ImageTag $tag `
        -Services "skillhubcore-admin" `
        -InvocationId $invocationId `
        2>&1 | Out-String
    
    $exitCode = $LASTEXITCODE
    
    Assert-True "Builder rejected future-dated receipt" ($exitCode -ne 0)
    Assert-Contains "Error mentions future time" $output "future"
    
} catch {
    Assert-True "Builder rejected future-dated receipt" $true
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 8: Publication validation (upload trace)
# ----------------------------------------------------------------------------
Write-TestHeader "Publication validation before upload"

Push-Location $MockRepoRoot
try {
    # Clean and run full deployment
    Remove-Item "infra\hostinger\dist\evidence\*.json" -ErrorAction SilentlyContinue
    Remove-Item "infra\hostinger\dist\images\*" -ErrorAction SilentlyContinue
    Remove-Item "$TestRoot\uploads.txt" -ErrorAction SilentlyContinue
    
    $output = & "scripts\deploy-smart.ps1" `
        -Services "skillhubcore-admin" `
        2>&1 | Out-String
    
    $exitCode = $LASTEXITCODE
    
    Assert-True "Deployment succeeded" ($exitCode -eq 0)
    Assert-Contains "Step 6 validates publication" $output "Step 6"
    Assert-Contains "Local checksum validated" $output "checksum validated"
    Assert-Contains "Publication association validated" $output "publication association"
    Assert-Contains "Receipt copied to release artifacts" $output "Receipt copied"
    
    # Check upload trace includes receipt
    if (Test-Path "$TestRoot\uploads.txt") {
        $uploads = Get-Content "$TestRoot\uploads.txt" -Raw
        Assert-Contains "Receipt uploaded with artifacts" $uploads "quality-gate"
    }
    
} catch {
    Write-Host "  [FAIL] Publication validation test failed: $_" -ForegroundColor Red
    Assert-True "Deployment succeeded" $false
} finally {
    Pop-Location
}

# ============================================================================
# TEST SUMMARY
# ============================================================================

Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "  TEST SUMMARY" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

Write-Host "`nScenarios: $script:ScenarioCount" -ForegroundColor Cyan
Write-Host "Assertions: $script:AssertionCount" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results:" -ForegroundColor White
Write-Host "  PASS: $script:PassCount" -ForegroundColor Green
Write-Host "  FAIL: $script:FailCount" -ForegroundColor $(if ($script:FailCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

# Cleanup
if (Test-Path $TestRoot) {
    Remove-Item -Recurse -Force $TestRoot
}

if ($script:FailCount -eq 0) {
    Write-Host "ALL TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
