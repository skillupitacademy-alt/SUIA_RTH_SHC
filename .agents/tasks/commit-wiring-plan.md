# Implementation Plan: Wire `format_commit_message()` into Migration Repair Workflow

## Executive Summary

The `format_commit_message(run_id, summary)` function exists in `final_gate_agent.py` at line 168 but is never called. After comprehensive codebase exploration, **no actual git commits are currently made in the migration repair workflow**. The workflow only:
1. Modifies files directly (repair_implementer.py writes to migration files)
2. Records commit SHAs before/after operations
3. Never calls `git commit` or `repository_adapter.git_commit()`

**Key Finding**: The repair_implementer agent (W4) modifies migration files but never stages or commits them. The publisher agent (W9) explicitly does NOT push to remote but also does NOT create local commits.

## Decision: Add Commit Operations

To wire `format_commit_message()` properly, we need to:
1. Add actual commit operations to the repair_implementer agent (W4) after file modifications
2. Thread the run_id through AgentContext so all agents can access it
3. Import and call `format_commit_message()` at every commit site
4. Update tests to verify Run-ID footer appears in commit messages

## Implementation Steps

- [ ] 1. **Add `run_id` field to `AgentContext`**
      
      Add `run_id: str` field to the AgentContext dataclass so all agents can access the run identifier.
      
      **Files**: 
      - `e:\onlinewebsites\quiz-platform\services\project-ai\app\orchestration\agent_coordinator.py` (line ~38, in AgentContext dataclass)
      
      **Changes**:
      ```python
      @dataclass
      class AgentContext:
          """Context provided to an agent during execution."""
          
          task_id: str
          run_id: str  # ADD THIS LINE
          workflow_state: Dict[str, Any]
          # ... rest of fields
      ```
      
      **Verify**: Run `python -m pytest services/project-ai/tests/orchestration/test_agent_coordinator.py -v` and confirm no import errors occur.

- [ ] 2. **Update workflow_controller to capture and pass run_id**
      
      The workflow_controller (W0) already receives `context.task_id` which IS the run_id (e.g., "migration-repair-20261011-143539-06936246"). Store it in the run manifest and ensure it's available to downstream agents.
      
      **Files**:
      - `e:\onlinewebsites\quiz-platform\services\project-ai\app\workflows\migration_repair\agents\workflow_controller.py` (line ~47 in workflow_run dict)
      
      **Changes**:
      ```python
      # In execute_workflow_controller, modify workflow_run dict:
      workflow_run = {
          "workflow_id": context.task_id,
          "run_id": context.task_id,  # ADD THIS - explicit run_id field
          "baseline_sha": baseline_sha,
          "timestamp": start_time.isoformat(),
          "repository_root": str(context.repository_root),
      }
      ```
      
      **Verify**: Run `python -m pytest services/project-ai/tests/workflows/migration_repair/test_workflow_controller_complete.py -v` and confirm run_id appears in result outputs.

- [ ] 3. **Add git staging and commit operations to repair_implementer**
      
      Currently repair_implementer modifies files (lines 156-158) but never stages or commits them. Add git operations after file modifications using the run_command utility, and call format_commit_message() for the commit message.
      
      **Files**:
      - `e:\onlinewebsites\quiz-platform\services\project-ai\app\workflows\migration_repair\agents\repair_implementer.py`
      
      **Changes**:
      
      a) Add import at top of file (after line 12):
      ```python
      from ..agents.final_gate_agent import format_commit_message
      ```
      
      b) After all file modifications are complete (around line 180, before "Calculate duration" comment), add:
      ```python
      # Stage modified files if any changes were made
      if files_modified:
          # Stage all modified files
          for file_path in files_modified:
              full_path = context.repository_root / file_path
              await run_command(f"git add {file_path}", cwd=str(context.repository_root))
          
          # Create commit with Run-ID footer
          commit_message = format_commit_message(
              run_id=context.task_id,  # This is the run_id
              summary="Apply migration repair patches"
          )
          
          # Commit staged changes
          await run_command(
              f'git commit -m "{commit_message}"',
              cwd=str(context.repository_root)
          )
      ```
      
      **Note**: The run_command function already validates git commands are in ALLOWED_COMMANDS (runner.py line 29).
      
      **Verify**: 
      1. Run `python -m pytest services/project-ai/tests/workflows/migration_repair/agents/test_repair_implementer.py -v`
      2. Manually verify in a test git repo that commits contain "Run-ID: " footer

