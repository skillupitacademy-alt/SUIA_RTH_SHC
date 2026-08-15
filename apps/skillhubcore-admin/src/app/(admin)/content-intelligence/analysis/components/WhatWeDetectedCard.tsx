'use client';

import React from 'react';
import {
  Heading,
  AlignLeft,
  List,
  ListOrdered,
  Code,
  Quote,
  Table,
  MessageSquareQuote,
  Sparkles,
  GitCompare,
  Lightbulb,
} from 'lucide-react';
import type { ContentAnalysisResult } from '@quiz/types';

interface WhatWeDetectedCardProps {
  detectedElements: ContentAnalysisResult['detectedElements'];
}

export function WhatWeDetectedCard({ detectedElements }: WhatWeDetectedCardProps) {
  const items = [
    { id: 'headings', label: 'Headings', count: detectedElements.headings, icon: Heading },
    { id: 'paragraphs', label: 'Paragraphs', count: detectedElements.paragraphs, icon: AlignLeft },
    { id: 'bulletLists', label: 'Bullet Lists', count: detectedElements.bulletLists, icon: List },
    { id: 'numberedLists', label: 'Numbered Lists', count: detectedElements.numberedLists, icon: ListOrdered },
    { id: 'codeBlocks', label: 'Code Blocks', count: detectedElements.codeBlocks, icon: Code },
    { id: 'quotes', label: 'Quotes', count: detectedElements.quotes, icon: Quote },
    { id: 'tables', label: 'Tables', count: detectedElements.tables, icon: Table },
    { id: 'callouts', label: 'Callouts (Suggested)', count: detectedElements.callouts, icon: MessageSquareQuote },
    { id: 'keyConcepts', label: 'Key Concepts (Suggested)', count: detectedElements.keyConcepts, icon: Sparkles },
    { id: 'comparisons', label: 'Comparisons (Suggested)', count: detectedElements.comparisons, icon: GitCompare },
    { id: 'examples', label: 'Examples (Suggested)', count: detectedElements.examples, icon: Lightbulb },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
        What We Detected
      </h3>

      <div className="space-y-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          const hasCount = item.count > 0;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs py-1"
            >
              <div className="flex items-center gap-2.5 text-slate-700">
                <Icon size={14} className="text-slate-400 shrink-0" />
                <span>{item.label}</span>
              </div>

              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  hasCount
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
