# M1 P1 Corrections — Post-Merge Follow-Up

**Status:** 🟡 P1 (Should fix but can defer post-merge)  
**Date:** 2026-10-05  
**Context:** PR #23 M1 Repository Discovery  
**Package:** `@quiz/project-llm-discovery` v1.0.0  

---

## Overview

All P0 (blocking) issues in M1 have been resolved. This document tracks **P1 issues** — implementation gaps that should be fixed but do not block merge.

These issues were identified during forensic audit but are classified as:
- Non-blocking for M1 completion
- Require policy decisions or architectural refinement
- Should be addressed before M2 implementation begins

---

## P1-1: V3 Warning-Only Evidence Paths

### Current State
V3 validator uses `warnings.push(...)` for missing evidence paths and never produces errors.

```typescript
// Current behavior in v3-evidence-paths-validator.ts
if (!exists) {
  warnings.push({
    validator: 'V3-evidence-paths',
    code: 'EVIDENCE_PATH_NOT_FOUND',
    message: `Evidence path does not exist: ${evidence.path}`,
    path: evidence.path,
  });
}
// validation.valid remains true
```

### Issue
This means:
```
Evidence path missing
    ↓
warning (not error)
    ↓
validation.valid = true
```

A snapshot with broken evidence paths still validates as `valid: true`.

### Why It Matters
M1's governance policy states:
> "All claims traceable to file path + content hash"

But current V3 allows broken evidence paths without distinction between:
- **Historical evidence missing** (file moved/deleted after original scan)
- **New I2 implementation evidence missing** (should block validation)

### Recommendation
Before M2, update V3 policy to:
1. Define when missing evidence paths are **errors** vs **warnings**
2. Distinguish historical snapshots (warnings acceptable) from newly generated snapshots (errors required)
3. Consider adding evidence timestamp validation: evidence older than 30 days → warning, newer → error

### Severity
**Medium–High** for I2 workflow (implementation claims must have valid evidence)

---

## P1-2: V8 Weak Evidence Completeness

### Current State
V8 uses keyword matching for evidence completeness:

```typescript
// Current behavior in v8-evidence-completeness-validator.ts
function hasMatchingEvidence(entityName: string, evidenceKeywords: string[]): boolean {
  return evidenceKeywords.some(keyword => entityName.toLowerCase().includes(keyword));
}
```

### Issue
This can validate by **keyword coincidence** rather than direct entity-to-evidence binding:

```
Application: "foo-admin"
Evidence claim: "Admin package directory discovered"
    ↓
V8 validation: PASS (because "admin" appears in both)
```

This is not the same as:
```
Entity X
    ↓
exact evidence record
    ↓
exact path + hash
```

### Why It Matters
Project LLM philosophy requires **auditable evidence**. Keyword matching provides a statistical signal, not cryptographic proof.

For example:
- Application `user-service` could pass validation if any evidence contains the word "user"
- No guarantee the evidence is actually about `user-service` vs `user-admin` or `user-types`

### Recommendation
Before M2, strengthen V8 to require:
1. **Explicit evidence IDs**: Each entity references specific `evidenceId` values
2. **One-to-one binding**: Application `user-service` → evidence record with `locator: "file:apps/user-service/package.json"`
3. **Content hash verification**: Evidence record includes `contentHash` matching current file state

This enables true traceability:
```typescript
entity.evidenceIds = ['evidence-abc123', 'evidence-def456'];
// Validator confirms each evidenceId exists in snapshot.evidence[]
```

### Severity
**High for long-term architecture**, **Medium for M1** (current keyword approach is acceptable for initial discovery but insufficient for production audit trail)

---

## P1-3: Attestation Commit Count Discrepancy

### Current State
- **GitHub PR #23 metadata:** 10 commits
- **M1 attestation (before correction):** "Commit Count: 9 commits"
- **Actual commits:** 9 FEAT-related commits + 1 additional commit (`061d89f7`)

### Issue
The attestation did not clearly distinguish:
- **Total branch commits** (10)
- **Feature/FEAT commits** (9 main implementation commits)
- **Additional commits** (1 commit for validator exports)

### Why It Matters
Implementation history must be faithfully represented. A mismatch between GitHub metadata and attestation creates audit ambiguity.

### Resolution Status
✅ **CORRECTED** in this commit. Attestation now states:
```
Total Branch Commits: 10 commits
Feature/FEAT Commits: 9 commits (all FEAT-related work)
Note: The 10th commit (061d89f7) exports individual validators
```

### Follow-Up Action
None required. Already fixed. Listed here for audit trail.

---

## P1-4: D1/D2 Version Assumptions

### Current State
D1 (structure scanner) and D2 (runtime scanner) make assumptions about package manager version formats:

```typescript
// D2 assumes pnpm version in packageJson.packageManager format
const version = packageJson.packageManager?.split('@')[1] || 'unknown';
```

### Issue
This works for:
```json
"packageManager": "pnpm@9.15.4"
```

But may fail or produce `'unknown'` for:
- `"packageManager": "pnpm"` (no version)
- `"packageManager": "pnpm@9.15.4+sha256.abc123"` (version with integrity hash)
- Non-standard version formats

### Why It Matters
Version discovery is important for dependency analysis and reproducibility. Silent fallback to `'unknown'` masks parsing failures.

### Recommendation
1. Document version parsing assumptions in scanner comments
2. Add finding when version cannot be parsed:
   ```typescript
   findings.push({
     severity: 'warning',
     code: 'VERSION_PARSE_FAILED',
     message: `Could not parse package manager version: ${packageJson.packageManager}`,
   });
   ```
3. Consider using dedicated package manager version parsers (e.g., `semver` library)

### Severity
**Low** (current approach works for standard formats; edge cases are rare)

---

