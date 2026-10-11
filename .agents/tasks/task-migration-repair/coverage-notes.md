# Migration Repair Module Coverage Gap Analysis

**Date**: 2026-10-11  
**Overall Coverage**: 25%  
**Target Coverage**: 85%  
**Status**: ⚠️ Below Target (Gap: 60 percentage points)

---

## Summary

The migration repair module has 25% test coverage, which is below the target of 85%. The low coverage is primarily due to the agent functions not being executed in the current unit tests - they are mostly tested by mocking their interfaces rather than executing the actual implementation code paths.

---

## Coverage by File

| File | Statements | Covered | Missing | Coverage |
|------|------------|---------|---------|----------|
| `__init__.py` | 0 | 0 | 0 | 100% |
| `agents/__init__.py` | 15 | 15 | 0 | 100% |
| `models.py` | 48 | 48 | 0 | 100% |
| `plan.py` | 42 | 30 | 12 | 71% |
| `gate.py` | 21 | 10 | 11 | 48% |
| `safety.py` | 29 | 15 | 14 | 52% |
| `runner.py` | 28 | 9 | 19 | 32% |
| `workflow_controller.py` | 40 | 10 | 30 | 25% |
| `verification.py` | 32 | 6 | 26 | 19% |
| **Agent modules** (14 files) | 705 | 89 | 616 | ~12% |
| **TOTAL** | 899 | 224 | 675 | **25%** |

---

## Files Needing More Tests

### Critical Priority (Agent Execute Functions)

All agent modules have very low coverage (7-25%) because the actual execution paths are not being tested. Current tests verify:
- Evidence logging (that functions can be called)
- Basic error handling
- Interface contracts

But do NOT test:
- Actual business logic execution
- File system operations
- Git operations
- Complex branching logic
- Error recovery paths

**Agent Files Needing Coverage:**

1. `agents/database_safety_audit.py` - 16% coverage (49 missing statements)
   - Database connection validation logic untested
   - Environment detection logic untested
   - Production safeguard logic untested

2. `agents/evidence_assembler.py` - 20% coverage (24 missing statements)
   - Evidence collection logic untested
   - File hashing logic untested
   - JSONL writing logic untested

3. `agents/evidence_audit.py` - 12% coverage (46 missing statements)
   - Evidence file discovery untested
   - Validation logic untested
   - Report aggregation untested

4. `agents/final_gate_agent.py` - 12% coverage (45 missing statements)
   - Gate evaluation logic untested
   - Verdict determination untested
   - Prior-agent dependency checking untested

5. `agents/migration_audit.py` - 15% coverage (52 missing statements)
   - Migration file parsing untested
   - SQL syntax checking untested
   - Duplicate detection logic untested

6. `agents/publisher_agent.py` - 15% coverage (34 missing statements)
   - Git commit logic untested
   - SHA verification untested
   - Publication audit trail untested

7. `agents/repair_implementer.py` - 10% coverage (60 missing statements)
   - File patching logic untested
   - Migration file editing untested
   - Rollback preparation untested

8. `agents/repair_planner.py` - 9% coverage (50 missing statements)
   - Finding analysis logic untested
   - Repair action generation untested
   - Risk assessment logic untested

9. `agents/repair_reviewer.py` - 7% coverage (50 missing statements)
   - Review criteria logic untested
   - Approval/rejection decision untested
   - Safety validation untested

10. `agents/static_reviewer.py` - 12% coverage (51 missing statements)
    - SQL syntax validation untested
    - Schema consistency checking untested
    - Diff scope validation untested

11. `agents/test_inventory.py` - 13% coverage (33 missing statements)
    - Test discovery logic untested
    - Fixture detection untested
    - Coverage mapping untested

12. `agents/test_reviewer.py` - 10% coverage (44 missing statements)
    - Test adequacy checking untested
    - Coverage gap detection untested
    - Test completeness validation untested

13. `agents/verification_runner.py` - 19% coverage (25 missing statements)
    - Verification pipeline execution untested
    - Stage result collection untested
    - Failure propagation untested

14. `agents/workflow_controller.py` - 25% coverage (30 missing statements)
    - Git SHA retrieval untested
    - Execution plan building untested
    - File ownership map logic untested

### Medium Priority (Utility Modules)

1. `verification.py` - 19% coverage (26 missing statements)
   - Verification stage execution untested
   - Blocking logic untested
   - Error handling untested

2. `runner.py` - 32% coverage (19 missing statements)
   - Command execution untested
   - Output capture untested
   - SHA-256 hashing untested

3. `gate.py` - 48% coverage (11 missing statements)
   - Some gate evaluation paths untested
   - Edge case handling incomplete

4. `safety.py` - 52% coverage (14 missing statements)
   - Some validation paths untested
   - Edge cases incomplete

5. `plan.py` - 71% coverage (12 missing statements)
   - Some dependency resolution paths untested

---

## Reason for Low Coverage

The current test strategy focuses on **interface testing** rather than **implementation testing**:

1. **Unit tests mock the agents**: Tests use `patch.object()` with `AsyncMock` to verify that agents _can be called_ with the correct interface, but don't execute the actual agent logic.

2. **Integration tests are skipped**: The 36 integration tests that would exercise actual execution paths are skipped when `TEST_DATABASE_URL_TUTORIAL` is not set (which is correct for safety).

3. **Complex logic untested**: Business logic inside agent execute functions (file I/O, git operations, SQL parsing, evidence collection) is not covered by current unit tests.

---

## Recommendations to Achieve 85% Coverage

### Option 1: Expand Unit Tests (Recommended)
Add unit tests that execute agent logic against mock filesystems and mock git operations:
- Use `pytest-mock` to mock `pathlib.Path` operations
- Mock `subprocess.run` for git/command operations
- Mock file I/O operations
- Test each agent's business logic branches
- Test error handling paths

**Estimated effort**: 2-3 days to write comprehensive unit tests for all 14 agents

### Option 2: Add Safe Integration Tests
Create integration tests that run against disposable test resources:
- Use temporary directories for filesystem operations
- Use in-memory git repositories for git operations
- Use test databases for database operations (requires TEST_DATABASE_URL_TUTORIAL)

**Estimated effort**: 3-5 days to create safe integration test infrastructure

### Option 3: Hybrid Approach (Best Quality)
Combine both:
- Unit tests for business logic and error handling
- Integration tests for end-to-end workflows

**Estimated effort**: 4-6 days total

---

## Current Test Suite Strengths

Despite low coverage, the current tests provide value:

✅ **Models coverage**: 100% - All data models are fully tested  
✅ **Interface contracts**: All 14 agents have interface tests  
✅ **Evidence logging**: Verified that agents log to evidence ledger  
✅ **Error handling basics**: Verified agents don't crash on errors  
✅ **Dependency validation**: Verified dependency chain blocking  

---

## Next Steps

1. **Prioritize agent testing**: Focus on agents with the most complex logic first:
   - `repair_planner.py` (9% coverage, 50 missing statements)
   - `repair_implementer.py` (10% coverage, 60 missing statements)
   - `migration_audit.py` (15% coverage, 52 missing statements)

2. **Add mocked filesystem tests**: Use `pytest-tmp-path` and mock file operations

3. **Add mocked git tests**: Mock subprocess calls to git commands

4. **Gradually increase coverage**: Target 50% first, then 70%, then 85%

5. **Consider integration test environment**: Set up safe TEST_DATABASE_URL_TUTORIAL for full workflow tests

---

## Coverage JSON Location

Full coverage report available at:
```
.agents/evidence/migration-repair-coverage.json
```

Generated: 2026-10-11T15:20:43
