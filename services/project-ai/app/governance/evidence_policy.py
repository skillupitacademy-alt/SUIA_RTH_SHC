"""
Evidence Policy Framework for W7 Final Gate Enforcement.

Implements fail-closed validation for certification evidence with:
- Required evidence type completeness
- Verdict acceptance criteria
- Workflow and artifact binding
- Temporal freshness enforcement
- Future timestamp detection
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


@dataclass
class EvidenceResult:
    """
    Single piece of evidence for certification gate.
    
    All fields required for binding and validation.
    """
    evidence_type: str
    verdict: str
    workflow_id: str
    artifact_sha256: str
    created_at: datetime  # Must be timezone-aware UTC
    evidence_id: str


@dataclass
class EvidencePolicy:
    """
    Policy defining evidence requirements for certification.
    
    Attributes:
        required_types: Immutable set of evidence types that must be present
        max_age_seconds: Maximum age of evidence in seconds (staleness threshold)
    """
    required_types: frozenset  # frozenset[str]
    max_age_seconds: int


# Verdicts accepted for certification approval
ACCEPTED_VERDICTS = frozenset({"PASS", "APPROVED", "CERTIFICATION_READY"})


# Final gate policy for W7 certification
FINAL_GATE_POLICY = EvidencePolicy(
    required_types=frozenset({
        "security_scan",
        "ubrc_verification",
        "brand_certification",
        "theme_certification",
        "runtime_verification",
    }),
    max_age_seconds=86400  # 24 hours
)


def validate_final_gate_evidence(
    workflow_id: str,
    artifact_sha256: str,
    evidence: list,  # list[EvidenceResult]
    policy: EvidencePolicy,
) -> list:  # list[str] error codes
    """
    Validate evidence against policy with fail-closed semantics.
    
    Validation Rules:
    1. All required evidence types must be present
    2. All verdicts must be in ACCEPTED_VERDICTS
    3. All evidence must bind to the expected workflow_id
    4. All evidence must bind to the expected artifact_sha256
    5. All timestamps must be timezone-aware (not naive)
    6. No timestamps may be in the future
    7. All evidence must be within max_age_seconds
    
    Args:
        workflow_id: Expected workflow identifier
        artifact_sha256: Expected artifact hash
        evidence: List of evidence results to validate
        policy: Policy defining requirements
        
    Returns:
        Empty list if all validation passes.
        List of error strings if any validation fails.
        
    Error Format:
        - "missing_required_evidence:{type}"
        - "unaccepted_verdict:{evidence_id}:{verdict}"
        - "workflow_id_mismatch:{evidence_id}"
        - "artifact_binding_mismatch:{evidence_id}"
        - "malformed_evidence:{evidence_id}:naive_timestamp"
        - "future_evidence:{evidence_id}"
        - "stale_evidence:{evidence_id}"
        - "malformed_verdict:{evidence_id}"
    """
    errors = []
    
    # Handle None or non-iterable evidence
    if evidence is None:
        return ["missing_required_evidence:all"]
    
    try:
        evidence_list = list(evidence)
    except (TypeError, ValueError):
        return ["missing_required_evidence:all"]
    
    # Track present evidence types
    present_types = set()
    
    # Validate each evidence item
    for ev in evidence_list:
        # Track type presence
        if hasattr(ev, 'evidence_type'):
            present_types.add(ev.evidence_type)
        
        # Rule 2: Verdict acceptance (check for None/empty first)
        if not hasattr(ev, 'verdict') or ev.verdict is None or ev.verdict == "":
            errors.append(f"malformed_verdict:{ev.evidence_id if hasattr(ev, 'evidence_id') else 'unknown'}")
        elif ev.verdict not in ACCEPTED_VERDICTS:
            errors.append(f"unaccepted_verdict:{ev.evidence_id}:{ev.verdict}")
        
        # Rule 3: Workflow ID binding
        if hasattr(ev, 'workflow_id') and ev.workflow_id != workflow_id:
            errors.append(f"workflow_id_mismatch:{ev.evidence_id}")
        
        # Rule 4: Artifact SHA256 binding
        if hasattr(ev, 'artifact_sha256') and ev.artifact_sha256 != artifact_sha256:
            errors.append(f"artifact_binding_mismatch:{ev.evidence_id}")
        
        # Rule 5: Timezone-aware timestamp
        if hasattr(ev, 'created_at'):
            if isinstance(ev.created_at, datetime):
                if ev.created_at.tzinfo is None:
                    errors.append(f"malformed_evidence:{ev.evidence_id}:naive_timestamp")
                else:
                    # Rule 6: No future timestamps
                    now = datetime.now(timezone.utc)
                    if ev.created_at > now:
                        errors.append(f"future_evidence:{ev.evidence_id}")
                    
                    # Rule 7: Staleness check
                    age_seconds = (now - ev.created_at).total_seconds()
                    if age_seconds > policy.max_age_seconds:
                        errors.append(f"stale_evidence:{ev.evidence_id}")
    
    # Rule 1: Check for missing required types
    missing_types = policy.required_types - present_types
    for missing_type in missing_types:
        errors.append(f"missing_required_evidence:{missing_type}")
    
    return errors
