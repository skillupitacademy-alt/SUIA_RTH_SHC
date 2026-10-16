"""
READ-ONLY database inspection for Project AI.

Connects to DATABASE_URL_TUTORIAL and runs SELECT queries only.
NO CREATE, DROP, ALTER, INSERT, UPDATE, DELETE, or migrations.
"""

import asyncio
import os
import json
from datetime import datetime
from urllib.parse import urlparse

import asyncpg


async def redact_connection_string(conn_str: str) -> dict:
    """
    Parse connection string and extract metadata WITHOUT exposing password.
    
    Returns dict with redacted connection info.
    """
    parsed = urlparse(conn_str)
    
    return {
        "protocol": parsed.scheme,
        "host": parsed.hostname,
        "port": parsed.port,
        "database": parsed.path.lstrip('/').split('?')[0],
        "user": parsed.username,
        "password": "[REDACTED]",
        "params": parsed.query if parsed.query else None
    }


async def run_inspection():
    """Main inspection routine."""
    
    # Load DATABASE_URL_TUTORIAL from environment
    database_url = os.environ.get("DATABASE_URL_TUTORIAL")
    
    if not database_url:
        print("ERROR: DATABASE_URL_TUTORIAL not set in environment")
        return None
    
    # Redact credentials
    conn_info = await redact_connection_string(database_url)
    
    print("="*80)
    print("PROJECT AI DATABASE INSPECTION")
    print("="*80)
    print(f"Database: {conn_info['database']}")
    print(f"Host: {conn_info['host']}")
    print(f"Port: {conn_info['port']}")
    print(f"User: {conn_info['user']}")
    print(f"Password: [REDACTED]")
    print("="*80)
    print()
    
    results = {
        "inspection_timestamp": datetime.utcnow().isoformat(),
        "connection_info": conn_info,
        "queries": {}
    }
    
    try:
        # Connect to database
        print("Connecting to database...")
        conn = await asyncpg.connect(database_url)
        print("✓ Connected successfully\n")
        
        # Query 1: Database identity
        print("Query 1: Database identity")
        print("-" * 80)
        row = await conn.fetchrow("""
            SELECT 
                current_database() as db_name,
                version() as pg_version,
                current_user as db_user,
                inet_server_addr() as server_addr,
                inet_server_port() as server_port
        """)
        
        db_identity = dict(row)
        results["queries"]["database_identity"] = db_identity
        
        print(f"Database Name: {db_identity['db_name']}")
        print(f"PostgreSQL Version: {db_identity['pg_version']}")
        print(f"Current User: {db_identity['db_user']}")
        print(f"Server Address: {db_identity['server_addr']}")
        print(f"Server Port: {db_identity['server_port']}")
        print()
        
        # Query 2: All tables
        print("Query 2: All tables in database")
        print("-" * 80)
        tables = await conn.fetch("""
            SELECT table_schema, table_name, table_type
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name
        """)
        
        tables_list = [dict(row) for row in tables]
        results["queries"]["all_tables"] = tables_list
        
        print(f"Total tables: {len(tables_list)}")
        for t in tables_list:
            print(f"  {t['table_schema']}.{t['table_name']} ({t['table_type']})")
        print()
        
        # Query 3: Row counts
        print("Query 3: Row counts for all tables")
        print("-" * 80)
        row_counts = await conn.fetch("""
            SELECT 
                schemaname,
                relname AS table_name,
                n_live_tup AS approx_row_count
            FROM pg_stat_user_tables
            ORDER BY schemaname, relname
        """)
        
        row_counts_list = [dict(row) for row in row_counts]
        results["queries"]["row_counts"] = row_counts_list
        
        for rc in row_counts_list:
            print(f"  {rc['schemaname']}.{rc['table_name']}: {rc['approx_row_count']} rows")
        print()
        
        # Query 4: Extensions
        print("Query 4: PostgreSQL extensions")
        print("-" * 80)
        extensions = await conn.fetch("""
            SELECT extname, extversion
            FROM pg_extension
            ORDER BY extname
        """)
        
        extensions_list = [dict(row) for row in extensions]
        results["queries"]["extensions"] = extensions_list
        
        for ext in extensions_list:
            print(f"  {ext['extname']} v{ext['extversion']}")
        print()
        
        # Close connection
        await conn.close()
        print("✓ Connection closed\n")
        
    except Exception as e:
        print(f"ERROR during inspection: {e}")
        results["error"] = str(e)
        return results
    
    return results


