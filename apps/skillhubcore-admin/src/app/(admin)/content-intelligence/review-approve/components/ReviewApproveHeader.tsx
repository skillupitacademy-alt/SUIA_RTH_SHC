'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ReviewApproveHeaderProps {
  readyCount: number;
  onProceedToComposer: () => void;
  backHref?: string;
}

export function ReviewApproveHeader({
  readyCount,
  onProceedToComposer,
  backHref = '/content-intelligence/presentation-ideas',
}: ReviewApproveHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Review & Approve Suggestions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review each suggestion and decide what to keep, modify, or remove before adding to the composer.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft size={14} className="text-slate-500" />
          <span>Back to Presentation Ideas</span>
        </Link>

        <button
          onClick={onProceedToComposer}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <span>Proceed to Composer ({readyCount})</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
