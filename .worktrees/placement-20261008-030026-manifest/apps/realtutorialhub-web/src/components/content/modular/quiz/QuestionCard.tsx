'use client';

import React from 'react';
import { Circle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface QuestionCardProps {
  data: {
    questionText: string;
    options: { id: string; text: string }[];
    type: 'single-choice' | 'multiple-choice';
    explanation?: string;
  };
  themeColor: string;
}

export function QuestionCard({ data, themeColor }: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!data) return null;

  const toggleOption = (id: string) => {
    if (submitted) return;
    if (data.type === 'single-choice') {
      setSelected([id]);
    } else {
      setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-400 uppercase tracking-tighter">
            {data.type.replace('-', ' ')}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white leading-tight">
          {data.questionText}
        </h3>
      </div>

      <div className="space-y-3 mb-8">
        {data.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 group ${
                isSelected 
                  ? 'bg-slate-800 border-slate-600 shadow-lg translate-x-1' 
                  : 'bg-slate-950/30 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="shrink-0">
                {isSelected ? (
                  <CheckCircle2 size={20} style={{ color: themeColor }} />
                ) : (
                  <Circle size={20} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                )}
              </div>
              <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={12} />
          Choose the best answer
        </div>
        <button 
          onClick={() => setSubmitted(true)}
          className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
          disabled={selected.length === 0 || submitted}
        >
          {submitted ? 'Verified' : 'Check Answer'}
        </button>
      </div>
    </div>
  );
}
