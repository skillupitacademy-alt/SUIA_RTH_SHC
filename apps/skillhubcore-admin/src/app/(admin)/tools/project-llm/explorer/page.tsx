'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Layers,
  FileText,
  BadgeCheck,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Sliders,
  Code,
  Layout,
  Accessibility,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { BLOCK_CORPUS_REGISTRY } from '@/lib/project-llm';
import type { BlockFamilyReference } from '@quiz/types';

interface VersionDetail {
  id: string;
  name: string;
  pattern: string;
  contract: string;
  components: string[];
  accessibility: string;
  responsive: string;
  renderer: string;
  runtimeStatus: 'VERIFIED' | 'CANDIDATE_PILOT' | 'DOCUMENTED';
}

const INTRODUCTION_VERSIONS: Record<string, VersionDetail> = {
  I1: {
    id: 'I1',
    name: 'Simple Topic Introduction',
    pattern: '9-section canonical layout introducing domain, context, and immediate motivation.',
    contract: 'packages/types/src/tutorial-rich-document/registries/introduction-versions.ts',
    components: ['Topic Orientation', 'Domain Badge', 'Core Summary', 'Quick Takeaways'],
    accessibility: 'ARIA heading level 2, compliant landmark roles, 4.5:1 contrast ratio, keyboard focusable.',
    responsive: 'Single-column on mobile (<640px), balanced 2-column hero on tablet/desktop.',
    renderer: 'TutorialBlockRenderer (packages/ui/src/tutorial/blocks/IntroductionBlock.tsx)',
    runtimeStatus: 'VERIFIED',
  },
  I2: {
    id: 'I2',
    name: 'Problem → Need → Topic',
    pattern: 'Framing problem statement first, proving necessity, transitioning to lesson topic.',
    contract: 'IntroductionI2BlockSchema (Node.js + TS + React with UBRC compliance)',
    components: ['Problem Statement', 'Need Assessment', 'Topic Reveal', 'Key Objectives Preview'],
    accessibility: 'Semantic problem alert roles, high contrast accent badges, skip-link support.',
    responsive: 'Stacked flow on mobile, split-card layout on desktop (>1024px).',
    renderer: 'Candidate pilot to extend IntroductionBlock without creating duplicate artifacts.',
    runtimeStatus: 'CANDIDATE_PILOT',
  },
  I3: {
    id: 'I3',
    name: 'What → Why → Where',
    pattern: 'Conceptual breakdown: defining the what, explaining the why, mapping where it is used.',
    contract: 'IntroductionI3Schema (Documented in 18-block corpus specification)',
    components: ['What Definition', 'Why Rationale', 'Where Industry Usage', 'Prerequisite Links'],
    accessibility: '3-card sequential tab index with descriptive ARIA live region updates.',
    responsive: 'Horizontal grid on desktop (3-col), vertical card stack on mobile.',
    renderer: 'Documented specification ready for phase-2 derivation.',
    runtimeStatus: 'DOCUMENTED',
  },
  I4: {
    id: 'I4',
    name: 'Topic → Context → Roadmap',
    pattern: 'High-level roadmap orientation connecting previous tutorials to the current lesson.',
    contract: 'IntroductionI4Schema (Documented specification)',
    components: ['Topic Anchor', 'Ecosystem Context', 'Lesson Roadmap Steps', 'Milestone Indicators'],
    accessibility: 'Ordered list semantics, step completion status announcements for screen readers.',
    responsive: 'Vertical timeline on mobile, horizontal step progression on desktop.',
    renderer: 'Documented specification.',
    runtimeStatus: 'DOCUMENTED',
  },
  I5: {
    id: 'I5',
    name: 'Real-World Introduction',
    pattern: 'Case-study led orientation presenting a real industry engineering scenario first.',
    contract: 'IntroductionI5Schema (Documented specification)',
    components: ['Industry Scenario', 'Production Challenge', 'Learning Bridge', 'Takeaway Goals'],
    accessibility: 'Blockquote formatting for case study, semantic citation tags.',
    responsive: 'Full-bleed banner hero on mobile, framed quote card on desktop.',
    renderer: 'Documented specification.',
    runtimeStatus: 'DOCUMENTED',
  },
  I6: {
    id: 'I6',
    name: 'Complete Lesson Introduction',
    pattern: 'Comprehensive introduction featuring prerequisites, instructor notes, and interactive roadmap.',
    contract: 'IntroductionI6Schema (Documented specification)',
    components: ['Overview Hero', 'Prerequisites Pill List', 'Estimated Time', 'Interactive Roadmap'],
    accessibility: 'Full landmark navigation, section headings h2 through h4.',
    responsive: 'Multi-pane responsive grid adapting from 1 to 3 columns.',
    renderer: 'Documented specification.',
    runtimeStatus: 'DOCUMENTED',
  },
};

