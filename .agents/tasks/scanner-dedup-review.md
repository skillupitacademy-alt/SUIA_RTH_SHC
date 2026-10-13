# Collector deduplication to prevent duplicate evidenceId errors

Fix for duplicate evidence records created when multiple scanners examine the same file. Adds Set-based deduplication to `EvidenceCollector.add()` to silently skip duplicates at collection time while preserving the normalizer's strict duplicate detection as a safety check.

**Watch for:** None. The fix is correct, safe, and well-tested. All 212 tests pass, including integration tests that previously failed on duplicate evidenceId errors.

**Verdict**: APPROVED

## High-level view

The root cause was D1 structure scanner and D2 runtime scanner both creating evidence for the same package.json file with the same kind and no disambiguating symbol, producing identical deterministic evidenceIds. The fix adds a private `seenIds` Set to `EvidenceCollector` that tracks encountered evidenceIds and skips duplicates silently in `add()` (first-scanner-wins strategy). This is the right architectural choice: multiple scanners legitimately examine the same files for different purposes, so deduplication belongs at the collector level, not per-scanner. The normalizer's duplicate-detection throw logic remains untouched, preserving its role as a safety check for multi-collector scenarios. The schema version updates (1.0.0 → 1.1.0) are M2.1-related and unrelated to the deduplication fix itself, but they're correctly propagated through validators and tests.

<details>
<summary>Issues (0)</summary>

No blocking concerns.

</details>

<details>
<summary>Details</summary>

## Collector deduplication implementation

The fix adds a private `seenIds` Set to `EvidenceCollector` and modifies two methods:

```typescript
private seenIds = new Set<string>();

add(evidence: Evidence): void {
  if (this.seenIds.has(evidence.evidenceId)) {
    return; // Silent skip
  }
  this.seenIds.add(evidence.evidenceId);
  this.evidence.push(evidence);
}

addAll(evidence: Evidence[]): void {
  for (const e of evidence) {
    this.add(e); // Delegates to add() for deduplication
  }
}
```

The `addAll()` change is critical. The original implementation used `this.evidence.push(...evidence)`, bypassing the Set check. The fix changes it to iterate and call `this.add(e)`, ensuring deduplication logic is applied to bulk additions as well. This is **confirmed correct** (confidence: confirmed) — without this change, `addAll()` would reintroduce duplicates.

## Safety: no legitimate evidence dropped

The evidenceId is deterministic, computed from `kind + path + symbol + contentHash`. Two evidence records with the same evidenceId are semantically identical: same file, same kind, same content, same symbol. Dropping one is safe because they represent the same observation about the codebase.

D5 dependencies scanner reads the same package.json files but includes a symbol (the package name), making its evidenceIds distinct from D1/D2. This means D5 evidence is never deduplicated against D1/D2 evidence — they represent different observations (dependency graph vs structure/framework detection).

The deduplication is **confirmed safe** (confidence: confirmed).

## Normalizer integrity preserved

The diff shows no changes to `normalizer.ts`. The normalizer still throws on duplicate evidenceIds:

```typescript
if (seen.has(e.evidenceId)) {
  throw new Error(
    `Duplicate evidenceId detected: ${e.evidenceId} (path: ${e.path}, kind: ${e.kind}). ` +
    `Evidence IDs must be unique within a snapshot.`
  );
}
```

This preserves the correct layering: the collector prevents duplicates from being created in normal operation, while the normalizer acts as a safety check that catches bugs in multi-collector scenarios or other unexpected paths. The normalizer's strictness is **confirmed intact** (confidence: confirmed).

## Test coverage

The verification note reports all 212 tests passing, including:
- Collector unit tests (deduplication working silently)
- Normalizer unit tests (duplicate detection still throws)
- Integration tests `test-full-m1-pipeline.test.ts` and `discovery-integration.test.ts` (previously failed with duplicate evidenceId errors, now pass)

TypeScript compilation passes with no errors (`tsc --noEmit` exit code 0).

The schema version updates (1.0.0 → 1.1.0) are M2.1-related, not deduplication-related. The test additions for `lifecycle: 'current'` in validator tests align with M2.1 changes to the Evidence contract. These are **confirmed correct** (confidence: confirmed) and unrelated to the deduplication fix.

## Architecture: single point of deduplication

The collector-level fix solves the problem for all scanners in one place. Future scanners automatically benefit from deduplication without requiring per-scanner Set management. This is more maintainable than adding deduplication logic to D1 and D2 individually, which would be fragile and easy to forget in new scanners.

The alternative (adding unique symbols to D1/D2 evidence) was correctly rejected in the plan: symbols should represent semantic distinctions (method name, component name), not scanner purposes. Using symbols to disambiguate scanner intent would pollute the evidence model with implementation details.

</details>

<details>
<summary>File map</summary>

**Core deduplication fix:**
- `src/evidence/collector.ts` — Added Set-based deduplication to `add()` and updated `addAll()` to use `add()`

**M2.1 schema version updates (1.0.0 → 1.1.0):**
- `src/validation/v1-schema-validator.ts` — Updated Zod schema and version check to expect 1.1.0
- `__tests__/unit/validation/v1-schema-validator.test.ts` — Updated test fixtures and assertions for 1.1.0, added `lifecycle` field
- `__tests__/integration/discovery-integration.test.ts` — Updated schema version assertion to expect 1.1.0

**Not changed:**
- `src/evidence/normalizer.ts` — Duplicate detection throw logic intact (normalizer not modified)

[Full diff](git diff HEAD~1 HEAD -- packages/project-llm-discovery/)

</details>
