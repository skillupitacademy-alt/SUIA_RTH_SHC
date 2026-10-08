import { db, REPORT_QUERY_TIMEOUT, withTimeout } from '@quiz/db';
import { sql } from 'drizzle-orm';

import { logger } from '@/lib/logger';

export class AnalyticsService {
  private static log = logger.child({ module: "analytics:service" });

  /**
   * Refreshes all core analytics materialized views.
   * Uses CONCURRENTLY where unique indexes are present to minimize downtime.
   */
  static async refreshAllViews(): Promise<void> {
    this.log.info("Starting global analytics refresh...");

    const views = [
      { name: "mv_mastery_matrix", concurrent: true },
      { name: "mv_user_daily_snapshots", concurrent: true },
      { name: "mv_score_distribution", concurrent: true },
      { name: "mv_mastery_trend", concurrent: true },
      { name: "mv_topic_performance", concurrent: true },
      { name: "mv_skill_performance", concurrent: true },
      { name: "mv_weakness_tree", concurrent: true },
      { name: "mv_question_hierarchy", concurrent: true },
      { name: "mv_topic_skill_matrix", concurrent: true },
      { name: "mv_question_pool", concurrent: true },
      { name: "mv_exam_difficulty_actual", concurrent: true },
      { name: "mv_item_difficulty", concurrent: true },
      { name: "mv_discrimination", concurrent: true },
      // mv_time_boxplot doesn't have a unique index because it's a single aggregate row
      { name: "mv_time_boxplot", concurrent: false }, 
      { name: "mv_top_performers", concurrent: true }, // CF task might have added this
    ];

    const results = {
      success: [] as string[],
      failed: [] as { name: string; error: string }[],
    };

    for (const view of views) {
      try {
        const query = view.concurrent
          ? sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${sql.raw(view.name)}`
          : sql`REFRESH MATERIALIZED VIEW ${sql.raw(view.name)}`;
        
        await withTimeout(
          db.execute(query),
          REPORT_QUERY_TIMEOUT,
          `Analytics.RefreshView.${view.name}`
        );
        results.success.push(view.name);
        this.log.debug({ view: view.name }, "View refreshed successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.failed.push({ name: view.name, error: message });
        this.log.error({ view: view.name, error: message }, "Failed to refresh view");
      }
    }

    this.log.info(
      { 
        total: views.length, 
        success: results.success.length, 
        failed: results.failed.length 
      }, 
      "Global analytics refresh completed"
    );

    if (results.failed.length > 0) {
      throw new Error(`Failed to refresh ${results.failed.length} views: ${results.failed.map(f => f.name).join(", ")}`);
    }
  }
}
