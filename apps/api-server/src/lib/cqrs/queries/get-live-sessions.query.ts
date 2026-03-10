import { dbReadOnly } from '@quiz/db';

import { AdminAnalyticsEngine } from '@/modules/admin-engine/admin.analytics.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetLiveSessionsQuery implements Query {
  readonly type = 'GetLiveSessionsQuery';
  constructor() {}
}

export class GetLiveSessionsHandler implements QueryHandler<GetLiveSessionsQuery> {
  async handle(_query: GetLiveSessionsQuery): Promise<unknown> {
    const engine = container.get(AdminAnalyticsEngine);
    return await engine.withDb(dbReadOnly).getLiveSessions();
  }
}
