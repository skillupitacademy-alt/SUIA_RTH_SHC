'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Split,
  FileText,
  BadgeCheck,
  Sliders,
} from 'lucide-react';
import { BLOCK_CORPUS_REGISTRY } from '@/lib/project-llm';
import type { BlockFamilyReference } from '@quiz/types';

export default function CreateBlockOperationPage() {
  const router = useRouter();
  const [selectedFamilyId, setSelectedFamilyId] = useState('I');
  const [selectedOperation, setSelectedOperation] = useState<'new-version' | 'qualify' | 'mix-match'>('new-version');

  const families: BlockFamilyReference[] = BLOCK_CORPUS_REGISTRY.families;
  const currentFamily = families.find((f) => f.familyId === selectedFamilyId) || families[0];

  const handleContinue = () => {
    if (selectedOperation === 'new-version') {
      router.push(`/tools/project-llm/new-version?family=${selectedFamilyId}`);
    } else if (selectedOperation === 'qualify') {
      router.push(`/tools/project-llm/qualify?family=${selectedFamilyId}`);
    } else {
      router.push(`/tools/project-llm/mix-match?family=${selectedFamilyId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl border-t border-white/60 -translate-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e11d48] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">
            SURFACE 05
          </span>
          <span className="text-xs font-semibold text-slate-400">•</span>
          <span className="text-xs font-mono font-semibold text-slate-500">OPERATION GATEWAY</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
          Create Educational Block
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Select the canonical block family first. Architectural invariants require all derivations, mix & match combinations, and qualifications to remain strictly within a single family boundary.
        </p>
      </div>

      {/* Step 1: Block Family Selection */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black font-mono">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900 font-outfit">
              Select Canonical Block Family
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">18 Families Available</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {families.map((f) => {
            const isSelected = selectedFamilyId === f.familyId;
            return (
              <button
                key={f.familyId}
                type="button"
                onClick={() => setSelectedFamilyId(f.familyId)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-pink-500 bg-pink-50/50 shadow-md ring-2 ring-pink-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                    {f.familyId}
                  </span>
                  {f.hasVerifiedImplementation && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                </div>
                <p className="mt-2 text-xs font-bold text-slate-900 font-outfit truncate">{f.familyName}</p>
                <p className="text-[10px] text-slate-400 font-mono">{f.documentedVersions.length} versions</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Choose Operation */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black font-mono">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900 font-outfit">
              Select Creation Operation
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Target Family: {currentFamily.familyName}</span>
        </div>

        <div className="space-y-3">
          {/* Operation Option A: Create New Version */}
          <div
            onClick={() => setSelectedOperation('new-version')}
            className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-4 ${
              selectedOperation === 'new-version'
                ? 'border-pink-500 bg-white shadow-md ring-2 ring-pink-500/15'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <input
              type="radio"
              checked={selectedOperation === 'new-version'}
              onChange={() => setSelectedOperation('new-version')}
              className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 font-outfit">Create New Version Specification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Define a brand-new numbered version (e.g. {currentFamily.familyId}7) within {currentFamily.familyName} with custom learning intent, domain parameters, and engineering contracts.
              </p>
            </div>
          </div>

          {/* Operation Option B: Derive / Mix & Match */}
          <div
            onClick={() => setSelectedOperation('mix-match')}
            className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-4 ${
              selectedOperation === 'mix-match'
                ? 'border-pink-500 bg-white shadow-md ring-2 ring-pink-500/15'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <input
              type="radio"
              checked={selectedOperation === 'mix-match'}
              onChange={() => setSelectedOperation('mix-match')}
              className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-outfit">Intra-Family Mix & Match Builder</h3>
                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200 uppercase">
                  Intra-Family Only
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select multiple source versions from {currentFamily.familyName} (e.g. {currentFamily.familyId}1 + {currentFamily.familyId}2 + {currentFamily.familyId}5) and combine compatible components into a derived version.
              </p>
            </div>
          </div>

          {/* Operation Option C: Qualify Existing Version */}
          <div
            onClick={() => setSelectedOperation('qualify')}
            className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-4 ${
              selectedOperation === 'qualify'
                ? 'border-pink-500 bg-white shadow-md ring-2 ring-pink-500/15'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <input
              type="radio"
              checked={selectedOperation === 'qualify'}
              onChange={() => setSelectedOperation('qualify')}
              className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 font-outfit">Qualify Existing Version</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inspect an existing version (such as {currentFamily.familyId}2) and add incremental patterns to determine whether it remains qualified or warrants a new version number.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <Link
            href="/tools/project-llm"
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Cancel & Return Home
          </Link>
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span>Continue to Builder</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
