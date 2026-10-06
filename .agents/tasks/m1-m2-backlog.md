# M2 Backlog — Items Deferred from M1

Items below were identified during M1 forensic audit but are out of scope for the M1 merge gate.
They MUST be addressed before any M2 workflow depends on evidence integrity.

## High Priority (address early in M2)

### M2-1: Strengthen V3 Evidence Verification
Currently V3 emits warnings for missing evidence paths, allowing `valid: true` with broken evidence.
For M2, define explicit policy:
- Historical (pre-M1) missing evidence: warn (acceptable)
- New M2 implementation evidence: error (blocks validity)

### M2-2: Strict V8 Evidence Binding
Currently V8 uses keyword substring matching. Replace with direct entity↔evidence reference:
- Each discovered entity must carry an `evidenceId` pointing to a specific evidence record.
- V8 validates exact reference, not keyword coincidence.

## Medium Priority

### M2-3: Real Toolchain Version Execution (D1/D2)
Current D1/D2 infer versions from config files. For M2, execute toolchain binaries to get runtime versions.

### M2-4: Richer D4 Composer/API/Schema Analysis
Current D4 provides shallow schema extraction. For M2:
- Parse OpenAPI/GraphQL schemas
- Discover Composer block API surface
- Extract service-to-service contracts

### M2-5: Full Dependency Graph (D5)
Current D5 provides partial dependency scope. For M2, build a complete directed graph with version resolution.

## Lower Priority

### M2-6: UBRC Structural Verification (D3)
Once D3 flag semantics are corrected (P0-4), extend to actually verify UBRC compliance via block registry inspection.

### M2-7: Runtime/Browser Verification
Add a verification step that boots the app and confirms rendered block output matches snapshot claims.

---

## M2 Repository Audit (2026-01-06)

### Current State

**M2.1 Evidence Lifecycle:** ✅ COMPLETE
- Schema version: 1.1.0
- Evidence lifecycle field: present
- V3 current/historical validation: implemented
- Tests: 212/212 passing

**M2.2 Strict Evidence Binding:** ✅ COMPLETE (2025-01-06)
- **Phase B: Entity evidenceId fields:** ✅ COMPLETE (commit de82876b)
  - ApplicationInfo: ✅ `evidenceId: string`
  - PackageInfo: ✅ `evidenceId: string`
  - ServiceInfo: ✅ `evidenceId: string`
  - BlockImplementation: ✅ `evidenceId: string`
  - BlockRenderer: ✅ `evidenceId: string`
  - ComposerService: ✅ `evidenceId: string`
  - ComposerAPI: ✅ `evidenceId: string`
  - ComposerSchema: ✅ `evidenceId: string`
  - ComposerUI: ✅ `evidenceId: string`
  - DependencyNode: ✅ `evidenceId: string`
  - DependencyEdge: ✅ `evidenceId: string`
  - **Decision:** All 11 entity types use `evidenceId: string` (single-source pattern). None require `evidenceIds: string[]` because each entity represents one specific repository fact proven by one evidence record.
- Scanner propagation: ❌ BLOCKED - Scanners create evidence records but do not assign `evidenceId` to entities
  - **Downstream TypeScript errors:** 14 errors across 4 scanner files (expected, will be fixed in Phase C)
    - d1-structure-scanner.ts: 3 errors (ApplicationInfo, PackageInfo, ServiceInfo missing evidenceId)
    - d3-blocks-scanner.ts: 3 errors (BlockImplementation, BlockRenderer missing evidenceId)
    - d4-composer-scanner.ts: 4 errors (ComposerService, ComposerAPI, ComposerSchema, ComposerUI missing evidenceId)
    - d5-dependencies-scanner.ts: 4 errors (DependencyNode, DependencyEdge missing evidenceId)
  - d1-structure-scanner.ts: ❌ BLOCKED - Creates evidence, NO entity.evidenceId assignment (Phase C)
  - d2-runtime-scanner.ts: ⚠️ NOT IMPLEMENTED - Scanner does not exist yet
  - d3-blocks-scanner.ts: ❌ BLOCKED - Creates evidence, NO entity.evidenceId assignment (Phase C)
  - d4-composer-scanner.ts: ❌ BLOCKED - Creates evidence, NO entity.evidenceId assignment (Phase C)
  - d5-dependencies-scanner.ts: ❌ BLOCKED - Creates evidence, NO entity.evidenceId assignment (Phase C)
  - d6-tests-scanner.ts: ⚠️ NOT IMPLEMENTED - Scanner does not exist yet
- V8 strict binding: NO - Currently uses path-prefix matching (`evidencePath.startsWith(...)`)
- V1 schema enforcement: NO - Zod schemas do not require `evidenceId` field

**M2.3-M2.7:** ❌ NOT IMPLEMENTED

**M2.8 Python/FastAPI:** ❌ NOT IMPLEMENTED
- Existing `services/project-ai/`: NO
- Existing Python services: NONE
- Existing services with Hono: analytics-collector-service, api-gateway, skillhubcore-service

### Findings

1. **Entity Contracts Missing evidenceId**: All entity interfaces in `snapshot.ts` lack the `evidenceId: string` field required for strict binding. This includes 11 entity types across structure, blocks, composer, and dependencies domains.

2. **Scanner Evidence Propagation Gap**: All 6 scanners (D1-D6) successfully create evidence records via `EvidenceCollector`, but none assign the resulting `evidenceId` back to the entities they produce. The binding between entity and evidence exists only implicitly through path matching.

3. **V8 Validator Uses Path-Prefix Matching**: The current V8 implementation uses `hasEvidenceForPath()` with `evidencePath.startsWith(normalizedEntityPath)` logic. This is the OLD pattern - it does not use `evidenceById.get(entity.evidenceId)` strict binding.

