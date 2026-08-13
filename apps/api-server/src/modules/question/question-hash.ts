import { createHash } from 'node:crypto';

/**
 * Question hashing & normalization utilities for the duplicate-detection
 * pipeline (factory question generator).
 *
 * NORMALIZATION CONTRACT:
 *   lower + trim + collapse whitespace runs to a single space
 * Must stay in sync with the SQL backfill in
 * packages/db/migrations/0027_add_question_duplicate_detection.sql:
 *   lower(btrim(regexp_replace(col, '\s+', ' ', 'g')))
 */

export interface HashableQuestion {
  questionText: string;
  codeSnippet?: string | null;
  conceptKey?: string | null;
}

/** Normalize question text for exact-match hashing. */
export function normalizeQuestionText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Normalize a code snippet for structural hashing (whitespace-insensitive). */
export function normalizeCodeSnippet(code: string): string {
  return code.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** SHA-256 hex digest of a normalized string. */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Exact-duplicate hash for a question. Unique among active rows in DB. */
export function computeQuestionHash(questionText: string): string {
  return sha256Hex(normalizeQuestionText(questionText));
}

/** Structural hash for the code snippet (null when no code present). */
export function computeCodeHash(codeSnippet: string | null | undefined): string | null {
  if (codeSnippet === null || codeSnippet === undefined || codeSnippet.trim() === '') {
    return null;
  }
  return sha256Hex(normalizeCodeSnippet(codeSnippet));
}

/**
 * Compact canonical key used for exact concept matching.
 * Normalizes both dot and underscore separators so
 * "javascript.closures.lexical-scope" and "javascript_closures_lexical_scope"
 * resolve to the same key.
 */
export function normalizeConceptKey(conceptKey: string): string {
  return conceptKey
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[.\-/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Normalize objective key (same rules as concept key).
 * Example: "javascript.closures.predict-output" → "javascript_closures_predict_output"
 */
export function normalizeObjectiveKey(objectiveKey: string): string {
  return normalizeConceptKey(objectiveKey);
}

/**
 * Semantic representation embedded into Upstash Vector for similarity search.
 * Includes the concept + type + question + correct answer + code so that
 * reworded "output" questions with identical code still rank together,
 * while conceptual vs output questions (correct-answer difference) are
 * separated (see architecture §17).
 */
export function buildSemanticRepresentation(question: HashableQuestion & {
  type?: string | null;
  correctAnswer?: string | null;
}): string {
  const parts: string[] = [];

  if (question.conceptKey !== null && question.conceptKey !== undefined && question.conceptKey.trim() !== '') {
    parts.push(`Concept: ${question.conceptKey.trim()}`);
  }
  if (question.type !== null && question.type !== undefined && question.type.trim() !== '') {
    parts.push(`Type: ${question.type.trim()}`);
  }

  parts.push(`Question: ${normalizeQuestionText(question.questionText)}`);

  if (question.correctAnswer !== null && question.correctAnswer !== undefined && question.correctAnswer.trim() !== '') {
    parts.push(`Correct Answer: ${normalizeQuestionText(question.correctAnswer)}`);
  }
  if (question.codeSnippet !== null && question.codeSnippet !== undefined && question.codeSnippet.trim() !== '') {
    parts.push(`Code:\n${question.codeSnippet.trim()}`);
  }

  return parts.join('\n');
}
