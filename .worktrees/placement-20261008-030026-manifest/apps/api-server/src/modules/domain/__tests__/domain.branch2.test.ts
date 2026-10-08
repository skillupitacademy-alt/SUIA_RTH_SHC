import { describe, it, expect, vi } from 'vitest';
import { DomainService } from '../domain.service';

const { cacheService, domainsMock } = vi.hoisted(() => {
  return {
    cacheService: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    },
    domainsMock: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  };
});

vi.mock('@/modules/core/cache.service', () => ({
  cacheService,
}));

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      domains: domainsMock,
      subjects: { findMany: vi.fn() },
      topics: { findMany: vi.fn() },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'd-upd' }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'd-del' }]),
      }),
    }),
  },
  domains: { id: 'id', status: 'status' },
  subjects: { status: 'status', order: 'order' },
  topics: { status: 'status', complexityLevel: 'complexityLevel' },
  subtopics: { topicId: 'topicId' },
}));

describe('DomainService remaining branches', () => {
  it('getDomainHierarchy cache hit and set', async () => {
    cacheService.get.mockResolvedValueOnce({ id: 'cached' } as any);
    const resCached = await DomainService.getDomainHierarchy('d1');
    expect(resCached).toEqual({ id: 'cached' });

    cacheService.get.mockResolvedValueOnce(null);
    domainsMock.findFirst.mockResolvedValueOnce({ id: 'd1' } as any);
    await DomainService.getDomainHierarchy('d1');
    expect(cacheService.set).toHaveBeenCalledWith(expect.stringContaining('domain-hierarchy:d1'), expect.anything(), expect.any(Number));
  });

  it('update/delete invalidations (domain)', async () => {
    await DomainService.updateDomain('d1', { name: 'New' } as any);
    expect(cacheService.del).toHaveBeenCalledWith('metadata:domains:all');
    expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d1');

    await DomainService.deleteDomain('d2');
    expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d2');
  });

  it('deleteDomainsBatch invalidations', async () => {
    cacheService.del.mockClear();
    await DomainService.deleteDomainsBatch(['d3', 'd4']);
    expect(cacheService.del).toHaveBeenCalledWith('metadata:domains:all');
    expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d3');
    expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d4');
  });
});


