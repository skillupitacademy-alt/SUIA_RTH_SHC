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
import { TutorialBlockSelector } from './TutorialBlockSelector';
import { TutorialDocumentBlocksList } from './TutorialDocumentBlocksList';
import { TutorialPreviewPane } from './TutorialPreviewPane';
import { TutorialEditorPanel } from './TutorialEditorPanel';
import { AiInstructionContainer } from './AiInstructionContainer';
import { getBlockTypes, getBlockType, getDefaultPayload } from '../registry';

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
  blockType: 'definition',
  versionId: 'v1',
};

export function TutorialPageContentBuilderClient() {
  const [hierarchy, setHierarchy] = useState<HierarchyState>(initialHierarchy);
  const [form, setForm] = useState<FormState>(initialForm);
  const [sourceFormat, setSourceFormat] = useState<SourceFormat>('json');
  const [sourceContent, setSourceContent] = useState(JSON.stringify(getDefaultPayload('definition'), null, 2));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy preview state, type refinement tracked in backlog
  const [activeBlockPreview, setActiveBlockPreview] = useState<any>(getDefaultPayload('definition'));
  const [previewMode, setPreviewMode] = useState<'document' | 'active-block'>('document');
  const [message, setMessage] = useState('');
  const [memoryModelWarning, setMemoryModelWarning] = useState(''); // UI warning for memoryModel loss
  const [isSaving, setIsSaving] = useState(false);

  // Document block instances collection (starts empty, hydrated on subtopic selection)
  const [documentBlocks, setDocumentBlocks] = useState<BlockInstance[]>([]);
  
  // Hydration state
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [loadedSectionId, setLoadedSectionId] = useState<string | null>(null);
  
  // Track unsaved local changes to prevent async hydration from overwriting user edits
  // This protects against race conditions where user adds/removes blocks while fetch is pending
  const hasUnsavedLocalChangesRef = useRef(false);
  
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
    setActiveBlockPreview(example);
    setMemoryModelWarning(''); // Clear warning when block type changes
  }, [form.blockType, form.versionId]);

  // Hydrate existing tutorial when subtopic selection changes
  useEffect(() => {
    if (!form.subtopicId) {
      setDocumentBlocks([]);
      setLoadedSectionId(null);
      setIsLoadingDocument(false);
      hasUnsavedLocalChangesRef.current = false; // Clear dirty flag on reset
      return;
    }

    const controller = new AbortController();

    void loadExistingTutorial(form.subtopicId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [form.subtopicId]);

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
      if (key === 'domainId') {
        next.subjectId = '';
        next.topicId = '';
        next.subtopicId = '';
      }
      if (key === 'subjectId') {
        next.topicId = '';
        next.subtopicId = '';
      }
      if (key === 'topicId') {
        next.subtopicId = '';
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
      
      // Handle Code C1 conversion and warning
      if (form.blockType === 'code' && selectedVersion.code === 'C1') {
        const result = toCanonicalCodeC1(parsed);
        setActiveBlockPreview(result.content); // Store canonical content
        setMemoryModelWarning(result.memoryModelWarning || ''); // Update warning from event handler
      } else {
        setActiveBlockPreview(parsed);
        setMemoryModelWarning(''); // Clear warning for non-C1 blocks
      }
      
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
    setActiveBlockPreview(example);
    setMemoryModelWarning('');
    setMessage('Ready to create a new block.');
  }

  /**
   * Load existing tutorial from tutorial_sections for selected subtopic
   * Hydrates documentBlocks[] with existing content.blocks[]
   * 
   * @param subtopicId - The subtopic ID to load tutorial for
   * @param signal - Optional AbortSignal for request cancellation
   */
  async function loadExistingTutorial(subtopicId: string, signal?: AbortSignal) {
    if (!subtopicId) {
      setDocumentBlocks([]);
      setLoadedSectionId(null);
      return;
    }

    setIsLoadingDocument(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/tutorial-composer/sections?subtopicId=${encodeURIComponent(
          subtopicId
        )}&brandId=${SHARED_BRAND_ID}&limit=1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load existing tutorial');
      }

      const result = await response.json();
      const section = result.data?.[0];

      if (!section) {
        setDocumentBlocks([]);
        setLoadedSectionId(null);
        setMessage('No existing tutorial found. Ready to create a new document.');
        return;
      }

      const document = section.content as TutorialDocument | undefined;

      if (!document || !Array.isArray(document.blocks)) {
        setDocumentBlocks([]);
        setLoadedSectionId(section.id);
        setMessage(
          'Existing tutorial has no valid document blocks. Ready for editing.'
        );
        return;
      }

      const instances = tutorialBlocksToInstances(document.blocks);

      // RACE PROTECTION: Do not overwrite user's unsaved local changes
      // If user added/removed blocks while this fetch was pending, preserve their work
      if (hasUnsavedLocalChangesRef.current) {
        setMessage(
          `Cannot load: You have unsaved local changes. Save or discard changes first. (Server has ${instances.length} blocks)`
        );
        setIsLoadingDocument(false);
        return;
      }

      setDocumentBlocks(instances);
      
      setLoadedSectionId(section.id);
      hasUnsavedLocalChangesRef.current = false; // Fresh from server = clean state

      setMessage(
        `Loaded existing tutorial with ${instances.length} block ${
          instances.length === 1 ? 'instance' : 'instances'
        }.`
      );
    } catch (error) {
      // Ignore aborted requests (user changed subtopic selection)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setDocumentBlocks([]);
      setLoadedSectionId(null);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load existing tutorial.'
      );
    } finally {
      // Only update loading state if request wasn't aborted
      if (!signal?.aborted) {
        setIsLoadingDocument(false);
      }
    }
  }

  async function save(status: 'draft' | 'published') {
    setIsSaving(true);
    setMessage('');
    
    try {
      if (!form.subtopicId) {
        throw new Error('Subtopic is required');
      }

      if (isLoadingDocument) {
        throw new Error(
          'Tutorial is still loading. Please wait before saving.'
        );
      }

      // Step 1: Map documentBlocks[] → TutorialDocument.blocks[] using type-safe conversion
      const tutorialBlocks: TutorialBlock[] = documentBlocks.map(toTutorialBlock);

      // Step 2: Create TutorialDocument
      const tutorialDocument: TutorialDocument = {
        schemaVersion: 1,
        blocks: tutorialBlocks,
      };

      // Step 3: Check if tutorial exists for this subtopicId + brandId
      const existenceCheckUrl = `/api/tutorial-composer/sections?subtopicId=${form.subtopicId}&brandId=${SHARED_BRAND_ID}&limit=1`;

      const queryResponse = await fetch(existenceCheckUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!queryResponse.ok) {
        throw new Error('Failed to check existing tutorial');
      }

      const queryResult = await queryResponse.json();
      const existingTutorial = queryResult.data?.[0];

      // Step 3b: Race condition protection - verify we're editing the same section we loaded
      if (
        existingTutorial &&
        loadedSectionId &&
        existingTutorial.id !== loadedSectionId
      ) {
        throw new Error(
          'The selected tutorial changed while editing. Reload the document before saving.'
        );
      }

      let response;
      let requestPayload;

      if (existingTutorial) {
        // Step 4a: UPDATE existing tutorial
        const patchUrl = `/api/tutorial-composer/sections/${existingTutorial.id}`;
        requestPayload = {
          content: tutorialDocument,
        };

        response = await fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
      } else {
        // Step 4b: CREATE new tutorial
        requestPayload = {
          subtopicId: form.subtopicId,
          brandId: SHARED_BRAND_ID,
          content: tutorialDocument,
          orderIndex: 0,
        };

        response = await fetch('/api/tutorial-composer/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error?.message || result.error || 'Save failed';
        throw new Error(errorMsg);
      }

      // Step 5: Publish if status is 'published'
      if (status === 'published' && result.data?.id) {
        const publishUrl = `/api/tutorial-composer/sections/${result.data.id}/publish`;
        
        const publishResponse = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!publishResponse.ok) {
          const publishError = await publishResponse.json();
          throw new Error(publishError.error?.message || 'Publish failed');
        }

        // Generate public URL from hierarchy slugs
        const domain = hierarchy.domains.find((d) => d.id === form.domainId);
        const subject = subjects.find((s) => s.id === form.subjectId);
        const topic = topics.find((t) => t.id === form.topicId);
        const subtopic = subtopics.find((st) => st.id === form.subtopicId);
        
        if (domain && subject && topic && subtopic) {
          const publicUrl = `https://user.skillupitacademy.com/tutorial-v2/${domain.slug}/${subject.slug}/${topic.slug}/${subtopic.slug}`;
          setMessage(`Tutorial ${existingTutorial ? 'updated' : 'created'} and published successfully!\n\nPublic URL: ${publicUrl}`);
        } else {
          setMessage(`Tutorial ${existingTutorial ? 'updated' : 'created'} and published successfully!`);
        }
      } else {
        setMessage(`Tutorial ${existingTutorial ? 'updated' : 'created'} successfully as ${status}!`);
      }
      
      // Clear dirty flag after successful save
      hasUnsavedLocalChangesRef.current = false;
      
      // Update loadedSectionId if we just created a new section
      if (!existingTutorial && result.data?.id) {
        setLoadedSectionId(result.data.id);
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
                setActiveBlockPreview(block.payload);
                setForm((prev) => ({ ...prev, blockType: block.type, versionId: block.version }));
                setMemoryModelWarning(''); // Clear warning when loading existing block
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
