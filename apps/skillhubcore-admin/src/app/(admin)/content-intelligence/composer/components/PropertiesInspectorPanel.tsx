'use client';

import React from 'react';
import { Sliders, Trash2, Copy, MoveUp, MoveDown } from 'lucide-react';

interface BlockContent {
  level?: number;
  text?: string;
  variant?: string;
  language?: string;
  code?: string;
  ratio?: string;
  columns?: number;
  author?: string;
  items?: Array<string | { text: string }>;
}

interface Block {
  id: string;
  type: string;
  content?: BlockContent;
}

interface PropertiesInspectorPanelProps {
  selectedBlock: Block | null;
  onUpdateBlock: (blockId: string, updatedContent: BlockContent) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlock?: (blockId: string, direction: 'up' | 'down') => void;
}

export function PropertiesInspectorPanel({
  selectedBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
}: PropertiesInspectorPanelProps) {
  if (!selectedBlock) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Sliders size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">No Component Selected</h3>
        <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
          Select a component from the canvas to edit its properties, layout, and content.
        </p>
      </div>
    );
  }

  const { id, type, content = {} } = selectedBlock;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col h-full overflow-hidden">
      {/* Inspector Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Properties Inspector
          </span>
          <h3 className="text-xs font-bold text-slate-900 capitalize">{type} Component</h3>
        </div>

        <div className="flex items-center gap-1">
          {onMoveBlock && (
            <>
              <button
                onClick={() => onMoveBlock(id, 'up')}
                title="Move Up"
                type="button"
                className="w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <MoveUp size={12} />
              </button>
              <button
                onClick={() => onMoveBlock(id, 'down')}
                title="Move Down"
                type="button"
                className="w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <MoveDown size={12} />
              </button>
            </>
          )}
          <button
            onClick={() => onDuplicateBlock(id)}
            title="Duplicate Block"
            type="button"
            className="w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => onDeleteBlock(id)}
            title="Delete Block"
            type="button"
            className="w-6 h-6 rounded text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Dynamic Property Form */}
      <div className="space-y-4 overflow-y-auto flex-1 max-h-[calc(100vh-320px)] pr-1 text-xs">
        {/* HEADING PROPERTIES */}
        {type === 'heading' && (
          <>
            <div>
              <label htmlFor="headingLevel" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Heading Level
              </label>
              <select
                id="headingLevel"
                value={content.level || 2}
                onChange={(e) => onUpdateBlock(id, { ...content, level: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#f54a8d] outline-none"
              >
                <option value={1}>H1 - Main Page Title</option>
                <option value={2}>H2 - Major Section</option>
                <option value={3}>H3 - Subsection</option>
                <option value={4}>H4 - Deep Section</option>
              </select>
            </div>

            <div>
              <label htmlFor="headingText" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Heading Text
              </label>
              <input
                id="headingText"
                type="text"
                value={content.text || ''}
                onChange={(e) => onUpdateBlock(id, { ...content, text: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#f54a8d] outline-none"
              />
            </div>
          </>
        )}

        {/* PARAGRAPH PROPERTIES */}
        {type === 'paragraph' && (
          <div>
            <label htmlFor="paragraphContent" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Paragraph Content (Markdown)
            </label>
            <textarea
              id="paragraphContent"
              value={content.text || ''}
              onChange={(e) => onUpdateBlock(id, { ...content, text: e.target.value })}
              rows={6}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#f54a8d] outline-none font-mono text-[11px]"
            />
          </div>
        )}

        {/* CALLOUT PROPERTIES */}
        {type === 'callout' && (
          <>
            <div>
              <label htmlFor="calloutVariant" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Variant
              </label>
              <select
                id="calloutVariant"
                value={content.variant || 'info'}
                onChange={(e) => onUpdateBlock(id, { ...content, variant: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#f54a8d] outline-none"
              >
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="tip">Tip (Pink)</option>
                <option value="danger">Danger (Red)</option>
                <option value="success">Success (Green)</option>
              </select>
            </div>

            <div>
              <label htmlFor="calloutText" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Callout Text
              </label>
              <textarea
                id="calloutText"
                value={content.text || ''}
                onChange={(e) => onUpdateBlock(id, { ...content, text: e.target.value })}
                rows={4}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#f54a8d] outline-none"
              />
            </div>
          </>
        )}

        {/* CODE BLOCK PROPERTIES */}
        {type === 'code' && (
          <>
            <div>
              <label htmlFor="codeLanguage" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Programming Language
              </label>
              <input
                id="codeLanguage"
                type="text"
                value={content.language || 'javascript'}
                onChange={(e) => onUpdateBlock(id, { ...content, language: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#f54a8d] outline-none"
                placeholder="javascript, typescript, python, etc."
              />
            </div>

            <div>
              <label htmlFor="sourceCode" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Source Code
              </label>
              <textarea
                id="sourceCode"
                value={content.code || ''}
                onChange={(e) => onUpdateBlock(id, { ...content, code: e.target.value })}
                rows={8}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-[#0B1B3D] text-pink-300 font-mono text-[11px] focus:ring-1 focus:ring-[#f54a8d] outline-none"
              />
            </div>
          </>
        )}

        {/* TWO-COLUMN PROPERTIES */}
        {type === 'two-column' && (
          <>
            <div>
              <label htmlFor="columnRatio" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Column Ratio
              </label>
              <select
                id="columnRatio"
                value={content.ratio || '50-50'}
                onChange={(e) => onUpdateBlock(id, { ...content, ratio: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#f54a8d] outline-none"
              >
                <option value="50-50">50% / 50% (Equal)</option>
                <option value="60-40">60% / 40% (Primary Left)</option>
                <option value="40-60">40% / 60% (Primary Right)</option>
                <option value="70-30">70% / 30%</option>
              </select>
            </div>
          </>
        )}

        {/* CARD-GRID PROPERTIES */}
        {type === 'card-grid' && (
          <div>
            <label htmlFor="gridColumns" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Columns
            </label>
            <select
              id="gridColumns"
              value={content.columns || 3}
              onChange={(e) => onUpdateBlock(id, { ...content, columns: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-[#f54a8d] outline-none"
            >
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>
        )}

        {/* QUOTE PROPERTIES */}
        {type === 'quote' && (
          <>
            <div>
              <label htmlFor="quoteText" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Quote Text
              </label>
              <textarea
                id="quoteText"
                value={content.text || ''}
                onChange={(e) => onUpdateBlock(id, { ...content, text: e.target.value })}
                rows={4}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#f54a8d] outline-none"
              />
            </div>
            <div>
              <label htmlFor="quoteAuthor" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Author / Citation
              </label>
              <input
                id="quoteAuthor"
                type="text"
                value={content.author || ''}
                onChange={(e) => onUpdateBlock(id, { ...content, author: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#f54a8d] outline-none"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
