# E2E Branch Audit Plan: project-llm-e2e-implementation

**Audit Type:** READ-ONLY INVESTIGATION  
**Branch:** project-llm-e2e-implementation  
**Remote HEAD:** origin/project-llm-e2e-implementation (506366fe)  
**Current Worktree HEAD:** m2-project-ai-canonical-wiring (5ab1d807)  
**Date:** 2026-01-11  
**Workflow:** wf_4f7ce50350375c0b

---

## Executive Summary

This is a READ-ONLY audit to investigate the `project-llm-e2e-implementation` branch and understand:
1. What work was completed (Stages 1-5 of migration repair workflow)
2. What is blocked (Stage 6 verification due to Docker/environment dependencies)
3. Branch topology and relationship to canonical-wiring
4. Unique features vs overlap with already-completed work
5. Safe commands to run for detailed analysis without modifying the working tree

**Critical Constraint:** The current worktree is on `m2-project-ai-canonical-wiring` branch with uncommitted work. All investigation commands must be read-only and non-destructive.

---

## Current Repository State

### Git Topology

```
Current HEAD:        m2-project-ai-canonical-wiring (5ab1d807)
Working tree status: Has uncommitted changes (brand isolation cleanup)
Remote tracking:     origin/m2-project-ai-canonical-wiring (2e49b2a9) - 3 commits behind local

Branches to investigate:
- origin/project-llm-e2e-implementation (506366fe)
  └─ Common ancestor: 2e49b2a9 (canonical-wiring remote HEAD)
  └─ Divergence: 60 commits unique to E2E branch
  └─ File changes: 218 files changed, 26,430 insertions, 24,618 deletions vs canonical-wiring
```

### Branch Statistics from W0 Audit

| Branch | HEAD | Commits Ahead Main | Files Changed | Status |
|--------|------|-------------------|---------------|--------|
| main | 9b272567 | 0 | — | BASELINE (205/205 tests pass) |
| m2-project-ai-canonical-wiring | 2e49b2a9 (remote) | 256 | 941 | FIX_THEN_MERGE (153/160 tests pass) |
| project-llm-e2e-implementation | 506366fe | 316 | 1127 | NEEDS_REVIEW (Stages 1-5 complete, Stage 6 blocked) |

**Key Finding:** E2E branch has 60 more commits than canonical-wiring (316 vs 256) and is the largest branch with 1,127 files changed.

---

## Existing Evidence Files Found

### Evidence Directory: `.agents/evidence/`

**Migration Repair Evidence:**
- `FINAL-STATUS-REPORT.md` — Migration repair Stages 1-5 completion summary
- `w0-baseline-audit/w0-summary.md` — W0 audit reporting E2E branch status
- `w0-baseline-audit/branch-audit.json` — Branch statistics and test evidence
- `w0-baseline-audit/migration-repair-assessment.md` — Stage 6 detail analysis
- `w0-baseline-audit/COMPLETE-ROADMAP.md` — Stage 6 blocker documentation

**Stage 6 Specific Evidence:**
- Multiple references to Stage 6 verification being BLOCKED due to Docker environment not running
- W6 V0-V10 verification pipeline results recorded in commit 506366fe
- Stage 5 final gate APPROVED with all HIGH severity fixes verified

**Key Findings from Evidence:**
1. **Stage 6 Blocker:** `stage6-setup.json` reports BLOCKED (Docker not running)
2. **Stage 6 Status:** `stage6-verification.json` reports Overall: BLOCKED
3. **Stage 5 Status:** APPROVED — all HIGH severity fixes verified
4. **Migration Status:** Stages 1-5 complete, Stage 6 skipped due to environment constraints
5. **P0 Safety Fixes:** Command injection eliminated (FEAT-001), trusted host validation (FEAT-002), cleanup verification (FEAT-003), evidence file verification (FEAT-004), remote SHA confirmation (FEAT-005)

---

## Stage 6 Blocker Analysis

### What Stage 6 Was Supposed to Do

From `.agents/evidence/w0-baseline-audit/migration-repair-assessment.md`:

