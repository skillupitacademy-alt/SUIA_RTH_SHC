import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  current: vi.fn(), session: vi.fn(), sessions: vi.fn(), token: vi.fn(), refresh: vi.fn(), verify: vi.fn(),
}));
vi.mock('@/middleware/internal-auth.middleware', () => ({ validateRequest: () => ({ context: {
  userId:'user-a', brand:'skillup', roles:['student'], correlationId:'test', authMode:'gateway',
} }) }));
vi.mock('@/modules/auth/brand-db', () => ({ getAuthBrandContext: () => ({db:{},tables:{refreshTokens:{}}}), shouldUseBrandBinding: () => false }));
vi.mock('@/modules/core/container', () => ({ container: { get: (type: {name:string}) => {
  if (type.name === 'UserRepository') return {findActiveUserWithRoles:state.current};
  if (type.name === 'TokenRepository') return {findValidSession:state.session,getUserSessions:state.sessions};
  return {getAccessToken:state.token,getRefreshToken:state.refresh,hashToken:async()=> 'hash',verifyUserAccessToken:state.verify};
} } }));
import { getAuthContext } from '../auth-context';

beforeEach(() => {
  vi.clearAllMocks();
  state.current.mockResolvedValue({id:'user-a',email:'fixture@example.invalid',isBlocked:false,deletedAt:null,roles:['student']});
  state.session.mockResolvedValue({id:'session-a'});
  state.sessions.mockResolvedValue([{id:'session-a'}]);
  state.token.mockReturnValue('access');
  state.refresh.mockReturnValue('refresh');
  state.verify.mockResolvedValue({userId:'user-a',brand:'skillup',sessionBinding:'hash'});
});
const request = () => new NextRequest('http://localhost:3000/api/auth/profile');
describe('backend current learner authority', () => {
  it('admits an eligible learner with its own persisted session', async () => {
    expect((await getAuthContext(request()))?.userId).toBe('user-a');
    expect(state.session).toHaveBeenCalledWith({userId:'user-a',refreshTokenHash:'hash'});
  });
  it.each([null,{isBlocked:true,deletedAt:null,roles:['student']},{isBlocked:false,deletedAt:new Date(),roles:['student']},{isBlocked:false,deletedAt:null,roles:[]}])('rejects missing, disabled, deleted or role-less accounts', async current => {
    state.current.mockResolvedValue(current);
    expect(await getAuthContext(request())).toBeNull();
  });
  it('rejects a revoked or foreign refresh session', async () => {
    state.session.mockResolvedValue(null);
    expect(await getAuthContext(request())).toBeNull();
  });
  it('rejects an access-only request even while another persisted session remains active', async () => {
    state.refresh.mockReturnValue(undefined);
    expect(await getAuthContext(request())).toBeNull();
    expect(state.sessions).not.toHaveBeenCalled();
  });
  it.each([undefined,'different-device-hash'])('rejects an unbound or cross-device access credential', async sessionBinding => {
    state.verify.mockResolvedValue({userId:'user-a',brand:'skillup',sessionBinding});
    expect(await getAuthContext(request())).toBeNull();
    expect(state.session).not.toHaveBeenCalled();
  });
  it('preserves trusted service calls while checking current account permissions', async () => {
    state.token.mockReturnValue(undefined);
    expect((await getAuthContext(request()))?.roles).toEqual(['student']);
    expect(state.session).not.toHaveBeenCalled();
  });
  it('returns a sanitized service-unavailable error on authority outage', async () => {
    state.current.mockRejectedValue(new Error('private SQL failure'));
    await expect(getAuthContext(request())).rejects.toMatchObject({status:503,message:'Authentication unavailable'});
  });
});
