/**
 * Tutorial Composer - Main Entry Point
 * API contracts and domain types for NEW Tutorial Composer
 */

// Contracts
export * from './contracts';
export * from './presentation-ideas-contracts';

// Errors
export * from './errors';

// Re-export TutorialDocument types for convenience
export type { TutorialDocument } from '../tutorial-rich-document/document';
export type { TutorialBlock, BlockType } from '../tutorial-rich-document/blocks';
export { TutorialDocumentSchema } from '../tutorial-rich-document/schemas/document.schema';
export { validateDocumentForSection } from '../tutorial-rich-document/validation';
export type { ValidationResult, ValidationError } from '../tutorial-rich-document/validation';

// Note: SectionType is exported from contracts.ts, not re-exported from tutorial-rich-document
// to avoid naming conflict with validation.ts SectionType
