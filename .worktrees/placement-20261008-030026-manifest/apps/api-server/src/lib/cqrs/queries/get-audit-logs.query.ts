import { dbReadOnly } from '@quiz/db';

import { AdminAnalyticsEngine } from '@/modules/admin-engine/admin.analytics.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetAuditLogsQuery implements Query {
  readonly type = 'GetAuditLogsQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly fields?: string
  ) {}
}

export class GetAuditLogsHandler implements QueryHandler<GetAuditLogsQuery> {
  async handle(query: GetAuditLogsQuery): Promise<unknown> {
    const engine = container.get(AdminAnalyticsEngine);
    return await engine.withDb(dbReadOnly).getRecentAuditLogs(query.cursor, query.limit, query.fields);
  }
}
