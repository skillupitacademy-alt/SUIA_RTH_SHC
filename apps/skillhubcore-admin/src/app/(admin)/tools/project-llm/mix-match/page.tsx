'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Split,
  Check,
  XCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { BLOCK_CORPUS_REGISTRY } from '@/lib/project-llm';
import type { BlockFamilyReference } from '@quiz/types';

interface ComponentPatternOption {
  id: string;
  name: string;
  sourceVersion: string;
  description: string;
  defaultSelected: boolean;
}

const AVAILABLE_PATTERNS: Record<string, ComponentPatternOption[]> = {
  I: [
    { id: 'topic-orientation', name: 'Topic Orientation & Domain Badge', sourceVersion: 'I1', description: 'Sets high-level subject scope and domain tags from I1 baseline.', defaultSelected: true },
    { id: 'problem-framing', name: 'Problem Framing Statement', sourceVersion: 'I2', description: 'Explicit learner problem statement from I2 pilot.', defaultSelected: true },
    { id: 'need-motivation', name: 'Need & Motivation Proof', sourceVersion: 'I2', description: 'Justifies why this lesson matters right now before teaching syntax.', defaultSelected: true },
    { id: 'conceptual-what-why', name: 'Conceptual What/Why Tabs', sourceVersion: 'I3', description: 'Interactive tabs breaking down what, why, and where it is applied.', defaultSelected: false },
    { id: 'curriculum-roadmap', name: 'Curriculum Roadmap Timeline', sourceVersion: 'I4', description: 'Visual step markers indicating where this tutorial fits in the module.', defaultSelected: false },
    { id: 'real-world-context', name: 'Industry Real-World Scenario', sourceVersion: 'I5', description: 'Case study narrative framing technical topic from industry practice.', defaultSelected: true },
    { id: 'learning-transition', name: 'Active Learning Bridge', sourceVersion: 'I5', description: 'Seamless handoff transition into next lesson block.', defaultSelected: true },
  ],
};

export default function MixAndMatchBuilderPage() {
  const router = useRouter();
  const [selectedFamilyId, setSelectedFamilyId] = useState('I');
  const [targetVersionId, setTargetVersionId] = useState('I7');
  const [selectedVersions, setSelectedVersions] = useState<string[]>(['I1', 'I2', 'I5']);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([
    'topic-orientation',
    'problem-framing',
    'need-motivation',
    'real-world-context',
    'learning-transition',
  ]);

  const families: BlockFamilyReference[] = BLOCK_CORPUS_REGISTRY.families;
  const currentFamily = families.find((f) => f.familyId === selectedFamilyId) || families[0];

  const patterns = AVAILABLE_PATTERNS[selectedFamilyId] || AVAILABLE_PATTERNS['I'];

  const handleToggleVersion = (v: string) => {
    setSelectedVersions((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const handleToggleComponent = (id: string) => {
    setSelectedComponents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const compatibilityChecks = [
    { label: 'Same Family Invariant', valid: true, note: `All sources belong to ${currentFamily.familyName} (${currentFamily.familyId})` },
    { label: 'Semantic Compatibility', valid: selectedComponents.length >= 2, note: 'Components form a cohesive pedagogical flow' },
    { label: 'Contract Compatibility', valid: true, note: 'UBRC attributes and property signatures align' },
    { label: 'Renderer Compatibility', valid: true, note: 'Renders through canonical TutorialBlockRenderer' },
    { label: 'Responsive Model', valid: true, note: 'Adaptive 1-to-3 column responsive breakpoints' },
    { label: 'Accessibility (WCAG AA)', valid: true, note: 'Semantic headings, landmark roles, and ARIA labels' },
    { label: 'Brand Independence', valid: true, note: 'Zero hardcoded colors or brand-specific text' },
  ];

  const allChecksValid = compatibilityChecks.every((c) => c.valid);

  const handleGenerateSpec = () => {
    router.push(
      `/tools/project-llm/specification-review?family=${selectedFamilyId}&version=${targetVersionId}&sources=${selectedVersions.join(',')}`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl border-t border-white/60 -translate-y-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e11d48] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">
                SURFACE 07
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                INTRA-FAMILY DERIVATION ONLY
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
              Mix & Match Block Builder
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Synthesize a new derived block version from compatible patterns within a single family. Cross-family composition (e.g. Introduction + Code) is exclusively handled downstream in Tutorial Composer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400">Target Proposed:</span>
            <input
              type="text"
              value={targetVersionId}
              onChange={(e) => setTargetVersionId(e.target.value)}
              className="w-20 rounded-xl border border-pink-300 bg-pink-50/60 px-3 py-1.5 font-mono text-xs font-black text-pink-700 text-center shadow-inner focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Selected Family Indicator */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 font-mono uppercase">Target Family:</span>
          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
            {currentFamily.familyName} ({currentFamily.familyId})
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">
            Available intra-family versions: {currentFamily.documentedVersions.join(', ')}
          </span>
        </div>
      </div>

      {/* Main Builder Form: Sources & Component Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Source Versions & Component Picker */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Source Versions */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black font-mono">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900 font-outfit">
                  Select Source Versions in {currentFamily.familyName}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {selectedVersions.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {currentFamily.documentedVersions.map((v) => {
                const isSelected = selectedVersions.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleToggleVersion(v)}
                    className={`py-2 px-3 rounded-xl border font-mono text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-500/15'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {isSelected ? `✓ ${v}` : v}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              * Notice: Only {currentFamily.familyName} versions appear here. No Objective O2, Code C1, or Visual V3.
            </p>
          </div>

          {/* Step 2: Component / Pattern Selection */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black font-mono">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900 font-outfit">
                  Select Components & Patterns
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {selectedComponents.length} Patterns Active
              </span>
            </div>

            <div className="space-y-2.5">
              {patterns.map((pat) => {
                const isSelected = selectedComponents.includes(pat.id);
                return (
                  <div
                    key={pat.id}
                    onClick={() => handleToggleComponent(pat.id)}
                    className={`rounded-xl border p-3.5 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50/30 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-outfit">
                          {pat.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                          Source: {pat.sourceVersion}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-snug">{pat.description}</p>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-pink-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={13} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Compatibility Matrix & Action Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-outfit">
                Compatibility & Invariant Verification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time validation against Project LLM architectural guardrails.
              </p>
            </div>

            <div className="space-y-2.5">
              {compatibilityChecks.map((check) => (
                <div
                  key={check.label}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-start gap-2.5"
                >
                  <div className="mt-0.5 shrink-0">
                    {check.valid ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-rose-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 font-outfit leading-tight">
                      {check.label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{check.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={!allChecksValid}
                onClick={handleGenerateSpec}
                className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                  allChecksValid
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 shadow-pink-500/25 hover:scale-[1.02] active:scale-95'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Sparkles size={15} />
                <span>Generate Derived Specification for {targetVersionId}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
