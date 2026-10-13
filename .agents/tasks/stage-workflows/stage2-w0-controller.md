# Stage 2: W0 Workflow Controller

## Prerequisites
- Stage 1 (P0 Safety Fixes) completed with APPROVED verdict
- All safety unit tests passing
- Evidence logged to `.agents/evidence/runs/p0-fixes/`

## Workflow Prompt

# Task: Execute W0 Workflow Controller

## Context
Repository: e:\onlinewebsites\quiz-platform
Branch: project-llm-e2e-implementation
Previous Stage: P0 safety fixes completed

## Objectives

The workflow controller initializes the migration repair run and establishes the baseline.

### 1. Pin Source Commit
- Execute: `git rev-parse HEAD`
- Record full 40-character SHA
- Verify working tree is clean: `git status --porcelain`
- If working tree not clean, return BLOCKED

### 2. Create Workflow Run ID
- Generate: `migration-repair-{YYYYMMDD}-{HHMMSS}-{short-sha}`
- Create run directory: `.agents/evidence/runs/{run-id}/`
- Create subdirectories: `commands/`, `stdout/`, `stderr/`, `reports/`, `agent-reports/`

### 3. Establish File Ownership Map
Define which agents can modify which files:
- **repair_implementer**: Can modify migration SQL files only
- **evidence_assembler**: Can write to `.agents/evidence/runs/{run-id}/` only
- **publisher_agent**: Can commit and push only
- **All audit agents**: Read-only, no file modifications

### 4. Set Safety Policies
Document in run manifest:
- Database mode: VERIFY (never MIGRATE)
- Allowed database patterns: `*_test`, `disposable_*`, `temp_*`
- Forbidden database patterns: `*_prod*`, `*production*`, `tutorial_prod`, `neon-*`
- Command allowlist: `pnpm db:migrate`, `pnpm test`, `git` commands only
- Cleanup required: Yes, verified

### 5. Create Run Manifest
Write to `.agents/evidence/runs/{run-id}/run-manifest.json`:

```json
{
  "workflow_id": "migration-repair-{timestamp}-{sha}",
  "run_id": "run-{uuid}",
  "source_commit_sha": "full-40-char-sha",
  "branch": "project-llm-e2e-implementation",
  "started_at": "ISO-8601-timestamp",
  "baseline_clean": true,
  "database_mode": "VERIFY",
  "safety_policies": {
    "database_validation": "fail-closed",
    "command_validation": "allowlist-only",
    "cleanup_required": true,
    "production_access": "denied"
  },
  "file_ownership": {
    "migration_files": ["repair_implementer"],
    "evidence_files": ["evidence_assembler"],
    "git_operations": ["publisher_agent"],
    "read_only": ["all_audit_agents"]
  },
  "stages": [
    "W0-controller",
    "W1-audits",
    "W2-planner",
    "W3-reviewer",
    "W4-implementer",
    "W5-reviews",
    "W6-verification",
    "W7-evidence",
    "W8-gate",
    "W9-publisher"
  ],
  "status": "W0-complete"
}
```

## Success Criteria

1. ✅ Source commit SHA recorded (40 characters)
2. ✅ Working tree verified clean
3. ✅ Run directory created with subdirectories
4. ✅ Run manifest written with all policies
5. ✅ File ownership map established
6. ✅ Safety policies documented
7. ✅ Gate: Valid baseline manifest exists

## Output

Return AgentResult with:
- status: SUCCESS
- outputs: {"run_id", "source_sha", "manifest_path"}
- evidence_ids: ["run-manifest.json"]

## Files to Create
- `.agents/evidence/runs/{run-id}/run-manifest.json`
- `.agents/evidence/runs/{run-id}/commands.jsonl` (empty, ready for W1-W9)
- `.agents/evidence/runs/{run-id}/w0-controller.json`

## Verification
After execution, verify:
```bash
# Check manifest exists
test -f .agents/evidence/runs/{run-id}/run-manifest.json

# Verify SHA format (40 hex chars)
grep -E '"source_commit_sha": "[0-9a-f]{40}"' .agents/evidence/runs/{run-id}/run-manifest.json

# Verify working tree clean
git status --porcelain | wc -l  # Should be 0
```
