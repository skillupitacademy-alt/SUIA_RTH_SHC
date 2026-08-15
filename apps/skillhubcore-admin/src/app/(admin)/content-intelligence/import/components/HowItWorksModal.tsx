'use client';

import React from 'react';
import { X, CheckCircle2, Sparkles, Layout, ArrowRight } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">How Raw Import Works</h3>
            <p className="text-xs text-slate-500">From unstructured human content to structured tutorial blocks</p>
          </div>
        </div>

        <div className="space-y-4 my-6">
          <div className="flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-pink-200">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Deterministic Parsing</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Headings, code blocks, lists, quotes, and prose are parsed into safe canonical JSON blocks.
              </div>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-pink-200">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Content Intelligence (Prompt 06)</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Analyzer scores concepts, section hierarchy, code complexity, and key takeaways.
              </div>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-pink-200">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Block & Layout Suggestions (Prompts 07-08)</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Suggests two-column layouts, callout cards, comparison tables, and concept grids.
              </div>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-pink-200">
              4
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Visual Composer Refinement (Prompt 10)</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Review, drag-and-drop, configure properties, and publish with complete human control.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Got it, let&apos;s start
          </button>
        </div>
      </div>
    </div>
  );
}
