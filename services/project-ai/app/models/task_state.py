"""Task state definitions for AI orchestration workflow.

DEPRECATION NOTICE (M2.9):
- TaskState is a SECONDARY authority for task-level (agent-level) state tracking
- For workflow-level state, use CanonicalWorkflowState from app.orchestration.canonical_workflow
- TaskState is NOT a workflow state machine; it tracks individual agent execution
- Do not confuse TaskState (agent execution) with CanonicalWorkflowState (workflow lifecycle)

ARCHITECTURAL CLARIFICATION:
- CanonicalWorkflowState = User-facing workflow lifecycle (REQUESTED -> CERTIFIED)
- TaskState = Internal agent execution state (CREATED -> COMPLETED)
- A single workflow (CanonicalWorkflowState) may spawn multiple tasks (TaskState)
- Example: DISCOVERY workflow state runs multiple agents, each with TaskState
"""

from enum import Enum


class TaskState(str, Enum):
    """
    Task lifecycle states for AI-driven development workflow.
    
    Each state represents a distinct phase in the task execution pipeline,
    from initial creation through final completion or failure.
    
    NOTE: This is agent-level state, not workflow-level state.
    For workflow state, see CanonicalWorkflowState in app.orchestration.canonical_workflow.
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
