'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

interface FallbackBlockProps {
  itemKey: string;
  value: any;
  onEdit: (key: string, data: any) => void;
  onDelete: () => void;
}

export function FallbackBlock({ itemKey, value, onEdit, onDelete }: FallbackBlockProps) {
  const isString = typeof value === 'string';
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);

  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-mono">
          🔑 {itemKey}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(itemKey, value)}
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

      <div className="space-y-2">
        {isString && <p className="text-xs text-slate-700 font-semibold leading-relaxed">{value}</p>}
        {isObject && (
          <div className="space-y-3">
            {value.title && <h4 className="text-sm font-bold text-slate-800">{value.title}</h4>}
            {value.description && <p className="text-xs text-slate-600">{value.description}</p>}
            {value.purpose && <p className="text-xs text-slate-500 italic font-mono">Purpose: {value.purpose}</p>}
            {value.code && (
              <pre className="overflow-auto bg-slate-950/80 rounded-xl p-3 font-mono text-[10px] text-slate-300 max-h-[150px]">
                <code>{value.code}</code>
              </pre>
            )}
          </div>
        )}
        {isArray && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {value.slice(0, 8).map((item: any, idx: number) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 relative group/item">
                <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => onEdit(`${itemKey}.${idx}`, item)}
                    className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    title="Edit this item"
                  >
                    <Edit3 size={10} />
                  </button>
                </div>
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  {item.title || item.name || `Item #${idx + 1}`}
                </h5>
                {item.description && <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>}
                {item.purpose && <p className="text-[10px] text-slate-450 italic mt-0.5">{item.purpose}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
