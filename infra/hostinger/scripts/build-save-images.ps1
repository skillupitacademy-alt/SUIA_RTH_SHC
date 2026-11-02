param(
  [string]$ImageTag = "",
  [string]$OutputDir = "",
  [string]$EnvFile = "",
  [string[]]$Services = @(),
  [string]$InvocationId,
  [switch]$NoCache = $false
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HostingerDir = Split-Path -Parent $ScriptDir
$RepoDir = Resolve-Path (Join-Path $HostingerDir "..\..")
$ServiceMapPath = Join-Path $HostingerDir "config\service-map.json"
$ComposeBase = Join-Path $HostingerDir "compose\docker-compose.yml"
$ComposeProd = Join-Path $HostingerDir "compose\docker-compose.production.yml"
$TempCompose = Join-Path (Split-Path -Parent $ComposeBase) "docker-compose.local-build.yml"
$TempEnvDir = Join-Path $HostingerDir "dist\local-build-env"

function Read-EnvMap {
  param([string]$Path)

  $map = @{}
  if (-not $Path -or -not (Test-Path -LiteralPath $Path)) {
    return $map
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }
    if ($trimmed -match '^export\s+(.+)$') {
      $trimmed = $Matches[1]
    }
    if ($trimmed -match '^([^=\s]+)=(.*)$') {
      $map[$Matches[1]] = $Matches[2]
    }
  }

  return $map
}

function Merge-EnvFile {
  param(
    [hashtable]$Map,
    [string]$Path
  )

  $next = Read-EnvMap -Path $Path
  foreach ($key in $next.Keys) {
    $Map[$key] = $next[$key]
  }
}

