# M1 Phase 5 Validator Report
HEAD: 94120a2af986f04af587390787b465d20d99c48e
Generated: 2026-10-05T18:15:00Z

## Validator Results
- V1 (Schema): PASS - 0 errors, 0 warnings
- V2 (Reference Integrity): PASS - 0 errors, 9 warnings
- V3 (Evidence Paths): PASS - 0 errors, 0 warnings
- V4 (Block Consistency): PASS - 0 errors, 0 warnings
- V5 (Composer): PASS - 0 errors, 0 warnings
- V6 (Dependency Graph): PASS - 0 errors, 0 warnings
- V7 (Test References): PASS - 0 errors, 2 warnings
- V8 (Evidence Completeness): PASS - 0 errors, 0 warnings
- V9 (Determinism): PASS - 0 errors, 0 warnings

## Warnings

### V2 Warnings (9 total)
- API_NO_SERVICE_REFERENCE: 9 tutorial-composer API handlers do not reference known services
  - /api/tutorial-composer/analysis
  - /api/tutorial-composer/block-suggestions
  - /api/tutorial-composer/import
  - /api/tutorial-composer/presentation-ideas
  - /api/tutorial-composer/sections
  - /api/tutorial-composer/sections/[sectionId]/blocks
  - /api/tutorial-composer/sections/[sectionId]/publish
  - /api/tutorial-composer/sections/[sectionId]
  - /api/tutorial-composer/sections/[sectionId]/suggestions/apply

### V7 Warnings (2 total)
- TEST_FILE_NOT_FOUND: apps/web-app/vitest.config.ts
- TEST_FILE_NOT_FOUND: apps/admin-app/vitest.config.ts

## Determinism Verification
- Snapshot 1 canonical hash: 5f51d252637594ab36291aa125335149d53041f7fdc52d65512bba3885a945e7
- Snapshot 2 canonical hash: 5f51d252637594ab36291aa125335149d53041f7fdc52d65512bba3885a945e7
- **Determinism verified: PASS ✅**

## Overall: PASS
All validators passed with 11 warnings (non-blocking).
