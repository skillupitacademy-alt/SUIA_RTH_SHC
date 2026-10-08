# M1 Phase 4 — Evidence ID Determinism and Validation Hardening

## Implementation Plan

This plan addresses five confirmed defects from the forensic audit of PR #23. Each item is grounded in the actual codebase at `packages/project-llm-discovery` on branch `m1-repository-discovery`.

---

### Defect 1: Evidence IDs are non-deterministic

**Current State:**
- All six scanners (D1-D6) use `randomUUID()` from `node:crypto` to generate `evidenceId` values
- File: `src/scanners/d1-structure-scanner.ts` line 1: `import { randomUUID } from 'node:crypto';`
- Usage pattern across D1-D6: `evidenceId: randomUUID()` (e.g., D1 lines 44, 60, 96, 112, 155, 171)
- The `EvidenceCollector` class (src/evidence/collector.ts lines 30-36) has a `generateEvidenceId()` method that creates deterministic IDs from `scannerName:path:timestamp`, but **no scanner actually calls it**
- Evidence IDs end up in the `evidence` array of the snapshot, which is serialized and hashed
- The hasher (src/snapshot/hasher.ts line 28) **excludes `evidenceId` from the canonical hash** to work around the non-determinism
- This means: (a) evidence IDs change on every scan, breaking differential analysis, and (b) the hasher cannot include evidence IDs in the integrity guarantee

**Required Fix:**
Replace `randomUUID()` with a deterministic scheme: `SHA-256(kind + normalizedPath + symbol + contentHash) -> evidence-<first16hex>`.

**Why this scheme:**
- `kind`: distinguishes between different evidence types for the same path (e.g., "directory" vs "package")
- `normalizedPath`: ensures cross-platform consistency (forward slashes, no drive letters)
- `symbol`: optional disambiguator when multiple pieces of evidence exist for the same path/kind (e.g., method names, block types)
- `contentHash`: ties the ID to file content; if the file changes, the evidence ID changes
- `evidence-<first16hex>`: human-readable prefix + 16-character hex = collision-resistant, shorter than full SHA-256

---

