param(
  [string]$RollbackRef = "",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$workerDir = Join-Path $repoRoot "services/api-gateway"
$wranglerPath = Join-Path $workerDir "wrangler.toml"

if (-not (Test-Path $wranglerPath)) {
  throw "Worker config not found: $wranglerPath"
}

Write-Host "Worker rollback target directory: $workerDir"

if ($RollbackRef) {
  Write-Host "RollbackRef provided: $RollbackRef"
  Write-Host "Review these files before deploying the rollback ref:"
  git -C $repoRoot show --stat $RollbackRef -- services/api-gateway/wrangler.toml services/api-gateway/src/routes/routing-table.ts
} else {
  Write-Host "No RollbackRef provided. The current local Worker config will be deployed if -Apply is set."
}

Write-Host "Validation commands:"
Write-Host "  cmd /c pnpm.cmd --filter @quiz/api-gateway test"
Write-Host "  cmd /c pnpm.cmd --filter @quiz/api-gateway type-check"

if (-not $Apply) {
  Write-Host "DRY RUN ONLY. Re-run with -Apply to deploy the Worker."
  exit 0
}

if ($RollbackRef) {
  throw "Automatic checkout of RollbackRef is intentionally not performed. Check out or restore the reviewed Worker rollback files first, then run this script with -Apply and no RollbackRef."
}

Push-Location $repoRoot
try {
  cmd /c pnpm.cmd --filter @quiz/api-gateway test
  if ($LASTEXITCODE -ne 0) {
    throw "Worker tests failed."
  }

  cmd /c pnpm.cmd --filter @quiz/api-gateway type-check
  if ($LASTEXITCODE -ne 0) {
    throw "Worker type-check failed."
  }

  cmd /c pnpm.cmd --filter @quiz/api-gateway exec wrangler deploy --env production
  if ($LASTEXITCODE -ne 0) {
    throw "Wrangler deploy failed."
  }
} finally {
  Pop-Location
}

Write-Host "Worker rollback deploy completed."
