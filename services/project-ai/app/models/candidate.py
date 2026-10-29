"""Candidate Block models for intake and placement workflow."""

import hashlib
import json
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class BlockFamily(str, Enum):
    """Block family classification for candidate blocks."""
    
    INTRODUCTION = "Introduction"
    TUTORIAL = "Tutorial"
    ASSESSMENT = "Assessment"
    MEDIA = "Media"
    SUMMARY = "Summary"
    OBJECTIVE = "Objective"
    CODE = "Code"
    DEFINITION = "Definition"
    EXAMPLE = "Example"
    QUOTE = "Quote"
    DIAGRAM = "Diagram"
    COMPARISON = "Comparison"
    TWO_COLUMN = "TwoColumn"
    THREE_COLUMN = "ThreeColumn"
    CARD_GRID = "CardGrid"
    TIMELINE = "Timeline"
    HEADING = "Heading"
    PARAGRAPH = "Paragraph"
    LIST = "List"
    TABLE = "Table"
    IMAGE = "Image"
    CALLOUT = "Callout"
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
    VERSION_IN_USE = "VERSION_IN_USE"


class IdentityStatus(str, Enum):
    NEW = "NEW"
    EXISTING_UNUSED = "EXISTING_UNUSED"
    EXISTING_REFERENCED = "EXISTING_REFERENCED"


class UpdateEligibility(str, Enum):
    ALLOWED = "ALLOWED"
    VERSION_IN_USE = "VERSION_IN_USE"
    INSPECTION_FAILED = "INSPECTION_FAILED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class RevisionStrategy(str, Enum):
    ADD_NEW_VERSION = "ADD_NEW_VERSION"
    UPDATE_IN_PLACE = "UPDATE_IN_PLACE"


class ReferenceSummary(BaseModel):
    count: int = Field(0, description="Total count of tutorial documents referencing this block version")
    publication_states: dict[str, int] = Field(default_factory=dict, description="Counts by publication state (draft, published, etc.)")
    sample_ids: list[str] = Field(default_factory=list, description="Bounded sample of referencing tutorial document/section IDs")

    @property
    def total_count(self) -> int:
        return self.count

    @property
    def draft_count(self) -> int:
        return self.publication_states.get("draft", 0)

    @property
    def published_count(self) -> int:
        return self.publication_states.get("published", 0)

    @property
    def sample_section_ids(self) -> list[str]:
        return self.sample_ids
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


class PlacementFileAction(str, Enum):
    """Action to take on a candidate or repository file."""
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    PATCH_RENDERER = "PATCH_RENDERER"
    PATCH_FAMILY_REGISTRY = "PATCH_FAMILY_REGISTRY"
    PATCH_REGISTRY = "PATCH_REGISTRY"
    PATCH_TYPES = "PATCH_TYPES"
    PATCH_COMPOSER_DEFINITION = "PATCH_COMPOSER_DEFINITION"
    PATCH_GENERATED_REGISTRY = "PATCH_GENERATED_REGISTRY"
    PATCH_BLOCKS_SCHEMA = "PATCH_BLOCKS_SCHEMA"
    SKIP = "SKIP"


class PlacementFileOperation(BaseModel):
    """Explicit, snapshot-derived file-level operation with pre-image verification."""
    action: PlacementFileAction = Field(..., description="Action to perform on target")
    source_filename: str = Field(..., description="Name of file in candidate package")
    source_sha256: str = Field(..., description="SHA-256 hash of candidate file")
    target_path: str = Field(..., description="Approved relative destination in workspace")
    expected_pre_hash: Optional[str] = Field(None, description="SHA-256 of target file before patch (pre-image verification)")
    patch_strategy: Optional[str] = Field(None, description="Semantic patch strategy (e.g. DISPATCH_BRANCH, REGISTRY_ENTRY)")
    description: str = Field(..., description="Human-readable explanation of operation")


