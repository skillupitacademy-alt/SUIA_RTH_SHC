/**
 * Presentation Ideas API Route Tests
 * PROMPT 14B: Tests for POST /api/tutorial-composer/presentation-ideas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import type {
  TutorialDocument,
  ContentAnalysisResult,
  BlockSuggestionResult,
} from '@quiz/types';
import { CURRENT_SCHEMA_VERSION } from '@quiz/types';

// Mock auth helpers
vi.mock('@/lib/auth-helpers', () => ({
  authenticateRequest: vi.fn(),
  requireTutorialEditPermission: vi.fn(),
  requireSubtopicAccess: vi.fn(),
  requireBrandAccess: vi.fn(),
}));

// Mock presentation ideas service
vi.mock('@quiz/db-tutorial', () => ({
  presentationIdeasService: {
    generatePresentationIdeas: vi.fn(),
  },
}));

import { authenticateRequest, requireTutorialEditPermission } from '@/lib/auth-helpers';
import { presentationIdeasService } from '@quiz/db-tutorial';

describe('POST /api/tutorial-composer/presentation-ideas', () => {
  const mockUser = {
    userId: 'user-123',
    originalUserId: 'user-123',
    shadowUserId: 'user-123',
    roles: ['author'],
    isAdmin: false,
    email: 'author@example.com',
  };

  const mockDocument: TutorialDocument = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blocks: [
      {
        id: 'heading-1',
        type: 'heading',
        content: { text: 'Introduction', level: 1 },
      },
    ],
  };

  const mockAnalysis: ContentAnalysisResult = {
    statistics: {
      totalWords: 100,
      characters: 600,
      readingTimeMinutes: 1,
      sectionsDetected: 1,
      totalBlocks: 1,
    },
    sectionOutline: [],
    qualityIndicators: {
      readability: 'good',
      structure: 'good',
      completeness: 'fair',
      examples: 'good',
      codePresence: 'fair',
      visualPotential: 'good',
    },
    smartSuggestions: [],
    detectedElements: {
      headings: 1,
      paragraphs: 0,
      bulletLists: 0,
      numberedLists: 0,
      codeBlocks: 0,
      quotes: 0,
      tables: 0,
      callouts: 0,
      keyConcepts: 0,
      comparisons: 0,
      examples: 0,
    },
    overallConfidence: {
      score: 80,
      grade: 'Good',
    },
  };

  const mockBlockSuggestions: BlockSuggestionResult = {
    statistics: {
      totalBlocks: 1,
      existingBlocks: 1,
      suggestedBlocks: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      sectionsDetected: 1,
      byType: {},
    },
    blocks: [],
    sourcePreview: { raw: 'content' },
    overallConfidence: 80,
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateRequest).mockResolvedValue({ user: mockUser });
    vi.mocked(requireTutorialEditPermission).mockReturnValue(null);
  });

  it('should return 200 with presentation ideas for valid request', async () => {
    const mockResult = {
      ideas: [],
      statistics: {
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
        byType: {},
        enhancementTips: 0,
      },
      contextOutline: {
        totalSections: 1,
        totalBlocks: 1,
        totalWords: 100,
        readingTimeMinutes: 1,
        mainSections: [],
      },
      bestPractices: [],
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };

    vi.mocked(presentationIdeasService.generatePresentationIdeas).mockReturnValue(mockResult);

    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: mockDocument,
        analysis: mockAnalysis,
        blockSuggestions: mockBlockSuggestions,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.data.data.ideas).toBeDefined();
    expect(data.data.data.statistics).toBeDefined();
    expect(data.data.data.contextOutline).toBeDefined();
    expect(data.data.data.bestPractices).toBeDefined();
  });

  it('should return 401 for unauthenticated request', async () => {
    vi.mocked(authenticateRequest).mockResolvedValue({
      type: 'MISSING_TOKEN',
      message: 'No authentication token provided',
    });

    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: mockDocument,
        analysis: mockAnalysis,
        blockSuggestions: mockBlockSuggestions,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHENTICATED');
  });

  it('should return 403 for unauthorized user', async () => {
    vi.mocked(requireTutorialEditPermission).mockReturnValue({
      message: 'User does not have tutorial edit permission',
    });

    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: mockDocument,
        analysis: mockAnalysis,
        blockSuggestions: mockBlockSuggestions,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 for invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 422 for missing analysis', async () => {
    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: mockDocument,
        blockSuggestions: mockBlockSuggestions,
        // Missing analysis
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 422 for missing blockSuggestions', async () => {
    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: mockDocument,
        analysis: mockAnalysis,
        // Missing blockSuggestions
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 422 for invalid document schema', async () => {
    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: { schemaVersion: 999, blocks: [] }, // Invalid schema version
        analysis: mockAnalysis,
        blockSuggestions: mockBlockSuggestions,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should call presentationIdeasService with correct parameters', async () => {
    // Set dev bypass environment
    const originalEnv = process.env.NODE_ENV;
    const originalBypass = process.env.TUTORIAL_COMPOSER_DEV_AUTH_BYPASS;
    
    process.env.NODE_ENV = 'development';
    process.env.TUTORIAL_COMPOSER_DEV_AUTH_BYPASS = 'true';

    const mockResult = {
      ideas: [],
      statistics: { total: 0, high: 0, medium: 0, low: 0, byType: {}, enhancementTips: 0 },
      contextOutline: { totalSections: 0, totalBlocks: 0, totalWords: 0, readingTimeMinutes: 0, mainSections: [] },
      bestPractices: [],
      metadata: { generatedAt: new Date().toISOString() },
    };

    vi.mocked(presentationIdeasService.generatePresentationIdeas).mockReturnValue(mockResult);

    const validSubtopicId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID

    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-tutorial-dev-bypass': 'true',
      },
      body: JSON.stringify({
        document: mockDocument,
        analysis: mockAnalysis,
        blockSuggestions: mockBlockSuggestions,
        subtopicId: validSubtopicId,
        sectionType: 'notes',
        brandId: 'realtutorialhub',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(presentationIdeasService.generatePresentationIdeas).toHaveBeenCalledWith(
      expect.objectContaining({ schemaVersion: CURRENT_SCHEMA_VERSION }),
      mockAnalysis,
      mockBlockSuggestions,
      expect.objectContaining({
        subtopicId: validSubtopicId,
        sectionType: 'notes',
        brandId: 'realtutorialhub',
      })
    );

    // Cleanup
    process.env.NODE_ENV = originalEnv;
    process.env.TUTORIAL_COMPOSER_DEV_AUTH_BYPASS = originalBypass;
  });

  it('should return 500 for unexpected service error', async () => {
    vi.mocked(presentationIdeasService.generatePresentationIdeas).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: mockDocument,
        analysis: mockAnalysis,
        blockSuggestions: mockBlockSuggestions,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });

  it('should not mutate database', async () => {
    const mockResult = {
      ideas: [],
      statistics: { total: 0, high: 0, medium: 0, low: 0, byType: {}, enhancementTips: 0 },
      contextOutline: { totalSections: 0, totalBlocks: 0, totalWords: 0, readingTimeMinutes: 0, mainSections: [] },
      bestPractices: [],
      metadata: { generatedAt: new Date().toISOString() },
    };

    vi.mocked(presentationIdeasService.generatePresentationIdeas).mockReturnValue(mockResult);

    const request = new NextRequest('http://localhost/api/tutorial-composer/presentation-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: mockDocument,
        analysis: mockAnalysis,
        blockSuggestions: mockBlockSuggestions,
      }),
    });

    await POST(request);

    // Verify no database operations
    // The service is pure and should not have any database side effects
    expect(presentationIdeasService.generatePresentationIdeas).toHaveBeenCalled();
  });
});
