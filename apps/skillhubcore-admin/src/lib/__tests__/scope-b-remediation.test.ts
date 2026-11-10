import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
import {
  evaluatePageAccess,
  setAccountAuthority,
  EXPECTED_JWT_AUDIENCE,
  EXPECTED_JWT_ISSUER,
  type ShcAccountAuthority,
} from '../server-page-auth';
import {
  authenticateRequest,
  createAuthErrorResponse,
  requireBrandAccess,
  requireSubtopicAccess,
  type AuthenticatedUser,
} from '../auth-helpers';
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
  describe('P2: Object-Level Resource Grants & Tree Mutations (R3-17 to R3-20)', () => {
    const baseEditor: AuthenticatedUser = {
      userId: 'editor-1',
      originalUserId: 'editor-1',
      shadowUserId: 'editor-1',
      roles: ['admin'],
      isAdmin: true,
      brand: 'skillhubcore',
    };

    it('denies subtopic access when allowedSubtopics is an empty array (R3-18)', () => {
      const emptyScopedUser: AuthenticatedUser = {
        ...baseEditor,
        allowedSubtopics: [], // Empty list must deny, not grant wildcard access
      };
      const err = requireSubtopicAccess(emptyScopedUser, 'subtopic-1');
      expect(err).not.toBeNull();
      expect(err?.type).toBe('FORBIDDEN');
    });

    it('denies brand access when allowedBrands is an empty array (R3-18)', () => {
      const emptyScopedUser: AuthenticatedUser = {
        ...baseEditor,
        allowedBrands: [], // Empty list must deny
      };
      const err = requireBrandAccess(emptyScopedUser, 'realtutorialhub');
      expect(err).not.toBeNull();
      expect(err?.type).toBe('FORBIDDEN');
    });

    it('sidebar POST rejects when unauthorized subtopic is nested anywhere in submitted tree (R3-20)', async () => {
      setAccountAuthority({
        async getCurrentAccount(input) {
          return {
            id: input.originalUserId,
            email: 'scoped@skillhubcore.in',
            role: 'admin',
            platform: 'skillhubcore',
            isActive: true,
          };
        },
      });

      // User permitted only for 'allowed-subtopic-1'
      const token = await createToken({
        allowedSubtopics: ['allowed-subtopic-1'],
        brand: 'skillhubcore',
      });

      // Submit tree containing a nested unauthorized node
      const req = new NextRequest('https://admin.skillhubcore.in/api/tutorial-left-sidebar', {
        method: 'POST',
        headers: {
          cookie: `accessToken=${token}`,
          origin: 'https://admin.skillhubcore.in',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          brandId: 'shared',
          domainId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          subjectId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          topicId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          sourceFormat: 'json',
          sourceContent: '{}',
          status: 'draft',
          tree: {
            topics: [
              {
                id: 'allowed-subtopic-1',
                name: 'Allowed Section',
                type: 'group',
                children: [
                  {
                    id: 'unauthorized-subtopic-999', // Nested unauthorized subtopic
                    name: 'Privileged Hidden Section',
                    type: 'page',
                  },
                ],
              },
            ],
          },
        }),
      });

      const response = await sidebarPost(req);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Forbidden');
    });

    it('sidebar POST rejects cross-tenant brand IDOR attempt', async () => {
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

      const token = await createToken({
        brand: 'skillhubcore',
        allowedBrands: ['skillup'],
      });

      // Send brandId: 'realtutorialhub'
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
      expect(response.status).toBe(403);
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
});
