"""Placement executor agent for executing approved manifests."""

from datetime import datetime, UTC
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import PlacementManifest, PlacementDecision, BlockFamily, CandidateFile
from app.models.governance import ApprovalStatus
from app.placement.executor import PlacementExecutor, PlacementExecutionError


async def execute_placement_executor(context: AgentContext) -> AgentResult:
    """
    Execute placement executor agent (Agent 10).
    
    Executes approved placement manifests:
    - Reads approved PlacementManifest from prior agent
    - Verifies manifest_hash matches approval record
    - Executes each PlacementEntry: create/update/merge files at target_path
    - Uses placement/executor.py PlacementExecutor class
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with files_created, files_updated, files_skipped, execution_result
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get approval result from prior agent
        approval_result = context.prior_agent_outputs.get('approval')
        if not approval_result or approval_result.status != AgentStatus.SUCCESS:
            return AgentResult(
                agent_id="placement_executor",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Approval agent did not succeed - cannot execute unapproved manifest"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Get manifest from placement_manifest agent
        manifest_result = context.prior_agent_outputs.get('placement_manifest')
        if not manifest_result or not manifest_result.passed:
            return AgentResult(
                agent_id="placement_executor",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Placement manifest agent did not pass"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Extract manifest data and reconstruct PlacementManifest
        manifest_data = manifest_result.outputs.get('manifest', {})
        manifest = _reconstruct_manifest(manifest_data)
        
        # Verify approved manifest hash matches
        approved_hash = approval_result.outputs.get('approved_manifest_hash')
        if approved_hash != manifest.manifestHash:
            return AgentResult(
                agent_id="placement_executor",
                status=AgentStatus.FAILED,
                outputs={},
                evidence_ids=[],
                errors=[
                    f"Manifest hash mismatch: approved={approved_hash}, "
                    f"manifest={manifest.manifestHash}. Cannot execute tampered manifest."
                ],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Get candidate files
        candidate_data = context.workflow_state.get('candidate', {})
        candidate_files = _parse_candidate_files(candidate_data.get('files', []))
        
        # Initialize placement executor
        executor = PlacementExecutor(context.repository_root)
        
        # Execute placement (approved status verified by executor)
        execution_result = executor.execute_placement(
            manifest=manifest,
            approval_status=ApprovalStatus.APPROVED,
            candidate_files=candidate_files
        )
        
        # Build outputs
        outputs = {
            'files_created': execution_result.get('filesWritten', 0),
            'files_updated': execution_result.get('filesUpdated', 0),
            'files_skipped': 0,
            'execution_result': execution_result,
            'target_path': execution_result.get('targetPath'),
            'branch': execution_result.get('branch'),
            'commit': execution_result.get('commit')
        }
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="placement_executor",
            status=AgentStatus.SUCCESS,
            outputs=outputs,
            evidence_ids=manifest_result.evidence_ids,
            errors=[],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except PlacementExecutionError as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="placement_executor",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Placement execution failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="placement_executor",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Placement executor failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _reconstruct_manifest(manifest_data: Dict[str, Any]) -> PlacementManifest:
    """
    Reconstruct PlacementManifest from serialized data.
    
    Args:
        manifest_data: Serialized manifest dictionary
        
    Returns:
        PlacementManifest object
    """
    return PlacementManifest(
        manifestId=manifest_data['manifestId'],
        candidateId=manifest_data['candidateId'],
        decision=PlacementDecision(manifest_data['decision']),
        targetPath=manifest_data['targetPath'],
        blockFamily=BlockFamily(manifest_data['blockFamily']),
        blockVersion=manifest_data['blockVersion'],
        requiredChanges=manifest_data['requiredChanges'],
        evidenceIds=manifest_data['evidenceIds'],
        manifestHash=manifest_data['manifestHash'],
        createdAt=manifest_data['createdAt']
    )


def _parse_candidate_files(files_data: List[Any]) -> List[CandidateFile]:
    """
    Parse candidate files into CandidateFile objects.
    
    Args:
        files_data: List of file dictionaries
        
    Returns:
        List of CandidateFile objects
    """
    candidate_files = []
    
    for file_dict in files_data:
        if not isinstance(file_dict, dict):
            continue
        
        candidate_file = CandidateFile(
            filename=file_dict.get('filename', 'unknown'),
            content=file_dict.get('content', ''),
            contentType=file_dict.get('contentType', 'text/plain'),
            hash=file_dict.get('hash', '')
        )
        candidate_files.append(candidate_file)
    
    return candidate_files
