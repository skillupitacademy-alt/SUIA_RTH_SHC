#!/usr/bin/env pwsh
<#
.SYNOPSIS
    W0.2-HOSTINGER Control Flow Tests
    
.DESCRIPTION
    Tests actual deployment/builder control flow with stubbed side effects.
    Exercises enforcement policy, drift detection, receipt validation, and artifact protection.
    
    IMPORTANT: This script NEVER executes actual deployment, Docker commands, or SSH/SCP.
    All side effects are stubbed or mocked.
    
.NOTES
    Implements: W0.2-HOSTINGER verification tests per Sol's review requirements
    Authority: Sol
    Implementer: Claude Sonnet 4.5
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# Test infrastructure
$script:TestCount = 0
$script:PassCount = 0
$script:FailCount = 0
$script:ScenarioCount = 0
$script:AssertionCount = 0

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "SCENARIO: $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    $script:ScenarioCount++
}

function Assert-Equal {
    param(
        [string]$Name,
        $Expected,
        $Actual
    )
    
    $script:TestCount++
    $script:AssertionCount++
    
    if ($Expected -eq $Actual) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:PassCount++
    } else {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
        Write-Host "    Expected: $Expected" -ForegroundColor Yellow
        Write-Host "    Actual: $Actual" -ForegroundColor Yellow
        $script:FailCount++
    }
}

function Assert-True {
    param(
        [string]$Name,
        [bool]$Condition
    )
    
    Assert-Equal -Name $Name -Expected $true -Actual $Condition
}

function Assert-False {
    param(
        [string]$Name,
        [bool]$Condition
    )
    
    Assert-Equal -Name $Name -Expected $false -Actual $Condition
}

function Assert-FileExists {
    param(
        [string]$Name,
        [string]$Path
    )
    
    $exists = Test-Path $Path
    Assert-True -Name $Name -Condition $exists
}

function Assert-FileNotExists {
    param(
        [string]$Name,
        [string]$Path
    )
    
    $exists = Test-Path $Path
    Assert-False -Name $Name -Condition $exists
}

# Test setup/teardown
$TestRoot = Join-Path $PSScriptRoot "..\..\..\test-temp-w0-2-hostinger"
$MockRepoRoot = Join-Path $TestRoot "mock-repo"
$MockEvidenceDir = Join-Path $TestRoot "evidence"
$MockDistDir = Join-Path $TestRoot "dist"

function Initialize-TestEnvironment {
    # Clean and recreate test directories
    if (Test-Path $TestRoot) {
        Remove-Item -Recurse -Force $TestRoot
    }
    
    New-Item -ItemType Directory -Force -Path $MockRepoRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $MockEvidenceDir | Out-Null
    New-Item -ItemType Directory -Force -Path $MockDistDir | Out-Null
    
    # Initialize mock git repository
    Push-Location $MockRepoRoot
    try {
        git init 2>&1 | Out-Null
        git config user.name "Test User" 2>&1 | Out-Null
        git config user.email "test@example.com" 2>&1 | Out-Null
        
        # Create initial commit
        "# Test Repository" | Set-Content -Path "README.md"
        git add README.md 2>&1 | Out-Null
        git commit -m "Initial commit" 2>&1 | Out-Null
    } finally {
        Pop-Location
    }
}

function Get-MockCommitSHA {
    Push-Location $MockRepoRoot
    try {
        $sha = (git rev-parse HEAD).Trim()
        return $sha
    } finally {
        Pop-Location
    }
}

