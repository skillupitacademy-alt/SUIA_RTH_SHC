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

# Guided to Project AI model

**I recommend Option 3 — let it continue, but under controlled monitoring.**

I reviewed the actual M2.9 implementation plan you uploaded, and there is enough concrete structure already in place that **stopping and restarting Wave 1 would add unnecessary churn**. The plan explicitly says Wave 0 is complete before Wave 1, and Wave 1 is designed as the parallel foundation layer. Pasted markdown

However, I would **not** simply let it run unattended. There are several points in the plan that I want the agents to treat carefully.

## My recommendation

### Continue:

```text
W0 B01
   ↓
W1
 ├── B03 Repository Contract Intelligence
 ├── B04 Target Binding
 ├── B13 Legacy Cleanup
 └── B14 Evidence Harness
```

These four are explicitly intended to run in parallel after Wave 0. Pasted markdown

But put a **hard review gate after Wave 1**.

So the execution becomes:

```text
W0
 ↓
W1 parallel
 ↓
🛑 REVIEW GATE
 ↓
W2
 ↓
🛑 REVIEW GATE
 ↓
W3
 ↓
🛑 REVIEW GATE
 ↓
W4
 ↓
W5
 ↓
🛑 REVIEW GATE
 ↓
W6
 ↓
🛑 REVIEW GATE
 ↓
W7
 ↓
🛑 FINAL AUDIT
```

That is safer than either stopping now or blindly letting all seven waves run.

---

# Why I do NOT recommend Option 1

Option 1 says essentially:

> Let everything continue and trust that monitoring will catch problems.

I don't recommend that.

The plan contains some assumptions that need validation against the **actual repository**, especially because the plan itself discovered discrepancies.

For example, the plan says:

> `IntroductionI1Block.tsx: NOT FOUND`

and:

> `DefinitionD1Block.tsx: NOT FOUND`

while `CodeC1Block.tsx` exists. Pasted markdown

That means B03 is particularly important. We do **not** want B03 to manufacture an assumed I1/D1 architecture simply because the implementation plan expects those names.

It must derive the canonical references from the actual TypeScript snapshot.

---

# Why I do NOT recommend Option 2

Stopping immediately would throw away useful progress.

Wave 0 has already established the canonical workflow direction, and the plan explicitly treats Wave 1 as dependent on that completed foundation. Pasted markdown

So there is no architectural reason to reset everything right now.

---

# Therefore: Option 3

## Let Wave 1 continue.

But give the agents this rule:

> **Wave 1 is exploratory/foundation work, not permission to reinterpret the architecture. Every agent must validate the existing repository before creating or modifying canonical artifacts.**

And then **stop automatically after Wave 1 for review**.

---

# What I want Wave 1 to prove

### B03 — Repository Contract Intelligence

This is the most important one.

It should prove:

```text
TypeScript Repository Snapshot
        ↓
RepositoryContract
        ↓
Canonical references
        ↓
Composer
        ↓
Renderer
        ↓
Schema
        ↓
Runtime
        ↓
UBRC
        ↓
ILS
        ↓
LSNB
        ↓
RSSB
        ↓
Theme
        ↓
Brand
```

And critically:

```text
Python
   X
direct repository filesystem scanning
```

The plan explicitly preserves the M2 rule that Python consumes the TypeScript snapshot rather than scanning the repository directly. Pasted markdown

### B04 — Target Binding

It must prove:

```text
User selected:
Introduction / I7

        ↓

WorkflowTarget

        ↓

CandidateBinding

        ↓

PlacementManifest

        ↓

Certification

        ↓

Final Gate
```

No more:

```text
UI: I7
backend: 1.0.0
```

The plan explicitly identifies that mismatch as a problem. Pasted markdown

### B13 — Legacy Cleanup

This one needs particular attention.

The plan says to remove `CreationMode` and replace it with `DesignSource`. Pasted markdown

That's directionally correct, but I want the agent to ensure it doesn't simply rename the old workflow.

The desired architecture is:

```text
DesignSource
    ↓
same canonical workflow
```

not:

```text
DesignSource
    ↓
different workflow
```

### B14 — Evidence

The plan proposes:

```text
.agents/evidence/runs/
```

with one run directory containing the audit trail. Pasted markdown

That's acceptable **provided the repository does not already have a canonical evidence artifact serving the same purpose**.

This is exactly where your "search first, update canonical artifact, don't create duplicates" rule needs to be enforced.

---

# One correction I want the agents to make

There is a potentially dangerous statement in the plan:

> "Create `docs/project-llm/evidence/`"

was considered earlier, but the actual M2.9 plan correctly moved toward:

```text
.agents/evidence/
```

The plan says that `docs/project-llm/evidence/` does not currently exist and proposes `.agents/evidence/` as the machine-readable ledger. Pasted markdown Pasted markdown

**Keep one canonical evidence location.**

Do not allow another agent later to create:

```text
docs/project-llm/evidence/
docs/project-llm/test-results/
services/project-ai/.evidence/
.agents/evidence/
```

as four competing sources of truth.

The existing `.evidence` implementation should be examined and either integrated or explicitly designated as legacy.

---

# Another important correction

The plan currently says:

> "WAVE 3 — Candidate Pipeline (Parallel: B05, B06, B07)"

But B07 explicitly consumes B06's canonical comparison results:

```text
B06
 ↓
comparison
 ↓
B07
 ↓
placement manifest
```

So **B05 and B06 can work in parallel**, but B07's execution should wait until the comparison contract is available.

I would therefore treat Wave 3 as:

```text
          ┌── B05 Candidate Intake
W2 ───────┤
          └── B06 Canonical Comparison
                    │
                    ▼
                 B07 Placement
```

rather than three completely independent agents.

This is consistent with the broader dependency rule that placement consumes the comparison rather than inventing another comparison. The plan itself says B07 must use the canonical comparison results. Pasted markdown

---

# And one major safety gate

The plan's Wave 5 is good:

```text
Human approval
      ↓
isolated worktree
      ↓
path allowlist
      ↓
dry-run
      ↓
RepositoryAdapter
      ↓
commit
```

rather than:

```text
AI
 ↓
arbitrary shell
 ↓
current branch
```

The plan explicitly requires the isolated worktree, allowlist and dry-run approach. Pasted markdown

**Do not weaken this requirement.**

---

# The most important monitoring rule

If any agent reports:

```text
"Implemented"
```

that is **not enough**.

It must report:

```text
Agent
Wave
Commit SHA
Files changed
Tests executed
PASS
FAIL
SKIP
Evidence IDs
Architecture decision
Remaining blockers
```

And the actual Git diff must support the report.

---

# What I would do at each review point

### After W1

I will want to verify:

```text
CanonicalWorkflowState
RepositoryContract
WorkflowTarget
CandidateBinding
DesignSource
Evidence architecture
```

and make sure no duplicate systems were introduced.

### After W2

Verify:

```text
EngineeringContract
     ↓
real repository evidence
     ↓
real target
     ↓
real External AI handoff
```

### After W3

Verify:

```text
real upload
+
server hash
+
target binding
+
canonical comparison
+
placement manifest
```

### After W5

This is a major security review:

```text
approval
+
path policy
+
isolated worktree
+
dry run
+
RepositoryAdapter
```

### After W7

Then we verify:

```text
CERTIFICATION_READY
        ≠
CERTIFIED
```

The plan explicitly requires HAA approval before the final `CERTIFIED` state. Pasted markdown

---

# One more important point: don't force the "55 failures → zero" blindly

The plan currently says:

> "All 55 previously failing certification tests now pass."

as a Wave 6 success criterion. Pasted markdown

I would change the interpretation slightly:

**Do not make "zero failures" the goal at the expense of architecture.**

Instead:

```text
55 failures
 ↓
classify failures
 ↓
architecture defects
 ↓
real bugs
 ↓
obsolete tests
 ↓
incorrect expectations
 ↓
fix appropriately
 ↓
full regression
```

Otherwise an agent could "fix" the 55 failures by weakening assertions or making gates return PASS—which would be exactly the wrong outcome.

---

# So my exact recommendation to you

**Choose Option 3.**

Tell the Project AI workflow:

> **Continue M2.9. Wave 0 is accepted. Execute Wave 1 in parallel (B03, B04, B13, B14). Do not proceed to Wave 2 until Wave 1 produces commits, tests, evidence, changed-file summaries, and architecture reports. Preserve the canonical-artifact rule, do not create duplicate authorities, do not fabricate PASS, and validate repository reality against the TypeScript snapshot.**

Then **pause after Wave 1**.

At that point, bring me the pushed branch/commit information and I can independently inspect what actually happened.

That gives us the best balance:

**we don't waste the work already completed, but we also don't let a potentially incorrect interpretation propagate through W2–W7.**

And importantly, the uploaded plan itself says the intended sequence is W0 → W1 → W2 → W3 → W4 → W5 → W6 → W7, with W1 explicitly parallel and each subsequent wave dependent on the previous one. Pasted markdown

Yes. **The F-series implementation should start only after the backend W-series has reached its defined completion/review point**, but there is an important distinction:

### 1. What I already provided for F-series

Yes — the earlier M2.9 plan included the **F-series implementation scope and detailed responsibilities**, not just the names.

The F-series was defined as:

| F Agent | Responsibility |
|---|---|
| **F01** | FastAPI/API contract client and frontend integration foundation |
| **F02** | Create / Engineering Contract / Compliance Brief UI |
| **F03** | External AI Handoff UI |
| **F04** | Candidate Upload & Validation UI |
| **F05** | Integration & Certification UI |
| **F06** | Workflow / Evidence Details UI |

And the implementation requirements were already specified, including:

- remove hardcoded frontend workflow state
- stop using `localStorage` as workflow authority
- use backend `CanonicalWorkflowState`
- explicit family/version selection from backend
- consume the Engineering Contract from FastAPI
- real candidate upload API
- display server-side validation/comparison results
- display real certification gate results/evidence
- display real workflow state
- no second workflow engine in TypeScript
- no fabricated PASS/fixture data
- loading/empty/error/blocked/success states
- preserve the existing SkillHubCore Admin shell/design system
- frontend remains a **view/control surface**, not the workflow authority

The uploaded M2.9 plan also explicitly puts frontend integration **after the backend waves**. Pasted markdown

---

# 2. Does F-series wait until *all* W-series waves are finished?

**Yes, for the canonical M2.9 implementation, that is the correct sequencing.**

The intended dependency is:

```text
W0
Architecture Authority
     ↓
W1
Repository Contract + Target Binding
+ Legacy Cleanup + Evidence Harness
     ↓
W2
Engineering Contract
     ↓
W3
Candidate Intake + Comparator + Placement
     ↓
W4
Human Implementation Approval
     ↓
W5
Safe Repository Placement
     ↓
W6
Real Certification / Runtime / Browser / Brand / Theme
     ↓
W7
Final Gate + HAA Gate 2
     ↓
==============================
BACKEND CANONICAL CONTROL PLANE
READY
==============================
     ↓
F01
Frontend API Contract Layer
     ↓
F02 ──┐
F03 ──┤
F04 ──┼── Frontend implementation
F05 ──┤
F06 ──┘
     ↓
Q01/Q02
Backend + Frontend Integration Audit
     ↓
Q03
End-to-End Certification Audit
     ↓
Q04
Evidence / GitHub Evidence Pack
```

So **do not start F02–F06 against an unstable backend contract**.

---

# 3. But F01 can begin before everything?

I would make one refinement to the original plan.

**F01 should not be treated as ordinary UI implementation.**

F01 is the frontend/backend contract integration layer. It depends heavily on the final backend contracts, particularly:

- `CanonicalWorkflowState`
- `WorkflowTarget`
- `CandidateBinding`
- `EngineeringContract`
- candidate upload response
- comparison response
- placement manifest
- approval state
- certification gate results
- evidence references
- final-gate response

Therefore:

### Recommended rule

```text
W0–W7
     ↓
Backend contract freeze
     ↓
F01
     ↓
F02–F06
```

You can prepare F01 technically while W-series is progressing, but **production integration should begin only after W7 contracts are frozen**.

That prevents Gemini from implementing against APIs that Kiro subsequently changes.

---

# 4. I would NOT give F-series the same freedom as W-series

This is important.

The W-series is primarily **backend/core implementation**.

The F-series should receive a very strict frontend implementation contract:

### F-series must NOT:

- invent workflow states
- invent API responses
- create another workflow engine
- calculate certification status locally
- determine whether something is certified
- infer the next version with `versions.length + 1`
- use mock data where a FastAPI endpoint exists
- create another evidence system
- recreate repository intelligence in TypeScript
- recreate candidate comparison
- recreate certification gates
- recreate placement logic
- make Project LLM decisions independently

Instead:

```text
FastAPI
  ↓
Canonical Project LLM state/domain
  ↓
F-series API client
  ↓
React/Next UI
```

The GUI should essentially say:

> **"Show me what Project LLM says, and let the human perform the permitted control actions."**

---

# 5. F-series detailed implementation order

I recommend this exact sequence when W7 is complete.

## F01 — API Contract Foundation

First.

Implement typed API access for:

```text
Workflow
Target
Engineering Contract
Candidate
Comparison
Placement Manifest
Approval
Certification
Evidence
Final Gate
```

And remove/retire:

```text
localStorage workflow authority
hardcoded workflow fixtures
TS workflow coordinator authority
```

The existing:

```text
projectLlmWorkflowCoordinator.ts
```

should **not remain a second workflow engine**.

It can become:

```text
API client
view-model helpers
formatters
selectors
types
```

but not state authority.

---

## F02 — Create + Compliance Brief

Then implement:

```text
Select Block Family
        ↓
Explicit Target Version
        ↓
Repository Intelligence
        ↓
Engineering Contract
        ↓
Compliance Brief
        ↓
Gate 1
```

The UI should consume the backend contract.

For example, it should display actual:

```text
family
version
canonical references
schema requirements
UBRC requirements
renderer requirements
Composer requirements
ILS requirements
LSNB requirements
RSSB requirements
theme requirements
brand-independence requirements
required artifacts
acceptance criteria
prohibited behaviours
contract hash
```

Not recreate those rules in React.

---

# 6. F03 — External AI Handoff

Then:

```text
Compliance Brief
       ↓
External AI Handoff
       ↓
Prototype requirements
       ↓
Human approval
       ↓
React/TS implementation
```

This is where the UI clearly communicates:

> External AI is the implementation worker.  
> Project LLM is the engineering contract / verification authority.

The frontend should not claim:

```text
"Certified"
```

at this stage.

It should show the appropriate lifecycle state.

---

# 7. F04 — Candidate Upload

Then connect the existing Candidate Upload UI to the real backend.

Instead of:

```text
setTimeout(...)
11 checks = PASS
```

it should perform an actual request:

```text
POST candidate
        ↓
server calculates SHA-256
        ↓
candidate bound to workflow target
        ↓
candidate inspection
        ↓
classification
        ↓
canonical comparison
        ↓
validation result
```

And display actual evidence.

This is one of the biggest frontend changes.

---

# 8. F05 — Integration & Certification

This comes after the backend certification machinery is real.

The UI should show something like:

```text
Integration
──────────────
Target
Candidate
Comparison
Placement Manifest
Approval
Placement
Snapshot

Certification
──────────────
UBRC             PASS
Brand            PASS
Theme            PASS
Composer         PASS
Runtime          PASS
Browser          PASS
Manifest         PASS
Evidence         PASS

Final Gate
──────────────
CERTIFICATION_READY

Human Approval
──────────────
AWAITING_GATE_2
```

And importantly:

```text
CERTIFICATION_READY
```

must **not** automatically become:

```text
CERTIFIED
```

The backend remains responsible for that transition.

---

# 9. F06 — Workflow / Evidence Details

Finally, the detailed audit surface:

```text
Workflow
Agents
State transitions
Evidence
Snapshots
Candidate
Comparison
Placement
Approvals
Certification gates
Runtime evidence
Browser evidence
Final gate
```

This becomes the operational traceability view.

---

# 10. Then Q-series

After F-series:

```text
Q01 Backend Integration Audit
Q02 Frontend Integration Audit
Q03 Golden E2E Certification Audit
Q04 Evidence/GitHub Packaging
```

The most important test becomes the complete journey:

```text
REQUESTED
 ↓
DISCOVERY
 ↓
BRIEF_READY
 ↓
AWAITING_GATE_1
 ↓
GUI_APPROVED
 ↓
CANDIDATE_REQUESTED
 ↓
CANDIDATE_RECEIVED
 ↓
CANDIDATE_AUDIT
 ↓
INTEGRATION_PLANNED
 ↓
AWAITING_IMPLEMENTATION_APPROVAL
 ↓
IMPLEMENTING
 ↓
IMPLEMENTED
 ↓
VERIFYING
 ↓
CERTIFICATION_READY
 ↓
AWAITING_GATE_2
 ↓
CERTIFIED
```

The frontend should be able to represent that **actual backend lifecycle**, not its own approximation.

---

## Bottom line

**Yes:** the F-series implementation should start **after W0–W7 have been implemented, tested, reviewed, and the backend contracts are frozen**.

And **yes**, I already gave the F-series responsibilities and implementation architecture. But I would **not yet consider that the final F-series coding prompt**. Once W7 is accepted, we should generate a separate **F-series master implementation prompt** with:

- exact files to inspect
- exact existing files to modify
- exact API contracts to consume
- exact routes
- exact React components
- exact removal of fixtures
- exact state mapping
- exact UI behavior
- exact tests
- exact acceptance criteria
- exact commit/evidence requirements

That prompt should be based on the **actual final W7 GitHub implementation**, not the pre-W7 assumptions. This avoids giving Gemini stale API/file instructions.

Yes. The important point is that **V1 does not become a special one-off implementation**. The architecture we finalized from the common I1/C1/D1 pattern is designed so that **Visual V1 follows the same lifecycle**.

Think of the final system as:

