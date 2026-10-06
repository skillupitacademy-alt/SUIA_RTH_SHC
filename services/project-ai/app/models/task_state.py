"""Task state definitions for AI orchestration workflow."""

from enum import Enum


class TaskState(str, Enum):
    """
    Task lifecycle states for AI-driven development workflow.
    
    Each state represents a distinct phase in the task execution pipeline,
    from initial creation through final completion or failure.
    """
    
    CREATED = "CREATED"
    """Task has been created but not yet started."""
    
    DISCOVERY = "DISCOVERY"
    """Task is analyzing codebase and gathering evidence from snapshot."""
    
    PLANNING = "PLANNING"
    """Task is generating implementation plan based on discovered evidence."""
    
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    """Task plan is complete and awaiting human approval."""
    
    IMPLEMENTING = "IMPLEMENTING"
    """Task is actively writing/modifying code."""
    
    TESTING = "TESTING"
    """Task is running tests to verify implementation."""
    
    VERIFYING = "VERIFYING"
    """Task is performing final verification checks."""
    
    COMPLETED = "COMPLETED"
    """Task has successfully completed all phases."""
    
    FAILED = "FAILED"
    """Task encountered an unrecoverable error."""
    
    BLOCKED = "BLOCKED"
    """Task is blocked by external dependency or condition."""
    
    REJECTED = "REJECTED"
    """Task plan was rejected by human reviewer."""
