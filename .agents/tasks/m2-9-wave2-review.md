# Wave 2 Remediation Review — P1-CONTRACT & P1-FRONTEND

Two commits completing the repository boundary migration and frontend integration for M2.9 canonical wiring. R3 eliminates Python filesystem scanning from contract generation, replacing it with TypeScript snapshot consumption. R4 replaces a competing state machine with a proper API client and React hooks sourcing all data from the backend.

**Watch for:** Sentinel value `UNKNOWN_VERSION` appears in two locations as a fallback when workflow target version is missing; this should fail validation but won't cause silent corruption. No blocking architectural violations found.

**Verdict**: APPROVED

## High-level view

Contract route now calls `build_contract(snapshot, family, version)` with TypeScript-generated snapshot data instead of scanning repository files. Generic default factories in `RepositoryBlockContract` fields were removed; contracts derive their structure from snapshot evidence only. Version extraction standardized to use `UNKNOWN_VERSION` sentinel when workflow target binding is missing, replacing the previous `MISSING_TARGET_VERSION` format inconsistency.

Frontend gained a proper API client with real fetch calls for workflow state, candidate upload, approval, certification, and runtime verification. React hook `useWorkflowState` wraps the client and manages loading/error states. `CertificationBadge` displays gate results (UBRC, brand, theme, registry, renderer, evidence) and handles `SKIPPED` status gracefully without treating it as failure. `RuntimeVerificationPanel` provides trigger controls and displays runtime health and browser verification. The competing `projectLlmWorkflowCoordinator.ts` state machine (441 lines) was retired; no hardcoded fixture data remains.

<details>
<summary>Issues (2)</summary>

1. **Version sentinel inconsistency** — `candidate.py` and `placement.py` use `UNKNOWN_VERSION` as fallback when workflow target version is missing, but this should be enforced at intake rather than silently accepted. Add schema validation in Wave 3 to reject candidates without proper version binding before placement logic runs.

2. **In-memory contract store** — `contracts_store` dictionary loses contracts on server restart, breaking immutability guarantees across deployments. Replace with persistent storage (database, Redis, or file store) in Wave 3 to maintain contract hash integrity in distributed environments.

</details>

<details>
<summary>Details</summary>

## Repository boundary enforcement in contract generation

Contract route `create_engineering_contract()` now calls `build_contract(snapshot, family, version)` instead of `build_contract_legacy(repo_root, family, version)`. The new path loads a canonical snapshot from `packages/project-llm-discovery/output/snapshot.json` via `load_repository_snapshot()`, then passes it to `build_contract()` which extracts evidence from the snapshot's `evidence` array. No file operations occur in Python during contract generation.

The snapshot loading function is separated for test mockability: tests can mock `load_repository_snapshot()` to return fixture snapshots. HTTP 404 is raised if snapshot is missing.

`build_contract_legacy()` remains in `repository_intelligence.py` for backward compatibility with existing tests, marked deprecated. Production contract route does not reference it.

## Contract field defaults replaced with snapshot-derived extraction

Generic default factory lambdas in `RepositoryBlockContract` fields (`required_artifacts`, `acceptance_criteria`, `renderer_contract`, `composer_contract`, `schema_contract`) were removed. These previously returned static lists that didn't reflect actual repository state. Now all fields use `default_factory=list` or `default_factory=dict` and remain empty until `build_contract()` populates them from snapshot evidence.

`build_contract()` searches the snapshot's `evidence` array for entries matching `kind == 'canonical_block'` and the requested family/version path pattern. When a match is found, it extracts `path`, `contentHash` (SHA-256), and `evidenceId` to construct a `RepositoryEvidence` object. SHA-256 hashes are never recomputed by Python; they're taken directly from the TypeScript snapshot.

## Version binding sentinel standardization

Wave 1 introduced version binding from `WorkflowTarget.version` but left inconsistent fallback formats. R3 standardizes both `placement.py` and `candidate.py` to use `UNKNOWN_VERSION` sentinel with explicit comments marking this as a validation gap to fix in Wave 3.

**likely**: The sentinel should trigger validation failure upstream rather than propagating through placement logic. Current code allows placement manifest generation with `blockVersion: "UNKNOWN_VERSION"`, which will fail when the manifest reaches repository operations, but the error message will be less clear than an early rejection at candidate intake.

## Frontend API client replaces hardcoded state machine

`projectLlmClient.ts` implements seven methods calling the FastAPI backend:
- `getWorkflowState(workflowId)` → `/api/project-llm/workflows/{workflowId}`
- `uploadCandidate(workflowId, files)` → `/api/project-llm/candidates/upload` (multipart form)
- `approveImplementation(workflowId, manifestHash)` → `/api/project-llm/approvals/approve`
- `getCertificationStatus(workflowId)` → `/api/project-llm/workflows/{workflowId}/certification`
- `triggerRuntimeVerification(workflowId)` → POST to `/runtime-verification`
- `getRuntimeHealth(workflowId)` → GET for process management status
- `getBrowserVerificationStatus(workflowId)` → returns `PASS`, `FAIL`, or `SKIPPED`