```text
You
 │
 ▼
Project LLM GUI
 │
 ▼
FastAPI Project AI
 │
 ├── Repository Intelligence
 ├── Engineering Contract
 ├── Candidate Intake
 ├── Canonical Comparison
 ├── Placement
 ├── Certification
 ├── Runtime Verification
 ├── Browser Verification
 └── Final Gate
 │
 ▼
Canonical Repository
 │
 ├── Block implementation
 ├── Schema
 ├── Renderer/version routing
 ├── Tutorial Composer registration
 └── Tests
 │
 ▼
Tutorial Composer
 │
 ▼
Tutorial runtime
 │
 ├── Theme / Brand
 ├── ILS passive telemetry
 ├── LSNB
 └── RSSB
```

The **W-series builds that control plane**.  
The **F-series exposes it in the browser**.

Let's walk through **Visual Block V1** from the moment you open Project LLM until a learner sees it.

---

# 1. You open Project LLM

Suppose you open:

```text
Project LLM
```

in the SkillHubCore Admin UI.

The Dashboard does **not** itself decide what V1 means.

It asks FastAPI for the current Project LLM state.

For example:

```text
Project LLM

Create Educational Block

Family:
[ Visual ▼ ]

Target Version:
[ V1 ▼ ]

Existing Versions:
  V1 — not yet implemented
  V2 — not yet implemented

Canonical References:
  I1
  C1
  D1

Status:
READY TO CREATE
```

This is one of the reasons we explicitly removed the old frontend logic such as:

```text
versions.length + 1
```

The version is an **explicit target**, not something the GUI guesses.

This is primarily what **W1/B04 + F01/F02** establish.

---

# 2. You select `Visual V1`

You choose:

```text
Family = Visual
Version = V1
```

The backend creates/binds a target:

```json
{
  "blockFamily": "visual",
  "targetVersion": "V1",
  "workflowId": "...",
  "repositorySnapshotId": "...",
  "canonicalReferences": [
    "I1",
    "C1",
    "D1"
  ]
}
```

Conceptually:

```text
Visual V1
    │
    ├── Family = Visual
    ├── Version = V1
    └── Workflow = W-xxxx
```

Now the entire workflow is permanently attached to **Visual/V1**.

That prevents a candidate accidentally being submitted as Visual V2 or another family.

This is **W1/B04 + W3/B05**.

---

# 3. Project LLM performs repository intelligence

This is where the architecture differs substantially from a generic AI coding assistant.

Project LLM doesn't say:

> "I think a Visual block probably needs these files."

Instead:

```text
TypeScript/Node Repository Discovery
                │
                ▼
       Repository Snapshot
                │
                ▼
       Repository Contract
                │
                ▼
       Python/FastAPI Project AI
```

The Python service **does not independently crawl the repository**.

It consumes the authoritative TypeScript/Node repository snapshot.

This was an explicit M2.9 rule.

---

# 4. It studies I1, C1 and D1

Project LLM now asks:

> What does a production-quality block actually need to participate in this platform?

From the common architecture we've established, the reference pattern includes things such as:

### Component

Something equivalent to:

```text
packages/ui/src/tutorial/blocks/...
```

### Version enforcement

The renderer must know:

```text
visual → V1
```

and reject unsupported versions.

### DOM identity

The block needs the UBRC-style identity:

```html
data-block-id="..."
data-block-type="visual"
data-block-version="V1"
```

### Schema

The authoring data needs a canonical schema.

### TutorialBlockRenderer

The central renderer must be able to dispatch:

```text
visual + V1
       ↓
VisualV1Block
```

### Tutorial Composer

The block must be authorable/selectable in Composer.

### Runtime

The block must participate in the common tutorial runtime.

### Theme

Visual styling comes from the runtime theme rather than hard-coded SUIA/RTH branding.

### ILS

The block participates **passively** through the common runtime identity/telemetry architecture.

### LSNB/RSSB

The block does **not** create navigation/progress itself.

Those are page-level consumers.

That common flow is exactly why we studied I1/C1/D1 instead of inventing an isolated Visual architecture.

---

# 5. Engineering Contract is generated

Now W2 becomes important.

Project LLM generates something conceptually like:

```text
VISUAL V1
ENGINEERING CONTRACT
────────────────────────────

Target
  Family: Visual
  Version: V1

Implementation artifacts
  ✓ React component
  ✓ authoring schema
  ✓ renderer registration/routing
  ✓ Composer registration
  ✓ tests

Runtime requirements
  ✓ TutorialBlockRenderer compatible
  ✓ UBRC identity
  ✓ passive runtime behaviour
  ✓ theme-driven styling
  ✓ no hard-coded brand

ILS
  ✓ passive participation
  ✗ no direct ILS API calls

LSNB
  ✗ block must not implement navigation

RSSB
  ✗ block must not implement progress/navigation

Composer
  ✓ authorable
  ✓ renderable

Acceptance
  ...
```

This is **not merely a prompt**.

It becomes a machine-readable engineering contract with a contract hash.

For example:

```text
Contract:
EC-Visual-V1-001

SHA-256:
abc123...
```

That contract follows the candidate through the rest of the workflow.

---

# 6. Gate 1

The browser now shows:

```text
Visual V1

Engineering Contract Ready

[ View Contract ]

Compliance:
✓ Runtime
✓ UBRC
✓ Theme
✓ Composer
✓ ILS
✓ LSNB/RSSB
✓ Tests
✓ Reference implementations

Human Approval Required

[ Approve ]
[ Reject ]
```

This is an important architectural boundary.

**Project AI can prepare the engineering contract.**

It does not silently grant human approval.

You click:

```text
APPROVE
```

Now:

```text
AWAITING_GATE_1
       ↓
GUI_APPROVED
```

---

# 7. External AI receives the contract

Now the External AI workflow starts.

It receives:

```text
Visual V1 Engineering Contract
+
Canonical references
+
Repository evidence
+
Acceptance criteria
+
Prohibited behaviours
```

The External AI first creates the prototype:

```text
HTML
CSS
JavaScript
JSON
```

not immediately a React/TypeScript implementation.

You review it.

The architecture intentionally keeps:

```text
Prototype
    ↓
Human approval
    ↓
React/TypeScript implementation
```

because the **visual design belongs to the human + External AI**, not to Project LLM.

Project LLM's job is to verify that the resulting implementation satisfies the platform contract.

---

# 8. External AI creates Visual V1 React implementation

After your approval, External AI produces something conceptually like:

```text
VisualV1Block.tsx

VisualV1AuthorContentSchema.ts

visual.registry.ts

renderer routing

tests
```

The exact paths are **not hard-coded in our architecture**.

Project LLM discovers the repository's actual canonical locations.

That is important because our audit found that the repository's actual naming doesn't always match assumptions such as:

```text
IntroductionI1Block.tsx
DefinitionD1Block.tsx
```

Therefore the system must discover the real canonical pattern.

---

# 9. Candidate is uploaded

You upload the External AI candidate into Project LLM.

F04 calls the real FastAPI endpoint.

The server:

```text
receive candidate
      ↓
calculate SHA-256
      ↓
inspect files
      ↓
bind candidate → Visual V1
      ↓
classify artifacts
```

For example:

```text
Candidate C-1042

Target:
Visual V1

Candidate hash:
8a72...

Files:
  VisualV1Block.tsx
  VisualV1AuthorContentSchema.ts
  visual.registry.ts
  tests/VisualV1.test.tsx
```

This is where **W3/B05** matters.

The frontend isn't allowed to say:

```text
"Upload successful"
```

just because a file picker succeeded.

The **server** determines whether the candidate actually belongs to Visual V1.

---

# 10. Canonical comparison

Now Agent 7 becomes extremely important.

Earlier we found that the coordinator had a **stub** for this. W3/B06 is specifically intended to replace that with the real canonical comparator.

It compares:

```text
Candidate
     VS
Canonical repository pattern
```

For example:

```text
VISUAL V1 COMPARISON

Target binding
✓ Visual / V1

Component
✓ found

Schema
✓ found

Renderer routing
✓ found

Composer registration
✓ found

UBRC
✓ found

Theme
✓ found

ILS
✓ passive

LSNB
✓ absent from block

RSSB
✓ absent from block

Brand hard-coding
✓ none

Tests
✓ found
```

But if the candidate contains:

```typescript
import { ILSProvider } from ...
```

inside the block itself, comparison/validation should flag it.

Something like:

```text
FAIL

Prohibited direct ILS integration detected.

Expected:
Passive runtime participation.

Actual:
Direct ILS dependency in VisualV1Block.tsx
```

That candidate cannot simply be certified.

---

# 11. Placement Manifest

Suppose everything is structurally acceptable.

Project LLM doesn't immediately copy the files.

It produces a placement plan:

```text
VISUAL V1 PLACEMENT MANIFEST

ADD
  packages/ui/src/tutorial/blocks/VisualV1Block.tsx

ADD
  packages/types/src/tutorial/VisualV1AuthorContentSchema.ts

UPDATE
  packages/ui/src/tutorial/TutorialBlockRenderer.tsx

ADD/UPDATE
  Tutorial Composer Visual registry

ADD
  Visual V1 tests

Target:
Visual V1
```

Each operation is explicit.

This is **W3/B07**.

---

# 12. Human implementation approval

Before repository mutation:

```text
Placement Plan

5 operations
3 ADD
2 UPDATE

Target:
Visual V1

Candidate hash:
8a72...

Contract hash:
abc123...

[ Approve Implementation ]
[ Reject ]
```

You approve.

Now the system verifies that the approval corresponds to the exact candidate/contract/manifest.

This prevents:

```text
approved candidate A
        ↓
agent secretly swaps
        ↓
candidate B gets installed
```

---

# 13. Safe placement

W5 performs the actual repository operation.

The architecture we finalized is:

```text
Human approval
      ↓
Path allowlist
      ↓
RepositoryAdapter
      ↓
Isolated worktree
      ↓
Dry-run
      ↓
Placement
      ↓
Snapshot
```

Not:

```text
AI → arbitrary shell → repository
```

This is one of the most important safety properties of the architecture.

---

# 14. Now Visual V1 becomes a real repository block

After placement, the repository should conceptually contain the complete integration:

```text
Visual V1
│
├── React implementation
├── Authoring schema
├── Version routing
├── TutorialBlockRenderer integration
├── Composer registration
├── UBRC
├── Tests
└── Runtime compatibility
```

This is where your original question about **"how does it become part of Tutorial Composer?"** is answered.

It is not enough to create:

```text
VisualV1Block.tsx
```

The integration must establish the complete chain:

```text
Composer
   ↓
Tutorial document
   ↓
block type = visual
version = V1
   ↓
TutorialBlockRenderer
   ↓
VisualV1Block
```

---

# 15. Certification begins

W6 now runs the real verification chain.

Not:

```text
gate = PASS
```

which is what our earlier audit found in the certification coordinator.

Instead:

```text
Visual V1 Certification
────────────────────────────

Contract              PASS
UBRC                  PASS
Registry              PASS
Renderer              PASS
Composer              PASS
Tests                 PASS
Runtime               PASS
Browser               PASS
Brand                 PASS
Theme                 PASS
Dependency            PASS
```

Each result must have evidence.

For example:

```text
Gate: Composer
Status: PASS
Evidence:
  registry discovery
  renderer resolution
  Composer render test
```

---

# 16. Runtime verification

Now Project LLM actually renders the block through the real tutorial runtime.

Conceptually:

```text
TutorialDocument
      ↓
TutorialBlockRenderer
      ↓
Visual V1
      ↓
ActiveBlockContext
      ↓
ILSProvider
```

The important architectural distinction is:

### Visual V1 does NOT do this:

```text
VisualV1Block
   ↓
ILS API
```

Instead:

```text
VisualV1Block
   ↓
data-block-id
data-block-type
data-block-version
   ↓
ActiveBlockContext
   ↓
ILSProvider
```

That is consistent with the I1/C1/D1 runtime pattern we established.

---

# 17. LSNB and RSSB

Now suppose your tutorial page is:

```text
/tutorials/react-basics
```

The page-level architecture handles:

```text
TutorialPageShell
       │
       ├── LSNB
       ├── RSSB
       │
       └── Tutorial content
              │
              ├── I1
              ├── C1
              ├── Visual V1
              └── D1
```

Visual V1 does **not** suddenly create its own:

```text
Next
Previous
Progress
Lesson navigation
```

That is exactly the common architecture we extracted from I1/C1/D1.

---

# 18. Browser verification

W6's browser verification then opens the actual UI.

It checks things such as:

```text
Visual V1 rendered
✓

data-block-id
✓

data-block-type="visual"
✓

data-block-version="V1"
✓

Expected theme applied
✓

Composer rendering
✓

No broken layout
✓

No runtime exception
✓
```

And potentially the ILS/active-block chain:

```text
Visual V1 enters viewport
       ↓
ActiveBlockContext identifies it
       ↓
ILS receives active block identity
```

---

# 19. Brand independence

Now imagine the exact same Visual V1 appears in:

```text
SUIA
```

and:

```text
RTH
```

The block should not contain:

```text
if (brand === "SUIA") ...
```

or:

```text
#SUIA-specific-color
```

Instead:

```text
Visual V1
   +
runtime theme
   ↓
SUIA appearance
```

and:

```text
Visual V1
   +
RTH theme
   ↓
RTH appearance
```

So the canonical implementation remains the same.

This is exactly the principle we found in the D1 implementation:

> canonical block implementation; theme supplies brand-specific visual values.

---

# 20. Final Gate

After all evidence exists:

```text
W7 Final Gate
```

aggregates everything.

Conceptually:

```text
Contract             PASS
Candidate             PASS
Comparison            PASS
Placement             PASS
Snapshot              PASS
Composer              PASS
Runtime               PASS
Browser               PASS
Theme                 PASS
Brand                 PASS
Evidence              PASS
```

Then:

```text
CERTIFICATION_READY
```

**not yet CERTIFIED.**

---

# 21. Gate 2 — your final approval

The final human approval is separate.

You see:

```text
Visual V1

Certification Ready

All required gates passed.

Evidence:
  42 items

Snapshot:
  SHA-256 ...

Candidate:
  SHA-256 ...

Repository:
  commit ...

[ CERTIFY ]
[ REJECT ]
```

You click:

```text
CERTIFY
```

Only then:

```text
AWAITING_GATE_2
        ↓
CERTIFIED
```

---

# 22. Then Tutorial Composer sees Visual V1

Now the Composer can expose:

```text
Add Block

Introduction
Code
Definition
Visual V1   ← NEW
```

You select:

```text
Visual V1
```

Composer creates the appropriate block data according to its schema.

For example conceptually:

```json
{
  "type": "visual",
  "version": "V1",
  "id": "visual-001",
  "content": {
    ...
  }
}
```

The Composer doesn't need to know how Project LLM created it.

It only needs the canonical Composer integration.

---

# 23. Learner runtime

Finally:

```text
Tutorial Composer
       ↓
Published TutorialDocument
       ↓
TutorialPageShell
       ↓
TutorialBlockRenderer
       ↓
Visual V1
```

At runtime:

```text
Visual V1
 ├── receives theme
 ├── receives runtime context
 ├── renders UBRC identity
 └── remains passive
          ↓
ActiveBlockContext
          ↓
ILSProvider
```

while:

```text
TutorialPageShell
 ├── LSNB
 └── RSSB
```

remain page-level.

---

# 24. What every W/F wave contributes

So if we compress the whole architecture:

| Wave | What it contributes to Visual V1 |
|---|---|
| **W0** | Establishes one canonical workflow authority |
| **W1** | Knows exactly what Visual/V1 means and where repository evidence comes from |
| **W2** | Creates the machine-readable Visual V1 Engineering Contract |
| **W3** | Accepts, binds, compares and prepares Visual V1 for placement |
| **W4** | Requires human approval before implementation mutation |
| **W5** | Safely places Visual V1 into canonical repository locations |
| **W6** | Actually verifies Composer, renderer, runtime, browser, theme, brand, etc. |
| **W7** | Aggregates evidence and controls final certification |
| **F01** | Connects browser UI to those real backend contracts |
| **F02** | Lets you select Visual V1 and inspect/approve its contract |
| **F03** | Shows the External AI handoff |
| **F04** | Lets you upload the actual candidate |
| **F05** | Shows integration/certification and human gates |
| **F06** | Shows the complete workflow/evidence trail |
| **Q-series** | Proves the entire chain actually works |

---

# 25. The most important architectural point

The system is **not**:

```text
Project LLM
   ↓
"Generate Visual V1"
   ↓
Create React file
   ↓
Done
```

It is:

```text
                 PROJECT LLM

User
 ↓
Select Visual V1
 ↓
Repository Intelligence
 ↓
Engineering Contract
 ↓
Human Gate 1
 ↓
External AI
 ↓
Candidate
 ↓
Server-side Intake
 ↓
Canonical Comparison
 ↓
Placement Manifest
 ↓
Human Implementation Approval
 ↓
Safe Placement
 ↓
Snapshot
 ↓
Composer Verification
 ↓
Renderer Verification
 ↓
Runtime Verification
 ↓
Browser Verification
 ↓
ILS Verification
 ↓
Theme Verification
 ↓
Brand Verification
 ↓
Evidence Aggregation
 ↓
CERTIFICATION_READY
 ↓
Human Gate 2
 ↓
CERTIFIED
        │
        ▼
   TUTORIAL COMPOSER
        │
        ▼
   TUTORIAL RUNTIME
        │
        ├── Visual V1
        ├── ILS
        ├── LSNB
        ├── RSSB
        └── Theme/Brand
        │
        ▼
      LEARNER
```

**That is the architecture the W-series + F-series are implementing.**

And the crucial thing is that **Visual V1 is only an example**. Once this pipeline is genuinely working, the same control plane can handle another family/version without creating another bespoke Project AI workflow. The family-specific part is the **engineering contract and discovered canonical implementation pattern**; the governance, candidate, evidence, approval, placement, certification, runtime and final-gate machinery remains common.

