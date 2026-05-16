'use client';

import React, { useState } from 'react';
import { BrandProvider, useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';
import {
  TUTORIAL_CONTENT_MANAGER_SECTION_OPTIONS,
  TUTORIAL_SECTION_TABS,
  type TutorialContentManagerSectionId,
} from '@quiz/types';

type SectionType = TutorialContentManagerSectionId;

interface SubtopicInfo {
  subtopicId: string;
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
}

interface AddSectionResponse {
  error?: string;
  details?: string;
  url?: string;
}

interface InlineSvgAsset {
  type: 'inline_svg';
  name: string;
  alt: string;
  width: number;
  height: number;
  dataUri: string;
  caption?: string;
}

interface SvgAssetResponse {
  error?: string;
  asset?: InlineSvgAsset;
}

type SectionStatus = Record<SectionType, boolean>;

const sections = TUTORIAL_CONTENT_MANAGER_SECTION_OPTIONS;
const sectionTabs = TUTORIAL_SECTION_TABS;

const initialSectionStatus = sections.reduce((status, section) => ({
  ...status,
  [section.id]: false,
}), {} as SectionStatus);

function setNestedJsonValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Asset field path is required');
  }

  let cursor: unknown = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    const nextKey = parts[index + 1];
    const keyAsIndex = Number.parseInt(key, 10);
    const nextShouldBeArray = Number.isInteger(Number.parseInt(nextKey, 10));

    if (Array.isArray(cursor) && Number.isInteger(keyAsIndex)) {
      const existing = cursor[keyAsIndex];
      if (existing !== null && typeof existing === 'object') {
        cursor = existing;
        continue;
      }
      const nextContainer: unknown = nextShouldBeArray ? [] : {};
      cursor[keyAsIndex] = nextContainer;
      cursor = nextContainer;
      continue;
    }

    if (cursor !== null && typeof cursor === 'object' && !Array.isArray(cursor)) {
      const record = cursor as Record<string, unknown>;
      const existing = record[key];
      if (existing !== null && typeof existing === 'object') {
        cursor = existing;
        continue;
      }
      const nextContainer: unknown = nextShouldBeArray ? [] : {};
      record[key] = nextContainer;
      cursor = nextContainer;
      continue;
    }

    throw new Error(`Cannot descend into path segment '${key}'.`);
  }

  const lastKey = parts[parts.length - 1];
  const lastIndex = Number.parseInt(lastKey, 10);
  if (Array.isArray(cursor) && Number.isInteger(lastIndex)) {
    cursor[lastIndex] = value;
    return;
  }
  if (cursor !== null && typeof cursor === 'object' && !Array.isArray(cursor)) {
    (cursor as Record<string, unknown>)[lastKey] = value;
    return;
  }

  throw new Error(`Cannot assign asset at path '${path}'.`);
}

function getDefaultAssetFieldPath(section: SectionType) {
  switch (section) {
    case 'layman':
      return 'everydayAnalogy.image';
    case 'notes':
      return 'summaryCard.image';
    case 'code':
      return 'outputDemonstration.previewAsset';
    case 'technical':
      return 'sections.0.diagramAsset';
    case 'summary':
      return 'masteryRecapCard.heroAsset';
    case 'visual':
      return 'conceptVisualIntro.image';
    default:
      return '';
  }
}

function getAllowedAssetFieldPaths(section: SectionType) {
  switch (section) {
    case 'layman':
      return ['everydayAnalogy.image', 'simpleOverview.image'];
    case 'notes':
      return ['summaryCard.image', 'summaryHeroInfographic.image', 'conceptMemoryMap.image', 'syntaxBlock.image'];
    case 'code':
      return ['outputDemonstration.previewAsset'];
    case 'technical':
      return ['sections.0.diagramAsset'];
    case 'summary':
      return ['masteryRecapCard.heroAsset'];
    case 'visual':
      return [
        'conceptVisualIntro.image',
        'diagrammaticBreakdown.image',
        'stepByStepVisualFlow.image',
        'comparativeVisualization.image',
        'mentalModelVisualization.image',
        'realWorldVisualMapping.image',
        'commonConfusionVisualization.image',
        'visualSummary.image'
      ];
    default:
      return [] as string[];
  }
}

