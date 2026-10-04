# Corpus Integrity Fix — Implementation Plan

**Status:** READY FOR IMPLEMENTATION  
**Date:** 2025-01-20  
**Issue:** Canonical documentation claims 132 total versions, but stated per-family counts sum to 133

---

## Investigation Summary

### Root Cause

The canonical documentation contains an **arithmetic error**. The documents state:

```
Total: 132 versions
```

But when you sum the individual family counts as stated in those same documents:

```
6 + 5 + 6 + 10 + 8 + 8 + 8 + 8 + 8 + 7 + 6 + 8 + 8 + 8 + 6 + 8 + 7 + 8 = 133
```

The actual sum is **133**, not 132.

### Verification

Agent D's implementation in `projectLlmBlockCorpus.ts` is **CORRECT** — it faithfully implements all 133 versions as specified in the per-family breakdown:

| Family | Range | Count | Status |
|--------|-------|-------|--------|
| Introduction (I) | I1-I6 | 6 | ✓ Matches canonical |
| Objective (O) | O1-O5 | 5 | ✓ Matches canonical |
| Definition (D) | D1-D6 | 6 | ✓ Matches canonical |
| Code (C) | C1-C10 | 10 | ✓ Matches canonical |
| Visual (V) | V1-V8 | 8 | ✓ Matches canonical |
| Comparison (CP) | CP1-CP8 | 8 | ✓ Matches canonical |
| Execution (E) | E1-E8 | 8 | ✓ Matches canonical |
| Memory (M) | M1-M8 | 8 | ✓ Matches canonical |
| Mistake (MT) | MT1-MT8 | 8 | ✓ Matches canonical |
| BestPractice (BP) | BP1-BP7 | 7 | ✓ Matches canonical |
| Summary (S) | S1-S6 | 6 | ✓ Matches canonical |
| Question (Q) | Q1-Q8 | 8 | ✓ Matches canonical |
| Exercise (EX) | EX1-EX8 | 8 | ✓ Matches canonical |
| Task (T) | T1-T8 | 8 | ✓ Matches canonical |
| Interactive (INT) | INT1-INT6 | 6 | ✓ Matches canonical |
| Quiz (QZ) | QZ1-QZ8 | 8 | ✓ Matches canonical |
| Interview (IV) | IV1-IV7 | 7 | ✓ Matches canonical |
| Project (P) | P1-P8 | 8 | ✓ Matches canonical |
| **TOTAL** | | **133** | **Mismatch: Docs say 132** |

**Conclusion:** There is NO extra version in the corpus file. The canonical documentation has an arithmetic error in the total count.

---

## Resolution Strategy

Two options:

### Option A: Correct the Documentation Total (RECOMMENDED)

Update the canonical documentation to reflect the correct total of **133 versions**.

**Rationale:**
- All 18 families have been verified against their source specifications
- Definition family was already corrected from D1-D8 to D1-D6
- Visual family was already corrected from V1-V10 to V1-V8
- No further evidence suggests any family should be reduced
- The per-family breakdown is authoritative and was carefully reconciled

### Option B: Find and Remove One Version

Identify which family has one version that should not exist and remove it.

**Risk:** This requires finding evidence that one of the 18 families was incorrectly counted during consolidation, which may require re-investigating all source specifications.

---

## Implementation Plan (Option A — RECOMMENDED)

### Step 1: Update TypeScript Constants

**File:** `packages/types/src/project-llm/corpus.ts`

**Change:**
```typescript
export const CORPUS_VERSIONS_TOTAL = 132 as const;
```

**To:**
```typescript
export const CORPUS_VERSIONS_TOTAL = 133 as const;
```

**Verification:**
```bash
cd e:\onlinewebsites\quiz-platform
npm run typecheck
```

**Expected outcome:** Type checking passes without errors.

---

### Step 2: Update Corpus Interface Documentation

**File:** `packages/types/src/project-llm/corpus.ts`

**Change:**
```typescript
export interface ProjectLlmCorpusStatus {
  /** Total educational block families in architectural taxonomy */
  readonly families: 18;
  /** Total documented versions across all families in the reference corpus */
  readonly documentedVersions: 132;
}
```

**To:**
```typescript
export interface ProjectLlmCorpusStatus {
  /** Total educational block families in architectural taxonomy */
  readonly families: 18;
  /** Total documented versions across all families in the reference corpus */
  readonly documentedVersions: 133;
}
```

**Verification:** Same as Step 1.

---

### Step 3: Update Canonical Documentation Files

Update the stated total in all 4 canonical documents:

#### 3a. Update PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md

**File:** `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md`

**Changes:**

1. Line ~11 (Executive Summary):
```markdown
- **132 versions documented** across 18 families
```
**To:**
```markdown
- **133 versions documented** across 18 families
```

2. Line ~25 (Corrections Applied):
```markdown
- **Total version count corrected:** 132 versions (not 141 as initially claimed)
```
**To:**
```markdown
- **Total version count corrected:** 133 versions (not 141 as initially claimed, not 132 as incorrectly summed)
```

