'use client';

import React from 'react';
import { FileText, ShieldCheck, CircleDot, AlertTriangle, ListTree } from 'lucide-react';
import type { BlockSuggestionsSummaryData } from './mockBlockSuggestionsData';

interface SuggestionSummaryCardsProps {
  summary: BlockSuggestionsSummaryData;
}

export function SuggestionSummaryCards({ summary }: SuggestionSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Total Blocks Suggested */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-pink-50 text-[#f54a8d] flex items-center justify-center shrink-0">
          <FileText size={20} />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Blocks Suggested
          </span>
          <span className="text-xl font-black text-slate-900 leading-tight block mt-0.5">
            {summary.totalSuggested}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Ready for review
          </span>
        </div>
      </div>

      {/* 2. High Confidence */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            High Confidence
          </span>
          <span className="text-xl font-black text-slate-900 leading-tight block mt-0.5">
            {summary.highConfidenceCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            ≥ 80% confidence
          </span>
        </div>
      </div>

      {/* 3. Medium Confidence */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <CircleDot size={20} />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Medium Confidence
          </span>
          <span className="text-xl font-black text-slate-900 leading-tight block mt-0.5">
            {summary.mediumConfidenceCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            50% – 79% confidence
          </span>
        </div>
      </div>

      {/* 4. Low Confidence */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Low Confidence
          </span>
          <span className="text-xl font-black text-slate-900 leading-tight block mt-0.5">
            {summary.lowConfidenceCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            &lt; 50% confidence
          </span>
        </div>
      </div>

      {/* 5. Auto-Detected Sections */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-[#0B1B3D]/5 text-[#0B1B3D] flex items-center justify-center shrink-0">
          <ListTree size={20} />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Auto-Detected Sections
          </span>
          <span className="text-xl font-black text-slate-900 leading-tight block mt-0.5">
            {summary.sectionsCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            From your content
          </span>
        </div>
      </div>
    </div>
  );
}
