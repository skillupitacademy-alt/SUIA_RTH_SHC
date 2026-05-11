'use client';

import React from 'react';
import { Eye, Info } from 'lucide-react';

interface VisualSummaryProps {
  data: {
    summaryTitle: string;
    conceptDiagramDescription: string;
    keyTakeaways: string[];
    image?: {
      url: string;
      alt: string;
      caption?: string;
    };
  };
  themeColor: string;
}

export function VisualSummary({ data, themeColor }: VisualSummaryProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Eye size={20} style={{ color: themeColor }} />
        <h3 className="text-lg font-bold text-slate-100 tracking-tight">{data.summaryTitle}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} style={{ color: themeColor }} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Concept Flow</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              {data.conceptDiagramDescription}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Core Takeaways</h4>
            <ul className="space-y-2">
              {data.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {data.image ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r opacity-20 blur group-hover:opacity-30 transition-opacity" style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #fb923c)` }} />
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
              <img src={data.image.url} alt={data.image.alt} className="w-full h-auto object-cover" />
              {data.image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 border-t border-slate-800">
                  {data.image.caption}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-slate-950/50 border border-slate-800 border-dashed flex items-center justify-center">
            <span className="text-slate-600 text-xs font-mono">Visual Placeholder</span>
          </div>
        )}
      </div>
    </div>
  );
}