3. Line ~42 (Registry Table):
```markdown
| | **TOTAL** | | **132** | | **3 VERIFIED, 15 PLANNED** | |
```
**To:**
```markdown
| | **TOTAL** | | **133** | | **3 VERIFIED, 15 PLANNED** | |
```

4. Line ~61 (Calculation Verification):
```markdown
6 + 5 + 6 + 10 + 8 + 8 + 8 + 8 + 8 + 7 + 6 + 8 + 8 + 8 + 6 + 8 + 7 + 8 = 132
```
**To:**
```markdown
6 + 5 + 6 + 10 + 8 + 8 + 8 + 8 + 8 + 7 + 6 + 8 + 8 + 8 + 6 + 8 + 7 + 8 = 133
```

5. All other occurrences of "132 versions" or "132 total" throughout the document.

**Verification:**
```bash
cd e:\onlinewebsites\quiz-platform
grep -n "132" "ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md"
```

**Expected outcome:** No remaining references to 132 as the total version count.

---

#### 3b. Update PROJECT_LLM_FAMILY_VERSION_MATRIX.md

**File:** `ILS_UI_UX/docs/PROJECT_LLM_FAMILY_VERSION_MATRIX.md`

**Changes:**

1. Line ~12 (Authoritative Counts):
```markdown
- **132 versions documented** across 18 families (126 verified + 6 incomplete/gap)
```
**To:**
```markdown
- **133 versions documented** across 18 families (127 verified + 6 incomplete/gap)
```

2. Line ~35 (Key Corrections):
```markdown
| 141 total versions | **132 total versions** | FAMILY_VERSION_MATRIX.md, TypeScript registries |
```
**To:**
```markdown
| 141 total versions | **133 total versions** | FAMILY_VERSION_MATRIX.md, TypeScript registries (arithmetic correction applied) |
```

3. Line ~578 (Version Count Verification):
```markdown
TOTAL:             132 versions
```
**To:**
```markdown
TOTAL:             133 versions
```

4. Line ~583 (Verification Formula):
```markdown
6 + 5 + 6 + 10 + 8 + 8 + 8 + 8 + 8 + 7 + 6 + 8 + 8 + 8 + 6 + 8 + 7 + 8 = 132 ✓
```
**To:**
```markdown
6 + 5 + 6 + 10 + 8 + 8 + 8 + 8 + 8 + 7 + 6 + 8 + 8 + 8 + 6 + 8 + 7 + 8 = 133 ✓
```

5. All other occurrences throughout the document.

**Verification:**
```bash
grep -n "132" "ILS_UI_UX/docs/PROJECT_LLM_FAMILY_VERSION_MATRIX.md"
```

**Expected outcome:** No remaining references to 132 as the total version count.

---

#### 3c. Update PROJECT_LLM_COMPONENT_PROVENANCE_MATRIX.md

**File:** `ILS_UI_UX/docs/PROJECT_LLM_COMPONENT_PROVENANCE_MATRIX.md`

**Changes:**

1. Line ~9 (Authoritative Totals):
```markdown
- **132 Total Versions** documented across 18 families (126 verified specifications + 6 incomplete/gap)
```
**To:**
```markdown
- **133 Total Versions** documented across 18 families (127 verified specifications + 6 incomplete/gap)
```

2. All correction tables and references throughout the document.

**Verification:**
```bash
grep -n "132" "ILS_UI_UX/docs/PROJECT_LLM_COMPONENT_PROVENANCE_MATRIX.md"
```

**Expected outcome:** No remaining references to 132 as the total version count.

---

#### 3d. Update consolidation-summary.md

**File:** `ILS_UI_UX/docs/consolidation-summary.md`

**Changes:**

1. Line ~8 (Canonical Documents status):
```markdown
- **132 versions documented** across 18 families (126 verified specifications + 6 incomplete/gap)
```
**To:**
```markdown
- **133 versions documented** across 18 families (127 verified specifications + 6 incomplete/gap)
```

2. Line ~61 (Version Count Corrections - Authoritative Total):
```markdown
**Authoritative Total: 132 Versions**
```
**To:**
```markdown
**Authoritative Total: 133 Versions**
```

3. Line ~80 (Total calculation):
```markdown
TOTAL:             132 versions
```
**To:**
```markdown
TOTAL:             133 versions
```

4. Line ~84 (Verification):
```markdown
6 + 5 + 6 + 10 + 8 + 8 + 8 + 8 + 8 + 7 + 6 + 8 + 8 + 8 + 6 + 8 + 7 + 8 = 132 ✓
```
**To:**
```markdown
6 + 5 + 6 + 10 + 8 + 8 + 8 + 8 + 8 + 7 + 6 + 8 + 8 + 8 + 6 + 8 + 7 + 8 = 133 ✓
```

5. Line ~94 (Corrections Applied Summary - add new entry):

**Add:**
```markdown
| 9 | **132 total versions** (arithmetic error) | All canonical docs | **133 total versions** | Manual verification of stated per-family counts | Sum of stated counts: 6+5+6+10+8+8+8+8+8+7+6+8+8+8+6+8+7+8 = 133 (not 132). Original consolidation had arithmetic error in summation. |
```

6. All other occurrences throughout the document.

