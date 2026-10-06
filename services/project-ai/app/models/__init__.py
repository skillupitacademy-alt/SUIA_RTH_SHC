"""Model definitions for Project AI."""

from .agent_result import AgentResult, AgentStatus, GateStatus
from .gate_result import GateResult, GateVerdict
from .specification import (
    CandidateBlockSpecification,
    SpecificationResult,
    SpecificationStatus,
    StructuralRequirement
)
from .placement import (
    PlacementAction,
    PlacementEntry,
    PlacementManifest,
    PlacementExecutionResult
)
from .certification import (
    CertificationVerdict,
    FinalCertification,
    HumanCertificationDecision
)

__all__ = [
    # Agent Result models
    "AgentResult",
    "AgentStatus",
    "GateStatus",
    # Gate Result models
    "GateResult",
    "GateVerdict",
    # Specification models
    "CandidateBlockSpecification",
    "SpecificationResult",
    "SpecificationStatus",
    "StructuralRequirement",
    # Placement models
    "PlacementAction",
    "PlacementEntry",
    "PlacementManifest",
    "PlacementExecutionResult",
    # Certification models
    "CertificationVerdict",
    "FinalCertification",
    "HumanCertificationDecision",
]
