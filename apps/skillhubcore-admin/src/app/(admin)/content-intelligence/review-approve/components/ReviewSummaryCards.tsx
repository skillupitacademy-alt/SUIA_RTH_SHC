'use client';

import React from 'react';
import { FileText, CheckCircle2, Edit3, XCircle, ListChecks } from 'lucide-react';

interface ReviewSummaryCardsProps {
  total: number;
  accepted: number;
  modified: number;
  rejected: number;
  readyForComposer: number;
}

export function ReviewSummaryCards({
  total,
  accepted,
  modified,
  rejected,
  readyForComposer,
}: ReviewSummaryCardsProps) {
  const acceptedPct = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const modifiedPct = total > 0 ? Math.round((modified / total) * 100) : 0;
  const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0;

  const cards = [
    {
      title: 'Total Suggestions',
      value: total,
      subtitle: 'From previous step',
      icon: FileText,
      iconColor: 'text-[#f54a8d]',
      iconBg: 'bg-pink-50',
      borderColor: 'border-pink-100',
    },
    {
      title: 'Accepted',
      value: accepted,
      subtitle: `${acceptedPct}% of suggestions`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Modified',
      value: modified,
      subtitle: `${modifiedPct}% of suggestions`,
      icon: Edit3,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Rejected',
      value: rejected,
      subtitle: `${rejectedPct}% of suggestions`,
      icon: XCircle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      borderColor: 'border-rose-100',
    },
    {
      title: 'Ready for Composer',
      value: readyForComposer,
      subtitle: 'Blocks will be created',
      icon: ListChecks,
      iconColor: 'text-white',
      iconBg: 'bg-[#0B1B3D]',
      borderColor: 'border-slate-300',
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
