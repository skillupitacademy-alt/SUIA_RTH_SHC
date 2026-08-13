import { db, questions } from '@quiz/db';
import { and, eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { judgeQuestion, JudgeQuestionPayload } from '@/modules/intelligence/question-judge.client';
import { QuestionDisposition,SemanticSearchService } from '@/modules/intelligence/semantic-search.service';

import { computeCodeHash, computeQuestionHash, normalizeConceptKey, normalizeObjectiveKey } from './question-hash';

/**
 * Layer thresholds (architecture §10):
 *   < 0.90        → NEW
 *   0.90 – 0.95   → PRIVATE AI JUDGE (fallback: human REVIEW)
 *   ≥ 0.95        → DUPLICATE
 */
export const REVIEW_THRESHOLD = Number(process.env.QUESTION_DUPLICATE_THRESHOLD ?? '0.9');
export const DUPLICATE_THRESHOLD = Number(process.env.QUESTION_DUPLICATE_HARD_THRESHOLD ?? '0.95');

export interface DuplicateSignal {
  /** Exact normalized-text match (question_hash). */
  exactMatch: boolean;
  /** Same normalized code snippet within the same topic. */
  codeMatch: boolean;
  /** Same normalized concept_key within the same topic. */
  conceptMatch: boolean;
  /** Same normalized objective_key within the same topic. */
  objectiveMatch: boolean;
  /** Highest vector similarity score in [0,1] (0 when no candidate found). */
  semanticScore: number;
  /** Matched existing question id for any signal. */
  matchedQuestionId?: string;
  /** Matched existing question text (for UI preview + judge input). */
  matchedQuestionText?: string;
  /** Matched existing code snippet (for judge input). */
  matchedQuestionCode?: string;
  /** Matched existing concept_key. */
  matchedConceptKey?: string;
  /** Matched existing objective_key. */
  matchedObjectiveKey?: string;
}

export type DuplicateVerdictStatus = 'new' | 'review' | 'duplicate';

export interface DuplicateVerdict {
  status: DuplicateVerdictStatus;
  level: 'exact' | 'code' | 'concept' | 'semantic' | 'judge' | 'none';
  reason: string;
  similarity?: number;
  signals: DuplicateSignal;
  judge?: {
    available: boolean;
    duplicate: boolean;
    confidence: number;
    reason: string;
  };
}

export interface CandidateQuestion {
  questionText: string;
  codeSnippet?: string | null;
  conceptKey?: string | null;
  objectiveKey?: string | null;
  type?: string | null;
  correctAnswer?: string | null;
}

/**
 * Layered duplicate detector for the factory question pipeline.
 *
 * DUPLICATE DEFINITION:
 * Two questions are duplicates when they assess substantially the same
 * knowledge objective, require substantially the same reasoning or execution
 * process, and lead the candidate toward the same answer determination,
 * even if wording, variable names, formatting, or surface context differ.
 *
 * Order of layers (never re-ordered — each is cheaper than the next):
 *   1. Exact hash (question_hash)          → DUPLICATE
 *   2. Code hash within topic (code_mcq)   → signal (boost semantic), not auto-reject
 *   3. Concept key within topic            → signal only (raises semantic score)
 *   4. Objective key within topic          → strong signal (raises semantic score)
 *   5. Upstash Vector semantic search      → ≥0.95 DUPLICATE / 0.90–0.95 judge / <0.90 NEW
 *   6. Private FastAPI judge (borderline)  → evaluates all signals holistically
 */
export class DuplicateDetector {
  static async evaluate(candidate: CandidateQuestion, topicId: string): Promise<DuplicateVerdict> {
    const start = Date.now();

    const questionHash = computeQuestionHash(candidate.questionText);
    const codeHash = computeCodeHash(candidate.codeSnippet ?? null);
    const normConcept = candidate.conceptKey !== null && candidate.conceptKey !== undefined && candidate.conceptKey.trim() !== ''
      ? normalizeConceptKey(candidate.conceptKey)
      : null;
    const normObjective = candidate.objectiveKey !== null && candidate.objectiveKey !== undefined && candidate.objectiveKey.trim() !== ''
      ? normalizeObjectiveKey(candidate.objectiveKey)
      : null;

    const signals: DuplicateSignal = {
      exactMatch: false,
      codeMatch: false,
      conceptMatch: false,
      objectiveMatch: false,
      semanticScore: 0,
    };

    try {
      // ── LAYER 1: Exact hash (any active row) ─────────────────────────────
      const exactHit = await db.query.questions.findFirst({
        where: and(eq(questions.questionHash, questionHash), eq(questions.status, 'active')),
        columns: { id: true, questionText: true, codeSnippet: true, conceptKey: true },
      });

      if (exactHit !== undefined && exactHit !== null) {
        recordCounter('duplicate_detector.verdict', 1, { verdict: 'duplicate', level: 'exact' });
        recordTimer('duplicate_detector.duration', Date.now() - start, { outcome: 'success', level: 'exact' });
        return {
          status: 'duplicate',
          level: 'exact',
          reason: 'exact_match',
          signals: {
            ...signals,
            exactMatch: true,
            matchedQuestionId: exactHit.id,
            matchedQuestionText: exactHit.questionText,
            matchedQuestionCode: exactHit.codeSnippet ?? undefined,
            matchedConceptKey: exactHit.conceptKey ?? undefined,
          },
        };
      }

      // ── LAYER 2: Code hash within topic (signal, not gate) ───────────────
      let codeHit: { id: string; questionText: string; codeSnippet: string | null; conceptKey: string | null; objectiveKey: string | null } | null | undefined = null;
      if (codeHash !== null) {
        codeHit = await db.query.questions.findFirst({
          where: and(
            eq(questions.topicId, topicId),
            eq(questions.codeHash, codeHash),
            eq(questions.status, 'active')
          ),
          columns: { id: true, questionText: true, codeSnippet: true, conceptKey: true, objectiveKey: true },
        });
      }

      // ── LAYER 3: Concept key within topic (signal only) ──────────────────
      let conceptHit: { id: string; questionText: string; codeSnippet: string | null; conceptKey: string | null; objectiveKey: string | null } | null | undefined = null;
      if (normConcept !== null) {
        const candidateConceptRows = await db.query.questions.findMany({
          where: and(
            eq(questions.topicId, topicId),
            eq(questions.status, 'active')
          ),
          columns: { id: true, questionText: true, codeSnippet: true, conceptKey: true, objectiveKey: true },
          limit: 200,
        });
        conceptHit = candidateConceptRows.find(
          (row) => row.conceptKey !== null && row.conceptKey !== undefined && row.conceptKey.trim() !== '' &&
            normalizeConceptKey(row.conceptKey) === normConcept
        ) ?? null;
      }

      // ── LAYER 4: Objective key within topic (strong signal) ──────────────
      let objectiveHit: { id: string; questionText: string; codeSnippet: string | null; conceptKey: string | null; objectiveKey: string | null } | null | undefined = null;
      if (normObjective !== null) {
        const candidateObjectiveRows = await db.query.questions.findMany({
          where: and(
            eq(questions.topicId, topicId),
            eq(questions.status, 'active')
          ),
          columns: { id: true, questionText: true, codeSnippet: true, conceptKey: true, objectiveKey: true },
          limit: 200,
        });
        objectiveHit = candidateObjectiveRows.find(
          (row) => row.objectiveKey !== null && row.objectiveKey !== undefined && row.objectiveKey.trim() !== '' &&
            normalizeObjectiveKey(row.objectiveKey) === normObjective
        ) ?? null;
      }

      const conceptMatched = conceptHit !== null && conceptHit !== undefined;
      const codeMatched = codeHit !== null && codeHit !== undefined;
      const objectiveMatched = objectiveHit !== null && objectiveHit !== undefined;
      const matchedBase = codeHit ?? objectiveHit ?? conceptHit;

      signals.codeMatch = codeMatched;
      signals.conceptMatch = conceptMatched;
      signals.objectiveMatch = objectiveMatched;
      signals.matchedQuestionId = matchedBase?.id;
      signals.matchedQuestionText = matchedBase?.questionText;
      signals.matchedQuestionCode = matchedBase?.codeSnippet ?? undefined;
      signals.matchedConceptKey = matchedBase?.conceptKey ?? undefined;
      signals.matchedObjectiveKey = matchedBase?.objectiveKey ?? undefined;

      // ── LAYER 5: Upstash Vector semantic search (topic-scoped) ───────────
      const disposition: QuestionDisposition = await SemanticSearchService.evaluate(
        {
          questionText: candidate.questionText,
          codeSnippet: candidate.codeSnippet,
          conceptKey: candidate.conceptKey,
          objectiveKey: candidate.objectiveKey,
          type: candidate.type,
          correctAnswer: candidate.correctAnswer,
        },
        DUPLICATE_THRESHOLD,
        REVIEW_THRESHOLD,
        { topicId, status: 'active' }
      );

      signals.semanticScore = disposition.score;
      if (disposition.matchedQuestionId !== undefined && disposition.matchedQuestionId !== '') {
        signals.matchedQuestionId = disposition.matchedQuestionId;
        if (disposition.matchedQuestionText !== undefined && disposition.matchedQuestionText !== '') {
          signals.matchedQuestionText = disposition.matchedQuestionText;
        }
        if (disposition.matchedQuestionCode !== undefined && disposition.matchedQuestionCode !== '') {
          signals.matchedQuestionCode = disposition.matchedQuestionCode;
        }
        if (disposition.matchedConceptKey !== undefined && disposition.matchedConceptKey !== '') {
          signals.matchedConceptKey = disposition.matchedConceptKey;
        }
        if (disposition.matchedObjectiveKey !== undefined && disposition.matchedObjectiveKey !== '') {
          signals.matchedObjectiveKey = disposition.matchedObjectiveKey;
        }
      }

      // Code + (objective OR concept) + borderline semantic → very strong signal,
      // but let the judge decide rather than auto-rejecting.
      // This prevents edge cases where code is same but objectives differ.

      // Dispose of the semantic verdict (may be 'new' | 'review' | 'duplicate').
      if (disposition.status === 'duplicate') {
        recordCounter('duplicate_detector.verdict', 1, { verdict: 'duplicate', level: 'semantic' });
        recordTimer('duplicate_detector.duration', Date.now() - start, { outcome: 'success', level: 'semantic' });
        return {
          status: 'duplicate',
          level: 'semantic',
          reason: disposition.reason,
          similarity: disposition.score,
          signals,
        };
      }

      if (disposition.status === 'new') {
        recordCounter('duplicate_detector.verdict', 1, { verdict: 'new', level: disposition.score > 0 ? 'semantic' : 'none' });
        recordTimer('duplicate_detector.duration', Date.now() - start, { outcome: 'success', level: disposition.score > 0 ? 'semantic' : 'none' });
        return {
          status: 'new',
          level: disposition.score > 0 ? 'semantic' : 'none',
          reason: disposition.reason,
          similarity: disposition.score,
          signals,
        };
      }

      // ── LAYER 6: Borderline (0.90–0.95) — private judge ───────────────────
      const matched = matchedBase ?? (disposition.matchedQuestionId !== undefined ? {
        id: disposition.matchedQuestionId,
        questionText: signals.matchedQuestionText ?? '',
        codeSnippet: signals.matchedQuestionCode ?? null,
        conceptKey: signals.matchedConceptKey ?? null,
        objectiveKey: signals.matchedObjectiveKey ?? null,
      } : null);

      if (matched === null) {
        recordCounter('duplicate_detector.verdict', 1, { verdict: 'review', level: 'semantic' });
        recordTimer('duplicate_detector.duration', Date.now() - start, { outcome: 'success', level: 'semantic' });
        return {
          status: 'review',
          level: 'semantic',
          reason: 'semantic_review_no_match',
          similarity: disposition.score,
          signals,
        };
      }

      const judgePayload: JudgeQuestionPayload = {
        existing: {
          text: matched.questionText,
          type: candidate.type ?? 'mcq',
          concept_key: matched.conceptKey ?? candidate.conceptKey ?? undefined,
          objective_key: matched.objectiveKey ?? candidate.objectiveKey ?? undefined,
          code: matched.codeSnippet ?? candidate.codeSnippet ?? undefined,
        },
        candidate: {
          text: candidate.questionText,
          type: candidate.type ?? 'mcq',
          concept_key: candidate.conceptKey ?? undefined,
          objective_key: candidate.objectiveKey ?? undefined,
          code: candidate.codeSnippet ?? undefined,
        },
      };

      const judge = await judgeQuestion(judgePayload);

      if (!judge.available) {
        // Degradation policy: judge down → human REVIEW, never NEW.
        recordCounter('duplicate_detector.verdict', 1, { verdict: 'review', level: 'judge', reason: 'judge_unavailable' });
        recordTimer('duplicate_detector.duration', Date.now() - start, { outcome: 'success', level: 'judge' });
        return {
          status: 'review',
          level: 'judge',
          reason: judge.reason,
          similarity: disposition.score,
          signals,
          judge: {
            available: false,
            duplicate: false,
            confidence: 0,
            reason: judge.reason,
          },
        };
      }

      if (judge.duplicate) {
        recordCounter('duplicate_detector.verdict', 1, { verdict: 'duplicate', level: 'judge' });
        recordTimer('duplicate_detector.duration', Date.now() - start, { outcome: 'success', level: 'judge' });
        return {
          status: 'duplicate',
          level: 'judge',
          reason: judge.reason,
          similarity: disposition.score,
          signals,
          judge,
        };
      }

      recordCounter('duplicate_detector.verdict', 1, { verdict: 'new', level: 'judge' });
      recordTimer('duplicate_detector.duration', Date.now() - start, { outcome: 'success', level: 'judge' });
      return {
        status: 'new',
        level: 'judge',
        reason: judge.reason,
        similarity: disposition.score,
        signals,
        judge,
      };
    } catch (err) {
      logger.error({ err, topicId }, '[DuplicateDetector] Evaluation failed');
      recordCounter('duplicate_detector.failure', 1, { reason: 'internal_error' });
      recordTimer('duplicate_detector.duration', Date.now() - start, { outcome: 'failure' });

      // Fail-open would risk duplicates; fail-closed risks UX. Conservatively:
      // REVIEW so an admin decides, never silently 'new'.
      return {
        status: 'review',
        level: 'none',
        reason: err instanceof Error ? `detector_error: ${err.message}` : 'detector_error',
        signals,
      };
    }
  }
}
