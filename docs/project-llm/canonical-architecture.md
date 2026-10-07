# Canonical Architecture — M2.9 Project LLM

## Overview

The M2.9 architecture implements a **controlled multi-agent engineering pipeline** for block development with explicit ownership, dependency-aware execution waves, and mandatory verification gates.

## Core Principle

**External AI does NOT have repository knowledge.**

The Project LLM must:
- Analyze the repository canonical references (I1, C1, D1, UBRC)
- Extract schema, renderer, composer, runtime, ILS, LSNB, RSSB contracts
- Generate a **self-contained engineering contract**
- Hand off to external AI
- Validate returned candidate against canonical contracts

## System Flow

```
USER
  │
  │ Family + Version
  ▼
PROJECT LLM
  │
  ├── Repository Discovery
  ├── Canonical Reference Analysis
  │       ├── I1 (Instruction)
  │       ├── C1 (Contract)
  │       ├── D1 (Description)
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
HUMAN GATE 1 (GUI Approval)
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
HUMAN GATE 2 (Implementation Approval)
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

## Architecture Authority

**Wave 0 (B01)** establishes the single source of truth:

- One canonical workflow state machine (`CanonicalWorkflowState`)
- No competing state definitions in frontend or worker services
- Frontend consumes backend states; does not invent its own

## Key Constraints

1. **Single Authority**: One workflow engine, one state machine
2. **Explicit Ownership**: Each agent owns specific files/contracts
3. **Dependency Waves**: Agents run in dependency-aware waves
4. **Sequential Gates**: Human approval gates are explicit and blocking
5. **Mandatory Tests**: Every wave must pass tests before advancing
6. **Machine-Readable Evidence**: All runs/tests/gates logged to JSONL ledgers
7. **Git Commits**: One commit per agent/wave
8. **Integration Audit**: Final agents audit entire pipeline before delivery

## Agent Topology

- **14 Backend agents** (B01-B14): authority, contracts, intake, validation, certification
- **6 Frontend agents** (F01-F06): API client, UI, handoff, upload
- **4 Final agents** (Q01-Q04): integration audit, evidence packaging

See `canonical-agent-registry.md` for full registry.

## Evidence Trail

All agent runs, test results, gate decisions, and certifications are written to append-only JSONL ledgers in `docs/project-llm/evidence/`:

- `agent-runs.jsonl`
- `test-results.jsonl`
- `gate-results.jsonl`
- `certification-results.jsonl`
- `workflow-events.jsonl`

## Implementation Status

See `canonical-implementation-status.md` for current wave execution status.

## References

- Workflow states: `canonical-workflow.md`
- Agent registry: `canonical-agent-registry.md`
- Implementation status: `canonical-implementation-status.md`
- Evidence ledger: `evidence/README.md`
