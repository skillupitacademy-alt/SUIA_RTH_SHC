import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const insertedIds = {
    tutorial_domains: 'domain-db-id',
    tutorial_subjects: 'subject-db-id',
    tutorial_topics: 'topic-db-id',
    tutorial_subtopics: 'subtopic-db-id',
  } as const;

  const upsertCalls: Array<{ table: string; values: unknown; conflict: unknown }> = [];

  const makeInsertBuilder = (tableName: keyof typeof insertedIds) => ({
    values: vi.fn((values: unknown) => ({
      onConflictDoUpdate: vi.fn((conflict: unknown) => {
        upsertCalls.push({ table: tableName, values, conflict });
        return {
          returning: vi.fn(async () => [{ id: insertedIds[tableName] }]),
        };
      }),
    })),
  });

  const tx = {
    insert: vi.fn((table: { tableName: keyof typeof insertedIds }) => makeInsertBuilder(table.tableName)),
  };

  const dbClient = {
    transaction: vi.fn(async (callback: (tx: typeof tx) => Promise<unknown>) => callback(tx)),
  };

  const redis = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };

  return {
    dbClient,
    tx,
    redis,
    upsertCalls,
    insertedIds,
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
    loggerError: vi.fn(),
  };
});

vi.mock('@quiz/db-tutorial', () => ({
  db: mocks.dbClient,
  STANDARD_QUERY_TIMEOUT: 15_000,
  withTimeout: async <T>(promise: Promise<T>) => promise,
  tutorialDomains: { tableName: 'tutorial_domains', id: 'id', externalId: 'externalId' },
  tutorialSubjects: { tableName: 'tutorial_subjects', id: 'id', externalId: 'externalId' },
  tutorialTopics: { tableName: 'tutorial_topics', id: 'id', externalId: 'externalId' },
  tutorialSubtopics: { tableName: 'tutorial_subtopics', id: 'id', externalId: 'externalId' },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
    error: mocks.loggerError,
  },
}));

import { HierarchySyncService } from '../hierarchy-sync.service';

const payload = {
  subtopicId: '11111111-1111-1111-1111-111111111111',
  subtopicName: 'Promisification',
  subtopicSlug: 'promisification',
  topicId: '22222222-2222-2222-2222-222222222222',
  topicName: 'Async Patterns',
  topicSlug: 'async-patterns',
  subjectId: '33333333-3333-3333-3333-333333333333',
  subjectName: 'JavaScript',
  subjectSlug: 'javascript',
  domainId: '44444444-4444-4444-4444-444444444444',
  domainName: 'Web Development',
  domainSlug: 'web-development',
  difficulties: ['simple', 'mixed'] as const,
  publishedAt: '2026-03-23T10:00:00.000Z',
};

describe('HierarchySyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redis.get.mockResolvedValue(null);
    mocks.redis.set.mockResolvedValue('OK');
    mocks.redis.del.mockResolvedValue(1);
  });

  it('upserts all hierarchy tables inside a transaction', async () => {
    const service = new HierarchySyncService({
      dbClient: mocks.dbClient as never,
      getRedis: () => mocks.redis,
      logger: { info: mocks.loggerInfo, warn: mocks.loggerWarn, error: mocks.loggerError } as never,
      now: () => new Date('2026-03-23T10:00:00.000Z'),
    });

    const result = await service.sync(payload);

    expect(result).toEqual({ duplicate: false, synced: true });
    expect(mocks.dbClient.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.insert).toHaveBeenCalledTimes(4);
    expect(mocks.upsertCalls.map((entry) => entry.table)).toEqual([
      'tutorial_domains',
      'tutorial_subjects',
      'tutorial_topics',
      'tutorial_subtopics',
    ]);
    expect(mocks.redis.set).toHaveBeenNthCalledWith(1, 'sync-hierarchy:11111111-1111-1111-1111-111111111111', 'processing', { ex: 86_400, nx: true });
    expect(mocks.redis.set).toHaveBeenNthCalledWith(2, 'sync-hierarchy:11111111-1111-1111-1111-111111111111', 'processed', { ex: 86_400 });
    expect(mocks.redis.del).toHaveBeenCalledWith('hierarchy:domains');
    expect(mocks.redis.del).toHaveBeenCalledWith('hierarchy:subjects:44444444-4444-4444-4444-444444444444');
    expect(mocks.redis.del).toHaveBeenCalledWith('hierarchy:topics:33333333-3333-3333-3333-333333333333');
    expect(mocks.redis.del).toHaveBeenCalledWith('hierarchy:subtopics:22222222-2222-2222-2222-222222222222');
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'hierarchy.synced',
        subtopicId: payload.subtopicId,
        subtopicName: payload.subtopicName,
      })
    );
  });

  it('is idempotent for duplicate subtopic ids', async () => {
    mocks.redis.get.mockResolvedValueOnce('processed');

    const service = new HierarchySyncService({
      dbClient: mocks.dbClient as never,
      getRedis: () => mocks.redis,
      logger: { info: mocks.loggerInfo, warn: mocks.loggerWarn, error: mocks.loggerError } as never,
    });

    const result = await service.sync(payload);

    expect(result).toEqual({ duplicate: true, synced: false });
    expect(mocks.dbClient.transaction).not.toHaveBeenCalled();
    expect(mocks.redis.set).not.toHaveBeenCalled();
  });

  it('rolls back the idempotency key when the transaction fails', async () => {
    const tx = {
      insert: vi.fn((table: { tableName: string }) => {
        if (table.tableName === 'tutorial_topics') {
          throw new Error('db failure');
        }

        return {
          values: vi.fn(() => ({
            onConflictDoUpdate: vi.fn(() => ({
              returning: vi.fn(async () => [{ id: `${table.tableName}-db-id` }]),
            })),
          })),
        };
      }),
    };

    const failingDb = {
      transaction: vi.fn(async (callback: (tx: typeof tx) => Promise<unknown>) => callback(tx)),
    };

    const service = new HierarchySyncService({
      dbClient: failingDb as never,
      getRedis: () => mocks.redis,
      logger: { info: mocks.loggerInfo, warn: mocks.loggerWarn, error: mocks.loggerError } as never,
    });

    await expect(service.sync(payload)).rejects.toThrow('db failure');
    expect(mocks.redis.del).toHaveBeenCalledWith('sync-hierarchy:11111111-1111-1111-1111-111111111111');
  });
});
