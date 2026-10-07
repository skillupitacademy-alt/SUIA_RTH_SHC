Yes. **That is exactly how I recommend implementing the next phase.**

The key is that we should **not give all agents independent freedom to modify the architecture**. We should turn the Project AI into a controlled multi-agent engineering pipeline with:

1. explicit ownership,
2. dependency-aware waves,
3. sequential gates where order matters,
4. parallel work only where files/contracts do not conflict,
5. mandatory tests after every wave,
6. machine-readable test/evidence logs,
7. Git commits per agent/wave,
8. one final integration/audit agent,
9. and then I can re-read the pushed GitHub branch and cross-check the implementation against the matrix.

This follows the audit conclusion that the repository already has substantial pieces and that the main problem is **wiring and authority**, rather than rebuilding everything. project-llm-front-back-alignmen…

---

# 1. First: freeze the implementation target

We should call this:

## M2.9 — Canonical Project LLM Wiring + External AI Engineering Contract

The final architecture is:

```text
USER
  │
  │ Family + Version
  ▼
PROJECT LLM
  │
  ├── Repository Discovery
  ├── Canonical Reference Analysis
  │       ├── I1
  │       ├── C1
  │       ├── D1
  │       └── other applicable versions
  │
  ├── Schema / Type Analysis
  ├── Renderer Analysis
  ├── Composer Analysis
  ├── Runtime Analysis
  ├── ILS Analysis
  ├── LSNB Analysis
  ├── RSSB Analysis
  ├── Theme / Brand Analysis
  └── Test Analysis
  │
  ▼
CANDIDATE BLOCK ENGINEERING CONTRACT
  │
  ▼
EXTERNAL AI
  │
  ├── HTML/CSS/JS/JSON prototype
  │
  ▼
HUMAN GATE 1
  │
  ▼
EXTERNAL AI
  │
  └── React/TS implementation
  │
  ▼
CANDIDATE UPLOAD
  │
  ▼
PROJECT LLM
  │
  ├── Intake
  ├── Hash
  ├── Classification
  ├── Contract comparison
  ├── Canonical comparison
  ├── Structural validation
  ├── Test validation
  └── Placement manifest
  │
  ▼
HUMAN GATE 2
  │
  ▼
APPROVED PLACEMENT
  │
  ▼
SNAPSHOT
  │
  ▼
EVIDENCE
  │
  ├── Composer
  ├── Renderer
  ├── Runtime
  ├── Browser
  ├── ILS
  ├── LSNB
  ├── RSSB
  ├── Brand
  └── Theme
  │
  ▼
FINAL GATE
  │
  ▼
CERTIFIED
```

The external AI must receive a **self-contained contract**, because it is not assumed to know I1/C1/D1, TutorialBlockRenderer, UBRC, ILS, LSNB, RSSB, or the repository. That distinction is fundamental. Branch · Explain I2 Creation Fi…

---

# 2. Important: do NOT run all agents sequentially

There would be unnecessary duplication and merge conflicts.

Instead, use **waves**.

## Proposed agent topology

I recommend **18 logical agents**, although some can be executed by the same Kiro multi-agent worker if the implementation environment prefers fewer processes.

### Backend agents

| Agent | Name | Main responsibility |
|---|---|---|
| B01 | Architecture Authority | canonical lifecycle + authority reconciliation |
| B02 | Engineering Contract | pre-implementation contract generation |
| B03 | Repository Contract Intelligence | derive I1/C1/D1/common runtime contract |
| B04 | Target Binding | family/version/workflow/spec binding |
| B05 | Candidate Intake | candidate package + hash + target binding |
| B06 | Canonical Comparator | wire real comparator |
| B07 | Placement | manifest + canonical artifact policy |
| B08 | Certification | real certification gates |
| B09 | Runtime | real runtime verification |
| B10 | Browser | real Playwright verification |
| B11 | Final Gate | real FinalGateAgent |
| B12 | Governance | durable/consistent approval authority |
| B13 | Legacy Cleanup | remove/reclassify Mix & Match + secondary workflows |
| B14 | Test/Evidence Harness | machine-readable test/evidence ledger |

### Frontend agents

| Agent | Name | Main responsibility |
|---|---|---|
| F01 | API Contract Client | typed FastAPI client |
| F02 | Create/Brief | real Family + Version → backend contract |
| F03 | External AI Handoff | render/download/copy backend contract |
| F04 | Candidate Upload | real upload + backend validation |
| F05 | Certification UI | real evidence/gate results |
| F06 | Workflow UI | backend lifecycle/evidence display |

### Final agents

| Agent | Responsibility |
|---|---|
| Q01 | Backend Integration Auditor |
| Q02 | Frontend Integration Auditor |
| Q03 | End-to-End Certification Auditor |
| Q04 | GitHub Evidence Packager |

---

# 3. Dependency graph

This is the critical part.

