$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '../..')
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:PROJECT_LLM_EXECUTION_MODE = 'isolated_worker'
# Local build verification does not publish Sentry artifacts.
$env:SENTRY_AUTH_TOKEN = ''
$results = @()
function Gate([string]$Name, [string[]]$Arguments) {
  $started = (Get-Date).ToUniversalTime().ToString('o')
  & pnpm @Arguments *> (Join-Path $PSScriptRoot ($Name + '.log'))
  $code = $LASTEXITCODE
  $script:results += [pscustomobject]@{ name=$Name; command=('pnpm ' + ($Arguments -join ' ')); started=$started; finished=(Get-Date).ToUniversalTime().ToString('o'); exitCode=$code }
  $script:results | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $PSScriptRoot 'gates.json')
  Write-Output "$Name exit $code"
}
foreach ($app in @('skillhubcore-admin','skillup-web','realtutorialhub-web')) {
  Gate ($app + '-typecheck') @('--filter',('@quiz/' + $app),'type-check')
  Gate ($app + '-lint') @('--filter',('@quiz/' + $app),'lint','--max-warnings=0')
}
Gate 'shc-security' @('--filter','@quiz/skillhubcore-admin','test:security')
Gate 'shc-boundaries' @('--filter','@quiz/skillhubcore-admin','check:boundaries')
Gate 'shc-build' @('--filter','@quiz/skillhubcore-admin','exec','next','build','--webpack')
Gate 'suia-build' @('--filter','@quiz/skillup-web','build')
Gate 'rth-build' @('--filter','@quiz/realtutorialhub-web','build')
if ($results.Where({ $_.exitCode -ne 0 }).Count -gt 0) { exit 1 }
