---
title: M2 Project AI Foundation - Implementation Specification
version: 1.0.0
status: APPROVED
approver: HAA
date: 2026-10-06
base: M1 (commit 9b272567)
---

# M2 Project AI Foundation — Implementation Specification

## 1. Architecture Overview

The M2 foundation rests on a strict separation of concerns:

- **TypeScript/Node** = deterministic facts layer. Scans the repository, extracts structured evidence, computes canonical hashes, and emits a versioned snapshot JSON.
- **Python/FastAPI** = AI reasoning layer. Consumes the structured snapshot, applies LLM-based planning and agent coordination, and never directly scans the repository.
- **Evidence-driven approach**: all assertions are backed by a content-addressed evidence record; no claim is made without a verifiable locator and hash.
- **No LLM as repository scanner**: the Python layer must never open source files, run shell commands against the repo, or invent facts. It reasons over the snapshot the TypeScript layer produces.

## 2. M1 Baseline (Immutable)

| Field | Value |
|---|---|
| Merge commit | `9b272567` |
| Canonical hash | `c4c328af...` |
| Status | Frozen reference |

Rules:
- Treat `9b272567` as the immutable starting point for all M2 diffs.
- Never modify M1 evidence files.
- All M2 validators must pass the M1 snapshot without regression.

## 3. M2 Phase Breakdown

| Phase | ID | Scope |
|---|---|---|
| M2.1 | V3 Evidence Integrity | Add `lifecycle` field (`current` \| `historical`); tighten V3 validation rules |
| M2.2 | V8 Strict Evidence Binding | Add `evidenceId` to every entity; V8 validates existence, path, and kind |
| M2.3 | Real Toolchain Execution | Controlled command adapter; allowlisted commands only |
| M2.4 | Composer/API/Schema Depth | Actual extraction of routes, schemas, and composer wiring |
| M2.5 | Dependency Graph | Nodes, edges, and pinned versions from lockfiles |
| M2.6 | UBRC Structural Verification | Derived from actual build artifacts, not Markdown |
| M2.7 | Runtime/Browser Verification | Optional end-to-end validation hook |
| M2.8 | Project AI/FastAPI Foundation | Agent orchestration service wired to snapshot consumer |

## 4. Evidence Lifecycle Contract

```typescript
type EvidenceLifecycle = 'current' | 'historical';

interface Evidence {
  evidenceId: string;
  scannerName: string;
  timestamp: string;
  path: string;
  kind: EvidenceKind;
  symbol?: string;
  claim: string;
  locator: string;
  contentHash: string;
  lifecycle: EvidenceLifecycle; // NEW in M2.1
  metadata?: Record<string, unknown>;
}
```

`lifecycle` semantics:
- `'current'` — evidence that reflects the present state of the file at snapshot time.
- `'historical'` — evidence retained for audit/lineage but whose source file may have changed or been removed.

## 5. V3 Strengthening Rules

| Condition | Severity |
|---|---|
| Current evidence missing | ERROR |
| Current evidence hash mismatch | ERROR |
| Historical evidence missing | WARNING |
| Historical evidence hash mismatch | WARNING |

V3 must never downgrade an ERROR to a WARNING for convenience.

## 6. V8 Strict Binding Model

Every entity in the snapshot must carry an `evidenceId` field.

V8 validates:
1. `evidenceId` exists in `snapshot.evidence[]`.
2. `evidence.path` matches the entity's `path` field.
3. `evidence.kind` is compatible with the entity type.

No fallback to path-based or keyword-based inference is permitted. A missing or mismatched `evidenceId` is a V8 error, not a warning.

## 7. Entity Contract Changes

```typescript
interface ApplicationInfo {
  name: string;
  path: string;
  type: string;
  framework: string;
  entrypoint: string;
  evidenceId: string; // NEW in M2.2
}

interface BlockImplementation {
  type: string;
  version?: string;
  path: string;
  exported: boolean;
  evidenceId: string; // NEW in M2.2
}

// PackageInfo, ServiceInfo, BlockRenderer, and all other entity
// interfaces similarly receive evidenceId: string in M2.2.
```

## 8. Schema Version Bump

| Release | schemaVersion | Reason |
|---|---|---|
| M1 | `1.0.0` | Initial |
| M2 | `1.1.0` | Semantic contract change: `lifecycle` + `evidenceId` fields |

