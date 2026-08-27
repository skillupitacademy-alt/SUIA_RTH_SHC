import React from 'react';
import type { ITwoColumnBlock, BlockComponentProps, TutorialBlock } from '../types';
import { TutorialBlockRenderer } from '../TutorialBlockRenderer';

export function TwoColumnBlock({
  block,
  depth = 0,
  theme,
  className = '',
  renderChild,
}: BlockComponentProps<ITwoColumnBlock>) {
  const leftBlocks = Array.isArray(block.content?.left?.blocks) ? block.content.left.blocks : [];
  const rightBlocks = Array.isArray(block.content?.right?.blocks) ? block.content.right.blocks : [];
  const ratio = block.presentation?.ratio || '50-50';

  // Responsive column ratio classes (12-column grid system)
  let leftColSpan = 'md:col-span-6';
  let rightColSpan = 'md:col-span-6';

  switch (ratio) {
    case '60-40':
      leftColSpan = 'md:col-span-7';
      rightColSpan = 'md:col-span-5';
      break;
    case '70-30':
      leftColSpan = 'md:col-span-8';
      rightColSpan = 'md:col-span-4';
      break;
    case '40-60':
      leftColSpan = 'md:col-span-5';
      rightColSpan = 'md:col-span-7';
      break;
    case '30-70':
      leftColSpan = 'md:col-span-4';
      rightColSpan = 'md:col-span-8';
      break;
    case '50-50':
    default:
      leftColSpan = 'md:col-span-6';
      rightColSpan = 'md:col-span-6';
      break;
  }

  const renderBlockItem = (childBlock: TutorialBlock, idx: number, prefix: string) => {
    // Phase 2.5: Always use renderChild (provided by parent renderer with runtimeContext)
    if (!renderChild) {
      throw new Error('TwoColumnBlock requires renderChild prop for runtime context propagation');
    }
    return (
      <React.Fragment key={childBlock.id || `${prefix}-${idx}`}>
        {renderChild(childBlock, depth + 1)}
      </React.Fragment>
    );
  };

  return (
    <div
      id={block.id}
      className={`my-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start ${className}`}
    >
      <div className={`flex flex-col space-y-2 min-w-0 ${leftColSpan}`}>
        {leftBlocks.map((childBlock, idx) => renderBlockItem(childBlock, idx, 'left'))}
      </div>

      <div className={`flex flex-col space-y-2 min-w-0 ${rightColSpan}`}>
        {rightBlocks.map((childBlock, idx) => renderBlockItem(childBlock, idx, 'right'))}
      </div>
    </div>
  );
}