Yes. Your understanding is correct.

We should **not ask Project AI to redo things that are already correctly implemented**. We should give it a **controlled remediation plan**: verify each item first, modify only what fails, preserve correct implementation, and produce machine-readable evidence and test logs. The previous successful Playwright E2E should be used as a **reference/golden pattern only where the current implementation deviates from it**.

Below is the implementation plan I recommend.

---

# 1. M2.9 should now be divided into controlled agent waves

Do **not** let 20 agents independently modify the same architecture.

Use:

```text
                    M2.9 REMEDIATION
                           │
                           ▼
                    W0 Architecture
                           │
                    HARD REVIEW GATE
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
          W1-A           W1-B           W1-C
       Repository       Workflow       Legacy
       Intelligence     Authority      Cleanup
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                    HARD REVIEW GATE
                           │
                           ▼
                       W2 Contract
                           │
                    HARD REVIEW GATE
                           │
                           ▼
                  W3 Candidate Pipeline
                    ┌──────┼──────┐
                    ▼      ▼      ▼
                   B05    B06    B07*
                                  ↑
                                  │ depends on B06
                           │
                    HARD REVIEW GATE
                           │
                           ▼
                  W4 Approval + Placement
                           │
                           ▼
                  W5 Verification
              ┌────────┬────┼────┬────────┐
              ▼        ▼    ▼    ▼        ▼
           Cert      Runtime Browser Composer Evidence
              │        │    │    │        │
              └────────┴────┼────┴────────┘
                           ▼
                    W6 Final Gate
                           │
                           ▼
                 Golden Playwright E2E
                           │
                    HARD REVIEW GATE
                           │
                           ▼
                   Frontend F-series
```

The `*` is important: **B07 must consume B06 output**, so B05/B06 can run in parallel, but B07 cannot safely run independently of B06.

---

# 2. First instruction to Project AI: do not rewrite correct work

Give every agent this common rule.

```text
M2.9 REMEDIATION GLOBAL RULE

This is a remediation and verification phase, not a greenfield rewrite.

Before changing any file:

1. Inspect the current implementation on m2-project-ai-canonical-wiring.
2. Determine whether the requested requirement is already correctly implemented.
3. If correct:
   - DO NOT rewrite it.
   - Preserve the implementation.
   - Add verification/evidence only if required.
4. If partially correct:
   - Make the smallest architectural correction required.
5. If incorrect:
   - Correct it according to the canonical M2.9 architecture.
6. If an existing canonical file already serves the required purpose:
   - UPDATE/EXTEND it.
   - Do not create another competing file.
7. Do not create duplicate workflow engines.
8. Do not create duplicate evidence systems.
9. Do not weaken tests merely to obtain PASS.
10. Never fabricate PASS evidence.
11. Missing/unavailable evidence = BLOCKED.
12. Every agent must produce:
   - changed files
   - unchanged-but-verified files
   - tests executed
   - exact test counts
   - failures
   - evidence IDs
   - before SHA
   - after SHA
   - architecture decision
   - remaining blockers.
```

This should be included in the **master prompt**, not repeated manually for every agent.

---

# 3. Agent ownership

I recommend **15 implementation agents + 5 verification agents**, but they should execute in controlled waves.

## Backend agents

| Agent | Responsibility | Parallel? |
|---|---|---|
| B01 | Canonical workflow authority | Sequential |
| B02 | Repository Intelligence boundary | Parallel after B01 |
| B03 | Target/version binding | Parallel after B01 |
| B04 | Legacy workflow/Mix & Match cleanup | Parallel after B01 |
| B05 | Evidence harness | Parallel after B01 |
| B06 | Engineering Contract | Sequential after B02+B03 |
| B07 | Candidate intake | Parallel |
| B08 | Canonical comparator | Parallel |
| B09 | Placement manifest | After B08 |
| B10 | Human approval | After B09 |
| B11 | Safe placement/RepositoryAdapter | After B10 |
| B12 | Certification | Parallel after placement |
| B13 | Runtime verification | Parallel after placement |
| B14 | Browser/Playwright verification | Parallel after placement |
| B15 | Final gate | Sequential after B12-B14 |

Then:

| Verification agent | Responsibility |
|---|---|
| Q01 | Backend architecture audit |
| Q02 | Evidence/test audit |
| Q03 | Golden Playwright E2E |
| Q04 | Frontend/backend contract audit |
| Q05 | Final GitHub certification audit |

---

# 4. W0 — B01: freeze the canonical workflow

This must be **sequential**.

### Objective

Make this the only workflow lifecycle:

```python
class CanonicalWorkflowState(str, Enum):
    REQUESTED = "REQUESTED"
    DISCOVERY = "DISCOVERY"
    BRIEF_READY = "BRIEF_READY"
    AWAITING_GATE_1 = "AWAITING_GATE_1"
    GUI_APPROVED = "GUI_APPROVED"
    CANDIDATE_REQUESTED = "CANDIDATE_REQUESTED"
    CANDIDATE_RECEIVED = "CANDIDATE_RECEIVED"
    CANDIDATE_AUDIT = "CANDIDATE_AUDIT"
    INTEGRATION_PLANNED = "INTEGRATION_PLANNED"
    AWAITING_IMPLEMENTATION_APPROVAL = "AWAITING_IMPLEMENTATION_APPROVAL"
    IMPLEMENTING = "IMPLEMENTING"
    IMPLEMENTED = "IMPLEMENTED"
    VERIFYING = "VERIFYING"
    CERTIFICATION_READY = "CERTIFICATION_READY"
    AWAITING_GATE_2 = "AWAITING_GATE_2"
    CERTIFIED = "CERTIFIED"
    REJECTED = "REJECTED"
```

And enforce transitions.

Example:

```python
ALLOWED_TRANSITIONS = {
    CanonicalWorkflowState.REQUESTED: {
        CanonicalWorkflowState.DISCOVERY,
    },
    CanonicalWorkflowState.DISCOVERY: {
        CanonicalWorkflowState.BRIEF_READY,
    },
    CanonicalWorkflowState.BRIEF_READY: {
        CanonicalWorkflowState.AWAITING_GATE_1,
    },
    CanonicalWorkflowState.AWAITING_GATE_1: {
        CanonicalWorkflowState.GUI_APPROVED,
        CanonicalWorkflowState.REJECTED,
    },
    CanonicalWorkflowState.GUI_APPROVED: {
        CanonicalWorkflowState.CANDIDATE_REQUESTED,
    },
    CanonicalWorkflowState.CANDIDATE_REQUESTED: {
        CanonicalWorkflowState.CANDIDATE_RECEIVED,
    },
    CanonicalWorkflowState.CANDIDATE_RECEIVED: {
        CanonicalWorkflowState.CANDIDATE_AUDIT,
    },
    CanonicalWorkflowState.CANDIDATE_AUDIT: {
        CanonicalWorkflowState.INTEGRATION_PLANNED,
        CanonicalWorkflowState.REJECTED,
    },
    CanonicalWorkflowState.INTEGRATION_PLANNED: {
        CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL,
    },
    CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL: {
        CanonicalWorkflowState.IMPLEMENTING,
        CanonicalWorkflowState.REJECTED,
    },
    CanonicalWorkflowState.IMPLEMENTING: {
        CanonicalWorkflowState.IMPLEMENTED,
    },
    CanonicalWorkflowState.IMPLEMENTED: {
        CanonicalWorkflowState.VERIFYING,
    },
    CanonicalWorkflowState.VERIFYING: {
        CanonicalWorkflowState.CERTIFICATION_READY,
        CanonicalWorkflowState.REJECTED,
    },
    CanonicalWorkflowState.CERTIFICATION_READY: {
        CanonicalWorkflowState.AWAITING_GATE_2,
    },
    CanonicalWorkflowState.AWAITING_GATE_2: {
        CanonicalWorkflowState.CERTIFIED,
        CanonicalWorkflowState.REJECTED,
    },
}
```

### Critical rule

`CERTIFICATION_READY` must **never automatically become `CERTIFIED`**.

---

# 5. W1-A — B02 Repository Intelligence

This is one of the highest-priority corrections.

### Wrong

```python
Path(repo_root)
open(...)
hash(...)
```

inside Python repository intelligence.

### Correct

```text
TS discovery
     ↓
snapshot.json
     ↓
Python DiscoveryClient
     ↓
RepositoryBlockContract
```

Python should consume something like:

```python
class RepositoryEvidence(BaseModel):
    path: str
    sha256: str
    role: str
    evidence_id: str
```

Then:

```python
def build_contract_from_snapshot(
    snapshot: RepositorySnapshot,
    family: str,
    version: str,
) -> RepositoryBlockContract:

    candidates = [
        b for b in snapshot.blocks
        if b.family == family
    ]

    target = next(
        (
            b for b in candidates
            if b.version == version
        ),
        None,
    )

    if target is None:
        raise ContractBlocked(
            f"No repository evidence for {family}/{version}"
        )

    return RepositoryBlockContract(
        family=family,
        version=version,
        block_type=target.block_type,
        references=target.references,
        runtime=target.runtime,
        renderer_contract=target.renderer_contract,
        composer_contract=target.composer_contract,
        schema_contract=target.schema_contract,
    )
```

### Remove

```python
repo_path = Path(repo_root)
```

from the Python intelligence layer.

### Important

The TS scanner remains responsible for filesystem access.

---

# 6. W1-B — B03 target/version binding

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

Candidate:

```python
class CandidateBinding(BaseModel):
    workflow_id: str
    target_family: str
    target_version: str
    specification_id: str
    contract_hash: str
```

Then **every downstream artifact must retain this binding**.

For example:

```python
class PlacementManifest(BaseModel):
    workflow_id: str
    candidate_id: str
    target_family: str
    target_version: str
    contract_hash: str
    ...
```

Then absolutely remove:

```python
blockVersion="1.0.0"
```

and:

```python
"blockVersion": "1.0.0"
```

Replace with:

```python
blockVersion=target.version
```

and validate:

```python
if manifest.blockVersion != target.version:
    raise HTTPException(
        status_code=409,
        detail="Placement target version does not match workflow target"
    )
```

---

# 7. W1-C — B04 legacy workflow cleanup

Do **not** simply rename `CreationMode`.

Remove it as an executable workflow concept.

Instead, if origin metadata is needed:

```python
class DesignSource(str, Enum):
    REPOSITORY_CANONICAL = "REPOSITORY_CANONICAL"
    EXTERNAL_AI_PROTOTYPE = "EXTERNAL_AI_PROTOTYPE"
    USER_SPECIFICATION = "USER_SPECIFICATION"
```

Then:

```python
WorkflowTarget
    +
DesignSource
    +
CanonicalWorkflowState
```

not:

```text
CreationMode
    ↓
another workflow
```

The old:

```text
/creation/workflows
```

must either:

1. become a compatibility adapter into the canonical workflow, or
2. be removed.

It must not maintain:

```text
CREATED
VALIDATING
CERTIFYING
CERTIFIED
```

as a separate lifecycle.

---

# 8. W1-D — Evidence harness

Use one canonical evidence root.

I recommend:

```text
.agents/evidence/runs/
```

Structure:

```text
.agents/
├── evidence/
│   └── runs/
│       └── <run-id>/
│           ├── manifest.json
│           ├── discovery.json
│           ├── contract.json
│           ├── candidate.json
│           ├── comparison.json
│           ├── placement.json
│           ├── approvals.json
│           ├── gates.json
│           ├── runtime.json
│           ├── browser.json
│           ├── final-verdict.json
│           ├── test-results.json
│           └── timeline.jsonl
```

Do **not** create another evidence directory if an existing canonical artifact can be extended.

---

# 9. Evidence manifest

Every run should have:

```json
{
  "runId": "m29-20261007-001",
  "workflowId": "wf-...",
  "branch": "m2-project-ai-canonical-wiring",
  "commitBefore": "...",
  "commitAfter": "...",
  "snapshotId": "...",
  "snapshotHash": "...",
  "contractHash": "...",
  "startedAt": "...",
  "completedAt": "...",
  "status": "PASS",
  "agents": [],
  "tests": {},
  "evidenceIds": []
}
```

---

# 10. Every agent must produce an execution record

Example:

```json
{
  "agentId": "B02",
  "wave": "W1",
  "status": "PASS",
  "commitBefore": "abc123",
  "commitAfter": "def456",
  "changedFiles": [
    "services/project-ai/app/contracts/repository_intelligence.py"
  ],
  "verifiedFiles": [
    "services/project-ai/app/repository/discovery_client.py"
  ],
  "tests": {
    "passed": 18,
    "failed": 0,
    "skipped": 1
  },
  "evidenceIds": [
    "ev-..."
  ],
  "blockers": []
}
```

This is extremely useful because after the branch is pushed I can cross-check the **claims against actual GitHub changes**.

---

# 11. W2 — Engineering Contract

This must run **after B02 + B03**.

The contract generator should consume:

```python
snapshot
target
repository_contract
```

and generate:

```python
contract = EngineeringContract(
    contract_id=...,
    workflow_id=...,
    target=target,
    repository_snapshot_id=snapshot.id,
    repository_snapshot_sha256=snapshot.hash,
    canonical_references=repository_contract.references,
    ...
)
```

Then:

```python
contract.contract_hash = calculate_contract_hash(contract)
```

Never allow External AI to modify the contract.

---

# 12. Contract hash must propagate

The chain becomes:

```text
WorkflowTarget
      ↓
RepositoryContract
      ↓
EngineeringContract
      ↓
contractHash
      ↓
CandidateBinding
      ↓
PlacementManifest
      ↓
Approval
      ↓
Placement
      ↓
Certification
```

At every step:

```python
if supplied_contract_hash != expected_contract_hash:
    BLOCK
```

This prevents:

```text
contract A
   ↓
candidate built from contract A
   ↓
workflow silently changes to contract B
```

---

# 13. W3 — Candidate Intake

B07 can run independently once the contract and target models are stable.

The preferred API should support real multipart upload:

```python
@router.post(
    "/workflows/{workflow_id}/candidates",
)
async def upload_candidate(
    workflow_id: str,
    file: UploadFile,
):
    ...
```

Server calculates:

```python
sha256 = hashlib.sha256()
```

while reading:

```python
while chunk := await file.read(1024 * 1024):
    sha256.update(chunk)
```

Never trust:

```text
clientHash
```

as authoritative.

---

# 14. Candidate path validation

Reject:

```text
../../
..\..
absolute paths
symlinks
unexpected extensions
```

Example:

```python
def validate_candidate_path(path: str) -> None:
    p = PurePosixPath(path)

    if p.is_absolute():
        raise CandidateBlocked("Absolute path")

    if ".." in p.parts:
        raise CandidateBlocked("Path traversal")

    allowed = {
        ".tsx",
        ".ts",
        ".css",
        ".scss",
        ".json",
        ".html",
        ".js",
    }

    if p.suffix not in allowed:
        raise CandidateBlocked(
            f"Unsupported extension: {p.suffix}"
        )
```

---

# 15. W3 — Canonical comparison

B08 should use the already existing `CanonicalComparator` **if it is correct**.

Do not replace it unnecessarily.

It should produce:

```python
class ComparisonResult(BaseModel):
    workflow_id: str
    candidate_id: str

    status: Literal[
        "PASS",
        "FAIL",
        "BLOCKED",
    ]

    target_match: bool

    best_canonical_reference: str | None

    missing_requirements: list[str]
    unexpected_artifacts: list[str]
    conflicts: list[str]

    evidence_ids: list[str]
```

Crucially:

```python
if candidate.version != target.version:
    return ComparisonResult(
        status="FAIL",
        target_match=False,
        ...
    )
```

Do not classify:

```text
Visual V1
```

as merely:

```text
Visual
```

and lose the version.

---

# 16. W3 — Placement manifest

B09 should depend on B08.

The manifest must be deterministic:

```python
manifest = PlacementManifest(
    workflow_id=workflow_id,
    candidate_id=candidate.id,
    target_family=target.family,
    target_version=target.version,
    contract_hash=contract.contract_hash,
    decision=decision,
    target_path=approved_target_path,
    evidence_ids=evidence_ids,
)
```

Then hash it:

```python
payload = manifest.model_dump(
    exclude={"manifest_hash"},
)

manifest.manifest_hash = hashlib.sha256(
    canonical_json(payload).encode()
).hexdigest()
```

---

# 17. Placement must NOT infer arbitrary destination

This remains critical.

The sequence should be:

```text
Candidate
   ↓
Canonical comparison
   ↓
Placement proposal
   ↓
Human approval
   ↓
RepositoryAdapter
   ↓
isolated worktree
   ↓
dry-run
   ↓
placement
```

Not:

```text
Candidate
   ↓
Python guesses path
   ↓
writes repository
```

---

# 18. W4 — Human approval

The approval must bind:

```text
workflowId
candidateId
manifestHash
contractHash
targetVersion
approverId
timestamp
```

Example:

```python
class ImplementationApproval(BaseModel):
    workflow_id: str
    candidate_id: str
    manifest_hash: str
    contract_hash: str
    target_version: str
    approved_by: str
    approved_at: datetime
```

Reject self-approval where applicable.

Then executor verifies:

```python
if approval.manifest_hash != manifest.manifest_hash:
    raise ApprovalMismatch(...)
```

---

# 19. W5 — RepositoryAdapter

This is important because the current executor directly invokes Git commands.

The intended boundary is:

```python
class RepositoryAdapter(Protocol):

    def create_worktree(...): ...

    def write_files(...): ...

    def dry_run(...): ...

    def stage(...): ...

    def commit(...): ...

    def snapshot(...): ...
```

Then:

```text
PlacementExecutor
       ↓
RepositoryAdapter
       ↓
approved repository operation
```

This keeps arbitrary shell execution out of the orchestration layer.

---

