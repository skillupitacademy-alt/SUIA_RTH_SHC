import { dbReadOnly } from '@quiz/db';

import { AdminTopicEngine } from '@/modules/admin-engine/admin.topic.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetTopicsQuery implements Query {
  readonly type = 'GetTopicsQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly filters?: { subjectId?: string; search?: string }
  ) {}
}

export class GetTopicsHandler implements QueryHandler<GetTopicsQuery> {
  async handle(query: GetTopicsQuery): Promise<unknown> {
    const engine = container.get(AdminTopicEngine);
    return await engine.withDb(dbReadOnly).getTopics(query.cursor, query.limit, query.filters);
  }
}
