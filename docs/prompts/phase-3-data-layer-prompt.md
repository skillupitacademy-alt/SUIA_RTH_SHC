# AI Implementation Prompt: Scaling Phase 3 (Data Layer)

**Objective**: Expand the database architecture to handle millions of rows and simultaneous writes via partitioning and read-splitting.

---

## CONTEXT
The `student_answers` and `results` tables are becoming bottlenecks. We need to implement database-level optimizations.

## INSTRUCTIONS
Please guide/execute the following:

1. **Table Partitioning**:
   - Generate a Drizzle/SQL migration to convert the `results` table into a **Partitioned Table**.
   - Use `exam_date` or `month` as the partition key.
   - Create the initial set of 12 monthly partitions.

2. **Read/Write Splitting**:
   - Modify the Database Provider to support two connections: `PROD_DB_PRIMARY` (for writes) and `PROD_DB_REPLICA` (for reads).
   - Update all "Dashboard" and "Analytics" queries to use the Replica connection.

3. **Global Redis Sync**:
   - Implement **Upstash Redis** as a "Live State" store.
   - When a student is in an exam, store their current progress in Redis instead of hammering Postgres with every question save.
   - Sync from Redis to Postgres ONLY when the exam is submitted or every 5 minutes.

4. **Bulk Insert Optimization**:
   - Refactor the worker logic to use `db.insert(...).values([...])` with arrays of 50+ records instead of single inserts.

## OUTPUT
Provide the SQL migration script for partitioning and the updated Drizzle initialization logic for Read/Write splitting.
