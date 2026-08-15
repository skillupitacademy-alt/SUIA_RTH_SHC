/**
 * Suggestion Fingerprint Service
 * 
 * Generates canonical cryptographic fingerprints for BlockSuggestion identity verification.
 * 
 * PHASE B — PROMPT 08
 * 
 * PURPOSE:
 * - Establish server as authority for suggestion identity
 * - Prevent client tampering with suggestion content
 * - Enable verification of client-provided suggestion references
 * 
 * FINGERPRINT DESIGN:
 * - Algorithm: SHA-256
 * - Canonicalization: Deterministic key ordering
 * - Stable fields only (excludes timestamps, processing metadata)
 * 
 * SEMANTIC IDENTITY FIELDS:
 * - kind: "existing" | "suggested"
 * - blockType: The type of block being suggested
 * - sourceBlockIds: Array of source block IDs
 * - sourceText: Optional source text content
 * - reason: Explanation for the suggestion
 * - suggestedContent: The actual suggested block content
 * 
 * EXCLUDED FIELDS (non-deterministic/transient):
 * - id: Generated sequentially per session
 * - title: UI presentation field
 * - preview: UI presentation field
 * - confidence: Structural confidence score
 * - confidenceLevel: Derived from confidence
 * - status: Transient user action state
 * - metadata.detectedAt: Runtime timestamp
 * - metadata.suggestedAt: Runtime timestamp
 * 
 * DETERMINISM GUARANTEE:
 * Equivalent suggestions MUST produce identical fingerprints regardless of:
 * - Property insertion order
 * - Runtime execution metadata
 * - Session-specific IDs
 * - UI presentation fields
 */

import { createHash } from 'crypto';
import type { BlockSuggestion } from '@quiz/types';

/**
 * Stable semantic representation of a BlockSuggestion
 * Only includes fields that define the suggestion's semantic identity
 */
export interface StableSuggestionRepresentation {
  kind: string;
  blockType: string;
  sourceBlockIds: string[];
  sourceText?: string;
  reason: string;
  suggestedContent?: any;
}

/**
 * Extract stable semantic fields from BlockSuggestion
 * 
 * @param suggestion - BlockSuggestion to extract from
 * @returns Stable representation containing only semantic identity fields
 */
export function getStableSuggestionRepresentation(
  suggestion: BlockSuggestion
): StableSuggestionRepresentation {
  return {
    kind: suggestion.kind,
    blockType: suggestion.blockType,
    sourceBlockIds: suggestion.sourceBlockIds,
    sourceText: suggestion.sourceText,
    reason: suggestion.reason,
    suggestedContent: suggestion.suggestedContent,
  };
}

/**
 * Canonicalize a value to deterministic string representation
 * 
 * CRITICAL: Objects are serialized with sorted keys to ensure
 * property insertion order does not affect the result.
 * 
 * @param value - Value to canonicalize
 * @returns Canonical string representation
 */
export function canonicalize(value: unknown): string {
  // Null
  if (value === null) {
    return 'null';
  }

  // Undefined
  if (value === undefined) {
    return 'undefined';
  }

  // Primitives
  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }

  // Arrays
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }

  // Objects
  const object = value as Record<string, unknown>;
  const keys = Object.keys(object).sort();

  return `{${keys
    .map(key => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
    .join(',')}}`;
}

/**
 * Generate SHA-256 fingerprint for a BlockSuggestion
 * 
 * The fingerprint is based only on stable semantic fields.
 * Same semantic content → same fingerprint.
 * 
 * @param suggestion - BlockSuggestion to fingerprint
 * @returns 64-character hexadecimal SHA-256 fingerprint
 * 
 * @example
 * ```ts
 * const suggestion: BlockSuggestion = {
 *   id: 'suggestion-1',
 *   kind: 'suggested',
 *   blockType: 'summary',
 *   title: 'Add Summary Block',
 *   preview: '...',
 *   confidence: 70,
 *   confidenceLevel: 'medium',
 *   reason: 'No summary detected',
 *   sourceBlockIds: ['block-1', 'block-2'],
 *   sourceText: 'Original content...',
 *   suggestedContent: { type: 'summary', content: { ... } },
 *   status: 'pending',
 *   metadata: { suggestedAt: '2024-01-01T00:00:00Z' }
 * };
 * 
 * const fingerprint = fingerprintSuggestion(suggestion);
 * // => 'a3f5e7...' (64 hex characters)
 * ```
 */
export function fingerprintSuggestion(suggestion: BlockSuggestion): string {
  // Extract stable semantic representation
  const stable = getStableSuggestionRepresentation(suggestion);

  // Canonicalize to deterministic string
  const canonical = canonicalize(stable);

  // Generate SHA-256 hash
  const hash = createHash('sha256');
  hash.update(canonical);
  return hash.digest('hex');
}

/**
 * Verify that a suggestion matches the expected fingerprint
 * 
 * @param suggestion - BlockSuggestion to verify
 * @param expectedFingerprint - Expected fingerprint from client
 * @returns true if fingerprints match, false otherwise
 */
export function verifySuggestionFingerprint(
  suggestion: BlockSuggestion,
  expectedFingerprint: string
): boolean {
  const actualFingerprint = fingerprintSuggestion(suggestion);
  return actualFingerprint === expectedFingerprint;
}
