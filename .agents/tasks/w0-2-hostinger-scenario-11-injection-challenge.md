# W0.2-HOSTINGER Scenario 11: Injection Boundary Challenge

**Date**: 2026-11-02  
**Branch**: `remediation/w0-2-hostinger-enforcement`  
**HEAD**: 978b79e8  
**Status**: Injection timing mechanism requires refinement

## Problem Statement

Scenario 11 must inject source drift AFTER the builder completes but BEFORE the deployer's final source check (deploy-smart.ps1 Step 6). Current async injection approach using Start-Job is timing-dependent and unreliable.

## What Works

1. ✓ Scenarios 4, 6, 7 catch-as-success blocks fixed
2. ✓ Prerequisite verification implemented
3. ✓ Child process invocation with exit code capture
4. ✓ Builder completion verification (manifest created)
5. ✓ Exact message assertion: "Working tree is not clean before SHC publication"
6. ✓ Zero upload verification

## Current Approach (Timing-Based)

**Docker Stub** (`scripts/__tests__/test-w0-2-hostinger-production-paths.ps1` lines 190-199):
```powershell
if ($env:TEST_DOCKER_DIRTY_AFTER_SAVE -eq "1") {
    Start-Job -ScriptBlock {
        Start-Sleep -Milliseconds 800
        "drift-after-builder-return" | Out-File -FilePath "$using:PWD\drift-at-final-check.txt" -Encoding ASCII
        "DRIFT_INJECTED" | Out-File -FilePath "$using:env:TEST_ROOT\scenario11-injection-trace.txt" -Encoding ASCII
    } | Out-Null
}
```

**Challenge**: Background job may complete before or after deployer Step 6 runs, making test unreliable.

## Attempted Approaches

### 1. Async Injection via Start-Job
- **Status**: Unreliable
- **Issue**: Race condition between background job and deployer execution
- **Delays tried**: 500ms, 800ms, 2000ms - all inconsistent

### 2. Get-FileHash Function Override
- **Status**: PowerShell scoping prevents this
- **Issue**: Function overrides in parent don't propagate to `& script.ps1` invocations
- **Attempted**: Function definition in heredoc, wrapper scripts

### 3. Get-FileHash Cmdlet Alias
- **Status**: Not pursued (cmdlets can't be aliased to functions easily)

## Sol's Suggested Approach

From review 434b3556:
> One concrete approach is a scoped Get-FileHash function in that child: delegate to the module-qualified real Microsoft.PowerShell.Utility Get-FileHash, then create the drift only when hashing the tar at deployer Step 6 (match the calling script to deploy-smart.ps1, not the builder).

**Key insight**: Deploy-smart.ps1 calls Get-FileHash on tar file at Step 6 (line 507):
```powershell
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $tarFile).Hash.ToLowerInvariant()
```

**Requirements**:
1. Override Get-FileHash in child PowerShell process
2. Detect when caller is deploy-smart.ps1 (not build-save-images.ps1)
3. Detect when target is tar file
4. Inject drift at that specific call
5. Record injection trace

## Technical Challenge

PowerShell function scope in child processes:
- Functions defined in parent don't propagate through `& script.ps1`
- Heredoc command string CAN define functions
- But `& script.ps1` within heredoc uses its own scope

**Question for Sol**: What is the correct PowerShell mechanism to override Get-FileHash for the `& deploy-smart.ps1` invocation within a heredoc command string?

## Test Execution Flow

```
Test harness
  ├─> Child PowerShell process (heredoc)
       ├─> deploy-smart.ps1
            ├─> Step 4.5: enforce-shc-quality-gate.ps1 (creates receipt)
            ├─> Step 5: build-save-images.ps1
            │    ├─> docker compose build
            │    ├─> docker save (Docker stub executes here)
            │    └─> Returns to deploy-smart.ps1
            ├─> [INJECTION NEEDED HERE]
            └─> Step 6: Tar hash check + final source validation
                 └─> Get-FileHash called on tar (line 507)
```

**Target**: Inject drift between Step 5 return and Step 6 execution.

## Current Test Results

**Production Path Suite**: 11 scenarios, 34 assertions
- **31 PASS, 3 FAIL**
- Scenario 4: Error pattern matching (non-critical)
- Scenario 11: Exit code shows success (drift not injected in time)
- Scenario 11: Exact message assertion fails (no rejection occurred)

## Request for Guidance

**Specific questions**:

1. How to reliably override Get-FileHash in the heredoc child process so it affects `& deploy-smart.ps1` invocation?

2. Alternative: Should drift be injected via a different boundary point (e.g., file system watcher, PATH manipulation)?

3. Is there a PowerShell-specific technique for intercepting cmdlet calls in child script invocations?

## Production Code Status

**No changes needed**: The final source cleanliness check in deploy-smart.ps1 (lines 660-695) is implemented correctly and works as demonstrated by manual testing.

**Test harness only**: This is purely a test injection timing/mechanism challenge, not a production code defect.

## Next Steps

Awaiting Sol's guidance on:
- Correct PowerShell scoping mechanism for Get-FileHash override
- Alternative injection boundary if function override not feasible
- Acceptable test harness patterns for this scenario

Once injection mechanism clarified, scenario 11 can be completed in < 30 minutes.

---

**Branch**: `remediation/w0-2-hostinger-enforcement`  
**Latest commit**: 978b79e8  
**Authority**: Sol  
**Implementer**: Claude Sonnet 4.5
