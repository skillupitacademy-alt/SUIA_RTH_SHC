import { Index } from '@upstash/vector';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';

import { buildSemanticRepresentation, HashableQuestion } from '../question/question-hash';

/**
 * Vector search metadata attached to every indexed question.
 */
export interface QuestionVectorMetadata {
  topicId: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface SimilarQuestionResult {
  id: string;
  /** Cosine similarity in [0, 1] (Upstash text-compute query). */
  score: number;
  metadata?: Partial<QuestionVectorMetadata> & Record<string, unknown>;
  data?: string;
}

export interface QuestionDisposition {
  /** 'new' — safely below the review band. */
  status: 'new' | 'review' | 'duplicate';
  /** Highest similarity score from the vector search. */
  score: number;
  /** Most similar existing question id (when score >= review threshold). */
  matchedQuestionId?: string;
  /** Existing question text (for UI preview + judge). */
  matchedQuestionText?: string;
  matchedQuestionCode?: string;
  matchedConceptKey?: string;
  matchedObjectiveKey?: string;
  reason: string;
}

export const DEFAULT_REVIEW_THRESHOLD = 0.9;
export const DEFAULT_DUPLICATE_THRESHOLD = 0.95;

const VECTOR_NAMESPACE = 'questions';

let indexInstance: Index<QuestionVectorMetadata> | null = null;

/** Lazy singleton. Returns null when Upstash Vector is not configured. */
function getVectorIndex(): Index<QuestionVectorMetadata> | null {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (typeof url !== 'string' || url.trim() === '' || typeof token !== 'string' || token.trim() === '') {
    return null;
  }

  if (indexInstance === null) {
    indexInstance = new Index<QuestionVectorMetadata>({ url, token });
  }
  return indexInstance;
}

function isVectorEnabled(): boolean {
  return getVectorIndex() !== null;
}

/**
 * Semantic operations on questions backed by Upstash Vector.
 * The index uses Upstash's hosted text-compute mode: raw text is stored and
 * embedded server-side, so no external OpenAI/Anthropic embedding dependency.
 */
export class SemanticSearchService {
  /**
   * Find the most semantically similar active questions.
   * Scoped to a topic via metadata filter when provided.
   */
  static async findSimilarQuestions(
    text: string,
    limit: number = 5,
    options?: { topicId?: string; status?: string }
  ): Promise<SimilarQuestionResult[]> {
    const index = getVectorIndex();
    if (index === null) {
      logger.warn('[SemanticSearch] Upstash Vector not configured — falling back to empty results');
      return [];
    }

    const start = Date.now();
    try {
      const filters: string[] = [];
      if (options?.topicId !== undefined && options.topicId !== '') {
        filters.push(`topicId = '${options.topicId.replace(/'/g, "''")}'`);
      }
      if (options?.status !== undefined && options.status !== '') {
        filters.push(`status = '${options.status.replace(/'/g, "''")}'`);
      }

      const namespace = index.namespace(VECTOR_NAMESPACE);
      const results = await namespace.query<QuestionVectorMetadata>({
        data: text,
        topK: limit,
        includeMetadata: true,
        includeData: true,
        ...(filters.length > 0 ? { filter: filters.join(' and ') } : {}),
      });

      recordCounter('semantic_search.query.success', 1, { topicId: options?.topicId ?? 'all', count: String(results.length) });
      recordTimer('semantic_search.query.duration', Date.now() - start, { outcome: 'success' });

      return results.map((r) => ({
        id: String(r.id),
        score: typeof r.score === 'number' ? r.score : 0,
        metadata: r.metadata,
        data: r.data,
      }));
    } catch (err) {
      recordCounter('semantic_search.query.failure', 1, { reason: err instanceof Error ? 'upstash_error' : 'unknown' });
      recordTimer('semantic_search.query.duration', Date.now() - start, { outcome: 'failure' });
      logger.error({ err }, '[SemanticSearch] Query failed');
      return [];
    }
  }

  /**
   * Index (or re-index) a question into the vector store.
   * Uses the full semantic representation (concept + type + question +
   * correct answer + code) so reworded-but-identical questions align.
   */
  static async indexQuestion(
    questionId: string,
    text: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const index = getVectorIndex();
    if (index === null) {
      logger.warn('[SemanticSearch] Upstash Vector not configured — skipping index');
      return;
    }

    const start = Date.now();
    try {
      const representation = buildSemanticRepresentation({
        questionText: text,
        codeSnippet: typeof metadata.codeSnippet === 'string' ? metadata.codeSnippet : null,
        conceptKey: typeof metadata.conceptKey === 'string' ? metadata.conceptKey : null,
        type: typeof metadata.type === 'string' ? metadata.type : 'mcq',
        correctAnswer: typeof metadata.correctAnswer === 'string' ? metadata.correctAnswer : null,
      });

      await index.namespace(VECTOR_NAMESPACE).upsert({
        id: questionId,
        data: representation,
        metadata: {
          topicId: String(metadata.topicId ?? ''),
          type: String(metadata.type ?? 'mcq'),
          status: String(metadata.status ?? 'active'),
          questionText: text,
          ...(typeof metadata.codeSnippet === 'string' && metadata.codeSnippet !== '' ? { codeSnippet: metadata.codeSnippet } : {}),
          ...(typeof metadata.conceptKey === 'string' && metadata.conceptKey !== '' ? { conceptKey: metadata.conceptKey } : {}),
          ...(typeof metadata.objectiveKey === 'string' && metadata.objectiveKey !== '' ? { objectiveKey: metadata.objectiveKey } : {}),
          ...(typeof metadata.correctAnswer === 'string' && metadata.correctAnswer !== '' ? { correctAnswer: metadata.correctAnswer } : {}),
        },
      });

      recordCounter('semantic_search.index.success', 1, { questionId });
      recordTimer('semantic_search.index.duration', Date.now() - start, { outcome: 'success' });
    } catch (err) {
      recordCounter('semantic_search.index.failure', 1, { questionId, reason: err instanceof Error ? 'upstash_error' : 'unknown' });
      recordTimer('semantic_search.index.duration', Date.now() - start, { outcome: 'failure' });
      logger.error({ err, questionId }, '[SemanticSearch] Index failed');
    }
  }

