'use client';

import React from 'react';
import { Binary, Cpu, Layers } from 'lucide-react';

interface TechnicalDeepDiveProps {
  data: {
    technicalTitle: string;
    underlyingMechanism: string;
    lowLevelDetail: string;
    specifications?: { key: string; value: string }[];
  };
  themeColor: string;
}

export function TechnicalDeepDive({ data, themeColor }: TechnicalDeepDiveProps) {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#020617] p-8 md:p-12 shadow-2xl relative overflow-hidden">
      {/* Matrix-like background effect */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none font-mono text-[8px] leading-tight text-white">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i}>{Math.random().toString(2).slice(2, 40)}</div>
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <Cpu size={22} style={{ color: themeColor }} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-1">Architecture Deep Dive</span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter">{data.technicalTitle}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-1 rounded bg-slate-800">
                <Layers size={14} className="text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-2">Internal Mechanism</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  {data.underlyingMechanism}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 p-1 rounded bg-slate-800">
                <Binary size={14} className="text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-2">Implementation Details</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-mono bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  {data.lowLevelDetail}
                </p>
              </div>
            </div>
          </div>

          {data.specifications && (
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6 backdrop-blur-sm">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Technical Specs</h4>
              <div className="divide-y divide-slate-800">
                {data.specifications.map((spec, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center gap-4">
                    <span className="text-xs font-bold text-slate-400">{spec.key}</span>
                    <span className="text-xs font-mono text-white bg-slate-800 px-2 py-0.5 rounded" style={{ color: themeColor }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
