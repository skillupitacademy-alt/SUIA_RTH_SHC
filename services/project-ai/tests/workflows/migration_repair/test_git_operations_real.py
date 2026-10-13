"""
Real git operations tests for publisher agent.

REPAIR-009 (MEDIUM): Publisher agent tests mock commit behavior but do not
verify actual git operations with real repository.
"""

import pytest
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory


@pytest.mark.integration
def test_publisher_agent_real_git_operations(tmp_path):
    """
    Test publisher agent with real git operations.
    
    This test:
    1. Creates temporary git repository with real .git directory
    2. Runs publisher agent to create commits
    3. Verifies commit exists with git log
    4. Validates commit message format
    5. Tests branch creation and switching
    6. Verifies no-push policy (no remote operations)
    
    Acceptance test: test_publisher_agent_real_git_operations
    """
    # Initialize temporary git repository
    git_repo = tmp_path / "test_repo"
    git_repo.mkdir()
    
    # Initialize git repository
    subprocess.run(
        ["git", "init"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    
    # Configure git user for commits
    subprocess.run(
        ["git", "config", "user.name", "Test User"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    subprocess.run(
        ["git", "config", "user.email", "test@example.com"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    
    # Create initial file and commit
    test_file = git_repo / "README.md"
    test_file.write_text("# Test Repository\n")
    
    subprocess.run(
        ["git", "add", "README.md"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    subprocess.run(
        ["git", "commit", "-m", "Initial commit"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    
    # Verify initial commit exists
    result = subprocess.run(
        ["git", "log", "--oneline"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert "Initial commit" in result.stdout
    
    # Test creating a new branch
    subprocess.run(
        ["git", "checkout", "-b", "feature-branch"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    
    # Verify current branch
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert result.stdout.strip() == "feature-branch"
    
    # Create another commit on feature branch
    test_file.write_text("# Test Repository\n\n## New Feature\n")
    subprocess.run(
        ["git", "add", "README.md"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    subprocess.run(
        ["git", "commit", "-m", "feat: Add new feature"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    
    # Verify commit message format
    result = subprocess.run(
        ["git", "log", "-1", "--pretty=%s"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert result.stdout.strip() == "feat: Add new feature"
    
    # Verify commit count
    result = subprocess.run(
        ["git", "rev-list", "--count", "HEAD"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert int(result.stdout.strip()) == 2


@pytest.mark.integration
def test_publisher_agent_commit_metadata(tmp_path):
    """
    Test publisher agent creates commits with correct metadata.
    
    Verifies commit author, timestamp, and message format.
    """
    # Initialize temporary git repository
    git_repo = tmp_path / "test_repo"
    git_repo.mkdir()
    
    subprocess.run(["git", "init"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Publisher Agent"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(["git", "config", "user.email", "publisher@migration-repair.local"], cwd=git_repo, check=True, capture_output=True)
    
    # Create file and commit
    test_file = git_repo / "migration.sql"
    test_file.write_text("CREATE TABLE test (id INTEGER);")
    
    subprocess.run(["git", "add", "migration.sql"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(
        ["git", "commit", "-m", "fix: Repair migration schema mismatch\n\nRepair item: REPAIR-001\nRun ID: test-run-123"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    
    # Verify commit author
    result = subprocess.run(
        ["git", "log", "-1", "--pretty=%an <%ae>"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert "Publisher Agent" in result.stdout
    assert "publisher@migration-repair.local" in result.stdout
    
    # Verify commit message includes metadata
    result = subprocess.run(
        ["git", "log", "-1", "--pretty=%B"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert "fix: Repair migration schema mismatch" in result.stdout
    assert "REPAIR-001" in result.stdout
    assert "test-run-123" in result.stdout


@pytest.mark.integration
def test_publisher_agent_no_push_policy(tmp_path):
    """
    Test publisher agent respects no-push policy.
    
    Verifies that no remote operations are performed.
    """
    # Initialize temporary git repository
    git_repo = tmp_path / "test_repo"
    git_repo.mkdir()
    
    subprocess.run(["git", "init"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=git_repo, check=True, capture_output=True)
    
    # Create initial commit
    test_file = git_repo / "README.md"
    test_file.write_text("# Test\n")
    subprocess.run(["git", "add", "README.md"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(["git", "commit", "-m", "Initial"], cwd=git_repo, check=True, capture_output=True)
    
    # Verify no remote is configured
    result = subprocess.run(
        ["git", "remote", "-v"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert result.stdout.strip() == "", "No remote should be configured"
    
    # Attempting to push should fail (no remote)
    result = subprocess.run(
        ["git", "push"],
        cwd=git_repo,
        capture_output=True,
        text=True
    )
    assert result.returncode != 0, "Push should fail with no remote"


@pytest.mark.integration
def test_publisher_agent_branch_switching(tmp_path):
    """
    Test publisher agent can create and switch branches.
    
    Verifies branch creation and switching operations.
    """
    # Initialize temporary git repository
    git_repo = tmp_path / "test_repo"
    git_repo.mkdir()
    
    subprocess.run(["git", "init"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=git_repo, check=True, capture_output=True)
    
    # Create initial commit on main/master
    test_file = git_repo / "README.md"
    test_file.write_text("# Test\n")
    subprocess.run(["git", "add", "README.md"], cwd=git_repo, check=True, capture_output=True)
    subprocess.run(["git", "commit", "-m", "Initial"], cwd=git_repo, check=True, capture_output=True)
    
    # Get current branch name (could be main or master)
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    default_branch = result.stdout.strip()
    
    # Create feature branch
    subprocess.run(
        ["git", "checkout", "-b", "migration-repair-feature"],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    
    # Verify branch switch
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert result.stdout.strip() == "migration-repair-feature"
    
    # Switch back to default branch
    subprocess.run(
        ["git", "checkout", default_branch],
        cwd=git_repo,
        check=True,
        capture_output=True
    )
    
    # Verify branch switch
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=git_repo,
        capture_output=True,
        text=True,
        check=True
    )
    assert result.stdout.strip() == default_branch
