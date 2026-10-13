# Stage 4: W2-W3 Plan Generation and Independent Review

## Prerequisites
- Stage 3 (W1 Audits) complete
- All 4 audit reports exist in agent-reports/
- Read-only constraint verified (no files modified)

## Workflow Prompt

# Task: Stage 4 - W2-W3 Repair Planning and Independent Review

## Context
Repository: e:\onlinewebsites\quiz-platform
Run ID: migration-repair-20261011-143539-06936246
Audit Reports: 4 files in .agents/evidence/runs/{run-id}/agent-reports/

## Objectives

Execute two sequential agents:
1. **W2 Repair Planner** - Generate comprehensive repair plan
2. **W3 Independent Reviewer** - Review plan without implementing

### W2 Repair Planner

**Input**: Read all 4 audit reports:
- command-safety-audit.json
- database-safety-audit.json
- test-inventory-audit.json
- evidence-audit.json

**Process**:
1. **Aggregate Findings**: Collect all findings across 4 reports
2. **Deduplicate**: Remove duplicate findings (same file/line)
3. **Prioritize**: Order by severity (CRITICAL → HIGH → MEDIUM → LOW)
4. **Map to Actions**: For each finding, specify:
   - Owner agent (who fixes it)
   - File to modify (exact path)
   - Specific change required
   - Acceptance test (how to verify fix)
   - Risk level (what could go wrong)
5. **Group by Agent**: Organize changes by which agent owns them
6. **Verify File Ownership**: Check against run-manifest.json file_ownership rules

**Output**: Write `.agents/evidence/runs/{run-id}/agent-reports/repair-plan.json`

Structure:
```json
{
  "plan_id": "repair-plan-{timestamp}",
  "run_id": "migration-repair-20261011-143539-06936246",
  "created_at": "ISO-8601",
  "created_by": "repair_planner",
  "source_reports": [
    "command-safety-audit.json",
    "database-safety-audit.json",
    "test-inventory-audit.json",
    "evidence-audit.json"
  ],
  "findings_summary": {
    "total_findings": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "duplicates_removed": 0
  },
  "repair_items": [
    {
      "item_id": "REPAIR-001",
      "finding_id": "CMD-001",
      "finding_source": "command-safety-audit.json",
      "severity": "CRITICAL",
      "file": "services/project-ai/app/workflows/migration_repair/runner.py",
      "line": 42,
      "description": "Shell injection vulnerability",
      "owner_agent": "repair_implementer",
      "specific_change": "Replace shell=True with create_subprocess_exec(*argv)",
      "acceptance_test": "test_runner_rejects_shell_metacharacters",
      "risk": "LOW - already fixed in FEAT-001, this is verification",
      "file_ownership_verified": true
    }
  ],
  "grouped_by_agent": {
    "repair_implementer": ["REPAIR-001", "REPAIR-002"],
    "evidence_assembler": ["REPAIR-015"],
    "no_action_needed": ["REPAIR-020"]
  },
  "estimated_effort": "2-4 hours",
  "prerequisites": ["All P0 fixes must remain in place"],
  "blockers": []
}
```

### W3 Independent Reviewer

**Input**: Read repair-plan.json

**Review Criteria**:
1. **Completeness**: All findings from audits addressed?
2. **Safety**: No unsafe or destructive changes?
3. **File Ownership**: All modifications respect ownership rules?
4. **Test Coverage**: Each change has acceptance test?
5. **Missing Findings**: Any critical issues not in plan?
6. **Scope Creep**: Any changes beyond audit findings?

**Process**:
- Read all 4 original audit reports
- Compare against repair plan
- Check for missing findings
- Verify file ownership compliance
- Assess risk of each change
- Look for unintended side effects

**Output**: Write `.agents/evidence/runs/{run-id}/agent-reports/plan-review.json`

Structure:
```json
{
  "review_id": "plan-review-{timestamp}",
  "plan_id": "repair-plan-{timestamp}",
  "reviewer": "repair_reviewer",
  "reviewed_at": "ISO-8601",
  "verdict": "APPROVED|CHANGES_REQUESTED|REJECTED",
  "findings": [
    {
      "finding_id": "REV-001",
      "severity": "HIGH|MEDIUM|LOW",
      "type": "MISSING|UNSAFE|OWNERSHIP_VIOLATION|INSUFFICIENT_TEST",
      "description": "Finding description",
      "location": "repair_items[5]",
      "recommendation": "Specific fix needed"
    }
  ],
  "checklist": {
    "all_audits_addressed": true,
    "no_unsafe_changes": true,
    "file_ownership_respected": true,
    "tests_comprehensive": true,
    "no_missing_findings": true,
    "no_scope_creep": true
  },
  "summary": {
    "findings_count": 0,
    "blocking_findings": 0,
    "approval_decision": "APPROVED",
    "reasoning": "All audit findings properly addressed with safe changes and comprehensive tests"
  }
}
```

## Execution Pattern

**Sequential** - W3 must wait for W2:
```python
# W2 Repair Planner
plan_result = await repair_planner.execute(context)

# W3 Independent Reviewer
review_result = await repair_reviewer.execute(context)
```

## Gate Logic

**APPROVED**: Proceed to Stage 5 (W4-W5 Implementation)
**CHANGES_REQUESTED**: Return findings to user, wait for manual adjustment
**REJECTED**: Pipeline stops, report critical issues

## Success Criteria

1. ✅ Repair plan generated from all 4 audit reports
2. ✅ All findings mapped to specific actions
3. ✅ File ownership verified for all changes
4. ✅ Independent review completed
5. ✅ Verdict is APPROVED (else pipeline pauses)
6. ✅ Plan includes acceptance tests for each change
7. ✅ No blocking findings from reviewer

## Verification

After completion:
```bash
# Check both files exist
test -f .agents/evidence/runs/{run-id}/agent-reports/repair-plan.json
test -f .agents/evidence/runs/{run-id}/agent-reports/plan-review.json

# Check verdict
jq '.verdict' .agents/evidence/runs/{run-id}/agent-reports/plan-review.json
# Must be "APPROVED"

# Count repair items
jq '.repair_items | length' .agents/evidence/runs/{run-id}/agent-reports/repair-plan.json
```

## Next Stage

If verdict is APPROVED: Launch Stage 5 (W4-W5 Implementation)
If CHANGES_REQUESTED or REJECTED: Stop pipeline, report to user
