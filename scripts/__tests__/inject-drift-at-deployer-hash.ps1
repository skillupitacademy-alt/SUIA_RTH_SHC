# Wrapper script for scenario 11: inject drift at deployer's tar hash check
# Uses module pre-import to prevent auto-loading from replacing override
param(
    [Parameter(Mandatory)]
    [string]$DeployScript,
    
    [Parameter(Mandatory)]
    [string]$FixtureRepo,
    
    [Parameter(Mandatory)]
    [string]$TracePath
)

# Import Microsoft.PowerShell.Utility BEFORE defining override
# This prevents module auto-loading from replacing our function
Import-Module Microsoft.PowerShell.Utility -ErrorAction Stop

# Set global tracking variables
$global:ShcDriftRepo = $FixtureRepo
$global:ShcDriftTrace = $TracePath
$global:ShcExpectedDeployer = [IO.Path]::GetFullPath($DeployScript)
$global:ShcDriftInjected = $false

# Define Get-FileHash override that delegates to module-qualified cmdlet
function global:Get-FileHash {
    [CmdletBinding()]
    param(
        [string[]]$LiteralPath,
        [string]$Algorithm = 'SHA256'
    )
    
    # Always call the real cmdlet first
    $hash = Microsoft.PowerShell.Utility\Get-FileHash @PSBoundParameters
    
    # Check if caller is the deployer hashing a tar file
    $caller = (Get-PSCallStack)[1].ScriptName
    if ($caller -and 
        [IO.Path]::GetFullPath($caller) -eq $global:ShcExpectedDeployer -and
        $LiteralPath.Count -eq 1 -and 
        $LiteralPath[0] -like '*.tar' -and 
        -not $global:ShcDriftInjected) {
        
        # Inject drift at deployer boundary
        $driftFile = Join-Path $global:ShcDriftRepo 'drift-at-final-check.txt'
        Set-Content -LiteralPath $driftFile -Value 'test drift injected at deployer tar hash'
        
        # Record injection trace
        Set-Content -LiteralPath $global:ShcDriftTrace -Value $caller
        
        $global:ShcDriftInjected = $true
    }
    
    return $hash
}

# Now execute the deployment script with override in place
$env:NON_INTERACTIVE = '1'
try {
    & $DeployScript -Services 'skillhubcore-admin' -NonInteractive
    exit $LASTEXITCODE
} catch {
    Write-Error $_
    exit 1
}
