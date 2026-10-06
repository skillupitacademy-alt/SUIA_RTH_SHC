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