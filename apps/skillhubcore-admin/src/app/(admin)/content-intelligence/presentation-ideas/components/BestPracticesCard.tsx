'use client';

import React from 'react';
import Link from 'next/link';
import { Check, FileText } from 'lucide-react';
import type { BestPractice } from '@quiz/types';

interface BestPracticesCardProps {
  bestPractices?: BestPractice[];
  analysisHref?: string;
}

export function BestPracticesCard({
  bestPractices,
  analysisHref = '/content-intelligence/analysis',
}: BestPracticesCardProps) {
  const defaultPractices = [
    { title: 'Use headings hierarchically' },
    { title: 'Keep sections focused' },
    { title: 'Use visual layouts for comparisons' },
    { title: 'Highlight important clarifications' },
    { title: 'Add examples where possible' },
  ];

  const items = bestPractices && bestPractices.length > 0 ? bestPractices : defaultPractices;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
      <h2 className="text-xs font-bold text-slate-900 mb-3.5 tracking-tight">
        Best Practices
      </h2>

      <div className="space-y-2.5 mb-5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
            <span className="w-4 h-4 rounded-full bg-pink-50 text-[#f54a8d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <Check size={11} className="stroke-[3]" />
            </span>
            <span className="leading-snug">{item.title}</span>
          </div>
        ))}
      </div>

      <Link
        href={analysisHref}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-pink-200 text-[#f54a8d] hover:bg-pink-50 text-xs font-semibold shadow-2xs transition-colors"
      >
        <FileText size={14} className="text-[#f54a8d]" />
        <span>View Content Quality Report</span>
      </Link>
    </div>
  );
}
