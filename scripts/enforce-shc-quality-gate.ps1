#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Enforce SkillHubCore quality gate before deployment build
    
.DESCRIPTION
    Executes the canonical SHC quality gate and captures evidence.
    Fails closed on any errors. Evidence is a transient release receipt,
    not tamper-proof proof.
    
.PARAMETER RepositoryRoot
    Absolute path to repository root
    
.PARAMETER ImageTag
    Image tag for this deployment (12-char short hash)
    
.PARAMETER EvidenceDir
    Directory to write evidence receipt
    
.PARAMETER InvocationId
    Unique invocation identifier to associate evidence
    
.NOTES
    Required by W0.2-HOSTINGER enforcement.
    Architecture authority: Sol
    Implementer: Claude Sonnet 4.5
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$RepositoryRoot,
    
    [Parameter(Mandatory=$true)]
    [string]$ImageTag,
    
    [Parameter(Mandatory=$true)]
    [string]$EvidenceDir,
    
    [Parameter(Mandatory=$true)]
    [string]$InvocationId
)

$ErrorActionPreference = 'Stop'

function Write-Info { 
    param($Message) 
    Write-Host "[GATE] $Message" -ForegroundColor Cyan 
}

function Write-Err { 
    param($Message) 
    Write-Host "[GATE-ERROR] $Message" -ForegroundColor Red 
}

# Validate parameters - filesystem checks only, no Git yet
if (-not (Test-Path $RepositoryRoot)) {
    Write-Err "Repository root does not exist: $RepositoryRoot"
    exit 1
}

if (-not (Test-Path $EvidenceDir)) {
    try {
        New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
    } catch {
        Write-Err "Cannot create evidence directory: $EvidenceDir"
        exit 1
    }
}

# INVALIDATE PRIOR SUCCESS BEFORE ANY GIT/GATE OPERATIONS
# This ensures no Git failure can leave reusable old success
$evidencePath = Join-Path $EvidenceDir "quality-gate-skillhubcore-admin-$ImageTag.json"
if (Test-Path $evidencePath) {
    Write-Info "Invalidating previous evidence before gate attempt: $evidencePath"
    try {
        Remove-Item -Force $evidencePath
        Write-Info "Previous evidence invalidated"
    } catch {
        Write-Err "Cannot invalidate previous evidence: $_"
        exit 1
    }
}

# NOW validate it's a git repository (after invalidation)
Write-Info "Validating git repository..."
try {
    $gitDir = git -C $RepositoryRoot rev-parse --git-dir 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Not a git repository: $RepositoryRoot"
        Write-Err "Git output: $gitDir"
        exit 1
    }
} catch {
    Write-Err "Cannot validate git repository: $_"
    exit 1
}

# Get full commit SHA (40 chars) using git -C
Write-Info "Resolving full commit SHA..."
try {
    $fullCommit = git -C $RepositoryRoot rev-parse HEAD 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Git rev-parse failed: $fullCommit"
        exit 1
    }
    $fullCommit = $fullCommit.Trim()
    
    if ($fullCommit.Length -ne 40) {
        Write-Err "Invalid commit SHA length: $($fullCommit.Length) (expected 40)"
        exit 1
    }
    
    Write-Info "Full commit: $fullCommit"
} catch {
    Write-Err "Failed to get commit SHA: $_"
    exit 1
}

# Verify working tree is clean
Write-Info "Verifying clean working tree..."
try {
    $gitStatus = git -C $RepositoryRoot status --porcelain 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Git status failed: $gitStatus"
        exit 1
    }
    
    if ($gitStatus) {
        Write-Err "Working tree has uncommitted changes:"
        Write-Host ""
        git -C $RepositoryRoot status --short
        Write-Host ""
        Write-Err "Quality gate requires clean working tree for provenance"
        Write-Host "Commit or stash changes before deploying." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Info "Working tree is clean"
} catch {
    Write-Err "Failed to check git status: $_"
    exit 1
}

# Execute canonical quality gate from repository root
$service = "skillhubcore-admin"
$gateCommand = "pnpm"
$gateArgs = @("quality:skillhubcore")
$gateProfile = "quality:skillhubcore"

Write-Info "Executing quality gate for $service..."
Write-Info "Command: $gateCommand $($gateArgs -join ' ')"
Write-Info "Working directory: $RepositoryRoot"

$startTime = (Get-Date).ToUniversalTime()

try {
    # Execute gate command with explicit error handling
    $gateProcess = Start-Process -FilePath $gateCommand `
        -ArgumentList $gateArgs `
        -WorkingDirectory $RepositoryRoot `
        -NoNewWindow `
        -Wait `
        -PassThru
    
    $exitCode = $gateProcess.ExitCode
    
    if ($exitCode -ne 0) {
        Write-Err "Quality gate failed with exit code: $exitCode"
        # Do not create evidence on failure
        exit $exitCode
    }
    
    Write-Info "Quality gate passed (exit code: 0)"
    
} catch {
    Write-Err "Failed to start quality gate command: $_"
    exit 1
}

$completionTime = (Get-Date).ToUniversalTime()

# Recheck source after gate
Write-Info "Rechecking source after gate..."
try {
    $postGateCommit = git -C $RepositoryRoot rev-parse HEAD 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Git rev-parse failed after gate: $postGateCommit"
        exit 1
    }
    $postGateCommit = $postGateCommit.Trim()
    
    if ($postGateCommit -ne $fullCommit) {
        Write-Err "HEAD changed during gate execution"
        Write-Err "  Before: $fullCommit"
        Write-Err "  After:  $postGateCommit"
        exit 1
    }
    
    $postGateStatus = git -C $RepositoryRoot status --porcelain 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Git status failed after gate: $postGateStatus"
        exit 1
    }
    
    if ($postGateStatus) {
        Write-Err "Working tree modified during gate execution:"
        Write-Host ""
        git -C $RepositoryRoot status --short
        Write-Host ""
        Write-Err "Quality gate must not modify tracked source"
        exit 1
    }
    
    Write-Info "Source unchanged after gate"
} catch {
    Write-Err "Failed to verify source after gate: $_"
    exit 1
}

# Create evidence receipt (versioned JSON contract)
$evidence = @{
    version = "1.0"
    service = $service
    sourceCommit = $fullCommit
    imageTag = $ImageTag
    invocationId = $InvocationId
    gate = @{
        command = $gateCommand
        profile = $gateProfile
    }
    timing = @{
        startUtc = $startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        completionUtc = $completionTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    status = "PASS"
    exitCode = 0
}

# Write evidence atomically
try {
    $evidenceJson = $evidence | ConvertTo-Json -Depth 10
    $tempPath = "$evidencePath.tmp"
    
    $evidenceJson | Set-Content -Path $tempPath -Encoding UTF8 -NoNewline
    
    Move-Item -Path $tempPath -Destination $evidencePath -Force
    
    Write-Info "Evidence written: $evidencePath"
} catch {
    Write-Err "Failed to write evidence: $_"
    exit 1
}

Write-Host ""
Write-Info "Quality gate enforcement complete"
Write-Info "Service: $service"
Write-Info "Commit: $fullCommit"
Write-Info "Image tag: $ImageTag"
Write-Info "Status: PASS"
Write-Host ""

exit 0
