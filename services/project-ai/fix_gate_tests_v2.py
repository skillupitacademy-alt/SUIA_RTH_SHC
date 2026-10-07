#!/usr/bin/env python3
"""
Fix gate test calls to include manifest parameter with proper evidence IDs.
"""

import re
from pathlib import Path

test_file = Path('tests/test_certification_gates.py')
content = test_file.read_text()

# Add a generic evidence record to all mock snapshots that have empty evidence
# Pattern to find fixtures with empty evidence arrays
snapshot_pattern = r"(\s+def mock_snapshot_\w+\(self\):.*?'evidence': \[\])"

def add_generic_evidence(match):
    """Add generic evidence to snapshot."""
    full_match = match.group(1)
    # Replace empty evidence with generic evidence
    return full_match.replace("'evidence': []", """'evidence': [
                {
                    'evidenceId': 'ev-test-001',
                    'kind': 'type-definition',
                    'path': 'packages/ui/src/blocks/TestBlock.tsx',
                    'contentHash': 'test123',
                    'description': 'Test evidence',
                    'symbol': 'test'
                }
            ]""")

# Fix all empty evidence arrays
new_content = re.sub(snapshot_pattern, add_generic_evidence, content, flags=re.DOTALL)

# Write back
test_file.write_text(new_content)
print("Fixed test snapshots with generic evidence")
