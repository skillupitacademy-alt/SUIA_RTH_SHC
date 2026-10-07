'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Check,
  GitBranch,
  Layers,
  FileCode,
  FileCheck,
  TestTube,
  Cpu,
  Workflow,
  Sparkles,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Download,
  Terminal,
  Activity,
  Globe,
  CheckCheck,
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';

type CertTab = 'repo' | 'tests' | 'composer' | 'runtime' | 'cert';

export default function IntegrationCertificationPage() {
  const { state } = useProjectLlm();
  const [activeTab, setActiveTab] = useState<CertTab>('repo');

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card with Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm border-t border-white/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <ShieldCheck size={12} />
                Step 6 of 6
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Autonomous Engineering Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              Integration & Repository Certification
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Verify placement manifests, inspect test suites, execute live runtime verification, and certify{' '}
              <span className="font-bold text-slate-800">{state.familyName} {state.targetVersion}</span> for downstream authoring in the Tutorial Composer.
            </p>
          </div>

          <ProjectLlmStepper currentStep={6} />
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner />

      {/* Main Container with 5 Tabs */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 border-b border-slate-200/80 bg-slate-50/70 overflow-x-auto no-scrollbar">
          {[
            { id: 'repo', label: 'Repository Integration', icon: GitBranch },
            { id: 'tests', label: 'Test Suite', icon: TestTube },
            { id: 'composer', label: 'Tutorial Composer', icon: Workflow },
            { id: 'runtime', label: 'Runtime Verification', icon: Cpu },
            { id: 'cert', label: 'Final Certification', icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as CertTab)}
                className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all shrink-0 -mb-[2px] ${
                  isSelected
                    ? 'border-[#e11d48] text-[#e11d48] bg-white rounded-t-xl shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-xl'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="p-5 sm:p-6 bg-slate-50/20">
          {/* TAB A: REPOSITORY INTEGRATION */}
          {activeTab === 'repo' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Autonomous Placement Manifest
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated by Project AI Placement Engine based on candidate files
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600">
                    Branch: project-ai-gui
                  </span>
                </div>
              </div>

              {/* Placement Cards: ADD, UPDATE, EXTEND, REUSE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ADD */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ADD (4 files)
                    </span>
                    <span className="text-[11px] text-slate-400">New candidate components</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    {[
                      `apps/skillhubcore/src/components/blocks/${state.familyName.toLowerCase()}/${state.familyName}${state.targetVersion}.tsx`,
                      `apps/skillhubcore/src/components/blocks/${state.familyName.toLowerCase()}/types/${state.targetVersion.toLowerCase()}.ts`,
                      `apps/skillhubcore/src/components/blocks/${state.familyName.toLowerCase()}/__tests__/${state.familyName}${state.targetVersion}.test.tsx`,
                      `apps/skillhubcore/src/schemas/blocks/${state.familyName.toLowerCase()}-${state.targetVersion.toLowerCase()}.schema.json`,
                    ].map((f, i) => (
                      <div key={i} className="p-2 rounded bg-emerald-50/50 text-emerald-900 border border-emerald-100/80 truncate">
                        + {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* UPDATE */}
                <div className="p-4 rounded-xl border border-blue-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                      UPDATE (2 files)
                    </span>
                    <span className="text-[11px] text-slate-400">Barrel exports & registry</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    {[
                      `apps/skillhubcore/src/components/blocks/${state.familyName.toLowerCase()}/index.ts (export ${state.targetVersion})`,
                      `apps/skillhubcore/src/registry/blockRegistry.ts (register ${state.targetVersion} entry)`,
                    ].map((f, i) => (
                      <div key={i} className="p-2 rounded bg-blue-50/50 text-blue-900 border border-blue-100/80 truncate">
                        ~ {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* EXTEND */}
                <div className="p-4 rounded-xl border border-purple-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                      EXTEND (1 file)
                    </span>
                    <span className="text-[11px] text-slate-400">Document types union</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded bg-purple-50/50 text-purple-900 border border-purple-100/80 truncate">
                      ~ packages/shared/types/tutorialDocument.ts (add &apos;{state.targetVersion}&apos; to BlockVersionType)
                    </div>
                  </div>
                </div>

                {/* REUSE */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                      REUSE (8 shared components)
                    </span>
                    <span className="text-[11px] text-slate-400">Design system primitives</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600">
                    {['Button', 'Card', 'Badge', 'Tooltip', 'Avatar', 'Icon', 'Progress', 'Accordion'].map((c, i) => (
                      <div key={i} className="p-1.5 rounded bg-slate-50 border border-slate-200/80 text-center">
                        @quiz/ui/{c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Snapshot Comparison Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Repository Snapshot Transition
                  </h4>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Clean Git Tree
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">PRE-INTEGRATION SNAPSHOT</span>
                    <span className="font-bold text-slate-800">commit: 8f4a21e4</span>
                    <p className="text-[11px] text-slate-500 mt-1">Clean working directory, 0 unstaged files</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    <span className="text-emerald-700 block text-[10px]">POST-INTEGRATION CANDIDATE</span>
                    <span className="font-bold text-emerald-900">commit: c9b1037f (certified)</span>
                    <p className="text-[11px] text-emerald-700 mt-1">+4 files, +342 lines, zero regressions</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB B: TEST SUITE */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Test Verification Suite
                  </h3>
                  <p className="text-xs text-slate-500">
                    35 of 35 tests passed across unit, integration, composer, runtime, and Playwright browser suites
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  100% Pass Rate
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Unit Tests (Vitest)', count: '14 / 14 Passed', time: '180ms', desc: 'Component render, props mutation, events' },
                  { title: 'Integration Tests', count: '6 / 6 Passed', time: '210ms', desc: 'Mock TutorialDocument schema binding' },
                  { title: 'Composer Interaction Tests', count: '4 / 4 Passed', time: '140ms', desc: 'Drag-and-drop, inspector property edits' },
                  { title: 'Runtime SSR Tests', count: '8 / 8 Passed', time: '95ms', desc: 'Hydration checks, sub-50ms render budget' },
                  { title: 'Playwright Browser Tests', count: '3 / 3 Passed', time: '520ms', desc: 'Chromium, Firefox, WebKit visual regression' },
                ].map((s, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900 font-outfit">{s.title}</h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        PASS
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-slate-800 font-mono">{s.count}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{s.desc}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-2">Execution time: {s.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB C: TUTORIAL COMPOSER VERIFICATION */}
          {activeTab === 'composer' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Tutorial Composer Registry Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirmed registration in Tutorial Composer block registry with live interactive preview
                  </p>
                </div>
                <Link
                  href="/tools/block-composer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-sm"
                >
                  <Workflow size={13} />
                  Open Composer
                </Link>
              </div>

              {/* Verification Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Registry Registration', val: 'Registered & Indexed', status: 'pass' },
                  { label: 'Renderer Integration', val: 'Linked to Runtime', status: 'pass' },
                  { label: 'Palette Availability', val: 'Selectable in UI', status: 'pass' },
                  { label: 'TutorialDocument', val: 'JSON Schema Compliant', status: 'pass' },
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono block mb-1">
                      {item.label}
                    </span>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      {item.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Interactive Mini Composer Sandbox Preview */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-900 text-white shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-pink-500" />
                    <span className="text-xs font-mono font-bold text-slate-300">
                      Tutorial Composer Live Canvas Simulator
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-pink-400">
                    Type: &apos;{state.familyName.toLowerCase()}&apos; • Version: &apos;{state.targetVersion}&apos;
                  </span>
                </div>

                <div className="mt-4 p-5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-400 font-mono">
                      [Block Canvas] {state.familyName} {state.targetVersion}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">● Live Preview Active</span>
                  </div>
                  <h4 className="text-lg font-bold text-white font-outfit">
                    Mastering Advanced Educational Workflows
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    {state.purpose}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-pink-900/60 text-pink-200 border border-pink-700/60">
                      Step 1: Motivation
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Step 2: Core Concept
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Step 3: Applied Exercise
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB D: RUNTIME VERIFICATION */}
          {activeTab === 'runtime' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Runtime Verification in Live Container
                  </h3>
                  <p className="text-xs text-slate-500">
                    App health, container routes, and performance benchmarks
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Container Healthy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">CONTAINER PORT</span>
                  <p className="text-base font-mono font-bold text-slate-800">:3007 (skillhubcore)</p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">HTTP 200 OK • Healthy</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">TIME TO FIRST BYTE (TTFB)</span>
                  <p className="text-base font-mono font-bold text-emerald-600">24ms</p>
                  <p className="text-[11px] text-slate-500 mt-1">Well within 50ms latency budget</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">HYDRATION STATUS</span>
                  <p className="text-base font-mono font-bold text-emerald-600">0 Mismatches</p>
                  <p className="text-[11px] text-slate-500 mt-1">Clean DOM render on SSR & CSR</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-200 font-mono text-xs">
                <div className="text-slate-400 text-[11px] mb-2">// Runtime Container Verification Log</div>
                <div className="text-emerald-400">[2026-10-07 09:28:12] GET /tutorial-runtime/test-block/{state.targetVersion} 200 OK - 24ms</div>
                <div className="text-emerald-400">[2026-10-07 09:28:12] Rendering component &lt;{state.familyName}{state.targetVersion} /&gt; ... SUCCESS</div>
                <div className="text-emerald-400">[2026-10-07 09:28:13] Playwright visual comparison snapshot matched baseline (0% diff)</div>
                <div className="text-slate-400">[2026-10-07 09:28:13] Evidence graph node created: ev_rt_{state.targetVersion.toLowerCase()}_pass</div>
              </div>
            </div>
          )}

          {/* TAB E: FINAL CERTIFICATION */}
          {activeTab === 'cert' && (
            <div className="space-y-6">
              {/* Grand Banner */}
              <div className="p-6 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center shrink-0">
                      <ShieldCheck size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wider font-mono">
                        Cryptographically Sealed
                      </span>
                      <h2 className="text-2xl font-black font-outfit mt-1">
                        Candidate Certified & Integrated
                      </h2>
                      <p className="text-emerald-100 text-xs mt-1 max-w-xl font-medium">
                        {state.familyName} {state.targetVersion} has completed all 6 phases of the Autonomous Engineering Protocol and is permanently integrated into the core repository.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <Link
                      href="/tools/block-composer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-all shadow-md active:scale-95"
                    >
                      <Workflow size={16} />
                      Open in Tutorial Composer
                    </Link>

                    <Link
                      href="/tools/project-llm/workflow-details"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold text-xs border border-white/20 transition-all"
                    >
                      View Evidence Graph
                    </Link>
                  </div>
                </div>
              </div>

              {/* Certification Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    CERTIFICATE ID
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    CERT-LLM-{state.targetVersion}-20261007
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    PLACEMENT MANIFEST
                  </span>
                  <p className="text-sm font-mono font-bold text-emerald-600">
                    4 ADD, 2 UPDATE, 1 EXTEND
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    EVIDENCE GRAPH HASH
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 truncate">
                    sha256:7c9e12...b94a
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    AUTHORING STATUS
                  </span>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Active in Composer
                  </p>
                </div>
              </div>
            </div>
          )}
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
              Workflow Complete: Downstream Authoring Ready
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              <span className="font-bold text-slate-900">{state.familyName} {state.targetVersion}</span> is certified! You can now compose tutorials using this new block family version directly inside the{' '}
              <Link href="/tools/block-composer" className="text-pink-600 font-bold underline hover:text-pink-700">
                Tutorial Composer
              </Link>
              , or review the complete immutable audit trail in{' '}
              <Link href="/tools/project-llm/workflow-details" className="text-pink-600 font-bold underline hover:text-pink-700">
                Workflow & Evidence Details
              </Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/tools/project-llm/candidate-upload"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Candidate Upload
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/tools/project-llm/workflow-details"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            Inspect Evidence Graph
          </Link>

          <Link
            href="/tools/block-composer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95"
          >
            Launch Tutorial Composer
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
