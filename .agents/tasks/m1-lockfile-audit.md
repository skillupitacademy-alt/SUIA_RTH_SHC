# M1 Lockfile Audit

**Date:** 2026-10-05  
**HEAD:** 08b8958ecc2051379b7c0acead0a6d175f0f0a2c

## Summary

Lockfile changes include:
1. **Expected addition**: New `packages/project-llm-discovery` entry with its dependencies (zod, vitest, @vitest/coverage-v8)
2. **Peer dependency resolution changes**: Multiple entries show esbuild version resolution changes (0.25.12 ↔ 0.27.4) and jiti version changes (1.21.7 ↔ 2.7.0)
3. **Transitive dependency updates**: third-party-web 0.29.2 → 0.30.0 in @paulirish/trace_engine

## Analysis

The new package addition is minimal and expected:
```
packages/project-llm-discovery:
  dependencies:
    @quiz/types: workspace:*
    typescript: ^5.7.2
    zod: ^3.24.1
  devDependencies:
    @vitest/coverage-v8: ^4.0.18
    vitest: ^4.0.18
```

The peer dependency resolution changes are artifacts of pnpm's resolution algorithm recomputing transitive peer dependency chains. These are not package upgrades initiated by M1, but rather resolution shifts that occur when any new package is added to the workspace.

The third-party-web patch update (0.29.2 → 0.30.0) is an indirect transitive dependency update through @paulirish/trace_engine, likely triggered by pnpm's re-resolution during install.

## Verdict

**Status:** Expected minimal delta + transitive resolution changes

**Action:** Leave lockfile as-is. These changes are:
1. Expected (new package addition)
2. Mechanically safe (peer dependency resolution by pnpm)
3. Low-risk (patch-level transitive updates)

Attempting to revert would require either:
- Cherry-picking only the new package entry (fragile and may break workspace integrity)
- Accepting that any new package addition triggers resolution recalculation

The second is the correct understanding of monorepo lockfile behavior.

## Recommendation

Accept the lockfile as-is. The changes are expected behavior for adding a new workspace package to a large monorepo with complex peer dependency graphs.
