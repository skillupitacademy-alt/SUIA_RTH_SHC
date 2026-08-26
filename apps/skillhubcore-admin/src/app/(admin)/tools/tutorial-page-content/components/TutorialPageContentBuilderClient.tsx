'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  TutorialCodePayload,
  TutorialDefinitionPayload,
  TutorialPageContentType,
  TutorialSidebarBrandId,
  TutorialSummaryPayload,
  TutorialDocument,
  TutorialBlock,
  CodeC1AuthorContent,
} from '@quiz/types';

const SHARED_BRAND_ID: TutorialSidebarBrandId = 'shared';

import { toCanonicalCodeC1 } from '../blocks/code/C1/codeC1.converter';
import {
  toTutorialBlock,
  tutorialBlocksToInstances,
  extractBlockTitle,
  type BlockInstance,
} from '../document/documentTransformation';
import { parseSource, type SourceFormat } from '../document/sourceParser';
import { TutorialComposerHeader } from './TutorialComposerHeader';
import { TutorialHierarchySelector } from './TutorialHierarchySelector';
import { TutorialNavigationNodeSelector } from './TutorialNavigationNodeSelector'; // Phase 1
import { TutorialBlockSelector } from './TutorialBlockSelector';
import { TutorialDocumentBlocksList } from './TutorialDocumentBlocksList';
import { TutorialPreviewPane } from './TutorialPreviewPane';
import { TutorialEditorPanel } from './TutorialEditorPanel';
import { AiInstructionContainer } from './AiInstructionContainer';
import { getBlockTypes, getBlockType, getDefaultPayload } from '../registry';
import { useTutorialNavigationNodes } from '../hooks/useTutorialNavigationNodes'; // Phase 1
import { useTutorialHydration } from '../hooks/useTutorialHydration'; // Phase 1
import { saveTutorialSection } from '../services/tutorialSaveService'; // Phase 1

interface HierarchyRow {
  id: string;
  name: string;
  slug: string;
  domainId?: string;
  subjectId?: string;
  topicId?: string;
}

interface HierarchyState {
  domains: HierarchyRow[];
  subjects: HierarchyRow[];
  topics: HierarchyRow[];
  subtopics: HierarchyRow[];
}

interface FormState {
  brandId: TutorialSidebarBrandId;
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  navigationNodeId: string; // Phase 1: Navigation page identity
  blockType: TutorialPageContentType;
  versionId: string;
}

/**
 * Pure helper to append a block to a TutorialDocument immutably
 */
export function appendTutorialBlock(
  document: TutorialDocument,
  block: TutorialBlock
): TutorialDocument {
  return {
    ...document,
    blocks: [...document.blocks, block],
  };
}

const initialHierarchy: HierarchyState = { domains: [], subjects: [], topics: [], subtopics: [] };
const initialForm: FormState = {
  brandId: SHARED_BRAND_ID,
  domainId: '',
  subjectId: '',
  topicId: '',
  subtopicId: '',
  navigationNodeId: '', // Phase 1: Initial navigation node selection empty
  blockType: 'definition',
  versionId: 'v1',
};

