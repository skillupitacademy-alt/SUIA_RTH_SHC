# Sharding & Partitioning Roadmap

## Objective
To ensure the Quiz Platform can scale to millions of concurrent users and billions of results without performance degradation.

## Phase 1: Application-Level Logic (Current -> 100k Users)
- **Read Replicas**: Direct all `GET` traffic for public quizzes and analytics to read-only database replicas.
- **Cache-Aside**: Aggressive use of Redis for leaderboard and results caching.

## Phase 2: Database Partitioning (100k -> 1M Users)
- **Time-Based Partitioning**: Partition the `exam_results` and `audit_logs` tables by `createdAt` (Monthly/Quarterly partitions).
- **Tenant Isolation**: If the platform moves to a B2B model, introduce `organization_id` as the primary partitioning key for workspace-specific data.

## Phase 3: Horizontal Sharding (1M+ Users)
- **Citus / Vitess Integration**: Move from single-node PostgreSQL to a distributed SQL engine.
- **Sharding Key**: User ID (`userId`) will be the primary sharding key for all user-centric data (results, profiles).
- **Cross-Shard Queries**: Minimize cross-shard joins by duplicating small lookup tables (Subjects, Domains) across all shard nodes.

## Next Steps
1. Performance audit of current `exam_results` indexes.
2. Prototype PostgreSQL `PARTITION BY RANGE` for history tables.
