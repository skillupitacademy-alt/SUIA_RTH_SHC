# Implementation Plan: W2 Engineering Contract Generation

Branch: `m2-project-ai-canonical-wiring`  
Dependencies: W1A (Target Binding) and W1B (Repository Intelligence) already committed

## Context

The W2 wave implements engineering contract generation by wiring together W1A target binding and W1B repository intelligence. The contract route currently has placeholder logic that creates mock targets and uses stub contracts. W2 replaces these placeholders with real governance service integration and repository intelligence from TypeScript snapshots.

Key files examined:
- `services/project-ai/app/contracts/engineering_contract.py` - Contract model already complete with all required fields
- `services/project-ai/app/api/routes/contract.py` - Route already wires W1A/W1B but needs SHA-256 hash field population
- `services/project-ai/app/contracts/repository_intelligence.py` - W1B already implements `build_contract(snapshot, family, version)`
- `services/project-ai/app/orchestration/workflow_governance.py` - W1A governance service with `get_workflow()`, `transition_state()`, and `bind_artifact()`
- `services/project-ai/app/evidence/ledger.py` - W1D evidence harness with `record_agent_run()`

## Implementation Plan

- [ ] 1. **Fix repository snapshot SHA-256 population in contract route**
      
      The contract route currently sets `repository_snapshot_sha256=""` with a TODO comment. The snapshot file needs SHA-256 calculation. Add a function to compute the snapshot file's SHA-256 hash in `app/api/routes/contract.py` and populate the field when building the `EngineeringContract`.
      
      **Files:**
      - `services/project-ai/app/api/routes/contract.py`
      
      **Verify:** Run `pytest services/project-ai/tests/unit/test_engineering_contract.py -v` and confirm existing hash tests pass. The snapshot hash population will be integration-tested in step 4.

