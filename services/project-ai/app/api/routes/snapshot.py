"""Snapshot access endpoints."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.repository.discovery_client import DiscoveryClient

router = APIRouter(prefix="/snapshot", tags=["snapshot"])


def get_discovery_client() -> DiscoveryClient:
    """
    Dependency injection for discovery client.
    
    In production, this should read the snapshot path from environment config.
    For M2.8, we use a default path relative to the workspace root.
    """
    # Default path: workspace_root/packages/project-llm-discovery/output/snapshot.json
    # TODO: Make configurable via environment variable in M3+
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


@router.get("", response_model=Dict[str, Any])
async def get_snapshot(
    user: dict = Depends(get_current_user),
    client: DiscoveryClient = Depends(get_discovery_client)
):
    """
    Get the complete TypeScript-generated snapshot.
    
    Returns:
        Full snapshot including metadata, applications, packages,
        services, evidence, and findings.
        
    Raises:
        404: If snapshot file not found (scan not run yet)
        500: If snapshot is invalid or corrupt
    """
    try:
        snapshot = client.load_snapshot()
        return snapshot
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Invalid snapshot: {e}")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load snapshot: {e}"
        )


@router.get("/metadata", response_model=Dict[str, Any])
async def get_snapshot_metadata(
    user: dict = Depends(get_current_user),
    client: DiscoveryClient = Depends(get_discovery_client)
):
    """
    Get snapshot metadata only (timestamps, scanner versions).
    
    Returns:
        Snapshot metadata without full entity lists.
    """
    try:
        metadata = client.get_metadata()
        return metadata
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load metadata: {e}"
        )
