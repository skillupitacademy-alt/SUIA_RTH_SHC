import React from 'react';
import type { ITimelineBlock, BlockComponentProps, TutorialBlock } from '../types';
import { TutorialBlockRenderer } from '../TutorialBlockRenderer';

export function TimelineBlock({
  block,
  depth = 0,
  theme,
  className = '',
  renderChild,
}: BlockComponentProps<ITimelineBlock>) {
  const items = Array.isArray(block.content?.items) ? block.content.items : [];
  const orientation = block.content?.orientation || 'vertical';

  const renderBlockItem = (childBlock: TutorialBlock, idx: number, bIdx: number) => {
    // Phase 2.5: Always use renderChild (provided by parent renderer with runtimeContext)
    if (!renderChild) {
      throw new Error('TimelineBlock requires renderChild prop for runtime context propagation');
    }
    return (
      <React.Fragment key={childBlock.id || `item-${idx}-b${bIdx}`}>
        {renderChild(childBlock, depth + 1)}
      </React.Fragment>
    );
  };

  if (orientation === 'horizontal') {
    return (
      <div
        id={block.id}
        className={`my-6 overflow-x-auto pb-4 ${className}`}
      >
        <div className="flex items-start gap-6 min-w-max">
          {items.map((item, idx) => {
            const itemBlocks = Array.isArray(item?.blocks) ? item.blocks : [];
            return (
              <div key={item.id || `timeline-${idx}`} className="flex flex-col w-64 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-950" />
                  {item.date && (
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.date}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {item.description}
                  </p>
                )}
                {itemBlocks.length > 0 && (
                  <div className="flex flex-col space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {itemBlocks.map((childBlock, bIdx) => renderBlockItem(childBlock, idx, bIdx))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default Vertical
  return (
    <div
      id={block.id}
      className={`my-6 pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-6 ${className}`}
    >
      {items.map((item, idx) => {
        const itemBlocks = Array.isArray(item?.blocks) ? item.blocks : [];
        return (
          <div key={item.id || `timeline-${idx}`} className="relative pl-4">
            <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-950" />
            
            <div className="flex flex-col">
              {item.date && (
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">
                  {item.date}
                </span>
              )}
              <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                {item.title}
              </h4>
              {item.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {item.description}
                </p>
              )}
              {itemBlocks.length > 0 && (
                <div className="flex flex-col space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  {itemBlocks.map((childBlock, bIdx) => renderBlockItem(childBlock, idx, bIdx))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
