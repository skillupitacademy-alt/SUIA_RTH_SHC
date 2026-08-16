'use client';

import React from 'react';
import { Columns, Table, Grid, AlertCircle, GitCommit, Code, Quote, ListChecks } from 'lucide-react';
import type { WireframeType } from '@quiz/types';

interface WireframeIllustrationsProps {
  wireframeType: WireframeType | string;
  className?: string;
}

export function WireframeIllustrations({ wireframeType, className = '' }: WireframeIllustrationsProps) {
  switch (wireframeType) {
    case 'two-column-50-50':
    case 'two-column-60-40':
    case 'two-column-40-60':
    case 'two-column':
      return (
        <div className={`w-28 h-20 bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-center gap-1.5 shadow-2xs shrink-0 ${className}`}>
          {/* Column 1 */}
          <div className="flex-1 h-full bg-white border border-slate-200 rounded p-1 flex flex-col gap-1 shadow-2xs">
            <div className="w-full h-1.5 bg-[#f54a8d] rounded-xs" />
            <div className="w-full h-1 bg-slate-200 rounded-xs" />
            <div className="w-3/4 h-1 bg-slate-200 rounded-xs" />
            <div className="w-5/6 h-1 bg-slate-200 rounded-xs" />
          </div>
          {/* Column 2 */}
          <div className="flex-1 h-full bg-white border border-slate-200 rounded p-1 flex flex-col gap-1 shadow-2xs">
            <div className="w-full h-1.5 bg-[#f54a8d] rounded-xs" />
            <div className="w-full h-1 bg-slate-200 rounded-xs" />
            <div className="w-4/5 h-1 bg-slate-200 rounded-xs" />
            <div className="w-2/3 h-1 bg-slate-200 rounded-xs" />
          </div>
        </div>
      );

    case 'comparison-table':
    case 'comparison':
    case 'table':
      return (
        <div className={`w-28 h-20 bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col justify-between shadow-2xs shrink-0 ${className}`}>
          {/* Table Header */}
          <div className="w-full h-3 bg-[#f54a8d]/90 rounded-xs flex items-center px-1 gap-1">
            <div className="w-1/3 h-1.5 bg-white/80 rounded-xs" />
            <div className="w-1/3 h-1.5 bg-white/80 rounded-xs" />
            <div className="w-1/3 h-1.5 bg-white/80 rounded-xs" />
          </div>
          {/* Row 1 */}
          <div className="w-full h-2.5 bg-white border border-slate-200 rounded-xs flex items-center px-1 gap-1">
            <div className="w-1/3 h-1 bg-slate-300 rounded-xs" />
            <div className="w-1/3 h-1 bg-slate-200 rounded-xs" />
            <div className="w-1/3 h-1 bg-slate-200 rounded-xs" />
          </div>
          {/* Row 2 */}
          <div className="w-full h-2.5 bg-slate-100/70 border border-slate-200 rounded-xs flex items-center px-1 gap-1">
            <div className="w-1/3 h-1 bg-slate-300 rounded-xs" />
            <div className="w-1/3 h-1 bg-slate-200 rounded-xs" />
            <div className="w-1/3 h-1 bg-slate-200 rounded-xs" />
          </div>
          {/* Row 3 */}
          <div className="w-full h-2.5 bg-white border border-slate-200 rounded-xs flex items-center px-1 gap-1">
            <div className="w-1/3 h-1 bg-slate-300 rounded-xs" />
            <div className="w-1/3 h-1 bg-slate-200 rounded-xs" />
            <div className="w-1/3 h-1 bg-slate-200 rounded-xs" />
          </div>
        </div>
      );

    case 'concept-cards-grid':
    case 'concept-cards':
    case 'card-grid':
      return (
        <div className={`w-28 h-20 bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center justify-center gap-1 shadow-2xs shrink-0 ${className}`}>
          {/* Card 1 */}
          <div className="w-7 h-full bg-white border border-slate-200 rounded p-1 flex flex-col items-center justify-between shadow-2xs">
            <div className="w-3.5 h-3.5 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center">
              <span className="text-[7px] text-[#f54a8d] font-bold">👤</span>
            </div>
            <div className="w-full h-0.5 bg-[#f54a8d] rounded-xs" />
            <div className="w-full h-0.5 bg-slate-200 rounded-xs" />
            <div className="w-2/3 h-0.5 bg-slate-200 rounded-xs" />
            <div className="w-1.5 h-1.5 bg-pink-400 rotate-45 rounded-2xs" />
          </div>
          {/* Card 2 */}
          <div className="w-7 h-full bg-white border border-slate-200 rounded p-1 flex flex-col items-center justify-between shadow-2xs">
            <div className="w-3.5 h-3.5 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center">
              <span className="text-[7px] text-[#f54a8d] font-bold">⛶</span>
            </div>
            <div className="w-full h-0.5 bg-[#f54a8d] rounded-xs" />
            <div className="w-full h-0.5 bg-slate-200 rounded-xs" />
            <div className="w-2/3 h-0.5 bg-slate-200 rounded-xs" />
            <div className="w-1.5 h-1.5 bg-pink-400 rotate-45 rounded-2xs" />
          </div>
          {/* Card 3 */}
          <div className="w-7 h-full bg-white border border-slate-200 rounded p-1 flex flex-col items-center justify-between shadow-2xs">
            <div className="w-3.5 h-3.5 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center">
              <span className="text-[7px] text-[#f54a8d] font-bold">📄</span>
            </div>
            <div className="w-full h-0.5 bg-[#f54a8d] rounded-xs" />
            <div className="w-full h-0.5 bg-slate-200 rounded-xs" />
            <div className="w-2/3 h-0.5 bg-slate-200 rounded-xs" />
            <div className="w-1.5 h-1.5 bg-pink-400 rotate-45 rounded-2xs" />
          </div>
        </div>
      );

    case 'callout-warning':
    case 'callout-info':
    case 'callout-tip':
    case 'callout':
      return (
        <div className={`w-28 h-20 bg-pink-50/50 border border-pink-200 rounded-lg p-2.5 flex items-center gap-2 shadow-2xs shrink-0 ${className}`}>
          {/* Exclamation badge */}
          <div className="w-8 h-8 rounded-lg bg-[#f54a8d] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="text-sm font-black">!</span>
          </div>
          {/* Lines */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="w-full h-1.5 bg-slate-300 rounded-xs" />
            <div className="w-5/6 h-1.5 bg-slate-200 rounded-xs" />
            <div className="w-2/3 h-1.5 bg-slate-200 rounded-xs" />
          </div>
        </div>
      );

    case 'timeline-vertical':
    case 'timeline':
      return (
        <div className={`w-28 h-20 bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col justify-center gap-2 shadow-2xs shrink-0 ${className}`}>
          {/* Node line with 4 points */}
          <div className="relative flex items-center justify-between px-1">
            <div className="absolute left-2 right-2 h-0.5 bg-pink-300 top-1/2 -translate-y-1/2" />
            <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-[#f54a8d] ring-2 ring-white" />
            <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-[#f54a8d] ring-2 ring-white" />
            <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-[#f54a8d] ring-2 ring-white" />
            <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-[#f54a8d] ring-2 ring-white" />
          </div>
          {/* Small pills below */}
          <div className="flex items-center justify-between px-0.5 gap-1">
            <div className="w-5 h-2 bg-slate-200 rounded-2xs" />
            <div className="w-5 h-2 bg-slate-200 rounded-2xs" />
            <div className="w-5 h-2 bg-slate-200 rounded-2xs" />
            <div className="w-5 h-2 bg-slate-200 rounded-2xs" />
          </div>
        </div>
      );

    case 'code-with-explanation':
    case 'code':
      return (
        <div className={`w-28 h-20 bg-[#0B1B3D] rounded-lg p-2 flex flex-col justify-between shadow-2xs text-white shrink-0 ${className}`}>
          <div className="flex items-center gap-1 border-b border-slate-700 pb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[8px] text-slate-400 ml-1 font-mono">code.js</span>
          </div>
          <div className="flex flex-col gap-1 font-mono text-[8px] text-pink-300">
            <div className="w-full h-1 bg-slate-600 rounded-xs" />
            <div className="w-4/5 h-1 bg-pink-400/80 rounded-xs" />
            <div className="w-3/5 h-1 bg-cyan-400/80 rounded-xs" />
          </div>
        </div>
      );

    case 'diagram-flowchart':
    case 'diagram':
      return (
        <div className={`w-28 h-20 bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center justify-center gap-1.5 shadow-2xs shrink-0 ${className}`}>
          <div className="w-6 h-10 bg-white border border-[#f54a8d] rounded flex items-center justify-center text-[8px] text-[#f54a8d] font-bold">
            A
          </div>
          <span className="text-slate-400 text-xs font-bold">➔</span>
          <div className="w-6 h-10 bg-white border border-[#0B1B3D] rounded flex items-center justify-center text-[8px] text-[#0B1B3D] font-bold">
            B
          </div>
        </div>
      );

    case 'three-column':
      return (
        <div className={`w-28 h-20 bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center justify-center gap-1 shadow-2xs shrink-0 ${className}`}>
          <div className="flex-1 h-full bg-white border border-slate-200 rounded p-1 flex flex-col gap-1">
            <div className="w-full h-1 bg-[#f54a8d] rounded-xs" />
            <div className="w-full h-0.5 bg-slate-200 rounded-xs" />
          </div>
          <div className="flex-1 h-full bg-white border border-slate-200 rounded p-1 flex flex-col gap-1">
            <div className="w-full h-1 bg-[#f54a8d] rounded-xs" />
            <div className="w-full h-0.5 bg-slate-200 rounded-xs" />
          </div>
          <div className="flex-1 h-full bg-white border border-slate-200 rounded p-1 flex flex-col gap-1">
            <div className="w-full h-1 bg-[#f54a8d] rounded-xs" />
            <div className="w-full h-0.5 bg-slate-200 rounded-xs" />
          </div>
        </div>
      );

    default:
      return (
        <div className={`w-28 h-20 bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-center text-slate-400 shadow-2xs shrink-0 ${className}`}>
          <LayoutIcon wireframeType={wireframeType} />
        </div>
      );
  }
}

function LayoutIcon({ wireframeType }: { wireframeType: string }) {
  if (wireframeType.includes('column')) return <Columns size={20} className="text-[#f54a8d]" />;
  if (wireframeType.includes('table')) return <Table size={20} className="text-[#f54a8d]" />;
  if (wireframeType.includes('card')) return <Grid size={20} className="text-[#f54a8d]" />;
  if (wireframeType.includes('callout')) return <AlertCircle size={20} className="text-[#f54a8d]" />;
  if (wireframeType.includes('timeline')) return <GitCommit size={20} className="text-[#f54a8d]" />;
  if (wireframeType.includes('code')) return <Code size={20} className="text-[#f54a8d]" />;
  if (wireframeType.includes('quote')) return <Quote size={20} className="text-[#f54a8d]" />;
  return <ListChecks size={20} className="text-[#f54a8d]" />;
}
