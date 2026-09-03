/**
 * Universal Tutorial Renderer Module
 * Authoritative consumer for canonical TutorialDocument (17 BLOCK_REGISTRY types)
 */

export * from './types';
export * from './TutorialRenderer';
export * from './TutorialBlockRenderer';

// Phase 3: Active Block Runtime
export * from './runtime/ActiveBlockContext';

// Phase 4: ILS Data Context
export * from './runtime/ILSProvider';

// Individual block components
export * from './blocks/HeadingBlock';
export * from './blocks/ParagraphBlock';
export * from './blocks/ListBlock';
export * from './blocks/CodeBlock';
export * from './blocks/TableBlock';
export * from './blocks/ImageBlock';
export * from './blocks/CalloutBlock';
export * from './blocks/DefinitionBlock';
export * from './blocks/ExampleBlock';
export * from './blocks/QuoteBlock';
export * from './blocks/SummaryBlock';
export * from './blocks/DiagramBlock';
export * from './blocks/ComparisonBlock';
export * from './blocks/TwoColumnBlock';
export * from './blocks/ThreeColumnBlock';
export * from './blocks/CardGridBlock';
export * from './blocks/TimelineBlock';