- [ ] 1. **Add path normalization utility and deterministic ID generator**
      
      Create `src/utils/path-utils.ts` with:
      - `normalizePath(path: string): string` — converts backslashes to forward slashes, lowercases drive letters (e.g., `E:\` → `e:/`), trims leading/trailing slashes
      - `generateDeterministicEvidenceId(kind: string, path: string, contentHash: string, symbol?: string): string` — computes `SHA-256(kind + normalizePath(path) + (symbol ?? '') + contentHash)` and returns `evidence-${hash.slice(0, 16)}`
      
      Files: `src/utils/path-utils.ts` (new file)
      
      Verify: Write unit tests in `__tests__/unit/path-utils.test.ts`:
      - Same inputs → same ID
      - Different paths → different IDs
      - Same path, different content hashes → different IDs
      - Windows path (`apps\\admin`) and Unix path (`apps/admin`) → same normalized path → same ID
      - Optional symbol parameter → different ID
      Run `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/path-utils.test.ts` — all tests pass

---

- [ ] 2. **Update EvidenceCollector to use deterministic ID generation**
      
      Modify `src/evidence/collector.ts`:
      - Remove the existing `generateEvidenceId(scannerName, path, timestamp?)` method (lines 30-36) — it was never called by scanners and includes timestamps, which defeats determinism
      - Add `import { generateDeterministicEvidenceId, normalizePath } from '../utils/path-utils.js';`
      - Add new method: `createEvidence(scannerName: string, kind: Evidence['kind'], path: string, contentHash: string, claim: string, locator: string, symbol?: string, metadata?: Record<string, unknown>): Evidence`
        - Calls `generateDeterministicEvidenceId(kind, path, contentHash, symbol)` to get the `evidenceId`
        - Returns a complete `Evidence` object with `timestamp: new Date().toISOString()`
      
      Files: `src/evidence/collector.ts`
      
      Verify: Update unit tests in `__tests__/unit/evidence-collector.test.ts`:
      - Remove tests for the old `generateEvidenceId` method (lines 127-167)
      - Add tests for `createEvidence`:
        - Same inputs → same `evidenceId`
        - Different content hashes → different `evidenceId`
        - Optional symbol → different `evidenceId`
        - Verify evidence object has all required fields
      Run `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/evidence-collector.test.ts` — all tests pass

---

- [ ] 3. **Update all six scanners (D1-D6) to use deterministic evidence IDs**
      
      For each scanner, replace manual evidence object construction with calls to `collector.createEvidence()`.
      
      **D1 (src/scanners/d1-structure-scanner.ts):**
      - Remove `import { randomUUID } from 'node:crypto';` (line 1)
      - Create `EvidenceCollector` instance at the start of `scanRepositoryStructure()` (currently evidence is a plain array)
      - Replace all `evidence.push({ evidenceId: randomUUID(), ... })` calls (lines 44, 60, 96, 112, 155, 171) with `collector.add(collector.createEvidence(scannerName, kind, path, contentHash, claim, locator))`
      - At the end, `const evidence = collector.getAll();`
      - Note: for directory evidence, pass `contentHash` as empty string `''` since directories don't have content hashes
      
      **D2 (src/scanners/d2-runtime-scanner.ts):**
      - Same pattern: remove `randomUUID`, use `EvidenceCollector`, replace evidence pushes (lines 59, 88, 117, 177)
      
      **D3 (src/scanners/d3-blocks-scanner.ts):**
      - Same pattern: lines 59, 101, 145
      - For block evidence, use the block type/version as the `symbol` parameter to disambiguate multiple blocks in the same documentation file
      
      **D4 (src/scanners/d4-composer-scanner.ts):**
      - Same pattern: lines 51, 77, 107, 135
      - Use composer service/API/schema names as `symbol` when multiple entities exist in the same file
      
      **D5 (src/scanners/d5-dependencies-scanner.ts):**
      - Same pattern: line 60
      
      **D6 (src/scanners/d6-tests-scanner.ts):**
      - Same pattern: lines 44, 136, 194, 241
      - Use test suite names as `symbol` to disambiguate multiple test files in the same directory
      
      Files: `src/scanners/d1-structure-scanner.ts`, `src/scanners/d2-runtime-scanner.ts`, `src/scanners/d3-blocks-scanner.ts`, `src/scanners/d4-composer-scanner.ts`, `src/scanners/d5-dependencies-scanner.ts`, `src/scanners/d6-tests-scanner.ts`
      
      Verify: Run integration test `pnpm --filter @quiz/project-llm-discovery test __tests__/integration/test-determinism.ts` — canonical hashes should remain identical across runs

---

- [ ] 4. **Update snapshot hasher to INCLUDE evidenceId in canonical hash**
      
      Now that evidence IDs are deterministic, they can be included in the integrity guarantee.
      
      Modify `src/snapshot/hasher.ts`:
      - In `removeTimestamps()` function (line 28), remove `'evidenceId'` from the exclusion list (currently line 28: `if (key === 'timestamp' || key === 'scanTimestamp' || key === 'evidenceId' || key === 'findingId')`)
      - Keep excluding `timestamp`, `scanTimestamp`, and `findingId` (findings use randomUUID and are not deterministic)
      - Update the JSDoc comment (line 3) to reflect that `evidenceId` is now included
      
      Files: `src/snapshot/hasher.ts`
      
      Verify: Run `pnpm --filter @quiz/project-llm-discovery test __tests__/integration/test-determinism.ts` — canonical hashes must still be identical across runs, proving evidenceId determinism

---

- [ ] 5. **Update Evidence contract documentation**
      
      Document the deterministic ID scheme in the Evidence interface.
      
      Modify `src/contracts/evidence.ts`:
      - Add JSDoc comments above the `Evidence` interface explaining:
        - `evidenceId` is deterministic: `evidence-<first16hex>` where hex = `SHA-256(kind + normalizedPath + symbol + contentHash)`
        - Evidence kinds and their meanings (already enumerated in the interface, add descriptions)
        - `locator` format (e.g., `file:path`, `directory:path`)
        - `contentHash` is SHA-256 of file content, or empty string for directories
      
      Files: `src/contracts/evidence.ts`
      
      Verify: Run `pnpm --filter @quiz/project-llm-discovery type-check` — no type errors

---

### Defect 2: V1 uses `z.any()` extensively

**Current State:**
- **ALREADY FIXED** — V1 validator (src/validation/v1-schema-validator.ts) uses proper Zod schemas for all fields
- Lines 6-201 define strict schemas: `ApplicationInfoSchema`, `PackageInfoSchema`, `ServiceInfoSchema`, `FrameworkInfoSchema`, `WorkspaceInfoSchema`, `BuildSystemInfoSchema`, `BlockFamilyDocSchema`, `BlockImplementationSchema`, `BlockRendererSchema`, `BlockVerificationSchema`, `BlockDiscrepancySchema`, `ComposerServiceSchema`, `ComposerAPISchema`, `ComposerSchemaObjSchema`, `ComposerUISchema`, `DependencyNodeSchema`, `DependencyEdgeSchema`, `TestSuiteSchema`, `FindingSchema`, `EvidenceSchema`, `SnapshotSchema`
- No `z.any()` usage found in the file
- The audit report was based on an earlier commit; this has been corrected in the current branch state

**Required Action:**
- Confirm the fix is present and update the M1 attestation to reflect this

---

- [ ] 6. **Verify V1 validator has no `z.any()` usage and document the fix**
      
      Inspect `src/validation/v1-schema-validator.ts` to confirm no `z.any()` calls exist. All schemas must use proper Zod types.
      
      Files: `src/validation/v1-schema-validator.ts` (read-only inspection)
      
      Verify: Run `pnpm --filter @quiz/project-llm-discovery test __tests__/integration/discovery-integration.test.ts` — validation passes with proper schema enforcement, no `z.any()` bypasses

---

### Defect 3: V3 is warning-only

**Current State:**
- File: `src/validation/v3-evidence-paths-validator.ts`
- Lines 10-28: `validateEvidencePaths()` checks if each evidence path exists using `adapter.fileExists(evidence.path)`
- Line 14: When a path does not exist, it pushes to `warnings` array, never to `errors`
- Result: missing evidence paths leave `valid: true` in the validation result
- No distinction between critical evidence (e.g., source definitions, renderer registrations) and historical evidence (e.g., old files that have moved)
- No content hash verification even when the file exists

**Required Fix:**
- Distinguish critical evidence kinds that must produce errors vs historical evidence that produces warnings
- Verify content hash matches when the file exists
- Critical kinds: `SOURCE_DEFINITION` (renamed from `type-definition`), `RENDERER_REGISTRATION` (renamed from `component`), `COMPOSER_SERVICE` (renamed from `service`)
- Historical/non-critical: all other kinds

---

- [ ] 7. **Update Evidence contract with critical evidence kind distinction**
      
      Modify `src/contracts/evidence.ts`:
      - Add JSDoc comment above the `kind` field explaining which kinds are critical (missing = error) vs historical (missing = warning)
      - Critical: evidence that represents current implementation state (type definitions, components, services)
      - Historical: evidence that represents discovery artifacts (directories, imports, documentation)
      
      Files: `src/contracts/evidence.ts`
      
      Verify: Run `pnpm --filter @quiz/project-llm-discovery type-check` — no errors

---

- [ ] 8. **Harden V3 validator to error on missing critical evidence and verify content hashes**
      
      Modify `src/validation/v3-evidence-paths-validator.ts`:
      - Define critical evidence kinds: `const CRITICAL_KINDS: Set<Evidence['kind']> = new Set(['type-definition', 'component', 'service']);`
      - For each evidence record:
        - If file does not exist:
          - If `CRITICAL_KINDS.has(evidence.kind)`: push to `errors` with code `CRITICAL_EVIDENCE_PATH_NOT_FOUND`
          - Else: push to `warnings` with code `HISTORICAL_EVIDENCE_PATH_NOT_FOUND`
        - If file exists:
          - Compute current content hash: `const currentHash = await adapter.getFileHash(evidence.path);`
          - If `currentHash !== evidence.contentHash`: push to `warnings` with code `EVIDENCE_CONTENT_HASH_MISMATCH` (warning, not error, because files may have changed since scan — this is differential detection)
      - Update JSDoc to document the critical/historical distinction
      
      Files: `src/validation/v3-evidence-paths-validator.ts`
      
      Verify: Write unit tests in `__tests__/unit/v3-evidence-paths-validator.test.ts` (new file):
      - Mock adapter with `fileExists()` returning false for critical evidence kind → validation returns error
      - Mock adapter with `fileExists()` returning false for non-critical kind → validation returns warning
      - Mock adapter with `fileExists()` returning true but mismatched hash → validation returns warning with hash mismatch code
      - Mock adapter with matching hash → no error, no warning
      Run `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/v3-evidence-paths-validator.test.ts` — all tests pass

---

### Defect 4: V8 uses weak keyword matching

**Current State:**
- File: `src/validation/v8-evidence-completeness-validator.ts`
- Lines 12-23: Build a `Set<string>` of keywords extracted from all evidence claims by splitting on whitespace
- Lines 26-37, 40-51, 54-65, 68-79, 82-93: Check if entity exists in `evidenceByPath` map OR `hasMatchingEvidence(entityName, evidenceClaimKeywords)`
- `hasMatchingEvidence()` (lines 98-107): splits entity name on `/`, `-`, `_`, `@` and checks if any keyword >2 chars exists in the evidence keywords set
- Result: weak substring matching — an entity `foo-admin` can pass by coincidence because `"admin"` appears in an unrelated evidence claim

**Required Fix:**
- Use exact normalized-path matching: `normalizePath(evidence.path) === normalizePath(entity.path)`
- Remove keyword-based matching entirely

---

- [ ] 9. **Replace V8 keyword matching with exact path matching**
      
      Modify `src/validation/v8-evidence-completeness-validator.ts`:
      - Add `import { normalizePath } from '../utils/path-utils.js';` at the top
      - Remove `evidenceClaimKeywords` set construction (lines 13-23)
      - Remove `hasMatchingEvidence()` function (lines 98-107)
      - Build a `Set<string>` of normalized evidence paths: `const evidencePaths = new Set(snapshot.evidence.map(e => normalizePath(e.path)));`
      - For each entity check (applications lines 26-37, packages lines 40-51, services lines 54-65, blocks lines 68-79, composer lines 82-93):
        - Replace `if (!evidenceByPath.has(app.path) && !hasMatchingEvidence(app.name, evidenceClaimKeywords))` with `if (!evidencePaths.has(normalizePath(app.path)))`
        - Simplify warning messages to just state "No evidence found for <entity type>: <entity name>"
      
      Files: `src/validation/v8-evidence-completeness-validator.ts`
      
      Verify: Write unit tests in `__tests__/unit/v8-evidence-completeness-validator.test.ts` (new file):
      - Snapshot with application at `apps/admin` and evidence at `apps/admin/package.json` → no warning
      - Snapshot with application at `apps/admin` and evidence at `apps/other/package.json` → warning
      - Snapshot with Windows path in entity (`apps\\admin`) and Unix path in evidence (`apps/admin`) → no warning (normalization works)
      Run `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/v8-evidence-completeness-validator.test.ts` — all tests pass

---

### Defect 5: Determinism mutation test

**Current State:**
- File: `__tests__/integration/test-determinism.ts` exists but only tests that two scans of the same repo produce the same hash
- No test proving that modifying a file changes the canonical hash (mutation detection)
- No test proving that evidence IDs remain stable across scans (currently they don't, but will after fix #1)

**Required Fix:**
- Add a vitest test suite in `__tests__/integration/determinism.test.ts` (new file) with:
  - Test 1: Two scans of the same repo → identical canonical hashes
  - Test 2: Two scans of the same repo → identical evidence IDs for the same files
  - Test 3: Mock a file change (modify content hash) → different canonical hash (mutation detection)

---

- [ ] 10. **Create comprehensive determinism test suite**
      
      Create `__tests__/integration/determinism.test.ts` with three tests:
      
      **Test 1: "should produce identical canonical hashes for same repository state"**
      - Build snapshot twice with `buildSnapshot(repositoryRoot, adapter)`
      - Assert `snapshot1.canonicalHash === snapshot2.canonicalHash`
      - Assert `snapshot1.repository.scanTimestamp !== snapshot2.repository.scanTimestamp` (timestamps differ, but hash does not)
      
      **Test 2: "should produce identical evidence IDs for same files across scans"**
      - Build snapshot twice
      - For each evidence in snapshot1, find matching evidence in snapshot2 by path + kind
      - Assert `evidence1.evidenceId === evidence2.evidenceId`
      - This proves evidence IDs are deterministic based on file content, not random
      
      **Test 3: "should detect file mutations via canonical hash change"**
      - Build snapshot1
      - Create a mock adapter that wraps the real adapter but overrides `getFileHash()` for one specific file to return a different hash
      - Build snapshot2 with the mock adapter
      - Assert `snapshot1.canonicalHash !== snapshot2.canonicalHash`
      - This proves the canonical hash is sensitive to file content changes
      
      Files: `__tests__/integration/determinism.test.ts` (new file)
      
      Verify: Run `pnpm --filter @quiz/project-llm-discovery test __tests__/integration/determinism.test.ts` — all three tests pass

---

## Verification Strategy

After implementing all fixes, run the full test suite and type-check:

```bash
pnpm --filter @quiz/project-llm-discovery type-check
pnpm --filter @quiz/project-llm-discovery test
```

Expected results:
- All unit tests pass
- All integration tests pass
- Determinism test proves:
  - Same repo state → same canonical hash
  - Same files → same evidence IDs
  - File mutation → different canonical hash
- V3 validator errors on missing critical evidence
- V8 validator uses exact path matching
- No `z.any()` in V1 validator (already fixed)

## Implementation Dependencies

- Item 1 must complete before item 2 (path utils needed by collector)
- Item 2 must complete before item 3 (collector method needed by scanners)
- Item 3 must complete before item 4 (deterministic IDs needed to include in hash)
- Item 7 must complete before item 8 (contract documentation before validator)
- Item 1 must complete before item 9 (path utils needed by V8 validator)
- All fixes must complete before item 10 (determinism tests verify all fixes)

## Cascading Changes

**Files that import Evidence:**
- All scanners (D1-D6) — updated in item 3
- `src/evidence/normalizer.ts` — no changes needed (validates fields, doesn't create evidence)
- `src/snapshot/builder.ts` — no changes needed (just aggregates evidence arrays)
- `src/validation/v3-evidence-paths-validator.ts` — updated in item 8
- `src/validation/v8-evidence-completeness-validator.ts` — updated in item 9

**Files that import EvidenceCollector:**
- `src/snapshot/builder.ts` — no changes needed (uses `addAll()` and `getAll()`, not `createEvidence()`)

**Test files requiring updates:**
- `__tests__/unit/evidence-collector.test.ts` — updated in item 2
- All unit tests for scanners (if they exist) — may need to mock `EvidenceCollector.createEvidence()`

## Risk Assessment

**Low risk:**
- Items 1, 2, 5, 6, 7, 10 (new code, documentation, tests)

**Medium risk:**
- Item 3 (updates all six scanners; any mistake breaks discovery)
- Item 4 (includes evidenceId in hash; must verify determinism holds)

**Medium-high risk:**
- Item 8 (changes V3 from warning-only to error; may break existing workflows if critical evidence is actually missing)
- Item 9 (V8 path matching change may expose entities that previously passed by keyword coincidence)

## Success Criteria

1. Evidence IDs are deterministic and collision-resistant
2. Canonical hash includes evidence IDs
3. Running buildSnapshot twice produces identical evidence IDs for unchanged files
4. V1 validator has no `z.any()` (already confirmed)
5. V3 validator errors on missing critical evidence, verifies content hashes
6. V8 validator uses exact normalized path matching
7. Determinism test suite proves stability and mutation detection
8. All tests pass, no type errors
9. M1 package is ready for merge after attestation update

---

## Notes

- The `EvidenceCollector.generateEvidenceId()` method exists but was never used — scanners always called `randomUUID()` directly
- The snapshot hasher excludes `evidenceId` from the canonical hash as a workaround for non-determinism — this can be removed after fix #1
- V1 validator was already fixed in a prior commit; the audit report reflects an earlier state
- D3 blocks scanner (lines 386-410) has a `crossReferenceBlocks()` function that comments say "VERIFIED = documented + type definition + renderer exists + UBRC compliant" but the implementation only checks documented + renderer, not UBRC — this is a separate issue not covered in this phase
- The `findingId` field in findings uses `randomUUID()` and is excluded from the canonical hash — this is acceptable because findings are advisory, not part of the integrity guarantee
- Path normalization must handle both Windows (`\`) and Unix (`/`) separators, and drive letters (`E:\` → `e:/`)
