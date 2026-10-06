"""
Gate Result Models.

Standardized result format for certification gates (Agents 12A-12J).
"""

from dataclasses import dataclass
from typing import List, Dict, Any
from enum import Enum


class GateVerdict(str, Enum):
    """Gate verification verdict."""
    PASS = "PASS"
    FAIL = "FAIL"
    BLOCKED = "BLOCKED"


@dataclass
class GateResult:
    """
    Result of a certification gate execution.
    
    Each gate (UBRC, Brand, Theme, etc.) returns:
    - gate_id: Gate identifier
    - verdict: PASS | FAIL | BLOCKED
    - message: Human-readable summary
    - evidence_ids: Evidence supporting verdict
    - blockers: Specific issues preventing PASS
    - execution_time_ms: Duration
    """
    
    gate_id: str
    verdict: GateVerdict
    message: str
    evidence_ids: List[str]
    blockers: List[str]
    execution_time_ms: float
    timestamp: str  # ISO 8601
    
    @property
    def passed(self) -> bool:
        """Check if gate passed."""
        return self.verdict == GateVerdict.PASS
    
    @property
    def blocked(self) -> bool:
        """Check if gate is blocked."""
        return self.verdict == GateVerdict.BLOCKED
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'gate_id': self.gate_id,
            'verdict': self.verdict.value,
            'message': self.message,
            'evidence_ids': self.evidence_ids,
            'blockers': self.blockers,
            'execution_time_ms': self.execution_time_ms,
            'timestamp': self.timestamp
        }
