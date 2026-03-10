import { dbReadOnly } from '@quiz/db';

import { AdminUserEngine } from '@/modules/admin-engine/admin.user.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetAdminUsersQuery implements Query {
  readonly type = 'GetAdminUsersQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly status: 'active' | 'deleted' = 'active',
    public readonly filters?: { 
      search?: string; 
      role?: string; 
      isBlocked?: boolean;
      isVerified?: boolean; 
      status?: string;
      fields?: string;
    }
  ) {}
}

export class GetAdminUsersHandler implements QueryHandler<GetAdminUsersQuery> {
  async handle(query: GetAdminUsersQuery): Promise<unknown> {
    const engine = container.get(AdminUserEngine);
    return await engine.withDb(dbReadOnly).getUsers(query.cursor, query.limit, query.status, query.filters);
  }
}
