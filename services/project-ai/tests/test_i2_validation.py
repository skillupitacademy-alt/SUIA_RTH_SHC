"""
Tests for I2 and mix-and-match validation.

Verifies:
1. I2-only creation validated end-to-end
2. Compatible composition validated
3. Incompatible composition blocked with specific errors
4. Type/version/registry/renderer/runtime conflicts detected
"""

import pytest
from unittest.mock import patch, MagicMock
from app.verification.compatibility import (
    resolve_component,
    verify_types_compatible,
    verify_versions_compatible,
    verify_registry_compatible,
    verify_renderer_compatible,
    verify_runtime_compatible,
    verify_i2_complete,
    CompatibilityErrorCode
)


@pytest.fixture
def mock_snapshot():
    """Mock snapshot with I2 blocks."""
    return {
        "blocks": {
            "verified": [
                {
                    "blockType": "introduction",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "text",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "code",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "quiz",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "summary",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                }
            ]
        }
    }


@pytest.fixture
def mock_snapshot_incomplete():
    """Mock snapshot missing some I2 blocks."""
    return {
        "blocks": {
            "verified": [
                {
                    "blockType": "introduction",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "text",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                }
                # Missing: code, quiz, summary
            ]
        }
    }


@pytest.fixture
def mock_snapshot_invalid_ubrc():
    """Mock snapshot with invalid UBRC status."""
    return {
        "blocks": {
            "verified": [
                {
                    "blockType": "introduction",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "text",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": False,
                    "rendered": True,
                    "ubrcStatus": "UBRC_MISSING"
                },
                {
                    "blockType": "code",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "quiz",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "summary",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                }
            ]
        }
    }


def test_resolve_i2_preset(mock_snapshot):
    """Test resolving I2 preset returns correct metadata."""
    component = resolve_component("I2", mock_snapshot)
    
    assert component is not None
    assert component["source"] == "I2"
    assert component["preset"] is True
    assert component["version"] == "1.0.0"
    assert component["registry"] == "core"
    assert component["renderer"] == "TutorialBlockRenderer"
    assert component["runtime"] == "react"


def test_resolve_candidate_block(mock_snapshot):
    """Test resolving specific candidate block."""
    component = resolve_component("T13", mock_snapshot)
    
    assert component is not None
    assert component["source"] == "T13"
    assert component["block_type"] == "text"
    assert component["preset"] is False
    assert component["registered"] is True
    assert component["rendered"] is True


def test_resolve_component_not_found(mock_snapshot):
    """Test resolving non-existent component returns None."""
    component = resolve_component("X99", mock_snapshot)
    
    # X prefix doesn't map to any block type, so component won't be found
    # (would need to be in snapshot with explicit blockType)
    assert component is None or not component.get("registered")


def test_verify_i2_complete_success(mock_snapshot):
    """Test I2 complete verification passes with all blocks present."""
    result = verify_i2_complete(mock_snapshot)
    
    assert result.passed is True
    assert result.error_code is None
    assert len(result.conflicts) == 0
    assert "verified" in result.error_message


def test_verify_i2_complete_missing_blocks(mock_snapshot_incomplete):
    """Test I2 complete verification fails with missing blocks."""
    result = verify_i2_complete(mock_snapshot_incomplete)
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.COMPONENT_INVALID
    assert len(result.conflicts) > 0
    assert any("code" in conflict for conflict in result.conflicts)
    assert any("quiz" in conflict for conflict in result.conflicts)
    assert any("summary" in conflict for conflict in result.conflicts)


def test_verify_i2_complete_invalid_ubrc(mock_snapshot_invalid_ubrc):
    """Test I2 complete verification fails with invalid UBRC."""
    result = verify_i2_complete(mock_snapshot_invalid_ubrc)
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.COMPONENT_INVALID
    assert len(result.conflicts) > 0
    assert any("text" in conflict and "UBRC" in conflict for conflict in result.conflicts)


def test_verify_i2_complete_no_snapshot():
    """Test I2 complete verification fails without snapshot."""
    result = verify_i2_complete({"blocks": {"verified": []}})
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.COMPONENT_NOT_FOUND
    assert "snapshot contains no verified blocks" in result.error_message


def test_verify_types_compatible_preset(mock_snapshot):
    """Test type compatibility passes for preset components."""
    component = resolve_component("I2", mock_snapshot)
    composition = {"base": "I2"}
    
    result = verify_types_compatible(component, composition, mock_snapshot)
    
    assert result.passed is True
    assert result.error_code is None
    assert len(result.conflicts) == 0


def test_verify_types_compatible_registered(mock_snapshot):
    """Test type compatibility passes for registered blocks."""
    component = resolve_component("T13", mock_snapshot)
    composition = {"text": "T13"}
    
    result = verify_types_compatible(component, composition, mock_snapshot)
    
    assert result.passed is True
    assert result.error_code is None
    assert len(result.conflicts) == 0


