param(
  [string]$ImageTag = "",
  [string]$OutputDir = "",
  [string]$EnvFile = "",
  [string[]]$Services = @(),
  [string]$InvocationId = "",
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
if ($selected -contains 'skillhubcore-admin') {
  Write-Host "Verifying quality gate evidence for skillhubcore-admin..."
  
  $evidenceDir = Join-Path $HostingerDir "dist\evidence"
  $evidencePath = Join-Path $evidenceDir "quality-gate-skillhubcore-admin-$ImageTag.json"
  
  if (-not (Test-Path $evidencePath)) {
    throw "Missing quality gate evidence for skillhubcore-admin (commit $ImageTag). Evidence file not found: $evidencePath"
  }
  
  try {
    $evidence = Get-Content -Raw $evidencePath | ConvertFrom-Json
  } catch {
    throw "Malformed quality gate evidence for skillhubcore-admin: $_"
  }
  
  # Validate evidence schema
  if (-not $evidence.version) {
    throw "Evidence missing required field: version"
  }
  if ($evidence.version -ne "1.0") {
    throw "Unsupported evidence version: $($evidence.version)"
  }
  if ($evidence.service -ne "skillhubcore-admin") {
    throw "Evidence service mismatch: expected 'skillhubcore-admin', got '$($evidence.service)'"
  }
  if ($evidence.status -ne "PASS") {
    throw "Quality gate did not pass for skillhubcore-admin (status: $($evidence.status))"
  }
  if ($evidence.exitCode -ne 0) {
    throw "Quality gate failed for skillhubcore-admin (exit code: $($evidence.exitCode))"
  }
  
  # Get full commit SHA for verification
  $fullCommit = git -C $RepoDir rev-parse HEAD 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Git rev-parse failed: $fullCommit"
  }
  $fullCommit = $fullCommit.Trim()
  
  # Verify source commit matches
  if ($evidence.sourceCommit -ne $fullCommit) {
    throw "Evidence source commit mismatch for skillhubcore-admin. Evidence: $($evidence.sourceCommit), Current: $fullCommit"
  }
  
  # Verify image tag matches
  if ($evidence.imageTag -ne $ImageTag) {
    throw "Evidence image tag mismatch for skillhubcore-admin. Evidence: $($evidence.imageTag), Build: $ImageTag"
  }
  
  # Verify invocation ID matches (if provided)
  if ($InvocationId -and $evidence.invocationId -ne $InvocationId) {
    throw "Evidence invocation mismatch for skillhubcore-admin. Evidence: $($evidence.invocationId), Build: $InvocationId"
  }
  
  Write-Host "Quality gate evidence verified for skillhubcore-admin"
  Write-Host "  Source commit: $fullCommit"
  Write-Host "  Gate: $($evidence.gate.profile)"
  Write-Host "  Status: $($evidence.status)"
}

# Verify source is still clean
$sourceStatus = git -C $RepoDir status --porcelain 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Git status failed: $sourceStatus"
}
if ($sourceStatus) {
  throw "Working tree has uncommitted changes. Deployment requires clean source."
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

$preBuildCommit = git -C $RepoDir rev-parse HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Git rev-parse verification failed: $preBuildCommit"
}
$preBuildCommit = $preBuildCommit.Trim()

$postBuildStatus = git -C $RepoDir status --porcelain 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Git status failed after build: $postBuildStatus"
}

if ($postBuildStatus) {
  throw "Working tree modified during build. Build process must not alter tracked source."
}

if ($postBuildCommit -ne $preBuildCommit) {
  throw "HEAD changed during build. Commit: before=$preBuildCommit, after=$postBuildCommit"
}

Write-Host "Source unchanged after build (commit: $postBuildCommit)"

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

# W0.2-HOSTINGER: Add evidence reference if SHC is included
if ($selected -contains 'skillhubcore-admin') {
  $evidencePath = Join-Path $evidenceDir "quality-gate-skillhubcore-admin-$ImageTag.json"
  if (Test-Path $evidencePath) {
    $manifestObject.qualityGateEvidence = @{
      service = "skillhubcore-admin"
      evidenceFile = "quality-gate-skillhubcore-admin-$ImageTag.json"
      verified = $true
    }
  }
}

$manifestObject | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $manifest

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
"$hash *$(Split-Path -Leaf $archive)" | Set-Content -Encoding ASCII $checksum

Write-Host "Image archive: $archive"
Write-Host "Manifest: $manifest"
Write-Host "Checksum: $checksum"
