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

**M2.2 Strict Evidence Binding:** ❌ NOT IMPLEMENTED
- Entity evidenceId fields: NO - None of the entity interfaces have `evidenceId` fields
  - ApplicationInfo: NO
  - PackageInfo: NO
  - ServiceInfo: NO
  - BlockImplementation: NO
  - BlockRenderer: NO
  - ComposerService: NO
  - ComposerAPI: NO
  - ComposerSchema: NO
  - ComposerUI: NO
  - DependencyNode: NO
  - DependencyEdge: NO
- Scanner propagation: NO - Scanners create evidence records but do not assign `evidenceId` to entities
  - d1-structure-scanner.ts: Creates evidence, NO entity.evidenceId assignment
  - d2-runtime-scanner.ts: Creates evidence, NO entity.evidenceId assignment
  - d3-blocks-scanner.ts: Creates evidence, NO entity.evidenceId assignment
  - d4-composer-scanner.ts: Creates evidence, NO entity.evidenceId assignment
  - d5-dependencies-scanner.ts: Creates evidence, NO entity.evidenceId assignment
  - d6-tests-scanner.ts: Creates evidence, NO entity.evidenceId assignment
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