function Convert-RemoteEnvPath {
  param([string]$RemotePath)

  $prefix = "/opt/platform/env/"
  if (-not $RemotePath.StartsWith($prefix)) {
    return $null
  }

  $relative = $RemotePath.Substring($prefix.Length).Replace("/", "\")
  return Join-Path (Join-Path $HostingerDir "env") $relative
}

function Get-ServiceBlock {
  param(
    [string[]]$Lines,
    [string]$Service
  )

  $escaped = [regex]::Escape($Service)
  $inBlock = $false
  $block = New-Object System.Collections.Generic.List[string]

  foreach ($line in $Lines) {
    if ($line -match "^  $escaped`:\s*$") {
      $inBlock = $true
      $block.Add($line)
      continue
    }

    if ($inBlock -and $line -match '^  [A-Za-z0-9_-]+:\s*$') {
      break
    }

    if ($inBlock) {
      $block.Add($line)
    }
  }

  return @($block)
}

function Get-ServiceEnvFiles {
  param(
    [string[]]$Lines,
    [string]$Service
  )

  $block = Get-ServiceBlock -Lines $Lines -Service $Service
  $paths = @()
  $inEnvFile = $false

  foreach ($line in $block) {
    if ($line -match '^\s{4}env_file:\s*$') {
      $inEnvFile = $true
      continue
    }
    if ($inEnvFile -and $line -match '^\s{6}-\s+(.+?)\s*$') {
      $local = Convert-RemoteEnvPath -RemotePath $Matches[1]
      if ($local) {
        $paths += $local
      }
      continue
    }
    if ($inEnvFile) {
      $inEnvFile = $false
    }
  }

  return $paths
}

function Get-ServiceBuildArgs {
  param(
    [string[]]$Lines,
    [string]$Service
  )

  $block = Get-ServiceBlock -Lines $Lines -Service $Service
  $args = @()
  $inArgs = $false

  foreach ($line in $block) {
    if ($line -match '^\s{6}args:\s*$') {
      $inArgs = $true
      continue
    }
    if ($inArgs -and $line -match '^\s{8}[A-Za-z0-9_]+:\s+\$\{([^}:]+)') {
      $args += $Matches[1]
      continue
    }
    if ($inArgs -and $line -match '^\s{6}[A-Za-z0-9_]+:\s*') {
      break
    }
  }

  return @($args | Sort-Object -Unique)
}

function Write-LocalBuildCompose {
  param(
    [string[]]$Lines,
    [string]$Path
  )

  $filteredLines = New-Object System.Collections.Generic.List[string]
  $skipEnvFileBlock = $false

  foreach ($line in $Lines) {
    if ($line -match '^\s{4}env_file:\s*$') {
      $skipEnvFileBlock = $true
      continue
    }

    if ($skipEnvFileBlock) {
      if ($line -match '^\s{6}-\s+/opt/platform/env/') {
        continue
      }
      $skipEnvFileBlock = $false
    }

    $filteredLines.Add($line)
  }

  $filteredLines | Set-Content -Encoding UTF8 -LiteralPath $Path
}

if (-not $ImageTag) {
  $ImageTag = (git -C $RepoDir rev-parse --short=12 HEAD).Trim()
}

if (-not $OutputDir) {
  $OutputDir = Join-Path $HostingerDir "dist\images"
}

if (-not $EnvFile) {
  $EnvFile = $env:HOSTINGER_ENV_FILE
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $TempEnvDir | Out-Null

$composeLines = Get-Content -LiteralPath $ComposeBase

$serviceMap = Get-Content -Raw $ServiceMapPath | ConvertFrom-Json
$buildable = @($serviceMap.services.PSObject.Properties | Where-Object { $_.Value.buildable -eq $true })

if ($Services.Count -eq 0) {
  $Services = @($buildable | Where-Object { $_.Value.optional -ne $true } | ForEach-Object { $_.Name })
}

$selected = @()
foreach ($service in $Services) {
  $entry = $serviceMap.services.PSObject.Properties[$service]
  if (-not $entry) {
    throw "Unknown service: $service"
  }
  if ($entry.Value.buildable -ne $true) {
    throw "Service is not buildable: $service"
  }
  $selected += $service
}

# W0.2-HOSTINGER: Verify quality gate evidence for SkillHubCore
$expectedCommitBeforeBuild = $null
if ($selected -contains 'skillhubcore-admin') {
  Write-Host "Verifying quality gate evidence for skillhubcore-admin..."
  
  # Capture expected commit BEFORE any build operations
  $expectedCommitBeforeBuild = git -C $RepoDir rev-parse HEAD 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Git rev-parse failed before build: $expectedCommitBeforeBuild"
  }
  $expectedCommitBeforeBuild = $expectedCommitBeforeBuild.Trim()
  
  $evidenceDir = Join-Path $HostingerDir "dist\evidence"
  $evidencePath = Join-Path $evidenceDir "quality-gate-skillhubcore-admin-$ImageTag.json"
  
  if (-not (Test-Path $evidencePath)) {
    throw "Missing quality gate evidence for skillhubcore-admin (tag $ImageTag). Run deployment orchestrator or quality gate helper to create evidence. Evidence file not found: $evidencePath"
  }
  
  try {
    $evidenceRaw = Get-Content -Raw $evidencePath
    $evidence = $evidenceRaw | ConvertFrom-Json
  } catch {
    throw "Malformed quality gate evidence for skillhubcore-admin: $_"
  }
  
  # Validate evidence schema and types (fail closed on missing/wrong-type fields)
  if (-not $evidence.PSObject.Properties['version']) {
    throw "Evidence missing required field: version"
  }
  if ($evidence.version -isnot [string]) {
    throw "Evidence field 'version' has wrong type: expected string, got $($evidence.version.GetType().Name)"
  }
  if ($evidence.version -ne "1.0") {
    throw "Unsupported evidence version: $($evidence.version)"
  }
  
  if (-not $evidence.PSObject.Properties['service']) {
    throw "Evidence missing required field: service"
  }
  if ($evidence.service -isnot [string]) {
    throw "Evidence field 'service' has wrong type: expected string"
  }
  if ($evidence.service -ne "skillhubcore-admin") {
    throw "Evidence service mismatch: expected 'skillhubcore-admin', got '$($evidence.service)'"
  }
  
  if (-not $evidence.PSObject.Properties['sourceCommit']) {
    throw "Evidence missing required field: sourceCommit"
  }
  if ($evidence.sourceCommit -isnot [string]) {
    throw "Evidence field 'sourceCommit' has wrong type: expected string"
  }
  if ($evidence.sourceCommit.Length -ne 40) {
    throw "Evidence sourceCommit must be full 40-char SHA, got $($evidence.sourceCommit.Length) chars"
  }
  
  if (-not $evidence.PSObject.Properties['imageTag']) {
    throw "Evidence missing required field: imageTag"
  }
  if ($evidence.imageTag -isnot [string]) {
    throw "Evidence field 'imageTag' has wrong type: expected string"
  }
  if ($evidence.imageTag -ne $ImageTag) {
    throw "Evidence image tag mismatch for skillhubcore-admin. Evidence: $($evidence.imageTag), Build: $ImageTag"
  }
  
  if (-not $evidence.PSObject.Properties['invocationId']) {
    throw "Evidence missing required field: invocationId"
  }
  if ($evidence.invocationId -isnot [string]) {
    throw "Evidence field 'invocationId' has wrong type: expected string"
  }
  
  # For SHC, require validated current association
  if (-not $InvocationId) {
    throw "Direct builder invocation for skillhubcore-admin requires -InvocationId parameter. Run deployment orchestrator or quality gate helper with a fresh invocation to create current association."
  }
  if ($evidence.invocationId -ne $InvocationId) {
    throw "Evidence invocation mismatch for skillhubcore-admin. Evidence contains invocation '$($evidence.invocationId)' but build was requested with '$InvocationId'. Cannot reuse evidence from different invocation. Run deployment orchestrator or quality gate helper with current invocation."
  }
  
  # Validate gate identity
  if (-not $evidence.PSObject.Properties['gate']) {
    throw "Evidence missing required field: gate"
  }
  if (-not $evidence.gate.PSObject.Properties['command']) {
    throw "Evidence missing required field: gate.command"
  }
  if ($evidence.gate.command -isnot [string]) {
    throw "Evidence field 'gate.command' has wrong type: expected string"
  }
  if (-not $evidence.gate.PSObject.Properties['profile']) {
    throw "Evidence missing required field: gate.profile"
  }
  if ($evidence.gate.profile -isnot [string]) {
    throw "Evidence field 'gate.profile' has wrong type: expected string"
  }
  if ($evidence.gate.profile -ne "quality:skillhubcore") {
    throw "Evidence gate profile mismatch: expected 'quality:skillhubcore', got '$($evidence.gate.profile)'"
  }
  
  # Validate timing and freshness
  if (-not $evidence.PSObject.Properties['timing']) {
    throw "Evidence missing required field: timing"
  }
  if (-not $evidence.timing.PSObject.Properties['startUtc']) {
    throw "Evidence missing required field: timing.startUtc"
  }
  if ($evidence.timing.startUtc -isnot [string]) {
    throw "Evidence field 'timing.startUtc' has wrong type: expected string"
  }
  if (-not $evidence.timing.PSObject.Properties['completionUtc']) {
    throw "Evidence missing required field: timing.completionUtc"
  }
  if ($evidence.timing.completionUtc -isnot [string]) {
    throw "Evidence field 'timing.completionUtc' has wrong type: expected string"
  }
  
  try {
    $startTime = [DateTime]::Parse($evidence.timing.startUtc, [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::AssumeUniversal -bor [System.Globalization.DateTimeStyles]::AdjustToUniversal)
    $completionTime = [DateTime]::Parse($evidence.timing.completionUtc, [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::AssumeUniversal -bor [System.Globalization.DateTimeStyles]::AdjustToUniversal)
    $now = [DateTime]::UtcNow
    
    if ($completionTime -lt $startTime) {
      throw "Evidence timing invalid: completion ($($evidence.timing.completionUtc)) before start ($($evidence.timing.startUtc))"
    }
    
    # Freshness check: evidence must be from the last hour
    $ageMinutes = ($now - $completionTime).TotalMinutes
    if ($ageMinutes -gt 60) {
      throw "Evidence is too old (completed $([Math]::Round($ageMinutes, 1)) minutes ago). Run deployment orchestrator or quality gate helper to create fresh evidence."
    }
  } catch {
    throw "Evidence timing validation failed: $_"
  }
  
  if (-not $evidence.PSObject.Properties['status']) {
    throw "Evidence missing required field: status"
  }
  if ($evidence.status -isnot [string]) {
    throw "Evidence field 'status' has wrong type: expected string"
  }
  if ($evidence.status -ne "PASS") {
    throw "Quality gate did not pass for skillhubcore-admin (status: $($evidence.status))"
  }
  
  if (-not $evidence.PSObject.Properties['exitCode']) {
    throw "Evidence missing required field: exitCode"
  }
  if ($evidence.exitCode -isnot [int] -and $evidence.exitCode -isnot [long]) {
    throw "Evidence field 'exitCode' has wrong type: expected integer"
  }
  if ($evidence.exitCode -ne 0) {
    throw "Quality gate failed for skillhubcore-admin (exit code: $($evidence.exitCode))"
  }
  
  # Verify source commit matches expected commit (captured before build)
  if ($evidence.sourceCommit -ne $expectedCommitBeforeBuild) {
    throw "Evidence source commit mismatch for skillhubcore-admin. Evidence: $($evidence.sourceCommit), Expected before build: $expectedCommitBeforeBuild. Cannot use evidence from different commit."
  }
  
  Write-Host "Quality gate evidence verified for skillhubcore-admin"
  Write-Host "  Source commit: $expectedCommitBeforeBuild"
  Write-Host "  Gate: $($evidence.gate.profile)"
  Write-Host "  Status: $($evidence.status)"
  Write-Host "  Invocation: $($evidence.invocationId)"
}

# Verify source is still clean (only for SHC - preserve non-SHC behavior)
if ($selected -contains 'skillhubcore-admin') {
  $sourceStatus = git -C $RepoDir status --porcelain 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Git status failed: $sourceStatus"
  }
  if ($sourceStatus) {
    throw "Working tree has uncommitted changes. SkillHubCore deployment requires clean source for provenance."
  }
}

if ($selected -contains 'project-ai') {
  # Check before generating the tracked local Compose helper.
  $sourceStatus = & git -C $RepoDir status --porcelain --untracked-files=normal
  if ($LASTEXITCODE -ne 0 -or $sourceStatus) {
    throw 'Commit or separately preserve pending changes before building Project AI. The worker runs committed HEAD only.'
  }
}
Write-LocalBuildCompose -Lines $composeLines -Path $TempCompose

Write-Host "Building services: $($selected -join ', ')"
Write-Host "Image tag: $ImageTag"
if ($EnvFile) {
  Write-Host "Optional override env file: $EnvFile"
}

$imageRefs = @()
$manifestServices = @()

foreach ($service in $selected) {
  if ($service -eq 'project-ai') {
    # Ship committed source history in the private worker image, not env files.
    $sourceBundleDir = Join-Path $RepoDir 'services\project-ai\.build'
    New-Item -ItemType Directory -Force -Path $sourceBundleDir | Out-Null
    & git -C $RepoDir bundle create (Join-Path $sourceBundleDir 'source.bundle') HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Failed to create Project AI source bundle.' }
  }
  $serviceEnvFiles = Get-ServiceEnvFiles -Lines $composeLines -Service $service
  $serviceBuildArgs = Get-ServiceBuildArgs -Lines $composeLines -Service $service
  $mergedEnv = @{}

  foreach ($file in $serviceEnvFiles) {
    Merge-EnvFile -Map $mergedEnv -Path $file
  }
  if ($EnvFile) {
    Merge-EnvFile -Map $mergedEnv -Path $EnvFile
  }

  $serviceEnvPath = Join-Path $TempEnvDir "$service.env"
  $buildEnvLines = @()
  foreach ($arg in $serviceBuildArgs) {
    if ($mergedEnv.ContainsKey($arg)) {
      $buildEnvLines += "$arg=$($mergedEnv[$arg])"
    }
  }
  if ($buildEnvLines.Count -eq 0) {
    "# No build args declared for $service" | Set-Content -Encoding ASCII -LiteralPath $serviceEnvPath
  } else {
    $buildEnvLines | Set-Content -Encoding ASCII -LiteralPath $serviceEnvPath
  }

  Write-Host "Building $service with $($buildEnvLines.Count) build variable(s)"
  
  $buildArgs = @("compose", "--env-file", $serviceEnvPath, "-f", $TempCompose, "-f", $ComposeProd, "build", "--pull")
  if ($NoCache) {
    Write-Host "Building with --no-cache flag (ignoring Docker cache)"
    $buildArgs += "--no-cache"
  }
  $buildArgs += $service
  
  & docker @buildArgs
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose build failed for $service"
  }

  $imageName = $serviceMap.services.$service.image_name
  $latestRef = "${imageName}:latest"
  $taggedRef = "${imageName}:${ImageTag}"

  & docker image inspect $latestRef --format "{{.Id}}" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Cannot find built image for $service as $latestRef"
  }

  & docker tag $latestRef $taggedRef
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to tag $service as $taggedRef"
  }

  $imageRefs += $taggedRef
  $manifestServices += [ordered]@{
    service = $service
    image = $imageName
    tag = $ImageTag
    ref = $taggedRef
  }
}

