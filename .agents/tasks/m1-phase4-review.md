# M1 Phase 4 Evidence Hardening - Deterministic IDs and Validator Strengthening

This change implements the five defects identified in the PR #23 forensic audit: evidence IDs are now deterministic (SHA-256 based), V3 validator distinguishes critical vs historical evidence, V8 validator uses exact normalized path matching instead of weak keyword matching, and the snapshot hasher now includes evidenceId in canonical hash computation. All six scanners (D1-D6) now use the new deterministic ID generation, and a comprehensive determinism test suite proves hash stability and mutation detection.

**Watch for:** Directory evidence passes empty string for contentHash (confirmed correct), but V3 validator skips hash checks only when contentHash is exactly empty string—any whitespace or formatting issue would trigger false positives. Determinism tests run against the live monorepo with 60-second timeout, making them susceptible to filesystem state changes between test executions. Commit message claims "All 167 tests pass" but provides no test run evidence.

**Verdict**: CHANGES_REQUESTED

## High-level view

Evidence IDs are now generated as SHA-256 hashes of (kind + normalizedPath + symbol + contentHash), replacing the previous randomUUID approach. Path normalization handles Windows drive letters, backslashes, and trailing slashes to ensure cross-platform determinism. The EvidenceCollector gained a `createEvidence` method that encapsulates ID generation, and all six scanners use it consistently.

The snapshot hasher now includes evidenceId in canonical hash computation by removing it from the exclusion list in `removeTimestamps()`. Since evidence IDs are deterministic, including them strengthens integrity guarantees without breaking hash stability.

V3 validator splits evidence into critical (type-definition, component, service) and historical (everything else), generating errors for missing critical evidence and warnings for missing historical evidence. Content hash mismatches on existing files produce warnings regardless of criticality.

V8 validator replaced substring keyword matching with exact normalized path matching. It builds a Set of normalized evidence paths, then checks entity paths using `startsWith` containment logic. The old `hasMatchingEvidence` keyword extraction is gone.

Determinism test suite includes three integration tests: hash stability across scans, evidence ID stability for same files, and mutation detection via canonical hash change. All use the live quiz-platform monorepo as test subject.

<details>
<summary>Issues (3)</summary>

1. **Determinism test filesystem dependency** — Tests run against live monorepo with 60-second timeout; file changes between scans could break hash stability test. Mock adapter or use isolated fixture directory.
2. **V3 contentHash empty string check fragility** — Validator skips hash verification when `contentHash !== ''` is false, meaning any whitespace would trigger unnecessary hash lookups. Add explicit directory kind check or document that empty string is the contract.
3. **Missing test evidence in commit** — Commit message states "All 167 tests pass" but provides no CI output, test run timestamp, or note file. Cannot verify test execution actually occurred.

</details>

<details>
<summary>Details</summary>

## Deterministic evidence ID generation

The new `generateDeterministicEvidenceId` function in `path-utils.ts` replaces randomUUID with SHA-256 hashing. The input string concatenates kind, normalizedPath, optional symbol, and contentHash. The function returns `evidence-<first16hex>` where the 16 hex characters are the first 16 digits of the SHA-256 digest.

Path normalization is critical for cross-platform determinism. The `normalizePath` function converts backslashes to forward slashes, lowercases Windows drive letters (E:\ → e:/), and trims leading/trailing slashes. This ensures that `apps\admin\package.json` on Windows produces the same evidence ID as `apps/admin/package.json` on Unix.

The symbol parameter disambiguates multiple evidence records at the same path. D3 scanner uses block type (e.g., "TextBlockV1"), D4 uses entity names (e.g., "TutorialComposerService"), and D6 uses test file names. When symbol differs, evidence IDs differ even if path and contentHash are identical.

Unit tests confirm: same inputs produce same ID, different path/kind/contentHash/symbol produce different IDs, Windows and Unix paths produce same ID, and the ID format matches `/^evidence-[0-9a-f]{16}$/`.

## EvidenceCollector createEvidence method

The EvidenceCollector gained a `createEvidence` method that encapsulates evidence record construction. It takes scannerName, kind, path, contentHash, claim, locator, optional symbol, and optional metadata. It calls `generateDeterministicEvidenceId` internally, generates a timestamp, and returns a complete Evidence object.

All six scanners now call `collector.createEvidence(...)` instead of constructing evidence objects manually. The old pattern was:

```typescript
{
  evidenceId: randomUUID(),
  scannerName: 'D1-scanner',
  timestamp: new Date().toISOString(),
  path,
  kind,
  claim,
  locator,
  contentHash,
}
```

The new pattern is:

```typescript
collector.createEvidence(
  scannerName,
  kind,
  path,
  contentHash,
  claim,
  locator,
  symbol,
  metadata
)
```

This consolidates ID generation logic in one place and ensures consistent ID format across all scanners.

## Scanner migration to createEvidence

All six scanners (D1-D6) now use `collector.createEvidence`. Directory evidence passes empty string for contentHash. File evidence passes the SHA-256 hash from `adapter.getFileHash(path)`.

