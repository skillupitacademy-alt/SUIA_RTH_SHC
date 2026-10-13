# CLI --dry-run Manual Verification Guide

**Purpose**: Verify that the CLI script's `--dry-run` flag displays the execution plan without making changes.

---

## Command to Run

```bash
cd e:\onlinewebsites\quiz-platform/services/project-ai
python scripts/run-migration-repair.py --dry-run
```

---

## Expected Output

The command should:

1. **Exit with code 0** (success)

2. **Display the workflow plan** showing all 10 waves (W0-W9) with their agents:
   ```
   MIGRATION REPAIR WORKFLOW
   ================================================================================
   Workflow ID: workflow_YYYYMMDD_HHMMSS
   Start Time: YYYY-MM-DDTHH:MM:SS+00:00

   DRY RUN MODE: Showing execution plan

   W0: Initialize workflow and establish baseline
     Execution: Sequential
     Agents: 1
       - workflow_controller

   W1: Parallel audit agents (read-only baseline)
     Execution: Parallel
     Agents: 4
       - migration_audit
       - database_safety_audit
       - test_inventory
       - evidence_audit

   W2: Generate repair plan from W1 findings
     Execution: Sequential
     Agents: 1
       - repair_planner

   W3: Independent review of repair plan
     Execution: Sequential
     Agents: 1
       - repair_reviewer

   W4: Apply approved minimal patches
     Execution: Sequential
     Agents: 1
       - repair_implementer

   W5: Parallel pre-verification reviews
     Execution: Parallel
     Agents: 2
       - static_reviewer
       - test_reviewer

   W6: Execute migrations and tests against fresh database
     Execution: Sequential
     Agents: 1
       - verification_runner

   W7: Collect logs, exit codes, and artifact hashes
     Execution: Sequential
     Agents: 1
       - evidence_assembler

   W8: Independent gate review of code and evidence
     Execution: Sequential
     Agents: 1
       - final_gate_agent

   W9: Publish verified changes and evidence
     Execution: Sequential
     Agents: 1
       - publisher_agent

   Total waves: 10
   Total agents: 14

   Run without --dry-run to execute workflow
   ```

3. **NOT execute any agents** - no database writes, no file modifications, no git operations

4. **NOT create any artifacts** - no evidence files, no reports, no commits

---

## How to Verify No Mutations Occurred

### Check 1: No Evidence Files Created
```bash
# Before running dry-run, note the evidence directory state
ls -la .agents/evidence/

# Run dry-run
python scripts/run-migration-repair.py --dry-run

# After dry-run, verify no new files were created
ls -la .agents/evidence/
```

**Expected**: No new `.jsonl` files or other evidence artifacts created.

### Check 2: No Git Commits Made
```bash
# Before running dry-run
git log -1 --oneline

# Run dry-run
python scripts/run-migration-repair.py --dry-run

# After dry-run, verify HEAD hasn't moved
git log -1 --oneline
```

**Expected**: The most recent commit is the same before and after.

### Check 3: No Files Modified
```bash
# Before running dry-run
git status

# Run dry-run
python scripts/run-migration-repair.py --dry-run

# After dry-run, verify no files modified
git status
```

**Expected**: `nothing to commit, working tree clean`

### Check 4: No Database Writes
If `TEST_DATABASE_URL_TUTORIAL` is set, verify no new rows added to the database:
```sql
-- Before dry-run, count rows in workflow tables
SELECT COUNT(*) FROM workflows;
SELECT COUNT(*) FROM agent_runs;

-- Run dry-run

-- After dry-run, verify counts are the same
SELECT COUNT(*) FROM workflows;
SELECT COUNT(*) FROM agent_runs;
```

**Expected**: Row counts unchanged.

---

## Automated Test Verification

The tests in `tests/workflows/migration_repair/test_cli_dry_run.py` verify:

1. ✅ Dry-run produces execution plan output
2. ✅ Dry-run does not execute agents (mocked verification)
3. ✅ Dry-run does not write to database (mocked verification)
4. ✅ Without dry-run, agents ARE executed (mocked verification)
5. ✅ Dry-run shows all 10 waves (W0-W9)
6. ✅ Dry-run exits with code 0

**Note**: Some tests mock the workflow execution to avoid actual I/O operations during testing. The manual verification above confirms end-to-end behavior.

---

## Troubleshooting

### Issue: Script not found
**Error**: `python: can't open file 'scripts/run-migration-repair.py': [Errno 2] No such file or directory`

**Solution**: Ensure you're in the `services/project-ai` directory:
```bash
cd e:\onlinewebsites\quiz-platform/services/project-ai
python scripts/run-migration-repair.py --dry-run
```

### Issue: Import errors
**Error**: `ModuleNotFoundError: No module named 'app'`

**Solution**: Run from the project root where `app/` is a subdirectory:
```bash
cd e:\onlinewebsites\quiz-platform/services/project-ai
python scripts/run-migration-repair.py --dry-run
```

### Issue: Workflow actually executes
**Symptom**: Evidence files are created, git commits made, or database writes detected

**Problem**: The `--dry-run` flag is not working correctly.

**Investigation**:
1. Check `scripts/run-migration-repair.py` line ~148 for `if args.dry_run:` branch
2. Verify `workflow._dry_run_preview()` is being called
3. Confirm `workflow.execute()` is NOT called when `--dry-run` is True

---

## Pass Criteria

The --dry-run functionality is verified if ALL of the following are true:

- ✅ Command exits with code 0
- ✅ Output contains "DRY RUN MODE" header
- ✅ Output shows all 10 waves (W0-W9)
- ✅ Output shows correct agent counts (1, 4, 1, 1, 1, 2, 1, 1, 1, 1)
- ✅ No evidence files created in `.agents/evidence/`
- ✅ No git commits made
- ✅ No files modified (`git status` clean)
- ✅ No database writes (if TEST_DATABASE_URL_TUTORIAL is set)

---

## Reference

- **CLI Script**: `services/project-ai/scripts/run-migration-repair.py`
- **Test File**: `services/project-ai/tests/workflows/migration_repair/test_cli_dry_run.py`
- **Related Documentation**: `.agents/tasks/task-migration-repair/verification-findings.md`

---

**Status**: READY FOR MANUAL VERIFICATION

The dry-run functionality is implemented and can be manually verified using the steps above. Automated tests cover the interface but cannot fully test subprocess execution without risking timeout issues in CI/CD environments.
