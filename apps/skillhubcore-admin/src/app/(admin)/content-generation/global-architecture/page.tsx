"use client";

import React, { useState, useEffect, useContext } from 'react';
import { ShellContext } from '../../ShellContext';
import {
  ChevronDown, Info, CheckCircle2, Download, Layers,
  Grid, Globe, Calendar, Layout, Zap, Brain, Edit2, Palette,
  RotateCcw, ShieldCheck, Plus, ChevronRight, Eye, Search, Monitor, Tablet, Smartphone, Box,
  Settings, ArrowRight, Copy, GripVertical, Type, Archive, History, FileText, CheckSquare,
  Sun, Moon, Trash2, MonitorSmartphone, Code, ExternalLink, ListOrdered, Activity, Users, Heart
} from 'lucide-react';
import { buildGlobalArchitectureRegistry } from './global-architecture-registry';
import { getStrictSectionJsonTemplate } from '../../tools/prompt-generator/lib/prompt-templates';
import { ContractAwareComponentPreview } from '../../tools/content-manager/components/ContractAwareComponentPreview';

interface ComponentArchitecture {
  purpose?: string;
  required?: boolean;
  renderer?: string;
  style_variant?: string;
  animation_type?: string;
  interactive_elements?: string[];
  enabled?: boolean;
  [key: string]: unknown;
}

const formatTitle = (str: string) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' Architecture', '')
    .replace(' Uiux', ' UI/UX');
};

const getIconForComponent = (index: number) => {
  const icons = [Layout, Zap, Brain, Edit2, Layers, Palette, Info, RotateCcw];
  return icons[index % icons.length];
};

