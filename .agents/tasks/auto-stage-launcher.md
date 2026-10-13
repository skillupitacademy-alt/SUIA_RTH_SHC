# Automatic Stage Launcher

This document defines the workflow prompts for each stage so they can be launched automatically upon completion of the previous stage.

## Stage Launch Rules

1. **Wait for completion**: Monitor active workflow via `inspect_workflow`
2. **Check verdict**: Read verdict.json, only launch next if APPROVED
3. **Update status**: Update migration-repair-status.json
4. **Launch next**: Call `run_workflow` with next stage prompt
5. **Repeat**: Continue monitoring new workflow

---

## Stage 2 Launch Configuration

**Trigger**: Stage 1 verdict.json shows APPROVED  
**Workflow ID**: Will be generated on launch  
**Label**: `stage2-w0-controller`

**Prompt**:
```
# Task: W0 Workflow Controller - Initialize Migration Repair Run

## Context
Repository: e:\onlinewebsites\quiz-platform
Branch: project-llm-e2e-implementation
Previous Stage: P0 safety fixes approved

## Objectives

Execute workflow controller to establish baseline and policies.

### 1. Pin Source Commit SHA
```bash
git rev-parse HEAD > .agents/evidence/runs/source-sha.txt
git status --porcelain
```
Verify working tree clean. If not clean, return BLOCKED.

### 2. Generate Run ID
Format: `migration-repair-YYYYMMDD-HHMMSS-{8-char-sha}`
Create: `.agents/evidence/runs/{run-id}/`

### 3. Create Run Manifest
Write `.agents/evidence/runs/{run-id}/run-manifest.json`:
- workflow_id
- run_id  
- source_commit_sha (40 chars)
- branch
- started_at (ISO-8601)
- baseline_clean: true/false
- database_mode: "VERIFY"
- safety_policies (database validation, command allowlist, cleanup required, production denied)
- file_ownership (which agents can modify which files)
- stages array (W0-W9)

### 4. Establish File Ownership
Document which agents can modify files:
- repair_implementer: migration SQL files only
- evidence_assembler: .agents/evidence/runs/{run-id}/ only
- publisher_agent: git operations only
- All auditors: read-only

## Success Criteria
✅ Source SHA recorded (40 hex chars)
✅ Working tree clean
✅ Run directory created
✅ Manifest written with all policies
✅ File ownership documented

## Output
AgentResult with:
- status: SUCCESS
- outputs: {"run_id", "source_sha", "manifest_path"}
- evidence_ids: ["run-manifest.json"]
```

---

## Stage 3 Launch Configuration

**Trigger**: Stage 2 complete (no verdict needed, controller always passes)  
**Label**: `stage3-w1-parallel-audits`

**Prompt**:
```
# Task: W1 Parallel Read-Only Audits

## Context
Run ID: {read from stage 2 manifest}
Mode: Read-only, parallel execution

## Objectives

Launch 4 auditors in parallel, each writes to .agents/evidence/runs/{run-id}/agent-reports/

### Agent 1: Command Safety Auditor
Scan runner.py for:
- shell=True usage
- String concatenation in commands
- Unvalidated arguments
- Missing executable allowlist

Output: command-safety-audit.json

### Agent 2: Database Safety Auditor
Scan safety.py and verification_runner.py for:
- Database validation enforcement
- Production protection
- Credential isolation
- Fail-closed behavior

Output: database-safety-audit.json

### Agent 3: Test Inventory Auditor
Scan tests/ and package.json for:
- All test files
- Required vs optional tests
- Test dependencies
- Skipped/disabled tests

Output: test-inventory-audit.json

### Agent 4: Evidence Auditor
Scan .agents/evidence/ for:
- Missing evidence files
- Format violations
- Broken hashes
- Tampering indicators

Output: evidence-audit.json

## Execution Pattern
All 4 agents run in parallel using asyncio.gather()

## Success Criteria
✅ All 4 reports exist
✅ No code modified (git diff clean)
✅ Findings include file paths and line numbers
✅ Each report has structured findings array
```

---

## Stage 4 Launch Configuration

**Trigger**: Stage 3 complete with all 4 audit reports  
**Label**: `stage4-w2w3-planning`

