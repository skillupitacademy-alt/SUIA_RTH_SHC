'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  ListChecks,
  Grid,
  ShieldCheck,
  BookOpen,
  Layout,
  Palette,
  Workflow,
  Cpu,
  TestTube,
  Sparkles,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';

interface RequirementCard {
  id: string;
  code: string;
  title: string;
  category: string;
  icon: React.ElementType;
  items: string[];
}

const requirements: RequirementCard[] = [
  {
    id: 'ils',
    code: 'ILS',
    title: 'Instructional Learning Structure',
    category: 'Pedagogy & Structure',
    icon: BookOpen,
    items: [
      'Learning objective alignment with Bloom taxonomy',
      'Instructional sequence: Motivation → Concept → Application',
      'Standardized content schema with typed payload',
      'Runtime data requirements & reactive learner state handling',
    ],
  },
  {
    id: 'lsnb',
    code: 'LSNB',
    title: 'Learning Structure & Navigation',
    category: 'Architecture & Schema',
    icon: Layout,
    items: [
      'Block data structure compliance (standard metadata schema)',
      'Navigation compatibility across linear & branching flows',
      'Versioning & identification schema (e.g., I7 unique UID)',
      'Step index, completion tracking, and telemetry anchors',
    ],
  },
  {
    id: 'rssb',
    code: 'RSSB',
    title: 'Rendering Structure & Style',
    category: 'UI/UX & Responsiveness',
    icon: Palette,
    items: [
      'Pure component pattern with zero hardcoded CSS globals',
      'Fluid responsiveness (mobile, tablet, desktop breakpoints)',
      'Design token binding: fonts, radiuses, shadows, spacings',
      'Accessible contrast ratios (WCAG 2.1 AA certified)',
    ],
  },
  {
    id: 'composer',
    code: 'COMPOSER',
    title: 'Tutorial Composer Integration',
    category: 'Authoring & Registry',
    icon: Workflow,
    items: [
      'Automatic block registry registration (type discriminator)',
      'Live drag-and-drop composer preview support',
      'Constructable in TutorialDocument schema',
      'WYSIWYG property inspector schema & validation rules',
    ],
  },
  {
    id: 'runtime',
    code: 'RUNTIME',
    title: 'Runtime Compatibility',
    category: 'Runtime Contract',
    icon: Cpu,
    items: [
      'Runtime contract adherence (props, emits, lifecycle hooks)',
      'Graceful error boundaries with fallback card rendering',
      'Zero hydration mismatches (Next.js SSR & CSR safety)',
      'Sub-50ms render latency budget',
    ],
  },
  {
    id: 'testing',
    code: 'TESTING',
    title: 'Testing Requirements',
    category: 'Verification & QA',
    icon: TestTube,
    items: [
      'Unit tests (Vitest / Jest) covering 100% of branch logic',
      'Integration tests with Mock Tutorial Document',
      'Composer interaction simulation suite',
      'Automated Playwright browser visual regression tests',
    ],
  },
  {
    id: 'brand',
    code: 'BRAND',
    title: 'Brand Independence',
    category: 'Neutrality',
    icon: Sparkles,
    items: [
      'Zero SUIA-specific hardcoded branding or logos',
      'Independent white-label design token bindings',
      'Pluggable iconography and typography tokens',
      'Neutral asset resolution paths',
    ],
  },
  {
    id: 'theme',
    code: 'THEME',
    title: 'Theme Compatibility',
    category: 'Styling System',
    icon: Layers,
    items: [
      'CSS custom properties mapped to active theme tokens',
      'Native Light / Dark mode instantaneous switching',
      'No style bleed into parent DOM container',
      'Consistent elevation & border treatment',
    ],
  },
  {
    id: 'evidence',
    code: 'EVIDENCE',
    title: 'Evidence Requirements',
    category: 'Audit & Gate',
    icon: ShieldCheck,
    items: [
      'Test execution logs and coverage artifact bundle',
      'Runtime render snapshot evidence (HTML & DOM tree)',
      'Composer registration evidence report',
      'Cryptographic placement manifest signature',
    ],
  },
];

