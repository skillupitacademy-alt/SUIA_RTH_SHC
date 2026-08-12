/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect } from 'react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { useContentManager } from './useContentManager';
import { SubtopicForm } from './SubtopicForm';
import { ContentProgress } from './ContentProgress';
import { SectionManager } from './SectionManager';
import { ComponentPreview } from './ComponentPreview';
import { ErrorBoundary } from './ErrorBoundary';

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
    previewApproved,
    requirePreviewApproval,
    previewTarget,
    setPreviewTarget,
    pipelinePayload,
    getPipelineEducationLabel,
    getPipelineUiuxLabel,
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
    handlePreview,
    approvePreview
  } = useContentManager();

  const activeRendererContract =
    pipelinePayload?.rendererMapping || pipelinePayload?.uiuxComponent || pipelinePayload?.educationalComponent;

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
          <div className="flex-1 overflow-y-auto bg-white py-12 relative">
            <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8">
              <ErrorBoundary
                fallback={(error, errorInfo) => (
                  <div className="p-8 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
                    <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Component Preview Render Error
                    </h3>
                    
                    <div className="mb-6 bg-white p-4 rounded-xl border border-red-100">
                      <p className="text-red-800 font-semibold mb-2">Error Details:</p>
                      <pre className="p-3 bg-red-50 rounded-lg text-sm font-mono text-red-900 overflow-auto border border-red-100">
                        {error.message}
                      </pre>
                    </div>

                    <div className="mb-6 p-5 bg-orange-50 border border-orange-200 rounded-xl">
                      <p className="text-orange-800 font-bold mb-2 flex items-center gap-2">
                        💡 Root Cause Analysis
                      </p>
                      <div className="text-sm text-orange-900 space-y-2">
                        {error.message.includes('map') || error.message.includes('Cannot read properties of undefined') ? (
                          <>
                            <p><strong>Missing Required Array/Object:</strong> The component is trying to access data that doesn&apos;t exist in your JSON.</p>
                            <ul className="list-disc pl-5 mt-2">
                              <li>Did you paste JSON for a specific component (like <code>definition_block</code>) but leave the dropdown on <strong>&quot;Full Section&quot;</strong>?</li>
                              <li>Does your JSON include all required arrays (like <code>quickSummary</code>, <code>faqItems</code>, etc.)?</li>
                            </ul>
                          </>
                        ) : (
                          <p>The JSON payload you provided does not match the expected structure for the selected component. Verify you selected the correct subsection in the dropdown.</p>
                        )}
                      </div>
                    </div>

                    {errorInfo && errorInfo.componentStack && (
                      <div className="mt-4">
                        <p className="text-red-800 font-semibold mb-2 text-sm">Component Stack Trace (Where it crashed):</p>
                        <pre className="p-4 bg-slate-900 rounded-lg text-xs font-mono text-emerald-400 overflow-auto max-h-60 shadow-inner leading-relaxed">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              >
                <ComponentPreview
                  section={selectedSection}
                  subsection={selectedSubsection}
                  data={previewData}
                  rendererContract={activeRendererContract}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      );
    }
  }, [previewData, selectedSection, selectedSubsection, pipelinePayload, isRightSidebarOpen, setRightSidebarContent, setIsRightSidebarOpen]);

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

      {pipelinePayload ? (
        <div className="mx-auto mb-6 max-w-5xl rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-5 shadow-sm">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-800">Global Architecture Context Loaded</p>
          <div className="grid gap-3 text-sm text-emerald-950 md:grid-cols-2">
            <p><strong>Section:</strong> {pipelinePayload.adminSectionId || pipelinePayload.section} {pipelinePayload.subsection ? `.${pipelinePayload.subsection}` : ''}</p>
            <p><strong>Preview target:</strong> {pipelinePayload.previewTarget || previewTarget}</p>
            <p><strong>Educational component:</strong> {getPipelineEducationLabel()}</p>
            <p><strong>UI/UX decision:</strong> {getPipelineUiuxLabel()}</p>
          </div>
          <p className="mt-3 text-xs font-semibold text-emerald-800">
            Default dummy JSON has been loaded into the editor for preview-first testing. Save remains blocked until preview is approved.
          </p>
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
            approvePreview={approvePreview}
            previewApproved={previewApproved}
            requirePreviewApproval={requirePreviewApproval}
            previewTarget={previewTarget}
            setPreviewTarget={setPreviewTarget}
            validateJSON={validateJSON}
            addSection={addSection}
            openPreview={openPreview}
          />
        </div>
      )}
    </div>
  );
}
