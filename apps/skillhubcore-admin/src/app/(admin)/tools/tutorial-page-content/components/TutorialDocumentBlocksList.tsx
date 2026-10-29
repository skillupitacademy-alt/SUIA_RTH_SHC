/**
 * Tutorial Document Blocks List Component
 * 
 * Displays the ordered list of block instances in the tutorial document.
 * Provides Drag & Drop reordering, 1-click Move Up/Down, Load, and Remove actions.
 */

import React, { useState } from 'react';
import {
  FileCode,
  Trash2,
  ListOrdered,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { BlockInstance } from '../document/documentTransformation';

interface TutorialDocumentBlocksListProps {
  documentBlocks: BlockInstance[];
  onLoadBlock: (block: BlockInstance, index: number) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorderBlocks?: (sourceIndex: number, targetIndex: number) => void;
}

export function TutorialDocumentBlocksList({
  documentBlocks,
  onLoadBlock,
  onRemoveBlock,
  onReorderBlocks,
}: TutorialDocumentBlocksListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = (index: number) => {
    if (dropTargetIndex === index) {
      setDropTargetIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const sourceRaw = e.dataTransfer.getData('text/plain');
    const sourceIndex = draggedIndex ?? (sourceRaw ? Number(sourceRaw) : NaN);

    if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      onReorderBlocks?.(sourceIndex, targetIndex);
    }

    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ListOrdered size={16} className="text-[#e11d48]" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-outfit">
              Tutorial Document Blocks
            </h3>
            {documentBlocks.length > 1 && (
              <p className="text-[10px] text-slate-400 font-medium">
                Drag cards or use arrows to reorder
              </p>
            )}
          </div>
        </div>
        <span className="rounded-full bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[10px] font-bold text-pink-700 font-mono">
          {documentBlocks.length} {documentBlocks.length === 1 ? 'instance' : 'instances'}
        </span>
      </div>

      <div className="mt-3.5 space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {documentBlocks.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-400 font-medium">
            No blocks added yet. Click &ldquo;+ Add Block Instance&rdquo; above to append blocks.
          </p>
        ) : (
          documentBlocks.map((block, index) => {
            const isDragging = draggedIndex === index;
            const isDropTarget = dropTargetIndex === index && !isDragging;

            return (
              <div
                key={block.id}
                draggable={Boolean(onReorderBlocks)}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={() => handleDragLeave(index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center justify-between rounded-xl border bg-white p-2.5 shadow-sm transition-all duration-150 select-none ${
                  isDragging
                    ? 'opacity-40 border-dashed border-pink-400 scale-[0.98] bg-slate-50'
                    : isDropTarget
                    ? 'ring-2 ring-pink-500 border-pink-400 bg-pink-50/50 shadow-md scale-[1.01]'
                    : 'border-slate-200/80 hover:border-pink-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Drag Handle */}
                  {onReorderBlocks && (
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 hover:!text-pink-600 transition-colors shrink-0 p-0.5"
                      title="Drag to reorder"
                    >
                      <GripVertical size={16} />
                    </div>
                  )}

                  {/* Step Sequence Badge */}
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-mono font-bold text-slate-600 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Block Title & Version Badge */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {block.title}
                      </span>
                      <span className="rounded bg-pink-50 border border-pink-200 px-1.5 py-0.2 text-[9px] font-bold text-pink-700 font-mono shrink-0">
                        {block.versionCode}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      ID: {block.id}
                    </p>
                  </div>
                </div>

                {/* Actions: Move Up, Move Down, Load, Remove */}
                <div className="flex items-center gap-0.5 shrink-0 ml-2">
                  {onReorderBlocks && (
                    <>
                      <button
                        type="button"
                        onClick={() => onReorderBlocks(index, index - 1)}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderBlocks(index, index + 1)}
                        disabled={index === documentBlocks.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => onLoadBlock(block, index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Load into editor"
                  >
                    <FileCode size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveBlock(block.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove block instance"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
