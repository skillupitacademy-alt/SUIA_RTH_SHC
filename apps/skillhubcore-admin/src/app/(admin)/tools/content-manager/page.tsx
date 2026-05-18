'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react/no-danger */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Eye, Sparkles, AlertTriangle, Terminal, Cpu, BookOpen, Info, AlertCircle
} from 'lucide-react';
import { BrandProvider, useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';
import {
  TUTORIAL_CONTENT_MANAGER_SECTION_OPTIONS,
  TUTORIAL_SECTION_TABS,
  type TutorialContentManagerSectionId,
} from '@quiz/types';
import { ASSET_SPECS } from '../prompt-generator/lib/asset-specs';

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
  message?: string;
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

const SUBSECTIONS_MAP: Record<string, Array<{ id: string; label: string; type: 'json' | 'svg' }>> = {
  notes: [
    { id: 'simpleWords', label: 'Simple Words (Text)', type: 'json' },
    { id: 'definitionBlock', label: 'Definition Block (JSON)', type: 'json' },
    { id: 'sections', label: 'Detailed Sections List (JSON)', type: 'json' },
    { id: 'syntaxBlock', label: 'Syntax Block (JSON)', type: 'json' },
    { id: 'componentGrid', label: 'Component Grid (JSON)', type: 'json' },
    { id: 'examplePanel', label: 'Example Panel (JSON)', type: 'json' },
    { id: 'practiceCard', label: 'Practice Card (JSON)', type: 'json' },
    { id: 'warningFaq', label: 'Warning FAQ (JSON)', type: 'json' },
    { id: 'summaryCard', label: 'Summary Card (JSON)', type: 'json' },
    { id: 'footerBlock', label: 'Footer Block (JSON)', type: 'json' },
    { id: 'flashcardVisualSystem', label: 'Flashcard Visual System (JSON)', type: 'json' },
    { id: 'comparisonSummaryChart', label: 'Comparison Summary Chart (JSON)', type: 'json' },
    { id: 'mnemonicRetentionGraphic', label: 'Mnemonic Retention Graphic (JSON)', type: 'json' },
    { id: 'summaryHeroSvg', label: 'Summary Hero (SVG)', type: 'svg' },
    { id: 'conceptMemoryMapSvg', label: 'Concept Memory Map (SVG)', type: 'svg' },
    { id: 'cheatSheetSVG', label: 'Cheat Sheet (SVG)', type: 'svg' },
  ],
  layman: [
    { id: 'simpleOverview', label: 'Simple Overview (JSON)', type: 'json' },
    { id: 'everydayAnalogy', label: 'Everyday Analogy (JSON)', type: 'json' },
    { id: 'whyItExists', label: 'Why It Exists (JSON)', type: 'json' },
    { id: 'simpleUseCases', label: 'Simple Use Cases (JSON)', type: 'json' },
    { id: 'beginnerBreakdown', label: 'Beginner Breakdown (JSON)', type: 'json' },
    { id: 'mentalModel', label: 'Mental Model framework (JSON)', type: 'json' },
    { id: 'commonConfusions', label: 'Common Confusions (JSON)', type: 'json' },
    { id: 'simpleRecap', label: 'Simple Recap (JSON)', type: 'json' },
    { id: 'heroVisualSvg', label: 'Hero Visual (SVG)', type: 'svg' },
    { id: 'analogySvg', label: 'Analogy Graphic (SVG)', type: 'svg' },
    { id: 'mentalModelSvg', label: 'Mental Model diagram (SVG)', type: 'svg' },
  ],
  overview: [
    { id: 'hero', label: 'Hero Block (JSON)', type: 'json' },
    { id: 'progressSummary', label: 'Progress Summary (JSON)', type: 'json' },
    { id: 'learningOutcomes', label: 'Learning Outcomes (JSON)', type: 'json' },
    { id: 'learningRoadmap', label: 'Learning Roadmap (JSON)', type: 'json' },
    { id: 'recommendedFlow', label: 'Recommended Flow (JSON)', type: 'json' },
    { id: 'readinessContext', label: 'Readiness Context (JSON)', type: 'json' },
    { id: 'navigation', label: 'Navigation Links (JSON)', type: 'json' },
  ],
  real_life: [
    { id: 'conceptMapping', label: 'Concept Mapping (JSON)', type: 'json' },
    { id: 'industryUseCase', label: 'Industry Use Case (JSON)', type: 'json' },
    { id: 'dailyLifeExample', label: 'Daily Life Example (JSON)', type: 'json' },
    { id: 'careerRelevance', label: 'Career Relevance (JSON)', type: 'json' },
    { id: 'problemSolutionContext', label: 'Problem & Solution (JSON)', type: 'json' },
    { id: 'businessApplication', label: 'Business Application (JSON)', type: 'json' },
    { id: 'domainScenarios', label: 'Domain Scenarios (JSON)', type: 'json' },
    { id: 'practicalRecap', label: 'Practical Recap (JSON)', type: 'json' },
  ],
  technical: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'badge', label: 'Badge (Text)', type: 'json' },
    { id: 'intro', label: 'Introduction (Text)', type: 'json' },
    { id: 'sections', label: 'Technical Sections (JSON)', type: 'json' },
  ],
  code: [
    { id: 'problemContext', label: 'Problem Context (JSON)', type: 'json' },
    { id: 'basicCodeExample', label: 'Basic Code Example (JSON)', type: 'json' },
    { id: 'lineByLineExplanation', label: 'Line-by-Line Explanation (JSON)', type: 'json' },
    { id: 'outputDemonstration', label: 'Output Demonstration (JSON)', type: 'json' },
    { id: 'bestPracticeVersion', label: 'Best Practice Version (JSON)', type: 'json' },
    { id: 'commonMistakes', label: 'Common Mistakes (JSON)', type: 'json' },
    { id: 'realWorldImplementation', label: 'Real World Implementation (JSON)', type: 'json' },
    { id: 'codeSummary', label: 'Code Summary (JSON)', type: 'json' },
  ],
  visual: [
    { id: 'conceptVisualIntro', label: 'Concept Visual Intro (JSON)', type: 'json' },
    { id: 'diagrammaticBreakdown', label: 'Diagrammatic Breakdown (JSON)', type: 'json' },
    { id: 'stepByStepVisualFlow', label: 'Step-by-Step Flow (JSON)', type: 'json' },
    { id: 'comparativeVisualization', label: 'Comparative Visualization (JSON)', type: 'json' },
    { id: 'mentalModelVisualization', label: 'Mental Model Visualization (JSON)', type: 'json' },
    { id: 'realWorldVisualMapping', label: 'Real World Visual Mapping (JSON)', type: 'json' },
    { id: 'commonConfusionVisualization', label: 'Common Confusion Visual (JSON)', type: 'json' },
    { id: 'visualSummary', label: 'Visual Summary (JSON)', type: 'json' },
  ],
  practice: [
    { id: 'assessmentIntro', label: 'Assessment Intro (JSON)', type: 'json' },
    { id: 'conceptRecallQuestions', label: 'Concept Recall Questions (JSON)', type: 'json' },
    { id: 'scenarioBasedQuestions', label: 'Scenario Based Questions (JSON)', type: 'json' },
    { id: 'difficultyProgression', label: 'Difficulty Progression (JSON)', type: 'json' },
    { id: 'instantFeedback', label: 'Instant Feedback Config (JSON)', type: 'json' },
    { id: 'commonMistakeDetection', label: 'Common Mistake Detection (JSON)', type: 'json' },
    { id: 'performanceAnalytics', label: 'Performance Analytics (JSON)', type: 'json' },
    { id: 'revisionRecommendations', label: 'Revision Recommendations (JSON)', type: 'json' },
  ],
  assignment: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'description', label: 'Description (Text)', type: 'json' },
    { id: 'task', label: 'Task Instructions (JSON)', type: 'json' },
    { id: 'objectives', label: 'Learning Objectives (JSON)', type: 'json' },
    { id: 'starterCode', label: 'Starter Code (Text)', type: 'json' },
    { id: 'submissionGuidelines', label: 'Submission Guidelines (JSON)', type: 'json' },
  ],
  project: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'description', label: 'Description (Text)', type: 'json' },
    { id: 'deadline', label: 'Deadline (Text)', type: 'json' },
    { id: 'hero', label: 'Hero Config (JSON)', type: 'json' },
    { id: 'realWorldUse', label: 'Real World Use (Text)', type: 'json' },
    { id: 'skills', label: 'Skills Addressed (JSON)', type: 'json' },
    { id: 'buildItems', label: 'Build Phases (JSON)', type: 'json' },
    { id: 'deliverables', label: 'Deliverables List (JSON)', type: 'json' },
  ],
  quiz: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'description', label: 'Description (Text)', type: 'json' },
    { id: 'totalQuestions', label: 'Total Questions Count (Number)', type: 'json' },
    { id: 'questions', label: 'Questions Pool (JSON)', type: 'json' },
  ],
  summary: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'description', label: 'Description (Text)', type: 'json' },
    { id: 'masteryRecapCard', label: 'Mastery Recap Card (JSON)', type: 'json' },
    { id: 'keyTakeawayGrid', label: 'Key Takeaway Grid (JSON)', type: 'json' },
    { id: 'revisionChecklist', label: 'Revision Checklist (JSON)', type: 'json' },
    { id: 'nextStepPanel', label: 'Next Step Panel (JSON)', type: 'json' },
  ],
  interview: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'description', label: 'Description (Text)', type: 'json' },
    { id: 'interviewIntroCard', label: 'Interview Intro Card (JSON)', type: 'json' },
    { id: 'questionBankPanel', label: 'Question Bank Panel (JSON)', type: 'json' },
    { id: 'answerFrameworkCard', label: 'Answer Framework Card (JSON)', type: 'json' },
    { id: 'mockInterviewFlow', label: 'Mock Interview Flow (JSON)', type: 'json' },
  ],
  ai_tutor: [
    { id: 'greeting', label: 'Greeting (Text)', type: 'json' },
    { id: 'qaPairs', label: 'Q&A Pairs (JSON)', type: 'json' },
    { id: 'tutorPromptCard', label: 'Tutor Prompt Card (JSON)', type: 'json' },
    { id: 'misconceptionDetector', label: 'Misconception Detector (JSON)', type: 'json' },
    { id: 'adaptiveHintPanel', label: 'Adaptive Hint Panel (JSON)', type: 'json' },
  ],
};

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