- [ ] 2. **Add contract SHA-256 field enforcement in contract immutability**
      
      The contract route already calls `calculate_contract_hash()` and stores contracts, but the `contract.contract_hash` field must be set with `contract_sha256` (currently using `contract_hash`). The field name in `EngineeringContract` is `contract_hash`, which matches the existing implementation. Verify that `calculate_contract_hash()` uses `model_dump_json()` with `sort_keys=True` for deterministic hashing (it currently doesn't pass this parameter).
      
      **Decision:** Add `sort_keys=True` to `model_dump_json()` call in `calculate_contract_hash()` function in `services/project-ai/app/contracts/engineering_contract.py` to ensure deterministic JSON serialization (same inputs always produce same hash).
      
      **Files:**
      - `services/project-ai/app/contracts/engineering_contract.py`
      
      **Verify:** Run `pytest services/project-ai/tests/unit/test_engineering_contract.py::TestContractHash::test_contract_hash_deterministic -v` and confirm the hash is stable across multiple calls.

- [ ] 3. **Wire workflow state transition to BRIEF_READY after contract generation**
      
      After successfully generating the contract in `create_engineering_contract()`, the route must call `governance_service.transition_state()` to move the workflow from current state to `BRIEF_READY`. The route must also bind the contract artifact using `governance_service.bind_artifact()` with `artifact_type="contract"`, `artifact_id=contract.contract_id`, and `artifact_sha256=contract.contract_hash`.
      
      **Files:**
      - `services/project-ai/app/api/routes/contract.py`
      
      **Verify:** Run `pytest services/project-ai/tests/unit/ -k "contract" -v` and confirm contract binding and state transition are tested. If no test exists, add integration test in step 4.

- [ ] 4. **Add integration test for W2 contract generation with W1A/W1B wiring**
      
      Create or update test in `services/project-ai/tests/unit/test_engineering_contract.py` or a new file `services/project-ai/tests/integration/test_w2_contract_generation.py` that verifies:
      - Contract generation uses real W1A target from `governance_service.get_workflow(workflow_id)`
      - Contract uses real W1B repository intelligence via `build_contract(snapshot, family, version)`
      - SHA-256 hash is deterministic (same inputs → same hash)
      - Modified contract fields produce different hash
      - Workflow state transitions to BRIEF_READY with contract artifact binding
      - Contract immutability: calling `create_engineering_contract()` twice with same workflow_id returns identical contract (same hash)
      
      **Files:**
      - `services/project-ai/tests/integration/test_w2_contract_generation.py` (new file)
      
      **Verify:** Run `pytest services/project-ai/tests/integration/test_w2_contract_generation.py -v` and confirm all W2 contract generation tests pass.

- [ ] 5. **Record W2 evidence via W1D harness**
      
      After successful contract generation and state transition, record an `AgentRun` entry in the evidence ledger using `record_agent_run()` from `app/evidence/ledger.py`. The run record must include:
      - `runId="w2-engineering-contract-{workflow_id}"`
      - `agentId="W2"`
      - `wave="W2"`
      - `commitBefore` and `commitAfter` (git HEAD SHA before and after, though W2 doesn't commit files)
      - `filesChanged=[]` (W2 doesn't modify files)
      - `status="completed"`
      - `timestamp` (current UTC time)
      
      Add this call at the end of `create_engineering_contract()` route handler before returning the contract.
      
      **Files:**
      - `services/project-ai/app/api/routes/contract.py`
      - `services/project-ai/app/evidence/schemas.py` (verify `AgentRun` schema matches requirements)
      
      **Verify:** Run `pytest services/project-ai/tests/integration/test_w2_contract_generation.py -v` and add test assertion that evidence ledger contains W2 agent run record after contract generation. Check that `.agents/evidence/agent-runs.jsonl` exists and contains the W2 entry.

- [ ] 6. **Verify prohibited_behaviors list is populated in contract route**
      
      The contract route already assigns `prohibited_behaviors=PROHIBITED_BEHAVIORS` when building the `EngineeringContract`. Verify that `PROHIBITED_BEHAVIORS` constant in `app/contracts/engineering_contract.py` contains all 11 required behaviors listed in the task specification.
      
      **Files:**
      - `services/project-ai/app/contracts/engineering_contract.py`
      
      **Verify:** Run `pytest services/project-ai/tests/unit/test_engineering_contract.py::TestProhibitedBehaviors -v` and confirm all expected behaviors are present.

- [ ] 7. **Add contract immutability enforcement test**
      
      The contract route already implements immutability by checking `if workflow_id in contracts_store` and returning the existing contract. Add test coverage that verifies:
      - Calling `/workflows/{workflow_id}/engineering-contract` POST twice returns the same contract (same `contract_hash`)
      - Workflow target drift detection: if workflow target changes after contract is generated, the route raises HTTP 409 Conflict
      - Contract cannot be regenerated without creating a new workflow
      
      **Files:**
      - `services/project-ai/tests/integration/test_w2_contract_generation.py`
      
      **Verify:** Run `pytest services/project-ai/tests/integration/test_w2_contract_generation.py::test_contract_immutability -v` and confirm immutability enforcement works correctly.

- [ ] 8. **Update snapshot hash calculation to use real file SHA-256**
      
      In step 1, we added snapshot SHA-256 calculation. Verify the implementation computes SHA-256 from the actual snapshot file bytes (not from JSON string representation) to ensure hash stability. The function should read the snapshot file in binary mode and compute SHA-256 directly.
      
      **Files:**
      - `services/project-ai/app/api/routes/contract.py`
      
      **Verify:** Run `pytest services/project-ai/tests/integration/test_w2_contract_generation.py -v` and add test that verifies snapshot SHA-256 matches recomputed hash from file content. This confirms hash stability and prevents JSON serialization order issues.

## Test Execution

All tests run from the `services/project-ai` directory:

```bash
cd services/project-ai

# Run all W2 contract tests
pytest tests/ -k "contract" -v

# Run specific unit tests
pytest tests/unit/test_engineering_contract.py -v

# Run integration tests (after step 4)
pytest tests/integration/test_w2_contract_generation.py -v

# Verify evidence ledger
cat ../../.agents/evidence/agent-runs.jsonl | grep "W2"
```

## Success Criteria

1. ✅ Contract generation uses real W1A target binding (not placeholder)
2. ✅ Contract uses real W1B repository intelligence from TypeScript snapshot
3. ✅ SHA-256 hash is deterministic and includes all 13 gate contracts
4. ✅ Contract immutability enforced: same workflow_id → same hash
5. ✅ Workflow state transitions to BRIEF_READY with contract artifact binding
6. ✅ Evidence ledger contains W2 agent run record
7. ✅ All 11 prohibited behaviors populated in contract
8. ✅ Snapshot SHA-256 computed from actual file content
9. ✅ All tests in `services/project-ai/tests/ -k "contract"` pass

## Notes

- **Architectural Boundary:** Python consumes TypeScript snapshot; never scans repository files directly
- **Hash Stability:** `calculate_contract_hash()` must use `sort_keys=True` for deterministic JSON serialization
- **Contract Immutability:** Once generated for a workflow_id, contract cannot be regenerated (prevents drift)
- **W1D Evidence:** Evidence ledger uses append-only JSONL format in `.agents/evidence/`
- **Test Coverage:** All W2 features have both unit tests (hash calculation, field validation) and integration tests (full contract generation flow with W1A/W1B wiring)
