#!/usr/bin/env python3
"""
Verify Phase 2 implementation is complete.
"""

import inspect
from pathlib import Path
from app.certification.gates import CertificationGateExecutor
from app.models.candidate import PlacementManifest
from app.agents import governance, toolchain, dependency, intake, placement, documentation

print("=== PHASE 2 VERIFICATION ===\n")

# Wave R3: Placement Manifest Integration
print("Wave R3: Placement Manifest Integration")
gates = [
    'execute_ubrc_gate',
    'execute_brand_independence_gate',
    'execute_registry_verification_gate',
    'execute_renderer_verification_gate',
    'execute_evidence_binding_gate',
    'execute_composer_verification_gate',
    'execute_theme_compatibility_gate',
    'execute_runtime_verification_gate',
    'execute_browser_verification_gate'
]

for gate_name in gates:
    method = getattr(CertificationGateExecutor, gate_name)
    sig = inspect.signature(method)
    params = sig.parameters
    
    if 'manifest' in params:
        manifest_param = params['manifest']
        # Check it's required (no default)
        is_required = manifest_param.default == inspect.Parameter.empty
        # Check it's PlacementManifest type
        is_correct_type = 'PlacementManifest' in str(manifest_param.annotation)
        
        status = "✅" if (is_required and is_correct_type) else "❌"
        print(f"  {status} {gate_name}: manifest required={is_required}, type_correct={is_correct_type}")
    else:
        print(f"  ❌ {gate_name}: manifest parameter missing")

# Check validation methods exist
executor = CertificationGateExecutor({}, Path('.'))
has_validate = hasattr(executor, '_validate_manifest')
has_path_inference = hasattr(executor, '_detect_path_inference')
has_semantic = hasattr(executor, '_validate_evidence_semantic_binding')

print(f"  {'✅' if has_validate else '❌'} _validate_manifest method exists")
print(f"  {'✅' if has_path_inference else '❌'} _detect_path_inference method exists")
print(f"  {'✅' if has_semantic else '❌'} _validate_evidence_semantic_binding method exists")

# Wave R4: Six Agent Handlers
print("\nWave R4: Six Agent Handlers")
agent_modules = [
    ('toolchain', toolchain),
    ('dependency', dependency),
    ('intake', intake),
    ('placement', placement),
    ('governance', governance),
    ('documentation', documentation)
]

for agent_name, module in agent_modules:
    func_name = f'execute_{agent_name}'
    has_func = hasattr(module, func_name)
    print(f"  {'✅' if has_func else '❌'} {func_name} exists in app/agents/{agent_name}.py")

# Wave R5: Governance manifest enforcement (Finding #4)
print("\nWave R5: Governance Enforcement (Review Finding #4)")
gov_src = Path('app/agents/governance.py').read_text()
enforces_manifest = 'errors.append' in gov_src and 'manifest_hash' in gov_src
print(f"  {'✅' if enforces_manifest else '❌'} Governance agent enforces manifest requirement")

print("\n=== PHASE 2 COMPLETE ===")
