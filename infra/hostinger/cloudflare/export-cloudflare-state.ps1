param(
  [string]$OutputDir = "infra/hostinger/cloudflare/state-exports",
  [string[]]$Zones = @("realtutorialhub.com", "skillupitacademy.com", "skillhubcore.in"),
  [string]$WorkerName = "platform-api-gateway"
)

$ErrorActionPreference = "Stop"

$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) {
  $token = $env:CloudFlare_API_TOKEN
}

if (-not $token) {
  throw "CLOUDFLARE_API_TOKEN is not set. Set it in the local shell before running this read-only export."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$exportRoot = Join-Path $OutputDir $timestamp
New-Item -ItemType Directory -Force -Path $exportRoot | Out-Null

$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

function Invoke-CfGet {
  param([string]$Path)

  $uri = "https://api.cloudflare.com/client/v4$Path"
  Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
}

function Save-Json {
  param(
    [string]$Path,
    [object]$Value
  )

  $Value | ConvertTo-Json -Depth 50 | Set-Content -Path $Path -Encoding UTF8
}

$accountResponse = $null
try {
  $accountResponse = Invoke-CfGet "/accounts"
  Save-Json (Join-Path $exportRoot "accounts.json") $accountResponse
} catch {
  Write-Warning "Could not export account list. Zone-level exports will continue: $($_.Exception.Message)"
}

$zoneIndex = @()

foreach ($zoneName in $Zones) {
  $zoneResponse = Invoke-CfGet "/zones?name=$zoneName"
  Save-Json (Join-Path $exportRoot "$zoneName.zone.json") $zoneResponse

  $zone = @($zoneResponse.result)[0]
  if (-not $zone) {
    Write-Warning "Zone not found: $zoneName"
    continue
  }

  $zoneId = $zone.id
  $zoneIndex += [pscustomobject]@{
    name = $zoneName
    id = $zoneId
    status = $zone.status
    paused = $zone.paused
  }

  Save-Json (Join-Path $exportRoot "$zoneName.dns.json") (Invoke-CfGet "/zones/$zoneId/dns_records?per_page=500")
  Save-Json (Join-Path $exportRoot "$zoneName.settings_ssl.json") (Invoke-CfGet "/zones/$zoneId/settings/ssl")
  Save-Json (Join-Path $exportRoot "$zoneName.settings_always_use_https.json") (Invoke-CfGet "/zones/$zoneId/settings/always_use_https")
  Save-Json (Join-Path $exportRoot "$zoneName.settings_automatic_https_rewrites.json") (Invoke-CfGet "/zones/$zoneId/settings/automatic_https_rewrites")
  Save-Json (Join-Path $exportRoot "$zoneName.settings_min_tls_version.json") (Invoke-CfGet "/zones/$zoneId/settings/min_tls_version")
  Save-Json (Join-Path $exportRoot "$zoneName.settings_http2.json") (Invoke-CfGet "/zones/$zoneId/settings/http2")
  Save-Json (Join-Path $exportRoot "$zoneName.settings_http3.json") (Invoke-CfGet "/zones/$zoneId/settings/http3")
  Save-Json (Join-Path $exportRoot "$zoneName.settings_websockets.json") (Invoke-CfGet "/zones/$zoneId/settings/websockets")
  Save-Json (Join-Path $exportRoot "$zoneName.rulesets.json") (Invoke-CfGet "/zones/$zoneId/rulesets")
}

Save-Json (Join-Path $exportRoot "zones.index.json") $zoneIndex

if ($accountResponse) {
  $accounts = @($accountResponse.result)
  foreach ($account in $accounts) {
    $accountId = $account.id
    $safeAccountName = ($account.name -replace '[^a-zA-Z0-9_.-]', '_')
    $workerPathPrefix = "/accounts/$accountId/workers"

    try {
      Save-Json (Join-Path $exportRoot "$safeAccountName.workers.scripts.json") (Invoke-CfGet "$workerPathPrefix/scripts")
    } catch {
      Write-Warning "Could not export workers scripts for account $($account.name): $($_.Exception.Message)"
    }

    try {
      Save-Json (Join-Path $exportRoot "$safeAccountName.$WorkerName.settings.json") (Invoke-CfGet "$workerPathPrefix/scripts/$WorkerName/settings")
    } catch {
      Write-Warning "Could not export Worker settings for $WorkerName in account $($account.name): $($_.Exception.Message)"
    }

    try {
      Save-Json (Join-Path $exportRoot "$safeAccountName.$WorkerName.deployments.json") (Invoke-CfGet "$workerPathPrefix/scripts/$WorkerName/deployments")
    } catch {
      Write-Warning "Could not export Worker deployments for $WorkerName in account $($account.name): $($_.Exception.Message)"
    }
  }
}

$summary = [pscustomobject]@{
  exportedAt = (Get-Date).ToString("o")
  outputDirectory = (Resolve-Path $exportRoot).Path
  zones = $zoneIndex
  workerName = $WorkerName
  accountExported = [bool]$accountResponse
  note = "Read-only Cloudflare state export. Do not commit generated JSON files."
}

Save-Json (Join-Path $exportRoot "summary.json") $summary
Write-Host "Cloudflare state exported to $exportRoot"
