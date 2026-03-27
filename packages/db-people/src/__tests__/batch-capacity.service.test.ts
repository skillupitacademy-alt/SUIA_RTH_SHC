import { describe, expect, it, vi } from 'vitest';

import { BatchCapacityService } from '../batch-capacity.service';

function makeDbSnapshot(capacity: number, enrolled: number) {
  const limit = vi.fn().mockResolvedValue([{ capacity, enrolled }]);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return {
    select,
  } as any;
}

describe('BatchCapacityService', () => {
  it('seeds, reserves, and releases using redis', async () => {
    const redis = {
      hgetall: vi.fn().mockResolvedValue({ capacity: 2, enrolled: 1 }),
      hset: vi.fn().mockResolvedValue(1),
      hincrby: vi.fn().mockResolvedValue(2),
    } as any;
    const service = new BatchCapacityService({ redis, db: makeDbSnapshot(2, 1) });

    await service.seed('batch-1', 2, 1);
    expect(redis.hset).toHaveBeenCalledWith('batch:capacity:batch-1', expect.objectContaining({ capacity: 2, enrolled: 1 }));

    await expect(service.reserveSlot('batch-1')).resolves.toBe(true);
    expect(redis.hincrby).toHaveBeenCalledWith('batch:capacity:batch-1', 'enrolled', 1);

    await service.releaseSlot('batch-1');
    expect(redis.hincrby).toHaveBeenCalledWith('batch:capacity:batch-1', 'enrolled', -1);
  });

  it('rejects reservation when the batch is full', async () => {
    const redis = {
      hgetall: vi.fn().mockResolvedValue({ capacity: 1, enrolled: 1 }),
      hset: vi.fn(),
      hincrby: vi.fn(),
    } as any;
    const service = new BatchCapacityService({ redis, db: makeDbSnapshot(1, 1) });

    await expect(service.reserveSlot('batch-full')).resolves.toBe(false);
    expect(redis.hincrby).not.toHaveBeenCalled();
  });

  it('falls back to the database snapshot when redis is unavailable', async () => {
    const service = new BatchCapacityService({ redis: null, db: makeDbSnapshot(10, 7) });

    await expect(service.getAvailable('batch-db')).resolves.toBe(3);
    await expect(service.reserveSlot('batch-db')).resolves.toBe(true);
  });
});
