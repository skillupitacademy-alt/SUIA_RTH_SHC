# Migration Repair Workflow - Stage Definitions

This directory contains the workflow definitions for each stage of the migration repair pipeline.

## Stage Order (Sequential)

1. **Stage 1**: P0 Safety Fixes - Fix critical security issues before any execution
2. **Stage 2**: W0 Controller - Initialize run, establish baseline, set policies
3. **Stage 3**: W1 Audits - 4 parallel read-only auditors scan for issues
4. **Stage 4**: W2-W3 Planning - Generate and review repair plan
5. **Stage 5**: W4-W5 Implementation - Apply changes and review
6. **Stage 6**: W6 Verification - Run tests with disposable database
7. **Stage 7**: W7-W9 Evidence - Assemble evidence, gate, and publish

## Files

- `stage2-w0-controller.md` - W0 workflow controller initialization
- `stage3-w1-audits.md` - W1 parallel read-only audits
- `stage4-w2w3-planning.md` - W2-W3 plan generation and review (TODO)
- `stage5-w4w5-implementation.md` - W4-W5 implementation and reviews (TODO)
- `stage6-w6-verification.md` - W6 test verification pipeline (TODO)
- `stage7-w7w8w9-publication.md` - W7-W9 evidence and publication (TODO)

## Usage

Each stage is launched only after the previous stage completes with APPROVED status.

Monitor active workflows:
```bash
# Check current workflow status
cat .agents/tasks/migration-repair-execution-plan.md | grep "Stage.*IN PROGRESS"

# View evidence from completed stages
ls -la .agents/evidence/runs/*/
```

## Gate Rules

- Each stage has explicit success criteria
- BLOCKED or FAILED status stops the pipeline
- Evidence must be verified before proceeding
- No stage can be skipped
