'use client';

import React from 'react';
import { Layers, FileText, Target } from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';

export function ProjectLlmContextBanner() {
  const { state } = useProjectLlm();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 sm:p-5 shadow-lg border-t border-white/60">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Block Family */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 border border-pink-200 text-[#e11d48] shadow-sm shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Block Family
              </p>
              <h3 className="text-base font-bold text-slate-900 font-outfit leading-tight">
                {state.familyName}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {state.existingVersions.length} existing versions
              </p>
            </div>
          </div>

          <div className="hidden sm:block h-10 w-px bg-slate-200/80" />

          {/* Target Version */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 text-purple-600 shadow-sm shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Target Version
              </p>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-purple-700 font-mono">
                  {state.targetVersion}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                  New version
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block h-10 w-px bg-slate-200/80" />

          {/* Purpose */}
          <div className="flex items-start gap-3 max-w-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-200 text-orange-600 shadow-sm shrink-0 mt-0.5">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Purpose (as specified)
              </p>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                {state.purpose}
              </p>
            </div>
          </div>
        </div>

        {/* Existing Versions Pills */}
        <div className="pt-2 lg:pt-0 lg:border-l lg:border-slate-200/80 lg:pl-6 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
            Based on Existing Versions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {state.existingVersions.map((v) => (
              <span
                key={v}
                className="text-xs font-mono font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-lg"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
