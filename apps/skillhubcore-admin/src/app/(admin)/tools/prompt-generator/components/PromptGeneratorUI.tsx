'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { ASSET_SPECS } from '../lib/asset-specs';
import { getPromptForSection, getSvgAssetPromptForSection } from '../lib/engine';

import { sections, SUBSECTIONS_MAP, findMatchingAsset } from '../lib/prompt-generator-config';

const PIPELINE_PAYLOAD_STORAGE_KEY = 'skillhubcore.globalArchitecture.pipelinePayload.v1';

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
  previewTarget?: string;
  educationalArchitectureKey?: string;
  uiuxArchitectureKey?: string;
  educationalComponent?: Record<string, unknown> | null;
  uiuxComponent?: Record<string, unknown> | null;
  rendererMapping?: Record<string, unknown> | null;
  defaultJson?: unknown;
};

const getRecordLabel = (record: Record<string, unknown> | null | undefined, keys: string[]) => {
  if (!record) return 'Not selected';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return 'Configured';
};

const buildArchitecturePromptContext = (payload: PipelinePayload | null) => {
  if (!payload) return '';

  const educationalPurpose = getRecordLabel(payload.educationalComponent, ['purpose', 'renderer', 'component_type']);
  const uiuxVariant = getRecordLabel(payload.uiuxComponent, ['layout_pattern', 'style_variant', 'renderer', 'component_type']);

  return `\n\nSELECTED GLOBAL ARCHITECTURE CONTEXT\n` +
    `Use this architecture decision while creating content.\n` +
    `Section: ${payload.adminSectionId || payload.section || 'not-selected'}\n` +
    `Component/Subsection: ${payload.subsection || 'full-section'}\n` +
    `Educational Architecture: ${payload.educationalArchitectureKey || 'not-selected'}\n` +
    `Educational Component Role: ${educationalPurpose}\n` +
    `UI/UX Architecture: ${payload.uiuxArchitectureKey || 'not-selected'}\n` +
    `UI/UX Component Decision: ${uiuxVariant}\n` +
    `Preview Target: ${payload.previewTarget || 'local'}\n` +
    `Default Dummy JSON Available: ${payload.defaultJson ? 'yes' : 'no'}\n`;
};

