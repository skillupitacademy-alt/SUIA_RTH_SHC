# FND Checkpoint Template (DOC02)

**Version:** 1.1.0  
**Tooling:** `tools/ai-context/context-cli.mjs` v1.1.0 (Argon commit aa33e494)  
**Configuration:** `tools/ai-context/config.json` v1.1.0  
**Command:** `checkpoint-create`, `checkpoint-validate`  
**Status:** IMPLEMENTED_UNVERIFIED (awaiting Gemini VAL01-VAL12 validation and Sol final acceptance)

---

## Purpose

This document defines the v1.1.0 schema for FND checkpoint JSON files, covering distinct `sourceHead`, `toolHead`, and `testHead` git commit provenance, Sol decision extraction, test evidence recording, and fail-closed validation workflow. Checkpoints enable verification that implementation, tooling, tests, and governing architectural decisions are synchronized and internally consistent across multi-month remediation waves.

**Critical Note:** This checkpoint schema is **not a substitute for Sol review**. Checkpoints validate mechanical consistency (commit provenance, test counts, decision extraction), but **cannot validate semantic correctness, security compliance, or architectural fitness**. All FND implementations require Sol independent review with APPROVED verdict before merging to main.

---

## Checkpoint Schema v1.1.0

### File Naming Convention

```
.context-packets/checkpoints/<TASK_ID>-<YYYYMMDD>-checkpoint.json
```

**Examples:**
- `.context-packets/checkpoints/fnd03-20261106-checkpoint.json`
- `.context-packets/checkpoints/fnd11-20261106-checkpoint.json`
- `.context-packets/checkpoints/fnd12-fnd17-20261105-checkpoint.json` (combined task)

### Required Top-Level Fields

```json
{
  "schemaVersion": "1.1.0",
  "taskId": "fnd03",
  "checkpointDate": "2026-11-06T12:34:56.789Z",
  "createdBy": "tools/ai-context/context-cli.mjs v1.1.0",
  "status": "APPROVED",
  "sourceHead": { ... },
  "toolHead": { ... },
  "testHead": { ... },
  "solDecisions": { ... },
  "testEvidence": { ... },
  "validationSignature": "sha256:abcdef123456..."
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaVersion` | string | ✅ | Must be `"1.1.0"` |
| `taskId` | string | ✅ | FND task identifier (e.g., `"fnd03"`, `"fnd11"`, `"fnd12-fnd17"`) |
| `checkpointDate` | string (ISO 8601) | ✅ | UTC timestamp of checkpoint creation |
| `createdBy` | string | ✅ | Tool identifier with version (e.g., `"tools/ai-context/context-cli.mjs v1.1.0"`) |
| `status` | enum | ✅ | One of: `"APPROVED"`, `"IMPLEMENTED_UNVERIFIED"`, `"BLOCKED"`, `"INVALIDATED"` |
| `sourceHead` | object | ✅ | Git provenance for task implementation files |
| `toolHead` | object | ✅ | Git provenance for context optimization tooling |
| `testHead` | object | ✅ | Git provenance for test files and Sol checkpoint runners |
| `solDecisions` | object | ✅ | Extracted Sol decision headings and sections |
| `testEvidence` | object | ✅ | Observed test execution results and Sol checkpoint validation |
| `validationSignature` | string | ✅ | SHA-256 hash of normalized checkpoint JSON for tamper detection |

---

## Distinct HEAD Commit Provenance

### Why Three Separate HEADs?

Foundation remediation spans multiple months with continuous parallel work across implementation, tooling, and validation. Distinct HEAD commits enable:

1. **Implementation isolation:** `sourceHead` tracks production code changes without noise from tooling commits
2. **Tooling versioning:** `toolHead` tracks CLI/config changes independently from application code
3. **Test stability:** `testHead` tracks security test and Sol checkpoint stability separately from implementation churn

