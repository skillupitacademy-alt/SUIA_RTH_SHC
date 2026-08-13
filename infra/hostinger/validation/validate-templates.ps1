$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$envTemplate = Join-Path $root "infra\hostinger\env\.env.production.template"
$composeBase = Join-Path $root "infra\hostinger\compose\docker-compose.yml"
$composeProd = Join-Path $root "infra\hostinger\compose\docker-compose.production.yml"
$composeValidation = Join-Path $root "infra\hostinger\compose\docker-compose.validation.yml"

function Require-File {
  param([string] $Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Missing required file: $Path"
  }
}

function Require-Command {
  param([string] $Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

Require-Command "docker"
Require-File $envTemplate
Require-File $composeBase
Require-File $composeProd

@(
  "infra\hostinger\nginx\nginx.conf",
  "infra\hostinger\nginx\conf.d\frontend.conf",
  "infra\hostinger\nginx\conf.d\api-origin.conf",
  "infra\hostinger\nginx\conf.d\skillhub.conf",
  "infra\hostinger\nginx\snippets\proxy-common.conf",
  "infra\hostinger\nginx\snippets\ssl-origin.conf",
  "infra\hostinger\cloudflare\dns-records.md",
  "infra\hostinger\cloudflare\ssl-settings.md",
  "infra\hostinger\bootstrap\ubuntu-24.04.md",
  "infra\hostinger\scripts\verify.sh"
) | ForEach-Object {
  Require-File (Join-Path $root $_)
}

$env:HOSTINGER_ENV_FILE = $envTemplate

# docker compose runs locally during validation, so POSIX VPS env_file paths
# such as /opt/platform/env/shared/.env must be remapped to repo-local
# template files. The runtime compose keeps the VPS paths.
(Get-Content -LiteralPath $composeBase) `
  -replace '/opt/platform/env/', '../env/' `
  | Set-Content -Encoding UTF8 -LiteralPath $composeValidation

$jsonText = docker compose `
  --env-file $envTemplate `
  -f $composeValidation `
  -f $composeProd `
  config `
  --format json

Remove-Item -LiteralPath $composeValidation -Force -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
  throw "docker compose config failed"
}

$config = $jsonText | ConvertFrom-Json

foreach ($serviceName in $config.services.PSObject.Properties.Name) {
  $service = $config.services.$serviceName
  if ($serviceName -ne "nginx" -and $null -ne $service.ports) {
    throw "Unexpected public port mapping on service: $serviceName"
  }
}

if (-not $config.networks.PSObject.Properties.Name.Contains("app_internal")) {
  throw "Missing app_internal network"
}

Write-Output "Hostinger template validation passed."
