'use client';

import React from 'react';
import { FileText, Upload, Link2, Sparkles, Check } from 'lucide-react';
import type { RawContentSourceType } from '@quiz/types';

interface InputMethodSelectorProps {
  selectedMethod: RawContentSourceType;
  onSelectMethod: (method: RawContentSourceType) => void;
}

export function InputMethodSelector({
  selectedMethod,
  onSelectMethod,
}: InputMethodSelectorProps) {
  const methods = [
    {
      id: 'markdown' as RawContentSourceType,
      title: 'Paste / Type Content',
      subtitle: 'Paste or type your content',
      icon: FileText,
      iconColor: 'text-pink-600',
      iconBg: 'bg-pink-50',
    },
    {
      id: 'file' as RawContentSourceType,
      title: 'Upload File',
      subtitle: 'Upload .docx, .txt, .md files',
      icon: Upload,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
    },
    {
      id: 'url' as RawContentSourceType,
      title: 'Import from URL',
      subtitle: 'Import content from a web URL',
      icon: Link2,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
    },
    {
      id: 'ai_generate' as RawContentSourceType,
      title: 'AI Generate',
      subtitle: 'Generate content with AI',
      icon: Sparkles,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
        Choose Input Method
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id || (selectedMethod === 'plain_text' && method.id === 'markdown');
          const Icon = method.icon;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id)}
              className={`relative flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-pink-500 bg-pink-50/40 shadow-sm ring-1 ring-pink-500/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Checkmark in top-right for selected card */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-sm">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}

              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-pink-100 text-pink-600' : `${method.iconBg} ${method.iconColor}`
                }`}
              >
                <Icon size={20} />
              </div>

              <div className="overflow-hidden pr-4">
                <div className="text-sm font-bold text-slate-900 leading-tight">
                  {method.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  {method.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