# 20. W6 — Certification

The current `CertificationGateExecutor` is a useful existing implementation.

**Do not rewrite it if it already passes the required tests.**

Instead verify that the canonical coordinator actually calls it.

Required gates:

```text
UBRC
Brand
Theme
Registry
Renderer
Composer
Runtime
Browser
Evidence
Manifest
```

Every gate returns:

```text
PASS
FAIL
BLOCKED
```

Never:

```text
UNKNOWN → PASS
```

---

# 21. Very important: fix browser PASS fallback

This code pattern must be removed:

```python
return RuntimeVerification(
    ...
    passed=True,
)
```

when Playwright wasn't actually executed.

Replace it with:

```python
return RuntimeVerification(
    ...
    passed=False,
    error_code=RuntimeErrorCode.BROWSER_VERIFICATION_UNAVAILABLE,
    error_message="Playwright execution unavailable",
)
```

and the certification adapter maps this to:

```text
BLOCKED
```

not PASS.

---

# 22. Reuse the previous successful Playwright E2E correctly

Yes — **your interpretation is exactly right**.

If Project AI has already implemented the same correct Playwright pattern, **do not tell it to recreate it**.

Instead:

```text
Previous successful E2E
        ↓
reference implementation
        ↓
compare current implementation
        ↓
if identical/correct → preserve
if missing → implement
if partially wrong → patch
```

The previous successful Playwright run should be treated as a **golden reference**, not blindly copied.

---

# 23. What I would tell Project AI about the old successful E2E

Use this instruction:

```text
PLAYWRIGHT GOLDEN REFERENCE RULE

A previous Project LLM Playwright E2E run successfully demonstrated
the repository's established browser-testing approach.

Before implementing or modifying browser verification:

1. Locate the existing successful Playwright test/spec.
2. Inspect:
   - test location
   - Playwright configuration
   - browser launch
   - application startup
   - route navigation
   - DOM selectors
   - data-block-id
   - data-block-type
   - data-block-version
   - console error capture
   - network failure capture
   - screenshot/evidence handling
   - JSON reporter output
   - cleanup
3. Compare the current M2.9 BrowserVerification implementation against it.
4. If the existing implementation already performs the required verification:
   DO NOT recreate it.
   Reuse/extend it.
5. If the current implementation only wraps or references Playwright without
   actually executing the established test path:
   wire the existing successful Playwright test into the canonical
   BrowserVerification agent.
6. Do not create a second browser-testing framework.
7. Do not create a second Playwright configuration.
8. Do not create duplicate E2E tests if an existing canonical test can be extended.
9. If the existing test does not cover the new target/version, extend it
   parametrically rather than creating a parallel browser stack.
10. Browser verification must return BLOCKED when execution/evidence is unavailable.
11. Browser verification must never return PASS merely because the Playwright
    package or test runner exists.
```

That's the correct way to reference it.

---

# 24. W6 runtime verification

B13 should verify:

```text
application starts
        ↓
health
        ↓
Tutorial page
        ↓
block exists
        ↓
data-block-id
data-block-type
data-block-version
        ↓
renderer dispatch
        ↓
theme
        ↓
runtime context
```

ILS verification should follow the actual repository architecture we established:

```text
Block
  ↓
UBRC DOM identity
  ↓
ActiveBlockContext
  ↓
ILSProvider
  ↓
telemetry
```

The block itself must **not** import ILS APIs.

---

# 25. LSNB/RSSB verification

The Project AI model must not instruct External AI to create:

```text
LSNB inside block
RSSB inside block
```

The contract should say:

```text
LSNB = page-level consumer
RSSB = page-level consumer
```

The block must simply coexist correctly with the page shell.

---

# 26. Brand/theme verification

Verify at least:

```text
SUIA theme
RTH theme
light theme
dark theme
```

But do **not** hard-code either brand.

The test should look conceptually like:

```python
assert "SUIA" not in component_source
assert "RTH" not in component_source
```

and runtime:

```text
same block
    +
SUIA theme
    → renders

same block
    +
RTH theme
    → renders
```

The component should consume:

```typescript
theme.primary
theme.secondary
```

or the actual repository-defined theme contract.

---

# 27. W6 evidence binding

Every gate must return evidence.

For example:

```json
{
  "gateId": "UBRC",
  "status": "PASS",
  "evidenceIds": [
    "ev-123",
    "ev-456"
  ],
  "commitSha": "...",
  "snapshotHash": "..."
}
```

A PASS without evidence is invalid.

The final gate should enforce:

```python
if gate.status == "PASS" and not gate.evidence_ids:
    return BLOCKED
```

---

# 28. W7 Final Gate

The final gate should implement exactly:

```python
if missing_evidence:
    return BLOCKED

if any_fail:
    return FAIL

if any_blocked:
    return BLOCKED

return CERTIFICATION_READY
```

Never:

```python
return CERTIFIED
```

The final human approval endpoint performs:

```text
CERTIFICATION_READY
       ↓
AWAITING_GATE_2
       ↓
human approval
       ↓
CERTIFIED
```

---

# 29. Golden E2E test

The final test should exercise the **entire architecture**:

```text
REQUESTED
 ↓
DISCOVERY
 ↓
BRIEF_READY
 ↓
AWAITING_GATE_1
 ↓
GUI_APPROVED
 ↓
CANDIDATE_REQUESTED
 ↓
CANDIDATE_RECEIVED
 ↓
CANDIDATE_AUDIT
 ↓
INTEGRATION_PLANNED
 ↓
AWAITING_IMPLEMENTATION_APPROVAL
 ↓
IMPLEMENTING
 ↓
IMPLEMENTED
 ↓
VERIFYING
 ↓
CERTIFICATION_READY
 ↓
AWAITING_GATE_2
 ↓
CERTIFIED
```

And the test must assert every transition.

---

# 30. Example E2E assertions

```python
assert workflow.state == REQUESTED

await workflow.discover()

assert workflow.state == DISCOVERY

await workflow.generate_contract()

assert workflow.state == BRIEF_READY

await workflow.request_gate_1()

assert workflow.state == AWAITING_GATE_1

await workflow.approve_gui()

assert workflow.state == GUI_APPROVED
```

Then:

```python
candidate = await upload_candidate(
    workflow_id=workflow.id,
    file="visual-v1.zip",
)

assert candidate.target_version == "V1"
assert candidate.contract_hash == contract.contract_hash
```

Then:

```python
comparison = await compare(candidate)

assert comparison.target_match is True
assert comparison.status == "PASS"
```

Then:

```python
manifest = await generate_manifest(candidate)

assert manifest.target_version == "V1"
assert manifest.contract_hash == contract.contract_hash
```

Then:

```python
await approve_manifest(manifest)

assert workflow.state == IMPLEMENTING
```

Then:

```python
await placement()

assert workflow.state == IMPLEMENTED
```

Then:

```python
verification = await verify()

assert verification.runtime.status == "PASS"
assert verification.browser.status == "PASS"
```

Then:

```python
assert workflow.state == CERTIFICATION_READY
```

Then:

```python
await final_human_approval()

assert workflow.state == CERTIFIED
```

---

# 31. Negative E2E tests are equally important

We need explicit tests for:

### Wrong version

```text
Target = V1
Candidate = V2

→ FAIL
```

### Missing Composer

```text
Composer evidence absent

→ BLOCKED
```

### Browser unavailable

```text
Playwright unavailable

→ BLOCKED
NOT PASS
```

### Missing evidence

```text
Gate PASS but evidence_ids=[]

→ BLOCKED
```

### Manifest tampering

```text
manifest hash changed

→ BLOCKED
```

### Contract tampering

```text
contract hash mismatch

→ BLOCKED
```

### Unauthorized placement

```text
no human approval

→ BLOCKED
```

### Brand violation

```text
hardcoded "SUIA"

→ FAIL
```

### ILS duplication

```text
component imports ILS API

→ FAIL
```

These tests protect the architecture.

---

# 32. Test logging

Every wave must execute tests and write machine-readable output.

Recommended:

```text
.agents/evidence/runs/<run-id>/
    test-results.json
    pytest-unit.json
    pytest-integration.json
    pytest-api.json
    pytest-e2e.json
    playwright.json
    typecheck.json
    lint.json
    discovery.json
```

Example:

```json
{
  "suite": "pytest-unit",
  "command": "pytest services/project-ai/tests/unit -q",
  "startedAt": "...",
  "finishedAt": "...",
  "exitCode": 0,
  "passed": 184,
  "failed": 0,
  "skipped": 3,
  "xfailed": 0
}
```

---

# 33. Never do this with the old 55 failures

Do **not** tell the agents:

> "Make the 55 failures become zero."

Instead:

```text
55 failures
   ↓
classify each
   ├── architecture defect
   ├── implementation bug
   ├── obsolete test
   ├── incorrect test expectation
   ├── environment/dependency
   └── legitimate blocker
```

Then fix each category correctly.

A test that expects the old architecture should be updated **only when the architecture itself has intentionally changed**.

Never:

```python
assert True
```

just to obtain green CI.

---

# 34. Exact wave schedule I recommend

## Wave 0

### Sequential

```text
B01
```

Deliver:

```text
canonical workflow
state transition tests
authority report
commit
```

Then **STOP**.

---

## Wave 1

### Parallel

```text
B02 Repository Intelligence
B03 Target Binding
B04 Legacy Cleanup
B05 Evidence Harness
```

They must not modify each other's files unnecessarily.

Then **STOP**.

I independently review GitHub.

---

## Wave 2

### Sequential

```text
B06 Engineering Contract
```

because it depends on B02+B03.

Then **STOP**.

---

## Wave 3

### Parallel

```text
B07 Candidate Intake
B08 Canonical Comparator
```

Then:

```text
B09 Placement Manifest
```

sequentially after B08.

Then **STOP**.

---

## Wave 4

### Sequential

```text
B10 Human Approval
B11 RepositoryAdapter / Safe Placement
```

Then **STOP**.

---

## Wave 5

### Parallel

```text
B12 Certification
B13 Runtime
B14 Browser
B15 Composer verification
```

All consume the stabilized placement/evidence contracts.

Then **STOP**.

---

## Wave 6

### Sequential

```text
Final Gate
```

Then:

```text
Golden E2E
```

Then **STOP**.

---

# 35. Q-series audit

Only after W6:

```text
Q01 Backend architecture audit
Q02 Evidence audit
Q03 Playwright E2E audit
```

These can run **in parallel** because they are read-only.

Then I perform the GitHub cross-check.

Only after that:

```text
Q04 frontend/backend contract audit
```

and then F-series.

---

# 36. F-series comes last

Only once backend is frozen:

```text
F01 API client
        ↓
F02 Create / Compliance Brief
F03 External AI Handoff
F04 Candidate Upload
F05 Integration / Certification
F06 Workflow Details
```

F02-F06 can then run in parallel after F01.

The frontend must consume:

```text
FastAPI
   ↓
canonical backend state
```

and must not create:

```text
localStorage workflow state
```

or:

```text
TS workflow coordinator
```

---

# 37. What Project AI must report after every agent

This is important for our future GitHub cross-check.

Every agent must finish with:

```markdown
## Agent Completion

Agent: B08
Wave: W3
Status: PASS

### Commit
Before: abc...
After: def...

### Changed Files
- ...

### Verified Existing Files
- ...

### Tests
Command:
...

Passed:
...
Failed:
...
Skipped:
...

### Evidence
- ev-...
- ev-...

### Architecture Decision
...

### Existing Implementation Preserved
...

### New Implementation
...

### Remaining Blockers
...

### Known Limitations
...
```

And the machine-readable equivalent:

```json
{
  "agent": "B08",
  "wave": "W3",
  "status": "PASS",
  "commitBefore": "...",
  "commitAfter": "...",
  "changedFiles": [],
  "verifiedFiles": [],
  "tests": {},
  "evidenceIds": [],
  "blockers": [],
  "limitations": []
}
```

---

# 38. The critical GitHub cross-check protocol

Once Project AI pushes the branch, **do not send me only its report**.

I will cross-check:

```text
Agent report
     +
GitHub commits
     +
changed files
     +
actual source
     +
test artifacts
     +
Playwright JSON
     +
evidence ledger
     +
workflow E2E
```

Then compare:

```text
CLAIMED
   vs
IMPLEMENTED
   vs
TESTED
   vs
EVIDENCED
```

That's much stronger than trusting the agent.

---

# 39. And yes: don't refer to the Playwright E2E unnecessarily

Your last question is important.

### If the current implementation is already correct:

**Do not tell Project AI to redo it.**

For example:

```text
Existing Playwright test
        ↓
verified against requirements
        ↓
correct
```

Then:

> Preserve existing implementation. Add only the missing integration/evidence if necessary.

### If the implementation is partially correct:

Tell it:

> Reuse the existing Playwright test/configuration and extend the existing canonical path.

### If it is wrong:

Then explicitly reference the successful previous E2E as the model:

> The existing successful Playwright E2E demonstrates the canonical browser verification pattern. Adapt the current implementation to use that established path rather than creating a second Playwright stack.

### If the old E2E itself is obsolete:

Then we don't blindly preserve it either.

We first verify it against current repository architecture.

So the decision tree is:

```text
Previous Playwright E2E
          │
          ▼
Is it still canonical?
     │             │
    YES            NO
     │             │
     ▼             ▼
Compare         Replace/update
current         according to
implementation  current contract
     │
     ▼
Already correct?
   │       │
  YES      NO
   │       │
   ▼       ▼
Preserve  Patch/extend
```

That is exactly how we should handle it.

---

# 40. Final target

The ultimate M2.9 acceptance condition should be:

```text
                    PROJECT LLM
                         │
                         ▼
                    User Target
                    Visual V1
                         │
                         ▼
                  TS Discovery
                         │
                         ▼
              Repository Contract
                         │
                         ▼
              Engineering Contract
                         │
                         ▼
                 Human Gate 1
                         │
                         ▼
                 External AI
                         │
                         ▼
                  Candidate Upload
                         │
                         ▼
                Target Binding Check
                         │
                         ▼
               Canonical Comparison
                         │
                         ▼
               Placement Manifest
                         │
                         ▼
                Human Approval
                         │
                         ▼
                RepositoryAdapter
                         │
                         ▼
                 Isolated Worktree
                         │
                         ▼
                  Actual Placement
                         │
                         ▼
                 TS Snapshot Refresh
                         │
                         ▼
                Certification Gates
                  /      |       \
               Composer Runtime Browser
                  \      |       /
                         ▼
                  Evidence Binding
                         │
                         ▼
                  CERTIFICATION_READY
                         │
                         ▼
                   Human Gate 2
                         │
                         ▼
                     CERTIFIED
                         │
                         ▼
                Tutorial Composer
                         │
                         ▼
                TutorialBlockRenderer
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
             ILS        LSNB       RSSB
              │          │          │
              └──────────┼──────────┘
                         ▼
                    Learner Page
```

And the most important architectural invariant remains:

> **External AI creates the implementation. Project LLM specifies, constrains, compares, integrates, verifies and certifies. Tutorial Composer remains the downstream authoring system.**

---

## Recommended immediate action

**Do not launch all agents at once.**

Launch only:

```text
W0:
B01
```

Then hard stop.

After B01:

```text
W1:
B02
B03
B04
B05
```

in parallel.

Then stop again for GitHub review.

This gives us controlled checkpoints and prevents another large batch of partially-correct implementation from accumulating.

And yes: **the evidence/test logging is part of the implementation itself**, not an optional documentation step. Without those machine-readable artifacts, our later GitHub cross-check cannot reliably distinguish "implemented", "tested", and "claimed".

Yes. The Project AI model should **not invent an “18-agent remediation plan”** just because the audit summary refers to one. The correct instruction is to recover the detailed plan from the project evidence/files, reconcile it against the current implementation, and then execute it in controlled waves.

Send the Project AI workflow agent the following master instruction:

---

# MASTER PROMPT — Recover, Validate, and Execute the 18-Agent Remediation Plan

You are the **Project AI remediation orchestrator** for the Project LLM backend.

The user has approved remediation based on the existing audit, but the user-facing message notes that the audit summary refers to an **18-agent remediation plan without reproducing its detailed agent definitions**.

Your first responsibility is therefore **NOT to immediately create or execute arbitrary new agents**.

You must:

1. Recover the authoritative remediation plan from the existing project artifacts.
2. Compare that plan against the current GitHub implementation.
3. Preserve correct existing implementation.
4. Identify which remediation agents are actually required.
5. Reconstruct missing agent instructions only when the project evidence supports them.
6. Execute the remediation sequentially/parallel according to dependencies.
7. Never fabricate PASS status, evidence, implementation, or certification.
8. Never create duplicate architecture, duplicate workflow engines, or duplicate documentation when canonical artifacts already exist.

---

## 1. AUTHORITATIVE SOURCE ORDER

Use this priority order when determining what the remediation plan means:

### Priority 1 — Current repository implementation

Inspect the current GitHub branch and actual source code.

Do not trust an old status document over current source code.

### Priority 2 — Existing Project AI audit evidence

Use the latest exact branch audit, alignment matrix, backend audit, and workflow evidence already present in the project.

Relevant existing evidence includes:

- Project AI M2 exact branch audit
- Project LLM front/back alignment matrix
- Project LLM alignment report
- M2.9 canonical wiring plan
- existing `.agents/tasks/*`
- existing `.agents/evidence/*`
- existing Project LLM architecture documents
- existing successful Playwright E2E evidence
- existing repository-discovery evidence

### Priority 3 — Existing canonical architecture documents

Use the already documented architecture for:

- Project LLM
- Project AI
- External AI
- Candidate workflow
- Tutorial Composer
- TutorialBlockRenderer
- ILS
- LSNB
- RSSB
- UBRC
- certification
- human approval
- evidence
- runtime/browser verification

### Priority 4 — Previous successful implementation

Previous successful Playwright/E2E implementation may be used as a **reference pattern only**.

