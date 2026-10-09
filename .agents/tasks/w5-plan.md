# Wave 5 Implementation Plan: Placement Engine

**Branch**: m2-project-ai-canonical-wiring  
**Wave**: W5 (Placement Engine)  
**Prerequisites**: W4 (Canonical Workflow Orchestration) - COMPLETE (commit 56f1030b)

## Context

Wave 4 established the implementation approval gate with hash-bound authorization. Wave 5 implements the placement engine core logic that:
1. Matches candidates to available manifests
2. Scores matches based on criteria (skills, availability, structural similarity)
3. Creates placement decisions with evidence
4. Handles placement conflicts
5. Supports manual placement override

**CRITICAL**: The placement infrastructure (approval_enforcer, executor, worktree_manager, repository_adapter, comparator) already exists from prior work. This wave focuses on the **matching and scoring algorithms** that determine candidate-to-manifest mappings.

## W4 Verification Status

- ✅ W4 evidence file exists: `.agents/tasks/m2-9-w4-evidence.json`
- ✅ W4 completion commit: `56f1030bb720dfbc7b7c97505e36e6628ec71758`
- ✅ Implementation approval model complete with hash verification
- ✅ Authorization boundary established
- ✅ Tests passing: 528 passed, 58 pre-existing failures

## Architecture Review

### Existing Components (Do NOT recreate)

**Placement Infrastructure** (from W5 evidence):
- `app/placement/approval_enforcer.py` - Enforces implementation approval before mutations
- `app/placement/executor.py` - Executes approved placement manifests safely
- `app/placement/worktree_manager.py` - Git worktree isolation
- `app/placement/repository_adapter.py` - Safe repository mutations with path security
- `app/placement/comparator.py` - Canonical comparison (StructuralFeatures extraction)

**Orchestration** (from canonical_workflow.py):
- `app/orchestration/canonical_workflow.py` - State machine with PLACEMENT state handling
- `app/orchestration/workflow_governance.py` - Workflow lifecycle management

**Models** (from models directory):
- `app/models/candidate.py` - CandidatePackage, PlacementManifest, PlacementDecision enum
- `app/models/implementation_approval.py` - ImplementationApproval with hash verification
- `app/models/workflow.py` - ProjectLLMWorkflow domain model

**Persistence** (R3 PostgreSQL):
- `app/persistence/models.py` - ORM models (WorkflowModel, ApprovalModel, CandidateModel, ManifestModel)
- `app/persistence/repositories.py` - Async repository protocols and implementations
- `app/persistence/database.py` - AsyncEngine, AsyncSession management

### What Wave 5 MUST Create

Based on the original task description and gap analysis:

1. **`app/placement/placement_engine.py`** - Core placement algorithm orchestration
2. **`app/placement/matcher.py`** - Candidate-manifest matching logic
3. **`app/placement/scorer.py`** - Placement scoring based on criteria
4. **Integration with canonical_workflow.py** - Add PLACEMENT state handling
5. **API routes in `app/api/routes/workflows.py`** - Placement endpoints
6. **Integration tests** - Minimum 15 tests covering matching, scoring, conflicts, overrides

## Build System and Testing

**Project**: FastAPI/Python 3.11+ service  
**Dependencies**: pyproject.toml with pytest, pytest-asyncio, httpx  
**Test Command**: `pytest tests/ -v --tb=short`  
**Baseline**: W4 established 528 passed, 58 pre-existing failures (certification_gates, integration)

**Verification Strategy**:
1. Unit tests for each module: `pytest tests/placement/test_<module>.py -v`
2. Integration tests: `pytest tests/integration/test_placement_engine.py -v`
3. Full suite: `pytest tests/ -v` (must not introduce new failures beyond W4 baseline)

## Implementation Plan

### 1. Create Placement Scorer Module

**File**: `services/project-ai/app/placement/scorer.py`

Create scoring algorithm that evaluates candidate-to-manifest match quality based on:
- **Structural similarity** (from existing `CanonicalComparator.StructuralFeatures`)
- **Block family/version alignment** (from `CandidatePackage.target_family/target_version`)
- **Availability** (manifest.decision == REUSE vs ADD/UPDATE/EXTEND)
- **Conflict detection** (multiple candidates for same target path)

