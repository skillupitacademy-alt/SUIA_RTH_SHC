/**
 * Normalize block preview content for display.
 * 
 * For Code C1 blocks, performs canonicalization via toCanonicalCodeC1.
 * For all other block types, returns content unchanged.
 * 
 * This is a PURE utility - it does not mutate React state.
 * The caller is responsible for applying the returned memoryModelWarning to UI state.
 * 
 * @param payload - Raw block payload to normalize
 * @param blockType - Block type identifier
 * @param versionCode - Block version code (e.g., 'C1', 'D1', 'I1', 'S1')
 * @returns Normalized content and optional memory model warning
 */

import type { TutorialPageContentType } from '@quiz/types';
import { toCanonicalCodeC1 } from '../blocks/code/C1/codeC1.converter';

export interface NormalizedBlockPreview {
  /**
   * Normalized block content for preview display.
   * For C1 blocks, this is CodeC1AuthorContent (canonical format).
   * For other blocks, this is the original payload unchanged.
   */
  content: unknown;
  
  /**
   * Warning message when C1 canonicalization loses memoryModel data.
   * Empty string if no warning.
   */
  memoryModelWarning: string;
}

export function normalizeBlockPreview(
  payload: unknown,
  blockType: TutorialPageContentType,
  versionCode: string
): NormalizedBlockPreview {
  // C1 blocks require canonicalization
  if (blockType === 'code' && versionCode === 'C1') {
    try {
      const result = toCanonicalCodeC1(payload);
      return {
        content: result.content,
        memoryModelWarning: result.memoryModelWarning || '',
      };
    } catch (error) {
      // Fallback to raw payload if conversion fails
      console.error('[C1 Normalization] Failed to convert to canonical:', error);
      return {
        content: payload,
        memoryModelWarning: '',
      };
    }
  }
  
  // All other block types pass through unchanged
  return {
    content: payload,
    memoryModelWarning: '',
  };
}