Do NOT automatically reproduce it.

First determine whether the current architecture already implements the correct pattern.

---

# 2. CRITICAL RULE — DO NOT ASSUME THE 18 AGENTS

The audit summary says an **18-agent remediation plan** exists.

You must locate the detailed definition of those agents in the existing project artifacts.

Search for:

- agent IDs
- agent names
- wave assignments
- dependencies
- ownership
- expected files
- acceptance criteria
- evidence requirements
- test requirements
- commit requirements

If the detailed 18-agent definition exists:

> Recover it exactly and use it as the baseline.

If only partial information exists:

> Reconstruct only the missing portions from the documented architecture and audit findings, and clearly mark reconstructed portions as `INFERRED_FROM_EXISTING_ARCHITECTURE`.

If no authoritative detailed 18-agent plan can be found:

> STOP before implementation and report that the referenced plan cannot be recovered from the available project artifacts.

Do **not** silently invent an 18-agent plan and call it authoritative.

---

# 3. FIRST DELIVERABLE — REMEDIATION PLAN RECOVERY

Before changing source code, produce:

```text
.agents/tasks/m2-9-remediation-plan-recovered.json
```

and, if an existing canonical task/document already serves this purpose, **update that canonical artifact instead of creating another file**.

The recovered plan must contain:

```json
{
  "planId": "m2-9-remediation",
  "sourceStatus": "RECOVERED | PARTIALLY_RECOVERED | RECONSTRUCTED",
  "agents": [],
  "waves": [],
  "dependencies": [],
  "existingImplementationToPreserve": [],
  "knownDefects": [],
  "unknowns": [],
  "evidenceSources": []
}
```

Each agent entry must include:

```json
{
  "agentId": "...",
  "name": "...",
  "purpose": "...",
  "ownership": "...",
  "dependencies": [],
  "parallelizable": true,
  "filesExpected": [],
  "acceptanceCriteria": [],
  "testsRequired": [],
  "evidenceRequired": [],
  "source": "AUDIT | EXISTING_PLAN | REPOSITORY | RECONSTRUCTED"
}
```

Do not execute implementation until this recovery artifact has been reviewed internally against the current code.

---

# 4. EXISTING IMPLEMENTATION MUST BE PRESERVED

Before each remediation agent changes anything, it must perform:

```text
DISCOVER
→ VERIFY
→ CLASSIFY
→ PATCH ONLY WHAT IS WRONG
```

Classification:

```text
CORRECT
PARTIAL
INCORRECT
MISSING
STALE
DUPLICATE
CONFLICTING
```

If an implementation is already correct:

> Preserve it.

Do not rewrite it merely to make it look different.

If an implementation is partial:

> Extend it.

If an implementation is incorrect:

> Correct it.

If an implementation is missing:

> Implement it.

If two implementations compete:

> Determine the canonical authority and retire/reclassify the duplicate.

---

# 5. ARCHITECTURAL NON-NEGOTIABLES

The remediation must preserve these principles.

## Project LLM is the engineering/control plane

It is NOT:

- a generic chatbot
- an autonomous coding agent
- Tutorial Composer
- a second frontend
- a second workflow engine
- the final authority merely because an AI says PASS

The canonical chain is:

```text
User Target
    ↓
Repository Discovery
    ↓
Repository Contract
    ↓
Engineering Contract
    ↓
Human Gate 1
    ↓
External AI Implementation
    ↓
Candidate Upload
    ↓
Target Binding
    ↓
Canonical Comparison
    ↓
Placement Manifest
    ↓
Human Implementation Approval
    ↓
Safe Repository Placement
    ↓
Fresh Repository Snapshot
    ↓
Certification
    ↓
Runtime Verification
    ↓
Browser Verification
    ↓
Evidence
    ↓
CERTIFICATION_READY
    ↓
Human Gate 2
    ↓
CERTIFIED
    ↓
Tutorial Composer
    ↓
TutorialBlockRenderer
    ↓
ILS / LSNB / RSSB runtime
    ↓
Learner
```

---

# 6. PYTHON / TYPESCRIPT BOUNDARY

This rule is mandatory.

### TypeScript/Node

Own deterministic repository facts:

- discovery
- repository scanning
- file inventory
- hashes
- snapshots
- structural validation
- deterministic evidence

### Python/FastAPI

Own:

- orchestration
- reasoning
- contracts
- agent coordination
- approvals
- candidate workflow
- comparison decisions
- certification orchestration
- evidence orchestration
- runtime/browser orchestration

Python must **not independently scan the repository**.

Python consumes the canonical TypeScript repository snapshot/evidence.

If an existing Python implementation uses:

```python
Path(repo_root)
```

or directly walks repository files for repository intelligence, classify it as an architectural defect and remediate it.

---

# 7. CANONICAL WORKFLOW

There must be one executable lifecycle authority.

Canonical lifecycle:

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

Existing:

- `TaskState`
- `WorkflowStatus`
- `CreationWorkflow`
- `CreationMode`
- other competing lifecycle enums

must be reconciled.

Do not leave multiple executable workflow authorities.

Backward-compatible mappings may remain temporarily, but they must map into the canonical lifecycle rather than control a separate workflow.

---

# 8. MIX & MATCH RULE

The previous Project AI creation workflow must not remain an independent workflow authority.

If Mix & Match is still present:

```text
CreationMode.MIX_AND_MATCH
```

or equivalent creation workflow logic must be:

- removed,
- reclassified as a non-authoritative design-source concept,
- or converted to a compatibility adapter.

It must NOT create a second lifecycle.

The architecture is:

```text
External AI + Human
    ↓
design/composition decision
    ↓
Project LLM
    ↓
verification of submitted implementation
```

Project LLM does not autonomously invent the block composition.

---

# 9. TARGET VERSION MUST NEVER BE INFERRED

The selected target must explicitly contain:

```text
blockFamily
targetVersion
repositorySnapshotId
existingVersions
canonicalReferences
```

The candidate must bind to that exact target.

Never use hardcoded values such as:

```text
1.0.0
```

when the workflow target is actually:

```text
I7
C2
D2
...
```

The target version must propagate through:

```text
GUI
→ Engineering Contract
→ External AI Brief
→ Candidate
→ Candidate Binding
→ Comparison
→ Placement Manifest
→ Placement
→ Certification
→ Final Gate
```

---

# 10. ENGINEERING CONTRACT

The Engineering Contract must be generated from the canonical repository evidence.

It must contain, as applicable:

- target family
- target version
- repository snapshot
- canonical references
- educational requirements
- implementation requirements
- TypeScript/React requirements
- schema requirements
- UBRC requirements
- renderer requirements
- Composer requirements
- runtime requirements
- theme requirements
- brand requirements
- ILS requirements
- LSNB requirements
- RSSB requirements
- required artifacts
- required tests
- acceptance criteria
- prohibited behavior
- contract hash

The contract must be self-contained enough for External AI.

---

# 11. EXTERNAL AI PROTOTYPE RULE

The documented creation sequence remains:

```text
Engineering Contract
        ↓
External AI
        ↓
HTML/CSS/JS/JSON prototype
        ↓
Human visual/design approval
        ↓
External AI React/TypeScript implementation
        ↓
Candidate package
        ↓
Project LLM verification
```

Do not let Project LLM claim that implementation is certified merely because External AI produced files.

---

# 12. CANDIDATE INTAKE

Candidate upload must:

- support real upload
- calculate SHA-256 server-side
- validate file/path safety
- reject traversal
- bind candidate to target
- preserve contract hash
- preserve target version
- produce evidence

A candidate cannot be considered valid merely because JSON metadata says it is valid.

---

# 13. CANONICAL COMPARISON

Wire the real canonical comparator into the authoritative workflow.

Do not leave:

```text
comparison_result = "stub"
```

or equivalent.

Comparison must evaluate at least:

- target family
- target version
- structural compatibility
- canonical/reference similarity
- required artifacts
- required evidence
- conflicts
- prohibited behavior
- placement implications

Results:

```text
PASS
FAIL
BLOCKED
```

Missing evidence must never become PASS.

---

# 14. PLACEMENT

Placement must be driven by an explicit manifest.

Manifest must contain:

```text
workflowId
candidateId
targetFamily
targetVersion
contractHash
candidateHash
files
operations
canonical destinations
evidence
manifestHash
approval status
```

Allowed operations may include:

```text
ADD
UPDATE
EXTEND
REUSE
```

No blind copying.

No arbitrary shell execution.

No placement without required human approval.

---

# 15. REPOSITORY ADAPTER

Repository mutation must be isolated behind an approved repository operation boundary.

Preferred model:

```text
Project AI
    ↓
Approved Operation
    ↓
Validated Placement Manifest
    ↓
RepositoryAdapter
    ↓
Isolated Worktree
    ↓
Dry Run
    ↓
Approved Placement
```

No arbitrary:

```text
subprocess("whatever")
```

from orchestration logic.

---

# 16. CERTIFICATION

Certification must use real gates.

Do not implement:

```python
all_gates = "PASS"
```

Certification gates should cover the repository-supported requirements, including where applicable:

```text
UBRC
Brand
Theme
Registry
Renderer
Composer
Runtime
Browser
Evidence
Manifest
```

Every PASS requires evidence.

Rules:

```text
FAIL → certification FAIL
BLOCKED → certification BLOCKED
missing evidence → BLOCKED
all required gates PASS → CERTIFICATION_READY
```

`CERTIFICATION_READY` is NOT `CERTIFIED`.

---

# 17. BROWSER VERIFICATION

Do not fabricate browser PASS.

If Playwright cannot execute:

```text
BLOCKED
```

not:

```text
PASS
```

There must be only one canonical Playwright stack/configuration.

Before changing browser verification:

1. locate the existing successful Playwright E2E;
2. inspect its configuration and patterns;
3. determine whether current implementation already follows it;
4. preserve correct implementation;
5. adapt the existing pattern only where current implementation is deficient.

Do NOT create a second browser framework.

---

# 18. TUTORIAL COMPOSER / ILS / LSNB / RSSB

Do not recreate Tutorial Composer inside Project LLM.

Project LLM verifies that the candidate integrates with the existing canonical architecture.

For a new block/version, determine from repository evidence the actual required:

- block component
- version routing
- schema
- TutorialBlockRenderer dispatch
- Composer registration/discoverability
- authoring support
- UBRC
- tests

ILS remains downstream/passive:

```text
Block DOM
→ ActiveBlockContext
→ ILSProvider / telemetry
```

Blocks must not independently create:

- ILS navigation
- learning progress UI
- LSNB
- RSSB

LSNB/RSSB remain page-level consumers.

Brand/theme remain supplied by runtime context.

A certified block must remain brand-independent.

---

# 19. EVIDENCE IS A FIRST-CLASS OUTPUT

Every agent must produce machine-readable evidence.

At minimum:

```text
agent execution
files changed
files verified
tests executed
test results
evidence IDs
before SHA
after SHA
architecture decisions
blockers
```

Suggested run structure:

```text
.agents/evidence/runs/<run-id>/

manifest.json
discovery.json
contract.json
candidate.json
comparison.json
placement.json
approvals.json
gates.json
runtime.json
browser.json
final-verdict.json
test-results.json
timeline.json
```

But first search for an existing canonical evidence structure.

**Do not create another evidence system if one already exists.**

Extend the existing canonical evidence system.

---

# 20. TEST FAILURE POLICY

Do not blindly chase a number such as:

```text
55 failures
```

Classify every failure:

```text
ARCHITECTURE_DEFECT
IMPLEMENTATION_BUG
STALE_EXPECTATION
OBSOLETE_TEST
ENVIRONMENT_FAILURE
MISSING_DEPENDENCY
REAL_BLOCKER
```

Only implementation defects should be fixed by remediation.

Do not weaken tests simply to make the count reach zero.

---

# 21. AGENT EXECUTION CONTRACT

Every remediation agent must return:

```json
{
  "agentId": "...",
  "wave": "...",
  "status": "PASS | PARTIAL | BLOCKED | FAIL",
  "commitBefore": "...",
  "commitAfter": "...",
  "changedFiles": [],
  "verifiedFiles": [],
  "tests": [],
  "evidenceIds": [],
  "architectureDecision": [],
  "preservedCorrectImplementation": [],
  "blockers": [],
  "nextDependencies": []
}
```

A PASS without evidence is invalid.

---

# 22. WAVE EXECUTION

Do not launch all agents simultaneously.

Respect dependencies.

Use this general sequencing unless the recovered authoritative 18-agent plan specifies a different dependency-safe ordering:

### Wave 0 — Architecture Freeze

Canonical workflow authority.

Hard stop.

### Wave 1 — Foundation

Parallel where safe:

- repository intelligence boundary
- target/version binding
- legacy workflow reconciliation
- evidence harness

Hard stop.

### Wave 2 — Contract

Engineering Contract generation.

Hard stop.

### Wave 3 — Candidate / Comparison / Placement Planning

Parallel where dependencies permit:

- candidate intake
- canonical comparison

Then:

- placement manifest

Hard stop.

### Wave 4 — Approval / Safe Mutation

Sequential:

```text
Implementation Approval
→ RepositoryAdapter
→ isolated placement
```

Hard stop.

### Wave 5 — Verification

Parallel where safe:

- certification gates
- runtime verification
- browser verification
- Composer verification
- brand/theme verification

Hard stop.

### Wave 6 — Final Gate

Sequential:

```text
Final Gate
→ CERTIFICATION_READY
→ Human Gate 2
→ CERTIFIED
```

Hard stop.

### Wave 7 — Golden E2E / Cross-System Audit

Run:

```text
REQUESTED
→ ...
→ CERTIFIED
```

plus negative tests.

Then perform:

- backend audit
- evidence audit
- frontend/backend contract audit
- Playwright audit
- final GitHub audit

---

# 23. FRONTEND MUST NOT BECOME A SECOND AUTHORITY

The React/Next.js GUI is a view/control surface.

It must eventually consume FastAPI.

Do not retain hardcoded production state such as:

```text
candidateUploaded = true
validationCompleted = true
11 checks passed
hardcoded branch
hardcoded snapshot
hardcoded certification
```

The GUI must display backend state.

The frontend must not implement its own lifecycle engine.

Existing:

```text
projectLlmWorkflowCoordinator.ts
```

must be classified and either reduced to client helpers/types or retired if it is a competing workflow authority.

Do not implement frontend integration until backend contracts are stable.

---

# 24. CANONICAL ARTIFACT RULE

Before creating ANY file:

```text
SEARCH
→ IDENTIFY CANONICAL ARTIFACT
→ UPDATE/EXTEND IT
```

Only create a new file when genuinely necessary.

If a new file is necessary, record:

```text
why existing artifact could not be extended
what canonical purpose the new artifact serves
which authority owns it
```

This applies to:

- `.md`
- `.json`
- `.ts`
- `.tsx`
- `.py`
- tests
- evidence
- architecture documents

Do not create another Markdown file merely because an agent wants to document the same subject.

---

# 25. COMMIT POLICY

Each completed wave gets a dedicated commit.

Example:

```text
m2.9 W0 canonical workflow authority
m2.9 W1 repository/target/evidence reconciliation
m2.9 W2 engineering contract
m2.9 W3 candidate comparison placement
m2.9 W4 approval safe placement
m2.9 W5 certification runtime browser
m2.9 W6 final gate
m2.9 W7 golden E2E and audit
```

Never combine unrelated waves into one giant undocumented commit.

---

# 26. HARD STOP CONDITIONS

Stop the workflow if any of these occur:

- competing workflow authority remains
- Python scans repository directly
- target version is inferred
- candidate is not bound to target
- comparator remains a stub
- certification has unconditional PASS
- browser verification fabricates PASS
- missing evidence is treated as PASS
- human approval is bypassed
- placement mutates repository without approved operation
- Mix & Match remains an independent lifecycle
- frontend creates its own workflow authority
- duplicate evidence architecture is introduced
- duplicate documentation is created unnecessarily

Report:

```text
BLOCKED
Reason:
Evidence:
Required action:
```

Do not continue into downstream certification.

---

# 27. FIRST ACTION — DO THIS NOW

Do NOT start implementation immediately.

First:

### Step A

Search the existing project files and repository for the referenced **18-agent remediation plan**.

### Step B

Recover its exact agent list and wave/dependency structure.

### Step C

Compare the recovered plan against the current GitHub branch.

### Step D

Produce the remediation-plan recovery artifact.

### Step E

Produce a concise table:

| Agent | Existing implementation | Status | Required action | Dependencies |
|---|---|---|---|---|
| A01 | ... | CORRECT/PARTIAL/FAIL/MISSING | ... | ... |
| A02 | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |
| A18 | ... | ... | ... | ... |

### Step F

Only after the plan is recovered and reconciled, begin the first dependency-safe wave.

---

## FINAL RULE

**Do not interpret “execute the 18-agent remediation plan” as permission to invent 18 agents.**

Recover the plan first.

If it cannot be recovered, say exactly what is missing.

If it can be recovered, execute it.

If the current repository already contains a correct implementation, preserve it.

If the existing plan conflicts with the actual repository architecture, report the conflict and use the **current canonical architecture plus explicit audit evidence** to resolve it rather than blindly rewriting working code.

The goal is not to maximize changed files.

The goal is:

> **one canonical Project LLM architecture, one workflow authority, one evidence chain, real verification, explicit human gates, no fabricated PASS, and a reproducible REQUESTED → CERTIFIED lifecycle.**

Yes. The correct approach is to turn this into a **controlled multi-agent implementation program**, not give 15–20 agents permission to modify the repository simultaneously.

The important correction from our GitHub reconciliation is that the previous “M2.9 complete / ready for merge” report must **not** be trusted as proof. The actual GitHub branch still contains several of the supposedly removed authorities and stubs. The audit also identified **0 PASS, 10 PARTIAL, 14 FAIL** across the 24 alignment requirements. project-llm-front-back-alignmen…

