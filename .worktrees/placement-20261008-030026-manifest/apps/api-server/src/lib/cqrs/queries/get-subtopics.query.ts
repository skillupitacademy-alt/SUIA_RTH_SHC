import { dbReadOnly } from '@quiz/db';

import { AdminSubtopicEngine } from '@/modules/admin-engine/admin.subtopic.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetSubtopicsQuery implements Query {
  readonly type = 'GetSubtopicsQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly filters?: { topicId?: string; search?: string }
  ) {}
}

export class GetSubtopicsHandler implements QueryHandler<GetSubtopicsQuery> {
  async handle(query: GetSubtopicsQuery): Promise<unknown> {
    const engine = container.get(AdminSubtopicEngine);
    return await engine.withDb(dbReadOnly).getSubtopics(query.cursor, query.limit, query.filters);
  }
}