function ContentManagerContent() {
  const brand = useBrand();
  const [subtopicInfo, setSubtopicInfo] = useState<SubtopicInfo>({
    subtopicId: '',
    domain: '',
    subject: '',
    topic: '',
    subtopic: '',
  });
  const [isSubtopicCreated, setIsSubtopicCreated] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionType>('notes');
  const [jsonInput, setJsonInput] = useState('');
  const [sectionStatus, setSectionStatus] = useState<SectionStatus>(initialSectionStatus);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [assetFieldPath, setAssetFieldPath] = useState(getDefaultAssetFieldPath('notes'));
  const [assetName, setAssetName] = useState('');
  const [assetAlt, setAssetAlt] = useState('');
  const [assetCaption, setAssetCaption] = useState('');
  const [assetWidth, setAssetWidth] = useState('1200');
  const [assetHeight, setAssetHeight] = useState('700');
  const [svgMarkup, setSvgMarkup] = useState('');
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [processedAsset, setProcessedAsset] = useState<InlineSvgAsset | null>(null);
  const [isProcessingAsset, setIsProcessingAsset] = useState(false);

  const selectedSectionLabel = sections.find((section) => section.id === selectedSection)?.label ?? selectedSection;
  const allowedAssetFieldPaths = getAllowedAssetFieldPaths(selectedSection);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const createSubtopic = () => {
    const hasRequiredFields = Boolean(
      subtopicInfo.subtopicId &&
      subtopicInfo.domain &&
      subtopicInfo.subject &&
      subtopicInfo.topic &&
      subtopicInfo.subtopic
    );
    if (!hasRequiredFields) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(subtopicInfo.subtopicId)) {
      showMessage('Subtopic ID must be lowercase with hyphens only, for example javascript-promises', 'error');
      return;
    }

    setIsSubtopicCreated(true);
    showMessage('Subtopic ready. Add content one section at a time.', 'success');
  };

  const validateJSON = () => {
    if (!jsonInput.trim()) {
      showMessage('Please paste JSON content', 'error');
      return false;
    }

    try {
      JSON.parse(jsonInput);
      showMessage('Valid JSON', 'success');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Invalid JSON: ${errorMessage}`, 'error');
      return false;
    }
  };

  const processSvgAsset = async () => {
    if (!assetAlt.trim()) {
      showMessage('Asset alt text is required.', 'error');
      return;
    }
    if (!svgFile && !svgMarkup.trim()) {
      showMessage('Upload an SVG file or paste SVG markup.', 'error');
      return;
    }

    try {
      setIsProcessingAsset(true);
      const formData = new FormData();
      formData.append('name', assetName.trim() || `${selectedSection}-${subtopicInfo.subtopicId || 'subtopic'}-asset`);
      formData.append('alt', assetAlt.trim());
      formData.append('caption', assetCaption.trim());
      formData.append('width', assetWidth.trim() || '1200');
      formData.append('height', assetHeight.trim() || '700');

      if (svgFile) {
        formData.append('file', svgFile);
      } else {
        formData.append('svgMarkup', svgMarkup);
      }

      const response = await fetch('/api/content-manager/svg-asset', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json() as SvgAssetResponse;
      if (!response.ok || !result.asset) {
        showMessage(result.error ?? 'Failed to process SVG asset.', 'error');
        return;
      }

      setProcessedAsset(result.asset);
      showMessage('SVG asset processed. You can inject it into the JSON now.', 'success');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsProcessingAsset(false);
    }
  };

  const injectAssetIntoJson = () => {
    if (!processedAsset) {
      showMessage('Process an SVG asset first.', 'error');
      return;
    }
    if (!assetFieldPath.trim()) {
      showMessage('Asset field path is required.', 'error');
      return;
    }
    if (!jsonInput.trim()) {
      showMessage('Paste the section JSON before injecting the asset.', 'error');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput) as Record<string, unknown>;
      const rootKeys = Object.keys(parsed);
      const rootKey = rootKeys.length === 1 ? rootKeys[0] : selectedSection;
      const rootValue = parsed[rootKey];

      if (rootValue === null || typeof rootValue !== 'object' || Array.isArray(rootValue)) {
        throw new Error(`Root key '${rootKey}' must contain a JSON object.`);
      }

      setNestedJsonValue(rootValue as Record<string, unknown>, assetFieldPath, processedAsset);
      setJsonInput(JSON.stringify(parsed, null, 2));
      showMessage(`Injected asset into ${rootKey}.${assetFieldPath}.`, 'success');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Unable to inject asset: ${errorMessage}`, 'error');
    }
  };

  const addSection = async () => {
    if (!validateJSON()) return;

    try {
      const response = await fetch('/api/content-manager/add-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subtopicId: subtopicInfo.subtopicId,
          subtopicInfo,
          section: selectedSection,
          content: JSON.parse(jsonInput),
        }),
      });

      const result = await response.json() as AddSectionResponse;

      if (response.ok) {
        setSectionStatus((prev) => ({ ...prev, [selectedSection]: true }));
        setJsonInput('');
        showMessage(`${selectedSectionLabel} saved to tutorial_sections.`, 'success');
      } else {
        const details = result.details ? ` ${result.details}` : '';
        showMessage(`Error: ${result.error ?? 'Failed to save section'}${details}`, 'error');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Error: ${errorMessage}`, 'error');
    }
  };

  const getPageUrl = (section?: SectionType) => {
    const baseUrl = `https://user.realtutorialhub.com/start-learning/subtopic/${subtopicInfo.subtopicId}`;
    return section ? `${baseUrl}?tab=${sectionTabs[section]}` : baseUrl;
  };

  const openPreview = (section?: SectionType) => {
    window.open(getPageUrl(section), '_blank');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="p-8 text-center" style={{ backgroundColor: brand.primaryColor }}>
            <h1 className="mb-3 text-4xl font-bold text-white">Content Manager</h1>
            <p className="text-lg font-semibold text-white">Add AI-generated tutorial content one section at a time</p>
          </div>
        </header>

        {message ? (
          <div
            className={`mb-6 rounded-lg p-4 ${
              messageType === 'success'
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
          <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">Step 1: Create New Subtopic</h2>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="subtopicId" className="mb-2 block text-sm font-semibold text-gray-700">
                  Subtopic ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="subtopicId"
                  type="text"
                  value={subtopicInfo.subtopicId}
                  onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, subtopicId: event.target.value.toLowerCase() }))}
                  placeholder="javascript-promises"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Lowercase with hyphens, used in the learner URL</p>
              </div>

              <div>
                <label htmlFor="domain" className="mb-2 block text-sm font-semibold text-gray-700">
                  Domain <span className="text-red-500">*</span>
                </label>
                <input
                  id="domain"
                  type="text"
                  value={subtopicInfo.domain}
                  onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, domain: event.target.value }))}
                  placeholder="Programming"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subtopicInfo.subject}
                  onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="JavaScript"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="topic" className="mb-2 block text-sm font-semibold text-gray-700">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  id="topic"
                  type="text"
                  value={subtopicInfo.topic}
                  onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, topic: event.target.value }))}
                  placeholder="Asynchronous Programming"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="subtopicName" className="mb-2 block text-sm font-semibold text-gray-700">
                  Subtopic Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="subtopicName"
                  type="text"
                  value={subtopicInfo.subtopic}
                  onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, subtopic: event.target.value }))}
                  placeholder="JavaScript Promises"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={createSubtopic}
              className="w-full rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Continue to Sections
            </button>
          </section>
        ) : (
          <>
            <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Content Progress</h2>

              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`rounded-lg border-2 p-4 ${
                      sectionStatus[section.id] ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 min-w-8 items-center justify-center rounded bg-white px-2 text-xs font-bold text-gray-700 shadow-sm">
                        {section.marker}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800">{section.label}</p>
                        <p className={`text-xs ${sectionStatus[section.id] ? 'text-green-600' : 'text-gray-500'}`}>
                          {sectionStatus[section.id] ? 'Saved' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
                <p className="font-medium text-blue-900">
                  Page URL:{' '}
                  <a href={getPageUrl()} target="_blank" rel="noopener noreferrer" className="underline">
                    {getPageUrl()}
                  </a>
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={() => openPreview()}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Preview Page
                  </button>
                  <button
                    onClick={() => openPreview(selectedSection)}
                    className="rounded-lg bg-slate-800 px-6 py-2 font-semibold text-white transition-colors hover:bg-slate-900"
                  >
                    Preview Selected Section
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Step 2: Add Content Section</h2>

              <div className="mb-6">
                <label htmlFor="sectionSelect" className="mb-3 block text-sm font-semibold text-gray-700">
                  Select Section to Add
                </label>
                <select
                  id="sectionSelect"
                  value={selectedSection}
                  onChange={(event) => {
                    const nextSection = event.target.value as SectionType;
                    setSelectedSection(nextSection);
                    setAssetFieldPath(getDefaultAssetFieldPath(nextSection));
                  }}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.marker} {section.label} {sectionStatus[section.id] ? '(Saved)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="text-lg font-bold text-slate-900">Optional SVG Asset Builder</h3>
                  <p className="mt-1 text-sm text-slate-700">
                    Use this for internal tutorial visuals. This pass stores SVGs directly in section JSON, which is fine for lightweight educational diagrams and avoids third-party image URLs.
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="assetFieldPath" className="mb-2 block text-sm font-semibold text-gray-700">
                        Target JSON field
                      </label>
                      {allowedAssetFieldPaths.length > 0 ? (
                        <>
                          <select
                            id="assetFieldPath"
                            value={assetFieldPath}
                            onChange={(event) => setAssetFieldPath(event.target.value)}
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            {allowedAssetFieldPaths.map((path) => (
                              <option key={path} value={path}>
                                {path}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">Allowed SVG injection paths for this section are pre-configured.</p>
                        </>
                      ) : (
                        <input
                          id="assetFieldPath"
                          type="text"
                          value={assetFieldPath}
                          onChange={(event) => setAssetFieldPath(event.target.value)}
                          placeholder="everydayAnalogy.image"
                          className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      )}
                    </div>
                    <div>
                      <label htmlFor="assetName" className="mb-2 block text-sm font-semibold text-gray-700">
                        Asset name
                      </label>
                      <input
                        id="assetName"
                        type="text"
                        value={assetName}
                        onChange={(event) => setAssetName(event.target.value)}
                        placeholder={`${selectedSection}-${subtopicInfo.subtopicId || 'subtopic'}-visual`}
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="assetAlt" className="mb-2 block text-sm font-semibold text-gray-700">
                        Alt text
                      </label>
                      <input
                        id="assetAlt"
                        type="text"
                        value={assetAlt}
                        onChange={(event) => setAssetAlt(event.target.value)}
                        placeholder="Educational diagram showing the concept visually"
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="assetCaption" className="mb-2 block text-sm font-semibold text-gray-700">
                        Caption
                      </label>
                      <input
                        id="assetCaption"
                        type="text"
                        value={assetCaption}
                        onChange={(event) => setAssetCaption(event.target.value)}
                        placeholder="Optional caption shown below the image"
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="assetWidth" className="mb-2 block text-sm font-semibold text-gray-700">
                        Width
                      </label>
                      <input
                        id="assetWidth"
                        type="number"
                        value={assetWidth}
                        onChange={(event) => setAssetWidth(event.target.value)}
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="assetHeight" className="mb-2 block text-sm font-semibold text-gray-700">
                        Height
                      </label>
                      <input
                        id="assetHeight"
                        type="number"
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

                <label htmlFor="jsonInput" className="mb-3 block text-sm font-semibold text-gray-700">
                  Paste AI-Generated JSON
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
                  onClick={validateJSON}
                  className="flex-1 rounded-lg bg-gray-600 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  Validate JSON
                </button>
                <button
                  onClick={addSection}
                  className="flex-1 rounded-lg py-3 font-semibold text-white transition-all hover:shadow-xl"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  Save This Section
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function ContentManagerPage() {
  return (
    <BrandProvider brand={rthConfig}>
      <ContentManagerContent />
    </BrandProvider>
  );
}
