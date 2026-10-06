"""Pydantic models for API request/response schemas."""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from app.models.task_state import TaskState


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(description="Service health status")
    version: str = Field(description="Service version")
    timestamp: datetime = Field(description="Response timestamp")


class TaskCreateRequest(BaseModel):
    """Request model for creating a new task."""
    description: str = Field(
        description="Human-readable task description",
        min_length=1,
        max_length=1000
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional context for task planning"
    )


class TaskResponse(BaseModel):
    """Response model for task status."""
    task_id: str = Field(description="Unique task identifier")
    state: TaskState = Field(description="Current task state")
    description: str = Field(description="Task description")
    created_at: datetime = Field(description="Task creation timestamp")
    updated_at: datetime = Field(description="Last state transition timestamp")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Task context and metadata"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if state is FAILED"
    )


class TaskActionResponse(BaseModel):
    """Response for task state transitions (approve/reject)."""
    task_id: str = Field(description="Task identifier")
    previous_state: TaskState = Field(description="State before transition")
    new_state: TaskState = Field(description="State after transition")
    message: str = Field(description="Human-readable transition message")
