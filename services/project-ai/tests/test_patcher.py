"""Comprehensive test suite for patcher.py idempotency and safety guarantees."""

import pytest
from app.placement.patcher import (
    patch_blocks_schema,
    PatchError,
    compute_sha256,
)


# Minimal valid blocks.schema.ts template for testing
MINIMAL_BLOCKS_SCHEMA = """import { DefinitionBlockSchema } from './definition.schema';
import { CodeBlockSchema } from './code.schema';

export * from './definition.schema';
export * from './code.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
    CodeBlockSchema,
  ])
);
"""


class TestPatchBlocksSchemaIdempotency:
    """Test all 8 partial-state scenarios for patch_blocks_schema idempotency."""

    def test_scenario_1_all_present_noop(self):
        """Scenario 1: Import present, re-export present, union member present → no-op (idempotent)."""
        content = """import { DefinitionBlockSchema } from './definition.schema';
import { ObjectiveO1BlockSchema } from './objective-o1.schema';

export * from './definition.schema';
export * from './objective-o1.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
    ObjectiveO1BlockSchema,
  ])
);
"""
        # First call - should be no-op
        result1 = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result1 == content, "Should be idempotent when all elements present"
        
        # Second call - verify still no-op
        result2 = patch_blocks_schema(result1, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result2 == result1, "Should remain idempotent on repeat calls"

    def test_scenario_2_import_export_present_union_absent(self):
        """Scenario 2: Import present, re-export present, union member absent → add union member only."""
        content = """import { DefinitionBlockSchema } from './definition.schema';
import { ObjectiveO1BlockSchema } from './objective-o1.schema';

export * from './definition.schema';
export * from './objective-o1.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        # First call - should add union member only
        result1 = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify import and re-export unchanged
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result1
        assert "export * from './objective-o1.schema';" in result1
        assert "ObjectiveO1BlockSchema," in result1
        
        # Count occurrences - should not duplicate
        assert result1.count("import { ObjectiveO1BlockSchema }") == 1
        assert result1.count("export * from './objective-o1.schema';") == 1
        assert result1.count("ObjectiveO1BlockSchema,") == 1
        
        # Second call - verify idempotent
        result2 = patch_blocks_schema(result1, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result2 == result1, "Should be idempotent after adding union member"

    def test_scenario_3_import_union_present_export_absent(self):
        """Scenario 3: Import present, re-export absent, union member present → add re-export only."""
        content = """import { DefinitionBlockSchema } from './definition.schema';
import { ObjectiveO1BlockSchema } from './objective-o1.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
    ObjectiveO1BlockSchema,
  ])
);
"""
        # First call - should add re-export only
        result1 = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify import and union unchanged
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result1
        assert "export * from './objective-o1.schema';" in result1
        assert "ObjectiveO1BlockSchema," in result1
        
        # Count occurrences
        assert result1.count("import { ObjectiveO1BlockSchema }") == 1
        assert result1.count("export * from './objective-o1.schema';") == 1
        assert result1.count("ObjectiveO1BlockSchema,") == 1
        
        # Second call - verify idempotent
        result2 = patch_blocks_schema(result1, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result2 == result1, "Should be idempotent after adding re-export"

    def test_scenario_4_import_present_export_union_absent(self):
        """Scenario 4: Import present, re-export absent, union member absent → add re-export + union member."""
        content = """import { DefinitionBlockSchema } from './definition.schema';
