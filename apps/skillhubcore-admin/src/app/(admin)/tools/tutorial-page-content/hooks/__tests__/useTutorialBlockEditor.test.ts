/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTutorialBlockEditor } from '../useTutorialBlockEditor';
import type { TutorialDefinitionPayload } from '@quiz/types';
import type { BlockInstance } from '../../document/documentTransformation';

// Mock the C1 converter
vi.mock('../../blocks/code/C1/codeC1.converter', () => ({
  toCanonicalCodeC1: vi.fn((input) => ({
    content: {
      snippets: [],
      steps: [],
    },
    memoryModelWarning: undefined,
  })),
}));

describe('useTutorialBlockEditor', () => {
  let mockSetDocumentBlocks: ReturnType<typeof vi.fn<React.Dispatch<React.SetStateAction<BlockInstance[]>>>>;
  let mockSetMessage: ReturnType<typeof vi.fn<(message: string) => void>>;
  let mockHasUnsavedChangesRef: React.MutableRefObject<boolean>;
  let mockDocumentBlocks: BlockInstance[];

  const createTestBlockInstance = (overrides?: Partial<BlockInstance>): BlockInstance => ({
    id: 'test-id-1',
    type: 'definition',
    version: 'v1',
    versionCode: 'D1',
    title: 'Test Definition',
    payload: {
      page: {
        type: 'definition',
        title: 'Test',
        intro: 'Test intro',
        definition: 'Test definition',
        explanation: ['Test explanation'],
      },
    } as TutorialDefinitionPayload,
    payloadFormat: 'canonical',
    sourceFormat: 'json',
    sourceContent: '{}',
    expectedTimeSec: 30,
    ...overrides,
  });

  beforeEach(() => {
    mockSetDocumentBlocks = vi.fn<React.Dispatch<React.SetStateAction<BlockInstance[]>>>();
    mockSetMessage = vi.fn<(message: string) => void>();
    mockHasUnsavedChangesRef = { current: false };
    mockDocumentBlocks = [];
  });

  describe('add block', () => {
    it('should add a new block with correct BlockInstance shape', async () => {
      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      // Set valid source content
      act(() => {
        result.current.handleContentChange(
          JSON.stringify({
            page: {
              type: 'definition',
              title: 'Variable',
              intro: 'A container for data',
              definition: 'A named storage location',
              explanation: ['Variables hold values'],
            },
          })
        );
      });

      // Add the block
      await act(async () => {
        result.current.handleAddBlockInstance();
      });

      // Verify setDocumentBlocks was called with a function
      expect(mockSetDocumentBlocks).toHaveBeenCalledOnce();
      const updateFn = mockSetDocumentBlocks.mock.calls[0]?.[0];
      expect(typeof updateFn).toBe('function');

      // Call the update function with empty array to get the new block
      if (typeof updateFn === 'function') {
        const newBlocks = updateFn([]);
        expect(newBlocks).toHaveLength(1);

        const newBlock = newBlocks[0];
        expect(newBlock).toBeDefined();
        expect(newBlock?.id).toBeDefined();
        expect(newBlock?.type).toBe('definition');
        expect(newBlock?.version).toBe('v1');
        expect(newBlock?.versionCode).toBe('D1');
        expect(newBlock?.title).toBe('Variable');
        expect(newBlock?.payloadFormat).toBe('legacy');
        expect(newBlock?.sourceFormat).toBe('json');
        expect(newBlock?.sourceContent).toBeDefined();
      }

      expect(mockHasUnsavedChangesRef.current).toBe(true);
      expect(mockSetMessage).toHaveBeenCalledWith(
        expect.stringContaining('Appended new block instance')
      );
    });

    it('should extract root-level expectedTimeSec and not include it in payload', async () => {
      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      // Source content with root-level expectedTimeSec
      const sourceWithExpectedTime = {
        expectedTimeSec: 240,
        page: {
          type: 'definition',
          title: 'Function',
          intro: 'Reusable code block',
          definition: 'A named block of code',
          explanation: ['Functions can be called'],
        },
      };

      act(() => {
        result.current.handleContentChange(JSON.stringify(sourceWithExpectedTime));
      });

      await act(async () => {
        result.current.handleAddBlockInstance();
      });

      const updateFn = mockSetDocumentBlocks.mock.calls[0]?.[0];
      if (typeof updateFn === 'function') {
        const newBlocks = updateFn([]);
        const newBlock = newBlocks[0];

        // Root-level expectedTimeSec should be preserved
        expect(newBlock?.expectedTimeSec).toBe(240);

        // Payload should NOT contain expectedTimeSec
        const payload = newBlock?.payload as any;
        expect(payload.expectedTimeSec).toBeUndefined();
      }
    });

    it('should handle missing expectedTimeSec gracefully', async () => {
      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      act(() => {
        result.current.handleContentChange(
          JSON.stringify({
            page: {
              type: 'definition',
              title: 'Array',
              intro: 'Collection of elements',
              definition: 'Ordered list',
              explanation: ['Arrays store multiple values'],
            },
          })
        );
      });

      await act(async () => {
        result.current.handleAddBlockInstance();
      });

      const updateFn = mockSetDocumentBlocks.mock.calls[0]?.[0];
      if (typeof updateFn === 'function') {
        const newBlocks = updateFn([]);
        const newBlock = newBlocks[0];

        // expectedTimeSec should be undefined when not provided
        expect(newBlock?.expectedTimeSec).toBeUndefined();
      }
    });

    it('should not add invalid expectedTimeSec types', async () => {
      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      // Invalid expectedTimeSec (string instead of number)
      act(() => {
        result.current.handleContentChange(
          JSON.stringify({
            expectedTimeSec: 'not-a-number',
            page: {
              type: 'definition',
              title: 'Test',
              intro: 'Test',
              definition: 'Test',
              explanation: ['Test'],
            },
          })
        );
      });

      await act(async () => {
        result.current.handleAddBlockInstance();
      });

      const updateFn = mockSetDocumentBlocks.mock.calls[0]?.[0];
      if (typeof updateFn === 'function') {
        const newBlocks = updateFn([]);
        const newBlock = newBlocks[0];

        // Invalid expectedTimeSec should not be added
        expect(newBlock?.expectedTimeSec).toBeUndefined();
      }
    });
  });

  describe('update block', () => {
    it('should update an existing block when editing', async () => {
      const existingBlock = createTestBlockInstance({
        id: 'existing-1',
        title: 'Original Title',
      });

      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: [existingBlock],
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      // Load the block for editing
      act(() => {
        result.current.handleLoadBlock(existingBlock, 0, () => {});
      });

      // Modify the content
      act(() => {
        result.current.handleContentChange(
          JSON.stringify({
            page: {
              type: 'definition',
              title: 'Updated Title',
              intro: 'Updated intro',
              definition: 'Updated definition',
              explanation: ['Updated'],
            },
          })
        );
      });

      // Update the block
      await act(async () => {
        result.current.handleAddBlockInstance();
      });

      const updateFn = mockSetDocumentBlocks.mock.calls[1]?.[0];
      if (typeof updateFn === 'function') {
        const updatedBlocks = updateFn([existingBlock]);
        expect(updatedBlocks).toHaveLength(1);
        expect(updatedBlocks[0]?.id).toBe('existing-1');
        expect(updatedBlocks[0]?.title).toBe('Updated Title');
      }

      // Editing state should be cleared after update
      expect(result.current.editingBlockId).toBeNull();
      expect(mockSetMessage).toHaveBeenCalledWith(
        expect.stringContaining('Updated block')
      );
    });
  });

  describe('remove block', () => {
    it('should remove a block from the document', () => {
      const block1 = createTestBlockInstance({ id: 'block-1' });
      const block2 = createTestBlockInstance({ id: 'block-2' });

      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: [block1, block2],
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      act(() => {
        result.current.handleRemoveBlockInstance('block-1');
      });

      const updateFn = mockSetDocumentBlocks.mock.calls[0]?.[0];
      if (typeof updateFn === 'function') {
        const remainingBlocks = updateFn([block1, block2]);
        expect(remainingBlocks).toHaveLength(1);
        expect(remainingBlocks[0]?.id).toBe('block-2');
      }

      expect(mockHasUnsavedChangesRef.current).toBe(true);
      expect(mockSetMessage).toHaveBeenCalledWith('Block instance removed from document.');
    });

    it('should clear editing state when removing the block being edited', () => {
      const block1 = createTestBlockInstance({ id: 'editing-block' });

      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: [block1],
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      // Load block for editing
      act(() => {
        result.current.handleLoadBlock(block1, 0, () => {});
      });

      expect(result.current.editingBlockId).toBe('editing-block');

      // Remove the block being edited
      act(() => {
        result.current.handleRemoveBlockInstance('editing-block');
      });

      expect(result.current.editingBlockId).toBeNull();
    });
  });

  describe('C1 canonicalization', () => {
    it('should canonicalize C1 code blocks', async () => {
      const { toCanonicalCodeC1 } = await import('../../blocks/code/C1/codeC1.converter');
      const mockToCanonicalCodeC1 = toCanonicalCodeC1 as ReturnType<typeof vi.fn>;
      
      mockToCanonicalCodeC1.mockReturnValueOnce({
        content: {
          snippets: [{ language: 'javascript', code: 'const x = 1;' }],
          steps: [],
        },
        memoryModelWarning: undefined,
      });

      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'code',
            versionId: 'v1',
            versionCode: 'C1',
            versionLabel: 'Code C1',
          }
        )
      );

      act(() => {
        result.current.handleContentChange(
          JSON.stringify({
            page: { type: 'code', title: 'Example' },
            code: { language: 'javascript', code: 'const x = 1;' },
          })
        );
      });

      await act(async () => {
        result.current.handleAddBlockInstance();
      });

      expect(mockToCanonicalCodeC1).toHaveBeenCalled();

      const updateFn = mockSetDocumentBlocks.mock.calls[0]?.[0];
      if (typeof updateFn === 'function') {
        const newBlocks = updateFn([]);
        const newBlock = newBlocks[0];

        expect(newBlock?.payloadFormat).toBe('canonical');
      }
    });

    it('should surface memory model warning from C1 canonicalization', async () => {
      const { toCanonicalCodeC1 } = await import('../../blocks/code/C1/codeC1.converter');
      const mockToCanonicalCodeC1 = toCanonicalCodeC1 as ReturnType<typeof vi.fn>;

      mockToCanonicalCodeC1.mockReturnValueOnce({
        content: {
          snippets: [],
          steps: [],
        },
        memoryModelWarning: 'Memory model section missing',
      });

      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'code',
            versionId: 'v1',
            versionCode: 'C1',
            versionLabel: 'Code C1',
          }
        )
      );

      act(() => {
        result.current.handleContentChange(
          JSON.stringify({
            page: { type: 'code', title: 'Example' },
            code: { language: 'javascript', code: 'test' },
          })
        );
      });

      await act(async () => {
        result.current.handleAddBlockInstance();
      });

      expect(result.current.memoryModelWarning).toBe('Memory model section missing');
    });
  });

  describe('preview', () => {
    it('should update preview without modifying document', () => {
      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      act(() => {
        result.current.handleContentChange(
          JSON.stringify({
            page: {
              type: 'definition',
              title: 'Preview Test',
              intro: 'Test',
              definition: 'Test',
              explanation: ['Test'],
            },
          })
        );
      });

      act(() => {
        result.current.handlePreviewCurrent();
      });

      expect(mockSetDocumentBlocks).not.toHaveBeenCalled();
      expect(mockHasUnsavedChangesRef.current).toBe(false);
      expect(result.current.activeBlockPreview).toBeDefined();
      expect(mockSetMessage).toHaveBeenCalledWith('Active block preview updated.');
    });
  });

  describe('start new block', () => {
    it('should reset editing state and load default payload', () => {
      const defaultPayload = {
        page: {
          type: 'definition',
          title: 'Default',
          intro: 'Default intro',
          definition: 'Default definition',
          explanation: ['Default'],
        },
      };

      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      // Set editing state
      act(() => {
        result.current.handleLoadBlock(createTestBlockInstance(), 0, () => {});
      });

      expect(result.current.editingBlockId).toBeDefined();

      // Start new block
      act(() => {
        result.current.handleStartNewBlock(defaultPayload);
      });

      expect(result.current.editingBlockId).toBeNull();
      expect(result.current.sourceContent).toContain('Default');
      expect(mockSetMessage).toHaveBeenCalledWith('Ready to create a new block.');
    });
  });

  describe('no ILS/RSSB/LSNB/progress coupling', () => {
    it('should not contain progress-related logic', () => {
      const { result } = renderHook(() =>
        useTutorialBlockEditor(
          {
            documentBlocks: mockDocumentBlocks,
            setDocumentBlocks: mockSetDocumentBlocks,
            hasUnsavedLocalChangesRef: mockHasUnsavedChangesRef,
            setMessage: mockSetMessage,
          },
          {
            blockType: 'definition',
            versionId: 'v1',
            versionCode: 'D1',
            versionLabel: 'Definition V1',
          }
        )
      );

      // Hook should not expose any progress-related properties
      const hookKeys = Object.keys(result.current);
      expect(hookKeys).not.toContain('progressRole');
      expect(hookKeys).not.toContain('ILS');
      expect(hookKeys).not.toContain('RSSB');
      expect(hookKeys).not.toContain('LSNB');
      expect(hookKeys).not.toContain('completed');
      expect(hookKeys).not.toContain('requiredBlocks');
    });
  });
});
