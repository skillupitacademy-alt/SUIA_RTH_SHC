import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { SHCAuthService, ShcSessionInvalidError } from '../shc-auth.service';
import { AuditService } from '../audit.service';
import { TokenService } from '../token.service';
import { container } from '@/modules/core/container';

const state = vi.hoisted(() => ({
  sessions: [] as Array<{ id: string; userId: string; jwtFamily: string; platform: string; revokedAt: Date | null; deletedAt: Date | null }>,
  insert: vi.fn(), update: vi.fn(), clauses: [] as Array<{ sql: string; params: unknown[] }>,
}));
vi.mock('@quiz/db-people', async () => {
  const { users } = await import('../../../../../../packages/db-people/src/schema/users');
  const { ssoSessions } = await import('../../../../../../packages/db-people/src/schema/sso-sessions');
  return { users, ssoSessions, db: {
    select: () => ({ from: (table: typeof ssoSessions) => ({ where: (clause: Parameters<PgDialect['sqlToQuery']>[0]) => ({
      limit: async () => {
        if (getTableName(table) === 'users') return [{ id: 'admin-1', email: 'admin@example.test', passwordHash: 'hash', role: 'admin', isActive: true }];
        const query = new PgDialect().sqlToQuery(clause);
        state.clauses.push(query);
        return state.sessions.filter(row => query.params.includes(row.userId) && query.params.includes(row.jwtFamily)
          && query.params.includes(row.platform) && row.revokedAt === null && row.deletedAt === null);
      },
    }) }) }),
    insert: () => ({ values: state.insert }),
    update: () => ({ set: (values: { revokedAt: Date }) => ({ where: async (clause: Parameters<PgDialect['sqlToQuery']>[0]) => {
      await state.update();
      const query = new PgDialect().sqlToQuery(clause);
      state.clauses.push(query);
      for (const row of state.sessions) {
        if (query.params.includes(row.userId) && query.params.includes(row.jwtFamily) && query.params.includes(row.platform)) row.revokedAt = values.revokedAt;
      }
    } }) }),
  } };
});
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn(async () => true) } }));
const secret = new TextEncoder().encode('shc-session-test-disposable-32bytes!');
const tokenService = new TokenService(secret, secret, secret);
const audit = { log: vi.fn() };
const previousToken = container.get(TokenService);
const previousAudit = container.get(AuditService);

describe('SHC persisted credential revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks(); state.sessions.length = 0; state.clauses.length = 0;
    state.insert.mockImplementation(async row => state.sessions.push({ ...row, id: 'session-' + state.sessions.length, revokedAt: null, deletedAt: null }));
    state.update.mockResolvedValue(undefined);
    container.register(TokenService, tokenService); container.register(AuditService, audit as never);
  });
  afterEach(() => { container.register(TokenService, previousToken); container.register(AuditService, previousAudit); });
  it('persists the exact refresh digest before issuing usable access credentials', async () => {
    const service = new SHCAuthService();
    const session = await service.login('admin@example.test', 'disposable-password');
    const payload = await tokenService.verifyAdminAccessToken(session.accessToken, { audience: 'shc-admin' });
    expect(payload.sessionBinding).toBe(await tokenService.hashToken(session.refreshToken));
    expect(state.sessions[0]).toMatchObject({ userId: 'admin-1', platform: 'skillhubcore', jwtFamily: payload.sessionBinding });
    expect(JSON.stringify(state.sessions)).not.toContain(session.refreshToken);
    await expect(service.requireSession(payload)).resolves.toBeUndefined();
    expect(state.clauses.at(-1)?.sql).toContain('"revoked_at" is null');
    expect(state.clauses.at(-1)?.sql).toContain('"deleted_at" is null');
  });
  it('rejects old access and preserves another active session and new login', async () => {
    const service = new SHCAuthService();
    const first = await service.login('admin@example.test', 'disposable-password');
    const second = await service.login('admin@example.test', 'disposable-password');
    const a = await tokenService.verifyAdminAccessToken(first.accessToken, { audience: 'shc-admin' });
    const b = await tokenService.verifyAdminAccessToken(second.accessToken, { audience: 'shc-admin' });
    await service.logout(a);
    await expect(service.requireSession(a)).rejects.toBeInstanceOf(ShcSessionInvalidError);
    await expect(service.requireSession(b)).resolves.toBeUndefined();
    await service.logout(a);
    const fresh = await service.login('admin@example.test', 'disposable-password');
    await expect(service.requireSession(await tokenService.verifyAdminAccessToken(fresh.accessToken, { audience: 'shc-admin' }))).resolves.toBeUndefined();
  });
  it('rejects unbound legacy, wrong-owner, wrong-platform and deleted sessions', async () => {
    const service = new SHCAuthService();
    await expect(service.requireSession({ userId: 'admin-1' })).rejects.toBeInstanceOf(ShcSessionInvalidError);
    const session = await service.login('admin@example.test', 'disposable-password');
    const payload = await tokenService.verifyAdminAccessToken(session.accessToken, { audience: 'shc-admin' });
    await expect(service.requireSession({ ...payload, userId: 'other' })).rejects.toBeInstanceOf(ShcSessionInvalidError);
    state.sessions[0].platform = 'skillup';
    await expect(service.requireSession(payload)).rejects.toBeInstanceOf(ShcSessionInvalidError);
    state.sessions[0].platform = 'skillhubcore'; state.sessions[0].deletedAt = new Date();
    await expect(service.requireSession(payload)).rejects.toBeInstanceOf(ShcSessionInvalidError);
  });
  it('propagates persistence and revocation outages', async () => {
    const service = new SHCAuthService();
    state.insert.mockRejectedValueOnce(new Error('isolated persistence outage'));
    await expect(service.login('admin@example.test', 'disposable-password')).rejects.toThrow('Administrator session storage unavailable');
    state.update.mockRejectedValueOnce(new Error('isolated revocation outage'));
    await expect(service.logout({ userId: 'admin-1', sessionBinding: 'a'.repeat(64) })).rejects.toThrow('Administrator session storage unavailable');
  });
});