```text
                         ┌───────────────┐
                         │ B01 Authority │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
              B03 Repository             B04 Target
              Contract Intelligence     Binding
                    │                         │
                    └────────────┬────────────┘
                                 ▼
                         B02 Engineering
                             Contract
                                 │
                                 ▼
                         B05 Candidate Intake
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
          B06 Compare         B07 Placement      B14 Evidence
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 ▼
                            B12 Governance
                                 │
                                 ▼
                           Placement Approval
                                 │
                                 ▼
                           B08 Certification
                                 │
                    ┌────────────┼─────────────┐
                    ▼            ▼             ▼
                 B09 Runtime  B10 Browser   Brand/Theme
                    │            │             │
                    └────────────┼─────────────┘
                                 ▼
                            B11 Final Gate
                                 │
                                 ▼
                             CERTIFIED
```

Frontend:

```text
B01/B02/B03/B04
       │
       ▼
     F01
       │
 ┌─────┼────────┐
 ▼     ▼        ▼
F02   F03      F06
 │     │
 ▼     ▼
F04   External AI
 │
 ▼
F05
```

But **F01 must wait until backend API contracts stabilize**.

---

# 4. Wave-by-wave execution

## WAVE 0 — Architecture freeze

### Run sequentially

### B01 — Architecture Authority

This agent should modify only the canonical architecture/workflow definitions.

Responsibilities:

- freeze lifecycle;
- identify single workflow authority;
- remove ambiguity between:
  - `WorkflowEngine`
  - `workflow_dag`
  - `TaskState`;
- establish:

```text
REQUESTED
DISCOVERY
BRIEF_READY
AWAITING_GATE_1
GUI_APPROVED
CANDIDATE_REQUESTED
CANDIDATE_RECEIVED
CANDIDATE_AUDIT
INTEGRATION_PLANNED
AWAITING_IMPLEMENTATION_APPROVAL
IMPLEMENTING
IMPLEMENTED
VERIFYING
CERTIFICATION_READY
AWAITING_GATE_2
CERTIFIED
REJECTED
```

- frontend must consume these states;
- frontend must not create another state machine.

This directly addresses the multiple-authority failure identified in the audit. project-llm-front-back-alignmen…

### Required test

```bash
pytest services/project-ai/tests -q
```

plus:

```bash
npm test -- --runInBand
```

Do not attempt to make every historical test pass yet.

The agent must produce:

```text
architecture-freeze-report.json
```

with:

```json
{
  "agent": "B01",
  "wave": "W0",
  "status": "PASS",
  "canonicalWorkflow": "ProjectLLMCanonicalWorkflow",
  "secondaryAuthorities": [],
  "tests": {
    "passed": 0,
    "failed": 0,
    "skipped": 0
  }
}
```

The numbers must be real, not placeholders.

---

# 5. WAVE 1 — Run these in parallel

After B01 succeeds:

### B03 Repository Contract Intelligence
### B04 Target Binding
### B13 Legacy Cleanup
### B14 Test/Evidence Harness

These can safely work in parallel if file ownership is separated.

---

# 6. B03 — Repository Contract Intelligence

This is one of the most important new agents.

It should turn:

```text
I1
C1
D1
```

into repository-derived evidence.

Not:

```text
I1 = fixture
C1 = fixture
D1 = fixture
```

but:

```text
I1
 ├── source files
 ├── type
 ├── schema
 ├── renderer
 ├── registry
 ├── Composer
 ├── UBRC
 ├── theme
 ├── runtime
 ├── ILS
 ├── LSNB
 ├── RSSB
 └── tests

C1
 ...

D1
 ...
```

Then derive:

```text
COMMON_CONTRACT
```

and:

```text
FAMILY_SPECIFIC_CONTRACT
```

### Example Pydantic model

```python
from pydantic import BaseModel, Field
from typing import Literal


class RepositoryEvidence(BaseModel):
    path: str
    sha256: str
    role: str
    evidence_id: str


class CanonicalReference(BaseModel):
    family: str
    version: str
    evidence: list[RepositoryEvidence]


class RuntimeContract(BaseModel):
    ub_rc_required: bool = True
    passive_ils: bool = True
    page_level_lsnb: bool = True
    page_level_rssb: bool = True
    theme_injected: bool = True
    brand_independent: bool = True


class RepositoryBlockContract(BaseModel):
    family: str
    version: str
    block_type: str

    references: list[CanonicalReference]

    required_artifacts: list[str]

    runtime: RuntimeContract

    renderer_contract: dict
    composer_contract: dict
    schema_contract: dict

    acceptance_criteria: list[str]
```

This becomes backend authority.

---

# 7. B04 — Target Binding

This agent fixes the major problem where the candidate loses the original requested version.

Every workflow must carry:

```python
class WorkflowTarget(BaseModel):
    workflow_id: str
    family: str
    version: str
    block_type: str
    specification_id: str
    source_snapshot_id: str
```

Then:

```python
class CandidateBinding(BaseModel):
    workflow_id: str
    target_family: str
    target_version: str
    specification_id: str
    contract_hash: str
```

Every candidate must contain that binding.

The audit specifically identified the current missing target-family/version binding and hard-coded `1.0.0` as a blocker. project-llm-front-back-alignmen…

---

# 8. B13 — Remove/reclassify legacy Mix & Match

Do not delete useful design/reuse functionality blindly.

Instead:

```text
Mix & Match
```

becomes:

```text
DESIGN_REUSE_INPUT
```

not:

```text
PROJECT_LLM_CREATION_WORKFLOW
```

Remove:

```python
CreationMode.MIX_AND_MATCH
```

