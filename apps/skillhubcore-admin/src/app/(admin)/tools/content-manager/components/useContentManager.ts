'use client';

import { useState, useEffect, useContext, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShellContext } from '../../../ShellContext';
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
import { ASSET_SPECS } from '../../prompt-generator/lib/asset-specs';
import { getStrictSectionJsonTemplate } from '../../prompt-generator/lib/prompt-templates';

export type PreviewTarget = 'local' | 'rth' | 'suia';

const PIPELINE_PAYLOAD_STORAGE_KEY = 'skillhubcore.globalArchitecture.pipelinePayload.v1';

const PREVIEW_TARGET_BASE_URLS: Record<PreviewTarget, string> = {
  local: 'http://localhost:3003',
  rth: 'https://user.realtutorialhub.com',
  suia: 'https://user.skillupitacademy.com',
};

type PipelinePayload = {
  source?: string;
  section?: string;
  adminSectionId?: string;
  subsection?: string | null;
  dummyContext?: {
    domain?: string;
    subject?: string;
    topic?: string;
    subtopic?: string;
    subtopicId?: string;
  };
  previewTarget?: PreviewTarget;
  educationalArchitectureKey?: string;
  uiuxArchitectureKey?: string;
  educationalComponent?: Record<string, unknown> | null;
  uiuxComponent?: Record<string, unknown> | null;
  rendererMapping?: Record<string, unknown> | null;
  defaultJson?: unknown;
};

const getPromptSectionId = (sectionId: string) => sectionId === 'reallife' ? 'real_life' : sectionId;

const getDefaultPipelineJson = (sectionId: string, subsectionId: string | null, subtopicName: string) => {
  const template = getStrictSectionJsonTemplate(getPromptSectionId(sectionId), subtopicName || 'What is Python?');
  const rootKey = Object.keys(template)[0];
  const rootValue = template[rootKey];

  if (
    subsectionId &&
    rootValue &&
    typeof rootValue === 'object' &&
    !Array.isArray(rootValue) &&
    subsectionId in rootValue
  ) {
    return (rootValue as Record<string, unknown>)[subsectionId];
  }

  return template;
};

const getRecordLabel = (record: Record<string, unknown> | null | undefined, keys: string[]) => {
  if (!record) return 'Not selected';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return 'Configured';
};

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