So I recommend the following implementation program.

---

# 1. Target architecture

The final architecture should be:

```text
                    HUMAN
                      │
                      ▼
              Project LLM GUI
              React / Next.js
                      │
                      │ FastAPI API
                      ▼
        ┌─────────────────────────────┐
        │      PROJECT AI CORE        │
        │       Python / FastAPI      │
        │                             │
        │ Canonical Workflow Authority│
        │ Engineering Contract        │
        │ Candidate Intake            │
        │ Target Binding              │
        │ Canonical Comparison        │
        │ Placement Manifest          │
        │ Human Approval              │
        │ Certification Gates         │
        │ Runtime Verification        │
        │ Browser / Playwright        │
        │ Final Gate                  │
        │ Evidence Ledger             │
        └──────────────┬──────────────┘
                       │
                       ▼
             TypeScript / Node
          Repository Discovery
          Repository Evidence
          Snapshot / Hashes
                       │
                       ▼
                 Git Repository
```

Then:

```text
REQUESTED
   ↓
DISCOVERY
   ↓
BRIEF_READY
   ↓
AWAITING_GATE_1
   ↓
GUI_APPROVED
   ↓
CANDIDATE_REQUESTED
   ↓
CANDIDATE_RECEIVED
   ↓
CANDIDATE_AUDIT
   ↓
INTEGRATION_PLANNED
   ↓
AWAITING_IMPLEMENTATION_APPROVAL
   ↓
IMPLEMENTING
   ↓
IMPLEMENTED
   ↓
VERIFYING
   ↓
CERTIFICATION_READY
   ↓
AWAITING_GATE_2
   ↓
CERTIFIED
```

There must be **one authoritative lifecycle**.

The previous audit specifically identified `WorkflowEngine`, the frontend workflow coordinator, and legacy creation workflow as competing authorities. project-llm-front-back-alignmen…

---

# 2. Critical rule for every agent

Give every agent this rule.

> **Repository is the authority. Agent reports are not evidence.**
>
> Never declare PASS merely because a file or class exists.
>
> A capability is PASS only when:
>
> 1. implementation exists,
> 2. implementation is actually wired into the canonical execution path,
> 3. tests prove the behavior,
> 4. evidence is generated from the current commit,
> 5. GitHub contains the committed implementation.
>
> Missing evidence = BLOCKED.
>
> A fabricated PASS is a defect.

Also:

> **Before creating any file, search the repository for an existing canonical artifact.**
>
> If an appropriate artifact exists, update/extend it.
>
> Do not create duplicate `.md`, `.json`, `.ts`, `.py`, specification, contract, evidence, or workflow files merely because an agent wants its own artifact.
>
> Create a new artifact only when the existing canonical artifact genuinely cannot represent the required information, and record the reason.

This should be included in the master prompt to **every agent**, including Kiro/Gemini subagents.

---

# 3. Agent organization

I would use **18 implementation/verification agents**, but not all at once.

## Wave 0 — Architecture freeze

### B01 — Canonical Workflow Authority

**Sequential.**

Responsibilities:

- create/finalize `CanonicalWorkflowState`
- define transitions
- make 15-agent workflow the authority
- map legacy states where compatibility is genuinely needed
- prevent `WorkflowEngine` from becoming another lifecycle

Suggested files:

```text
services/project-ai/app/models/canonical_workflow_state.py
services/project-ai/app/models/state_mapper.py
services/project-ai/app/orchestration/...
services/project-ai/tests/...
```

Example:

```python
from enum import Enum


class CanonicalWorkflowState(str, Enum):
    REQUESTED = "REQUESTED"
    DISCOVERY = "DISCOVERY"
    BRIEF_READY = "BRIEF_READY"
    AWAITING_GATE_1 = "AWAITING_GATE_1"
    GUI_APPROVED = "GUI_APPROVED"
    CANDIDATE_REQUESTED = "CANDIDATE_REQUESTED"
    CANDIDATE_RECEIVED = "CANDIDATE_RECEIVED"
    CANDIDATE_AUDIT = "CANDIDATE_AUDIT"
    INTEGRATION_PLANNED = "INTEGRATION_PLANNED"
    AWAITING_IMPLEMENTATION_APPROVAL = "AWAITING_IMPLEMENTATION_APPROVAL"
    IMPLEMENTING = "IMPLEMENTING"
    IMPLEMENTED = "IMPLEMENTED"
    VERIFYING = "VERIFYING"
    CERTIFICATION_READY = "CERTIFICATION_READY"
    AWAITING_GATE_2 = "AWAITING_GATE_2"
    CERTIFIED = "CERTIFIED"
    REJECTED = "REJECTED"
```

And:

```python
ALLOWED_TRANSITIONS = {
    CanonicalWorkflowState.REQUESTED: {
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.REJECTED,
    },

    CanonicalWorkflowState.DISCOVERY: {
        CanonicalWorkflowState.BRIEF_READY,
        CanonicalWorkflowState.REJECTED,
    },

    CanonicalWorkflowState.BRIEF_READY: {
        CanonicalWorkflowState.AWAITING_GATE_1,
    },

    CanonicalWorkflowState.AWAITING_GATE_1: {
        CanonicalWorkflowState.GUI_APPROVED,
        CanonicalWorkflowState.REJECTED,
    },

    # ...
}
```

### Hard stop

Do not allow B02 to start until B01 produces:

```text
canonical-workflow-architecture.json
workflow-transition-tests.json
git commit
```

---

# 4. Wave 1 — Four agents in parallel

After B01 passes:

```text
              B01
               │
       ┌───────┼────────┬────────┐
       ▼       ▼        ▼        ▼
      B02     B03      B04      B05
```

These can safely work in parallel because they have different responsibilities.

---

## B02 — Repository Intelligence Boundary

This is extremely important.

The architecture requires:

```text
TypeScript
   │
   ├── scan repository
   ├── discover files
   ├── calculate hashes
   ├── build evidence
   └── produce snapshot
             │
             ▼
        Python/FastAPI
```

Python must **not** independently scan the repository.

The current implementation violated this by using `Path(repo_root)` and directly reading files. That was explicitly identified in the GitHub reconciliation. 

The correct interface should resemble:

```python
class RepositoryEvidence(BaseModel):
    path: str
    sha256: str
    size: int
    kind: str
    evidence_id: str
    source: str
```

Then:

```python
class RepositorySnapshot(BaseModel):
    snapshot_id: str
    repository: str
    commit_sha: str
    files: list[RepositoryEvidence]
    generated_at: datetime
```

Python receives:

```python
def build_contract(
    snapshot: RepositorySnapshot,
    family: str,
    version: str,
):
    ...
```

Not:

```python
def build_contract(repo_root: str, ...):
```

And absolutely not:

```python
repo_path = Path(repo_root)
```

### Test

A test should fail if Project AI attempts direct filesystem repository discovery.

---

# 5. B03 — Target + Version Binding

This agent owns:

```text
WorkflowTarget
CandidateBinding
```

The target must be explicit.

```python
class WorkflowTarget(BaseModel):
    workflow_id: str
    block_family: str
    target_version: str
    block_type: str
    specification_id: str
    source_snapshot_id: str
    canonical_references: list[str]
```

Candidate:

```python
class CandidateBinding(BaseModel):
    candidate_id: str
    workflow_id: str

    target_family: str
    target_version: str

    contract_hash: str
    candidate_hash: str
```

Then every subsequent operation must carry the binding.

```text
workflow
   ↓
family = Introduction
version = I7
   ↓
engineering contract
   ↓
external AI
   ↓
candidate
   ↓
comparison
   ↓
placement
   ↓
certification
```

No component is allowed to infer:

```text
"probably I7"
```

or:

```text
"version 1.0.0"
```

---

# 6. B04 — Legacy Workflow Reconciliation

This agent handles:

```text
CreationMode
CreationWorkflow
WorkflowStatus
/creation/*
WorkflowEngine
```

Do **not** blindly delete them.

First search all references.

Classify every reference:

```text
CANONICAL
COMPATIBILITY
OBSOLETE
TEST_ONLY
DOCUMENTATION_ONLY
```

The problem is that current GitHub still contains executable:

```python
CreationMode.MIX_AND_MATCH
```

and executable:

```text
POST /creation/workflows
```

So simply renaming the class is not enough.

The final architecture should be:

```text
Canonical Workflow
       │
       ├── current API
       ├── candidate
       ├── certification
       └── GUI
```

Legacy routes can either:

### Option A — remove them

or:

### Option B — compatibility adapter

For example:

```python
@router.post("/creation/workflows")
async def legacy_creation_route(...):
    raise HTTPException(
        status_code=410,
        detail={
            "code": "LEGACY_WORKFLOW_DISABLED",
            "canonical_endpoint": "/project-llm/workflows",
        },
    )
```

Do **not** leave an alternative lifecycle executable.

---

# 7. B05 — Evidence Harness

This agent owns the evidence structure.

Recommended:

```text
.agents/
  evidence/
    runs/
      <workflow-id>/
        manifest.json
        discovery.json
        target.json
        engineering-contract.json
        candidate.json
        comparison.json
        placement.json
        approvals.json
        certification.json
        runtime.json
        browser.json
        final-verdict.json
        tests.json
        timeline.json
```

Every evidence record:

```json
{
  "evidenceId": "EV-2026-000123",
  "workflowId": "WF-001",
  "agentId": "B08",
  "commitSha": "abc123",
  "timestamp": "2026-10-07T12:00:00Z",
  "type": "CANONICAL_COMPARISON",
  "status": "PASS",
  "sourceFiles": [
    "services/project-ai/app/placement/comparator.py"
  ],
  "testResults": [
    "test_canonical_comparison.py"
  ],
  "sha256": "..."
}
```

The important property is:

**evidence must identify the exact Git commit from which it was generated.**

---

# 8. Wave 2 — Engineering Contract

Sequential.

## B06 — Engineering Contract

This is the biggest architectural deliverable.

The external AI knows nothing about the repository.

Therefore:

```text
Family = I7
Version = I7
        ↓
Repository Snapshot
        ↓
Canonical Evidence
        ↓
Engineering Contract
        ↓
External AI
```

The contract must contain:

```text
1. Target
2. Educational intent
3. Existing canonical implementations
4. Exact artifact structure
5. Type contract
6. Schema contract
7. Renderer contract
8. Composer contract
9. Registry contract
10. UBRC contract
11. Theme contract
12. Brand contract
13. ILS contract
14. LSNB relationship
15. RSSB relationship
16. Runtime contract
17. Testing contract
18. Prohibited behaviors
19. Required files
20. Acceptance criteria
21. Repository evidence
22. Contract hash
```

Example:

```python
class EngineeringContract(BaseModel):
    contract_id: str

    workflow_id: str

    target: WorkflowTarget

    repository_snapshot_id: str

    canonical_patterns: list[CanonicalReference]

    educational_contract: EducationalContract

    implementation_contract: ImplementationContract

    schema_contract: SchemaContract

    renderer_contract: RendererContract

    composer_contract: ComposerContract

    runtime_contract: RuntimeContract

    theme_contract: ThemeContract

    brand_contract: BrandContract

    ils_contract: ILSContract

    lsnr_contract: LSNBContract
    rssb_contract: RSSBContract

    required_artifacts: list[RequiredArtifact]

    acceptance_tests: list[AcceptanceTest]

    prohibited_behaviors: list[str]

    contract_hash: str
```

The important semantic rule from the repository audit is:

> The new block does **not** implement its own ILS, LSNB, or RSSB systems. It participates in the existing Tutorial Engine architecture.

The existing runtime audit describes ILS as passive telemetry through block DOM identity/active-block infrastructure, while LSNB/RSSB are page-level concerns rather than block-created navigation systems. project-llm-front-back-alignmen…

---

# 9. Wave 3 — Candidate pipeline

Parallel:

```text
             B07
              │
       ┌──────┴──────┐
       ▼             ▼
      B08           B09
```

---

## B07 — Candidate Intake

Candidate upload should be real multipart upload.

```http
POST /api/project-llm/workflows/{workflow_id}/candidate
Content-Type: multipart/form-data
```

Server calculates:

```python
candidate_sha256 = sha256(uploaded_bytes)
```

Never trust a client-provided hash as authority.

Validate:

```text
path traversal
unsupported extension
duplicate files
package structure
maximum size
target binding
contract hash
candidate hash
```

---

# 10. B08 — Canonical Comparator

Wire Agent 7 directly to the actual:

```text
CanonicalComparator
```

Not:

```python
comparison_result = "stub"
```

Comparison must produce:

```python
class ComparisonResult(BaseModel):
    status: Literal["PASS", "FAIL", "BLOCKED"]

    target_family_match: bool
    target_version_match: bool

    canonical_matches: list[CanonicalMatch]
    missing_requirements: list[str]
    conflicts: list[str]

    evidence_ids: list[str]
```

Example:

```python
if not result.target_version_match:
    return ComparisonResult(
        status="FAIL",
        target_version_match=False,
        ...
    )
```

---

# 11. B09 — Placement Manifest

The current hardcoded:

```python
blockVersion="1.0.0"
```

must disappear.

Use:

```python
blockVersion=workflow_target.target_version
```

and:

```python
targetFamily=workflow_target.block_family
```

Manifest:

```python
class PlacementManifest(BaseModel):
    workflow_id: str

    candidate_id: str

    target_family: str
    target_version: str

    contract_hash: str
    candidate_hash: str

    operations: list[PlacementOperation]

    manifest_hash: str
```

---

# 12. Wave 4 — Approval + safe repository mutation

Sequential.

## B10 — Human Implementation Approval

No placement without explicit approval.

```python
class ImplementationApproval(BaseModel):
    workflow_id: str
    candidate_id: str

    target_version: str

    manifest_hash: str
    contract_hash: str

    approver_id: str
    approved_at: datetime
```

Before execution:

```python
if approval.manifest_hash != manifest.manifest_hash:
    raise ApprovalMismatch(...)
```

Also:

```python
if approval.approver_id == candidate.submitted_by:
    raise SelfApprovalRejected(...)
```

---

# 13. B11 — RepositoryAdapter

Do not allow agents to execute arbitrary shell commands.

Use:

```python
class RepositoryAdapter(Protocol):

    def create_isolated_worktree(...):
        ...

    def apply_manifest(...):
        ...

    def refresh_snapshot(...):
        ...

    def commit(...):
        ...
```

Operations should be allowlisted:

```python
ALLOWED_OPERATIONS = {
    "ADD_FILE",
    "UPDATE_FILE",
    "EXTEND_FILE",
    "REUSE_FILE",
}
```

Not:

```python
subprocess.run(user_supplied_command)
```

Placement should first generate:

```text
DRY RUN
```

Example:

```text
ADD
packages/ui/src/tutorial/blocks/NewBlock.tsx

UPDATE
packages/ui/src/tutorial/TutorialBlockRenderer.tsx

ADD
apps/skillhubcore-admin/.../registry/entries/new-block.registry.ts
```

Human approves that exact manifest.

Only then execute.

---

# 14. Wave 5 — Verification

These can run in parallel after placement.

```text
             Placement
                │
     ┌──────────┼───────────┐
     ▼          ▼           ▼
    B12        B13         B14
Certification Runtime     Browser
```

---

## B12 — Certification Gates

Never:

```python
all_gates = "PASS"
```

Instead:

```python
gates = [
    ubrc_gate,
    brand_gate,
    theme_gate,
    registry_gate,
    renderer_gate,
    composer_gate,
    runtime_gate,
    browser_gate,
    evidence_gate,
    manifest_gate,
]
```

Each gate returns:

```python
GateResult(
    gate_id="COMPOSER",
    status="PASS",
    evidence_ids=[...],
)
```

And enforce:

```python
if result.status == "PASS" and not result.evidence_ids:
    raise InvalidGateResult(
        "PASS requires evidence"
    )
```

---

# 15. B13 — Runtime Verification

Verify:

```text
TutorialDocument
        ↓
TutorialBlockRenderer
        ↓
new block
        ↓
UBRC
        ↓
ActiveBlockContext
        ↓
ILS
```

The new block must not import an ILS API directly.

Bad:

```typescript
import { ILSClient } from "...";
```

Good:

```tsx
<article
  data-block-id={block.id}
  data-block-type={block.type}
  data-block-version={block.version}
>
```

Then existing runtime infrastructure detects it.

This matches the existing runtime architecture documented in the repository audit. project-llm-front-back-alignmen…

---

# 16. B14 — Real Playwright verification

This is critical.

The previous implementation contained browser verification that could return:

```text
passed=True
```

without actually running Playwright.

That is unacceptable.

Use the repository's **existing Playwright infrastructure**.

Do not create:

```text
playwright-new/
playwright2/
browser-test-v2/
```

Instead:

```text
existing Playwright configuration
        ↓
extend existing canonical test suite
```

Example test:

```typescript
test("new block is rendered by TutorialBlockRenderer", async ({ page }) => {
  await page.goto(TEST_TUTORIAL_URL);

  const block = page.locator(
    '[data-block-type="new-family"]'
  );

  await expect(block).toBeVisible();

  await expect(block).toHaveAttribute(
    "data-block-version",
    TARGET_VERSION
  );
});
```

Browser unavailable?

Then:

```text
BLOCKED
```

Never:

```text
PASS
```

---

# 17. Composer verification

The certification gate must establish:

```text
registry
   ↓
Composer
   ↓
authoring
   ↓
TutorialDocument
   ↓
renderer
```

Not merely:

```text
React component exists
```

The repository's runtime-compliance audit already establishes that I1/C1/D1 are expected to participate in:

```text
schema
renderer
Composer
UBRC
passive ILS
page-level LSNB/RSSB
tests
```

So the new implementation must be checked against that same architectural pattern. project-llm-front-back-alignmen…

---

# 18. Wave 6 — Final Gate

## B15 — Final Gate Agent

This agent should consume all previous evidence.