as a canonical workflow state.

If UI needs it:

```python
class DesignSource(str, Enum):
    ORIGINAL = "original"
    REUSE = "reuse"
    MIX_AND_MATCH = "mix_and_match"
```

This means:

```text
External AI + human
       ↓
design decision
       ↓
candidate
       ↓
Project LLM verification
```

not:

```text
Mix & Match
       ↓
second workflow engine
```

The current independent `/creation` workflow is explicitly one of the audit blockers. project-llm-front-back-alignmen…

---

# 9. B14 — Build the testing/evidence ledger

This is essential to your question about logs.

Every agent must produce:

```text
agent-run.json
test-results.json
evidence.json
```

and a human-readable:

```text
agent-run.md
```

But remember our canonical-artifact rule:

> **Do not create dozens of permanent Markdown files.**

Instead, use a single canonical evidence directory/document and append structured records.

For example:

```text
docs/project-llm/
    canonical-implementation-status.md
    evidence/
        agent-runs.jsonl
        test-results.jsonl
        certification-results.jsonl
        workflow-events.jsonl
```

If these already exist, **update them instead of creating duplicates**.

---

# 10. Required agent execution record

Every agent must emit:

```json
{
  "runId": "run-20261007-0012",
  "agentId": "B03",
  "wave": "W1",
  "branch": "m2-project-ai-foundation",
  "commitBefore": "abc123",
  "commitAfter": "def456",
  "startedAt": "2026-10-07T12:00:00Z",
  "finishedAt": "2026-10-07T12:07:42Z",

  "filesChanged": [
    "services/project-ai/app/contracts/repository.py"
  ],

  "tests": {
    "unit": {
      "passed": 24,
      "failed": 0,
      "skipped": 1
    },
    "integration": {
      "passed": 8,
      "failed": 0,
      "skipped": 0
    }
  },

  "evidence": [
    {
      "id": "E-B03-001",
      "type": "repository_contract",
      "path": "packages/ui/src/tutorial/blocks/CodeC1Block.tsx",
      "sha256": "..."
    }
  ],

  "status": "PASS",
  "blockers": []
}
```

This gives us something I can later inspect from GitHub.

---

# 11. WAVE 2 — Engineering Contract

After:

```text
B03 PASS
B04 PASS
B13 PASS
B14 PASS
```

run:

## B02 — Engineering Contract Agent

This agent produces:

```text
CandidateBlockEngineeringContract
```

### API

```python
@router.post(
    "/workflows/{workflow_id}/engineering-contract",
    response_model=EngineeringContractResponse,
)
async def create_engineering_contract(
    workflow_id: str,
):
    target = workflow_service.get_target(workflow_id)

    repository_contract = repository_intelligence.build_contract(
        family=target.family,
        version=target.version,
    )

    contract = engineering_contract_builder.build(
        target=target,
        repository_contract=repository_contract,
    )

    return contract
```

---

# 12. Contract structure

The contract should be roughly:

```python
class EngineeringContract(BaseModel):
    contract_id: str

    workflow_id: str

    target: WorkflowTarget

    contract_version: str

    repository_snapshot_id: str

    repository_snapshot_sha256: str

    canonical_references: list[CanonicalReference]

    educational_contract: dict

    implementation_contract: dict

    type_contract: dict

    schema_contract: dict

    ubrc_contract: dict

    renderer_contract: dict

    composer_contract: dict

    runtime_contract: RuntimeContract

    theme_contract: dict

    brand_contract: dict

    ils_contract: dict

    lsnb_contract: dict

    rssb_contract: dict

    required_artifacts: list[str]

    tests_required: list[str]

    acceptance_criteria: list[str]

    prohibited_behaviors: list[str]

    contract_hash: str
```

---

# 13. The contract must explicitly tell External AI what NOT to do

For example:

```python
prohibited_behaviors = [
    "implement_duplicate_ils",
    "call_ils_api_directly",
    "implement_page_navigation",
    "implement_page_progress",
    "implement_duplicate_lsnb",
    "implement_duplicate_rssb",
    "hard_code_suia_branding",
    "hard_code_rth_branding",
    "create_duplicate_composer",
    "create_duplicate_renderer",
    "modify_unapproved_repository_paths",
]
```

This is important because the block should be **compatible with ILS/LSNB/RSSB**, not implement replacement systems. The architecture explicitly distinguishes those responsibilities. Branch · Explain I2 Creation Fi…

---

# 14. Engineering Contract hash

The contract must be immutable for the candidate lifecycle.

```python
def calculate_contract_hash(contract: EngineeringContract) -> str:
    canonical = contract.model_dump_json(
        exclude_none=True,
        by_alias=True,
        exclude={"contract_hash"},
    )

    return hashlib.sha256(
        canonical.encode("utf-8")
    ).hexdigest()
```

Then:

```text
contract_id
contract_hash
snapshot_id
snapshot_hash
```

travel with the candidate.

This lets us later prove:

> Candidate X was evaluated against Contract Y generated from Repository Snapshot Z.

---

# 15. WAVE 3 — Candidate pipeline

After B02:

Run in parallel:

```text
B05 Candidate Intake
B06 Canonical Comparator
B07 Placement
```

But B07 must consume B06's contract, not invent its own comparison.

