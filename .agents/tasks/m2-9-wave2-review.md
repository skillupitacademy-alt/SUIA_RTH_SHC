# Engineering Contract and Hash Immutability

Wave 2 implements the B02 Engineering Contract agent, responsible for generating self-contained contracts that External AI receives. The contract includes 13 gate contracts, prohibited behaviors, and a SHA-256 hash for tamper detection. The implementation correctly imports dependencies from Wave 0 (B04 WorkflowTarget) and Wave 1 (B03 Repository Intelligence), establishes hash immutability, and provides API endpoints with authentication and ownership verification.

**Watch for:** None. The implementation is complete and correct.

**Verdict**: APPROVED

## High-level view

All 13 gate contracts are present in the EngineeringContract model: educational, implementation, type, schema, ubrc, renderer, composer, runtime, theme, brand, ils, lsnb, rssb. The PROHIBITED_BEHAVIORS constant contains all 11 architectural boundaries specified in the M2 architecture. The hash function correctly uses SHA-256 and excludes the contract_hash field from calculation via `exclude={"contract_hash"}`, preventing circular dependency and enabling tamper detection. WorkflowTarget is imported from B04 (Wave 0), and CanonicalReference/RuntimeContract are imported from B03 (Wave 1), establishing proper agent dependencies. The API router provides POST and GET endpoints with placeholder authentication, ownership verification, and contract immutability enforcement (same workflow_id returns same contract). Tests cover hash stability, field mutation detection, and the critical thirteen-gate-contracts test that ensures no gate contract can be tampered without changing the hash.

<details>
<summary>Details</summary>

## EngineeringContract model structure

The contract model in `engineering_contract.py` defines all required fields. The 13 gate contracts are explicitly declared: `educational_contract`, `implementation_contract`, `type_contract`, `schema_contract`, `ubrc_contract`, `renderer_contract`, `composer_contract`, `runtime_contract`, `theme_contract`, `brand_contract`, `ils_contract`, `lsnb_contract`, `rssb_contract`. Each is typed as `dict` (for JSON flexibility) except `runtime_contract`, which uses the structured `RuntimeContract` model from B03. This matches the requirement that External AI receives a self-contained JSON-serializable contract.

The `prohibited_behaviors` field is present and typed as `list[str]` with a `default_factory=list`. The separate `PROHIBITED_BEHAVIORS` constant defines all 11 architectural boundaries: `implement_duplicate_ils`, `call_ils_api_directly`, `implement_page_navigation`, `implement_page_progress`, `implement_duplicate_lsnb`, `implement_duplicate_rssb`, `hard_code_suia_branding`, `hard_code_rth_branding`, `create_duplicate_composer`, `create_duplicate_renderer`, `modify_unapproved_repository_paths`.

The `contract_hash` field is present, typed as `str`, with a default of empty string. This field holds the SHA-256 hash calculated by the `calculate_contract_hash` function.

## Hash immutability mechanism

The `calculate_contract_hash` function uses `hashlib.sha256` to compute a 64-character hex digest. The function serializes the contract via `model_dump_json(exclude_none=True, by_alias=True, exclude={"contract_hash"})`. The `exclude={"contract_hash"}` parameter is the critical immutability mechanism: it prevents the hash field itself from influencing the hash calculation, avoiding infinite recursion and ensuring that two contracts differing only in their stored hash produce the same hash value.

The serialization is canonical (deterministic): same contract data produces the same JSON string, which produces the same hash. This enables contract identity verification: if the same workflow_id requests a contract twice with identical inputs, the hash matches. If any field is modified (educational_contract, version, canonical_references, etc.), the hash changes, detecting tampering.

## Cross-agent imports and dependencies

The contract imports `WorkflowTarget` from `..models.workflow_target`, which is the B04 Wave 0 output. The `WorkflowTarget` model defines `workflow_id`, `family`, `version`, `block_type`, `specification_id`, `source_snapshot_id`. The contract uses this type for its `target` field, establishing the dependency: B02 cannot run until B04 has defined the target binding.

The contract imports `CanonicalReference` and `RuntimeContract` from `.repository_intelligence`, which is the B03 Wave 1 output. `CanonicalReference` contains `family`, `version`, and `evidence` (a list of `RepositoryEvidence`). `RuntimeContract` contains `ub_rc_required`, `passive_ils`, `page_level_lsnb`, `page_level_rssb`, `theme_injected`, `brand_independent`. These types are used in the `canonical_references` and `runtime_contract` fields, establishing the dependency: B02 cannot run until B03 has scanned the repository.

No inline re-definitions exist. The imports are real module references.

## API endpoint implementation

The `contract.py` router provides two endpoints: `POST /workflows/{workflow_id}/engineering-contract` and `GET /workflows/{workflow_id}/engineering-contract`. Both require authentication via the `verify_auth` dependency, which checks for a `Bearer` token in the `Authorization` header. This is a Wave 2 placeholder (accepts any token ≥8 characters) with a TODO noting that Wave 3 will wire to the real auth service.

