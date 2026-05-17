/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Eye, Sparkles, Edit, List, Map, 
  ArrowRight, Cpu, Compass, CheckCircle2, 
  AlertTriangle, Terminal, Layers
} from 'lucide-react';
import { BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';

interface SubsectionInfo {
  id: string;
  label: string;
  purpose: string;
  components: string[];
  svgId?: string;
  svgLabel?: string;
}

interface SectionSpec {
  id: string;
  label: string;
  description: string;
  color: string;
  glowColor: string;
  subsections: SubsectionInfo[];
}

const SECTIONS_SPECS: SectionSpec[] = [
  {
    id: 'overview',
    label: '1. Overview',
    description: 'Establishes the educational context, high-level readiness, and recommended learning flow.',
    color: 'from-pink-500 to-rose-600',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    subsections: [
      { id: 'hero', label: 'Hero Block', purpose: 'Large conceptual introduction visual banner', components: ['Hero Title', 'Intro Subtitle', 'Concept Image Overlay'], svgId: 'overview-hero', svgLabel: 'Overview Hero Banner' },
      { id: 'progressSummary', label: 'Progress Summary', purpose: 'Indicates user stage and checklist progress', components: ['Linear Progress Bar', 'Percent Badge', 'Next Step Button'] },
      { id: 'learningOutcomes', label: 'Learning Outcomes', purpose: 'What the student will build or master', components: ['Tick Items', 'Skill Gain Grid'] },
      { id: 'learningRoadmap', label: 'Learning Roadmap', purpose: 'Sequential flow diagram showing topic progress', components: ['Roadmap Nodes', 'Connection Lines'] },
      { id: 'recommendedFlow', label: 'Recommended Flow', purpose: 'Step-by-step pathway advice based on level', components: ['Pills', 'Next Recommended Tab Badge'] },
      { id: 'readinessContext', label: 'Readiness Context', purpose: 'List of pre-requisites and mindset framing', components: ['Mindset Alert', 'Prerequisite Links'] },
      { id: 'navigation', label: 'Navigation Links', purpose: 'Quick jump anchors to other major sections', components: ['Jump buttons'] }
    ]
  },
  {
    id: 'notes',
    label: '2. Notes (Deep-Dive)',
    description: 'The core educational textbook layer, containing terms, definitions, and code syntax breakdown.',
    color: 'from-orange-500 to-pink-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    subsections: [
      { id: 'simpleWords', label: 'Simple Words', purpose: 'Friendly 2-sentence description of the concept', components: ['Intro text block'] },
      { id: 'definitionBlock', label: 'Definition Block', purpose: 'Canonical, dictionary-style term glossary card', components: ['Term badge', 'Formal definition', 'Key traits', 'Memory hook'] },
      { id: 'conceptMemoryMap', label: 'Memory Map Graphic', purpose: 'SVG node diagram illustrating relationship connections', components: ['Memory map title', 'SVG node chart'], svgId: 'notes-memory-map', svgLabel: 'Concept Memory Map' },
      { id: 'syntaxBlock', label: 'Syntax Block', purpose: 'Syntax diagram with highlights pointing out code elements', components: ['Syntax Title Block', 'Visual pointing SVG diagram'], svgId: 'notes-syntax', svgLabel: 'Syntax Diagram' },
      { id: 'componentGrid', label: 'Component Grid', purpose: 'A layout grid detailing major sub-elements', components: ['3-column cards', 'Hover animations'] },
      { id: 'examplePanel', label: 'Example Panel', purpose: 'A detailed example of syntax with explanation', components: ['Code card', 'Protip note'] },
      { id: 'practiceCard', label: 'Practice Card', purpose: 'A quick recall block to test immediate learning', components: ['Quick recall quiz options'] },
      { id: 'warningFaq', label: 'Warning FAQ', purpose: 'Critical common traps and FAQs', components: ['Warning Banner', 'Gotchas list'] },
      { id: 'summaryCard', label: 'Summary Card', purpose: 'An aesthetic summary graphic for rapid revision', components: ['Revision intent', 'SVG summary infographic'], svgId: 'notes-summary', svgLabel: 'Revision Summary' },
      { id: 'footerBlock', label: 'Footer Block', purpose: 'Closing section call-to-action banner', components: ['Closing line', 'SVG Footer Illustration'], svgId: 'notes-footer', svgLabel: 'Footer Visual' }
    ]
  },
  {
    id: 'layman',
    label: '3. Layman',
    description: 'Simplifies advanced theory using relatable analogies and a friendly, intuitive mental model.',
    color: 'from-amber-500 to-orange-500',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    subsections: [
      { id: 'simpleOverview', label: 'Simple Overview', purpose: 'Welcoming non-technical introduction banner', components: ['Friendly title', 'Illustrative overview SVG'], svgId: 'layman-overview', svgLabel: 'Concept Overview' },
      { id: 'everydayAnalogy', label: 'Everyday Analogy', purpose: 'The core comparison card detailing a real-life analog', components: ['Analogy card title', 'Real-world analog story', 'Analogy SVG Graphic'], svgId: 'layman-analogy', svgLabel: 'Everyday Analogy' },
      { id: 'whyItExists', label: 'Why It Exists', purpose: 'Highlights historical reasons for creation', components: ['Problem solved cards', 'Before-and-after grid'] },
      { id: 'simpleUseCases', label: 'Simple Use Cases', purpose: 'Simple situations where this tool is standard', components: ['Layman Use Case cards'] },
      { id: 'beginnerBreakdown', label: 'Beginner Breakdown', purpose: 'Step-by-step plain English breakdown of components', components: ['Accordion cards', 'No-code process flow'] },
      { id: 'mentalModel', label: 'Mental Model Framework', purpose: 'A structured mental model connection diagram', components: ['Mental model mapping', 'SVG connection graph'], svgId: 'layman-mental-model', svgLabel: 'Mental Model Diagram' },
      { id: 'commonConfusions', label: 'Common Confusions', purpose: 'Common layman-level misconceptions clarified', components: ['Myth vs Fact cards'] },
      { id: 'simpleRecap', label: 'Simple Recap', purpose: 'A short, cheerful closing summary card', components: ['Recap bullet points'] }
    ]
  },
  {
    id: 'real_life',
    label: '4. Real Life',
    description: 'Demonstrates professional industry usage, workflows, and job relevance.',
    color: 'from-blue-500 to-indigo-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    subsections: [
      { id: 'conceptMapping', label: 'Concept Mapping', purpose: 'Connecting educational terms to real software systems', components: ['System map', 'Glow labels'] },
      { id: 'industryUseCase', label: 'Industry Use Case', purpose: 'How companies (e.g. Netflix, Amazon) apply this subtopic', components: ['Company brand logo', 'Production metrics', 'Workflow diagram SVG'], svgId: 'reallife-workflow', svgLabel: 'Industry Workflow Diagram' },
      { id: 'dailyLifeExample', label: 'Daily Life Example', purpose: 'A developer-level day-to-day workflow scenario', components: ['Developer story card', 'Command outputs'] },
      { id: 'careerRelevance', label: 'Career Relevance', purpose: 'Job title relevance, salaries, and resume bullets', components: ['Salary slider', 'Job title pills', 'Resume bullet highlights'], svgId: 'reallife-career', svgLabel: 'Career Context Visual' },
      { id: 'problemSolutionContext', label: 'Problem & Solution', purpose: 'Strict business-level problem statement', components: ['Problem statement banner', 'Surgical architecture solution'] },
      { id: 'businessApplication', label: 'Business Application', purpose: 'Financial and operational impact of using this subtopic', components: ['ROI metrics card', 'Scale illustration SVG'], svgId: 'reallife-business-case', svgLabel: 'Business Case Visual' },
      { id: 'domainScenarios', label: 'Domain Scenarios', purpose: 'Scenarios in FinTech, EdTech, Healthcare, etc.', components: ['Domain cards', 'Scenario comparisons'] },
      { id: 'practicalRecap', label: 'Practical Recap', purpose: 'Horizontal timeline workflow summarizing the section', components: ['Timeline nodes', 'User journey SVG diagram'], svgId: 'reallife-user-journey', svgLabel: 'User Journey Map' }
    ]
  },
  {
    id: 'technical',
    label: '5. Technical',
    description: 'Deep dive into advanced system internals, sequence lifecycles, and data structures.',
    color: 'from-purple-500 to-indigo-600',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main advanced technical header block', components: ['Section title', 'Execution badge'] },
      { id: 'badge', label: 'Badge', purpose: 'Advanced concepts difficulty badge indicator', components: ['Level pill', 'Topics covered indicator'] },
      { id: 'intro', label: 'Introduction', purpose: 'Architectural overview introduction text', components: ['Advanced introductory brief'] },
      { id: 'sections', label: 'Technical Sections', purpose: 'Internal details, workflows, and advanced sequence diagrams', components: ['Technical paragraph panels', 'Architecture SVG', 'Sequence flowchart SVG'], svgId: 'tech-architecture', svgLabel: 'System Architecture' }
    ]
  },
  {
    id: 'code',
    label: '6. Code',
    description: 'Clean coding paradigms, line-by-line internal breakdowns, and mistake highlights.',
    color: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    subsections: [
      { id: 'problemContext', label: 'Problem Context', purpose: 'Describes what program objective we are writing', components: ['Objective bullet points', 'Constraints box'] },
      { id: 'basicCodeExample', label: 'Basic Code Example', purpose: 'Interactive editor card containing clean code snippet', components: ['Active file tab', 'Syntax highlighted editor window'] },
      { id: 'lineByLineExplanation', label: 'Line Breakdown', purpose: 'Granular explanation of critical code lines', components: ['Interactive line highlighted explanation table'] },
      { id: 'outputDemonstration', label: 'Output Preview', purpose: 'A simulated terminal console depicting output logs', components: ['Terminal shell card', 'Simulated preview layout SVG'], svgId: 'code-preview', svgLabel: 'Output Preview' },
      { id: 'bestPracticeVersion', label: 'Best Practice Version', purpose: 'Optimized version of the code snippet (e.g. caching, DRY)', components: ['Optimization logs', 'Performance comparison graph'] },
      { id: 'commonMistakes', label: 'Common Mistakes', purpose: 'Surgical before/after comparison of buggy vs corrected code', components: ['Buggy red code card', 'Corrected green code card'] },
      { id: 'realWorldImplementation', label: 'Real World Block', purpose: 'How to deploy or build this in an app environment', components: ['Deployment steps', 'Production config box'] },
      { id: 'codeSummary', label: 'Code Summary', purpose: 'Closing recap checklist for programmers', components: ['Programmer checklist'] }
    ]
  },
  {
    id: 'visual',
    label: '7. Visual (System Diagram)',
    description: 'Dedicated purely to visualizing abstract systems using dynamic charts and lifecycles.',
    color: 'from-teal-500 to-cyan-500',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    subsections: [
      { id: 'conceptVisualIntro', label: 'Visual Intro', purpose: 'Introductory caption text for visual diagrams', components: ['Ecosystem intro paragraph'] },
      { id: 'diagrammaticBreakdown', label: 'Diagram Breakdown', purpose: 'Core diagrammatic view of the educational concept', components: ['Interactive svg container', 'Visual legends'], svgId: 'visual-hero', svgLabel: 'Full Concept Visualization' },
      { id: 'stepByStepVisualFlow', label: 'Step Flowchart', purpose: 'Process sequence visual chart', components: ['Process sequence nodes', 'Step details'], svgId: 'visual-process-flow', svgLabel: 'Process Flow Diagram' },
      { id: 'comparativeVisualization', label: 'Comparison Matrix', purpose: 'Matrix diagram highlighting conceptual contrasts', components: ['Side-by-side SVG matrix'], svgId: 'visual-comparison', svgLabel: 'Comparative Framework' },
      { id: 'mentalModelVisualization', label: 'Mental Model Diagram', purpose: 'SVG translation diagram of LAYMAN model', components: ['Visual metaphor card'], svgId: 'visual-mental-model', svgLabel: 'Mental Model Diagram' },
      { id: 'realWorldVisualMapping', label: 'Real World Map', purpose: 'Multi-layer system deployment pipeline diagram', components: ['High fidelity deployment map SVG'], svgId: 'visual-architecture', svgLabel: 'Multi-Layer Architecture' },
      { id: 'commonConfusionVisualization', label: 'Confusion Visual', purpose: 'Visual timeline showing progression and state changes', components: ['State lifecycle chart SVG'], svgId: 'visual-timeline', svgLabel: 'Timeline / Lifecycle' },
      { id: 'visualSummary', label: 'Visual Summary', purpose: 'Closing memory compression visual chart', components: ['Rapid revision visual infographic'], svgId: 'visual-summary', svgLabel: 'Memory Compression Infographic' }
    ]
  },
  {
    id: 'practice',
    label: '8. Practice',
    description: 'Interactive concept recall quizzes, scenario challenges, and instant correction.',
    color: 'from-violet-500 to-fuchsia-500',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    subsections: [
      { id: 'assessmentIntro', label: 'Assessment Intro', purpose: 'Motivation prompt card for practice test', components: ['Motivational tagline', 'Ready badge', 'XP potential banner'], svgId: 'practice-hero', svgLabel: 'Practice Test Hero Dashboard' },
      { id: 'conceptRecallQuestions', label: 'Recall Questions', purpose: 'Core pool of basic conceptual MCQs', components: ['Question label', 'Option grids'] },
      { id: 'scenarioBasedQuestions', label: 'Scenario Questions', purpose: 'Advanced scenario-based developer questions', components: ['Scenario paragraph', 'Complex options'] },
      { id: 'instantFeedback', label: 'Feedback Config', purpose: 'Configuration detailing explanations and readiness charts', components: ['Score meter', 'Recommendation advice SVG'], svgId: 'practice-benchmark', svgLabel: 'Readiness Benchmark' }
    ]
  },
  {
    id: 'assignment',
    label: '9. Assignment',
    description: 'Individual developer tasks, duration specs, objectives, and starter templates.',
    color: 'from-rose-500 to-pink-500',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main assignment header card', components: ['Task title', 'XP Reward indicator', 'Difficulty badge'], svgId: 'assignment-hero', svgLabel: 'Assignment Hero Dashboard' },
      { id: 'description', label: 'Description', purpose: 'Introductory problem context details', components: ['Summary text'] },
      { id: 'duration', label: 'Duration Spec', purpose: 'Estimated time limit to build this task', components: ['Estimated hours badge'] },
      { id: 'task', label: 'Task Steps', purpose: 'Step-by-step task flow infographic guiding the build', components: ['Task flow SVG infographic'], svgId: 'assignment-workflow', svgLabel: 'Task Workflow Diagram' },
      { id: 'objectives', label: 'Objectives', purpose: 'Surgical learning goals to achieve', components: ['Target milestones checklist'] },
      { id: 'starterCode', label: 'Starter Code', purpose: 'Starter template code snippet', components: ['Pre-populated starter editor'] },
      { id: 'submissionGuidelines', label: 'Submission Rules', purpose: 'Guidelines to submit and verify code', components: ['Verification terminal steps'] }
    ]
  },
  {
    id: 'project',
    label: '10. Project',
    description: 'Capstone project guides, multi-phase build plans, and target deliverables.',
    color: 'from-indigo-500 to-violet-600',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main capstone project dashboard header card', components: ['Project Title', 'Career relevance context'], svgId: 'project-hero', svgLabel: 'Project Hero Dashboard' },
      { id: 'description', label: 'Description', purpose: 'Complete production spec details', components: ['Operational objectives brief'] },
      { id: 'buildItems', label: 'Build Phases', purpose: 'Detailed timeline roadmap guiding development phases', components: ['Phased roadmap SVG diagram'], svgId: 'project-roadmap', svgLabel: 'Development Roadmap' },
      { id: 'deliverables', label: 'Deliverables List', purpose: 'Blueprint detailing exact system layers to submit', components: ['Target output deliverables', 'System architecture blueprint SVG'], svgId: 'project-architecture', svgLabel: 'System Architecture' }
    ]
  },
  {
    id: 'interview',
    label: '11. Interview Prep',
    description: 'Core interview Q&A bank, confidence frameworks, and mock dialogue flow.',
    color: 'from-pink-600 to-orange-600',
    glowColor: 'rgba(219, 39, 119, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main interview preparation dashboard header', components: ['Prep title', 'Confidence framework illustration SVG'], svgId: 'interview-hero', svgLabel: 'Interview Prep Hero' },
      { id: 'description', label: 'Description', purpose: 'Introductory context for job seekers', components: ['Aspirational job role matching tags'] },
      { id: 'interviewIntroCard', label: 'Interview Intro', purpose: 'Introduction to common question types', components: ['Intro details list'] },
      { id: 'questionBankPanel', label: 'Question Bank', purpose: 'Interactive question bank with accordion panels', components: ['Question list', 'Show answer buttons'] },
      { id: 'answerFrameworkCard', label: 'Answer Framework', purpose: 'The structure of a perfect answer (e.g. STAR method)', components: ['STAR method cards', 'Protip badges'] },
      { id: 'mockInterviewFlow', label: 'Mock Interview Flow', purpose: 'Simulated mock interviewer-student dialogue cards', components: ['Dialog bubbles', 'Feedback ratings'] }
    ]
  }
];

