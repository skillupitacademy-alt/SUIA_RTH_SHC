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
