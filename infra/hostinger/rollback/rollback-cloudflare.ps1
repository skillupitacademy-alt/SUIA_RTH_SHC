param(
  [ValidateSet("worker", "dns", "all")]
  [string]$Mode = "worker",
  [ValidateSet("1", "2", "3", "all")]
  [string]$Batch = "1",
  [string]$StateExportDir = "",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

Write-Host "Cloudflare rollback mode: $Mode"
Write-Host "Apply: $Apply"

if ($Mode -eq "worker" -or $Mode -eq "all") {
  & (Join-Path $PSScriptRoot "rollback-worker.ps1") -Apply:$Apply
}

if ($Mode -eq "dns" -or $Mode -eq "all") {
  if (-not $StateExportDir) {
    throw "StateExportDir is required for DNS rollback."
  }

  & (Join-Path $PSScriptRoot "rollback-dns.ps1") -Batch $Batch -StateExportDir $StateExportDir -Apply:$Apply
}

Write-Host "Cloudflare rollback orchestration completed."
