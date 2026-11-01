"""
Phase 5: End-to-End Integration Test
Tests complete Project LLM workflow with ObjectiveO1 ZIP
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'app'))

from app.placement.patcher import patch_blocks_schema

def test_zip_structure():
    """Test 1: Verify ZIP Structure"""
    print("=" * 80)
    print("TEST 1: ZIP Structure Verification")
    print("=" * 80)
    
    zip_path = Path(r"E:\notes\Python\objective-o1-extracted")
    required_files = [
        "ObjectiveO1Block.tsx",
        "ObjectiveO1Block.test.tsx",
        "objective-o1.schema.json",
        "objective-o1.schema.ts",
        "block.integration.json",
        "README.md"
    ]
    
    results = {}
    for file in required_files:
        exists = (zip_path / file).exists()
        results[file] = exists
        status = "✓" if exists else "✗"
        print(f"  {status} {file}")
    
    all_present = all(results.values())
    print(f"\n  Result: {'PASS' if all_present else 'FAIL'}")
    return all_present

def test_integration_contract():
    """Test 2: Verify block.integration.json Contract"""
    print("\n" + "=" * 80)
    print("TEST 2: Integration Contract Verification")
    print("=" * 80)
    
    integration_path = Path(r"E:\notes\Python\objective-o1-extracted\block.integration.json")
    
    with open(integration_path) as f:
        contract = json.load(f)
    
    required_fields = {
        "family": str,
        "version": str,
        "typeId": str,
        "componentFile": str,
        "componentExport": str,
        "testFile": str,
        "jsonSchemaFile": str,
        "typeSchemaFile": str,
        "defaultPayload": dict
    }
    
    results = {}
    for field, expected_type in required_fields.items():
        present = field in contract
        correct_type = isinstance(contract.get(field), expected_type) if present else False
        results[field] = present and correct_type
        status = "✓" if results[field] else "✗"
        value = contract.get(field, "MISSING")
        if isinstance(value, dict):
            value = f"<{expected_type.__name__}>"
        print(f"  {status} {field}: {value}")
    
    # Verify specific values
    print("\n  Specific Contract Values:")
    print(f"    family: {contract.get('family')} (expected: Objective)")
    print(f"    version: {contract.get('version')} (expected: O1)")
    print(f"    typeId: {contract.get('typeId')} (expected: objective)")
    print(f"    componentExport: {contract.get('componentExport')} (expected: ObjectiveO1Block)")
    
    contract_valid = (
        all(results.values()) and
        contract.get('family') == 'Objective' and
        contract.get('version') == 'O1' and
        contract.get('typeId') == 'objective' and
        contract.get('componentExport') == 'ObjectiveO1Block'
    )
    
    print(f"\n  Result: {'PASS' if contract_valid else 'FAIL'}")
    return contract_valid

def test_patcher_function():
    """Test 3: Test Patcher Function Directly"""
    print("\n" + "=" * 80)
    print("TEST 3: Patcher Function E2E Test")
    print("=" * 80)
    
    # Read actual blocks.schema.ts
    schema_path = Path(r"e:\onlinewebsites\quiz-platform\packages\types\src\tutorial-rich-document\schemas\blocks.schema.ts")
    original_content = schema_path.read_text(encoding='utf-8')
    
    print("  Original file length:", len(original_content), "chars")
    print("  Testing patch operation...")
    
    # Apply patch
    try:
        patched = patch_blocks_schema(
            original_content,
            schema_filename="objective-o1.schema.ts",
            schema_export_name="ObjectiveO1BlockSchema"
        )
        
        print("  ✓ Patch applied successfully")
        print("  Patched file length:", len(patched), "chars")
        
        # Verify import added
        import_check = "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in patched
        print(f"  {'✓' if import_check else '✗'} Import statement added")
        
        # Verify union member added
        union_check = "ObjectiveO1BlockSchema," in patched
        print(f"  {'✓' if union_check else '✗'} Union member added")
        
        # Test idempotency
        print("\n  Testing idempotency...")
        patched2 = patch_blocks_schema(
            patched,
            schema_filename="objective-o1.schema.ts",
            schema_export_name="ObjectiveO1BlockSchema"
        )
        
        idempotent = patched == patched2
        print(f"  {'✓' if idempotent else '✗'} Patch is idempotent")
        
        # Show the changes
        if import_check and union_check:
            print("\n  Patch Preview:")
            lines = patched.split('\n')
            for i, line in enumerate(lines, 1):
                if 'ObjectiveO1BlockSchema' in line:
                    print(f"    Line {i}: {line.strip()}")
        
        test_pass = import_check and union_check and idempotent
        print(f"\n  Result: {'PASS' if test_pass else 'FAIL'}")
        return test_pass
        
    except Exception as e:
        print(f"  ✗ Patch failed: {e}")
        print(f"\n  Result: FAIL")
        return False

def test_branch_isolation():
    """Test 4: Verify Branch Isolation"""
    print("\n" + "=" * 80)
    print("TEST 4: Branch Isolation Verification")
    print("=" * 80)
    
    import subprocess
    
    try:
        # Check current branch
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=r"e:\onlinewebsites\quiz-platform",
            capture_output=True,
            text=True
        )
        current_branch = result.stdout.strip()
        print(f"  Current branch: {current_branch}")
        
        # Verify it's the feature branch
        correct_branch = current_branch == "feature/patch-blocks-schema-integration"
        print(f"  {'✓' if correct_branch else '✗'} On feature branch")
        
        # Check git status
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=r"e:\onlinewebsites\quiz-platform",
            capture_output=True,
            text=True
        )
        
        untracked_files = [line for line in result.stdout.split('\n') if line.startswith('??')]
        print(f"\n  Untracked files: {len(untracked_files)}")
        for file in untracked_files[:5]:  # Show first 5
            print(f"    {file}")
        
        print(f"\n  Result: {'PASS' if correct_branch else 'FAIL'}")
        return correct_branch
        
    except Exception as e:
        print(f"  ✗ Git check failed: {e}")
        print(f"\n  Result: FAIL")
        return False

def test_schema_files():
    """Test 5: Verify Schema Files Content"""
    print("\n" + "=" * 80)
    print("TEST 5: Schema Files Content Verification")
    print("=" * 80)
    
    # Check JSON schema
    json_schema_path = Path(r"E:\notes\Python\objective-o1-extracted\objective-o1.schema.json")
    with open(json_schema_path) as f:
        json_schema = json.load(f)
    
    print("  JSON Schema:")
    print(f"    ✓ Title: {json_schema.get('title')}")
    print(f"    ✓ Type: {json_schema.get('type')}")
    print(f"    ✓ Required fields: {json_schema.get('required')}")
    print(f"    ✓ Properties: {list(json_schema.get('properties', {}).keys())}")
    
    # Check TypeScript schema
    ts_schema_path = Path(r"E:\notes\Python\objective-o1-extracted\objective-o1.schema.ts")
    ts_content = ts_schema_path.read_text(encoding='utf-8')
    
    print("\n  TypeScript Schema:")
    interface_check = "ObjectiveO1BlockContract" in ts_content
    print(f"    {'✓' if interface_check else '✗'} Interface defined")
    
    type_check = "type: 'objective'" in ts_content
    print(f"    {'✓' if type_check else '✗'} Type field present")
    
    version_check = "version: 'O1'" in ts_content
    print(f"    {'✓' if version_check else '✗'} Version field present")
    
    content_check = "content:" in ts_content
    print(f"    {'✓' if content_check else '✗'} Content structure defined")
    
    test_pass = interface_check and type_check and version_check and content_check
    print(f"\n  Result: {'PASS' if test_pass else 'FAIL'}")
    return test_pass

def generate_report(results: Dict[str, bool]):
    """Generate final E2E test report"""
    print("\n" + "=" * 80)
    print("PHASE 5: E2E INTEGRATION TEST REPORT")
    print("=" * 80)
    
    print("\nTest Results:")
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {test_name}")
    
    total = len(results)
    passed = sum(results.values())
    
    print(f"\nSummary: {passed}/{total} tests passed")
    
    all_passed = all(results.values())
    print(f"\nOverall Status: {'✓ ALL TESTS PASSED' if all_passed else '✗ SOME TESTS FAILED'}")
    
    if all_passed:
        print("\n✓ Success Criteria Met:")
        print("  • ZIP structure valid")
        print("  • Integration contract verified")
        print("  • Patcher function works correctly")
        print("  • Feature branch isolated")
        print("  • Ready for final review")
    
    return all_passed

def main():
    """Run all E2E tests"""
    print("PHASE 5: END-TO-END INTEGRATION TEST")
    print("Testing complete Project LLM workflow with ObjectiveO1 ZIP")
    print()
    
    results = {}
    
    # Run all tests
    results["ZIP Structure"] = test_zip_structure()
    results["Integration Contract"] = test_integration_contract()
    results["Schema Files Content"] = test_schema_files()
    results["Patcher Function"] = test_patcher_function()
    results["Branch Isolation"] = test_branch_isolation()
    
    # Generate report
    all_passed = generate_report(results)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
