Yes. Based on the current repository state, **Project LLM is not yet complete**. M1 and M2.1/M2.2 are substantially complete, but the core AI control-plane and runtime-verification layers are still pending.

I verified the current branch `m2-project-ai-foundation` at commit `1b105b2c...`. [Current M2 branch](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/tree/m2-project-ai-foundation?utm_source=chatgpt.com)

## Current completion status

| Area | Status | Remaining |
|---|---|---|
| M1 deterministic discovery | ✅ Complete | None for M1 gate |
| M2.1 Evidence lifecycle | ✅ Complete | Documentation cleanup |
| M2.2 Strict evidence binding | ✅ Code complete | Final documentation/reconciliation |
| M2.3 Real toolchain execution | 🔴 Pending | Implement |
| M2.4 Composer/API/schema depth | 🔴 Pending | Implement |
| M2.5 Full dependency graph | 🔴 Pending | Implement |
| M2.6 UBRC verification | 🔴 Pending | Implement |
| M2.7 Runtime/browser verification | 🔴 Pending | Implement |
| M2.8 Project AI + FastAPI | 🔴 Pending | Implement |
| Multi-agent orchestration | 🔴 Pending | Implement |
| Approval/gating system | 🔴 Pending | Implement |
| Candidate Block certification | 🔴 Pending | Later phase |
| I2 block creation/certification workflow | 🔴 Pending | Later phase |
| Final Project LLM certification | 🔴 Pending | Depends on all above |

The existing M2 backlog itself still lists M2.3–M2.7 as not implemented and M2.8 as not implemented. 

---

# 1. M2.1 — Evidence lifecycle

### Status: 🟢 Essentially complete

Already implemented:

- `EvidenceLifecycle = current | historical`
- schema version `1.1.0`
- current evidence missing → error
- current evidence hash mismatch → error
- historical evidence problems → warning
- deterministic evidence normalization
- duplicate evidence ID detection

### Still needed

Mostly **cleanup and reconciliation**, not another implementation.

The current M2 backlog contains stale historical statements saying M2.2 was blocked and that D2/D6 did not exist. Those statements should be corrected rather than creating another report.

This is particularly important because of your canonical-artifact rule:

> Do not create another `M2-status.md`, `M2-final-report.md`, etc.

Update the existing:

`.agents/tasks/m1-m2-backlog.md`

instead. The canonical-artifact policy already explicitly requires agents to update canonical artifacts instead of creating duplicate Markdown. 

---

# 2. M2.2 — Strict evidence binding

### Status: 🟢 Implementation complete

This is the most recently completed gate.

Implemented:

- `evidenceId` on the 11 entity types
- scanner propagation
- V1 enforcement
- V8 `evidenceById` lookup
- path compatibility validation
- kind validation
- missing/unknown evidence validation
- strict-binding tests
- integration tests
- deterministic evidence handling

Current HEAD is the Phase-G verification commit:

`1b105b2c303155ba422facac404b2436f3b55c39`

[M2.2 Phase-G commit](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/commit/1b105b2c303155ba422facac404b2436f3b55c39?utm_source=chatgpt.com)

### One thing still needed

The documentation needs to be corrected to reflect reality.

For example, the backlog currently says:

> M2.2 COMPLETE (2025-01-06)

but the actual current work is in 2026, and some of the audit text still describes the pre-M2.2 implementation.

So:

**Don't redo M2.2 code.**

Instead:

**Documentation reconciliation → M2.2 final status → gate closure.**

---

# 3. M2.3 — Real toolchain execution

### Status: 🔴 Pending

This is the next actual engineering gate.

Currently versions can be inferred from repository configuration.

Project LLM needs to verify the **actual installed/runtime toolchain**.

For example:

```text
Node declared:      20.x
Node actually runs: 20.x

pnpm declared:      9.x
pnpm actually runs: 9.x

TypeScript declared: 5.7.x
TypeScript actually runs: 5.7.x

Vitest declared: ...
Vitest actually runs: ...

Playwright declared: ...
Playwright actually runs: ...
```

### Required implementation

Extend:

```ts
RepositoryAdapter
```

with:

```ts
interface CommandResult {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface RepositoryAdapter {
  runCommand(
    command: string,
    args: string[],
    options?: {
      cwd?: string;
      timeoutMs?: number;
      env?: Record<string, string>;
    }
  ): Promise<CommandResult>;
}
```

Then create an **approved toolchain registry**.

Important security rule:

```text
AI Agent
   ↓
Approved Operation
   ↓
Tool Registry
   ↓
Validated Command
   ↓
RepositoryAdapter
   ↓
Execution
```

Not:

```text
AI → arbitrary shell command
```

### Gate output

Something like:

```json
{
  "tool": "node",
  "declaredVersion": "20.x",
  "actualVersion": "20.19.x",
  "command": "node --version",
  "passed": true,
  "evidenceId": "..."
}
```

---

# 4. M2.4 — Deep Composer/API/schema analysis

### Status: 🔴 Pending

This is a major gap.

The existing D4 implementation is still comparatively shallow.

Known weak areas include things equivalent to:

```ts
const method = 'POST';
```

and:

```ts
tables: []
```

and:

```ts
blocksUsed: []
```

Those values cannot remain placeholders in the final Project LLM architecture.

### Project LLM needs to discover

#### API

Actual:

```text
GET
POST
PUT
PATCH
DELETE
HEAD
OPTIONS
```

routes and handlers.

#### Composer

Actual:

```text
Composer service
    ↓
methods
    ↓
API
    ↓
schemas
    ↓
block selection
    ↓
rendering
```

#### Schema

Actual:

- Drizzle tables
- Zod schemas
- TypeScript contracts
- request/response types
- database relationships

#### UI

Actual:

```text
Composer UI
   ↓
imports
   ↓
block usage
   ↓
rendering
```

The scanner should never convert "unknown" into:

```ts
[]
```

just because it failed to discover something.

Better:

```text
UNKNOWN
UNABLE_TO_DETERMINE
NOT_PRESENT
```

depending on the semantic meaning.

---

# 5. M2.5 — Full dependency graph

### Status: 🔴 Pending

Current D5 is not yet the final dependency intelligence layer.

Project LLM eventually needs a directed graph:

```text
Application
   ↓
Package
   ↓
Workspace Package
   ↓
External Dependency
   ↓
Resolved Version
```

with edges such as:

```ts
interface DependencyEdge {
  from: string;
  to: string;

  kind:
    | 'dependency'
    | 'devDependency'
    | 'peerDependency';

  requestedVersion?: string;
  resolvedVersion?: string;

  evidenceId: string;
}
```

### Must resolve

1. workspace dependencies
2. workspace versions
3. external requested versions
4. lockfile versions
5. resolved versions
6. dependency edges
7. evidence for each relationship

This becomes important later for AI reasoning such as:

> "If I change package X, what applications/services/tests could be affected?"

---

# 6. M2.6 — UBRC structural verification

### Status: 🔴 Pending

This is particularly important for the educational block architecture.

Project LLM shouldn't merely discover:

```text
Block exists
```

It needs to verify the complete chain:

```text
Block Type
    ↓
Registry
    ↓
Renderer
    ↓
Data Block Version
    ↓
Runtime
```

For example:

```text
Introduction
   ↓
IntroductionBlock
   ↓
Block Registry
   ↓
Renderer
   ↓
data-block-version="..."
   ↓
Browser
```

### Findings should include

```text
UBRC_VALID
UBRC_MISSING
UBRC_VERSION_MISMATCH
UBRC_TYPE_MISMATCH
UBRC_REGISTRY_MISSING
UBRC_RENDERER_MISSING
```

This is a **structural certification gate**, not just another scanner.

---

# 7. M2.7 — Runtime/browser verification

### Status: 🔴 Pending

This is where Project LLM moves beyond:

> "The source code says it works."

to:

> "The application actually renders and behaves as claimed."

The intended sequence is:

```text
Project LLM
    ↓
start approved application
    ↓
health check
    ↓
navigate route
    ↓
locate block
    ↓
inspect DOM
    ↓
verify data-block-version
    ↓
verify content
    ↓
verify renderer
    ↓
capture runtime evidence
    ↓
stop application
```

Expected model:

```ts
interface RuntimeVerification {
  verificationId: string;
  target: string;
  route: string;
  blockType?: string;
  expected: unknown;
  observed: unknown;
  passed: boolean;
  evidenceIds: string[];
}
```

This becomes critical for future **Candidate Block certification**.

---

# 8. M2.8 — Python + FastAPI Project AI

### Status: 🔴 Pending

This is the largest architectural component still missing.

There is currently no:

```text
services/project-ai/
```

and no Python/FastAPI service in the repository.

That is intentional at this stage: deterministic repository intelligence should become trustworthy first.

## The architecture should become

```text
                ┌───────────────────────┐
                │     Project AI        │
                │ Python / FastAPI      │
                │ Reasoning + Agents    │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │ Snapshot + Evidence   │
                │ Graph / Query Layer   │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │ Deterministic        │
                │ Discovery Engine      │
                │ TS / Node             │
                └───────────┬───────────┘
                            │
                     Repository
```

### Python should own

- FastAPI
- workflow orchestration
- agents
- planning
- task state
- approvals
- AI/LLM calls
- reasoning
- semantic reconciliation
- evidence queries
- multi-agent coordination
- review
- governance

### TypeScript should remain responsible for

- filesystem discovery
- ts-morph
- package analysis
- dependency parsing
- Git
- evidence hashing
- deterministic snapshots
- validators
- serialization

So the principle is:

> **TypeScript = FACTS**  
> **Python = REASONING**

That boundary is important. We should **not rewrite the existing platform into Python/FastAPI**.

---

# 9. Project AI multi-agent orchestration

### Status: 🔴 Pending

Once FastAPI exists, the agents need to become real workflow participants.

The proposed agents are:

### Agent 0 — Gate Controller

Controls:

```text
M2.1
M2.2
M2.3
...
M2.8
```

and ultimately determines:

```text
M2_VERIFIED
```

---

### Agent 1 — Repository Contract Auditor

Checks:

- repository structure
- contracts
- existing architecture
- canonical artifacts
- ownership boundaries

---

### Agent 2 — Toolchain Agent

Owns M2.3:

- Node
- pnpm
- Turbo
- TypeScript
- Vitest
- Playwright

---

### Agent 3 — Composer/API/Schema Agent

Owns M2.4.

---

### Agent 4 — Dependency Graph Agent

Owns M2.5.

---

### Agent 5 — UBRC Agent

Owns M2.6.

---

### Agent 6 — Runtime/Browser Agent

Owns M2.7.

---

### Agent 7 — Evidence/Reconciliation Agent

Ensures:

```text
claim
 ↓
entity
 ↓
evidenceId
 ↓
evidence
 ↓
source
```

is consistent.

---

### Agent 8 — Test/Validation Agent

Runs:

- unit tests
- integration tests
- type checking
- deterministic snapshot checks
- schema validation
- V1–V9 validation
- Python tests
- runtime tests

---

### Agent 9 — Project AI/FastAPI Agent

Owns M2.8.

---

### Agent 10 — Documentation/Canonical Artifact Agent

Very important given your instruction.

This agent **must not continuously create new Markdown files**.

It must:

```text
Search
 ↓
Find canonical artifact
 ↓
Update/append it
 ↓
Record status
```

The repository already has the canonical-artifact policy explicitly applying this rule to all Project AI agents. 

---

# 10. Approval and governance layer

### Status: 🔴 Pending

This is not merely an AI chatbot.

Project LLM needs explicit workflow states:

```text
CREATED
   ↓
DISCOVERY
   ↓
PLANNING
   ↓
WAITING_FOR_APPROVAL
   ↓
IMPLEMENTING
   ↓
TESTING
   ↓
VERIFYING
   ↓
COMPLETED
```

With terminal/error states:

```text
FAILED
BLOCKED
REJECTED
CANCELLED
```

Most importantly:

```text
AI PLAN ≠ APPROVAL
```

and:

```text
IMPLEMENTATION ≠ CERTIFICATION
```

The AI should not approve its own implementation.

---

# 11. Evidence graph/query layer

### Status: 🟠 Partially built, not complete

The evidence system exists, but the future Project AI needs a usable semantic query layer.

For example:

```text
"What proves this component exists?"
```

→ evidence

```text
"Which block renderer implements Introduction?"
```

→ evidence graph

```text
"What changed if IntroductionBlock.tsx changes?"
```

→ dependency graph + evidence

```text
"Which tests prove this block works?"
```

→ test evidence

```text
"Was this block verified in the browser?"
```

→ runtime verification evidence

This is what turns the snapshot into **repository intelligence** rather than merely a JSON dump.

---

# 12. Candidate Block workflow

### Status: 🔴 Pending / later phase

This is the next major capability after the M2 foundation.

The intended flow is:

```text
External AI
    ↓
HTML/CSS/JS/JSON concept
    ↓
Project AI analyzes repository
    ↓
Find canonical block family
    ↓
Determine required version
    ↓
Generate implementation checklist
    ↓
Human approval
    ↓
External AI implements React/TS block
    ↓
Project AI verifies
```

Project AI then verifies:

```text
Implementation
      +
Type contract
      +
Schema/data contract
      +
Registry
      +
Renderer
      +
Composer compatibility
      +
Tests
      +
Runtime
      +
Evidence
      +
Brand independence
```

Only then:

```text
Candidate Block → CERTIFIED
```

---

# 13. I2 / Introduction creation workflow

### Status: 🔴 Pending

This is downstream of the foundation.

The `I2` work should **not create another arbitrary Markdown file** merely to document the Introduction block.

The canonical block corpus registry should remain the source for block-family information, and existing implementation/test/docs artifacts should be extended where appropriate.

The eventual I2 flow should be:

```text
I2 request
   ↓
Project AI discovers current Introduction family
   ↓
Reads canonical registry
   ↓
Reads existing implementation
   ↓
Reads existing tests
   ↓
Reads evidence
   ↓
Checks version
   ↓
Checks UBRC
   ↓
Checks Composer compatibility
   ↓
Creates implementation plan
   ↓
Approval
   ↓
Implementation
   ↓
Tests
   ↓
Browser verification
   ↓
Evidence
   ↓
Certification
```

---

# 14. Deterministic vs AI boundary

### Status: 🔴 Needs final implementation

This is one of the most important remaining architectural tasks.

We should lock the boundary as:

```text
                 PROJECT LLM
                      │
          ┌───────────┴───────────┐
          │                       │
    DETERMINISTIC             AI REASONING
       LAYER                      LAYER
          │                       │
 TypeScript / Node           Python / FastAPI
          │                       │
          ▼                       ▼
 Filesystem                 Planning
 AST                        Agents
 Packages                   LLM
 Dependencies               Decisions
 Git                        Reconciliation
 Evidence                   Workflow
 Tests                      Approvals
 Runtime facts              Semantic analysis
```

The AI must **not become the source of repository truth**.

---

# 15. Final Project LLM certification

### Status: 🔴 Pending

At the end we need one final gate.

Something equivalent to:

```text
PROJECT_LLM_CERTIFIED
```

only when all required gates pass.

### Required final checks

```text
M1                         PASS
M2.1                       PASS
M2.2                       PASS
M2.3                       PASS
M2.4                       PASS
M2.5                       PASS
M2.6                       PASS
M2.7                       PASS
M2.8                       PASS

TypeScript tests           PASS
Python tests               PASS
Type checks                PASS
Snapshot determinism       PASS
Evidence integrity         PASS
UBRC verification          PASS
Runtime verification       PASS
Canonical documentation    PASS
Workflow governance        PASS
```

Only then:

```text
                    ┌──────────────────────┐
                    │ PROJECT LLM          │
                    │ CERTIFIED            │
                    └──────────────────────┘
```

---

# The practical remaining roadmap

I would therefore treat the project as being at approximately this point:

```text
                    PROJECT LLM

M1 Foundation        ████████████████████ 100%
M2.1 Evidence        ████████████████████ 100%
M2.2 Binding         ████████████████████ 100%

M2.3 Toolchain       ░░░░░░░░░░░░░░░░░░░░   0%
M2.4 Composer        ░░░░░░░░░░░░░░░░░░░░   0%
M2.5 Dependencies    ░░░░░░░░░░░░░░░░░░░░   0%
M2.6 UBRC            ░░░░░░░░░░░░░░░░░░░░   0%
M2.7 Runtime         ░░░░░░░░░░░░░░░░░░░░   0%
M2.8 FastAPI         ░░░░░░░░░░░░░░░░░░░░   0%

Multi-agent system   ░░░░░░░░░░░░░░░░░░░░   0%
Governance           ░░░░░░░░░░░░░░░░░░░░   0%
Candidate Blocks     ░░░░░░░░░░░░░░░░░░░░   0%
I2 certification     ░░░░░░░░░░░░░░░░░░░░   0%
Final certification  ░░░░░░░░░░░░░░░░░░░░   0%
```

**The important point is that we should not jump straight to I2 or Candidate Block implementation yet.** The deterministic foundation needs to finish first, particularly **M2.3–M2.7**, because FastAPI/agents should reason over trustworthy evidence rather than independently rediscovering the repository.

## Recommended execution order

```text
1. Clean M2.1/M2.2 canonical documentation
                 ↓
2. M2.3 Toolchain execution
                 ↓
3. M2.4 Composer/API/schema depth
        +
   M2.5 Dependency graph
                 ↓
4. M2.6 UBRC verification
                 ↓
5. Evidence reconciliation
                 ↓
6. M2.7 Runtime/browser verification
                 ↓
7. Full deterministic M2 validation
                 ↓
8. M2.8 Python/FastAPI
                 ↓
9. Multi-agent orchestration
                 ↓
10. Approval/governance
                 ↓
11. Candidate Block workflow
                 ↓
12. I2 workflow
                 ↓
13. Final Project LLM certification
```

**So the immediate next engineering target is M2.3, not I2.** And before implementation begins, the stale M2 backlog should be reconciled so the Project AI agents have one authoritative status source.

 

Yes. I would now treat the discussion above as the **complete Project LLM implementation blueprint**, with one important architectural principle:

> **TypeScript/Node remains the deterministic repository-facts engine. Python/FastAPI becomes the Project AI orchestration/reasoning/control-plane layer. External AI is an implementation worker; Project AI is the evidence-driven authority and certification gate.**

That is consistent with the supplied project material, which explicitly separates deterministic D1–D8 discovery from the future Python/FastAPI Project AI layer and defines Candidate Block certification around implementation, contracts, registry, renderer, Composer, tests, runtime, evidence, and brand independence. Implement GitHub Evidence Explain I2 Creation Files

Below is the implementation specification I recommend.

---

# 1. Final Project LLM architecture

```text
                              USER
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React / Next.js UI  │
                    │ Project AI Console  │
                    └──────────┬──────────┘
                               │ HTTP
                               ▼
                 ┌────────────────────────────┐
                 │     Project AI Service     │
                 │      Python / FastAPI      │
                 │                            │
                 │ Workflow Engine            │
                 │ Agent Registry             │
                 │ Gate Controller            │
                 │ Approval Engine            │
                 │ AI/LLM Reasoning           │
                 │ Evidence Query             │
                 │ Candidate Certification    │
                 └─────────────┬──────────────┘
                               │
                ┌──────────────┼───────────────┐
                │              │               │
                ▼              ▼               ▼
        Snapshot API     Evidence API    Runtime API
                │              │               │
                └──────────────┼───────────────┘
                               ▼
              ┌────────────────────────────────┐
              │ project-llm-discovery          │
              │ TypeScript / Node              │
              │                                │
              │ D1 Structure                   │
              │ D2 Runtime                     │
              │ D3 Blocks                      │
              │ D4 Composer                    │
              │ D5 Dependencies                │
              │ D6 Tests                       │
              │ D7 Snapshot                    │
              │ D8 Validation                  │
              │                                │
              │ Evidence + hashes              │
              │ Deterministic serialization    │
              └────────────────┬───────────────┘
                               │
                               ▼
                         Git Repository
```

