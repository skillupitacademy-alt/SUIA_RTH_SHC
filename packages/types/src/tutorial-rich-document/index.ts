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

// Validation schemas
export * from './schemas/document.schema';
export * from './schemas/blocks.schema';
export * from './schemas/presentation.schema';

// Registry and validation
export * from './registry';
export * from './validation';

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
