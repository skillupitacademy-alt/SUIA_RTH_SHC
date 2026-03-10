import { dbReadOnly } from '@quiz/db';

import { AdminDomainEngine } from '@/modules/admin-engine/admin.domain.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetDomainsQuery implements Query {
  readonly type = 'GetDomainsQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly filters?: { search?: string }
  ) {}
}

export class GetDomainsHandler implements QueryHandler<GetDomainsQuery> {
  async handle(query: GetDomainsQuery): Promise<unknown> {
    const engine = container.get(AdminDomainEngine);
    return await engine.withDb(dbReadOnly).getDomains(query.cursor, query.limit, query.filters);
  }
}
