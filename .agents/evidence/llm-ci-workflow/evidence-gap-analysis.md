# LLM CI Workflow Evidence Gap Analysis

**Created:** 2026-10-11T21:07:00Z  
**Created By:** W4 Repair Implementer  
**Run ID:** migration-repair-20261011-143539-06936246  
**Related Finding:** EVID-007

## Executive Summary

This document analyzes evidence gaps in the LLM CI workflow and provides recommendations for complete evidence capture in future workflow runs.

## Current State

The `llm-ci-workflow` evidence directory was created as part of this repair implementation. Prior to this, no dedicated evidence directory existed for LLM CI workflow executions.

## Expected Evidence Structure

Based on standard CI/CD evidence requirements and the migration repair workflow pattern, the LLM CI workflow should capture:

### Gate A: Pre-Flight Checks
- [ ] Repository state snapshot (commit SHA, branch, clean working tree status)
- [ ] Environment validation (dependencies, tool versions)
- [ ] Safety checks (production protection, database validation)

### Gate B: Code Changes
- [ ] Fix commit SHA
- [ ] Git diff output (before/after comparison)
- [ ] Fix summary (what was changed and why)
- [ ] Files modified list
- [ ] Lines added/removed statistics

### Gate C: Testing & Migration
- [ ] Migration execution logs
- [ ] Migration success/failure status
- [ ] Test execution results (unit, integration, E2E)
- [ ] Test coverage reports
- [ ] Schema validation results

### Gate D: Quality Assurance
- [ ] Static analysis results (linting, type checking)
- [ ] Security scan results
- [ ] Code review checklist
- [ ] Performance benchmarks (if applicable)

### Gate E: Evidence Assembly
- [ ] Comprehensive evidence manifest
- [ ] SHA-256 hashes for all artifacts
- [ ] Tamper-proof evidence ledger (evidence.jsonl)
- [ ] Agent execution log (agent-runs.jsonl)

### Gate F: Final Verification
- [ ] All gates status summary
- [ ] Pass/fail/blocked verdict
- [ ] Verification timestamp
- [ ] Approver information (if applicable)

## Identified Gaps

### Critical Gaps (Blocking)
None currently identified - directory structure is now in place.

### High Priority Gaps
1. **Missing Gate B Evidence (INCOMPLETE)**
   - Fix commit SHA not captured
   - Git diff output not saved
   - Fix summary not documented
   - **Impact:** Cannot trace what changes were made
   - **Recommendation:** Add post-commit evidence capture in publisher agent

2. **Missing Gate C Evidence (INCOMPLETE)**
   - Migration output logs not saved
   - Test execution results not captured
   - **Impact:** Cannot verify migration and tests actually ran
   - **Recommendation:** Redirect migration and test output to evidence files

### Medium Priority Gaps
1. **Incomplete Evidence Manifest**
   - Missing artifact checksums for some files
   - **Recommendation:** Add comprehensive SHA-256 hashing for all artifacts

2. **Limited Agent Execution Logs**
   - Some agents may not be logging to agent-runs.jsonl
   - **Recommendation:** Verify all agents append to evidence ledger

### Low Priority Gaps
1. **Missing Performance Metrics**
   - No timing data for critical path operations
   - **Recommendation:** Add duration_ms to all agent outputs

## Evidence Capture Checklist for Future Runs

### Before Workflow Execution
- [ ] Create run directory: `.agents/evidence/llm-ci-workflow/runs/{run-id}/`
- [ ] Initialize evidence.jsonl ledger
- [ ] Initialize agent-runs.jsonl ledger
- [ ] Initialize commands.jsonl log
- [ ] Create run-manifest.json with baseline state

### During Workflow Execution
- [ ] Log each agent execution to agent-runs.jsonl
- [ ] Log each command to commands.jsonl
- [ ] Save command outputs to evidence directory
- [ ] Capture git operations (commits, diffs, SHAs)
- [ ] Save test results to evidence directory
- [ ] Save migration logs to evidence directory

### After Workflow Execution
- [ ] Compute SHA-256 hashes for all artifacts
- [ ] Append artifact records to evidence.jsonl
- [ ] Generate evidence manifest summary
- [ ] Create final gate report
- [ ] Archive run directory

## Recommended Evidence Structure

```
.agents/evidence/llm-ci-workflow/
├── runs/
│   └── {run-id}/
│       ├── run-manifest.json          # Run metadata and configuration
│       ├── evidence.jsonl             # Artifact evidence ledger
│       ├── agent-runs.jsonl           # Agent execution log
│       ├── commands.jsonl             # Command execution log
│       ├── artifacts/
│       │   ├── fix-commit-diff.patch  # Git diff output
│       │   ├── migration-output.log   # Migration execution log
│       │   ├── test-results.json      # Test execution results
│       │   └── final-gate-report.json # Final verification report
│       └── agent-reports/
│           ├── gate-a-preflight.json
│           ├── gate-b-changes.json
│           ├── gate-c-testing.json
│           ├── gate-d-quality.json
│           ├── gate-e-evidence.json
│           └── gate-f-final.json
├── llm-ci-workflow-manifest.md        # Workflow documentation
└── evidence-gap-analysis.md           # This file
```

## Implementation Plan

### Phase 1: Infrastructure (Completed in this repair)
- [x] Create `.agents/evidence/llm-ci-workflow/` directory
- [x] Document evidence gap analysis (this file)
- [x] Add commands.jsonl logging to runner.py

### Phase 2: Evidence Capture (Next Sprint)
- [ ] Implement Gate B evidence capture in publisher agent
- [ ] Implement Gate C evidence capture in verification_runner
- [ ] Add SHA-256 hashing for all artifacts
- [ ] Create evidence manifest generation utility

### Phase 3: Verification (Future)
- [ ] Add evidence integrity verification
- [ ] Implement tamper detection
- [ ] Create evidence replay utility for audits

## References

- **Project LLM CI Evidence Manifest:** `.agents/evidence/project-llm-ci-evidence-manifest.md`
- **Migration Repair Evidence Pattern:** `.agents/evidence/runs/migration-repair-*/`
- **Evidence Ledger Specification:** `services/project-ai/app/evidence/ledger.py`

## Appendix A: Evidence Requirements by Gate

### Gate B: Code Changes (Detailed Requirements)
1. **Fix Commit SHA**
   - Format: Full 40-character SHA-1 hash
   - Source: `git rev-parse HEAD` after commit
   - Storage: `run-manifest.json` and `agent-reports/gate-b-changes.json`

2. **Git Diff Output**
   - Format: Unified diff format (git diff output)
   - Source: `git diff {baseline-sha} {fix-sha}`
   - Storage: `artifacts/fix-commit-diff.patch`
   - SHA-256 hash recorded in evidence.jsonl

3. **Fix Summary**
   - Format: Markdown document
   - Content: What changed, why, which files, repair items addressed
   - Storage: `artifacts/fix-summary.md`

### Gate C: Migration/Test Outputs (Detailed Requirements)
1. **Migration Output Logs**
   - Format: Plain text or JSON
   - Source: stdout/stderr from migration execution
   - Storage: `artifacts/migration-output.log`
   - Must include: timestamp, exit code, SQL statements executed, errors

2. **Test Execution Results**
   - Format: JSON test report
   - Source: pytest --json-report or equivalent
   - Storage: `artifacts/test-results.json`
   - Must include: tests run, passed, failed, skipped, duration

---

**Next Review Date:** After first LLM CI workflow run with new evidence structure  
**Owner:** Evidence Assembler Agent (W7)  
**Status:** Draft - Awaiting Implementation