This preserves the existing React/Next.js/Node/Hono product architecture rather than introducing Python into the product runtime. The supplied architecture material specifically recommends keeping D1–D8 deterministic TypeScript/Node and placing FastAPI above it. Implement GitHub Evidence

---

# 2. Completion roadmap

The remaining implementation should be divided into these gates:

```text
M1                 COMPLETE
 │
 ▼
M2.1 Evidence      COMPLETE
 │
 ▼
M2.2 Binding       COMPLETE
 │
 ▼
M2.3 Toolchain     IMPLEMENT
 │
 ▼
M2.4 Composer      IMPLEMENT
 │
 ▼
M2.5 Dependencies  IMPLEMENT
 │
 ▼
M2.6 UBRC          IMPLEMENT
 │
 ▼
Evidence           RECONCILE
 │
 ▼
M2.7 Runtime       IMPLEMENT
 │
 ▼
M2 deterministic   FINAL GATE
 │
 ▼
M2.8 FastAPI       IMPLEMENT
 │
 ▼
Multi-agent        IMPLEMENT
 │
 ▼
Governance         IMPLEMENT
 │
 ▼
Candidate Block    IMPLEMENT
 │
 ▼
I2 workflow        IMPLEMENT
 │
 ▼
Final certification
```

---

# 3. Global rule for every Project AI agent

This is critical.

Every agent should receive the same base system instruction.

```text
PROJECT AI GLOBAL ENGINEERING POLICY

1. Repository facts are authoritative.
2. The current snapshot is authoritative for discovered repository facts.
3. Evidence records are authoritative for claims about source artifacts.
4. Never invent repository facts.
5. Never infer implementation success merely because a file exists.
6. Before creating any artifact:
   a. Search repository.
   b. Search snapshot.
   c. Search evidence.
   d. Find existing artifact serving the purpose.
   e. Identify canonical artifact.
7. Prefer updating/extending the canonical artifact.
8. Never create duplicate Markdown for convenience.
9. Never create duplicate plans, specifications, registries, tests,
   implementations, or reports when an existing canonical artifact
   can be extended.
10. Create a new artifact only when:
    a. no suitable canonical artifact exists, or
    b. architecture explicitly requires a separate artifact.
11. If a new artifact is required, record why the canonical artifact
    could not be extended.
12. Do not silently change another agent's contract.
13. Do not approve your own implementation.
14. Do not treat AI reasoning as repository evidence.
15. Do not execute arbitrary shell commands.
16. Use only approved repository operations.
17. Preserve deterministic ordering.
18. Preserve evidence IDs.
19. Never modify the main branch directly.
20. Every gate must produce machine-readable results.
21. A compilation pass is not equivalent to certification.
22. Runtime certification requires runtime evidence.
23. Candidate Block certification requires all required gates.
```

The canonical-artifact policy already established in the repository explicitly applies to repository, architecture, implementation, test, documentation, planning, review, migration, release, and orchestration agents. Explain I2 Creation Files

---

# 4. Agent architecture

I recommend **12 Project AI workflow agents**.

```text
AGENT-00  Master Gate Controller
AGENT-01  Repository Contract Auditor
AGENT-02  Toolchain Agent
AGENT-03  Composer/API/Schema Agent
AGENT-04  Dependency Graph Agent
AGENT-05  UBRC Agent
AGENT-06  Evidence/Reconciliation Agent
AGENT-07  Runtime/Browser Agent
AGENT-08  Test/Validation Agent
AGENT-09  Project AI/FastAPI Agent
AGENT-10  Governance/Approval Agent
AGENT-11  Canonical Documentation Agent
```

Then an additional **future Candidate Block workflow** uses these same agents rather than creating a completely separate AI system.

---

# 5. Agent 00 — Master Gate Controller

This is the only agent allowed to declare:

```text
M2_VERIFIED
PROJECT_LLM_CERTIFIED
CANDIDATE_BLOCK_CERTIFIED
```

### Python

```python
from enum import Enum
from pydantic import BaseModel, Field


class GateStatus(str, Enum):
    BLOCKED = "BLOCKED"
    READY = "READY"
    RUNNING = "RUNNING"
    WAITING_APPROVAL = "WAITING_APPROVAL"
    PASSED = "PASSED"
    FAILED = "FAILED"


class GateResult(BaseModel):
    gate_id: str
    status: GateStatus

    required_commits: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)

    test_results: list[str] = Field(default_factory=list)
    validation_results: list[str] = Field(default_factory=list)

    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    verified_at: str | None = None
```

Controller:

```python
class GateController:

    REQUIRED_GATES = (
        "M2.1",
        "M2.2",
        "M2.3",
        "M2.4",
        "M2.5",
        "M2.6",
        "M2.7",
        "M2.8",
    )

    def can_complete_m2(
        self,
        results: dict[str, GateResult],
    ) -> bool:

        for gate_id in self.REQUIRED_GATES:
            result = results.get(gate_id)

            if result is None:
                return False

            if result.status != GateStatus.PASSED:
                return False

        return True
```

No LLM should be allowed to override this.

---

# 6. Agent 01 — Repository Contract Auditor

Before every major gate:

```text
Repository
    ↓
Snapshot
    ↓
Evidence
    ↓
Canonical artifacts
    ↓
Existing implementation
    ↓
Agent scope
```

It answers:

```text
What already exists?
What is canonical?
What is missing?
What can be extended?
What must be created?
```

### Output

```python
class RepositoryAudit(BaseModel):
    gate_id: str
    canonical_artifacts: list[str]
    existing_implementations: list[str]
    existing_tests: list[str]
    missing_capabilities: list[str]
    conflicts: list[str]
    recommended_changes: list[str]
```

This agent prevents the project from turning into:

```text
M2-plan.md
M2-plan-v2.md
M2-final-plan.md
M2-agent-plan.md
M2-agent-plan-final.md
```

Instead, the canonical M2 backlog gets updated.

---

# 7. Agent 02 — M2.3 Toolchain Agent

## Objective

Replace configuration-only version assumptions with actual execution.

### TypeScript contract

```ts
export interface CommandResult {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface RepositoryAdapter {
  runCommand(
    command: string,
    args: string[],
    options?: {
      cwd?: string;
      timeoutMs?: number;
      env?: Record<string, string>;
    }
  ): Promise<CommandResult>;
}
```

### Approved operations

```ts
export type ApprovedOperation =
  | 'node_version'
  | 'pnpm_version'
  | 'turbo_version'
  | 'tsc_version'
  | 'vitest_version'
  | 'playwright_version';
```

Registry:

```ts
const TOOLCHAIN_COMMANDS: Record<
  ApprovedOperation,
  { command: string; args: string[] }
> = {
  node_version: {
    command: 'node',
    args: ['--version'],
  },

  pnpm_version: {
    command: 'pnpm',
    args: ['--version'],
  },

  turbo_version: {
    command: 'pnpm',
    args: ['exec', 'turbo', '--version'],
  },

  tsc_version: {
    command: 'pnpm',
    args: ['exec', 'tsc', '--version'],
  },

  vitest_version: {
    command: 'pnpm',
    args: ['exec', 'vitest', '--version'],
  },

  playwright_version: {
    command: 'pnpm',
    args: ['exec', 'playwright', '--version'],
  },
};
```

### Critical security boundary

Never:

```text
LLM → shell
```

Instead:

```text
LLM
 ↓
ApprovedOperation
 ↓
ToolchainRegistry
 ↓
RepositoryAdapter
 ↓
Command
```

### Evidence

```ts
export interface ToolchainVerification {
  operation: ApprovedOperation;
  declaredVersion?: string;
  actualVersion?: string;
  command: string;
  exitCode: number;
  passed: boolean;
  evidenceId?: string;
}
```

---

# 8. Agent 03 — M2.4 Composer/API/Schema Agent

This agent must eliminate shallow D4 results.

## API discovery

```ts
const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;
```

Discover actual method usage through AST/source analysis.

```ts
interface ComposerAPI {
  endpoint: string;
  method: string;
  handler: string;
  evidenceId: string;
}
```

Do not do this:

```ts
method: 'POST'
```

unless source evidence actually proves POST.

---

## Schema discovery

```ts
interface ComposerSchema {
  name: string;
  path: string;
  tables: string[];
  evidenceId: string;
}
```

Discover:

- Drizzle tables
- Zod schemas
- TypeScript types
- request contracts
- response contracts

Do not fabricate:

```ts
tables: []
```

when analysis simply failed.

Use explicit semantic state:

```ts
type DiscoveryState =
  | 'DISCOVERED'
  | 'NOT_PRESENT'
  | 'UNKNOWN'
  | 'UNABLE_TO_DETERMINE';
```

---

## UI block usage

Inspect:

```text
imports
JSX
registry references
renderer references
block configuration
```

and generate actual:

```ts
blocksUsed
```

---

# 9. Agent 04 — M2.5 Dependency Graph Agent

The dependency graph becomes:

```text
Package A
   │
   ├── dependency → Package B
   │
   ├── devDependency → Package C
   │
   └── peerDependency → Package D
```

### Contract

```ts
export interface DependencyEdge {
  from: string;
  to: string;

  kind:
    | 'dependency'
    | 'devDependency'
    | 'peerDependency';

  requestedVersion?: string;
  resolvedVersion?: string;

  evidenceId: string;
}
```

### Pipeline

```text
package.json
    ↓
workspace graph
    ↓
requested versions
    ↓
lockfile
    ↓
resolved versions
    ↓
directed graph
    ↓
evidence
```

This allows Project AI eventually to answer:

> "If I change this block package, what could be affected?"

---

# 10. Agent 05 — M2.6 UBRC Agent

UBRC verification should become a formal structural gate.

```text
Block
 ↓
Type
 ↓
Registry
 ↓
Renderer
 ↓
data-block-version
 ↓
Runtime
```

### Result model

```ts
export type UBRCFinding =
  | 'UBRC_VALID'
  | 'UBRC_MISSING'
  | 'UBRC_VERSION_MISMATCH'
  | 'UBRC_TYPE_MISMATCH'
  | 'UBRC_REGISTRY_MISSING'
  | 'UBRC_RENDERER_MISSING';

export interface UBRCVerification {
  blockType: string;
  implementationPath: string;
  registryPath?: string;
  rendererPath?: string;
  declaredVersion?: string;
  runtimeVersion?: string;
  finding: UBRCFinding;
  evidenceIds: string[];
}
```

Important:

```text
renderer exists ≠ UBRC verified
```

The complete chain must be established.

---

# 11. Agent 06 — Evidence/Reconciliation Agent

This becomes the central evidence authority.

It verifies:

```text
Claim
 ↓
Entity
 ↓
evidenceId
 ↓
Evidence record
 ↓
Path
 ↓
Hash
 ↓
Kind
 ↓
Source
```

### Python model

```python
class EvidenceReference(BaseModel):
    evidence_id: str
    expected_path: str
    expected_kind: str


class EvidenceReconciliation(BaseModel):
    valid: bool
    references: list[EvidenceReference]
    errors: list[str] = []
    warnings: list[str] = []
```

### Rule

If an agent says:

```text
"Composer is compatible"
```

Project AI should be able to answer:

```text
Why?

evidenceId:
  e123

Source:
  packages/...

Claim:
  ...

Hash:
  ...

Validator:
  ...

Runtime evidence:
  ...
```

That is the core of the future Project LLM.

---

# 12. Agent 07 — M2.7 Runtime/Browser Agent

This agent validates actual behavior.

### Runtime model

```ts
export interface RuntimeVerification {
  verificationId: string;

  target: string;
  route: string;

  blockType?: string;

  expected: unknown;
  observed: unknown;

  passed: boolean;

  evidenceIds: string[];
}
```

### Workflow

```text
Start application
      ↓
Health check
      ↓
Navigate route
      ↓
Find block
      ↓
Inspect DOM
      ↓
Check data-block-version
      ↓
Check expected content
      ↓
Check renderer
      ↓
Capture evidence
      ↓
Stop process
```

This is fundamentally different from static discovery.

---

# 13. Agent 08 — Test/Validation Agent

This agent is the final deterministic verifier.

It runs:

```text
TypeScript tests
        +
Type checking
        +
snapshot validation
        +
V1–V9
        +
evidence validation
        +
determinism
        +
Python tests
        +
runtime tests
```

### Gate result

```python
class TestSuiteResult(BaseModel):
    suite: str
    command: str
    exit_code: int
    passed: bool
    tests_total: int | None = None
    tests_failed: int | None = None
    evidence_ids: list[str] = []
```

Important distinction:

```text
build passed
```

does **not** mean:

```text
Project LLM passed
```

---

# 14. Agent 09 — Project AI / FastAPI Agent

This is where Python enters.

Recommended structure:

```text
services/project-ai/
├── pyproject.toml
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── snapshot.py
│   │   │   ├── evidence.py
│   │   │   ├── tasks.py
│   │   │   ├── approvals.py
│   │   │   └── certification.py
│   │   │
│   │   └── schemas/
│   │       ├── snapshot.py
│   │       ├── evidence.py
│   │       ├── workflow.py
│   │       ├── gate.py
│   │       └── certification.py
│   │
│   ├── agents/
│   │   ├── base.py
│   │   ├── repository.py
│   │   ├── toolchain.py
│   │   ├── composer.py
│   │   ├── dependencies.py
│   │   ├── ubrc.py
│   │   ├── evidence.py
│   │   ├── runtime.py
│   │   ├── tester.py
│   │   └── reviewer.py
│   │
│   ├── orchestration/
│   │   ├── workflow_engine.py
│   │   ├── gate_controller.py
│   │   └── agent_registry.py
│   │
│   ├── evidence/
│   │   ├── graph.py
│   │   └── query.py
│   │
│   ├── repository/
│   │   └── discovery_client.py
│   │
│   ├── governance/
│   │   ├── approvals.py
│   │   └── policies.py
│   │
│   └── models/
│       ├── task.py
│       ├── snapshot.py
│       ├── evidence.py
│       └── findings.py
│
└── tests/
```

However, per your canonical-artifact policy, **this directory should only be created once the repository audit confirms there is no existing Project AI service boundary that should be extended**. The supplied project material makes the same recommendation rather than creating the directory merely because it was discussed. Implement GitHub Evidence

---

# 15. FastAPI entry point

```python
from fastapi import FastAPI

app = FastAPI(
    title="Project AI",
    version="0.1.0",
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "project-ai",
    }
```

---

# 16. Snapshot API

```python
from fastapi import APIRouter

router = APIRouter(prefix="/snapshot")


@router.get("")
async def get_snapshot():
    snapshot = await discovery_client.get_current_snapshot()

    return snapshot
```

But the Python layer should **not independently rescan the repository** every time an agent needs information.

Correct:

```text
Discovery Engine
       ↓
Snapshot
       ↓
Project AI
       ↓
All agents
```

Not:

```text
Agent A → scans repository
Agent B → scans repository
Agent C → scans repository
Agent D → scans repository
```

That would destroy determinism and create inconsistent views.

---

# 17. Evidence API

```python
@router.get("/evidence/{evidence_id}")
async def get_evidence(evidence_id: str):

    evidence = await evidence_store.get(evidence_id)

    if evidence is None:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found",
        )

    return evidence
```

---

# 18. Task model

```python
class TaskStatus(str, Enum):
    CREATED = "CREATED"
    DISCOVERY = "DISCOVERY"
    PLANNING = "PLANNING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    IMPLEMENTING = "IMPLEMENTING"
    TESTING = "TESTING"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"

    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class ProjectTask(BaseModel):
    task_id: str
    title: str
    status: TaskStatus

    snapshot_commit: str | None = None

    requested_by: str | None = None

    agent_ids: list[str] = []

    evidence_ids: list[str] = []

    errors: list[str] = []
    warnings: list[str] = []
```

---

# 19. Agent registry

```python
class AgentDefinition(BaseModel):
    agent_id: str
    name: str
    gate: str
    capabilities: list[str]


class AgentRegistry:

    def __init__(self):
        self._agents: dict[str, AgentDefinition] = {}

    def register(self, agent: AgentDefinition):
        if agent.agent_id in self._agents:
            raise ValueError(
                f"Agent already registered: {agent.agent_id}"
            )

        self._agents[agent.agent_id] = agent

    def get(self, agent_id: str):
        return self._agents[agent_id]
```

Example:

```python
registry.register(
    AgentDefinition(
        agent_id="M2.3",
        name="Toolchain Agent",
        gate="M2.3",
        capabilities=[
            "toolchain-version",
            "approved-command-execution",
        ],
    )
)
```

---

# 20. Workflow engine

```python
class WorkflowEngine:

    async def execute(self, task: ProjectTask):

        task.status = TaskStatus.DISCOVERY

        snapshot = await self.load_snapshot()

        task.snapshot_commit = snapshot.repository.commitSha

        task.status = TaskStatus.PLANNING

        plan = await self.create_plan(
            task,
            snapshot,
        )

        task.status = TaskStatus.WAITING_FOR_APPROVAL

        await self.save(task)

        return task
```

The critical boundary is:

```text
PLAN
 ↓
WAITING_FOR_APPROVAL
 ↓
human approval
 ↓
IMPLEMENT
```

Never:

```text
LLM plan
 ↓
automatic implementation
```

unless an explicitly approved automation policy allows that specific operation.

---

# 21. Agent base class

```python
from abc import ABC, abstractmethod


class ProjectAIAgent(ABC):

    @property
    @abstractmethod
    def agent_id(self) -> str:
        ...

    @property
    @abstractmethod
    def gate_id(self) -> str:
        ...

    @abstractmethod
    async def execute(
        self,
        context: "AgentContext",
    ) -> GateResult:
        ...
```

Context:

```python
class AgentContext(BaseModel):
    task_id: str
    snapshot: dict
    evidence: list[dict]

    approved_operations: list[str] = []

    previous_results: dict[str, GateResult] = {}
```

Every agent receives the **same authoritative snapshot/evidence context**.

---

# 22. Agent execution dependency graph

The workflow should not be a flat list.

```text
                   AGENT 00
                Gate Controller
                       │
                       ▼
              AGENT 01
        Repository Contract Audit
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
       AGENT 02                 Documentation
       M2.3                     reconciliation
          │
          ▼
   ┌──────┴─────────┐
   ▼                ▼
AGENT 03          AGENT 04
M2.4              M2.5
Composer          Dependency
   │                │
   └──────┬─────────┘
          ▼
      AGENT 05
        UBRC
          │
          ▼
      AGENT 06
Evidence/Reconciliation
          │
          ▼
      AGENT 07
Runtime/Browser
          │
          ▼
      AGENT 08
Test/Validation
          │
          ▼
      AGENT 09
Project AI/FastAPI
          │
          ▼
      AGENT 10
Governance
          │
          ▼
      AGENT 11
Canonical Documentation
          │
          ▼
      AGENT 00
FINAL M2 VERIFICATION
```

---

# 23. Parallelization

