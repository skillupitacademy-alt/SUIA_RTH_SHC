# Database Sharding & Data Lifecycle Blueprint
*Phase 11: The Final Frontier of Planetary Scaling*

## 📜 Architectural Objective
To ensure that as the database grows from millions to **billions of rows**, query latency remains constant (O(1) complexity) and storage costs are optimized through intelligent data tiering.

---

## 🏗️ 1. Database Sharding Strategy
When a single database instance (even an autoscaling one like Neon) cannot keep up with write IOPS or index size, we must move to **Sharding**.

### A. Sharding Key: `tenant_id` or `user_hash`
- **Primary Method**: Hash-based sharding on `user_id`.
- **Logic**: A mathematical hash of the User ID determines which "Shard" (Database Instance) their data lives on.
- **Benefit**: Ensures that any single user's data is always in one place, while spreading the total load across multiple physical servers.

### B. Sharding Mesh (Application Layer)
The `ResilienceService` or a dedicated `ShardingManager` in the API will route queries:
```typescript
const shardId = calculateShard(userId);
const dbClient = getShardClient(shardId);
await dbClient.query(...)
```

---

## ❄️ 2. Data Lifecycle: Hot vs. Cold Storage
Not all data is equal. A result from 3 years ago doesn't need to live in the high-performance memory of your primary DB.

### A. The "Hot" Zone (Primary DB)
- **Data**: Exams taken in the last 90 days.
- **Storage**: High-IOPS NVMe (Neon Primary).
- **Access**: Instant, high-concurrency.

### B. The "Warm" Zone (Archive DB)
- **Data**: Exams taken 90 days to 1 year ago.
- **Storage**: Lower-cost block storage.
- **Access**: Used for year-over-year comparisons.

### C. The "Cold" Zone (S3 / Data Lake)
- **Data**: All raw logs and exams > 1 year old.
- **Storage**: Amazon S3 / Google Cloud Storage (extremely cheap).
- **Format**: Parquet or JSON.
- **Access**: Only for deep historical audits or "Life-Time Summary" reports (retrieved asynchronously).

---

## 🤖 3. Automation: The "Janitor" Job
We use **QStash** to schedule a weekly "Janitor" job that:
1.  Identifies rows in `results` older than 90 days.
2.  Exports them to the "Cold" storage in bulk.
3.  Deletes the "Hot" copies to keep the primary index lean and fast.

---

## 🛡️ Operational Impact
By implementing Sharding and Life-Cycle management, the platform becomes **immortal**. It will never "slow down" over time because the "Hot" database remains at a constant size, regardless of how many users join over the years.

*Document Version: 1.0 (Planetary Scale Addition)*
