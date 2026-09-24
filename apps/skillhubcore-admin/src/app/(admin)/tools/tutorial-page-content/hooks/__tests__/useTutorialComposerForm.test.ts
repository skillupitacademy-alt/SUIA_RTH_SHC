/**
 * Tests for useTutorialComposerForm hook
 * 
 * Verifies:
 * - Initial state matches Composer defaults
 * - Form updates preserve unrelated fields
 * - Hierarchy cascade resets work correctly
 * - Block type changes reset version
 * - Derived values computed correctly
 * - No unintended state ownership
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTutorialComposerForm, type HierarchyState } from '../useTutorialComposerForm';

// Type-safe fetch mock
const fetchMock = vi.fn<typeof fetch>();

describe('useTutorialComposerForm', () => {
  beforeEach(() => {
    // Mock fetch for hierarchy loading
    vi.clearAllMocks();
    global.fetch = fetchMock as typeof fetch;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  const mockHierarchyResponse: HierarchyState = {
    domains: [
      { id: 'd1', name: 'Programming', slug: 'programming' },
      { id: 'd2', name: 'Mathematics', slug: 'mathematics' },
    ],
    subjects: [
      { id: 's1', name: 'Python', slug: 'python', domainId: 'd1' },
      { id: 's2', name: 'Calculus', slug: 'calculus', domainId: 'd2' },
    ],
    topics: [
      { id: 't1', name: 'Variables', slug: 'variables', subjectId: 's1' },
      { id: 't2', name: 'Functions', slug: 'functions', subjectId: 's1' },
    ],
    subtopics: [
      { id: 'st1', name: 'Assignment', slug: 'assignment', topicId: 't1' },
      { id: 'st2', name: 'Data Types', slug: 'data-types', topicId: 't1' },
    ],
  };
  
  describe('Initial State', () => {
    it('should initialize with correct default hierarchy state', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      // Initial state before hierarchy loads
      expect(result.current.hierarchy).toEqual({
        domains: [],
        subjects: [],
        topics: [],
        subtopics: [],
      });
      
      // Wait for hierarchy to load
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      expect(result.current.hierarchy).toEqual(mockHierarchyResponse);
    });
    
    it('should initialize with correct default form state', () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      expect(result.current.form).toEqual({
        brandId: 'shared',
        domainId: '',
        subjectId: '',
        topicId: '',
        subtopicId: '',
        navigationNodeId: '',
        blockType: 'definition',
        versionId: 'v1',
      });
    });
    
    it('should initialize derived values correctly', () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      expect(result.current.subjects).toEqual([]);
      expect(result.current.topics).toEqual([]);
      expect(result.current.subtopics).toEqual([]);
      expect(result.current.selectedSubtopic).toBeUndefined();
      expect(result.current.domainName).toBe('Not selected');
      expect(result.current.subjectName).toBe('Not selected');
      expect(result.current.topicName).toBe('Not selected');
      expect(result.current.subtopicName).toBe('Not selected');
    });
  });
  
  describe('Form Updates', () => {
    it('should update single form field without affecting others', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      act(() => {
        result.current.updateForm('brandId', 'realtutorialhub');
      });
      
      expect(result.current.form.brandId).toBe('realtutorialhub');
      expect(result.current.form.domainId).toBe('');
      expect(result.current.form.blockType).toBe('definition');
    });
    
    it('should preserve unrelated fields during form update', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Set initial values
      act(() => {
        result.current.updateForm('blockType', 'code');
      });
      
      act(() => {
        result.current.updateForm('brandId', 'skillup');
      });
      
      // Updating brandId should not affect blockType
      expect(result.current.form.blockType).toBe('code');
      expect(result.current.form.brandId).toBe('skillup');
    });
  });
  
  describe('Hierarchy Cascade - Domain Selection', () => {
    it('should reset subject/topic/subtopic/navigation when domain changes', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Set full hierarchy
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      act(() => {
        result.current.updateForm('topicId', 't1');
      });
      act(() => {
        result.current.updateForm('subtopicId', 'st1');
      });
      act(() => {
        result.current.updateForm('navigationNodeId', 'n1');
      });
      
      // Change domain - should reset dependent selections
      act(() => {
        result.current.updateForm('domainId', 'd2');
      });
      
      expect(result.current.form.domainId).toBe('d2');
      expect(result.current.form.subjectId).toBe('');
      expect(result.current.form.topicId).toBe('');
      expect(result.current.form.subtopicId).toBe('');
      expect(result.current.form.navigationNodeId).toBe('');
    });
  });
  
  describe('Hierarchy Cascade - Subject Selection', () => {
    it('should reset topic/subtopic/navigation when subject changes', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Set full hierarchy
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      act(() => {
        result.current.updateForm('topicId', 't1');
      });
      act(() => {
        result.current.updateForm('subtopicId', 'st1');
      });
      act(() => {
        result.current.updateForm('navigationNodeId', 'n1');
      });
      
      // Change subject - should reset dependent selections but preserve domain
      act(() => {
        result.current.updateForm('subjectId', 's2');
      });
      
      expect(result.current.form.domainId).toBe('d1');
      expect(result.current.form.subjectId).toBe('s2');
      expect(result.current.form.topicId).toBe('');
      expect(result.current.form.subtopicId).toBe('');
      expect(result.current.form.navigationNodeId).toBe('');
    });
  });
  
  describe('Hierarchy Cascade - Topic Selection', () => {
    it('should reset subtopic/navigation when topic changes', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Set full hierarchy
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      act(() => {
        result.current.updateForm('topicId', 't1');
      });
      act(() => {
        result.current.updateForm('subtopicId', 'st1');
      });
      act(() => {
        result.current.updateForm('navigationNodeId', 'n1');
      });
      
      // Change topic - should reset dependent selections but preserve domain/subject
      act(() => {
        result.current.updateForm('topicId', 't2');
      });
      
      expect(result.current.form.domainId).toBe('d1');
      expect(result.current.form.subjectId).toBe('s1');
      expect(result.current.form.topicId).toBe('t2');
      expect(result.current.form.subtopicId).toBe('');
      expect(result.current.form.navigationNodeId).toBe('');
    });
  });
  
  describe('Hierarchy Cascade - Subtopic Selection', () => {
    it('should reset navigation when subtopic changes', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Set full hierarchy
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      act(() => {
        result.current.updateForm('topicId', 't1');
      });
      act(() => {
        result.current.updateForm('subtopicId', 'st1');
      });
      act(() => {
        result.current.updateForm('navigationNodeId', 'n1');
      });
      
      // Change subtopic - should reset navigation but preserve domain/subject/topic
      act(() => {
        result.current.updateForm('subtopicId', 'st2');
      });
      
      expect(result.current.form.domainId).toBe('d1');
      expect(result.current.form.subjectId).toBe('s1');
      expect(result.current.form.topicId).toBe('t1');
      expect(result.current.form.subtopicId).toBe('st2');
      expect(result.current.form.navigationNodeId).toBe('');
    });
  });
  
  describe('Block Type Cascade', () => {
    it('should reset versionId to first available when blockType changes', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Change block type
      act(() => {
        result.current.updateForm('blockType', 'code');
      });
      
      // Should reset version to first available for code blocks
      expect(result.current.form.blockType).toBe('code');
      expect(result.current.form.versionId).toBe('v1'); // Version ID, not code
      expect(result.current.selectedVersion.code).toBe('C1'); // Version code
    });
    
    it('should preserve hierarchy selections when blockType changes', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Set hierarchy
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      
      // Change block type
      act(() => {
        result.current.updateForm('blockType', 'code');
      });
      
      // Hierarchy should be preserved
      expect(result.current.form.domainId).toBe('d1');
      expect(result.current.form.subjectId).toBe('s1');
    });
  });
  
  describe('Derived Values', () => {
    it('should compute filtered subjects correctly', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Select domain
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      
      // Should filter subjects by domain
      expect(result.current.subjects).toHaveLength(1);
      expect(result.current.subjects[0].id).toBe('s1');
      expect(result.current.subjects[0].domainId).toBe('d1');
    });
    
    it('should compute filtered topics correctly', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Select subject
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      
      // Should filter topics by subject
      expect(result.current.topics).toHaveLength(2);
      expect(result.current.topics[0].subjectId).toBe('s1');
    });
    
    it('should compute filtered subtopics correctly', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Select topic
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      act(() => {
        result.current.updateForm('topicId', 't1');
      });
      
      // Should filter subtopics by topic
      expect(result.current.subtopics).toHaveLength(2);
      expect(result.current.subtopics[0].topicId).toBe('t1');
    });
    
    it('should resolve selectedSubtopic correctly', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Select subtopic
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      act(() => {
        result.current.updateForm('topicId', 't1');
      });
      act(() => {
        result.current.updateForm('subtopicId', 'st1');
      });
      
      expect(result.current.selectedSubtopic?.id).toBe('st1');
      expect(result.current.selectedSubtopic?.name).toBe('Assignment');
    });
    
    it('should compute hierarchy names correctly', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      await waitFor(() => {
        expect(result.current.hierarchy.domains).toHaveLength(2);
      });
      
      // Select full hierarchy
      act(() => {
        result.current.updateForm('domainId', 'd1');
      });
      act(() => {
        result.current.updateForm('subjectId', 's1');
      });
      act(() => {
        result.current.updateForm('topicId', 't1');
      });
      act(() => {
        result.current.updateForm('subtopicId', 'st1');
      });
      
      expect(result.current.domainName).toBe('Programming');
      expect(result.current.subjectName).toBe('Python');
      expect(result.current.topicName).toBe('Variables');
      expect(result.current.subtopicName).toBe('Assignment');
    });
  });
  
  describe('Error Handling', () => {
    it('should call onError callback when hierarchy loading fails', async () => {
      const onError = vi.fn();
      
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      
      renderHook(() => useTutorialComposerForm({ onError }));
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Network error');
      });
    });
    
    it('should handle non-Error fetch failures', async () => {
      const onError = vi.fn();
      
      fetchMock.mockRejectedValueOnce('Unknown error');
      
      renderHook(() => useTutorialComposerForm({ onError }));
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to load hierarchy.');
      });
    });
  });
  
  describe('Hook Contract', () => {
    it('should not manage document hydration', () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      // Should NOT have hydration state
      expect(result.current).not.toHaveProperty('documentBlocks');
      expect(result.current).not.toHaveProperty('loadedSectionId');
      expect(result.current).not.toHaveProperty('isLoadingDocument');
    });
    
    it('should not manage block authoring state', () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      // Should NOT have block authoring state
      expect(result.current).not.toHaveProperty('sourceContent');
      expect(result.current).not.toHaveProperty('activeBlockPreview');
      expect(result.current).not.toHaveProperty('editingBlockId');
    });
    
    it('should not manage save/publish state', () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => mockHierarchyResponse,
      } as Response);
      
      const { result } = renderHook(() => useTutorialComposerForm());
      
      // Should NOT have save/publish state
      expect(result.current).not.toHaveProperty('isSaving');
      expect(result.current).not.toHaveProperty('save');
      expect(result.current).not.toHaveProperty('publish');
    });
  });
});
