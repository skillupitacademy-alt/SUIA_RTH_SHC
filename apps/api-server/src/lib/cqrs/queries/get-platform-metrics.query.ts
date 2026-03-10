import { dbReadOnly } from '@quiz/db';

import { AdminAnalyticsEngine } from '@/modules/admin-engine/admin.analytics.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetPlatformMetricsQuery implements Query {
  readonly type = 'GetPlatformMetricsQuery';
}

export class GetPlatformMetricsHandler implements QueryHandler<GetPlatformMetricsQuery> {
  async handle(_query: GetPlatformMetricsQuery): Promise<unknown> {
    const engine = container.get(AdminAnalyticsEngine);
    return await engine.withDb(dbReadOnly).getPlatformMetrics();
  }
}
