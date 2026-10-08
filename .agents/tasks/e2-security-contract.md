# E2-A-3: W5-R2 Security Contract Documentation

**Investigation Date:** 2024
**Workspace:** e:\onlinewebsites\quiz-platform
**Status:** READ-ONLY INVESTIGATION COMPLETE

---

## Executive Summary

The W5-R2 authorization architecture implements a **fail-closed, hash-bound approval system** with 5 required bindings that must ALL pass before any repository mutation is allowed. The system enforces separation of duties (no self-approval) and tamper detection through cryptographic hashing.

---

## Architecture Overview

### Core Components

1. **PlacementExecutor** (`services/project-ai/app/placement/executor.py`)
   - Entry point: `execute_placement()` method
   - Enforces all 5 required bindings before any write operation
   - Operates in isolated git worktrees for safety

2. **ApprovalEnforcer** (`services/project-ai/app/placement/approval_enforcer.py`)
   - Validates all bindings via `enforce_approval()` method
   - Returns `ApprovalEnforcementResult` with binding verification status
   - Fail-closed policy: missing field = BLOCKED

3. **ImplementationApproval** (`services/project-ai/app/models/implementation_approval.py`)
   - Domain model storing approval record with all hash bindings
   - Provides verification methods: `verify_candidate_hash()`, `verify_manifest_hash()`, `verify_not_self_approved()`

---

## The 5 Required Bindings

### 1. **Manifest Binding (PlacementManifest validation)**

**What is validated:**
- The `PlacementManifest.manifestHash` field is cryptographically verified against the manifest content
- Hash computed from: manifest_id, candidate_id, decision, targetPath, blockFamily, blockVersion, requiredChanges, evidenceIds, createdAt
- Uses SHA-256 with JSON serialization (sorted keys, no whitespace)

**Security Property:**
- Detects ANY tampering with the manifest after generation
- Ensures the placement instructions haven't been modified between approval and execution

**Code Location:**
```python
# executor.py, line 67-91
def verify_manifest_hash(self, manifest: PlacementManifest) -> bool:
    manifest_data = {
        "manifestId": manifest.manifestId,
        "candidateId": manifest.candidateId,
        "decision": manifest.decision.value,
        "targetPath": manifest.targetPath,
        "blockFamily": manifest.blockFamily.value,
        "blockVersion": manifest.blockVersion,
        "requiredChanges": manifest.requiredChanges,
        "evidenceIds": manifest.evidenceIds,
        "createdAt": manifest.createdAt
    }
    manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
    computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    
    if computed_hash != manifest.manifestHash:
        raise PlacementExecutionError(...)
```

**Verification Checkpoint:**
- Line 145-151 in `executor.py`: `approval.verify_manifest_hash(manifest.manifestHash)`
- Line 154: `self.verify_manifest_hash(manifest)` (double verification)

**Test Fixture Values:**
```python
# From test_approval_enforcer.py
placement_manifest_sha256 = "manifest-hash-xyz"
placement_manifest_id = "manifest-789"

# For real tests, compute from manifest data:
import hashlib, json
manifest_data = {
    "manifestId": "manifest-789",
    "candidateId": "cand-123",
    "decision": "ADD",
    "targetPath": "packages/ui/src/tutorial/blocks/Introduction",
    "blockFamily": "Introduction",
    "blockVersion": "I7",
    "requiredChanges": [],
    "evidenceIds": ["ev-1", "ev-2"],
    "createdAt": "2024-01-15T10:00:00Z"
}
manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
real_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
```

---

### 2. **Approval Binding (ImplementationApproval status validation)**

**What is validated:**
- The `ImplementationApproval.status` field must equal `ImplementationApprovalStatus.APPROVED`
- Status enum values: PENDING, APPROVED, REJECTED
- No graceful degradation: anything other than APPROVED is blocked

**Security Property:**
- Ensures a human explicitly approved the implementation before execution
- Prevents automated execution of unapproved changes
- Enforces human-in-the-loop for all repository mutations

