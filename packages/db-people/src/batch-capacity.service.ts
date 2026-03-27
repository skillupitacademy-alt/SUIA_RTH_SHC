import { Redis } from '@upstash/redis';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from './db';
import { batches } from './schema/batches';

type BatchCapacityDb = typeof db;

export interface BatchCapacitySnapshot {
  batchId: string;
  capacity: number;
  enrolled: number;
  available: number;
}

interface BatchCapacityServiceDeps {
  db?: BatchCapacityDb;
  redis?: Redis | null;
}

const CACHE_PREFIX = 'batch:capacity';

function cacheKey(batchId: string): string {
  return `${CACHE_PREFIX}:${batchId}`;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (typeof url !== 'string' || url.trim().length === 0 || typeof token !== 'string' || token.trim().length === 0) {
    return null;
  }

  return new Redis({ url, token });
}

export class BatchCapacityService {
  private readonly db: BatchCapacityDb;
  private readonly redis: Redis | null;

  constructor(deps: BatchCapacityServiceDeps = {}) {
    this.db = deps.db ?? db;
    this.redis = deps.redis !== undefined ? deps.redis : getRedisClient();
  }

  private async fetchDbSnapshot(batchId: string): Promise<BatchCapacitySnapshot | null> {
    const [row] = await this.db
      .select({
        capacity: batches.capacity,
        enrolled: batches.enrolledCount,
      })
      .from(batches)
      .where(and(eq(batches.id, batchId), isNull(batches.deletedAt)))
      .limit(1);

    if (row === undefined) {
      return null;
    }

    return {
      batchId,
      capacity: row.capacity,
      enrolled: row.enrolled,
      available: Math.max(row.capacity - row.enrolled, 0),
    };
  }

  private async readSnapshotFromRedis(batchId: string): Promise<BatchCapacitySnapshot | null> {
    if (this.redis === null) {
      return null;
    }

    const snapshot = await this.redis.hgetall<Record<string, unknown>>(cacheKey(batchId));
    if (snapshot === null) {
      return null;
    }

    const capacity = toNumber(snapshot.capacity);
    const enrolled = toNumber(snapshot.enrolled);
    if (capacity === null || enrolled === null) {
      return null;
    }

    return {
      batchId,
      capacity,
      enrolled,
      available: Math.max(capacity - enrolled, 0),
    };
  }

  private async writeSnapshot(batchId: string, capacity: number, enrolled: number): Promise<void> {
    if (this.redis === null) {
      return;
    }

    await this.redis.hset(cacheKey(batchId), {
      batchId,
      capacity,
      enrolled,
      updatedAt: new Date().toISOString(),
    });
  }

  private async ensureSnapshot(batchId: string): Promise<BatchCapacitySnapshot | null> {
    const redisSnapshot = await this.readSnapshotFromRedis(batchId);
    if (redisSnapshot !== null) {
      return redisSnapshot;
    }

    const dbSnapshot = await this.fetchDbSnapshot(batchId);
    if (dbSnapshot !== null) {
      await this.writeSnapshot(batchId, dbSnapshot.capacity, dbSnapshot.enrolled);
    }

    return dbSnapshot;
  }

  async getAvailable(batchId: string): Promise<number> {
    const snapshot = await this.ensureSnapshot(batchId);
    return snapshot?.available ?? 0;
  }

  async seed(batchId: string, capacity: number, enrolled: number): Promise<void> {
    await this.writeSnapshot(batchId, capacity, enrolled);
  }

  async reserveSlot(batchId: string): Promise<boolean> {
    const snapshot = await this.ensureSnapshot(batchId);
    if (snapshot === null) {
      return false;
    }

    if (snapshot.available <= 0) {
      return false;
    }

    if (this.redis === null) {
      return true;
    }

    try {
      const nextCount = await this.redis.hincrby(cacheKey(batchId), 'enrolled', 1);
      if (nextCount > snapshot.capacity) {
        await this.redis.hincrby(cacheKey(batchId), 'enrolled', -1);
        return false;
      }

      return true;
    } catch {
      return snapshot.available > 0;
    }
  }

  async releaseSlot(batchId: string): Promise<void> {
    if (this.redis === null) {
      return;
    }

    const snapshot = await this.ensureSnapshot(batchId);
    if (snapshot === null) {
      return;
    }

    try {
      const nextCount = await this.redis.hincrby(cacheKey(batchId), 'enrolled', -1);
      if (nextCount < 0) {
        await this.redis.hset(cacheKey(batchId), {
          batchId,
          capacity: snapshot.capacity,
          enrolled: 0,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      await this.writeSnapshot(batchId, snapshot.capacity, Math.max(snapshot.enrolled - 1, 0));
    }
  }
}

export const batchCapacityService = new BatchCapacityService();
