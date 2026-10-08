/**
 * Tutorial Sections API - Route Tests
 * 
 * PROMPT 11 — Learner Tutorial Delivery API
 * 
 * Tests:
 * - Successful delivery (all sections)
 * - Successful delivery (single section)
 * - Subtopic not found → 404
 * - Brand context from headers
 * - Difficulty parameter handling
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import {
  tutorialDeliveryService,
  SubtopicNotFoundError,
  type TutorialDelivery,
} from '@quiz/db-tutorial';

// Mock TutorialDeliveryService
vi.mock('@quiz/db-tutorial', async () => {
  const actual = await vi.importActual('@quiz/db-tutorial');
  return {
    ...actual,
    tutorialDeliveryService: {
      getTutorialBySlug: vi.fn(),
    },
  };
});

describe('GET /api/tutorial/sections/:subtopicId', () => {
  const mockDelivery: TutorialDelivery = {
    subtopicId: 'subtopic_123',
    subtopicSlug: 'javascript-variables',
    subtopicName: 'JavaScript Variables',
    difficulty: 'simple',
    sections: [
      {
        id: 'section_1',
        sectionType: 'notes',
        difficulty: 'simple',
        orderIndex: 1,
        content: {
          schemaVersion: 1,
          blocks: [],
        },
        version: 1,
        language: 'en',
        publishedAt: new Date('2026-01-01'),
      },
      {
        id: 'section_2',
        sectionType: 'visual',
        difficulty: 'simple',
        orderIndex: 2,
        content: {
          schemaVersion: 1,
          blocks: [],
        },
        version: 1,
        language: 'en',
        publishedAt: new Date('2026-01-02'),
      },
    ],
    totalSections: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('All Sections', () => {
    it('should return all sections for a subtopic', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(mockDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.subtopicId).toBe('javascript-variables');
      expect(data.subtopicName).toBe('JavaScript Variables');
      expect(data.difficulty).toBe('simple');
      expect(data.totalSections).toBe(2);
      expect(data.sections).toHaveProperty('notes');
      expect(data.sections).toHaveProperty('visual');
      expect(data.sectionMeta).toHaveProperty('notes');
      expect(data.sectionMeta.notes.id).toBe('section_1');
    });

    it('should use default difficulty of simple', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(mockDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(tutorialDeliveryService.getTutorialBySlug).toHaveBeenCalledWith(
        'javascript-variables',
        expect.objectContaining({
          difficulty: 'simple',
        })
      );
    });

    it('should accept difficulty parameter', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue({
        ...mockDelivery,
        difficulty: 'intermediate',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables?difficulty=intermediate'
      );

      await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(tutorialDeliveryService.getTutorialBySlug).toHaveBeenCalledWith(
        'javascript-variables',
        expect.objectContaining({
          difficulty: 'intermediate',
        })
      );
    });

    it('should extract brand from X-Brand header', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(mockDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables',
        {
          headers: {
            'X-Brand': 'skillup',
          },
        }
      );

      await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(tutorialDeliveryService.getTutorialBySlug).toHaveBeenCalledWith(
        'javascript-variables',
        expect.objectContaining({
          brandId: 'skillup',
        })
      );
    });

    it('should default to shared brand if no header', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(mockDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(tutorialDeliveryService.getTutorialBySlug).toHaveBeenCalledWith(
        'javascript-variables',
        expect.objectContaining({
          brandId: 'shared',
        })
      );
    });
  });

  describe('Single Section', () => {
    it('should return single section when sectionType specified', async () => {
      const singleSectionDelivery = {
        ...mockDelivery,
        sections: [mockDelivery.sections[0]], // Only notes section
      };

      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(
        singleSectionDelivery
      );

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables?sectionType=notes'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.subtopicId).toBe('javascript-variables');
      expect(data.sectionId).toBe('section_1');
      expect(data.sectionType).toBe('notes');
      expect(data.content).toBeDefined();
      expect(data.version).toBe(1);
      expect(data.language).toBe('en');
      // Should NOT have sections map for single section response
      expect(data.sections).toBeUndefined();
    });

    it('should pass sectionType to service', async () => {
      const singleSectionDelivery = {
        ...mockDelivery,
        sections: [mockDelivery.sections[1]], // Only visual section
      };

      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(
        singleSectionDelivery
      );

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables?sectionType=visual'
      );

      await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(tutorialDeliveryService.getTutorialBySlug).toHaveBeenCalledWith(
        'javascript-variables',
        expect.objectContaining({
          sectionType: 'visual',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent subtopic', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockRejectedValue(
        new SubtopicNotFoundError('non-existent')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/non-existent'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'non-existent' }),
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Subtopic not found');
    });

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockRejectedValue(
        new Error('Database connection failed')
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Format', () => {
    it('should include all required fields in all-sections response', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(mockDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      const data = await response.json();

      expect(data).toHaveProperty('subtopicId');
      expect(data).toHaveProperty('subtopicName');
      expect(data).toHaveProperty('difficulty');
      expect(data).toHaveProperty('sections');
      expect(data).toHaveProperty('sectionMeta');
      expect(data).toHaveProperty('totalSections');
    });

    it('should include all required fields in single-section response', async () => {
      const singleSectionDelivery = {
        ...mockDelivery,
        sections: [mockDelivery.sections[0]],
      };

      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(
        singleSectionDelivery
      );

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables?sectionType=notes'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      const data = await response.json();

      expect(data).toHaveProperty('subtopicId');
      expect(data).toHaveProperty('sectionId');
      expect(data).toHaveProperty('sectionType');
      expect(data).toHaveProperty('difficulty');
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('language');
    });

    it('should NOT expose admin-only fields', async () => {
      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(mockDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      const data = await response.json();

      // Should NOT include:
      expect(data).not.toHaveProperty('generatedByAi');
      expect(data).not.toHaveProperty('aiModelUsed');
      expect(data).not.toHaveProperty('qualityScore');
      expect(data).not.toHaveProperty('approvedBy');
      expect(data).not.toHaveProperty('promptTemplateId');
    });
  });

  describe('Security - Content Sanitization', () => {
    it('should receive sanitized content from delivery service for SVG attacks', async () => {
      // The delivery service is responsible for sanitization
      // This test verifies the API receives already-sanitized content
      const sanitizedDelivery: TutorialDelivery = {
        subtopicId: 'subtopic_123',
        subtopicSlug: 'javascript-variables',
        subtopicName: 'JavaScript Variables',
        difficulty: 'simple',
        sections: [
          {
            id: 'section_1',
            sectionType: 'visual',
            difficulty: 'simple',
            orderIndex: 1,
            content: {
              schemaVersion: 1,
              blocks: [
                {
                  id: 'diagram_1',
                  type: 'diagram',
                  content: {
                    diagramType: 'svg',
                    // Service should have already sanitized this
                    diagramData: '<svg><circle cx="50" cy="50" r="40" /></svg>',
                    alt: 'Test diagram',
                  },
                },
              ],
            },
            version: 1,
            language: 'en',
            publishedAt: new Date('2026-01-01'),
          },
        ],
        totalSections: 1,
      };

      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(sanitizedDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const visualContent = data.sections.visual;

      // Verify the delivery service provided clean content
      const diagramBlock = visualContent.blocks[0];
      expect(diagramBlock.content.diagramData).not.toContain('<script>');
      expect(diagramBlock.content.diagramData).toContain('<circle');
    });

    it('should receive sanitized content from delivery service for URL attacks', async () => {
      const sanitizedDelivery: TutorialDelivery = {
        subtopicId: 'subtopic_123',
        subtopicSlug: 'javascript-variables',
        subtopicName: 'JavaScript Variables',
        difficulty: 'simple',
        sections: [
          {
            id: 'section_1',
            sectionType: 'visual',
            difficulty: 'simple',
            orderIndex: 1,
            content: {
              schemaVersion: 1,
              blocks: [
                {
                  id: 'image_1',
                  type: 'image',
                  content: {
                    // Service should have already sanitized this
                    assetId: '#unsafe-url',
                    alt: 'Test image',
                  },
                },
              ],
            },
            version: 1,
            language: 'en',
            publishedAt: new Date('2026-01-01'),
          },
        ],
        totalSections: 1,
      };

      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(sanitizedDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const visualContent = data.sections.visual;

      // Verify the delivery service provided sanitized URL
      const imageBlock = visualContent.blocks[0];
      expect(imageBlock.content.assetId).toBe('#unsafe-url');
    });

    it('should pass through safe content unchanged', async () => {
      const safeDelivery: TutorialDelivery = {
        subtopicId: 'subtopic_123',
        subtopicSlug: 'javascript-variables',
        subtopicName: 'JavaScript Variables',
        difficulty: 'simple',
        sections: [
          {
            id: 'section_1',
            sectionType: 'visual',
            difficulty: 'simple',
            orderIndex: 1,
            content: {
              schemaVersion: 1,
              blocks: [
                {
                  id: 'diagram_1',
                  type: 'diagram',
                  content: {
                    diagramType: 'svg',
                    diagramData: '<svg><circle cx="50" cy="50" r="40" fill="blue" /></svg>',
                    alt: 'Safe diagram',
                  },
                },
                {
                  id: 'image_1',
                  type: 'image',
                  content: {
                    assetId: 'https://example.com/image.png',
                    alt: 'Safe image',
                  },
                },
              ],
            },
            version: 1,
            language: 'en',
            publishedAt: new Date('2026-01-01'),
          },
        ],
        totalSections: 1,
      };

      vi.mocked(tutorialDeliveryService.getTutorialBySlug).mockResolvedValue(safeDelivery);

      const request = new NextRequest(
        'http://localhost:3000/api/tutorial/sections/javascript-variables'
      );

      const response = await GET(request, {
        params: Promise.resolve({ subtopicId: 'javascript-variables' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const visualContent = data.sections.visual;

      // Safe content should remain unchanged
      const diagramBlock = visualContent.blocks[0];
      const imageBlock = visualContent.blocks[1];
      expect(diagramBlock.content.diagramData).toContain('<circle');
      expect(imageBlock.content.assetId).toBe('https://example.com/image.png');
    });
  });
});