- [ ] 4. **Add git commit operation to publisher_agent (optional but recommended)**
      
      The publisher_agent (W9) currently does NOT push to remote per policy, but it should create a final commit before the "publication ready" state if any evidence files were assembled. This commit would mark the completion of the workflow run.
      
      **Files**:
      - `e:\onlinewebsites\quiz-platform\services\project-ai\app\workflows\migration_repair\agents\publisher_agent.py`
      
      **Changes**:
      
      a) Add import at top (after line 11):
      ```python
      from .final_gate_agent import format_commit_message
      ```
      
      b) After recording publication state (around line 175, after `record_publication()` call), add:
      ```python
      # Create final workflow completion commit if evidence was assembled
      evidence_assembler = context.prior_agent_outputs.get("evidence_assembler")
      if evidence_assembler and evidence_assembler.passed:
          # Stage evidence files
          await run_command("git add .agents/evidence/", cwd=str(context.repository_root))
          
          # Create commit with Run-ID footer
          commit_message = format_commit_message(
              run_id=context.task_id,
              summary=f"Migration repair workflow complete - {gate_verdict}"
          )
          
          # Commit evidence
          result = await run_command(
              f'git commit -m "{commit_message}"',
              cwd=str(context.repository_root)
          )
          
          if result.exit_code == 0:
              # Update local_sha with new commit
              sha_result = await run_command("git rev-parse HEAD", cwd=str(context.repository_root))
              local_sha = sha_result.stdout.strip()
      ```
      
      **Verify**: Run `python -m pytest services/project-ai/tests/workflows/migration_repair/agents/test_publisher_agent.py -v`

- [ ] 5. **Update repository_adapter.git_commit() to accept optional run_id parameter**
      
      The repository_adapter.git_commit() method (line 497) is the general-purpose commit function used by other parts of the codebase. Add optional run_id parameter and call format_commit_message() when provided.
      
      **Files**:
      - `e:\onlinewebsites\quiz-platform\services\project-ai\app\placement\repository_adapter.py`
      
      **Changes**:
      
      a) Add import at top of file:
      ```python
      from app.workflows.migration_repair.agents.final_gate_agent import format_commit_message
      ```
      
      b) Update git_commit method signature (line 497):
      ```python
      def git_commit(self, commit_message: str, run_id: Optional[str] = None) -> str:
          """
          Commit staged changes.
          
          Args:
              commit_message: Commit message
              run_id: Optional run identifier to append as footer
              
          Returns:
              Commit hash
              
          Raises:
              RepositoryAdapterError: If git operation fails
          """
          if self.dry_run:
              return "dry-run-commit-hash"
          
          # Format message with Run-ID footer if provided
          if run_id:
              commit_message = format_commit_message(run_id, commit_message)
          
          try:
              subprocess.run(
                  ["git", "commit", "-m", commit_message],
                  # ... rest unchanged
      ```
      
      **Verify**: Run `python -m pytest services/project-ai/tests/placement/test_repository_adapter.py::test_git_commit_in_dry_run -v`

- [ ] 6. **Add unit test for format_commit_message() integration**
      
      Create a new test that verifies the commit message format includes both the summary and the Run-ID footer.
      
      **Files**:
      - `e:\onlinewebsites\quiz-platform\services\project-ai\tests\test_migration_repair_agent_final_gate_agent.py` (add new test after line 115)
      
      **Changes**:
      ```python
      def test_format_commit_message_integration():
          """Test format_commit_message produces valid git commit messages."""
          from app.workflows.migration_repair.agents.final_gate_agent import format_commit_message
          
          run_id = "migration-repair-20261011-143539-06936246"
          
          # Test default summary
          msg = format_commit_message(run_id)
          assert msg.startswith("Migration repair verification complete")
          assert f"\n\nRun-ID: {run_id}" in msg
          assert msg.count("\n") >= 2  # Summary, blank line, footer
          
          # Test custom summary
          custom_msg = format_commit_message(run_id, "Custom repair applied")
          assert custom_msg.startswith("Custom repair applied")
          assert f"\n\nRun-ID: {run_id}" in custom_msg
          
          # Test multiline summary
          multiline = format_commit_message(
              run_id,
              "First line\n\nDetailed explanation"
          )
          assert "First line" in multiline
          assert "Detailed explanation" in multiline
          assert f"Run-ID: {run_id}" in multiline
      ```
      
      **Verify**: Run `python -m pytest services/project-ai/tests/test_migration_repair_agent_final_gate_agent.py::test_format_commit_message_integration -v`