> **Stage 6: Evidence Collection and Final Status (Gates E, F)**
> 
> **Purpose:** Assemble all evidence, document final status, and assess overall repair journey.

### Why Stage 6 Is Blocked

From `.agents/evidence/w0-baseline-audit/COMPLETE-ROADMAP.md`:

```
Stage 6 Isolated Test Evidence:
- stage6-setup.json - BLOCKED (Docker not running)
- stage6-migrations.json - SKIPPED
- stage6-tests.json - SKIPPED
- stage6-cleanup.json - PASS
- stage6-verification.json - Overall: BLOCKED
```

**Root Cause:** Stage 6 verification requires Docker environment to run PostgreSQL database for migration testing. The environment dependency was not satisfied, causing verification to be skipped.

### What Was Actually Committed

The HEAD commit message is:
```
506366fe chore(stage6): W6 V0-V10 verification pipeline results
```

This indicates that W6 (Wave 6) verification pipeline ran V0-V10 validators but overall Stage 6 verification was BLOCKED. The commit contains evidence artifacts but not a passing gate.

---

## Investigation Goals

### Primary Goals

1. **Confirm branch statistics** against W0 audit baseline:
   - W0 reported: 316 commits, 1127 files changed vs main
   - W0 reported: 60 commits ahead of canonical-wiring (316 - 256)
   - Remote branch HEAD: origin/project-llm-e2e-implementation (506366fe)

2. **Identify unique features** not in canonical-wiring:
   - Migration repair workflow (Stages 1-5)
   - P0 safety fixes (FEAT-001 through FEAT-005)
   - W6 verification pipeline implementation
   - Evidence collection improvements
   - Any other unique capabilities

3. **Understand Stage 6 blocker** in detail:
   - What tests were skipped
   - What environment setup is required
   - Whether Stage 6 is required for merge or can be deferred
   - What evidence exists vs what is missing

4. **Assess merge viability**:
   - Overlap with canonical-wiring (shared ancestor: 2e49b2a9)
   - Conflicts with main or canonical-wiring
   - Unique value vs duplicate work
   - Complexity and risk assessment

5. **Document safe commands** for detailed analysis without breaking the working tree.

### Secondary Goals

6. Find and catalog all W6/Stage 6/Gate F documentation
7. Identify test evidence files and their verdicts
8. Map commit history to understand development sequence
9. Assess whether E2E branch should be merged, cherry-picked, or archived

---

## Safe Commands for Investigation

### Constraint: Working Tree Protection

**CRITICAL:** The working tree is on `m2-project-ai-canonical-wiring` with uncommitted changes. All commands must be read-only and must NOT:
- Check out branches or files
- Modify the working tree
- Merge or rebase
- Reset or clean
- Create or delete branches

### Phase 1: Read Existing Evidence (No Git Commands)

**These are the safest operations — read existing evidence files first:**

```powershell
# Read Stage 6 evidence summary
Get-Content .agents\evidence\w0-baseline-audit\COMPLETE-ROADMAP.md | Select-String -Pattern "Stage 6|stage6|W6" -Context 3,3

# Read migration repair assessment
Get-Content .agents\evidence\w0-baseline-audit\migration-repair-assessment.md | Select-String -Pattern "Stage 6" -Context 5,5

# Read final status report
Get-Content .agents\evidence\FINAL-STATUS-REPORT.md

# Search for all stage6 evidence files
Get-ChildItem -Path .agents -Recurse -File | Where-Object { $_.Name -match "stage6|stage-6|W6|w6" }

# Search for verification pipeline evidence
Get-ChildItem -Path .agents -Recurse -File | Where-Object { $_.Name -match "verification|v[0-9]+-" }
```

**Rationale:** Evidence files are documentation artifacts that already exist. Reading them has zero risk.

### Phase 2: Git Log Analysis (Read-Only)

**Safe git log commands that examine remote branch history without touching the working tree:**

