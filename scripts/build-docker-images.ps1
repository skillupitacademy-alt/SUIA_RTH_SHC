param(
  [string]$TagSuffix = "local"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Build-Image {
  param(
    [Parameter(Mandatory = $true)][string]$Tag,
    [Parameter(Mandatory = $true)][string]$Dockerfile,
    [hashtable]$Args = @{}
  )

  $argList = @()
  foreach ($key in $Args.Keys) {
    $value = $Args[$key]
    if ($null -ne $value -and $value -ne "") {
      $argList += "--build-arg"
      $argList += "$key=$value"
    }
  }

  docker build @argList -t "$Tag`:$TagSuffix" -f $Dockerfile .
}

$commonArgs = @{
  NEXT_PUBLIC_API_URL    = "https://api.realtutorialhub.com"
  NEXT_PUBLIC_WEB_APP_URL = "https://quiz.realtutorialhub.com"
  NEXT_PUBLIC_ADMIN_URL  = "https://admin.realtutorialhub.com"
  INTERNAL_GATEWAY_SECRET = "local-build-placeholder"
  NEXT_PUBLIC_SENTRY_DSN = "https://example.invalid/0"
}

Build-Image -Tag "api-server" -Dockerfile "apps/api-server/Dockerfile" -Args $commonArgs
Build-Image -Tag "realtutorialhub-web" -Dockerfile "apps/realtutorialhub-web/Dockerfile" -Args $commonArgs
Build-Image -Tag "realtutorialhub-quiz" -Dockerfile "apps/realtutorialhub-quiz/Dockerfile" -Args $commonArgs
Build-Image -Tag "realtutorialhub-admin" -Dockerfile "apps/realtutorialhub-admin/Dockerfile" -Args $commonArgs
Build-Image -Tag "skillup-web" -Dockerfile "apps/skillup-web/Dockerfile"
Build-Image -Tag "skillup-admin" -Dockerfile "apps/skillup-admin/Dockerfile"
Build-Image -Tag "faculty-app" -Dockerfile "apps/faculty-app/Dockerfile"
Build-Image -Tag "skillhubcore-admin" -Dockerfile "apps/skillhubcore-admin/Dockerfile"
Build-Image -Tag "skillhubcore-service" -Dockerfile "services/skillhubcore-service/Dockerfile"
