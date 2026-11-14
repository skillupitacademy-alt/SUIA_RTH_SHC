$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path '.').Path
$taskStatePath = Join-Path $taskRoot '.local-secrets/r6-e2e-runtime.json'
$taskState = Get-Content -LiteralPath $taskStatePath | ConvertFrom-Json
$taskProcesses = @(Get-CimInstance Win32_Process)
$taskStopped = @()
function Stop-OwnedDescendants([int]$taskParent) {
    foreach ($taskChild in $taskProcesses | Where-Object ParentProcessId -eq $taskParent) {
        Stop-OwnedDescendants $taskChild.ProcessId
        Stop-Process -Id $taskChild.ProcessId -ErrorAction SilentlyContinue
    }
}
foreach ($taskProcess in $taskState.processes) {
    $taskCurrent = $taskProcesses | Where-Object ProcessId -eq $taskProcess.pid | Select-Object -First 1
    if ($taskCurrent -and $taskCurrent.Name -eq 'node.exe' -and ($taskCurrent.CommandLine -match '3300|3303|3307|3309|r6-e2e/gateway')) {
        Stop-OwnedDescendants $taskCurrent.ProcessId
        Stop-Process -Id $taskCurrent.ProcessId -ErrorAction SilentlyContinue
        $taskStopped += $taskCurrent.ProcessId
    }
}
foreach ($taskCopy in $taskState.copies) {
    $taskAbsolute = [System.IO.Path]::GetFullPath($taskCopy)
    $taskPrefix = Join-Path $taskRoot ('apps\.r6-e2e-' + $taskState.run + '-')
    if (-not $taskAbsolute.StartsWith($taskPrefix, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected disposable app path' }
    $taskLink = Join-Path $taskAbsolute 'node_modules'
    if (Test-Path -LiteralPath $taskLink) {
        $taskItem = Get-Item -LiteralPath $taskLink -Force
        if (($taskItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0) { throw 'Expected dependency junction' }
        [System.IO.Directory]::Delete($taskLink)
    }
    if (Test-Path -LiteralPath $taskAbsolute) { Remove-Item -LiteralPath $taskAbsolute -Recurse -Force }
}
@{ stoppedOwnedRoots = $taskStopped; appCopiesRemoved = $true; originalProcessesTargeted = $false } | ConvertTo-Json | Set-Content -LiteralPath '.evidence/r6-e2e/PROCESS_CLEANUP.json'
