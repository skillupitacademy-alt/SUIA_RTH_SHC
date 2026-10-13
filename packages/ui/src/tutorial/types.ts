/**
 * Universal Tutorial Renderer - Types & Props Contracts
 * Conforms to canonical TutorialDocument (17 Block Types) from @quiz/types
 */

import type {
  TutorialDocument,
  TutorialBlock,
  BlockType,
  HeadingBlock as IHeadingBlock,
  ParagraphBlock as IParagraphBlock,
  ListBlock as IListBlock,
  CodeBlock as ICodeBlock,
  TableBlock as ITableBlock,
  ImageBlock as IImageBlock,
  CalloutBlock as ICalloutBlock,
  DefinitionBlock as IDefinitionBlock,
  IntroductionBlock as IIntroductionBlock,
  ExampleBlock as IExampleBlock,
  QuoteBlock as IQuoteBlock,
  SummaryBlock as ISummaryBlock,
  DiagramBlock as IDiagramBlock,
  ComparisonBlock as IComparisonBlock,
  TwoColumnBlock as ITwoColumnBlock,
  ThreeColumnBlock as IThreeColumnBlock,
  CardGridBlock as ICardGridBlock,
  TimelineBlock as ITimelineBlock,
} from '@quiz/types';

export type {
  TutorialDocument,
  TutorialBlock,
  BlockType,
  IHeadingBlock,
  IParagraphBlock,
  IListBlock,
  ICodeBlock,
  ITableBlock,
  IImageBlock,
  ICalloutBlock,
  IDefinitionBlock,
  IIntroductionBlock,
  IExampleBlock,
  IQuoteBlock,
  ISummaryBlock,
  IDiagramBlock,
  IComparisonBlock,
  ITwoColumnBlock,
  IThreeColumnBlock,
  ICardGridBlock,
  ITimelineBlock,
};

/**
 * Domain Theme - Brand-specific color palette
 * 
 * Extends beyond primary/secondary to include semantic color scales
 * for complete theme coverage without hardcoded hex values.
 */
export interface DomainTheme {
  primary: string;
  secondary: string;
  primaryDark?: string;
  
  // Semantic color scales (Tailwind-compatible)
  slate?: {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
    950?: string;
  };
  gray?: {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  };
  blue?: {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  };
  emerald?: {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  };
  amber?: {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  };
  rose?: {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  };
  teal?: {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  };
  
  // Allow additional properties for extensibility
  [key: string]: any;
}

export interface TutorialRendererProps {
  document: TutorialDocument | null | undefined;
  sectionType?: string;
  theme?: DomainTheme;
  className?: string;
}

/**
 * Phase 2.5: TutorialBlockRuntimeContext
 * Universal runtime identity boundary for block rendering.
 * 
 * This is passed to blocks for tracking/progress OUTSIDE of block content JSON.
 * Blocks do NOT implement tracking logic - the universal boundary does.
 */
export interface TutorialBlockRuntimeContext {
  learnerId: string;
  navigationNodeId: string;
  sectionId: string | null;
  blockId: string;
  blockType: string;
  blockVersion: string;
  subtopicId: string;
}

export interface BlockComponentProps<T extends TutorialBlock = TutorialBlock> {
  block: T;
  depth?: number;
  theme?: DomainTheme;
  className?: string;
  renderChild?: (block: TutorialBlock, depth: number) => React.ReactNode;
  // Phase 2.5: Universal runtime context (optional for legacy/preview contexts)
  runtimeContext?: TutorialBlockRuntimeContext;
}
