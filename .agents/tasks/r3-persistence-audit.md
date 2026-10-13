# R3 Persistence Layer Audit - services/project-ai

**Audit Date:** 2025-01-31
**Branch:** m2-project-ai-canonical-wiring
**Base Commit:** d2bbdcbc

## Executive Summary

services/project-ai currently uses **in-memory dictionaries** for all entity storage, explicitly documented as Wave 2/M2.9 placeholders. This violates architectural immutability requirements: server restarts allow contract/manifest regeneration with different hashes, breaking downstream integrity verification.

**Database Infrastructure:** **NONE** - No SQLAlchemy, Alembic, PostgreSQL, or SQLite found in codebase.

## 1. Current In-Memory Stores

### 1.1 Contract Store
**Location:** `app/api/routes/contract.py:118`
```python
contracts_store = {}  # Key: workflow_id -> EngineeringContract
```
- Stores `EngineeringContract` instances indexed by workflow_id
- Contains contract_hash (SHA-256) for immutability verification
- Lost on server restart
- Documented as Wave 3 requirement to replace with persistent storage

### 1.2 Workflow Store (Legacy)
**Location:** `app/api/routes/contract.py:122`
```python
workflows_store = {}  # Key: workflow_id -> {"state": str, "owner": str}
```
- Placeholder for workflow ownership verification
- Now superseded by WorkflowGovernanceService._workflows

### 1.3 Workflow Governance Store
**Location:** `app/orchestration/workflow_governance.py:61`
```python
self._workflows: Dict[str, ProjectLLMWorkflow] = {}
self._approvals: Dict[str, ImplementationApproval] = {}
```
- Primary workflow state store (ProjectLLMWorkflow dataclass instances)
- Approval tracking for gate transitions
- Documented as "Wave 0" with future persistence planned

### 1.4 Candidate Stores
**Location:** `app/api/routes/candidate.py:26-28`
```python
_candidates_store: Dict[str, CandidatePackage] = {}
_manifests_store: Dict[str, PlacementManifest] = {}
_approvals_store: Dict[str, ImplementationApproval] = {}
```
- Candidate packages with files and workflow binding
- Placement manifests with SHA-256 hashes
- Implementation approvals for gate enforcement
- Documented as "M3 foundation" placeholder

## 2. Existing Pydantic Models

All entities use Pydantic BaseModel or dataclasses - no ORM models exist.

### 2.1 Workflow Domain
- **ProjectLLMWorkflow** (`app/models/workflow.py`): Dataclass with state machine, artifact bindings (SHA-256), state history
- **StateTransition** (`app/models/workflow.py`): Dataclass for audit trail
- **CanonicalWorkflowState** (`app/orchestration/canonical_workflow.py`): Enum (11 states)

### 2.2 Contract Domain
- **EngineeringContract** (`app/contracts/engineering_contract.py`): Pydantic BaseModel with contract_hash
- **WorkflowTarget** (`app/models/workflow_target.py`): Pydantic BaseModel for target binding

### 2.3 Candidate Domain
- **CandidatePackage** (`app/models/candidate.py`): Pydantic BaseModel with files list and workflow binding
- **CandidateFile** (`app/models/candidate.py`): Pydantic BaseModel for file content + hash
- **PlacementManifest** (`app/models/candidate.py`): Pydantic BaseModel with manifest_hash (SHA-256)
- **BlockFamily** (`app/models/candidate.py`): Enum
- **PlacementDecision** (`app/models/candidate.py`): Enum

### 2.4 Approval Domain
- **ImplementationApproval** (`app/models/implementation_approval.py`): Dataclass with hash-bound authorization
- **ImplementationApprovalStatus** (`app/models/implementation_approval.py`): Enum (PENDING, APPROVED, REJECTED)

## 3. Application Startup & Lifecycle

**Entry Point:** `app/main.py`
- FastAPI app with lifespan manager (`@asynccontextmanager`)
- Current lifespan only validates snapshot path existence
- No database connection initialization
- No migration runner
- CORS middleware for all origins (TODO: restrict in production)

**Startup Sequence:**
1. lifespan startup: validate workspace root and snapshot path
2. Include routers (health, snapshot, evidence, tasks, governance, agents, candidate, creation, contract)
3. uvicorn.run with --reload for development

## 4. Dependency Management

**File:** `pyproject.toml`

**Production Dependencies:**
- fastapi>=0.111.0
- uvicorn[standard]>=0.29.0
- pydantic>=2.7.0
- httpx>=0.27.0

**Dev Dependencies:**
- pytest>=8.0.0
- pytest-asyncio>=0.23.0
- httpx>=0.27.0

