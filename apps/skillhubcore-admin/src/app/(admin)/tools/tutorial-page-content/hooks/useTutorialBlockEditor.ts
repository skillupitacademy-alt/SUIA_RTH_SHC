import { useState, useCallback } from 'react';
import type {
  TutorialCodePayload,
  TutorialDefinitionPayload,
  TutorialIntroductionPayload,
  TutorialPageContentType,
  TutorialSummaryPayload,
  CodeC1AuthorContent,
} from '@quiz/types';
import { toCanonicalCodeC1 } from '../blocks/code/C1/codeC1.converter';
import { extractBlockTitle, type BlockInstance } from '../document/documentTransformation';
import { parseSource, type SourceFormat } from '../document/sourceParser';
import { normalizeBlockPreview } from '../utils/normalizeBlockPreview';

interface BlockEditorDependencies {
  documentBlocks: BlockInstance[];
  setDocumentBlocks: React.Dispatch<React.SetStateAction<BlockInstance[]>>;
  hasUnsavedLocalChangesRef: React.MutableRefObject<boolean>;
  setMessage: (message: string) => void;
}

interface BlockEditorFormState {
  blockType: TutorialPageContentType;
  versionId: string;
  versionCode: string;
  versionLabel: string;
}

export interface BlockEditorState {
  sourceFormat: SourceFormat;
  sourceContent: string;
  activeBlockPreview: unknown;
  memoryModelWarning: string;
  editingBlockId: string | null;
}

