param(
    [string]$KeyPath = "$PSScriptRoot\..\..\..\suia_rth"
)

$ErrorActionPreference = "Stop"

$resolvedKeyPath = Resolve-Path -LiteralPath $KeyPath -ErrorAction Stop

Write-Host "Using SSH key: $resolvedKeyPath"
Write-Host "Starting Windows ssh-agent if needed..."

$agent = Get-Service -Name ssh-agent -ErrorAction Stop
if ($agent.Status -ne "Running") {
    Start-Service -Name ssh-agent
}

Write-Host "Loading key into ssh-agent. Enter the key passphrase when prompted."
ssh-add $resolvedKeyPath

Write-Host ""
Write-Host "Loaded SSH identities:"
ssh-add -l

Write-Host ""
Write-Host "Next verification command:"
Write-Host "ssh -i `"$resolvedKeyPath`" root@72.61.115.49 `"whoami; hostnamectl`""
