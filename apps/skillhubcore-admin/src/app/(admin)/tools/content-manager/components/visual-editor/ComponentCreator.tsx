'use client';

import React from 'react';
import { PlusCircle } from 'lucide-react';

interface ComponentCreatorProps {
  newComponentType: string;
  setNewComponentType: (type: string) => void;
  onAddComponent: () => void;
}

export function ComponentCreator({ newComponentType, setNewComponentType, onAddComponent }: ComponentCreatorProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <PlusCircle size={20} className="text-slate-400" />
        <div>
          <h4 className="text-sm font-bold text-slate-700">Visual Component Creator</h4>
          <p className="text-xs text-slate-400">Append new elements instantly to the current subtopic layout</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        <select
          value={newComponentType}
          onChange={(e) => setNewComponentType(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-xs bg-slate-50 focus:border-blue-500 focus:outline-none"
        >
          <option value="custom">Generic Feature Card</option>
          <option value="simpleWords">Simple Words Card</option>
          <option value="definitionBlock">Core Glossary Card</option>
          <option value="warningFaq">Trap & Gotchas Card</option>
          <option value="syntaxBlock">Syntax Code Mockup</option>
        </select>
        <button
          onClick={onAddComponent}
          className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow"
        >
          Create & Add Element
        </button>
      </div>
    </div>
  );
}
