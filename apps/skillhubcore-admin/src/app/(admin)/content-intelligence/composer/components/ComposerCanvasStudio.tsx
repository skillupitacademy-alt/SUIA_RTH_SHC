'use client';

import React, { useState } from 'react';
import {
  Undo,
  Redo,
  Monitor,
  Tablet,
  Smartphone,
  ListTree,
  Eye,
  Plus,
  GripVertical,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { WireframeIllustrations } from '../../presentation-ideas/components/WireframeIllustrations';

interface ComposerCanvasStudioProps {
  blocks: any[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, content: any) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onAddFirstComponent: () => void;
  undoDisabled?: boolean;
  redoDisabled?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  lastSavedText?: string;
  isSaving?: boolean;
}

export function ComposerCanvasStudio({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onAddFirstComponent,
  undoDisabled = false,
  redoDisabled = false,
  onUndo,
  onRedo,
  lastSavedText = 'Just now',
  isSaving = false,
}: ComposerCanvasStudioProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoom, setZoom] = useState<string>('100%');
  const [showOutline, setShowOutline] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  // Stats calculation
  const totalComponents = blocks.length;
  const totalWords = blocks.reduce((sum, b) => {
    const text = typeof b.content?.text === 'string' ? b.content.text : '';
    return sum + (text ? text.split(/\s+/).filter(Boolean).length : 0);
  }, 0);
  const totalChars = blocks.reduce((sum, b) => {
    const text = typeof b.content?.text === 'string' ? b.content.text : '';
    return sum + text.length;
  }, 0);
  const readTimeMin = Math.max(1, Math.ceil(totalWords / 150));

  const viewportWidthClass =
    viewport === 'mobile'
      ? 'max-w-sm'
      : viewport === 'tablet'
      ? 'max-w-2xl'
      : 'max-w-full';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full overflow-hidden">
      {/* Studio Toolbar matching page-3.png and page-4.png */}
      <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        {/* Left: Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={undoDisabled}
            title="Undo"
            className="w-7 h-7 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30"
          >
            <Undo size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={redoDisabled}
            title="Redo"
            className="w-7 h-7 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30"
          >
            <Redo size={14} />
          </button>
        </div>

        {/* Center: Viewport Switcher */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-2xs">
          <button
            onClick={() => setViewport('desktop')}
            title="Desktop View"
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-pink-50 text-[#f54a8d] font-bold border border-pink-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor size={14} />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            onClick={() => setViewport('tablet')}
            title="Tablet View"
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-pink-50 text-[#f54a8d] font-bold border border-pink-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tablet size={14} />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            onClick={() => setViewport('mobile')}
            title="Mobile View"
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-pink-50 text-[#f54a8d] font-bold border border-pink-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Zoom & Outline & View Mode */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <select
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="75%">75%</option>
            <option value="100%">100%</option>
            <option value="125%">125%</option>
          </select>

          {/* Outline Toggle */}
          <button
            onClick={() => setShowOutline(!showOutline)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showOutline
                ? 'bg-pink-50 text-[#f54a8d] border-pink-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ListTree size={13} />
            <span className="hidden sm:inline">Outline</span>
          </button>

          {/* Canvas View Pill */}
          <span className="px-3 py-1 rounded-lg bg-pink-50 text-[#f54a8d] font-bold text-xs border border-pink-200">
            Canvas View
          </span>
        </div>
      </div>

      {/* Center Canvas Studio Workspace */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-100/50 max-h-[calc(100vh-320px)] flex justify-center">
        <div className={`w-full ${viewportWidthClass} transition-all duration-200`}>
          {blocks.length === 0 ? (
            /* Empty Canvas State matching page-3.png */
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center my-8 shadow-sm">
              <div className="w-16 h-12 rounded-lg bg-pink-50 border-2 border-dashed border-pink-300 flex items-center justify-center text-[#f54a8d] mb-4">
                <Plus size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Start Building Your Content
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                Drag and drop components from the left panel or click the button below to add your first learning block.
              </p>
              <button
                onClick={onAddFirstComponent}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Add First Component</span>
              </button>
            </div>
          ) : (
            /* Populated Block List Canvas matching page-4.png */
            <div className="space-y-3">
              {blocks.map((block, idx) => {
                const isSelected = selectedBlockId === block.id;

                return (
                  <div
                    key={block.id || idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectBlock(block.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectBlock(block.id);
                      }
                    }}
                    className={`bg-white rounded-xl border p-4 transition-all relative group cursor-pointer ${
                      isSelected
                        ? 'border-[#f54a8d] ring-2 ring-pink-100 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Top Row: Drag Handle + Block Type + Action Controls */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 hover:text-slate-600 cursor-grab">
                          <GripVertical size={14} />
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/60">
                          {block.type}
                          {block.type === 'heading' && ` H${block.content?.level || 2}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBlock(block.id);
                          }}
                          title="Edit Properties"
                          className="w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateBlock(block.id);
                          }}
                          title="Duplicate Block"
                          className="w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBlock(block.id);
                          }}
                          title="Delete Block"
                          className="w-6 h-6 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Block Live Visual Presentation */}
                    <div className="text-xs text-slate-800">
                      {block.type === 'heading' && (
                        <div
                          className={`font-bold tracking-tight text-slate-900 ${
                            block.content?.level === 1
                              ? 'text-lg font-black'
                              : block.content?.level === 2
                              ? 'text-base'
                              : 'text-sm'
                          }`}
                        >
                          {block.content?.text || 'Untitled Heading'}
                        </div>
                      )}

                      {block.type === 'paragraph' && (
                        <p className="text-slate-600 leading-relaxed">
                          {block.content?.text || 'Empty paragraph...'}
                        </p>
                      )}

                      {block.type === 'list' && (
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                          {Array.isArray(block.content?.items) ? (
                            block.content.items.map((item: any, i: number) => (
                              <li key={i}>{typeof item === 'string' ? item : item?.text}</li>
                            ))
                          ) : (
                            <li>List item...</li>
                          )}
                        </ul>
                      )}

                      {block.type === 'code' && (
                        <div className="bg-[#0B1B3D] text-pink-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                          <code>{block.content?.code || '// Code snippet'}</code>
                        </div>
                      )}

                      {block.type === 'callout' && (
                        <div className="bg-pink-50/70 border border-pink-200 rounded-lg p-3 text-slate-800 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#f54a8d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            !
                          </span>
                          <p className="text-xs leading-snug">{block.content?.text}</p>
                        </div>
                      )}

                      {block.type === 'quote' && (
                        <blockquote className="border-l-4 border-[#f54a8d] pl-3 italic text-slate-700">
                          &ldquo;{block.content?.text}&rdquo;
                          {block.content?.author && (
                            <span className="block text-[10px] not-italic text-slate-400 mt-1">
                              &mdash; {block.content.author}
                            </span>
                          )}
                        </blockquote>
                      )}

                      {block.type === 'card-grid' && (
                        <div className="grid grid-cols-3 gap-2 my-1">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-slate-50 border border-slate-200 rounded p-2 text-center text-[10px] font-semibold text-slate-700">
                              Card {n}
                            </div>
                          ))}
                        </div>
                      )}

                      {block.type === 'two-column' && (
                        <div className="grid grid-cols-2 gap-3 my-1">
                          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-slate-600 text-[10px]">
                            Column 1
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-slate-600 text-[10px]">
                            Column 2
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Footer matching page-4.png */}
      <div className="p-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <span>{totalComponents} components</span>
          <span>•</span>
          <span>{totalWords} words</span>
          <span>•</span>
          <span>{totalChars} characters</span>
          <span>•</span>
          <span>~{readTimeMin} min read</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Last saved: {lastSavedText}</span>
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 size={13} />
            <span>{isSaving ? 'Saving...' : 'All changes saved'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
