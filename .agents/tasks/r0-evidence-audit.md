# R0 Evidence Authority Audit Report

**Date**: 2026-10-08  
**Workflow**: M2.9 R0 — Evidence Authority Reconciliation  
**Branch**: m2-project-ai-canonical-wiring (HEAD f589c0b3)

## Executive Summary

This audit identified **TWO evidence directories** and **contradictory status documentation**. The evidence authority is ambiguous because:

1. **Two evidence locations exist**: `.agents/evidence/` (78+ lines) and `docs/project-llm/evidence/` (6 files)
2. **Status document is stale**: Claims W1 is "IN PROGRESS" and W2 is "BLOCKED", but git history shows W0-W2 are COMPLETE (last commit 24e6d7b3)
3. **Evidence quality issues**: 40+ W2 entries in agent-runs.jsonl have `filesChanged: []` and `tests: null`
4. **Stale artifacts clutter**: 8+ intermediate review files with timestamps remain in `.agents/tasks/`

**Decision**: `.agents/evidence/` is the canonical location. `docs/project-llm/evidence/` will be archived.

---

## 1. Evidence Location Findings

### 1.1 Primary Location: `.agents/evidence/`

**Path**: `e:\onlinewebsites\quiz-platform\.agents\evidence\`

**Files found**:
- `agent-runs.jsonl` (78+ lines as of audit)
- `test-results.jsonl` (exists)
- `gate-results.jsonl` (exists)
- `certification-results.jsonl` (exists)
- `workflow-events.jsonl` (exists)

**Content summary** (first 50 lines of agent-runs.jsonl):
- Wave 3 entries: B05-CandidateIntake (12 tests passed), B07-PlacementManifest (28 tests passed)
- Wave 4 entry: W4-ImplementationApprovalGate (12 tests passed)
- Wave 6 entry: B10-BrowserVerification (13 tests passed)
- **40+ W2 entries** (2026-10-08T17:03-17:05): All have `commitBefore == commitAfter`, `filesChanged: []`, `tests: null`

**Python implementation reference**:
```python
# services/project-ai/app/evidence/ledger.py line 18
EVIDENCE_ROOT = Path(__file__).parent.parent.parent.parent.parent / ".agents" / "evidence"
```

**Verdict**: This is the **CANONICAL** location. The Python evidence harness (Wave 1D, commit 7af488f9) explicitly uses this path.

---

### 1.2 Deprecated Location: `docs/project-llm/evidence/`

**Path**: `e:\onlinewebsites\quiz-platform\docs\project-llm\evidence\`

**Files found**:
- `agent-runs.jsonl` (5030 bytes, last modified 2026-10-07 19:46:46)
- `certification-results.jsonl` (366 bytes, last modified 2026-10-07 19:36:03)
- `gate-results.jsonl` (377 bytes, last modified 2026-10-07 19:28:50)
- `test-results.jsonl` (0 bytes, empty)
- `workflow-events.jsonl` (0 bytes, empty)
- `README.md` (383 bytes, last modified 2026-10-07 17:44:29)

**Content analysis**:
- Only 4 entries in agent-runs.jsonl (much smaller than `.agents/evidence/agent-runs.jsonl`)
- Last activity: 2026-10-07, older than `.agents/evidence/` activity on 2026-10-08
- README.md says "append-only JSONL evidence ledgers" but does NOT reflect current implementation

**Verdict**: This is a **STALE/DEPRECATED** artifact from an earlier implementation. It should be archived to signal it is not authoritative.

---

### 1.3 Decision: Canonical Evidence Location

**Canonical location**: `e:\onlinewebsites\quiz-platform\.agents\evidence\`

**Rationale**:
1. Python implementation in `ledger.py` explicitly points to `.agents/evidence/`
2. Wave 1D evidence harness (commit 7af488f9) modified `ledger.py` to use `.agents/evidence/`
3. `.agents/evidence/agent-runs.jsonl` has 78+ entries including all W0-W2 work
4. `docs/project-llm/evidence/` has only 4 entries and stops at an older timestamp

**Action**: Archive `docs/project-llm/evidence/` → `docs/project-llm/evidence-deprecated-20261008/` to preserve history but signal it is not canonical.

---

## 2. Git History — Real Commit SHAs for W0-W2

### Wave 0 (Architecture Freeze)
- **Implementation**: `9dc47b46` "M2.9 Wave 0: Canonical workflow authority freeze (Agent B01)"
- **Review fixes**: `0d7e782a` "M2.9 W0: Fix review findings - integrate governance service and deprecate task routes"
- **Status**: ✅ COMPLETE

### Wave 1A (Target Binding)
- **Implementation**: `304a333f` "feat(project-llm): bind workflow target family/version identity"
- **Review fixes**: `85918ee9` "fix(project-llm): address Wave 1A review findings"
- **Status**: ✅ COMPLETE (PARTIAL verdict per review - integration gaps remain)

### Wave 1B (Repository Intelligence)
- **Implementation**: `d04b356c` "feat(project-llm): add repository contract intelligence"
- **Review fixes**: `82f8a3ee` "feat(project-llm): fix repository intelligence review findings"
- **Review fixes**: `5182c874` "fix(project-ai): address W1B review findings for repository intelligence"
- **Status**: ✅ COMPLETE (PARTIAL verdict per review - duplicate implementations remain)

### Wave 1C (Legacy Cleanup)
- **Implementation**: `c715af46` "feat(project-llm): deprecate legacy creation authority (M2.9 W1C)"
- **Review fixes**: `56891aec` "fix(docs): correct DesignSource value in W1C migration guide"
- **Status**: ✅ COMPLETE

### Wave 1D (Evidence Harness)
- **Implementation**: `7988a5f3` "docs: Add Wave 1D evidence harness report"
- **Review fixes**: `7af488f9` "fix(project-llm): address W1D review findings - scope, timezone, locking docs"
- **Review fixes**: `850d5f92` "fix(project-llm): fix Windows file locking and add multiprocess test (W1D review)"
- **Status**: ✅ COMPLETE (PARTIAL verdict per review - cosmetic issues remain)

### Wave 2 (Engineering Contract)
- **Implementation**: `3051a540` "feat(project-llm): implement immutable engineering contract generation"
- **Review fixes**: `24e6d7b3` "fix(project-ai): resolve W2 review findings - real git SHA, pytest-asyncio config, immutability docs, test mocks"
- **Status**: ✅ COMPLETE (PARTIAL verdict per review - contract not fully repository-derived, persistence is in-memory)

### Current HEAD
- **Latest commit**: `f589c0b3` "chore: consolidate M2.9 W0-W2 evidence and reports"

---

## 3. Status Document Contradictions

**File**: `e:\onlinewebsites\quiz-platform\docs\project-llm\canonical-implementation-status.md`

### Problems Identified

| Field | Document Claims | Reality (from git history) |
|-------|----------------|---------------------------|
| Last Updated | 2025-01-07 | Should be 2026-10-08 |
| Current Wave | W1 (IN PROGRESS) | W0-W2 COMPLETE, HEAD at f589c0b3 |
| W0 Status | ✅ COMPLETE 2025-01-07 | ✅ COMPLETE (commit 0d7e782a) — date is wrong |
| W1 Status | 🔄 IN PROGRESS 2025-01-07 | ✅ COMPLETE (W1A: 304a333f + 85918ee9, W1B: 82f8a3ee + 5182c874, W1C: 56891aec, W1D: 7af488f9) |
| W2 Status | 🚫 BLOCKED | ✅ COMPLETE (commits 3051a540, 24e6d7b3) |
| Commit References | `[hash]` placeholders | Should be real SHAs from git log |

### Verdict Reports (Actual Status)

**Wave 1 Verdict**: File `m2-9-wave1-verdict.json` shows `"verdict": "APPROVED"` with non-blocking findings.

**Wave 2 Verdict**: File `m2-9-wave2-verdict.json` shows `"verdict": "APPROVED"` with non-blocking findings:
- Version sentinel inconsistency (non-blocking, Wave 3 fix)
- In-memory contract store (non-blocking, Wave 3 fix)

**Accurate Statement**:
> W0-W2 are COMPLETE and APPROVED. W0 PASS, W1A-D PARTIAL (with integration gaps), W2 PARTIAL (contract not fully repository-derived, persistence in-memory). Current HEAD: f589c0b3.

---

## 4. Evidence Quality Issues in agent-runs.jsonl

### Problem: Spurious W2 Entries

**Lines affected**: 40+ entries in `.agents/evidence/agent-runs.jsonl` between 2026-10-08T17:03:01 and 2026-10-08T17:05:03

**Issue characteristics**:
```json
{
  "runId": "w2-engineering-contract-...",
  "commitBefore": "3051a540a2a624c0d5bec8acff5428610bfe4c64",
  "commitAfter": "3051a540a2a624c0d5bec8acff5428610bfe4c64",
  "filesChanged": [],
  "tests": null,
  "status": "completed",
  "timestamp": "2026-10-08T17:03:01.927070Z"
}
```

**Root cause**: Evidence recording bug during batch W2 execution. `commitBefore == commitAfter` and empty file changes indicate no actual work was done.

**Canonical source**: The accurate W2 implementation evidence is in:
- `.agents/tasks/w2-engineering-contract-report.json` (structured report with real file changes and test counts)
- Git commits: 3051a540 (implementation), 24e6d7b3 (review fixes)

**W2 Report Evidence** (from w2-engineering-contract-report.json):
```json
{
  "commit_after": "24e6d7b3",
  "files_changed": [
    "services/project-ai/app/api/routes/contract.py",
    "services/project-ai/app/contracts/engineering_contract.py",
    "services/project-ai/pyproject.toml",
    "services/project-ai/tests/unit/test_contract_routes.py",
    "services/project-ai/tests/integration/test_w2_contract_generation.py"
  ],
  "tests": {
    "unit_passed": 46,
    "unit_failed": 0,
    "integration_passed": 9,
    "integration_failed": 0
  }
}
```

**Resolution**: Per append-only ledger contract, these entries cannot be removed. Consumers should prefer structured reports in `.agents/tasks/w*-report.json` over raw JSONL for authoritative evidence.

---

## 5. Stale/Duplicate Files in `.agents/tasks/`

### 5.1 Intermediate Review Files (Timestamp-Prefixed)

**Files to archive** to `.agents/tasks/archive-intermediate-reviews/`:
- `2025-01-20-164500-m1-convergence-review.md`
- `2025-01-29-153045-review.md`
- `2025-01-29-180000-review.md`
- `2025-01-29-213000-w1b-review.md`
- `2025-01-29-final-gate-review.md`
- `2025-01-30-212400-m2-9-wave0-review.md`
- `2025-01-30-224800-review.md`
- `20250116-102030-fm-contract-fix-review.md`

**Rationale**: These are iteration artifacts. The final canonical reviews are in files like `w0-architecture-freeze-report.json`, `w1a-target-binding-report.json`, etc.

### 5.2 Temporary/Test Files

**Files to delete**:
- `temp-diff.txt` (10,446,435 bytes = 10.4 MB temporary diff)
- `generate-corrected-snapshot.ts` (one-off script, if exists)
- `test-d6.ts` (test script, if exists)

**Rationale**: These are not part of the evidence trail and clutter the directory.

### 5.3 Canonical Final Reports (KEEP)

**Keep in main `.agents/tasks/` directory**:
- `w0-architecture-freeze-report.json`
- `w1a-target-binding-report.json`
- `w1b-repository-intelligence-report.json`
- `w1c-legacy-cleanup-report.json`
- `w1d-evidence-harness-report.json`
- `w2-engineering-contract-report.json`
- `w2-review.json`
- `m2-9-wave1-verdict.json`
- `m2-9-wave2-verdict.json`
- All plan files (`w1a-plan.md`, `w1b-plan.md`, etc.)
- Final review markdown files (`w1a-review.md`, `w2-review.md`, etc.)

---

## 6. Recommendations

### Immediate Actions (R0 Scope)

1. **Archive deprecated evidence directory**:
   - Move `docs/project-llm/evidence/` → `docs/project-llm/evidence-deprecated-20261008/`
   - Add README.md in deprecated directory explaining why it was retired

2. **Update canonical-implementation-status.md**:
   - Last Updated: 2026-10-08
   - Current Wave: R0 (Remediation)
   - W0: ✅ COMPLETE (commit 0d7e782a)
   - W1A-D: ✅ COMPLETE (commits 304a333f, 82f8a3ee, 56891aec, 7af488f9)
   - W2: ✅ COMPLETE (commit 24e6d7b3)
   - Add verdict: APPROVED with non-blocking findings

3. **Clean task directory**:
   - Archive intermediate review files to `.agents/tasks/archive-intermediate-reviews/`
   - Delete temp-diff.txt, generate-corrected-snapshot.ts, test-d6.ts (if they exist)

4. **Document data quality issues**:
   - Create `.agents/evidence/DATA_QUALITY.md` documenting the W2 agent-runs.jsonl issue
   - Explain that structured reports are authoritative over raw JSONL

5. **Create CanonicalEvidenceStore**:
   - Create high-level facade in `services/project-ai/app/evidence/store.py`
   - Provide clean API over existing ledger and integration modules
   - Add tests for the facade

6. **Document evidence system**:
   - Create `.agents/evidence/README.md` explaining canonical evidence system
   - Document append-only contract, concurrency safety, UTC timestamps

---

## 7. Current Evidence System Implementation

### Files Present

**Evidence harness** (Wave 1D implementation):
- `services/project-ai/app/evidence/ledger.py` — low-level JSONL append functions
- `services/project-ai/app/evidence/integration.py` — wave completion recording
- `services/project-ai/app/evidence/schemas.py` — Pydantic models (AgentRun, TestResult, EvidenceRecord)
- `services/project-ai/tests/unit/test_evidence_ledger.py` — 40 tests (all passing per W1D report)

**What does NOT exist**:
- No `canonical_evidence.py` file
- No `CanonicalEvidenceStore` class
- No high-level facade over the ledger and integration modules

**Verdict**: The evidence harness is functional (W1D COMPLETE) but there is no high-level "CanonicalEvidenceStore" facade. The implementation is distributed across `ledger.py` (low-level writes) and `integration.py` (high-level workflows).

---

## 8. Summary of Contradictions

| Artifact | Claims | Reality |
|----------|--------|---------|
| canonical-implementation-status.md | W1 IN PROGRESS, W2 BLOCKED | W0-W2 COMPLETE (git history) |
| docs/project-llm/evidence/ | Appears to be active evidence location | STALE, last activity 2026-10-07 |
| .agents/evidence/ | Not documented in status doc | CANONICAL per Python implementation |
| agent-runs.jsonl (40+ W2 entries) | W2 runs completed | Spurious entries (filesChanged: [], tests: null) |
| .agents/tasks/*.md (timestamped) | Intermediate review files | Superseded by final reports |
| temp-diff.txt (10.4 MB) | Present in tasks directory | Should be deleted (temporary artifact) |

---

## 9. Conclusion

**Evidence authority is currently ambiguous due to**:
1. Two evidence directories existing simultaneously
2. Stale status documentation contradicting git history
3. Quality issues in JSONL ledger (spurious W2 entries)
4. Clutter from intermediate artifacts

**After R0 remediation**:
- ONE canonical evidence location: `.agents/evidence/`
- ONE accurate status document with real commit SHAs
- ONE clean API: `CanonicalEvidenceStore` facade
- Clear documentation: README.md and DATA_QUALITY.md

**Evidence authority will be unambiguous**.

---

**Audit completed**: 2026-10-08  
**Next step**: Implement R0 remediation plan per `r0-plan.md`