export function VisualGuideUI() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('notes');
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string>('definitionBlock');
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);

  const activeSection = SECTIONS_SPECS.find(s => s.id === selectedSectionId) || SECTIONS_SPECS[1];
  const activeSubsection = activeSection.subsections.find(sub => sub.id === selectedSubsectionId) || activeSection.subsections[0];

  const wireframeCanvasRef = useRef<HTMLDivElement>(null);

  // Sync subsection when section changes
  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const sect = SECTIONS_SPECS.find(s => s.id === sectionId) || SECTIONS_SPECS[1];
    setSelectedSubsectionId(sect.subsections[0].id);
    scrollToWireframeSegment(sectionId);
  };

  const scrollToWireframeSegment = (sectionId: string) => {
    if (!wireframeCanvasRef.current) return;
    const element = wireframeCanvasRef.current.querySelector(`#wireframe-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedElement(sectionId);
      setTimeout(() => setHighlightedElement(null), 2500);
    }
  };

  useEffect(() => {
    if (highlightedElement) {
      const timer = setTimeout(() => setHighlightedElement(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedElement]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Upper Title Block */}
      <header className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-100">
        <div className="p-8 text-center bg-gradient-to-r from-pink-600 via-purple-600 to-orange-600">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight font-outfit">
            Global Visual Architecture & Component Guide
          </h1>
          <p className="text-white/90 text-lg font-semibold max-w-2xl mx-auto">
            An interactive reference guide mapping all 11 sections and their subsections to understand page placements, UI layouts, and AI prompt roles.
          </p>
        </div>
        
        {/* Navigation Shortcut Panel */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <Layers size={18} className="text-pink-600" />
            <span>Developer Workspace Connections:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href={`/tools/prompt-generator?section=${selectedSectionId}&subsection=${selectedSubsectionId}`}
              className="flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-100 hover:bg-pink-100 text-pink-600 font-bold rounded-xl transition-all"
            >
              <Sparkles size={16} />
              Open Prompt Generator
            </Link>
            <Link 
              href={`/tools/content-manager?section=${selectedSectionId}&subsection=${selectedSubsectionId}`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 hover:bg-orange-100 text-orange-600 font-bold rounded-xl transition-all"
            >
              <Edit size={16} />
              Open Content Manager
            </Link>
          </div>
        </div>
      </header>

      {/* Main Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Column (lg:col-span-5) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section Selection List */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <List size={20} className="text-purple-600" />
              11 Educational Sections
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {SECTIONS_SPECS.map((sect) => (
                <button
                  key={sect.id}
                  onClick={() => handleSectionChange(sect.id)}
                  className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all ${
                    selectedSectionId === sect.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]'
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                >
                  <span className="font-bold text-sm">{sect.label}</span>
                  <span className={`text-[10px] ${selectedSectionId === sect.id ? 'text-slate-400' : 'text-slate-500'} mt-1 truncate`}>
                    {sect.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subsections & Component Mappings */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Map size={20} className="text-orange-600" />
              Subsections & Components Map
            </h2>

            <div className="space-y-3 mb-6">
              <label htmlFor="subset-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Subsection for Deep Dive:
              </label>
              <select
                id="subset-select"
                value={selectedSubsectionId}
                onChange={(e) => setSelectedSubsectionId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
              >
                {activeSection.subsections.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.label} ({sub.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Subsection Details Dashboard */}
            <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md tracking-wider">
                  Subsection Role
                </span>
                <h3 className="text-base font-extrabold text-slate-800 mt-2">
                  {activeSubsection.label}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                  {activeSubsection.purpose}
                </p>
              </div>

              {/* Components Inside */}
              <div>
                <span className="text-[10px] font-black uppercase bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md tracking-wider">
                  Visible UI Elements Inside
                </span>
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeSubsection.components.map((comp, idx) => (
                    <span key={idx} className="bg-white border border-slate-200/80 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 hover:border-purple-300 transition-colors">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Associated SVG asset mapping */}
              {activeSubsection.svgId && (
                <div className="pt-4 border-t border-slate-200/60 space-y-2">
                  <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md tracking-wider flex w-fit items-center gap-1">
                    <Compass size={11} /> Associated SVG Image Asset
                  </span>
                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 flex items-center justify-between text-xs hover:bg-amber-50 transition-colors">
                    <div>
                      <p className="font-extrabold text-amber-900 leading-none">{activeSubsection.svgLabel}</p>
                      <p className="text-[9px] text-amber-600 font-bold mt-1">Asset ID: {activeSubsection.svgId}</p>
                    </div>
                    <Link 
                      href={`/tools/prompt-generator?section=${selectedSectionId}&asset=${activeSubsection.svgId}`}
                      className="flex items-center gap-1 text-[11px] font-black text-amber-700 hover:underline shrink-0"
                    >
                      Prompt specs <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Preview Column (lg:col-span-7) */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[750px] overflow-hidden">
          
          {/* Live Mockup Header Panel */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono ml-2">
                Simulated Canvas: /start-learning/subtopic/whatispython
              </span>
            </div>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Eye size={12} /> Live Preview Map
            </span>
          </div>

          {/* Simulated Educational Page Wireframe Content Canvas */}
          <div 
            ref={wireframeCanvasRef}
            className="flex-1 overflow-y-auto p-6 bg-slate-100/50 space-y-8 custom-scrollbar scroll-smooth"
          >
            
            {/* 1. OVERVIEW WIREFRAME SECTION */}
            <div 
              id="wireframe-overview"
              onClick={() => handleSectionChange('overview')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'overview' 
                  ? 'border-pink-500 bg-white ring-4 ring-pink-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'overview' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-pink-50 border border-pink-100 text-pink-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                1. OVERVIEW
              </div>
              
              {/* Header Wireframe */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="h-6 w-48 rounded bg-slate-200"></div>
                <div className="h-3 w-72 rounded bg-slate-100"></div>
              </div>

              {/* Hero Banner Grid Layout Mockup */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                <div className="md:col-span-8 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative overflow-hidden">
                  {/* Neon indicator for subsection hero */}
                  <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                    selectedSectionId === 'overview' && selectedSubsectionId === 'hero' 
                      ? 'border-pink-500 bg-pink-500/5 scale-100' 
                      : 'border-transparent'
                  }`} />
                  <div className="h-4 w-32 rounded bg-slate-200"></div>
                  <div className="h-3 w-56 rounded bg-slate-100"></div>
                  <div className="h-2 w-48 rounded bg-slate-100"></div>
                  <span className="text-[9px] font-black text-slate-400 mt-2">Hero Block (hero)</span>
                </div>
                
                {/* Outcomes */}
                <div className="md:col-span-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
                  <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                    selectedSectionId === 'overview' && selectedSubsectionId === 'learningOutcomes' 
                      ? 'border-pink-500 bg-pink-500/5 scale-100' 
                      : 'border-transparent'
                  }`} />
                  <div className="h-3 w-24 rounded bg-slate-200"></div>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="h-2 w-full rounded bg-slate-100"></div>
                    <div className="h-2 w-[90%] rounded bg-slate-100"></div>
                    <div className="h-2 w-[80%] rounded bg-slate-100"></div>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 mt-2">Outcomes</span>
                </div>
              </div>

              {/* Progress and Roadmap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
                  <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                    selectedSectionId === 'overview' && selectedSubsectionId === 'progressSummary' 
                      ? 'border-pink-500 bg-pink-500/5 scale-100' 
                      : 'border-transparent'
                  }`} />
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-28 rounded bg-slate-200"></div>
                    <div className="h-4 w-8 rounded bg-pink-100"></div>
                  </div>
                  <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
                    <div className="h-full w-[45%] bg-pink-500 rounded"></div>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 mt-1">Progress Block (progressSummary)</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
                  <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                    selectedSectionId === 'overview' && selectedSubsectionId === 'learningRoadmap' 
                      ? 'border-pink-500 bg-pink-500/5 scale-100' 
                      : 'border-transparent'
                  }`} />
                  <div className="h-3 w-28 rounded bg-slate-200"></div>
                  <div className="flex gap-2 items-center mt-1">
                    <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="h-[2px] w-8 bg-slate-200"></div>
                    <div className="w-5 h-5 rounded-full bg-pink-500 shrink-0"></div>
                    <div className="h-[2px] w-8 bg-slate-200"></div>
                    <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0"></div>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 mt-1">Roadmap Block (learningRoadmap)</span>
                </div>
              </div>
            </div>

            {/* 2. NOTES WIREFRAME SECTION */}
            <div 
              id="wireframe-notes"
              onClick={() => handleSectionChange('notes')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'notes' 
                  ? 'border-orange-500 bg-white ring-4 ring-orange-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'notes' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-orange-50 border border-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                2. NOTES
              </div>

              {/* Simple Words intro */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'notes' && selectedSubsectionId === 'simpleWords' 
                    ? 'border-orange-500 bg-orange-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="h-3 w-full rounded bg-slate-200"></div>
                <div className="h-3 w-[92%] rounded bg-slate-100 mt-1.5"></div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Simple Words (simpleWords)</span>
              </div>

              {/* Grid block for Hero and Definition */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                {/* Definition Block Wireframe (Aesthetic definition block) */}
                <div className="md:col-span-6 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
                  <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                    selectedSectionId === 'notes' && selectedSubsectionId === 'definitionBlock' 
                      ? 'border-orange-500 bg-orange-500/5 scale-100' 
                      : 'border-transparent'
                  }`} />
                  <div className="flex gap-2">
                    <span className="bg-pink-100 text-pink-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase leading-none">DEFINITION</span>
                  </div>
                  <div className="h-4 w-32 rounded bg-slate-300"></div>
                  <div className="h-3 w-full rounded bg-slate-200"></div>
                  <div className="h-3 w-[85%] rounded bg-slate-100"></div>
                  <div className="h-5 w-full rounded border border-pink-200 bg-pink-50/50 mt-1"></div>
                  <span className="text-[9px] font-black text-slate-400 mt-1">Definition Card (definitionBlock)</span>
                </div>

                {/* Concept Memory Map */}
                <div className="md:col-span-6 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
                  <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                    selectedSectionId === 'notes' && selectedSubsectionId === 'conceptMemoryMap' 
                      ? 'border-orange-500 bg-orange-500/5 scale-100' 
                      : 'border-transparent'
                  }`} />
                  <div className="h-3.5 w-36 rounded bg-slate-200"></div>
                  <div className="h-24 rounded bg-slate-200 flex items-center justify-center border border-dashed border-slate-300">
                    <Map size={24} className="text-slate-400 animate-pulse" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 mt-1">Memory Map SVG (conceptMemoryMap)</span>
                </div>
              </div>

              {/* Syntax block with diagram */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'notes' && selectedSubsectionId === 'syntaxBlock' 
                    ? 'border-orange-500 bg-orange-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 w-36 rounded bg-slate-300"></div>
                  <span className="bg-slate-200 text-[8px] font-mono px-2 py-0.5 rounded uppercase">Python Basic Syntax</span>
                </div>
                <div className="h-20 rounded bg-slate-900 p-3 font-mono text-xs text-emerald-400 flex flex-col gap-1">
                  <div><span className="text-pink-400">if</span> condition:</div>
                  <div className="pl-4 text-slate-300">print(<span className="text-amber-300">{"'Success!'"}</span>)</div>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Syntax Block (syntaxBlock)</span>
              </div>

              {/* Warning gotchas list */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex gap-3 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'notes' && selectedSubsectionId === 'warningFaq' 
                    ? 'border-orange-500 bg-orange-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="h-3 w-28 rounded bg-amber-200"></div>
                  <div className="h-2.5 w-[90%] rounded bg-amber-100"></div>
                </div>
                <span className="text-[9px] font-black text-slate-400 absolute right-3 bottom-1">Warning (warningFaq)</span>
              </div>
            </div>

            {/* 3. LAYMAN WIREFRAME SECTION */}
            <div 
              id="wireframe-layman"
              onClick={() => handleSectionChange('layman')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'layman' 
                  ? 'border-amber-500 bg-white ring-4 ring-amber-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'layman' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-amber-50 border border-amber-100 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                3. LAYMAN
              </div>

              {/* Analogy block */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col gap-3 relative">
                <div className={`absolute inset-0 border-2 rounded-2xl transition-all ${
                  selectedSectionId === 'layman' && selectedSubsectionId === 'everydayAnalogy' 
                    ? 'border-amber-500 bg-amber-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-100 text-amber-700 shrink-0"><Cpu size={16} /></div>
                  <div className="h-4 w-40 rounded bg-slate-350"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-7 flex flex-col gap-2">
                    <div className="h-3 w-full rounded bg-slate-200"></div>
                    <div className="h-3 w-[95%] rounded bg-slate-100"></div>
                    <div className="h-3 w-[88%] rounded bg-slate-100"></div>
                  </div>
                  <div className="md:col-span-5 h-20 rounded bg-slate-200 border border-slate-355 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400">Analogy SVG diagram</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Everyday Analogy (everydayAnalogy)</span>
              </div>
            </div>

            {/* 4. REAL LIFE WIREFRAME SECTION */}
            <div 
              id="wireframe-real_life"
              onClick={() => handleSectionChange('real_life')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'real_life' 
                  ? 'border-blue-500 bg-white ring-4 ring-blue-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'real_life' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-blue-50 border border-blue-100 text-blue-605 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                4. REAL LIFE
              </div>

              {/* Industry use case banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'real_life' && selectedSubsectionId === 'industryUseCase' 
                    ? 'border-blue-500 bg-blue-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="flex justify-between items-center mb-3">
                  <div className="h-4 w-40 rounded bg-slate-350"></div>
                  <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase">Production ready</span>
                </div>
                <div className="h-16 rounded bg-slate-200/80 border border-dashed border-slate-300 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400">Workflow SVG (industryWorkflow.image)</span>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Industry Use Case (industryUseCase)</span>
              </div>

              {/* Career relevance */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'real_life' && selectedSubsectionId === 'careerRelevance' 
                    ? 'border-blue-500 bg-blue-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="h-3.5 w-32 rounded bg-slate-200 mb-2"></div>
                <div className="flex gap-2">
                  <span className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2.5 py-1 rounded">DevOps Engineer</span>
                  <span className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2.5 py-1 rounded">Backend Developer</span>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Career Relevance (careerRelevance)</span>
              </div>
            </div>

            {/* 5. TECHNICAL WIREFRAME SECTION */}
            <div 
              id="wireframe-technical"
              onClick={() => handleSectionChange('technical')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'technical' 
                  ? 'border-purple-500 bg-white ring-4 ring-purple-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'technical' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-purple-50 border border-purple-100 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                5. TECHNICAL
              </div>

              {/* Architecture sequence block */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'technical' && selectedSubsectionId === 'sections' 
                    ? 'border-purple-500 bg-purple-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="h-4 w-44 rounded bg-slate-350 mb-3"></div>
                <div className="h-24 rounded bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-550">System Architecture SVG (diagramAsset)</span>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Technical Sections & Diagrams (sections)</span>
              </div>
            </div>

            {/* 6. CODE WIREFRAME SECTION */}
            <div 
              id="wireframe-code"
              onClick={() => handleSectionChange('code')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'code' 
                  ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'code' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                6. CODE
              </div>

              {/* Editor mockup */}
              <div className="rounded-xl border border-slate-300 bg-slate-50 overflow-hidden mb-4 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all z-20 ${
                  selectedSectionId === 'code' && selectedSubsectionId === 'basicCodeExample' 
                    ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="bg-slate-200 border-b border-slate-350 p-2 flex gap-1.5 items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="bg-slate-100 text-[8px] font-bold px-2 py-0.5 rounded border border-slate-300">index.py</span>
                </div>
                <div className="h-24 bg-slate-900 p-4 font-mono text-xs text-slate-300 flex flex-col gap-1">
                  <div><span className="text-pink-400">def</span> <span className="text-emerald-400">calculate_sum</span>(a, b):</div>
                  <div className="pl-4"><span className="text-pink-400">return</span> a + b</div>
                </div>
                <span className="text-[9px] font-black text-slate-400 absolute right-3 bottom-1">Code block (basicCodeExample)</span>
              </div>

              {/* Output Preview */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all z-20 ${
                  selectedSectionId === 'code' && selectedSubsectionId === 'outputDemonstration' 
                    ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="flex gap-1.5 items-center mb-2">
                  <Terminal size={14} className="text-slate-400" />
                  <span className="text-[9px] font-mono text-slate-400">Terminal Output</span>
                </div>
                <div className="h-10 bg-slate-950 rounded p-2 font-mono text-xs text-slate-400">
                  &gt; 5
                </div>
                <span className="text-[9px] font-black text-slate-505 absolute right-3 bottom-1">Console (outputDemonstration)</span>
              </div>
            </div>

            {/* 7. VISUAL WIREFRAME SECTION */}
            <div 
              id="wireframe-visual"
              onClick={() => handleSectionChange('visual')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'visual' 
                  ? 'border-teal-500 bg-white ring-4 ring-teal-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'visual' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-teal-50 border border-teal-100 text-teal-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                7. SYSTEM DIAGRAM
              </div>

              {/* Diagrammatic breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'visual' && selectedSubsectionId === 'diagrammaticBreakdown' 
                    ? 'border-teal-500 bg-teal-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="h-4 w-48 rounded bg-slate-350 mb-3"></div>
                <div className="h-28 rounded bg-slate-200 border border-slate-350 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400">Full Concept Visualization SVG (image)</span>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Ecosystem Diagram (diagrammaticBreakdown)</span>
              </div>
            </div>

            {/* 8. PRACTICE WIREFRAME SECTION */}
            <div 
              id="wireframe-practice"
              onClick={() => handleSectionChange('practice')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'practice' 
                  ? 'border-violet-500 bg-white ring-4 ring-violet-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'practice' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-violet-50 border border-violet-100 text-violet-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                8. PRACTICE
              </div>

              {/* Concept recall questions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'practice' && selectedSubsectionId === 'conceptRecallQuestions' 
                    ? 'border-violet-500 bg-violet-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="h-3 w-56 rounded bg-slate-355 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-8 w-full rounded border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-500 hover:border-violet-300 cursor-pointer flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div> Option A
                  </div>
                  <div className="h-8 w-full rounded border border-violet-200 bg-violet-50/50 p-2.5 text-xs font-bold text-violet-600 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border border-violet-400 bg-violet-400 flex items-center justify-center"><CheckCircle2 size={10} className="text-white" /></div> Correct Option B
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Practice Quiz (conceptRecallQuestions)</span>
              </div>
            </div>

            {/* 9. ASSIGNMENT WIREFRAME SECTION */}
            <div 
              id="wireframe-assignment"
              onClick={() => handleSectionChange('assignment')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'assignment' 
                  ? 'border-rose-500 bg-white ring-4 ring-rose-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'assignment' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                9. ASSIGNMENT
              </div>

              {/* Assignment spec */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'assignment' && selectedSubsectionId === 'title' 
                    ? 'border-rose-500 bg-rose-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4.5 w-40 rounded bg-slate-300"></div>
                  <span className="bg-pink-100 text-pink-600 text-[9px] font-bold px-2 py-0.5 rounded">+100 XP</span>
                </div>
                <div className="h-3 w-full rounded bg-slate-200"></div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Assignment Dashboard (title)</span>
              </div>
            </div>

            {/* 10. PROJECT WIREFRAME SECTION */}
            <div 
              id="wireframe-project"
              onClick={() => handleSectionChange('project')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'project' 
                  ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'project' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                10. PROJECT
              </div>

              {/* Project spec */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'project' && selectedSubsectionId === 'title' 
                    ? 'border-indigo-500 bg-indigo-500/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
                <div className="h-14 rounded bg-slate-200/80 border border-dashed border-slate-300 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400">Project Blueprint SVG (systemArchitecture)</span>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Project Dashboard (title)</span>
              </div>
            </div>

            {/* 11. INTERVIEW PREP WIREFRAME SECTION */}
            <div 
              id="wireframe-interview"
              onClick={() => handleSectionChange('interview')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                selectedSectionId === 'interview' 
                  ? 'border-pink-600 bg-white ring-4 ring-pink-600/10 scale-[1.01]' 
                  : 'border-slate-200/80 bg-white'
              } ${highlightedElement === 'interview' ? 'animate-pulse' : ''}`}
            >
              <div className="absolute top-3 right-3 bg-pink-50 border border-pink-100 text-pink-650 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                11. INTERVIEW PREP
              </div>

              {/* Question Bank */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
                <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
                  selectedSectionId === 'interview' && selectedSubsectionId === 'questionBankPanel' 
                    ? 'border-pink-600 bg-pink-600/5 scale-100' 
                    : 'border-transparent'
                }`} />
                <div className="h-3.5 w-44 rounded bg-slate-350 mb-3"></div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 flex justify-between items-center">
                  <span>How does this concept solve scaling issues?</span>
                  <span className="text-[10px] text-pink-650 hover:underline cursor-pointer">Show Answer</span>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 block">Q&A Bank (questionBankPanel)</span>
              </div>
            </div>

          </div>

        </section>

      </div>
    </div>
  );
}

export default function VisualGuidePage() {
  return (
    <BrandProvider brand={rthConfig}>
      <main className="min-h-screen bg-slate-50/50">
        <VisualGuideUI />
      </main>
    </BrandProvider>
  );
}