Not everything should execute sequentially.

## Wave 0

```text
Agent 00
   ↓
Agent 01
```

Repository audit first.

---

## Wave 1

```text
Agent 02
M2.3 Toolchain
```

---

## Wave 2

These can run concurrently:

```text
             ┌── Agent 03 M2.4
Agent 02 ────┤
             └── Agent 04 M2.5
```

---

## Wave 3

```text
Agent 05
UBRC
```

after the relevant discovery data is trustworthy.

---

## Wave 4

```text
Agent 06
Evidence/Reconciliation
```

This consolidates all preceding findings.

---

## Wave 5

```text
Agent 07
Runtime/Browser
```

---

## Wave 6

```text
Agent 08
Full validation
```

---

## Wave 7

```text
Agent 09
FastAPI / Project AI
```

Now the deterministic foundation is trustworthy enough to become the AI control-plane input.

---

## Wave 8

```text
Agent 10
Governance
```

---

## Wave 9

```text
Agent 11
Canonical documentation
```

---

## Final

```text
Agent 00
      ↓
M2_VERIFIED
```

---

# 24. Agent ownership matrix

| Agent | Gate | Primary responsibility | Can modify implementation? | Can certify? |
|---|---|---|---:|---:|
| 00 | All | Gate orchestration | No | **M2 only** |
| 01 | Audit | Repository contracts | No | No |
| 02 | M2.3 | Toolchain | Yes, scoped | No |
| 03 | M2.4 | Composer/API/schema | Yes, scoped | No |
| 04 | M2.5 | Dependencies | Yes, scoped | No |
| 05 | M2.6 | UBRC | Yes, scoped | No |
| 06 | Evidence | Reconciliation | Limited | No |
| 07 | M2.7 | Runtime/browser | Yes, test/runtime | No |
| 08 | Validation | Tests/validation | Tests only | No |
| 09 | M2.8 | FastAPI | Yes, scoped | No |
| 10 | Governance | Approval/security | Limited | No |
| 11 | Docs | Canonical docs | Docs only | No |

This prevents an agent from becoming judge, implementer, and certifier simultaneously.

---

# 25. M2.8 approval API

```python
@router.post("/tasks/{task_id}/approve")
async def approve_task(task_id: str):

    task = await task_store.get(task_id)

    if task is None:
        raise HTTPException(404, "Task not found")

    if task.status != TaskStatus.WAITING_FOR_APPROVAL:
        raise HTTPException(
            409,
            "Task is not awaiting approval",
        )

    task.status = TaskStatus.IMPLEMENTING

    await task_store.save(task)

    return task
```

Reject:

```python
@router.post("/tasks/{task_id}/reject")
async def reject_task(task_id: str):

    task = await task_store.get(task_id)

    if task.status != TaskStatus.WAITING_FOR_APPROVAL:
        raise HTTPException(
            409,
            "Task is not awaiting approval",
        )

    task.status = TaskStatus.REJECTED

    await task_store.save(task)

    return task
```

---

# 26. M2 final gate

The final controller should implement something like:

```python
REQUIRED_M2_GATES = [
    "M2.1",
    "M2.2",
    "M2.3",
    "M2.4",
    "M2.5",
    "M2.6",
    "M2.7",
    "M2.8",
]


def verify_m2(results: dict[str, GateResult]) -> GateResult:

    errors = []

    for gate_id in REQUIRED_M2_GATES:

        result = results.get(gate_id)

        if result is None:
            errors.append(
                f"Missing gate result: {gate_id}"
            )
            continue

        if result.status != GateStatus.PASSED:
            errors.append(
                f"{gate_id} is {result.status}"
            )

    if errors:

        return GateResult(
            gate_id="M2",
            status=GateStatus.FAILED,
            errors=errors,
        )

    return GateResult(
        gate_id="M2",
        status=GateStatus.PASSED,
    )
```

No manual:

```text
"Looks good, mark M2 complete."
```

---

# 27. Candidate Block workflow

After M2, the system evolves into the Candidate Block workflow described in the supplied project material. The key requirement is that Project LLM produces a specification **before** the external implementation agent starts. Explain I2 Creation Files

## Phase 0 — Request

```text
User:
Create Candidate Introduction Block
```

---

## Phase 1 — Repository analysis

```text
Project AI
    ↓
Snapshot
    ↓
Evidence
    ↓
Canonical block registry
    ↓
Existing Introduction implementations
    ↓
Existing versions
```

---

## Phase 2 — Candidate Block specification

```python
class CandidateBlockSpecification(BaseModel):
    family: str
    target_version: str

    required_files: list[str]
    required_contracts: list[str]
    required_integrations: list[str]

    runtime_requirements: list[str]
    test_requirements: list[str]

    brand_independence_requirements: list[str]

    evidence_ids: list[str]
```

The supplied I2 material explicitly describes this checklist model: implementation, type definition, schema/data contract, renderer registration, registry, tests, Composer compatibility, runtime compatibility, evidence, and brand independence. Explain I2 Creation Files

---

# 28. External AI implementation gate

External AI gets:

```text
Candidate Block Specification
+
Repository contracts
+
Required evidence
+
Acceptance criteria
```

It does **not** get authority to certify itself.

Flow:

```text
Project AI
    ↓
Specification
    ↓
Human Approval
    ↓
External AI
    ↓
React / TS / TSX
    ↓
Tests
    ↓
Project AI verification
```

---

# 29. Candidate Block verification

Project AI verifies:

```text
Implementation
      PASS
Contract
      PASS
ILS Runtime
      PASS
LSNB
      PASS
RSSB
      PASS
Registry
      PASS
Renderer
      PASS
Composer
      PASS
Tests
      PASS
Runtime
      PASS
Brand independence
      PASS
Evidence
      PASS

CERTIFICATION
      PASS
```

That exact distinction is supported by the supplied project material. Explain I2 Creation Files

---

# 30. Composer certification

A block isn't certified because:

```text
IntroductionBlock.tsx exists
```

It must travel through:

```text
Candidate Block
      ↓
Block Registry
      ↓
TutorialBlockRenderer
      ↓
Tutorial Composer
      ↓
Selectable
      ↓
Constructable
      ↓
Generated tutorial
      ↓
Tutorial runtime
      ↓
Browser
```

Possible failures:

```text
COMPOSER_NOT_REGISTERED
COMPOSER_NOT_DISCOVERABLE
COMPOSER_SCHEMA_MISMATCH
COMPOSER_RENDERER_MISMATCH
COMPOSER_GENERATION_FAILURE
COMPOSER_RUNTIME_FAILURE
```

The supplied project material explicitly identifies these kinds of Composer verification gates. Explain I2 Creation Files

---

# 31. Brand-independence agent

This should be a formal check rather than an LLM opinion.

It should inspect:

```text
hard-coded colors
hard-coded logos
hard-coded URLs
brand-specific assets
brand-specific typography
brand-specific copy
brand-specific identifiers
```

Allowed:

```tsx
<IntroductionBlock
    title={data.title}
    description={data.description}
    image={data.image}
    theme={theme}
/>
```

Not:

```tsx
const brandColor = "#...";
const logo = "/skillup-logo.svg";
```

unless the canonical architecture explicitly requires it.

The supplied project material makes brand independence an explicit Candidate Block certification criterion. Explain I2 Creation Files

---

# 32. ILS / LSNB / RSSB

These must be checked from **canonical repository contracts**, not invented by Project AI.

The architecture should therefore implement a generic compatibility gate:

```python
class CompatibilityCheck(BaseModel):
    standard: str
    requirement_id: str
    description: str

    passed: bool

    evidence_ids: list[str]
    errors: list[str] = []
```

Then:

```text
ILS
 ↓
LSNB
 ↓
RSSB
```

each obtains its rules from the authoritative repository documentation/contracts.

This avoids an LLM inventing what "LSNB compliant" means.

The supplied source explicitly says the exact checks should come from canonical LSNB/RSSB documentation. Explain I2 Creation Files

---

# 33. I2 implementation

Only after the infrastructure is complete:

```text
I2 request
   ↓
Repository audit
   ↓
Canonical Introduction family
   ↓
Existing I1/I2/version state
   ↓
Evidence
   ↓
Candidate specification
   ↓
Approval
   ↓
Implementation
   ↓
Registry
   ↓
Renderer
   ↓
Composer
   ↓
Tests
   ↓
Runtime
   ↓
Browser
   ↓
Evidence
   ↓
Certification
```

This avoids creating an isolated "I2 project" that bypasses the Project LLM architecture.

---

# 34. Final certification model

Eventually:

```python
class CertificationStatus(str, Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    FAILED = "FAILED"


class CertificationResult(BaseModel):
    target: str
    status: CertificationStatus

    implementation: bool
    contract: bool
    ils_runtime: bool
    lsnb: bool
    rssb: bool
    registry: bool
    renderer: bool
    composer: bool
    tests: bool
    runtime: bool
    brand_independence: bool
    evidence: bool

    evidence_ids: list[str]

    errors: list[str] = []
```

Certification:

```python
def certify(result: CertificationResult) -> bool:

    checks = [
        result.implementation,
        result.contract,
        result.ils_runtime,
        result.lsnb,
        result.rssb,
        result.registry,
        result.renderer,
        result.composer,
        result.tests,
        result.runtime,
        result.brand_independence,
        result.evidence,
    ]

    return all(checks)
```

---

# 35. What should NOT be built

There are several architectural traps I would explicitly prohibit.

### Do not do this

```text
Python replaces Next.js
```

No.

### Do not do this

```text
FastAPI replaces Hono
```

No.

### Do not do this

```text
Python rewrites D1-D8
```

Not initially.

### Do not do this

```text
Each AI agent independently scans repository
```

No.

### Do not do this

```text
LLM decides whether its own code is correct
```

No.

### Do not do this

```text
file exists = implementation verified
```

No.

### Do not do this

```text
tests pass = runtime certified
```

No.

### Do not do this

```text
create new MD every time an agent needs documentation
```

No.

### Do this

```text
canonical artifact
        ↓
update / append
```

---

# 36. Final workflow

The complete Project LLM system should ultimately look like this:

```text
                           USER
                             │
                             ▼
                  ┌────────────────────┐
                  │ Project AI UI      │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ FastAPI            │
                  │ Project AI         │
                  └─────────┬──────────┘
                            │
                    Workflow Engine
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
     Repository         Planning          Governance
       Agent              Agent              Agent
          │                 │                  │
          └─────────────────┼──────────────────┘
                            ▼
                    Discovery Snapshot
                            │
                            ▼
                    Evidence Graph
                            │
       ┌────────────┬───────┼─────────┬─────────────┐
       ▼            ▼       ▼         ▼             ▼
    Toolchain    Composer  Graph     UBRC        Runtime
       │            │       │         │             │
       └────────────┴───────┼─────────┴─────────────┘
                            ▼
                       Reconciliation
                            │
                            ▼
                         Testing
                            │
                            ▼
                      Human Approval
                            │
                            ▼
                     External AI
                     Implementation
                            │
                            ▼
                  Project AI Verification
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       Static            Composer          Browser
       Evidence          Evidence          Evidence
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                      Certification
                            │
                            ▼
                    CERTIFIED BLOCK
```

---

# 37. Exact implementation waves

I recommend we execute the actual engineering work in these PR/gate units:

### PR / Gate 1
**M2 documentation reconciliation**

- correct stale M2 backlog
- mark M2.1/M2.2 accurately
- preserve canonical artifact
- no duplicate reports

### PR / Gate 2
**M2.3 Toolchain**

- `RepositoryAdapter.runCommand`
- approved operation registry
- actual version execution
- evidence
- tests

### PR / Gate 3
**M2.4 Composer/API/schema**

- AST analysis
- actual HTTP methods
- actual schemas
- actual Composer service methods
- actual UI block usage
- evidence

### PR / Gate 4
**M2.5 Dependency graph**

- workspace graph
- requested versions
- resolved versions
- lockfile
- directed edges
- evidence

### PR / Gate 5
**M2.6 UBRC**

- registry
- renderer
- version
- type
- runtime chain
- evidence

### PR / Gate 6
**M2.7 Runtime**

- application startup
- health check
- Playwright
- DOM verification
- `data-block-version`
- runtime evidence

### PR / Gate 7
**M2 deterministic certification**

- D1–D8
- V1–V9
- evidence
- determinism
- tests
- runtime

### PR / Gate 8
**M2.8 FastAPI**

- `services/project-ai`
- Pydantic contracts
- snapshot API
- evidence API
- task API
- approval API
- workflow engine

### PR / Gate 9
**Multi-agent framework**

- agent registry
- agent base class
- orchestration
- gate dependencies
- shared context

### PR / Gate 10
**Governance**

- approval boundaries
- command allowlist
- no self-approval
- no arbitrary shell
- branch protections/workflow rules

### PR / Gate 11
**Candidate Block**

- specification generation
- external AI handoff
- implementation verification
- ILS/LSNB/RSSB
- registry
- renderer
- Composer
- runtime
- brand independence
- certification

### PR / Gate 12
**I2**

- Introduction candidate
- implementation
- Composer
- runtime
- certification

### Final Gate

```text
PROJECT_LLM_CERTIFIED
```

---

# 38. The most important sequencing decision

I would **not** start by building the entire FastAPI service and all 12 agents.

The correct order is:

```text
             CURRENT STATE
                   │
                   ▼
          M2.1 + M2.2
              DONE
                   │
                   ▼
        ┌───────────────────┐
        │ M2.3              │
        │ Toolchain         │
        └─────────┬─────────┘
                  ▼
       ┌──────────┴──────────┐
       ▼                     ▼
    M2.4                   M2.5
  Composer              Dependency
       │                     │
       └──────────┬──────────┘
                  ▼
                M2.6
                 UBRC
                  │
                  ▼
              Evidence
            reconciliation
                  │
                  ▼
                M2.7
              Runtime
                  │
                  ▼
          Deterministic M2
              CERTIFIED
                  │
                  ▼
                M2.8
             FastAPI
                  │
                  ▼
          Multi-agent system
                  │
                  ▼
          Candidate Blocks
                  │
                  ▼
                  I2
```

This avoids building an intelligent orchestration layer on top of incomplete repository intelligence.

## Bottom line

The **remaining Project LLM implementation is essentially two layers**:

**Layer A — finish deterministic repository intelligence**

```text
M2.3
M2.4
M2.5
M2.6
M2.7
M2 final certification
```

**Layer B — build the AI control plane**

```text
M2.8 FastAPI
    +
agent orchestration
    +
approval/governance
    +
evidence graph
    +
Candidate Block specification
    +
external AI implementation handoff
    +
Candidate Block certification
    +
I2
```

And the central invariant throughout the entire system should be:

> **Project AI never asks an LLM to decide what the repository contains. It asks the deterministic discovery/evidence layer what the repository proves, and then uses AI reasoning to decide what should happen next.**

That is the architecture that makes the later **Candidate Block → Composer → Runtime → Certification** workflow reliable rather than simply another code-generation agent. The supplied project material explicitly supports this separation and the Candidate Block certification model. Explain I2 Creation Files Explain I2 Creation Files

Yes — **that is the intended end state**. But one distinction is important:

**The architecture we designed will achieve that workflow after M2.3–M2.8, multi-agent orchestration, governance, Candidate Block certification, and the I2 workflow are actually implemented. It does not mean the repository has that capability today.** The current status still has M2.3–M2.8, multi-agent orchestration, approval/gating, Candidate Block certification, and I2 workflow pending. Explain I2 Creation Files

The end goal is exactly:

> **External AI creates the HTML/CSS/JS/JSON concept → Project LLM analyzes it → Project LLM tells External AI exactly what TypeScript/React/Next.js files/contracts are required → External AI implements → Project LLM verifies everything → candidate becomes selectable in Tutorial Composer → runtime/browser verifies it → only then is it certified and usable.**

And importantly, **Project LLM does not blindly trust External AI's implementation**. Implementation ≠ certification. Explain I2 Creation Files

---

# 1. What you will ultimately be able to do from the browser

Imagine you open:

```text
https://your-project-ai-domain/
```

and see:

```text
┌───────────────────────────────────────────────────────┐
│                 PROJECT AI                            │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Create / Manage Tutorial Block                       │
│                                                       │
│  Block Family:     [ Introduction        ▼ ]          │
│  Target Version:   [ I2                   ▼ ]          │
│                                                       │
│  Creation Mode:                                      │
│    ○ I2 only                                          │
│    ○ Mix & Match existing versions                    │
│    ○ New Candidate Block                              │
│                                                       │
│  [ Analyze Repository ]                               │
│                                                       │
└───────────────────────────────────────────────────────┘
```

You can say:

> "I want Introduction I2."

or:

> "I want I2 using the existing I1 hero treatment, I2 content structure, and the existing reusable media behavior."

Project AI then performs the repository/evidence analysis.

---

# 2. The first thing Project LLM does

It does **not immediately generate code**.

It first asks:

```text
What already exists?
```

The workflow is:

```text
Browser
   │
   ▼
Project AI
   │
   ▼
Current Repository Snapshot
   │
   ▼
Evidence Graph
   │
   ├── Introduction I1
   ├── Introduction existing versions
   ├── Block registry
   ├── Renderer
   ├── Composer
   ├── Tests
   ├── Runtime routes
   └── Dependencies
```

The deterministic TypeScript/Node layer remains responsible for discovering those facts, while Python/FastAPI performs orchestration and reasoning. That boundary is fundamental to the architecture. Explain I2 Creation Files

---

# 3. Browser screen: Repository Analysis

Project AI could show:

```text
INTRODUCTION FAMILY ANALYSIS

Current versions
────────────────────────────────────
I1          ✓ Certified
I2          Not implemented
I2-Candidate  Not certified

Existing capabilities
────────────────────────────────────
✓ Introduction contract
✓ Introduction registry
✓ Tutorial renderer
✓ Composer integration
✓ Runtime route
✓ Tests
✓ Evidence

Missing for I2
────────────────────────────────────
⚠ New implementation
⚠ Version registration
⚠ Renderer compatibility
⚠ Composer configuration
⚠ Runtime verification
⚠ Browser verification
```

Now the system knows the **delta** rather than blindly asking an AI to recreate Introduction from scratch.

---

# 4. If you have HTML/CSS/JS/JSON from External AI

This is where your proposed workflow becomes particularly powerful.

You could upload/provide:

```text
introduction-i2/
    concept.html
    concept.css
    concept.js
    content.json
```

The browser might show:

```text
EXTERNAL AI CONCEPT

HTML     ✓
CSS      ✓
JS       ✓
JSON     ✓

[ Analyze Candidate ]
```

Project AI analyzes the concept.

---

# 5. Project AI converts the concept into a Candidate Block specification

It doesn't simply say:

> "Looks good."

Instead:

```text
CANDIDATE BLOCK SPECIFICATION
────────────────────────────────────

Family:
Introduction

Target:
I2

Implementation:
React / TypeScript / TSX

Required:
✓ React component
✓ Type definition
✓ Data contract
✓ Registry entry
✓ Renderer registration
✓ Block version
✓ Composer compatibility
✓ Tests
✓ Runtime compatibility
✓ Evidence
✓ Brand independence

Existing artifacts reusable:
✓ Introduction contract
✓ Base renderer
✓ Composer infrastructure
✓ Shared media component

New artifacts required:
• IntroductionI2.tsx
• IntroductionI2.test.tsx
• I2 registry/version entry

Existing artifacts to extend:
• Introduction registry
• Introduction block contract
• Composer configuration
```

