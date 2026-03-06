import { describe, expect, it, vi } from 'vitest';

import { AdminUserEngine } from '../admin.user.engine';

describe('AdminUserEngine', () => {
  const repository = {
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleBlockStatus: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const engine = new AdminUserEngine(repository as any, audit as any);

  it('maps online status and supports update/delete/toggle operations', async () => {
    const now = new Date();
    repository.findAll.mockResolvedValue({
      users: [
        { id: 'u1', isBlocked: false, lastActiveAt: new Date(now.getTime() - 60 * 1000) },
        { id: 'u2', isBlocked: false, lastActiveAt: new Date(now.getTime() - 3 * 60 * 1000) },
        { id: 'u3', isBlocked: true, lastActiveAt: null },
        { id: 'u4', isBlocked: false, lastActiveAt: new Date(now.getTime() - 8 * 60 * 1000) },
      ],
      total: 4,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    repository.update.mockResolvedValue({ id: 'u1', isBlocked: true });
    repository.delete.mockResolvedValue({ id: 'u2' });
    repository.toggleBlockStatus.mockResolvedValue([{ id: 'u3', isBlocked: false }]);

    const list = await engine.getUsers(1, 10, 'active', { status: 'online' });
    expect(list.users[0].status).toBe('online');
    expect(list.users[1].status).toBe('idle');
    expect(list.users[2].status).toBe('blocked');
    expect(list.users[3].status).toBe('offline');

    await expect(engine.updateUser('u1', { isBlocked: true }, 'admin-1')).resolves.toEqual({ id: 'u1', isBlocked: true });
    await expect(engine.deleteUser('u2', 'admin-1')).resolves.toEqual({ id: 'u2' });
    await expect(engine.toggleBlockStatus('u3', false, 'admin-1')).resolves.toEqual([{ id: 'u3', isBlocked: false }]);

    expect(audit.log).toHaveBeenCalledTimes(3);
  });
});
