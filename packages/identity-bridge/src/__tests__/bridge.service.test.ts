import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserIdentityBridgeService } from '../UserIdentityBridgeService';

function createMockDb() {
  const selectLimit = vi.fn();
  const selectWhere = vi.fn(() => ({ limit: selectLimit }));
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const insertReturning = vi.fn();
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const updateWhere = vi.fn();
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  return {
    select,
    insert,
    update,
    __mocks: {
      selectLimit,
      selectWhere,
      selectFrom,
      insertReturning,
      insertValues,
      updateWhere,
      updateSet,
    },
  };
}

describe('UserIdentityBridgeService', () => {
  let db: ReturnType<typeof createMockDb>;
  let service: UserIdentityBridgeService;

  beforeEach(() => {
    db = createMockDb();
    service = new UserIdentityBridgeService(db as any);
  });

  it('syncUser creates a new shadow user', async () => {
    db.__mocks.selectLimit.mockResolvedValue([]);
    db.__mocks.insertReturning.mockResolvedValue([{ id: 'shadow-123' }]);

    const result = await service.syncUser({
      externalId: 'brand-1',
      externalBrand: 'realtutorialhub',
      email: 'test@example.com',
      platform: 'realtutorialhub',
    });

    expect(result.created).toBe(true);
    expect(result.shadowUserId).toBe('shadow-123');
    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(db.__mocks.insertValues).toHaveBeenCalled();
  });

  it('syncUser reuses an existing shadow user', async () => {
    db.__mocks.selectLimit.mockResolvedValue([{ id: 'shadow-999', email: 'test@example.com' }]);
    db.__mocks.updateWhere.mockResolvedValue(undefined);

    const result = await service.syncUser({
      externalId: 'brand-1',
      externalBrand: 'realtutorialhub',
      email: 'test@example.com',
      platform: 'realtutorialhub',
    });

    expect(result.created).toBe(false);
    expect(result.shadowUserId).toBe('shadow-999');
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it('getShadowUserId returns an id when found and null when missing', async () => {
    db.__mocks.selectLimit
      .mockResolvedValueOnce([{ id: 'shadow-abc' }])
      .mockResolvedValueOnce([]);

    await expect(service.getShadowUserId('brand-1', 'realtutorialhub')).resolves.toBe('shadow-abc');
    await expect(service.getShadowUserId('brand-2', 'skillup')).resolves.toBeNull();
  });
});
