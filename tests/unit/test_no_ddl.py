"""
Anti-DDL Tests - Enforce Read-Only ORM Boundary

These tests verify that the project-ai service does NOT perform any DDL operations.
All schema changes must go through Drizzle migrations in packages/db-tutorial.

Security Policy: P1 - Prevent dual-authority schema drift
"""

import re
from pathlib import Path


def test_no_metadata_create_all_in_production_code():
    """Verify no Base.metadata.create_all() calls in production code"""
    project_ai_root = Path(__file__).parent.parent.parent / "services" / "project-ai"
    
    # Skip if the directory doesn't exist
    if not project_ai_root.exists():
        return
    
    # Search for Base.metadata.create_all pattern in Python files, excluding test files
    found_violations = []
    pattern = re.compile(r'Base\.metadata\.create_all|metadata\.create_all\(')
    
    for py_file in project_ai_root.rglob("*.py"):
        # Skip test files and conftest
        if "test" in py_file.parts or py_file.name == "conftest.py":
            continue
        
        content = py_file.read_text(encoding="utf-8")
        if pattern.search(content):
            found_violations.append(str(py_file))
    
    assert len(found_violations) == 0, (
        f"Found {len(found_violations)} file(s) with Base.metadata.create_all() calls. "
        f"Schema changes must use Drizzle migrations only: {found_violations}"
    )


def test_no_raw_create_table_sql_in_production_code():
    """Verify no raw CREATE TABLE SQL statements in production code"""
    project_ai_root = Path(__file__).parent.parent.parent / "services" / "project-ai"
    
    # Skip if the directory doesn't exist
    if not project_ai_root.exists():
        return
    
    # Search for actual CREATE TABLE SQL (not in comments) in Python files
    found_violations = []
    # Match CREATE TABLE outside of comments
    pattern = re.compile(r'(conn\.execute|session\.execute|engine\.execute)\s*\(\s*["\'].*CREATE\s+TABLE', re.IGNORECASE | re.DOTALL)
    
    for py_file in project_ai_root.rglob("*.py"):
        # Skip test files and conftest
        if "test" in py_file.parts or py_file.name == "conftest.py":
            continue
        
        content = py_file.read_text(encoding="utf-8")
        if pattern.search(content):
            found_violations.append(str(py_file))
    
    assert len(found_violations) == 0, (
        f"Found {len(found_violations)} file(s) with CREATE TABLE SQL execution. "
        f"Schema changes must use Drizzle migrations only: {found_violations}"
    )


def test_no_alembic_imports_in_production_code():
    """Verify no Alembic imports in production code"""
    project_ai_root = Path(__file__).parent.parent.parent / "services" / "project-ai"
    
    # Skip if the directory doesn't exist
    if not project_ai_root.exists():
        return
    
    # Search for alembic imports in Python files, excluding test files
    found_violations = []
    pattern = re.compile(r'^\s*(import alembic|from alembic)', re.MULTILINE)
    
    for py_file in project_ai_root.rglob("*.py"):
        # Skip test files and conftest
        if "test" in py_file.parts or py_file.name == "conftest.py":
            continue
        
        content = py_file.read_text(encoding="utf-8")
        if pattern.search(content):
            found_violations.append(str(py_file))
    
    assert len(found_violations) == 0, (
        f"Found {len(found_violations)} file(s) importing Alembic. "
        f"Alembic is not the migration authority. Use Drizzle instead: {found_violations}"
    )


def test_alembic_package_not_importable():
    """Verify that Alembic package cannot be imported (not installed)"""
    try:
        import alembic
        # If import succeeds, test should fail
        assert False, (
            "Alembic package is importable but should not be installed. "
            "Remove alembic from pyproject.toml dependencies."
        )
    except ImportError:
        # Expected: alembic should not be importable
        pass
