'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface AnalysisHeaderProps {
  onBackToImport?: () => void;
  onReviewSuggestions?: () => void;
}

export function AnalysisHeader({
  onBackToImport,
  onReviewSuggestions,
}: AnalysisHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Content Analysis
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          We&apos;ve analyzed your content and extracted the structure, sections, and key elements.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/content-intelligence/import"
          onClick={onBackToImport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
        >
          <ArrowLeft size={14} className="text-slate-500" />
          <span>Back to Import</span>
        </Link>

        <Link
          href="/content-intelligence/block-suggestions"
          onClick={onReviewSuggestions}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <span>Review Block Suggestions</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