- [ ] 7. **Add integration test for Run-ID in actual git commits**
      
      Add a test to test_git_operations_real.py that creates a real commit and verifies the Run-ID footer is present in git log output.
      
      **Files**:
      - `e:\onlinewebsites\quiz-platform\services\project-ai\tests\workflows\migration_repair\test_git_operations_real.py` (add after line 100)
      
      **Changes**:
      ```python
      @pytest.mark.integration
      def test_commit_message_with_run_id_footer(tmp_path):
          """
          Test that commits created with format_commit_message include Run-ID footer.
          
          Verifies:
          1. Run-ID appears in git log output
          2. Footer format is correct
          3. Multiline commit messages work
          """
          from app.workflows.migration_repair.agents.final_gate_agent import format_commit_message
          
          # Initialize temporary git repository
          git_repo = tmp_path / "test_repo"
          git_repo.mkdir()
          
          subprocess.run(["git", "init"], cwd=git_repo, check=True, capture_output=True)
          subprocess.run(["git", "config", "user.name", "Test"], cwd=git_repo, check=True, capture_output=True)
          subprocess.run(["git", "config", "user.email", "test@test.com"], cwd=git_repo, check=True, capture_output=True)
          
          # Create initial commit
          test_file = git_repo / "README.md"
          test_file.write_text("# Test\n")
          subprocess.run(["git", "add", "README.md"], cwd=git_repo, check=True, capture_output=True)
          subprocess.run(["git", "commit", "-m", "Initial"], cwd=git_repo, check=True, capture_output=True)
          
          # Create commit with Run-ID footer
          run_id = "migration-repair-20261011-143539-06936246"
          commit_message = format_commit_message(run_id, "Apply migration repair")
          
          test_file.write_text("# Updated\n")
          subprocess.run(["git", "add", "README.md"], cwd=git_repo, check=True, capture_output=True)
          subprocess.run(["git", "commit", "-m", commit_message], cwd=git_repo, check=True, capture_output=True)
          
          # Verify Run-ID in git log
          result = subprocess.run(
              ["git", "log", "-1", "--format=%B"],  # Get full commit message
              cwd=git_repo,
              capture_output=True,
              text=True,
              check=True
          )
          
          assert "Apply migration repair" in result.stdout
          assert f"Run-ID: {run_id}" in result.stdout
          assert result.stdout.strip().endswith(run_id)
      ```
      
      **Verify**: Run `python -m pytest services/project-ai/tests/workflows/migration_repair/test_git_operations_real.py::test_commit_message_with_run_id_footer -v --integration`

- [ ] 8. **Update all instantiations of AgentContext to include run_id**
      
      Search the codebase for all places where AgentContext is instantiated and ensure run_id is passed. The most common pattern is context.task_id should be used for run_id.
      
      **Files** (search results):
      - `e:\onlinewebsites\quiz-platform\services\project-ai\app\orchestration\agent_coordinator.py` (where AgentContext is created in execute_agent or similar)
      - All test files that create AgentContext instances
      
      **Changes**: For each AgentContext instantiation, add `run_id=task_id` or `run_id="test-run-id"` in tests.
      
      **Verify**: Run full test suite: `python -m pytest services/project-ai/tests/ -v -k "agent" --tb=short` and fix any TypeErrors about missing run_id argument.

## File Ownership and Safety

- **W4 (repair_implementer)**: Can modify migration files and commit them - change is within approved scope
- **W9 (publisher_agent)**: Can commit evidence files - change is within approved scope
- **repository_adapter**: Shared utility, change is backwards compatible (optional parameter)
- **AgentContext**: Core dataclass, change requires updates to all instantiations

## Dependencies

1. Step 1 must complete before steps 2-5 (all depend on AgentContext.run_id)
2. Steps 3-5 are independent of each other
3. Steps 6-7 depend on steps 3-5 completing (test the implementations)
4. Step 8 must be done last (fixes all instantiations after AgentContext is modified)

## Verification Strategy

1. Unit tests verify format_commit_message() is called and produces correct output
2. Integration tests verify Run-ID footer appears in actual git log output
3. Full workflow test verifies commits are created at correct stages
4. Git log inspection confirms Run-ID traceability in commit history

## Risk Assessment

**Low Risk**: All changes are additive (new commits, optional parameters). The format_commit_message() function already exists and is tested. No existing commit behavior is modified - we're only adding commits where they were missing and ensuring they all include Run-ID footers.

## Rollback Plan

If issues arise:
1. Revert commits to AgentContext (step 1)
2. Revert agent changes (steps 3-4)
3. Revert repository_adapter change (step 5)
4. The workflow will continue to work in "read-only" mode without creating commits
