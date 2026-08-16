'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { PresentationIdea } from '@quiz/types';
import { WireframeIllustrations } from '../../presentation-ideas/components/WireframeIllustrations';

export interface ReviewModification {
  customTitle?: string;
  customNote?: string;
  configOverrides?: Record<string, any>;
}

interface ModifySuggestionModalProps {
  idea: PresentationIdea | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveModification: (id: string, modification: ReviewModification) => void;
  existingModification?: ReviewModification;
}

export function ModifySuggestionModal({
  idea,
  isOpen,
  onClose,
  onSaveModification,
  existingModification,
}: ModifySuggestionModalProps) {
  const [customTitle, setCustomTitle] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [ratio, setRatio] = useState<string>('50-50');
  const [columns, setColumns] = useState<number>(3);
  const [variant, setVariant] = useState<string>('info');
  const [gap, setGap] = useState<string>('normal');

  useEffect(() => {
    if (idea) {
      setCustomTitle(existingModification?.customTitle || idea.title);
      setCustomNote(existingModification?.customNote || idea.reason);
      const cfg = idea.presentationConfig as any;
      if (cfg?.ratio) setRatio(cfg.ratio);
      if (cfg?.columns) setColumns(cfg.columns);
      if (cfg?.variant) setVariant(cfg.variant);
      if (cfg?.gap) setGap(cfg.gap);
    }
  }, [idea, existingModification]);

  if (!isOpen || !idea) return null;

  const isTwoColumn = idea.targetBlockType === 'two-column';
  const isCardGrid = idea.targetBlockType === 'card-grid';
  const isCallout = idea.targetBlockType === 'callout';

  const handleSave = () => {
    const configOverrides: Record<string, any> = {};
    if (isTwoColumn) {
      configOverrides.ratio = ratio;
      configOverrides.gap = gap;
    } else if (isCardGrid) {
      configOverrides.columns = columns;
      configOverrides.gap = gap;
    } else if (isCallout) {
      configOverrides.variant = variant;
    }

    onSaveModification(idea.id, {
      customTitle: customTitle.trim() || idea.title,
      customNote: customNote.trim() || idea.reason,
      configOverrides,
    });
    onClose();
  };

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
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Modify Suggestion
          </span>
          <span className="text-xs text-slate-400 font-mono">ID: {idea.id}</span>
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Customize Presentation Block</h3>
        <p className="text-xs text-slate-500 mb-5">
          Tweak layout parameters and annotations before generating the composer block.
        </p>

        {/* Wireframe Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center gap-4 mb-5">
          <WireframeIllustrations wireframeType={idea.wireframeType} />
          <div className="text-xs">
            <span className="font-bold text-slate-800 block">{idea.title}</span>
            <span className="text-slate-500 text-[11px]">Target: {idea.targetBlockType}</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {/* Custom Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Block Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#f54a8d] outline-none"
              placeholder="Enter title..."
            />
          </div>

          {/* Conditional Layout Controls */}
          {isTwoColumn && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Column Ratio</label>
                <select
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#f54a8d] outline-none"
                >
                  <option value="50-50">50% / 50% (Equal)</option>
                  <option value="60-40">60% / 40% (Main left)</option>
                  <option value="40-60">40% / 60% (Main right)</option>
                  <option value="70-30">70% / 30%</option>
                  <option value="30-70">30% / 70%</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gap Spacing</label>
                <select
                  value={gap}
                  onChange={(e) => setGap(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#f54a8d] outline-none"
                >
                  <option value="tight">Tight</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relaxed</option>
                  <option value="loose">Loose</option>
                </select>
              </div>
            </div>
          )}

          {isCardGrid && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grid Columns</label>
                <select
                  value={columns}
                  onChange={(e) => setColumns(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#f54a8d] outline-none"
                >
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gap Spacing</label>
                <select
                  value={gap}
                  onChange={(e) => setGap(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#f54a8d] outline-none"
                >
                  <option value="tight">Tight</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relaxed</option>
                </select>
              </div>
            </div>
          )}

          {isCallout && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Callout Variant</label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#f54a8d] outline-none"
              >
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="tip">Tip (Pink)</option>
                <option value="danger">Danger (Red)</option>
                <option value="success">Success (Green)</option>
              </select>
            </div>
          )}

          {/* Author Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Modification Note</label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#f54a8d] outline-none"
              placeholder="e.g., Use 3 concept cards layout for technical characteristics..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Save Modifications</span>
          </button>
        </div>
      </div>
    </div>
  );
}
