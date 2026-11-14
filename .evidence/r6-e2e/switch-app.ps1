param([ValidateSet('skillup','realtutorialhub','skillhubcore')][string]$Brand)
$ErrorActionPreference = 'Stop'
$taskState = Get-Content -LiteralPath '.local-secrets/r6-e2e-runtime.json' | ConvertFrom-Json
$taskProcesses = @(Get-CimInstance Win32_Process)
function Stop-OwnedChildren([int]$taskParent) {
    foreach ($taskChild in $taskProcesses | Where-Object ParentProcessId -eq $taskParent) {
        Stop-OwnedChildren $taskChild.ProcessId
        Stop-Process -Id $taskChild.ProcessId -ErrorAction SilentlyContinue
    }
}
foreach ($taskEntry in $taskState.processes | Where-Object name -in @('skillup-web','realtutorialhub-web','skillhubcore-admin')) {
    $taskCurrent = $taskProcesses | Where-Object ProcessId -eq $taskEntry.pid | Select-Object -First 1
    if ($taskCurrent -and $taskCurrent.Name -eq 'node.exe' -and $taskCurrent.CommandLine -match '3303|3307|3309') {
        Stop-OwnedChildren $taskCurrent.ProcessId
        Stop-Process -Id $taskCurrent.ProcessId -ErrorAction SilentlyContinue
    }
}
$env:R6_E2E_BRAND = $Brand
@'
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const file='.local-secrets/r6-e2e-runtime.json';const s=JSON.parse(fs.readFileSync(file));
const brand=process.env.R6_E2E_BRAND;const app=brand==='skillup'?'skillup-web':brand==='realtutorialhub'?'realtutorialhub-web':'skillhubcore-admin';
const copy=s.copies.find(x=>x.endsWith('-'+app));
const fd=fs.openSync('.evidence/r6-e2e/'+app+'.log','a');
const child=spawn(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'dev','--webpack','-p',String(s.ports[brand]),'-H','0.0.0.0'],{cwd:copy,env:{...s.runtimeEnv,NEXT_PUBLIC_WEB_APP_URL:s.origins[brand]},windowsHide:true,detached:true,stdio:['ignore',fd,fd]});
child.unref();fs.closeSync(fd);s.processes.push({name:app,pid:child.pid});fs.writeFileSync(file,JSON.stringify(s,null,2));console.log('Switched isolated browser target to '+brand);
'@ | node
Remove-Item Env:R6_E2E_BRAND
