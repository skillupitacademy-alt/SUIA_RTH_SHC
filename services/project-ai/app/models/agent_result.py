"""
Agent Result Models.

Standardized result format for all agents in the 15-agent DAG.
Extracted from agent_coordinator.py to provide dedicated model contracts.
"""

from dataclasses import dataclass, field
from datetime import datetime, UTC
from enum import Enum
from typing import Dict, Any, List


class AgentStatus(str, Enum):
    """Status of an agent execution."""
    SUCCESS = "success"
    FAILED = "failed"
    BLOCKED = "blocked"
    SKIPPED = "skipped"
    RUNNING = "running"


class GateStatus(str, Enum):
    """Status of a certification gate."""
    PASS = "PASS"
    FAIL = "FAIL"
    BLOCKED = "BLOCKED"
    UNKNOWN = "UNKNOWN"


@dataclass
class AgentResult:
    """
    Result of an agent execution.
    
    ARCHITECTURAL RULE: Every agent MUST return:
    - agent_id: Unique agent identifier
    - status: SUCCESS | FAILED | BLOCKED | SKIPPED
    - outputs: Agent-specific output data
    - evidence_ids: List of evidence IDs from TypeScript discovery
    - errors: List of error messages
    - warnings: List of warning messages
    - execution_time_ms: Execution duration
    - timestamp: UTC timestamp
    
    No evidence_ids = BLOCKED (not PASS).
    """
    
    agent_id: str
    status: AgentStatus
    outputs: Dict[str, Any] = field(default_factory=dict)
    evidence_ids: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    execution_time_ms: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    
    @property
    def passed(self) -> bool:
        """Check if agent execution was successful."""
        return self.status == AgentStatus.SUCCESS
    
    @property
    def failed(self) -> bool:
        """Check if agent execution failed."""
        return self.status == AgentStatus.FAILED
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'agent_id': self.agent_id,
            'status': self.status.value,
            'outputs': self.outputs,
            'evidence_ids': self.evidence_ids,
            'errors': self.errors,
            'warnings': self.warnings,
            'execution_time_ms': self.execution_time_ms,
            'timestamp': self.timestamp.isoformat()
        }
