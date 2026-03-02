import { vi } from 'vitest';

export const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  hget: vi.fn(),
  hset: vi.fn(),
  hgetall: vi.fn(),
  pipeline: vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue([]),
  }),
};

vi.mock('ioredis', () => ({
  default: vi.fn().mockReturnValue(mockRedis),
}));
