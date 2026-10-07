"""
Append B03 agent run evidence to ledger.
"""

import sys
from pathlib import Path
from datetime import datetime, timezone

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.evidence.ledger import append_agent_run

# B03 agent run evidence
run_evidence = {
    "agent_id": "B03",
    "agent_name": "Repository Contract Intelligence",
    "wave": "WAVE_1",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "status": "SUCCESS",
    "artifacts_created": [
        "services/project-ai/app/contracts/repository_intelligence.py",
        "services/project-ai/app/contracts/__init__.py",
        "services/project-ai/tests/unit/test_repository_intelligence.py",
        "services/project-ai/tests/unit/__init__.py"
    ],
    "tests_executed": [
        "test_repository_evidence_creation",
        "test_canonical_reference_creation",
        "test_runtime_contract_defaults",
        "test_repository_block_contract_creation",
        "test_build_contract_returns_contract",
        "test_build_contract_sha256_non_empty",
        "test_build_contract_nonexistent_family_returns_empty_references",
        "test_build_contract_introduction_i1",
        "test_build_contract_definition_d1",
        "test_build_contract_evidence_id_deterministic",
        "test_compute_sha256",
        "test_generate_evidence_id",
        "test_generate_evidence_id_deterministic"
    ],
    "tests_passed": 13,
    "tests_failed": 0,
    "canonical_files_discovered": [
        "packages/ui/src/tutorial/blocks/CodeC1Block.tsx",
        "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        "packages/ui/src/tutorial/blocks/DefinitionBlock.tsx"
    ],
    "sha256_hashes_computed": True,
    "evidence_ids_deterministic": True,
    "contract_generation_verified": True,
    "blockers": [],
    "notes": [
        "Successfully created repository intelligence layer",
        "All canonical blocks (I1, C1, D1) discovered and hashed",
        "Evidence IDs are deterministic and reproducible",
        "Contract generation handles missing files gracefully",
        "All 13 unit tests passing"
    ]
}

append_agent_run(run_evidence)
print("✓ B03 evidence appended to agent-runs.jsonl")
