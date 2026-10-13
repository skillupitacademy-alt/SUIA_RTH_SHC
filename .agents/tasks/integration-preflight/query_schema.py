#!/usr/bin/env python3
import psycopg2

conn = psycopg2.connect(
    "postgresql://neondb_owner:npg_QjFse2RHgY1h@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require"
)
cur = conn.cursor()

query = """
SELECT table_name, column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name IN (
    'project_ai_workflows', 
    'project_ai_approvals', 
    'project_ai_manifests', 
    'project_ai_contracts', 
    'project_ai_candidates'
) 
AND column_name LIKE '%_id'
ORDER BY table_name, column_name;
"""

cur.execute(query)
rows = cur.fetchall()

print(f"{'Table':<35} {'Column':<30} {'Data Type':<20} {'UDT Name':<20}")
print("=" * 105)
for row in rows:
    print(f"{row[0]:<35} {row[1]:<30} {row[2]:<20} {row[3]:<20}")

conn.close()