---

# 16. B05 — Candidate Intake

Candidate package should contain:

```text
candidate/
    manifest.json
    src/
    tests/
    prototype/
```

Manifest:

```json
{
  "workflowId": "...",
  "contractId": "...",
  "contractHash": "...",
  "target": {
    "family": "Objective",
    "version": "O1",
    "blockType": "objective"
  }
}
```

Server calculates hashes.

Never trust:

```json
"sha256": "whatever-external-ai-says"
```

Instead:

```python
server_hash = sha256_file(path)

if declared_hash and declared_hash != server_hash:
    raise CandidateIntegrityError(...)
```

---

# 17. B06 — Wire real CanonicalComparator

This should be a relatively contained change.

Current:

```python
result.outputs["comparison_result"] = "stub"
```

becomes:

```python
comparison = canonical_comparator.compare(
    candidate=candidate,
    target=target,
    repository_snapshot=snapshot,
    engineering_contract=contract,
)

result.outputs["comparison_result"] = comparison.model_dump()
```

And comparison must return:

```python
class ComparisonResult(BaseModel):
    status: Literal[
        "PASS",
        "FAIL",
        "BLOCKED",
    ]

    target_match: bool

    artifacts: list[ArtifactComparison]

    missing_requirements: list[str]

    unexpected_artifacts: list[str]

    conflicts: list[str]

    evidence_ids: list[str]
```

---

# 18. B07 — Canonical artifact policy

The algorithm should be:

```python
for candidate_artifact in candidate.artifacts:

    existing = repository.find_semantic_match(
        candidate_artifact
    )

    if existing is None:
        action = "ADD"

    elif existing.is_same_artifact(candidate_artifact):
        action = "REUSE"

    elif existing.can_extend(candidate_artifact):
        action = "EXTEND"

    elif existing.can_update(candidate_artifact):
        action = "UPDATE"

    else:
        action = "REJECT"
```

This prevents:

```text
Candidate:
ObjectiveBlock.tsx

Repository:
ObjectiveBlock.tsx

Agent:
create ObjectiveBlockV2.tsx
```

just because it doesn't know the existing artifact.

The agreed policy is explicitly to search existing artifacts first and update/extend/reuse canonical artifacts where appropriate.

---

# 19. WAVE 4 — Human Gate 2

After:

```text
Intake PASS
Contract comparison PASS
Canonical comparison PASS
Placement manifest PASS
```

stop.

Do **not** execute placement automatically.

The state becomes:

```text
AWAITING_IMPLEMENTATION_APPROVAL
```

Human approval payload:

```json
{
  "workflowId": "...",
  "manifestHash": "...",
  "contractHash": "...",
  "approved": true,
  "approvedBy": "human",
  "reason": "Approved for repository integration"
}
```

If manifest changes:

```text
APPROVAL = INVALID
```

and workflow returns to:

```text
AWAITING_IMPLEMENTATION_APPROVAL
```

---

# 20. WAVE 5 — Placement

Only after approval:

```text
B07 Placement Executor
```

executes.

No arbitrary shell.

Use:

```text
Approved Operation
       ↓
Validation
       ↓
RepositoryAdapter
       ↓
Git operation
```

not:

```text
AI-generated shell command
       ↓
shell
```

---

# 21. WAVE 6 — Post-placement verification

Now these can run **in parallel** because they consume the same immutable post-placement snapshot.

```text
B08 Certification Gates
B09 Runtime
B10 Browser
B03 Repository Rediscovery
B14 Evidence
```

This is where parallelism saves significant time.

But each agent must be read-only against the same snapshot.

---

# 22. B08 — Certification Gate Executor

Replace:

```python
all_gates = {
    "contract": "PASS",
    "ubrc": "PASS",
    ...
}
```

with:

```python
gate_results = {}

for gate in required_gates:
    result = await gate_executor.execute(
        gate=gate,
        workflow=workflow,
        snapshot=snapshot,
        contract=contract,
    )

    gate_results[gate.id] = result
```

Then:

```python
def overall_status(gates):
    if any(g.status == "FAIL" for g in gates):
        return "FAIL"

    if any(g.status == "BLOCKED" for g in gates):
        return "BLOCKED"

    if not all(g.status == "PASS" for g in gates):
        return "BLOCKED"

    return "PASS"
```

**Never default to PASS.**

---

# 23. B09 — Runtime verification

Runtime verification should execute the actual project path:

```text
TutorialDocument
     ↓
TutorialPageShell
     ↓
Theme
     ↓
TutorialBlockRenderer
     ↓
Candidate Block
     ↓
ActiveBlockContext
     ↓
ILSProvider
```

Then capture evidence.

Example:

```json
{
  "gate": "runtime",
  "status": "PASS",
  "evidence": [
    {
      "id": "E-RUNTIME-001",
      "type": "render_trace",
      "blockId": "objective-001",
      "blockType": "objective",
      "blockVersion": "O1"
    }
  ]
}
```

---

# 24. B10 — Browser verification

Use the existing Playwright infrastructure.

Do not introduce another browser framework.

Example:

```typescript
test("O1 renders through TutorialBlockRenderer", async ({ page }) => {
  await page.goto(testTutorialUrl);

  const block = page.locator(
    '[data-block-type="objective"][data-block-version="O1"]'
  );

  await expect(block).toBeVisible();
});
```

