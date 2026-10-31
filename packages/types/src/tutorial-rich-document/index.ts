/**
 * Tutorial Rich Document - Main Entry Point
 * 
 * This module provides the canonical Rich Document Model for Tutorial content.
 * It replaces the old section-specific schemas with a universal block-based model.
 * 
 * @module tutorial-rich-document
 */

// Core types
export * from './constants';
export * from './document';
export * from './metadata';
export * from './presentation';
export * from './blocks';

// Validation schemas - Export schemas but not type re-exports to avoid conflicts
export * from './schemas/document.schema';
export {
  TutorialBlockSchema,
  ContentBlockSchema,
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  CodeBlockSchema,
  TableBlockSchema,
  ImageBlockSchema,
  CalloutBlockSchema,
  DefinitionBlockSchema,
  ExampleBlockSchema,
  QuoteBlockSchema,
  SummaryBlockSchema,
  DiagramBlockSchema,
  ComparisonBlockSchema,
  ContainerBlockSchema,
  TwoColumnBlockSchema,
  ThreeColumnBlockSchema,
  CardGridBlockSchema,
  TimelineBlockSchema,
} from './schemas/blocks.schema';
export { PresentationConfigSchema } from './schemas/presentation.schema';
export {
  DefinitionD1BlockSchema,
  DefinitionD1PageSchema,
  DefinitionD1AuthorContentSchema,
  validateDefinitionD1AIOutput,
} from './schemas/definition-d1.schema';
export {
  CodeC1BlockSchema,
  CodeC1AuthorContentSchema,
  HistoricalTutorialCodePayloadSchema,
  validateCodeC1AIOutput,
} from './schemas/code-c1.schema';
export {
  IntroductionI1BlockSchema,
  IntroductionI1AuthorContentSchema,
  validateIntroductionI1AIOutput,
} from './schemas/introduction-i1.schema';
export {
  ObjectiveO1BlockSchema,
  ObjectiveO1ItemSchema,
  ObjectiveO1NoteSchema,
  ObjectiveO1ContentSchema,
  validateObjectiveO1Block,
} from './schemas/objective-o1.schema';

// Registry and validation
export * from './registry';
export * from './registries/definition-versions';
export * from './registries/code-versions';
export * from './validation';
export * from './validation/expectedTimeSec.validator';

// Re-export key types for convenience
export type {
  TutorialDocument,
} from './document';

export type {
  TutorialBlock,
  BlockType,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  CodeBlock,
  TableBlock,
  ImageBlock,
  CalloutBlock,
  DefinitionBlock,
  DefinitionD1Block,
  DefinitionD1Page,
  DefinitionD1AuthorContent,
  IntroductionBlock,
  IntroductionI1Block,
  IntroductionI1Page,
  IntroductionI1AuthorContent,
  IntroductionIconKey,
  ObjectiveBlock,
  ObjectiveO1Block,
  ObjectiveO1Page,
  ObjectiveO1AuthorContent,
  CodeC1Block,
  CodeC1Page,
  CodeC1AuthorContent,
  ExampleBlock,
  QuoteBlock,
  SummaryBlock,
  DiagramBlock,
  ComparisonBlock,
  TwoColumnBlock,
  ThreeColumnBlock,
  CardGridBlock,
  TimelineBlock,
} from './blocks';

export type {
  PresentationConfig,
  ContainerPresentationConfig,
  TwoColumnPresentationConfig,
  GridPresentationConfig,
} from './presentation';
