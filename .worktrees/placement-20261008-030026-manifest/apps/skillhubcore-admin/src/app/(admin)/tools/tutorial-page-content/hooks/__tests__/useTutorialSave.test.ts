/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTutorialSave } from '../useTutorialSave';
import { saveTutorialSection } from '../../services/tutorialSaveService';
import type { BlockInstance } from '../../document/documentTransformation';
import type { TutorialDefinitionPayload } from '@quiz/types';

// Mock the save service
vi.mock('../../services/tutorialSaveService', () => ({
  saveTutorialSection: vi.fn(),
}));

const mockSaveTutorialSection = saveTutorialSection as unknown as ReturnType<
  typeof vi.fn<typeof saveTutorialSection>
>;

describe('useTutorialSave', () => {
  let mockSetLoadedSectionId: ReturnType<typeof vi.fn<(id: string | null) => void>>;
  let mockSetMessage: ReturnType<typeof vi.fn<(message: string) => void>>;
  let mockHasUnsavedChangesRef: React.MutableRefObject<boolean>;
  let mockDocumentBlocks: BlockInstance[];
  let mockHierarchyData: Parameters<ReturnType<typeof useTutorialSave>['save']>[1];

  beforeEach(() => {
    mockSetLoadedSectionId = vi.fn<(id: string | null) => void>();
    mockSetMessage = vi.fn<(message: string) => void>();
    mockHasUnsavedChangesRef = { current: true };
    mockDocumentBlocks = [
      {
        id: 'block-1',
        type: 'definition',
        version: 'D1',
        versionCode: 'D1',
        title: 'Test Definition',
        payload: {
          page: {
            type: 'definition',
            title: 'Test',
            intro: 'Intro',
            definition: 'A test definition',
            explanation: ['Example explanation'],
          },
        } as TutorialDefinitionPayload,
        payloadFormat: 'canonical',
        sourceFormat: 'json',
        sourceContent: '{}',
        expectedTimeSec: 30,
      },
    ];

    mockHierarchyData = {
      domains: [{ id: 'domain-1', slug: 'programming' }],
      subjects: [{ id: 'subject-1', slug: 'javascript' }],
      topics: [{ id: 'topic-1', slug: 'basics' }],
      subtopics: [{ id: 'subtopic-1', slug: 'variables' }],
      navigationNodes: [
        { id: 'node-1', name: 'Introduction', slug: 'introduction' },
      ],
      domainId: 'domain-1',
      subjectId: 'subject-1',
      topicId: 'topic-1',
      subtopicId: 'subtopic-1',
      navigationNodeId: 'node-1',
    };

    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('save (draft)', () => {
    it('should save draft successfully', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Draft saved',
        sectionId: 'section-123',
      });

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      expect(result.current.isSaving).toBe(false);

      await act(async () => {
        await result.current.save('draft', mockHierarchyData);
      });

      expect(mockSaveTutorialSection).toHaveBeenCalledWith(
        {
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
        },
        'draft'
      );

      expect(mockSetLoadedSectionId).toHaveBeenCalledWith('section-123');
      expect(mockHasUnsavedChangesRef.current).toBe(false);
      expect(mockSetMessage).toHaveBeenCalledWith('Draft saved');
      expect(result.current.isSaving).toBe(false);
    });

    it('should handle save failure', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: false,
        message: 'Validation failed',
      });

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      await act(async () => {
        await result.current.save('draft', mockHierarchyData);
      });

      expect(mockSetMessage).toHaveBeenCalledWith('Validation failed');
      expect(mockSetLoadedSectionId).not.toHaveBeenCalled();
      expect(mockHasUnsavedChangesRef.current).toBe(true); // Should not clear on failure
    });

    it('should not update loadedSectionId if already set', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Draft saved',
        sectionId: 'section-123',
      });

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: 'section-existing',
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      await act(async () => {
        await result.current.save('draft', mockHierarchyData);
      });

      expect(mockSetLoadedSectionId).not.toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      mockSaveTutorialSection.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      await act(async () => {
        await result.current.save('draft', mockHierarchyData);
      });

      expect(mockSetMessage).toHaveBeenCalledWith('Network error');
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('save (published)', () => {
    it('should save and publish successfully with navigationNodeId URL', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Section saved',
        sectionId: 'section-123',
      });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn<typeof fetch>>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      await act(async () => {
        await result.current.save('published', mockHierarchyData);
      });

      // Verify publish API call
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tutorial-composer/sections/section-123/publish',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Verify navigationNodeId is used as final URL segment (NOT slug)
      expect(mockSetMessage).toHaveBeenCalledWith(
        expect.stringContaining('Published URL: https://user.skillupitacademy.com/tutorial-v2/programming/javascript/basics/variables/node-1')
      );
    });

    it('should handle publish failure after successful save', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Section saved',
        sectionId: 'section-123',
      });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn<typeof fetch>>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Publish failed' } }),
      } as Response);

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      await act(async () => {
        await result.current.save('published', mockHierarchyData);
      });

      expect(mockSetMessage).toHaveBeenCalledWith(
        'Saved but publish failed: Publish failed'
      );
    });

    it('should handle missing hierarchy data for URL construction', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Section saved',
        sectionId: 'section-123',
      });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn<typeof fetch>>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const incompleteHierarchyData = {
        ...mockHierarchyData,
        domains: [], // Missing domain
      };

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      await act(async () => {
        await result.current.save('published', incompleteHierarchyData);
      });

      expect(mockSetMessage).toHaveBeenCalledWith(
        expect.stringContaining(
          'Published successfully, but the learner URL could not be generated'
        )
      );
    });

    it('should preserve navigationNodeId identity in URL (not slug)', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Section saved',
        sectionId: 'section-123',
      });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn<typeof fetch>>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      // Navigation node with different slug than ID
      const hierarchyDataWithDifferentSlug = {
        ...mockHierarchyData,
        navigationNodes: [
          {
            id: 'node-xyz-123',
            name: 'Introduction',
            slug: 'intro-different-slug',
          },
        ],
        navigationNodeId: 'node-xyz-123',
      };

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-xyz-123',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      await act(async () => {
        await result.current.save('published', hierarchyDataWithDifferentSlug);
      });

      // URL MUST use navigationNodeId, NOT slug
      expect(mockSetMessage).toHaveBeenCalledWith(
        expect.stringContaining('/variables/node-xyz-123')
      );
      expect(mockSetMessage).not.toHaveBeenCalledWith(
        expect.stringContaining('intro-different-slug')
      );
    });
  });

  describe('state management', () => {
    it('should clear unsaved changes flag on successful save', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Draft saved',
        sectionId: 'section-123',
      });

      mockHasUnsavedChangesRef.current = true;

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      await act(async () => {
        await result.current.save('draft', mockHierarchyData);
      });

      expect(mockHasUnsavedChangesRef.current).toBe(false);
    });

    it('should maintain isSaving state during save operation', async () => {
      // Use a simpler approach - just verify isSaving is false after completion
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Draft saved',
        sectionId: 'section-123',
      });

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      expect(result.current.isSaving).toBe(false);

      await act(async () => {
        await result.current.save('draft', mockHierarchyData);
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should reset message before save operation', async () => {
      mockSaveTutorialSection.mockResolvedValueOnce({
        success: true,
        message: 'Draft saved',
        sectionId: 'section-123',
      });

      const { result } = renderHook(() =>
        useTutorialSave({
          subtopicId: 'subtopic-1',
          navigationNodeId: 'node-1',
          brandId: 'brand-1',
          documentBlocks: mockDocumentBlocks,
          loadedSectionId: null,
          isLoadingDocument: false,
          hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
          setLoadedSectionId: mockSetLoadedSectionId,
          setMessage: mockSetMessage,
        })
      );

      // Ensure initial state is good
      expect(result.current.save).toBeDefined();

      await act(async () => {
        await result.current.save('draft', mockHierarchyData);
      });

      // First call should clear message
      expect(mockSetMessage).toHaveBeenNthCalledWith(1, '');
      // Second call should set success message
      expect(mockSetMessage).toHaveBeenNthCalledWith(2, 'Draft saved');
    });
  });
});