Then verify:

```text
data-block-id
data-block-type
data-block-version
```

plus Composer discoverability and actual tutorial rendering.

---

# 25. ILS / LSNB / RSSB verification

These should **not** mean:

```text
Did the block implement ILS?
```

They should mean:

```text
Does the block correctly participate in the existing system?
```

For ILS:

```text
Block
 ↓
UBRC identity
 ↓
ActiveBlockContext
 ↓
ILSProvider
```

For LSNB:

```text
TutorialPageShell
 ↓
LSNB
```

For RSSB:

```text
TutorialPageShell / canonical page runtime
 ↓
RSSB
```

The block must not create replacement systems.

The repository evidence specifically establishes that these systems are page/runtime infrastructure rather than something each block should recreate. Branch · Explain I2 Creation Fi…

---

# 26. Brand/theme verification

Test the **same candidate** under:

```text
Theme A
Theme B
```

and where available:

```text
SUIA
RTH
```

The test should prove:

```text
same implementation
+
different injected theme
=
valid rendering
```

and reject:

```typescript
const primary = "#123456";
```

if that color is actually a hard-coded brand dependency.

The Engineering Contract should tell External AI that theme is injected and that SUIA/RTH branding cannot be hard-coded. Branch · Explain I2 Creation Fi…

---

# 27. WAVE 7 — Final Gate

B11 runs **only after all evidence-producing agents finish**.

It should receive:

```text
Contract Result
UBRC Result
Schema Result
Renderer Result
Composer Result
Test Result
Runtime Result
Browser Result
ILS Result
LSNB Result
RSSB Result
Brand Result
Theme Result
Dependency Result
Snapshot Result
```

Then:

```python
final = final_gate.evaluate(
    workflow=workflow,
    gate_results=gate_results,
    evidence=evidence,
)
```

The invariant:

```python
if missing_required_evidence:
    return "BLOCKED"

if any_failed:
    return "FAIL"

if any_blocked:
    return "BLOCKED"

if not all_required_pass:
    return "BLOCKED"

return "CERTIFIED"
```

---

# 28. `CERTIFICATION_READY` must NOT equal `CERTIFIED`

This distinction needs to be encoded:

```text
VERIFYING
    ↓
all automated checks completed
    ↓
CERTIFICATION_READY
    ↓
Human Gate 2
    ↓
CERTIFIED
```

Never:

```text
tests passed
 ↓
CERTIFIED
```

---

# 29. Frontend implementation starts after backend contracts stabilize

This is important.

Do **not** let Gemini guess the backend API.

First B01–B11 establish the contracts.

Then F01.

---

# 30. F01 — Typed FastAPI client

Create something like:

```text
apps/skillhubcore-admin/src/lib/project-llm/api/
    client.ts
    contracts.ts
    workflows.ts
    contracts.ts
    candidates.ts
    approvals.ts
    evidence.ts
```

Example:

```typescript
export interface WorkflowTarget {
  workflowId: string;
  family: string;
  version: string;
  blockType: string;
  specificationId: string;
  sourceSnapshotId: string;
}

export interface EngineeringContract {
  contractId: string;
  workflowId: string;
  target: WorkflowTarget;
  contractHash: string;
  requiredArtifacts: string[];
  acceptanceCriteria: string[];
  runtime: RuntimeContract;
}
```

API:

```typescript
export async function getEngineeringContract(
  workflowId: string,
): Promise<EngineeringContract> {
  const response = await fetch(
    `${PROJECT_AI_URL}/api/v1/workflows/${workflowId}/engineering-contract`,
  );

  if (!response.ok) {
    throw new Error(
      `Engineering contract request failed: ${response.status}`,
    );
  }

  return response.json();
}
```

---

# 31. F02 — Create Block

Remove:

```typescript
const nextVersion = versions.length + 1;
```

Instead:

```typescript
const [family, setFamily] = useState<string>();
const [version, setVersion] = useState<string>();
```

Then:

```typescript
await api.createWorkflow({
  family,
  version,
});
```

Backend decides whether that version:

```text
exists
new
extension
update
invalid
```

The GUI must not invent the version.

---

# 32. F03 — Compliance Brief / External AI Handoff

The GUI receives:

```text
EngineeringContract
```

and renders it.

It should **not construct the contract itself**.

The External AI page should display:

```text
TARGET
IMPLEMENTATION
TYPES
SCHEMA
UBRC
ILS
LSNB
RSSB
THEME
BRAND
RENDERER
COMPOSER
RUNTIME
TESTS
ACCEPTANCE CRITERIA
PROHIBITED BEHAVIOR
EVIDENCE
```

This is precisely the self-contained package we established. Branch · Explain I2 Creation Fi…

---

# 33. F04 — Candidate Upload

Instead of:

```typescript
setTimeout(() => {
  setChecks(allPassed);
}, 2000);
```

do:

```typescript
const result = await api.uploadCandidate({
  workflowId,
  file,
});
```

Then display:

```text
RECEIVED
  ↓
HASHING
  ↓
INTAKE
  ↓
CLASSIFICATION
  ↓
CONTRACT CHECK
  ↓
CANONICAL COMPARISON
  ↓
PLACEMENT PLAN
```

