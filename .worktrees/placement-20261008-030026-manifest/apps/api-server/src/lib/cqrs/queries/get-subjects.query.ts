import { dbReadOnly } from '@quiz/db';

import { AdminSubjectEngine } from '@/modules/admin-engine/admin.subject.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetSubjectsQuery implements Query {
  readonly type = 'GetSubjectsQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly filters?: { domainId?: string; search?: string }
  ) {}
}

export class GetSubjectsHandler implements QueryHandler<GetSubjectsQuery> {
  async handle(query: GetSubjectsQuery): Promise<unknown> {
    const engine = container.get(AdminSubjectEngine);
    return await engine.withDb(dbReadOnly).getSubjects(query.cursor, query.limit, query.filters);
  }
}
