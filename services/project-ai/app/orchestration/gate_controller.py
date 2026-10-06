"""
Gate controller for M2 milestone verification.

Gates ensure work meets quality/completeness criteria before advancing.
Gate evaluation reads the snapshot, NOT the repository directly.
"""

from typing import Any, Callable, Dict, List

from pydantic import BaseModel


class GateDefinition(BaseModel):
    """Definition of a gate check."""
    gate_id: str
    name: str
    description: str
    required_evidence_kinds: List[str]
    validator_ids: List[str]


class GateResult(BaseModel):
    """Result of gate evaluation."""
    gate_id: str
    passed: bool
    message: str
    evidence_checked: int
    errors: List[str]


class GateController:
    """
    Controller for evaluating milestone gates against snapshot data.
    
    Gates read the TypeScript snapshot to verify completeness/correctness.
    They do NOT scan the repository independently.
    """
    
    def __init__(self):
        self.gates = self._initialize_gates()
    
    def _initialize_gates(self) -> Dict[str, GateDefinition]:
        """
        Define M2 gates.
        
        Each gate specifies:
        - Required evidence kinds
        - Validator IDs that must pass
        """
        return {
            "M2.1": GateDefinition(
                gate_id="M2.1",
                name="Project Snapshot Foundation",
                description="Basic snapshot structure with evidence binding",
                required_evidence_kinds=["package", "file"],
                validator_ids=["V1", "V2", "V3"]
            ),
            "M2.2": GateDefinition(
                gate_id="M2.2",
                name="Strict Evidence Binding",
                description="All entities have evidenceId, V8 validation passes",
                required_evidence_kinds=["package", "file"],
                validator_ids=["V1", "V8"]
            ),
            "M2.3": GateDefinition(
                gate_id="M2.3",
                name="Toolchain Detection",
                description="D2 scanner populates toolchain evidence",
                required_evidence_kinds=["config"],
                validator_ids=["V1", "V3"]
            ),
            "M2.4": GateDefinition(
                gate_id="M2.4",
                name="Composer Discovery",
                description="D4 scanner discovers API routes, schemas, services, UI",
                required_evidence_kinds=["api-route", "schema", "service", "ui-component"],
                validator_ids=["V1", "V8"]
            ),
            "M2.5": GateDefinition(
                gate_id="M2.5",
                name="Dependency Graph",
                description="D5 scanner builds dependency graph from package.json",
                required_evidence_kinds=["dependency-declaration", "dependency-resolution"],
                validator_ids=["V1", "V8"]
            ),
            "M2.6": GateDefinition(
                gate_id="M2.6",
                name="UBRC Verification",
                description="D3 scanner verifies Universal Block Renderer Contract",
                required_evidence_kinds=["ubrc-verification"],
                validator_ids=["V1"]
            ),
            "M2.7": GateDefinition(
                gate_id="M2.7",
                name="Evidence Reconciliation",
                description="All evidence IDs unique, no broken bindings",
                required_evidence_kinds=[],
                validator_ids=["V1", "V8"]
            ),
            "M2.8": GateDefinition(
                gate_id="M2.8",
                name="FastAPI Project AI Foundation",
                description="Python service reads snapshot, exposes orchestration APIs",
                required_evidence_kinds=[],
                validator_ids=[]
            ),
        }
    
    def evaluate_gate(self, gate_id: str, snapshot: Dict[str, Any]) -> GateResult:
        """
        Evaluate a gate against snapshot data.
        
        Args:
            gate_id: Gate identifier (e.g., "M2.2")
            snapshot: TypeScript-generated snapshot
            
        Returns:
            Gate evaluation result
            
        Raises:
            ValueError: If gate_id is unknown
        """
        if gate_id not in self.gates:
            raise ValueError(f"Unknown gate: {gate_id}")
        
        gate = self.gates[gate_id]
        errors: List[str] = []
        
        # Check required evidence kinds exist
        evidence_list = snapshot.get("evidence", [])
        evidence_kinds = {e.get("kind") for e in evidence_list}
        
        missing_kinds = [
            kind for kind in gate.required_evidence_kinds
            if kind not in evidence_kinds
        ]
        
        if missing_kinds:
            errors.append(f"Missing evidence kinds: {missing_kinds}")
        
        # Check validator results (if available in snapshot)
        findings = snapshot.get("findings", [])
        validator_errors = [
            f for f in findings
            if f.get("severity") == "error" and f.get("validator") in gate.validator_ids
        ]
        
        if validator_errors:
            for error in validator_errors[:5]:  # Limit to first 5 errors
                errors.append(f"{error.get('validator')}: {error.get('message')}")
        
        passed = len(errors) == 0
        
        return GateResult(
            gate_id=gate_id,
            passed=passed,
            message=f"Gate {gate_id} {'PASS' if passed else 'FAIL'}",
            evidence_checked=len(evidence_list),
            errors=errors
        )
    
    def get_gate_definition(self, gate_id: str) -> GateDefinition:
        """Get gate definition by ID."""
        if gate_id not in self.gates:
            raise ValueError(f"Unknown gate: {gate_id}")
        return self.gates[gate_id]
    
    def list_gates(self) -> List[GateDefinition]:
        """Get all gate definitions."""
        return list(self.gates.values())
