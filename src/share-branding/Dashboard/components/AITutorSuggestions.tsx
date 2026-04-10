import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Sparkles, Code, TrendingUp, ArrowRight } from 'lucide-react';
import { useDashboardData } from './DashboardDataContext';

const toneMap = {
  accent: { icon: Sparkles, color: '#8b5cf6', bg: '#faf5ff' },
  info: { icon: Code, color: '#3b82f6', bg: '#eff6ff' },
  warning: { icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb' },
} as const;

export function AITutorSuggestions() {
  const brand = useBrand();
  const { tutorSuggestions } = useDashboardData();

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-bold text-gray-900">{tutorSuggestions.title}</h3>
      <p className="mb-5 text-sm text-gray-600">{tutorSuggestions.subtitle}</p>

      <div className="space-y-3">
        {tutorSuggestions.items.map((suggestion, index) => {
          const tone = toneMap[suggestion.tone];
          const Icon = tone.icon;
          return (
            <div
              key={index}
              className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-all hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: tone.bg }}>
                  <Icon style={{ color: tone.color }} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 break-words text-sm font-semibold text-gray-900">{suggestion.title}</h4>
                  <p className="break-words text-xs text-gray-600">{suggestion.description}</p>
                </div>
              </div>
              <button
                className="h-9 w-full flex-shrink-0 rounded-xl px-4 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg sm:ml-3 sm:w-auto"
                style={{ backgroundColor: brand.primaryColor }}
              >
                <span className="flex items-center justify-center gap-2">
                  {suggestion.ctaLabel}
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