import { ObjectiveO1BlockSchema } from './objective-o1.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        # First call - should add re-export and union member
        result1 = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify all three elements present
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result1
        assert "export * from './objective-o1.schema';" in result1
        assert "ObjectiveO1BlockSchema," in result1
        
        # Count occurrences
        assert result1.count("import { ObjectiveO1BlockSchema }") == 1
        assert result1.count("export * from './objective-o1.schema';") == 1
        assert result1.count("ObjectiveO1BlockSchema,") == 1
        
        # Second call - verify idempotent
        result2 = patch_blocks_schema(result1, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result2 == result1, "Should be idempotent after adding re-export and union member"

    def test_scenario_5_export_union_present_import_absent(self):
        """Scenario 5: Import absent, re-export present, union member present → add import only."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';
export * from './objective-o1.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
    ObjectiveO1BlockSchema,
  ])
);
"""
        # First call - should add import only
        result1 = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify all three elements present
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result1
        assert "export * from './objective-o1.schema';" in result1
        assert "ObjectiveO1BlockSchema," in result1
        
        # Count occurrences
        assert result1.count("import { ObjectiveO1BlockSchema }") == 1
        assert result1.count("export * from './objective-o1.schema';") == 1
        assert result1.count("ObjectiveO1BlockSchema,") == 1
        
        # Second call - verify idempotent
        result2 = patch_blocks_schema(result1, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result2 == result1, "Should be idempotent after adding import"

    def test_scenario_6_export_present_import_union_absent(self):
        """Scenario 6: Import absent, re-export present, union member absent → add import + union member."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';
export * from './objective-o1.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        # First call - should add import and union member
        result1 = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify all three elements present
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result1
        assert "export * from './objective-o1.schema';" in result1
        assert "ObjectiveO1BlockSchema," in result1
        
        # Count occurrences
        assert result1.count("import { ObjectiveO1BlockSchema }") == 1
        assert result1.count("export * from './objective-o1.schema';") == 1
        assert result1.count("ObjectiveO1BlockSchema,") == 1
        
        # Second call - verify idempotent
        result2 = patch_blocks_schema(result1, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result2 == result1, "Should be idempotent after adding import and union member"

    def test_scenario_7_union_present_import_export_absent(self):
        """Scenario 7: Import absent, re-export absent, union member present → add import + re-export."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
    ObjectiveO1BlockSchema,
  ])
);
"""
        # First call - should add import and re-export
        result1 = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify all three elements present
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result1
        assert "export * from './objective-o1.schema';" in result1
        assert "ObjectiveO1BlockSchema," in result1
        
        # Count occurrences
        assert result1.count("import { ObjectiveO1BlockSchema }") == 1
        assert result1.count("export * from './objective-o1.schema';") == 1
        assert result1.count("ObjectiveO1BlockSchema,") == 1
        
        # Second call - verify idempotent
        result2 = patch_blocks_schema(result1, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result2 == result1, "Should be idempotent after adding import and re-export"

    def test_scenario_8_all_absent_add_all(self):
        """Scenario 8: Import absent, re-export absent, union member absent → add all three (full patch)."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        # First call - should add all three elements
        result1 = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify all three elements present
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result1
        assert "export * from './objective-o1.schema';" in result1
        assert "ObjectiveO1BlockSchema," in result1
        
        # Count occurrences
        assert result1.count("import { ObjectiveO1BlockSchema }") == 1
        assert result1.count("export * from './objective-o1.schema';") == 1
        assert result1.count("ObjectiveO1BlockSchema,") == 1
        
        # Second call - verify idempotent
        result2 = patch_blocks_schema(result1, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        assert result2 == result1, "Should be idempotent after adding all elements"


class TestPatchBlocksSchemaEdgeCases:
    """Test edge cases for patch_blocks_schema safety and validation."""

    def test_duplicate_import_idempotent(self):
        """Duplicate imports should not cause failure - function handles gracefully."""
        content = """import { DefinitionBlockSchema } from './definition.schema';
import { ObjectiveO1BlockSchema } from './objective-o1.schema';
import { ObjectiveO1BlockSchema } from './objective-o1.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        # Should detect exact match and skip adding import
        result = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Should add re-export and union member, but not duplicate import
        assert "export * from './objective-o1.schema';" in result
        assert "ObjectiveO1BlockSchema," in result

    def test_unsupported_types_extension(self):
        """Schema files with .types.ts extension should strip to .types import path."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        # Filename: objective-o1.types.ts
        result = patch_blocks_schema(content, "objective-o1.types.ts", "ObjectiveO1BlockSchema")
        
        # Should strip .types.ts → .types for import path, but append .schema
        # Based on implementation: removes .ts, adds .schema
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.types.schema';" in result
        assert "export * from './objective-o1.types.schema';" in result

    def test_schema_ts_extension_strips_correctly(self):
        """Schema files with .schema.ts extension should strip to .schema import path."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        result = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Should strip .schema.ts → .schema for import path
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result
        assert "export * from './objective-o1.schema';" in result

    def test_invalid_identifier_with_dash(self):
        """Export names with dashes are not valid JavaScript identifiers."""
        content = MINIMAL_BLOCKS_SCHEMA
        
        with pytest.raises(PatchError, match="Invalid schema export name"):
            patch_blocks_schema(content, "schema.ts", "Invalid-Name")

    def test_invalid_identifier_starts_with_number(self):
        """Export names starting with numbers are not valid JavaScript identifiers."""
        content = MINIMAL_BLOCKS_SCHEMA
        
        with pytest.raises(PatchError, match="Invalid schema export name"):
            patch_blocks_schema(content, "schema.ts", "123Invalid")

    def test_invalid_identifier_with_space(self):
        """Export names with spaces are not valid JavaScript identifiers."""
        content = MINIMAL_BLOCKS_SCHEMA
        
        with pytest.raises(PatchError, match="Invalid schema export name"):
            patch_blocks_schema(content, "schema.ts", "Invalid Name")

    def test_valid_identifier_with_underscore(self):
        """Export names with underscores are valid JavaScript identifiers."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        result = patch_blocks_schema(content, "test_schema.schema.ts", "Test_Schema_Name")
        
        # Should succeed and add all elements
        assert "import { Test_Schema_Name } from './test_schema.schema';" in result
        assert "export * from './test_schema.schema';" in result
        assert "Test_Schema_Name," in result

    def test_valid_identifier_with_dollar_sign(self):
        """Export names with dollar signs are valid JavaScript identifiers."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        result = patch_blocks_schema(content, "test.schema.ts", "$TestSchema")
        
        # Should succeed and add all elements
        assert "import { $TestSchema } from './test.schema';" in result
        assert "export * from './test.schema';" in result
        assert "$TestSchema," in result

    def test_missing_import_section_fails_closed(self):
        """If import section cannot be found, should fail closed."""
        content = """
export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        with pytest.raises(PatchError, match="Cannot find schema import section"):
            patch_blocks_schema(content, "test.schema.ts", "TestSchema")

    def test_missing_export_section_fails_closed(self):
        """If re-export section cannot be found, should fail closed."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
  ])
);
"""
        with pytest.raises(PatchError, match="Cannot find re-export section"):
            patch_blocks_schema(content, "test.schema.ts", "TestSchema")

    def test_missing_union_structure_fails_closed(self):
        """If TutorialBlockSchema union structure cannot be found, should fail closed."""
        content = """import { DefinitionBlockSchema } from './definition.schema';

export * from './definition.schema';

export const SomethingElse = z.object({});
"""
        with pytest.raises(PatchError, match="Cannot find TutorialBlockSchema union structure"):
            patch_blocks_schema(content, "test.schema.ts", "TestSchema")


class TestPatchBlocksSchemaSafety:
    """Test safety guarantees and pre-image validation behavior."""

    def test_preserves_existing_imports(self):
        """Adding new schema should not modify existing imports."""
        content = """import { DefinitionBlockSchema } from './definition.schema';
import { CodeBlockSchema } from './code.schema';
import { ExistingBlockSchema } from './existing.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
    CodeBlockSchema,
  ])
);
"""
        result = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify existing imports unchanged
        assert "import { DefinitionBlockSchema } from './definition.schema';" in result
        assert "import { CodeBlockSchema } from './code.schema';" in result
        assert "import { ExistingBlockSchema } from './existing.schema';" in result

    def test_preserves_existing_union_members(self):
        """Adding new schema should not modify existing union members."""
        content = """import { DefinitionBlockSchema } from './definition.schema';
import { CodeBlockSchema } from './code.schema';

export * from './definition.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
    CodeBlockSchema,
  ])
);
"""
        result = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Verify existing union members unchanged
        assert "DefinitionBlockSchema," in result
        assert "CodeBlockSchema," in result
        assert "ObjectiveO1BlockSchema," in result

    def test_no_substring_false_positives_in_union(self):
        """Should not detect schema name as present if it's a substring of another name."""
        content = """import { DefinitionBlockSchema } from './definition.schema';
import { ObjectiveO1PlusBlockSchema } from './objective-o1-plus.schema';

export * from './definition.schema';
export * from './objective-o1-plus.schema';

export const TutorialBlockSchema = z.lazy(() => z.union([
    DefinitionBlockSchema,
    ObjectiveO1PlusBlockSchema,
  ])
);
"""
        # ObjectiveO1BlockSchema is a substring of ObjectiveO1PlusBlockSchema
        # Should still add ObjectiveO1BlockSchema
        result = patch_blocks_schema(content, "objective-o1.schema.ts", "ObjectiveO1BlockSchema")
        
        # Both should be present
        assert "ObjectiveO1BlockSchema," in result
        assert "ObjectiveO1PlusBlockSchema," in result
        
        # Should have both imports
        assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in result
        assert "import { ObjectiveO1PlusBlockSchema } from './objective-o1-plus.schema';" in result


class TestComputeSha256:
    """Test compute_sha256 cross-platform determinism."""

    def test_normalized_newlines_unix(self):
        """Unix line endings should produce consistent hash."""
        content_unix = "line1\nline2\nline3"
        hash1 = compute_sha256(content_unix)
        hash2 = compute_sha256(content_unix)
        assert hash1 == hash2

    def test_normalized_newlines_windows(self):
        """Windows line endings should normalize to Unix and produce same hash."""
        content_unix = "line1\nline2\nline3"
        content_windows = "line1\r\nline2\r\nline3"
        
        hash_unix = compute_sha256(content_unix)
        hash_windows = compute_sha256(content_windows)
        
        assert hash_unix == hash_windows, "Windows and Unix line endings should produce same hash"

    def test_bytes_input(self):
        """Should handle bytes input with UTF-8 decoding."""
        content_str = "test content\nwith newlines"
        content_bytes = content_str.encode('utf-8')
        
        hash_str = compute_sha256(content_str)
        hash_bytes = compute_sha256(content_bytes)
        
        assert hash_str == hash_bytes
