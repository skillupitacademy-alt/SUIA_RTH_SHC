# Stage 3: W1 Parallel Read-Only Audits

## Prerequisites
- Stage 2 (W0 Controller) completed
- Run manifest exists with run_id
- Baseline SHA recorded

## Workflow Prompt

# Task: Execute W1 Parallel Read-Only Audits

## Context
Repository: e:\onlinewebsites\quiz-platform
Run ID: {from W0 manifest}
Mode: Read-only, no file modifications

## Objectives

Execute 4 independent auditors in parallel. Each returns findings with:
- File path (absolute)
- Line number (if applicable)
- Finding type (RISK, VIOLATION, MISSING, INCONSISTENT)
- Severity (CRITICAL, HIGH, MEDIUM, LOW)
- Description
- Recommended action
- Required test

### Agent 1: Command Safety Auditor

**Scan**:
- `services/project-ai/app/workflows/migration_repair/runner.py`
- Any subprocess/shell execution code
- Command construction patterns

**Look for**:
- `shell=True` usage
- String concatenation in commands
- Unvalidated user input in commands
- Missing executable allowlist
- Missing argument validation

**Report to**: `.agents/evidence/runs/{run-id}/agent-reports/command-safety-audit.json`

### Agent 2: Database Safety Auditor

**Scan**:
- `services/project-ai/app/workflows/migration_repair/safety.py`
- `services/project-ai/app/workflows/migration_repair/agents/verification_runner.py`
- Any database connection code

**Look for**:
- Database validation enforcement point
- Production database access prevention
- Credential isolation
- Connection string validation
- Fail-closed behavior

**Report to**: `.agents/evidence/runs/{run-id}/agent-reports/database-safety-audit.json`

### Agent 3: Test Inventory Auditor

**Scan**:
- `services/project-ai/tests/workflows/migration_repair/`
- `packages/db-tutorial/package.json` (test scripts)
- Test fixtures and configuration

**Look for**:
- All test files and their purposes
- Required vs optional tests
- Test dependencies (database, network, etc.)
- Skipped/disabled tests
- Missing test coverage areas

**Report to**: `.agents/evidence/runs/{run-id}/agent-reports/test-inventory-audit.json`

### Agent 4: Evidence Auditor

**Scan**:
- `.agents/evidence/` directory structure
- Existing evidence files from previous runs
- Evidence schema compliance

**Look for**:
- Missing evidence files
- Evidence format violations
- Broken SHA-256 hashes
- Incomplete command logs
- Evidence tampering indicators

**Report to**: `.agents/evidence/runs/{run-id}/agent-reports/evidence-audit.json`

## Execution Pattern

All 4 agents run in parallel:
```python
results = await asyncio.gather(
    command_safety_auditor.execute(context),
    database_safety_auditor.execute(context),
    test_inventory_auditor.execute(context),
    evidence_auditor.execute(context)
)
```

## Success Criteria

1. ✅ All 4 audit reports exist
2. ✅ Each report contains structured findings
3. ✅ No code files were modified (read-only constraint)
4. ✅ Findings include file paths and line numbers
5. ✅ Gate: All 4 audit reports recorded

## Output Format

Each audit report JSON:
```json
{
  "audit_type": "command_safety",
  "auditor": "command_safety_auditor",
  "run_id": "...",
  "timestamp": "ISO-8601",
  "files_scanned": ["path1", "path2"],
  "findings": [
    {
      "finding_id": "CMD-001",
      "type": "RISK",
      "severity": "CRITICAL",
      "file": "services/project-ai/app/workflows/migration_repair/runner.py",
      "line": 42,
      "description": "Using shell=True opens command injection risk",
      "recommended_action": "Replace with subprocess.create_subprocess_exec(*argv)",
      "required_test": "test_runner_rejects_shell_metacharacters"
    }
  ],
  "summary": {
    "critical": 2,
    "high": 5,
    "medium": 3,
    "low": 1
  }
}
```

## Verification

After execution:
```bash
# Check all 4 reports exist
test -f .agents/evidence/runs/{run-id}/agent-reports/command-safety-audit.json
test -f .agents/evidence/runs/{run-id}/agent-reports/database-safety-audit.json
test -f .agents/evidence/runs/{run-id}/agent-reports/test-inventory-audit.json
test -f .agents/evidence/runs/{run-id}/agent-reports/evidence-audit.json

# Verify no code modifications
git diff-index --quiet HEAD || echo "ERROR: Code was modified during read-only audit"
```