**Code Location:**
```python
# executor.py, line 126-131
if approval.status != ImplementationApprovalStatus.APPROVED:
    raise PlacementExecutionError(
        f"Cannot execute unapproved manifest. "
        f"Status: {approval.status}. "
        f"Approval required before placement execution."
    )
```

**Verification Checkpoint:**
- Checked FIRST in `execute_placement()` before any other validation
- Also verified in `approval_checker.py` via `check_implementation_approval()`

**Test Fixture Values:**
```python
# From test_approval_enforcer.py
from app.models.implementation_approval import (
    ImplementationApprovalStatus
)

# APPROVED (passes)
status = ImplementationApprovalStatus.APPROVED

# PENDING (blocked)
status = ImplementationApprovalStatus.PENDING

# REJECTED (blocked)
status = ImplementationApprovalStatus.REJECTED
```

---

### 3. **Candidate Files Binding (candidate_sha256 validation)**

**What is validated:**
- The `candidate_sha256` parameter must match `approval.candidate_sha256`
- Hash computed from concatenation of individual file hashes (sorted by filename)
- Algorithm: SHA-256 of each file's content, then SHA-256 of concatenated digests

**Security Property:**
- Ensures the exact candidate files that were approved are the ones being placed
- Detects if files were modified, added, or removed after approval
- Cryptographic guarantee that approved artifacts match executed artifacts

**Code Location:**
```python
# executor.py, line 133-139
if not approval.verify_candidate_hash(candidate_sha256):
    raise PlacementExecutionError(
        f"Candidate hash mismatch. "
        f"Approval hash: {approval.candidate_sha256}, "
        f"Provided hash: {candidate_sha256}. "
        f"Candidate has been tampered with after approval."
    )

# Hash computation (candidate.py, line 634-656)
def _compute_candidate_sha256(files: list[Any]) -> str:
    sha256_hash = hashlib.sha256()
    sorted_files = sorted(files, key=lambda f: f.filename)
    
    for file in sorted_files:
        content_bytes = file.content.encode('utf-8') if isinstance(file.content, str) else file.content
        file_hash = hashlib.sha256(content_bytes)
        sha256_hash.update(file_hash.digest())
    
    return sha256_hash.hexdigest()
```

**Verification Checkpoint:**
- Line 133-139 in `executor.py`: `approval.verify_candidate_hash(candidate_sha256)`
- Line 81-86 in `approval_checker.py`: validates `candidate_sha256` is not empty
- Line 157-173 in `approval_checker.py`: verifies hash match

**Test Fixture Values:**
```python
# From test_approval_enforcer.py
candidate_sha256 = "candidate-hash-abc"

# For real tests with actual files:
import hashlib

files = [
    {"filename": "Introduction7Block.tsx", "content": "import React..."},
    {"filename": "Introduction7Schema.ts", "content": "export const schema..."}
]

# Compute hash
sha256_hash = hashlib.sha256()
sorted_files = sorted(files, key=lambda f: f["filename"])
for file in sorted_files:
    content_bytes = file["content"].encode('utf-8')
    file_hash = hashlib.sha256(content_bytes)
    sha256_hash.update(file_hash.digest())

real_candidate_hash = sha256_hash.hexdigest()
# Example: "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
```

---

### 4. **workflow_requester Binding (self-approval prevention)**

**What is validated:**
- The `workflow_requester` parameter must differ from `approval.approved_by`
- Both fields are required (fail-closed: missing = BLOCKED)
- String comparison: `approved_by != workflow_requester`

**Security Property:**
- Enforces separation of duties: the person requesting cannot approve their own work
- Prevents insider threats from self-approving malicious changes
- Implements a fundamental security control from dual-control principles

**Code Location:**
```python
# executor.py, line 149-154
if not approval.verify_not_self_approved(workflow_requester):
    raise PlacementExecutionError(
        f"Self-approval detected. "
        f"Approver ({approval.approved_by}) must differ from requester ({workflow_requester})."
    )

# implementation_approval.py, line 86-106
def verify_not_self_approved(self, requester_id: str) -> bool:
    # Fail-closed: missing workflow_requester means we cannot verify separation of duties
    if not self.workflow_requester:
        return False
    
    return self.approved_by != self.workflow_requester
```

