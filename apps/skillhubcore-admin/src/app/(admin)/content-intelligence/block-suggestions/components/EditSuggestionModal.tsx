'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { SuggestedBlockItem } from './mockBlockSuggestionsData';

interface EditSuggestionModalProps {
  block: SuggestedBlockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBlock: SuggestedBlockItem) => void;
}

export function EditSuggestionModal({
  block,
  isOpen,
  onClose,
  onSave,
}: EditSuggestionModalProps) {
  const [content, setContent] = useState<string>('');
  const [blockName, setBlockName] = useState<string>('');

  useEffect(() => {
    if (block) {
      setContent(block.contentPreview || (block.pills ? block.pills.join(', ') : ''));
      setBlockName(block.blockType.name);
    }
  }, [block]);

  if (!isOpen || !block) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...block,
      contentPreview: content,
      blockType: {
        ...block.blockType,
        name: blockName,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Edit Block Suggestion #{block.index}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Block Type
            </label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Content Preview / Text
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 font-normal leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detection Reason
            </label>
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {block.reason}
            </p>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#f54a8d] hover:bg-[#e03a7a] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
