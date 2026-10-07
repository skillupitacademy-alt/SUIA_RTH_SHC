"""
Workflow Target models for M2.9 Canonical Project LLM Wiring.

These models bind every workflow and candidate to its target block family,
version, and repository context, preventing version mismatches (e.g., I7 vs 1.0.0).
"""

from pydantic import BaseModel, Field
from typing import Optional


class WorkflowTarget(BaseModel):
    """
    Target specification for a Project LLM workflow.
    
    Every workflow must carry a binding to its intended target block family
    and version. This prevents the critical gap where candidates lose their
    requested family/version during lifecycle transitions.
    """
    
    workflow_id: str = Field(..., description="Unique workflow identifier")
    family: str = Field(..., description="Target block family (e.g., 'Introduction')")
    version: str = Field(..., description="Target version (e.g., 'I7', not '1.0.0')")
    block_type: str = Field(..., description="Block type classification")
    specification_id: str = Field(..., description="User specification or requirement ID")
    source_snapshot_id: str = Field(..., description="Repository snapshot ID for canonical reference")


class CandidateBinding(BaseModel):
    """
    Binding between a candidate package and its workflow target.
    
    Attached to every candidate upon upload to ensure traceability from
    user request → engineering contract → candidate → placement.
    """
    
    workflow_id: str = Field(..., description="Workflow this candidate belongs to")
    target_family: str = Field(..., description="Target block family")
    target_version: str = Field(..., description="Target version (e.g., 'I7')")
    specification_id: str = Field(..., description="Specification this candidate implements")
    contract_hash: str = Field(
        default="",
        description="SHA-256 hash of EngineeringContract (filled in Wave 2)"
    )
