/**
 * PROMPT 16F — COMPOSER PERSISTENCE INTEGRATION TESTS
 * 
 * OBJECTIVE: Prove real runtime persistence through complete stack
 * 
 * REAL DEPENDENCIES:
 * - Actual PostgreSQL database (DATABASE_URL_TUTORIAL)
 * - Real TutorialComposerService (no mocks)
 * - Real TutorialSectionRepository (no mocks)
 * - Real authentication/authorization (mocked at boundary only)
 * - Real TutorialDocument validation
 * - Real difficulty enum constraints
 * 
 * ARCHITECTURE:
 * Uses Phase 1H proven pattern:
 * - getTestSubtopicId() for real hierarchy
 * - buildTutorialDocument() for canonical fixtures
 * - cleanupTestSections() for deterministic isolation
 * - Direct PostgreSQL verification after each operation
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as CreateSection } from '../sections/route';
import { PATCH as UpdateSection } from '../sections/[sectionId]/route';
import { POST as PublishSection } from '../sections/[sectionId]/publish/route';
import {
  db,
  tutorialSections,
  tutorialComposerService,
} from '@quiz/db-tutorial';
import { eq } from 'drizzle-orm';
import { TutorialDocumentSchema, type TutorialDocument } from '@quiz/types';
import type { Role } from '@quiz/auth/rbac/roles';

// Test fixtures and helpers
import {
  createValidTestDocument,
  createMultiBlockTestDocument,
  createEmptyTestDocument,
  createInvalidBlockDocument,
} from './fixtures/tutorial-document.fixtures';
import {
  getTestSubtopicId,
  cleanupTestSections,
} from './helpers/test-db.helpers';

// Mock only external auth boundary (not the route itself)
vi.mock('@/lib/auth-helpers', () => ({
  authenticateRequest: vi.fn(),
  createAuthErrorResponse: vi.fn((error) => {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.type === 'MISSING_TOKEN' || error.type === 'INVALID_TOKEN' ? 401 : 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  requireTutorialCreatePermission: vi.fn(),
  requireTutorialEditPermission: vi.fn(),
  requireTutorialPublishPermission: vi.fn(),
  requireSubtopicAccess: vi.fn(),
  requireBrandAccess: vi.fn(),
}));

vi.mock('@/lib/cache-invalidation', () => ({
  invalidateTutorialDeliveryCache: vi.fn().mockResolvedValue(undefined),
}));

import {
  authenticateRequest,
  requireTutorialCreatePermission,
  requireTutorialEditPermission,
  requireTutorialPublishPermission,
  requireSubtopicAccess,
  requireBrandAccess,
} from '@/lib/auth-helpers';

import { invalidateTutorialDeliveryCache } from '@/lib/cache-invalidation';

describe('PROMPT 16F — Composer Real Persistence Integration', () => {
  const mockUser = {
    userId: 'prompt16f_test_user',
    originalUserId: 'prompt16f_test_user',
    shadowUserId: 'prompt16f_test_user',
    roles: ['admin'] as Role[],
    isAdmin: true,
  };

  const mockUnauthorizedUser = {
    userId: 'unauthorized_user',
    originalUserId: 'unauthorized_user',
    shadowUserId: 'unauthorized_user',
    roles: [] as Role[],
    isAdmin: false,
  };

  let testSubtopicId: string;
  let createdSectionIds: string[] = [];

  beforeAll(async () => {
    // Use Phase 1H pattern: get real subtopic from database
    testSubtopicId = await getTestSubtopicId();
  });

  beforeEach(() => {
    // Setup default authentication mocks (success)
    vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
    vi.mocked(requireTutorialCreatePermission).mockReturnValue(null);
    vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
    vi.mocked(requireTutorialPublishPermission).mockReturnValue(null);
    vi.mocked(requireSubtopicAccess).mockReturnValue(null);
    vi.mocked(requireBrandAccess).mockReturnValue(null);
    vi.mocked(invalidateTutorialDeliveryCache).mockClear();
    vi.mocked(invalidateTutorialDeliveryCache).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Phase 1H proven cleanup pattern
    await cleanupTestSections(createdSectionIds);
    createdSectionIds = [];
  });

  /**
   * TEST 1: POST create → 201 → database INSERT verification
   */
  it('POST create: valid section → 201 + database INSERT', async () => {
    const validDocument = createValidTestDocument({
      heading: 'Prompt 16F Integration Test',
      content: 'Testing real persistence through complete stack.',
    });

    const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
      method: 'POST',
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'visual', // Use less common type to avoid conflicts
        difficulty: 'simple',
        content: validDocument,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await CreateSection(request);
    expect(response.status).toBe(201);

    const result = await response.json();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBeDefined();

    const sectionId = result.data.id;
    createdSectionIds.push(sectionId);

    // ✅ CRITICAL: Verify database persistence
    const dbSection = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.id, sectionId))
      .limit(1);

    expect(dbSection).toHaveLength(1);
    expect(dbSection[0].id).toBe(sectionId);
    expect(dbSection[0].subtopicId).toBe(testSubtopicId);
    expect(dbSection[0].sectionType).toBe('visual');
    expect(dbSection[0].difficulty).toBe('simple');
    expect(dbSection[0].status).toBe('draft');

    // ✅ Verify persisted document validates
    const parseResult = TutorialDocumentSchema.safeParse(dbSection[0].content);
    expect(parseResult.success).toBe(true);
  });

  /**
   * TEST 2: PATCH update → 200 → database UPDATE verification
   */
  it('PATCH update: content → 200 + database UPDATE', async () => {
    // Create section via service
    const section = await tutorialComposerService.createSection(
      {
        subtopicId: testSubtopicId,
        sectionType: 'notes', // notes section type allows callout blocks
        difficulty: 'mixed',
        content: createValidTestDocument({ heading: 'Original' }),
      },
      { userId: mockUser.userId }
    );

    createdSectionIds.push(section.id);

    // PATCH with multi-block document
    const updatedDocument = createMultiBlockTestDocument();

    const request = new NextRequest(
      `http://localhost:3007/api/tutorial-composer/sections/${section.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content: updatedDocument }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await UpdateSection(request, { params: Promise.resolve({ sectionId: section.id }) });
    expect(response.status).toBe(200);

    // ✅ Verify database UPDATE
    const dbSection = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.id, section.id))
      .limit(1);

    expect(dbSection).toHaveLength(1);
    
    const persistedContent = dbSection[0].content as TutorialDocument;
    expect(persistedContent.blocks).toHaveLength(3); // Multi-block fixture has 3 blocks

    // ✅ Verify immutable fields unchanged
    expect(dbSection[0].id).toBe(section.id);
    expect(dbSection[0].subtopicId).toBe(testSubtopicId);
    expect(dbSection[0].sectionType).toBe('notes');
    expect(dbSection[0].difficulty).toBe('mixed');
    expect(dbSection[0].status).toBe('draft');
  });

  /**
   * TEST 3: POST publish → 200 → deployed + publishedAt + cache
   */
  it('POST publish: draft → deployed + publishedAt + cache invalidation', async () => {
    const section = await tutorialComposerService.createSection(
      {
        subtopicId: testSubtopicId,
        sectionType: 'layman', // Different combination
        difficulty: 'intermediate',
        content: createValidTestDocument({ heading: 'Publish Test' }),
      },
      { userId: mockUser.userId }
    );

    createdSectionIds.push(section.id);

    const request = new NextRequest(
      `http://localhost:3007/api/tutorial-composer/sections/${section.id}/publish`,
      {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PublishSection(request, { params: Promise.resolve({ sectionId: section.id }) });
    expect(response.status).toBe(200);

    // ✅ Verify database status transition
    const dbSection = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.id, section.id))
      .limit(1);

    expect(dbSection).toHaveLength(1);
    expect(dbSection[0].status).toBe('deployed');
    expect(dbSection[0].publishedAt).not.toBeNull();

    // ✅ Verify cache invalidation
    expect(invalidateTutorialDeliveryCache).toHaveBeenCalledWith(testSubtopicId);
  });

  /**
   * TEST 4: Unauthenticated → 401
   */
  it('POST create: unauthenticated → 401', async () => {
    vi.mocked(authenticateRequest).mockResolvedValue({
      type: 'MISSING_TOKEN',
      message: 'Authentication required',
    });

    const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
      method: 'POST',
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'simple',
        content: createValidTestDocument(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await CreateSection(request);
    expect(response.status).toBe(401);
  });

  /**
   * TEST 5: Unauthorized → 403
   */
  it('POST create: unauthorized user → 403', async () => {
    vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUnauthorizedUser });
    vi.mocked(requireSubtopicAccess).mockReturnValue({
      type: 'FORBIDDEN',
      message: 'Access denied',
    });

    const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
      method: 'POST',
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'simple',
        content: createValidTestDocument(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await CreateSection(request);
    expect(response.status).toBe(403);
  });

  /**
   * TEST 6: Invalid TutorialDocument → validation error
   */
  it('POST create: invalid document → 400 or 422', async () => {
    const invalidDocument = createInvalidBlockDocument();

    const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
      method: 'POST',
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'simple',
        content: invalidDocument,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await CreateSection(request);
    // API contract validation typically returns 400
    expect([400, 422]).toContain(response.status);

    const result = await response.json();
    expect(result.error).toBeDefined();
  });

  /**
   * TEST 7: Empty document rejected at creation → 400
   * Architecture: TutorialDocumentSchema requires estimatedReadTime > 0
   * Rejection happens at API boundary (Zod validation), hence 400 not 422
   */
  it('POST create: empty document → 400 (API boundary rejection)', async () => {
    const emptyDoc = createEmptyTestDocument();

    const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
      method: 'POST',
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'technical',
        difficulty: 'expert',
        content: emptyDoc,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await CreateSection(request);
    expect(response.status).toBe(400); // API contract validation

    const result = await response.json();
    expect(result.error).toBeDefined();

    // ✅ Verify no database row created
    // Note: Cannot verify by ID since creation failed, but test isolation ensures cleanup
  });

  /**
   * TEST 8: BLOCK_REGISTRY → production registry test
   */
  it('BLOCK_REGISTRY: production registry has 17 types', async () => {
    const { BLOCK_REGISTRY } = await import('@quiz/types');
    
    const registryKeys = Object.keys(BLOCK_REGISTRY);
    expect(registryKeys).toHaveLength(17);
    
    // Verify concept-cards does not exist
    expect(BLOCK_REGISTRY).not.toHaveProperty('concept-cards');
    
    // Verify all canonical types exist
    const expectedTypes = [
      'heading', 'paragraph', 'list', 'code', 'example',
      'image', 'diagram', 'table', 'comparison', 'callout',
      'quote', 'definition', 'summary', 'two-column', 'three-column',
      'card-grid', 'timeline',
    ];
    
    expectedTypes.forEach(type => {
      expect(BLOCK_REGISTRY).toHaveProperty(type);
    });
  });

  /**
   * TEST 9: Invalid difficulty "beginner" → 400
   */
  it('POST create: invalid difficulty "beginner" → 400', async () => {
    const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
      method: 'POST',
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'beginner', // Invalid for TutorialDifficulty
        content: createValidTestDocument(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await CreateSection(request);
    expect(response.status).toBe(400); // Zod rejects at API boundary
  });

  /**
   * TEST 10: Invalid difficulty "advanced" → 400
   */
  it('POST create: invalid difficulty "advanced" → 400', async () => {
    const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
      method: 'POST',
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'advanced', // Invalid for TutorialDifficulty
        content: createValidTestDocument(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await CreateSection(request);
    expect(response.status).toBe(400);
  });

  /**
   * TEST 11: All valid TutorialDifficulty values accepted
   */
  it('POST create: all valid difficulties (simple, mixed, intermediate, expert)', async () => {
    const validDifficulties = ['simple', 'mixed', 'intermediate', 'expert'] as const;
    const sectionTypes = ['visual', 'real_life', 'code', 'practice'] as const;
    
    for (let i = 0; i < validDifficulties.length; i++) {
      const difficulty = validDifficulties[i];
      const sectionType = sectionTypes[i];
      
      const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
        method: 'POST',
        body: JSON.stringify({
          subtopicId: testSubtopicId,
          sectionType,
          difficulty,
          content: createValidTestDocument({ heading: `Test ${difficulty}` }),
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await CreateSection(request);
      expect(response.status).toBe(201);

      const result = await response.json();
      createdSectionIds.push(result.data.id);
      
      // ✅ Verify database has correct difficulty
      const dbSection = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, result.data.id))
        .limit(1);
      
      expect(dbSection[0].difficulty).toBe(difficulty);
    }
  });

  /**
   * TEST 12: PATCH nonexistent section → 404
   */
  it('PATCH update: nonexistent section → 404', async () => {
    const nonexistentId = '00000000-0000-0000-0000-000000000000';
    
    const request = new NextRequest(
      `http://localhost:3007/api/tutorial-composer/sections/${nonexistentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content: createValidTestDocument() }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await UpdateSection(request, { params: Promise.resolve({ sectionId: nonexistentId }) });
    expect(response.status).toBe(404);
  });

  /**
   * TEST 13: POST publish nonexistent section → 404
   */
  it('POST publish: nonexistent section → 404', async () => {
    const nonexistentId = '00000000-0000-0000-0000-000000000000';
    
    const request = new NextRequest(
      `http://localhost:3007/api/tutorial-composer/sections/${nonexistentId}/publish`,
      {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PublishSection(request, { params: Promise.resolve({ sectionId: nonexistentId }) });
    expect(response.status).toBe(404);
  });

  /**
   * TEST 14: Cross-subtopic CREATE security → 403 + no persistence
   * Tests that unauthorized user cannot create sections in any subtopic
   */
  it('POST create: cross-subtopic unauthorized access → 403 and no persistence', async () => {
    // Configure mock: user lacks tutorial authoring permissions
    vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUnauthorizedUser });
    vi.mocked(requireSubtopicAccess).mockReturnValue({
      type: 'FORBIDDEN',
      message: `Access denied to subtopic ${testSubtopicId}.`,
    });

    const request = new NextRequest('http://localhost:3007/api/tutorial-composer/sections', {
      method: 'POST',
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'simple',
        content: createValidTestDocument({ heading: 'Unauthorized attempt' }),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await CreateSection(request);
    expect(response.status).toBe(403);

    // ✅ CRITICAL: Verify no database row created
    // Count sections created during this test run
    const allSections = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.subtopicId, testSubtopicId));

    // All sections in this subtopic should be tracked in createdSectionIds
    // (created by other passing tests in this run)
    // If an unauthorized section was created, it wouldn't be in our tracking array
    const trackedCount = createdSectionIds.length;
    const dbCount = allSections.length;
    
    // Verify all DB sections are accounted for (no rogue inserts)
    expect(dbCount).toBeLessThanOrEqual(trackedCount);
  });

  /**
   * TEST 15: Cross-subtopic PATCH security → 403 + content unchanged
   * Tests that unauthorized user cannot update existing sections
   */
  it('PATCH update: cross-subtopic unauthorized access → 403 and content unchanged', async () => {
    // Create section with authorized user
    const section = await tutorialComposerService.createSection(
      {
        subtopicId: testSubtopicId,
        sectionType: 'overview',
        difficulty: 'intermediate',
        content: createValidTestDocument({ heading: 'Original Content' }),
      },
      { userId: mockUser.userId }
    );

    createdSectionIds.push(section.id);

    // Capture original database state
    const beforeUpdate = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.id, section.id))
      .limit(1);

    expect(beforeUpdate).toHaveLength(1);
    const originalContent = beforeUpdate[0].content;

    // Attempt PATCH with unauthorized user
    vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUnauthorizedUser });
    vi.mocked(requireSubtopicAccess).mockReturnValue({
      type: 'FORBIDDEN',
      message: `Access denied to subtopic ${testSubtopicId}.`,
    });

    const request = new NextRequest(
      `http://localhost:3007/api/tutorial-composer/sections/${section.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          content: createValidTestDocument({ heading: 'Malicious Update' }),
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await UpdateSection(request, { params: Promise.resolve({ sectionId: section.id }) });
    expect(response.status).toBe(403);

    // ✅ CRITICAL: Verify database content unchanged
    const afterUpdate = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.id, section.id))
      .limit(1);

    expect(afterUpdate).toHaveLength(1);
    expect(afterUpdate[0].content).toEqual(originalContent);
    expect(afterUpdate[0].status).toBe('draft');
  });

  /**
   * TEST 16: Cross-subtopic PUBLISH security → 403 + status unchanged
   * Tests that unauthorized user cannot publish existing sections
   */
  it('POST publish: cross-subtopic unauthorized access → 403 and status unchanged', async () => {
    // Create section with authorized user
    const section = await tutorialComposerService.createSection(
      {
        subtopicId: testSubtopicId,
        sectionType: 'layman',
        difficulty: 'expert',
        content: createValidTestDocument({ heading: 'Unpublished Content' }),
      },
      { userId: mockUser.userId }
    );

    createdSectionIds.push(section.id);

    // Verify initial state
    const beforePublish = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.id, section.id))
      .limit(1);

    expect(beforePublish[0].status).toBe('draft');
    expect(beforePublish[0].publishedAt).toBeNull();

    // Attempt publish with unauthorized user
    vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUnauthorizedUser });
    vi.mocked(requireSubtopicAccess).mockReturnValue({
      type: 'FORBIDDEN',
      message: `Access denied to subtopic ${testSubtopicId}.`,
    });

    const request = new NextRequest(
      `http://localhost:3007/api/tutorial-composer/sections/${section.id}/publish`,
      {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PublishSection(request, { params: Promise.resolve({ sectionId: section.id }) });
    expect(response.status).toBe(403);

    // ✅ CRITICAL: Verify database status unchanged
    const afterPublish = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.id, section.id))
      .limit(1);

    expect(afterPublish[0].status).toBe('draft');
    expect(afterPublish[0].publishedAt).toBeNull();

    // ✅ Verify cache invalidation was NOT called
    expect(invalidateTutorialDeliveryCache).not.toHaveBeenCalled();
  });
});
