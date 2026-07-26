'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface NotesHeroProps {
  data: {
    heroTitle: string;
    heroSubtitle: string;
    quickLook: string[];
  };
  themeColor: string;
}

export function NotesHero({ data, themeColor }: NotesHeroProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-7 shadow-xl">
      <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: themeColor }}>
              JS
            </span>
            <span className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-600">
              Beginner
            </span>
          </div>

          <h2 className="mb-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
            {data.heroTitle}
          </h2>
          <p className="text-lg font-semibold leading-relaxed text-slate-600">
            {data.heroSubtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {data.quickLook.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black shadow-sm"
                style={{ color: themeColor }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg md:w-[360px]">
          <Sparkles size={22} style={{ color: themeColor }} />
          <p className="mt-5 text-xs font-black uppercase tracking-widest text-slate-400">Simple Words</p>
          <p className="mt-3 text-2xl font-black text-slate-950">Begin with meaning first</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            A short overview designed to orient the learner before detail-heavy blocks.
          </p>
          <div className="mt-5 h-2 rounded-full bg-slate-100">
            <div className="h-full w-2/5 rounded-full" style={{ backgroundColor: themeColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}
