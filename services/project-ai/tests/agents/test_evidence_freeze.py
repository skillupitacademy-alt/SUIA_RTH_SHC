"""Tests for Evidence Freeze Agent (Agent 03)."""

import pytest
from pathlib import Path
from unittest.mock import Mock
from datetime import datetime, UTC

from app.agents.evidence_freeze import execute_evidence_freeze
from app.orchestration.agent_coordinator import AgentContext
from app.models.agent_result import AgentStatus


@pytest.fixture
def valid_evidence_array():
    """Create valid evidence array for testing."""
    return [
        {
            "evidenceId": "evidence-001",
            "scannerName": "D1-Directory",
            "timestamp": "2024-01-01T00:00:00Z",
            "path": "packages/blocks",
            "kind": "directory",
            "claim": "Block directory exists",
            "locator": "packages/blocks",
            "contentHash": "a" * 64,
            "lifecycle": "current"
        },
        {
            "evidenceId": "evidence-002",
            "scannerName": "D2-TypeScript",
            "timestamp": "2024-01-01T00:00:00Z",
            "path": "packages/blocks/intro/I1.tsx",
            "kind": "component",
            "claim": "Component I1 exists",
            "locator": "packages/blocks/intro/I1.tsx:I1",
            "contentHash": "b" * 64,
            "lifecycle": "current"
        },
        {
            "evidenceId": "evidence-003",
            "scannerName": "D3-React",
            "timestamp": "2024-01-01T00:00:00Z",
            "path": "packages/blocks/intro/I2.tsx",
            "kind": "component",
            "claim": "Component I2 exists",
            "locator": "packages/blocks/intro/I2.tsx:I2",
            "contentHash": "c" * 64,
            "lifecycle": "historical"
        }
    ]


@pytest.fixture
def mock_context(valid_evidence_array):
    """Create mock agent context with snapshot."""
    snapshot = {
        "canonicalHash": "test123",
        "evidence": valid_evidence_array,
        "blocks": {}
    }
    
    return AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )


