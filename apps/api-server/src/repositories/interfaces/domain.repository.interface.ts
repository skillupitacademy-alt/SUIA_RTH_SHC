import { domains } from '@quiz/db';

export interface IDomainRepository {
  findAll(page: number, limit: number, filters?: { search?: string }): Promise<{
    data: (typeof domains.$inferSelect)[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findById(id: string): Promise<typeof domains.$inferSelect | undefined>;
  create(data: typeof domains.$inferInsert): Promise<typeof domains.$inferSelect>;
  update(id: string, data: Partial<typeof domains.$inferInsert>): Promise<typeof domains.$inferSelect>;
  delete(id: string): Promise<typeof domains.$inferSelect>;
  deleteBatch(ids: string[]): Promise<(typeof domains.$inferSelect)[]>;
  updateStatus(id: string, status: 'active' | 'inactive' | 'draft'): Promise<typeof domains.$inferSelect>;
  findWithHierarchy(domainId: string): Promise<Record<string, unknown> | undefined>;
  upsertHierarchy(hierarchy: { name?: string }): Promise<void>;
}
