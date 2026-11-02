# W0.2-HOSTINGER Scenario 11 - Handoff to Gemini for Independent Verification

## Status
✅ Implementation complete
✅ All tests passing (36/36 assertions)
⏳ Awaiting Gemini independent verification

## Context
Scenario 11 tests that deploy-smart.ps1 detects source drift that occurs AFTER builder completes but BEFORE deployer's final publication check. This is the last remaining boundary to test per Sol's systematic coverage requirements.

## Challenge Solved
Previous async injection attempts were unreliable due to race conditions. Sol provided deterministic solution using PowerShell module pre-import pattern to override Get-FileHash at exact deployer tar hash boundary.

## Implementation Details

### Files Modified/Created
1. `scripts/__tests__/inject-drift-at-deployer-hash.ps1` - Wrapper script implementing Sol's pattern
2. `scripts/__tests__/test-w0-2-hostinger-production-paths.ps1` - Scenario 11 updated to use wrapper
3. `.agents/evidence/w0-2-scenario-11-mutation-test.md` - Mutation test specification

### Key Pattern (Sol's Solution)
```powershell
# Import module BEFORE defining override
Import-Module Microsoft.PowerShell.Utility -ErrorAction Stop

# Override delegates to module-qualified cmdlet
function global:Get-FileHash {
    [CmdletBinding()]
    param([string[]]$LiteralPath, [string]$Algorithm = 'SHA256')
    
    $hash = Microsoft.PowerShell.Utility\Get-FileHash @PSBoundParameters
    
    # Inject drift only when caller is deployer hashing tar
    $caller = (Get-PSCallStack)[1].ScriptName
    if ($caller -and [IO.Path]::GetFullPath($caller) -eq $global:ShcExpectedDeployer -and
        $LiteralPath[0] -like '*.tar' -and -not $global:ShcDriftInjected) {
        # Inject drift here
        $global:ShcDriftInjected = $true
    }
    
    return $hash
}
```

## Verification Tasks for Gemini

### Task 1: Normal Run (Should Pass)
```powershell
# Clone and checkout
git clone <repo-url>
cd quiz-platform
git checkout 44e308a1

# Run test suite
scripts/__tests__/test-w0-2-hostinger-production-paths.ps1
```

**Expected Outcome:**
- Exit code: 0
- Test results: 36/36 passing
- Scenario 11 output should show:
  - `[TRACE] Drift injected from: ...\deploy-smart.ps1`
  - `[PASS] Builder completed successfully (manifest created)`
  - `[PASS] Publication rejected dirty source before upload (exit ≠ 0)`
  - `[PASS] Error contains exact final-publication message`
  - `[PASS] Zero uploads after dirty source before publication`

**Verification Checklist:**
- [ ] All 36 assertions passed
- [ ] Scenario 11 shows injection trace from deploy-smart.ps1
- [ ] Exit code was non-zero for scenario 11 deployment
- [ ] Output contains: "Working tree is not clean before SHC publication"
- [ ] Upload count is 0

### Task 2: Mutation Run (Should Fail Scenario 11)
```powershell
# Create disposable copy without final source check
$lines = Get-Content "scripts/deploy-smart.ps1"
$mutated = $lines[0..656] + $lines[696..($lines.Count-1)]
$mutated | Set-Content "scripts/deploy-smart-MUTATION-TEST.ps1"

# Modify test harness to use mutated script
$testContent = Get-Content "scripts/__tests__/test-w0-2-hostinger-production-paths.ps1" -Raw
$testContent = $testContent -replace 'Join-Path -ChildPath "deploy-smart\.ps1"', 'Join-Path -ChildPath "deploy-smart-MUTATION-TEST.ps1"'
Set-Content "scripts/__tests__/test-w0-2-hostinger-production-paths-MUTATION.ps1" $testContent

# Copy mutated script into test initialization
$testContent = Get-Content "scripts/__tests__/test-w0-2-hostinger-production-paths-MUTATION.ps1" -Raw
$testContent = $testContent -replace 'Copy-Item -Path \(Join-Path \$ScriptsDir "deploy-smart\.ps1"\)', 'Copy-Item -Path (Join-Path $ScriptsDir "deploy-smart-MUTATION-TEST.ps1") -Destination "scripts\deploy-smart.ps1"'
Set-Content "scripts/__tests__/test-w0-2-hostinger-production-paths-MUTATION.ps1" $testContent

# Run mutation test
scripts/__tests__/test-w0-2-hostinger-production-paths-MUTATION.ps1
```

**Expected Outcome:**
- Scenario 11 should FAIL its assertions because:
  - Deployment exits 0 (success) instead of non-zero
  - No "Working tree is not clean before SHC publication" message
  - Uploads occur (upload count > 0)
  - Injection trace still present (drift was injected but not caught)

**Verification Checklist:**
- [ ] Scenario 11 failed at least one assertion
- [ ] Deployment exit code was 0 (unexpected success)
- [ ] No final-publication error message in output
- [ ] Upload count > 0 (artifacts published despite drift)
- [ ] Injection trace present (proves drift was injected but not caught)

**Mutation Result Proves:**
The final source check (lines 657-695 in deploy-smart.ps1) is NECESSARY. Without it, drift injected after builder completion passes through to production.

### Task 3: Cleanup and Document
```powershell
# Remove mutation test artifacts
Remove-Item "scripts/deploy-smart-MUTATION-TEST.ps1" -ErrorAction SilentlyContinue
Remove-Item "scripts/__tests__/test-w0-2-hostinger-production-paths-MUTATION.ps1" -ErrorAction SilentlyContinue

# Verify normal tests still pass
scripts/__tests__/test-w0-2-hostinger-production-paths.ps1
```

## Evidence to Capture

For both normal and mutation runs:
1. Complete test output (especially scenario 11 section)
2. Exit codes
3. Injection trace presence/absence
4. Final error message presence/absence
5. Upload counts
6. Assertion results

## Authority Chain
- Original requirement: Sol (W0.2-HOSTINGER ticket)
- Scenario 11 guidance: Sol (W0.2_HOSTINGER_Scenario11_PowerShell_Guidance.md)
- Implementation: Claude Sonnet 4.5
- Independent verification: Gemini (this task)

## Success Criteria
- [x] Normal run: 36/36 passing, scenario 11 shows deterministic injection and correct rejection
- [ ] Mutation run: Scenario 11 fails as expected, proving protection is necessary
- [ ] Gemini documents both outcomes with evidence
- [ ] Ready for Sol's final review

## Files for Reference
- Production code: `scripts/deploy-smart.ps1` (lines 657-695 are protected)
- Test harness: `scripts/__tests__/test-w0-2-hostinger-production-paths.ps1`
- Injection wrapper: `scripts/__tests__/inject-drift-at-deployer-hash.ps1`
- Sol's guidance: `audit/W0.2_HOSTINGER_Scenario11_PowerShell_Guidance.md`
- Mutation spec: `.agents/evidence/w0-2-scenario-11-mutation-test.md`

## Commit SHA
**44e308a1** - "W0.2-HOSTINGER: Implement Sol's deterministic Get-FileHash override for scenario 11"

## Next Action
Gemini: Run both verification tasks and document outcomes.
