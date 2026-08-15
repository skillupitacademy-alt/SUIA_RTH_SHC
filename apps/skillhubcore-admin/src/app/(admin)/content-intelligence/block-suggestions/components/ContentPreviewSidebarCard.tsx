'use client';

import React, { useState } from 'react';
import { sampleRawMarkdownText } from './mockBlockSuggestionsData';

interface ContentPreviewSidebarCardProps {
  rawText?: string;
}

export function ContentPreviewSidebarCard({
  rawText = sampleRawMarkdownText,
}: ContentPreviewSidebarCardProps) {
  const [viewMode, setViewMode] = useState<'raw' | 'formatted'>('raw');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900">
          Content Preview ({viewMode === 'raw' ? 'Raw' : 'Formatted'})
        </h3>

        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          <button
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-[#f54a8d] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Raw
          </button>
          <button
            onClick={() => setViewMode('formatted')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              viewMode === 'formatted'
                ? 'bg-[#f54a8d] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Formatted
          </button>
        </div>
      </div>

      {/* Content View */}
      <div className="p-4 max-h-[380px] overflow-y-auto font-mono text-xs text-slate-700 leading-relaxed bg-slate-50/40 divide-y divide-slate-100/50">
        {viewMode === 'raw' ? (
          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
            {rawText}
          </pre>
        ) : (
          <div className="font-sans text-xs text-slate-800 space-y-3">
            <h1 className="text-base font-bold text-[#0B1B3D]">JavaScript</h1>
            <p className="text-slate-600">
              JavaScript is a programming language that makes websites interactive.
            </p>
            <h2 className="text-sm font-semibold text-slate-900">
              1. What does it actually do?
            </h2>
            <p className="text-slate-600">
              When you click a button and a menu drops down...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