export function PromptGeneratorUI() {
  const brand = useBrand();
  const searchParams = useSearchParams();

  const [domain, setDomain] = useState('Programming');
  const [subject, setSubject] = useState('Next.js');
  const [topic, setTopic] = useState('App Router');
  const [subtopic, setSubtopic] = useState('Server Components');
  const [selectedSection, setSelectedSection] = useState('notes');
  const [selectedSubsection, setSelectedSubsection] = useState<string>('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedAssetPrompt, setGeneratedAssetPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [assetCopied, setAssetCopied] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [subtopicId, setSubtopicId] = useState('whatispython');
  const [previewTarget, setPreviewTarget] = useState<'local' | 'rth' | 'suia'>('local');
  const [pipelinePayload, setPipelinePayload] = useState<PipelinePayload | null>(null);

  useEffect(() => {
    const sectParam = searchParams.get('section');
    const subParam = searchParams.get('subsection');
    const assetParam = searchParams.get('asset');
    const domainParam = searchParams.get('domain');
    const subjectParam = searchParams.get('subject');
    const topicParam = searchParams.get('topic');
    const subtopicParam = searchParams.get('subtopic');
    const subtopicIdParam = searchParams.get('subtopicId');
    const previewTargetParam = searchParams.get('previewTarget');
    const autoGenerate = searchParams.get('autoGenerate') === 'true';
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
      setSelectedSection(sectParam);
    }
    if (subParam) {
      setSelectedSubsection(subParam);
    }
    if (domainParam) setDomain(domainParam);
    if (subjectParam) setSubject(subjectParam);
    if (topicParam) setTopic(topicParam);
    if (subtopicParam) setSubtopic(subtopicParam);
    if (subtopicIdParam) setSubtopicId(subtopicIdParam);
    if (previewTargetParam === 'local' || previewTargetParam === 'rth' || previewTargetParam === 'suia') setPreviewTarget(previewTargetParam);
    if (assetParam) {
      setSelectedAssetId(assetParam);
      // Generate prompt for visual asset
      const assetPrompt = getSvgAssetPromptForSection(sectParam || selectedSection, subtopicParam || subtopic, assetParam);
      setGeneratedAssetPrompt(assetPrompt);
    }
    if (autoGenerate) {
      const sectionToUse = sectParam || selectedSection;
      const subtopicToUse = subtopicParam || subtopic;
      setGeneratedPrompt(getPromptForSection(
        sectionToUse,
        domainParam || domain,
        subjectParam || subject,
        topicParam || topic,
        subtopicToUse,
        subParam || undefined
      ) + buildArchitecturePromptContext(loadedPayload));
      setGeneratedAssetPrompt(getSvgAssetPromptForSection(sectionToUse, subtopicToUse, assetParam));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleGeneratePrompt = (assetId: string | null = null) => {
    if (assetId) {
      const assetPrompt = getSvgAssetPromptForSection(selectedSection, subtopic, assetId);
      setGeneratedAssetPrompt(assetPrompt);
      setSelectedAssetId(assetId);
    } else {
      const prompt = getPromptForSection(selectedSection, domain, subject, topic, subtopic, selectedSubsection || undefined) +
        buildArchitecturePromptContext(pipelinePayload);
      setGeneratedPrompt(prompt);

      // Also generate all assets prompt for this section if not a specific asset
      const allAssetsPrompt = getSvgAssetPromptForSection(selectedSection, subtopic);
      setGeneratedAssetPrompt(allAssetsPrompt);
      setSelectedAssetId(null);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAssetPromptToClipboard = async () => {
    if (!generatedAssetPrompt) return;
    await navigator.clipboard.writeText(generatedAssetPrompt);
    setAssetCopied(true);
    setTimeout(() => setAssetCopied(false), 2000);
  };

  const openContentManagerWithConfirmation = () => {
    const confirmed = window.confirm(
      `Send this ${selectedSection}${selectedSubsection ? `.${selectedSubsection}` : ''} context to Content Manager for preview approval before DB save?`
    );
    if (!confirmed) return;

    const params = new URLSearchParams({
      section: selectedSection,
      domain,
      subject,
      topic,
      subtopic,
      subtopicId,
      previewTarget,
      source: 'prompt-generator',
      requirePreviewApproval: 'true',
    });
    if (selectedSubsection) params.set('subsection', selectedSubsection);
    if (pipelinePayload) {
      try {
        window.localStorage.setItem(PIPELINE_PAYLOAD_STORAGE_KEY, JSON.stringify({
          ...pipelinePayload,
          source: 'prompt-generator',
          section: selectedSection,
          adminSectionId: selectedSection,
          subsection: selectedSubsection || pipelinePayload.subsection || null,
          dummyContext: { domain, subject, topic, subtopic, subtopicId },
          previewTarget,
          confirmedAt: new Date().toISOString(),
        }));
      } catch {
        // Query params still carry the minimum pipeline context.
      }
    }
    window.open(`/tools/content-manager?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <header className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div className="p-8 text-center" style={{ backgroundColor: brand?.primaryColor }}>
          <h1 className="text-4xl font-bold text-white mb-3">AI Content Prompt Generator</h1>
          <p className="text-white text-lg font-semibold">Generate perfect prompts for ChatGPT, Claude, Gemini, or DeepSeek</p>
        </div>

        {/* Info Box */}
        <div className="p-6 bg-blue-50 border-l-4 border-blue-500 m-6 rounded-lg">
          <p className="text-blue-900 font-medium leading-relaxed">
            <strong>How to use:</strong> Enter your subtopic name, select a section, and click Generate.
            Copy the prompt and paste it into any AI model to get perfectly formatted JSON content.
          </p>
        </div>

        {pipelinePayload ? (
          <div className="mx-6 mb-6 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-5">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-800">Global Architecture Context Loaded</p>
            <div className="grid gap-3 text-sm text-emerald-950 md:grid-cols-2">
              <p><strong>Section:</strong> {pipelinePayload.adminSectionId || pipelinePayload.section} {pipelinePayload.subsection ? `.${pipelinePayload.subsection}` : ''}</p>
              <p><strong>Preview:</strong> {pipelinePayload.previewTarget || previewTarget}</p>
              <p><strong>Educational:</strong> {getRecordLabel(pipelinePayload.educationalComponent, ['purpose', 'renderer', 'component_type'])}</p>
              <p><strong>UI/UX:</strong> {getRecordLabel(pipelinePayload.uiuxComponent, ['layout_pattern', 'style_variant', 'renderer', 'component_type'])}</p>
            </div>
          </div>
        ) : null}

        {/* Input Section */}
        <section className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="domain" className="block text-lg font-semibold text-gray-800 mb-3">Domain</label>
              <input
                type="text"
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., Programming"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-lg font-semibold text-gray-800 mb-3">Subject</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., JavaScript"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="subtopicId" className="block text-lg font-semibold text-gray-800 mb-3">Subtopic ID</label>
              <input
                type="text"
                id="subtopicId"
                value={subtopicId}
                onChange={(e) => setSubtopicId(e.target.value.toLowerCase())}
                placeholder="e.g., whatispython"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="previewTarget" className="block text-lg font-semibold text-gray-800 mb-3">Preview Target</label>
              <select
                id="previewTarget"
                value={previewTarget}
                onChange={(e) => setPreviewTarget(e.target.value as 'local' | 'rth' | 'suia')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
              >
                <option value="local">Localhost RTH (3003)</option>
                <option value="rth">RTH Production</option>
                <option value="suia">SUIA / SkillUp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="topic" className="block text-lg font-semibold text-gray-800 mb-3">Topic</label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., App Router"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="subtopic" className="block text-lg font-semibold text-gray-800 mb-3">Subtopic</label>
              <input
                type="text"
                id="subtopic"
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                placeholder="e.g., Server Components"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="block text-lg font-semibold text-gray-800 mb-3">Select Section</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSection(section.id);
                    setSelectedSubsection('');
                    setGeneratedPrompt('');
                    setGeneratedAssetPrompt('');
                    setSelectedAssetId(null);
                  }}
                  className={`px-6 py-4 rounded-xl font-bold text-lg transition-all border-2 ${
                    selectedSection === section.id
                      ? 'bg-blue-600 border-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {selectedSection && SUBSECTIONS_MAP[selectedSection] && (
              <div className="mb-6">
                <label htmlFor="subsectionSelect" className="block text-lg font-semibold text-gray-800 mb-3">
                  Target Subsection (Optional - select to generate prompt for a single subsection block)
                </label>
                <select
                  id="subsectionSelect"
                  value={selectedSubsection}
                  onChange={(e) => {
                    setSelectedSubsection(e.target.value);
                    setGeneratedPrompt('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white text-gray-700"
                >
                  <option value="">Whole Section (Monolithic full JSON prompt)</option>
                  {SUBSECTIONS_MAP[selectedSection].map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      Subsection: {sub.label} ({sub.id})
                    </option>
                  ))}
                </select>

                {/* Inline Subsection Visual Mapping Card */}
                {selectedSubsection && (() => {
                  const matchingAsset = findMatchingAsset(selectedSection, selectedSubsection);
                  return (
                    <div className="mt-4 p-4 rounded-xl border border-blue-150 bg-blue-50/30 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                      <div className="flex gap-3 items-start">
                        <div className="p-2 bg-blue-100 text-blue-650 rounded-lg shrink-0 mt-0.5">
                          <Compass size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-705 px-2 py-0.5 rounded tracking-wider">
                              Mapped Visual Component
                            </span>
                            {matchingAsset && (
                              <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-705 px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
                                <Sparkles size={10} strokeWidth={3} /> Associated SVG Image
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-base font-extrabold text-slate-800 mt-1">
                            {SUBSECTIONS_MAP[selectedSection].find(s => s.id === selectedSubsection)?.label || selectedSubsection}
                          </h4>
                          
                          {matchingAsset ? (
                            <div className="space-y-1.5 mt-2">
                              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                                <strong className="text-slate-800">Visual Blueprint: </strong> {matchingAsset.label} ({matchingAsset.width}x{matchingAsset.height}px)
                              </p>
                              <p className="text-xs text-slate-500 italic max-w-xl">
                                &ldquo;{matchingAsset.purpose}&rdquo;
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 mt-1">
                              This subsection consists of structured text blocks and layout metadata (no custom illustration SVG required).
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto shrink-0">
                        {matchingAsset && (
                          <button
                            onClick={() => handleGeneratePrompt(matchingAsset.id)}
                            className="px-3.5 py-2 text-xs font-black bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm w-full sm:w-auto text-center"
                          >
                            Load SVG Prompt
                          </button>
                        )}
                        <Link
                          href={`/tools/visual-guide?section=${selectedSection}&subsection=${selectedSubsection}`}
                          className="px-3.5 py-2 text-xs font-black border border-blue-200 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-center w-full sm:w-auto flex items-center justify-center gap-1"
                        >
                          View Guide Map <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              onClick={() => handleGeneratePrompt()}
              className="w-full py-4 text-white text-xl font-black rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: brand?.primaryColor }}
            >
              Generate Core JSON Prompt
            </button>
            <button
              onClick={openContentManagerWithConfirmation}
              className="mt-4 w-full py-3 text-blue-700 text-sm font-black rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
            >
              Continue to Content Manager After Confirmation <ArrowRight size={16} />
            </button>

            {/* Asset Buttons Row */}
            {selectedSection && ASSET_SPECS[selectedSection] && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="block text-lg font-semibold text-gray-800 mb-3">Select Visual Asset (SVG) Prompt</div>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const filteredAssets = selectedSubsection
                      ? (() => {
                          const matched = findMatchingAsset(selectedSection, selectedSubsection);
                          return matched ? [matched] : [];
                        })()
                      : ASSET_SPECS[selectedSection];

                    if (selectedSubsection && filteredAssets.length === 0) {
                      return (
                        <p className="text-sm font-medium text-slate-500 italic">
                          This subsection consists of structured text blocks and layout metadata (no custom illustration SVG required).
                        </p>
                      );
                    }

                    return (
                      <>
                        {filteredAssets.map((asset) => (
                          <button
                            key={asset.id}
                            onClick={() => handleGeneratePrompt(asset.id)}
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                              selectedAssetId === asset.id
                                ? 'bg-amber-500 border-amber-600 text-white shadow-md scale-105'
                                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                            }`}
                          >
                            {asset.label}
                          </button>
                        ))}
                        {!selectedSubsection && (
                          <button
                            onClick={() => handleGeneratePrompt()}
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                              selectedAssetId === null && generatedAssetPrompt
                                ? 'bg-slate-700 border-slate-800 text-white shadow-md'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            All Assets
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </section>
      </header>

      {/* Dual Output Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Content Column */}
        <section className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800">1. Content Structure</h3>
            <button
              disabled={!generatedPrompt}
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                !generatedPrompt ? 'bg-gray-200 text-gray-400' :
                copied ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy JSON Prompt'}
            </button>
          </div>
          <div className="p-6 flex-1 min-h-[400px]">
            <div className="h-full bg-gray-50 border border-gray-200 rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto">
              {generatedPrompt || <span className="text-gray-400 italic">Content architecture will appear here...</span>}
            </div>
          </div>
        </section>

        {/* Asset Column */}
        <section className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-amber-200 flex justify-between items-center bg-amber-50">
            <h3 className="text-xl font-bold text-gray-800">2. SVG Visual Assets</h3>
            <button
              disabled={!generatedAssetPrompt}
              onClick={copyAssetPromptToClipboard}
              className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                !generatedAssetPrompt ? 'bg-amber-100 text-amber-300' :
                assetCopied ? 'bg-green-500 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {assetCopied ? '✓ Copied' : 'Copy SVG Prompts'}
            </button>
          </div>
          <div className="p-6 flex-1 min-h-[400px]">
            <div className="h-full bg-amber-50/30 border border-amber-100 rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto">
              {generatedAssetPrompt || <span className="text-amber-400 italic">SVG generation prompts will appear here...</span>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
