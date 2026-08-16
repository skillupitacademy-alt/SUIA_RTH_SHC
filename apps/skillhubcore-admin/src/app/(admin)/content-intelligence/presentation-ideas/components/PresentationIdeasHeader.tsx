'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PresentationIdeasHeaderProps {
  selectedCount: number;
  onApplySelected?: () => void;
  backHref?: string;
  nextHref?: string;
}

export function PresentationIdeasHeader({
  selectedCount,
  onApplySelected,
  backHref = '/content-intelligence/block-suggestions',
  nextHref = '/content-intelligence/review-plan',
}: PresentationIdeasHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Presentation Ideas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Smart presentation suggestions to make your content more engaging and effective.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft size={14} className="text-slate-500" />
          <span>Back to Block Suggestions</span>
        </Link>

        <button
          onClick={onApplySelected}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <span>Apply Selected Ideas ({selectedCount})</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
