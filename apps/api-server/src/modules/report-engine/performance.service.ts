import { db } from "@quiz/db";
import { sql } from "drizzle-orm";

import { logger } from "@/lib/logger";

import { cacheService } from "../core/cache.service";

export class PerformanceService {
  private static log = logger.child({ module: 'performance-service' });

  /**
   * Refreshes the Materialized Views for analytics.
   * This ensures that precomputed metrics stay up-to-date after an exam is submitted.
   */
  static async refreshAnalytics() {
    try {
      this.log.info('Refreshing materialized views...');
      // Concurrent refresh allows reads while updating (requires unique index)
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY attempt_analytics_mv`);
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY attempt_dimension_accuracy_mv`);
      this.log.info('Materialized views refreshed successfully.');
    } catch (e) {
      this.log.error({ err: e }, 'Concurrent refresh failed, attempting standard refresh');
      try {
        await db.execute(sql`REFRESH MATERIALIZED VIEW attempt_analytics_mv`);
        await db.execute(sql`REFRESH MATERIALIZED VIEW attempt_dimension_accuracy_mv`);
      } catch (err2) {
        this.log.error({ err: err2 }, 'Materialized view refresh failed completely');
      }
    }
  }

  static getCacheKey(examId: string) {
    return `attempt:${examId}:core`;
  }

  static async getCachedReport<T>(examId: string): Promise<T | null> {
    return await cacheService.get<T>(this.getCacheKey(examId));
  }

  static async cacheReport<T>(examId: string, data: T) {
    // Cache for 24 hours (86400 seconds * 1000ms)
    await cacheService.set(this.getCacheKey(examId), data, 86400 * 1000);
  }

  static async invalidateCache(examId: string) {
    await cacheService.del(this.getCacheKey(examId));
  }
}
