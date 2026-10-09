"""
Task management endpoints.

DEPRECATED (M2.9 Wave 0): These endpoints are deprecated in favor of /workflows endpoints.

Migration path:
- POST /tasks/plan -> POST /workflows
- GET /tasks/{task_id} -> GET /workflows/{workflow_id}
- POST /tasks/{task_id}/approve -> POST /workflows/{workflow_id}/transition
- POST /tasks/{task_id}/reject -> POST /workflows/{workflow_id}/transition

These endpoints will be removed in a future version. Please migrate to the
canonical workflow API for new integrations.

Timeline:
- Wave 0: Deprecation warnings added
- Wave 1+: Endpoints removed, return 410 GONE
"""

from datetime import datetime, timezone
from typing import Dict
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends

from app.auth.dependencies import get_current_user
from app.auth.types import AuthenticatedPrincipal
from app.api.schemas.models import (
    TaskActionResponse,
    TaskCreateRequest,
    TaskResponse,
)
from app.models.task_state import TaskState

router = APIRouter(prefix="/tasks", tags=["tasks"], deprecated=True)

# In-memory task storage for M2.8 (production persistence in M3+)
_tasks: Dict[str, Dict] = {}


@router.post("/plan", response_model=TaskResponse)
async def create_planning_task(
    request: TaskCreateRequest,
    user: AuthenticatedPrincipal = Depends(get_current_user)
):
    """
    Create a new planning task.
    
    **DEPRECATED**: Use POST /workflows instead.
    
    Migration: Replace with POST /workflows with target_family, target_version, requester_id.
    
    Args:
        request: Task description and optional context
        
    Returns:
        Created task with CREATED state
    """
    task_id = str(uuid4())
    now = datetime.now(timezone.utc)
    
    task = {
        "task_id": task_id,
        "state": TaskState.CREATED,
        "description": request.description,
        "created_at": now,
        "updated_at": now,
        "context": request.context or {},
        "error": None,
    }
    
    _tasks[task_id] = task
    
    return TaskResponse(**task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_status(
    task_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user)
):
    """
    Get task status by ID.
    
    **DEPRECATED**: Use GET /workflows/{workflow_id} instead.
    
    Args:
        task_id: Unique task identifier
        
    Returns:
        Current task state and metadata
        
    Raises:
        404: If task not found
    """
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")
    
    return TaskResponse(**_tasks[task_id])


@router.post("/{task_id}/approve", response_model=TaskActionResponse)
async def approve_task(
    task_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Approve a task that is waiting for approval.
    
    **DEPRECATED**: Use POST /workflows/{workflow_id}/transition instead.
    
    Transitions task from WAITING_FOR_APPROVAL to IMPLEMENTING.
    
    Args:
        task_id: Task to approve
        
    Returns:
        State transition details
        
    Raises:
        404: If task not found
        400: If task is not in WAITING_FOR_APPROVAL state
    """
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")
    
    task = _tasks[task_id]
    previous_state = task["state"]
    
    if previous_state != TaskState.WAITING_FOR_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail=f"Task is in {previous_state} state, expected WAITING_FOR_APPROVAL"
        )
    
    task["state"] = TaskState.IMPLEMENTING
    task["updated_at"] = datetime.now(timezone.utc)
    
    return TaskActionResponse(
        task_id=task_id,
        previous_state=previous_state,
        new_state=TaskState.IMPLEMENTING,
        message=f"Task {task_id} approved and moved to IMPLEMENTING"
    )


@router.post("/{task_id}/reject", response_model=TaskActionResponse)
async def reject_task(
    task_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Reject a task that is waiting for approval.
    
    **DEPRECATED**: Use POST /workflows/{workflow_id}/transition instead.
    
    Transitions task from WAITING_FOR_APPROVAL to REJECTED.
    
    Args:
        task_id: Task to reject
        
    Returns:
        State transition details
        
    Raises:
        404: If task not found
        400: If task is not in WAITING_FOR_APPROVAL state
    """
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")
    
    task = _tasks[task_id]
    previous_state = task["state"]
    
    if previous_state != TaskState.WAITING_FOR_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail=f"Task is in {previous_state} state, expected WAITING_FOR_APPROVAL"
        )
    
    task["state"] = TaskState.REJECTED
    task["updated_at"] = datetime.now(timezone.utc)
    
    return TaskActionResponse(
        task_id=task_id,
        previous_state=previous_state,
        new_state=TaskState.REJECTED,
        message=f"Task {task_id} rejected"
    )