Each state comes from backend.

---

# 34. F05 — Certification UI

Never:

```typescript
const certified = true;
```

Instead:

```typescript
const certification = await api.getCertification(workflowId);

const certified =
  certification.status === "CERTIFIED";
```

And each gate:

```typescript
<GateStatus
  name="Composer"
  status={certification.gates.composer.status}
  evidence={certification.gates.composer.evidence}
/>
```

No evidence:

```text
BLOCKED
```

not:

```text
PASS
```

---

# 35. F06 — Workflow Details

Workflow Details should become a pure projection:

```text
Backend Workflow
      ↓
Frontend rendering
```

It should show:

```text
currentState
previousState
nextAllowedStates
agentRuns
evidence
approvals
snapshots
gateResults
errors
```

No frontend workflow transitions.

---

# 36. What can run in parallel?

## Safe parallel work

After W0:

```text
B03 Repository Intelligence
B04 Target Binding
B13 Legacy Cleanup
B14 Evidence Harness
```

Then:

```text
B05 Candidate Intake
B06 Canonical Comparison
B07 Placement Planning
```

Then after placement:

```text
B08 Certification Gates
B09 Runtime
B10 Browser
Repository Rediscovery
Evidence Collection
```

Frontend:

```text
F02 Create
F03 Handoff
F06 Workflow UI
```

can work in parallel **after F01 contracts are available**.

---

# 37. What MUST be sequential?

These must not be parallelized:

```text
B01 Architecture Authority
      ↓
B03/B04
      ↓
B02 Engineering Contract
      ↓
B05 Candidate Intake
      ↓
B06/B07
      ↓
Human Approval
      ↓
Placement
      ↓
Post-placement snapshot
      ↓
B08/B09/B10
      ↓
B11 Final Gate
      ↓
Certification
```

And:

```text
Backend contract stabilization
      ↓
F01 API client
      ↓
F02-F06 GUI integration
```

Do not let Gemini build the frontend API assumptions before Kiro freezes the FastAPI contracts.

---

# 38. Agent prompt structure

Every agent should receive the same top-level policy.

For example:

```text
PROJECT AI MULTI-AGENT ENGINEERING POLICY

You are one agent in a controlled Project LLM implementation.

You MUST:

1. Read the canonical architecture before modifying code.
2. Search existing files before creating files.
3. Update/extend canonical artifacts where possible.
4. Never create duplicate documentation merely to report your work.
5. Respect your assigned ownership boundary.
6. Never create a second workflow authority.
7. Never fabricate PASS.
8. Missing evidence = BLOCKED.
9. Preserve family/version/workflow/contract identity.
10. Record every test result.
11. Record every changed file.
12. Record commit SHA.
13. Record failures honestly.
14. Do not modify another agent's owned files unless explicitly authorized.
15. Do not declare certification.
16. Do not perform arbitrary shell execution.
17. Do not bypass human approval.
18. Do not implement duplicate ILS/LSNB/RSSB systems.
19. Do not hard-code SUIA/RTH brand behavior.
20. Run the required verification commands before completion.

Completion is not:
"code written."

Completion is:
"code written + tests run + evidence recorded + contract satisfied."
```

---

# 39. Each agent should have a strict completion contract

For example B06:

```text
B06 COMPLETE ONLY IF:

[ ] CanonicalComparator is actually called by Agent 7
[ ] No "stub" comparison result remains
[ ] Candidate is compared against target contract
[ ] Target family verified
[ ] Target version verified
[ ] Required artifacts compared
[ ] Unexpected artifacts reported
[ ] Evidence IDs generated
[ ] PASS/FAIL/BLOCKED semantics implemented
[ ] Unit tests pass
[ ] Integration test passes
[ ] Evidence ledger updated
[ ] Git commit created
```

This prevents agents from reporting:

> "Implemented."

when they only added a class that is never called.

---

# 40. Testing strategy

We should have **four levels**.

## Level 1 — Unit

```bash
pytest services/project-ai/tests/unit -q
```

## Level 2 — Integration

```bash
pytest services/project-ai/tests/integration -q
```

## Level 3 — API

```bash
pytest services/project-ai/tests/api -q
```

## Level 4 — End-to-end

```bash
pytest services/project-ai/tests/e2e -q
```

and:

```bash
npx playwright test
```

Frontend:

```bash
npm run lint
npm run typecheck
npm test
```

---

# 41. Critical negative tests

We should explicitly test failure.

### Test 1 — Wrong version

```text
Requested:
I7

Candidate:
I6

Expected:
FAIL
```

### Test 2 — Missing schema

```text
Candidate:
component exists
schema missing

Expected:
BLOCKED / FAIL
```

### Test 3 — Fake Composer registration

```text
registry missing

Expected:
FAIL
```

### Test 4 — Hard-coded brand

```text
candidate contains SUIA-specific color/logo

Expected:
FAIL
```

### Test 5 — Duplicate ILS

```text
candidate imports ILS API directly

Expected:
FAIL
```

### Test 6 — Missing runtime evidence

```text
runtime not executed

Expected:
BLOCKED
```

### Test 7 — Approval mismatch

```text
manifest hash changed after approval

Expected:
APPROVAL_INVALID
```

