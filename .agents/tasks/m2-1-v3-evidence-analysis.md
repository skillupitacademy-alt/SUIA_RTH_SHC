# M2-1: V3 Evidence Verification Enhancement — Analysis

## 1. Current V3 Implementation Summary

**Source:** `packages/project-llm-discovery/src/validation/v3-evidence-paths-validator.ts`

### Core Logic

The V3 validator checks each evidence record for:
1. **Path existence** — whether the file/directory still exists
2. **Content hash verification** — whether file content matches recorded hash

### Critical vs Historical Evidence Classification

V3 distinguishes between two evidence categories:

```typescript
const CRITICAL_KINDS: Set<Evidence['kind']> = new Set([
  'type-definition',
  'component',
  'service',
]);
```

**Critical kinds** (missing → ERROR):
- `type-definition` — Source type definitions that define current state
- `component` — Renderer registrations and implementations  
- `service` — Active service implementations

**Historical kinds** (missing → WARNING):
- All other kinds (discovery artifacts, directories, imports, docs)

### Current Behavior

```typescript
if (!exists) {
  if (CRITICAL_KINDS.has(evidence.kind)) {
    errors.push({
      validator: 'V3-evidence-paths',
      code: 'CRITICAL_EVIDENCE_PATH_NOT_FOUND',
      // ... produces ERROR
    });
  } else {
    warnings.push({
      validator: 'V3-evidence-paths',
      code: 'HISTORICAL_EVIDENCE_PATH_NOT_FOUND',
      // ... produces WARNING
    });
  }
}
```

**Hash mismatch** → always WARNING (not ERROR), indicating file changed since scan.

### Key Observation

V3 already implements the critical/historical distinction but does NOT yet distinguish between:
- M1 baseline evidence (legacy)
- M2 new evidence (current work)

---

## 2. Current V8 Implementation Summary

**Source:** `packages/project-llm-discovery/src/validation/v8-evidence-completeness-validator.ts`

### Core Logic

V8 validates that all discovered entities have corresponding evidence using path-based matching:

```typescript
function hasEvidenceForPath(entityPath: string): boolean {
  const normalizedEntityPath = normalizePath(entityPath);
  for (const evidencePath of evidencePaths) {
    // Check if evidence is within entity directory or is the entity path itself
    if (evidencePath.startsWith(normalizedEntityPath + '/') || 
        evidencePath.startsWith(normalizedEntityPath + '\\') ||
        evidencePath === normalizedEntityPath) {
      return true;
    }
  }
  return false;
}
```

### Entities Checked

V8 verifies evidence exists for:
- Applications
- Packages
- Services
- Block implementations
- Composer services

### Current Behavior

**All missing entity evidence** → WARNING (never ERROR)

```typescript
warnings.push({
  validator: 'V8-evidence-completeness',
  code: 'MISSING_APPLICATION_EVIDENCE',
  message: `No evidence found for application: ${app.name}`,
  // ...
});
```

### Key Limitation

V8 uses **substring/path-prefix matching** instead of direct entity↔evidence references. The backlog correctly identifies this as insufficient for strict binding.

---

## 3. Current Evidence Contract

**Source:** `packages/project-llm-discovery/src/contracts/evidence.ts`

### Actual Fields

```typescript
export interface Evidence {
  evidenceId: string;        // deterministic: SHA-256(kind + path + symbol + contentHash).slice(0,16)
  scannerName: string;        // which scanner discovered this
  timestamp: string;          // when discovered
  path: string;               // file/directory path
  kind: Evidence['kind'];     // semantic category (17 kinds defined)
  symbol?: string;            // explicit identity component for deterministic ID
  claim: string;              // human-readable claim
  locator: string;            // machine-readable reference (file:<path> or directory:<path>)
  contentHash: string;        // SHA-256 of file content ('' for directories)
  metadata?: Record<string, unknown>; // optional additional data
}
```

### Evidence Kinds (17 total)

```
file | directory | package | import | export | test | ui-component |
api-route | service | schema | documentation | component | config |
test-directory | test-file | type-definition
```

### Key Observations

- Evidence ID is **deterministic** (same inputs → same ID)
- No explicit **provenance metadata** (scanner version, source line range, extraction timestamp)
- No **baseline epoch marker** to distinguish M1 vs M2 evidence
- No **provenance hash** to cryptographically verify evidence generation

