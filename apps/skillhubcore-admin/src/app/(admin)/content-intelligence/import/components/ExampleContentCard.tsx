'use client';

import React from 'react';
import { Info, FileText } from 'lucide-react';

interface ExampleContentCardProps {
  onLoadExample: () => void;
}

export function ExampleContentCard({ onLoadExample }: ExampleContentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-sky-600">
        <Info size={16} />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Example Content
        </h3>
      </div>

      <p className="text-xs text-slate-500 mb-3.5">
        Not sure how to format? Try our example:
      </p>

      <button
        type="button"
        onClick={onLoadExample}
        className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
      >
        <FileText size={14} className="text-slate-500" />
        <span>Load Example Content</span>
      </button>
    </div>
  );
}
