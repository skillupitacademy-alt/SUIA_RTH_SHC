'use client';

import React from 'react';
import { FileText, Type, ListTree, CheckSquare, ShieldCheck } from 'lucide-react';
import type { ContentAnalysisResult } from '@quiz/types';

interface AnalysisSummaryCardsProps {
  statistics: ContentAnalysisResult['statistics'];
  overallConfidence: ContentAnalysisResult['overallConfidence'];
}

export function AnalysisSummaryCards({
  statistics,
  overallConfidence,
}: AnalysisSummaryCardsProps) {
  const cards = [
    {
      id: 'words',
      label: 'Total Words',
      value: statistics.totalWords.toLocaleString(),
      subtext: `~ ${statistics.readingTimeMinutes} min read`,
      icon: FileText,
      iconBg: 'bg-pink-50 text-pink-600 border border-pink-100',
    },
    {
      id: 'characters',
      label: 'Characters',
      value: statistics.characters.toLocaleString(),
      subtext: '(with spaces)',
      icon: Type,
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
    },
    {
      id: 'sections',
      label: 'Sections Detected',
      value: statistics.sectionsDetected.toString(),
      subtext: statistics.sectionsBreakdown || 'H1: 1, H2: 5, H3: 2',
      icon: ListTree,
      iconBg: 'bg-slate-100 text-slate-800 border border-slate-200',
    },
    {
      id: 'blocks',
      label: 'Blocks Identified',
      value: statistics.totalBlocks.toString(),
      subtext: 'Ready for review',
      icon: CheckSquare,
      iconBg: 'bg-rose-50 text-rose-500 border border-rose-100',
    },
    {
      id: 'confidence',
      label: 'Overall Confidence',
      value: `${overallConfidence.score}%`,
      subtext: overallConfidence.grade === 'Good' || overallConfidence.grade === 'High' ? 'Good quality content' : 'Needs review',
      icon: ShieldCheck,
      iconBg: 'bg-slate-900 text-white',
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
        Analysis Summary
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-3.5 hover:border-slate-300 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500 truncate">
                  {card.label}
                </div>
                <div className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  {card.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