## P1-5: Deterministic Evidence ID Contradiction

### Current State
Evidence IDs are currently UUIDs generated during each scan:

```typescript
evidenceId: crypto.randomUUID()
```

### Issue
This creates a tension:
- **Snapshot canonical hash** is deterministic (same repo state → same hash)
- **Evidence IDs** are non-deterministic (different UUID each scan)

However, evidence IDs are excluded from canonical hash calculation, so determinism is preserved.

But this means:
```
Run 1: evidenceId = 'a1b2c3d4...'
Run 2: evidenceId = 'e5f6g7h8...'
    ↓
Same evidence, different IDs
```

### Why It Matters
If future M2 differential analysis needs to **track specific evidence records across snapshots**, non-deterministic IDs make this impossible.

For example:
```
"Has this specific evidence record changed?"
    ↓
Cannot answer because IDs differ between snapshots
```

### Recommendation
Consider switching to **content-derived evidence IDs**:
```typescript
evidenceId = SHA-256(scannerName + path + contentHash + kind)
```

This ensures:
- Same file + same scanner → same evidence ID
- Evidence IDs become stable across snapshots
- Differential analysis can track individual evidence records

### Severity
**Low for M1** (current approach works), **Medium for M2** (differential analysis requires stable IDs)

---

## P1-6: D4 API Parsing Placeholders

### Current State
D4 (Composer scanner) contains placeholder implementations for API parsing:

```typescript
// Simplified API discovery — could be enhanced
const apiFiles = await adapter.listFiles(apiRoutesDir, '*.ts');
// TODO: Parse route handlers for HTTP methods, parameters, schemas
```

### Issue
D4 currently discovers API route **files** but does not parse:
- HTTP methods (GET, POST, PUT, DELETE)
- Route parameters (`:id`, `[id]`, etc.)
- Request/response schemas
- Middleware

This is acceptable for M1 (file-level discovery) but limits M2 API analysis capabilities.

### Why It Matters
For M2 semantic analysis, API metadata is important:
- **Schema validation:** Are request/response types consistent?
- **Versioning:** Which APIs are v1 vs v2?
- **Coverage:** Are all APIs documented?

### Recommendation
Document known limitations in D4 comments:
```typescript
// LIMITATION: Currently discovers API route files only.
// Does not parse HTTP methods, parameters, or schemas.
// See M1-P1-CORRECTIONS-NEEDED.md (P1-6) for future enhancement.
```

Plan D4 enhancement for M2:
- Parse Next.js route handler exports (GET, POST, etc.)
- Extract route parameters from file paths
- Discover Zod schemas for request validation

### Severity
**Low** (M1 scope is file-level discovery; deeper parsing is M2 work)

---

## P1-7: D5 `@quiz/*`-Only Scope

### Current State
D5 (Dependencies scanner) only scans `@quiz/*`-namespaced packages:

```typescript
const quizPackages = allPackages.filter(pkg => pkg.name.startsWith('@quiz/'));
```

### Issue
This means D5 **ignores external dependencies** like:
- `next`
- `react`
- `@radix-ui/*`
- `drizzle-orm`
- etc.

Dependency graph only includes **internal workspace packages**, not the full transitive closure.

### Why It Matters
For full dependency analysis, external dependencies matter:
- **Security audits:** Which packages have vulnerabilities?
- **License compliance:** Which packages have restrictive licenses?
- **Version consistency:** Are multiple versions of React in use?

### Recommendation
Document D5 scope limitation in scanner comments:
```typescript
// SCOPE: Discovers @quiz/* workspace packages only.
// External dependencies (npm packages) are not included in graph.
// See M1-P1-CORRECTIONS-NEEDED.md (P1-7) for future enhancement.
```

Consider D5 enhancement for M2:
- Add `externalDependencies` field to snapshot
- Scan `node_modules` for installed versions
- Build transitive dependency closure

### Severity
**Low** (M1 scope is workspace discovery; full dependency graph is M2 work)

---

## Summary Table

| Issue | Severity | Blocks M1? | Blocks M2? | Action Required |
|-------|----------|------------|------------|-----------------|
| **P1-1: V3 warning-only** | Medium–High | ❌ No | ⚠️ Yes (for I2) | Define error vs warning policy |
| **P1-2: V8 weak evidence** | High (long-term) | ❌ No | ⚠️ Yes | Switch to explicit evidence IDs |
| **P1-3: Commit count** | Low | ❌ No | ❌ No | ✅ Already fixed |
| **P1-4: Version assumptions** | Low | ❌ No | ❌ No | Document + add warnings |
| **P1-5: Evidence ID determinism** | Medium (for M2) | ❌ No | ⚠️ Maybe | Consider content-derived IDs |
| **P1-6: D4 API placeholders** | Low | ❌ No | ❌ No | Document + plan M2 enhancement |
| **P1-7: D5 scope limitation** | Low | ❌ No | ❌ No | Document + plan M2 enhancement |

---

## Recommendations

### Before Merging PR #23
✅ All P0 issues resolved  
✅ All P1 issues documented  
✅ Attestation corrected  

**Verdict:** ✅ **APPROVE FOR MERGE**

### Before Starting M2
Address P1-1 and P1-2:
1. Define V3 error vs warning policy for evidence paths
2. Strengthen V8 to require explicit evidence IDs
3. Consider P1-5 (content-derived evidence IDs)

### Before Production Use
Address remaining P1 issues (P1-4 through P1-7):
1. Add version parsing robustness (P1-4)
2. Implement D4 API parsing (P1-6)
3. Extend D5 to external dependencies (P1-7)

---

**Document Status:** 🟢 COMPLETE  
**Audit Trail:** All P1 issues from forensic audit documented  
**Next Review:** Before M2 kick-off  

