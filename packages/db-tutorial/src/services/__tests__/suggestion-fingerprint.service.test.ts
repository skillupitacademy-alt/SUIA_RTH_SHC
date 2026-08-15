/**
 * Suggestion Fingerprint Service Tests
 * 
 * PHASE B — PROMPT 08
 * 
 * Verifies deterministic fingerprint generation for BlockSuggestion identity.
 */

import { describe, it, expect } from 'vitest';
import type { BlockSuggestion } from '@quiz/types';
import {
  fingerprintSuggestion,
  verifySuggestionFingerprint,
  canonicalize,
  getStableSuggestionRepresentation,
} from '../suggestion-fingerprint.service';

describe('SuggestionFingerprintService', () => {
  describe('canonicalize', () => {
    it('should canonicalize primitives', () => {
      expect(canonicalize(null)).toBe('null');
      expect(canonicalize(undefined)).toBe('undefined');
      expect(canonicalize(123)).toBe('123');
      expect(canonicalize('hello')).toBe('"hello"');
      expect(canonicalize(true)).toBe('true');
    });

    it('should canonicalize arrays', () => {
      expect(canonicalize([1, 2, 3])).toBe('[1,2,3]');
      expect(canonicalize(['a', 'b'])).toBe('["a","b"]');
    });

    it('should canonicalize objects with sorted keys', () => {
      const result = canonicalize({ b: 2, a: 1 });
      expect(result).toBe('{"a":1,"b":2}');
    });

    it('should canonicalize nested structures', () => {
      const nested = {
        outer: {
          b: 2,
          a: 1,
        },
        array: [3, 2, 1],
      };
      const result = canonicalize(nested);
      // Keys sorted: array, outer
      // outer keys sorted: a, b
      expect(result).toContain('"array"');
      expect(result).toContain('"outer"');
    });
  });

  describe('getStableSuggestionRepresentation', () => {
    it('should extract only stable semantic fields', () => {
      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary Block',
        preview: 'Summary preview...',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary block detected',
        sourceBlockIds: ['block-1', 'block-2'],
        sourceText: 'Original content',
        suggestedContent: { type: 'summary', content: { text: 'Summary' } },
        status: 'pending',
        metadata: {
          suggestedAt: '2024-01-01T00:00:00Z',
        },
      };

      const stable = getStableSuggestionRepresentation(suggestion);

      expect(stable).toEqual({
        kind: 'suggested',
        blockType: 'summary',
        sourceBlockIds: ['block-1', 'block-2'],
        sourceText: 'Original content',
        reason: 'No summary block detected',
        suggestedContent: { type: 'summary', content: { text: 'Summary' } },
      });

      // Verify excluded fields
      expect(stable).not.toHaveProperty('id');
      expect(stable).not.toHaveProperty('title');
      expect(stable).not.toHaveProperty('preview');
      expect(stable).not.toHaveProperty('confidence');
      expect(stable).not.toHaveProperty('confidenceLevel');
      expect(stable).not.toHaveProperty('status');
      expect(stable).not.toHaveProperty('metadata');
    });
  });

  describe('fingerprintSuggestion', () => {
    it('should generate consistent fingerprint for same suggestion', () => {
      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['block-1'],
        sourceText: 'Content',
        suggestedContent: { type: 'summary', content: { text: 'Summary' } },
        status: 'pending',
      };

      const fingerprint1 = fingerprintSuggestion(suggestion);
      const fingerprint2 = fingerprintSuggestion(suggestion);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should generate 64 hexadecimal characters', () => {
      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: [],
        status: 'pending',
      };

      const fingerprint = fingerprintSuggestion(suggestion);

      expect(fingerprint).toHaveLength(64);
      expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce same fingerprint regardless of property order', () => {
      // Same semantic content, different property order
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a', 'b'],
        sourceText: 'Content',
        suggestedContent: { type: 'summary', content: { text: 'Summary' } },
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        sourceText: 'Content',
        kind: 'suggested',
        suggestedContent: { type: 'summary', content: { text: 'Summary' } },
        blockType: 'summary',
        sourceBlockIds: ['a', 'b'],
        reason: 'No summary detected',
        status: 'pending',
        id: 'suggestion-1',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should produce different fingerprint for different blockType', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        blockType: 'callout',
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should produce different fingerprint for different sourceBlockIds', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a', 'b'],
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        sourceBlockIds: ['a', 'c'],
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should produce different fingerprint for different sourceText', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        sourceText: 'Original content',
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        sourceText: 'Modified content',
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should produce different fingerprint for different suggestedContent', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        suggestedContent: { type: 'summary', content: { text: 'Summary 1' } },
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        suggestedContent: { type: 'summary', content: { text: 'Summary 2' } },
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should produce same fingerprint when metadata timestamps change', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        status: 'pending',
        metadata: {
          suggestedAt: '2024-01-01T00:00:00Z',
        },
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        metadata: {
          suggestedAt: '2024-12-31T23:59:59Z',
        },
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should produce same fingerprint when status changes', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        status: 'accepted',
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should produce same fingerprint when id changes', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        id: 'suggestion-999',
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should produce same fingerprint when confidence changes', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        confidence: 85,
        confidenceLevel: 'high',
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should handle Unicode content correctly', () => {
      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'Unicode test: 你好 🎉',
        sourceBlockIds: ['a'],
        sourceText: 'Content with émojis 🚀 and àccénts',
        suggestedContent: { text: 'Summary with 中文 characters' },
        status: 'pending',
      };

      const fingerprint = fingerprintSuggestion(suggestion);

      expect(fingerprint).toHaveLength(64);
      expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);

      // Should be deterministic
      const fingerprint2 = fingerprintSuggestion(suggestion);
      expect(fingerprint).toBe(fingerprint2);
    });

    it('should handle nested suggestedContent deterministically', () => {
      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'two-column',
        title: 'Add Two Column',
        preview: 'Preview',
        confidence: 75,
        confidenceLevel: 'medium',
        reason: 'Comparison detected',
        sourceBlockIds: ['a', 'b'],
        suggestedContent: {
          type: 'two-column',
          content: {
            left: {
              blocks: [
                { id: 'left-1', type: 'paragraph', content: { text: 'Left content' } },
              ],
            },
            right: {
              blocks: [
                { id: 'right-1', type: 'paragraph', content: { text: 'Right content' } },
              ],
            },
          },
        },
        status: 'pending',
      };

      const fingerprint = fingerprintSuggestion(suggestion);

      expect(fingerprint).toHaveLength(64);
      expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should treat array ordering as significant', () => {
      const suggestion1: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a', 'b'],
        status: 'pending',
      };

      const suggestion2: BlockSuggestion = {
        ...suggestion1,
        sourceBlockIds: ['b', 'a'], // Different order
      };

      const fingerprint1 = fingerprintSuggestion(suggestion1);
      const fingerprint2 = fingerprintSuggestion(suggestion2);

      // Array order matters for sourceBlockIds
      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });

  describe('verifySuggestionFingerprint', () => {
    it('should return true for matching fingerprint', () => {
      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        status: 'pending',
      };

      const fingerprint = fingerprintSuggestion(suggestion);
      const isValid = verifySuggestionFingerprint(suggestion, fingerprint);

      expect(isValid).toBe(true);
    });

    it('should return false for mismatched fingerprint', () => {
      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Add Summary',
        preview: 'Preview',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'No summary detected',
        sourceBlockIds: ['a'],
        status: 'pending',
      };

      const wrongFingerprint = 'a'.repeat(64);
      const isValid = verifySuggestionFingerprint(suggestion, wrongFingerprint);

      expect(isValid).toBe(false);
    });
  });
});
