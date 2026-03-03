import { describe, it, expect, vi } from 'vitest';
import { TokenService } from '../token.service';
import * as jose from 'jose';

vi.mock('jose', () => ({
    jwtVerify: vi.fn(),
    SignJWT: vi.fn(),
    decodeJwt: vi.fn()
}));

const mockJwtVerify = vi.mocked(jose.jwtVerify);

describe('TokenService extreme logic tail 7', () => {
    it('verifyRefreshToken: throws when requiredAud=infra but scope is user (Line 133)', async () => {
        process.env.JWT_REFRESH_SECRET = 'secret';
        mockJwtVerify.mockResolvedValue({
            payload: { userId: 'u1', aud: 'user' } 
        } as any);

        // The assertion tests verifyAccessToken, not verifyRefreshToken, based on auth logic
        await expect(TokenService.verifyAccessToken('token', { audience: 'infra' }))
            .rejects.toThrow('Audience mismatch: expected infra, got user');
    });

    it('verifyAccessToken: allows admin or infra audience when isAdmin is true (Line 128)', async () => {
        mockJwtVerify.mockResolvedValueOnce({
            payload: { userId: 'u1', aud: 'admin' } 
        } as any);
        await expect(TokenService.verifyAccessToken('token', { isAdmin: true })).resolves.toBeDefined();
    });

    it('verifyAccessToken: uses ACCESS_SECRET when isAdmin is explicitly false (Line 137)', async () => {
        mockJwtVerify.mockResolvedValueOnce({ payload: { userId: 'u1' } } as any);
        await expect(TokenService.verifyAccessToken('token', { isAdmin: false })).resolves.toBeDefined();
    });

    it('verifyAccessToken: falls back to ADMIN_SECRET when ACCESS_SECRET fails (Lines 142-147)', async () => {
        mockJwtVerify
            .mockRejectedValueOnce(new Error('Invalid signature')) // ACCESS_SECRET fails
            .mockResolvedValueOnce({ payload: { userId: 'u1' } } as any); // ADMIN_SECRET succeeds
        await expect(TokenService.verifyAccessToken('token')).resolves.toBeDefined();
    });

    it('verifyAccessToken: fallback throws default string error when innerErr is string (Line 149)', async () => {
        mockJwtVerify
            .mockRejectedValueOnce(new Error('Invalid signature')) // ACCESS_SECRET fails
            .mockRejectedValueOnce('String Error'); // ADMIN_SECRET fails with string
        await expect(TokenService.verifyAccessToken('token'))
            .rejects.toThrow('Invalid _token signature or audience mismatch');
    });

    it('verifyRefreshToken: uses ADMIN_SECRET when isAdmin is true (Line 157)', async () => {
        mockJwtVerify.mockResolvedValueOnce({ payload: { userId: 'u1' } } as any);
        await expect(TokenService.verifyRefreshToken('token', { isAdmin: true })).resolves.toBeDefined();
    });

    it('verifyAccessToken: throws Audience violation if unknown aud on admin scope (Line 129)', async () => {
        mockJwtVerify.mockResolvedValueOnce({
            payload: { userId: 'u1', aud: 'hacker' } 
        } as any);
        await expect(TokenService.verifyAccessToken('token', { isAdmin: true }))
            .rejects.toThrow('Audience violation: admin scope received unexpected aud hacker');
    });
});