export function TutorialPageContentBuilderClient() {
  const [hierarchy, setHierarchy] = useState<HierarchyState>(initialHierarchy);
  const [form, setForm] = useState<FormState>(initialForm);
  
  // Phase 1: Navigation nodes for selected subtopic
  const { navigationNodes, isLoading: isLoadingNodes } = useTutorialNavigationNodes(
    form.subtopicId,
    form.brandId
  );
  
  // Phase 1: Hydration hook manages document loading
  const {
    documentBlocks,
    setDocumentBlocks,
    isLoadingDocument,
    loadedSectionId,
    setLoadedSectionId,
    hasUnsavedLocalChangesRef,
    loadExistingTutorial,
    invalidateHydration,
    message,
    setMessage,
  } = useTutorialHydration({ brandId: form.brandId });
  
  const [sourceFormat, setSourceFormat] = useState<SourceFormat>('json');
  const [sourceContent, setSourceContent] = useState(JSON.stringify(getDefaultPayload('definition'), null, 2));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy preview state, type refinement tracked in backlog
  const [activeBlockPreview, setActiveBlockPreview] = useState<any>(getDefaultPayload('definition'));
  const [previewMode, setPreviewMode] = useState<'document' | 'active-block'>('document');
  const [memoryModelWarning, setMemoryModelWarning] = useState('');

  /**
   * Normalize active preview state - ensures C1 blocks are always canonical
   * 
   * INVARIANT: For Code C1, activeBlockPreview MUST always be CodeC1AuthorContent
   */
  function normalizeActivePreview(
    payload: unknown,
    blockType: TutorialPageContentType,
    versionCode: string
  ): unknown {
    if (blockType === 'code' && versionCode === 'C1') {
      try {
        const result = toCanonicalCodeC1(payload);
        setMemoryModelWarning(result.memoryModelWarning || '');
        return result.content;
      } catch (error) {
        console.error('[C1 Normalization] Failed to convert to canonical:', error);
        setMemoryModelWarning('');
        return payload; // Fallback to raw payload if conversion fails
      }
    }
    setMemoryModelWarning('');
    return payload;
  } // UI warning for memoryModel loss
  const [isSaving, setIsSaving] = useState(false);
  
  // Track which block is currently being edited (null = new block mode)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  // Check for duplicate IDs (React reconciliation issue)
  useEffect(() => {
    const ids = documentBlocks.map((block) => block.id);
    const uniqueIds = new Set(ids);
    
    // Duplicate IDs detected - validation will fail at API level
    if (uniqueIds.size !== ids.length) {
      // Duplicates exist - let API validation handle it
    }
  }, [documentBlocks]);

  useEffect(() => {
    fetch('/api/tutorial-left-sidebar/hierarchy')
      .then((response) => response.json())
      .then(setHierarchy)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load hierarchy.'));
  }, []);

  useEffect(() => {
    const example = getDefaultPayload(form.blockType, form.versionId);
    setSourceContent(JSON.stringify(example, null, 2));
    setActiveBlockPreview(normalizeActivePreview(example, form.blockType, form.versionId));
  }, [form.blockType, form.versionId]);

  // Phase 1: Hydrate existing tutorial when navigation context changes
  // Phase 2: Hook manages AbortController and request sequence internally
  useEffect(() => {
    if (!form.subtopicId || !form.navigationNodeId) {
      // Reset state when no complete navigation context
      invalidateHydration();
      hasUnsavedLocalChangesRef.current = false;
      return;
    }

    void loadExistingTutorial(form.subtopicId, form.navigationNodeId);
  }, [form.subtopicId, form.navigationNodeId, loadExistingTutorial, invalidateHydration]);

  const subjects = useMemo(() => hierarchy.subjects.filter((item) => item.domainId === form.domainId), [hierarchy.subjects, form.domainId]);
  const topics = useMemo(() => hierarchy.topics.filter((item) => item.subjectId === form.subjectId), [hierarchy.topics, form.subjectId]);
  const subtopics = useMemo(() => hierarchy.subtopics.filter((item) => item.topicId === form.topicId), [hierarchy.subtopics, form.topicId]);
  const selectedSubtopic = subtopics.find((item) => item.id === form.subtopicId);

  const currentBlockConfig = useMemo(() => {
    return getBlockType(form.blockType) || getBlockTypes()[0];
  }, [form.blockType]);

  const availableVersions = currentBlockConfig.versions;

  const selectedVersion = useMemo(() => {
    return availableVersions.find((v) => v.id === form.versionId) || availableVersions[0];
  }, [availableVersions, form.versionId]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      // Phase 1: Reset dependent selections when hierarchy changes
      if (key === 'domainId') {
        next.subjectId = '';
        next.topicId = '';
        next.subtopicId = '';
        next.navigationNodeId = '';
      }
      if (key === 'subjectId') {
        next.topicId = '';
        next.subtopicId = '';
        next.navigationNodeId = '';
      }
      if (key === 'topicId') {
        next.subtopicId = '';
        next.navigationNodeId = '';
      }
      if (key === 'subtopicId') {
        next.navigationNodeId = '';
      }
      if (key === 'blockType') {
        const block = getBlockType(value as TutorialPageContentType);
        next.versionId = block?.versions[0]?.id || 'v1';
      }
      return next;
    });
  }

  function handlePreviewCurrent() {
    try {
      const parsed = parseSource(sourceFormat, sourceContent, form.blockType);
      setActiveBlockPreview(normalizeActivePreview(parsed, form.blockType, selectedVersion.code));
      setMessage('Active block preview updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Preview parsing failed.');
    }
  }

  /**
   * Add new block instance OR update existing block instance in TutorialDocument
   */
  function handleAddBlockInstance() {
    try {
      const parsed = parseSource(sourceFormat, sourceContent, form.blockType) as 
        TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload;
      
      // Canonicalize C1 blocks immediately upon Add/Update
      let payload: TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload | CodeC1AuthorContent = parsed;
      let payloadFormat: 'legacy' | 'canonical' = 'legacy';
      
      if (form.blockType === 'code' && selectedVersion.code === 'C1') {
        const result = toCanonicalCodeC1(parsed);
        
        // Store canonical content, not legacy
        payload = result.content;
        payloadFormat = 'canonical';
        
        // Surface memoryModel warning if present
        if (result.memoryModelWarning) {
          setMemoryModelWarning(result.memoryModelWarning);
        }
      }
      
      const title = extractBlockTitle(payload, form.blockType);

      // Check if we're editing an existing block
      if (editingBlockId) {
        // UPDATE mode: replace existing block in place
        hasUnsavedLocalChangesRef.current = true;
        setDocumentBlocks((prev) => 
          prev.map((block) => 
            block.id === editingBlockId
              ? {
                  ...block,
                  type: form.blockType,
                  version: form.versionId,
                  versionCode: selectedVersion.code,
                  title,
                  payload,
                  payloadFormat,
                  sourceFormat,
                  sourceContent,
                }
              : block
          )
        );
        setPreviewMode('document');
        setMessage(`Updated block: ${selectedVersion.code} (${title})`);
        setEditingBlockId(null); // Clear editing state
      } else {
        // ADD mode: append new block
        const uniqueId = crypto.randomUUID();

        const newInstance: BlockInstance = {
          id: uniqueId,
          type: form.blockType,
          version: form.versionId,
          versionCode: selectedVersion.code,
          title,
          payload,
          payloadFormat,
          sourceFormat,
          sourceContent,
        };

        hasUnsavedLocalChangesRef.current = true;
        setDocumentBlocks((prev) => [...prev, newInstance]);
        setPreviewMode('document');
        setMessage(`Appended new block instance: ${selectedVersion.code} (${title})`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? `Cannot add block: ${error.message}` : 'Failed to add block instance.');
    }
  }

  /**
   * Remove a block instance from the local list
   */
  function handleRemoveBlockInstance(id: string) {
    hasUnsavedLocalChangesRef.current = true;
    setDocumentBlocks((prev) => prev.filter((b) => b.id !== id));
    // If we're removing the block being edited, clear editing state
    if (editingBlockId === id) {
      setEditingBlockId(null);
    }
    setMessage('Block instance removed from document.');
  }
  
  /**
   * Clear editing mode and start fresh with a new block
   */
  function handleStartNewBlock() {
    setEditingBlockId(null);
    const example = getDefaultPayload(form.blockType, form.versionId);
    setSourceContent(JSON.stringify(example, null, 2));
    setActiveBlockPreview(normalizeActivePreview(example, form.blockType, form.versionId));
    setMessage('Ready to create a new block.');
  }

  async function save(status: 'draft' | 'published') {
    setIsSaving(true);
    setMessage('');

    try {
      // Phase 1: Use save service with navigationNodeId
      const result = await saveTutorialSection(
        {
          subtopicId: form.subtopicId,
          navigationNodeId: form.navigationNodeId,
          brandId: form.brandId,
          documentBlocks,
          loadedSectionId,
          isLoadingDocument,
        },
        status
      );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      // Update loadedSectionId if we just created a new section
      if (result.sectionId && !loadedSectionId) {
        setLoadedSectionId(result.sectionId);
      }

      // Clear dirty flag after successful save
      hasUnsavedLocalChangesRef.current = false;

      // Handle publish flow if status is 'published'
      if (status === 'published' && result.sectionId) {
        const publishUrl = `/api/tutorial-composer/sections/${result.sectionId}/publish`;

        const publishResponse = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!publishResponse.ok) {
          const publishError = await publishResponse.json();
          setMessage(`Saved but publish failed: ${publishError.error?.message || 'Unknown error'}`);
          return;
        }

        // Generate public URL from hierarchy slugs
        const domain = hierarchy.domains.find((d) => d.id === form.domainId);
        const subject = subjects.find((s) => s.id === form.subjectId);
        const topic = topics.find((t) => t.id === form.topicId);
        const subtopic = subtopics.find((st) => st.id === form.subtopicId);

        if (domain && subject && topic && subtopic) {
          const publicUrl = `https://user.skillupitacademy.com/tutorial-v2/${domain.slug}/${subject.slug}/${topic.slug}/${subtopic.slug}`;
          setMessage(`${result.message}\n\nPublished URL: ${publicUrl}`);
        } else {
          setMessage(`${result.message} Published successfully!`);
        }
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  const domainName = hierarchy.domains.find((d) => d.id === form.domainId)?.name || 'Not selected';
  const subjectName = subjects.find((s) => s.id === form.subjectId)?.name || 'Not selected';
  const topicName = topics.find((t) => t.id === form.topicId)?.name || 'Not selected';
  const subtopicName = selectedSubtopic?.name || 'Not selected';

  return (
    <main className="min-h-screen bg-[#f4f7fa] p-4 sm:p-6">
      <div className="mx-auto max-w-[1700px] space-y-6">
        {/* Top Header & Compact Horizontal Authoring Toolbar */}
        <header className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
          <TutorialComposerHeader 
            isLoadingDocument={isLoadingDocument}
            documentBlockCount={documentBlocks.length}
          />

          {/* Horizontal Hierarchy & Content Selector Toolbar */}
          <div className="flex flex-wrap items-end gap-3">
            <TutorialHierarchySelector
              domains={hierarchy.domains}
              subjects={subjects}
              topics={topics}
              subtopics={subtopics}
              domainId={form.domainId}
              subjectId={form.subjectId}
              topicId={form.topicId}
              subtopicId={form.subtopicId}
              onDomainChange={(value) => updateForm('domainId', value)}
              onSubjectChange={(value) => updateForm('subjectId', value)}
              onTopicChange={(value) => updateForm('topicId', value)}
              onSubtopicChange={(value) => updateForm('subtopicId', value)}
            />

            {/* Phase 1: Navigation Node Selector */}
            <TutorialNavigationNodeSelector
              navigationNodes={navigationNodes}
              navigationNodeId={form.navigationNodeId}
              onNavigationNodeChange={(value) => updateForm('navigationNodeId', value)}
              disabled={!form.subtopicId || isLoadingNodes}
            />

            <TutorialBlockSelector
              blockTypes={getBlockTypes()}
              availableVersions={availableVersions}
              blockType={form.blockType}
              versionId={form.versionId}
              sourceFormat={sourceFormat}
              onBlockTypeChange={(value) => updateForm('blockType', value)}
              onVersionChange={(value) => updateForm('versionId', value)}
              onSourceFormatChange={setSourceFormat}
            />
          </div>
        </header>

        {/* 2-Column Workspace below the Horizontal Toolbar (460px Authoring Column + 1fr Preview Column) */}
        <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-6 items-start">
          {/* Left Column: AI Instructions + JSON Editor + Action Buttons + Document Blocks List */}
          <section className="space-y-5">
            {/* AI Generation Instructions Container */}
            <AiInstructionContainer
              domainName={domainName}
              subjectName={subjectName}
              topicName={topicName}
              subtopicName={subtopicName}
              blockName={currentBlockConfig.label}
              versionName={selectedVersion.label}
              blockType={form.blockType}
              versionId={form.versionId}
            />

            {/* JSON Content Editor & Append Controls */}
            <TutorialEditorPanel
              sourceContent={sourceContent}
              versionCode={selectedVersion.code}
              isEditingExisting={editingBlockId !== null}
              onContentChange={(content) => {
                setSourceContent(content);
                setMemoryModelWarning(''); // Clear warning when user edits
              }}
              onAddBlock={handleAddBlockInstance}
              onStartNewBlock={handleStartNewBlock}
              onPreviewBlock={handlePreviewCurrent}
              onSaveDraft={() => save('draft')}
              onPublish={() => save('published')}
              message={message}
              memoryModelWarning={memoryModelWarning}
              isSaving={isSaving}
              isLoadingDocument={isLoadingDocument}
              canSave={Boolean(form.subtopicId)}
            />

            {/* Document Blocks List (Ordered Block Instances in TutorialDocument) */}
            <TutorialDocumentBlocksList
              documentBlocks={documentBlocks}
              onLoadBlock={(block, index) => {
                setSourceContent(block.sourceContent);
                setActiveBlockPreview(normalizeActivePreview(block.payload, block.type, block.versionCode));
                setForm((prev) => ({ ...prev, blockType: block.type, versionId: block.version }));
                setEditingBlockId(block.id); // Track which block is being edited
                setMessage(`Loaded block #${index + 1} (${block.versionCode}) into editor for editing.`);
              }}
              onRemoveBlock={handleRemoveBlockInstance}
            />
          </section>

          {/* Right Column: Preview Target Header & Live Preview Pane */}
          <TutorialPreviewPane
            subtopicName={selectedSubtopic?.name ?? ''}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            documentBlocks={documentBlocks}
            activeBlockType={form.blockType}
            activeBlockVersion={selectedVersion.code}
            activeBlockPreview={activeBlockPreview}
            brandId={form.brandId}
          />
        </div>
      </div>
    </main>
  );
}
