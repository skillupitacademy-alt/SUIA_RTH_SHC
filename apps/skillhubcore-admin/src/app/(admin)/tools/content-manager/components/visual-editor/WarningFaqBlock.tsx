'use client';

import React from 'react';
import { Edit3, Trash2, AlertTriangle } from 'lucide-react';

interface WarningFaqBlockProps {
  value: {
    warningTitle?: string;
    warningDescription?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function WarningFaqBlock({ value, onEdit, onDelete }: WarningFaqBlockProps) {
  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-655 rounded-md font-mono">
          🔑 warningFaq
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
      <div className="bg-red-50/50 border border-red-205 p-4 rounded-xl space-y-2">
        <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-red-500" />
          {value.warningTitle || 'Anti-pattern Warning'}
        </h4>
        <p className="text-xs text-red-900/80 leading-relaxed font-semibold">{value.warningDescription || 'Warning FAQ description...'}</p>
      </div>
    </div>
  );
}
