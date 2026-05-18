'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';
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

const SUBSECTIONS_MAP: Record<string, Array<{ id: string; label: string }>> = {
  notes: [
    { id: 'simpleWords', label: 'Simple Words' },
    { id: 'definitionBlock', label: 'Definition Block' },
    { id: 'sections', label: 'Detailed Sections List' },
    { id: 'syntaxBlock', label: 'Syntax Block' },
    { id: 'componentGrid', label: 'Component Grid' },
    { id: 'examplePanel', label: 'Example Panel' },
    { id: 'practiceCard', label: 'Practice Card' },
    { id: 'warningFaq', label: 'Warning FAQ' },
    { id: 'summaryCard', label: 'Summary Card' },
    { id: 'footerBlock', label: 'Footer Block' },
  ],
  layman: [
    { id: 'simpleOverview', label: 'Simple Overview' },
    { id: 'everydayAnalogy', label: 'Everyday Analogy' },
    { id: 'whyItExists', label: 'Why It Exists' },
    { id: 'simpleUseCases', label: 'Simple Use Cases' },
    { id: 'beginnerBreakdown', label: 'Beginner Breakdown' },
    { id: 'mentalModel', label: 'Mental Model framework' },
    { id: 'commonConfusions', label: 'Common Confusions' },
    { id: 'simpleRecap', label: 'Simple Recap' },
  ],
  overview: [
    { id: 'hero', label: 'Hero Block' },
    { id: 'progressSummary', label: 'Progress Summary' },
    { id: 'learningOutcomes', label: 'Learning Outcomes' },
    { id: 'learningRoadmap', label: 'Learning Roadmap' },
    { id: 'recommendedFlow', label: 'Recommended Flow' },
    { id: 'readinessContext', label: 'Readiness Context' },
    { id: 'navigation', label: 'Navigation Links' },
  ],
  real_life: [
    { id: 'conceptMapping', label: 'Concept Mapping' },
    { id: 'industryUseCase', label: 'Industry Use Case' },
    { id: 'dailyLifeExample', label: 'Daily Life Example' },
    { id: 'careerRelevance', label: 'Career Relevance' },
    { id: 'problemSolutionContext', label: 'Problem & Solution' },
    { id: 'businessApplication', label: 'Business Application' },
    { id: 'domainScenarios', label: 'Domain Scenarios' },
    { id: 'practicalRecap', label: 'Practical Recap' },
  ],
  technical: [
    { id: 'title', label: 'Title' },
    { id: 'badge', label: 'Badge' },
    { id: 'intro', label: 'Introduction' },
    { id: 'sections', label: 'Technical Sections' },
  ],
  code: [
    { id: 'problemContext', label: 'Problem Context' },
    { id: 'basicCodeExample', label: 'Basic Code Example' },
    { id: 'lineByLineExplanation', label: 'Line-by-Line Explanation' },
    { id: 'outputDemonstration', label: 'Output Demonstration' },
    { id: 'bestPracticeVersion', label: 'Best Practice Version' },
    { id: 'commonMistakes', label: 'Common Mistakes' },
    { id: 'realWorldImplementation', label: 'Real World Implementation' },
    { id: 'codeSummary', label: 'Code Summary' },
  ],
  visual: [
    { id: 'conceptVisualIntro', label: 'Concept Visual Intro' },
    { id: 'diagrammaticBreakdown', label: 'Diagrammatic Breakdown' },
    { id: 'stepByStepVisualFlow', label: 'Step-by-Step Flow' },
    { id: 'comparativeVisualization', label: 'Comparative Visualization' },
    { id: 'mentalModelVisualization', label: 'Mental Model Visualization' },
    { id: 'realWorldVisualMapping', label: 'Real World Visual Mapping' },
    { id: 'commonConfusionVisualization', label: 'Common Confusion Visual' },
    { id: 'visualSummary', label: 'Visual Summary' },
  ],
  practice: [
    { id: 'assessmentIntro', label: 'Assessment Intro' },
    { id: 'conceptRecallQuestions', label: 'Concept Recall Questions' },
    { id: 'scenarioBasedQuestions', label: 'Scenario Based Questions' },
    { id: 'instantFeedback', label: 'Instant Feedback Config' },
  ],
  assignment: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'task', label: 'Task Instructions' },
    { id: 'objectives', label: 'Learning Objectives' },
    { id: 'starterCode', label: 'Starter Code' },
    { id: 'submissionGuidelines', label: 'Submission Guidelines' },
  ],
  project: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'deadline', label: 'Deadline' },
    { id: 'hero', label: 'Hero Config' },
    { id: 'realWorldUse', label: 'Real World Use' },
    { id: 'skills', label: 'Skills Addressed' },
    { id: 'buildItems', label: 'Build Phases' },
    { id: 'deliverables', label: 'Deliverables List' },
  ],
  quiz: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'totalQuestions', label: 'Total Questions Count' },
    { id: 'questions', label: 'Questions Pool' },
  ],
  summary: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'masteryRecapCard', label: 'Mastery Recap Card' },
    { id: 'keyTakeawayGrid', label: 'Key Takeaway Grid' },
    { id: 'revisionChecklist', label: 'Revision Checklist' },
    { id: 'nextStepPanel', label: 'Next Step Panel' },
  ],
  interview: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'interviewIntroCard', label: 'Interview Intro Card' },
    { id: 'questionBankPanel', label: 'Question Bank Panel' },
    { id: 'answerFrameworkCard', label: 'Answer Framework Card' },
    { id: 'mockInterviewFlow', label: 'Mock Interview Flow' },
  ],
  ai_tutor: [
    { id: 'greeting', label: 'Greeting' },
    { id: 'qa_pairs', label: 'Q&A Pairs' },
    { id: 'tutor_prompt_card', label: 'Tutor Prompt Card' },
    { id: 'misconception_detector', label: 'Misconception Detector' },
    { id: 'adaptive_hint_panel', label: 'Adaptive Hint Panel' },
  ],
};

