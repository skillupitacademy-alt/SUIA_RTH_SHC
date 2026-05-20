'use client';

import React from 'react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { sections, SUBSECTIONS_MAP, SectionType } from './types';

interface SectionManagerProps {
  selectedSection: SectionType;
  setSelectedSection: (sec: SectionType) => void;
  selectedSubsection: string;
  setSelectedSubsection: (sub: string) => void;
  jsonInput: string;
  setJsonInput: (val: string) => void;
  isFetchingSubsection: boolean;
  fetchSubsection: () => void;
  activeSpecs: any[];
  assetFieldPath: string;
  setAssetFieldPath: (val: string) => void;
  assetName: string;
  setAssetName: (val: string) => void;
  assetAlt: string;
  setAssetAlt: (val: string) => void;
  assetCaption: string;
  setAssetCaption: (val: string) => void;
  assetWidth: string;
  setAssetWidth: (val: string) => void;
  assetHeight: string;
  setAssetHeight: (val: string) => void;
  svgMarkup: string;
  setSvgMarkup: (val: string) => void;
  svgFile: File | null;
  setSvgFile: (file: File | null) => void;
  processedAsset: any;
  isProcessingAsset: boolean;
  processSvgAsset: () => void;
  injectAssetIntoJson: () => void;
  handlePreview: () => void;
  validateJSON: () => void;
  addSection: () => void;
  openPreview: (section?: SectionType) => void;
}

export function SectionManager({
  selectedSection,
  setSelectedSection,
  selectedSubsection,
  setSelectedSubsection,
  jsonInput,
  setJsonInput,
  isFetchingSubsection,
  fetchSubsection,
  activeSpecs,
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
  processSvgAsset,
  injectAssetIntoJson,
  handlePreview,
  validateJSON,
  addSection,
  openPreview
}: SectionManagerProps) {
  const brand = useBrand();

  const subsections = SUBSECTIONS_MAP[selectedSection] ?? [];

  return (
    <section className="rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
      <h2 className="mb-6 text-2xl font-bold text-gray-800 font-outfit">Step 2: Manage Section Content</h2>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="sectionSelect" className="mb-2 block text-sm font-semibold text-gray-700">
            Select Section <span className="text-red-500">*</span>
          </label>
          <select
            id="sectionSelect"
            value={selectedSection}
            onChange={(event) => {
              setSelectedSection(event.target.value as SectionType);
              setSelectedSubsection('');
            }}
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subsectionSelect" className="mb-2 block text-sm font-semibold text-gray-700">
            Select Subsection (Optional)
          </label>
          <select
            id="subsectionSelect"
            value={selectedSubsection}
            onChange={(event) => setSelectedSubsection(event.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Full Section</option>
            {subsections.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={fetchSubsection}
          className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          disabled={isFetchingSubsection}
        >
          {isFetchingSubsection ? 'Loading Content...' : 'Load Current Content from Database'}
        </button>

        <button
          onClick={() => openPreview(selectedSection)}
          className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Open Learner Page Tab
        </button>
      </div>

      {/* SVG / Asset Spec Creator Panel */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-slate-50 p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-800 font-outfit">Inline SVG / Asset Asset Creator</h3>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="assetFieldPath" className="mb-2 block text-sm font-semibold text-gray-700">
              Select Field Path for Asset Injection
            </label>
            <select
              id="assetFieldPath"
              value={assetFieldPath}
              onChange={(event) => {
                const val = event.target.value;
                setAssetFieldPath(val);
                const spec = activeSpecs.find((s) => s.fieldPath === val);
                if (spec) {
                  setAssetWidth(String(spec.width));
                  setAssetHeight(String(spec.height));
                  setAssetName(spec.id);
                }
              }}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              {activeSpecs.map((spec) => (
                <option key={spec.fieldPath} value={spec.fieldPath}>
                  {spec.fieldPath} ({spec.width}x{spec.height})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assetName" className="mb-2 block text-sm font-semibold text-gray-700">
              Asset ID / Name
            </label>
            <input
              id="assetName"
              type="text"
              value={assetName}
              onChange={(event) => setAssetName(event.target.value)}
              placeholder="e.g. scope-chain-hero"
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="assetAlt" className="mb-2 block text-sm font-semibold text-gray-700">
              Asset Alt Text (Required) <span className="text-red-500">*</span>
            </label>
            <input
              id="assetAlt"
              type="text"
              value={assetAlt}
              onChange={(event) => setAssetAlt(event.target.value)}
              placeholder="Visual explanation of the JavaScript scope chain showing execution context bubbles..."
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="assetCaption" className="mb-2 block text-sm font-semibold text-gray-700">
              Asset Caption (Optional)
            </label>
            <input
              id="assetCaption"
              type="text"
              value={assetCaption}
              onChange={(event) => setAssetCaption(event.target.value)}
              placeholder="Figure 1.1: Visualizing Scope Chain Traversals"
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="assetWidth" className="mb-2 block text-sm font-semibold text-gray-700">
              Asset Target Width (px)
            </label>
            <input
              id="assetWidth"
              type="text"
              value={assetWidth}
              onChange={(event) => setAssetWidth(event.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="assetHeight" className="mb-2 block text-sm font-semibold text-gray-700">
              Asset Target Height (px)
            </label>
            <input
              id="assetHeight"
              type="text"
              value={assetHeight}
              onChange={(event) => setAssetHeight(event.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="svgFile" className="mb-2 block text-sm font-semibold text-gray-700">
              Upload SVG file
            </label>
            <input
              id="svgFile"
              type="file"
              accept=".svg,image/svg+xml"
              onChange={(event) => setSvgFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="svgMarkup" className="mb-2 block text-sm font-semibold text-gray-700">
              Or paste SVG markup
            </label>
            <textarea
              id="svgMarkup"
              value={svgMarkup}
              onChange={(event) => setSvgMarkup(event.target.value)}
              placeholder="<svg ...>...</svg>"
              className="h-40 w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={processSvgAsset}
            className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-amber-700"
            disabled={isProcessingAsset}
          >
            {isProcessingAsset ? 'Processing SVG...' : 'Process SVG Asset'}
          </button>
          <button
            onClick={injectAssetIntoJson}
            className="rounded-lg bg-slate-800 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-900"
            disabled={!processedAsset}
          >
            Inject Asset Into JSON
          </button>
        </div>

        {processedAsset ? (
          <pre className="mt-4 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-200">
            {JSON.stringify(processedAsset, null, 2)}
          </pre>
        ) : null}
      </div>

      <div className="mb-6">
        <label htmlFor="jsonInput" className="mb-3 block text-sm font-semibold text-gray-700">
          Paste AI-Generated JSON or raw SVG markup
        </label>
        <textarea
          id="jsonInput"
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          placeholder='{"notes": {"schemaVersion": 1, "sectionType": "notes", "simpleWords": "...", "definitionBlock": {...}, "sections": [...]}}'
          className="h-96 w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handlePreview}
          className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2"
        >
          Preview Component
        </button>
        <button
          onClick={validateJSON}
          className="flex-1 rounded-lg bg-gray-600 py-3 font-semibold text-white transition-colors hover:bg-gray-700 shadow-md"
        >
          Validate JSON
        </button>
        <button
          onClick={addSection}
          className="flex-1 rounded-lg py-3 font-semibold text-white transition-all hover:shadow-xl shadow-md"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Save This Section
        </button>
      </div>
    </section>
  );
}