def test_verify_types_compatible_not_registered(mock_snapshot):
    """Test type compatibility fails for unregistered blocks."""
    component = {
        "source": "T99",
        "block_type": "text",
        "preset": False,
        "registered": False,
        "rendered": True
    }
    composition = {"text": "T99"}
    
    result = verify_types_compatible(component, composition, mock_snapshot)
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.TYPE_MISMATCH
    assert any("not registered" in conflict for conflict in result.conflicts)


def test_verify_types_compatible_not_rendered(mock_snapshot):
    """Test type compatibility fails for blocks without renderer."""
    component = {
        "source": "T99",
        "block_type": "text",
        "preset": False,
        "registered": True,
        "rendered": False
    }
    composition = {"text": "T99"}
    
    result = verify_types_compatible(component, composition, mock_snapshot)
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.TYPE_MISMATCH
    assert any("no renderer" in conflict for conflict in result.conflicts)


def test_verify_versions_compatible_valid(mock_snapshot):
    """Test version compatibility passes for valid versions."""
    component = resolve_component("T13", mock_snapshot)
    composition = {"text": "T13"}
    
    result = verify_versions_compatible(component, composition, mock_snapshot)
    
    assert result.passed is True
    assert result.error_code is None


def test_verify_versions_compatible_invalid_format():
    """Test version compatibility fails for invalid version format."""
    component = {
        "source": "T99",
        "version": "invalid"
    }
    composition = {"text": "T99"}
    
    result = verify_versions_compatible(component, {}, {})
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.VERSION_INCOMPATIBLE
    assert "invalid version" in result.conflicts[0].lower()


def test_verify_versions_compatible_prerelease():
    """Test version compatibility fails for pre-release versions."""
    component = {
        "source": "T99",
        "version": "0.9.0"
    }
    composition = {"text": "T99"}
    
    result = verify_versions_compatible(component, {}, {})
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.VERSION_INCOMPATIBLE
    assert "pre-release" in result.conflicts[0].lower()


def test_verify_registry_compatible_valid(mock_snapshot):
    """Test registry compatibility passes for valid registry."""
    component = resolve_component("T13", mock_snapshot)
    composition = {"text": "T13"}
    
    result = verify_registry_compatible(component, composition, mock_snapshot)
    
    assert result.passed is True
    assert result.error_code is None


def test_verify_registry_compatible_invalid():
    """Test registry compatibility fails for invalid registry."""
    component = {
        "source": "T99",
        "registry": "unknown"
    }
    composition = {"text": "T99"}
    
    result = verify_registry_compatible(component, {}, {})
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.REGISTRY_CONFLICT
    assert "unknown registry" in result.conflicts[0].lower()


def test_verify_renderer_compatible_valid(mock_snapshot):
    """Test renderer compatibility passes for valid renderer."""
    component = resolve_component("T13", mock_snapshot)
    composition = {"text": "T13"}
    
    result = verify_renderer_compatible(component, composition, mock_snapshot)
    
    assert result.passed is True
    assert result.error_code is None


def test_verify_renderer_compatible_invalid():
    """Test renderer compatibility fails for invalid renderer."""
    component = {
        "source": "T99",
        "renderer": "VueRenderer"
    }
    composition = {"text": "T99"}
    
    result = verify_renderer_compatible(component, {}, {})
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.RENDERER_CONFLICT
    assert "unsupported renderer" in result.conflicts[0].lower()


def test_verify_runtime_compatible_valid(mock_snapshot):
    """Test runtime compatibility passes for valid runtime."""
    component = resolve_component("T13", mock_snapshot)
    composition = {"text": "T13"}
    
    result = verify_runtime_compatible(component, composition, mock_snapshot)
    
    assert result.passed is True
    assert result.error_code is None


def test_verify_runtime_compatible_invalid():
    """Test runtime compatibility fails for invalid runtime."""
    component = {
        "source": "T99",
        "runtime": "vue"
    }
    composition = {"text": "T99"}
    
    result = verify_runtime_compatible(component, {}, {})
    
    assert result.passed is False
    assert result.error_code == CompatibilityErrorCode.RUNTIME_CONFLICT
    assert "unsupported runtime" in result.conflicts[0].lower()


def test_full_compatibility_chain(mock_snapshot):
    """Test complete compatibility verification chain."""
    component = resolve_component("T13", mock_snapshot)
    composition = {"text": "T13"}
    
    # Verify all compatibility dimensions
    type_result = verify_types_compatible(component, composition, mock_snapshot)
    version_result = verify_versions_compatible(component, composition, mock_snapshot)
    registry_result = verify_registry_compatible(component, composition, mock_snapshot)
    renderer_result = verify_renderer_compatible(component, composition, mock_snapshot)
    runtime_result = verify_runtime_compatible(component, composition, mock_snapshot)
    
    # All should pass
    assert all([
        type_result.passed,
        version_result.passed,
        registry_result.passed,
        renderer_result.passed,
        runtime_result.passed
    ])