Logic:

```python
def calculate_final_verdict(gates):

    if missing_required_evidence(gates):
        return "BLOCKED"

    if any(g.status == "FAIL" for g in gates):
        return "FAIL"

    if any(g.status == "BLOCKED" for g in gates):
        return "BLOCKED"

    return "CERTIFICATION_READY"
```

Important:

```text
CERTIFICATION_READY
```

is **not**:

```text
CERTIFIED
```

The second human approval is required.

```text
CERTIFICATION_READY
        ↓
AWAITING_GATE_2
        ↓
Human Approval
        ↓
CERTIFIED
```

---

# 19. Frontend work starts only after backend freeze

This is important.

Do **not** let Gemini redesign the frontend while Kiro is changing backend contracts.

Backend first.

Then:

## F01 — FastAPI Client

Create one typed API client.

For example:

```typescript
export interface ProjectLlmApi {
  createWorkflow(
    request: CreateWorkflowRequest
  ): Promise<Workflow>;

  getWorkflow(
    workflowId: string
  ): Promise<Workflow>;

  getEngineeringContract(
    workflowId: string
  ): Promise<EngineeringContract>;

  uploadCandidate(
    workflowId: string,
    file: File
  ): Promise<Candidate>;

  compareCandidate(
    workflowId: string
  ): Promise<ComparisonResult>;

  getCertification(
    workflowId: string
  ): Promise<CertificationResult>;
}
```

The GUI becomes:

```text
FastAPI state
     ↓
React query/state
     ↓
components
```

not:

```text
localStorage fixture
     ↓
fake PASS
```

---

# 20. Delete/reduce frontend workflow authority

The current:

```text
projectLlmWorkflowCoordinator.ts
```

must not remain a second workflow engine.

If useful, convert it into:

```text
types
selectors
presentation helpers
```

but not:

```typescript
runWorkflow()
assertValidTransition()
runAgentF()
runAgentG()
...
```

The backend owns that.

---

# 21. Frontend agent division

After backend certification:

### G01 — API integration

Sequential.

### G02 — Dashboard

Parallel with G03/G04.

### G03 — Compliance Brief

Parallel.

### G04 — External AI Handoff

Parallel.

### G05 — Candidate Upload

Parallel.

### G06 — Integration/Certification

Parallel.

### G07 — Workflow Details

Parallel.

### G08 — Final GUI integration test

Sequential.

---

# 22. Exact agent execution pattern

Every agent must produce this report:

```json
{
  "agentId": "B08",
  "wave": "W3",
  "status": "COMPLETED",

  "commitBefore": "abc123",
  "commitAfter": "def456",

  "changedFiles": [
    "services/project-ai/app/placement/comparator.py",
    "services/project-ai/app/orchestration/agent_coordinator.py"
  ],

  "verifiedFiles": [
    "services/project-ai/tests/test_comparator.py"
  ],

  "tests": {
    "passed": 37,
    "failed": 0,
    "skipped": 2
  },

  "evidenceIds": [
    "EV-COMPARE-001",
    "EV-COMPARE-002"
  ],

  "architectureDecision": "Agent 7 now delegates to CanonicalComparator",

  "blockers": []
}
```

Save it into:

```text
.agents/evidence/runs/<workflow-id>/agents/B08.json
```

---

# 23. Git strategy

I recommend:

```text
main
  │
  └── m2-project-llm-canonical-remediation
          │
          ├── W0
          ├── W1
          ├── W2
          ├── W3
          ├── W4
          ├── W5
          ├── W6
          └── W7
```

Do not let 18 agents push directly to `main`.

Each wave gets a commit.

Example:

```text
M2.9 W0: freeze canonical workflow
M2.9 W1: enforce repository snapshot boundary
M2.9 W1: target binding and evidence harness
M2.9 W2: repository-derived engineering contract
M2.9 W3: candidate intake and comparison
M2.9 W3: placement manifest
M2.9 W4: approval and RepositoryAdapter
M2.9 W5: certification/runtime/browser wiring
M2.9 W6: final gate
M2.9 W7: FastAPI GUI integration
```

---

# 24. Testing reports must be committed

I strongly recommend this structure:

```text
.agents/
  evidence/
    runs/
      M2.9-20261007-001/
        manifest.json

        discovery/
          snapshot.json

        contract/
          engineering-contract.json

        candidate/
          intake.json
          hash.json
          comparison.json

        placement/
          manifest.json
          dry-run.json
          approval.json
          execution.json

        verification/
          composer.json
          ubrc.json
          runtime.json
          browser.json
          brand.json
          theme.json

        gates/
          gate-results.json
          final-gate.json

        tests/
          python-unit.json
          python-integration.json
          typescript.json
          playwright.json
          e2e.json

        agents/
          B01.json
          B02.json
          ...
          B15.json

        final/
          verdict.json
          summary.md
```

And:

```text
.agents/tasks/
    m2-9-wave0-architecture-freeze.json
    m2-9-wave1-repository-boundary.json
    m2-9-wave2-engineering-contract.json
    ...
```

---

# 25. Do not blindly force all current tests to pass

This is important.

The previous reports mentioned hundreds of tests and failures. A test failure must first be classified:

```text
ARCHITECTURE_DEFECT
IMPLEMENTATION_BUG
OBSOLETE_EXPECTATION
ENVIRONMENT_FAILURE
TEST_HARNESS_FAILURE
EXPECTED_BLOCKED
```

For example:

```json
{
  "test": "test_creation_mode_mix_and_match",
  "status": "OBSOLETE_EXPECTATION",
  "reason": "Mix & Match is no longer a Project LLM creation authority",
  "replacement": "test_legacy_creation_route_disabled"
}
```

That is better than changing production code merely to make an obsolete test green.

---

# 26. Golden end-to-end test

At the end we need exactly one canonical end-to-end test representing the architecture:

```text
REQUESTED
   ↓
select family/version
   ↓
DISCOVERY
   ↓
Engineering Contract
   ↓
Gate 1
   ↓
External AI candidate
   ↓
Upload
   ↓
SHA256
   ↓
Target Binding
   ↓
Canonical Comparison
   ↓
Placement Manifest
   ↓
Human Approval
   ↓
Isolated Worktree
   ↓
Placement
   ↓
Refresh Snapshot
   ↓
Composer verification
   ↓
UBRC verification
   ↓
Runtime verification
   ↓
Playwright
   ↓
Brand
   ↓
Theme
   ↓
Evidence
   ↓
CERTIFICATION_READY
   ↓
Human Gate 2
   ↓
CERTIFIED
```

Negative tests must also exist:

```text
wrong family             → FAIL
wrong version             → FAIL
missing Composer registry → FAIL
missing evidence          → BLOCKED
tampered manifest         → FAIL
tampered contract         → FAIL
unauthorized placement    → FAIL
browser unavailable       → BLOCKED
brand violation           → FAIL
direct ILS implementation → FAIL
```

---

# 27. Very important: test the actual GitHub commit

This addresses exactly the problem we just encountered.

At the end of every wave:

```text
Agent working tree
      ↓
commit
      ↓
push
      ↓
GitHub
      ↓
independent verifier
      ↓
GitHub SHA
      ↓
tests
      ↓
evidence
```

The verifier must check:

```bash
git rev-parse HEAD
```

and compare it with:

```json
{
  "commitAfter": "..."
}
```

The final report should contain:

```json
{
  "repository": "skillupitacademy-alt/SUIA_RTH_SHC",
  "branch": "m2-project-llm-canonical-remediation",
  "head": "...",
  "verifiedAt": "...",
  "workingTree": "clean"
}
```

That prevents another situation where an agent says:

```text
f1e0718f completed
```

while GitHub cannot actually resolve the claimed commit.

---

# 28. Independent verification agents

After implementation, **do not let the same agents certify their own work**.

Use separate QA agents.

## Q01 — Architecture Auditor

Checks:

```text
one workflow authority
one approval authority
no CreationMode authority
no Mix & Match creation authority
no frontend workflow engine
```

## Q02 — Evidence Auditor

Checks:

```text
every PASS has evidence
every evidence references commit
no stale evidence
no fabricated PASS
```

## Q03 — Playwright Auditor

Runs the canonical E2E.

## Q04 — Frontend/Backend Contract Auditor

Checks:

```text
GUI → FastAPI
FastAPI → canonical state
no hardcoded state
no fake certification
```

## Q05 — GitHub Final Auditor

This is the most important.

It independently reads GitHub HEAD and produces:

```text
VERIFIED
PARTIAL
FAIL
BLOCKED
```

Only after Q05 passes should we consider merge.

---

# 29. Parallel/sequential dependency graph

The entire program becomes:

```text
W0
B01
 │
 ▼
W1
 ├── B02 Repository Boundary
 ├── B03 Target Binding
 ├── B04 Legacy Workflow
 └── B05 Evidence
 │
 ▼
W2
B06 Engineering Contract
 │
 ▼
W3
 ├── B07 Candidate Intake
 └── B08 Canonical Comparator
          │
          ▼
        B09 Placement
 │
 ▼
W4
 ├── B10 Human Approval
 └── B11 RepositoryAdapter
 │
 ▼
W5
 ├── B12 Certification
 ├── B13 Runtime
 ├── B14 Browser
 └── Composer Verification
 │
 ▼
W6
B15 Final Gate
 │
 ▼
Golden E2E
 │
 ▼
W7
 ├── G01 API
 ├── G02 Dashboard
 ├── G03 Compliance
 ├── G04 External AI
 ├── G05 Candidate
 ├── G06 Certification
 └── G07 Workflow Details
          │
          ▼
       G08 E2E
          │
          ▼
        Q01-Q05
          │
          ▼
      HUMAN REVIEW
          │
          ▼
         MERGE
```

---

# 30. What should NOT happen

Do **not** let agents:

```text
❌ create a second workflow engine
❌ create a second Playwright stack
❌ create another Composer
❌ create another ILS system
❌ create another LSNB system
❌ create another RSSB system
❌ invent a new block architecture
❌ hard-code PASS
❌ hard-code CERTIFIED
❌ infer target version
❌ scan repository independently from Python
❌ mutate main branch directly
❌ create duplicate documentation
❌ create duplicate evidence ledgers
❌ declare success based on local working tree only
```

---

# 31. Documentation policy

For the documentation problem we discussed, make this a **global agent policy**:

```text
DOCUMENTATION CANONICAL-ARTIFACT RULE

Before creating any documentation:

1. Search existing Project LLM documentation.
2. Identify the canonical artifact.
3. Update or append to it when possible.
4. Do not create duplicate architecture documents.
5. Create a new document only when:
   a. the existing artifact cannot represent the information, and
   b. the agent records why.
6. Evidence artifacts may be generated per workflow/run because
   they are immutable execution records, not duplicate architecture docs.
```

That distinction is important:

```text
Architecture documentation
→ update canonical document

Execution evidence
→ new immutable run evidence
```

So creating:

```text
.agents/evidence/runs/WF-123/...
```

is legitimate.

Creating:

```text
PROJECT_AI_ARCHITECTURE_FINAL_V2.md
PROJECT_AI_ARCHITECTURE_FINAL_V3.md
PROJECT_AI_ARCHITECTURE_LATEST.md
```

is not.

---

# 32. The master instruction I recommend sending to Project AI

You can give the Project AI multi-agent orchestrator this:

```text
PROJECT LLM M2.9 CANONICAL IMPLEMENTATION PROGRAM

Repository:
skillupitacademy-alt/SUIA_RTH_SHC

Target branch:
m2-project-llm-canonical-remediation

MISSION

Implement the agreed Project LLM architecture completely and truthfully.

The repository is the authority.
Agent completion reports are not evidence.

DO NOT declare PASS unless:
1. source implementation exists,
2. canonical execution path uses it,
3. tests prove it,
4. evidence is generated from the current commit,
5. the commit is pushed to GitHub.

Missing evidence = BLOCKED.

GLOBAL RULES

1. Search before creating.
2. Reuse/update canonical artifacts.
3. Do not create duplicate architecture documentation.
4. Do not create a second workflow authority.
5. Do not create a second Playwright stack.
6. Do not create duplicate ILS/LSNB/RSSB systems.
7. Do not hard-code PASS.
8. Do not hard-code CERTIFIED.
9. Do not infer target family/version.
10. Python Project AI must consume TypeScript repository snapshots/evidence;
    it must not independently scan the repository.
11. Human approval is mandatory where defined.
12. AI plan is not human approval.
13. Implementation is not certification.
14. CERTIFICATION_READY is not CERTIFIED.
15. Preserve correct existing implementation.
16. Make the smallest architectural patch necessary.
17. Do not blindly change tests to obtain green status.
18. Classify test failures before modifying them.
19. Commit and push every completed wave.
20. An independent verification agent must verify GitHub after every major wave.

WAVE 0

B01:
Freeze CanonicalWorkflowState and transitions.

STOP if another lifecycle authority remains executable.

WAVE 1

Run B02-B05 in parallel:

B02:
Enforce repository snapshot/evidence boundary.

B03:
Enforce explicit WorkflowTarget and CandidateBinding.

B04:
Reconcile CreationMode, CreationWorkflow, WorkflowStatus,
legacy /creation routes, and WorkflowEngine.
Do not delete blindly; classify all references.

B05:
Implement immutable evidence run ledger.

STOP FOR REVIEW.

WAVE 2

B06:
Implement repository-derived EngineeringContract.

The external AI must be able to implement the requested block
without prior project knowledge.

The contract must include:
target,
canonical patterns,
types,
schemas,
renderer,
Composer,
registry,
UBRC,
runtime,
theme,
brand,
ILS,
LSNB,
RSSB,
tests,
acceptance criteria,
prohibited behavior,
repository evidence,
contract hash.

STOP FOR REVIEW.

WAVE 3

B07:
Real candidate upload and server-side hashing.

B08:
Wire Agent 7 to CanonicalComparator.

B09:
Generate deterministic target-bound placement manifest.

No hard-coded block version.

STOP FOR REVIEW.

WAVE 4

B10:
Human implementation approval.

B11:
RepositoryAdapter with:
path allowlists,
isolated worktree,
dry-run manifest,
approved operation registry.

No arbitrary shell execution.

STOP FOR REVIEW.

WAVE 5

B12:
Wire real certification gates.

B13:
Wire real runtime verification.

B14:
Wire real existing Playwright infrastructure.

Composer verification must be real.

A browser-unavailable result is BLOCKED,
never PASS.

STOP FOR REVIEW.

WAVE 6

B15:
Wire FinalGateAgent.

Rules:

missing evidence → BLOCKED
any FAIL → FAIL
any BLOCKED → BLOCKED
all required gates PASS → CERTIFICATION_READY

Human Gate 2 required before CERTIFIED.

Run the canonical end-to-end test and negative tests.

STOP FOR REVIEW.

WAVE 7

Only after backend freeze:

Connect the existing SkillHubCore Admin Project LLM GUI to FastAPI.

Remove hard-coded workflow/certification state.

Remove frontend workflow authority.

The GUI must be a view/control surface over backend state.

Run frontend/backend integration tests.

FINAL QA

Q01 architecture audit
Q02 evidence audit
Q03 Playwright audit
Q04 frontend/backend contract audit
Q05 independent GitHub HEAD audit

Q05 must verify the actual GitHub branch and commit.

FINAL REPORT

Produce:
1. GitHub branch
2. GitHub HEAD SHA
3. wave commits
4. changed files
5. tests
6. evidence paths
7. PASS/PARTIAL/FAIL/BLOCKED matrix
8. known limitations
9. unresolved blockers
10. certification verdict

Do not say READY FOR MERGE unless Q01-Q05 independently pass.
```

---

# 33. How I would run this with Kiro + Gemini

The ownership should remain:

| Work | Owner |
|---|---|
| Python/FastAPI | **Kiro** |
| Agent orchestration | **Kiro** |
| Engineering Contract | **Kiro** |
| Candidate pipeline | **Kiro** |
| Certification | **Kiro** |
| Runtime verification | **Kiro** |
| Playwright backend integration | **Kiro** |
| Evidence ledger | **Kiro** |
| React/Next GUI | **Gemini** |
| FastAPI client | **Gemini** |
| Dashboard | **Gemini** |
| Candidate UI | **Gemini** |
| Certification UI | **Gemini** |
| Workflow UI | **Gemini** |
| GUI E2E | **Gemini + independent QA** |
| Final GitHub audit | **Independent agent** |

And **Gemini should not start the frontend integration until Kiro's backend contract is frozen**.

---

# 34. What I will be able to review from GitHub afterward

Yes — this is exactly the right idea.

Once the agents push everything, we can independently inspect GitHub and verify:

```text
branch
HEAD SHA
commit ancestry
changed files
Python source
TypeScript source
React source
FastAPI routes
workflow transitions
candidate binding
contract generation
placement
approval
certification
Playwright
Composer integration
evidence
test reports
```

Then I can produce a matrix like:

| Requirement | GitHub implementation | Test | Evidence | Status |
|---|---|---|---|---|
| Canonical workflow | actual source | unit | EV-001 | PASS |
| Snapshot-only Python | actual source | boundary test | EV-002 | PASS |
| Target version | actual source | binding test | EV-003 | PASS |
| External AI contract | actual source | contract test | EV-004 | PASS |
| Candidate upload | actual source | integration | EV-005 | PASS |
| Comparator | actual DAG | integration | EV-006 | PASS |
| Placement | actual adapter | E2E | EV-007 | PASS |
| Composer | actual registry/render | E2E | EV-008 | PASS |
| Runtime | actual renderer/runtime | E2E | EV-009 | PASS |
| Browser | actual Playwright | E2E | EV-010 | PASS |
| Final gate | actual final gate | E2E | EV-011 | PASS |
| GUI → FastAPI | actual API calls | Playwright | EV-012 | PASS |

That gives us **GitHub-verifiable implementation**, rather than trusting an agent's “completed successfully” message.

