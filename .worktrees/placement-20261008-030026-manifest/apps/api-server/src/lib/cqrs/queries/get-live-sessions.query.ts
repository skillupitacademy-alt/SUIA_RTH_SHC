import { dbReadOnly } from '@quiz/db';

import { AdminAnalyticsEngine } from '@/modules/admin-engine/admin.analytics.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetLiveSessionsQuery implements Query {
  readonly type = 'GetLiveSessionsQuery';
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly search?: string,
    public readonly fields?: string
  ) {}
}

export class GetLiveSessionsHandler implements QueryHandler<GetLiveSessionsQuery> {
  async handle(query: GetLiveSessionsQuery): Promise<unknown> {
    const engine = container.get(AdminAnalyticsEngine);
    return await engine.withDb(dbReadOnly).getLiveSessions(query.page, query.limit, query.search, query.fields);
  }
}
