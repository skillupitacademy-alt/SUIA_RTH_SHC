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
Write-LocalBuildCompose -Lines $composeLines -Path $TempCompose

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
if ($EnvFile) {
  Write-Host "Optional override env file: $EnvFile"
}

$imageRefs = @()
$manifestServices = @()

foreach ($service in $selected) {
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
  & docker compose --env-file $serviceEnvPath -f $TempCompose -f $ComposeProd build --pull $service
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
