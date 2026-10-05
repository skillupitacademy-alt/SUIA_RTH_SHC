# M1 Repository Discovery — Implementation Plan

**Status:** READY FOR IMPLEMENTATION  
**Date:** 2026-01-20  
**Baseline Commit:** 516b7bf6  
**Authorization:** HAA Approved (2026-10-05)  
**Workspace:** e:\onlinewebsites\quiz-platform  

---

## Executive Summary

This plan implements **M1 Repository Discovery**: an automated, deterministic system for discovering repository structure, runtime configuration, Educational Block Families (18 families, 133 versions), Tutorial Composer, dependencies, and test infrastructure. The system generates evidence-based snapshots with SHA-256 determinism guarantees and validates against 9 integrity checks (V1-V9).

### Discovered Repository State

- **12 applications** (apps/): realtutorialhub-quiz, realtutorialhub-admin, skillhubcore-admin, etc.
- **21 packages** (packages/): types, ui, db-tutorial, db-*, auth, validation, observability, etc.
- **3 services** (services/): api-gateway, skillhubcore-service, analytics-collector-service
- **18 Educational Block Families documented**, 3 verified (I1, C1, D1), 1 incomplete (S1), 14 planned
- **1 Tutorial Composer** (packages/db-tutorial/src/services/tutorial-composer.service.ts) — CONFIRMED, no parallel Composer
- **Test Infrastructure:** Vitest v4.0.18 (unit/integration), Playwright v1.62.1 (E2E)
- **Build System:** pnpm v9.15.4 + Turbo v2.3.3, Next.js 16.1.6, Node.js 20.x

### Key Design Decisions

1. **No LLM Dependency in Core Discovery**: All scanners use deterministic file parsing (regex, AST, JSON/YAML parsing). LLM-assisted analysis deferred to M2.

2. **Repository Adapter Abstraction**: All scanners read through `RepositoryAdapter` interface, not direct `fs` calls. Enables testing with mocks and future extension to remote repositories (GitRepositoryAdapter).

3. **4-State Block Model**: D3 BLOCKS scanner maintains DOCUMENTED, IMPLEMENTED, RENDERED, VERIFIED as separate states. Never collapsed. Reflects actual discovery outcomes, not aspirational consolidation.

4. **Evidence Traceability**: Every material claim (app discovered, block type found, Composer located) backed by `Evidence` record with file path + content hash. Snapshot is auditable.

5. **Deterministic Hashing**: `canonicalHash = SHA-256(JSON.stringify(snapshot, stableKeySort, excludeTimestamps))`. Same repository commitSha → same hash. Enables differential snapshots in M2.

6. **Fixture Reconciliation, Not Replacement**: Legacy `projectLlmRepositoryIntelligence.ts` compared against new snapshot for MATCH/DISCREPANCY. New snapshot is authoritative. Legacy fixture retained until M2 migration.

---

## Implementation Plan

### FEAT-001: Package Scaffold and TypeScript Contracts

**What:** Create `@quiz/project-llm-discovery` package with directory structure, TypeScript contracts for RepositoryAdapter, Evidence, ScannerResult, RepositorySnapshot, and build/test configuration.

**Files:**
- `packages/project-llm-discovery/package.json` (new)
- `packages/project-llm-discovery/tsconfig.json` (new)
- `packages/project-llm-discovery/vitest.config.ts` (new)
- `packages/project-llm-discovery/src/contracts/repository-adapter.ts` (new)
- `packages/project-llm-discovery/src/contracts/evidence.ts` (new)
- `packages/project-llm-discovery/src/contracts/scanner.ts` (new)
- `packages/project-llm-discovery/src/contracts/snapshot.ts` (new)
- `packages/project-llm-discovery/src/contracts/index.ts` (new)
- `packages/project-llm-discovery/src/index.ts` (new)
- `pnpm-workspace.yaml` (append packages/project-llm-discovery)
- `tsconfig.json` (add @quiz/project-llm-discovery paths)
- `vitest.workspace.ts` (add packages/project-llm-discovery/vitest.config.ts)

