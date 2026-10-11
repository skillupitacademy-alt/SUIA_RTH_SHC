"""
Gate evaluation for migration repair workflow.

Implements fail-closed logic where BLOCKED or SKIPPED checks prevent approval.
"""

from dataclasses import dataclass
from typing import Sequence

from .models import CheckStatus


@dataclass(frozen=True)
class RequiredCheck:
    """A required check for final gate evaluation."""
    
    check_id: str
    name: str
    description: str


# Required checks for migration repair approval
REQUIRED_CHECKS: tuple[RequiredCheck, ...] = (
    RequiredCheck(
        check_id="migration_execution",
        name="Migration Execution",
        description="All migrations executed successfully against fresh database"
    ),
    RequiredCheck(
        check_id="schema_verification",
        name="Schema Verification",
        description="Database schema matches expected state"
    ),
    RequiredCheck(
        check_id="package_tests",
        name="Package Tests",
        description="All package tests passed"
    ),
    RequiredCheck(
        check_id="integration_tests",
        name="Integration Tests",
        description="Backend integration tests passed"
    ),
    RequiredCheck(
        check_id="security_tests",
        name="Security Tests",
        description="Security tests passed"
    ),
    RequiredCheck(
        check_id="evidence_complete",
        name="Evidence Complete",
        description="All evidence artifacts collected and hashed"
    ),
    RequiredCheck(
        check_id="commit_identity",
        name="Commit Identity",
        description="Tested commit SHA matches published commit SHA"
    ),
)


def evaluate_final_gate(check_results: dict[str, CheckStatus]) -> CheckStatus:
    """
    Evaluate final gate based on required checks.
    
    Implements fail-closed logic:
    - If any required check is FAIL, BLOCKED, or SKIPPED -> gate is BLOCKED
    - If all required checks are PASS -> gate is PASS
    - Otherwise -> gate is BLOCKED
    
    FEAT-004: Explicitly rejects SKIPPED status for any required check.
    
    Args:
        check_results: Map of check_id to CheckStatus
        
    Returns:
        CheckStatus: PASS if all required checks pass, BLOCKED otherwise
    """
    # Check that all required checks are present
    missing_checks = []
    for required in REQUIRED_CHECKS:
        if required.check_id not in check_results:
            missing_checks.append(required.check_id)
    
    if missing_checks:
        # Missing checks = BLOCKED
        return CheckStatus.BLOCKED
    
    # Fail-closed: any non-PASS status blocks the gate
    # FEAT-004: Explicitly reject SKIPPED status
    for required in REQUIRED_CHECKS:
        status = check_results[required.check_id]
        if status != CheckStatus.PASS:
            # FAIL, BLOCKED, or SKIPPED all block the gate
            return CheckStatus.BLOCKED
    
    # All required checks passed
    return CheckStatus.PASS
