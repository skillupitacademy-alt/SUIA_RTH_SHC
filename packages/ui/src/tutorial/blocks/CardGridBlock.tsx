import React from 'react';
import type { ICardGridBlock, BlockComponentProps, TutorialBlock } from '../types';
import { TutorialBlockRenderer } from '../TutorialBlockRenderer';

export function CardGridBlock({
  block,
  depth = 0,
  theme,
  className = '',
  renderChild,
}: BlockComponentProps<ICardGridBlock>) {
  const cards = Array.isArray(block.content?.cards) ? block.content.cards : [];
  const columns = block.presentation?.columns || 3;

  let colClass = 'grid-cols-1 md:grid-cols-3';
  if (columns === 2) {
    colClass = 'grid-cols-1 md:grid-cols-2';
  } else if (columns === 4) {
    colClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  }

  const renderBlockItem = (childBlock: TutorialBlock, cIdx: number, bIdx: number) => {
    if (renderChild) {
      return (
        <React.Fragment key={childBlock.id || `card-${cIdx}-b${bIdx}`}>
          {renderChild(childBlock, depth + 1)}
        </React.Fragment>
      );
    }
    return (
      <TutorialBlockRenderer
        key={childBlock.id || `card-${cIdx}-b${bIdx}`}
        block={childBlock}
        depth={depth + 1}
        theme={theme}
      />
    );
  };

  return (
    <div
      id={block.id}
      className={`my-4 grid ${colClass} gap-4 items-stretch ${className}`}
    >
      {cards.map((card, cIdx) => {
        const cardBlocks = Array.isArray(card?.blocks) ? card.blocks : [];
        return (
          <div
            key={card.id || `card-${cIdx}`}
            className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm"
          >
            {card.title && (
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                {card.title}
              </h4>
            )}
            <div className="flex flex-col space-y-2 flex-1 min-w-0">
              {cardBlocks.map((childBlock, bIdx) => renderBlockItem(childBlock, cIdx, bIdx))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
