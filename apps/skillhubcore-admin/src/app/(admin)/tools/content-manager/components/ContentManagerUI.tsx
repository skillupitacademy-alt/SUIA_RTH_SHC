'use client';

import React, { useEffect } from 'react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { useContentManager } from './useContentManager';
import { SubtopicForm } from './SubtopicForm';
import { ContentProgress } from './ContentProgress';
import { SectionManager } from './SectionManager';
import { ComponentPreview } from './ComponentPreview';

export function ContentManagerUI() {
  const brand = useBrand();
  
  const {
    isRightSidebarOpen,
    setIsRightSidebarOpen,
    setRightSidebarContent,
    setRightSidebarWidth,
    subtopicInfo,
    setSubtopicInfo,
    isSubtopicCreated,
    selectedSection,
    setSelectedSection,
    selectedSubsection,
    setSelectedSubsection,
    isFetchingSubsection,
    jsonInput,
    setJsonInput,
    sectionStatus,
    message,
    messageType,
    assetFieldPath,
    setAssetFieldPath,
    assetName,
    setAssetName,
    assetAlt,
    setAssetAlt,
    assetCaption,
    setAssetCaption,
    assetWidth,
    setAssetWidth,
    assetHeight,
    setAssetHeight,
    svgMarkup,
    setSvgMarkup,
    svgFile,
    setSvgFile,
    processedAsset,
    isProcessingAsset,
    previewData,
    activeSpecs,
    createSubtopic,
    loadSubtopic,
    fetchSubsection,
    validateJSON,
    processSvgAsset,
    injectAssetIntoJson,
    addSection,
    getPageUrl,
    openPreview,
    handlePreview
  } = useContentManager();

  // Sync preview content dynamically when data or sections change
  useEffect(() => {
    if (isRightSidebarOpen && previewData) {
      setRightSidebarContent(
        <div className="flex flex-col h-full bg-slate-50">
          <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <h3 className="text-lg font-bold text-slate-800 font-outfit">Live Component Preview</h3>
            </div>
            <button
              onClick={() => {
                setIsRightSidebarOpen(false);
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
            >
              Close Preview
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-4xl mx-auto">
              <ComponentPreview section={selectedSection} subsection={selectedSubsection} data={previewData} />
            </div>
          </div>
        </div>
      );
    }
  }, [previewData, selectedSection, selectedSubsection, isRightSidebarOpen, setRightSidebarContent, setIsRightSidebarOpen]);

  // Clean up global sidebar when this view unmounts
  useEffect(() => {
    return () => {
      setRightSidebarContent(null);
      setRightSidebarWidth('360px');
      setIsRightSidebarOpen(false);
    };
  }, [setRightSidebarContent, setRightSidebarWidth, setIsRightSidebarOpen]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="p-8 text-center" style={{ backgroundColor: brand.primaryColor }}>
          <h1 className="mb-3 text-4xl font-bold text-white font-outfit">Content Manager</h1>
          <p className="text-lg font-semibold text-white">Add AI-generated tutorial content one section at a time</p>
        </div>
      </header>

      {message ? (
        <div
          className={`mb-6 rounded-lg p-4 ${messageType === 'success'
              ? 'border-l-4 border-green-500 bg-green-50 text-green-800'
              : messageType === 'error'
                ? 'border-l-4 border-red-500 bg-red-50 text-red-800'
                : 'border-l-4 border-blue-500 bg-blue-50 text-blue-800'
            }`}
        >
          <p className="font-medium">{message}</p>
        </div>
      ) : null}

      {!isSubtopicCreated ? (
        <SubtopicForm
          subtopicInfo={subtopicInfo}
          setSubtopicInfo={setSubtopicInfo}
          isFetchingSubsection={isFetchingSubsection}
          createSubtopic={createSubtopic}
          loadSubtopic={loadSubtopic}
        />
      ) : (
        <div className="space-y-8 max-w-5xl mx-auto">
          <ContentProgress
            sectionStatus={sectionStatus}
            getPageUrl={getPageUrl}
          />

          <SectionManager
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            selectedSubsection={selectedSubsection}
            setSelectedSubsection={setSelectedSubsection}
            jsonInput={jsonInput}
            setJsonInput={setJsonInput}
            isFetchingSubsection={isFetchingSubsection}
            fetchSubsection={fetchSubsection}
            activeSpecs={activeSpecs}
            assetFieldPath={assetFieldPath}
            setAssetFieldPath={setAssetFieldPath}
            assetName={assetName}
            setAssetName={setAssetName}
            assetAlt={assetAlt}
            setAssetAlt={setAssetAlt}
            assetCaption={assetCaption}
            setAssetCaption={setAssetCaption}
            assetWidth={assetWidth}
            setAssetWidth={setAssetWidth}
            assetHeight={assetHeight}
            setAssetHeight={setAssetHeight}
            svgMarkup={svgMarkup}
            setSvgMarkup={setSvgMarkup}
            svgFile={svgFile}
            setSvgFile={setSvgFile}
            processedAsset={processedAsset}
            isProcessingAsset={isProcessingAsset}
            processSvgAsset={processSvgAsset}
            injectAssetIntoJson={injectAssetIntoJson}
            handlePreview={handlePreview}
            validateJSON={validateJSON}
            addSection={addSection}
            openPreview={openPreview}
          />
        </div>
      )}
    </div>
  );
}
