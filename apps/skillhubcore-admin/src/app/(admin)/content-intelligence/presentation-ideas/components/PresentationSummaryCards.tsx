'use client';

import React from 'react';
import { Layout, ThumbsUp, CheckCircle2, Lightbulb, CheckSquare } from 'lucide-react';
import type { PresentationIdeasStatistics } from '@quiz/types';

interface PresentationSummaryCardsProps {
  statistics: PresentationIdeasStatistics;
  selectedCount: number;
}

export function PresentationSummaryCards({
  statistics,
  selectedCount,
}: PresentationSummaryCardsProps) {
  const cards = [
    {
      title: 'Presentation Ideas',
      value: statistics.total,
      subtitle: 'Total suggestions',
      icon: Layout,
      iconColor: 'text-[#f54a8d]',
      iconBg: 'bg-pink-50',
      borderColor: 'border-pink-100',
    },
    {
      title: 'High Impact',
      value: statistics.high,
      subtitle: 'Great improvement',
      icon: ThumbsUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Medium Impact',
      value: statistics.medium,
      subtitle: 'Moderate improvement',
      icon: CheckCircle2,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Enhancement Tips',
      value: statistics.enhancementTips || statistics.low || 1,
      subtitle: 'Optional refinements',
      icon: Lightbulb,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      borderColor: 'border-purple-100',
    },
    {
      title: 'Selected Ideas',
      value: selectedCount,
      subtitle: 'Ready to apply',
      icon: CheckSquare,
      iconColor: 'text-white',
      iconBg: 'bg-[#0B1B3D]',
      borderColor: 'border-slate-300',
      isHighlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white rounded-xl border ${card.borderColor} p-4 shadow-2xs hover:shadow-xs transition-shadow`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-9 h-9 rounded-lg ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 block truncate">
                  {card.title}
                </span>
                <span className="text-xl font-black text-slate-900 leading-tight">
                  {card.value}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium pl-0.5">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
