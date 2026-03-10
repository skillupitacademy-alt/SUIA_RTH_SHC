import { db } from '@quiz/db';
import { sql } from 'drizzle-orm';

import { logger } from '@/lib/logger';

export class MaterializedViewsService {
  private static readonly VIEWS = [
    'mv_user_stats',
    'mv_exam_stats',
    'mv_exam_status_stats',
    'mv_domain_activity_stats',
    'mv_efficiency_stats',
    'mv_question_stats',
    'mv_content_readiness'
  ];

  /**
   * Refreshes a specific materialized view concurrently.
   * CONCURRENTLY requires a unique index on the view and doesn't block reads.
   */
  async refreshView(viewName: string) {
    if (!MaterializedViewsService.VIEWS.includes(viewName)) {
      throw new Error(`Invalid materialized view name: ${viewName}`);
    }

    logger.info({ viewName }, '[MaterializedViewsService] Refreshing view');
    try {
      // Note: REFRESH MATERIALIZED VIEW CONCURRENTLY requires PostgreSQL 9.4+
      // and a unique index on the view.
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${sql.raw(viewName)}`);
      logger.info({ viewName }, '[MaterializedViewsService] View refreshed successfully');
    } catch (error) {
      logger.error({ error, viewName }, '[MaterializedViewsService] Failed to refresh view');
      // Fallback to non-concurrent refresh if concurrent fails (e.g. no unique index or first refresh)
      try {
        await db.execute(sql`REFRESH MATERIALIZED VIEW ${sql.raw(viewName)}`);
        logger.info({ viewName }, '[MaterializedViewsService] View refreshed (non-concurrently) successfully');
      } catch (fallbackError) {
        logger.error({ error: fallbackError, viewName }, '[MaterializedViewsService] Total failure refreshing view');
        throw fallbackError;
      }
    }
  }

  /**
   * Refreshes all registered materialized views.
   */
  async refreshAll() {
    logger.info('[MaterializedViewsService] Refreshing all views');
    for (const view of MaterializedViewsService.VIEWS) {
      await this.refreshView(view).catch(err => {
        logger.error({ err, view }, '[MaterializedViewsService] Error in refreshAll loop');
      });
    }
  }
}

export const materializedViewsService = new MaterializedViewsService();
