"""
Tests for Canonical Comparator - M2.9 Wave 3 Phase 2B
"""

import pytest
import tempfile
from pathlib import Path

from app.intake.canonical_comparator import CanonicalComparator, ComparisonReport


@pytest.fixture
def temp_candidate_dir():
    """Create temporary candidate directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def comparator():
    """Create canonical comparator instance."""
    return CanonicalComparator()


@pytest.fixture
def canonical_ref():
    """Create canonical reference fixture."""
    return {
        "family": "Introduction",
        "version": "I6",
        "evidence": [
            {
                "path": "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
                "sha256": "abc123def456",
                "role": "canonical_block"
            }
        ],
        "required_exports": ["IntroductionI6Block", "IntroductionI6Schema"],
        "ubrc_markers": ["runtimeContext", "theme", "ils"],
        "theme_markers": ["theme.primary", "theme.secondary"]
    }


def test_compare_candidate_not_found(comparator, canonical_ref):
    """Test comparison when candidate path doesn't exist."""
    result = comparator.compare("/nonexistent/path", canonical_ref)
    
    assert result.has_breaking_changes is True
    assert len(result.structural_diffs) > 0
    assert "not found" in result.structural_diffs[0]["error"]


def test_compare_missing_component_file(comparator, temp_candidate_dir, canonical_ref):
    """Test comparison when component file is missing."""
    # Create only schema file, missing component
    schema_file = temp_candidate_dir / "IntroductionI6Schema.ts"
    schema_file.write_text("export const IntroductionI6Schema = {};")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Should detect missing component file
    assert any(
        diff["type"] == "missing_file"
        for diff in result.structural_diffs
    )
    assert result.evidence["structural_diff_count"] > 0


def test_compare_missing_exports(comparator, temp_candidate_dir, canonical_ref):
    """Test comparison when required exports are missing."""
    # Create component without required export
    component_file = temp_candidate_dir / "IntroductionI6Block.tsx"
    component_file.write_text("""
        // Missing the required export IntroductionI6Block
        export function SomeOtherFunction() {
            return null;
        }
    """)
    
    schema_file = temp_candidate_dir / "IntroductionI6Schema.ts"
    schema_file.write_text("export const IntroductionI6Schema = {};")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Should detect missing exports
    assert len(result.api_changes) > 0
    assert any(
        change["type"] == "missing_export"
        for change in result.api_changes
    )
    assert result.has_breaking_changes is True


def test_compare_missing_ubrc_markers(comparator, temp_candidate_dir, canonical_ref):
    """Test comparison when UBRC markers are missing."""
    # Create component without UBRC markers
    component_file = temp_candidate_dir / "IntroductionI6Block.tsx"
    component_file.write_text("""
        export default function IntroductionI6Block() {
            return <div>Hello</div>;
        }
    """)
    
    schema_file = temp_candidate_dir / "IntroductionI6Schema.ts"
    schema_file.write_text("export const IntroductionI6Schema = {};")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Should detect missing UBRC markers
    assert len(result.deviations) > 0
    assert any(
        dev["type"] == "missing_ubrc_marker"
        for dev in result.deviations
    )


def test_compare_missing_theme_markers(comparator, temp_candidate_dir, canonical_ref):
    """Test comparison when theme markers are missing."""
    # Create component without theme markers
    component_file = temp_candidate_dir / "IntroductionI6Block.tsx"
    component_file.write_text("""
        export default function IntroductionI6Block({ runtimeContext, theme, ils }) {
            return <div>Hello</div>;
        }
    """)
    
    schema_file = temp_candidate_dir / "IntroductionI6Schema.ts"
    schema_file.write_text("export const IntroductionI6Schema = {};")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Should detect missing theme markers
    assert any(
        dev["type"] == "missing_theme_marker"
        for dev in result.deviations
    )