### Test 8 — Fake PASS

```text
gate implementation unavailable

Expected:
BLOCKED

Never:
PASS
```

---

# 42. The most important end-to-end test

Eventually we need one golden test:

```text
CREATE WORKFLOW
      ↓
Objective/O1
      ↓
DISCOVERY
      ↓
ENGINEERING CONTRACT
      ↓
CONTRACT HASH
      ↓
CANDIDATE UPLOAD
      ↓
TARGET MATCH
      ↓
CANONICAL COMPARISON
      ↓
PLACEMENT MANIFEST
      ↓
HUMAN APPROVAL
      ↓
PLACEMENT
      ↓
SNAPSHOT
      ↓
COMPOSER
      ↓
RENDERER
      ↓
RUNTIME
      ↓
BROWSER
      ↓
ILS
      ↓
LSNB
      ↓
RSSB
      ↓
THEME
      ↓
BRAND
      ↓
FINAL GATE
      ↓
CERTIFIED
```

The test should produce a single:

```text
workflow-e2e-result.json
```

containing every step and evidence ID.

---

# 43. Example final E2E evidence

```json
{
  "workflowId": "wf-001",
  "target": {
    "family": "Objective",
    "version": "O1"
  },

  "contract": {
    "id": "contract-001",
    "sha256": "abc..."
  },

  "candidate": {
    "id": "candidate-001",
    "sha256": "def..."
  },

  "states": [
    "REQUESTED",
    "DISCOVERY",
    "BRIEF_READY",
    "AWAITING_GATE_1",
    "GUI_APPROVED",
    "CANDIDATE_REQUESTED",
    "CANDIDATE_RECEIVED",
    "CANDIDATE_AUDIT",
    "INTEGRATION_PLANNED",
    "AWAITING_IMPLEMENTATION_APPROVAL",
    "IMPLEMENTING",
    "IMPLEMENTED",
    "VERIFYING",
    "CERTIFICATION_READY",
    "AWAITING_GATE_2",
    "CERTIFIED"
  ],

  "gates": {
    "contract": "PASS",
    "ubrc": "PASS",
    "schema": "PASS",
    "renderer": "PASS",
    "composer": "PASS",
    "tests": "PASS",
    "runtime": "PASS",
    "browser": "PASS",
    "ils": "PASS",
    "lsnb": "PASS",
    "rssb": "PASS",
    "brand": "PASS",
    "theme": "PASS"
  },

  "final": {
    "status": "CERTIFIED",
    "evidenceComplete": true
  }
}
```

That is what I would want to see on GitHub before calling the implementation complete.

---

# 44. Git strategy

I recommend **one branch for the complete backend milestone**, not one permanent branch per agent.

For example:

```text
m2-project-ai-canonical-wiring
```

Agents work in isolated worktrees.

Commits:

```text
B01: freeze canonical workflow authority
B03: add repository contract intelligence
B04: bind workflow target family/version
B13: retire legacy creation authority
B14: add evidence/test ledger
B02: add engineering contract generation
B05: bind candidate intake
B06: wire canonical comparator
B07: finalize placement policy
B08: wire certification gates
B09: wire runtime verification
B10: wire browser verification
B11: wire final gate
...
```

Then:

```text
Q01: backend integration verification
Q02: frontend integration verification
Q03: end-to-end certification verification
Q04: final evidence package
```

---

# 45. Very important: each agent must commit

No agent should finish with:

> "Changes are ready."

It must finish with:

```text
Commit:
abc123

Tests:
PASS 48
FAIL 0
SKIP 2

Evidence:
E-B06-001
E-B06-002
...

Files:
...

Status:
PASS
```

Then the next agent knows exactly what it is consuming.

---

# 46. What we will check after GitHub upload

Yes — **this is exactly where the GitHub cross-check becomes valuable.**

Once Kiro/Gemini push the implementation, I can inspect:

```text
GitHub
  │
  ├── commits
  ├── changed files
  ├── backend contracts
  ├── frontend API integration
  ├── agent coordinator
  ├── test output
  ├── evidence ledger
  ├── E2E result
  └── certification records
```

and compare against:

```text
24-row architecture matrix
        +
new implementation matrix
        +
actual GitHub code
        +
test/evidence records
```

Then I can say, for example:

```text
P0-1 External AI Contract      PASS
P0-2 FastAPI GUI Integration   PASS
P0-3 Agent 7/12/13/14 Wiring   PASS
P0-4 Target Version Binding    PASS
P0-5 Workflow Authority        PASS
P0-6 Mix & Match               PASS
```

rather than trusting agent reports.

---

# 47. The testing log should therefore become part of the product evidence

I strongly recommend this structure:

```text
docs/project-llm/
│
├── canonical-architecture.md
├── canonical-workflow.md
├── canonical-agent-registry.md
├── canonical-implementation-status.md
│
└── evidence/
    ├── agent-runs.jsonl
    ├── test-results.jsonl
    ├── workflow-events.jsonl
    ├── gate-results.jsonl
    └── certification-results.jsonl
```

**Only if those canonical artifacts do not already exist.**

If an existing Project LLM evidence/status document already serves this purpose, agents must append/update it rather than creating another competing document.

That follows the canonical-artifact rule we have already established.

