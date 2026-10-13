#!/usr/bin/env python3
"""
Script to add run_id parameter to all AgentContext instantiations in test files.
"""

import re
import sys
from pathlib import Path

def update_agent_context_in_file(file_path: Path) -> bool:
    """
    Update AgentContext instantiations in a file to include run_id parameter.
    
    Returns:
        True if file was modified, False otherwise
    """
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    
    # First, remove any malformed run_id lines
    content = re.sub(r',\s*,\\n\s+run_id="[^"]*"', '', content)
    content = re.sub(r',,\\n\s+run_id="[^"]*"', '', content)
    
    # Pattern to match AgentContext( followed by task_id= without run_id already present
    # Look ahead to make sure run_id isn't already there
    pattern = r'(AgentContext\s*\(\s*\n?\s*)(task_id\s*=\s*"([^"]+)")(,\s*\n\s*)((?!run_id))'
    
    def replacement(match):
        indent = match.group(1)
        task_id_line = match.group(2)
        task_id_value = match.group(3)
        comma_newline = match.group(4)
        # Convert task_id to run_id (e.g., test-task-001 -> test-run-001, or use same value)
        run_id_value = task_id_value.replace("task", "run") if "task" in task_id_value else f"{task_id_value}-run"
        # Add run_id parameter after task_id
        return f'{indent}{task_id_line},\n            run_id="{run_id_value}"{comma_newline}'
    
    # Apply the replacement
    content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        return True
    return False


def main():
    # Get the test directory
    repo_root = Path(__file__).parent.parent.parent
    test_dir = repo_root / "services" / "project-ai" / "tests"
    
    if not test_dir.exists():
        print(f"Test directory not found: {test_dir}")
        return 1
    
    modified_count = 0
    checked_count = 0
    
    # Find all Python test files
    for test_file in test_dir.rglob("test_*.py"):
        checked_count += 1
        if update_agent_context_in_file(test_file):
            modified_count += 1
            print(f"Updated: {test_file.relative_to(repo_root)}")
    
    print(f"\nChecked {checked_count} files, modified {modified_count} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
