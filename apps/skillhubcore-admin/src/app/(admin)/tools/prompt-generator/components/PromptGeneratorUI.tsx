'use client';

import React, { useState } from 'react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { ASSET_SPECS } from '../lib/asset-specs';
import { getPromptForSection, getSvgAssetPromptForSection } from '../lib/engine';

const sections = [
  { id: 'master', label: 'Master Prompt' },
  { id: 'overview', label: 'Overview' },
  { id: 'notes', label: 'Notes' },
  { id: 'layman', label: 'Layman' },
  { id: 'real_life', label: 'Real Life' },
  { id: 'technical', label: 'Technical' },
  { id: 'code', label: 'Code' },
  { id: 'visual', label: 'Visual' },
  { id: 'practice', label: 'Practice' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'project', label: 'Project' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'summary', label: 'Summary' },
  { id: 'interview', label: 'Interview' },
  { id: 'ai_tutor', label: 'AI Tutor' },
];

export function PromptGeneratorUI() {
  const brand = useBrand();
  const [domain, setDomain] = useState('Programming');
  const [subject, setSubject] = useState('Next.js');
  const [topic, setTopic] = useState('App Router');
  const [subtopic, setSubtopic] = useState('Server Components');
  const [selectedSection, setSelectedSection] = useState('notes');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedAssetPrompt, setGeneratedAssetPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [assetCopied, setAssetCopied] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const handleGeneratePrompt = (assetId: string | null = null) => {
    if (assetId) {
      const assetPrompt = getSvgAssetPromptForSection(selectedSection, subtopic, assetId);
      setGeneratedAssetPrompt(assetPrompt);
      setSelectedAssetId(assetId);
    } else {
      const prompt = getPromptForSection(selectedSection, domain, subject, topic, subtopic);
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

            <button
              onClick={() => handleGeneratePrompt()}
              className="w-full py-4 text-white text-xl font-black rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: brand?.primaryColor }}
            >
              Generate Core JSON Prompt
            </button>

            {/* Asset Buttons Row */}
            {selectedSection && ASSET_SPECS[selectedSection] && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="block text-lg font-semibold text-gray-800 mb-3">Select Visual Asset (SVG) Prompt</div>
                <div className="flex flex-wrap gap-3">
                  {ASSET_SPECS[selectedSection].map((asset) => (
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
