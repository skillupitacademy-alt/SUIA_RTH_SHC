'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { ASSET_SPECS } from '../../prompt-generator/lib/asset-specs';
import {
  SectionType,
  SubtopicInfo,
  AddSectionResponse,
  InlineSvgAsset,
  SvgAssetResponse,
  SectionStatus,
  sections,
  sectionTabs,
  initialSectionStatus,
  SUBSECTIONS_MAP,
  getDefaultAssetFieldPath,
} from './types';
import { ComponentPreview } from './ComponentPreview';

function setNestedJsonValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.');
  const lastKey = parts.pop()!;
  let cursor: unknown = target;

  for (const p of parts) {
    if (cursor === null || typeof cursor !== 'object' || Array.isArray(cursor)) {
      throw new Error(`Cannot traverse path '${path}' because segment '${p}' is not a JSON object.`);
    }

    const dict = cursor as Record<string, unknown>;
    if (!(p in dict) || dict[p] === null || typeof dict[p] !== 'object' || Array.isArray(dict[p])) {
      dict[p] = {};
    }
    cursor = dict[p];
  }
  if (cursor !== null && typeof cursor === 'object' && !Array.isArray(cursor)) {
    (cursor as Record<string, unknown>)[lastKey] = value;
    return;
  }

  throw new Error(`Cannot assign asset at path '${path}'.`);
}

