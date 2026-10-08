# Implementation Plan: W1D — Test & Evidence Harness

## Overview

Create Pydantic schemas, enhance the evidence ledger with file locking, set up `.agents/evidence/` directory structure, add integration helpers, and verify with comprehensive tests.

**Base Branch**: m2-project-ai-canonical-wiring (commit: 5acbd7b3, W0 complete)
**Target**: Add evidence harness for multi-agent workflow test recording

## Implementation Steps

- [ ] 1. Create evidence schemas at `services/project-ai/app/evidence/schemas.py`
      
      Define Pydantic v2 models for AgentRun, TestResult, and EvidenceRecord. Include all required and optional fields per task specification:
      
      - **AgentRun**: runId, agentId, wave, commitBefore, commitAfter, filesChanged (list), tests (dict with passed/failed/skipped), evidence (dict), status, timestamp
      - **TestResult**: passed (int), failed (int), skipped (int), duration (float in seconds), timestamp
      - **EvidenceRecord**: id, type, workflowId, artifactPath, sha256, timestamp
      
      Use `BaseModel` from `pydantic` (v2 syntax, matching existing patterns in `app/api/schemas/models.py`, `app/models/workflow_target.py`). Add docstrings for each model and field descriptions using `Field()`.
      
      **Files**: `services/project-ai/app/evidence/schemas.py` (create)
      
      **Verify**: Run `python -c "from app.evidence.schemas import AgentRun, TestResult, EvidenceRecord; print('Schemas loaded')"` from `services/project-ai/` — should print "Schemas loaded" without import errors.

- [ ] 2. Add file locking to ledger at `services/project-ai/app/evidence/ledger.py`
      
      The existing ledger writes to `docs/project-llm/evidence/`. For W1D, we need concurrency-safe writes to `.agents/evidence/` at repository root. Modify `_append_jsonl()` to:
      
      - Change `EVIDENCE_ROOT` from `docs/project-llm/evidence/` to `.agents/evidence/` (5 levels up: `Path(__file__).parent.parent.parent.parent.parent / ".agents" / "evidence"`)
      - Implement cross-platform file locking using context manager with `fcntl.flock()` on Unix/Linux and `msvcrt.locking()` on Windows
      - Ensure atomic append: acquire lock → append line → release lock
      - Add `record_agent_run(run: AgentRun)`, `record_test_results(results: TestResult)`, `record_evidence(evidence: EvidenceRecord)` typed functions that validate schemas before calling existing append functions
      
      Keep existing functions (`append_agent_run`, `append_test_result`, etc.) for backward compatibility but add new schema-validating wrappers.
      
      **Files**: `services/project-ai/app/evidence/ledger.py` (modify)
      
      **Verify**: Run `python -c "from app.evidence.ledger import record_agent_run; from app.evidence.schemas import AgentRun; print('Ledger enhanced')"` from `services/project-ai/` — should print "Ledger enhanced" without errors.

- [ ] 3. Create `.agents/evidence/` directory structure
      
      Set up the evidence directory at repository root with placeholder JSONL files:
      
      - `.agents/evidence/agent-runs.jsonl` (already exists, keep as-is)
      - `.agents/evidence/test-results.jsonl` (create empty)
      - `.agents/evidence/evidence.jsonl` (create empty)
      - `.agents/evidence/gate-results.jsonl` (create empty)
      
      Add `.gitignore` entry pattern if needed (check if `.agents/evidence/*.jsonl` should be tracked or ignored — based on existing `.agents/evidence/agent-runs.jsonl` being tracked, keep them tracked).
      
      **Files**: 
      - `.agents/evidence/test-results.jsonl` (create)
      - `.agents/evidence/evidence.jsonl` (create)
      - `.agents/evidence/gate-results.jsonl` (create)
      
      **Verify**: Run `ls -la .agents/evidence/*.jsonl` (or Windows equivalent `Get-ChildItem`) — should list 4 JSONL files: agent-runs.jsonl, test-results.jsonl, evidence.jsonl, gate-results.jsonl.