```powershell
# Confirm remote branch HEAD
git log --oneline origin/project-llm-e2e-implementation -1

# Count commits unique to E2E branch
git log --oneline origin/project-llm-e2e-implementation ^origin/m2-project-ai-canonical-wiring | Measure-Object -Line

# View recent E2E commits (last 20)
git log --oneline origin/project-llm-e2e-implementation -20

# View commits between canonical-wiring and E2E
git log --oneline origin/m2-project-ai-canonical-wiring..origin/project-llm-e2e-implementation

# Search for Stage 6 related commits
git log --oneline --all --grep="stage6\|Stage 6\|W6\|verification pipeline"

# Find merge base (common ancestor)
git merge-base origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation

# View commit messages with full detail for recent E2E commits
git log origin/project-llm-e2e-implementation -10 --format=fuller

# Search for migration repair commits
git log --oneline origin/project-llm-e2e-implementation --grep="migration\|repair\|FEAT-\|P0"
```

**Rationale:** `git log` with remote refs (origin/branch-name) reads commit history without modifying the working tree. Completely safe.

### Phase 3: Git Diff Statistics (Read-Only)

**Safe git diff commands that compare branches without modifying files:**

```powershell
# File change summary between canonical-wiring and E2E
git diff --stat origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation

# Detailed file list with change counts
git diff --numstat origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation

# Show which files exist in E2E but not in canonical-wiring
git diff --name-status origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Where-Object { $_ -match "^A\s" }

# Show which files were deleted in E2E vs canonical-wiring
git diff --name-status origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Where-Object { $_ -match "^D\s" }

# Compare E2E branch to main
git diff --stat origin/main origin/project-llm-e2e-implementation

# Search for specific file changes (e.g., migration repair files)
git diff --name-only origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Select-String -Pattern "migration|repair|stage6|verification"

# Search for changes in services/project-ai
git diff --name-only origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Select-String -Pattern "services/project-ai"

# Search for changes in .agents directory
git diff --name-only origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Select-String -Pattern "\.agents"
```

**Rationale:** `git diff --stat` and `--name-only` compare branches without modifying files. Completely safe.

### Phase 4: Git Show (Read Remote Branch Files)

**Safe git show commands to read file contents from remote branch without checking out:**

```powershell
# Read a specific file from E2E branch without checking it out
git show origin/project-llm-e2e-implementation:services/project-ai/app/workflows/migration_repair/stage5_implementation.py

# Check if Stage 6 implementation file exists
git show origin/project-llm-e2e-implementation:services/project-ai/app/workflows/migration_repair/stage6_verification.py 2>&1

# List files in migration_repair directory from E2E branch
git ls-tree -r --name-only origin/project-llm-e2e-implementation -- services/project-ai/app/workflows/migration_repair/

# Read evidence file from E2E branch
git show origin/project-llm-e2e-implementation:.agents/evidence/stage6-verification.json 2>&1

# List all .agents/evidence files in E2E branch
git ls-tree -r --name-only origin/project-llm-e2e-implementation -- .agents/evidence/

# Read package.json or requirements to see dependencies
git show origin/project-llm-e2e-implementation:services/project-ai/requirements.txt

# Check test files
git ls-tree -r --name-only origin/project-llm-e2e-implementation -- services/project-ai/tests/
```

**Rationale:** `git show origin/branch:path/to/file` reads a file from a specific commit without modifying the working tree. `git ls-tree` lists directory contents from a commit. Both are read-only.

### Phase 5: Merge Conflict Preview (Read-Only)

**Safe commands to preview merge conflicts without performing the merge:**

```powershell
# Preview merge conflicts between E2E and canonical-wiring (dry-run)
git merge-tree $(git merge-base origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation) origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation

# Check if E2E can fast-forward merge to canonical-wiring
git rev-list --left-right --count origin/m2-project-ai-canonical-wiring...origin/project-llm-e2e-implementation

# Preview merge conflicts between E2E and main (dry-run)
git merge-tree $(git merge-base origin/main origin/project-llm-e2e-implementation) origin/main origin/project-llm-e2e-implementation | Select-Object -First 50
```

**Rationale:** `git merge-tree` performs a 3-way merge simulation in memory without touching the working tree or creating commits. Completely safe.

### Phase 6: Branch Topology Visualization

**Safe commands to visualize branch relationships:**