Conventions:
- Minor bump for backward-compatible contract additions.
- Major bump only if a consumer must be rewritten to handle the new schema.

## 9. Determinism Requirements

- Evidence normalised by `evidenceId` (not by timestamp).
- Duplicate `evidenceId` detection is an **error**, not a silent drop.
- Timestamps **excluded** from `canonicalHash` computation.
- Invariant: repository state → deterministic snapshot → deterministic hash (same input always produces the same hash).

## 10. Command Execution Safety

```typescript
type ToolchainCommand =
  | 'node-version'
  | 'pnpm-version'
  | 'turbo-version'
  | 'typescript-version';

// The adapter accepts ONLY the above tokens.
// AI-generated or user-supplied shell strings are NEVER executed.
```

The controlled command adapter maps each `ToolchainCommand` token to a hardcoded argv array. No interpolation, no shell expansion.

## 11. Python/FastAPI Architecture

- **Location**: to be determined after inspecting existing service conventions in the monorepo (do not assume a path before M2.8 begins).
- **Responsibilities**: LLM call orchestration, agent coordination, planning loop management.
- **Does NOT**: duplicate TypeScript discovery, open source files, or run shell commands against the repository.
- **Consumes**: the structured snapshot JSON produced by the TypeScript layer.
- **Validates**: snapshot structure with Pydantic before any AI reasoning begins.

## 12. Agent Governance

- All agents follow the canonical artifact policy at `.agents/policies/canonical-artifact-policy.md`.
- Extend existing artifacts before creating new ones.
- No duplicate Markdown proliferation — one canonical document per concern.
- All reasoning must be evidence-driven (snapshot facts), not Markdown-driven.

## 13. Testing Strategy

- Extend existing test directories; do not create parallel test trees.
- Unit tests required for every validator and scanner change introduced in M2.
- Integration test chain: `entity → evidenceId → evidence → path → hash → determinism`.
- M2 maintains a 100% pass rate on the full test suite at every phase gate.

## 14. Acceptance Gates

| Phase | Gate |
|---|---|
| M2.1 | V3 strict validation passes; all tests green |
| M2.2 | All entities carry `evidenceId`; V8 strict validation passes; all tests green |
| M2.3 | Toolchain commands execute via adapter; no arbitrary shell; tests green |
| M2.4 | Composer/API/schema depth extracted; snapshot enriched; tests green |
| M2.5 | Dependency graph complete; nodes, edges, versions correct; tests green |
| M2.6 | UBRC structural verification passes from actual build artifacts; tests green |
| M2.7 | Runtime/browser verification hook passes (or marked optional-skip); tests green |
| M2.8 | FastAPI service consumes snapshot only; never invents facts; tests green |

## 15. Implementation Order

| Phase | Label | Status |
|---|---|---|
| A | Governance | ✅ Complete (commit `9beb25aa`) |
| B | Evidence lifecycle + V3 strengthening | 🔲 Next |
| C | Direct binding + V8 strict | 🔲 Pending |
| D | Discovery depth (M2.4–M2.5) | 🔲 Pending |
| E | Runtime verification (M2.6–M2.7) | 🔲 Pending |
| F | Project AI/FastAPI (M2.8) | 🔲 Pending |
| G | I2 Introduction | 🔲 After foundation solid |

## 16. Anti-Patterns to Avoid

| # | Anti-pattern |
|---|---|
| 1 | ❌ LLM scanning the repository directly |
| 2 | ❌ Python duplicating TypeScript discovery logic |
| 3 | ❌ Creating a new Markdown file per agent per run |
| 4 | ❌ Modifying the M1 baseline artifacts |
| 5 | ❌ Executing arbitrary AI-generated shell commands |
| 6 | ❌ Weakening determinism (e.g. timestamp-dependent hashes) for convenience |

## 17. Success Criteria

- M1 remains the immutable baseline throughout all M2 phases.
- The evidence graph is trustworthy for AI reasoning at every phase gate.
- All validators strengthen (never weaken) across M2.
- Tests pass at 100% at every phase gate.
- Canonical artifacts are extended (not duplicated).
- The Python/FastAPI layer reasons exclusively over snapshot facts and never invents facts.
