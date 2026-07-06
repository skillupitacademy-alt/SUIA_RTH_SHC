param(
  [string]$ImageTag = "",
  [string]$OutputDir = "",
  [string]$EnvFile = "",
  [string[]]$Services = @()
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HostingerDir = Split-Path -Parent $ScriptDir
$RepoDir = Resolve-Path (Join-Path $HostingerDir "..\..")
$ServiceMapPath = Join-Path $HostingerDir "config\service-map.json"
$ComposeBase = Join-Path $HostingerDir "compose\docker-compose.yml"
$ComposeProd = Join-Path $HostingerDir "compose\docker-compose.production.yml"
$TempDir = Split-Path -Parent $ComposeBase
$LocalComposeBase = Join-Path $TempDir "docker-compose.local-build.yml"

if (-not $ImageTag) {
  $ImageTag = (git -C $RepoDir rev-parse --short=12 HEAD).Trim()
}

if (-not $OutputDir) {
  $OutputDir = Join-Path $HostingerDir "dist\images"
}

if (-not $EnvFile) {
  $EnvFile = $env:HOSTINGER_ENV_FILE
}

if (-not $EnvFile -or -not (Test-Path -LiteralPath $EnvFile)) {
  throw "EnvFile is required. Pass -EnvFile <path> or set HOSTINGER_ENV_FILE."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Local Docker builds do not need the VPS runtime env_file entries. Docker Compose
# validates those absolute VPS paths on Windows before it starts the build, so use
# a temporary build-only copy with env_file blocks removed.
$composeLines = Get-Content -LiteralPath $ComposeBase
$filteredLines = New-Object System.Collections.Generic.List[string]
$skipEnvFileBlock = $false
foreach ($line in $composeLines) {
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
$filteredLines | Set-Content -Encoding UTF8 -LiteralPath $LocalComposeBase

$serviceMap = Get-Content -Raw $ServiceMapPath | ConvertFrom-Json
$buildable = @($serviceMap.services.PSObject.Properties | Where-Object { $_.Value.buildable -eq $true })

if ($Services.Count -eq 0) {
  $Services = @($buildable.Name)
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

Write-Host "Building services: $($selected -join ', ')"
Write-Host "Image tag: $ImageTag"
Write-Host "Env file: $EnvFile"

$composeArgs = @(
  "compose",
  "--env-file", $EnvFile,
  "-f", $LocalComposeBase,
  "-f", $ComposeProd,
  "build",
  "--pull"
) + $selected

& docker @composeArgs
if ($LASTEXITCODE -ne 0) {
  throw "docker compose build failed"
}

$imageRefs = @()
$manifestServices = @()

foreach ($service in $selected) {
  $imageName = $serviceMap.services.$service.image_name
  $latestRef = "${imageName}:latest"
  $taggedRef = "${imageName}:${ImageTag}"

  $imageId = (& docker image inspect $latestRef -f "{{.Id}}" 2>$null)
  if (-not $imageId) {
    $imageId = (& docker compose --env-file $EnvFile -f $LocalComposeBase -f $ComposeProd images -q $service 2>$null | Select-Object -First 1)
    if (-not $imageId) {
      throw "Cannot find built image for $service"
    }
    & docker tag $imageId $latestRef
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to tag $service as $latestRef"
    }
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
$manifestObject | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $manifest

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
"$hash *$(Split-Path -Leaf $archive)" | Set-Content -Encoding ASCII $checksum

Write-Host "Image archive: $archive"
Write-Host "Manifest: $manifest"
Write-Host "Checksum: $checksum"
