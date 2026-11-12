param([string]$ResumeFrom = '')
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '../..')
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:PROJECT_LLM_EXECUTION_MODE = 'isolated_worker'
# These are local qualification builds. Do not publish Sentry releases or maps.
$env:SENTRY_AUTH_TOKEN = ''
$results = @()
$gateStarted = [string]::IsNullOrWhiteSpace($ResumeFrom)
if (-not $gateStarted -and (Test-Path (Join-Path $PSScriptRoot 'final-gates.json'))) {
  $results = @((Get-Content (Join-Path $PSScriptRoot 'final-gates.json') -Raw | ConvertFrom-Json) | Where-Object { $_.exitCode -eq 0 })
}
while (-not (Test-Path (Join-Path $PSScriptRoot 'frozen-install.exit'))) {
  Start-Sleep -Seconds 5
}
if ((Get-Content (Join-Path $PSScriptRoot 'frozen-install.exit')).Trim() -ne '0') {
  throw 'Frozen dependency installation must succeed before qualification.'
}
function Invoke-QualificationGate {
  param([string]$Name, [string[]]$TaskArguments)
  if (-not $script:gateStarted) {
    if ($Name -ne $ResumeFrom) { return }
    $script:gateStarted = $true
  }
  $log = Join-Path $PSScriptRoot ($Name + '.log')
  $started = (Get-Date).ToUniversalTime().ToString('o')
  & pnpm @TaskArguments *> $log
  $code = $LASTEXITCODE
  $script:results += [pscustomobject]@{
    name = $Name
    command = 'pnpm ' + ($TaskArguments -join ' ')
    started = $started
    finished = (Get-Date).ToUniversalTime().ToString('o')
    exitCode = $code
  }
  $script:results | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $PSScriptRoot 'final-gates.json')
  Write-Output ($Name + ': exit ' + $code)
  if ($code -ne 0) { throw ($Name + ' failed; inspect its retained log.') }
}
Invoke-QualificationGate 'final-progress-tests' @('--filter','@quiz/db-tutorial','exec','vitest','run','src/repositories/__tests__/tutorial-progress.repository.test.ts','src/repositories/__tests__/batch-08-progress-isolation.test.ts','src/repositories/__tests__/foundation-progress-concurrency.test.ts')
Invoke-QualificationGate 'final-rth-tests' @('--filter','@quiz/realtutorialhub-web','exec','vitest','run','src/app/api/workers/','src/lib/__tests__/','src/app/__tests__/service-worker-private-cache.test.ts','src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/__tests__/page.test.ts','--environment=node')
Invoke-QualificationGate 'final-suia-tests' @('--filter','@quiz/skillup-web','test')
foreach ($app in @('skillhubcore-admin','skillup-web','realtutorialhub-web')) {
  Invoke-QualificationGate ('final-' + $app + '-typecheck') @('--filter',('@quiz/' + $app),'type-check')
  Invoke-QualificationGate ('final-' + $app + '-lint') @('--filter',('@quiz/' + $app),'lint','--max-warnings=0')
}
Invoke-QualificationGate 'final-api-typecheck' @('--filter','@quiz/api-server','exec','tsc','--noEmit')
Invoke-QualificationGate 'final-db-typecheck' @('--filter','@quiz/db-tutorial','type-check')
Invoke-QualificationGate 'final-shc-boundaries' @('--filter','@quiz/skillhubcore-admin','check:boundaries')
Invoke-QualificationGate 'final-shc-build' @('--filter','@quiz/skillhubcore-admin','exec','next','build','--webpack')
Invoke-QualificationGate 'final-suia-build' @('--filter','@quiz/skillup-web','build')
Invoke-QualificationGate 'final-rth-build' @('--filter','@quiz/realtutorialhub-web','build')
if (-not $gateStarted) { throw 'Resume gate was not found.' }
Write-Output 'All final gates completed.'
