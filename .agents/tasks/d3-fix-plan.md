# Implementation Plan: D3 Block Verification Semantic Correction

## Problem Summary

The forensic audit identified that `d3-blocks-scanner.ts` incorrectly determines verification status by:
1. Hardcoding `documented: true` with assumption comments
2. Using only "renderer file exists" as proof (not actual runtime registration)
3. Missing verification levels between DISCOVERED and VERIFIED
4. Not actually parsing documentation to confirm documented status
5. Not checking TutorialBlockRenderer.tsx for actual `case "blockType":` dispatch patterns

## Implementation Steps

- [ ] 1. Update `snapshot.ts` contract with VerificationLevel type and enhanced BlockFamily interface
      Add `VerificationLevel` enum type with 6 states: DISCOVERED, IMPLEMENTED, RENDERED, REGISTERED, TESTED, VERIFIED.
      Add `verificationLevel` field and `registered` boolean field to `BlockVerification` interface.
      Update JSDoc to clarify UBRC compliance is M2 scope.
      Files: `packages/project-llm-discovery/src/contracts/snapshot.ts`
      Verify: `pnpm --filter @quiz/project-llm-discovery type-check` — no type errors

- [ ] 2. Implement parseBlockCorpusRegistry with actual documentation parsing
      Replace hardcoded `documented: true` assumption in crossReferenceBlocks.
      The function already exists and parses PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md.
      Build a Set of documented versions from parsed registry data.
      Use this Set to set `documented` boolean based on actual presence, not assumption.
      Files: `packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts`
      Verify: `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/d3-blocks-scanner.test.ts` — documented flag tests pass

- [ ] 3. Implement checkRuntimeRegistration parser for TutorialBlockRenderer.tsx
      Add new function `checkRuntimeRegistration(adapter: RepositoryAdapter): Promise<Set<string>>`.
      Parse `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` for actual dispatch cases.
      Look for `case 'blockType':` patterns in the switch statement (lines 68-124 based on actual file).
      Extract block types with actual case handlers (not just component file existence).
      Return Set of registered block types.
      Files: `packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts`
      Verify: `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/d3-blocks-scanner.test.ts` — registered flag tests pass

- [ ] 4. Implement deriveVerificationLevel function
      Add function `deriveVerificationLevel(evidence: { documented: boolean, implemented: boolean, rendered: boolean, registered: boolean, tested: boolean }): VerificationLevel`.
      Logic: Start with DISCOVERED (base state), upgrade to IMPLEMENTED if implemented=true, upgrade to RENDERED if rendered=true, upgrade to REGISTERED if registered=true, upgrade to TESTED if tested=true, upgrade to VERIFIED if all predicates are true.
      Document that UBRC compliance check is explicitly deferred to M2 scope.
      Files: `packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts`
      Verify: `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/d3-blocks-scanner.test.ts` — verification level derivation tests pass

- [ ] 5. Update crossReferenceBlocks to use new verification semantics
      Call `checkRuntimeRegistration(adapter)` to get Set of registered block types.
      Update `documented` assignment to use documentedVersions Set lookup (already partially exists).
      Add `registered` field assignment using registered Set lookup.
      Call `deriveVerificationLevel()` with all evidence flags to determine level.
      Update `BlockVerification` object construction to include `registered` and `verificationLevel` fields.
      Remove hardcoded assumption comments.
      Update JSDoc to document the complete verification contract with all 6 levels.
      Files: `packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts`
      Verify: `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/d3-blocks-scanner.test.ts` — cross-reference tests pass

- [ ] 6. Update unit tests for new verification semantics
      Add test case: `documented` flag requires actual registry parse (not assumption) — mock adapter returns registry content, verify documented=true only for versions in registry.
      Add test case: `registered` requires dispatch case match — mock adapter returns TutorialBlockRenderer with case statements, verify registered=true only for types with cases.
      Add test case: all six verification levels derive correctly — test progression DISCOVERED → IMPLEMENTED → RENDERED → REGISTERED → TESTED → VERIFIED.
      Add test case: VERIFIED requires all predicates — test that missing any evidence downgrades level correctly.
      Add test case: partial evidence produces intermediate levels — test IMPLEMENTED but not RENDERED → level=IMPLEMENTED.
      Update existing tests to include `registered` field and `verificationLevel` field in expected results.
      Files: `packages/project-llm-discovery/__tests__/unit/d3-blocks-scanner.test.ts`
      Verify: `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/d3-blocks-scanner.test.ts` — all tests pass

- [ ] 7. Run full package test suite and type check
      Run complete test suite to ensure no regressions in other scanners or validators.
      Run type check to ensure contract changes don't break downstream consumers.
      Files: All files in `packages/project-llm-discovery`
      Verify: `pnpm --filter @quiz/project-llm-discovery test && pnpm --filter @quiz/project-llm-discovery type-check` — all tests pass, no type errors

## Key Design Decisions

### Decision 1: VerificationLevel progression model
**Rationale**: The audit revealed that collapsing all checks into a single boolean loses important diagnostic information. A 6-level progression (DISCOVERED → IMPLEMENTED → RENDERED → REGISTERED → TESTED → VERIFIED) clearly shows where each block stands in the implementation pipeline. This provides actionable diagnostics: "Code block C2 is IMPLEMENTED but not RENDERED" is more useful than "Code block C2 is not verified."

