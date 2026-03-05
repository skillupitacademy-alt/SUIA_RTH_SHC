import { db } from "@quiz/db";
import { sql } from "drizzle-orm";

import { logger } from "@/lib/logger";

import { cacheService, type CacheValue } from "../core/cache.service";

export class PerformanceService {
  private static singleton = new PerformanceService();

  constructor(
    private readonly dbInstance = db,
    private readonly cache = cacheService
  ) {}

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
    } catch (e) {
      this.log.error({ err: e }, 'Materialized view refresh failed completely');
    }
  }

  getCacheKey(examId: string) {
    return `attempt:${examId}:core:v4`;
  }

  async getCachedReport<T extends CacheValue>(examId: string): Promise<T | null> {
    try {
      return await this.cache.get<T>(this.getCacheKey(examId));
    } catch (err) {
      this.log.warn({ err, examId }, 'Cache read failed, falling back to DB');
      return null;
    }
  }

  async cacheReport<T extends CacheValue>(examId: string, data: T) {
    try {
      // Cache for 24 hours (86400 seconds * 1000ms)
      await this.cache.set(this.getCacheKey(examId), data, 86400 * 1000);
    } catch (err) {
      this.log.warn({ err, examId }, 'Cache write failed, continuing without cache');
    }
  }

  async invalidateCache(examId: string) {
    try {
      await this.cache.del(this.getCacheKey(examId));
    } catch (err) {
      this.log.warn({ err, examId }, 'Cache invalidate failed, continuing');
    }
  }

  // Static facades for tests
  static refreshAnalytics() { return this.singleton.refreshAnalytics(); }
  static getCachedReport<T extends CacheValue>(examId: string) { return this.singleton.getCachedReport<T>(examId); }
  static cacheReport<T extends CacheValue>(examId: string, data: T) { return this.singleton.cacheReport(examId, data); }
  static invalidateCache(examId: string) { return this.singleton.invalidateCache(examId); }
}
