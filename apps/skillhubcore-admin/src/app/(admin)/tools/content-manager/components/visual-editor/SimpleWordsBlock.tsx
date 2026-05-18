'use client';

import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

interface SimpleWordsBlockProps {
  value: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function SimpleWordsBlock({ value, onEdit, onDelete }: SimpleWordsBlockProps) {
  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-650 rounded-md font-mono">
          🔑 simpleWords
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
      <div className="bg-gradient-to-r from-pink-50 to-orange-50 border-l-4 border-l-pink-500 p-4 rounded-xl italic text-slate-750 text-sm">
        &ldquo;{value}&rdquo;
      </div>
    </div>
  );
}
