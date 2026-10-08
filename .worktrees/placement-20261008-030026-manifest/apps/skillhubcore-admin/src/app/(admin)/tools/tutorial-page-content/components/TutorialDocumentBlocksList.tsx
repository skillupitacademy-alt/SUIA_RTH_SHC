/**
 * Tutorial Document Blocks List Component
 * 
 * Displays the ordered list of block instances in the tutorial document.
 * Provides Load and Remove actions for each block.
 */

import { FileCode, Trash2, ListOrdered } from 'lucide-react';
import type { BlockInstance } from '../document/documentTransformation';

interface TutorialDocumentBlocksListProps {
  documentBlocks: BlockInstance[];
  onLoadBlock: (block: BlockInstance, index: number) => void;
  onRemoveBlock: (blockId: string) => void;
}

export function TutorialDocumentBlocksList({
  documentBlocks,
  onLoadBlock,
  onRemoveBlock,
}: TutorialDocumentBlocksListProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ListOrdered size={16} className="text-[#e11d48]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-outfit">
            Tutorial Document Blocks
          </h3>
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
          documentBlocks.map((block, index) => (
            <div
              key={block.id}
              className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-pink-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-mono font-bold text-slate-600 shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
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

              <div className="flex items-center gap-1 shrink-0 ml-2">
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
          ))
        )}
      </div>
    </div>
  );
}
