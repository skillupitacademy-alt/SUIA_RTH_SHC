'use client';

import React from 'react';
import type { ContextOutline } from '@quiz/types';

interface ContentContextCardProps {
  contextOutline?: ContextOutline;
  sections?: Array<{
    id: string;
    title: string;
    level: number | string;
    type?: string;
    subsections?: Array<{ id: string; title: string; level: number | string }>;
  }>;
}

export function ContentContextCard({ contextOutline, sections }: ContentContextCardProps) {
  // Default structure matching page-14.png if no outline provided
  const mainSections = contextOutline?.mainSections || [
    { title: 'JavaScript', level: 'h1', wordCount: 45 },
    { title: 'Introduction', level: 'p', wordCount: 60 },
    { title: '1. What does it actually do?', level: 'h2', wordCount: 85 },
    { title: 'Details about interactivity', level: 'p', wordCount: 40 },
    { title: '2. Where does it run?', level: 'h2', wordCount: 120 },
    { title: 'Client-Side (Frontend)', level: 'h3', wordCount: 50 },
    { title: 'Server-Side (Backend)', level: 'h3', wordCount: 70 },
    { title: '3. Key Technical Characteristics', level: 'h2', wordCount: 95 },
    { title: '4. The JavaScript Ecosystem', level: 'h2', wordCount: 80 },
    { title: '5. The Crucial Clarification: JS is NOT Java', level: 'h2', wordCount: 65 },
    { title: 'Summary', level: 'h2', wordCount: 40 },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
      <h2 className="text-xs font-bold text-slate-900 mb-3.5 tracking-tight flex items-center justify-between">
        <span>Content Context (From Analysis)</span>
        {contextOutline?.totalWords ? (
          <span className="text-[10px] text-slate-400 font-normal">
            {contextOutline.totalWords} words · {contextOutline.readingTimeMinutes || 2} min
          </span>
        ) : null}
      </h2>

      <div className="space-y-2 text-xs">
        {mainSections.map((item, idx) => {
          const isH1 = item.level === 'h1';
          const isH2 = item.level === 'h2';
          const isH3 = item.level === 'h3';
          const isP = item.level === 'summary';

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

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 ${
                isH3 ? 'pl-6' : isP ? 'pl-4 text-slate-500' : 'text-slate-800 font-semibold'
              }`}
            >
              <span
                className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${badgeBg}`}
              >
                {badgeText}
              </span>
              <span className="truncate text-xs">{item.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
