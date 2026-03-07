import { beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshTokensFindFirst, updateWhereMock, updateSetMock, updateMock, insertValuesMock, insertMock } = vi.hoisted(() => {
  const _updateWhereMock = vi.fn();
  const _updateSetMock = vi.fn(() => ({ where: _updateWhereMock }));
  const _insertValuesMock = vi.fn();
  return {
    refreshTokensFindFirst: vi.fn(),
    updateWhereMock: _updateWhereMock,
    updateSetMock: _updateSetMock,
    updateMock: vi.fn(() => ({ set: _updateSetMock })),
    insertValuesMock: _insertValuesMock,
    insertMock: vi.fn(() => ({ values: _insertValuesMock })),
  };
});

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    insert: insertMock,
    update: updateMock,
    query: {
      refreshTokens: { findFirst: refreshTokensFindFirst },
    },
  },
  refreshTokens: {
    id: 'refreshTokens.id',
    userId: 'refreshTokens.userId',
    token: 'refreshTokens.token',
    revoked: 'refreshTokens.revoked',
    expiresAt: 'refreshTokens.expiresAt',
    lastActiveAt: 'refreshTokens.lastActiveAt',
  },
}));

import { TokenRepository } from '../token.repository';

describe('TokenRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshTokensFindFirst.mockResolvedValue({ id: 'rt1' });
  });

  it('covers create/revoke/touch/find paths', async () => {
    const repo = new TokenRepository();
    await expect(repo.createRefreshToken({ userId: 'u1', token: 'hash', expiresAt: new Date() })).resolves.toBeUndefined();
    await expect(repo.revokeToken('hash')).resolves.toBeUndefined();
    await expect(repo.revokeById('rt1')).resolves.toBeUndefined();
    await expect(repo.revokeAll('u1')).resolves.toBeUndefined();
    await expect(repo.touchSession('u1')).resolves.toBeUndefined();
    await expect(repo.findValidToken('u1', 'hash')).resolves.toEqual({ id: 'rt1' });
    await expect(repo.findByHash('hash')).resolves.toEqual({ id: 'rt1' });

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(4);
    expect(refreshTokensFindFirst).toHaveBeenCalledTimes(2);
  });
});


