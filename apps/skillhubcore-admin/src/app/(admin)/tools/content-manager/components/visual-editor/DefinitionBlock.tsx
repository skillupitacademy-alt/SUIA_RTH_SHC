'use client';

import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

interface DefinitionBlockProps {
  value: {
    term?: string;
    definition?: string;
    memoryHook?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function DefinitionBlock({ value, onEdit, onDelete }: DefinitionBlockProps) {
  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-650 rounded-md font-mono">
          🔑 definitionBlock
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
            className="p-1.5 rounded-lg bg-red-50 text-red-655 hover:bg-red-105 transition-colors"
            title="Delete component from page mapping"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-black text-slate-800 tracking-tight">{value.term || 'No term defined'}</h4>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-pink-100 text-pink-700 rounded">GLOSSARY</span>
        </div>
        <p className="text-xs text-slate-650 leading-relaxed">{value.definition || 'No definition text'}</p>
        {value.memoryHook && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-800 italic flex gap-1">
            <span>💡</span>
            <span>{value.memoryHook}</span>
          </div>
        )}
      </div>
    </div>
  );
}
