'use client';

import React from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import type { SmartSuggestion } from '@quiz/types';

interface SmartSuggestionsCardProps {
  suggestions: SmartSuggestion[];
  onViewSuggestions?: () => void;
}

export function SmartSuggestionsCard({
  suggestions,
  onViewSuggestions,
}: SmartSuggestionsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-amber-500" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Smart Suggestions
          </h3>
        </div>

        <div className="space-y-3 mb-5">
          {suggestions.map((sug) => (
            <div key={sug.id} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
              <span className="text-pink-500 font-bold shrink-0 mt-0.5">&bull;</span>
              <span>{sug.text}</span>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/content-intelligence/block-suggestions"
        onClick={onViewSuggestions}
        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-pink-50 hover:bg-pink-100/80 active:bg-pink-200 border border-pink-200 text-pink-700 text-xs font-bold transition-all shadow-2xs"
      >
        <span>View Suggestions</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