### Decision 2: Parse actual TutorialBlockRenderer switch cases, not file existence
**Rationale**: The audit correctly identified that file existence (IntroductionBlock.tsx exists) is not proof of runtime registration. The actual contract is TutorialBlockRenderer.tsx must have `case 'introduction':` with a handler. This is the runtime dispatch mechanism, and only blocks in the switch statement are actually usable at runtime. This is a semantic correctness fix, not a minor optimization.

### Decision 3: documented flag from actual registry parsing
**Rationale**: The audit found `documented: true // Assume documented if implemented` — a false assumption. The correct approach is to parse PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md (which D3 already does via parseBlockCorpusRegistry) and check if the version is in the documented Set. This removes assumptions and grounds the flag in actual evidence.

### Decision 4: UBRC compliance explicitly deferred to M2
**Rationale**: The audit noted UBRC compliance is not checked. Rather than scope-creeping this fix, document explicitly in code comments and JSDoc that UBRC compliance (data-block-version attribute validation) is M2 scope. This keeps the fix focused on the P0-1 issues: false assumptions and missing registration checks.

### Decision 5: registered field added to BlockVerification interface
**Rationale**: The current interface only has `documented`, `implemented`, `rendered`, `tested`. Adding `registered` (runtime dispatch proof) makes the verification contract complete and allows deriveVerificationLevel to distinguish RENDERED (component exists) from REGISTERED (runtime can dispatch).

## File Change Summary

### snapshot.ts changes
- Add `VerificationLevel` type with 6 enum values
- Add `registered: boolean` field to `BlockVerification` interface
- Add `verificationLevel: VerificationLevel` field to `BlockVerification` interface
- Update JSDoc to clarify UBRC is M2 scope

### d3-blocks-scanner.ts changes
- Add `checkRuntimeRegistration(adapter)` function to parse TutorialBlockRenderer.tsx switch cases
- Add `deriveVerificationLevel(evidence)` function to compute 6-level progression
- Update `crossReferenceBlocks()` to:
  - Call `checkRuntimeRegistration()` and use result for `registered` field
  - Remove hardcoded `documented: true` assumption
  - Use documentedVersions Set for actual `documented` value
  - Call `deriveVerificationLevel()` to compute level
  - Populate `registered` and `verificationLevel` fields in BlockVerification objects
- Update JSDoc with complete verification contract

### d3-blocks-scanner.test.ts changes
- Add test: `documented` requires actual registry parse
- Add test: `registered` requires dispatch case match  
- Add test: all 6 verification levels derive correctly
- Add test: VERIFIED requires all predicates
- Add test: partial evidence produces intermediate levels
- Update existing test expectations to include `registered` and `verificationLevel` fields

## Verification Strategy

Each step has inline verification command. Final verification is step 7: full test suite + type check.

Expected outcomes:
- Type check passes (contract changes are backward-compatible additions)
- All unit tests pass (new semantics implemented correctly)
- No integration test regressions (scanner interface unchanged)
- Determinism tests still pass (snapshot structure changed but hash calculation unchanged)

## Backward Compatibility

This change adds fields to `BlockVerification` interface. TypeScript consumers must update to access new fields, but existing code that only reads `documented`, `implemented`, `rendered`, `tested` fields continues to work (additive change, not breaking).

The snapshot schema version remains `1.0.0` because this is a correction of implementation bugs, not a schema evolution. The snapshot always intended to have accurate verification status; this fix makes the implementation match the intent.

## Evidence for Plan

- Read `snapshot.ts`: current BlockVerification interface lacks `registered` and `verificationLevel` fields
- Read `d3-blocks-scanner.ts`: contains `documented: true // Assume documented if implemented` on line (in crossReferenceBlocks function)
- Read `d3-blocks-scanner.ts`: `isVerified = hasRenderer` uses only file existence, not runtime registration
- Read `TutorialBlockRenderer.tsx`: switch statement with case handlers is the actual registration mechanism (lines 68-124)
- Read `d3-blocks-scanner.test.ts`: existing tests don't verify `documented` flag accuracy or `registered` field
- Read `PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md`: registry structure shows 18 families with version ranges (authoritative documentation source)
- Read `RepositoryAdapter` interface: confirms readFile/fileExists available for parsing TutorialBlockRenderer
- Read package.json scripts: confirms test command is `pnpm --filter @quiz/project-llm-discovery test`, type-check is `pnpm --filter @quiz/project-llm-discovery type-check`

## Constants and Paths

- Block corpus registry path: `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md` (already defined in d3-blocks-scanner.ts as BLOCK_CORPUS_DOC_PATH)
- TutorialBlockRenderer path: `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` (new constant needed: TUTORIAL_BLOCK_RENDERER_PATH)
- Test command: `pnpm --filter @quiz/project-llm-discovery test`
- Type check command: `pnpm --filter @quiz/project-llm-discovery type-check`
- Full verification: `pnpm --filter @quiz/project-llm-discovery test && pnpm --filter @quiz/project-llm-discovery type-check`
