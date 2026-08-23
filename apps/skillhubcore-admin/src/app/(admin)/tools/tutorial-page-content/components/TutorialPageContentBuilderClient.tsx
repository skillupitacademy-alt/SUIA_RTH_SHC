'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  FileCode,
  ListOrdered,
} from 'lucide-react';

import { TutorialBlockRenderer } from '@quiz/ui';
import { TutorialSummaryContent } from '@/share-branding/LearningExperience/components/TutorialSummaryContent';
import type {
  BrandTutorialTheme,
  TutorialCodePayload,
  TutorialDefinitionPayload,
  TutorialPageContentType,
  TutorialSidebarBrandId,
  TutorialSummaryPayload,
  TutorialDocument,
  TutorialBlock,
  DefinitionD1AuthorContent,
  CodeC1AuthorContent,
} from '@quiz/types';
import { CodeC1AuthorContentSchema } from '@quiz/types';

const SHARED_BRAND_ID: TutorialSidebarBrandId = 'shared';

import {
  toCanonicalCodeC1,
  type CanonicalCodeC1Result,
} from '../blocks/code/C1/codeC1.converter';
import {
  toTutorialBlock,
  tutorialBlocksToInstances,
  extractBlockTitle,
  type BlockInstance,
} from '../document/documentTransformation';
import { parseSource, type SourceFormat } from '../document/sourceParser';
import {
  getBlockTypes,
  getBlockType,
  getDefaultPayload,
  type BlockRegistryEntry,
  type BlockVersionRegistryEntry,
} from '../registry';
import { getDefinitionD1Prompt } from '../blocks/definition/D1/definitionD1.prompt';
import { getCodeC1Prompt } from '../blocks/code/C1/codeC1.prompt';
import { getSummaryS1Prompt } from '../blocks/summary/S1/summaryS1.prompt';

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