# W0.2-HOSTINGER: Recheck source after build, before packaging
Write-Host "Rechecking source after build..."
$postBuildCommit = git -C $RepoDir rev-parse HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Git rev-parse failed after build: $postBuildCommit"
}
$postBuildCommit = $postBuildCommit.Trim()

$postBuildStatus = git -C $RepoDir status --porcelain 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Git status failed after build: $postBuildStatus"
}

if ($postBuildStatus) {
  throw "Working tree modified during build. Build process must not alter tracked source."
}

# For SHC: Compare post-build HEAD to expected commit captured before build AND evidence
if ($expectedCommitBeforeBuild) {
  if ($postBuildCommit -ne $expectedCommitBeforeBuild) {
    throw "HEAD changed during build for skillhubcore-admin deployment. Expected: $expectedCommitBeforeBuild, After build: $postBuildCommit. Cannot package artifacts from drifted source."
  }
  Write-Host "Source unchanged after build (commit: $postBuildCommit)"
} else {
  Write-Host "Source unchanged after build (commit: $postBuildCommit)"
}

$archive = Join-Path $OutputDir "quiz-platform-images-$ImageTag.tar"
$manifest = Join-Path $OutputDir "quiz-platform-images-$ImageTag.manifest.json"
$checksum = Join-Path $OutputDir "quiz-platform-images-$ImageTag.tar.sha256"