**Prompt**:
```
# Task: W2-W3 Plan Generation and Independent Review

## Context
Run ID: {from manifest}
Audit Reports: 4 files in .agents/evidence/runs/{run-id}/agent-reports/

## Objectives

### W2 Repair Planner
1. Read all 4 audit reports
2. Deduplicate findings across reports
3. Map each finding to:
   - Owner agent
   - File to modify
   - Specific change
   - Acceptance test
4. Write repair-plan.json to agent-reports/

### W3 Independent Reviewer  
1. Read repair-plan.json
2. Check for:
   - Missing findings
   - Unsafe changes
   - Incomplete tests
   - File ownership violations
3. Write plan-review.json with verdict: APPROVED or CHANGES_REQUESTED

## Success Criteria
✅ Repair plan generated with all findings
✅ Independent review completed
✅ Verdict is APPROVED (else pipeline stops)
```

---

## Stage 5 Launch Configuration

**Trigger**: Stage 4 verdict APPROVED  
**Label**: `stage5-w4w5-implementation`

**Prompt**:
```
# Task: W4-W5 Implementation and Reviews

## Context
Approved Plan: .agents/evidence/runs/{run-id}/agent-reports/repair-plan.json

## Objectives

### W4 Implementer
Apply changes from approved plan:
- Only modify files listed in file_ownership
- Create git commit with evidence references
- Write implementation-summary.json

### W5 Parallel Reviews
Launch 3 reviewers in parallel:
1. Static/Security Reviewer - Check for new vulnerabilities
2. Test Reviewer - Verify tests match requirements
3. Artifact Reviewer - Check evidence consistency

All write to agent-reports/

## Success Criteria
✅ Changes applied to approved files only
✅ All 3 reviews complete
✅ No blocking findings
```

---

## Stage 6 Launch Configuration

**Trigger**: Stage 5 all reviews pass  
**Label**: `stage6-w6-verification`

**Prompt**:
```
# Task: W6 Verification Pipeline with Disposable Database

## Context
Implementation complete, ready for testing

## Objectives

Run verification stages sequentially:

V0: Confirm git SHA matches
V1: Validate disposable DB target
V2: Apply all migrations from empty DB
V3: Inspect schema (required tables exist)
V4: Run migration regression tests
V5: Run pnpm test in db-tutorial
V6: Run type-check/build
V7: Run Project AI integration tests
V8: Run security tests
V9: Reconcile artifacts and SHA
V10: Cleanup and verify

Each stage logs:
- Command with exit code
- stdout/stderr files
- Stage status: PASS/FAIL/BLOCKED/SKIPPED

## Success Criteria
✅ All stages PASS (no SKIPPED for mandatory)
✅ Database cleanup verified
✅ Coverage threshold met
✅ All logs captured with SHA-256
```

---

## Stage 7 Launch Configuration

**Trigger**: Stage 6 all verification stages PASS  
**Label**: `stage7-w7w8w9-publication`

**Prompt**:
```
# Task: W7-W9 Evidence Assembly and Publication

## Context
Verification complete, ready for final gate

## Objectives

### W7 Evidence Assembler
Collect and hash all artifacts:
- commands.jsonl
- All stdout/stderr files
- All reports (JUnit, coverage, audit)
- Compute SHA-256 for each
- Write evidence-manifest.json with hashes

### W8 Final Gate
Independent verification:
- Recompute all hashes, compare with manifest
- Check all required evidence exists
- Verify tested SHA matches source SHA
- Ensure no SKIPPED mandatory tests
- Write final-gate.json with verdict

### W9 Publisher
If final gate APPROVED:
- Commit all changes with evidence refs
- Push to branch
- Fetch remote SHA
- Verify remote SHA == local SHA
- Write publication.json

## Success Criteria
✅ All evidence hashed and verified
✅ Final gate APPROVED
✅ Remote SHA confirmed matches local
✅ Publication successful
```

---

## Monitoring Loop

```python
while True:
    # Check active workflow
    status = inspect_workflow(active_workflow_id)
    
    if status == "completed":
        # Read verdict if applicable
        verdict = read_verdict_json(stage_number)
        
        if verdict == "APPROVED" or stage_has_no_verdict:
            # Launch next stage
            next_workflow_id = launch_next_stage(stage_number + 1)
            active_workflow_id = next_workflow_id
            update_status_json(stage_number + 1, "IN_PROGRESS")
        else:
            # Pipeline blocked
            log_blocked(stage_number, verdict)
            break
    
    elif status == "failed":
        log_failure(stage_number)
        break
    
    # Wait for notifications
    sleep(10)
```
