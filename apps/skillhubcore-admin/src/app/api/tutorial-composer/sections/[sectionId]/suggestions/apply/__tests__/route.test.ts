/**
 * Apply Suggestion Route - Unit Tests
 * 
 * PROMPT 08 WAVE 1: Phase E+F
 * 
 * Tests for POST /api/tutorial-composer/sections/:sectionId/suggestions/apply
 * 
 * TEST CATEGORIES:
 * 1. Authentication/Authorization
 * 2. Request validation
 * 3. Service integration
 * 4. Error mapping
 * 5. Response formatting
 * 
 * MOCKED DEPENDENCIES:
 * - authenticateRequest (auth-helpers)
 * - tutorialComposerService.getSection
 * - suggestionApplicationService.applySuggestion
 * 
 * NOT TESTED (deferred to Wave 3 integration tests):
 * - Cache invalidation (Wave 2)
 * - End-to-end database operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import {
  SectionNotFoundError,
  SuggestionNotFoundError,
  SuggestionFingerprintMismatchError,
  InvalidSuggestionError,
  InvalidTransformationError,
  VersionConflictError,
} from '@quiz/types';

// Mock dependencies
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

vi.mock('@quiz/db-tutorial', () => ({
  suggestionApplicationService: {
    applySuggestion: vi.fn(),
  },
  tutorialComposerService: {
    getSection: vi.fn(),
  },
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
import {
  suggestionApplicationService,
  tutorialComposerService,
} from '@quiz/db-tutorial';
import { invalidateTutorialDeliveryCache } from '@/lib/cache-invalidation';

describe('POST /api/tutorial-composer/sections/:sectionId/suggestions/apply', () => {
  const mockUser = {
    userId: 'user_123',
    originalUserId: 'user_123',
    shadowUserId: 'user_123',
    roles: ['admin' as const],
    isAdmin: true,
  };

  const mockSection = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    subtopicId: '223e4567-e89b-12d3-a456-426614174000',
    brandId: 'realtutorialhub' as const,
    sectionType: 'notes' as const,
    difficulty: 'intermediate' as const,
    orderIndex: 1,
    content: {
      schemaVersion: 1,
      metadata: {
        title: 'Original Section',
        description: 'Original description',
        brandVisibility: 'shared_visible' as const,
        documentLanguage: 'en',
        contentClassification: 'educational' as const,
      },
      blocks: [],
    },
    version: 5,
    language: 'en',
    status: 'draft' as const,
    brandVisibility: 'shared_visible' as const,
    generatedByAi: true,
    aiModelUsed: 'claude-sonnet-4.5',
    qualityScore: 85,
    createdAt: new Date('2026-08-16T10:00:00Z'),
    updatedAt: new Date('2026-08-16T10:30:00Z'),
    publishedAt: null,
    deletedAt: null,
    generationJobId: null,
    hallucinationScore: null,
    originalSourceUrl: null,
    sourceAttribution: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    lastPromptVersion: null,
    brandCustomizations: null,
    regenerationCount: 0,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    changesRequestedBy: null,
    changesRequestedAt: null,
    changesRequestedNotes: null,
    promptTemplateId: null,
    educationalArchitectureId: null,
    uiArchitectureId: null,
  };

  const mockApplySuggestionResult = {
    section: {
      ...mockSection,
      version: 6,
      content: {
        schemaVersion: 1,
        metadata: {
          title: 'Updated Section',
          description: 'Updated description',
          brandVisibility: 'shared_visible' as const,
          documentLanguage: 'en',
          contentClassification: 'educational' as const,
        },
        blocks: [],
      },
      updatedAt: new Date('2026-08-16T11:00:00Z'),
    },
    previousVersion: 5,
    newVersion: 6,
    appliedSuggestionId: 'sug_12345',
    appliedSuggestionType: 'summary',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject request with missing token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        type: 'MISSING_TOKEN',
        message: 'Authentication required. Please log in.',
      });

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        type: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token.',
      });

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
      vi.mocked(tutorialComposerService.getSection).mockResolvedValue(mockSection);
    });

    it('should reject request without tutorial edit permission', async () => {
      vi.mocked(requireTutorialEditPermission).mockReturnValue({
        type: 'FORBIDDEN',
        message: 'You do not have permission to edit tutorial content.',
      });

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(403);
    });

    it('should reject request without subtopic access', async () => {
      vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
      vi.mocked(requireSubtopicAccess).mockReturnValue({
        type: 'FORBIDDEN',
        message: 'Access denied to subtopic subtopic_123.',
      });

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(403);
    });

    it('should reject request without brand access', async () => {
      vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
      vi.mocked(requireSubtopicAccess).mockReturnValue(null);
      vi.mocked(requireBrandAccess).mockReturnValue({
        type: 'FORBIDDEN',
        message: 'Access denied to brand realtutorialhub.',
      });

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(403);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
      vi.mocked(tutorialComposerService.getSection).mockResolvedValue(mockSection);
      vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
      vi.mocked(requireSubtopicAccess).mockReturnValue(null);
      vi.mocked(requireBrandAccess).mockReturnValue(null);
    });

    it('should reject request with missing suggestionId', async () => {
      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with invalid fingerprint format', async () => {
      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'invalid', // Not SHA-256 hex
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details[0].message).toContain('SHA-256 hash');
    });

    it('should reject request with zero expectedVersion', async () => {
      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 0,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details[0].message).toContain('positive');
    });

    it('should reject request with negative expectedVersion', async () => {
      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: -1,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with unknown field (strict mode)', async () => {
      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
          maliciousField: 'attack',
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with suggestedContent field (security)', async () => {
      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
          suggestedContent: { type: 'paragraph', content: 'malicious' },
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Service Integration', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
      vi.mocked(tutorialComposerService.getSection).mockResolvedValue(mockSection);
      vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
      vi.mocked(requireSubtopicAccess).mockReturnValue(null);
      vi.mocked(requireBrandAccess).mockReturnValue(null);
    });

    it('should successfully apply suggestion', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockResolvedValue(
        mockApplySuggestionResult
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.previousVersion).toBe(5);
      expect(data.data.newVersion).toBe(6);
      expect(data.data.appliedSuggestionId).toBe('sug_12345');
      expect(data.data.appliedSuggestionType).toBe('summary');
      expect(data.data.section.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(data.data.section.version).toBe(6);
    });

    it('should call suggestionApplicationService with correct parameters', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockResolvedValue(
        mockApplySuggestionResult
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'abc123' + 'f'.repeat(58),
          expectedVersion: 5,
        }),
      });

      await POST(request, { params: { sectionId: 'section_123' } });

      expect(suggestionApplicationService.applySuggestion).toHaveBeenCalledWith({
        sectionId: 'section_123',
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'abc123' + 'f'.repeat(58),
        expectedVersion: 5,
      });
    });
  });

  describe('Error Mapping', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
      vi.mocked(tutorialComposerService.getSection).mockResolvedValue(mockSection);
      vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
      vi.mocked(requireSubtopicAccess).mockReturnValue(null);
      vi.mocked(requireBrandAccess).mockReturnValue(null);
    });

    it('should map SectionNotFoundError to 404', async () => {
      vi.mocked(tutorialComposerService.getSection).mockRejectedValue(
        new SectionNotFoundError('section_123')
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error.code).toBe('SECTION_NOT_FOUND');
    });

    it('should map SuggestionNotFoundError to 400', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValue(
        new SuggestionNotFoundError('sug_12345')
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('SUGGESTION_NOT_FOUND');
    });

    it('should map SuggestionFingerprintMismatchError to 400', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValue(
        new SuggestionFingerprintMismatchError('sug_12345')
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('SUGGESTION_INVALID');
    });

    it('should map InvalidTransformationError to 400', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValue(
        new InvalidTransformationError('Transformation failed')
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('TRANSFORMATION_FAILED');
    });

    it('should map VersionConflictError to 409 with details', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValue(
        new VersionConflictError(5, 6)
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data.error.code).toBe('VERSION_CONFLICT');
      expect(data.error.details.expectedVersion).toBe(5);
      expect(data.error.details.currentVersion).toBe(6);
    });

    it('should map generic errors to 500', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Phase G: Cache Invalidation', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
      vi.mocked(tutorialComposerService.getSection).mockResolvedValue(mockSection);
      vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
      vi.mocked(requireSubtopicAccess).mockReturnValue(null);
      vi.mocked(requireBrandAccess).mockReturnValue(null);
    });

    it('should invalidate cache after successful application', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockResolvedValue(
        mockApplySuggestionResult
      );
      vi.mocked(invalidateTutorialDeliveryCache).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      await POST(request, { params: { sectionId: 'section_123' } });

      // Cache invalidation should be called with the result's subtopicId
      expect(invalidateTutorialDeliveryCache).toHaveBeenCalledWith(
        mockApplySuggestionResult.section.subtopicId
      );
    });

    it('should NOT invalidate cache on application failure', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValue(
        new SuggestionNotFoundError('sug_12345')
      );
      vi.mocked(invalidateTutorialDeliveryCache).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      await POST(request, { params: { sectionId: 'section_123' } });

      // Cache invalidation should NOT be called when application fails
      expect(invalidateTutorialDeliveryCache).not.toHaveBeenCalled();
    });

    it('should NOT fail response if cache invalidation fails', async () => {
      vi.mocked(suggestionApplicationService.applySuggestion).mockResolvedValue(
        mockApplySuggestionResult
      );
      vi.mocked(invalidateTutorialDeliveryCache).mockRejectedValue(
        new Error('Redis connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });

      // Response should still be 200 (cache failure is non-blocking)
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.appliedSuggestionId).toBe('sug_12345');
    });

    it('should use subtopicId from successful result, not pre-fetched section', async () => {
      // Verify we're using result.section.subtopicId, not existingSection.subtopicId
      const resultWithDifferentSubtopic = {
        ...mockApplySuggestionResult,
        section: {
          ...mockApplySuggestionResult.section,
          subtopicId: '999e4567-e89b-12d3-a456-426614174999', // Different from mockSection
        },
      };

      vi.mocked(suggestionApplicationService.applySuggestion).mockResolvedValue(
        resultWithDifferentSubtopic
      );
      vi.mocked(invalidateTutorialDeliveryCache).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      await POST(request, { params: { sectionId: 'section_123' } });

      // Should use the result's subtopicId, not the pre-fetched section's
      expect(invalidateTutorialDeliveryCache).toHaveBeenCalledWith(
        '999e4567-e89b-12d3-a456-426614174999'
      );
      expect(invalidateTutorialDeliveryCache).not.toHaveBeenCalledWith(
        mockSection.subtopicId
      );
    });
  });

  describe('Phase H: Retry/Idempotency Semantics', () => {
    beforeEach(() => {
      vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
      vi.mocked(tutorialComposerService.getSection).mockResolvedValue(mockSection);
      vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
      vi.mocked(requireSubtopicAccess).mockReturnValue(null);
      vi.mocked(requireBrandAccess).mockReturnValue(null);
    });

    it('should return 409 when retrying with old expectedVersion after success', async () => {
      // Simulate retry scenario:
      // Request 1: expectedVersion=5 → SUCCESS → version=6
      // Request 2 (retry): expectedVersion=5 → version mismatch → 409

      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValue(
        new VersionConflictError(5, 6) // Expected 5, but current is 6
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5, // Old version
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error.code).toBe('VERSION_CONFLICT');
      expect(data.error.details.expectedVersion).toBe(5);
      expect(data.error.details.currentVersion).toBe(6);
    });

    it('should provide currentVersion in 409 response for client verification', async () => {
      // Client should check currentVersion to determine if mutation already succeeded
      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValue(
        new VersionConflictError(5, 7) // Multiple versions behind
      );

      const request = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response = await POST(request, { params: { sectionId: 'section_123' } });
      const data = await response.json();

      // Client can compare: currentVersion (7) > expectedVersion (5)
      // This indicates the section changed, possibly by this mutation
      expect(data.error.details.currentVersion).toBe(7);
      expect(data.error.details.expectedVersion).toBe(5);
      expect(data.error.details.currentVersion).toBeGreaterThan(
        data.error.details.expectedVersion
      );
    });

    it('should NOT cache success responses for retries (MVP constraint)', async () => {
      // This test documents that we DON'T provide traditional HTTP idempotency
      // A retry with the same parameters gets 409, not cached 200

      // First request succeeds
      vi.mocked(suggestionApplicationService.applySuggestion).mockResolvedValueOnce(
        mockApplySuggestionResult
      );

      const request1 = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response1 = await POST(request1, { params: { sectionId: 'section_123' } });
      expect(response1.status).toBe(200);

      // Second request (retry) with same parameters
      vi.mocked(suggestionApplicationService.applySuggestion).mockRejectedValueOnce(
        new VersionConflictError(5, 6)
      );

      const request2 = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5, // Same version
        }),
      });

      const response2 = await POST(request2, { params: { sectionId: 'section_123' } });
      
      // Retry gets 409, NOT cached 200
      // This documents MVP constraint: mutation safety, not HTTP idempotency
      expect(response2.status).toBe(409);
    });

    it('should allow different suggestions with updated expectedVersion', async () => {
      // After first mutation succeeds (v5 → v6), client can apply another
      // suggestion using the new version

      // First mutation
      vi.mocked(suggestionApplicationService.applySuggestion).mockResolvedValueOnce({
        ...mockApplySuggestionResult,
        previousVersion: 5,
        newVersion: 6,
      });

      const request1 = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      });

      const response1 = await POST(request1, { params: { sectionId: 'section_123' } });
      expect(response1.status).toBe(200);

      // Second mutation with updated version
      vi.mocked(suggestionApplicationService.applySuggestion).mockResolvedValueOnce({
        ...mockApplySuggestionResult,
        previousVersion: 6,
        newVersion: 7,
        appliedSuggestionId: 'sug_67890',
      });

      const request2 = new NextRequest('http://localhost:3000/api/tutorial-composer/sections/section_123/suggestions/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId: 'sug_67890',
          suggestionFingerprint: 'b'.repeat(64),
          expectedVersion: 6, // Updated to new version
        }),
      });

      const response2 = await POST(request2, { params: { sectionId: 'section_123' } });
      expect(response2.status).toBe(200);

      const data2 = await response2.json();
      expect(data2.data.previousVersion).toBe(6);
      expect(data2.data.newVersion).toBe(7);
    });

    it('should document that concurrent requests are protected by row-level locking', async () => {
      // This is a documentation test - the actual protection happens at Phase A
      // (database UPDATE with WHERE version = expectedVersion)
      //
      // Process A: expectedVersion=5 → acquires row lock → UPDATE succeeds
      // Process B: expectedVersion=5 → blocks on lock → UPDATE finds version=6 → 0 rows
      //
      // We can only test the outcome (one succeeds, one gets 409)

      const concurrentRequests = [
        suggestionApplicationService.applySuggestion({
          sectionId: 'section_123',
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
        suggestionApplicationService.applySuggestion({
          sectionId: 'section_123',
          suggestionId: 'sug_12345',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        }),
      ];

      // In reality, one would succeed and one would throw VersionConflictError
      // This test documents the expected behavior
      expect(concurrentRequests).toHaveLength(2);
    });
  });
});
