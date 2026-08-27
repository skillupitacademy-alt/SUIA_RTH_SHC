import React from 'react';
import type { IThreeColumnBlock, BlockComponentProps, TutorialBlock } from '../types';
import { TutorialBlockRenderer } from '../TutorialBlockRenderer';

export function ThreeColumnBlock({
  block,
  depth = 0,
  theme,
  className = '',
  renderChild,
}: BlockComponentProps<IThreeColumnBlock>) {
  const columns = Array.isArray(block.content?.columns) ? block.content.columns : [];

  const renderBlockItem = (childBlock: TutorialBlock, cIdx: number, bIdx: number) => {
    // Phase 2.5: Always use renderChild (provided by parent renderer with runtimeContext)
    if (!renderChild) {
      throw new Error('ThreeColumnBlock requires renderChild prop for runtime context propagation');
    }
    return (
      <React.Fragment key={childBlock.id || `c${cIdx}-b${bIdx}`}>
        {renderChild(childBlock, depth + 1)}
      </React.Fragment>
    );
  };

  return (
    <div
      id={block.id}
      className={`my-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start ${className}`}
    >
      {columns.map((col, cIdx) => {
        const blocks = Array.isArray(col?.blocks) ? col.blocks : [];
        return (
          <div key={`col-${cIdx}`} className="flex flex-col space-y-2 min-w-0">
            {blocks.map((childBlock, bIdx) => renderBlockItem(childBlock, cIdx, bIdx))}
          </div>
        );
      })}
    </div>
  );
}
