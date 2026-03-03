import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QueueService } from '../queue.service';

describe('QueueService missing token branch (line 33)', () => {
  beforeEach(() => {
    vi.resetModules();
    (QueueService as any).instance = undefined;
    delete process.env.QSTASH_TOKEN;
  });

  it('returns success false when QSTASH_TOKEN missing', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
    const queue = QueueService.getInstance();
    const res = await queue.enqueue('job', { foo: 'bar' });
    expect(res).toEqual({ success: false });
  });
});