**Missing:**
- No SQLAlchemy
- No Alembic
- No psycopg2/asyncpg (PostgreSQL)
- No aiosqlite (async SQLite)
- No database drivers whatsoever

## 5. Test Infrastructure

**Test Framework:** pytest with pytest-asyncio

**Test Discovery:**
- Tests in `tests/` directory
- No `conftest.py` found (no shared fixtures at project level)
- FastAPI TestClient used for integration tests
- Fixtures defined per-test-file

**Test Pattern (from test_candidate.py):**
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def sample_workflow():
    from app.api.routes.workflows import governance_service
    workflow = governance_service.create_workflow(...)
    return workflow
```

**Test Execution:**
- `pytest tests/` (all tests)
- `pytest tests/ --cov=app --cov-report=html` (with coverage)
- pytest.ini_options: `asyncio_mode = "auto"`

**Test Database:**
- No test database setup
- No fixture for database isolation
- Tests use in-memory stores directly (reset not guaranteed between tests)

## 6. Architectural Constraints

### 6.1 Immutability Requirements

**Contract Immutability** (from engineering_contract.py docstring):
> Once generated for a workflow_id with specific data, the contract is immutable. The contract_hash ensures tamper detection. If the same workflow_id requests a contract again with identical inputs, return the SAME contract (same hash). This prevents contract drift during the workflow lifecycle.

**Current Violation:**
> Wave 2 uses in-memory contracts_store which resets on server restart. After restart, the same workflow_id may receive a new contract with a different hash if repository snapshot or build logic changed. This violates the immutability guarantee that later gates depend on (candidate_binding.contract_hash must match workflow.contract_sha256).

### 6.2 Hash-Bound Integrity

All artifacts bound to workflow via SHA-256:
- contract_sha256
- candidate_sha256
- manifest_sha256
- snapshot_sha256

Gate enforcement verifies these hashes match at each transition. Persistence layer MUST preserve exact hash values.

### 6.3 Idempotency Requirements

**Workflow Creation:**
- Multiple requests with same idempotency key should return same workflow_id
- Currently: no idempotency key support (every POST creates new workflow)

**Contract Generation:**
- Multiple requests for same workflow_id should return same contract with same hash
- Currently: in-memory check exists but resets on restart

### 6.4 Concurrency Constraints

**State Transitions:**
- WorkflowGovernanceService.transition_state must be atomic
- No concurrent transitions allowed for same workflow_id
- Currently: no locking mechanism (single-process in-memory safe, but not multi-process)

**Approval Enforcement:**
- ApprovalEnforcer checks must be atomic with implementation execution
- Race condition: approval could be revoked between check and execution

## 7. Related Services & Dependencies

**Snapshot Dependency:**
- Reads TypeScript-generated snapshot from `packages/project-llm-discovery/output/snapshot.json`
- Snapshot SHA-256 recorded in contracts
- Persistence layer does NOT need to store snapshot content (external file)

**Evidence Ledger:**
- `app/evidence/ledger.py`: records agent runs
- Currently: appears to be file-based or in-memory (not in scope for this audit)

**Worktree Manager:**
- `app/placement/worktree_manager.py`: git operations for placement
- Not persisted (ephemeral git worktrees)

## 8. Migration Strategy Considerations

### 8.1 No Existing Migrations
- No Alembic migrations directory
- Clean slate for schema design

### 8.2 Data Migration
- No existing persistent data to migrate
- Fresh start from empty database

### 8.3 Backward Compatibility
- No backward compatibility concerns (no production data)
- Can design schema from scratch

## 9. Key Findings Summary

| Entity | Current Store | Primary Key | Hash Binding | Critical Data |
|--------|--------------|-------------|--------------|---------------|
| ProjectLLMWorkflow | WorkflowGovernanceService._workflows | workflow_id | contract_sha256, candidate_sha256, manifest_sha256, snapshot_sha256 | State history, artifact bindings, evidence_ids |
| EngineeringContract | contracts_store (contract.py) | contract_id | contract_hash (self) | Canonical references, all compliance contracts |
| CandidatePackage | _candidates_store (candidate.py) | candidateId | files[].hash | File content, workflow binding |
| PlacementManifest | _manifests_store (candidate.py) | manifestId | manifestHash (self) | Decision, target path, evidence IDs |
| ImplementationApproval | _approvals_store (candidate.py & governance) | approval_id | candidate_sha256, placement_manifest_sha256 | Approval status, timestamps, self-approval check |

## 10. Technical Recommendations

### 10.1 Database Engine Selection
**Recommendation: SQLite**

**Rationale:**
- No existing database infrastructure
- Simple deployment (single file)
- ACID compliance sufficient for single-service architecture
- Built-in Python support
- Easy local development and testing
- Migration to PostgreSQL straightforward if scaling needed

**Alternative: PostgreSQL**
- Only if multi-service deployment planned
- Requires additional infrastructure setup
- Overkill for current single-service architecture

### 10.2 ORM Choice
**Recommendation: SQLAlchemy 2.0 (async)**

**Rationale:**
- Industry standard for Python
- Excellent FastAPI integration
- Type-safe with modern Python typing
- Async support matches FastAPI's async handlers
- Alembic for migrations (proven, stable)

### 10.3 Critical Implementation Requirements

1. **Atomic Upsert for Contract Immutability**
   - Use UNIQUE constraint on workflow_id
   - INSERT OR IGNORE / ON CONFLICT DO NOTHING
   - Always return existing contract if workflow_id exists

2. **Optimistic Locking for State Transitions**
   - Add `version` column to workflows table
   - WHERE clause includes current version
   - UPDATE fails if version changed (concurrent update detected)

3. **Foreign Key Constraints**
   - contracts.workflow_id -> workflows.workflow_id
   - candidates.workflow_id -> workflows.workflow_id (nullable initially, NOT NULL after binding)
   - manifests.candidate_id -> candidates.candidate_id
   - approvals.workflow_id -> workflows.workflow_id

4. **Hash Verification Indexes**
   - Index on contract_hash, candidate_sha256, manifest_hash for quick lookup
   - Unique constraint on (workflow_id, artifact_type, artifact_sha256) for artifact binding

5. **Transaction Isolation**
   - Use SERIALIZABLE isolation for state transitions
   - Use READ COMMITTED for reads

6. **Idempotency Key Support**
   - Add `idempotency_key` column to workflows (nullable, unique)
   - CREATE workflow checks key first, returns existing if found

## 11. Test Strategy Requirements

### 11.1 Persistence Tests
- Restart-safe persistence (create, restart service, verify data survives)
- Idempotency (duplicate workflow creation with same key returns same ID)
- Duplicate rejection (duplicate contract for same workflow returns same hash)
- Contract drift detection (attempt to modify existing contract fails)
- Optimistic locking (concurrent state transitions)
- Transaction rollback (failed state transition leaves state unchanged)

### 11.2 Test Database Isolation
- pytest fixture: create test database per test function
- Use in-memory SQLite (":memory:") for speed
- Alternatively: create temp file database, delete after test
- conftest.py with db_session fixture and transaction rollback

### 11.3 Integration Tests
- Full workflow lifecycle with persistence
- Gate enforcement with approval persistence
- Candidate upload -> manifest generation -> approval -> execution (across multiple requests)

## 12. Commit Message Template
```
feat(project-llm): implement durable persistence layer [R3]

