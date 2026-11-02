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
        
        # Ignore build and release artifacts like real repository
        @"
dist/
*.tar
*.sha256
*.manifest.json
docker-compose.local-build.yml
"@ | Set-Content ".gitignore"
        
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
if ($args -contains "compose" -and $args -contains "build") {
    if ($env:TEST_DOCKER_CREATE_COMMIT -eq "1") {
        "test" | Out-File -FilePath "docker-generated.txt" -Encoding ASCII
        git add docker-generated.txt 2>&1 | Out-Null
        git commit -m "Docker build generated file" 2>&1 | Out-Null
    }
    if ($env:TEST_DOCKER_MUTATE_RECEIPT -eq "1") {
        # Mutate the receipt file (change gate.profile and exitCode)
        $receiptPath = Get-ChildItem -Path "infra\hostinger\dist\evidence\quality-gate-*.json" -File | Select-Object -First 1
        if ($receiptPath) {
            $receipt = Get-Content $receiptPath.FullName -Raw | ConvertFrom-Json
            $receipt.gate.profile = "invalid:profile"
            $receipt.exitCode = 9
            $receipt | ConvertTo-Json -Depth 10 | Set-Content $receiptPath.FullName
        }
    }
    exit 0
} elseif ($args -contains "save") {
    $idx = [array]::IndexOf($args, "-o")
    if ($idx -ge 0 -and ($idx + 1) -lt $args.Count) {
        $outputFile = $args[$idx + 1]
        "DOCKER_IMAGE_TAR" | Out-File -FilePath $outputFile -Encoding ASCII
    }
    if ($env:TEST_DOCKER_DIRTY_AT_SAVE -eq "1") {
        # Create uncommitted file after docker save (for scenario 9)
        "dirty-at-save" | Out-File -FilePath "dirty-at-save.txt" -Encoding ASCII
    }
    if ($env:TEST_DOCKER_DIRTY_AFTER_SAVE -eq "1") {
        # Create uncommitted file after docker save, simulating drift before publication (for scenario 11)
        # This happens AFTER the builder completes, simulating drift injected at publication boundary
        Start-Sleep -Milliseconds 500
        "drift-after-save" | Out-File -FilePath "drift-after-save.txt" -Encoding ASCII
    }
    exit 0
} elseif ($args -contains "image" -and $args -contains "inspect") {
    Write-Output "sha256:abc123"
    exit 0
} elseif ($args -contains "tag") {
    exit 0
} else {
    exit 0
}
'@ | Set-Content "$StubsDir\docker.ps1" -Encoding ASCII
    '@echo off
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0docker.ps1" %*' | Set-Content "$StubsDir\docker.cmd" -Encoding ASCII
    
    # SSH stub - succeeds
    @'
exit 0
'@ | Set-Content "$StubsDir\ssh.ps1" -Encoding ASCII
    '@echo off
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0ssh.ps1" %*' | Set-Content "$StubsDir\ssh.cmd" -Encoding ASCII
    
    # SCP stub - records what was uploaded
    @'
$uploadLog = Join-Path $env:TEST_ROOT "uploads.txt"
$args | Out-File -FilePath $uploadLog -Append -Encoding ASCII
exit 0
'@ | Set-Content "$StubsDir\scp.ps1" -Encoding ASCII
    '@echo off
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scp.ps1" %*' | Set-Content "$StubsDir\scp.cmd" -Encoding ASCII

    # PNPM stub
    Create-MockPnpmStub
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
if ($args -contains "quality:skillhubcore") {
    Start-Sleep -Milliseconds 100
    exit 0
} else {
    exit 0
}
'@ | Set-Content "$StubsDir\pnpm.ps1" -Encoding ASCII
    '@echo off
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0pnpm.ps1" %*' | Set-Content "$StubsDir\pnpm.cmd" -Encoding ASCII
}

# ============================================================================
# TEST SCENARIOS
# ============================================================================

Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "  W0.2-HOSTINGER Production Path Test Suite" -ForegroundColor Magenta
Write-Host "  Testing ACTUAL entrypoints with stubbed external effects" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

