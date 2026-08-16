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

export type DomainTheme = Record<string, any>;

export interface TutorialRendererProps {
  document: TutorialDocument | null | undefined;
  sectionType?: string;
  theme?: DomainTheme;
  className?: string;
}

export interface BlockComponentProps<T extends TutorialBlock = TutorialBlock> {
  block: T;
  depth?: number;
  theme?: DomainTheme;
  className?: string;
  renderChild?: (block: TutorialBlock, depth: number) => React.ReactNode;
}