export function useContentManager() {
  const { isRightSidebarOpen, setIsRightSidebarOpen, setRightSidebarContent, setRightSidebarWidth } = useContext(ShellContext);
  
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
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [previewApproved, setPreviewApproved] = useState(false);
  const [requirePreviewApproval, setRequirePreviewApproval] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>('local');
  const [pipelinePayload, setPipelinePayload] = useState<PipelinePayload | null>(null);

  const selectedSectionLabel = sections.find((section) => section.id === selectedSection)?.label ?? selectedSection;

  const activeSpecs = useMemo(() => {
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
    const domainParam = searchParams.get('domain');
    const subjectParam = searchParams.get('subject');
    const topicParam = searchParams.get('topic');
    const subtopicParam = searchParams.get('subtopic');
    const subtopicIdParam = searchParams.get('subtopicId');
    const previewTargetParam = searchParams.get('previewTarget');
    const requiresApproval = searchParams.get('requirePreviewApproval') === 'true';
    const sourceParam = searchParams.get('source');
    let loadedPayload: PipelinePayload | null = null;

    if (sourceParam === 'global-architecture' || sourceParam === 'prompt-generator') {
      try {
        const storedPayload = window.localStorage.getItem(PIPELINE_PAYLOAD_STORAGE_KEY);
        loadedPayload = storedPayload ? JSON.parse(storedPayload) as PipelinePayload : null;
        setPipelinePayload(loadedPayload);
      } catch {
        setPipelinePayload(null);
      }
    }

    if (sectParam) {
      setSelectedSection(sectParam as SectionType);
      setAssetFieldPath(getDefaultAssetFieldPath(sectParam as SectionType));
    }
    if (subParam) {
      setSelectedSubsection(subParam);
    }
    if (requiresApproval) setRequirePreviewApproval(true);
    if (previewTargetParam === 'local' || previewTargetParam === 'rth' || previewTargetParam === 'suia') {
      setPreviewTarget(previewTargetParam);
    }
    if (domainParam || subjectParam || topicParam || subtopicParam || subtopicIdParam) {
      const nextInfo = {
        subtopicId: subtopicIdParam || '',
        domain: domainParam || '',
        subject: subjectParam || '',
        topic: topicParam || '',
        subtopic: subtopicParam || '',
      };
      setSubtopicInfo(nextInfo);
      if (nextInfo.subtopicId && nextInfo.domain && nextInfo.subject && nextInfo.topic && nextInfo.subtopic) {
        setIsSubtopicCreated(true);
        showMessage('Pipeline context loaded. Preview and approve before saving.', 'info');
      }
    }

    if ((sourceParam === 'global-architecture' || sourceParam === 'prompt-generator') && !jsonInput.trim()) {
      const sectionToUse = sectParam || loadedPayload?.adminSectionId || loadedPayload?.section || selectedSection;
      const subsectionToUse = subParam || loadedPayload?.subsection || '';
      const subtopicToUse = subtopicParam || loadedPayload?.dummyContext?.subtopic || subtopicInfo.subtopic || 'What is Python?';
      const payloadJson = loadedPayload?.defaultJson;
      const defaultJson = payloadJson ?? getDefaultPipelineJson(sectionToUse, subsectionToUse || null, subtopicToUse);
      setJsonInput(JSON.stringify(defaultJson, null, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      showMessage(`Asset injection failed: ${errorMessage}`, 'error');
    }
  };

  const addSection = async () => {
    let finalContent: unknown;
    const trimmedInput = jsonInput.trim();

    if (!trimmedInput) {
      showMessage('Please provide content in the editor.', 'error');
      return;
    }

    if (requirePreviewApproval && !previewApproved) {
      showMessage('Preview approval is required before saving this pipeline content to the database.', 'error');
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
        setPreviewApproved(false);
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
    const baseUrl = `${PREVIEW_TARGET_BASE_URLS[previewTarget]}/start-learning/subtopic/${subtopicInfo.subtopicId}`;
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
      setPreviewApproved(false);
      setRightSidebarWidth('100vw');
      setIsRightSidebarOpen(true);
      showMessage('Loaded preview for component in Right Sidebar.', 'success');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`JSON parse error: ${errorMessage}. Correct it to preview.`, 'error');
    }
  };

  const approvePreview = () => {
    if (!previewData) {
      showMessage('Generate a component preview before approving.', 'error');
      return;
    }
    setPreviewApproved(true);
    showMessage('Preview approved. You can now save this section.', 'success');
  };

  return {
    handlePreview,
    approvePreview,
    isRightSidebarOpen,
    setIsRightSidebarOpen,
    setRightSidebarContent,
    setRightSidebarWidth,
    subtopicInfo,
    setSubtopicInfo,
    isSubtopicCreated,
    setIsSubtopicCreated,
    selectedSection,
    setSelectedSection,
    selectedSubsection,
    setSelectedSubsection,
    isFetchingSubsection,
    setIsFetchingSubsection,
    jsonInput,
    setJsonInput,
    sectionStatus,
    setSectionStatus,
    message,
    setMessage,
    messageType,
    setMessageType,
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
    setProcessedAsset,
    isProcessingAsset,
    setIsProcessingAsset,
    previewData,
    setPreviewData,
    previewApproved,
    requirePreviewApproval,
    previewTarget,
    setPreviewTarget,
    pipelinePayload,
    getPipelineEducationLabel: () => getRecordLabel(pipelinePayload?.educationalComponent, ['purpose', 'renderer', 'component_type']),
    getPipelineUiuxLabel: () => getRecordLabel(pipelinePayload?.uiuxComponent, ['layout_pattern', 'style_variant', 'renderer', 'component_type']),
    selectedSectionLabel,
    activeSpecs,
    showMessage,
    createSubtopic,
    loadSubtopic,
    fetchSubsection,
    validateJSON,
    processSvgAsset,
    injectAssetIntoJson,
    addSection,
    getPageUrl,
    openPreview
  };
}
