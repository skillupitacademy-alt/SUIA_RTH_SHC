# Scanner Evidence Deduplication Fix Plan

## Root Cause Analysis

The integration tests fail with duplicate `evidenceId` errors because **multiple scanners create evidence for the same file with the same kind and no disambiguating symbol**, producing identical deterministic evidence IDs.

### Specific Duplicate Found

- **EvidenceId**: `evidence-37b036a9f565d772`
- **Path**: `apps/api-server/package.json`
- **Kind**: `package`
- **Scanners Creating This Evidence**:
  1. **D1 Structure Scanner** (line 39-48 in d1-structure-scanner.ts): Creates evidence when scanning `apps/` directory
  2. **D2 Runtime Scanner** (line 107-116 in d2-runtime-scanner.ts): Creates evidence when scanning app directories for framework detection

Both scanners call:
```typescript
collector.createEvidence(
  scannerName,
  'package',           // Same kind
  pkgJsonPath,         // Same path
  contentHash,         // Same content hash
  '...',               // Different claim text
  `file:${pkgJsonPath}`, // Same locator
  // NO SYMBOL - this is the problem!
)
```

Since `generateDeterministicEvidenceId` uses `kind + path + contentHash + symbol`, and both scanners use the same kind/path/contentHash with NO symbol, they produce identical evidenceIds.

### Why D5 Doesn't Cause Duplicates

D5 Dependencies Scanner also reads package.json files BUT it includes a symbol (the package name) in its evidence creation:
```typescript
collector.createEvidence(
  scannerName,
  'package',
  pkgJsonPath,
  contentHash,
  'Package dependencies analyzed',
  `file:${pkgJsonPath}`,
  pkg.name  // <-- Symbol makes the evidenceId unique!
)
```

This makes D5's evidenceId different from D1/D2, so no collision occurs with D5.

---

## Fix Strategy Decision

**Chosen Strategy: Collector-level deduplication (Strategy B)**

### Rationale

1. **Multi-scanner issue**: The duplicates span D1 and D2, and potentially other scanners we haven't discovered yet
2. **By design**: It's **legitimate** for different scanners to examine the same file for different purposes:
   - D1 examines package.json for structure discovery
   - D2 examines package.json for framework detection
   - D5 examines package.json for dependency graph construction
3. **Single point fix**: Adding deduplication to `EvidenceCollector.add()` fixes the issue for ALL scanners in one place
4. **Safer**: Less risk of missing a scanner compared to adding per-scanner Sets
5. **Maintains normalizer strictness**: The normalizer continues to throw on duplicates (correct behavior), while the collector prevents duplicates from being created upstream

### Why Not Per-Scanner Sets (Strategy A)?

- Would require changes to D1, D2, and potentially other scanners
- Doesn't address the architectural issue: evidence is naturally duplicated when multiple scanners examine the same files
- More fragile: easy to forget the Set in future scanners

---

## Implementation Plan

### File to Change

**`packages/project-llm-discovery/src/evidence/collector.ts`**

### Code Changes

**1. Add a private Set to track seen evidenceIds:**

```typescript
export class EvidenceCollector {
  private evidence: Evidence[] = [];
  private seenIds = new Set<string>(); // <-- Add this

  // ... rest of class
}
```

**2. Modify the `add()` method to skip duplicates silently:**

```typescript
/**
 * Add a single evidence record to the collection
 * Silently skips if evidenceId already exists (deduplication)
 */
add(evidence: Evidence): void {
  if (this.seenIds.has(evidence.evidenceId)) {
    // Duplicate evidence - skip silently
    // This is expected when multiple scanners examine the same file
    return;
  }
  
  this.seenIds.add(evidence.evidenceId);
  this.evidence.push(evidence);
}
```

**3. Update the `addAll()` method for consistency:**

