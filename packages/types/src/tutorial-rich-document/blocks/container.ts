/**
 * Tutorial Rich Document - Container Blocks
 * These blocks can contain child blocks (with depth limits)
 */

import type { BaseBlock } from './content';
import type {
  ContainerPresentationConfig,
  TwoColumnPresentationConfig,
  GridPresentationConfig,
} from '../presentation';
import type { TutorialBlock } from './index';

/**
 * Two-column layout block
 */
export interface TwoColumnBlock extends Omit<BaseBlock, 'presentation'> {
  type: 'two-column';
  content: {
    left: {
      blocks: TutorialBlock[];
    };
    right: {
      blocks: TutorialBlock[];
    };
  };
  presentation?: TwoColumnPresentationConfig;
}

/**
 * Three-column layout block
 */
export interface ThreeColumnBlock extends Omit<BaseBlock, 'presentation'> {
  type: 'three-column';
  content: {
    columns: [
      { blocks: TutorialBlock[] },
      { blocks: TutorialBlock[] },
      { blocks: TutorialBlock[] }
    ];
  };
  presentation?: GridPresentationConfig;
}

/**
 * Card grid layout block
 */
export interface CardGridBlock extends Omit<BaseBlock, 'presentation'> {
  type: 'card-grid';
  content: {
    cards: Card[];
  };
  presentation?: GridPresentationConfig;
}

export interface Card {
  id: string;
  title?: string;
  blocks: TutorialBlock[];
}

/**
 * Timeline layout block
 */
export interface TimelineBlock extends Omit<BaseBlock, 'presentation'> {
  type: 'timeline';
  content: {
    items: TimelineItem[];
    orientation?: 'vertical' | 'horizontal';
  };
  presentation?: ContainerPresentationConfig;
}

export interface TimelineItem {
  id: string;
  title: string;
  date?: string;
  description?: string;
  blocks?: TutorialBlock[];
}

/**
 * Union type for all container blocks
 */
export type ContainerBlock =
  | TwoColumnBlock
  | ThreeColumnBlock
  | CardGridBlock
  | TimelineBlock;