This is exactly the purpose of the Candidate Block specification: determine the required implementation, contracts, integrations, tests, runtime requirements, evidence, and brand-independence requirements before implementation. Explain I2 Creation Files

---

# 6. And this is where your "don't create unnecessary MD files" rule matters

Project AI should **not** respond:

```text
Created:

I2-plan.md
I2-spec.md
I2-checklist.md
I2-agent-notes.md
I2-verification.md
I2-final.md
```

Instead:

```text
Search existing artifacts
       ↓
Find canonical artifact
       ↓
Extend canonical artifact
       ↓
Record I2 requirements
```

That global policy applies to the Project AI agents.

So the browser could show:

```text
Documentation impact

Canonical artifacts to update:

✓ Block Corpus Registry
✓ M2 backlog / project task artifact
✓ Existing Introduction documentation

New documentation:
None required
```

That is a major architectural advantage.

---

# 7. Then Project AI gives External AI the implementation contract

This is the key interaction.

Project AI generates something conceptually like:

```text
IMPLEMENTATION CONTRACT

Create:

1. IntroductionI2.tsx

Requirements:
- React component
- TypeScript strict mode
- receives IntroductionI2Data
- no brand-specific constants
- use canonical theme tokens
- expose required block metadata

2. IntroductionI2Data.ts

Requirements:
- conform to canonical Introduction data contract

3. Registry update

Requirements:
- register Introduction/I2
- preserve existing I1 registration

4. Renderer update

Requirements:
- resolve Introduction/I2
- preserve I1 behavior

5. Composer integration

Requirements:
- I2 must appear in Introduction block selection

6. Tests

Requirements:
- component test
- contract test
- registry test
- Composer test

7. Runtime

Requirements:
- data-block-version="I2"
- render successfully in tutorial runtime
```

External AI now has a **repository-aware implementation specification**.

---

# 8. Human approval happens here

This is an important control point.

Browser:

```text
┌──────────────────────────────────────────┐
│        I2 IMPLEMENTATION PLAN            │
├──────────────────────────────────────────┤
│                                          │
│ Files to modify:       5                 │
│ Files to create:      2                  │
│ Tests required:       7                  │
│ Composer changes:     1                  │
│ Runtime verification: YES                │
│ Brand independence:   YES                │
│                                          │
│ Evidence references:   23                │
│                                          │
│ [ Reject ]       [ Approve ]             │
└──────────────────────────────────────────┘
```

You click:

**Approve**

Only now:

```text
WAITING_FOR_APPROVAL
       ↓
IMPLEMENTING
```

The workflow explicitly separates AI planning from approval and implementation from certification. Explain I2 Creation Files

---

# 9. External AI implements the React/TypeScript candidate

External AI now creates/modifies the required files.

For example:

```text
components/
└── tutorial/
    └── blocks/
        └── introduction/
            ├── IntroductionI1.tsx
            ├── IntroductionI2.tsx
            ├── Introduction.types.ts
            └── IntroductionI2.test.tsx
```

But the important thing is:

**Project AI does not assume this is correct merely because the files exist.**

---

# 10. Project AI starts certification

Now the multi-agent workflow activates.

```text
                 I2 Candidate
                     │
                     ▼
             ┌───────────────┐
             │ Agent 01      │
             │ Repository    │
             └───────┬───────┘
                     ▼
             ┌───────────────┐
             │ Agent 06      │
             │ Evidence      │
             └───────┬───────┘
                     ▼
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   Contract        UBRC         Composer
    Agent          Agent         Agent
       │             │             │
       └─────────────┼─────────────┘
                     ▼
              Runtime Agent
                     │
                     ▼
               Test Agent
                     │
                     ▼
            Certification Agent
```

---

# 11. First check — TypeScript/React contract

Project AI verifies:

```text
IntroductionI2.tsx
        ↓
IntroductionI2Data
        ↓
canonical contract
```

It checks:

```text
✓ TypeScript
✓ Props
✓ Data contract
✓ Required fields
✓ Version
✓ No invalid assumptions
```

If it fails:

```text
❌ BLOCKED

INTRODUCTION_I2_CONTRACT_MISMATCH
```

External AI gets the exact failure and can correct it.

---

# 12. Second check — ILS runtime

The block must satisfy the repository's canonical ILS requirements.

Project AI should not hallucinate what ILS means.

Instead:

```text
Canonical ILS requirements
          ↓
Candidate I2
          ↓
Compatibility checks
          ↓
Evidence
```

Result:

```text
ILS Runtime

✓ Requirement ILS-001
✓ Requirement ILS-002
✓ Requirement ILS-003
✓ Runtime compatibility

ILS STATUS: PASS
```

---

# 13. Third check — LSNB

Same model:

```text
Canonical LSNB requirements
          ↓
Introduction I2
          ↓
Validation
```

Result:

```text
LSNB

✓ Structural requirements
✓ Naming requirements
✓ Block contract
✓ Integration requirements

LSNB STATUS: PASS
```

The important point is that the exact LSNB/RSSB rules come from canonical repository documentation/contracts rather than being invented by the LLM. Explain I2 Creation Files

---

# 14. Fourth check — RSSB

Same:

```text
RSSB requirements
       ↓
Candidate
       ↓
Validation
       ↓
Evidence
```

```text
RSSB STATUS: PASS
```

---

# 15. Fifth check — UBRC

This is particularly important.

Project AI checks:

```text
Introduction I2
      │
      ▼
Introduction block type
      │
      ▼
Registry
      │
      ▼
Renderer
      │
      ▼
data-block-version="I2"
      │
      ▼
Runtime
```

For example:

```text
UBRC

✓ Block type exists
✓ Registry entry exists
✓ Registry points to I2
✓ Renderer resolves I2
✓ Version is I2
✓ Runtime version matches

UBRC: PASS
```

The architecture explicitly treats renderer existence alone as insufficient; the complete chain has to be verified. Explain I2 Creation Files

---

# 16. Sixth check — Tutorial Composer

This is one of the most important parts of your objective.

Project AI opens the actual Composer workflow.

Not just:

```text
registry contains I2
```

It verifies:

```text
Registry
   ↓
Composer
   ↓
Introduction
   ↓
I2
```

Browser:

```text
┌────────────────────────────────────────────┐
│              TUTORIAL COMPOSER             │
├────────────────────────────────────────────┤
│                                            │
│ Block Type                                 │
│                                            │
│ [ Introduction ▼ ]                         │
│                                            │
│ Version                                    │
│                                            │
│ [ I1 ▼ ]                                   │
│                                            │
│             ┌──────────────┐               │
│             │     I2       │ ← MUST EXIST  │
│             └──────────────┘               │
│                                            │
└────────────────────────────────────────────┘
```

Project AI selects:

```text
Introduction
→ I2
```

and verifies it can actually be used.

---

# 17. Then it constructs a real tutorial

This is where the workflow becomes much stronger than static testing.

Project AI could create a temporary verification tutorial:

```text
Tutorial
 ├── Introduction I2
 ├── Explanation
 ├── Example
 └── Summary
```

Then:

```text
Composer
   ↓
Save Draft
   ↓
Generate Tutorial
   ↓
Render Tutorial
   ↓
Browser
```

---

# 18. Browser verification

Playwright/browser agent opens the actual tutorial page.

For example:

```text
/tutorial/verification/i2
```

It checks:

```text
✓ Page loads
✓ Introduction I2 exists
✓ Correct renderer used
✓ data-block-version="I2"
✓ Expected content visible
✓ No runtime errors
✓ No console errors
✓ Required CSS loaded
✓ Required assets loaded
```

The runtime verification model stores:

```text
expected
observed
passed
evidenceIds
```

so the system can explain *why* the runtime passed. Explain I2 Creation Files

---

# 19. Brand independence verification

Now Project AI checks whether I2 is actually reusable.

It searches for things like:

```text
hard-coded brand colors
hard-coded logo
brand-specific URLs
brand-specific image
brand-specific typography
brand-specific copy
brand-specific IDs
```

For example:

```text
BRAND INDEPENDENCE

✓ No hard-coded logo
✓ No hard-coded brand URL
✓ Theme tokens used
✓ Content supplied through data
✓ Assets configurable
✓ Typography uses platform tokens

BRAND INDEPENDENCE: PASS
```

That is a formal certification criterion, not merely an LLM opinion. Explain I2 Creation Files

---

# 20. Final I2 certification screen

You could ultimately see:

```text
┌────────────────────────────────────────────────────┐
│              INTRODUCTION I2                       │
│              CERTIFICATION                         │
├────────────────────────────────────────────────────┤
│                                                    │
│ Implementation              ✓ PASS                │
│ Type Contract               ✓ PASS                │
│ Data Contract               ✓ PASS                │
│ ILS Runtime                 ✓ PASS                │
│ LSNB                        ✓ PASS                │
│ RSSB                        ✓ PASS                │
│ UBRC                        ✓ PASS                │
│ Registry                    ✓ PASS                │
│ Renderer                    ✓ PASS                │
│ Tutorial Composer           ✓ PASS                │
│ Tests                       ✓ PASS                │
│ Browser Runtime             ✓ PASS                │
│ Evidence                    ✓ PASS                │
│ Brand Independence          ✓ PASS                │
│                                                    │
│ ───────────────────────────────────────────────── │
│                                                    │
│             🟢 I2 CERTIFIED                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

Only after this should it become a normal selectable production block.

---

# 21. Now the important part: I2-only vs Mix & Match

These are **two different workflows**, and Project LLM should support both.

---

## Mode A — I2 only

You say:

> "Create Introduction I2."

Project AI interprets:

```text
Introduction
    │
    └── I2
```

It analyzes the existing Introduction family and determines what I2 requires.

Then:

```text
Existing Introduction architecture
             ↓
I2 specification
             ↓
External AI implementation
             ↓
Verification
             ↓
I2 certification
```

The result is:

```text
Introduction I2
```

---

# 22. Mode B — Mix & Match

This is more interesting.

Suppose you have:

```text
I1
 ├── layout A
 ├── hero A
 └── media A

I2
 ├── layout B
 ├── hero B
 └── media B

I3
 ├── layout C
 ├── hero C
 └── media C
```

You might request:

> "Create an Introduction version using I2's structure, I1's media treatment, and the new HTML concept's hero."

Project AI should **not simply concatenate files**.

It should decompose the request into capabilities.

For example:

```text
INTRODUCTION MIX & MATCH

Base:
I2

Selected capabilities:
──────────────────────────────
Structure       → I2
Hero            → New Candidate
Media           → I1
Footer          → I2
Responsive      → Canonical
Theme           → Canonical
Data Contract   → Canonical
```

---

# 23. Project AI determines compatibility

This is where the evidence graph and dependency graph become extremely important.

It asks:

```text
Can I1 media be used with I2 structure?
```

Then:

```text
I1 Media
    ↓
dependencies
    ↓
data contract
    ↓
renderer
    ↓
I2 structure
```

Possible result:

```text
✓ Compatible
```

Or:

```text
❌ Incompatible

Reason:
I1 media requires MediaDataV1
I2 requires MediaDataV2

Migration required.
```

That is precisely the kind of reasoning the completed dependency/evidence graph is intended to enable.

---

# 24. Mix & Match should generate a composition specification

For example:

```json
{
  "family": "Introduction",
  "targetVersion": "I2-custom",
  "base": "I2",
  "components": {
    "structure": "I2",
    "hero": "candidate",
    "media": "I1",
    "footer": "I2"
  },
  "requiredChecks": [
    "ILS",
    "LSNB",
    "RSSB",
    "UBRC",
    "COMPOSER",
    "RUNTIME",
    "BRAND_INDEPENDENCE"
  ]
}
```

The exact schema can evolve, but conceptually this is what you want.

---

# 25. Then External AI gets the mix-and-match contract

Instead of:

> "Build whatever looks like this."

External AI gets:

```text
BASE:
Introduction I2

REUSE:
Introduction I1 media implementation

NEW:
Hero implementation from supplied HTML/CSS/JS concept

DO NOT MODIFY:
Canonical Introduction data contract

MUST UPDATE:
Introduction registry
Renderer compatibility

MUST VERIFY:
ILS
LSNB
RSSB
UBRC
Composer
Runtime
Brand independence
```

This sharply reduces AI-generated architectural drift.

---

# 26. The browser journey for Mix & Match

From the user's perspective:

```text
PROJECT AI
   │
   ▼
Create Block
   │
   ▼
Introduction
   │
   ▼
Creation Mode
   │
   ├───────────────┐
   │               │
   ▼               ▼
I2 Only        Mix & Match
                   │
                   ▼
             Select Base
                   │
                   ▼
                  I2
                   │
                   ▼
           Select Components
                   │
        ┌──────────┼───────────┐
        ▼          ▼           ▼
      Hero       Media       Layout
       I2         I1          I2
        │          │           │
        └──────────┼───────────┘
                   ▼
             Compatibility
                 Check
                   │
                   ▼
             Specification
                   │
                   ▼
             Human Approval
                   │
                   ▼
             External AI
                   │
                   ▼
              React/TS
                   │
                   ▼
          Project AI Validation
                   │
                   ▼
               Composer
                   │
                   ▼
               Browser
                   │
                   ▼
            Certification
```

---

# 27. And then the candidate becomes available in Composer

This is the final experience you specifically asked for.

After certification:

```text
Tutorial Composer
      │
      ▼
Introduction
      │
      ├── I1
      ├── I2
      └── I2-CUSTOM ✓
```

Then you can actually use:

```text
Introduction I2-CUSTOM
```

while constructing a tutorial.

The candidate is not considered "done" simply because the component is in the repository. It must pass the complete path:

```text
Candidate
 → Registry
 → Renderer
 → Composer
 → Generated Tutorial
 → Runtime
 → Browser
 → Certification
```

That is the intended Composer certification model. Explain I2 Creation Files

---

# 28. The whole journey in one picture

The complete future system is therefore:

```text
                    YOU
                     │
                     ▼
             PROJECT AI BROWSER
                     │
          ┌──────────┴──────────┐
          │                     │
      I2 ONLY              MIX & MATCH
          │                     │
          └──────────┬──────────┘
                     ▼
             REPOSITORY ANALYSIS
                     │
                     ▼
            SNAPSHOT + EVIDENCE
                     │
                     ▼
          EXISTING BLOCK ANALYSIS
                     │
                     ▼
          CANDIDATE SPECIFICATION
                     │
                     ▼
               HUMAN APPROVAL
                     │
                     ▼
                EXTERNAL AI
                     │
             HTML/CSS/JS/JSON
                     │
                     ▼
             React/TypeScript
                     │
                     ▼
        ┌────────────────────────┐
        │ PROJECT AI VALIDATION  │
        ├────────────────────────┤
        │ Contract               │
        │ ILS                    │
        │ LSNB                   │
        │ RSSB                   │
        │ UBRC                   │
        │ Registry               │
        │ Renderer               │
        │ Composer               │
        │ Tests                  │
        │ Runtime                │
        │ Browser                │
        │ Evidence               │
        │ Brand Independence     │
        └───────────┬────────────┘
                    │
                    ▼
             CERTIFICATION
                    │
                    ▼
          TUTORIAL COMPOSER
                    │
                    ▼
             SELECT I2 / CUSTOM
                    │
                    ▼
             BUILD TUTORIAL
                    │
                    ▼
              RENDER PAGE
                    │
                    ▼
             BROWSER VERIFY
                    │
                    ▼
             PRODUCTION READY
```

---

# 29. So, specifically, does this achieve your original objective?

**Yes.**

Your original objective can be expressed as this final contract:

```text
External AI
    ↓
HTML/CSS/JS/JSON concept
    ↓
Project LLM
    ↓
Repository-aware analysis
    ↓
"Here are the prerequisites and implementation requirements"
    ↓
Human approval
    ↓
External AI
    ↓
React / TypeScript / TSX implementation
    ↓
Project LLM
    ↓
ILS verification
    ↓
LSNB verification
    ↓
RSSB verification
    ↓
UBRC verification
    ↓
Registry verification
    ↓
Renderer verification
    ↓
Tutorial Composer verification
    ↓
Automated tutorial generation
    ↓
Browser/runtime verification
    ↓
Evidence verification
    ↓
Brand-independence verification
    ↓
CERTIFIED CANDIDATE BLOCK
    ↓
Visible/selectable in Tutorial Composer
    ↓
Available for tutorial-page implementation
```

And for **I2**, you have two legitimate modes:

### I2-only

```text
Existing Introduction family
          ↓
       I2 design
          ↓
     I2 candidate
          ↓
       certify
          ↓
      Composer
```

### I2 Mix & Match

```text
I2 base
 +
I1/I2/I3 reusable capabilities
 +
new External AI concept
          ↓
Project AI compatibility analysis
          ↓
Composite specification
          ↓
External AI implementation
          ↓
full certification
          ↓
Custom I2 available in Composer
```

The latter is the more powerful long-term capability because **Project AI becomes the compatibility/governance layer between reusable block versions**, rather than forcing you to manually determine whether pieces from different versions can safely coexist.

The current repository, however, is **not yet at that browser-driven end state**: M2.3–M2.8 and the later Candidate Block/I2 workflow still need implementation. Explain I2 Creation Files

**Therefore, the correct next step is not to manually implement I2 yet.** We should first complete **M2.3 → M2.7**, certify the deterministic evidence foundation, then implement **M2.8 FastAPI + the multi-agent browser workflow**, and only then build the I2/Candidate Block experience on top of it. Explain I2 Creation Files

Yes. I can give you the **complete remaining implementation specification and source-level code handoff**, divided among multiple Project AI workflow agents.

However, I want to make one distinction absolutely explicit: **I cannot honestly label repository-specific code “successfully implemented” until it has actually been applied to the current GitHub branch and the repository test/validation gates have passed.** The current branch has M2.2 code, while the remaining M2.3–M2.8 and Candidate/I2 workflow are still pending. The previous architecture itself confirms those pending areas. Explain I2 Creation Files

The correct implementation target is the upload → placement manifest → approval → deterministic discovery → certification → Composer → runtime/browser → I2/mix-and-match pipeline described previously. Explain I2 Creation Files

# Complete remaining implementation

## 1. Final multi-agent architecture

I recommend **14 agents**, rather than trying to make one Project AI agent do everything.

```text
PROJECT AI CONTROL PLANE
│
├── Agent 0  Gate Controller / Orchestrator
│
├── Discovery / Repository layer
│   ├── Agent 1  Repository Contract Auditor
│   ├── Agent 2  Toolchain Agent
│   ├── Agent 3  Composer/API/Schema Agent
│   ├── Agent 4  Dependency Graph Agent
│   └── Agent 5  UBRC Agent
│
├── Candidate layer
│   ├── Agent 6  Candidate Intake Agent
│   ├── Agent 7  Candidate Placement Agent
│   ├── Agent 8  Candidate Certification Agent
│   └── Agent 9  Brand Independence Agent
│
├── Runtime layer
│   ├── Agent 10 Runtime/Browser Agent
│   └── Agent 11 Composer Workflow Agent
│
├── AI control layer
│   ├── Agent 12 FastAPI / Workflow Agent
│   └── Agent 13 Governance / Approval Agent
│
└── Agent 14 Documentation / Evidence Reconciliation
```

The **Gate Controller is the only agent allowed to declare a phase complete**.

---

# 2. Global instruction given to every agent

This should be part of the Project AI system prompt.

```text
You are a Project AI engineering agent operating inside SUIA_RTH_SHC.

