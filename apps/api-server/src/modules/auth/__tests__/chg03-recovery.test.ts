import { beforeEach, describe, expect, it, vi } from 'vitest';
const h = vi.hoisted(() => ({ sync: vi.fn(), link: vi.fn(), audit: vi.fn(), send: vi.fn(), event: vi.fn() }));
vi.mock('@quiz/identity-bridge', () => ({ UserIdentityBridgeService: class { syncUser = h.sync; updateShadowUserId = h.link; } }));
vi.mock('@/modules/email/EmailService', () => ({ EmailService: { sendVerificationEmail: h.send } }));
vi.mock('@/lib/event-bus', () => ({ eventBus: { emit: h.event, emitEvent: h.event } }));
const brandDb = { transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({}) };
vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: () => ({ db: brandDb, tables: { users: {} } }),
  shouldUseBrandBinding: () => false,
}));
import { SignupService } from '../signup.service';
import { LoginService } from '../login.service';
const learnerId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const user = { id: learnerId, email: 'learner@example.test', passwordHash: 'synthetic', isBlocked: false, shadowUserId: null as string | null, userRoles: [{ role: { name: 'student' } }] };
const repository = {
  findByEmail: vi.fn(), create: vi.fn(), assignRole: vi.fn(), createToken: vi.fn(),
  findWithDetails: vi.fn(), updateLastActive: vi.fn(),
};
const password = { hash: vi.fn(), compare: vi.fn() };
const security = { isAccountLocked: vi.fn(), trackLoginAttempt: vi.fn() };
const token = { generateAccessToken: vi.fn(), generateRefreshToken: vi.fn(), hashToken: vi.fn() };
const tokenRepo = { createRefreshToken: vi.fn() };
const login = () => new LoginService(repository as never, tokenRepo as never, { log: h.audit } as never, password as never, security as never, token as never);

beforeEach(() => {
  vi.resetAllMocks();
  repository.create.mockResolvedValue({ ...user });
  repository.findWithDetails.mockResolvedValue({ ...user });
  password.hash.mockResolvedValue('synthetic-hash'); password.compare.mockResolvedValue(true);
  security.isAccountLocked.mockResolvedValue(false);
  token.generateAccessToken.mockResolvedValue('synthetic-access'); token.generateRefreshToken.mockResolvedValue('synthetic-refresh'); token.hashToken.mockResolvedValue('synthetic-hash');
  h.sync.mockResolvedValue({ shadowUserId: personId, created: false });
});

describe('CHG-03 existing signup/login reconciliation', () => {
  it('retains signup success after projection failure and repairs the identity on a later login', async () => {
    h.sync.mockRejectedValueOnce(new Error('private connection configuration'));
    const signup = new SignupService(repository as never, { log: h.audit } as never, password as never);
    const result = await signup.signup(user.email, 'synthetic-password', 'Fixture', '192.0.2.1', 'skillup');
    expect(result.id).toBe(learnerId);
    expect(h.send).toHaveBeenCalledTimes(1);
    const failure = h.audit.mock.calls.find(call => call[0].action === 'identity_bridge_sync_failed')?.[0];
    expect(failure.metadata).toEqual({ code: 'PROJECTION_UNAVAILABLE', brand: 'skillup', recovery: 'LOGIN_RECONCILIATION_REQUIRED' });
    expect(JSON.stringify(failure)).not.toContain('private connection');
    expect(h.event.mock.calls.some(call => call[0] === 'identity.bridge.retry_requested')).toBe(false);
    await login().login(user.email, 'synthetic-password', '192.0.2.1', 'skillup', undefined, { purpose: 'learner' });
    expect(h.link).toHaveBeenCalledWith(brandDb, expect.anything(), learnerId, personId, 'skillup');
    expect(token.generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({ userId: learnerId, shadowUserId: personId, brand: 'skillup' }));
  });

  it('denies token issuance when linking fails and retries without substituting learner UUID', async () => {
    h.link.mockRejectedValueOnce(new Error('controlled link failure'));
    await expect(login().login(user.email, 'synthetic-password', '192.0.2.1', 'skillup')).rejects.toThrow('controlled link failure');
    expect(token.generateAccessToken).not.toHaveBeenCalled();
    expect(h.audit.mock.calls.some(call => call[0].action === 'login_success')).toBe(false);
    await login().login(user.email, 'synthetic-password', '192.0.2.1', 'skillup');
    expect(h.sync).toHaveBeenCalledTimes(2);
    expect(token.generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({ shadowUserId: personId }));
  });

  it('revalidates an existing link and fails closed on bridge conflict', async () => {
    repository.findWithDetails.mockResolvedValue({ ...user, shadowUserId: personId });
    h.sync.mockRejectedValueOnce(new Error('controlled mapping conflict'));
    await expect(login().login(user.email, 'synthetic-password', '192.0.2.1', 'skillup')).rejects.toThrow('controlled mapping conflict');
    expect(h.sync).toHaveBeenCalledWith(expect.objectContaining({ externalId: learnerId, expectedShadowUserId: personId, platform: 'skillup' }));
    expect(token.generateAccessToken).not.toHaveBeenCalled();
  });
});
