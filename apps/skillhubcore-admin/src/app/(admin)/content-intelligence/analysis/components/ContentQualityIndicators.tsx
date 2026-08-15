'use client';

import React from 'react';
import {
  BookOpen,
  Layout,
  CheckCircle2,
  Image as ImageIcon,
  Code2,
  Eye,
} from 'lucide-react';
import type { ContentAnalysisResult, QualityStatus } from '@quiz/types';

interface ContentQualityIndicatorsProps {
  indicators: ContentAnalysisResult['qualityIndicators'];
}

export function ContentQualityIndicators({ indicators }: ContentQualityIndicatorsProps) {
  const getBadgeStyle = (status: QualityStatus) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'high':
      case 'good':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'fair':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'poor':
      case 'none':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: QualityStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const items = [
    {
      id: 'readability',
      label: 'Readability',
      status: indicators.readability,
      icon: BookOpen,
    },
    {
      id: 'structure',
      label: 'Structure',
      status: indicators.structure,
      icon: Layout,
    },
    {
      id: 'completeness',
      label: 'Completeness',
      status: indicators.completeness,
      icon: CheckCircle2,
    },
    {
      id: 'examples',
      label: 'Examples',
      status: indicators.examples,
      icon: ImageIcon,
    },
    {
      id: 'codePresence',
      label: 'Code Presence',
      status: indicators.codePresence,
      icon: Code2,
    },
    {
      id: 'visualPotential',
      label: 'Visual Potential',
      status: indicators.visualPotential,
      icon: Eye,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
        Content Quality Indicators
      </h3>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                <Icon size={15} className="text-slate-400 shrink-0" />
                <span>{item.label}</span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle(
                  item.status
                )}`}
              >
                {getStatusLabel(item.status)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