AUTHORITATIVE SOURCES

1. Current repository state
2. Current deterministic RepositorySnapshot
3. Current Evidence records
4. Existing canonical contracts
5. Existing canonical documentation
6. Existing tests
7. Approved workflow/gate state

Never invent repository facts.

Before creating any file:

1. Search the repository.
2. Search the current snapshot.
3. Search evidence.
4. Find an existing artifact serving the same purpose.
5. Determine its canonical owner.
6. Extend/update the canonical artifact when possible.
7. Create a new artifact only when:
   - no suitable canonical artifact exists, or
   - architecture explicitly requires a distinct artifact.
8. When creating a new artifact, record why an existing artifact could not be extended.

Never create duplicate:
- Markdown documentation
- plans
- specifications
- registries
- contracts
- tests
- implementations
- schemas

Do not create Markdown files merely for agent working notes.

The canonical artifact policy is mandatory for all agents.

Do not:
- invent evidence
- invent block versions
- invent Composer APIs
- invent registry entries
- bypass approval
- execute arbitrary shell commands
- modify main directly
- self-approve changes
- certify a block from static compilation alone.

Prefer:
- extending existing code
- reusing existing components
- updating existing tests
- appending canonical documentation
- deterministic evidence
- machine-readable gate results.

Every implementation must produce:
- changed files
- evidence IDs
- test results
- validation results
- warnings
- errors
- gate status.