interface LiveVisualizerPreviewProps {
  section: SectionType;
  subsection: string;
  rawData: string;
}

function LiveVisualizerPreview({ section, subsection, rawData }: LiveVisualizerPreviewProps) {
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const trimmed = rawData.trim();
    if (!trimmed) {
      setParsedData(null);
      return;
    }

    if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg')) {
      setParsedData({ type: 'svg', markup: trimmed });
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed[section]) {
        setParsedData({ type: 'json', content: parsed[section] });
      } else {
        setParsedData({ type: 'json', content: parsed });
      }
    } catch (e: any) {
      setError(e.message || 'Invalid JSON syntax');
      setParsedData(null);
    }
  }, [rawData, section, subsection]);

  if (!rawData.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
        <Info className="w-12 h-12 mb-4 text-slate-500 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-350">Visualizer Preview Ready</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2">
          Type or paste your JSON content or SVG markup in the editor to see it live-rendered in post-landing page theme styles.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-rose-400">
        <AlertCircle className="w-12 h-12 mb-4 text-rose-500" />
        <h3 className="text-lg font-bold text-rose-350">Syntax Alert</h3>
        <p className="text-xs text-rose-500/80 max-w-xs mt-2 font-mono bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
          {error}
        </p>
        <p className="text-[10px] text-slate-500 mt-4">
          Visualizer requires correct JSON or raw SVG format to draw mockups.
        </p>
      </div>
    );
  }

  if (parsedData?.type === 'svg') {
    return (
      <div className="flex flex-col h-full bg-slate-950/80 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
            <Sparkles size={12} /> Live SVG Illustration Preview
          </span>
          <span className="text-[10px] font-mono text-slate-500">Vector Render Mode</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white rounded-xl p-4 min-h-[300px] shadow-inner overflow-auto">
          <div 
            className="w-full max-w-[500px] flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: parsedData.markup }}
          />
        </div>
      </div>
    );
  }

  const content = parsedData?.content;
  if (!content) return null;

  const getSafe = (obj: any, path: string, fallback = '') => {
    if (!obj || typeof obj !== 'object') return fallback;
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur === null || typeof cur !== 'object') return fallback;
      cur = cur[p];
    }
    return cur !== undefined && cur !== null ? cur : fallback;
  };

  const renderNotesComponent = () => {
    if (!subsection) {
      return (
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl mb-4">
            <h4 className="text-xs font-black uppercase text-pink-500 tracking-wider">Notes Section Container View</h4>
          </div>
          {getSafe(content, 'simpleWords') && (
            <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
              <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded">Simple Words</span>
              <p className="text-sm font-semibold text-slate-200 mt-2 italic leading-relaxed">
                &ldquo;{getSafe(content, 'simpleWords')}&rdquo;
              </p>
            </div>
          )}
          {getSafe(content, 'definitionBlock') && (
            <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl border-l-4 border-l-pink-500">
              <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded">Definition Block</span>
              <h4 className="text-xl font-black text-white mt-2">{getSafe(content, 'definitionBlock.term')}</h4>
              <p className="text-xs text-slate-350 mt-1 leading-relaxed">{getSafe(content, 'definitionBlock.definition')}</p>
              {getSafe(content, 'definitionBlock.memoryHook') && (
                <div className="mt-3 bg-pink-950/20 border border-pink-900/50 rounded-xl p-3 text-[11px] text-pink-350 italic">
                  💡 {getSafe(content, 'definitionBlock.memoryHook')}
                </div>
              )}
            </div>
          )}
          {getSafe(content, 'componentGrid.components') && Array.isArray(getSafe(content, 'componentGrid.components')) && (
            <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
              <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded mb-3 block w-fit">Component Breakdown Grid</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {content.componentGrid.components.slice(0, 4).map((comp: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                      {comp.name || comp.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{comp.description || comp.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    switch (subsection) {
      case 'simpleWords':
        return (
          <div className="bg-slate-800/85 border border-slate-700/80 p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute -right-6 -bottom-6 text-pink-500/10"><BookOpen size={100} /></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase bg-pink-500/15 text-pink-400 px-2.5 py-1 rounded-md tracking-wider">
                Notes &bull; Simple Words
              </span>
            </div>
            <p className="text-base font-extrabold text-slate-100 leading-relaxed italic relative z-10">
              &ldquo;{typeof content === 'string' ? content : getSafe(content, 'simpleWords')}&rdquo;
            </p>
          </div>
        );

      case 'definitionBlock':
        return (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] font-black uppercase bg-pink-500/15 text-pink-400 px-2.5 py-1 rounded-md tracking-wider">
              Notes &bull; Glossary Definition Card
            </span>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {getSafe(content, 'term') || getSafe(content, 'definitionBlock.term') || 'Conceptual Term'}
                </h3>
                <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded leading-none">CORE</span>
              </div>
              <p className="text-xs text-slate-305 leading-relaxed font-semibold">
                {getSafe(content, 'definition') || getSafe(content, 'definitionBlock.definition') || 'Dictionary description...'}
              </p>
              
              {(getSafe(content, 'memoryHook') || getSafe(content, 'definitionBlock.memoryHook')) && (
                <div className="mt-4 bg-pink-950/20 border border-pink-900/30 rounded-2xl p-4 flex gap-2">
                  <span className="text-lg shrink-0">💡</span>
                  <div>
                    <h5 className="text-[10px] font-black text-pink-400 uppercase tracking-wider">Memory Hook Analogy</h5>
                    <p className="text-[11px] text-pink-200 font-semibold italic mt-0.5 leading-relaxed">
                      {getSafe(content, 'memoryHook') || getSafe(content, 'definitionBlock.memoryHook')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'warningFaq':
        return (
          <div className="bg-amber-950/20 border-2 border-amber-900/60 rounded-3xl p-6 shadow-xl relative">
            <span className="text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1 w-fit">
              <AlertTriangle size={12} /> Gotchas & Warning FAQ
            </span>
            <div className="mt-4 space-y-3">
              <h4 className="text-base font-bold text-amber-200 flex items-center gap-2">
                ⚠️ {getSafe(content, 'warningTitle') || 'Common Pitfall Trap'}
              </h4>
              <p className="text-xs text-amber-100/90 leading-relaxed font-semibold">
                {getSafe(content, 'warningDescription') || 'Description of the trap and warning criteria...'}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">
              {subsection} Subsection Detail
            </span>
            <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const renderLaymanComponent = () => {
    if (!subsection) {
      return (
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
            <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider">Layman Section Container View</h4>
          </div>
          {getSafe(content, 'everydayAnalogy.analogyName') && (
            <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl border-l-4 border-l-amber-500">
              <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Everyday Analogy</span>
              <h4 className="text-lg font-black text-white mt-2">{getSafe(content, 'everydayAnalogy.analogyName')}</h4>
              <p className="text-xs text-slate-350 mt-1 leading-relaxed">{getSafe(content, 'everydayAnalogy.explanation')}</p>
            </div>
          )}
        </div>
      );
    }

    switch (subsection) {
      case 'everydayAnalogy':
        return (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 text-amber-500/10"><Cpu size={100} /></div>
            <span className="text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1 w-fit">
              <Cpu size={12} /> Layman &bull; Everyday Analogy
            </span>
            <div className="mt-4 space-y-3 relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight">
                {getSafe(content, 'analogyName') || getSafe(content, 'everydayAnalogy.analogyName') || 'Metaphor Comparison'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {getSafe(content, 'explanation') || getSafe(content, 'everydayAnalogy.explanation') || 'Plain English analogy breakdown...'}
              </p>
              
              {(getSafe(content, 'visualConcept') || getSafe(content, 'everydayAnalogy.visualConcept')) && (
                <div className="mt-3 bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-[11px] text-amber-300 font-medium">
                  🎨 Metaphor Graphic Mapping: {getSafe(content, 'visualConcept') || getSafe(content, 'everydayAnalogy.visualConcept')}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              {subsection} Subsection Detail
            </span>
            <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const renderCodeComponent = () => {
    if (subsection === 'basicCodeExample') {
      return (
        <div className="bg-slate-905 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Code Sandbox Preview</span>
          </div>
          <div className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-white">
              🖥️ {getSafe(content, 'title') || getSafe(content, 'basicCodeExample.title') || 'Interactive Editor File'}
            </h4>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 font-mono text-xs text-emerald-400">
              <pre className="overflow-x-auto whitespace-pre">
                {getSafe(content, 'code') || getSafe(content, 'basicCodeExample.code') || '# Paste programming syntax here'}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    if (subsection === 'outputDemonstration') {
      return (
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-900 pb-2">
            <Terminal size={16} className="text-slate-500" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Console Simulator Output</span>
          </div>
          <div className="font-mono text-xs text-slate-350 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
              &gt; {getSafe(content, 'simulatedLogs') || getSafe(content, 'outputDemonstration.simulatedLogs') || 'Execution logs...'}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
          Code &bull; {subsection || 'Whole Section'} Detail
        </span>
        <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
  };

  const renderComponentBody = () => {
    switch (section) {
      case 'notes':
        return renderNotesComponent();
      case 'layman':
        return renderLaymanComponent();
      case 'code':
        return renderCodeComponent();
      default:
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <span className="text-[10px] font-black uppercase bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                Section: {section.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {subsection ? `Subsection: ${subsection}` : 'Whole Block Render'}
              </span>
            </div>
            <pre className="overflow-auto bg-slate-950 rounded-xl p-4 text-[11px] text-slate-300 max-h-[450px] border border-slate-850 font-mono">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl overflow-hidden min-h-[450px]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-2 font-mono">
            Live Component Visualizer
          </span>
        </div>
        <span className="bg-pink-500/10 text-pink-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 animate-pulse">
          <Eye size={12} /> Active Preview Map
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-1">
        {renderComponentBody()}
      </div>
    </div>
  );
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

  const selectedSectionLabel = sections.find((section) => section.id === selectedSection)?.label ?? selectedSection;
  const allowedAssetFieldPaths = getAllowedAssetFieldPaths(selectedSection);

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
      const url = `/api/content-manager/add-section?subtopicId=${subtopicInfo.subtopicId.trim()}&section=${selectedSection}${
        selectedSubsection ? `&subsection=${selectedSubsection}` : ''
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
          // It's an InlineSvgAsset! Automatically decode base64 back into SVG markup for seamless editing!
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

      // Default stringifying
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
        // Sanitize AI output: strip markdown fences, unwrap JSON {"svg":"..."} wrapper
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
            // Not JSON, leave as-is
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
    let finalContent: unknown;
    const trimmedInput = jsonInput.trim();

    if (!trimmedInput) {
      showMessage('Please provide content in the editor.', 'error');
      return;
    }

    if (selectedSubsection) {
      const subSecConfig = SUBSECTIONS_MAP[selectedSection]?.find((s) => s.id === selectedSubsection);
      if (subSecConfig?.type === 'svg' && (trimmedInput.startsWith('<svg') || trimmedInput.startsWith('<?xml') || trimmedInput.includes('<svg'))) {
        // Raw SVG payload - sent directly as text, the API handles wrapping as InlineSvgAsset!
        finalContent = trimmedInput;
      } else {
        try {
          finalContent = JSON.parse(trimmedInput);
        } catch {
          // Treat as raw text
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Workspace Editor */}
              <section className="lg:col-span-6 rounded-2xl bg-white p-8 shadow-lg space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 border-b border-slate-100 pb-3 flex items-center justify-between">
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

              {/* Right Column: Live visualizer container */}
              <section className="lg:col-span-6 lg:sticky lg:top-8 self-start h-[850px] flex flex-col">
                <LiveVisualizerPreview 
                  section={selectedSection}
                  subsection={selectedSubsection}
                  rawData={jsonInput}
                />
              </section>

            </div>
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
