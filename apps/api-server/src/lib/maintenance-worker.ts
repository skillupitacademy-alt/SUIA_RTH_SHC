import { DIRTY_VIEWS_KEY } from '@/lib/cqrs/read-model-updater';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { materializedViewsService } from '@/modules/maintenance/materialized-views.service';
import { PartitionManager } from '@/modules/maintenance/partition-manager';

export class MaintenanceWorker {
  private static interval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static start(intervalMs: number = 30000) {
    if (this.interval !== null) return;
    
    if (process.env.DISABLE_BACKGROUND_WORKERS === 'true' || process.env.CLOUD_RUN_BUILD === 'true') {
      logger.info('[MaintenanceWorker] Background workers disabled via environment');
      return;
    }

    this.interval = setInterval(() => {
      void this.processDirtyViews();
    }, intervalMs);
    logger.info({ intervalMs }, '[MaintenanceWorker] Started');
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('[MaintenanceWorker] Stopped');
    }
  }

  private static async processDirtyViews() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const dirtyViews = await redis.smembers(DIRTY_VIEWS_KEY);
      if (dirtyViews.length === 0) {
        this.isRunning = false;
        return;
      }

      logger.info({ dirtyViews }, '[MaintenanceWorker] Refreshing dirty views');

      for (const viewName of dirtyViews) {
        try {
          await materializedViewsService.refreshView(viewName);
          // Remove from set only after successful refresh
          await redis.srem(DIRTY_VIEWS_KEY, viewName);
        } catch (error) {
          logger.error({ error, viewName }, '[MaintenanceWorker] Failed to refresh view in background');
        }
      }

      // Task 116: Run partition maintenance
      await PartitionManager.runMaintenance();
    } catch (error) {
      logger.error({ error }, '[MaintenanceWorker] Error processing dirty views');
    } finally {
      this.isRunning = false;
    }
  }
}