export default function FamilyVersionExplorerPage() {
  const searchParams = useSearchParams();
  const initialFamily = searchParams?.get('family') || 'I';

  const [selectedFamilyId, setSelectedFamilyId] = useState(initialFamily);
  const [selectedVersionId, setSelectedVersionId] = useState('I2');

  const families: BlockFamilyReference[] = BLOCK_CORPUS_REGISTRY.families;
  const currentFamily = families.find((f) => f.familyId === selectedFamilyId) || families[0];

  const versionDetail = INTRODUCTION_VERSIONS[selectedVersionId] || {
    id: selectedVersionId,
    name: `${currentFamily.familyName} ${selectedVersionId}`,
    pattern: `Standard architectural pattern for ${currentFamily.familyName} version ${selectedVersionId}.`,
    contract: `Specification contract for ${selectedVersionId}`,
    components: ['Primary Component', 'Secondary Pattern', 'Context Element'],
    accessibility: 'Standard WCAG AA accessibility attributes.',
    responsive: 'Adaptive single and multi-column grid layout.',
    renderer: `Canonical ${currentFamily.familyName} Block renderer`,
    runtimeStatus: 'DOCUMENTED',
  };

  return (
    <div className="space-y-6">
      {/* Surface Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 -translate-y-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e11d48] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">
                SURFACE 03
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="text-xs font-mono font-semibold text-slate-500">HIERARCHY EXPLORER</span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-900 font-outfit">
              Family → Version Explorer
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Inspect specific block versions within their canonical family hierarchy. Enforces intra-family relationships and engineering contracts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/tools/project-llm/mix-match?family=${selectedFamilyId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Sparkles size={14} />
              <span>Mix & Match This Family</span>
            </Link>
          </div>
        </div>

        {/* Family Selector Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2 font-mono">
            Family:
          </span>
          {families.slice(0, 8).map((f) => (
            <button
              key={f.familyId}
              onClick={() => {
                setSelectedFamilyId(f.familyId);
                setSelectedVersionId(f.documentedVersions[0] || `${f.familyId}1`);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedFamilyId === f.familyId
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {f.familyName} ({f.familyId})
            </button>
          ))}
        </div>
      </div>

      {/* Explorer 2-Column Split: Versions List on Left, Version Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Versions List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-slate-800 font-outfit">
              {currentFamily.familyName} Versions ({currentFamily.documentedVersions.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Select version to inspect</span>
          </div>

          <div className="space-y-2">
            {currentFamily.documentedVersions.map((v) => {
              const isSelected = selectedVersionId === v;
              const detail = INTRODUCTION_VERSIONS[v];
              return (
                <div
                  key={v}
                  onClick={() => setSelectedVersionId(v)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-pink-500/80 bg-white shadow-lg ring-2 ring-pink-500/15 -translate-y-0.5'
                      : 'border-slate-200/80 bg-white/80 hover:bg-white hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {v}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                        v === 'I1' || v === 'C1' || v === 'D1'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : v === 'I2'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {v === 'I1' || v === 'C1' || v === 'D1'
                        ? 'VERIFIED'
                        : v === 'I2'
                        ? 'PHASE 1 PILOT'
                        : 'DOCUMENTED'}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 font-outfit leading-tight">
                    {detail ? detail.name : `${currentFamily.familyName} ${v}`}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {detail ? detail.pattern : `Canonical specification for ${v}.`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Version Deep-Dive Inspector */}
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60">
            {/* Inspector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-white bg-gradient-to-r from-pink-500 to-orange-500 px-2 py-0.5 rounded shadow-sm">
                    {versionDetail.id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">•</span>
                  <span className="text-xs font-mono font-bold text-slate-600">{currentFamily.familyName} Family</span>
                </div>
                <h2 className="mt-1.5 text-xl font-bold text-slate-900 font-outfit">
                  {versionDetail.name}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/tools/project-llm/qualify?version=${versionDetail.id}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Qualify Version
                </Link>
                <Link
                  href={`/tools/project-llm/mix-match?family=${selectedFamilyId}&seed=${versionDetail.id}`}
                  className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 transition-all shadow-sm"
                >
                  Use in Mix & Match
                </Link>
              </div>
            </div>

            {/* Inspector Grid Sections */}
            <div className="mt-6 space-y-6">
              {/* 1. Educational Pattern */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <Layout size={14} className="text-indigo-600" />
                  <span>Educational Pattern</span>
                </div>
                <p className="mt-1.5 text-sm text-slate-700 font-medium leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  {versionDetail.pattern}
                </p>
              </div>

              {/* 2. Engineering Contract */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <Code size={14} className="text-purple-600" />
                  <span>Engineering Contract & Sourcing</span>
                </div>
                <div className="mt-1.5 rounded-xl bg-slate-900 p-3.5 font-mono text-xs text-slate-200 shadow-inner overflow-x-auto">
                  <code>{versionDetail.contract}</code>
                </div>
              </div>

              {/* 3. Components / Patterns */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <Layers size={14} className="text-pink-600" />
                  <span>Constituent Components & Patterns</span>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {versionDetail.components.map((comp) => (
                    <div
                      key={comp}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm text-center"
                    >
                      <CheckCircle2 size={14} className="mx-auto text-emerald-500 mb-1" />
                      <p className="text-xs font-bold text-slate-800 font-outfit">{comp}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Accessibility & Responsive Models */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    <Accessibility size={14} className="text-teal-600" />
                    <span>Accessibility Spec</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                    {versionDetail.accessibility}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    <Smartphone size={14} className="text-orange-600" />
                    <span>Responsive Layout</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                    {versionDetail.responsive}
                  </p>
                </div>
              </div>

              {/* 5. Renderer & Runtime Binding */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Renderer Binding & Canonical Rule</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-medium">
                    <BadgeCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>{versionDetail.renderer}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    NO DUPLICATE CANONICAL ARTIFACT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
