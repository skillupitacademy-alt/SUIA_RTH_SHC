#!/usr/bin/env python3
"""
Fix gate test calls to include manifest parameter.
"""

import re
from pathlib import Path

test_file = Path('tests/test_certification_gates.py')
content = test_file.read_text()

# Pattern to match gate execution calls
# Matches: result = executor.execute_XXX_gate(['YYY'])
pattern = r"(        result = executor\.execute_(\w+)_gate\(\[([^\]]+)\]\))"

def replace_gate_call(match):
    """Replace gate call with manifest-aware version."""
    full_match = match.group(1)
    gate_name = match.group(2)
    candidates = match.group(3)
    
    # Generate manifest creation with unique target path
    # Use a path that's NOT derivable from candidate ID
    manifest_line = f"        manifest = create_valid_manifest('test-{gate_name}', 'packages/ui/src/blocks/TestBlock.tsx', ['ev-test-001'])\n"
    new_call = f"        result = executor.execute_{gate_name}_gate([{candidates}], manifest)"
    
    return manifest_line + new_call

# Replace all occurrences
new_content = re.sub(pattern, replace_gate_call, content)

# Write back
test_file.write_text(new_content)
print(f"Fixed {len(re.findall(pattern, content))} gate calls")