The source audit already supports the conclusion that the existing foundation is substantial, but the critical missing work is canonical wiring, repository-derived contract generation, explicit target/version propagation, real verification, and frontend/backend integration. project-llm-front-back-alignmen…

**I would start with W0 only, then stop and inspect its actual GitHub commit before allowing W1 to execute.** That prevents us from repeating the current M2.9 synchronization problem.

Yes. **That is the right operating model.** We should let the Project AI multi-agent workflow execute the remaining work end-to-end, but with **strict sequential wave gates** and **parallelized specialist agents inside each wave where dependencies allow**.

The important point is: **do not stop for our review after every small implementation task.** Let the Project AI model implement → test → review → document → commit → gate each wave, then automatically launch the next wave **only if the previous wave passes its hard gate**.

At the end, we review the complete GitHub implementation and evidence set together.

## Final execution strategy

```text
W4-R1 Security Remediation
        │
        ├── implementation agents ─┐
        ├── security agents ───────┤ parallel
        ├── test agents ───────────┤
        └── evidence agents ───────┘
                    │
               HARD GATE
                    │
                    ▼
W5 Repository Placement
        │
        ├── RepositoryAdapter ─────┐
        ├── path/security ─────────┤
        ├── placement executor ────┤ parallel
        ├── tests ─────────────────┤
        └── evidence ──────────────┘
                    │
               HARD GATE
                    │
                    ▼
W6 Verification + Certification
        │
        ├── runtime verification ──┐
        ├── browser/Playwright ────┤
        ├── brand/theme ───────────┤ parallel
        ├── Composer ──────────────┤
        ├── certification gates ───┤
        └── integration tests ─────┘
                    │
               HARD GATE
                    │
                    ▼
W7 Final Gate + HAA
        │
        ├── final-gate authority
        ├── evidence reconciliation
        ├── certification authority
        ├── Golden E2E
        └── final documentation
                    │
               HARD GATE
                    │
                    ▼
              CERTIFIED
```

### Why parallel inside a wave but sequential between waves?

Because, for example, W6 runtime, browser, Composer and brand/theme verification are largely separable implementation domains. They can be developed/tested concurrently.

But W6 **depends on W5 actually placing the candidate**, so W6 cannot safely start before W5 passes.

Likewise W7 must consume the complete W6 evidence bundle.

---

# One important correction to the previous W4 status

We should treat the current state as:

```text
W0  PASS
W1  PASS
W2  PASS
W3  PASS
W4  IMPLEMENTED
W4  GATE = PASS
W4  INDEPENDENT REVIEW = CHANGES_REQUESTED
```

Therefore the next wave is technically:

**W4-R1 → W5 → W6 → W7**

not simply W5.

The Project AI must repair the three W4 findings before W5.

---

# Master prompt to launch the complete remaining pipeline

Give this to the Project AI model:

```text
M2.9 FINAL SEQUENTIAL EXECUTION
W4-R1 → W5 → W6 → W7
CONTROLLED MULTI-AGENT PRODUCTION PIPELINE

Repository:
skillupitacademy-alt/SUIA_RTH_SHC

Branch:
m2-project-ai-canonical-wiring

Current known HEAD:
9bd1bc6b

OBJECTIVE

Complete all remaining M2.9 implementation waves sequentially:

1. W4-R1 Security Remediation
2. W5 RepositoryAdapter / Safe Placement
3. W6 Runtime + Browser + Brand/Theme + Composer + Certification
4. W7 Final Gate + HAA + Golden E2E

The objective is not merely to make tests green.

The objective is to make the actual Project LLM architecture operational, evidence-bound, secure, and aligned with the canonical Project LLM requirements.

IMPORTANT OPERATING RULE

WAVES ARE STRICTLY SEQUENTIAL.

Do NOT begin W5 until W4-R1 independently passes.

Do NOT begin W6 until W5 independently passes.

Do NOT begin W7 until W6 independently passes.

Within each wave, use multiple specialist agents in parallel wherever their work has no dependency on another specialist.

After implementation agents finish, run independent review/test/evidence agents before declaring the wave PASS.

A wave PASS must be earned from implementation + tests + evidence + independent review.

Never trust a self-generated gate JSON by itself.

==================================================
GLOBAL ARCHITECTURAL RULES
==================================================

1. Canonical artifact rule

Before creating any file/document/report:

SEARCH EXISTING ARTIFACTS FIRST.

If an existing canonical artifact already covers the purpose:

UPDATE/APPEND IT.

Do NOT create duplicate markdown/json/report systems.

Every agent must follow this rule.

2. Python/FastAPI boundary

Python Project AI MUST NOT scan the repository directly.

Repository facts come from the TypeScript/Node discovery/snapshot layer.

Python consumes the canonical repository snapshot/evidence.

3. Canonical workflow authority

CanonicalWorkflowState is the only Project LLM lifecycle authority.

Do not introduce another workflow engine.

TaskState/legacy WorkflowStatus may exist only where backward compatibility is explicitly required and must not become another public lifecycle authority.

4. No fake PASS

Missing evidence = BLOCKED.

Unavailable browser = BLOCKED.

Unavailable runtime = BLOCKED.

Missing repository evidence = BLOCKED.

Missing approval = BLOCKED.

Missing hash = BLOCKED.

Never convert unavailable functionality into PASS.

5. No test weakening

Do NOT:
- add pytest.skip
- add xfail to hide failures
- mock away production behavior
- weaken assertions
- delete failing tests
- change expected security behavior simply to preserve old implementation

If a test conflicts with the canonical architecture, reconcile the test with the architecture and document why.

6. Human approval

AI implementation ≠ human approval.

AI plan ≠ human approval.

CERTIFICATION_READY ≠ CERTIFIED.

7. Repository mutation

No arbitrary shell execution.

No arbitrary filesystem mutation.

All repository writes must eventually pass through the approved RepositoryAdapter/operation boundary.

8. Evidence

Every meaningful operation must produce machine-readable evidence.

Every PASS must have evidence.

Every wave must have:
- preflight
- implementation evidence
- test evidence
- gate evidence
- independent review
- final commit SHA

9. GitHub

All implementation and testing reports must be committed and pushed to the current branch.

Do not leave final evidence only in the local workspace.

==================================================
W4-R1
SECURITY REMEDIATION
==================================================

FIRST ACTION:

Perform read-only preflight against actual GitHub HEAD.

Do not assume existing W4 reports are correct.

Inspect:
- ImplementationApproval
- canonical_workflow
- approval_checker
- governance approval endpoint
- W4 tests
- W4 evidence
- W4 gate
- W4 review

Confirmed findings to remediate:

FINDING 1:
Self-approval bypass when workflow_requester is missing.

Required behavior:

Missing authoritative workflow requester MUST fail closed.

Never fall back to:
approved_by != ""

Store/bind requester identity during approval creation or reject authorization when requester identity is unavailable.

Add regression tests.

FINDING 2:
Hash verification bypass.

Candidate SHA-256,
manifest ID,
manifest SHA-256,
and requester identity are security-critical.

They MUST NOT be optional.

Missing verification parameters MUST return BLOCKED/FAIL.

Add regression tests for every missing parameter.

FINDING 3:
Approval expiry contract.

Determine whether M2.9 requires expiry from existing canonical architecture.

If required:
implement explicit expiry and tests.

If not required:
remove contradictory expiry requirement from the authorization contract/documentation.

Do not leave ambiguous security semantics.

W4-R1 specialist agents:

Agent A:
security implementation

Agent B:
authorization/security test coverage

Agent C:
canonical workflow impact analysis

Agent D:
independent security reviewer

Agent E:
evidence/test report reconciliation

Agents A/B/C may work in parallel where safe.

D reviews after implementation.

E reconciles after tests.

W4-R1 HARD GATE:

PASS only if:
- all three findings resolved
- no authorization bypass remains
- W4 tests pass
- new security regression tests pass
- full relevant suite passes
- no new regression attributable to W4-R1
- evidence complete
- independent reviewer = PASS

If not PASS:
STOP.
Fix W4-R1.
Re-run gate.

Do not launch W5.

==================================================
W5
REPOSITORYADAPTER + SAFE PLACEMENT
==================================================

Only launch after W4-R1 PASS.

Run W5 preflight against the actual W4-R1 HEAD.

W5 objective:

Make repository placement a real, secure, approval-bound operation.

Parallel specialists:

Agent A:
RepositoryAdapter implementation.

Agent B:
path allowlist / traversal / extension / target validation.

Agent C:
isolated worktree / git mutation / dry-run / diff.

Agent D:
approval enforcement integration.

Agent E:
placement integration tests.

Agent F:
security review.

Agent G:
evidence/reporting.

Required behavior:

1. Placement MUST require valid ImplementationApproval.

2. Approval must bind:
- workflow ID
- candidate SHA-256
- manifest ID
- manifest SHA-256
- requester/approver separation

3. Manifest target paths are authoritative.

4. Candidate must NOT determine arbitrary destination paths.

5. Reject:
- ../ traversal
- absolute paths
- unallowlisted targets
- unexpected extensions
- family/version mismatch
- manifest/hash mismatch
- unauthorized operations

6. Use RepositoryAdapter.

7. Use isolated worktree.

8. Produce dry-run/diff evidence before mutation.

9. Execute only approved operations.

10. Record:
- source
- destination
- operation
- hashes
- manifest ID/hash
- approval ID
- worktree
- resulting commit SHA
- evidence IDs

11. Generate rollback information.

12. No direct filesystem mutation path may bypass RepositoryAdapter.

W5 tests:

- unit
- security
- path traversal
- allowlist
- authorization
- manifest tampering
- candidate tampering
- wrong target family/version
- worktree behavior
- dry-run
- actual placement
- rollback
- integration

Run complete Project AI suite.

Compare failures against the previous baseline.

No "pre-existing" claim without evidence.

W5 HARD GATE:

PASS only when:
- implementation complete
- RepositoryAdapter is authoritative
- approval enforcement is mandatory
- security tests pass
- placement integration passes
- evidence complete
- independent reviewer PASS

Otherwise STOP W5 and remediate.

==================================================
W6
RUNTIME + BROWSER + CERTIFICATION
==================================================

Only launch after W5 PASS.

W6 is the largest verification wave.

Parallel specialist agents:

Agent A:
runtime verification

Agent B:
Playwright/browser verification

Agent C:
UBRC verification

Agent D:
brand/theme verification

Agent E:
ILS verification

Agent F:
LSNB/RSSB verification

Agent G:
Tutorial Composer verification

Agent H:
certification gate integration

Agent I:
integration/regression testing

Agent J:
independent certification reviewer

Agent K:
evidence reconciliation

CRITICAL:

Browser verification MUST use real Playwright behavior.

Do NOT:
"browser unavailable -> PASS"

Correct:
"browser unavailable -> BLOCKED"

Runtime verification must actually exercise the relevant learner/tutorial route.

Verify:

- application startup
- health
- route availability
- block render
- DOM identity
- UBRC attributes
- ILS passive integration
- ActiveBlockContext behavior
- telemetry integration where applicable
- page-level LSNB/RSSB
- theme behavior
- brand independence
- Composer integration
- runtime console errors
- relevant network failures
- browser behavior

Use the existing repository browser/testing stack.

Do not create a second browser framework.

Certification gates must be REAL implementations and must be wired into the canonical workflow.

No generic stub handler may replace an existing real gate implementation.

No "simplified validation" PASS.

No graceful degradation.

Every certification PASS requires evidence.

W6 HARD GATE:

All required certification gates must be PASS with evidence.

Any missing evidence = BLOCKED.

Any runtime failure = FAIL/BLOCKED.

Any browser failure = FAIL/BLOCKED.

Any unavailable browser execution = BLOCKED.

Independent reviewer must PASS.

==================================================
W7
FINAL GATE + HAA + GOLDEN E2E
==================================================

Only launch after W6 PASS.

W7 specialists:

Agent A:
Final Gate authority reconciliation.

Agent B:
evidence aggregation.

Agent C:
HAA/final human certification boundary.

Agent D:
Golden E2E.

Agent E:
legacy authority detection.

Agent F:
final documentation/reporting.

Agent G:
independent final reviewer.

Final gate requirements:

There must be ONE authoritative final verdict.

No empty-gate PASS.

No evidence = BLOCKED.

Any FAIL = FAIL.

Any BLOCKED = BLOCKED.

Only complete PASS evidence can produce:

CERTIFICATION_READY

Then:

CERTIFICATION_READY
→ AWAITING_GATE_2
→ human approval
→ CERTIFIED

CERTIFICATION_READY MUST NEVER directly become CERTIFIED.

Golden E2E must prove the complete lifecycle:

REQUESTED
→ DISCOVERY
→ BRIEF_READY
→ AWAITING_GATE_1
→ GUI_APPROVED
→ CANDIDATE_REQUESTED
→ CANDIDATE_RECEIVED
→ CANDIDATE_AUDIT
→ INTEGRATION_PLANNED
→ AWAITING_IMPLEMENTATION_APPROVAL
→ IMPLEMENTING
→ IMPLEMENTED
→ VERIFYING
→ CERTIFICATION_READY
→ AWAITING_GATE_2
→ CERTIFIED

Every important transition must have evidence.

Verify that no legacy creation workflow or competing workflow engine can bypass the canonical lifecycle.

==================================================
TESTING REQUIREMENTS FOR EVERY WAVE
==================================================

For every wave record:

1. Exact test commands.
2. Total tests.
3. Passed.
4. Failed.
5. Skipped.
6. Errors.
7. Baseline failures.
8. New failures.
9. Coverage where available.
10. Security tests.
11. Integration tests.
12. E2E tests.
13. Browser tests where applicable.

Never report only "tests passed".

Save machine-readable JSON.

Save human-readable Markdown.

Commit both to GitHub.

==================================================
EVIDENCE REQUIREMENTS
==================================================

For each wave, search existing .agents/tasks artifacts.

Update canonical artifacts rather than creating duplicate systems.

At minimum maintain:

m2-9-WX-preflight
m2-9-WX-evidence
m2-9-WX-implementation-report
m2-9-WX-gate
m2-9-WX-review

Use the actual canonical naming/location already present in the repository.

Each evidence artifact must include:

- wave
- commit SHA
- parent SHA
- changed files
- implementation summary
- tests
- test command
- counts
- failures
- baseline comparison
- evidence IDs
- security results
- gate result
- reviewer result
- blockers
- next wave recommendation

==================================================
WAVE TRANSITION RULE
==================================================

After each wave:

1. Stop implementation.
2. Run full tests.
3. Run independent review.
4. Reconcile evidence.
5. Produce gate.
6. Verify GitHub commit.
7. Verify GitHub evidence files.
8. Only then launch the next wave.

Do NOT let an agent declare the next wave ready merely because its own implementation tests pass.

The gate must independently establish readiness.

==================================================
FINAL REPORT
==================================================

After W7 completes, create/update ONE canonical M2.9 final completion report.

It must contain:

- requirement-to-implementation matrix
- W0-W7 status
- commits
- changed files
- architecture compliance
- workflow lifecycle compliance
- security review
- testing summary
- complete regression status
- runtime verification
- browser verification
- Composer verification
- UBRC
- ILS
- LSNB/RSSB
- brand/theme
- human approval gates
- evidence completeness
- Golden E2E result
- remaining known issues
- technical debt
- exact GitHub HEAD
- final recommendation

Do not claim "production certified" merely because the tests pass.

Final status must distinguish:

IMPLEMENTED
TESTED
VERIFIED
CERTIFICATION_READY
HUMAN_APPROVED
CERTIFIED

==================================================
EXECUTION POLICY
==================================================

START NOW WITH W4-R1.

Do not ask for confirmation between waves.

Automatically proceed:

W4-R1
→ hard gate
→ W5
→ hard gate
→ W6
→ hard gate
→ W7
→ hard gate

If a wave fails:

STOP THAT WAVE.

Create the failure evidence.

Fix the failure.

Re-run the wave.

Continue only after PASS.

Do not skip failures.

Do not weaken tests.

Do not create duplicate documentation.

Do not create duplicate workflow authorities.

Do not create duplicate browser/testing systems.

Do not claim completion without GitHub-backed implementation and testing evidence.

At the end, leave the branch with all source changes, tests, reports, evidence, gate results and final M2.9 completion report committed and pushed.

The final GitHub repository must be sufficient for an independent reviewer to reconstruct:

REQUIREMENT
→ IMPLEMENTATION
→ TEST
→ EVIDENCE
→ REVIEW
→ GATE
→ FINAL E2E
→ CERTIFICATION
```

## And yes — after this completes, we review **once at the end**

That is the efficient approach you are proposing.

The Project AI model does the execution cycle:

**implement → test → independently review → document → commit → next wave**

Then I can cross-check the final GitHub state against the original Project LLM requirements and the complete evidence trail.

### What we should have at the end

| Area | Expected final evidence |
|---|---|
| W4 security | Code + security regression tests + review |
| W5 placement | RepositoryAdapter + authorization + placement tests |
| W6 runtime | Real runtime evidence |
| W6 browser | Real Playwright evidence |
| W6 Composer | Actual Composer verification |
| W6 UBRC | Evidence |
| W6 ILS | Evidence |
| W6 LSNB/RSSB | Evidence |
| W6 brand/theme | Evidence |
| W7 final gate | One authoritative final verdict |
| Golden E2E | REQUESTED → CERTIFIED evidence |
| Git history | Every implementation wave committed |
| Testing | Complete counts + failures + baseline comparison |
| Documentation | Canonical consolidated M2.9 report |
| Final review | Requirements ↔ implementation ↔ tests ↔ evidence |

So **yes: we don't need to manually interrupt every wave.** We let the multi-agent system run the controlled sequence, with hard gates preventing a defective wave from silently advancing.

The one thing I would **not** allow is "all waves launched simultaneously." **Sequential waves, parallel specialist agents within each wave** is the correct architecture for this project.

