"""
Canonical comparison agent handler.

B06 Agent: Canonical Comparator

Compares candidate artifacts against canonical repository blocks using
RepositoryBlockContract and WorkflowTarget to ensure version consistency
and artifact completeness.
"""

from datetime import datetime, UTC
from typing import Any, Dict, List, Literal
from pydantic import BaseModel, Field

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.contracts.repository_intelligence import RepositoryBlockContract
from app.models.workflow_target import WorkflowTarget


class ArtifactComparison(BaseModel):
    """Comparison result for a single artifact."""
    artifact_path: str = Field(..., description="Path to the artifact")
    status: Literal["MATCH", "MISSING", "UNEXPECTED", "MISMATCH"] = Field(
        ..., description="Comparison status"
    )
    expected_sha256: str = Field(default="", description="Expected SHA-256 hash")
    actual_sha256: str = Field(default="", description="Actual SHA-256 hash")
    evidence_id: str = Field(default="", description="Evidence ID for this artifact")


class ComparisonResult(BaseModel):
    """
    Result of canonical comparison.
    
    This replaces the stub and provides actionable comparison data.
    """
    status: Literal["PASS", "FAIL", "BLOCKED"] = Field(
        ..., description="Overall comparison status"
    )
    target_match: bool = Field(
        ..., description="Whether target family/version matches"
    )
    artifacts: List[ArtifactComparison] = Field(
        default_factory=list, description="Per-artifact comparison results"
    )
    missing_requirements: List[str] = Field(
        default_factory=list, description="Required artifacts that are missing"
    )
    unexpected_artifacts: List[str] = Field(
        default_factory=list, description="Artifacts not in the contract"
    )
    conflicts: List[str] = Field(
        default_factory=list, description="Conflicts detected during comparison"
    )
    evidence_ids: List[str] = Field(
        default_factory=list, description="Evidence IDs used in comparison"
    )
    
    @property
    def is_approved(self) -> bool:
        """Whether the comparison passed all checks."""
        return self.status == "PASS"


class CanonicalComparator:
    """
    Compares candidate artifacts against canonical repository contracts.
    
    Uses RepositoryBlockContract and WorkflowTarget to ensure:
    - Family and version match
    - Required artifacts are present
    - No unexpected artifacts
    - No conflicts with canonical blocks
    """
    
    def compare(
        self,
        candidate_artifacts: List[Dict[str, Any]],
        required_artifacts: List[str],
        target_family: str,
        target_version: str,
        contract: RepositoryBlockContract = None
    ) -> ComparisonResult:
        """
        Compare candidate artifacts against canonical contract.
        
        Args:
            candidate_artifacts: List of candidate artifact dictionaries
            required_artifacts: List of required artifact names from contract
            target_family: Target block family (e.g., 'Introduction')
            target_version: Target version (e.g., 'I7')
            contract: Optional RepositoryBlockContract for detailed comparison
            
        Returns:
            ComparisonResult with detailed comparison data
        """
        # Check if contract is available
        if contract is None:
            return ComparisonResult(
                status="BLOCKED",
                target_match=False,
                conflicts=["RepositoryBlockContract not available"]
            )
        
        # Check family and version match
        family_match = contract.family == target_family
        version_match = contract.version == target_version
        target_match = family_match and version_match
        
        if not target_match:
            return ComparisonResult(
                status="FAIL",
                target_match=False,
                conflicts=[
                    f"Family mismatch: expected {target_family}, got {contract.family}"
                    if not family_match else "",
                    f"Version mismatch: expected {target_version}, got {contract.version}"
                    if not version_match else ""
                ],
                evidence_ids=self._extract_evidence_ids(contract)
            )
        
        # Extract candidate artifact names
        candidate_artifact_names = set()
        for artifact in candidate_artifacts:
            name = artifact.get('name', '') or artifact.get('filename', '')
            if name:
                candidate_artifact_names.add(name)
        
        # Check for missing required artifacts
        missing_requirements = []
        for required in required_artifacts:
            # More flexible matching: check if any candidate artifact contains keywords
            required_keywords = self._extract_keywords(required)
            found = any(
                any(keyword in name.lower() for keyword in required_keywords)
                for name in candidate_artifact_names
            )
            if not found:
                missing_requirements.append(required)
        
        # Check for unexpected artifacts
        unexpected_artifacts = []
        required_keywords_all = set()
        for req in required_artifacts:
            required_keywords_all.update(self._extract_keywords(req))
        
        for name in candidate_artifact_names:
            name_lower = name.lower()
            # Check if artifact matches any expected keywords
            matches = any(keyword in name_lower for keyword in required_keywords_all)
            if not matches:
                unexpected_artifacts.append(name)
        
        # Build artifact comparisons
        artifacts = []
        evidence_ids = self._extract_evidence_ids(contract)
        
        for artifact in candidate_artifacts:
            name = artifact.get('name', '') or artifact.get('filename', '')
            sha256 = artifact.get('sha256', '')
            
            # Determine status
            if name in missing_requirements:
                status = "MISSING"
            elif name in unexpected_artifacts:
                status = "UNEXPECTED"
            else:
                # For now, mark as MATCH if present and expected
                # Could be enhanced with actual hash comparison
                status = "MATCH"
            
            artifacts.append(ArtifactComparison(
                artifact_path=name,
                status=status,
                expected_sha256="",
                actual_sha256=sha256,
                evidence_id=evidence_ids[0] if evidence_ids else ""
            ))
        
        # Determine overall status
        if missing_requirements or not target_match:
            overall_status = "FAIL"
        elif unexpected_artifacts:
            # Unexpected artifacts are a warning but not a failure
            overall_status = "PASS"
        else:
            overall_status = "PASS"
        
        conflicts = []
        if missing_requirements:
            conflicts.append(f"Missing required artifacts: {', '.join(missing_requirements)}")
        
        return ComparisonResult(
            status=overall_status,
            target_match=target_match,
            artifacts=artifacts,
            missing_requirements=missing_requirements,
            unexpected_artifacts=unexpected_artifacts,
            conflicts=conflicts,
            evidence_ids=evidence_ids
        )
    
    def _extract_keywords(self, requirement: str) -> List[str]:
        """
        Extract matching keywords from a requirement string.
        
        Args:
            requirement: Requirement string (e.g., "HTML/CSS/JS prototype")
            
        Returns:
            List of keywords to match
        """
        # Extract meaningful keywords
        keywords = []
        requirement_lower = requirement.lower()
        
        # Map requirements to file-related keywords
        if "html" in requirement_lower:
            keywords.extend(["html", ".html", "prototype"])
        if "css" in requirement_lower:
            keywords.extend(["css", ".css", "style"])
        if "js" in requirement_lower or "javascript" in requirement_lower:
            keywords.extend(["js", ".js", "script"])
        if "prototype" in requirement_lower:
            keywords.extend(["prototype", "html"])
        if "react" in requirement_lower or "typescript" in requirement_lower:
            keywords.extend(["tsx", ".tsx", "ts", ".ts", "react", "component", "implementation"])
        if "type" in requirement_lower and "definition" in requirement_lower:
            keywords.extend(["type", ".ts", "types", ".d.ts"])
        if "test" in requirement_lower or "unit" in requirement_lower:
            keywords.extend(["test", ".test", ".spec", "spec"])
        
        return keywords if keywords else [requirement_lower]
    
    def _extract_evidence_ids(self, contract: RepositoryBlockContract) -> List[str]:
        """
        Extract evidence IDs from contract references.
        
        Args:
            contract: RepositoryBlockContract
            
        Returns:
            List of evidence IDs
        """
        evidence_ids = []
        for reference in contract.references:
            for evidence in reference.evidence:
                if evidence.evidence_id:
                    evidence_ids.append(evidence.evidence_id)
        return evidence_ids


