# Evidence Directory - DEPRECATED

**Date**: 2026-10-08  
**Reason**: Evidence authority reconciliation (M2.9 R0)  
**Status**: ARCHIVED, READ-ONLY

## Why This Directory Was Retired

This directory was the original evidence location for Project LLM M2.9, but was superseded by `.agents/evidence/` during Wave 1D implementation.

**Timeline**:
- Original location: `docs/project-llm/evidence/` (created early in M2.9)
- Wave 1D (commit 7af488f9): Evidence harness implemented with `.agents/evidence/` as canonical location
- 2026-10-08: This directory archived during R0 evidence authority reconciliation

## Canonical Evidence Location

**Use this location instead**: `e:\onlinewebsites\quiz-platform\.agents\evidence\`

The Python implementation in `services/project-ai/app/evidence/ledger.py` explicitly points to `.agents/evidence/`:

```python
EVIDENCE_ROOT = Path(__file__).parent.parent.parent.parent.parent / ".agents" / "evidence"
```

## Files Preserved Here

This archive contains:
- `agent-runs.jsonl` (5030 bytes, 4 entries, last activity 2026-10-07)
- `certification-results.jsonl` (366 bytes, 1 entry)
- `gate-results.jsonl` (377 bytes, 1 entry)
- `test-results.jsonl` (0 bytes, empty)
- `workflow-events.jsonl` (0 bytes, empty)
- `README.md` (original README, now outdated)

These files are preserved for historical reference but are NOT authoritative.

## Authoritative Evidence

For authoritative W0-W2 evidence, see:
- **JSONL ledger**: `.agents/evidence/agent-runs.jsonl` (78+ entries including all W0-W2 work)
- **Structured reports**: `.agents/tasks/w*-report.json` (canonical wave reports with real file changes and test counts)

## Do Not Use This Directory

This directory is archived and will not be updated. Any new evidence must be recorded to `.agents/evidence/` using the `CanonicalEvidenceStore` API.

---

**Archived by**: M2.9 R0 Evidence Authority Reconciliation  
**Reference**: `.agents/tasks/r0-evidence-audit.md`
