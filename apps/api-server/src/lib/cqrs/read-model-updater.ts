import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { eventBus } from '@/modules/core/event-bus';
import { DOMAIN_EVENTS } from '@/modules/core/events';

export const DIRTY_VIEWS_KEY = 'cache:dirty_views';

export class ReadModelUpdater {
  private static instance: ReadModelUpdater | undefined;

  private constructor() {
    this.setupListeners();
  }

  static init() {
    if (ReadModelUpdater.instance === undefined) {
      ReadModelUpdater.instance = new ReadModelUpdater();
      logger.info('[ReadModelUpdater] Initialized');
    }
    return ReadModelUpdater.instance;
  }

  private setupListeners() {
    // Exam Completed -> Refresh exam stats, status stats, domain activity, efficiency
    eventBus.onEvent(DOMAIN_EVENTS.EXAM_COMPLETED, async () => {
      await this.markDirty([
        'mv_exam_stats',
        'mv_exam_status_stats',
        'mv_domain_activity_stats',
        'mv_efficiency_stats'
      ]);
    });

    // User Registered -> Refresh user stats
    eventBus.onEvent(DOMAIN_EVENTS.USER_REGISTERED, async () => {
      await this.markDirty(['mv_user_stats']);
    });

    // We can add more events as needed, e.g. QuestionCreated -> mv_question_stats, mv_content_readiness
  }

  private async markDirty(viewNames: string[]) {
    try {
      if (viewNames.length === 0) return;
      const tupleArgs = viewNames as [string, ...string[]];
      await redis.sadd(DIRTY_VIEWS_KEY, ...tupleArgs);
      await redis.expire(DIRTY_VIEWS_KEY, 86400);
      logger.debug({ viewNames }, '[ReadModelUpdater] Marked views as dirty');
    } catch (error) {
      logger.error({ error, viewNames }, '[ReadModelUpdater] Failed to mark views as dirty');
    }
  }
}
