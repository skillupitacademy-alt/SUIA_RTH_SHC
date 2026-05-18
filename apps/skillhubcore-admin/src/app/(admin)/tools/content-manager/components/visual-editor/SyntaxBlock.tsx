'use client';

import React from 'react';
import { Edit3, Trash2, Layers } from 'lucide-react';

interface SyntaxBlockProps {
  value: {
    title?: string;
    explanation?: string;
    code?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function SyntaxBlock({ value, onEdit, onDelete }: SyntaxBlockProps) {
  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-655 rounded-md font-mono">
          🔑 syntaxBlock
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-105 transition-colors"
            title="Edit this component card"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-red-50 text-red-650 hover:bg-red-105 transition-colors"
            title="Delete component from page mapping"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
          <Layers size={14} className="text-indigo-500" />
          {value.title || 'Syntax Structure'}
        </h4>
        {value.explanation && <p className="text-xs text-slate-650 leading-relaxed">{value.explanation}</p>}
        {value.code && (
          <pre className="overflow-auto bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-200 border border-slate-800 max-h-[160px] custom-scrollbar shadow-inner">
            <code>{value.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
