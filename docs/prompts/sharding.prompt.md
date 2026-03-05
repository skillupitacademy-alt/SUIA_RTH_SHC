# AI Implementation Prompt: Database Sharding & Data Lifecycle

**Role**: You are a Principal Data Architect specializing in Distributed SQL and Data Tiering.

**Task**: Transition the Quiz Platform's monolithic database into a multi-shard architecture capable of handling billions of rows.

## Core Requirements

### 1. Shard Routing Module
- Implement a `ShardRegistry` that tracks available database instances (e.g., `shard_01`, `shard_02`).
- Create a `calculateShard(userId: string): string` function using consistent hashing (e.g., CRC32 or MD5 modulo) to ensure a user's data is always pinned to the same shard.
- Update the `db.ts` provider to dynamically return a connection client based on the calculated `shardId`.

### 2. Data Migration Logic
- Create a script to move existing data from the current "Primary" DB to its new assigned shard based on the `user_id` mapping.
- Ensure referential integrity is maintained (Topic/Question data can be replicated to ALL shards, while User specific results are partitioned).

### 3. Data Archiving (Cold Storage)
- Implement a `DataJanitorService` triggered by QStash.
- **Logic**: Find rows in `exam_responses` where `created_at < NOW() - INTERVAL '90 days'`.
- **Action**: Stream these rows to an S3 bucket in Parquet format and delete the original database rows to keep the "Hot" index efficient.

## Technical Stack Context
- **Primary DB**: Neon (PostgreSQL).
- **ORM**: Drizzle ORM.
- **Archive Storage**: AWS S3 / Cloudflare R2.
- **Orchestration**: Upstash QStash.

## Prompt Instruction
"Implement Shard-aware database connections in `lib/db.ts`. Create a hashing utility to map `userId` to one of three shards defined in environment variables. Then, create a background job in `modules/system/janitor.service.ts` to archive results older than 90 days to cold storage."

---

## PHASE 1 CARRY-FORWARD (Database Hardening)

> These baseline optimizations must be in place before implementing architectural sharding.

1. **Server-Side Statement Timeout**:
   - Add `statement_timeout: 30000` to the Pool config in `packages/db/src/index.ts`.

2. **Application-Level Timeout Application**:
   - Wrap `ScoringEngine` and `ExamEngine` write operations with `withTimeout()`.

3. **Audit Log Indexing**:
   - Add indexes to `audit_logs.action` and `audit_logs.created_at`.
