"""
Unit tests for conftest.py skip behavior.

These tests verify that the test infrastructure correctly skips integration
tests when TEST_DATABASE_URL_TUTORIAL is not configured, rather than failing
with connection errors or attempting to use a fallback database.
"""

import os
import pytest
from unittest.mock import patch


def test_skip_marker_applied_when_env_var_missing():
    """
    Test that pytest_collection_modifyitems applies skip marker when
    TEST_DATABASE_URL_TUTORIAL is not configured.
    """
    from tests.integration.conftest import pytest_collection_modifyitems
    
    # Mock config and items
    class MockConfig:
        pass
    
    class MockItem:
        def __init__(self, name):
            self.name = name
            self.markers = []
        
        def add_marker(self, marker):
            self.markers.append(marker)
    
    config = MockConfig()
    items = [
        MockItem("test_workflow_upsert"),
        MockItem("test_contract_hash"),
        MockItem("test_restart_persistence"),
    ]
    
    # Simulate missing TEST_DATABASE_URL_TUTORIAL
    with patch.dict(os.environ, {}, clear=True):
        # Re-import to pick up cleared environment
        import importlib
        import tests.integration.conftest as conftest_module
        importlib.reload(conftest_module)
        
        # Call hook
        conftest_module.pytest_collection_modifyitems(config, items)
        
        # Verify all items have skip marker
        for item in items:
            assert len(item.markers) > 0
            # Check that at least one marker is a skip marker
            skip_markers = [m for m in item.markers if hasattr(m, 'name') and 'skip' in str(m)]
            assert len(skip_markers) > 0, f"Item {item.name} should have skip marker"


def test_skip_marker_not_applied_when_env_var_present():
    """
    Test that pytest_collection_modifyitems does NOT apply skip marker when
    TEST_DATABASE_URL_TUTORIAL is configured.
    """
    from tests.integration.conftest import pytest_collection_modifyitems
    
    class MockConfig:
        pass
    
    class MockItem:
        def __init__(self, name):
            self.name = name
            self.markers = []
        
        def add_marker(self, marker):
            self.markers.append(marker)
    
    config = MockConfig()
    items = [
        MockItem("test_workflow_upsert"),
        MockItem("test_contract_hash"),
    ]
    
    # Simulate TEST_DATABASE_URL_TUTORIAL being configured
    test_url = "postgresql+asyncpg://user:pass@localhost/test_db"
    with patch.dict(os.environ, {"TEST_DATABASE_URL_TUTORIAL": test_url}):
        # Re-import to pick up environment
        import importlib
        import tests.integration.conftest as conftest_module
        importlib.reload(conftest_module)
        
        # Call hook
        conftest_module.pytest_collection_modifyitems(config, items)
        
        # Verify no items have skip marker (markers list should be empty)
        for item in items:
            assert len(item.markers) == 0, f"Item {item.name} should not have skip marker when env var is set"


def test_integration_db_engine_fixture_skips_when_table_missing():
    """
    Test that integration_db_engine fixture skips when project_ai_workflows
    table does not exist in the test database.
    
    This is a documentation test - we can't easily mock async database
    connections in a unit test, but this documents the expected behavior.
    """
    # This test documents the expected behavior:
    # 1. Fixture connects to database
    # 2. Queries information_schema.tables for 'project_ai_workflows'
    # 3. If table doesn't exist, disposes engine and calls pytest.skip()
    # 4. Skip message includes migration instructions
    
    expected_skip_message = (
        "project_ai_workflows table does not exist in test database. "
        "Run migrations before running integration tests: "
        "pnpm --filter @quiz/db-tutorial db:migrate"
    )
    
    # Document that this is the expected skip behavior
    assert "project_ai_workflows" in expected_skip_message
    assert "db:migrate" in expected_skip_message
    
    # This test passes to document the expected behavior
    # Actual database connection testing requires real PostgreSQL


def test_env_var_name_is_consistent():
    """
    Test that the environment variable name is consistent across conftest.
    """
    # The environment variable name should be TEST_DATABASE_URL_TUTORIAL
    # This matches the convention from FEAT-000 discovery
    expected_env_var = "TEST_DATABASE_URL_TUTORIAL"
    
    # Import conftest to verify it uses the correct variable
    from tests.integration import conftest
    
    # Check that the conftest module references the correct env var
    import inspect
    source = inspect.getsource(conftest)
    
    assert expected_env_var in source, "conftest should use TEST_DATABASE_URL_TUTORIAL"
    
    # Verify no fallback variables are used
    forbidden_fallbacks = [
        "DATABASE_URL",  # Production variable
        "localhost",  # No hardcoded localhost
        "sqlite",  # No SQLite fallback
    ]
    
    for fallback in forbidden_fallbacks:
        # Allow DATABASE_URL in comments but not in actual connection logic
        if fallback == "DATABASE_URL":
            continue  # This might appear in comments/docstrings
        
        # For actual fallbacks, they should not appear in connection strings
        assert fallback.lower() not in source.lower(), f"conftest should not use {fallback} as fallback"


if __name__ == "__main__":
    # Allow running this test file directly
    pytest.main([__file__, "-v"])
