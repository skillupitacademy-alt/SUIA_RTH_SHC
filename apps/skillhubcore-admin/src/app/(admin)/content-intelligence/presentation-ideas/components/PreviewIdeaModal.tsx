'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import type { PresentationIdea } from '@quiz/types';
import { WireframeIllustrations } from './WireframeIllustrations';

interface PreviewIdeaModalProps {
  idea: PresentationIdea | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSelect: (id: string) => void;
}

export function PreviewIdeaModal({
  idea,
  isOpen,
  onClose,
  onToggleSelect,
}: PreviewIdeaModalProps) {
  if (!isOpen || !idea) return null;

  const isHigh = idea.impact === 'high';
  const isMedium = idea.impact === 'medium';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isHigh
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : isMedium
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-purple-50 text-purple-600 border border-purple-200'
            }`}
          >
            {idea.impact} Impact
          </span>
          <span className="text-xs text-slate-400 font-mono">ID: {idea.id}</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-2">{idea.title}</h3>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">{idea.description}</p>

        {/* Wireframe Centered */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center mb-6">
          <WireframeIllustrations wireframeType={idea.wireframeType} className="scale-125 my-2" />
          <span className="text-[11px] text-slate-400 mt-4 font-mono">
            Layout Pattern: {idea.wireframeType}
          </span>
        </div>

        {/* Metadata Details */}
        <div className="space-y-3 mb-6 text-xs bg-slate-50/50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-400 font-medium">Applies to:</span>
            <span className="text-slate-800 font-semibold text-right">
              {idea.appliesToSection || 'Document Section'}
            </span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-400 font-medium">Target Block:</span>
            <span className="text-slate-800 font-mono font-semibold text-right bg-white px-2 py-0.5 rounded border border-slate-200">
              {idea.targetBlockType}
            </span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-400 font-medium">Reason:</span>
            <span className="text-slate-700 text-right max-w-xs">{idea.reason}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onToggleSelect(idea.id);
              onClose();
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              idea.isSelected
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-[#f54a8d] text-white hover:bg-[#e03a7a]'
            }`}
          >
            {idea.isSelected ? (
              <>
                <Check size={14} />
                <span>Selected</span>
              </>
            ) : (
              <span>Select Idea</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
