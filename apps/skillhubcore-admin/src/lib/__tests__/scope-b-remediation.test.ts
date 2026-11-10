import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
import {
  evaluatePageAccess,
  evaluateServerCookiesPageAccess,
  setAccountAuthority,
  signPageAdmissionAssertion,
  verifyPageAdmissionAssertion,
  EXPECTED_JWT_AUDIENCE,
  EXPECTED_JWT_ISSUER,
  type ShcAccountAuthority,
} from '../server-page-auth';
import {
  authenticateRequest,
  createAuthErrorResponse,
  requireBrandAccess,
  requireSubtopicAccess,
  VALID_TUTORIAL_BRAND_IDS,
  type AuthenticatedUser,
} from '../auth-helpers';
import { defaultShcAccountAuthority, evaluateAccountAdmission } from '../shc-account-authority';
import { POST as sidebarPost } from '../../app/api/tutorial-left-sidebar/route';
import { ConfigurationError, TokenService } from '@quiz/auth';
import { NextRequest } from 'next/server';

describe('Scope B Remediation R3 Master Verification Suite', () => {
  const secretKey = new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'test-admin-secret-at-least-32-chars-long!!'
  );

  async function createToken(overrides: Record<string, unknown> = {}, signKey = secretKey) {
    const payload: Record<string, unknown> = {
      sub: 'admin-uuid-1',
      originalUserId: 'admin-uuid-1',
      shadowUserId: 'admin-uuid-1',
      email: 'admin@skillhubcore.in',
      roles: ['admin'],
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: EXPECTED_JWT_AUDIENCE,
      iss: EXPECTED_JWT_ISSUER,
      isAdmin: true,
      ...overrides,
    };

    if (overrides.iss === null) {
      delete payload.iss;
    }
    if (overrides.aud === null) {
      delete payload.aud;
    }
    if (overrides.brand === null) {
      delete payload.brand;
    }

    const alg = typeof overrides.alg === 'string' ? overrides.alg : 'HS256';
    let builder = new SignJWT(payload).setProtectedHeader({ alg }).setIssuedAt();

    if (overrides.exp === null) {
      // Intentionally omit exp claim
    } else if (overrides.exp !== undefined && typeof overrides.exp === 'number') {
      builder = builder.setExpirationTime(overrides.exp);
    } else {
      builder = builder.setExpirationTime('2h');
    }

    if (overrides.nbf !== undefined && typeof overrides.nbf === 'number') {
      builder = builder.setNotBefore(overrides.nbf);
    }

    return builder.sign(signKey);
  }

  const mockActiveAdminAuthority: ShcAccountAuthority = {
    async getCurrentAccount(input) {
      return {
        id: input.originalUserId,
        email: 'admin@skillhubcore.in',
        role: 'admin',
        platform: 'skillhubcore',
        isActive: true,
      };
    },
  };

  afterEach(() => {
    setAccountAuthority(null);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // P1 (R3-05 to R3-08): No Production Test Bypass / No Fabricated Accounts
  // =========================================================================
  describe('P1: Elimination of Production Account Fabrication (R3-05 to R3-08)', () => {
    it.each([
      { name: 'VITEST unset', vitestVal: undefined },
      { name: 'VITEST=true', vitestVal: 'true' },
      { name: 'VITEST=false', vitestVal: 'false' },
    ])('never fabricates an active admin account when $name and authority unconfigured', async ({ vitestVal }) => {
      setAccountAuthority(null); // Ensure no test mock is injected
      if (vitestVal !== undefined) {
        vi.stubEnv('VITEST', vitestVal);
      } else {
        delete process.env.VITEST;
      }
      vi.stubEnv('NODE_ENV', 'production');
      // Intentionally unset identity service URLs
      delete process.env.SHC_IDENTITY_SERVICE_URL;
      delete process.env.API_GATEWAY_URL;
      delete process.env.GATEWAY_URL;

      const token = await createToken();

      // Page admission must fail closed (UNAVAILABLE or UNAUTHENTICATED, never AUTHORIZED)
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      expect(pageOutcome.status).not.toBe('AUTHORIZED');
      expect(['UNAVAILABLE', 'UNAUTHENTICATED']).toContain(pageOutcome.status);

      // API admission must fail closed
      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-composer/sections', {
        headers: { cookie: `accessToken=${token}` },
      });
      const apiOutcome = await authenticateRequest(req);
      expect('type' in apiOutcome).toBe(true);
      if ('type' in apiOutcome) {
        expect(['SERVICE_UNAVAILABLE', 'INVALID_TOKEN']).toContain(apiOutcome.type);
      }
    });

    it('rejects token when authority returns null (unknown account)', async () => {
      setAccountAuthority({
        async getCurrentAccount() {
          return null;
        },
      });

      const token = await createToken();
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      expect(pageOutcome.status).toBe('UNAUTHENTICATED');

      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-composer/sections', {
        headers: { cookie: `accessToken=${token}` },
      });
      const apiOutcome = await authenticateRequest(req);
      expect('type' in apiOutcome).toBe(true);
      if ('type' in apiOutcome) {
        expect(apiOutcome.type).toBe('INVALID_TOKEN');
      }
    });

    it('rejects admission when account ID does not match token originalUserId', async () => {
      setAccountAuthority({
        async getCurrentAccount() {
          return {
            id: 'mismatched-user-id-999',
            email: 'admin@skillhubcore.in',
            role: 'admin',
            platform: 'skillhubcore',
            isActive: true,
          };
        },
      });

      const token = await createToken();
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      expect(pageOutcome.status).toBe('UNAUTHENTICATED');
      if (pageOutcome.status === 'UNAUTHENTICATED') {
        expect(pageOutcome.message).toContain('mismatch');
      }
    });

    it('rejects admission when account platform is not skillhubcore', async () => {
      setAccountAuthority({
        async getCurrentAccount(input) {
          return {
            id: input.originalUserId,
            email: 'admin@skillhubcore.in',
            role: 'admin',
            platform: 'skillup', // Mismatched platform
            isActive: true,
          };
        },
      });

      const token = await createToken();
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      expect(pageOutcome.status).toBe('FORBIDDEN');
      if (pageOutcome.status === 'FORBIDDEN') {
        expect(pageOutcome.reason).toBe('FORBIDDEN_ROLE');
      }
    });

    it('rejects admission with FORBIDDEN when account isActive is false or malformed', async () => {
      setAccountAuthority({
        async getCurrentAccount(input) {
          return {
            id: input.originalUserId,
            email: 'admin@skillhubcore.in',
            role: 'admin',
            platform: 'skillhubcore',
            isActive: false,
          };
        },
      });

      const token = await createToken();
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      expect(pageOutcome.status).toBe('FORBIDDEN');
      if (pageOutcome.status === 'FORBIDDEN') {
        expect(pageOutcome.reason).toBe('FORBIDDEN_ROLE');
        expect(pageOutcome.message).toContain('deactivated');
      }
    });

    it('rejects admission with UNAUTHENTICATED when account is deleted or revoked', async () => {
      setAccountAuthority({
        async getCurrentAccount(input) {
          return {
            id: input.originalUserId,
            email: 'admin@skillhubcore.in',
            role: 'admin',
            platform: 'skillhubcore',
            isActive: true,
            deletedAt: new Date(),
          };
        },
      });

      const token = await createToken();
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      expect(pageOutcome.status).toBe('UNAUTHENTICATED');
      if (pageOutcome.status === 'UNAUTHENTICATED') {
        expect(pageOutcome.reason).toBe('EXPIRED_TOKEN');
        expect(pageOutcome.message).toContain('deleted or revoked');
      }
    });
  });

  // =========================================================================
  // P1 (R3-14 to R3-16): Effective Role Reconciliation (Stale Token Demotion)
  // =========================================================================
  describe('P1: Role Reconciliation & Least Privilege (R3-14 to R3-16)', () => {
    it('demotes stale super_admin token to admin when account has role admin', async () => {
      // Live account in identity store has role 'admin'
      setAccountAuthority({
        async getCurrentAccount(input) {
          return {
            id: input.originalUserId,
            email: 'admin@skillhubcore.in',
            role: 'admin',
            platform: 'skillhubcore',
            isActive: true,
          };
        },
      });

      // Token carries stale 'super_admin' role
      const token = await createToken({ roles: ['super_admin'] });

      // Page admission to standard dashboard succeeds, but user principal has effective role 'admin'
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      expect(pageOutcome.status).toBe('AUTHORIZED');
      if (pageOutcome.status === 'AUTHORIZED') {
        expect(pageOutcome.user.roles).toEqual(['admin']);
        expect(pageOutcome.user.roles).not.toContain('super_admin');
      }

      // API admission returns effective role 'admin'
      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-composer/sections', {
        headers: { cookie: `accessToken=${token}` },
      });
      const apiOutcome = await authenticateRequest(req);
      expect('user' in apiOutcome).toBe(true);
      if ('user' in apiOutcome) {
        expect(apiOutcome.user.roles).toEqual(['admin']);
        expect(apiOutcome.user.roles).not.toContain('super_admin');
      }
    });

    it('denies admission when admin account is demoted to student', async () => {
      setAccountAuthority({
        async getCurrentAccount(input) {
          return {
            id: input.originalUserId,
            email: 'student@skillhubcore.in',
            role: 'student',
            platform: 'skillhubcore',
            isActive: true,
          };
        },
      });

      const token = await createToken({ roles: ['admin'] });
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      expect(pageOutcome.status).toBe('FORBIDDEN');
      if (pageOutcome.status === 'FORBIDDEN') {
        expect(pageOutcome.reason).toBe('FORBIDDEN_ROLE');
      }

      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-composer/sections', {
        headers: { cookie: `accessToken=${token}` },
      });
      const apiOutcome = await authenticateRequest(req);
      expect('type' in apiOutcome).toBe(true);
      if ('type' in apiOutcome) {
        expect(apiOutcome.type).toBe('FORBIDDEN');
      }
    });
  });

  // =========================================================================
  // P2 (R3-21 to R3-24): Real HTTP 503, Timeouts & Hard Deadlines
  // =========================================================================
  describe('P2: HTTP 503 & Hard Timeout Deadlines (R3-21 to R3-24)', () => {
    it('enforces hard caller deadline when provider promise hangs indefinitely', async () => {
      // Simulate hung provider ignoring abort signal
      setAccountAuthority({
        async getCurrentAccount() {
          return new Promise(() => {
            // Never resolves or rejects
          });
        },
      });

      const token = await createToken();
      const start = Date.now();
      const pageOutcome = await evaluatePageAccess(token, '/dashboard');
      const elapsed = Date.now() - start;

      // Default timeout is bounded to ~3000ms
      expect(elapsed).toBeLessThan(4500);
      expect(pageOutcome.status).toBe('UNAVAILABLE');
      if (pageOutcome.status === 'UNAVAILABLE') {
        expect(pageOutcome.reason).toBe('SERVICE_ERROR');
        expect(pageOutcome.message).toContain('timed out');
      }
    });

    it('returns HTTP 503 with Cache-Control: private, no-store on provider outage', async () => {
      setAccountAuthority({
        async getCurrentAccount() {
          throw new Error('Connection refused ECONNREFUSED');
        },
      });

      const token = await createToken();
      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-composer/sections', {
        headers: { cookie: `accessToken=${token}` },
      });
      const apiOutcome = await authenticateRequest(req);
      expect('type' in apiOutcome).toBe(true);
      if ('type' in apiOutcome) {
        expect(apiOutcome.type).toBe('SERVICE_UNAVAILABLE');
        const res = createAuthErrorResponse(apiOutcome);
        expect(res.status).toBe(503);
        expect(res.headers.get('Cache-Control')).toBe('private, no-store');
      }
    });

    it('returns HTTP 503 when configuration secret is missing in production', async () => {
      setAccountAuthority(mockActiveAdminAuthority);
      vi.spyOn(TokenService, 'verifyAdminAccessToken').mockRejectedValueOnce(
        new ConfigurationError('Missing required production authentication secret for JWT_SECRET.')
      );

      const token = await createToken();
      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-composer/sections', {
        headers: { cookie: `accessToken=${token}` },
      });
      const apiOutcome = await authenticateRequest(req);
      expect('type' in apiOutcome).toBe(true);
      if ('type' in apiOutcome) {
        expect(apiOutcome.type).toBe('SERVICE_UNAVAILABLE');
        const res = createAuthErrorResponse(apiOutcome);
        expect(res.status).toBe(503);
        expect(res.headers.get('Cache-Control')).toBe('private, no-store');
      }
    });
  });

  // =========================================================================
  // P2 (R3-17 to R3-20): Object-Level Resource Grants & Sidebar Tree IDOR
  // =========================================================================
  // =========================================================================
  // R6-C (R6-10 to R6-13): Centralized SHC Admin Tutorial Authoring Compatibility
  // =========================================================================
  describe('R6-C: Centralized SHC Admin Tutorial Authoring Compatibility (R6-10 to R6-13)', () => {
    const baseEditor: AuthenticatedUser = {
      userId: 'editor-1',
      originalUserId: 'editor-1',
      shadowUserId: 'editor-1',
      roles: ['admin'],
      isAdmin: true,
      brand: 'skillhubcore',
    };

    it('allows standard SHC admin to manage valid subtopics even when optional allowedSubtopics is empty or restrictive (R6-11)', () => {
      // Empty, restrictive, or undefined allowedSubtopics claims must NOT restrict legitimate SHC admins
      const emptyScopedUser: AuthenticatedUser = {
        ...baseEditor,
        allowedSubtopics: [],
      };
      expect(requireSubtopicAccess(emptyScopedUser, 'subtopic-1')).toBeNull();

      const restrictiveScopedUser: AuthenticatedUser = {
        ...baseEditor,
        allowedSubtopics: ['other-subtopic'],
      };
      expect(requireSubtopicAccess(restrictiveScopedUser, 'subtopic-1')).toBeNull();
    });

    it('allows standard SHC admin to manage all 4 distribution brands even when optional allowedBrands is empty or restrictive (R6-11)', () => {
      const emptyScopedUser: AuthenticatedUser = {
        ...baseEditor,
        allowedBrands: [],
      };
      expect(requireBrandAccess(emptyScopedUser, 'realtutorialhub')).toBeNull();
      expect(requireBrandAccess(emptyScopedUser, 'skillup')).toBeNull();
      expect(requireBrandAccess(emptyScopedUser, 'shared')).toBeNull();
      expect(requireBrandAccess(emptyScopedUser, 'skillhubcore')).toBeNull();

      const restrictiveScopedUser: AuthenticatedUser = {
        ...baseEditor,
        allowedBrands: ['skillup'],
        adminScope: ['skillup'],
      };
      expect(requireBrandAccess(restrictiveScopedUser, 'realtutorialhub')).toBeNull();
      expect(requireBrandAccess(restrictiveScopedUser, 'shared')).toBeNull();
    });

    it('denies brand and subtopic access when user lacks authoring permissions (student/faculty) (R6-12)', () => {
      const studentUser: AuthenticatedUser = {
        ...baseEditor,
        roles: ['student'],
        isAdmin: false,
      };
      const brandErr = requireBrandAccess(studentUser, 'shared');
      expect(brandErr).not.toBeNull();
      expect(brandErr?.type).toBe('FORBIDDEN');

      const subtopicErr = requireSubtopicAccess(studentUser, 'subtopic-1');
      expect(subtopicErr).not.toBeNull();
      expect(subtopicErr?.type).toBe('FORBIDDEN');
    });

    it('sidebar POST rejects non-SHC tenant caller attempt (R6-12)', async () => {
      setAccountAuthority({
        async getCurrentAccount(input) {
          return {
            id: input.originalUserId,
            email: 'tenant@skillup.com',
            role: 'admin',
            platform: 'skillhubcore',
            isActive: true,
          };
        },
      });

      // Tenant token with brand: 'skillup' must be rejected
      const token = await createToken({
        brand: 'skillup',
      });

      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-left-sidebar', {
        method: 'POST',
        headers: {
          cookie: `accessToken=${token}`,
          origin: 'https://admin.skillhubcore.in',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          brandId: 'realtutorialhub',
          domainId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          subjectId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          topicId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          sourceFormat: 'markdown',
          sourceContent: '# Topic',
          status: 'draft',
          tree: {
            topics: [{ name: 'Topic 1', type: 'page' }],
          },
        }),
      });

      const response = await sidebarPost(req);
      expect(response.status).toBe(401);
    });
  });

  // =========================================================================
  // G2: Mandatory JWT Claims Parity (Preserved Verification)
  // =========================================================================
  describe('G2: Mandatory JWT Claims Parity (Page & API)', () => {
    beforeEach(() => {
      setAccountAuthority(mockActiveAdminAuthority);
    });

    it('rejects token missing iss on page admission', async () => {
      const tokenWithoutIss = await createToken({ iss: null });
      const outcome = await evaluatePageAccess(tokenWithoutIss, '/dashboard');
      expect(outcome.status).toBe('UNAUTHENTICATED');
    });

    it('rejects token missing iss on API admission', async () => {
      const tokenWithoutIss = await createToken({ iss: null });
      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-composer/sections', {
        headers: { cookie: `accessToken=${tokenWithoutIss}` },
      });
      const outcome = await authenticateRequest(req);
      expect('type' in outcome).toBe(true);
      if ('type' in outcome) {
        expect(outcome.type).toBe('INVALID_TOKEN');
      }
    });

    it('rejects token missing exp on page admission', async () => {
      const tokenWithoutExp = await createToken({ exp: null });
      const outcome = await evaluatePageAccess(tokenWithoutExp, '/dashboard');
      expect(outcome.status).toBe('UNAUTHENTICATED');
    });

    it('rejects token missing exp on API admission', async () => {
      const tokenWithoutExp = await createToken({ exp: null });
      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-composer/sections', {
        headers: { cookie: `accessToken=${tokenWithoutExp}` },
      });
      const outcome = await authenticateRequest(req);
      expect('type' in outcome).toBe(true);
      if ('type' in outcome) {
        expect(outcome.type).toBe('INVALID_TOKEN');
      }
    });
  });

  // =========================================================================
  // G5: Production Secret Fallback Safety (Preserved Verification)
  // =========================================================================
  describe('G5: Production Secret Safety', () => {
    it('fails closed in production environment when secrets are missing', () => {
      delete process.env.JWT_SECRET;
      delete process.env.ADMIN_JWT_SECRET;
      vi.stubEnv('NODE_ENV', 'production');

      expect(() => TokenService.ADMIN_SECRET).toThrow(ConfigurationError);
      expect(() => TokenService.ACCESS_SECRET).toThrow(ConfigurationError);
    });
  });

  // =========================================================================
  // R4-01 to R4-05: Centralized SHC Admin Tutorial Authoring Authority
  // =========================================================================
  describe('R4-01 to R4-05: Centralized SHC Admin Tutorial Authoring Authority', () => {
    const shcAdmin: AuthenticatedUser = {
      userId: 'shc-admin-1',
      originalUserId: 'shc-admin-1',
      shadowUserId: 'shc-admin-1',
      roles: ['admin'],
      isAdmin: true,
      brand: 'skillhubcore',
    };

    it('allows authorized SHC admin to manage shared, skillup, realtutorialhub, and skillhubcore (R4-05)', () => {
      for (const brand of VALID_TUTORIAL_BRAND_IDS) {
        const error = requireBrandAccess(shcAdmin, brand);
        expect(error).toBeNull();
      }
    });

    it('allows authorized SHC admin to manage tutorial subtopics without explicit allowedSubtopics claim', () => {
      const error = requireSubtopicAccess(shcAdmin, 'subtopic-advanced-react');
      expect(error).toBeNull();
    });

    it('denies tenant tokens (user.brand !== skillhubcore) from SHC tutorial authoring', () => {
      const tenantAuthors: AuthenticatedUser[] = [
        { ...shcAdmin, brand: 'skillup' },
        { ...shcAdmin, brand: 'realtutorialhub' },
      ];

      for (const author of tenantAuthors) {
        const brandErr = requireBrandAccess(author, 'skillup');
        expect(brandErr).not.toBeNull();
        expect(brandErr?.type).toBe('FORBIDDEN');
        expect(brandErr?.message).toContain('tenant token');

        const subtopicErr = requireSubtopicAccess(author, 'subtopic-1');
        expect(subtopicErr).not.toBeNull();
        expect(subtopicErr?.type).toBe('FORBIDDEN');
        expect(subtopicErr?.message).toContain('tenant token');
      }
    });

    it('denies invalid brand identifier not in VALID_TUTORIAL_BRAND_IDS', () => {
      const err = requireBrandAccess(shcAdmin, 'unknown-unsupported-brand');
      expect(err).not.toBeNull();
      expect(err?.type).toBe('FORBIDDEN');
      expect(err?.message).toContain('Invalid brand identifier');
    });

    it('allows authorized SHC admin to manage any valid tutorial brand without needing allowedBrands claim (R5-06)', () => {
      expect(requireBrandAccess(shcAdmin, 'shared')).toBeNull();
      expect(requireBrandAccess(shcAdmin, 'skillup')).toBeNull();
      expect(requireBrandAccess(shcAdmin, 'realtutorialhub')).toBeNull();
      expect(requireBrandAccess(shcAdmin, 'skillhubcore')).toBeNull();
    });

    it('allows authorized SHC admin to manage valid subtopic without needing allowedSubtopics claim (R5-06)', () => {
      expect(requireSubtopicAccess(shcAdmin, 'subtopic-any-valid-id')).toBeNull();
    });
  });

  // =========================================================================
  // R4-06 to R4-10 & R5-11 to R5-16: Gateway Transport & Anti-Recursion
  // =========================================================================
  describe('R4-06 to R4-10 & R5-11 to R5-16: Gateway Transport Contract & Safety', () => {
    it('sends internal secret, forwarded host, and brand headers to upstream gateway', async () => {
      vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'test-internal-gateway-secret-64-chars-long-abcdef0123456789');
      vi.stubEnv('SHC_IDENTITY_SERVICE_URL', 'http://127.0.0.1:8787');

      let capturedUrl = '';
      let capturedHeaders: Record<string, string> = {};

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return {
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              id: 'test-user-uuid',
              email: 'admin@skillhubcore.in',
              role: 'admin',
              platform: 'skillhubcore',
              isActive: true,
            },
          }),
        } as unknown as Response;
      });

      try {
        const account = await defaultShcAccountAuthority.getCurrentAccount({
          originalUserId: 'test-user-uuid',
          brand: 'skillhubcore',
          token: 'test-admin-bearer-token',
        });

        expect(account).not.toBeNull();
        expect(account?.id).toBe('test-user-uuid');
        expect(capturedUrl).toContain('/api/shc/auth/me');
        expect(capturedHeaders['x-internal-secret']).toBe('test-internal-gateway-secret-64-chars-long-abcdef0123456789');
        expect(capturedHeaders['x-forwarded-host']).toBe('admin.skillhubcore.in');
        expect(capturedHeaders['x-original-host']).toBe('admin.skillhubcore.in');
        expect(capturedHeaders['x-brand']).toBe('skillhubcore');
        expect(capturedHeaders['Authorization']).toBe('Bearer test-admin-bearer-token');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('rejects recursive configuration targeting SHC Admin itself (R5-13)', async () => {
      vi.stubEnv('SHC_IDENTITY_SERVICE_URL', 'http://127.0.0.1:3007');

      await expect(
        defaultShcAccountAuthority.getCurrentAccount({
          originalUserId: 'test-user-uuid',
          brand: 'skillhubcore',
          token: 'valid-token',
        })
      ).rejects.toThrow('Recursive destination rejected');
    });

    it('maps upstream 401/404 to null (yielding UNAUTHENTICATED)', async () => {
      vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'test-secret');
      vi.stubEnv('SHC_IDENTITY_SERVICE_URL', 'http://127.0.0.1:8787');

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 401,
        } as unknown as Response;
      });

      try {
        const account = await defaultShcAccountAuthority.getCurrentAccount({
          originalUserId: 'test-user-uuid',
          brand: 'skillhubcore',
          token: 'invalid-or-revoked-token',
        });
        expect(account).toBeNull();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('maps upstream 403 to AccountIneligibleError and evaluates to FORBIDDEN (R6-05)', async () => {
      vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'test-secret');
      vi.stubEnv('SHC_IDENTITY_SERVICE_URL', 'http://127.0.0.1:8787');

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 403,
          json: async () => ({ error: 'Account is not eligible for administrative access' }),
        } as unknown as Response;
      });

      try {
        await expect(
          defaultShcAccountAuthority.getCurrentAccount({
            originalUserId: 'test-user-uuid',
            brand: 'skillhubcore',
            token: 'ineligible-student-token',
          })
        ).rejects.toThrow('Account is not eligible for SHC Admin access');

        const outcome = await evaluateAccountAdmission({
          originalUserId: 'test-user-uuid',
          brand: 'skillhubcore',
          token: 'ineligible-student-token',
        });
        expect(outcome.status).toBe('FORBIDDEN');
        if (outcome.status === 'FORBIDDEN') {
          expect(outcome.reason).toBe('DEMOTED');
        }
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('maps upstream 500/503 to thrown error (yielding UNAVAILABLE)', async () => {
      vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'test-secret');
      vi.stubEnv('SHC_IDENTITY_SERVICE_URL', 'http://127.0.0.1:8787');

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 503,
        } as unknown as Response;
      });

      try {
        await expect(
          defaultShcAccountAuthority.getCurrentAccount({
            originalUserId: 'test-user-uuid',
            brand: 'skillhubcore',
            token: 'valid-token',
          })
        ).rejects.toThrow('Upstream identity service returned status 503');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // R5-21 to R5-26: Proxy-to-Layout Admission Assertion & Adversarial Matrix
  // =========================================================================
  describe('R5-21 to R5-26: Proxy-to-Layout Admission Assertion & Adversarial Matrix', () => {
    const principal = {
      userId: 'admin-uuid-1',
      originalUserId: 'admin-uuid-1',
      shadowUserId: 'admin-uuid-1',
      email: 'admin@skillhubcore.in',
      roles: ['admin' as const],
      isAdmin: true,
      brand: 'skillhubcore',
    };

    it('signs and verifies short-lived token-bound downstream admission assertion', async () => {
      const sampleToken = 'valid-session-jwt-token-string';
      const assertion = await signPageAdmissionAssertion(principal, '/dashboard', sampleToken);
      expect(typeof assertion).toBe('string');
      expect(assertion.length).toBeGreaterThan(20);

      const verified = await verifyPageAdmissionAssertion(assertion, '/dashboard', sampleToken);
      expect(verified).not.toBeNull();
      expect(verified?.originalUserId).toBe('admin-uuid-1');
      expect(verified?.roles).toEqual(['admin']);
    });

    it('rejects assertion when path does not match', async () => {
      const sampleToken = 'valid-session-jwt-token-string';
      const assertion = await signPageAdmissionAssertion(principal, '/dashboard', sampleToken);
      const verified = await verifyPageAdmissionAssertion(assertion, '/audit', sampleToken);
      expect(verified).toBeNull();
    });

    it('rejects assertion replay with changed cookie token (token hash mismatch) (R5-22)', async () => {
      const originalToken = 'original-session-token';
      const replayedToken = 'different-stolen-session-token';
      const assertion = await signPageAdmissionAssertion(principal, '/dashboard', originalToken);

      const verified = await verifyPageAdmissionAssertion(assertion, '/dashboard', replayedToken);
      expect(verified).toBeNull();
    });

    it('rejects assertion when cookie token is absent (session unbinding) (R5-22)', async () => {
      const sampleToken = 'valid-session-jwt-token-string';
      const assertion = await signPageAdmissionAssertion(principal, '/dashboard', sampleToken);

      const verified = await verifyPageAdmissionAssertion(assertion, '/dashboard', undefined);
      expect(verified).toBeNull();
    });

    it('rejects client-forged assertion signed with wrong key (R5-22)', async () => {
      const wrongKey = new TextEncoder().encode('untrusted-foreign-key-at-least-32-chars-long!!');
      const forgedAssertion = await new SignJWT({
        sub: 'admin-uuid-1',
        originalUserId: 'admin-uuid-1',
        roles: ['admin'],
        brand: 'skillhubcore',
        pathname: '/dashboard',
        tokenHash: 'some-hash',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(EXPECTED_JWT_ISSUER)
        .setAudience('shc-admin-admission')
        .setIssuedAt()
        .setExpirationTime('60s')
        .sign(wrongKey);

      const verified = await verifyPageAdmissionAssertion(forgedAssertion, '/dashboard', 'any-token');
      expect(verified).toBeNull();
    });

    it('evaluates server cookies page access using assertion without secondary network call', async () => {
      const sampleToken = 'valid-session-jwt-token-string';
      const assertion = await signPageAdmissionAssertion(principal, '/dashboard', sampleToken);
      const cookieStore = {
        get: (name: string) => (name === 'accessToken' ? { value: sampleToken } : undefined),
      };

      const outcome = await evaluateServerCookiesPageAccess(cookieStore, '/dashboard', assertion);
      expect(outcome.status).toBe('AUTHORIZED');
      if (outcome.status === 'AUTHORIZED') {
        expect(outcome.user.originalUserId).toBe('admin-uuid-1');
      }
    });

    it('falls back to live check when assertion is absent or invalid without failing closed for valid cookie', async () => {
      setAccountAuthority(mockActiveAdminAuthority);
      const validToken = await createToken({ roles: ['admin'] });
      const cookieStore = {
        get: (name: string) => (name === 'accessToken' ? { value: validToken } : undefined),
      };

      // Absent assertion: falls back to evaluatePageAccess and succeeds with valid cookie
      const outcome = await evaluateServerCookiesPageAccess(cookieStore, '/dashboard', null);
      expect(outcome.status).toBe('AUTHORIZED');
    });
  });
});
