"""Candidate Block models for intake and placement workflow."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class BlockFamily(str, Enum):
    """Block family classification for candidate blocks."""
    
    INTRODUCTION = "Introduction"
    TUTORIAL = "Tutorial"
    ASSESSMENT = "Assessment"
    MEDIA = "Media"
    SUMMARY = "Summary"
    CUSTOM = "Custom"


class PlacementDecision(str, Enum):
    """Placement decision types for candidate blocks."""
    
    ADD = "ADD"
    """Add as a new block to the repository."""
    
    UPDATE = "UPDATE"
    """Update an existing block with this candidate."""
    
    EXTEND = "EXTEND"
    """Extend an existing block family with this candidate."""
    
    REUSE = "REUSE"
    """Reuse existing block, no changes needed."""
    
    REJECT = "REJECT"
    """Reject candidate, does not meet criteria."""


class CandidateFile(BaseModel):
    """Individual file within a candidate package."""
    
    filename: str = Field(..., description="Name of the file")
    content: str = Field(..., description="File content (text or base64 for binary)")
    contentType: str = Field(..., description="MIME type of the file")
    hash: str = Field(..., description="SHA-256 hash of the file content")


class CandidatePackage(BaseModel):
    """Complete candidate block package uploaded for evaluation."""
    
    candidateId: str = Field(..., description="Unique identifier for this candidate")
    files: list[CandidateFile] = Field(..., description="List of files in the package")
    uploadedAt: str = Field(..., description="ISO 8601 timestamp of upload")
    uploadedBy: str = Field(..., description="User or system that uploaded the candidate")
    
    # Wave 1A: Workflow target binding
    workflow_id: Optional[str] = Field(None, description="Workflow this candidate belongs to")
    target_family: Optional[str] = Field(None, description="Target block family from workflow")
    target_version: Optional[str] = Field(None, description="Target block version from workflow")
    
    # Wave 1C: Tenant ownership
    brand: Optional[str] = Field(None, description="Brand (tenant) that owns this candidate")
    
    # Wave 3A: Server-computed contract hash
    contract_sha256: Optional[str] = Field(
        None,
        description="SHA-256 hash of candidate files (64-char hex, server-computed)",
        min_length=64,
        max_length=64,
        pattern="^[a-f0-9]{64}$"
    )


class ClassificationResult(BaseModel):
    """Result of block family classification analysis."""
    
    candidateId: str = Field(..., description="Candidate being classified")
    detectedFamily: BlockFamily = Field(..., description="Detected block family")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0-1.0)"
    )
    reasoning: str = Field(..., description="Explanation of classification decision")


class CanonicalComparison(BaseModel):
    """Comparison result against canonical repository blocks."""
    
    candidateId: str = Field(..., description="Candidate being compared")
    existingBlock: Optional[str] = Field(
        None,
        description="ID of most similar existing block, if any"
    )
    similarityScore: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Similarity score (0.0-1.0)"
    )
    differences: list[str] = Field(..., description="List of identified differences")


class PlacementManifest(BaseModel):
    """Placement manifest defining how to integrate a candidate block."""
    
    manifestId: str = Field(..., description="Unique manifest identifier")
    candidateId: str = Field(..., description="Candidate this manifest is for")
    decision: PlacementDecision = Field(..., description="Placement decision")
    targetPath: str = Field(..., description="Target path for placement")
    blockFamily: BlockFamily = Field(..., description="Block family classification")
    blockVersion: str = Field(..., description="Block version (UBRC compliant)")
    requiredChanges: list[str] = Field(..., description="Changes required for placement")
    evidenceIds: list[str] = Field(..., description="Evidence IDs supporting this decision")
    manifestHash: str = Field(..., description="SHA-256 hash of manifest content")
    createdAt: str = Field(..., description="ISO 8601 timestamp of manifest creation")
