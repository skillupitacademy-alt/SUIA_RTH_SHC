import { describe, it, expect, vi } from 'vitest';
import { CacheService } from '../cache.service';

describe('CacheService.getUsage info/execute branches', () => {
  beforeEach(() => {
    // reset singleton between tests
    (CacheService as any).instance = undefined;
  });

  it('reads memory stats from info() string response', async () => {
    const mockRedis = {
      info: vi.fn().mockResolvedValue('used_memory_human: 1.2M\r\nused_memory: 123456\r\n'),
      dbsize: vi.fn().mockResolvedValue(7),
    } as any;

    const cache = CacheService.getInstance({ redis: mockRedis });
    const usage = await cache.getUsage();

    expect(usage.configured).toBe(true);
    expect(usage.keys).toBe(7);
    expect(usage.memory).toBe('1.2M');
    expect(usage.memoryBytes).toBe(123456);
  });

  it('falls back to execute() when info is missing', async () => {
    const mockRedis = {
      execute: vi.fn().mockResolvedValue({ used_memory_human: '512K', used_memory: '512000' }),
      dbsize: vi.fn().mockResolvedValue(0),
    } as any;

    const cache = CacheService.getInstance({ redis: mockRedis });
    const usage = await cache.getUsage();

    expect(mockRedis.execute).toHaveBeenCalled();
    expect(usage.memory).toBe('512K');
    expect(usage.memoryBytes).toBe(512000);
  });
});