D1 structure scanner uses no symbol parameter—directory and package evidence are unambiguous within their paths.

D3 blocks scanner uses block type as symbol: `blockSymbol = rendererInfo?.blockType ?? tsxFile.split('/').pop()?.replace('.tsx', '') ?? ''`. This ensures that if multiple block types share the same renderer file path (unlikely but possible), they get distinct evidence IDs.

D4 composer scanner uses entity names as symbol: `'TutorialComposerService'` for service evidence, API route names for api-route evidence. This disambiguates when multiple entities exist in the same file.

D6 tests scanner uses test file names as symbol: `testName = testFile.split('/').pop()?.replace('.test.ts', '') ?? ''`. This disambiguates multiple test files in the same directory (though evidence is per-file, so this is defensive).

D2 runtime scanner and D5 dependencies scanner use no symbol parameter—their evidence kinds and paths are unambiguous.

Grep search confirms no scanner still calls `randomUUID()` for evidence IDs. The remaining `randomUUID` calls are for `findingId` generation, which is correct—findings are non-deterministic and not included in canonical hash.

## Snapshot hasher includes evidenceId

The `removeTimestamps` function in `snapshot/hasher.ts` previously excluded `evidenceId` from canonical hash computation (along with `timestamp`, `scanTimestamp`, and `findingId`). This was necessary when evidence IDs were random UUIDs—including them would break hash determinism.

The exclusion list is now: `timestamp`, `scanTimestamp`, `findingId`. The `evidenceId` field is no longer excluded. Since evidence IDs are now deterministic, including them strengthens the integrity guarantee: if an evidence record's ID changes, the canonical hash changes, signaling a mutation.

The JSDoc comment states "evidenceId is now included in hash (deterministic since phase 4)".

## Evidence contract documentation

The Evidence interface in `contracts/evidence.ts` gained extensive JSDoc explaining the deterministic ID scheme, the format (`evidence-<first16hex>`), the generation algorithm (SHA-256 of kind + path + symbol + contentHash), and the benefits (stable references, differential analysis, inclusion in canonical hash).

The JSDoc also documents the critical vs historical evidence distinction:

- **Critical kinds** (missing = validation error): type-definition, component, service
- **Historical kinds** (missing = validation warning): all others

This distinction drives V3 validator behavior.

## V3 validator: critical vs historical evidence

The V3 validator now defines a `CRITICAL_KINDS` set containing `type-definition`, `component`, and `service`. When evidence is missing, the validator checks whether the evidence kind is critical:

- Critical evidence missing → `errors.push({ code: 'CRITICAL_EVIDENCE_PATH_NOT_FOUND', ... })`
- Historical evidence missing → `warnings.push({ code: 'HISTORICAL_EVIDENCE_PATH_NOT_FOUND', ... })`

Existing files with content hash mismatches produce warnings (code: `EVIDENCE_CONTENT_HASH_MISMATCH`) regardless of criticality.

The validator skips hash verification for directories by checking `if (evidence.contentHash !== '')`. When contentHash is empty string, the file hash lookup is skipped. This relies on scanners consistently passing empty string for directories—if a scanner passes whitespace or null, the check fails.

**Concern:** The check `if (evidence.contentHash !== '')` is fragile. If a scanner accidentally passes `' '` (space) or `null` instead of `''`, the validator would attempt to call `adapter.getFileHash(evidence.path)` on a directory, which may fail or return a meaningless hash. More defensive: `if (evidence.contentHash !== '' && evidence.kind !== 'directory')` or `if (evidence.contentHash)` (relying on falsy check). The current implementation assumes scanners always pass exactly empty string for directories.

## V8 validator: exact path matching

The V8 validator previously used `hasMatchingEvidence(entityName, evidenceKeywords)` where `evidenceKeywords` was built by splitting evidence claims on `/`, `-`, `_`, `@` and collecting keywords longer than 2 characters. Entity names were similarly split, and the function checked for any keyword overlap. This produced false positives (weak matching) and was language-dependent.

The new implementation builds a `Set<string>` of normalized evidence paths:

```typescript
const evidencePaths = new Set<string>(
  snapshot.evidence.map(e => normalizePath(e.path))
);
```

For each entity (application, package, service, block, composer), it checks:

```typescript
function hasEvidenceForPath(entityPath: string): boolean {
  const normalizedEntityPath = normalizePath(entityPath);
  for (const evidencePath of evidencePaths) {
    if (evidencePath.startsWith(normalizedEntityPath + '/') || 
        evidencePath.startsWith(normalizedEntityPath + '\\') ||
        evidencePath === normalizedEntityPath) {
      return true;
    }
  }
  return false;
}
```

This checks if any evidence path is within the entity directory or matches the entity path exactly. The `startsWith` checks include both forward and backward slashes for safety, though normalization should already convert backslashes to forward slashes.

**Concern (resolved on analysis):** The `startsWith` logic initially appears to produce false positives for prefix-sharing paths like `apps/admin` matching `apps/admin-backup`. However, the trailing `/` in the check (`evidencePath.startsWith(normalizedEntityPath + '/')`) prevents this: `'apps/admin-backup/file.ts'.startsWith('apps/admin/')` is false. The logic is sound for directory containment. Note that the requirements describe this as "exact path matching" but the implementation correctly uses directory containment (checking if evidence exists within entity directory), which is the right semantic for multi-file entities.

