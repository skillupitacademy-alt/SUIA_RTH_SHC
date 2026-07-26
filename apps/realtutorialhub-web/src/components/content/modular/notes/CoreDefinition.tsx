'use client';

import React from 'react';
import { Info, Lightbulb } from 'lucide-react';

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
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-7 shadow-xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span
          className="rounded-full px-3 py-1 text-xs font-black text-white shadow-sm"
          style={{ backgroundColor: themeColor }}
        >
          {data.badge}
        </span>
        <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold" style={{ color: themeColor }}>
          Definition
        </span>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-7 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb size={18} style={{ color: themeColor }} />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Canonical Definition</p>
        </div>
        <h3 className="text-3xl font-black leading-tight text-slate-950">{data.headline}</h3>
        <p className="mt-5 border-l-4 pl-5 text-lg font-bold leading-8 text-slate-700" style={{ borderColor: themeColor }}>
          {data.definition}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Info size={15} style={{ color: themeColor }} />
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: themeColor }}>Simple Explanation</p>
          </div>
          <p className="text-sm font-semibold leading-6 text-slate-600">{data.simpleExplanation}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs font-black uppercase tracking-wider" style={{ color: themeColor }}>Why It Matters</p>
          <p className="text-sm font-semibold leading-6 text-slate-600">{data.whyItMatters}</p>
        </div>
      </div>
    </div>
  );
}
