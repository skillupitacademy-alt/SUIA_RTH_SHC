import { describe, expect, it, vi } from 'vitest';
import { verifyAccessToken } from '../verify';
import { TokenService } from '../token.service';

vi.mock('../token.service', () => {
  return {
    TokenService: {
      verifyAccessToken: vi.fn(),
    },
  };
});

describe('verify', () => {
  it('calls TokenService.verifyAccessToken', async () => {
    vi.mocked(TokenService.verifyAccessToken).mockResolvedValueOnce({ userId: 'u1' } as any);
    
    const result = await verifyAccessToken('test-token', { audience: 'test' });
    
    expect(TokenService.verifyAccessToken).toHaveBeenCalledWith('test-token', { audience: 'test' });
    expect(result).toEqual({ userId: 'u1' });
  });
});