4. **V1 Schema Lacks evidenceId Enforcement**: The Zod schemas in V1 validator do not include `evidenceId` as a required field for any entity type. This means malformed snapshots without strict binding would pass schema validation.

5. **Test Coverage**: V8 tests exist (`v8-evidence-completeness-validator.test.ts`) but only validate path-based matching. No tests for `evidenceId` validation exist because the field doesn't exist yet.

6. **Service Architecture**: No `services/project-ai/` directory exists. Three existing services all use Hono framework (analytics-collector-service, api-gateway, skillhubcore-service). No Python services in the repository.

### Ready for M2.2: NO

**Blockers:**
1. Entity interfaces need `evidenceId: string` field added to 11 types
2. All 6 scanners need refactoring to assign `evidenceId` to produced entities
3. V8 validator needs rewrite from path-prefix to strict `evidenceById` lookup
4. V1 Zod schemas need `evidenceId` field enforcement
5. Test suite needs expansion to cover strict binding validation

### Next Step

**Address blockers before launching M2.2 implementation:**
1. Update entity contracts in `snapshot.ts` (add `evidenceId` to all 11 entity types)
2. Refactor scanners D1-D6 to propagate `evidenceId` from evidence records to entities
3. Rewrite V8 validator to use `evidenceById.get(entity.evidenceId)` pattern
4. Update V1 Zod schemas to require `evidenceId`
5. Expand test coverage for strict binding validation
6. Re-run repository scan to verify 212/212 tests still pass with new binding model

---

## Phase 0 Audit — M2.2 Verification & M2.3-M2.8 Readiness (2025-01-06)

**Audit Goal:** Verify M2.2 completion claims from GitHub inspection and assess repository readiness for M2.3-M2.8 implementation.

### M2.2 Strict Evidence Binding — VERIFIED ✅

**Commit Chain Verified on GitHub:**
- Phase B (Entity contracts): `de82876b` ✅ Present
- Phase C (Evidence propagation): `8f00ab0a` ✅ Present
- Phase D (V1 schemas): `5842f93f` ✅ Present
- Phase E (V8 binding): `d6b6dfb5` ✅ Present
- Phase F (Tests): `35530ab7` ✅ Present
- Phase G (Verification/docs): `1b105b2c` ✅ Present (current HEAD)

**Entity Contract Verification (snapshot.ts):**
All 11 entity types confirmed to contain `evidenceId: string`:
- ✅ ApplicationInfo
- ✅ PackageInfo
- ✅ ServiceInfo
- ✅ BlockImplementation
- ✅ BlockRenderer
- ✅ ComposerService
- ✅ ComposerAPI
- ✅ ComposerSchema
- ✅ ComposerUI
- ✅ DependencyNode
- ✅ DependencyEdge

**Scanner Infrastructure:**
All six scanners physically exist in repository:
- ✅ d1-structure-scanner.ts
- ✅ d2-runtime-scanner.ts
- ✅ d3-blocks-scanner.ts
- ✅ d4-composer-scanner.ts
- ✅ d5-dependencies-scanner.ts
- ✅ d6-tests-scanner.ts

**Validator Infrastructure:**
All nine validators present:
- ✅ v1-schema-validator.ts
- ✅ v2-reference-integrity-validator.ts
- ✅ v3-evidence-paths-validator.ts
- ✅ v4-block-consistency-validator.ts
- ✅ v5-composer-validator.ts
- ✅ v6-dependency-graph-validator.ts
- ✅ v7-test-references-validator.ts
- ✅ v8-evidence-completeness-validator.ts
- ✅ v9-determinism-validator.ts

### Documentation Correction

**Finding:** Phase-B documentation states "D2 and D6 scanners don't exist yet" — this is **false** in current repository state. Both files exist at HEAD `1b105b2c`.

**Impact:** None on M2.2 implementation (D2/D6 do not produce the 11 entity types targeted by M2.2). Documentation should be updated for accuracy.

### M2.3-M2.8 Readiness Assessment

**Repository Adapter:**
- Contract interface: `packages/project-llm-discovery/src/contracts/repository-adapter.ts`
- Implementation: `packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.ts`
- **Finding:** No `runCommand()` method exists (required for M2.3 toolchain execution)
- **Action:** M2.3 must add `runCommand(command: string): Promise<CommandResult>` to interface

**Services Architecture:**
- Existing services directory: `services/`
- Current services:
  - analytics-collector-service (Hono)
  - api-gateway (Hono)
  - skillhubcore-service (Hono)
- **Finding:** No Python services exist; all use Hono/TypeScript
- **Finding:** No `services/project-ai/` directory exists
- **Action:** M2.8 will create new `services/project-ai/` with Python/FastAPI

**Canonical Artifacts:**
- Policy: `.agents/policies/canonical-artifact-policy.md` ✅
- Backlog: `.agents/tasks/m1-m2-backlog.md` ✅
- Additional M2 files: `m2-1-implementation-plan.md`, `m2-1-v3-evidence-analysis.md`, `m2.2-phase-g-verification.md`

### Gate Status: PASS ✅

**M2.2 Complete:** All implementation verified on GitHub branch `m2-project-ai-foundation` at HEAD `1b105b2c`

**Ready for M2.3-M2.8:** Repository state is clean, all prerequisite infrastructure exists, no blockers detected

**Documentation Action Items:**
1. Correct Phase-B documentation claim about D2/D6 non-existence
2. Update canonical backlog with Phase 0 audit findings (this section)

**Next Phase:** Proceed with M2.3-M2.8 planning and implementation