**Example Scenario:**
- `sourceHead`: `f5c15fc4` (FND03 documentation update, merged to main)
- `toolHead`: `aa33e494` (Argon v1.1.0 context optimization CLI)
- `testHead`: `ebbd67e7` (Sol checkpoint with updated FND19 decision)

All three may differ during active development, but **must stabilize to the same commit after Sol APPROVED merge to main**.

### `sourceHead` Structure

```json
{
  "sourceHead": {
    "commit": "f5c15fc4abcd1234567890abcdef123456789012",
    "commitShort": "f5c15fc4",
    "commitDate": "2026-11-06T10:23:45Z",
    "branch": "remediation/w1-2-batch-05-targeted",
    "message": "FND03: Update documentation with Sol-approved RBAC patterns",
    "modifiedFiles": [
      "packages/auth/src/rbac/ownership.service.ts",
      "packages/auth/src/rbac/enforcer.ts",
      "packages/auth/src/rbac/rbac.guard.ts"
    ],
    "verificationCommand": "git -C . show f5c15fc4 --stat --no-patch"
  }
}
```

#### How to Populate `sourceHead`

**Manual extraction:**
```powershell
# Get full commit hash
$commit = git -C . rev-parse HEAD

# Get commit metadata
git -C . show $commit --no-patch --format="%H%n%h%n%ci%n%s"

# Get modified files for this task
git -C . diff --name-only $commit~1 $commit | Select-String -Pattern "packages/auth|packages/db"
```

**CLI automation:**
```powershell
node tools/ai-context/context-cli.mjs checkpoint-create --packet fnd03 --commit f5c15fc4
```

### `toolHead` Structure

```json
{
  "toolHead": {
    "commit": "aa33e494abcd1234567890abcdef123456789012",
    "commitShort": "aa33e494",
    "commitDate": "2026-11-05T14:12:33Z",
    "branch": "context-optimization/argon-v1.1.0",
    "message": "Argon: Context optimization CLI v1.1.0 with fail-closed packet generation",
    "modifiedFiles": [
      "tools/ai-context/context-cli.mjs",
      "tools/ai-context/config.json"
    ],
    "cliVersion": "1.1.0",
    "configSchemaVersion": "1.1.0",
    "verificationCommand": "git -C . show aa33e494 tools/ai-context/context-cli.mjs | head -20"
  }
}
```

#### CLI Version Verification

**Extract CLI version from commit:**
```powershell
git show aa33e494:tools/ai-context/context-cli.mjs | Select-String -Pattern "const CLI_VERSION"
```

**Expected output:**
```javascript
const CLI_VERSION = '1.1.0';
```

### `testHead` Structure

```json
{
  "testHead": {
    "commit": "ebbd67e7abcd1234567890abcdef123456789012",
    "commitShort": "ebbd67e7",
    "commitDate": "2026-11-04T16:45:12Z",
    "branch": "remediation/w1-2-batch-05-targeted",
    "message": "Sol: FND19 checkpoint update with tenant isolation verification",
    "modifiedFiles": [
      "audit/Sol_W1_W3_Checkpoint_f88fef44.mjs",
      "packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts"
    ],
    "solCheckpointRunner": "audit/Sol_W1_W3_Checkpoint_f88fef44.mjs",
    "verificationCommand": "node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary --dry-run"
  }
}
```

---

## Sol Decision Extraction

### Purpose

Checkpoints extract governing Sol decision headings (`D1`, `D3`, etc.) directly from the authoritative Sol decision document to:

1. **Prevent drift:** Ensure checkpoint content matches actual Sol decisions, not agent interpretation
2. **Enable traceability:** Link implementation commits to specific Sol architectural guidance
3. **Support invalidation:** Detect when Sol updates decisions that invalidate existing checkpoints

### `solDecisions` Structure