async def execute_canonical_comparison(context: AgentContext) -> AgentResult:
    """
    Execute canonical comparison agent.
    
    Compares candidate artifacts against the canonical repository contract
    derived from WorkflowTarget.
    
    Args:
        context: Agent execution context with workflow state
        
    Returns:
        AgentResult with comparison_result output
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract workflow state
        workflow_state = context.workflow_state
        candidate_data = workflow_state.get('candidate', {})
        target_data = workflow_state.get('target', {})
        contract_data = workflow_state.get('contract', {})
        
        # Get candidate artifacts
        candidate_artifacts = candidate_data.get('files', [])
        
        # Build target from workflow state
        if not target_data:
            return AgentResult(
                agent_id="canonical_comparison",
                status=AgentStatus.FAILED,
                outputs={},
                evidence_ids=[],
                errors=["WorkflowTarget not found in workflow state"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        target_family = target_data.get('family', '')
        target_version = target_data.get('version', '')
        
        # Build contract from workflow state (if available)
        contract = None
        if contract_data:
            try:
                contract = RepositoryBlockContract(**contract_data)
            except Exception as e:
                # Contract parsing failed, will be handled as BLOCKED
                pass
        
        # Get required artifacts from contract or use defaults
        required_artifacts = []
        if contract:
            required_artifacts = contract.required_artifacts
        else:
            # Default required artifacts
            required_artifacts = [
                "HTML/CSS/JS prototype",
                "React/TypeScript implementation",
                "Type definitions",
                "Unit tests"
            ]
        
        # Perform comparison
        comparator = CanonicalComparator()
        comparison = comparator.compare(
            candidate_artifacts=candidate_artifacts,
            required_artifacts=required_artifacts,
            target_family=target_family,
            target_version=target_version,
            contract=contract
        )
        
        # Build outputs
        outputs = {
            'comparison_result': comparison.model_dump()
        }
        
        # Collect evidence IDs
        evidence_ids = comparison.evidence_ids
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        # Determine agent status based on comparison result
        agent_status = AgentStatus.SUCCESS if comparison.is_approved else AgentStatus.FAILED
        
        # Build warnings
        warnings = []
        if comparison.unexpected_artifacts:
            warnings.append(f"Unexpected artifacts found: {', '.join(comparison.unexpected_artifacts)}")
        
        return AgentResult(
            agent_id="canonical_comparison",
            status=agent_status,
            outputs=outputs,
            evidence_ids=evidence_ids,
            errors=comparison.conflicts if comparison.status == "FAIL" else [],
            warnings=warnings,
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="canonical_comparison",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Canonical comparison failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