function themeForBrand(brandId: TutorialSidebarBrandId): BrandTutorialTheme {
  if (brandId === 'skillup' || brandId === 'shared') {
    return {
      primary: '#f54a8d',
      primaryDark: '#d63d7a',
      secondary: '#0B1B3D',
      activeBackground: '#fff0f6',
      completed: '#08a64a',
    };
  }

  return {
    primary: '#d03f00',
    primaryDark: '#b63600',
    secondary: '#124fd6',
    activeBackground: '#eef3fa',
    completed: '#08a64a',
  };
}

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
  }, [form.blockType]);

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
   * Append new block instance to TutorialDocument
   */
  function handleAddBlockInstance() {
    try {
      const parsed = parseSource(sourceFormat, sourceContent, form.blockType) as 
        TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload;
      
      // Canonicalize C1 blocks immediately upon Add
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
      
      // Generate a valid UUID for the block ID (required by API validation)
      const uniqueId = crypto.randomUUID();
      const title = extractBlockTitle(payload, form.blockType);

      const newInstance: BlockInstance = {
        id: uniqueId,
        type: form.blockType,
        version: form.versionId,
        versionCode: selectedVersion.code,
        title,
        payload,
        payloadFormat,
        sourceFormat,
        sourceContent, // Preserve original author input
      };

      hasUnsavedLocalChangesRef.current = true;
      setDocumentBlocks((prev) => [...prev, newInstance]);
      setPreviewMode('document');
      setMessage(`Appended new block instance: ${selectedVersion.code} (${title})`);
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
    setMessage('Block instance removed from document.');
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e11d48]">Tutorial Page Builder</p>
              <h1 className="text-xl font-extrabold text-[#071f63] font-outfit">Create & Append Block Instances</h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isLoadingDocument ? (
                <span className="font-mono text-amber-600">
                  Loading document…
                </span>
              ) : (
                <span className="font-mono text-slate-600">
                  Document blocks: <strong>{documentBlocks.length}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Horizontal Hierarchy & Content Selector Toolbar */}
          <div className="flex flex-wrap items-end gap-3">
            {/* 1. Domain */}
            <div className="flex-1 min-w-[170px]">
              <label htmlFor="select-domain" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Domain
              </label>
              <select
                id="select-domain"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                value={form.domainId}
                onChange={(event) => updateForm('domainId', event.target.value)}
              >
                <option value="">Select Domain</option>
                {hierarchy.domains.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Subject */}
            <div className="flex-1 min-w-[170px]">
              <label htmlFor="select-subject" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Subject
              </label>
              <select
                id="select-subject"
                disabled={!form.domainId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={form.subjectId}
                onChange={(event) => updateForm('subjectId', event.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Topic */}
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="select-topic" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Topic
              </label>
              <select
                id="select-topic"
                disabled={!form.subjectId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={form.topicId}
                onChange={(event) => updateForm('topicId', event.target.value)}
              >
                <option value="">Select Topic</option>
                {topics.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Subtopic */}
            <div className="flex-1 min-w-[170px]">
              <label htmlFor="select-subtopic" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Subtopic
              </label>
              <select
                id="select-subtopic"
                disabled={!form.topicId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={form.subtopicId}
                onChange={(event) => updateForm('subtopicId', event.target.value)}
              >
                <option value="">Select Subtopic</option>
                {subtopics.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* 5. Block Type (Independent Dropdown) */}
            <div className="w-[140px] min-w-[130px]">
              <label htmlFor="select-block" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Block Type
              </label>
              <select
                id="select-block"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                value={form.blockType}
                onChange={(event) => updateForm('blockType', event.target.value as TutorialPageContentType)}
              >
                {getBlockTypes().map((block) => (
                  <option key={block.id} value={block.id}>{block.label}</option>
                ))}
              </select>
            </div>

            {/* 6. Version (Dependent on Block Type) */}
            <div className="w-[180px] min-w-[150px]">
              <label htmlFor="select-version" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Version Code
              </label>
              <select
                id="select-version"
                disabled={availableVersions.length === 0}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={form.versionId}
                onChange={(event) => updateForm('versionId', event.target.value)}
              >
                {availableVersions.map((version) => (
                  <option key={version.id} value={version.id}>{version.label}</option>
                ))}
              </select>
            </div>

            {/* 7. Format */}
            <div className="w-[110px] min-w-[100px]">
              <label htmlFor="select-format" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Format
              </label>
              <select
                id="select-format"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                value={sourceFormat}
                onChange={(event) => setSourceFormat(event.target.value as SourceFormat)}
              >
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
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
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
              <div className="flex items-center justify-between pb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <span className="flex items-center gap-1.5">
                  <FileCode size={14} className="text-pink-600" />
                  <span>Block Content Editor</span>
                  <span className="text-[10px] text-slate-400 font-mono">({selectedVersion.code})</span>
                </span>
                <span className="text-[10px] text-pink-600 font-mono font-semibold">Pure Block Schema</span>
              </div>
              <textarea
                className="h-[400px] w-full rounded-xl border border-slate-800 bg-[#071024] p-4 font-mono text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y"
                value={sourceContent}
                onChange={(event) => {
                  setSourceContent(event.target.value);
                  setMemoryModelWarning(''); // Clear warning when user edits
                }}
                placeholder="Paste or edit JSON content here..."
                aria-label="JSON Content Editor"
              />

              {/* Main Action Buttons */}
              <div className="mt-4 space-y-2.5">
                {/* Primary Add Block Action */}
                <button
                  type="button"
                  onClick={handleAddBlockInstance}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  <Plus size={16} />
                  <span>+ Add {selectedVersion.code} Block Instance to Document</span>
                </button>

                {/* Secondary Actions Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                    onClick={handlePreviewCurrent}
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview Block
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || isLoadingDocument || !form.subtopicId}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => save('draft')}
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || isLoadingDocument || !form.subtopicId}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#e11d48] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#be123c] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => save('published')}
                  >
                    <Send className="h-3.5 w-3.5" /> Publish
                  </button>
                </div>
              </div>

              {message && (
                <div className="mt-3 rounded-lg bg-pink-50/70 border border-pink-100 p-3 text-xs font-semibold text-[#071f63] flex items-center gap-2">
                  <Sparkles size={14} className="text-pink-600 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {memoryModelWarning && (
                <div className="mt-3 rounded-lg bg-orange-50/70 border border-orange-200 p-3 text-xs font-semibold text-orange-900 flex items-start gap-2">
                  <span className="text-orange-600 shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <div className="font-bold mb-1">Memory Model Data Will Be Lost</div>
                    <div className="font-normal text-orange-800">{memoryModelWarning}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Blocks List (Ordered Block Instances in TutorialDocument) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ListOrdered size={16} className="text-[#e11d48]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-outfit">
                    Tutorial Document Blocks
                  </h3>
                </div>
                <span className="rounded-full bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[10px] font-bold text-pink-700 font-mono">
                  {documentBlocks.length} {documentBlocks.length === 1 ? 'instance' : 'instances'}
                </span>
              </div>

              <div className="mt-3.5 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {documentBlocks.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 font-medium">
                    No blocks added yet. Click &ldquo;+ Add Block Instance&rdquo; above to append blocks.
                  </p>
                ) : (
                  documentBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-pink-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-mono font-bold text-slate-600 shrink-0">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {block.title}
                            </span>
                            <span className="rounded bg-pink-50 border border-pink-200 px-1.5 py-0.2 text-[9px] font-bold text-pink-700 font-mono shrink-0">
                              {block.versionCode}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            ID: {block.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSourceContent(block.sourceContent);
                            setActiveBlockPreview(block.payload);
                            setForm((prev) => ({ ...prev, blockType: block.type, versionId: block.version }));
                            setMemoryModelWarning(''); // Clear warning when loading existing block
                            setMessage(`Loaded block #${index + 1} (${block.versionCode}) into editor.`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Load into editor"
                        >
                          <FileCode size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockInstance(block.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove block instance"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Right Column: Preview Target Header & Live Preview Pane */}
          <section className="space-y-4 min-w-0">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 text-sm font-bold text-[#071f63] shadow-xl border-t border-white/60 -translate-y-1 flex flex-wrap items-center justify-between gap-2">
              <span className="truncate">Preview Target: {selectedSubtopic?.name ?? 'Select a subtopic'}</span>
              
              {/* Preview Mode Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewMode('document')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === 'document'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Full Document ({documentBlocks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('active-block')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === 'active-block'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Active Block ({selectedVersion.code})
                </button>
              </div>
            </div>

            {/* Live Rendered Content Container (Preserving original component themes) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl min-h-[600px] overflow-y-auto space-y-8">
              {previewMode === 'active-block' ? (
                <div>
                  <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Active Editor Preview</span>
                    <span>{selectedVersion.code} Block</span>
                  </div>
                  {form.blockType === 'definition' && (
                    <TutorialBlockRenderer
                      block={{
                        id: 'preview',
                        type: 'definition',
                        version: selectedVersion.code, // Use selected version without cast
                        content: activeBlockPreview as DefinitionD1AuthorContent,
                      } as TutorialBlock}
                      theme={themeForBrand(form.brandId)}
                      depth={0}
                    />
                  )}
                  {form.blockType === 'code' && (
                    <TutorialBlockRenderer
                      block={{
                        id: 'preview',
                        type: 'code',
                        version: selectedVersion.code,
                        content: toCanonicalCodeC1(activeBlockPreview).content, // Use .content (pure)
                      } as TutorialBlock}
                      theme={themeForBrand(form.brandId)}
                      depth={0}
                    />
                  )}
                  {form.blockType === 'summary' && <TutorialSummaryContent payload={activeBlockPreview as TutorialSummaryPayload} theme={themeForBrand(form.brandId)} />}
                </div>
              ) : (
                documentBlocks.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    No blocks in document yet. Add blocks from the left authoring panel to preview the full document.
                  </div>
                ) : (
                  <>
                    {documentBlocks.map((instance, idx) => (
                      <div
                        key={instance.id}
                        className="relative"
                        data-tutorial-block-id={instance.id}
                      >
                        {idx > 0 && <div className="my-8 border-t border-dashed border-slate-200" />}
                        
                        {instance.type === 'definition' && (
                          <div data-tutorial-block-type="definition">
                            <TutorialBlockRenderer
                              block={{
                                id: instance.id,
                                type: 'definition',
                                version: instance.versionCode, // Use actual version without cast
                                content: instance.payload as DefinitionD1AuthorContent,
                              } as TutorialBlock}
                              theme={themeForBrand(form.brandId)}
                              depth={0}
                            />
                          </div>
                        )}
                        
                        {instance.type === 'code' && (
                          <div data-tutorial-block-type="code">
                            <TutorialBlockRenderer
                              block={{
                                id: instance.id,
                                type: 'code',
                                version: instance.versionCode,
                                content: toCanonicalCodeC1(instance.payload).content, // Use .content (pure)
                              } as TutorialBlock}
                              theme={themeForBrand(form.brandId)}
                              depth={0}
                            />
                          </div>
                        )}
                        
                        {instance.type === 'summary' && (
                          <div data-tutorial-block-type="summary">
                            <TutorialSummaryContent payload={instance.payload as TutorialSummaryPayload} theme={themeForBrand(form.brandId)} />
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

interface AiInstructionContainerProps {
  domainName: string;
  subjectName: string;
  topicName: string;
  subtopicName: string;
  blockName: string;
  versionName: string;
  blockType: TutorialPageContentType;
  versionId: string;
}

function AiInstructionContainer({
  domainName,
  subjectName,
  topicName,
  subtopicName,
  blockName,
  versionName,
  blockType,
  versionId,
}: AiInstructionContainerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const promptText = useMemo(() => {
    const context = {
      domainName,
      subjectName,
      topicName,
      subtopicName,
      blockName,
      versionName,
      versionId,
    };

    if (blockType === 'definition') {
      return getDefinitionD1Prompt(context);
    }
    
    if (blockType === 'code') {
      return getCodeC1Prompt(context);
    }
    
    if (blockType === 'summary') {
      return getSummaryS1Prompt(context);
    }

    // Fallback (should not happen with current registry)
    return `You are generating educational content for a tutorial platform.

# TARGET HIERARCHY
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}
- Block: ${blockName}
- Version: ${versionName}

# OUTPUT REQUIREMENTS
Generate valid, production-ready ${blockType} (${versionId.toUpperCase()}) content conforming strictly to the official platform schema without system metadata or styling fields.`;
  }, [domainName, subjectName, topicName, subtopicName, blockName, versionName, blockType, versionId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 transition-all shadow-md">
      {/* Container Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              AI Generation Instructions
            </h3>
            <span className="text-[11px] font-semibold text-indigo-600">
              {blockName} ({versionName}) Contract Guidance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md bg-white border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 active:scale-95 transition-all"
            title="Copy prompt for AI"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-1 text-indigo-700 hover:bg-indigo-100 transition-colors"
            aria-label={isOpen ? 'Collapse instructions' : 'Expand instructions'}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Dynamic Hierarchy Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-700">
        <span className="rounded bg-white border border-indigo-100 px-2 py-0.5 font-bold text-indigo-900">
          {domainName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-white border border-indigo-100 px-2 py-0.5 font-bold text-indigo-900">
          {subjectName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-white border border-indigo-100 px-2 py-0.5 font-bold text-indigo-900">
          {topicName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-indigo-600 text-white px-2 py-0.5 font-bold">
          {subtopicName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-white border border-indigo-200 px-2 py-0.5 font-bold text-indigo-700">
          {blockName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-indigo-100 text-indigo-800 px-2 py-0.5 font-bold">
          {versionName}
        </span>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-3.5 space-y-2.5 border-t border-indigo-100 pt-3 text-xs text-slate-700">
          <div className="rounded-lg bg-white/80 border border-indigo-100 p-3">
            <h4 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" />
              {blockName} {versionName} Visual & Content Rules
            </h4>
            {blockType === 'definition' ? (
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <li><strong>2 to 4 cards:</strong> Generate 2–4 genuinely distinct properties.</li>
                <li><strong>Short titles:</strong> Keep titles to 2–6 words (e.g., &ldquo;Named Reference&rdquo;, &ldquo;Mutable&rdquo;).</li>
                <li><strong>Focused descriptions:</strong> 1–3 clear sentences explaining that single property.</li>
                <li><strong>Responsive presentation:</strong> UI automatically handles 1 col (mobile), 2 col (tablet), 3–4 col (desktop). <em>Do NOT add UI layout metadata to the JSON.</em></li>
                <li><strong>Strict JSON only:</strong> Return pure JSON matching the D1 schema with no markdown code blocks or system metadata.</li>
              </ul>
            ) : (
              <p className="text-[11px] text-slate-600">
                Generate production-ready content matching the canonical {blockName} ({versionName}) schema with pure educational data and no system metadata.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