## Determinism integration tests

The new `__tests__/integration/determinism.test.ts` file contains three integration tests, all with 60-second timeout:

1. **Hash stability**: Build snapshot twice, verify `canonicalHash` is identical. Timestamps differ (excluded from hash), but hash must be identical for same repository state.
2. **Evidence ID stability**: Build snapshot twice, construct maps of `path:kind → evidenceId`, verify matching evidence has matching IDs.
3. **Mutation detection**: Build baseline snapshot, create mock adapter that overrides `getFileHash('package.json')` to return different hash, build second snapshot, verify canonical hashes differ.

All three tests use `FilesystemRepositoryAdapter(join(process.cwd(), '../..'))` to scan the live quiz-platform monorepo.

The mutation detection test mocks only `getFileHash` for one file, leaving all other adapter methods unchanged. This simulates a file mutation without actually modifying the filesystem.

**Concern:** The tests run against the live monorepo with 60-second timeout. If the monorepo is large or the filesystem is slow, scans could time out. If files change between scans (e.g., due to hot-reload, IDE autosave, or concurrent git operations), the hash stability test produces false negatives. More robust: use a fixture directory with known stable contents, or mock the adapter entirely for determinism tests.

## Test coverage

New tests added:

- `path-utils.test.ts`: 17 tests covering normalizePath edge cases and generateDeterministicEvidenceId properties
- `evidence-collector.test.ts`: 8 new tests for `createEvidence` method (4 existing tests for add/addAll remain)
- `v3-evidence-paths-validator.test.ts`: 11 tests covering critical/historical distinction, hash mismatch warnings, directory handling
- `v8-evidence-completeness-validator.test.ts`: 6 tests covering path matching, normalization, and mixed evidence scenarios
- `determinism.test.ts`: 6 integration tests (3 unique test cases, some tests have multiple assertions)

Total new test count: 17 + 8 + 11 + 6 + 6 = 48 new tests (the review prompt states "19 new tests (8 unit, 11 integration)" but actual count is higher).

The commit message states "All 167 tests pass" but provides no test execution evidence (CI output, test run timestamp, note file).

</details>

---

<details>
<summary>File map</summary>

### New files

- `packages/project-llm-discovery/src/utils/path-utils.ts` — Path normalization and deterministic evidence ID generation
- `packages/project-llm-discovery/__tests__/unit/path-utils.test.ts` — Unit tests for path utils
- `packages/project-llm-discovery/__tests__/integration/determinism.test.ts` — Integration tests for hash and evidence ID stability

### Modified files

- `packages/project-llm-discovery/src/evidence/collector.ts` — Added createEvidence method with deterministic ID generation
- `packages/project-llm-discovery/__tests__/unit/evidence-collector.test.ts` — Added tests for createEvidence
- `packages/project-llm-discovery/src/scanners/d1-structure-scanner.ts` — Migrated to createEvidence, removed randomUUID for evidence
- `packages/project-llm-discovery/src/scanners/d2-runtime-scanner.ts` — Migrated to createEvidence
- `packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts` — Migrated to createEvidence, uses block type as symbol
- `packages/project-llm-discovery/src/scanners/d4-composer-scanner.ts` — Migrated to createEvidence, uses entity names as symbol
- `packages/project-llm-discovery/src/scanners/d5-dependencies-scanner.ts` — Migrated to createEvidence
- `packages/project-llm-discovery/src/scanners/d6-tests-scanner.ts` — Migrated to createEvidence, uses test names as symbol
- `packages/project-llm-discovery/src/snapshot/hasher.ts` — Removed evidenceId from exclusion list in removeTimestamps
- `packages/project-llm-discovery/src/contracts/evidence.ts` — Added JSDoc for deterministic IDs and critical vs historical evidence
- `packages/project-llm-discovery/src/validation/v3-evidence-paths-validator.ts` — Added CRITICAL_KINDS set, distinguish errors vs warnings, added hash mismatch detection
- `packages/project-llm-discovery/__tests__/unit/v3-evidence-paths-validator.test.ts` — Rewrote tests for new behavior (old version removed)
- `packages/project-llm-discovery/src/validation/v8-evidence-completeness-validator.ts` — Replaced keyword matching with normalized path containment checking, removed hasMatchingEvidence function
- `packages/project-llm-discovery/__tests__/unit/v8-evidence-completeness-validator.test.ts` — Rewrote tests for new behavior (old version removed)

### Planning artifacts (not reviewed)

- `.agents/tasks/d3-fix-plan.md`, `.agents/tasks/m1-error-hardening-plan.md`, `.agents/tasks/m1-phase1-report.md`, `.agents/tasks/m1-phase4-plan.md`, `.agents/tasks/m1-snapshot-test.json`, `.agents/artifacts/m1-phase2-error-hardening-completion.md`

[Full diff: commit 2908e0f4]

</details>
