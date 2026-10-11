# Migration Repair Multi-Stage Execution Plan

**Started**: 2026-10-11  
**Status**: Stage 1 in progress  
**Repository**: e:\onlinewebsites\quiz-platform  
**Branch**: project-llm-e2e-implementation  
**Base Commit**: 6cdc85ed

## Execution Order

### ✅ Stage 0: Baseline Verification (Complete)
- Verified 28 changed paths in `.agents/` directory
- Confirmed CHANGES_REQUESTED verdict at 6cdc85ed
- Identified 25% coverage vs 85% target
- Documented P0 safety gaps

### 🔄 Stage 1: P0 Safety Fixes (IN PROGRESS)
**Workflow ID**: wf_dd91a88422e75b4d  
**Status**: Planning phase  

**Objectives**:
1. Fix runner.py - Replace shell string execution with argv-based subprocess
2. Fix safety.py - Enforce DB validation at connection boundary
3. Fix verification.py - Guaranteed cleanup with try/finally
4. Fix final_gate_agent.py - Verify actual evidence, not claims
5. Fix publisher_agent.py - Distinguish approval from remote SHA confirmation

**Success Criteria**:
- All 5 P0 fixes implemented with unit tests
- Test evidence logged to `.agents/evidence/runs/p0-fixes/`
- No shell=True in runner.py
- Database validation enforced at connection time
- Cleanup verified even on errors

**Next Action**: Wait for Stage 1 completion, then launch Stage 2

---

### ⏳ Stage 2: W0 Workflow Controller (PENDING)
**Depends On**: Stage 1 approved

**Objectives**:
- Pin source commit SHA
- Create workflow run ID
- Establish file ownership map
- Check working tree clean
- Set safety and artifact policies
- Create run manifest in `.agents/evidence/runs/<run-id>/run-manifest.json`

**Agent**: workflow_controller (sequential, alone)

**Success Criteria**:
- Valid baseline manifest exists
- Run ID generated and recorded
- Working tree verified clean
- File ownership policies established

---

### ⏳ Stage 3: W1 Parallel Read-Only Audits (PENDING)
**Depends On**: Stage 2 complete

**Objectives**:
Run 4 independent read-only auditors in parallel:
1. **Command Safety Auditor** - Scan for shell injection risks, command validation
2. **Database Safety Auditor** - Verify connection validation, credential isolation
3. **Test Inventory Auditor** - Catalog test files, fixtures, required vs optional tests
4. **Evidence Auditor** - Verify artifact integrity, check for missing evidence

**Agents**: 4 parallel, read-only

**Success Criteria**:
- All 4 audit reports recorded with file paths and line numbers
- No code modifications during audits
- Findings include severity, reproduction steps, required tests
- Gate: All 4 audit reports exist

---

### ⏳ Stage 4: W2-W3 Plan Generation and Review (PENDING)
**Depends On**: Stage 3 complete

**Objectives**:
- **W2 Repair Planner**: Deduplicate W1 findings, map to owners and changes
- **W3 Independent Reviewer**: Review plan without implementing it

**Agents**: 2 sequential

**Success Criteria**:
- One deduplicated implementation plan with file-specific changes
- Independent reviewer explicitly approves or rejects
- Gate: Explicit plan approval before W4

---

### ⏳ Stage 5: W4-W5 Implementation and Reviews (PENDING)
**Depends On**: Stage 4 approved

**Objectives**:
- **W4 Implementer**: Apply approved patches with controlled file ownership
- **W5 Parallel Reviewers**:
  - Static/Security Reviewer
  - Test Reviewer  
  - Documentation/Artifact Consistency Reviewer

**Agents**: 1 implementer, then 3 parallel reviewers

**Success Criteria**:
- Changes applied only to approved files
- All 3 reviews complete
- No unresolved blocking findings
- Gate: Reviews pass, ready for testing

---

### ⏳ Stage 6: W6 Verification Pipeline (PENDING)
**Depends On**: Stage 5 approved

**Objectives**:
Execute test gates in sequence:
1. Command-execution and database-safety unit tests
2. Disposable PostgreSQL integration tests
3. Full test suite with fresh coverage report

**Agent**: verification_runner (sequential stages)

**Success Criteria**:
- Mandatory tests pass (SKIPPED not allowed)
- Database cleanup succeeds and verified
- Coverage threshold met (target: 85%, minimum: 70%)
- Raw logs and exit codes captured
- Gate: All verification stages PASS

---

### ⏳ Stage 7: W7-W9 Evidence and Publication (PENDING)
**Depends On**: Stage 6 complete

**Objectives**:
- **W7 Evidence Assembler**: Collect and hash all results
- **W8 Final Gate**: Independent validation of evidence
- **W9 Publisher**: Push approved commit, verify remote SHA

**Agents**: 3 sequential

**Success Criteria**:
- All evidence collected with SHA-256 hashes
- Final gate verifies evidence integrity
- Remote SHA matches tested SHA
- Publication confirmed (not just claimed)

---

## Evidence Collection Per Stage

Each stage logs to: `.agents/evidence/runs/<run-id>/<stage-name>/`

Required artifacts:
- `commands.jsonl` - All executed commands with exit codes
- `stdout/` and `stderr/` - Raw output files
- `reports/` - JUnit XML, coverage JSON/XML
- `agent-reports/` - Individual agent findings
- `hashes.sha256` - SHA-256 checksums for all artifacts
- `<stage>-gate.json` - Gate pass/fail/blocked decision

## Monitoring Rules

1. **Wait for completion**: Each stage must complete before launching next
2. **Check verdict**: If verdict is FAIL/BLOCKED, stop entire pipeline
3. **Verify evidence**: Check that evidence files actually exist, don't trust claims
4. **No parallel stages**: Stages 1-7 are strictly sequential
5. **Document blockers**: If any stage blocks, document why and what's needed

## Current Status

- **Active Workflow**: wf_dd91a88422e75b4d (Stage 1: P0 Safety Fixes)
- **Current Phase**: Planning
- **Awaiting**: Stage 1 completion notification
- **Next Launch**: Stage 2 (W0 Controller) after Stage 1 approval
