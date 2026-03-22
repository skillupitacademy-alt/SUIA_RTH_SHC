import { SignatureError } from '@upstash/qstash';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyQStashRequest: vi.fn(),
  sync: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('../qstash', () => ({
  verifyQStashRequest: mocks.verifyQStashRequest,
}));

vi.mock('@/server/hierarchy-sync.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/hierarchy-sync.service')>();
  return {
    ...actual,
    HierarchySyncService: class {
      sync = mocks.sync;
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
    error: mocks.loggerError,
  },
}));

import { POST } from '../route';

const envelope = {
  id: '11111111-1111-1111-1111-111111111111',
  type: 'hierarchy.subtopic_added',
  correlationId: '22222222-2222-2222-2222-222222222222',
  source: 'skillhubcore-service',
  occurredAt: '2026-03-23T10:00:00.000Z',
  version: 1,
  data: {
    subtopicId: '33333333-3333-3333-3333-333333333333',
    subtopicName: 'Promises',
    subtopicSlug: 'promises',
    topicId: '44444444-4444-4444-4444-444444444444',
    topicName: 'Async Patterns',
    topicSlug: 'async-patterns',
    subjectId: '55555555-5555-5555-5555-555555555555',
    subjectName: 'JavaScript',
    subjectSlug: 'javascript',
    domainId: '66666666-6666-6666-6666-666666666666',
    domainName: 'Web Development',
    domainSlug: 'web-development',
    difficulties: ['simple', 'mixed'],
    publishedAt: '2026-03-23T10:00:00.000Z',
  },
};

describe('sync-hierarchy worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyQStashRequest.mockResolvedValue(JSON.stringify(envelope));
    mocks.sync.mockResolvedValue({ duplicate: false, synced: true });
  });

  it('returns 200 for a valid payload', async () => {
    const response = await POST(new Request('https://realtutorialhub.test/api/workers/sync-hierarchy', { method: 'POST' }));

    expect(response.status).toBe(200);
    expect(mocks.sync).toHaveBeenCalledWith(envelope.data);
  });

  it('returns 401 for an invalid QStash signature', async () => {
    mocks.verifyQStashRequest.mockRejectedValueOnce(new SignatureError('invalid signature'));

    const response = await POST(new Request('https://realtutorialhub.test/api/workers/sync-hierarchy', { method: 'POST' }));

    expect(response.status).toBe(401);
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed payloads', async () => {
    mocks.verifyQStashRequest.mockResolvedValueOnce(JSON.stringify({ data: {} }));

    const response = await POST(new Request('https://realtutorialhub.test/api/workers/sync-hierarchy', { method: 'POST' }));

    expect(response.status).toBe(400);
    expect(mocks.sync).not.toHaveBeenCalled();
  });
});
