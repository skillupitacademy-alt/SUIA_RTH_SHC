import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenService } from '@quiz/auth';
import type { NextRequest } from 'next/server';

// Mock DB dependency
vi.mock('@quiz/db-tutorial', () => {
  return {
    TutorialContentRepository: class {}
  };
});

// Import after DB mock to avoid instantiation errors if DB mock is needed
import { requireAdmin, TutorialAuthError, normalizeTutorialWritePayload, isTutorialAuthError } from '../tutorial-content-api';

describe('admin tutorial-content-api', () => {
  let getAccessTokenSpy: any;
  let verifyAdminAccessTokenSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    getAccessTokenSpy = vi.spyOn(TokenService.prototype, 'getAccessToken');
    verifyAdminAccessTokenSpy = vi.spyOn(TokenService.prototype, 'verifyAdminAccessToken');
  });

  afterEach(() => {
    getAccessTokenSpy.mockRestore();
    verifyAdminAccessTokenSpy.mockRestore();
  });

  describe('isTutorialAuthError', () => {
    it('returns true for TutorialAuthError instances', () => {
      const error = new TutorialAuthError('test', 401);
      expect(isTutorialAuthError(error)).toBe(true);
    });

    it('returns false for generic errors', () => {
      expect(isTutorialAuthError(new Error())).toBe(false);
      expect(isTutorialAuthError({})).toBe(false);
    });
  });

  describe('normalizeTutorialWritePayload', () => {
    it('normalizes a partial payload into an upsert input format', () => {
      const payload: any = {
        subtopicId: '123',
        difficulty: 'simple',
        content: { } as any,
        adminApprovedAt: '2026-03-22T10:00:00Z'
      };

      const result = normalizeTutorialWritePayload(payload);

      expect(result.subtopicId).toBe('123');
      expect(result.aiModelUsed).toBeNull();
      expect(result.adminApprovedBy).toBeNull();
      expect(result.qualityScore).toBeNull();
      expect(result.adminApprovedAt).toBeInstanceOf(Date);
    });

    it('handles Date objects correctly for adminApprovedAt', () => {
      const date = new Date();
      const payload: any = {
        subtopicId: '123',
        difficulty: 'simple',
        content: { } as any,
        adminApprovedAt: date
      };

      const result = normalizeTutorialWritePayload(payload);
      expect(result.adminApprovedAt).toBe(date);
    });
  });

  describe('requireAdmin', () => {
    it('throws TutorialAuthError 401 when token is missing', async () => {
      getAccessTokenSpy.mockReturnValue(null);
      const request = {} as NextRequest;

      await expect(requireAdmin(request)).rejects.toThrowError(TutorialAuthError);
    });

    it('throws TutorialAuthError 401 when token verification fails', async () => {
      getAccessTokenSpy.mockReturnValue('invalid-token');
      verifyAdminAccessTokenSpy.mockRejectedValue(new Error('Invalid token'));
      const request = {} as NextRequest;

      await expect(requireAdmin(request)).rejects.toThrowError(TutorialAuthError);
    });

    it('throws TutorialAuthError 403 when isAdmin is false', async () => {
      getAccessTokenSpy.mockReturnValue('valid-token');
      verifyAdminAccessTokenSpy.mockResolvedValue({ isAdmin: false, roles: ['ADMIN'] });
      const request = {} as NextRequest;

      await expect(requireAdmin(request)).rejects.toThrowError(TutorialAuthError);
      await expect(requireAdmin(request)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws TutorialAuthError 403 when roles do not contain admin roles', async () => {
      getAccessTokenSpy.mockReturnValue('valid-token');
      verifyAdminAccessTokenSpy.mockResolvedValue({ isAdmin: true, roles: ['USER'] });
      const request = {} as NextRequest;

      await expect(requireAdmin(request)).rejects.toThrowError(TutorialAuthError);
    });

    it('returns the payload when the admin is valid and has ADMIN role', async () => {
      getAccessTokenSpy.mockReturnValue('valid-token');
      const payload = { isAdmin: true, roles: ['ADMIN'] };
      verifyAdminAccessTokenSpy.mockResolvedValue(payload);
      const request = {} as NextRequest;

      const result = await requireAdmin(request);
      expect(result).toEqual(payload);
      expect(verifyAdminAccessTokenSpy).toHaveBeenCalledWith('valid-token');
    });

    it('returns the payload when the admin is valid and has SUPER_ADMIN role (case insensitive)', async () => {
      getAccessTokenSpy.mockReturnValue('valid-token');
      const payload = { isAdmin: true, roles: ['super_admin'] };
      verifyAdminAccessTokenSpy.mockResolvedValue(payload);
      const request = {} as NextRequest;

      const result = await requireAdmin(request);
      expect(result).toEqual(payload);
    });
  });
});
