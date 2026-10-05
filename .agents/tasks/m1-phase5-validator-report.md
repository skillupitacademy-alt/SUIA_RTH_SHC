# V1-V9 Validator Report

Snapshot: `.agents/tasks/m1-snapshot-final.json`  
HEAD: `156df82701b6a0e63b24a19e3b35be854493e730`  
Date: 2025-01-29T00:00:00Z  
Repository: `E:\onlinewebsites\quiz-platform`

---

## Executive Summary

**Overall Status: FAIL (1 error, 11 warnings)**

- **V9 Determinism**: FAIL (1 error) - Non-deterministic snapshot generation
- **V1-V8**: PASS (0 errors, 11 warnings)
- **Fixture Reconciliation**: MISMATCH (2 discrepancies)

---

## Validator Results

| Validator | Status | Errors | Warnings | Notes |
|-----------|--------|--------|----------|-------|
| V1        | PASS   | 0      | 0        | Schema validation passed |
| V2        | PASS   | 0      | 9        | API service reference warnings |
| V3        | PASS   | 0      | 0        | Evidence paths validated |
| V4        | PASS   | 0      | 0        | Block consistency verified |
| V5        | PASS   | 0      | 0        | Single composer service confirmed |
| V6        | PASS   | 0      | 0        | Dependency graph acyclic |
| V7        | PASS   | 0      | 2        | Test reference warnings |
| V8        | PASS   | 0      | 0        | Evidence completeness validated |
| V9        | FAIL   | 1      | 0        | **Determinism violation** |

**Total: 1 error, 11 warnings**

---

## Critical Findings

### V9: Determinism Violation (ERROR)

**Code:** `DETERMINISM_VIOLATION`  
**Message:** Snapshot canonical hash is not deterministic. Same repository state produced different hashes.

**Details:**
- First hash: `3c0c4b11be766809572b7a63a1b6f4b2beaa105e23e47417ae9563f69558c8b0`
- Second hash: `6e5c778798cee0531e784161ae05973a6dc6bca256b83f8cfc5feab93ee242bd`

**Impact:** 
The snapshot generation process is non-deterministic, meaning running the scanner twice on the same repository state produces different canonical hashes. This violates a core M1 requirement that the snapshot must be reproducible for integrity validation and change detection.

**Root Cause:**
The V9 validator regenerates the snapshot and compares the canonical hash. The hash mismatch indicates:
1. Non-deterministic ordering of evidence, blocks, or other snapshot elements
2. Timestamps or non-canonical data leaking into the hash computation
3. File system traversal order affecting evidence generation

**Recommendation:**
This is a **blocker for M1 closure**. The deterministic evidence ID implementation (Phase 4) was intended to resolve this, but the snapshot generation pipeline still contains non-deterministic elements. Investigation required:
1. Check evidence collection order (filesystem traversal may be non-deterministic)
2. Verify evidence array sorting before hash computation
3. Confirm all timestamp fields are excluded from canonical hash
4. Review D3 scanner and evidence collector for ordering guarantees

---

## Warnings

### V2: Reference Integrity (9 warnings)

All 9 warnings are `API_NO_SERVICE_REFERENCE` for tutorial-composer API routes:

1. `/api/tutorial-composer/analysis`
2. `/api/tutorial-composer/block-suggestions`
3. `/api/tutorial-composer/import`
4. `/api/tutorial-composer/presentation-ideas`
5. `/api/tutorial-composer/sections`
6. `/api/tutorial-composer/sections/[sectionId]/blocks`
7. `/api/tutorial-composer/sections/[sectionId]/publish`
8. `/api/tutorial-composer/sections/[sectionId]`
9. `/api/tutorial-composer/sections/[sectionId]/suggestions/apply`

**Analysis:** These API route handlers exist but do not reference any known service from the discovery snapshot. This could indicate:
- Direct implementation without service layer (acceptable but should be documented)
- Service references not detected by discovery scanner
- Intentional architectural pattern (e.g., serverless functions)

**Status:** Acceptable for M1 - these are architectural observations, not defects.

---

### V7: Test References (2 warnings)

