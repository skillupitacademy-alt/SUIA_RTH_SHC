import { dbReadOnly } from '@quiz/db';

import { AdminSkillEngine } from '@/modules/admin-engine/admin.skill.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetSkillsQuery implements Query {
  readonly type = 'GetSkillsQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly filters?: { search?: string }
  ) {}
}

export class GetSkillsHandler implements QueryHandler<GetSkillsQuery> {
  async handle(query: GetSkillsQuery): Promise<unknown> {
    const engine = container.get(AdminSkillEngine);
    return await engine.withDb(dbReadOnly).getSkills(query.cursor, query.limit, query.filters);
  }
}