- Add SQLAlchemy 2.0 async ORM models for Workflow, Contract, Candidate, Manifest, Approval
- Implement repository Protocol + SQLAlchemy implementations
- Add Alembic migrations for initial schema
- Contract immutability: ContractDriftError on hash mismatch
- Idempotency key support on workflow creation
- Optimistic locking for state transitions
- FastAPI dependency injection for repository access
- Comprehensive test suite with db fixtures

BREAKING CHANGE: In-memory stores replaced with SQLite persistence.
Server restart now preserves all workflow state and artifact bindings.
```

## 13. Files Requiring Modification

### New Files (to create):
- `app/database/__init__.py` - Database connection setup
- `app/database/models.py` - SQLAlchemy ORM models
- `app/database/repositories.py` - Repository Protocol definitions
- `app/database/repositories_impl.py` - SQLAlchemy repository implementations
- `app/database/session.py` - Session management and dependency injection
- `app/database/exceptions.py` - ContractDriftError, DuplicateWorkflowError, etc.
- `alembic.ini` - Alembic configuration
- `alembic/env.py` - Alembic environment
- `alembic/versions/001_initial_schema.py` - Initial migration
- `tests/conftest.py` - Shared test fixtures (db_session, test_client, etc.)

### Files to Modify:
- `pyproject.toml` - Add sqlalchemy, alembic, aiosqlite dependencies
- `app/main.py` - Add database initialization to lifespan
- `app/orchestration/workflow_governance.py` - Replace _workflows dict with WorkflowRepository
- `app/api/routes/contract.py` - Replace contracts_store with ContractRepository
- `app/api/routes/candidate.py` - Replace _candidates_store, _manifests_store, _approvals_store with repositories
- `app/api/routes/workflows.py` - Update to use repositories via dependency injection
- All test files - Add db fixtures, ensure isolation

## Audit Completed
**Persistence infrastructure:** None
**Migration readiness:** Green field (no existing data)
**Critical path:** Contract immutability enforcement
**Recommended approach:** SQLite + SQLAlchemy 2.0 + Alembic
