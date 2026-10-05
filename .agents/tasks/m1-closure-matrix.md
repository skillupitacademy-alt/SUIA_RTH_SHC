# M1 Closure Matrix

Generated against HEAD: 08b8958ecc2051379b7c0acead0a6d175f0f0a2c
Status: CORRECTION_REQUIRED — not merge-ready

## P0 — Must Fix Before Merge

| ID | Finding | Severity | Location | Fix Required |
|----|---------|----------|----------|--------------|
| P0-1 | Silent repository-level errors swallowed in scanners — errors do not surface to callers | High | D1-D6 scanners | Re-throw or return structured errors so callers can distinguish failure from empty result |
| P0-2 | D6 integration-suite discovery returns 0 despite integration test files existing under `__tests__/integration/` | High | D6 scanner | Fix directory-traversal path matching to detect `__tests__/integration/` entries |
| P0-3 | V1 uses `z.any()` for nearly all major snapshot structures, contradicting governance claim of "no any types" | High | v1-schema-validator.ts | Replace `z.any()` with typed Zod schemas matching the interfaces in `snapshot.ts` |
| P0-4 | D3 "VERIFIED" flag is set based only on type-definition + renderer presence; UBRC compliance is not checked; `documented: true` is assumed | High | D3 block scanner | Implement actual UBRC compliance check or change flag name/semantics to match what is actually verified |
| P0-5 | Stale attestation artifacts reference SHA `2973c399` and placeholder dates as current | Medium | `.agents/tasks/` | Mark stale or delete; update baseline to CURRENT_HEAD (done in steps 1–2 above) |
| P0-6 | Commit-count discrepancy: attestation says 9 commits, GitHub reports 10 | Medium | Attestation docs | Update attestation to accurately reflect total vs feature commit counts |

## P1 — Defer to M2

| ID | Finding | Severity | Notes |
|----|---------|----------|-------|
| P1-1 | V3 missing-evidence path emits warning instead of error, allowing `valid: true` with broken evidence paths | Medium-High | Acceptable for M1 if policy explicitly states historical missing evidence is non-blocking; document the policy |
| P1-2 | V8 evidence completeness uses keyword substring matching instead of strict one-to-one entity↔evidence binding | Medium | Hardening gap; strengthen before M2 integration workflows depend on it |
| P1-3 | D1/D2 toolchain version detection relies on assumptions rather than executing the toolchain | Medium | Defer; document as known limitation |
| P1-4 | D4 schema extraction is shallow; Composer/API/deep-schema analysis not implemented | Medium | Defer to M2 |
| P1-5 | D5 dependency scope analysis incomplete — full graph not built | Low-Medium | Defer to M2 |

## Merge Gates (all P0 items must be CLOSED)

1. [ ] Silent scanner errors — structured error propagation implemented and tested
2. [ ] D6 integration discovery — returns ≥1 for the new package's `__tests__/integration/` directory
3. [ ] V1 `z.any()` eliminated — all major snapshot fields use typed Zod schemas
4. [ ] D3 VERIFIED semantics — accurate flag name/semantics; UBRC check real or explicitly deferred with renamed flag
5. [ ] Stale artifacts — all `.agents/tasks/` docs reflect CURRENT_HEAD
6. [ ] Commit count — attestation accurately reflects 10 total / 9 feature commits
7. [ ] TypeScript compiles without errors on `m1-repository-discovery`
8. [ ] All existing tests pass
9. [ ] Snapshot determinism test passes (re-run after code corrections)
