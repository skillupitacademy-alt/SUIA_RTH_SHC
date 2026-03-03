import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../token.service';
import * as jose from 'jose';

vi.mock('jose', () => ({
    jwtVerify: vi.fn(),
    SignJWT: vi.fn(),
    decodeJwt: vi.fn()
}));

const mockJwtVerify = vi.mocked(jose.jwtVerify);

describe('TokenService extreme tail coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('verifyRefreshToken: succeeds when payload.aud is undefined (Line 133)', async () => {
        process.env.JWT_REFRESH_SECRET = 'secret';
        mockJwtVerify.mockResolvedValue({
            payload: { userId: 'u1' } // no aud!
        } as any);

        const result = await TokenService.verifyRefreshToken('token', { audience: 'user' });
        expect(result.userId).toBe('u1');
    });

    it('verifyRefreshToken: succeeds when payload.aud is an array (not string) (Line 133)', async () => {
        process.env.JWT_REFRESH_SECRET = 'secret';
        mockJwtVerify.mockResolvedValue({
            payload: { userId: 'u1', aud: ['user', 'admin'] } 
        } as any);

        const result = await TokenService.verifyRefreshToken('token', { audience: 'user' });
        expect(result.userId).toBe('u1');
    });
});
