// Test import verification
import {
  TutorialDocument,
  TutorialBlock,
  BlockType,
  HeadingBlock,
  ParagraphBlock,
  TwoColumnBlock,
  TutorialDocumentSchema,
  validateDocumentForSection,
  BLOCK_REGISTRY,
  CURRENT_SCHEMA_VERSION,
} from './src/tutorial-rich-document';

console.log('✅ All exports accessible');
console.log('Block types:', Object.keys(BLOCK_REGISTRY).length);
console.log('Schema version:', CURRENT_SCHEMA_VERSION);
