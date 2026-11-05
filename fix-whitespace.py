#!/usr/bin/env python3
import sys

files = [
    "apps/realtutorialhub-site/components/footer/__tests__/newsletter-truth.test.tsx",
    "audit/FND16_Form_Action_Inventory_And_Persistence_Manifest.md",
    "audit/W1_W3_Working_Tree_State_7e050c4f.md",
]

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8', newline='') as f:
            lines = f.readlines()
        
        fixed_lines = [line.rstrip() + '\n' if line.endswith('\n') else line.rstrip() for line in lines]
        
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.writelines(fixed_lines)
        
        print(f"Fixed: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}", file=sys.stderr)
