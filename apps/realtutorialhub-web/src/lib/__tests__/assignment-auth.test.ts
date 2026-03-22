import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireStudent, AssignmentAuthError } from '../assignment-auth';
import { TokenService } from '@quiz/auth';

describe('assignment-auth', () => {
  let getAccessTokenSpy: ReturnType<typeof vi.spyOn>;
  let verifyAccessTokenSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    getAccessTokenSpy = vi.spyOn(TokenService.prototype, 'getAccessToken');
    // Using simple mock replacement since we might fail vi.spyOn if property not perfectly clear statically
    verifyAccessTokenSpy = vi.fn();
    (TokenService as typeof TokenService & { verifyAccessToken: typeof verifyAccessTokenSpy }).verifyAccessToken =
      verifyAccessTokenSpy;
  });

  afterEach(() => {
    getAccessTokenSpy.mockRestore();
    // No need to restore static reassignment, it's overwritten per test, but good practice
  });

  describe('requireStudent', () => {
    it('throws AssignmentAuthError 401 when token is missing', async () => {
      getAccessTokenSpy.mockReturnValue(null);
      const request = new Request('https://realtutorialhub.test');

      await expect(requireStudent(request)).rejects.toThrowError(AssignmentAuthError);
      await expect(requireStudent(request)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws AssignmentAuthError 401 when token is empty string', async () => {
      getAccessTokenSpy.mockReturnValue('  ');
      const request = new Request('https://realtutorialhub.test');

      await expect(requireStudent(request)).rejects.toThrowError(AssignmentAuthError);
    });

    it('throws AssignmentAuthError 401 when verifyAccessToken throws', async () => {
      getAccessTokenSpy.mockReturnValue('invalid-token');
      verifyAccessTokenSpy.mockRejectedValue(new Error('JWT Error'));
      const request = new Request('https://realtutorialhub.test');

      await expect(requireStudent(request)).rejects.toThrowError(AssignmentAuthError);
    });

    it('returns the token payload when token is valid and verified', async () => {
      getAccessTokenSpy.mockReturnValue('valid-token');
      const expectedPayload = { sub: 'user-id', roles: [] };
      verifyAccessTokenSpy.mockResolvedValue(expectedPayload as never);
      
      const request = new Request('https://realtutorialhub.test');
      const result = await requireStudent(request);

      expect(verifyAccessTokenSpy).toHaveBeenCalledWith('valid-token', { audience: 'user', isAdmin: false });
      expect(result).toEqual(expectedPayload);
    });
  });
});
