param(
  [ValidateSet("origin", "1", "2", "3", "all")]
  [string]$Batch = "origin",
  [switch]$Apply,
  [switch]$SkipWorkerRoutes,
  [string]$ManifestPath = "infra/hostinger/cloudflare/cloudflare-cutover-manifest.json"
)

$ErrorActionPreference = "Stop"

$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) {
  $token = $env:CloudFlare_API_TOKEN
}

if (-not $token) {
  throw "CLOUDFLARE_API_TOKEN is not set. Set it in the local shell before running this dry-run or apply command."
}

$manifest = Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

function Invoke-Cf {
  param(
    [ValidateSet("GET", "POST", "PATCH", "DELETE")]
    [string]$Method,
    [string]$Path,
    [object]$Body = $null
  )

  $uri = "https://api.cloudflare.com/client/v4$Path"
  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  }

  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body ($Body | ConvertTo-Json -Depth 20)
}

function Get-ZoneMap {
  $map = @{}

  foreach ($zoneName in $manifest.zones) {
    $response = Invoke-Cf -Method GET -Path "/zones?name=$zoneName"
    $zone = @($response.result)[0]
    if (-not $zone) {
      throw "Cloudflare zone not found: $zoneName"
    }
    $map[$zoneName] = $zone.id
  }

  return $map
}

function Get-RecordsForBatch {
  if ($Batch -eq "origin") {
    $records = @()
    $records += @($manifest.originApiRecords)
    if ($manifest.PSObject.Properties.Name -contains "originFrontendRecords") {
      $records += @($manifest.originFrontendRecords)
    }
    return $records
  }

  if ($Batch -eq "all") {
    $records = @()
    $records += @($manifest.originApiRecords)
    if ($manifest.PSObject.Properties.Name -contains "originFrontendRecords") {
      $records += @($manifest.originFrontendRecords)
    }
    foreach ($key in @("1", "2", "3")) {
      $records += @($manifest.frontendBatches.$key)
    }
    return $records
  }

  return @($manifest.frontendBatches.$Batch)
}

function Upsert-DnsRecord {
  param(
    [hashtable]$ZoneMap,
    [object]$Record
  )

  $zoneId = $ZoneMap[$Record.zone]
  if (-not $zoneId) {
    throw "Missing zone id for $($Record.zone)"
  }

  $existingResponse = Invoke-Cf -Method GET -Path "/zones/$zoneId/dns_records?type=$($Record.type)&name=$($Record.hostname)"
  $existing = @($existingResponse.result)[0]
  $body = @{
    type = $Record.type
    name = $Record.hostname
    content = $Record.content
    proxied = [bool]$Record.proxied
    ttl = 1
    comment = "Hostinger VPS migration cutover"
  }

  if ($existing) {
    Write-Host "DNS update planned: $($Record.hostname) $($existing.content) -> $($Record.content), proxied=$($Record.proxied)"
    if ($Apply) {
      Invoke-Cf -Method PATCH -Path "/zones/$zoneId/dns_records/$($existing.id)" -Body $body | Out-Null
      Write-Host "DNS updated: $($Record.hostname)"
    }
    return
  }

  Write-Host "DNS create planned: $($Record.hostname) -> $($Record.content), proxied=$($Record.proxied)"
  if ($Apply) {
    Invoke-Cf -Method POST -Path "/zones/$zoneId/dns_records" -Body $body | Out-Null
    Write-Host "DNS created: $($Record.hostname)"
  }
}

function Remove-WorkerRouteIfPresent {
  param(
    [hashtable]$ZoneMap,
    [object]$Record
  )

  if (-not $Record.workerRoute) {
    return
  }

  $zoneId = $ZoneMap[$Record.zone]
  $routesResponse = Invoke-Cf -Method GET -Path "/zones/$zoneId/workers/routes"
  $route = @($routesResponse.result) | Where-Object { $_.pattern -eq $Record.workerRoute } | Select-Object -First 1

  if (-not $route) {
    Write-Host "Worker route already absent: $($Record.workerRoute)"
    return
  }

  Write-Host "Worker route removal planned: $($Record.workerRoute)"
  if ($Apply) {
    Invoke-Cf -Method DELETE -Path "/zones/$zoneId/workers/routes/$($route.id)" | Out-Null
    Write-Host "Worker route removed: $($Record.workerRoute)"
  }
}

function Test-WorkerRouteAccess {
  param([hashtable]$ZoneMap)

  $zonesNeedingRouteAccess = @($records | Where-Object { $_.workerRoute } | ForEach-Object { $_.zone } | Sort-Object -Unique)
  foreach ($zoneName in $zonesNeedingRouteAccess) {
    $zoneId = $ZoneMap[$zoneName]
    try {
      Invoke-Cf -Method GET -Path "/zones/$zoneId/workers/routes" | Out-Null
    } catch {
      throw "Token cannot read Worker routes for zone '$zoneName'. Refusing frontend batch before DNS mutation to avoid partial cutover. Required permission: Workers Routes Read/Edit for the zone."
    }
  }
}

if (-not $Apply) {
  Write-Host "DRY RUN ONLY. Re-run with -Apply to change Cloudflare."
}

$zoneMap = Get-ZoneMap
$records = Get-RecordsForBatch

if (($Batch -ne "origin") -and (-not $SkipWorkerRoutes)) {
  Test-WorkerRouteAccess -ZoneMap $zoneMap
} elseif (($Batch -ne "origin") -and $SkipWorkerRoutes) {
  Write-Warning "Skipping Worker route checks and removals. Use only after frontend Worker routes are already removed or disabled outside this script."
}

foreach ($record in $records) {
  if (@($manifest.excludedHostnames) -contains $record.hostname) {
    throw "Refusing to modify excluded hostname: $($record.hostname)"
  }

  Upsert-DnsRecord -ZoneMap $zoneMap -Record $record
}

if (($Batch -ne "origin") -and (-not $SkipWorkerRoutes)) {
  foreach ($record in $records) {
    Remove-WorkerRouteIfPresent -ZoneMap $zoneMap -Record $record
  }
}

Write-Host "Cloudflare cutover command completed for batch '$Batch'. Apply=$Apply"
