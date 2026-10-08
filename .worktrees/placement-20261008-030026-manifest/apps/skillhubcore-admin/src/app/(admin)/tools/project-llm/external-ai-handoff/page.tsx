'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Upload,
  FileCode,
  Sparkles,
  Layers,
  ShieldCheck,
  Eye,
  Terminal,
  ExternalLink,
  BookOpen,
  Layout,
  Palette,
  Workflow,
  TestTube,
  FileCheck,
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';

type TabKey = 'summary' | 'ils' | 'lsnb' | 'rssb' | 'composer' | 'testing' | 'brand' | 'evidence';

export default function ExternalAiHandoffPage() {
  const { state } = useProjectLlm();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [previewTab, setPreviewTab] = useState<'preview' | 'html' | 'schema'>('preview');

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'summary', label: 'Summary', icon: Sparkles },
    { key: 'ils', label: 'ILS', icon: BookOpen },
    { key: 'lsnb', label: 'LSNB', icon: Layout },
    { key: 'rssb', label: 'RSSB', icon: Palette },
    { key: 'composer', label: 'Composer', icon: Workflow },
    { key: 'testing', label: 'Testing', icon: TestTube },
    { key: 'brand', label: 'Brand & Theme', icon: Layers },
    { key: 'evidence', label: 'Evidence', icon: ShieldCheck },
  ];

  const handleCopyPrompt = () => {
    const prompt = `You are an expert Frontend & Educational Technology Engineer.
Your task is to implement Block Family: ${state.familyName} (${state.familyId}), Version: ${state.targetVersion}.

PURPOSE:
${state.purpose}

EXISTING VERSIONS IN FAMILY:
${state.existingVersions.join(', ')}

PHASE 1: DESIGN PROTOTYPE
1. Semantic HTML5 layout with clean markup
2. Responsive CSS design matching modern card aesthetic
3. Interactive vanilla JavaScript logic
4. Sample content JSON schema

PHASE 2: REACT / TYPESCRIPT IMPLEMENTATION
1. Component: ${state.familyName}${state.targetVersion}.tsx
2. Type Definitions: types.ts
3. JSON Schema: schema.json
4. Registry Entry: Block family registration UID
5. Composer Renderer: Composer preview & property controls
6. Unit Tests: __tests__/${state.familyName}${state.targetVersion}.test.tsx

Deliver the output as a structured package adhering to all repository standards.`;

    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyBrief = () => {
    const brief = `PROJECT LLM COMPLIANCE BRIEF FOR EXTERNAL AI
Block: ${state.familyName} ${state.targetVersion}
Target: ${state.purpose}
Existing Family: ${state.existingVersions.join(', ')}
All 9 Repository Compliance Gates must be satisfied before candidate integration.`;
    navigator.clipboard.writeText(brief);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = `# External AI Handoff Brief: ${state.familyName} ${state.targetVersion}

## 1. Specifications
- **Family**: ${state.familyName} (${state.familyId})
- **Version**: ${state.targetVersion}
- **Purpose**: ${state.purpose}
- **Baseline Versions**: ${state.existingVersions.join(', ')}

## 2. Requirements
1. Instructional Learning Structure (ILS)
2. Learning Structure & Navigation (LSNB)
3. Rendering Structure & Style (RSSB)
4. Tutorial Composer Integration
5. Runtime Compatibility
6. Test Verification Suite
7. Brand Independence
8. Theme Compatibility
9. Evidence Graph Artifacts

Generated autonomously by Project LLM Control Plane.`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_brief_${state.familyName.toLowerCase()}_${state.targetVersion.toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card with Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm border-t border-white/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <Code size={12} />
                Step 4 of 6
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Autonomous Engineering Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              External AI Implementation Handoff
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Export instructions and specifications for External AI models to implement{' '}
              <span className="font-bold text-slate-800">{state.familyName} {state.targetVersion}</span>. Supports both Design Phase prototypes and final TypeScript component packages.
            </p>
          </div>

          <ProjectLlmStepper currentStep={4} />
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Compliance Brief for External AI (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-[#e11d48]">
                  <FileCode size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-outfit">
                    Compliance Brief for External AI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive specification package ready for prompt generation
                  </p>
                </div>
              </div>
            </div>

            {/* Specification Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 border-b border-slate-200/70 bg-slate-100/50 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      isSelected
                        ? 'bg-white text-pink-700 shadow-sm border border-pink-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon size={13} className={isSelected ? 'text-pink-600' : 'text-slate-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-5 sm:p-6 min-h-[380px] bg-slate-50/20">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-pink-200/80 bg-pink-50/50 p-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-700 block mb-1">
                      Target Block Assignment
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-outfit">
                      {state.familyName} Block — Version {state.targetVersion}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {state.purpose}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                      Required Compliance Deliverables (8 Standards)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { title: 'ILS Pedagogy Sequence', desc: 'Hook → Motivation → Roadmap' },
                        { title: 'LSNB Schema Contract', desc: 'Metadata, unique UID & step anchor' },
                        { title: 'RSSB Responsive UI', desc: 'Clean tokens, 0 style bleed' },
                        { title: 'Tutorial Composer Registry', desc: 'Live preview & inspector controls' },
                        { title: 'Runtime Robustness', desc: 'Error boundaries & SSR safety' },
                        { title: 'Test Coverage Suite', desc: 'Unit, integration & visual tests' },
                        { title: 'Brand Independence', desc: '100% white-label token design' },
                        { title: 'Evidence Graph Manifest', desc: 'Verification hash & audit logs' },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs"
                        >
                          <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.title}</p>
                            <p className="text-[11px] text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ils' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Instructional Learning Structure (ILS) Specifics
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-2 font-mono">
                    <p className="text-slate-900 font-bold">1. Learning Objective Mapping</p>
                    <p className="text-slate-600 pl-4">Must state cognitive domain, Bloom level, and verifiable outcome.</p>
                    <p className="text-slate-900 font-bold">2. Sequential Content Flow</p>
                    <p className="text-slate-600 pl-4">Lead with compelling hook, connect real-world impact, outline 3-5 subtopic milestones.</p>
                    <p className="text-slate-900 font-bold">3. Learner Engagement Interactivity</p>
                    <p className="text-slate-600 pl-4">Interactive checklist / collapsible roadmap nodes for progressive disclosure.</p>
                  </div>
                </div>
              )}

              {activeTab !== 'summary' && activeTab !== 'ils' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {tabs.find((t) => t.key === activeTab)?.label} Specification Contract
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-mono space-y-2 leading-relaxed">
                    <p className="text-emerald-700 font-bold">// Automated Enforcement Rule</p>
                    <p>Enforced by Project AI placement engine during candidate inspection.</p>
                    <p>Refer to system compliance guidelines for mandatory schema definition.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-xl transition-all shadow-sm shadow-pink-500/20 active:scale-95"
              >
                {copiedPrompt ? (
                  <>
                    <Check size={14} />
                    Copied Prompt!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Prompt for External AI
                  </>
                )}
              </button>

              <button
                onClick={handleCopyBrief}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                {copiedBrief ? (
                  <>
                    <Check size={14} />
                    Copied Brief!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Full Compliance Brief
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Download size={14} />
                Download as Markdown
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Design & Implementation Phases (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Phase 1: Design Phase */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-mono font-bold text-xs">
                  P1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-outfit">
                    Design Phase (HTML / CSS / JS / JSON)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Rapid prototyping & visual approval cycle
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Phase 1
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Checklist */}
              <div className="space-y-2">
                {[
                  '1. Create independent HTML structure with semantic tags',
                  '2. Implement responsive CSS using standard styling tokens',
                  '3. Add interactive vanilla JS for learner engagement',
                  '4. Produce sample JSON data schema representing block state',
                  '5. Submit prototype files for interactive review',
                  '6. Human reviewer verifies and approves prototype design',
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="font-medium">{step}</span>
                  </div>
                ))}
              </div>

              {/* Prototype Preview Mockup Box */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-slate-200">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="font-mono text-slate-400 ml-2">prototype_preview.html</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewTab('preview')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        previewTab === 'preview' ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setPreviewTab('schema')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        previewTab === 'schema' ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      Schema
                    </button>
                  </div>
                </div>

                <div className="p-4 text-xs font-mono bg-slate-950/60 max-h-36 overflow-y-auto">
                  {previewTab === 'preview' ? (
                    <div className="space-y-2 text-slate-300">
                      <div className="border border-pink-500/30 bg-pink-950/20 p-2.5 rounded text-[11px]">
                        <span className="text-pink-400 font-bold block mb-1">
                          [Introduction {state.targetVersion} Mockup Container]
                        </span>
                        <p className="text-slate-300 text-[10px]">
                          Topic: Mastering Advanced Educational Workflows
                        </p>
                        <div className="mt-2 flex gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-pink-900/60 text-pink-200 text-[9px]">
                            3 Milestones
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-[9px]">
                            100% WCAG
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-emerald-400 text-[11px] leading-relaxed">
                      {`{\n  "version": "${state.targetVersion}",\n  "type": "introduction",\n  "headline": "Course Overview",\n  "milestones": 3\n}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Prototype Dropzone (Optional) */}
              <div className="border-2 border-dashed border-slate-200 hover:border-pink-300 rounded-xl p-4 text-center bg-slate-50/60 transition-colors cursor-pointer group">
                <Upload size={22} className="mx-auto text-slate-400 group-hover:text-pink-600 mb-1.5 transition-colors" />
                <p className="text-xs font-bold text-slate-700">
                  Upload Prototype Files (Optional)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Drag & drop .zip or .html files from External AI
                </p>
              </div>
            </div>
          </div>

          {/* Phase 2: Implementation Phase */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-purple-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800 font-mono font-bold text-xs">
                  P2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-outfit">
                    Implementation Phase (React / TypeScript)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Production code delivery according to placement manifest
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Phase 2
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Expected Deliverable Package
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { file: `${state.familyName}${state.targetVersion}.tsx`, desc: 'Component' },
                  { file: 'types.ts', desc: 'Type definitions' },
                  { file: 'schema.json', desc: 'JSON schema' },
                  { file: 'registry.ts', desc: 'Block registry' },
                  { file: 'renderer.tsx', desc: 'Runtime render' },
                  { file: 'composer.tsx', desc: 'Composer UI' },
                  { file: '*.test.tsx', desc: 'Test suite' },
                  { file: 'README.md', desc: 'Documentation' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <span className="font-mono text-slate-800 font-bold truncate text-[11px]">
                      {item.file}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Step Callout */}
      <div className="rounded-2xl border border-pink-200/80 bg-gradient-to-r from-pink-50/80 via-rose-50/40 to-amber-50/60 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48] text-white shadow-md shadow-pink-500/20 shrink-0 mt-0.5">
            <Lightbulb size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 font-outfit">
              Next Step: Candidate Upload & Validation
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              After the External AI finishes implementing the component package for{' '}
              <span className="font-bold text-slate-900">{state.familyName} {state.targetVersion}</span>, proceed to Candidate Upload & Validation where all 11 autonomous quality gates will verify compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/tools/project-llm/compliance-brief"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Compliance Brief
        </Link>

        <Link
          href="/tools/project-llm/candidate-upload"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95"
        >
          Continue to Upload & Validate
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