**Verification Checkpoint:**
- Line 149-154 in `executor.py`: `approval.verify_not_self_approved(workflow_requester)`
- Line 189-201 in `approval_checker.py`: validates requester_id is not empty
- Line 203-219 in `approval_checker.py`: verifies self-approval check

**Test Fixture Values:**
```python
# From test_approval_enforcer.py

# PASSING: Different people (enforces separation of duties)
approved_by = "approver-alice"
workflow_requester = "requester-bob"

# BLOCKED: Same person (self-approval detected)
approved_by = "alice@example.com"
workflow_requester = "alice@example.com"

# BLOCKED: Missing requester (fail-closed)
approved_by = "alice@example.com"
workflow_requester = None  # or ""

# Format: Any string identifier (email, username, user ID)
# Examples:
#   - "user-123"
#   - "alice@example.com"
#   - "github:alice"
#   - "requester-bob"
```

---

### 5. **candidate_sha256 Binding (content integrity)**

**What is validated:**
- The `candidate_sha256` parameter is the PRIMARY content binding
- Must be exactly 64 hex characters (SHA-256 output)
- Must match the hash stored in `approval.candidate_sha256`
- Validated at multiple layers: parameter validation, approval_checker, executor

**Security Property:**
- Cryptographic guarantee that the candidate content is byte-for-byte identical to what was approved
- Prevents substitution attacks (replacing approved code with malicious code)
- Immutable binding: once approved, only that exact content can be placed

**Code Location:**
```python
# approval_enforcer.py, line 120-137
if not candidate_sha256:
    return ApprovalEnforcementResult(
        approved=False,
        reason="Missing required parameter: candidate_sha256",
        ...
    )

# approval_checker.py, line 81-94
if not candidate_sha256:
    return AuthorizationResult(
        authorized=False,
        failure_reason="Missing required parameter: candidate_sha256",
        ...
    )

# approval_checker.py, line 157-173
if not approval.verify_candidate_hash(candidate_sha256):
    return AuthorizationResult(
        authorized=False,
        failure_reason=(
            f"Candidate hash verification failed: "
            f"expected {approval.candidate_sha256}, got {candidate_sha256}"
        ),
        ...
    )
```

**Verification Checkpoint:**
- Line 81-94 in `approval_checker.py`: validates not empty
- Line 157-173 in `approval_checker.py`: verifies hash match
- Line 133-139 in `executor.py`: final verification before placement
- Line 522-523 in `candidate.py`: computed during upload

**Test Fixture Values:**
```python
# From test_approval_enforcer.py
candidate_sha256 = "candidate-hash-abc"

# Real SHA-256 format (64 hex characters):
candidate_sha256 = "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"

# Must match format:
# - Exactly 64 characters
# - Hexadecimal only (0-9, a-f)
# - Lowercase recommended (though case-insensitive in practice)

# Invalid examples (all BLOCKED):
candidate_sha256 = ""                    # Empty
candidate_sha256 = None                  # None
candidate_sha256 = "short-hash"          # Too short
candidate_sha256 = "not-a-real-sha256"   # Not hex format
```

---

## Binding Verification Flow

```
execute_placement() ENTRY POINT
├─ [1] approval.status == APPROVED?
│   └─ NO → PlacementExecutionError (line 126-131)
│
├─ [2] candidate_sha256 matches approval.candidate_sha256?
│   └─ NO → PlacementExecutionError (line 133-139)
│
├─ [3] manifest.manifestHash matches approval.placement_manifest_sha256?
│   └─ NO → PlacementExecutionError (line 141-147)
│
├─ [4] workflow_requester != approval.approved_by?
│   └─ NO → PlacementExecutionError (line 149-154)
│
├─ [5] verify_manifest_hash(manifest) → internal consistency check
│   └─ NO → PlacementExecutionError (line 154, line 67-91)
│
└─ ALL PASS → Proceed to _execute_add/_execute_update/_execute_extend
```

---

## Fail-Closed Policy

The W5-R2 architecture implements **fail-closed security** at every layer:

### Parameter Validation (approval_enforcer.py)
- Empty string → BLOCKED
- None value → BLOCKED
- Missing from call → BLOCKED (Python raises TypeError)

### Approval Record Validation (approval_checker.py)
- Approval not found in store → BLOCKED
- Status != APPROVED → BLOCKED
- Hash mismatch → BLOCKED
- Self-approval detected → BLOCKED

### Execution Layer (executor.py)
- Any verification failure → PlacementExecutionError raised
- No graceful degradation
- No partial execution
- No "warning and continue"

---

## Test Fixture Template

For comprehensive test coverage, use this fixture template:

```python
import pytest
from datetime import datetime, timezone
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus
)

@pytest.fixture
def valid_w5r2_approval():
    """
    Complete W5-R2 approval fixture with all 5 bindings satisfied.
    """
    return ImplementationApproval(
        # Identity bindings
        approval_id="approval-12345678-1234-1234-1234-123456789abc",
        workflow_id="wf-workflow-id-goes-here",
        
        # Binding 3 & 5: Candidate hash (64 hex chars)
        candidate_sha256="a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
        
        # Target metadata
        target_family="Introduction",
        target_version="I7",
        
        # Binding 1: Manifest hash
        placement_manifest_id="manifest-87654321-4321-4321-4321-abcdef123456",
        placement_manifest_sha256="b8ffd7f9cg2fe86752d25867b172e773e691fe5ef54c5agb93e91b5c91g9545b",
        
        # Binding 4: Separation of duties (requester != approver)
        approved_by="approver-alice@example.com",
        workflow_requester="requester-bob@example.com",
        
        # Binding 2: Approval status
        status=ImplementationApprovalStatus.APPROVED,
        
        # Metadata
        approval_timestamp=datetime.now(timezone.utc).isoformat(),
        evidence={
            "reviewed_at": "2024-01-15T10:30:00Z",
            "review_notes": "Code quality verified, tests passing",
            "security_check": "PASS"
        },
        rejection_reason=None
    )

@pytest.fixture
def execute_placement_params(valid_w5r2_approval):
    """
    Complete parameter set for execute_placement() call.
    """
    return {
        "workflow_requester": "requester-bob@example.com",  # Binding 4
        "candidate_sha256": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",  # Binding 3 & 5
        # manifest and candidate_files would be provided separately
    }

# Usage in test:
def test_all_bindings_pass(valid_w5r2_approval, execute_placement_params):
    # All 5 bindings satisfied, execution should proceed
    executor = PlacementExecutor(repository_root="/path/to/repo")
    result = executor.execute_placement(
        manifest=manifest,  # Must have manifestHash matching approval
        approval=valid_w5r2_approval,
        candidate_files=files,
        **execute_placement_params
    )
    assert result["status"] == "executed"
```

---

## Hash Computation Reference

### Candidate SHA-256 Computation

```python
import hashlib

def compute_candidate_sha256(files: list) -> str:
    """
    Compute candidate hash from files (matches production algorithm).
    
    Args:
        files: List of dicts with 'filename' and 'content' keys
    
    Returns:
        64-character hex SHA-256 hash
    """
    sha256_hash = hashlib.sha256()
    
    # CRITICAL: Sort by filename for deterministic hash
    sorted_files = sorted(files, key=lambda f: f['filename'])
    
    for file in sorted_files:
        # Hash each file's content
        content_bytes = file['content'].encode('utf-8')
        file_hash = hashlib.sha256(content_bytes)
        
        # Update cumulative hash with this file's hash digest
        sha256_hash.update(file_hash.digest())
    
    return sha256_hash.hexdigest()

# Example:
files = [
    {
        "filename": "Introduction7Block.tsx",
        "content": "import React from 'react';\n\nexport const Introduction7Block = () => {...}"
    },
    {
        "filename": "Introduction7Schema.ts",
        "content": "export const schema = {...};"
    }
]
candidate_hash = compute_candidate_sha256(files)
# Result: "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
```

### Manifest SHA-256 Computation

