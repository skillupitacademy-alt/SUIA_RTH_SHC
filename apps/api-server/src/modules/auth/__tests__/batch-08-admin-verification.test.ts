import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiResponse } from '@/lib/api-response';
import * as metrics from '@/lib/metrics';
import { container } from '@/modules/core/container';
import { TokenService } from '../token.service';
import { requireAdminRouteAccess, verifyAdminOrInfraToken } from '../admin-audience.util';
import { _verifyActiveAccount, _verifyAdmin } from '../rbac.service';
import { SHCAuthService, UserNotFoundError } from '../shc-auth.service';

vi.mock('../rbac.service', () => ({ _verifyActiveAccount: vi.fn(async () => true), _verifyAdmin: vi.fn(async () => true) }));
const key = new TextEncoder().encode('admin-helper-disposable-key-32bytes!');
const tokens = new TokenService(key, key, key);
const previous = container.get(TokenService);
async function token(brand: 'skillup' | 'skillhubcore', aud: 'admin' | 'shc-admin' | 'infra' | 'user', expiration?: string, signer = tokens) {
  return signer.generateAccessToken({ userId: 'admin', roles: ['admin'], brand, tokenType: aud === 'user' ? 'user' : 'admin', isAdmin: aud !== 'user', aud }, expiration);
}
function req(value?: string, portal?: string, cookie?: string, path = '/api/admin/users') {
  const headers = new Headers(); if (value) headers.set('authorization', `Bearer ${value}`); if (portal) headers.set('x-portal-identity', portal); if (cookie) headers.set('cookie', cookie);
  return new NextRequest(`https://example.test${path}`, { headers });
}
async function status(promise: Promise<unknown>) { try { await promise; return 200; } catch (error) { return ApiResponse.error(error).status; } }
describe('admin credential verification boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.register(TokenService, tokens);
    vi.spyOn(SHCAuthService.prototype, 'me').mockResolvedValue({
      id: 'admin', email: 'fixture@example.invalid', role: 'admin',
      platform: 'skillhubcore', isActive: true, createdAt: new Date(),
    });
  });
  afterEach(() => { vi.restoreAllMocks(); container.register(TokenService, previous); });
  it.each(['missing', 'malformed', 'expired', 'wrong-signature', 'wrong-audience'] as const)('rejects %s before RBAC', async kind => {
    const other = new TextEncoder().encode('wrong-admin-signature-key-32bytes');
    const value = kind === 'missing' ? undefined : kind === 'malformed' ? 'invalid' : await token('skillup', kind === 'wrong-audience' ? 'user' : 'admin', kind === 'expired' ? '-1h' : undefined, kind === 'wrong-signature' ? new TokenService(other, other, other) : tokens);
    let error: unknown; try { await requireAdminRouteAccess(req(value)); } catch (e) { error = e; }
    const response = ApiResponse.error(error); expect(response.status).toBe(401); expect(await response.json()).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(_verifyAdmin).not.toHaveBeenCalled(); expect(_verifyActiveAccount).not.toHaveBeenCalled();
  });
  it.each([['skillup', 'admin', undefined], ['skillup', 'admin', 'unknown'], ['skillhubcore', 'shc-admin', 'shc-admin'], ['skillup', 'infra', 'infrastructure']] as const)('preserves %s/%s principal and portal %s', async (brand, aud, portal) => {
    const result = await requireAdminRouteAccess(req(await token(brand, aud), portal)); expect(result.userId).toBe('admin');
  });
  it('preserves scoped admin cookie precedence and bearer fallback', async () => {
    const valid = await token('skillup', 'admin');
    expect((await verifyAdminOrInfraToken(req('invalid', undefined, `admin_accessToken=${valid}`))).payload.userId).toBe('admin');
    expect(await status(verifyAdminOrInfraToken(req(valid, undefined, 'admin_accessToken=invalid')))).toBe(401);
    expect((await verifyAdminOrInfraToken(req(valid))).payload.userId).toBe('admin');
  });
  it('preserves forbidden authorization after a verified principal', async () => {
    vi.mocked(_verifyAdmin).mockResolvedValueOnce(false);
    expect(await status(requireAdminRouteAccess(req(await token('skillup', 'admin'))))).toBe(403);
    expect(await status(requireAdminRouteAccess(req(await token('skillhubcore', 'shc-admin'), 'shc-admin', undefined, '/api/analytics/admin/data')))).toBe(403);
  });
  it('does not select an infrastructure cookie under admin extraction scope', async () => {
    const valid = await token('skillup', 'infra');
    expect(await status(verifyAdminOrInfraToken(req(undefined, 'infrastructure', `infra_accessToken=${valid}`)))).toBe(401);
  });
  it('denies a role-ineligible SHC principal without changing the 403 contract', async () => {
    const value = await tokens.generateAccessToken({ userId: 'admin', roles: ['student'], brand: 'skillhubcore', tokenType: 'admin', isAdmin: true, aud: 'shc-admin' });
    expect(await status(requireAdminRouteAccess(req(value, 'shc-admin')))).toBe(403);
  });
  it.each([
    { role: 'admin', isActive: false },
    { role: 'student', isActive: true },
    { role: 'faculty', isActive: true },
  ])('denies current SHC account eligibility %j despite stale admin claims', async account => {
    vi.mocked(SHCAuthService.prototype.me).mockResolvedValueOnce({
      id: 'admin', email: 'fixture@example.invalid', platform: 'skillhubcore',
      createdAt: new Date(), ...account,
    });
    expect(await status(requireAdminRouteAccess(req(await token('skillhubcore', 'shc-admin'), 'shc-admin')))).toBe(403);
  });
  it('returns 401 for a deleted SHC account', async () => {
    vi.mocked(SHCAuthService.prototype.me).mockRejectedValueOnce(new UserNotFoundError('Missing'));
    expect(await status(requireAdminRouteAccess(req(await token('skillhubcore', 'shc-admin'), 'shc-admin')))).toBe(401);
  });
  it('returns 503 when the current SHC account authority is unavailable', async () => {
    vi.mocked(SHCAuthService.prototype.me).mockRejectedValueOnce(new Error('private database detail'));
    expect(await status(requireAdminRouteAccess(req(await token('skillhubcore', 'shc-admin'), 'shc-admin')))).toBe(503);
  });
  it('removes stale super-admin privileges after current account demotion', async () => {
    const signed = await tokens.generateAccessToken({ userId: 'admin', roles: ['super_admin'], brand: 'skillhubcore', tokenType: 'admin', isAdmin: true, aud: 'shc-admin' });
    expect((await requireAdminRouteAccess(req(signed, 'shc-admin'))).roles).toEqual(['admin']);
  });
  it('does not elevate an admin token when the current account is super-admin', async () => {
    const account = await SHCAuthService.prototype.me('admin');
    vi.mocked(SHCAuthService.prototype.me).mockResolvedValueOnce({ ...account, role: 'super_admin' });
    expect((await requireAdminRouteAccess(req(await token('skillhubcore', 'shc-admin'), 'shc-admin'))).roles).toEqual(['admin']);
  });
  it('preserves super-admin privileges when both token and current account authorize them', async () => {
    const account = await SHCAuthService.prototype.me('admin');
    vi.mocked(SHCAuthService.prototype.me).mockResolvedValueOnce({ ...account, role: 'super_admin' });
    const signed = await tokens.generateAccessToken({ userId: 'admin', roles: ['super_admin'], brand: 'skillhubcore', tokenType: 'admin', isAdmin: true, aud: 'shc-admin' });
    expect((await requireAdminRouteAccess(req(signed, 'shc-admin'))).roles).toEqual(['super_admin']);
  });
  it.each(['wrong-audience-admin', 'wrong-class-admin-audience'] as const)('rejects independently signed %s', async kind => {
    const { SignJWT } = await import('jose');
    const adminClass = kind === 'wrong-audience-admin';
    const signed = await new SignJWT({ userId: 'admin', originalUserId: 'admin', shadowUserId: 'admin', roles: [adminClass ? 'admin' : 'student'], brand: 'skillup', tokenType: adminClass ? 'admin' : 'user', isAdmin: adminClass })
      .setProtectedHeader({ alg: 'HS256' }).setAudience(adminClass ? 'user' : 'admin').setExpirationTime('5m').sign(key);
    let failure: unknown; try { await requireAdminRouteAccess(req(signed)); } catch (error) { failure = error; }
    const response = ApiResponse.error(failure); expect(response.status).toBe(401); expect(await response.json()).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(_verifyAdmin).not.toHaveBeenCalled(); expect(_verifyActiveAccount).not.toHaveBeenCalled();
  });
  it('does not relabel success-metric failure as credential rejection', async () => {
    vi.spyOn(metrics, 'recordCounter').mockImplementationOnce(() => { throw new Error('metric outage'); });
    expect(await status(verifyAdminOrInfraToken(req(await token('skillup', 'admin'))))).toBe(500);
  });
  it('surfaces failure-metric outage as operational error after rejected verification', async () => {
    vi.spyOn(metrics, 'recordCounter').mockImplementationOnce(() => { throw new Error('metric outage'); });
    expect(await status(verifyAdminOrInfraToken(req('invalid')))).toBe(500);
  });
  it('does not translate service resolution failure into 401', async () => {
    vi.spyOn(container, 'get').mockImplementationOnce(() => { throw new Error('service unavailable'); });
    expect(await status(verifyAdminOrInfraToken(req('credential')))).toBe(500);
  });
  it('does not translate later RBAC errors into 401', async () => {
    vi.mocked(_verifyAdmin).mockRejectedValueOnce(new Error('account store failure'));
    expect(await status(requireAdminRouteAccess(req(await token('skillup', 'admin'))))).toBe(500);
  });
});