**Key Classes/Functions**:
```python
@dataclass
class PlacementScore:
    candidate_id: str
    manifest_id: str
    score: float  # 0.0-1.0
    criteria: Dict[str, float]  # breakdown by criterion
    reasoning: str

class PlacementScorer:
    def score_match(
        self,
        candidate: CandidatePackage,
        manifest: PlacementManifest,
        structural_features: Optional[StructuralFeatures] = None
    ) -> PlacementScore
    
    def score_all_matches(
        self,
        candidate: CandidatePackage,
        manifests: List[PlacementManifest]
    ) -> List[PlacementScore]
```

**Scoring Criteria** (weights TBD, start with equal weights):
- `structural_similarity`: 0.0-1.0 from CanonicalComparator (if available)
- `family_version_match`: 1.0 if exact match, 0.5 if family match, 0.0 otherwise
- `availability`: 1.0 if REUSE/ADD, 0.5 if UPDATE, 0.3 if EXTEND, 0.0 if REJECT
- `conflict_penalty`: -0.3 per conflict (multiple candidates for same path)

**Files**:
- Create: `services/project-ai/app/placement/scorer.py`
- Test: `services/project-ai/tests/placement/test_scorer.py`

**Verify**: `pytest tests/placement/test_scorer.py -v` - All tests pass

---

### 2. Create Candidate-Manifest Matcher Module

**File**: `services/project-ai/app/placement/matcher.py`

Create matching logic that pairs candidates with available manifests based on:
- Target family/version from workflow binding
- Existing blocks in repository (from discovery)
- Placement decision type (ADD new, UPDATE existing, EXTEND family, REUSE, REJECT)
- Path availability and conflicts

**Key Classes/Functions**:
```python
@dataclass
class MatchResult:
    candidate_id: str
    matched_manifests: List[PlacementManifest]
    best_manifest: Optional[PlacementManifest]
    best_score: Optional[PlacementScore]
    conflicts: List[str]  # Conflict descriptions
    recommendation: PlacementDecision

class CandidateManifestMatcher:
    def __init__(self, scorer: PlacementScorer):
        self.scorer = scorer
    
    async def find_matches(
        self,
        candidate: CandidatePackage,
        available_manifests: List[PlacementManifest],
        workflow: ProjectLLMWorkflow
    ) -> MatchResult
    
    async def detect_conflicts(
        self,
        candidates: List[CandidatePackage],
        manifests: List[PlacementManifest]
    ) -> Dict[str, List[str]]  # target_path -> [candidate_ids]
```

**Matching Logic**:
1. Filter manifests by target_family/target_version from workflow
2. Score each candidate-manifest pair using PlacementScorer
3. Rank matches by score
4. Detect conflicts (multiple candidates for same target path)
5. Recommend best placement decision

**Files**:
- Create: `services/project-ai/app/placement/matcher.py`
- Test: `services/project-ai/tests/placement/test_matcher.py`

**Verify**: `pytest tests/placement/test_matcher.py -v` - All tests pass

---

### 3. Create Core Placement Engine

**File**: `services/project-ai/app/placement/placement_engine.py`

Orchestrate the complete placement workflow:
1. Load candidate and workflow context
2. Generate/retrieve available manifests
3. Match candidates to manifests (via Matcher)
4. Score matches (via Scorer)
5. Create placement records in database
6. Handle conflicts with resolution strategies
7. Support manual override

**Key Classes/Functions**:
```python
@dataclass
class PlacementEngineResult:
    workflow_id: str
    candidate_id: str
    placement_decision: PlacementDecision
    manifest_id: str
    score: PlacementScore
    conflicts: List[str]
    evidence: Dict[str, Any]
    created_at: str

class PlacementEngine:
    def __init__(
        self,
        matcher: CandidateManifestMatcher,
        scorer: PlacementScorer,
        manifest_repo,  # ManifestRepository
        candidate_repo,  # CandidateRepository
        workflow_repo   # WorkflowRepository
    ):
        ...
    
    async def create_placement(
        self,
        workflow_id: str,
        candidate_id: str,
        session: AsyncSession
    ) -> PlacementEngineResult
    
    async def handle_placement_conflict(
        self,
        workflow_id: str,
        conflicting_candidates: List[str],
        session: AsyncSession
    ) -> Dict[str, PlacementEngineResult]
    
    async def override_placement(
        self,
        workflow_id: str,
        candidate_id: str,
        manual_manifest_id: str,
        override_reason: str,
        session: AsyncSession
    ) -> PlacementEngineResult
```

**Database Operations**:
- Read candidate from CandidateRepository
- Read workflow from WorkflowRepository
- List manifests from ManifestRepository (filtered by target family/version)
- Upsert placement records
- Record placement evidence

**Files**:
- Create: `services/project-ai/app/placement/placement_engine.py`
- Test: `services/project-ai/tests/placement/test_placement_engine.py`

