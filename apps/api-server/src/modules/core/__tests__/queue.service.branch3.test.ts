import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QueueService } from '../queue.service';

describe('QueueService enqueue branches', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    (QueueService as any).instance = undefined; // reset singleton between tests
  });

  it('returns success true when fetch succeeds', async () => {
    process.env.QSTASH_TOKEN = 'token';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
    process.env.QSTASH_URL = 'https://qstash.test/publish/';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'm-123' }),
    });
    (globalThis as any).fetch = fetchMock;

    const queue = QueueService.getInstance();
    const res = await queue.enqueue('job', { foo: 'bar' }, { delay: 5, retries: 2 });

    expect(res).toEqual({ success: true, messageId: 'm-123' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns success false when fetch returns non-ok', async () => {
    process.env.QSTASH_TOKEN = 'token';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
    process.env.QSTASH_URL = 'https://qstash.test/publish/';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'fail',
    });
    (globalThis as any).fetch = fetchMock;

    const queue = QueueService.getInstance();
    const res = await queue.enqueue('job', { foo: 'bar' });

    expect(res).toEqual({ success: false });
  });
});