async def analyze_project_ai_tables(results: dict) -> dict:
    """
    Analyze which Project AI tables exist and their data status.
    """
    
    # Expected Project AI tables from models.py
    expected_tables = [
        "project_ai_workflows",
        "project_ai_state_transitions",
        "project_ai_contracts",
        "project_ai_candidates",
        "project_ai_manifests",
        "project_ai_approvals",
    ]
    
    all_tables = results["queries"]["all_tables"]
    row_counts = results["queries"]["row_counts"]
    
    # Build lookup dict for row counts
    row_count_map = {
        f"{rc['schemaname']}.{rc['table_name']}": rc['approx_row_count']
        for rc in row_counts
    }
    
    # Find Project AI tables
    project_ai_tables = []
    for expected in expected_tables:
        exists = any(t['table_name'] == expected for t in all_tables)
        row_count = row_count_map.get(f"public.{expected}", 0) if exists else 0
        
        project_ai_tables.append({
            "table_name": expected,
            "exists_in_db": exists,
            "row_count": row_count
        })
    
    # Find tutorial/content-related tables
    tutorial_tables = [
        t['table_name'] for t in all_tables
        if any(keyword in t['table_name'].lower() for keyword in [
            'tutorial', 'content', 'course', 'lesson', 'article', 'chapter'
        ])
    ]
    
    # Assess shared database risk
    has_tutorial_tables = len(tutorial_tables) > 0
    has_project_ai_tables = any(t['exists_in_db'] for t in project_ai_tables)
    total_tables = len(all_tables)
    
    if has_tutorial_tables and has_project_ai_tables:
        shared_risk = "high"
        risk_explanation = (
            f"Database contains both tutorial content tables ({len(tutorial_tables)}) "
            f"and Project AI tables. Testing against this database risks "
            "corrupting tutorial content data."
        )
    elif has_tutorial_tables:
        shared_risk = "medium"
        risk_explanation = (
            f"Database contains {len(tutorial_tables)} tutorial-related tables. "
            "Project AI tables do not exist yet. Migrations would add tables to a shared database."
        )
    elif total_tables > 10:
        shared_risk = "medium"
        risk_explanation = (
            f"Database contains {total_tables} tables. Not isolated for testing."
        )
    else:
        shared_risk = "low"
        risk_explanation = (
            f"Database contains {total_tables} tables, appears to be relatively isolated."
        )
    
    # Assess data type
    project_ai_row_counts = [t['row_count'] for t in project_ai_tables if t['exists_in_db']]
    total_project_ai_rows = sum(project_ai_row_counts)
    
    if not has_project_ai_tables:
        data_appears = "unknown"
        data_reasoning = "Project AI tables do not exist yet. Cannot assess data type."
    elif total_project_ai_rows == 0:
        data_appears = "test_dev"
        data_reasoning = "All Project AI tables are empty. Likely test/development environment."
    elif total_project_ai_rows < 100:
        data_appears = "test_dev"
        data_reasoning = f"Project AI tables contain {total_project_ai_rows} total rows. Likely test data."
    else:
        data_appears = "mixed"
        data_reasoning = (
            f"Project AI tables contain {total_project_ai_rows} rows. "
            "Could be test data or early production."
        )
    
    # Check tutorial table row counts
    tutorial_row_counts = []
    for tname in tutorial_tables:
        row_count = row_count_map.get(f"public.{tname}", 0)
        tutorial_row_counts.append({"table": tname, "rows": row_count})
    
    total_tutorial_rows = sum(tr['rows'] for tr in tutorial_row_counts)
    
    if total_tutorial_rows > 1000:
        data_appears = "production"
        data_reasoning = (
            f"Database contains {total_tutorial_rows} tutorial content rows. "
            "Likely a production or production-like database. DO NOT run destructive tests."
        )
    
    analysis = {
        "db_name": results["connection_info"]["database"],
        "host": results["connection_info"]["host"],
        "pg_version": results["queries"]["database_identity"]["pg_version"],
        "total_table_count": len(all_tables),
        "tables": [
            {
                "schema": t["table_schema"],
                "name": t["table_name"],
                "approx_row_count": row_count_map.get(f"{t['table_schema']}.{t['table_name']}", 0)
            }
            for t in all_tables
        ],
        "project_ai_tables": project_ai_tables,
        "tutorial_content_tables": tutorial_row_counts,
        "shared_database_risk": shared_risk,
        "shared_database_risk_explanation": risk_explanation,
        "data_appears_to_be": data_appears,
        "data_reasoning": data_reasoning
    }
    
    return analysis


async def main():
    """Run inspection and analysis."""
    
    print("\n")
    print("="*80)
    print("READ-ONLY DATABASE INSPECTION")
    print("NO MUTATIONS WILL BE PERFORMED")
    print("="*80)
    print("\n")
    
    # Run inspection
    results = await run_inspection()
    
    if not results or "error" in results:
        print("\nInspection failed. Exiting.")
        return
    
    # Save raw results
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    raw_output_path = os.path.join(output_dir, "database-identity-a2.txt")
    with open(raw_output_path, "w") as f:
        f.write("PROJECT AI DATABASE INSPECTION - RAW QUERY OUTPUT\n")
        f.write("="*80 + "\n\n")
        f.write(f"Inspection Timestamp: {results['inspection_timestamp']}\n\n")
        f.write("CONNECTION INFO (credentials redacted):\n")
        f.write(json.dumps(results['connection_info'], indent=2) + "\n\n")
        f.write("QUERY RESULTS:\n")
        f.write(json.dumps(results['queries'], indent=2, default=str))
    
    print(f"✓ Raw output saved to: {raw_output_path}\n")
    
    # Analyze
    print("="*80)
    print("ANALYSIS")
    print("="*80)
    print()
    
    analysis = await analyze_project_ai_tables(results)
    
    print(f"Database: {analysis['db_name']}")
    print(f"Total Tables: {analysis['total_table_count']}")
    print(f"Tutorial Tables: {len(analysis['tutorial_content_tables'])}")
    print(f"Project AI Tables Exist: {sum(1 for t in analysis['project_ai_tables'] if t['exists_in_db'])}/{len(analysis['project_ai_tables'])}")
    print()
    print(f"Shared Database Risk: {analysis['shared_database_risk'].upper()}")
    print(f"  {analysis['shared_database_risk_explanation']}")
    print()
    print(f"Data Appears To Be: {analysis['data_appears_to_be'].upper()}")
    print(f"  {analysis['data_reasoning']}")
    print()
    
    # Save analysis
    analysis_output_path = os.path.join(output_dir, "data-status-a2.json")
    with open(analysis_output_path, "w") as f:
        json.dump(analysis, f, indent=2, default=str)
    
    print(f"✓ Analysis saved to: {analysis_output_path}\n")
    
    print("="*80)
    print("INSPECTION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(main())