**Verify**: `pytest tests/placement/test_placement_engine.py -v` - All tests pass

---

### 4. Add PLACEMENT State to Canonical Workflow

**File**: `services/project-ai/app/orchestration/canonical_workflow.py`

**Current State Machine**: Has states REQUESTED → DISCOVERY → BRIEF_READY → AWAITING_GATE_1 → ... → INTEGRATION_PLANNED → AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING → ...

**Add PLACEMENT State** between CANDIDATE_AUDIT and INTEGRATION_PLANNED:
```
CANDIDATE_AUDIT → PLACEMENT → INTEGRATION_PLANNED
```

**Modify**:
- Add `PLACEMENT = "PLACEMENT"` to CanonicalWorkflowState enum
- Update VALID_TRANSITIONS dict:
  ```python
  CanonicalWorkflowState.CANDIDATE_AUDIT: [
      CanonicalWorkflowState.PLACEMENT,  # NEW
      CanonicalWorkflowState.REJECTED,
  ],
  CanonicalWorkflowState.PLACEMENT: [  # NEW STATE
      CanonicalWorkflowState.INTEGRATION_PLANNED,
      CanonicalWorkflowState.REJECTED,
  ],
  ```

**State Description**:
```
PLACEMENT = "PLACEMENT"
"""
Placement engine matching candidates to manifests.

Activities:
- Match candidate to available manifests
- Score matches based on structural similarity, family/version, availability
- Create placement decision with evidence
- Handle placement conflicts
- Support manual placement override

Next states: INTEGRATION_PLANNED (if placement succeeds), REJECTED (if placement fails)
Gate: None (automated)
"""
```

**Files**:
- Modify: `services/project-ai/app/orchestration/canonical_workflow.py`

**Verify**: 
- `pytest tests/test_canonical_workflow.py -v` - Existing tests still pass
- `pytest tests/orchestration/ -v` - State transition tests include PLACEMENT

---

### 5. Add Placement API Endpoints

**File**: `services/project-ai/app/api/routes/workflows.py`

Add new endpoints for placement operations:

```python
@router.post("/{workflow_id}/placement", response_model=PlacementEngineResponse)
async def create_placement(
    workflow_id: str,
    candidate_id: str,
    user: dict = Depends(get_current_user),
    placement_engine: PlacementEngine = Depends(get_placement_engine),
    session: AsyncSession = Depends(get_db_session)
) -> PlacementEngineResponse:
    """
    Create placement decision for candidate in workflow.
    
    Matches candidate to manifests, scores matches, creates placement record.
    """
    ...

@router.get("/{workflow_id}/placement/{candidate_id}", response_model=PlacementEngineResponse)
async def get_placement(
    workflow_id: str,
    candidate_id: str,
    user: dict = Depends(get_current_user),
    placement_engine: PlacementEngine = Depends(get_placement_engine)
) -> PlacementEngineResponse:
    """Get existing placement decision."""
    ...

@router.post("/{workflow_id}/placement/{candidate_id}/override", response_model=PlacementEngineResponse)
async def override_placement(
    workflow_id: str,
    candidate_id: str,
    request: PlacementOverrideRequest,
    user: dict = Depends(get_current_user),
    placement_engine: PlacementEngine = Depends(get_placement_engine),
    session: AsyncSession = Depends(get_db_session)
) -> PlacementEngineResponse:
    """
    Manually override placement decision.
    
    Allows human to specify exact manifest for candidate, bypassing scoring.
    """
    ...

@router.get("/{workflow_id}/placement/conflicts", response_model=List[PlacementConflictResponse])
async def list_placement_conflicts(
    workflow_id: str,
    user: dict = Depends(get_current_user),
    placement_engine: PlacementEngine = Depends(get_placement_engine)
) -> List[PlacementConflictResponse]:
    """List all placement conflicts for workflow."""
    ...
```

**Request/Response Schemas** (create in `app/api/schemas/placement.py`):
- `PlacementEngineResponse`
- `PlacementOverrideRequest`
- `PlacementConflictResponse`

**Dependency Injection**:
```python
async def get_placement_engine(
    session: AsyncSession = Depends(get_db_session)
) -> PlacementEngine:
    """Factory for PlacementEngine with repository dependencies."""
    scorer = PlacementScorer()
    matcher = CandidateManifestMatcher(scorer)
    manifest_repo = await get_manifest_repository(session)
    candidate_repo = await get_candidate_repository(session)
    workflow_repo = await get_workflow_repository(session)
    
    return PlacementEngine(
        matcher=matcher,
        scorer=scorer,
        manifest_repo=manifest_repo,
        candidate_repo=candidate_repo,
        workflow_repo=workflow_repo
    )
```

