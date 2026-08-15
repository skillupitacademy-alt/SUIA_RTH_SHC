/**
 * Container Blocks - Layout and organizational blocks
 * 
 * These blocks contain other blocks (children) and provide
 * layout structure. They support nesting up to depth 3.
 * 
 * IMPORTANT: Use z.lazy() in Zod schemas for recursive types.
 */

import { PresentationConfig } from '../presentation';

/**
 * Base structure for all blocks
 */
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}

/**
 * Forward declaration for TutorialBlock to enable recursion
 * The actual union type is defined in index.ts
 */
export type TutorialBlock = any;

/**
 * 14. Two Column Block
 */
export interface TwoColumnBlock extends BaseBlock {
  type: 'two-column';
  content: {
    left: {
      blocks: TutorialBlock[];
    };
    right: {
      blocks: TutorialBlock[];
    };
  };
}

/**
 * 15. Three Column Block
 */
export interface ThreeColumnBlock extends BaseBlock {
  type: 'three-column';
  content: {
    columns: [
      { blocks: TutorialBlock[] },
      { blocks: TutorialBlock[] },
      { blocks: TutorialBlock[] }
    ];
  };
}

/**
 * 16. Card Grid Block (responsive grid of cards)
 */
export interface CardGridBlock extends BaseBlock {
  type: 'card-grid';
  content: {
    cards: Array<{
      title?: string;
      blocks: TutorialBlock[];
    }>;
    /**
     * Number of columns (responsive hint)
     */
    columns?: 2 | 3 | 4;
  };
}

/**
 * 17. Timeline Block (chronological or sequential content)
 */
export interface TimelineBlock extends BaseBlock {
  type: 'timeline';
  content: {
    items: Array<{
      title: string;
      date?: string;
      description?: string;
      blocks?: TutorialBlock[];
    }>;
  };
}