```json
{
  "solDecisions": {
    "sourceDocument": "audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md",
    "sourceCommit": "f88fef44abcd1234567890abcdef123456789012",
    "documentSha256": "abcdef123456789abcdef123456789abcdef123456789abcdef123456789abc",
    "extractedSections": [
      {
        "sectionId": "D1",
        "heading": "## D1. Private profile ownership and explicit tenant provenance",
        "lineRange": [145, 178],
        "excerpt": "Private profiles MUST record creation tenant. Ownership checks MUST NOT fall back to 'realtutorialhub'. All `canAccessResource` callers MUST pass explicit tenant parameter.",
        "appliesTo": ["TC02", "TC03", "TC05", "TC13", "FND03", "FND06", "FND18", "FND24"],
        "blockingRequirements": [
          "Remove brand: auth.brand || 'realtutorialhub' fallback at rbac.adapter.ts:64",
          "Change tenant?: string to tenant: string in enforcer.ts signature",
          "Add tenant: profileTenant parameter to all canAccessResource callers"
        ]
      },
      {
        "sectionId": "D3",
        "heading": "## D3. Tenant persistence, progress, exports and admin context",
        "lineRange": [215, 248],
        "excerpt": "Tutorial progress MUST record tenant_id. Admin admission flow MUST reject cross-tenant email collision with 409. Export files MUST include tenant context.",
        "appliesTo": ["TC06", "TC09", "TC10", "TC11", "TC12", "TC13", "FND11", "GM05", "GM07"],
        "blockingRequirements": [
          "Add tenant_id column to tutorial_progress with NOT NULL constraint",
          "Create composite unique index on (user_id, tenant_id, email) in people table",
          "Add tenant validation in apps/skillup-admin/.../admit/route.ts"
        ]
      }
    ],
    "extractionMethod": "Direct heading anchor extraction with 10-line excerpt window",
    "verificationCommand": "grep -n '^## D[0-9]' audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md"
  }
}
```

#### How to Extract Sol Decisions

**Manual extraction:**
```powershell
# Find all Sol decision headings
git show f88fef44:audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md | Select-String -Pattern "^## D\d+"

# Extract specific decision with context
git show f88fef44:audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md | Select-String -Pattern "D1" -Context 5,10
```

**CLI automation:**
```powershell
node tools/ai-context/context-cli.mjs checkpoint-create --packet fnd03 --extract-decisions
```

**Critical Rule:** Checkpoints **MUST NOT** invent, paraphrase, or augment Sol decision content. Extract verbatim headings and limited excerpt windows only.

---

## Test Evidence Recording

### Purpose

Checkpoints record observed test execution results from:

1. **Sol checkpoint runners:** Independent validation scripts (e.g., `audit/Sol_W1_W3_Checkpoint_f88fef44.mjs`)
2. **Security regression tests:** Negative boundary tests (e.g., `sol-fnd03-tenant-boundary.test.ts`)
3. **Unit/integration tests:** Standard test suites covering implementation files

### `testEvidence` Structure

```json
{
  "testEvidence": {
    "solCheckpointRunner": {
      "command": "node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary",
      "executedAt": "2026-11-06T12:00:00.123Z",
      "exitCode": 0,
      "totalTests": 60,
      "passed": 60,
      "failed": 0,
      "breakdown": {
        "ownershipGuard": { "passed": 27, "failed": 0 },
        "admissionNormalization": { "passed": 25, "failed": 0 },
        "rthWorker": { "passed": 4, "failed": 0 },
        "skillupWorker": { "passed": 4, "failed": 0 }
      },
      "stdoutSummary": "PASS: All 60 boundary isolation tests passed at f5c15fc4",
      "recordedIn": "audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md",
      "observedResult": "Exit 0; six files, 60 passed / 0 failed"
    },
    "securityRegressionTests": {
      "command": "npm run test:security -- --testNamePattern='FND03'",
      "executedAt": "2026-11-06T12:05:00.456Z",
      "exitCode": 0,
      "files": [
        "packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts",
        "packages/auth/src/rbac/__tests__/ownership.service.test.ts",
        "apps/api-server/src/app/api/auth/sessions/__tests__/[sessionId].route.ownership.test.ts"
      ],
      "totalTests": 18,
      "passed": 18,
      "failed": 0,
      "stdoutSummary": "PASS: 18/18 FND03 security regression tests passed"
    },
    "unitTests": {
      "command": "npm run test:unit -- packages/auth/src/rbac",
      "executedAt": "2026-11-06T12:10:00.789Z",
      "exitCode": 0,
      "files": [
        "packages/auth/src/rbac/__tests__/ownership.service.test.ts",
        "packages/auth/src/rbac/__tests__/rbac.service.test.ts",
        "packages/auth/src/rbac/__tests__/rbac.guard.test.ts"
      ],
      "totalTests": 45,
      "passed": 45,
      "failed": 0,
      "coverage": {
        "statements": 92.3,
        "branches": 87.5,
        "functions": 94.1,
        "lines": 91.8
      },
      "stdoutSummary": "PASS: 45/45 RBAC unit tests passed with 92.3% statement coverage"
    }
  }
}
```