**Files**:
- Modify: `services/project-ai/app/api/routes/workflows.py`
- Create: `services/project-ai/app/api/schemas/placement.py`
- Test: `services/project-ai/tests/api/test_placement_routes.py`

**Verify**: 
- `pytest tests/api/test_placement_routes.py -v` - All API tests pass
- Manual test: `curl -X POST http://localhost:8000/workflows/{wf_id}/placement -d '{...}'`

---

### 6. Create Comprehensive Integration Tests

**File**: `services/project-ai/tests/integration/test_placement_engine.py`

Minimum 15 integration tests covering:

**Matching Tests** (5 tests):
1. `test_match_candidate_to_add_manifest` - Candidate matches ADD decision manifest
2. `test_match_candidate_to_update_manifest` - Candidate matches UPDATE decision manifest
3. `test_match_candidate_by_family_version` - Filter manifests by target family/version
4. `test_no_match_for_rejected_manifest` - REJECT decision manifests excluded
5. `test_match_with_structural_similarity` - Scoring includes structural features

**Scoring Tests** (4 tests):
6. `test_score_exact_family_version_match` - High score for exact target match
7. `test_score_penalizes_conflicts` - Lower score when multiple candidates target same path
8. `test_score_availability_preference` - REUSE > UPDATE > EXTEND scoring
9. `test_score_reasoning_populated` - PlacementScore.reasoning field explains decision

**Conflict Handling Tests** (3 tests):
10. `test_detect_placement_conflict` - Detect multiple candidates for same target path
11. `test_resolve_conflict_by_score` - Higher-scored candidate wins conflict
12. `test_conflict_evidence_recorded` - Conflict details in placement evidence

**Manual Override Tests** (2 tests):
13. `test_override_placement_manual` - Human override bypasses scoring
14. `test_override_requires_approval` - Override still requires implementation approval

**Database Integration Tests** (1 test):
15. `test_placement_persisted_to_database` - Placement record saved to PostgreSQL

**Files**:
- Create: `services/project-ai/tests/integration/test_placement_engine.py`

**Verify**: `pytest tests/integration/test_placement_engine.py -v` - All 15 tests pass

---

### 7. Update Module Exports

**File**: `services/project-ai/app/placement/__init__.py`

Add exports for new modules:
```python
from app.placement.placement_engine import (
    PlacementEngine,
    PlacementEngineResult,
)
from app.placement.matcher import (
    CandidateManifestMatcher,
    MatchResult,
)
from app.placement.scorer import (
    PlacementScorer,
    PlacementScore,
)

__all__ = [
    # ... existing exports ...
    "PlacementEngine",
    "PlacementEngineResult",
    "CandidateManifestMatcher",
    "MatchResult",
    "PlacementScorer",
    "PlacementScore",
]
```

**Files**:
- Modify: `services/project-ai/app/placement/__init__.py`

**Verify**: `python -c "from app.placement import PlacementEngine; print('Exports OK')"`

---

## Verification Summary

**Step-by-step verification**:

1. **After Step 1** (Scorer):
   ```bash
   pytest tests/placement/test_scorer.py -v --tb=short
   ```
   Expected: All scorer tests pass

2. **After Step 2** (Matcher):
   ```bash
   pytest tests/placement/test_matcher.py -v --tb=short
   ```
   Expected: All matcher tests pass

3. **After Step 3** (Engine):
   ```bash
   pytest tests/placement/test_placement_engine.py -v --tb=short
   ```
   Expected: All engine tests pass

4. **After Step 4** (Workflow State):
   ```bash
   pytest tests/orchestration/ -v --tb=short
   ```
   Expected: State machine tests include PLACEMENT state

5. **After Step 5** (API):
   ```bash
   pytest tests/api/test_placement_routes.py -v --tb=short
   ```
   Expected: All API tests pass

6. **After Step 6** (Integration):
   ```bash
   pytest tests/integration/test_placement_engine.py -v --tb=short
   ```
   Expected: All 15 integration tests pass

7. **Final Full Suite**:
   ```bash
   pytest tests/ -v --tb=short
   ```
   Expected: All W5 tests pass + W4 baseline maintained (528 passed, 58 pre-existing failures, no new failures)

---

## Success Criteria