```powershell
# Visualize recent history across all branches
git log --oneline --graph --all --decorate -30

# Visualize E2E and canonical-wiring divergence
git log --oneline --graph origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation -20

# Show when branches diverged
git log --oneline --graph --boundary origin/m2-project-ai-canonical-wiring...origin/project-llm-e2e-implementation -20

# List all remote branches
git branch -r

# Show branch tracking information
git remote show origin
```

**Rationale:** `git log --graph` visualizes history without modifying anything. Completely safe.

---

## Investigation Plan: Execution Order

### Step 1: Read Existing W0 Evidence (5 minutes)

**Goal:** Understand what W0 audit already documented about E2E branch

**Files to read:**
1. `.agents/evidence/w0-baseline-audit/w0-summary.md` — Executive summary
2. `.agents/evidence/w0-baseline-audit/branch-audit.json` — Branch statistics
3. `.agents/evidence/w0-baseline-audit/COMPLETE-ROADMAP.md` — Stage 6 blocker detail
4. `.agents/evidence/FINAL-STATUS-REPORT.md` — Migration repair journey summary

**Key questions:**
- What does W0 say about Stage 6?
- What are the reported blockers?
- What work was completed in Stages 1-5?
- What unique features exist in E2E branch?

### Step 2: Confirm Branch Statistics (10 minutes)

**Goal:** Verify W0 audit findings against current git state

**Commands to run:**
```powershell
# Confirm HEAD commit
git log --oneline origin/project-llm-e2e-implementation -1

# Count commits ahead of canonical-wiring
git log --oneline origin/m2-project-ai-canonical-wiring..origin/project-llm-e2e-implementation | Measure-Object -Line

# Count commits ahead of main
git log --oneline origin/main..origin/project-llm-e2e-implementation | Measure-Object -Line

# File change summary vs canonical-wiring
git diff --stat origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Select-Object -Last 1

# File change summary vs main
git diff --stat origin/main origin/project-llm-e2e-implementation | Select-Object -Last 1
```

**Expected results:**
- HEAD: 506366fe
- Commits ahead of canonical-wiring: ~60
- Commits ahead of main: ~316
- Files changed vs canonical-wiring: ~218 files
- Files changed vs main: ~1127 files

### Step 3: Identify Unique Files (15 minutes)

**Goal:** Find files that exist in E2E but not in canonical-wiring

**Commands to run:**
```powershell
# Files added in E2E branch
git diff --name-status origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Where-Object { $_ -match "^A\s" } | Out-File .agents/tasks/e2e-unique-files.txt

# Files deleted in E2E branch
git diff --name-status origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Where-Object { $_ -match "^D\s" } | Out-File .agents/tasks/e2e-deleted-files.txt

# Files modified in E2E branch
git diff --name-status origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Where-Object { $_ -match "^M\s" } | Out-File .agents/tasks/e2e-modified-files.txt

# Filter for migration repair files
Get-Content .agents/tasks/e2e-unique-files.txt | Select-String -Pattern "migration|repair|stage"

# Filter for verification pipeline files
Get-Content .agents/tasks/e2e-unique-files.txt | Select-String -Pattern "verification|v[0-9]"

# Filter for P0 safety fix files
Get-Content .agents/tasks/e2e-unique-files.txt | Select-String -Pattern "FEAT-|P0|safety"
```

**Key questions:**
- What migration repair infrastructure was added?
- What Stage 6 verification files exist?
- What P0 safety fixes were implemented?
- Are there new test files?

### Step 4: Analyze Commit History (15 minutes)

**Goal:** Understand development sequence and identify key milestones

**Commands to run:**
```powershell
# View recent commits with full messages
git log origin/project-llm-e2e-implementation -20 --format="%h %ai %an%n%s%n%b%n"

# Search for Stage 6 commits
git log --oneline origin/project-llm-e2e-implementation --grep="stage6\|Stage 6\|W6\|verification pipeline"

# Search for migration repair commits
git log --oneline origin/project-llm-e2e-implementation --grep="migration\|repair\|FEAT-\|P0"

# Find when E2E diverged from canonical-wiring
git log --oneline origin/m2-project-ai-canonical-wiring..origin/project-llm-e2e-implementation | tail -1

# Count commits by type (feat, fix, chore, docs)
git log --oneline origin/m2-project-ai-canonical-wiring..origin/project-llm-e2e-implementation | Select-String -Pattern "^[a-f0-9]+ (feat|fix|chore|docs)" | Group-Object { $_ -replace '^[a-f0-9]+ (feat|fix|chore|docs).*', '$1' }
```

