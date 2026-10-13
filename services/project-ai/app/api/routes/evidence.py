"""Evidence access endpoints."""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.auth.types import AuthenticatedPrincipal
from app.repository.discovery_client import DiscoveryClient

router = APIRouter(prefix="/evidence", tags=["evidence"])


def get_discovery_client() -> DiscoveryClient:
    """Dependency injection for discovery client."""
    import os
    workspace_root = os.environ.get(
        'WORKSPACE_ROOT',
        'E:\\onlinewebsites\\quiz-platform'
    )
    snapshot_path = os.path.join(
        workspace_root,
        'packages',
        'project-llm-discovery',
        'output',
        'snapshot.json'
    )
    return DiscoveryClient(snapshot_path)


@router.get("/{evidence_id}", response_model=Dict[str, Any])
async def get_evidence_by_id(
    evidence_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    client: DiscoveryClient = Depends(get_discovery_client)
):
    """
    Get specific evidence record by ID.
    
    Args:
        evidence_id: Unique evidence identifier (e.g., "file:apps/admin/package.json")
        
    Returns:
        Evidence record with path, kind, lifecycle, content hash, and claim.
        
    Raises:
        404: If evidence ID not found or snapshot not available
    """
    try:
        evidence = client.get_evidence_by_id(evidence_id)
        if evidence is None:
            raise HTTPException(
                status_code=404,
                detail=f"Evidence not found: {evidence_id}"
            )
        return evidence
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evidence: {e}"
        )


@router.get("", response_model=List[Dict[str, Any]])
async def get_all_evidence(
    user: AuthenticatedPrincipal = Depends(get_current_user),
    client: DiscoveryClient = Depends(get_discovery_client)
):
    """
    Get all evidence records from snapshot.
    
    Returns:
        List of all evidence records.
        
    Raises:
        404: If snapshot file not found
    """
    try:
        evidence_list = client.get_all_evidence()
        return evidence_list
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evidence: {e}"
        )