All methods use native `fetch()` with error handling that throws on non-2xx responses. Base URL defaults to `/api/project-llm`.

`useWorkflowState()` hook wraps `getWorkflowState()` with React state management, returning `{ state, isLoading, error, refetch }`. The hook includes a cancellation token to prevent stale updates if the component unmounts during fetch.

## Competing state authority retired

`projectLlmWorkflowCoordinator.ts` (441 lines) implemented a client-side state machine with hardcoded transition logic, lifecycle orchestration, and step validation. This competed with the backend's canonical workflow authority. R4 deletes the file entirely. Transition logic now lives exclusively in the backend.

## Certification and runtime verification UI

`CertificationBadge` displays certification lifecycle state (`CERTIFICATION_READY`, `AWAITING_GATE_2`, `CERTIFIED`, `REJECTED`) with color-coded header. Gate results array shows individual gate status (UBRC verification, brand independence, theme independence, registry integration, renderer wiring, evidence collection) as `PASS`, `FAIL`, `SKIPPED`, or `PENDING` badges.

**confirmed**: `SKIPPED` is handled as a neutral status (gray badge, "not a failure" note), not treated as gate failure.

`RuntimeVerificationPanel` provides a trigger button calling `triggerRuntimeVerification()`, then displays runtime health status (healthy/unhealthy, process status, last checked timestamp) and browser verification result. Browser verification shows `PASS`, `FAIL`, or `SKIPPED` with appropriate icons (✓, ✗, −).

## Test coverage

R3 updated `test_contract_routes.py` to mock `load_repository_snapshot()` instead of relying on real files. 13/13 contract route tests passing.

R4 added `projectLlmClient.test.ts` with fetch mocking for all seven client methods. Tests verify request format (URL, method, headers, body) and response parsing. Error cases (4xx, 5xx) verified to throw with appropriate messages. 55 frontend tests passing total.

Backend baseline remains 461 PASS / 58 FAIL, matching Wave 1 completion state.

**Not tested**: Integration between frontend components and real backend responses beyond unit-level mocking.

## Scope discipline

R3 changes confined to contract generation path: `contract.py`, `engineering_contract.py`, `repository_intelligence.py`, `candidate.py`, `placement.py`, and associated tests. All within stated scope.

R4 changes confined to `apps/skillhubcore-admin/src/lib/project-llm/`: API client, hooks, components, types.

Wave 1 fixes preserved: `build_contract()` signature takes `(snapshot, family, version)`, version binding reads from `workflow_target.version`.

</details>

<details>
<summary>File Map</summary>

### R3 Commit (185adebc)

- `services/project-ai/app/api/routes/contract.py` — calls `build_contract(snapshot, ...)` instead of legacy path; adds `load_repository_snapshot()` for mockability
- `services/project-ai/app/contracts/engineering_contract.py` — removed generic defaults from field definitions
- `services/project-ai/app/contracts/repository_intelligence.py` — `build_contract()` extracts from snapshot evidence; `build_contract_legacy()` marked deprecated
- `services/project-ai/app/api/routes/candidate.py` — standardized version fallback to `UNKNOWN_VERSION`
- `services/project-ai/app/agents/placement.py` — standardized version fallback to `UNKNOWN_VERSION`
- `services/project-ai/tests/unit/test_contract_routes.py` — mocks `load_repository_snapshot()` instead of using real files
- `services/project-ai/tests/unit/test_repository_intelligence.py` — test adjustments for new signature

### R4 Commit (00154f50)

- `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts` — API client with seven backend methods
- `apps/skillhubcore-admin/src/lib/project-llm/api/__tests__/projectLlmClient.test.ts` — fetch mocking for all client methods
- `apps/skillhubcore-admin/src/lib/project-llm/hooks/useWorkflowState.ts` — React hook wrapping `getWorkflowState()` with loading/error states
- `apps/skillhubcore-admin/src/lib/project-llm/components/CertificationBadge.tsx` — displays gate results and certification state
- `apps/skillhubcore-admin/src/lib/project-llm/components/RuntimeVerificationPanel.tsx` — trigger controls and status display
- `apps/skillhubcore-admin/src/lib/project-llm/types/canonicalWorkflowState.ts` — TypeScript types matching backend models
- `apps/skillhubcore-admin/src/lib/project-llm/index.ts` — updated exports (removed coordinator, added new components/hooks)
- `apps/skillhubcore-admin/src/lib/project-llm/projectLlmWorkflowCoordinator.ts` — deleted (441 lines removed)

[Full diff available via `git diff df5e3e19..185adebc` (R3) and `git diff 185adebc..00154f50` (R4)]

</details>