export function useTutorialBlockEditor(
  deps: BlockEditorDependencies,
  formState: BlockEditorFormState
) {
  const [sourceFormat, setSourceFormat] = useState<SourceFormat>('json');
  const [sourceContent, setSourceContent] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy preview state, type refinement tracked in backlog
  const [activeBlockPreview, setActiveBlockPreview] = useState<any>(null);
  const [memoryModelWarning, setMemoryModelWarning] = useState('');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  /**
   * Preview the current source content without adding/updating the block
   */
  const handlePreviewCurrent = useCallback(() => {
    try {
      const parsed = parseSource(sourceFormat, sourceContent, formState.blockType);
      const normalized = normalizeBlockPreview(parsed, formState.blockType, formState.versionCode);
      setActiveBlockPreview(normalized.content);
      setMemoryModelWarning(normalized.memoryModelWarning);
      deps.setMessage('Active block preview updated.');
    } catch (error) {
      deps.setMessage(error instanceof Error ? error.message : 'Preview parsing failed.');
    }
  }, [sourceFormat, sourceContent, formState.blockType, formState.versionCode, deps]);

  /**
   * Add new block instance OR update existing block instance in TutorialDocument.
   * Handles expectedTimeSec extraction and C1 canonicalization.
   */
  const handleAddBlockInstance = useCallback(() => {
    try {
      const parsed = parseSource(sourceFormat, sourceContent, formState.blockType) as
        | TutorialDefinitionPayload
        | TutorialCodePayload
        | TutorialSummaryPayload
        | TutorialIntroductionPayload;

      // Extract expectedTimeSec at root level if present (AI-generated metadata)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic payload parsing requires any
      const rawParsed = JSON.parse(sourceContent) as any;
      const expectedTimeSec =
        typeof rawParsed.expectedTimeSec === 'number' ? rawParsed.expectedTimeSec : undefined;

      // Normalize payload: remove expectedTimeSec if present (it belongs at BlockInstance level, not inside payload)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic payload normalization requires any
      const normalizedParsed = { ...parsed } as any;
      if ('expectedTimeSec' in normalizedParsed) {
        delete normalizedParsed.expectedTimeSec;
      }

      // Canonicalize C1 blocks immediately upon Add/Update
      let payload:
        | TutorialDefinitionPayload
        | TutorialCodePayload
        | TutorialSummaryPayload
        | TutorialIntroductionPayload
        | CodeC1AuthorContent = normalizedParsed;
      let payloadFormat: 'legacy' | 'canonical' = 'legacy';

      if (formState.blockType === 'code' && formState.versionCode === 'C1') {
        const result = toCanonicalCodeC1(parsed);

        // Store canonical content, not legacy
        payload = result.content;
        payloadFormat = 'canonical';

        // Surface memoryModel warning if present
        if (result.memoryModelWarning) {
          setMemoryModelWarning(result.memoryModelWarning);
        }
      }

      const title = extractBlockTitle(payload, formState.blockType);

      // Check if we're editing an existing block
      if (editingBlockId) {
        // UPDATE mode: replace existing block in place
        deps.hasUnsavedLocalChangesRef.current = true;
        deps.setDocumentBlocks((prev) =>
          prev.map((block) =>
            block.id === editingBlockId
              ? {
                  ...block,
                  type: formState.blockType,
                  version: formState.versionId,
                  versionCode: formState.versionCode,
                  title,
                  payload,
                  payloadFormat,
                  sourceFormat,
                  sourceContent,
                  expectedTimeSec,
                }
              : block
          )
        );
        deps.setMessage(`Updated block: ${formState.versionCode} (${title})`);
        setEditingBlockId(null); // Clear editing state
      } else {
        // ADD mode: append new block
        const uniqueId = crypto.randomUUID();

        const newInstance: BlockInstance = {
          id: uniqueId,
          type: formState.blockType,
          version: formState.versionId,
          versionCode: formState.versionCode,
          title,
          payload,
          payloadFormat,
          sourceFormat,
          sourceContent,
          expectedTimeSec,
        };

        deps.hasUnsavedLocalChangesRef.current = true;
        deps.setDocumentBlocks((prev) => [...prev, newInstance]);
        deps.setMessage(`Appended new block instance: ${formState.versionCode} (${title})`);
      }
    } catch (error) {
      deps.setMessage(
        error instanceof Error
          ? `Cannot add block: ${error.message}`
          : 'Failed to add block instance.'
      );
    }
  }, [
    sourceFormat,
    sourceContent,
    formState,
    editingBlockId,
    deps,
  ]);

  /**
   * Remove a block instance from the document
   */
  const handleRemoveBlockInstance = useCallback(
    (id: string) => {
      deps.hasUnsavedLocalChangesRef.current = true;
      deps.setDocumentBlocks((prev) => prev.filter((b) => b.id !== id));
      // If we're removing the block being edited, clear editing state
      if (editingBlockId === id) {
        setEditingBlockId(null);
      }
      deps.setMessage('Block instance removed from document.');
    },
    [editingBlockId, deps]
  );

  /**
   * Load an existing block into the editor for editing
   */
  const handleLoadBlock = useCallback(
    (block: BlockInstance, index: number, onFormUpdate: (updates: Partial<{ blockType: TutorialPageContentType; versionId: string }>) => void) => {
      setSourceContent(block.sourceContent);
      const normalized = normalizeBlockPreview(block.payload, block.type, block.versionCode);
      setActiveBlockPreview(normalized.content);
      setMemoryModelWarning(normalized.memoryModelWarning);
      onFormUpdate({ blockType: block.type, versionId: block.version });
      setEditingBlockId(block.id); // Track which block is being edited
      deps.setMessage(
        `Loaded block #${index + 1} (${block.versionCode}) into editor for editing.`
      );
    },
    [deps]
  );

  /**
   * Clear editing mode and start fresh with a new block
   */
  const handleStartNewBlock = useCallback(
    (defaultPayload: unknown) => {
      setEditingBlockId(null);
      setSourceContent(JSON.stringify(defaultPayload, null, 2));
      const normalized = normalizeBlockPreview(
        defaultPayload,
        formState.blockType,
        formState.versionCode
      );
      setActiveBlockPreview(normalized.content);
      setMemoryModelWarning(normalized.memoryModelWarning);
      deps.setMessage('Ready to create a new block.');
    },
    [formState.blockType, formState.versionCode, deps]
  );

  /**
   * Update source content and clear warnings
   */
  const handleContentChange = useCallback((content: string) => {
    setSourceContent(content);
    setMemoryModelWarning(''); // Clear warning when user edits
  }, []);

  /**
   * Update preview when default payload changes
   */
  const updatePreviewFromPayload = useCallback(
    (payload: unknown) => {
      setSourceContent(JSON.stringify(payload, null, 2));
      const normalized = normalizeBlockPreview(payload, formState.blockType, formState.versionCode);
      setActiveBlockPreview(normalized.content);
      setMemoryModelWarning(normalized.memoryModelWarning);
    },
    [formState.blockType, formState.versionCode]
  );

  return {
    // State
    sourceFormat,
    sourceContent,
    activeBlockPreview,
    memoryModelWarning,
    editingBlockId,

    // Setters
    setSourceFormat,

    // Handlers
    handlePreviewCurrent,
    handleAddBlockInstance,
    handleRemoveBlockInstance,
    handleLoadBlock,
    handleStartNewBlock,
    handleContentChange,
    updatePreviewFromPayload,
  };
}
