param(
  [ValidateSet("1", "2", "3", "all")]
  [string]$Batch = "1",
  [Parameter(Mandatory = $true)]
  [string]$StateExportDir,
  [switch]$Apply,
  [string]$ManifestPath = "infra/hostinger/cloudflare/cloudflare-cutover-manifest.json"
)

$ErrorActionPreference = "Stop"

$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) {
  $token = $env:CloudFlare_API_TOKEN
}

if (-not $token) {
  throw "CLOUDFLARE_API_TOKEN is not set. Set it in the local shell before running this command."
}

if (-not (Test-Path $StateExportDir)) {
  throw "State export directory not found: $StateExportDir"
}

$manifest = Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

function Invoke-Cf {
  param(
    [ValidateSet("GET", "POST", "PATCH")]
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
  if ($Batch -eq "all") {
    $records = @()
    foreach ($key in @("1", "2", "3")) {
      $records += @($manifest.frontendBatches.$key)
    }
    return $records
  }

  return @($manifest.frontendBatches.$Batch)
}

function Get-ExportedDnsRecords {
  $files = Get-ChildItem -Path $StateExportDir -Filter "*.dns-records.json" -File
  if ($files.Count -eq 0) {
    throw "No *.dns-records.json files found in $StateExportDir"
  }

  $records = @()
  foreach ($file in $files) {
    $json = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
    $records += @($json.result)
  }

  return $records
}

if (-not $Apply) {
  Write-Host "DRY RUN ONLY. Re-run with -Apply to change Cloudflare DNS."
}

$zoneMap = Get-ZoneMap
$cutoverRecords = Get-RecordsForBatch
$exportedRecords = Get-ExportedDnsRecords

foreach ($record in $cutoverRecords) {
  $previous = @($exportedRecords | Where-Object { $_.name -eq $record.hostname } | Select-Object -First 1)

  if (-not $previous) {
    Write-Warning "No exported previous DNS record found for $($record.hostname). Skipping."
    continue
  }

  $zoneId = $zoneMap[$record.zone]
  $existingResponse = Invoke-Cf -Method GET -Path "/zones/$zoneId/dns_records?name=$($record.hostname)"
  $existing = @($existingResponse.result | Where-Object { $_.type -eq $previous.type } | Select-Object -First 1)

  $body = @{
    type = $previous.type
    name = $previous.name
    content = $previous.content
    proxied = [bool]$previous.proxied
    ttl = $previous.ttl
    comment = "Hostinger VPS migration rollback"
  }

  if ($existing) {
    Write-Host "DNS rollback planned: $($record.hostname) -> $($previous.type) $($previous.content), proxied=$($previous.proxied)"
    if ($Apply) {
      Invoke-Cf -Method PATCH -Path "/zones/$zoneId/dns_records/$($existing.id)" -Body $body | Out-Null
      Write-Host "DNS rolled back: $($record.hostname)"
    }
  } else {
    Write-Host "DNS rollback create planned: $($record.hostname) -> $($previous.type) $($previous.content), proxied=$($previous.proxied)"
    if ($Apply) {
      Invoke-Cf -Method POST -Path "/zones/$zoneId/dns_records" -Body $body | Out-Null
      Write-Host "DNS rollback record created: $($record.hostname)"
    }
  }
}

Write-Host "DNS rollback command completed for batch '$Batch'. Apply=$Apply"
