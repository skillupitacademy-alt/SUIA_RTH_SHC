/**
 * Fixture Validation Diagnostic Test
 * 
 * Proves that test fixtures actually pass TutorialDocumentSchema
 * DO NOT assume buildTutorialDocument() guarantees schema validity
 */

import { describe, it, expect } from 'vitest';
import { TutorialDocumentSchema } from '@quiz/types';
import {
  createValidTestDocument,
  createMultiBlockTestDocument,
  createEmptyTestDocument,
} from './fixtures/tutorial-document.fixtures';

describe('Fixture Validation Diagnostics', () => {
  it('createValidTestDocument() must pass TutorialDocumentSchema', () => {
    const document = createValidTestDocument();
    const result = TutorialDocumentSchema.safeParse(document);
    
    if (!result.success) {
      console.error('❌ VALIDATION FAILED FOR createValidTestDocument()');
      console.error('Zod Issues:');
      console.dir(result.error.flatten(), { depth: null });
    }
    
    expect(result.success).toBe(true);
  });

  it('createMultiBlockTestDocument() must pass TutorialDocumentSchema', () => {
    const document = createMultiBlockTestDocument();
    const result = TutorialDocumentSchema.safeParse(document);
    
    if (!result.success) {
      console.error('❌ VALIDATION FAILED FOR createMultiBlockTestDocument()');
      console.error('Zod Issues:');
      console.dir(result.error.flatten(), { depth: null });
    }
    
    expect(result.success).toBe(true);
  });

  it('createEmptyTestDocument() must FAIL TutorialDocumentSchema (by design)', () => {
    // The builder validates immediately, before returning a document.
    expect(createEmptyTestDocument).toThrow();
  });
});
