'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, FileText } from 'lucide-react';
import type { AnalysisSection } from '@quiz/types';

interface DetectedSectionOutlineProps {
  sections: AnalysisSection[];
}

export function DetectedSectionOutline({ sections }: DetectedSectionOutlineProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'sec-1': true,
    'sec-2': true,
    'sec-3': true,
    'sec-4': true,
    'sec-5': true,
    'sec-6': true,
    'sec-7': true,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderBadge = (level: AnalysisSection['level']) => {
    switch (level) {
      case 'h1':
        return (
          <span className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            H1
          </span>
        );
      case 'h2':
        return (
          <span className="w-7 h-7 rounded-md bg-pink-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            H2
          </span>
        );
      case 'h3':
        return (
          <span className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center shrink-0">
            H3
          </span>
        );
      case 'summary':
        return (
          <span className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText size={14} />
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">
          Detected Section Outline
        </h2>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Confidence
        </span>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedIds[section.id] ?? true;
          const hasSubsections = Boolean(section.subsections && section.subsections.length > 0);

          return (
            <div key={section.id} className="group">
              {/* Main Section Row */}
              <div
                onClick={() => toggleExpand(section.id)}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {renderBadge(section.level)}

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 leading-snug">
                      {section.title}
                    </div>
                    {isExpanded && section.snippet && (
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {section.snippet}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span>{section.confidence}%</span>
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>

              {/* Nested Subsections with Visual Pink Tree Branch */}
              {hasSubsections && isExpanded && (
                <div className="relative ml-6 pl-6 pt-2 pb-1 space-y-2.5 before:absolute before:left-3.5 before:top-0 before:bottom-3 before:w-0.5 before:bg-pink-300">
                  {section.subsections?.map((sub) => (
                    <div
                      key={sub.id}
                      className="relative flex items-start justify-between gap-3 p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors border border-slate-100/80 before:absolute before:-left-6 before:top-4 before:w-6 before:h-0.5 before:bg-pink-300 before:content-['']"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {renderBadge(sub.level)}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 leading-tight">
                            {sub.title}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {sub.snippet}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 shrink-0 pt-0.5">
                        <span>{sub.confidence}%</span>
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