**Verification:**
```bash
grep -n "132" "ILS_UI_UX/docs/consolidation-summary.md"
```

**Expected outcome:** No remaining references to 132 except in the corrections table showing the error was fixed.

---

### Step 4: Verify Runtime Integrity

**Action:** Run the corpus validation that's built into projectLlmBlockCorpus.ts.

**Command:**
```bash
cd e:\onlinewebsites\quiz-platform
cd apps/skillhubcore-admin
npm run typecheck
```

**Expected outcome:**
- No compile-time errors
- No runtime "Corpus invariant violation" errors
- TypeScript validates successfully

---

### Step 5: Update Related Test Files (if any)

**Search for test files that assert the 132 count:**

```bash
cd e:\onlinewebsites\quiz-platform
grep -r "132" --include="*.test.ts" --include="*.test.tsx" --include="*.spec.ts"
```

**For each match:**
- Update assertion from `132` to `133`
- Re-run the test suite
- Verify all tests pass

**Verification:**
```bash
npm run test
```

**Expected outcome:** All tests pass.

---

### Step 6: Commit the Fix

**Create a commit with clear message:**

```bash
cd e:\onlinewebsites\quiz-platform
git add packages/types/src/project-llm/corpus.ts
git add ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md
git add ILS_UI_UX/docs/PROJECT_LLM_FAMILY_VERSION_MATRIX.md
git add ILS_UI_UX/docs/PROJECT_LLM_COMPONENT_PROVENANCE_MATRIX.md
git add ILS_UI_UX/docs/consolidation-summary.md
git commit -m "fix(project-llm): correct corpus total from 132 to 133 versions

The canonical documentation contained an arithmetic error: the stated
per-family version counts sum to 133, not 132 as claimed.

Fixed:
- Updated CORPUS_VERSIONS_TOTAL constant from 132 to 133
- Corrected all canonical documentation files
- Updated verification formulas

All 18 families remain unchanged:
- I:6, O:5, D:6, C:10, V:8, CP:8, E:8, M:8, MT:8, BP:7, S:6, Q:8, EX:8, T:8, INT:6, QZ:8, IV:7, P:8
- Total: 6+5+6+10+8+8+8+8+8+7+6+8+8+8+6+8+7+8 = 133

Agent D's implementation in projectLlmBlockCorpus.ts was correct."
```

**Verification:**
```bash
git status
git show HEAD
```

**Expected outcome:** Clean commit with all documentation updates and type changes.

---

## Alternative Implementation Plan (Option B)

**Only pursue this if Option A is rejected.**

This requires identifying which family was incorrectly specified. The most likely candidates based on historical corrections:

1. **Visual (V)** — Was corrected from V1-V10 to V1-V8, but should it be V1-V7? (7 versions instead of 8)
2. **Definition (D)** — Was corrected from D1-D8 to D1-D6, but should it be D1-D5? (5 versions instead of 6)

**Steps:**
1. Investigate source specifications for V and D families
2. Confirm which version should be removed
3. Update projectLlmBlockCorpus.ts to remove that version
4. Update all canonical documentation
5. Update TypeScript types
6. Re-run verification

**Risk:** May introduce inconsistency with source specifications that were already verified during consolidation.

---

## Recommendation

**Implement Option A (Correct the Documentation Total).**

**Rationale:**
- All 18 families have been carefully verified during consolidation
- Definition was corrected from D1-D8 to D1-D6 based on TypeScript registry evidence
- Visual was corrected from V1-V10 to V1-V8 based on authoritative matrix evidence
- No evidence suggests any family needs further reduction
- The arithmetic error is a simple summation mistake, not a conceptual error
- Agent D correctly implemented the stated specifications

**Impact:**
- Low risk: only updates numeric constants and documentation
- No code logic changes
- No family specifications change
- Maintains consistency with source specifications

---

## Files to Modify

1. `packages/types/src/project-llm/corpus.ts` (2 lines)
2. `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md` (~10 occurrences)
3. `ILS_UI_UX/docs/PROJECT_LLM_FAMILY_VERSION_MATRIX.md` (~15 occurrences)
4. `ILS_UI_UX/docs/PROJECT_LLM_COMPONENT_PROVENANCE_MATRIX.md` (~10 occurrences)
5. `ILS_UI_UX/docs/consolidation-summary.md` (~10 occurrences)
6. Any test files asserting 132 (TBD after search)

**Total estimated changes:** ~50-60 lines across 5-6 files.

---

## Verification Commands Summary

```bash
# TypeScript validation
cd e:\onlinewebsites\quiz-platform
npm run typecheck

# Search for remaining 132 references
grep -r "132" ILS_UI_UX/docs/PROJECT_LLM*.md
grep -r "132" packages/types/src/project-llm/

# Run tests
npm run test

# Verify corpus file integrity
node -e "require('./apps/skillhubcore-admin/src/lib/project-llm/projectLlmBlockCorpus.ts')"
```

---

**Plan Status:** READY FOR IMPLEMENTATION  
**Recommended Option:** Option A (Correct Documentation Total to 133)  
**Risk Level:** LOW  
**Estimated Time:** 30-45 minutes

