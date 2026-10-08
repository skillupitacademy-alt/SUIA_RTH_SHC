'use client';

import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

interface SimpleOverviewProps {
  data: {
    badge: string;
    headline: string;
    simpleDefinition: string;
    subExplanation: string;
    importanceBlock: string;
    progressIndicator?: string;
  };
  themeColor: string;
  sectionNumber?: number;
}

export function SimpleOverview({ data, themeColor, sectionNumber = 1 }: SimpleOverviewProps) {
  if (!data) return null;

  return (
    <section className="rounded-[28px] border border-blue-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] h-full">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-black text-white shadow-sm"
          style={{ backgroundColor: themeColor }}
        >
          {sectionNumber}
        </div>
        <div className="min-w-0">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]"
            style={{ backgroundColor: `${themeColor}14`, color: themeColor }}
          >
            <Sparkles size={14} aria-hidden="true" />
            {data.badge}
          </div>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{data.headline}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[180px,minmax(0,1fr)] md:items-start">
        <div
          className="flex aspect-square max-w-[180px] items-center justify-center rounded-[24px] border border-amber-200 bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 text-[64px] font-black text-slate-900 shadow-sm"
          aria-hidden="true"
        >
          <BookOpen size={48} />
        </div>

        <div className="space-y-5">
          <p className="text-lg font-semibold leading-8 text-slate-900">{data.simpleDefinition}</p>
          <p className="text-base font-medium leading-7 text-slate-700">{data.subExplanation}</p>

          <div
            className="rounded-2xl border px-5 py-4"
            style={{ backgroundColor: `${themeColor}08`, borderColor: `${themeColor}35` }}
          >
            <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: themeColor }}>
              Why This Matters
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{data.importanceBlock}</p>
          </div>
        </div>
      </div>

      {data.progressIndicator ? (
        <div
          className="mt-6 rounded-2xl border px-5 py-4 text-sm font-bold"
          style={{ backgroundColor: `${themeColor}10`, borderColor: `${themeColor}28`, color: themeColor }}
        >
          {data.progressIndicator}
        </div>
      ) : null}
    </section>
  );
}
