# Scanner Evidence Deduplication Verification

## Changes Implemented

### Core Fix: Collector-level Deduplication

**File:** `packages/project-llm-discovery/src/evidence/collector.ts`

Added Set-based deduplication to `EvidenceCollector` class:
- Added private `seenIds` Set to track encountered evidenceIds
- Modified `add()` method to check for duplicate evidenceIds and skip silently (first wins)
- Updated `addAll()` method to use `add()` for consistent deduplication behavior

**Rationale:** Multiple scanners (D1 structure, D2 runtime) legitimately examine the same files for different purposes, producing identical evidenceIds. Deduplication at the collector level fixes this for all scanners without requiring per-scanner changes.

### Schema Version Updates

The M2.1 implementation bumped schema version from 1.0.0 to 1.1.0, requiring updates to validators and tests:

**Files Updated:**
1. `packages/project-llm-discovery/src/validation/v1-schema-validator.ts`
   - Updated Zod schema: `schemaVersion: z.literal('1.1.0')`
   - Updated version check to expect '1.1.0'
2. `packages/project-llm-discovery/__tests__/unit/validation/v1-schema-validator.test.ts`
   - Updated test fixture: `schemaVersion: '1.1.0'`
   - Updated test assertion to expect '1.1.0' in error messages
   - Added `lifecycle: 'current'` to evidence test objects
3. `packages/project-llm-discovery/__tests__/integration/discovery-integration.test.ts`
   - Updated assertion: `expect(snapshot.schemaVersion).toBe('1.1.0')`

## Test Results

### ✅ All Tests Passing

```
 Test Files  28 passed (28)
      Tests  212 passed (212)
   Duration  70.15s
```

**Key Results:**
- **Unit tests:** All 212 passing (including 6 new M2.1 lifecycle validation tests)
- **Integration tests:** All passing (duplicate evidenceId errors eliminated)
- **Normalizer tests:** All passing (duplicate detection still throws as expected)
- **Collector tests:** All passing (deduplication working silently)

### ✅ TypeScript Type Check

```
tsc --noEmit -p tsconfig.json
Exit Code: 0
```

No type errors detected.

## Verification of Fix

### Before Fix
Integration tests failed with:
```
Error: Duplicate evidenceId detected: evidence-37b036a9f565d772
  path: apps/api-server/package.json
  scanners: D1-structure-scanner, D2-runtime-scanner
```

### After Fix
- Duplicate evidenceIds are silently deduplicated at collection time
- First scanner's evidence is preserved, subsequent duplicates are skipped
- Normalizer still throws on duplicates (safety check remains strict)
- All integration tests pass without duplicate errors

## Architecture Impact

### Deduplication Strategy
**First-scanner-wins:** When multiple scanners create evidence with identical evidenceIds:
1. First call to `collector.add()` succeeds and adds to Set + array
2. Subsequent calls with same evidenceId return early (silent skip)
3. Evidence count is reduced but all unique evidence is preserved

### Preserved Behavior
- **Normalizer strictness:** Still throws on duplicates (catches bugs in multi-collector scenarios)
- **Evidence determinism:** EvidenceId generation unchanged (deterministic based on kind+path+hash+symbol)
- **Scanner independence:** Scanners operate independently, no cross-scanner coordination needed

### Future-proof
- New scanners automatically benefit from deduplication
- No per-scanner state management required
- Observability can be added later (e.g., dedup counters) without breaking changes

## Summary

✅ **Primary goal achieved:** All integration tests pass  
✅ **Root cause fixed:** Duplicate evidenceId creation eliminated via collector deduplication  
✅ **No regressions:** All 212 tests passing, TypeScript clean  
✅ **Architecture improved:** Single point of deduplication for all scanners  
✅ **M2.1 compatibility:** Schema version 1.1.0 fully integrated

The fix implements the exact strategy outlined in `scanner-dedup-plan.md` and maintains the normalizer's strict duplicate detection as a safety check while preventing duplicates upstream.