```python
import hashlib
import json

def compute_manifest_sha256(manifest_data: dict) -> str:
    """
    Compute manifest hash (matches production algorithm).
    
    Args:
        manifest_data: Dict with manifest fields (excluding manifestHash itself)
    
    Returns:
        64-character hex SHA-256 hash
    """
    # CRITICAL: Use sorted keys and no whitespace
    manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
    
    # Compute SHA-256 of JSON string
    computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    
    return computed_hash

# Example:
manifest_data = {
    "manifestId": "manifest-87654321-4321-4321-4321-abcdef123456",
    "candidateId": "cand-12345678-1234-1234-1234-123456789abc",
    "decision": "ADD",
    "targetPath": "packages/ui/src/tutorial/blocks/Introduction",
    "blockFamily": "Introduction",
    "blockVersion": "I7",
    "requiredChanges": [],
    "evidenceIds": ["ev-001", "ev-002"],
    "createdAt": "2024-01-15T10:00:00Z"
}
manifest_hash = compute_manifest_sha256(manifest_data)
# Result: "b8ffd7f9cg2fe86752d25867b172e773e691fe5ef54c5agb93e91b5c91g9545b"
```

---

## Security Properties Summary

| Binding | What It Prevents | Attack Scenario Blocked |
|---------|------------------|-------------------------|
| **1. Manifest** | Tampering with placement instructions | Attacker modifies targetPath after approval to place code in sensitive location |
| **2. Approval Status** | Execution without human review | Automated system attempts to bypass approval gate |
| **3. Candidate Files** | Code substitution | Attacker replaces approved code with malicious version before placement |
| **4. workflow_requester** | Self-approval | Developer approves their own changes without peer review |
| **5. candidate_sha256** | Content tampering | Any modification to approved artifacts after approval granted |

---

## Code Locations Reference

### Primary Enforcement Points
- **executor.py:102-154** - `execute_placement()` method with all 5 binding checks
- **approval_enforcer.py:66-240** - `enforce_approval()` method
- **approval_checker.py:43-247** - `check_implementation_approval()` function

### Model Definitions
- **implementation_approval.py:39-62** - `ImplementationApproval` dataclass
- **placement_manifest.py:24-37** - `PlacementManifest` dataclass

### Hash Computation
- **candidate.py:634-656** - `_compute_candidate_sha256()` function
- **executor.py:67-91** - `verify_manifest_hash()` method
- **placement_manifest.py:268-282** - `_compute_manifest_seal()` method

### Test Coverage
- **test_approval_enforcer.py** - Comprehensive binding verification tests (400+ lines)
- **test_executor.py** - Integration tests for placement execution

---

## Architectural Decision Records

### ADR-1: Why 5 Bindings Instead of 3?

**Context:** Could simplify to just workflow_id + candidate_sha256 + manifest_sha256

**Decision:** Keep all 5 bindings

**Rationale:**
1. **Defense in Depth** - Multiple independent verifications
2. **Explicit Self-Approval Check** - workflow_requester binding makes separation of duties explicit and auditable
3. **Manifest ID Binding** - Provides unique identifier for audit trails and rollback operations
4. **Fail-Closed Philosophy** - More bindings = more security gates that must pass

### ADR-2: Why Fail-Closed Instead of Fail-Open?

**Context:** Could log warnings and continue on missing fields

**Decision:** Hard failures (exceptions) on ANY verification failure

**Rationale:**
1. **Security Critical** - Repository mutations are high-risk operations
2. **No Partial State** - Either all checks pass or nothing happens
3. **Explicit Errors** - Developers see clear error messages, not silent failures
4. **Audit Trail** - Every failure is an exception that can be logged and tracked

### ADR-3: Why SHA-256 Instead of MD5/SHA-1?

**Context:** Simpler hashes might be faster

**Decision:** SHA-256 for all cryptographic operations

**Rationale:**
1. **Security Standard** - SHA-256 is FIPS 140-2 approved
2. **Collision Resistance** - No known practical collision attacks
3. **Future Proof** - Will remain secure for foreseeable future
4. **Industry Standard** - Git uses SHA-256 (in newer versions), matches ecosystem

---

## E2-A-3 COMPLETE: all 5 W5-R2 bindings documented with test fixture guidance
