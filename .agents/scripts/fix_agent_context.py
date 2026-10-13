#!/usr/bin/env python3
"""Fix AgentContext to add run_id parameter."""

import re
from pathlib import Path

def fix_file(filepath: Path) -> bool:
    content = filepath.read_text(encoding='utf-8')
    original = content
    
    # Match AgentContext(...\ntask_id="value",\n and add run_id after it
    # Pattern: AgentContext( with whitespace, then task_id="something", possibly with comma
    pattern = r'(AgentContext\([^)]*?task_id\s*=\s*"([^"]+)")(\s*,?\s*\n\s*)(workflow_state)'
    
    def replace_func(m):
        before = m.group(1)  # AgentContext(...task_id="value"
        task_val = m.group(2)  # the task_id value
        middle = m.group(3)  # whitespace and comma
        after = m.group(4)  # workflow_state
        
        # Generate run_id from task_id
        run_val = task_val.replace('task', 'run') if 'task' in task_val else task_val + '-run'
        
        return f'{before},\n            run_id="{run_val}"{middle}{after}'
    
    content = re.sub(pattern, replace_func, content, flags=re.DOTALL)
    
    if content != original:
        filepath.write_text(content, encoding='utf-8')
        return True
    return False

# Process all test files
test_dir = Path('services/project-ai/tests')
count = 0
for f in test_dir.rglob('*.py'):
    if fix_file(f):
        count += 1
        print(f'Fixed: {f}')

print(f'\nFixed {count} files')