- [ ] 4. Create integration helpers at `services/project-ai/app/evidence/integration.py`
      
      Add convenience wrapper `record_wave_completion()` that other wave agents can easily call:
      
      ```python
      def record_wave_completion(
          wave: str,
          commit: str,
          files: list[str],
          tests: dict,
          status: str
      ) -> None:
          """Record wave completion to evidence ledger."""
      ```
      
      This function should:
      - Generate a unique runId (e.g., `f"{wave}-{commit[:8]}-{timestamp}"`)
      - Create AgentRun schema with provided data
      - Call `record_agent_run()` to append to ledger
      - Include error handling (log but don't crash if evidence recording fails)
      
      **Files**: `services/project-ai/app/evidence/integration.py` (create)
      
      **Verify**: Run `python -c "from app.evidence.integration import record_wave_completion; print('Integration helpers ready')"` from `services/project-ai/` — should print "Integration helpers ready".

- [ ] 5. Create tests at `services/project-ai/tests/evidence/`
      
      Create comprehensive test suite covering:
      
      - **test_schemas.py**: Validate AgentRun, TestResult, EvidenceRecord models (required fields, optional fields, validation errors, serialization)
      - **test_ledger.py**: Test JSONL append operations, schema validation, concurrent writes (spawn multiple threads writing simultaneously), file locking correctness (one thread blocks while another writes)
      - **test_integration.py**: Test `record_wave_completion()` convenience wrapper, verify output format in JSONL
      
      Use pytest patterns from existing tests (e.g., `tests/unit/test_evidence_ledger.py`). Use `tmp_path` fixture for isolated file operations. Mock `EVIDENCE_ROOT` to avoid writing to actual `.agents/evidence/` during tests.
      
      **Files**: 
      - `services/project-ai/tests/evidence/__init__.py` (create)
      - `services/project-ai/tests/evidence/test_schemas.py` (create)
      - `services/project-ai/tests/evidence/test_ledger.py` (create)
      - `services/project-ai/tests/evidence/test_integration.py` (create)
      
      **Verify**: Run `pytest services/project-ai/tests/evidence/ -v` — all tests should pass, coverage should include concurrent write scenarios.

- [ ] 6. Update `app/evidence/__init__.py` exports
      
      Add new schemas and integration helpers to the module exports:
      
      ```python
      from .schemas import AgentRun, TestResult, EvidenceRecord
      from .integration import record_wave_completion
      from .ledger import record_agent_run, record_test_results, record_evidence
      ```
      
      **Files**: `services/project-ai/app/evidence/__init__.py` (modify)
      
      **Verify**: Run `python -c "from app.evidence import AgentRun, TestResult, EvidenceRecord, record_wave_completion; print('All exports available')"` from `services/project-ai/` — should print "All exports available".

- [ ] 7. Record final evidence report
      
      Create `w1d-evidence-harness-report.json` in `.agents/tasks/` documenting:
      
      - Wave: W1D
      - Status: completed
      - Files created: list all new files
      - Files modified: list all modified files
      - Tests added: count of new test cases
      - Commit SHA: the final commit hash
      - Timestamp: ISO 8601 format
      
      Use JSON format with 2-space indentation (matching project conventions from `app/evidence/logger.py`).
      
      **Files**: `.agents/tasks/w1d-evidence-harness-report.json` (create)
      
      **Verify**: Run `cat .agents/tasks/w1d-evidence-harness-report.json | python -m json.tool` — should be valid JSON.

- [ ] 8. Commit and push all changes
      
      Stage all created and modified files:
      
      ```bash
      git add services/project-ai/app/evidence/schemas.py
      git add services/project-ai/app/evidence/ledger.py
      git add services/project-ai/app/evidence/integration.py
      git add services/project-ai/app/evidence/__init__.py
      git add services/project-ai/tests/evidence/
      git add .agents/evidence/*.jsonl
      git add .agents/tasks/w1d-evidence-harness-report.json
      git commit -m "feat(project-llm): add evidence harness"
      git push origin m2-project-ai-canonical-wiring
      ```
      
      **Files**: All files from steps 1-7
      
      **Verify**: Run `git log -1 --oneline` — should show "feat(project-llm): add evidence harness" as the latest commit. Run `git status` — should show "nothing to commit, working tree clean". Run `git log origin/m2-project-ai-canonical-wiring -1` — should match local commit (confirming push succeeded).

## Notes

- **Pydantic Version**: Project uses Pydantic v2 (confirmed in `pyproject.toml`: `pydantic>=2.7.0` and imports like `from pydantic import BaseModel, Field` in existing code)
- **Test Framework**: pytest (confirmed in `pyproject.toml` dev dependencies and existing test structure)
- **File Locking**: Cross-platform implementation required (Windows uses `msvcrt`, Unix/Linux uses `fcntl`)
- **Evidence Location**: `.agents/evidence/` at repository root (not `docs/project-llm/evidence/` which is used by existing logger)
- **Concurrency**: Multiple agents may write simultaneously, file locking prevents corruption
- **Backward Compatibility**: Keep existing ledger functions working for any code that currently uses them

## Verification Commands

After implementation:

```bash
# Run all evidence tests
pytest services/project-ai/tests/evidence/ -v

# Verify schemas can be imported
python -c "from app.evidence import AgentRun, TestResult, EvidenceRecord, record_wave_completion"

# Check evidence directory exists
ls -la .agents/evidence/

# Verify commit and push
git log -1 --oneline
git status
```

## Success Criteria

- [x] All Pydantic v2 schemas defined with correct field types
- [x] File locking implemented for concurrent writes
- [x] `.agents/evidence/` directory created with placeholder JSONL files
- [x] Integration helper `record_wave_completion()` available
- [x] Comprehensive tests pass (schemas, ledger, integration, concurrency)
- [x] All changes committed with message "feat(project-llm): add evidence harness"
- [x] Changes pushed to origin/m2-project-ai-canonical-wiring
- [x] Evidence report JSON created at `.agents/tasks/w1d-evidence-harness-report.json`