export default function ComplianceBriefPage() {
  const { state } = useProjectLlm();
  const [viewMode, setViewMode] = useState<'grid' | 'checklist'>('grid');
  const [copied, setCopied] = useState(false);

  const handleCopyBrief = () => {
    const briefText = `PROJECT LLM COMPLIANCE BRIEF
Block Family: ${state.familyName} (${state.familyId})
Target Version: ${state.targetVersion}
Purpose: ${state.purpose}
Based on Existing Versions: ${state.existingVersions.join(', ')}

==============================
ENGINEERING COMPLIANCE REQUIREMENTS:
==============================
${requirements
  .map(
    (req, idx) => `
${idx + 1}. [${req.code}] ${req.title} (${req.category})
${req.items.map((item) => `   - [x] ${item}`).join('\n')}
`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card with Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm border-t border-white/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <FileText size={12} />
                Step 3 of 6
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Autonomous Engineering Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              Compliance Brief & Specifications
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Review mandatory engineering requirements generated for{' '}
              <span className="font-bold text-slate-800">{state.familyName} {state.targetVersion}</span>. External AI models must strictly adhere to these 9 structural contracts.
            </p>
          </div>

          <ProjectLlmStepper currentStep={3} />
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner />

      {/* Main Compliance Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-[#e11d48]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-outfit">
                  Engineering Compliance Requirements
                </h2>
                <p className="text-xs text-slate-500">
                  9 specification domains • All required for candidate certification
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'checklist' : 'grid')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              {viewMode === 'grid' ? (
                <>
                  <ListChecks size={15} className="text-slate-500" />
                  View as Checklist
                </>
              ) : (
                <>
                  <Grid size={15} className="text-slate-500" />
                  View as Grid Cards
                </>
              )}
            </button>

            <button
              onClick={handleCopyBrief}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-xl transition-all shadow-sm shadow-pink-500/20 active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={15} />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copy Full Brief
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content View: Grid or Checklist */}
        <div className="p-5 sm:p-6 bg-slate-50/30">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {requirements.map((req) => {
                const Icon = req.icon;
                return (
                  <div
                    key={req.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group"
                  >
                    <div>
                      {/* Card Top: Code Pill & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-pink-50 text-pink-700 border border-pink-200/80">
                          {req.code}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Required
                        </span>
                      </div>

                      {/* Title & Category */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-pink-50 text-slate-600 group-hover:text-pink-600 transition-colors shrink-0 mt-0.5">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-pink-600 transition-colors leading-tight font-outfit">
                            {req.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {req.category}
                          </p>
                        </div>
                      </div>

                      {/* Items Checklist */}
                      <div className="space-y-2 border-t border-slate-100 pt-3.5">
                        {req.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium leading-relaxed">
                            <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={10} strokeWidth={3} />
                            </div>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Status bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">v1.0 Standard</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Enforced by Gate
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Checklist Linear View */
            <div className="space-y-4">
              {requirements.map((req, idx) => {
                const Icon = req.icon;
                return (
                  <div
                    key={req.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-lg bg-pink-100 text-pink-700 font-mono font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 font-outfit flex items-center gap-2">
                            {req.title}
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {req.code}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400">{req.category}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 w-fit">
                        Mandatory Contract
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 sm:pl-10">
                      {req.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs text-slate-700"
                        >
                          <div className="h-4 w-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={11} strokeWidth={3} />
                          </div>
                          <span className="font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Next Step Callout Box */}
      <div className="rounded-2xl border border-pink-200/80 bg-gradient-to-r from-pink-50/80 via-rose-50/40 to-amber-50/60 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48] text-white shadow-md shadow-pink-500/20 shrink-0 mt-0.5">
            <Lightbulb size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 font-outfit">
              Next Step: Handoff to External AI
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Review these requirements carefully. When you proceed, this compliance brief will be packaged as instructions for the External AI to implement{' '}
              <span className="font-bold text-slate-900">{state.familyName} {state.targetVersion}</span>. The implementation proceeds in two distinct phases: Design Phase (HTML/CSS/JS prototype) and Implementation Phase (React/TypeScript package).
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/tools/project-llm/create"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Create Block
        </Link>

        <Link
          href="/tools/project-llm/external-ai-handoff"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95"
        >
          Proceed to External AI Handoff
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