---

# 48. Final agent matrix

Here is the execution plan I would give the Project AI multi-agent system:

| Wave | Agent | Parallel? | Depends on | Main output |
|---|---|---|---|---|
| W0 | B01 Architecture Authority | No | — | canonical lifecycle |
| W1 | B03 Repository Intelligence | Yes | B01 | repository contract |
| W1 | B04 Target Binding | Yes | B01 | target identity |
| W1 | B13 Legacy Cleanup | Yes | B01 | authority cleanup |
| W1 | B14 Evidence Harness | Yes | B01 | test/evidence ledger |
| W2 | B02 Engineering Contract | No | B03+B04 | External AI contract |
| W3 | B05 Candidate Intake | Yes | B02 | bound candidate |
| W3 | B06 Canonical Comparator | Yes | B02 | comparison result |
| W3 | B07 Placement Planning | Yes | B02+B06 | placement manifest |
| W4 | Human Gate 2 | No | B05+B06+B07 | approval |
| W5 | Placement Executor | No | approval | repository integration |
| W6 | B08 Certification | Yes | placement | gate results |
| W6 | B09 Runtime | Yes | placement | runtime evidence |
| W6 | B10 Browser | Yes | placement | browser evidence |
| W6 | Rediscovery | Yes | placement | snapshot/evidence |
| W7 | B11 Final Gate | No | all W6 | CERTIFIED/FAIL/BLOCKED |
| W8 | F01 API Client | No | backend contracts | typed API |
| W9 | F02 Create | Yes | F01 | real selection |
| W9 | F03 Handoff | Yes | F01+B02 | real contract UI |
| W9 | F04 Upload | Yes | F01+B05 | real candidate UI |
| W9 | F05 Certification | Yes | F01+B11 | real gate UI |
| W9 | F06 Workflow | Yes | F01+B01 | real lifecycle UI |
| W10 | Q01 Backend Audit | No | all backend | backend report |
| W10 | Q02 Frontend Audit | No | all frontend | frontend report |
| W11 | Q03 E2E Audit | No | Q01+Q02 | full certification |
| W11 | Q04 Evidence Packager | No | Q03 | GitHub evidence package |

---

# 49. One correction to the previous 15-agent architecture

The original 15-agent structure is still useful:

```text
1 Repository Auditor
2 Snapshot Authority
3 Evidence Freeze
4 Block Specification
5 Candidate Intake
6 Candidate Classification
7 Canonical Comparison
8 Placement Manifest
9 Human Approval
10 Placement Executor
11 Post Placement Snapshot
12 Certification Controller
13 Runtime Verification
14 Browser Verification
15 Final Gate
```

But we now need to distinguish:

### Existing 15-agent **candidate verification DAG**

from:

### New pre-candidate **Engineering Contract generation**

The latter is required because the old Block Specification agent mostly reasons about the candidate after upload.

We need:

```text
PRE-CANDIDATE
────────────────────────────
Repository Intelligence
        ↓
Engineering Contract
        ↓
External AI
        ↓
Candidate


POST-CANDIDATE
────────────────────────────
Candidate Intake
        ↓
Classification
        ↓
Canonical Comparison
        ↓
Placement
        ↓
Certification
```

That distinction is critical.

The audit explicitly identified the missing pre-implementation contract-generation phase. project-llm-front-back-alignmen…

---

# 50. Final definition of success

I would **not** mark this milestone complete because:

```text
✓ FastAPI starts
✓ React page renders
✓ 15 agents exist
✓ tests compile
```

Instead, completion means this demonstrable scenario works:

```text
User:
  Select Objective / O1

Project LLM:
  Reads repository
  Finds I1/C1/D1/common patterns
  Finds applicable Objective patterns
  Finds exact schema/type/renderer/Composer/runtime contracts
  Creates immutable Engineering Contract

External AI:
  Receives contract with zero prior project knowledge
  Builds prototype
  Human approves
  Builds React/TS candidate

Project LLM:
  Receives candidate
  Verifies Objective/O1
  Verifies contract hash
  Calculates hashes
  Finds canonical artifacts
  Determines ADD/UPDATE/EXTEND/REUSE
  Creates placement manifest

Human:
  Approves manifest

Project LLM:
  Places candidate
  Takes snapshot
  Runs Composer verification
  Runs renderer verification
  Runs runtime verification
  Runs Playwright
  Verifies UBRC
  Verifies ILS compatibility
  Verifies LSNB compatibility
  Verifies RSSB compatibility
  Verifies theme
  Verifies brand independence
  Collects evidence

Final Gate:
  PASS only if every required gate has evidence

Result:
  CERTIFIED

Tutorial Composer:
  Can actually discover/select/configure the new block

Tutorial Page:
  Renders it

ILS:
  Observes it through existing runtime

SUIA/RTH:
  Same implementation works through injected theme/brand context
```

**That is the acceptance test for the entire Project LLM initiative.**

The existing audit already classifies the project as a strong M2 foundation but not yet this complete system. project-llm-front-back-alignmen…

And yes: **once these agents run, the logs, commit SHAs, test results, evidence IDs, and final E2E result are pushed to GitHub, I can cross-check the actual implementation against this matrix rather than relying on the agents' claims.** That should become our normal verification loop.