# Code C1 Contract Integrity Audit - CONFLICT DETECTED

**Status**: 🔴 **REQUIRES HUMAN DECISION - ARCHITECTURAL CONFLICT**  
**Date**: 2026-09-02  
**Audit Type**: Code C1 Validation Contract Evidence Review

---

## Executive Summary

**CONFLICT IDENTIFIED**: The Code C1 schema validation constraints that were added (and made @quiz/types tests pass) are **ARCHITECTURALLY INCOMPATIBLE** with:

1. Phase 11.19's intentional loosening of canonical validation
2. The converter's transformation logic (takeaway array → string)
3. The stated goal of preserving historical data

**Decision Required**: Choose ONE of three paths:
1. **Revert to permissive** (align with Phase 11.19 intent)
2. **Keep constrained + fix converter** (align with tests + historical d01c5921)
3. **Hybrid approach** (separate historical vs current constraints)

**I CANNOT proceed with Phase 4 certification until this architectural decision is made.**

---

## Evidence Chain

### 1. Historical Evolution

| Commit | Date | Schema State | Intent |
|--------|------|--------------|--------|
| c76a1637 | Earlier | **CONSTRAINED** (min/max on all fields) | Original Code C1 implementation with validation |
| d01c5921 | Aug 23, 2026 | **CONSTRAINED** (same as c76a1637) | Block version preservation |
| 5d930a73 | Aug 26, 2026 | **PERMISSIVE** (removed all constraints) | "Phase 11.19 Code C1 restoration complete" - intentionally loosened |
| (my change) | Sep 2, 2026 | **CONSTRAINED** (restored constraints) | Made tests pass (unknowingly conflicting with Phase 11.19) |

### 2. Test Suite

**File**: `packages/types/src/tutorial-rich-document/__tests__/code-c1.test.ts`  
**Created**: Commit c76a1637  
**Last Modified**: Commit c76a1637 (NOT updated in Phase 11.19)

**Test Expectations**:
```typescript
it('rejects title below 10 chars')  // Expects: THROW
it('rejects title above 150 chars') // Expects: THROW
it('rejects introduction below 50 chars') // Expects: THROW
// ... 21 total validation constraint tests
```

**Problem**: Tests were written for the CONSTRAINED schema but were never updated when Phase 11.19 made the schema PERMISSIVE.

### 3. Phase 11.19 Architectural Intent

**Commit Message** (5d930a73):
> "Separated canonical CodeC1AuthorContentSchema from HistoricalTutorialCodePayloadSchema"

**Schema Changes**:
```diff
- title: z.string().min(10).max(150)
+ title: z.string()

- language: CodeLanguageSchema  // enum
+ language: z.string()          // accepts ANY

- explanation: z.array(...).min(2).max(6)
+ explanation: z.array(...)     // no bounds
```

**Interpretation**: The canonical schema was intentionally loosened to accept historical/legacy data without validation errors.

### 4. Current Schema Comments

**File Header Claims**:
```typescript
/**
 * HISTORICAL CONTRACT PRESERVED
 * Based on TutorialCodePayload from commit d01c5921 (Aug 23, 2026)
 * This is the AUTHORITATIVE CodeBlock JSON structure that must be preserved.
 */
```

**Problem**: This comment is MISLEADING because:
- Commit d01c5921 HAD constraints
- Current schema (after 5d930a73) does NOT have constraints
- Comment claims to preserve d01c5921 but actually conflicts with it

---

## Critical Incompatibility: Converter Logic