#### Test Evidence Collection Workflow

1. **Execute Sol checkpoint runner first:**
   ```powershell
   node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary | Tee-Object -Variable solOutput
   echo $LASTEXITCODE  # Must be 0
   ```

2. **Execute security regression tests:**
   ```powershell
   npm run test:security -- --testNamePattern='FND03' | Tee-Object -Variable securityOutput
   ```

3. **Execute unit tests with coverage:**
   ```powershell
   npm run test:unit -- packages/auth/src/rbac --coverage | Tee-Object -Variable unitOutput
   ```

4. **Record results in checkpoint:**
   ```powershell
   node tools/ai-context/context-cli.mjs checkpoint-create --packet fnd03 \
     --sol-result $solOutput \
     --security-result $securityOutput \
     --unit-result $unitOutput
   ```

**Critical Rule:** Test evidence in checkpoints is **observational only**. Checkpoints record what was observed at a specific commit and timestamp. They do NOT guarantee current test passing status, do NOT replace CI/CD validation, and do NOT substitute for Sol review.

---

## Checkpoint Validation Workflow

### Fail-Closed Validation Rules

The `checkpoint-validate` command applies these fail-closed rules (exit 1 if ANY rule fails):

1. **Schema validation:** `schemaVersion` must be `"1.1.0"`
2. **Commit existence:** All three HEAD commits (`sourceHead.commit`, `toolHead.commit`, `testHead.commit`) must exist in current repository
3. **File integrity:** All files listed in `modifiedFiles` arrays must match recorded SHA-256 hashes at their respective commits
4. **Sol decision integrity:** `solDecisions.sourceDocument` must exist and match `documentSha256` hash
5. **Test evidence freshness:** `testEvidence.executedAt` timestamps must be within 24 hours of checkpoint creation
6. **Status consistency:** If `status` is `"APPROVED"`, all three HEAD commits must be ancestors of current main branch
7. **Validation signature:** Recomputed checkpoint signature must match `validationSignature` field

### Validation Command Usage

```powershell
# Validate a specific checkpoint
node tools/ai-context/context-cli.mjs checkpoint-validate \
  --checkpoint .context-packets/checkpoints/fnd03-20261106-checkpoint.json

# Validate all checkpoints in directory
node tools/ai-context/context-cli.mjs checkpoint-validate \
  --checkpoint-dir .context-packets/checkpoints/
```

### Validation Output Examples

#### PASS (Exit 0)

```
✅ CHECKPOINT VALID: fnd03-20261106-checkpoint.json

Schema version: 1.1.0
Task ID: fnd03
Status: APPROVED

Provenance verification:
  ✅ sourceHead f5c15fc4 exists and is ancestor of main
  ✅ toolHead aa33e494 exists and is ancestor of main
  ✅ testHead ebbd67e7 exists and is ancestor of main

File integrity:
  ✅ All 12 source files match recorded SHA-256 hashes
  ✅ Sol decision document matches sha256:abcdef123456...

Test evidence:
  ✅ Sol checkpoint: 60 passed / 0 failed at 2026-11-06T12:00:00Z
  ✅ Security tests: 18 passed / 0 failed at 2026-11-06T12:05:00Z
  ✅ Unit tests: 45 passed / 0 failed at 2026-11-06T12:10:00Z

Signature verification:
  ✅ Computed sha256:abcdef123456... matches validationSignature

Result: PASS (all validation rules passed)
```

