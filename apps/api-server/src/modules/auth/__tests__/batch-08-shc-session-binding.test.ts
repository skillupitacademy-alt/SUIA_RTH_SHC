import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { SHCAuthService } from '../shc-auth.service';
import { AuditService } from '../audit.service';
import { TokenRepository } from '../repositories/token.repository';
import { TokenService } from '../token.service';
import { container } from '@/modules/core/container';

vi.mock('@quiz/db-people', () => ({ users: { email: 'email', platform: 'platform', deletedAt: 'deleted' }, db: {
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 'admin-1', email: 'admin@example.test', passwordHash: 'hash', role: 'admin', isActive: true }] }) }) }),
} }));
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn(async () => true) } }));
const secret = new TextEncoder().encode('shc-session-test-disposable-32bytes!');
const tokenService = new TokenService(secret, secret, secret);
const repo = { createRefreshToken: vi.fn(), revokeAll: vi.fn() };
const audit = { log: vi.fn() };
const previousToken = container.get(TokenService);
const previousRepo = container.get(TokenRepository);
const previousAudit = container.get(AuditService);

describe('SHC issued credential and logout repository seam', () => {
  beforeEach(() => { vi.clearAllMocks(); container.register(TokenService, tokenService); container.register(TokenRepository, repo as never); container.register(AuditService, audit as never); });
  afterEach(() => { container.register(TokenService, previousToken); container.register(TokenRepository, previousRepo); container.register(AuditService, previousAudit); });
  it('issues a refresh credential without inserting a corresponding row and calls revocation by subject on logout', async () => {
    const service = new SHCAuthService();
    const session = await service.login('admin@example.test', 'disposable-password');
    expect(session.refreshToken).toBeTruthy();
    expect(repo.createRefreshToken).not.toHaveBeenCalled();
    await service.logout('admin-1');
    expect(repo.revokeAll).toHaveBeenCalledExactlyOnceWith('admin-1');
  });
  it('uses the real token repository on isolated rows without creating a row for the issued credential', async () => {
    const rows = [{ userId: 'admin-1', token: 'old-row', revoked: false }, { userId: 'other', token: 'other-row', revoked: false }];
    const insert = vi.fn(() => ({ values: vi.fn(async () => undefined) }));
    const where = vi.fn(async (clause: any) => {
      const params = new PgDialect().sqlToQuery(clause).params;
      for (const row of rows) if (params.includes(row.userId)) row.revoked = true;
    });
    const update = vi.fn(() => ({ set: () => ({ where }) }));
    const actual = new TokenRepository({ insert, update } as never);
    container.register(TokenRepository, actual);
    const service = new SHCAuthService();
    const session = await service.login('admin@example.test', 'disposable-password');
    expect(session.refreshToken).toBeTruthy(); expect(insert).not.toHaveBeenCalled();
    await service.logout('admin-1');
    expect(rows[0]?.revoked).toBe(true); expect(rows[1]?.revoked).toBe(false); expect(update).toHaveBeenCalledTimes(1);
  });
  it('absorbs repository revocation failure at the service boundary', async () => {
    repo.revokeAll.mockRejectedValueOnce(new Error('isolated repository outage'));
    await expect(new SHCAuthService().logout('admin-1')).resolves.toBeUndefined();
  });
});