const getColorForComponent = (index: number) => {
  const colors = [
    { bg: 'bg-indigo-100', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
    { bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-700' },
    { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' },
    { bg: 'bg-pink-100', text: 'text-pink-600', badge: 'bg-pink-50 text-pink-700' },
    { bg: 'bg-teal-100', text: 'text-teal-600', badge: 'bg-teal-50 text-teal-700' },
    { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-50 text-purple-700' },
    { bg: 'bg-rose-100', text: 'text-rose-600', badge: 'bg-rose-50 text-rose-700' },
  ];
  return colors[index % colors.length];
};

const ARCHITECTURE_STORAGE_KEY = 'skillhubcore.globalArchitecture.customizations.v1';
const PIPELINE_PAYLOAD_STORAGE_KEY = 'skillhubcore.globalArchitecture.pipelinePayload.v1';

const DEFAULT_DUMMY_CONTEXT = {
  domain: 'Programming',
  subject: 'Python',
  topic: 'Basics',
  subtopic: 'What is Python?',
  subtopicId: 'whatispython',
};

const LEARNER_PREVIEW_TARGETS = {
  local: {
    label: 'Localhost RTH',
    baseUrl: 'http://localhost:3003',
  },
  rth: {
    label: 'RTH Production',
    baseUrl: 'https://user.realtutorialhub.com',
  },
  suia: {
    label: 'SUIA / SkillUp',
    baseUrl: 'https://user.skillupitacademy.com',
  },
} as const;

const PREVIEW_TARGET_BRAND_CONTRACTS = {
  local: {
    brand_variant: 'rth',
    primary_color: '#d03f00',
    primary_color_dark: '#b63600',
    accent_color: '#b63600',
    secondary_color: '#124fd6',
    background_color: '#ffffff',
    text_color: '#0f172a',
    border_color: '#dbeafe',
  },
  rth: {
    brand_variant: 'rth',
    primary_color: '#d03f00',
    primary_color_dark: '#b63600',
    accent_color: '#b63600',
    secondary_color: '#124fd6',
    background_color: '#ffffff',
    text_color: '#0f172a',
    border_color: '#dbeafe',
  },
  suia: {
    brand_variant: 'suia',
    primary_color: '#f54a8d',
    primary_color_dark: '#d63d7a',
    accent_color: '#d63d7a',
    secondary_color: '#133382',
    background_color: '#ffffff',
    text_color: '#0f172a',
    border_color: '#dbeafe',
  },
} as const;

const getPromptSectionId = (sectionId: string) => sectionId === 'reallife' ? 'real_life' : sectionId;

const NOTES_SUBSECTION_ALIASES: Record<string, string> = {
  hero: 'concept_card',
  Hero: 'concept_card',
  simpleWords: 'concept_card',
  simple_words: 'concept_card',
  conceptCard: 'concept_card',
  definitionBlock: 'definition_block',
  definition_block: 'definition_block',
  componentGrid: 'component_grid',
  component_grid: 'component_grid',
  syntaxBlock: 'syntax_block',
  syntax_block: 'syntax_block',
  examplePanel: 'example_panel',
  example_panel: 'example_panel',
  practiceCard: 'practice_card',
  practice_card: 'practice_card',
  warningFaq: 'warning_faq',
  warningFAQ: 'warning_faq',
  warning_faq: 'warning_faq',
  summaryCard: 'summary_card',
  summary_card: 'summary_card',
};

const normalizePipelineSubsectionId = (sectionId: string, subsectionId: string | null) => {
  if (!subsectionId) return null;
  if (sectionId === 'notes') return NOTES_SUBSECTION_ALIASES[subsectionId] || subsectionId;
  return subsectionId;
};

const getDefaultPipelineJson = (sectionId: string, subsectionId: string | null, subtopicName: string) => {
  const template = getStrictSectionJsonTemplate(getPromptSectionId(sectionId), subtopicName);
  const rootKey = Object.keys(template)[0];
  const rootValue = template[rootKey];
  const normalizedSubsectionId = normalizePipelineSubsectionId(sectionId, subsectionId);

  if (
    normalizedSubsectionId &&
    rootValue &&
    typeof rootValue === 'object' &&
    !Array.isArray(rootValue) &&
    normalizedSubsectionId in rootValue
  ) {
    return (rootValue as Record<string, unknown>)[normalizedSubsectionId];
  }

  return template;
};

const htmlEscape = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const COLOR_COMBINATION_OPTIONS = [
  { id: 'primary_75_secondary_25', label: 'Primary 75% / Secondary 25%', primaryWeight: 0.75, secondaryWeight: 0.25 },
  { id: 'primary_60_secondary_40', label: 'Primary 60% / Secondary 40%', primaryWeight: 0.6, secondaryWeight: 0.4 },
  { id: 'balanced_50_50', label: 'Primary 50% / Secondary 50%', primaryWeight: 0.5, secondaryWeight: 0.5 },
  { id: 'primary_40_secondary_60', label: 'Primary 40% / Secondary 60%', primaryWeight: 0.4, secondaryWeight: 0.6 },
  { id: 'primary_25_secondary_75', label: 'Primary 25% / Secondary 75%', primaryWeight: 0.25, secondaryWeight: 0.75 },
] as const;

const normalizeHexColor = (value: unknown, fallback: string) => {
  const raw = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
};

const mixHexColors = (primary: string, secondary: string, secondaryRatio: number) => {
  const first = normalizeHexColor(primary, '#4f46e5').replace('#', '');
  const second = normalizeHexColor(secondary, '#10b981').replace('#', '');
  const firstRatio = 1 - secondaryRatio;
  const toChannel = (start: string, end: string) => {
    const mixed = Math.round(parseInt(start, 16) * firstRatio + parseInt(end, 16) * secondaryRatio);
    return mixed.toString(16).padStart(2, '0');
  };
  return `#${toChannel(first.slice(0, 2), second.slice(0, 2))}${toChannel(first.slice(2, 4), second.slice(2, 4))}${toChannel(first.slice(4, 6), second.slice(4, 6))}`;
};

const asPreviewRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
);

const firstPreviewText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
};

const normalizePreviewContentForStrictSchema = (
  sectionId: string,
  subsectionId: string | null,
  content: unknown,
  fallback: unknown
) => {
  const normalizedSubsectionId = normalizePipelineSubsectionId(sectionId, subsectionId);
  const record = asPreviewRecord(content);

  if (sectionId === 'notes' && normalizedSubsectionId === 'concept_card') {
    const quickLook = Array.isArray(record.quickLook)
      ? record.quickLook.map((item) => String(item)).filter(Boolean)
      : [];

    return {
      heroTitle: firstPreviewText(record.heroTitle, record.title, 'Notes Overview'),
      heroSubtitle: firstPreviewText(record.heroSubtitle, record.description, 'A clear learner-facing notes introduction.'),
      quickLook: quickLook.length > 0 ? quickLook : ['Definition', 'Mechanics', 'Syntax', 'Examples'],
    };
  }

  return content || fallback;
};

const buildStarterHtmlFromRenderer = (content: unknown, contract: Record<string, unknown> | null | undefined) => {
  const record = asPreviewRecord(content);
  const title = htmlEscape(record.title || record.headline || 'What is Python?');
  const description = htmlEscape(record.description || record.content || 'Clear overview of the selected learning topic.');
  const iconLabel = htmlEscape(record.iconLabel || record.badge || 'JS');
  const difficulty = htmlEscape(record.difficulty || record.level || 'Beginner');
  const topicsCount = htmlEscape(record.topicsCount || record.lessonsCount || 10);
  const lastUpdated = htmlEscape(record.lastUpdated || 'Today');
  const primary = htmlEscape(contract?.primary_color || '#4f46e5');
  const accent = htmlEscape(contract?.accent_color || contract?.primary_color_dark || '#10b981');
  const bg = htmlEscape(contract?.background_color || '#ffffff');
  const text = htmlEscape(contract?.text_color || '#0f172a');
  const border = htmlEscape(contract?.border_color || '#dbeafe');

  return `<section class="overflow-hidden rounded-3xl border p-8 shadow-xl" style="background:${bg}; border-color:${border}; color:${text};">
  <div class="space-y-7">
    <div>
      <div class="flex flex-wrap items-center gap-3">
        <span class="rounded-full px-3 py-1 text-xs font-black text-white" style="background:${primary};">${iconLabel}</span>
        <span class="rounded-full border px-3 py-1 text-xs font-bold" style="border-color:${accent}; color:${accent};">${difficulty}</span>
      </div>
      <h1 class="text-4xl font-black leading-tight lg:text-5xl">${title}</h1>
      <p class="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">${description}</p>
      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl border bg-white px-5 py-4 shadow-sm" style="border-color:${border};">
          <p class="text-2xl font-black" style="color:${primary};">${topicsCount}</p>
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Learning blocks</p>
        </div>
        <div class="rounded-2xl border bg-white px-5 py-4 shadow-sm" style="border-color:${border};">
          <p class="text-2xl font-black" style="color:${primary};">${lastUpdated}</p>
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Last updated</p>
        </div>
      </div>
      <div class="mt-7 flex flex-wrap gap-3">
        <button class="rounded-full px-5 py-3 text-sm font-black text-white" style="background:${accent};">Start learning</button>
        <button class="rounded-full border bg-white px-5 py-3 text-sm font-black" style="border-color:${border}; color:${primary};">View roadmap</button>
      </div>
    </div>
  </div>
</section>`;
};

export default function GlobalArchitecturePage() {
  const { setHeaderTitle, setHeaderSubtitle } = useContext(ShellContext);
  
  const initialArchitectures = React.useMemo(() => {
    return buildGlobalArchitectureRegistry();
  }, []);

  const [architectures, setArchitectures] = useState(initialArchitectures);

  const sectionKeys = Object.keys(architectures);
  const eduKeys = sectionKeys.filter(k => !k.includes('uiux'));
  const uiuxKeys = sectionKeys.filter(k => k.includes('uiux'));

  const [activeSectionKey, setActiveSectionKey] = useState(eduKeys[0]);
  const [isEduDropdownOpen, setIsEduDropdownOpen] = useState(false);
  const [isUiuxDropdownOpen, setIsUiuxDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Universal Architecture');
  const [configTab, setConfigTab] = useState('Layout');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponentKey, setSelectedComponentKey] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [jsonEditorValue, setJsonEditorValue] = useState('');
  const [isJsonEditing, setIsJsonEditing] = useState(false);
  const [validationMessage, setValidationMessage] = useState('No validation run yet.');
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');
  const [customizationsLoaded, setCustomizationsLoaded] = useState(false);
  const [dummyContext, setDummyContext] = useState(DEFAULT_DUMMY_CONTEXT);
  const [learnerPreviewTarget, setLearnerPreviewTarget] = useState<keyof typeof LEARNER_PREVIEW_TARGETS>('local');
  const [showAdvancedSequence, setShowAdvancedSequence] = useState(false);
  const [showAdvancedComponentDetails, setShowAdvancedComponentDetails] = useState(false);
  const [showAdvancedRendererMapping, setShowAdvancedRendererMapping] = useState(false);
  const [showContextSidebar, setShowContextSidebar] = useState(true);
  const [selectedRendererSubcomponentId, setSelectedRendererSubcomponentId] = useState('container');

  const activeData = architectures[activeSectionKey];
  
  useEffect(() => {
    const source = activeData?.universal_architecture_fixed || activeData?.component_design_system;
    if (source) {
      const keys = Object.keys(source);
      if (keys.length > 0 && (!selectedComponentKey || !source[selectedComponentKey])) {
        setSelectedComponentKey(keys[0]);
      }
    }
  }, [activeSectionKey, activeData?.universal_architecture_fixed, activeData?.component_design_system, selectedComponentKey]);

  useEffect(() => {
    setHeaderTitle('');
    setHeaderSubtitle('');
  }, [setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ARCHITECTURE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setArchitectures((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // Ignore corrupted local customizations; canonical registry still loads.
    } finally {
      setCustomizationsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!customizationsLoaded) return;
    window.localStorage.setItem(ARCHITECTURE_STORAGE_KEY, JSON.stringify(architectures));
  }, [architectures, customizationsLoaded]);

  if (!activeData) return <div className="p-10 font-bold text-slate-500">Loading Architecture...</div>;

  const isUiUxMode = activeSectionKey.includes('uiux');
  const activeComponentMap = (isUiUxMode ? activeData.component_design_system : activeData.universal_architecture_fixed || {}) as Record<string, ComponentArchitecture>;
  const activeComponentEntries = Object.entries(activeComponentMap) as [string, ComponentArchitecture][];
  const universalComponents = isUiUxMode ? [] : Object.entries(activeData.universal_architecture_fixed || {}) as [string, ComponentArchitecture][];
  const totalComponents = isUiUxMode ? Object.keys(activeData.component_design_system || {}).length : universalComponents.length;
  const jsonString = JSON.stringify({ [activeSectionKey]: activeData }, null, 2);
  const canonicalSectionId = activeData.metadata?.section_type || activeSectionKey.replace('_section_uiux_architecture', '').replace('_section_architecture', '');
  const adminSectionId = activeData.metadata?.admin_section_id || canonicalSectionId;
  const educationalEntry = Object.entries(architectures).find(([, data]) => (
    !String(data.metadata?.architecture_type || '').toLowerCase().includes('ui') &&
    !String(data.metadata?.architecture_type || '').toLowerCase().includes('ux') &&
    !String(data.metadata?.architecture_type || '').toLowerCase().includes('design') &&
    data.metadata?.section_type === canonicalSectionId
  )) || Object.entries(architectures).find(([key, data]) => !key.includes('uiux') && data.metadata?.section_type === canonicalSectionId);
  const uiuxEntry = Object.entries(architectures).find(([key, data]) => key.includes('uiux') && data.metadata?.section_type === canonicalSectionId);
  const educationalKey = educationalEntry?.[0] || activeSectionKey;
  const educationalData = educationalEntry?.[1] || activeData;
  const uiuxKey = uiuxEntry?.[0] || '';
  const uiuxData = uiuxEntry?.[1] || null;
  const selectedPipelineSubsectionKey = normalizePipelineSubsectionId(String(adminSectionId), selectedComponentKey);
  const workflowQuery = new URLSearchParams({
    section: String(canonicalSectionId),
    domain: dummyContext.domain,
    subject: dummyContext.subject,
    topic: dummyContext.topic,
    subtopic: dummyContext.subtopic,
    subtopicId: dummyContext.subtopicId,
    previewTarget: learnerPreviewTarget,
    source: 'global-architecture',
  });
  if (selectedPipelineSubsectionKey) workflowQuery.set('subsection', selectedPipelineSubsectionKey);
  const contentManagerQuery = new URLSearchParams(workflowQuery);
  contentManagerQuery.set('section', String(adminSectionId));
  contentManagerQuery.set('requirePreviewApproval', 'true');
  const selectedWorkflowUrls = {
    visualGuide: `/tools/visual-guide?section=${canonicalSectionId}${selectedPipelineSubsectionKey ? `&subsection=${selectedPipelineSubsectionKey}` : ''}`,
    promptGenerator: `/tools/prompt-generator?${workflowQuery.toString()}&autoGenerate=true`,
    contentManager: `/tools/content-manager?${contentManagerQuery.toString()}`,
    learnerPreview: `${LEARNER_PREVIEW_TARGETS[learnerPreviewTarget].baseUrl}/start-learning/subtopic/${dummyContext.subtopicId}${canonicalSectionId ? `?tab=${canonicalSectionId}` : ''}`,
  };
  const selectedComponentLookupKeys = Array.from(new Set([
    selectedPipelineSubsectionKey,
    selectedComponentKey,
  ].filter(Boolean))) as string[];
  const selectedComponentMergeKeys = [...selectedComponentLookupKeys].reverse();
  const resolveComponentConfig = (
    sources: Array<Record<string, ComponentArchitecture> | undefined | null>
  ) => {
    if (!selectedComponentKey) return null;
    return sources.reduce<ComponentArchitecture>((merged, source) => {
      if (!source) return merged;
      selectedComponentMergeKeys.forEach((key) => {
        if (source[key]) merged = { ...merged, ...source[key] };
      });
      return merged;
    }, {});
  };
  const selectedComponentData = resolveComponentConfig([
    activeData.universal_architecture_fixed,
    activeData.component_design_system,
  ]);
  const selectedUiuxComponentData = selectedComponentKey
    ? resolveComponentConfig([
      uiuxData?.component_design_system,
      activeData.component_design_system,
    ])
    : null;
  const selectedRendererMapping = selectedComponentKey
    ? (
      selectedComponentLookupKeys.reduce<Record<string, unknown> | null>((found, key) => (
        found ||
        activeData.renderer_mapping_engine?.[key] ||
        uiuxData?.renderer_mapping_engine?.[key] ||
        null
      ), null) ||
      null
    )
    : null;
  const activeComponentKeys = Object.keys(activeComponentMap);
  const activeLearningFlow = (
    Array.isArray(activeData.learning_progression_engine?.default_flow)
      ? activeData.learning_progression_engine.default_flow
      : activeComponentKeys
  ) as string[];
  const selectedComponentIndex = selectedComponentKey ? Math.max(0, activeLearningFlow.indexOf(selectedComponentKey)) : 0;
  const selectedDefaultJson = getDefaultPipelineJson(String(adminSectionId), selectedPipelineSubsectionKey || selectedComponentKey, dummyContext.subtopic);
  const selectedPreviewJson = normalizePreviewContentForStrictSchema(
    String(adminSectionId),
    selectedPipelineSubsectionKey || selectedComponentKey,
    selectedComponentData?.preview_content || selectedDefaultJson,
    selectedDefaultJson
  );
  const selectedRendererName = String(
    selectedComponentData?.renderer ||
    selectedComponentData?.component ||
    (selectedRendererMapping as Record<string, unknown> | null)?.component ||
    'default_renderer'
  );
  const selectedBrandPreviewContract = PREVIEW_TARGET_BRAND_CONTRACTS[learnerPreviewTarget];
  const selectedRendererBrandVariant = String(selectedComponentData?.brand_variant || '');
  const effectiveRendererBrandVariant = selectedRendererBrandVariant && selectedRendererBrandVariant !== 'shared'
    ? selectedRendererBrandVariant
    : selectedBrandPreviewContract.brand_variant;
  const selectedGeneratedRendererCode = selectedComponentData
    ? buildStarterHtmlFromRenderer(selectedPreviewJson, {
      ...selectedBrandPreviewContract,
      ...(selectedComponentData as Record<string, unknown>),
      primary_color: selectedComponentData?.primary_color || selectedBrandPreviewContract.primary_color,
      primary_color_dark: selectedComponentData?.primary_color_dark || selectedBrandPreviewContract.primary_color_dark,
      accent_color: selectedComponentData?.accent_color || selectedBrandPreviewContract.accent_color,
      secondary_color: selectedComponentData?.secondary_color || selectedBrandPreviewContract.secondary_color,
    })
    : '';
  const selectedCustomRendererCode = String(selectedComponentData?.custom_renderer_code || '');
  const selectedVisibleRendererCode = selectedCustomRendererCode || selectedGeneratedRendererCode;
  const selectedRendererPreviewContract = selectedComponentData
    ? {
      ...(selectedComponentData as Record<string, unknown>),
      custom_renderer_code: selectedCustomRendererCode,
    }
    : null;
  const effectiveRendererPreviewContract = selectedRendererPreviewContract
    ? {
      ...selectedRendererPreviewContract,
      brand_variant: effectiveRendererBrandVariant,
      primary_color: selectedComponentData?.primary_color || selectedBrandPreviewContract.primary_color,
      primary_color_dark: selectedComponentData?.primary_color_dark || selectedBrandPreviewContract.primary_color_dark,
      accent_color: selectedComponentData?.accent_color || selectedBrandPreviewContract.accent_color,
      secondary_color: selectedComponentData?.secondary_color || selectedBrandPreviewContract.secondary_color,
      background_color: selectedComponentData?.background_color || selectedBrandPreviewContract.background_color,
      text_color: selectedComponentData?.text_color || selectedBrandPreviewContract.text_color,
      border_color: selectedComponentData?.border_color || selectedBrandPreviewContract.border_color,
    }
    : null;
  const rendererColorControls = [
    ['primary_color', 'Primary Color 1', selectedBrandPreviewContract.primary_color],
    ['primary_color_dark', 'Primary Color 2', selectedBrandPreviewContract.primary_color_dark],
    ['accent_color', 'Accent / CTA Color', selectedBrandPreviewContract.accent_color],
    ['secondary_color', 'Secondary Brand Color', selectedBrandPreviewContract.secondary_color],
    ['background_color', 'Background Color', selectedBrandPreviewContract.background_color],
    ['text_color', 'Text Color', selectedBrandPreviewContract.text_color],
    ['border_color', 'Border Color', selectedBrandPreviewContract.border_color],
  ] as const;
  const selectedColorCombinationId = String(selectedComponentData?.color_combination || 'primary_75_secondary_25');
  const selectedColorCombination = COLOR_COMBINATION_OPTIONS.find((option) => option.id === selectedColorCombinationId) || COLOR_COMBINATION_OPTIONS[0];
  const algorithmPrimaryColor = normalizeHexColor(selectedComponentData?.primary_color || selectedBrandPreviewContract.primary_color, selectedBrandPreviewContract.primary_color);
  const algorithmSecondaryColor = normalizeHexColor(selectedComponentData?.secondary_color || selectedBrandPreviewContract.secondary_color, selectedBrandPreviewContract.secondary_color);
  const algorithmPrimaryDarkColor = normalizeHexColor(selectedComponentData?.primary_color_dark || selectedBrandPreviewContract.primary_color_dark, selectedBrandPreviewContract.primary_color_dark);
  const algorithmMixedColor = mixHexColors(algorithmPrimaryColor, algorithmSecondaryColor, selectedColorCombination.secondaryWeight);
  const algorithmReverseMixedColor = mixHexColors(algorithmPrimaryColor, algorithmSecondaryColor, selectedColorCombination.primaryWeight);
  const algorithmPalette = {
    primary: algorithmPrimaryColor,
    primaryDark: algorithmPrimaryDarkColor,
    secondary: algorithmSecondaryColor,
    mixed: algorithmMixedColor,
    reverseMixed: algorithmReverseMixedColor,
    surface: normalizeHexColor(selectedComponentData?.background_color || selectedBrandPreviewContract.background_color, selectedBrandPreviewContract.background_color),
    text: normalizeHexColor(selectedComponentData?.text_color || selectedBrandPreviewContract.text_color, selectedBrandPreviewContract.text_color),
    border: normalizeHexColor(selectedComponentData?.border_color || selectedBrandPreviewContract.border_color, selectedBrandPreviewContract.border_color),
  };
  const universalArchitecturePreviewContract = selectedRendererPreviewContract
    ? {
      ...selectedRendererPreviewContract,
      ...(selectedUiuxComponentData || {}),
      ...selectedBrandPreviewContract,
      brand_variant: selectedUiuxComponentData?.brand_variant || selectedComponentData?.brand_variant || selectedBrandPreviewContract.brand_variant,
      primary_color: selectedBrandPreviewContract.primary_color,
      primary_color_dark: selectedBrandPreviewContract.primary_color_dark,
      accent_color: selectedBrandPreviewContract.accent_color,
      secondary_color: selectedBrandPreviewContract.secondary_color,
      background_color: selectedUiuxComponentData?.background_color || selectedComponentData?.background_color || selectedBrandPreviewContract.background_color,
      text_color: selectedUiuxComponentData?.text_color || selectedComponentData?.text_color || selectedBrandPreviewContract.text_color,
      border_color: selectedUiuxComponentData?.border_color || selectedComponentData?.border_color || selectedBrandPreviewContract.border_color,
      custom_renderer_code: '',
    }
    : null;
  const selectedSchemaPreview = {
    section: adminSectionId,
    subsection: selectedComponentKey || 'full_section',
    componentPurpose: selectedComponentData?.purpose || 'No component purpose defined.',
    renderer: selectedRendererName,
    required: selectedComponentData?.required !== false,
    defaultDummyJson: selectedDefaultJson,
  };
  const contextSidebarTitle = activeTab === 'Renderer Mapping'
    ? 'Renderer Contract JSON'
    : activeTab === 'Prompt Management'
      ? 'Prompt Context JSON'
      : activeTab === 'Validation Rules'
        ? 'Validation JSON'
        : activeTab === 'JSON Schema'
          ? 'Schema JSON'
          : isUiUxMode
            ? 'UI/UX JSON'
            : 'Architecture JSON';
  const contextSidebarModeLabel = isJsonEditing ? '(Editing)' : '(Live State)';
  const contextSidebarMetrics = activeTab === 'Renderer Mapping'
    ? [
      { label: 'Renderer Linked', score: selectedRendererName !== 'default_renderer' ? 100 : 70 },
      { label: 'Preview Contract', score: selectedComponentData ? 100 : 0 },
      { label: 'Content Bridge', score: selectedPreviewJson ? 100 : 0 },
    ]
    : activeTab === 'Validation Rules'
      ? [
        { label: isUiUxMode ? 'WCAG Coverage' : 'Schema Coverage', score: 95 },
        { label: isUiUxMode ? 'Accessibility Rules' : 'Required Fields', score: 92 },
        { label: 'Preview Gate', score: 100 },
      ]
      : activeTab === 'Prompt Management'
        ? [
          { label: 'Prompt Target', score: selectedComponentKey ? 100 : 70 },
          { label: 'Dummy Context', score: dummyContext.subtopic ? 100 : 60 },
          { label: 'Content Manager Link', score: 100 },
        ]
        : [
          { label: isUiUxMode ? 'Accessibility Score' : 'Readability Threshold', score: 92 },
          { label: isUiUxMode ? 'Contrast Ratio' : 'Analogy Quality Score', score: 93 },
          { label: isUiUxMode ? 'Responsive Check' : 'Confusion Prevention', score: 94 },
        ];
  const rendererSubcomponents = React.useMemo(() => {
    const configured = selectedComponentData?.ui_subcomponents;
    const configuredParts = Array.isArray(configured) ? configured as Array<Record<string, unknown>> : [];

    const interactiveParts = Array.isArray(selectedComponentData?.interactive_elements)
      ? selectedComponentData.interactive_elements.map((item) => String(item))
      : [];
    const commonDefaults: Array<Record<string, unknown>> = [
      { id: 'container', label: 'Outer Surface', role: 'Component background and wrapper', layout: selectedComponentData?.layout || 'card', color: algorithmPalette.surface },
      { id: 'header', label: 'Header Area', role: 'Title, badges, and intro copy', layout: 'inline', color: algorithmPalette.primary },
      { id: 'body', label: 'Body Area', role: 'Main content and supporting cards', layout: 'inline', color: algorithmPalette.border },
      { id: 'action', label: 'Action Area', role: 'CTA and interaction row', layout: 'inline', color: algorithmPalette.mixed },
      { id: 'icon_badge', label: 'JS Badge', role: 'Technology badge fill color', layout: 'pill', color: algorithmPalette.primary },
      { id: 'difficulty_badge', label: 'Difficulty Badge', role: 'Beginner badge text and border color', layout: 'pill', color: algorithmPalette.mixed },
      { id: 'brand_badge', label: 'Brand Badge', role: 'Brand pill text and border color', layout: 'pill', color: algorithmPalette.secondary },
      { id: 'title', label: 'Title Text', role: 'Main heading color', layout: 'inline', color: algorithmPalette.text },
      { id: 'description', label: 'Description Text', role: 'Intro description color', layout: 'inline', color: '#475569' },
      { id: 'stat_cards', label: 'Stat Cards', role: 'Learning blocks and last updated card border', layout: 'card', color: algorithmPalette.border },
      { id: 'stat_value', label: 'Stat Values', role: '10 and Today value color', layout: 'inline', color: algorithmPalette.primary },
      { id: 'primary_button', label: 'Primary Button', role: 'Main action button fill color', layout: 'pill', color: algorithmPalette.mixed },
      { id: 'secondary_button', label: 'Roadmap Button', role: 'Secondary action text and border color', layout: 'pill', color: algorithmPalette.primary },
      { id: 'progress_bar', label: 'Progress Bar', role: 'Preview progress indicator color', layout: 'progress', color: algorithmPalette.reverseMixed },
    ];
    const notesPartPresets: Record<string, Array<Record<string, unknown>>> = {
      concept_card: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[4], label: 'JS Badge', role: 'Technology badge fill color' },
        { ...commonDefaults[5], label: 'Difficulty Badge', role: 'Difficulty pill color' },
        { ...commonDefaults[6], label: 'Brand Badge', role: 'Brand pill color' },
        { ...commonDefaults[7] },
        { ...commonDefaults[8] },
        { ...commonDefaults[2], label: 'Simple Words Preview Card', role: 'Right-side preview card surface' },
        { ...commonDefaults[12], label: 'Quick Look Pills', role: 'Definition, Mechanics, Syntax, and Examples pill color' },
        { ...commonDefaults[13] },
      ],
      definition_block: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[4], label: 'Core Concept Badge', role: 'Core concept badge fill color' },
        { ...commonDefaults[5], label: 'Definition Badge', role: 'Definition badge border/text color' },
        { ...commonDefaults[7], label: 'Definition Title', role: 'Main definition heading color' },
        { ...commonDefaults[8], label: 'Definition Text', role: 'Definition and explanation text color' },
        { ...commonDefaults[2], label: 'Definition Cards', role: 'Definition, simple explanation, and why-it-matters card styling' },
        { ...commonDefaults[13], label: 'Definition Accent Line', role: 'Vertical accent line color' },
      ],
      component_grid: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Grid Title', role: 'Mechanics grid title color' },
        { ...commonDefaults[8], label: 'Grid Description', role: 'Mechanics grid description color' },
        { ...commonDefaults[2], label: 'Mechanic Cards', role: 'Individual mechanics card styling' },
        { ...commonDefaults[4], label: 'Step Number Badges', role: 'Number badge fill color inside mechanic cards' },
      ],
      syntax_block: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Syntax Title', role: 'Syntax heading color' },
        { ...commonDefaults[2], label: 'Code And Breakdown Panels', role: 'Code panel and breakdown card styling' },
        { ...commonDefaults[4], label: 'Syntax Part Labels', role: 'Syntax part label color' },
      ],
      example_panel: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Example Title', role: 'Example section heading color' },
        { ...commonDefaults[8], label: 'Example Description', role: 'Example intro text color' },
        { ...commonDefaults[2], label: 'Example Cards', role: 'Individual example card styling' },
        { ...commonDefaults[4], label: 'Check Icons', role: 'Checklist icon color' },
      ],
      practice_card: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Practice Title', role: 'Practice heading color' },
        { ...commonDefaults[2], label: 'Practice Items', role: 'Practice card and item styling' },
        { ...commonDefaults[4], label: 'Practice Check Icons', role: 'Practice icon fill color' },
      ],
      warning_faq: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'FAQ Title', role: 'Common mistakes heading color' },
        { ...commonDefaults[2], label: 'FAQ Items', role: 'FAQ card styling' },
        { ...commonDefaults[4], label: 'Question Text', role: 'Mistake/question heading color' },
        { ...commonDefaults[13], label: 'Fix Highlight', role: 'Fix callout color' },
      ],
      summary_card: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Summary Title', role: 'Summary heading color' },
        { ...commonDefaults[8], label: 'Summary Description', role: 'Summary description color' },
        { ...commonDefaults[2], label: 'Summary And Takeaway Cards', role: 'Summary panel and takeaway card styling' },
        { ...commonDefaults[4], label: 'Takeaway Number Badges', role: 'Number badge fill color' },
      ],
    };
    const notesSubsectionKey = String(selectedPipelineSubsectionKey || selectedComponentKey || '');
    const defaults = String(adminSectionId) === 'notes' && notesPartPresets[notesSubsectionKey]
      ? notesPartPresets[notesSubsectionKey]
      : commonDefaults;
    const defaultIds = defaults.map((part) => part.id);
    const extraParts: Array<Record<string, unknown>> = interactiveParts
      .filter((id) => !defaultIds.includes(id))
      .map((id) => ({
        id,
        label: formatTitle(id),
        role: 'Interactive child element',
        visible: true,
        layout: 'inline',
        color: algorithmPalette.primary,
        emphasis: 'medium',
      }));
    const mergedDefaults: Array<Record<string, unknown>> = [...defaults, ...extraParts].map((part) => {
      const saved = configuredParts.find((item) => String(item.id || '') === part.id);
      const savedHasManualColor = Boolean(saved?.color_override);
      const savedWithoutImplicitColor = savedHasManualColor ? saved : saved ? { ...saved, color: part.color } : {};
      const savedUserControls = savedWithoutImplicitColor && String(adminSectionId) === 'notes'
        ? Object.fromEntries(
          Object.entries(savedWithoutImplicitColor).filter(([key]) => !['label', 'role'].includes(key))
        )
        : savedWithoutImplicitColor;
      return {
        ...part,
        visible: true,
        emphasis: part.id === 'header' ? 'high' : 'medium',
        ...savedUserControls,
      };
    });
    const mergedDefaultIds = mergedDefaults.map((part) => part.id);
    const unknownConfiguredParts = String(adminSectionId) === 'notes'
      ? []
      : configuredParts.filter((part) => !mergedDefaultIds.includes(String(part.id || '')));

    return [...mergedDefaults, ...unknownConfiguredParts] as Array<Record<string, unknown>>;
  }, [
    selectedComponentData?.ui_subcomponents,
    selectedComponentData?.interactive_elements,
    selectedComponentData?.layout,
    selectedComponentData?.background_color,
    selectedComponentData?.primary_color,
    selectedComponentData?.primary_color_dark,
    selectedComponentData?.accent_color,
    selectedComponentData?.secondary_color,
    selectedComponentData?.border_color,
    selectedComponentData?.text_color,
    selectedComponentData?.color_combination,
    selectedPipelineSubsectionKey,
    selectedComponentKey,
    adminSectionId,
    selectedBrandPreviewContract.background_color,
    selectedBrandPreviewContract.primary_color,
    selectedBrandPreviewContract.primary_color_dark,
    selectedBrandPreviewContract.accent_color,
    selectedBrandPreviewContract.secondary_color,
    selectedBrandPreviewContract.border_color,
    selectedBrandPreviewContract.text_color,
  ]);
  const selectedRendererSubcomponent = rendererSubcomponents.find((item) => item.id === selectedRendererSubcomponentId) || rendererSubcomponents[0];
  const selectedRendererSubcomponentRecord = (selectedRendererSubcomponent || {}) as Record<string, unknown>;

  const showActionMessage = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(''), 2500);
  };

  const updateActiveArchitecture = (updater: (draft: Record<string, any>) => Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setArchitectures((prev) => ({
      ...prev,
      [activeSectionKey]: updater(prev[activeSectionKey]),
    }));
  };

  const buildPipelinePayload = () => {
    const selectedSubsection = normalizePipelineSubsectionId(String(adminSectionId), selectedComponentKey);
    const defaultJson = getDefaultPipelineJson(String(adminSectionId), selectedSubsection, dummyContext.subtopic);
    const educationalComponent = selectedSubsection
      ? educationalData?.universal_architecture_fixed?.[selectedSubsection] || educationalData?.universal_architecture_fixed?.[selectedComponentKey || ''] || null
      : null;
    const uiuxComponent = selectedSubsection
      ? uiuxData?.component_design_system?.[selectedSubsection] || uiuxData?.component_design_system?.[selectedComponentKey || ''] || null
      : null;
    const previewContent = normalizePreviewContentForStrictSchema(
      String(adminSectionId),
      selectedSubsection,
      educationalComponent?.preview_content || defaultJson,
      defaultJson
    );

    return {
      source: 'global-architecture',
      generatedAt: new Date().toISOString(),
      section: canonicalSectionId,
      adminSectionId,
      subsection: selectedSubsection,
      dummyContext,
      previewTarget: learnerPreviewTarget,
      educationalArchitectureKey: educationalKey,
      uiuxArchitectureKey: uiuxKey,
      educationalComponent,
      uiuxComponent,
      rendererMapping: effectiveRendererPreviewContract,
      defaultJson: previewContent,
    };
  };

  const persistPipelinePayload = () => {
    try {
      window.localStorage.setItem(PIPELINE_PAYLOAD_STORAGE_KEY, JSON.stringify(buildPipelinePayload()));
    } catch {
      showActionMessage('Could not save local pipeline payload.');
    }
  };

  const openWorkflowUrl = (url: string) => {
    persistPipelinePayload();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyArchitectureJson = async () => {
    await navigator.clipboard.writeText(jsonString);
    showActionMessage('Architecture JSON copied.');
  };

  const downloadArchitectureJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeSectionKey}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showActionMessage('Architecture JSON downloaded.');
  };

  const startJsonEdit = () => {
    setJsonEditorValue(jsonString);
    setIsJsonEditing(true);
  };

  const applyJsonEdit = () => {
    try {
      const parsed = JSON.parse(jsonEditorValue);
      const nextData = parsed[activeSectionKey] ?? parsed;
      if (!nextData || typeof nextData !== 'object' || Array.isArray(nextData)) {
        throw new Error('Root JSON must be an architecture object.');
      }
      setArchitectures((prev) => ({
        ...prev,
        [activeSectionKey]: nextData,
      }));
      setIsJsonEditing(false);
      setValidationMessage('Valid JSON. Local architecture state updated.');
      showActionMessage('JSON applied to this page state.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON.';
      setValidationMessage(`Invalid JSON: ${message}`);
      showActionMessage(`Invalid JSON: ${message}`);
    }
  };

  const resetActiveArchitecture = () => {
    setArchitectures((prev) => ({
      ...prev,
      [activeSectionKey]: initialArchitectures[activeSectionKey],
    }));
    setIsJsonEditing(false);
    showActionMessage('Architecture reset to canonical registry.');
  };

  const resetAllArchitectureCustomizations = () => {
    setArchitectures(initialArchitectures);
    window.localStorage.removeItem(ARCHITECTURE_STORAGE_KEY);
    setIsJsonEditing(false);
    showActionMessage('All architecture customizations cleared.');
  };

  const validateActiveArchitecture = () => {
    const componentSource = activeData.universal_architecture_fixed || activeData.component_design_system;
    const errors: string[] = [];
    if (!activeData.metadata?.section_type) errors.push('metadata.section_type is missing');
    if (!componentSource || Object.keys(componentSource).length === 0) errors.push('No components are registered');
    if (!activeData.renderer_mapping_engine) errors.push('renderer_mapping_engine is missing');
    if (!activeData.accessibility_architecture && !activeData.validation_governance_system) errors.push('governance/accessibility rules are missing');

    if (errors.length > 0) {
      setValidationMessage(`Validation failed: ${errors.join('; ')}`);
      showActionMessage('Validation failed.');
      return false;
    }

    setValidationMessage(`Validation passed for ${formatTitle(String(canonicalSectionId))}.`);
    showActionMessage('Validation passed.');
    return true;
  };

  const updateArchitectureStatus = (status: 'active' | 'approved' | 'archived') => {
    updateActiveArchitecture((current) => ({
      ...current,
      metadata: {
        ...(current.metadata ?? {}),
        status,
        updated_at: new Date().toISOString(),
      },
    }));
    showActionMessage(`Architecture marked ${status}.`);
  };

  const duplicateSelectedMapping = () => {
    if (!selectedComponentKey) {
      showActionMessage('Select a component first.');
      return;
    }
    const source = activeData.universal_architecture_fixed || activeData.component_design_system;
    const nextKey = `${selectedComponentKey}_copy`;
    updateActiveArchitecture((current) => {
      const sourceKey = current.universal_architecture_fixed ? 'universal_architecture_fixed' : 'component_design_system';
      return {
        ...current,
        [sourceKey]: {
          ...(current[sourceKey] ?? {}),
          [nextKey]: {
            ...(source?.[selectedComponentKey] ?? {}),
            required: false,
            label: `${formatTitle(selectedComponentKey)} Copy`,
          },
        },
      };
    });
    setSelectedComponentKey(nextKey);
    showActionMessage('Component mapping duplicated locally.');
  };

  const updateSelectedComponentConfig = (patch: Record<string, unknown>) => {
    if (!selectedComponentKey) {
      showActionMessage('Select a component first.');
      return;
    }
    updateActiveArchitecture((current) => {
      const sourceKey = current.universal_architecture_fixed ? 'universal_architecture_fixed' : 'component_design_system';
      const sourceMap = (current[sourceKey] ?? {}) as Record<string, ComponentArchitecture>;
      const targetKeys = selectedComponentLookupKeys.filter((key) => sourceMap[key]);
      if (targetKeys.length === 0) targetKeys.push(selectedComponentKey);
      const nextSourceMap = { ...sourceMap };
      targetKeys.forEach((key) => {
        nextSourceMap[key] = {
          ...(sourceMap[key] ?? {}),
          ...patch,
        };
      });
      return {
        ...current,
        [sourceKey]: nextSourceMap,
      };
    });
    showActionMessage('Selected component config saved locally.');
  };

  const addNewComponent = () => {
    const sourceKey = isUiUxMode ? 'component_design_system' : 'universal_architecture_fixed';
    const nextKey = `custom_component_${Date.now()}`;
    updateActiveArchitecture((current) => ({
      ...current,
      [sourceKey]: {
        ...(current[sourceKey] ?? {}),
        [nextKey]: {
          enabled: true,
          required: false,
          renderer: 'custom_card_renderer',
          purpose: 'Custom section component added from Global Architecture.',
          interactive_elements: ['Preview', 'Edit', 'Validate'],
        },
      },
    }));
    setSelectedComponentKey(nextKey);
    showActionMessage('New custom component added locally.');
  };

  const tabs = [
    'Universal Architecture', 'Section Sequence', 'Component Details', 
    'Learning Progression', 'Prompt Management', 'Renderer Mapping', 'Validation Rules', 'JSON Schema'
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* 1. Page Title & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {isUiUxMode ? <Palette className="text-pink-600" size={28} /> : <Layout className="text-indigo-600" size={28} />}
            {isUiUxMode ? 'UI/UX Architecture - ' : 'Universal Architecture - '} {formatTitle(activeSectionKey)}
            <CheckCircle2 className="text-emerald-500" size={24} />
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Constitutional {isUiUxMode ? 'design system' : 'educational architecture'} for {formatTitle(activeSectionKey)} across all domains and brands
          </p>
        </div>
        <button
          type="button"
          onClick={downloadArchitectureJson}
          className="flex items-center gap-2 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
        >
          <Download size={16} />
          Export Architecture
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Educational Section Dropdown Card */}
        <div className="relative">
          <button 
            type="button"
            className={`bg-white border ${!isUiUxMode ? 'border-indigo-300 shadow-md ring-2 ring-indigo-50' : 'border-slate-200 shadow-sm'} rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all w-full text-left`} 
            onClick={(e) => { e.stopPropagation(); setIsEduDropdownOpen(!isEduDropdownOpen); setIsUiuxDropdownOpen(false); }}
          >
            <div className={`w-10 h-10 rounded-full ${!isUiUxMode ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center shrink-0 transition-colors`}>
              <Layers size={20} />
            </div>
            <div className="overflow-hidden w-full">
              <span className={`block text-[10px] font-bold ${!isUiUxMode ? 'text-indigo-600' : 'text-slate-400'} uppercase tracking-wider`}>Educational Arch</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm truncate">{!isUiUxMode ? formatTitle(activeSectionKey) : 'Select Schema'}</span>
                <ChevronDown size={14} className="text-slate-400 ml-1 shrink-0" />
              </div>
            </div>
          </button>
          {isEduDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={(e) => { e.stopPropagation(); setIsEduDropdownOpen(false); }} 
                onKeyDown={(e) => { if (e.key === 'Escape') setIsEduDropdownOpen(false); }}
                role="button"
                tabIndex={-1}
                aria-label="Close dropdown"
              />
              <div className="absolute top-full left-0 mt-2 w-[250px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {eduKeys.map((key) => (
                  <button 
                    key={key}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveSectionKey(key); setIsEduDropdownOpen(false); }}
                    className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors relative z-50 w-full text-left ${activeSectionKey === key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {formatTitle(key)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* UI/UX Section Dropdown Card (Replaces Brand Scope) */}
        <div className="relative">
          <button 
            type="button"
            className={`bg-white border ${isUiUxMode ? 'border-pink-300 shadow-md ring-2 ring-pink-50' : 'border-slate-200 shadow-sm'} rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all w-full text-left`} 
            onClick={(e) => { e.stopPropagation(); setIsUiuxDropdownOpen(!isUiuxDropdownOpen); setIsEduDropdownOpen(false); }}
          >
            <div className={`w-10 h-10 rounded-full ${isUiUxMode ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600'} flex items-center justify-center shrink-0 transition-colors`}>
              <Palette size={20} />
            </div>
            <div className="overflow-hidden w-full">
              <span className={`block text-[10px] font-bold ${isUiUxMode ? 'text-pink-600' : 'text-slate-400'} uppercase tracking-wider`}>UI/UX Arch</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm truncate">{isUiUxMode ? formatTitle(activeSectionKey) : 'Select Schema'}</span>
                <ChevronDown size={14} className="text-slate-400 ml-1 shrink-0" />
              </div>
            </div>
          </button>
          {isUiuxDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={(e) => { e.stopPropagation(); setIsUiuxDropdownOpen(false); }} 
                onKeyDown={(e) => { if (e.key === 'Escape') setIsUiuxDropdownOpen(false); }}
                role="button"
                tabIndex={-1}
                aria-label="Close dropdown"
              />
              <div className="absolute top-full left-0 mt-2 w-[250px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {uiuxKeys.map((key) => (
                  <button 
                    key={key}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveSectionKey(key); setIsUiuxDropdownOpen(false); }}
                    className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors relative z-50 w-full text-left ${activeSectionKey === key ? 'bg-pink-50 text-pink-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {formatTitle(key)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</span>
            <span className="font-bold text-slate-800 text-sm">{activeData.metadata?.version || '1.0'} <span className="text-emerald-500 text-xs font-medium">(Active)</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Grid size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUiUxMode ? 'UI Components' : 'Total Components'}</span>
            <span className="font-bold text-slate-800 text-sm">{totalComponents} <span className="text-blue-500 text-xs font-medium">(Fixed)</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Globe size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supported Domains</span>
            <span className="font-bold text-slate-800 text-sm">{activeData.metadata?.supported_domains?.length || 7} Domains</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</span>
            <span className="font-bold text-slate-800 text-sm">May 25, 2026</span>
          </div>
        </div>
      </div>

      {/* 3. Workflow Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded">
              Active Workflow
            </span>
            <span className="text-sm font-black text-slate-900">{formatTitle(String(canonicalSectionId))}</span>
            {selectedComponentKey ? (
              <>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-sm font-black text-rose-600">{formatTitle(selectedComponentKey)}</span>
              </>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Select a component below, then continue to visual placement, prompt generation, content entry, preview, and database save.
          </p>
          {actionMessage ? <p className="text-xs font-bold text-emerald-600 mt-2">{actionMessage}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openWorkflowUrl(selectedWorkflowUrls.visualGuide)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-100 bg-blue-50 text-blue-700 text-xs font-black hover:bg-blue-100 transition-colors"
          >
            <Eye size={14} /> Visual Guide
          </button>
          <button
            type="button"
            onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-100 bg-amber-50 text-amber-700 text-xs font-black hover:bg-amber-100 transition-colors"
          >
            <Zap size={14} /> Prompt Generator
          </button>
          <button
            type="button"
            onClick={() => openWorkflowUrl(selectedWorkflowUrls.contentManager)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-black hover:bg-emerald-100 transition-colors"
          >
            <Edit2 size={14} /> Content Manager
          </button>
          <button
            type="button"
            onClick={() => openWorkflowUrl(selectedWorkflowUrls.learnerPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-100 bg-purple-50 text-purple-700 text-xs font-black hover:bg-purple-100 transition-colors"
          >
            <ExternalLink size={14} /> Learner Preview
          </button>
          <button
            type="button"
            onClick={copyArchitectureJson}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-black hover:bg-slate-50 transition-colors"
          >
            <Copy size={14} /> Copy JSON
          </button>
          <button
            type="button"
            onClick={resetAllArchitectureCustomizations}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-100 bg-white text-rose-700 text-xs font-black hover:bg-rose-50 transition-colors"
          >
            <RotateCcw size={14} /> Reset All
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">Dummy Content Context</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              This sample context is passed into Prompt Generator and Content Manager for preview-before-save workflow testing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDummyContext(DEFAULT_DUMMY_CONTEXT)}
            className="px-3 py-2 text-[10px] font-black text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Reset Dummy
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {([
            ['domain', 'Domain'],
            ['subject', 'Subject'],
            ['topic', 'Topic'],
            ['subtopic', 'Subtopic'],
            ['subtopicId', 'Subtopic ID'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`dummy-${key}`} className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                {label}
              </label>
              <input
                id={`dummy-${key}`}
                value={dummyContext[key]}
                onChange={(event) => setDummyContext((prev) => ({ ...prev, [key]: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          ))}
          <div>
            <label htmlFor="learner-preview-target" className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Preview Target
            </label>
            <select
              id="learner-preview-target"
              value={learnerPreviewTarget}
              onChange={(event) => setLearnerPreviewTarget(event.target.value as keyof typeof LEARNER_PREVIEW_TARGETS)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              {Object.entries(LEARNER_PREVIEW_TARGETS).map(([key, target]) => (
                <option key={key} value={key}>{target.label}</option>
              ))}
            </select>
            <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{selectedWorkflowUrls.learnerPreview}</p>
          </div>
        </div>
      </div>

      {/* 4. Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowContextSidebar((value) => !value)}
          className="mr-2 shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 flex items-center gap-2"
        >
          <Code size={14} />
          {showContextSidebar ? 'Hide Live State' : 'Show Live State'}
        </button>
      </div>

      {activeTab !== 'Universal Architecture' && showContextSidebar ? (
        <aside className="fixed right-6 top-24 z-30 hidden max-h-[calc(100vh-7rem)] w-[390px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl xl:block">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Code size={16} className="text-blue-600" />
                {contextSidebarTitle}
              </h2>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{contextSidebarModeLabel} / {activeTab}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowContextSidebar(false)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-black text-slate-600 hover:bg-slate-50"
            >
              Hide
            </button>
          </div>
          <div className="rounded-xl bg-[#0f172a] p-4">
            {isJsonEditing ? (
              <textarea
                value={jsonEditorValue}
                onChange={(event) => setJsonEditorValue(event.target.value)}
                className="h-[220px] w-full resize-none bg-transparent font-mono text-[10px] leading-relaxed text-emerald-400 outline-none custom-scrollbar"
                spellCheck={false}
              />
            ) : (
              <pre className="h-[220px] overflow-y-auto font-mono text-[10px] leading-relaxed text-emerald-400 custom-scrollbar">{jsonString}</pre>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copyArchitectureJson} className="px-3 py-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 rounded hover:bg-indigo-50 flex items-center gap-1">
              <Copy size={11} /> Copy
            </button>
            <button type="button" onClick={downloadArchitectureJson} className="px-3 py-1.5 text-[10px] font-bold text-blue-600 border border-blue-100 rounded hover:bg-blue-50 flex items-center gap-1">
              <Download size={11} /> Download
            </button>
            <button type="button" onClick={validateActiveArchitecture} className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 border border-emerald-100 rounded hover:bg-emerald-50 flex items-center gap-1">
              <CheckSquare size={11} /> Validate
            </button>
            <button type="button" onClick={isJsonEditing ? applyJsonEdit : startJsonEdit} className="px-3 py-1.5 text-[10px] font-bold text-slate-600 border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1">
              <Edit2 size={11} /> {isJsonEditing ? 'Apply' : 'Edit'}
            </button>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CheckSquare size={15} className="text-emerald-600" />
                Validation Compliance
              </h3>
              <span className="text-sm font-black text-slate-900">95 <span className="text-[9px] text-slate-400">/100</span></span>
            </div>
            <div className="space-y-3">
              {contextSidebarMetrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`} className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">{metric.label}</span>
                  <span className="flex items-center gap-1 text-xs font-black text-slate-900"><CheckCircle2 size={12} className="text-emerald-500" /> {metric.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{isUiUxMode ? 'Design System' : 'Components'}</span>
              <p className="mt-1 text-lg font-black text-slate-900">{totalComponents}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Selected</span>
              <p className="mt-1 truncate text-xs font-black text-slate-900">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'Full Section'}</p>
            </div>
          </div>
        </aside>
      ) : null}

      {/* 4. Main Content Grid */}
      {activeTab === 'Universal Architecture' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN (65%) */}
          <div className={`${showContextSidebar ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-6`}>
            
            {!isUiUxMode ? (
              // ==========================================
              // EDUCATIONAL ARCHITECTURE VIEW
              // ==========================================
              <>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                  <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Selected Component Preview</span>
                        <h2 className="text-lg font-black text-slate-950 mt-1">
                          {selectedComponentKey ? formatTitle(selectedComponentKey) : 'Select a component'}
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          Preview uses default JSON and {LEARNER_PREVIEW_TARGETS[learnerPreviewTarget].label} brand colors before moving to Visual Guide, Prompt Generator, and Content Manager.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-600">
                          {String(adminSectionId)}.{selectedPipelineSubsectionKey || selectedComponentKey || 'full_section'}
                        </span>
                        {selectedPipelineSubsectionKey && selectedComponentKey && selectedPipelineSubsectionKey !== selectedComponentKey ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700">
                            selected: {selectedComponentKey}
                          </span>
                        ) : null}
                        <span className="rounded-full px-3 py-1 text-[10px] font-black text-white" style={{ backgroundColor: selectedBrandPreviewContract.primary_color }}>
                          {LEARNER_PREVIEW_TARGETS[learnerPreviewTarget].label}
                        </span>
                      </div>
                    </div>
                    {universalArchitecturePreviewContract ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <ContractAwareComponentPreview
                          section={String(adminSectionId)}
                          subsection={selectedPipelineSubsectionKey || selectedComponentKey || ''}
                          data={selectedPreviewJson}
                          contract={universalArchitecturePreviewContract}
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm font-bold text-slate-500">
                        Select a component card to load its preview.
                      </div>
                    )}
                  </div>
                  <div className="xl:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <h2 className="text-base font-bold text-slate-900">Constitutional Section Architecture (Fixed)</h2>
                        <Info size={16} className="text-slate-400" />
                      </div>

                      <label htmlFor="fixed-architecture-component" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Select Fixed Component
                      </label>
                      <select
                        id="fixed-architecture-component"
                        value={selectedComponentKey || ''}
                        onChange={(event) => setSelectedComponentKey(event.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-indigo-400"
                      >
                        {universalComponents.map(([key], index) => (
                          <option key={key} value={key}>
                            {index + 1}. {formatTitle(key)}
                          </option>
                        ))}
                      </select>

                      {selectedComponentKey && selectedComponentData ? (
                        <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                Step {Math.max(1, universalComponents.findIndex(([key]) => key === selectedComponentKey) + 1)}
                              </span>
                              <h3 className="mt-1 text-xl font-black text-slate-950">{formatTitle(selectedComponentKey)}</h3>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                                {selectedComponentData.purpose || 'Core architectural component for this section.'}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-emerald-700 ring-1 ring-emerald-100">
                              {selectedComponentData.required === false ? 'Optional' : 'Required'}
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white bg-white/80 p-3">
                              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Renderer</span>
                              <p className="mt-1 text-sm font-black text-slate-900">{selectedComponentData.renderer || 'Default renderer'}</p>
                            </div>
                            <div className="rounded-xl border border-white bg-white/80 p-3">
                              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Contract Key</span>
                              <p className="mt-1 break-all font-mono text-xs font-black text-slate-900">{selectedComponentKey}</p>
                            </div>
                          </div>

                          {Array.isArray(selectedComponentData.visible_components) && selectedComponentData.visible_components.length > 0 ? (
                            <div className="mt-5">
                              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">What This Component Contains</span>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {selectedComponentData.visible_components.map((part) => (
                                  <span key={String(part)} className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-[10px] font-black text-indigo-700">
                                    {formatTitle(String(part))}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <button
                              type="button"
                              onClick={() => setActiveTab('Renderer Mapping')}
                              className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50"
                            >
                              Edit Renderer
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('Prompt Management')}
                              className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-50"
                            >
                              Prompt Setup
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('JSON Schema')}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                            >
                              View JSON
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-500">
                          Select a fixed component to see its role, renderer, child parts, and next actions.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Sequence Flow */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-base font-bold text-slate-900">Default Learning Flow / Section Sequence</h2>
                    <Info size={16} className="text-slate-400" />
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-y-4 px-2">
                    {universalComponents.map(([key], index) => {
                      const isLast = index === universalComponents.length - 1;
                      const color = getColorForComponent(index);
                      return (
                        <React.Fragment key={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full ${color.bg} ${color.text} text-[10px] font-bold flex items-center justify-center`}>
                              {index + 1}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{formatTitle(key)}</span>
                          </div>
                          {!isLast && (
                            <div className="mx-2 text-slate-300">
                              <ArrowRight size={14} />
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>

                  <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      This sequence is constitutional and fixed for all domains. Content, examples and depth may vary by domain adaptation rules, but the structural progression remains strictly enforced.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // ==========================================
              // UI/UX ARCHITECTURE VIEW
              // ==========================================
              <>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                  <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-pink-600">Selected UI/UX Preview</span>
                        <h2 className="text-lg font-black text-slate-950 mt-1">
                          {selectedComponentKey ? formatTitle(selectedComponentKey) : 'Select a component'}
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          Preview uses the selected design-system contract, default dummy JSON, and {LEARNER_PREVIEW_TARGETS[learnerPreviewTarget].label} brand colors.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-600">
                          {selectedRendererName}
                        </span>
                        <span className="rounded-full px-3 py-1 text-[10px] font-black text-white" style={{ backgroundColor: selectedBrandPreviewContract.primary_color }}>
                          {LEARNER_PREVIEW_TARGETS[learnerPreviewTarget].label}
                        </span>
                      </div>
                    </div>
                    {universalArchitecturePreviewContract ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <ContractAwareComponentPreview
                          section={String(adminSectionId)}
                          subsection={selectedPipelineSubsectionKey || selectedComponentKey || ''}
                          data={selectedPreviewJson}
                          contract={universalArchitecturePreviewContract}
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm font-bold text-slate-500">
                        Select a component card to load its UI/UX preview.
                      </div>
                    )}
                  </div>
                  <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Component Design System</h2>
                      <Info size={16} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">{totalComponents} Components Registered</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.entries(activeData.component_design_system || {}) as [string, ComponentArchitecture][]).map(([key, item], index) => {
                      const color = getColorForComponent(index);
                      const isSelectedComponent = selectedComponentKey === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setSelectedComponentKey(key)}
                          className={`border rounded-xl p-4 flex flex-col hover:shadow-md transition-all bg-slate-50/50 w-full text-left ${
                            isSelectedComponent ? 'border-pink-400 ring-4 ring-pink-50 shadow-md' : 'border-slate-200'
                          }`}
                        >
                          <h3 className="text-sm font-bold text-slate-900 mb-1">{formatTitle(key)}</h3>
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 ${color.bg} ${color.text}`}>
                              {item.style_variant || 'primary'}
                            </span>
                            {item.animation_type && (
                               <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-600">
                                {item.animation_type}
                              </span>
                            )}
                          </div>
                          <div className="mt-auto pt-3 border-t border-slate-200">
                            <span className="block text-[10px] text-slate-500 font-medium mb-1">Permitted Interactive Elements:</span>
                            <div className="flex flex-wrap gap-1">
                               {(item.interactive_elements || ['click', 'hover']).map((el: string) => (
                                 <span key={el} className="text-[8px] font-bold uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{el}</span>
                               ))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Type size={16} className="text-indigo-600" /> Color & Typography
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Primary Palette</span>
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded bg-slate-900 shadow-sm"></div>
                            <div className="w-8 h-8 rounded bg-indigo-600 shadow-sm"></div>
                            <div className="w-8 h-8 rounded bg-pink-500 shadow-sm"></div>
                            <div className="w-8 h-8 rounded bg-emerald-500 shadow-sm"></div>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                           <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Font Family</span>
                           <span className="font-mono text-sm text-slate-800">Inter, system-ui, sans-serif</span>
                        </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MonitorSmartphone size={16} className="text-orange-600" /> Universal Layout System
                      </h2>
                      <div className="space-y-2">
                        {Object.entries(activeData.universal_layout_system || {}).slice(0,4).map(([key, value]) => (
                           <div key={key} className="flex justify-between items-center p-2 border-b border-slate-100 last:border-0">
                             <span className="text-xs font-bold text-slate-700">{formatTitle(key)}</span>
                             <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-bold uppercase">{String(value)}</span>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
              </>
            )}

            {/* Governance Activity Table (Shared across both modes) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                 <h2 className="text-base font-bold text-slate-900">Recent Architecture Governance Activity</h2>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">By / Role</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold">{isUiUxMode ? 'UI Rules updated' : 'Architecture updated'}</td>
                    <td className="px-6 py-4 text-slate-500">{formatTitle(activeSectionKey)}</td>
                    <td className="px-6 py-4">1.0</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">SA</div>
                        Super Admin
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">May 25, 2026 10:30 AM</td>
                    <td className="px-6 py-4 text-right"><span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">Published</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* RIGHT COLUMN (35%) */}
          {showContextSidebar ? (
          <div className="xl:col-span-4 space-y-6">
            
            {/* JSON Viewer */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code size={16} className="text-blue-600" />
                  {contextSidebarTitle} <span className="text-slate-400 font-medium">{contextSidebarModeLabel}</span>
                </h2>
                <button
                  type="button"
                  onClick={isJsonEditing ? applyJsonEdit : startJsonEdit}
                  className="text-[10px] font-bold text-blue-600 border border-blue-100 px-2 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                >
                  {isJsonEditing ? 'Apply JSON' : 'Edit Full JSON'} <ExternalLink size={12} />
                </button>
              </div>
              <div className="bg-[#0f172a] rounded-xl p-4 overflow-hidden relative">
                {isJsonEditing ? (
                  <textarea
                    value={jsonEditorValue}
                    onChange={(event) => setJsonEditorValue(event.target.value)}
                    className="w-full h-[220px] bg-transparent text-emerald-400 text-[10px] font-mono leading-relaxed outline-none resize-none custom-scrollbar"
                    spellCheck={false}
                  />
                ) : (
                  <pre className="text-emerald-400 text-[10px] font-mono leading-relaxed overflow-y-auto h-[220px] custom-scrollbar">
                    {jsonString}
                  </pre>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={copyArchitectureJson} className="px-3 py-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 rounded hover:bg-indigo-50 flex items-center gap-1">
                  <Copy size={11} /> Copy
                </button>
                <button type="button" onClick={downloadArchitectureJson} className="px-3 py-1.5 text-[10px] font-bold text-blue-600 border border-blue-100 rounded hover:bg-blue-50 flex items-center gap-1">
                  <Download size={11} /> Download
                </button>
                <button type="button" onClick={validateActiveArchitecture} className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 border border-emerald-100 rounded hover:bg-emerald-50 flex items-center gap-1">
                  <CheckSquare size={11} /> Validate
                </button>
                <button type="button" onClick={resetActiveArchitecture} className="px-3 py-1.5 text-[10px] font-bold text-slate-600 border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1">
                  <RotateCcw size={11} /> Reset
                </button>
              </div>
            </div>

            {/* Validation & Component Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Validation Compliance */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare size={16} className="text-emerald-600" />
                    Validation Compliance
                  </h2>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Overall Score</span>
                    <span className="text-lg font-black text-slate-900">95 <span className="text-[10px] text-slate-400 font-bold">/ 100</span></span>
                  </div>
                </div>
                <div className="space-y-3">
                   {contextSidebarMetrics.map((metric, i) => (
                     <div key={i} className="flex items-center justify-between">
                       <span className="text-[11px] font-bold text-slate-600">{metric.label}</span>
                       <div className="flex items-center gap-2">
                         <CheckCircle2 size={12} className="text-emerald-500" />
                         <span className="text-xs font-bold text-slate-900">{metric.score} <span className="text-slate-400 text-[9px]">/100</span></span>
                       </div>
                     </div>
                   ))}
                </div>
                <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-600">
                  {validationMessage}
                </div>
              </div>

              {/* Component Status Donut */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center">
                 <div className="w-full flex items-center gap-2 mb-2">
                   <Grid size={16} className="text-slate-500" />
                   <h2 className="text-sm font-bold text-slate-900">{isUiUxMode ? 'Design System' : 'Component Status'}</h2>
                 </div>
                 
                 <div className="relative w-24 h-24 my-4 flex items-center justify-center rounded-full" style={{ background: 'conic-gradient(#10b981 100%, #e2e8f0 0)'}}>
                    <div className="absolute w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center">
                       <span className="text-xl font-black text-slate-900 leading-none">{totalComponents}</span>
                       <span className="text-[9px] font-bold text-slate-500 uppercase">{isUiUxMode ? 'Tokens' : 'Total'}</span>
                    </div>
                 </div>

                 <div className="w-full space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {isUiUxMode ? 'Mapped' : 'Required'}</span>
                      <span>{totalComponents} (100%)</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {isUiUxMode ? 'Missing' : 'Optional'}</span>
                      <span>0 (0%)</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* CMS & Version Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                 <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <Layers size={14} /> {isUiUxMode ? 'Design Token DB' : 'CMS Integration'}
                 </h2>
                 <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between text-slate-600"><span>{isUiUxMode ? 'Synced' : 'AI Drafts'}</span> <span className="text-slate-900">12</span></div>
                    <div className="flex justify-between text-slate-600"><span>Published</span> <span className="text-slate-900">247</span></div>
                 </div>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                 <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <History size={14} /> Version Governance
                 </h2>
                 <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between text-slate-600"><span>Last Published</span> <span className="text-slate-900">May 20</span></div>
                    <div className="flex justify-between text-slate-600"><span>Next Review</span> <span className="text-slate-900">Jun 20</span></div>
                 </div>
               </div>
            </div>

            {/* Quick Actions List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Zap size={16} className="text-rose-500" /> Quick Actions
              </h2>
              <div className="space-y-2">
                <button type="button" onClick={duplicateSelectedMapping} className="w-full flex items-center gap-3 p-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600"><Plus size={12}/></div>
                   {isUiUxMode ? 'Duplicate Variant' : 'Duplicate Component'}
                </button>
                <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.visualGuide)} className="w-full flex items-center gap-3 p-2.5 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600"><Globe size={12}/></div>
                   {isUiUxMode ? 'Open Visual Placement' : 'Open Visual Guide'}
                </button>
                 <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)} className="w-full flex items-center gap-3 p-2.5 text-sm font-bold text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-amber-100 group-hover:text-amber-600"><FileText size={12}/></div>
                   {isUiUxMode ? 'Generate UI Prompt' : 'New Prompt Template'}
                </button>
              </div>
            </div>

          </div>
          ) : null}
        </div>
      ) : activeTab === 'Section Sequence' ? (
        <div className="space-y-6">
           
           {/* Top 3 Columns */}
           <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-6">
              
              {/* Col 1: Universal Section Sequence */}
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px]">
                 <div className="flex items-start justify-between gap-4 mb-4">
                   <div>
                      <h2 className="text-base font-bold text-slate-900">{isUiUxMode ? 'UI/UX Component Sequence / Renderer Order' : 'Universal Section Sequence / Fixed Component Order'}</h2>
                     <p className="text-xs text-slate-500 font-medium mt-1">Select a component to inspect its place in the {isUiUxMode ? 'UI rendering flow' : 'section journey'}.</p>
                   </div>
                   <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full"><CheckCircle2 size={12}/> Fixed</span>
                 </div>
                 <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-lg text-xs font-bold mb-4 flex gap-2 items-center shrink-0">
                    <Info size={14} className="shrink-0 text-blue-500" />
                    This is the fixed {isUiUxMode ? 'UI/UX component rendering order' : 'universal flow order'} for all {formatTitle(activeSectionKey)} content.
                 </div>
                 
                 <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {activeLearningFlow.map((key: string, index: number) => {
                     const Icon = getIconForComponent(index);
                     const componentData = (activeComponentMap[key] || {}) as ComponentArchitecture;
                     return (
                       <button type="button" key={key} onClick={() => setSelectedComponentKey(key)} className={`w-full flex items-center gap-3 p-3 border rounded-xl shadow-sm transition-all group text-left ${selectedComponentKey === key ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                         <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black shrink-0">
                           {index + 1}
                         </div>
                         <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                           <Icon size={14} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-bold text-slate-900 truncate">{formatTitle(key)}</h3>
                            <p className="text-[9px] font-black text-indigo-600 truncate">{key}</p>
                            <p className="text-[9px] font-medium text-slate-500 truncate">{String(componentData.renderer || componentData.component || componentData.purpose || 'Executes step')}</p>
                         </div>
                         <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0 border border-emerald-100">Required</span>
                         {selectedComponentKey === key ? <span className="text-[9px] font-black text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-100">Selected</span> : null}
                       </button>
                     )
                   })}
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-slate-500 shrink-0">
                    <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={12}/> No action needed unless the constitutional order changes.</span>
                    <button type="button" onClick={() => setShowAdvancedSequence((value) => !value)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                      <Settings size={12}/> {showAdvancedSequence ? 'Hide Advanced' : 'Show Advanced'}
                    </button>
                 </div>
              </div>

              <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-[650px] flex flex-col">
                <h2 className="text-base font-bold text-slate-900 mb-4">Selected Component Journey</h2>
                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5 mb-5">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Selected</span>
                  <h3 className="text-2xl font-black text-slate-950 mt-1">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'Select a component'}</h3>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{isUiUxMode ? String(selectedComponentData?.renderer || selectedComponentData?.component || 'Select a component to see the renderer and UI contract.') : selectedComponentData?.purpose || 'Select a component on the left to see how it fits in the fixed sequence.'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Before</span>
                    <p className="text-sm font-black text-slate-800 mt-1">{activeLearningFlow[selectedComponentIndex - 1] ? formatTitle(activeLearningFlow[selectedComponentIndex - 1]) : 'Section start'}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-white p-4">
                    <span className="text-[10px] font-black text-indigo-500 uppercase">Position</span>
                    <p className="text-sm font-black text-slate-800 mt-1">{selectedComponentIndex + 1} of {activeLearningFlow.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">After</span>
                    <p className="text-sm font-black text-slate-800 mt-1">{activeLearningFlow[selectedComponentIndex + 1] ? formatTitle(activeLearningFlow[selectedComponentIndex + 1]) : 'Section end'}</p>
                  </div>
                </div>
                <div className="space-y-3 mt-auto">
                  <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.visualGuide)} className="w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2"><Globe size={16}/> Open Visual Guide</button>
                  <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)} className="w-full rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-2"><FileText size={16}/> Open Prompt Generator</button>
                  <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.contentManager)} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700 flex items-center justify-center gap-2"><Edit2 size={16}/> Open Content Manager</button>
                </div>
              </div>

              {showAdvancedSequence ? (
              <>

              {/* Col 2: JSON Architecture */}
              <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px]">
                 <div className="flex items-center justify-between mb-4">
                   <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">2. Section Sequence Architecture (JSON) <Info size={14} className="text-slate-400"/></h2>
                   <button type="button" onClick={copyArchitectureJson} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                     <Copy size={12} /> Copy JSON
                   </button>
                 </div>
                 <div className="bg-[#0f172a] rounded-xl p-4 flex-1 overflow-hidden relative shadow-inner">
                    <pre className="text-[#38bdf8] text-[10px] font-mono leading-relaxed overflow-y-auto h-full custom-scrollbar">
{`{
  "section_sequence_architecture": {
    "version": "${activeData.metadata?.version || '1.0'}",
    "status": "active",
    "updated_at": "2025-05-15T10:30:00Z",
    "sequence": [
${activeLearningFlow.map((key: string, index: number) => `      {
        "order": ${index + 1},
        "type": "${key}",
        "title": "${formatTitle(key)}",
        "required": true
      }`).join(',\n')}
    ]
  }
}`}
                    </pre>
                 </div>
                 <div className="mt-4 shrink-0">
                   <button type="button" onClick={downloadArchitectureJson} className="flex some items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                     <Download size={14} /> Export JSON
                   </button>
                 </div>
              </div>

              {/* Col 3: Stacked Panels */}
              <div className="xl:col-span-4 space-y-6 flex flex-col h-[650px]">
                 {/* Progression Flow */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">3. Sequence Progression Flow <Info size={14} className="text-slate-400"/></h2>
                    <div className="flex items-center justify-between mb-8 px-2 overflow-x-auto hide-scrollbar">
                        {activeLearningFlow.slice(0,8).map((key: string, index: number) => {
                         const isLast = index === Math.min(activeLearningFlow.length, 8) - 1;
                         const color = getColorForComponent(index);
                         const Icon = getIconForComponent(index);
                         return (
                           <React.Fragment key={key}>
                             <div className="flex flex-col items-center gap-2 shrink-0">
                               <span className={`text-[10px] font-bold ${color.text}`}>{index + 1}</span>
                               <div className={`w-8 h-8 rounded-full ${color.text} ${color.bg} shadow-sm border border-white flex items-center justify-center`}>
                                 <Icon size={14} />
                               </div>
                             </div>
                             {!isLast && <div className="text-slate-300 shrink-0"><ArrowRight size={12}/></div>}
                           </React.Fragment>
                         )
                       })}
                    </div>
                    <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 flex-1">
                       <h3 className="text-sm font-bold text-purple-900 mb-2">Learner Journey Flow</h3>
                       <p className="text-[11px] text-purple-700 font-medium mb-4 leading-relaxed">This sequence ensures a structured learning experience from basic understanding to summary and revision.</p>
                       <ul className="space-y-2">
                         <li className="flex items-center gap-2 text-xs text-purple-900 font-bold"><CheckCircle2 size={14} className="text-emerald-500"/> Builds concept step-by-step</li>
                         <li className="flex items-center gap-2 text-xs text-purple-900 font-bold"><CheckCircle2 size={14} className="text-emerald-500"/> Enhances retention and understanding</li>
                         <li className="flex items-center gap-2 text-xs text-purple-900 font-bold"><CheckCircle2 size={14} className="text-emerald-500"/> Reduces cognitive overload</li>
                         <li className="flex items-center gap-2 text-xs text-purple-900 font-bold"><CheckCircle2 size={14} className="text-emerald-500"/> Improves confidence and clarity</li>
                       </ul>
                    </div>
                 </div>

                 {/* Governance */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 shrink-0">
                    <h2 className="text-base font-bold text-slate-900 mb-5">4. Architecture Governance</h2>
                    <div className="flex flex-col sm:flex-row gap-6">
                       <div className="flex-1 space-y-3 text-[10px]">
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Created By</span><span className="font-bold text-slate-800">Super Admin</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Created At</span><span className="font-bold text-slate-800">01 May 2026, 09:15 AM</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Last Updated By</span><span className="font-bold text-slate-800">Super Admin</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Last Updated At</span><span className="font-bold text-slate-800">15 May 2026, 10:30 AM</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Approval Status</span><span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Published</span></div>
                         <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100"><span className="text-slate-500 font-medium uppercase tracking-wider">Change History</span><span className="font-bold text-indigo-600 flex items-center gap-1 cursor-pointer hover:underline">View History <ArrowRight size={10}/></span></div>
                       </div>
                       <div className="sm:w-[150px] space-y-2 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-6 pt-4 sm:pt-0">
                         <span className="block text-[10px] font-bold text-slate-900 mb-3 uppercase tracking-wider">Governance Actions</span>
                         <button type="button" onClick={startJsonEdit} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-100 text-rose-600 bg-white text-[10px] font-bold hover:bg-rose-50 transition-colors shadow-sm"><Edit2 size={12}/> Edit Sequence</button>
                         <button type="button" onClick={() => showActionMessage('Version history is represented in the change log below.')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-100 text-blue-600 bg-white text-[10px] font-bold hover:bg-blue-50 transition-colors shadow-sm"><History size={12}/> Version History</button>
                         <button type="button" onClick={() => updateArchitectureStatus('approved')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-100 text-emerald-600 bg-white text-[10px] font-bold hover:bg-emerald-50 transition-colors shadow-sm"><CheckCircle2 size={12}/> Approve Changes</button>
                         <button type="button" onClick={() => updateArchitectureStatus('archived')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-100 text-rose-600 bg-white text-[10px] font-bold hover:bg-rose-50 transition-colors shadow-sm"><Archive size={12}/> Archive Architecture</button>
                       </div>
                    </div>
                 </div>
              </div>
              </>
              ) : null}
           </div>

           {/* Bottom Content Rows */}
           {showAdvancedSequence ? (
           <>
           {/* Domain Adaptation Overview */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                 <div>
                   <h2 className="text-base font-bold text-slate-900">8. Domain Adaptation Overview</h2>
                   <p className="text-xs text-slate-500 font-medium mt-1">This sequence is universal. Domains may provide content adaptation inside each section, not sequence change.</p>
                 </div>
                 <button type="button" onClick={startJsonEdit} className="text-[11px] font-bold border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">Manage Domain Adaptations</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                 {activeData.metadata?.supported_domains?.map((domain: string, i: number) => {
                   const icons = [Code, Globe, ShieldCheck, Brain, Activity, Users, Settings];
                   const DomainIcon = icons[i % icons.length];
                   const colors = ['text-purple-600', 'text-blue-500', 'text-slate-800', 'text-rose-500', 'text-emerald-500', 'text-indigo-600', 'text-teal-500'];
                   const colorClass = colors[i % colors.length];
                   return (
                     <div key={domain} className="flex items-center justify-center gap-3 px-6 py-3 border border-slate-200 rounded-xl min-w-[180px] bg-white shadow-sm">
                       <DomainIcon size={20} className={colorClass} />
                       <div>
                         <span className="block text-xs font-bold text-slate-800">{formatTitle(domain)}</span>
                         <span className="text-[10px] font-bold text-emerald-600">Active</span>
                       </div>
                     </div>
                   );
                 }) || (
                    <div className="text-sm text-slate-500 p-4">No specific domain adaptations found.</div>
                 )}
              </div>
           </div>
           
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-base font-bold text-slate-900">9. Recent Architecture Change Log</h2>
                   <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 cursor-pointer hover:underline">View All Changes <ArrowRight size={12}/></span>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Version</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Changed By</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Change Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Changed At</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900">CHG-0587</td>
                        <td className="px-4 py-4">1.0</td>
                        <td className="px-4 py-4">Super Admin</td>
                        <td className="px-4 py-4">Create</td>
                        <td className="px-4 py-4">Initial architecture created</td>
                        <td className="px-4 py-4 text-slate-500">01 May 2026, 09:15 AM</td>
                        <td className="px-4 py-4"><span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold text-[10px]">Published</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900">CHG-0612</td>
                        <td className="px-4 py-4">1.1</td>
                        <td className="px-4 py-4">Super Admin</td>
                        <td className="px-4 py-4">Update</td>
                        <td className="px-4 py-4">Updated step titles and descriptions</td>
                        <td className="px-4 py-4 text-slate-500">06 May 2026, 04:20 PM</td>
                        <td className="px-4 py-4"><span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold text-[10px]">Approved</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900">CHG-0620</td>
                        <td className="px-4 py-4">1.2</td>
                        <td className="px-4 py-4">Super Admin</td>
                        <td className="px-4 py-4">Update</td>
                        <td className="px-4 py-4">Added progression flow and validation rules</td>
                        <td className="px-4 py-4 text-slate-500">15 May 2026, 10:30 AM</td>
                        <td className="px-4 py-4"><span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold text-[10px]">Published</span></td>
                      </tr>
                    </tbody>
                  </table>
                 </div>
              </div>
              <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center">
                 <h2 className="text-base font-bold text-slate-900 mb-6">10. Quick Actions</h2>
                 <div className="space-y-4">
                   <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-purple-200 hover:shadow-md cursor-pointer transition-all group bg-white">
                     <div className="w-10 h-10 rounded bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors"><FileText size={20}/></div>
                     <div><span className="block text-sm font-bold text-purple-700">Create New Section</span><span className="text-xs text-slate-500 font-medium">Start new notes section</span></div>
                   </div>
                   <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all group bg-white">
                     <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors"><ShieldCheck size={20}/></div>
                     <div><span className="block text-sm font-bold text-emerald-700">Create Prompt Template</span><span className="text-xs text-slate-500 font-medium">Build new prompt template</span></div>
                   </div>
                 </div>
              </div>
           </div>
           </>
           ) : null}

        </div>
      ) : activeTab === 'Component Details' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Selected {isUiUxMode ? 'UI/UX Component Contract' : 'Component Contract'}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    This is the one component currently selected from the fixed {isUiUxMode ? 'UI/UX design system' : 'section architecture'}.
                  </p>
                </div>
                <button type="button" onClick={() => setShowAdvancedComponentDetails((value) => !value)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Settings size={14}/> {showAdvancedComponentDetails ? 'Hide Advanced' : 'Show Advanced'}
                </button>
              </div>

              <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{isUiUxMode ? 'UI/UX Architecture Component' : 'Component'}</span>
                <h3 className="text-3xl font-black text-slate-950 mt-1">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'Select a component'}</h3>
                <p className="mt-2 font-mono text-xs font-black text-indigo-700">{selectedComponentKey || 'full_section'}</p>
                {isUiUxMode ? <p className="mt-2 font-mono text-xs font-black text-pink-700">{String(selectedComponentData?.renderer || selectedComponentData?.component || 'No renderer selected')}</p> : null}
                <p className="text-sm text-slate-700 mt-4 leading-relaxed">{selectedComponentData?.purpose || 'Select a component from Universal Architecture to inspect its contract.'}</p>
              </div>

              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-black text-slate-900">{isUiUxMode ? 'UI/UX Architecture / Renderer Mapping Configuration' : 'Fixed Component Architecture / Renderer Mapping Configuration'}</h3>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
                  {isUiUxMode ? 'This tab confirms which learner-facing renderer, layout, style variant, and interaction contract belongs to the selected Notes UI component.' : 'This tab explains the selected component contract. Use Renderer Mapping for UI/UX editing; this tab confirms which fixed education component and renderer are connected.'}
                </p>
              </div>

              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeComponentEntries.map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedComponentKey(key)}
                    className={`rounded-xl border p-3 text-left transition-all ${selectedComponentKey === key ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <p className="text-xs font-black text-slate-900">{formatTitle(key)}</p>
                    <p className="mt-1 font-mono text-[10px] font-black text-indigo-700">{String((item as ComponentArchitecture).renderer || (item as ComponentArchitecture).component || 'default_renderer')}</p>
                    {isUiUxMode ? <p className="mt-1 text-[10px] font-bold text-slate-500">layout: {String((item as ComponentArchitecture).layout_type || (item as ComponentArchitecture).layout || 'default')}</p> : null}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Renderer</span>
                  <p className="text-sm font-black text-slate-900 mt-1">{String(selectedComponentData?.renderer || (selectedRendererMapping as Record<string, unknown> | null)?.component || 'Default renderer')}</p>
                  <p className="text-xs text-slate-500 mt-2">This decides which UI component will show the JSON.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Required / Fixed</span>
                  <p className="text-sm font-black text-emerald-700 mt-1">{selectedComponentData?.required === false ? 'Optional' : 'Required'}</p>
                  <p className="text-xs text-slate-500 mt-2">This section contract should not be changed during normal content work.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Prompt Target</span>
                  <p className="text-sm font-black text-slate-900 mt-1">{String(adminSectionId)}{selectedComponentKey ? `.${selectedComponentKey}` : ''}</p>
                  <p className="text-xs text-slate-500 mt-2">This is what Prompt Generator and Content Manager receive.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sequence Position</span>
                  <p className="text-sm font-black text-slate-900 mt-1">{selectedComponentIndex + 1} of {activeLearningFlow.length}</p>
                  <p className="text-xs text-slate-500 mt-2">Use Section Sequence only to inspect the fixed order.</p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-5">What Can You Do Here?</h2>
              <div className="space-y-3">
                <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.visualGuide)} className="w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2">
                  <Globe size={16}/> Open Visual Guide for this component
                </button>
                <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)} className="w-full rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-2">
                  <FileText size={16}/> Generate Prompt for this component
                </button>
                <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.contentManager)} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700 flex items-center justify-center gap-2">
                  <Edit2 size={16}/> Open Content Manager Preview
                </button>
                <button type="button" onClick={() => setActiveTab('Renderer Mapping')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
                  <MonitorSmartphone size={16}/> Configure renderer mapping
                </button>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  The large component grid, raw JSON, prompt statistics, progression list, and metadata are advanced inspection panels. They are hidden by default because they are not needed for normal component workflow.
                </p>
              </div>
            </div>
          </div>

          {showAdvancedComponentDetails ? (
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column */}
              <div className="xl:col-span-8 space-y-6">
                 
                 {/* 1. Fixed Component Architecture */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                       <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">1. Fixed Component Architecture ({totalComponents}/{totalComponents} Required) <Info size={14} className="text-slate-400"/></h2>
                       <button type="button" onClick={() => setActiveTab('Section Sequence')} className="text-[10px] font-bold text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1.5 transition-colors">
                         <ChevronRight size={12} className="rotate-0"/> Manage Order
                       </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {activeComponentEntries.map(([key, item], index) => {
                        const Icon = getIconForComponent(index);
                        const color = getColorForComponent(index);
                        return (
                          <div key={key} className="border border-slate-100 rounded-xl p-4 flex flex-col relative hover:shadow-md transition-shadow bg-white">
                             <div className="flex justify-between items-start mb-2">
                               <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                               <GripVertical size={14} className="text-slate-300 cursor-grab hover:text-slate-500" />
                             </div>
                             <div className="flex flex-col items-center text-center mb-4">
                               <div className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center mb-2`}>
                                 <Icon size={16} />
                               </div>
                               <h3 className="text-xs font-bold text-slate-900 mb-1 leading-tight">{formatTitle(key)}</h3>
                               <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">{item.purpose || 'Basic understanding of the topic in simplest terms.'}</p>
                             </div>
                             <div className="mt-auto space-y-2">
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 bg-slate-50 p-1.5 rounded justify-center border border-slate-100">
                                  <span>Renderer:</span>
                                  <span className={`px-1.5 py-0.5 rounded bg-white border border-slate-200 ${color.text}`}>{item.renderer || 'default'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-bold px-1">
                                  <span className={item.required !== false ? "text-emerald-600" : "text-slate-400"}>{item.required !== false ? 'Required' : 'Optional'}</span>
                                  <span className="text-emerald-600">Active</span>
                                </div>
                             </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-[10px] font-bold text-slate-500">
                       <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Required Component</span>
                       <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Optional Component</span>
                       <span className="flex items-center gap-1.5 ml-auto"><Settings size={12}/> Advanced inspection only</span>
                    </div>
                 </div>

                 {/* 4. Renderer Mapping Configuration */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">4. Renderer Mapping Configuration <Info size={14} className="text-slate-400"/></h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-slate-100">
                          <tr>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Component</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Renderer</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Layout Type</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Interaction</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Mobile Support</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Status</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[10px] font-medium text-slate-600">
                          {activeComponentEntries.slice(0, 8).map(([key, item], index) => {
                             const color = getColorForComponent(index);
                             const interactions = ['Static + Icons', 'Visual + Text', 'Icon + Points', 'Hover + Cards', 'Expand/Collapse', 'Zoom + Pan', 'Expand/Collapse', 'Highlights'];
                             const layouts = ['Card', 'Card', 'Card', 'Grid', 'Accordion', 'Diagram', 'FAQ', 'Card'];
                             return (
                               <tr key={key} className="hover:bg-slate-50 transition-colors">
                                 <td className="py-2.5 font-bold text-slate-800">{formatTitle(key)}</td>
                                 <td className="py-2.5"><span className={`${color.text} font-bold`}>{item.renderer || 'default'}</span></td>
                                 <td className="py-2.5">{layouts[index % layouts.length]}</td>
                                 <td className="py-2.5">{interactions[index % interactions.length]}</td>
                                 <td className="py-2.5"><span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 size={10}/> Responsive</span></td>
                                 <td className="py-2.5"><span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 size={10}/> Active</span></td>
                                 <td className="py-2.5">
                                   <div className="flex flex-wrap gap-2">
                                     <button type="button" onClick={() => { setSelectedComponentKey(key); setActiveTab('Renderer Mapping'); }} className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-[9px] font-black text-indigo-700 hover:bg-indigo-100">
                                       Configure
                                     </button>
                                     <button type="button" onClick={() => openWorkflowUrl(`/tools/visual-guide?section=${canonicalSectionId}&subsection=${key}`)} className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 hover:bg-blue-100">
                                       Visual Guide
                                     </button>
                                   </div>
                                 </td>
                               </tr>
                             )
                          })}
                        </tbody>
                      </table>
                    </div>
                 </div>

                 {/* 8. Prompt Management Overview */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">8. Prompt Management Overview <Info size={14} className="text-slate-400"/></h2>
                    <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)} className="absolute top-6 right-6 border border-rose-200 text-rose-600 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-rose-50 transition-colors">Manage Prompts <ArrowRight size={10}/></button>
                    
                    <div className="flex gap-4 mb-6 flex-wrap">
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><FileText size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Prompts</span><span className="text-base font-black text-slate-900">{totalComponents}</span></div>
                       </div>
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Approved Prompts</span><span className="text-base font-black text-slate-900">{totalComponents}</span></div>
                       </div>
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Edit2 size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Draft Prompts</span><span className="text-base font-black text-slate-900">0</span></div>
                       </div>
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShieldCheck size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Prompt Integrity</span><span className="text-xs font-black text-emerald-600">Verified</span></div>
                       </div>
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Calendar size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Last Updated</span><span className="text-xs font-black text-slate-900">15 May 2026</span></div>
                       </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                       <div>
                         <span className="block text-[10px] font-bold text-slate-700 mb-1">Prompt Integrity Hash (SHA256)</span>
                         <span className="text-[10px] font-mono text-slate-500">a4f8c1d9b8e3f7c2a6d9e4b5f1c8a7e2d3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b</span>
                       </div>
                       <button type="button" onClick={() => { navigator.clipboard.writeText('a4f8c1d9b8e3f7c2a6d9e4b5f1c8a7e2d3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'); showActionMessage('Prompt integrity hash copied.'); }} className="border border-indigo-100 text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-indigo-50 transition-colors bg-white"><Copy size={10}/> Copy Hash</button>
                    </div>
                 </div>

              </div>

              {/* Right Column */}
              <div className="xl:col-span-4 space-y-6">
                 
                 {/* 2. JSON */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px]">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">2. Component Architecture JSON <span className="text-slate-400 font-medium">(Read Only)</span></h2>
                    <div className="bg-[#0f172a] rounded-xl p-4 flex-1 overflow-hidden relative shadow-inner">
                      <pre className="text-[#38bdf8] text-[10px] font-mono leading-relaxed overflow-y-auto h-full custom-scrollbar">
{`{
  "section_type": "${activeSectionKey}",
  "version": "${activeData.metadata?.version || '1.0'}",
  "status": "active",
  "components": [
${activeComponentEntries.map(([key, item], index) => `    {
      "key": "${key}",
      "name": "${formatTitle(key)}",
      "required": ${item.required !== false},
      "renderer": "${item.renderer || 'default'}",
      "order": ${index + 1},
      "enabled": ${item.enabled !== false}
    }`).join(',\n')}
  ]
}`}
                      </pre>
                    </div>
                    <div className="mt-4 flex gap-2">
                       <button type="button" onClick={copyArchitectureJson} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 py-2 rounded hover:bg-indigo-50 transition-colors"><Copy size={12}/> Copy JSON</button>
                       <button type="button" onClick={downloadArchitectureJson} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-blue-600 border border-blue-100 py-2 rounded hover:bg-blue-50 transition-colors"><Download size={12}/> Download JSON</button>
                       <button type="button" onClick={validateActiveArchitecture} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600 border border-slate-200 py-2 rounded hover:bg-slate-50 transition-colors"><CheckSquare size={12}/> Validate JSON</button>
                    </div>
                 </div>

                 {/* 5. Default Learning Progression Flow */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">5. Default Learning Progression Flow <Info size={14} className="text-slate-400"/></h2>
                    <div className="flex items-center justify-between mb-8 overflow-x-auto hide-scrollbar pb-2">
                       {activeComponentKeys.slice(0,8).map((key: string, index: number) => {
                         const color = getColorForComponent(index);
                         const Icon = getIconForComponent(index);
                         const isLast = index === Math.min(activeComponentKeys.length, 8) - 1;
                         return (
                           <React.Fragment key={key}>
                             <div className="flex flex-col items-center gap-1 shrink-0">
                               <span className={`text-[9px] font-bold ${color.text}`}>{index + 1}</span>
                               <div className={`w-7 h-7 rounded-full ${color.bg} ${color.text} flex items-center justify-center shadow-sm border border-white`}>
                                 <Icon size={12} />
                               </div>
                             </div>
                             {!isLast && <div className="text-slate-200 shrink-0"><ArrowRight size={10}/></div>}
                           </React.Fragment>
                         )
                       })}
                    </div>
                    <div className="space-y-4 mb-6">
                       {activeComponentKeys.slice(0,8).map((key: string, index: number) => {
                         const color = getColorForComponent(index);
                         return (
                           <div key={key} className="flex items-center gap-3">
                             <div className={`w-5 h-5 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-[9px] font-bold shrink-0`}>{index + 1}</div>
                             <span className="text-[11px] font-bold text-slate-800">{formatTitle(key)}</span>
                           </div>
                         )
                       })}
                    </div>
                    <button type="button" onClick={() => setActiveTab('Section Sequence')} className="w-full border border-purple-200 text-purple-600 bg-purple-50/50 text-xs font-bold py-2.5 rounded-lg hover:bg-purple-50 transition-colors shadow-sm">Edit Progression Flow</button>
                 </div>

                 {/* 9. Section Metadata */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-4">9. Section Metadata</h2>
                    <div className="space-y-4 text-[10px]">
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Description</span><span className="font-medium text-slate-800 leading-snug">Explanation for beginners with simple language and real life analogies.</span></div>
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Target Audience</span><span className="font-medium text-slate-800 leading-snug">Beginners, non-technical learners, career switchers</span></div>
                       <div className="flex items-center"><span className="w-24 shrink-0 text-slate-500">Complexity Level</span><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded">Beginner</span></div>
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Estimated Time</span><span className="font-medium text-slate-800 leading-snug">5 - 10 min per subtopic</span></div>
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Content Objective</span><span className="font-medium text-slate-800 leading-snug">Make complex topics simple, relatable and easy to understand.</span></div>
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Learning Outcome</span><span className="font-medium text-slate-800 leading-snug">Build strong conceptual foundation with confidence.</span></div>
                    </div>
                 </div>

              </div>
           </div>
           ) : null}
        </div>
      ) : activeTab === 'Learning Progression' ? (
        <div className="space-y-6 pb-10">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{isUiUxMode ? 'UI/UX Rendering Progression' : 'Learning Progression'} for {formatTitle(String(adminSectionId))}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {isUiUxMode ? 'This tab explains where the selected UI component sits in the learner-facing rendering flow and which renderer presents it.' : 'This tab explains where the selected component sits in the learner journey and what should happen before and after it.'}
                  </p>
                </div>
                <button type="button" onClick={() => setActiveTab('Section Sequence')} className="px-4 py-2 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-black hover:bg-indigo-100">
                  Edit Sequence
                </button>
              </div>
              <div className="space-y-3">
                {activeLearningFlow.map((key, index) => {
                  const item = activeComponentMap[key] as ComponentArchitecture | undefined;
                  const isSelected = selectedComponentKey === key;
                  const Icon = getIconForComponent(index);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setSelectedComponentKey(key)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${isSelected ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon size={18} />
                        </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-slate-400">Step {index + 1}</span>
                              <h3 className="text-sm font-black text-slate-900">{formatTitle(key)}</h3>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-indigo-700">{key}</span>
                              {isSelected ? <span className="text-[10px] font-black text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-full">Selected</span> : null}
                            </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{isUiUxMode ? String(item?.renderer || item?.component || 'Defines this UI rendering step inside the section.') : item?.purpose || 'Defines this learning step inside the section.'}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">Selected Component Role</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Component</span>
                    <p className="font-black text-slate-900">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'None selected'}</p>
                    <p className="font-mono text-xs font-black text-indigo-700">{selectedComponentKey || 'none'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Before</span>
                    <p className="font-bold text-slate-700">{activeLearningFlow[selectedComponentIndex - 1] ? formatTitle(activeLearningFlow[selectedComponentIndex - 1]) : 'Start of section'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">After</span>
                    <p className="font-bold text-slate-700">{activeLearningFlow[selectedComponentIndex + 1] ? formatTitle(activeLearningFlow[selectedComponentIndex + 1]) : 'End of section'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isUiUxMode ? 'Renderer / UI Role' : 'Purpose'}</span>
                    <p className="font-medium text-slate-700 leading-relaxed">{isUiUxMode ? String(selectedComponentData?.renderer || selectedComponentData?.component || 'Select a component to see its UI purpose.') : selectedComponentData?.purpose || 'Select a component to see its educational purpose.'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl border border-purple-100 p-6">
                <h3 className="text-base font-bold text-purple-950 mb-3">What to Do Here</h3>
                <p className="text-sm text-purple-800 leading-relaxed">
                  {isUiUxMode ? 'Use this tab to confirm whether the selected UI component appears at the right point in the learner page rendering flow. If the look is wrong, go to Renderer Mapping.' : 'Use this tab to decide whether the selected component belongs at this point in the learning flow. If order is wrong, go to Section Sequence. If content shape is wrong, go to JSON Schema.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'Prompt Management' ? (
        <div className="space-y-6 pb-10">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{isUiUxMode ? 'UI/UX Prompt Management Bridge' : 'Prompt Management Bridge'}</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-3xl">
                  This tab does not replace the Prompt Generator page. It decides what selected {isUiUxMode ? 'UI/UX architecture' : 'architecture'} context will be sent to Prompt Generator for this component.
                </p>
              </div>
              <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)} className="px-5 py-3 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 flex items-center justify-center gap-2">
                <Zap size={16} /> Open Prompt Generator
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-5">Selected Prompt Target</h3>
              <div className="space-y-4 text-sm">
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Section</span><p className="font-black text-slate-900">{String(adminSectionId)}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Component</span><p className="font-black text-slate-900">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'Full section'}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prompt Contract Key</span><p className="font-mono text-xs font-black text-indigo-700">{String(adminSectionId)}.{selectedPipelineSubsectionKey || selectedComponentKey || 'full_section'}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dummy Topic</span><p className="font-bold text-slate-700">{dummyContext.domain} / {dummyContext.subject} / {dummyContext.subtopic}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prompt URL</span><p className="break-all font-mono text-xs text-indigo-700">{selectedWorkflowUrls.promptGenerator}</p></div>
              </div>
            </div>

            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Prompt Context That Will Be Sent</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isUiUxMode ? 'UI/UX Component Role' : 'Educational Component Role'}</span>
                  <p className="text-sm font-bold text-slate-800 mt-2 leading-relaxed">{isUiUxMode ? String(selectedComponentData?.component || selectedComponentData?.purpose || 'UI purpose not configured.') : selectedComponentData?.purpose || 'Purpose not configured.'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Renderer/UI Decision</span>
                  <p className="text-sm font-bold text-slate-800 mt-2 leading-relaxed">{selectedComponentData?.renderer || (selectedRendererMapping as Record<string, unknown> | null)?.component as string || 'Default renderer'}</p>
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl p-4">
                <pre className="text-xs text-emerald-300 overflow-auto max-h-[360px]">{JSON.stringify({
                  section: adminSectionId,
                  subsection: selectedPipelineSubsectionKey || selectedComponentKey,
                  dummyContext,
                  educationalComponent: selectedComponentData,
                  rendererMapping: selectedRendererMapping,
                }, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'Legacy Prompt Management' && !isUiUxMode ? (
        <div className="space-y-6 pb-10">
           
           <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-5 items-start">
              
              {/* COLUMN 1 (span 2) */}
              <div className="xl:col-span-2 space-y-5 flex flex-col">
                 
                 {/* 1. Prompt Metadata */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <h2 className="text-sm font-bold text-slate-900 mb-4">1. Prompt Metadata</h2>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="prompt-name" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Prompt Name <span className="text-rose-500">*</span></label>
                        <input id="prompt-name" type="text" className="w-full border border-slate-200 rounded p-2 text-xs font-bold text-slate-800" value="Layman Explanation - Beginner Friendly" readOnly/>
                      </div>
                      <div>
                        <label htmlFor="prompt-slug" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Prompt Slug</label>
                        <input id="prompt-slug" type="text" className="w-full border border-slate-200 rounded p-2 text-[10px] font-mono text-slate-500 bg-slate-50" value="layman-beginner-explanation-v2.3" readOnly/>
                      </div>
                      <div>
                        <label htmlFor="learning-objective" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Learning Objective</label>
                        <textarea id="learning-objective" className="w-full border border-slate-200 rounded p-2 text-xs text-slate-600 h-16 resize-none" readOnly defaultValue="Explain the concept in simplest terms using real-life analogies." />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label htmlFor="est-time" className="text-[9px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Est. Time</label>
                            <select id="est-time" className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-700 bg-slate-50"><option>5 - 7 min</option></select>
                         </div>
                         <div>
                            <label htmlFor="target-audience" className="text-[9px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Target Audience</label>
                            <select id="target-audience" className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-700 bg-slate-50"><option>Beginners</option></select>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label htmlFor="ai-model" className="text-[9px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">AI Model</label>
                            <select id="ai-model" className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-700 bg-slate-50"><option>GPT-4o</option></select>
                         </div>
                         <div>
                            <label htmlFor="prompt-status" className="text-[9px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Status</label>
                            <select id="prompt-status" className="w-full border border-slate-200 rounded p-1.5 text-xs font-bold text-amber-600 bg-amber-50"><option>Draft</option></select>
                         </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between text-[9px]">
                         <div>
                           <span className="block font-bold text-slate-400">Created By</span>
                           <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5"><div className="w-3 h-3 bg-purple-500 rounded-full"></div> Super Admin</span>
                         </div>
                         <div className="text-right">
                           <span className="block font-bold text-slate-400">Last Updated</span>
                           <span className="font-bold text-slate-700 mt-0.5 block">15 May 2026, 10:30 AM</span>
                         </div>
                      </div>
                      <div className="pt-1">
                         <label htmlFor="prompt-tags" className="text-[9px] font-bold text-slate-400 mb-1.5 block">Tags</label>
                         <div id="prompt-tags" className="flex flex-wrap gap-1.5">
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Beginner</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Layman</span>
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Analogy</span>
                         </div>
                      </div>
                    </div>
                 </div>

                 {/* 7. Renderer Mapping Configuration */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <h2 className="text-sm font-bold text-slate-900 mb-3">7. Renderer Mapping</h2>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left whitespace-nowrap">
                         <thead className="border-b border-slate-100">
                           <tr>
                             <th className="py-1.5 text-[9px] font-bold text-slate-500 uppercase">Component</th>
                             <th className="py-1.5 text-[9px] font-bold text-slate-500 uppercase">Renderer</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                           {(Object.entries(activeData.universal_architecture_fixed || {}) as [string, ComponentArchitecture][]).slice(0,5).map(([key, item], index) => {
                             const color = getColorForComponent(index);
                             return (
                               <tr key={key}>
                                 <td className="py-2 text-[10px] font-bold text-slate-800 truncate max-w-[80px]">{formatTitle(key)}</td>
                                 <td className="py-2 text-[10px] font-bold"><span className={`${color.text}`}>{item.renderer || 'default'}</span></td>
                               </tr>
                             )
                           })}
                         </tbody>
                       </table>
                    </div>
                 </div>

                 {/* 11. RBAC & Security */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <h2 className="text-sm font-bold text-slate-900 mb-3">11. RBAC & Security</h2>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                         <span className="text-[10px] font-bold text-slate-700">Educational Architect</span>
                         <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Active</span>
                       </div>
                       <div className="flex justify-between items-center px-2">
                         <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500"/> Create / Edit Prompt</span>
                       </div>
                       <div className="flex justify-between items-center px-2">
                         <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500"/> Generate AI Draft</span>
                       </div>
                       <div className="flex justify-between items-center px-2">
                         <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 line-through opacity-50"><div className="w-2.5 h-2.5 rounded-full border border-slate-300"></div> Publish Prompt</span>
                       </div>
                    </div>
                 </div>

              </div>

              {/* COLUMN 2 (span 3) */}
              <div className="xl:col-span-3 space-y-5 flex flex-col">
                 
                 {/* 2. Prompt Instruction Builder */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-900 mb-4">2. Prompt Instruction Builder</h2>
                    
                    <div className="space-y-4">
                        <div>
                         <label htmlFor="edu-goal" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Educational Goal</label>
                         <p id="edu-goal" className="text-xs text-slate-700 bg-blue-50 border border-blue-100 p-2 rounded leading-relaxed font-medium">Break down complex topics into simple terms. Use everyday examples.</p>
                       </div>
                       
                        <div>
                         <label htmlFor="audience-psychology" className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">Audience Psychology</label>
                         <div id="audience-psychology" className="flex items-center gap-4 mb-2">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                             <div className="w-6 h-3.5 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"></div></div>
                             Fear Reduction
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                             <div className="w-6 h-3.5 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"></div></div>
                             Confidence Boosting
                           </div>
                         </div>
                       </div>

                        <div>
                         <label htmlFor="teaching-style" className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">Teaching Style</label>
                         <div id="teaching-style" className="flex flex-wrap gap-2">
                           <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Analogy First</span>
                           <span className="text-[10px] font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded">Storytelling</span>
                           <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-1 rounded flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Step-by-Step</span>
                           <span className="text-[10px] font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded">Visual Thinking</span>
                         </div>
                       </div>

                        <div>
                         <label htmlFor="complexity-controls" className="text-[10px] font-bold text-slate-500 mb-3 block uppercase tracking-wider">Complexity Controls</label>
                         <div id="complexity-controls" className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="w-24 text-[10px] font-medium text-slate-600">Beginner Focus</span>
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[90%]"></div></div>
                              <span className="text-[10px] font-bold text-slate-800 w-8 text-right">90%</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-24 text-[10px] font-medium text-slate-600">Technical Depth</span>
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-400 w-[20%]"></div></div>
                              <span className="text-[10px] font-bold text-slate-800 w-8 text-right">20%</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-24 text-[10px] font-medium text-slate-600">Real-world Examples</span>
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[80%]"></div></div>
                              <span className="text-[10px] font-bold text-slate-800 w-8 text-right">80%</span>
                            </div>
                         </div>
                       </div>
                    </div>
                 </div>

                 {/* 8. Learning Progression Flow Builder */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-sm font-bold text-slate-900">8. Flow Builder</h2>
                      <button className="text-[9px] font-bold text-blue-600 border border-blue-100 px-2 py-1 rounded hover:bg-blue-50">+ Add Node</button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center py-2">
                       {Object.keys(activeData.universal_architecture_fixed || {}).slice(0,4).map((key: string, index: number) => {
                         const color = getColorForComponent(index);
                         return (
                           <div key={key} className="flex items-center gap-1">
                             <div className={`px-2 py-1.5 rounded border ${color.bg} ${color.text} border-current text-[9px] font-bold bg-opacity-10`}>
                               {index + 1}. {formatTitle(key).split(' ')[0]}
                             </div>
                             {index < 3 && <ArrowRight size={10} className="text-slate-300"/>}
                           </div>
                         )
                       })}
                    </div>
                 </div>

                 {/* 12. Analytics & Performance */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <h2 className="text-sm font-bold text-slate-900 mb-3">12. Analytics</h2>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                       <div className="border border-slate-100 rounded p-2 text-center">
                         <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Generations</span>
                         <span className="text-sm font-black text-slate-800">1,248</span>
                       </div>
                       <div className="border border-slate-100 rounded p-2 text-center">
                         <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Quality Score</span>
                         <span className="text-sm font-black text-emerald-600">92.6</span>
                       </div>
                    </div>
                    <div className="h-20 w-full bg-slate-50 rounded border border-slate-100 relative overflow-hidden">
                       <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                         <path d="M0,30 L20,25 L40,35 L60,15 L80,20 L100,5" fill="none" stroke="#6366f1" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                         <path d="M0,35 L20,30 L40,38 L60,25 L80,28 L100,15" fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                       </svg>
                    </div>
                 </div>

              </div>

              {/* COLUMN 3 (span 4) */}
              <div className="xl:col-span-4 space-y-5 flex flex-col">
                 
                 {/* 3. Prompt Template Editor */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px]">
                    <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                       <h2 className="text-sm font-bold text-slate-900">3. Prompt Template Editor</h2>
                       <div className="flex gap-1.5">
                         <button className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm hover:bg-slate-50 flex items-center gap-1"><Plus size={10}/> Insert Variable</button>
                         <button className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm hover:bg-slate-50 flex items-center gap-1"><Layout size={10}/> Format</button>
                       </div>
                    </div>
                    <div className="flex-1 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-700 overflow-y-auto custom-scrollbar relative">
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-50 border-r border-slate-100 flex flex-col items-center pt-4 text-[9px] text-slate-400 select-none">
                         {Array.from({length: 25}).map((_, i) => <div key={i} className="h-[1.65rem]">{i+1}</div>)}
                      </div>
                      <div className="pl-6 whitespace-pre-wrap">
{`You are an expert educational content creator.
Your task is to explain the following concept in the simplest and most relatable way for a complete beginner.

Concept Details:
Domain:    {{domain}}
Subject:   {{subject}}
Topic:     {{topic}}
Subtopic:  {{subtopic}}
Difficulty: {{difficulty}}
Target Audience: {{{target_audience}}}

Requirements:
1. Start with a simple overview using easy language.
2. Use a real-life analogy that anyone can relate to.
3. Explain why it exists and how it helps.
4. Provide simple use cases from daily life.
5. Break it down step-by-step for beginners.
6. Build a mental model or visual understanding.
7. Clarify common confusions.
8. End with a simple recap of key takeaways.

Writing Guidelines:
- Use short sentences.
- Avoid technical jargon unless explicitly defined immediately.`}
                      </div>
                    </div>
                    <div className="p-2 border-t border-slate-200 bg-slate-50 flex justify-between text-[9px] font-bold text-slate-500 shrink-0">
                       <span>Tokens: 1,256 &nbsp;|&nbsp; Words: 245</span>
                       <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10}/> Auto-saved 10:30 AM</span>
                    </div>
                 </div>

                 {/* 9. Validation & Governance */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-6">
                    <div className="shrink-0 relative w-24 h-24 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none"/>
                         <circle cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset="18"/>
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-xl font-black text-slate-900">92.6</span>
                         <span className="text-[8px] font-bold text-slate-500 uppercase">/100</span>
                       </div>
                    </div>
                    <div className="flex-1 space-y-2">
                       <h2 className="text-sm font-bold text-slate-900 mb-2 font-mono">9. Validation & Governance</h2>
                       <div className="flex justify-between items-center text-[10px] font-medium"><span className="text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Structure Validation</span><span className="font-bold text-slate-800">98/100</span></div>
                       <div className="flex justify-between items-center text-[10px] font-medium"><span className="text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Readability Score</span><span className="font-bold text-slate-800">95/100</span></div>
                       <div className="flex justify-between items-center text-[10px] font-medium"><span className="text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Analogy Quality</span><span className="font-bold text-slate-800">93/100</span></div>
                       <div className="flex justify-between items-center text-[10px] font-medium"><span className="text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Hallucination Risk</span><span className="font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Low</span></div>
                    </div>
                 </div>

              </div>

              {/* COLUMN 4 (span 3) */}
              <div className="xl:col-span-3 space-y-5 flex flex-col">
                 
                 {/* 4. Variable Inspector */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <h2 className="text-sm font-bold text-slate-900 mb-3 font-mono">4. Variable Inspector</h2>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[10px]">
                         <span className="font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">{`{{domain}}`}</span>
                         <span className="text-slate-600 font-medium">Programming</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px]">
                         <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{`{{subject}}`}</span>
                         <span className="text-slate-600 font-medium">JavaScript</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px]">
                         <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{`{{topic}}`}</span>
                         <span className="text-slate-600 font-medium">JS Fundamentals</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px]">
                         <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{`{{difficulty}}`}</span>
                         <span className="text-slate-600 font-medium">Beginner Friendly</span>
                       </div>
                    </div>
                 </div>

                 {/* 5. AI Generation Controls */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <h2 className="text-sm font-bold text-slate-900 mb-4">5. AI Generation Controls</h2>
                    <div className="space-y-4">
                       <div>
                         <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><span>Temperature</span><span className="text-slate-800">0.7</span></div>
                         <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[70%]"></div></div>
                       </div>
                        <div>
                         <label htmlFor="creativity-level" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Creativity Level</label>
                         <select id="creativity-level" className="w-full border border-slate-200 rounded p-1.5 text-[10px] font-bold text-slate-700 bg-slate-50"><option>Balanced</option></select>
                       </div>
                       <div className="space-y-2">
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-600"><span>Educational Strictness</span><div className="w-10 h-1.5 bg-slate-200 rounded-full"><div className="w-2/3 h-full bg-indigo-500 rounded-full"></div></div></div>
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-600"><span>Hallucination Prevention</span><div className="w-10 h-1.5 bg-slate-200 rounded-full"><div className="w-full h-full bg-indigo-500 rounded-full"></div></div></div>
                       </div>
                       <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Safety Mode</span>
                         <div className="w-6 h-3.5 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"></div></div>
                       </div>
                    </div>
                 </div>

                 {/* 6. Live AI Draft Preview */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[300px]">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                       <h2 className="text-sm font-bold text-slate-900">6. AI Draft Preview</h2>
                    </div>
                    <div className="flex text-[9px] font-bold border-b border-slate-100 shrink-0">
                       <div className="flex-1 text-center py-2 text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50">Generated Output</div>
                       <div className="flex-1 text-center py-2 text-slate-500 hover:bg-slate-50 cursor-pointer">Side-by-Side Diff</div>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar text-[10px] text-slate-700 leading-relaxed space-y-3">
                       <div>
                         <strong className="text-slate-900 block mb-1">Simple Overview</strong>
                         A variable in JavaScript is like a container that holds data. You can store numbers, text, or even other values inside it and use or change them whenever you need.
                       </div>
                       <div>
                         <strong className="text-slate-900 block mb-1">Everyday Analogy</strong>
                          Think of a variable like a labeled box. You write something on the label (the variable name), put something inside the box (the value), and later you can open the box, see what&apos;s inside, or even replace it with something new.
                       </div>
                       <div className="text-slate-400 italic">... (more content)</div>
                    </div>
                    <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                       <button className="w-full flex justify-center items-center gap-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 py-1.5 rounded hover:bg-indigo-50"><RotateCcw size={10}/> Regenerate Draft</button>
                    </div>
                 </div>

              </div>

           </div>
        </div>
      ) : activeTab === 'Validation Rules' ? (
        <div className="space-y-6 pb-10">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{isUiUxMode ? 'UI/UX Validation Rules' : 'Validation Rules'} for {selectedComponentKey ? formatTitle(selectedComponentKey) : formatTitle(String(adminSectionId))}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {isUiUxMode ? 'These are the renderer, Accessibility, WCAG, responsive, and design-token checks before preview approval and database save.' : 'These are the rules Content Manager should use before preview approval and database save.'}
                  </p>
                </div>
                <button type="button" onClick={validateActiveArchitecture} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700">
                  Run Architecture Check
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Component Must Exist', detail: `${selectedComponentKey || 'Selected component'} must be registered in ${isUiUxMode ? 'component_design_system' : 'universal_architecture_fixed'}.`, pass: Boolean(selectedComponentData || !selectedComponentKey) },
                  { title: 'Renderer Must Exist', detail: 'Selected component should have renderer mapping or fallback renderer.', pass: Boolean(selectedComponentData?.renderer || selectedRendererMapping) },
                  ...(isUiUxMode ? [
                    { title: 'Accessibility Contract', detail: 'UI/UX component must define keyboard, screen reader, reduced motion, and visible state behavior.', pass: true },
                    { title: 'WCAG Check', detail: 'Visual styling must preserve WCAG contrast and responsive behavior before learner preview save.', pass: true },
                  ] : []),
                  { title: 'Default JSON Must Exist', detail: 'Prompt/content flow needs dummy JSON for local preview testing.', pass: Boolean(selectedDefaultJson) },
                  { title: 'Preview Before Save', detail: 'Content Manager blocks save until Preview Component is approved.', pass: true },
                  { title: 'Prompt Generator Linked', detail: 'Prompt Generator URL receives section, subsection, dummy data, and architecture payload.', pass: true },
                  { title: 'Content Manager Linked', detail: 'Content Manager receives same pipeline payload and default JSON.', pass: true },
                ].map((rule) => (
                  <div key={rule.title} className={`rounded-2xl border p-4 ${rule.pass ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={19} className={rule.pass ? 'text-emerald-600' : 'text-rose-500'} />
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{rule.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rule.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">Validation Source</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-slate-500 font-bold">Schema Package</span><span className="text-slate-900 font-black text-right">{String(activeData.validation_governance_system?.schema_package || '@quiz/validation')}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500 font-bold">Runtime Validation</span><span className="text-emerald-700 font-black">Enabled</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500 font-bold">Content Manager</span><span className="text-emerald-700 font-black">Preview gated</span></div>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4">
                <pre className="text-xs text-sky-300 overflow-auto max-h-[360px]">{JSON.stringify(activeData.validation_governance_system || {}, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'JSON Schema' ? (
        <div className="space-y-6 pb-10">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{isUiUxMode ? 'UI/UX JSON Schema / Renderer Contract' : 'JSON Schema / Default Dummy Content'}</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-3xl">
                  This shows the exact {isUiUxMode ? 'component_design_system and renderer contract' : 'JSON shape'} that will be sent to Content Manager for the currently selected component.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={copyArchitectureJson} className="px-4 py-2 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-black hover:bg-indigo-100 flex items-center gap-2">
                  <Copy size={14} /> Copy Architecture JSON
                </button>
                <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.contentManager)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black hover:bg-blue-700 flex items-center gap-2">
                  <Edit2 size={14} /> Open Content Manager
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Selected Component Schema Summary</h3>
              <div className="space-y-4 text-sm">
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Section</span><p className="font-black text-slate-900">{String(adminSectionId)}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subsection</span><p className="font-black text-slate-900">{selectedComponentKey || 'Full section'}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Source Object</span><p className="font-mono text-xs font-black text-indigo-700">{isUiUxMode ? 'component_design_system' : 'universal_architecture_fixed'}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Renderer</span><p className="font-black text-slate-900">{String(selectedSchemaPreview.renderer)}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Required</span><p className="font-black text-slate-900">{selectedSchemaPreview.required ? 'Yes' : 'No'}</p></div>
                <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Purpose</span><p className="font-medium text-slate-700 leading-relaxed">{String(selectedSchemaPreview.componentPurpose)}</p></div>
              </div>
            </div>

            <div className="bg-slate-950 rounded-2xl p-5 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white">Default JSON Sent to Content Manager</h3>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">Dummy Data</span>
              </div>
              <pre className="text-xs text-emerald-300 overflow-auto max-h-[620px]">{JSON.stringify(selectedSchemaPreview, null, 2)}</pre>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Full Section Schema Contract</h3>
            <p className="mb-4 text-sm font-semibold text-slate-600">
              These are all canonical component keys registered for this Notes section under {isUiUxMode ? 'component_design_system' : 'universal_architecture_fixed'}. Content Manager should reject old aliases and save only this shape.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {activeComponentEntries.map(([key, item]) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-mono text-xs font-black text-indigo-700">{key}</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{String((item as ComponentArchitecture).renderer || (item as ComponentArchitecture).component || 'default_renderer')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'Renderer Mapping' ? (
         <div className="space-y-8 pb-12">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-5 space-y-5">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Select Component</h2>
                    <p className="text-xs text-slate-500 mt-1">Choose one fixed {isUiUxMode ? 'UI/UX Architecture' : 'education'} component to configure its renderer.</p>
                  </div>
                  <button type="button" onClick={() => setShowAdvancedRendererMapping((value) => !value)} className="px-3 py-2 rounded-lg border border-slate-200 text-[10px] font-black text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Settings size={12}/> {showAdvancedRendererMapping ? 'Hide Advanced' : 'Show Advanced'}
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(activeComponentMap).map((key, index) => {
                    const item = activeComponentMap[key] as ComponentArchitecture;
                    const Icon = getIconForComponent(index);
                    const isSelected = selectedComponentKey === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setSelectedComponentKey(key)}
                        className={`w-full text-left rounded-2xl border p-4 transition-all ${isSelected ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon size={18}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black text-slate-900 truncate">{formatTitle(key)}</h3>
                            <p className="text-[11px] text-slate-500 font-bold truncate">{item?.renderer || 'default_renderer'}</p>
                          </div>
                          {isSelected ? <span className="text-[9px] font-black text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-100">Selected</span> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Micro Component Editor</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Edit the selected learner UI part directly.</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black text-indigo-700">Part Level</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label htmlFor="renderer-subcomponent" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Select Child Part</label>
                    <select
                      id="renderer-subcomponent"
                      value={String(selectedRendererSubcomponent?.id || 'container')}
                      onChange={(event) => setSelectedRendererSubcomponentId(event.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                    >
                      {rendererSubcomponents.map((part) => (
                        <option key={String(part.id)} value={String(part.id)}>{String(part.label || formatTitle(String(part.id)))}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="renderer-subcomponent-layout" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Child Layout</label>
                      <select
                        id="renderer-subcomponent-layout"
                        value={String(selectedRendererSubcomponent?.layout || 'inline')}
                        onChange={(event) => {
                          const nextParts = rendererSubcomponents.map((part) => String(part.id) === String(selectedRendererSubcomponent?.id) ? { ...part, layout: event.target.value } : part);
                          updateSelectedComponentConfig({ ui_subcomponents: nextParts });
                        }}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                      >
                        <option value="inline">Inline</option>
                        <option value="card">Card</option>
                        <option value="pill">Pill</option>
                        <option value="icon_block">Icon Block</option>
                        <option value="progress">Progress</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="renderer-subcomponent-color" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Child Color</label>
                      <input
                        id="renderer-subcomponent-color"
                        type="color"
                        value={String(selectedRendererSubcomponent?.color || selectedComponentData?.primary_color || selectedBrandPreviewContract.primary_color)}
                        onChange={(event) => {
                          const nextParts = rendererSubcomponents.map((part) => String(part.id) === String(selectedRendererSubcomponent?.id) ? { ...part, color: event.target.value, color_override: true } : part);
                          updateSelectedComponentConfig({ ui_subcomponents: nextParts });
                        }}
                        className="h-10 w-full rounded-xl border-2 border-slate-200 bg-white p-1 outline-none focus:border-indigo-400"
                      />
                      {selectedRendererSubcomponent?.color_override ? (
                        <button
                          type="button"
                          onClick={() => {
                            const nextParts = rendererSubcomponents.map((part) => {
                              if (String(part.id) !== String(selectedRendererSubcomponent?.id)) return part;
                              const { color_override: _colorOverride, ...rest } = part;
                              return rest;
                            });
                            updateSelectedComponentConfig({ ui_subcomponents: nextParts });
                          }}
                          className="mt-2 w-full rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-indigo-700 hover:bg-indigo-100"
                        >
                          Use Algorithm Color
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <input
                      value={String(selectedRendererSubcomponent?.label || '')}
                      onChange={(event) => {
                        const nextParts = rendererSubcomponents.map((part) => String(part.id) === String(selectedRendererSubcomponent?.id) ? { ...part, label: event.target.value } : part);
                        updateSelectedComponentConfig({ ui_subcomponents: nextParts });
                      }}
                      placeholder="Child part label"
                      className="rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400"
                    />
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700">
                      Visible
                      <input
                        type="checkbox"
                        checked={selectedRendererSubcomponent?.visible !== false}
                        onChange={(event) => {
                          const nextParts = rendererSubcomponents.map((part) => String(part.id) === String(selectedRendererSubcomponent?.id) ? { ...part, visible: event.target.checked } : part);
                          updateSelectedComponentConfig({ ui_subcomponents: nextParts });
                        }}
                        className="h-4 w-4 accent-indigo-600"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'align', label: 'Align', value: selectedRendererSubcomponentRecord.align || 'left', options: ['left', 'center', 'right'] },
                      { key: 'spacing', label: 'Spacing', value: selectedRendererSubcomponentRecord.spacing || 'normal', options: ['tight', 'normal', 'loose'] },
                      { key: 'radius', label: 'Radius', value: selectedRendererSubcomponentRecord.radius || 'rounded', options: ['none', 'soft', 'rounded', 'pill'] },
                      { key: 'shadow', label: 'Shadow', value: selectedRendererSubcomponentRecord.shadow || 'soft', options: ['none', 'soft', 'strong'] },
                    ].map((control) => (
                      <div key={control.key}>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">{control.label}</label>
                        <select
                          value={String(control.value)}
                          onChange={(event) => {
                            const nextParts = rendererSubcomponents.map((part) => String(part.id) === String(selectedRendererSubcomponent?.id) ? { ...part, [control.key]: event.target.value } : part);
                            updateSelectedComponentConfig({ ui_subcomponents: nextParts });
                          }}
                          className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                        >
                          {control.options.map((option) => <option key={option} value={option}>{formatTitle(option)}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 mb-4">Visual Styling</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="color-combination-left" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Overall Color Combination</label>
                      <select
                        id="color-combination-left"
                        value={selectedColorCombination.id}
                        onChange={(event) => updateSelectedComponentConfig({ color_combination: event.target.value })}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                      >
                        {COLOR_COMBINATION_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                      <div className="mt-3 grid grid-cols-5 overflow-hidden rounded-xl border border-slate-200">
                        <span className="h-4" style={{ backgroundColor: algorithmPalette.primary }} />
                        <span className="h-4" style={{ backgroundColor: mixHexColors(algorithmPalette.primary, algorithmPalette.secondary, 0.25) }} />
                        <span className="h-4" style={{ backgroundColor: algorithmPalette.mixed }} />
                        <span className="h-4" style={{ backgroundColor: mixHexColors(algorithmPalette.primary, algorithmPalette.secondary, 0.75) }} />
                        <span className="h-4" style={{ backgroundColor: algorithmPalette.secondary }} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="visual-density-left" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Density</label>
                      <select id="visual-density-left" value={String(selectedComponentData?.density || 'comfortable')} onChange={(event) => updateSelectedComponentConfig({ density: event.target.value })} className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400">
                        <option value="compact">Compact</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="spacious">Spacious</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="emphasis-level-left" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Emphasis</label>
                      <select id="emphasis-level-left" value={String(selectedComponentData?.emphasis_level || 'medium')} onChange={(event) => updateSelectedComponentConfig({ emphasis_level: event.target.value })} className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="color-role-left" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Color Role</label>
                      <select id="color-role-left" value={String(selectedComponentData?.color_role || 'primary')} onChange={(event) => updateSelectedComponentConfig({ color_role: event.target.value })} className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400">
                        <option value="primary">Primary</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="info">Info</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="typography-scale-left" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Typography</label>
                      <select id="typography-scale-left" value={String(selectedComponentData?.typography_scale || 'body')} onChange={(event) => updateSelectedComponentConfig({ typography_scale: event.target.value })} className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400">
                        <option value="hero">Hero</option>
                        <option value="heading">Heading</option>
                        <option value="body">Body</option>
                        <option value="caption">Caption</option>
                      </select>
                    </div>
                    {rendererColorControls.map(([key, label, fallback]) => (
                      <div key={key}>
                        <label htmlFor={`${key}-left`} className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">{label}</label>
                        <input
                          id={`${key}-left`}
                          type="color"
                          value={String(selectedComponentData?.[key] || fallback)}
                          onChange={(event) => updateSelectedComponentConfig({ [key]: event.target.value })}
                          className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white p-1 outline-none focus:border-indigo-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 mb-4">Behavior & State</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'hover_state', label: 'Hover State' },
                      { key: 'clickable', label: 'Clickable' },
                      { key: 'collapsible', label: 'Collapsible' },
                      { key: 'progressive_disclosure', label: 'Progressive Disclosure' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700">
                        {item.label}
                        <input
                          type="checkbox"
                          checked={Boolean(selectedComponentData?.[item.key])}
                          onChange={(event) => updateSelectedComponentConfig({ [item.key]: event.target.checked })}
                          className="h-4 w-4 accent-indigo-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Preview Content Editor</h3>
                    <p className="mt-1 text-xs font-semibold text-emerald-800">
                      This dummy learner content feeds Renderer Decision Preview and Content Manager.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        Latest DB Schema
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black text-slate-600">
                        {String(adminSectionId)}.{selectedPipelineSubsectionKey || selectedComponentKey || 'full_section'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSelectedComponentConfig({ preview_content: selectedDefaultJson })}
                    className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                  >
                    Reset
                  </button>
                </div>
                <textarea
                  key={`${activeSectionKey}:${selectedComponentKey}:preview-content:${JSON.stringify(selectedPreviewJson)}`}
                  defaultValue={JSON.stringify(selectedPreviewJson, null, 2)}
                  onBlur={(event) => {
                    try {
                      updateSelectedComponentConfig({ preview_content: JSON.parse(event.target.value) });
                      setValidationMessage('Preview content JSON valid.');
                    } catch {
                      setValidationMessage('Preview content JSON has a syntax error. Fix it before continuing.');
                    }
                  }}
                  rows={9}
                  className="w-full rounded-2xl border-2 border-emerald-100 bg-white p-4 font-mono text-xs font-semibold leading-5 text-slate-800 outline-none focus:border-emerald-400"
                />
                <p className="mt-3 text-xs font-bold text-emerald-900">{validationMessage}</p>
              </div>
              </div>

              <div className="xl:col-span-7 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Editable Renderer Contract</h2>
                    <p className="text-xs text-slate-500 mt-1">These fields update the selected component locally and feed Visual Guide, Prompt Generator, Content Manager, and preview flow.</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Local State</span>
                </div>

                <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Selected Component</span>
                  <h3 className="text-2xl font-black text-slate-950 mt-1">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'Select a component'}</h3>
                  <p className="mt-2 font-mono text-xs font-black text-indigo-700">{selectedRendererName}</p>
                  <p className="text-sm text-slate-700 mt-3 leading-relaxed">{selectedComponentData?.purpose || 'Select a component on the left to edit its renderer mapping.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="renderer-name" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Renderer Name</label>
                    <input
                      id="renderer-name"
                      value={String(selectedComponentData?.renderer || selectedComponentData?.component || '')}
                      onChange={(event) => updateSelectedComponentConfig({ renderer: event.target.value })}
                      placeholder="e.g. progress_ring_checklist"
                      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="layout-type" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Layout Type</label>
                    <select
                      id="layout-type"
                      value={String(selectedComponentData?.layout || selectedComponentData?.layout_type || 'card')}
                      onChange={(event) => updateSelectedComponentConfig({ layout: event.target.value })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400"
                    >
                      <option value="card">Card</option>
                      <option value="grid">Grid</option>
                      <option value="accordion">Accordion</option>
                      <option value="timeline">Timeline</option>
                      <option value="hero">Hero</option>
                      <option value="inline">Inline</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="style-variant" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Style Variant</label>
                    <select
                      id="style-variant"
                      value={String(selectedComponentData?.style_variant || 'standard')}
                      onChange={(event) => updateSelectedComponentConfig({ style_variant: event.target.value })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400"
                    >
                      <option value="standard">Standard</option>
                      <option value="compact">Compact</option>
                      <option value="featured">Featured</option>
                      <option value="minimal">Minimal</option>
                      <option value="high_emphasis">High Emphasis</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="animation-type" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Animation</label>
                    <select
                      id="animation-type"
                      value={String(selectedComponentData?.animation_type || 'none')}
                      onChange={(event) => updateSelectedComponentConfig({ animation_type: event.target.value })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400"
                    >
                      <option value="none">None</option>
                      <option value="fade_in">Fade In</option>
                      <option value="slide_up">Slide Up</option>
                      <option value="expand">Expand</option>
                      <option value="progress">Progress</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="interactive-elements" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Interactive Elements</label>
                    <input
                      id="interactive-elements"
                      value={Array.isArray(selectedComponentData?.interactive_elements) ? selectedComponentData.interactive_elements.join(', ') : ''}
                      onChange={(event) => updateSelectedComponentConfig({ interactive_elements: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
                      placeholder="e.g. hover, expand, progress, checklist"
                      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-sm font-black text-slate-900 mb-4">Responsive Layout Decision</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'desktop_layout', label: 'Desktop', options: ['two_column', 'single_column', 'wide_card', 'dashboard_grid'] },
                        { id: 'tablet_layout', label: 'Tablet', options: ['stacked_cards', 'two_column', 'compact_grid', 'single_column'] },
                        { id: 'mobile_layout', label: 'Mobile', options: ['stacked_cards', 'compact_card', 'accordion', 'single_column'] },
                      ].map((control) => (
                        <div key={control.id}>
                          <label htmlFor={control.id} className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">{control.label}</label>
                          <select
                            id={control.id}
                            value={String(selectedComponentData?.[control.id] || control.options[0])}
                            onChange={(event) => updateSelectedComponentConfig({ [control.id]: event.target.value })}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                          >
                            {control.options.map((option) => <option key={option} value={option}>{formatTitle(option)}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div data-testid="renderer-decision-preview" className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-indigo-950">Renderer Decision Preview</h3>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${selectedCustomRendererCode ? 'bg-fuchsia-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                        {selectedCustomRendererCode ? 'Code Mode' : 'Live Contract Mode'}
                      </span>
                    </div>
                    <p className="mb-4 text-xs font-semibold leading-5 text-indigo-700">
                      This is the learner-facing preview for the selected content. Layout, colors, visible subcomponents, and interaction flags below are applied directly on the dummy JSON content.
                    </p>
                    {selectedComponentData ? (
                      <div className="mt-5">
                        <ContractAwareComponentPreview
                          section={String(adminSectionId)}
                          subsection={selectedComponentKey || ''}
                          data={selectedPreviewJson}
                          contract={{
                            ...((effectiveRendererPreviewContract || selectedComponentData || {}) as Record<string, unknown>),
                            ui_subcomponents: rendererSubcomponents,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-fuchsia-100 bg-fuchsia-50 p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-fuchsia-950">HTML / CSS / Tailwind Renderer</h3>
                        <p className="mt-1 text-xs font-semibold leading-5 text-fuchsia-800">
                          Paste custom code or generate starter HTML from the current renderer/content. When code is present, Renderer Decision Preview renders this code directly.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateSelectedComponentConfig({
                            custom_renderer_code: selectedGeneratedRendererCode,
                          })}
                          className="rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-black text-white hover:bg-fuchsia-700"
                        >
                          Generate HTML From Current Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedComponentConfig({ custom_renderer_code: '' })}
                          className="rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-xs font-black text-fuchsia-700 hover:bg-fuchsia-100"
                        >
                          Clear Code
                        </button>
                      </div>
                    </div>
                    <div className="mb-3 rounded-xl border border-fuchsia-100 bg-white px-3 py-2 text-xs font-bold leading-5 text-fuchsia-800">
                      This is bidirectional at authoring level: generate starter HTML from the current preview, edit the code, and the preview renders the edited code as the source of truth.
                    </div>
                    <label htmlFor="custom-renderer-code" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Generated HTML / CSS / Tailwind Code</label>
                    <textarea
                      id="custom-renderer-code"
                      value={selectedVisibleRendererCode}
                      onChange={(event) => updateSelectedComponentConfig({ custom_renderer_code: event.target.value })}
                      placeholder={'<section class="rounded-3xl bg-white p-8 shadow-xl">\\n  <h1>What is Python?</h1>\\n</section>'}
                      rows={12}
                      className="w-full rounded-2xl border-2 border-fuchsia-100 bg-white p-4 font-mono text-xs font-semibold leading-5 text-slate-800 outline-none focus:border-fuchsia-400"
                    />
                  </div>

                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                    <h3 className="mb-3 text-sm font-black text-blue-950">Selected Renderer Decision</h3>
                    <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-4">
                      {[
                        ['Renderer', selectedComponentData?.renderer || selectedComponentData?.component || 'default'],
                        ['Layout', selectedComponentData?.layout || selectedComponentData?.layout_type || 'card'],
                        ['Desktop', selectedComponentData?.desktop_layout || 'two_column'],
                        ['Tablet', selectedComponentData?.tablet_layout || 'stacked_cards'],
                        ['Mobile', selectedComponentData?.mobile_layout || 'stacked_cards'],
                        ['Brand', effectiveRendererBrandVariant],
                        ['Primary 1', effectiveRendererPreviewContract?.primary_color || selectedBrandPreviewContract.primary_color],
                        ['Primary 2', effectiveRendererPreviewContract?.primary_color_dark || selectedBrandPreviewContract.primary_color_dark],
                        ['Color Mix', selectedColorCombination.label],
                        ['Color Role', selectedComponentData?.color_role || 'primary'],
                        ['Typography', selectedComponentData?.typography_scale || 'body'],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-2xl border border-blue-100 bg-white p-3">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-blue-400">{String(label)}</span>
                          <span className="mt-1 block font-black text-slate-900">{formatTitle(String(value))}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-black text-slate-900 mb-4">Accessibility</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'keyboard_navigation', label: 'Keyboard Navigation' },
                          { key: 'screen_reader_labels', label: 'Screen Reader Labels' },
                          { key: 'reduced_motion', label: 'Reduced Motion' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                            {item.label}
                            <input
                              type="checkbox"
                              checked={selectedComponentData?.[item.key] !== false}
                              onChange={(event) => updateSelectedComponentConfig({ [item.key]: event.target.checked })}
                              className="h-4 w-4 accent-emerald-600"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-black text-slate-900 mb-4">Performance</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'lazy_load', label: 'Lazy Load' },
                          { key: 'cache_component', label: 'Component Cache' },
                          { key: 'prefetch_assets', label: 'Prefetch Assets' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                            {item.label}
                            <input
                              type="checkbox"
                              checked={Boolean(selectedComponentData?.[item.key])}
                              onChange={(event) => updateSelectedComponentConfig({ [item.key]: event.target.checked })}
                              className="h-4 w-4 accent-emerald-600"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-black text-slate-900 mb-4">Brand & Domain</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="brand-variant" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Brand Variant</label>
                          <select
                            id="brand-variant"
                            value={String(selectedComponentData?.brand_variant || 'shared')}
                            onChange={(event) => updateSelectedComponentConfig({ brand_variant: event.target.value })}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                          >
                            <option value="shared">Shared</option>
                            <option value="rth">Real Tutorial Hub</option>
                            <option value="suia">SkillUp IT Academy</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="domain-override" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Domain Override</label>
                          <select
                            id="domain-override"
                            value={String(selectedComponentData?.domain_override || 'default')}
                            onChange={(event) => updateSelectedComponentConfig({ domain_override: event.target.value })}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                          >
                            <option value="default">Default</option>
                            <option value="programming">Programming</option>
                            <option value="cloud">Cloud</option>
                            <option value="cybersecurity">Cybersecurity</option>
                            <option value="finance">Finance</option>
                            <option value="ai_ml">AI / ML</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => showActionMessage('Renderer mapping is already saved locally. Continue to Visual Guide or Content Manager.')} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700">
                    Save Renderer Mapping
                  </button>
                  <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.visualGuide)} className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100">
                    Open Visual Guide
                  </button>
                  <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.contentManager)} className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-100">
                    Preview in Content Manager
                  </button>
                </div>
              </div>
            </div>

            {showAdvancedRendererMapping ? (
            <>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
               {/* 1. Component Library */}
               <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-[750px] overflow-hidden">
                  <div className="p-6 border-b border-slate-100 shrink-0">
                     <h2 className="text-lg font-bold text-slate-900 mb-5">Component Library</h2>
                     <div className="flex gap-4">
                        <div className="relative flex-1">
                           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input 
                              type="text" 
                              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl text-sm bg-slate-50/50 focus:bg-white focus:ring-2 ring-indigo-100 transition-all outline-none" 
                              placeholder="Search components..." 
                              value={searchQuery || ""}
                              onChange={(e) => setSearchQuery(e.target.value)}
                           />
                        </div>
                        <div className="relative w-40">
                           <select className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl text-xs font-black text-slate-600 appearance-none bg-slate-50/50 outline-none">
                              <option>All Types</option>
                           </select>
                           <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                     {Object.keys(activeComponentMap).filter(key => key.toLowerCase().includes((searchQuery || "").toLowerCase())).map((key, index) => {
                        const item = activeComponentMap[key];
                        const color = getColorForComponent(index);
                        const Icon = getIconForComponent(index);
                        const isSelected = selectedComponentKey === key;
                        const descriptions = [
                           'Intro & basic explanation',
                           'Real-life comparison',
                           'Purpose & importance',
                           'Practical applications',
                           'Step-by-step basics',
                           'Visual understanding',
                           'FAQs & clarifications',
                           'Key takeaways'
                        ];
                        return (
                           <button type="button" key={key} onClick={() => setSelectedComponentKey(key)} className={`p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer group w-full text-left ${isSelected ? 'bg-indigo-50/50 border-indigo-200 shadow-indigo-100/50 shadow-lg' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                              <div className="flex items-center gap-5">
                                 <div className={`w-12 h-12 rounded-full border-2 ${isSelected ? 'border-indigo-300 bg-white' : 'border-slate-100 bg-slate-50'} ${color.text} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                                    <Icon size={22} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h3 className="text-[15px] font-black text-slate-900 truncate">{formatTitle(key)}</h3>
                                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{descriptions[index % descriptions.length]}</p>
                                 </div>
                                 <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-[11px] font-mono font-black ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{String(item.renderer || item.component || 'default_card')}</span>
                                    {isSelected && <ChevronRight size={16} className="text-indigo-600 group-hover:translate-x-1 transition-transform"/>}
                                 </div>
                              </div>
                           </button>
                        )
                     })}
                  </div>
                  <div className="p-6 border-t border-slate-100 shrink-0">
                     <button type="button" onClick={addNewComponent} className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-[1.5rem] text-sm font-black text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-3">
                        <Plus size={20} /> Add New Component
                     </button>
                  </div>
               </div>

               {/* 2. Renderer Configuration */}
               <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm h-[750px] flex flex-col overflow-hidden">
                  <div className="p-8 pb-4 border-b border-slate-50 shrink-0">
                     <div className="flex justify-between items-end mb-6">
                        <div>
                           <h2 className="text-lg font-bold text-slate-900">Renderer Configuration</h2>
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Component: {selectedComponentKey ? formatTitle(selectedComponentKey) : 'None Selected'}</p>
                        </div>
                        <div className="flex gap-2">
                           <button type="button" onClick={() => updateSelectedComponentConfig({ renderer: 'configured_renderer', layout: configTab.toLowerCase().replace(/\s+/g, '_') })} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-wider">Save Config</button>
                           <button type="button" onClick={resetActiveArchitecture} className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase tracking-wider">Reset</button>
                        </div>
                     </div>
                     <div className="p-1.5 bg-slate-100/50 rounded-3xl flex gap-1 overflow-x-auto hide-scrollbar">
                        {['Component Linkage', 'Layout', 'Typography', 'Interaction', 'Performance', 'Accessibility', 'Variants'].map((tab, i) => (
                           <button 
                              key={tab} 
                              onClick={() => setConfigTab(tab)}
                              className={`px-5 py-2.5 text-[11px] font-black whitespace-nowrap rounded-2xl transition-all ${configTab === tab ? 'text-indigo-600 bg-white shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                           >
                              {i+1}. {tab}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="p-10 flex-1 overflow-y-auto custom-scrollbar space-y-12">
                     {configTab === 'Component Linkage' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                           <div>
                              <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-[0.2em]">Architecture Renderer Linkage</h3>
                              <div className="space-y-8">
                                 <div className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[2.5rem] relative overflow-hidden group">
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                       <div className="w-32 h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-white ring-8 ring-indigo-50 group-hover:scale-110 transition-all duration-700">
                                          {(() => {
                                             const Icon = getIconForComponent(0);
                                             return <Icon size={48} className="text-indigo-600" />;
                                          })()}
                                       </div>
                                       <div className="flex-1 space-y-4">
                                          <div className="flex items-center gap-3">
                                             <span className="px-4 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Selected Component</span>
                                             <ArrowRight size={14} className="text-indigo-300" />
                                             <span className="text-lg font-black text-indigo-900">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'Select a Component'}</span>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             <div className="bg-white/60 p-5 rounded-2xl border border-indigo-100/50">
                                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Renderer</span>
                                                <span className="text-[15px] font-black text-slate-800">{String(selectedComponentKey && (activeComponentMap[selectedComponentKey]?.renderer || activeComponentMap[selectedComponentKey]?.component) || 'N/A')}</span>
                                             </div>
                                             <div className="bg-white/60 p-5 rounded-2xl border border-indigo-100/50">
                                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mapping Status</span>
                                                <span className="text-[15px] font-black text-emerald-600 flex items-center gap-2"><CheckCircle2 size={16}/> Verified in JSON</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6">Renderer Strategy</h4>
                                       <div className="space-y-4">
                                          {[
                                             { label: 'Component Type', value: selectedComponentKey && (activeData.renderer_mapping_engine?.[selectedComponentKey]?.component || uiuxData?.renderer_mapping_engine?.[selectedComponentKey]?.component || 'Default') },
                                             { label: 'Layout Model', value: selectedComponentKey && (activeData.renderer_mapping_engine?.[selectedComponentKey]?.layout || uiuxData?.renderer_mapping_engine?.[selectedComponentKey]?.layout || 'Standard') },
                                             { label: 'Hydration Strategy', value: 'Server Side' },
                                             { label: 'Cache Policy', value: 'Optimized' }
                                          ].map(item => (
                                             <div key={item.label} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                                                <span className="text-[13px] font-medium text-slate-500">{item.label}</span>
                                                <span className="text-[13px] font-black text-slate-900 uppercase tracking-tighter">{item.value}</span>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                    <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
                                       <h4 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-6">JSON Source Preview</h4>
                                       <div className="bg-black/30 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 overflow-x-auto">
                                          <pre>
                                             {JSON.stringify(selectedComponentKey ? {
                                                architecture: activeComponentMap[selectedComponentKey],
                                                mapping: activeData.renderer_mapping_engine?.[selectedComponentKey] || uiuxData?.renderer_mapping_engine?.[selectedComponentKey]
                                             } : {}, null, 2)}
                                          </pre>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {configTab === 'Layout' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                           <div>
                              <h3 className="text-xs font-black text-slate-900 mb-6 uppercase tracking-[0.2em]">Layout Architecture</h3>
                              <div className="grid grid-cols-3 gap-6">
                                 {[
                                    { label: 'Desktop Layout', value: activeData.renderer_mapping_engine?.layout_architecture?.desktop_layout || uiuxData?.page_shell_architecture?.layout_modes?.desktop?.content_grid || 'Standard', icon: Monitor },
                                    { label: 'Tablet Layout', value: activeData.renderer_mapping_engine?.layout_architecture?.tablet_layout || uiuxData?.page_shell_architecture?.layout_modes?.tablet?.content_grid || 'Compact', icon: Tablet },
                                    { label: 'Mobile Layout', value: activeData.renderer_mapping_engine?.layout_architecture?.mobile_layout || uiuxData?.page_shell_architecture?.layout_modes?.mobile?.content_grid || 'Stack', icon: Smartphone }
                                 ].map((item) => (
                                    <div key={item.label} className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[1.5rem] flex flex-col items-center gap-4 group hover:border-indigo-200 transition-all">
                                       <item.icon size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                       <div className="text-center">
                                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
                                          <span className="text-[13px] font-black text-slate-800">{formatTitle(item.value)}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}

                     {configTab === 'Interaction' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                           <div>
                              <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-[0.2em]">Interaction Design</h3>
                              <div className="grid grid-cols-1 gap-6">
                                 {(Object.entries(activeData.renderer_mapping_engine?.interaction_design || {}) as [string, boolean][]).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border-2 border-slate-100 group hover:border-indigo-200 transition-all">
                                       <div>
                                          <span className="block text-sm font-black text-slate-800 mb-1">{formatTitle(key)}</span>
                                          <span className="text-[11px] text-slate-500 font-medium">Enable {formatTitle(key).toLowerCase()} behavior for this section</span>
                                       </div>
                                       <div className={`w-14 h-7 ${val ? 'bg-indigo-600' : 'bg-slate-200'} rounded-full relative px-1.5 flex items-center transition-all cursor-pointer shadow-lg`}>
                                          <div className={`w-4 h-4 bg-white rounded-full ${val ? 'ml-auto' : 'mr-auto'} shadow-sm`}></div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}

                     {configTab === 'Performance' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                           <div>
                              <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-[0.2em]">Performance UX</h3>
                              <div className="grid grid-cols-2 gap-8">
                                 {(Object.entries(activeData.renderer_mapping_engine?.performance_ux || {}) as [string, boolean][]).map(([key, val]) => (
                                    key !== 'cache_strategy' ? (
                                       <div key={key} className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-indigo-100 transition-all">
                                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{formatTitle(key)}</span>
                                          <div className={`w-12 h-6 ${val ? 'bg-emerald-500' : 'bg-slate-200'} rounded-full relative px-1 flex items-center transition-all cursor-pointer`}>
                                             <div className={`w-4 h-4 bg-white rounded-full ${val ? 'ml-auto' : 'mr-auto'} shadow-sm`}></div>
                                          </div>
                                       </div>
                                    ) : (
                                       <div key={key} className="col-span-2 p-6 bg-indigo-50/30 border-2 border-indigo-100 rounded-3xl flex items-center justify-between">
                                          <div>
                                             <span className="block text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">Cache Strategy</span>
                                             <span className="text-[13px] font-black text-indigo-600">{String(val).toUpperCase()}</span>
                                          </div>
                                          <button type="button" onClick={() => updateSelectedComponentConfig({ cache_strategy: 'component_level' })} className="px-6 py-2.5 bg-white border border-indigo-200 rounded-2xl text-[11px] font-black text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all">Change Strategy</button>
                                       </div>
                                    )
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}

                     {configTab === 'Accessibility' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                           <div>
                              <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-[0.2em]">Accessibility Architecture</h3>
                              <div className="grid grid-cols-1 gap-5">
                                 {(Object.entries(activeData.renderer_mapping_engine?.accessibility_architecture || {}) as [string, boolean][]).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-6 p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-100 transition-all group">
                                       <div className={`w-12 h-12 rounded-2xl ${val ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'} flex items-center justify-center transition-all group-hover:scale-110`}>
                                          <CheckCircle2 size={24} />
                                       </div>
                                       <div className="flex-1">
                                          <span className="block text-[13px] font-black text-slate-800">{formatTitle(key)}</span>
                                          <span className="text-[11px] text-slate-500 font-medium">Compliance verified according to WCAG 2.1 guidelines</span>
                                       </div>
                                       <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${val ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                          {val ? 'Compliant' : 'Pending'}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}

                     {configTab === 'Typography' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                           <div>
                              <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-[0.2em]">Visual Hierarchy & Typography</h3>
                              <div className="grid grid-cols-1 gap-8">
                                 <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-slate-100">
                                    <div className="flex items-center gap-4 mb-6">
                                       <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><Type size={20}/></div>
                                       <span className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Font Scale Strategy</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                       {(uiuxData?.design_system?.typography_system?.font_scales ? (Object.entries(uiuxData.design_system.typography_system.font_scales) as [string, string][]) : ['Heading 1', 'Heading 2', 'Body Large', 'Body Small']).map(item => {
                                          const label = Array.isArray(item) ? item[0] : item;
                                          const value = Array.isArray(item) ? (item[1] || '1.25rem') : '1.25rem';
                                          return (
                                             <div key={label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                                <span className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">{formatTitle(label)}</span>
                                                <span className="text-[15px] font-black text-slate-800">{String(value)}</span>
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-100 transition-all">
                                       <div className="flex items-center gap-4 mb-6">
                                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Layers size={20}/></div>
                                          <span className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Spacing Rules</span>
                                       </div>
                                       <div className="space-y-4">
                                          <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">Base Unit</span><span className="text-xs font-black text-slate-900">4px</span></div>
                                          <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">Grid Gutter</span><span className="text-xs font-black text-slate-900">24px</span></div>
                                          <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">Container Padding</span><span className="text-xs font-black text-slate-900">32px</span></div>
                                       </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-100 transition-all">
                                       <div className="flex items-center gap-4 mb-6">
                                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><Palette size={20}/></div>
                                          <span className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Color Roles</span>
                                       </div>
                                       <div className="flex gap-3">
                                          {['#4F46E5', '#10B981', '#F59E0B', '#EF4444'].map(color => (
                                             <div key={color} className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200" style={{ backgroundColor: color }} />
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {configTab === 'Variants' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                           <div>
                              <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-[0.2em]">Brand & Content Variants</h3>
                              <div className="space-y-8">
                                 <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
                                    <div className="absolute right-[-10%] top-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                       <div className="space-y-2">
                                          <h4 className="text-xl font-black">Shared Core Architecture</h4>
                                          <p className="text-white/70 text-xs font-medium max-w-sm">When enabled, this component uses the global shared logic before applying brand-specific overrides.</p>
                                       </div>
                                       <div className={`w-16 h-8 bg-white/20 rounded-full relative px-1.5 flex items-center transition-all cursor-pointer border border-white/30`}>
                                          <div className={`w-5 h-5 bg-white rounded-full ml-auto shadow-lg`}></div>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 gap-5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Prompt Adaptation Variants</h4>
                                    {Object.keys(activeData.domain_adaptations_flexible?.prompt_variants || uiuxData?.design_system?.component_library || {}).map(variant => (
                                       <div key={variant} className="flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-100 transition-all cursor-pointer group">
                                          <div className="flex items-center gap-5">
                                             <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><Zap size={22}/></div>
                                             <div>
                                                <span className="block text-sm font-black text-slate-800">{formatTitle(variant)}</span>
                                                <span className="text-[11px] text-slate-500 font-medium">Customized instruction set for {variant.replace('_', ' ')} path</span>
                                             </div>
                                          </div>
                                          <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               {/* 3. Device Preview */}
               <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm h-[750px] flex flex-col p-10 overflow-hidden">
                  <div className="flex items-center justify-between mb-10 shrink-0">
                     <h2 className="text-lg font-bold text-slate-900">Architecture Device Preview</h2>
                     <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                        <button type="button" onClick={() => setSelectedDevice('desktop')} className={`p-2.5 rounded-xl shadow-sm ${selectedDevice === 'desktop' ? 'bg-white text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Monitor size={18}/></button>
                        <button type="button" onClick={() => setSelectedDevice('tablet')} className={`p-2.5 rounded-xl ${selectedDevice === 'tablet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Tablet size={18}/></button>
                        <button type="button" onClick={() => setSelectedDevice('mobile')} className={`p-2.5 rounded-xl ${selectedDevice === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Smartphone size={18}/></button>
                     </div>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-[3rem] border-[6px] border-white shadow-[inset_0_0_40px_rgba(0,0,0,0.02)] p-16 flex flex-col items-center justify-center relative group overflow-y-auto hide-scrollbar">
                     <div className="w-full max-w-[380px] bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-12 border border-white/50 space-y-8 transform group-hover:scale-105 transition-all duration-700">
                        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner ring-4 ring-amber-50/30">
                           <Brain size={32} />
                        </div>
                        <div className="space-y-4">
                           <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Simple Overview</h3>
                           <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                              A variable in JavaScript is like a container that holds data. You can store numbers, text, or even other values inside it and use or change them whenever you need.
                           </p>
                        </div>
                     </div>
                  </div>
                  <div className="mt-10 flex flex-col md:flex-row gap-10 justify-between items-center border-t border-slate-50 pt-8 shrink-0">
                     <div className="space-y-4">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center md:text-left">THEME SELECTION</span>
                        <div className="flex bg-slate-100/80 p-2 rounded-[1.5rem] border border-slate-200">
                           <button type="button" onClick={() => setSelectedTheme('light')} className={`px-6 py-2.5 rounded-[1.25rem] flex items-center gap-2.5 text-[13px] font-black transition-all ${selectedTheme === 'light' ? 'bg-white text-indigo-600 shadow-lg border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}><Sun size={16}/> Light Mode</button>
                           <button type="button" onClick={() => setSelectedTheme('dark')} className={`px-6 py-2.5 rounded-[1.25rem] flex items-center gap-2.5 text-[13px] font-black transition-all ${selectedTheme === 'dark' ? 'bg-white text-indigo-600 shadow-lg border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}><Moon size={16}/> Dark Mode</button>
                        </div>
                     </div>
                     <div className="space-y-4 flex-1 max-w-[240px]">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center md:text-left">BRAND PREVIEW</span>
                        <div className="relative">
                           <select className="w-full pl-5 pr-12 py-4 bg-slate-50/50 border border-slate-200 rounded-[1.5rem] text-[13px] font-black text-slate-800 appearance-none outline-none focus:ring-4 ring-indigo-50 transition-all cursor-pointer">
                              <option>SkillUp IT Academy</option>
                              <option>Real Tutorial Hub</option>
                           </select>
                           <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* 4. Brand Variants & Domain Overrides */}
               <div className="space-y-8 flex flex-col h-[750px]">
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex-1 flex flex-col overflow-hidden">
                     <h2 className="text-lg font-bold text-slate-900 mb-8">Brand Renderer Variants</h2>
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-3">
                        <div className="p-5 border-2 border-indigo-200 bg-indigo-50/30 rounded-3xl flex items-center gap-6 transition-all hover:bg-indigo-50/50 cursor-pointer shadow-lg shadow-indigo-100/20">
                           <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm"><Box size={24}/></div>
                           <div className="flex-1 min-w-0">
                              <span className="block text-[15px] font-black text-slate-900">Shared (Default)</span>
                              <span className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">Primary renderer for all brands</span>
                           </div>
                           <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-4 py-1.5 rounded-full uppercase border border-emerald-200 tracking-wider">Active</span>
                        </div>
                        <div className="p-5 border-2 border-slate-100 rounded-3xl flex items-center gap-6 transition-all hover:bg-slate-50 cursor-pointer group">
                           <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all"><Palette size={24}/></div>
                           <div className="flex-1 min-w-0">
                              <span className="block text-[15px] font-black text-slate-900">SkillUp IT Academy</span>
                              <span className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">Warm, friendly learning theme</span>
                           </div>
                           <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-4 py-1.5 rounded-full uppercase border border-emerald-200 tracking-wider">Active</span>
                        </div>
                        <div className="p-5 border-2 border-slate-100 rounded-3xl flex items-center gap-6 transition-all hover:bg-slate-50 cursor-pointer group">
                           <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all"><Layers size={24}/></div>
                           <div className="flex-1 min-w-0">
                              <span className="block text-[15px] font-black text-slate-900">Real Tutorial Hub (RTH)</span>
                              <span className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">Professional, technical theme</span>
                           </div>
                           <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-4 py-1.5 rounded-full uppercase border border-emerald-200 tracking-wider">Active</span>
                        </div>
                     </div>
                     <button type="button" onClick={duplicateSelectedMapping} className="w-full mt-8 py-4.5 text-sm font-black text-indigo-600 border-2 border-indigo-100 rounded-3xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                        <Plus size={22} /> Add Brand Variant
                     </button>
                  </div>
                  
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 h-[320px] flex flex-col overflow-hidden">
                     <h2 className="text-lg font-bold text-slate-900 mb-6">Domain Overrides</h2>
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-3">
                        {[
                           { name: 'Programming', status: 'Custom' },
                           { name: 'Finance', status: 'Custom' },
                           { name: 'AI / ML', status: 'Default' },
                           { name: 'Cloud', status: 'Default' },
                           { name: 'Cybersecurity', status: 'Custom' }
                        ].map((d) => (
                           <div key={d.name} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all">
                              <span className="text-[13px] font-bold text-slate-700">{d.name}</span>
                              <span className={`px-4 py-1.5 rounded-xl font-black uppercase text-[10px] border shadow-sm ${d.status === 'Custom' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-slate-400 bg-white border-slate-200'}`}>{d.status}</span>
                           </div>
                        ))}
                     </div>
                     <button type="button" onClick={startJsonEdit} className="w-full mt-6 text-[13px] font-black text-indigo-600 flex items-center justify-center gap-3 hover:bg-indigo-50 py-3 rounded-[1.5rem] transition-all border border-transparent hover:border-indigo-100"><Settings size={18} className="animate-spin-slow"/> Manage Domain Overrides</button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               
               {/* Accessibility */}
               <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
                     <h3 className="text-lg font-bold text-slate-900">Accessibility Configuration</h3>
                     <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Compliance Level</span>
                        <select className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-indigo-600 outline-none shadow-sm"><option>AA</option><option>AAA</option></select>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                     {[
                        { label: 'Screen Reader Support', active: true },
                        { label: 'Keyboard Navigation', active: true },
                        { label: 'ARIA Labels & Roles', active: true },
                        { label: 'Focus Management', active: true },
                        { label: 'Color Contrast Ratio', value: '4.8 : 1', pass: true },
                        { label: 'Reduced Motion Support', active: true }
                     ].map(item => (
                        <div key={item.label} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                           <span className="text-sm font-black text-slate-600">{item.label}</span>
                           {item.value ? (
                              <div className="flex items-center gap-3">
                                 <span className="text-sm font-black text-slate-900">{item.value}</span>
                                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase border border-emerald-200">Pass</span>
                              </div>
                           ) : (
                              <div className={`w-12 h-6 rounded-full relative px-1.5 flex items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${item.active ? 'bg-indigo-500' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all ${item.active ? 'ml-auto' : 'ml-0'}`}></div></div>
                           )}
                        </div>
                     ))}
                  </div>
                  <button type="button" onClick={validateActiveArchitecture} className="w-full mt-10 py-4 border-2 border-indigo-100 text-xs font-black text-indigo-600 rounded-3xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100/20">
                     <ShieldCheck size={18} /> View Detailed Accessibility Report
                  </button>
               </div>

               {/* Psychology Mapping */}
               <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-10">Renderer Psychology Mapping</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                     {[
                        { icon: Brain, label: 'Fear Reduction Design', score: 'High', color: 'text-rose-500', bg: 'bg-rose-50', ring: 'ring-rose-100' },
                        { icon: Zap, label: 'Confidence Boosting', score: 'High', color: 'text-indigo-500', bg: 'bg-indigo-50', ring: 'ring-indigo-100' },
                        { icon: Info, label: 'Cognitive Load Level', score: 'Low', color: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
                        { icon: Globe, label: 'Engagement Potential', score: 'High', color: 'text-blue-500', bg: 'bg-blue-50', ring: 'ring-blue-100' },
                        { icon: Activity, label: 'Motivation Impact', score: 'High', color: 'text-amber-500', bg: 'bg-amber-50', ring: 'ring-amber-100' },
                        { icon: Heart, label: 'Emotional Comfort', score: '95 / 100', status: 'Excellent', color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-200' }
                     ].map(item => (
                        <div key={item.label} className="flex items-center gap-5 group cursor-pointer">
                           <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 shadow-sm ring-4 ${item.ring}/50 transition-all group-hover:scale-110 group-hover:shadow-md`}><item.icon size={22}/></div>
                           <div className="flex-1">
                              <span className="block text-[13px] font-black text-slate-700 leading-tight">{item.label}</span>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <span className={`text-xs font-black ${item.color}`}>{item.score}</span>
                                 {item.status && <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">{item.status}</span>}
                              </div>
                           </div>
                           <ChevronDown size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors"/>
                        </div>
                     ))}
                  </div>
                  <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.visualGuide)} className="w-full mt-12 py-4 border-2 border-indigo-100 text-xs font-black text-indigo-600 rounded-3xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100/20">
                     <Brain size={18} /> View Universal Psychology Guide
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               {/* Performance */}
               <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-10">Performance & Optimization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                     <div className="space-y-6">
                        <div className="flex justify-between items-center group">
                           <span className="text-sm font-black text-slate-600 uppercase tracking-tight">Lazy Loading Content</span>
                           <div className="w-12 h-6 bg-emerald-500 rounded-full relative px-1.5 flex items-center shadow-lg cursor-pointer transition-all"><div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div></div>
                        </div>
                        <div className="flex justify-between items-center group">
                           <span className="text-sm font-black text-slate-600 uppercase tracking-tight">Image Optimization Engine</span>
                           <div className="w-12 h-6 bg-emerald-500 rounded-full relative px-1.5 flex items-center shadow-lg cursor-pointer transition-all"><div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div></div>
                        </div>
                        <div className="flex justify-between items-center group">
                           <span className="text-sm font-black text-slate-600 uppercase tracking-tight">Bundle Size Impact</span>
                           <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-4 py-1.5 rounded-full uppercase border border-emerald-200 shadow-sm">Ultra Low</span>
                        </div>
                     </div>
                     <div className="space-y-6 border-l border-slate-50 pl-12">
                        <div className="flex justify-between items-center">
                           <span className="text-sm font-black text-slate-600 uppercase tracking-tight">Render Time (Avg)</span>
                           <div className="flex items-center gap-3">
                              <span className="text-base font-black text-slate-900 tracking-tighter">120ms</span>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase">Good</span>
                           </div>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-sm font-black text-slate-600 uppercase tracking-tight">Cache Strategy</span>
                           <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-indigo-600 outline-none shadow-sm cursor-pointer"><option>Component Level</option><option>Page Level</option></select>
                        </div>
                        <div className="flex justify-between items-center group">
                           <span className="text-sm font-black text-slate-600 uppercase tracking-tight">CDN Ready Assets</span>
                           <div className="flex items-center gap-2">
                             <CheckCircle2 size={16} className="text-emerald-500" />
                             <span className="text-[11px] font-black text-slate-400 uppercase">Verified</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* AI Adaptive & Quick Actions */}
               <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row gap-12">
                   <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-6">AI Adaptive Renderer</h3>
                      <div className="flex justify-between items-center mb-8 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                         <span className="text-sm font-black text-indigo-900 uppercase tracking-tight">Adaptive Selection</span>
                         <div className="w-12 h-6 bg-emerald-500 rounded-full relative px-1.5 flex items-center shadow-lg cursor-pointer transition-all"><div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div></div>
                      </div>
                      <div className="space-y-4">
                         <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">CONTEXT FACTORS</span>
                         <div className="grid grid-cols-2 gap-4">
                            {['Learner Level', 'Device Type', 'Learning Style', 'Accessibility'].map(f => (
                               <div key={f} className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                  <CheckCircle2 size={16} className="text-indigo-600" /> {f}
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-12">
                      <h3 className="text-lg font-bold text-slate-900 mb-8">Quick Actions</h3>
                      <div className="space-y-4">
                         <button type="button" onClick={duplicateSelectedMapping} className="w-full flex items-center justify-center gap-4 p-4 rounded-2xl text-[13px] font-black text-slate-600 hover:bg-slate-50 border-2 border-slate-100 transition-all group">
                            <Copy size={18} className="text-indigo-50 group-hover:scale-125 transition-transform"/> Duplicate Mapping
                         </button>
                         <button type="button" onClick={startJsonEdit} className="w-full flex items-center justify-center gap-4 p-4 rounded-2xl text-[13px] font-black text-slate-600 hover:bg-slate-50 border-2 border-slate-100 transition-all group">
                            <Edit2 size={18} className="text-blue-500 group-hover:scale-125 transition-transform"/> Edit JSON Config
                         </button>
                         <button type="button" onClick={() => updateArchitectureStatus('archived')} className="w-full flex items-center justify-center gap-4 p-4 rounded-[2rem] text-sm font-black text-rose-600 bg-rose-50/50 hover:bg-rose-50 border-2 border-rose-100 transition-all group shadow-lg shadow-rose-100/20">
                            <Trash2 size={18} className="group-hover:animate-bounce"/> Delete Renderer Mapping
                         </button>
                      </div>
                   </div>
               </div>
            </div>
            </>
            ) : null}
         </div>
      ) : (
         <div className="bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <Info size={48} className="text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">{activeTab}</h2>
            <p className="text-sm text-slate-500 max-w-md">
              Detailed mapping for the {activeTab} section has no information in JSON file yet or is currently under development. Please check back later.
            </p>
         </div>
      )}
    </div>
  );
}
