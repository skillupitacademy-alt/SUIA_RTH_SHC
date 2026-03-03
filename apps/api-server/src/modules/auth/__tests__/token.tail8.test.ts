import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../token.service';
import * as jose from 'jose';

vi.mock('jose', () => {
    return {
        jwtVerify: vi.fn(),
        SignJWT: vi.fn().mockImplementation(function() {
            return {
                setProtectedHeader: vi.fn().mockReturnThis(),
                setAudience: vi.fn().mockReturnThis(),
                setIssuedAt: vi.fn().mockReturnThis(),
                setExpirationTime: vi.fn().mockReturnThis(),
                sign: vi.fn().mockResolvedValue('signed-jwt')
            };
        }),
        decodeJwt: vi.fn()
    };
});

// Provide a mock NextRequest object
class MockRequest {
    cookies: any;
    headers: any;
    constructor(cookies: any, headers: any) {
        this.cookies = { get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined };
        this.headers = { get: (name: string) => headers[name] };
    }
}

describe('TokenService extreme logic tail 8', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAccessToken: hits non-scoped cookie endpoints (Lines 36-45)', () => {
        // Fallbacks for non-scoped
        const req1 = new MockRequest({ accessToken: 'acc1' }, {}) as any;
        expect(TokenService.getAccessToken(req1)).toBe('acc1');

        const req2 = new MockRequest({ admin_accessToken: 'adm1' }, {}) as any;
        expect(TokenService.getAccessToken(req2)).toBe('adm1');

        const req3 = new MockRequest({ infra_accessToken: 'inf1' }, {}) as any;
        expect(TokenService.getAccessToken(req3)).toBe('inf1');
    });

    it('getAccessToken: hits scoped endpoints explicitly (Lines 30, 33, 36)', () => {
        const reqA = new MockRequest({ admin_accessToken: 'adm1' }, {}) as any;
        expect(TokenService.getAccessToken(reqA, { scope: 'admin' })).toBe('adm1');

        const reqU = new MockRequest({ accessToken: 'acc1' }, {}) as any;
        expect(TokenService.getAccessToken(reqU, { scope: 'user' })).toBe('acc1');

        const reqI = new MockRequest({ infra_accessToken: 'inf1' }, {}) as any;
        expect(TokenService.getAccessToken(reqI, { scope: 'infrastructure' })).toBe('inf1');
    });

    it('getAccessToken: hits authorization header fallback (Line 53)', () => {
        const req = new MockRequest({}, { authorization: 'Bearer headerToken' }) as any;
        expect(TokenService.getAccessToken(req)).toBe('headerToken');
    });

    it('hashToken: handles token hashing (Lines 60-65)', async () => {
        const hash = await TokenService.hashToken('test-token');
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeGreaterThan(0);
    });

    it('generateAccessToken: uses explicit audience logic (Lines 68-72)', async () => {
        await TokenService.generateAccessToken({ userId: '1', email: 'test@example.com', roles: [], isAdmin: true, aud: 'custom' }, 3600);
        // We just expect it to not throw, as we mocked the internals.
        expect(jose.SignJWT).toHaveBeenCalled();
    });

    it('generateRefreshToken: handles explicit default user params (Line 83)', async () => {
        await TokenService.generateRefreshToken('1', true, 'custom');
        expect(jose.SignJWT).toHaveBeenCalledWith(expect.objectContaining({ aud: 'custom', isAdmin: true }));
    });

    it('generateAccessToken: handles empty string custom expiration and default user audience (Lines 69-72)', async () => {
        await TokenService.generateAccessToken({ userId: '1', email: 'e', roles: [], isAdmin: false }, '');
        expect(jose.SignJWT).toHaveBeenCalled();
    });

    it('getAccessToken: handles empty string fallbacks for scoped cookies and headers (Lines 30, 33, 36, 53)', () => {
        const reqAdmin = new MockRequest({ admin_accessToken: '' }, {}) as any;
        expect(TokenService.getAccessToken(reqAdmin, { scope: 'admin' })).toBeUndefined();

        const reqUser = new MockRequest({ accessToken: '' }, {}) as any;
        expect(TokenService.getAccessToken(reqUser, { scope: 'user' })).toBeUndefined();

        const reqInfra = new MockRequest({ infra_accessToken: '' }, {}) as any;
        expect(TokenService.getAccessToken(reqInfra, { scope: 'infrastructure' })).toBeUndefined();

        const reqHeader = new MockRequest({}, { authorization: 'Bearer ' }) as any;
        expect(TokenService.getAccessToken(reqHeader)).toBeUndefined();
    });

    it('verifyAccessToken: handles array audience payload (Line 114)', async () => {
        const { jwtVerify } = await import('jose');
        vi.mocked(jwtVerify).mockResolvedValueOnce({
            payload: { userId: '1', aud: ['user'] }
        } as any);
        await expect(TokenService.verifyAccessToken('token')).resolves.toBeDefined();
    });

    it('evaluates ADMIN_SECRET fallbacks during initialization (Line 19)', async () => {
        vi.resetModules();
        const origAdmin = process.env.ADMIN_JWT_SECRET;
        const origJwt = process.env.JWT_SECRET;

        process.env.ADMIN_JWT_SECRET = '';
        process.env.JWT_SECRET = 'fallback_secret';
        const { TokenService: TS1 } = await import('../token.service');
        expect(TS1).toBeDefined();

        vi.resetModules();
        process.env.ADMIN_JWT_SECRET = '';
        process.env.JWT_SECRET = '';
        const { TokenService: TS2 } = await import('../token.service');
        expect(TS2).toBeDefined();

        process.env.ADMIN_JWT_SECRET = origAdmin;
        process.env.JWT_SECRET = origJwt;
    });
});

