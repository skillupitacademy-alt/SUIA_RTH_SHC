import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';

/**
 * Contract with the private FastAPI duplicate-judge service
 * (apps/question-judge). See apps/question-judge/app/schemas.py.
 */
export interface JudgeQuestionPayload {
  existing: {
    text: string;
    type?: string;
    concept_key?: string;
    objective_key?: string;
    code?: string;
  };
  candidate: {
    text: string;
    type?: string;
    concept_key?: string;
    objective_key?: string;
    code?: string;
  };
}

export interface JudgeSignals {
  text_similarity: number;
  code_similarity: number;
  concept_match: boolean;
  objective_match: boolean;
  type_match: boolean;
  reasoning_match: boolean;
  answer_objective_match: boolean;
}

export interface JudgeVerdict {
  /** false when the judge service is not configured/unreachable. */
  available: boolean;
  duplicate: boolean;
  confidence: number;
  reason: string;
  signals?: JudgeSignals;
}

export const JUDGE_TIMEOUT_MS = 8000;

function judgeBaseUrl(): string | null {
  const url = process.env.QUESTION_JUDGE_URL;
  if (typeof url !== 'string' || url.trim() === '') return null;
  return url.trim().replace(/\/+$/, '');
}

function judgeEnabled(): boolean {
  return process.env.QUESTION_JUDGE_ENABLED !== 'false';
}

function sharedSecret(): string | null {
  const secret = process.env.QUESTION_JUDGE_SHARED_SECRET;
  return typeof secret === 'string' && secret.trim() !== '' ? secret.trim() : null;
}

/**
 * Client for the private FastAPI question judge.
 *
 * Degradation policy (critical):
 *   - Judge not configured            → { available: false }
 *   - Judge unreachable / timeout     → { available: false }
 *   - Malformed response              → { available: false }
 *
 * The CALLER must treat `available: false` in the 0.90–0.95 band as REVIEW,
 * never as NEW. An infrastructure failure must never silently allow duplicates.
 */
export async function judgeQuestion(payload: JudgeQuestionPayload): Promise<JudgeVerdict> {
  const baseUrl = judgeBaseUrl();
  if (baseUrl === null || !judgeEnabled()) {
    return { available: false, duplicate: false, confidence: 0, reason: 'judge_not_configured' };
  }

  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JUDGE_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const secret = sharedSecret();
    if (secret !== null) {
      headers['X-Judge-Secret'] = secret;
    }

    const response = await fetch(`${baseUrl}/judge/question`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      logger.warn({ status: response.status, baseUrl }, '[QuestionJudge] Non-2xx response from judge service');
      recordCounter('question_judge.request.failure', 1, { reason: `http_${response.status}` });
      recordTimer('question_judge.request.duration', Date.now() - start, { outcome: 'failure' });
      return { available: false, duplicate: false, confidence: 0, reason: `judge_http_${response.status}` };
    }

    const body = (await response.json()) as Partial<JudgeVerdict> | null;

    if (body === null || typeof body !== 'object' || typeof body.duplicate !== 'boolean' || typeof body.confidence !== 'number') {
      logger.error({ body }, '[QuestionJudge] Malformed judge response');
      recordCounter('question_judge.request.failure', 1, { reason: 'malformed_response' });
      recordTimer('question_judge.request.duration', Date.now() - start, { outcome: 'failure' });
      return { available: false, duplicate: false, confidence: 0, reason: 'judge_malformed_response' };
    }

    recordCounter('question_judge.request.success', 1, { duplicate: String(body.duplicate) });
    recordTimer('question_judge.request.duration', Date.now() - start, { outcome: 'success' });

    return {
      available: true,
      duplicate: body.duplicate === true,
      confidence: Math.max(0, Math.min(1, body.confidence)),
      reason: typeof body.reason === 'string' && body.reason !== '' ? body.reason : 'AI judge determined the verdict.',
      signals: body.signals,
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    logger.warn({ err, baseUrl }, isAbort ? '[QuestionJudge] Judge request timed out' : '[QuestionJudge] Judge service unreachable');
    recordCounter('question_judge.request.failure', 1, { reason: isAbort ? 'timeout' : 'network_error' });
    recordTimer('question_judge.request.duration', Date.now() - start, { outcome: 'failure' });
    return { available: false, duplicate: false, confidence: 0, reason: isAbort ? 'judge_timeout' : 'judge_unreachable' };
  } finally {
    clearTimeout(timeout);
  }
}