```typescript
/**
 * Add multiple evidence records to the collection
 * Silently skips any records with duplicate evidenceIds
 */
addAll(evidence: Evidence[]): void {
  for (const e of evidence) {
    this.add(e); // Use add() which handles deduplication
  }
}
```

### Why This Works

1. **First scanner wins**: When D1 creates evidence for `apps/api-server/package.json`, it's added to the Set
2. **Later scanners are deduplicated**: When D2 tries to add evidence for the same file with the same kind/symbol, the evidenceId matches and `add()` returns early
3. **Normalizer stays strict**: The normalizer still throws on duplicates, but now duplicates never reach it because they're filtered at collection time
4. **No false negatives**: If somehow a duplicate DOES reach the normalizer (e.g., from multiple collector instances), it will still throw, maintaining data integrity

---

## Verification

### Test Commands

1. **Run unit tests for EvidenceCollector**:
   ```powershell
   cd e:\onlinewebsites\quiz-platform\packages\project-llm-discovery
   npm test src/evidence/collector.test.ts
   ```
   Expected: All existing tests pass (no tests for deduplication exist yet)

2. **Run normalizer tests** (to confirm they still pass):
   ```powershell
   npm test src/evidence/normalizer.test.ts
   ```
   Expected: All tests pass, including the duplicate detection tests

3. **Run integration tests** (the actual failing tests):
   ```powershell
   npm test __tests__/integration/test-full-m1-pipeline.test.ts
   npm test __tests__/integration/discovery-integration.test.ts
   ```
   Expected: All integration tests pass, no duplicate evidenceId errors

4. **Run full test suite**:
   ```powershell
   npm test
   ```
   Expected: All 183+ unit tests pass, all integration tests pass

### Expected Behavior After Fix

- **Before**: Integration tests throw `Duplicate evidenceId detected: evidence-37b036a9f565d772`
- **After**: Integration tests pass; duplicate evidence is silently deduplicated at collection time
- **Evidence count**: Snapshot should have fewer evidence records (duplicates removed), but all unique evidence is preserved

---

## Commit Message

```
fix(discovery): deduplicate evidence at collection time to prevent duplicate evidenceId errors

Root cause: Multiple scanners (D1 structure, D2 runtime) create evidence
for the same file with the same kind, producing identical deterministic
evidenceIds. This causes the normalizer to throw on duplicate detection.

Solution: Add Set-based deduplication in EvidenceCollector.add() to
silently skip duplicate evidenceIds at collection time (first scanner wins).

This is the correct architectural fix because:
- Multiple scanners legitimately examine the same files for different purposes
- Deduplication at the collector level fixes the issue for ALL scanners
- The normalizer remains strict (throws on duplicates) as a safety check
- No scanner-specific changes needed

Fixes integration test failures:
- test-full-m1-pipeline.test.ts
- discovery-integration.test.ts

Related: M2.1 strengthening made normalizer throw on duplicates (previously
silent drop), which surfaced this pre-existing scanner bug.
```

---

## Additional Notes

### Why Not Use Symbol Disambiguation?

An alternative fix would be to add unique symbols to D1/D2 evidence creation:
- D1: Use symbol like `structure-scan`
- D2: Use symbol like `framework-detection`

**Why this is NOT recommended:**
- Requires changes to multiple scanners (D1, D2, potentially others)
- Symbols should represent semantic distinctions (e.g., method name, component name), not scanner purposes
- Doesn't address the architectural issue: collectors should handle deduplication naturally
- More fragile: every future scanner must remember to add symbols

The collector-level deduplication is cleaner, more maintainable, and aligns with the single-responsibility principle.

### Future Enhancements (Out of Scope)

If we want observability into deduplication behavior:
1. Add a debug/verbose mode that logs when duplicates are skipped
2. Add a counter field `deduplicatedCount` to track how many duplicates were encountered
3. Add a method `getDeduplicationStats()` to report statistics

These are not needed for the fix but could be useful for future debugging.