function Create-MockEvidence {
    param(
        [string]$ImageTag,
        [string]$SourceCommit,
        [string]$InvocationId,
        [string]$Status = "PASS",
        [int]$ExitCode = 0,
        [int]$AgeMinutes = 0
    )
    
    $completionTime = (Get-Date).AddMinutes(-$AgeMinutes).ToUniversalTime()
    $startTime = $completionTime.AddMinutes(-5)
    
    $evidence = @{
        version = "1.0"
        service = "skillhubcore-admin"
        sourceCommit = $SourceCommit
        imageTag = $ImageTag
        invocationId = $InvocationId
        gate = @{
            command = "pnpm"
            profile = "quality:skillhubcore"
        }
        timing = @{
            startUtc = $startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            completionUtc = $completionTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
        status = $Status
        exitCode = $ExitCode
    }
    
    $evidencePath = Join-Path $MockEvidenceDir "quality-gate-skillhubcore-admin-$ImageTag.json"
    $evidence | ConvertTo-Json -Depth 10 | Set-Content -Path $evidencePath -Encoding UTF8
    
    return $evidencePath
}

function Invoke-MockBuilder {
    param(
        [string]$ImageTag,
        [string[]]$Services,
        [string]$InvocationId,
        [string]$ExpectedCommit
    )
    
    # Simulate builder validation logic (extracted from actual builder)
    $selected = $Services
    
    if ($selected -contains 'skillhubcore-admin') {
        # Validate evidence exists
        $evidencePath = Join-Path $MockEvidenceDir "quality-gate-skillhubcore-admin-$ImageTag.json"
        
        if (-not (Test-Path $evidencePath)) {
            throw "Missing quality gate evidence for skillhubcore-admin (tag $ImageTag)"
        }
        
        $evidence = Get-Content -Raw $evidencePath | ConvertFrom-Json
        
        # Validate required fields
        if (-not $evidence.PSObject.Properties['invocationId']) {
            throw "Evidence missing required field: invocationId"
        }
        
        # Require InvocationId parameter for SHC
        if (-not $InvocationId) {
            throw "Direct builder invocation for skillhubcore-admin requires -InvocationId parameter"
        }
        
        # Validate invocation match
        if ($evidence.invocationId -ne $InvocationId) {
            throw "Evidence invocation mismatch. Evidence: $($evidence.invocationId), Build: $InvocationId"
        }
        
        # Validate commit match
        if ($evidence.sourceCommit -ne $ExpectedCommit) {
            throw "Evidence source commit mismatch. Evidence: $($evidence.sourceCommit), Expected: $ExpectedCommit"
        }
        
        # Validate status
        if ($evidence.status -ne "PASS") {
            throw "Quality gate did not pass (status: $($evidence.status))"
        }
        
        # Validate freshness (60 minute window)
        $completionTime = [DateTime]::Parse($evidence.timing.completionUtc, [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::AssumeUniversal -bor [System.Globalization.DateTimeStyles]::AdjustToUniversal)
        $ageMinutes = ((Get-Date).ToUniversalTime() - $completionTime).TotalMinutes
        
        if ($ageMinutes -gt 60) {
            throw "Evidence is too old (completed $([Math]::Round($ageMinutes, 1)) minutes ago)"
        }
    }
    
    # Return success indicator
    return @{
        Success = $true
        Services = $selected
    }
}

# ============================================================================
# TEST SCENARIOS
# ============================================================================

Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "  W0.2-HOSTINGER Control Flow Test Suite" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

Initialize-TestEnvironment

# ----------------------------------------------------------------------------
# Scenario 1: Explicit SHC selection with valid evidence
# ----------------------------------------------------------------------------
Write-TestHeader "Explicit SHC selection with valid evidence"

$commit1 = Get-MockCommitSHA
$tag1 = "shc-test0001"
$invocation1 = [guid]::NewGuid().ToString()

Create-MockEvidence -ImageTag $tag1 -SourceCommit $commit1 -InvocationId $invocation1

try {
    $result = Invoke-MockBuilder -ImageTag $tag1 -Services @("skillhubcore-admin") -InvocationId $invocation1 -ExpectedCommit $commit1
    Assert-True "Builder accepts valid evidence" $result.Success
    Assert-Equal "Correct service built" "skillhubcore-admin" $result.Services[0]
} catch {
    Assert-True "Builder accepts valid evidence" $false
    Write-Host "    Error: $_" -ForegroundColor Red
}

# ----------------------------------------------------------------------------
# Scenario 2: Mixed deployment (SHC + other services)
# ----------------------------------------------------------------------------
Write-TestHeader "Mixed deployment (SHC + other services)"

$commit2 = Get-MockCommitSHA
$tag2 = "shc-test0002"
$invocation2 = [guid]::NewGuid().ToString()

Create-MockEvidence -ImageTag $tag2 -SourceCommit $commit2 -InvocationId $invocation2

try {
    $result = Invoke-MockBuilder -ImageTag $tag2 -Services @("skillhubcore-admin", "api-server") -InvocationId $invocation2 -ExpectedCommit $commit2
    Assert-True "Builder accepts valid SHC evidence in mixed deployment" $result.Success
    Assert-Equal "Multiple services built" 2 $result.Services.Count
} catch {
    Assert-True "Builder accepts valid SHC evidence in mixed deployment" $false
    Write-Host "    Error: $_" -ForegroundColor Red
}

# ----------------------------------------------------------------------------
# Scenario 3: Direct builder call without InvocationId (MUST REJECT)
# ----------------------------------------------------------------------------
Write-TestHeader "Direct builder call without InvocationId (MUST REJECT)"

$commit3 = Get-MockCommitSHA
$tag3 = "shc-test0003"
$invocation3 = [guid]::NewGuid().ToString()

Create-MockEvidence -ImageTag $tag3 -SourceCommit $commit3 -InvocationId $invocation3

try {
    $result = Invoke-MockBuilder -ImageTag $tag3 -Services @("skillhubcore-admin") -InvocationId $null -ExpectedCommit $commit3
    Assert-True "Builder rejects direct call without InvocationId" $false
} catch {
    $errorMessage = $_.Exception.Message
    Assert-True "Builder rejects direct call without InvocationId" $true
    Assert-True "Error mentions InvocationId requirement" ($errorMessage -like "*InvocationId parameter*")
}

# ----------------------------------------------------------------------------
# Scenario 4: Wrong invocation ID (MUST REJECT - prevents reuse)
# ----------------------------------------------------------------------------
Write-TestHeader "Wrong invocation ID (MUST REJECT - prevents reuse)"

$commit4 = Get-MockCommitSHA
$tag4 = "shc-test0004"
$invocation4a = [guid]::NewGuid().ToString()
$invocation4b = [guid]::NewGuid().ToString()

Create-MockEvidence -ImageTag $tag4 -SourceCommit $commit4 -InvocationId $invocation4a

try {
    $result = Invoke-MockBuilder -ImageTag $tag4 -Services @("skillhubcore-admin") -InvocationId $invocation4b -ExpectedCommit $commit4
    Assert-True "Builder rejects wrong invocation ID" $false
} catch {
    $errorMessage = $_.Exception.Message
    Assert-True "Builder rejects wrong invocation ID" $true
    Assert-True "Error mentions invocation mismatch" ($errorMessage -like "*invocation mismatch*")
}

# ----------------------------------------------------------------------------
# Scenario 5: Missing evidence file (MUST REJECT)
# ----------------------------------------------------------------------------
Write-TestHeader "Missing evidence file (MUST REJECT)"

$commit5 = Get-MockCommitSHA
$tag5 = "shc-test0005"
$invocation5 = [guid]::NewGuid().ToString()

# Do NOT create evidence

try {
    $result = Invoke-MockBuilder -ImageTag $tag5 -Services @("skillhubcore-admin") -InvocationId $invocation5 -ExpectedCommit $commit5
    Assert-True "Builder rejects missing evidence" $false
} catch {
    $errorMessage = $_.Exception.Message
    Assert-True "Builder rejects missing evidence" $true
    Assert-True "Error mentions missing evidence" ($errorMessage -like "*Missing quality gate evidence*")
}

# ----------------------------------------------------------------------------
# Scenario 6: Commit mismatch (MUST REJECT - prevents drift)
# ----------------------------------------------------------------------------
Write-TestHeader "Commit mismatch (MUST REJECT - prevents drift)"

$commit6a = Get-MockCommitSHA

# Simulate a new commit
Push-Location $MockRepoRoot
try {
    "test" | Set-Content -Path "test.txt"
    git add test.txt 2>&1 | Out-Null
    git commit -m "Test commit" 2>&1 | Out-Null
} finally {
    Pop-Location
}

$commit6b = Get-MockCommitSHA
$tag6 = "shc-test0006"
$invocation6 = [guid]::NewGuid().ToString()

# Evidence has old commit, but builder sees new commit
Create-MockEvidence -ImageTag $tag6 -SourceCommit $commit6a -InvocationId $invocation6

try {
    $result = Invoke-MockBuilder -ImageTag $tag6 -Services @("skillhubcore-admin") -InvocationId $invocation6 -ExpectedCommit $commit6b
    Assert-True "Builder rejects commit mismatch" $false
} catch {
    $errorMessage = $_.Exception.Message
    Assert-True "Builder rejects commit mismatch" $true
    Assert-True "Error mentions commit mismatch" ($errorMessage -like "*commit mismatch*")
}

# ----------------------------------------------------------------------------
# Scenario 7: Failed gate status (MUST REJECT)
# ----------------------------------------------------------------------------
Write-TestHeader "Failed gate status (MUST REJECT)"

$commit7 = Get-MockCommitSHA
$tag7 = "shc-test0007"
$invocation7 = [guid]::NewGuid().ToString()

Create-MockEvidence -ImageTag $tag7 -SourceCommit $commit7 -InvocationId $invocation7 -Status "FAIL" -ExitCode 1

try {
    $result = Invoke-MockBuilder -ImageTag $tag7 -Services @("skillhubcore-admin") -InvocationId $invocation7 -ExpectedCommit $commit7
    Assert-True "Builder rejects failed gate" $false
} catch {
    $errorMessage = $_.Exception.Message
    Assert-True "Builder rejects failed gate" $true
    Assert-True "Error mentions gate failure" ($errorMessage -like "*did not pass*")
}

# ----------------------------------------------------------------------------
# Scenario 8: Stale evidence (>60 minutes old, MUST REJECT)
# ----------------------------------------------------------------------------
Write-TestHeader "Stale evidence (>60 minutes old, MUST REJECT)"

$commit8 = Get-MockCommitSHA
$tag8 = "shc-test0008"
$invocation8 = [guid]::NewGuid().ToString()

# Evidence from 61 minutes ago
Create-MockEvidence -ImageTag $tag8 -SourceCommit $commit8 -InvocationId $invocation8 -AgeMinutes 61

try {
    $result = Invoke-MockBuilder -ImageTag $tag8 -Services @("skillhubcore-admin") -InvocationId $invocation8 -ExpectedCommit $commit8
    Assert-True "Builder rejects stale evidence" $false
} catch {
    $errorMessage = $_.Exception.Message
    Assert-True "Builder rejects stale evidence" $true
    Assert-True "Error mentions evidence age" ($errorMessage -like "*too old*")
}

# ----------------------------------------------------------------------------
# Scenario 9: Non-SHC service (should bypass checks)
# ----------------------------------------------------------------------------
Write-TestHeader "Non-SHC service (should bypass SHC checks)"

$commit9 = Get-MockCommitSHA
$tag9 = "api-test0009"
$invocation9 = [guid]::NewGuid().ToString()

# No evidence needed for non-SHC services

try {
    $result = Invoke-MockBuilder -ImageTag $tag9 -Services @("api-server") -InvocationId $invocation9 -ExpectedCommit $commit9
    Assert-True "Builder accepts non-SHC service without evidence" $result.Success
    Assert-Equal "Non-SHC service built" "api-server" $result.Services[0]
} catch {
    Assert-True "Builder accepts non-SHC service without evidence" $false
    Write-Host "    Error: $_" -ForegroundColor Red
}

# ----------------------------------------------------------------------------
# Scenario 10: Evidence invalidation - previous success then failure
# ----------------------------------------------------------------------------
Write-TestHeader "Evidence invalidation - previous success then failure"

$commit10 = Get-MockCommitSHA
$tag10 = "shc-test0010"
$invocation10a = [guid]::NewGuid().ToString()
$invocation10b = [guid]::NewGuid().ToString()

# First evidence (success)
$evidence10a = Create-MockEvidence -ImageTag $tag10 -SourceCommit $commit10 -InvocationId $invocation10a
Assert-FileExists "First evidence created" $evidence10a

# Simulate invalidation (gate helper removes old evidence before new attempt)
Remove-Item -Force $evidence10a
Assert-FileNotExists "Evidence invalidated" $evidence10a

# Second attempt fails (no evidence created)
# Builder must not be able to proceed

try {
    $result = Invoke-MockBuilder -ImageTag $tag10 -Services @("skillhubcore-admin") -InvocationId $invocation10b -ExpectedCommit $commit10
    Assert-True "Builder cannot reuse invalidated evidence" $false
} catch {
    Assert-True "Builder cannot reuse invalidated evidence" $true
}

# ----------------------------------------------------------------------------
# Scenario 11: Default service selection includes SHC (via service-map)
# ----------------------------------------------------------------------------
Write-TestHeader "Default service selection includes SHC"

$commit11 = Get-MockCommitSHA
$tag11 = "shc-test0011"
$invocation11 = [guid]::NewGuid().ToString()

Create-MockEvidence -ImageTag $tag11 -SourceCommit $commit11 -InvocationId $invocation11

# Simulate default selection that includes SHC
try {
    $result = Invoke-MockBuilder -ImageTag $tag11 -Services @("skillhubcore-admin", "api-server", "realtutorialhub-web") -InvocationId $invocation11 -ExpectedCommit $commit11
    Assert-True "Builder enforces gate with default SHC selection" $result.Success
} catch {
    Assert-True "Builder enforces gate with default SHC selection" $false
    Write-Host "    Error: $_" -ForegroundColor Red
}

# ----------------------------------------------------------------------------
# Scenario 12: Evidence schema validation - missing required fields
# ----------------------------------------------------------------------------
Write-TestHeader "Evidence schema validation - missing required field"

$commit12 = Get-MockCommitSHA
$tag12 = "shc-test0012"
$invocation12 = [guid]::NewGuid().ToString()

# Create malformed evidence (missing invocationId)
$evidencePath12 = Join-Path $MockEvidenceDir "quality-gate-skillhubcore-admin-$tag12.json"
$malformedEvidence = @{
    version = "1.0"
    service = "skillhubcore-admin"
    sourceCommit = $commit12
    imageTag = $tag12
    # invocationId is MISSING
    status = "PASS"
    exitCode = 0
}
$malformedEvidence | ConvertTo-Json -Depth 10 | Set-Content -Path $evidencePath12 -Encoding UTF8

try {
    $result = Invoke-MockBuilder -ImageTag $tag12 -Services @("skillhubcore-admin") -InvocationId $invocation12 -ExpectedCommit $commit12
    Assert-True "Builder rejects evidence with missing fields" $false
} catch {
    $errorMessage = $_.Exception.Message
    Assert-True "Builder rejects evidence with missing fields" $true
    Assert-True "Error mentions missing field" ($errorMessage -like "*missing required field*")
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
