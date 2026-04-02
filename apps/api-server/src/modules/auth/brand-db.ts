import { db as realtutorialhubDb } from '@quiz/db-rth';
import { db as skillupDb } from '@quiz/db-skillup';

import type { RequestBrand } from '@/lib/request-brand';

export function getAuthBrandDb(brand: RequestBrand = 'realtutorialhub') {
  return (brand === 'skillup' ? skillupDb : realtutorialhubDb) as any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindBrandRepo<T extends { withDb?: (dbClient: any) => T }>(repo: T, dbClient: any): T {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined) {
    return repo;
  }
  return typeof repo.withDb === 'function' ? repo.withDb(dbClient) : repo;
}