& docker save -o $archive @imageRefs
if ($LASTEXITCODE -ne 0) {
  throw "docker save failed"
}

$manifestObject = [ordered]@{
  schemaVersion = "1"
  imageTag = $ImageTag
  gitCommit = (git -C $RepoDir rev-parse HEAD).Trim()
  createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  services = $manifestServices
}

# W0.2-HOSTINGER: Bind validated receipt provenance to manifest
if ($selected -contains 'skillhubcore-admin') {
  $evidenceDir = Join-Path $HostingerDir "dist\evidence"
  $evidencePath = Join-Path $evidenceDir "quality-gate-skillhubcore-admin-$ImageTag.json"
  
  # Revalidate evidence before packaging (fail closed on missing/stale)
  if (-not (Test-Path $evidencePath)) {
    throw "Evidence missing before packaging for skillhubcore-admin. Cannot package artifacts without validated provenance."
  }
  
  try {
    $evidenceRaw = Get-Content -Raw $evidencePath
    $evidenceForManifest = $evidenceRaw | ConvertFrom-Json
  } catch {
    throw "Cannot read evidence before packaging: $_"
  }
  
  # Verify evidence still matches current state
  if ($evidenceForManifest.sourceCommit -ne $expectedCommitBeforeBuild) {
    throw "Evidence commit mismatch before packaging. Evidence: $($evidenceForManifest.sourceCommit), Expected: $expectedCommitBeforeBuild"
  }
  if ($evidenceForManifest.invocationId -ne $InvocationId) {
    throw "Evidence invocation mismatch before packaging. Cannot package with mismatched association."
  }
  if ($evidenceForManifest.status -ne "PASS") {
    throw "Cannot package artifacts: evidence status is not PASS (got: $($evidenceForManifest.status))"
  }
  
  # Compute evidence integrity hash
  $evidenceHash = (Get-FileHash -LiteralPath $evidencePath -Algorithm SHA256).Hash.ToLowerInvariant()
  
  $manifestObject.qualityGateEvidence = @{
    service = "skillhubcore-admin"
    sourceCommit = $evidenceForManifest.sourceCommit
    invocationId = $evidenceForManifest.invocationId
    gateProfile = $evidenceForManifest.gate.profile
    status = $evidenceForManifest.status
    evidenceFile = "quality-gate-skillhubcore-admin-$ImageTag.json"
    evidenceIntegrity = @{
      algorithm = "SHA256"
      hash = $evidenceHash
    }
  }
  
  Write-Host "Bound quality gate provenance to manifest:"
  Write-Host "  Commit: $($evidenceForManifest.sourceCommit)"
  Write-Host "  Invocation: $($evidenceForManifest.invocationId)"
  Write-Host "  Evidence hash: $evidenceHash"
}

$manifestObject | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $manifest

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
"$hash *$(Split-Path -Leaf $archive)" | Set-Content -Encoding ASCII $checksum

Write-Host "Image archive: $archive"
Write-Host "Manifest: $manifest"
Write-Host "Checksum: $checksum"
