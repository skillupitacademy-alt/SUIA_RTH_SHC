import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface BlockSuggestionsHeaderProps {
  selectedCount: number;
  onAddToComposer?: () => void;
  backHref?: string;
  nextHref?: string;
}

export function BlockSuggestionsHeader({
  selectedCount,
  onAddToComposer,
  backHref = '/content-intelligence/analysis',
  nextHref = '/content-intelligence/presentation-ideas',
}: BlockSuggestionsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Block Suggestions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and refine the suggested content blocks before exploring presentation layouts.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft size={14} className="text-slate-500" />
          <span>Back to Analysis</span>
        </Link>

        {onAddToComposer && (
          <button
            onClick={onAddToComposer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer border border-slate-200"
          >
            <span>Direct to Composer ({selectedCount})</span>
          </button>
        )}

        <Link
          href={nextHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Explore Presentation Ideas</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
