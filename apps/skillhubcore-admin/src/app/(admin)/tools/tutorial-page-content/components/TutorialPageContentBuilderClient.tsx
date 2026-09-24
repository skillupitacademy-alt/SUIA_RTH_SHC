'use client';

import { useEffect, useState } from 'react';
import { TutorialComposerHeader } from './TutorialComposerHeader';
import { TutorialHierarchySelector } from './TutorialHierarchySelector';
import { TutorialNavigationNodeSelector } from './TutorialNavigationNodeSelector'; // Phase 1
import { TutorialBlockSelector } from './TutorialBlockSelector';
import { TutorialDocumentBlocksList } from './TutorialDocumentBlocksList';
import { TutorialPreviewPane } from './TutorialPreviewPane';
import { TutorialEditorPanel } from './TutorialEditorPanel';
import { AiInstructionContainer } from './AiInstructionContainer';
import { getDefaultPayload, getBlockTypes } from '../registry';
import { useTutorialNavigationNodes } from '../hooks/useTutorialNavigationNodes'; // Phase 1
import { useTutorialHydration } from '../hooks/useTutorialHydration'; // Phase 1
import { useTutorialComposerForm } from '../hooks/useTutorialComposerForm'; // Phase 2B.15 Step 2
import { useTutorialSave } from '../hooks/useTutorialSave'; // Phase 2B.15 Step 3
import { useTutorialBlockEditor } from '../hooks/useTutorialBlockEditor'; // Phase 2B.15 Step 4

export function TutorialPageContentBuilderClient() {
  // Phase 2B.15 Step 2: Hierarchy/form state managed by hook
  const {
    hierarchy,
    form,
    setForm,
    updateForm,
    subjects,
    topics,
    subtopics,
    selectedSubtopic,
    domainName,
    subjectName,
    topicName,
    subtopicName,
    currentBlockConfig,
    availableVersions,
    selectedVersion,
  } = useTutorialComposerForm({
    onError: (message) => setMessage(message),
  });
  
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
  
  const [previewMode, setPreviewMode] = useState<'document' | 'active-block'>('document');

  // Phase 2B.15 Step 3: Save/publish hook
  const { isSaving, save } = useTutorialSave({
    subtopicId: form.subtopicId,
    navigationNodeId: form.navigationNodeId,
    brandId: form.brandId,
    documentBlocks,
    loadedSectionId,
    isLoadingDocument,
    hasUnsavedLocalChangesRef,
    setLoadedSectionId,
    setMessage,
  });

  // Phase 2B.15 Step 4: Block editor hook
  const {
    sourceFormat,
    sourceContent,
    activeBlockPreview,
    memoryModelWarning,
    editingBlockId,
    setSourceFormat,
    handlePreviewCurrent,
    handleAddBlockInstance,
    handleRemoveBlockInstance,
    handleLoadBlock,
    handleStartNewBlock,
    handleContentChange,
    updatePreviewFromPayload,
  } = useTutorialBlockEditor(
    {
      documentBlocks,
      setDocumentBlocks,
      hasUnsavedLocalChangesRef,
      setMessage,
    },
    {
      blockType: form.blockType,
      versionId: form.versionId,
      versionCode: selectedVersion.code,
      versionLabel: selectedVersion.label,
    }
  );

  useEffect(() => {
    const example = getDefaultPayload(form.blockType, form.versionId);
    updatePreviewFromPayload(example);
  }, [form.blockType, form.versionId, updatePreviewFromPayload]);

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
  }, [form.subtopicId, form.navigationNodeId, loadExistingTutorial, invalidateHydration, hasUnsavedLocalChangesRef]);

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
              navigationNodeName={navigationNodes.find(n => n.id === form.navigationNodeId)?.name ?? ''}
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
              onContentChange={handleContentChange}
              onAddBlock={handleAddBlockInstance}
              onStartNewBlock={() => handleStartNewBlock(getDefaultPayload(form.blockType, form.versionId))}
              onPreviewBlock={handlePreviewCurrent}
              onSaveDraft={() => save('draft', {
                domains: hierarchy.domains,
                subjects,
                topics,
                subtopics,
                navigationNodes,
                domainId: form.domainId,
                subjectId: form.subjectId,
                topicId: form.topicId,
                subtopicId: form.subtopicId,
                navigationNodeId: form.navigationNodeId,
              })}
              onPublish={() => save('published', {
                domains: hierarchy.domains,
                subjects,
                topics,
                subtopics,
                navigationNodes,
                domainId: form.domainId,
                subjectId: form.subjectId,
                topicId: form.topicId,
                subtopicId: form.subtopicId,
                navigationNodeId: form.navigationNodeId,
              })}
              message={message}
              memoryModelWarning={memoryModelWarning}
              isSaving={isSaving}
              isLoadingDocument={isLoadingDocument}
              canSave={Boolean(form.subtopicId)}
            />

            {/* Document Blocks List (Ordered Block Instances in TutorialDocument) */}
            <TutorialDocumentBlocksList
              documentBlocks={documentBlocks}
              onLoadBlock={(block, index) => handleLoadBlock(block, index, (updates) => setForm((prev) => ({ ...prev, ...updates })))}
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
