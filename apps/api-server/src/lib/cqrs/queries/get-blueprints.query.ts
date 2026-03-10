import { dbReadOnly } from '@quiz/db';

import { AdminBlueprintEngine } from '@/modules/admin-engine/admin.blueprint.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetBlueprintsQuery implements Query {
  readonly type = 'GetBlueprintsQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly filters?: { search?: string }
  ) {}
}

export class GetBlueprintsHandler implements QueryHandler<GetBlueprintsQuery> {
  async handle(query: GetBlueprintsQuery): Promise<unknown> {
    const engine = container.get(AdminBlueprintEngine);
    return await engine.withDb(dbReadOnly).getBlueprints(query.cursor, query.limit, query.filters);
  }
}