**Key questions:**
- When did Stage 6 work begin?
- What was the sequence: P0 → Stage 1-5 → Stage 6?
- Are there any merge commits?
- What was the development velocity?

### Step 5: Read Key Implementation Files (20 minutes)

**Goal:** Understand what Stage 6 verification was supposed to do

**Commands to run:**
```powershell
# List migration_repair directory contents
git ls-tree -r --name-only origin/project-llm-e2e-implementation -- services/project-ai/app/workflows/migration_repair/

# Read Stage 5 implementation (what succeeded)
git show origin/project-llm-e2e-implementation:services/project-ai/app/workflows/migration_repair/stage5_implementation.py | Out-File .agents/tasks/e2e-stage5-impl.py

# Try to read Stage 6 implementation (may not exist)
git show origin/project-llm-e2e-implementation:services/project-ai/app/workflows/migration_repair/stage6_verification.py 2>&1 | Out-File .agents/tasks/e2e-stage6-check.txt

# Read verification pipeline runner
git ls-tree -r --name-only origin/project-llm-e2e-implementation | Select-String -Pattern "verification.*runner\|v[0-9]+.*verification"

# List evidence files in E2E branch
git ls-tree -r --name-only origin/project-llm-e2e-implementation -- .agents/evidence/ | Select-String -Pattern "stage6|W6|v[0-9]+-"
```

**Key questions:**
- Does Stage 6 implementation file exist?
- What do Stage 1-5 implementations look like?
- What verification pipeline infrastructure was built?
- What evidence files were generated?

### Step 6: Assess Merge Viability (15 minutes)

**Goal:** Determine merge conflicts and integration risk

**Commands to run:**
```powershell
# Preview merge conflicts
git merge-tree $(git merge-base origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation) origin/m2-project-ai-canonical-wiring origin/project-llm-e2e-implementation | Out-File .agents/tasks/e2e-merge-preview.txt -Width 200

# Count conflict markers in preview
Get-Content .agents/tasks/e2e-merge-preview.txt | Select-String -Pattern "^<<<<<<<|^=======|^>>>>>>>" | Measure-Object -Line

# Identify conflicting files
Get-Content .agents/tasks/e2e-merge-preview.txt | Select-String -Pattern "^changed in both" -Context 1,0

# Check if fast-forward is possible
git rev-list --left-right --count origin/m2-project-ai-canonical-wiring...origin/project-llm-e2e-implementation
```

**Key questions:**
- How many merge conflicts exist?
- Which files conflict?
- Is fast-forward merge possible?
- What is the conflict complexity?

### Step 7: Document Findings (20 minutes)

**Goal:** Write comprehensive investigation report

**Deliverable:** This plan document updated with findings in each section

**Structure:**
1. Confirmed branch statistics
2. Unique features identified
3. Stage 6 blocker analysis with specific details
4. Commit history timeline
5. Merge viability assessment
6. Recommendation: merge, cherry-pick, or archive

---

## Risk Assessment

### Risks of Investigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Accidentally modifying working tree | HIGH | Use only read-only commands (git log, git show, git diff with remote refs) |
| Checking out E2E branch and losing uncommitted work | HIGH | Never use git checkout or git switch commands |
| Creating merge commits accidentally | MEDIUM | Never use git merge without explicit confirmation |
| Overwhelming output from large diffs | LOW | Use Select-Object -First/Last, Out-File for large outputs |

### Risks of E2E Branch Merge