$env:NON_INTERACTIVE = "1"
Initialize-TestEnvironment
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
        -NonInteractive `
        *>&1 | Out-String
    
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
        -NonInteractive `
        *>&1 | Out-String
    
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
    
    # Invoke in child process - write output to file
    $deployScript = Join-Path (Get-Location) "scripts\deploy-smart.ps1"
    $outputFile = Join-Path $TestRoot "scenario3-output.txt"
    $null = powershell -NoProfile -ExecutionPolicy Bypass -Command @"
`$env:TEST_ROOT = '$TestRoot'
`$env:NON_INTERACTIVE = '1'
try {
    & '$deployScript' -Services 'skillhubcore-admin' -NonInteractive *>&1 | Out-File -FilePath '$outputFile' -Encoding UTF8
    exit `$LASTEXITCODE
} catch {
    `$_ | Out-File -FilePath '$outputFile' -Append -Encoding UTF8
    exit 1
}
"@
    
    $exitCode = $LASTEXITCODE
    $output = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
    Remove-Item $outputFile -ErrorAction SilentlyContinue
    
    # Assert all three checks independently
    Assert-True "Deployment rejected dirty tree (exit ≠ 0)" ($exitCode -ne 0)
    
    $outputStr = [string]$output
    Assert-Contains "Error mentions uncommitted changes" $outputStr "uncommitted changes"
    Assert-Contains "Blocked at Step 2" $outputStr "Step 2"
    
    # Clean up
    Remove-Item "test-dirty.txt"
    
} catch {
    Write-Host "  [FAIL] Test scenario threw unexpected exception: $_" -ForegroundColor Red
    $script:FailCount++
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
    # Invoke gate helper in child process
    $outputFile = Join-Path $TestRoot "scenario4-output.txt"
    $null = powershell -NoProfile -ExecutionPolicy Bypass -Command @"
try {
    & '$ScriptsDir\enforce-shc-quality-gate.ps1' ``
        -RepositoryRoot '$nonGitDir' ``
        -ImageTag 'test-tag' ``
        -EvidenceDir '$nonGitDir\infra\hostinger\dist\evidence' ``
        -InvocationId '$([guid]::NewGuid().ToString())' ``
        2>&1 | Out-File -FilePath '$outputFile' -Encoding UTF8
    exit `$LASTEXITCODE
} catch {
    `$_ | Out-File -FilePath '$outputFile' -Append -Encoding UTF8
    exit 1
}
"@
    
    $exitCode = $LASTEXITCODE
    $output = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
    Remove-Item $outputFile -ErrorAction SilentlyContinue
    
    Assert-True "Gate helper rejected non-git directory (exit ≠ 0)" ($exitCode -ne 0)
    Assert-Contains "Error mentions not a git repository" $output "not a git repository"
    Assert-FileNotExists "No evidence created after Git failure" "$nonGitDir\infra\hostinger\dist\evidence\quality-gate-*.json"
    
} catch {
    Write-Host "  [FAIL] Test scenario threw unexpected exception: $_" -ForegroundColor Red
    $script:FailCount++
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
    Remove-Item "docker-generated.txt" -ErrorAction SilentlyContinue
    
    # Tell Docker stub to create a commit during build
    $env:TEST_DOCKER_CREATE_COMMIT = "1"
    
    # Invoke in child process - write output to file to capture stderr properly
    $deployScript = Join-Path (Get-Location) "scripts\deploy-smart.ps1"
    $outputFile = Join-Path $TestRoot "scenario5-output.txt"
    $null = powershell -NoProfile -ExecutionPolicy Bypass -Command @"
`$env:TEST_ROOT = '$TestRoot'
`$env:TEST_DOCKER_CREATE_COMMIT = '1'
`$env:NON_INTERACTIVE = '1'
try {
    & '$deployScript' -Services 'skillhubcore-admin' -NonInteractive 2>&1 | Out-File -FilePath '$outputFile' -Encoding UTF8
    exit `$LASTEXITCODE
} catch {
    `$_ | Out-File -FilePath '$outputFile' -Append -Encoding UTF8
    exit 1
}
"@
    
    $exitCode = $LASTEXITCODE
    $output = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
    Remove-Item $outputFile -ErrorAction SilentlyContinue
    $env:TEST_DOCKER_CREATE_COMMIT = "0"
    
    # Assert checks
    Assert-True "Deployment rejected HEAD change during build (exit ≠ 0)" ($exitCode -ne 0)
    
    $outputStr = [string]$output
    $hasHeadError = $outputStr.Contains("HEAD changed")
    Assert-True "Error mentions HEAD changed" $hasHeadError
    
    # Clean up
    Remove-Item "docker-generated.txt" -ErrorAction SilentlyContinue
    
} catch {
    $env:TEST_DOCKER_CREATE_COMMIT = "0"
    Write-Host "  [FAIL] Test scenario threw unexpected exception: $_" -ForegroundColor Red
    $script:FailCount++
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 6: Direct builder call without InvocationId (MUST FAIL)
# ----------------------------------------------------------------------------
Write-TestHeader "Direct builder call without InvocationId (MUST FAIL)"

Push-Location $MockRepoRoot
try {
    # Clean working tree to ensure prerequisite success
    $status = git status --porcelain
    if ($status) {
        git reset --hard HEAD 2>&1 | Out-Null
        git clean -fd 2>&1 | Out-Null
    }
    
    $tag = "shc-direct-$([guid]::NewGuid().ToString().Substring(0,8))"
    $invocationId = [guid]::NewGuid().ToString()
    
    # Create valid evidence (prerequisite - must succeed)
    $gateOutput = & "scripts\enforce-shc-quality-gate.ps1" `
        -RepositoryRoot (Get-Location) `
        -ImageTag $tag `
        -EvidenceDir "infra\hostinger\dist\evidence" `
        -InvocationId $invocationId `
        2>&1 | Out-String
    
    $gateExitCode = $LASTEXITCODE
    if ($gateExitCode -ne 0) {
        Write-Host "  [FAIL] Prerequisite gate execution failed (dirty source or other error)" -ForegroundColor Red
        Write-Host "  Gate output: $($gateOutput.Substring(0, [Math]::Min(200, $gateOutput.Length)))" -ForegroundColor Yellow
        $script:FailCount++
    } else {
        # Now test: Try to build WITHOUT InvocationId parameter
        $outputFile = Join-Path $TestRoot "scenario6-output.txt"
        $null = powershell -NoProfile -ExecutionPolicy Bypass -Command @"
try {
    & 'infra\hostinger\scripts\build-save-images.ps1' ``
        -ImageTag '$tag' ``
        -Services 'skillhubcore-admin' ``
        2>&1 | Out-File -FilePath '$outputFile' -Encoding UTF8
    exit `$LASTEXITCODE
} catch {
    `$_ | Out-File -FilePath '$outputFile' -Append -Encoding UTF8
    exit 1
}
"@
        
        $exitCode = $LASTEXITCODE
        $output = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
        Remove-Item $outputFile -ErrorAction SilentlyContinue
        
        Assert-True "Builder rejected direct call without InvocationId (exit ≠ 0)" ($exitCode -ne 0)
        Assert-Contains "Error mentions InvocationId required" $output "InvocationId"
    }
    
} catch {
    Write-Host "  [FAIL] Test scenario threw unexpected exception: $_" -ForegroundColor Red
    $script:FailCount++
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 7: Future-dated receipt rejection (MUST FAIL)
# ----------------------------------------------------------------------------
Write-TestHeader "Future-dated receipt rejection (MUST FAIL)"

Push-Location $MockRepoRoot
try {
    # Clean working tree
    $status = git status --porcelain
    if ($status) {
        git reset --hard HEAD 2>&1 | Out-Null
        git clean -fd 2>&1 | Out-Null
    }
    
    $tag = "shc-future-$([guid]::NewGuid().ToString().Substring(0,8))"
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
    
    # Verify prerequisite: evidence file exists
    if (-not (Test-Path $evidencePath)) {
        Write-Host "  [FAIL] Prerequisite failed: evidence file not created" -ForegroundColor Red
        $script:FailCount++
    } else {
        # Try to build with future-dated receipt
        $outputFile = Join-Path $TestRoot "scenario7-output.txt"
        $null = powershell -NoProfile -ExecutionPolicy Bypass -Command @"
`$env:TEST_ROOT = '$TestRoot'
try {
    & 'infra\hostinger\scripts\build-save-images.ps1' ``
        -ImageTag '$tag' ``
        -Services 'skillhubcore-admin' ``
        -InvocationId '$invocationId' ``
        2>&1 | Out-File -FilePath '$outputFile' -Encoding UTF8
    exit `$LASTEXITCODE
} catch {
    `$_ | Out-File -FilePath '$outputFile' -Append -Encoding UTF8
    exit 1
}
"@
        
        $exitCode = $LASTEXITCODE
        $output = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
        Remove-Item $outputFile -ErrorAction SilentlyContinue
        
        Assert-True "Builder rejected future-dated receipt (exit ≠ 0)" ($exitCode -ne 0)
        Assert-Contains "Error mentions future time" $output "future"
    }
    
} catch {
    Write-Host "  [FAIL] Test scenario threw unexpected exception: $_" -ForegroundColor Red
    $script:FailCount++
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 8: Publication validation (upload trace)
# ----------------------------------------------------------------------------
Write-TestHeader "Publication validation before upload"

Push-Location $MockRepoRoot
try {
    # Clean up any files left by previous scenarios
    Remove-Item "docker-generated.txt" -ErrorAction SilentlyContinue
    Remove-Item "test-dirty.txt" -ErrorAction SilentlyContinue
    Remove-Item "dirty-at-save.txt" -ErrorAction SilentlyContinue
    
    # Reset to clean state if there are uncommitted changes
    $status = git status --porcelain
    if ($status) {
        git reset --hard HEAD 2>&1 | Out-Null
        git clean -fd 2>&1 | Out-Null
    }
    
    # Clean and run full deployment
    Remove-Item "infra\hostinger\dist\evidence\*.json" -ErrorAction SilentlyContinue
    Remove-Item "infra\hostinger\dist\images\*" -ErrorAction SilentlyContinue
    Remove-Item "$TestRoot\uploads.txt" -ErrorAction SilentlyContinue
    
    $output = & "scripts\deploy-smart.ps1" `
        -Services "skillhubcore-admin" `
        -NonInteractive `
        *>&1 | Out-String
    
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

# ----------------------------------------------------------------------------
# Scenario 9: Dirty source at docker save (MUST REJECT, zero uploads)
# ----------------------------------------------------------------------------
Write-TestHeader "Dirty source at docker save detection (MUST REJECT)"

Push-Location $MockRepoRoot
try {
    # Clean previous artifacts
    Remove-Item "infra\hostinger\dist\evidence\*.json" -ErrorAction SilentlyContinue
    Remove-Item "infra\hostinger\dist\images\*" -ErrorAction SilentlyContinue
    Remove-Item "$TestRoot\uploads.txt" -ErrorAction SilentlyContinue
    Remove-Item "dirty-at-save.txt" -ErrorAction SilentlyContinue
    
    # Tell Docker stub to create dirty file during docker save
    $env:TEST_DOCKER_DIRTY_AT_SAVE = "1"
    
    # Invoke in child process to capture exit code properly - write output to file
    $deployScript = Join-Path (Get-Location) "scripts\deploy-smart.ps1"
    $outputFile = Join-Path $TestRoot "scenario9-output.txt"
    $null = powershell -NoProfile -ExecutionPolicy Bypass -Command @"
`$env:TEST_ROOT = '$TestRoot'
`$env:TEST_DOCKER_DIRTY_AT_SAVE = '1'
`$env:NON_INTERACTIVE = '1'
try {
    & '$deployScript' -Services 'skillhubcore-admin' -NonInteractive 2>&1 | Out-File -FilePath '$outputFile' -Encoding UTF8
    exit `$LASTEXITCODE
} catch {
    `$_ | Out-File -FilePath '$outputFile' -Append -Encoding UTF8
    exit 1
}
"@
    
    $exitCode = $LASTEXITCODE
    $output = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
    Remove-Item $outputFile -ErrorAction SilentlyContinue
    $env:TEST_DOCKER_DIRTY_AT_SAVE = "0"
    
    # Assert all three checks independently
    Assert-True "Deployment rejected dirty source at docker save (exit ≠ 0)" ($exitCode -ne 0)
    
    $outputStr = [string]$output
    $hasUncommittedError = $outputStr.Contains("uncommitted changes") -or $outputStr.Contains("dirty") -or $outputStr.Contains("not clean")
    Assert-True "Error mentions uncommitted changes after packaging" $hasUncommittedError
    
    # Verify zero uploads (critical: no artifacts published)
    $uploadCount = 0
    if (Test-Path "$TestRoot\uploads.txt") {
        $uploads = Get-Content "$TestRoot\uploads.txt" -Raw
        $uploadCount = ($uploads -split "`n" | Where-Object { $_ }).Count
    }
    Assert-True "Zero uploads after dirty source at save" ($uploadCount -eq 0)
    
    # Clean up dirty file
    Remove-Item "dirty-at-save.txt" -ErrorAction SilentlyContinue
    
} catch {
    $env:TEST_DOCKER_DIRTY_AT_SAVE = "0"
    Write-Host "  [FAIL] Test scenario threw unexpected exception: $_" -ForegroundColor Red
    $script:FailCount++
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 10: Receipt mutation during build (MUST REJECT, zero uploads)
# ----------------------------------------------------------------------------
Write-TestHeader "Receipt mutation during build detection (MUST REJECT)"

Push-Location $MockRepoRoot
try {
    # Clean dirty file from previous scenario
    Remove-Item "dirty-at-save.txt" -ErrorAction SilentlyContinue
    
    # Clean previous artifacts
    Remove-Item "infra\hostinger\dist\evidence\*.json" -ErrorAction SilentlyContinue
    Remove-Item "infra\hostinger\dist\images\*" -ErrorAction SilentlyContinue
    Remove-Item "$TestRoot\uploads.txt" -ErrorAction SilentlyContinue
    
    # Tell Docker stub to mutate receipt during build
    $env:TEST_DOCKER_MUTATE_RECEIPT = "1"
    
    # Invoke in child process to capture exit code properly - write output to file
    $deployScript = Join-Path (Get-Location) "scripts\deploy-smart.ps1"
    $outputFile = Join-Path $TestRoot "scenario10-output.txt"
    $null = powershell -NoProfile -ExecutionPolicy Bypass -Command @"
`$env:TEST_ROOT = '$TestRoot'
`$env:TEST_DOCKER_MUTATE_RECEIPT = '1'
`$env:NON_INTERACTIVE = '1'
try {
    & '$deployScript' -Services 'skillhubcore-admin' -NonInteractive 2>&1 | Out-File -FilePath '$outputFile' -Encoding UTF8
    exit `$LASTEXITCODE
} catch {
    `$_ | Out-File -FilePath '$outputFile' -Append -Encoding UTF8
    exit 1
}
"@
    
    $exitCode = $LASTEXITCODE
    $output = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
    Remove-Item $outputFile -ErrorAction SilentlyContinue
    $env:TEST_DOCKER_MUTATE_RECEIPT = "0"
    
    # Assert all three checks independently
    Assert-True "Deployment rejected receipt mutation (exit ≠ 0)" ($exitCode -ne 0)
    
    # Accept digest mismatch OR validation failure (gate profile, exitCode, etc.)
    $outputStr = [string]$output
    $hasDigestError = ($outputStr.Contains("digest"))
    $hasProfileError = ($outputStr.Contains("gate profile"))
    $hasExitCodeError = ($outputStr.Contains("exit code"))
    $hasModifiedError = ($outputStr.Contains("modified"))
    $hasValidationError = $hasDigestError -or $hasProfileError -or $hasExitCodeError -or $hasModifiedError
    Assert-True "Error mentions receipt digest mismatch or validation failure" $hasValidationError
    
    # Verify zero uploads (critical: no artifacts published)
    $uploadCount = 0
    if (Test-Path "$TestRoot\uploads.txt") {
        $uploads = Get-Content "$TestRoot\uploads.txt" -Raw
        $uploadCount = ($uploads -split "`n" | Where-Object { $_ }).Count
    }
    Assert-True "Zero uploads after receipt mutation" ($uploadCount -eq 0)
    
} catch {
    $env:TEST_DOCKER_MUTATE_RECEIPT = "0"
    Write-Host "  [FAIL] Test scenario threw unexpected exception: $_" -ForegroundColor Red
    $script:FailCount++
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# Scenario 11: Dirty source before publication (MUST REJECT, zero uploads)
# ----------------------------------------------------------------------------
Write-TestHeader "Dirty source before SHC publication detection (MUST REJECT)"

Push-Location $MockRepoRoot
try {
    # Clean working tree and artifacts
    $status = git status --porcelain
    if ($status) {
        git reset --hard HEAD 2>&1 | Out-Null
        git clean -fd 2>&1 | Out-Null
    }
    Remove-Item "infra\hostinger\dist\evidence\*.json" -ErrorAction SilentlyContinue
    Remove-Item "infra\hostinger\dist\images\*" -ErrorAction SilentlyContinue
    Remove-Item "$TestRoot\uploads.txt" -ErrorAction SilentlyContinue
    
    # Tell Docker stub to inject drift AFTER docker save (at the publication boundary)
    $env:TEST_DOCKER_DIRTY_AFTER_SAVE = "1"
    
    # Run deployment - should fail at final cleanliness check
    $deployScript = Join-Path (Get-Location) "scripts\deploy-smart.ps1"
    $outputFile = Join-Path $TestRoot "scenario11-output.txt"
    $null = powershell -NoProfile -ExecutionPolicy Bypass -Command @"
`$env:TEST_ROOT = '$TestRoot'
`$env:TEST_DOCKER_DIRTY_AFTER_SAVE = '1'
`$env:NON_INTERACTIVE = '1'
try {
    & '$deployScript' -Services 'skillhubcore-admin' -NonInteractive 2>&1 | Out-File -FilePath '$outputFile' -Encoding UTF8
    exit `$LASTEXITCODE
} catch {
    `$_ | Out-File -FilePath '$outputFile' -Append -Encoding UTF8
    exit 1
}
"@
    
    $exitCode = $LASTEXITCODE
    $output = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
    Remove-Item $outputFile -ErrorAction SilentlyContinue
    $env:TEST_DOCKER_DIRTY_AFTER_SAVE = "0"
    
    # Assert all three checks independently
    Assert-True "Publication rejected dirty source before upload (exit ≠ 0)" ($exitCode -ne 0)
    
    $outputStr = [string]$output
    $hasCleanError = $outputStr.Contains("not clean") -or $outputStr.Contains("uncommitted changes") -or $outputStr.Contains("dirty")
    Assert-True "Error mentions working tree not clean before publication" $hasCleanError
    
    # Verify zero uploads
    $uploadCount = 0
    if (Test-Path "$TestRoot\uploads.txt") {
        $uploads = Get-Content "$TestRoot\uploads.txt" -Raw
        $uploadCount = ($uploads -split "`n" | Where-Object { $_ }).Count
    }
    Assert-True "Zero uploads after dirty source before publication" ($uploadCount -eq 0)
    
    # Clean up any dirty files created
    Remove-Item "drift-after-save.txt" -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "  [FAIL] Test scenario threw unexpected exception: $_" -ForegroundColor Red
    $script:FailCount++
    $env:TEST_DOCKER_DIRTY_AFTER_SAVE = "0"
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
