# Canonical Architecture ΓÇö M2.9 Project LLM

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
  Γöé
  Γöé Family + Version
  Γû╝
PROJECT LLM
  Γöé
  Γö£ΓöÇΓöÇ Repository Discovery
  Γö£ΓöÇΓöÇ Canonical Reference Analysis
  Γöé       Γö£ΓöÇΓöÇ I1 (Instruction)
  Γöé       Γö£ΓöÇΓöÇ C1 (Contract)
  Γöé       Γö£ΓöÇΓöÇ D1 (Description)
  Γöé       ΓööΓöÇΓöÇ other applicable versions
  Γöé
  Γö£ΓöÇΓöÇ Schema / Type Analysis
  Γö£ΓöÇΓöÇ Renderer Analysis
  Γö£ΓöÇΓöÇ Composer Analysis
  Γö£ΓöÇΓöÇ Runtime Analysis
  Γö£ΓöÇΓöÇ ILS Analysis
  Γö£ΓöÇΓöÇ LSNB Analysis
  Γö£ΓöÇΓöÇ RSSB Analysis
  Γö£ΓöÇΓöÇ Theme / Brand Analysis
  ΓööΓöÇΓöÇ Test Analysis
  Γöé
  Γû╝
CANDIDATE BLOCK ENGINEERING CONTRACT
  Γöé
  Γû╝
EXTERNAL AI
  Γöé
  Γö£ΓöÇΓöÇ HTML/CSS/JS/JSON prototype
  Γöé
  Γû╝
HUMAN GATE 1 (GUI Approval)
  Γöé
  Γû╝
EXTERNAL AI
  Γöé
  ΓööΓöÇΓöÇ React/TS implementation
  Γöé
  Γû╝
CANDIDATE UPLOAD
  Γöé
  Γû╝
PROJECT LLM
  Γöé
  Γö£ΓöÇΓöÇ Intake
  Γö£ΓöÇΓöÇ Hash
  Γö£ΓöÇΓöÇ Classification
  Γö£ΓöÇΓöÇ Contract comparison
  Γö£ΓöÇΓöÇ Canonical comparison
  Γö£ΓöÇΓöÇ Structural validation
  Γö£ΓöÇΓöÇ Test validation
  ΓööΓöÇΓöÇ Placement manifest
  Γöé
  Γû╝
HUMAN GATE 2 (Implementation Approval)
  Γöé
  Γû╝
APPROVED PLACEMENT
  Γöé
  Γû╝
SNAPSHOT
  Γöé
  Γû╝
EVIDENCE
  Γöé
  Γö£ΓöÇΓöÇ Composer
  Γö£ΓöÇΓöÇ Renderer
  Γö£ΓöÇΓöÇ Runtime
  Γö£ΓöÇΓöÇ Browser
  Γö£ΓöÇΓöÇ ILS
  Γö£ΓöÇΓöÇ LSNB
  Γö£ΓöÇΓöÇ RSSB
  Γö£ΓöÇΓöÇ Brand
  ΓööΓöÇΓöÇ Theme
  Γöé
  Γû╝
FINAL GATE
  Γöé
  Γû╝
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
