import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Sparkles, Code, TrendingUp, ArrowRight } from 'lucide-react';

const suggestions = [
  {
    icon: Sparkles,
    title: 'Finish "React State Management"',
    description: 'Learning about react learning paths.',
    color: '#8b5cf6',
    bg: '#faf5ff',
  },
  {
    icon: Code,
    title: 'Start "GraphQL Basics"',
    description: 'Practice react on learning performance.',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    icon: TrendingUp,
    title: 'Practice "Recursion"',
    description: 'Practice recursion performance.',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
];

export function AITutorSuggestions() {
  const brand = useBrand();

  return (
    <div className="rounded-[2rem] p-6 bg-white border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{brand.tutorLabel} Suggestions</h3>
      <p className="text-sm text-gray-600 mb-5">Recommends based on performance</p>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 group cursor-pointer"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: suggestion.bg }}>
                  <Icon style={{ color: suggestion.color }} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-gray-600">{suggestion.description}</p>
                </div>
              </div>
              <button
                className="px-4 h-9 rounded-xl font-semibold text-sm text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all flex-shrink-0 ml-3"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Start
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}