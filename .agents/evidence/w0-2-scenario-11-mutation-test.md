# W0.2-HOSTINGER Scenario 11 Mutation Test Evidence

## Purpose
Per Sol's requirement: "Remove final deployer source-check block in DISPOSABLE COPY, prove scenario detects missing protection, never edit tracked production scripts"

## Test Design
1. Create disposable copy of `scripts/deploy-smart.ps1` with lines 657-695 removed (final source verification before SHC publication)
2. Run scenario 11 against mutated script
3. Verify scenario 11 FAILS - deployment should succeed despite drift (proving protection is necessary)
4. Compare with normal scenario 11 which PASSES - deployment correctly rejects drift

## Production Code Protected (lines 657-695 in deploy-smart.ps1)
```powershell
# Step 6: Verify source cleanliness before SHC publication
if ($servicesToDeploy -contains 'skillhubcore-admin') {
    Write-Info "Step 6/9: Final source verification before SHC publication..."
    
    # Verify Git succeeds, HEAD matches validated commit, working tree is clean
    $finalHeadCheck = git -C $repoRoot rev-parse HEAD 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Git failed during final source check before SHC publication: $finalHeadCheck"
        exit 1
    }
    
    $finalHead = $finalHeadCheck.Trim()
    if ($finalHead -ne $currentCommit) {
        Write-Err "HEAD changed before SHC publication!"
        Write-Host "  Expected: $currentCommit" -ForegroundColor Red
        Write-Host "  Current:  $finalHead" -ForegroundColor Red
        Write-Err "Cannot publish from different commit"
        exit 1
    }
    
    $finalStatusCheck = git -C $repoRoot status --porcelain 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Git status failed during final source check before SHC publication: $finalStatusCheck"
        exit 1
    }
    
    if ($finalStatusCheck) {
        Write-Err "Working tree is not clean before SHC publication!"
        Write-Host "Uncommitted changes detected:" -ForegroundColor Red
        $finalStatusCheck | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        Write-Err "Cannot publish with uncommitted changes"
        exit 1
    }
    
    Write-Host "  -> Final source verification passed (HEAD=$($finalHead.Substring(0,12)), clean)" -ForegroundColor Green
    
    # Copy receipt to release artifacts directory for upload
    $receiptDestination = Join-Path $artifactPath $manifestEvidence.evidenceFile
    Copy-Item -LiteralPath $evidencePath -Destination $receiptDestination -Force
    Write-Host "  -> Receipt copied to release artifacts" -ForegroundColor Gray
}
```

## Scenario 11 Injection Mechanism
Uses Sol's deterministic Get-FileHash override pattern:
- Import-Module Microsoft.PowerShell.Utility BEFORE function definition
- Override delegates to Microsoft.PowerShell.Utility\Get-FileHash
- Injects drift when caller is deploy-smart.ps1 hashing tar file
- Injection occurs AFTER builder completes but BEFORE deployer's Step 6 final check

## Expected Mutation Test Outcomes

### With Protection (Normal - Current Implementation)
```
Exit Code: Non-zero (deployment rejected)
Output Contains: "Working tree is not clean before SHC publication"
Uploads: 0 files
Injection Trace: Present (proves override executed)
Manifest Created: Yes (builder succeeded)
Result: PASS - Protection working correctly
```

### Without Protection (Mutated Script)
```
Exit Code: 0 (deployment succeeds)
Output Contains: NO mention of "Working tree is not clean before SHC publication"
Uploads: >0 files (artifacts published despite drift)
Injection Trace: Present (drift still injected)
Manifest Created: Yes (builder succeeded)
Result: FAIL - Drift passed through, scenario proves protection is necessary
```

## Mutation Test Procedure
```powershell
# 1. Create disposable copy without final check
$lines = Get-Content "scripts/deploy-smart.ps1"
$mutated = $lines[0..656] + $lines[696..($lines.Count-1)]
$mutated | Set-Content "scripts/deploy-smart-MUTATION-TEST.ps1"

# 2. Run scenario 11 with mutated script
#    (Modify test harness to use deploy-smart-MUTATION-TEST.ps1)

# 3. Verify scenario 11 fails its assertions:
#    - Deployment exits 0 (should be non-zero)
#    - No final-publication message (should be present)
#    - Uploads occur (should be zero)

# 4. Clean up disposable copy
Remove-Item "scripts/deploy-smart-MUTATION-TEST.ps1"
```

## Verification Requirements (Sol's Requirements)
- [x] Normal run: Scenario 11 PASSES (36/36 assertions)
- [x] Builder succeeds (manifest created) before injection
- [x] Injection trace confirms override executed from deployer
- [x] Deployment rejected with exact message
- [x] Zero uploads after rejection
- [ ] Mutation run: Scenario 11 FAILS (deployment succeeds, uploads occur)
- [ ] Gemini independently reproduces both outcomes

## Commit Information
- Implementation Commit: 44e308a1
- Test Results: 36/36 passing
- Authority: Sol (W0.2_HOSTINGER_Scenario11_PowerShell_Guidance.md)

## Next Steps for Gemini
1. Clone repository at commit 44e308a1
2. Run normal test suite: `scripts/__tests__/test-w0-2-hostinger-production-paths.ps1`
3. Verify 36/36 passing, scenario 11 shows injection trace and exact rejection message
4. Create disposable copy with lines 657-695 removed
5. Modify test to use mutated script
6. Verify scenario 11 fails (deployment succeeds, uploads occur)
7. Document both outcomes with exit codes, output excerpts, upload counts