  /** Remove a question from the vector store (delete/archive path). */
  static async removeQuestion(questionId: string): Promise<void> {
    const index = getVectorIndex();
    if (index === null) return;

    const start = Date.now();
    try {
      await index.namespace(VECTOR_NAMESPACE).delete(questionId);
      recordCounter('semantic_search.remove.success', 1, { questionId });
      recordTimer('semantic_search.remove.duration', Date.now() - start, { outcome: 'success' });
    } catch (err) {
      recordCounter('semantic_search.remove.failure', 1, { questionId, reason: err instanceof Error ? 'upstash_error' : 'unknown' });
      logger.error({ err, questionId }, '[SemanticSearch] Remove failed');
    }
  }

  /**
   * Boolean duplicate check (legacy contract used by AdminQuestionEngine).
   * Returns true only for definite duplicates (score >= duplicate threshold).
   */
  static async isDuplicate(text: string, threshold: number = DEFAULT_DUPLICATE_THRESHOLD): Promise<boolean> {
    const disposition = await this.evaluate(text, threshold);
    return disposition.status === 'duplicate';
  }

  /**
   * Evaluate a candidate question against the vector store.
   *
   * Verdicts:
   *   score <  reviewThreshold      → 'new'
   *   score >= duplicateThreshold   → 'duplicate'
   *   otherwise                     → 'review' (human/AI-judge band)
   */
  static async evaluate(
    question: string | (HashableQuestion & { type?: string | null; correctAnswer?: string | null; objectiveKey?: string | null }),
    duplicateThreshold: number = DEFAULT_DUPLICATE_THRESHOLD,
    reviewThreshold: number = DEFAULT_REVIEW_THRESHOLD,
    options?: { topicId?: string; status?: string; questionHash?: string }
  ): Promise<QuestionDisposition> {
    const queryText = typeof question === 'string'
      ? question
      : buildSemanticRepresentation(question);
    const similar = await this.findSimilarQuestions(queryText, 3, options);

    if (similar.length === 0) {
      return { status: 'new', score: 0, reason: 'no_similar_questions' };
    }

    const top = similar[0];
    const score = top.score;

    if (score >= duplicateThreshold) {
      recordCounter('semantic_search.evaluate.verdict', 1, { verdict: 'duplicate', score: score.toFixed(3) });
      return {
        status: 'duplicate',
        score,
        matchedQuestionId: top.id,
        matchedQuestionText: typeof top.metadata?.questionText === 'string' ? top.metadata.questionText : top.data,
        matchedQuestionCode: typeof top.metadata?.codeSnippet === 'string' ? top.metadata.codeSnippet : undefined,
        matchedConceptKey: typeof top.metadata?.conceptKey === 'string' ? top.metadata.conceptKey : undefined,
        matchedObjectiveKey: typeof top.metadata?.objectiveKey === 'string' ? top.metadata.objectiveKey : undefined,
        reason: 'semantic_match',
      };
    }

    if (score >= reviewThreshold) {
      recordCounter('semantic_search.evaluate.verdict', 1, { verdict: 'review', score: score.toFixed(3) });
      return {
        status: 'review',
        score,
        matchedQuestionId: top.id,
        matchedQuestionText: typeof top.metadata?.questionText === 'string' ? top.metadata.questionText : top.data,
        matchedQuestionCode: typeof top.metadata?.codeSnippet === 'string' ? top.metadata.codeSnippet : undefined,
        matchedConceptKey: typeof top.metadata?.conceptKey === 'string' ? top.metadata.conceptKey : undefined,
        matchedObjectiveKey: typeof top.metadata?.objectiveKey === 'string' ? top.metadata.objectiveKey : undefined,
        reason: 'semantic_review',
      };
    }

    recordCounter('semantic_search.evaluate.verdict', 1, { verdict: 'new', score: score.toFixed(3) });
    return { status: 'new', score, reason: 'below_review_threshold' };
  }

  /** True when Upstash Vector credentials are configured. */
  static isConfigured(): boolean {
    return isVectorEnabled();
  }
}