class PlacementManifest(BaseModel):
    """Placement manifest defining how to integrate a candidate block."""
    
    manifestId: str = Field(..., description="Unique manifest identifier")
    candidateId: str = Field(..., description="Candidate this manifest is for")
    decision: PlacementDecision = Field(..., description="Placement decision")
    targetPath: str = Field(..., description="Target path for placement")
    blockFamily: BlockFamily = Field(..., description="Block family classification")
    blockVersion: str = Field(..., description="Block version (UBRC compliant)")
    requiredChanges: list[str] = Field(..., description="Changes required for placement")
    fileOperations: list[PlacementFileOperation] = Field(
        default_factory=list,
        description="Explicit, snapshot-derived file-level operations"
    )
    identityStatus: IdentityStatus = Field(default=IdentityStatus.NEW, description="Registration and usage status of target block version")
    updateEligibility: UpdateEligibility = Field(default=UpdateEligibility.NOT_APPLICABLE, description="Eligibility for in-place update")
    referenceSummary: ReferenceSummary = Field(default_factory=ReferenceSummary, description="Summary of persisted tutorial content references")
    revisionStrategy: RevisionStrategy = Field(default=RevisionStrategy.ADD_NEW_VERSION, description="Placement strategy (ADD_NEW_VERSION or UPDATE_IN_PLACE)"
    )
    evidenceIds: list[str] = Field(..., description="Evidence IDs supporting this decision")
    manifestHash: str = Field(..., description="SHA-256 hash of manifest content")
    createdAt: str = Field(..., description="ISO 8601 timestamp of manifest creation")

    def compute_hash(self) -> str:
        """Compute the deterministic canonical SHA-256 hash for this manifest."""
        return compute_canonical_manifest_hash(self)


def _normalize_iso_timestamp(ts: Any) -> str:
    """Normalize ISO timestamp into UTC string with trailing 'Z'."""
    if isinstance(ts, datetime):
        dt = ts
    else:
        s = str(ts).strip()
        if s.endswith("Z") or s.endswith("z"):
            s = s[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(s)
        except Exception:
            return str(ts)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def serialize_canonical_manifest(manifest: Union[PlacementManifest, Dict[str, Any]]) -> Dict[str, Any]:
    """Serialize manifest into canonical integrity dictionary with sorted keys."""
    if isinstance(manifest, BaseModel):
        data = manifest.model_dump()
    elif isinstance(manifest, dict):
        data = manifest
    else:
        raise TypeError(f"Unsupported manifest type: {type(manifest)}")

    file_ops = data.get("fileOperations") or []
    normalized_file_ops = []
    for op in file_ops:
        if isinstance(op, BaseModel):
            normalized_file_ops.append(op.model_dump())
        elif isinstance(op, dict):
            act = op.get("action")
            act_val = act.value if hasattr(act, "value") else str(act)
            op_copy = dict(op)
            op_copy["action"] = act_val
            normalized_file_ops.append(op_copy)
        else:
            normalized_file_ops.append(dict(op))

    ref_sum = data.get("referenceSummary") or {}
    if isinstance(ref_sum, BaseModel):
        ref_sum = ref_sum.model_dump()
    elif not isinstance(ref_sum, dict):
        ref_sum = dict(ref_sum)

    def _val(x, default=""):
        if x is None:
            return default
        return x.value if hasattr(x, "value") else str(x)

    return {
        "manifestId": str(data["manifestId"]),
        "candidateId": str(data["candidateId"]),
        "decision": _val(data["decision"]),
        "targetPath": str(data.get("targetPath", "")),
        "blockFamily": _val(data["blockFamily"]),
        "blockVersion": str(data["blockVersion"]),
        "requiredChanges": list(data.get("requiredChanges") or []),
        "fileOperations": normalized_file_ops,
        "identityStatus": _val(data.get("identityStatus"), "NEW"),
        "updateEligibility": _val(data.get("updateEligibility"), "NOT_APPLICABLE"),
        "referenceSummary": ref_sum,
        "revisionStrategy": _val(data.get("revisionStrategy"), "ADD_NEW_VERSION"),
        "evidenceIds": list(data.get("evidenceIds") or []),
        "createdAt": _normalize_iso_timestamp(data["createdAt"]),
    }


def compute_canonical_manifest_hash(manifest: Union[PlacementManifest, Dict[str, Any]]) -> str:
    """Compute deterministic SHA-256 hash across all integrity-relevant manifest fields."""
    canonical_dict = serialize_canonical_manifest(manifest)
    manifest_json = json.dumps(canonical_dict, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(manifest_json.encode("utf-8")).hexdigest()