#### FAIL (Exit 1)

```
❌ CHECKPOINT INVALID: fnd03-20261106-checkpoint.json

Schema version: 1.1.0
Task ID: fnd03
Status: APPROVED

Provenance verification:
  ✅ sourceHead f5c15fc4 exists and is ancestor of main
  ❌ toolHead aa33e494 does not exist in current repository
     → Recorded commit may have been from external repository or rebased branch
  ✅ testHead ebbd67e7 exists and is ancestor of main

File integrity:
  ❌ File ownership.service.ts SHA-256 mismatch
     → Recorded: sha256:abc123...
     → Current:  sha256:def456...
     → File has been modified since checkpoint creation

Test evidence:
  ✅ Sol checkpoint: 60 passed / 0 failed at 2026-11-06T12:00:00Z
  ⚠️  Security tests executed 36 hours before checkpoint creation
     → Evidence may be stale, recommend re-running tests

Signature verification:
  ❌ Computed sha256:xyz789... DOES NOT MATCH validationSignature sha256:abcdef123...
     → Checkpoint may have been manually edited or corrupted

Result: FAIL (2 critical failures, 1 warning)
Exit code: 1
```

---

## Checkpoint Invalidation

### When to Invalidate a Checkpoint

A checkpoint becomes **INVALIDATED** when:

1. **Sol updates decisions:** Sol publishes a new version of the governing decision document (e.g., `f88fef44` → `g99gfg55`) that changes blocking requirements
2. **Implementation modified:** Source files recorded in `sourceHead.modifiedFiles` are changed after checkpoint creation
3. **Test failures discovered:** CI/CD detects test failures in files recorded in `testHead.modifiedFiles`
4. **Tooling updated:** CLI version changes from `1.1.0` → `1.2.0` with schema-breaking changes

### Invalidation Workflow

```powershell
# Manual invalidation
node tools/ai-context/context-cli.mjs checkpoint-invalidate \
  --checkpoint .context-packets/checkpoints/fnd03-20261106-checkpoint.json \
  --reason "Sol updated D1 decision in commit g99gfg55 with new tenant isolation requirements"

# Output:
# ✅ Checkpoint invalidated: fnd03-20261106-checkpoint.json
# Status changed: APPROVED → INVALIDATED
# Reason recorded: Sol updated D1 decision in commit g99gfg55...
# Preserved original at: .context-packets/checkpoints/archive/fnd03-20261106-checkpoint-invalidated-20261107.json
```

**Critical Rule:** Invalidated checkpoints are **archived, not deleted**. This preserves historical record of what was implemented and validated at a specific point in time, supporting root cause analysis if regressions occur.

---

## Example: Complete FND03 Checkpoint