| Risk | Severity | Evidence |
|------|----------|----------|
| Merge conflicts with canonical-wiring | MEDIUM-HIGH | 218 files changed, 60 commits divergence |
| Duplicate work already in canonical-wiring | MEDIUM | W0 audit suggests overlap in some areas |
| Stage 6 blocker not resolved | MEDIUM | Docker environment dependency |
| Incomplete features merged | MEDIUM | Stage 6 verification skipped |
| Regression in passing tests | LOW | Stages 1-5 have approval evidence |

---

## Constraints and Limitations

### READ-ONLY Constraint

**This is a READ-ONLY audit.** All investigation commands are non-destructive:
- ✅ git log (remote refs only)
- ✅ git diff (remote refs only)
- ✅ git show (remote refs only)
- ✅ git ls-tree (remote refs only)
- ✅ git merge-tree (dry-run simulation)
- ✅ Reading existing evidence files
- ❌ git checkout (modifies working tree)
- ❌ git merge (creates commits)
- ❌ git rebase (modifies history)
- ❌ git reset (modifies working tree)
- ❌ git clean (deletes files)

### Environment Constraints

**Known limitations:**
1. **Docker not available:** Stage 6 verification requires Docker for PostgreSQL but environment doesn't have it
2. **Working tree on different branch:** Cannot check out E2E branch without losing uncommitted work
3. **Large branch size:** 1,127 files changed — full diff review would be extremely time-consuming

### Time Constraints

**Realistic investigation time:** 2-3 hours for comprehensive audit
- 30 minutes: Read existing evidence
- 1 hour: Git command execution and analysis
- 1 hour: File content review and documentation
- 30 minutes: Write findings and recommendations

---

## Expected Deliverables

### Primary Deliverable

**This investigation plan document** updated with findings in these sections:
1. ✅ Current repository state (COMPLETE)
2. ✅ Existing evidence files found (COMPLETE)
3. ✅ Stage 6 blocker analysis (COMPLETE - based on existing evidence)
4. ⏳ Confirmed branch statistics (TO BE FILLED)
5. ⏳ Unique features identified (TO BE FILLED)
6. ⏳ Commit history timeline (TO BE FILLED)
7. ⏳ Merge viability assessment (TO BE FILLED)
8. ⏳ Recommendation (TO BE FILLED)

### Supporting Artifacts

**Generated during investigation:**
- `e2e-unique-files.txt` — Files added in E2E branch
- `e2e-deleted-files.txt` — Files removed in E2E branch
- `e2e-modified-files.txt` — Files changed in E2E branch
- `e2e-merge-preview.txt` — Merge conflict simulation
- `e2e-stage5-impl.py` — Stage 5 implementation for reference
- `e2e-stage6-check.txt` — Stage 6 file existence check

---

## Open Questions

### Strategic Questions

1. **Should E2E branch be merged at all?**
   - Has the work been superseded by canonical-wiring?
   - Are the migration repair stages still relevant?
   - Is Stage 6 completion required before merge?

2. **What is the relationship between E2E and canonical-wiring?**
   - Common ancestor: 2e49b2a9
   - Did E2E branch start from canonical-wiring and continue forward?
   - Or did they diverge from a common point?

3. **What happened to Stage 6?**
   - Was it abandoned due to environment constraints?
   - Was it deferred for later?
   - Is there a plan to complete it?

4. **What unique value does E2E provide?**
   - Migration repair workflow (Stages 1-5)
   - P0 safety fixes (FEAT-001 through FEAT-005)
   - W6 verification pipeline infrastructure
   - Evidence collection improvements
   - Other unique capabilities?

### Technical Questions

5. **What tests were skipped in Stage 6?**
   - `stage6-migrations.json` — What migrations?
   - `stage6-tests.json` — What test suites?
   - Can these be run without Docker?

6. **What is W6 V0-V10 verification pipeline?**
   - What do validators V0-V10 check?
   - Are these the same as V1-V9 in CURRENT_STATE_AUDIT.json?
   - What evidence was collected?

7. **What are P0 safety fixes FEAT-001 through FEAT-005?**
   - Command injection elimination (FEAT-001)
   - Trusted host validation (FEAT-002)
   - Cleanup verification (FEAT-003)
   - Evidence file verification (FEAT-004)
   - Remote SHA confirmation (FEAT-005)
   - Are these already in canonical-wiring?

