import { db } from "@quiz/db";
import { sql } from "drizzle-orm";

import { logger } from "@/lib/logger";

import type { CacheValue } from "../core/cache.service";

export class PerformanceService {
  private static singleton: PerformanceService | null = null;
  private cacheInstance?: {
    get<T extends CacheValue>(key: string): Promise<T | null>;
    set(key: string, value: CacheValue, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
  };

  constructor(
    private readonly dbInstance = db,
    cache?: {
      get<T extends CacheValue>(key: string): Promise<T | null>;
      set(key: string, value: CacheValue, ttl?: number): Promise<void>;
      del(key: string): Promise<void>;
    }
  ) {
    this.cacheInstance = cache;
  }

  private static getInstance() {
    if (this.singleton === null) this.singleton = new PerformanceService();
    return this.singleton;
  }

  private log = logger.child({ module: 'performance-service' });

  /**
   * Refreshes the Materialized Views for analytics.
   * This ensures that precomputed metrics stay up-to-date after an exam is submitted.
   */
  async refreshAnalytics() {
    try {
      this.log.info('Refreshing materialized views...');
      await this.dbInstance.execute(sql`REFRESH MATERIALIZED VIEW attempt_analytics_mv`);
      await this.dbInstance.execute(sql`REFRESH MATERIALIZED VIEW attempt_dimension_accuracy_mv`);
      this.log.info('Materialized views refreshed successfully.');
    } catch (e: unknown) {
      this.log.error({ 
        err: e, 
        message: (e as Record<string, unknown>)?.message,
        hint: 'Ensure scripts/init-mvs.ts has been run on this environment.'
      }, 'Materialized view refresh failed completely');
    }
  }

  getCacheKey(examId: string) {
    return `attempt:${examId}:core:v4`;
  }

  private async getCache() {
    if (this.cacheInstance !== undefined) return this.cacheInstance;
    const { cacheService } = await import('../core/cache.service');
    this.cacheInstance = cacheService;
    return this.cacheInstance;
  }

  async getCachedReport<T extends CacheValue>(examId: string): Promise<T | null> {
    try {
      const cache = await this.getCache();
      return await cache.get<T>(this.getCacheKey(examId));
    } catch (err) {
      this.log.warn({ err, examId }, 'Cache read failed, falling back to DB');
      return null;
    }
  }

  async cacheReport<T extends CacheValue>(examId: string, data: T) {
    try {
      const cache = await this.getCache();
      // Cache for 24 hours (86400 seconds * 1000ms)
      await cache.set(this.getCacheKey(examId), data, 86400 * 1000);
    } catch (err) {
      this.log.warn({ err, examId }, 'Cache write failed, continuing without cache');
    }
  }

  async invalidateCache(examId: string) {
    try {
      const cache = await this.getCache();
      await cache.del(this.getCacheKey(examId));
    } catch (err) {
      this.log.warn({ err, examId }, 'Cache invalidate failed, continuing');
    }
  }

  // Static facades for tests
  static refreshAnalytics() { return this.getInstance().refreshAnalytics(); }
  static getCachedReport<T extends CacheValue>(examId: string) { return this.getInstance().getCachedReport<T>(examId); }
  static cacheReport<T extends CacheValue>(examId: string, data: T) { return this.getInstance().cacheReport(examId, data); }
  static invalidateCache(examId: string) { return this.getInstance().invalidateCache(examId); }

  // Test helper
  static setInstance(mock: PerformanceService) {
    this.singleton = mock;
  }
}