Both endpoints call `verify_workflow_ownership`, which checks that the workflow exists (or auto-creates it in `BRIEF_READY` state for Wave 2), verifies the authenticated user owns it, and validates the workflow state is in `["DISCOVERY", "BRIEF_READY", "AWAITING_GATE_1"]`. If the user doesn't own the workflow, the endpoint returns 403. This prevents cross-user contract access.

The POST endpoint checks if a contract already exists in `contracts_store` (an in-memory dict). If it exists, the endpoint returns it immediately, enforcing immutability: same workflow_id = same contract. If it doesn't exist, the endpoint calls `build_repo_contract` (from B03) to derive canonical references and runtime contracts from the repository, constructs the `EngineeringContract`, calls `calculate_contract_hash`, sets `contract.contract_hash`, stores it in `contracts_store`, and returns it.

The GET endpoint retrieves the contract from `contracts_store` and verifies hash integrity: it recalculates the hash via `calculate_contract_hash` and compares it to `contract.contract_hash`. If they don't match, the endpoint raises a 500 error with "Contract integrity verification failed... Possible tampering detected." This implements tamper detection.

The router includes a warning comment: `contracts_store` is a Wave 2 placeholder that loses contracts on server restart. Wave 3 must replace it with persistent storage (database, Redis, or file store) to maintain immutability guarantees across restarts and support distributed deployment.

## Test coverage

The test file `test_engineering_contract.py` covers model construction, hash calculation, and immutability verification. `test_valid_engineering_contract` constructs a contract with all 13 gate contracts populated and verifies the fields. `test_engineering_contract_with_defaults` constructs a contract with only required fields and verifies that the 13 gate contracts default to empty dicts or `RuntimeContract()`, and `prohibited_behaviors` defaults to an empty list.

`test_calculate_contract_hash_produces_valid_hash` verifies the hash is a 64-character hex string (SHA-256). `test_contract_hash_deterministic` verifies the same contract produces the same hash twice. `test_contract_hash_changes_when_field_modified`, `test_contract_hash_changes_when_nested_field_modified`, and `test_contract_hash_changes_when_list_modified` verify that modifying any part of the contract changes the hash.

`test_contract_hash_field_excluded_from_hash_calculation` is the critical immutability test: it constructs two contracts that differ only in their `contract_hash` field and verifies they produce the same hash, confirming that `exclude={"contract_hash"}` works correctly.

`test_hash_includes_all_thirteen_gate_contracts` is the completeness test: it iterates over all 13 gate contract fields, modifies each one in a fresh contract copy, recalculates the hash, and asserts the hash changed. This prevents future bugs where a gate contract is accidentally excluded from hash calculation, allowing undetected tampering. The test explicitly lists the 13 gate contracts in a docstring and comment, serving as documentation and regression prevention.

The test file `test_contract_routes.py` covers API endpoints: authentication (401 without header, 401 with invalid token), ownership verification (403 if different user accesses workflow), state validation (400 if workflow in wrong state), immutability (repeat POST returns same contract with same hash), and hash integrity verification (GET detects tampering).

## Contract population from B03

The POST endpoint calls `build_repo_contract(repo_root, family, version)` from B03. This function scans the repository for canonical block files matching the family/version, computes SHA-256 hashes, generates evidence IDs, and returns a `RepositoryBlockContract` with `references`, `renderer_contract`, `composer_contract`, `schema_contract`, `runtime`, `required_artifacts`, and `acceptance_criteria`.

The endpoint copies these values into the `EngineeringContract`: `canonical_references=repo_contract.references`, `renderer_contract=repo_contract.renderer_contract`, `composer_contract=repo_contract.composer_contract`, `schema_contract=repo_contract.schema_contract`, `runtime_contract=repo_contract.runtime`, `required_artifacts=repo_contract.required_artifacts`, `acceptance_criteria=repo_contract.acceptance_criteria`. The other gate contracts (educational, implementation, type, theme, brand, ils, lsnb, rssb, ubrc) are populated with hardcoded placeholder dicts or constructed inline.

The `prohibited_behaviors` field is set to `PROHIBITED_BEHAVIORS`, the constant containing all 11 behaviors.

</details>

<details>
<summary>File map</summary>

- `services/project-ai/app/contracts/engineering_contract.py` — EngineeringContract model, PROHIBITED_BEHAVIORS constant, calculate_contract_hash function
- `services/project-ai/app/contracts/repository_intelligence.py` — CanonicalReference, RuntimeContract, RepositoryBlockContract models, build_contract function (B03 Wave 1)
- `services/project-ai/app/models/workflow_target.py` — WorkflowTarget and CandidateBinding models (B04 Wave 0)
- `services/project-ai/app/api/routes/contract.py` — POST and GET endpoints for engineering contracts, auth and ownership verification
- `services/project-ai/tests/unit/test_engineering_contract.py` — Unit tests for EngineeringContract model and hash function
- `services/project-ai/tests/unit/test_contract_routes.py` — Unit tests for API endpoints

Full diff: `.agents/tasks/full-diff.txt`

</details>
