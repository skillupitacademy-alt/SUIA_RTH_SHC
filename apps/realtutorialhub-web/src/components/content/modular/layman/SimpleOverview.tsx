'use client';

import React from 'react';
import { Coffee } from 'lucide-react';

interface SimpleOverviewProps {
  data: {
    headline: string;
    oneSentenceSummary: string;
    whatIsIt: string;
    whyShouldICare: string;
  };
  themeColor: string;
}

export function SimpleOverview({ data, themeColor }: SimpleOverviewProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <Coffee size={20} className="text-orange-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-100 tracking-tight">{data.headline}</h3>
      </div>

      <div className="space-y-5">
        <p className="text-sm font-bold text-slate-200 bg-slate-800/50 p-3 rounded-lg border-l-4" style={{ borderColor: themeColor }}>
          "{data.oneSentenceSummary}"
        </p>

        <div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">The Big Picture</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            {data.whatIsIt}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/50">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Value Proposition</h4>
          <p className="text-sm text-slate-400 leading-relaxed italic">
            {data.whyShouldICare}
          </p>
        </div>
      </div>
    </div>
  );
}