def test_compare_hardcoded_brand(comparator, temp_candidate_dir, canonical_ref):
    """Test comparison detects hardcoded brand markers."""
    # Create component with hardcoded brand
    component_file = temp_candidate_dir / "IntroductionI6Block.tsx"
    component_file.write_text("""
        export default function IntroductionI6Block({ runtimeContext, theme, ils }) {
            return (
                <div>
                    <h1>Welcome to TutorialHub</h1>
                    <p style={{ color: theme.primary }}>Learn with us!</p>
                </div>
            );
        }
    """)
    
    schema_file = temp_candidate_dir / "IntroductionI6Schema.ts"
    schema_file.write_text("export const IntroductionI6Schema = {};")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Should detect hardcoded brand
    assert any(
        dev["type"] == "hardcoded_brand"
        for dev in result.deviations
    )
    assert any(
        dev.get("severity") == "error"
        for dev in result.deviations
    )


def test_compare_happy_path(comparator, temp_candidate_dir, canonical_ref):
    """Test successful comparison with compliant candidate."""
    # Create compliant component
    component_file = temp_candidate_dir / "IntroductionI6Block.tsx"
    component_file.write_text("""
        export default function IntroductionI6Block({ runtimeContext, theme, ils }) {
            return (
                <div>
                    <h1 style={{ color: theme.primary }}>Welcome</h1>
                    <p style={{ color: theme.secondary }}>Learn something new</p>
                </div>
            );
        }
    """)
    
    schema_file = temp_candidate_dir / "IntroductionI6Schema.ts"
    schema_file.write_text("export const IntroductionI6Schema = {};")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Should pass with no breaking changes
    assert result.has_breaking_changes is False
    assert result.evidence != {}
    assert result.evidence["candidate_file_count"] == 2
    assert result.canonical_sha256 == "abc123def456"


def test_compare_evidence_always_populated(comparator, temp_candidate_dir, canonical_ref):
    """Test that evidence dict is always populated."""
    # Create minimal candidate
    component_file = temp_candidate_dir / "IntroductionI6Block.tsx"
    component_file.write_text("export default function IntroductionI6Block() {}")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Evidence must be populated
    assert result.evidence != {}
    assert "candidate_file_count" in result.evidence
    assert "canonical_file_count" in result.evidence
    assert "checked_exports" in result.evidence
    assert "checked_ubrc_markers" in result.evidence
    assert "checked_theme_markers" in result.evidence
    assert "structural_diff_count" in result.evidence
    assert "api_change_count" in result.evidence
    assert "deviation_count" in result.evidence
    assert "comparison_timestamp" in result.evidence


def test_compare_extra_files_informational(comparator, temp_candidate_dir, canonical_ref):
    """Test that extra files are noted but don't block."""
    # Create required files plus extras
    component_file = temp_candidate_dir / "IntroductionI6Block.tsx"
    component_file.write_text("""
        export default function IntroductionI6Block({ runtimeContext, theme, ils }) {
            return <div style={{ color: theme.primary }}>Hello</div>;
        }
    """)
    
    schema_file = temp_candidate_dir / "IntroductionI6Schema.ts"
    schema_file.write_text("export const IntroductionI6Schema = {};")
    
    # Extra files
    extra_file1 = temp_candidate_dir / "helpers.ts"
    extra_file1.write_text("export const helper = () => {};")
    
    extra_file2 = temp_candidate_dir / "tests.test.tsx"
    extra_file2.write_text("test('example', () => {});")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Should note extra files but not fail
    assert result.evidence["candidate_file_count"] == 4
    assert any(
        diff["type"] == "extra_files"
        for diff in result.structural_diffs
    )
    # Extra files should be informational, not breaking
    extra_file_diff = next(
        (d for d in result.structural_diffs if d["type"] == "extra_files"),
        None
    )
    if extra_file_diff:
        assert extra_file_diff["severity"] == "info"


def test_compare_breaking_changes_detected(comparator, temp_candidate_dir, canonical_ref):
    """Test that breaking API changes are correctly flagged."""
    # Create component missing required export
    component_file = temp_candidate_dir / "IntroductionI6Block.tsx"
    component_file.write_text("""
        // Missing IntroductionI6Block export - breaking change
        export function SomethingElse() {
            return null;
        }
    """)
    
    schema_file = temp_candidate_dir / "IntroductionI6Schema.ts"
    schema_file.write_text("export const IntroductionI6Schema = {};")
    
    result = comparator.compare(str(temp_candidate_dir), canonical_ref)
    
    # Should flag as breaking change
    assert result.has_breaking_changes is True
    assert any(
        change.get("severity") == "breaking"
        for change in result.api_changes
    )
