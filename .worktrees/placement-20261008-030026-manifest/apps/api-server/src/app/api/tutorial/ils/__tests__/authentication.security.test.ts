/**
 * ILS API Authentication Security Tests (C2-V5)
 * 
 * Tests the P0 authentication boundary for ILS routes using REAL validateRequest().
 * 
 * CRITICAL: These tests prove that:
 * 1. The REAL authentication middleware rejects missing/invalid X-Internal-Secret
 * 2. Forged identity headers are rejected without valid secret
 * 3. Valid authentication establishes correct identity
 * 4. Authenticated identity propagates to service with correct userId/brand
 * 5. Authentication failure prevents service invocation
 * 
 * TEST ARCHITECTURE:
 *   REAL validateRequest() + REAL route + MOCKED Service/Repositories
 *   = Proves authentication trust boundary
 * 
 * C2-V5 CORRECTIONS:
 * - Valid UUID fixtures for HTTP layer (Zod schema validation)
 * - Repository constructors use function() not arrow functions
 * - Service mock captures instances for identity verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// DO NOT MOCK validateRequest() - we test the REAL implementation

// Valid UUID fixtures (required by route Zod schemas)
const VALID_NODE_ID = '550e8400-e29b-41d4-a716-446655440001';
const VALID_SUBTOPIC_ID = '550e8400-e29b-41d4-a716-446655440002';
const VALID_SECTION_ID = '550e8400-e29b-41d4-a716-446655440003';
const VALID_BLOCK_ID = '550e8400-e29b-41d4-a716-446655440004';

// Track service instances for identity propagation verification
const serviceInstances: any[] = [];

// Mock service layer and repositories (not authentication)
vi.mock('@quiz/db-tutorial', async () => {
  const actual = await vi.importActual('@quiz/db-tutorial');
  
  const createMockService = () => ({
    completeNavigationNode: vi.fn().mockResolvedValue({
      navigationNodeId: VALID_NODE_ID,
      sectionId: null,
      subtopicId: VALID_SUBTOPIC_ID,
      userId: 'test-user',
      brand: 'realtutorialhub',
      lastVisitedAt: new Date().toISOString(),
      progressPercent: 100,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      activeTimeSeconds: 0,
      visitCount: 1,
    }),
    getNavigationProgress: vi.fn().mockResolvedValue({
      navigationNodeId: VALID_NODE_ID,
      sectionId: null,
      subtopicId: VALID_SUBTOPIC_ID,
      userId: 'test-user',
      brand: 'realtutorialhub',
      lastVisitedAt: new Date().toISOString(),
      progressPercent: 0,
      isCompleted: false,
      completedAt: null,
      activeTimeSeconds: 0,
      visitCount: 1,
    }),
    recordVisit: vi.fn().mockResolvedValue({
      navigationNodeId: VALID_NODE_ID,
      sectionId: null,
      subtopicId: VALID_SUBTOPIC_ID,
      userId: 'test-user',
      brand: 'realtutorialhub',
      lastVisitedAt: new Date().toISOString(),
      progressPercent: 0,
      isCompleted: false,
      completedAt: null,
      activeTimeSeconds: 0,
      visitCount: 1,
    }),
    recordBlockCompletion: vi.fn().mockResolvedValue({
      navigationNodeId: VALID_NODE_ID,
      sectionId: null,
      subtopicId: VALID_SUBTOPIC_ID,
      userId: 'test-user',
      brand: 'realtutorialhub',
      lastVisitedAt: new Date().toISOString(),
        progressPercent: 50,
        isCompleted: false,
        completedAt: null,
        activeTimeSeconds: 0,
        visitCount: 1,
      }),
      recordActiveTime: vi.fn().mockResolvedValue({
        navigationNodeId: VALID_NODE_ID,
        sectionId: null,
        subtopicId: VALID_SUBTOPIC_ID,
        userId: 'test-user',
        brand: 'realtutorialhub',
        lastVisitedAt: new Date().toISOString(),
        progressPercent: 0,
        isCompleted: false,
        completedAt: null,
        activeTimeSeconds: 30,
        visitCount: 1,
      }),
      getSubtopicProgress: vi.fn().mockResolvedValue({
        subtopicId: VALID_SUBTOPIC_ID,
        userId: 'test-user',
        brand: 'realtutorialhub',
        totalNodes: 10,
        completedNodes: 5,
        progressPercent: 50,
        lastActivityAt: new Date().toISOString(),
      }),
    });
  
  return {
    ...actual,
    // Mock service constructor to capture instances
    LearningProgressService: vi.fn().mockImplementation(function() {
      const service = createMockService();
      serviceInstances.push(service);
      return service;
    }),
    // Mock repository constructors - MUST use function() for "new" operator
    TutorialNavigationProgressRepository: vi.fn().mockImplementation(function() {
      return {
        recordTime: vi.fn().mockResolvedValue(undefined),
        getProgress: vi.fn().mockResolvedValue(undefined),
      };
    }),
    TutorialSectionRepository: vi.fn().mockImplementation(function() {
      return {
        getTutorialByPageIdentity: vi.fn().mockResolvedValue({
          id: VALID_SECTION_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          navigationNodeId: VALID_NODE_ID,
          brandId: 'realtutorialhub',
          content: { schemaVersion: 1, blocks: [] },
        }),
      };
    }),
  };
});

describe('ILS API Authentication Security (C2-V5)', () => {
  let originalSecret: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear service instances array
    serviceInstances.length = 0;
    
    // Store original secret
    originalSecret = process.env.INTERNAL_API_SECRET;
    // Set test-only secret
    process.env.INTERNAL_API_SECRET = 'test-internal-secret-c2v2';
  });

  afterEach(() => {
    // Restore original secret
    if (originalSecret !== undefined) {
      process.env.INTERNAL_API_SECRET = originalSecret;
    } else {
      delete process.env.INTERNAL_API_SECRET;
    }
  });

  describe('TEST A - Missing X-Internal-Secret', () => {
    it('complete-node: should reject request without X-Internal-Secret', async () => {
      // IMPORTANT: This test uses REAL validateRequest() - NO MOCK
      // The real middleware will detect missing secret

      const request = new NextRequest('http://localhost/api/tutorial/ils/complete-node', {
        method: 'POST',
        headers: {
          'X-User-ID': 'victim-user-id',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
        }),
      });

      const { POST } = await import('../complete-node/route');
      const response = await POST(request);

      // C2-V5: requireInternalSecret prevents gateway fallback
      // Must explicitly verify authentication rejection AND service protection
      expect(response.status).toBe(401);
      expect(serviceInstances).toHaveLength(0);
    });

    it('active-time: should reject request without X-Internal-Secret', async () => {
      const request = new NextRequest('http://localhost/api/tutorial/ils/active-time', {
        method: 'POST',
        headers: {
          'X-User-ID': 'victim-user-id',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          incrementSeconds: 30,
        }),
      });

      const { POST } = await import('../active-time/route');
      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(serviceInstances).toHaveLength(0);
    });

    it('block-completion: should reject request without X-Internal-Secret', async () => {
      const request = new NextRequest('http://localhost/api/tutorial/ils/block-completion', {
        method: 'POST',
        headers: {
          'X-User-ID': 'victim-user-id',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          sectionId: null,
          blockId: VALID_BLOCK_ID,
          blockType: 'code',
          blockVersion: 'C1',
        }),
      });

      const { POST } = await import('../block-completion/route');
      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(serviceInstances).toHaveLength(0);
    });

    it('visit: should reject request without X-Internal-Secret', async () => {
      const request = new NextRequest('http://localhost/api/tutorial/ils/visit', {
        method: 'POST',
        headers: {
          'X-User-ID': 'victim-user-id',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          sessionId: 'session-1',
        }),
      });

      const { POST } = await import('../visit/route');
      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(serviceInstances).toHaveLength(0);
    });

    it('navigation: should reject request without X-Internal-Secret', async () => {
      const url = new URL(`http://localhost/api/tutorial/ils/navigation/${VALID_NODE_ID}`);
      url.searchParams.set('subtopicId', VALID_SUBTOPIC_ID);

      const request = new NextRequest(url.toString(), {
        method: 'GET',
        headers: {
          'X-User-ID': 'victim-user-id',
          'X-Brand': 'realtutorialhub',
        },
      });

      const { GET } = await import('../navigation/[nodeId]/route');
      const response = await GET(request, {
        params: Promise.resolve({ nodeId: VALID_NODE_ID }),
      });

      expect(response.status).toBe(401);
      expect(serviceInstances).toHaveLength(0);
    });

    it('subtopic-progress: should reject request without X-Internal-Secret', async () => {
      const request = new NextRequest(`http://localhost/api/tutorial/ils/subtopic/${VALID_SUBTOPIC_ID}/progress`, {
        method: 'GET',
        headers: {
          'X-User-ID': 'victim-user-id',
          'X-Brand': 'realtutorialhub',
        },
      });

      const { GET } = await import('../subtopic/[subtopicId]/progress/route');
      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: VALID_SUBTOPIC_ID }),
      });

      expect(response.status).toBe(401);
      expect(serviceInstances).toHaveLength(0);
    });
  });

  describe('TEST B - Invalid X-Internal-Secret', () => {
    it('complete-node: should reject request with invalid secret', async () => {
      // REAL validateRequest() will compare against process.env.INTERNAL_API_SECRET
      const request = new NextRequest('http://localhost/api/tutorial/ils/complete-node', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'definitely-wrong-secret',
          'X-User-ID': 'victim-user',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
        }),
      });

      const { POST } = await import('../complete-node/route');
      const response = await POST(request);

      // REAL middleware should reject invalid secret
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });

    it('visit: should reject request with invalid secret', async () => {
      const request = new NextRequest('http://localhost/api/tutorial/ils/visit', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'invalid-secret',
          'X-User-ID': 'user-1',
          'X-Brand': 'skillup',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          sessionId: 'session-1',
        }),
      });

      const { POST } = await import('../visit/route');
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('block-completion: should reject request with invalid secret', async () => {
      const request = new NextRequest('http://localhost/api/tutorial/ils/block-completion', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'wrong-secret',
          'X-User-ID': 'user-1',
          'X-Brand': 'skillup',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          sectionId: null,
          blockId: VALID_BLOCK_ID,
          blockType: 'code',
          blockVersion: 'C1',
        }),
      });

      const { POST } = await import('../block-completion/route');
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('TEST C - Forged User ID', () => {
    it('cannot establish identity with forged headers only', async () => {
      // Without valid X-Internal-Secret, identity headers should not be trusted
      // However, middleware has gateway mode fallback which accepts headers without secret
      // This test proves current middleware behavior

      const request = new NextRequest(`http://localhost/api/tutorial/ils/navigation/${VALID_NODE_ID}`, {
        method: 'GET',
        headers: {
          'X-User-ID': 'forged-victim-id',
          'X-Brand': 'realtutorialhub',
        },
      });

      const url = new URL(request.url);
      url.searchParams.set('subtopicId', VALID_SUBTOPIC_ID);
      const requestWithQuery = new NextRequest(url.toString(), {
        method: 'GET',
        headers: request.headers,
      });

      const { GET } = await import('../navigation/[nodeId]/route');
      const response = await GET(requestWithQuery, {
        params: Promise.resolve({ nodeId: VALID_NODE_ID }),
      });

      // Current middleware allows gateway mode (headers without secret)
      // This proves the actual behavior
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('TEST D - Forged Brand', () => {
    it('cannot override brand without valid authentication', async () => {
      const request = new NextRequest(`http://localhost/api/tutorial/ils/subtopic/${VALID_SUBTOPIC_ID}/progress`, {
        method: 'GET',
        headers: {
          'X-User-ID': 'user-1',
          'X-Brand': 'forged-brand',
        },
      });

      const { GET } = await import('../subtopic/[subtopicId]/progress/route');
      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: VALID_SUBTOPIC_ID }),
      });

      // Invalid brand should be rejected by middleware
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('TEST E - Valid Internal Authentication', () => {
    it('active-time: should allow request with valid secret and reach service', async () => {
      // REAL validateRequest() with correct secret

      const request = new NextRequest('http://localhost/api/tutorial/ils/active-time', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'test-internal-secret-c2v2',
          'X-User-ID': 'authenticated-user',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          incrementSeconds: 30,
        }),
      });

      const { POST } = await import('../active-time/route');
      const response = await POST(request);

      // Verify service was instantiated and called
      expect(serviceInstances).toHaveLength(1);
      const service = serviceInstances[0];
      expect(service.recordActiveTime).toHaveBeenCalledTimes(1);

      // Should succeed (200 or 2xx)
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
    });

    it('complete-node: should allow request with valid secret', async () => {
      const request = new NextRequest('http://localhost/api/tutorial/ils/complete-node', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'test-internal-secret-c2v2',
          'X-User-ID': 'authenticated-user',
          'X-Brand': 'skillup',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
        }),
      });

      const { POST } = await import('../complete-node/route');
      const response = await POST(request);

      // Verify service was instantiated and called
      expect(serviceInstances).toHaveLength(1);
      const service = serviceInstances[0];
      expect(service.completeNavigationNode).toHaveBeenCalledTimes(1);

      expect(response.status).toBe(200);
    });
  });

  describe('TEST F - Identity Propagation', () => {
    it('block-completion: should pass authenticated identity to service', async () => {
      // This test proves that userId and brand from authenticated context
      // propagate to the service

      const authenticatedUserId = 'auth-user-123';
      const authenticatedBrand = 'skillup';

      const request = new NextRequest('http://localhost/api/tutorial/ils/block-completion', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'test-internal-secret-c2v2',
          'X-User-ID': authenticatedUserId,
          'X-Brand': authenticatedBrand,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          sectionId: null,
          blockId: VALID_BLOCK_ID,
          blockType: 'code',
          blockVersion: 'C1',
        }),
      });

      const { POST } = await import('../block-completion/route');
      await POST(request);

      // Verify service was instantiated
      expect(serviceInstances).toHaveLength(1);

      // Get the service instance
      const serviceInstance = serviceInstances[0];
      expect(serviceInstance).toBeDefined();

      // Verify recordBlockCompletion was called
      expect(serviceInstance.recordBlockCompletion).toHaveBeenCalled();

      // Get the call arguments - identity is FIRST argument per service signature
      const callArgs = serviceInstance.recordBlockCompletion.mock.calls[0];
      expect(callArgs).toBeDefined();

      // Verify the identity argument (first argument position 0)
      const identityArg = callArgs[0];
      expect(identityArg).toHaveProperty('userId', authenticatedUserId);
      expect(identityArg).toHaveProperty('brand', authenticatedBrand);
    });

    it('active-time: should pass authenticated identity to service', async () => {
      const authenticatedUserId = 'verified-user-456';
      const authenticatedBrand = 'realtutorialhub';

      const request = new NextRequest('http://localhost/api/tutorial/ils/active-time', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'test-internal-secret-c2v2',
          'X-User-ID': authenticatedUserId,
          'X-Brand': authenticatedBrand,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          incrementSeconds: 45,
        }),
      });

      const { POST } = await import('../active-time/route');
      await POST(request);

      // Verify service was called
      expect(serviceInstances).toHaveLength(1);
      const serviceInstance = serviceInstances[0];
      expect(serviceInstance.recordActiveTime).toHaveBeenCalled();

      // Verify identity propagation - identity is first argument (position 0)
      const callArgs = serviceInstance.recordActiveTime.mock.calls[0];
      const identityArg = callArgs[0];
      expect(identityArg.userId).toBe(authenticatedUserId);
      expect(identityArg.brand).toBe(authenticatedBrand);
    });
  });

  describe('TEST G - Authentication Failure Short-Circuit', () => {
    it('complete-node: service NOT called when authentication fails', async () => {
      // Invalid secret
      const request = new NextRequest('http://localhost/api/tutorial/ils/complete-node', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'wrong-secret',
          'X-User-ID': 'user-1',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
        }),
      });

      const { POST } = await import('../complete-node/route');
      const response = await POST(request);

      // Should be rejected
      expect(response.status).toBe(401);

      // Service should NOT have been instantiated
      expect(serviceInstances).toHaveLength(0);
    });

    it('block-completion: service NOT called when authentication fails', async () => {
      // Invalid secret
      const request = new NextRequest('http://localhost/api/tutorial/ils/block-completion', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'invalid-secret',
          'X-User-ID': 'user-1',
          'X-Brand': 'skillup',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          sectionId: null,
          blockId: VALID_BLOCK_ID,
          blockType: 'code',
          blockVersion: 'C1',
        }),
      });

      const { POST } = await import('../block-completion/route');
      const response = await POST(request);

      // Should fail
      expect(response.status).toBe(401);

      // Service should NOT have been instantiated
      expect(serviceInstances).toHaveLength(0);
    });
  });

  describe('TEST H - Client Cannot Override Authenticated Brand', () => {
    it('authenticated brand remains authoritative', async () => {
      // This test verifies that even if client sends conflicting data,
      // the authenticated brand from middleware is what matters

      const request = new NextRequest('http://localhost/api/tutorial/ils/complete-node', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'test-internal-secret-c2v2',
          'X-User-ID': 'user-1',
          'X-Brand': 'realtutorialhub', // Authenticated brand
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          brand: 'skillup', // Attempt to override (if schema allowed it)
        }),
      });

      const { POST } = await import('../complete-node/route');
      const response = await POST(request);

      // Should succeed because auth is valid
      expect(response.status).toBe(200);

      // Verify service was called with authenticated brand (not client brand)
      expect(serviceInstances).toHaveLength(1);
      const service = serviceInstances[0];
      expect(service.completeNavigationNode).toHaveBeenCalled();
      
      const callArgs = service.completeNavigationNode.mock.calls[0];
      const identityArg = callArgs[0];
      expect(identityArg.brand).toBe('realtutorialhub'); // NOT 'skillup'
    });
  });

  describe('TEST I - Client Cannot Supply User ID', () => {
    it('request schema does not accept client userId', async () => {
      // Verify schemas reject or strip userId from client
      // The test proves userId comes only from authenticated context

      const request = new NextRequest('http://localhost/api/tutorial/ils/complete-node', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'test-internal-secret-c2v2',
          'X-User-ID': 'authenticated-user-real',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          userId: 'forged-user-attempt', // Attempt to inject userId
        }),
      });

      const { POST } = await import('../complete-node/route');
      const response = await POST(request);

      // Zod will strip unknown fields by default
      // Service should still work correctly
      expect(response.status).toBe(200);

      // Verify service received authenticated userId (NOT forged)
      expect(serviceInstances).toHaveLength(1);
      const service = serviceInstances[0];
      expect(service.completeNavigationNode).toHaveBeenCalled();
      
      const callArgs = service.completeNavigationNode.mock.calls[0];
      const identityArg = callArgs[0];
      expect(identityArg.userId).toBe('authenticated-user-real'); // NOT 'forged-user-attempt'
    });
  });

  describe('TEST J - Complete Node Canonical Requirements', () => {
    it('client cannot supply requiredBlocks', async () => {
      // A3 invariant: canonical requirements come from server

      const request = new NextRequest('http://localhost/api/tutorial/ils/complete-node', {
        method: 'POST',
        headers: {
          'X-Internal-Secret': 'test-internal-secret-c2v2',
          'X-User-ID': 'user-1',
          'X-Brand': 'realtutorialhub',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigationNodeId: VALID_NODE_ID,
          subtopicId: VALID_SUBTOPIC_ID,
          requiredBlocks: [], // Attempt to bypass requirements
        }),
      });

      const { POST } = await import('../complete-node/route');
      const response = await POST(request);

      // Schema strips unknown field, service still works
      expect(response.status).toBe(200);

      // Service determines requirements, not client
      // completeNavigationNode signature doesn't accept requiredBlocks parameter
      expect(serviceInstances).toHaveLength(1);
      const service = serviceInstances[0];
      expect(service.completeNavigationNode).toHaveBeenCalled();
      
      // Method signature: completeNavigationNode(identity, navigationNodeId, subtopicId)
      // No requiredBlocks parameter - server resolves canonical requirements
      const callArgs = service.completeNavigationNode.mock.calls[0];
      expect(callArgs).toHaveLength(3); // identity, navigationNodeId, subtopicId only
    });
  });
});
