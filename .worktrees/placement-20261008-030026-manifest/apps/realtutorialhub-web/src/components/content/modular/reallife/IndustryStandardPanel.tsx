'use client';

import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

interface IndustryStandardPanelProps {
  data: {
    standardName: string;
    description: string;
    whyItMatters: string;
    keyMetrics?: { label: string; value: string }[];
  };
  themeColor: string;
}

export function IndustryStandardPanel({ data, themeColor }: IndustryStandardPanelProps) {
  if (!data) return null;

  return (
    <div className="group h-full rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-900/60 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">{data.standardName}</h3>
        </div>
        <Zap size={16} className="text-slate-600 animate-pulse" />
      </div>

      <div className="space-y-6">
        <p className="text-sm text-slate-400 leading-relaxed">
          {data.description}
        </p>

        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/50 border-l-4" style={{ borderColor: themeColor }}>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Core Value</h4>
          <p className="text-sm text-slate-300 italic">
            {data.whyItMatters}
          </p>
        </div>

        {data.keyMetrics && (
          <div className="grid grid-cols-2 gap-4">
            {data.keyMetrics.map((metric, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">{metric.label}</div>
                <div className="text-sm font-black text-slate-100" style={{ color: themeColor }}>{metric.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