export function ContentManagerUI() {
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
  const [selectedSubsection, setSelectedSubsection] = useState<string>('');
  const [isFetchingSubsection, setIsFetchingSubsection] = useState(false);
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
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const selectedSectionLabel = sections.find((section) => section.id === selectedSection)?.label ?? selectedSection;

  const activeSpecs = React.useMemo(() => {
    const specs = ASSET_SPECS[selectedSection] || [];

    if (selectedSubsection) {
      let filtered = specs.filter((spec) => {
        const subLower = selectedSubsection.toLowerCase().replace('svg', '');
        const pathLower = spec.fieldPath.toLowerCase();
        return pathLower.includes(subLower) || subLower.includes(pathLower.split('.')[0]);
      });

      // Special mappings for specific subsections
      if (filtered.length === 0) {
        if (selectedSubsection === 'summaryHeroSvg') filtered = specs.filter(s => s.fieldPath.includes('summaryHeroInfographic'));
        if (selectedSubsection === 'analogySvg') filtered = specs.filter(s => s.fieldPath.includes('everydayAnalogy'));
        if (selectedSubsection === 'heroVisualSvg') filtered = specs.filter(s => s.fieldPath.includes('heroVisual') || s.fieldPath.includes('simpleOverview'));
      }

      return filtered;
    }

    return specs;
  }, [selectedSection, selectedSubsection]);

  useEffect(() => {
    if (activeSpecs.length > 0) {
      const match = activeSpecs.find((s) => s.fieldPath === assetFieldPath) || activeSpecs[0];
      setAssetFieldPath(match.fieldPath);
      setAssetWidth(String(match.width));
      setAssetHeight(String(match.height));
      setAssetName(match.id);
    } else {
      setAssetFieldPath(getDefaultAssetFieldPath(selectedSection));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, selectedSubsection, activeSpecs]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const sectParam = searchParams.get('section');
    const subParam = searchParams.get('subsection');

    if (sectParam) {
      setSelectedSection(sectParam as SectionType);
      setAssetFieldPath(getDefaultAssetFieldPath(sectParam as SectionType));
    }
    if (subParam) {
      setSelectedSubsection(subParam);
    }
  }, [searchParams]);

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

  const loadSubtopic = async () => {
    if (!subtopicInfo.subtopicId.trim()) {
      showMessage('Please enter a Subtopic ID to load', 'error');
      return;
    }

    try {
      setIsFetchingSubsection(true);
      const response = await fetch(`/api/content-manager/add-section?subtopicId=${subtopicInfo.subtopicId.trim()}&section=${selectedSection}`);
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.error || 'Subtopic not found', 'error');
        return;
      }

      if (result.subtopicInfo) {
        setSubtopicInfo(result.subtopicInfo);
        setIsSubtopicCreated(true);
        showMessage('Existing subtopic loaded successfully!', 'success');
      } else {
        setIsSubtopicCreated(true);
        showMessage('Subtopic metadata active. Pasting content allowed.', 'success');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Failed to load subtopic: ${errorMessage}`, 'error');
    } finally {
      setIsFetchingSubsection(false);
    }
  };

  const fetchSubsection = async () => {
    if (!subtopicInfo.subtopicId.trim()) {
      showMessage('Please enter a Subtopic ID first.', 'error');
      return;
    }

    try {
      setIsFetchingSubsection(true);
      const url = `/api/content-manager/add-section?subtopicId=${subtopicInfo.subtopicId.trim()}&section=${selectedSection}${selectedSubsection ? `&subsection=${selectedSubsection}` : ''
        }`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.error || 'Failed to fetch content from database', 'error');
        return;
      }

      if (result.content === null) {
        setJsonInput('');
        showMessage(result.message || 'No existing content found for this selection in database.', 'info');
        return;
      }

      const contentVal = result.content;

      if (selectedSubsection) {
        const subSecConfig = SUBSECTIONS_MAP[selectedSection]?.find((s) => s.id === selectedSubsection);
        if (subSecConfig?.type === 'svg') {
          if (contentVal && typeof contentVal === 'object' && contentVal.dataUri) {
            const dataUri: string = contentVal.dataUri;
            if (dataUri.startsWith('data:image/svg+xml;base64,')) {
              const base64Str = dataUri.substring('data:image/svg+xml;base64,'.length);
              try {
                const decoded = atob(base64Str);
                setJsonInput(decoded);
                showMessage(`Loaded and decoded SVG '${selectedSubsection}' successfully.`, 'success');
                return;
              } catch {
                // Keep dataUri
              }
            }
          }
        }
      }

      if (typeof contentVal === 'object' && contentVal !== null) {
        setJsonInput(JSON.stringify(contentVal, null, 2));
      } else {
        setJsonInput(String(contentVal));
      }

      showMessage(`Loaded current content from database successfully.`, 'success');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Failed to load content: ${errorMessage}`, 'error');
    } finally {
      setIsFetchingSubsection(false);
    }
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
        let sanitized = svgMarkup.trim();
        sanitized = sanitized.replace(/^```(?:svg|xml)?\s*/i, '').replace(/\s*```$/, '').trim();
        if (sanitized.startsWith('{')) {
          try {
            const parsed = JSON.parse(sanitized);
            const inner = parsed?.svg ?? parsed?.content ?? parsed?.data;
            if (typeof inner === 'string' && inner.includes('<svg')) {
              sanitized = inner.trim();
            }
          } catch {
            // Not JSON
          }
        }
        formData.append('svgMarkup', sanitized);
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

      let targetContainer: Record<string, unknown> = parsed;
      let targetPath = assetFieldPath;
      let matchedCase = 'direct';

      if (
        rootKeys.length === 1 &&
        (rootKeys[0] === selectedSection ||
          ['notes', 'layman', 'overview', 'code', 'visual', 'practice', 'real_life', 'technical', 'assignment', 'project', 'quiz', 'summary', 'interview', 'ai_tutor'].includes(rootKeys[0]))
      ) {
        const rootKey = rootKeys[0];
        const rootValue = parsed[rootKey];
        if (rootValue !== null && typeof rootValue === 'object' && !Array.isArray(rootValue)) {
          targetContainer = rootValue as Record<string, unknown>;
          targetPath = assetFieldPath;
          matchedCase = 'wrapped';
        }
      }
      else if (selectedSubsection && assetFieldPath.startsWith(`${selectedSubsection}.`)) {
        targetPath = assetFieldPath.substring(`${selectedSubsection}.`.length);
        matchedCase = 'subsection';
      }

      setNestedJsonValue(targetContainer, targetPath, processedAsset);
      setJsonInput(JSON.stringify(parsed, null, 2));

      const pathLabel = matchedCase === 'wrapped' ? `${rootKeys[0]}.${targetPath}` : targetPath;
      showMessage(`Injected asset into ${pathLabel} successfully.`, 'success');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Unable to inject asset: ${errorMessage}`, 'error');
    }
  };

  const addSection = async () => {
    let finalContent: unknown;
    const trimmedInput = jsonInput.trim();

    if (!trimmedInput) {
      showMessage('Please provide content in the editor.', 'error');
      return;
    }

    if (selectedSubsection) {
      const subSecConfig = SUBSECTIONS_MAP[selectedSection]?.find((s) => s.id === selectedSubsection);
      if (subSecConfig?.type === 'svg' && (trimmedInput.startsWith('<svg') || trimmedInput.startsWith('<?xml') || trimmedInput.includes('<svg'))) {
        finalContent = trimmedInput;
      } else {
        try {
          finalContent = JSON.parse(trimmedInput);
        } catch {
          finalContent = trimmedInput;
        }
      }
    } else {
      if (!validateJSON()) return;
      finalContent = JSON.parse(trimmedInput);
    }

    try {
      const response = await fetch('/api/content-manager/add-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subtopicId: subtopicInfo.subtopicId,
          subtopicInfo,
          section: selectedSection,
          subsection: selectedSubsection || undefined,
          content: finalContent,
        }),
      });

      const result = await response.json() as AddSectionResponse & { subsection?: string };

      if (response.ok) {
        if (!selectedSubsection) {
          setSectionStatus((prev) => ({ ...prev, [selectedSection]: true }));
          setJsonInput('');
        }
        showMessage(result.message || `${selectedSectionLabel} saved to database.`, 'success');
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

  const handlePreview = () => {
    if (!jsonInput.trim()) {
      showMessage('Please paste JSON content first.', 'error');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setPreviewData(parsed);
      setIsPreviewOpen(true);
      showMessage('Loaded preview for component.', 'success');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`JSON parse error: ${errorMessage}. Correct it to preview.`, 'error');
    }
  };

  return (
    <div className={`container mx-auto px-4 py-8 transition-all duration-300 ${isPreviewOpen ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
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
        <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 font-outfit">Step 1: Create New Subtopic</h2>

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

          <div className="flex gap-4">
            <button
              onClick={loadSubtopic}
              className="flex-1 rounded-xl bg-slate-800 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-slate-900"
              disabled={isFetchingSubsection}
            >
              {isFetchingSubsection ? 'Loading...' : 'Load Existing Subtopic'}
            </button>
            <button
              onClick={createSubtopic}
              className="flex-1 rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Continue to Sections
            </button>
          </div>
        </section>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0 space-y-8">
            <section className="rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
              <h2 className="mb-6 text-2xl font-bold text-gray-800 font-outfit">Content Progress</h2>

              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`rounded-lg border-2 p-4 ${sectionStatus[section.id] ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
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

            {/* Workspace Editor */}
            <section className="rounded-2xl bg-white p-8 shadow-lg border border-slate-100 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 border-b border-slate-100 pb-3 flex items-center justify-between font-outfit">
                <span>Step 2: Add Content Section</span>
                <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-600 rounded-full">Workspace Editor</span>
              </h2>

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
                    setSelectedSubsection('');
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

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="subsectionSelect" className="mb-3 block text-sm font-semibold text-gray-700">
                    Edit Level (Select Subsection to target, or edit Whole Section)
                  </label>
                  <select
                    id="subsectionSelect"
                    value={selectedSubsection}
                    onChange={(event) => setSelectedSubsection(event.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Whole Section (Full JSON schema)</option>
                    {SUBSECTIONS_MAP[selectedSection]?.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        Subsection: {sub.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchSubsection}
                    className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 shadow-md"
                    disabled={isFetchingSubsection}
                  >
                    {isFetchingSubsection ? 'Fetching from DB...' : 'Fetch Current Value from DB'}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 animate-fade-in">
                  <h3 className="text-lg font-bold text-slate-900 font-outfit">Optional SVG Asset Builder</h3>
                  <p className="mt-1 text-sm text-slate-700">
                    Use this for internal tutorial visuals. This pass stores SVGs directly in section JSON, which is fine for lightweight diagrams and avoids third-party image URLs.
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="assetFieldPath" className="mb-2 block text-sm font-semibold text-gray-700">
                        Target JSON field
                      </label>
                      {selectedSubsection && activeSpecs.length === 0 ? (
                        <div className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-xs text-slate-500 italic">
                          This subsection consists of structured text blocks and layout metadata (no custom illustration SVG required).
                        </div>
                      ) : activeSpecs.length > 0 ? (
                        <>
                          <select
                            id="assetFieldPath"
                            value={assetFieldPath}
                            onChange={(event) => {
                              const nextPath = event.target.value;
                              setAssetFieldPath(nextPath);
                              const match = activeSpecs.find((s) => s.fieldPath === nextPath);
                              if (match) {
                                setAssetWidth(String(match.width));
                                setAssetHeight(String(match.height));
                                setAssetName(match.id);
                              }
                            }}
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            {activeSpecs.map((spec) => (
                              <option key={spec.fieldPath} value={spec.fieldPath}>
                                {spec.label} ({spec.fieldPath})
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">Allowed SVG injection paths for this selection are pre-configured.</p>
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
          </div>

          {/* Live Preview Sidebar */}
          {isPreviewOpen && (
            <aside className="w-full lg:w-[480px] xl:w-[560px] sticky top-6 bg-white rounded-2xl p-6 shadow-lg border border-slate-150 shrink-0">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 font-outfit">Live Preview</h3>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="max-h-[80vh] overflow-y-auto pr-1">
                <ComponentPreview section={selectedSection} subsection={selectedSubsection} data={previewData} />
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}


