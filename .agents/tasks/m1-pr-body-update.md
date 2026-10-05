# PR #23 Body Update — M1 Repository Discovery

> Copy this text verbatim into the PR description on GitHub. Replace the existing description.

---

## ⚠️ DO NOT MERGE — CORRECTION_REQUIRED

**Current HEAD:** 08b8958ecc2051379b7c0acead0a6d175f0f0a2c
**Status:** CORRECTION_REQUIRED
**Audit date:** 2026-10-05

This PR introduces `@quiz/project-llm-discovery` (M1 Repository Discovery).
A second-pass forensic audit identified implementation defects that must be
resolved before this PR is merge-ready. See `.agents/tasks/m1-closure-matrix.md`
for the full finding list and merge gate checklist.

### Merge Gates (all must be ✅ before requesting re-review)

- [ ] P0-1: Silent scanner errors propagate to callers
- [ ] P0-2: D6 integration discovery returns ≥1 for `__tests__/integration/`
- [ ] P0-3: V1 `z.any()` replaced with typed Zod schemas
- [ ] P0-4: D3 VERIFIED flag reflects actual checks (not assumptions)
- [ ] P0-5: All attestation docs reference current HEAD SHA
- [ ] P0-6: Attestation commit count corrected (10 total / 9 feature)
- [ ] TypeScript compiles clean
- [ ] All tests pass
- [ ] Snapshot determinism test passes

### What is genuinely present (confirmed by remote inspection)

- Package `@quiz/project-llm-discovery` exists with D1–D7 scanners
- Evidence collector/normalizer implemented
- V1–V9 validator files exist
- Integration/determinism tests exist
- README and governance artifacts present
- 10 commits, 84 changed files (+13 786 / -120)

### Phase 1 (this PR, after corrections)

- Repository structure discovery
- Snapshot generation and hashing
- Schema/structural validation

### Phase 2 (M2, separate PR)

- Stronger evidence binding (V8)
- V3 warning→error policy for new evidence
- Full dependency graph
- UBRC structural verification
- Runtime/browser verification
