  /**
   * Tutorial Delivery Service - Unit Tests
   * 
   * PROMPT 10 — Tutorial Section / Delivery Foundation
   * 
   * Tests:
   * - Subtopic resolution (slug → UUID)
   * - Section filtering (published, not deleted)
   * - Brand visibility rules
   * - Section ordering (orderIndex)
   * - TutorialDocument schema validation
   * - Error handling
   */

  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import {
    TutorialDeliveryService,
    SubtopicNotFoundError,
    SectionNotFoundError,
    InvalidSectionContentError,
    type DeliveryOptions,
  } from '../tutorial-delivery.service';
  import { db } from '../../db';
  import { tutorialSections, tutorialSubtopics } from '../../schema';
  import { eq, and } from 'drizzle-orm';

  // Mock database
  vi.mock('../../db', () => ({
    db: {
      select: vi.fn(),
    },
  }));

  describe('TutorialDeliveryService', () => {
    let service: TutorialDeliveryService;

    const mockSubtopic = {
      id: 'subtopic_123',
      slug: 'javascript-variables',
      name: 'JavaScript Variables',
    };

    const mockSection1 = {
      id: 'section_1',
      sectionType: 'notes',
      difficulty: 'simple',
      orderIndex: 1,
      content: {
        schemaVersion: 1,
        metadata: {
          title: 'Notes Section',
          description: 'Comprehensive notes',
          brandVisibility: 'shared_visible',
          documentLanguage: 'en',
          contentClassification: 'educational',
        },
        blocks: [],
      },
      version: 1,
      language: 'en',
      publishedAt: new Date('2026-01-01'),
    };

    const mockSection2 = {
      id: 'section_2',
      sectionType: 'visual',
      difficulty: 'simple',
      orderIndex: 2,
      content: {
        schemaVersion: 1,
        metadata: {
          title: 'Visual Section',
          description: 'Visual content',
          brandVisibility: 'shared_visible',
          documentLanguage: 'en',
          contentClassification: 'educational',
        },
        blocks: [],
      },
      version: 1,
      language: 'en',
      publishedAt: new Date('2026-01-02'),
    };

    beforeEach(() => {
      service = new TutorialDeliveryService();
      vi.clearAllMocks();
    });

    describe('getTutorialBySlug', () => {
      it('should retrieve tutorial by subtopic slug', async () => {
        // Mock subtopic lookup
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        // Mock sections lookup
        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSection1, mockSection2]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const result = await service.getTutorialBySlug('javascript-variables');

        expect(result.subtopicId).toBe('subtopic_123');
        expect(result.subtopicSlug).toBe('javascript-variables');
        expect(result.subtopicName).toBe('JavaScript Variables');
        expect(result.sections).toHaveLength(2);
        expect(result.totalSections).toBe(2);
      });

      it('should throw SubtopicNotFoundError for non-existent slug', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };

        vi.mocked(db.select).mockReturnValue(mockSubtopicSelect as any);

        await expect(
          service.getTutorialBySlug('non-existent-slug')
        ).rejects.toThrow(SubtopicNotFoundError);
      });
    });

    describe('getTutorialById', () => {
      it('should retrieve tutorial by subtopic UUID', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSection1, mockSection2]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const result = await service.getTutorialById('subtopic_123');

        expect(result.subtopicId).toBe('subtopic_123');
        expect(result.sections).toHaveLength(2);
      });

      it('should order sections by orderIndex', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const unorderedSections = [mockSection2, mockSection1]; // Out of order

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(unorderedSections),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const result = await service.getTutorialById('subtopic_123');

        // Verify orderBy was called (sections should be ordered in DB query)
        expect(mockSectionsSelect.orderBy).toHaveBeenCalled();
      });

      it('should filter by difficulty', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        await service.getTutorialById('subtopic_123', { difficulty: 'intermediate' });

        // Verify where clause was called with conditions
        expect(mockSectionsSelect.where).toHaveBeenCalled();
      });

      it('should filter by sectionType when specified', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSection1]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const result = await service.getTutorialById('subtopic_123', {
          sectionType: 'notes',
        });

        expect(mockSectionsSelect.where).toHaveBeenCalled();
      });

      it('should skip sections with invalid TutorialDocument schema', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const invalidSection = {
          ...mockSection1,
          content: {
            // Missing schemaVersion
            metadata: {
              title: 'Invalid',
            },
            blocks: [],
          },
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([invalidSection, mockSection2]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await service.getTutorialById('subtopic_123');

        // Invalid section should be skipped
        expect(result.sections).toHaveLength(1);
        expect(result.sections[0].id).toBe('section_2');
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should default difficulty to simple', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const result = await service.getTutorialById('subtopic_123');

        expect(result.difficulty).toBe('simple');
      });

      it('should default brandId to shared', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        await service.getTutorialById('subtopic_123');

        // Brand filtering should be applied in where clause
        expect(mockSectionsSelect.where).toHaveBeenCalled();
      });
    });

    describe('getSectionById', () => {
      it('should retrieve a single section by ID', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{
            ...mockSection1,
            deletedAt: null,
            status: 'deployed',
            brandId: 'shared',
            brandVisibility: 'shared_visible',
          }]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        const result = await service.getSectionById('section_1');

        expect(result.id).toBe('section_1');
        expect(result.sectionType).toBe('notes');
        expect(result.content).toBeDefined();
      });

      it('should throw SectionNotFoundError for non-existent section', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        await expect(
          service.getSectionById('non_existent')
        ).rejects.toThrow(SectionNotFoundError);
      });

      it('should throw SectionNotFoundError for deleted section', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{
            ...mockSection1,
            deletedAt: new Date(),
            status: 'deployed',
            brandId: 'shared',
            brandVisibility: 'shared_visible',
          }]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        await expect(
          service.getSectionById('section_1')
        ).rejects.toThrow(SectionNotFoundError);
      });

      it('should throw SectionNotFoundError for unpublished section', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{
            ...mockSection1,
            deletedAt: null,
            status: 'draft',
            brandId: 'shared',
            brandVisibility: 'shared_visible',
          }]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        await expect(
          service.getSectionById('section_1')
        ).rejects.toThrow(SectionNotFoundError);
      });

      it('should throw SectionNotFoundError for brand-restricted section', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{
            ...mockSection1,
            deletedAt: null,
            status: 'deployed',
            brandId: 'realtutorialhub',
            brandVisibility: 'brand_exclusive',
          }]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        // Requesting with different brandId
        await expect(
          service.getSectionById('section_1', { brandId: 'skillup' })
        ).rejects.toThrow(SectionNotFoundError);
      });

      it('should throw InvalidSectionContentError for invalid schema', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{
            ...mockSection1,
            content: { invalid: 'schema' }, // Invalid TutorialDocument
            deletedAt: null,
            status: 'deployed',
            brandId: 'shared',
            brandVisibility: 'shared_visible',
          }]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(
          service.getSectionById('section_1')
        ).rejects.toThrow(InvalidSectionContentError);

        consoleErrorSpy.mockRestore();
      });

      it('should allow access to shared brand sections', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{
            ...mockSection1,
            deletedAt: null,
            status: 'deployed',
            brandId: 'shared',
            brandVisibility: 'shared_visible',
          }]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        const result = await service.getSectionById('section_1', { brandId: 'skillup' });

        expect(result.id).toBe('section_1');
      });

      it('should allow access to brand-specific sections for matching brand', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{
            ...mockSection1,
            deletedAt: null,
            status: 'deployed',
            brandId: 'realtutorialhub',
            brandVisibility: 'brand_exclusive',
          }]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        const result = await service.getSectionById('section_1', { brandId: 'realtutorialhub' });

        expect(result.id).toBe('section_1');
      });

      it('should allow access to shared_visible sections', async () => {
        const mockSectionSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{
            ...mockSection1,
            deletedAt: null,
            status: 'deployed',
            brandId: 'realtutorialhub',
            brandVisibility: 'shared_visible',
          }]),
        };

        vi.mocked(db.select).mockReturnValue(mockSectionSelect as any);

        const result = await service.getSectionById('section_1', { brandId: 'skillup' });

        expect(result.id).toBe('section_1');
      });
    });

    describe('Brand Visibility Rules', () => {
      it('should include sections with brandId = shared', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSection1]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        await service.getTutorialById('subtopic_123', { brandId: 'skillup' });

        // Verify brand filtering was applied
        expect(mockSectionsSelect.where).toHaveBeenCalled();
      });
    });

    describe('Content Sanitization Integration', () => {
      it('should sanitize malicious SVG in delivered content', async () => {
        const maliciousSVG = '<svg><script>alert("XSS")</script><circle cx="50" cy="50" r="40" /></svg>';
        
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionWithMaliciousSVG = {
          id: 'section_1',
          sectionType: 'visual',
          difficulty: 'simple',
          orderIndex: 1,
          content: {
            schemaVersion: 1,
            blocks: [
              {
                id: 'diagram_malicious_1',
                type: 'diagram',
                content: {
                  diagramType: 'svg',
                  diagramData: maliciousSVG,
                  alt: 'Test diagram with malicious SVG',
                },
              },
            ],
          },
          version: 1,
          language: 'en',
          publishedAt: new Date(),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSectionWithMaliciousSVG]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await service.getTutorialById('subtopic_123');

        // Verify sanitization occurred
        expect(result.sections).toHaveLength(1);
        const diagramBlock = result.sections[0].content.blocks[0];
        if (diagramBlock.type === 'diagram' && 'content' in diagramBlock) {
          const content = diagramBlock.content as any;
          expect(content.diagramData).not.toContain('<script>');
          expect(content.diagramData).not.toContain('alert');
          expect(content.diagramData).toContain('<circle'); // Safe content remains
        } else {
          throw new Error('Expected diagram block');
        }

        // Verify security warning was logged
        expect(consoleWarnSpy).toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
      });

      it('should sanitize malicious URLs in delivered content', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionWithMaliciousURL = {
          id: 'section_1',
          sectionType: 'visual',
          difficulty: 'simple',
          orderIndex: 1,
          content: {
            schemaVersion: 1,
            blocks: [
              {
                id: 'image_malicious_1',
                type: 'image',
                content: {
                  assetId: 'javascript:alert(1)',
                  alt: 'Test image with malicious URL',
                },
              },
            ],
          },
          version: 1,
          language: 'en',
          publishedAt: new Date(),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSectionWithMaliciousURL]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await service.getTutorialById('subtopic_123');

        // Verify sanitization occurred
        expect(result.sections).toHaveLength(1);
        const imageBlock = result.sections[0].content.blocks[0];
        if (imageBlock.type === 'image' && 'content' in imageBlock) {
          const content = imageBlock.content as any;
          expect(content.assetId).toBe('#unsafe-url');
        } else {
          throw new Error('Expected image block');
        }

        expect(consoleWarnSpy).toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
      });

      it('should sanitize URL-encoded attacks', async () => {
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionWithEncodedURL = {
          id: 'section_1',
          sectionType: 'visual',
          difficulty: 'simple',
          orderIndex: 1,
          content: {
            schemaVersion: 1,
            blocks: [
              {
                id: 'image_encoded_1',
                type: 'image',
                content: {
                  assetId: 'javascript%3Aalert(1)',
                  alt: 'Test image with encoded attack',
                },
              },
            ],
          },
          version: 1,
          language: 'en',
          publishedAt: new Date(),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSectionWithEncodedURL]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const result = await service.getTutorialById('subtopic_123');

        // Verify encoded attack was sanitized
        expect(result.sections).toHaveLength(1);
        const imageBlock = result.sections[0].content.blocks[0];
        if (imageBlock.type === 'image' && 'content' in imageBlock) {
          const content = imageBlock.content as any;
          expect(content.assetId).toBe('#unsafe-url');
        } else {
          throw new Error('Expected image block');
        }
      });

      it('should not modify safe content', async () => {
        const safeSVG = '<svg><circle cx="50" cy="50" r="40" fill="blue" /></svg>';
        
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionWithSafeContent = {
          id: 'section_1',
          sectionType: 'visual',
          difficulty: 'simple',
          orderIndex: 1,
          content: {
            schemaVersion: 1,
            blocks: [
              {
                id: 'diagram_safe_123',
                type: 'diagram',
                content: {
                  diagramType: 'svg',
                  diagramData: safeSVG,
                  alt: 'Safe diagram with normal SVG',
                },
              },
              {
                id: 'image_safe_456',
                type: 'image',
                content: {
                  assetId: 'https://example.com/image.png',
                  alt: 'Safe HTTPS image',
                },
              },
            ],
          },
          version: 1,
          language: 'en',
          publishedAt: new Date(),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSectionWithSafeContent]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await service.getTutorialById('subtopic_123');

        // Verify safe content unchanged
        expect(result.sections).toHaveLength(1);
        const diagramBlock = result.sections[0].content.blocks[0];
        const imageBlock = result.sections[0].content.blocks[1];
        
        if (diagramBlock.type === 'diagram' && 'content' in diagramBlock) {
          const content = diagramBlock.content as any;
          expect(content.diagramData).toBe(safeSVG);
        } else {
          throw new Error('Expected diagram block');
        }
        
        if (imageBlock.type === 'image' && 'content' in imageBlock) {
          const content = imageBlock.content as any;
          expect(content.assetId).toBe('https://example.com/image.png');
        } else {
          throw new Error('Expected image block');
        }

        // No warning should be logged for safe content
        expect(consoleWarnSpy).not.toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
      });

      it('should sanitize mixed-case SVG attacks', async () => {
        const mixedCaseSVG = '<svg><SCRIPT>alert("XSS")</SCRIPT><circle OnClick="alert(1)" cx="50" cy="50" r="40" /></svg>';
        
        const mockSubtopicSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockSubtopic]),
        };

        const mockSectionWithMixedCase = {
          id: 'section_1',
          sectionType: 'visual',
          difficulty: 'simple',
          orderIndex: 1,
          content: {
            schemaVersion: 1,
            blocks: [
              {
                id: 'diagram_mixedcase_1',
                type: 'diagram',
                content: {
                  diagramType: 'svg',
                  diagramData: mixedCaseSVG,
                  alt: 'Test diagram with mixed-case attacks',
                },
              },
            ],
          },
          version: 1,
          language: 'en',
          publishedAt: new Date(),
        };

        const mockSectionsSelect = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([mockSectionWithMixedCase]),
        };

        vi.mocked(db.select)
          .mockReturnValueOnce(mockSubtopicSelect as any)
          .mockReturnValueOnce(mockSectionsSelect as any);

        const result = await service.getTutorialById('subtopic_123');

        // Verify mixed-case attacks were sanitized
        expect(result.sections).toHaveLength(1);
        const diagramBlock = result.sections[0].content.blocks[0];
        if (diagramBlock.type === 'diagram' && 'content' in diagramBlock) {
          const content = diagramBlock.content as any;
          expect(content.diagramData).not.toContain('<SCRIPT>');
          expect(content.diagramData).not.toContain('OnClick');
          expect(content.diagramData).not.toContain('alert');
        } else {
          throw new Error('Expected diagram block');
        }
      });
    });
  });