An AI implementation worker may implement approved changes.
Project AI remains the verification and certification authority.
```

This is directly aligned with the canonical-artifact policy already present in the repository. Explain I2 Creation Files

---

# 3. M2.3 — real toolchain execution

## New contract

```ts
export interface CommandResult {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface RepositoryAdapter {
  readFile(path: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;

  runCommand(
    command: string,
    args: string[],
    options?: {
      cwd?: string;
      timeoutMs?: number;
      env?: Record<string, string>;
    }
  ): Promise<CommandResult>;
}
```

The important security rule is that **the LLM never supplies arbitrary `command` values**.

Instead:

```ts
export type ApprovedOperation =
  | 'node-version'
  | 'pnpm-version'
  | 'turbo-version'
  | 'typescript-version'
  | 'vitest-version'
  | 'playwright-version'
  | 'type-check'
  | 'unit-test'
  | 'integration-test'
  | 'e2e-test';
```

Then:

```ts
const COMMANDS: Record<
  ApprovedOperation,
  { command: string; args: string[] }
> = {
  'node-version': {
    command: 'node',
    args: ['--version'],
  },

  'pnpm-version': {
    command: 'pnpm',
    args: ['--version'],
  },

  'turbo-version': {
    command: 'pnpm',
    args: ['exec', 'turbo', '--version'],
  },

  'typescript-version': {
    command: 'pnpm',
    args: ['exec', 'tsc', '--version'],
  },

  'vitest-version': {
    command: 'pnpm',
    args: ['exec', 'vitest', '--version'],
  },

  'playwright-version': {
    command: 'pnpm',
    args: ['exec', 'playwright', '--version'],
  },

  'type-check': {
    command: 'pnpm',
    args: ['--filter', '@quiz/project-llm-discovery', 'type-check'],
  },

  'unit-test': {
    command: 'pnpm',
    args: ['--filter', '@quiz/project-llm-discovery', 'test'],
  },

  'integration-test': {
    command: 'pnpm',
    args: ['--filter', '@quiz/project-llm-discovery', 'test'],
  },

  'e2e-test': {
    command: 'pnpm',
    args: ['exec', 'playwright', 'test'],
  },
};
```

Execution:

```ts
export async function executeApprovedOperation(
  operation: ApprovedOperation,
  adapter: RepositoryAdapter,
): Promise<CommandResult> {
  const spec = COMMANDS[operation];

  if (!spec) {
    throw new Error(`Unsupported operation: ${operation}`);
  }

  return adapter.runCommand(
    spec.command,
    spec.args,
    {
      timeoutMs: 10 * 60 * 1000,
    },
  );
}
```

This gives Project AI:

```text
AI request
   ↓
ApprovedOperation
   ↓
Tool registry
   ↓
RepositoryAdapter
   ↓
real binary
   ↓
CommandResult
   ↓
Evidence
```

---

# 4. M2.4 — Composer/API/schema analysis

The current D4 placeholders must be removed.

The analyzer should produce:

```ts
export interface ComposerAnalysis {
  services: ComposerService[];
  apis: ComposerAPI[];
  schemas: ComposerSchema[];
  ui: ComposerUI[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

HTTP detection:

```ts
const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;
```

AST-first method extraction:

```ts
function extractHttpMethods(
  source: string,
): string[] {
  const methods = new Set<string>();

  for (const method of HTTP_METHODS) {
    const pattern = new RegExp(
      `\\.${method.toLowerCase()}\\s*\\(`,
      'g',
    );

    if (pattern.test(source)) {
      methods.add(method);
    }
  }

  return [...methods].sort();
}
```

The critical rule:

```text
UNKNOWN
```

must be represented as unknown rather than:

```text
[]
```

because:

```text
[] = definitely none

UNKNOWN = analyzer could not determine
```

That distinction is essential to prevent false certification.

---

# 5. M2.5 — dependency graph

Replace the shallow dependency representation with:

```ts
export interface DependencyEdge {
  from: string;
  to: string;
  kind:
    | 'dependency'
    | 'devDependency'
    | 'peerDependency';

  requestedVersion?: string;
  resolvedVersion?: string;

  evidenceId: string;
}
```

Graph:

```ts
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}
```

Algorithm:

```text
package.json
    ↓
workspace package discovery
    ↓
workspace dependency resolution
    ↓
external dependency extraction
    ↓
lockfile resolution
    ↓
directed graph
    ↓
evidence
```

Example:

```json
{
  "from": "@quiz/tutorial-composer",
  "to": "@quiz/ui",
  "kind": "dependency",
  "requestedVersion": "workspace:*",
  "resolvedVersion": "1.0.0",
  "evidenceId": "ev-..."
}
```

---

# 6. M2.6 — UBRC

UBRC should become an actual validator.

```ts
export type UBRCStatus =
  | 'UBRC_VALID'
  | 'UBRC_MISSING'
  | 'UBRC_VERSION_MISMATCH'
  | 'UBRC_TYPE_MISMATCH'
  | 'UBRC_REGISTRY_MISSING'
  | 'UBRC_RENDERER_MISSING';
```

Verification:

```ts
export interface UBRCVerification {
  blockType: string;
  version: string;
  registryFound: boolean;
  rendererFound: boolean;
  runtimeAttributeFound: boolean;
  runtimeAttributeValue?: string;
  status: UBRCStatus;
  evidenceIds: string[];
}
```

The verifier must establish:

```text
block type
    ↓
registry
    ↓
renderer
    ↓
data-block-version
    ↓
runtime
```

A renderer existing alone is **not** enough.

---

# 7. M2.7 — runtime/browser verification

```ts
export interface RuntimeVerification {
  verificationId: string;

  target: string;
  route: string;

  blockType?: string;
  expected: unknown;
  observed: unknown;

  passed: boolean;

  evidenceIds: string[];

  consoleErrors: string[];
  networkErrors: string[];
}
```

The browser agent executes:

```text
start approved application
        ↓
health check
        ↓
open route
        ↓
locate block
        ↓
inspect DOM
        ↓
check data-block-version
        ↓
check expected content
        ↓
check renderer
        ↓
check console
        ↓
check network
        ↓
capture evidence
        ↓
shutdown
```

Certification cannot proceed if the browser verification fails.

---

# 8. M2.8 — FastAPI Project AI service

The service should be:

```text
services/project-ai/
```

with:

```text
services/project-ai/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── snapshot.py
│   │   │   ├── evidence.py
│   │   │   ├── candidates.py
│   │   │   ├── tasks.py
│   │   │   └── approvals.py
│   │   └── schemas/
│   │       ├── snapshot.py
│   │       ├── evidence.py
│   │       ├── candidate.py
│   │       ├── workflow.py
│   │       └── approval.py
│   ├── agents/
│   │   ├── base.py
│   │   ├── intake.py
│   │   ├── placement.py
│   │   ├── certification.py
│   │   ├── composer.py
│   │   ├── runtime.py
│   │   └── governance.py
│   ├── orchestration/
│   │   ├── workflow.py
│   │   ├── gates.py
│   │   └── registry.py
│   ├── repository/
│   │   ├── adapter.py
│   │   └── operations.py
│   ├── evidence/
│   │   ├── graph.py
│   │   └── query.py
│   └── governance/
│       ├── approval.py
│       └── policy.py
├── tests/
└── pyproject.toml
```

### `main.py`

```python
from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.snapshot import router as snapshot_router
from app.api.routes.evidence import router as evidence_router
from app.api.routes.candidates import router as candidate_router
from app.api.routes.tasks import router as task_router
from app.api.routes.approvals import router as approval_router

app = FastAPI(
    title="Project AI",
    version="1.0.0",
)

app.include_router(health_router)
app.include_router(snapshot_router)
app.include_router(evidence_router)
app.include_router(candidate_router)
app.include_router(task_router)
app.include_router(approval_router)
```

### Workflow state

```python
from enum import Enum


class TaskStatus(str, Enum):
    CREATED = "CREATED"
    DISCOVERY = "DISCOVERY"
    PLANNING = "PLANNING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    IMPLEMENTING = "IMPLEMENTING"
    TESTING = "TESTING"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    REJECTED = "REJECTED"
```

### Gate

```python
from enum import Enum
from pydantic import BaseModel


class GateStatus(str, Enum):
    BLOCKED = "BLOCKED"
    READY = "READY"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    WAITING_APPROVAL = "WAITING_APPROVAL"


class GateResult(BaseModel):
    gate_id: str
    status: GateStatus

    required_commits: list[str] = []
    evidence_ids: list[str] = []

    test_results: list[str] = []
    validation_results: list[str] = []

    errors: list[str] = []
    warnings: list[str] = []

    verified_at: str | None = None
```

---

# 9. Candidate upload

This is one of the most important additions.

The human uploads:

```text
candidate/
├── *.tsx
├── *.ts
├── *.css
├── *.json
├── *.test.*
└── optional assets
```

The Project AI API receives it.

```python
class CandidateFile(BaseModel):
    uploaded_path: str
    content_hash: str
    media_type: str
    size_bytes: int
```

Candidate:

```python
class CandidatePackage(BaseModel):
    candidate_id: str
    family: str
    target_version: str
    creation_mode: str

    files: list[CandidateFile]
```

Creation modes:

```python
class CreationMode(str, Enum):
    I2_ONLY = "I2_ONLY"
    MIX_AND_MATCH = "MIX_AND_MATCH"
    NEW_CANDIDATE = "NEW_CANDIDATE"
```

---

# 10. Candidate Intake Agent

The intake agent performs:

```text
upload
 ↓
hash
 ↓
inventory
 ↓
classify
 ↓
detect duplicate
 ↓
detect canonical equivalent
 ↓
produce intake result
```

Classification:

```python
class CandidateFileRole(str, Enum):
    COMPONENT = "COMPONENT"
    TYPE = "TYPE"
    SCHEMA = "SCHEMA"
    REGISTRY = "REGISTRY"
    RENDERER = "RENDERER"
    STYLE = "STYLE"
    TEST = "TEST"
    ASSET = "ASSET"
    CONFIG = "CONFIG"
    DOCUMENTATION = "DOCUMENTATION"
    UNKNOWN = "UNKNOWN"
```

---

# 11. Candidate Placement Agent

This is the missing architectural piece identified previously.

The placement operation:

```python
class PlacementAction(str, Enum):
    ADD = "ADD"
    UPDATE = "UPDATE"
    EXTEND = "EXTEND"
    REUSE = "REUSE"
    REJECT = "REJECT"
```

Manifest:

```python
class PlacementEntry(BaseModel):
    uploaded_path: str
    target_path: str | None

    action: PlacementAction

    reason: str

    canonical_artifact: str | None

    requires_approval: bool = True
```

Manifest:

```python
class PlacementManifest(BaseModel):
    candidate_id: str
    entries: list[PlacementEntry]

    duplicate_count: int
    new_file_count: int
    modified_file_count: int

    canonical_policy_passed: bool
```

This is the key protection against uncontrolled file proliferation.

The human uploads:

```text
registry.ts
```

but Project AI may determine:

```text
ACTION = UPDATE
TARGET =
existing/canonical/registry.ts
```

rather than:

```text
new/candidate/registry.ts
```

Likewise, the candidate README should normally be rejected or merged into an existing canonical documentation artifact instead of creating another documentation tree.

The repository's policy explicitly requires this behavior. Explain I2 Creation Files

---

# 12. Human approval

Nothing modifies the repository until:

```text
Placement Manifest
      ↓
Human Review
      ↓
APPROVE / REJECT
```

API:

```text
POST /tasks/{task_id}/approve
POST /tasks/{task_id}/reject
POST /tasks/{task_id}/cancel
```

Approval object:

```python
class Approval(BaseModel):
    task_id: str
    approved: bool
    approved_by: str
    approved_at: str
    manifest_hash: str
```

The manifest hash is important.

If:

```text
manifest A
```

was approved but Project AI later produces:

```text
manifest B
```

the original approval cannot be reused.

---

# 13. Candidate certification

Certification is:

```python
class CertificationGate(str, Enum):
    CONTRACT = "CONTRACT"
    ILS = "ILS"
    LSNB = "LSNB"
    RSSB = "RSSB"
    UBRC = "UBRC"
    REGISTRY = "REGISTRY"
    RENDERER = "RENDERER"
    COMPOSER = "COMPOSER"
    TESTS = "TESTS"
    RUNTIME = "RUNTIME"
    BROWSER = "BROWSER"
    BRAND_INDEPENDENCE = "BRAND_INDEPENDENCE"
    EVIDENCE = "EVIDENCE"
```

Certification:

```python
class CandidateCertification(BaseModel):
    candidate_id: str

    gates: dict[
        CertificationGate,
        GateResult
    ]

    certified: bool
```

Certification rule:

```python
def is_certified(
    certification: CandidateCertification,
) -> bool:
    return all(
        gate.status == GateStatus.PASSED
        for gate in certification.gates.values()
    )
```

There should be **no partial certification that is presented as production-ready**.

---

# 14. Brand-independence agent

The agent examines:

```text
hard-coded colors
logos
brand URLs
brand assets
brand-specific font names
brand-specific copy
brand-specific IDs
hard-coded tenant values
```

But it must distinguish legitimate design tokens from forbidden brand coupling.

Example:

```ts
const findings = [
  {
    type: "HARDCODED_BRAND_COLOR",
    path: "...",
    severity: "ERROR",
  },
];
```

Allowed:

```tsx
style={{
  color: theme.colors.primary,
}}
```

Potentially forbidden:

```tsx
style={{
  color: "#123456",
}}
```

when that color represents an existing brand identity rather than a generic design constant.

The agent therefore needs repository evidence and canonical design-token knowledge rather than a simplistic regex-only rejection.

---

# 15. Composer Agent

The Composer Agent verifies the block **as a user would use it**.

Not merely:

```text
registry entry exists
```

Instead:

```text
open Tutorial Composer
 ↓
select block
 ↓
configure block
 ↓
save draft
 ↓
generate tutorial
 ↓
render tutorial
 ↓
browser verification
```

Composer certification therefore becomes:

```python
class ComposerVerification(BaseModel):
    block_type: str

    selectable: bool
    configurable: bool
    saveable: bool
    renderable: bool

    tutorial_id: str | None

    evidence_ids: list[str]

    passed: bool
```

This is critical because a block that exists in source code but cannot actually be selected in Composer is **not certified**.

---

# 16. I2-only workflow

The browser sends:

```json
{
  "family": "Introduction",
  "targetVersion": "I2",
  "creationMode": "I2_ONLY",
  "candidateId": "..."
}
```

Workflow:

```text
CREATE
 ↓
DISCOVERY
 ↓
IDENTIFY INTRODUCTION FAMILY
 ↓
IDENTIFY I2 CONTRACT
 ↓
ANALYZE CANDIDATE
 ↓
PLACEMENT MANIFEST
 ↓
HUMAN APPROVAL
 ↓
IMPLEMENT
 ↓
ILS
 ↓
LSNB
 ↓
RSSB
 ↓
UBRC
 ↓
REGISTRY
 ↓
RENDERER
 ↓
COMPOSER
 ↓
TESTS
 ↓
RUNTIME
 ↓
BROWSER
 ↓
BRAND
 ↓
EVIDENCE
 ↓
CERTIFIED I2
```

---

# 17. Mix-and-match workflow

The user can instead specify:

```json
{
  "family": "Introduction",
  "targetVersion": "I2-CUSTOM",
  "creationMode": "MIX_AND_MATCH",

  "components": {
    "structure": "I2",
    "hero": "candidate",
    "media": "I1",
    "footer": "I2"
  }
}
```

Project AI must first calculate compatibility.

```text
I2 structure
     +
candidate hero
     +
I1 media
     +
I2 footer
     ↓
compatibility graph
```

Check:

```text
type compatibility
data compatibility
version compatibility
renderer compatibility
registry compatibility
responsive behavior
Composer compatibility
runtime compatibility
```

Only then produce:

```text
Composite Candidate Specification
```

---

# 18. Multi-agent workflow

The actual execution graph should be:

```text
                    AGENT 0
                 GATE CONTROLLER
                       │
                       ▼
                 AGENT 1
             Repository Auditor
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Agent 2      Agent 3      Agent 4
      Toolchain    Composer      Graph
          │            │            │
          └────────────┼────────────┘
                       ▼
                    Agent 5
                      UBRC
                       │
                       ▼
                    Agent 6
                Candidate Intake
                       │
                       ▼
                    Agent 7
                Candidate Placement
                       │
                       ▼
                HUMAN APPROVAL
                       │
                       ▼
                    Agent 8
             Candidate Certification
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Agent 9      Agent 10       Agent 11
       Brand       Runtime        Composer
          │            │             │
          └────────────┼─────────────┘
                       ▼
                    Agent 12
                 FastAPI/Workflow
                       │
                       ▼
                    Agent 13
                  Governance
                       │
                       ▼
                    Agent 14
             Evidence/Documentation
                       │
                       ▼
                    AGENT 0
              FINAL CERTIFICATION
```

Parallelism is allowed only where dependencies permit it.

---

# 19. Gate controller

The controller should implement:

```python
GATE_ORDER = [
    "M2.3",
    "M2.4",
    "M2.5",
    "M2.6",
    "M2.7",
    "M2.8",
    "CANDIDATE_INTAKE",
    "CANDIDATE_PLACEMENT",
    "APPROVAL",
    "CANDIDATE_CERTIFICATION",
    "COMPOSER",
    "RUNTIME",
    "BROWSER",
    "I2",
]
```

But it should **not require every gate sequentially when gates are independent**.

For example:

```text
M2.3 ─────┐
M2.4 ─────┼──→ M2.6
M2.5 ─────┘
```

and:

```text
Brand ───────┐
UBRC ────────┤
Registry ────┼──→ Certification
Composer ────┤
Runtime ─────┤
Browser ─────┘
```

---

# 20. Browser UI

The final browser application should expose approximately:

```text
Project AI
─────────────────────────────

Create Block

Family
[ Introduction             ]

Target Version
[ I2                      ]

Mode

○ I2 Only
○ Mix & Match
○ New Candidate

Candidate Files

[ Upload Candidate Files ]

[ Analyze Candidate ]
```

Analysis:

```text
Candidate Analysis
─────────────────────────────

Repository
✓ analyzed

Canonical artifacts
✓ found

Candidate
✓ valid

Placement

ADD       3
UPDATE    2
EXTEND    2
REUSE     1
REJECT    0

Certification

○ Contract
○ ILS
○ LSNB
○ RSSB
○ UBRC
○ Registry
○ Renderer
○ Composer
○ Tests
○ Runtime
○ Browser
○ Brand

[Review Changes]
```

Approval:

```text
Approve Repository Changes?

Candidate: Introduction I2

Files:
  ADD       3
  UPDATE    2
  EXTEND    2
  REUSE     1

Documentation:
  Existing canonical documentation will be updated.
  No duplicate Markdown will be created.

[ Reject ]       [ Approve ]
```

Certification:

```text
Introduction I2
─────────────────────────────

✓ Contract
✓ ILS
✓ LSNB
✓ RSSB
✓ UBRC
✓ Registry
✓ Renderer
✓ Composer
✓ Tests
✓ Runtime
✓ Browser
✓ Brand Independence
✓ Evidence

STATUS

CERTIFIED
```

---

# 21. Final production workflow

The complete journey is therefore:

```text
HUMAN
 │
 │ upload Candidate Block
 ▼
PROJECT AI
 │
 ├── repository snapshot
 ├── evidence graph
 ├── canonical artifacts
 └── block corpus
 │
 ▼
INTAKE AGENT
 │
 ▼
PLACEMENT AGENT
 │
 ▼
PLACEMENT MANIFEST
 │
 ▼
HUMAN APPROVAL
 │
 ▼
REPOSITORY CHANGE
 │
 ▼
DISCOVERY
 │
 ▼
CERTIFICATION AGENTS
 │
 ├── Contract
 ├── ILS
 ├── LSNB
 ├── RSSB
 ├── UBRC
 ├── Registry
 ├── Renderer
 ├── Composer
 ├── Tests
 ├── Runtime
 ├── Browser
 ├── Brand
 └── Evidence
 │
 ▼
CERTIFIED CANDIDATE
 │
 ▼
TUTORIAL COMPOSER
 │
 ▼
I2 / MIX & MATCH
 │
 ▼
TUTORIAL DRAFT
 │
 ▼
RENDER
 │
 ▼
BROWSER VERIFICATION
 │
 ▼
PRODUCTION READY
```

This preserves the key requirement that the human supplies the Candidate Block files while Project AI determines where they belong and how they integrate; the earlier implementation discussion explicitly established that upload → classification → canonical destination → placement → discovery → certification sequence. Explain I2 Creation Files

## One important correction to the implementation process

I would **not** have all 14 agents independently create code.

The workflow should instead be:

```text
Agents analyze
     ↓
Agents produce machine-readable findings
     ↓
Gate Controller reconciles
     ↓
One implementation worker performs approved change
     ↓
Verification agents independently verify
```

That prevents:

```text
Agent A creates registry.ts
Agent B creates another registry.ts
Agent C creates another Introduction.md
Agent D creates another test
```

which directly violates your canonical-artifact rule. The existing policy explicitly says agents must search the repository, snapshot and evidence before creating artifacts and should extend the canonical artifact instead. Explain I2 Creation Files

### What this means for “complete code”

The **architecture and source-level implementation above covers every pending capability**. But I would **not claim that these snippets are already a tested drop-in implementation of your repository**. The remaining work must be applied against the exact current files and contracts, then tested and gated.

In particular, the next actual engineering step should be to implement **M2.3 through M2.8 on `m2-project-ai-foundation`**, with each agent updating the existing `.agents/tasks/m1-m2-backlog.md` rather than creating another M2 plan. The backlog currently contains stale M2.2 audit wording and therefore needs reconciliation as part of that work, not a new Markdown report. Explain I2 Creation Files

**So: yes, the remaining implementation can and should be executed as this multi-agent workflow; but no, I should not tell you that the code above has already been successfully implemented and tested in GitHub. That final status requires actually applying and validating it.**

Yes. I verified the actual GitHub state before preparing it, and there is one important correction: **M2.3 is not starting from zero**. The verified M2.2 branch already contains `RepositoryAdapter.runCommand()` and the approved-operation registry, so the implementation must harden and test that existing code rather than create a duplicate subsystem.

The attached architecture discussion itself confirms that the remaining work is still M2.3–M2.8 plus Candidate Intake/Placement, approval, certification, Composer verification, brand independence, I2, Mix & Match, and the complete browser-to-production workflow. Pasted markdown (2)

I prepared the implementation package here:

**project-ai-implementation-package.zip[Download the complete Project AI implementation package](sandbox:/mnt/data/project-ai-implementation-package.zip)**

It contains:

```text
project-ai-implementation-package/
├── IMPLEMENTATION.md
├── IMPLEMENTATION_CHECKLIST.md
├── AGENTS.md
│
├── services/
│   └── project-ai/
│       ├── pyproject.toml
│       ├── app/
│       │   ├── main.py
│       │   ├── api/
│       │   │   └── routes.py
│       │   ├── agents/
│       │   ├── evidence/
│       │   ├── governance/
│       │   │   └── approvals.py
│       │   ├── models/
│       │   │   ├── workflow.py
│       │   │   └── candidate.py
│       │   └── orchestration/
│       │       ├── workflow_engine.py
│       │       └── gate_controller.py
│       └── tests/
│           ├── test_workflow.py
│           └── test_approval.py
│
└── packages/
    └── project-llm-discovery/
        ├── src/
        │   └── verification/
        │       └── ubrc.ts
        └── __tests__/
            └── unit/
                └── ubrc.test.ts
```

### What this package establishes

The implementation is organized around this boundary:

```text
                 PROJECT AI
              Python / FastAPI
                     │
        ┌────────────┴────────────┐
        │                         │
   Orchestration              AI Agents
        │                         │
        ├── Planning              ├── Repository
        ├── Approval              ├── Toolchain
        ├── Workflow              ├── Composer
        ├── Certification         ├── Dependency
        └── Governance            ├── UBRC
                                  ├── Candidate Intake
                                  ├── Placement
                                  ├── Runtime
                                  └── Certification
                     │
                     ▼
          TS/Node Deterministic Layer
                     │
       Snapshot + Evidence + Validators
```

The source architecture explicitly calls for this final pipeline:

```text
Human
  ↓
Project AI Browser
  ↓
Candidate Intake
  ↓
Placement Manifest
  ↓
Canonical Artifact Check
  ↓
Human Approval
  ↓
Approved Placement
  ↓
Deterministic Discovery
  ↓
Candidate Analysis
  ↓
ILS / LSNB / RSSB / UBRC
  ↓
Registry / Renderer
  ↓
Composer Compatibility
  ↓
Tests
  ↓
Runtime
  ↓
Browser
  ↓
Brand Independence
  ↓
Evidence
  ↓
CERTIFIED BLOCK
  ↓
Tutorial Composer
  ↓
I2 / Custom I2
  ↓
Tutorial Generation
  ↓
Browser Verification
  ↓
PRODUCTION
```

That is directly aligned with the attached implementation discussion. Pasted markdown (2)

### The most important implementation rules

The package also makes the following **global instructions for every Project AI agent**:

> Before creating a file, search the repository, snapshot, and evidence; identify the canonical artifact; extend/update it whenever possible; create a new artifact only when genuinely necessary; never create duplicate Markdown, specifications, registries, plans, tests, or implementations.

This is important because your project already has canonical artifacts such as:

```text
.agents/policies/canonical-artifact-policy.md
.agents/tasks/m1-m2-backlog.md
ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md
```

and the uploaded architecture explicitly requires this canonical-artifact behavior. Pasted markdown (2)

### One critical limitation I have intentionally NOT hidden

I am **not claiming that the ZIP by itself means the entire GitHub system is now production-complete**.

There are repository-specific pieces that must be implemented against the actual source rather than invented, particularly:

- the exact ILS contract;
- exact LSNB implementation;
- exact RSSB implementation;
- authoritative Introduction/I2 registry;
- exact Composer UI route;
- exact browser verification route;
- exact placement targets for every uploaded candidate file;
- the existing project's exact runtime/start commands.

That is deliberate. The architecture says these must be verified from repository evidence, not invented by the Project AI model. The source discussion also explicitly says the previous implementation was **not yet the complete codebase**. Explain I2 Creation Files

So the correct status is:

| Area | Status after this package |
|---|---|
| M1 | ✅ Existing |
| M2.1 | ✅ Existing |
| M2.2 | ✅ Existing |
| M2.3 | 🔧 Implementation/hardening package |
| M2.4 | 🔧 Implementation package |
| M2.5 | 🔧 Implementation package |
| M2.6 UBRC | 🔧 Core implementation supplied |
| M2.7 runtime/browser | 🔧 Architecture + implementation contracts supplied |
| M2.8 FastAPI | 🔧 Core service supplied |
| Candidate Intake | 🔧 Models/workflow supplied |
| Placement | 🔧 Manifest/workflow supplied |
| Human Approval | 🔧 Implemented core |
| Certification | 🔧 Implemented core |
| Brand Independence | 🔧 Gate contract supplied |
| Composer verification | 🔧 Gate contract supplied |
| I2-only | 🔧 Workflow supplied |
| Mix & Match | 🔧 Workflow supplied |
| Browser UI | ⏳ Must be wired to actual repository UI |
| Full end-to-end production certification | ⏳ Must pass actual repository gates |

The reason for keeping those final pieces evidence-driven is precisely to avoid giving the Project AI model fabricated repository paths or fake implementations.

**The package is therefore the implementation starting point for the actual M2.2 GitHub state, not a claim that the repository has already passed the final production gate.** The original discussion requires each remaining phase to contain exact files, implementation code, tests, validation, evidence, ownership, gates, documentation, and commit boundaries. Explain I2 Creation Files

Yes — **those two remaining areas can and should be implemented against the actual GitHub repository**, and I agree with your UI requirement.

I inspected the verified `m2-project-ai-foundation` branch rather than treating the UI as a generic Next.js application. The repository already has a fairly strong visual/system foundation that Project AI should reuse.

### What the existing repository tells us

The SkillHubCore Admin application already uses:

- Next.js App Router
- authenticated/admin route groups
- a shared `ClientShell`
- `LeftSidebar`
- `Header`
- `RightSidebar`
- shared UI components
- Tailwind shared preset
- Inter + Outfit typography
- the existing pink/blue/orange visual language
- the existing `ShellContext`
- the existing `/dashboard` structure
- existing factory/wizard interaction patterns

For example, the existing admin shell uses the actual application structure:

```text
ClientShell
 ├── LeftSidebar
 ├── Header
 ├── Main Content
 └── RightSidebar
```

and the dashboard already uses the repository's established cards, typography, spacing, iconography, colors and interaction patterns.

The repository's global CSS currently establishes:

```text
Inter
Outfit
pink primary
blue secondary
white cards
slate text
soft dashboard background
rounded cards
Tailwind
```

So **Project AI should absolutely not introduce a separate design system.**

---

# 1. Project AI should become a native SkillHubCore Admin experience

I would implement the UI inside the existing:

```text
apps/skillhubcore-admin/
```

rather than creating:

```text
apps/project-ai-ui/
```

or another standalone frontend.

That would violate the architectural intent of having Project AI operate as part of the SkillHubCore platform.

The eventual navigation should be something like:

```text
SkillHubCore Admin
│
├── Dashboard
├── Content
├── Factory
├── Tutorial Composer
│
├── Project AI
│   ├── Overview
│   ├── Create Block
│   ├── Candidates
│   ├── Verification
│   ├── Composer Tests
│   └── Evidence
│
└── ...
```

The exact sidebar location should be determined by the existing `LeftSidebar` structure rather than inventing a second navigation system.

---

# 2. Project AI Dashboard should visually match SkillHubCore

I would **not** make it look like a generic AI chat dashboard.

It should look like an engineering/control-plane section of SkillHubCore.

For example:

```text
┌─────────────────────────────────────────────────────────────┐
│ Project AI                                      Environment │
│ Repository intelligence & block certification               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Snapshot   │ │ Evidence   │ │ Candidates │ │ Certified  │ │
│ │ CURRENT    │ │ 12,482     │ │ 8          │ │ 23         │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                             │
│ ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│ │ Verification Pipeline       │ │ Repository Health       │ │
│ │                             │ │                         │ │
│ │ ✓ Discovery                 │ │ ✓ Snapshot              │ │
│ │ ✓ Evidence                 │ │ ✓ Evidence integrity    │ │
│ │ ✓ UBRC                     │ │ ✓ Registry              │ │
│ │ ✓ Composer                 │ │ ⚠ Runtime               │ │
│ │ ○ Browser                  │ │ ○ Candidate             │ │
│ └─────────────────────────────┘ └─────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Candidate Blocks                                       │ │
│ │                                                         │ │
│ │ Introduction I2       CERTIFIED       Composer          │ │
│ │ Introduction Custom   WAITING         Approval          │ │
│ │ Code C2               FAILED          UBRC              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

It should feel like:

**SkillHubCore Admin + engineering verification console**

—not a separate SaaS product.

---

# 3. Block Creation page should reuse the existing Factory UX language

This is particularly important.

The repository already contains things such as:

```text
BlueprintFactoryWizard
FactoryLayout
```

and those components already establish a strong wizard/modal language.

The existing `BlueprintFactoryWizard`, for example, uses:

- full-screen workflow
- strong header
- uppercase engineering-style labels
- iconography
- progress/state presentation
- dark protocol panels
- configuration cards
- validation/error states
- explicit commit/return actions

That is actually a very good foundation for the Project AI Candidate Block workflow.

So I would make:

```text
Project AI
    ↓
Create Block
```

use the same visual grammar.

---

# 4. Proposed Create Block UI

### Step 1 — Creation Mode

```text
Create Educational Block

Choose creation mode

┌──────────────────────┐
│ I2 ONLY              │
│ Build Introduction   │
│ version I2           │
└──────────────────────┘

┌──────────────────────┐
│ MIX & MATCH          │
│ Compose I2 using     │
│ compatible blocks    │
└──────────────────────┘

┌──────────────────────┐
│ NEW CANDIDATE        │
│ Upload and certify   │
│ a new implementation │
└──────────────────────┘
```

This maps directly to the architecture you approved.

---

# 5. Step 2 — Upload Candidate

```text
Candidate Block Intake_

Introduction / I2

Drop candidate files here

┌────────────────────────────────────────────┐
│                                            │
│       Drop files or Browse                 │
│                                            │
│       TS / TSX / JSX / CSS / JSON / HTML  │
│                                            │
└────────────────────────────────────────────┘

Detected files: 7

✓ Hero.tsx
✓ types.ts
✓ styles.css
✓ registry.ts
✓ renderer.tsx
✓ Hero.test.tsx
✓ config.json
```

Then Project AI analyzes the files.

---

# 6. Step 3 — Repository Analysis

This is where the UI becomes materially different from a normal upload wizard.

```text
Repository Analysis_

✓ Repository snapshot loaded
✓ Evidence graph loaded
✓ Introduction family identified
✓ I1 implementation found
✓ I2 contract identified
✓ Renderer identified
✓ Registry identified
✓ Composer integration identified

Candidate Analysis

7 uploaded files
6 repository relationships
1 exact duplicate
2 existing canonical artifacts
```

This information is coming from the deterministic snapshot/evidence system—not LLM guesses.

---

# 7. Step 4 — Placement Manifest

This is one of the most important screens.

```text
Placement Proposal_

Candidate: introduction-i2-hero-01

┌──────────────┬──────────────┬───────────────────────────────┐
│ Uploaded     │ Action       │ Repository Target             │
├──────────────┼──────────────┼───────────────────────────────┤
│ Hero.tsx     │ ADD          │ .../IntroductionI2Hero.tsx    │
│ types.ts     │ EXTEND       │ existing canonical types.ts   │
│ registry.ts  │ UPDATE       │ existing registry             │
│ renderer.tsx │ UPDATE       │ existing renderer              │
│ Hero.test.tsx│ ADD          │ existing test directory        │
│ styles.css   │ REJECT       │ brand coupling detected       │
└──────────────┴──────────────┴───────────────────────────────┘
```

The user should see **why** Project AI wants to place each file there.

For example:

> `registry.ts → UPDATE`  
> Existing Introduction registry already owns version registration. Creating another registry would violate canonical-artifact policy.

That directly implements the rule we established earlier.

---

# 8. Step 5 — Human Approval

Then:

```text
Review Repository Changes_

Candidate
Introduction I2

Proposed changes
────────────────────────
3 ADD
2 UPDATE
1 EXTEND
1 REJECT

Certification gates
────────────────────────
✓ Contract
✓ ILS
✓ LSNB
✓ RSSB
✓ UBRC
○ Composer
○ Runtime
○ Browser
○ Brand Independence
○ Evidence

[ Reject ]                    [ Approve Changes ]
```

The **Approve Changes** button should not merely be a UI action.

It must create the cryptographically bound approval:

```text
manifestHash
approvedBy
approvedAt
taskId
```

and the backend must reject an approval if the manifest subsequently changes.

---

# 9. Verification page

After implementation:

```text
Candidate Verification_

Introduction I2
────────────────────────────────

Contract                 ✓ PASS
ILS                      ✓ PASS
LSNB                     ✓ PASS
RSSB                     ✓ PASS
UBRC                     ✓ PASS
Registry                 ✓ PASS
Renderer                 ✓ PASS
Composer                 ✓ PASS
Tests                    ✓ PASS
Runtime                  ✓ PASS
Browser                  ✓ PASS
Brand Independence       ✓ PASS
Evidence                 ✓ PASS

                         ─────────────
                         CERTIFIED
```

This is much more useful than displaying a generic:

> "AI implementation successful."

Because certification is **gate-based and evidence-backed**.

---

# 10. Evidence should be first-class UI

Project AI should have an evidence drawer/panel.

For example:

```text
Evidence

EVID-7A82...
────────────────────────
Claim:
Introduction I2 renderer exists.

Source:
packages/ui/src/tutorial/blocks/IntroductionBlock.tsx

Kind:
component

Hash:
sha256: ...

Lifecycle:
current

Referenced by:
✓ Contract
✓ UBRC
✓ Renderer
✓ Browser
```

Clicking the evidence should take the engineer to the repository source or source-location view.

This is important because the architecture is explicitly evidence-driven.

---

# 11. Browser verification should use the real application

This is where the final `⏳` becomes actual implementation.

The browser verifier should not create a fake page just to demonstrate that React rendered.

It should launch the **actual SkillHubCore application** and execute:

```text
Project AI
   ↓
approved application operation
   ↓
SkillHubCore Admin / Composer
   ↓
Introduction
   ↓
I2
   ↓
select candidate
   ↓
configure
   ↓
save draft
   ↓
generate tutorial
   ↓
render tutorial
   ↓
browser inspection
```

Then Playwright verifies:

```text
[data-block-type="introduction"]
[data-block-version="I2"]
```

plus:

- visible content
- expected renderer
- no console errors
- no relevant network errors
- correct responsive rendering
- Composer selection
- save operation
- generated tutorial
- final tutorial rendering

---

# 12. Full end-to-end certification

Then the final gate becomes:

```text
Candidate
   │
   ▼
Upload
   │
   ▼
Intake
   │
   ▼
Classification
   │
   ▼
Placement Manifest
   │
   ▼
Human Approval
   │
   ▼
Repository Mutation
   │
   ▼
Discovery Refresh
   │
   ▼
Contract
   │
   ├── ILS
   ├── LSNB
   ├── RSSB
   └── UBRC
   │
   ▼
Registry
   │
   ▼
Renderer
   │
   ▼
Composer
   │
   ▼
Tests
   │
   ▼
Runtime
   │
   ▼
Browser
   │
   ▼
Brand Independence
   │
   ▼
Evidence
   │
   ▼
CERTIFIED
   │
   ▼
Composer
   │
   ▼
I2 / I2-CUSTOM
   │
   ▼
Temporary Tutorial
   │
   ▼
Browser
   │
   ▼
PRODUCTION READY
```

That is the correct definition of **full end-to-end production certification**.

---

## Most importantly: yes, the UI should match the existing SkillHubCore UI

I verified enough of the actual repository to say this confidently.

The existing admin application already has:

- `ClientShell`
- `LeftSidebar`
- `Header`
- `RightSidebar`
- `/dashboard`
- Factory workflows
- shared UI components
- Tailwind shared preset
- Inter/Outfit typography
- pink/blue/orange visual language
- rounded white cards
- slate backgrounds/text
- existing wizard patterns

So I would **reuse those components and conventions**, not create a new Project AI visual framework.

The existing `IntroductionBlock` also demonstrates the project's educational visual language: controlled typography, cards, rounded sections, Lucide icons, responsive layouts, and `data-block-version` runtime identity.

That makes the architecture:

```text
SkillHubCore Admin
       │
       ├── Existing Dashboard UI
       │
       ├── Existing Factory UI
       │
       ├── Existing Composer UI
       │
       └── Project AI UI
               │
               ├── Dashboard
               ├── Candidate Intake
               ├── Placement
               ├── Approval
               ├── Certification
               ├── Evidence
               └── Runtime/Browser Verification
```

rather than:

```text
SkillHubCore
    +
completely separate Project AI frontend   ❌
```

### One important distinction

**Matching the UI does not mean hard-coding Project AI to today's dashboard implementation.**

Project AI should consume the existing shared UI primitives/theme and existing shell. If the SkillHubCore visual system changes later, Project AI should inherit those changes.

---

### And yes: I can take this all the way to the actual repository implementation

The next implementation package should therefore be **repository-specific**, not generic:

1. **M2.3–M2.7 completion**
2. **FastAPI Project AI service**
3. **SkillHubCore Project AI dashboard**
4. **Create Block wizard**
5. **Candidate upload**
6. **Placement Manifest UI**
7. **Approval UI**
8. **Certification dashboard**
9. **Evidence viewer**
10. **Composer verification**
11. **Playwright runtime verification**
12. **I2-only**
13. **Mix & Match**
14. **final Candidate → Composer → Tutorial → Browser certification**

And the UI should be implemented inside the existing SkillHubCore Admin architecture, reusing its shell and design system rather than creating another frontend.

The source architecture itself requires this final Candidate → Composer → tutorial → browser path before declaring production readiness. Pasted markdown (2)

**So the answer to your question is yes: we can implement those remaining `⏳` items from the actual GitHub repo, and the Project AI UI should look and behave as a native part of the existing SkillHubCore Dashboard/Factory/Composer experience.**

Yes. Based on the attached material and the verified GitHub state, the correct next deliverable is a **remaining implementation handoff**, not another architecture discussion.

The important correction from the repository check is that the existing deterministic package already has:

- `packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.ts`
- `packages/project-llm-discovery/src/contracts/repository-adapter.ts`
- `d1-structure-scanner.ts`
- `d2-runtime-scanner.ts`
- `d3-blocks-scanner.ts`
- `d4-composer-scanner.ts`
- `d5-dependencies-scanner.ts`
- `d6-tests-scanner.ts`
- V1–V9 validators

So the Project AI must **extend those**, not create duplicate implementations.

Below is the implementation handoff in the same phase-oriented format you requested.

---

# PROJECT LLM — REMAINING IMPLEMENTATION HANDOFF

## Current baseline

```text
Repository:
skillupitacademy-alt/SUIA_RTH_SHC

Branch:
m2-project-ai-foundation

M2.2 HEAD:
1b105b2c303155ba422facac404b2436f3b55c39
```

Current state:

| Phase | Status |
|---|---|
| M1 deterministic discovery | ✅ Complete |
| M2.1 evidence lifecycle | ✅ Complete |
| M2.2 strict evidence binding | ✅ Code complete |
| M2.3 toolchain | 🔴 Pending |
| M2.4 Composer/API/schema | 🔴 Pending |
| M2.5 dependency graph | 🔴 Pending |
| M2.6 UBRC | 🔴 Pending |
| M2.7 runtime/browser | 🔴 Pending |
| M2.8 FastAPI Project AI | 🔴 Pending |
| Multi-agent orchestration | 🔴 Pending |
| Governance/approval | 🔴 Pending |
| Candidate intake | 🔴 Pending |
| Candidate placement | 🔴 Pending |
| Candidate certification | 🔴 Pending |
| Composer certification | 🔴 Pending |
| I2 workflow | 🔴 Pending |
| Mix-and-match | 🔴 Pending |
| Project AI UI | 🔴 Pending |
| End-to-end certification | 🔴 Pending |

The attached material explicitly distinguishes the previous work as architecture/blueprint plus M1/M2.1/M2.2, with the remaining phases still requiring implementation. Explain I2 Creation Files

---

# 1. Global Project AI instruction

This must be supplied to **every agent**, not only the documentation agent.

```text
PROJECT AI GLOBAL ENGINEERING POLICY

The repository snapshot and evidence system are authoritative for repository facts.

Before modifying or creating anything:

1. Search the repository.
2. Search the current snapshot.
3. Search evidence.
4. Search canonical artifacts.
5. Identify existing implementation serving the same purpose.
6. Prefer extending/updating the existing canonical implementation.
7. Do not create duplicate documentation, plans, registries,
   specifications, tests, contracts, or implementations.
8. Create a new artifact only when:
   a. no suitable canonical artifact exists, or
   b. the architecture explicitly requires a distinct artifact.
9. If creating a new artifact, record why the existing artifact
   could not be extended.
10. Never invent repository facts.
11. UNKNOWN is preferable to an unsupported PASS.
12. AI planning is not human approval.
13. Implementation is not certification.
14. No agent may approve its own implementation.
15. No arbitrary shell commands.
16. No direct main-branch mutation from an LLM.
17. All repository mutations must pass through approved operations.
18. Preserve deterministic serialization and evidence IDs.
19. Agents share one authoritative snapshot/evidence context.
20. Agents do not independently rescan the repository.
21. Canonical Markdown must be updated/appended rather than duplicated.
22. Gate completion requires implementation + tests + evidence + validation.
```

This directly implements the canonical-artifact principle from the supplied material: agents search, find the canonical artifact, then update/append it rather than continually generating Markdown. Explain I2 Creation Files

---

# 2. M2.3 — Real toolchain execution

## Objective

Move from:

```text
"Node is declared as 20.x"
```

to:

```text
"Node actually executed and returned version X"
```

The attached material explicitly identifies this as the next implementation phase. Explain I2 Creation Files

## Existing files to modify

```text
packages/project-llm-discovery/src/contracts/repository-adapter.ts

packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.ts
```

Potentially add only if no equivalent exists:

```text
packages/project-llm-discovery/src/contracts/toolchain.ts

packages/project-llm-discovery/src/toolchain/approved-toolchain.ts

packages/project-llm-discovery/src/toolchain/toolchain-runner.ts
```

### Do NOT create

```text
repository-command-adapter.ts
shell-adapter.ts
command-service.ts
ai-shell-service.ts
```

if they duplicate the existing repository adapter responsibility.

---

## Contract

```ts
// src/contracts/repository-adapter.ts

export interface CommandResult {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface RepositoryAdapter {
  exists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  listDirectory(path: string): Promise<string[]>;

  runCommand(
    command: string,
    args: string[],
    options?: {
      cwd?: string;
      timeoutMs?: number;
      env?: Record<string, string>;
    },
  ): Promise<CommandResult>;
}
```

---

## Approved tool registry

```ts
export type ApprovedTool =
  | 'node'
  | 'pnpm'
  | 'turbo'
  | 'tsc'
  | 'vitest'
  | 'playwright';

export interface ApprovedOperation {
  id: string;
  tool: ApprovedTool;
  args: string[];
  timeoutMs: number;
  description: string;
}
```

Registry:

```ts
export const APPROVED_OPERATIONS: Record<string, ApprovedOperation> = {
  node_version: {
    id: 'node_version',
    tool: 'node',
    args: ['--version'],
    timeoutMs: 10_000,
    description: 'Verify installed Node.js version',
  },

  pnpm_version: {
    id: 'pnpm_version',
    tool: 'pnpm',
    args: ['--version'],
    timeoutMs: 10_000,
    description: 'Verify installed pnpm version',
  },

  typescript_version: {
    id: 'typescript_version',
    tool: 'pnpm',
    args: ['exec', 'tsc', '--version'],
    timeoutMs: 10_000,
    description: 'Verify installed TypeScript version',
  },

  vitest_version: {
    id: 'vitest_version',
    tool: 'pnpm',
    args: ['exec', 'vitest', '--version'],
    timeoutMs: 10_000,
    description: 'Verify installed Vitest version',
  },

  playwright_version: {
    id: 'playwright_version',
    tool: 'pnpm',
    args: ['exec', 'playwright', '--version'],
    timeoutMs: 10_000,
    description: 'Verify installed Playwright version',
  },
};
```

---

## Critical security rule

Never do:

```ts
exec(userProvidedCommand);
```

Never:

```ts
shell: true
```

Never allow:

```text
LLM → arbitrary executable
```

Correct:

```text
LLM
 ↓
approved operation ID
 ↓
registry lookup
 ↓
validated command
 ↓
RepositoryAdapter
 ↓
CommandResult
```

---

## Toolchain evidence

```ts
export interface ToolchainEvidence {
  tool: string;
  declaredVersion?: string;
  actualVersion: string;
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  evidenceId: string;
}
```

---

## M2.3 tests

```text
repository-adapter.test.ts
toolchain-runner.test.ts
toolchain-version-verification.test.ts
```

Required cases:

```text
PASS approved command
PASS stdout capture
PASS stderr capture
PASS exit code capture
FAIL unknown operation
FAIL unsupported tool
FAIL timeout
FAIL non-zero exit
PASS deterministic operation representation
PASS arbitrary shell rejected
```

---

# 3. M2.4 — Composer/API/schema depth

Existing scanner:

```text
packages/project-llm-discovery/src/scanners/d4-composer-scanner.ts
```

Modify it.

Do not create:

```text
d4-tutorial-composer-scanner.ts
composer-depth-scanner.ts
```

unless repository inspection proves a distinct scanner is architecturally necessary.

---

## Current problem

The Composer scanner must not use shallow placeholders such as:

```ts
const method = 'POST';
```

or:

```ts
tables: []
```

or:

```ts
blocksUsed: []
```

when the information has simply not been discovered.

---

## Discovery result

Introduce the concept:

```ts
export type DiscoveryStatus =
  | 'KNOWN'
  | 'UNKNOWN'
  | 'UNABLE_TO_DETERMINE';

export interface DiscoveryValue<T> {
  status: DiscoveryStatus;
  value: T;
  evidenceIds: string[];
  reason?: string;
}
```

Example:

```ts
{
  status: 'KNOWN',
  value: ['GET', 'POST'],
  evidenceIds: ['EVID-...']
}
```

If discovery cannot establish the method:

```ts
{
  status: 'UNABLE_TO_DETERMINE',
  value: [],
  evidenceIds: [],
  reason: 'Route declaration could not be resolved statically'
}
```

This is much safer than pretending an empty array means "none".

---

## API discovery

Detect actual:

```text
GET
POST
PUT
PATCH
DELETE
HEAD
OPTIONS
```

through AST/source analysis.

Preferred:

```text
ts-morph
```

Fallback:

```text
controlled textual analysis
```

---

## Schema discovery

Inspect actual:

```text
Drizzle definitions
Zod schemas
TypeScript types
database definitions
Composer data contracts
```

Do not invent tables.

---

## UI block discovery

Find:

```text
imports
component references
registry references
block usage
Composer selection metadata
```

---

## Tests

Add/update:

```text
d4-composer-scanner.test.ts
v5-composer-validator.test.ts
```

Required:

```text
GET detected
POST detected
PATCH detected
schema detected
block usage detected
unknown method handled honestly
unknown schema handled honestly
evidenceId attached
```

---

# 4. M2.5 — Dependency graph

Existing:

```text
packages/project-llm-discovery/src/scanners/d5-dependencies-scanner.ts

packages/project-llm-discovery/src/validation/v6-dependency-graph-validator.ts
```

Modify both.

---

## Contract

```ts
export interface DependencyEdge {
  from: string;
  to: string;

  kind:
    | 'dependency'
    | 'devDependency'
    | 'peerDependency';

  requestedVersion?: string;
  resolvedVersion?: string;

  evidenceId: string;
}
```

---

## Required graph

```text
workspace
   ↓
package
   ↓
dependency declaration
   ↓
workspace resolution
   ↓
lockfile resolution
   ↓
external package
```

---

## Evidence

For:

```json
"@quiz/types": "workspace:*"
```

evidence must point to the actual `package.json` declaration.

If lockfile resolution produces:

```text
@quiz/types → version X
```

that must have separate evidence.

---

## V6 failures

```text
UNKNOWN_NODE
UNKNOWN_TARGET
MISSING_EDGE_EVIDENCE
VERSION_CONFLICT
SELF_DEPENDENCY
UNRESOLVED_WORKSPACE_DEPENDENCY
```

---

# 5. M2.6 — UBRC

UBRC must verify:

```text
Block Type
 ↓
Registry
 ↓
Renderer
 ↓
data-block-version
 ↓
Runtime
```

The attached material explicitly states that renderer existence alone is not enough. Explain I2 Creation Files

---

## Contract

```ts
export type UBRCStatus =
  | 'UBRC_VALID'
  | 'UBRC_MISSING'
  | 'UBRC_VERSION_MISMATCH'
  | 'UBRC_TYPE_MISMATCH'
  | 'UBRC_REGISTRY_MISSING'
  | 'UBRC_RENDERER_MISSING';

export interface UBRCVerification {
  blockType: string;
  version: string;

  registryFound: boolean;
  rendererFound: boolean;
  runtimeAttributeFound: boolean;

  runtimeAttributeValue?: string;

  status: UBRCStatus;

  evidenceIds: string[];
}
```

---

## Implementation

```ts
export function verifyUBRC(input: {
  blockType: string;
  version: string;

  registry: Map<
    string,
    {
      version?: string;
      renderer: string;
    }
  >;

  renderers: Set<string>;

  runtimeAttribute?: string;

  evidenceIds: string[];
}): UBRCVerification {
  const registration =
    input.registry.get(input.blockType);

  if (!registration) {
    return {
      blockType: input.blockType,
      version: input.version,
      registryFound: false,
      rendererFound: false,
      runtimeAttributeFound: false,
      status: 'UBRC_REGISTRY_MISSING',
      evidenceIds: input.evidenceIds,
    };
  }

  if (!input.renderers.has(registration.renderer)) {
    return {
      blockType: input.blockType,
      version: input.version,
      registryFound: true,
      rendererFound: false,
      runtimeAttributeFound: false,
      status: 'UBRC_RENDERER_MISSING',
      evidenceIds: input.evidenceIds,
    };
  }

  if (
    registration.version &&
    registration.version !== input.version
  ) {
    return {
      blockType: input.blockType,
      version: input.version,
      registryFound: true,
      rendererFound: true,
      runtimeAttributeFound: false,
      status: 'UBRC_VERSION_MISMATCH',
      evidenceIds: input.evidenceIds,
    };
  }

  if (!input.runtimeAttribute) {
    return {
      blockType: input.blockType,
      version: input.version,
      registryFound: true,
      rendererFound: true,
      runtimeAttributeFound: false,
      status: 'UBRC_MISSING',
      evidenceIds: input.evidenceIds,
    };
  }

  if (input.runtimeAttribute !== input.version) {
    return {
      blockType: input.blockType,
      version: input.version,
      registryFound: true,
      rendererFound: true,
      runtimeAttributeFound: true,
      runtimeAttributeValue: input.runtimeAttribute,
      status: 'UBRC_VERSION_MISMATCH',
      evidenceIds: input.evidenceIds,
    };
  }

  return {
    blockType: input.blockType,
    version: input.version,
    registryFound: true,
    rendererFound: true,
    runtimeAttributeFound: true,
    runtimeAttributeValue: input.runtimeAttribute,
    status: 'UBRC_VALID',
    evidenceIds: input.evidenceIds,
  };
}
```

Tests:

```text
registry missing
renderer missing
version mismatch
runtime attribute missing
runtime attribute mismatch
valid UBRC
```

---

# 6. M2.7 — Runtime/browser verification

This is where static repository intelligence becomes actual runtime intelligence.

The attached material explicitly requires the **real SkillHubCore application**, not a fake verification page. Explain I2 Creation Files

---

## Contract

```ts
export interface RuntimeVerification {
  verificationId: string;

  target: string;
  route: string;

  blockType?: string;

  expected: unknown;
  observed: unknown;

  passed: boolean;

  evidenceIds: string[];

  consoleErrors: string[];
  networkErrors: string[];
}
```

---

## Playwright sequence

```text
start real application
        ↓
health check
        ↓
open route
        ↓
find block
        ↓
data-block-type
        ↓
data-block-version
        ↓
content
        ↓
renderer
        ↓
console
        ↓
network
        ↓
evidence
```

Example:

```ts
const block = page.locator(
  '[data-block-type="introduction"]'
);

await expect(block).toBeVisible();

const blockType =
  await block.getAttribute('data-block-type');

const blockVersion =
  await block.getAttribute('data-block-version');

expect(blockType)
  .toBe('introduction');

expect(blockVersion)
  .toBe(expectedVersion);
```

Capture:

```text
console.error
pageerror
relevant failed requests
HTTP failures
```

---

# 7. M2 final gate

Only after:

```text
M2.3 PASS
M2.4 PASS
M2.5 PASS
M2.6 PASS
M2.7 PASS
```

run:

```text
V1
V2
V3
V4
V5
V6
V7
V8
V9

type-check
unit tests
integration tests
runtime tests
browser tests
```

Only Agent 0 can produce:

```text
M2_VERIFIED
```

---

# 8. M2.8 — FastAPI Project AI

Only after M2 deterministic intelligence is certified.

Create:

```text
services/project-ai/
```

**after repository inspection confirms no existing equivalent service.**

---

## Structure

```text
services/project-ai/
├── pyproject.toml
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── snapshot.py
│   │   │   ├── evidence.py
│   │   │   └── tasks.py
│   │   └── schemas/
│   │       ├── snapshot.py
│   │       ├── evidence.py
│   │       └── workflow.py
│   ├── agents/
│   │   ├── base.py
│   │   ├── repository.py
│   │   ├── evidence.py
│   │   ├── planner.py
│   │   ├── implementation.py
│   │   ├── tester.py
│   │   └── reviewer.py
│   ├── orchestration/
│   │   ├── workflow_engine.py
│   │   ├── gate_controller.py
│   │   └── agent_registry.py
│   ├── evidence/
│   │   ├── graph.py
│   │   └── query.py
│   ├── repository/
│   │   └── discovery_client.py
│   ├── governance/
│   │   ├── approvals.py
│   │   └── policies.py
│   └── models/
│       ├── task.py
│       ├── snapshot.py
│       └── evidence.py
└── tests/
```

---

# 9. FastAPI workflow

```python
from enum import Enum

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    CREATED = "CREATED"
    DISCOVERY = "DISCOVERY"
    PLANNING = "PLANNING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    IMPLEMENTING = "IMPLEMENTING"
    TESTING = "TESTING"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"

    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Task(BaseModel):
    task_id: str
    status: TaskStatus = TaskStatus.CREATED

    snapshot_id: str | None = None
    plan_hash: str | None = None
    manifest_hash: str | None = None

    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
```

---

# 10. Workflow transition engine

```python
ALLOWED_TRANSITIONS = {
    TaskStatus.CREATED: {
        TaskStatus.DISCOVERY,
        TaskStatus.CANCELLED,
    },

    TaskStatus.DISCOVERY: {
        TaskStatus.PLANNING,
        TaskStatus.FAILED,
        TaskStatus.BLOCKED,
    },

    TaskStatus.PLANNING: {
        TaskStatus.WAITING_FOR_APPROVAL,
        TaskStatus.FAILED,
        TaskStatus.BLOCKED,
    },

    TaskStatus.WAITING_FOR_APPROVAL: {
        TaskStatus.IMPLEMENTING,
        TaskStatus.REJECTED,
        TaskStatus.CANCELLED,
    },

    TaskStatus.IMPLEMENTING: {
        TaskStatus.TESTING,
        TaskStatus.FAILED,
        TaskStatus.BLOCKED,
    },

    TaskStatus.TESTING: {
        TaskStatus.VERIFYING,
        TaskStatus.FAILED,
        TaskStatus.BLOCKED,
    },

    TaskStatus.VERIFYING: {
        TaskStatus.COMPLETED,
        TaskStatus.FAILED,
        TaskStatus.BLOCKED,
    },
}


class WorkflowEngine:
    def transition(
        self,
        task: Task,
        target: TaskStatus,
    ) -> Task:

        allowed = ALLOWED_TRANSITIONS.get(
            task.status,
            set(),
        )

        if target not in allowed:
            raise ValueError(
                f"Invalid transition "
                f"{task.status} -> {target}"
            )

        task.status = target
        return task
```

No agent should directly mutate workflow state.

---

# 11. Approval mechanism

The attached material explicitly requires approval to be cryptographically bound to the placement manifest. Explain I2 Creation Files

```python
from hashlib import sha256

from pydantic import BaseModel


class Approval(BaseModel):
    task_id: str
    approved: bool
    approved_by: str
    approved_at: str
    manifest_hash: str


def calculate_manifest_hash(
    manifest: str,
) -> str:
    return sha256(
        manifest.encode("utf-8")
    ).hexdigest()


def validate_approval(
    approval: Approval,
    expected_task_id: str,
    expected_manifest_hash: str,
) -> None:

    if approval.task_id != expected_task_id:
        raise ValueError(
            "Approval task mismatch"
        )

    if (
        approval.manifest_hash
        != expected_manifest_hash
    ):
        raise ValueError(
            "Approval manifest mismatch"
        )

    if not approval.approved:
        raise ValueError(
            "Approval is not affirmative"
        )
```

Therefore:

```text
Approve button
      ↓
backend creates approval
      ↓
manifest hash stored
      ↓
implementation begins
      ↓
current manifest hash compared
      ↓
mismatch = BLOCKED
```

---

# 12. Multi-agent architecture

The final agent set should be:

```text
Agent 0  Gate Controller
Agent 1  Repository Contract Auditor
Agent 2  Toolchain
Agent 3  Composer/API/Schema
Agent 4  Dependency Graph
Agent 5  UBRC
Agent 6  Candidate Intake
Agent 7  Candidate Placement
Agent 8  Candidate Certification
Agent 9  Brand Independence
Agent 10 Runtime/Browser
Agent 11 Composer Workflow
Agent 12 FastAPI/Workflow
Agent 13 Governance/Approval
Agent 14 Documentation/Evidence Reconciliation
```

All agents receive:

```text
snapshot_id
evidence graph
task_id
gate context
```

They do not independently rescan.

---

# 13. Candidate Block intake

The human uploads:

```text
HTML
CSS
JS
JSON
TS
TSX
assets
tests
configuration
```

Project AI performs:

```text
Upload
 ↓
inventory
 ↓
classification
 ↓
duplicate detection
 ↓
repository comparison
 ↓
canonical destination
 ↓
placement manifest
```

The user should **not** manually determine where every file goes.

This is explicitly supported by the attached material. Explain I2 Creation Files

---

# 14. Candidate package model

```python
from enum import Enum
from pydantic import BaseModel


class CreationMode(str, Enum):
    I2_ONLY = "I2_ONLY"
    MIX_AND_MATCH = "MIX_AND_MATCH"
    NEW_CANDIDATE = "NEW_CANDIDATE"


class CandidateFile(BaseModel):
    uploaded_path: str
    content_hash: str
    media_type: str
    size_bytes: int


class CandidatePackage(BaseModel):
    candidate_id: str
    family: str
    target_version: str
    creation_mode: CreationMode
    files: list[CandidateFile]
```

---

# 15. Placement manifest

```python
class PlacementAction(str, Enum):
    ADD = "ADD"
    UPDATE = "UPDATE"
    EXTEND = "EXTEND"
    REUSE = "REUSE"
    REJECT = "REJECT"


class PlacementEntry(BaseModel):
    uploaded_path: str
    target_path: str | None

    action: PlacementAction

    reason: str

    canonical_artifact: str | None

    requires_approval: bool = True


class PlacementManifest(BaseModel):
    candidate_id: str

    entries: list[PlacementEntry]

    duplicate_count: int
    new_file_count: int
    modified_file_count: int

    canonical_policy_passed: bool
```

Example:

```json
{
  "candidate_id": "introduction-i2-hero-01",
  "entries": [
    {
      "uploaded_path": "Hero.tsx",
      "target_path": "canonical/introduction/Hero.tsx",
      "action": "ADD",
      "reason": "Matches existing Introduction family structure",
      "canonical_artifact": null,
      "requires_approval": true
    },
    {
      "uploaded_path": "types.ts",
      "target_path": "canonical/types.ts",
      "action": "EXTEND",
      "reason": "Existing canonical type contract should be extended",
      "canonical_artifact": "canonical/types.ts",
      "requires_approval": true
    },
    {
      "uploaded_path": "registry.ts",
      "target_path": "existing/registry.ts",
      "action": "UPDATE",
      "reason": "Existing registry must be updated rather than duplicated",
      "canonical_artifact": "existing/registry.ts",
      "requires_approval": true
    }
  ]
}
```

---

# 16. Candidate certification

Required gates:

```text
CONTRACT
ILS
LSNB
RSSB
UBRC
REGISTRY
RENDERER
COMPOSER
TESTS
RUNTIME
BROWSER
BRAND_INDEPENDENCE
THEME_COMPATIBILITY
EVIDENCE
```

Model:

```python
class CandidateCertification(BaseModel):
    candidate_id: str
    gates: dict[str, GateResult]
    certified: bool
```

Certification:

```python
required = [
    "CONTRACT",
    "ILS",
    "LSNB",
    "RSSB",
    "UBRC",
    "REGISTRY",
    "RENDERER",
    "COMPOSER",
    "TESTS",
    "RUNTIME",
    "BROWSER",
    "BRAND_INDEPENDENCE",
    "THEME_COMPATIBILITY",
    "EVIDENCE",
]

certified = all(
    result.status == "PASSED"
    for gate, result in certification.gates.items()
    if gate in required
)
```

---

# 17. External AI implementation boundary

The workflow must remain:

```text
Project AI
    ↓
Candidate Block Specification
    ↓
Human Approval
    ↓
External AI
    ↓
React / TypeScript / TSX
    ↓
Project AI verification
```

External AI does **not** get to say:

```text
CERTIFIED
```

The Project AI certification engine decides that.

The attached material explicitly makes this distinction: External AI is the implementation worker, while Project LLM is the engineering verification authority. Explain I2 Creation Files

---

# 18. ILS / LSNB / RSSB

Do not invent these standards.

Project AI must locate:

```text
canonical repository contract
```

then evaluate:

```python
class CompatibilityCheck(BaseModel):
    standard: str
    requirement_id: str
    description: str
    passed: bool
    evidence_ids: list[str]
    errors: list[str] = []
```

So:

```text
canonical rule
 ↓
implementation
 ↓
deterministic check
 ↓
evidence
 ↓
PASS/FAIL
```

The LLM may explain the result but cannot manufacture the result.

---

# 19. Brand independence

Check:

```text
hard-coded colors
logos
brand URLs
brand assets
brand fonts
brand copy
brand identifiers
tenant values
```

But distinguish:

```text
design tokens
```

from:

```text
brand coupling
```

Conceptually acceptable:

```tsx
<IntroductionBlock
  title={data.title}
  description={data.description}
  image={data.image}
  theme={theme}
/>
```

Not acceptable unless repository contracts explicitly require it:

```tsx
const logo = "/skillup-logo.svg";
const brandColor = "#...";
```

---

# 20. Theme compatibility

This must be a **separate gate**.

The same Candidate Block must be able to work with:

```text
SUIA theme
RTH theme
other supported learner themes
```

through the real runtime theme/design-token/context.

Therefore:

```text
Brand independence
≠
Theme compatibility
```

Both are required.

Static code inspection is not sufficient.

The actual test must go:

```text
Composer
 ↓
tutorial JSON
 ↓
real runtime
 ↓
theme
 ↓
browser
```

---

# 21. I2-only

Input:

```json
{
  "family": "Introduction",
  "targetVersion": "I2",
  "creationMode": "I2_ONLY"
}
```

Execution:

```text
find canonical Introduction family
 ↓
find I2 contracts
 ↓
find registry
 ↓
find renderer
 ↓
find Composer
 ↓
Candidate Specification
 ↓
External AI
 ↓
Approval
 ↓
Placement
 ↓
Discovery refresh
 ↓
Certification
 ↓
Composer
 ↓
Temporary tutorial
 ↓
Browser
```

---

# 22. Mix-and-match

Example:

```json
{
  "family": "Introduction",
  "targetVersion": "I2-CUSTOM",
  "creationMode": "MIX_AND_MATCH",
  "components": {
    "structure": "I2",
    "hero": "candidate",
    "media": "I1",
    "footer": "I2"
  }
}
```

Before implementation:

```text
data compatibility
type compatibility
version compatibility
registry compatibility
renderer compatibility
responsive compatibility
Composer compatibility
runtime compatibility
brand independence
theme compatibility
```

Composition:

```json
{
  "family": "Introduction",
  "targetVersion": "I2-CUSTOM",
  "base": "I2",
  "components": {
    "structure": "I2",
    "hero": "candidate",
    "media": "I1",
    "footer": "I2"
  },
  "requiredChecks": [
    "ILS",
    "LSNB",
    "RSSB",
    "UBRC",
    "COMPOSER",
    "RUNTIME",
    "BROWSER",
    "BRAND_INDEPENDENCE",
    "THEME_COMPATIBILITY"
  ]
}
```

Critical rule:

```text
Certified I2
    ≠
Certified I2-CUSTOM
```

Every composition receives its own verification.

---

# 23. Project AI UI

Implement inside:

```text
apps/skillhubcore-admin
```

Reuse:

```text
ClientShell
LeftSidebar
Header
RightSidebar
ShellContext
existing Tailwind/UI primitives
```

Do not create a separate frontend.

Existing wizard pattern:

```text
apps/skillhubcore-admin/src/components/content/BlueprintFactoryWizard.tsx
```

should be used as the visual/interaction reference.

---

## Navigation

```text
Project AI
├── Overview
├── Create Block
├── Candidates
├── Verification
├── Composer Tests
└── Evidence
```

Add it to the existing sidebar after inspecting its current implementation.

---

# 24. Project AI dashboard

The dashboard should show:

```text
M2 Status
──────────────
M2.3   PASS/FAIL
M2.4   PASS/FAIL
M2.5   PASS/FAIL
M2.6   PASS/FAIL
M2.7   PASS/FAIL

Candidate Blocks
──────────────
Pending
Approved
Implementing
Certified
Blocked

Composer
──────────────
Registered
Runtime verified
Browser verified

Evidence
──────────────
Current
Historical
Missing
Warnings
```

This is an engineering control plane, not a generic chatbot.

---

# 25. Candidate creation wizard

```text
1. Creation Mode
   ├── I2 ONLY
   ├── MIX & MATCH
   └── NEW CANDIDATE

2. Upload

3. Repository Analysis

4. Placement Proposal

5. Human Approval

6. Certification

7. Composer Verification

8. Runtime / Browser

9. Evidence
```

---

# 26. Verification screen

The final screen should look conceptually like:

```text
Candidate Verification

Contract                    ✓ PASS
ILS                         ✓ PASS
LSNB                        ✓ PASS
RSSB                        ✓ PASS
UBRC                        ✓ PASS
Registry                    ✓ PASS
Renderer                    ✓ PASS
Composer                    ✓ PASS
Tests                       ✓ PASS
Runtime                     ✓ PASS
Browser                     ✓ PASS
Brand Independence          ✓ PASS
Theme Compatibility         ✓ PASS
Evidence                    ✓ PASS

────────────────────────────────
CERTIFIED
```

This follows the attached certification model. Explain I2 Creation Files

---

# 27. Evidence panel

Example:

```text
Evidence

EVID-7A82...

Claim:
Introduction I2 renderer exists.

Source:
<actual repository path>

Kind:
component

Hash:
sha256:...

Lifecycle:
current

Referenced by:
✓ Contract
✓ UBRC
✓ Renderer
✓ Browser
```

The UI should let the engineer inspect the actual source location.

---

# 28. Browser Composer journey

The final browser automation is:

```text
Project AI
   ↓
approved application operation
   ↓
SkillHubCore Admin
   ↓
Tutorial Composer
   ↓
Introduction
   ↓
I2
   ↓
select Candidate Block
   ↓
configure
   ↓
save draft
   ↓
generate tutorial
   ↓
open tutorial
   ↓
browser verification
```

Verify:

```text
data-block-type
data-block-version
visible content
renderer
console errors
network errors
responsive behavior
Composer selection
save
generated tutorial
runtime rendering
theme compatibility
```

---

# 29. Final end-to-end architecture

```text
Human
  ↓
Project AI Browser
  ↓
Candidate Upload
  ↓
Candidate Intake
  ↓
File Classification
  ↓
Canonical Placement Analysis
  ↓
Placement Manifest
  ↓
Human Approval
  ↓
Repository Mutation
  ↓
Discovery Refresh
  ↓
Contract
  ↓
ILS
  ↓
LSNB
  ↓
RSSB
  ↓
UBRC
  ↓
Registry
  ↓
Renderer
  ↓
Composer
  ↓
Tests
  ↓
Runtime
  ↓
Browser
  ↓
Brand Independence
  ↓
Theme Compatibility
  ↓
Evidence
  ↓
CERTIFIED BLOCK
  ↓
Tutorial Composer
  ↓
I2 / I2-CUSTOM
  ↓
Temporary Verification Tutorial
  ↓
Browser
  ↓
PRODUCTION READY
```

That is the end-state described by the attached architecture material. 

---

# 30. Required agent waves

Use this exact implementation order:

```text
WAVE 0
Repository Contract Auditor
        ↓
canonical status reconciliation

WAVE 1
Toolchain Agent
        ↓
M2.3

WAVE 2
Composer Agent + Dependency Agent
        ↓
M2.4 + M2.5

WAVE 3
UBRC Agent
        ↓
M2.6

WAVE 4
Evidence Reconciliation
        ↓
M2 consistency

WAVE 5
Runtime/Browser Agent
        ↓
M2.7

WAVE 6
Testing / Validation Agent
        ↓
M2_VERIFIED

WAVE 7
FastAPI Agent
        ↓
M2.8

WAVE 8
Multi-agent orchestration

WAVE 9
Governance / Approval

WAVE 10
Candidate Intake / Placement

WAVE 11
Candidate Certification

WAVE 12
Composer Verification

WAVE 13
I2

WAVE 14
Mix-and-Match

WAVE 15
Project AI UI

WAVE 16
End-to-End Browser Certification

FINAL
PROJECT_LLM_CERTIFIED
```

---

# 31. Commit boundaries

Do **not** put everything into one giant PR.

Recommended:

```text
docs(m2): reconcile M2.2 canonical status

feat(m2.3): implement approved toolchain execution

feat(m2.4): deepen Composer API schema discovery

feat(m2.5): complete dependency graph evidence

feat(m2.6): implement UBRC verification

feat(m2.7): implement runtime browser verification

test(m2): certify deterministic repository intelligence

feat(project-ai): add FastAPI foundation

feat(project-ai): add multi-agent orchestration

feat(project-ai): add governance and approval

feat(project-ai): add candidate intake and placement

feat(project-ai): add candidate certification

feat(project-ai): add Composer verification

feat(project-ai): add I2 workflow

feat(project-ai): add mix-and-match workflow

feat(skillhubcore-admin): add Project AI control plane

test(project-ai): add end-to-end certification
```

---

# 32. Required gate evidence

Every gate returns:

```python
class GateResult(BaseModel):
    gate_id: str
    status: GateStatus

    required_commits: list[str] = []
    evidence_ids: list[str] = []

    test_results: list[str] = []
    validation_results: list[str] = []

    errors: list[str] = []
    warnings: list[str] = []

    verified_at: str | None = None
```

The system must be able to answer:

```text
Why did this gate pass?
```

with:

```text
claim
 ↓
entity
 ↓
evidenceId
 ↓
evidence
 ↓
source
```

That evidence chain is one of the central purposes of M2.2 and the later evidence graph. Explain I2 Creation Files

---

# 33. Final Project LLM certification

The final condition is:

```text
PROJECT_LLM_CERTIFIED
```

only when:

```text
M2_VERIFIED
+
FastAPI
+
multi-agent orchestration
+
governance
+
candidate intake
+
candidate placement
+
human approval
+
candidate certification
+
Composer verification
+
runtime verification
+
browser verification
+
brand independence
+
theme compatibility
+
I2
+
mix-and-match
+
Project AI UI
+
complete evidence
```

---

## Most important implementation rule

The Project AI execution agent must **not reinterpret this as permission to redesign the system**.

For every phase it must do:

```text
SEARCH
 ↓
INSPECT
 ↓
IDENTIFY CANONICAL IMPLEMENTATION
 ↓
EXTEND EXISTING CODE
 ↓
IMPLEMENT
 ↓
TEST
 ↓
VALIDATE
 ↓
GENERATE EVIDENCE
 ↓
UPDATE CANONICAL ARTIFACT
 ↓
COMMIT
 ↓
REPORT
```

If an example above conflicts with the **actual repository contract**, the actual repository contract wins.

If something cannot be proven:

```text
UNKNOWN
```

or:

```text
BLOCKED
```

—not a fabricated `PASS`.

And the architectural distinction remains:

```text
External AI
= implementation worker

Project AI
= evidence-driven engineering control plane + certification authority

Human
= approval authority
```

That is the remaining implementation path consistent with the attached material and the verified M2.2 repository state.