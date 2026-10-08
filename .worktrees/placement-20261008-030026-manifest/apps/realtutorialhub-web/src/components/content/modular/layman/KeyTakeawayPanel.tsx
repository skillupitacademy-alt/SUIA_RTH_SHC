'use client';

import React from 'react';
import { Award, CheckCircle2, Sparkles } from 'lucide-react';

interface KeyTakeawayPanelProps {
  data: {
    summaryTitle: string;
    keyTakeaways: string[];
    simpleRecapPoints: string[];
    confidenceBoost: string;
    memoryReinforcement: string;
  };
  themeColor: string;
  sectionNumber?: number;
}

export function KeyTakeawayPanel({ data, themeColor, sectionNumber = 8 }: KeyTakeawayPanelProps) {
  if (!data) return null;

  return (
    <section className="rounded-[28px] border border-emerald-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-lg font-black text-white">
          {sectionNumber}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{data.summaryTitle}</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr),minmax(0,0.9fr)]">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <div className="mb-4 text-xs font-black uppercase tracking-[0.16em]" style={{ color: themeColor }}>
            Quick Recap
          </div>
          <ul className="space-y-3">
            {data.keyTakeaways.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: themeColor }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border bg-white px-5 py-4" style={{ borderColor: `${themeColor}25` }}>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]" style={{ color: themeColor }}>
              <Sparkles size={14} />
              Remember This
            </div>
            <p className="text-sm font-bold leading-6 text-slate-900">{data.memoryReinforcement}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <Award className="mt-0.5 shrink-0 text-emerald-700" size={18} />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Confidence Boost</div>
                <p className="mt-2 text-sm font-bold leading-6 text-emerald-950">{data.confidenceBoost}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600">What You Learned</div>
            <ul className="space-y-2">
              {data.simpleRecapPoints.map((item, index) => (
                <li key={index} className="text-sm font-semibold leading-6 text-slate-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