const findMatchingAsset = (section: string, subsection: string) => {
  const specs = ASSET_SPECS[section];
  if (!specs) return null;
  
  const exactMap: Record<string, string> = {
    'conceptMemoryMap': 'notes-memory-map',
    'syntaxBlock': 'notes-syntax',
    'summaryCard': 'notes-summary',
    'footerBlock': 'notes-footer',
    'everydayAnalogy': 'layman-analogy',
    'mentalModel': 'layman-mental-model',
    'industryUseCase': 'reallife-workflow',
    'careerRelevance': 'reallife-career',
    'businessApplication': 'reallife-business-case',
    'practicalRecap': 'reallife-user-journey',
    'outputDemonstration': 'code-preview',
    'diagrammaticBreakdown': 'visual-hero',
    'stepByStepVisualFlow': 'visual-process-flow',
    'comparativeVisualization': 'visual-comparison',
    'mentalModelVisualization': 'visual-mental-model',
    'realWorldVisualMapping': 'visual-architecture',
    'commonConfusionVisualization': 'visual-timeline',
    'visualSummary': 'visual-summary',
    'assessmentIntro': 'practice-hero',
    'instantFeedback': 'practice-benchmark',
    'task': 'assignment-workflow'
  };

  if (section === 'overview' && subsection === 'hero') return specs.find(a => a.id === 'overview-hero');
  if (section === 'assignment' && subsection === 'title') return specs.find(a => a.id === 'assignment-hero');
  if (section === 'project' && subsection === 'title') return specs.find(a => a.id === 'project-hero');
  if (section === 'project' && subsection === 'buildItems') return specs.find(a => a.id === 'project-roadmap');
  if (section === 'project' && subsection === 'deliverables') return specs.find(a => a.id === 'project-architecture');
  if (section === 'quiz' && subsection === 'title') return specs.find(a => a.id === 'quiz-hero');
  if (section === 'summary' && subsection === 'title') return specs.find(a => a.id === 'summary-mastery');
  if (section === 'interview' && subsection === 'title') return specs.find(a => a.id === 'interview-hero');
  if (section === 'ai_tutor' && subsection === 'title') return specs.find(a => a.id === 'ai-tutor-hero');
  if (section === 'technical' && subsection === 'sections') return specs.find(a => a.id === 'tech-architecture');

  const mappedId = exactMap[subsection];
  if (mappedId) {
    return specs.find(a => a.id === mappedId);
  }

  return specs.find(a => a.fieldPath.toLowerCase().includes(subsection.toLowerCase())) || null;
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

  useEffect(() => {
    const sectParam = searchParams.get('section');
    const subParam = searchParams.get('subsection');
    const assetParam = searchParams.get('asset');

    if (sectParam) {
      setSelectedSection(sectParam);
    }
    if (subParam) {
      setSelectedSubsection(subParam);
    }
    if (assetParam) {
      setSelectedAssetId(assetParam);
      // Generate prompt for visual asset
      const assetPrompt = getSvgAssetPromptForSection(sectParam || selectedSection, subtopic, assetParam);
      setGeneratedAssetPrompt(assetPrompt);
    }
  }, [searchParams, subtopic, selectedSection]);

  const handleGeneratePrompt = (assetId: string | null = null) => {
    if (assetId) {
      const assetPrompt = getSvgAssetPromptForSection(selectedSection, subtopic, assetId);
      setGeneratedAssetPrompt(assetPrompt);
      setSelectedAssetId(assetId);
    } else {
      const prompt = getPromptForSection(selectedSection, domain, subject, topic, subtopic, selectedSubsection || undefined);
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