✅ **Core Modules Created**:
- `app/placement/placement_engine.py` - PlacementEngine orchestration
- `app/placement/matcher.py` - CandidateManifestMatcher
- `app/placement/scorer.py` - PlacementScorer with scoring criteria

✅ **State Machine Extended**:
- PLACEMENT state added to CanonicalWorkflowState enum
- VALID_TRANSITIONS updated with CANDIDATE_AUDIT → PLACEMENT → INTEGRATION_PLANNED

✅ **API Endpoints**:
- POST `/workflows/{id}/placement` - Create placement
- GET `/workflows/{id}/placement/{cid}` - Get placement
- POST `/workflows/{id}/placement/{cid}/override` - Override placement
- GET `/workflows/{id}/placement/conflicts` - List conflicts

✅ **Database Integration**:
- Placement records persisted via ManifestRepository
- Async operations with session.commit()
- Optimistic locking and hash verification

✅ **Testing**:
- Minimum 15 integration tests pass
- Unit tests for scorer, matcher, engine pass
- API endpoint tests pass
- Full regression suite: no new failures beyond W4 baseline (528 passed, 58 pre-existing)

✅ **Evidence**:
- All placement operations produce machine-readable evidence
- Evidence includes: candidate_id, manifest_id, score breakdown, conflicts, reasoning
- Evidence follows W3/W4 pattern: all fields populated, no empty dicts

---

## Out of Scope for W5

❌ **NOT in Wave 5**:
- Runtime verification (Wave 6)
- Browser verification (Wave 6)
- Final HAA certification (Wave 7)
- Evidence persistence to evidence ledger (deferred)
- Approval expiry validation (future)
- Concurrent placement orchestration (future)

**Wave 5 Focus**: Placement matching and scoring logic ONLY. Execution happens via existing PlacementExecutor after implementation approval.

---

## Risk Mitigation

**Risk 1**: Conflict resolution strategy unclear
- **Mitigation**: Start with simple "highest score wins" strategy, document in PlacementEngine
- **Fallback**: Manual override allows human to resolve conflicts

**Risk 2**: Scoring weights unknown
- **Mitigation**: Start with equal weights (0.25 each for 4 criteria), make configurable
- **Future**: Learn weights from historical placement success data

**Risk 3**: Integration with existing comparator
- **Mitigation**: CanonicalComparator already exists, use StructuralFeatures output
- **Test**: Verify comparator integration in test_scorer.py

**Risk 4**: Database schema additions needed
- **Mitigation**: Check if PlacementManifest and CandidatePackage already in models.py
- **Action**: If missing, add ORM models for placement records

---

## Commit Strategy

**Single commit after all steps complete**:
```
feat: M2.9 W5 - Placement engine matching and scoring

- Add PlacementScorer with structural similarity, family/version, availability, conflict criteria
- Add CandidateManifestMatcher for candidate-manifest pairing
- Add PlacementEngine orchestrating matching, scoring, conflict handling, manual override
- Add PLACEMENT state to canonical workflow state machine
- Add placement API endpoints: create, get, override, list conflicts
- Add 15+ integration tests covering matching, scoring, conflicts, overrides
- Database integration: placement records persisted via repositories
- Evidence production: machine-readable placement decisions

Tests: All W5 tests pass, W4 baseline maintained (528 passed, 58 pre-existing failures)
```

**Commit file**:
```bash
git add services/project-ai/app/placement/placement_engine.py
git add services/project-ai/app/placement/matcher.py
git add services/project-ai/app/placement/scorer.py
git add services/project-ai/app/orchestration/canonical_workflow.py
git add services/project-ai/app/api/routes/workflows.py
git add services/project-ai/app/api/schemas/placement.py
git add services/project-ai/app/placement/__init__.py
git add services/project-ai/tests/placement/test_scorer.py
git add services/project-ai/tests/placement/test_matcher.py
git add services/project-ai/tests/placement/test_placement_engine.py
git add services/project-ai/tests/api/test_placement_routes.py
git add services/project-ai/tests/integration/test_placement_engine.py
git commit -m "feat: M2.9 W5 - Placement engine matching and scoring"
```

---

## Post-Implementation

1. **Create Evidence File**: `.agents/tasks/w5-evidence.json` with W4 pattern
2. **Create Gate File**: `.agents/tasks/w5-gate.json` with readiness verdict
3. **Record Commit SHA**: Document final commit SHA in evidence file
4. **Push to GitHub**: `git push origin m2-project-ai-canonical-wiring`
5. **Update Workflow Status**: Transition to next wave after W5 verification

---

**Plan Complete** ✅