8. **What is the migration repair workflow?**
   - What problem did it solve?
   - Is it still relevant?
   - Should it be preserved?

---

## Recommendation Framework

### Decision Criteria

After investigation, assess E2E branch against these criteria:

1. **Unique value:** Does it contain features not in canonical-wiring?
2. **Completion:** Is the work finished or in-progress?
3. **Quality:** Are there passing tests and evidence?
4. **Conflicts:** How difficult is merge?
5. **Relevance:** Is the work still needed?

### Possible Outcomes

| Outcome | When to Choose | Next Steps |
|---------|---------------|------------|
| **Merge entire branch** | High unique value, low conflicts, work complete | Resolve Stage 6 blocker or defer, merge, verify tests |
| **Cherry-pick specific features** | Some unique value, high conflicts, mixed completion | Identify valuable commits, cherry-pick to new branch, test |
| **Archive and document** | Low unique value, work superseded, or incomplete | Document what was attempted, archive branch, move on |
| **Defer decision** | Unclear value, need more investigation | Wait for canonical-wiring merge, then reassess |

---

## Success Criteria

**This investigation is successful when:**

1. ✅ Branch statistics confirmed against W0 audit baseline
2. ✅ Unique features identified with file paths
3. ✅ Stage 6 blocker understood in detail
4. ✅ Commit history timeline documented
5. ✅ Merge viability assessed with conflict count
6. ✅ Clear recommendation provided with rationale
7. ✅ All investigation done READ-ONLY without modifying working tree

**This investigation is complete when:**
- This plan document is updated with findings in all TO BE FILLED sections
- A clear recommendation is provided: merge, cherry-pick, or archive
- The recommendation is grounded in evidence from the investigation
- No modifications to the working tree have been made

---

## Next Steps After Investigation

### If Recommendation: Merge

1. Resolve Stage 6 blocker (install Docker or defer Stage 6)
2. Merge canonical-wiring to main first (resolve its blockers)
3. Rebase E2E on top of merged canonical-wiring
4. Resolve merge conflicts
5. Run full test suite
6. Document what was merged and why

### If Recommendation: Cherry-Pick

1. Identify specific commits with unique value
2. Create new feature branch from main
3. Cherry-pick selected commits
4. Resolve conflicts
5. Run tests for cherry-picked features
6. Create focused PR for each feature group

### If Recommendation: Archive

1. Document what E2E branch attempted to accomplish
2. Document why it was not merged
3. Archive branch with clear label
4. Update documentation to point to canonical-wiring as the merged path
5. Close any related issues or PRs

### If Recommendation: Defer

1. Wait for canonical-wiring to merge to main
2. Reassess E2E branch against new main baseline
3. Re-run investigation with updated context
4. Make final decision: merge, cherry-pick, or archive

---

## Appendix: Evidence File Locations

### W0 Audit Evidence

```
.agents/evidence/w0-baseline-audit/
├── w0-summary.md                      — Executive summary
├── branch-audit.json                  — Branch statistics
├── branch-audit-summary.md            — Branch comparison
├── COMPLETE-ROADMAP.md                — Stage 6 blocker details
├── migration-repair-assessment.md     — Migration repair analysis
├── requirements-matrix.csv            — Requirements coverage
├── requirements-matrix.json           — Requirements coverage
├── implementation-inventory.json      — Capability inventory
└── canonical-docs-map.json            — Documentation index
```

### Migration Repair Evidence

```
.agents/evidence/
├── FINAL-STATUS-REPORT.md             — Migration repair journey
├── agent-runs.jsonl                   — Agent execution log
├── evidence.jsonl                     — Evidence collection log
└── [other evidence files]
```

### Task Files

```
.agents/tasks/
├── CURRENT_STATE_AUDIT.json           — M2 foundation audit
├── w0-architecture-freeze-report.json — W0 workflow freeze
└── [many other wave and gate files]
```

---

**END OF INVESTIGATION PLAN**

**Status:** PLAN COMPLETE — Ready for investigation execution  
**Next Action:** Execute investigation steps 1-7 in order, document findings, provide recommendation