**Directory Structure:**
```
packages/project-llm-discovery/
├── src/
│   ├── contracts/
│   ├── adapters/
│   ├── scanners/
│   ├── evidence/
│   ├── snapshot/
│   └── validation/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── determinism/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

**Verify:**
```powershell
pnpm install
pnpm --filter @quiz/project-llm-discovery test
pnpm typecheck:all
```
Expected: Package installs, vitest runs (no tests found is OK), TypeScript compiles.

---

### FEAT-002: Filesystem Adapter + D1 (Structure) + D2 (Runtime) Scanners

**What:** Implement `FilesystemRepositoryAdapter` for local file access. D1 scanner discovers apps/packages/services from `apps/*/package.json`, `packages/*/package.json`, `services/*/package.json`. D2 scanner extracts workspace config (pnpm-workspace.yaml), build system (turbo.json), frameworks (Next.js, Node.js).

**Files:**
- `packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.ts` (new)
- `packages/project-llm-discovery/src/adapters/index.ts` (new)
- `packages/project-llm-discovery/src/scanners/d1-structure-scanner.ts` (new)
- `packages/project-llm-discovery/src/scanners/d2-runtime-scanner.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/filesystem-repository-adapter.test.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/d1-structure-scanner.test.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/d2-runtime-scanner.test.ts` (new)
- `packages/project-llm-discovery/src/index.ts` (export adapter + scanners)

**Implementation Notes:**
- `FilesystemRepositoryAdapter.readFile`: Use `fs.promises.readFile(path, 'utf-8')`.
- `FilesystemRepositoryAdapter.getFileHash`: Use `crypto.createHash('sha256').update(content).digest('hex')`.
- `FilesystemRepositoryAdapter.getGitCommit`: Use `child_process.execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim()`.
- D1 scanner: Recursively list `apps/*`, `packages/*`, `services/*`. For each directory, check if `package.json` exists. Parse JSON, extract `{ name, version, dependencies, devDependencies }`. Generate `Evidence` for each package.json read (`kind: 'package'`, `claim: 'Package discovered: @quiz/...'`, `path: 'packages/.../package.json'`, `contentHash: sha256(fileContent)`).
- D2 scanner: Read `pnpm-workspace.yaml` (use `yaml` npm package), extract `packages: [...]` globs. Read `turbo.json`, extract `tasks`, `concurrency`. Read root `package.json`, extract `engines.node`, detect Next.js from dependencies. Generate `Evidence` for each config file.

**Verify:**
```powershell
pnpm --filter @quiz/project-llm-discovery test
```
Expected: All D1/D2 unit tests pass. Manual integration test script (create `__tests__/integration/test-d1-d2.ts`) confirms: 12 apps, 21 packages, 3 services, Next.js 16.1.6, Node.js 20.x, pnpm workspace, turbo concurrency=2.

---

### FEAT-003: D3 (Blocks) + D4 (Composer) + D5 (Dependencies) + D6 (Tests) Scanners

**What:** D3 discovers Educational Block Families: parse `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md` (18 families documented), parse `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts` (block type interfaces implemented), list `packages/ui/src/tutorial/blocks/*.tsx` (renderers), cross-reference for VERIFIED (type + renderer + UBRC data-block-version attribute). Maintain 4 separate states: DOCUMENTED, IMPLEMENTED, RENDERED, VERIFIED. D4 discovers Tutorial Composer service (`packages/db-tutorial/src/services/tutorial-composer.service.ts`), API routes, schemas. D5 builds dependency graph (package.json dependencies). D6 discovers test infrastructure (vitest.workspace.ts, __tests__ directories).

**Files:**
- `packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts` (new)
- `packages/project-llm-discovery/src/scanners/d4-composer-scanner.ts` (new)
- `packages/project-llm-discovery/src/scanners/d5-dependencies-scanner.ts` (new)
- `packages/project-llm-discovery/src/scanners/d6-tests-scanner.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/d3-blocks-scanner.test.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/d4-composer-scanner.test.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/d5-dependencies-scanner.test.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/d6-tests-scanner.test.ts` (new)
- `packages/project-llm-discovery/src/index.ts` (export D3-D6 scanners)

**Implementation Notes:**
- **D3 BLOCKS Scanner:**
  - Read `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md`. Parse markdown table rows (regex: `\| (\d+) \| (.+?) \| (.+?) \| (\d+) \|`). Extract 18 families: I, O, D, C, V, CP, E, M, MT, BP, S, Q, EX, T, INT, QZ, IV, P. Map to `BlockFamilyDoc[]` with `{ familyId, name, versionCount, status }`. This is DOCUMENTED state.
  - Read `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`. Regex search: `export interface (\w+Block) extends BaseBlock { type: '(\w+)'; version: '(\w+)'; }`. Extract type interfaces. This is IMPLEMENTED state.
  - List `packages/ui/src/tutorial/blocks/*.tsx`. For each file, check if filename matches `{BlockType}Block.tsx`. This is RENDERED state.
  - Cross-reference: If block type exists in IMPLEMENTED + RENDERED + renderer file contains `data-block-version` attribute (regex search file content for `data-block-version=`), mark as VERIFIED.
  - Expected outcomes: DOCUMENTED: 18 families (133 versions), IMPLEMENTED: ~15 block types (I1, C1, D1, S1, plus structural blocks like heading, paragraph), RENDERED: 19 .tsx files, VERIFIED: 3 (I1, C1, D1).
  - Generate `Evidence` for each file read and each block entity discovered.
  - **CRITICAL:** Return `{ documented: BlockFamilyDoc[], implemented: BlockImplementation[], rendered: BlockRenderer[], verified: BlockVerification[], discrepancies: BlockDiscrepancy[] }`. Do NOT collapse states.

- **D4 COMPOSER Scanner:**
  - Read `packages/db-tutorial/src/services/tutorial-composer.service.ts`. Extract class name `TutorialComposerService`, extract method names (regex: `async (\w+)\(`). Map to `ComposerService[]`.
  - List `apps/skillhubcore-admin/src/app/api/tutorial-composer/` directory. List route files (`route.ts`). Map to `ComposerAPI[]`.
  - Read `packages/types/src/tutorial-rich-document/` for `TutorialDocument` schema. Map to `ComposerSchema[]`.
  - Search `apps/skillhubcore-admin/src/` for files containing "composer" (case-insensitive). Map to `ComposerUI[]`.
  - **CRITICAL:** Assert `composerServices.length === 1`. If `> 1`, generate `Finding` with `severity: 'error'`, `message: 'Parallel Composer detected'`. If `=== 1`, generate `Finding` with `severity: 'info'`, `message: 'Single Composer confirmed: packages/db-tutorial/src/services/tutorial-composer.service.ts'`.

- **D5 DEPENDENCIES Scanner:**
  - Input: `StructureData` from D1 (list of packages).
  - For each package, read `package.json`, extract `dependencies` + `devDependencies`.
  - Build graph: `nodes = packages`, `edges = { from: packageName, to: dependencyName, type: 'workspace' | 'external' }`.
  - Filter workspace dependencies: `to` matches `@quiz/*` pattern.
  - Return `{ nodes: DependencyNode[], edges: DependencyEdge[] }`.

- **D6 TESTS Scanner:**
  - Read `vitest.workspace.ts`. Parse TypeScript array export (use `ts-morph` or regex: `'(.*?/vitest.config.ts)'`). Extract test config paths. Map to `unit` and `integration` test suites.
  - Read `playwright.config.ts`. Extract `testDir: './tests/e2e'`. Map to `e2e` test suites.
  - Recursively scan repository for `__tests__/` directories and `*.test.ts`, `*.spec.ts` files. Group by type (unit vs e2e based on path).
  - Return `{ unit: TestSuite[], integration: TestSuite[], e2e: TestSuite[] }`.

**Verify:**
```powershell
pnpm --filter @quiz/project-llm-discovery test
```
Expected: All D3-D6 unit tests pass. Integration test (`__tests__/integration/test-d3-d6.ts`) confirms: 18 block families documented, 3 verified (I1, C1, D1), 1 Composer service, 21 dependency nodes, vitest + playwright test suites discovered.

---

### FEAT-004: Evidence Collector/Normalizer + Snapshot Builder (D7)

**What:** Aggregate evidence from D1-D6 scanners. Normalize evidence (sort, deduplicate). Build `RepositorySnapshot` by running all scanners, collecting evidence, computing deterministic SHA-256 `canonicalHash`.

**Files:**
- `packages/project-llm-discovery/src/evidence/collector.ts` (new)
- `packages/project-llm-discovery/src/evidence/normalizer.ts` (new)
- `packages/project-llm-discovery/src/evidence/index.ts` (new)
- `packages/project-llm-discovery/src/snapshot/builder.ts` (new)
- `packages/project-llm-discovery/src/snapshot/hasher.ts` (new)
- `packages/project-llm-discovery/src/snapshot/index.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/evidence-collector.test.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/evidence-normalizer.test.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/snapshot-hasher.test.ts` (new)
- `packages/project-llm-discovery/__tests__/integration/test-snapshot-builder.ts` (new)
- `packages/project-llm-discovery/src/index.ts` (export buildSnapshot, EvidenceCollector, etc.)

**Implementation Notes:**
- **EvidenceCollector:**
  - Class with `add(evidence)`, `addAll(evidence[])`, `getAll()` methods.
  - `generateEvidenceId(scannerName, path)`: Return `sha256(scannerName + path + timestamp)`.

- **normalizeEvidence(evidence[]):**
  - Sort by `path` (ascending), then `timestamp` (ascending).
  - Deduplicate by `evidenceId` (keep first occurrence).
  - Validate: all evidence must have `evidenceId`, `path`, `kind`, `claim`. Throw error if missing.

- **buildSnapshot(repoRoot, adapter):**
  - Step 1: Run scanners in sequence: `d1Result = await scanRepositoryStructure(adapter)`, `d2Result = await scanRuntime(adapter)`, `d3Result = await scanBlocks(adapter)`, `d4Result = await scanComposer(adapter)`, `d5Result = await scanDependencies(adapter, d1Result.data)`, `d6Result = await scanTests(adapter)`.
  - Step 2: Collect evidence: `collector = new EvidenceCollector()`, `collector.addAll(d1Result.evidence)`, repeat for d2-d6.
  - Step 3: Normalize: `evidence = normalizeEvidence(collector.getAll())`.
  - Step 4: Aggregate findings: `findings = [...d1Result.findings, ...d2Result.findings, ...]`.
  - Step 5: Construct snapshot object:
    ```typescript
    const snapshot: Omit<RepositorySnapshot, 'canonicalHash'> = {
      schemaVersion: '1.0.0',
      repository: {
        owner: 'quiz-platform',
        name: 'quiz-platform',
        commitSha: await adapter.getGitCommit(),
        scanTimestamp: new Date().toISOString(),
      },
      structure: d1Result.data,
      runtime: d2Result.data,
      blocks: d3Result.data,
      composer: d4Result.data,
      dependencies: d5Result.data,
      tests: d6Result.data,
      evidence,
      findings,
    };
    ```
  - Step 6: Compute hash: `canonicalHash = computeSnapshotHash(snapshot)`.
  - Step 7: Return `{ ...snapshot, canonicalHash }`.

- **computeSnapshotHash(snapshot):**
  - Clone snapshot object, delete `scanTimestamp` field (exclude from hash for determinism).
  - Recursively sort all object keys (stable serialization).
  - `JSON.stringify(sortedSnapshot)`.
  - `sha256(jsonString)`.
  - Return hex string.

**Verify:**
```powershell
pnpm --filter @quiz/project-llm-discovery test
```
Expected: All evidence/snapshot tests pass. Integration test confirms: snapshot.schemaVersion === '1.0.0', snapshot.canonicalHash is 64-char hex, snapshot.evidence.length > 0. Determinism test (`__tests__/integration/test-determinism.ts`): run buildSnapshot twice, assert `snapshot1.canonicalHash === snapshot2.canonicalHash`.

---

### FEAT-005: Snapshot Validator (D8: V1-V9) + Fixture Reconciliation

**What:** Implement 9 validation checks (V1: schema, V2: reference integrity, V3: evidence paths exist, V4: block consistency, V5: single Composer, V6: dependency graph acyclic, V7: test references, V8: evidence completeness, V9: determinism). Reconcile legacy `projectLlmRepositoryIntelligence.ts` vs new snapshot.

**Files:**
- `packages/project-llm-discovery/src/validation/validator.ts` (new: ValidationResult interface)
- `packages/project-llm-discovery/src/validation/v1-schema-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/v2-reference-integrity-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/v3-evidence-paths-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/v4-block-consistency-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/v5-composer-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/v6-dependency-graph-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/v7-test-references-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/v8-evidence-completeness-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/v9-determinism-validator.ts` (new)
- `packages/project-llm-discovery/src/validation/index.ts` (new: validateSnapshot aggregator)
- `packages/project-llm-discovery/src/validation/fixture-reconciliation.ts` (new)
- `packages/project-llm-discovery/__tests__/unit/validation/*.test.ts` (9 test files for V1-V9)
- `packages/project-llm-discovery/__tests__/unit/fixture-reconciliation.test.ts` (new)
- `packages/project-llm-discovery/__tests__/integration/test-validation.ts` (new)
- `packages/project-llm-discovery/src/index.ts` (export validateSnapshot, reconcileWithLegacyFixture)

**Implementation Notes:**
- **V1 Schema Validator:** Use Zod schema to validate snapshot structure. Check `schemaVersion === '1.0.0'`. Check required fields. Return errors if invalid.
- **V2 Reference Integrity:** For each block in `verified`, assert corresponding entries exist in `implemented` AND `rendered`. For each composer API, assert references to existing composer service.
- **V3 Evidence Paths:** For each `evidence.path`, call `await adapter.fileExists(path)`. Return warnings for missing paths.
- **V4 Block Consistency:**
  - Assert `blocks.documented`, `blocks.implemented`, `blocks.rendered`, `blocks.verified` are all present (not collapsed).
  - Assert `verified` is subset of (`implemented` ∩ `rendered`).
  - No block can be in multiple conflicting states.
- **V5 Composer:** Assert `composer.services.length === 1`. Error if 0 or >1.
- **V6 Dependency Graph:** Assert all edges reference existing nodes. Detect cycles with DFS. Error if cycles found.
- **V7 Test References:** For each test suite, check test files exist via `adapter.fileExists()`. Warnings for missing.
- **V8 Evidence Completeness:** For each entity in structure/runtime/blocks/composer, assert corresponding evidence entry exists (match by path or claim). Warnings for missing evidence.
- **V9 Determinism:** Run `buildSnapshot` twice. Assert `snapshot1.canonicalHash === snapshot2.canonicalHash`. Error if mismatch.

- **validateSnapshot(snapshot, adapter):**
  - Run all V1-V9 validators.
  - Aggregate `errors: ValidationError[]`, `warnings: ValidationWarning[]`.
  - Return `{ valid: errors.length === 0, errors, warnings }`.

- **reconcileWithLegacyFixture(snapshot, legacyFixturePath, adapter):**
  - Read `apps/skillhubcore-admin/src/lib/project-llm/projectLlmRepositoryIntelligence.ts`.
  - Parse TypeScript (use `ts-morph` or regex) to extract:
    - `VERIFIED_IMPLEMENTATIONS` array (I1, C1, D1).
    - `INCOMPLETE_IMPLEMENTATIONS` array (S1).
    - `PLANNED_FAMILY_IDS` array (14 families).
  - Compare:
    - Legacy verified (I1, C1, D1) vs `snapshot.blocks.verified`. Expected: MATCH for all 3.
    - Legacy incomplete (S1) vs snapshot. Expected: S1 in `snapshot.blocks.implemented` but NOT in `snapshot.blocks.verified` (MATCH if this condition holds, DISCREPANCY if S1 is verified or missing).
    - Legacy planned (14 families) vs snapshot. Expected: documented but not implemented. MATCH if families in `snapshot.blocks.documented` but not in `snapshot.blocks.implemented`.
  - Return `ReconciliationResult[]` with `{ claim, status: 'MATCH' | 'DISCREPANCY' | 'UNKNOWN', legacyValue?, snapshotValue?, notes? }`.
  - **CRITICAL:** Do NOT make legacy authoritative. New snapshot is source of truth. Reconciliation is informational only.

**Verify:**
```powershell
pnpm --filter @quiz/project-llm-discovery test
```
Expected: All V1-V9 tests pass. Integration test (`__tests__/integration/test-validation.ts`) confirms: validation.valid === true (or documents expected warnings). Fixture reconciliation test confirms: 3 MATCH for I1/C1/D1, DISCREPANCY for S1 (if S1 status differs), 14 MATCH for planned families.

---

### FEAT-006: Integration Tests, Documentation, M1 Completion Report

**What:** Full M1 pipeline integration test (scan → build → validate → reconcile). Determinism proof test (run twice, assert same hash). Package README with usage examples. M1 completion report documenting verification results.

**Files:**
- `packages/project-llm-discovery/__tests__/integration/test-full-m1-pipeline.ts` (new)
- `packages/project-llm-discovery/__tests__/determinism/test-determinism-proof.ts` (new)
- `packages/project-llm-discovery/README.md` (new)
- `.agents/tasks/m1-completion-report.md` (new)
- `packages/project-llm-discovery/package.json` (update version to 1.0.0)
- `packages/project-llm-discovery/src/index.ts` (ensure all public APIs exported)

**Implementation Notes:**
- **test-full-m1-pipeline.ts:**
  - Instantiate `FilesystemRepositoryAdapter('e:\\onlinewebsites\\quiz-platform')`.
  - Run `buildSnapshot(adapter)`.
  - Run `validateSnapshot(snapshot, adapter)`.
  - Run `reconcileWithLegacyFixture(snapshot, 'apps/skillhubcore-admin/src/lib/project-llm/projectLlmRepositoryIntelligence.ts', adapter)`.
  - Assert:
    - `snapshot.structure.applications.length === 12`
    - `snapshot.structure.packages.length === 21`
    - `snapshot.structure.services.length === 3`
    - `snapshot.blocks.verified.length === 3` (I1, C1, D1)
    - `snapshot.composer.services.length === 1`
    - `validation.valid === true` (or all errors are documented as expected warnings)
    - `reconciliation` includes 3 MATCH entries for I1/C1/D1
  - Write `snapshot` JSON to `.agents/tasks/m1-snapshot-test.json` for inspection.

- **test-determinism-proof.ts:**
  - Instantiate adapter.
  - Run `buildSnapshot` twice: `snapshot1`, `snapshot2`.
  - Assert `snapshot1.canonicalHash === snapshot2.canonicalHash`.
  - Assert deep equality of all data fields (excluding timestamps).
  - Log: "DETERMINISM PROVEN: same repository state → same canonicalHash".

- **README.md:**
  - Sections: Purpose, Features, Installation, Usage, Architecture, Extension Points, Testing, Snapshot Schema, Determinism Guarantee.
  - Usage example:
    ```typescript
    import { FilesystemRepositoryAdapter, buildSnapshot, validateSnapshot } from '@quiz/project-llm-discovery';
    
    const adapter = new FilesystemRepositoryAdapter('e:\\onlinewebsites\\quiz-platform');
    const snapshot = await buildSnapshot('e:\\onlinewebsites\\quiz-platform', adapter);
    const validation = await validateSnapshot(snapshot, adapter);
    
    console.log(`Apps: ${snapshot.structure.applications.length}`);
    console.log(`Packages: ${snapshot.structure.packages.length}`);
    console.log(`Valid: ${validation.valid}`);
    ```

- **m1-completion-report.md:**
  - Sections: M1 Milestone COMPLETE, Deliverables, Verification Results, Validation (V1-V9 pass), Determinism PROVEN, Fixture Reconciliation Results, Next Steps (M2).
  - Document: 12 apps, 21 packages, 3 services, 18 block families (3 verified, 1 incomplete, 14 planned), single Composer confirmed, dependency graph 21 nodes, vitest + playwright tests, evidence traceability, deterministic snapshot.

**Verify:**
```powershell
pnpm --filter @quiz/project-llm-discovery test
tsx packages/project-llm-discovery/__tests__/integration/test-full-m1-pipeline.ts
tsx packages/project-llm-discovery/__tests__/determinism/test-determinism-proof.ts
pnpm typecheck:all
pnpm lint:all
pnpm build
```
Expected: All tests pass. Integration test outputs 12/21/3/3/1 counts. Determinism test outputs "DETERMINISM PROVEN". Snapshot JSON written to `.agents/tasks/m1-snapshot-test.json` (well-formed, canonicalHash 64-char hex). README is executable. M1 completion report documents all deliverables. No lint/type/build errors.

---

## Verification Strategy

### Per-FEAT Verification (During Implementation)
Each FEAT has acceptance criteria and verification commands. Implementer runs verification after completing each FEAT. If verification fails, fix before proceeding to next FEAT.

### Integration Verification (After All FEATs)
1. Run full test suite: `pnpm --filter @quiz/project-llm-discovery test` → all unit + integration tests pass
2. Run full M1 pipeline: `tsx packages/project-llm-discovery/__tests__/integration/test-full-m1-pipeline.ts` → confirms 12/21/3/3/1 counts
3. Run determinism proof: `tsx packages/project-llm-discovery/__tests__/determinism/test-determinism-proof.ts` → confirms hash stability
4. Inspect snapshot output: `cat .agents/tasks/m1-snapshot-test.json` → JSON well-formed, evidence array populated, canonicalHash present
5. Read reconciliation results: check test output for MATCH/DISCREPANCY status per claim
6. Run repository-wide checks: `pnpm typecheck:all && pnpm lint:all && pnpm build` → no errors

### Cross-FEAT Integration Points
- FEAT-002 depends on FEAT-001 (contracts)
- FEAT-003 depends on FEAT-001 (contracts) and FEAT-002 (adapter)
- FEAT-004 depends on FEAT-001, FEAT-002, FEAT-003 (all scanners)
- FEAT-005 depends on FEAT-001, FEAT-004 (snapshot)
- FEAT-006 depends on FEAT-001 through FEAT-005 (all components)

Integration verification in FEAT-006 tests all cross-FEAT boundaries.

---

## Critical Constraints

### Governance (from CONTRIBUTING.md)
- No `any` types (use explicit types or `unknown`)
- Strict boolean checks (no truthiness: `if (str && str.trim() !== '')`)
- Type/value import separation (`import type { ... }` for types)
- No `console.log` (use structured logging or test assertions)
- Complexity < 20 per function
- Max lines 500 per file (warning)
- No floating promises (`await` or `void fn().catch()`)
- Lint with `--max-warnings=0` (fails on any warning)

### Architecture (M1 Specification)
- **No LLM in core discovery**: All scanners use deterministic parsing
- **4-state block model**: DOCUMENTED, IMPLEMENTED, RENDERED, VERIFIED never collapsed
- **Repository adapter abstraction**: All file access through `RepositoryAdapter` interface
- **Evidence traceability**: Every claim backed by `Evidence` record (path + hash)
- **Deterministic hashing**: Exclude timestamps, sort keys, SHA-256
- **Single Composer**: D4 scanner asserts exactly 1 TutorialComposerService
- **Legacy fixture informational only**: Reconciliation compares, does NOT replace

### Testing (from package.json + vitest.workspace.ts)
- Unit tests: `__tests__/unit/*.test.ts` (vitest)
- Integration tests: `__tests__/integration/*.test.ts` (vitest)
- Determinism tests: `__tests__/determinism/*.test.ts` (vitest)
- Test command: `pnpm --filter @quiz/project-llm-discovery test`
- Coverage target: >80% for core modules (scanners, validators)

---

## Extension Points (for M2)

1. **Custom Adapters**: Implement `RepositoryAdapter` for remote Git (GitRepositoryAdapter), GitHub API, etc.
2. **Additional Scanners**: Add D9+ scanners (e.g., architecture drift, code quality metrics, LLM-assisted semantic analysis).
3. **Additional Validators**: Add V10+ validators (e.g., security checks, performance benchmarks).
4. **Snapshot Versioning**: Introduce schema version 2.0.0 with backward compatibility.
5. **Differential Snapshots**: Compare `snapshot1.canonicalHash` vs `snapshot2.canonicalHash` to detect repository changes.
6. **Evidence Enrichment**: Add LLM-generated summaries to evidence metadata (M2 feature).

---

## Dependencies (npm packages to add)

- `typescript` (already in repo)
- `zod` (schema validation)
- `yaml` (parse pnpm-workspace.yaml)
- `ts-morph` (optional: TypeScript AST parsing for D3/D4, or use regex)
- `vitest`, `@vitest/coverage-v8` (testing, already in repo)
- No LLM SDK, no external API calls (M1 constraint)

---

## Success Criteria

M1 is COMPLETE when:

1. **Package:** `@quiz/project-llm-discovery` installs, builds, passes all tests
2. **Scanners:** D1-D6 discover 12 apps, 21 packages, 3 services, 18 block families, 1 Composer, 21 dependency nodes, vitest + playwright tests
3. **Snapshot:** Deterministic (same commitSha → same canonicalHash)
4. **Validation:** V1-V9 all pass
5. **Evidence:** All claims traceable to file path + content hash
6. **Reconciliation:** Legacy fixture comparison outputs MATCH for verified blocks (I1, C1, D1)
7. **Documentation:** README with usage examples, M1 completion report
8. **Repository Checks:** `pnpm typecheck:all && pnpm lint:all && pnpm build` pass

---

## Plan Status

**READY FOR IMPLEMENTATION**

All investigation complete. All design decisions made. All files identified. All verification commands specified. Proceed with FEAT-001.