```json
{
  "schemaVersion": "1.1.0",
  "taskId": "fnd03",
  "checkpointDate": "2026-11-06T12:34:56.789Z",
  "createdBy": "tools/ai-context/context-cli.mjs v1.1.0",
  "status": "APPROVED",
  "sourceHead": {
    "commit": "f5c15fc4abcd1234567890abcdef123456789012",
    "commitShort": "f5c15fc4",
    "commitDate": "2026-11-06T10:23:45Z",
    "branch": "remediation/w1-2-batch-05-targeted",
    "message": "FND03: Update documentation with Sol-approved RBAC patterns",
    "modifiedFiles": [
      "packages/auth/src/rbac/ownership.service.ts",
      "packages/auth/src/rbac/enforcer.ts",
      "packages/auth/src/rbac/rbac.guard.ts",
      "packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts"
    ],
    "verificationCommand": "git -C . show f5c15fc4 --stat --no-patch"
  },
  "toolHead": {
    "commit": "aa33e494abcd1234567890abcdef123456789012",
    "commitShort": "aa33e494",
    "commitDate": "2026-11-05T14:12:33Z",
    "branch": "context-optimization/argon-v1.1.0",
    "message": "Argon: Context optimization CLI v1.1.0 with fail-closed packet generation",
    "modifiedFiles": [
      "tools/ai-context/context-cli.mjs",
      "tools/ai-context/config.json"
    ],
    "cliVersion": "1.1.0",
    "configSchemaVersion": "1.1.0",
    "verificationCommand": "git -C . show aa33e494 tools/ai-context/context-cli.mjs | head -20"
  },
  "testHead": {
    "commit": "ebbd67e7abcd1234567890abcdef123456789012",
    "commitShort": "ebbd67e7",
    "commitDate": "2026-11-04T16:45:12Z",
    "branch": "remediation/w1-2-batch-05-targeted",
    "message": "Sol: FND19 checkpoint update with tenant isolation verification",
    "modifiedFiles": [
      "audit/Sol_W1_W3_Checkpoint_f88fef44.mjs",
      "packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts"
    ],
    "solCheckpointRunner": "audit/Sol_W1_W3_Checkpoint_f88fef44.mjs",
    "verificationCommand": "node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary --dry-run"
  },
  "solDecisions": {
    "sourceDocument": "audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md",
    "sourceCommit": "f88fef44abcd1234567890abcdef123456789012",
    "documentSha256": "abcdef123456789abcdef123456789abcdef123456789abcdef123456789abc",
    "extractedSections": [
      {
        "sectionId": "D1",
        "heading": "## D1. Private profile ownership and explicit tenant provenance",
        "lineRange": [145, 178],
        "excerpt": "Private profiles MUST record creation tenant. Ownership checks MUST NOT fall back to 'realtutorialhub'.",
        "appliesTo": ["TC02", "TC03", "TC05", "FND03", "FND06"],
        "blockingRequirements": [
          "Remove brand: auth.brand || 'realtutorialhub' fallback",
          "Change tenant?: string to tenant: string"
        ]
      }
    ],
    "extractionMethod": "Direct heading anchor extraction",
    "verificationCommand": "grep -n '^## D1' audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md"
  },
  "testEvidence": {
    "solCheckpointRunner": {
      "command": "node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary",
      "executedAt": "2026-11-06T12:00:00.123Z",
      "exitCode": 0,
      "totalTests": 60,
      "passed": 60,
      "failed": 0,
      "stdoutSummary": "PASS: All 60 boundary isolation tests passed"
    },
    "securityRegressionTests": {
      "command": "npm run test:security -- --testNamePattern='FND03'",
      "exitCode": 0,
      "totalTests": 18,
      "passed": 18,
      "failed": 0
    }
  },
  "validationSignature": "sha256:abcdef123456789abcdef123456789abcdef123456789abcdef123456789abc"
}
```

---

## CLI Commands Summary

### Create Checkpoint

```powershell
node tools/ai-context/context-cli.mjs checkpoint-create \
  --packet fnd03 \
  --source-commit f5c15fc4 \
  --tool-commit aa33e494 \
  --test-commit ebbd67e7 \
  --status APPROVED \
  --extract-decisions \
  --run-tests

# Output:
# ✅ Checkpoint created: .context-packets/checkpoints/fnd03-20261106-checkpoint.json
# Schema version: 1.1.0
# Status: APPROVED
# Source HEAD: f5c15fc4 (4 files)
# Tool HEAD: aa33e494 (CLI v1.1.0)
# Test HEAD: ebbd67e7 (Sol checkpoint runner)
# Sol decisions: 2 sections extracted from D1, D3
# Test evidence: 60 Sol checkpoint + 18 security + 45 unit tests (all passed)
# Validation signature: sha256:abcdef123456...
```

