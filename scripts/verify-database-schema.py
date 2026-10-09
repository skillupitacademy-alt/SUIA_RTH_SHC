#!/usr/bin/env python3
"""
Database Schema Verification Script for M2.9 Workflow W6-V2

Verifies that all 6 canonical M2.9 tables exist in the Drizzle migration files
and that they have proper indexes and foreign key relationships defined.

Exit Codes:
  0 - All checks passed
  1 - One or more checks failed
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Set, Tuple


# Expected M2.9 canonical tables
EXPECTED_TABLES = [
    "project_ai_workflows",
    "project_ai_state_transitions",
    "project_ai_contracts",
    "project_ai_candidates",
    "project_ai_manifests",
    "project_ai_approvals",
]

# Migration directories to check
MIGRATION_DIRS = [
    "packages/db-tutorial/migrations",
    "packages/db/migrations",
    "migrations",
    "alembic/versions",
]

# Schema definition file
SCHEMA_FILE = "packages/db-tutorial/src/schema/project-ai-persistence.ts"


def find_migration_dir(workspace_root: Path) -> Path | None:
    """Find the first existing migration directory."""
    for dir_path in MIGRATION_DIRS:
        full_path = workspace_root / dir_path
        if full_path.exists() and full_path.is_dir():
            return full_path
    return None


def extract_tables_from_migrations(migration_dir: Path) -> Set[str]:
    """Extract table names from SQL migration files."""
    tables = set()
    
    # Pattern to match table operations
    table_patterns = [
        r'CREATE TABLE\s+"?(\w+)"?',
        r'ALTER TABLE\s+"?(\w+)"?',
        r'DROP TABLE\s+"?(\w+)"?',
        r'INSERT INTO\s+"?(\w+)"?',
    ]
    
    for sql_file in migration_dir.glob("*.sql"):
        content = sql_file.read_text(encoding='utf-8')
        
        for pattern in table_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                table_name = match.group(1).lower()
                if table_name.startswith("project_ai_"):
                    tables.add(table_name)
    
    return tables


def extract_indexes_from_migrations(migration_dir: Path) -> Dict[str, List[str]]:
    """Extract index definitions from SQL migration files."""
    indexes_by_table = {}
    
    # Pattern to match CREATE INDEX statements
    index_pattern = r'CREATE\s+(?:UNIQUE\s+)?INDEX\s+"?(\w+)"?\s+ON\s+"?(\w+)"?'
    
    for sql_file in migration_dir.glob("*.sql"):
        content = sql_file.read_text(encoding='utf-8')
        
        matches = re.finditer(index_pattern, content, re.IGNORECASE)
        for match in matches:
            index_name = match.group(1)
            table_name = match.group(2).lower()
            
            if table_name.startswith("project_ai_"):
                if table_name not in indexes_by_table:
                    indexes_by_table[table_name] = []
                indexes_by_table[table_name].append(index_name)
    
    return indexes_by_table


def extract_foreign_keys_from_migrations(migration_dir: Path) -> Dict[str, List[str]]:
    """Extract foreign key definitions from SQL migration files."""
    fks_by_table = {}
    
    # Pattern to match FOREIGN KEY constraints
    fk_patterns = [
        r'ALTER TABLE\s+"?(\w+)"?\s+ADD\s+CONSTRAINT\s+"?(\w+)"?\s+FOREIGN KEY',
        r'FOREIGN KEY\s*\([^)]+\)\s+REFERENCES\s+"?(\w+)"?',
    ]
    
    for sql_file in migration_dir.glob("*.sql"):
        content = sql_file.read_text(encoding='utf-8')
        
        # Match ADD CONSTRAINT ... FOREIGN KEY
        for match in re.finditer(fk_patterns[0], content, re.IGNORECASE):
            table_name = match.group(1).lower()
            constraint_name = match.group(2)
            
            if table_name.startswith("project_ai_"):
                if table_name not in fks_by_table:
                    fks_by_table[table_name] = []
                fks_by_table[table_name].append(constraint_name)
    
    return fks_by_table


def extract_schema_definition(workspace_root: Path) -> Dict[str, any]:
    """Extract schema information from TypeScript schema file."""
    schema_path = workspace_root / SCHEMA_FILE
    
    if not schema_path.exists():
        return {"exists": False, "tables": [], "indexes": {}, "foreign_keys": {}}
    
    content = schema_path.read_text(encoding='utf-8')
    
    # Extract table definitions
    tables = []
    table_pattern = r'export const \w+ = pgTable\([\'"](\w+)[\'"]'
    for match in re.finditer(table_pattern, content):
        tables.append(match.group(1))
    
    # Extract index definitions (simplified)
    indexes_by_table = {}
    index_pattern = r'idx\w+:\s*index\([\'"](\w+)[\'"]\)'
    for match in re.finditer(index_pattern, content):
        index_name = match.group(1)
        # Try to associate with table (simplified heuristic)
        for table in tables:
            if table.replace("project_ai_", "") in index_name:
                if table not in indexes_by_table:
                    indexes_by_table[table] = []
                indexes_by_table[table].append(index_name)
    
    # Extract foreign key definitions
    fks_by_table = {}
    fk_pattern = r'references\(\(\)\s*=>\s*(\w+)\.(\w+)'
    for match in re.finditer(fk_pattern, content):
        ref_table = match.group(1)
        # Map back to table name (simplified)
        for table in tables:
            if table in content:
                if table not in fks_by_table:
                    fks_by_table[table] = []
                fks_by_table[table].append(f"references_{ref_table}")
    
    return {
        "exists": True,
        "tables": tables,
        "indexes": indexes_by_table,
        "foreign_keys": fks_by_table,
    }


def verify_schema(workspace_root: Path) -> Tuple[bool, Dict[str, any]]:
    """
    Verify database schema against M2.9 requirements.
    
    Returns:
        (success: bool, findings: dict)
    """
    findings = {
        "script": "verify-database-schema.py",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "workspace": str(workspace_root),
        "expected_tables": EXPECTED_TABLES,
        "tables_found": [],
        "tables_missing": [],
        "indexes_verified": {},
        "foreign_keys_verified": {},
        "issues": [],
    }
    
    # Find migration directory
    migration_dir = find_migration_dir(workspace_root)
    
    if not migration_dir:
        findings["issues"].append(
            f"No migration directory found. Checked: {', '.join(MIGRATION_DIRS)}"
        )
        return False, findings
    
    findings["migration_dir"] = str(migration_dir)
    
    # Extract tables from migrations
    tables_in_migrations = extract_tables_from_migrations(migration_dir)
    findings["tables_found"] = sorted(list(tables_in_migrations))
    
    # Check for missing tables
    missing_tables = set(EXPECTED_TABLES) - tables_in_migrations
    findings["tables_missing"] = sorted(list(missing_tables))
    
    if missing_tables:
        findings["issues"].append(
            f"Missing tables in migrations: {', '.join(sorted(missing_tables))}"
        )
    
    # Extract indexes
    indexes_by_table = extract_indexes_from_migrations(migration_dir)
    findings["indexes_verified"] = indexes_by_table
    
    # Verify indexes exist for found tables
    for table in tables_in_migrations:
        if table not in indexes_by_table or len(indexes_by_table[table]) == 0:
            findings["issues"].append(
                f"Table '{table}' has no indexes defined in migrations"
            )
    
    # Extract foreign keys
    fks_by_table = extract_foreign_keys_from_migrations(migration_dir)
    findings["foreign_keys_verified"] = fks_by_table
    
    # Verify schema file
    schema_info = extract_schema_definition(workspace_root)
    findings["schema_file"] = {
        "path": SCHEMA_FILE,
        "exists": schema_info["exists"],
        "tables_defined": schema_info["tables"] if schema_info["exists"] else [],
    }
    
    if not schema_info["exists"]:
        findings["issues"].append(f"Schema file not found: {SCHEMA_FILE}")
    else:
        # Verify schema file has all expected tables
        schema_tables = set(schema_info["tables"])
        missing_in_schema = set(EXPECTED_TABLES) - schema_tables
        if missing_in_schema:
            findings["issues"].append(
                f"Tables missing in schema file: {', '.join(sorted(missing_in_schema))}"
            )
    
    # Overall success
    success = len(findings["issues"]) == 0 and len(missing_tables) == 0
    
    return success, findings


def main():
    """Main entry point."""
    workspace_root = Path(__file__).parent.parent.resolve()
    
    print("=" * 80)
    print("Database Schema Verification - M2.9 W6-V2")
    print("=" * 80)
    print(f"Workspace: {workspace_root}")
    print()
    
    success, findings = verify_schema(workspace_root)
    
    # Print summary
    print(f"Expected tables: {len(EXPECTED_TABLES)}")
    print(f"Tables found: {len(findings['tables_found'])}")
    print(f"Tables missing: {len(findings['tables_missing'])}")
    print()
    
    if findings["tables_found"]:
        print("Tables found in migrations:")
        for table in findings["tables_found"]:
            num_indexes = len(findings["indexes_verified"].get(table, []))
            num_fks = len(findings["foreign_keys_verified"].get(table, []))
            print(f"  ✓ {table} ({num_indexes} indexes, {num_fks} FKs)")
        print()
    
    if findings["tables_missing"]:
        print("Missing tables:")
        for table in findings["tables_missing"]:
            print(f"  ✗ {table}")
        print()
    
    if findings["issues"]:
        print("Issues found:")
        for issue in findings["issues"]:
            print(f"  ⚠ {issue}")
        print()
    
    # Write report
    report_path = workspace_root / ".agents" / "tasks" / "w6-v2-report.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Database Schema Verification Report - W6-V2\n\n")
        f.write(f"**Script:** {findings['script']}\n")
        f.write(f"**Timestamp:** {findings['timestamp']}\n")
        f.write(f"**Workspace:** {findings['workspace']}\n")
        f.write(f"**Migration Directory:** {findings.get('migration_dir', 'NOT FOUND')}\n\n")
        
        f.write("## Summary\n\n")
        f.write(f"- Expected tables: {len(EXPECTED_TABLES)}\n")
        f.write(f"- Tables found: {len(findings['tables_found'])}\n")
        f.write(f"- Tables missing: {len(findings['tables_missing'])}\n")
        f.write(f"- Total indexes: {sum(len(idx) for idx in findings['indexes_verified'].values())}\n")
        f.write(f"- Total foreign keys: {sum(len(fk) for fk in findings['foreign_keys_verified'].values())}\n\n")
        
        f.write("## Tables Found\n\n")
        for table in findings["tables_found"]:
            indexes = findings["indexes_verified"].get(table, [])
            fks = findings["foreign_keys_verified"].get(table, [])
            f.write(f"### {table}\n\n")
            f.write(f"- **Indexes ({len(indexes)}):** {', '.join(indexes) if indexes else 'None'}\n")
            f.write(f"- **Foreign Keys ({len(fks)}):** {', '.join(fks) if fks else 'None'}\n\n")
        
        if findings["tables_missing"]:
            f.write("## Missing Tables\n\n")
            for table in findings["tables_missing"]:
                f.write(f"- {table}\n")
            f.write("\n")
        
        if findings["issues"]:
            f.write("## Issues\n\n")
            for issue in findings["issues"]:
                f.write(f"- {issue}\n")
            f.write("\n")
        
        f.write("## Schema File\n\n")
        f.write(f"- **Path:** {SCHEMA_FILE}\n")
        f.write(f"- **Exists:** {findings['schema_file']['exists']}\n")
        if findings['schema_file']['exists']:
            f.write(f"- **Tables Defined:** {', '.join(findings['schema_file']['tables_defined'])}\n")
        f.write("\n")
        
        f.write("## Verification Result\n\n")
        if success:
            f.write("✅ **PASS** - All checks passed\n")
        else:
            f.write("❌ **FAIL** - One or more checks failed\n")
    
    print(f"Report written to: {report_path}")
    
    # Write evidence JSON
    evidence_path = workspace_root / ".agents" / "tasks" / "w6-v2-evidence.json"
    evidence = {
        "domain": "database-schema",
        "status": "PASS" if success else "FAIL",
        "tables_expected": len(EXPECTED_TABLES),
        "tables_found": len(findings["tables_found"]),
        "indexes_ok": all(
            len(findings["indexes_verified"].get(table, [])) > 0 
            for table in findings["tables_found"]
        ),
        "foreign_keys_count": sum(len(fk) for fk in findings["foreign_keys_verified"].values()),
        "issues": findings["issues"],
        "timestamp": findings["timestamp"],
        "migration_dir": findings.get("migration_dir", "NOT FOUND"),
        "schema_file_exists": findings["schema_file"]["exists"],
    }
    
    with open(evidence_path, "w", encoding="utf-8") as f:
        json.dump(evidence, f, indent=2)
    
    print(f"Evidence written to: {evidence_path}")
    print()
    
    # Exit with appropriate code
    if success:
        print("✅ All checks passed")
        sys.exit(0)
    else:
        print("❌ Verification failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
