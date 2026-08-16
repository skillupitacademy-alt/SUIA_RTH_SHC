'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { ReviewableSuggestionItem } from './ReviewSuggestionsTable';

interface ContentOutlineSidebarProps {
  items: ReviewableSuggestionItem[];
  outlineItems?: Array<{
    title: string;
    level: string;
    wordCount?: number;
  }>;
}

export function ContentOutlineSidebar({ items, outlineItems }: ContentOutlineSidebarProps) {
  // Check if a section has an active accepted or modified suggestion
  const activeSuggestions = items.filter(
    (i) => i.reviewStatus === 'accepted' || i.reviewStatus === 'modified'
  );

  const defaultOutline = [
    { title: 'JavaScript', level: 'h1' },
    { title: 'Introduction', level: 'p' },
    { title: '1. What does it actually do?', level: 'h2' },
    { title: 'Details about interactivity', level: 'p' },
    { title: '2. Where does it run?', level: 'h2' },
    { title: 'Client-Side (Frontend)', level: 'h3', check: true },
    { title: 'Server-Side (Backend)', level: 'h3' },
    { title: '3. Key Technical Characteristics', level: 'h2', check: true, note: '(3 concept cards)' },
    { title: '4. The JavaScript Ecosystem', level: 'h2', check: true, note: '(Icon cards)' },
    { title: '5. The Crucial Clarification: JS is NOT Java', level: 'h2', check: true, note: '(Important callout)' },
    { title: 'Summary', level: 'h2', check: true, note: '(Summary box)' },
  ];

  const displayOutline = outlineItems && outlineItems.length > 0 ? outlineItems : defaultOutline;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
      <h2 className="text-xs font-bold text-slate-900 mb-3.5 tracking-tight flex items-center justify-between">
        <span>Content Outline (After Review)</span>
        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          {activeSuggestions.length} Applied
        </span>
      </h2>

      <div className="space-y-2 text-xs">
        {displayOutline.map((item, idx) => {
          const isH1 = item.level === 'h1';
          const isH2 = item.level === 'h2';
          const isH3 = item.level === 'h3';
          const isP = item.level === 'p' || item.level === 'summary';

          let badgeBg = 'bg-slate-100 text-slate-600';
          let badgeText = 'P';

          if (isH1) {
            badgeBg = 'bg-[#0B1B3D] text-white';
            badgeText = 'H1';
          } else if (isH2) {
            badgeBg = 'bg-[#0B1B3D] text-white';
            badgeText = 'H2';
          } else if (isH3) {
            badgeBg = 'bg-slate-200 text-slate-700';
            badgeText = 'H3';
          }

          const hasCheck = (item as any).check;
          const note = (item as any).note;

          return (
            <div
              key={idx}
              className={`flex items-center justify-between gap-2 ${
                isH3 ? 'pl-6' : isP ? 'pl-4 text-slate-500' : 'text-slate-800 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${badgeBg}`}
                >
                  {badgeText}
                </span>
                <span className="truncate text-xs">{item.title}</span>
              </div>

              {hasCheck && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {note && (
                    <span className="text-[10px] text-emerald-600/90 font-medium">
                      {note}
                    </span>
                  )}
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Check size={11} className="stroke-[3]" />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