---

## 4. M2-1 Requirements from Backlog

**Source:** `.agents/tasks/m1-m2-backlog.md`

### Exact M2-1 Text

> ### M2-1: Strengthen V3 Evidence Verification
> Currently V3 emits warnings for missing evidence paths, allowing `valid: true` with broken evidence.
> For M2, define explicit policy:
> - Historical (pre-M1) missing evidence: warn (acceptable)
> - New M2 implementation evidence: error (blocks validity)

### Key Requirements

1. **Distinguish M1 baseline from M2 new evidence**
2. **M1 evidence missing** → WARNING (backward compatibility)
3. **M2 evidence missing** → ERROR (strict integrity)
4. **Maintain snapshot validity semantics** — broken M2 evidence must prevent `valid: true`

---

## 5. Proposed Evidence Provenance Fields

To support M2-1 requirements, extend the Evidence interface with provenance metadata:

### New Fields

```typescript
export interface Evidence {
  // ... existing fields ...
  
  // Provenance metadata (M2+)
  baseline?: string;              // 'm1' | 'm2' | 'm3' etc. — which milestone generated this
  scannerVersion?: string;        // semantic version of scanner at discovery time
  sourceFile?: string;            // which file was scanned to produce this evidence
  lineRange?: [number, number];  // [startLine, endLine] if evidence extracted from specific lines
  extractedAt?: string;           // ISO 8601 timestamp of extraction (distinct from snapshot timestamp)
  provenanceHash?: string;        // SHA-256(evidenceId + scannerName + scannerVersion + timestamp + baseline)
}
```

### Rationale

- **baseline**: Enables M1 vs M2 severity distinction
- **scannerVersion**: Tracks scanner evolution for differential analysis
- **sourceFile**: Establishes evidence→entity bidirectional link
- **lineRange**: Enables precise code location verification
- **extractedAt**: Distinguishes scan time from evidence generation time
- **provenanceHash**: Cryptographic integrity for evidence chain

---

## 6. Required Contract Changes

### evidence.ts

1. Add new optional provenance fields to `Evidence` interface
2. Update JSDoc to document provenance semantics
3. Add baseline epoch constants:

```typescript
export const BASELINE_EPOCHS = {
  M1: 'm1',
  M2: 'm2',
  M3: 'm3',
} as const;

export type BaselineEpoch = typeof BASELINE_EPOCHS[keyof typeof BASELINE_EPOCHS];
```

### Backward Compatibility

All new provenance fields are **optional**, ensuring M1 evidence remains valid:
- M1 evidence: `baseline` undefined → treated as historical
- M2+ evidence: `baseline: 'm2'` → strict validation

---

## 7. Validation Logic Changes

### V3 Evidence Paths Validator

**Current severity logic:**

```
Critical kind + missing → ERROR
Historical kind + missing → WARNING
Hash mismatch → WARNING
```

**Required M2-1 logic:**

```typescript
if (!exists) {
  const isM1Evidence = !evidence.baseline || evidence.baseline === 'm1';
  const isM2Evidence = evidence.baseline === 'm2';
  
  if (isM1Evidence) {
    // Historical M1 evidence missing → WARNING (preserve backward compat)
    warnings.push({
      validator: 'V3-evidence-paths',
      code: 'M1_BASELINE_EVIDENCE_MISSING',
      message: `M1 baseline evidence path not found: ${evidence.path}`,
      // ...
    });
  } else if (isM2Evidence && CRITICAL_KINDS.has(evidence.kind)) {
    // New M2 critical evidence missing → ERROR
    errors.push({
      validator: 'V3-evidence-paths',
      code: 'M2_CRITICAL_EVIDENCE_MISSING',
      message: `M2 critical evidence path not found: ${evidence.path}`,
      // ...
    });
  } else if (isM2Evidence) {
    // New M2 non-critical evidence missing → WARNING
    warnings.push({
      validator: 'V3-evidence-paths',
      code: 'M2_EVIDENCE_MISSING',
      message: `M2 evidence path not found: ${evidence.path}`,
      // ...
    });
  }
}
```

**Hash mismatch severity:**

