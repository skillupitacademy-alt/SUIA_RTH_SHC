import { describe, it, expect } from 'vitest';
import { QueueService } from '../queue.service';

describe('QueueService missing token branch (line ~33)', () => {
  it('falls back when QSTASH_TOKEN is missing', async () => {
    // Ensure token is empty for this test
    process.env.QSTASH_TOKEN = '';
    const service = QueueService.getInstance();
    const res = await service.enqueue('test-job', { foo: 'bar' });
    expect(res.success).toBe(false);
  });
});