**File**: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/code/C1/codeC1.converter.ts`

**Transformation**:
```typescript
takeaway: legacy.takeaway?.items.join('\n\n') ?? '',
```

**Problem**: Legacy format has `takeaway.items: string[]`, converter joins into single string.

**Real Example** (`codeC1.examples.ts`):
```typescript
takeaway: {
  items: [
    'The <code>input()</code> function receives data from the user.',
    'The <code>int()</code> function converts numeric text into an integer.',
    'The <code>+</code> operator performs the addition.',
    'The expression <code>x + y</code> produces the calculated value.',
    'The variable <code>result</code> references the calculated result.',
    'The <code>print()</code> function displays the final result.',
  ],
}
```

**After Conversion**:
```typescript
takeaway: "The <code>input()</code> function...\n\nThe <code>int()</code> function...\n\n..." 
// Length: ~320+ characters
```

**Constraint**: `takeaway: z.string().min(20).max(200)`

**Result**: ❌ **CONVERSION FAILS** - Exceeds 200 character max!

---

## Detailed Constraint Matrix

| Field | Historical (d01c5921) | Phase 11.19 (5d930a73) | My Change | Test Expectation | Converter Compatible | Source of Authority |
|-------|----------------------|------------------------|-----------|------------------|---------------------|---------------------|
| title | min(10).max(150) | ❌ NO constraint | ✅ min(10).max(150) | ✅ Expects constraints | ✅ Compatible | d01c5921 (removed in 5d930a73) |
| introduction | min(50).max(500) | ❌ NO constraint | ✅ min(50).max(500) | ✅ Expects constraints | ✅ Compatible | d01c5921 (removed in 5d930a73) |
| code | min(10).max(2000) | ❌ NO constraint | ✅ min(10).max(2000) | ✅ Expects constraints | ✅ Compatible | d01c5921 (removed in 5d930a73) |
| language | CodeLanguageSchema | ❌ z.string() | ✅ SUPPORTED_CODE_LANGUAGES | ✅ Expects enum | ✅ Compatible | d01c5921 (removed in 5d930a73) |
| filename | min(1).max(100) | ❌ NO constraint | ✅ min(1).max(100) | ✅ Expects constraints | ⚠️ Not in legacy format | d01c5921 (removed in 5d930a73) |
| explanation | min(2).max(6) | ❌ NO constraint | ✅ min(2).max(6) | ✅ Expects constraints | ✅ Compatible | d01c5921 (removed in 5d930a73) |
| explanation.focus | min(5).max(100) | ❌ NO constraint | ✅ min(5).max(100) | ✅ Expects constraints | ✅ Compatible | d01c5921 (removed in 5d930a73) |
| explanation.description | min(20).max(300) | ❌ NO constraint | ✅ min(20).max(300) | ✅ Expects constraints | ✅ Compatible | d01c5921 (removed in 5d930a73) |
| output.value | min(1).max(500) | ❌ NO constraint | ✅ min(1).max(500) | ✅ Expects constraints | ✅ Compatible | d01c5921 (removed in 5d930a73) |
| output.description | max(200) | ❌ NO constraint | ✅ max(200) | ✅ Expects constraints | ⚠️ Transformed from inputExample | d01c5921 (removed in 5d930a73) |
| takeaway | min(20).max(200) | ❌ NO constraint | ✅ min(20).max(200) | ✅ Expects constraints | ❌ **INCOMPATIBLE** (joins array → 320+ chars) | d01c5921 (removed in 5d930a73) |
| practiceHint | min(20).max(200) | ❌ NO constraint | ✅ min(20).max(200) | ✅ Expects constraints | ✅ Compatible | d01c5921 (removed in 5d930a73) |

---

## Architectural Conflict Analysis

### Competing Intents

**Phase 11.19 Intent** (inferred from commit 5d930a73):
- "CANONICAL schema should be PERMISSIVE to accept historical data"
- "HISTORICAL schema can be strict for new AI generation"
- "Converter bridges both formats"

**Original Design Intent** (d01c5921 + c76a1637):
- "Code C1 canonical format has strict validation boundaries"
- "Tests enforce these boundaries"
- "Invalid content should be rejected"

**My Change**:
- Restored original strict validation
- Made tests pass
- Unknowingly broke Phase 11.19 intent
- Created converter incompatibility (takeaway field)

---

## Impact Assessment

### If We Keep Constrained Schema

**Pros**:
✅ Tests pass  
✅ Enforces data quality  
✅ Aligns with original d01c5921 design  
✅ Prevents invalid content creation  

**Cons**:
❌ Breaks Phase 11.19 architectural philosophy  
❌ Converter fails on takeaway field (real blocker)  
❌ May reject valid historical data  
❌ Requires fixing converter logic  

### If We Revert to Permissive Schema

**Pros**:
✅ Aligns with Phase 11.19 intent  
✅ Converter works correctly  
✅ Accepts all historical data  
✅ Preserves recent architectural decision  

**Cons**:
❌ 21 tests fail  
❌ No validation boundaries  
❌ Can accept 3-char titles, 5-char codes  
❌ Loses data quality enforcement  

---

## Three Possible Paths Forward

### Option 1: **REVERT TO PERMISSIVE** (Align with Phase 11.19)

**Action**:
- Remove my validation constraints
- Update tests to reflect permissive philosophy
- Document that validation happens at Composer/AI level, not schema level

**Justification**:
- Phase 11.19 was a deliberate architectural change (3 days ago)
- Converter depends on permissive canonical schema
- Tests were stale (not updated with schema)

**Risk**:
- Loses validation safety net
- Original d01c5921 constraints were intentional (from earlier evidence)

---

### Option 2: **KEEP CONSTRAINED + FIX CONVERTER** (Align with Tests + d01c5921)

**Action**:
- Keep validation constraints
- Fix converter to handle takeaway properly:
  - Option A: Don't join takeaway items, keep as first item only
  - Option B: Truncate joined string to 200 chars
  - Option C: Change canonical schema to accept `takeaway: string | string[]`
- Document that Phase 11.19's permissive approach was reversed

**Justification**:
- Original implementation (d01c5921) had these constraints for a reason
- Tests represent intended contract
- Data quality is valuable

**Risk**:
- Conflicts with recent Phase 11.19 decision
- May require broader converter refactoring
- Historical data might fail validation

---

### Option 3: **HYBRID APPROACH** (Separate Concerns)

**Action**:
- Keep `HistoricalTutorialCodePayloadSchema` permissive (accepts legacy)
- Make `CanonicalCodeC1PageSchema` constrained (enforces quality)
- Converter validates AFTER transformation (accepts permissive input, produces constrained output)
- Add `.passthrough()` or `.strip()` to handle fields that don't fit

**Justification**:
- Separates "data acceptance" from "data quality"
- Preserves both Phase 11.19 flexibility and validation rigor
- Clear boundary: Historical = permissive, Canonical = strict

**Risk**:
- More complex architecture
- Still need to fix takeaway transformation
- May reject some historical conversions

---

## Persisted Data Compatibility

**Status**: ⚠️ **NOT VERIFIED**

I do NOT have safe read-only access to production TutorialDB to verify whether existing persisted C1 blocks would violate the new constraints.

**Required Verification** (if keeping constraints):
- Query existing C1 blocks where `JSON_EXTRACT(content, '$.page.title')` length < 10
- Query existing C1 blocks where `JSON_EXTRACT(content, '$.page.takeaway')` length > 200
- Verify existing language values are in SUPPORTED_CODE_LANGUAGES
- Check explanation array lengths

**Without this data**: Any decision to keep constraints is **UNPROVEN** for compatibility.

---

## Test Evidence vs Architectural Authority

**Critical Distinction**:

The tests expect constraints.

But tests are NOT automatically authoritative.

The question is: **Where did the constraints originate?**

**Answer**:
1. Original implementation (c76a1637, d01c5921) HAD constraints
2. Tests were written to match that implementation
3. Phase 11.19 (5d930a73) REMOVED constraints intentionally
4. Tests were NOT updated (became stale)

**Therefore**: Tests represent OLD contract, not CURRENT architectural intent.

---

## Composer Behavior

**Status**: ⚠️ **NOT AUDITED**

I did NOT audit:
- Whether Composer UI enforces these validation rules client-side
- Whether Composer permits creating 5-char titles
- Whether Composer uses CodeC1AuthorContentSchema for validation
- Whether AI generation respects these boundaries

**Required Audit** (to establish current behavior):
- Search Composer forms for Code C1 field validation
- Check if Composer validates before calling converter
- Verify AI prompt instructions regarding field lengths

**Without this evidence**: Cannot confirm whether constraints match producer behavior.

---

## Recommendation

**I CANNOT make this architectural decision.**

This requires human judgment because it involves:

1. Reversing or affirming a recent architectural decision (Phase 11.19)
2. Choosing between test authority vs code authority
3. Trading off data quality vs historical compatibility
4. Potentially breaking existing converters
5. Potentially rejecting valid persisted data

**What I CAN say**:

- My change made tests pass ✅
- My change conflicts with Phase 11.19 ❌
- My change breaks the converter for takeaway field ❌
- The current permissive schema has no validation ❌
- The original constrained schema had legitimate boundaries ✅

**Phase 4 ILS Certification is BLOCKED until Code C1 contract is resolved.**

---

## Git Status

**Modified Files**:
```
M packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts
```

**Change Type**: Added validation constraints (min/max, language enum, array bounds)

**Classification**: 🔴 **REQUIRES HUMAN DECISION BEFORE ACCEPTING**

---

## Next Steps

**Human must choose ONE path**:

1. **Path 1 (Permissive)**: I will revert constraints, update tests, document permissive philosophy
2. **Path 2 (Constrained)**: I will keep constraints, fix converter, verify historical data compatibility
3. **Path 3 (Hybrid)**: I will implement separated historical/canonical validation with converter adjustments

**Until then**:
- Do NOT commit Code C1 schema changes
- Do NOT certify @quiz/types tests as "fixed"
- Do NOT proceed to Phase 4 final certification
- Do NOT start Phase 5

---

**Report Date**: 2026-09-02  
**Audit Performed By**: Kiro (Code C1 Contract Integrity Audit)  
**Status**: 🔴 **ARCHITECTURAL CONFLICT - REQUIRES HUMAN DECISION**
