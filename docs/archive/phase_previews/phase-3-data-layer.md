# Phase 3: Data Layer Expansion
**Target: 250,000 -> 1,000,000 Concurrent Users**

This phase architectures the database to bypass the physical constraints of a single server instance.

## 1. Postgres Table Partitioning
The `student_answers` table will grow too large for standard indexing.
*   **Strategy**: **Declarative Partitioning** (Range Partitioning).
*   **Action**: Split the results table by `exam_date` or `topic_id`.
*   **Benefits**: Queries only scan the relevant "Slice" of data, keeping performance high even with billions of rows.

## 2. Read Replicas (Read/Write Splitting)
Dashboard viewing should not compete with exam submissions.
*   **Strategy**: Primary vs. Secondary DB nodes.
*   **Action**: 
    - **Write/Submit**: Direct to the Primary Neon instance.
    - **Read/Dashboard**: Direct to the Edge Read-Replica instances.
*   **Benefits**: Millions of people checking their stats won't slow down a single student taking an exam.

## 3. Distributed In-Memory Cache (Global Redis)
Reduce round-trips to the database for active session data.
*   **Strategy**: Global state at the Edge.
*   **Action**: Store "Live Exam State" (current question index, remaining time) in a global **Upstash Redis Cluster**. Use the DB only for the final persistence.
*   **Benefits**: Sub-10ms latency for student interaction while in the middle of an exam.

## 4. Bulk Data Persistence
Single `INSERT` statements are slow for millions of records.
*   **Strategy**: Batching / Stream Persistence.
*   **Action**: Modify background workers to aggregate 50-100 results and perform a single `INSERT ... VALUES (), (), ...` command.
*   **Benefits**: Maximizes Database IO throughput and reduces compute cost per entry.