### Validate Checkpoint

```powershell
node tools/ai-context/context-cli.mjs checkpoint-validate \
  --checkpoint .context-packets/checkpoints/fnd03-20261106-checkpoint.json

# Exit 0 if valid, exit 1 if invalid (see examples above)
```

### Invalidate Checkpoint

```powershell
node tools/ai-context/context-cli.mjs checkpoint-invalidate \
  --checkpoint .context-packets/checkpoints/fnd03-20261106-checkpoint.json \
  --reason "Sol updated D1 decision with breaking changes"

# Output:
# ✅ Checkpoint invalidated and archived
# Reason: Sol updated D1 decision with breaking changes
```

---

## Integration with Workflow Agents

### When to Create Checkpoints

Checkpoints should be created at these workflow milestones:

1. **After Sol APPROVED verdict:** Immediately after Sol review workflow completes with APPROVED status
2. **Before merge to main:** As final verification before `git merge --ff-only` from feature branch
3. **After CI/CD pass:** Once all automated tests pass in CI environment
4. **Before wave transition:** When completing a remediation wave (e.g., W1-W3 → W4-W6)

### Checkpoint Creation in Workflow Brief

When launching a workflow that should create a checkpoint on success, include this in the brief:

```markdown
## Checkpoint Requirements

On APPROVED verdict:
- Create checkpoint using `node tools/ai-context/context-cli.mjs checkpoint-create --packet <task_id>`
- Record current HEAD as `sourceHead`
- Record aa33e494 as `toolHead` (Argon v1.1.0)
- Record Sol checkpoint runner commit as `testHead`
- Extract Sol decisions from audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md
- Execute Sol checkpoint runner and record evidence
- Commit checkpoint JSON to .context-packets/checkpoints/<task_id>-<date>-checkpoint.json
```

### Checkpoint Validation in Workflow Brief

When launching a workflow that depends on a previous checkpoint, include this in the brief:

```markdown
## Checkpoint Dependencies

Before starting implementation:
- Validate FND03 checkpoint: `node tools/ai-context/context-cli.mjs checkpoint-validate --checkpoint .context-packets/checkpoints/fnd03-20261106-checkpoint.json`
- If validation fails (exit 1), STOP and report invalidation reason
- Do NOT proceed with FND11 implementation if FND03 checkpoint is invalid
```

---

## Limitations

### What Checkpoints Do NOT Validate

1. **Semantic correctness:** Checkpoints cannot verify that implementation correctly implements Sol decisions - only that decisions were extracted and tests passed
2. **Security compliance:** Checkpoints record test evidence but cannot guarantee absence of vulnerabilities
3. **Architectural fitness:** Checkpoints cannot validate whether implementation follows project conventions or integrates properly with existing systems
4. **Future compatibility:** Checkpoints are point-in-time snapshots and do not predict compatibility with future changes

### When Sol Review is Still Required

**Always.** Checkpoints are a mechanical consistency tool, not a substitute for expert review. All FND implementations require:

1. Sol independent security review
2. APPROVED verdict explicitly granted by Sol
3. Architectural fitness verification by Sol
4. Integration testing in staging environment
5. Manual verification of critical paths

---

## References

- **Operating Guide:** `docs/ai-context/operating-guide.md` (DOC01)
- **Task Retrieval Guide:** `docs/ai-context/task-retrieval-guide.md` (DOC03)
- **CLI Implementation:** `tools/ai-context/context-cli.mjs` v1.1.0 (commit aa33e494)
- **Config Schema:** `tools/ai-context/config.json` v1.1.0
- **Sol Decisions:** `audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md`
- **Argon Handoff:** `audit/Argon_Context_Optimization_Handoff.md`

---

**Version History:**
- v1.1.0 (2026-11-06): Initial checkpoint template with distinct HEAD commit provenance, Sol decision extraction, and fail-closed validation