@pytest.mark.asyncio
async def test_evidence_validation_success(mock_context):
    """Test successful evidence validation."""
    result = await execute_evidence_freeze(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs["evidence_count"] == 3
    assert result.outputs["binding_valid"] is True
    assert result.outputs["format_valid"] is True
    assert len(result.outputs["evidence_ids"]) == 3
    assert "evidence-001" in result.outputs["evidence_ids"]
    assert "evidence-002" in result.outputs["evidence_ids"]
    assert "evidence-003" in result.outputs["evidence_ids"]
    assert len(result.errors) == 0


@pytest.mark.asyncio
async def test_duplicate_evidence_ids_fail():
    """Test failure when duplicate evidenceIds are found."""
    duplicate_evidence = [
        {
            "evidenceId": "evidence-001",
            "scannerName": "D1-Directory",
            "timestamp": "2024-01-01T00:00:00Z",
            "path": "packages/blocks",
            "kind": "directory",
            "claim": "Block directory exists",
            "locator": "packages/blocks",
            "contentHash": "a" * 64,
            "lifecycle": "current"
        },
        {
            "evidenceId": "evidence-001",  # Duplicate
            "scannerName": "D2-TypeScript",
            "timestamp": "2024-01-01T00:00:00Z",
            "path": "packages/blocks/intro",
            "kind": "directory",
            "claim": "Intro directory exists",
            "locator": "packages/blocks/intro",
            "contentHash": "b" * 64,
            "lifecycle": "current"
        }
    ]
    
    snapshot = {
        "canonicalHash": "test123",
        "evidence": duplicate_evidence
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_evidence_freeze(context)
    
    assert result.status == AgentStatus.FAILED
    assert result.outputs["binding_valid"] is False
    assert any("Duplicate evidenceId" in error for error in result.errors)


@pytest.mark.asyncio
async def test_invalid_content_hash_format_fail():
    """Test failure when contentHash format is invalid."""
    invalid_hash_evidence = [
        {
            "evidenceId": "evidence-001",
            "scannerName": "D1-Directory",
            "timestamp": "2024-01-01T00:00:00Z",
            "path": "packages/blocks",
            "kind": "directory",
            "claim": "Block directory exists",
            "locator": "packages/blocks",
            "contentHash": "invalid-hash",  # Not 64-char hex
            "lifecycle": "current"
        }
    ]
    
    snapshot = {
        "canonicalHash": "test123",
        "evidence": invalid_hash_evidence
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_evidence_freeze(context)
    
    assert result.status == AgentStatus.FAILED
    assert result.outputs["format_valid"] is False
    assert any("invalid contentHash format" in error for error in result.errors)


@pytest.mark.asyncio
async def test_missing_required_fields_fail():
    """Test failure when required fields are missing."""
    missing_fields_evidence = [
        {
            "evidenceId": "evidence-001",
            "scannerName": "D1-Directory",
            # Missing timestamp, path, kind, claim, locator, contentHash, lifecycle
        }
    ]
    
    snapshot = {
        "canonicalHash": "test123",
        "evidence": missing_fields_evidence
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_evidence_freeze(context)
    
    assert result.status == AgentStatus.FAILED
    assert any("missing required fields" in error for error in result.errors)


@pytest.mark.asyncio
async def test_evidence_index_creation(mock_context):
    """Test that evidence index is created in workflow state."""
    result = await execute_evidence_freeze(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    
    # Check evidence index was added to workflow state
    evidence_index = mock_context.workflow_state.get('evidence_index')
    assert evidence_index is not None
    assert len(evidence_index) == 3
    assert "evidence-001" in evidence_index
    assert "evidence-002" in evidence_index
    assert "evidence-003" in evidence_index
    
    # Verify index structure
    assert evidence_index["evidence-001"]["scannerName"] == "D1-Directory"
    assert evidence_index["evidence-002"]["kind"] == "component"


@pytest.mark.asyncio
async def test_invalid_lifecycle_value():
    """Test validation of lifecycle values."""
    invalid_lifecycle_evidence = [
        {
            "evidenceId": "evidence-001",
            "scannerName": "D1-Directory",
            "timestamp": "2024-01-01T00:00:00Z",
            "path": "packages/blocks",
            "kind": "directory",
            "claim": "Block directory exists",
            "locator": "packages/blocks",
            "contentHash": "a" * 64,
            "lifecycle": "invalid"  # Invalid lifecycle
        }
    ]
    
    snapshot = {
        "canonicalHash": "test123",
        "evidence": invalid_lifecycle_evidence
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_evidence_freeze(context)
    
    assert result.status == AgentStatus.FAILED
    assert any("invalid lifecycle" in error for error in result.errors)


@pytest.mark.asyncio
async def test_no_snapshot_blocked():
    """Test that agent is blocked when no snapshot is available."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=None,  # No snapshot
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_evidence_freeze(context)
    
    assert result.status == AgentStatus.BLOCKED
    assert "No snapshot available" in result.errors[0]


@pytest.mark.asyncio
async def test_empty_evidence_array():
    """Test handling of empty evidence array."""
    snapshot = {
        "canonicalHash": "test123",
        "evidence": []  # Empty
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_evidence_freeze(context)
    
    assert result.status == AgentStatus.FAILED
    assert "no evidence records" in result.errors[0].lower()


@pytest.mark.asyncio
async def test_scanners_and_kinds_detection(mock_context):
    """Test that scanners and kinds are properly detected."""
    result = await execute_evidence_freeze(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    assert "D1-Directory" in result.outputs["scanners_detected"]
    assert "D2-TypeScript" in result.outputs["scanners_detected"]
    assert "D3-React" in result.outputs["scanners_detected"]
    assert "directory" in result.outputs["kinds_detected"]
    assert "component" in result.outputs["kinds_detected"]


@pytest.mark.asyncio
async def test_lifecycle_breakdown(mock_context):
    """Test lifecycle breakdown in outputs."""
    result = await execute_evidence_freeze(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    breakdown = result.outputs["lifecycle_breakdown"]
    assert breakdown["current"] == 2
    assert breakdown["historical"] == 1
    assert breakdown["invalid"] == 0
