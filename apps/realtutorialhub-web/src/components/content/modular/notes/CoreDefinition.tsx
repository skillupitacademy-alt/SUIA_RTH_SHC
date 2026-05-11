'use client';

import React from 'react';
import { Lightbulb, Info } from 'lucide-react';

interface CoreDefinitionProps {
  data: {
    badge: string;
    headline: string;
    definition: string;
    simpleExplanation: string;
    whyItMatters: string;
  };
  themeColor: string;
}

export function CoreDefinition({ data, themeColor }: CoreDefinitionProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl transition-all hover:shadow-2xl hover:border-slate-700">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Lightbulb size={64} style={{ color: themeColor }} />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <span 
          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
          style={{ backgroundColor: themeColor }}
        >
          {data.badge}
        </span>
      </div>

      <h3 className="text-xl font-bold text-slate-100 mb-3 tracking-tight">
        {data.headline}
      </h3>

      <div className="space-y-4">
        <p className="text-slate-300 text-sm leading-relaxed border-l-2 pl-4" style={{ borderColor: themeColor }}>
          {data.definition}
        </p>

        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-start gap-3">
            <Info size={16} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">In Simple Terms</p>
              <p className="text-slate-300 text-sm italic leading-relaxed">
                {`"${data.simpleExplanation}"`}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Strategic Value</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            {data.whyItMatters}
          </p>
        </div>
      </div>
    </div>
  );
}