```typescript
if (currentHash !== evidence.contentHash) {
  const isM2Evidence = evidence.baseline === 'm2';
  
  if (isM2Evidence) {
    // M2 evidence hash mismatch → ERROR (strict integrity)
    errors.push({
      validator: 'V3-evidence-paths',
      code: 'M2_EVIDENCE_HASH_MISMATCH',
      message: `M2 evidence content hash mismatch for ${evidence.path}`,
      // ...
    });
  } else {
    // M1 evidence hash mismatch → WARNING (acceptable mutation)
    warnings.push({
      validator: 'V3-evidence-paths',
      code: 'M1_EVIDENCE_HASH_MISMATCH',
      message: `M1 baseline evidence hash mismatch for ${evidence.path}`,
      // ...
    });
  }
}
```

### Summary of Severity Rules

| Evidence | Kind | Missing Path | Hash Mismatch |
|----------|------|--------------|---------------|
| M1 (baseline undefined) | Any | WARNING | WARNING |
| M2 | Critical | **ERROR** | **ERROR** |
| M2 | Non-critical | WARNING | **ERROR** |

---

## 8. Backward Compatibility

### M1 Evidence Remains Valid

- All M1 evidence records have `baseline: undefined`
- V3 treats `undefined` baseline as M1 (historical)
- M1 missing evidence → WARNING (same as current behavior)
- M1 hash mismatch → WARNING (same as current behavior)

### Snapshot Validity

- M1 snapshot: `valid: true` with warnings (unchanged)
- M2 snapshot: `valid: false` if any M2 critical evidence missing or hash mismatch fails

### Migration Path

No migration required:
1. M1 baseline snapshot remains immutable with canonical hash `c4c328afede726241730a490a15a065c6c685398c62419e8d1185cfb08ada101`
2. New M2 scanners populate `baseline: 'm2'` when generating evidence
3. V3 validator automatically applies correct severity based on baseline field

---

## 9. Test Requirements

### New Test Cases for V3

1. **M1 baseline evidence missing** → verify WARNING with code `M1_BASELINE_EVIDENCE_MISSING`
2. **M1 baseline evidence hash mismatch** → verify WARNING with code `M1_EVIDENCE_HASH_MISMATCH`
3. **M2 critical evidence missing** → verify ERROR with code `M2_CRITICAL_EVIDENCE_MISSING`
4. **M2 non-critical evidence missing** → verify WARNING with code `M2_EVIDENCE_MISSING`
5. **M2 evidence hash mismatch** → verify ERROR with code `M2_EVIDENCE_HASH_MISMATCH`
6. **Mixed M1/M2 evidence** → verify both severities apply correctly in same snapshot

### Test File Location

Extend existing test: `packages/project-llm-discovery/src/validation/v3-evidence-paths-validator.test.ts`

### Mock Evidence Strategy

```typescript
const m1Evidence: Evidence = {
  evidenceId: 'evidence-abc123',
  scannerName: 'D3-block-scanner',
  timestamp: '2025-01-01T00:00:00Z',
  path: 'packages/content-blocks/src/blocks.ts',
  kind: 'type-definition',
  claim: 'IntroductionBlock type definition',
  locator: 'file:packages/content-blocks/src/blocks.ts',
  contentHash: 'abcd1234...',
  // baseline undefined → M1
};

const m2Evidence: Evidence = {
  ...m1Evidence,
  evidenceId: 'evidence-def456',
  baseline: 'm2', // ← M2 marker
  scannerVersion: '2.0.0',
  provenanceHash: 'xyz789...',
};
```

---

## Implementation Readiness

### Dependencies

- ✅ Evidence contract extensible (optional fields)
- ✅ V3 validator structure supports severity distinction
- ✅ CRITICAL_KINDS set already established
- ✅ M1 baseline immutable (canonical hash locked)

### Risks

- **Low**: Backward compatibility maintained via optional fields
- **Low**: No breaking changes to existing evidence records
- **Medium**: Scanner implementations must be updated to populate `baseline: 'm2'`

### Next Steps

1. Implement evidence.ts contract extension
2. Update V3 validator severity logic
3. Write comprehensive test coverage
4. Update scanners to populate M2 baseline marker
5. Verify M1 snapshot remains valid with new V3 logic