**Code:** `TEST_FILE_NOT_FOUND`

1. `apps/web-app/vitest.config.ts` - not found
2. `apps/admin-app/vitest.config.ts` - not found

**Analysis:** 
The snapshot references these test configuration files but they don't exist in the repository. These are likely obsolete references or renamed entities.

**Status:** Acceptable for M1 - test coverage detection is explicitly deferred to M2 per Phase 3 documentation.

---

## Fixture Reconciliation

**Status: MISMATCH (14 matches, 2 discrepancies)**

### Discrepancies

#### 1. Verified implementation: I1
**Legacy status:** `RUNTIME_INTEGRATED` (verified)  
**Snapshot status:** Not found in `blocks.verified[]`  
**Notes:** I1 was verified in legacy fixture but not found in snapshot verified list

**Analysis:** 
I1 (IntroductionBlock v1) was marked as fully verified in the legacy fixture `projectLlmRepositoryIntelligence.ts`, but the D3 scanner did not elevate it to `VERIFIED` status in the snapshot. This could indicate:
- The block no longer meets VERIFIED criteria (e.g., missing runtime registration)
- D3 verification logic is stricter than legacy manual assessment
- Evidence collection did not find all required verification signals

#### 2. Incomplete implementation: S1
**Legacy status:** `IMPLEMENTED` (incomplete)  
**Snapshot status:** Not found in snapshot  
**Notes:** S1 was incomplete in legacy but not found in snapshot

**Analysis:**
S1 (Summary block) was documented as incomplete in the legacy fixture but does not appear in the snapshot at all (neither in `implemented[]` nor `verified[]`). This suggests:
- The block was removed or refactored
- The discovery scanner did not detect it
- Legacy fixture was out of sync with actual repository state

### Matches

14 other comparisons between legacy fixture and snapshot matched, including:
- Verified implementations: C1, D1 (matched)
- Planned families: All documented families found in snapshot

**Overall Assessment:**
The 2 discrepancies are not blocking. The prompt states "new snapshot is source of truth," and the fixture reconciliation is informational. The discrepancies indicate evolution of the codebase or stricter verification criteria in the automated scanner.

---

## Validation Summary

### Passed
✓ **V1 Schema**: Snapshot conforms to schema version 1.0.0  
✓ **V2 Reference Integrity**: All entity references valid (9 informational warnings)  
✓ **V3 Evidence Paths**: All evidence files exist in repository  
✓ **V4 Block Consistency**: Block definitions consistent across sections  
✓ **V5 Composer**: Single composer service identified  
✓ **V6 Dependency Graph**: No circular dependencies detected  
✓ **V7 Test References**: Test suites identified (2 missing configs acceptable for M1)  
✓ **V8 Evidence Completeness**: Critical evidence present and valid  

### Failed
✗ **V9 Determinism**: Snapshot generation is non-deterministic (**BLOCKER**)

### Fixture Status
⚠ **Fixture Reconciliation**: 2 minor discrepancies (I1, S1) - informational only

---

## Recommendations

### Immediate (Phase 5 completion)
1. **Investigate V9 determinism failure** - This is the primary blocker for M1 closure
   - Review evidence collection ordering
   - Verify canonical hash computation excludes all non-deterministic fields
   - Test snapshot generation multiple times in clean repository state

### Before M1 Closure
1. Resolve determinism violation or document why it's acceptable
2. Update closure matrix with validator results
3. Document V2 API service architecture pattern (if intentional)

### M2 Scope (deferred)
1. Test coverage detection (V7 warnings expected for M1)
2. Complete UBRC verification for I1 and S1 blocks
3. Enhance D3 scanner to detect all block implementations

---

## Appendix: Validation Environment

**Node.js Version:** v20.20.0  
**Repository State:** HEAD `156df82701b6a0e63b24a19e3b35be854493e730`  
**Snapshot Canonical Hash:** `3c0c4b11be766809572b7a63a1b6f4b2beaa105e23e47417ae9563f69558c8b0`  
**Validation Timestamp:** 2025-01-29T00:00:00Z  
**Validator Suite:** V1-V9 from `@quiz/project-llm-discovery@1.0.0`

