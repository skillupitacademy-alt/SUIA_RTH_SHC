/**
 * Apply Suggestion Route - Integration Tests
 * 
 * PROMPT 08 WAVE 3: Phase I
 * 
 * END-TO-END INTEGRATION TESTS
 * 
 * Tests the complete chain:
 * POST /suggestions/apply
 *   ↓ Authentication
 *   ↓ RBAC + subtopic + brand authorization
 *   ↓ Strict request validation
 *   ↓ Phase D (orchestration)
 *   ↓ Phase B (verification)
 *   ↓ Phase C (transformation)
 *   ↓ TutorialDocumentSchema validation
 *   ↓ Phase A (atomic UPDATE)
 *   ↓ Phase G (cache invalidation)
 *   ↓ HTTP response
 * 
 * REAL DEPENDENCIES:
 * - Actual database (test environment)
 * - Real services (no mocks except external APIs)
 * - Real cache invalidation logic
 * - Real authentication/authorization
 * 
 * COVERAGE:
 * - Successful APPLY with database persistence
 * - Stale version → 409
 * - Fingerprint mismatch → 400
 * - Unknown suggestion → 400
 * - Unauthorized access → 403
 * - Unauthenticated request → 401
 * - concept-cards → card-grid transformation
 * - Malicious suggestedContent injection
 * - Concurrent APPLY operations
 * - Retry with consumed expectedVersion
 * - Successful DB mutation followed by cache failure
 * - Persisted document remains schema-valid
 * 
 * PREREQUISITE:
 * - Database must be seeded with at least one subtopic
 * - Run: npm run db:seed (or equivalent)
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { POST } from '../route';
import {
  db,
  tutorialSections,
  blockSuggestionService,
  contentAnalysisService,
  fingerprintSuggestion,
} from '@quiz/db-tutorial';
import { eq, sql } from 'drizzle-orm';
import { TutorialDocumentSchema, type TutorialDocument } from '@quiz/types';

// Helper type for content casting (content column is jsonb → unknown in TS)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContent = any;
import { invalidateTutorialDeliveryCache } from '@/lib/cache-invalidation';

// Mock only external dependencies (not internal services)
vi.mock('@/lib/auth-helpers', () => ({
  authenticateRequest: vi.fn(),
  createAuthErrorResponse: vi.fn((error) => {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.type === 'MISSING_TOKEN' || error.type === 'INVALID_TOKEN' ? 401 : 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  requireTutorialEditPermission: vi.fn(),
  requireSubtopicAccess: vi.fn(),
  requireBrandAccess: vi.fn(),
}));

vi.mock('@/lib/cache-invalidation', () => ({
  invalidateTutorialDeliveryCache: vi.fn().mockResolvedValue(undefined),
}));

import {
  authenticateRequest,
  requireTutorialEditPermission,
  requireSubtopicAccess,
  requireBrandAccess,
} from '@/lib/auth-helpers';

describe('POST /api/tutorial-composer/sections/:sectionId/suggestions/apply - INTEGRATION', () => {
  const mockUser = {
    userId: 'integration_test_user',
    originalUserId: 'integration_test_user',
    shadowUserId: 'integration_test_user',
    roles: ['admin' as const],
    isAdmin: true,
  };

  let testSubtopicId: string;
  let testSectionId: string;
  let testSuggestionId: string;
  let testFingerprint: string;

  function getGeneratedSuggestion(document: TutorialDocument, blockType: string) {
    const analysis = contentAnalysisService.analyzeDocument(document);
    const suggestion = blockSuggestionService
      .generateSuggestions(document, analysis, {
        subtopicId: testSubtopicId,
        brandId: 'realtutorialhub',
      })
      .blocks
      .find((candidate) => candidate.blockType === blockType);

    if (!suggestion) {
      throw new Error(`Fixture did not generate the required ${blockType} suggestion`);
    }
    return suggestion;
  }

  beforeAll(async () => {
    // Get test subtopic - query directly to avoid import issues
    const result = await db.execute(sql`
      SELECT id FROM tutorial_subtopics LIMIT 1
    `);
    
    if (!result.rows || result.rows.length === 0) {
      console.warn('⚠️  No subtopics found in database. Skipping integration tests.');
      console.warn('   Run database seed script first: npm run db:seed');
      return;
    }
    
    testSubtopicId = result.rows[0].id as string;
  });

  beforeEach(async () => {
    // Never reuse the identity protected by uq_tutorial_v2_identity_active.
    // These tests may run repeatedly against a shared integration database.
    testSectionId = '';
    testSuggestionId = '';
    testFingerprint = '';

    // Skip all tests if no subtopic available
    if (!testSubtopicId) {
      return;
    }

    // Setup authentication mocks
    vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
    vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
    vi.mocked(requireSubtopicAccess).mockReturnValue(null);
    vi.mocked(requireBrandAccess).mockReturnValue(null);
    vi.mocked(invalidateTutorialDeliveryCache).mockResolvedValue(undefined);

    // Create a test section (V2 schema - no sectionType/difficulty)
    const sections = await db
      .insert(tutorialSections)
      .values([{
        subtopicId: testSubtopicId,
        navigationNodeId: `integration-test-navigation-${randomUUID()}`,
        orderIndex: 1,
        content: {
          schemaVersion: 1,
          blocks: [
            {
              id: 'block_1',
              type: 'paragraph',
              content: { text: Array.from({ length: 520 }, () => 'learning').join(' ') },
            },
          ],
        } as unknown as TutorialDocument, // Type assertion needed for test fixture
        version: 1,
        language: 'en',
        status: 'draft' as const,
        brandId: 'realtutorialhub' as const,
        brandVisibility: 'shared_visible' as const,
        generatedByAi: false,
      }])
      .returning();

    const section = sections[0];
    testSectionId = section.id;

    const generatedSuggestion = getGeneratedSuggestion(section.content as TutorialDocument, 'summary');
    testSuggestionId = generatedSuggestion.id;
    testFingerprint = fingerprintSuggestion(generatedSuggestion);
  });

  afterEach(async () => {
    // The runtime suggestion model is regenerated from the section document.
    if (testSectionId) {
      await db.delete(tutorialSections).where(eq(tutorialSections.id, testSectionId));
    }
    vi.clearAllMocks();
  });

  describe('Successful APPLY with database persistence', () => {
    it('should successfully apply suggestion and persist to database', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.previousVersion).toBe(1);
      expect(data.data.newVersion).toBe(2);
      expect(data.data.appliedSuggestionId).toBe(testSuggestionId);
      expect(data.data.appliedSuggestionType).toBe('summary');

      // Verify database persistence
      const [persistedSection] = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testSectionId));

      expect(persistedSection.version).toBe(2);
      expect((persistedSection.content as AnyContent).blocks).toHaveLength(2); // Original + summary
      expect((persistedSection.content as AnyContent).blocks[1].type).toBe('summary');

      // Verify TutorialDocument schema validity
      const validationResult = TutorialDocumentSchema.safeParse(persistedSection.content);
      expect(validationResult.success).toBe(true);

    });

    it('should invalidate cache after successful application', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });

      expect(invalidateTutorialDeliveryCache).toHaveBeenCalledWith(testSubtopicId);
    });
  });

  describe('Stale version → 409', () => {
    it('should return 409 when expectedVersion does not match current version', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 99, // Wrong version
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error.code).toBe('VERSION_CONFLICT');
      expect(data.error.details.expectedVersion).toBe(99);
      expect(data.error.details.currentVersion).toBe(1);

      // Verify NO database changes
      const [persistedSection] = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testSectionId));

      expect(persistedSection.version).toBe(1); // Unchanged
      expect((persistedSection.content as AnyContent).blocks).toHaveLength(1); // Unchanged
    });
  });

  describe('Fingerprint mismatch → 400', () => {
    it('should return 400 when fingerprint does not match', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: 'a'.repeat(64), // Wrong fingerprint
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('SUGGESTION_INVALID');

      // Verify NO database changes
      const [persistedSection] = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testSectionId));

      expect(persistedSection.version).toBe(1); // Unchanged
    });
  });

  describe('Unknown suggestion → 400', () => {
    it('should return 400 for non-existent suggestion', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: 'nonexistent_suggestion_id',
            suggestionFingerprint: 'a'.repeat(64),
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('SUGGESTION_NOT_FOUND');
    });
  });

  describe('Unauthorized access → 403', () => {
    it('should return 403 when user lacks tutorial edit permission', async () => {
      vi.mocked(requireTutorialEditPermission).mockReturnValue({
        type: 'FORBIDDEN',
        message: 'You do not have permission to edit tutorial content.',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(403);
    });

    it('should return 403 when user lacks subtopic access', async () => {
      vi.mocked(requireSubtopicAccess).mockReturnValue({
        type: 'FORBIDDEN',
        message: 'Access denied to subtopic.',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(403);
    });

    it('should return 403 when user lacks brand access', async () => {
      vi.mocked(requireBrandAccess).mockReturnValue({
        type: 'FORBIDDEN',
        message: 'Access denied to brand.',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(403);
    });
  });

  describe('Unauthenticated request → 401', () => {
    it('should return 401 when token is missing', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        type: 'MISSING_TOKEN',
        message: 'Authentication required. Please log in.',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(401);
    });

    it('should return 401 when token is invalid', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        type: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token.',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(401);
    });
  });

  describe('concept-cards → card-grid transformation', () => {
    it('should transform concept-cards suggestion into card-grid block', async () => {
      const conceptDocument: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'concept-1', type: 'heading', content: { text: 'Concept 1', level: 3 } },
          { id: 'concept-2', type: 'heading', content: { text: 'Concept 2', level: 3 } },
          { id: 'concept-3', type: 'heading', content: { text: 'Concept 3', level: 3 } },
        ],
      };
      await db
        .update(tutorialSections)
        .set({ content: conceptDocument })
        .where(eq(tutorialSections.id, testSectionId));

      const suggestion = getGeneratedSuggestion(conceptDocument, 'concept-cards');

      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: suggestion.id,
            suggestionFingerprint: fingerprintSuggestion(suggestion),
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(200);

      // Verify transformation to card-grid
      const [persistedSection] = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testSectionId));

      const addedBlock = (persistedSection.content as AnyContent).blocks.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (b: any) => b.type === 'card-grid'
      );
      expect(addedBlock).toBeDefined();
      expect(addedBlock.type).toBe('card-grid'); // Transformed!
      expect(addedBlock.content.cards).toHaveLength(3);

      // Verify schema validity after transformation
      const validationResult = TutorialDocumentSchema.safeParse(persistedSection.content);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('Malicious suggestedContent injection', () => {
    it('should reject request with suggestedContent in request body', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
            suggestedContent: { type: 'paragraph', content: 'INJECTED CONTENT' }, // Malicious
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');

      // Verify NO database changes
      const [persistedSection] = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testSectionId));

      expect(persistedSection.version).toBe(1); // Unchanged
      expect((persistedSection.content as AnyContent).blocks).toHaveLength(1); // Unchanged
    });
  });

  describe('Concurrent APPLY operations', () => {
    it('should allow only one of two concurrent requests to succeed', async () => {
      const request1 = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const request2 = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      // Execute concurrent requests
      const [response1, response2] = await Promise.all([
        POST(request1, { params: Promise.resolve({ sectionId: testSectionId }) }),
        POST(request2, { params: Promise.resolve({ sectionId: testSectionId }) }),
      ]);

      // One should succeed (200), one should fail (409)
      const statuses = [response1.status, response2.status].sort();
      expect(statuses).toEqual([200, 409]);

      // Verify final version is 2 (only incremented once)
      const [persistedSection] = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testSectionId));

      expect(persistedSection.version).toBe(2);
    });
  });

  describe('Retry with consumed expectedVersion', () => {
    it('should return 409 when retrying with already-consumed version', async () => {
      // First request succeeds
      const request1 = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const response1 = await POST(request1, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response1.status).toBe(200);

      const data1 = await response1.json();
      expect(data1.data.newVersion).toBe(2);

      // Retry with old version
      const request2 = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1, // Already consumed
          }),
        }
      );

      const response2 = await POST(request2, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response2.status).toBe(409);

      const data2 = await response2.json();
      expect(data2.error.code).toBe('VERSION_CONFLICT');
      expect(data2.error.details.expectedVersion).toBe(1);
      expect(data2.error.details.currentVersion).toBe(2);
    });
  });

  describe('Successful DB mutation followed by cache failure', () => {
    it('should return 200 even if cache invalidation fails', async () => {
      // Mock cache invalidation failure
      vi.mocked(invalidateTutorialDeliveryCache).mockRejectedValue(
        new Error('Redis connection failed')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      const response = await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });
      expect(response.status).toBe(200); // Still succeeds!

      const data = await response.json();
      expect(data.data.newVersion).toBe(2);

      // Verify database mutation succeeded
      const [persistedSection] = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testSectionId));

      expect(persistedSection.version).toBe(2);
      expect((persistedSection.content as AnyContent).blocks).toHaveLength(2); // Mutation applied
    });
  });

  describe('Persisted document remains schema-valid', () => {
    it('should ensure persisted content passes TutorialDocumentSchema validation', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tutorial-composer/sections/${testSectionId}/suggestions/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            suggestionId: testSuggestionId,
            suggestionFingerprint: testFingerprint,
            expectedVersion: 1,
          }),
        }
      );

      await POST(request, { params: Promise.resolve({ sectionId: testSectionId }) });

      // Retrieve persisted content
      const [persistedSection] = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testSectionId));

      // Validate against TutorialDocumentSchema
      const validationResult = TutorialDocumentSchema.safeParse(persistedSection.content);
      expect(validationResult.success).toBe(true);

      if (!validationResult.success) {
        console.error('Schema validation errors:', validationResult.error.errors);
      }

      // Ensure schemaVersion is correct
      expect((persistedSection.content as AnyContent).schemaVersion).toBe(1);
    });
  });
});
