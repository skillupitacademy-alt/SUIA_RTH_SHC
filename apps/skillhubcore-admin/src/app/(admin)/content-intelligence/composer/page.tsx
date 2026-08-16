'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { TutorialDocument } from '@quiz/types';

import { ComposerHeader } from './components/ComposerHeader';
import { ComposerMetadataBar } from './components/ComposerMetadataBar';
import { ComponentLibraryPanel } from './components/ComponentLibraryPanel';
import { ComposerCanvasStudio } from './components/ComposerCanvasStudio';
import { PropertiesInspectorPanel } from './components/PropertiesInspectorPanel';
import type { ReviewableSuggestionItem } from '../review-approve/components/ReviewSuggestionsTable';

/**
 * Save state for UI feedback
 */
type SaveState = 'initializing' | 'saving' | 'saved' | 'error' | 'unsaved';

export default function ComposerWorkspacePage() {
  const pathname = usePathname();
  const router = useRouter();

  const isPreviewMode = Boolean(pathname?.startsWith('/preview/'));
  const backHref = isPreviewMode
    ? '/preview/review-approve'
    : '/content-intelligence/review-approve';

  // Persistence state
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('initializing');
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Document state
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [approvedSuggestions, setApprovedSuggestions] = useState<ReviewableSuggestionItem[]>([]);
  const [history, setHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedText, setLastSavedText] = useState<string>('Just now');
  const [metadata, setMetadata] = useState<any>({
    domain: 'Full Stack Development',
    subject: 'Frontend Development',
    topic: 'JavaScript',
    subtopic: 'Variables & Data Types',
    contentMode: 'Notes',
    difficulty: 'Beginner',
    subtopicId: '00000000-0000-0000-0000-000000000001',
    sectionType: 'notes',
    brandId: 'shared',
  });

  // Auto-save refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const lastSavedBlocksRef = useRef<string>('');

  // Push new state to history for undo/redo
  const updateBlocksWithHistory = useCallback((newBlocks: any[]) => {
    setBlocks(newBlocks);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newBlocks];
    });
    setHistoryIndex((prev) => prev + 1);
    setSaveState('unsaved');
  }, [historyIndex]);

  /**
   * Create initial draft section via POST API
   * Uses ComposerDraftGeneratorService on server to transform Page 15 final review
   */
  const createInitialDraft = useCallback(async (
    finalReview: any,
    originalDocument: TutorialDocument,
    initialBlocks: any[]
  ) => {
    try {
      setSaveState('initializing');

      // Client-side defensive filtering: Remove rejected suggestions
      // Server will validate this boundary authoritatively
      const trulyApprovedSuggestions = finalReview.approvedSuggestions?.filter(
        (s: any) => s.reviewStatus === 'accepted' || s.reviewStatus === 'modified'
      ) || [];

      // Prepare POST request
      const requestBody = {
        subtopicId: finalReview.subtopicId || metadata.subtopicId,
        sectionType: finalReview.sectionType || metadata.sectionType,
        brandId: metadata.brandId,
        difficulty: metadata.difficulty,
        orderIndex: 0,
        language: 'en',
        content: {
          schemaVersion: 1,
          blocks: initialBlocks,
          metadata: {
            estimatedReadTime: Math.max(1, Math.ceil(initialBlocks.length / 3)),
            tags: ['javascript', 'web-development'],
            complexityScore: 5,
          },
        },
        generatedByAi: true,
        aiModelUsed: 'gpt-4',
      };

      const response = await fetch('/api/tutorial-composer/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const createdSectionId = result.data?.id;

      if (!createdSectionId) {
        throw new Error('No sectionId returned from server');
      }

      setSectionId(createdSectionId);
      setSaveState('saved');
      setLastSavedText('Just now');
      lastSavedBlocksRef.current = JSON.stringify(initialBlocks);

      console.log('[Composer] Initial draft created:', { sectionId: createdSectionId });
      return createdSectionId;

    } catch (error) {
      console.error('[Composer] Failed to create initial draft:', error);
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to create draft');
      toast.error('Failed to create initial draft. Working in offline mode.');
      return null;
    }
  }, [metadata]);

  /**
   * Initialize Composer from Page 15 handoff
   * Creates initial draft via POST API and obtains sectionId
   */
  useEffect(() => {
    const initializeComposer = async () => {
      try {
        const storedFinalReview = sessionStorage.getItem('tutorial_composer_final_review');
        const storedDoc = sessionStorage.getItem('tutorial_composer_document');

        let finalReview: any = null;
        let originalDocument: TutorialDocument | null = null;
        let initialBlocks: any[] = [];

        // Load Page 15 final review
        if (storedFinalReview) {
          try {
            finalReview = JSON.parse(storedFinalReview);
            if (Array.isArray(finalReview.approvedSuggestions)) {
              // Client-side defensive filtering
              const trulyApproved = finalReview.approvedSuggestions.filter(
                (s: any) => s.reviewStatus === 'accepted' || s.reviewStatus === 'modified'
              );
              setApprovedSuggestions(trulyApproved);
            }

            // Update metadata from Page 15
            if (finalReview.subtopicId) {
              setMetadata((prev: any) => ({
                ...prev,
                subtopicId: finalReview.subtopicId,
                sectionType: finalReview.sectionType || prev.sectionType,
              }));
            }
          } catch {
            // ignore
          }
        }

        // Load original document
        if (storedDoc) {
          try {
            const parsedDoc = JSON.parse(storedDoc);
            originalDocument = parsedDoc.document || parsedDoc;
            if (originalDocument && Array.isArray(originalDocument.blocks) && originalDocument.blocks.length > 0) {
              initialBlocks = originalDocument.blocks;
            }
          } catch {
            // ignore
          }
        }

        // Use default blocks if no stored data
        if (initialBlocks.length === 0) {
          initialBlocks = [
            {
              id: 'b-1',
              type: 'heading',
              content: { text: 'Variables & Data Types in JavaScript', level: 1 },
            },
            {
              id: 'b-2',
              type: 'paragraph',
              content: {
                text: 'In JavaScript, variables are used to store data values. JavaScript provides three keywords to declare variables: let, const, and var.',
              },
            },
            {
              id: 'b-3',
              type: 'paragraph',
              content: {
                text: 'Each keyword has different scope, behavior, and use cases.',
              },
            },
            {
              id: 'b-4',
              type: 'list',
              content: {
                style: 'unordered',
                items: [
                  { text: 'let - Block scoped, can be reassigned' },
                  { text: 'const - Block scoped, cannot be reassigned' },
                  { text: 'var - Function scoped, can be reassigned' },
                ],
              },
            },
            {
              id: 'b-5',
              type: 'callout',
              content: {
                text: 'Prefer using let and const in modern JavaScript development.',
                variant: 'warning',
              },
            },
            {
              id: 'b-6',
              type: 'code',
              content: {
                language: 'javascript',
                code: 'let name = "John";\nconst age = 25;\nvar isActive = true;',
              },
            },
            {
              id: 'b-7',
              type: 'quote',
              content: {
                text: 'The best way to learn JavaScript is by building real projects.',
                author: 'Brendan Eich',
              },
            },
          ];
        }

        // Set initial blocks in state
        setBlocks(initialBlocks);
        setSelectedBlockId(initialBlocks[0]?.id || null);
        setHistory([initialBlocks]);
        setHistoryIndex(0);

        // Create initial draft via POST API if we have a final review
        if (finalReview && finalReview.approvedSuggestions) {
          await createInitialDraft(finalReview, originalDocument || {
            schemaVersion: 1,
            blocks: initialBlocks,
            metadata: {
              estimatedReadTime: 5,
              tags: [],
              complexityScore: 5,
            },
          }, initialBlocks);
        } else {
          // No Page 15 handoff - working with default content
          setSaveState('unsaved');
        }

      } catch (error) {
        console.error('[Composer] Initialization error:', error);
        setSaveState('error');
        setSaveError('Failed to initialize composer');
        toast.error('Failed to load composer. Please try again.');
      }
    };

    initializeComposer();
  }, []); // Run once on mount

  /**
   * Auto-save: Debounced change-based persistence
   * Triggers 2 seconds after document changes (not blind timer)
   */
  useEffect(() => {
    // Don't auto-save during initialization or if already saving
    if (saveState === 'initializing' || !sectionId) {
      return;
    }

    // Don't auto-save if no changes
    const currentBlocksJson = JSON.stringify(blocks);
    if (currentBlocksJson === lastSavedBlocksRef.current) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new debounced save
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 2000); // 2 seconds after last change

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [blocks, saveState, sectionId]);

  /**
   * Auto-save implementation
   * Prevents concurrent saves with ref guard
   */
  const handleAutoSave = useCallback(async () => {
    // Prevent concurrent saves
    if (isSavingRef.current || !sectionId) {
      return;
    }

    try {
      isSavingRef.current = true;
      setSaveState('saving');
      setIsSaving(true);

      const docPayload: TutorialDocument = {
        schemaVersion: 1,
        blocks,
        metadata: {
          estimatedReadTime: Math.max(1, Math.ceil(blocks.length / 3)),
          tags: ['javascript', 'web-development'],
          complexityScore: 5,
        },
      };

      const response = await fetch(`/api/tutorial-composer/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: docPayload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      setSaveState('saved');
      setLastSavedText('Just now');
      lastSavedBlocksRef.current = JSON.stringify(blocks);

    } catch (error) {
      console.error('[Composer] Auto-save failed:', error);
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Auto-save failed');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [blocks, sectionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setBlocks(history[prevIndex]);
      setHistoryIndex(prevIndex);
      setSaveState('unsaved');
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setBlocks(history[nextIndex]);
      setHistoryIndex(nextIndex);
      setSaveState('unsaved');
    }
  }, [history, historyIndex]);

  // Add Component from Library
  const handleAddComponent = useCallback(
    (blockType: string, initialContent?: any) => {
      const newId = `block-${Date.now()}`;
      let content: any = initialContent || {};

      if (blockType === 'heading') {
        content = { text: 'New Heading', level: 2, ...content };
      } else if (blockType === 'paragraph') {
        content = { text: 'New paragraph content here...', ...content };
      } else if (blockType === 'code') {
        content = { language: 'javascript', code: '// Write code here...', ...content };
      } else if (blockType === 'callout') {
        content = { text: 'Important note or tip...', variant: 'info', ...content };
      } else if (blockType === 'quote') {
        content = { text: 'Notable quote text...', author: 'Author', ...content };
      } else if (blockType === 'card-grid') {
        content = { columns: 3, ...content };
      } else if (blockType === 'two-column') {
        content = { ratio: '50-50', ...content };
      }

      const newBlock = { id: newId, type: blockType, content };
      const updated = [...blocks, newBlock];
      updateBlocksWithHistory(updated);
      setSelectedBlockId(newId);
      toast.success(`Added ${blockType} component`);
    },
    [blocks, updateBlocksWithHistory]
  );

  // Apply Suggestion from Page 15 Approved Items
  const handleApplySuggestion = useCallback(
    (suggestion: ReviewableSuggestionItem) => {
      const newId = `suggested-${Date.now()}`;
      let targetType = suggestion.targetBlockType || 'paragraph';

      // Concept-cards maps to canonical card-grid
      if (suggestion.type === 'card-grid' || targetType === 'card-grid') {
        targetType = 'card-grid';
      }

      let content: any = {};
      if (targetType === 'callout') {
        content = {
          text: suggestion.customModification?.customTitle || suggestion.title,
          variant: 'warning',
        };
      } else if (targetType === 'two-column') {
        content = {
          ratio: '50-50',
          gap: 'normal',
        };
      } else if (targetType === 'card-grid') {
        content = {
          columns: 3,
          gap: 'normal',
        };
      } else if (targetType === 'example') {
        content = {
          text: suggestion.description,
        };
      } else {
        content = {
          text: suggestion.customModification?.customTitle || suggestion.title,
        };
      }

      const newBlock = {
        id: newId,
        type: targetType,
        content,
      };

      const updated = [...blocks, newBlock];
      updateBlocksWithHistory(updated);
      setSelectedBlockId(newId);
      toast.success(`Applied suggestion as canonical ${targetType} block`);
    },
    [blocks, updateBlocksWithHistory]
  );

  // Update Block Properties
  const handleUpdateBlock = useCallback(
    (blockId: string, updatedContent: any) => {
      const updated = blocks.map((b) =>
        b.id === blockId ? { ...b, content: updatedContent } : b
      );
      setBlocks(updated);
    },
    [blocks]
  );

  // Delete Block
  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      const updated = blocks.filter((b) => b.id !== blockId);
      updateBlocksWithHistory(updated);
      if (selectedBlockId === blockId) {
        setSelectedBlockId(updated[0]?.id || null);
      }
      toast.success('Block deleted');
    },
    [blocks, selectedBlockId, updateBlocksWithHistory]
  );

  // Duplicate Block
  const handleDuplicateBlock = useCallback(
    (blockId: string) => {
      const targetIndex = blocks.findIndex((b) => b.id === blockId);
      if (targetIndex === -1) return;
      const target = blocks[targetIndex];
      const duplicated = {
        ...target,
        id: `block-${Date.now()}`,
        content: JSON.parse(JSON.stringify(target.content || {})),
      };
      const updated = [
        ...blocks.slice(0, targetIndex + 1),
        duplicated,
        ...blocks.slice(targetIndex + 1),
      ];
      updateBlocksWithHistory(updated);
      setSelectedBlockId(duplicated.id);
      toast.success('Block duplicated');
    },
    [blocks, updateBlocksWithHistory]
  );

  // Move Block (Up / Down)
  const handleMoveBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      const index = blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === blocks.length - 1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const updated = [...blocks];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;

      updateBlocksWithHistory(updated);
    },
    [blocks, updateBlocksWithHistory]
  );

  // Save Draft (manual save)
  const handleSaveDraft = useCallback(async () => {
    if (!sectionId) {
      toast.error('No draft section created yet');
      return;
    }

    // Prevent concurrent saves
    if (isSavingRef.current) {
      toast.info('Save already in progress');
      return;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveState('saving');

      const docPayload: TutorialDocument = {
        schemaVersion: 1,
        blocks,
        metadata: {
          estimatedReadTime: Math.max(1, Math.ceil(blocks.length / 3)),
          tags: ['javascript', 'web-development'],
          complexityScore: 5,
        },
      };

      const response = await fetch(`/api/tutorial-composer/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: docPayload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to save this draft.');
        } else if (response.status === 404) {
          throw new Error('Draft not found. It may have been deleted.');
        } else if (response.status === 409) {
          throw new Error('Draft conflict. The draft was changed elsewhere.');
        } else if (response.status === 422) {
          throw new Error('Invalid content. Please check your document structure.');
        }
        
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      setSaveState('saved');
      setLastSavedText('Just now');
      lastSavedBlocksRef.current = JSON.stringify(blocks);
      toast.success('Draft saved successfully');

    } catch (error) {
      console.error('[Composer] Save draft failed:', error);
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to save draft');
      toast.error(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [blocks, sectionId]);

  // Publish
  const handlePublish = useCallback(async () => {
    if (blocks.length === 0) {
      toast.error('Cannot publish an empty tutorial document');
      return;
    }

    if (!sectionId) {
      toast.error('No draft section to publish');
      return;
    }

    // Prevent concurrent operations
    if (isSavingRef.current) {
      toast.info('Please wait for the current save to complete');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to publish this tutorial? It will be visible to learners immediately.'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveState('saving');

      const response = await fetch(`/api/tutorial-composer/sections/${sectionId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to publish this tutorial.');
        } else if (response.status === 404) {
          throw new Error('Draft not found. It may have been deleted.');
        } else if (response.status === 409) {
          throw new Error('Cannot publish: Invalid status transition.');
        } else if (response.status === 422) {
          throw new Error('Invalid content. Please review your document structure.');
        }
        
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      setSaveState('saved');
      toast.success('Tutorial published successfully! Learners can now see it.');
      
      // Optional: Navigate back to review page or dashboard
      // router.push(backHref);

    } catch (error) {
      console.error('[Composer] Publish failed:', error);
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to publish');
      toast.error(error instanceof Error ? error.message : 'Failed to publish tutorial');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [blocks, sectionId, backHref, router]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Save state UI text
  const getSaveStateText = () => {
    switch (saveState) {
      case 'initializing':
        return 'Initializing...';
      case 'saving':
        return 'Saving...';
      case 'saved':
        return `Saved ${lastSavedText}`;
      case 'error':
        return `Error: ${saveError || 'Save failed'}`;
      case 'unsaved':
        return 'Unsaved changes';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8">
      {/* Save State Banner (for errors) */}
      {saveState === 'error' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">⚠️ Save Error:</span>
            <span className="text-red-700">{saveError}</span>
          </div>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Initializing State */}
      {saveState === 'initializing' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-blue-700 font-medium">Creating initial draft...</span>
        </div>
      )}

      {/* 1. Header */}
      <ComposerHeader
        status="DRAFT"
        isSaving={isSaving}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onPreview={() => toast.info('Opening preview viewport')}
        backHref={backHref}
      />

      {/* 2. Metadata Summary Bar */}
      <ComposerMetadataBar
        domain={metadata.domain}
        subject={metadata.subject}
        topic={metadata.topic}
        subtopic={metadata.subtopic}
        contentMode={metadata.contentMode}
        difficulty={metadata.difficulty}
        onChangeSelection={() => toast.info('Location hierarchy selected')}
      />

      {/* 3. 3-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Component Library (~20% / 3 cols) */}
        <div className="lg:col-span-3">
          <ComponentLibraryPanel
            onAddComponent={handleAddComponent}
            approvedSuggestions={approvedSuggestions}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>

        {/* Center Column: Interactive Canvas Studio (~55% / 6 cols) */}
        <div className="lg:col-span-6">
          <ComposerCanvasStudio
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={(id) => setSelectedBlockId(id)}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onMoveBlock={handleMoveBlock}
            onAddFirstComponent={() => handleAddComponent('heading')}
            undoDisabled={historyIndex <= 0}
            redoDisabled={historyIndex >= history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            lastSavedText={getSaveStateText()}
            isSaving={isSaving}
          />
        </div>

        {/* Right Column: Properties Inspector (~25% / 3 cols) */}
        <div className="lg:col-span-3">
          <PropertiesInspectorPanel
            selectedBlock={selectedBlock}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onMoveBlock={handleMoveBlock}
          />
        </div>
      </div>
    </div>
  );
}
